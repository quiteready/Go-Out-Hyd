#!/usr/bin/env python3
"""
Google Cloud Platform Setup Core Module
Shared implementation for development and production environment setup

This module contains all the common logic for setting up GCP environments,
with configuration differences handled through deployment_config.py.
"""

import os
import subprocess
import sys
from pathlib import Path
from typing import Any

from dotenv import load_dotenv

from .error_handling import (
    ConfigurationError,
    PrerequisiteError,
    handle_script_error,
)
from .gcp_utils import (
    Colors,
    check_commands_parallel,
    enable_apis_only,
    log,
    log_error,
    log_step,
    log_success,
    log_warning,
    run_command,
    run_commands_parallel,
    wait_for_service_account_readiness,
)
from .prerequisite_utils import (
    check_deployment_prerequisites,
    get_prerequisite_summary,
    validate_deployment_environment,
)
from .validation_utils import (
    validate_and_raise,
    validate_api_key,
    validate_database_url,
    validate_gcp_project_id,
    validate_gcp_region,
    validate_gcs_bucket_name,
)


def detect_environment() -> str:
    """Detect the environment based on the script filename."""
    script_name = sys.argv[0]
    if "setup_gcp_prod" in script_name:
        return "production"
    elif "setup_gcp_dev" in script_name:
        return "development"
    else:
        # Default to development if unable to detect
        return "development"


def load_environment_file() -> None:
    """Load the appropriate environment file based on the detected environment.

    If file doesn't exist, continues silently - setup scripts will create it.
    """
    environment = detect_environment()

    if environment == "development":
        env_file = (
            Path(__file__).parent.parent / "apps" / "rag-processor" / ".env.local"
        )
    elif environment == "production":
        env_file = Path(__file__).parent.parent / "apps" / "rag-processor" / ".env.prod"
    else:
        raise ConfigurationError(f"Unknown environment: {environment}")

    if env_file.exists():
        load_dotenv(env_file, override=True)
        print(f"✅ Loaded environment variables from {env_file} for {environment}")
    # No else clause - if file doesn't exist, just continue silently


# Load environment file at module import time
load_environment_file()


def is_placeholder_value(value: str) -> bool:
    """Check if a value appears to be a placeholder that should not be used"""
    if not value or len(value.strip()) == 0:
        return True

    value_lower = value.lower()
    placeholder_patterns = [
        # Project/bucket placeholders (rag-saas specific)
        "your-project-id",
        "your_project_id",
        "your-production-project-id",
        "your-bucket-name",
        "your-production-bucket-name",
        # Database URL placeholders (rag-saas specific)
        "your-database-url",
        "your-production-database-url",
        "[your-password]",
        "db.xxxxx.supabase.co",
        "your_password_here",
        # Supabase placeholders (rag-saas web app)
        "your-supabase-url",
        "your-production-supabase-url",
        "your-supabase-anon-key",
        "your-production-supabase-anon-key",
        "your-supabase-service-role-key",
        "your-production-supabase-service-role-key",
        # API key placeholders (rag-saas specific)
        "your_api_key_here",
        "your_development_api_key_here",
        "your_production_api_key_here",
        "rp_dev_your_development_api_key_here",
        "rp_prod_your_production_api_key_here",
        "your-gemini-api-key",
        "your-production-gemini-api-key",
        # Google Cloud Service Account placeholders (rag-saas web app)
        "your-service-account-key",
        "your-production-service-account-key",
        # Stripe placeholders (rag-saas web app)
        "sk_test_your_stripe_test_secret_key",
        "sk_live_your_stripe_live_secret_key",
        "pk_test_your_stripe_test_publishable_key",
        "pk_live_your_stripe_live_publishable_key",
        "whsec_your_webhook_secret_for_local_testing",
        "whsec_your_production_webhook_secret",
        # Stripe Price ID placeholders (rag-saas web app)
        "price_test_free_tier_id",
        "price_test_basic_tier_id",
        "price_test_pro_tier_id",
        "price_live_free_tier_id",
        "price_live_basic_tier_id",
        "price_live_pro_tier_id",
        # URL placeholders (rag-saas specific)
        "https://your-domain.com",
        "https://billing.stripe.com/p/login/live_something",
        # Generic placeholders
        "placeholder",
        "change_me",
        "replace_me",
        "todo",
        "fixme",
        "example",
        "sample",
        "test_key",
        "dummy",
        "paste-generated-password-here",
    ]

    # Check for exact matches or if value contains placeholder patterns
    for pattern in placeholder_patterns:
        if pattern in value_lower:
            return True

    # Check for common placeholder patterns like xxx, yyy, zzz
    if len(set(value_lower)) <= 2 and len(value) > 5:  # Like "xxxxx" or "yyyyy"
        return True

    return False


def prompt_user(question: str, default: str = "") -> str:
    """Prompt user for input with optional default"""

    def clean_input(value: str) -> str:
        """Clean input by stripping whitespace and quotes"""
        cleaned = value.strip()
        # Remove surrounding quotes (single or double)
        if len(cleaned) >= 2:
            if (cleaned.startswith('"') and cleaned.endswith('"')) or (
                cleaned.startswith("'") and cleaned.endswith("'")
            ):
                cleaned = cleaned[1:-1]
        return cleaned

    if default:
        # Show the default value clearly and explain what Enter does
        log(f"{Colors.CYAN}{question}{Colors.RESET}")
        log(f"  Default: {Colors.YELLOW}{default}{Colors.RESET}")
        response = input(
            f"{Colors.CYAN}  Enter value (or press Enter for default): {Colors.RESET}"
        )

        cleaned_response = clean_input(response)
        result = cleaned_response or default

        if not response.strip():
            log(f"  ✓ Using default: {Colors.GREEN}{default}{Colors.RESET}")
        elif cleaned_response != response.strip():
            log(
                f"  ✓ Cleaned input (removed quotes): {Colors.GREEN}{cleaned_response}{Colors.RESET}"
            )

        return result
    else:
        response = input(f"{Colors.CYAN}{question}: {Colors.RESET}")
        cleaned_response = clean_input(response)

        if cleaned_response != response.strip():
            log(
                f"  ✓ Cleaned input (removed quotes): {Colors.GREEN}{cleaned_response}{Colors.RESET}"
            )

        return cleaned_response


def prompt_choice(question: str, choices: list[str], default: int = 0) -> int:
    """Prompt user for choice from list"""
    log(f"{Colors.CYAN}{question}{Colors.RESET}")
    for i, choice in enumerate(choices, 1):
        marker = " - Recommended" if i == default + 1 else ""
        log(f"  {i}. {choice}{marker}")

    while True:
        try:
            choice = prompt_user("Choice", str(default + 1))
            choice_num = int(choice) - 1
            if 0 <= choice_num < len(choices):
                return choice_num
            else:
                log_error(f"Please choose a number between 1 and {len(choices)}")
        except ValueError:
            log_error("Please enter a valid number")
        except KeyboardInterrupt:
            log_error("Operation cancelled by user")
            sys.exit(1)


def check_prerequisites_enhanced(
    project_id: str | None = None, skip_api_check: bool = True
) -> dict[str, str]:
    """Check prerequisites using comprehensive prerequisite utilities"""
    log_step("Prerequisites", "Checking prerequisites (comprehensive)...")

    # Get project ID if not provided
    if project_id is None:
        project_id = run_command("gcloud config get-value project") or "unknown"

    # Use comprehensive prerequisite validation
    try:
        # Skip API check when called from setup scripts (APIs will be enabled later)
        if skip_api_check:
            # Only check commands and authentication, APIs will be enabled in Phase 3
            missing_items = check_deployment_prerequisites(
                project_id=project_id,
                required_commands=["gcloud"],
                required_apis=[],  # Skip API check - will be enabled later
            )
            if missing_items:
                error_message = "Missing basic prerequisites:\n"
                for item in missing_items:
                    error_message += f"  • {item}\n"
                error_message += "\nPlease resolve these issues before proceeding."
                raise PrerequisiteError(error_message)
        else:
            # Full validation including APIs (for deployment scripts)
            validate_deployment_environment(project_id, "development")

        log_success("All prerequisites validated successfully")

        # Get detailed prerequisite summary
        summary = get_prerequisite_summary(project_id, "development")

        # Return essential information
        return {
            "active_account": summary["authentication"].get("account_email", "unknown"),
            "active_project": project_id,
            "gcloud_version": run_command("gcloud --version | head -1") or "unknown",
            "overall_status": summary["overall_status"],
        }
    except PrerequisiteError as e:
        handle_script_error(e, "Prerequisites check failed")
        raise


class BillingNotEnabledError(Exception):
    """Special exception for when billing is not enabled - allows clean exit"""

    def __init__(self, project_id: str, browser_opened: bool = False):
        self.project_id = project_id
        self.browser_opened = browser_opened
        super().__init__(f"Billing not enabled for project {project_id}")


def check_project_billing(project_id: str) -> None:
    """
    Check if billing is enabled for the selected project.

    Args:
        project_id: Google Cloud project ID to check

    Raises:
        BillingNotEnabledError: If billing is not enabled (for clean exit handling)
        ConfigurationError: If billing status cannot be determined
    """
    log_step("Billing", f"Checking billing status for project {project_id}...")

    try:
        # Check if billing is enabled for the project
        result = run_command(
            f"gcloud billing projects describe {project_id} "
            "--format='value(billingEnabled)'"
        )

        billing_enabled = result.strip().lower() == "true"

        if billing_enabled:
            log_success("Billing is enabled for this project")
            return

        # Billing is not enabled - provide helpful error and guidance
        log_error("Billing is not enabled for this project")
        log("")
        log(f"{Colors.BOLD}BILLING REQUIRED{Colors.RESET}")
        log(
            "Google Cloud requires billing to be enabled before creating resources like:"
        )
        log("  • Storage buckets")
        log("  • Service accounts")
        log("  • Secret Manager secrets")
        log("  • Enabling APIs")
        log("")
        log(f"{Colors.BOLD}TO FIX THIS:{Colors.RESET}")
        log(
            f"1. Open: https://console.cloud.google.com/billing/projects?project={project_id}"
        )
        log("2. Link a billing account to this project")
        log("3. Re-run this setup script")
        log("")

        # Offer to open billing console automatically
        open_billing = (
            prompt_user("Would you like me to open the billing console for you?", "y")
            .lower()
            .startswith("y")
        )

        browser_opened = False
        if open_billing:
            import webbrowser

            billing_url = f"https://console.cloud.google.com/billing/projects?project={project_id}"
            try:
                webbrowser.open(billing_url)
                log_success("Opened billing console in your browser")
                browser_opened = True
            except Exception as e:
                log_warning(f"Could not auto-open browser: {e}")
                log(f"Please visit: {billing_url}")

        log("")
        log("Please enable billing for your project and then re-run this script.")
        if browser_opened:
            log("Exiting setup to allow you to configure billing...")

        # Raise special exception instead of sys.exit() to allow clean handling
        raise BillingNotEnabledError(project_id, browser_opened)

    except subprocess.CalledProcessError as e:
        # If the command fails, it might be due to missing billing API access
        log_error("Could not check billing status")
        log("This might mean:")
        log("  • Billing API is not enabled")
        log("  • You don't have billing permissions")
        log("  • Project doesn't exist")
        log("")
        log(
            f"Please ensure billing is enabled: https://console.cloud.google.com/billing/projects?project={project_id}"
        )

        raise ConfigurationError(
            f"Could not verify billing status for project {project_id}: {e}"
        ) from e


def select_project_interactive() -> str:
    """Interactive project selection with formatted table and numbered choices"""
    try:
        # Get list of projects
        projects_output = run_command(
            'gcloud projects list --format="value(projectId,name)"'
        )

        # Parse projects into list of tuples
        projects = []
        for line in projects_output.split("\n"):
            if line.strip():
                try:
                    project_id, name = line.split("\t", 1)
                    projects.append((project_id.strip(), name.strip()))
                except ValueError:
                    # Handle cases where name might be missing
                    project_id = line.strip()
                    projects.append((project_id, project_id))

        if not projects:
            log_warning("No Google Cloud projects found")
            return prompt_user("Enter your Google Cloud Project ID manually")

        # Display beautiful table
        log("\n📋 Available Google Cloud Projects:")
        log("=" * 80)
        log(f"{'#':<3} {'Project ID':<25} {'Project Name'}")
        log("-" * 80)

        for i, (project_id, name) in enumerate(projects, 1):
            # Truncate long names for display
            display_name = name[:45] + "..." if len(name) > 48 else name
            log(f"{i:<3} {project_id:<25} {display_name}")

        log("-" * 80)
        log(f"Found {len(projects)} projects")

        # Get user selection
        while True:
            try:
                choice_input = prompt_user(
                    f"Select project by number (1-{len(projects)}) or enter project ID manually"
                )

                # Try to parse as number first
                try:
                    choice_num = int(choice_input)
                    if 1 <= choice_num <= len(projects):
                        selected_project = projects[choice_num - 1][0]
                        selected_name = projects[choice_num - 1][1]
                        log_success(f"Selected: {selected_project} ({selected_name})")
                        return selected_project
                    else:
                        log_error(
                            f"Please choose a number between 1 and {len(projects)}"
                        )
                        continue
                except ValueError:
                    # Not a number, treat as manual project ID input
                    manual_project_id = choice_input.strip()
                    # Clean quotes from manual project ID input
                    if len(manual_project_id) >= 2:
                        if (
                            manual_project_id.startswith('"')
                            and manual_project_id.endswith('"')
                        ) or (
                            manual_project_id.startswith("'")
                            and manual_project_id.endswith("'")
                        ):
                            manual_project_id = manual_project_id[1:-1]
                            log(
                                f"  ✓ Cleaned project ID (removed quotes): {Colors.GREEN}{manual_project_id}{Colors.RESET}"
                            )

                    if manual_project_id:
                        log(f"Using manual project ID: {manual_project_id}")
                        return manual_project_id
                    else:
                        log_error("Please enter a valid number or project ID")
                        continue

            except KeyboardInterrupt:
                log_error("Setup cancelled by user")
                sys.exit(1)

    except Exception as e:
        log_warning(f"Could not list projects: {e}")
        log("Falling back to manual entry...")
        return prompt_user("Enter your Google Cloud Project ID")


def load_and_validate_config_for_prod() -> tuple[dict[str, Any], str]:
    """Prepare an idempotent production configuration and project selection.

    Returns:
        (prod_config, project_id)

    prod_config will contain at least:
        - environment: "production"
        - description, bucket_suffix, service_name, log_level
        - project_id and region (us-central1)
    """
    # Production configuration structure
    prod_config: dict[str, Any] = {
        "environment": "production",
        "description": "Production environment - high-performance for live traffic",
        "bucket_suffix": "-prod",
        "service_name": "rag-processor",
        "log_level": "info",
        "region": "us-central1",
    }

    # Try to reuse environment override, otherwise always prompt for RAG SaaS projects
    env_project = os.getenv("GOOGLE_CLOUD_PROJECT_ID", "").strip()
    if env_project and not is_placeholder_value(env_project):
        project_id = env_project
    else:
        # Always prompt for project selection for new RAG SaaS deployments
        project_id = select_project_interactive()

    # Validate format early
    if not validate_gcp_project_id(project_id):
        raise ConfigurationError(f"Invalid GCP project ID: {project_id}")

    # Ensure project is accessible and set as active for subsequent commands
    describe_result = subprocess.run(
        ["gcloud", "projects", "describe", project_id, "--quiet"],
        capture_output=True,
        text=True,
    )
    if describe_result.returncode != 0:
        raise ConfigurationError(
            f"Project {project_id} does not exist or is not accessible"
        )

    set_result = subprocess.run(
        ["gcloud", "config", "set", "project", project_id, "--quiet"],
        capture_output=True,
        text=True,
    )
    if set_result.returncode != 0:
        raise ConfigurationError(f"Cannot set project {project_id}")

    prod_config["project_id"] = project_id

    log_success("Production configuration loaded")
    return prod_config, project_id


def load_and_validate_config_for_dev() -> tuple[dict[str, Any], str]:
    """Prepare an idempotent development configuration and project selection.

    Returns:
        (dev_config, project_id)

    dev_config will contain at least:
        - environment: "development"
        - description, bucket_suffix, service_name, log_level
        - project_id and region (us-central1)
    """
    # Default structure used throughout the setup pipeline
    dev_config: dict[str, Any] = {
        "environment": "development",
        "description": "Development environment - cost-effective for testing",
        "bucket_suffix": "-dev",
        "service_name": "rag-processor",
        "log_level": "debug",
        "region": "us-central1",
    }

    # Try to reuse environment override, otherwise always prompt for RAG SaaS projects
    env_project = os.getenv("GOOGLE_CLOUD_PROJECT_ID", "").strip()
    if env_project and not is_placeholder_value(env_project):
        project_id = env_project
    else:
        # Always prompt for project selection for new RAG SaaS deployments
        # This prevents accidental reuse of unrelated gcloud default projects
        project_id = select_project_interactive()

    # Validate format early
    if not validate_gcp_project_id(project_id):
        raise ConfigurationError(f"Invalid GCP project ID: {project_id}")

    # Ensure project is accessible and set as active for subsequent commands
    describe_result = subprocess.run(
        ["gcloud", "projects", "describe", project_id, "--quiet"],
        capture_output=True,
        text=True,
    )
    if describe_result.returncode != 0:
        raise ConfigurationError(
            f"Project {project_id} does not exist or is not accessible"
        )

    set_result = subprocess.run(
        ["gcloud", "config", "set", "project", project_id, "--quiet"],
        capture_output=True,
        text=True,
    )
    if set_result.returncode != 0:
        raise ConfigurationError(f"Cannot set project {project_id}")

    dev_config["project_id"] = project_id

    log_success("Development configuration loaded")
    return dev_config, project_id


def get_user_configuration(env_config: dict[str, Any]) -> dict[str, Any]:
    """Get configuration from user prompts with comprehensive validation"""
    log_step(
        "Configuration",
        f"Gathering {env_config['environment']} environment configuration...",
    )

    config: dict[str, Any] = {}
    config["env_config"] = env_config

    # Project ID - check if already provided in env_config
    log(f"\n{Colors.BOLD}1. Google Cloud Project Configuration{Colors.RESET}")
    if "project_id" in env_config and env_config["project_id"]:
        project_id = env_config["project_id"]
        log(f"Using project ID from configuration: {project_id}")
    else:
        # Prefer environment override before prompting
        env_project = os.getenv("GOOGLE_CLOUD_PROJECT_ID", "").strip()
        if env_project and not is_placeholder_value(env_project):
            project_id = env_project
            log(f"Using project ID from environment: {project_id}")
        else:
            project_id = select_project_interactive()
    config["project_id"] = project_id

    # Validate project ID format and accessibility
    try:
        # Validate format first
        validate_and_raise(
            validate_gcp_project_id(project_id),
            f"Invalid GCP project ID: '{project_id}'. Must be 6-30 characters, start with a letter, lowercase letters, numbers, and hyphens only.",
        )

        # Check project exists and accessibility using subprocess to avoid error logging
        # Additional validation right before subprocess call for security
        if not validate_gcp_project_id(config["project_id"]):
            raise ConfigurationError(f"Invalid project ID: {config['project_id']}")

        describe_result = subprocess.run(
            ["gcloud", "projects", "describe", config["project_id"], "--quiet"],
            capture_output=True,
            text=True,
        )

        if describe_result.returncode != 0:
            raise Exception(
                f"Project {config['project_id']} does not exist or is not accessible"
            )

        # Set project
        # Additional validation right before subprocess call for security
        if not validate_gcp_project_id(config["project_id"]):
            raise ConfigurationError(f"Invalid project ID: {config['project_id']}")

        set_result = subprocess.run(
            ["gcloud", "config", "set", "project", config["project_id"], "--quiet"],
            capture_output=True,
            text=True,
        )

        if set_result.returncode != 0:
            raise Exception(f"Cannot set project {config['project_id']}")

        log_success(f"Project {config['project_id']} is valid and accessible")

        # Check billing OUTSIDE ErrorContext so we can handle it cleanly
        check_project_billing(config["project_id"])

    except BillingNotEnabledError:
        # Handle billing not enabled - exit cleanly without error logging
        sys.exit(0)
    except Exception as e:
        handle_script_error(e, f"Project {config['project_id']} validation failed")
        sys.exit(1)

    # Region configuration with validation
    log(f"\n{Colors.BOLD}2. Deployment Region{Colors.RESET}")
    config["region"] = "us-central1"  # Best performance and feature availability

    # Validate region format
    try:
        validate_and_raise(
            validate_gcp_region(config["region"]),
            f"Invalid GCP region: '{config['region']}'. Must be valid GCP region format (e.g., us-central1, us-east1, europe-west1).",
        )
        log(
            f"   Using region: {config['region']} (recommended for optimal performance)"
        )
    except ConfigurationError as e:
        handle_script_error(e, "Invalid region configuration")
        sys.exit(1)

    # Storage bucket name with validation and immediate creation
    log(f"\n{Colors.BOLD}3. Storage Configuration{Colors.RESET}")
    log("📦 Configure Google Cloud Storage bucket for your documents")
    log(
        f"   This bucket will store uploaded files for {env_config['environment']} processing"
    )

    # Loop until we get a valid bucket name that we can create or access
    bucket_name_validated = False
    while not bucket_name_validated:
        # Check if bucket name is already set in environment, otherwise generate default
        env_bucket_name = os.getenv("GOOGLE_CLOUD_STORAGE_BUCKET")
        if env_bucket_name and not is_placeholder_value(env_bucket_name):
            default_bucket = env_bucket_name
        else:
            default_bucket = (
                f"{config['project_id']}-rag-documents{env_config['bucket_suffix']}"
            )

        config["bucket_name"] = prompt_user(
            f"Bucket name for {env_config['environment']} document storage",
            default_bucket,
        )

        # Validate bucket name format
        try:
            validate_and_raise(
                validate_gcs_bucket_name(config["bucket_name"]),
                f"Invalid GCS bucket name: '{config['bucket_name']}'. Must be 3-63 characters, lowercase letters, numbers, hyphens, underscores, and dots, no 'google' keyword.",
            )
            log_success(f"Bucket name validation passed: {config['bucket_name']}")
        except ConfigurationError as e:
            log_error(f"Invalid bucket name: {e}")
            log("Please try a different bucket name.")
            continue

        # Check if bucket exists and handle accordingly
        # Use subprocess directly to avoid error logging for expected "bucket doesn't exist" case
        bucket_exists = False
        try:
            # Additional validation right before subprocess call for security
            if not validate_gcs_bucket_name(config["bucket_name"]):
                raise ConfigurationError(
                    f"Invalid bucket name: {config['bucket_name']}"
                )

            # Check bucket existence without ErrorContext to avoid logging expected failures
            subprocess.run(
                ["gcloud", "storage", "ls", f"gs://{config['bucket_name']}/"],
                capture_output=True,
                text=True,
                check=True,
            )
            bucket_exists = True
            log_success(
                f"Bucket {config['bucket_name']} already exists and is accessible - will reuse existing bucket"
            )
            log("   This is normal when re-running the setup script")
            bucket_name_validated = True

        except subprocess.CalledProcessError:
            # Bucket doesn't exist OR we don't have permission to access it
            # This is expected behavior, not an error
            bucket_exists = False

        if not bucket_exists:
            # Try to create it to determine which case we're in
            try:
                log(f"Creating bucket: {config['bucket_name']}")
                run_command(
                    f"""gcloud storage buckets create \
                    gs://{config["bucket_name"]} \
                    --project={config["project_id"]} \
                    --default-storage-class=STANDARD \
                    --location={config["region"]}"""
                )
                log_success(
                    f"Bucket created successfully: gs://{config['bucket_name']}"
                )
                bucket_name_validated = True

            except Exception as create_error:
                # Check if the error indicates the bucket name is taken
                error_msg = str(create_error).lower()
                if (
                    "already exists" in error_msg
                    or "conflict" in error_msg
                    or "bucket name is not available" in error_msg
                ):
                    log_error(
                        f"❌ Bucket name '{config['bucket_name']}' is already taken by another project"
                    )
                    log("💡 Please choose a different bucket name")
                    # Continue the loop to ask for a new name
                else:
                    # Some other error occurred during bucket creation
                    log_error(f"Failed to create bucket: {create_error}")
                    log(
                        "💡 Please try a different bucket name or check your permissions"
                    )
                    # Continue the loop to ask for a new name

    # Database URL with comprehensive validation
    log(f"\n{Colors.BOLD}4. Database Configuration{Colors.RESET}")
    log("🐘 Configure PostgreSQL database connection for the RAG processor")

    # Check if database URL is already available from environment
    database_url_env = os.getenv("DATABASE_URL")
    if database_url_env and not is_placeholder_value(database_url_env):
        log(f"Found DATABASE_URL in environment: {database_url_env[:30]}...")
        try:
            validate_and_raise(
                validate_database_url(database_url_env),
                f"Invalid existing DATABASE_URL: '{database_url_env[:30]}...'. Must be valid PostgreSQL URL.",
            )
            config["database_url"] = database_url_env
            log_success("Using existing DATABASE_URL from environment")
        except ConfigurationError as e:
            log_error(f"Existing DATABASE_URL is invalid: {e}")
            log("Please ensure it's a valid PostgreSQL URL.")
            config["database_url"] = prompt_user("Pooled PostgreSQL URL (port 6543)")
            # Validate prompted database URL
            try:
                validate_and_raise(
                    validate_database_url(config["database_url"]),
                    f"Invalid database URL: '{config['database_url'][:30]}...'. Must be valid PostgreSQL URL.",
                )
                log_success("Database URL validation passed")
            except ConfigurationError as e:
                handle_script_error(e, "Invalid database URL configuration")
                sys.exit(1)
    else:
        log(
            "   ⚠️  IMPORTANT: Use the pooled connection string (port 6543) for better connection management"
        )
        log("")
        log("   Pooled connection format (port 6543):")
        log(
            "   postgresql://postgres.<YOUR-DB-USERNAME>:<YOUR-PASSWORD>@<your-region>.pooler.supabase.com:6543/postgres"
        )
        log("")
        log("   🔍 In Supabase Dashboard:")
        log("   • Go to Settings → Database → Connection String")
        log("   • Select 'Connection pooling' tab (NOT 'URI')")
        log(
            "   • Copy the connection string and replace placeholders with your actual credentials"
        )
        log("")
        log(
            "   💡 Use the pooled DATABASE_URL (port 6543) for better connection management"
        )
        config["database_url"] = prompt_user("Pooled PostgreSQL URL (port 6543)")
        # Validate prompted database URL
        try:
            validate_and_raise(
                validate_database_url(config["database_url"]),
                f"Invalid database URL: '{config['database_url'][:30]}...'. Must be valid PostgreSQL URL.",
            )
            log_success("Database URL validation passed")
        except ConfigurationError as e:
            handle_script_error(e, "Invalid database URL configuration")
            sys.exit(1)

    # API key validation is already done above when checking environment variable
    # or when prompting user for new value (if needed later)

    # Gemini API key
    log(f"\n{Colors.BOLD}5. Gemini AI Configuration{Colors.RESET}")
    log("🤖 Configure Gemini AI API key for AI processing")
    log(
        "   You can get this from Google AI Studio: https://aistudio.google.com/app/apikey"
    )
    log("   This key will be used to power the AI features of your RAG processor")

    # Check if Gemini API key is already available from environment
    gemini_api_key_env = os.getenv("GEMINI_API_KEY")
    if gemini_api_key_env and not is_placeholder_value(gemini_api_key_env):
        log(f"Found GEMINI_API_KEY in environment: {gemini_api_key_env[:8]}...")
        try:
            validate_and_raise(
                validate_api_key(gemini_api_key_env),
                f"Invalid existing Gemini API key: '{gemini_api_key_env[:8]}...'. Must be valid API key.",
            )
            config["gemini_api_key"] = gemini_api_key_env
            log_success("Using existing Gemini API key from environment")
        except ConfigurationError as e:
            log_error(f"Existing Gemini API key is invalid: {e}")
            log("Please ensure it's a valid Gemini API key.")
            config["gemini_api_key"] = prompt_user("Gemini API key")
            # Validate prompted Gemini API key
            try:
                validate_and_raise(
                    validate_api_key(config["gemini_api_key"]),
                    f"Invalid Gemini API key: '{config['gemini_api_key'][:8]}...'. Must be valid API key.",
                )
                log_success("Gemini API key validation passed")
            except ConfigurationError as e:
                handle_script_error(e, "Invalid Gemini API key configuration")
                sys.exit(1)
    else:
        config["gemini_api_key"] = prompt_user("Gemini API key")
        # Validate prompted Gemini API key
        try:
            validate_and_raise(
                validate_api_key(config["gemini_api_key"]),
                f"Invalid Gemini API key: '{config['gemini_api_key'][:8]}...'. Must be valid API key.",
            )
            log_success("Gemini API key validation passed")
        except ConfigurationError as e:
            handle_script_error(e, "Invalid Gemini API key configuration")
            sys.exit(1)

    # Gemini API key validation is already done above when checking environment variable
    # or when prompting user for new value (if needed later)

    return config


def enable_apis(config: dict[str, Any]) -> None:
    """Enable required Google Cloud APIs in parallel"""
    env_config = config.get("env_config", {})
    environment = env_config.get("environment", "development")

    # Use shared API enabling function
    enable_apis_only(config["project_id"], environment)

    # Ensure Cloud Functions API (Gen2 control plane) is enabled for logs/ops
    try:
        run_command(
            f"gcloud services enable cloudfunctions.googleapis.com --project={config['project_id']} --quiet"
        )
    except Exception as e:
        # If already enabled, ignore; otherwise log warning
        error_str = str(e).lower()
        if "already enabled" not in error_str and "enabled" not in error_str:
            log_warning(f"Could not enable Cloud Functions API: {e}")
        # Continue - deployment will surface critical issues

    # Proactively create the Cloud Storage service identity so it exists by the time
    # we need to grant IAM to it later. This avoids eventual-consistency failures.
    gcs_service_account_exists = False

    try:
        # First, check if the storage service agent exists
        result = run_command(
            f"gcloud storage service-agent --project={config['project_id']}"
        )
        if result and result.strip():
            log(f"   ✅ Cloud Storage service agent found: {result.strip()}")
            gcs_service_account_exists = True
        else:
            # If no result, we need to create it
            raise Exception("Service agent not found, attempting creation")

    except Exception as e:
        # Expected if service identity doesn't exist yet - try creation
        error_str = str(e).lower()
        if "not found" not in error_str and "does not exist" not in error_str:
            log_warning(
                f"Unexpected error checking Cloud Storage service identity: {e}"
            )
        try:
            run_command(
                f"gcloud beta services identity create --service=storage.googleapis.com --project={config['project_id']} --quiet"
            )
            log("   ✅ Cloud Storage service identity creation initiated")
        except Exception as create_error:
            error_msg = str(create_error)
            if "already exists" in error_msg.lower():
                log(
                    "   ℹ️  Cloud Storage service identity already exists", Colors.YELLOW
                )
                gcs_service_account_exists = True
            else:
                # Last resort: try alternative method to get service account
                try:
                    # Using modern gcloud storage command (gsutil deprecated in 2025)
                    result = run_command(
                        f"gcloud storage service-agent --project={config['project_id']}"
                    )
                    if result:
                        log(
                            f"   ✅ Cloud Storage service account found via fallback: {result.strip()}"
                        )
                        gcs_service_account_exists = True
                except Exception as fallback_e:
                    fallback_str = str(fallback_e).lower()
                    if (
                        "already exists" in fallback_str
                        or "already created" in fallback_str
                    ):
                        log("   ✅ Cloud Storage service identity already exists")
                        gcs_service_account_exists = True
                    else:
                        log_warning(
                            f"Could not create Cloud Storage service identity: {str(fallback_e)[:100]}"
                        )

    # Only wait if we haven't already confirmed the service account exists
    if not gcs_service_account_exists:
        # Check if GCS service account exists before waiting (optimization)
        try:
            project_number = run_command(
                f"gcloud projects describe {config['project_id']} --format='value(projectNumber)'"
            ).strip()
            gcs_service_sa = (
                f"service-{project_number}@gs-project-accounts.iam.gserviceaccount.com"
            )

            # First check if service account already exists
            check_result = subprocess.run(
                [
                    "gcloud",
                    "iam",
                    "service-accounts",
                    "describe",
                    gcs_service_sa,
                    f"--project={config['project_id']}",
                    "--quiet",
                ],
                capture_output=True,
                text=True,
            )

            if check_result.returncode == 0:
                log(
                    "   ✅ Cloud Storage service account verified via IAM - skipping wait"
                )
            else:
                # Service account doesn't exist yet, wait for it to propagate
                log(
                    "   🔧 Cloud Storage service account not yet visible in IAM - waiting for propagation..."
                )
                import time

                for attempt in range(8):  # wait up to ~2 minutes total
                    wait_result = subprocess.run(
                        [
                            "gcloud",
                            "iam",
                            "service-accounts",
                            "describe",
                            gcs_service_sa,
                            f"--project={config['project_id']}",
                            "--quiet",
                        ],
                        capture_output=True,
                        text=True,
                    )
                    if wait_result.returncode == 0:
                        log_success("Cloud Storage service account is now ready")
                        break
                    wait = min(15, 2 + attempt * 4)
                    log(
                        f"   ⏳ Waiting for Cloud Storage service identity to propagate... retrying in {wait}s (attempt {attempt+1}/8)"
                    )
                    time.sleep(wait)
        except Exception as e:
            # Best effort only - log warning for visibility
            log_warning(
                f"Could not wait for Cloud Storage service identity propagation: {e}"
            )
            pass


def create_service_account(config: dict[str, Any]) -> None:
    """Create service accounts with appropriate permissions for queue architecture"""
    env_config = config["env_config"]
    log_step(
        "IAM",
        f"Creating service accounts for {env_config['environment']} environment...",
    )

    env_suffix = "dev" if env_config["environment"] == "development" else "prod"

    # Create multiple service accounts for different components
    service_accounts = [
        {
            "id": f"rag-processor-{env_suffix}",
            "display_name": f"RAG Processor Service Account ({env_suffix})",
            "description": f"Service account for RAG processor Cloud Run Job ({env_suffix})",
        },
        {
            "id": f"rag-gcs-handler-{env_suffix}",
            "display_name": f"RAG GCS Handler Service Account ({env_suffix})",
            "description": f"Service account for GCS event handler function ({env_suffix})",
        },
        {
            "id": f"rag-task-processor-{env_suffix}",
            "display_name": f"RAG Task Processor Service Account ({env_suffix})",
            "description": f"Service account for task processor function ({env_suffix})",
        },
    ]

    # Create all service accounts (with idempotency check)
    for sa_config in service_accounts:
        service_account_id = sa_config["id"]
        service_account_email = (
            f"{service_account_id}@{config['project_id']}.iam.gserviceaccount.com"
        )

        try:
            # Check if service account already exists
            if not validate_gcp_project_id(config["project_id"]):
                raise ConfigurationError(f"Invalid project ID: {config['project_id']}")

            result = subprocess.run(
                [
                    "gcloud",
                    "iam",
                    "service-accounts",
                    "describe",
                    service_account_email,
                    f"--project={config['project_id']}",
                    "--quiet",
                ],
                capture_output=True,
                text=True,
            )

            if result.returncode == 0:
                log_warning(
                    f"Service account {service_account_email} already exists - will reuse"
                )
            else:
                # Service account doesn't exist, create it
                run_command(
                    f"""gcloud iam service-accounts create {service_account_id} \
                    --display-name="{sa_config['display_name']}" \
                    --description="{sa_config['description']}" \
                    --project={config["project_id"]} """
                )
                log_success(f"Service account created: {service_account_email}")

        except Exception as e:
            # Check if service account already exists or if this is a real error
            error_str = str(e).lower()
            if "already exists" in error_str or "already created" in error_str:
                log(f"✅ Service account already exists: {service_account_email}")
            else:
                log_warning(
                    f"Error checking/creating service account {service_account_id}: {e}"
                )
            # Fallback: try to create service account
            try:
                run_command(
                    f"""gcloud iam service-accounts create {service_account_id} \
                    --display-name="{sa_config['display_name']}" \
                    --description="{sa_config['description']}" \
                    --project={config["project_id"]} """
                )
                log_success(f"Service account created: {service_account_email}")
            except Exception as e:
                log_error(f"Failed to create service account {service_account_id}: {e}")
                raise e

    # Store primary processor service account email for compatibility
    processor_sa_id = f"rag-processor-{env_suffix}"
    config["service_account_email"] = (
        f"{processor_sa_id}@{config['project_id']}.iam.gserviceaccount.com"
    )

    # Wait for service account to propagate (Google Cloud IAM eventual consistency)
    def check_service_account_exists() -> bool:
        """Check if service account is visible to IAM API"""
        # Additional validation right before subprocess call for security
        if not validate_gcp_project_id(config["project_id"]):
            raise ConfigurationError(f"Invalid project ID: {config['project_id']}")

        result = subprocess.run(
            [
                "gcloud",
                "iam",
                "service-accounts",
                "describe",
                service_account_email,
                f"--project={config['project_id']}",
                "--quiet",
            ],
            capture_output=True,
            text=True,
        )
        return result.returncode == 0

    # Use existing utility function for service account propagation
    wait_for_service_account_readiness(
        check_function=check_service_account_exists,
        description="service account to propagate through Google Cloud systems",
        max_wait_minutes=1,  # 60 seconds max wait
        check_interval_seconds=5,
        initial_wait_seconds=2,  # Quick initial check
    )

    # Define roles for each service account based on their specific responsibilities
    service_account_roles = {
        f"rag-processor-{env_suffix}": [
            "roles/storage.admin",  # Required for GCS file access
            "roles/secretmanager.secretAccessor",  # Required for secrets access
            "roles/aiplatform.user",  # Required for Vertex AI/GenAI
            "roles/speech.client",  # Required for audio transcription
            "roles/artifactregistry.writer",  # Required for image pushes during build
        ],
        f"rag-gcs-handler-{env_suffix}": [
            "roles/secretmanager.secretAccessor",  # Required for database secret access
            "roles/cloudtasks.enqueuer",  # Required to create Cloud Tasks
            "roles/storage.objectViewer",  # Required to read GCS event data
        ],
        f"rag-task-processor-{env_suffix}": [
            "roles/run.invoker",  # Required to invoke Cloud Run services
            "roles/run.developer",  # Required to execute Cloud Run Jobs with overrides
            "roles/iam.serviceAccountUser",  # Required to act as service account for jobs
        ],
    }

    log(
        "   🔐 Assigning IAM roles to service accounts (required to avoid policy conflicts)..."
    )
    log(
        "   💡 Note: IAM operations must be sequential due to read-modify-write conflicts"
    )

    success_count = 0
    max_retries = 5  # Increased retries for service account propagation

    # Assign roles to each service account
    for service_account_id, roles in service_account_roles.items():
        service_account_email = (
            f"{service_account_id}@{config['project_id']}.iam.gserviceaccount.com"
        )
        log(f"   📝 Configuring permissions for {service_account_id}...")

        for role in roles:
            try:
                # Add exponential backoff retry for IAM operations
                for attempt in range(max_retries):
                    try:
                        run_command(
                            f"gcloud projects add-iam-policy-binding {config['project_id']} "
                            f"--member=serviceAccount:{service_account_email} "
                            f"--role={role} --quiet"
                        )
                        log(f"    ✓ {role}")
                        success_count += 1
                        break  # Success, exit retry loop
                    except Exception as e:
                        error_str = str(e).lower()
                        # Handle both concurrent policy changes AND service account propagation delays
                        if (
                            "concurrent policy changes" in error_str
                            or "does not exist" in error_str
                            or "invalid_argument" in error_str
                        ) and attempt < max_retries - 1:
                            import time

                            wait_time = (
                                2**attempt
                            ) + 1  # Exponential backoff: 2, 5, 9, 17, 33 seconds

                            if "does not exist" in error_str:
                                log(
                                    f"    ⏳ Service account not yet visible to IAM for {role}, retrying in {wait_time}s (attempt {attempt + 1}/{max_retries})..."
                                )
                                log(
                                    "       💡 This is normal - Google Cloud IAM has eventual consistency"
                                )
                            else:
                                log(
                                    f"    ⏳ IAM conflict detected for {role}, retrying in {wait_time}s (attempt {attempt + 1}/{max_retries})..."
                                )

                            time.sleep(wait_time)
                        else:
                            # Max retries reached or different error
                            raise e
            except Exception as e:
                log_warning(
                    f"Could not assign {role} after {max_retries} attempts: {e}"
                )
                log(
                    "       💡 If this persists, try running the script again in a few minutes"
                )

    # Calculate total roles across all service accounts
    total_roles = sum(len(roles) for roles in service_account_roles.values())

    if success_count == total_roles:
        log_success("All service account permissions configured successfully")
    else:
        log_success(
            f"Service account permissions configured ({success_count}/{total_roles} successful)"
        )

    # Grant cross-service-account permissions for queue architecture
    log("   🔐 Granting cross-service-account permissions for queue architecture...")

    processor_sa = (
        f"rag-processor-{env_suffix}@{config['project_id']}.iam.gserviceaccount.com"
    )
    gcs_handler_sa = (
        f"rag-gcs-handler-{env_suffix}@{config['project_id']}.iam.gserviceaccount.com"
    )
    task_processor_sa = f"rag-task-processor-{env_suffix}@{config['project_id']}.iam.gserviceaccount.com"

    # CRITICAL: Task Processor must be able to act as RAG Processor when executing Cloud Run Jobs
    try:
        log("   🔑 Granting Task Processor permission to act as RAG Processor...")
        run_command(
            f"gcloud iam service-accounts add-iam-policy-binding {processor_sa} "
            f"--member=serviceAccount:{task_processor_sa} "
            f"--role=roles/iam.serviceAccountUser "
            f"--project={config['project_id']} --quiet"
        )
        log_success("Task Processor can now act as RAG Processor for Cloud Run Jobs")

    except Exception as e:
        log_warning(f"Could not grant cross-account permission: {e}")
        log("   💡 You may need to manually grant this permission:")
        log(
            f"      gcloud iam service-accounts add-iam-policy-binding {processor_sa} \\"
        )
        log(f"        --member=serviceAccount:{task_processor_sa} \\")
        log("        --role=roles/iam.serviceAccountUser")

    # Grant GCS Handler self-impersonation for Cloud Tasks OIDC tokens
    try:
        log("   🔑 Granting GCS Handler self-impersonation for Cloud Tasks...")
        run_command(
            f"gcloud iam service-accounts add-iam-policy-binding {gcs_handler_sa} "
            f"--member=serviceAccount:{gcs_handler_sa} "
            f"--role=roles/iam.serviceAccountUser "
            f"--project={config['project_id']} --quiet"
        )
        log_success("GCS Handler can create OIDC tokens for Cloud Tasks")
    except Exception as e:
        error_str = str(e).lower()
        if "already has" in error_str or "already contains" in error_str:
            log("  ✓ Self-impersonation permission already exists")
        else:
            log_warning(f"Could not grant GCS Handler self-impersonation: {e}")

    # Note: Cross-function invoke permissions will be configured during function deployments
    log("   💡 Cross-function invoke permissions will be configured during deployments")

    # Grant Secret Manager access to default compute service account for Cloud Functions deployment
    log("   🔐 Granting Secret Manager access to default compute service account...")
    log(
        "   💡 This is required for Cloud Functions Gen 2 deployment (secret bootstrapping)"
    )

    try:
        # Get project number to construct the default compute service account
        project_number_result = run_command(
            f"gcloud projects describe {config['project_id']} --format='value(projectNumber)'"
        )
        project_number = project_number_result.strip()
        default_compute_sa = f"{project_number}-compute@developer.gserviceaccount.com"

        # Grant Secret Manager access to default compute service account
        run_command(
            f"gcloud projects add-iam-policy-binding {config['project_id']} "
            f"--member=serviceAccount:{default_compute_sa} "
            f"--role=roles/secretmanager.secretAccessor "
            f"--quiet"
        )
        log_success("Default compute service account granted Secret Manager access")
    except Exception as e:
        error_str = str(e).lower()
        if (
            "already has" in error_str
            or "already contains" in error_str
            or "already exists" in error_str
        ):
            log("  ✓ Default compute service account already has Secret Manager access")
        else:
            log_warning(
                f"Could not grant Secret Manager access to default compute SA: {e}"
            )
            log("     💡 Cloud Functions deployment may fail. Manual fix:")
            log(
                f"        gcloud projects add-iam-policy-binding {config['project_id']} \\"
            )
            log(
                "          --member=serviceAccount:<PROJECT_NUMBER>-compute@developer.gserviceaccount.com \\"
            )
            log("          --role=roles/secretmanager.secretAccessor")

    # Grant Pub/Sub Publisher access to GCS service account for EventArc triggers
    log("   🔐 Granting Pub/Sub Publisher access to GCS service account...")
    log(
        "   💡 This is required for EventArc GCS triggers (file upload → Cloud Function)"
    )

    try:
        # First ensure the GCS service identity exists
        project_id = config["project_id"]

        # Create GCS service identity if it doesn't exist (idempotent)
        try:
            run_command(
                f"gcloud beta services identity create --service=storage.googleapis.com --project={project_id} --quiet"
            )
            log("   ✅ GCS service identity ensured")
        except Exception as identity_e:
            if "already exists" in str(identity_e).lower():
                log("   ✅ GCS service identity already exists")
            else:
                log_warning(f"Could not ensure GCS service identity: {identity_e}")

        # Get the actual GCS service account email (more reliable than computing)
        try:
            gcs_service_account = run_command(
                f"gcloud storage service-agent --project={project_id}"
            ).strip()
            if not gcs_service_account:
                raise Exception("No service account returned")
            log(f"   ✅ Found GCS service account: {gcs_service_account}")
        except Exception:
            # Fallback to computed service account
            project_number = run_command(
                f"gcloud projects describe {project_id} --format='value(projectNumber)'"
            ).strip()
            gcs_service_account = (
                f"service-{project_number}@gs-project-accounts.iam.gserviceaccount.com"
            )
            log(f"   ⚠️  Using computed GCS service account: {gcs_service_account}")

        # Grant Pub/Sub Publisher role to GCS service account with robust retries
        import time

        bind_attempts = 6
        for attempt in range(bind_attempts):
            try:
                run_command(
                    f"gcloud projects add-iam-policy-binding {config['project_id']} "
                    f"--member=serviceAccount:{gcs_service_account} "
                    f"--role=roles/pubsub.publisher --quiet"
                )
                log_success("GCS service account granted Pub/Sub Publisher access")
                break
            except Exception as bind_err:
                if attempt == bind_attempts - 1:
                    raise bind_err
                wait = 5 * (attempt + 1)
                log(
                    f"  ⏳ IAM not yet ready for GCS SA policy binding, retrying in {wait}s (attempt {attempt+1}/{bind_attempts})"
                )
                time.sleep(wait)

    except Exception as e:
        error_str = str(e).lower()
        if (
            "already has" in error_str
            or "already contains" in error_str
            or "already exists" in error_str
        ):
            log("  ✓ GCS service account already has Pub/Sub Publisher access")
        else:
            log_warning(f"Could not grant Pub/Sub Publisher access to GCS SA: {e}")
            log("     💡 EventArc triggers may fail. Manual fix:")
            log("        # Ensure Storage service identity exists:")
            log(
                f"        gcloud beta services identity create --service=storage.googleapis.com --project={config['project_id']}"
            )
            log("        # Get GCS service account:")
            log(
                f"        GCS_SA=$(gcloud storage kms serviceaccount -p {config['project_id']})"
            )
            log("        # Grant Pub/Sub Publisher role:")
            log(
                f"        gcloud projects add-iam-policy-binding {config['project_id']} \\"
            )
            log("          --member=serviceAccount:${GCS_SA} \\")
            log("          --role=roles/pubsub.publisher")


def generate_service_account_key(config: dict[str, Any]) -> str | None:
    """Generate service account key for frontend access (optional)"""
    service_account_email = config["service_account_email"]
    project_id = config["project_id"]
    env_config = config["env_config"]

    log("   🔑 Generating service account key for frontend access...")
    log("   💡 This creates a JSON key file for frontend GCS operations")

    try:
        # Idempotency: if the key is already available via environment or config, reuse it.
        # .env.local (if present) was already loaded at module import time via dotenv.
        existing_key = config.get("service_account_key_base64") or os.getenv(
            "GOOGLE_CLOUD_SERVICE_ACCOUNT_KEY", ""
        )
        if existing_key:
            log(
                "   ✓ Existing base64 service account key detected - reusing current value"
            )
            return existing_key

        # Generate key file name
        key_filename = f"service-account-key-{env_config['environment']}.json"

        # Generate service account key
        run_command(
            f"gcloud iam service-accounts keys create {key_filename} "
            f"--iam-account={service_account_email} "
            f"--project={project_id} "
            f"--quiet"
        )

        # Read the key file and encode it as base64 for environment variable
        key_path = Path(key_filename)
        if key_path.exists():
            import base64

            key_content = key_path.read_text()
            encoded_key = base64.b64encode(key_content.encode()).decode()

            log_success(f"Service account key generated: {key_filename}")
            log("   💡 Key file created and base64-encoded for environment variable")

            # Clean up the JSON file (we have the base64 version)
            key_path.unlink()

            return encoded_key
        else:
            log_warning("Key file was not created")
            return None

    except Exception as e:
        log_warning(f"Could not generate service account key: {e}")
        log("     💡 You can generate it manually later:")
        log("        gcloud iam service-accounts keys create key.json \\")
        log(f"          --iam-account={service_account_email} \\")
        log(f"          --project={project_id}")
        return None


def grant_user_cloud_build_permissions(config: dict[str, Any]) -> None:
    """Grant Cloud Build and service account permissions to the current user account for deployment"""
    try:
        # Get current user's email address
        user_email = run_command(
            'gcloud auth list --filter=status:ACTIVE --format="value(account)"'
        ).strip()

        if not user_email:
            log_warning(
                "Could not determine current user email - skipping permission grants"
            )
            log(
                "   You may need to manually grant Cloud Build Editor and Service Account User roles to your user account"
            )
            return

        log(f"   🔑 Granting deployment permissions to user: {user_email}")

        # Grant Cloud Build Editor role to the user
        try:
            run_command(
                f"gcloud projects add-iam-policy-binding {config['project_id']} "
                f"--member=user:{user_email} "
                f"--role=roles/cloudbuild.builds.editor --quiet"
            )
            log_success(f"Cloud Build Editor role granted to {user_email}")
            log("   ✅ User can now submit Cloud Build jobs during deployment")
        except Exception as e:
            log_warning(f"Could not grant Cloud Build Editor role: {e}")
            log("   💡 You may need to manually grant this role:")
            log(
                f"      gcloud projects add-iam-policy-binding {config['project_id']} \\"
            )
            log(f"        --member=user:{user_email} \\")
            log("        --role=roles/cloudbuild.builds.editor")

        # Grant Service Account User role to deploy Cloud Functions with custom service account
        log(
            f"   🔑 Granting Service Account User permission for: {config['service_account_email']}"
        )
        try:
            run_command(
                f"gcloud iam service-accounts add-iam-policy-binding {config['service_account_email']} "
                f"--member=user:{user_email} "
                f"--role=roles/iam.serviceAccountUser "
                f"--project={config['project_id']} --quiet"
            )
            log_success(f"Service Account User role granted to {user_email}")
            log("   ✅ User can now deploy Cloud Functions with custom service account")
        except Exception as e:
            error_str = str(e).lower()
            if "already has" in error_str or "already contains" in error_str:
                log("   ✅ Service Account User permission already exists")
            else:
                log_warning(f"Could not grant Service Account User role: {e}")
                log("   💡 You may need to manually grant this role:")
                log(
                    f"      gcloud iam service-accounts add-iam-policy-binding {config['service_account_email']} \\"
                )
                log(f"        --member=user:{user_email} \\")
                log("        --role=roles/iam.serviceAccountUser")

    except Exception as e:
        log_warning(f"Could not grant deployment permissions: {e}")
        log(
            "   💡 You may need to manually grant Cloud Build Editor and Service Account User roles to your user account"
        )
        log("   This is required for deployment scripts to work properly")


def create_storage_bucket(config: dict[str, Any]) -> None:
    """Configure storage bucket (bucket already created during configuration phase)"""
    env_config = config["env_config"]
    log_step("Storage", f"Configuring {env_config['environment']} storage bucket...")

    # Bucket was already created during configuration phase, just configure it
    log(f"Configuring existing bucket: gs://{config['bucket_name']}")

    # Configure CORS
    cors_config = """[
        {
            "origin": ["*"],
            "method": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "responseHeader": ["Content-Type", "Authorization", "Range"],
            "maxAgeSeconds": 3600
        }
    ]"""

    # Validate bucket name before any gcloud storage operations
    bucket_name = config.get("bucket_name")
    if not bucket_name:
        raise ConfigurationError("Bucket name is missing from configuration")
    if not isinstance(bucket_name, str):
        raise ConfigurationError(
            f"Bucket name must be a string, got {type(bucket_name).__name__}"
        )
    if not bucket_name.strip():
        raise ConfigurationError("Bucket name cannot be empty")
    if not validate_gcs_bucket_name(bucket_name):
        raise ConfigurationError(
            f"Invalid bucket name '{bucket_name}': must be 3-63 characters, "
            "start and end with alphanumeric, contain only lowercase letters, "
            "numbers, dots, and dashes"
        )

    cors_file = Path("cors-config.json")
    cors_file.write_text(cors_config)

    try:
        run_command(
            f"gcloud storage buckets update gs://{bucket_name} --cors-file=cors-config.json"
        )
        log_success("CORS configuration applied")
    finally:
        cors_file.unlink(missing_ok=True)

    # Set bucket permissions
    run_command(
        f"gcloud storage buckets add-iam-policy-binding "
        f"gs://{bucket_name} "
        f"--member=serviceAccount:{config['service_account_email']} "
        f"--role=roles/storage.objectAdmin"
    )

    log_success("Storage bucket configured successfully")


def create_artifact_registry_repository(config: dict[str, Any]) -> None:
    """Create Artifact Registry repository for Docker images"""
    env_config = config["env_config"]
    log_step(
        "Artifact Registry",
        f"Setting up {env_config['environment']} Docker repository...",
    )

    # Repository configuration
    repo_name = "rag-services"
    region = "us-central1"
    project_id = config["project_id"]

    log(f"Repository: {repo_name}")
    log(f"Region: {region}")
    log("Format: Docker")

    # Check if repository already exists
    try:
        # Additional validation right before subprocess call for security
        if not validate_gcp_project_id(project_id):
            raise ConfigurationError(f"Invalid project ID: {project_id}")
        if not validate_gcp_region(region):
            raise ConfigurationError(f"Invalid region: {region}")

        result = subprocess.run(
            [
                "gcloud",
                "artifacts",
                "repositories",
                "describe",
                repo_name,
                f"--location={region}",
                f"--project={project_id}",
                "--quiet",
            ],
            capture_output=True,
            text=True,
        )

        if result.returncode == 0:
            log_warning(
                f"Artifact Registry repository '{repo_name}' already exists - will reuse"
            )
            log("   This is normal when re-running the setup script")
        else:
            # Repository doesn't exist, create it
            log(f"Creating Artifact Registry repository '{repo_name}'...")
            run_command(
                f"""gcloud artifacts repositories create {repo_name} \
                --repository-format=docker \
                --location={region} \
                --description="Container images for RAG {env_config['environment']} services" \
                --project={project_id}"""
            )
            log_success(f"Artifact Registry repository '{repo_name}' created")

    except Exception as e:
        raise Exception(f"Failed to create Artifact Registry repository: {e}") from e

    # Grant Cloud Build service account permission to push images
    try:
        # Get project number for Cloud Build service account
        project_number_result = run_command(
            f"gcloud projects describe {project_id} --format='value(projectNumber)'"
        )
        project_number = project_number_result.strip()
        cloud_build_sa = f"{project_number}@cloudbuild.gserviceaccount.com"

        log("Granting artifactregistry.writer role to Cloud Build SA...")
        run_command(
            f"""gcloud artifacts repositories add-iam-policy-binding {repo_name} \
            --location={region} \
            --member=serviceAccount:{cloud_build_sa} \
            --role=roles/artifactregistry.writer \
            --project={project_id}"""
        )
        log_success("Cloud Build permissions configured for Artifact Registry")

        # Grant Cloud Build permission to act as the RAG processor service account
        log("Granting serviceAccountUser role to Cloud Build SA for deployment...")
        service_account_email = config["service_account_email"]
        try:
            run_command(
                f"gcloud iam service-accounts add-iam-policy-binding {service_account_email} "
                f"--member=serviceAccount:{cloud_build_sa} "
                f"--role=roles/iam.serviceAccountUser "
                f"--project={project_id} --quiet"
            )
            log_success("Cloud Build can now deploy with RAG processor service account")
        except Exception as deploy_perm_error:
            log_warning(f"Could not grant serviceAccountUser role: {deploy_perm_error}")
            log("   You may need to manually grant this permission:")
            log(
                f"   gcloud iam service-accounts add-iam-policy-binding {service_account_email} \\"
            )
            log(f"     --member=serviceAccount:{cloud_build_sa} \\")
            log("     --role=roles/iam.serviceAccountUser")

    except Exception as e:
        log_warning(f"Could not configure Cloud Build permissions: {e}")
        log("   You may need to grant permissions manually if Docker builds fail")

    # Store repository info in config for other functions
    config["artifact_registry"] = {
        "repository_name": repo_name,
        "region": region,
        "base_url": f"{region}-docker.pkg.dev/{project_id}/{repo_name}",
    }

    log_success("Artifact Registry setup completed successfully")


def create_cloud_functions_artifact_registry(config: dict[str, Any]) -> None:
    """Ensure Cloud Functions Artifact Registry exists and grant build identities.

    Creates/ensures repository "cloud-functions" in the configured region and
    grants roles/artifactregistry.writer to the identities used by Cloud
    Functions builds so image cache pull/push succeeds out of the box.
    """
    env_config = config["env_config"]
    repo_name = "cloud-functions"
    region = config.get("region", "us-central1")
    project_id = config["project_id"]

    log_step(
        "Artifact Registry", f"Ensuring {repo_name} repository for Cloud Functions..."
    )

    # Describe or create repo
    try:
        if not validate_gcp_project_id(project_id):
            raise ConfigurationError(f"Invalid project ID: {project_id}")
        if not validate_gcp_region(region):
            raise ConfigurationError(f"Invalid region: {region}")

        result = subprocess.run(
            [
                "gcloud",
                "artifacts",
                "repositories",
                "describe",
                repo_name,
                f"--location={region}",
                f"--project={project_id}",
                "--quiet",
            ],
            capture_output=True,
            text=True,
        )

        if result.returncode == 0:
            log_warning(
                f"Artifact Registry repository '{repo_name}' already exists - will reuse"
            )
        else:
            log(f"Creating Artifact Registry repository '{repo_name}'...")
            run_command(
                f"""gcloud artifacts repositories create {repo_name} \
                --repository-format=docker \
                --location={region} \
                --description=\"Container images for Cloud Functions {env_config['environment']}\" \
                --project={project_id}"""
            )
            log_success(f"Artifact Registry repository '{repo_name}' created")
    except Exception as e:
        raise Exception(
            f"Failed to ensure Artifact Registry repository '{repo_name}': {e}"
        ) from e

    # Grant writer to build identities (Cloud Build, Compute default, GCF service agent)
    try:
        project_number = run_command(
            f"gcloud projects describe {project_id} --format='value(projectNumber)'"
        ).strip()
        cloud_build_sa = f"{project_number}@cloudbuild.gserviceaccount.com"
        compute_sa = f"{project_number}-compute@developer.gserviceaccount.com"
        gcf_service_agent = (
            f"service-{project_number}@gcf-admin-robot.iam.gserviceaccount.com"
        )

        def grant_writer(sa: str) -> None:
            try:
                run_command(
                    f"gcloud artifacts repositories add-iam-policy-binding {repo_name} "
                    f"--location={region} --member=serviceAccount:{sa} "
                    f"--role=roles/artifactregistry.writer --project={project_id}"
                )
            except Exception as e:
                # Check if already granted or if this is a real error
                error_str = str(e).lower()
                if "already has role" in error_str or "already exists" in error_str:
                    pass  # Idempotent - role already granted
                else:
                    log_warning(
                        f"Could not grant Artifact Registry writer role to {sa}: {e}"
                    )

        grant_writer(cloud_build_sa)
        grant_writer(compute_sa)
        grant_writer(gcf_service_agent)
        log_success("Cloud Functions repo IAM configured for build identities")
    except Exception as e:
        log_warning(f"Could not configure IAM for '{repo_name}' repo: {e}")


def setup_cloud_tasks_infrastructure(config: dict[str, Any]) -> None:
    """Setup Cloud Tasks queue and permissions for file processing"""
    env_config = config["env_config"]
    project_id = config["project_id"]
    region = config["region"]

    log_step("Cloud Tasks", f"Setting up task queue for {env_config['environment']}...")

    # Check if queue name is already configured in environment (idempotent check)
    env_queue_name = os.getenv("CLOUD_TASKS_QUEUE_NAME")
    if env_queue_name and not is_placeholder_value(env_queue_name):
        # First priority: Check if the queue from env.local already exists
        log(f"Checking existing queue from environment: {env_queue_name}")
        try:
            # Additional validation right before subprocess call for security
            if not validate_gcp_project_id(project_id):
                raise ConfigurationError(f"Invalid project ID: {project_id}")
            if not validate_gcp_region(region):
                raise ConfigurationError(f"Invalid region: {region}")

            check_result = subprocess.run(
                [
                    "gcloud",
                    "tasks",
                    "queues",
                    "describe",
                    env_queue_name,
                    f"--location={region}",
                    f"--project={project_id}",
                    "--quiet",
                ],
                capture_output=True,
                text=True,
            )
            if check_result.returncode == 0:
                log_success(f"Using existing queue from environment: {env_queue_name}")
                log("   ✅ Queue is already configured and ready")
                main_queue = env_queue_name
                # Skip queue creation - use existing queue
                setup_cloud_tasks_iam_permissions(config, main_queue)
                config["main_queue_name"] = main_queue
                log_success("Cloud Tasks infrastructure setup completed")
                return
        except Exception as e:
            error_str = str(e).lower()
            if "not found" in error_str or "does not exist" in error_str:
                log(f"Queue {env_queue_name} not found - will create new queue")
            else:
                log_warning(
                    f"Could not verify queue {env_queue_name}: {e} - will try to create new queue"
                )

    # Define environment-specific queue name for new creation
    env_name = env_config.get("environment", "development")
    env_suffix = "dev" if env_name == "development" else "prod"
    main_queue = f"rag-processing-queue-{env_suffix}"

    # Check if default queue already exists
    queue_exists = False
    try:
        # Additional validation right before subprocess call for security
        if not validate_gcp_project_id(project_id):
            raise ConfigurationError(f"Invalid project ID: {project_id}")
        if not validate_gcp_region(region):
            raise ConfigurationError(f"Invalid region: {region}")

        check_result = subprocess.run(
            [
                "gcloud",
                "tasks",
                "queues",
                "describe",
                main_queue,
                f"--location={region}",
                f"--project={project_id}",
                "--quiet",
            ],
            capture_output=True,
            text=True,
        )
        queue_exists = check_result.returncode == 0
    except Exception as e:
        error_str = str(e).lower()
        if "not found" not in error_str and "does not exist" not in error_str:
            log_warning(f"Error checking if queue exists: {e}")
        queue_exists = False

    if queue_exists:
        log_warning(f"Queue {main_queue} already exists - will reuse")
        log("   This is normal when re-running the setup script")
    else:
        # Create main processing queue with standard retry configuration
        try:
            log(f"Creating processing queue: {main_queue}")
            run_command(
                f"gcloud tasks queues create {main_queue} "
                f"--location={region} "
                f"--max-concurrent-dispatches=100 "
                f"--max-dispatches-per-second=50 "
                f"--max-attempts=20 "
                f"--max-retry-duration=3600s "
                f"--project={project_id}"
            )
            log_success(f"Processing queue created: {main_queue}")
        except Exception as e:
            error_msg = str(e).lower()
            if "already exists" in error_msg:
                log_warning(f"Queue {main_queue} already exists - will reuse")
            elif (
                "existed too recently" in error_msg
                or "queue with this name existed" in error_msg
            ):
                # Handle Google Cloud's queue retention period elegantly
                log_warning(
                    f"Queue {main_queue} was recently deleted - using alternative name"
                )
                log("   💡 Google Cloud retains queue names for 7 days after deletion")

                # Generate alternative queue name with version suffix
                import time

                timestamp = int(time.time())
                alt_queue_name = f"rag-processing-queue-{env_suffix}-v2"

                # If v2 also fails, use timestamp
                log(f"   🔄 Trying versioned queue name: {alt_queue_name}")
                try:
                    run_command(
                        f"gcloud tasks queues create {alt_queue_name} "
                        f"--location={region} "
                        f"--max-concurrent-dispatches=100 "
                        f"--max-dispatches-per-second=50 "
                        f"--max-attempts=20 "
                        f"--max-retry-duration=3600s "
                        f"--project={project_id}"
                    )
                    main_queue = alt_queue_name
                    log_success(f"Versioned queue created: {alt_queue_name}")
                    log("   ✅ Setup will continue with the new queue name")
                except Exception:
                    # Final fallback with timestamp
                    alt_queue_name = f"rag-processing-queue-{env_suffix}-{timestamp}"
                    log(f"   🔄 Final attempt with timestamped queue: {alt_queue_name}")
                    try:
                        run_command(
                            f"gcloud tasks queues create {alt_queue_name} "
                            f"--location={region} "
                            f"--max-concurrent-dispatches=100 "
                            f"--max-dispatches-per-second=50 "
                            f"--max-attempts=20 "
                            f"--max-retry-duration=3600s "
                            f"--project={project_id}"
                        )
                        main_queue = alt_queue_name
                        log_success(f"Timestamped queue created: {alt_queue_name}")
                        log("   ✅ Setup will continue with the timestamped queue name")
                    except Exception as final_e:
                        log_error(f"Failed to create any queue variant: {final_e}")
                        log(
                            "   💡 You may need to wait a few minutes and re-run the setup script"
                        )
                        log(
                            "   💡 Google Cloud retains deleted queue names for up to 7 days"
                        )
                        raise final_e
            else:
                log_error(f"Failed to create queue: {e}")
                raise e

    # Setup IAM permissions for Cloud Tasks workflow
    setup_cloud_tasks_iam_permissions(config, main_queue)

    # Store queue name in config for deployment
    config["main_queue_name"] = main_queue

    log_success("Cloud Tasks infrastructure setup completed")


def setup_cloud_tasks_iam_permissions(config: dict[str, Any], main_queue: str) -> None:
    """Configure IAM permissions for Cloud Tasks workflow"""
    project_id = config["project_id"]

    log("Setting up Cloud Tasks IAM permissions...")

    try:
        # Get project number for service agents
        project_number = run_command(
            f"gcloud projects describe {project_id} --format='value(projectNumber)'"
        ).strip()

        # Define service agents
        eventarc_agent = (
            f"service-{project_number}@gcp-sa-eventarc.iam.gserviceaccount.com"
        )
        cloudtasks_agent = (
            f"service-{project_number}@gcp-sa-cloudtasks.iam.gserviceaccount.com"
        )
        compute_default_sa = f"{project_number}-compute@developer.gserviceaccount.com"

        # Ensure service identities exist (some orgs need explicit creation)
        try:
            run_command(
                f"gcloud beta services identity create --service=eventarc.googleapis.com --project={project_id} --quiet"
            )
        except Exception as e:
            # Check if already exists or if this is a real error
            error_str = str(e).lower()
            if "already exists" not in error_str and "already created" not in error_str:
                log_warning(f"Could not create EventArc service identity: {e}")
        try:
            run_command(
                f"gcloud beta services identity create --service=cloudtasks.googleapis.com --project={project_id} --quiet"
            )
        except Exception as e:
            # Check if already exists or if this is a real error
            error_str = str(e).lower()
            if "already exists" not in error_str and "already created" not in error_str:
                log_warning(f"Could not create Cloud Tasks service identity: {e}")

        # Get all three service accounts for the split architecture
        env_suffix = (
            "dev" if config["env_config"]["environment"] == "development" else "prod"
        )
        processor_sa = (
            f"rag-processor-{env_suffix}@{project_id}.iam.gserviceaccount.com"
        )
        gcs_handler_sa = (
            f"rag-gcs-handler-{env_suffix}@{project_id}.iam.gserviceaccount.com"
        )
        task_processor_sa = (
            f"rag-task-processor-{env_suffix}@{project_id}.iam.gserviceaccount.com"
        )

        # IAM permissions to grant
        permissions = [
            # EventArc service agent needs Service Agent role for Cloud Functions Gen 2
            (
                eventarc_agent,
                "roles/eventarc.serviceAgent",
                "EventArc → service agent permissions",
            ),
            # EventArc service agent can enqueue tasks
            (eventarc_agent, "roles/cloudtasks.enqueuer", "EventArc → enqueue tasks"),
            # Compute Engine default SA needs eventReceiver role for EventArc triggers
            (
                compute_default_sa,
                "roles/eventarc.eventReceiver",
                "Compute SA → receive EventArc events",
            ),
            # CRITICAL: GCS Handler service account needs eventReceiver role for EventArc triggers
            (
                gcs_handler_sa,
                "roles/eventarc.eventReceiver",
                "GCS Handler SA → receive EventArc events",
            ),
            # Processor service account also needs eventReceiver role (for backward compatibility)
            (
                processor_sa,
                "roles/eventarc.eventReceiver",
                "Processor SA → receive EventArc events",
            ),
            # CRITICAL: GCS Handler service account can CREATE tasks (GCS Handler function needs this)
            (
                gcs_handler_sa,
                "roles/cloudtasks.enqueuer",
                "GCS Handler SA → create Cloud Tasks",
            ),
            # Task Processor service account can invoke Cloud Functions (for HTTP triggers)
            (
                task_processor_sa,
                "roles/cloudfunctions.invoker",
                "Task Processor SA → invoke Cloud Functions",
            ),
            # RAG processor service account can process tasks (when acting as job executor)
            (
                processor_sa,
                "roles/cloudtasks.taskRunner",
                "RAG Processor SA → process tasks",
            ),
            # Cloud Tasks service agent can invoke Cloud Run
            (
                cloudtasks_agent,
                "roles/run.invoker",
                "Cloud Tasks → invoke Cloud Run Jobs",
            ),
        ]

        # Grant permissions with retry logic
        success_count = 0
        for member, role, description in permissions:
            # Retry a few times in case the service identity just became visible
            max_attempts = 4
            for attempt in range(max_attempts):
                try:
                    run_command(
                        f"gcloud projects add-iam-policy-binding {project_id} "
                        f"--member=serviceAccount:{member} "
                        f"--role={role} "
                        f"--quiet"
                    )
                    log(f"  ✓ {description}")
                    success_count += 1
                    break
                except Exception as e:
                    err = str(e).lower()
                    if (
                        "does not exist" in err or "invalid_argument" in err
                    ) and attempt < max_attempts - 1:
                        import time

                        wait = 3 * (attempt + 1)
                        log_warning(
                            f"   ⏳ Service agent not ready for {role}; retrying in {wait}s (attempt {attempt+1}/{max_attempts})"
                        )
                        time.sleep(wait)
                        continue
                    else:
                        log_warning(f"Could not grant {role} to {member}: {e}")
                        break

        if success_count == len(permissions):
            log_success("All Cloud Tasks IAM permissions configured")
        else:
            log_success(
                f"Cloud Tasks IAM setup completed ({success_count}/{len(permissions)} successful)"
            )

    except Exception as e:
        log_warning(f"Could not setup all Cloud Tasks IAM permissions: {e}")
        log("You may need to configure some permissions manually")


class SecretManager:
    """Manages Google Cloud Secret Manager operations"""

    def __init__(self, project_id: str, environment: str):
        self.project_id = project_id
        self.environment = environment
        self.env_suffix = self._get_env_suffix()

    def _get_env_suffix(self) -> str:
        """Get environment-specific suffix for secret names"""
        if self.environment == "development":
            return "-dev"
        elif self.environment == "production":
            return "-prod"
        else:
            return f"-{self.environment}"

    def _get_secrets_data(self, config: dict[str, Any]) -> list[tuple[str, str]]:
        """Get list of (secret_name, secret_value) tuples"""
        return [
            (f"database-url{self.env_suffix}", config["database_url"]),
            (f"gemini-api-key{self.env_suffix}", config["gemini_api_key"]),
        ]

    def _check_existing_secrets(self, secrets_data: list[tuple[str, str]]) -> set[str]:
        """Check which secrets already exist (parallel)"""
        check_commands = []
        for secret_name, _ in secrets_data:
            cmd = f"gcloud secrets describe {secret_name} --project={self.project_id} --quiet"
            check_commands.append((secret_name, cmd))

        log("   🔍 Checking existing secrets in parallel...")
        check_results = check_commands_parallel(check_commands, max_workers=4)

        existing_secrets = set()
        for secret_name, success, _ in check_results:
            if success:
                existing_secrets.add(secret_name)
                log_warning(
                    f"Secret {secret_name} already exists - will update with new value"
                )
            else:
                log(f"Creating new secret: {secret_name}")

        return existing_secrets

    def _create_new_secrets(
        self, secrets_data: list[tuple[str, str]], existing_secrets: set[str]
    ) -> None:
        """Create new secrets that don't exist yet (parallel)"""
        creation_commands = []
        for secret_name, _ in secrets_data:
            if secret_name not in existing_secrets:
                cmd = f'gcloud secrets create {secret_name} --replication-policy="automatic" --project={self.project_id}'
                creation_commands.append((f"Create {secret_name}", cmd))

        if creation_commands:
            log("   🔐 Creating new secrets in parallel...")
            creation_results = run_commands_parallel(creation_commands, max_workers=4)

            for desc, success, error in creation_results:
                if success:
                    log(f"  ✓ {desc}")
                else:
                    log_warning(f"Could not {desc.lower()}: {error}")

    def _update_secret_versions(self, secrets_data: list[tuple[str, str]]) -> int:
        """Update secret versions securely (sequential for security)"""
        log("   🔄 Updating secret versions securely...")

        success_count = 0
        for secret_name, secret_value in secrets_data:
            try:
                log(f"  Updating {secret_name}...")
                # ✅ SECURE: Use subprocess input to avoid shell escaping issues
                subprocess.run(
                    [
                        "gcloud",
                        "secrets",
                        "versions",
                        "add",
                        secret_name,
                        "--data-file=-",
                        f"--project={self.project_id}",
                        "--quiet",
                    ],
                    input=secret_value,
                    text=True,
                    check=True,
                    capture_output=True,
                )
                log(f"  ✓ Update {secret_name}")
                success_count += 1
            except subprocess.CalledProcessError as e:
                log_warning(f"Could not update {secret_name}: {e}")
            except Exception as e:
                log_warning(f"Could not update {secret_name}: {e}")

        return success_count

    def setup_secrets(self, config: dict[str, Any]) -> None:
        """Set up secrets in Secret Manager with parallel checking and sequential updates"""
        log_step("Secrets", "Configuring Secret Manager (parallel)...")

        secrets_data = self._get_secrets_data(config)
        existing_secrets = self._check_existing_secrets(secrets_data)
        self._create_new_secrets(secrets_data, existing_secrets)
        success_count = self._update_secret_versions(secrets_data)

        if success_count == len(secrets_data):
            log_success("All secrets configured successfully")
        else:
            log_success(
                f"Secret Manager configured ({success_count}/{len(secrets_data)} secrets successful)"
            )
            if success_count < len(secrets_data):
                log("   You may need to configure some secrets manually")


def setup_secret_manager(config: dict[str, Any]) -> None:
    """Set up secrets in Secret Manager using SecretManager class"""
    secret_manager = SecretManager(
        project_id=config["project_id"], environment=config["env_config"]["environment"]
    )
    secret_manager.setup_secrets(config)


def setup_cloud_run_jobs_permissions(config: dict[str, Any]) -> None:
    """Setup additional IAM permissions needed for Cloud Run Jobs operations"""
    project_id = config["project_id"]
    env_suffix = (
        "dev" if config["env_config"]["environment"] == "development" else "prod"
    )

    # Get service accounts for split architecture
    processor_sa = f"rag-processor-{env_suffix}@{project_id}.iam.gserviceaccount.com"
    task_processor_sa = (
        f"rag-task-processor-{env_suffix}@{project_id}.iam.gserviceaccount.com"
    )

    log("Setting up Cloud Run Jobs IAM permissions...")

    # IAM permissions required for Cloud Run Jobs
    permissions = [
        # Processor service account needs developer role to create/update jobs during deployment
        (
            f"serviceAccount:{processor_sa}",
            "roles/run.developer",
            "Processor SA → Cloud Run Jobs developer (for deployment)",
        ),
        # Task Processor service account needs invoker role to trigger job executions
        (
            f"serviceAccount:{task_processor_sa}",
            "roles/run.invoker",
            "Task Processor SA → Cloud Run Jobs invoker (for queue handler)",
        ),
        # Processor service account needs invoker role for job management
        (
            f"serviceAccount:{processor_sa}",
            "roles/run.invoker",
            "Processor SA → Cloud Run Jobs invoker (for job management)",
        ),
    ]

    try:
        success_count = 0

        for member, role, description in permissions:
            try:
                log(f"  Granting {role} to {member}...")
                run_command(
                    f"gcloud projects add-iam-policy-binding {project_id} "
                    f"--member={member} --role={role} --quiet"
                )
                log(f"  ✓ {description}")
                success_count += 1

            except Exception as e:
                error_str = str(e).lower()
                if "already has role" in error_str or "already exists" in error_str:
                    log(f"  ✓ {description} (already configured)")
                    success_count += 1
                else:
                    log_warning(f"Could not grant {role} to {member}: {e}")

        if success_count == len(permissions):
            log_success("All Cloud Run Jobs IAM permissions configured")
        else:
            log_success(
                f"Cloud Run Jobs IAM setup completed ({success_count}/{len(permissions)} successful)"
            )

    except Exception as e:
        log_warning(f"Could not setup all Cloud Run Jobs IAM permissions: {e}")
        log("You may need to configure some permissions manually")


def cleanup_old_images_parallel(
    project_id: str, service_name: str, keep_count: int = 5
) -> None:
    """
    Clean up old container images in parallel.

    NOTE: This function is designed to be called from deployment scripts
    (deploy_dev.py, deploy_prod.py) after successful deployment, not from
    the setup scripts which focus on infrastructure creation.

    Usage in deployment scripts:
        cleanup_old_images_parallel(
            project_id=config["project_id"],
            service_name=config["service_name"],
            keep_count=5
        )
    """
    log_step("Cleanup", f"Cleaning up old container images for {service_name}...")

    try:
        # Get all images for the service using subprocess to avoid error logging when no images exist
        # Additional validation right before subprocess call for security
        if not validate_gcp_project_id(project_id):
            raise ConfigurationError(f"Invalid project ID: {project_id}")

        result = subprocess.run(
            [
                "gcloud",
                "container",
                "images",
                "list-tags",
                f"gcr.io/{project_id}/{service_name}",
                "--format=get(digest)",
                "--sort-by=~timestamp",
            ],
            capture_output=True,
            text=True,
        )

        if result.returncode != 0 or not result.stdout.strip():
            log("   No container images found to clean up")
            return

        images_output = result.stdout

        images = images_output.strip().split("\n")

        # Keep only the most recent images
        images_to_delete = images[keep_count:]

        if not images_to_delete:
            log(
                f"   Only {len(images)} images found, keeping all (threshold: {keep_count})"
            )
            return

        # Delete images in parallel
        commands = []
        for image_digest in images_to_delete:
            cmd = f"gcloud container images delete gcr.io/{project_id}/{service_name}@{image_digest} --quiet"
            commands.append((f"Image {image_digest[:12]}...", cmd))

        log(f"   🗑️  Cleaning up {len(images_to_delete)} old images in parallel...")
        results = run_commands_parallel(commands, max_workers=6)

        # Report results
        deleted_count = sum(1 for _, success, _ in results if success)
        failed_count = len(results) - deleted_count

        if deleted_count > 0:
            log_success(f"Cleaned up {deleted_count} old container images")
        if failed_count > 0:
            log_warning(f"Failed to delete {failed_count} images")

    except Exception as e:
        log_warning(f"Could not clean up old images: {e}")
        log("   Continuing with setup - old images may accumulate over time")


def generate_env_file(config: dict[str, Any]) -> None:
    """Generate .env.local file with all configuration"""
    env_config = config["env_config"]
    # Show correct env file name in log message
    if env_config["environment"] == "development":
        env_file_display = ".env.local"
    elif env_config["environment"] == "production":
        env_file_display = ".env.prod"
    else:
        env_file_display = f".env.{env_config['environment']}"

    log_step("Environment", f"Generating {env_file_display} file...")

    import datetime

    # Determine environment-aware resource allocation for Cloud Run Jobs
    # Cloud Run Jobs configuration: 6 vCPU, 8Gi memory (matches deployment_config.py)
    cpu_cores = 6  # Actual CPU allocated to Cloud Run Jobs

    if env_config["environment"] == "development":
        debug_setting = "true"
        cloud_build_machine = "E2_HIGHCPU_8"
        cloud_build_disk = "200"
    elif env_config["environment"] == "production":
        debug_setting = "false"
        cloud_build_machine = "E2_HIGHCPU_32"  # More powerful for production builds
        cloud_build_disk = "200"
    else:
        debug_setting = "false"
        cloud_build_machine = "E2_HIGHCPU_8"
        cloud_build_disk = "200"

    # Calculate thread settings based on actual CPU cores allocated to Jobs
    omp_threads = cpu_cores
    openblas_threads = max(3, cpu_cores // 2)  # 3 threads for 6 CPU
    mkl_threads = max(4, int(cpu_cores * 0.75))  # 4 threads for 6 CPU
    torch_threads = cpu_cores

    env_content = f"""# Google Cloud Platform Configuration
# Generated for {env_config["environment"]} environment on {datetime.datetime.now().isoformat()}

# Project Configuration
GOOGLE_CLOUD_PROJECT_ID={config["project_id"]}
GOOGLE_CLOUD_REGION={config["region"]}
GOOGLE_CLOUD_STORAGE_BUCKET={config["bucket_name"]}
VERTEX_AI_LOCATION={config["region"]}

# Database Configuration
DATABASE_URL={config["database_url"]}
DATABASE_POOL_SIZE=3
DATABASE_MAX_OVERFLOW=5
DATABASE_TIMEOUT=60

# API Configuration
GEMINI_API_KEY={config["gemini_api_key"]}

# Cloud Tasks Configuration
CLOUD_TASKS_QUEUE_NAME={config.get("main_queue_name", f"rag-processing-queue-{env_config['environment'].replace('development', 'dev').replace('production', 'prod')}")}

# Service Configuration
ENVIRONMENT={env_config["environment"]}
DEBUG={debug_setting}
LOG_LEVEL={env_config["log_level"]}
LOG_FORMAT=console
HOST=0.0.0.0

# RAG Processor Cloud Run Jobs Configuration (environment-aware allocation)
PROCESSOR_JOB_NAME=rag-processor-job-{env_config["environment"].replace("development", "dev").replace("production", "prod")}
CLOUD_RUN_JOBS_CPU=6
CLOUD_RUN_JOBS_MEMORY=8Gi
CLOUD_RUN_JOBS_PARALLELISM={10 if env_config["environment"] == "development" else 20}
CLOUD_RUN_JOBS_TIMEOUT=7200

# Cloud Build Configuration
CLOUD_BUILD_MACHINE_TYPE={cloud_build_machine}
CLOUD_BUILD_DISK_SIZE_GB={cloud_build_disk}

# Thread and performance optimization (optimized for {cpu_cores} CPU cores)
OMP_NUM_THREADS={omp_threads}
OPENBLAS_NUM_THREADS={openblas_threads}
MKL_NUM_THREADS={mkl_threads}
NUMEXPR_NUM_THREADS=2
BLIS_NUM_THREADS={openblas_threads}
TOKENIZERS_PARALLELISM=false
TORCH_NUM_THREADS={torch_threads}
OMP_WAIT_POLICY=PASSIVE

# Processing Configuration
CHUNK_SIZE=2000
CHUNK_OVERLAP=200

# Embedding Models
TEXT_EMBEDDING_MODEL=text-embedding-004
TEXT_EMBEDDING_DIMENSIONS=768
MULTIMODAL_EMBEDDING_MODEL=multimodalembedding@001
MULTIMODAL_EMBEDDING_DIMENSIONS=1408

# Video Processing Configuration
VIDEO_CHUNK_DURATION_SECONDS=15
VIDEO_CONTEXT_MAX_BYTES=20000000
VIDEO_DEFAULT_LANGUAGE=en
TRANSCRIPTION_MODEL=latest_long

# Service Integration (Cloud Run Jobs architecture)
TASK_SERVICE_ACCOUNT=rag-processor-{env_config["environment"].replace("development", "dev").replace("production", "prod")}@{config["project_id"]}.iam.gserviceaccount.com
QUEUE_HANDLER_SERVICE_NAME=rag-queue-{env_config["environment"].replace("development", "dev").replace("production", "prod")}

# Frontend Access (Service Account Key)
GOOGLE_CLOUD_SERVICE_ACCOUNT_KEY={config.get("service_account_key_base64", "")}
"""

    # Determine the correct env file name
    if env_config["environment"] == "development":
        # Create .env.local in apps/rag-processor directory
        env_file = (
            Path(__file__).parent.parent / "apps" / "rag-processor" / ".env.local"
        )  # Development uses .env.local
    elif env_config["environment"] == "production":
        env_file = (
            Path(__file__).parent.parent / "apps" / "rag-processor" / ".env.prod"
        )  # Production uses .env.prod
    else:
        env_file = Path(
            f".env.{env_config['environment']}"
        )  # Other environments use full name

    # Check if .env file already exists and handle appropriately
    if env_file.exists():
        # Check if the existing file was generated by this script
        existing_content = env_file.read_text()
        if (
            "# Generated for" in existing_content
            and "environment on" in existing_content
        ):
            # File was generated by this script, safe to overwrite
            log(f"Updating existing generated {env_file} file...")
        else:
            # File exists and appears to be manually created - ask user
            log_warning(f"Existing {env_file} file found")
            log("This file appears to be manually created or modified.")

            response = input(
                f"{Colors.CYAN}Overwrite {env_file}? [y/N]: {Colors.RESET}"
            )
            if response.lower() not in ["y", "yes"]:
                log(f"Keeping existing {env_file} file - setup will continue")
                log(
                    "Note: You may need to manually update environment variables for proper operation"
                )
                return
            else:
                log(f"Overwriting {env_file} with new configuration...")

    # Write new .env file
    env_file.write_text(env_content)

    log_success(f"Generated {env_file} file with all configuration")

    # Also update web app with shared backend values
    web_env_filename = (
        ".env.local" if env_config["environment"] == "development" else ".env.prod"
    )
    web_env_file = Path(__file__).parent.parent / "apps" / "web" / web_env_filename

    if web_env_file.exists():
        try:
            web_content = web_env_file.read_text()

            # Update shared values in web app
            shared_updates = [
                (
                    f"GOOGLE_CLOUD_PROJECT_ID={config['project_id']}",
                    "GOOGLE_CLOUD_PROJECT_ID=",
                ),
                (
                    f"GOOGLE_CLOUD_STORAGE_BUCKET={config['bucket_name']}",
                    "GOOGLE_CLOUD_STORAGE_BUCKET=",
                ),
                (
                    f"GOOGLE_CLOUD_SERVICE_ACCOUNT_KEY={config.get('service_account_key_base64', '')}",
                    "GOOGLE_CLOUD_SERVICE_ACCOUNT_KEY=",
                ),
                (
                    f"GEMINI_API_KEY={config['gemini_api_key']}",
                    "GEMINI_API_KEY=",
                ),
            ]

            for new_line, prefix in shared_updates:
                if prefix in web_content:
                    # Replace existing line
                    import re

                    web_content = re.sub(f"{prefix}.*", new_line, web_content)
                else:
                    # Append new line
                    web_content += f"\n# Auto-populated by backend setup\n{new_line}\n"

            web_env_file.write_text(web_content)
            log(f"   ✅ Updated web app {web_env_filename} with backend configuration")
        except Exception as e:
            log(f"   ⚠️  Could not update web app {web_env_filename}: {e}")
    else:
        log(f"   ℹ️  Web app {web_env_filename} not found - skipping update")


def print_success_summary(config: dict[str, Any]) -> None:
    """Print success summary with next steps"""
    env_config = config["env_config"]

    log("\n" + "=" * 70)
    log(
        f"🎉 {env_config['environment'].upper()} INFRASTRUCTURE SETUP SUCCESSFUL! 🎉",
        Colors.GREEN + Colors.BOLD,
    )
    log("=" * 70)

    log(f"\n{Colors.BOLD}📋 Infrastructure Summary:{Colors.RESET}")
    log(f"  • Environment: {env_config['environment'].title()}")
    log(f"  • Project: {config['project_id']}")
    log(f"  • Region: {config['region']}")
    log(f"  • Service Name: {env_config['service_name']} (ready for deployment)")
    log(f"  • Storage Bucket: gs://{config['bucket_name']}")

    # Show all 3 service accounts for queue architecture
    env_suffix = "dev" if env_config["environment"] == "development" else "prod"
    log("  • Service Accounts (Queue Architecture):")
    log(
        f"    - Processor: rag-processor-{env_suffix}@{config['project_id']}.iam.gserviceaccount.com"
    )
    log(
        f"    - GCS Handler: rag-gcs-handler-{env_suffix}@{config['project_id']}.iam.gserviceaccount.com"
    )
    log(
        f"    - Task Processor: rag-task-processor-{env_suffix}@{config['project_id']}.iam.gserviceaccount.com"
    )

    log(f"\n{Colors.BOLD}🔑 Important Information:{Colors.RESET}")

    # Show correct env file name based on actual logic
    if env_config["environment"] == "development":
        env_file_name = ".env.local"
    elif env_config["environment"] == "production":
        env_file_name = ".env.prod"
    else:
        env_file_name = f".env.{env_config['environment']}"

    log(f"  • Environment File: {env_file_name} (generated)")
    log("  • All secrets stored in Google Secret Manager")

    if env_config["environment"] == "development":
        log(f"\n{Colors.BOLD}💰 Development Environment Configuration:{Colors.RESET}")
        log("  • Scales to zero when not used (saves money!)")
        log("  • Debug logging for troubleshooting")
        log("  • Lower resource costs")
        log("  • Perfect for testing and development")
    else:
        log(f"\n{Colors.BOLD}🚀 Production Environment Configuration:{Colors.RESET}")
        log("  • High-performance resources")
        log("  • Auto-scaling up to 20 instances")
        log("  • Production-level logging")

    log(f"\n{Colors.BOLD}💡 Next Steps:{Colors.RESET}")
    if env_config["environment"] == "development":
        log("  1. Deploy the processor service (includes cloud build):")
        log("     npm run deploy:processor:dev")
        log("  2. Deploy the GCS handler function (Producer):")
        log("     npm run deploy:gcs-handler:dev")
        log("  3. Deploy the task processor function (Consumer):")
        log("     npm run deploy:task-processor:dev")
    else:
        log("  1. Deploy the processor service (includes cloud build):")
        log("     npm run deploy:processor:prod")
        log("  2. Deploy the GCS handler function (Producer):")
        log("     npm run deploy:gcs-handler:prod")
        log("  3. Deploy the task processor function (Consumer):")
        log("     npm run deploy:task-processor:prod")
    log("  4. The deployment will:")
    log("     • Deploy your processor to Cloud Run Jobs")
    log("     • Set up GCS Handler function for file events")
    log("     • Set up Task Processor function for queue consumption")
    log("     • Configure EventArc triggers for automatic file processing")
    log("     • Connect all components for end-to-end queue-based automation")

    if env_config["environment"] == "development":
        log("  5. Test your queue architecture by uploading a file to your GCS bucket")
        log("  6. When ready for production, run: npm run setup:gcp:prod")
    else:
        log("  5. Configure monitoring and alerts")
        log("  6. Set up budget limits for cost control")

    log(f"\n{Colors.BOLD}🔄 Re-running & Updates:{Colors.RESET}")
    log("  • This script is safe to re-run anytime (fully idempotent)")
    log("  • Existing resources will be detected and preserved")
    log("  • Only missing components will be created")
    log("  • Configuration will be updated to latest values")
    if env_config["environment"] == "development":
        log("  • To deploy code changes:")
        log("    - Processor: npm run deploy:processor:dev")
        log("    - GCS Handler: npm run deploy:gcs-handler:dev")
        log("    - Task Processor: npm run deploy:task-processor:dev")
    elif env_config["environment"] == "production":
        log("  • To deploy code changes:")
        log("    - Processor: npm run deploy:processor:prod")
        log("    - GCS Handler: npm run deploy:gcs-handler:prod")
        log("    - Task Processor: npm run deploy:task-processor:prod")
    else:
        log(
            f"  • To deploy code changes: use scripts for {env_config['environment']} environment"
        )

    log(
        f"\n{Colors.GREEN}🚀 Your RAG SaaS {env_config['environment']} infrastructure is ready for deployment!{Colors.RESET}"
    )
    log("=" * 70 + "\n")


def setup_gcp_environment(
    env_config: dict[str, Any],
    skip_cleanup: bool = False,
    skip_verification: bool = False,
) -> None:
    """Main setup function for GCP environment - Infrastructure only"""

    try:
        # Welcome message
        log(
            f"🚀 Google Cloud Platform Setup - {env_config['environment'].title()} Environment",
            Colors.BLUE + Colors.BOLD,
        )
        log("=" * 60)
        log(f"{env_config['description']}")
        log("")
        log(
            "📝 IMPORTANT: This script sets up infrastructure only!",
            Colors.GREEN + Colors.BOLD,
        )
        log("   • Creates service accounts, buckets, and secrets")
        log("   • Does NOT deploy your application")
        log("   • Run the deploy script after this completes")
        log("   • This script is fully idempotent and safe to re-run")
        log("")

        # Phase 1: Prerequisites
        log("📋 Phase 1: Prerequisites and Authentication", Colors.YELLOW + Colors.BOLD)
        check_prerequisites_enhanced()

        # Phase 2: Configuration
        log("\n🔧 Phase 2: Configuration", Colors.YELLOW + Colors.BOLD)
        config = get_user_configuration(env_config)

        # Phase 3: API Setup
        log("\n🔌 Phase 3: API and Service Setup", Colors.YELLOW + Colors.BOLD)
        enable_apis(config)
        create_service_account(config)
        grant_user_cloud_build_permissions(config)

        # Phase 4: Infrastructure
        log("\n🏗️ Phase 4: Infrastructure Setup", Colors.YELLOW + Colors.BOLD)
        create_storage_bucket(config)
        create_artifact_registry_repository(config)
        setup_cloud_tasks_infrastructure(config)
        setup_secret_manager(config)
        setup_cloud_run_jobs_permissions(config)  # NEW: Add Cloud Run Jobs permissions

        # Phase 5: Generate service account key for frontend access (default)
        # Do this BEFORE writing the env file so the key is inserted into .env.local.
        log("\n🔑 Phase 5: Frontend Access Configuration", Colors.YELLOW + Colors.BOLD)
        encoded_key = generate_service_account_key(config)
        if encoded_key:
            config["service_account_key_base64"] = encoded_key

        # Phase 6: Environment Configuration (renamed step order)
        log("\n📄 Phase 6: Environment Configuration", Colors.YELLOW + Colors.BOLD)
        generate_env_file(config)

        # Success summary
        print_success_summary(config)

    except KeyboardInterrupt:
        log_error("Setup interrupted by user")
        sys.exit(1)
    except Exception as e:
        log_error(f"Setup failed: {e}")
        sys.exit(1)


def ensure_cloud_tasks_queue(project_id: str, region: str, environment: str) -> bool:
    """Ensure Cloud Tasks queue exists with correct configuration.

    This is a simpler version used by deployment scripts that just ensures
    the queue exists. The full setup_cloud_tasks_infrastructure() function
    in this module does more comprehensive setup including IAM permissions.
    """
    from .gcp_utils import Colors, log, log_step

    log_step("Queue", "Ensuring Cloud Tasks queue exists")

    # Environment-specific queue name
    env_suffix = "dev" if environment == "development" else "prod"
    queue_name = f"rag-processing-queue-{env_suffix}"

    # Check if queue exists
    check_args = [
        "gcloud",
        "tasks",
        "queues",
        "describe",
        queue_name,
        f"--location={region}",
        f"--project={project_id}",
    ]

    result = subprocess.run(check_args, capture_output=True, text=True, check=False)

    if result.returncode == 0:
        log(f"   ✅ Cloud Tasks queue '{queue_name}' already exists", Colors.GREEN)

        # Update existing queue to ensure proper retry and concurrency configuration
        log("   🔄 Updating queue retry and concurrency configuration...")
        update_args = [
            "gcloud",
            "tasks",
            "queues",
            "update",
            queue_name,
            f"--location={region}",
            "--max-concurrent-dispatches=100",
            "--max-dispatches-per-second=50",
            "--max-attempts=20",
            "--max-retry-duration=3600s",
            "--min-backoff=10s",
            "--max-backoff=300s",
        ]

        update_result = subprocess.run(
            update_args, capture_output=True, text=True, check=False
        )

        if update_result.returncode == 0:
            log("   ✅ Queue retry configuration updated", Colors.GREEN)
        else:
            log(
                "   ⚠️  Could not update queue configuration (may require manual update)",
                Colors.YELLOW,
            )

        return True

    # Create queue
    log(f"   📝 Creating Cloud Tasks queue '{queue_name}'...")

    create_args = [
        "gcloud",
        "tasks",
        "queues",
        "create",
        queue_name,
        f"--location={region}",
        "--max-concurrent-dispatches=100",
        "--max-dispatches-per-second=50",
        "--max-attempts=20",
        "--max-retry-duration=3600s",
        "--min-backoff=10s",
        "--max-backoff=300s",
    ]

    result = subprocess.run(create_args, capture_output=True, text=True, check=False)

    if result.returncode == 0:
        log("   ✅ Cloud Tasks queue created successfully", Colors.GREEN)
        return True
    else:
        log(f"   ❌ Failed to create queue: {result.stderr}", Colors.RED)
        return False
