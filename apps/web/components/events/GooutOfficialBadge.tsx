import { Star } from "lucide-react";

interface GooutOfficialBadgeProps {
  show: boolean;
  /** Size variant — "sm" for cards, "md" for detail hero. Defaults to "md". */
  size?: "sm" | "md";
}

export function GooutOfficialBadge({
  show,
  size = "md",
}: GooutOfficialBadgeProps) {
  if (!show) return null;

  if (size === "sm") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700 ring-1 ring-amber-400/40">
        <Star className="h-2.5 w-2.5 fill-amber-500 text-amber-500" aria-hidden />
        GoOut Official
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-400/25 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-amber-200 ring-1 ring-amber-400/40">
      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" aria-hidden />
      GoOut Official
    </span>
  );
}
