"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Search,
  Mail,
  Phone,
  Building2,
  StickyNote,
  Download,
  X,
  Check,
  Edit3,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatDate } from "@/lib/utils";
import { apiClient } from "@/lib/api-client";

interface RevealedContact {
  id: string;
  company_contact_id: string;
  full_name: string;
  position: string;
  email: string;
  phone?: string;
  company_name: string;
  company_id: string;
  company_slug?: string;
  revealed_at: string;
  notes?: string;
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState<RevealedContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<RevealedContact | null>(null);
  const [noteText, setNoteText] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchContacts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      const data = await apiClient.get<any>(`/api/v1/contacts/reveal/?${params.toString()}`);
      if (data) {
        setContacts(data.contacts ?? []);
      }
    } catch {} finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  const openNoteDialog = (contact: RevealedContact) => {
    setSelectedContact(contact);
    setNoteText(contact.notes ?? "");
    setNoteDialogOpen(true);
  };

  const handleSaveNote = async () => {
    if (!selectedContact) return;
    setSaving(true);
    try {
      setContacts((prev) =>
        prev.map((c) =>
          c.id === selectedContact.id ? { ...c, notes: noteText } : c
        )
      );
      setNoteDialogOpen(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h2 className="text-2xl font-bold text-foreground">My Contacts</h2>
          <p className="text-muted-foreground mt-1">
            {contacts.length} revealed contact{contacts.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button variant="outline" size="sm" className="gap-2" disabled>
          <Download size={14} /> Export CSV
        </Button>
      </motion.div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search contacts..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : contacts.length === 0 ? (
        <div className="text-center py-16">
          <Mail size={48} className="mx-auto text-muted-foreground/40 mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-1">No contacts yet</h3>
          <p className="text-sm text-muted-foreground">
            Reveal contacts from the marketplace to see them here.
          </p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block">
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-glass-border">
                        <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Person
                        </th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Company
                        </th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Email
                        </th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Phone
                        </th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Revealed
                        </th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Notes
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {contacts.map((contact) => (
                        <tr
                          key={contact.id}
                          className="border-b border-glass-border last:border-0 hover:bg-white/[0.02] transition-colors"
                        >
                          <td className="px-4 py-3">
                            <div>
                              <p className="text-sm font-medium text-foreground">
                                {contact.full_name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {contact.position}
                              </p>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">
                            {contact.company_name}
                          </td>
                          <td className="px-4 py-3">
                            <a
                              href={`mailto:${contact.email}`}
                              className="text-sm text-neon-cyan hover:underline"
                            >
                              {contact.email}
                            </a>
                          </td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">
                            {contact.phone ?? "-"}
                          </td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">
                            {formatDate(contact.revealed_at)}
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => openNoteDialog(contact)}
                              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
                            >
                              {contact.notes ? (
                                <StickyNote size={14} className="text-primary" />
                              ) : (
                                <Edit3 size={14} />
                              )}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {contacts.map((contact) => (
              <Card key={contact.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {contact.full_name}
                      </p>
                      <p className="text-xs text-muted-foreground">{contact.position}</p>
                    </div>
                    <Badge variant="secondary" className="text-[10px]">
                      {formatDate(contact.revealed_at)}
                    </Badge>
                  </div>
                  <div className="space-y-1.5 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Building2 size={12} /> {contact.company_name}
                    </div>
                    <a
                      href={`mailto:${contact.email}`}
                      className="flex items-center gap-2 text-neon-cyan"
                    >
                      <Mail size={12} /> {contact.email}
                    </a>
                    {contact.phone && (
                      <a
                        href={`tel:${contact.phone}`}
                        className="flex items-center gap-2 text-muted-foreground"
                      >
                        <Phone size={12} /> {contact.phone}
                      </a>
                    )}
                  </div>
                  <button
                    onClick={() => openNoteDialog(contact)}
                    className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {contact.notes ? <StickyNote size={12} className="text-primary" /> : <Edit3 size={12} />}
                    {contact.notes ? "View Note" : "Add Note"}
                  </button>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      <Dialog open={noteDialogOpen} onOpenChange={setNoteDialogOpen}>
        <DialogContent onClose={() => setNoteDialogOpen(false)}>
          <DialogHeader>
            <DialogTitle>
              Notes - {selectedContact?.full_name}
            </DialogTitle>
          </DialogHeader>
          <Textarea
            placeholder="Add notes about this contact..."
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            rows={4}
          />
          <div className="flex justify-end gap-2 mt-2">
            <Button variant="ghost" size="sm" onClick={() => setNoteDialogOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSaveNote} disabled={saving}>
              {saving ? "Saving..." : "Save Note"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
