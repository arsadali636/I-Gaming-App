"use client";

import { useEffect, useState } from "react";
import {
  Calendar,
  Plus,
  Edit2,
  Trash2,
  Star,
  Search,
  Tag,
  MapPin,
  Globe,
  FolderPlus,
  ExternalLink,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface EventCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  status: string;
  sort_order: number;
}

interface EventItem {
  id: string;
  title: string;
  slug: string;
  description: string;
  featured_image: string;
  category_id: string;
  category_name?: string;
  event_type: string;
  start_date: string;
  end_date: string;
  location: string;
  city: string;
  country: string;
  website_url: string;
  registration_url: string;
  status: string;
  is_featured: number;
  featured_order: number;
}

export default function AdminEventsPage() {
  const [activeTab, setActiveTab] = useState<"events" | "categories">("events");

  // Data states
  const [events, setEvents] = useState<EventItem[]>([]);
  const [categories, setCategories] = useState<EventCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Modal states
  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventItem | null>(null);
  const [editingCategory, setEditingCategory] = useState<EventCategory | null>(null);

  // Form states for Event
  const [eventForm, setEventForm] = useState({
    title: "",
    slug: "",
    description: "",
    featured_image: "",
    category_id: "",
    event_type: "Conference & Expo",
    start_date: "",
    end_date: "",
    location: "",
    city: "",
    country: "",
    website_url: "",
    registration_url: "",
    status: "published",
    is_featured: false,
    featured_order: 0,
  });

  // Form states for Category
  const [categoryForm, setCategoryForm] = useState({
    name: "",
    slug: "",
    description: "",
    status: "active",
    sort_order: 0,
  });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);
      const [evtRes, catRes] = await Promise.all([
        fetch("/api/admin/events"),
        fetch("/api/admin/events/categories"),
      ]);

      if (evtRes.ok) {
        const evtData = await evtRes.json();
        setEvents(evtData.events || []);
      }

      if (catRes.ok) {
        const catData = await catRes.json();
        setCategories(catData.categories || []);
      }
    } catch (error) {
      console.error("Error loading admin events data:", error);
    } finally {
      setLoading(false);
    }
  }

  // Handle Event Submit
  async function handleSaveEvent(e: React.FormEvent) {
    e.preventDefault();
    try {
      setSaving(true);
      const method = editingEvent ? "PUT" : "POST";
      const payload = editingEvent ? { ...eventForm, id: editingEvent.id } : eventForm;

      const res = await fetch("/api/admin/events", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setEventModalOpen(false);
        fetchData();
      } else {
        alert("Failed to save event");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  // Handle Category Submit
  async function handleSaveCategory(e: React.FormEvent) {
    e.preventDefault();
    try {
      setSaving(true);
      const method = editingCategory ? "PUT" : "POST";
      const payload = editingCategory ? { ...categoryForm, id: editingCategory.id } : categoryForm;

      const res = await fetch("/api/admin/events/categories", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setCategoryModalOpen(false);
        fetchData();
      } else {
        alert("Failed to save event category");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  // Delete Handlers
  async function handleDeleteEvent(id: string) {
    if (!confirm("Are you sure you want to delete this event?")) return;
    try {
      const res = await fetch(`/api/admin/events?id=${id}`, { method: "DELETE" });
      if (res.ok) fetchData();
    } catch (err) {
      console.error(err);
    }
  }

  async function handleDeleteCategory(id: string) {
    if (!confirm("Are you sure you want to delete this category?")) return;
    try {
      const res = await fetch(`/api/admin/events/categories?id=${id}`, { method: "DELETE" });
      if (res.ok) fetchData();
    } catch (err) {
      console.error(err);
    }
  }

  const openNewEventModal = () => {
    const today = new Date().toISOString().split("T")[0];
    setEditingEvent(null);
    setEventForm({
      title: "",
      slug: "",
      description: "",
      featured_image: "https://images.unsplash.com/photo-1511578314322-379afb476865?q=80&w=800&auto=format&fit=crop",
      category_id: categories[0]?.id || "",
      event_type: "Conference & Expo",
      start_date: today,
      end_date: today,
      location: "",
      city: "",
      country: "",
      website_url: "",
      registration_url: "",
      status: "published",
      is_featured: false,
      featured_order: 0,
    });
    setEventModalOpen(true);
  };

  const openEditEventModal = (evt: EventItem) => {
    setEditingEvent(evt);
    setEventForm({
      title: evt.title,
      slug: evt.slug,
      description: evt.description,
      featured_image: evt.featured_image,
      category_id: evt.category_id || "",
      event_type: evt.event_type || "Conference & Expo",
      start_date: evt.start_date,
      end_date: evt.end_date,
      location: evt.location || "",
      city: evt.city || "",
      country: evt.country || "",
      website_url: evt.website_url || "",
      registration_url: evt.registration_url || "",
      status: evt.status,
      is_featured: evt.is_featured === 1,
      featured_order: evt.featured_order || 0,
    });
    setEventModalOpen(true);
  };

  const openNewCategoryModal = () => {
    setEditingCategory(null);
    setCategoryForm({
      name: "",
      slug: "",
      description: "",
      status: "active",
      sort_order: categories.length + 1,
    });
    setCategoryModalOpen(true);
  };

  const openEditCategoryModal = (cat: EventCategory) => {
    setEditingCategory(cat);
    setCategoryForm({
      name: cat.name,
      slug: cat.slug,
      description: cat.description,
      status: cat.status,
      sort_order: cat.sort_order,
    });
    setCategoryModalOpen(true);
  };

  const filteredEvents = events.filter(
    (e) =>
      e.title.toLowerCase().includes(search.toLowerCase()) ||
      (e.city && e.city.toLowerCase().includes(search.toLowerCase())) ||
      (e.country && e.country.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#F8FAFC] flex items-center gap-2">
            <Calendar className="h-6 w-6 text-[#4F46E5]" />
            Events Management
          </h1>
          <p className="text-xs text-[#A1A9B8] mt-1">
            Manage global iGaming events, conferences, summits, and mega menu featured events.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {activeTab === "events" ? (
            <button
              onClick={openNewEventModal}
              className="inline-flex items-center gap-2 rounded-xl bg-[#4F46E5] px-4 py-2 text-xs font-semibold text-white shadow-lg hover:bg-[#4338CA] transition-all cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Create Event</span>
            </button>
          ) : (
            <button
              onClick={openNewCategoryModal}
              className="inline-flex items-center gap-2 rounded-xl bg-[#4F46E5] px-4 py-2 text-xs font-semibold text-white shadow-lg hover:bg-[#4338CA] transition-all cursor-pointer"
            >
              <FolderPlus className="h-4 w-4" />
              <span>Add Event Category</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#252A3A] gap-4">
        <button
          onClick={() => setActiveTab("events")}
          className={cn(
            "pb-3 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-2",
            activeTab === "events"
              ? "border-[#4F46E5] text-[#F8FAFC]"
              : "border-transparent text-[#A1A9B8] hover:text-[#F8FAFC]"
          )}
        >
          <Calendar className="h-4 w-4" />
          <span>Events ({events.length})</span>
        </button>
        <button
          onClick={() => setActiveTab("categories")}
          className={cn(
            "pb-3 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-2",
            activeTab === "categories"
              ? "border-[#4F46E5] text-[#F8FAFC]"
              : "border-transparent text-[#A1A9B8] hover:text-[#F8FAFC]"
          )}
        >
          <Tag className="h-4 w-4" />
          <span>Categories ({categories.length})</span>
        </button>
      </div>

      {/* SEARCH BAR (For Events) */}
      {activeTab === "events" && (
        <div className="relative max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#64748B]" />
          <input
            type="text"
            placeholder="Search events by title, city, or country..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl bg-[#0D1220] border border-[#252A3A] pl-10 pr-4 py-2 text-xs text-[#F8FAFC] focus:outline-none focus:border-[#4F46E5]"
          />
        </div>
      )}

      {/* CONTENT AREA */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl bg-[#151C2C]" />
          ))}
        </div>
      ) : activeTab === "events" ? (
        <div className="overflow-x-auto rounded-2xl border border-[#252A3A] bg-[#0D1220]">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#252A3A] bg-[#111726] text-[#94A3B8]">
                <th className="p-4">Event Name</th>
                <th className="p-4">Location</th>
                <th className="p-4">Dates</th>
                <th className="p-4">Category</th>
                <th className="p-4">Featured</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#252A3A]">
              {filteredEvents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-[#94A3B8]">
                    No events found.
                  </td>
                </tr>
              ) : (
                filteredEvents.map((evt) => (
                  <tr key={evt.id} className="hover:bg-[#151C2C]/50 transition-colors">
                    <td className="p-4 font-semibold text-[#F8FAFC] max-w-xs truncate">
                      <div className="flex items-center gap-3">
                        <img
                          src={evt.featured_image}
                          alt={evt.title}
                          className="h-9 w-12 rounded-lg object-cover bg-[#151C2C]"
                        />
                        <div className="flex flex-col truncate">
                          <span className="truncate">{evt.title}</span>
                          <span className="text-[10px] text-[#64748B]">{evt.event_type}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-[#94A3B8]">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-[#4F46E5]" />
                        <span>
                          {evt.city ? `${evt.city}, ` : ""}
                          {evt.country}
                        </span>
                      </div>
                    </td>
                    <td className="p-4 text-[#94A3B8] font-mono">
                      {evt.start_date}
                      {evt.end_date && evt.end_date !== evt.start_date ? ` to ${evt.end_date}` : ""}
                    </td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 rounded-md bg-[#4F46E5]/15 text-[#818CF8] font-medium border border-[#4F46E5]/30">
                        {evt.category_name || "Uncategorized"}
                      </span>
                    </td>
                    <td className="p-4">
                      {evt.is_featured === 1 ? (
                        <span className="inline-flex items-center gap-1 text-[#F59E0B] font-bold">
                          <Star className="h-3.5 w-3.5 fill-[#F59E0B]" />
                          Featured #{evt.featured_order}
                        </span>
                      ) : (
                        <span className="text-[#64748B]">Standard</span>
                      )}
                    </td>
                    <td className="p-4">
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded text-[11px] font-bold capitalize",
                          evt.status === "published"
                            ? "bg-[#22C55E]/15 text-[#22C55E]"
                            : "bg-[#F59E0B]/15 text-[#F59E0B]"
                        )}
                      >
                        {evt.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditEventModal(evt)}
                          className="p-1.5 rounded-lg text-[#94A3B8] hover:bg-[#1F293D] hover:text-[#F8FAFC]"
                          title="Edit"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteEvent(evt.id)}
                          className="p-1.5 rounded-lg text-[#EF4444] hover:bg-[#EF4444]/10"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : (
        /* CATEGORIES TABLE */
        <div className="overflow-x-auto rounded-2xl border border-[#252A3A] bg-[#0D1220]">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#252A3A] bg-[#111726] text-[#94A3B8]">
                <th className="p-4">Category Name</th>
                <th className="p-4">Slug</th>
                <th className="p-4">Sort Order</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#252A3A]">
              {categories.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-[#94A3B8]">
                    No event categories found.
                  </td>
                </tr>
              ) : (
                categories.map((cat) => (
                  <tr key={cat.id} className="hover:bg-[#151C2C]/50 transition-colors">
                    <td className="p-4 font-bold text-[#F8FAFC]">{cat.name}</td>
                    <td className="p-4 text-[#94A3B8] font-mono">{cat.slug}</td>
                    <td className="p-4 text-[#94A3B8]">{cat.sort_order}</td>
                    <td className="p-4">
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded text-[11px] font-bold uppercase",
                          cat.status === "active"
                            ? "bg-[#22C55E]/15 text-[#22C55E]"
                            : "bg-[#64748B]/15 text-[#64748B]"
                        )}
                      >
                        {cat.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditCategoryModal(cat)}
                          className="p-1.5 rounded-lg text-[#94A3B8] hover:bg-[#1F293D] hover:text-[#F8FAFC]"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(cat.id)}
                          className="p-1.5 rounded-lg text-[#EF4444] hover:bg-[#EF4444]/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* EVENT MODAL */}
      {eventModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-2xl bg-[#0D1220] border border-[#252A3A] p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-white">
              {editingEvent ? "Edit Event" : "Create Event"}
            </h3>

            <form onSubmit={handleSaveEvent} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-[#94A3B8] font-semibold">Event Title *</label>
                <input
                  type="text"
                  required
                  value={eventForm.title}
                  onChange={(e) => {
                    const title = e.target.value;
                    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
                    setEventForm({ ...eventForm, title, slug: editingEvent ? eventForm.slug : slug });
                  }}
                  className="w-full rounded-xl bg-[#151C2C] border border-[#252A3A] px-3.5 py-2 text-white focus:outline-none focus:border-[#4F46E5]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[#94A3B8] font-semibold">URL Slug *</label>
                <input
                  type="text"
                  required
                  value={eventForm.slug}
                  onChange={(e) => setEventForm({ ...eventForm, slug: e.target.value })}
                  className="w-full rounded-xl bg-[#151C2C] border border-[#252A3A] px-3.5 py-2 text-white font-mono focus:outline-none focus:border-[#4F46E5]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[#94A3B8] font-semibold">Category *</label>
                  <select
                    value={eventForm.category_id}
                    onChange={(e) => setEventForm({ ...eventForm, category_id: e.target.value })}
                    className="w-full rounded-xl bg-[#151C2C] border border-[#252A3A] px-3.5 py-2 text-white focus:outline-none focus:border-[#4F46E5]"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[#94A3B8] font-semibold">Event Type</label>
                  <input
                    type="text"
                    placeholder="e.g. Conference, Expo, Gala Awards"
                    value={eventForm.event_type}
                    onChange={(e) => setEventForm({ ...eventForm, event_type: e.target.value })}
                    className="w-full rounded-xl bg-[#151C2C] border border-[#252A3A] px-3.5 py-2 text-white focus:outline-none focus:border-[#4F46E5]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[#94A3B8] font-semibold">Start Date *</label>
                  <input
                    type="date"
                    required
                    value={eventForm.start_date}
                    onChange={(e) => setEventForm({ ...eventForm, start_date: e.target.value })}
                    className="w-full rounded-xl bg-[#151C2C] border border-[#252A3A] px-3.5 py-2 text-white focus:outline-none focus:border-[#4F46E5]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[#94A3B8] font-semibold">End Date</label>
                  <input
                    type="date"
                    value={eventForm.end_date}
                    onChange={(e) => setEventForm({ ...eventForm, end_date: e.target.value })}
                    className="w-full rounded-xl bg-[#151C2C] border border-[#252A3A] px-3.5 py-2 text-white focus:outline-none focus:border-[#4F46E5]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[#94A3B8] font-semibold">Venue / Location</label>
                  <input
                    type="text"
                    placeholder="e.g. World Trade Centre"
                    value={eventForm.location}
                    onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })}
                    className="w-full rounded-xl bg-[#151C2C] border border-[#252A3A] px-3 py-2 text-white focus:outline-none focus:border-[#4F46E5]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[#94A3B8] font-semibold">City</label>
                  <input
                    type="text"
                    placeholder="Dubai"
                    value={eventForm.city}
                    onChange={(e) => setEventForm({ ...eventForm, city: e.target.value })}
                    className="w-full rounded-xl bg-[#151C2C] border border-[#252A3A] px-3 py-2 text-white focus:outline-none focus:border-[#4F46E5]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[#94A3B8] font-semibold">Country</label>
                  <input
                    type="text"
                    placeholder="UAE"
                    value={eventForm.country}
                    onChange={(e) => setEventForm({ ...eventForm, country: e.target.value })}
                    className="w-full rounded-xl bg-[#151C2C] border border-[#252A3A] px-3 py-2 text-white focus:outline-none focus:border-[#4F46E5]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[#94A3B8] font-semibold">Website URL</label>
                  <input
                    type="text"
                    value={eventForm.website_url}
                    onChange={(e) => setEventForm({ ...eventForm, website_url: e.target.value })}
                    className="w-full rounded-xl bg-[#151C2C] border border-[#252A3A] px-3.5 py-2 text-white focus:outline-none focus:border-[#4F46E5]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[#94A3B8] font-semibold">Registration URL</label>
                  <input
                    type="text"
                    value={eventForm.registration_url}
                    onChange={(e) => setEventForm({ ...eventForm, registration_url: e.target.value })}
                    className="w-full rounded-xl bg-[#151C2C] border border-[#252A3A] px-3.5 py-2 text-white focus:outline-none focus:border-[#4F46E5]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[#94A3B8] font-semibold">Event Banner Image URL</label>
                <input
                  type="text"
                  value={eventForm.featured_image}
                  onChange={(e) => setEventForm({ ...eventForm, featured_image: e.target.value })}
                  className="w-full rounded-xl bg-[#151C2C] border border-[#252A3A] px-3.5 py-2 text-white focus:outline-none focus:border-[#4F46E5]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[#94A3B8] font-semibold">Event Description</label>
                <textarea
                  rows={4}
                  value={eventForm.description}
                  onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                  className="w-full rounded-xl bg-[#151C2C] border border-[#252A3A] px-3.5 py-2 text-white focus:outline-none focus:border-[#4F46E5]"
                />
              </div>

              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={eventForm.is_featured}
                    onChange={(e) => setEventForm({ ...eventForm, is_featured: e.target.checked })}
                    className="rounded border-[#252A3A] bg-[#151C2C] text-[#4F46E5]"
                  />
                  <span className="font-bold text-[#F8FAFC]">Show in Navbar Mega Menu (Featured)</span>
                </label>

                {eventForm.is_featured && (
                  <div className="flex items-center gap-2">
                    <span className="text-[#94A3B8]">Order:</span>
                    <input
                      type="number"
                      value={eventForm.featured_order}
                      onChange={(e) => setEventForm({ ...eventForm, featured_order: parseInt(e.target.value, 10) || 0 })}
                      className="w-16 rounded-lg bg-[#151C2C] border border-[#252A3A] px-2 py-1 text-white text-center"
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[#252A3A]">
                <button
                  type="button"
                  onClick={() => setEventModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white/[0.05] text-[#94A3B8] hover:bg-white/[0.1]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-[#4F46E5] text-white font-bold hover:bg-[#4338CA]"
                >
                  {saving ? "Saving..." : "Save Event"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CATEGORY MODAL */}
      {categoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-[#0D1220] border border-[#252A3A] p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white">
              {editingCategory ? "Edit Event Category" : "Add Event Category"}
            </h3>

            <form onSubmit={handleSaveCategory} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-[#94A3B8] font-semibold">Category Name *</label>
                <input
                  type="text"
                  required
                  value={categoryForm.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
                    setCategoryForm({ ...categoryForm, name, slug: editingCategory ? categoryForm.slug : slug });
                  }}
                  className="w-full rounded-xl bg-[#151C2C] border border-[#252A3A] px-3.5 py-2 text-white focus:outline-none focus:border-[#4F46E5]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[#94A3B8] font-semibold">Slug *</label>
                <input
                  type="text"
                  required
                  value={categoryForm.slug}
                  onChange={(e) => setCategoryForm({ ...categoryForm, slug: e.target.value })}
                  className="w-full rounded-xl bg-[#151C2C] border border-[#252A3A] px-3.5 py-2 text-white font-mono focus:outline-none focus:border-[#4F46E5]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[#94A3B8] font-semibold">Description</label>
                <textarea
                  rows={2}
                  value={categoryForm.description}
                  onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                  className="w-full rounded-xl bg-[#151C2C] border border-[#252A3A] px-3.5 py-2 text-white focus:outline-none focus:border-[#4F46E5]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[#94A3B8] font-semibold">Sort Order</label>
                  <input
                    type="number"
                    value={categoryForm.sort_order}
                    onChange={(e) => setCategoryForm({ ...categoryForm, sort_order: parseInt(e.target.value, 10) || 0 })}
                    className="w-full rounded-xl bg-[#151C2C] border border-[#252A3A] px-3.5 py-2 text-white focus:outline-none focus:border-[#4F46E5]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[#94A3B8] font-semibold">Status</label>
                  <select
                    value={categoryForm.status}
                    onChange={(e) => setCategoryForm({ ...categoryForm, status: e.target.value })}
                    className="w-full rounded-xl bg-[#151C2C] border border-[#252A3A] px-3.5 py-2 text-white focus:outline-none focus:border-[#4F46E5]"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[#252A3A]">
                <button
                  type="button"
                  onClick={() => setCategoryModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white/[0.05] text-[#94A3B8] hover:bg-white/[0.1]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-[#4F46E5] text-white font-bold hover:bg-[#4338CA]"
                >
                  {saving ? "Saving..." : "Save Category"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
