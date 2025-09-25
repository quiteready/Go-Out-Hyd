"use client";

import React, { useState, useRef, useCallback } from "react";
import {
  DocumentList,
  DocumentListRef,
} from "@/components/documents/DocumentList";
import { BulkUploadDialog } from "@/components/documents/BulkUploadDialog";
import { DocumentsUsageWarningBanner } from "@/components/documents/DocumentsUsageWarningBanner";
import { useUsage } from "@/contexts/UsageContext";
import { toast } from "sonner";

export default function DocumentsPage() {
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const { refreshUsage, canUpload } = useUsage();

  // Replace refreshKey with direct refresh mechanism
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

      // Refresh usage stats from server for accuracy
      refreshUsage();

      // Show success toast for upload completion
      toast.success(
        `"${documentData.originalFilename}" uploaded successfully. Processing started.`,
      );
    },
    [refreshUsage],
  );

  const handleUploadError = useCallback((error: string) => {
    // Storage limit errors are handled gracefully with UI dialogs, so log as warnings
    if (error.includes("Storage limit exceeded")) {
      console.warn("⚠️ [Documents] Storage limit exceeded:", error);
      toast.error("Storage limit exceeded. Please upgrade.");
    } else if (
      error.includes("Unsupported file type") ||
      error.includes("File too large")
    ) {
      console.warn("⚠️ [Documents] File validation error:", error);
      toast.error("File validation error. Please try again.");
    } else {
      console.error("💥 [Documents] Upload error:", error);
      // Show toast for unexpected errors that aren't handled by specialized dialogs
      toast.error(`Upload failed: ${error}`);
    }
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

      {/* Usage Warning Banner */}
      <DocumentsUsageWarningBanner />

      <div className="w-full">
        <DocumentList
          ref={documentListRef}
          onUploadClick={handleUploadClick}
          uploadDisabled={!canUpload}
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
