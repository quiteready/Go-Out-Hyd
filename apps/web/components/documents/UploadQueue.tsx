"use client";

import { UploadQueue as UploadQueueType } from "@/lib/upload-queue";
import { UploadQueueItem } from "./UploadQueueItem";
import { Card, CardContent } from "@/components/ui/card";

interface UploadQueueProps {
  queue: UploadQueueType;
  className?: string;
}

export function UploadQueue({ queue, className }: UploadQueueProps) {
  if (queue.items.length === 0) {
    return null;
  }

  return (
    <Card className={className}>
      <CardContent className="p-0">
        <div className="space-y-0">
          {queue.items.map((item, index) => (
            <UploadQueueItem
              key={item.id}
              item={item}
              isLast={index === queue.items.length - 1}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
