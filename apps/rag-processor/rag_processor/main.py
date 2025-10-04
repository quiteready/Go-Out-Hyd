#!/usr/bin/env python3
"""
RAG Processor - Cloud Run Job Entry Point

Processes a single file from GCS and exits.
Environment variables provide job parameters.
"""

import asyncio
import os
import sys
from typing import cast

import structlog

from .config import config
from .services.processing_service import process_file_from_gcs
from .utils.logging import setup_logging
from .utils.retry_utils import NonRetryableError

logger = structlog.get_logger(__name__)


async def main() -> None:
    """Main job processing function."""
    setup_logging()

    # Get job parameters from environment variables
    job_id = os.environ.get("PROCESSING_JOB_ID")
    gcs_path = os.environ.get("GCS_FILE_PATH")
    user_id = os.environ.get("USER_ID")
    organization_id = os.environ.get("ORGANIZATION_ID")
    document_id = os.environ.get("DOCUMENT_ID")

    if not all([job_id, gcs_path, user_id]):
        logger.error("Missing required environment variables")
        logger.error("Required: PROCESSING_JOB_ID, GCS_FILE_PATH, USER_ID")
        logger.error(f"Got: job_id={job_id}, gcs_path={gcs_path}, user_id={user_id}")
        sys.exit(1)

    job_id = cast(str, job_id)
    gcs_path = cast(str, gcs_path)
    user_id = cast(str, user_id)

    logger.info(
        "Starting Cloud Run Job processing",
        job_id=job_id,
        gcs_path=gcs_path,
        user_id=user_id,
        organization_id=organization_id,
        document_id=document_id,
    )

    custom_metadata = {}
    if document_id:
        custom_metadata["document_id"] = document_id
    if organization_id:
        custom_metadata["organization_id"] = organization_id

    try:
        # Process the file using existing processing logic
        job = await process_file_from_gcs(
            job_id=job_id,
            gcs_path=gcs_path,
            user_id=user_id,
            organization_id=organization_id,
            custom_metadata=custom_metadata,
            project_id=config.PROJECT_ID,
        )

        logger.info(
            "Cloud Run Job completed successfully",
            job_id=job_id,
            processing_status=job.status.value,
        )

    except Exception as e:
        logger.error(
            "Cloud Run Job failed",
            job_id=job_id,
            error=str(e),
            error_type=type(e).__name__,
        )

        # Use different exit codes based on error type
        if isinstance(e, NonRetryableError):
            logger.info(
                "Non-retryable error detected, exiting without Cloud Run retry",
                job_id=job_id,
                error_type=type(e).__name__,
            )
            sys.exit(2)  # Signal permanent failure to Cloud Run (no retry)
        else:
            logger.info(
                "Retryable error detected, allowing Cloud Run retry",
                job_id=job_id,
                error_type=type(e).__name__,
            )
            sys.exit(1)  # Signal transient failure to Cloud Run (allow retry)


if __name__ == "__main__":
    asyncio.run(main())
