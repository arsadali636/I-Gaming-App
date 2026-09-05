"use client";

import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface CategoryCardProps {
  name: string;
  slug: string;
  icon: LucideIcon;
  color: string;
  count?: number;
  description?: string;
  index?: number;
}

export default function CategoryCard({
  name,
  icon: Icon,
  color,
  count,
  description,
  index = 0,
}: CategoryCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      whileHover={{ scale: 1.03, y: -4 }}
      className="group relative glass-card p-6 cursor-pointer overflow-hidden"
    >
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background: `radial-gradient(circle at 50% 50%, ${color}15, transparent 70%)`,
        }}
      />
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          boxShadow: `inset 0 0 30px ${color}10, 0 0 20px ${color}15`,
        }}
      />

      <div className="relative z-10 flex items-start gap-4">
        <div
          className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:shadow-lg"
          style={{
            background: `${color}15`,
            border: `1px solid ${color}30`,
          }}
        >
          <Icon
            size={22}
            style={{ color }}
            className="transition-transform duration-300 group-hover:scale-110"
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-foreground text-sm">{name}</h3>
            {count !== undefined && (
              <span
                className="text-[10px] font-medium px-1.5 py-0.5 rounded-full"
                style={{
                  background: `${color}20`,
                  color,
                }}
              >
                {count}
              </span>
            )}
          </div>
          {description && (
            <p className="text-xs text-muted-foreground line-clamp-2">
              {description}
            </p>
          )}
        </div>
      </div>

      <div
        className="absolute bottom-0 left-0 right-0 h-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
        }}
      />
    </motion.div>
  );
}
