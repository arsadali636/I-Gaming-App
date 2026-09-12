import crypto from "crypto";
import { getDb } from "./db";

export function seedPricingData() {
  const db = getDb();

  // Check if affiliate-management exists; if missing, re-seed all tables
  const affiliateCheck = (
    db.prepare("SELECT COUNT(*) as count FROM pricing_categories WHERE slug = 'affiliate-management'").get() as { count: number }
  )?.count ?? 0;

  const existingCount = (
    db.prepare("SELECT COUNT(*) as count FROM pricing_categories").get() as { count: number }
  )?.count ?? 0;

  if (existingCount > 0 && affiliateCheck > 0) {
    return { message: "Pricing data already initialized" };
  }

  console.log("Seeding complete Pricing System data (Operators, B2B Providers, PLUS, Affiliate Management)...");

  // Wipe existing tables to ensure clean state
  db.exec(`
    DELETE FROM pricing_plan_features;
    DELETE FROM plus_benefits;
    DELETE FROM pricing_plans;
    DELETE FROM pricing_categories;
    DELETE FROM pricing_nav_items;
  `);

  const now = new Date().toISOString();

  // 1. Categories
  const catOperatorsId = crypto.randomUUID();
  const catB2bId = crypto.randomUUID();
  const catPlusId = crypto.randomUUID();
  const catAffiliateId = crypto.randomUUID();

  const insertCategory = db.prepare(`
    INSERT INTO pricing_categories (id, name, slug, description, display_order, is_active, show_on_public_page, is_plus_layout, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?, ?)
  `);

  insertCategory.run(catOperatorsId, "Operators", "operators", "Visibility and partnership packages for online & retail gaming operators", 1, 1, 0, now, now);
  insertCategory.run(catB2bId, "B2B Providers", "b2b-providers", "Showcase your technology, platform solutions, software & APIs to operators", 2, 1, 0, now, now);
  insertCategory.run(catPlusId, "PLUS", "plus", "Exclusive visibility. Maximum impact. Reserved for single operator placements.", 3, 1, 1, now, now);
  insertCategory.run(catAffiliateId, "Affiliate Management", "affiliate-management", "Complete affiliate program management, tracking & growth packages", 4, 0, 0, now, now);

  const insertPlan = db.prepare(`
    INSERT INTO pricing_plans (id, category_id, name, slug, short_description, price, currency, billing_period, icon, button_text, button_action, is_featured, is_popular, badge_text, display_order, is_active, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
  `);

  const insertFeature = db.prepare(`
    INSERT INTO pricing_plan_features (id, pricing_plan_id, feature_text, feature_description, is_included, display_order, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  // 2. Plans & Features for Operators
  const planSilverId = crypto.randomUUID();
  const planGoldId = crypto.randomUUID();
  const planPlatinumId = crypto.randomUUID();

  insertPlan.run(
    planSilverId, catOperatorsId, "Silver", "silver", "Grow Your Network",
    2100, "€", "/ year", "Layers", "Get Started", "/register", 0, 0, null, 1, now, now
  );
  insertPlan.run(
    planGoldId, catOperatorsId, "Gold", "gold", "Accelerate Partnerships",
    3900, "€", "/ year", "Sparkles", "Get Started", "/register", 1, 1, "Most Popular", 2, now, now
  );
  insertPlan.run(
    planPlatinumId, catOperatorsId, "Platinum", "platinum", "Maximize Influence",
    5900, "€", "/ year", "Crown", "Get Started", "/register", 0, 0, "Recommended", 3, now, now
  );

  const silverFeatures = [
    { text: "Direct Access & Visibility", inc: 1 },
    { text: "Banner on Operators' Page", inc: 1 },
    { text: "Official Press Release Announcement", inc: 1 },
    { text: 'Added to "Best iGaming Offers"', inc: 1 },
    { text: "Banner in Weekly Newsletter", inc: 0 },
    { text: "Starred Offer Placement", inc: 0 },
  ];
  silverFeatures.forEach((f, idx) => {
    insertFeature.run(crypto.randomUUID(), planSilverId, f.text, null, f.inc, idx + 1, now);
  });

  const goldFeatures = [
    { text: "Everything in Silver, plus:", inc: 1 },
    { text: "Banner in Weekly Newsletter", inc: 1 },
    { text: "One Sub-Brand Slot Included", inc: 1 },
    { text: "Starred Offer Placement", inc: 1 },
    { text: "Exclusive Interview with Company Rep", inc: 1 },
    { text: "Homepage Top Operators Section Placement", inc: 1 },
  ];
  goldFeatures.forEach((f, idx) => {
    insertFeature.run(crypto.randomUUID(), planGoldId, f.text, null, f.inc, idx + 1, now);
  });

  const platinumFeatures = [
    { text: "Everything in Gold, plus:", inc: 1 },
    { text: "More Banners on Operators Page & Newsletters", inc: 1 },
    { text: "More Sub-brand & Starred Offer slots included", inc: 1 },
    { text: "Platinum Verification Badge", inc: 1 },
    { text: "Website Review Recording", inc: 1 },
    { text: "Dedicated Branded Review Page", inc: 1 },
  ];
  platinumFeatures.forEach((f, idx) => {
    insertFeature.run(crypto.randomUUID(), planPlatinumId, f.text, null, f.inc, idx + 1, now);
  });

  // 3. Plans & Features for B2B Providers
  const planB2bStdId = crypto.randomUUID();
  const planB2bAdvId = crypto.randomUUID();
  const planB2bPremId = crypto.randomUUID();

  insertPlan.run(
    planB2bStdId, catB2bId, "Standard", "standard", "Get in front of operators",
    2900, "€", "/ year", "Server", "Get Started", "/register", 0, 0, null, 1, now, now
  );
  insertPlan.run(
    planB2bAdvId, catB2bId, "Advanced", "advanced", "Grow Your Network",
    4900, "€", "/ year", "Cpu", "Get Started", "/register", 1, 1, "Most Popular", 2, now, now
  );
  insertPlan.run(
    planB2bPremId, catB2bId, "Premium", "premium", "Maximize Influence",
    6900, "€", "/ year", "ShieldCheck", "Get Started", "/register", 0, 0, "Enterprise Level", 3, now, now
  );

  const b2bStdFeatures = [
    { text: "Direct Access & Visibility", inc: 1 },
    { text: "Newsletters With Newly Joined Brands", inc: 1 },
    { text: "Banner on Operators' Page", inc: 1 },
    { text: "Banner in Weekly Newsletter", inc: 1 },
    { text: "iGaming Connect Seal of Compliance", inc: 1 },
    { text: "Official Press Release Announcement", inc: 1 },
  ];
  b2bStdFeatures.forEach((f, idx) => {
    insertFeature.run(crypto.randomUUID(), planB2bStdId, f.text, null, f.inc, idx + 1, now);
  });

  const b2bAdvFeatures = [
    { text: "Direct Access & Visibility", inc: 1 },
    { text: "Newsletters With Newly Joined Brands", inc: 1 },
    { text: "Banner on Operators' Page & Newsletter", inc: 1 },
    { text: "iGaming Connect Seal of Compliance", inc: 1 },
    { text: "Priority Listing on the Directory", inc: 1 },
    { text: "Complimentary PR Pick-Up (1x)", inc: 1 },
  ];
  b2bAdvFeatures.forEach((f, idx) => {
    insertFeature.run(crypto.randomUUID(), planB2bAdvId, f.text, null, f.inc, idx + 1, now);
  });

  const b2bPremFeatures = [
    { text: "Direct Access & Visibility", inc: 1 },
    { text: "Homepage Top iGaming Section Placement", inc: 1 },
    { text: "Platinum Verification Badge & Review Video", inc: 1 },
    { text: "Branded Review Page & Press Release", inc: 1 },
    { text: "Complimentary PR Pick-Up (3x)", inc: 1 },
    { text: "Exclusive Interview with Company Rep", inc: 1 },
  ];
  b2bPremFeatures.forEach((f, idx) => {
    insertFeature.run(crypto.randomUUID(), planB2bPremId, f.text, null, f.inc, idx + 1, now);
  });

  // 4. Plans & Features for Affiliate Management
  const planAffBasicId = crypto.randomUUID();
  const planAffProId = crypto.randomUUID();
  const planAffEntId = crypto.randomUUID();

  insertPlan.run(
    planAffBasicId, catAffiliateId, "Basic", "basic", "Starter Affiliate Management",
    1500, "€", "/ year", "Users", "Get Started", "/register", 0, 0, null, 1, now, now
  );
  insertPlan.run(
    planAffProId, catAffiliateId, "Professional", "professional", "Advanced Affiliate Growth",
    3500, "€", "/ year", "Star", "Get Started", "/register", 1, 1, "Most Popular", 2, now, now
  );
  insertPlan.run(
    planAffEntId, catAffiliateId, "Enterprise", "enterprise", "Full Scale Affiliate Operations",
    5900, "€", "/ year", "Award", "Get Started", "/register", 0, 0, "Enterprise Level", 3, now, now
  );

  const affBasicFeatures = [
    { text: "Affiliate Directory Listing", inc: 1 },
    { text: "Basic Performance Dashboard", inc: 1 },
    { text: "Standard Commission Tracking", inc: 1 },
    { text: "Email Support & Guidance", inc: 1 },
    { text: "Automated Payout Calculations", inc: 0 },
    { text: "Dedicated Affiliate Manager", inc: 0 },
  ];
  affBasicFeatures.forEach((f, idx) => {
    insertFeature.run(crypto.randomUUID(), planAffBasicId, f.text, null, f.inc, idx + 1, now);
  });

  const affProFeatures = [
    { text: "Everything in Basic, plus:", inc: 1 },
    { text: "Priority Affiliate Network Listing", inc: 1 },
    { text: "Automated Payout Calculations", inc: 1 },
    { text: "Dedicated Affiliate Manager", inc: 1 },
    { text: "Newsletter Feature Announcement (1x/mo)", inc: 1 },
    { text: "Custom API & Webhook Integrations", inc: 0 },
  ];
  affProFeatures.forEach((f, idx) => {
    insertFeature.run(crypto.randomUUID(), planAffProId, f.text, null, f.inc, idx + 1, now);
  });

  const affEntFeatures = [
    { text: "Everything in Professional, plus:", inc: 1 },
    { text: "Custom API & Webhook Integrations", inc: 1 },
    { text: "Exclusive Placement on Affiliate Hub", inc: 1 },
    { text: "Co-Marketing & PR Press Release Campaigns", inc: 1 },
    { text: "24/7 VIP Account Management", inc: 1 },
    { text: "Custom Contract Terms & SLA", inc: 1 },
  ];
  affEntFeatures.forEach((f, idx) => {
    insertFeature.run(crypto.randomUUID(), planAffEntId, f.text, null, f.inc, idx + 1, now);
  });

  // 5. PLUS Benefits
  const plusBenefits = [
    { title: "Main Top List", desc: "Your brand featured in a premium position of iGaming Connect's Main Directory." },
    { title: "Featured Offer on Home Page", desc: "Your offer featured on iGaming Connect's homepage for maximum visibility and exposure." },
    { title: "Featured in Casino & B2B Articles", desc: "Your brand featured in a premium position of our dedicated industry articles and newsletters." },
    { title: "Dedicated Review Page", desc: "Dedicated review page featuring a comprehensive overview, screenshots, and rating of your brand." },
    { title: "Priority Directory Placement", desc: "Highest priority visibility across all search filters and directory pages." },
  ];

  const insertBenefit = db.prepare(`
    INSERT INTO plus_benefits (id, category_id, title, description, display_order, is_active, created_at)
    VALUES (?, ?, ?, ?, ?, 1, ?)
  `);

  plusBenefits.forEach((b, idx) => {
    insertBenefit.run(crypto.randomUUID(), catPlusId, b.title, b.desc, idx + 1, now);
  });

  // 6. Pricing Nav Dropdown Items
  const insertNavItem = db.prepare(`
    INSERT INTO pricing_nav_items (id, title, href, description, display_order, is_active, created_at)
    VALUES (?, ?, ?, ?, ?, 1, ?)
  `);

  insertNavItem.run(crypto.randomUUID(), "Directory Pricing", "/directory-pricing", "View packages for Operators, B2B & PLUS", 1, now);
  insertNavItem.run(crypto.randomUUID(), "Affiliate Management", "/directory-pricing?category=affiliate-management", "Affiliate Management packages", 2, now);

  console.log("Pricing System database seeded successfully with all 4 categories!");
  return { message: "Pricing data initialized successfully" };
}
