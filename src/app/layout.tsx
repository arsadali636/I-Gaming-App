import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "iGaming Connect — Global B2B Marketplace for the iGaming Industry",
    template: "%s | iGaming Connect",
  },
  description:
    "The premier B2B platform connecting sportsbook providers, casino operators, game studios, payment processors, and technology suppliers across 50+ regulated markets worldwide.",
  keywords: [
    "iGaming",
    "B2B",
    "sportsbook",
    "casino",
    "game studios",
    "platform providers",
    "PSP",
    "payments",
    "licensing",
    "compliance",
    "KYC",
    "AML",
    "operators",
    "aggregators",
  ],
  openGraph: {
    title: "iGaming Connect — Global B2B Marketplace",
    description:
      "Connect with 500+ iGaming companies. Browse providers, operators, studios, and technology companies across regulated markets.",
    type: "website",
    siteName: "iGaming Connect",
  },
  twitter: {
    card: "summary_large_image",
    title: "iGaming Connect — Global B2B Marketplace",
    description:
      "Connect with 500+ iGaming companies across 50+ regulated markets.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#050510] text-[#e8e8f0]">
        {children}
      </body>
    </html>
  );
}
