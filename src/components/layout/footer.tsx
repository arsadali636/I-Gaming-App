import Link from "next/link";
import { Globe, ExternalLink, Hash, Mail, Sparkles, ShieldCheck } from "lucide-react";

const footerColumns = [
  {
    title: "Platform",
    links: [
      { href: "/marketplace", label: "Overview" },
      { href: "/#solutions", label: "Solutions" },
      { href: "/categories", label: "Categories" },
      { href: "/pricing", label: "Enterprise Pricing" },
    ],
  },
  {
    title: "Marketplace",
    links: [
      { href: "/marketplace?category=operators", label: "Casino Operators" },
      { href: "/marketplace?category=affiliates", label: "Affiliate Networks" },
      { href: "/marketplace?category=game-studios", label: "Game Studios" },
      { href: "/marketplace?category=payment-providers", label: "Payment Providers" },
      { href: "/marketplace?category=platform-providers", label: "Platform PAMs" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/about", label: "About Us" },
      { href: "/contact", label: "Contact Us" },
      { href: "/#events", label: "Events & Summits" },
      { href: "/register", label: "List Your Business" },
    ],
  },
  {
    title: "Resources",
    links: [
      { href: "/#insights", label: "Industry Intelligence" },
      { href: "/#faq", label: "Platform FAQ" },
      { href: "/contact", label: "Partner Support" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/privacy", label: "Privacy Policy" },
      { href: "/terms", label: "Terms of Service" },
      { href: "/cookies", label: "Cookie Policy" },
    ],
  },
];

const socialLinks = [
  { href: "#", icon: Globe, label: "Website" },
  { href: "#", icon: ExternalLink, label: "LinkedIn" },
  { href: "#", icon: Hash, label: "X / Twitter" },
  { href: "#", icon: Mail, label: "Email Support" },
];

export default function Footer() {
  return (
    <footer className="relative border-t border-[#252A3A] bg-[#080B14] text-[#F8FAFC]">
      {/* Top subtle glow bar */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-[1px] bg-gradient-to-r from-transparent via-[#4F46E5]/40 to-transparent" />

      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-3 lg:grid-cols-6 pb-12 border-b border-[#252A3A]/80">
          {/* Brand Column */}
          <div className="col-span-2 md:col-span-3 lg:col-span-2 space-y-4 pr-4">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#4F46E5] via-[#3B82F6] to-[#22C1DC] p-0.5 shadow-lg shadow-[#4F46E5]/25">
                <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-[#080B14]">
                  <Sparkles className="h-4 w-4 text-[#22C1DC]" />
                </div>
              </div>
              <span className="text-[#F8FAFC] text-lg font-extrabold tracking-tight font-sans">
                iGaming <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#818CF8] to-[#22C1DC]">Connect</span>
              </span>
            </Link>
            <p className="text-xs leading-relaxed text-[#A1A9B8] max-w-sm">
              The global B2B marketplace and discovery platform for the iGaming industry. Evaluate verified operators, affiliates, game studios, and technology providers globally.
            </p>

            <div className="flex items-center gap-2 text-xs text-[#22C1DC] bg-[#0D1220] px-3 py-1.5 rounded-lg border border-[#252A3A] w-fit">
              <ShieldCheck className="h-4 w-4 text-[#22C1DC]" />
              <span className="font-semibold">Audited B2B Directory Network</span>
            </div>
          </div>

          {/* Links Columns */}
          {footerColumns.map((column) => (
            <div key={column.title} className="space-y-3">
              <h3 className="text-xs font-bold text-[#F8FAFC] tracking-wider uppercase">
                {column.title}
              </h3>
              <ul className="space-y-2">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-xs text-[#A1A9B8] transition-colors hover:text-[#F8FAFC] hover:underline underline-offset-4"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 flex flex-col items-center justify-between gap-4 sm:flex-row text-xs text-[#6B7280]">
          <p>&copy; {new Date().getFullYear()} iGaming Connect. All rights reserved. Built for B2B Industry Partners.</p>
          
          <div className="flex items-center gap-3">
            {socialLinks.map((social) => (
              <a
                key={social.label}
                href={social.href}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#252A3A] bg-[#0D1220] text-[#A1A9B8] transition-all hover:border-[#343B52] hover:bg-[#121827] hover:text-[#F8FAFC]"
                aria-label={social.label}
              >
                <social.icon className="h-3.5 w-3.5" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}


