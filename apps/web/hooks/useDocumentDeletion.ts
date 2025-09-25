import { useState, useCallback } from "react";
import { toast } from "sonner";
import { DocumentWithProcessingJob } from "@/lib/documents";
import { useUsage } from "@/contexts/UsageContext";

export interface UseDocumentDeletionReturn {
  deleteDialogOpen: boolean;
  deleteDocumentId: string | null;
  deleteDocumentName: string;
  deletingDocumentId: string | null;
  handleDeleteClick: (documentId: string, documentName: string) => void;
  handleDeleteConfirm: () => Promise<void>;
  handleDeleteCancel: () => void;
}

interface UseDocumentDeletionProps {
  setDocuments: React.Dispatch<
    React.SetStateAction<DocumentWithProcessingJob[]>
  >;
}

export function useDocumentDeletion({
  setDocuments,
}: UseDocumentDeletionProps): UseDocumentDeletionReturn {
  const { refreshUsage } = useUsage();

  // Deletion state management
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteDocumentId, setDeleteDocumentId] = useState<string | null>(null);
  const [deleteDocumentName, setDeleteDocumentName] = useState<string>("");
  const [deletingDocumentId, setDeletingDocumentId] = useState<string | null>(
    null,
  );

  // Handle clicking delete button on a document
  const handleDeleteClick = useCallback(
    (documentId: string, documentName: string) => {
      setDeleteDocumentId(documentId);
      setDeleteDocumentName(documentName);
      setDeleteDialogOpen(true);
    },
    [],
  );

  // Handle confirming document deletion
  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteDocumentId) return;

    try {
      // Set loading state
      setDeletingDocumentId(deleteDocumentId);

      const response = await fetch(`/api/documents/${deleteDocumentId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        // Handle different error types
        if (response.status === 401 || response.status === 403) {
          toast.error("Not authorized to delete this document");
        } else if (response.status === 404) {
          toast.error("Document not found");
        } else {
          toast.error("Failed to delete document");
        }
        throw new Error("Failed to delete document");
      }

      // Remove from local state
      setDocuments((prev) => prev.filter((doc) => doc.id !== deleteDocumentId));

      // Refresh usage stats from server for accuracy
      refreshUsage();

      // Show success toast
      toast.success(`Document "${deleteDocumentName}" deleted successfully`);

      // Reset dialog state
      setDeleteDialogOpen(false);
      setDeleteDocumentId(null);
      setDeleteDocumentName("");
    } catch (err) {
      console.error("Delete failed:", err);

      // Show error toast for network/other errors
      if (err instanceof Error && err.message.includes("fetch")) {
        toast.error(
          "Connection failed. Please check your internet connection and try again.",
        );
      } else if (
        !(err instanceof Error) ||
        !err.message?.includes("Failed to delete document")
      ) {
        // Only show generic error if we haven't already shown a specific one
        toast.error("An unexpected error occurred. Please try again.");
      }
    } finally {
      // Clear loading state
      setDeletingDocumentId(null);
    }
  }, [deleteDocumentId, deleteDocumentName, setDocuments, refreshUsage]);

  // Handle canceling document deletion
  const handleDeleteCancel = useCallback(() => {
    setDeleteDialogOpen(false);
    setDeleteDocumentId(null);
    setDeleteDocumentName("");
  }, []);

  return {
    deleteDialogOpen,
    deleteDocumentId,
    deleteDocumentName,
    deletingDocumentId,
    handleDeleteClick,
    handleDeleteConfirm,
    handleDeleteCancel,
  };
}
