"""
Lightweight prerequisite checking utilities for deployment scripts.

Provides essential prerequisite validation without heavy ML dependencies.
"""

import subprocess
from shutil import which
from typing import Any


def check_deployment_prerequisites(
    project_id: str,
    required_commands: list[str],
    required_apis: list[str],
) -> list[str]:
    """Check deployment prerequisites and return missing items."""
    missing_items = []

    # Check required commands
    for cmd in required_commands:
        if not which(cmd):
            missing_items.append(f"Command '{cmd}' not found in PATH")

    # Check gcloud authentication (if gcloud is available)
    if "gcloud" in required_commands and which("gcloud"):
        try:
            result = subprocess.run(
                [
                    "gcloud",
                    "auth",
                    "list",
                    "--filter=status:ACTIVE",
                    "--format=value(account)",
                    "--quiet",
                ],
                capture_output=True,
                text=True,
                check=False,
            )
            if result.returncode != 0 or not result.stdout.strip():
                missing_items.append("gcloud authentication (run 'gcloud auth login')")
        except Exception:
            missing_items.append("gcloud authentication check failed")

    # Skip API checks if no project_id provided (for basic validation)
    if not project_id:
        return missing_items

    # Check required APIs (simplified - just verify project access)
    if required_apis and which("gcloud"):
        try:
            result = subprocess.run(
                ["gcloud", "projects", "describe", project_id, "--quiet"],
                capture_output=True,
                text=True,
                check=False,
            )
            if result.returncode != 0:
                missing_items.append(
                    f"Cannot access project '{project_id}' (check permissions)"
                )
        except Exception:
            missing_items.append("Project access check failed")

    return missing_items


def validate_deployment_environment(project_id: str, environment: str) -> None:
    """Validate deployment environment."""
    # Simplified validation for deployment scripts
    if not project_id:
        raise ValueError("Project ID is required")
    if environment not in ("development", "production", "staging"):
        raise ValueError(f"Invalid environment: {environment}")


def get_prerequisite_summary(project_id: str, environment: str) -> dict[str, Any]:
    """Get prerequisite summary."""
    # Get current gcloud account
    try:
        result = subprocess.run(
            [
                "gcloud",
                "auth",
                "list",
                "--filter=status:ACTIVE",
                "--format=value(account)",
                "--quiet",
            ],
            capture_output=True,
            text=True,
            check=False,
        )
        account_email = result.stdout.strip() if result.returncode == 0 else "unknown"
    except Exception:
        account_email = "unknown"

    return {
        "project_id": project_id,
        "environment": environment,
        "status": "validated",
        "overall_status": "ready",
        "authentication": {
            "account_email": account_email,
            "status": "active" if account_email != "unknown" else "inactive",
        },
    }
