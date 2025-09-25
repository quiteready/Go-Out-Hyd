"""
Image processing service for RAG processor.

Handles image analysis and description generation using Google GenAI.
"""

import asyncio

# Import for type annotation
from typing import TYPE_CHECKING, Any

import google.genai as genai
import structlog

from ..config import config
from ..models.image_analysis_models import ImageAnalysisError
from ..services.genai_utils import create_file_manager
from ..utils.retry_utils import NonRetryableError
from ..utils.token_utils import (
    create_google_tokenizer,
    truncate_text_to_tokens,
)

if TYPE_CHECKING:
    from ..services.database_service import ChunkData

logger = structlog.get_logger(__name__)


class ImageProcessingService:
    """Service for processing images using Google GenAI with multimodal capabilities."""

    def __init__(
        self,
        project_id: str | None = None,
        location: str | None = None,
        model_name: str = "gemini-2.5-flash",
        timeout_seconds: int = 30,
    ):
        """
        Initialize the image analysis service.

        Args:
            project_id: Google Cloud project ID. If None, will use GOOGLE_CLOUD_PROJECT_ID env var.
            location: Google Cloud location for Vertex AI.
            model_name: The Gemini model to use for analysis.
            timeout_seconds: Timeout for API requests.
        """
        self.project_id = project_id or config.PROJECT_ID
        if not self.project_id:
            raise NonRetryableError("Google Cloud project ID is required")

        self.location = location or config.VERTEX_AI_LOCATION
        self.model_name = model_name
        self.timeout_seconds = timeout_seconds

        # Initialize GenAI client for image analysis using API key
        self.genai_client = genai.Client(
            vertexai=False,
            api_key=config.GEMINI_API_KEY,
        )

        # Initialize file manager for GenAI file operations
        self.file_manager = create_file_manager(self.genai_client)

        logger.info(
            "ImageProcessingService initialized",
            project_id=self.project_id,
            location=self.location,
            model=model_name,
            timeout_seconds=timeout_seconds,
        )

    def _truncate_utf8_safe(self, text: str, max_bytes: int) -> str:
        """
        Truncate text to fit within max UTF-8 bytes without breaking multi-byte characters.

        Args:
            text: Text to truncate
            max_bytes: Maximum number of UTF-8 bytes allowed

        Returns:
            Truncated text that fits within max_bytes when encoded as UTF-8
        """
        if not text:
            return text

        # If text is already within limit, return as-is
        encoded = text.encode("utf-8")
        if len(encoded) <= max_bytes:
            return text

        # Binary search for the longest prefix that fits
        left, right = 0, len(text)
        result = ""

        while left <= right:
            mid = (left + right) // 2
            candidate = text[:mid]

            try:
                candidate_bytes = candidate.encode("utf-8")
                if len(candidate_bytes) <= max_bytes:
                    result = candidate
                    left = mid + 1
                else:
                    right = mid - 1
            except UnicodeEncodeError:
                # This shouldn't happen with proper Unicode strings, but handle gracefully
                right = mid - 1

        return result

    async def analyze_image(
        self,
        image_path: str,
        filename: str,
        gcs_path: str,
        contextual_text: str | None = None,
    ) -> "ChunkData":
        """
        Analyze an image and return complete ChunkData with both text and multimodal embeddings.

        Args:
            image_path: Path to the image file
            filename: Original filename for metadata
            gcs_path: GCS path for metadata
            contextual_text: Optional context about the image

        Returns:
            ChunkData: Complete chunk with content, metadata, and both embeddings
        """
        try:
            logger.info(
                "Starting comprehensive image analysis with dual embeddings",
                image_path=image_path,
                filename=filename,
            )

            # Determine mime type based on file extension
            mime_type = self._get_image_mime_type(image_path)

            # Upload image and wait for it to be ready using the file manager
            genai_file = await self.file_manager.upload_and_wait(
                image_path, mime_type=mime_type
            )

            try:
                # Analyze image for comprehensive content
                logger.debug("Making comprehensive image analysis API call")

                content = await self._analyze_comprehensive(genai_file, contextual_text)

                logger.info(
                    "Comprehensive image analysis completed successfully",
                    image_path=image_path,
                    content_bytes=len(content.encode("utf-8")),
                    content_chars=len(content),
                )

                # Generate both embeddings in parallel
                logger.debug("Generating text and multimodal embeddings in parallel")

                text_embedding_task = self.generate_text_embedding_for_content(content)
                multimodal_embedding_task = self._generate_multimodal_embedding(
                    image_path
                )

                text_embedding, multimodal_embedding = await asyncio.gather(
                    text_embedding_task, multimodal_embedding_task
                )

                logger.info(
                    "Image analysis with dual embeddings completed",
                    image_path=image_path,
                    text_embedding_dimension=len(text_embedding),
                    multimodal_embedding_dimension=len(multimodal_embedding),
                )

                # Create metadata
                from ..models.metadata_models import create_image_metadata

                metadata = create_image_metadata(
                    filename=filename,
                    media_path=gcs_path,
                    contextual_text=content,  # Use comprehensive content for metadata
                )

                # Import ChunkData for return type
                from ..services.database_service import ChunkData

                # Create and return complete ChunkData
                chunk_data = ChunkData(
                    text=content,
                    metadata=metadata,
                    context=None,  # No longer generating context
                    text_embedding=text_embedding,
                    multimodal_embedding=multimodal_embedding,
                )

                return chunk_data

            finally:
                # Always clean up the uploaded file using file manager
                await self.file_manager.cleanup_file(genai_file)

        except Exception as e:
            error_msg = str(e)
            is_rate_limit = self._is_rate_limit_error(e)

            logger.error(
                "Image analysis failed",
                image_path=image_path,
                filename=filename,
                error=error_msg,
                error_type=type(e).__name__,
                is_rate_limit=is_rate_limit,
            )

            if is_rate_limit:
                raise ImageAnalysisError(
                    f"Image analysis failed due to API rate limiting: {error_msg}. "
                    "This indicates API quota exhaustion - check your Gemini API usage limits."
                ) from e
            else:
                raise ImageAnalysisError(f"Analysis failed: {error_msg}") from e

    def _get_image_mime_type(self, image_path: str) -> str:
        """
        Determine the MIME type of an image using centralized router.

        Args:
            image_path: Path to the image file

        Returns:
            MIME type string for the image
        """
        from ..utils.content_router import get_content_router

        content_router = get_content_router()
        mime_type = content_router.get_mime_type_for_extension(image_path)

        # Default to JPEG if not found
        return mime_type or "image/jpeg"

    def _create_comprehensive_image_analysis_prompt(
        self, contextual_text: str | None = None
    ) -> str:
        """
        Create a comprehensive prompt for detailed image analysis.

        Args:
            contextual_text: Optional context about the image

        Returns:
            Formatted prompt for comprehensive image analysis
        """
        context_section = ""
        if contextual_text:
            context_section = f"""
            **PROVIDED CONTEXT:**
            {contextual_text}
            """

        return f"""Analyze this image comprehensively and provide detailed context for image search and understanding. Examine every visual element carefully and describe what you see with specific, searchable information.

            {context_section}

            **COMPREHENSIVE ANALYSIS REQUIRED:**

            1. **VISUAL CONTENT INVENTORY:**
            - All text visible in the image (signs, labels, captions, documents, handwriting, printed text)
            - People (number, age groups, clothing, activities, expressions, poses)
            - Objects and items (furniture, tools, devices, vehicles, food, animals, plants)
            - Settings and environments (indoor/outdoor, rooms, landscapes, buildings, weather)
            - Colors, lighting, and visual style (dominant colors, lighting conditions, artistic style, mood)

            2. **TEXT AND READABLE CONTENT:**
            - Exact transcription of any readable text (even partial or blurry text)
            - Signs, posters, book titles, screen content, labels, or captions
            - Brand names, logos, or identifying marks visible
            - Numbers, dates, prices, or measurements shown
            - Languages used (if text is in non-English languages, note the language)

            3. **SCENE AND CONTEXT:**
            - Type of image (photograph, screenshot, artwork, diagram, document, etc.)
            - Setting or location (home, office, outdoors, restaurant, store, etc.)
            - Time indicators (day/night, season, era/time period if apparent)
            - Activities or events taking place
            - Mood, atmosphere, or emotional tone of the image

            4. **SPECIFIC DETAILS:**
            - Notable features, unique elements, or distinguishing characteristics
            - Spatial relationships and composition (what's in foreground/background)
            - Quality and style (professional photo, casual snapshot, artistic, technical diagram)
            - Any specialized content (medical, scientific, educational, entertainment, etc.)
            - Cultural or regional elements visible

            5. **SEARCHABLE ELEMENTS:**
            - Key concepts someone might search for to find this image
            - Specific names, places, events, or topics depicted
            - Categories this image would fit into (family photo, recipe, tutorial, meme, etc.)
            - Descriptive keywords that capture the essence and details

            **OUTPUT FORMAT:**
            Main Description: [Clear, comprehensive description of what the image shows]
            Text Content: [Exact transcription of any visible text, or "No readable text" if none]
            Setting and Context: [Where/when this appears to be taken and what's happening]
            Notable Details: [Specific, unique, or important elements that stand out]
            Search Keywords: [Terms and phrases that would help someone find this image]

            **OUTPUT REQUIREMENTS:**
            Be thorough and comprehensive while focusing on what's actually visible. Include exact text transcriptions,
            specific details about people/objects/settings, and descriptive keywords. This analysis will be used for
            precise image search and retrieval in a knowledge base system through text-based embeddings.

            Prioritize searchable content: specific text content, technical details, unique identifiers, and distinctive
            features that would help someone find this image through text queries. The more detailed and specific you are,
            the better the search results will be.
        """

    async def _analyze_comprehensive(
        self, genai_file: Any, contextual_text: str | None = None
    ) -> str:
        """
        Analyze image for comprehensive content using the uploaded GenAI file.

        Args:
            genai_file: Already uploaded GenAI file object
            contextual_text: Optional context about the image

        Returns:
            Comprehensive content text (will be token-chunked for text embeddings)
        """
        try:
            # Create comprehensive prompt
            prompt = self._create_comprehensive_image_analysis_prompt(contextual_text)

            # Get comprehensive analysis from GenAI
            response = await self.genai_client.aio.models.generate_content(
                model=self.model_name,
                contents=[prompt, genai_file],  # type: ignore[arg-type]
            )

            content = (response.text or "").strip()

            logger.info(
                "Comprehensive analysis completed",
                content_length=len(content),
                content_bytes=len(content.encode("utf-8")),
            )

            return content

        except Exception as e:
            logger.error(
                "Comprehensive analysis failed",
                error=str(e),
                error_type=type(e).__name__,
            )
            # Re-raise as the calling method will handle the overall error
            raise

    async def _generate_multimodal_embedding(self, image_path: str) -> list[float]:
        """
        Generate multimodal embedding for the image using only visual content.

        Args:
            image_path: Path to the image file

        Returns:
            Multimodal embedding vector
        """
        try:
            # Import embedding service
            from .embedding_service import get_embedding_service

            embedding_service = get_embedding_service(self.project_id)

            # Generate multimodal embedding with no contextual text (pure visual)
            multimodal_embedding = (
                await embedding_service.generate_multimodal_embedding(
                    media_file_path=image_path,
                    contextual_text="",  # Empty string for pure visual embedding
                )
            )

            logger.info(
                "Multimodal embedding generated successfully",
                embedding_dimension=len(multimodal_embedding),
                image_path=image_path,
            )

            return multimodal_embedding

        except Exception as e:
            error_msg = str(e)
            is_rate_limit = self._is_rate_limit_error(e)

            logger.error(
                "Multimodal embedding generation failed",
                image_path=image_path,
                error=error_msg,
                error_type=type(e).__name__,
                is_rate_limit=is_rate_limit,
            )

            if is_rate_limit:
                raise ImageAnalysisError(
                    f"Multimodal embedding generation failed due to API rate limiting: {error_msg}. "
                    "This indicates API quota exhaustion - check your Vertex AI usage limits."
                ) from e
            else:
                raise ImageAnalysisError(
                    f"Multimodal embedding generation failed: {error_msg}"
                ) from e

    async def generate_text_embedding_for_content(
        self, content: str, project_id: str | None = None
    ) -> list[float]:
        """
        Generate text embedding for content using token-aware truncation.

        Args:
            content: Comprehensive content text from image analysis
            project_id: Google Cloud project ID

        Returns:
            Single text embedding vector

        Raises:
            ImageAnalysisError: If text embedding generation fails
        """
        try:
            if not content.strip():
                logger.warning("Empty content provided for text embedding generation")
                return []

            # Import and get embedding service
            from .embedding_service import get_embedding_service

            embedding_service = get_embedding_service(project_id or self.project_id)

            # Create tokenizer for truncation
            tokenizer = create_google_tokenizer(embedding_service.genai_client)

            # Truncate content to fit within token limit (2047 tokens for text-embedding-004)
            truncated_content = truncate_text_to_tokens(
                text=content,
                tokenizer=tokenizer,
                max_tokens=2047,  # Leave 1 token buffer for safety
            )

            logger.info(
                "Content truncated for text embedding",
                original_length=len(content),
                truncated_length=len(truncated_content),
                original_tokens=tokenizer.count_tokens(content),
                truncated_tokens=tokenizer.count_tokens(truncated_content),
            )

            # Generate text embedding for the truncated content
            text_embedding = await embedding_service.generate_text_embedding(
                truncated_content
            )

            logger.info(
                "Text embedding generated successfully",
                embedding_dimension=len(text_embedding),
                content_length=len(truncated_content),
            )

            return text_embedding

        except Exception as e:
            error_msg = str(e)
            is_rate_limit = self._is_rate_limit_error(e)

            logger.error(
                "Text embedding generation failed",
                content_length=len(content),
                error=error_msg,
                error_type=type(e).__name__,
                is_rate_limit=is_rate_limit,
            )

            if is_rate_limit:
                raise ImageAnalysisError(
                    f"Text embedding generation failed due to API rate limiting: {error_msg}. "
                    "This indicates API quota exhaustion - check your Google AI API usage limits."
                ) from e
            else:
                raise ImageAnalysisError(
                    f"Text embedding generation failed: {error_msg}"
                ) from e

    def _is_rate_limit_error(self, exception: Exception) -> bool:
        """Check if an exception is due to rate limiting."""
        error_msg = str(exception).lower()
        return (
            "429" in error_msg
            or "resource_exhausted" in error_msg
            or "quota" in error_msg
            or "rate limit" in error_msg
            or "too many requests" in error_msg
        )


# Global service instance
_image_processing_service: ImageProcessingService | None = None


def get_image_processing_service(
    project_id: str | None = None,
    location: str | None = None,
    model_name: str = "gemini-2.5-flash",
    timeout_seconds: int = 30,
) -> ImageProcessingService:
    """Get the global image processing service instance."""
    global _image_processing_service
    if _image_processing_service is None:
        _image_processing_service = ImageProcessingService(
            project_id=project_id,
            location=location,
            model_name=model_name,
            timeout_seconds=timeout_seconds,
        )
    return _image_processing_service
