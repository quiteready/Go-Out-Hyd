"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { EventLeadForm } from "@/components/partner/EventLeadForm";
import { PartnerForm } from "@/components/partner/PartnerForm";
import { cn } from "@/lib/utils";

type FormMode = "cafe" | "event";

function modeFromHash(hash: string): FormMode {
  return hash === "#event-submit" ? "event" : "cafe";
}

export function PartnerFormsSwitcher() {
  const [mode, setMode] = useState<FormMode>("cafe");

  useEffect(() => {
    const syncFromHash = () => {
      setMode(modeFromHash(window.location.hash));
    };

    syncFromHash();
    window.addEventListener("hashchange", syncFromHash);

    return () => {
      window.removeEventListener("hashchange", syncFromHash);
    };
  }, []);

  function selectMode(nextMode: FormMode): void {
    const hash = nextMode === "event" ? "#event-submit" : "#cafe-partner";
    window.history.replaceState(null, "", hash);
    setMode(nextMode);
  }

  return (
    <div id="event-submit" className="mx-auto max-w-lg">
      <div className="mb-6 flex items-center justify-center gap-2 rounded-xl border border-border bg-card p-2">
        <Button
          type="button"
          onClick={() => selectMode("cafe")}
          className={cn(
            "flex-1",
            mode === "cafe"
              ? "bg-yellow text-black hover:opacity-85 hover:bg-yellow"
              : "bg-secondary text-foreground hover:bg-secondary/80",
          )}
        >
          Cafe
        </Button>
        <Button
          type="button"
          onClick={() => selectMode("event")}
          className={cn(
            "flex-1",
            mode === "event"
              ? "bg-yellow text-black hover:opacity-85 hover:bg-yellow"
              : "bg-secondary text-foreground hover:bg-secondary/80",
          )}
        >
          Event
        </Button>
      </div>

      {mode === "cafe" ? <PartnerForm /> : <EventLeadForm />}
    </div>
  );
}
