"""
Image analysis models for RAG processor.

Simple models for image analysis with basic error handling.
"""

from enum import Enum

from ..utils.retry_utils import NonRetryableError


class ImageAnalysisError(NonRetryableError):
    """Base exception for image analysis errors."""

    pass


class ImageFormat(str, Enum):
    """Supported image formats for analysis."""

    JPEG = "jpeg"
    JPG = "jpg"
    PNG = "png"
    GIF = "gif"
    BMP = "bmp"
    TIFF = "tiff"
    WEBP = "webp"
