"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateUserFullName } from "@/app/actions/profile";
import { Edit2, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface EditableFullNameProps {
  initialFullName: string | null;
  className?: string;
}

export function EditableFullName({
  initialFullName,
  className,
}: EditableFullNameProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState(initialFullName || "");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSave = () => {
    setError(null);
    startTransition(async () => {
      const result = await updateUserFullName(fullName);
      if (result.error) {
        setError(result.error);
      } else {
        setIsEditing(false);
        toast.success("Full name updated successfully");
      }
    });
  };

  const handleCancel = () => {
    setFullName(initialFullName || "");
    setError(null);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      handleCancel();
    }
  };

  if (isEditing) {
    return (
      <div className={cn("space-y-2", className)}>
        <div className="flex items-center gap-2">
          <Input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter your full name"
            maxLength={100}
            disabled={isPending}
            className="flex-1"
            autoFocus
          />
          <Button
            size="sm"
            onClick={handleSave}
            disabled={isPending}
            className="h-8 w-8 p-0"
          >
            <Check className="h-4 w-4" />
            <span className="sr-only">Save</span>
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleCancel}
            disabled={isPending}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Cancel</span>
          </Button>
        </div>
        {error && (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        )}
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-2 group", className)}>
      <p className="text-sm flex-1">
        {initialFullName || (
          <span className="text-muted-foreground italic">Not provided</span>
        )}
      </p>
      <Button
        size="sm"
        variant="ghost"
        onClick={() => setIsEditing(true)}
        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <Edit2 className="h-3 w-3" />
        <span className="sr-only">Edit full name</span>
      </Button>
    </div>
  );
}
