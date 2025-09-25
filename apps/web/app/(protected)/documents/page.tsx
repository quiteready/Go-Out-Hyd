"use client";

import React, { useState, useRef, useCallback } from "react";
import {
  DocumentList,
  DocumentListRef,
} from "@/components/documents/DocumentList";
import { BulkUploadDialog } from "@/components/documents/BulkUploadDialog";
import { toast } from "sonner";

export default function DocumentsPage() {
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);

  const documentListRef = useRef<DocumentListRef | null>(null);

  const handleUploadComplete = useCallback(
    (documentData: {
      id: string;
      originalFilename: string;
      fileSize: number;
      mimeType: string;
    }) => {
      console.log("Upload completed:", documentData);

      // Add optimistic document immediately with required properties
      documentListRef.current?.addOptimisticDocument({
        ...documentData,
        status: "processing" as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      // Show success toast for upload completion
      toast.success(
        `"${documentData.originalFilename}" uploaded successfully. Processing started.`,
      );
    },
    [],
  );

  const handleUploadError = useCallback((error: string) => {
    console.error("💥 [Documents] Upload error:", error);
    toast.error(`Upload failed: ${error}`);
  }, []);

  const handleUploadClick = useCallback(() => {
    setUploadDialogOpen(true);
  }, []);

  return (
    <div className="container mx-auto px-4 py-8 space-y-8 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold">Document Management</h1>
        <p className="text-muted-foreground mt-2">
          Upload and manage your documents for AI-powered search and chat.
        </p>
      </div>

      <div className="w-full">
        <DocumentList
          ref={documentListRef}
          onUploadClick={handleUploadClick}
          uploadDisabled={false}
        />
      </div>

      <BulkUploadDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        onUploadComplete={handleUploadComplete}
        onUploadError={handleUploadError}
      />
    </div>
  );
}
