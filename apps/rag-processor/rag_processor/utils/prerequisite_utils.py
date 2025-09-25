"""
Prerequisite checking utilities for RAG processor deployment scripts.

This module provides comprehensive prerequisite validation for GCP deployment,
including command availability, authentication, API enablement, and permissions.
"""

import json
import shutil
import subprocess
from pathlib import Path
from typing import Any

from .error_handling import ErrorContext, PrerequisiteError
from .validation_utils import validate_gcp_project_id


def check_command_exists(command: str) -> bool:
    """Check if command exists in PATH.

    Args:
        command: Command name to check

    Returns:
        True if command exists, False otherwise
    """
    return shutil.which(command) is not None


def check_gcp_authentication() -> tuple[bool, str]:
    """Check if GCP authentication is configured.

    Returns:
        Tuple of (is_authenticated, account_email)

    Raises:
        PrerequisiteError: If authentication check fails
    """
    try:
        result = subprocess.run(
            [
                "gcloud",
                "auth",
                "list",
                "--filter=status:ACTIVE",
                "--format=value(account)",
            ],
            capture_output=True,
            text=True,
            timeout=30,
        )

        if result.returncode != 0:
            return False, ""

        accounts = result.stdout.strip()
        if not accounts:
            return False, ""

        # Return first active account
        account_email = accounts.split("\n")[0]
        return True, account_email

    except subprocess.TimeoutExpired as e:
        raise PrerequisiteError(
            "GCP authentication check timed out. Please check your network connection."
        ) from e
    except subprocess.SubprocessError as e:
        raise PrerequisiteError(f"Failed to check GCP authentication: {e}") from e


def check_required_gcp_apis(
    project_id: str, required_apis: list[str]
) -> dict[str, bool]:
    """Check if required GCP APIs are enabled.

    Args:
        project_id: GCP project ID
        required_apis: List of required API names

    Returns:
        Dict mapping API names to enabled status

    Raises:
        PrerequisiteError: If API check fails
    """
    if not validate_gcp_project_id(project_id):
        raise PrerequisiteError(f"Invalid GCP project ID: {project_id}")

    api_status = {}

    try:
        # Get list of enabled APIs
        result = subprocess.run(
            [
                "gcloud",
                "services",
                "list",
                "--enabled",
                "--format=value(name)",
                f"--project={project_id}",
            ],
            capture_output=True,
            text=True,
            timeout=60,
        )

        if result.returncode != 0:
            raise PrerequisiteError(
                f"Failed to check enabled APIs for project {project_id}: {result.stderr}"
            )

        enabled_apis = set(result.stdout.strip().split("\n"))

        # Check each required API
        for api in required_apis:
            api_status[api] = api in enabled_apis

    except subprocess.TimeoutExpired as e:
        raise PrerequisiteError(
            f"API check timed out for project {project_id}. Please check your network connection."
        ) from e
    except subprocess.SubprocessError as e:
        raise PrerequisiteError(f"Failed to check GCP APIs: {e}") from e

    return api_status


def check_gcp_permissions(
    project_id: str, service_account_email: str, required_roles: list[str]
) -> dict[str, bool]:
    """Check if service account has required IAM roles.

    Args:
        project_id: GCP project ID
        service_account_email: Service account email
        required_roles: List of required IAM roles

    Returns:
        Dict mapping role names to granted status

    Raises:
        PrerequisiteError: If permission check fails
    """
    if not validate_gcp_project_id(project_id):
        raise PrerequisiteError(f"Invalid GCP project ID: {project_id}")

    role_status = {}

    try:
        # Get IAM policy for the project
        result = subprocess.run(
            ["gcloud", "projects", "get-iam-policy", project_id, "--format=json"],
            capture_output=True,
            text=True,
            timeout=60,
        )

        if result.returncode != 0:
            raise PrerequisiteError(
                f"Failed to get IAM policy for project {project_id}: {result.stderr}"
            )

        policy = json.loads(result.stdout)

        # Extract roles for the service account
        granted_roles = set()
        for binding in policy.get("bindings", []):
            if f"serviceAccount:{service_account_email}" in binding.get("members", []):
                granted_roles.add(binding.get("role", ""))

        # Check each required role
        for role in required_roles:
            role_status[role] = role in granted_roles

    except json.JSONDecodeError as e:
        raise PrerequisiteError(f"Failed to parse IAM policy response: {e}") from e
    except subprocess.TimeoutExpired as e:
        raise PrerequisiteError(
            f"Permission check timed out for project {project_id}. Please check your network connection."
        ) from e
    except subprocess.SubprocessError as e:
        raise PrerequisiteError(f"Failed to check GCP permissions: {e}") from e

    return role_status


def check_file_exists(file_path: str | Path) -> bool:
    """Check if file exists and is readable.

    Args:
        file_path: Path to file

    Returns:
        True if file exists and is readable, False otherwise
    """
    try:
        path = Path(file_path)
        return path.exists() and path.is_file() and path.stat().st_size > 0
    except (OSError, PermissionError):
        return False


def check_directory_writable(directory_path: str | Path) -> bool:
    """Check if directory exists and is writable.

    Args:
        directory_path: Path to directory

    Returns:
        True if directory is writable, False otherwise
    """
    try:
        path = Path(directory_path)
        if not path.exists():
            return False

        # Try to create a temporary file
        test_file = path / ".write_test"
        test_file.touch()
        test_file.unlink()
        return True

    except (OSError, PermissionError):
        return False


def check_deployment_prerequisites(
    project_id: str,
    required_commands: list[str] | None = None,
    required_apis: list[str] | None = None,
    required_files: list[str] | None = None,
    service_account_email: str | None = None,
    required_roles: list[str] | None = None,
) -> list[str]:
    """Check all deployment prerequisites and return list of missing items.

    Args:
        project_id: GCP project ID
        required_commands: List of required commands (default: gcloud, docker)
        required_apis: List of required GCP APIs
        required_files: List of required files
        service_account_email: Service account email for permission checks
        required_roles: List of required IAM roles

    Returns:
        List of missing prerequisite descriptions

    Raises:
        PrerequisiteError: If prerequisite check fails
    """
    missing_items = []

    # Default required commands
    if required_commands is None:
        required_commands = ["gcloud", "docker"]

    with ErrorContext("Deployment prerequisite validation"):
        # Check required commands
        for command in required_commands:
            if not check_command_exists(command):
                missing_items.append(f"Command '{command}' not found in PATH")

        # Check GCP authentication
        is_authenticated, account_email = check_gcp_authentication()
        if not is_authenticated:
            missing_items.append(
                "GCP authentication not configured (run 'gcloud auth login')"
            )

        # Check GCP APIs if specified
        if required_apis:
            try:
                api_status = check_required_gcp_apis(project_id, required_apis)
                for api, enabled in api_status.items():
                    if not enabled:
                        missing_items.append(f"GCP API '{api}' not enabled")
            except PrerequisiteError as e:
                missing_items.append(f"Cannot check GCP APIs: {e}")

        # Check required files
        if required_files:
            for file_path in required_files:
                if not check_file_exists(file_path):
                    missing_items.append(f"Required file not found: {file_path}")

        # Check service account permissions if specified
        if service_account_email and required_roles:
            try:
                role_status = check_gcp_permissions(
                    project_id, service_account_email, required_roles
                )
                for role, granted in role_status.items():
                    if not granted:
                        missing_items.append(f"Service account missing role: {role}")
            except PrerequisiteError as e:
                missing_items.append(f"Cannot check service account permissions: {e}")

    return missing_items


def validate_deployment_environment(
    project_id: str, environment: str = "development", skip_optional: bool = False
) -> None:
    """Validate complete deployment environment prerequisites.

    Args:
        project_id: GCP project ID
        environment: Deployment environment (development/production)
        skip_optional: Skip optional prerequisite checks

    Raises:
        PrerequisiteError: If critical prerequisites are missing
    """
    # Define required APIs based on environment
    required_apis = [
        "cloudbuild.googleapis.com",
        "secretmanager.googleapis.com",
        "run.googleapis.com",
        "eventarc.googleapis.com",
        "pubsub.googleapis.com",
        "aiplatform.googleapis.com",
    ]

    # Add production-specific APIs
    if environment.lower() == "production":
        required_apis.extend(
            [
                "billingbudgets.googleapis.com",
                "monitoring.googleapis.com",
                "logging.googleapis.com",
            ]
        )

    # Check prerequisites
    missing_items = check_deployment_prerequisites(
        project_id=project_id,
        required_apis=required_apis,
        required_files=[".env.local" if environment == "development" else ".env.prod"],
    )

    if missing_items:
        error_message = f"Missing prerequisites for {environment} deployment:\n"
        for item in missing_items:
            error_message += f"  • {item}\n"

        error_message += "\nPlease resolve these issues before proceeding."

        raise PrerequisiteError(error_message)


def get_prerequisite_summary(
    project_id: str, environment: str = "development"
) -> dict[str, Any]:
    """Get comprehensive prerequisite status summary.

    Args:
        project_id: GCP project ID
        environment: Deployment environment

    Returns:
        Dict with prerequisite status information
    """
    summary: dict[str, Any] = {
        "project_id": project_id,
        "environment": environment,
        "commands": {},
        "authentication": {},
        "apis": {},
        "files": {},
        "overall_status": "unknown",
    }

    try:
        # Check commands
        commands_dict: dict[str, bool] = {}
        for command in ["gcloud", "docker"]:
            commands_dict[command] = check_command_exists(command)
        summary["commands"] = commands_dict

        # Check authentication
        is_authenticated, account_email = check_gcp_authentication()
        auth_dict: dict[str, Any] = {
            "is_authenticated": is_authenticated,
            "account_email": account_email,
        }
        summary["authentication"] = auth_dict

        # Check APIs
        required_apis = [
            "cloudbuild.googleapis.com",
            "secretmanager.googleapis.com",
            "run.googleapis.com",
            "eventarc.googleapis.com",
            "pubsub.googleapis.com",
            "aiplatform.googleapis.com",
        ]

        try:
            api_status = check_required_gcp_apis(project_id, required_apis)
            summary["apis"] = api_status
        except PrerequisiteError:
            summary["apis"] = dict.fromkeys(required_apis, False)

        # Check files
        env_file = ".env.local" if environment == "development" else ".env.prod"
        files_dict: dict[str, bool] = {env_file: check_file_exists(env_file)}
        summary["files"] = files_dict

        # Determine overall status
        all_commands_ok = all(commands_dict.values())
        auth_ok = auth_dict["is_authenticated"]
        all_apis_ok = all(summary["apis"].values())
        all_files_ok = all(files_dict.values())

        if all_commands_ok and auth_ok and all_apis_ok and all_files_ok:
            summary["overall_status"] = "ready"
        elif all_commands_ok and auth_ok:
            summary["overall_status"] = "partial"
        else:
            summary["overall_status"] = "not_ready"

    except Exception as e:
        summary["error"] = str(e)
        summary["overall_status"] = "error"

    return summary
