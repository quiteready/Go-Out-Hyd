ALTER TABLE "attachments" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "attachments" CASCADE;--> statement-breakpoint
ALTER TABLE "document_processing_jobs" ADD CONSTRAINT "document_processing_jobs_file_path_unique" UNIQUE("file_path");--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_gcs_path_unique" UNIQUE("gcs_path");