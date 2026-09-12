"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu,
  X,
  ChevronDown,
  ChevronRight,
  LogOut,
  User,
  Settings,
  ArrowUpRight,
  Sparkles,
  Folder,
  Users,
  Zap,
  Newspaper,
  Calendar,
  MapPin,
  Clock,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { getInitials } from "@/lib/utils";

interface NewsCategory {
  id: string;
  name: string;
  slug: string;
}

interface NewsItem {
  id: string;
  title: string;
  slug: string;
  short_description: string;
  featured_image: string;
  category_name?: string;
  published_at?: string;
}

interface EventCategory {
  id: string;
  name: string;
  slug: string;
}

interface EventItem {
  id: string;
  title: string;
  slug: string;
  description: string;
  featured_image: string;
  category_name?: string;
  event_type?: string;
  start_date: string;
  end_date?: string;
  city?: string;
  country?: string;
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  // Navigation states
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [pricingMenuOpen, setPricingMenuOpen] = useState(false);
  const [newsMenuOpen, setNewsMenuOpen] = useState(false);
  const [eventsMenuOpen, setEventsMenuOpen] = useState(false);

  // Dynamic Data
  const [newsCategories, setNewsCategories] = useState<NewsCategory[]>([]);
  const [featuredNews, setFeaturedNews] = useState<NewsItem[]>([]);
  const [eventCategories, setEventCategories] = useState<EventCategory[]>([]);
  const [featuredEvents, setFeaturedEvents] = useState<EventItem[]>([]);

  // Mobile submenu toggles
  const [mobileNewsOpen, setMobileNewsOpen] = useState(false);
  const [mobileEventsOpen, setMobileEventsOpen] = useState(false);

  // Mouse timeout refs for smooth hover delays
  const newsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const eventsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pricingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 15);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Fetch dynamic News & Events data for Mega Menus
  useEffect(() => {
    async function loadMegaMenuData() {
      try {
        const [newsCatRes, featNewsRes, evtCatRes, featEvtRes] = await Promise.all([
          fetch("/api/news/categories"),
          fetch("/api/news/featured"),
          fetch("/api/events/categories"),
          fetch("/api/events/featured"),
        ]);

        if (newsCatRes.ok) {
          const data = await newsCatRes.json();
          setNewsCategories(data.categories || []);
        }

        if (featNewsRes.ok) {
          const data = await featNewsRes.json();
          setFeaturedNews(data.news || []);
        }

        if (evtCatRes.ok) {
          const data = await evtCatRes.json();
          setEventCategories(data.categories || []);
        }

        if (featEvtRes.ok) {
          const data = await featEvtRes.json();
          setFeaturedEvents(data.events || []);
        }
      } catch (err) {
        console.error("Error loading mega menu dynamic data:", err);
      }
    }
    loadMegaMenuData();
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setUserMenuOpen(false);
    setPricingMenuOpen(false);
    setNewsMenuOpen(false);
    setEventsMenuOpen(false);
  }, [pathname]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setMobileOpen(false);
      setUserMenuOpen(false);
      setPricingMenuOpen(false);
      setNewsMenuOpen(false);
      setEventsMenuOpen(false);
    }
  }, []);

  // Hover Handlers with Buffer Delays
  const handleNewsMouseEnter = () => {
    if (newsTimeoutRef.current) clearTimeout(newsTimeoutRef.current);
    setNewsMenuOpen(true);
    setEventsMenuOpen(false);
    setPricingMenuOpen(false);
  };
  const handleNewsMouseLeave = () => {
    newsTimeoutRef.current = setTimeout(() => {
      setNewsMenuOpen(false);
    }, 150);
  };

  const handleEventsMouseEnter = () => {
    if (eventsTimeoutRef.current) clearTimeout(eventsTimeoutRef.current);
    setEventsMenuOpen(true);
    setNewsMenuOpen(false);
    setPricingMenuOpen(false);
  };
  const handleEventsMouseLeave = () => {
    eventsTimeoutRef.current = setTimeout(() => {
      setEventsMenuOpen(false);
    }, 150);
  };

  const handlePricingMouseEnter = () => {
    if (pricingTimeoutRef.current) clearTimeout(pricingTimeoutRef.current);
    setPricingMenuOpen(true);
    setNewsMenuOpen(false);
    setEventsMenuOpen(false);
  };
  const handlePricingMouseLeave = () => {
    pricingTimeoutRef.current = setTimeout(() => {
      setPricingMenuOpen(false);
    }, 150);
  };

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b border-[#252A3A]/80",
        scrolled
          ? "bg-[#080B14]/90 backdrop-blur-xl py-2.5 shadow-2xl shadow-black/40"
          : "bg-[#080B14]/75 backdrop-blur-md py-3.5"
      )}
      onKeyDown={handleKeyDown}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-3 group" aria-label="iGaming Connect Home">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#4F46E5] via-[#3B82F6] to-[#22C1DC] p-0.5 shadow-lg shadow-[#4F46E5]/25 group-hover:shadow-[#22C1DC]/30 transition-all duration-300">
            <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-[#080B14]">
              <Sparkles className="h-4 w-4 text-[#22C1DC] group-hover:rotate-12 transition-transform duration-300" />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-[#F8FAFC] text-base font-extrabold tracking-tight font-sans leading-none flex items-center gap-1.5">
              iGaming <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#818CF8] to-[#22C1DC]">Connect</span>
            </span>
            <span className="text-[10px] text-[#A1A9B8] font-medium tracking-wider uppercase mt-0.5">
              Global B2B Network
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <div className="hidden items-center gap-1 lg:flex bg-[#0D1220]/80 p-1.5 rounded-full border border-[#252A3A]">
          {/* Marketplace */}
          <Link
            href="/marketplace"
            className={cn(
              "rounded-full px-4 py-1.5 text-xs font-semibold transition-all duration-200",
              pathname === "/marketplace"
                ? "text-[#F8FAFC] bg-[#4F46E5]/20 text-[#A5B4FC] border border-[#4F46E5]/40 shadow-sm"
                : "text-[#A1A9B8] hover:text-[#F8FAFC] hover:bg-[#121827]"
            )}
          >
            Marketplace
          </Link>

          {/* Categories */}
          <Link
            href="/categories"
            className={cn(
              "rounded-full px-4 py-1.5 text-xs font-semibold transition-all duration-200",
              pathname === "/categories"
                ? "text-[#F8FAFC] bg-[#4F46E5]/20 text-[#A5B4FC] border border-[#4F46E5]/40 shadow-sm"
                : "text-[#A1A9B8] hover:text-[#F8FAFC] hover:bg-[#121827]"
            )}
          >
            Categories
          </Link>

          {/* NEWS MEGA MENU TRIGGER */}
          <div
            className="relative"
            onMouseEnter={handleNewsMouseEnter}
            onMouseLeave={handleNewsMouseLeave}
          >
            <Link
              href="/news"
              className={cn(
                "flex items-center gap-1 rounded-full px-4 py-1.5 text-xs font-semibold transition-all duration-200 cursor-pointer",
                pathname.startsWith("/news")
                  ? "text-[#F8FAFC] bg-[#4F46E5]/20 text-[#A5B4FC] border border-[#4F46E5]/40 shadow-sm"
                  : "text-[#A1A9B8] hover:text-[#F8FAFC] hover:bg-[#121827]"
              )}
            >
              <span>News</span>
              <ChevronDown
                className={cn(
                  "h-3 w-3 transition-transform duration-200",
                  newsMenuOpen && "rotate-180 text-[#60A5FA]"
                )}
              />
            </Link>

            {/* NEWS MEGA MENU PANEL */}
            <AnimatePresence>
              {newsMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.98 }}
                  transition={{ duration: 0.18 }}
                  className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-[760px] rounded-3xl bg-[#0D1220]/95 border border-[#252A3A] p-6 shadow-2xl z-50 backdrop-blur-2xl space-y-4"
                >
                  <div className="grid grid-cols-12 gap-6">
                    {/* LEFT COLUMN: DYNAMIC NEWS CATEGORIES */}
                    <div className="col-span-4 border-r border-[#252A3A] pr-5 space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
                        <span className="text-[11px] font-extrabold text-[#60A5FA] uppercase tracking-wider flex items-center gap-1.5">
                          <Newspaper className="h-3.5 w-3.5 text-[#3B82F6]" />
                          News Categories
                        </span>
                      </div>

                      <div className="space-y-1">
                        <Link
                          href="/news"
                          className="flex items-center justify-between rounded-xl px-3 py-2 text-xs font-bold text-[#F8FAFC] hover:bg-[#151C2C] hover:text-[#60A5FA] transition-colors group"
                        >
                          <span>All News</span>
                          <ChevronRight className="h-3.5 w-3.5 text-[#64748B] group-hover:translate-x-0.5 transition-transform" />
                        </Link>

                        {newsCategories.map((cat) => (
                          <Link
                            key={cat.id}
                            href={`/news?category=${cat.slug}`}
                            className="flex items-center justify-between rounded-xl px-3 py-2 text-xs font-medium text-[#A1A9B8] hover:bg-[#151C2C] hover:text-[#F8FAFC] transition-colors group"
                          >
                            <span>{cat.name}</span>
                            <ChevronRight className="h-3.5 w-3.5 text-[#64748B] group-hover:translate-x-0.5 transition-transform opacity-0 group-hover:opacity-100" />
                          </Link>
                        ))}
                      </div>
                    </div>

                    {/* RIGHT COLUMN: DYNAMIC FEATURED NEWS CARDS */}
                    <div className="col-span-8 space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
                        <span className="text-[11px] font-extrabold text-[#F8FAFC] uppercase tracking-wider flex items-center gap-1.5">
                          <Sparkles className="h-3.5 w-3.5 text-[#F59E0B]" />
                          Featured Headlines
                        </span>
                        <Link
                          href="/news"
                          className="text-[11px] font-bold text-[#60A5FA] hover:underline flex items-center gap-1"
                        >
                          <span>View All News</span>
                          <ArrowRight className="h-3 w-3" />
                        </Link>
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        {featuredNews.slice(0, 3).map((item) => (
                          <Link
                            key={item.id}
                            href={`/news/${item.slug}`}
                            className="group flex flex-col rounded-2xl bg-[#151C2C]/80 border border-white/[0.06] p-2.5 hover:border-[#3B82F6]/40 hover:bg-[#1A2338] transition-all space-y-2"
                          >
                            <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl bg-[#090D16]">
                              <img
                                src={item.featured_image}
                                alt={item.title}
                                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                              />
                            </div>
                            <div className="flex flex-col flex-1 justify-between space-y-1">
                              <span className="text-[10px] font-bold text-[#60A5FA] uppercase tracking-wider">
                                {item.category_name || "News"}
                              </span>
                              <h4 className="text-xs font-bold text-white line-clamp-2 leading-snug group-hover:text-[#60A5FA] transition-colors">
                                {item.title}
                              </h4>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* EVENTS MEGA MENU TRIGGER */}
          <div
            className="relative"
            onMouseEnter={handleEventsMouseEnter}
            onMouseLeave={handleEventsMouseLeave}
          >
            <Link
              href="/events"
              className={cn(
                "flex items-center gap-1 rounded-full px-4 py-1.5 text-xs font-semibold transition-all duration-200 cursor-pointer",
                pathname.startsWith("/events")
                  ? "text-[#F8FAFC] bg-[#4F46E5]/20 text-[#A5B4FC] border border-[#4F46E5]/40 shadow-sm"
                  : "text-[#A1A9B8] hover:text-[#F8FAFC] hover:bg-[#121827]"
              )}
            >
              <span>Events</span>
              <ChevronDown
                className={cn(
                  "h-3 w-3 transition-transform duration-200",
                  eventsMenuOpen && "rotate-180 text-[#60A5FA]"
                )}
              />
            </Link>

            {/* EVENTS MEGA MENU PANEL */}
            <AnimatePresence>
              {eventsMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.98 }}
                  transition={{ duration: 0.18 }}
                  className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-[820px] rounded-3xl bg-[#0D1220]/95 border border-[#252A3A] p-6 shadow-2xl z-50 backdrop-blur-2xl space-y-4"
                >
                  <div className="grid grid-cols-12 gap-6">
                    {/* LEFT COLUMN: DYNAMIC EVENT CATEGORIES */}
                    <div className="col-span-4 border-r border-[#252A3A] pr-5 space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
                        <span className="text-[11px] font-extrabold text-[#60A5FA] uppercase tracking-wider flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-[#3B82F6]" />
                          Event Categories
                        </span>
                      </div>

                      <div className="space-y-1">
                        <Link
                          href="/events"
                          className="flex items-center justify-between rounded-xl px-3 py-2 text-xs font-bold text-[#F8FAFC] hover:bg-[#151C2C] hover:text-[#60A5FA] transition-colors group"
                        >
                          <span>All Events</span>
                          <ChevronRight className="h-3.5 w-3.5 text-[#64748B] group-hover:translate-x-0.5 transition-transform" />
                        </Link>

                        {eventCategories.map((cat) => (
                          <Link
                            key={cat.id}
                            href={`/events?category=${cat.slug}`}
                            className="flex items-center justify-between rounded-xl px-3 py-2 text-xs font-medium text-[#A1A9B8] hover:bg-[#151C2C] hover:text-[#F8FAFC] transition-colors group"
                          >
                            <span>{cat.name}</span>
                            <ChevronRight className="h-3.5 w-3.5 text-[#64748B] group-hover:translate-x-0.5 transition-transform opacity-0 group-hover:opacity-100" />
                          </Link>
                        ))}
                      </div>
                    </div>

                    {/* RIGHT COLUMN: DYNAMIC FEATURED EVENT CARDS */}
                    <div className="col-span-8 space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
                        <span className="text-[11px] font-extrabold text-[#F8FAFC] uppercase tracking-wider flex items-center gap-1.5">
                          <Sparkles className="h-3.5 w-3.5 text-[#F59E0B]" />
                          Featured Global Events
                        </span>
                        <Link
                          href="/events"
                          className="text-[11px] font-bold text-[#60A5FA] hover:underline flex items-center gap-1"
                        >
                          <span>View Events Calendar</span>
                          <ArrowRight className="h-3 w-3" />
                        </Link>
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        {featuredEvents.slice(0, 3).map((evt) => (
                          <Link
                            key={evt.id}
                            href={`/events/${evt.slug}`}
                            className="group flex flex-col rounded-2xl bg-[#151C2C]/80 border border-white/[0.06] p-2.5 hover:border-[#3B82F6]/40 hover:bg-[#1A2338] transition-all space-y-2"
                          >
                            <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl bg-[#090D16]">
                              <img
                                src={evt.featured_image}
                                alt={evt.title}
                                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                              />
                            </div>
                            <div className="flex flex-col flex-1 justify-between space-y-1.5">
                              <h4 className="text-xs font-bold text-white line-clamp-2 leading-snug group-hover:text-[#60A5FA] transition-colors">
                                {evt.title}
                              </h4>

                              <div className="space-y-0.5 text-[10px] text-[#94A3B8]">
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3 text-[#60A5FA]" />
                                  <span>{evt.start_date}</span>
                                </div>
                                <div className="flex items-center gap-1 truncate">
                                  <MapPin className="h-3 w-3 text-[#818CF8]" />
                                  <span className="truncate">
                                    {evt.city ? `${evt.city}, ` : ""}
                                    {evt.country}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Solutions */}
          <Link
            href="/#solutions"
            className="rounded-full px-4 py-1.5 text-xs font-semibold text-[#A1A9B8] hover:text-[#F8FAFC] hover:bg-[#121827] transition-all"
          >
            Solutions
          </Link>

          {/* Pricing Dropdown Trigger */}
          <div
            className="relative"
            onMouseEnter={handlePricingMouseEnter}
            onMouseLeave={handlePricingMouseLeave}
          >
            <Link
              href="/directory-pricing"
              className={cn(
                "flex items-center gap-1 rounded-full px-4 py-1.5 text-xs font-semibold transition-all duration-200 cursor-pointer",
                pathname.includes("pricing")
                  ? "text-[#F8FAFC] bg-[#4F46E5]/20 text-[#A5B4FC] border border-[#4F46E5]/40 shadow-sm"
                  : "text-[#A1A9B8] hover:text-[#F8FAFC] hover:bg-[#121827]"
              )}
            >
              <span>Pricing</span>
              <ChevronDown
                className={cn(
                  "h-3 w-3 transition-transform duration-200",
                  pricingMenuOpen && "rotate-180 text-[#60A5FA]"
                )}
              />
            </Link>

            {/* Dynamic Pricing Dropdown Menu */}
            <AnimatePresence>
              {pricingMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.96 }}
                  transition={{ duration: 0.15 }}
                  className="absolute left-0 top-full mt-2 w-80 sm:w-[360px] rounded-2xl bg-[#0D1220]/95 border border-[#252A3A] p-3.5 shadow-2xl z-50 backdrop-blur-xl space-y-3 font-sans"
                >
                  <div className="px-2 py-1 flex items-center justify-between border-b border-white/[0.08] pb-2">
                    <span className="text-[11px] font-extrabold text-[#60A5FA] tracking-wider uppercase flex items-center gap-1.5 font-mono">
                      PRICING
                    </span>
                    <span className="text-[10px] text-[#64748B] font-mono">Hierarchy Menu</span>
                  </div>

                  <div className="space-y-3 text-xs">
                    {/* BRANCH 1: Directory Pricing */}
                    <div className="space-y-1.5">
                      <Link
                        href="/directory-pricing"
                        className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-[#151C2C] text-[#F8FAFC] font-extrabold hover:text-[#60A5FA] hover:bg-[#1A2338] transition-all group"
                      >
                        <span className="text-[#64748B] font-mono text-xs">├──</span>
                        <Folder className="h-3.5 w-3.5 text-[#60A5FA]" />
                        <span>Directory Pricing</span>
                        <ChevronRight className="h-3.5 w-3.5 ml-auto text-[#64748B] group-hover:translate-x-0.5 transition-transform" />
                      </Link>

                      <div className="ml-4 pl-3 border-l-2 border-[#252A3A] space-y-2 pt-0.5">
                        <Link
                          href="/directory-pricing?category=operators"
                          className="block p-2 rounded-xl hover:bg-[#151C2C] transition-colors group"
                        >
                          <div className="flex items-center justify-between font-bold text-[#F8FAFC] group-hover:text-[#60A5FA]">
                            <span className="flex items-center gap-1.5">
                              <span className="text-[#64748B] font-mono text-[10px]">├──</span>
                              <span>Operators</span>
                            </span>
                          </div>
                          <div className="ml-5 flex items-center gap-1 mt-1">
                            <span className="text-[9px] font-mono font-semibold px-1.5 py-0.5 rounded bg-[#1A2338] text-[#94A3B8] border border-white/[0.05]">Silver</span>
                            <span className="text-[9px] font-mono font-semibold px-1.5 py-0.5 rounded bg-[#3B82F6]/20 text-[#60A5FA] border border-[#3B82F6]/30">Gold</span>
                            <span className="text-[9px] font-mono font-semibold px-1.5 py-0.5 rounded bg-[#818CF8]/20 text-[#A5B4FC] border border-[#818CF8]/30">Platinum</span>
                          </div>
                        </Link>

                        <Link
                          href="/directory-pricing?category=b2b-providers"
                          className="block p-2 rounded-xl hover:bg-[#151C2C] transition-colors group"
                        >
                          <div className="flex items-center justify-between font-bold text-[#F8FAFC] group-hover:text-[#60A5FA]">
                            <span className="flex items-center gap-1.5">
                              <span className="text-[#64748B] font-mono text-[10px]">├──</span>
                              <span>B2B Providers</span>
                            </span>
                          </div>
                          <div className="ml-5 flex items-center gap-1 mt-1">
                            <span className="text-[9px] font-mono font-semibold px-1.5 py-0.5 rounded bg-[#1A2338] text-[#94A3B8] border border-white/[0.05]">Standard</span>
                            <span className="text-[9px] font-mono font-semibold px-1.5 py-0.5 rounded bg-[#3B82F6]/20 text-[#60A5FA] border border-[#3B82F6]/30">Advanced</span>
                            <span className="text-[9px] font-mono font-semibold px-1.5 py-0.5 rounded bg-[#818CF8]/20 text-[#A5B4FC] border border-[#818CF8]/30">Premium</span>
                          </div>
                        </Link>

                        <Link
                          href="/directory-pricing?category=plus"
                          className="block p-2 rounded-xl hover:bg-[#151C2C] transition-colors group"
                        >
                          <div className="flex items-center justify-between font-bold text-[#F8FAFC] group-hover:text-[#F59E0B]">
                            <span className="flex items-center gap-1.5">
                              <span className="text-[#64748B] font-mono text-[10px]">└──</span>
                              <span className="flex items-center gap-1 text-[#F59E0B]">
                                PLUS
                                <Zap className="h-3 w-3 fill-[#F59E0B]" />
                              </span>
                            </span>
                          </div>
                          <div className="ml-5 mt-1">
                            <span className="text-[9px] font-medium px-2 py-0.5 rounded bg-[#F59E0B]/10 text-[#F59E0B] border border-[#F59E0B]/30 block truncate">
                              Premium Benefits / Exclusive Placement
                            </span>
                          </div>
                        </Link>
                      </div>
                    </div>

                    {/* BRANCH 2: Affiliate Management */}
                    <div className="space-y-1.5 pt-1">
                      <Link
                        href="/affiliate-pricing"
                        className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-[#151C2C] text-[#F8FAFC] font-extrabold hover:text-[#818CF8] hover:bg-[#1A2338] transition-all group"
                      >
                        <span className="text-[#64748B] font-mono text-xs">└──</span>
                        <Users className="h-3.5 w-3.5 text-[#818CF8]" />
                        <span>Affiliate Management</span>
                        <ChevronRight className="h-3.5 w-3.5 ml-auto text-[#64748B] group-hover:translate-x-0.5 transition-transform" />
                      </Link>

                      <div className="ml-4 pl-3 border-l-2 border-[#252A3A] pt-0.5">
                        <Link
                          href="/affiliate-pricing"
                          className="block p-2 rounded-xl hover:bg-[#151C2C] transition-colors group"
                        >
                          <div className="ml-2 flex items-center gap-1">
                            <span className="text-[#64748B] font-mono text-[10px]">└──</span>
                            <span className="text-[9px] font-mono font-semibold px-1.5 py-0.5 rounded bg-[#1A2338] text-[#94A3B8] border border-white/[0.05]">Basic</span>
                            <span className="text-[9px] font-mono font-semibold px-1.5 py-0.5 rounded bg-[#3B82F6]/20 text-[#60A5FA] border border-[#3B82F6]/30">Professional</span>
                            <span className="text-[9px] font-mono font-semibold px-1.5 py-0.5 rounded bg-[#818CF8]/20 text-[#A5B4FC] border border-[#818CF8]/30">Enterprise</span>
                          </div>
                        </Link>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right Desktop Auth & CTA */}
        <div className="hidden items-center gap-3 lg:flex">
          {user ? (
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 rounded-xl p-1.5 transition-colors hover:bg-[#121827] border border-[#252A3A]"
                aria-expanded={userMenuOpen}
                aria-haspopup="true"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#4F46E5] to-[#22C1DC] text-xs font-bold text-white shadow-sm">
                  {user.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt={user.full_name}
                      className="h-8 w-8 rounded-lg object-cover"
                    />
                  ) : (
                    getInitials(user.full_name)
                  )}
                </div>
                <span className="text-xs font-semibold text-[#F8FAFC] max-w-[100px] truncate">
                  {user.full_name.split(" ")[0]}
                </span>
                <ChevronDown
                  className={cn(
                    "h-3.5 w-3.5 text-[#A1A9B8] transition-transform duration-200",
                    userMenuOpen && "rotate-180"
                  )}
                />
              </button>

              <AnimatePresence>
                {userMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.96 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 w-56 overflow-hidden rounded-xl bg-[#0D1220] border border-[#252A3A] p-1.5 shadow-2xl z-50 backdrop-blur-xl"
                  >
                    <div className="border-b border-[#252A3A] px-3 py-2 mb-1">
                      <p className="text-sm font-semibold text-[#F8FAFC] truncate">
                        {user.full_name}
                      </p>
                      <p className="text-xs text-[#A1A9B8] truncate">
                        {user.email}
                      </p>
                    </div>
                    <Link
                      href="/app"
                      className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-[#A1A9B8] transition-colors hover:bg-[#121827] hover:text-[#F8FAFC]"
                    >
                      <User className="h-4 w-4 text-[#818CF8]" />
                      Dashboard
                    </Link>
                    <Link
                      href="/app/settings"
                      className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-[#A1A9B8] transition-colors hover:bg-[#121827] hover:text-[#F8FAFC]"
                    >
                      <Settings className="h-4 w-4 text-[#818CF8]" />
                      Settings
                    </Link>
                    <button
                      onClick={logout}
                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-[#EF4444] transition-colors hover:bg-[#EF4444]/10 cursor-pointer"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <>
              <Link
                href="/login"
                className="px-3.5 py-2 text-xs font-semibold text-[#A1A9B8] transition-colors hover:text-[#F8FAFC]"
              >
                Log In
              </Link>
              <Link
                href="/register"
                className="px-3.5 py-2 text-xs font-semibold text-[#F8FAFC] border border-[#252A3A] hover:border-[#343B52] bg-[#121827] hover:bg-[#171B2B] rounded-lg transition-all"
              >
                Create Account
              </Link>
            </>
          )}

          <Link
            href="/marketplace"
            className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-[#4F46E5] to-[#3B82F6] hover:from-[#4338CA] hover:to-[#2563EB] px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-[#4F46E5]/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <span>Explore Network</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* Mobile Hamburger Button */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="flex items-center justify-center rounded-lg p-2 text-[#A1A9B8] transition-colors hover:bg-[#121827] hover:text-[#F8FAFC] lg:hidden cursor-pointer border border-[#252A3A]"
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden border-t border-[#252A3A] bg-[#080B14]/98 backdrop-blur-2xl lg:hidden"
          >
            <div className="space-y-1.5 px-4 py-5 max-h-[80vh] overflow-y-auto">
              <Link
                href="/marketplace"
                className="block rounded-xl px-4 py-2.5 text-sm font-medium text-[#A1A9B8] hover:bg-[#121827] hover:text-[#F8FAFC]"
              >
                Marketplace
              </Link>
              <Link
                href="/categories"
                className="block rounded-xl px-4 py-2.5 text-sm font-medium text-[#A1A9B8] hover:bg-[#121827] hover:text-[#F8FAFC]"
              >
                Categories
              </Link>

              {/* Mobile News Submenu */}
              <div>
                <button
                  onClick={() => setMobileNewsOpen(!mobileNewsOpen)}
                  className="flex w-full items-center justify-between rounded-xl px-4 py-2.5 text-sm font-medium text-[#A1A9B8] hover:bg-[#121827] hover:text-[#F8FAFC]"
                >
                  <span>News</span>
                  <ChevronDown className={cn("h-4 w-4 transition-transform", mobileNewsOpen && "rotate-180")} />
                </button>
                {mobileNewsOpen && (
                  <div className="ml-4 pl-3 border-l border-[#252A3A] space-y-1 my-1">
                    <Link href="/news" className="block py-1.5 text-xs text-[#F8FAFC] font-semibold">
                      All News
                    </Link>
                    {newsCategories.map((cat) => (
                      <Link key={cat.id} href={`/news?category=${cat.slug}`} className="block py-1 text-xs text-[#94A3B8]">
                        {cat.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Mobile Events Submenu */}
              <div>
                <button
                  onClick={() => setMobileEventsOpen(!mobileEventsOpen)}
                  className="flex w-full items-center justify-between rounded-xl px-4 py-2.5 text-sm font-medium text-[#A1A9B8] hover:bg-[#121827] hover:text-[#F8FAFC]"
                >
                  <span>Events</span>
                  <ChevronDown className={cn("h-4 w-4 transition-transform", mobileEventsOpen && "rotate-180")} />
                </button>
                {mobileEventsOpen && (
                  <div className="ml-4 pl-3 border-l border-[#252A3A] space-y-1 my-1">
                    <Link href="/events" className="block py-1.5 text-xs text-[#F8FAFC] font-semibold">
                      All Events
                    </Link>
                    {eventCategories.map((cat) => (
                      <Link key={cat.id} href={`/events?category=${cat.slug}`} className="block py-1 text-xs text-[#94A3B8]">
                        {cat.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              <Link
                href="/#solutions"
                className="block rounded-xl px-4 py-2.5 text-sm font-medium text-[#A1A9B8] hover:bg-[#121827] hover:text-[#F8FAFC]"
              >
                Solutions
              </Link>
              <Link
                href="/directory-pricing"
                className="block rounded-xl px-4 py-2.5 text-sm font-medium text-[#A1A9B8] hover:bg-[#121827] hover:text-[#F8FAFC]"
              >
                Pricing
              </Link>

              <div className="my-3 border-t border-[#252A3A]" />

              {user ? (
                <>
                  <div className="flex items-center gap-3 px-4 py-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#4F46E5] to-[#22C1DC] text-xs font-bold text-white">
                      {user.avatar_url ? (
                        <img
                          src={user.avatar_url}
                          alt={user.full_name}
                          className="h-9 w-9 rounded-xl object-cover"
                        />
                      ) : (
                        getInitials(user.full_name)
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#F8FAFC]">
                        {user.full_name}
                      </p>
                      <p className="text-xs text-[#A1A9B8]">
                        {user.email}
                      </p>
                    </div>
                  </div>
                  <Link
                    href="/app"
                    className="block rounded-xl px-4 py-2.5 text-sm text-[#A1A9B8] hover:bg-[#121827] hover:text-[#F8FAFC]"
                  >
                    Dashboard
                  </Link>
                  <button
                    onClick={logout}
                    className="flex w-full items-center gap-2 rounded-xl px-4 py-2.5 text-sm text-[#EF4444] hover:bg-[#EF4444]/10 cursor-pointer"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </button>
                </>
              ) : (
                <div className="flex flex-col gap-2.5 pt-2">
                  <div className="grid grid-cols-2 gap-2">
                    <Link
                      href="/login"
                      className="rounded-xl border border-[#252A3A] px-4 py-2.5 text-center text-xs font-semibold text-[#F8FAFC] bg-[#121827] transition-colors hover:bg-[#171B2B]"
                    >
                      Log In
                    </Link>
                    <Link
                      href="/register"
                      className="rounded-xl border border-[#252A3A] px-4 py-2.5 text-center text-xs font-semibold text-[#F8FAFC] bg-[#121827] transition-colors hover:bg-[#171B2B]"
                    >
                      Create Account
                    </Link>
                  </div>
                  <Link
                    href="/marketplace"
                    className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#3B82F6] px-4 py-3 text-center text-sm font-semibold text-white shadow-lg shadow-[#4F46E5]/25"
                  >
                    <span>Explore Network</span>
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
