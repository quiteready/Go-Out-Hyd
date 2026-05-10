import { Coffee } from "lucide-react";

interface CafeEmptyStateProps {
  area?: string;
}

export function CafeEmptyState({ area }: CafeEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-secondary">
        <Coffee className="h-8 w-8 text-muted-foreground" />
      </div>
      <h2 className="text-2xl font-medium text-foreground">
        {area ? `No cafes in ${area} yet` : "No cafes yet"}
      </h2>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        {area
          ? `We haven't listed any cafes in ${area} yet. Try another area or check back soon.`
          : "We're working on adding cafes. Check back soon."}
      </p>
    </div>
  );
}
