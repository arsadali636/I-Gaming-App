import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { BadgeCheck, Globe, UserPlus, Bookmark, BookmarkCheck, Share2, Mail, Loader2 } from "lucide-react";
import { truncate, getInitials } from "@/lib/utils";

interface CountryObj {
  id?: string;
  name?: string;
  code?: string;
}

interface CategoryObj {
  id?: string;
  name?: string;
  slug?: string;
}

interface ItemObj {
  id?: string;
  name?: string;
  slug?: string;
}

interface CompanySizeObj {
  id?: string;
  label?: string;
}

interface Company {
  id?: string;
  name: string;
  slug: string;
  logo_url?: string | null;
  website?: string | null;
  description?: string | null;
  categories?: (string | CategoryObj)[];
  country?: string | CountryObj | null;
  topGeos?: CountryObj[];
  allGeos?: CountryObj[];
  softwareTypes?: ItemObj[];
  serviceTypes?: ItemObj[];
  licenses?: ItemObj[];
  headquarters?: string | null;
  market?: string | null;
  employee_count?: string | null;
  company_size?: CompanySizeObj | string | null;
  city?: string | null;
  contact_email?: string | null;
  owner_email?: string | null;
  is_verified?: boolean | number;
  is_featured?: boolean | number;
  completionPercentage?: number;
  saved?: boolean;
}

const FLAG_MAP: Record<string, string> = {
  MT: "\u{1F1F2}\u{1F1F9}",
  GB: "\u{1F1EC}\u{1F1E7}",
  US: "\u{1F1FA}\u{1F1F8}",
  DE: "\u{1F1E9}\u{1F1EA}",
  FR: "\u{1F1EB}\u{1F1F7}",
  IT: "\u{1F1EE}\u{1F1F9}",
  ES: "\u{1F1EA}\u{1F1F8}",
  SE: "\u{1F1F8}\u{1F1EA}",
  NO: "\u{1F1F3}\u{1F1F4}",
  FI: "\u{1F1EB}\u{1F1EE}",
  DK: "\u{1F1E9}\u{1F1F0}",
  NL: "\u{1F1F3}\u{1F1F1}",
  IE: "\u{1F1EE}\u{1F1EA}",
  EE: "\u{1F1EA}\u{1F1EA}",
  LV: "\u{1F1F1}\u{1F1FB}",
  LT: "\u{1F1F1}\u{1F1F9}",
  RO: "\u{1F1F7}\u{1F1F4}",
  BG: "\u{1F1E7}\u{1F1EC}",
  HR: "\u{1F1ED}\u{1F1F7}",
  GR: "\u{1F1EC}\u{1F1F7}",
  CY: "\u{1F1E8}\u{1F1FE}",
  GI: "\u{1F1EC}\u{1F1EE}",
  JE: "\u{1F1EF}\u{1F1EA}",
  IM: "\u{1F1EE}\u{1F1F2}",
  IS: "\u{1F1EE}\u{1F1F8}",
  CH: "\u{1F1E8}\u{1F1ED}",
  AT: "\u{1F1E6}\u{1F1F9}",
  PL: "\u{1F1F5}\u{1F1F1}",
  CZ: "\u{1F1E8}\u{1F1FF}",
  UA: "\u{1F1FA}\u{1F1E6}",
  IN: "\u{1F1EE}\u{1F1F3}",
  JP: "\u{1F1EF}\u{1F1F5}",
  AU: "\u{1F1E6}\u{1F1FA}",
  CA: "\u{1F1E8}\u{1F1E6}",
  BR: "\u{1F1E7}\u{1F1F7}",
  MX: "\u{1F1F2}\u{1F1FD}",
  AR: "\u{1F1E6}\u{1F1F7}",
  ZA: "\u{1F1FF}\u{1F1E6}",
  NG: "\u{1F1F3}\u{1F1EC}",
  KE: "\u{1F1F0}\u{1F1EA}",
  SG: "\u{1F1F8}\u{1F1EC}",
  PH: "\u{1F1F5}\u{1F1ED}",
  MY: "\u{1F1F2}\u{1F1FE}",
  VN: "\u{1F1FB}\u{1F1F3}",
  TH: "\u{1F1F9}\u{1F1ED}",
  KR: "\u{1F1F0}\u{1F1F7}",
  CN: "\u{1F1E8}\u{1F1F3}",
  PT: "\u{1F1F5}\u{1F1F9}",
};

function getFlag(code?: string): string {
  if (!code) return "🌐";
  const upper = code.toUpperCase();
  if (FLAG_MAP[upper]) return FLAG_MAP[upper];
  if (code.length === 2) {
    const codePoints = upper.split("").map((c) => 127397 + c.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
  }
  return "🌐";
}

interface CompanyCardProps {
  company: Company;
  index?: number;
  isSaved?: boolean;
  isSavePending?: boolean;
  onToggleSave?: (companyId: string) => void;
  onConnect?: (company: Company) => void;
  hrefPrefix?: string;
}

export default function CompanyCard({
  company,
  index = 0,
  isSaved = false,
  isSavePending = false,
  onToggleSave,
  onConnect,
  hrefPrefix = "/app/company",
}: CompanyCardProps) {
  const [logoFailed, setLogoFailed] = useState(false);

  const {
    id,
    name,
    slug,
    logo_url,
    website,
    description,
    categories = [],
    country,
    topGeos = [],
    allGeos = [],
    softwareTypes = [],
    serviceTypes = [],
    licenses = [],
    headquarters,
    market,
    employee_count,
    company_size,
    city,
    contact_email,
    owner_email,
    is_verified,
    is_featured,
    completionPercentage,
  } = company;

  const companyTargetId = id || slug || "";
  const isVerifiedBool = Boolean(is_verified === 1 || is_verified === true);
  const isFeaturedBool = Boolean(is_featured === 1 || is_featured === true);

  // Primary category name
  const primaryCategory =
    categories.length > 0
      ? typeof categories[0] === "string"
        ? categories[0]
        : categories[0]?.name || ""
      : "";

  // Primary Country name
  const primaryCountryName =
    typeof country === "object" && country?.name
      ? country.name
      : typeof country === "string"
      ? country
      : headquarters || null;

  // Formatted location string with City if available
  const displayLocation =
    city && primaryCountryName
      ? `${city}, ${primaryCountryName}`
      : city || primaryCountryName;

  // Formatted contact email
  const displayEmail = contact_email || owner_email || null;

  // Employee / Company Size string
  const displaySize =
    typeof company_size === "object" && company_size?.label
      ? company_size.label
      : typeof company_size === "string"
      ? company_size
      : employee_count || null;

  // GEOs for chips
  const displayGeos = topGeos.length > 0 ? topGeos : allGeos;
  const visibleGeos = displayGeos.slice(0, 5);
  const extraGeoCount = displayGeos.length > 5 ? displayGeos.length - 5 : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: index * 0.02 }}
      className="w-full"
    >
      <div
        className={`group relative w-full rounded-2xl bg-[#111827] border transition-all duration-200 p-5 md:p-6 shadow-md ${
          isFeaturedBool
            ? "border-[#2563EB]"
            : "border-[#1F2937] hover:border-[#2563EB]/40"
        }`}
      >
        {/* Main Header / Left & Right Grid */}
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-5">
          {/* Left Column: Logo + Detailed Content */}
          <div className="flex items-start gap-4 min-w-0 flex-1">
            {/* Logo Box */}
            <Link href={`${hrefPrefix}/${companyTargetId}`} className="shrink-0">
              {logo_url && !logoFailed ? (
                <img
                  src={logo_url}
                  alt={name}
                  onError={() => setLogoFailed(true)}
                  className="w-16 h-16 rounded-2xl object-cover border border-[#1F2937] bg-[#070B14]"
                />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-[#2563EB] border border-[#1F2937] flex items-center justify-center text-[#F8FAFC] text-xl font-bold shrink-0">
                  {getInitials(name)}
                </div>
              )}
            </Link>

            {/* Content info */}
            <div className="min-w-0 flex-1 space-y-1">
              {/* Title & Badges */}
              <div className="flex items-center gap-2 flex-wrap">
                <Link
                  href={`${hrefPrefix}/${companyTargetId}`}
                  className="font-bold text-[#F8FAFC] text-base md:text-lg hover:text-[#2563EB] transition-colors truncate"
                >
                  {name}
                </Link>

                {isVerifiedBool && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30 shrink-0">
                    <BadgeCheck size={13} className="text-[#10B981]" />
                    Verified
                  </span>
                )}

                <span className="inline-flex items-center text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20 shrink-0">
                  Active
                </span>

                {isVerifiedBool && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-[#2563EB]/15 text-[#2563EB] border border-[#2563EB]/30 shrink-0">
                    👑 Trusted Member
                  </span>
                )}
              </div>

              {/* Business Category Subtitle */}
              {primaryCategory && (
                <p className="text-xs font-medium text-[#94A3B8]">
                  {primaryCategory}
                </p>
              )}

              {/* Company Description */}
              {description && (
                <p className="text-xs md:text-sm text-[#94A3B8] leading-relaxed line-clamp-2 pt-0.5">
                  {truncate(description, 150)}
                </p>
              )}

              {/* Meta information row */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#94A3B8] pt-1">
                {displaySize && (
                  <div className="flex items-center gap-1.5">
                    <span>👥</span>
                    <span>{displaySize}</span>
                  </div>
                )}

                {displayLocation && (
                  <div className="flex items-center gap-1.5">
                    <span>📍</span>
                    <span>{displayLocation}</span>
                  </div>
                )}

                {website && (
                  <a
                    href={website.startsWith("http") ? website : `https://${website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-[#2563EB] hover:underline truncate"
                  >
                    <Globe size={12} className="shrink-0" />
                    <span className="truncate">{website.replace(/^https?:\/\//, "").replace(/\/$/, "")}</span>
                  </a>
                )}

                {displayEmail && (
                  <a
                    href={`mailto:${displayEmail}`}
                    className="flex items-center gap-1 text-[#94A3B8] hover:text-[#2563EB] truncate"
                  >
                    <Mail size={12} className="shrink-0 text-[#94A3B8]" />
                    <span className="truncate">{displayEmail}</span>
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Center-Right: Profile Completion Circular Progress Indicator */}
          {completionPercentage !== undefined && (
            <div className="flex items-center gap-3 shrink-0 self-start pt-1">
              <div className="relative w-12 h-12 flex items-center justify-center">
                <svg className="w-12 h-12 transform -rotate-90">
                  <circle
                    cx="24"
                    cy="24"
                    r="20"
                    stroke="#1F2937"
                    strokeWidth="4"
                    fill="transparent"
                  />
                  <circle
                    cx="24"
                    cy="24"
                    r="20"
                    stroke="#2563EB"
                    strokeWidth="4"
                    strokeDasharray={125.6}
                    strokeDashoffset={125.6 - (125.6 * completionPercentage) / 100}
                    strokeLinecap="round"
                    fill="transparent"
                  />
                </svg>
                <span className="absolute text-[11px] font-bold text-[#F8FAFC]">
                  {completionPercentage}%
                </span>
              </div>
              <div className="text-left hidden sm:block">
                <p className="text-xs font-semibold text-[#F8FAFC]">Profile</p>
                <p className="text-[11px] text-[#94A3B8]">Complete</p>
              </div>
            </div>
          )}

          {/* Far Right Action Buttons Column */}
          <div className="flex flex-row lg:flex-col items-center lg:items-stretch gap-2 shrink-0 w-full lg:w-36">
            <Link href={`${hrefPrefix}/${companyTargetId}`} className="w-full">
              <button className="w-full py-2 px-3 text-xs font-bold text-[#F8FAFC] bg-[#2563EB] hover:bg-[#1D4ED8] rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow">
                <span>View Profile</span>
                <span>→</span>
              </button>
            </Link>

            <button
              onClick={() => onConnect?.(company)}
              className="flex-1 lg:w-full py-2 px-3 text-xs font-semibold text-[#F8FAFC] bg-[#0D1320] hover:bg-[#1F2937] border border-[#1F2937] rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <UserPlus size={13} className="text-[#94A3B8]" />
              <span>Connect</span>
            </button>

            <Link href={`/app/messages?recipient=${companyTargetId}`} className="flex-1 lg:w-full">
              <button className="w-full py-2 px-3 text-xs font-semibold text-[#F8FAFC] bg-[#0D1320] hover:bg-[#1F2937] border border-[#1F2937] rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer">
                <Share2 size={13} className="text-[#94A3B8]" />
                <span>Message</span>
              </button>
            </Link>

            {onToggleSave && id && (
              <button
                disabled={isSavePending}
                onClick={(e) => {
                  e.preventDefault();
                  if (!isSavePending) onToggleSave(id);
                }}
                className={`flex-1 lg:w-full py-2 px-3 text-xs font-semibold rounded-xl border transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 ${
                  isSaved
                    ? "bg-[#2563EB]/15 text-[#2563EB] border-[#2563EB]/30"
                    : "bg-[#0D1320] text-[#94A3B8] hover:text-[#F8FAFC] border-[#1F2937] hover:bg-[#1F2937]"
                }`}
              >
                {isSavePending ? (
                  <>
                    <Loader2 size={13} className="animate-spin text-[#2563EB]" />
                    <span>Saving...</span>
                  </>
                ) : isSaved ? (
                  <>
                    <BookmarkCheck size={13} className="text-[#2563EB]" />
                    <span>Saved</span>
                  </>
                ) : (
                  <>
                    <Bookmark size={13} />
                    <span>Save</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Bottom Tag Chips Section */}
        {(visibleGeos.length > 0 || softwareTypes.length > 0 || serviceTypes.length > 0 || licenses.length > 0) && (
          <div className="mt-4 pt-4 border-t border-[#1F2937] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            {/* GEOs */}
            {visibleGeos.length > 0 && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#94A3B8] mb-1.5">GEOs</p>
                <div className="flex flex-wrap items-center gap-1.5">
                  {visibleGeos.map((geo, i) => (
                    <span key={geo.id || i} className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-md bg-[#0D1320] border border-[#1F2937] text-[#F8FAFC]" title={geo.name}>
                      <span>{getFlag(geo.code)}</span>
                    </span>
                  ))}
                  {extraGeoCount > 0 && (
                    <span className="text-[11px] font-semibold text-[#2563EB] px-1 py-0.5">
                      +{extraGeoCount}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Products / Software Types */}
            {softwareTypes.length > 0 && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#94A3B8] mb-1.5">Products</p>
                <div className="flex flex-wrap gap-1">
                  {softwareTypes.slice(0, 3).map((st, i) => (
                    <span key={st.id || i} className="text-[11px] px-2 py-0.5 rounded-md bg-[#0D1320] text-[#F8FAFC] border border-[#1F2937]">
                      {st.name}
                    </span>
                  ))}
                  {softwareTypes.length > 3 && (
                    <span className="text-[11px] text-[#94A3B8] px-1 py-0.5">
                      +{softwareTypes.length - 3}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Services */}
            {serviceTypes.length > 0 && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#94A3B8] mb-1.5">Services</p>
                <div className="flex flex-wrap gap-1">
                  {serviceTypes.slice(0, 3).map((st, i) => (
                    <span key={st.id || i} className="text-[11px] px-2 py-0.5 rounded-md bg-[#0D1320] text-[#F8FAFC] border border-[#1F2937]">
                      {st.name}
                    </span>
                  ))}
                  {serviceTypes.length > 3 && (
                    <span className="text-[11px] text-[#94A3B8] px-1 py-0.5">
                      +{serviceTypes.length - 3}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Licenses */}
            {licenses.length > 0 && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#94A3B8] mb-1.5">Licenses</p>
                <div className="flex flex-wrap gap-1">
                  {licenses.slice(0, 2).map((lic, i) => (
                    <span key={lic.id || i} className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-[#0D1320] text-[#2563EB] border border-[#1F2937]">
                      {lic.name}
                    </span>
                  ))}
                  {licenses.length > 2 && (
                    <span className="text-[11px] text-[#94A3B8] px-1 py-0.5">
                      +{licenses.length - 2}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
