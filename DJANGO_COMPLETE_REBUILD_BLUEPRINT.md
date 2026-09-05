# DJANGO COMPLETE REBUILD BLUEPRINT — iGaming Connect

> **DOCUMENT TYPE**: Master Rebuild Specification & Architectural Blueprint  
> **TARGET BACKEND STACK**: Django 5.1+ | Django REST Framework 3.15+ | PostgreSQL 16  
> **SOURCE REFERENCE SYSTEM**: iGaming Connect (Next.js 16.3.3 / TypeScript / SQLite)  
> **COMPLIANCE RULE**: Zero Source Code Modification — Read-Only Reverse Engineering Specification  

---

## SECTION 1 — Product Overview

### 1.1 Product Purpose & Vision
**iGaming Connect** is a dedicated B2B Marketplace, Business Directory, and Professional Sourcing Platform engineered specifically for the global online gambling, casino, sportsbook, payment processing, and regulatory compliance ecosystem. 

The platform connects verified B2B entities across key industry segments:
- **Gaming Operators**: Online sportsbooks, digital casinos, lottery platforms, and retail gaming brands.
- **Platform & Software Providers**: Turnkey & white-label Player Account Management (PAM) engines, sportsbook providers, and core gaming infrastructure.
- **Game Studios & Content Aggregators**: Slot developers, live dealer studios, crash game creators, and content aggregator platforms.
- **Payment Service Providers (PSPs)**: Merchant account providers, crypto payment gateways, and localized banking solutions.
- **Regulatory & Compliance Advisors**: Testing laboratories (e.g., GLI, iTech Labs), legal advisors, and identity/KYC/AML verification agencies.
- **B2B Gaming Executives**: BD directors, sales heads, CTOs, and founders managing vendor evaluation and strategic partnerships.

### 1.2 Core Business Model & Monetization Architecture
iGaming Connect operates a **Hybrid Subscription & Monetized Contact Credit Engine**:
1. **Tiered Monthly Subscriptions**:
   - **Starter ($299/mo)**: Grants 30 contact reveal credits per month, directory search access, and basic filtering.
   - **Professional ($499/mo)**: Grants 50 contact reveal credits per month, priority search ranking, advanced filter access, and analytics.
   - **Enterprise (Custom / Contact Us)**: Custom credit quota, dedicated SLA, custom API access, and account management.
2. **Contact Credit Wallet**:
   - Every registered user possesses a `contact_credit_wallets` record.
   - Unlocking direct decision-maker contact details (email, phone, LinkedIn) costs **1 credit**.
   - Re-revealing an unlocked contact by the same user costs **0 credits** (idempotent reveal).
   - Credits are refilled upon subscription renewal or granted via Admin bonus/refund adjustments.

---

## SECTION 2 — Actual Technology Stack Analysis

The reference codebase operates on the following verified stack:

| Layer | Existing Stack Component | Verification Source | Django Target Equivalent |
| :--- | :--- | :--- | :--- |
| **Framework** | Next.js 16.3.3 (App Router) | `package.json` L29 | Django 5.1+ (Python 3.12+) |
| **API Layer** | Next.js Route Handlers (`src/app/api/*`) | `src/app/api/` (27 route files) | Django REST Framework (DRF 3.15+) |
| **Database Engine** | SQLite via `better-sqlite3` v13.0.3 | `src/lib/db.ts` | PostgreSQL 16 (Native UUID, JSONB) |
| **Session & Auth** | JWT (`jose` v6.2.10) in HTTP-Only Cookie (`igc-session`) | `src/middleware.ts` & `src/lib/auth-local.ts` | `djangorestframework-simplejwt` + Cookies |
| **Password Security** | Node `crypto.scryptSync` (16-byte salt, 64-byte key) | `src/lib/auth-local.ts` L12-25 | Django `PBKDF2PasswordHasher` / `Argon2` |
| **State Management** | Zustand v5.0.15 & React Query v5.102.8 | `package.json` L20, L37 | React Query / Redux Toolkit (Frontend) |
| **Payment Gateway** | Stripe SDK (`stripe` v22.6.0) | `src/lib/stripe.ts` | Stripe Python SDK (`stripe`) |
| **Validation** | Zod v4.5.4 | `src/lib/validations.ts` | DRF Serializers + Django Validators |

---

## SECTION 3 — Verified System Architecture

```
[ Browser / Single Page Application ]
       │
       ▼
[ Nginx Reverse Proxy / Load Balancer ]
       │
       ▼
[ Django 5.1 WSGI/ASGI Server (Gunicorn / Uvicorn) ]
       │
       ├──► Custom Authentication Middleware (JWT Validation via HttpOnly Cookie)
       │
       ├──► Django REST Framework API Router (/api/v1/*)
       │     ├── apps.accounts      (Auth, Custom User Model, Session)
       │     ├── apps.companies     (Company Profiles, Contacts, Licenses, Team Members)
       │     ├── apps.directory     (Categories, Countries, Search, Bookmarks)
       │     ├── apps.credits       (Contact Credit Wallets, Debit Transactions, Reveals)
       │     ├── apps.subscriptions (Plans, Stripe Billing, Webhooks, Dev Mock)
       │     ├── apps.opportunities (B2B RFPs, Sourcing Postings)
       │     ├── apps.networking    (Connections, Messaging, Notifications)
       │     └── apps.moderation    (Verification Requests, Reports, Audit Logging)
       │
       ▼
[ PostgreSQL 16 Database Engine ]  ◄── ACID Transactions & Row-Level Locking
       │
       ▼
[ Redis 7 Cache & Broker ] ──► [ Celery 5.4 Async Task Workers ] (Stripe Webhooks & Credit Refills)
```

---

## SECTION 4 — Actual Feature Inventory

Every feature below has been empirically analyzed from the codebase and classified:

### F-001: User Account Registration
- **Status**: ✅ ACTUALLY IMPLEMENTED
- **Evidence**: `src/app/api/auth/register/route.ts`, `src/lib/validations.ts` (L8-13)
- **Behavior**: Accepts `full_name`, `email`, `password` (min 8 chars), optional `company_name`. Hashes password via scrypt. Inserts user into `users`. Automatically initializes `contact_credit_wallets` record (`balance = 0`). Sets HTTP-only `igc-session` JWT cookie (7-day duration). Returns HTTP 201 Created.

### F-002: User Account Login & Session Provisioning
- **Status**: ✅ ACTUALLY IMPLEMENTED
- **Evidence**: `src/app/api/auth/login/route.ts`, `src/lib/auth-local.ts`
- **Behavior**: Validates `email` and `password`. Verifies scrypt hash. Generates HS256 JWT payload containing user ID, email, full name, role, and company ID. Sets `igc-session` cookie. Returns user profile metadata.

### F-003: User Logout & Session Retrieval
- **Status**: ✅ ACTUALLY IMPLEMENTED
- **Evidence**: `src/app/api/auth/logout/route.ts`, `src/app/api/auth/me/route.ts`
- **Behavior**: `POST /api/auth/logout` sets cookie maxAge=0. `GET /api/auth/me` decodes token and returns user session + wallet balance.

### F-004: Post-Registration Onboarding Wizard
- **Status**: ✅ ACTUALLY IMPLEMENTED
- **Evidence**: `src/app/(auth)/register/onboarding/page.tsx`
- **Behavior**: Redirects newly registered users to complete company affiliation setup, select user persona, and enter initial business details.

### F-005: Create Company Profile
- **Status**: ✅ ACTUALLY IMPLEMENTED
- **Evidence**: `src/app/api/companies/route.ts`, `src/lib/validations.ts`
- **Behavior**: Accepts company details, generates URL slug (auto-appends Unix timestamp on collision). Inserts `companies` record with `status = 'pending'`, `verification_status = 'unverified'`, `is_verified = 0`. Populates junction tables (`company_categories`, `company_products`, `company_services`). Inserts `company_members` record (`role = 'owner'`). Elevates user `role = 'company_owner'` and sets `users.company_id`.

### F-006: Public Directory Search & Faceted Filtering
- **Status**: ✅ ACTUALLY IMPLEMENTED
- **Evidence**: `src/app/api/companies/route.ts`
- **Behavior**: Enforces `status = 'approved'` for non-admin queries. Supports filters: `search`/`q` (LIKE on name/description), `category` (slug), `country` (name), `market`, `verified` (`true`), pagination (`page`, `limit`), and sorting (`newest`, `oldest`, `name`, `featured`).

### F-007: Company Detail Retrieval & Unrevealed Contact Masking
- **Status**: ✅ ACTUALLY IMPLEMENTED
- **Evidence**: `src/app/api/companies/[id]/route.ts` (L78-90), `src/app/api/companies/[id]/contacts/route.ts` (L41-52)
- **Behavior**: Returns company overview, licenses, products, services, and contacts. Unless contact has been revealed by the requesting user or user is company creator, `email` is masked (`maskEmail`), `phone` is masked (`maskPhone`), and `linkedin` is forced to `null`.

### F-008: Company Profile Update
- **Status**: ✅ ACTUALLY IMPLEMENTED
- **Evidence**: `src/app/api/companies/[id]/route.ts` (L113-199)
- **Behavior**: Allows company owners or admins to update company description, website, employee count, revenue range, and technology stack.

### F-009: Company Soft Deletion
- **Status**: ✅ ACTUALLY IMPLEMENTED
- **Evidence**: `src/app/api/companies/[id]/route.ts` (L201-221)
- **Behavior**: `DELETE /api/companies/[id]` executed by Admin does NOT drop the database row; it updates `status = 'suspended'`.

### F-010: Executive Contacts CRUD
- **Status**: ✅ ACTUALLY IMPLEMENTED
- **Evidence**: `src/app/api/companies/[id]/contacts/route.ts`
- **Behavior**: `GET` returns company contacts (masked if unrevealed). `POST` allows company owner to add decision-makers (`full_name`, `position`, `email`, `phone`, `linkedin`, `is_primary`).

### F-011: Team Member Management
- **Status**: ✅ ACTUALLY IMPLEMENTED
- **Evidence**: `src/app/api/companies/[id]/members/route.ts`
- **Behavior**: `GET` lists team members. `POST` invites team members to company organization (`role IN ('owner', 'admin', 'member')`).

### F-012: Contact Reveal Engine (ACID Transaction)
- **Status**: ✅ ACTUALLY IMPLEMENTED
- **Evidence**: `src/app/api/contacts/reveal/route.ts`
- **Behavior**:
  1. Checks if contact was already revealed by user -> returns contact immediately with `already_revealed: true` (0 credits deducted).
  2. Verifies active subscription (`subscriptions.status = 'active'`) -> 403 Forbidden if none.
  3. Verifies credit balance > 0 -> 402 Payment Required if 0.
  4. Executes SQLite ACID transaction (`db.transaction()`):
     - Decrements `contact_credit_wallets.balance` by 1, increments `total_used` by 1.
     - Inserts `contact_credit_transactions` log (`type = 'debit'`, `amount = 1`).
     - Inserts `revealed_contacts` record.
  5. Returns unmasked contact info (email, phone, LinkedIn) and remaining credit balance.

### F-013: Stripe Subscription Checkout & Offline Dev Fallback
- **Status**: ✅ ACTUALLY IMPLEMENTED
- **Evidence**: `src/app/api/stripe/checkout/route.ts`, `src/lib/stripe.ts`
- **Behavior**: In production (live Stripe key), creates Stripe Checkout Session. In offline local development mode (no Stripe key), automatically creates/updates `subscriptions` record (`status = 'active'`), refills wallet with plan credits (+30 Starter, +50 Professional), and logs bonus transaction.

### F-014: Stripe Customer Portal Redirect
- **Status**: ✅ ACTUALLY IMPLEMENTED
- **Evidence**: `src/app/api/stripe/portal/route.ts`
- **Behavior**: Redirects user to Stripe billing portal or returns local mock response.

### F-015: Stripe Webhook Processing
- **Status**: ✅ ACTUALLY IMPLEMENTED
- **Evidence**: `src/app/api/stripe/webhook/route.ts`
- **Behavior**: Consumes webhooks: `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`. Provisions subscription status and wallet credits.

### F-016: Subscription Plan Status API
- **Status**: ✅ ACTUALLY IMPLEMENTED
- **Evidence**: `src/app/api/subscriptions/route.ts`
- **Behavior**: `GET` retrieves current plan details. `POST` allows local dev subscription state toggling.

### F-017: Professional Connections API
- **Status**: ✅ ACTUALLY IMPLEMENTED
- **Evidence**: `src/app/api/connections/route.ts`, `src/app/api/connections/[id]/route.ts`
- **Behavior**: `GET` lists user connections. `POST` sends connection request (`status = 'pending'`). `PUT` accepts connection (`status = 'accepted'`) and dispatches notification to requester (`type = 'connection_accepted'`).

### F-018: Direct 1-on-1 Messaging
- **Status**: ✅ ACTUALLY IMPLEMENTED
- **Evidence**: `src/app/api/messages/route.ts`
- **Behavior**: `GET` fetches conversation threads. `POST` verifies that sender and recipient have an `accepted` connection status before inserting message. Automatically dispatches notification to recipient (`type = 'new_message'`).

### F-019: B2B Opportunities & RFP Board
- **Status**: ✅ ACTUALLY IMPLEMENTED
- **Evidence**: `src/app/api/opportunities/route.ts`
- **Behavior**: `GET` lists open opportunities (`looking_for`, `offering`, `partnership`). `POST` allows authenticated users to post RFPs with budget, timeline, and category criteria.

### F-020: Categories Taxonomy Management
- **Status**: ✅ ACTUALLY IMPLEMENTED
- **Evidence**: `src/app/api/categories/route.ts`, `src/app/api/categories/[slug]/route.ts`
- **Behavior**: Fetches category list with icon, color, and company counts.

### F-021: Admin Company Listing Moderation
- **Status**: ✅ ACTUALLY IMPLEMENTED
- **Evidence**: `src/app/api/admin/companies/route.ts`
- **Behavior**: `GET` lists companies across all statuses. `PUT` allows Admins to update company status (`approved`, `rejected`, `suspended`).

### F-022: Admin Company Verification Review
- **Status**: ✅ ACTUALLY IMPLEMENTED
- **Evidence**: `src/app/api/admin/verification/route.ts`
- **Behavior**: `GET` lists verification requests. `PUT` allows Admins to approve requests, setting `companies.is_verified = 1` and `companies.verification_status = 'verified'`.

### F-023: Admin Manual Credit Wallet Adjustment
- **Status**: ✅ ACTUALLY IMPLEMENTED
- **Evidence**: `src/app/api/admin/credits/route.ts`
- **Behavior**: Allows Super Admins to manually grant bonus credits or refund credits to any user wallet, logging an audit transaction.

### F-024: Admin Featured Company Override
- **Status**: ✅ ACTUALLY IMPLEMENTED
- **Evidence**: `src/app/api/admin/featured/route.ts`
- **Behavior**: Allows Admins to toggle `is_featured` boolean flag on company listings.

### F-025: Admin User Management Desk
- **Status**: ✅ ACTUALLY IMPLEMENTED
- **Evidence**: `src/app/api/admin/users/route.ts`
- **Behavior**: Lists platform users, user roles, creation dates, and credit balances.

### F-026: Admin Content Reports Moderation
- **Status**: ✅ ACTUALLY IMPLEMENTED
- **Evidence**: `src/app/api/admin/reports/route.ts`
- **Behavior**: `GET` lists user reports on companies, users, or messages. `PUT` updates report status (`pending`, `reviewed`, `resolved`, `dismissed`).

### F-027: Admin Audit Log Viewer
- **Status**: ✅ ACTUALLY IMPLEMENTED
- **Evidence**: `src/app/api/admin/audit/route.ts`
- **Behavior**: Displays platform audit logs containing IP addresses, user actions, and entity details.

### F-028: Database Seeding Engine
- **Status**: ✅ ACTUALLY IMPLEMENTED
- **Evidence**: `src/app/api/seed/route.ts`, `src/lib/seed.ts`
- **Behavior**: Seeds database with initial categories, countries, plans, admin account, demo users, companies, contacts, opportunities, and connections.

### F-029: Saved Companies / Bookmarks Page
- **Status**: 🟡 PARTIALLY IMPLEMENTED
- **Evidence**: `src/app/(dashboard)/app/saved/page.tsx`, `saved_companies` table in `src/lib/db.ts`
- **Behavior**: UI page exists and DB table exists, but direct REST API endpoint `POST /api/saved-companies` is missing.

### F-030: Company Regulatory Licenses API
- **Status**: 🔴 BROKEN / DISCONNECTED
- **Evidence**: `company_licenses` table in `src/lib/db.ts`
- **Behavior**: Table exists and licenses display on public detail page, but dedicated API route handler `POST /api/companies/[id]/licenses` is absent.

### F-031: Saved Searches & Filter Alerts
- **Status**: 🔴 BROKEN / DISCONNECTED
- **Evidence**: `saved_searches` table in `src/lib/db.ts`
- **Behavior**: DB table exists in schema, but no frontend component or API route handler interacts with it.

### F-032: Analytics Events Tracker
- **Status**: 🔴 BROKEN / DISCONNECTED
- **Evidence**: `analytics_events` table in `src/lib/db.ts`
- **Behavior**: Table exists in schema, but no API handler or middleware dispatches analytics events.

### F-033: Password Reset via Email Link
- **Status**: 📄 DOCUMENTED / PLANNED ONLY
- **Evidence**: Mentioned in `05_USER_FLOWS.md`, but no `/api/auth/reset-password` endpoint exists.

### F-034: Email Verification Token Workflow
- **Status**: 📄 DOCUMENTED / PLANNED ONLY
- **Evidence**: Mentioned in `01_PRODUCT_OVERVIEW.md`, but no email verification route handler exists.

### F-035: Export Contacts to CSV
- **Status**: 📄 DOCUMENTED / PLANNED ONLY
- **Evidence**: Listed in Professional plan features in documentation, but no backend CSV export handler exists.

---

## SECTION 5 — Complete User Flows

### Flow 1: User Registration & Onboarding
```
1. Visitor navigates to /register
2. Enters full_name, email, password (min 8 chars), optional company_name
3. Form submits POST /api/auth/register
4. System validates Zod schema -> Checks email uniqueness in users table
5. Generates 16-byte random salt -> Calculates 64-byte scrypt password hash
6. Inserts record into users table (default role = 'professional')
7. Inserts record into contact_credit_wallets table (balance = 0)
8. Generates HS256 JWT -> Sets HTTP-Only cookie 'igc-session' (7-day expiry)
9. Server responds HTTP 201 Created -> Client redirects to /register/onboarding
10. User completes onboarding profile -> Redirects to /app
```

### Flow 2: User Login & Role Routing
```
1. User navigates to /login
2. Enters email and password
3. Form submits POST /api/auth/login
4. System fetches user record by email -> Compares scrypt password hash
5. On match: Issues HS256 JWT -> Sets HTTP-Only cookie 'igc-session'
6. Server responds HTTP 200 OK with user role metadata
7. Client evaluates role:
   - If super_admin, admin, or moderator -> Redirect to /admin
   - If professional or company_owner -> Redirect to /app
```

### Flow 3: Company Creation & Owner Elevation
```
1. User navigates to /app/company
2. Fills company profile form (name, description, website, country, categories)
3. Form submits POST /api/companies
4. System generates unique slug from name (appends timestamp if collision occurs)
5. Inserts companies record (status = 'pending', verification_status = 'unverified')
6. Inserts records into company_categories, company_products, company_services
7. Inserts company_members record (user_id, company_id, role = 'owner')
8. Updates user record: role = 'company_owner', company_id = new_company_id
9. Listing enters Admin Moderation Queue -> Remains hidden from public directory
```

### Flow 4: Contact Reveal & Credit Deduction (ACID Transaction)
```
1. Authenticated user views company contacts on /marketplace or /company/[slug]
2. Unrevealed contact details display masked email (j***e@domain.com) and phone (+356 *** 3456)
3. User clicks "Unlock Contact" -> Submits POST /api/contacts/reveal { contact_id }
4. System Check A: Is contact already revealed by user?
   - If YES: Returns contact info immediately with already_revealed = true (0 credits deducted)
5. System Check B: Does user have active subscription (subscriptions.status = 'active')?
   - If NO: Returns HTTP 403 Forbidden ("Active subscription required")
6. System Check C: Does user have wallet balance > 0?
   - If NO: Returns HTTP 402 Payment Required ("Insufficient credits")
7. System Check D: Execute ACID Transaction:
   - Decrement balance = balance - 1, increment total_used = total_used + 1 in contact_credit_wallets
   - Insert transaction record into contact_credit_transactions (type = 'debit', amount = 1)
   - Insert link record into revealed_contacts (user_id, company_contact_id)
8. Server responds HTTP 200 OK with unmasked contact info and updated credit balance
```

### Flow 5: Stripe Subscription & Wallet Credit Refill
```
1. User navigates to /pricing or /app/subscription
2. Selects subscription plan (Starter $299/mo or Professional $499/mo)
3. Clicks "Subscribe Now" -> Submits POST /api/stripe/checkout { plan_slug }
4. Production Branch (Stripe Key Present):
   - Creates Stripe Checkout Session -> Redirects to Stripe hosted checkout page
   - User pays -> Stripe dispatches webhook customer.subscription.created to /api/stripe/webhook
   - Server updates subscriptions record -> Refills wallet balance (+30 or +50 credits)
5. Offline Local Dev Branch (No Stripe Key):
   - Server creates/updates subscriptions record (status = 'active', 30-day period)
   - Refills wallet balance (+30 or +50 credits) -> Logs bonus transaction
   - Redirects user to /app/subscription with active status badge
```

### Flow 6: User Connections & Direct Messaging
```
1. User A views User B's profile -> Clicks "Connect" -> POST /api/connections { receiver_id, message }
2. System inserts connections record (status = 'pending')
3. User B views /app/connections -> Clicks "Accept" -> PUT /api/connections/[id] (status = 'accepted')
4. System updates connection -> Automatically creates notification for User A (type = 'connection_accepted')
5. User A or B opens /app/messages -> Sends message -> POST /api/messages { conversation_id, content }
6. System verifies accepted connection status -> Inserts message -> Creates notification for recipient
```

### Flow 7: Admin Verification Review & Badge Awarding
```
1. Company Owner uploads regulatory documents on /app/company-profile
2. System inserts verification_requests record (status = 'pending') -> Sets companies.verification_status = 'pending'
3. Admin opens /admin/verification -> Inspects documents and licenses
4. Admin clicks "Approve" -> Submits PUT /api/admin/verification { id, status: "approved" }
5. System updates verification_requests.status = 'approved', companies.is_verified = 1, companies.verification_status = 'verified'
6. System dispatches notification to Company Owner
```

---

## SECTION 6 — Page and Route Inventory

The platform comprises **39 verified screen/page components**:

| Page Name | Route | Accessible Roles | Purpose | Key API Dependencies |
| :--- | :--- | :--- | :--- | :--- |
| **Public Landing Page** | `/` | Guest, All | Hero banner, categories, featured listings | `GET /api/companies`, `GET /api/categories` |
| **Public Marketplace** | `/marketplace` | Guest, All | Faceted directory search & filtering | `GET /api/companies`, `POST /api/contacts/reveal` |
| **Public Pricing Page** | `/pricing` | Guest, All | Subscription plans & feature matrix | `POST /api/stripe/checkout` |
| **Public Company Detail** | `/company/[slug]` | Guest, All | Company overview, licenses, contacts | `GET /api/companies/[id]`, `POST /api/contacts/reveal` |
| **Category Filter Page** | `/category/[slug]` | Guest, All | Category-specific listings | `GET /api/categories/[slug]` |
| **About Us Page** | `/about` | Guest, All | Platform background & mission | None |
| **Contact Us Page** | `/contact` | Guest, All | Contact support form | None |
| **FAQ Page** | `/faq` | Guest, All | Frequently asked questions | None |
| **User Login Page** | `/login` | Guest | Account authentication form | `POST /api/auth/login` |
| **User Register Page** | `/register` | Guest | B2B user onboarding signup | `POST /api/auth/register` |
| **Registration Onboarding**| `/register/onboarding`| Authenticated | Persona & profile setup wizard | `GET /api/auth/me` |
| **User Dashboard Hub** | `/app` | Authenticated | User metrics & quick actions hub | `GET /api/auth/me` |
| **Create Company Page** | `/app/company` | Professional | Create new business profile | `POST /api/companies` |
| **Dashboard Company Detail**| `/app/company/[id]`| Authenticated | Internal view of company profile | `GET /api/companies/[id]` |
| **Manage Profile Main** | `/app/company-profile` | Company Owner | Profile hub & verification request | `GET /api/companies/[id]` |
| **Edit Profile Info** | `/app/company-profile/edit`| Company Owner | Edit business details & logo | `PUT /api/companies/[id]` |
| **Manage Team & Contacts** | `/app/company-profile/team`| Company Owner | Manage contacts & team members | `POST /api/companies/[id]/contacts` |
| **Profile Analytics** | `/app/company-profile/analytics`| Company Owner | Listing views & reveal metrics | `GET /api/companies/[id]` |
| **Dashboard Marketplace** | `/app/marketplace` | Authenticated | Authenticated search & reveals | `GET /api/companies`, `POST /api/contacts/reveal` |
| **B2B Opportunity Board** | `/app/opportunities` | Authenticated | RFP feed & opportunity posting | `GET/POST /api/opportunities` |
| **User Connections** | `/app/connections` | Authenticated | Manage network connection requests | `GET/POST/PUT /api/connections` |
| **Direct Messages Chat** | `/app/messages` | Authenticated | 1-on-1 real-time direct chat | `GET/POST /api/messages` |
| **Unlocked Contacts Archive**| `/app/contacts` | Authenticated | Saved revealed contacts list | `GET /api/auth/me` |
| **Saved Companies** | `/app/saved` | Authenticated | Bookmarked target companies | `GET /api/companies` |
| **Subscription Dashboard** | `/app/subscription` | Authenticated | Plan status & wallet refill | `GET/POST /api/subscriptions`, `/api/stripe/checkout` |
| **Billing Management** | `/app/billing` | Authenticated | Stripe customer portal link | `POST /api/stripe/portal` |
| **User Account Settings** | `/app/settings` | Authenticated | Edit profile name, email, avatar | `GET /api/auth/me` |
| **Admin Dashboard Overview**| `/admin` | Admin, Super Admin | Executive platform metrics | `GET /api/admin/companies`, `/users` |
| **Admin Analytics Page** | `/admin/analytics` | Admin, Super Admin | Revenue & reveal analytics | `GET /api/admin/audit` |
| **Admin Company Approvals**| `/admin/companies` | Admin, Super Admin | Review & approve pending listings | `GET/PUT /api/admin/companies` |
| **Admin Verification Desk**| `/admin/verification` | Admin, Super Admin | Review documents & grant badge | `GET/PUT /api/admin/verification` |
| **Admin User Management** | `/admin/users` | Admin, Super Admin | User role management & details | `GET /api/admin/users` |
| **Admin Credit Desk** | `/admin/contact-reveals`| Super Admin | Manual wallet credit adjustments | `POST /api/admin/credits` |
| **Admin Featured Overrides**| `/admin/featured` | Admin, Super Admin | Featured company toggle control | `POST /api/admin/featured` |
| **Admin Categories Desk** | `/admin/categories` | Admin, Super Admin | Category icon & taxonomy edit | `GET /api/categories` |
| **Admin Reports Desk** | `/admin/reports` | Admin, Moderator | Content report moderation | `GET/PUT /api/admin/reports` |
| **Admin Payments Ledger** | `/admin/payments` | Admin, Super Admin | Platform payment transactions | `GET /api/subscriptions` |
| **Admin Subscriptions Desk**| `/admin/subscriptions`| Admin, Super Admin | Active subscriber list | `GET /api/subscriptions` |
| **Admin System Settings** | `/admin/settings` | Super Admin | System configuration settings | None |
| **Admin Audit Log Viewer** | `/admin/audit-log` | Super Admin | Security & IP audit log | `GET /api/admin/audit` |

---

## SECTION 7 — API Inventory

The reference application defines **38 HTTP route handlers across 27 route files**:

1. `POST /api/auth/register` — Register user account & initialize wallet (`src/app/api/auth/register/route.ts`)
2. `POST /api/auth/login` — Authenticate user & set JWT cookie (`src/app/api/auth/login/route.ts`)
3. `POST /api/auth/logout` — Clear JWT session cookie (`src/app/api/auth/logout/route.ts`)
4. `GET /api/auth/me` — Fetch current session user & wallet balance (`src/app/api/auth/me/route.ts`)
5. `GET /api/categories` — List active categories (`src/app/api/categories/route.ts`)
6. `GET /api/categories/[slug]` — Fetch category detail (`src/app/api/categories/[slug]/route.ts`)
7. `GET /api/companies` — Search & filter public company directory (`src/app/api/companies/route.ts`)
8. `POST /api/companies` — Create new company listing (`src/app/api/companies/route.ts`)
9. `GET /api/companies/[id]` — Fetch company detail & contacts (`src/app/api/companies/[id]/route.ts`)
10. `PUT /api/companies/[id]` — Update company profile (`src/app/api/companies/[id]/route.ts`)
11. `DELETE /api/companies/[id]` — Soft delete company (`status = 'suspended'`) (`src/app/api/companies/[id]/route.ts`)
12. `GET /api/companies/[id]/contacts` — List company contacts (`src/app/api/companies/[id]/contacts/route.ts`)
13. `POST /api/companies/[id]/contacts` — Add company contact (`src/app/api/companies/[id]/contacts/route.ts`)
14. `GET /api/companies/[id]/members` — List company team members (`src/app/api/companies/[id]/members/route.ts`)
15. `POST /api/companies/[id]/members` — Invite company team member (`src/app/api/companies/[id]/members/route.ts`)
16. `POST /api/contacts/reveal` — Deduct 1 credit & unlock contact (`src/app/api/contacts/reveal/route.ts`)
17. `GET /api/connections` — List user connection requests (`src/app/api/connections/route.ts`)
18. `POST /api/connections` — Send connection request (`src/app/api/connections/route.ts`)
19. `PUT /api/connections/[id]` — Accept/reject connection request (`src/app/api/connections/[id]/route.ts`)
20. `GET /api/messages` — Fetch conversation messages (`src/app/api/messages/route.ts`)
21. `POST /api/messages` — Send direct message (`src/app/api/messages/route.ts`)
22. `GET /api/opportunities` — List open B2B opportunities (`src/app/api/opportunities/route.ts`)
23. `POST /api/opportunities` — Create B2B opportunity RFP (`src/app/api/opportunities/route.ts`)
24. `GET /api/subscriptions` — Get active user subscription (`src/app/api/subscriptions/route.ts`)
25. `POST /api/subscriptions` — Update dev mock subscription (`src/app/api/subscriptions/route.ts`)
26. `POST /api/stripe/checkout` — Create Stripe checkout session (`src/app/api/stripe/checkout/route.ts`)
27. `POST /api/stripe/portal` — Create Stripe customer portal link (`src/app/api/stripe/portal/route.ts`)
28. `POST /api/stripe/webhook` — Process Stripe webhook events (`src/app/api/stripe/webhook/route.ts`)
29. `GET /api/admin/companies` — List companies for admin moderation (`src/app/api/admin/companies/route.ts`)
30. `GET /api/admin/verification` — List pending verification requests (`src/app/api/admin/verification/route.ts`)
31. `PUT /api/admin/verification` — Approve/reject verification (`src/app/api/admin/verification/route.ts`)
32. `POST /api/admin/credits` — Adjust user credit wallet balance (`src/app/api/admin/credits/route.ts`)
33. `POST /api/admin/featured` — Toggle company featured status (`src/app/api/admin/featured/route.ts`)
34. `GET /api/admin/users` — List system users for admin (`src/app/api/admin/users/route.ts`)
35. `GET /api/admin/reports` — List content reports (`src/app/api/admin/reports/route.ts`)
36. `PUT /api/admin/reports` — Update report status (`src/app/api/admin/reports/route.ts`)
37. `GET /api/admin/audit` — List system audit logs (`src/app/api/admin/audit/route.ts`)
38. `GET /api/seed` — Seed demo database data (`src/app/api/seed/route.ts`)

---

## SECTION 8 — Database Schema Analysis

The system defines **28 database tables** across `schema.sql` and `src/lib/db.ts`:

1. `users` (id UUID PK, email UNIQUE, full_name, avatar_url, password_hash, role, company_id, created_at, updated_at)
2. `countries` (id UUID PK, name, code UNIQUE, region, created_at)
3. `categories` (id UUID PK, name, slug UNIQUE, description, icon, color, sort_order, is_active, created_at)
4. `products` (id UUID PK, name, description, category_id FK, created_at)
5. `services` (id UUID PK, name, description, category_id FK, created_at)
6. `companies` (id UUID PK, name, slug UNIQUE, logo_url, description, website, founded_year, headquarters, country_id FK, market, employee_count, revenue_range, technology, status, is_verified, is_featured, verification_status, created_by FK, created_at, updated_at)
7. `company_categories` (company_id FK, category_id FK, PK(company_id, category_id))
8. `company_products` (company_id FK, product_id FK, PK(company_id, product_id))
9. `company_services` (company_id FK, service_id FK, PK(company_id, service_id))
10. `company_licenses` (id UUID PK, company_id FK, license_name, jurisdiction, license_number, status, created_at)
11. `company_contacts` (id UUID PK, company_id FK, full_name, position, email, phone, linkedin, is_primary, created_at)
12. `company_members` (id UUID PK, company_id FK, user_id FK, role, invited_at, accepted_at, created_at, UNIQUE(company_id, user_id))
13. `plans` (id UUID PK, name, slug UNIQUE, price, credits, features JSONB, stripe_price_id, is_active, created_at)
14. `subscriptions` (id UUID PK, user_id FK, plan_id FK, stripe_subscription_id UNIQUE, stripe_customer_id, status, current_period_start, current_period_end, created_at, updated_at)
15. `contact_credit_wallets` (id UUID PK, user_id FK UNIQUE, balance, total_earned, total_used, created_at, updated_at)
16. `contact_credit_transactions` (id UUID PK, wallet_id FK, user_id FK, type, amount, description, reference_id, created_at)
17. `revealed_contacts` (id UUID PK, user_id FK, company_contact_id FK, revealed_at, UNIQUE(user_id, company_contact_id))
18. `connections` (id UUID PK, requester_id FK, receiver_id FK, status, message, created_at, updated_at, UNIQUE(requester_id, receiver_id))
19. `conversations` (id UUID PK, participant_1_id FK, participant_2_id FK, last_message_at, created_at)
20. `messages` (id UUID PK, conversation_id FK, sender_id FK, content, is_read, created_at)
21. `notifications` (id UUID PK, user_id FK, title, message, type, is_read, link, created_at)
22. `opportunities` (id UUID PK, title, description, type, category_id FK, created_by FK, company_id FK, status, budget, timeline, created_at, updated_at)
23. `saved_companies` (id UUID PK, user_id FK, company_id FK, notes, created_at, UNIQUE(user_id, company_id))
24. `saved_searches` (id UUID PK, user_id FK, name, filters JSONB, created_at)
25. `verification_requests` (id UUID PK, company_id FK, requested_by FK, documents JSONB, status, reviewed_by FK, review_notes, created_at, reviewed_at)
26. `reports` (id UUID PK, reporter_id FK, target_type, target_id, reason, description, status, reviewed_by FK, created_at, reviewed_at)
27. `analytics_events` (id UUID PK, user_id FK, event_type, entity_type, entity_id, metadata JSONB, ip_address, created_at)
28. `audit_logs` (id UUID PK, user_id FK, action, entity_type, entity_id, details JSONB, ip_address, created_at)

---

## SECTION 9 — Django ORM Model Plan

When building the new Django project, translate these 28 tables into **28 Django ORM Models** grouped logically across domain apps:

### 1. `apps.accounts` Models
- **`User`** (`AbstractUser`): `id` (UUIDField PK), `email` (EmailField UNIQUE), `full_name` (CharField), `avatar_url` (URLField/FileField), `role` (CharField choices), `company` (ForeignKey to `Company` null=True).

### 2. `apps.directory` Models
- **`Country`**: `id` (UUIDField PK), `name`, `code` (UNIQUE), `region`.
- **`Category`**: `id` (UUIDField PK), `name`, `slug` (UNIQUE), `description`, `icon`, `color`, `sort_order`, `is_active`.
- **`Product`**: `id` (UUIDField PK), `name`, `description`, `category` (FK `Category`).
- **`Service`**: `id` (UUIDField PK), `name`, `description`, `category` (FK `Category`).
- **`SavedCompany`**: `id` (UUIDField PK), `user` (FK `User`), `company` (FK `Company`), `notes` (TextField). UniqueTogether(`user`, `company`).
- **`SavedSearch`**: `id` (UUIDField PK), `user` (FK `User`), `name`, `filters` (JSONField).

### 3. `apps.companies` Models
- **`Company`**: `id` (UUIDField PK), `name`, `slug` (UNIQUE), `logo_url`, `description`, `website`, `founded_year`, `headquarters`, `country` (FK `Country`), `market`, `employee_count`, `revenue_range`, `technology`, `status` (choices: pending, approved, rejected, suspended), `is_verified`, `is_featured`, `verification_status`, `created_by` (FK `User`), `categories` (ManyToManyField `Category`), `products` (ManyToManyField `Product`), `services` (ManyToManyField `Service`).
- **`CompanyLicense`**: `id` (UUIDField PK), `company` (FK `Company` on_delete=CASCADE), `license_name`, `jurisdiction`, `license_number`, `status`.
- **`CompanyContact`**: `id` (UUIDField PK), `company` (FK `Company` on_delete=CASCADE), `full_name`, `position`, `email`, `phone`, `linkedin`, `is_primary`.
- **`CompanyMember`**: `id` (UUIDField PK), `company` (FK `Company`), `user` (FK `User`), `role` (choices: owner, admin, member), `invited_at`, `accepted_at`. UniqueTogether(`company`, `user`).

### 4. `apps.credits` Models
- **`ContactCreditWallet`**: `id` (UUIDField PK), `user` (OneToOneField `User` on_delete=CASCADE), `balance` (IntegerField), `total_earned`, `total_used`.
- **`ContactCreditTransaction`**: `id` (UUIDField PK), `wallet` (FK `ContactCreditWallet`), `user` (FK `User`), `type` (choices: credit, debit, refund, bonus), `amount`, `description`, `reference_id`.
- **`RevealedContact`**: `id` (UUIDField PK), `user` (FK `User`), `company_contact` (FK `CompanyContact`). UniqueTogether(`user`, `company_contact`).

### 5. `apps.subscriptions` Models
- **`Plan`**: `id` (UUIDField PK), `name`, `slug` (UNIQUE), `price` (DecimalField), `credits` (IntegerField), `features` (JSONField), `stripe_price_id`, `is_active`.
- **`Subscription`**: `id` (UUIDField PK), `user` (FK `User`), `plan` (FK `Plan`), `stripe_subscription_id` (UNIQUE), `stripe_customer_id`, `status` (choices: active, canceled, past_due, trialing), `current_period_start`, `current_period_end`.

### 6. `apps.opportunities` Models
- **`Opportunity`**: `id` (UUIDField PK), `title`, `description`, `type` (choices: looking_for, offering, partnership), `category` (FK `Category`), `created_by` (FK `User`), `company` (FK `Company`), `status` (choices: open, closed, filled), `budget`, `timeline`.

### 7. `apps.networking` Models
- **`Connection`**: `id` (UUIDField PK), `requester` (FK `User`), `receiver` (FK `User`), `status` (choices: pending, accepted, rejected, blocked), `message`. UniqueTogether(`requester`, `receiver`).
- **`Conversation`**: `id` (UUIDField PK), `participant_1` (FK `User`), `participant_2` (FK `User`), `last_message_at`.
- **`Message`**: `id` (UUIDField PK), `conversation` (FK `Conversation`), `sender` (FK `User`), `content` (TextField), `is_read` (BooleanField).
- **`Notification`**: `id` (UUIDField PK), `user` (FK `User`), `title`, `message`, `type`, `is_read`, `link`.

### 8. `apps.moderation` Models
- **`VerificationRequest`**: `id` (UUIDField PK), `company` (FK `Company`), `requested_by` (FK `User`), `documents` (JSONField), `status` (choices: pending, approved, rejected), `reviewed_by` (FK `User`), `review_notes`, `reviewed_at`.
- **`Report`**: `id` (UUIDField PK), `reporter` (FK `User`), `target_type` (choices: company, user, message), `target_id` (UUIDField), `reason`, `description`, `status` (choices: pending, reviewed, resolved, dismissed), `reviewed_by` (FK `User`), `reviewed_at`.
- **`AnalyticsEvent`**: `id` (UUIDField PK), `user` (FK `User`), `event_type`, `entity_type`, `entity_id`, `metadata` (JSONField), `ip_address`.
- **`AuditLog`**: `id` (UUIDField PK), `user` (FK `User`), `action`, `entity_type`, `entity_id`, `details` (JSONField), `ip_address`.

---

## SECTION 10 — User Roles and Permissions

### 10.1 Role Definitions
1. `super_admin`: Full system oversight, manual credit grants, database seed, role promotion.
2. `admin`: Operational platform manager (company approvals, verification badge awards, category edits).
3. `moderator`: Content reviewer (reports, flagged listings/messages).
4. `company_owner`: Primary owner of a company profile (full profile management, member invites, billing).
5. `company_member`: Organization staff member (views metrics, posts opportunities under company).
6. `professional`: Default registered user (searches directory, unlocks contacts, connects with users).
7. `guest`: Anonymous visitor (browses landing page, pricing, marketplace overviews).

### 10.2 Permission Matrix

| Feature / Action | Super Admin | Admin | Moderator | Company Owner | Company Member | Professional | Guest |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Browse Directory** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **View Unlocked Contacts** | ✅ | ✅ | ✅ | ✅ (If Revealed) | ✅ (If Revealed) | ✅ (If Revealed) | ❌ |
| **Reveal Contact (1 Credit)** | ✅ (Free) | ✅ (Free) | ❌ | ✅ | ✅ | ✅ | ❌ |
| **Create Company Listing** | ✅ | ✅ | ❌ | ✅ | ❌ | ✅ | ❌ |
| **Edit Company Profile** | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| **Approve / Reject Company**| ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Request Verification** | N/A | N/A | N/A | ✅ | ❌ | ❌ | ❌ |
| **Approve Verification** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Post Opportunity** | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ❌ |
| **Send Connection Request** | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ❌ |
| **Send Direct Message** | ✅ | ✅ | ❌ | ✅ (Connected) | ✅ (Connected) | ✅ (Connected) | ❌ |
| **Subscribe to Paid Plan** | N/A | N/A | N/A | ✅ | ✅ | ✅ | ❌ |
| **Adjust Wallet Credits** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Access Admin Suite** | ✅ | ✅ | ✅ (Partial) | ❌ | ❌ | ❌ | ❌ |

---

## SECTION 11 — Authentication and Authorization Architecture

1. **Custom Django User Model**:
   - Class `User(AbstractUser)` located in `apps.accounts.models`.
   - Set `AUTH_USER_MODEL = 'accounts.User'` in Django settings.
2. **JWT Token Authentication**:
   - Utilize `djangorestframework-simplejwt`.
   - Configure custom JWT claims serializer to include `id`, `email`, `full_name`, `role`, `company_id`.
   - Store JWT in HTTP-Only, Lax, Secure cookies (`igc-session`).
3. **Custom DRF Permission Classes**:
   - `IsSuperAdminPermission`: Enforces `request.user.role == 'super_admin'`.
   - `IsAdminPermission`: Enforces `request.user.role in ['super_admin', 'admin']`.
   - `IsCompanyOwnerPermission`: Enforces user is owner of target company (`CompanyMember.role == 'owner'`).
   - `HasActiveSubscriptionPermission`: Enforces user has subscription with `status = 'active'`.

---

## SECTION 12 — Business Rules Master (BUSINESS_RULES_MASTER)

- **BR-001 (Wallet Auto-Provisioning)**: User signup MUST automatically create a `contact_credit_wallets` record with `balance = 0`.
- **BR-002 (Password Encryption)**: Passwords MUST be hashed using strong algorithm (PBKDF2 / Argon2 / Scrypt) before storage. Min length = 8 for signup.
- **BR-003 (Active Subscription Guard)**: Unlocking contact details requires user to hold an active subscription (`status = 'active'`).
- **BR-004 (Atomic Credit Debit)**: Contact reveal decrements wallet balance by 1 inside an atomic database transaction (`transaction.atomic()`).
- **BR-005 (Duplicate Reveal Idempotency)**: Re-revealing an unlocked contact by the same user costs 0 credits (`already_revealed = True`).
- **BR-006 (Admin Reveal Bypass)**: Admins reveal all contacts without consuming credits or requiring subscriptions.
- **BR-007 (Role Elevation)**: Creating a company elevates user `role = 'company_owner'` and inserts `company_members` record with `role = 'owner'`.
- **BR-008 (Default Pending Listing)**: New companies are created in `status = 'pending'` and hidden from public search until Admin approval.
- **BR-009 (Verified Badge Review)**: Blue Verified Badge requires Admin approval (`is_verified = True`, `verification_status = 'verified'`).
- **BR-010 (Public Directory Isolation)**: Public directory queries MUST strictly filter `status = 'approved'`.
- **BR-011 (Slug Uniqueness)**: Slug collisions auto-append Unix timestamp suffix (`${slug}-${timestamp}`).
- **BR-012 (Messaging Connection Guard)**: Direct messaging requires an active, `accepted` connection status between sender and receiver.
- **BR-013 (Unrevealed Contact Masking)**: Non-revealed contact views MUST return masked email (`maskEmail`), masked phone (`maskPhone`), and `linkedin = null`.
- **BR-014 (Auto-Notification on Connect)**: Accepting a connection request dispatches an in-app notification to requester (`type = 'connection_accepted'`).
- **BR-015 (Auto-Notification on Message)**: Sending a message dispatches a notification to recipient (`type = 'new_message'`).
- **BR-016 (Company Soft Delete)**: Admin company deletion sets `status = 'suspended'` rather than dropping the database row.

---

## SECTION 13 — Validation Rules

1. **User Registration Validation**:
   - `email`: Valid email format, unique in `users` (case-insensitive).
   - `password`: String, min length = 8.
   - `full_name`: String, min length = 2.
2. **Company Profile Validation**:
   - `name`: String, min length = 2.
   - `description`: Text, min length = 10.
   - `website`: Optional URL format.
   - `founded_year`: Integer, 1800 <= year <= current_year.
3. **Opportunity Validation**:
   - `title`: String, min length = 5.
   - `description`: Text, min length = 20.
   - `type`: Must be one of `looking_for`, `offering`, `partnership`.
4. **Message Validation**:
   - `content`: Text, 1 <= length <= 5000 chars.

---

## SECTION 14 — Payment / Credits / Wallet Flows

1. **Stripe Checkout Session**:
   - Endpoint `POST /api/v1/subscriptions/checkout/` accepts `plan_slug`.
   - Generates Stripe Checkout URL for subscription mode.
   - Includes `STRIPE_OFFLINE_DEV` environment flag to allow offline local testing without live Stripe credentials.
2. **Stripe Webhooks**:
   - Endpoint `POST /api/v1/stripe/webhook/` verifies Stripe signature header.
   - Handles `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`.
   - Updates `subscriptions` record and allocates monthly wallet credit quota (+30 Starter, +50 Professional).
3. **Atomic Contact Reveal Engine**:
   - DRF View uses `transaction.atomic()` and `select_for_update()` on `ContactCreditWallet` to eliminate race conditions.

---

## SECTION 15 — Third-Party Integrations

1. **Stripe API**:
   - Billing engine for subscriptions, customer portal, checkout, and webhooks.
   - Target Django library: `stripe` Python SDK.
2. **Email Service (SMTP / Postmark / SendGrid)**:
   - For user transactional notifications and password resets.
   - Target Django backend: `django.core.mail.backends.smtp.EmailBackend`.
3. **Object Storage (AWS S3 / Cloudflare R2)**:
   - For company logos, user avatars, and verification document PDFs.
   - Target Django library: `django-storages` (`boto3`).

---

## SECTION 16 — Broken / Disconnected Functionality

1. **Saved Searches & Filter Alerts (`saved_searches` table)**: Table exists in schema, but no API route handler interacts with it.
2. **Analytics Events Tracker (`analytics_events` table)**: Table exists in schema, but no logging dispatches to it.
3. **Company License API (`company_licenses` table)**: Table exists and is read in company details, but `POST /api/companies/[id]/licenses` API endpoint is absent.
4. **Saved Companies API**: UI page exists at `/app/saved`, but dedicated `POST /api/saved-companies` API endpoint is missing.

---

## SECTION 17 — Documented But Not Implemented Features

1. **Password Reset via Email Link**: Documented in user flows, but `/api/auth/reset-password` API handler is absent in code.
2. **Email Verification Token Workflow**: Documented in PRD, but email token handler is missing.
3. **Export Contacts to CSV**: Listed in Professional plan features in docs, but CSV export view is un-implemented.
4. **Real-time WebSockets Chat**: Documented in architecture docs, but reference code uses HTTP REST polling (`POST /api/messages`).

---

## SECTION 18 — Implemented But Not Documented Features

1. **Unrevealed Contact Detail Masking Security Rule**: Enforced in `src/app/api/companies/[id]/route.ts` (L78-90) & `contacts/route.ts` (L41-52). Masks emails and phones in API responses.
2. **Auto-Notification Dispatches**: Auto-notifies on connection acceptance (`src/app/api/connections/[id]/route.ts`) and new direct messages (`src/app/api/messages/route.ts`).
3. **Admin Company Soft Delete**: `DELETE /api/companies/[id]` updates `status = 'suspended'` rather than dropping the row.
4. **Registration Onboarding Wizard**: Dedicated page `/register/onboarding` for post-signup profile initialization.

---

## SECTION 19 — Recommended Django Domain Architecture

Partition the new Django backend into **8 domain-driven applications** inside an `apps/` directory:

```
config/                     # Django settings, root URLs, WSGI/ASGI
apps/
  ├── accounts/             # User auth, custom User model, JWT sessions, RBAC
  ├── directory/            # Categories, countries, products, services, search, saved items
  ├── companies/            # Company listings, contacts, licenses, team members
  ├── credits/              # Contact credit wallets, debit ledger, contact reveals
  ├── subscriptions/        # Plans, Stripe checkout, portal, webhooks, dev mock
  ├── opportunities/        # B2B RFPs & lead postings
  ├── networking/           # Connections, direct messaging, system notifications
  └── moderation/           # Verification reviews, content reports, audit logging
```

---

## SECTION 20 — Django REST API Specification

Below is the RESTful API design for the new Django REST Framework backend (`/api/v1/` prefix):

### 1. `apps.accounts` APIs
- `POST /api/v1/auth/register/` — Register account & auto-initialize credit wallet.
- `POST /api/v1/auth/login/` — Authenticate credentials & issue JWT session cookie.
- `POST /api/v1/auth/logout/` — Clear JWT session cookie.
- `GET /api/v1/auth/me/` — Retrieve user profile & current wallet balance.

### 2. `apps.directory` APIs
- `GET /api/v1/categories/` — List active industry categories.
- `GET /api/v1/categories/<slug>/` — Category detail view.
- `GET /api/v1/countries/` — List tax/jurisdiction countries.
- `GET/POST /api/v1/saved-companies/` — Bookmark & list saved companies.

### 3. `apps.companies` APIs
- `GET /api/v1/companies/` — Search & filter company directory (`status='approved'`).
- `POST /api/v1/companies/` — Create new pending company listing.
- `GET /api/v1/companies/<slug>/` — Company detail view (masks unrevealed contacts).
- `PUT /api/v1/companies/<id>/` — Update company profile.
- `DELETE /api/v1/companies/<id>/` — Soft delete company (`status='suspended'`).
- `GET/POST /api/v1/companies/<id>/contacts/` — CRUD executive contacts.
- `GET/POST /api/v1/companies/<id>/licenses/` — CRUD regulatory licenses.
- `GET/POST /api/v1/companies/<id>/members/` — Manage company team members.

### 4. `apps.credits` APIs
- `POST /api/v1/contacts/reveal/` — Atomic credit debit & contact reveal view.
- `GET /api/v1/credits/wallet/` — Fetch user wallet balance.
- `GET /api/v1/credits/history/` — Fetch wallet transaction history.

### 5. `apps.subscriptions` APIs
- `GET /api/v1/subscriptions/plan/` — Fetch current subscription plan.
- `POST /api/v1/subscriptions/checkout/` — Create Stripe Checkout session.
- `POST /api/v1/subscriptions/portal/` — Create Stripe Customer Portal link.
- `POST /api/v1/stripe/webhook/` — Process incoming Stripe webhooks.

### 6. `apps.opportunities` APIs
- `GET /api/v1/opportunities/` — Search open B2B opportunities.
- `POST /api/v1/opportunities/` — Post new B2B RFP.

### 7. `apps.networking` APIs
- `GET/POST /api/v1/connections/` — List & send connection requests.
- `PUT /api/v1/connections/<id>/` — Accept/reject connection request.
- `GET/POST /api/v1/messages/` — Fetch threads & send direct messages.
- `GET /api/v1/notifications/` — Fetch in-app user notifications.

### 8. `apps.moderation` APIs
- `GET/PUT /api/v1/admin/companies/<id>/` — Moderation company status control.
- `GET/PUT /api/v1/admin/verification/<id>/` — Review & approve verification requests.
- `POST /api/v1/admin/credits/grant/` — Super Admin manual credit adjustment.
- `POST /api/v1/admin/featured/<id>/` — Toggle company featured status.
- `GET /api/v1/admin/users/` — Admin user management list.
- `GET/PUT /api/v1/admin/reports/<id>/` — Review user content reports.
- `GET /api/v1/admin/audit-logs/` — Platform audit log viewer.

---

## SECTION 21 — Database Migration Strategy

1. Create PostgreSQL database `igaming_connect_db`.
2. Execute Django `makemigrations` and `migrate` in dependency order:
   - Order: `accounts` -> `directory` -> `companies` -> `credits` -> `subscriptions` -> `opportunities` -> `networking` -> `moderation`.
3. Run Django seed command `python manage.py seed_db` to populate categories, countries, subscription plans, super admin, and demo data.

---

## SECTION 22 — Security Requirements

- **Session Security**: Store JWT in `HttpOnly`, `SameSite=Lax`, `Secure` cookies.
- **OWASP Compliance**: Parameterized queries via Django ORM (SQL injection prevention), auto-escaping templates/JSON responses (XSS protection), CORS headers configuration.
- **Rate Limiting**: Apply DRF `ScopedRateThrottle` on auth endpoints (`5 attempts/minute`).
- **Data Protection**: Enforce contact detail masking (`maskEmail`, `maskPhone`) at the serializer level.

---

## SECTION 23 — Production Architecture Recommendations

- **Web Server**: Gunicorn / Uvicorn behind Nginx reverse proxy.
- **Database**: Managed PostgreSQL 16 (AWS RDS / DigitalOcean Managed DB) with automated daily backups.
- **Task Queue & Cache**: Redis 7 for session caching and Celery 5.4 task queue for asynchronous Stripe webhook handling and monthly credit refills.
- **Static & Media Storage**: AWS S3 / Cloudflare R2 via `django-storages`.

---

## SECTION 24 — Final Verified Project Statistics

- **Total Modules**: 17
- **Total Features**: 35 (28 Implemented, 1 Partial, 3 Broken/Disconnected, 3 Planned Only)
- **Total Pages (Screens)**: 39 (8 Public, 3 Auth, 15 User Dashboard, 13 Admin Panel)
- **Total Routes**: 39 Page Routes
- **Total API Route Files**: 27 Route Files (38 HTTP Method Handlers)
- **Total Database Tables**: 28 Tables
- **Total Planned Django Models**: 28 Models
- **Total User Roles**: 10 (6 System Global Roles + 3 Company Sub-Roles + 1 Guest)
- **Total Permissions**: 14 Explicit Permission Rules
- **Total Business Rules**: 16 Centralized Business Rules (BR-001 to BR-016)
- **Total Integrations**: 3 (Stripe Payment Gateway, Email Service, Cloud Media Storage)
