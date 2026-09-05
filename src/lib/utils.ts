import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!local || !domain) return "••••••••";
  const masked = local.slice(0, 2) + "••••" + local.slice(-1);
  return `${masked}@${domain}`;
}

export function maskPhone(phone: string): string {
  if (!phone || phone.length < 6) return "••••••";
  return phone.slice(0, 3) + " ••••••" + phone.slice(-1);
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function formatCurrency(amount: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + "...";
}

export function calculateMatchScore(
  userInterests: string[],
  companyTags: string[]
): number {
  if (!userInterests.length || !companyTags.length) return 0;
  const intersection = userInterests.filter((i) =>
    companyTags.some((t) => t.toLowerCase().includes(i.toLowerCase()))
  );
  return Math.round((intersection.length / Math.max(userInterests.length, companyTags.length)) * 100);
}
