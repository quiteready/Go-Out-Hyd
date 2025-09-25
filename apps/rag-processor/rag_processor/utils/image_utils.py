"""
Image processing utilities for RAG processor.

Helper functions for image format detection, validation, size checking,
and basic image operations.
"""

import mimetypes
import os
from pathlib import Path
from typing import BinaryIO, TypedDict

import structlog

from ..models.image_analysis_models import ImageAnalysisError, ImageFormat

logger = structlog.get_logger(__name__)


class ImageInfo(TypedDict):
    """
    Type-safe information about an image file.

    This replaces the generic dict[str, Any] to provide type safety
    and prevent key access errors.
    """

    file_path: str
    filename: str
    file_size_bytes: int
    image_format: str  # ImageFormat.value
    mime_type: str
    is_valid: bool
    error_message: str | None
    width: int | None
    height: int | None
    dimensions: tuple[int, int] | None


# Supported image formats with their MIME types
SUPPORTED_IMAGE_FORMATS = {
    ImageFormat.JPEG: ["image/jpeg", "image/jpg"],
    ImageFormat.JPG: ["image/jpeg", "image/jpg"],
    ImageFormat.PNG: ["image/png"],
    ImageFormat.GIF: ["image/gif"],
    ImageFormat.BMP: ["image/bmp"],
    ImageFormat.TIFF: ["image/tiff", "image/tif"],
    ImageFormat.WEBP: ["image/webp"],
}

# Maximum file size (20MB as specified in task)
MAX_IMAGE_SIZE_MB = 20
MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024

# Minimum dimensions for analysis
MIN_IMAGE_WIDTH = 32
MIN_IMAGE_HEIGHT = 32


def detect_image_format(file_path: str) -> ImageFormat | None:
    """
    Detect image format from file extension and MIME type.

    Args:
        file_path: Path to the image file

    Returns:
        ImageFormat if detected, None otherwise

    Raises:
        ImageAnalysisError: If file doesn't exist or format detection fails
    """
    if not os.path.exists(file_path):
        raise ImageAnalysisError(f"Image file not found: {file_path}")

    # Get file extension
    file_ext = Path(file_path).suffix.lower().lstrip(".")

    # Check against supported formats
    for image_format in ImageFormat:
        if file_ext == image_format.value:
            logger.debug(
                "Detected image format from extension",
                file_path=file_path,
                format=image_format.value,
            )
            return image_format

    # Fall back to MIME type detection
    mime_type, _ = mimetypes.guess_type(file_path)
    if mime_type:
        for image_format, mime_types in SUPPORTED_IMAGE_FORMATS.items():
            if mime_type in mime_types:
                logger.debug(
                    "Detected image format from MIME type",
                    file_path=file_path,
                    format=image_format.value,
                    mime_type=mime_type,
                )
                return image_format

    logger.warning(
        "Could not detect image format",
        file_path=file_path,
        extension=file_ext,
        mime_type=mime_type,
    )
    return None


def validate_image_file(file_path: str) -> tuple[bool, str]:
    """
    Validate that a file is a supported image format and meets size requirements.

    Args:
        file_path: Path to the image file

    Returns:
        Tuple of (is_valid, error_message)
    """
    try:
        # Check if file exists
        if not os.path.exists(file_path):
            return False, f"Image file not found: {file_path}"

        # Check if it's a regular file
        if not os.path.isfile(file_path):
            return False, f"Path is not a regular file: {file_path}"

        # Check file size
        file_size = os.path.getsize(file_path)
        if file_size == 0:
            return False, "Image file is empty"

        if file_size > MAX_IMAGE_SIZE_BYTES:
            return (
                False,
                f"Image file too large: {file_size} bytes (max: {MAX_IMAGE_SIZE_BYTES} bytes)",
            )

        # Check image format
        image_format = detect_image_format(file_path)
        if image_format is None:
            return False, "Unsupported image format"

        logger.debug(
            "Image file validation successful",
            file_path=file_path,
            format=image_format.value,
            size_bytes=file_size,
        )

        return True, ""

    except Exception as e:
        logger.error("Image validation failed", file_path=file_path, error=str(e))
        return False, f"Validation error: {str(e)}"


def get_image_info(file_path: str) -> ImageInfo:
    """
    Get basic information about an image file.

    Args:
        file_path: Path to the image file

    Returns:
        Dictionary with image information

    Raises:
        ImageAnalysisError: If file cannot be analyzed
    """
    try:
        if not os.path.exists(file_path):
            raise ImageAnalysisError(f"Image file not found: {file_path}")

        # Get basic file info
        file_size = os.path.getsize(file_path)
        image_format = detect_image_format(file_path)

        if image_format is None:
            raise ImageAnalysisError(f"Unsupported image format: {file_path}")

        # Try to get image dimensions using basic approach
        # Note: We use a lightweight approach without external image libraries

        info: ImageInfo = {
            "file_path": file_path,
            "filename": os.path.basename(file_path),
            "file_size_bytes": file_size,
            "image_format": image_format.value,
            "mime_type": _get_mime_type_for_format(image_format),
            "is_valid": True,
            "error_message": None,
            "width": None,
            "height": None,
            "dimensions": None,
        }

        # Try to get dimensions - this is basic and may not work for all formats
        try:
            dimensions = _get_basic_image_dimensions(file_path, image_format)
            if dimensions:
                info["width"], info["height"] = dimensions
                info["dimensions"] = dimensions
        except Exception as e:
            logger.debug(
                "Could not get image dimensions", file_path=file_path, error=str(e)
            )
            info["width"] = None
            info["height"] = None
            info["dimensions"] = None

        return info

    except Exception as e:
        logger.error("Failed to get image info", file_path=file_path, error=str(e))
        raise ImageAnalysisError(f"Failed to analyze image: {str(e)}") from e


def _get_mime_type_for_format(image_format: ImageFormat) -> str:
    """Get MIME type for image format."""
    mime_types = SUPPORTED_IMAGE_FORMATS.get(image_format, [])
    return mime_types[0] if mime_types else "application/octet-stream"


def _get_basic_image_dimensions(
    file_path: str, image_format: ImageFormat
) -> tuple[int, int] | None:
    """
    Get basic image dimensions using lightweight parsing.

    This is a simplified approach that works for PNG and JPEG formats.
    Uses built-in file parsing without external dependencies.

    Args:
        file_path: Path to the image file
        image_format: Detected image format

    Returns:
        Tuple of (width, height) or None if cannot determine
    """
    try:
        with open(file_path, "rb") as f:
            # Try to get dimensions for PNG files
            if image_format == ImageFormat.PNG:
                return _get_png_dimensions(f)

            # Try to get dimensions for JPEG files
            elif image_format in [ImageFormat.JPEG, ImageFormat.JPG]:
                return _get_jpeg_dimensions(f)

            # For other formats, return None (basic parsing not implemented)
            else:
                return None

    except Exception as e:
        logger.debug(
            "Could not get basic image dimensions",
            file_path=file_path,
            format=image_format.value,
            error=str(e),
        )
        return None


def _get_png_dimensions(file_obj: BinaryIO) -> tuple[int, int] | None:
    """Get PNG dimensions from file header."""
    try:
        file_obj.seek(0)
        header = file_obj.read(24)

        # Check PNG signature
        if header[:8] != b"\x89PNG\r\n\x1a\n":
            return None

        # Check for IHDR chunk
        if header[12:16] != b"IHDR":
            return None

        # Extract width and height (big-endian)
        width = int.from_bytes(header[16:20], byteorder="big")
        height = int.from_bytes(header[20:24], byteorder="big")

        return (width, height)

    except Exception:
        return None


def _get_jpeg_dimensions(file_obj: BinaryIO) -> tuple[int, int] | None:
    """Get JPEG dimensions from file header."""
    try:
        file_obj.seek(0)

        # Check JPEG signature
        if file_obj.read(2) != b"\xff\xd8":
            return None

        # Look for SOF0 or SOF2 markers
        while True:
            marker = file_obj.read(2)
            if len(marker) != 2:
                break

            if marker[0] != 0xFF:
                break

            # SOF0 (baseline) or SOF2 (progressive)
            if marker[1] in [0xC0, 0xC2]:
                # Skip length (2 bytes) and precision (1 byte)
                file_obj.read(3)

                # Read height and width (big-endian)
                height = int.from_bytes(file_obj.read(2), byteorder="big")
                width = int.from_bytes(file_obj.read(2), byteorder="big")

                return (width, height)

            # Skip this segment
            elif marker[1] not in [0xD8, 0xD9]:  # Not SOI or EOI
                length = int.from_bytes(file_obj.read(2), byteorder="big")
                if length < 2:
                    break
                file_obj.read(length - 2)
            else:
                break

        return None

    except Exception:
        return None


def clean_filename(filename: str) -> str:
    """
    Clean filename for safe processing.

    Args:
        filename: Original filename

    Returns:
        Cleaned filename
    """
    if not filename:
        return "unknown_image"

    # Remove potentially dangerous characters
    cleaned = "".join(c for c in filename if c.isalnum() or c in "._-")

    # Ensure it's not empty
    if not cleaned:
        return "unknown_image"

    return cleaned


def format_file_size(size_bytes: int) -> str:
    """
    Format file size in human-readable format.

    Args:
        size_bytes: Size in bytes

    Returns:
        Formatted size string
    """
    if size_bytes < 1024:
        return f"{size_bytes} B"
    elif size_bytes < 1024 * 1024:
        return f"{size_bytes / 1024:.1f} KB"
    elif size_bytes < 1024 * 1024 * 1024:
        return f"{size_bytes / (1024 * 1024):.1f} MB"
    else:
        return f"{size_bytes / (1024 * 1024 * 1024):.1f} GB"


def is_image_file(file_path: str) -> bool:
    """
    Check if a file is a supported image format.

    Args:
        file_path: Path to the file

    Returns:
        True if it's a supported image format
    """
    try:
        image_format = detect_image_format(file_path)
        return image_format is not None
    except Exception:
        return False
