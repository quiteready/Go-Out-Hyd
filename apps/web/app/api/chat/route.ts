import {
  streamText,
  convertToModelMessages,
  consumeStream,
  type UIMessage,
  type TextUIPart,
  type FileUIPart,
} from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { getCurrentUserId } from "@/lib/auth";
import { checkMessageLimits, recordUsageEvent } from "@/lib/usage-tracking";
import { searchForRAGContext } from "@/lib/rag/search-service";
import { env } from "@/lib/env";
import { MODEL_CONFIG } from "@/lib/app-utils";
import { EmbeddingServiceError } from "@/lib/embeddings/types";
import { USAGE_EVENT_TYPES } from "@/lib/drizzle/schema/usage-events";
import { handleAssistantMessage } from "@/app/actions/chat";

// Use AI SDK UI message parts for request/response UI messages
type UiPart = TextUIPart | FileUIPart;

const isTextPart = (part: UiPart): part is TextUIPart => part.type === "text";
const isFilePart = (part: UiPart): part is FileUIPart => part.type === "file";

// Create Google AI provider instance with API key
const google = createGoogleGenerativeAI({
  apiKey: env.GEMINI_API_KEY,
});

// Set max duration for vercel functions
export const maxDuration = 60;

export async function POST(req: Request): Promise<Response> {
  try {
    const userId = await getCurrentUserId();

    if (!userId) {
      return new Response("Unauthorized", { status: 401 });
    }

    // Extract request data - both messages and data are required by our implementation
    const { messages, data } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      console.error("❌ Invalid messages format in request body");
      return new Response("Messages must be an array", { status: 400 });
    }

    if (!data) {
      console.error("❌ No data found in request body");
      return new Response("Request data is required", { status: 400 });
    }

    const { conversationId, trigger } = data;

    if (!conversationId) {
      return new Response("conversationId is required", { status: 400 });
    }

    // Check usage limits before processing the chat request
    const usageCheck = await checkMessageLimits(userId);

    if (!usageCheck.canSendMessage) {
      console.error("❌ [chat] Message limit exceeded:", usageCheck.reason);
      return new Response(
        usageCheck.reason ||
          "Usage limit exceeded. Please upgrade to continue.",
        { status: 403 },
      );
    }

    let userText = "";
    const images: Array<{ name: string; url: string }> = [];

    // Step 1: Find the last user message
    const lastMessageIndex = messages.length - 1;
    const lastMessage =
      lastMessageIndex >= 0 && messages[lastMessageIndex]?.role === "user"
        ? messages[lastMessageIndex]
        : null;

    // Early return if no user message found
    if (!lastMessage) {
      console.error("❌ No user message found in request");
      return new Response("No user message found in request", { status: 400 });
    }

    // Step 2: Extract content from message
    if (lastMessage.parts && Array.isArray(lastMessage.parts)) {
      // Process parts array (v5 UI format)
      for (const part of lastMessage.parts as UiPart[]) {
        if (isTextPart(part) && part.text) {
          userText += part.text;
        } else if (
          isFilePart(part) &&
          part.mediaType?.startsWith("image/") &&
          part.url
        ) {
          images.push({
            name: part.filename || "image",
            url: part.url,
          });
        }
      }
    }

    // Early return for empty messages - no text and no images
    if (userText.trim() === "" && images.length === 0) {
      return new Response(
        "Invalid message: Please provide either text or images",
        { status: 400 },
      );
    }

    // Step 3: Get RAG context using simplified dual approach
    const ragContext: string[] = [];
    try {
      const ragResult = await searchForRAGContext(userText, images, userId);

      if (ragResult.context) {
        ragContext.push(ragResult.context);
      }
    } catch (error) {
      console.error("⚠️ RAG search failed:", error);

      // Check if this is a multimodal embedding error
      const isMultimodalError = error instanceof EmbeddingServiceError;
      const isTimeoutError =
        error instanceof Error &&
        (error.message.includes("DEADLINE_EXCEEDED") ||
          error.message.includes("timeout") ||
          error.message.includes("Timeout error"));

      if (isMultimodalError && isTimeoutError) {
        console.error("🚨 Multimodal embedding service timeout detected");
        return new Response("Multimodal service timed out. Please try again.", {
          status: 503,
        });
      } else {
        return new Response(
          "Unable to search your documents. Please try again.",
          { status: 500 },
        );
      }
    }

    // Build system prompt with RAG context if available
    const systemPrompt = `You are an intelligent RAG-powered AI assistant designed to help users extract insights from their personal knowledge base. Your core capabilities include:

🧠 **Knowledge Integration**: You can access and synthesize information from the user's uploaded documents, images, and videos to provide contextually relevant answers.

📊 **Multimodal Analysis**: You can analyze and describe images, interpret visual data, read text within images, and understand video content when shared by users.

🔍 **Contextual Search**: When users ask questions, you leverage their personal document collection to provide accurate, source-backed responses rather than relying solely on general knowledge.

**Your Approach:**
- Always prioritize information from the user's uploaded documents when available
- Clearly distinguish between information from their knowledge base vs. your general knowledge
- For images: Provide detailed, accurate descriptions and answer specific questions about visual content
- For documents: Extract relevant information and cite specific details when answering questions
- Be conversational yet precise, helping users discover insights they might not have noticed

**Response Format:**
When you reference or use information from the user's documents in your response, always include a "Sources" section at the bottom with bullet points listing the relevant documents, like this:

**Sources:**
- [Document name/ID] - [Brief description if helpful]
- [Document name/ID] - [Brief description if helpful]

Only include the Sources section when you actually use information from the provided context.

**Response Style:**
- Professional but approachable and friendly tone
- Cite specific sources when referencing uploaded content
- Ask clarifying questions when the user's intent is unclear
- Acknowledge limitations when uploaded content doesn't contain requested information`;

    // Process messages and add RAG context if available
    let processedMessages;
    try {
      processedMessages = Array.isArray(messages) ? [...messages] : [];
      if (ragContext.length > 0) {
        processedMessages.push({
          role: "user",
          parts: [
            {
              type: "text",
              text:
                "Context from the user's documents:\n" +
                ragContext.join("\n\n"),
            },
          ],
        });
      }
    } catch (error) {
      console.error("❌ Error processing messages:", error);
      return new Response("Message processing failed", { status: 500 });
    }

    // Ensure we have valid messages to process
    if (!Array.isArray(processedMessages) || processedMessages.length === 0) {
      return new Response("No valid messages to process", { status: 400 });
    }

    // Track if there was an error during streaming
    let hasStreamError = false;

    // Use AI SDK with Google provider for streaming
    const result = streamText({
      model: google(MODEL_CONFIG.name),
      system: systemPrompt,
      messages: convertToModelMessages(processedMessages),
      temperature: 0.7,
      // Forward the abort signal for proper cancellation
      abortSignal: req.signal,
      onError: async ({ error }) => {
        console.log("❌ API onError called with error:", error);
        hasStreamError = true;

        try {
          await handleAssistantMessage({
            trigger,
            conversationId,
            content: "Something went wrong and please try again",
            status: "error",
          });
        } catch (saveError) {
          console.error("⚠️ Failed to save error message:", saveError);
        }
      },
      onFinish: async (finishResult) => {
        // console.log("🚀 API onFinish called with result:", finishResult);

        try {
          await handleAssistantMessage({
            trigger,
            conversationId,
            content: finishResult.text,
            status: "success",
          });
        } catch (saveError) {
          console.error("⚠️ Failed to save assistant message:", saveError);
        }
      },
    });

    // Return UI message stream with proper abort handling
    return result.toUIMessageStreamResponse({
      onFinish: async ({ responseMessage, isAborted }) => {
        try {
          if (isAborted) {
            console.log("🛑 UI stream was aborted - saving partial content");

            // Extract partial content from the responseMessage
            let partialContent = "";

            const resp = responseMessage as UIMessage;
            if (Array.isArray(resp?.parts)) {
              const parts = resp.parts as UiPart[];
              // Extract text parts
              const textParts = parts.filter(isTextPart);
              partialContent = textParts.map((p) => p.text).join("");
            }

            // Save partials if we have any text
            if (partialContent.trim()) {
              await handleAssistantMessage({
                trigger,
                conversationId,
                content: partialContent,
                status: "success",
              });
            } else {
              // No partial content to save, so we'll save an error message
              await handleAssistantMessage({
                trigger,
                conversationId,
                content: "Something went wrong and please try again",
                status: "error",
              });
            }
          }
        } catch (error) {
          console.error("⚠️ Failed to handle UI stream finish:", error);
        }

        // Only record usage event if there was no stream error (successful or aborted operations only)
        if (!hasStreamError) {
          try {
            const usageResult = await recordUsageEvent(
              USAGE_EVENT_TYPES.MESSAGE,
            );
            if (!usageResult.success) {
              console.error(
                "⚠️ Failed to record message usage event:",
                usageResult.error,
              );
            } else {
              console.log(
                `✅ Recorded message usage event ${isAborted ? "(aborted)" : "(completed)"}`,
              );
            }
          } catch (usageError) {
            console.error("⚠️ Error recording usage event:", usageError);
          }
        }
      },
      consumeSseStream: consumeStream,
    });
  } catch (error) {
    console.error("Chat API Error:", error);

    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";

    // Handle Google AI specific errors
    if (
      errorMessage.includes("404") ||
      errorMessage.includes("model_not_found")
    ) {
      return new Response("Gemini model not found", { status: 404 });
    }

    if (errorMessage.includes("401") || errorMessage.includes("unauthorized")) {
      return new Response("Invalid Google AI API credentials", { status: 401 });
    }

    if (errorMessage.includes("429") || errorMessage.includes("rate_limit")) {
      return new Response(
        "Google AI API rate limit exceeded. Please try again later.",
        { status: 429 },
      );
    }

    return new Response(errorMessage, { status: 500 });
  }
}
