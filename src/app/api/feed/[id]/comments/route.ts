import { NextRequest, NextResponse } from "next/server";
import { initDb, getDb } from "@/lib/db";
import { requireAuth } from "@/lib/auth-local";
import crypto from "crypto";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    initDb();
    const { id } = await params;
    const db = getDb();

    const commentsRows = db
      .prepare(
        `SELECT 
          c.id, c.post_id, c.user_id, c.content, c.created_at, c.updated_at,
          u.full_name as author_name, u.avatar_url as author_avatar, u.company_id,
          comp.name as company_name, comp.slug as company_slug, comp.logo_url as company_logo
         FROM feed_comments c
         INNER JOIN users u ON c.user_id = u.id
         LEFT JOIN companies comp ON u.company_id = comp.id
         WHERE c.post_id = ?
         ORDER BY c.created_at ASC`
      )
      .all(id) as any[];

    const formattedComments = commentsRows.map((row) => ({
      id: row.id,
      post_id: row.post_id,
      content: row.content,
      created_at: row.created_at,
      author: {
        id: row.user_id,
        name: row.author_name,
        avatar: row.author_avatar,
        company: row.company_name
          ? {
              id: row.company_id,
              name: row.company_name,
              slug: row.company_slug,
              logo: row.company_logo,
            }
          : null,
      },
    }));

    return NextResponse.json({ comments: formattedComments }, { status: 200 });
  } catch (error) {
    console.error("GET /api/feed/[id]/comments error:", error);
    return NextResponse.json({ error: "Failed to fetch comments" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    initDb();
    const user = await requireAuth();
    const { id } = await params;
    const db = getDb();

    const postRow = db.prepare("SELECT id FROM feed_posts WHERE id = ? AND status != 'deleted'").get(id);
    if (!postRow) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const body = await req.json();
    const { content } = body;

    const trimmedContent = (content || "").trim();
    if (!trimmedContent) {
      return NextResponse.json({ error: "Comment text cannot be empty" }, { status: 400 });
    }

    const commentId = crypto.randomUUID();
    const now = new Date().toISOString();

    db.prepare(
      `INSERT INTO feed_comments (id, post_id, user_id, content, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).run(commentId, id, user.id, trimmedContent, now, now);

    const commentRow = db
      .prepare(
        `SELECT 
          c.id, c.post_id, c.user_id, c.content, c.created_at,
          u.full_name as author_name, u.avatar_url as author_avatar, u.company_id,
          comp.name as company_name, comp.slug as company_slug, comp.logo_url as company_logo
         FROM feed_comments c
         INNER JOIN users u ON c.user_id = u.id
         LEFT JOIN companies comp ON u.company_id = comp.id
         WHERE c.id = ?`
      )
      .get(commentId) as any;

    const commentsCount = (db.prepare("SELECT COUNT(*) as cnt FROM feed_comments WHERE post_id = ?").get(id) as any)?.cnt || 0;

    const formattedComment = {
      id: commentRow.id,
      post_id: commentRow.post_id,
      content: commentRow.content,
      created_at: commentRow.created_at,
      author: {
        id: commentRow.user_id,
        name: commentRow.author_name,
        avatar: commentRow.author_avatar,
        company: commentRow.company_name
          ? {
              id: commentRow.company_id,
              name: commentRow.company_name,
              slug: commentRow.company_slug,
              logo: commentRow.company_logo,
            }
          : null,
      },
    };

    return NextResponse.json({ comment: formattedComment, comments_count: commentsCount }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to add comment";
    if (message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
