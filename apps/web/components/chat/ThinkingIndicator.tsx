import { Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { AssistantLabel } from "./AssistantLabel";

export function ThinkingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="max-w-[80%]">
        <AssistantLabel />

        {/* Thinking message */}
        <Card className="p-4 bg-muted inline-block">
          <div className="flex items-center gap-2 text-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Thinking...</span>
          </div>
        </Card>
      </div>
    </div>
  );
}
