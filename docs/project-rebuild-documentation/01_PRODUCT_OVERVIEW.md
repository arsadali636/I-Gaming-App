# 01 — Product Overview: iGaming Connect

## 1. Product Name
**iGaming Connect** (B2B Marketplace & Directory for the Global iGaming Industry)

---

## 2. Product Purpose
iGaming Connect serves as the premier global B2B directory, marketplace, and networking platform connecting gaming operators, software platform providers, sportsbook odds suppliers, casino game studios, aggregators, payment service providers (PSPs), and compliance agencies. The platform facilitates business discovery, verified contact acquisition, vendor evaluation, licensing validation, and direct B2B partnership negotiations within a single unified ecosystem.

---

## 3. Problem the Product Solves
The global iGaming industry is highly regulated, fast-moving, and fragmented across jurisdictions (e.g., Malta MGA, UKGC, Curaçao, Gibraltar). B2B stakeholders face major friction:
* **Opaque Vendor Discovery:** Finding accredited operators, aggregators, or white-label platform providers requires manual research across trade shows and disparate registers.
* **Unverified Business Contacts:** Reaching decision-makers (CEOs, Heads of Business Development, CTOs, Compliance Officers) is difficult due to gatekeeping and outdated contact data.
* **Compliance & Licensing Transparency:** Verifying whether a vendor holds active licenses in specific jurisdictions (e.g., MGA, Isle of Man, Curaçao) requires manual regulatory lookup.
* **Inefficient B2B Partner Matching:** Operators and software providers lack a dedicated RFP / opportunity board to broadcast immediate sourcing needs (e.g., "Looking for PAM provider in LatAm").

---

## 4. Target Users
1. **iGaming Operators:** Online casinos, sportsbooks, bingo sites, and retail gaming brands looking for software, games, or payment gateways.
2. **Platform & Software Providers:** Turnkey and white-label iGaming platform providers selling PAM (Player Account Management), PAM engines, or Sportsbook software.
3. **Game Studios & Content Aggregators:** Developers selling slot games, live dealer streams, crash games, or virtual sports feeds.
4. **Payment Service Providers (PSPs) & FinTech:** Merchant account providers, crypto gateways, and localization payment solutions catering to gaming operators.
5. **Regulatory & Compliance Advisors:** Legal firms, KYC/AML solution providers, and testing labs (e.g., GLI, iTech Labs).
6. **B2B iGaming Professionals:** Executives, BD managers, sales leaders, and product managers establishing industry connections.

---

## 5. Main Business Model
iGaming Connect operates a **Hybrid Subscription & Credit-Based Monetization Model**:
1. **Tiered Monthly Subscriptions:**
   * **Starter ($299/mo):** Includes 30 contact reveal credits/month, full directory browsing, basic search, and saved company lists.
   * **Professional ($499/mo):** Includes 50 contact reveal credits/month, priority search ranking, advanced filter access, analytics, and contact data export.
   * **Enterprise (Custom / Contact Us):** Unlimited contact reveals, custom integrations, API access, dedicated account manager, custom SLA.
2. **Contact Credit Wallet:**
   * Unlocking direct email/phone/LinkedIn contact info consumes 1 credit per contact reveal.
   * Duplicate reveals for the same contact by the same user do NOT consume additional credits.
   * Credits are refilled upon subscription renewal or awarded via admin/bonus top-ups.

---

## 6. Core Features
* **Faceted Directory & Search:** Filter by category, country/region, jurisdiction licenses, market focus, verification status, and employee count.
* **Company Profiles:** Showcase overview, founded year, employee count, technology stack, products/services, active regulatory licenses, and key personnel contacts.
* **Verified Badge & Verification Request:** Companies submit regulatory documentation to earn a "Verified" badge checked by Super Admins.
* **Contact Reveal & Credit Wallet:** Monetized access to direct decision-maker emails, phone numbers, and LinkedIn profiles.
* **B2B Opportunity Board:** Broadcast RFP postings ("Looking For", "Offering", "Partnership") with budget and timeline criteria.
* **Connections & Direct Messaging:** Request professional connections and chat in real-time once connected.
* **Admin Control Center:** Manage users, verify company profiles, feature listings, review reported content, allocate credits, and audit system events.

---

## 7. Main Modules
1. **Authentication & Identity Module:** User registration, password hashing, JWT sessions, and RBAC enforcement.
2. **Company & Directory Module:** Company profile management, categories, licenses, products, services, and team member management.
3. **Marketplace & Search Module:** Filtered browsing, full-text search, saved companies, and saved search alerts.
4. **Contact Credit Wallet Module:** Credit balance tracking, debit/credit transactions, and unlocked contact records.
5. **Networking & Messaging Module:** User-to-user connection requests, status tracking, and 1-on-1 direct conversations.
6. **Opportunity Board Module:** Creating, filtering, matching, and closing B2B proposals and lead listings.
7. **Subscription & Payment Module:** Stripe Checkout, Stripe Billing Portal, webhook handling, and local dev fallback engine.
8. **Admin Moderation & Analytics Module:** Company status moderation (`pending`, `approved`, `rejected`, `suspended`), verification reviews, audit logging, and platform metrics.

---

## 8. High-Level User Journey
```
[ Visitor / Unauthenticated User ]
       │
       ▼
 1. Explores Public Landing Page & Directory (/marketplace)
 2. Views Free Company Profiles & Public Offerings
       │
       ▼
 3. Registers Account & Selects User Type (/register)
       │
       ▼
[ Authenticated Professional ]
       │
       ├──► Creates / Claims Company Profile (/app/company)
       │       └── Adds Products, Services, Licenses & Contact Persons
       │       └── Submits Verification Documents to Admin
       │
       ├──► Subscribes to Plan via Stripe Checkout (/pricing)
       │       └── Wallet Credited with Monthly Reveals (30 or 50 Credits)
       │
       ├──► Searches Marketplace & Reveals Key Contacts (/marketplace)
       │       └── 1 Credit Deducted -> Phone / Email / LinkedIn Unlocked
       │
       ├──► Sends Connection Request & Messages Partner (/app/connections & /app/messages)
       │
       └──► Posts / Responds to B2B Opportunities (/app/opportunities)
```
