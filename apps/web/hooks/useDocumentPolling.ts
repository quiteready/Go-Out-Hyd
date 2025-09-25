import { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";
import { DocumentWithProcessingJob } from "@/lib/documents";

export interface UseDocumentPollingReturn {
  isPolling: boolean;
  refreshTrigger: number;
  lastPollingUpdate: Date;
  startPolling: () => void;
  stopPolling: () => void;
  setRefreshTrigger: React.Dispatch<React.SetStateAction<number>>;
}

interface UseDocumentPollingProps {
  documents: DocumentWithProcessingJob[];
  optimisticDocuments: DocumentWithProcessingJob[];
  setDocuments: React.Dispatch<
    React.SetStateAction<DocumentWithProcessingJob[]>
  >;
  setOptimisticDocuments: React.Dispatch<
    React.SetStateAction<DocumentWithProcessingJob[]>
  >;
  fetchDocuments: () => Promise<void>;
}

export function useDocumentPolling({
  documents,
  optimisticDocuments,
  setDocuments,
  setOptimisticDocuments,
  fetchDocuments,
}: UseDocumentPollingProps): UseDocumentPollingReturn {
  // Polling state management
  const [isPolling, setIsPolling] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const pollingInterval = useRef<NodeJS.Timeout | null>(null);
  const isPageVisible = useRef(true);

  // Enhanced polling state for transition detection
  const [previousJobStates, setPreviousJobStates] = useState<
    Map<string, string>
  >(new Map());
  const [lastPollingUpdate, setLastPollingUpdate] = useState<Date>(new Date());
  // Track which jobs we've already notified about to prevent duplicates
  const notifiedJobsRef = useRef<Set<string>>(new Set());

  // Enhanced fetch processing status with transition detection
  const fetchProcessingStatus = useCallback(async () => {
    try {
      // Use enhanced API endpoint that includes recently completed jobs
      const response = await fetch(
        "/api/documents/processing-status?includeRecent=true",
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage =
          errorData.error || "Failed to fetch processing status";
        throw new Error(errorMessage);
      }

      const data = await response.json();
      setLastPollingUpdate(new Date());

      // Process both active and recently completed jobs for transition detection
      const allJobs = [
        ...(data.activeJobs || []),
        ...(data.recentlyCompleted || []),
      ];

      // Detect job transitions by comparing with previous states
      const transitions: {
        jobId: string;
        documentId: string;
        filename: string;
        oldStatus: string;
        newStatus: string;
      }[] = [];

      // Track current job states
      const currentJobStates = new Map<string, string>();

      allJobs.forEach((job: DocumentWithProcessingJob) => {
        const currentStatus = job.processingJob?.status || job.status;
        currentJobStates.set(job.id, currentStatus);

        // Check if this is a transition from previous state
        const previousStatus = previousJobStates.get(job.id);
        if (previousStatus && previousStatus !== currentStatus) {
          transitions.push({
            jobId: job.processingJob?.id || job.id,
            documentId: job.id,
            filename: job.originalFilename,
            oldStatus: previousStatus,
            newStatus: currentStatus,
          });
        }
      });

      // Update previous states for next comparison
      setPreviousJobStates(currentJobStates);

      // Show notifications for job transitions (prevent duplicates with tracking)
      transitions.forEach(({ jobId, filename, oldStatus, newStatus }) => {
        // Create a unique key for this specific transition
        const transitionKey = `${jobId}-${newStatus}`;

        // Only show notifications for genuine state transitions we haven't seen before
        if (
          oldStatus && // Ensure we have a previous state (not first-time detection)
          !notifiedJobsRef.current.has(transitionKey) && // Haven't notified about this transition yet
          (oldStatus === "processing" || oldStatus === "pending") &&
          newStatus === "processed"
        ) {
          notifiedJobsRef.current.add(transitionKey);
          toast.success(`Processing completed for "${filename}"`);
        } else if (
          oldStatus && // Ensure we have a previous state (not first-time detection)
          !notifiedJobsRef.current.has(transitionKey) && // Haven't notified about this transition yet
          (oldStatus === "processing" || oldStatus === "pending") &&
          newStatus === "error"
        ) {
          notifiedJobsRef.current.add(transitionKey);
          toast.error(`Processing failed for "${filename}"`);
        }
      });

      // Update documents with BOTH active and recently completed jobs for immediate UI feedback
      const allJobUpdates = [
        ...(data.activeJobs || []),
        ...(data.recentlyCompleted || []),
      ];
      if (allJobUpdates.length > 0) {
        setDocuments((prevDocs) => {
          const updatedDocs = [...prevDocs];

          // Create a map of ALL job updates (active + completed) by ID for quick lookup
          const processingMap = new Map(
            allJobUpdates.map((doc: DocumentWithProcessingJob) => [
              doc.id,
              doc,
            ]),
          );

          // Track which documents changed status
          const statusChanges: {
            doc: DocumentWithProcessingJob;
            oldStatus: string;
          }[] = [];

          // Update existing documents with new processing status
          for (let i = 0; i < updatedDocs.length; i++) {
            const processingDoc = processingMap.get(updatedDocs[i].id);
            if (processingDoc) {
              const oldStatus = updatedDocs[i].status;
              updatedDocs[i] = {
                ...updatedDocs[i],
                ...processingDoc,
                processingJob: processingDoc.processingJob,
              };

              // Track significant status changes for potential UI refresh
              if (oldStatus !== processingDoc.status) {
                statusChanges.push({
                  doc: processingDoc,
                  oldStatus,
                });
              }
            }
          }

          return updatedDocs;
        });

        // Clean up optimistic documents that now have real counterparts
        if (allJobUpdates.length > 0) {
          const serverFilenames = new Set(
            allJobs.map(
              (doc: DocumentWithProcessingJob) => doc.originalFilename,
            ),
          );
          setOptimisticDocuments((prev) =>
            prev.filter((doc) => !serverFilenames.has(doc.originalFilename)),
          );
        }
      }
      // Return active jobs for polling control logic
      return data.activeJobs || [];
    } catch (err) {
      console.error("❌ Error fetching processing status:", err);

      // Show toast notification only for significant errors (not during background polling)
      // Only show toast if this isn't during automatic polling to avoid spamming users
      if (!isPolling) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Failed to fetch processing status";
        toast.error(`Processing status update failed: ${errorMessage}`);
      }

      // Return empty array on error so polling continues
      return [];
    }
  }, [
    previousJobStates,
    setPreviousJobStates,
    isPolling,
    setDocuments,
    setOptimisticDocuments,
  ]);

  // Stop polling
  const stopPolling = useCallback(() => {
    if (pollingInterval.current) {
      clearInterval(pollingInterval.current);
      pollingInterval.current = null;
    }
    setIsPolling(false);
    // Clear notification tracking when polling stops to prevent memory leaks
    notifiedJobsRef.current.clear();
  }, []);

  // Start polling for processing updates
  const startPolling = useCallback(() => {
    if (isPolling) return;

    setIsPolling(true);

    // Set up polling interval (no initial fetch - let the interval handle it)
    pollingInterval.current = setInterval(async () => {
      // Only poll if page is visible
      if (isPageVisible.current) {
        const activeJobs = await fetchProcessingStatus();

        // Stop polling immediately when no active jobs and trigger full refresh
        if (activeJobs.length === 0) {
          stopPolling();
          setRefreshTrigger((prev) => prev + 1);
        }
      }
    }, 4000); // Poll every 4 seconds

    // Trigger first poll immediately if page is visible
    if (isPageVisible.current) {
      fetchProcessingStatus().then((activeJobs) => {
        // If no active jobs on startup, stop polling and refresh
        if (activeJobs.length === 0) {
          stopPolling();
          setRefreshTrigger((prev) => prev + 1);
        }
      });
    }
  }, [isPolling, fetchProcessingStatus, setRefreshTrigger, stopPolling]);

  // Handle page visibility change
  useEffect(() => {
    const handleVisibilityChange = () => {
      isPageVisible.current = !document.hidden;
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  // Check for processing documents and start/stop polling accordingly (optimized)
  useEffect(() => {
    const allDocs = [...optimisticDocuments, ...documents];
    const processingDocs = allDocs.filter(
      (doc) =>
        doc.status === "processing" ||
        (doc.processingJob &&
          ["pending", "processing", "retry_pending"].includes(
            doc.processingJob.status,
          )),
    );

    if (processingDocs.length > 0 && !isPolling) {
      // Start polling only if not already polling
      startPolling();
    } else if (processingDocs.length === 0 && isPolling) {
      // Stop polling only if no processing documents remain
      stopPolling();
      // Trigger refresh of main document list to show completed status
      setRefreshTrigger((prev) => prev + 1);
    }
    // Note: We don't restart polling if it's already active and there are still processing docs
    // This prevents unnecessary polling restarts when new documents are added
  }, [
    documents,
    optimisticDocuments,
    isPolling,
    startPolling,
    stopPolling,
    setRefreshTrigger,
  ]);

  // Effect to trigger refresh when polling stops
  useEffect(() => {
    if (refreshTrigger > 0) {
      fetchDocuments();
    }
  }, [refreshTrigger, fetchDocuments]);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [stopPolling]);

  return {
    isPolling,
    refreshTrigger,
    lastPollingUpdate,
    startPolling,
    stopPolling,
    setRefreshTrigger,
  };
}
