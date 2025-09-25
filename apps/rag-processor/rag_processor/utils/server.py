"""
Server utilities for RAG processor.

Provides server startup and configuration for Cloud Run deployment.
"""

import structlog
import uvicorn

from ..config import config
from .logging import setup_logging

logger = structlog.get_logger(__name__)


def start_server() -> None:
    """Start the server in production mode for Cloud Run deployment."""
    setup_logging()

    host = config.HOST
    port = config.PORT

    logger.info(
        "Starting RAG processor server in production mode",
        host=host,
        port=port,
        environment=config.ENVIRONMENT,
        project_id=config.PROJECT_ID,
        reload_enabled=False,
    )

    uvicorn.run(
        "rag_processor.main:app",
        host=host,
        port=port,
        reload=False,  # Always disabled for Cloud Run
        log_level=config.LOG_LEVEL.lower(),
    )
