"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Calendar as CalendarIcon,
  ChevronRight,
  Clock,
  ArrowLeft,
  MapPin,
  Globe,
  ExternalLink,
  Sparkles,
  Award,
} from "lucide-react";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import { Skeleton } from "@/components/ui/skeleton";

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
}

export default function EventDetailPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [event, setEvent] = useState<EventItem | null>(null);
  const [related, setRelated] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchEvent() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`/api/events/${slug}`);
        if (!res.ok) throw new Error("Event not found");
        const data = await res.json();
        setEvent(data.event);
        setRelated(data.related || []);
      } catch (err) {
        console.error(err);
        setError("Event details not found or unavailable.");
      } finally {
        setLoading(false);
      }
    }
    if (slug) fetchEvent();
  }, [slug]);

  return (
    <div className="min-h-screen bg-[#080B14] text-[#F8FAFC] flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 pt-24 pb-20 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        {loading ? (
          <div className="space-y-6 pt-8">
            <Skeleton className="h-10 w-3/4 bg-[#151C2C] rounded-xl" />
            <Skeleton className="h-96 w-full bg-[#151C2C] rounded-3xl" />
            <Skeleton className="h-40 w-full bg-[#151C2C] rounded-2xl" />
          </div>
        ) : error || !event ? (
          <div className="text-center py-20 bg-[#0D1220] rounded-3xl border border-[#252A3A] space-y-4 my-10">
            <CalendarIcon className="h-12 w-12 text-[#EF4444] mx-auto opacity-80" />
            <h2 className="text-xl font-bold text-white">Event Not Found</h2>
            <p className="text-xs text-[#94A3B8]">{error}</p>
            <Link
              href="/events"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#4F46E5] text-xs font-bold text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Events
            </Link>
          </div>
        ) : (
          <article className="space-y-8">
            {/* Breadcrumb & Back button */}
            <div className="flex items-center justify-between">
              <nav className="flex items-center gap-2 text-xs font-semibold text-[#94A3B8]">
                <Link href="/" className="hover:text-[#F8FAFC] transition-colors">
                  Home
                </Link>
                <ChevronRight className="h-3.5 w-3.5 text-[#64748B]" />
                <Link href="/events" className="hover:text-[#F8FAFC] transition-colors">
                  Events
                </Link>
                <ChevronRight className="h-3.5 w-3.5 text-[#64748B]" />
                <span className="text-[#60A5FA] truncate max-w-[200px]">{event.title}</span>
              </nav>

              <Link
                href="/events"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#A1A9B8] hover:text-white transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Events</span>
              </Link>
            </div>

            {/* Event Header */}
            <header className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 rounded-full bg-[#4F46E5]/20 border border-[#4F46E5]/40 text-xs font-bold text-[#818CF8]">
                  {event.event_type || "Event"}
                </span>
                {event.category_name && (
                  <span className="text-xs font-semibold text-[#94A3B8]">
                    {event.category_name}
                  </span>
                )}
              </div>

              <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
                {event.title}
              </h1>

              {/* Date & Location Highlight Card */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-5 rounded-2xl bg-[#0D1220] border border-[#252A3A]">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-[#4F46E5]/15 text-[#60A5FA]">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-[11px] text-[#94A3B8] font-bold uppercase block">Date & Time</span>
                    <span className="text-xs font-extrabold text-white">
                      {event.start_date}
                      {event.end_date && event.end_date !== event.start_date ? ` – ${event.end_date}` : ""}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-[#818CF8]/15 text-[#818CF8]">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-[11px] text-[#94A3B8] font-bold uppercase block">Location</span>
                    <span className="text-xs font-extrabold text-white">
                      {event.location ? `${event.location}, ` : ""}
                      {event.city ? `${event.city}, ` : ""}
                      {event.country}
                    </span>
                  </div>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                {event.registration_url && (
                  <a
                    href={event.registration_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-[#4F46E5] to-[#3B82F6] text-xs font-extrabold text-white shadow-lg shadow-[#4F46E5]/30 hover:scale-105 transition-all"
                  >
                    <span>Register / RSVP Now</span>
                    <ExternalLink className="h-4 w-4" />
                  </a>
                )}

                {event.website_url && (
                  <a
                    href={event.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-white/[0.06] border border-white/[0.1] text-xs font-extrabold text-white hover:bg-white/[0.12] transition-all"
                  >
                    <Globe className="h-4 w-4 text-[#60A5FA]" />
                    <span>Official Event Website</span>
                  </a>
                )}
              </div>
            </header>

            {/* Event Banner */}
            <div className="relative aspect-[16/9] w-full overflow-hidden rounded-3xl bg-[#0D1220] border border-[#252A3A] shadow-2xl">
              <img
                src={event.featured_image}
                alt={event.title}
                className="h-full w-full object-cover"
              />
            </div>

            {/* Event Description */}
            <div className="space-y-4 border-b border-[#252A3A] pb-12">
              <h3 className="text-xl font-extrabold text-white">About the Event</h3>
              <p className="text-sm sm:text-base text-[#D1D5DB] leading-relaxed whitespace-pre-line">
                {event.description}
              </p>
            </div>

            {/* RELATED EVENTS */}
            {related.length > 0 && (
              <section className="pt-8 space-y-6">
                <h3 className="text-xl font-black text-white flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-[#60A5FA]" />
                  Other Upcoming Events
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {related.map((item) => (
                    <Link
                      key={item.id}
                      href={`/events/${item.slug}`}
                      className="group flex flex-col rounded-2xl bg-[#0D1220] border border-[#252A3A] p-4 hover:border-[#4F46E5]/40 transition-all space-y-2"
                    >
                      <div className="aspect-[16/10] w-full overflow-hidden rounded-xl bg-[#151C2C]">
                        <img
                          src={item.featured_image}
                          alt={item.title}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      </div>
                      <h4 className="text-xs font-bold text-white line-clamp-2 group-hover:text-[#60A5FA] transition-colors leading-snug">
                        {item.title}
                      </h4>
                      <p className="text-[11px] text-[#94A3B8]">
                        {item.start_date} • {item.country}
                      </p>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </article>
        )}
      </main>

      <Footer />
    </div>
  );
}
