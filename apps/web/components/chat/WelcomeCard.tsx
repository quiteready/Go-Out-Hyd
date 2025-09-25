"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Brain,
  Upload,
  Search,
  Video,
  FileImage,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { useChatState } from "@/contexts/ChatStateContext";
import { MODEL_CONFIG } from "@/lib/app-utils";
import { cn } from "@/lib/utils";

const examplePrompts = [
  "What are the key findings in my quarterly report?",
  "Summarize the main points from the meeting video",
  "What does this chart show about our sales trends?",
  "Find information about the product roadmap",
];

const features = [
  {
    icon: Brain,
    title: "Document Intelligence",
    description:
      "Upload PDFs, images, videos, and text files. Chat with your content using advanced AI.",
  },
  {
    icon: Search,
    title: "Instant Smart Search",
    description:
      "Ask questions in natural language and get precise answers from your documents.",
  },
  {
    icon: Sparkles,
    title: "Multimedia Support",
    description:
      "Analyze images, transcribe videos, and extract insights from any file type.",
  },
];

export function WelcomeCard() {
  const { setInput, isSendDisabled } = useChatState();

  return (
    <div className="w-full max-w-3xl mx-auto p-2 sm:p-4">
      <Card className="relative overflow-hidden border-2 border-dashed border-muted-foreground/20 bg-gradient-to-br from-background via-background to-muted/30">
        <CardHeader className="text-center pb-4 px-4 sm:px-6 pt-4">
          <div className="flex items-center justify-center mb-1">
            <div className="p-1.5 rounded-full bg-primary/10">
              <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            </div>
          </div>

          <CardTitle className="text-lg sm:text-xl md:text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Welcome to RAGI
          </CardTitle>

          <CardDescription className="text-sm sm:text-base mt-1 max-w-xl mx-auto leading-relaxed">
            Turn your documents into intelligent, queryable knowledge. Upload
            files and chat with your content using Google&apos;s Gemini AI.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4 px-4 sm:px-6 pb-4">
          {/* Upload Section with AI Badge */}
          <div className="text-center bg-muted/20 rounded-lg p-3 border border-muted-foreground/10">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Upload className="h-4 w-4" />
              <h3 className="font-semibold text-sm">Upload Your Documents</h3>
            </div>
            <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground mb-2">
              <div className="flex items-center gap-1">
                <FileText className="h-3 w-3" />
                <span>PDFs</span>
              </div>
              <div className="flex items-center gap-1">
                <FileImage className="h-3 w-3" />
                <span>Images</span>
              </div>
              <div className="flex items-center gap-1">
                <Video className="h-3 w-3" />
                <span>Videos</span>
              </div>
            </div>
            <Badge variant="outline">
              Powered by {MODEL_CONFIG.displayName}
            </Badge>
          </div>

          {/* Compact Features */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="flex flex-col border border-muted-foreground/10 items-center text-center p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div className="p-1.5 rounded-full bg-primary/10 mb-2">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <h3 className="font-semibold text-sm mb-1">
                    {feature.title}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Getting Started */}
          <div className="bg-muted/20 rounded-lg p-3 border border-muted-foreground/10">
            <div className="flex items-center gap-2 mb-2">
              <ArrowRight className="h-3 w-3 text-primary" />
              <h3 className="font-semibold text-sm">
                Try asking about your documents:
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {examplePrompts.map((prompt, index) => (
                <div
                  key={index}
                  onClick={() => {
                    if (isSendDisabled) return;
                    setInput(prompt);
                  }}
                  className={cn(
                    "flex items-center gap-2 p-2 rounded-md bg-background/50 hover:bg-background/80 transition-colors group",
                    !isSendDisabled && "cursor-pointer",
                  )}
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-primary/60 shrink-0"></div>
                  <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">
                    &ldquo;{prompt}&rdquo;
                  </span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
