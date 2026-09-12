"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Calendar as CalendarIcon,
  Search,
  Sparkles,
  ChevronRight,
  MapPin,
  Clock,
  ExternalLink,
  Globe,
  Tag,
  ArrowRight,
} from "lucide-react";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

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
  category_slug?: string;
  event_type?: string;
  start_date: string;
  end_date?: string;
  location?: string;
  city?: string;
  country?: string;
  website_url?: string;
  registration_url?: string;
  is_featured?: number;
}

function EventsListingContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [categories, setCategories] = useState<EventCategory[]>([]);
  const [eventsList, setEventsList] = useState<EventItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>(searchParams.get("category") || "");
  const [filterTime, setFilterTime] = useState<"upcoming" | "all" | "past">("upcoming");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await fetch("/api/events/categories");
        if (res.ok) {
          const data = await res.json();
          setCategories(data.categories || []);
        }
      } catch (err) {
        console.error(err);
      }
    }
    fetchCategories();
  }, []);

  useEffect(() => {
    async function fetchEvents() {
      try {
        setLoading(true);
        const categoryQuery = searchParams.get("category") || "";
        setSelectedCategory(categoryQuery);

        let url = `/api/events?limit=40`;
        if (categoryQuery) url += `&category=${categoryQuery}`;
        if (search) url += `&search=${encodeURIComponent(search)}`;
        if (filterTime !== "all") url += `&filter=${filterTime}`;

        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          setEventsList(data.events || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchEvents();
  }, [searchParams, search, filterTime]);

  const handleCategoryTab = (slug: string) => {
    setSelectedCategory(slug);
    if (slug) {
      router.push(`/events?category=${slug}`);
    } else {
      router.push(`/events`);
    }
  };

  const featuredEvent = eventsList.find((e) => e.is_featured === 1) || eventsList[0];
  const regularEvents = eventsList.filter((e) => e.id !== featuredEvent?.id);

  return (
    <div className="min-h-screen bg-[#080B14] text-[#F8FAFC] flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 pt-24 pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        {/* HERO SECTION */}
        <section className="py-8 text-center space-y-4 max-w-3xl mx-auto">
          <nav className="flex items-center justify-center gap-2 text-xs font-semibold text-[#94A3B8] mb-4">
            <Link href="/" className="hover:text-[#F8FAFC] transition-colors">
              Home
            </Link>
            <ChevronRight className="h-3.5 w-3.5 text-[#64748B]" />
            <span className="text-[#60A5FA]">Global iGaming Events</span>
          </nav>

          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#4F6BFF]/10 border border-[#4F46E5]/20 text-xs font-bold text-[#60A5FA]">
            <CalendarIcon className="h-3.5 w-3.5" />
            Global Industry Expos, Summits & Awards
          </div>

          <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight">
            iGaming <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#60A5FA] to-[#818CF8]">Events & Expos</span>
          </h1>

          <p className="text-base text-[#94A3B8] leading-relaxed">
            Discover upcoming B2B conferences, global trade shows, executive networking lounges, and industry awards worldwide.
          </p>

          {/* TIME FILTER TABS & SEARCH */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-1 bg-[#0D1220] p-1.5 rounded-full border border-[#252A3A]">
              <button
                onClick={() => setFilterTime("upcoming")}
                className={cn(
                  "rounded-full px-4 py-1.5 text-xs font-extrabold transition-all cursor-pointer",
                  filterTime === "upcoming"
                    ? "bg-[#4F46E5] text-white shadow-md"
                    : "text-[#94A3B8] hover:text-white"
                )}
              >
                Upcoming Events
              </button>
              <button
                onClick={() => setFilterTime("all")}
                className={cn(
                  "rounded-full px-4 py-1.5 text-xs font-extrabold transition-all cursor-pointer",
                  filterTime === "all"
                    ? "bg-[#4F46E5] text-white shadow-md"
                    : "text-[#94A3B8] hover:text-white"
                )}
              >
                All Events
              </button>
              <button
                onClick={() => setFilterTime("past")}
                className={cn(
                  "rounded-full px-4 py-1.5 text-xs font-extrabold transition-all cursor-pointer",
                  filterTime === "past"
                    ? "bg-[#4F46E5] text-white shadow-md"
                    : "text-[#94A3B8] hover:text-white"
                )}
              >
                Past Events
              </button>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#64748B]" />
              <input
                type="text"
                placeholder="Search event name or city..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-2xl bg-[#0D1220] border border-[#252A3A] pl-10 pr-4 py-2.5 text-xs text-[#F8FAFC] placeholder-[#64748B] focus:outline-none focus:border-[#4F46E5]"
              />
            </div>
          </div>
        </section>

        {/* CATEGORIES HORIZONTAL TABS */}
        <div className="my-8 flex justify-center overflow-x-auto py-2">
          <div className="inline-flex items-center gap-2 bg-[#0D1220]/90 p-2 rounded-full border border-[#252A3A]/80 shadow-2xl">
            <button
              onClick={() => handleCategoryTab("")}
              className={cn(
                "rounded-full px-5 py-2 text-xs font-bold transition-all cursor-pointer",
                selectedCategory === ""
                  ? "bg-[#4F46E5] text-white shadow-lg shadow-[#4F46E5]/25"
                  : "text-[#94A3B8] hover:text-white hover:bg-white/[0.05]"
              )}
            >
              All Categories
            </button>

            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleCategoryTab(cat.slug)}
                className={cn(
                  "rounded-full px-5 py-2 text-xs font-bold transition-all cursor-pointer whitespace-nowrap",
                  selectedCategory === cat.slug
                    ? "bg-[#4F46E5] text-white shadow-lg shadow-[#4F46E5]/25"
                    : "text-[#94A3B8] hover:text-white hover:bg-white/[0.05]"
                )}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* CONTENT */}
        {loading ? (
          <div className="space-y-6">
            <Skeleton className="h-96 w-full rounded-3xl bg-[#151C2C]" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-72 w-full rounded-3xl bg-[#151C2C]" />
              ))}
            </div>
          </div>
        ) : eventsList.length === 0 ? (
          <div className="text-center py-20 bg-[#0D1220] rounded-3xl border border-[#252A3A] space-y-3 my-8">
            <CalendarIcon className="h-10 w-10 text-[#60A5FA] mx-auto opacity-70" />
            <h3 className="text-lg font-bold text-white">No Events Found</h3>
            <p className="text-xs text-[#94A3B8]">
              Try searching with another keyword or switching event filters.
            </p>
          </div>
        ) : (
          <div className="space-y-12">
            {/* FEATURED EVENT BANNER */}
            {featuredEvent && !search && !selectedCategory && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Link
                  href={`/events/${featuredEvent.slug}`}
                  className="group relative flex flex-col lg:flex-row overflow-hidden rounded-3xl bg-[#0D1220] border border-[#252A3A] shadow-2xl hover:border-[#4F46E5]/50 transition-all"
                >
                  <div className="lg:w-7/12 aspect-[16/9] lg:aspect-auto relative overflow-hidden bg-[#151C2C]">
                    <img
                      src={featuredEvent.featured_image}
                      alt={featuredEvent.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute top-4 left-4">
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#F59E0B] text-[#080B14] text-[11px] font-black uppercase tracking-wider shadow-lg">
                        <Sparkles className="h-3 w-3" />
                        Featured Event
                      </span>
                    </div>
                  </div>

                  <div className="lg:w-5/12 p-8 sm:p-10 flex flex-col justify-between space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 rounded-full bg-[#4F46E5]/20 text-[#818CF8] text-xs font-bold border border-[#4F46E5]/40">
                          {featuredEvent.event_type || "Event"}
                        </span>
                        <span className="text-xs text-[#94A3B8] font-bold">
                          {featuredEvent.category_name}
                        </span>
                      </div>

                      <h2 className="text-2xl sm:text-3xl font-black text-white group-hover:text-[#60A5FA] transition-colors leading-tight">
                        {featuredEvent.title}
                      </h2>

                      <p className="text-sm text-[#94A3B8] line-clamp-3 leading-relaxed">
                        {featuredEvent.description}
                      </p>

                      <div className="space-y-2 text-xs text-[#F8FAFC]">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-[#60A5FA]" />
                          <span className="font-bold">
                            {featuredEvent.start_date}
                            {featuredEvent.end_date && featuredEvent.end_date !== featuredEvent.start_date
                              ? ` – ${featuredEvent.end_date}`
                              : ""}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-[#818CF8]" />
                          <span className="font-medium">
                            {featuredEvent.location ? `${featuredEvent.location}, ` : ""}
                            {featuredEvent.city ? `${featuredEvent.city}, ` : ""}
                            {featuredEvent.country}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-white/[0.08] flex items-center justify-between">
                      <span className="inline-flex items-center gap-1 text-xs text-[#60A5FA] font-extrabold group-hover:translate-x-1 transition-transform">
                        <span>View Event Details</span>
                        <ArrowRight className="h-4 w-4" />
                      </span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            )}

            {/* EVENTS GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {regularEvents.map((evt, idx) => (
                <motion.div
                  key={evt.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: idx * 0.05 }}
                >
                  <Link
                    href={`/events/${evt.slug}`}
                    className="group flex flex-col justify-between rounded-3xl bg-[#0D1220] border border-[#252A3A] p-5 shadow-xl hover:border-[#4F46E5]/40 hover:bg-[#121827] transition-all h-full"
                  >
                    <div className="space-y-4">
                      <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl bg-[#151C2C]">
                        <img
                          src={evt.featured_image}
                          alt={evt.title}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        <span className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-[#080B14]/80 backdrop-blur-md text-[10px] font-bold text-[#60A5FA] uppercase tracking-wider border border-white/[0.1]">
                          {evt.event_type || "Event"}
                        </span>
                      </div>

                      <div className="space-y-2">
                        <h3 className="text-lg font-bold text-white line-clamp-2 group-hover:text-[#60A5FA] transition-colors leading-snug">
                          {evt.title}
                        </h3>

                        <div className="space-y-1 text-xs text-[#94A3B8] pt-1">
                          <div className="flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5 text-[#60A5FA]" />
                            <span className="font-semibold text-[#F8FAFC]">{evt.start_date}</span>
                          </div>
                          <div className="flex items-center gap-1.5 truncate">
                            <MapPin className="h-3.5 w-3.5 text-[#818CF8]" />
                            <span className="truncate">
                              {evt.city ? `${evt.city}, ` : ""}
                              {evt.country}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 mt-4 border-t border-white/[0.06] text-[11px] font-semibold text-[#94A3B8]">
                      <span>{evt.category_name || "Event"}</span>
                      <span className="text-[#60A5FA] font-bold group-hover:translate-x-1 transition-transform flex items-center gap-1">
                        <span>Details</span>
                        <ChevronRight className="h-3 w-3" />
                      </span>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

export default function EventsListingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#080B14]" />}>
      <EventsListingContent />
    </Suspense>
  );
}
