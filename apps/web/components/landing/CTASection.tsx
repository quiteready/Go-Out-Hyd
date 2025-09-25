import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";

const CTASection = () => {
  return (
    <section className="py-16 md:py-20 px-4 sm:px-6 lg:px-8 bg-primary relative overflow-hidden">
      {/* Subtle geometric background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="hidden sm:block absolute bottom-20 left-1/4 w-20 h-20 border border-white/30 rounded-lg rotate-12"></div>
        <div className="hidden sm:block absolute bottom-32 right-1/3 w-16 h-16 bg-white/10 rounded-full"></div>
        <div className="absolute top-1/3 left-1/5 w-12 h-12 border border-white/20 rounded-full"></div>
        <div className="hidden sm:block absolute bottom-1/4 right-1/4 w-14 h-14 bg-white/20 rounded-lg rotate-45"></div>
      </div>

      {/* Green accent lines */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white to-transparent"></div>
      <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white to-transparent"></div>

      <div className="max-w-4xl mx-auto text-center relative">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 border border-white/20 rounded-full text-white text-sm font-medium mb-8">
          <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
          Ready to Transform Your Workflow?
        </div>

        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-6">
          Turn Your Documents into Intelligent Knowledge
        </h2>
        <p className="text-base sm:text-lg md:text-xl text-white mb-10 md:mb-12 max-w-2xl mx-auto">
          Join thousands of professionals who&rsquo;ve transformed how they work
          with documents. Start chatting with your files in minutes.
        </p>

        <div className="flex justify-center">
          <Button
            size="lg"
            className="bg-white text-primary hover:bg-white/90 w-full sm:w-auto px-6 md:px-8 py-3 md:py-4 text-base md:text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 border border-white/20"
          >
            <Upload className="w-5 h-5 mr-2" strokeWidth={3} />
            Upload Your First Document
          </Button>
        </div>

        <div className="mt-10 md:mt-12 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 max-w-2xl mx-auto">
          {[
            "No credit card required",
            "Process 10 documents free",
            "Setup in under 2 minutes",
            "Cancel anytime",
          ].map((feature, index) => (
            <div
              key={index}
              className="flex items-center justify-center gap-2 text-white text-sm"
            >
              <div className="w-4 h-4 bg-white/20 rounded-full flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full"></div>
              </div>
              <span>{feature}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CTASection;
