import crypto from "crypto";
import { getDb, initDb } from "./db";
import { hashPassword } from "./auth-local";

export async function seedDatabase() {
  const db = initDb();

  // Check if already seeded
  const existingCategories = db.prepare("SELECT COUNT(*) as count FROM categories").get() as { count: number };
  if (existingCategories.count > 0) {
    console.log("Database already seeded. Skipping.");
    return { message: "Database already seeded" };
  }

  const now = new Date().toISOString();

  // ============================================================
  // 1. CATEGORIES (13)
  // ============================================================
  const categories = [
    { id: crypto.randomUUID(), name: "Platform Providers", slug: "platform-providers", description: "Full-stack iGaming platform solutions, white-label systems, and operator infrastructure", icon: "Server", color: "#6c5ce7", sort_order: 1 },
    { id: crypto.randomUUID(), name: "Sportsbook Providers", slug: "sportsbook-providers", description: "Sports betting platforms, odds compilation, managed trading, and sportsbook technology", icon: "Trophy", color: "#00d2ff", sort_order: 2 },
    { id: crypto.randomUUID(), name: "Sportsbook APIs", slug: "sportsbook-apis", description: "Sportsbook data feeds, odds APIs, live scoring, and trading API solutions", icon: "Zap", color: "#00ffc8", sort_order: 3 },
    { id: crypto.randomUUID(), name: "Casino APIs", slug: "casino-apis", description: "Casino game aggregation, live dealer APIs, slot content delivery, and gaming data feeds", icon: "Dice1", color: "#ff6b9d", sort_order: 4 },
    { id: crypto.randomUUID(), name: "Operators", slug: "operators", description: "Licensed online and retail gaming operators running consumer-facing betting and casino brands", icon: "Building2", color: "#a29bfe", sort_order: 5 },
    { id: crypto.randomUUID(), name: "Affiliates", slug: "affiliates", description: "Affiliate marketing networks, lead generation, content sites, and performance marketing for iGaming", icon: "Share2", color: "#fdcb6e", sort_order: 6 },
  ];

  const insertCategory = db.prepare(
    "INSERT INTO categories (id, name, slug, description, icon, color, sort_order, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, 1)"
  );
  for (const c of categories) {
    insertCategory.run(c.id, c.name, c.slug, c.description, c.icon, c.color, c.sort_order);
  }

  // ============================================================
  // 2. COUNTRIES (20+)
  // ============================================================
  const countries = [
    { id: crypto.randomUUID(), name: "Malta", code: "MT", region: "Europe" },
    { id: crypto.randomUUID(), name: "United Kingdom", code: "GB", region: "Europe" },
    { id: crypto.randomUUID(), name: "Gibraltar", code: "GI", region: "Europe" },
    { id: crypto.randomUUID(), name: "Isle of Man", code: "IM", region: "Europe" },
    { id: crypto.randomUUID(), name: "Curaçao", code: "CW", region: "Caribbean" },
    { id: crypto.randomUUID(), name: "Sweden", code: "SE", region: "Europe" },
    { id: crypto.randomUUID(), name: "Denmark", code: "DK", region: "Europe" },
    { id: crypto.randomUUID(), name: "Spain", code: "ES", region: "Europe" },
    { id: crypto.randomUUID(), name: "Italy", code: "IT", region: "Europe" },
    { id: crypto.randomUUID(), name: "Germany", code: "DE", region: "Europe" },
    { id: crypto.randomUUID(), name: "France", code: "FR", region: "Europe" },
    { id: crypto.randomUUID(), name: "Netherlands", code: "NL", region: "Europe" },
    { id: crypto.randomUUID(), name: "Poland", code: "PL", region: "Europe" },
    { id: crypto.randomUUID(), name: "Romania", code: "RO", region: "Europe" },
    { id: crypto.randomUUID(), name: "Portugal", code: "PT", region: "Europe" },
    { id: crypto.randomUUID(), name: "Ireland", code: "IE", region: "Europe" },
    { id: crypto.randomUUID(), name: "Philippines", code: "PH", region: "Asia" },
    { id: crypto.randomUUID(), name: "India", code: "IN", region: "Asia" },
    { id: crypto.randomUUID(), name: "Australia", code: "AU", region: "Oceania" },
    { id: crypto.randomUUID(), name: "Canada", code: "CA", region: "Americas" },
    { id: crypto.randomUUID(), name: "United States", code: "US", region: "Americas" },
    { id: crypto.randomUUID(), name: "Brazil", code: "BR", region: "Americas" },
    { id: crypto.randomUUID(), name: "South Africa", code: "ZA", region: "Africa" },
    { id: crypto.randomUUID(), name: "Nigeria", code: "NG", region: "Africa" },
  ];

  const insertCountry = db.prepare("INSERT INTO countries (id, name, code, region) VALUES (?, ?, ?, ?)");
  for (const c of countries) {
    insertCountry.run(c.id, c.name, c.code, c.region);
  }

  // Country lookup by name
  const countryByName: Record<string, string> = {};
  for (const c of countries) {
    countryByName[c.name] = c.id;
  }

  // ============================================================
  // 3. PLANS (3)
  // ============================================================
  const plans = [
    { id: crypto.randomUUID(), name: "Starter", slug: "starter", price: 299, credits: 30, features: JSON.stringify(["30 contact reveals per month", "Browse all companies", "Basic search filters", "Save companies", "Email support"]) },
    { id: crypto.randomUUID(), name: "Professional", slug: "professional", price: 499, credits: 50, features: JSON.stringify(["50 contact reveals per month", "Priority search ranking", "Advanced filters", "Company analytics", "Priority support", "Export contacts"]) },
    { id: crypto.randomUUID(), name: "Enterprise", slug: "enterprise", price: 0, credits: -1, features: JSON.stringify(["Unlimited contact reveals", "Custom integrations", "Dedicated account manager", "API access", "Custom branding", "SLA guarantee"]) },
  ];

  const insertPlan = db.prepare(
    "INSERT INTO plans (id, name, slug, price, credits, features, is_active) VALUES (?, ?, ?, ?, ?, ?, 1)"
  );
  for (const p of plans) {
    insertPlan.run(p.id, p.name, p.slug, p.price, p.credits, p.features);
  }

  // ============================================================
  // 4. ADMIN USER
  // ============================================================
  const adminId = crypto.randomUUID();
  const adminHash = hashPassword("admin123");
  db.prepare(
    "INSERT INTO users (id, email, full_name, password_hash, role, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
  ).run(adminId, "admin@igamingconnect.com", "Platform Administrator", adminHash, "super_admin", now, now);

  // Admin wallet with 100 credits
  const adminWalletId = crypto.randomUUID();
  db.prepare(
    "INSERT INTO contact_credit_wallets (id, user_id, balance, total_earned, total_used, created_at, updated_at) VALUES (?, ?, 100, 100, 0, ?, ?)"
  ).run(adminWalletId, adminId, now, now);

  // ============================================================
  // 5. DEMO PROFESSIONAL USERS (5)
  // ============================================================
  const demoUsers = [
    { id: crypto.randomUUID(), email: "buyer@demo.com", full_name: "Marcus Henderson", role: "professional", walletBalance: 10 },
    { id: crypto.randomUUID(), email: "seller@demo.com", full_name: "Elena Volkov", role: "professional", walletBalance: 5 },
    { id: crypto.randomUUID(), email: "partner@demo.com", full_name: "James Chen", role: "professional", walletBalance: 15 },
    { id: crypto.randomUUID(), email: "affiliate@demo.com", full_name: "Sofia Rodriguez", role: "professional", walletBalance: 8 },
    { id: crypto.randomUUID(), email: "admin2@demo.com", full_name: "David Mueller", role: "admin", walletBalance: 25 },
  ];

  const demoHash = hashPassword("demo123");
  const insertUser = db.prepare(
    "INSERT INTO users (id, email, full_name, password_hash, role, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
  );
  const insertWallet = db.prepare(
    "INSERT INTO contact_credit_wallets (id, user_id, balance, total_earned, total_used, created_at, updated_at) VALUES (?, ?, ?, ?, 0, ?, ?)"
  );

  for (const u of demoUsers) {
    insertUser.run(u.id, u.email, u.full_name, demoHash, u.role, now, now);
    insertWallet.run(crypto.randomUUID(), u.id, u.walletBalance, u.walletBalance, now, now);
  }

  // ============================================================
  // 6. COMPANIES (20) with related data
  // ============================================================
  const catLookup: Record<string, string> = {};
  for (const c of categories) catLookup[c.slug] = c.id;

  const companiesData = [
    {
      name: "BetConstruct", slug: "betconstruct", website: "https://www.betconstruct.com",
      description: "BetConstruct is a global award-winning technology and service provider for the online and land-based gaming industry. The company offers a comprehensive suite of products including sportsbook, casino, live dealer, fantasy sports, and social gaming solutions. With over two decades of experience, BetConstruct powers operators across 50+ jurisdictions worldwide.",
      founded: 2003, hq: "Yerevan", country: "Armenia", employees: "1001-5000", market: "B2B",
      categories: ["platform-providers", "sportsbook-providers"], featured: 1,
      products: [{ name: "Spring BME", desc: "Business Management Environment platform for complete operator management" }, { name: "Sportsbook Solution", desc: "White-label sportsbook with 120,000+ pre-match and 70,000+ live events monthly" }],
      services: [{ name: "White Label Casino", desc: "Full white-label casino solution with 8,000+ games from 100+ providers" }],
      license: { name: "MGA License", jurisdiction: "Malta", number: "MGA/CRP/123/2010" },
      contacts: [
        { name: "Vigen Badalyan", position: "Founder & CEO", email: "v.badalyan@betconstruct.com", phone: "+374 10 123456", primary: 1 },
        { name: "Aram Mkrtchyan", position: "CTO", email: "a.mkrtchyan@betconstruct.com", phone: "+374 10 123457", primary: 0 },
      ],
    },
    {
      name: "Evolution Gaming", slug: "evolution-gaming", website: "https://www.evolution.com",
      description: "Evolution Gaming is the world's leading provider of live casino solutions, offering an unmatched portfolio of real-time dealer games streamed from state-of-the-art studios. The company serves over 600 operators globally and has pioneered innovations including Lightning Roulette, Crazy Time, and live game show formats. Listed on the Swedish Stock Exchange, Evolution is the gold standard in live dealer gaming.",
      founded: 2006, hq: "Stockholm", country: "Sweden", employees: "5001-10000", market: "B2B",
      categories: ["casino-apis"], featured: 1,
      products: [{ name: "Live Casino", desc: "Premium live dealer platform with roulette, blackjack, baccarat, and game shows" }, { name: "First Person Games", desc: " RNG-based 3D-rendered versions of Evolution's live games" }],
      services: [{ name: "Studio Solutions", desc: "Custom-branded live casino studio design and deployment" }],
      license: { name: "MGA License", jurisdiction: "Malta", number: "MGA/CRP/456/2012" },
      contacts: [
        { name: "Martin Carlesund", position: "CEO", email: "m.carlesund@evolution.com", phone: "+46 8 123 4567", primary: 1 },
        { name: "Jens von Bahr", position: "Chairman", email: "j.vonbahr@evolution.com", phone: "+46 8 123 4568", primary: 0 },
      ],
    },
    {
      name: "NetEnt", slug: "netent", website: "https://www.netent.com",
      description: "NetEnt, part of the Evolution Group, is one of the world's most established casino game development studios. The company is renowned for iconic slot titles including Starburst, Gonzo's Quest, and Dead or Alive. With a catalogue of over 500 games, NetEnt delivers premium entertainment to operators across regulated markets globally.",
      founded: 1996, hq: "Stockholm", country: "Sweden", employees: "1001-5000", market: "B2B",
      categories: ["casino-apis"], featured: 1,
      products: [{ name: "Slot Portfolio", desc: "Collection of 500+ slot games including branded and progressive jackpot titles" }, { name: "NetEnt Live", desc: "Live dealer solution with professional dealers and HD streaming" }],
      services: [{ name: "Game Integration", desc: "Seamless API integration with major platform providers" }],
      license: { name: "MGA License", jurisdiction: "Malta", number: "MGA/CRP/789/2014" },
      contacts: [
        { name: "Therese Hillman", position: "CEO", email: "t.hillman@netent.com", phone: "+46 8 234 5678", primary: 1 },
        { name: "Björn Krantz", position: "Managing Director", email: "b.krantz@netent.com", phone: "+46 8 234 5679", primary: 0 },
      ],
    },
    {
      name: "Pragmatic Play", slug: "pragmatic-play", website: "https://www.pragmaticplay.com",
      description: "Pragmatic Play is a multi-product content provider serving the iGaming industry with slots, live casino, bingo, and virtual sports. The company releases up to eight new slot titles per month and has won numerous industry awards for innovation. Pragmatic Play's products are available through a single API integration and are certified in over 20 jurisdictions.",
      founded: 2015, hq: "Sliema", country: "Malta", employees: "1001-5000", market: "B2B",
      categories: ["casino-apis"], featured: 1,
      products: [{ name: "Slot Games", desc: "Portfolio of 300+ HTML5 slot games with innovative mechanics and bonus features" }, { name: "Live Casino", desc: "Immersive live dealer platform with blackjack, roulette, and game shows" }, { name: "Virtual Sports", desc: "Simulated sports events with realistic graphics and fast-paced betting markets" }],
      services: [{ name: "Operator Platform", desc: "Complete operator platform with CRM, reporting, and player management tools" }],
      license: { name: "MGA License", jurisdiction: "Malta", number: "MGA/B2B/317/2016" },
      contacts: [
        { name: "Yossi Barzely", position: "Chief Business Development Officer", email: "y.barzely@pragmaticplay.com", phone: "+356 201 23456", primary: 1 },
        { name: "Julian Jarvis", position: "CEO", email: "j.jarvis@pragmaticplay.com", phone: "+356 201 23457", primary: 0 },
      ],
    },
    {
      name: "Bet365", slug: "bet365", website: "https://www.bet365.com",
      description: "Bet365 is one of the world's largest online gambling companies, operating a leading sports betting and gaming platform. The company offers comprehensive coverage of sports events worldwide alongside a full casino, poker, and bingo product suite. Founded by the Coates family, Bet365 has grown to serve over 80 million customers across multiple jurisdictions.",
      founded: 2000, hq: "Stoke-on-Trent", country: "United Kingdom", employees: "10001+", market: "B2C",
      categories: ["operators"], featured: 1,
      products: [{ name: "Sportsbook Platform", desc: "Industry-leading sports betting platform covering 80+ sports and 600,000+ events annually" }, { name: "Casino", desc: "Full-service online casino with 1,000+ games from premium providers" }],
      services: [{ name: "Live Streaming", desc: "Extensive live streaming service covering major global sporting events" }],
      license: { name: "UKGC License", jurisdiction: "United Kingdom", number: "039563-R-319752-009" },
      contacts: [
        { name: "Denise Coates", position: "Joint CEO", email: "d.coates@bet365.com", phone: "+44 178 234 5678", primary: 1 },
        { name: "John Coates", position: "Joint CEO", email: "j.coates@bet365.com", phone: "+44 178 234 5679", primary: 0 },
      ],
    },
    {
      name: "Flutter Entertainment", slug: "flutter-entertainment", website: "https://www.flutterentertainment.com",
      description: "Flutter Entertainment is the world's largest sports betting and gaming company, operating a diverse portfolio of iconic brands including Paddy Power, Betfair, FanDuel, and PokerStars. The company combines industry-leading technology with a strong culture of responsible gambling to deliver exceptional experiences to over 20 million customers globally.",
      founded: 2015, hq: "Dublin", country: "Ireland", employees: "10001+", market: "B2C",
      categories: ["operators"], featured: 0,
      products: [{ name: "Paddy Power", desc: "Leading UK and Ireland retail and online sportsbook brand" }, { name: "Betfair Exchange", desc: "World's largest online betting exchange platform" }, { name: "FanDuel", desc: "Premier US sports betting and daily fantasy sports platform" }],
      services: [{ name: "Multi-brand Platform", desc: "Unified technology platform powering multiple international gaming brands" }],
      license: { name: "UKGC License", jurisdiction: "United Kingdom", number: "039439-R-319347-009" },
      contacts: [
        { name: "Peter Jackson", position: "Group CEO", email: "p.jackson@flutter.com", phone: "+353 1 234 5678", primary: 1 },
        { name: "Conor O'Mahony", position: "CTO", email: "c.omahony@flutter.com", phone: "+353 1 234 5679", primary: 0 },
      ],
    },
    {
      name: "Playtech", slug: "playtech", website: "https://www.playtech.com",
      description: "Playtech is a leading technology company in the gambling industry, providing software, platform solutions, and content to online and land-based operators. The company offers a comprehensive suite including sports betting, casino, poker, bingo, and lottery products. Playtech's IMS platform manages over 20 million active player accounts across the globe.",
      founded: 1999, hq: "Douglas", country: "Isle of Man", employees: "6000+", market: "B2B",
      categories: ["platform-providers"], featured: 1,
      products: [{ name: "Playtech IMS", desc: "Intelligent Management System for player lifecycle management and CRM" }, { name: "Casino", desc: "Premium casino suite with 600+ games including branded content" }],
      services: [{ name: "Platform Integration", desc: "End-to-end platform deployment with ongoing operational support" }],
      license: { name: "MGA License", jurisdiction: "Malta", number: "MGA/CRP/131/2012" },
      contacts: [
        { name: "Mor Weizer", position: "CEO", email: "m.weizer@playtech.com", phone: "+44 162 434 5678", primary: 1 },
        { name: "Shimon Akad", position: "COO", email: "s.akad@playtech.com", phone: "+44 162 434 5679", primary: 0 },
      ],
    },
    {
      name: "Microgaming", slug: "microgaming", website: "https://www.microgaming.com",
      description: "Microgaming is a pioneer of online gaming, having developed the world's first true online casino software in 1994. The company operates the largest progressive jackpot network in the industry, with over €1.5 billion paid out to date. Microgaming's content is distributed via its exclusive platform, offering operators access to 900+ games.",
      founded: 1994, hq: "Douglas", country: "Isle of Man", employees: "501-1000", market: "B2B",
      categories: ["casino-apis"], featured: 0,
      products: [{ name: "Progressive Jackpot Network", desc: "Industry's largest progressive jackpot network with Mega Moolah and WowPot franchises" }, { name: "Game Portfolio", desc: "900+ games including slots, table games, and live dealer via independent studios" }],
      services: [{ name: "Operator Platform", desc: "Complete platform solution with player management, reporting, and affiliate tools" }],
      license: { name: "MGA License", jurisdiction: "Malta", number: "MGA/CRP/456/2018" },
      contacts: [
        { name: "John Coleman", position: "CEO", email: "j.coleman@microgaming.com", phone: "+44 162 456 7890", primary: 1 },
        { name: "Jean-Luc Ferriere", position: "CCO", email: "j.ferriere@microgaming.com", phone: "+44 162 456 7891", primary: 0 },
      ],
    },
    {
      name: "IGT", slug: "igt", website: "https://www.igt.com",
      description: "International Game Technology (IGT) is a global leader in gaming, providing cutting-edge technology solutions across the gaming value chain. The company operates in both the lottery and gaming segments, serving operators and government entities in over 100 countries. IGT's digital platform powers major sports betting and iGaming operations across regulated US and international markets.",
      founded: 1990, hq: "Las Vegas", country: "United States", employees: "10001+", market: "B2B",
      categories: ["sportsbook-providers"], featured: 0,
      products: [{ name: "PlayDigital Platform", desc: "Omni-channel digital gaming platform with sportsbook integration" }, { name: "IGT Advantage", desc: "Casino management system with player loyalty and analytics tools" }],
      services: [{ name: "Turnkey Solutions", desc: "End-to-end gaming system deployment and management services" }],
      license: { name: "UKGC License", jurisdiction: "United Kingdom", number: "041792-R-319348-012" },
      contacts: [
        { name: "Vince Sadusky", position: "CEO", email: "v.sadusky@igt.com", phone: "+1 702 669 6777", primary: 1 },
        { name: "Maximiliano Diaz", position: "CEO Digital & Betting", email: "m.diaz@igt.com", phone: "+1 702 669 6778", primary: 0 },
      ],
    },
    {
      name: "Scientific Games", slug: "scientific-games", website: "https://www.scientificgames.com",
      description: "Scientific Games (now Light & Wonder) is a leading cross-platform global game company serving the regulated gaming, lottery, and social industries. The company provides innovative game content, systems, and technology to operators worldwide. Following the divestiture of its lottery and sports betting businesses, Light & Wonder focuses on gaming and social experiences.",
      founded: 1973, hq: "Las Vegas", country: "United States", employees: "8000+", market: "B2B",
      categories: ["platform-providers"], featured: 0,
      products: [{ name: "Gaming Platform", desc: "Comprehensive gaming platform with slots, table games, and system solutions" }, { name: "OpenGaming", desc: "Open gaming ecosystem connecting operators with game studios globally" }],
      services: [{ name: "Systems Integration", desc: "Casino floor technology integration and operational consulting" }],
      license: { name: "Nevada License", jurisdiction: "United States", number: "NV-12345" },
      contacts: [
        { name: "Barry Cottle", position: "CEO", email: "b.cottle@scientificgames.com", phone: "+1 702 734 7777", primary: 1 },
        { name: "Matt Wilson", position: "CEO Gaming", email: "m.wilson@scientificgames.com", phone: "+1 702 734 7778", primary: 0 },
      ],
    },
    {
      name: "Paysafe", slug: "paysafe", website: "https://www.paysafe.com",
      description: "Paysafe is a leading specialized payments platform connecting merchants and consumers across 100+ payment types in 40+ currencies. The company provides end-to-end payment solutions for the iGaming industry including cards, e-wallets, bank transfers, and cash-based payments. Paysafe processes billions in annual transaction volume for gaming operators worldwide.",
      founded: 2000, hq: "London", country: "United Kingdom", employees: "2001-5000", market: "B2B",
      categories: ["platform-providers"], featured: 1,
      products: [{ name: "Payment Processing", desc: "Full-stack payment processing with support for 100+ payment methods globally" }, { name: "Skrill & NETELLER", desc: "Leading e-wallet solutions popular among iGaming players and operators" }],
      services: [{ name: "Fraud Prevention", desc: "Advanced fraud detection and prevention tools optimized for gaming transactions" }],
      license: { name: "FCA License", jurisdiction: "United Kingdom", number: "00000000" },
      contacts: [
        { name: "Philip McHugh", position: "CEO", email: "p.mchugh@paysafe.com", phone: "+44 20 3456 7890", primary: 1 },
        { name: "Drew Birtwistle", position: "CTO", email: "d.birtwistle@paysafe.com", phone: "+44 20 3456 7891", primary: 0 },
      ],
    },
    {
      name: "Worldpay", slug: "worldpay", website: "https://www.worldpay.com",
      description: "Worldpay is a global payments technology company processing over 40 billion transactions annually. The company provides payment processing, card issuing, and commerce solutions for businesses across all industries including gaming. Worldpay's gaming-specific payment infrastructure handles complex regulatory requirements and high-volume transaction processing.",
      founded: 1997, hq: "London", country: "United Kingdom", employees: "5001-10000", market: "B2B",
      categories: ["platform-providers"], featured: 0,
      products: [{ name: "Gaming Payments", desc: "Specialized payment processing for online and land-based gaming operations" }, { name: "Merchant Services", desc: "Global acquiring and card processing for gaming merchants" }],
      services: [{ name: "Regulatory Compliance", desc: "Payment compliance advisory for regulated gaming markets" }],
      license: { name: "FCA License", jurisdiction: "United Kingdom", number: "00000001" },
      contacts: [
        { name: "Jim Johnson", position: "CEO", email: "j.johnson@worldpay.com", phone: "+44 20 4567 8901", primary: 1 },
        { name: "Shane Happach", position: "EVP Commercial", email: "s.happach@worldpay.com", phone: "+44 20 4567 8902", primary: 0 },
      ],
    },
    {
      name: "Betfair", slug: "betfair", website: "https://www.betfair.com",
      description: "Betfair is the world's largest online betting exchange, enabling customers to bet against each other rather than against a bookmaker. Part of Flutter Entertainment, Betfair combines its innovative exchange product with a sportsbook, casino, poker, and arcade games. The exchange model offers better odds and greater transparency to bettors worldwide.",
      founded: 2000, hq: "London", country: "United Kingdom", employees: "5001-10000", market: "B2C",
      categories: ["operators"], featured: 0,
      products: [{ name: "Betfair Exchange", desc: "Pioneering betting exchange platform with peer-to-peer wagering" }, { name: "Sportsbook", desc: "Traditional fixed-odds sportsbook with comprehensive market coverage" }],
      services: [{ name: "API Services", desc: "Market-leading API for algorithmic trading and automated betting strategies" }],
      license: { name: "UKGC License", jurisdiction: "United Kingdom", number: "039439-R-319347-009" },
      contacts: [
        { name: "Bret Richard", position: "Managing Director", email: "b.richard@betfair.com", phone: "+44 20 8234 5678", primary: 1 },
        { name: "Cris Sherard", position: "Head of Exchange", email: "c.sherard@betfair.com", phone: "+44 20 8234 5679", primary: 0 },
      ],
    },
    {
      name: "DraftKings", slug: "draftkings", website: "https://www.draftkings.com",
      description: "DraftKings is a leading daily fantasy sports and sports betting operator in the United States. The company offers mobile sports betting in 20+ states, an online casino in select jurisdictions, and daily fantasy sports contests. DraftKings has grown rapidly through strategic partnerships with major US sports leagues and media companies.",
      founded: 2012, hq: "Boston", country: "United States", employees: "5001-10000", market: "B2C",
      categories: ["operators"], featured: 1,
      products: [{ name: "Sportsbook App", desc: "Mobile-first sports betting platform with live in-game wagering and same-game parlays" }, { name: "DFS Platform", desc: "Daily fantasy sports contests across major professional sports leagues" }],
      services: [{ name: "Customer Engagement", desc: "Player acquisition and retention through gamification and rewards programs" }],
      license: { name: "Various US State Licenses", jurisdiction: "United States", number: "Multi-state" },
      contacts: [
        { name: "Jason Robins", position: "CEO & Co-founder", email: "j.robins@draftkings.com", phone: "+1 617 555 1234", primary: 1 },
        { name: "Paul Liberman", position: "President", email: "p.liberman@draftkings.com", phone: "+1 617 555 1235", primary: 0 },
      ],
    },
    {
      name: "Entain", slug: "entain", website: "https://www.entain.com",
      description: "Entain is one of the world's largest sports betting and gaming groups, operating a portfolio of over 25 brands including Ladbrokes, Coral, bwin, and PartyPoker. The company focuses on regulated markets and has committed to offering the world's safest and most trusted gambling experience. Entain partners with MGM Resorts for US operations through the BetMGM joint venture.",
      founded: 2004, hq: "London", country: "United Kingdom", employees: "10001+", market: "B2C",
      categories: ["operators"], featured: 0,
      products: [{ name: "Ladbrokes", desc: "Historic UK betting brand with retail and online presence" }, { name: "bwin", desc: "Major European sports betting and online gaming brand" }, { name: "PartyPoker", desc: "Leading online poker platform with tournament and cash game offerings" }],
      services: [{ name: "BetMGM JV", desc: "US sports betting and iGaming joint venture with MGM Resorts" }],
      license: { name: "UKGC License", jurisdiction: "United Kingdom", number: "039380-R-319348-010" },
      contacts: [
        { name: "Jette Nygaard-Andersen", position: "CEO", email: "j.nygaard-andersen@entain.com", phone: "+44 20 3234 5678", primary: 1 },
        { name: "Rob Wood", position: "CFO", email: "r.wood@entain.com", phone: "+44 20 3234 5679", primary: 0 },
      ],
    },
    {
      name: "Catena Media", slug: "catena-media", website: "https://www.catenamedia.com",
      description: "Catena Media is a digital performance marketing company specializing in lead generation for the online gambling industry. The company operates a network of over 200 affiliate sites across multiple markets, generating high-quality leads for operators through SEO, content marketing, and paid acquisition. Catena Media is publicly listed on the Nasdaq Stockholm exchange.",
      founded: 2012, hq: "Sliema", country: "Malta", employees: "501-1000", market: "B2B",
      categories: ["affiliates"], featured: 0,
      products: [{ name: "Affiliate Network", desc: "Portfolio of 200+ content-driven affiliate websites generating organic gambling leads" }, { name: "Lead Generation", desc: "Performance-based lead generation across sports betting, casino, and poker verticals" }],
      services: [{ name: "SEO & Content", desc: "Specialized SEO and content marketing services for gambling operators" }],
      license: { name: "MGA License", jurisdiction: "Malta", number: "MGA/CRP/888/2018" },
      contacts: [
        { name: "Michael Daly", position: "CEO", email: "m.daly@catenamedia.com", phone: "+356 201 34567", primary: 1 },
        { name: "Peter Ruzicka", position: "CFO", email: "p.ruzicka@catenamedia.com", phone: "+356 201 34568", primary: 0 },
      ],
    },
    {
      name: "Kambi", slug: "kambi", website: "https://www.kambi.com",
      description: "Kambi is a leading provider of premium sports betting technology and services to the B2C gaming industry. The company supplies sportsbook platforms, odds compilation, and managed trading services to operators including Rush Street Interactive, Kindred, and Rank Group. Kambi's turnkey solution enables operators to launch competitive sportsbooks quickly.",
      founded: 2010, hq: "Sliema", country: "Malta", employees: "1001-5000", market: "B2B",
      categories: ["sportsbook-providers", "sportsbook-apis"], featured: 0,
      products: [{ name: "Kambi Sportsbook", desc: "Turnkey sportsbook platform with managed trading and comprehensive risk management" }, { name: "Odds Compilation", desc: "Proprietary odds engine covering 150+ sports and 500,000+ annual events" }],
      services: [{ name: "Managed Trading", desc: "Fully managed sportsbook trading services with real-time odds and liability management" }],
      license: { name: "MGA License", jurisdiction: "Malta", number: "MGA/CRP/999/2014" },
      contacts: [
        { name: "Max Meltzer", position: "CEO", email: "m.meltzer@kambi.com", phone: "+356 201 45678", primary: 1 },
        { name: "David Kenyon", position: "CFO", email: "d.kenyon@kambi.com", phone: "+356 201 45679", primary: 0 },
      ],
    },
    {
      name: "GiG", slug: "gaming-innovation-group", website: "https://www.gig.com",
      description: "Gaming Innovation Group (GiG) is a leading iGaming technology company providing platform, sportsbook, media, and affiliate solutions. The company operates a B2B platform serving multiple operator brands alongside its own media properties including iGaming.com. GiG's platform supports regulated markets across Europe and North America.",
      founded: 2012, hq: "St Julian's", country: "Malta", employees: "501-1000", market: "B2B",
      categories: ["platform-providers"], featured: 0,
      products: [{ name: "GiG Platform", desc: "Modern modular iGaming platform with sportsbook, casino, and player management" }, { name: "GiG Media", desc: "Portfolio of leading iGaming affiliate and media properties" }],
      services: [{ name: "Turnkey Operations", desc: "End-to-end platform and operational services for launching new gaming brands" }],
      license: { name: "MGA License", jurisdiction: "Malta", number: "MGA/CRP/678/2018" },
      contacts: [
        { name: "Richard Brown", position: "CEO", email: "r.brown@gig.com", phone: "+356 201 56789", primary: 1 },
        { name: "Tomas Gabrielson", position: "CFO", email: "t.gabrielson@gig.com", phone: "+356 201 56780", primary: 0 },
      ],
    },
    {
      name: "SoftSwiss", slug: "softswiss", website: "https://www.softswiss.com",
      description: "SoftSwiss is an internationally recognized technology company providing award-winning iGaming software solutions. The company offers a comprehensive casino platform, sportsbook, and affiliate management system. SoftSwiss powers over 700 iGaming brands across 20+ regulated markets with its cutting-edge technology and extensive game aggregation capabilities.",
      founded: 2009, hq: "Sliema", country: "Malta", employees: "1001-5000", market: "B2B",
      categories: ["platform-providers", "casino-apis"], featured: 1,
      products: [{ name: "Game Aggregator", desc: "Platform aggregating 20,000+ games from 200+ providers via single API integration" }, { name: "Casino Platform", desc: "Full-featured casino platform with bonus engine, CRM, and payment processing" }],
      services: [{ name: "White Label Solution", desc: "Complete white-label casino launch package including licensing and operational support" }],
      license: { name: "MGA License", jurisdiction: "Malta", number: "MGA/CRP/543/2018" },
      contacts: [
        { name: "Ivan Montik", position: "Founder & CEO", email: "i.montik@softswiss.com", phone: "+356 201 67890", primary: 1 },
        { name: "Alexander Kamenetskyi", position: "CTO", email: "a.kamenetskyi@softswiss.com", phone: "+356 201 67891", primary: 0 },
      ],
    },
    {
      name: "Endorphina", slug: "endorphina", website: "https://www.endorphina.com",
      description: "Endorphina is a premium online slot game development studio based in Prague, known for its innovative and visually stunning slot titles. The company produces a steady stream of high-quality HTML5 slot games with unique themes and engaging mechanics. Endorphina's portfolio includes popular titles like Book of Santa, Lucky Streak, and the hit series 'The Rise of AI'.",
      founded: 2012, hq: "Prague", country: "Czech Republic", employees: "201-500", market: "B2B",
      categories: ["casino-apis"], featured: 0,
      products: [{ name: "Slot Games", desc: "Portfolio of 100+ original slot games with unique themes and innovative bonus mechanics" }, { name: "Jackpot System", desc: "Multi-level progressive jackpot system with network and local jackpot options" }],
      services: [{ name: "Game Customization", desc: "Bespoke game development and branding services for operator partners" }],
      license: { name: "MGA License", jurisdiction: "Malta", number: "MGA/CRP/111/2016" },
      contacts: [
        { name: "Jan Urbanec", position: "CEO", email: "j.urbanec@endorphina.com", phone: "+420 234 567 890", primary: 1 },
        { name: "Zdenek Lang", position: "Head of Sales", email: "z.lang@endorphina.com", phone: "+420 234 567 891", primary: 0 },
      ],
    },
  ];

  const insertCompany = db.prepare(`
    INSERT INTO companies (id, name, slug, description, website, founded_year, headquarters, country_id, employee_count, market, status, is_verified, is_featured, verification_status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'approved', 1, ?, 'verified', ?, ?)
  `);
  const insertCompanyCategory = db.prepare("INSERT INTO company_categories (company_id, category_id) VALUES (?, ?)");
  const insertProduct = db.prepare("INSERT INTO products (id, name, description, category_id) VALUES (?, ?, ?, ?)");
  const insertCompanyProduct = db.prepare("INSERT INTO company_products (company_id, product_id) VALUES (?, ?)");
  const insertService = db.prepare("INSERT INTO services (id, name, description, category_id) VALUES (?, ?, ?, ?)");
  const insertCompanyService = db.prepare("INSERT INTO company_services (company_id, service_id) VALUES (?, ?)");
  const insertLicense = db.prepare("INSERT INTO company_licenses (id, company_id, license_name, jurisdiction, license_number, status) VALUES (?, ?, ?, ?, ?, 'active')");
  const insertContact = db.prepare("INSERT INTO company_contacts (id, company_id, full_name, position, email, phone, is_primary) VALUES (?, ?, ?, ?, ?, ?, ?)");

  for (const co of companiesData) {
    const companyId = crypto.randomUUID();
    const countryId = countryByName[co.country];

    insertCompany.run(
      companyId, co.name, co.slug, co.description, co.website,
      co.founded, co.hq, countryId, co.employees, co.market,
      co.featured, now, now
    );

    // Categories
    for (const catSlug of co.categories) {
      const catId = catLookup[catSlug];
      if (catId) insertCompanyCategory.run(companyId, catId);
    }

    // Products
    for (const p of co.products) {
      const productId = crypto.randomUUID();
      const catId = catLookup[co.categories[0]];
      insertProduct.run(productId, p.name, p.desc, catId);
      insertCompanyProduct.run(companyId, productId);
    }

    // Services
    for (const s of co.services) {
      const serviceId = crypto.randomUUID();
      const catId = catLookup[co.categories[0]];
      insertService.run(serviceId, s.name, s.desc, catId);
      insertCompanyService.run(companyId, serviceId);
    }

    // License
    if (co.license) {
      insertLicense.run(crypto.randomUUID(), companyId, co.license.name, co.license.jurisdiction, co.license.number);
    }

    // Contacts
    for (const ct of co.contacts) {
      insertContact.run(crypto.randomUUID(), companyId, ct.name, ct.position, ct.email, ct.phone, ct.primary ? 1 : 0);
    }
  }

  // ============================================================
  // 7. DEMO CONNECTIONS
  // ============================================================
  const buyerId = demoUsers[0].id;
  const sellerId = demoUsers[1].id;
  const partnerId = demoUsers[2].id;

  db.prepare(
    "INSERT INTO connections (id, requester_id, receiver_id, status, message, created_at, updated_at) VALUES (?, ?, ?, 'accepted', ?, ?, ?)"
  ).run(crypto.randomUUID(), buyerId, sellerId, "Hi Elena, interested in your sportsbook platform solutions.", now, now);

  db.prepare(
    "INSERT INTO connections (id, requester_id, receiver_id, status, message, created_at, updated_at) VALUES (?, ?, ?, 'accepted', ?, ?, ?)"
  ).run(crypto.randomUUID(), buyerId, partnerId, "James, let's discuss a potential partnership for our new casino launch.", now, now);

  db.prepare(
    "INSERT INTO connections (id, requester_id, receiver_id, status, message, created_at, updated_at) VALUES (?, ?, ?, 'pending', ?, ?, ?)"
  ).run(crypto.randomUUID(), sellerId, demoUsers[3].id, "Hi Sofia, would you be interested in promoting our new slot portfolio?", now, now);

  // ============================================================
  // 8. DEMO CONVERSATIONS & MESSAGES
  // ============================================================
  const convId = crypto.randomUUID();
  db.prepare(
    "INSERT INTO conversations (id, participant_1_id, participant_2_id, last_message_at, created_at) VALUES (?, ?, ?, ?, ?)"
  ).run(convId, buyerId, sellerId, now, now);

  const msg1Id = crypto.randomUUID();
  const msg2Id = crypto.randomUUID();
  const msg3Id = crypto.randomUUID();
  db.prepare("INSERT INTO messages (id, conversation_id, sender_id, content, is_read, created_at) VALUES (?, ?, ?, ?, 1, ?)").run(msg1Id, convId, buyerId, "Hi Elena, I saw your company profile and I'm very interested in your sportsbook platform. Could we schedule a demo?", now);
  db.prepare("INSERT INTO messages (id, conversation_id, sender_id, content, is_read, created_at) VALUES (?, ?, ?, ?, 1, ?)").run(msg2Id, convId, sellerId, "Hi Marcus! Absolutely, we'd love to show you around. What time works best for you? We can do a 45-minute walkthrough of our Spring BME platform.", now);
  db.prepare("INSERT INTO messages (id, conversation_id, sender_id, content, is_read, created_at) VALUES (?, ?, ?, ?, 0, ?)").run(msg3Id, convId, buyerId, "How about Thursday at 2pm UTC? That would work well for my team. Also, could you send over some case studies for operators in the European market?", now);

  // ============================================================
  // 9. DEMO OPPORTUNITIES
  // ============================================================
  const sportsbookCatId = catLookup["sportsbook-providers"];
  const casinoCatId = catLookup["casino-apis"];

  db.prepare(
    "INSERT INTO opportunities (id, title, description, type, category_id, created_by, company_id, status, budget, timeline, created_at, updated_at) VALUES (?, ?, ?, 'looking_for', ?, ?, ?, 'open', ?, ?, ?, ?)"
  ).run(
    crypto.randomUUID(),
    "Seeking White-Label Sportsbook Provider for African Market Launch",
    "We are looking for an experienced sportsbook platform provider to support our expansion into the African market (Nigeria, Kenya, South Africa). Requirements include: multi-currency support, mobile-first design, pre-match and live betting capabilities, and API integration support. Budget range: $50,000-$100,000 for initial setup with ongoing revenue share.",
    sportsbookCatId, buyerId, null, "$50,000 - $100,000", "3-6 months", now, now
  );

  db.prepare(
    "INSERT INTO opportunities (id, title, description, type, category_id, created_by, company_id, status, budget, timeline, created_at, updated_at) VALUES (?, ?, ?, 'offering', ?, ?, ?, 'open', ?, ?, ?, ?)"
  ).run(
    crypto.randomUUID(),
    "Premium Live Casino Content Partnership Opportunity",
    "We are offering a content partnership opportunity for online casino operators looking to integrate our award-winning live casino platform. We provide a complete solution including dedicated tables, custom branding, and 24/7 operational support. We are particularly interested in partnering with operators targeting European and Latin American markets.",
    casinoCatId, sellerId, null, "Revenue share model", "1-2 months", now, now
  );

  db.prepare(
    "INSERT INTO opportunities (id, title, description, type, category_id, created_by, company_id, status, budget, timeline, created_at, updated_at) VALUES (?, ?, ?, 'partnership', ?, ?, ?, 'open', ?, ?, ?, ?)"
  ).run(
    crypto.randomUUID(),
    "Strategic Technology Partnership for Next-Gen Casino Platform",
    "We are seeking a strategic technology partner to co-develop the next generation of casino gaming experiences. This partnership will focus on AI-driven personalization, gamification features, and cross-platform game delivery. Ideal partners have deep expertise in gaming technology and a track record of innovation. This is an equity partnership opportunity.",
    casinoCatId, partnerId, null, "Equity partnership", "6-12 months", now, now
  );

  // ============================================================
  // 10. NOTIFICATIONS for admin
  // ============================================================
  db.prepare(
    "INSERT INTO notifications (id, user_id, title, message, type, is_read, link, created_at) VALUES (?, ?, ?, ?, ?, 0, ?, ?)"
  ).run(crypto.randomUUID(), adminId, "New Verification Request", "Entain has submitted a verification request with supporting documents.", "verification", "/admin/verification", now);

  db.prepare(
    "INSERT INTO notifications (id, user_id, title, message, type, is_read, link, created_at) VALUES (?, ?, ?, ?, ?, 0, ?, ?)"
  ).run(crypto.randomUUID(), adminId, "New Company Registration", "DraftKings has registered as a new company and is pending approval.", "company", "/admin/companies", now);

  db.prepare(
    "INSERT INTO notifications (id, user_id, title, message, type, is_read, link, created_at) VALUES (?, ?, ?, ?, ?, 0, ?, ?)"
  ).run(crypto.randomUUID(), adminId, "System Update", "The platform has been seeded with demo data. All demo accounts are ready for use.", "system", null, now);

  console.log("Database seeded successfully!");
  console.log(`  - ${categories.length} categories`);
  console.log(`  - ${countries.length} countries`);
  console.log(`  - ${plans.length} plans`);
  console.log(`  - 1 admin user (admin@igamingconnect.com)`);
  console.log(`  - ${demoUsers.length} demo users`);
  console.log(`  - ${companiesData.length} companies`);
  console.log("  - Demo connections, messages, and opportunities created");

  return {
    message: "Database seeded successfully",
    categories: categories.length,
    countries: countries.length,
    plans: plans.length,
    companies: companiesData.length,
    users: demoUsers.length + 1,
  };
}

// Self-executing block for standalone usage
if (require.main === module || process.argv[1]?.includes("seed")) {
  seedDatabase()
    .then((result) => {
      console.log(JSON.stringify(result, null, 2));
    })
    .catch((err) => {
      console.error("Seed failed:", err);
      process.exit(1);
    });
}
