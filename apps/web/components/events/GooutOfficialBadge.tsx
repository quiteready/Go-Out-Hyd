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
      <span className="inline-flex items-center gap-1 rounded-full bg-[#fbf497] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#0a0a0a]">
        <Star className="h-2.5 w-2.5 fill-[#0a0a0a] text-[#0a0a0a]" aria-hidden />
        GoOut Official
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#fbf497] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#0a0a0a]">
      <Star className="h-3.5 w-3.5 fill-[#0a0a0a] text-[#0a0a0a]" aria-hidden />
      GoOut Official
    </span>
  );
}
