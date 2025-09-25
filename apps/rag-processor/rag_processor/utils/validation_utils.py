"""
Input validation utilities for RAG processor.

Provides comprehensive validation functions for GCP resources, URLs,
configuration values, and other inputs used by setup/deploy scripts.
"""

import re
import urllib.parse
from collections.abc import Callable
from typing import Any

import structlog

from .error_handling import ValidationError

logger = structlog.get_logger(__name__)

# Input validation patterns
GCP_PROJECT_ID_PATTERN = re.compile(r"^[a-z][a-z0-9-]{4,28}[a-z0-9]$")
GCS_BUCKET_NAME_PATTERN = re.compile(r"^[a-z0-9][a-z0-9-_.]{1,61}[a-z0-9]$")
URL_PATTERN = re.compile(r"^https?://[^\s/$.?#].[^\s]*$")
EMAIL_PATTERN = re.compile(r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$")
API_KEY_PATTERN = re.compile(r"^[A-Za-z0-9_-]{32,}$")
SERVICE_ACCOUNT_EMAIL_PATTERN = re.compile(
    r"^[a-z][a-z0-9-]{4,28}[a-z0-9]@[a-z][a-z0-9-]{4,28}[a-z0-9]\.iam\.gserviceaccount\.com$"
)

# Valid GCP regions (much simpler than regex!)
VALID_GCP_REGIONS = {
    # Americas
    "us-central1",
    "us-east1",
    "us-east4",
    "us-west1",
    "us-west2",
    "us-west3",
    "us-west4",
    "northamerica-northeast1",
    "northamerica-northeast2",
    "southamerica-east1",
    "southamerica-west1",
    # Europe
    "europe-central2",
    "europe-north1",
    "europe-southwest1",
    "europe-west1",
    "europe-west2",
    "europe-west3",
    "europe-west4",
    "europe-west6",
    "europe-west8",
    "europe-west9",
    "europe-west10",
    "europe-west12",
    # Asia Pacific
    "asia-east1",
    "asia-east2",
    "asia-northeast1",
    "asia-northeast2",
    "asia-northeast3",
    "asia-south1",
    "asia-south2",
    "asia-southeast1",
    "asia-southeast2",
    "australia-southeast1",
    "australia-southeast2",
    # Other regions
    "me-central1",
    "me-west1",
    "africa-south1",
}


def validate_gcp_project_id(project_id: str) -> bool:
    """
    Validate GCP project ID format.

    Args:
        project_id: The GCP project ID to validate

    Returns:
        True if valid, False otherwise
    """
    if not project_id:
        return False
    return bool(GCP_PROJECT_ID_PATTERN.match(project_id))


def validate_gcs_bucket_name(bucket_name: str) -> bool:
    """
    Validate GCS bucket name format.

    Args:
        bucket_name: The GCS bucket name to validate

    Returns:
        True if valid, False otherwise
    """
    if not bucket_name:
        return False

    # Additional GCS bucket rules
    if ".." in bucket_name or bucket_name.startswith(".") or bucket_name.endswith("."):
        return False

    # Cannot contain 'google' or start with 'goog'
    if "google" in bucket_name.lower() or bucket_name.lower().startswith("goog"):
        return False

    return bool(GCS_BUCKET_NAME_PATTERN.match(bucket_name))


def validate_gcp_region(region: str) -> bool:
    """
    Validate GCP region against known valid regions.

    Args:
        region: The GCP region to validate

    Returns:
        True if valid, False otherwise
    """
    if not region:
        return False
    return region in VALID_GCP_REGIONS


def validate_url(url: str) -> bool:
    """
    Validate URL format.

    Args:
        url: The URL to validate

    Returns:
        True if valid, False otherwise
    """
    if not url:
        return False

    try:
        result = urllib.parse.urlparse(url)
        return all([result.scheme, result.netloc]) and bool(URL_PATTERN.match(url))
    except Exception:
        return False


def validate_database_url(url: str) -> bool:
    """
    Validate PostgreSQL database URL format (for Supabase).

    Args:
        url: The database URL to validate

    Returns:
        True if valid, False otherwise
    """
    if not url:
        return False

    try:
        result = urllib.parse.urlparse(url)
        # Check that we have a scheme and netloc
        if not all([result.scheme, result.netloc]):
            return False

        # Only accept PostgreSQL schemes (what Supabase uses)
        valid_schemes = {"postgresql", "postgres"}
        return result.scheme.lower() in valid_schemes
    except Exception:
        return False


def validate_email(email: str) -> bool:
    """
    Validate email address format.

    Args:
        email: The email address to validate

    Returns:
        True if valid, False otherwise
    """
    if not email:
        return False
    return bool(EMAIL_PATTERN.match(email))


def validate_api_key(api_key: str) -> bool:
    """
    Validate API key format (basic check for reasonable length and characters).

    Args:
        api_key: The API key to validate

    Returns:
        True if valid, False otherwise
    """
    if not api_key:
        return False
    return bool(API_KEY_PATTERN.match(api_key))


def validate_service_account_email(email: str) -> bool:
    """
    Validate GCP service account email format.

    Args:
        email: The service account email to validate

    Returns:
        True if valid, False otherwise
    """
    if not email:
        return False
    return bool(SERVICE_ACCOUNT_EMAIL_PATTERN.match(email))


def validate_port_number(port: int | str) -> bool:
    """
    Validate port number is in valid range.

    Args:
        port: The port number to validate

    Returns:
        True if valid, False otherwise
    """
    try:
        port_int = int(port)
        return 1 <= port_int <= 65535
    except (ValueError, TypeError):
        return False


def validate_required_fields(
    data: dict[str, Any], required_fields: list[str]
) -> list[str]:
    """
    Validate that required fields are present and non-empty.

    Args:
        data: Dictionary containing the data to validate
        required_fields: List of field names that are required

    Returns:
        List of missing field names (empty if all required fields are present)
    """
    missing_fields: list[str] = []

    for field in required_fields:
        if (
            field not in data
            or not data[field]
            or (isinstance(data[field], str) and not data[field].strip())
        ):
            missing_fields.append(field)

    return missing_fields


def validate_environment_name(environment: str) -> bool:
    """
    Validate environment name (development, production, staging, etc.).

    Args:
        environment: The environment name to validate

    Returns:
        True if valid, False otherwise
    """
    if not environment:
        return False

    valid_environments = {
        "development",
        "production",
        "staging",
        "testing",
        "dev",
        "prod",
        "stage",
        "test",
    }
    return environment.lower() in valid_environments


def validate_memory_specification(memory: str) -> bool:
    """
    Validate Cloud Run memory specification format (e.g., "512Mi", "2Gi").

    Args:
        memory: The memory specification to validate

    Returns:
        True if valid, False otherwise
    """
    if not memory:
        return False

    memory_pattern = re.compile(r"^[1-9][0-9]*[MG]i$")
    return bool(memory_pattern.match(memory))


def validate_cpu_count(cpu: int | str) -> bool:
    """
    Validate CPU count for Cloud Run (1, 2, 4, 6, 8).

    Args:
        cpu: The CPU count to validate

    Returns:
        True if valid, False otherwise
    """
    try:
        cpu_int = int(cpu)
        return cpu_int in {1, 2, 4, 6, 8}
    except (ValueError, TypeError):
        return False


def validate_timeout_seconds(timeout: int | str) -> bool:
    """
    Validate timeout value in seconds (1 to 3600 for Cloud Run).

    Args:
        timeout: The timeout value to validate

    Returns:
        True if valid, False otherwise
    """
    try:
        timeout_int = int(timeout)
        return 1 <= timeout_int <= 3600
    except (ValueError, TypeError):
        return False


def validate_and_raise(
    value: Any,
    validator_func: Callable[[Any], bool],
    field_name: str,
    expected_format: str,
) -> None:
    """
    Validate a value and raise ValidationError if invalid.

    Args:
        value: The value to validate
        validator_func: The validation function to use
        field_name: Name of the field being validated (for error messages)
        expected_format: Description of the expected format

    Raises:
        ValidationError: If validation fails
    """
    if not validator_func(value):
        raise ValidationError(
            f"Invalid {field_name}: '{value}'. "
            f"Expected {expected_format}. "
            f"Please check your input and try again."
        )


def validate_gcp_project_id_strict(project_id: str) -> None:
    """
    Strictly validate GCP project ID and raise ValidationError if invalid.

    Args:
        project_id: The GCP project ID to validate

    Raises:
        ValidationError: If validation fails
    """
    validate_and_raise(
        project_id,
        validate_gcp_project_id,
        "GCP project ID",
        "6-30 characters, start with a letter, lowercase letters, numbers, and hyphens only",
    )


def validate_gcs_bucket_name_strict(bucket_name: str) -> None:
    """
    Strictly validate GCS bucket name and raise ValidationError if invalid.

    Args:
        bucket_name: The GCS bucket name to validate

    Raises:
        ValidationError: If validation fails
    """
    validate_and_raise(
        bucket_name,
        validate_gcs_bucket_name,
        "GCS bucket name",
        "3-63 characters, lowercase letters, numbers, hyphens, underscores, and dots, no 'google' keyword",
    )


def validate_url_strict(url: str) -> None:
    """
    Strictly validate URL and raise ValidationError if invalid.

    Args:
        url: The URL to validate

    Raises:
        ValidationError: If validation fails
    """
    validate_and_raise(
        url,
        validate_url,
        "URL",
        "valid HTTP or HTTPS URL format",
    )


def validate_api_key_strict(api_key: str) -> None:
    """
    Strictly validate API key and raise ValidationError if invalid.

    Args:
        api_key: The API key to validate

    Raises:
        ValidationError: If validation fails
    """
    validate_and_raise(
        api_key,
        validate_api_key,
        "API key",
        "at least 32 characters with letters, numbers, underscores, and hyphens",
    )


def validate_configuration_dict(
    config: dict[str, Any],
    required_fields: list[str],
    optional_fields: list[str] | None = None,
) -> None:
    """
    Validate a configuration dictionary with required and optional fields.

    Args:
        config: The configuration dictionary to validate
        required_fields: List of required field names
        optional_fields: List of optional field names (for validation if present)

    Raises:
        ValidationError: If validation fails
    """
    # Check for missing required fields
    missing_fields = validate_required_fields(config, required_fields)
    if missing_fields:
        raise ValidationError(
            f"Missing required configuration fields: {', '.join(missing_fields)}. "
            f"Please ensure all required fields are set and try again."
        )

    # Log successful validation
    logger.debug(
        "Configuration validation passed",
        required_fields=len(required_fields),
        optional_fields=len(optional_fields or []),
        total_config_keys=len(config),
    )
