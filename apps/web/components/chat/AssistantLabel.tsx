import { Bot } from "lucide-react";

export function AssistantLabel() {
  return (
    <div className="flex items-center gap-2 mb-4">
      <Bot className="h-4 w-4 text-muted-foreground" />
      <span className="text-xs text-muted-foreground">Assistant</span>
    </div>
  );
}
