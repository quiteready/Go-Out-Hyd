"""
Error handling utilities for RAG processor.

Provides custom exception hierarchy and error message formatting utilities
that work with the existing retry system and configuration management.
"""

import json
from collections.abc import Callable
from datetime import datetime, timezone
from typing import Any

import structlog

from .retry_utils import NonRetryableError, RetryableError

logger = structlog.get_logger(__name__)


# Custom exception hierarchy extending existing retry system
class ScriptError(Exception):
    """Base exception for script errors with user-friendly messages."""

    def __init__(self, message: str, details: dict[str, Any] | None = None) -> None:
        super().__init__(message)
        self.message = message
        self.details = details or {}
        self.timestamp = datetime.now(timezone.utc)

    def __str__(self) -> str:
        return self.message


class ValidationError(ScriptError, NonRetryableError):
    """Input validation errors that should not be retried."""

    pass


class ConfigurationError(ScriptError, NonRetryableError):
    """Configuration-related errors that should not be retried."""

    pass


class PrerequisiteError(ScriptError, NonRetryableError):
    """Missing prerequisite errors that should not be retried."""

    pass


class DeploymentError(ScriptError, RetryableError):
    """Deployment-related errors that may be retryable."""

    pass


class ServiceError(ScriptError, RetryableError):
    """Service-related errors that may be retryable."""

    pass


class DatabaseError(ScriptError, RetryableError):
    """Database-related errors that may be retryable."""

    pass


# Error message formatting utilities
def format_validation_error(field_name: str, value: Any, expected: str) -> str:
    """Format user-friendly validation error message."""
    return (
        f"Invalid {field_name}: '{value}'. "
        f"Expected {expected}. "
        f"Please check your input and try again."
    )


def format_configuration_error(config_name: str, suggestion: str) -> str:
    """Format user-friendly configuration error message."""
    return (
        f"Configuration error: {config_name} is not properly set. "
        f"{suggestion} "
        f"Please check your environment variables and try again."
    )


def format_prerequisite_error(missing_item: str, install_command: str) -> str:
    """Format user-friendly prerequisite error message."""
    return (
        f"Missing prerequisite: {missing_item}. "
        f"Please install it using: {install_command}"
    )


def format_gcp_error(error: Exception, operation: str) -> str:
    """Convert GCP errors to user-friendly messages."""
    error_msg = str(error).lower()

    if "permission denied" in error_msg or "forbidden" in error_msg:
        return (
            f"Permission denied for {operation}. "
            f"Please check your GCP IAM permissions and ensure the service account "
            f"has the necessary roles."
        )
    elif "not found" in error_msg:
        return (
            f"Resource not found during {operation}. "
            f"Please verify the resource exists and you have access to it."
        )
    elif "quota exceeded" in error_msg or "rate limit" in error_msg:
        return (
            f"GCP quota or rate limit exceeded during {operation}. "
            f"Please wait a few minutes and try again, or request a quota increase."
        )
    elif "authentication" in error_msg:
        return (
            f"Authentication failed during {operation}. "
            f"Please run 'gcloud auth application-default login' and try again."
        )
    elif "billing" in error_msg:
        return (
            f"Billing issue detected during {operation}. "
            f"Please ensure billing is enabled for your GCP project."
        )
    else:
        return (
            f"GCP operation failed during {operation}. "
            f"Please check the GCP Console for more details."
        )


def format_deployment_error(error: Exception, stage: str) -> str:
    """Convert deployment errors to user-friendly messages."""
    error_msg = str(error).lower()

    if "timeout" in error_msg:
        return (
            f"Deployment timeout during {stage}. "
            f"The operation is taking longer than expected. "
            f"You can check the progress in the GCP Console."
        )
    elif "image" in error_msg and "not found" in error_msg:
        return (
            f"Docker image not found during {stage}. "
            f"Please ensure the image was built and pushed successfully."
        )
    elif "service already exists" in error_msg:
        return (
            f"Service already exists during {stage}. "
            f"This may be expected if updating an existing service."
        )
    else:
        return (
            f"Deployment failed during {stage}. "
            f"Please check the deployment logs for more details."
        )


def handle_script_error(
    error: Exception,
    operation: str,
    context: dict[str, Any] | None = None,
    user_friendly: bool = True,
) -> str:
    """
    Handle script errors with appropriate logging and user-friendly messages.

    Args:
        error: The exception that occurred
        operation: Description of the operation that failed
        context: Additional context for logging
        user_friendly: Whether to return user-friendly or technical messages

    Returns:
        Formatted error message for the user
    """
    context = context or {}

    # Log the technical details for debugging (without verbose stack trace)
    logger.error(
        "Script operation failed",
        operation=operation,
        error=str(error),
        error_type=type(error).__name__,
        context=context,
    )

    if not user_friendly:
        return str(error)

    # Return user-friendly messages based on error type
    if isinstance(error, ValidationError):
        return str(error)
    elif isinstance(error, ConfigurationError):
        return str(error)
    elif isinstance(error, PrerequisiteError):
        return str(error)
    elif "gcp" in operation.lower() or "google" in str(error).lower():
        return format_gcp_error(error, operation)
    elif "deploy" in operation.lower():
        return format_deployment_error(error, operation)
    else:
        return (
            f"Operation failed: {operation}. "
            f"Please check the logs for more details and try again."
        )


def create_error_summary(errors: list[Exception]) -> dict[str, Any]:
    """Create a summary of multiple errors for reporting."""
    if not errors:
        return {"total_errors": 0, "summary": "No errors"}

    error_counts: dict[str, int] = {}
    for error in errors:
        error_type = type(error).__name__
        error_counts[error_type] = error_counts.get(error_type, 0) + 1

    return {
        "total_errors": len(errors),
        "error_types": error_counts,
        "first_error": str(errors[0]),
        "last_error": str(errors[-1]),
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


def safe_json_dump(data: Any) -> str:
    """Safely convert data to JSON string for error reporting."""
    try:
        return json.dumps(data, default=str, indent=2)
    except Exception:
        return str(data)


# Context managers for error handling
class ErrorContext:
    """Context manager for handling errors in script operations."""

    def __init__(
        self,
        operation: str,
        cleanup_func: Callable[[], None] | None = None,
        reraise: bool = True,
    ) -> None:
        self.operation = operation
        self.cleanup_func = cleanup_func
        self.reraise = reraise
        self.start_time = datetime.now(timezone.utc)

    def __enter__(self) -> "ErrorContext":
        logger.info(f"Starting operation: {self.operation}")
        return self

    def __exit__(self, exc_type: type, exc_val: Exception, exc_tb: Any) -> bool:
        duration = datetime.now(timezone.utc) - self.start_time

        if exc_type is None:
            logger.info(
                f"Operation completed successfully: {self.operation}",
                duration_seconds=duration.total_seconds(),
            )
            return False

        # Handle the error
        error_msg = handle_script_error(exc_val, self.operation)

        # Run cleanup if provided
        if self.cleanup_func:
            try:
                logger.info(f"Running cleanup for: {self.operation}")
                self.cleanup_func()
            except Exception as cleanup_error:
                logger.error(
                    f"Cleanup failed for: {self.operation}",
                    cleanup_error=str(cleanup_error),
                )

        # Log the failure
        logger.error(
            f"Operation failed: {self.operation}",
            duration_seconds=duration.total_seconds(),
            error_message=error_msg,
        )

        # Don't suppress the exception unless explicitly requested
        return not self.reraise
