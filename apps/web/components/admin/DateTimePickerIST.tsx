"use client";

import { useId } from "react";
import { Input } from "@/components/ui/input";

interface DateTimePickerISTProps {
  /** Current value as a UTC ISO string (or null when unset). */
  value: string | null;
  /** Called with the new UTC ISO string (or null when cleared). */
  onChange: (utcIso: string | null) => void;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  hint?: string;
  id?: string;
}

const IST_OFFSET_MINUTES = 5 * 60 + 30; // +05:30

/**
 * Convert a stored UTC ISO string into the wall-clock string in IST,
 * formatted for `<input type="datetime-local">` (`YYYY-MM-DDTHH:mm`).
 *
 * We construct a "virtual" Date by adding the IST offset to the UTC value
 * and then read its UTC components — those components are the IST wall
 * clock by construction.
 */
function utcIsoToIstInputValue(utcIso: string | null): string {
  if (!utcIso) return "";
  const utcDate = new Date(utcIso);
  if (Number.isNaN(utcDate.getTime())) return "";
  const istVirtual = new Date(
    utcDate.getTime() + IST_OFFSET_MINUTES * 60 * 1000,
  );
  const yyyy = istVirtual.getUTCFullYear().toString().padStart(4, "0");
  const mm = (istVirtual.getUTCMonth() + 1).toString().padStart(2, "0");
  const dd = istVirtual.getUTCDate().toString().padStart(2, "0");
  const hh = istVirtual.getUTCHours().toString().padStart(2, "0");
  const mi = istVirtual.getUTCMinutes().toString().padStart(2, "0");
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}

/**
 * Reverse of the above: take the IST wall-clock string and return the
 * UTC ISO string that represents that exact moment.
 *
 * The browser's `datetime-local` value has no timezone — we treat it as
 * IST and subtract the IST offset to get the equivalent UTC instant.
 */
function istInputValueToUtcIso(istInputValue: string): string | null {
  if (!istInputValue) return null;
  // istInputValue is "YYYY-MM-DDTHH:mm" (or "...:ss" — both fine for Date).
  // Parse the components manually to avoid local-tz interpretation.
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(
    istInputValue,
  );
  if (!match) return null;
  const [, y, mo, d, h, mi, s] = match;
  const istEpoch = Date.UTC(
    Number(y),
    Number(mo) - 1,
    Number(d),
    Number(h),
    Number(mi),
    s ? Number(s) : 0,
  );
  const utcEpoch = istEpoch - IST_OFFSET_MINUTES * 60 * 1000;
  return new Date(utcEpoch).toISOString();
}

const IST_PREVIEW_FORMATTER = new Intl.DateTimeFormat("en-IN", {
  timeZone: "Asia/Kolkata",
  weekday: "short",
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});

/** Human-readable IST wall clock with AM/PM (independent of the browser's 24h picker). */
function formatIstPreview(utcIso: string | null): string | null {
  if (!utcIso) return null;
  const d = new Date(utcIso);
  if (Number.isNaN(d.getTime())) return null;
  return IST_PREVIEW_FORMATTER.format(d);
}

export function DateTimePickerIST({
  value,
  onChange,
  label,
  required = false,
  disabled = false,
  hint,
  id,
}: DateTimePickerISTProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const inputValue = utcIsoToIstInputValue(value);
  const istPreview = formatIstPreview(value);

  return (
    <div className="space-y-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-neutral-900"
        >
          {label}
          {required && <span className="ml-0.5 text-red-600">*</span>}
        </label>
      )}
      <Input
        id={inputId}
        type="datetime-local"
        value={inputValue}
        required={required}
        disabled={disabled}
        onChange={(e) => onChange(istInputValueToUtcIso(e.target.value))}
      />
      {istPreview && (
        <p className="text-xs font-medium text-neutral-800">
          IST (12-hour): <span className="tabular-nums">{istPreview}</span>
        </p>
      )}
      <p className="text-xs text-neutral-500">
        {hint ??
          "The picker uses 24-hour time; the line above shows the same moment in IST with AM/PM. All times are Asia/Kolkata and stored as UTC."}
      </p>
    </div>
  );
}
