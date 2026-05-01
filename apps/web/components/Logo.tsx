import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
}

export function Logo({ className }: LogoProps) {
  return (
    <span
      className={cn("font-sans font-medium tracking-tight", className)}
    >
      GoOut Hyd
    </span>
  );
}
