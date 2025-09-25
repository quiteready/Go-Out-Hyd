import { Brain, Search, FileText, Video, Image, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

const FeaturesSection = () => {
  const features = [
    {
      icon: Brain,
      title: "Document Intelligence",
      description:
        "Upload PDFs, text files, images, and videos. RAGI understands and extracts knowledge from all your content using advanced AI.",
    },
    {
      icon: Search,
      title: "Instant Smart Search",
      description:
        "Ask questions in natural language and get precise answers sourced directly from your documents. No more manual searching.",
    },
    {
      icon: Zap,
      title: "Powered by Gemini AI",
      description:
        "Leverage Google's cutting-edge Gemini 2.5 Flash and Pro models for fast, accurate responses to your document queries.",
    },
    {
      icon: FileText,
      title: "Multimedia Support",
      description:
        "Not just text—analyze images, extract insights from videos, and chat with any file type. Your complete knowledge base.",
    },
    {
      icon: Video,
      title: "Video Transcription",
      description:
        "Upload meeting recordings, lectures, or tutorials. RAGI transcribes and makes video content searchable and queryable.",
    },
    {
      icon: Image,
      title: "Visual Analysis",
      description:
        "Upload charts, diagrams, screenshots, or photos. Ask questions about visual content and get detailed explanations.",
    },
  ];

  return (
    <section
      id="features"
      className="py-20 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-900"
    >
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
            Why Choose RAGI?
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Transform your documents into an intelligent, searchable knowledge
            base. Chat with your files like never before.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className={cn(
                "group p-8 rounded-2xl border border-gray-200 dark:border-gray-700 hover:border-primary/30 dark:hover:border-primary/30 hover:shadow-lg dark:hover:shadow-primary/10 transition-all duration-300 animate-fade-in",
                "hover:bg-gradient-to-br hover:from-primary/5 hover:to-primary/10",
              )}
            >
              <div className="w-16 h-16 bg-primary/10 dark:bg-primary/20 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                <feature.icon className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                {feature.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
