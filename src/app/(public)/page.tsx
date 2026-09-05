"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Trophy,
  Dices,
  Dice1,
  CircleDot,
  Gamepad2,
  Film,
  Building2,
  Server,
  CreditCard,
  FileCheck,
  Layers,
  Cpu,
  ShieldCheck,
  ArrowRight,
  Search,
  Handshake,
  FileSignature,
  Zap,
  Globe2,
  Users,
  Award,
} from "lucide-react";
import CategoryCard from "@/components/marketplace/category-card";

const Globe = dynamic(() => import("@/components/three/globe"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[500px] flex items-center justify-center">
      <div className="w-64 h-64 rounded-full border border-primary/20 animate-pulse" />
    </div>
  ),
});

const ParticleField = dynamic(
  () => import("@/components/three/particle-field"),
  { ssr: false }
);

const CATEGORIES = [
  {
    name: "Platform Providers",
    slug: "platform-providers",
    icon: Server,
    color: "#6c5ce7",
    count: 65,
    description: "Full-stack iGaming platform solutions and white-label systems",
  },
  {
    name: "Sportsbook Providers",
    slug: "sportsbook-providers",
    icon: Trophy,
    color: "#00d2ff",
    count: 40,
    description: "Sports betting platforms, odds compilation and managed trading",
  },
  {
    name: "Sportsbook APIs",
    slug: "sportsbook-apis",
    icon: Zap,
    color: "#00ffc8",
    count: 30,
    description: "Sportsbook data feeds, odds APIs and live scoring solutions",
  },
  {
    name: "Casino APIs",
    slug: "casino-apis",
    icon: Dice1,
    color: "#ff6b9d",
    count: 55,
    description: "Casino game aggregation, live dealer APIs and content delivery",
  },
  {
    name: "Operators",
    slug: "operators",
    icon: Building2,
    color: "#a29bfe",
    count: 200,
    description: "Licensed online and retail gaming operators worldwide",
  },
  {
    name: "Affiliates",
    slug: "affiliates",
    icon: Globe2,
    color: "#fdcb6e",
    count: 80,
    description: "Affiliate networks, lead generation and performance marketing",
  },
];

const STATS = [
  { label: "Companies", value: "500+", icon: Building2 },
  { label: "Markets", value: "50+", icon: Globe2 },
  { label: "Contacts", value: "2000+", icon: Users },
  { label: "Licenses", value: "100+", icon: Award },
];

const STEPS = [
  {
    icon: Search,
    title: "Browse",
    description:
      "Explore our curated directory of iGaming companies, filtered by category, market, and specialty.",
    color: "#6c5ce7",
  },
  {
    icon: Handshake,
    title: "Connect",
    description:
      "Request introductions and build relationships with verified industry professionals worldwide.",
    color: "#00d2ff",
  },
  {
    icon: FileSignature,
    title: "Deal",
    description:
      "Close partnerships, sign deals, and grow your iGaming business through trusted connections.",
    color: "#00ffc8",
  },
];

const PARTNERS = [
  { name: "BetConstruct", style: "font-black tracking-tighter text-lg" },
  { name: "Evolution", style: "font-light tracking-widest text-base" },
  { name: "Pragmatic Play", style: "font-bold italic text-lg" },
  { name: "SoftSwiss", style: "font-mono font-semibold text-sm" },
  { name: "iSoftBet", style: "font-extrabold text-xl" },
  { name: "Playtech", style: "font-medium tracking-wide text-base" },
];

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.6, ease: "easeOut" as const },
};

const staggerContainer = {
  hidden: {},
  visible: (i: number) => ({
    transition: { staggerChildren: 0.06, delayChildren: i * 0.05 },
  }),
};

export default function LandingPage() {
  return (
    <>
      <ParticleField />

      <main className="relative z-10">
        {/* HERO */}
        <section className="relative min-h-screen flex items-center overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
          <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px]" />
          <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-secondary/5 rounded-full blur-[100px]" />

          <div className="container mx-auto px-4 lg:px-8 py-20">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <motion.div
                initial={{ opacity: 0, x: -40 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="space-y-8"
              >
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass border border-primary/20 text-xs text-primary">
                  <Zap size={12} className="text-accent" />
                  <span>The future of B2B iGaming</span>
                </div>

                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.1] tracking-tight">
                  The Global{" "}
                  <span className="gradient-text">B2B Platform</span>{" "}
                  for iGaming
                </h1>

                <p className="text-lg text-muted-foreground max-w-xl leading-relaxed">
                  Connect with operators, studios, providers, and technology
                  partners across 50+ regulated markets. Build the partnerships
                  that power the iGaming industry.
                </p>

                <div className="flex flex-wrap gap-4">
                  <Link href="/marketplace">
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-primary to-secondary text-white font-semibold text-sm shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-shadow flex items-center gap-2"
                    >
                      Explore Marketplace
                      <ArrowRight size={16} />
                    </motion.button>
                  </Link>
                  <Link href="/register">
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      className="px-8 py-3.5 rounded-xl border border-primary/30 text-foreground font-semibold text-sm hover:bg-primary/5 transition-colors"
                    >
                      List Your Company
                    </motion.button>
                  </Link>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
                className="hidden lg:block"
              >
                <Globe />
              </motion.div>
            </div>
          </div>
        </section>

        {/* TRUSTED BY */}
        <section className="py-16 border-y border-border/50">
          <div className="container mx-auto px-4 lg:px-8">
            <motion.p
              {...fadeUp}
              className="text-center text-sm text-muted-foreground mb-10 tracking-wider uppercase"
            >
              Trusted by industry leaders
            </motion.p>
            <motion.div
              {...fadeUp}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="flex flex-wrap justify-center items-center gap-x-12 gap-y-6"
            >
              {PARTNERS.map((p, i) => (
                <span
                  key={i}
                  className={`${p.style} text-muted-foreground/40 hover:text-muted-foreground/70 transition-colors cursor-default select-none`}
                >
                  {p.name}
                </span>
              ))}
            </motion.div>
          </div>
        </section>

        {/* CATEGORIES */}
        <section className="py-24">
          <div className="container mx-auto px-4 lg:px-8">
            <motion.div {...fadeUp} className="text-center mb-14">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                Explore the{" "}
                <span className="gradient-text">iGaming Ecosystem</span>
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                From sportsbook to compliance, find the partners and providers
                that fit your needs across every vertical.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {CATEGORIES.map((cat, i) => (
                <CategoryCard key={cat.slug} {...cat} index={i} />
              ))}
            </div>
          </div>
        </section>

        {/* STATS */}
        <section className="py-20 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-secondary/5 to-accent/5" />
          <div className="container mx-auto px-4 lg:px-8 relative z-10">
            <motion.div {...fadeUp} className="text-center mb-14">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                Powering Connections{" "}
                <span className="gradient-text">Worldwide</span>
              </h2>
            </motion.div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {STATS.map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className="glass-card p-6 text-center group hover:border-primary/30 transition-all duration-300"
                >
                  <stat.icon
                    size={28}
                    className="mx-auto mb-3 text-primary group-hover:text-secondary transition-colors"
                  />
                  <div className="text-3xl sm:text-4xl font-bold gradient-text mb-1">
                    {stat.value}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {stat.label}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="py-24">
          <div className="container mx-auto px-4 lg:px-8">
            <motion.div {...fadeUp} className="text-center mb-14">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                How It <span className="gradient-text">Works</span>
              </h2>
              <p className="text-muted-foreground max-w-lg mx-auto">
                Three simple steps to expand your iGaming network and close
                partnerships that matter.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              {STEPS.map((step, i) => (
                <motion.div
                  key={step.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.15 }}
                  className="glass-card p-8 text-center group hover:border-primary/30 transition-all duration-300 relative"
                >
                  {i < STEPS.length - 1 && (
                    <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-[1px] bg-gradient-to-r from-primary/40 to-transparent" />
                  )}

                  <div
                    className="w-14 h-14 rounded-2xl mx-auto mb-5 flex items-center justify-center transition-all duration-300 group-hover:scale-110"
                    style={{
                      background: `${step.color}15`,
                      border: `1px solid ${step.color}30`,
                    }}
                  >
                    <step.icon size={24} style={{ color: step.color }} />
                  </div>

                  <h3 className="text-xl font-bold text-foreground mb-2">
                    {step.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>

                  <div className="absolute top-4 right-4 text-6xl font-black text-primary/5 select-none">
                    {String(i + 1).padStart(2, "0")}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-24 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-t from-primary/5 via-transparent to-transparent" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-primary/10 rounded-full blur-[100px]" />

          <div className="container mx-auto px-4 lg:px-8 relative z-10">
            <motion.div
              {...fadeUp}
              className="text-center max-w-2xl mx-auto glass-card p-12"
            >
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                Ready to grow your{" "}
                <span className="gradient-text">iGaming network</span>?
              </h2>
              <p className="text-muted-foreground mb-8 leading-relaxed">
                Join 500+ companies already using iGaming Connect to find
                partners, close deals, and expand into new markets.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link href="/register">
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-primary to-secondary text-white font-semibold text-sm shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-shadow flex items-center gap-2"
                  >
                    Get Started Free
                    <ArrowRight size={16} />
                  </motion.button>
                </Link>
                <Link href="/marketplace">
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className="px-8 py-3.5 rounded-xl border border-primary/30 text-foreground font-semibold text-sm hover:bg-primary/5 transition-colors"
                  >
                    Browse Companies
                  </motion.button>
                </Link>
              </div>
            </motion.div>
          </div>
        </section>
      </main>
    </>
  );
}
