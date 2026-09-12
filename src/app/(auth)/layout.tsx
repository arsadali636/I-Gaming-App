import Link from "next/link";
import { ShieldCheck, Zap, Sparkles } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen w-full bg-[#090B14] text-[#F8FAFC] font-sans antialiased selection:bg-[#4F46E5]/30 selection:text-white">
      {/* LEFT SIDE: FORM CONTAINER */}
      <div className="flex w-full lg:w-1/2 flex-col justify-between px-6 py-8 sm:px-12 lg:px-16 xl:px-20 bg-[#090B14] relative z-10 min-h-screen border-r border-[#252A3A]">
        {/* Top Header Logo */}
        <div className="flex items-center justify-between w-full mb-6">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#4F46E5] transition-transform duration-200">
              <span className="text-base font-extrabold text-white tracking-wider">iG</span>
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold tracking-tight text-[#F8FAFC] group-hover:text-[#4F46E5] transition-colors">
                iGaming Connect
              </span>
              <span className="text-[10px] font-semibold text-[#A1A9B8] uppercase tracking-widest">
                B2B Marketplace
              </span>
            </div>
          </Link>
        </div>

        {/* Form Body */}
        <div className="my-auto w-full max-w-md mx-auto py-6">
          {children}
        </div>

        {/* Footer info */}
        <div className="pt-6 text-center text-xs text-[#6B7280] border-t border-[#252A3A] mt-4">
          © {new Date().getFullYear()} iGaming Connect. All rights reserved. •{" "}
          <Link href="/privacy" className="hover:text-[#F8FAFC] underline transition-colors">
            Privacy Policy
          </Link>{" "}
          •{" "}
          <Link href="/terms" className="hover:text-[#F8FAFC] underline transition-colors">
            Terms of Service
          </Link>
        </div>
      </div>

      {/* RIGHT SIDE: FUTURISTIC DEEP NAVY BRANDING AREA */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-[#0D101C] items-center justify-center p-12 text-white border-l border-[#252A3A]">
        {/* Centered Large Branding Text & Content */}
        <div className="relative z-10 text-center max-w-lg space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[rgba(79,70,229,0.12)] border border-[rgba(79,70,229,0.20)] text-xs font-medium tracking-wider text-[#A5B4FC] uppercase">
            <Zap size={14} className="text-[#22C1DC]" />
            <span>The Premier iGaming B2B Ecosystem</span>
          </div>

          <div className="space-y-2">
            <h1 className="text-4xl xl:text-5xl font-black tracking-tight text-[#F8FAFC] leading-tight">
              Global iGaming Discovery Platform
            </h1>
            <p className="text-sm xl:text-base text-[#A1A9B8] leading-relaxed max-w-md mx-auto">
              Connect directly with verified operators, affiliates, game studios, and technology providers worldwide.
            </p>
          </div>

          <div className="pt-8 grid grid-cols-2 gap-4 max-w-md mx-auto text-left border-t border-[#252A3A]">
            <div className="p-4 rounded-xl bg-[#111522] border border-[#252A3A]">
              <div className="flex items-center gap-2 text-[#22C1DC] text-xs font-semibold uppercase tracking-wider mb-1">
                <ShieldCheck size={16} /> Verified Trust
              </div>
              <p className="text-xs text-[#A1A9B8]">Vetted partners with strict compliance signals.</p>
            </div>
            <div className="p-4 rounded-xl bg-[#111522] border border-[#252A3A]">
              <div className="flex items-center gap-2 text-[#4F46E5] text-xs font-semibold uppercase tracking-wider mb-1">
                <Sparkles size={16} /> Direct Access
              </div>
              <p className="text-xs text-[#A1A9B8]">Unlock decision maker contact details instantly.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


