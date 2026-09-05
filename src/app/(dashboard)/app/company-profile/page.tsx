"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Building2,
  Globe,
  Calendar,
  MapPin,
  Users,
  DollarSign,
  ExternalLink,
  Pencil,
  Shield,
  Package,
  Briefcase,
  Mail,
  Phone,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import type { Company, CompanyContact, CompanyMember, Category, CompanyLicense } from "@/types";
import { apiClient } from "@/lib/api-client";

interface CompanyProfile extends Company {
  categories?: Category[];
  company_contacts?: CompanyContact[];
  company_members?: (CompanyMember & { users?: { id: string; full_name: string; email: string; avatar_url?: string } })[];
  company_licenses?: CompanyLicense[];
  products?: { id: string; name: string }[];
  services?: { id: string; name: string }[];
}

const statusColors: Record<string, string> = {
  pending: "warning",
  approved: "success",
  rejected: "destructive",
  suspended: "destructive",
};

export default function CompanyProfilePage() {
  const { user } = useAuth();
  const [company, setCompany] = useState<CompanyProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCompany() {
      if (!user?.company_id) {
        setLoading(false);
        return;
      }
      try {
        const json = await apiClient.get<any>(`/api/v1/companies/${user.company_id}/`);
        if (json) {
          const normalized: CompanyProfile = {
            ...json,
            id: json.id,
            name: json.name,
            slug: json.slug,
            description: json.description,
            website: json.website,
            country: json.country_detail?.name || json.country || "",
            founded_year: json.founded_year,
            market: json.market,
            employee_count: json.employee_count,
            revenue_range: json.revenue_range,
            logo_url: json.logo_url,
            is_verified: json.is_verified,
            status: json.status || "approved",
            categories: json.categories_detail || json.categories || [],
            company_contacts: (json.contacts || []).map((c: any) => ({
              id: c.id,
              full_name: c.full_name,
              position: c.position,
              email: c.email,
              phone: c.phone,
            })),
            company_members: (json.members || []).map((m: any) => ({
              id: m.id,
              role: m.role,
              users: m.user_detail || { full_name: m.full_name, email: m.email },
            })),
            company_licenses: (json.licenses || []).map((l: any) => ({
              id: l.id,
              license_name: l.license_name || l.name,
              jurisdiction: l.jurisdiction,
              status: l.status,
              license_number: l.license_number || l.number,
            })),
            products: (json.products_detail || json.products || []).map((p: any) => ({ id: p.id || p.name, name: p.name })),
            services: (json.services_detail || json.services || []).map((s: any) => ({ id: s.id || s.name, name: s.name })),
          };
          setCompany(normalized);
        }
      } catch {} finally {
        setLoading(false);
      }
    }
    fetchCompany();
  }, [user?.company_id]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center py-24 text-center"
      >
        <div className="mb-6 rounded-full bg-primary/10 p-6">
          <Building2 size={40} className="text-primary" />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Create Your Company Profile
        </h2>
        <p className="text-muted-foreground max-w-md mb-8">
          Set up your company profile to connect with other iGaming professionals,
          showcase your products, and find business opportunities.
        </p>
        <Link href="/app/company-profile/edit">
          <Button variant="gradient" size="lg" className="gap-2">
            <Building2 size={18} />
            Get Started
          </Button>
        </Link>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h2 className="text-2xl font-bold text-foreground">{company.name}</h2>
          <p className="text-muted-foreground mt-1">{company.description}</p>
        </div>
        <Link href="/app/company-profile/edit">
          <Button variant="outline" className="gap-2">
            <Pencil size={14} />
            Edit Profile
          </Button>
        </Link>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Status", value: company.status, icon: Shield },
          { label: "Verification", value: company.verification_status, icon: Shield },
          { label: "Team Members", value: company.company_members?.length ?? 0, icon: Users },
          { label: "Contacts", value: company.company_contacts?.length ?? 0, icon: Mail },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                    <stat.icon size={18} className="text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                    <p className="text-sm font-semibold text-foreground capitalize">
                      {stat.value}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 size={16} className="text-primary" />
                Company Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {company.website && (
                <div className="flex items-center gap-3 text-sm">
                  <Globe size={14} className="text-muted-foreground shrink-0" />
                  <a
                    href={company.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline flex items-center gap-1 truncate"
                  >
                    {company.website.replace(/^https?:\/\//, "")}
                    <ExternalLink size={12} />
                  </a>
                </div>
              )}
              {company.founded_year && (
                <div className="flex items-center gap-3 text-sm">
                  <Calendar size={14} className="text-muted-foreground shrink-0" />
                  <span className="text-foreground">Founded {company.founded_year}</span>
                </div>
              )}
              {company.headquarters && (
                <div className="flex items-center gap-3 text-sm">
                  <MapPin size={14} className="text-muted-foreground shrink-0" />
                  <span className="text-foreground">{company.headquarters}</span>
                </div>
              )}
              {company.employee_count && (
                <div className="flex items-center gap-3 text-sm">
                  <Users size={14} className="text-muted-foreground shrink-0" />
                  <span className="text-foreground">{company.employee_count} employees</span>
                </div>
              )}
              {company.revenue_range && (
                <div className="flex items-center gap-3 text-sm">
                  <DollarSign size={14} className="text-muted-foreground shrink-0" />
                  <span className="text-foreground">{company.revenue_range}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Briefcase size={16} className="text-primary" />
                Categories
              </CardTitle>
            </CardHeader>
            <CardContent>
              {company.categories && company.categories.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {company.categories.map((cat) => (
                    <Badge key={cat.id} variant="secondary">
                      {cat.name}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No categories assigned.</p>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Package size={16} className="text-primary" />
                Products & Services
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {company.products && company.products.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Products</p>
                  <div className="flex flex-wrap gap-2">
                    {company.products.map((p) => (
                      <Badge key={p.id} variant="outline">{p.name}</Badge>
                    ))}
                  </div>
                </div>
              )}
              {company.services && company.services.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Services</p>
                  <div className="flex flex-wrap gap-2">
                    {company.services.map((s) => (
                      <Badge key={s.id} variant="outline">{s.name}</Badge>
                    ))}
                  </div>
                </div>
              )}
              {(!company.products || company.products.length === 0) &&
                (!company.services || company.services.length === 0) && (
                  <p className="text-sm text-muted-foreground">No products or services listed.</p>
                )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Shield size={16} className="text-primary" />
                Licenses
              </CardTitle>
            </CardHeader>
            <CardContent>
              {company.company_licenses && company.company_licenses.length > 0 ? (
                <div className="space-y-2">
                  {company.company_licenses.map((lic) => (
                    <div key={lic.id} className="flex items-center justify-between text-sm">
                      <div>
                        <p className="text-foreground font-medium">{lic.license_name}</p>
                        <p className="text-xs text-muted-foreground">{lic.jurisdiction}</p>
                      </div>
                      <Badge
                        variant={
                          lic.status === "active"
                            ? "success"
                            : lic.status === "pending"
                              ? "warning"
                              : "destructive"
                        }
                      >
                        {lic.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No licenses added.</p>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {company.company_contacts && company.company_contacts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Mail size={16} className="text-primary" />
                Contacts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {company.company_contacts.map((contact) => (
                  <div
                    key={contact.id}
                    className="flex items-center gap-3 rounded-lg border border-border/50 p-3 hover:bg-white/[0.02] transition-colors"
                  >
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-sm font-medium text-muted-foreground">
                      {contact.full_name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {contact.full_name}
                      </p>
                      <p className="text-xs text-muted-foreground">{contact.position}</p>
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Mail size={12} />
                      {contact.phone && <Phone size={12} />}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {company.company_members && company.company_members.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Users size={16} className="text-primary" />
                Team Members
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                {company.company_members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center gap-2 rounded-lg border border-border/50 px-3 py-2"
                  >
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground">
                      {member.users?.full_name?.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() ?? "??"}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {member.users?.full_name ?? "Unknown"}
                      </p>
                      <Badge
                        variant={member.role === "owner" ? "default" : "secondary"}
                        className="text-[10px]"
                      >
                        {member.role}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
              <Link
                href="/app/company-profile/team"
                className="mt-4 inline-flex items-center gap-1 text-sm text-primary hover:underline"
              >
                Manage team <ArrowRight size={14} />
              </Link>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
