#!/usr/bin/env python3
"""
Google Cloud Platform Setup - Development Environment
Beginner-friendly script for setting up a cost-effective development environment

This script sets up a development environment with:
- Lower resource allocation for cost savings
- Debug logging for troubleshooting
- Scale-to-zero capability
- Development-specific bucket and service names

Usage:
    python setup-gcp-dev.py

Requirements:
- Google Cloud SDK (gcloud) installed and authenticated
- Active Google Cloud project with billing enabled
- Supabase database URL
"""

import sys
from typing import Any

from .config_utils import get_config_value
from .error_handling import (
    ConfigurationError,
    ErrorContext,
    PrerequisiteError,
    ServiceError,
    ValidationError,
    handle_script_error,
)
from .gcp_setup_core import (
    BillingNotEnabledError,
    create_cloud_functions_artifact_registry,
    ensure_cloud_tasks_queue,
    load_and_validate_config_for_dev,
    setup_gcp_environment,
)
from .gcp_utils import Colors, enable_apis_only, log
from .prerequisite_utils import check_deployment_prerequisites
from .retry_utils import RetryConfig, retry_sync
from .validation_utils import (
    validate_gcp_project_id,
    validate_required_fields,
)


def validate_development_environment() -> None:
    """Validate basic development environment prerequisites (without project-specific checks)"""
    with ErrorContext("Development environment validation"):
        log("🔍 Validating development environment prerequisites...", Colors.CYAN)

        # Check basic prerequisites only (no project-specific APIs yet)
        required_commands = ["gcloud"]

        # Only check commands and authentication, skip APIs until we have project_id
        missing_items = check_deployment_prerequisites(
            project_id="",  # Skip project-specific checks
            required_commands=required_commands,
            required_apis=[],  # Skip API checks for now
        )

        if missing_items:
            missing_list = "\n".join([f"  • {item}" for item in missing_items])
            raise PrerequisiteError(
                f"Missing development prerequisites:\n{missing_list}\n\n"
                f"Please ensure you have:\n"
                f"1. Google Cloud SDK installed and authenticated\n"
                f"2. Active Google Cloud project with billing enabled"
            )

        log("✅ Development environment prerequisites validated", Colors.GREEN)


def validate_development_config(config: dict[str, Any]) -> None:
    """Validate development configuration"""
    with ErrorContext("Development configuration validation"):
        log("🔍 Validating development configuration...", Colors.CYAN)

        # Required fields for development
        required_fields = ["project_id", "region", "service_name", "environment"]

        missing_fields = validate_required_fields(config, required_fields)

        if missing_fields:
            missing_list = "\n".join([f"  • {field}" for field in missing_fields])
            raise ValidationError(
                f"Missing required development configuration:\n{missing_list}\n\n"
                f"Please ensure deployment_config.py has all required fields."
            )

        # Validate specific fields
        if not validate_gcp_project_id(config.get("project_id", "")):
            raise ValidationError(
                f"Invalid GCP project ID: '{config.get('project_id')}'\n"
                f"Project IDs must be 6-30 characters, start with a letter, "
                f"and contain only lowercase letters, numbers, and hyphens."
            )

        # Development-specific validations
        if config.get("environment") != "development":
            raise ValidationError(
                f"Configuration environment must be 'development', got: '{config.get('environment')}'"
            )

        log("✅ Development configuration validated", Colors.GREEN)


def enable_development_apis(config: dict[str, Any]) -> None:
    """Enable required APIs for development environment"""
    with ErrorContext("Development API enablement"):
        log("🔌 Enabling required APIs for development...", Colors.CYAN)

        project_id = config.get("project_id", "")

        log(f"   Enabling APIs for project: {project_id}")
        enable_apis_only(project_id, "development")

        log("✅ Required APIs enabled successfully", Colors.GREEN)


def check_development_cost_controls() -> None:
    """Check development cost control settings"""
    with ErrorContext("Development cost control validation"):
        log("💰 Checking development cost control settings...", Colors.CYAN)

        # Validate cost control settings
        max_budget = get_config_value("MAX_DEVELOPMENT_BUDGET", 50.0)  # $50 default

        if max_budget > 100.0:
            log(
                f"⚠️  Development budget is high: ${max_budget}/month. "
                f"Consider lowering for cost savings.",
                Colors.YELLOW,
            )

        log("✅ Development cost controls validated", Colors.GREEN)


def setup_development_environment_with_retry(dev_config: dict[str, Any]) -> None:
    """Setup development environment with retry logic"""

    def _setup_operation() -> None:
        # Check for billing first, OUTSIDE of ErrorContext to avoid error logging
        try:
            setup_gcp_environment(dev_config)
        except BillingNotEnabledError:
            # Handle billing not enabled - re-raise to be caught at outer level for clean exit
            raise
        except Exception as e:
            # All other exceptions should be wrapped for proper error context
            with ErrorContext("Development environment setup"):
                # Re-raise the exception to trigger the ErrorContext logging
                raise e from e

    # Use retry logic for setup operations
    retry_config = RetryConfig(
        max_attempts=3,
        base_delay=2.0,
        max_delay=30.0,
        exponential_backoff=True,
        jitter=True,
    )

    try:
        retry_sync(
            _setup_operation,
            config=retry_config,
            retryable_exceptions=(PrerequisiteError, ConfigurationError),
            operation_name="development_environment_setup",
        )
    except BillingNotEnabledError:
        # Handle billing not enabled - exit cleanly without error logging
        sys.exit(0)


def main() -> None:
    """Main entry point for development environment setup - Complete Pipeline"""

    try:
        # Welcome message (outside ErrorContext to avoid logging user cancellation as error)
        log("🧪 RAG SaaS Development Environment Setup", Colors.CYAN + Colors.BOLD)
        log("=" * 50)
        log(
            "Setting up a cost-effective development environment for testing and development."
        )
        log("")
        log("Development Environment Features:")
        log("  ✅ Cost-optimized (scales to zero when not used)")
        log("  ✅ Debug logging for troubleshooting")
        log("  ✅ Lower resource allocation (saves money)")
        log("  ✅ Perfect for testing and development")
        log("  ✅ Decoupled architecture (Cloud Function queue + Cloud Run processor)")
        log("")
        log("Note: This is for DEVELOPMENT only. For production, use setup-gcp-prod.py")
        log("")

        # Ask for confirmation (outside ErrorContext to avoid logging user cancellation as error)
        response = input(
            f"{Colors.CYAN}Continue with development setup? [y/N]: {Colors.RESET}"
        )
        if response.lower() not in ["y", "yes"]:
            log("Setup cancelled by user")
            sys.exit(0)

        # Phase 1: Validate environment
        validate_development_environment()

        # Phase 2: Load configuration and get project ID (with guaranteed non-null types)
        dev_config, project_id = load_and_validate_config_for_dev()

        # Phase 3: Enable APIs
        enable_development_apis(dev_config)

        # Phase 4: Check cost controls
        check_development_cost_controls()

        # Phase 5: Setup core infrastructure with retry logic
        setup_development_environment_with_retry(dev_config)

        # Phase 6: Setup Cloud Tasks queue
        with ErrorContext("Cloud Tasks setup"):
            log("🏗️ Setting up Cloud Tasks queue...", Colors.CYAN)

            # Ensure environment-specific queue name aligns with deployment scripts
            ensure_cloud_tasks_queue(
                project_id,
                dev_config.get("region", "us-central1"),
                environment="development",
            )

        # Phase 7: Setup Artifact Registry for both processor and Cloud Functions
        with ErrorContext("Artifact Registry setup"):
            log("🐳 Setting up Artifact Registry repositories...", Colors.CYAN)

            # Create Cloud Functions repo and configure IAM once centrally
            create_cloud_functions_artifact_registry(
                {
                    "project_id": project_id,
                    "region": dev_config.get("region", "us-central1"),
                    "env_config": dev_config,
                }
            )

            log("  ✅ Artifact Registry setup completed", Colors.GREEN)

        log(
            "🎉 Development environment setup completed successfully!",
            Colors.GREEN + Colors.BOLD,
        )
        log("")
        # Model setup guidance (one-time)
        log("Next Steps:", Colors.YELLOW)
        log(
            "  1. Deploy the RAG processor service (includes model setup):",
            Colors.YELLOW,
        )
        log("     npm run deploy:processor:dev", Colors.YELLOW)
        log("  2. Deploy the GCS handler function (Producer):", Colors.YELLOW)
        log("     npm run deploy:gcs-handler:dev", Colors.YELLOW)
        log("  3. Deploy the task processor function (Consumer):", Colors.YELLOW)
        log("     npm run deploy:task-processor:dev", Colors.YELLOW)
        log(
            "  4. Test the pipeline by uploading a file to your GCS bucket",
            Colors.YELLOW,
        )

    except KeyboardInterrupt:
        error_msg = handle_script_error(
            Exception("Development setup interrupted by user"), "user_interrupt"
        )
        log(f"❌ {error_msg}", Colors.RED)
        sys.exit(1)

    except ValidationError as e:
        log(f"❌ Configuration validation failed: {e}", Colors.RED)
        log(
            "💡 Please check your configuration and ensure all required fields are present.",
            Colors.YELLOW,
        )
        sys.exit(1)

    except PrerequisiteError as e:
        log(f"❌ Prerequisites not met: {e}", Colors.RED)
        log(
            "💡 Please install and configure the required prerequisites, then run this script again.",
            Colors.YELLOW,
        )
        sys.exit(1)

    except ConfigurationError as e:
        log(f"❌ Configuration error: {e}", Colors.RED)
        log(
            "💡 Please check your Google Cloud project configuration and ensure billing is enabled.",
            Colors.YELLOW,
        )
        sys.exit(1)

    except ServiceError as e:
        # Handle specific permission errors cleanly
        error_msg = str(e).lower()
        if "permission denied" in error_msg or "not have permission" in error_msg:
            log(
                "❌ Permission denied: You don't have permission to enable APIs on this project.",
                Colors.RED,
            )
            log("💡 Solutions:", Colors.YELLOW)
            log(
                "   1. Ask the project owner to add you as Editor or Service Usage Admin",
                Colors.YELLOW,
            )
            log(
                "   2. Select a different project where you have admin permissions",
                Colors.YELLOW,
            )
            log(
                "   3. Create a new GCP project where you'll be the owner",
                Colors.YELLOW,
            )
        else:
            log("❌ Google Cloud operation failed", Colors.RED)
            log(
                "💡 Please check the Google Cloud Console for more details.",
                Colors.YELLOW,
            )
        sys.exit(1)

    except Exception as e:
        log(f"❌ Unexpected error: {e}", Colors.RED)
        log("💡 Please contact support if the issue persists.", Colors.YELLOW)
        sys.exit(1)


if __name__ == "__main__":
    main()
