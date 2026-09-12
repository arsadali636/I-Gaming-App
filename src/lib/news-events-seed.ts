import crypto from "crypto";
import { getDb } from "./db";

export function seedNewsAndEvents() {
  const db = getDb();

  // 1. Seed News Categories & News Articles
  const newsCatCount = (
    db.prepare("SELECT COUNT(*) as count FROM news_categories").get() as { count: number }
  )?.count ?? 0;

  if (newsCatCount === 0) {
    console.log("Seeding initial News Categories and Articles...");

    const now = new Date().toISOString();

    const catLatestId = crypto.randomUUID();
    const catAffiliateId = crypto.randomUUID();
    const catOperatorId = crypto.randomUUID();
    const catB2bId = crypto.randomUUID();
    const catIndustryId = crypto.randomUUID();

    const insertNewsCat = db.prepare(`
      INSERT INTO news_categories (id, name, slug, description, status, sort_order, created_at, updated_at)
      VALUES (?, ?, ?, ?, 'active', ?, ?, ?)
    `);

    insertNewsCat.run(catLatestId, "Latest News", "latest-news", "All the latest headlines and updates across iGaming", 1, now, now);
    insertNewsCat.run(catAffiliateId, "Affiliate News", "affiliate-news", "Marketing insights, CPA/revshare trends, and affiliate growth strategies", 2, now, now);
    insertNewsCat.run(catOperatorId, "Operator News", "operator-news", "Key announcements, acquisitions, and platform expansions from online operators", 3, now, now);
    insertNewsCat.run(catB2bId, "B2B News", "b2b-news", "Software suppliers, game studios, and technology provider breakthroughs", 4, now, now);
    insertNewsCat.run(catIndustryId, "Industry & Regulation", "industry-news", "Global licensing changes, legal updates, and compliance requirements", 5, now, now);

    // Insert Sample News Articles
    const insertNews = db.prepare(`
      INSERT INTO news (id, title, slug, short_description, content, featured_image, category_id, status, is_featured, featured_order, published_at, seo_title, seo_description, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'published', ?, ?, ?, ?, ?, ?, ?)
    `);

    const newsArticles = [
      {
        title: "Why Affiliate Traffic Needs Time to Prove Its Long-Term Value",
        slug: "why-affiliate-traffic-needs-time-to-prove-its-value",
        short_description: "When should operators evaluate player lifetime value and conversion curves across high-volume traffic channels?",
        content: `
          <p class="lead">Evaluating affiliate traffic requires a shift from immediate conversion metrics to long-term cohort analytics. Online gambling operators often make the mistake of cutting traffic channels prematurely based on initial 7-day or 14-day ROI metrics.</p>
          
          <h3>Understanding Player Retention Curves</h3>
          <p>Player acquisition in iGaming operates on multi-stage retention funnels. High-intent traffic from review platforms and comparison portals tends to demonstrate higher initial deposits, whereas content marketing and sports betting guides often produce long-tail value over 90 to 180 days.</p>

          <blockquote>"Affiliate marketing isn't a 7-day sprint; it's a multi-quarter ecosystem where true LTV unfolds across sporting seasons and promotional calendars."</blockquote>

          <h3>Key Takeaways for Operators & Affiliates:</h3>
          <ul>
            <li><strong>Track 90-Day LTV:</strong> Allow sufficient time for player re-engagement campaigns and VIP lifecycle flows to yield results.</li>
            <li><strong>Analyze Cross-Product Conversion:</strong> Sportsbook traffic frequently transitions to live casino products during off-season periods.</li>
            <li><strong>Establish Transparent Data Sharing:</strong> Joint analytics dashboards build long-term trust between operators and media partners.</li>
          </ul>
        `,
        featured_image: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?q=80&w=800&auto=format&fit=crop",
        category_id: catAffiliateId,
        is_featured: 1,
        featured_order: 1,
      },
      {
        title: "Global Regulatory Outlook 2026: License Requirements Across LATAM & Europe",
        slug: "global-regulatory-outlook-2026-latam-europe",
        short_description: "Key changes in gaming licenses, tax structures, and compliance frameworks for global operators and B2B providers.",
        content: `
          <p class="lead">As 2026 unfolds, regulatory landscapes in Latin America and Europe are undergoing monumental shifts. Operators and software providers must stay ahead of mandatory licensing parameters to maintain compliant operations.</p>
          
          <h3>LATAM Market Expansion</h3>
          <p>Brazil's regulated market framework has set a benchmark across South America, prompting neighboring jurisdictions to refine their licensing regimes. Compliance mandates now encompass strict local hosting requirements, certified RNG testing, and mandatory local corporate entity registration.</p>

          <h3>European Compliance & Responsible Gambling</h3>
          <p>European regulators continue to tighten advertising parameters, dynamic deposit limits, and real-time player safety monitoring tools. Platform providers are increasingly embedding automated AI risk detection algorithms into core player management systems.</p>
        `,
        featured_image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=800&auto=format&fit=crop",
        category_id: catIndustryId,
        is_featured: 1,
        featured_order: 2,
      },
      {
        title: "Next-Gen Aggregation Platforms: Revolutionizing Game Distribution in 2026",
        slug: "next-gen-aggregation-platforms-revolutionizing-game-distribution",
        short_description: "How single API integrations and modular serverless architectures are powering top-tier online casino catalogs.",
        content: `
          <p class="lead">Game aggregators are no longer simple content hubs—they are high-frequency data engines driving personalized game discovery, jackpot networks, and promotional tools for global iGaming brands.</p>

          <h3>Modular API Architectures</h3>
          <p>Modern game aggregation systems enable operators to launch thousands of slots, live dealer tables, and crash games via a single lightweight API call with sub-50ms latency globally.</p>
        `,
        featured_image: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=800&auto=format&fit=crop",
        category_id: catB2bId,
        is_featured: 1,
        featured_order: 3,
      },
      {
        title: "Tier-1 Operator Brands Accelerate Cross-Border Sportsbook Expansion",
        slug: "tier-1-operators-accelerate-cross-border-expansion",
        short_description: "Leading online gaming operators announce strategic acquisitions and localization campaigns across emerging markets.",
        content: `
          <p class="lead">Top operators are leveraging specialized local affiliate networks and localized payment options to scale seamlessly across emerging growth markets in Asia and Latin America.</p>
        `,
        featured_image: "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?q=80&w=800&auto=format&fit=crop",
        category_id: catOperatorId,
        is_featured: 0,
        featured_order: 0,
      },
    ];

    newsArticles.forEach((article) => {
      insertNews.run(
        crypto.randomUUID(),
        article.title,
        article.slug,
        article.short_description,
        article.content,
        article.featured_image,
        article.category_id,
        article.is_featured,
        article.featured_order,
        now,
        article.title,
        article.short_description,
        now,
        now
      );
    });
  }

  // 2. Seed Event Categories & Events
  const eventCatCount = (
    db.prepare("SELECT COUNT(*) as count FROM event_categories").get() as { count: number }
  )?.count ?? 0;

  if (eventCatCount === 0) {
    console.log("Seeding initial Event Categories and Events...");

    const now = new Date().toISOString();

    const catCalId = crypto.randomUUID();
    const catUpId = crypto.randomUUID();
    const catConfId = crypto.randomUUID();
    const catNetId = crypto.randomUUID();
    const catAwardId = crypto.randomUUID();

    const insertEventCat = db.prepare(`
      INSERT INTO event_categories (id, name, slug, description, status, sort_order, created_at, updated_at)
      VALUES (?, ?, ?, ?, 'active', ?, ?, ?)
    `);

    insertEventCat.run(catCalId, "Events Calendar", "events-calendar", "Full interactive calendar of global iGaming expos & summits", 1, now, now);
    insertEventCat.run(catUpId, "Upcoming Events", "upcoming-events", "Featured upcoming conferences and industry gatherings", 2, now, now);
    insertEventCat.run(catConfId, "iGaming Conferences", "igaming-conferences", "Major summits, keynote panels, and trade exhibitions", 3, now, now);
    insertEventCat.run(catNetId, "Networking Events", "networking-events", "Exclusive VIP networking dinners and C-level meetups", 4, now, now);
    insertEventCat.run(catAwardId, "Industry Awards", "industry-awards", "Prestigious award galas recognizing excellence in iGaming", 5, now, now);

    // Insert Sample Events
    const insertEvent = db.prepare(`
      INSERT INTO events (id, title, slug, description, featured_image, category_id, event_type, start_date, end_date, location, city, country, website_url, registration_url, status, is_featured, featured_order, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'published', ?, ?, ?, ?)
    `);

    const sampleEvents = [
      {
        title: "iGaming Summit & Expo 2026",
        slug: "igaming-summit-expo-2026",
        description: "The premier global B2B conference gathering over 10,000 operators, affiliates, game developers, and payment gateways under one roof.",
        featured_image: "https://images.unsplash.com/photo-1511578314322-379afb476865?q=80&w=800&auto=format&fit=crop",
        category_id: catConfId,
        event_type: "Conference & Expo",
        start_date: "2026-11-23",
        end_date: "2026-11-25",
        location: "Dubai World Trade Centre",
        city: "Dubai",
        country: "United Arab Emirates",
        website_url: "https://igamingconnect.com/events/summit-2026",
        registration_url: "https://igamingconnect.com/events/summit-2026/register",
        is_featured: 1,
        featured_order: 1,
      },
      {
        title: "iGaming Club Lisbon 2026",
        slug: "igaming-club-lisbon-2026",
        description: "An exclusive VIP networking lounge experience tailored for operators, media partners, and high-growth B2B software vendors.",
        featured_image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=800&auto=format&fit=crop",
        category_id: catNetId,
        event_type: "Networking Lounge",
        start_date: "2026-09-28",
        end_date: "2026-09-29",
        location: "Altice Arena VIP Suite",
        city: "Lisbon",
        country: "Portugal",
        website_url: "https://igamingconnect.com/events/lisbon-2026",
        registration_url: "https://igamingconnect.com/events/lisbon-2026/rsvp",
        is_featured: 1,
        featured_order: 2,
      },
      {
        title: "Global iGaming Excellence Awards 2026",
        slug: "global-igaming-excellence-awards-2026",
        description: "Celebrating groundbreaking achievements in platform technology, responsible gaming, affiliate innovation, and operator excellence.",
        featured_image: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=800&auto=format&fit=crop",
        category_id: catAwardId,
        event_type: "Gala Awards",
        start_date: "2026-12-10",
        end_date: "2026-12-10",
        location: "InterContinental London - The O2",
        city: "London",
        country: "United Kingdom",
        website_url: "https://igamingconnect.com/events/awards-2026",
        registration_url: "https://igamingconnect.com/events/awards-2026/tickets",
        is_featured: 1,
        featured_order: 3,
      },
      {
        title: "LATAM iGaming & Affiliate Convention 2026",
        slug: "latam-igaming-affiliate-convention-2026",
        description: "Connecting Latin American operators, local media portals, and compliance regulators across Mexico, Brazil, and Colombia.",
        featured_image: "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?q=80&w=800&auto=format&fit=crop",
        category_id: catConfId,
        event_type: "Convention",
        start_date: "2026-10-15",
        end_date: "2026-10-17",
        location: "Cancun Convention Center",
        city: "Cancun",
        country: "Mexico",
        website_url: "https://igamingconnect.com/events/latam-2026",
        registration_url: "https://igamingconnect.com/events/latam-2026/register",
        is_featured: 0,
        featured_order: 0,
      },
    ];

    sampleEvents.forEach((evt) => {
      insertEvent.run(
        crypto.randomUUID(),
        evt.title,
        evt.slug,
        evt.description,
        evt.featured_image,
        evt.category_id,
        evt.event_type,
        evt.start_date,
        evt.end_date,
        evt.location,
        evt.city,
        evt.country,
        evt.website_url,
        evt.registration_url,
        evt.is_featured,
        evt.featured_order,
        now,
        now
      );
    });
  }
}
