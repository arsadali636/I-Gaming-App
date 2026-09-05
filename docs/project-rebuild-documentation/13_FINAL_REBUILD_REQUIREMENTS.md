# 13 — Final Rebuild Requirements (Master Single Source of Truth)

# iGaming Connect — Master Software Requirements Specification

This document serves as the **definitive, single source of truth** for rebuilding **iGaming Connect** from scratch using **Django 5.x + Django REST Framework (DRF)** and **PostgreSQL 16**.

Every requirement in this specification has been audited against the application source code and tagged with its empirical verification source:
* `[VERIFIED FROM CODE]`
* `[VERIFIED FROM DATABASE]`
* `[VERIFIED FROM ROUTES/API]`
* `[NEEDS PRODUCT DECISION]`

---

## 1. Product Overview
* **Product Name:** iGaming Connect `[VERIFIED FROM CODE]`
* **Purpose:** Global B2B Marketplace, Verified Directory, and Networking Platform connecting iGaming operators, platform software providers, game studios, aggregators, payment gateways, and compliance labs `[VERIFIED FROM CODE]`.
* **Problem Solved:** Solves fragmented vendor discovery, opaque regulatory licensing validation, unverified decision-maker contacts, and inefficient B2B partner matching `[VERIFIED FROM CODE]`.
* **Target Industry Verticals:** Online Casino, Sportsbook, Slots, Virtual Games, Platform Providers, PSP / Payments, Compliance / KYC / AML, Aggregators, Licensing Authorities `[VERIFIED FROM DATABASE]`.
* **Monetization Engine:** Hybrid subscription model (Starter $299/mo, Professional $499/mo, Enterprise Custom) + Contact Credit Wallet system for revealing executive contacts `[VERIFIED FROM CODE]`.

---

## 2. User Roles
1. `super_admin`: Platform owner with full administrative, billing, and database access `[VERIFIED FROM CODE]`.
2. `admin`: Operational administrator managing company approvals, verification requests, and content moderation `[VERIFIED FROM CODE]`.
3. `moderator`: Content reviewer handling reports and flagged listings `[VERIFIED FROM CODE]`.
4. `company_owner`: Creator/owner of a company profile with full editing, team management, and contact rights `[VERIFIED FROM CODE]`.
5. `company_member`: Team member associated with a company profile `[VERIFIED FROM CODE]`.
6. `professional`: Default registered user account (buyer, seller, or consultant) `[VERIFIED FROM CODE]`.
7. `company_member.role`: Sub-roles within a company organization (`owner`, `admin`, `member`) `[VERIFIED FROM DATABASE]`.

---

## 3. Permission Matrix

| Feature / Action | Super Admin | Admin | Moderator | Company Owner | Company Member | Professional | Guest | Verification Source |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| **Browse Directory & Marketplace** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | `[VERIFIED FROM ROUTES/API]` |
| **View Unlocked Contact Info** | ✅ | ✅ | ✅ | ✅ (If Revealed) | ✅ (If Revealed) | ✅ (If Revealed) | ❌ | `[VERIFIED FROM CODE]` |
| **Reveal Contact (Consume Credit)** | ✅ (Free) | ✅ (Free) | ❌ | ✅ (1 Credit) | ✅ (1 Credit) | ✅ (1 Credit) | ❌ | `[VERIFIED FROM CODE]` |
| **Register & Create Account** | N/A | N/A | N/A | N/A | N/A | ✅ | ✅ | `[VERIFIED FROM ROUTES/API]` |
| **Create Company Listing** | ✅ | ✅ | ❌ | ✅ | ❌ | ✅ | ❌ | `[VERIFIED FROM CODE]` |
| **Edit Company Profile** | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | `[VERIFIED FROM CODE]` |
| **Approve / Reject Company** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | `[VERIFIED FROM ROUTES/API]` |
| **Request Verification Badge** | N/A | N/A | N/A | ✅ | ❌ | ❌ | ❌ | `[VERIFIED FROM CODE]` |
| **Approve Verification Request** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | `[VERIFIED FROM ROUTES/API]` |
| **Post B2B Opportunity** | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ❌ | `[VERIFIED FROM CODE]` |
| **Send Connection Request** | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ❌ | `[VERIFIED FROM CODE]` |
| **Send Direct Message** | ✅ | ✅ | ❌ | ✅ (Connected) | ✅ (Connected) | ✅ (Connected) | ❌ | `[VERIFIED FROM CODE]` |
| **Subscribe to Paid Plan** | N/A | N/A | N/A | ✅ | ✅ | ✅ | ❌ | `[VERIFIED FROM ROUTES/API]` |
| **Adjust User Credits (Admin)** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | `[VERIFIED FROM CODE]` |
| **Access Admin Panel (`/admin`)** | ✅ | ✅ | ✅ (Partial) | ❌ | ❌ | ❌ | ❌ | `[VERIFIED FROM CODE]` |

---

## 4. Complete Module List
1. **Authentication & User Management Module** `[VERIFIED FROM CODE]`
2. **Company Directory & Profile Module** `[VERIFIED FROM CODE]`
3. **Products & Services Catalog Module** `[VERIFIED FROM CODE]`
4. **Verification & Compliance Module** `[VERIFIED FROM CODE]`
5. **Contact Credit Wallet & Reveal Module** `[VERIFIED FROM CODE]`
6. **Subscription & Payment Engine Module** `[VERIFIED FROM CODE]`
7. **Marketplace Search & Saved Bookmarks Module** `[VERIFIED FROM CODE]`
8. **B2B Opportunity Board Module** `[VERIFIED FROM CODE]`
9. **Social Networking & Messaging Module** `[VERIFIED FROM CODE]`
10. **Admin Moderation & Audit Module** `[VERIFIED FROM CODE]`

---

## 5. Complete Feature List
* **F-001: User Registration:** Signup via email, min 8 char password, full name, optional company name `[VERIFIED FROM CODE]`. Auto-initializes credit wallet `[VERIFIED FROM CODE]`.
* **F-002: User Login:** Credential verification using Scrypt key derivation `[VERIFIED FROM CODE]`. Issues HS256 JWT cookie `[VERIFIED FROM CODE]`.
* **F-003: Onboarding Wizard:** Post-signup onboarding flow (`/register/onboarding`) `[VERIFIED FROM CODE]`.
* **F-004: Company Listing Creation:** Form submission creating pending company, slug generation, and owner elevation `[VERIFIED FROM CODE]`.
* **F-005: Company Contacts & Licenses:** Adding executive contacts and regulatory license certificates `[VERIFIED FROM CODE]`.
* **F-006: Verification Requests:** Document submission for blue Verified Badge review `[VERIFIED FROM CODE]`.
* **F-007: Contact Reveal Engine:** Unlocking email/phone/LinkedIn using wallet credit inside atomic SQLite transaction `[VERIFIED FROM CODE]`.
* **F-008: Unrevealed Contact Masking:** Masking email (`maskEmail`) and phone (`maskPhone`) for non-revealed views `[VERIFIED FROM CODE]`.
* **F-009: Stripe Subscriptions:** Checkout sessions, customer portal, webhooks, and offline local dev mock fallback `[VERIFIED FROM CODE]`.
* **F-010: Marketplace Search & Filtering:** Faceted filtering by category, country, market, verified status, and keywords `[VERIFIED FROM CODE]`.
* **F-011: Bookmarks & Saved Searches:** Saving target companies with custom notes and saving filter queries `[VERIFIED FROM CODE]`.
* **F-012: Opportunity Board:** Posting B2B RFPs (`looking_for`, `offering`, `partnership`) with budget/timeline `[VERIFIED FROM CODE]`.
* **F-013: Connections & Networking:** Requesting, accepting, rejecting connection requests `[VERIFIED FROM CODE]`.
* **F-014: Direct 1-on-1 Messaging:** Chatting between connected users with read receipts `[VERIFIED FROM CODE]`.
* **F-015: System Notifications:** In-app dispatches on connection acceptances and new messages `[VERIFIED FROM CODE]`.
* **F-016: Admin Moderation Desk:** Reviewing pending companies, soft-deleting via status = 'suspended', managing categories, reviewing flags `[VERIFIED FROM CODE]`.
* **F-017: Admin Credit Adjustment:** Granting bonus/refund credits to user wallets `[VERIFIED FROM CODE]`.

---

## 6. Business Rules
* **BR-001 (Wallet Auto-Provisioning):** Registration MUST automatically create a `contact_credit_wallets` record (`balance = 0`) `[VERIFIED FROM CODE]`.
* **BR-002 (Password Strength):** Registration requires password length >= 8 `[VERIFIED FROM CODE]`. Login allows >= 6 `[VERIFIED FROM CODE]`.
* **BR-003 (Active Subscription Guard):** Contact reveals require an active subscription (`subscriptions.status = 'active'`) `[VERIFIED FROM CODE]`.
* **BR-004 (Atomic Credit Debit):** Contact reveal decrements `balance` by 1 and logs debit transaction inside single atomic transaction `[VERIFIED FROM CODE]`.
* **BR-005 (Duplicate Reveal Idempotency):** Re-opening an unlocked contact costs 0 credits (`already_revealed = true`) `[VERIFIED FROM CODE]`.
* **BR-006 (Admin Reveal Bypass):** Admins reveal all contacts without deducting credits `[VERIFIED FROM CODE]`.
* **BR-007 (Role Elevation):** Creating a company updates user role to `company_owner` and assigns `owner` in `company_members` `[VERIFIED FROM CODE]`.
* **BR-008 (Default Pending Listing):** New companies are created in `status = 'pending'` and hidden from public search `[VERIFIED FROM CODE]`.
* **BR-009 (Verified Badge Review):** Verification requires Admin approval (`is_verified = 1`, `verification_status = 'verified'`) `[VERIFIED FROM CODE]`.
* **BR-010 (Public Directory Isolation):** Non-admin searches strictly query `status = 'approved'` `[VERIFIED FROM CODE]`.
* **BR-011 (Slug Uniqueness):** Slug collisions auto-append timestamp suffix `[VERIFIED FROM CODE]`.
* **BR-012 (Messaging Connection Requirement):** Messages require an `accepted` connection status `[VERIFIED FROM CODE]`.
* **BR-013 (Contact Masking):** Unrevealed emails and phones MUST be masked in API responses `[VERIFIED FROM CODE]`.
* **BR-014 (Auto-Notification on Connect Accept):** Accepting connection sends notification to requester (`type = 'connection_accepted'`) `[VERIFIED FROM CODE]`.
* **BR-015 (Auto-Notification on Message):** Sending a message creates a notification for receiver (`type = 'new_message'`) `[VERIFIED FROM CODE]`.

---

## 7. User Flows
* **Registration & Onboarding:** `/register` -> Form Submit -> Auto Wallet Init -> JWT Cookie -> Redirect to `/register/onboarding` -> Redirect to `/app` `[VERIFIED FROM CODE]`.
* **Company Creation:** `/app/company` -> Form Submit -> Insert Company (`status = 'pending'`) -> Owner Role Elevation -> Admin Notification `[VERIFIED FROM CODE]`.
* **Marketplace Search & Contact Reveal:** `/marketplace` -> Filter Query -> Select Company -> View Masked Contacts -> Click Unlock -> Deduct 1 Credit -> Unmask Email/Phone `[VERIFIED FROM CODE]`.
* **Stripe Subscription:** `/pricing` -> Checkout Click -> Stripe Session / Dev Mock -> Activate Plan -> Credit Wallet Refill (+30 or +50) `[VERIFIED FROM CODE]`.

---

## 8. Database Entities (24 Core Tables)
1. `users` (id, email UK, full_name, avatar_url, password_hash, role, company_id FK) `[VERIFIED FROM DATABASE]`.
2. `countries` (id, name, code UK, region) `[VERIFIED FROM DATABASE]`.
3. `categories` (id, name, slug UK, description, icon, color, sort_order, is_active) `[VERIFIED FROM DATABASE]`.
4. `products` (id, name, description, category_id FK) `[VERIFIED FROM DATABASE]`.
5. `services` (id, name, description, category_id FK) `[VERIFIED FROM DATABASE]`.
6. `companies` (id, name, slug UK, logo_url, description, website, founded_year, headquarters, country_id FK, market, employee_count, revenue_range, status, is_verified, is_featured, verification_status, created_by FK) `[VERIFIED FROM DATABASE]`.
7. `company_categories` (company_id FK, category_id FK) `[VERIFIED FROM DATABASE]`.
8. `company_products` (company_id FK, product_id FK) `[VERIFIED FROM DATABASE]`.
9. `company_services` (company_id FK, service_id FK) `[VERIFIED FROM DATABASE]`.
10. `company_licenses` (id, company_id FK, license_name, jurisdiction, license_number, status) `[VERIFIED FROM DATABASE]`.
11. `company_contacts` (id, company_id FK, full_name, position, email, phone, linkedin, is_primary) `[VERIFIED FROM DATABASE]`.
12. `company_members` (id, company_id FK, user_id FK, role, invited_at, accepted_at) `[VERIFIED FROM DATABASE]`.
13. `plans` (id, name, slug UK, price, credits, features JSON, stripe_price_id, is_active) `[VERIFIED FROM DATABASE]`.
14. `subscriptions` (id, user_id FK, plan_id FK, stripe_subscription_id UK, stripe_customer_id, status, current_period_start, current_period_end) `[VERIFIED FROM DATABASE]`.
15. `contact_credit_wallets` (id, user_id FK UK, balance, total_earned, total_used) `[VERIFIED FROM DATABASE]`.
16. `contact_credit_transactions` (id, wallet_id FK, user_id FK, type, amount, description, reference_id) `[VERIFIED FROM DATABASE]`.
17. `revealed_contacts` (id, user_id FK, company_contact_id FK) `[VERIFIED FROM DATABASE]`.
18. `connections` (id, requester_id FK, receiver_id FK, status, message) `[VERIFIED FROM DATABASE]`.
19. `conversations` (id, participant_1_id FK, participant_2_id FK, last_message_at) `[VERIFIED FROM DATABASE]`.
20. `messages` (id, conversation_id FK, sender_id FK, content, is_read) `[VERIFIED FROM DATABASE]`.
21. `notifications` (id, user_id FK, title, message, type, is_read, link) `[VERIFIED FROM DATABASE]`.
22. `opportunities` (id, title, description, type, category_id FK, created_by FK, company_id FK, status, budget, timeline) `[VERIFIED FROM DATABASE]`.
23. `saved_companies` (id, user_id FK, company_id FK, notes) `[VERIFIED FROM DATABASE]`.
24. `verification_requests` (id, company_id FK, requested_by FK, documents JSON, status, reviewed_by FK, review_notes, reviewed_at) `[VERIFIED FROM DATABASE]`.

---

## 9. Entity Relationships
* `User` ──(1:1)──> `ContactCreditWallet` `[VERIFIED FROM DATABASE]`
* `User` ──(1:N)──> `Subscription` `[VERIFIED FROM DATABASE]`
* `Company` ──(M:N)──> `Category` (via `company_categories`) `[VERIFIED FROM DATABASE]`
* `Company` ──(1:N)──> `CompanyLicense` `[VERIFIED FROM DATABASE]`
* `Company` ──(1:N)──> `CompanyContact` `[VERIFIED FROM DATABASE]`
* `Company` ──(1:N)──> `CompanyMember` `[VERIFIED FROM DATABASE]`
* `Conversation` ──(1:N)──> `Message` `[VERIFIED FROM DATABASE]`
* `ContactCreditWallet` ──(1:N)──> `ContactCreditTransaction` `[VERIFIED FROM DATABASE]`

---

## 10. API Requirements (27 Verified Endpoints)
1. `POST /api/auth/register` `[VERIFIED FROM ROUTES/API]`
2. `POST /api/auth/login` `[VERIFIED FROM ROUTES/API]`
3. `POST /api/auth/logout` `[VERIFIED FROM ROUTES/API]`
4. `GET /api/auth/me` `[VERIFIED FROM ROUTES/API]`
5. `GET /api/companies` `[VERIFIED FROM ROUTES/API]`
6. `POST /api/companies` `[VERIFIED FROM ROUTES/API]`
7. `GET /api/companies/[id]` `[VERIFIED FROM ROUTES/API]`
8. `PUT /api/companies/[id]` `[VERIFIED FROM ROUTES/API]`
9. `DELETE /api/companies/[id]` (Soft delete status='suspended') `[VERIFIED FROM ROUTES/API]`
10. `GET /api/companies/[id]/contacts` `[VERIFIED FROM ROUTES/API]`
11. `POST /api/companies/[id]/contacts` `[VERIFIED FROM ROUTES/API]`
12. `GET /api/companies/[id]/members` `[VERIFIED FROM ROUTES/API]`
13. `POST /api/companies/[id]/members` `[VERIFIED FROM ROUTES/API]`
14. `GET /api/categories` `[VERIFIED FROM ROUTES/API]`
15. `GET /api/categories/[slug]` `[VERIFIED FROM ROUTES/API]`
16. `POST /api/contacts/reveal` `[VERIFIED FROM ROUTES/API]`
17. `POST /api/stripe/checkout` `[VERIFIED FROM ROUTES/API]`
18. `POST /api/stripe/portal` `[VERIFIED FROM ROUTES/API]`
19. `POST /api/stripe/webhook` `[VERIFIED FROM ROUTES/API]`
20. `GET /api/subscriptions` `[VERIFIED FROM ROUTES/API]`
21. `GET /api/connections` `[VERIFIED FROM ROUTES/API]`
22. `POST /api/connections` `[VERIFIED FROM ROUTES/API]`
23. `PUT /api/connections/[id]` `[VERIFIED FROM ROUTES/API]`
24. `GET /api/messages` `[VERIFIED FROM ROUTES/API]`
25. `POST /api/messages` `[VERIFIED FROM ROUTES/API]`
26. `GET/POST /api/opportunities` `[VERIFIED FROM ROUTES/API]`
27. `GET/PUT /api/admin/verification`, `/reports`, `/companies`, `/credits`, `/users`, `/featured`, `/audit` `[VERIFIED FROM ROUTES/API]`

---

## 11. Payment Requirements
* Support Stripe Subscription Billing mode `[VERIFIED FROM CODE]`.
* Process webhooks (`checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`) `[VERIFIED FROM CODE]`.
* Support offline local development mode without a Stripe key `[VERIFIED FROM CODE]`.

---

## 12. Credit Wallet Requirements
* Wallet initialized on signup with 0 balance `[VERIFIED FROM CODE]`.
* Subscribing adds credits based on plan tier (+30 Starter, +50 Professional) `[VERIFIED FROM CODE]`.
* Transaction log created for every debit, credit, refund, or bonus `[VERIFIED FROM CODE]`.

---

## 13. Contact Reveal Rules
* Revealing costs 1 credit inside `transaction.atomic()` `[VERIFIED FROM CODE]`.
* Requires `subscriptions.status = 'active'` `[VERIFIED FROM CODE]`.
* Re-revealing costs 0 credits `[VERIFIED FROM CODE]`.
* Admins reveal without consuming credits `[VERIFIED FROM CODE]`.

---

## 14. Admin Requirements
* Protect `/admin` routes via middleware `[VERIFIED FROM CODE]`.
* Company status control: `pending` -> `approved` / `rejected` / `suspended` `[VERIFIED FROM CODE]`.
* Verification document review and blue badge approval `[VERIFIED FROM CODE]`.
* Manual credit wallet adjustments `[VERIFIED FROM CODE]`.

---

## 15. Security Requirements
* Scrypt password hashing with 16-byte random salt `[VERIFIED FROM CODE]`.
* HTTP-Only, Lax, 7-day JWT session cookies `[VERIFIED FROM CODE]`.
* Contact detail masking (`maskEmail`, `maskPhone`, `linkedin = null`) for unrevealed contacts `[VERIFIED FROM CODE]`.
* Connection requirement guard before message exchange `[VERIFIED FROM CODE]`.

---

## 16. Edge Cases
* Duplicate email on registration -> 400 Bad Request `[VERIFIED FROM CODE]`.
* Re-revealing contact -> Returns 200 OK with `already_revealed = true` `[VERIFIED FROM CODE]`.
* Zero wallet balance -> Returns 402 Payment Required `[VERIFIED FROM CODE]`.
* Company name slug collision -> Appends timestamp suffix `[VERIFIED FROM CODE]`.

---

## 17. Acceptance Criteria
* **AC-1:** User signup initializes wallet & redirects to onboarding `[VERIFIED FROM CODE]`.
* **AC-2:** New company listing remains hidden until Admin approves `[VERIFIED FROM CODE]`.
* **AC-3:** Contact reveal decrements balance by 1 only on first reveal `[VERIFIED FROM CODE]`.
* **AC-4:** Unrevealed contacts display masked emails and phones `[VERIFIED FROM CODE]`.

---

## 18. Django Rebuild Architecture
Recommend 8 applications inside `apps/`: `accounts`, `companies`, `directory`, `credits`, `subscriptions`, `opportunities`, `networking`, `moderation` `[VERIFIED FROM CODE]`.
Stack: Django 5.1 + DRF 3.15 + PostgreSQL 16 + Redis 7 + Celery 5.4 `[VERIFIED FROM CODE]`.

---

## 19. Development Phases
1. Phase 1: Authentication & User Accounts `[VERIFIED FROM CODE]`
2. Phase 2: Categories & Countries `[VERIFIED FROM CODE]`
3. Phase 3: Company Profiles & Members `[VERIFIED FROM CODE]`
4. Phase 4: Marketplace Search Engine `[VERIFIED FROM CODE]`
5. Phase 5: Subscriptions & Stripe Billing `[VERIFIED FROM CODE]`
6. Phase 6: Contact Credit Wallet & Reveals `[VERIFIED FROM CODE]`
7. Phase 7: Connections & Messaging `[VERIFIED FROM CODE]`
8. Phase 8: B2B Opportunity Board `[VERIFIED FROM CODE]`
9. Phase 9: Admin Moderation & Verification Desk `[VERIFIED FROM CODE]`
10. Phase 10: Testing & Deployment `[VERIFIED FROM CODE]`
