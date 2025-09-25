"""
Shared utilities for Google GenAI operations.

Provides common functionality used across multiple AI services,
including file state management and polling utilities.
"""

import asyncio
from typing import Any

import google.genai as genai
import structlog
from google.genai import types

from ..utils.retry_utils import NonRetryableError, retry_genai_operation

logger = structlog.get_logger(__name__)


class GenAIFileManager:
    """Utility class for managing GenAI file uploads and state polling."""

    def __init__(self, genai_client: genai.Client):
        """
        Initialize the file manager.

        Args:
            genai_client: Configured GenAI client instance
        """
        self.genai_client = genai_client

    async def wait_for_file_active(
        self, file_name: str, max_wait_time: int = 180
    ) -> bool:
        """
        Wait for uploaded file to reach ACTIVE state before using it.

        This is critical because GenAI files go through states:
        PROCESSING -> ACTIVE -> (ready for use)

        Using files in PROCESSING state causes AI generation to fail.

        Args:
            file_name: Name of the uploaded file
            max_wait_time: Maximum time to wait in seconds (default: 3 minutes)

        Returns:
            True if file reached ACTIVE state, False otherwise
        """
        start_time = asyncio.get_event_loop().time()
        logger.debug(f"Waiting for file {file_name} to reach ACTIVE state...")

        while True:
            try:
                # Use retry logic for GenAI API calls to handle 500 errors gracefully

                async def _check_file_state():
                    return await self.genai_client.aio.files.get(name=file_name)

                file_info = await retry_genai_operation(
                    _check_file_state, operation_name=f"check_file_state({file_name})"
                )

                if file_info.state == types.FileState.ACTIVE:
                    logger.debug(f"File {file_name} is now ACTIVE")
                    return True
                elif file_info.state == types.FileState.FAILED:
                    logger.error(f"File {file_name} failed to process")
                    return False

                # Check timeout
                elapsed_time = asyncio.get_event_loop().time() - start_time
                if elapsed_time > max_wait_time:
                    logger.error(
                        f"Timeout waiting for file {file_name} to become active "
                        f"after {elapsed_time:.1f} seconds"
                    )
                    return False

                # Wait 2 seconds before checking again
                await asyncio.sleep(2)

            except Exception as e:
                # If retry logic exhausted all attempts, this is a genuine failure
                logger.error(
                    f"Error checking file state for {file_name} after retries: {e}"
                )
                return False

    async def upload_and_wait(
        self, file_path: str, mime_type: str | None = None, max_wait_time: int = 180
    ) -> Any:
        """
        Upload a file and wait for it to reach ACTIVE state.

        Args:
            file_path: Path to the file to upload
            mime_type: MIME type of the file (e.g., 'video/mp4', 'audio/wav')
            max_wait_time: Maximum time to wait for file to become active

        Returns:
            The uploaded GenAI file object

        Raises:
            Exception: If upload fails or file doesn't reach ACTIVE state
        """
        # Upload the file with mime_type if provided
        logger.debug(f"Uploading file to GenAI: {file_path}, mime_type: {mime_type}")

        # Extract just the filename for cleaner naming
        filename = file_path.split("/")[-1] if "/" in file_path else file_path

        # Use retry logic for GenAI upload to handle 500 errors gracefully

        async def _upload_file():
            with open(file_path, "rb") as f:
                if mime_type:
                    return await self.genai_client.aio.files.upload(
                        file=f,
                        config={
                            "mime_type": mime_type,
                            "display_name": filename,
                        },
                    )
                else:
                    return await self.genai_client.aio.files.upload(file=f)

        uploaded_file = await retry_genai_operation(
            _upload_file, operation_name=f"upload_file({filename})"
        )

        logger.info(f"File uploaded with name: {uploaded_file.name}")

        # Validate file name
        if not uploaded_file.name:
            raise NonRetryableError("Uploaded file name is None")

        # Wait for file to be ready
        is_active = await self.wait_for_file_active(uploaded_file.name, max_wait_time)

        if not is_active:
            # Clean up failed upload
            await self.cleanup_file(uploaded_file)
            raise NonRetryableError(
                f"File {uploaded_file.name} did not reach ACTIVE state within "
                f"{max_wait_time} seconds"
            )

        return uploaded_file

    async def cleanup_file(self, uploaded_file: Any) -> None:
        """
        Clean up an uploaded file from GenAI.

        Args:
            uploaded_file: The uploaded file object to clean up
        """
        if uploaded_file and uploaded_file.name:
            try:
                # Use retry logic for GenAI delete to handle 500 errors gracefully
                async def _delete_file():
                    return await self.genai_client.aio.files.delete(
                        name=uploaded_file.name
                    )

                await retry_genai_operation(
                    _delete_file, operation_name=f"delete_file({uploaded_file.name})"
                )
                logger.debug(f"Cleaned up uploaded file: {uploaded_file.name}")
            except Exception as cleanup_error:
                logger.warning(
                    f"Failed to delete uploaded file {uploaded_file.name} after retries: {cleanup_error}"
                )


def create_file_manager(genai_client: genai.Client) -> GenAIFileManager:
    """
    Create a GenAI file manager instance.

    Args:
        genai_client: Configured GenAI client

    Returns:
        GenAIFileManager instance
    """
    return GenAIFileManager(genai_client)
