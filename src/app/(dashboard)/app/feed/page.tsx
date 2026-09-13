"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Sparkles,
  Image as ImageIcon,
  Calendar as CalendarIcon,
  Plus,
  Loader2,
  Building2,
  Clock,
  MapPin,
  RefreshCw,
  Newspaper,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { getInitials } from "@/lib/utils";
import FeedCard, { FeedPost } from "@/components/feed/feed-card";
import CreatePostModal from "@/components/feed/create-post-modal";

interface UpcomingEvent {
  id: string;
  title: string;
  slug: string;
  start_date: string;
  location?: string;
  city?: string;
  country?: string;
  featured_image?: string;
}

interface SuggestedCompany {
  id: string;
  name: string;
  slug: string;
  logo_url?: string;
  headquarters?: string;
  is_verified?: number;
}

export default function IndustryFeedPage() {
  const { user } = useAuth();

  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalInitialType, setModalInitialType] = useState<"text" | "image" | "event">("text");

  // Sidebar widgets state
  const [upcomingEvents, setUpcomingEvents] = useState<UpcomingEvent[]>([]);
  const [suggestedCompanies, setSuggestedCompanies] = useState<SuggestedCompany[]>([]);

  const fetchFeed = useCallback(async (pageNum = 1, append = false) => {
    try {
      if (pageNum === 1 && !append) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const res = await fetch(`/api/feed?page=${pageNum}&limit=20`);
      if (res.ok) {
        const data = await res.json();
        const newPosts: FeedPost[] = data.posts || [];
        setHasMore(data.pagination?.hasMore || false);

        if (append) {
          setPosts((prev) => [...prev, ...newPosts]);
        } else {
          setPosts(newPosts);
        }
      }
    } catch (err) {
      console.error("Error fetching feed:", err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchFeed(1);

    // Fetch sidebar widgets
    async function fetchSidebarData() {
      try {
        const [eventsRes, compRes] = await Promise.all([
          fetch("/api/events?filter=upcoming&limit=4"),
          fetch("/api/companies?limit=4"),
        ]);

        if (eventsRes.ok) {
          const evtData = await eventsRes.json();
          setUpcomingEvents(evtData.events || []);
        }

        if (compRes.ok) {
          const compData = await compRes.json();
          setSuggestedCompanies(compData.companies || []);
        }
      } catch (err) {
        console.error("Error fetching sidebar data:", err);
      }
    }

    fetchSidebarData();
  }, [fetchFeed]);

  function handleRefresh() {
    setRefreshing(true);
    setPage(1);
    fetchFeed(1, false);
  }

  function handleLoadMore() {
    if (loadingMore || !hasMore) return;
    const nextPage = page + 1;
    setPage(nextPage);
    fetchFeed(nextPage, true);
  }

  function handlePostCreated(newPost: FeedPost) {
    setPosts((prev) => [newPost, ...prev]);
  }

  function handlePostUpdated(updatedPost: FeedPost) {
    setPosts((prev) => prev.map((p) => (p.id === updatedPost.id ? updatedPost : p)));
  }

  function handlePostDeleted(postId: string) {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  }

  function openCreateModal(type: "text" | "image" | "event" = "text") {
    setModalInitialType(type);
    setIsModalOpen(true);
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full">
      {/* Header Title Section */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#2563EB]/20 border border-[#2563EB]/40 text-[#2563EB]">
              <Newspaper className="h-4.5 w-4.5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-[#F8FAFC] tracking-tight">
              Industry Feed
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-[#94A3B8] mt-1">
            Global professional network activity & updates across the iGaming ecosystem
          </p>
        </div>

        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="p-2 text-[#94A3B8] hover:text-[#F8FAFC] bg-[#0D1320] border border-[#1F2937] hover:border-[#2563EB] rounded-xl transition-all flex items-center gap-2 text-xs font-bold shadow-sm"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-[#2563EB]" : ""}`} />
          <span className="hidden sm:inline">Refresh Feed</span>
        </button>
      </div>

      {/* Layout Grid: Feed Column + Right Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Main Feed Column */}
        <div className="lg:col-span-8 space-y-6">
          {/* Create Post Trigger Card */}
          <div className="rounded-2xl bg-[#0D1320] border border-[#1F2937] p-4 shadow-lg space-y-3">
            <div className="flex items-center gap-3">
              <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#2563EB] text-sm font-bold text-white">
                {user?.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={user.full_name}
                    className="h-10 w-10 rounded-xl object-cover"
                  />
                ) : (
                  getInitials(user?.full_name || "User")
                )}
              </div>

              <button
                type="button"
                onClick={() => openCreateModal("text")}
                className="flex-1 text-left px-4 py-2.5 bg-[#111827] hover:bg-[#1F2937] border border-[#1F2937] rounded-xl text-xs sm:text-sm text-[#94A3B8] transition-colors"
              >
                What’s happening in the iGaming industry?
              </button>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-[#1F2937]/80 text-xs font-semibold text-[#94A3B8]">
              <button
                type="button"
                onClick={() => openCreateModal("image")}
                className="flex items-center gap-2 py-1.5 px-3 rounded-xl hover:bg-[#111827] hover:text-[#2563EB] transition-colors"
              >
                <ImageIcon className="w-4 h-4 text-[#2563EB]" />
                <span>Photo</span>
              </button>

              <button
                type="button"
                onClick={() => openCreateModal("event")}
                className="flex items-center gap-2 py-1.5 px-3 rounded-xl hover:bg-[#111827] hover:text-[#60A5FA] transition-colors"
              >
                <CalendarIcon className="w-4 h-4 text-[#60A5FA]" />
                <span>Event</span>
              </button>

              <button
                type="button"
                onClick={() => openCreateModal("text")}
                className="inline-flex items-center gap-1.5 py-1.5 px-4 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold shadow-md transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Post</span>
              </button>
            </div>
          </div>

          {/* Feed Posts List */}
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="rounded-2xl bg-[#0D1320] border border-[#1F2937] p-5 space-y-4 animate-pulse"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#111827]" />
                    <div className="space-y-2 flex-1">
                      <div className="h-3 bg-[#111827] rounded w-1/3" />
                      <div className="h-2.5 bg-[#111827] rounded w-1/4" />
                    </div>
                  </div>
                  <div className="h-16 bg-[#111827] rounded-xl" />
                </div>
              ))}
            </div>
          ) : posts.length === 0 ? (
            /* Empty Feed State */
            <div className="rounded-2xl bg-[#0D1320] border border-[#1F2937] p-10 text-center space-y-4 shadow-lg">
              <div className="mx-auto w-16 h-16 rounded-2xl bg-[#2563EB]/10 border border-[#2563EB]/30 flex items-center justify-center text-[#2563EB]">
                <Sparkles className="w-8 h-8" />
              </div>

              <div className="space-y-1">
                <h3 className="text-lg font-bold text-[#F8FAFC]">
                  Your iGaming community starts here
                </h3>
                <p className="text-xs text-[#94A3B8] max-w-md mx-auto">
                  Share industry updates, company news and events with the global iGaming Connect network.
                </p>
              </div>

              <button
                type="button"
                onClick={() => openCreateModal("text")}
                className="px-6 py-2.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold transition-all shadow-lg inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Create First Post</span>
              </button>
            </div>
          ) : (
            <div className="space-y-5">
              {posts.map((post) => (
                <FeedCard
                  key={post.id}
                  post={post}
                  onPostUpdated={handlePostUpdated}
                  onPostDeleted={handlePostDeleted}
                />
              ))}

              {/* Pagination / Load More */}
              {hasMore && (
                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                    className="px-6 py-2.5 rounded-xl bg-[#0D1320] hover:bg-[#111827] border border-[#1F2937] text-xs font-bold text-[#F8FAFC] transition-all shadow-sm inline-flex items-center gap-2"
                  >
                    {loadingMore && <Loader2 className="w-3.5 h-3.5 animate-spin text-[#2563EB]" />}
                    <span>Load More Updates</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Sidebar Widgets */}
        <div className="lg:col-span-4 space-y-6">
          {/* User Card */}
          {user && (
            <div className="rounded-2xl bg-[#0D1320] border border-[#1F2937] p-4 shadow-lg space-y-3">
              <div className="flex items-center gap-3">
                <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#2563EB] text-sm font-bold text-white shadow-md">
                  {user.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt={user.full_name}
                      className="h-12 w-12 rounded-xl object-cover"
                    />
                  ) : (
                    getInitials(user.full_name)
                  )}
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-[#F8FAFC] truncate">
                    {user.full_name}
                  </h3>
                  <p className="text-xs text-[#94A3B8] truncate">{user.email}</p>
                  <span className="inline-block mt-1 px-2 py-0.5 rounded-md bg-[#2563EB]/15 text-[#60A5FA] text-[10px] font-extrabold border border-[#2563EB]/30">
                    {user.role || "Professional"}
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-[#1F2937] flex items-center justify-between text-xs text-[#94A3B8]">
                <span>Feed Visibility</span>
                <span className="text-[#F8FAFC] font-bold">Global / All Members</span>
              </div>
            </div>
          )}

          {/* Upcoming Events Widget (Real Data) */}
          {upcomingEvents.length > 0 && (
            <div className="rounded-2xl bg-[#0D1320] border border-[#1F2937] p-4 shadow-lg space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4 text-[#2563EB]" />
                  <h3 className="text-xs font-bold text-[#F8FAFC] uppercase tracking-wider">
                    Upcoming Events
                  </h3>
                </div>
                <Link
                  href="/events"
                  className="text-[11px] font-semibold text-[#2563EB] hover:underline"
                >
                  View All
                </Link>
              </div>

              <div className="space-y-2.5">
                {upcomingEvents.map((evt) => (
                  <Link
                    key={evt.id}
                    href={`/events/${evt.slug || evt.id}`}
                    className="block p-2.5 rounded-xl bg-[#111827] hover:bg-[#1F2937] border border-[#1F2937] transition-all group"
                  >
                    <p className="text-xs font-bold text-[#F8FAFC] group-hover:text-[#2563EB] transition-colors leading-snug line-clamp-1">
                      {evt.title}
                    </p>
                    <div className="flex items-center gap-2 text-[11px] text-[#94A3B8] mt-1">
                      <span className="flex items-center gap-1 font-medium">
                        <Clock className="w-3 h-3 text-[#2563EB]" />
                        {evt.start_date}
                      </span>
                      {evt.city || evt.country ? (
                        <span className="flex items-center gap-1 truncate">
                          <MapPin className="w-3 h-3 text-[#60A5FA]" />
                          {evt.city ? `${evt.city}, ` : ""}
                          {evt.country}
                        </span>
                      ) : null}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Suggested Companies Widget (Real Data) */}
          {suggestedCompanies.length > 0 && (
            <div className="rounded-2xl bg-[#0D1320] border border-[#1F2937] p-4 shadow-lg space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-[#2563EB]" />
                  <h3 className="text-xs font-bold text-[#F8FAFC] uppercase tracking-wider">
                    Featured Companies
                  </h3>
                </div>
                <Link
                  href="/app/marketplace"
                  className="text-[11px] font-semibold text-[#2563EB] hover:underline"
                >
                  Marketplace
                </Link>
              </div>

              <div className="space-y-2.5">
                {suggestedCompanies.map((comp) => (
                  <Link
                    key={comp.id}
                    href={`/app/company/${comp.id || comp.slug}`}
                    className="flex items-center gap-3 p-2 rounded-xl bg-[#111827] hover:bg-[#1F2937] border border-[#1F2937] transition-all group"
                  >
                    {comp.logo_url ? (
                      <img
                        src={comp.logo_url}
                        alt={comp.name}
                        className="w-9 h-9 rounded-lg object-cover bg-[#070B14] shrink-0"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-lg bg-[#2563EB] flex items-center justify-center text-white text-xs font-bold shrink-0">
                        {getInitials(comp.name)}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-[#F8FAFC] group-hover:text-[#2563EB] transition-colors truncate">
                        {comp.name}
                      </p>
                      <p className="text-[11px] text-[#94A3B8] truncate">
                        {comp.headquarters || "iGaming Partner"}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Post Modal */}
      <CreatePostModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onPostCreated={handlePostCreated}
        initialType={modalInitialType}
      />
    </div>
  );
}
