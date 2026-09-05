"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

const CATEGORIES = [
  "All",
  "General",
  "Account",
  "Marketplace",
  "Billing",
  "Technical",
];

const FAQS: Record<string, { q: string; a: string }[]> = {
  General: [
    {
      q: "What is iGaming Connect?",
      a: "iGaming Connect is the premier B2B networking platform built exclusively for the iGaming industry. We connect operators, game studios, platform providers, payment processors, and technology companies across 50+ regulated markets worldwide.",
    },
    {
      q: "Who can use iGaming Connect?",
      a: "Our platform is designed for B2B professionals in the iGaming industry. This includes operators, game developers, platform providers, payment service providers, compliance experts, affiliates, and technology companies serving the gambling sector.",
    },
    {
      q: "How is iGaming Connect different from LinkedIn?",
      a: "Unlike general professional networks, iGaming Connect is purpose-built for the iGaming industry. Every company is verified, every listing is curated, and our search filters are designed specifically for the gambling industry's unique categories, markets, and licensing requirements.",
    },
  ],
  Account: [
    {
      q: "How do I create an account?",
      a: "Click the Register button on our homepage or navbar. Fill in your details, verify your email, and you'll have access to the marketplace immediately. Company listings require additional verification which typically takes 24-48 hours.",
    },
    {
      q: "Can I have multiple users from my company?",
      a: "Yes! Professional and Enterprise plans support multiple team members. Each member gets their own login with shared access to your company's saved contacts and outreach history.",
    },
    {
      q: "How do I reset my password?",
      a: "Click 'Forgot Password' on the login page, enter your registered email, and follow the link in the reset email. The link expires after 1 hour for security. If you don't receive the email, check your spam folder.",
    },
    {
      q: "How do I verify my company listing?",
      a: "After creating a company profile, our team will review your submission within 24-48 hours. We verify business registration, licensing, and operational status. Verified companies receive a badge on their profile for added credibility.",
    },
  ],
  Marketplace: [
    {
      q: "How do I search for companies?",
      a: "Use the Marketplace page to browse companies. You can filter by category (Platform Providers, Sportsbook Providers, Sportsbook APIs, Casino APIs, Operators, Affiliates), country, market region, and verification status. Use the search bar for keyword-based discovery across all company fields.",
    },
    {
      q: "What does the 'Verified' badge mean?",
      a: "The Verified badge indicates that iGaming Connect has confirmed the company's business registration, operational status, and relevant gambling licenses. This adds an extra layer of trust when evaluating potential partners.",
    },
    {
      q: "Can I save companies for later?",
      a: "Yes! Click the 'Save Company' button on any company profile to add it to your saved list. Access your saved companies from your dashboard for quick reference.",
    },
    {
      q: "How do contact reveals work?",
      a: "When you click 'Reveal Contact' on a team member's profile, it uses one of your monthly contact reveal credits. This unveils the full email and phone number. Revealed contacts are stored in your account for future reference.",
    },
  ],
  Billing: [
    {
      q: "What payment methods do you accept?",
      a: "We accept all major credit cards (Visa, Mastercard, American Express) through our secure payment partner Stripe. Enterprise customers can also pay via bank transfer or invoice.",
    },
    {
      q: "Can I change my plan at any time?",
      a: "Absolutely. You can upgrade instantly with a prorated charge for the remainder of your billing cycle. Downgrades take effect at the start of your next billing period. No cancellation fees.",
    },
    {
      q: "Is there a refund policy?",
      a: "We offer a 14-day money-back guarantee on all new subscriptions. If you're not satisfied within the first 14 days, contact support for a full refund. After that period, refunds are evaluated case-by-case.",
    },
  ],
  Technical: [
    {
      q: "Do you have an API?",
      a: "Yes, Professional and Enterprise plans include API access. Our REST API allows you to programmatically search companies, retrieve contact information, and integrate iGaming Connect data into your CRM or internal tools. Full API documentation is available in your dashboard.",
    },
    {
      q: "Is my data secure?",
      a: "Security is our top priority. We use bank-level encryption (AES-256), SOC 2 compliant infrastructure, and regular security audits. Your data is stored on encrypted servers with strict access controls. We are GDPR compliant.",
    },
    {
      q: "Do you offer data exports?",
      a: "Professional plans support CSV exports of saved contacts. Enterprise plans include bulk exports, CRM integrations (Salesforce, HubSpot), and custom data feeds. All exports are logged for compliance purposes.",
    },
  ],
};

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.6, ease: "easeOut" as const },
};

export default function FAQPage() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [openFaq, setOpenFaq] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const allFaqs = Object.entries(FAQS).flatMap(([cat, items]) =>
    items.map((item) => ({ ...item, category: cat }))
  );

  const filteredFaqs = allFaqs.filter((faq) => {
    const matchesCategory =
      activeCategory === "All" || faq.category === activeCategory;
    const matchesSearch =
      !search ||
      faq.q.toLowerCase().includes(search.toLowerCase()) ||
      faq.a.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen">
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[250px] bg-primary/10 rounded-full blur-[120px]" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div {...fadeUp} className="text-center mb-14">
            <h1 className="text-4xl sm:text-5xl font-bold mb-4">
              Frequently Asked <span className="gradient-text">Questions</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              Everything you need to know about iGaming Connect.
            </p>
          </motion.div>

          <motion.div
            {...fadeUp}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="max-w-2xl mx-auto mb-8"
          >
            <div className="relative">
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                placeholder="Search questions..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-11 h-12 text-base"
              />
            </div>
          </motion.div>

          <motion.div
            {...fadeUp}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="flex flex-wrap justify-center gap-2 mb-10"
          >
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  setActiveCategory(cat);
                  setOpenFaq(null);
                }}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                  activeCategory === cat
                    ? "bg-primary/15 text-primary border border-primary/30"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/5 border border-transparent"
                )}
              >
                {cat}
              </button>
            ))}
          </motion.div>

          <div className="max-w-3xl mx-auto">
            {filteredFaqs.length > 0 ? (
              <div className="space-y-3">
                {filteredFaqs.map((faq, i) => {
                  const faqKey = `${faq.category}-${faq.q}`;
                  const isOpen = openFaq === faqKey;
                  return (
                    <motion.div
                      key={faqKey}
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.3, delay: i * 0.03 }}
                      className="glass-card overflow-hidden"
                    >
                      <button
                        onClick={() => setOpenFaq(isOpen ? null : faqKey)}
                        className="w-full flex items-center justify-between p-5 text-left gap-4"
                      >
                        <div className="flex-1">
                          <span className="text-[10px] font-medium uppercase tracking-wider text-primary mb-1 block">
                            {faq.category}
                          </span>
                          <span className="text-sm font-medium text-foreground">
                            {faq.q}
                          </span>
                        </div>
                        <ChevronDown
                          size={18}
                          className={cn(
                            "text-muted-foreground transition-transform duration-200 flex-shrink-0",
                            isOpen && "rotate-180"
                          )}
                        />
                      </button>
                      <motion.div
                        initial={false}
                        animate={{
                          height: isOpen ? "auto" : 0,
                          opacity: isOpen ? 1 : 0,
                        }}
                        transition={{ duration: 0.25, ease: "easeInOut" }}
                        className="overflow-hidden"
                      >
                        <div className="px-5 pb-5 pt-0">
                          <p className="text-sm text-muted-foreground leading-relaxed border-t border-glass-border pt-4">
                            {faq.a}
                          </p>
                        </div>
                      </motion.div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-16">
                <Search size={32} className="mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  No results found
                </h3>
                <p className="text-sm text-muted-foreground">
                  Try a different search term or category.
                </p>
              </div>
            )}
          </div>

          <motion.div
            {...fadeUp}
            className="text-center mt-16 glass-card p-10 max-w-2xl mx-auto"
          >
            <h2 className="text-2xl font-bold mb-3">
              Still have questions?
            </h2>
            <p className="text-muted-foreground mb-6">
              Our support team is here to help. Reach out and we&apos;ll get back
              to you within 24 hours.
            </p>
            <a
              href="/contact"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-primary to-secondary text-white font-semibold text-sm shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-shadow"
            >
              Contact Support
            </a>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
