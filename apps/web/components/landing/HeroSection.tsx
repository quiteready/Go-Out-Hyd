"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import {
  FileText,
  Bot,
  Upload,
  Search,
  Video,
  FileImage,
  Sparkles,
  Zap,
  ArrowRight,
  Shield,
  Clock,
} from "lucide-react";
import Link from "next/link";

const HeroSection = () => {
  return (
    <section
      className="relative pt-20 sm:pt-24 pb-12 sm:pb-16 lg:pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-white via-gray-50 to-primary-50/30 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 overflow-hidden"
      aria-labelledby="hero-title"
    >
      {/* Background Grid decoration */}
      <div
        className="absolute inset-0 bg-grid-black/[0.02] dark:bg-grid-white/[0.02]"
        aria-hidden="true"
      />
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-6xl"
        aria-hidden="true"
      >
        <div className="absolute top-20 left-10 w-48 h-48 sm:w-72 sm:h-72 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute top-40 right-10 w-60 h-60 sm:w-96 sm:h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-1/3 w-52 h-52 sm:w-80 sm:h-80 bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto">
        <div className="text-center max-w-5xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-3 py-2 sm:px-4 sm:py-2 mb-4 sm:mb-6 animate-fade-in">
            <Sparkles
              className="w-3 h-3 sm:w-4 sm:h-4 text-primary"
              strokeWidth={2.5}
            />
            <span className="text-xs sm:text-sm font-medium text-primary">
              Powered by Gemini AI
            </span>
          </div>

          {/* Main headline */}
          <h1
            id="hero-title"
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4 md:mb-6 leading-tight animate-fade-in-delay-1"
          >
            Chat with Your Documents Using{" "}
            <span className="text-primary">RAGI</span>
          </h1>

          {/* Subheadline */}
          <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-600 dark:text-gray-300 mb-4 sm:mb-6 max-w-xs sm:max-w-2xl lg:max-w-3xl mx-auto leading-relaxed animate-fade-in-delay-2 px-2 sm:px-0">
            Upload text files, images, and videos, then chat with them using the
            powerful{" "}
            <span className="font-semibold text-primary">Gemini 2.5 Flash</span>{" "}
            model.
          </p>

          {/* Feature highlights */}
          <div
            className="flex flex-wrap justify-center gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8 text-xs sm:text-sm text-gray-600 dark:text-gray-400 animate-fade-in-delay-2"
            role="list"
            aria-label="Key features"
          >
            <div
              className="flex items-center gap-1.5 sm:gap-2 hover:text-primary dark:hover:text-primary transition-colors"
              role="listitem"
            >
              <Shield
                className="w-3 h-3 sm:w-4 sm:h-4 text-primary"
                aria-hidden="true"
              />
              <span>Secure processing</span>
            </div>
            <div
              className="flex items-center gap-1.5 sm:gap-2 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              role="listitem"
            >
              <Clock
                className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500"
                aria-hidden="true"
              />
              <span>Instant search</span>
            </div>
            <div
              className="flex items-center gap-1.5 sm:gap-2 hover:text-yellow-600 dark:hover:text-yellow-400 transition-colors"
              role="listitem"
            >
              <Zap
                className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-500"
                aria-hidden="true"
              />
              <span>10+ file types</span>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row justify-center items-center gap-3 sm:gap-4 mb-8 sm:mb-12 lg:mb-16 animate-fade-in-delay-3 px-4 sm:px-0">
            <Button
              size="default"
              asChild
              className="bg-primary hover:bg-primary/90 text-white px-4 sm:px-6 lg:px-8 py-2 sm:py-3 lg:py-4 text-sm sm:text-base lg:text-lg shadow-lg hover:shadow-xl transition-all duration-200 group w-full sm:w-auto focus:ring-2 focus:ring-primary/50 focus:ring-offset-2"
            >
              <Link
                href="/auth/sign-up"
                className="flex items-center justify-center gap-2"
                aria-describedby="cta-description"
              >
                Start Uploading Documents
                <ArrowRight
                  className="w-4 h-4 group-hover:translate-x-1 transition-transform"
                  aria-hidden="true"
                />
              </Link>
            </Button>
          </div>
          <div id="cta-description" className="sr-only">
            Sign up for a free trial to start uploading and chatting with your
            documents
          </div>
        </div>

        {/* Interactive Demo Section */}
        <div className="relative max-w-6xl mx-auto hidden sm:block">
          {/* Floating Documents */}
          <div className="relative grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Side - Floating Document Cards */}
            <div className="relative space-y-6 animate-fade-in">
              <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-8 text-center lg:text-left">
                Upload Any Document Type
              </h3>

              <div className="space-y-4">
                {/* PDF Document Card */}
                <div className="group relative animate-fade-in">
                  <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg border border-white/40 dark:border-gray-700/50 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-red-500/10 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                        <FileText className="w-6 h-6 text-red-500" />
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900 dark:text-white">
                          quarterly-report.pdf
                        </div>
                        <div className="text-sm text-gray-500">
                          2.4 MB • Ready to chat
                        </div>
                      </div>
                      <div className="w-3 h-3 bg-primary rounded-full animate-pulse" />
                    </div>
                  </div>
                </div>

                {/* Image Document Card */}
                <div className="group relative ml-8 animate-fade-in delay-100">
                  <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg border border-white/40 dark:border-gray-700/50 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                    <div className="flex items-center gap-4">
                      <div
                        className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform duration-300"
                        aria-hidden="true"
                      >
                        <FileImage className="w-6 h-6 text-blue-500" />
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900 dark:text-white">
                          product-specs.png
                        </div>
                        <div className="text-sm text-gray-500">
                          1.8 MB • Analyzed
                        </div>
                      </div>
                      <div className="w-3 h-3 bg-primary rounded-full animate-pulse" />
                    </div>
                  </div>
                </div>

                {/* Video Document Card */}
                <div className="group relative animate-fade-in delay-200">
                  <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg border border-white/40 dark:border-gray-700/50 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                        <Video className="w-6 h-6 text-purple-500" />
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900 dark:text-white">
                          meeting-recording.mp4
                        </div>
                        <div className="text-sm text-gray-500">
                          45.2 MB • Transcribing...
                        </div>
                      </div>
                      <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Upload Zone */}
              <div className="group relative mt-8 animate-fade-in delay-300">
                <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-lg border-2 border-dashed border-primary/40 rounded-2xl p-8 text-center hover:border-primary/60 transition-all duration-300 hover:scale-[1.02]">
                  <Upload className="w-8 h-8 text-primary mx-auto mb-3 group-hover:animate-bounce" />
                  <div className="text-primary font-medium">
                    Drop files here or click to upload
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    PDF, Images, Videos supported
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side - Chat Interface */}
            <div className="relative animate-fade-in delay-300">
              <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-8 text-center lg:text-left">
                Then Chat with Your Knowledge
              </h3>

              <div className="relative">
                {/* Chat Container - Fully Solid for Maximum Visibility */}
                <div className="bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-3xl p-6 shadow-2xl hover:shadow-3xl transition-all duration-500">
                  {/* Chat Messages */}
                  <div className="space-y-6 mb-6">
                    {/* User Message */}
                    <div className="flex justify-end animate-slide-in-right">
                      <div className="max-w-xs">
                        <div className="bg-primary text-white rounded-2xl rounded-br-md px-4 py-3 shadow-xl hover:shadow-2xl transition-all duration-300">
                          <p className="text-sm font-semibold">
                            What were the key revenue highlights from our
                            quarterly report?
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* AI Response */}
                    <div className="flex justify-start animate-slide-in-left">
                      <div className="max-w-sm">
                        <div className="bg-gray-100 dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 rounded-2xl rounded-bl-md px-4 py-3 shadow-xl">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                            <span className="text-xs text-primary font-bold flex items-center gap-1">
                              <Search className="w-3 h-3 animate-pulse" />
                              Found in quarterly-report.pdf
                            </span>
                          </div>
                          <p className="text-sm text-gray-900 dark:text-white font-medium leading-relaxed">
                            Based on your quarterly report, the key revenue
                            highlights include a{" "}
                            <strong className="text-primary font-bold">
                              23% increase in subscription revenue
                            </strong>{" "}
                            to $2.4M, expansion into 3 new markets, and a 94%
                            customer retention rate.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Follow-up Question */}
                    <div className="flex justify-end animate-slide-in-right-delayed">
                      <div className="max-w-xs">
                        <div className="bg-primary text-white rounded-2xl rounded-br-md px-4 py-3 shadow-xl">
                          <p className="text-sm font-semibold">
                            Can you analyze the product roadmap image for
                            upcoming features?
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Input Area */}
                  <div className="relative">
                    <div className="flex items-center gap-3 p-4 bg-gray-100 dark:bg-gray-700 rounded-2xl border-2 border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-300 shadow-lg">
                      <div className="flex items-center gap-2 text-primary text-sm">
                        <Bot className="w-4 h-4 animate-pulse" />
                        <span className="font-bold">Gemini 2.5 Flash</span>
                        <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                      </div>
                      <div className="flex-1 text-gray-700 dark:text-gray-200 text-sm font-semibold">
                        Ask anything about your documents...
                      </div>
                      <Button
                        size="sm"
                        className="bg-primary hover:bg-primary-600 text-white rounded-xl group shadow-lg"
                      >
                        <Zap className="w-4 h-4 group-hover:animate-bounce" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Floating Elements around chat */}
                <div className="absolute -top-6 -right-6 w-8 h-8 bg-primary/15 rounded-full blur-sm" />
                <div className="absolute -bottom-4 -left-4 w-6 h-6 bg-primary/20 rounded-full blur-sm" />
                <div className="absolute top-1/2 -right-8 w-3 h-3 bg-primary/18 rounded-full blur-sm" />
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Stats */}
        <div className="mt-10 sm:mt-20 text-center animate-fade-in delay-1000">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-2xl mx-auto">
            <div className="group hover:scale-105 transition-transform duration-300">
              <div className="text-2xl font-bold text-primary group-hover:animate-pulse">
                10+
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                File types supported
              </div>
            </div>
            <div className="group hover:scale-105 transition-transform duration-300">
              <div className="text-2xl font-bold text-primary group-hover:animate-pulse">
                &lt;5s
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Average processing time
              </div>
            </div>
            <div className="group hover:scale-105 transition-transform duration-300">
              <div className="text-2xl font-bold text-primary group-hover:animate-pulse">
                99.9%
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Search accuracy
              </div>
            </div>
            <div className="group hover:scale-105 transition-transform duration-300">
              <div className="text-2xl font-bold text-primary group-hover:animate-pulse">
                24/7
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Available instantly
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
