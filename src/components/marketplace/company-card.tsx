"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { BadgeCheck, Star, MapPin } from "lucide-react";
import { truncate, getInitials } from "@/lib/utils";

interface CountryObj {
  name?: string;
  code?: string;
}

interface CategoryObj {
  name?: string;
}

interface Company {
  name: string;
  slug: string;
  logo_url?: string | null;
  description?: string | null;
  categories?: (string | CategoryObj)[];
  country?: string | CountryObj | null;
  is_verified?: boolean;
  is_featured?: boolean;
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

interface CompanyCardProps {
  company: Company;
  index?: number;
}

export default function CompanyCard({ company, index = 0 }: CompanyCardProps) {
  const {
    name,
    slug,
    logo_url,
    description,
    categories = [],
    country,
    is_verified,
    is_featured,
  } = company;

  const countryCode =
    typeof country === "string"
      ? country
      : typeof country === "object" && country !== null
      ? country.code || ""
      : "";

  const countryName =
    typeof country === "string"
      ? country
      : typeof country === "object" && country !== null
      ? country.name || country.code || ""
      : "";

  const flag = countryCode ? FLAG_MAP[countryCode.toUpperCase()] || "" : "";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-30px" }}
      transition={{ duration: 0.35, delay: index * 0.04 }}
    >
      <Link href={`/company/${slug}`} className="block group">
        <div className="glass-card p-5 h-full flex flex-col transition-all duration-300 group-hover:border-primary/30 group-hover:shadow-[0_0_30px_rgba(108,92,231,0.1)] relative overflow-hidden">
          {is_featured && (
            <div className="absolute top-3 right-3">
              <Star
                size={14}
                className="text-yellow-400 fill-yellow-400"
              />
            </div>
          )}

          <div className="flex items-center gap-3 mb-3">
            {logo_url ? (
              <img
                src={logo_url}
                alt={name}
                className="w-10 h-10 rounded-lg object-cover border border-glass-border"
              />
            ) : (
              <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary text-sm font-bold">
                {getInitials(name)}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="font-semibold text-foreground text-sm truncate">
                  {name}
                </h3>
                {is_verified && (
                  <BadgeCheck size={14} className="text-accent flex-shrink-0" />
                )}
              </div>
              {countryName && (
                <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  {flag && <span>{flag}</span>}
                  <span>{countryName}</span>
                </div>
              )}
            </div>
          </div>

          {description && (
            <p className="text-xs text-muted-foreground leading-relaxed mb-3 line-clamp-2">
              {truncate(description, 120)}
            </p>
          )}

          {categories.length > 0 && (
            <div className="mt-auto flex flex-wrap gap-1.5">
              {categories.slice(0, 3).map((cat, i) => {
                const catName = typeof cat === "string" ? cat : cat?.name || "";
                return (
                  <span
                    key={catName || i}
                    className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary/80 border border-primary/10"
                  >
                    {catName}
                  </span>
                );
              })}
              {categories.length > 3 && (
                <span className="text-[10px] text-muted-foreground px-1 py-0.5">
                  +{categories.length - 3}
                </span>
              )}
            </div>
          )}
        </div>
      </Link>
    </motion.div>
  );
}
