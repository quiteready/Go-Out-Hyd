"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle, Crown, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function UpgradeSuccessToast() {
  const searchParams = useSearchParams();
  const [isVisible, setIsVisible] = useState(false);

  // Check for success parameters
  const sessionId = searchParams.get("session_id");
  const success = searchParams.get("success");

  useEffect(() => {
    if (success === "true" && sessionId) {
      setIsVisible(true);

      // Auto-hide after 10 seconds
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 10000);

      return () => clearTimeout(timer);
    }
  }, [success, sessionId]);

  if (!isVisible) return null;

  return (
    <div className="fixed top-4 right-4 z-50 w-80 animate-in slide-in-from-top-2">
      <Card className="border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-800">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>

            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <h3 className="font-medium text-green-900 dark:text-green-100">
                  Upgrade Successful!
                </h3>
                <Badge className="bg-green-600 hover:bg-green-700">
                  <Crown className="mr-1 h-3 w-3" />
                  Premium
                </Badge>
              </div>

              <p className="text-sm text-green-700 dark:text-green-200">
                Welcome to your upgraded plan! You now have access to premium AI
                models and increased message limits.
              </p>

              <div className="flex items-center gap-2 text-xs text-green-600 dark:text-green-300">
                <Crown className="h-3 w-3" />
                <span>Premium models unlocked</span>
                <span>•</span>
                <span>Higher message limits</span>
                <span>•</span>
                <span>Priority support</span>
              </div>
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-green-600 hover:text-green-700 hover:bg-green-100 dark:hover:bg-green-900/50"
              onClick={() => setIsVisible(false)}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
