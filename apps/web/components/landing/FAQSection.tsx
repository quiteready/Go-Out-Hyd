import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";

const FAQSection = () => {
  const faqs = [
    {
      question: "What types of files can I upload to RAGI?",
      answer:
        "RAGI supports PDFs, Word documents, text files, images (JPG, PNG, GIF), videos (MP4, MOV, AVI), and audio files (MP3, WAV, FLAC). We automatically extract and index content from all these formats so you can chat with any type of document.",
    },
    {
      question: "How long does it take to process my documents?",
      answer:
        "Text documents are typically processed in seconds. Images take 1-2 minutes for OCR and analysis. Videos can take 5-15 minutes depending on length as we transcribe audio and analyze visual content. You'll get real-time updates on processing status.",
    },
    {
      question: "Is my document data secure and private?",
      answer:
        "Absolutely. Your documents are encrypted in transit and at rest. We use enterprise-grade security with SOC 2 compliance. Your data is never used to train AI models, and you maintain full control over your content. You can delete documents anytime.",
    },
    {
      question: "How accurate are the search results and answers?",
      answer:
        "RAGI uses advanced Gemini AI models with state-of-the-art retrieval technology. We cite exact sources for every answer, so you can verify information. Accuracy depends on document quality, but we typically achieve 90%+ precision in finding relevant information.",
    },
    {
      question: "Can I organize my documents into folders or categories?",
      answer:
        "Yes! You can create custom folders, tag documents, and use our smart categorization features. RAGI also automatically suggests categories based on content analysis to help keep your knowledge base organized.",
    },
    {
      question: "What happens if I hit my storage or document limits?",
      answer:
        "We'll notify you when you're approaching limits. You can easily upgrade your plan anytime to get more storage and document capacity. Your existing documents remain accessible while you decide.",
    },
    {
      question: "Can I share documents or collaborate with my team?",
      answer:
        "Team collaboration is available on Enterprise plans. You can share specific documents or entire knowledge bases with team members, set permissions, and collaborate on document analysis. Each team member can chat with shared documents.",
    },
    {
      question: "How does RAGI handle different languages?",
      answer:
        "RAGI supports 100+ languages for both document processing and chat queries. You can upload documents in any language and ask questions in your preferred language. The AI will understand and respond appropriately.",
    },
  ];

  return (
    <section
      id="faq"
      className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-primary-50 to-white dark:from-gray-900 dark:to-gray-800"
    >
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
            Frequently Asked Questions
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Everything you need to know about using RAGI for document
            intelligence.
          </p>
        </div>

        <Accordion type="single" collapsible className="w-full">
          {faqs.map((faq, index) => (
            <AccordionItem key={index} value={`item-${index}`} className="mb-4">
              <AccordionTrigger className="text-left text-lg font-semibold text-gray-900 dark:text-white hover:text-primary transition-colors">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-gray-600 dark:text-gray-400 text-base leading-relaxed pt-2">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <div className="mt-12 text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Still have questions?
          </p>
          <Button className="bg-primary hover:bg-primary-600 text-white">
            Contact Support
          </Button>
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
