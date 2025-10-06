"""
Document processing service for handling document files.

Handles text extraction, chunking, embedding generation, and storage
with proper error handling and support for multiple document formats.
"""

import threading
from pathlib import Path
from typing import TypedDict

import structlog
from docling.datamodel.base_models import InputFormat
from docling.datamodel.pipeline_options import PdfPipelineOptions
from docling.document_converter import DocumentConverter, PdfFormatOption
from docling_core.transforms.chunker.hybrid_chunker import HybridChunker

from ..models.metadata_models import DocumentChunkMetadata
from ..utils.retry_utils import NonRetryableError
from ..utils.token_utils import create_google_tokenizer
from .database_service import ChunkData, get_database_service
from .embedding_service import get_embedding_service

logger = structlog.get_logger(__name__)


class ChunkWithPages(TypedDict):
    """Structure for document chunks with page information."""

    text: str
    page_numbers: list[int]


class DocumentProcessingServiceError(NonRetryableError):
    """Base exception for document processing service errors."""

    pass


class DocumentProcessingService:
    """
    Service for processing document files using offline standard Docling models with all AI features disabled.

    Handles text extraction, chunking, embedding generation, and storage
    for various document formats (PDF, DOCX, TXT, etc.) using Docling's
    document processing and chunking capabilities in text-only mode.

    Uses pre-downloaded standard Docling models included in Docker image for reliable production
    operation, with all AI features disabled (OCR, table structure, picture processing) to
    avoid model conflicts and ensure maximum performance and reliability.
    Models must be baked into the Docker container during build - no runtime downloads.

    This design ensures fastest, most reliable document processing with offline models while
    avoiding all potential AI model conflicts and dependency issues.
    """

    # Class-level cache for DocumentConverter (shared across all instances)
    _doc_converter: DocumentConverter | None = None
    _converter_lock = threading.Lock()

    def __init__(
        self,
        max_tokens: int = 2047,  # Max tokens for Google text-embedding-004
        project_id: str | None = None,
    ):
        """
        Initialize the document processing service.

        Args:
            max_tokens: Maximum tokens per text chunk (2047 for text-embedding-004)
            project_id: Google Cloud project ID
        """
        self.max_tokens = max_tokens

        # Initialize dependencies
        self.embedding_service = get_embedding_service(project_id)
        self.database_service = get_database_service(project_id)

        # Initialize Docling components (using cached converter)
        self.doc_converter = self._get_or_create_document_converter()
        self.tokenizer = create_google_tokenizer(
            genai_client=self.embedding_service.genai_client
        )

        logger.info(
            "Document processing service initialized",
            max_tokens=max_tokens,
            project_id=project_id,
        )

    def _get_or_create_document_converter(self) -> DocumentConverter:
        """
        Get cached DocumentConverter or create new one if not exists.
        Thread-safe singleton pattern for DocumentConverter caching.

        Returns:
            Cached DocumentConverter instance
        """
        # Double-checked locking pattern for thread-safe singleton
        if self._doc_converter is None:
            with self._converter_lock:
                if self._doc_converter is None:
                    logger.info("Creating new DocumentConverter (will be cached)")
                    self._doc_converter = self._create_document_converter()
                    logger.info("DocumentConverter cached successfully")
                else:
                    logger.debug(
                        "Using cached DocumentConverter from concurrent thread"
                    )
        else:
            logger.debug("Using cached DocumentConverter")

        return self._doc_converter

    def _create_document_converter(self) -> DocumentConverter:
        """
        Create DocumentConverter with offline standard Docling models, no VLM pipeline, and OCR disabled.

        Uses pre-downloaded standard Docling models included in Docker image for reliable operation
        without VLM pipeline overhead or OCR dependencies for improved performance and reliability.

        Configuration expects DOCLING_ARTIFACTS_PATH environment variable to be set at container level.
        Falls back to default container path (/app/models/docling) if environment variable not set.

        Returns:
            Configured DocumentConverter instance with offline models, basic processing, no OCR

        Raises:
            DocumentProcessingServiceError: If offline standard Docling models are not available
        """
        import os

        # Check for models - environment variable takes precedence, then default container path
        container_artifacts_path = Path("/app/models/docling")
        env_artifacts_path = os.getenv("DOCLING_ARTIFACTS_PATH")

        artifacts_path = None
        if env_artifacts_path:
            artifacts_path = Path(env_artifacts_path)
        elif container_artifacts_path.exists():
            artifacts_path = container_artifacts_path

        try:
            # Check if offline models exist
            if (
                artifacts_path
                and artifacts_path.exists()
                and any(artifacts_path.iterdir())
            ):
                logger.info(
                    "Configuring Docling with offline standard models (no VLM pipeline)",
                    artifacts_path=str(artifacts_path),
                    model_files_count=len(list(artifacts_path.rglob("*"))),
                )

                # Configure PDF pipeline with offline models but without VLM
                # Docling will use DOCLING_ARTIFACTS_PATH environment variable automatically
                # Also pass artifacts_path explicitly as redundant safety measure
                pipeline_options = PdfPipelineOptions(
                    artifacts_path=artifacts_path,
                    # Disable all AI-powered features to avoid model conflicts
                    do_ocr=False,  # No OCR (avoids EasyOCR)
                    do_table_structure=True,
                    do_code_enrichment=False,  # No code OCR
                    do_formula_enrichment=False,  # No formula OCR
                    do_picture_classification=False,  # No picture classification
                    do_picture_description=False,  # No picture description
                )

                converter = DocumentConverter(
                    format_options={
                        InputFormat.PDF: PdfFormatOption(
                            pipeline_options=pipeline_options
                        )
                    }
                )

                logger.info(
                    "Document converter initialized with offline standard Docling models, all AI features disabled for fast, reliable text-only processing"
                )
                return converter
            else:
                logger.warning(
                    "Offline standard Docling models not found",
                    container_path=str(container_artifacts_path),
                    env_path=env_artifacts_path,
                    container_exists=container_artifacts_path.exists(),
                )
                raise Exception("Offline standard Docling models not available")

        except Exception as e:
            error_msg = f"Failed to configure offline standard Docling models: {e}"
            logger.error(
                "Critical error: Offline standard Docling models not available",
                error=str(e),
                error_type=type(e).__name__,
                artifacts_path=str(artifacts_path) if artifacts_path else None,
            )
            raise DocumentProcessingServiceError(error_msg) from e

    async def split_document_into_chunks(
        self, document_path: str
    ) -> list[ChunkWithPages]:
        """
        Split document into chunks using Docling's HybridChunker.

        Args:
            document_path: Path to the document file

        Returns:
            List of chunk dictionaries with text content and page numbers

        Raises:
            DocumentProcessingServiceError: If chunking fails
        """
        import time

        start_time = time.time()

        try:
            # Pre-validate PDFs to surface actionable errors early
            if document_path.lower().endswith(".pdf"):
                try:
                    import pypdfium2 as pdfium  # Lightweight validation

                    pdf = pdfium.PdfDocument(document_path)
                    page_count = len(pdf)
                    # Note: pdfium raises on encrypted or non-openable documents.
                    # We probe page count for visibility and avoid unused variables.
                    # pdfium raises on encrypted/non-openable docs; we log page_count
                    logger.info(
                        "PDF prevalidation passed",
                        document_path=document_path,
                        page_count=page_count,
                    )
                    # Optional guard for extremely large docs to avoid timeouts/memory spikes
                    if page_count > 2000:
                        raise DocumentProcessingServiceError(
                            f"PDF has {page_count} pages; exceeds safe processing limit (2000). "
                            "Please split the document and retry."
                        )
                except Exception as pre_e:
                    # Provide actionable error message for encrypted/corrupt PDFs
                    logger.error(
                        "PDF prevalidation failed",
                        document_path=document_path,
                        error=str(pre_e),
                        error_type=type(pre_e).__name__,
                    )
                    raise DocumentProcessingServiceError(
                        f"PDF validation failed for '{document_path}': {pre_e}"
                    ) from pre_e
            logger.info(
                "Starting document chunking with Docling HybridChunker",
                document_path=document_path,
            )

            # Step 1: Document conversion
            logger.info(
                "Step 1: Starting document conversion with Docling converter",
                document_path=document_path,
            )
            conversion_start = time.time()

            result = self.doc_converter.convert(document_path)

            conversion_time = time.time() - conversion_start
            logger.info(
                "Step 1: Document conversion completed",
                document_path=document_path,
                conversion_time_seconds=round(conversion_time, 2),
                result_type=type(result).__name__,
                has_document=bool(result and hasattr(result, "document")),
            )

            if not result or not result.document:
                logger.error(
                    "Document conversion failed - empty or invalid result",
                    document_path=document_path,
                    result_is_none=result is None,
                    has_document_attr=hasattr(result, "document") if result else False,
                    document_is_none=(
                        result.document is None
                        if result and hasattr(result, "document")
                        else None
                    ),
                )
                raise DocumentProcessingServiceError(
                    f"Failed to extract document content from '{document_path}'. Result was empty or invalid."
                )

            dl_document = result.document
            logger.info(
                "Step 2: Document object extracted successfully",
                document_path=document_path,
                document_type=type(dl_document).__name__,
                has_content=bool(dl_document),
            )

            # Step 2: Initialize HybridChunker
            logger.info(
                "Step 3: Initializing HybridChunker with Google tokenizer",
                document_path=document_path,
                max_tokens=self.max_tokens,
                tokenizer_type=type(self.tokenizer).__name__,
            )
            chunker_init_start = time.time()

            chunker = HybridChunker(
                tokenizer=self.tokenizer,
                merge_peers=True,  # Merge related content sections
            )

            chunker_init_time = time.time() - chunker_init_start
            logger.info(
                "Step 3: HybridChunker initialized successfully",
                document_path=document_path,
                init_time_seconds=round(chunker_init_time, 2),
                chunker_type=type(chunker).__name__,
            )

            # Step 3: Chunk the document
            logger.info(
                "Step 4: Starting document chunking process",
                document_path=document_path,
            )
            chunking_start = time.time()

            # Add progress logging for chunking since this might be where it hangs
            logger.info(
                "Step 4a: Calling chunker.chunk() method",
                document_path=document_path,
            )

            chunk_objects = list(chunker.chunk(dl_doc=dl_document))

            chunking_time = time.time() - chunking_start
            logger.info(
                "Step 4: Document chunking completed",
                document_path=document_path,
                chunking_time_seconds=round(chunking_time, 2),
                chunk_count=len(chunk_objects),
            )

            if not chunk_objects:
                logger.warning(
                    "No chunks generated from document",
                    document_path=document_path,
                )
                return [ChunkWithPages(text="[Empty document]", page_numbers=[])]

            # Step 4: Process chunk objects
            logger.info(
                "Step 5: Processing chunk objects to extract text and metadata",
                document_path=document_path,
                total_chunks=len(chunk_objects),
            )
            processing_start = time.time()

            chunks = []
            for i, chunk_obj in enumerate(chunk_objects):
                # Log progress every 10 chunks to track processing
                if i % 10 == 0 or i == len(chunk_objects) - 1:
                    logger.info(
                        "Step 5: Processing chunk batch",
                        document_path=document_path,
                        chunk_index=i,
                        total_chunks=len(chunk_objects),
                        progress_percent=round((i + 1) / len(chunk_objects) * 100, 1),
                    )

                if not chunk_obj.text or not chunk_obj.text.strip():
                    logger.debug(f"Skipping empty or whitespace-only chunk {i + 1}.")
                    continue

                # Extract page numbers from chunk metadata
                page_numbers: list[int] = []

                # Debug logging to understand metadata structure
                logger.debug(
                    f"Chunk {i} metadata analysis",
                    chunk_index=i,
                    has_meta=bool(chunk_obj.meta),
                    meta_type=type(chunk_obj.meta).__name__ if chunk_obj.meta else None,
                    meta_attrs=dir(chunk_obj.meta) if chunk_obj.meta else [],
                    has_doc_items=(
                        hasattr(chunk_obj.meta, "doc_items")
                        if chunk_obj.meta
                        else False
                    ),
                )

                # Try multiple approaches to extract page numbers
                if chunk_obj.meta:
                    # Approach 1: Standard doc_items -> prov -> page_no
                    if hasattr(chunk_obj.meta, "doc_items"):
                        doc_items = getattr(chunk_obj.meta, "doc_items", [])
                        logger.debug(f"Found {len(doc_items)} doc_items in chunk {i}")

                        for j, item in enumerate(doc_items):
                            if hasattr(item, "prov"):
                                logger.debug(
                                    f"Doc item {j} has prov with {len(item.prov)} items"
                                )
                                for prov_item in item.prov:
                                    if (
                                        hasattr(prov_item, "page_no")
                                        and prov_item.page_no is not None
                                    ):
                                        page_numbers.append(prov_item.page_no)
                                        logger.debug(
                                            f"Found page_no: {prov_item.page_no}"
                                        )

                    # Approach 2: Check if page info is directly in meta
                    if hasattr(chunk_obj.meta, "page_no"):
                        page_no = getattr(chunk_obj.meta, "page_no", None)
                        if page_no is not None:
                            page_numbers.append(page_no)
                            logger.debug(f"Found direct page_no in meta: {page_no}")

                    # Approach 3: Check for page_number attribute
                    if hasattr(chunk_obj.meta, "page_number"):
                        page_number = getattr(chunk_obj.meta, "page_number", None)
                        if page_number is not None:
                            page_numbers.append(page_number)
                            logger.debug(f"Found page_number in meta: {page_number}")

                # If no page numbers found, default to chunk index + 1 as fallback
                if not page_numbers:
                    # For documents, assume each chunk represents roughly one page
                    # This is a reasonable fallback for document processing
                    page_numbers = [i + 1]
                    logger.debug(
                        f"No page numbers found, using fallback page number: {i + 1}"
                    )

                page_numbers = sorted(set(page_numbers))

                chunks.append(
                    ChunkWithPages(
                        text=chunk_obj.text.strip(),
                        page_numbers=page_numbers,
                    )
                )

            processing_time = time.time() - processing_start
            total_time = time.time() - start_time

            logger.info(
                "Step 5: Chunk processing completed",
                document_path=document_path,
                processing_time_seconds=round(processing_time, 2),
                processed_chunks=len(chunks),
                skipped_chunks=len(chunk_objects) - len(chunks),
            )

            logger.info(
                "Document chunked successfully with HybridChunker",
                document_path=document_path,
                chunk_count=len(chunks),
                total_time_seconds=round(total_time, 2),
                average_chunk_length=(
                    sum(len(c["text"]) for c in chunks) // len(chunks) if chunks else 0
                ),
            )

            return (
                chunks
                if chunks
                else [ChunkWithPages(text="[Empty document]", page_numbers=[])]
            )

        except Exception as e:
            total_time = time.time() - start_time
            logger.error(
                "Document chunking failed",
                document_path=document_path,
                error=str(e),
                error_type=type(e).__name__,
                total_time_seconds=round(total_time, 2),
            )
            raise DocumentProcessingServiceError(
                f"Document chunking failed for {document_path}: {e}"
            ) from e

    async def process_document_file(
        self,
        document_path: str,
        user_id: str,
        document_id: str | None = None,
        contextual_text: str = "",
    ) -> list[ChunkData]:
        """
        Process a complete document file using Docling's HybridChunker.

        Args:
            document_path: Path to the document file
            user_id: ID of the user who owns the document
            document_id: Optional document ID to associate chunks with
            contextual_text: Optional contextual text for embedding

        Returns:
            List of processed chunks ready for storage

        Raises:
            DocumentProcessingServiceError: If processing fails
        """
        logger.info(
            "Starting document processing with Docling HybridChunker",
            document_path=document_path,
            user_id=user_id,
            document_id=document_id,
        )

        try:
            # Split document into chunks using HybridChunker
            text_chunks = await self.split_document_into_chunks(document_path)

            # Process each chunk
            chunks = []
            for i, chunk_data in enumerate(text_chunks):
                # Extract text and page numbers from chunk
                chunk_text = chunk_data["text"]
                page_numbers = chunk_data["page_numbers"]

                # Generate text embedding
                embedding = await self.embedding_service.generate_text_embedding(
                    text=chunk_text,
                )

                # Create metadata with extracted page numbers
                metadata = DocumentChunkMetadata(
                    media_path=document_path,
                    contextual_text=contextual_text,
                    page_number=(
                        page_numbers[0] if page_numbers else None
                    ),  # Use first page number
                    chunk_index=i,
                    doc_type=Path(document_path).suffix.lower().lstrip("."),
                )

                # Create chunk
                chunk = ChunkData(
                    text=chunk_text,
                    metadata=metadata,
                    text_embedding=embedding,
                )

                chunks.append(chunk)

            logger.info(
                "Document processing completed with HybridChunker",
                document_path=document_path,
                chunk_count=len(chunks),
            )

            return chunks

        except Exception as e:
            logger.error(
                "Document processing failed",
                document_path=document_path,
                user_id=user_id,
                error=str(e),
            )
            raise DocumentProcessingServiceError(
                f"Document processing failed: {e}"
            ) from e
        finally:
            # Clean up the document file that was passed to us
            try:
                from ..utils.gcs_utils import cleanup_temp_file

                cleanup_temp_file(document_path)
                logger.debug(
                    "Cleaned up main document file", document_path=document_path
                )
            except Exception as cleanup_error:
                logger.warning(
                    "Failed to cleanup document processing temp files",
                    document_path=document_path,
                    error=str(cleanup_error),
                )


# Global service instance
_document_processing_service: DocumentProcessingService | None = None


def get_document_processing_service(
    project_id: str | None = None,
) -> DocumentProcessingService:
    """
    Get a global document processing service instance.

    Args:
        project_id: Google Cloud project ID

    Returns:
        DocumentProcessingService instance
    """
    global _document_processing_service

    if _document_processing_service is None:
        _document_processing_service = DocumentProcessingService(
            project_id=project_id,
        )

    return _document_processing_service
