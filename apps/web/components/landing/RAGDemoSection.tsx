"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Upload,
  FileText,
  CheckCircle,
  MessageSquare,
  ArrowRight,
  Play,
} from "lucide-react";
import { cn } from "@/lib/utils";

const RAGDemoSection = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [videoProcessed, setVideoProcessed] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setVideoProcessed(false);
      setTimeout(() => {
        setVideoProcessed(true);
      }, 3000);
    }, 8000); // Restart cycle every 8 seconds

    // Initial processing
    const initialTimer = setTimeout(() => {
      setVideoProcessed(true);
    }, 3000);

    return () => {
      clearInterval(interval);
      clearTimeout(initialTimer);
    };
  }, []);

  const steps = [
    {
      id: "upload",
      title: "Upload Your Documents",
      description:
        "Drag and drop files or click to upload PDFs, images, videos, and text documents",
      icon: Upload,
      color: "bg-blue-500",
    },
    {
      id: "process",
      title: "AI Processing",
      description:
        "RAGI analyzes and indexes your content using advanced Gemini AI models",
      icon: CheckCircle,
      color: "bg-yellow-500",
    },
    {
      id: "chat",
      title: "Start Chatting",
      description:
        "Ask questions in natural language and get instant answers from your documents",
      icon: MessageSquare,
      color: "bg-primary",
    },
  ];

  const stepsLength = steps.length;

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % stepsLength);
    }, 2500);
    return () => clearInterval(interval);
  }, [stepsLength]);

  const demoFiles = [
    {
      name: "Q3-Financial-Report.pdf",
      size: "2.4 MB",
      type: "pdf",
      status: "completed",
    },
    {
      name: "Product-Roadmap.png",
      size: "1.8 MB",
      type: "image",
      status: "completed",
    },
    {
      name: "Team-Meeting-Recording.mp4",
      size: "45.2 MB",
      type: "video",
      status: videoProcessed ? "completed" : "processing",
    },
  ];

  const chatExamples = [
    {
      question: "What was our revenue growth in Q3?",
      answer:
        "According to your Q3 Financial Report, revenue grew by 23% compared to Q2, reaching $2.4M in total revenue.",
      source: "Q3-Financial-Report.pdf",
    },
    {
      question: "When is the new feature launching?",
      answer:
        "Based on the Product Roadmap, the new AI-powered search feature is scheduled to launch in Q1 2025.",
      source: "Product-Roadmap.png",
    },
  ];

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 overflow-x-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
            See RAGI in Action
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Watch how easy it is to turn your documents into an intelligent,
            queryable knowledge base.
          </p>
        </div>

        {/* Steps Flow - Unified (auto-advancing, responsive layout) */}
        <div className="flex flex-col md:flex-row justify-center items-center gap-6 md:gap-8 mb-16">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto"
            >
              <div
                className={cn(
                  "relative p-4 md:p-6 rounded-2xl border-2 transition-all duration-300",
                  "flex flex-col items-center justify-center text-center gap-2 md:gap-3",
                  "min-h-[180px] md:min-h-[220px]",
                  activeStep === index
                    ? "border-primary bg-primary/5 dark:bg-primary/10 shadow-lg"
                    : "border-gray-200 dark:border-gray-700",
                )}
              >
                <div
                  className={cn(
                    "w-12 h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center transition-colors",
                    activeStep === index
                      ? "bg-primary text-white"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400",
                  )}
                >
                  <step.icon className="w-6 h-6 md:w-8 md:h-8" />
                </div>
                <h3 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white">
                  {step.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 max-w-64 md:max-w-48 mx-auto">
                  {step.description}
                </p>
              </div>

              {index < steps.length - 1 && (
                <ArrowRight className="w-6 h-6 text-gray-400 hidden md:block" />
              )}
            </div>
          ))}
        </div>

        {/* Demo Content */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="grid lg:grid-cols-2 gap-0">
            {/* Left Panel - Upload/Files */}
            <div className="hidden md:block p-6 lg:p-8 border-b lg:border-b-0 lg:border-r border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Document Library
                </h3>
              </div>

              <div className="space-y-3">
                {demoFiles.map((file, index) => (
                  <div
                    key={index}
                    className={cn(
                      "p-4 rounded-lg border transition-all duration-200",
                      file.status === "completed"
                        ? "border-primary/20 bg-primary/5"
                        : "border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700",
                    )}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-900 dark:text-white text-sm">
                        {file.name}
                      </span>
                      {file.status === "completed" ? (
                        <CheckCircle className="w-4 h-4 text-primary" />
                      ) : (
                        <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      )}
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{file.size}</span>
                      <span
                        className={cn(
                          file.status === "completed"
                            ? "text-primary"
                            : "text-gray-500",
                        )}
                      >
                        {file.status === "completed"
                          ? "Ready"
                          : "Processing..."}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <Button
                className="w-full mt-6 bg-primary hover:bg-primary-600 text-white"
                size="lg"
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload Documents
              </Button>
            </div>

            {/* Right Panel - Chat Demo (visible on all viewports) */}
            <div className="p-6 lg:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  AI Chat Interface
                </h3>
              </div>

              <div className="space-y-4 mb-6">
                {chatExamples.map((example, index) => (
                  <div key={index} className="space-y-3">
                    {/* User Question */}
                    <div className="flex justify-end">
                      <div className="bg-primary text-white rounded-lg px-4 py-2 max-w-xs">
                        <p className="text-sm">{example.question}</p>
                      </div>
                    </div>

                    {/* AI Response */}
                    <div className="flex justify-start">
                      <div className="bg-gray-100 dark:bg-gray-700 rounded-lg px-4 py-3 max-w-sm">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-2 h-2 bg-primary rounded-full" />
                          <span className="text-xs text-primary font-medium">
                            Found in {example.source}
                          </span>
                        </div>
                        <p className="text-sm text-gray-900 dark:text-white">
                          {example.answer}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <input
                  type="text"
                  placeholder="Ask anything about your documents..."
                  className="flex-1 bg-transparent text-gray-900 dark:text-white placeholder-gray-500 border-none outline-none"
                  disabled
                />
                <Button
                  size="sm"
                  className="bg-primary hover:bg-primary-600 text-white"
                >
                  <Play className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default RAGDemoSection;
