import { NextRequest, NextResponse } from "next/server";
import { initDb, getDb } from "@/lib/db";
import { getSessionUser, requireAuth } from "@/lib/auth-local";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    initDb();
    const { id } = await params;
    const db = getDb();
    const currentUser = await getSessionUser();

    const postRow = db
      .prepare(
        `SELECT 
          p.id, p.author_user_id, p.company_id, p.post_type, p.content, p.visibility, p.event_id, p.status, p.created_at, p.updated_at,
          u.full_name as author_name, u.avatar_url as author_avatar, u.role as author_role,
          c.name as company_name, c.slug as company_slug, c.logo_url as company_logo
         FROM feed_posts p
         INNER JOIN users u ON p.author_user_id = u.id
         LEFT JOIN companies c ON p.company_id = c.id
         WHERE p.id = ? AND p.status != 'deleted'`
      )
      .get(id) as any;

    if (!postRow) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const mediaList = db
      .prepare("SELECT id, media_url as url, media_type as type, sort_order FROM feed_post_media WHERE post_id = ? ORDER BY sort_order ASC")
      .all(id) as any[];

    let eventData = null;
    if (postRow.event_id) {
      eventData = db.prepare("SELECT id, title, slug, description, featured_image, start_date, end_date, location, city, country, event_type, status FROM events WHERE id = ?").get(postRow.event_id);
    }

    const likesCount = (db.prepare("SELECT COUNT(*) as cnt FROM feed_post_likes WHERE post_id = ?").get(id) as any)?.cnt || 0;
    const commentsCount = (db.prepare("SELECT COUNT(*) as cnt FROM feed_comments WHERE post_id = ?").get(id) as any)?.cnt || 0;

    let hasLiked = false;
    let hasSaved = false;
    if (currentUser) {
      hasLiked = Boolean(db.prepare("SELECT 1 FROM feed_post_likes WHERE post_id = ? AND user_id = ?").get(id, currentUser.id));
      hasSaved = Boolean(db.prepare("SELECT 1 FROM feed_post_saves WHERE post_id = ? AND user_id = ?").get(id, currentUser.id));
    }

    const formattedPost = {
      id: postRow.id,
      post_type: postRow.post_type,
      content: postRow.content || "",
      visibility: postRow.visibility,
      status: postRow.status,
      author: {
        id: postRow.author_user_id,
        name: postRow.author_name,
        avatar: postRow.author_avatar,
        role: postRow.author_role,
        company: postRow.company_name
          ? {
              id: postRow.company_id,
              name: postRow.company_name,
              slug: postRow.company_slug,
              logo: postRow.company_logo,
            }
          : null,
      },
      media: mediaList,
      event: eventData || (postRow.event_id ? { is_unavailable: true } : null),
      likes_count: likesCount,
      comments_count: commentsCount,
      has_liked: hasLiked,
      has_saved: hasSaved,
      created_at: postRow.created_at,
      updated_at: postRow.updated_at,
    };

    return NextResponse.json({ post: formattedPost }, { status: 200 });
  } catch (error) {
    console.error("GET /api/feed/[id] error:", error);
    return NextResponse.json({ error: "Failed to fetch post" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    initDb();
    const user = await requireAuth();
    const { id } = await params;
    const db = getDb();

    const postRow = db.prepare("SELECT author_user_id, status FROM feed_posts WHERE id = ?").get(id) as
      | { author_user_id: string; status: string }
      | undefined;

    if (!postRow || postRow.status === "deleted") {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Permission check: only author or admin/super_admin
    const isAdmin = ["super_admin", "admin"].includes(user.role);
    if (postRow.author_user_id !== user.id && !isAdmin) {
      return NextResponse.json({ error: "You are not authorized to edit this post" }, { status: 403 });
    }

    const body = await req.json();
    const { content } = body;

    if (typeof content !== "string" || !content.trim()) {
      return NextResponse.json({ error: "Updated content cannot be empty" }, { status: 400 });
    }

    const now = new Date().toISOString();
    db.prepare("UPDATE feed_posts SET content = ?, updated_at = ? WHERE id = ?").run(content.trim(), now, id);

    return NextResponse.json({ message: "Post updated successfully", content: content.trim() }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update post";
    if (message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    initDb();
    const user = await requireAuth();
    const { id } = await params;
    const db = getDb();

    const postRow = db.prepare("SELECT author_user_id, status FROM feed_posts WHERE id = ?").get(id) as
      | { author_user_id: string; status: string }
      | undefined;

    if (!postRow || postRow.status === "deleted") {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Permission check: only author or admin/super_admin
    const isAdmin = ["super_admin", "admin"].includes(user.role);
    if (postRow.author_user_id !== user.id && !isAdmin) {
      return NextResponse.json({ error: "You are not authorized to delete this post" }, { status: 403 });
    }

    const now = new Date().toISOString();
    // Soft delete per guardrail 4
    db.prepare("UPDATE feed_posts SET status = 'deleted', updated_at = ? WHERE id = ?").run(now, id);

    return NextResponse.json({ message: "Post deleted successfully" }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete post";
    if (message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
