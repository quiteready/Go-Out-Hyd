import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  RefObject,
} from "react";
import { toast } from "sonner";

export function useChatStreaming(
  currentConversationId: RefObject<string | null>,
): {
  isStopping: boolean;
  setIsStopping: (value: boolean) => void;
  abortControllerRef: RefObject<AbortController | null>;
  savePartialResponseAndStop: (stop: () => void) => Promise<void>;
  createNewAbortController: () => void;
} {
  const [isStopping, setIsStopping] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const savePartialResponseAndStop = useCallback(
    async (stop: () => void): Promise<void> => {
      if (!currentConversationId.current) return;

      setIsStopping(true);

      try {
        stop();
      } catch (error) {
        console.error("Error stopping stream:", error);
        toast.error("Error stopping stream");
      }
    },
    [currentConversationId],
  );

  const createNewAbortController = useCallback((): void => {
    abortControllerRef.current = new AbortController();
  }, []);

  return useMemo(
    () => ({
      isStopping,
      setIsStopping,
      abortControllerRef,
      savePartialResponseAndStop,
      createNewAbortController,
    }),
    [isStopping, savePartialResponseAndStop, createNewAbortController],
  );
}
