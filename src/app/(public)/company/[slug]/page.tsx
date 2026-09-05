"use client";

import { useState, useEffect, use } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  BadgeCheck,
  Globe,
  Building2,
  Calendar,
  Users,
  ExternalLink,
  ArrowLeft,
  Shield,
  Package,
  Briefcase,
  FileCheck,
  MapPin,
  Star,
} from "lucide-react";
import { cn, getInitials } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import ContactMasked from "@/components/marketplace/contact-masked";
import { apiClient } from "@/lib/api-client";

interface License {
  name: string;
  jurisdiction: string;
  status: "active" | "pending" | "expired";
  number?: string;
}

interface TeamMember {
  name: string;
  title: string;
  email: string;
  phone?: string;
  is_revealed: boolean;
}

interface Product {
  name: string;
  description: string;
  category: string;
}

interface Service {
  name: string;
  description: string;
}

interface Company {
  name: string;
  slug: string;
  logo_url?: string | null;
  description?: string | null;
  website?: string | null;
  country?: string | { name?: string; code?: string } | null;
  founded_year?: number | null;
  market?: string | null;
  employee_count?: string | null;
  categories?: string[];
  is_verified?: boolean;
  is_featured?: boolean;
  products?: Product[];
  services?: Service[];
  licenses?: License[];
  team?: TeamMember[];
}

function getCountryName(c?: string | { name?: string; code?: string } | null): string {
  if (!c) return "";
  if (typeof c === "string") return c;
  return c.name || c.code || "";
}

export default function CompanyProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCompany() {
      try {
        const json = await apiClient.get<any>(`/api/v1/companies/${slug}/`);
        if (json) {
          // Normalize Django detail response for company profile UI
          const normalized = {
            ...json,
            country: json.country_detail?.name || json.country_detail?.code || json.country || "",
            categories: json.categories_detail ? json.categories_detail.map((c: any) => c.name) : json.categories || [],
            products: json.products_detail || json.products || [],
            services: json.services_detail || json.services || [],
            licenses: json.licenses ? json.licenses.map((l: any) => ({
              name: l.license_name || l.name,
              jurisdiction: l.jurisdiction,
              status: l.status,
              number: l.license_number || l.number,
            })) : [],
            team: json.contacts ? json.contacts.map((c: any) => ({
              name: c.full_name,
              title: c.position,
              email: c.email,
              phone: c.phone,
              is_revealed: !c.email.includes("***"),
            })) : json.team || [],
          };
          setCompany(normalized);
        }
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }
    fetchCompany();
  }, [slug]);

  const handleReveal = (email: string) => {
    // reveal contact logic
    console.log("Reveal contact:", email);
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
          <Skeleton className="h-6 w-32 mb-8" />
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="glass-card p-8">
                <div className="flex items-center gap-4 mb-6">
                  <Skeleton className="w-20 h-20 rounded-xl" />
                  <div className="space-y-2">
                    <Skeleton className="h-7 w-48" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                </div>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-3/4" />
              </div>
              <div className="glass-card p-8 space-y-4">
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
              </div>
            </div>
            <div className="space-y-4">
              <Skeleton className="glass-card h-48" />
              <Skeleton className="glass-card h-32" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Building2 size={48} className="mx-auto mb-4 text-muted-foreground" />
          <h1 className="text-2xl font-bold mb-2">Company Not Found</h1>
          <p className="text-muted-foreground mb-6">
            The company you&apos;re looking for doesn&apos;t exist or has been removed.
          </p>
          <Link href="/marketplace">
            <Button>Browse Marketplace</Button>
          </Link>
        </div>
      </div>
    );
  }

  const countryName = getCountryName(company.country);

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <Link
          href="/marketplace"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft size={16} />
          Back to Marketplace
        </Link>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="glass-card p-8"
            >
              <div className="flex items-start gap-5">
                {company.logo_url ? (
                  <img
                    src={company.logo_url}
                    alt={company.name}
                    className="w-20 h-20 rounded-xl object-cover border border-glass-border"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary text-2xl font-bold">
                    {getInitials(company.name)}
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h1 className="text-2xl font-bold text-foreground">
                      {company.name}
                    </h1>
                    {company.is_verified && (
                      <BadgeCheck size={22} className="text-accent" />
                    )}
                  </div>
                  {countryName && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1.5 mb-3">
                      <MapPin size={14} />
                      {countryName}
                    </p>
                  )}
                  {company.website && (
                    <a
                      href={company.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 transition-colors"
                    >
                      <Globe size={14} />
                      {company.website.replace(/^https?:\/\//, "")}
                      <ExternalLink size={12} />
                    </a>
                  )}
                </div>
              </div>

              {company.description && (
                <p className="mt-6 text-muted-foreground leading-relaxed">
                  {company.description}
                </p>
              )}

              {company.categories && company.categories.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {company.categories.map((cat) => (
                    <Badge key={cat} variant="default">
                      {cat}
                    </Badge>
                  ))}
                </div>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <Tabs defaultValue="overview">
                <TabsList>
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="products">Products</TabsTrigger>
                  <TabsTrigger value="services">Services</TabsTrigger>
                  <TabsTrigger value="licenses">Licenses</TabsTrigger>
                  <TabsTrigger value="team">Team</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="glass-card p-6 mt-4">
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-foreground mb-3">
                        About
                      </h3>
                      <p className="text-muted-foreground leading-relaxed">
                        {company.description || "No description available."}
                      </p>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      {company.market && (
                        <div className="glass-card p-4">
                          <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1">
                            Market
                          </p>
                          <p className="text-sm font-medium text-foreground">
                            {company.market}
                          </p>
                        </div>
                      )}
                      {company.employee_count && (
                        <div className="glass-card p-4">
                          <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1">
                            Team Size
                          </p>
                          <p className="text-sm font-medium text-foreground">
                            {company.employee_count}
                          </p>
                        </div>
                      )}
                      {company.founded_year && (
                        <div className="glass-card p-4">
                          <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1">
                            Founded
                          </p>
                          <p className="text-sm font-medium text-foreground">
                            {company.founded_year}
                          </p>
                        </div>
                      )}
                      {countryName && (
                        <div className="glass-card p-4">
                          <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1">
                            Headquarters
                          </p>
                          <p className="text-sm font-medium text-foreground">
                            {countryName}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="products" className="glass-card p-6 mt-4">
                  {company.products && company.products.length > 0 ? (
                    <div className="space-y-4">
                      {company.products.map((product, i) => (
                        <div
                          key={i}
                          className="glass-card p-4 border border-glass-border"
                        >
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                              <Package size={14} className="text-primary" />
                            </div>
                            <div>
                              <h4 className="text-sm font-semibold text-foreground">
                                {product.name}
                              </h4>
                              {product.category && (
                                <Badge variant="secondary" className="mt-1 text-[10px]">
                                  {product.category}
                                </Badge>
                              )}
                              {product.description && (
                                <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                                  {product.description}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No products listed yet.
                    </p>
                  )}
                </TabsContent>

                <TabsContent value="services" className="glass-card p-6 mt-4">
                  {company.services && company.services.length > 0 ? (
                    <div className="space-y-4">
                      {company.services.map((service, i) => (
                        <div
                          key={i}
                          className="glass-card p-4 border border-glass-border"
                        >
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-lg bg-secondary/10 border border-secondary/20 flex items-center justify-center flex-shrink-0">
                              <Briefcase size={14} className="text-secondary" />
                            </div>
                            <div>
                              <h4 className="text-sm font-semibold text-foreground">
                                {service.name}
                              </h4>
                              {service.description && (
                                <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                                  {service.description}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No services listed yet.
                    </p>
                  )}
                </TabsContent>

                <TabsContent value="licenses" className="glass-card p-6 mt-4">
                  {company.licenses && company.licenses.length > 0 ? (
                    <div className="space-y-3">
                      {company.licenses.map((license, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between p-4 glass-card border border-glass-border"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center">
                              <FileCheck size={14} className="text-accent" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-foreground">
                                {license.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {license.jurisdiction}
                                {license.number && ` - ${license.number}`}
                              </p>
                            </div>
                          </div>
                          <Badge
                            variant={
                              license.status === "active"
                                ? "success"
                                : license.status === "pending"
                                ? "warning"
                                : "destructive"
                            }
                          >
                            {license.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No licenses listed yet.
                    </p>
                  )}
                </TabsContent>

                <TabsContent value="team" className="glass-card p-6 mt-4">
                  {company.team && company.team.length > 0 ? (
                    <div className="space-y-3">
                      {company.team.map((member, i) => (
                        <div key={i} className="glass-card p-4 border border-glass-border">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary text-sm font-bold">
                              {getInitials(member.name)}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-foreground">
                                {member.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {member.title}
                              </p>
                            </div>
                          </div>
                          <ContactMasked
                            email={member.email}
                            phone={member.phone}
                            is_revealed={member.is_revealed}
                            onReveal={() => handleReveal(member.email)}
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No team members listed yet.
                    </p>
                  )}
                </TabsContent>
              </Tabs>
            </motion.div>
          </div>

          <motion.aside
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="space-y-4"
          >
            <div className="glass-card p-6 space-y-4">
              <h3 className="text-sm font-semibold text-foreground">
                Company Info
              </h3>
              <div className="space-y-3">
                {countryName && (
                  <div className="flex items-center gap-3 text-sm">
                    <MapPin size={14} className="text-muted-foreground" />
                    <span className="text-muted-foreground">{countryName}</span>
                  </div>
                )}
                {company.founded_year && (
                  <div className="flex items-center gap-3 text-sm">
                    <Calendar size={14} className="text-muted-foreground" />
                    <span className="text-muted-foreground">
                      Founded {company.founded_year}
                    </span>
                  </div>
                )}
                {company.market && (
                  <div className="flex items-center gap-3 text-sm">
                    <Globe size={14} className="text-muted-foreground" />
                    <span className="text-muted-foreground">{company.market}</span>
                  </div>
                )}
                {company.employee_count && (
                  <div className="flex items-center gap-3 text-sm">
                    <Users size={14} className="text-muted-foreground" />
                    <span className="text-muted-foreground">
                      {company.employee_count}
                    </span>
                  </div>
                )}
                {company.is_verified && (
                  <div className="flex items-center gap-3 text-sm">
                    <Shield size={14} className="text-accent" />
                    <span className="text-accent">Verified Company</span>
                  </div>
                )}
                {company.is_featured && (
                  <div className="flex items-center gap-3 text-sm">
                    <Star size={14} className="text-yellow-400" />
                    <span className="text-yellow-400">Featured</span>
                  </div>
                )}
              </div>
            </div>

            <div className="glass-card p-6 space-y-3">
              <Button className="w-full" size="lg">
                Request Introduction
              </Button>
              <Button variant="outline" className="w-full" size="lg">
                Save Company
              </Button>
            </div>

            {company.website && (
              <div className="glass-card p-6">
                <a
                  href={company.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors"
                >
                  <Globe size={14} />
                  Visit Website
                  <ExternalLink size={12} />
                </a>
              </div>
            )}
          </motion.aside>
        </div>
      </div>
    </div>
  );
}
