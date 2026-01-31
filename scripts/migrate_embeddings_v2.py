#!/usr/bin/env python3
"""
Embedding Migration Script: Add 3072d embeddings to existing chunks.

This script migrates existing document chunks from text-embedding-004 (768 dimensions)
to gemini-embedding-001 (3072 dimensions) by populating the new text_embedding_v2 column.

IMPORTANT: This script does NOT delete any data. It only ADDs new embeddings to
the text_embedding_v2 column while preserving the existing text_embedding values.

Features:
- Batch database writes with exponential backoff retry (1s → 4s → 12s)
- Resilient to transient failures - won't crash on small hiccups
- Progress tracking with ETA estimates
- Dry-run mode to preview changes
- Verbose logging to track each step

Usage:
    # Run from project root - automatically loads apps/web/.env.local
    python scripts/migrate_embeddings_v2.py --dry-run

    # Or specify a custom env file
    python scripts/migrate_embeddings_v2.py --env-file /path/to/project/apps/web/.env.local

    # Run the migration
    python scripts/migrate_embeddings_v2.py

    # Run with custom batch sizes
    python scripts/migrate_embeddings_v2.py --batch-size 100 --write-batch-size 20
"""

import argparse
import os
import sys
import time
from datetime import datetime
from pathlib import Path
from typing import Any

import psycopg2
import psycopg2.extras


# Configuration
MODEL_NAME = "gemini-embedding-001"
DIMENSIONS = 3072
DEFAULT_BATCH_SIZE = 50  # Chunks to fetch from DB at a time
DEFAULT_WRITE_BATCH_SIZE = 10  # Chunks to write to DB in a single transaction
RATE_LIMIT_DELAY = 0.1  # Delay between API calls in seconds

# Retry configuration (exponential backoff: 1s → 4s → 12s)
MAX_RETRIES = 3
RETRY_DELAYS = [1, 4, 12]  # Seconds to wait between retries

# Default env file path (relative to this script)
DEFAULT_ENV_FILE = Path(__file__).parent.parent / "apps" / "web" / ".env.local"


def load_env_file(env_file_path: Path) -> dict[str, str]:
    """
    Load environment variables from a .env file.

    Args:
        env_file_path: Path to the .env file

    Returns:
        Dictionary of loaded environment variables
    """
    loaded_vars = {}

    if not env_file_path.exists():
        return loaded_vars

    with open(env_file_path) as f:
        for line in f:
            line = line.strip()
            # Skip empty lines and comments
            if not line or line.startswith("#"):
                continue

            # Handle KEY=VALUE format
            if "=" in line:
                key, _, value = line.partition("=")
                key = key.strip()
                value = value.strip()

                # Remove surrounding quotes if present
                if (value.startswith('"') and value.endswith('"')) or \
                   (value.startswith("'") and value.endswith("'")):
                    value = value[1:-1]

                # Set in environment and track
                os.environ[key] = value
                loaded_vars[key] = value

    return loaded_vars


def log(message: str, level: str = "INFO") -> None:
    """Print a timestamped log message."""
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(f"[{timestamp}] [{level}] {message}")


def log_step(step: str, message: str) -> None:
    """Print a step-based log message."""
    timestamp = datetime.now().strftime("%H:%M:%S")
    print(f"[{timestamp}] 🔹 {step}: {message}")


def get_genai_client():
    """Initialize Google GenAI client."""
    log_step("INIT", "Loading google-genai package...")
    try:
        import google.genai as genai
        from google.genai.types import EmbedContentConfig

        log_step("INIT", "Checking GEMINI_API_KEY environment variable...")
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            log("GEMINI_API_KEY environment variable not set", "ERROR")
            sys.exit(1)

        log_step("INIT", f"API key found (length: {len(api_key)} chars)")
        log_step("INIT", "Initializing GenAI client...")
        client = genai.Client(api_key=api_key)
        log_step("INIT", f"GenAI client initialized (model: {MODEL_NAME}, dimensions: {DIMENSIONS})")
        return client, EmbedContentConfig
    except ImportError:
        log("google-genai package not installed. Install with: pip install google-genai", "ERROR")
        sys.exit(1)


def get_chunks_needing_migration(conn, batch_size: int = DEFAULT_BATCH_SIZE) -> list[dict[str, Any]]:
    """
    Get chunks that have old embedding but no new embedding.

    Returns chunks with text_embedding populated but text_embedding_v2 NULL.
    """
    log_step("FETCH", f"Querying database for up to {batch_size} chunks needing migration...")
    with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cursor:
        cursor.execute("""
            SELECT id, content, document_id
            FROM document_chunks
            WHERE text_embedding IS NOT NULL
              AND text_embedding_v2 IS NULL
            ORDER BY created_at
            LIMIT %s
        """, (batch_size,))
        chunks = cursor.fetchall()
        log_step("FETCH", f"Found {len(chunks)} chunks to process")
        return chunks


def get_migration_stats(conn) -> dict[str, int]:
    """Get current migration statistics."""
    log_step("STATS", "Querying migration statistics...")
    with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cursor:
        # Total chunks with old embeddings
        cursor.execute("""
            SELECT COUNT(*) as total FROM document_chunks WHERE text_embedding IS NOT NULL
        """)
        total = cursor.fetchone()["total"]
        log_step("STATS", f"Total chunks with text_embedding: {total}")

        # Chunks already migrated
        cursor.execute("""
            SELECT COUNT(*) as migrated FROM document_chunks WHERE text_embedding_v2 IS NOT NULL
        """)
        migrated = cursor.fetchone()["migrated"]
        log_step("STATS", f"Already migrated (has text_embedding_v2): {migrated}")

        # Chunks needing migration
        cursor.execute("""
            SELECT COUNT(*) as pending FROM document_chunks
            WHERE text_embedding IS NOT NULL AND text_embedding_v2 IS NULL
        """)
        pending = cursor.fetchone()["pending"]
        log_step("STATS", f"Pending migration: {pending}")

        return {
            "total": total,
            "migrated": migrated,
            "pending": pending,
        }


def generate_embedding(client, embed_config_class, text: str, chunk_id: str) -> list[float]:
    """Generate 3072d embedding using gemini-embedding-001."""
    text_preview = text[:80].replace("\n", " ") + "..." if len(text) > 80 else text.replace("\n", " ")
    log_step("EMBED", f"Generating embedding for chunk {chunk_id[:8]}... (text: \"{text_preview}\")")

    start_time = time.time()
    response = client.models.embed_content(
        model=MODEL_NAME,
        contents=text,
        config=embed_config_class(
            task_type="RETRIEVAL_DOCUMENT",
            output_dimensionality=DIMENSIONS,
        ),
    )
    elapsed = time.time() - start_time
    embedding = list(response.embeddings[0].values)
    log_step("EMBED", f"Embedding generated in {elapsed:.2f}s (dimensions: {len(embedding)})")
    return embedding


def batch_update_embeddings_with_retry(
    conn,
    updates: list[tuple[str, list[float]]],
    max_retries: int = MAX_RETRIES,
) -> tuple[int, list[dict[str, Any]]]:
    """
    Batch update multiple chunks with new embeddings using exponential backoff retry.

    Args:
        conn: Database connection
        updates: List of (chunk_id, embedding) tuples to update
        max_retries: Maximum number of retry attempts

    Returns:
        Tuple of (successful_count, errors_list)
    """
    if not updates:
        return 0, []

    chunk_ids = [chunk_id[:8] for chunk_id, _ in updates]
    log_step("WRITE", f"Writing batch of {len(updates)} embeddings to database...")
    log_step("WRITE", f"Chunk IDs: {', '.join(chunk_ids)}")

    errors = []
    attempt = 0

    while attempt < max_retries:
        try:
            log_step("WRITE", f"Attempting database write (attempt {attempt + 1}/{max_retries})...")
            with conn.cursor() as cursor:
                # Use executemany for batch update
                update_data = [(emb, chunk_id) for chunk_id, emb in updates]

                cursor.executemany(
                    """
                    UPDATE document_chunks
                    SET text_embedding_v2 = %s
                    WHERE id = %s
                    """,
                    update_data,
                )
                log_step("WRITE", "Committing transaction...")
                conn.commit()

                log_step("WRITE", f"✅ Successfully wrote {len(updates)} embeddings to database")
                return len(updates), []

        except Exception as e:
            conn.rollback()
            attempt += 1

            if attempt < max_retries:
                delay = RETRY_DELAYS[min(attempt - 1, len(RETRY_DELAYS) - 1)]
                log_step("RETRY", f"⚠️ Database write failed: {e}")
                log_step("RETRY", f"⏳ Waiting {delay}s before retry (attempt {attempt}/{max_retries})...")
                time.sleep(delay)
            else:
                log_step("ERROR", f"❌ Database write failed after {max_retries} attempts: {e}")
                for chunk_id, _ in updates:
                    errors.append({"chunk_id": chunk_id, "error": str(e)})
                return 0, errors

    return 0, errors


def run_migration(
    database_url: str,
    batch_size: int,
    write_batch_size: int,
    dry_run: bool = False,
) -> dict[str, Any]:
    """
    Run the additive embedding migration with batched writes and retry logic.

    This function:
    1. Fetches chunks in batches from the database
    2. Generates embeddings for each chunk
    3. Queues updates and writes them in smaller batches with exponential backoff retry
    4. Preserves existing data and only adds to the text_embedding_v2 column

    Args:
        database_url: PostgreSQL connection string
        batch_size: Number of chunks to fetch from DB at a time
        write_batch_size: Number of chunks to write in a single transaction
        dry_run: If True, preview changes without executing

    Returns:
        Statistics dictionary with migration results
    """
    stats: dict[str, Any] = {
        "total_processed": 0,
        "migrated": 0,
        "errors": [],
        "start_time": time.time(),
    }

    # Parse database URL for logging (hide password)
    db_host = "unknown"
    try:
        if "@" in database_url:
            db_host = database_url.split("@")[1].split("/")[0]
    except Exception:
        pass

    log_step("DB", f"Connecting to database ({db_host})...")
    conn = psycopg2.connect(database_url)
    log_step("DB", "✅ Database connection established")

    if not dry_run:
        client, embed_config_class = get_genai_client()
    else:
        log_step("MODE", "🔍 DRY RUN MODE - No changes will be made")
        client, embed_config_class = None, None

    try:
        # Get initial stats
        initial_stats = get_migration_stats(conn)

        print(f"\n{'='*70}")
        print("  EMBEDDING MIGRATION: text-embedding-004 (768d) → gemini-embedding-001 (3072d)")
        print(f"{'='*70}")
        print(f"  Total chunks with text_embedding:      {initial_stats['total']:,}")
        print(f"  Already migrated (has text_embedding_v2): {initial_stats['migrated']:,}")
        print(f"  Pending migration:                     {initial_stats['pending']:,}")
        print(f"  Fetch batch size:                      {batch_size}")
        print(f"  Write batch size:                      {write_batch_size}")
        print(f"  Retry strategy:                        exponential backoff ({RETRY_DELAYS}s)")
        print(f"  Dry run:                               {dry_run}")
        print(f"{'='*70}\n")

        if initial_stats["pending"] == 0:
            log("✅ No chunks need migration. All done!", "SUCCESS")
            return stats

        log_step("START", f"Beginning migration of {initial_stats['pending']:,} chunks...")

        batch_num = 0
        while True:
            chunks = get_chunks_needing_migration(conn, batch_size)
            if not chunks:
                log_step("DONE", "No more chunks to process")
                break

            batch_num += 1
            stats["total_processed"] += len(chunks)

            print(f"\n{'─'*70}")
            log_step("BATCH", f"📦 Processing batch {batch_num} ({len(chunks)} chunks)")
            print(f"{'─'*70}")

            # Queue for batched writes: list of (chunk_id, embedding) tuples
            write_queue: list[tuple[str, list[float]]] = []

            for i, chunk in enumerate(chunks):
                chunk_id = str(chunk["id"])
                content = chunk["content"]
                doc_id = str(chunk["document_id"])[:8]

                log_step("CHUNK", f"Processing chunk {i + 1}/{len(chunks)} (id: {chunk_id[:8]}..., doc: {doc_id}...)")

                try:
                    if dry_run:
                        content_preview = content[:50].replace("\n", " ") + "..." if len(content) > 50 else content
                        log_step("DRY", f"Would migrate chunk {chunk_id[:8]}... (content: \"{content_preview}\")")
                        stats["migrated"] += 1
                        continue

                    # Generate new embedding
                    embedding = generate_embedding(client, embed_config_class, content, chunk_id)

                    # Add to write queue
                    write_queue.append((chunk_id, embedding))
                    log_step("QUEUE", f"Added to write queue (queue size: {len(write_queue)}/{write_batch_size})")

                    # When queue reaches write_batch_size, flush to database
                    if len(write_queue) >= write_batch_size:
                        log_step("FLUSH", f"Write queue full, flushing {len(write_queue)} embeddings to database...")
                        success_count, batch_errors = batch_update_embeddings_with_retry(
                            conn, write_queue
                        )
                        stats["migrated"] += success_count
                        stats["errors"].extend(batch_errors)
                        write_queue = []  # Clear the queue

                        # Progress indicator
                        progress_pct = (stats["migrated"] / initial_stats["pending"]) * 100
                        log_step("PROGRESS", f"✓ {stats['migrated']:,}/{initial_stats['pending']:,} chunks migrated ({progress_pct:.1f}%)")

                    # Rate limiting to avoid API throttling
                    time.sleep(RATE_LIMIT_DELAY)

                except Exception as e:
                    # Embedding generation failed - record error and continue
                    error_info = {"chunk_id": chunk_id, "error": str(e)}
                    stats["errors"].append(error_info)
                    log_step("ERROR", f"❌ Failed to generate embedding for chunk {chunk_id[:8]}: {e}")

            # Flush any remaining items in the write queue
            if write_queue and not dry_run:
                log_step("FLUSH", f"Flushing remaining {len(write_queue)} embeddings to database...")
                success_count, batch_errors = batch_update_embeddings_with_retry(
                    conn, write_queue
                )
                stats["migrated"] += success_count
                stats["errors"].extend(batch_errors)

            # Print batch summary
            elapsed = time.time() - stats["start_time"]
            rate = stats["migrated"] / elapsed if elapsed > 0 else 0
            remaining = initial_stats["pending"] - stats["migrated"]
            eta = remaining / rate if rate > 0 else 0

            print(f"\n{'─'*70}")
            log_step("SUMMARY", f"Batch {batch_num} complete")
            log_step("SUMMARY", f"Total migrated: {stats['migrated']:,}/{initial_stats['pending']:,}")
            log_step("SUMMARY", f"Rate: {rate:.1f} chunks/sec")
            log_step("SUMMARY", f"ETA: {eta/60:.1f} minutes remaining")
            if stats["errors"]:
                log_step("SUMMARY", f"⚠️ Errors so far: {len(stats['errors'])}")
            print(f"{'─'*70}\n")

    finally:
        log_step("DB", "Closing database connection...")
        conn.close()
        log_step("DB", "Database connection closed")

    return stats


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Migrate embeddings from text-embedding-004 (768d) to gemini-embedding-001 (3072d)"
    )
    parser.add_argument(
        "--dry-run", "-n",
        action="store_true",
        help="Preview changes without executing"
    )
    parser.add_argument(
        "--batch-size", "-b",
        type=int,
        default=DEFAULT_BATCH_SIZE,
        help=f"Number of chunks to fetch from DB per batch (default: {DEFAULT_BATCH_SIZE})"
    )
    parser.add_argument(
        "--write-batch-size", "-w",
        type=int,
        default=DEFAULT_WRITE_BATCH_SIZE,
        help=f"Number of chunks to write in a single DB transaction (default: {DEFAULT_WRITE_BATCH_SIZE})"
    )
    parser.add_argument(
        "--env-file", "-e",
        type=str,
        default=None,
        help=f"Path to .env file (default: {DEFAULT_ENV_FILE})"
    )
    args = parser.parse_args()

    print(f"\n{'='*70}")
    print("  EMBEDDING MIGRATION SCRIPT")
    print(f"  Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"{'='*70}\n")

    # Load environment file
    env_file_path = Path(args.env_file) if args.env_file else DEFAULT_ENV_FILE
    log_step("ENV", f"Looking for env file: {env_file_path}")

    if env_file_path.exists():
        loaded_vars = load_env_file(env_file_path)
        log_step("ENV", f"✅ Loaded {len(loaded_vars)} variables from {env_file_path.name}")

        # Show which required vars were loaded (without values)
        if "DATABASE_URL" in loaded_vars:
            log_step("ENV", "  ├─ DATABASE_URL: ✅ loaded")
        if "GEMINI_API_KEY" in loaded_vars:
            log_step("ENV", "  └─ GEMINI_API_KEY: ✅ loaded")
    else:
        log_step("ENV", f"⚠️ Env file not found: {env_file_path}")
        log_step("ENV", "Will check for environment variables directly...")

    # Check environment variables
    log_step("ENV", "Checking DATABASE_URL environment variable...")
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        log("DATABASE_URL environment variable not set", "ERROR")
        print("Set it with: export DATABASE_URL='postgresql://user:pass@host:port/db'")
        return 1
    log_step("ENV", "✅ DATABASE_URL found")

    if not args.dry_run:
        log_step("ENV", "Checking GEMINI_API_KEY environment variable...")
        gemini_key = os.getenv("GEMINI_API_KEY")
        if not gemini_key:
            log("GEMINI_API_KEY environment variable not set", "ERROR")
            print("Set it with: export GEMINI_API_KEY='your-api-key'")
            return 1
        log_step("ENV", "✅ GEMINI_API_KEY found")

    # Run migration
    stats = run_migration(
        database_url,
        args.batch_size,
        args.write_batch_size,
        args.dry_run,
    )

    # Print final summary
    elapsed = time.time() - stats.get("start_time", time.time())

    print(f"\n{'='*70}")
    if args.dry_run:
        print("  DRY RUN COMPLETE - NO CHANGES WERE MADE")
    else:
        print("  MIGRATION COMPLETE")
    print(f"  Finished at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"{'='*70}")
    print(f"  Total chunks processed: {stats['total_processed']:,}")
    print(f"  Successfully migrated:  {stats['migrated']:,}")
    print(f"  Errors:                 {len(stats['errors'])}")
    print(f"  Time elapsed:           {elapsed:.1f} seconds ({elapsed/60:.1f} minutes)")
    if stats['migrated'] > 0 and elapsed > 0:
        print(f"  Average rate:           {stats['migrated']/elapsed:.2f} chunks/sec")
    print(f"{'='*70}")

    if stats["errors"]:
        print("\n⚠️  Errors encountered:")
        for err in stats["errors"][:10]:
            print(f"  - Chunk {err['chunk_id'][:8]}...: {err['error']}")
        if len(stats["errors"]) > 10:
            print(f"  ... and {len(stats['errors']) - 10} more errors")

    print()

    # Return success even if there were some errors (partial success is OK)
    # Only return failure if ALL chunks failed
    if stats["migrated"] == 0 and stats["total_processed"] > 0:
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
