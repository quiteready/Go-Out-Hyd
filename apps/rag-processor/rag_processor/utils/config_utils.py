"""
Configuration utilities for RAG processor.

Extends the existing config system with script-specific configuration management,
timeout settings, retry configurations, and environment variable handling.
"""

import os
from dataclasses import dataclass
from typing import Any

import structlog

from .error_handling import ConfigurationError

logger = structlog.get_logger(__name__)


@dataclass
class TimeoutConfig:
    """Configurable timeout values with environment variable support."""

    gcp_api_timeout: int = 300  # 5 minutes
    build_timeout: int = 1800  # 30 minutes
    deploy_timeout: int = 600  # 10 minutes
    upload_timeout: int = 300  # 5 minutes
    download_timeout: int = 180  # 3 minutes


@dataclass
class RetryConfig:
    """Configurable retry values with environment variable support."""

    max_retries: int = 3
    base_delay: float = 2.0
    max_delay: float = 60.0
    backoff_factor: float = 2.0


@dataclass
class ScriptConfig:
    """Configuration for setup and deploy scripts."""

    # Script behavior
    strict_validation: bool = True
    skip_prerequisites: bool = False
    auto_confirm: bool = False
    verbose: bool = False

    # Resource limits
    max_concurrent_operations: int = 3
    memory_limit_mb: int = 512

    # Environment
    environment: str = "development"
    dry_run: bool = False


def get_env_var(
    key: str,
    default: Any = None,
    required: bool = False,
    var_type: type = str,
) -> Any:
    """
    Get environment variable with type conversion and validation.

    Args:
        key: Environment variable name
        default: Default value if not found
        required: Whether the variable is required
        var_type: Type to convert the value to

    Returns:
        The environment variable value converted to the specified type

    Raises:
        ConfigurationError: If required variable is missing or conversion fails
    """
    value = os.getenv(key)

    if value is None:
        if required:
            raise ConfigurationError(
                f"Required environment variable '{key}' is not set. "
                f"Please set this variable and try again."
            )
        return default

    # Type conversion
    try:
        if var_type is bool:
            # Handle boolean conversion specially
            return value.lower() in ("true", "1", "yes", "on")
        elif var_type is int:
            return int(value)
        elif var_type is float:
            return float(value)
        elif var_type is str:
            return value
        else:
            return var_type(value)
    except (ValueError, TypeError) as e:
        raise ConfigurationError(
            f"Environment variable '{key}' has invalid value '{value}'. "
            f"Expected {var_type.__name__} type. "
            f"Error: {e}"
        ) from e


def get_timeout_config() -> TimeoutConfig:
    """
    Get timeout configuration from environment variables.

    Environment variables:
        GCP_API_TIMEOUT: Timeout for GCP API calls (default: 300 seconds)
        BUILD_TIMEOUT: Timeout for build operations (default: 1800 seconds)
        DEPLOY_TIMEOUT: Timeout for deployment operations (default: 600 seconds)
        UPLOAD_TIMEOUT: Timeout for file uploads (default: 300 seconds)
        DOWNLOAD_TIMEOUT: Timeout for file downloads (default: 180 seconds)

    Returns:
        TimeoutConfig with values from environment or defaults
    """
    return TimeoutConfig(
        gcp_api_timeout=get_env_var("GCP_API_TIMEOUT", 300, var_type=int),
        build_timeout=get_env_var("BUILD_TIMEOUT", 1800, var_type=int),
        deploy_timeout=get_env_var("DEPLOY_TIMEOUT", 600, var_type=int),
        upload_timeout=get_env_var("UPLOAD_TIMEOUT", 300, var_type=int),
        download_timeout=get_env_var("DOWNLOAD_TIMEOUT", 180, var_type=int),
    )


def get_retry_config() -> RetryConfig:
    """
    Get retry configuration from environment variables.

    Environment variables:
        MAX_RETRIES: Maximum number of retry attempts (default: 3)
        BASE_DELAY: Base delay between retries in seconds (default: 2.0)
        MAX_DELAY: Maximum delay between retries in seconds (default: 60.0)
        BACKOFF_FACTOR: Exponential backoff factor (default: 2.0)

    Returns:
        RetryConfig with values from environment or defaults
    """
    return RetryConfig(
        max_retries=get_env_var("MAX_RETRIES", 3, var_type=int),
        base_delay=get_env_var("BASE_DELAY", 2.0, var_type=float),
        max_delay=get_env_var("MAX_DELAY", 60.0, var_type=float),
        backoff_factor=get_env_var("BACKOFF_FACTOR", 2.0, var_type=float),
    )


def get_script_config() -> ScriptConfig:
    """
    Get script configuration from environment variables.

    Environment variables:
        STRICT_VALIDATION: Enable strict validation (default: true)
        SKIP_PREREQUISITES: Skip prerequisite checks (default: false)
        AUTO_CONFIRM: Auto-confirm prompts (default: false)
        VERBOSE: Enable verbose output (default: false)
        MAX_CONCURRENT_OPERATIONS: Max concurrent operations (default: 3)
        MEMORY_LIMIT_MB: Memory limit in MB (default: 512)
        ENVIRONMENT: Target environment (default: development)
        DRY_RUN: Enable dry run mode (default: false)

    Returns:
        ScriptConfig with values from environment or defaults
    """
    return ScriptConfig(
        strict_validation=get_env_var("STRICT_VALIDATION", True, var_type=bool),
        skip_prerequisites=get_env_var("SKIP_PREREQUISITES", False, var_type=bool),
        auto_confirm=get_env_var("AUTO_CONFIRM", False, var_type=bool),
        verbose=get_env_var("VERBOSE", False, var_type=bool),
        max_concurrent_operations=get_env_var(
            "MAX_CONCURRENT_OPERATIONS", 3, var_type=int
        ),
        memory_limit_mb=get_env_var("MEMORY_LIMIT_MB", 512, var_type=int),
        environment=get_env_var("ENVIRONMENT", "development", var_type=str),
        dry_run=get_env_var("DRY_RUN", False, var_type=bool),
    )


def get_config_value(
    key: str,
    default: Any = None,
    required: bool = False,
    config_sources: list[str] | None = None,
) -> Any:
    """
    Get configuration value from multiple sources with fallback.

    Checks sources in order:
    1. Environment variables
    2. Config files (if specified)
    3. Default value

    Args:
        key: Configuration key name
        default: Default value if not found
        required: Whether the value is required
        config_sources: List of config file paths to check (not implemented yet)

    Returns:
        Configuration value

    Raises:
        ConfigurationError: If required value is missing
    """
    # For now, just check environment variables
    # TODO: Add config file support in future iteration
    value = os.getenv(key)

    if value is not None:
        return value

    if required:
        raise ConfigurationError(
            f"Required configuration value '{key}' not found. "
            f"Please set the environment variable '{key}' and try again."
        )

    return default


def validate_timeout_config(config: TimeoutConfig) -> None:
    """
    Validate timeout configuration values.

    Args:
        config: TimeoutConfig to validate

    Raises:
        ConfigurationError: If validation fails
    """
    errors: list[str] = []

    # Check that all timeouts are positive
    if config.gcp_api_timeout <= 0:
        errors.append("gcp_api_timeout must be positive")
    if config.build_timeout <= 0:
        errors.append("build_timeout must be positive")
    if config.deploy_timeout <= 0:
        errors.append("deploy_timeout must be positive")

    # Check reasonable ranges
    if config.gcp_api_timeout > 3600:  # 1 hour
        errors.append("gcp_api_timeout should not exceed 3600 seconds (1 hour)")
    if config.build_timeout > 7200:  # 2 hours
        errors.append("build_timeout should not exceed 7200 seconds (2 hours)")

    if errors:
        raise ConfigurationError(
            f"Invalid timeout configuration: {'; '.join(errors)}. "
            f"Please check your timeout settings and try again."
        )


def validate_retry_config(config: RetryConfig) -> None:
    """
    Validate retry configuration values.

    Args:
        config: RetryConfig to validate

    Raises:
        ConfigurationError: If validation fails
    """
    errors: list[str] = []

    # Check that values are positive
    if config.max_retries < 0:
        errors.append("max_retries must be non-negative")
    if config.base_delay <= 0:
        errors.append("base_delay must be positive")
    if config.max_delay <= 0:
        errors.append("max_delay must be positive")
    if config.backoff_factor <= 0:
        errors.append("backoff_factor must be positive")

    # Check reasonable ranges
    if config.max_retries > 10:
        errors.append("max_retries should not exceed 10")
    if config.base_delay > 60:
        errors.append("base_delay should not exceed 60 seconds")
    if config.max_delay > 300:  # 5 minutes
        errors.append("max_delay should not exceed 300 seconds (5 minutes)")
    if config.backoff_factor > 5:
        errors.append("backoff_factor should not exceed 5")

    # Check logical relationships
    if config.base_delay > config.max_delay:
        errors.append("base_delay should not exceed max_delay")

    if errors:
        raise ConfigurationError(
            f"Invalid retry configuration: {'; '.join(errors)}. "
            f"Please check your retry settings and try again."
        )


def get_all_configs() -> tuple[TimeoutConfig, RetryConfig, ScriptConfig]:
    """
    Get all configuration objects with validation.

    Returns:
        Tuple of (TimeoutConfig, RetryConfig, ScriptConfig)

    Raises:
        ConfigurationError: If any configuration is invalid
    """
    timeout_config = get_timeout_config()
    retry_config = get_retry_config()
    script_config = get_script_config()

    # Validate all configurations
    validate_timeout_config(timeout_config)
    validate_retry_config(retry_config)

    logger.debug(
        "Configuration loaded successfully",
        timeout_config=timeout_config,
        retry_config=retry_config,
        script_config=script_config,
    )

    return timeout_config, retry_config, script_config


def log_configuration_summary() -> None:
    """Log a summary of current configuration for debugging."""
    try:
        timeout_config, retry_config, script_config = get_all_configs()

        logger.info(
            "Configuration summary",
            timeouts={
                "gcp_api": timeout_config.gcp_api_timeout,
                "deploy": timeout_config.deploy_timeout,
            },
            retry={
                "max_retries": retry_config.max_retries,
                "base_delay": retry_config.base_delay,
                "max_delay": retry_config.max_delay,
            },
            script={
                "environment": script_config.environment,
                "strict_validation": script_config.strict_validation,
                "dry_run": script_config.dry_run,
            },
        )
    except Exception as e:
        logger.error("Failed to load configuration", error=str(e))
        raise
