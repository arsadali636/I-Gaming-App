import { NextRequest, NextResponse } from "next/server";
import { initDb, getDb } from "@/lib/db";
import { getSessionUser, requireAuth } from "@/lib/auth-local";
import crypto from "crypto";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    initDb();
    const db = getDb();
    const currentUser = await getSessionUser();

    const searchParams = req.nextUrl.searchParams;
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const offset = (page - 1) * limit;

    const countResult = db
      .prepare("SELECT COUNT(*) as total FROM feed_posts WHERE status = 'published'")
      .get() as { total: number };
    const total = countResult?.total || 0;
    const totalPages = Math.ceil(total / limit);

    const postsRows = db
      .prepare(
        `SELECT 
          p.id,
          p.author_user_id,
          p.company_id,
          p.post_type,
          p.content,
          p.visibility,
          p.event_id,
          p.status,
          p.created_at,
          p.updated_at,
          u.full_name as author_name,
          u.avatar_url as author_avatar,
          u.role as author_role,
          c.name as company_name,
          c.slug as company_slug,
          c.logo_url as company_logo
        FROM feed_posts p
        INNER JOIN users u ON p.author_user_id = u.id
        LEFT JOIN companies c ON p.company_id = c.id
        WHERE p.status = 'published'
        ORDER BY p.created_at DESC
        LIMIT ? OFFSET ?`
      )
      .all(limit, offset) as any[];

    if (postsRows.length === 0) {
      return NextResponse.json(
        {
          posts: [],
          pagination: {
            page,
            limit,
            total: 0,
            totalPages: 0,
            hasMore: false,
          },
        },
        { status: 200 }
      );
    }

    const postIds = postsRows.map((p) => p.id);
    const placeholders = postIds.map(() => "?").join(",");

    // Batch fetch media
    const mediaRows = db
      .prepare(
        `SELECT id, post_id, media_url, media_type, sort_order 
         FROM feed_post_media 
         WHERE post_id IN (${placeholders}) 
         ORDER BY sort_order ASC`
      )
      .all(...postIds) as any[];

    const mediaMap = new Map<string, any[]>();
    for (const m of mediaRows) {
      if (!mediaMap.has(m.post_id)) {
        mediaMap.set(m.post_id, []);
      }
      mediaMap.get(m.post_id)!.push({
        id: m.id,
        url: m.media_url,
        type: m.media_type,
        sort_order: m.sort_order,
      });
    }

    // Batch fetch referenced events
    const eventIds = postsRows.map((p) => p.event_id).filter(Boolean);
    const eventMap = new Map<string, any>();
    if (eventIds.length > 0) {
      const eventPlaceholders = eventIds.map(() => "?").join(",");
      const eventRows = db
        .prepare(
          `SELECT id, title, slug, description, featured_image, start_date, end_date, location, city, country, event_type, status 
           FROM events 
           WHERE id IN (${eventPlaceholders})`
        )
        .all(...eventIds) as any[];
      for (const e of eventRows) {
        eventMap.set(e.id, e);
      }
    }

    // Batch count likes
    const likesRows = db
      .prepare(
        `SELECT post_id, COUNT(*) as cnt 
         FROM feed_post_likes 
         WHERE post_id IN (${placeholders}) 
         GROUP BY post_id`
      )
      .all(...postIds) as any[];
    const likesCountMap = new Map<string, number>();
    for (const l of likesRows) {
      likesCountMap.set(l.post_id, l.cnt);
    }

    // Batch count comments
    const commentsRows = db
      .prepare(
        `SELECT post_id, COUNT(*) as cnt 
         FROM feed_comments 
         WHERE post_id IN (${placeholders}) 
         GROUP BY post_id`
      )
      .all(...postIds) as any[];
    const commentsCountMap = new Map<string, number>();
    for (const c of commentsRows) {
      commentsCountMap.set(c.post_id, c.cnt);
    }

    // Check user's liked and saved status
    const userLikedSet = new Set<string>();
    const userSavedSet = new Set<string>();

    if (currentUser) {
      const userLikes = db
        .prepare(
          `SELECT post_id FROM feed_post_likes WHERE user_id = ? AND post_id IN (${placeholders})`
        )
        .all(currentUser.id, ...postIds) as any[];
      for (const ul of userLikes) {
        userLikedSet.add(ul.post_id);
      }

      const userSaves = db
        .prepare(
          `SELECT post_id FROM feed_post_saves WHERE user_id = ? AND post_id IN (${placeholders})`
        )
        .all(currentUser.id, ...postIds) as any[];
      for (const us of userSaves) {
        userSavedSet.add(us.post_id);
      }
    }

    const formattedPosts = postsRows.map((row) => {
      const eventData = row.event_id ? eventMap.get(row.event_id) || null : null;

      return {
        id: row.id,
        post_type: row.post_type,
        content: row.content || "",
        visibility: row.visibility,
        status: row.status,
        author: {
          id: row.author_user_id,
          name: row.author_name,
          avatar: row.author_avatar,
          role: row.author_role,
          company: row.company_name
            ? {
                id: row.company_id,
                name: row.company_name,
                slug: row.company_slug,
                logo: row.company_logo,
              }
            : null,
        },
        media: mediaMap.get(row.id) || [],
        event: eventData
          ? {
              id: eventData.id,
              title: eventData.title,
              slug: eventData.slug,
              description: eventData.description,
              featured_image: eventData.featured_image,
              start_date: eventData.start_date,
              end_date: eventData.end_date,
              location: eventData.location,
              city: eventData.city,
              country: eventData.country,
              event_type: eventData.event_type,
              status: eventData.status,
            }
          : row.event_id
          ? { is_unavailable: true }
          : null,
        likes_count: likesCountMap.get(row.id) || 0,
        comments_count: commentsCountMap.get(row.id) || 0,
        has_liked: userLikedSet.has(row.id),
        has_saved: userSavedSet.has(row.id),
        created_at: row.created_at,
        updated_at: row.updated_at,
      };
    });

    return NextResponse.json(
      {
        posts: formattedPosts,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasMore: page < totalPages,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET /api/feed error:", error);
    return NextResponse.json({ error: "Failed to fetch feed" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    initDb();
    const user = await requireAuth();
    const db = getDb();

    const body = await req.json();
    const { post_type = "text", content, media_urls = [], event_id } = body;

    // Validate post_type
    if (!["text", "image", "event"].includes(post_type)) {
      return NextResponse.json({ error: "Invalid post_type" }, { status: 400 });
    }

    // Derive company_id from user DB record
    const userRow = db.prepare("SELECT company_id FROM users WHERE id = ?").get(user.id) as
      | { company_id: string | null }
      | undefined;
    const companyId = userRow?.company_id || user.company_id || null;

    // Validate inputs per post type
    const trimmedContent = (content || "").trim();

    if (post_type === "text" && !trimmedContent) {
      return NextResponse.json({ error: "Post content is required for text posts" }, { status: 400 });
    }

    if (post_type === "image" && (!Array.isArray(media_urls) || media_urls.length === 0)) {
      return NextResponse.json({ error: "At least one image is required for photo posts" }, { status: 400 });
    }

    if (post_type === "event") {
      if (!event_id) {
        return NextResponse.json({ error: "Event ID is required for event posts" }, { status: 400 });
      }
      const existingEvent = db.prepare("SELECT id FROM events WHERE id = ?").get(event_id);
      if (!existingEvent) {
        return NextResponse.json({ error: "Referenced event does not exist" }, { status: 404 });
      }
    }

    const postId = crypto.randomUUID();
    const now = new Date().toISOString();

    db.prepare(
      `INSERT INTO feed_posts (id, author_user_id, company_id, post_type, content, visibility, event_id, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 'public', ?, 'published', ?, ?)`
    ).run(postId, user.id, companyId, post_type, trimmedContent || null, event_id || null, now, now);

    // Save attached media
    if (Array.isArray(media_urls) && media_urls.length > 0) {
      const insertMedia = db.prepare(
        `INSERT INTO feed_post_media (id, post_id, media_url, media_type, sort_order, created_at)
         VALUES (?, ?, ?, 'image', ?, ?)`
      );
      media_urls.forEach((url: string, idx: number) => {
        if (typeof url === "string" && url.trim()) {
          insertMedia.run(crypto.randomUUID(), postId, url.trim(), idx, now);
        }
      });
    }

    // Fetch newly created post with complete author & company information
    const postRow = db
      .prepare(
        `SELECT 
          p.id, p.author_user_id, p.company_id, p.post_type, p.content, p.visibility, p.event_id, p.status, p.created_at, p.updated_at,
          u.full_name as author_name, u.avatar_url as author_avatar, u.role as author_role,
          c.name as company_name, c.slug as company_slug, c.logo_url as company_logo
         FROM feed_posts p
         INNER JOIN users u ON p.author_user_id = u.id
         LEFT JOIN companies c ON p.company_id = c.id
         WHERE p.id = ?`
      )
      .get(postId) as any;

    const mediaList = db
      .prepare("SELECT id, media_url as url, media_type as type, sort_order FROM feed_post_media WHERE post_id = ? ORDER BY sort_order ASC")
      .all(postId) as any[];

    let eventData = null;
    if (postRow.event_id) {
      eventData = db.prepare("SELECT id, title, slug, description, featured_image, start_date, end_date, location, city, country, event_type, status FROM events WHERE id = ?").get(postRow.event_id);
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
      likes_count: 0,
      comments_count: 0,
      has_liked: false,
      has_saved: false,
      created_at: postRow.created_at,
      updated_at: postRow.updated_at,
    };

    return NextResponse.json({ post: formattedPost }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create post";
    if (message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("POST /api/feed error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
