"use client";

import { forwardRef, useImperativeHandle, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { File, CircleX, Loader2, Upload } from "lucide-react";
import { DocumentWithProcessingJob } from "@/lib/documents";
import { ErrorInspectionModal } from "./ErrorInspectionModal";
import { DocumentItem } from "./DocumentItem";
import { DeleteConfirmationDialog } from "./DeleteConfirmationDialog";
import { useDocuments } from "@/hooks/useDocuments";
import { useDocumentPolling } from "@/hooks/useDocumentPolling";
import { useDocumentDeletion } from "@/hooks/useDocumentDeletion";
import { formatPollingTime, mergeDocuments } from "@/lib/document-utils";

interface DocumentListProps {
  onUploadClick?: () => void;
  className?: string;
  uploadDisabled?: boolean;
}

export interface DocumentListRef {
  addOptimisticDocument: (
    document: Omit<DocumentWithProcessingJob, "id"> & { id?: string },
  ) => void;
}

export const DocumentList = forwardRef<DocumentListRef, DocumentListProps>(
  function DocumentList({ onUploadClick, className, uploadDisabled }, ref) {
    // Use custom hooks for state management
    const {
      documents,
      optimisticDocuments,
      loading,
      error,
      fetchDocuments,
      setDocuments,
      setOptimisticDocuments,
      addOptimisticDocument,
    } = useDocuments();

    const { isPolling, lastPollingUpdate } = useDocumentPolling({
      documents,
      optimisticDocuments,
      setDocuments,
      setOptimisticDocuments,
      fetchDocuments,
    });

    const {
      deleteDialogOpen,
      deleteDocumentName,
      deletingDocumentId,
      handleDeleteClick,
      handleDeleteConfirm,
      handleDeleteCancel,
    } = useDocumentDeletion({
      setDocuments,
    });

    // Error inspection modal state
    const [errorInspectionDoc, setErrorInspectionDoc] =
      useState<DocumentWithProcessingJob | null>(null);
    const [errorModalOpen, setErrorModalOpen] = useState(false);

    // Expose methods to parent component
    useImperativeHandle(
      ref,
      () => ({
        addOptimisticDocument,
      }),
      [addOptimisticDocument],
    );

    const handleErrorInspection = (
      document: DocumentWithProcessingJob,
    ): void => {
      setErrorInspectionDoc(document);
      setErrorModalOpen(true);
    };

    // Merge optimistic documents with server documents
    const allDocuments = mergeDocuments(documents, optimisticDocuments);

    if (loading) {
      return (
        <Card className={className}>
          <CardContent className="p-8">
            <div className="flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      );
    }

    if (error) {
      return (
        <Card className={className}>
          <CardContent className="p-8">
            <div className="text-center">
              <CircleX className="h-8 w-8 text-red-500 dark:text-red-400 mx-auto mb-3" />
              <p className="text-red-600 dark:text-red-400 font-medium">
                {error}
              </p>
            </div>
          </CardContent>
        </Card>
      );
    }

    return (
      <>
        <Card className={className}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="flex items-center space-x-2">
              <span>My Documents</span>
              {isPolling && (
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-xs text-muted-foreground">Live</span>
                  <span className="text-xs text-muted-foreground/70 hidden sm:inline">
                    • Updated {formatPollingTime(lastPollingUpdate)}
                  </span>
                </div>
              )}
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Button
                onClick={onUploadClick}
                variant="default"
                size="sm"
                className="bg-primary hover:bg-primary/90 text-white"
                disabled={uploadDisabled}
              >
                <Upload className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Upload Documents</span>
                <span className="sm:hidden">Upload</span>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {allDocuments.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <File className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                <p className="text-base font-medium mb-2">
                  No documents uploaded yet
                </p>
                <p className="text-sm">
                  Upload your first document to get started with AI-powered
                  search!
                </p>
              </div>
            ) : (
              <div className="space-y-0">
                {allDocuments.map((document) => (
                  <DocumentItem
                    key={document.id}
                    document={document}
                    deletingDocumentId={deletingDocumentId}
                    onDeleteClick={handleDeleteClick}
                    onErrorInspection={handleErrorInspection}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Delete Confirmation Dialog */}
        <DeleteConfirmationDialog
          open={deleteDialogOpen}
          onOpenChange={(open) => !open && handleDeleteCancel()}
          documentName={deleteDocumentName}
          isDeleting={deletingDocumentId !== null}
          onConfirm={handleDeleteConfirm}
          onCancel={handleDeleteCancel}
        />

        {/* Error Inspection Modal */}
        <ErrorInspectionModal
          document={errorInspectionDoc}
          open={errorModalOpen}
          onOpenChange={setErrorModalOpen}
        />
      </>
    );
  },
);
