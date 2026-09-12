"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Trophy,
  Dice1,
  Sliders,
  Grid3x3,
  Gamepad2,
  Palette,
  Building2,
  Server,
  CreditCard,
  Shield,
  ShieldCheck,
  Layers,
  Cpu,
  FileCheck,
  Zap,
  Globe2,
  Users,
  Award,
  TrendingUp,
  Share2,
  Folder,
  ArrowRight,
  type LucideIcon,
} from "lucide-react";

const ICON_MAP: Record<string, LucideIcon> = {
  Trophy,
  Dice1,
  Sliders,
  Grid3x3,
  Gamepad2,
  Palette,
  Building2,
  Server,
  CreditCard,
  Shield,
  ShieldCheck,
  Layers,
  Cpu,
  FileCheck,
  Zap,
  Globe2,
  Users,
  Award,
  TrendingUp,
  Share2,
};

interface CategoryCardProps {
  name: string;
  slug: string;
  icon?: string | LucideIcon;
  color?: string;
  count?: number;
  description?: string;
  index?: number;
}

export default function CategoryCard({
  name,
  slug,
  icon,
  color = "#4F46E5",
  count,
  description,
  index = 0,
}: CategoryCardProps) {
  let IconComponent: LucideIcon = Building2;

  if (typeof icon === "string") {
    IconComponent = ICON_MAP[icon] || Building2;
  } else if (icon) {
    IconComponent = icon;
  }

  return (
    <Link href={`/category/${slug}`}>
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{ duration: 0.35, delay: index * 0.04 }}
        whileHover={{ y: -3 }}
        className="group relative bg-[#121827] border border-[#252A3A] hover:border-[#343B52] rounded-2xl p-5 cursor-pointer overflow-hidden h-full flex flex-col justify-between transition-all duration-200 shadow-md hover:shadow-xl hover:shadow-black/40"
      >
        <div className="relative z-10 space-y-3.5">
          <div className="flex items-center justify-between">
            <div
              className="w-11 h-11 rounded-xl border flex items-center justify-center transition-transform duration-200 group-hover:scale-105"
              style={{
                backgroundColor: `${color}18`,
                borderColor: `${color}35`,
              }}
            >
              <IconComponent
                size={20}
                style={{ color }}
                className="transition-transform duration-200"
              />
            </div>

            {count !== undefined && (
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#0D1220] border border-[#252A3A] text-[#A5B4FC]">
                {count} {count === 1 ? "Company" : "Companies"}
              </span>
            )}
          </div>

          <div>
            <h3 className="font-bold text-[#F8FAFC] text-base group-hover:text-[#22C1DC] transition-colors flex items-center justify-between">
              <span>{name}</span>
              <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 text-[#22C1DC] transition-all duration-200" />
            </h3>
            {description && (
              <p className="text-xs text-[#A1A9B8] line-clamp-2 leading-relaxed mt-1.5">
                {description}
              </p>
            )}
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
