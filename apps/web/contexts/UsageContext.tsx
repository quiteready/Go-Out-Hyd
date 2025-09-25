"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { getCurrentUserUsage } from "@/app/actions/usage";
import {
  type UsageStats,
  validateMessageUsage,
  isUnlimited,
} from "@/lib/usage-tracking-client";
import { useUser } from "@/contexts/UserContext";
import { toast } from "sonner";

interface UsageContextType {
  usageStats: UsageStats | null;
  loading: boolean;
  error: string | null;
  refreshUsage: () => Promise<void>;
  canSendMessage: () => {
    canSend: boolean;
    reason?: string;
    upgradeRequired?: boolean;
  };
  canUpload: boolean;
  isDocumentsNearLimit: boolean;
  isDocumentsAtLimit: boolean;
  isStorageNearLimit: boolean;
  isStorageAtLimit: boolean;
}

export type { UsageStats };

const UsageContext = createContext<UsageContextType | undefined>(undefined);

interface UsageProviderProps {
  children: React.ReactNode;
}

export function UsageProvider({ children }: UsageProviderProps) {
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { id: userId } = useUser();

  // Use refs to track state without creating dependencies
  const isRefreshingRef = useRef(false);
  const loadingRef = useRef(true);

  // Update refs when state changes
  useEffect(() => {
    isRefreshingRef.current = isRefreshing;
  }, [isRefreshing]);

  useEffect(() => {
    loadingRef.current = loading;
  }, [loading]);

  const refreshUsage = useCallback(async (): Promise<void> => {
    if (!userId) {
      setLoading(false);
      return;
    }

    // Prevent overlapping requests using ref
    if (isRefreshingRef.current) {
      console.log("Usage refresh already in progress, skipping...");
      return;
    }

    try {
      setIsRefreshing(true);
      setError(null);
      const result = await getCurrentUserUsage();

      if (result.success && result.data) {
        setUsageStats(result.data);
      } else if (!result.success) {
        setError(result.error || "Failed to fetch usage statistics");
        // Only show toast for initial load failures using ref
        if (loadingRef.current) {
          toast.error("Failed to load usage stats");
        }
      }
    } catch (error) {
      console.error("Error fetching usage stats:", error);
      setError("Failed to fetch usage statistics");
      // Only show toast for initial load failures using ref
      if (loadingRef.current) {
        toast.error("Failed to load usage stats");
      }
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [userId]);

  useEffect(() => {
    refreshUsage();
  }, [refreshUsage]);

  const canSendMessageCheck = useCallback(() => {
    return validateMessageUsage(usageStats);
  }, [usageStats]);

  // Memoized helper function to calculate usage percentage
  const calculateUsagePercentage = useCallback(
    (used: number, limit: number): number => {
      if (isUnlimited(limit)) return 0;
      return limit > 0 ? (used / limit) * 100 : 0;
    },
    [],
  );

  // Memoized calculations for usage stats and limits
  const usageCalculations = useMemo(() => {
    if (!usageStats) {
      return {
        canUpload: false,
        documentsUsagePercentage: 0,
        storageUsagePercentage: 0,
        isDocumentsNearLimit: false,
        isDocumentsAtLimit: false,
        isStorageNearLimit: false,
        isStorageAtLimit: false,
      };
    }

    const canUpload =
      isUnlimited(usageStats.usage.documents.limit) ||
      usageStats.usage.documents.used < usageStats.usage.documents.limit;

    const documentsUsagePercentage = calculateUsagePercentage(
      usageStats.usage.documents.used,
      usageStats.usage.documents.limit,
    );
    const storageUsagePercentage = calculateUsagePercentage(
      usageStats.usage.storage.used,
      usageStats.usage.storage.limit,
    );

    return {
      canUpload,
      documentsUsagePercentage,
      storageUsagePercentage,
      isDocumentsNearLimit:
        documentsUsagePercentage >= 80 && documentsUsagePercentage < 100,
      isDocumentsAtLimit: documentsUsagePercentage >= 100,
      isStorageNearLimit:
        storageUsagePercentage >= 80 && storageUsagePercentage < 100,
      isStorageAtLimit: storageUsagePercentage >= 100,
    };
  }, [usageStats, calculateUsagePercentage]);

  // Destructure for clean usage
  const {
    canUpload,
    isDocumentsNearLimit,
    isDocumentsAtLimit,
    isStorageNearLimit,
    isStorageAtLimit,
  } = usageCalculations;

  const value: UsageContextType = {
    usageStats,
    loading,
    error,
    refreshUsage,
    canSendMessage: canSendMessageCheck,
    canUpload,
    isDocumentsNearLimit,
    isDocumentsAtLimit,
    isStorageNearLimit,
    isStorageAtLimit,
  };

  return (
    <UsageContext.Provider value={value}>{children}</UsageContext.Provider>
  );
}

export function useUsage(): UsageContextType {
  const context = useContext(UsageContext);
  if (context === undefined) {
    throw new Error("useUsage must be used within a UsageProvider");
  }
  return context;
}
