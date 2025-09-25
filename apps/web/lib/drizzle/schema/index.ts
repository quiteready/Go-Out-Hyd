// Schema exports - all database schemas are exported from here
// This file is needed for the database connection setup

export * from "./conversations";
export * from "./messages";
export * from "./users";
export * from "./usage-events";
export * from "./documents";
export * from "./document_chunks";
export * from "./document_processing_jobs";

export { TEXT_EMBEDDING_DIMENSIONS } from "./document_chunks";
