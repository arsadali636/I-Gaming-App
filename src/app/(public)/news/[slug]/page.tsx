"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  Newspaper,
  ChevronRight,
  Clock,
  ArrowLeft,
  Share2,
  Bookmark,
  Sparkles,
} from "lucide-react";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import { Skeleton } from "@/components/ui/skeleton";

interface NewsArticle {
  id: string;
  title: string;
  slug: string;
  short_description: string;
  content: string;
  featured_image: string;
  category_name?: string;
  category_slug?: string;
  published_at?: string;
}

export default function NewsDetailPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [article, setArticle] = useState<NewsArticle | null>(null);
  const [related, setRelated] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchArticle() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`/api/news/${slug}`);
        if (!res.ok) throw new Error("Article not found");
        const data = await res.json();
        setArticle(data.article);
        setRelated(data.related || []);
      } catch (err) {
        console.error(err);
        setError("News article not found or unavailable.");
      } finally {
        setLoading(false);
      }
    }
    if (slug) fetchArticle();
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
        ) : error || !article ? (
          <div className="text-center py-20 bg-[#0D1220] rounded-3xl border border-[#252A3A] space-y-4 my-10">
            <Newspaper className="h-12 w-12 text-[#EF4444] mx-auto opacity-80" />
            <h2 className="text-xl font-bold text-white">Article Not Found</h2>
            <p className="text-xs text-[#94A3B8]">{error}</p>
            <Link
              href="/news"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#4F46E5] text-xs font-bold text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to News
            </Link>
          </div>
        ) : (
          <article className="space-y-8">
            {/* Breadcrumb & Navigation */}
            <div className="flex items-center justify-between">
              <nav className="flex items-center gap-2 text-xs font-semibold text-[#94A3B8]">
                <Link href="/" className="hover:text-[#F8FAFC] transition-colors">
                  Home
                </Link>
                <ChevronRight className="h-3.5 w-3.5 text-[#64748B]" />
                <Link href="/news" className="hover:text-[#F8FAFC] transition-colors">
                  News
                </Link>
                <ChevronRight className="h-3.5 w-3.5 text-[#64748B]" />
                <span className="text-[#60A5FA] truncate max-w-[200px]">{article.title}</span>
              </nav>

              <Link
                href="/news"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#A1A9B8] hover:text-white transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to News</span>
              </Link>
            </div>

            {/* Article Header */}
            <header className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 rounded-full bg-[#4F46E5]/20 border border-[#4F46E5]/40 text-xs font-bold text-[#818CF8]">
                  {article.category_name || "News"}
                </span>
                <span className="flex items-center gap-1 text-xs text-[#94A3B8]">
                  <Clock className="h-3.5 w-3.5 text-[#60A5FA]" />
                  {article.published_at
                    ? new Date(article.published_at).toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })
                    : "Recently"}
                </span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
                {article.title}
              </h1>

              {article.short_description && (
                <p className="text-base sm:text-lg text-[#94A3B8] leading-relaxed border-l-4 border-[#4F46E5] pl-4 italic">
                  {article.short_description}
                </p>
              )}
            </header>

            {/* Featured Image */}
            <div className="relative aspect-[16/9] w-full overflow-hidden rounded-3xl bg-[#0D1220] border border-[#252A3A] shadow-2xl">
              <img
                src={article.featured_image}
                alt={article.title}
                className="h-full w-full object-cover"
              />
            </div>

            {/* Main Content Body */}
            <div
              className="prose prose-invert max-w-none text-sm sm:text-base text-[#D1D5DB] leading-relaxed space-y-4 font-sans border-b border-[#252A3A] pb-12"
              dangerouslySetInnerHTML={{ __html: article.content }}
            />

            {/* RELATED ARTICLES */}
            {related.length > 0 && (
              <section className="pt-8 space-y-6">
                <h3 className="text-xl font-black text-white flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-[#60A5FA]" />
                  Related News
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {related.map((item) => (
                    <Link
                      key={item.id}
                      href={`/news/${item.slug}`}
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
