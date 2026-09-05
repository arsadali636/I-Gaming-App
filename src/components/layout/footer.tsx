import Link from "next/link";
import { Globe, ExternalLink, Hash, Mail } from "lucide-react";

const footerColumns = [
  {
    title: "Company",
    links: [
      { href: "/about", label: "About" },
      { href: "/careers", label: "Careers" },
      { href: "/contact", label: "Contact" },
    ],
  },
  {
    title: "Marketplace",
    links: [
      { href: "/marketplace", label: "Browse" },
      { href: "/categories", label: "Categories" },
      { href: "/pricing", label: "Pricing" },
    ],
  },
  {
    title: "Resources",
    links: [
      { href: "/blog", label: "Blog" },
      { href: "/faq", label: "FAQ" },
      { href: "/support", label: "Support" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/privacy", label: "Privacy" },
      { href: "/terms", label: "Terms" },
    ],
  },
];

const socialLinks = [
  { href: "#", icon: Globe, label: "Website" },
  { href: "#", icon: ExternalLink, label: "LinkedIn" },
  { href: "#", icon: Hash, label: "GitHub" },
  { href: "#", icon: Mail, label: "Email" },
];

export default function Footer() {
  return (
    <footer className="relative border-t border-glass-border bg-[#080818]">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-neon-purple/50 to-transparent" />

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4 lg:grid-cols-5">
          <div className="col-span-2 md:col-span-4 lg:col-span-1">
            <Link href="/" className="inline-flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-neon-purple to-neon-cyan">
                <span className="text-sm font-bold text-white">iG</span>
              </div>
              <span className="gradient-text text-lg font-bold tracking-tight">
                iGaming Connect
              </span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
              The premier B2B networking platform for the iGaming industry.
              Connect, collaborate, and grow your business.
            </p>
          </div>

          {footerColumns.map((column) => (
            <div key={column.title}>
              <h3 className="text-sm font-semibold text-foreground">
                {column.title}
              </h3>
              <ul className="mt-4 space-y-3">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-neon-cyan"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-glass-border pt-8 sm:flex-row">
          <p className="text-sm text-muted-foreground">
            &copy; 2026 iGaming Connect. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            {socialLinks.map((social) => (
              <a
                key={social.label}
                href={social.href}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-white/5 hover:text-neon-cyan"
                aria-label={social.label}
              >
                <social.icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
