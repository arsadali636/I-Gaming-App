"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  UserPlus,
  MessageSquare,
  Bookmark,
  BookmarkCheck,
  BadgeCheck,
  MapPin,
  Globe,
  Calendar,
  Users,
  ExternalLink,
  CreditCard,
  ShieldCheck,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { formatDate, getInitials } from "@/lib/utils";
import type { Company, CompanyContact, CompanyLicense } from "@/types";
import { apiClient } from "@/lib/api-client";

export default function CompanyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { wallet } = useAuth();
  const [company, setCompany] = useState<Company | null>(null);
  const [contacts, setContacts] = useState<CompanyContact[]>([]);
  const [licenses, setLicenses] = useState<CompanyLicense[]>([]);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [revealCost, setRevealCost] = useState(1);

  useEffect(() => {
    async function fetchCompany() {
      try {
        const data = await apiClient.get<any>(`/api/v1/companies/${id}/`);
        if (data) {
          setCompany(data.company ?? data);
          const compId = data.id || id;
          if (data.contacts) {
            setContacts(data.contacts);
          } else {
            try {
              const cData = await apiClient.get<any>(`/api/v1/companies/${compId}/contacts/`);
              setContacts(Array.isArray(cData) ? cData : cData.contacts || []);
            } catch {}
          }
          if (data.licenses) {
            setLicenses(data.licenses);
          } else {
            try {
              const lData = await apiClient.get<any>(`/api/v1/companies/${compId}/licenses/`);
              setLicenses(Array.isArray(lData) ? lData : lData.licenses || []);
            } catch {}
          }
        }
      } catch {} finally {
        setLoading(false);
      }
    }
    fetchCompany();
  }, [id]);

  useEffect(() => {
    async function checkSaved() {
      try {
        const res = await fetch(`/api/saved-companies/check/${id}`);
        if (res.ok) {
          const data = await res.json();
          setSaved(data.saved ?? false);
        }
      } catch {}
    }
    checkSaved();
  }, [id]);

  const handleToggleSave = async () => {
    const wasSaved = saved;
    setSaved(!wasSaved);
    try {
      if (wasSaved) {
        await fetch(`/api/saved-companies/${id}`, { method: "DELETE" });
      } else {
        await fetch("/api/saved-companies", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ company_id: id }),
        });
      }
    } catch {
      setSaved(wasSaved);
    }
  };

  const handleRevealContact = async (contactId: string) => {
    try {
      const res = await fetch("/api/contacts/reveal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ company_contact_id: contactId }),
      });
      if (res.ok) {
        setContacts((prev) =>
          prev.map((c) =>
            c.id === contactId ? { ...c, email: c.email } : c
          )
        );
      }
    } catch {}
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="text-center py-16">
        <h3 className="text-lg font-medium text-foreground mb-2">Company not found</h3>
        <Link href="/app/marketplace">
          <Button variant="outline" className="gap-2">
            <ArrowLeft size={16} /> Back to Marketplace
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4"
      >
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
        >
          <ArrowLeft size={18} />
        </Button>
        <div className="flex-1" />
        <Button variant="outline" size="sm" onClick={handleToggleSave} className="gap-1.5">
          {saved ? <BookmarkCheck size={14} className="text-primary" /> : <Bookmark size={14} />}
          {saved ? "Saved" : "Save"}
        </Button>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start gap-4 mb-6">
                  {company.logo_url ? (
                    <img
                      src={company.logo_url}
                      alt={company.name}
                      className="w-16 h-16 rounded-xl object-cover border border-glass-border"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary text-xl font-bold">
                      {getInitials(company.name)}
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h1 className="text-2xl font-bold text-foreground">{company.name}</h1>
                      {company.is_verified && (
                        <Badge variant="verified" className="gap-1">
                          <ShieldCheck size={12} /> Verified
                        </Badge>
                      )}
                    </div>
                    <p className="text-muted-foreground text-sm">{company.description}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                  {company.headquarters && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin size={14} /> {company.headquarters}
                    </div>
                  )}
                  {company.employee_count && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Users size={14} /> {company.employee_count}
                    </div>
                  )}
                  {company.founded_year && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar size={14} /> Founded {company.founded_year}
                    </div>
                  )}
                  {company.website && (
                    <a
                      href={company.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-neon-cyan hover:underline"
                    >
                      <Globe size={14} /> Website <ExternalLink size={10} />
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardContent className="p-6">
                <Tabs defaultValue="contacts">
                  <TabsList>
                    <TabsTrigger value="contacts">
                      Contacts ({contacts.length})
                    </TabsTrigger>
                    <TabsTrigger value="licenses">
                      Licenses ({licenses.length})
                    </TabsTrigger>
                    <TabsTrigger value="details">Details</TabsTrigger>
                  </TabsList>

                  <TabsContent value="contacts">
                    <div className="space-y-3 mt-4">
                      {contacts.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-6">
                          No contacts available for this company.
                        </p>
                      ) : (
                        contacts.map((contact) => (
                          <div
                            key={contact.id}
                            className="glass-card p-4 flex items-center gap-4"
                          >
                            <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary text-sm font-semibold shrink-0">
                              {getInitials(contact.full_name)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground">
                                {contact.full_name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {contact.position}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <a
                                href={`mailto:${contact.email}`}
                                className="text-xs text-neon-cyan hover:underline truncate max-w-[160px]"
                              >
                                {contact.email}
                              </a>
                              {contact.phone && (
                                <a
                                  href={`tel:${contact.phone}`}
                                  className="text-xs text-muted-foreground hover:text-foreground"
                                >
                                  {contact.phone}
                                </a>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="licenses">
                    <div className="space-y-3 mt-4">
                      {licenses.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-6">
                          No license information available.
                        </p>
                      ) : (
                        licenses.map((license) => (
                          <div
                            key={license.id}
                            className="glass-card p-4 flex items-center justify-between"
                          >
                            <div>
                              <p className="text-sm font-medium text-foreground">
                                {license.license_name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {license.jurisdiction}
                                {license.license_number && ` - ${license.license_number}`}
                              </p>
                            </div>
                            <Badge
                              variant={
                                license.status === "active"
                                  ? "success"
                                  : license.status === "pending"
                                    ? "warning"
                                    : "outline"
                              }
                            >
                              {license.status}
                            </Badge>
                          </div>
                        ))
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="details">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                      {company.market && (
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Market</p>
                          <p className="text-sm text-foreground">{company.market}</p>
                        </div>
                      )}
                      {company.revenue_range && (
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Revenue</p>
                          <p className="text-sm text-foreground">{company.revenue_range}</p>
                        </div>
                      )}
                      {company.employee_count && (
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Employees</p>
                          <p className="text-sm text-foreground">{company.employee_count}</p>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="space-y-4"
        >
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button className="w-full gap-2" onClick={() => {}}>
                <Eye size={16} /> Reveal Contact
                <span className="ml-auto text-xs opacity-70 flex items-center gap-1">
                  <CreditCard size={12} /> {revealCost} credit{revealCost !== 1 ? "s" : ""}
                </span>
              </Button>
              <Button variant="secondary" className="w-full gap-2" onClick={() => {}}>
                <UserPlus size={16} /> Connect
              </Button>
              <Button variant="secondary" className="w-full gap-2" onClick={() => {}}>
                <MessageSquare size={16} /> Message
              </Button>
              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={handleToggleSave}
              >
                {saved ? <BookmarkCheck size={16} className="text-primary" /> : <Bookmark size={16} />}
                {saved ? "Unsave" : "Save Company"}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Your Credits</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <p className="text-3xl font-bold text-foreground">{wallet?.balance ?? 0}</p>
                <p className="text-xs text-muted-foreground mt-1">Contact credits remaining</p>
                <Link href="/app/subscription">
                  <Button variant="outline" size="sm" className="mt-3 gap-1.5">
                    <CreditCard size={14} /> Buy More
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
