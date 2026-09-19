import Database from "better-sqlite3";
import path from "path";

const DB_PATH = path.join(process.cwd(), "igaming-connect.db");

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");
  }
  return db;
}

export function initDb(): Database.Database {
  const database = getDb();

  database.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      full_name TEXT NOT NULL,
      phone TEXT,
      telegram_id TEXT,
      instagram TEXT,
      discord TEXT,
      avatar_url TEXT,
      password_hash TEXT,
      role TEXT NOT NULL DEFAULT 'professional' CHECK (role IN ('super_admin', 'admin', 'moderator', 'company_owner', 'company_member', 'professional')),
      company_id TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS countries (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      code TEXT UNIQUE NOT NULL,
      region TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      description TEXT,
      icon TEXT,
      color TEXT,
      sort_order INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      category_id TEXT REFERENCES categories(id),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS services (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      category_id TEXT REFERENCES categories(id),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS business_roles (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      description TEXT,
      icon TEXT,
      status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
      sort_order INTEGER DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS company_sizes (
      id TEXT PRIMARY KEY,
      label TEXT NOT NULL,
      min_employees INTEGER DEFAULT 0,
      max_employees INTEGER DEFAULT 0,
      status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
      sort_order INTEGER DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS companies (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      logo_url TEXT,
      description TEXT NOT NULL,
      website TEXT,
      founded_year INTEGER,
      headquarters TEXT,
      country_id TEXT REFERENCES countries(id),
      market TEXT,
      employee_count TEXT,
      revenue_range TEXT,
      technology TEXT,
      business_role_id TEXT REFERENCES business_roles(id),
      company_size_id TEXT REFERENCES company_sizes(id),
      city TEXT,
      state_region TEXT,
      marketplace_visibility TEXT DEFAULT 'visible' CHECK (marketplace_visibility IN ('visible', 'hidden')),
      status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'suspended')),
      is_verified INTEGER DEFAULT 0,
      is_featured INTEGER DEFAULT 0,
      verification_status TEXT NOT NULL DEFAULT 'unverified' CHECK (verification_status IN ('unverified', 'pending', 'verified')),
      created_by TEXT REFERENCES users(id),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS company_categories (
      company_id TEXT REFERENCES companies(id) ON DELETE CASCADE,
      category_id TEXT REFERENCES categories(id) ON DELETE CASCADE,
      PRIMARY KEY (company_id, category_id)
    );

    CREATE TABLE IF NOT EXISTS company_products (
      company_id TEXT REFERENCES companies(id) ON DELETE CASCADE,
      product_id TEXT REFERENCES products(id) ON DELETE CASCADE,
      PRIMARY KEY (company_id, product_id)
    );

    CREATE TABLE IF NOT EXISTS company_services (
      company_id TEXT REFERENCES companies(id) ON DELETE CASCADE,
      service_id TEXT REFERENCES services(id) ON DELETE CASCADE,
      PRIMARY KEY (company_id, service_id)
    );

    CREATE TABLE IF NOT EXISTS company_licenses (
      id TEXT PRIMARY KEY,
      company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
      license_name TEXT NOT NULL,
      jurisdiction TEXT NOT NULL,
      license_number TEXT,
      status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'pending', 'expired')),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS company_contacts (
      id TEXT PRIMARY KEY,
      company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
      full_name TEXT NOT NULL,
      position TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      linkedin TEXT,
      is_primary INTEGER DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS company_members (
      id TEXT PRIMARY KEY,
      company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
      invited_at TEXT DEFAULT (datetime('now')),
      accepted_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(company_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS plans (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      price REAL NOT NULL DEFAULT 0,
      credits INTEGER NOT NULL DEFAULT 0,
      features TEXT DEFAULT '[]',
      stripe_price_id TEXT,
      is_active INTEGER DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS subscriptions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      plan_id TEXT NOT NULL REFERENCES plans(id),
      stripe_subscription_id TEXT UNIQUE,
      stripe_customer_id TEXT,
      status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'past_due', 'trialing')),
      current_period_start TEXT,
      current_period_end TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS contact_credit_wallets (
      id TEXT PRIMARY KEY,
      user_id TEXT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      balance INTEGER NOT NULL DEFAULT 0,
      total_earned INTEGER NOT NULL DEFAULT 0,
      total_used INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS contact_credit_transactions (
      id TEXT PRIMARY KEY,
      wallet_id TEXT NOT NULL REFERENCES contact_credit_wallets(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type TEXT NOT NULL CHECK (type IN ('credit', 'debit', 'refund', 'bonus')),
      amount INTEGER NOT NULL,
      description TEXT NOT NULL,
      reference_id TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS revealed_contacts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      company_contact_id TEXT NOT NULL REFERENCES company_contacts(id) ON DELETE CASCADE,
      revealed_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(user_id, company_contact_id)
    );

    CREATE TABLE IF NOT EXISTS connections (
      id TEXT PRIMARY KEY,
      requester_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      receiver_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'blocked')),
      message TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(requester_id, receiver_id)
    );

    CREATE TABLE IF NOT EXISTS conversations (
      id TEXT PRIMARY KEY,
      participant_1_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      participant_2_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      last_message_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
      sender_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      content TEXT NOT NULL,
      is_read INTEGER DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT NOT NULL,
      is_read INTEGER DEFAULT 0,
      link TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS opportunities (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('looking_for', 'offering', 'partnership')),
      category_id TEXT REFERENCES categories(id),
      created_by TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      company_id TEXT REFERENCES companies(id),
      status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed', 'filled')),
      budget TEXT,
      timeline TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS saved_companies (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(user_id, company_id)
    );

    CREATE TABLE IF NOT EXISTS saved_searches (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      filters TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS verification_requests (
      id TEXT PRIMARY KEY,
      company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
      requested_by TEXT NOT NULL REFERENCES users(id),
      documents TEXT DEFAULT '[]',
      status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
      reviewed_by TEXT REFERENCES users(id),
      review_notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      reviewed_at TEXT
    );

    CREATE TABLE IF NOT EXISTS reports (
      id TEXT PRIMARY KEY,
      reporter_id TEXT NOT NULL REFERENCES users(id),
      target_type TEXT NOT NULL CHECK (target_type IN ('company', 'user', 'message')),
      target_id TEXT NOT NULL,
      reason TEXT NOT NULL,
      description TEXT,
      status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
      reviewed_by TEXT REFERENCES users(id),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      reviewed_at TEXT
    );

    CREATE TABLE IF NOT EXISTS analytics_events (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES users(id),
      event_type TEXT NOT NULL,
      entity_type TEXT,
      entity_id TEXT,
      metadata TEXT,
      ip_address TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES users(id),
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT,
      details TEXT,
      ip_address TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS pricing_categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      description TEXT,
      display_order INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      show_on_public_page INTEGER DEFAULT 1,
      is_plus_layout INTEGER DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS pricing_plans (
      id TEXT PRIMARY KEY,
      category_id TEXT NOT NULL REFERENCES pricing_categories(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      slug TEXT NOT NULL,
      short_description TEXT,
      price REAL NOT NULL DEFAULT 0,
      currency TEXT NOT NULL DEFAULT '€',
      billing_period TEXT NOT NULL DEFAULT '/ year',
      icon TEXT,
      button_text TEXT NOT NULL DEFAULT 'Get Started',
      button_action TEXT NOT NULL DEFAULT '/register',
      is_featured INTEGER DEFAULT 0,
      is_popular INTEGER DEFAULT 0,
      badge_text TEXT,
      display_order INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS pricing_plan_features (
      id TEXT PRIMARY KEY,
      pricing_plan_id TEXT NOT NULL REFERENCES pricing_plans(id) ON DELETE CASCADE,
      feature_text TEXT NOT NULL,
      feature_description TEXT,
      is_included INTEGER DEFAULT 1,
      display_order INTEGER DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS plus_benefits (
      id TEXT PRIMARY KEY,
      category_id TEXT REFERENCES pricing_categories(id) ON DELETE CASCADE,
      pricing_plan_id TEXT REFERENCES pricing_plans(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      display_order INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS pricing_nav_items (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      href TEXT NOT NULL,
      description TEXT,
      display_order INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS news_categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      description TEXT,
      icon TEXT,
      status TEXT DEFAULT 'active',
      sort_order INTEGER DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS news (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      short_description TEXT,
      content TEXT,
      featured_image TEXT,
      category_id TEXT REFERENCES news_categories(id) ON DELETE SET NULL,
      author_id TEXT REFERENCES users(id),
      status TEXT DEFAULT 'published',
      is_featured INTEGER DEFAULT 0,
      featured_order INTEGER DEFAULT 0,
      published_at TEXT,
      seo_title TEXT,
      seo_description TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS event_categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      description TEXT,
      status TEXT DEFAULT 'active',
      sort_order INTEGER DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      description TEXT,
      featured_image TEXT,
      category_id TEXT REFERENCES event_categories(id) ON DELETE SET NULL,
      event_type TEXT DEFAULT 'conference',
      start_date TEXT NOT NULL,
      end_date TEXT,
      location TEXT,
      city TEXT,
      country TEXT,
      website_url TEXT,
      registration_url TEXT,
      status TEXT DEFAULT 'published',
      is_featured INTEGER DEFAULT 0,
      featured_order INTEGER DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_companies_slug ON companies(slug);
    CREATE INDEX IF NOT EXISTS idx_companies_status ON companies(status);
    CREATE INDEX IF NOT EXISTS idx_companies_country ON companies(country_id);
    CREATE INDEX IF NOT EXISTS idx_company_contacts_company ON company_contacts(company_id);
    CREATE INDEX IF NOT EXISTS idx_company_licenses_company ON company_licenses(company_id);
    CREATE INDEX IF NOT EXISTS idx_company_members_company ON company_members(company_id);
    CREATE INDEX IF NOT EXISTS idx_company_members_user ON company_members(user_id);
    CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id);
    CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
    CREATE INDEX IF NOT EXISTS idx_wallets_user ON contact_credit_wallets(user_id);
    CREATE INDEX IF NOT EXISTS idx_transactions_wallet ON contact_credit_transactions(wallet_id);
    CREATE INDEX IF NOT EXISTS idx_revealed_contacts_user ON revealed_contacts(user_id);
    CREATE INDEX IF NOT EXISTS idx_revealed_contacts_contact ON revealed_contacts(company_contact_id);
    CREATE INDEX IF NOT EXISTS idx_connections_requester ON connections(requester_id);
    CREATE INDEX IF NOT EXISTS idx_connections_receiver ON connections(receiver_id);
    CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
    CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
    CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
    CREATE INDEX IF NOT EXISTS idx_opportunities_type ON opportunities(type);
    CREATE INDEX IF NOT EXISTS idx_saved_companies_user ON saved_companies(user_id);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
    CREATE INDEX IF NOT EXISTS idx_analytics_events_type ON analytics_events(event_type);
    CREATE INDEX IF NOT EXISTS idx_pricing_plans_category ON pricing_plans(category_id);
    CREATE INDEX IF NOT EXISTS idx_pricing_features_plan ON pricing_plan_features(pricing_plan_id);
    CREATE INDEX IF NOT EXISTS idx_news_slug ON news(slug);
    CREATE INDEX IF NOT EXISTS idx_news_category ON news(category_id);
    CREATE INDEX IF NOT EXISTS idx_events_slug ON events(slug);
    CREATE TABLE IF NOT EXISTS offers (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      company_id TEXT REFERENCES companies(id) ON DELETE CASCADE,
      brand TEXT,
      category_id TEXT REFERENCES categories(id) ON DELETE SET NULL,
      offer_type TEXT NOT NULL DEFAULT 'affiliate' CHECK (offer_type IN ('affiliate', 'operator')),
      geo TEXT,
      traffic_type TEXT,
      vertical TEXT,
      payout REAL NOT NULL DEFAULT 0,
      currency TEXT NOT NULL DEFAULT '€',
      payout_type TEXT NOT NULL DEFAULT 'CPA' CHECK (payout_type IN ('CPA', 'CPL', 'RevShare', 'Hybrid')),
      payout_description TEXT,
      conversion_event TEXT,
      description TEXT NOT NULL,
      terms TEXT,
      allowed_traffic TEXT,
      restricted_traffic TEXT,
      landing_page_url TEXT,
      start_date TEXT,
      end_date TEXT,
      status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'expired', 'closed')),
      is_featured INTEGER DEFAULT 0,
      created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS offer_applications (
      id TEXT PRIMARY KEY,
      offer_id TEXT NOT NULL REFERENCES offers(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      applicant_company_id TEXT REFERENCES companies(id) ON DELETE CASCADE,
      status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'paused', 'expired')),
      message TEXT,
      traffic_details TEXT,
      reviewed_by TEXT REFERENCES users(id) ON DELETE SET NULL,
      review_notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(offer_id, user_id)
    );

    CREATE INDEX IF NOT EXISTS idx_companies_slug ON companies(slug);
    CREATE INDEX IF NOT EXISTS idx_companies_status ON companies(status);
    CREATE INDEX IF NOT EXISTS idx_companies_country ON companies(country_id);
    CREATE INDEX IF NOT EXISTS idx_company_contacts_company ON company_contacts(company_id);
    CREATE INDEX IF NOT EXISTS idx_company_licenses_company ON company_licenses(company_id);
    CREATE INDEX IF NOT EXISTS idx_company_members_company ON company_members(company_id);
    CREATE INDEX IF NOT EXISTS idx_company_members_user ON company_members(user_id);
    CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id);
    CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
    CREATE INDEX IF NOT EXISTS idx_wallets_user ON contact_credit_wallets(user_id);
    CREATE INDEX IF NOT EXISTS idx_transactions_wallet ON contact_credit_transactions(wallet_id);
    CREATE INDEX IF NOT EXISTS idx_revealed_contacts_user ON revealed_contacts(user_id);
    CREATE INDEX IF NOT EXISTS idx_revealed_contacts_contact ON revealed_contacts(company_contact_id);
    CREATE INDEX IF NOT EXISTS idx_connections_requester ON connections(requester_id);
    CREATE INDEX IF NOT EXISTS idx_connections_receiver ON connections(receiver_id);
    CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
    CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
    CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
    CREATE INDEX IF NOT EXISTS idx_opportunities_type ON opportunities(type);
    CREATE INDEX IF NOT EXISTS idx_saved_companies_user ON saved_companies(user_id);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
    CREATE INDEX IF NOT EXISTS idx_analytics_events_type ON analytics_events(event_type);
    CREATE INDEX IF NOT EXISTS idx_pricing_plans_category ON pricing_plans(category_id);
    CREATE INDEX IF NOT EXISTS idx_pricing_features_plan ON pricing_plan_features(pricing_plan_id);
    CREATE INDEX IF NOT EXISTS idx_news_slug ON news(slug);
    CREATE INDEX IF NOT EXISTS idx_news_category ON news(category_id);
    CREATE INDEX IF NOT EXISTS idx_events_slug ON events(slug);
    CREATE INDEX IF NOT EXISTS idx_events_category ON events(category_id);
    CREATE INDEX IF NOT EXISTS idx_offers_company ON offers(company_id);
    CREATE INDEX IF NOT EXISTS idx_offers_status ON offers(status);
    CREATE INDEX IF NOT EXISTS idx_offers_payout_type ON offers(payout_type);
    CREATE INDEX IF NOT EXISTS idx_offer_apps_offer ON offer_applications(offer_id);
    CREATE INDEX IF NOT EXISTS idx_offer_apps_user ON offer_applications(user_id);

    CREATE TABLE IF NOT EXISTS feed_posts (
      id TEXT PRIMARY KEY,
      author_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      company_id TEXT REFERENCES companies(id) ON DELETE SET NULL,
      post_type TEXT NOT NULL DEFAULT 'text' CHECK (post_type IN ('text', 'image', 'event')),
      content TEXT,
      visibility TEXT NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'members')),
      event_id TEXT REFERENCES events(id) ON DELETE SET NULL,
      status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('published', 'draft', 'deleted')),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS feed_post_media (
      id TEXT PRIMARY KEY,
      post_id TEXT NOT NULL REFERENCES feed_posts(id) ON DELETE CASCADE,
      media_url TEXT NOT NULL,
      media_type TEXT NOT NULL DEFAULT 'image',
      sort_order INTEGER DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS feed_comments (
      id TEXT PRIMARY KEY,
      post_id TEXT NOT NULL REFERENCES feed_posts(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      content TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS feed_post_likes (
      id TEXT PRIMARY KEY,
      post_id TEXT NOT NULL REFERENCES feed_posts(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(post_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS feed_post_saves (
      id TEXT PRIMARY KEY,
      post_id TEXT NOT NULL REFERENCES feed_posts(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(post_id, user_id)
    );

    CREATE INDEX IF NOT EXISTS idx_feed_posts_author ON feed_posts(author_user_id);
    CREATE INDEX IF NOT EXISTS idx_feed_posts_company ON feed_posts(company_id);
    CREATE INDEX IF NOT EXISTS idx_feed_posts_status_created ON feed_posts(status, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_feed_media_post ON feed_post_media(post_id, sort_order);
    CREATE INDEX IF NOT EXISTS idx_feed_comments_post ON feed_comments(post_id, created_at);
    CREATE INDEX IF NOT EXISTS idx_feed_likes_post_user ON feed_post_likes(post_id, user_id);
    CREATE INDEX IF NOT EXISTS idx_feed_saves_post_user ON feed_post_saves(post_id, user_id);

    CREATE TABLE IF NOT EXISTS software_types (
      id TEXT PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
      sort_order INTEGER DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS service_types (
      id TEXT PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
      sort_order INTEGER DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS licenses_master (
      id TEXT PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
      sort_order INTEGER DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS company_geos (
      company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
      country_id TEXT NOT NULL REFERENCES countries(id) ON DELETE CASCADE,
      is_top INTEGER DEFAULT 0,
      display_order INTEGER DEFAULT 0,
      PRIMARY KEY (company_id, country_id)
    );

    CREATE TABLE IF NOT EXISTS company_software_types (
      company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
      software_type_id TEXT NOT NULL REFERENCES software_types(id) ON DELETE CASCADE,
      PRIMARY KEY (company_id, software_type_id)
    );

    CREATE TABLE IF NOT EXISTS company_service_types (
      company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
      service_type_id TEXT NOT NULL REFERENCES service_types(id) ON DELETE CASCADE,
      PRIMARY KEY (company_id, service_type_id)
    );

    CREATE TABLE IF NOT EXISTS company_license_links (
      company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
      license_id TEXT NOT NULL REFERENCES licenses_master(id) ON DELETE CASCADE,
      PRIMARY KEY (company_id, license_id)
    );
  `);

  // Safe migration for existing tables
  try {
    const userTableInfo = database.prepare("PRAGMA table_info(users)").all() as { name: string }[];
    const userColNames = userTableInfo.map((col) => col.name);
    if (!userColNames.includes("phone")) {
      database.exec("ALTER TABLE users ADD COLUMN phone TEXT");
    }
    if (!userColNames.includes("telegram_id")) {
      database.exec("ALTER TABLE users ADD COLUMN telegram_id TEXT");
    }
    if (!userColNames.includes("instagram")) {
      database.exec("ALTER TABLE users ADD COLUMN instagram TEXT");
    }
    if (!userColNames.includes("discord")) {
      database.exec("ALTER TABLE users ADD COLUMN discord TEXT");
    }
  } catch (migErr) {
    console.error("Error migrating users table columns:", migErr);
  }

  try {
    const tableInfo = database.prepare("PRAGMA table_info(companies)").all() as { name: string }[];
    const columnNames = tableInfo.map((col) => col.name);

    if (!columnNames.includes("business_role_id")) {
      database.exec("ALTER TABLE companies ADD COLUMN business_role_id TEXT REFERENCES business_roles(id)");
    }
    if (!columnNames.includes("company_size_id")) {
      database.exec("ALTER TABLE companies ADD COLUMN company_size_id TEXT REFERENCES company_sizes(id)");
    }
    if (!columnNames.includes("city")) {
      database.exec("ALTER TABLE companies ADD COLUMN city TEXT");
    }
    if (!columnNames.includes("state_region")) {
      database.exec("ALTER TABLE companies ADD COLUMN state_region TEXT");
    }
    if (!columnNames.includes("marketplace_visibility")) {
      database.exec("ALTER TABLE companies ADD COLUMN marketplace_visibility TEXT DEFAULT 'visible'");
    }
    if (!columnNames.includes("contact_email")) {
      database.exec("ALTER TABLE companies ADD COLUMN contact_email TEXT");
    }
  } catch (migErr) {
    console.error("Error migrating companies table columns:", migErr);
  }

  try {
    const offerTableInfo = database.prepare("PRAGMA table_info(offers)").all() as { name: string }[];
    const offerColNames = offerTableInfo.map((col) => col.name);
    if (!offerColNames.includes("offer_type")) {
      database.exec("ALTER TABLE offers ADD COLUMN offer_type TEXT DEFAULT 'affiliate'");
    }
    database.exec("CREATE INDEX IF NOT EXISTS idx_offers_offer_type ON offers(offer_type);");
  } catch (migErr) {
    console.error("Error migrating offers table columns:", migErr);
  }

  // Seed default business roles if empty
  try {
    const roleCount = (database.prepare("SELECT COUNT(*) as count FROM business_roles").get() as { count: number }).count;
    if (roleCount === 0) {
      const crypto = require("crypto");
      const roles = [
        { id: crypto.randomUUID(), name: "Operator", slug: "operator", description: "Gaming operators & brands", icon: "Building2", sort_order: 1 },
        { id: crypto.randomUUID(), name: "Affiliate Partner", slug: "affiliate-partner", description: "Affiliate & traffic", icon: "Share2", sort_order: 2 },
        { id: crypto.randomUUID(), name: "Game Provider", slug: "game-provider", description: "Game development & content", icon: "Gamepad2", sort_order: 3 },
        { id: crypto.randomUUID(), name: "Platform & Game Aggregator", slug: "platform-game-aggregator", description: "Aggregation & white label solutions", icon: "Layers", sort_order: 4 },
        { id: crypto.randomUUID(), name: "Payment Solution Provider", slug: "payment-solution-provider", description: "Payment processing & fintech", icon: "CreditCard", sort_order: 5 },
      ];
      const stmt = database.prepare(
        "INSERT INTO business_roles (id, name, slug, description, icon, status, sort_order) VALUES (?, ?, ?, ?, ?, 'active', ?)"
      );
      for (const r of roles) {
        stmt.run(r.id, r.name, r.slug, r.description, r.icon, r.sort_order);
      }
    }

    const sizeCount = (database.prepare("SELECT COUNT(*) as count FROM company_sizes").get() as { count: number }).count;
    if (sizeCount === 0) {
      const crypto = require("crypto");
      const sizes = [
        { id: crypto.randomUUID(), label: "1–10 employees", min: 1, max: 10, sort_order: 1 },
        { id: crypto.randomUUID(), label: "11–50 employees", min: 11, max: 50, sort_order: 2 },
        { id: crypto.randomUUID(), label: "51–200 employees", min: 51, max: 200, sort_order: 3 },
        { id: crypto.randomUUID(), label: "201–500 employees", min: 201, max: 500, sort_order: 4 },
        { id: crypto.randomUUID(), label: "501–1,000 employees", min: 501, max: 1000, sort_order: 5 },
        { id: crypto.randomUUID(), label: "1,001–5,000 employees", min: 1001, max: 5000, sort_order: 6 },
        { id: crypto.randomUUID(), label: "5,001–10,000 employees", min: 5001, max: 10000, sort_order: 7 },
        { id: crypto.randomUUID(), label: "10,000+ employees", min: 10001, max: 999999, sort_order: 8 },
      ];
      const stmt = database.prepare(
        "INSERT INTO company_sizes (id, label, min_employees, max_employees, status, sort_order) VALUES (?, ?, ?, ?, 'active', ?)"
      );
      for (const s of sizes) {
        stmt.run(s.id, s.label, s.min, s.max, s.sort_order);
      }
    }

    // Seed 5 core categories and migrate legacy company/opportunity category relationships
    const crypto = require("crypto");

    const coreCategories = [
      { name: "Operator", slug: "operator", description: "Licensed online & retail gaming operators running consumer-facing betting and casino brands", icon: "Building2", color: "#4F6BFF", sort_order: 1 },
      { name: "Affiliate Partner", slug: "affiliate-partner", description: "Affiliate marketing networks, lead generation, content publishers, and traffic partners", icon: "Share2", color: "#10B981", sort_order: 2 },
      { name: "Game Provider", slug: "game-provider", description: "Game development studios, slot content creators, and live dealer solution providers", icon: "Gamepad2", sort_order: 3 },
      { name: "Platform & Game Aggregator", slug: "platform-game-aggregator", description: "Turnkey platform solutions, white label infrastructure, and game content aggregators", icon: "Layers", sort_order: 4 },
      { name: "Payment Solution Provider", slug: "payment-solution-provider", description: "Payment processing gateways, merchant accounts, and fintech solution providers", icon: "CreditCard", sort_order: 5 },
    ];

    const categoryMap: Record<string, string> = {};

    for (const c of coreCategories) {
      let existing = database.prepare("SELECT id FROM categories WHERE slug = ?").get(c.slug) as { id: string } | undefined;
      if (!existing) {
        const newId = crypto.randomUUID();
        database.prepare(
          "INSERT INTO categories (id, name, slug, description, icon, color, sort_order, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, 1)"
        ).run(newId, c.name, c.slug, c.description, c.icon, c.color, c.sort_order);
        categoryMap[c.slug] = newId;
      } else {
        categoryMap[c.slug] = existing.id;
        database.prepare("UPDATE categories SET is_active = 1, sort_order = ? WHERE id = ?").run(c.sort_order, existing.id);
      }
    }

    // Safely migrate existing legacy category relationships
    try {
      const legacyCats = database.prepare("SELECT id, slug FROM categories WHERE slug IN ('operators', 'affiliates', 'platform-providers', 'casino-apis', 'sportsbook-providers', 'sportsbook-apis', 'affi-001')").all() as { id: string; slug: string }[];
      const legacyIdToSlug: Record<string, string> = {};
      for (const lc of legacyCats) {
        legacyIdToSlug[lc.id] = lc.slug;
      }

      const companyCats = database.prepare(`
        SELECT cc.company_id, cc.category_id, comp.name as company_name
        FROM company_categories cc
        JOIN companies comp ON cc.company_id = comp.id
      `).all() as { company_id: string; category_id: string; company_name: string }[];

      const insertCompCat = database.prepare("INSERT OR IGNORE INTO company_categories (company_id, category_id) VALUES (?, ?)");

      for (const item of companyCats) {
        const legacySlug = legacyIdToSlug[item.category_id];
        if (!legacySlug) continue;

        if (legacySlug === "operators") {
          if (categoryMap["operator"]) insertCompCat.run(item.company_id, categoryMap["operator"]);
        } else if (legacySlug === "affiliates") {
          if (categoryMap["affiliate-partner"]) insertCompCat.run(item.company_id, categoryMap["affiliate-partner"]);
        } else if (legacySlug === "platform-providers") {
          if (item.company_name === "Paysafe" || item.company_name === "Worldpay") {
            if (categoryMap["payment-solution-provider"]) insertCompCat.run(item.company_id, categoryMap["payment-solution-provider"]);
          } else {
            if (categoryMap["platform-game-aggregator"]) insertCompCat.run(item.company_id, categoryMap["platform-game-aggregator"]);
          }
        } else if (legacySlug === "casino-apis") {
          if (item.company_name === "SoftSwiss") {
            if (categoryMap["platform-game-aggregator"]) insertCompCat.run(item.company_id, categoryMap["platform-game-aggregator"]);
            if (categoryMap["game-provider"]) insertCompCat.run(item.company_id, categoryMap["game-provider"]);
          } else {
            if (categoryMap["game-provider"]) insertCompCat.run(item.company_id, categoryMap["game-provider"]);
          }
        } else if (legacySlug === "sportsbook-providers" || legacySlug === "sportsbook-apis") {
          if (categoryMap["platform-game-aggregator"]) insertCompCat.run(item.company_id, categoryMap["platform-game-aggregator"]);
        }
      }

      // Migrate opportunities pointing to legacy categories
      if (categoryMap["platform-game-aggregator"]) {
        database.prepare("UPDATE opportunities SET category_id = ? WHERE category_id IN (SELECT id FROM categories WHERE slug IN ('sportsbook-providers', 'sportsbook-apis'))").run(categoryMap["platform-game-aggregator"]);
      }
      if (categoryMap["game-provider"]) {
        database.prepare("UPDATE opportunities SET category_id = ? WHERE category_id IN (SELECT id FROM categories WHERE slug = 'casino-apis')").run(categoryMap["game-provider"]);
      }

      // Deactivate obsolete categories safely
      database.prepare("UPDATE categories SET is_active = 0 WHERE slug IN ('operators', 'affiliates', 'platform-providers', 'casino-apis', 'sportsbook-providers', 'sportsbook-apis', 'affi-001')").run();
    } catch (migCatErr) {
      console.error("Error running category migration:", migCatErr);
    }

    // Seed Software Types
    const softwareTypeCount = (database.prepare("SELECT COUNT(*) as count FROM software_types").get() as { count: number }).count;
    if (softwareTypeCount === 0) {
      const initialSoftwareTypes = [
        { name: "Casino", slug: "casino", sort_order: 1 },
        { name: "Platform", slug: "platform", sort_order: 2 },
        { name: "Slots", slug: "slots", sort_order: 3 },
        { name: "Sportsbook", slug: "sportsbook", sort_order: 4 },
        { name: "Games", slug: "games", sort_order: 5 },
        { name: "Payment", slug: "payment", sort_order: 6 },
      ];
      const stmt = database.prepare("INSERT INTO software_types (id, name, slug, status, sort_order) VALUES (?, ?, ?, 'active', ?)");
      for (const st of initialSoftwareTypes) {
        stmt.run(crypto.randomUUID(), st.name, st.slug, st.sort_order);
      }
    }

    // Seed Service Types
    const serviceTypeCount = (database.prepare("SELECT COUNT(*) as count FROM service_types").get() as { count: number }).count;
    if (serviceTypeCount === 0) {
      const initialServiceTypes = [
        { name: "Affiliate Management", slug: "affiliate-management", sort_order: 1 },
        { name: "CRM", slug: "crm", sort_order: 2 },
        { name: "Customer Service", slug: "customer-service", sort_order: 3 },
        { name: "Marketing", slug: "marketing", sort_order: 4 },
      ];
      const stmt = database.prepare("INSERT INTO service_types (id, name, slug, status, sort_order) VALUES (?, ?, ?, 'active', ?)");
      for (const st of initialServiceTypes) {
        stmt.run(crypto.randomUUID(), st.name, st.slug, st.sort_order);
      }
    }

    // Seed Licenses Master
    const licenseCount = (database.prepare("SELECT COUNT(*) as count FROM licenses_master").get() as { count: number }).count;
    if (licenseCount === 0) {
      const initialLicenses = [
        { name: "Anjouan Gaming License", slug: "anjouan-gaming-license", sort_order: 1 },
        { name: "Alderney Gambling Control Commission (AGCC)", slug: "alderney-gambling-control-commission", sort_order: 2 },
        { name: "Belize Gaming Control Board (online)", slug: "belize-gaming-control-board", sort_order: 3 },
        { name: "Curacao eGaming License", slug: "curacao-egaming-license", sort_order: 4 },
        { name: "German GGL License", slug: "german-ggl-license", sort_order: 5 },
        { name: "Gibraltar Regulatory Authority", slug: "gibraltar-regulatory-authority", sort_order: 6 },
        { name: "Isle of Man Gambling Supervision Commission", slug: "isle-of-man-gambling-supervision-commission", sort_order: 7 },
        { name: "Kahnawake Gaming Commission", slug: "kahnawake-gaming-commission", sort_order: 8 },
        { name: "Malta Gaming Authority", slug: "malta-gaming-authority", sort_order: 9 },
      ];
      const stmt = database.prepare("INSERT INTO licenses_master (id, name, slug, status, sort_order) VALUES (?, ?, ?, 'active', ?)");
      for (const lic of initialLicenses) {
        stmt.run(crypto.randomUUID(), lic.name, lic.slug, lic.sort_order);
      }
    }

    // Backfill migration: ensure every registered business user has a company & is verified by default
    try {
      const nonAdminUsers = database.prepare("SELECT id, email, full_name, company_id FROM users WHERE role NOT IN ('super_admin', 'admin')").all() as { id: string; email: string; full_name: string; company_id: string | null }[];

      for (const u of nonAdminUsers) {
        let compId = u.company_id;
        if (!compId) {
          const existingComp = database.prepare("SELECT id FROM companies WHERE created_by = ?").get(u.id) as { id: string } | undefined;
          if (existingComp) {
            compId = existingComp.id;
            database.prepare("UPDATE users SET company_id = ? WHERE id = ?").run(compId, u.id);
          }
        }

        if (!compId) {
          // Create 1 company profile for user with default verified status
          compId = crypto.randomUUID();
          const compName = u.full_name?.trim() ? u.full_name : u.email.split("@")[0];
          const slug = compName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") + "-" + Date.now().toString(36);

          database.prepare(`
            INSERT INTO companies (id, name, slug, description, created_by, status, is_verified, marketplace_visibility)
            VALUES (?, ?, ?, ?, ?, 'approved', 1, 'visible')
          `).run(compId, compName, slug, `Registered B2B Partner on iGaming Connect.`, u.id);

          database.prepare("UPDATE users SET company_id = ? WHERE id = ?").run(compId, u.id);
        } else {
          // Default unverified/unspecified existing companies to verified unless explicitly overridden by admin
          const comp = database.prepare("SELECT is_verified, status FROM companies WHERE id = ?").get(compId) as { is_verified: number; status: string } | undefined;
          if (comp && comp.status !== "suspended" && comp.status !== "rejected" && (comp.is_verified === 0 || comp.is_verified === null)) {
            database.prepare("UPDATE companies SET is_verified = 1 WHERE id = ?").run(compId);
          }
        }

        // Auto-link business_role_id to company_categories for existing companies if empty
        const compFull = database.prepare("SELECT id, business_role_id, country_id FROM companies WHERE id = ?").get(compId) as { id: string; business_role_id: string | null; country_id: string | null } | undefined;
        if (compFull) {
          if (compFull.business_role_id) {
            const catCount = (database.prepare("SELECT COUNT(*) as cnt FROM company_categories WHERE company_id = ?").get(compFull.id) as { cnt: number }).cnt;
            if (catCount === 0) {
              const roleRow = database.prepare("SELECT id, name, slug FROM business_roles WHERE id = ?").get(compFull.business_role_id) as { id: string; name: string; slug: string } | undefined;
              if (roleRow) {
                const catRow = database.prepare("SELECT id FROM categories WHERE slug = ? OR name = ? OR id = ?").get(roleRow.slug, roleRow.name, roleRow.id) as { id: string } | undefined;
                if (catRow) {
                  database.prepare("INSERT OR IGNORE INTO company_categories (company_id, category_id) VALUES (?, ?)").run(compFull.id, catRow.id);
                }
              }
            }
          }

          if (compFull.country_id) {
            const geoCount = (database.prepare("SELECT COUNT(*) as cnt FROM company_geos WHERE company_id = ?").get(compFull.id) as { cnt: number }).cnt;
            if (geoCount === 0) {
              database.prepare("INSERT OR IGNORE INTO company_geos (company_id, country_id, is_top, display_order) VALUES (?, ?, 1, 1)").run(compFull.id, compFull.country_id);
            }
          }

          // Backfill contact_email if null
          database.prepare("UPDATE companies SET contact_email = (SELECT email FROM users WHERE id = companies.created_by) WHERE (contact_email IS NULL OR contact_email = '') AND created_by IS NOT NULL AND id = ?").run(compFull.id);
        }
      }
    } catch (backfillErr) {
      console.error("Error backfilling users and companies:", backfillErr);
    }

    // Call seedOffers lazily
    try {
      const { seedOffers } = require("./seed");
      seedOffers(database);
    } catch (e) {
      console.error("Error auto-seeding offers:", e);
    }
  } catch (seedErr) {
    console.error("Error seeding master tables:", seedErr);
  }

  return database;
}
