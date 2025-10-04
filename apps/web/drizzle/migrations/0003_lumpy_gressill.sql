-- Custom migration: Set up document timeout cleanup with pg_cron
-- This migration creates an automated cleanup job that runs every 3 minutes
-- to identify documents stuck in "processing" status for over 65 minutes (1 hour 5 minutes)
-- and marks them as "error" with actionable user messaging

-- Schedule cleanup job to run every 3 minutes
SELECT cron.schedule(
  'cleanup-stuck-documents',
  '*/3 * * * *',  -- Every 3 minutes
  $$
  UPDATE documents
  SET status = 'error',
      updated_at = CURRENT_TIMESTAMP,
      processing_error = 'Upload processing failed due to timeout. Please delete this document and upload it again. Large files may take longer to process.'
  WHERE status = 'processing'
    AND updated_at < NOW() - INTERVAL '65 minutes';
  $$
);
