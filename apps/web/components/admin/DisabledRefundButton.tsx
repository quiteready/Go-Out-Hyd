"use client";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface DisabledRefundButtonProps {
  /** Override the button label. Defaults to "Refund". */
  label?: string;
  /** Override the tooltip body. Defaults to a Phase-2 message. */
  tooltip?: string;
  /** "sm" for table rows, "default" for cancel-event flows. */
  size?: "sm" | "default";
}

const DEFAULT_TOOLTIP =
  "Refunds coming soon (Phase 2). Until then, refund manually via the Razorpay dashboard.";

/**
 * Stub button rendered in admin tickets/cancel-event flows.
 *
 * Per task spec, refund implementation is intentionally deferred — this
 * button is *always* disabled and exists purely to signal the future feature.
 * The wrapping <span> is required because a disabled <button> doesn't fire
 * pointer events, which would otherwise prevent the tooltip from showing.
 */
export function DisabledRefundButton({
  label = "Refund",
  tooltip = DEFAULT_TOOLTIP,
  size = "sm",
}: DisabledRefundButtonProps) {
  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-block" tabIndex={0}>
            <Button
              type="button"
              variant="outline"
              size={size}
              disabled
              aria-disabled="true"
              className="pointer-events-none"
            >
              {label}
            </Button>
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs text-center">
          {tooltip}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
