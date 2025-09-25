"""
Resource management utilities for RAG processor.

Provides proper cleanup of temporary files, database connections,
and other resources to prevent memory leaks in production.
"""

import os
import shutil
import tempfile
from collections.abc import Generator
from contextlib import contextmanager
from typing import Any

import structlog

from ..config import config

logger = structlog.get_logger(__name__)


class ResourceManager:
    """
    Resource manager for temporary files and resource cleanup.

    Ensures proper cleanup of resources even in case of exceptions.
    """

    def __init__(self) -> None:
        """Initialize resource manager."""
        # Config is available as global instance
        self.temp_files: set[str] = set()
        self.temp_dirs: set[str] = set()

    @contextmanager
    def temp_file(
        self,
        suffix: str | None = None,
        prefix: str | None = None,
        dir: str | None = None,
    ) -> Generator[str, None, None]:
        """
        Context manager for temporary files with automatic cleanup.

        Args:
            suffix: File suffix (e.g., '.mp4', '.pdf')
            prefix: File prefix (e.g., 'video_', 'doc_')
            dir: Directory to create temp file in

        Yields:
            Path to temporary file

        Example:
            with resource_manager.temp_file(suffix='.mp4') as temp_path:
                # Use temp_path
                pass
            # File is automatically cleaned up
        """
        temp_dir = dir or config.get_temp_dir()
        temp_path = None

        try:
            # Create temporary file
            fd, temp_path = tempfile.mkstemp(suffix=suffix, prefix=prefix, dir=temp_dir)
            os.close(fd)  # Close file descriptor

            # Track the file for cleanup
            self.temp_files.add(temp_path)

            logger.debug(
                "Created temporary file",
                temp_path=temp_path,
                suffix=suffix,
                prefix=prefix,
            )

            yield temp_path

        except Exception as e:
            logger.error(
                "Error with temporary file",
                temp_path=temp_path,
                error=str(e),
            )
            raise
        finally:
            # Clean up the file
            if temp_path is not None:
                self._cleanup_file(temp_path)

    @contextmanager
    def temp_directory(
        self,
        suffix: str | None = None,
        prefix: str | None = None,
        dir: str | None = None,
    ) -> Generator[str, None, None]:
        """
        Context manager for temporary directories with automatic cleanup.

        Args:
            suffix: Directory suffix
            prefix: Directory prefix (e.g., 'video_processing_')
            dir: Parent directory to create temp directory in

        Yields:
            Path to temporary directory

        Example:
            with resource_manager.temp_directory(prefix='video_') as temp_dir:
                # Use temp_dir
                pass
            # Directory is automatically cleaned up
        """
        temp_parent = dir or config.get_temp_dir()
        temp_dir = None

        try:
            # Create temporary directory
            temp_dir = tempfile.mkdtemp(suffix=suffix, prefix=prefix, dir=temp_parent)

            # Track the directory for cleanup
            self.temp_dirs.add(temp_dir)

            logger.debug(
                "Created temporary directory",
                temp_dir=temp_dir,
                suffix=suffix,
                prefix=prefix,
            )

            yield temp_dir

        except Exception as e:
            logger.error(
                "Error with temporary directory",
                temp_dir=temp_dir,
                error=str(e),
            )
            raise
        finally:
            # Clean up the directory
            if temp_dir is not None:
                self._cleanup_directory(temp_dir)

    def _cleanup_file(self, file_path: str) -> None:
        """
        Clean up a single temporary file.

        Args:
            file_path: Path to file to clean up
        """
        try:
            if os.path.exists(file_path):
                os.remove(file_path)
                logger.debug("Cleaned up temporary file", file_path=file_path)

            # Remove from tracking set
            self.temp_files.discard(file_path)

        except Exception as e:
            logger.warning(
                "Failed to clean up temporary file",
                file_path=file_path,
                error=str(e),
            )

    def _cleanup_directory(self, dir_path: str) -> None:
        """
        Clean up a temporary directory and all its contents.

        Args:
            dir_path: Path to directory to clean up
        """
        try:
            if os.path.exists(dir_path):
                shutil.rmtree(dir_path)
                logger.debug("Cleaned up temporary directory", dir_path=dir_path)

            # Remove from tracking set
            self.temp_dirs.discard(dir_path)

        except Exception as e:
            logger.warning(
                "Failed to clean up temporary directory",
                dir_path=dir_path,
                error=str(e),
            )

    def cleanup_all(self) -> None:
        """
        Clean up all tracked temporary files and directories.

        This is typically called during shutdown or error recovery.
        """
        logger.info(
            "Cleaning up all temporary resources",
            temp_files=len(self.temp_files),
            temp_dirs=len(self.temp_dirs),
        )

        # Clean up tracked files
        for file_path in list(self.temp_files):
            self._cleanup_file(file_path)

        # Clean up tracked directories
        for dir_path in list(self.temp_dirs):
            self._cleanup_directory(dir_path)

    def get_disk_usage(self) -> dict[str, int]:
        """
        Get disk usage statistics for temporary directory.

        Returns:
            Dict with disk usage information
        """
        temp_dir = config.get_temp_dir()

        try:
            # Get overall disk usage
            stat = shutil.disk_usage(temp_dir)

            # Calculate usage by this process
            process_usage = 0
            for file_path in self.temp_files:
                try:
                    if os.path.exists(file_path):
                        process_usage += os.path.getsize(file_path)
                except OSError:
                    pass

            for dir_path in self.temp_dirs:
                try:
                    if os.path.exists(dir_path):
                        for root, _dirs, files in os.walk(dir_path):
                            for file in files:
                                file_path = os.path.join(root, file)
                                process_usage += os.path.getsize(file_path)
                except OSError:
                    pass

            return {
                "total_bytes": stat.total,
                "used_bytes": stat.used,
                "free_bytes": stat.free,
                "process_usage_bytes": process_usage,
                "temp_files_count": len(self.temp_files),
                "temp_dirs_count": len(self.temp_dirs),
            }

        except Exception as e:
            logger.error("Failed to get disk usage", error=str(e))
            return {
                "total_bytes": 0,
                "used_bytes": 0,
                "free_bytes": 0,
                "process_usage_bytes": 0,
                "temp_files_count": len(self.temp_files),
                "temp_dirs_count": len(self.temp_dirs),
            }

    def check_disk_space(self, required_bytes: int) -> bool:
        """
        Check if sufficient disk space is available.

        Args:
            required_bytes: Required disk space in bytes

        Returns:
            True if sufficient space is available
        """
        usage = self.get_disk_usage()
        available = usage["free_bytes"]

        # Add some buffer (10% of required space)
        required_with_buffer = required_bytes * 1.1

        has_space = available >= required_with_buffer

        logger.debug(
            "Disk space check",
            required_bytes=required_bytes,
            available_bytes=available,
            has_space=has_space,
        )

        return has_space

    def __enter__(self) -> "ResourceManager":
        """Context manager entry."""
        return self

    def __exit__(self, exc_type: Any, exc_val: Any, exc_tb: Any) -> None:
        """Context manager exit with cleanup."""
        self.cleanup_all()


# Global resource manager instance
_resource_manager: ResourceManager | None = None


def get_resource_manager() -> ResourceManager:
    """
    Get a global resource manager instance.

    Returns:
        ResourceManager instance
    """
    global _resource_manager

    if _resource_manager is None:
        _resource_manager = ResourceManager()

    return _resource_manager


@contextmanager
def temp_file(
    suffix: str | None = None,
    prefix: str | None = None,
    dir: str | None = None,
) -> Generator[str, None, None]:
    """
    Convenience function for temporary file context manager.

    Args:
        suffix: File suffix (e.g., '.mp4', '.pdf')
        prefix: File prefix (e.g., 'video_', 'doc_')
        dir: Directory to create temp file in

    Yields:
        Path to temporary file

    Example:
        with temp_file(suffix='.mp4') as temp_path:
            # Use temp_path
            pass
        # File is automatically cleaned up
    """
    manager = get_resource_manager()
    with manager.temp_file(suffix=suffix, prefix=prefix, dir=dir) as temp_path:
        yield temp_path


@contextmanager
def temp_directory(
    suffix: str | None = None,
    prefix: str | None = None,
    dir: str | None = None,
) -> Generator[str, None, None]:
    """
    Convenience function for temporary directory context manager.

    Args:
        suffix: Directory suffix
        prefix: Directory prefix (e.g., 'video_processing_')
        dir: Parent directory to create temp directory in

    Yields:
        Path to temporary directory

    Example:
        with temp_directory(prefix='video_') as temp_dir:
            # Use temp_dir
            pass
        # Directory is automatically cleaned up
    """
    manager = get_resource_manager()
    with manager.temp_directory(suffix=suffix, prefix=prefix, dir=dir) as temp_dir:
        yield temp_dir


def cleanup_all_resources() -> None:
    """
    Clean up all tracked temporary resources.

    This is typically called during shutdown or error recovery.
    """
    manager = get_resource_manager()
    manager.cleanup_all()


def get_disk_usage() -> dict[str, int]:
    """
    Get disk usage statistics for temporary directory.

    Returns:
        Dict with disk usage information
    """
    manager = get_resource_manager()
    return manager.get_disk_usage()


def check_disk_space(required_bytes: int) -> bool:
    """
    Check if sufficient disk space is available.

    Args:
        required_bytes: Required disk space in bytes

    Returns:
        True if sufficient space is available
    """
    manager = get_resource_manager()
    return manager.check_disk_space(required_bytes)
