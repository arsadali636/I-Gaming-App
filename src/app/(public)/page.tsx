"use client";

import { useState, useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trophy,
  Dice1,
  Building2,
  Server,
  Globe2,
  Zap,
  Users,
  Award,
  ArrowRight,
  Search,
  Handshake,
  FileSignature,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  ChevronRight,
  MessageSquare,
  Lock,
  ArrowUpRight,
  Layers,
  CreditCard,
  Gamepad2,
  Calendar,
  MapPin,
  TrendingUp,
  SlidersHorizontal,
  Briefcase,
  Check,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import CategoryCard from "@/components/marketplace/category-card";
import CompanyCard from "@/components/marketplace/company-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

const Globe = dynamic(() => import("@/components/three/globe"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[450px] flex items-center justify-center">
      <div className="w-64 h-64 rounded-full border border-[#252A3A] bg-[#0D1220]/50 animate-pulse flex items-center justify-center">
        <div className="w-48 h-48 rounded-full border border-[#4F46E5]/20 animate-ping" />
      </div>
    </div>
  ),
});

const ParticleField = dynamic(
  () => import("@/components/three/particle-field"),
  { ssr: false }
);

interface DynamicCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  color: string;
  sort_order: number;
  is_active: number;
  count?: number;
}

// ----------------------------------------------------------------------
// DATA COLLECTIONS
// ----------------------------------------------------------------------

const ECOSYSTEM_PILLS = [
  { label: "Casino Operators", icon: Building2, count: "200+ Verified" },
  { label: "Sportsbook Platforms", icon: Trophy, count: "60+ Providers" },
  { label: "Game Studios", icon: Gamepad2, count: "95+ Content Partners" },
  { label: "Affiliate Networks", icon: Globe2, count: "120+ Traffic Hubs" },
  { label: "Payment Technology", icon: CreditCard, count: "75+ Gateways" },
  { label: "Compliance Solutions", icon: ShieldCheck, count: "40+ RegTechs" },
];

const METRICS = [
  { label: "Verified Businesses", value: "500+", sub: "Global iGaming Partners", icon: Building2 },
  { label: "Active Markets", value: "50+", sub: "Regulated Jurisdictions", icon: Globe2 },
  { label: "Industry Categories", value: "20+", sub: "Specialized B2B Verticals", icon: Layers },
];

const FEATURED_COMPANIES = [
  {
    id: "comp-1",
    name: "BetConstruct",
    slug: "betconstruct",
    categoryType: "Providers",
    categories: ["Platform Providers", "Sportsbook APIs", "Casino APIs"],
    description: "Global award-winning technology provider offering turnkey iGaming platforms and live odds feeds.",
    headquarters: "Armenia",
    country: { code: "AM", name: "Armenia" },
    market: "Global Regulated",
    is_verified: true,
    is_featured: true,
    tags: ["Sportsbook", "B2B Platform", "Odds Feed"],
  },
  {
    id: "comp-2",
    name: "Pragmatic Play",
    slug: "pragmatic-play",
    categoryType: "Game Studios",
    categories: ["Game Studios", "Casino APIs"],
    description: "Leading content supplier to the iGaming industry, offering multi-product portfolio of slots and live casino.",
    headquarters: "Gibraltar",
    country: { code: "GI", name: "Gibraltar" },
    market: "MGA / UKGC",
    is_verified: true,
    is_featured: true,
    tags: ["Slots", "Live Casino", "Bingo API"],
  },
  {
    id: "comp-3",
    name: "Betsson Group Affiliates",
    slug: "betsson-group",
    categoryType: "Operators",
    categories: ["Operators", "Affiliates"],
    description: "Premier multi-brand operator with over 20 online gaming brands across Europe and LATAM.",
    headquarters: "Malta",
    country: { code: "MT", name: "Malta" },
    market: "Europe & LATAM",
    is_verified: true,
    is_featured: true,
    tags: ["Operator", "Casino", "Sportsbook"],
  },
  {
    id: "comp-4",
    name: "SoftSwiss",
    slug: "softswiss",
    categoryType: "Providers",
    categories: ["Platform Providers", "Payment Providers"],
    description: "International tech company providing software solutions for managing iGaming and crypto projects.",
    headquarters: "Poland",
    country: { code: "PL", name: "Poland" },
    market: "Curacao & MGA",
    is_verified: true,
    is_featured: false,
    tags: ["Turnkey PAM", "Crypto Gateway", "Aggregator"],
  },
  {
    id: "comp-5",
    name: "Traffic Nomads",
    slug: "traffic-nomads",
    categoryType: "Affiliates",
    categories: ["Affiliates", "Marketing & Growth"],
    description: "Performance ad network specializing in high-converting iGaming traffic and GEO-targeted campaigns.",
    headquarters: "Portugal",
    country: { code: "PT", name: "Portugal" },
    market: "Global GEOs",
    is_verified: true,
    is_featured: false,
    tags: ["Affiliate Network", "Push Ads", "Native Traffic"],
  },
  {
    id: "comp-6",
    name: "EveryMatrix",
    slug: "everymatrix",
    categoryType: "Providers",
    categories: ["Platform Providers", "Sportsbook APIs"],
    description: "B2B iGaming software provider supplying modular PAM, casino engine, and sportsbook solutions.",
    headquarters: "Malta",
    country: { code: "MT", name: "Malta" },
    market: "US & EU Regulated",
    is_verified: true,
    is_featured: true,
    tags: ["Modular PAM", "Odds Matrix", "CasinoEngine"],
  },
];

const STEPS = [
  {
    step: "STEP 01",
    title: "Discover",
    description: "Explore verified operators, affiliates, game studios, and technology providers across the global ecosystem.",
    icon: Search,
    highlight: "Filter by market, license & vertical",
  },
  {
    step: "STEP 02",
    title: "Evaluate",
    description: "Review detailed business profiles, active gaming licenses, integration capabilities, and market specializations.",
    icon: SlidersHorizontal,
    highlight: "Structured compliance intelligence",
  },
  {
    step: "STEP 03",
    title: "Connect",
    description: "Reach decision-makers directly via direct corporate contacts, WhatsApp, or Telegram with zero broker friction.",
    icon: Handshake,
    highlight: "Direct C-Level communication",
  },
];

const INSIGHTS = [
  {
    id: 1,
    featured: true,
    category: "Market Trends",
    title: "Navigating LATAM iGaming Regulation: Brazil's New Licensing Framework",
    description: "An in-depth analysis of structural requirements, tax implications, and operator compliance strategies for entering Latin America's largest regulated market.",
    date: "Sep 05, 2026",
    readTime: "6 min read",
  },
  {
    id: 2,
    featured: false,
    category: "Technology",
    title: "API Aggregation vs Direct Studio Integrations in 2026",
    description: "Comparing technical overhead, rev-share margins, and speed-to-market when sourcing casino game content.",
    date: "Sep 02, 2026",
    readTime: "4 min read",
  },
  {
    id: 3,
    featured: false,
    category: "Regulation",
    title: "MGA Regulatory Updates: Key Compliance Checklist for Operators",
    description: "Essential breakdown of new player protection standards and AML auditing guidelines issued by the Malta Gaming Authority.",
    date: "Aug 29, 2026",
    readTime: "5 min read",
  },
  {
    id: 4,
    featured: false,
    category: "Industry Partnerships",
    title: "How Sportsbook Providers Are Leveraging Real-Time Micro-Betting Feeds",
    description: "Exploring live in-play engagement mechanics and data latency benchmarks driving modern sports betting platforms.",
    date: "Aug 24, 2026",
    readTime: "4 min read",
  },
];

const EVENTS = [
  {
    name: "iGB LIVE 2026",
    date: "JUL 14 - 17, 2026",
    location: "Amsterdam, Netherlands",
    countryCode: "NL",
    category: "B2B Expo & Summit",
    description: "Connect with 10,000+ iGaming operators, affiliates, and technology providers at Europe's leading dedicated B2B event.",
  },
  {
    name: "SiGMA Europe Summit",
    date: "NOV 11 - 14, 2026",
    location: "Valletta, Malta",
    countryCode: "MT",
    category: "Global Gaming Summit",
    description: "The mother of all iGaming conferences gathering C-level executives, investors, and regulatory leaders worldwide.",
  },
  {
    name: "ICE London 2027",
    date: "FEB 02 - 04, 2027",
    location: "Barcelona, Spain",
    countryCode: "ES",
    category: "World Gaming Tradeshow",
    description: "The premier international showcase for land-based and online gaming solutions across global jurisdictions.",
  },
];

const HERO_LIVE_ACTIVITY = [
  {
    company1: "Pragmatic Play",
    company2: "Betsson Group",
    action: "Connected for Live Casino API Distribution",
    time: "Just now",
  },
  {
    company1: "BetConstruct",
    company2: "EveryMatrix",
    action: "Established Sportsbook Data Feed Partnership",
    time: "3 mins ago",
  },
  {
    company1: "SoftSwiss",
    company2: "Traffic Nomads",
    action: "Requested Affiliate Network Executive Introduction",
    time: "8 mins ago",
  },
];

const FAQ_ITEMS = [
  {
    q: "What is iGaming Connect?",
    a: "iGaming Connect is a premium global B2B marketplace and business intelligence network designed exclusively for the iGaming ecosystem. It enables operators, affiliates, game studios, platform providers, and RegTech companies to discover, evaluate, and connect directly with verified partners.",
  },
  {
    q: "Who can join the platform?",
    a: "Any legitimate B2B iGaming enterprise — including online casino & sportsbook operators, affiliate networks, game developers, payment service providers, turnkey platform PAMs, compliance auditors, and growth agencies.",
  },
  {
    q: "How are company profiles verified?",
    a: "Our compliance team conducts multi-point verification audits checking corporate registration, domain ownership, regulatory licenses (such as MGA, UKGC, AGCO, SGA, Curaçao), and active industry references before awarding the Verified Partner badge.",
  },
  {
    q: "How can I find relevant partners?",
    a: "Use our intelligent discovery filters to search by business category, operating jurisdiction, product specializations (e.g. Turnkey PAM, Live Dealer, Crypto Gateway), or upcoming summit attendance.",
  },
  {
    q: "Is creating a company profile free?",
    a: "Yes! Basic company profile creation and directory listing are completely free. Enterprise members gain access to advanced executive contact reveals, priority search placement, and event pre-booking tools.",
  },
  {
    q: "How do I contact a company?",
    a: "Registered business users can view direct work emails, WhatsApp lines, and Telegram handles of C-level decision-makers and business development leads without middleman broker fees.",
  },
];

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.5, ease: "easeOut" as const },
};

// ----------------------------------------------------------------------
// MAIN HOMEPAGE COMPONENT
// ----------------------------------------------------------------------

export default function LandingPage() {
  const [activeTab, setActiveTab] = useState("All");
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [activityIndex, setActivityIndex] = useState(0);

  // Dynamic Categories State
  const [categories, setCategories] = useState<DynamicCategory[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);

  const fetchCategories = async () => {
    setCategoriesLoading(true);
    setCategoriesError(null);
    try {
      const res = await fetch("/api/categories");
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      if (Array.isArray(data.categories)) {
        setCategories(data.categories);
      } else {
        setCategories([]);
      }
    } catch (err: any) {
      console.error("Error fetching homepage categories:", err);
      setCategoriesError(err?.message || "Failed to load categories");
    } finally {
      setCategoriesLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Filter companies based on active tab
  const filteredCompanies = useMemo(() => {
    if (activeTab === "All") return FEATURED_COMPANIES;
    return FEATURED_COMPANIES.filter(
      (c) => c.categoryType.toLowerCase() === activeTab.toLowerCase()
    );
  }, [activeTab]);

  return (
    <>
      <ParticleField />

      <div className="relative z-10 bg-[#080B14] text-[#F8FAFC] selection:bg-[#4F46E5] selection:text-white font-sans overflow-x-hidden">
        
        {/* ==================================================================== */}
        {/* SECTION 1 — HERO                                                     */}
        {/* ==================================================================== */}
        <section className="relative min-h-[92vh] flex items-center overflow-hidden border-b border-[#252A3A]/80 pt-16 pb-24">
          {/* Background Grid & Ambient Glows */}
          <div className="absolute inset-0 bg-[radial-gradient(#252A3A_1px,transparent_1px)] [background-size:36px_36px] opacity-35 pointer-events-none" />
          <div className="absolute top-1/4 left-10 w-96 h-96 bg-[#4F46E5]/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-10 right-10 w-[30rem] h-[30rem] bg-[#22C1DC]/10 rounded-full blur-3xl pointer-events-none" />

          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">
              
              {/* Left Column Text & CTAs */}
              <motion.div
                initial={{ opacity: 0, x: -25 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="lg:col-span-7 space-y-8"
              >
                {/* Eyebrow Pill */}
                <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-[#0D1220] border border-[#252A3A] text-xs font-semibold text-[#22C1DC] shadow-sm backdrop-blur-md">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#22C1DC] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#22C1DC]"></span>
                  </span>
                  <span className="tracking-widest uppercase text-[11px]">GLOBAL IGAMING BUSINESS NETWORK</span>
                </div>

                {/* Main Heading */}
                <div className="space-y-4 max-w-3xl">
                  <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.1] tracking-tight text-[#F8FAFC]">
                    Build Smarter Partnerships{" "}
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#818CF8] via-[#3B82F6] to-[#22C1DC]">
                      Across iGaming
                    </span>
                  </h1>
                  <p className="text-base sm:text-lg text-[#A1A9B8] leading-relaxed max-w-2xl">
                    Discover verified operators, affiliates, technology providers and service partners through one intelligent B2B network. Direct introductions, zero middleman friction.
                  </p>
                </div>

                {/* Primary & Secondary Buttons */}
                <div className="flex flex-wrap items-center gap-4 pt-2">
                  <Link href="/marketplace">
                    <Button
                      size="lg"
                      className="bg-gradient-to-r from-[#4F46E5] to-[#3B82F6] hover:from-[#4338CA] hover:to-[#2563EB] text-white font-bold px-7 h-12 rounded-xl text-sm transition-all duration-200 flex items-center gap-2 shadow-xl shadow-[#4F46E5]/25 hover:scale-[1.02]"
                    >
                      <span>Explore Companies</span>
                      <ArrowRight size={16} />
                    </Button>
                  </Link>

                  <a href="#how-it-works">
                    <Button
                      variant="outline"
                      size="lg"
                      className="bg-[#121827] border-[#252A3A] hover:border-[#343B52] hover:bg-[#171B2B] text-[#F8FAFC] font-semibold px-7 h-12 rounded-xl text-sm transition-all duration-200"
                    >
                      <span>How It Works</span>
                    </Button>
                  </a>
                </div>

                {/* 3 Trust Indicators */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-6 border-t border-[#252A3A]/70">
                  <div className="flex items-center gap-2 text-xs font-medium text-[#A1A9B8]">
                    <div className="w-5 h-5 rounded-full bg-[#22C1DC]/10 border border-[#22C1DC]/30 flex items-center justify-center shrink-0">
                      <Check size={12} className="text-[#22C1DC]" />
                    </div>
                    <span>Verified Business Profiles</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-medium text-[#A1A9B8]">
                    <div className="w-5 h-5 rounded-full bg-[#22C1DC]/10 border border-[#22C1DC]/30 flex items-center justify-center shrink-0">
                      <Check size={12} className="text-[#22C1DC]" />
                    </div>
                    <span>Global Industry Network</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-medium text-[#A1A9B8]">
                    <div className="w-5 h-5 rounded-full bg-[#22C1DC]/10 border border-[#22C1DC]/30 flex items-center justify-center shrink-0">
                      <Check size={12} className="text-[#22C1DC]" />
                    </div>
                    <span>Direct Business Connections</span>
                  </div>
                </div>
              </motion.div>

              {/* Right Hero Visual: Global Industry Intelligence Map */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.7, delay: 0.15, ease: "easeOut" }}
                className="lg:col-span-5 relative"
              >
                <div className="relative rounded-2xl bg-[#0D1220]/90 border border-[#252A3A] p-5 shadow-2xl backdrop-blur-xl overflow-hidden group">
                  
                  {/* Visual Header */}
                  <div className="flex items-center justify-between pb-3.5 border-b border-[#252A3A] mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#22C1DC] animate-pulse" />
                      <span className="text-xs font-bold text-[#F8FAFC] tracking-wider uppercase">
                        Global Industry Intelligence Map
                      </span>
                    </div>
                    <span className="text-[10px] text-[#A5B4FC] font-mono bg-[#121827] px-2.5 py-0.5 rounded-md border border-[#252A3A]">
                      LIVE NODES
                    </span>
                  </div>

                  {/* Floating Industry Badges Overlay */}
                  <div className="absolute top-16 left-4 z-20 bg-[#121827]/90 border border-[#252A3A] px-3 py-1.5 rounded-lg shadow-lg text-[11px] font-semibold text-[#F8FAFC] flex items-center gap-1.5 backdrop-blur-md">
                    <span>🎰</span> Operator Node
                  </div>

                  <div className="absolute top-28 right-4 z-20 bg-[#121827]/90 border border-[#252A3A] px-3 py-1.5 rounded-lg shadow-lg text-[11px] font-semibold text-[#F8FAFC] flex items-center gap-1.5 backdrop-blur-md">
                    <span>📈</span> Affiliate Network
                  </div>

                  <div className="absolute bottom-28 left-6 z-20 bg-[#121827]/90 border border-[#252A3A] px-3 py-1.5 rounded-lg shadow-lg text-[11px] font-semibold text-[#F8FAFC] flex items-center gap-1.5 backdrop-blur-md">
                    <span>💳</span> Payments API
                  </div>

                  <div className="absolute bottom-36 right-6 z-20 bg-[#121827]/90 border border-[#252A3A] px-3 py-1.5 rounded-lg shadow-lg text-[11px] font-semibold text-[#F8FAFC] flex items-center gap-1.5 backdrop-blur-md">
                    <span>🎮</span> Game Studio
                  </div>

                  {/* 3D Globe Container */}
                  <div className="relative h-[330px] w-full flex items-center justify-center">
                    <Globe />
                  </div>

                  {/* Real-time Connection Ticker Box */}
                  <div className="mt-2 p-3.5 rounded-xl bg-[#121827] border border-[#252A3A] space-y-1.5">
                    <div className="flex items-center justify-between text-[10px] text-[#6B7280] font-mono tracking-wider uppercase">
                      <span>RECENT NETWORK CONNECTION</span>
                      <span className="text-[#22C1DC] font-semibold">{HERO_LIVE_ACTIVITY[activityIndex].time}</span>
                    </div>
                    <p className="text-xs text-[#F8FAFC] font-medium leading-snug">
                      <span className="text-[#818CF8] font-bold">
                        {HERO_LIVE_ACTIVITY[activityIndex].company1}
                      </span>{" "}
                      {HERO_LIVE_ACTIVITY[activityIndex].action}{" "}
                      <span className="text-[#22C1DC] font-bold">
                        {HERO_LIVE_ACTIVITY[activityIndex].company2}
                      </span>
                    </p>
                  </div>

                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ==================================================================== */}
        {/* SECTION 2 — TRUST / NETWORK STRIP                                    */}
        {/* ==================================================================== */}
        <section className="py-14 border-b border-[#252A3A]/80 bg-[#0D1220]/60">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div {...fadeUp} className="space-y-8">
              
              <div className="text-center space-y-2">
                <h2 className="text-xs font-bold text-[#6B7280] tracking-widest uppercase">
                  BUILT FOR THE GLOBAL IGAMING ECOSYSTEM
                </h2>
              </div>

              {/* Ecosystem Pills */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {ECOSYSTEM_PILLS.map((pill, i) => (
                  <div
                    key={i}
                    className="flex flex-col items-center justify-center p-3.5 rounded-xl bg-[#121827] border border-[#252A3A] hover:border-[#343B52] transition-all duration-200 text-center group cursor-default"
                  >
                    <pill.icon className="h-5 w-5 text-[#818CF8] group-hover:text-[#22C1DC] transition-colors mb-2" />
                    <span className="text-xs font-bold text-[#F8FAFC] leading-tight">
                      {pill.label}
                    </span>
                    <span className="text-[10px] text-[#A1A9B8] font-medium mt-1">
                      {pill.count}
                    </span>
                  </div>
                ))}
              </div>

              {/* Metric Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6 border-t border-[#252A3A]/60 max-w-4xl mx-auto">
                {METRICS.map((m, i) => (
                  <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-[#121827]/80 border border-[#252A3A] justify-center">
                    <div className="w-10 h-10 rounded-xl bg-[#4F46E5]/10 border border-[#4F46E5]/20 flex items-center justify-center shrink-0">
                      <m.icon className="h-5 w-5 text-[#818CF8]" />
                    </div>
                    <div>
                      <div className="text-2xl font-black text-[#F8FAFC] tracking-tight">{m.value}</div>
                      <div className="text-xs font-semibold text-[#A1A9B8]">{m.label}</div>
                    </div>
                  </div>
                ))}
              </div>

            </motion.div>
          </div>
        </section>

        {/* ==================================================================== */}
        {/* SECTION 3 — DISCOVER BY CATEGORY (DYNAMIC DB SYSTEM)                 */}
        {/* ==================================================================== */}
        <section className="py-24 border-b border-[#252A3A]/80">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            
            {/* Section Heading */}
            <motion.div {...fadeUp} className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0D1220] border border-[#252A3A] text-xs font-semibold text-[#818CF8] mb-3">
                  <Layers size={13} />
                  <span>ECOSYSTEM SECTORS</span>
                </div>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-[#F8FAFC] tracking-tight">
                  Explore the iGaming Ecosystem
                </h2>
                <p className="text-sm text-[#A1A9B8] mt-2 max-w-xl">
                  Find the right partners by business type and specialization.
                </p>
              </div>

              <Link href="/categories">
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-[#121827] border-[#252A3A] hover:border-[#343B52] text-[#F8FAFC] text-xs font-semibold gap-1.5 h-10 px-4 rounded-xl"
                >
                  <span>View All Sectors</span>
                  <ChevronRight size={14} />
                </Button>
              </Link>
            </motion.div>

            {/* Dynamic State Rendering */}
            {categoriesLoading ? (
              /* 1. Loading State */
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="bg-[#121827] border border-[#252A3A] rounded-2xl p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <Skeleton className="w-11 h-11 rounded-xl bg-[#171B2B]" />
                      <Skeleton className="w-20 h-5 rounded-full bg-[#171B2B]" />
                    </div>
                    <Skeleton className="h-5 w-3/4 bg-[#171B2B]" />
                    <Skeleton className="h-3 w-full bg-[#171B2B]" />
                  </div>
                ))}
              </div>
            ) : categoriesError ? (
              /* 4. Error State */
              <div className="flex flex-col items-center justify-center py-12 text-center bg-[#121827] border border-[#252A3A] max-w-lg mx-auto p-8 rounded-2xl">
                <AlertCircle size={28} className="text-red-400 mb-3" />
                <h3 className="text-base font-bold text-[#F8FAFC] mb-1">Unable to load categories</h3>
                <p className="text-xs text-[#A1A9B8] mb-4">{categoriesError}</p>
                <Button onClick={fetchCategories} size="sm" className="bg-[#4F46E5] text-xs gap-2">
                  <RefreshCw size={13} /> Retry
                </Button>
              </div>
            ) : categories.length > 0 ? (
              /* 2. Success State */
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {categories.map((cat, i) => (
                  <CategoryCard
                    key={cat.id || cat.slug}
                    name={cat.name}
                    slug={cat.slug}
                    icon={cat.icon}
                    color={cat.color || "#4F46E5"}
                    count={cat.count}
                    description={cat.description}
                    index={i}
                  />
                ))}
              </div>
            ) : (
              /* 3. Empty State */
              <div className="flex flex-col items-center justify-center py-16 text-center bg-[#121827] border border-[#252A3A] max-w-lg mx-auto p-8 rounded-2xl">
                <Building2 size={32} className="text-[#818CF8] mb-3" />
                <h3 className="text-base font-bold text-[#F8FAFC] mb-1">No active categories available yet</h3>
                <p className="text-xs text-[#A1A9B8]">
                  Active categories added by the Super Admin will automatically appear here.
                </p>
              </div>
            )}

          </div>
        </section>

        {/* ==================================================================== */}
        {/* SECTION 4 — FEATURED COMPANIES                                      */}
        {/* ==================================================================== */}
        <section className="py-24 border-b border-[#252A3A]/80 bg-[#0D1220]/50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            
            {/* Section Header */}
            <motion.div {...fadeUp} className="text-center max-w-2xl mx-auto mb-12 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#121827] border border-[#252A3A] text-xs font-semibold text-[#22C1DC]">
                <ShieldCheck size={14} />
                <span>AUDITED MARKETPLACE</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#F8FAFC]">
                Featured Companies
              </h2>
              <p className="text-sm text-[#A1A9B8]">
                Discover verified iGaming enterprises with active regulatory licensing and direct executive communication channels.
              </p>
            </motion.div>

            {/* Filter Tabs */}
            <div className="flex justify-center mb-10 overflow-x-auto pb-2">
              <div className="inline-flex items-center gap-1.5 p-1.5 rounded-xl bg-[#121827] border border-[#252A3A]">
                {["All", "Operators", "Affiliates", "Providers", "Game Studios"].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      activeTab === tab
                        ? "bg-[#4F46E5] text-white shadow-md shadow-[#4F46E5]/30"
                        : "text-[#A1A9B8] hover:text-[#F8FAFC] hover:bg-[#0D1220]"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* Companies Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {filteredCompanies.map((company, index) => (
                <CompanyCard key={company.id} company={company} index={index} />
              ))}
            </div>

            {/* Bottom Directory Link */}
            <div className="text-center">
              <Link href="/marketplace">
                <Button
                  size="lg"
                  className="bg-[#121827] hover:bg-[#171B2B] text-[#F8FAFC] border border-[#252A3A] hover:border-[#343B52] font-semibold px-8 h-12 rounded-xl text-sm transition-all gap-2"
                >
                  <span>Browse Full Directory</span>
                  <ArrowRight size={16} className="text-[#22C1DC]" />
                </Button>
              </Link>
            </div>

          </div>
        </section>

        {/* ==================================================================== */}
        {/* SECTION 5 — WHY IGAMING CONNECT (BENTO GRID)                         */}
        {/* ==================================================================== */}
        <section className="py-24 border-b border-[#252A3A]/80">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            
            <motion.div {...fadeUp} className="text-center max-w-3xl mx-auto mb-16 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0D1220] border border-[#252A3A] text-xs text-[#818CF8] font-semibold">
                <Sparkles size={14} />
                <span>ENTERPRISE VALUE PROPOSITION</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#F8FAFC]">
                More Than a Business Directory
              </h2>
              <p className="text-base text-[#A1A9B8] leading-relaxed">
                Access structured company profiles, verified licensing records, and direct executive contact vectors built for high-growth iGaming operations.
              </p>
            </motion.div>

            {/* Asymmetric Bento Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Feature Module 1 */}
              <motion.div
                {...fadeUp}
                className="lg:col-span-7 bg-[#121827] border border-[#252A3A] hover:border-[#343B52] rounded-2xl p-8 transition-all flex flex-col justify-between group"
              >
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-xl bg-[#4F46E5]/10 border border-[#4F46E5]/20 flex items-center justify-center">
                    <ShieldCheck size={22} className="text-[#818CF8]" />
                  </div>
                  <h3 className="text-2xl font-bold text-[#F8FAFC]">
                    1. VERIFIED COMPANY INTELLIGENCE
                  </h3>
                  <p className="text-sm text-[#A1A9B8] leading-relaxed">
                    Access structured corporate profiles designed to help you evaluate potential partners faster. Every company undergoes regulatory checks and active domain auditing.
                  </p>
                </div>

                <div className="mt-8 pt-6 border-t border-[#252A3A] flex flex-wrap gap-2">
                  {["Audited Registrations", "Regulatory Badges", "Corporate Ownership", "Live Status"].map((tag) => (
                    <span key={tag} className="text-xs text-[#22C1DC] bg-[#0D1220] px-3 py-1 rounded-lg border border-[#252A3A]">
                      ✓ {tag}
                    </span>
                  ))}
                </div>
              </motion.div>

              {/* Feature Module 2 */}
              <motion.div
                {...fadeUp}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="lg:col-span-5 bg-[#121827] border border-[#252A3A] hover:border-[#343B52] rounded-2xl p-8 transition-all flex flex-col justify-between group"
              >
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-xl bg-[#22C1DC]/10 border border-[#22C1DC]/20 flex items-center justify-center">
                    <Search size={22} className="text-[#22C1DC]" />
                  </div>
                  <h3 className="text-xl font-bold text-[#F8FAFC]">
                    2. SMART PARTNER DISCOVERY
                  </h3>
                  <p className="text-sm text-[#A1A9B8] leading-relaxed">
                    Find relevant businesses using powerful category filters, operating jurisdictions, and product specializations. Filter by turnkey PAM, live dealer feeds, or payment methods.
                  </p>
                </div>

                <div className="mt-8 pt-6 border-t border-[#252A3A]">
                  <span className="text-xs text-[#A5B4FC] font-mono">
                    Granular vertical search engine
                  </span>
                </div>
              </motion.div>

              {/* Feature Module 3 */}
              <motion.div
                {...fadeUp}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="lg:col-span-5 bg-[#121827] border border-[#252A3A] hover:border-[#343B52] rounded-2xl p-8 transition-all flex flex-col justify-between group"
              >
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-xl bg-[#818CF8]/10 border border-[#818CF8]/20 flex items-center justify-center">
                    <MessageSquare size={22} className="text-[#818CF8]" />
                  </div>
                  <h3 className="text-xl font-bold text-[#F8FAFC]">
                    3. DIRECT BUSINESS CONNECTIONS
                  </h3>
                  <p className="text-sm text-[#A1A9B8] leading-relaxed">
                    Connect directly with relevant decision-makers and business development teams. Reveal verified corporate work emails, direct WhatsApp numbers, and Telegram handles.
                  </p>
                </div>

                <div className="mt-8 pt-6 border-t border-[#252A3A]">
                  <span className="text-xs text-[#22C1DC] font-semibold">
                    Zero broker fees or middleman markups
                  </span>
                </div>
              </motion.div>

              {/* Feature Module 4 */}
              <motion.div
                {...fadeUp}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="lg:col-span-7 bg-[#121827] border border-[#252A3A] hover:border-[#343B52] rounded-2xl p-8 transition-all flex flex-col justify-between group"
              >
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-xl bg-[#3B82F6]/10 border border-[#3B82F6]/20 flex items-center justify-center">
                    <Globe2 size={22} className="text-[#3B82F6]" />
                  </div>
                  <h3 className="text-2xl font-bold text-[#F8FAFC]">
                    4. GLOBAL MARKET ACCESS
                  </h3>
                  <p className="text-sm text-[#A1A9B8] leading-relaxed">
                    Explore partnership opportunities across regulated and emerging iGaming markets including MGA (Malta), UKGC (UK), AGCO (Ontario), SGA (Sweden), Curaçao, and LATAM.
                  </p>
                </div>

                <div className="mt-8 pt-6 border-t border-[#252A3A] flex flex-wrap gap-2">
                  {["Europe & UK", "Latin America", "North America", "Asia Pacific"].map((geo) => (
                    <span key={geo} className="text-xs font-semibold text-[#F8FAFC] bg-[#0D1220] px-3 py-1 rounded-lg border border-[#252A3A]">
                      {geo}
                    </span>
                  ))}
                </div>
              </motion.div>

            </div>
          </div>
        </section>

        {/* ==================================================================== */}
        {/* SECTION 6 — HOW IT WORKS                                            */}
        {/* ==================================================================== */}
        <section id="how-it-works" className="py-24 border-b border-[#252A3A]/80 bg-[#0D1220]/60">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            
            <motion.div {...fadeUp} className="text-center max-w-2xl mx-auto mb-16 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#121827] border border-[#252A3A] text-xs text-[#22C1DC] font-semibold">
                <Handshake size={14} />
                <span>3-STEP WORKFLOW</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-[#F8FAFC]">
                Find Your Next Business Partner in Minutes
              </h2>
              <p className="text-sm text-[#A1A9B8]">
                A streamlined three-step discovery workflow engineered for B2B industry deals.
              </p>
            </motion.div>

            {/* Steps Container */}
            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto relative">
              {STEPS.map((s, i) => (
                <motion.div
                  key={s.step}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.12 }}
                  className="bg-[#121827] border border-[#252A3A] hover:border-[#343B52] rounded-2xl p-8 transition-all relative flex flex-col justify-between group"
                >
                  <div className="space-y-5">
                    <div className="flex items-center justify-between">
                      <div className="w-12 h-12 rounded-xl bg-[#4F46E5]/10 border border-[#4F46E5]/20 flex items-center justify-center">
                        <s.icon size={22} className="text-[#818CF8]" />
                      </div>
                      <span className="text-xs font-bold text-[#22C1DC] font-mono tracking-widest uppercase bg-[#0D1220] px-2.5 py-1 rounded-md border border-[#252A3A]">
                        {s.step}
                      </span>
                    </div>

                    <h3 className="text-xl font-bold text-[#F8FAFC]">
                      {s.title}
                    </h3>

                    <p className="text-xs sm:text-sm text-[#A1A9B8] leading-relaxed">
                      {s.description}
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-[#252A3A]">
                    <span className="text-[11px] font-semibold text-[#818CF8]">
                      ✓ {s.highlight}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>

          </div>
        </section>

        {/* ==================================================================== */}
        {/* SECTION 7 — MARKET INTELLIGENCE / INSIGHTS                          */}
        {/* ==================================================================== */}
        <section id="insights" className="py-24 border-b border-[#252A3A]/80">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            
            <motion.div {...fadeUp} className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0D1220] border border-[#252A3A] text-xs font-semibold text-[#818CF8] mb-3">
                  <Briefcase size={13} />
                  <span>B2B ANALYSIS</span>
                </div>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-[#F8FAFC]">
                  Industry Intelligence
                </h2>
                <p className="text-sm text-[#A1A9B8] mt-1">
                  Stay connected with the business side of global iGaming.
                </p>
              </div>
            </motion.div>

            {/* Layout: 1 Featured + 3 Smaller Cards */}
            <div className="grid lg:grid-cols-12 gap-8">
              
              {/* Featured Card (Span 7) */}
              <motion.div
                {...fadeUp}
                className="lg:col-span-7 bg-[#121827] border border-[#252A3A] hover:border-[#343B52] rounded-2xl p-8 transition-all flex flex-col justify-between group"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#22C1DC] bg-[#0D1220] px-3 py-1 rounded-lg border border-[#252A3A]">
                      {INSIGHTS[0].category}
                    </span>
                    <span className="text-xs text-[#6B7280]">{INSIGHTS[0].readTime}</span>
                  </div>

                  <h3 className="text-2xl font-bold text-[#F8FAFC] group-hover:text-[#818CF8] transition-colors leading-tight">
                    {INSIGHTS[0].title}
                  </h3>

                  <p className="text-sm text-[#A1A9B8] leading-relaxed">
                    {INSIGHTS[0].description}
                  </p>
                </div>

                <div className="mt-8 pt-6 border-t border-[#252A3A] flex items-center justify-between">
                  <span className="text-xs text-[#6B7280]">{INSIGHTS[0].date}</span>
                  <span className="text-xs font-bold text-[#F8FAFC] group-hover:text-[#22C1DC] transition-colors flex items-center gap-1">
                    Read Insight <ArrowUpRight size={14} />
                  </span>
                </div>
              </motion.div>

              {/* 3 Smaller Insight Cards (Span 5) */}
              <div className="lg:col-span-5 space-y-4">
                {INSIGHTS.slice(1).map((item, idx) => (
                  <motion.div
                    key={item.id}
                    {...fadeUp}
                    transition={{ duration: 0.4, delay: idx * 0.1 }}
                    className="bg-[#121827] border border-[#252A3A] hover:border-[#343B52] rounded-2xl p-5 transition-all flex flex-col justify-between group cursor-pointer"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-[#818CF8]">
                          {item.category}
                        </span>
                        <span className="text-[11px] text-[#6B7280]">{item.date}</span>
                      </div>
                      <h4 className="text-sm font-bold text-[#F8FAFC] group-hover:text-[#22C1DC] transition-colors line-clamp-2">
                        {item.title}
                      </h4>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-[#252A3A]/60 flex items-center justify-between">
                      <span className="text-[10px] text-[#6B7280]">{item.readTime}</span>
                      <span className="text-[11px] font-semibold text-[#A1A9B8] group-hover:text-[#F8FAFC] flex items-center gap-1">
                        Read <ArrowUpRight size={12} />
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>

            </div>

          </div>
        </section>

        {/* ==================================================================== */}
        {/* SECTION 8 — EVENTS                                                   */}
        {/* ==================================================================== */}
        <section id="events" className="py-24 border-b border-[#252A3A]/80 bg-[#0D1220]/60">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            
            <motion.div {...fadeUp} className="text-center max-w-2xl mx-auto mb-16 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#121827] border border-[#252A3A] text-xs text-[#22C1DC] font-semibold">
                <Calendar size={14} />
                <span>SUMMIT CALENDAR</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-[#F8FAFC]">
                Meet the Industry
              </h2>
              <p className="text-sm text-[#A1A9B8]">
                Upcoming major B2B summits and global conferences. Pre-book high-value executive meetings before stepping onto the floor.
              </p>
            </motion.div>

            {/* Event Cards Grid */}
            <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {EVENTS.map((evt, idx) => (
                <motion.div
                  key={evt.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: idx * 0.1 }}
                  className="bg-[#121827] border border-[#252A3A] hover:border-[#343B52] rounded-2xl p-6 transition-all flex flex-col justify-between group"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="px-3 py-1 rounded-lg bg-[#4F46E5]/15 border border-[#4F46E5]/30 text-xs font-bold text-[#818CF8] font-mono">
                        {evt.date}
                      </div>
                      <span className="text-[11px] font-semibold text-[#A1A9B8] bg-[#0D1220] px-2.5 py-0.5 rounded border border-[#252A3A]">
                        {evt.category}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-xl font-bold text-[#F8FAFC] group-hover:text-[#22C1DC] transition-colors">
                        {evt.name}
                      </h3>
                      <div className="flex items-center gap-1.5 text-xs text-[#A1A9B8] mt-1">
                        <MapPin size={12} className="text-[#818CF8]" />
                        <span>{evt.location}</span>
                      </div>
                    </div>

                    <p className="text-xs text-[#A1A9B8] leading-relaxed">
                      {evt.description}
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-[#252A3A]">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full bg-[#0D1220] border-[#252A3A] hover:border-[#343B52] hover:bg-[#171B2B] text-[#F8FAFC] text-xs font-semibold gap-1.5 h-9 font-sans"
                    >
                      <span>Explore Event</span>
                      <ArrowUpRight size={13} className="text-[#22C1DC]" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>

          </div>
        </section>

        {/* ==================================================================== */}
        {/* SECTION 9 — PLATFORM CTA                                             */}
        {/* ==================================================================== */}
        <section className="py-24">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              {...fadeUp}
              className="max-w-5xl mx-auto rounded-3xl bg-gradient-to-br from-[#121827] via-[#0D1220] to-[#121827] border border-[#252A3A] p-10 sm:p-16 text-center space-y-6 shadow-2xl relative overflow-hidden group"
            >
              {/* Background ambient glow */}
              <div className="absolute top-0 right-0 w-80 h-80 bg-[#4F46E5]/20 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#22C1DC]/15 rounded-full blur-3xl pointer-events-none" />

              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#080B14] border border-[#252A3A] text-xs text-[#22C1DC] font-semibold relative z-10">
                <Lock size={13} />
                <span>EXPAND YOUR NETWORK TODAY</span>
              </div>

              <h2 className="text-3xl sm:text-5xl font-extrabold text-[#F8FAFC] tracking-tight relative z-10 max-w-3xl mx-auto">
                Your Next iGaming Partnership Starts Here
              </h2>

              <p className="text-base text-[#A1A9B8] max-w-2xl mx-auto leading-relaxed relative z-10">
                Join a growing global network built to make B2B discovery simpler, faster and more transparent.
              </p>

              <div className="flex flex-wrap justify-center items-center gap-4 pt-4 relative z-10">
                <Link href="/marketplace">
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-[#4F46E5] to-[#3B82F6] hover:from-[#4338CA] hover:to-[#2563EB] text-white font-bold px-8 h-12 rounded-xl text-sm transition-all flex items-center gap-2 shadow-xl shadow-[#4F46E5]/25"
                  >
                    <span>Explore the Marketplace</span>
                    <ArrowRight size={16} />
                  </Button>
                </Link>

                <Link href="/register">
                  <Button
                    variant="outline"
                    size="lg"
                    className="bg-[#080B14] border-[#252A3A] hover:border-[#343B52] hover:bg-[#121827] text-[#F8FAFC] font-semibold px-8 h-12 rounded-xl text-sm transition-all"
                  >
                    <span>Create Your Company Profile</span>
                  </Button>
                </Link>
              </div>

              <p className="text-xs text-[#6B7280] relative z-10">
                Free standard company profile listing. No credit card required.
              </p>
            </motion.div>
          </div>
        </section>

        {/* ==================================================================== */}
        {/* SECTION 10 — FAQ ACCORDION                                           */}
        {/* ==================================================================== */}
        <section id="faq" className="py-24 border-t border-[#252A3A]/80 bg-[#0D1220]/40">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            
            <motion.div {...fadeUp} className="text-center max-w-2xl mx-auto mb-16 space-y-4">
              <h2 className="text-3xl sm:text-4xl font-extrabold text-[#F8FAFC]">
                Frequently Asked Questions
              </h2>
              <p className="text-sm text-[#A1A9B8]">
                Everything you need to know about iGaming Connect business profiles and directory features.
              </p>
            </motion.div>

            {/* Accordion List */}
            <div className="max-w-3xl mx-auto space-y-4">
              {FAQ_ITEMS.map((faq, i) => {
                const isOpen = openFaq === i;
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.3, delay: i * 0.05 }}
                    className="bg-[#121827] border border-[#252A3A] hover:border-[#343B52] rounded-2xl overflow-hidden transition-all"
                  >
                    <button
                      onClick={() => setOpenFaq(isOpen ? null : i)}
                      className="w-full p-6 text-left flex items-center justify-between gap-4 cursor-pointer"
                    >
                      <span className="text-base font-bold text-[#F8FAFC]">
                        {faq.q}
                      </span>
                      <ChevronRight
                        size={18}
                        className={`text-[#6B7280] transition-transform duration-200 shrink-0 ${
                          isOpen ? "rotate-90 text-[#22C1DC]" : ""
                        }`}
                      />
                    </button>

                    <AnimatePresence>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25, ease: "easeInOut" }}
                          className="overflow-hidden"
                        >
                          <div className="px-6 pb-6 pt-0">
                            <p className="text-sm text-[#A1A9B8] leading-relaxed border-t border-[#252A3A] pt-4">
                              {faq.a}
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>

          </div>
        </section>

      </div>
    </>
  );
}
