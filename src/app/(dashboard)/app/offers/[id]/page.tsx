"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Tag,
  Building2,
  Globe,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  ArrowLeft,
  ShieldCheck,
  ExternalLink,
  Sparkles,
  Send,
  X,
  Clock,
  Lock,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface OfferDetails {
  id: string;
  title: string;
  slug: string;
  company_id: string;
  company_name?: string;
  company_logo?: string;
  company_slug?: string;
  company_description?: string;
  company_website?: string;
  company_headquarters?: string;
  company_verified?: number;
  brand?: string;
  category_name?: string;
  geo?: string;
  traffic_type?: string;
  vertical?: string;
  payout: number;
  currency: string;
  payout_type: string;
  payout_description?: string;
  conversion_event?: string;
  description: string;
  terms?: string;
  allowed_traffic?: string;
  restricted_traffic?: string;
  landing_page_url?: string;
  start_date?: string;
  end_date?: string;
  status: string;
  is_featured: number;
  created_by?: string;
  created_at: string;
}

interface ApplicationItem {
  id: string;
  status: string;
  message?: string;
  created_at: string;
}

export default function OfferDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();

  const [offer, setOffer] = useState<OfferDetails | null>(null);
  const [myApplication, setMyApplication] = useState<ApplicationItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Application Modal state
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [pitchMessage, setPitchMessage] = useState("");
  const [trafficDetails, setTrafficDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);

  // Message creation state
  const [messagingLoading, setMessagingLoading] = useState(false);

  useEffect(() => {
    async function fetchOfferDetails() {
      try {
        setLoading(true);
        const res = await fetch(`/api/offers/${resolvedParams.id}`);
        if (res.ok) {
          const data = await res.json();
          setOffer(data.offer);
          setMyApplication(data.my_application || null);
        } else {
          const errData = await res.json();
          setError(errData.error || "Offer not found");
        }
      } catch (err: unknown) {
        setError("Error connecting to server");
      } finally {
        setLoading(false);
      }
    }
    fetchOfferDetails();
  }, [resolvedParams.id]);

  const handleApplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!offer) return;
    try {
      setSubmitting(true);
      setApplyError(null);
      const res = await fetch(`/api/offers/${offer.id}/apply`, {
        method: "POST",
        headers: { "Content-[#Type]": "application/json" },
        body: JSON.stringify({
          message: pitchMessage,
          traffic_details: trafficDetails,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to submit request");
      }

      setMyApplication(data.application);
      setApplyModalOpen(false);
    } catch (err: unknown) {
      setApplyError(err instanceof Error ? err.message : "Error submitting application");
    } finally {
      setSubmitting(false);
    }
  };

  // Discuss Offer via existing Messages module
  const handleDiscussOffer = async () => {
    if (!offer || !offer.created_by) return;
    try {
      setMessagingLoading(true);
      const initialContent = `Hi! I'm interested in discussing your B2B offer "${offer.title}". Let's connect!`;

      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receiver_id: offer.created_by,
          content: initialContent,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const convId = data.message?.conversation_id;
        if (convId) {
          router.push(`/app/messages?conversation_id=${convId}`);
        } else {
          router.push("/app/messages");
        }
      } else {
        router.push("/app/messages");
      }
    } catch (err) {
      console.error("Error creating discussion:", err);
      router.push("/app/messages");
    } finally {
      setMessagingLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto py-6">
        <Skeleton className="h-10 w-32 rounded-xl bg-[#151C2C]" />
        <Skeleton className="h-64 w-full rounded-3xl bg-[#151C2C]" />
        <div className="grid grid-cols-3 gap-6">
          <Skeleton className="h-48 col-span-2 rounded-3xl bg-[#151C2C]" />
          <Skeleton className="h-48 rounded-3xl bg-[#151C2C]" />
        </div>
      </div>
    );
  }

  if (error || !offer) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-4">
        <AlertCircle className="h-12 w-12 text-[#EF4444] mx-auto" />
        <h2 className="text-xl font-bold text-white">Offer Not Found</h2>
        <p className="text-xs text-[#94A3B8]">{error || "The requested offer could not be loaded."}</p>
        <Link
          href="/app/offers"
          className="inline-flex items-center gap-2 rounded-xl bg-[#4F6BFF] px-4 py-2 text-xs font-bold text-white hover:bg-[#3B54E6]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to All Offers
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      {/* NAVIGATION HEADER */}
      <div className="flex items-center justify-between">
        <Link
          href="/app/offers"
          className="inline-flex items-center gap-2 text-xs font-bold text-[#94A3B8] hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Offers Listing</span>
        </Link>
      </div>

      {/* HERO HERO SECTION */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0D1322] via-[#111827] to-[#0A0F1D] border border-white/[0.08] p-6 sm:p-8 shadow-2xl">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="space-y-4 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-[#34D399]/20 border border-[#34D399]/40 text-[#34D399] px-3 py-1 text-xs font-black">
                {offer.payout_type}: {offer.currency}
                {offer.payout}
              </span>
              {offer.geo && (
                <span className="inline-flex items-center gap-1 rounded-full bg-white/[0.06] border border-white/[0.08] px-3 py-1 text-xs font-bold text-[#60A5FA]">
                  <Globe className="h-3.5 w-3.5" />
                  {offer.geo}
                </span>
              )}
              {offer.vertical && (
                <span className="rounded-full bg-white/[0.04] px-3 py-1 text-xs font-bold text-[#94A3B8]">
                  {offer.vertical}
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight">
              {offer.title}
            </h1>

            <p className="text-xs sm:text-sm text-[#94A3B8] leading-relaxed">
              {offer.description}
            </p>
          </div>

          {/* ACTION BOX */}
          <div className="shrink-0 space-y-3 bg-[#151C2C]/80 p-5 rounded-2xl border border-white/[0.08] w-full md:w-72">
            <div className="text-center pb-3 border-b border-white/[0.06]">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#64748B]">Payout Structure</span>
              <p className="text-2xl font-black text-[#34D399] mt-0.5">
                {offer.currency}{offer.payout} <span className="text-xs text-[#94A3B8] font-semibold">{offer.payout_type}</span>
              </p>
              {offer.payout_description && (
                <p className="text-[11px] text-[#94A3B8] mt-1">{offer.payout_description}</p>
              )}
            </div>

            {/* Application State / Button */}
            {myApplication ? (
              <div className="p-3 rounded-xl bg-[#34D399]/10 border border-[#34D399]/30 text-center space-y-1">
                <span className="inline-flex items-center gap-1 text-xs font-black text-[#34D399]">
                  <CheckCircle2 className="h-4 w-4" />
                  Request Status: {myApplication.status.toUpperCase()}
                </span>
                <p className="text-[10px] text-[#94A3B8]">
                  Submitted on {new Date(myApplication.created_at).toLocaleDateString()}
                </p>
              </div>
            ) : (
              <button
                onClick={() => setApplyModalOpen(true)}
                className="w-full rounded-xl bg-[#4F6BFF] py-3 text-xs font-bold text-white shadow-lg hover:bg-[#3B54E6] transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Sparkles className="h-4 w-4" />
                Apply / Request Access
              </button>
            )}

            {/* Discuss Offer Button (Messaging Integration) */}
            {offer.created_by && (
              <button
                onClick={handleDiscussOffer}
                disabled={messagingLoading}
                className="w-full rounded-xl bg-white/[0.05] border border-white/[0.08] py-2.5 text-xs font-bold text-[#F8FAFC] hover:bg-white/[0.1] transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <MessageSquare className="h-4 w-4 text-[#60A5FA]" />
                <span>{messagingLoading ? "Opening Chat..." : "Discuss this Offer"}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* TWO COLUMN DETAILS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* MAIN DETAILS COLUMN */}
        <div className="lg:col-span-2 space-y-6">
          {/* Campaign Overview Card */}
          <div className="rounded-3xl bg-[#0D1220] border border-white/[0.08] p-6 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Tag className="h-4 w-4 text-[#4F6BFF]" />
              Campaign Overview & Terms
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-4 rounded-2xl bg-[#111827] border border-white/[0.04]">
              <div>
                <p className="text-[10px] font-extrabold uppercase text-[#64748B]">Conversion Event</p>
                <p className="text-xs font-bold text-white mt-0.5">{offer.conversion_event || "FTD"}</p>
              </div>
              <div>
                <p className="text-[10px] font-extrabold uppercase text-[#64748B]">Target GEOs</p>
                <p className="text-xs font-bold text-[#60A5FA] mt-0.5">{offer.geo || "Global"}</p>
              </div>
              <div>
                <p className="text-[10px] font-extrabold uppercase text-[#64748B]">Traffic Types</p>
                <p className="text-xs font-bold text-white mt-0.5">{offer.traffic_type || "All Traffic"}</p>
              </div>
            </div>

            {offer.terms && (
              <div className="space-y-2 pt-2">
                <h4 className="text-xs font-bold text-[#F8FAFC]">Terms & Conditions</h4>
                <p className="text-xs text-[#94A3B8] leading-relaxed whitespace-pre-line bg-[#111827] p-4 rounded-2xl border border-white/[0.04]">
                  {offer.terms}
                </p>
              </div>
            )}

            {offer.allowed_traffic && (
              <div className="space-y-2 pt-2">
                <h4 className="text-xs font-bold text-[#34D399] flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4" />
                  Allowed Traffic Sources
                </h4>
                <p className="text-xs text-[#94A3B8] bg-[#34D399]/5 p-3.5 rounded-2xl border border-[#34D399]/20">
                  {offer.allowed_traffic}
                </p>
              </div>
            )}

            {offer.restricted_traffic && (
              <div className="space-y-2 pt-2">
                <h4 className="text-xs font-bold text-[#EF4444] flex items-center gap-1.5">
                  <AlertCircle className="h-4 w-4" />
                  Restricted / Prohibited Traffic
                </h4>
                <p className="text-xs text-[#94A3B8] bg-[#EF4444]/5 p-3.5 rounded-2xl border border-[#EF4444]/20">
                  {offer.restricted_traffic}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* SIDEBAR COLUMN */}
        <div className="space-y-6">
          {/* Advertiser Company Card */}
          <div className="rounded-3xl bg-[#0D1220] border border-white/[0.08] p-6 space-y-4">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#64748B]">
              Advertiser / Company
            </h3>

            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-[#151C2C] border border-white/[0.08] flex items-center justify-center font-bold text-[#60A5FA]">
                {offer.company_logo ? (
                  <img
                    src={offer.company_logo}
                    alt={offer.company_name || "Company"}
                    className="h-12 w-12 rounded-2xl object-cover"
                  />
                ) : (
                  <Building2 className="h-6 w-6 text-[#4F6BFF]" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-bold text-white">
                    {offer.company_name || offer.brand || "Verified Operator"}
                  </p>
                  {offer.company_verified === 1 && (
                    <ShieldCheck className="h-4 w-4 text-[#60A5FA]" />
                  )}
                </div>
                <p className="text-xs text-[#94A3B8]">{offer.company_headquarters || "Global Headquarters"}</p>
              </div>
            </div>

            {offer.company_description && (
              <p className="text-xs text-[#94A3B8] line-clamp-3 leading-relaxed">
                {offer.company_description}
              </p>
            )}

            {offer.company_slug && (
              <Link
                href={`/app/company/${offer.company_slug}`}
                className="inline-flex items-center gap-2 text-xs font-bold text-[#60A5FA] hover:underline pt-2"
              >
                <span>View Full Company Profile</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* APPLY ACCESS MODAL */}
      <AnimatePresence>
        {applyModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-[#0D1220] border border-white/[0.1] p-6 shadow-2xl space-y-5"
            >
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
                <div>
                  <h3 className="text-lg font-bold text-white">Request Access to Offer</h3>
                  <p className="text-xs text-[#94A3B8] mt-0.5 truncate">{offer.title}</p>
                </div>
                <button
                  onClick={() => setApplyModalOpen(false)}
                  className="rounded-xl p-1.5 text-[#94A3B8] hover:bg-white/[0.08] hover:text-white cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {applyError && (
                <div className="p-3 rounded-xl bg-[#EF4444]/10 border border-[#EF4444]/20 text-xs font-semibold text-[#EF4444]">
                  {applyError}
                </div>
              )}

              <form onSubmit={handleApplySubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#F8FAFC]">
                    Application Pitch / Message
                  </label>
                  <textarea
                    rows={3}
                    value={pitchMessage}
                    onChange={(e) => setPitchMessage(e.target.value)}
                    placeholder="Describe your traffic volume, promotion channels, and team background..."
                    className="w-full rounded-2xl border border-white/[0.08] bg-[#111827] p-3 text-xs text-[#F8FAFC] placeholder:text-[#64748B] outline-none focus:border-[#4F6BFF]"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#F8FAFC]">
                    Traffic Channels & GEO Capabilities
                  </label>
                  <input
                    type="text"
                    value={trafficDetails}
                    onChange={(e) => setTrafficDetails(e.target.value)}
                    placeholder="e.g. 5,000 monthly FTDs via Casino SEO portals in DE, BR, UK"
                    className="w-full rounded-2xl border border-white/[0.08] bg-[#111827] p-3 text-xs text-[#F8FAFC] placeholder:text-[#64748B] outline-none focus:border-[#4F6BFF]"
                  />
                </div>

                <div className="pt-3 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setApplyModalOpen(false)}
                    className="rounded-xl px-4 py-2.5 text-xs font-bold text-[#94A3B8] hover:text-white cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="rounded-xl bg-[#4F6BFF] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#3B54E6] cursor-pointer disabled:opacity-50"
                  >
                    {submitting ? "Submitting..." : "Submit Access Request"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
