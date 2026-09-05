# 03 — Complete Feature Inventory Documentation

This document contains the exhaustive functional specifications for every feature in **iGaming Connect**.

---

## 1. Authentication & Session Management

### F-001: User Registration
* **Purpose:** Allows new B2B users to register an account on the platform.
* **Who Can Use It:** Guests / Unauthenticated Users.
* **Entry Point / Page:** `/register`
* **Inputs:** `email` (string, required, valid email format), `password` (string, required, min 6 characters), `full_name` (string, required, min 2 characters), `role` (optional, default: `'professional'`).
* **Outputs:** Auth session cookie (`igc-session`), HTTP 201 Created response, automatic redirect to `/app`.
* **Business Logic:**
  1. Validates input schema via Zod (`registerSchema`).
  2. Checks for existing user record by `email` (case-insensitive). If found, returns HTTP 400 (`"Email already registered"`).
  3. Generates 16-byte random salt and derives 64-byte password hash using Node `crypto.scryptSync`.
  4. Inserts new `users` record with generated UUID v4.
  5. Automatically provisions a `contact_credit_wallets` record with `balance = 0`, `total_earned = 0`, `total_used = 0`.
  6. Issues JWT signed with HS256 algorithm containing `{ id, email, full_name, role }` stored in an HTTP-only, Lax, 7-day cookie named `igc-session`.
* **Validation Rules:** Email must be unique. Password length >= 6. Full name cannot be empty.
* **Database Impact:** `INSERT INTO users`, `INSERT INTO contact_credit_wallets`.
* **API Interaction:** `POST /api/auth/register`
* **Edge / Error Cases:** Duplicate email -> 400 Bad Request; Database error -> 500.

---

### F-002: User Login
* **Purpose:** Authenticates existing users and establishes a session.
* **Who Can Use It:** Guests.
* **Entry Point / Page:** `/login`
* **Inputs:** `email` (string, required), `password` (string, required).
* **Outputs:** Session cookie (`igc-session`), redirect to `/app` (or requested redirect URL).
* **Business Logic:**
  1. Fetches user record from `users` table by `email`.
  2. If user does not exist or `password_hash` is null, returns HTTP 401 (`"Invalid email or password"`).
  3. Re-computes scrypt hash using stored salt and compares with stored hash in constant time.
  4. On successful match, creates JWT payload containing user metadata and sets `igc-session` HTTP-only cookie.
* **Database Impact:** `SELECT FROM users`.
* **API Interaction:** `POST /api/auth/login`

---

### F-003: User Logout & Session Retrieval
* **Purpose:** Destroys user session cookie or retrieves active logged-in user profile.
* **Who Can Use It:** Authenticated Users.
* **Entry Point:** Header Logout button / Page load session check.
* **API Interaction:** `POST /api/auth/logout` (Clears cookie `igc-session` with maxAge=0), `GET /api/auth/me` (Returns decoded user token + current wallet balance).

---

## 2. Company & Directory Management

### F-004: Create Company Profile
* **Purpose:** Registers a new company listing in the directory.
* **Who Can Use It:** Authenticated users without an existing company (`professional`).
* **Entry Point:** `/app/company`
* **Inputs:** `name` (required), `description` (required), `website` (optional), `founded_year` (optional int), `headquarters` (optional), `country_id` (optional FK), `market` (optional), `employee_count` (optional enum), `revenue_range` (optional), `category_ids` (array of category UUIDs), `product_ids` (optional array), `service_ids` (optional array).
* **Business Logic:**
  1. Validates inputs via Zod (`companySchema`).
  2. Generates slug from company name using `slugify(name)`. If slug collision occurs, appends Unix timestamp (`slug-${Date.now()}`).
  3. Inserts `companies` record with `status = 'pending'`, `verification_status = 'unverified'`, `is_verified = 0`, `is_featured = 0`.
  4. Populates junction tables `company_categories`, `company_products`, `company_services`.
  5. Inserts `company_members` record linking user to company with `role = 'owner'`.
  6. Updates user record: `users.company_id = company.id`, `users.role = 'company_owner'`.
* **Database Impact:** `INSERT INTO companies`, `company_categories`, `company_products`, `company_services`, `company_members`, `UPDATE users`.
* **API Interaction:** `POST /api/companies`

---

### F-005: Manage Company Contacts & Licenses
* **Purpose:** Add key team members, decision-makers, and regulatory licenses to a company profile.
* **Who Can Use It:** Company Owner, Company Admin, System Admin.
* **Inputs (Contacts):** `full_name`, `position`, `email`, `phone`, `linkedin`, `is_primary` (boolean).
* **Inputs (Licenses):** `license_name`, `jurisdiction` (e.g. MGA, UKGC, Curaçao), `license_number`, `status` (`'active'`, `'pending'`, `'expired'`).
* **API Interaction:** `POST/PUT/DELETE /api/companies/[id]/contacts`, `POST/PUT/DELETE /api/companies/[id]/licenses`.

---

### F-006: Company Verification Request
* **Purpose:** Submit regulatory & corporate documents to acquire "Verified Company" status.
* **Who Can Use It:** Company Owner.
* **Entry Point:** `/app/company-profile` (Verification Tab)
* **Inputs:** `documents` (JSON array of document URLs / certificates).
* **Business Logic:**
  1. Inserts record into `verification_requests` with `status = 'pending'`, `company_id`, `requested_by = user.id`.
  2. Updates `companies.verification_status = 'pending'`.
  3. Admin receives review item in `/admin/verification`.
* **API Interaction:** `POST /api/admin/verification` (Request/Review endpoints).

---

## 3. Contact Reveal & Credit System

### F-007: Reveal Contact (Credit Deduction)
* **Purpose:** Unlocks direct contact details (email, phone, LinkedIn) for key company executives.
* **Who Can Use It:** Authenticated users with an active subscription and credit balance > 0.
* **Entry Point:** Company Detail Modal / Marketplace Contact Card (`Unlock Contact` Button).
* **Inputs:** `contact_id` (UUID of target `company_contacts` record).
* **Business Logic (ACID Transaction):**
  1. Checks if contact was already revealed by this user (`SELECT FROM revealed_contacts WHERE user_id = ? AND company_contact_id = ?`).
     * If already revealed: Returns full contact data immediately without deducting credits (`already_revealed: true`).
  2. Verifies user has active subscription (`SELECT FROM subscriptions WHERE user_id = ? AND status = 'active'`).
     * If no active subscription: Returns HTTP 403 Forbidden.
  3. Checks wallet balance (`SELECT balance FROM contact_credit_wallets WHERE user_id = ?`).
     * If balance <= 0: Returns HTTP 402 Payment Required.
  4. Executes SQLite ACID Transaction:
     * Decrements balance: `balance = balance - 1`, increments `total_used = total_used + 1`.
     * Inserts audit log into `contact_credit_transactions` (`type = 'debit'`, `amount = 1`, `description = 'Contact reveal'`, `reference_id = contact_id`).
     * Inserts record into `revealed_contacts` (`user_id`, `company_contact_id`).
  5. Returns target contact's full details (email, phone, LinkedIn) and remaining credit balance.
* **API Interaction:** `POST /api/contacts/reveal`

---

## 4. Stripe Subscription & Billing Engine

### F-008: Subscription Checkout & Upgrade
* **Purpose:** Purchase or upgrade subscription plans (Starter, Professional, Enterprise) via Stripe.
* **Who Can Use It:** Authenticated Users.
* **Entry Point:** `/pricing` or `/app/subscription`
* **Inputs:** `plan_slug` (`'starter'`, `'professional'`, `'enterprise'`), `price_id` (Stripe Price ID).
* **Business Logic:**
  * **Production Mode (Live Stripe Key Present):** Initiates Stripe Checkout Session (`mode = 'subscription'`). On payment completion, Stripe Webhook `checkout.session.completed` or `customer.subscription.created` triggers backend provisioning.
  * **Offline Local Dev Mode (No Stripe Key):** Automatically updates user subscription status to `'active'`, calculates 30-day `current_period_end`, credits the user's wallet with plan allowance (+30 or +50 credits), and logs a bonus transaction.
* **API Interaction:** `POST /api/stripe/checkout`, `POST /api/stripe/portal`, `POST /api/stripe/webhook`

---

## 5. B2B Marketplace & Faceted Search

### F-009: Directory Search & Filtering
* **Purpose:** Filter gaming companies by category, location, jurisdiction, verification status, and keywords.
* **Who Can Use It:** Anyone (Public).
* **Entry Point:** `/marketplace`
* **Query Parameters:** `search` / `q`, `category` (slug or UUID), `categories` (comma-separated list), `country` (name), `market` (region string), `verified` (`'true'`), `page`, `limit` / `per_page`, `sort` (`'newest'`, `'oldest'`, `'name'`, `'featured'`).
* **Outputs:** Paginated list of approved companies with linked category tags, country name/code, and verification badges.
* **Business Logic:**
  * Enforces `status = 'approved'` for all non-admin public queries.
  * Uses SQL `LIKE` matching for search term against `name` and `description`.
  * Filters via `EXISTS` subqueries on `company_categories` junction table.
* **API Interaction:** `GET /api/companies`

---

## 6. Opportunities & Networking Module

### F-010: B2B Opportunity Posting
* **Purpose:** Broadcast RFPs, partnership requests, or service offerings to the iGaming community.
* **Who Can Use It:** Authenticated Users.
* **Entry Point:** `/app/opportunities`
* **Inputs:** `title`, `description`, `type` (`'looking_for'`, `'offering'`, `'partnership'`), `category_id`, `budget`, `timeline`, `status` (`'open'`, `'closed'`, `'filled'`).
* **API Interaction:** `GET /api/opportunities`, `POST /api/opportunities`

---

### F-011: User Connections & Direct Messaging
* **Purpose:** Request professional network connections and exchange direct messages.
* **Who Can Use It:** Authenticated Users.
* **Entry Point:** `/app/connections`, `/app/messages`
* **Business Logic:**
  * User A sends connection request to User B (`POST /api/connections`). Status is set to `'pending'`.
  * User B accepts connection (`PUT /api/connections/[id]`). Status changes to `'accepted'`.
  * Once connected, conversation thread is created in `conversations`. Users exchange messages stored in `messages`.
* **API Interaction:** `GET/POST /api/connections`, `PUT/DELETE /api/connections/[id]`, `GET/POST /api/messages`

---

## 7. Admin Moderation & Control Center

### F-012: Admin Company Moderation
* **Purpose:** Review, approve, reject, feature, or suspend company listings.
* **Who Can Use It:** Super Admin, Admin.
* **Entry Point:** `/admin/companies`, `/admin/featured`
* **Actions:** Change status from `'pending'` -> `'approved'` / `'rejected'` / `'suspended'`. Toggle `is_featured` boolean.
* **API Interaction:** `GET/PUT /api/admin/companies`, `POST /api/admin/featured`

---

### F-013: Admin Credit Wallet Manual Adjustment
* **Purpose:** Grant bonus credits or refund credits to a user wallet.
* **Who Can Use It:** Super Admin.
* **Entry Point:** `/admin/contact-reveals` or `/admin/users`
* **Inputs:** `user_id`, `amount` (integer), `type` (`'credit'`, `'bonus'`, `'refund'`), `description`.
* **API Interaction:** `POST /api/admin/credits`

---

### F-014: Platform Reports & Audit Logs
* **Purpose:** Review user flags/reports and monitor system security events.
* **Who Can Use It:** Super Admin, Admin, Moderator.
* **Entry Point:** `/admin/reports`, `/admin/audit-log`
* **API Interaction:** `GET/PUT /api/admin/reports`, `GET /api/admin/audit`
