"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Lightbulb,
  Shield,
  Globe2,
  Scale,
  Users,
  Target,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const VALUES = [
  {
    icon: Lightbulb,
    title: "Innovation",
    description:
      "We continuously evolve our platform with cutting-edge technology to deliver the most advanced B2B networking experience in iGaming.",
    color: "#6c5ce7",
  },
  {
    icon: Shield,
    title: "Trust",
    description:
      "Every company on our platform is verified. We maintain the highest standards of data accuracy and security to build lasting trust.",
    color: "#00d2ff",
  },
  {
    icon: Globe2,
    title: "Global Reach",
    description:
      "Connecting businesses across 50+ regulated markets worldwide, breaking down geographical barriers in the iGaming industry.",
    color: "#00ffc8",
  },
  {
    icon: Scale,
    title: "Compliance",
    description:
      "We understand the regulatory landscape and ensure our platform meets the highest compliance standards across all jurisdictions.",
    color: "#fd79a8",
  },
];

const TEAM_MEMBERS = [
  { name: "Alexandra Chen", role: "CEO & Co-Founder" },
  { name: "Marcus Weber", role: "CTO & Co-Founder" },
  { name: "Sarah Mitchell", role: "VP of Business Development" },
  { name: "David Okafor", role: "Head of Product" },
  { name: "Elena Rossi", role: "Head of Operations" },
  { name: "James Patel", role: "Lead Engineer" },
];

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.6, ease: "easeOut" as const },
};

export default function AboutPage() {
  return (
    <div className="min-h-screen">
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
        <div className="absolute top-1/3 left-1/4 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-secondary/5 rounded-full blur-[100px]" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div {...fadeUp} className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass border border-primary/20 text-xs text-primary mb-6">
              <Zap size={12} className="text-accent" />
              <span>Founded in 2024</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              Connecting the{" "}
              <span className="gradient-text">iGaming Industry</span>
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              iGaming Connect is the premier B2B networking platform built
              exclusively for the iGaming industry. We bridge the gap between
              operators, providers, studios, and technology partners across the
              globe.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="py-20 border-t border-glass-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div {...fadeUp}>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass border border-secondary/20 text-xs text-secondary mb-4">
                <Target size={12} />
                <span>Our Mission</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold mb-6">
                Empowering partnerships that{" "}
                <span className="gradient-text">shape the future</span>
              </h2>
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p>
                  The iGaming industry is one of the fastest-growing sectors in
                  the world, yet finding the right business partners remains
                  challenging. Fragmented networks, outdated directories, and
                  lack of transparency create unnecessary friction.
                </p>
                <p>
                  We built iGaming Connect to solve this problem. Our platform
                  brings together verified companies, provides deep market
                  intelligence, and enables meaningful connections that drive
                  real business growth.
                </p>
                <p>
                  Whether you&apos;re an operator looking for a new game provider, a
                  studio seeking distribution partners, or a technology company
                  targeting the iGaming vertical &mdash; we&apos;re here to make those
                  connections happen.
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="glass-card p-8 relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5" />
              <div className="relative z-10 grid grid-cols-2 gap-6">
                {[
                  { value: "500+", label: "Companies" },
                  { value: "50+", label: "Markets" },
                  { value: "2000+", label: "Connections Made" },
                  { value: "98%", label: "Satisfaction Rate" },
                ].map((stat, i) => (
                  <div key={i} className="text-center p-4">
                    <div className="text-3xl font-bold gradient-text mb-1">
                      {stat.value}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-20 border-t border-glass-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeUp} className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Our <span className="gradient-text">Values</span>
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              The principles that guide everything we do.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {VALUES.map((value, i) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="glass-card p-6 group hover:border-primary/30 transition-all duration-300 relative overflow-hidden"
              >
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{
                    background: `radial-gradient(circle at 50% 0%, ${value.color}15, transparent 70%)`,
                  }}
                />
                <div className="relative z-10">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-all duration-300 group-hover:scale-110"
                    style={{
                      background: `${value.color}15`,
                      border: `1px solid ${value.color}30`,
                    }}
                  >
                    <value.icon size={22} style={{ color: value.color }} />
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-2">
                    {value.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {value.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 border-t border-glass-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeUp} className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Meet Our <span className="gradient-text">Team</span>
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Passionate professionals dedicated to transforming iGaming
              networking.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {TEAM_MEMBERS.map((member, i) => (
              <motion.div
                key={member.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className="glass-card p-6 text-center group hover:border-primary/30 transition-all duration-300"
              >
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 border border-primary/20 flex items-center justify-center mx-auto mb-4 text-xl font-bold text-foreground group-hover:scale-105 transition-transform duration-300">
                  {member.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </div>
                <h3 className="font-semibold text-foreground mb-1">
                  {member.name}
                </h3>
                <p className="text-sm text-muted-foreground">{member.role}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-primary/5 via-transparent to-transparent" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-primary/10 rounded-full blur-[100px]" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            {...fadeUp}
            className="text-center max-w-2xl mx-auto glass-card p-12"
          >
            <Users size={32} className="mx-auto mb-4 text-primary" />
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Join the <span className="gradient-text">network</span>
            </h2>
            <p className="text-muted-foreground mb-8 leading-relaxed">
              Whether you&apos;re listing your company or searching for partners,
              iGaming Connect is where the industry connects.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/register">
                <Button size="lg" className="bg-gradient-to-r from-primary to-secondary">
                  Get Started
                  <ArrowRight size={16} />
                </Button>
              </Link>
              <Link href="/marketplace">
                <Button variant="outline" size="lg">
                  Browse Companies
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
