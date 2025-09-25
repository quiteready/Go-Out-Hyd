"""
Background task manager for preventing memory leaks.

This module provides a task manager that tracks background asyncio tasks
to prevent memory leaks and ensure proper cleanup on shutdown.
"""

import asyncio
import uuid
from collections.abc import Coroutine
from datetime import datetime, timezone
from typing import Any

import structlog

logger = structlog.get_logger(__name__)


class BackgroundTaskManager:
    """
    Manager for background asyncio tasks with proper tracking and cleanup.

    This prevents memory leaks by:
    1. Tracking all created tasks
    2. Removing completed tasks automatically
    3. Providing cleanup on shutdown
    4. Logging task lifecycle events
    """

    def __init__(self) -> None:
        """Initialize the task manager."""
        self._tasks: set[asyncio.Task] = set()
        self._task_metadata: dict[str, dict] = {}
        logger.info("Background task manager initialized")

    def create_task(
        self,
        coro: Coroutine[Any, Any, Any],
        *,
        name: str | None = None,
        metadata: dict | None = None,
    ) -> asyncio.Task:
        """
        Create and track a background task.

        Args:
            coro: Coroutine to run as background task
            name: Optional task name for debugging
            metadata: Optional metadata for tracking (e.g., job_id, user_id)

        Returns:
            The created asyncio.Task
        """
        # Generate task ID for tracking
        task_id = str(uuid.uuid4())
        task_name = name or f"background-task-{task_id[:8]}"

        # Create the task
        task = asyncio.create_task(coro, name=task_name)

        # Track the task
        self._tasks.add(task)
        self._task_metadata[task_id] = {
            "name": task_name,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "metadata": metadata or {},
            "task": task,
        }

        # Add done callback to clean up
        def _task_done_callback(t: asyncio.Task) -> None:
            """Callback when task completes."""
            try:
                # Remove from tracking set
                self._tasks.discard(t)

                # Log completion
                if t.exception():
                    logger.error(
                        "Background task failed",
                        task_name=task_name,
                        task_id=task_id,
                        error=str(t.exception()),
                        metadata=metadata,
                    )
                else:
                    logger.debug(
                        "Background task completed",
                        task_name=task_name,
                        task_id=task_id,
                        metadata=metadata,
                    )

                # Clean up metadata
                self._task_metadata.pop(task_id, None)

            except Exception as e:
                logger.error(
                    "Error in task done callback", error=str(e), task_name=task_name
                )

        task.add_done_callback(_task_done_callback)

        logger.info(
            "Background task created",
            task_name=task_name,
            task_id=task_id,
            active_tasks=len(self._tasks),
            metadata=metadata,
        )

        return task

    async def wait_all(self, timeout: float | None = None) -> None:
        """
        Wait for all tracked tasks to complete.

        Args:
            timeout: Optional timeout in seconds
        """
        if not self._tasks:
            logger.debug("No active tasks to wait for")
            return

        logger.info("Waiting for background tasks to complete", count=len(self._tasks))

        try:
            await asyncio.wait_for(
                asyncio.gather(*self._tasks, return_exceptions=True), timeout=timeout
            )
            logger.info("All background tasks completed")
        except asyncio.TimeoutError:
            logger.warning(
                "Timeout waiting for background tasks", remaining_tasks=len(self._tasks)
            )
            raise

    async def cancel_all(self) -> None:
        """Cancel all tracked tasks."""
        if not self._tasks:
            return

        logger.warning("Cancelling all background tasks", count=len(self._tasks))

        for task in self._tasks:
            task.cancel()

        # Wait for cancellation to complete
        await asyncio.gather(*self._tasks, return_exceptions=True)

        # Clear tracking
        self._tasks.clear()
        self._task_metadata.clear()

        logger.info("All background tasks cancelled")

    def get_stats(self) -> dict:
        """
        Get current task manager statistics.

        Returns:
            Dictionary with task statistics
        """
        return {
            "active_tasks": len(self._tasks),
            "total_tracked": len(self._task_metadata),
            "tasks": [
                {
                    "name": info["name"],
                    "created_at": info["created_at"],
                    "metadata": info["metadata"],
                    "done": info["task"].done() if info["task"] else None,
                }
                for info in self._task_metadata.values()
            ],
        }

    def __len__(self) -> int:
        """Return number of active tasks."""
        return len(self._tasks)


# Global task manager instance
_task_manager: BackgroundTaskManager | None = None


def get_task_manager() -> BackgroundTaskManager:
    """
    Get the global task manager instance.

    Returns:
        The global BackgroundTaskManager instance
    """
    global _task_manager
    if _task_manager is None:
        _task_manager = BackgroundTaskManager()
    return _task_manager
