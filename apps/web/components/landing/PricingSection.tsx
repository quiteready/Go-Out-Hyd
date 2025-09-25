import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

const PricingSection = () => {
  const plans = [
    {
      name: "Free",
      price: "$0",
      period: "/month",
      description: "Perfect for trying out RAGI",
      features: [
        "Up to 10 documents",
        "100 MB storage",
        "10 requests per day",
        "All file types except video",
      ],
      cta: "Start Free",
      popular: false,
    },
    {
      name: "Basic",
      price: "$29",
      period: "/month",
      description: "For professionals and small teams",
      features: [
        "Up to 1,000 documents",
        "5 GB storage",
        "1,000 requests per month",
        "All file types including video",
        "Email support",
      ],
      cta: "Go Basic",
      popular: true,
    },
    {
      name: "Pro",
      price: "$99",
      period: "/month",
      description: "For power users and heavy usage",
      features: [
        "Unlimited documents",
        "50 GB storage",
        "Unlimited requests",
        "All file types including video",
        "Priority support",
      ],
      cta: "Go Pro",
      popular: false,
    },
  ];

  return (
    <section
      id="pricing"
      className="py-20 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-900"
    >
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
            Pricing That Scales with Your Knowledge
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Start free and upgrade as your document library grows. All plans
            include powerful Gemini AI models.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={cn(
                "relative p-6 sm:p-8 rounded-2xl border-2 transition-all duration-300 animate-fade-in flex flex-col",
                plan.popular
                  ? "border-primary shadow-xl scale-105 bg-primary/5 dark:bg-primary/10"
                  : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600",
                index === 0 && "[animation-delay:0s]",
                index === 1 && "[animation-delay:0.2s]",
                index === 2 && "[animation-delay:0.4s]",
              )}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-primary text-white px-4 py-2 rounded-full text-sm font-medium">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {plan.name}
                </h3>
                <div className="flex items-baseline justify-center gap-1 mb-2">
                  <span className="text-5xl font-bold text-gray-900 dark:text-white">
                    {plan.price}
                  </span>
                  <span className="text-gray-600 dark:text-gray-400">
                    {plan.period}
                  </span>
                </div>
                <p className="text-gray-600 dark:text-gray-400">
                  {plan.description}
                </p>
              </div>

              <ul className="space-y-4 mb-8 flex-1">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-primary flex-shrink-0" />
                    <span className="text-gray-700 dark:text-gray-300">
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              <Link href="/profile" className="w-full">
                <Button
                  className={`w-full ${
                    plan.popular
                      ? "bg-primary hover:bg-primary-600 text-white"
                      : "bg-gray-900 dark:bg-gray-100 hover:bg-gray-800 dark:hover:bg-gray-200 text-white dark:text-gray-900"
                  }`}
                  size="lg"
                >
                  {plan.cta}
                </Button>
              </Link>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            All plans include access to Gemini 2.5 Flash and Pro models, secure
            encryption, and regular updates.
          </p>
          <div className="flex flex-wrap justify-center gap-8 text-sm text-gray-500">
            <span>✓ 99.9% uptime SLA</span>
            <span>✓ SOC 2 compliant</span>
            <span>✓ 30-day money back guarantee</span>
            <span>✓ Cancel anytime</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
