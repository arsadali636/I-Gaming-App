"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Check, ArrowRight, ChevronDown, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const PLANS = [
  {
    name: "Starter",
    price: "$299",
    period: "/month",
    reveals: "30 contact reveals",
    description: "Perfect for small teams exploring the iGaming market.",
    features: [
      "30 contact reveals per month",
      "Basic search & filters",
      "Company profiles & details",
      "Email support",
      "Market insights",
    ],
    highlighted: false,
    cta: "Get Started",
    ctaHref: "/register",
  },
  {
    name: "Professional",
    price: "$499",
    period: "/month",
    reveals: "50 contact reveals",
    description: "For growing companies that need more connections.",
    badge: "Most Popular",
    features: [
      "50 contact reveals per month",
      "Advanced search & filters",
      "Company profiles & details",
      "Priority support",
      "Market insights & reports",
      "Saved companies",
      "Export contacts (CSV)",
      "API access",
    ],
    highlighted: true,
    cta: "Start Free Trial",
    ctaHref: "/register",
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    reveals: "Unlimited reveals",
    description: "Tailored solutions for large organizations.",
    features: [
      "Unlimited contact reveals",
      "Advanced search & filters",
      "Company profiles & details",
      "Dedicated account manager",
      "Custom market reports",
      "Unlimited saved companies",
      "Bulk export & CRM integration",
      "Full API access",
      "Custom integrations",
      "SLA guarantee",
    ],
    highlighted: false,
    cta: "Contact Sales",
    ctaHref: "/contact",
  },
];

const FAQS = [
  {
    q: "What are contact reveals?",
    a: "Contact reveals allow you to view the full contact information (email and phone) of company representatives. Each month, your plan includes a set number of reveals that reset on your billing date.",
  },
  {
    q: "Can I upgrade or downgrade my plan?",
    a: "Yes, you can change your plan at any time. Upgrades take effect immediately with a prorated charge, and downgrades apply at the start of your next billing cycle.",
  },
  {
    q: "Is there a free trial?",
    a: "Yes, the Professional plan comes with a 14-day free trial. No credit card required. You can explore all features before committing.",
  },
  {
    q: "What payment methods do you accept?",
    a: "We accept all major credit cards (Visa, Mastercard, American Express) and bank transfers for Enterprise plans. All payments are processed securely via Stripe.",
  },
  {
    q: "What happens if I exceed my contact reveals?",
    a: "If you reach your monthly limit, you can purchase additional reveals at $15 each, or upgrade to a higher plan for better value.",
  },
  {
    q: "Do unused reveals roll over?",
    a: "Contact reveals do not roll over to the next month. They reset on the first day of each billing cycle.",
  },
];

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.6, ease: "easeOut" as const },
};

export default function PricingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen">
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-primary/10 rounded-full blur-[120px]" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div {...fadeUp} className="text-center mb-16">
            <h1 className="text-4xl sm:text-5xl font-bold mb-4">
              Simple, Transparent{" "}
              <span className="gradient-text">Pricing</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              Choose the plan that fits your business needs. Scale up or down
              anytime.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 lg:gap-8 max-w-5xl mx-auto items-start">
            {PLANS.map((plan, i) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className={cn(
                  "relative rounded-2xl p-px",
                  plan.highlighted && "gradient-border"
                )}
              >
                <div
                  className={cn(
                    "glass-card p-8 h-full",
                    plan.highlighted &&
                      "border-primary/40 shadow-[0_0_40px_rgba(108,92,231,0.15)]"
                  )}
                >
                  {plan.badge && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="px-4 py-1 rounded-full bg-gradient-to-r from-primary to-secondary text-white text-xs font-semibold shadow-lg shadow-primary/25">
                        {plan.badge}
                      </span>
                    </div>
                  )}

                  <div className="mb-6">
                    <h3 className="text-xl font-bold text-foreground mb-2">
                      {plan.name}
                    </h3>
                    <div className="flex items-baseline gap-1 mb-2">
                      <span className="text-4xl font-bold text-foreground">
                        {plan.price}
                      </span>
                      {plan.period && (
                        <span className="text-muted-foreground text-sm">
                          {plan.period}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-primary font-medium mb-1">
                      {plan.reveals}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {plan.description}
                    </p>
                  </div>

                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2.5">
                        <Check
                          size={16}
                          className="text-accent mt-0.5 flex-shrink-0"
                        />
                        <span className="text-sm text-muted-foreground">
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <Link href={plan.ctaHref}>
                    <Button
                      variant={plan.highlighted ? "default" : "outline"}
                      className={cn(
                        "w-full",
                        plan.highlighted &&
                          "bg-gradient-to-r from-primary to-secondary shadow-lg shadow-primary/25"
                      )}
                      size="lg"
                    >
                      {plan.cta}
                      <ArrowRight size={16} />
                    </Button>
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 border-t border-glass-border">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeUp} className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-3">
              Frequently Asked <span className="gradient-text">Questions</span>
            </h2>
            <p className="text-muted-foreground">
              Everything you need to know about our pricing and plans.
            </p>
          </motion.div>

          <div className="space-y-3">
            {FAQS.map((faq, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
                className="glass-card overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-5 text-left"
                >
                  <div className="flex items-center gap-3">
                    <HelpCircle
                      size={18}
                      className="text-primary flex-shrink-0"
                    />
                    <span className="text-sm font-medium text-foreground">
                      {faq.q}
                    </span>
                  </div>
                  <ChevronDown
                    size={18}
                    className={cn(
                      "text-muted-foreground transition-transform duration-200 flex-shrink-0 ml-4",
                      openFaq === i && "rotate-180"
                    )}
                  />
                </button>
                <motion.div
                  initial={false}
                  animate={{
                    height: openFaq === i ? "auto" : 0,
                    opacity: openFaq === i ? 1 : 0,
                  }}
                  transition={{ duration: 0.25, ease: "easeInOut" }}
                  className="overflow-hidden"
                >
                  <p className="px-5 pb-5 text-sm text-muted-foreground leading-relaxed">
                    {faq.a}
                  </p>
                </motion.div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
