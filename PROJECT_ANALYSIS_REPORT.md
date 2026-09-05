# PROJECT ANALYSIS REPORT — iGaming Connect (B2B Platform)

**Date**: September 3, 2026  
**Project Name**: igaming-connect  
**Framework**: Next.js 16.3.3 (App Router)  
**Primary Language**: TypeScript  

---

## 1. Project Overview
**iGaming Connect** is a full-stack B2B Marketplace and Directory web application designed for the global iGaming industry. The platform allows gaming operators, software platform providers, sportsbook API providers, casino game aggregators, and affiliates to connect, list products/services, showcase licenses, discover opportunities, and manage contact reveals via a credit-based subscription model.

Key capabilities of the system:
- **Public Directory & Marketplace**: Filter companies by category, country, market, and verification status.
- **User Authentication & RBAC**: JWT-based session authentication with roles (`super_admin`, `admin`, `moderator`, `company_owner`, `company_member`, `professional`).
- **Dashboard (`/app`)**: Business profile editing, opportunity posting, member management, saved companies, contact reveals, and direct messaging between connected users.
- **Admin Panel (`/admin`)**: Admin dashboard for user management, company status approvals/suspensions, verification requests, categories, audit logs, and reports.
- **Monetization & Credits**: Subscription plans (Starter, Professional, Enterprise) and contact credit wallet system for unlocking verified business contacts.

---

## 2. Technology Stack

| Layer | Technology / Library | Version / Details |
| :--- | :--- | :--- |
| **Core Framework** | Next.js (App Router) | `16.3.3` |
| **UI Library** | React / React DOM | `19.2.8` |
| **Language** | TypeScript | `^5` |
| **Styling** | Vanilla CSS + Tailwind CSS v4 | `@tailwindcss/postcss ^4`, `postcss` |
| **Database** | SQLite via `better-sqlite3` | `^13.0.3` (`igaming-connect.db`) |
| **Authentication** | Custom JWT (`jose`) + HTTP-Only Cookies | `jose ^6.2.10` |
| **State Management** | Zustand & React Query | `zustand ^5.0.15`, `@tanstack/react-query ^5.102.8` |
| **3D Graphics & Animations** | Three.js, React Three Fiber, Drei, Framer Motion | `three ^0.185.1`, `@react-three/fiber ^9.7.0`, `@react-three/drei ^10.7.8`, `framer-motion ^13.1.1` |
| **Validation** | Zod | `zod ^4.5.4` |
| **Payment Gateway** | Stripe API Integration | `stripe ^22.6.0`, `@stripe/stripe-js ^9.14.0` |

---

## 3. Architecture Analysis

```
[ Browser / Client ]
       │
       ▼
[ Next.js Middleware (src/middleware.ts) ]  ◄── JWT Verification (igc-session cookie)
       │
       ├──► Public Routes (/ , /marketplace, /pricing, /about, /contact, /faq)
       ├──► Auth Routes (/login, /register)
       ├──► Dashboard Routes (/app/*) ──► Session Required
       └──► Admin Routes (/admin/*)    ──► Super Admin / Admin Role Required
       │
       ▼
[ Next.js App Router API Routes (src/app/api/*) ]
       │
       ├──► Auth API (/api/auth/*)
       ├──► Companies API (/api/companies/*)
       ├──► Contacts API (/api/contacts/*)
       ├──► Opportunities API (/api/opportunities/*)
       ├──► Subscriptions & Stripe API (/api/subscriptions, /api/stripe/*)
       └──► Admin API (/api/admin/*)
       │
       ▼
[ SQLite Database Engine (src/lib/db.ts) ]  ◄── WAL Mode, Foreign Keys ON
       └── Local File: igaming-connect.db
```

### End-to-End Workflow:
1. **Request Lifecycle**: Incoming requests hit Next.js middleware (`src/middleware.ts`). If accessing protected `/app/*` or `/admin/*` routes, the `igc-session` cookie is decoded using `jose.jwtVerify`. Unauthenticated users are redirected to `/login`.
2. **Database Layer**: API routes call `initDb()` from `src/lib/db.ts` to ensure tables and indexes exist in the local SQLite database file `igaming-connect.db`. SQL queries execute synchronously using `better-sqlite3`.
3. **Auth & Sessions**: Users register or log in via `/api/auth/register` or `/api/auth/login`. Passwords are salted and hashed using Node.js `crypto.scryptSync`. On success, a JWT signed with `HS256` is stored in an HTTP-only cookie (`igc-session`).
4. **Data Seed**: The seed script (`src/lib/seed.ts` or `/api/seed`) populates initial categories, countries, subscription plans, admin user (`admin@igamingconnect.com` / `admin123`), demo users (`buyer@demo.com` / `demo123`), companies, contacts, opportunities, and connections.

---

## 4. How to Run the Project

### Environment Setup
1. Ensure Node.js (v18+) is installed.
2. Create a `.env.local` file from `.env.example` with suitable environment variables (or local dev defaults).

### Installation & Execution Commands
```bash
# 1. Install dependencies
npm install

# 2. Seed the SQLite database with demo data
npm run seed

# 3. Start development server
npm run dev
```

---

## 5. Summary of Problems & Issues Found

### Priority Summary
- **Critical**: 1 issue
- **High**: 3 issues
- **Medium**: 4 issues
- **Low**: 3 issues

---

## 6. Detailed Issue Directory

### Issue 1: Missing Dependencies (`node_modules`) [CRITICAL]
- **File Name**: Workspace root (`node_modules/`)
- **Exact Problem**: The `node_modules` directory is absent. Running any build, type check, or server script fails immediately with module resolution errors.
- **Why it Happens**: Dependencies listed in `package.json` have not been installed via `npm install`.
- **Recommended Solution**: Run `npm install` to install all production and development dependencies.

---

### Issue 2: Environmental Variable Non-Null Assertions & Missing `.env.local` [HIGH]
- **File Name**: [src/lib/env.ts](file:///Users/apple/Downloads/IG%20Dssh/src/lib/env.ts)
- **Exact Problem**: `src/lib/env.ts` uses TypeScript non-null assertions (`!`) on optional environment variables such as `NEXT_PUBLIC_SUPABASE_URL!`, `SUPABASE_SERVICE_ROLE_KEY!`, `DATABASE_URL!`, `STRIPE_SECRET_KEY!`. When these variables are not present in `.env`, `env` exports `undefined` properties, causing runtime errors when third-party services (like Stripe or Supabase) attempt to initialize.
- **Why it Happens**: Strict environment variable mapping without default fallbacks or soft checks.
- **Recommended Solution**: Provide safe fallbacks in `src/lib/env.ts` for local development when keys are not explicitly set in process environment.

---

### Issue 3: Schema Mismatch (PostgreSQL `schema.sql` vs SQLite `src/lib/db.ts`) [HIGH]
- **File Name**: [schema.sql](file:///Users/apple/Downloads/IG%20Dssh/schema.sql) vs [src/lib/db.ts](file:///Users/apple/Downloads/IG%20Dssh/src/lib/db.ts)
- **Exact Problem**: `schema.sql` specifies PostgreSQL syntax (`uuid-ossp`, `JSONB`, `TIMESTAMPTZ`), whereas the application runtime uses `better-sqlite3` and defines a SQLite schema in `src/lib/db.ts`. Furthermore, `package.json` contains unused packages (`pg`, `drizzle-orm`, `@supabase/supabase-js`, `@supabase/ssr`).
- **Why it Happens**: Historical refactoring or boilerplate inclusion from a PostgreSQL/Supabase setup that was transitioned to local SQLite.
- **Recommended Solution**: Document the SQLite runtime architecture clearly. Keep `src/lib/db.ts` as the single source of truth for the SQLite database initialization and schemas.

---

### Issue 4: Non-Atomic Credit Deduction & Contact Reveal Transactions [HIGH]
- **File Name**: [src/app/api/contacts/reveal/route.ts](file:///Users/apple/Downloads/IG%20Dssh/src/app/api/contacts/reveal/route.ts)
- **Exact Problem**: Credit balance update, transaction creation, and contact reveal insertion run as individual, un-wrapped SQL statements instead of inside a single `db.transaction(...)` block. Manual rollback in the `catch` block is unsafe if the process crashes mid-operation.
- **Why it Happens**: Operations were written sequentially without leveraging SQLite ACID transactions (`db.transaction()`).
- **Recommended Solution**: Wrap the credit deduction, transaction log, and contact reveal insertion in a `better-sqlite3` transaction function `db.transaction(...)`.

---

### Issue 5: Non-Existent Icon Import from `lucide-react` [MEDIUM]
- **File Name**: [src/app/(public)/page.tsx](file:///Users/apple/Downloads/IG%20Dssh/src/app/(public)/page.tsx#L8)
- **Exact Problem**: `PlayingCards` is imported from `lucide-react`, which is not an exported symbol in standard `lucide-react` releases, leading to build or runtime module errors.
- **Why it Happens**: Typo or deprecated icon name.
- **Recommended Solution**: Replace `PlayingCards` with a valid Lucide icon such as `Dices` or `Gamepad2`.

---

### Issue 6: Unhandled Stripe Initialization Exception Without Secret Key [MEDIUM]
- **File Name**: [src/lib/stripe.ts](file:///Users/apple/Downloads/IG%20Dssh/src/lib/stripe.ts#L8)
- **Exact Problem**: `getStripe()` executes `new Stripe(env.STRIPE_SECRET_KEY, ...)` directly. If `STRIPE_SECRET_KEY` is empty, `new Stripe("")` throws a runtime constructor error when Stripe utility functions are accessed.
- **Why it Happens**: Missing guard clause for empty secret key in local dev mock mode.
- **Recommended Solution**: Add a check in `getStripe()` to verify key presence or return a mock client when running in offline local development.

---

### Issue 7: Hardcoded Default JWT Secret Fallback in Multiple Files [MEDIUM]
- **File Name**: [src/lib/auth-local.ts](file:///Users/apple/Downloads/IG%20Dssh/src/lib/auth-local.ts#L7) & [src/middleware.ts](file:///Users/apple/Downloads/IG%20Dssh/src/middleware.ts#L6)
- **Exact Problem**: Both files hardcode `"igaming-connect-dev-secret-key-change-in-production"` as a fallback when `process.env.JWT_SECRET` is missing.
- **Why it Happens**: Fallback logic duplicated in multiple files.
- **Recommended Solution**: Centralize JWT secret retrieval in a single utility or `src/lib/env.ts`.

---

### Issue 8: Inconsistent Dynamic Route Handler Params (Next.js 16 Async Params) [MEDIUM]
- **File Name**: [src/app/api/companies/[id]/route.ts](file:///Users/apple/Downloads/IG%20Dssh/src/app/api/companies/%5Bid%5D/route.ts#L15), [src/app/api/connections/[id]/route.ts](file:///Users/apple/Downloads/IG%20Dssh/src/app/api/connections/%5Bid%5D/route.ts)
- **Exact Problem**: Next.js 16 requires dynamic route params to be handled as Promises (`{ params }: { params: Promise<{ id: string }> }`). While some routes use `await params`, all dynamic routes (`[id]`, `[slug]`) must strictly follow this pattern to avoid runtime deprecation warnings or parameter resolution failures.
- **Why it Happens**: Next.js 16 breaking change to route handler parameter signatures.
- **Recommended Solution**: Ensure all dynamic route handlers across `src/app/api/` await `params`.

---

### Issue 9: Seed Script Standalone Execution Dependency [LOW]
- **File Name**: [src/lib/seed.ts](file:///Users/apple/Downloads/IG%20Dssh/src/lib/seed.ts#L558) & [package.json](file:///Users/apple/Downloads/IG%20Dssh/package.json#L10)
- **Exact Problem**: `npm run seed` executes `npx tsx src/lib/seed.ts`. `tsx` relies on Node module resolution. If `npx tsx` is run without pre-installed packages or if environment variables are uninitialized, seeding fails.
- **Why it Happens**: Missing error handling for standalone CLI invocation.
- **Recommended Solution**: Ensure `tsx` is available and environment is loaded before running seed.

---

### Issue 10: Missing `.env.local` File Creation [LOW]
- **File Name**: Workspace Root
- **Exact Problem**: No `.env` or `.env.local` file exists in the repository root (only `.env.example`).
- **Why it Happens**: Environment configuration files are gitignored by design.
- **Recommended Solution**: Automatically generate `.env.local` populated with default dev environment settings.

---

### Issue 11: Lucide Icon Dynamic Lookups in Admin Analytics & Categories [LOW]
- **File Name**: [src/app/(admin)/admin/categories/page.tsx](file:///Users/apple/Downloads/IG%20Dssh/src/app/(admin)/admin/categories/page.tsx)
- **Exact Problem**: Category icon names stored as strings in database (e.g. `"Server"`, `"Trophy"`, `"Zap"`) require dynamic icon rendering or lookup mapping on the client side.
- **Why it Happens**: Icons are stored as string identifier tokens in SQLite.
- **Recommended Solution**: Ensure fallback icon mapping exists for unmapped icon string names.

---

## 7. Recommended Fix Plan & Priority Order

1. **Step 1 (Critical)**: Run `npm install` to populate `node_modules` and resolve all TypeScript/Next.js imports.
2. **Step 2 (High)**: Create `.env.local` from `.env.example` and update `src/lib/env.ts` with safe fallbacks.
3. **Step 3 (Medium)**: Fix invalid `lucide-react` import `PlayingCards` in `src/app/(public)/page.tsx`.
4. **Step 4 (High)**: Refactor `src/app/api/contacts/reveal/route.ts` to use `db.transaction()` for atomic credit deductions.
5. **Step 5 (Medium)**: Guard `getStripe()` in `src/lib/stripe.ts` against missing API keys during local development.
6. **Step 6 (Verification)**: Execute `npm run build` and `npm run dev` to verify clean compilation and zero console errors.

---
*Report generated automatically for Phase 3 compliance.*
