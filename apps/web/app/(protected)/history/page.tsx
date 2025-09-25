import { getConversationsGrouped } from "@/lib/history";
import { ConversationTable } from "@/components/history/ConversationTable";
import { AlertCircle, MessageSquare } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { StartChattingButton } from "@/components/history/StartChattingButton";

// Force dynamic rendering to prevent static generation issues with authentication
export const dynamic = "force-dynamic";

export default async function HistoryPage() {
  const result = await getConversationsGrouped();

  // Handle error case
  if (!result.success || !result.conversations) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Chat History</h1>
          <p className="text-muted-foreground">
            View and manage your previous conversations and chat sessions.
          </p>
        </div>
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load conversation history:{" "}
            {result.error || "Unknown error"}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const { conversations } = result;

  // Check if there are any conversations at all
  const hasAnyConversations =
    conversations.today.length > 0 ||
    conversations.yesterday.length > 0 ||
    conversations.thisWeek.length > 0 ||
    conversations.older.length > 0;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Chat History</h1>
        <p className="text-muted-foreground">
          View and manage your previous conversations and chat sessions.
        </p>
      </div>

      {/* Main Content */}
      {hasAnyConversations ? (
        <ConversationTable conversations={conversations} />
      ) : (
        <div className="flex flex-col items-center justify-center text-center py-12">
          <div
            className="mb-4 rounded-full bg-primary/10 p-3"
            aria-hidden="true"
          >
            <MessageSquare className="h-6 w-6 text-primary" />
          </div>
          <h2 className="text-xl font-semibold mb-2">No conversations yet</h2>
          <p className="text-muted-foreground mb-4 max-w-sm">
            Start chatting to see your conversation history here. All your
            conversations will be saved and organized by date.
          </p>
          <StartChattingButton />
        </div>
      )}
    </div>
  );
}
