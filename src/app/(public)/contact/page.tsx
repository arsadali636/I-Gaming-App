"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Send,
  MapPin,
  Mail,
  Phone,
  Clock,
  MessageSquare,
  CheckCircle,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

const OFFICES = [
  {
    city: "Malta",
    address: "Level 3, Quantum House, Abate Rigord Street, Ta\' Xbiex XBX 1120",
    phone: "+356 2034 5678",
    email: "malta@igamingconnect.com",
    hours: "Mon-Fri, 9:00 AM - 6:00 PM (CET)",
  },
  {
    city: "London",
    address: "1 Canada Square, Canary Wharf, London E14 5AB",
    phone: "+44 20 7946 0958",
    email: "london@igamingconnect.com",
    hours: "Mon-Fri, 9:00 AM - 6:00 PM (GMT)",
  },
];

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.6, ease: "easeOut" as const },
};

export default function ContactPage() {
  const [formState, setFormState] = useState({
    name: "",
    email: "",
    company: "",
    subject: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormState((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    try {
      await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formState),
      });
      setSubmitted(true);
    } catch {
      // silent
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen">
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
        <div className="absolute top-1/3 left-1/4 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[120px]" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div {...fadeUp} className="text-center mb-16">
            <h1 className="text-4xl sm:text-5xl font-bold mb-4">
              Get in <span className="gradient-text">Touch</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              Have a question or want to discuss a partnership? We&apos;d love to
              hear from you.
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-5 gap-10 max-w-6xl mx-auto">
            <motion.div
              {...fadeUp}
              className="lg:col-span-3"
            >
              <div className="glass-card p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                    <MessageSquare size={18} className="text-primary" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-foreground">
                      Send us a message
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      We&apos;ll respond within 24 hours
                    </p>
                  </div>
                </div>

                {submitted ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center justify-center py-16 text-center"
                  >
                    <CheckCircle size={48} className="text-accent mb-4" />
                    <h3 className="text-xl font-bold text-foreground mb-2">
                      Message Sent!
                    </h3>
                    <p className="text-sm text-muted-foreground max-w-sm">
                      Thank you for reaching out. Our team will get back to you
                      shortly.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSubmitted(false);
                        setFormState({
                          name: "",
                          email: "",
                          company: "",
                          subject: "",
                          message: "",
                        });
                      }}
                      className="mt-6"
                    >
                      Send Another Message
                    </Button>
                  </motion.div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid sm:grid-cols-2 gap-5">
                      <div className="space-y-2">
                        <Label htmlFor="name">Name</Label>
                        <Input
                          id="name"
                          name="name"
                          placeholder="Your full name"
                          value={formState.name}
                          onChange={handleChange}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          placeholder="you@company.com"
                          value={formState.email}
                          onChange={handleChange}
                          required
                        />
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-5">
                      <div className="space-y-2">
                        <Label htmlFor="company">Company</Label>
                        <Input
                          id="company"
                          name="company"
                          placeholder="Your company name"
                          value={formState.company}
                          onChange={handleChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="subject">Subject</Label>
                        <Input
                          id="subject"
                          name="subject"
                          placeholder="How can we help?"
                          value={formState.subject}
                          onChange={handleChange}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message">Message</Label>
                      <Textarea
                        id="message"
                        name="message"
                        placeholder="Tell us about your inquiry..."
                        rows={5}
                        value={formState.message}
                        onChange={handleChange}
                        required
                      />
                    </div>

                    <Button
                      type="submit"
                      size="lg"
                      className="w-full bg-gradient-to-r from-primary to-secondary"
                      disabled={sending}
                    >
                      {sending ? (
                        "Sending..."
                      ) : (
                        <>
                          Send Message
                          <Send size={16} />
                        </>
                      )}
                    </Button>
                  </form>
                )}
              </div>
            </motion.div>

            <motion.div
              {...fadeUp}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="lg:col-span-2 space-y-6"
            >
              {OFFICES.map((office) => (
                <div key={office.city} className="glass-card p-6">
                  <h3 className="text-lg font-bold text-foreground mb-4">
                    {office.city}
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <MapPin
                        size={16}
                        className="text-muted-foreground mt-0.5 flex-shrink-0"
                      />
                      <p className="text-sm text-muted-foreground">
                        {office.address}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Phone
                        size={16}
                        className="text-muted-foreground flex-shrink-0"
                      />
                      <a
                        href={`tel:${office.phone}`}
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {office.phone}
                      </a>
                    </div>
                    <div className="flex items-center gap-3">
                      <Mail
                        size={16}
                        className="text-muted-foreground flex-shrink-0"
                      />
                      <a
                        href={`mailto:${office.email}`}
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {office.email}
                      </a>
                    </div>
                    <div className="flex items-center gap-3">
                      <Clock
                        size={16}
                        className="text-muted-foreground flex-shrink-0"
                      />
                      <p className="text-sm text-muted-foreground">
                        {office.hours}
                      </p>
                    </div>
                  </div>
                </div>
              ))}

              <div className="glass-card p-6">
                <h3 className="text-sm font-semibold text-foreground mb-3">
                  General Inquiries
                </h3>
                <a
                  href="mailto:info@igamingconnect.com"
                  className="text-sm text-primary hover:text-primary/80 transition-colors"
                >
                  info@igamingconnect.com
                </a>
              </div>

              <div className="glass-card p-6">
                <h3 className="text-sm font-semibold text-foreground mb-3">
                  Support
                </h3>
                <a
                  href="mailto:support@igamingconnect.com"
                  className="text-sm text-primary hover:text-primary/80 transition-colors"
                >
                  support@igamingconnect.com
                </a>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}
