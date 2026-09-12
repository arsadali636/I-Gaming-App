"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Newspaper,
  Search,
  Sparkles,
  ChevronRight,
  Clock,
  ArrowRight,
  Filter,
  RefreshCw,
} from "lucide-react";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

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
  content: string;
  featured_image: string;
  category_name?: string;
  category_slug?: string;
  published_at?: string;
  is_featured?: number;
}

function NewsListingContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [categories, setCategories] = useState<NewsCategory[]>([]);
  const [newsList, setNewsList] = useState<NewsItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>(searchParams.get("category") || "");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await fetch("/api/news/categories");
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
    async function fetchNews() {
      try {
        setLoading(true);
        const categoryQuery = searchParams.get("category") || "";
        setSelectedCategory(categoryQuery);

        let url = `/api/news?limit=30`;
        if (categoryQuery) url += `&category=${categoryQuery}`;
        if (search) url += `&search=${encodeURIComponent(search)}`;

        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          setNewsList(data.news || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchNews();
  }, [searchParams, search]);

  const handleCategoryTab = (slug: string) => {
    setSelectedCategory(slug);
    if (slug) {
      router.push(`/news?category=${slug}`);
    } else {
      router.push(`/news`);
    }
  };

  const featuredArticle = newsList.find((n) => n.is_featured === 1) || newsList[0];
  const regularArticles = newsList.filter((n) => n.id !== featuredArticle?.id);

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
            <span className="text-[#60A5FA]">News & Insights</span>
          </nav>

          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#4F6BFF]/10 border border-[#4F6BFF]/20 text-xs font-bold text-[#60A5FA]">
            <Newspaper className="h-3.5 w-3.5" />
            Global B2B iGaming News Hub
          </div>

          <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight">
            Industry <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#60A5FA] to-[#818CF8]">News & Insights</span>
          </h1>

          <p className="text-base text-[#94A3B8] leading-relaxed">
            Stay updated with the latest market trends, regulatory updates, affiliate strategies, and operator breakthroughs across 50+ jurisdictions.
          </p>

          {/* SEARCH & FILTERS */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3 max-w-xl mx-auto">
            <div className="relative w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#64748B]" />
              <input
                type="text"
                placeholder="Search headlines, topics, regulatory updates..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-2xl bg-[#0D1220] border border-[#252A3A] pl-10 pr-4 py-3 text-xs text-[#F8FAFC] placeholder-[#64748B] focus:outline-none focus:border-[#4F46E5] shadow-xl"
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
              All News
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
        ) : newsList.length === 0 ? (
          <div className="text-center py-20 bg-[#0D1220] rounded-3xl border border-[#252A3A] space-y-3 my-8">
            <Newspaper className="h-10 w-10 text-[#60A5FA] mx-auto opacity-70" />
            <h3 className="text-lg font-bold text-white">No News Articles Found</h3>
            <p className="text-xs text-[#94A3B8]">
              Try searching with another keyword or selecting a different category.
            </p>
          </div>
        ) : (
          <div className="space-y-12">
            {/* FEATURED BANNER ARTICLE */}
            {featuredArticle && !search && !selectedCategory && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Link
                  href={`/news/${featuredArticle.slug}`}
                  className="group relative flex flex-col lg:flex-row overflow-hidden rounded-3xl bg-[#0D1220] border border-[#252A3A] shadow-2xl hover:border-[#4F46E5]/50 transition-all"
                >
                  <div className="lg:w-7/12 aspect-[16/9] lg:aspect-auto relative overflow-hidden bg-[#151C2C]">
                    <img
                      src={featuredArticle.featured_image}
                      alt={featuredArticle.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute top-4 left-4">
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#F59E0B] text-[#080B14] text-[11px] font-black uppercase tracking-wider shadow-lg">
                        <Sparkles className="h-3 w-3" />
                        Featured Article
                      </span>
                    </div>
                  </div>

                  <div className="lg:w-5/12 p-8 sm:p-10 flex flex-col justify-between space-y-6">
                    <div className="space-y-3">
                      <span className="text-xs font-extrabold text-[#60A5FA] uppercase tracking-wider">
                        {featuredArticle.category_name || "Headline"}
                      </span>
                      <h2 className="text-2xl sm:text-3xl font-black text-white group-hover:text-[#60A5FA] transition-colors leading-tight">
                        {featuredArticle.title}
                      </h2>
                      <p className="text-sm text-[#94A3B8] line-clamp-3 leading-relaxed">
                        {featuredArticle.short_description}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-white/[0.08] text-xs font-semibold text-[#94A3B8]">
                      <span className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-[#60A5FA]" />
                        {featuredArticle.published_at
                          ? new Date(featuredArticle.published_at).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })
                          : "Recently"}
                      </span>

                      <span className="inline-flex items-center gap-1 text-[#60A5FA] font-bold group-hover:translate-x-1 transition-transform">
                        <span>Read Full Story</span>
                        <ArrowRight className="h-4 w-4" />
                      </span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            )}

            {/* ARTICLES GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {regularArticles.map((item, idx) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: idx * 0.05 }}
                >
                  <Link
                    href={`/news/${item.slug}`}
                    className="group flex flex-col justify-between rounded-3xl bg-[#0D1220] border border-[#252A3A] p-5 shadow-xl hover:border-[#4F46E5]/40 hover:bg-[#121827] transition-all h-full"
                  >
                    <div className="space-y-4">
                      <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl bg-[#151C2C]">
                        <img
                          src={item.featured_image}
                          alt={item.title}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        <span className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-[#080B14]/80 backdrop-blur-md text-[10px] font-bold text-[#60A5FA] uppercase tracking-wider border border-white/[0.1]">
                          {item.category_name || "News"}
                        </span>
                      </div>

                      <div className="space-y-2">
                        <h3 className="text-lg font-bold text-white line-clamp-2 group-hover:text-[#60A5FA] transition-colors leading-snug">
                          {item.title}
                        </h3>
                        <p className="text-xs text-[#94A3B8] line-clamp-2 leading-relaxed">
                          {item.short_description}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 mt-4 border-t border-white/[0.06] text-[11px] font-semibold text-[#94A3B8]">
                      <span>
                        {item.published_at
                          ? new Date(item.published_at).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })
                          : "Recent"}
                      </span>
                      <span className="text-[#60A5FA] font-bold group-hover:translate-x-1 transition-transform flex items-center gap-1">
                        <span>Read</span>
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

export default function NewsListingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#080B14]" />}>
      <NewsListingContent />
    </Suspense>
  );
}
