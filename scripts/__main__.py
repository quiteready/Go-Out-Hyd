#!/usr/bin/env python3
"""
Main entry point for scripts package.
Usage: python -m scripts.setup_gcp_dev
"""
import sys
from pathlib import Path

# Ensure the scripts directory is in the Python path
scripts_dir = Path(__file__).parent
if str(scripts_dir) not in sys.path:
    sys.path.insert(0, str(scripts_dir))

if __name__ == "__main__":
    # This allows running: python -m scripts
    print("Available scripts:")
    print("  setup_gcp_dev - Development GCP setup")
    print("  setup_gcp_prod - Production GCP setup")
    print("  deploy_rag_processor - Deploy RAG processor")
    print("  deploy_gcs_handler - Deploy GCS handler (Producer)")
    print("  deploy_task_processor - Deploy task processor (Consumer)")
    print("\nUsage: python -m scripts.<script_name>")
