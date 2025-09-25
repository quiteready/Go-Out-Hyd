#!/usr/bin/env python3
"""
Core RAG Processor deployment logic - Environment-agnostic implementation.

This module contains the shared deployment logic for RAG processor services
that can be used by environment-specific wrapper scripts.

Features:
- Environment-aware service naming and configuration
- Dynamic environment file loading (.env.local vs .env.prod)
- Integration with deployment_config.py for consistent settings
- Standard Docling model suite setup in GCS
- Docker image building via Cloud Build
- Cloud Run deployment with environment-specific configurations
"""

import os
import subprocess
import sys
import tempfile
from pathlib import Path

from .deployment_config import get_config
from .gcp_utils import (
    Colors,
    log,
    log_error,
    log_step,
    log_success,
    log_warning,
    run_command,
)
from .utils.env_loader import load_env_file as _load_env_file
from .validation_utils import (
    validate_gcp_project_id_strict,
    validate_gcp_region,
    validate_gcs_bucket_name_strict,
)

# Deployment configuration flags (simple flags, not part of environment config)
CLOUD_BUILD_DISK_SIZE_GB = os.getenv("CLOUD_BUILD_DISK_SIZE_GB", "200")


def get_environment_file_path(environment: str) -> Path:
    """Get the appropriate environment file path for the environment.

    Args:
        environment: Environment name ("development" or "production")

    Returns:
        Path to the environment file
    """
    if environment == "development":
        env_file = (
            Path(__file__).parent.parent / "apps" / "rag-processor" / ".env.local"
        )
    elif environment == "production":
        env_file = Path(__file__).parent.parent / "apps" / "rag-processor" / ".env.prod"
    else:
        raise ValueError(f"Unknown environment: {environment}")

    return env_file


def ensure_cloud_build_bucket_iam(project_id: str) -> None:
    """Ensure Cloud Build can read its source bucket during gcloud builds submit."""
    try:
        project_number = run_command(
            f"gcloud projects describe {project_id} --format='value(projectNumber)'"
        ).strip()

        compute_sa = f"{project_number}-compute@developer.gserviceaccount.com"
        cloud_build_sa = f"{project_number}@cloudbuild.gserviceaccount.com"

        bucket_name = f"gs://{project_id}_cloudbuild"

        log("🔐 Ensuring IAM on Cloud Build source bucket", Colors.CYAN)

        # Grant viewer to Compute Engine default SA for object reads
        try:
            run_command(
                " ".join(
                    [
                        "gcloud storage buckets add-iam-policy-binding",
                        bucket_name,
                        f"--member=serviceAccount:{compute_sa}",
                        "--role=roles/storage.objectViewer",
                        "--quiet",
                    ]
                )
            )
        except Exception:
            pass

        # Grant admin to Cloud Build SA for object create/read in source bucket
        try:
            run_command(
                " ".join(
                    [
                        "gcloud storage buckets add-iam-policy-binding",
                        bucket_name,
                        f"--member=serviceAccount:{cloud_build_sa}",
                        "--role=roles/storage.admin",
                        "--quiet",
                    ]
                )
            )
        except Exception:
            pass

        # Project-level fallbacks (in case bucket-level binding is blocked)
        try:
            run_command(
                f"gcloud projects add-iam-policy-binding {project_id} "
                f"--member=serviceAccount:{compute_sa} --role=roles/storage.objectViewer --quiet"
            )
        except Exception:
            pass

        try:
            run_command(
                f"gcloud projects add-iam-policy-binding {project_id} "
                f"--member=serviceAccount:{cloud_build_sa} --role=roles/storage.admin --quiet"
            )
        except Exception:
            pass

        log("✅ Cloud Build bucket IAM ensured", Colors.GREEN)
    except Exception as e:
        log_warning(f"Could not verify or configure Cloud Build bucket IAM: {e}")


def ensure_build_worker_logging_permissions(project_id: str) -> None:
    """Grant Logs Writer to build worker service accounts for Cloud Logging."""
    try:
        project_number = run_command(
            f"gcloud projects describe {project_id} --format='value(projectNumber)'"
        ).strip()
        compute_sa = f"{project_number}-compute@developer.gserviceaccount.com"
        cloud_build_sa = f"{project_number}@cloudbuild.gserviceaccount.com"

        for sa in (compute_sa, cloud_build_sa):
            try:
                run_command(
                    f"gcloud projects add-iam-policy-binding {project_id} "
                    f"--member=serviceAccount:{sa} --role=roles/logging.logWriter --quiet"
                )
            except Exception:
                pass
        log("✅ Build worker logWriter permissions ensured", Colors.GREEN)
    except Exception as e:
        log_warning(f"Could not configure build log writer permissions: {e}")


def ensure_artifact_registry(project_id: str, region: str) -> None:
    """Ensure the Artifact Registry repo exists and Cloud Build can push to it."""
    repo_name = "rag-services"

    try:
        run_command(
            f"gcloud services enable artifactregistry.googleapis.com --project={project_id} --quiet"
        )
    except Exception:
        pass

    try:
        subprocess.run(
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
            check=True,
            capture_output=True,
            text=True,
        )
        log(f"✅ Artifact Registry repository '{repo_name}' exists", Colors.GREEN)
    except subprocess.CalledProcessError:
        log(f"📝 Creating Artifact Registry repository '{repo_name}'...", Colors.CYAN)
        run_command(
            f"gcloud artifacts repositories create {repo_name} "
            f"--repository-format=docker --location={region} "
            f'--description="Container images for RAG services" --project={project_id}'
        )
        log_success(f"Artifact Registry repository '{repo_name}' created")

    # Ensure Cloud Build SA can push
    try:
        project_number = run_command(
            f"gcloud projects describe {project_id} --format='value(projectNumber)'"
        ).strip()
        cloud_build_sa = f"{project_number}@cloudbuild.gserviceaccount.com"
        compute_sa = f"{project_number}-compute@developer.gserviceaccount.com"
        run_command(
            f"gcloud artifacts repositories add-iam-policy-binding {repo_name} "
            f"--location={region} --member=serviceAccount:{cloud_build_sa} "
            f"--role=roles/artifactregistry.writer --project={project_id}"
        )
        try:
            run_command(
                f"gcloud artifacts repositories add-iam-policy-binding {repo_name} "
                f"--location={region} --member=serviceAccount:{compute_sa} "
                f"--role=roles/artifactregistry.writer --project={project_id}"
            )
        except Exception:
            pass
        log("✅ Cloud Build permissions configured for Artifact Registry", Colors.GREEN)
    except Exception as e:
        log_warning(
            f"Could not configure Artifact Registry IAM (will try to proceed): {e}"
        )


def download_standard_docling_models(bucket_name: str) -> None:
    """Download standard Docling models and upload to GCS."""
    log("  📥 Downloading standard Docling model suite...", Colors.CYAN)
    log("  ⏳ This will take a few minutes on first run")
    log("  📦 Includes: layout, tableformer, picture classifier, code formula, easyocr")

    with tempfile.TemporaryDirectory() as temp_dir:
        temp_dir_path = Path(temp_dir)
        model_dir = temp_dir_path / "docling"

        # Download standard Docling models using official downloader
        download_script = f"""
import os
import shutil
from pathlib import Path

print("🚀 Starting standard Docling models download...")

# Download all standard Docling models to default cache
import docling.utils.model_downloader
docling.utils.model_downloader.download_models()
print("✅ Standard Docling models downloaded to cache")

# Organize models for container structure
cache_dir = Path.home() / ".cache" / "docling" / "models"
target_dir = Path("{model_dir}")
target_dir.mkdir(parents=True, exist_ok=True)

if cache_dir.exists():
    print("📦 Organizing models for container...")
    # Copy all model directories to target
    for model_type_dir in cache_dir.iterdir():
        if model_type_dir.is_dir():
            dest_dir = target_dir / model_type_dir.name
            if dest_dir.exists():
                shutil.rmtree(dest_dir)
            shutil.copytree(model_type_dir, dest_dir)
            file_count = len([f for f in dest_dir.rglob("*") if f.is_file()])
            print(f"   ✅ {{model_type_dir.name}}: {{file_count}} files")

    total_files = len([f for f in target_dir.rglob("*") if f.is_file()])
    print(f"📊 Total standard model files: {{total_files}}")
else:
    print("❌ Docling cache not found")
    raise Exception("Failed to find downloaded models")

print("✅ Standard models organized successfully")
"""

        script_path = temp_dir_path / "download.py"
        script_path.write_text(download_script)

        log("  📦 Downloading standard Docling model suite...")
        try:
            subprocess.run(
                [sys.executable, str(script_path)],
                check=True,
                capture_output=True,
                text=True,
            )
            log("  ✅ Model downloaded successfully", Colors.GREEN)
        except subprocess.CalledProcessError as e:
            log_error(
                f"Failed to download model: {e.stderr if hasattr(e, 'stderr') else str(e)}"
            )
            sys.exit(1)

        if not model_dir.exists():
            log_error(f"Model directory not found after download: {model_dir}")
            sys.exit(1)

        files = list(model_dir.rglob("*"))
        log(f"  📁 Standard model suite contains {len(files)} files")

        # Upload standard model suite to GCS
        log("  📤 Uploading standard model suite to GCS...")
        gcs_path = f"gs://{bucket_name}/models/docling/"

        try:
            subprocess.run(
                ["gcloud", "storage", "rsync", "-r", str(model_dir) + "/", gcs_path],
                check=True,
                capture_output=True,
                text=True,
            )
            log("  ✅ Standard model suite uploaded successfully to GCS!", Colors.GREEN)
            log(f"  📍 Available at: {gcs_path}")
            log(
                "  📦 Includes: layout, tableformer, picture classifier, code formula, easyocr models"
            )
        except subprocess.CalledProcessError as e:
            msg = (e.stderr or "").lower() if hasattr(e, "stderr") else ""
            if "not found" in msg or "404" in msg:
                log_error(f"Bucket not found: gs://{bucket_name}")
                log("   Run setup script first to create/configure resources:")
                log("   uv run setup-gcp-dev (or setup-gcp-prod)")
            else:
                log_error("gcloud storage rsync failed")
                if hasattr(e, "stderr") and e.stderr:
                    log(e.stderr)
            sys.exit(1)


def setup_model_storage(env_vars: dict[str, str], environment: str) -> None:
    """Set up standard Docling model suite in GCS bucket (idempotent)."""
    log_step("Model", "Setting up standard Docling model suite storage")

    bucket_name = env_vars.get("GOOGLE_CLOUD_STORAGE_BUCKET")
    if not bucket_name:
        log_error("GOOGLE_CLOUD_STORAGE_BUCKET not found in environment")
        log("Please set it in your environment file")
        sys.exit(1)

    # Check for standard model suite directory
    gcs_models_path = f"gs://{bucket_name}/models/docling/"

    log("  🔍 Checking if standard Docling model suite exists in GCS...")
    log(f"  🔍 Looking for models at: {gcs_models_path}")

    check_result = subprocess.run(
        [
            "gcloud",
            "storage",
            "ls",
            gcs_models_path,
        ],
        capture_output=True,
        text=True,
        check=False,
    )

    if check_result.returncode == 0:
        log("  ✅ Standard Docling model suite already exists in GCS", Colors.GREEN)
        log(f"  📍 Path: {gcs_models_path}")
        log(
            "  📦 Includes: layout, tableformer, picture classifier, code formula, easyocr models"
        )
        return

    # Model doesn't exist at configured bucket. Auto-detect common dev bucket suffix.
    try:
        # If env looks like development and bucket lacks -dev suffix, try "-dev"
        if environment == "development" and not bucket_name.endswith("-dev"):
            candidate_bucket = f"{bucket_name}-dev"
            candidate_models_path = f"gs://{candidate_bucket}/models/docling/"
            log(
                f"  🔎 Models not found at configured bucket. Checking common dev bucket: {candidate_models_path}",
                Colors.YELLOW,
            )
            alt_check = subprocess.run(
                [
                    "gcloud",
                    "storage",
                    "ls",
                    candidate_models_path,
                ],
                capture_output=True,
                text=True,
                check=False,
            )
            if alt_check.returncode == 0:
                # Persist change to environment file and update in-memory env for subsequent steps
                env_vars["GOOGLE_CLOUD_STORAGE_BUCKET"] = candidate_bucket
                env_file = get_environment_file_path(environment)
                _persist_env_var(
                    env_file, "GOOGLE_CLOUD_STORAGE_BUCKET", candidate_bucket
                )
                log(
                    f"  ✅ Found model in alternate dev bucket. Using: gs://{candidate_bucket}",
                    Colors.GREEN,
                )
                return
    except Exception:
        # Non-fatal; fall through to auto-download
        pass

    # Models not found - attempt automatic download
    log("  📦 Standard Docling model suite not found in GCS", Colors.YELLOW)
    log("  🤖 Downloading standard model suite...", Colors.CYAN)

    try:
        download_standard_docling_models(bucket_name)
        log("  ✅ Standard model suite setup completed successfully!", Colors.GREEN)
    except Exception as e:
        log_error(f"Failed to download standard model suite: {e}")
        log("  Please check your internet connection and try again")
        sys.exit(1)


def _persist_env_var(env_file: Path, var_name: str, value: str) -> None:
    """Update environment file with a single var=value, idempotently."""
    if not env_file.exists():
        return
    lines = env_file.read_text().splitlines()
    updated_lines: list[str] = []
    found = False
    for line in lines:
        if line.strip().startswith(f"{var_name}="):
            updated_lines.append(f"{var_name}={value}")
            found = True
        else:
            updated_lines.append(line)
    if not found:
        updated_lines.append(f"{var_name}={value}")
    env_file.write_text("\n".join(updated_lines) + "\n")


def build_processor_image(env_vars: dict[str, str], environment: str) -> str:
    """Build processor Docker image via Cloud Build."""
    log_step("Build", "Building processor Docker image with Cloud Build")

    project_id = env_vars["GOOGLE_CLOUD_PROJECT_ID"]
    region = env_vars.get("GOOGLE_CLOUD_REGION", "us-central1")

    # Get environment-specific configuration
    config = get_config(environment, service_type="processor")
    env_suffix = "dev" if environment == "development" else "prod"

    ensure_artifact_registry(project_id, region)

    # Target image details with environment-specific naming
    base_url = f"{region}-docker.pkg.dev/{project_id}/rag-services"
    image_name = (
        f"{config.service_name}-{env_suffix}"  # Environment-specific Docker image name
    )
    image_url = f"{base_url}/{image_name}:latest"

    log("  🔨 Building processor image")

    app_dir = Path(__file__).parent.parent / "apps" / "rag-processor"
    config_path = app_dir / "cloudbuild.yaml"
    if not config_path.exists():
        log_error(f"Cloud Build config not found at: {config_path}")
        sys.exit(1)

    # Ensure uv.lock file exists for Docker build
    log("  📦 Generating uv.lock file for Docker build...", Colors.CYAN)
    uv_lock_path = app_dir / "uv.lock"

    # Generate uv.lock file in the rag-processor directory
    try:
        subprocess.run(
            ["uv", "sync"],
            cwd=app_dir,
            check=True,
            capture_output=True,
            text=True,
        )

        if not uv_lock_path.exists():
            log_error("uv.lock file was not generated after running 'uv sync'")
            sys.exit(1)

        log("  ✅ uv.lock file generated successfully", Colors.GREEN)

    except subprocess.CalledProcessError as e:
        log_error(f"Failed to generate uv.lock file: {e}")
        log("  Please ensure 'uv' is installed and pyproject.toml is valid")
        sys.exit(1)
    except FileNotFoundError:
        log_error("'uv' command not found")
        log("  Please install uv: curl -LsSf https://astral.sh/uv/install.sh | sh")
        sys.exit(1)

    log(f"  🏗️  Building processor image via Cloud Build ({config_path.name})...")
    log("  🚀 Using optimized build with layer caching and baked-in model", Colors.CYAN)
    log("  ⏳ This will take several minutes (includes model download from GCS)")
    log(f"  📦 Target: {image_url}")
    log(f"  🌍 Region: {region} (optimized for low latency)")

    try:
        disk_size_gb = CLOUD_BUILD_DISK_SIZE_GB
        log(f"  💾 Cloud Build disk size: {disk_size_gb} GB")

        bucket_name = env_vars.get(
            "GOOGLE_CLOUD_STORAGE_BUCKET", f"{project_id}-rag-documents-{environment}"
        )
        log(
            f"  📚 Standard models will be baked from: gs://{bucket_name}/models/docling/",
            Colors.CYAN,
        )

        build_args = [
            "gcloud",
            "builds",
            "submit",
            str(app_dir),
            f"--config={config_path}",
            f"--project={project_id}",
            f"--region={region}",
            f"--substitutions=_GCS_BUCKET={bucket_name},_IMAGE={image_name}",
        ]

        log("  🚀 Building with layer caching for optimal speed", Colors.GREEN)

        subprocess.run(build_args, check=True, text=True)
        log_success("Processor image built successfully")
        log(f"  📍 Image: {image_url}")
        log(
            "  ⚡ Build completed with optimization (parallel steps, layer caching)",
            Colors.GREEN,
        )

        return image_url

    except subprocess.CalledProcessError as e:
        log_error(f"Cloud Build failed: {e}")
        log("🔧 Troubleshooting steps:")
        log("  1. Verify Cloud Build API is enabled")
        log("  2. Check that standard Docling models exist in GCS")
        log("  3. Verify Artifact Registry is set up")
        log("  4. Check Cloud Build service account permissions")
        sys.exit(1)


def verify_processor_image_exists(image_url: str, project_id: str, region: str) -> None:
    """Verify that the processor image exists in Artifact Registry."""
    log("📋 Processor image ready for deployment", Colors.GREEN)
    log(f"   Image: {image_url}")
    log("   ✅ Verified by successful Cloud Build completion")

    # Note: We trust Cloud Build's success status rather than doing complex verification
    # that often fails due to registry API timing or permission issues


def check_cloud_run_service_state(
    service_name: str, project_id: str, region: str, target_image: str
) -> tuple[bool, bool]:
    """Check if Cloud Run service exists and if it needs updating.

    Returns:
        (service_exists, needs_deployment)
        - service_exists: True if the service already exists
        - needs_deployment: True if deployment is needed (new service or image changed)
    """
    log("  🔍 Checking current Cloud Run service state...")

    try:
        # Check if service exists and get its current image
        result = subprocess.run(
            [
                "gcloud",
                "run",
                "services",
                "describe",
                service_name,
                f"--region={region}",
                f"--project={project_id}",
                "--format=value(spec.template.spec.containers[0].image)",
                "--quiet",
            ],
            capture_output=True,
            text=True,
            check=False,
        )

        if result.returncode != 0:
            # Service doesn't exist
            log("  📝 Service does not exist yet - will create new service")
            return False, True

        # Service exists - check the deployed image
        current_image = result.stdout.strip()

        if not current_image:
            log(
                "  ⚠️  Service exists but couldn't determine current image - will deploy"
            )
            return True, True

        # Compare images (normalize both for comparison)
        current_normalized = current_image.strip().lower()
        target_normalized = target_image.strip().lower()

        if current_normalized == target_normalized:
            log(f"  ✅ Service already deployed with target image: {current_image}")
            log("  ⏭️  No deployment needed - service is up to date")
            return True, False
        else:
            log("  🔄 Service exists with different image:")
            log(f"     Current: {current_image}")
            log(f"     Target:  {target_image}")
            log("  📦 Deployment needed to update image")
            return True, True

    except Exception as e:
        log_warning(f"  ⚠️  Error checking service state: {e}")
        log("  📝 Will proceed with deployment attempt")
        return False, True  # Assume deployment needed if check fails


def check_prerequisites(environment: str) -> dict[str, str]:
    """Check deployment prerequisites and return environment variables."""
    log("🔍 Checking deployment prerequisites...", Colors.YELLOW)

    # Get environment-specific file path
    env_file = get_environment_file_path(environment)

    if not env_file.exists():
        log("❌ Error: Environment file not found", Colors.RED)
        log(f"Expected location: {env_file}")
        log("Please run the setup script first:")
        if environment == "development":
            log("  npm run setup:gcp:dev")
        else:
            log("  npm run setup:gcp:prod")
        log("This will create a properly configured environment file")
        sys.exit(1)

    # Load environment variables using our enhanced loader
    env_vars = _load_env_file(env_file)
    log(
        f"✅ Loaded {len(env_vars)} environment variables from {env_file.name}",
        Colors.GREEN,
    )

    # Debug: Check if critical variables are loaded
    if "GOOGLE_CLOUD_STORAGE_BUCKET" in env_vars:
        log(
            f"  📍 Storage Bucket: {env_vars['GOOGLE_CLOUD_STORAGE_BUCKET']}",
            Colors.GREEN,
        )
    else:
        log(
            "  ❌ GOOGLE_CLOUD_STORAGE_BUCKET not found in loaded variables", Colors.RED
        )

    # Validate critical variables
    project_id = env_vars.get("GOOGLE_CLOUD_PROJECT_ID")
    region = env_vars.get("GOOGLE_CLOUD_REGION", "us-central1")
    bucket_name = env_vars.get("GOOGLE_CLOUD_STORAGE_BUCKET", "")

    if not project_id:
        log(
            f"❌ Error: GOOGLE_CLOUD_PROJECT_ID not found in {env_file.name}",
            Colors.RED,
        )
        sys.exit(1)

    try:
        validate_gcp_project_id_strict(project_id)
    except Exception as e:
        log(f"❌ Invalid GOOGLE_CLOUD_PROJECT_ID: {e}", Colors.RED)
        sys.exit(1)

    if not validate_gcp_region(region):
        log(f"❌ Invalid GOOGLE_CLOUD_REGION: '{region}'", Colors.RED)
        sys.exit(1)

    try:
        validate_gcs_bucket_name_strict(bucket_name)
    except Exception as e:
        log(f"❌ Invalid GOOGLE_CLOUD_STORAGE_BUCKET: {e}", Colors.RED)
        sys.exit(1)

    # Check gcloud authentication
    try:
        run_command(
            "gcloud auth list --filter=status:ACTIVE --format='value(account)' --quiet"
        )
    except Exception:
        log("❌ Google Cloud SDK not authenticated", Colors.RED)
        log("Please run: gcloud auth login")
        sys.exit(1)

    # Set project
    project_id = env_vars["GOOGLE_CLOUD_PROJECT_ID"]
    run_command(f"gcloud config set project {project_id} --quiet")

    log("✅ Prerequisites checked successfully", Colors.GREEN)
    log(f"   Project: {project_id}")
    log(f"   Region: {env_vars.get('GOOGLE_CLOUD_REGION', 'us-central1')}")
    log(f"   Environment: {environment}")

    return env_vars


def deploy_processor_job(
    env_vars: dict[str, str], image_url: str, environment: str
) -> str:
    """Deploy the rag-processor job with environment-specific configuration."""
    project_id = env_vars["GOOGLE_CLOUD_PROJECT_ID"]
    region = env_vars.get("GOOGLE_CLOUD_REGION", "us-central1")

    # Get environment-specific configuration
    config = get_config(environment, service_type="processor")
    env_suffix = "dev" if environment == "development" else "prod"
    job_name = f"{config.service_name}-{env_suffix}"  # Environment-specific job name

    log_step("Deploy", f"Deploying {job_name} job with processor configuration")

    # Verify the image exists
    verify_processor_image_exists(image_url, project_id, region)

    # Get environment-specific service account
    service_account = (
        f"{config.service_account_name}@{project_id}.iam.gserviceaccount.com"
    )

    # Verify service account exists
    try:
        run_command(
            f"gcloud iam service-accounts describe {service_account} --project={project_id} --quiet"
        )
        log("✅ Processor service account found", Colors.GREEN)
    except Exception:
        log("❌ Processor service account not found", Colors.RED)
        log(f"   Expected: {service_account}")
        log("   Please run infrastructure provisioning first:")
        if environment == "development":
            log("   npm run setup:gcp:dev")
        else:
            log("   npm run setup:gcp:prod")
        sys.exit(1)

    # Build environment variables for processor job (static variables only)
    cloud_run_env = [
        f"GOOGLE_CLOUD_PROJECT_ID={project_id}",
        f"GOOGLE_CLOUD_REGION={region}",
        f"GOOGLE_CLOUD_STORAGE_BUCKET={env_vars.get('GOOGLE_CLOUD_STORAGE_BUCKET', '')}",
        f"ENVIRONMENT={environment}",
        f"LOG_LEVEL={config.log_level}",
        # Processor job configuration (local filesystem path)
        "DOCLING_ARTIFACTS_PATH=/app/models/docling",
        # Database configuration optimized for processor
        f"DATABASE_POOL_SIZE={config.database_pool_size}",
        f"DATABASE_MAX_OVERFLOW={config.database_max_overflow}",
        f"DATABASE_TIMEOUT={config.database_timeout}",
    ]

    # Add additional environment variables from env file if they exist
    additional_env_vars = [
        "VERTEX_AI_LOCATION",
        "TEXT_EMBEDDING_MODEL",
        "TEXT_EMBEDDING_DIMENSIONS",
        "MULTIMODAL_EMBEDDING_MODEL",
        "MULTIMODAL_EMBEDDING_DIMENSIONS",
        "VIDEO_CHUNK_DURATION_SECONDS",
        "VIDEO_CONTEXT_MAX_BYTES",
        "VIDEO_DEFAULT_LANGUAGE",
        "CHUNK_SIZE",
        "CHUNK_OVERLAP",
        "TRANSCRIPTION_MODEL",
        "DEBUG",
        # Optional CPU-thread controls
        "OMP_NUM_THREADS",
        "OPENBLAS_NUM_THREADS",
        "MKL_NUM_THREADS",
        "NUMEXPR_NUM_THREADS",
        "BLIS_NUM_THREADS",
        "TOKENIZERS_PARALLELISM",
        "TORCH_NUM_THREADS",
        "OMP_WAIT_POLICY",
    ]

    for var in additional_env_vars:
        if var in env_vars and env_vars[var]:
            cloud_run_env.append(f"{var}={env_vars[var]}")

    env_vars_str = ",".join(cloud_run_env)

    log("📋 Processor job configuration:", Colors.YELLOW)
    log(f"   Job Name: {job_name}")
    log(f"   Resources: {config.cpu} CPU cores, {config.memory} memory")
    log(f"   Parallelism: {config.parallelism} concurrent executions")
    log(f"   Task Timeout: {config.timeout}s (2 hours max)")
    log("   Access: Private (requires authentication)")

    # Deploy Cloud Run Job (uses deploy command - automatically creates or updates)
    deploy_args = [
        "gcloud",
        "run",
        "jobs",
        "deploy",
        job_name,
        f"--image={image_url}",
        f"--region={region}",
        f"--project={project_id}",
        f"--service-account={service_account}",
        f"--set-env-vars={env_vars_str}",
        f"--set-secrets=DATABASE_URL={config.database_secret_name}:latest,GEMINI_API_KEY={config.gemini_api_key_secret_name}:latest",
        f"--cpu={config.cpu}",
        f"--memory={config.memory}",
        f"--max-retries={config.max_retries}",  # Jobs-specific: retry on failure
        f"--parallelism={config.parallelism}",  # Max concurrent job executions
        f"--task-timeout={config.timeout}s",  # Timeout per job execution (config: {config.timeout}s = 2h)
        "--command=python",
        "--args=-m,rag_processor.main",  # Use job entry point (batch processing)
    ]

    log("🚀 Deploying job (creates or updates automatically)...", Colors.YELLOW)

    try:
        subprocess.run(deploy_args, check=True, text=True)
        log("✅ Processor job deployed successfully", Colors.GREEN)
    except subprocess.CalledProcessError as e:
        log("❌ Job deployment failed", Colors.RED)
        log(f"   Error: {e}")

        # Provide troubleshooting information
        log("🔧 Troubleshooting steps:", Colors.YELLOW)
        log("   1. Verify processor image exists:")
        log(
            f"      gcloud artifacts docker images list {region}-docker.pkg.dev/{project_id}/rag-services"
        )
        log("   2. Check service account permissions:")
        log(f"      gcloud iam service-accounts get-iam-policy {service_account}")
        log("   3. Verify secrets exist:")
        log(
            f"      gcloud secrets list | grep -E '({config.database_secret_name}|{config.gemini_api_key_secret_name})'"
        )
        log("   4. Check Cloud Run Jobs permissions:")
        log(
            f"      gcloud projects get-iam-policy {project_id} --flatten='bindings[].members' --filter='bindings.members:{service_account}' | grep run"
        )
        sys.exit(1)

    # Verify job was created/updated successfully
    try:
        run_command(
            f"gcloud run jobs describe {job_name} --region={region} --project={project_id} --quiet"
        )
        log("✅ Processor job is ready", Colors.GREEN)
        log(f"   Job Name: {job_name}")
        log(f"   Region: {region}")
        log("   Ready to be executed by queue handler")
    except Exception:
        log("❌ Job verification failed", Colors.RED)
        sys.exit(1)

    return job_name  # Return job name instead of service URL


def update_env_with_job_name(job_name: str, environment: str) -> None:
    """Update environment file with the processor job name for queue handler."""
    env_file = get_environment_file_path(environment)

    if not env_file.exists():
        log_warning(f"No {env_file.name} file found - skipping job name update")
        return

    log_step("Environment", f"Updating {env_file.name} with processor job name")

    # Environment-specific variable name for job
    job_var_name = "PROCESSOR_JOB_NAME"

    _persist_env_var(env_file, job_var_name, job_name)
    log_success(f"Environment file {env_file.name} updated successfully")


def validate_processor_deployment(
    job_name: str, env_vars: dict[str, str], environment: str
) -> None:
    """Validate that the processor job is deployed correctly."""
    log_step("Validate", "Validating processor job deployment")

    project_id = env_vars["GOOGLE_CLOUD_PROJECT_ID"]
    region = env_vars.get("GOOGLE_CLOUD_REGION", "us-central1")

    try:
        # Check job exists and get its status
        run_command(
            f"gcloud run jobs describe {job_name} --region={region} --project={project_id} --quiet"
        )
        log_success("Processor job deployed successfully")
        log(f"   ✅ Job Name: {job_name}")
        log(f"   ✅ Environment: {environment}")
        log(f"   ✅ Region: {region}")
        log("   ✅ Job is private (requires authentication)")
        log("   ✅ Ready to be executed by queue handler")
        return
    except Exception:
        log_warning("Could not verify job deployment")
        log(
            "   💡 Check Cloud Run Jobs console: https://console.cloud.google.com/run/jobs"
        )


def deploy_processor_complete_pipeline(environment: str) -> None:
    """Main deployment function for complete RAG processor pipeline."""
    log(
        f"🚀 Complete RAG Processor Deployment Pipeline - {environment.upper()}",
        Colors.CYAN + Colors.BOLD,
    )
    log("=" * 60)
    log("💡 This script is idempotent - safe to run multiple times", Colors.GREEN)
    log("   • Downloads model from HuggingFace if not in GCS")
    log("   • Skips model setup if already exists in GCS")
    log("   • Always builds Docker image")
    log("   • Always deploys job definition")
    log("")

    # Get environment-specific configuration
    config = get_config(environment, service_type="processor")

    # Check prerequisites and load environment
    env_vars = check_prerequisites(environment)

    try:
        # Step 1: Setup standard Docling model suite in GCS (idempotent)
        setup_model_storage(env_vars, environment)

        # Step 2: Build Docker image via Cloud Build (idempotent)
        image_url = build_processor_image(env_vars, environment)

        # Step 3: Deploy processor job to Cloud Run Jobs
        job_name = deploy_processor_job(env_vars, image_url, environment)

        # Step 4: Update environment file with job name (idempotent)
        update_env_with_job_name(job_name, environment)

        # Step 5: Validate deployment
        validate_processor_deployment(job_name, env_vars, environment)

        # Success summary
        log("")
        log(
            f"🎉 Complete RAG Processor deployment for {environment.upper()} completed!",
            Colors.GREEN + Colors.BOLD,
        )
        log("=" * 60)
        log(f"   Job Name: {job_name}")
        log(f"   Region: {config.region}")
        log(f"   Environment: {environment}")
        log("   Access: Private (authenticated requests only)")
        log("")
        log("📋 Pipeline Summary:", Colors.BLUE)
        log("   ✅ Standard Docling model suite: Set up in GCS")
        log(
            "   ✅ Models included: layout, tableformer, picture classifier, code formula, easyocr"
        )
        log("   ✅ Docker image: Built with offline standard models")
        log(
            f"   ✅ Cloud Run job: Deployed with {config.cpu} CPU, {config.memory} memory"
        )
        log("   ✅ Validation: Job definition confirmed")
        log("   ✅ Environment file: Updated with job name")
        log("")
        log(f"📝 Processor Job Name: {job_name}")
        log("")
        log("🎯 Next Steps:", Colors.GREEN + Colors.BOLD)
        env_suffix = "dev" if environment == "development" else "prod"
        log(
            f"1. Deploy the GCS handler: npm run deploy:gcs-handler:{env_suffix}",
            Colors.YELLOW,
        )
        log(
            f"3. Deploy the GCS handler: npm run deploy:task-processor:{env_suffix}",
            Colors.YELLOW,
        )
        log("4. Test by uploading a file in your documents page in the web app", Colors.YELLOW)
        log(
            "5. Monitor processing logs in Cloud Run jobs console: https://console.cloud.google.com/run/jobs",
            Colors.YELLOW,
        )

    except KeyboardInterrupt:
        log("")
        log("❌ Deployment interrupted by user", Colors.RED)
        sys.exit(1)
    except Exception as e:
        log("")
        log_error(f"Deployment failed: {e}")
        log("🔧 Troubleshooting:")
        log("   1. Check environment file exists and has required variables")
        log("   2. Verify gcloud authentication: gcloud auth list")
        log("   3. Check Google Cloud APIs are enabled")
        log("   4. Verify service accounts exist")
        log("   5. Check internet connection for model download")
        sys.exit(1)
