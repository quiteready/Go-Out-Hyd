"""
Audio processing service for handling audio files with transcription.

Handles audio transcription, embedding generation, and storage
with proper error handling and optimized workflow.
"""

import asyncio
import math
import subprocess
from pathlib import Path
from typing import Any

import structlog

from ..audio_transcription import AudioTranscriptionService
from ..config import config
from ..models.metadata_models import AudioChunkMetadata, TranscriptMetadata
from ..utils.retry_utils import (
    JobCancelledError,
    NonRetryableError,
    RetryConfig,
    retry_genai_operation,
)
from ..utils.token_utils import create_google_tokenizer, truncate_text_to_tokens
from .database_service import ChunkData, get_database_service
from .embedding_service import get_embedding_service

logger = structlog.get_logger(__name__)


class AudioProcessingServiceError(NonRetryableError):
    """Base exception for audio processing service errors."""

    pass


class AudioProcessingService:
    """
    Service for processing audio files.

    Handles audio transcription, embedding generation, and storage
    using the existing AudioTranscriptionService and text embedding models.
    """

    def __init__(
        self,
        max_chunk_duration: int = 300,  # 5 minutes
        chunk_size: int = 60,  # 1 minute per segment
        project_id: str | None = None,
    ):
        """
        Initialize the audio processing service.

        Args:
            max_chunk_duration: Maximum duration in seconds before chunking
            chunk_size: Size of each chunk in seconds
            project_id: Google Cloud project ID
        """
        self.max_chunk_duration = max_chunk_duration
        self.chunk_size = chunk_size

        # Initialize dependencies
        self.embedding_service = get_embedding_service(project_id)
        self.database_service = get_database_service(project_id)

        # Initialize the existing audio transcription service
        self.transcription_service = AudioTranscriptionService()

        # Initialize tokenizer for transcript text chunking
        self.tokenizer = create_google_tokenizer(
            genai_client=self.embedding_service.genai_client
        )

        # Initialize retry configuration for AI API calls
        self.retry_config = RetryConfig(
            max_attempts=3,  # Retry failed AI calls up to 3 times
            base_delay=2.0,  # Start with 2 second delay
            max_delay=30.0,  # Cap delay at 30 seconds
            exponential_backoff=True,  # Use exponential backoff
            jitter=True,  # Add jitter to prevent thundering herd
        )

        logger.info(
            "Audio processing service initialized",
            max_chunk_duration=max_chunk_duration,
            chunk_size=chunk_size,
            chunk_duration_seconds=config.AUDIO_CHUNK_DURATION_SECONDS,
            project_id=project_id,
            retry_max_attempts=self.retry_config.max_attempts,
        )

    def create_audio_chunk(
        self,
        audio_path: str,
        start_sec: float,
        end_sec: float,
        chunk_index: int,
    ) -> str:
        """
        Create an audio chunk file using ffmpeg.

        Args:
            audio_path: Path to the original audio file
            start_sec: Start time in seconds
            end_sec: End time in seconds
            chunk_index: Index of the chunk

        Returns:
            Path to the created chunk file

        Raises:
            AudioProcessingServiceError: If chunk creation fails
        """
        try:
            audio_dir = Path(audio_path).parent
            audio_name = Path(audio_path).stem
            chunk_file = audio_dir / f"{audio_name}_chunk_{chunk_index:03d}.mp3"
            duration = end_sec - start_sec

            logger.debug(
                "Creating audio chunk",
                chunk_index=chunk_index,
                start_sec=start_sec,
                end_sec=end_sec,
                duration=duration,
                output_file=str(chunk_file),
            )

            # Use ffmpeg to create audio chunk
            subprocess.run(
                [
                    "ffmpeg",
                    "-i",
                    audio_path,
                    "-ss",
                    str(start_sec),  # Start time
                    "-t",
                    str(duration),  # Duration (not end time)
                    "-c:a",
                    "libmp3lame",  # MP3 codec
                    "-ar",
                    "16000",  # 16kHz sample rate for compatibility
                    "-ac",
                    "1",  # Mono channel
                    "-y",  # Overwrite output file
                    str(chunk_file),
                ],
                capture_output=True,
                text=True,
                check=True,
            )

            logger.debug(
                "Audio chunk created successfully",
                chunk_file=str(chunk_file),
                chunk_index=chunk_index,
                file_size_mb=round(chunk_file.stat().st_size / (1024 * 1024), 2),
            )

            return str(chunk_file)

        except subprocess.CalledProcessError as e:
            logger.error(
                "Failed to create audio chunk",
                audio_path=audio_path,
                start_sec=start_sec,
                end_sec=end_sec,
                chunk_index=chunk_index,
                error=str(e),
                stderr=e.stderr,
            )
            raise AudioProcessingServiceError(
                f"Audio chunk creation failed: {e}"
            ) from e

    async def _process_chunks(
        self,
        audio_path: str,
        duration: float,
        contextual_text: str = "",
        job_id: str | None = None,
    ) -> list[ChunkData]:
        """
        Process audio into chunks sequentially.

        Sequential processing prevents file locking conflicts and reduces
        peak memory usage by processing one chunk completely before starting the next.

        Args:
            audio_path: Path to the audio file
            duration: Audio duration in seconds
            contextual_text: Contextual text for embedding
            job_id: Optional job ID for progress tracking

        Returns:
            List of processed chunks ready for storage

        Raises:
            AudioProcessingServiceError: If no chunks are successfully processed
        """
        chunks = []
        total_chunks = math.ceil(duration / config.AUDIO_CHUNK_DURATION_SECONDS)

        # Update stage: creating audio chunks
        if job_id:
            await self.database_service.update_processing_stage(
                job_id, "creating_audio_chunks"
            )

        logger.info(
            "Starting sequential audio chunk processing",
            audio_path=audio_path,
            total_chunks=total_chunks,
            duration_seconds=duration,
            chunk_duration_seconds=config.AUDIO_CHUNK_DURATION_SECONDS,
        )

        # Process chunks sequentially with timeout protection and fail-fast logic
        chunk_index = 0
        failed_chunks = 0
        max_failed_chunks = int(
            total_chunks * config.AUDIO_SUCCESS_THRESHOLD
        )  # Configurable success threshold (0.0 = fail-fast)

        for start_sec in range(0, int(duration), config.AUDIO_CHUNK_DURATION_SECONDS):
            end_sec = min(start_sec + config.AUDIO_CHUNK_DURATION_SECONDS, duration)

            try:
                logger.debug(
                    "Processing audio chunk sequentially",
                    chunk_index=chunk_index + 1,
                    total_chunks=total_chunks,
                    start_sec=start_sec,
                    end_sec=end_sec,
                )

                # Process single chunk with timeout protection (2 minutes per chunk)
                chunk_data = await asyncio.wait_for(
                    self._process_single_chunk(
                        audio_path=audio_path,
                        start_sec=float(start_sec),
                        end_sec=end_sec,
                        chunk_index=chunk_index,
                        total_chunks=total_chunks,
                        contextual_text=contextual_text,
                        job_id=job_id,
                    ),
                    timeout=120.0,  # 2 minute timeout per chunk
                )

                chunks.append(chunk_data)

                logger.debug(
                    "Successfully processed audio segment",
                    segment_index=chunk_index + 1,
                    total_segments=total_chunks,
                    total_chunks_completed=len(chunks),
                )

            except (asyncio.TimeoutError, Exception) as e:
                failed_chunks += 1
                error_type = (
                    "timeout"
                    if isinstance(e, asyncio.TimeoutError)
                    else "processing error"
                )

                logger.error(
                    f"Failed to process audio chunk ({error_type})",
                    audio_path=audio_path,
                    start_sec=start_sec,
                    end_sec=end_sec,
                    chunk_index=chunk_index,
                    job_id=job_id,
                    failed_chunks=failed_chunks,
                    max_allowed_failures=max_failed_chunks,
                    error=str(e),
                )

                # Fail-fast logic: fail entire audio if too many chunks fail
                if failed_chunks > max_failed_chunks:
                    raise NonRetryableError(
                        f"Too many audio chunks failed: {failed_chunks}/{total_chunks}. "
                        f"Audio processing cannot continue."
                    ) from e

                # Continue with other chunks if still within failure threshold
                continue

            chunk_index += 1

        # Ensure we processed at least some chunks
        if not chunks:
            raise AudioProcessingServiceError("No chunks were successfully processed")

        logger.info(
            "Sequential audio chunk processing completed",
            audio_path=audio_path,
            chunks_processed=len(chunks),
            total_chunks=total_chunks,
        )

        return chunks

    async def _process_single_chunk(
        self,
        audio_path: str,
        start_sec: float,
        end_sec: float,
        chunk_index: int,
        total_chunks: int,
        contextual_text: str,
        job_id: str | None = None,
    ) -> ChunkData:
        """
        Process a single audio chunk completely with transcript truncation for token limits.

        Args:
            audio_path: Path to the original audio file
            start_sec: Start time of chunk in seconds
            end_sec: End time of chunk in seconds
            chunk_index: Index of this chunk
            total_chunks: Total number of chunks
            contextual_text: Contextual text for embedding
            job_id: Optional job ID for progress tracking

        Returns:
            Single ChunkData object with truncated transcript if needed

        Raises:
            AudioProcessingServiceError: If chunk processing fails
        """
        # Update stage with progress
        if job_id:
            await self.database_service.update_processing_stage(
                job_id, f"processing_chunk_{chunk_index + 1}_of_{total_chunks}"
            )

        # Create physical chunk file
        chunk_file = self.create_audio_chunk(
            audio_path, start_sec, end_sec, chunk_index
        )

        try:
            logger.debug(
                "Starting audio chunk transcription",
                chunk_file=chunk_file,
                start_sec=start_sec,
                end_sec=end_sec,
            )

            # Use the existing AudioTranscriptionService to transcribe the chunk with retry
            transcription_result = await self._transcribe_audio_with_retry(
                audio_path=chunk_file,
                language_hint=config.AUDIO_DEFAULT_LANGUAGE,
            )

            # Extract transcript text for text embedding
            transcript_text = transcription_result.get("text", "").strip()

            # Handle silent audio segments (no transcript text)
            if not transcript_text:
                logger.info(
                    "Silent audio segment - skipping text embedding",
                    audio_segment=f"{start_sec:.1f}s-{end_sec:.1f}s",
                )
                truncated_transcript = ""  # Empty text for silent segment
                text_embedding = None  # No text embedding for silent segment
            else:
                # Truncate transcript text if it exceeds token limits
                truncated_transcript = truncate_text_to_tokens(
                    text=transcript_text, tokenizer=self.tokenizer, max_tokens=2047
                )

                logger.info(
                    "Processing audio transcript with truncation",
                    audio_segment=f"{start_sec:.1f}s-{end_sec:.1f}s",
                    original_transcript_tokens=self.tokenizer.count_tokens(
                        transcript_text
                    ),
                    truncated_transcript_tokens=self.tokenizer.count_tokens(
                        truncated_transcript
                    ),
                    original_char_length=len(transcript_text),
                    truncated_char_length=len(truncated_transcript),
                )

                # Generate text embedding for truncated transcript
                text_embedding = await self.embedding_service.generate_text_embedding(
                    truncated_transcript
                )

            # Create chunk metadata
            metadata = self._create_chunk_metadata(
                audio_path=audio_path,
                contextual_text=contextual_text,
                chunk_index=chunk_index,
                start_sec=start_sec,
                end_sec=end_sec,
                total_chunks=total_chunks,
                transcript_data=transcription_result,
            )

            # Create single ChunkData for this audio segment
            chunk_text = (
                truncated_transcript
                if transcript_text
                else f"Silent audio segment {start_sec:.1f}s-{end_sec:.1f}s"
            )

            return ChunkData(
                text=chunk_text,
                metadata=metadata,
                context=None,  # Audio chunks don't have context like video
                text_embedding=text_embedding,  # None for silent segments
                multimodal_embedding=None,  # Audio files don't have multimodal embeddings
            )

        finally:
            # Always clean up temporary chunk file
            from ..utils.gcs_utils import cleanup_temp_file

            cleanup_temp_file(Path(chunk_file))

    def _create_chunk_metadata(
        self,
        audio_path: str,
        contextual_text: str,
        chunk_index: int,
        start_sec: float,
        end_sec: float,
        total_chunks: int,
        transcript_data: dict[str, Any],
    ) -> AudioChunkMetadata:
        """
        Create metadata for an audio chunk.

        Args:
            audio_path: Path to the original audio file
            contextual_text: Contextual text for embedding
            chunk_index: Index of this chunk
            start_sec: Start time of chunk in seconds
            end_sec: End time of chunk in seconds
            total_chunks: Total number of chunks
            transcript_data: Transcription results

        Returns:
            AudioChunkMetadata object
        """
        return AudioChunkMetadata(
            media_path=audio_path,
            contextual_text=contextual_text,
            segment_index=chunk_index,
            start_offset_sec=start_sec,
            end_offset_sec=end_sec,
            duration_sec=end_sec - start_sec,
            total_segments=total_chunks,
            transcript=TranscriptMetadata(
                language=transcript_data.get("language", config.AUDIO_DEFAULT_LANGUAGE),
                model=transcript_data.get("model", "gemini-2.5-flash"),
                transcript_timestamp=transcript_data.get("transcript_timestamp", ""),
                has_audio=bool(transcript_data.get("text", "").strip()),
                error=transcript_data.get("error"),
            ),
        )

    async def _transcribe_audio_with_retry(
        self,
        audio_path: str,
        language_hint: str,
    ) -> dict[str, Any]:
        """
        Transcribe audio with retry logic.

        Args:
            audio_path: Path to the audio file
            language_hint: Language hint for transcription

        Returns:
            Transcription data with text and metadata

        Raises:
            AudioProcessingServiceError: If transcription fails after all retries
        """

        async def _transcribe_operation() -> dict[str, Any]:
            return await self.transcription_service.transcribe_audio_with_genai(
                audio_path=audio_path,
                language_hint=language_hint,
            )

        try:
            return await retry_genai_operation(
                func=_transcribe_operation,
                operation_name=f"transcribe_audio({Path(audio_path).name})",
            )
        except Exception as e:
            logger.error(
                "Audio transcription failed after all retries",
                audio_path=audio_path,
                language_hint=language_hint,
                error=str(e),
                error_type=type(e).__name__,
            )
            raise AudioProcessingServiceError(
                f"Audio transcription failed: {str(e)}"
            ) from e

    async def process_audio_file(
        self,
        audio_path: str,
        user_id: str,
        document_id: str | None = None,
        contextual_text: str = "",
        job_id: str | None = None,
    ) -> list[ChunkData]:
        """
        Process a complete audio file.

        Args:
            audio_path: Path to the audio file
            user_id: ID of the user who owns the audio
            document_id: Optional document ID to associate chunks with
            contextual_text: Optional contextual text for embedding
            job_id: Optional job ID for stage tracking

        Returns:
            List of processed chunks ready for storage

        Raises:
            AudioProcessingServiceError: If processing fails
        """
        logger.info(
            "Starting audio processing",
            audio_path=audio_path,
            user_id=user_id,
            document_id=document_id,
            job_id=job_id,
        )

        try:
            # Update stage: analyzing audio
            if job_id:
                await self.database_service.update_processing_stage(
                    job_id, "analyzing_audio"
                )

            # Get audio duration using the transcription service's helper method
            audio_duration = await self.transcription_service.get_audio_duration(
                audio_path
            )

            logger.info(
                "Audio file analysis complete",
                audio_path=audio_path,
                duration_seconds=audio_duration,
                chunk_duration_threshold=config.AUDIO_CHUNK_DURATION_SECONDS,
                will_chunk=audio_duration > config.AUDIO_CHUNK_DURATION_SECONDS,
            )

            # Check if audio needs to be chunked
            if audio_duration > config.AUDIO_CHUNK_DURATION_SECONDS:
                # Process as chunks for long audio files
                chunks = await self._process_chunks(
                    audio_path=audio_path,
                    duration=audio_duration,
                    contextual_text=contextual_text,
                    job_id=job_id,
                )
                return chunks

            # Process as single chunk for short audio files (existing logic below)
            # Update stage: transcribing audio
            if job_id:
                await self.database_service.update_processing_stage(
                    job_id, "transcribing_audio"
                )

            # Use the existing AudioTranscriptionService to transcribe the audio
            transcription_result = await self._transcribe_audio_with_retry(
                audio_path=audio_path,
                language_hint=config.AUDIO_DEFAULT_LANGUAGE,
            )

            # Extract transcript text and metadata
            transcript_text = transcription_result.get("text", "").strip()

            # Handle silent audio files (no transcript text)
            if not transcript_text:
                logger.info(
                    "Silent audio file - creating chunk without text embedding",
                    audio_path=audio_path,
                    job_id=job_id,
                )

                # Create metadata for silent audio
                metadata = AudioChunkMetadata(
                    media_path=audio_path,
                    contextual_text=contextual_text,
                    segment_index=0,
                    start_offset_sec=0.0,
                    end_offset_sec=audio_duration,
                    duration_sec=audio_duration,
                    total_segments=1,
                    transcript=TranscriptMetadata(
                        language="unknown",
                        model=transcription_result.get("model", "vertex-ai"),
                        transcript_timestamp=transcription_result.get(
                            "transcript_timestamp", ""
                        ),
                        has_audio=False,  # No audio content detected
                        error=transcription_result.get("error"),
                    ),
                )

                # Create ChunkData for silent audio file
                chunk_data = ChunkData(
                    text=f"Silent audio file: {Path(audio_path).stem}",
                    metadata=metadata,
                    context=None,
                    text_embedding=None,  # No text embedding for silent audio
                    multimodal_embedding=None,  # Audio files don't have multimodal embeddings
                )

                return [chunk_data]

            # Truncate transcript text if it exceeds token limits (simple approach)
            truncated_transcript = truncate_text_to_tokens(
                text=transcript_text, tokenizer=self.tokenizer, max_tokens=2047
            )

            logger.info(
                "Processing audio transcript with truncation",
                audio_path=audio_path,
                original_transcript_tokens=self.tokenizer.count_tokens(transcript_text),
                truncated_transcript_tokens=self.tokenizer.count_tokens(
                    truncated_transcript
                ),
                original_char_length=len(transcript_text),
                truncated_char_length=len(truncated_transcript),
            )

            # Generate text embedding for truncated transcript
            embedding = await self.embedding_service.generate_text_embedding(
                text=truncated_transcript,
            )

            # Create metadata for the audio file
            metadata = AudioChunkMetadata(
                media_path=audio_path,
                contextual_text=contextual_text,
                segment_index=0,
                start_offset_sec=0.0,
                end_offset_sec=audio_duration,
                duration_sec=audio_duration,
                total_segments=1,  # Single chunk for entire audio file
                transcript=TranscriptMetadata(
                    language=transcription_result.get("language", "en-US"),
                    model=transcription_result.get("model", "vertex-ai"),
                    transcript_timestamp=transcription_result.get(
                        "transcript_timestamp", ""
                    ),
                    has_audio=len(transcript_text) > 0,
                    error=transcription_result.get("error"),
                ),
            )

            # Create single ChunkData for the audio file
            chunk_data = ChunkData(
                text=truncated_transcript,
                metadata=metadata,
                context=None,
                text_embedding=embedding,
                multimodal_embedding=None,  # Audio files don't have multimodal embeddings
            )

            logger.info(
                "Audio processing completed",
                audio_path=audio_path,
                job_id=job_id,
                original_transcript_length=len(transcript_text),
                truncated_transcript_length=len(truncated_transcript),
                audio_duration=audio_duration,
                transcription_language=transcription_result.get("language", "unknown"),
            )

            return [chunk_data]

        except JobCancelledError as e:
            logger.info(
                "Audio processing cancelled - job was deleted during processing",
                audio_path=audio_path,
                user_id=user_id,
                job_id=job_id,
                error=str(e),
            )
            # Re-raise to signal cancellation to caller
            raise
        except Exception as e:
            logger.error(
                "Audio processing failed",
                audio_path=audio_path,
                user_id=user_id,
                job_id=job_id,
                error=str(e),
            )
            raise AudioProcessingServiceError(f"Audio processing failed: {e}") from e
        finally:
            # Clean up the main audio file AND any temporary files created by the transcription service
            try:
                # Clean up the main audio file that was passed to us
                from ..utils.gcs_utils import cleanup_temp_file

                cleanup_temp_file(audio_path)
                logger.debug("Cleaned up main audio file", audio_path=audio_path)

                # Clean up any additional temporary files created by the transcription service
                self.transcription_service.cleanup_temp_files()
            except Exception as cleanup_error:
                logger.warning(
                    "Failed to cleanup audio processing temp files",
                    audio_path=audio_path,
                    error=str(cleanup_error),
                )


# Global service instance
_audio_processing_service: AudioProcessingService | None = None


def get_audio_processing_service(
    project_id: str | None = None,
) -> AudioProcessingService:
    """
    Get a global audio processing service instance.

    Args:
        project_id: Google Cloud project ID

    Returns:
        AudioProcessingService instance
    """
    global _audio_processing_service

    if _audio_processing_service is None:
        _audio_processing_service = AudioProcessingService(project_id=project_id)

    return _audio_processing_service
