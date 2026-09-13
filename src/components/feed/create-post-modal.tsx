"use client";

import { useState, useEffect } from "react";
import {
  X,
  Image as ImageIcon,
  Calendar,
  Loader2,
  Sparkles,
  Search,
  Check,
  Building2,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { getInitials } from "@/lib/utils";

interface EventItem {
  id: string;
  title: string;
  slug: string;
  start_date: string;
  location?: string;
  city?: string;
  country?: string;
  featured_image?: string;
}

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPostCreated: (newPost: any) => void;
  initialType?: "text" | "image" | "event";
}

export default function CreatePostModal({
  isOpen,
  onClose,
  onPostCreated,
  initialType = "text",
}: CreatePostModalProps) {
  const { user } = useAuth();
  const [postType, setPostType] = useState<"text" | "image" | "event">(initialType);
  const [content, setContent] = useState("");
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);

  // Upload state
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Event search state
  const [eventsList, setEventsList] = useState<EventItem[]>([]);
  const [eventSearch, setEventSearch] = useState("");
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [showEventPicker, setShowEventPicker] = useState(false);

  // Submit state
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setPostType(initialType);
  }, [initialType]);

  useEffect(() => {
    if (postType === "event" && eventsList.length === 0) {
      fetchEvents();
    }
  }, [postType]);

  async function fetchEvents(query = "") {
    try {
      setLoadingEvents(true);
      const res = await fetch(`/api/events?filter=upcoming&limit=15${query ? `&search=${encodeURIComponent(query)}` : ""}`);
      if (res.ok) {
        const data = await res.json();
        setEventsList(data.events || []);
      }
    } catch (err) {
      console.error("Error fetching events:", err);
    } finally {
      setLoadingEvents(false);
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setUploadError(null);

    const uploadedUrls: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > 10 * 1024 * 1024) {
        setUploadError(`File ${file.name} exceeds 10MB limit`);
        continue;
      }

      const formData = new FormData();
      formData.append("file", file);

      try {
        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();
        if (res.ok && data.url) {
          uploadedUrls.push(data.url);
        } else {
          setUploadError(data.error || `Failed to upload ${file.name}`);
        }
      } catch (err) {
        setUploadError(`Upload failed for ${file.name}`);
      }
    }

    if (uploadedUrls.length > 0) {
      setMediaUrls((prev) => [...prev, ...uploadedUrls]);
    }
    setUploading(false);
    e.target.value = "";
  }

  function removeMedia(index: number) {
    setMediaUrls((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // Form validations
    const trimmed = content.trim();

    if (postType === "text" && !trimmed) {
      setError("Please write an update before posting.");
      return;
    }

    if (postType === "image" && mediaUrls.length === 0) {
      setError("Please upload at least one image.");
      return;
    }

    if (postType === "event" && !selectedEvent) {
      setError("Please select an event to share.");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/feed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          post_type: postType,
          content: trimmed,
          media_urls: mediaUrls,
          event_id: selectedEvent?.id || null,
        }),
      });

      const data = await res.json();

      if (res.ok && data.post) {
        onPostCreated(data.post);
        // Reset form
        setContent("");
        setMediaUrls([]);
        setSelectedEvent(null);
        setError(null);
        onClose();
      } else {
        setError(data.error || "Failed to create post. Please try again.");
      }
    } catch (err) {
      setError("An unexpected error occurred while posting.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl rounded-2xl bg-[#0D1320] border border-[#1F2937] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1F2937] bg-[#111827]">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#2563EB]" />
            <h2 className="text-lg font-bold text-[#F8FAFC]">Create Industry Post</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#1F2937] rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Author Badge */}
          <div className="flex items-center gap-3">
            <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#2563EB] text-sm font-bold text-white shadow-md">
              {user?.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={user.full_name}
                  className="h-10 w-10 rounded-xl object-cover"
                />
              ) : (
                getInitials(user?.full_name || "User")
              )}
            </div>
            <div>
              <p className="text-sm font-bold text-[#F8FAFC]">
                {user?.full_name || "iGaming Professional"}
              </p>
              <div className="flex items-center gap-2 text-xs text-[#94A3B8]">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#1F2937] text-[#94A3B8] text-[11px] font-semibold">
                  Global / Network Visible
                </span>
              </div>
            </div>
          </div>

          {/* Post Type Selector Tabs */}
          <div className="flex items-center gap-2 p-1 bg-[#111827] rounded-xl border border-[#1F2937]">
            <button
              type="button"
              onClick={() => setPostType("text")}
              className={`flex-1 py-1.5 px-3 text-xs font-semibold rounded-lg transition-all ${
                postType === "text"
                  ? "bg-[#2563EB] text-white shadow-sm"
                  : "text-[#94A3B8] hover:text-white"
              }`}
            >
              Text Post
            </button>
            <button
              type="button"
              onClick={() => setPostType("image")}
              className={`flex-1 py-1.5 px-3 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                postType === "image"
                  ? "bg-[#2563EB] text-white shadow-sm"
                  : "text-[#94A3B8] hover:text-white"
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Photos ({mediaUrls.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setPostType("event")}
              className={`flex-1 py-1.5 px-3 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                postType === "event"
                  ? "bg-[#2563EB] text-white shadow-sm"
                  : "text-[#94A3B8] hover:text-white"
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Event</span>
            </button>
          </div>

          {/* Content Textarea */}
          <div>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={
                postType === "event"
                  ? "Say something about this event..."
                  : postType === "image"
                  ? "Add a caption for your photos..."
                  : "Share an update with the iGaming community..."
              }
              rows={4}
              className="w-full p-3 bg-[#111827] border border-[#1F2937] rounded-xl text-sm text-[#F8FAFC] placeholder-[#94A3B8]/60 focus:outline-none focus:border-[#2563EB] transition-colors resize-none"
            />
          </div>

          {/* Photos Upload Section */}
          {(postType === "image" || mediaUrls.length > 0) && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#94A3B8]">
                  Attached Photos ({mediaUrls.length})
                </span>
                <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#111827] hover:bg-[#1F2937] border border-[#1F2937] text-xs font-semibold text-[#2563EB] transition-colors">
                  {uploading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <ImageIcon className="w-3.5 h-3.5" />
                  )}
                  <span>Upload Photos</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                    disabled={uploading}
                  />
                </label>
              </div>

              {uploadError && (
                <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 p-2 rounded-lg">
                  {uploadError}
                </p>
              )}

              {/* Preview thumbnails */}
              {mediaUrls.length > 0 && (
                <div className="grid grid-cols-4 gap-2">
                  {mediaUrls.map((url, idx) => (
                    <div
                      key={idx}
                      className="relative group aspect-square rounded-xl overflow-hidden bg-[#111827] border border-[#1F2937]"
                    >
                      <img src={url} alt={`Upload ${idx}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeMedia(idx)}
                        className="absolute top-1 right-1 p-1 bg-black/70 hover:bg-red-600 text-white rounded-full transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Event Picker Section */}
          {(postType === "event" || selectedEvent) && (
            <div className="space-y-3">
              <span className="text-xs font-semibold text-[#94A3B8]">Attached Industry Event</span>

              {selectedEvent ? (
                <div className="flex items-center justify-between p-3 bg-[#111827] border border-[#2563EB]/40 rounded-xl">
                  <div className="flex items-center gap-3">
                    {selectedEvent.featured_image ? (
                      <img
                        src={selectedEvent.featured_image}
                        alt={selectedEvent.title}
                        className="w-12 h-12 rounded-lg object-cover bg-[#070B14]"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-[#2563EB]/20 flex items-center justify-center text-[#2563EB]">
                        <Calendar className="w-6 h-6" />
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-bold text-[#F8FAFC]">{selectedEvent.title}</p>
                      <p className="text-xs text-[#94A3B8]">
                        {selectedEvent.start_date} • {selectedEvent.location || selectedEvent.city || selectedEvent.country || "Global"}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedEvent(null)}
                    className="p-1.5 text-[#94A3B8] hover:text-red-400 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-[#94A3B8]" />
                    <input
                      type="text"
                      value={eventSearch}
                      onChange={(e) => {
                        setEventSearch(e.target.value);
                        fetchEvents(e.target.value);
                      }}
                      placeholder="Search upcoming events..."
                      className="w-full pl-9 pr-3 py-2 bg-[#111827] border border-[#1F2937] rounded-xl text-xs text-[#F8FAFC] placeholder-[#94A3B8]/60 focus:outline-none focus:border-[#2563EB]"
                    />
                  </div>

                  <div className="max-h-40 overflow-y-auto space-y-1 bg-[#111827] border border-[#1F2937] rounded-xl p-1">
                    {loadingEvents ? (
                      <div className="p-3 text-center text-xs text-[#94A3B8] flex items-center justify-center gap-2">
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-[#2563EB]" />
                        Loading events...
                      </div>
                    ) : eventsList.length === 0 ? (
                      <div className="p-3 text-center text-xs text-[#94A3B8]">
                        No matching events found.
                      </div>
                    ) : (
                      eventsList.map((evt) => (
                        <button
                          key={evt.id}
                          type="button"
                          onClick={() => setSelectedEvent(evt)}
                          className="w-full text-left p-2 rounded-lg hover:bg-[#1F2937] flex items-center justify-between text-xs transition-colors"
                        >
                          <div>
                            <p className="font-bold text-[#F8FAFC]">{evt.title}</p>
                            <p className="text-[11px] text-[#94A3B8]">
                              {evt.start_date} • {evt.city || evt.country || "Online"}
                            </p>
                          </div>
                          <span className="text-xs text-[#2563EB] font-bold">Select</span>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {error && (
            <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 p-2.5 rounded-xl">
              {error}
            </p>
          )}
        </form>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-[#1F2937] bg-[#111827]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-[#94A3B8] hover:text-white hover:bg-[#1F2937] transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || uploading}
            className="px-6 py-2 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-50 text-xs font-bold text-white transition-all shadow-lg flex items-center gap-2"
          >
            {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>Publish Post</span>
          </button>
        </div>
      </div>
    </div>
  );
}
