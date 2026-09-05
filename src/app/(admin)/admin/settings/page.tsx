"use client";

import { useState } from "react";
import { Save, Settings, Mail, Wrench, CreditCard, ToggleLeft, ToggleRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

interface SettingsState {
  siteName: string;
  siteDescription: string;
  siteLogo: string;
  maintenanceMode: boolean;
  featureFlags: {
    marketplace: boolean;
    messaging: boolean;
    opportunities: boolean;
    contactReveals: boolean;
  };
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<SettingsState>({
    siteName: "iGaming Connect",
    siteDescription: "The premier B2B networking platform for the iGaming industry",
    siteLogo: "",
    maintenanceMode: false,
    featureFlags: {
      marketplace: true,
      messaging: true,
      opportunities: true,
      contactReveals: true,
    },
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      // silently fail
    } finally {
      setSaving(false);
    }
  }

  function toggleFeatureFlag(key: keyof typeof settings.featureFlags) {
    setSettings((s) => ({
      ...s,
      featureFlags: {
        ...s.featureFlags,
        [key]: !s.featureFlags[key],
      },
    }));
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground mt-1">
            Platform configuration and settings
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? "Saving..." : saved ? "Saved!" : "Save Changes"}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-primary" />
              General Settings
            </CardTitle>
            <CardDescription>Basic platform configuration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">
                Site Name
              </label>
              <Input
                value={settings.siteName}
                onChange={(e) =>
                  setSettings({ ...settings, siteName: e.target.value })
                }
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">
                Site Description
              </label>
              <Textarea
                value={settings.siteDescription}
                onChange={(e) =>
                  setSettings({ ...settings, siteDescription: e.target.value })
                }
                rows={3}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">
                Site Logo URL
              </label>
              <Input
                value={settings.siteLogo}
                onChange={(e) =>
                  setSettings({ ...settings, siteLogo: e.target.value })
                }
                placeholder="https://..."
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5 text-primary" />
              Maintenance
            </CardTitle>
            <CardDescription>Platform maintenance controls</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border border-border/50 bg-glass-bg/30 p-4">
              <div>
                <p className="text-sm font-medium text-foreground">
                  Maintenance Mode
                </p>
                <p className="text-xs text-muted-foreground">
                  When enabled, only admins can access the platform
                </p>
              </div>
              <button
                onClick={() =>
                  setSettings({ ...settings, maintenanceMode: !settings.maintenanceMode })
                }
                className="shrink-0"
              >
                {settings.maintenanceMode ? (
                  <ToggleRight className="h-8 w-8 text-primary" />
                ) : (
                  <ToggleLeft className="h-8 w-8 text-muted-foreground" />
                )}
              </button>
            </div>
            {settings.maintenanceMode && (
              <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-3">
                <p className="text-xs text-yellow-400">
                  Maintenance mode is active. Non-admin users cannot access the platform.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" />
              Email Settings
            </CardTitle>
            <CardDescription>Email configuration (placeholder)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">
                SMTP Host
              </label>
              <Input placeholder="smtp.example.com" disabled />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">
                SMTP Port
              </label>
              <Input placeholder="587" disabled />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">
                From Email
              </label>
              <Input placeholder="noreply@igamingconnect.com" disabled />
            </div>
            <Badge variant="outline">Coming soon</Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              Stripe Settings
            </CardTitle>
            <CardDescription>Payment processing configuration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-border/50 bg-glass-bg/30 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Publishable Key
                </span>
                <span className="text-sm text-foreground font-mono">
                  pk_live_••••••••
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Secret Key
                </span>
                <span className="text-sm text-foreground font-mono">
                  sk_live_••••••••
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Webhook Secret
                </span>
                <span className="text-sm text-foreground font-mono">
                  whsec_••••••••
                </span>
              </div>
            </div>
            <Badge variant="success">Connected</Badge>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Feature Flags</CardTitle>
          <CardDescription>Toggle platform features on or off</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { key: "marketplace" as const, label: "Marketplace", desc: "Company directory and browsing" },
              { key: "messaging" as const, label: "Messaging", desc: "Direct messaging between users" },
              { key: "opportunities" as const, label: "Opportunities", desc: "Job and partnership listings" },
              { key: "contactReveals" as const, label: "Contact Reveals", desc: "Reveal contact information" },
            ].map((flag) => (
              <div
                key={flag.key}
                className="flex items-center justify-between rounded-lg border border-border/50 bg-glass-bg/30 p-4"
              >
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {flag.label}
                  </p>
                  <p className="text-xs text-muted-foreground">{flag.desc}</p>
                </div>
                <button onClick={() => toggleFeatureFlag(flag.key)} className="shrink-0">
                  {settings.featureFlags[flag.key] ? (
                    <ToggleRight className="h-8 w-8 text-accent" />
                  ) : (
                    <ToggleLeft className="h-8 w-8 text-muted-foreground" />
                  )}
                </button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
