"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Heart,
  MessageSquare,
  Bookmark,
  Share2,
  MoreHorizontal,
  Pencil,
  Trash2,
  Globe,
  Calendar as CalendarIcon,
  MapPin,
  Clock,
  ExternalLink,
  Send,
  Loader2,
  ChevronLeft,
  ChevronRight,
  X,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { getInitials } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

export interface FeedAuthor {
  id: string;
  name: string;
  avatar?: string;
  role?: string;
  company?: {
    id: string;
    name: string;
    slug: string;
    logo?: string;
  } | null;
}

export interface FeedMedia {
  id: string;
  url: string;
  type: string;
  sort_order: number;
}

export interface FeedEvent {
  id: string;
  title: string;
  slug: string;
  description?: string;
  featured_image?: string;
  start_date: string;
  end_date?: string;
  location?: string;
  city?: string;
  country?: string;
  event_type?: string;
  status?: string;
  is_unavailable?: boolean;
}

export interface FeedPost {
  id: string;
  post_type: "text" | "image" | "event";
  content: string;
  visibility: string;
  status: string;
  author: FeedAuthor;
  media: FeedMedia[];
  event?: FeedEvent | null;
  likes_count: number;
  comments_count: number;
  has_liked: boolean;
  has_saved: boolean;
  created_at: string;
  updated_at: string;
}

interface FeedCardProps {
  post: FeedPost;
  onPostUpdated?: (updatedPost: FeedPost) => void;
  onPostDeleted?: (postId: string) => void;
}

export default function FeedCard({ post, onPostUpdated, onPostDeleted }: FeedCardProps) {
  const { user } = useAuth();

  // Social states
  const [liked, setLiked] = useState(post.has_liked);
  const [likesCount, setLikesCount] = useState(post.likes_count);
  const [saved, setSaved] = useState(post.has_saved);
  const [liking, setLiking] = useState(false);
  const [saving, setSaving] = useState(false);

  // Comment section states
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [commentsCount, setCommentsCount] = useState(post.comments_count);
  const [loadingComments, setLoadingComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);

  // Menu / Edit states
  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [updatingPost, setUpdatingPost] = useState(false);
  const [deletingPost, setDeletingPost] = useState(false);

  // Lightbox state for image viewing
  const [activeLightboxIndex, setActiveLightboxIndex] = useState<number | null>(null);

  // Toast / Share notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const isOwner = user?.id === post.author.id;
  const isAdmin = user?.role && ["super_admin", "admin"].includes(user.role);
  const canModify = isOwner || isAdmin;

  // Format time ago
  let timeAgo = "recently";
  try {
    timeAgo = formatDistanceToNow(new Date(post.created_at), { addSuffix: true });
  } catch (e) {
    timeAgo = post.created_at;
  }

  function showToast(msg: string) {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  }

  // Like / Unlike handler
  async function handleToggleLike() {
    if (liking) return;
    setLiking(true);

    const targetLiked = !liked;
    const countDelta = targetLiked ? 1 : -1;

    setLiked(targetLiked);
    setLikesCount((prev) => Math.max(0, prev + countDelta));

    try {
      const res = await fetch(`/api/feed/${post.id}/like`, {
        method: targetLiked ? "POST" : "DELETE",
      });
      const data = await res.json();
      if (res.ok) {
        setLikesCount(data.likes_count);
        setLiked(data.has_liked);
      } else {
        // Revert on error
        setLiked(!targetLiked);
        setLikesCount((prev) => Math.max(0, prev - countDelta));
      }
    } catch (err) {
      setLiked(!targetLiked);
      setLikesCount((prev) => Math.max(0, prev - countDelta));
    } finally {
      setLiking(false);
    }
  }

  // Save / Unsave handler
  async function handleToggleSave() {
    if (saving) return;
    setSaving(true);

    const targetSaved = !saved;
    setSaved(targetSaved);
    showToast(targetSaved ? "Post saved to bookmarks" : "Post removed from saved items");

    try {
      const res = await fetch(`/api/feed/${post.id}/save`, {
        method: targetSaved ? "POST" : "DELETE",
      });
      const data = await res.json();
      if (res.ok) {
        setSaved(data.has_saved);
      } else {
        setSaved(!targetSaved);
      }
    } catch (err) {
      setSaved(!targetSaved);
    } finally {
      setSaving(false);
    }
  }

  // Share post link
  function handleShare() {
    const postUrl = `${window.location.origin}/app/feed?post=${post.id}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(postUrl);
      showToast("Link copied to clipboard!");
    } else {
      showToast("Share URL: " + postUrl);
    }
  }

  // Fetch comments
  async function toggleCommentsSection() {
    const nextState = !showComments;
    setShowComments(nextState);

    if (nextState && comments.length === 0) {
      try {
        setLoadingComments(true);
        const res = await fetch(`/api/feed/${post.id}/comments`);
        if (res.ok) {
          const data = await res.json();
          setComments(data.comments || []);
        }
      } catch (err) {
        console.error("Error loading comments:", err);
      } finally {
        setLoadingComments(false);
      }
    }
  }

  // Post comment
  async function handleAddComment(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = commentText.trim();
    if (!trimmed || submittingComment) return;

    setSubmittingComment(true);

    try {
      const res = await fetch(`/api/feed/${post.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: trimmed }),
      });

      const data = await res.json();

      if (res.ok && data.comment) {
        setComments((prev) => [...prev, data.comment]);
        setCommentsCount(data.comments_count);
        setCommentText("");
      }
    } catch (err) {
      console.error("Error posting comment:", err);
    } finally {
      setSubmittingComment(false);
    }
  }

  // Edit post handler
  async function handleSaveEdit() {
    const trimmed = editContent.trim();
    if (!trimmed || updatingPost) return;

    setUpdatingPost(true);

    try {
      const res = await fetch(`/api/feed/${post.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: trimmed }),
      });

      const data = await res.json();
      if (res.ok) {
        setIsEditing(false);
        if (onPostUpdated) {
          onPostUpdated({ ...post, content: trimmed });
        }
      }
    } catch (err) {
      console.error("Error editing post:", err);
    } finally {
      setUpdatingPost(false);
    }
  }

  // Delete post handler
  async function handleDeletePost() {
    if (!confirm("Are you sure you want to delete this post?")) return;
    setDeletingPost(true);

    try {
      const res = await fetch(`/api/feed/${post.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        if (onPostDeleted) {
          onPostDeleted(post.id);
        }
      }
    } catch (err) {
      console.error("Error deleting post:", err);
    } finally {
      setDeletingPost(false);
    }
  }

  // Render Image Grid
  function renderMediaGrid() {
    if (!post.media || post.media.length === 0) return null;

    const total = post.media.length;

    if (total === 1) {
      return (
        <div
          onClick={() => setActiveLightboxIndex(0)}
          className="cursor-pointer rounded-2xl overflow-hidden bg-[#070B14] border border-[#1F2937] max-h-[500px]"
        >
          <img
            src={post.media[0].url}
            alt="Post image"
            className="w-full h-full object-cover hover:scale-[1.01] transition-transform duration-300"
          />
        </div>
      );
    }

    if (total === 2) {
      return (
        <div className="grid grid-cols-2 gap-2 rounded-2xl overflow-hidden bg-[#070B14] border border-[#1F2937]">
          {post.media.map((item, idx) => (
            <div
              key={item.id}
              onClick={() => setActiveLightboxIndex(idx)}
              className="cursor-pointer aspect-square overflow-hidden"
            >
              <img
                src={item.url}
                alt={`Post photo ${idx + 1}`}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
              />
            </div>
          ))}
        </div>
      );
    }

    if (total === 3) {
      return (
        <div className="grid grid-cols-3 gap-2 rounded-2xl overflow-hidden bg-[#070B14] border border-[#1F2937]">
          <div
            onClick={() => setActiveLightboxIndex(0)}
            className="col-span-2 cursor-pointer aspect-square overflow-hidden"
          >
            <img
              src={post.media[0].url}
              alt="Post photo 1"
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
            />
          </div>
          <div className="flex flex-col gap-2">
            {post.media.slice(1, 3).map((item, idx) => (
              <div
                key={item.id}
                onClick={() => setActiveLightboxIndex(idx + 1)}
                className="cursor-pointer aspect-square overflow-hidden"
              >
                <img
                  src={item.url}
                  alt={`Post photo ${idx + 2}`}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                />
              </div>
            ))}
          </div>
        </div>
      );
    }

    // 4 or 4+ images
    const displayMedia = post.media.slice(0, 4);
    const extraCount = total - 4;

    return (
      <div className="grid grid-cols-2 gap-2 rounded-2xl overflow-hidden bg-[#070B14] border border-[#1F2937]">
        {displayMedia.map((item, idx) => (
          <div
            key={item.id}
            onClick={() => setActiveLightboxIndex(idx)}
            className="relative cursor-pointer aspect-square overflow-hidden group"
          >
            <img
              src={item.url}
              alt={`Post photo ${idx + 1}`}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            {idx === 3 && extraCount > 0 && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white text-xl font-bold backdrop-blur-xs">
                +{extraCount}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="relative rounded-2xl bg-[#0D1320] border border-[#1F2937] p-5 space-y-4 shadow-lg transition-all hover:border-[#1F2937]/80">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="absolute top-3 right-3 z-20 px-3 py-1.5 rounded-lg bg-[#2563EB] text-white text-xs font-semibold shadow-lg animate-in fade-in duration-150">
          {toastMessage}
        </div>
      )}

      {/* Card Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          {/* Author Avatar */}
          <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#2563EB] text-sm font-bold text-white shadow-md border border-[#1F2937]">
            {post.author.avatar ? (
              <img
                src={post.author.avatar}
                alt={post.author.name}
                className="h-11 w-11 rounded-xl object-cover"
              />
            ) : (
              getInitials(post.author.name || "User")
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-[#F8FAFC]">
                {post.author.name}
              </span>
              {post.author.role === "super_admin" || post.author.role === "admin" ? (
                <span className="px-2 py-0.5 rounded-md bg-[#2563EB]/20 text-[#60A5FA] text-[10px] font-extrabold border border-[#2563EB]/40">
                  ADMIN
                </span>
              ) : null}
            </div>

            {/* Company Info */}
            {post.author.company ? (
              <Link
                href={`/app/company/${post.author.company.id || post.author.company.slug}`}
                className="text-xs text-[#94A3B8] hover:text-[#2563EB] font-medium transition-colors flex items-center gap-1"
              >
                {post.author.company.logo ? (
                  <img
                    src={post.author.company.logo}
                    alt={post.author.company.name}
                    className="w-3.5 h-3.5 rounded-sm object-cover"
                  />
                ) : null}
                <span>{post.author.company.name}</span>
              </Link>
            ) : (
              <span className="text-xs text-[#94A3B8]">iGaming Member</span>
            )}

            <div className="flex items-center gap-1.5 text-[11px] text-[#94A3B8] mt-0.5">
              <span>{timeAgo}</span>
              <span>•</span>
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#94A3B8]/80">
                <Globe className="w-3 h-3 text-[#2563EB]" />
                Global Network
              </span>
            </div>
          </div>
        </div>

        {/* More Options Menu */}
        {canModify && (
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowMenu(!showMenu)}
              className="p-1.5 text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#111827] rounded-xl transition-colors"
            >
              <MoreHorizontal className="w-5 h-5" />
            </button>

            {showMenu && (
              <div className="absolute right-0 top-8 z-30 w-40 rounded-xl bg-[#111827] border border-[#1F2937] p-1 shadow-2xl space-y-0.5">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(true);
                    setShowMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 text-xs font-semibold text-[#F8FAFC] hover:bg-[#1F2937] rounded-lg flex items-center gap-2 transition-colors"
                >
                  <Pencil className="w-3.5 h-3.5 text-[#2563EB]" />
                  <span>Edit Post</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowMenu(false);
                    handleDeletePost();
                  }}
                  disabled={deletingPost}
                  className="w-full text-left px-3 py-2 text-xs font-semibold text-red-400 hover:bg-red-500/10 rounded-lg flex items-center gap-2 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Post</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Post Text Content */}
      {isEditing ? (
        <div className="space-y-2">
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            rows={3}
            className="w-full p-3 bg-[#111827] border border-[#2563EB] rounded-xl text-sm text-[#F8FAFC] focus:outline-none"
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-3 py-1.5 text-xs text-[#94A3B8] hover:text-white rounded-lg"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveEdit}
              disabled={updatingPost}
              className="px-4 py-1.5 bg-[#2563EB] text-white text-xs font-bold rounded-lg hover:bg-[#1D4ED8] flex items-center gap-1"
            >
              {updatingPost && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Save</span>
            </button>
          </div>
        </div>
      ) : (
        post.content && (
          <p className="text-sm text-[#F8FAFC] leading-relaxed whitespace-pre-line">
            {post.content}
          </p>
        )
      )}

      {/* Attached Media Grid */}
      {renderMediaGrid()}

      {/* Attached Event Card */}
      {post.event && (
        <div className="mt-3">
          {post.event.is_unavailable ? (
            <div className="p-3 bg-[#111827] border border-[#1F2937] rounded-xl text-xs text-[#94A3B8]">
              Event no longer available
            </div>
          ) : (
            <div className="relative overflow-hidden rounded-2xl bg-[#111827] border border-[#1F2937] hover:border-[#2563EB]/40 transition-all group">
              <div className="flex flex-col sm:flex-row items-stretch">
                {post.event.featured_image ? (
                  <div className="sm:w-40 aspect-[16/9] sm:aspect-auto relative overflow-hidden bg-[#070B14] shrink-0">
                    <img
                      src={post.event.featured_image}
                      alt={post.event.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                ) : null}

                <div className="flex-1 p-4 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 rounded-full bg-[#2563EB]/20 text-[#60A5FA] text-[10px] font-bold border border-[#2563EB]/40 uppercase tracking-wider">
                        {post.event.event_type || "Industry Event"}
                      </span>
                    </div>

                    <h4 className="text-base font-bold text-[#F8FAFC] group-hover:text-[#2563EB] transition-colors leading-snug">
                      {post.event.title}
                    </h4>

                    {post.event.description && (
                      <p className="text-xs text-[#94A3B8] line-clamp-2 mt-1">
                        {post.event.description}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#1F2937]">
                    <div className="flex items-center gap-3 text-xs text-[#94A3B8]">
                      <span className="flex items-center gap-1 font-semibold text-[#F8FAFC]">
                        <Clock className="w-3.5 h-3.5 text-[#2563EB]" />
                        {post.event.start_date}
                      </span>
                      {post.event.city || post.event.country ? (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-[#60A5FA]" />
                          {post.event.city ? `${post.event.city}, ` : ""}
                          {post.event.country}
                        </span>
                      ) : null}
                    </div>

                    <Link
                      href={`/events/${post.event.slug || post.event.id}`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold shadow-md transition-all"
                    >
                      <span>View Event</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Action Row & Stats */}
      <div className="pt-2 border-t border-[#1F2937] flex items-center justify-between text-xs font-semibold text-[#94A3B8]">
        {/* Like Button */}
        <button
          type="button"
          onClick={handleToggleLike}
          disabled={liking}
          className={`flex items-center gap-1.5 py-1.5 px-3 rounded-xl transition-all ${
            liked
              ? "bg-red-500/10 text-red-500 font-bold"
              : "hover:bg-[#111827] hover:text-[#F8FAFC]"
          }`}
        >
          <Heart className={`w-4 h-4 ${liked ? "fill-red-500 text-red-500" : ""}`} />
          <span>{likesCount} {likesCount === 1 ? "Like" : "Likes"}</span>
        </button>

        {/* Comment Button */}
        <button
          type="button"
          onClick={toggleCommentsSection}
          className="flex items-center gap-1.5 py-1.5 px-3 rounded-xl hover:bg-[#111827] hover:text-[#F8FAFC] transition-all"
        >
          <MessageSquare className="w-4 h-4 text-[#2563EB]" />
          <span>{commentsCount} {commentsCount === 1 ? "Comment" : "Comments"}</span>
        </button>

        {/* Save Button */}
        <button
          type="button"
          onClick={handleToggleSave}
          disabled={saving}
          className={`flex items-center gap-1.5 py-1.5 px-3 rounded-xl transition-all ${
            saved
              ? "bg-[#2563EB]/10 text-[#2563EB] font-bold"
              : "hover:bg-[#111827] hover:text-[#F8FAFC]"
          }`}
        >
          <Bookmark className={`w-4 h-4 ${saved ? "fill-[#2563EB]" : ""}`} />
          <span>{saved ? "Saved" : "Save"}</span>
        </button>

        {/* Share Button */}
        <button
          type="button"
          onClick={handleShare}
          className="flex items-center gap-1.5 py-1.5 px-3 rounded-xl hover:bg-[#111827] hover:text-[#F8FAFC] transition-all"
        >
          <Share2 className="w-4 h-4" />
          <span>Share</span>
        </button>
      </div>

      {/* Expandable Comments Section */}
      {showComments && (
        <div className="pt-3 border-t border-[#1F2937] space-y-3 animate-in fade-in duration-150">
          {/* Add Comment Input */}
          <form onSubmit={handleAddComment} className="flex items-center gap-2">
            <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#2563EB] text-xs font-bold text-white">
              {user?.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={user.full_name}
                  className="h-8 w-8 rounded-lg object-cover"
                />
              ) : (
                getInitials(user?.full_name || "User")
              )}
            </div>
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Add a comment..."
              className="flex-1 py-1.5 px-3 bg-[#111827] border border-[#1F2937] rounded-xl text-xs text-[#F8FAFC] placeholder-[#94A3B8]/60 focus:outline-none focus:border-[#2563EB]"
            />
            <button
              type="submit"
              disabled={submittingComment || !commentText.trim()}
              className="p-1.5 bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-40 text-white rounded-xl transition-all"
            >
              {submittingComment ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </form>

          {/* Comments List */}
          {loadingComments ? (
            <div className="py-4 text-center text-xs text-[#94A3B8] flex items-center justify-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#2563EB]" />
              Loading comments...
            </div>
          ) : comments.length === 0 ? (
            <p className="text-xs text-[#94A3B8] text-center py-2">
              No comments yet. Be the first to comment!
            </p>
          ) : (
            <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
              {comments.map((cmt) => (
                <div key={cmt.id} className="flex items-start gap-2.5 p-2 bg-[#111827] rounded-xl border border-[#1F2937]/60">
                  <div className="relative flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#2563EB] text-[10px] font-bold text-white">
                    {cmt.author.avatar ? (
                      <img
                        src={cmt.author.avatar}
                        alt={cmt.author.name}
                        className="h-7 w-7 rounded-lg object-cover"
                      />
                    ) : (
                      getInitials(cmt.author.name)
                    )}
                  </div>
                  <div className="flex-1 text-xs space-y-0.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#F8FAFC]">{cmt.author.name}</span>
                      <span className="text-[10px] text-[#94A3B8]/70">
                        {formatDistanceToNow(new Date(cmt.created_at), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-[#94A3B8] leading-relaxed">{cmt.content}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Image Lightbox Modal */}
      {activeLightboxIndex !== null && post.media && post.media[activeLightboxIndex] && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <button
            onClick={() => setActiveLightboxIndex(null)}
            className="absolute top-4 right-4 p-2 text-white/80 hover:text-white rounded-full bg-black/50 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>

          {post.media.length > 1 && (
            <>
              <button
                onClick={() =>
                  setActiveLightboxIndex((prev) => (prev! > 0 ? prev! - 1 : post.media.length - 1))
                }
                className="absolute left-4 p-3 text-white/80 hover:text-white rounded-full bg-black/50 transition-colors"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={() =>
                  setActiveLightboxIndex((prev) => (prev! < post.media.length - 1 ? prev! + 1 : 0))
                }
                className="absolute right-4 p-3 text-white/80 hover:text-white rounded-full bg-black/50 transition-colors"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}

          <div className="max-w-4xl max-h-[85vh]">
            <img
              src={post.media[activeLightboxIndex].url}
              alt={`Photo ${activeLightboxIndex + 1}`}
              className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl"
            />
          </div>
        </div>
      )}
    </div>
  );
}
