import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";
import { DocumentWithProcessingJob } from "@/lib/documents";

export interface UseDocumentsReturn {
  documents: DocumentWithProcessingJob[];
  optimisticDocuments: DocumentWithProcessingJob[];
  loading: boolean;
  error: string | null;
  fetchDocuments: () => Promise<void>;
  setDocuments: React.Dispatch<
    React.SetStateAction<DocumentWithProcessingJob[]>
  >;
  setOptimisticDocuments: React.Dispatch<
    React.SetStateAction<DocumentWithProcessingJob[]>
  >;
  addOptimisticDocument: (
    documentData: Omit<DocumentWithProcessingJob, "id"> & { id?: string },
  ) => void;
}

export function useDocuments(): UseDocumentsReturn {
  const [documents, setDocuments] = useState<DocumentWithProcessingJob[]>([]);
  const [optimisticDocuments, setOptimisticDocuments] = useState<
    DocumentWithProcessingJob[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all documents with processing status
  const fetchDocuments = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/documents");

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || "Failed to fetch documents";
        throw new Error(errorMessage);
      }

      const data = await response.json();
      setDocuments(data.documents);
      setError(null);

      // Clean up optimistic documents that now have real counterparts
      if (data.documents && data.documents.length > 0) {
        const serverIds = new Set(
          data.documents.map((doc: DocumentWithProcessingJob) => doc.id),
        );
        const serverFilenames = new Set(
          data.documents.map(
            (doc: DocumentWithProcessingJob) => doc.originalFilename,
          ),
        );
        setOptimisticDocuments((prev) =>
          prev.filter(
            (doc) =>
              !serverIds.has(doc.id) &&
              !serverFilenames.has(doc.originalFilename),
          ),
        );
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load documents";
      setError(errorMessage);

      // Show toast notification for user feedback
      toast.error(`Failed to load documents: ${errorMessage}`);

      console.error("❌ Error fetching documents:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch documents on component mount
  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  // Add optimistic document for immediate UI feedback during upload
  const addOptimisticDocument = useCallback(
    (documentData: Omit<DocumentWithProcessingJob, "id"> & { id?: string }) => {
      const optimisticDoc: DocumentWithProcessingJob = {
        ...documentData,
        id: documentData.id || `optimistic-${Date.now()}`,
        status: "processing",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        processingJob: {
          id: `optimistic-job-${Date.now()}`,
          status: "pending",
          processingStage: "queued",
          retryCount: 0,
          fileType: documentData.mimeType,
          filePath: `optimistic/${documentData.originalFilename}`,
        },
      };

      setOptimisticDocuments((prev) => [optimisticDoc, ...prev]);

      // Immediately refresh the document list to show the new upload
      fetchDocuments();

      // Remove optimistic document after 30 seconds if still there (fallback)
      setTimeout(() => {
        setOptimisticDocuments((prev) =>
          prev.filter((doc) => doc.id !== optimisticDoc.id),
        );
      }, 30000);
    },
    [fetchDocuments],
  );

  return {
    documents,
    optimisticDocuments,
    loading,
    error,
    fetchDocuments,
    setDocuments,
    setOptimisticDocuments,
    addOptimisticDocument,
  };
}
