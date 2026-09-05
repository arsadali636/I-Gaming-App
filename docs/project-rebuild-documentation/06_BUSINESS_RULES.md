# 06 — Business Rules Extraction Documentation

This document contains all business rules extracted from the application codebase.

---

## Business Rule Catalog

### BR-001: Automatic Wallet Provisioning on Registration
* **Rule ID:** BR-001
* **Description:** Every new user registration must automatically initialize an associated credit wallet record with zero balance.
* **Module:** Authentication / Credit Wallet
* **Trigger:** Successful user account creation via `POST /api/auth/register`.
* **Conditions:** User insertion into `users` table succeeds.
* **Expected Result:** An entry in `contact_credit_wallets` is inserted with `user_id = user.id`, `balance = 0`, `total_earned = 0`, `total_used = 0`.
* **Exceptions:** None.

---

### BR-002: Password Encryption Standard
* **Rule ID:** BR-002
* **Description:** User passwords must never be stored in plain text; they must use Node.js `scryptSync` with a 16-byte random salt.
* **Module:** Authentication
* **Trigger:** User registration or password update.
* **Conditions:** Salt generated via `crypto.randomBytes(16)`. Key length set to 64 bytes.
* **Expected Result:** Stored string format is `${salt}:${hash}`.
* **Exceptions:** None.

---

### BR-003: Active Subscription Requirement for Contact Reveals
* **Rule ID:** BR-003
* **Description:** Unlocking contact details requires the requesting user to hold an active subscription.
* **Module:** Contact Credit Wallet
* **Trigger:** Executing `POST /api/contacts/reveal`.
* **Conditions:** `SELECT id FROM subscriptions WHERE user_id = ? AND status = 'active'`.
* **Expected Result:** If no active subscription record exists, the system halts execution and returns HTTP 403 Forbidden with `{ error: "Active subscription required to reveal contacts" }`.
* **Exceptions:** Super Admins and Admins bypass subscription checks.

---

### BR-004: Contact Reveal Credit Balance Deduction
* **Rule ID:** BR-004
* **Description:** Revealing a new contact costs exactly 1 credit from the user's wallet balance.
* **Module:** Contact Credit Wallet
* **Trigger:** Unlocking a contact that has not been previously revealed by the user.
* **Conditions:** `wallet.balance > 0`.
* **Expected Result:** Within a single ACID SQLite transaction: `balance` is decremented by 1, `total_used` is incremented by 1, a `debit` transaction is logged in `contact_credit_transactions`, and a link is created in `revealed_contacts`.
* **Exceptions:** If `balance <= 0`, system returns HTTP 402 Payment Required (`"Insufficient credits. Please top up your wallet."`).

---

### BR-005: Duplicate Contact Reveal Idempotency
* **Rule ID:** BR-005
* **Description:** Re-opening a contact that was already unlocked by the same user does not consume credits.
* **Module:** Contact Credit Wallet
* **Trigger:** `POST /api/contacts/reveal` with a `contact_id` already present in `revealed_contacts` for that `user_id`.
* **Conditions:** `SELECT id FROM revealed_contacts WHERE user_id = ? AND company_contact_id = ?`.
* **Expected Result:** System returns the contact details with `{ already_revealed: true }` and 0 credits deducted.
* **Exceptions:** None.

---

### BR-006: Admin Credit Reveal Bypass
* **Rule ID:** BR-006
* **Description:** Platform administrators have unrestricted access to all company contacts without deducting credits.
* **Module:** Contact Credit Wallet / Admin
* **Trigger:** Reveal request initiated by a user with `role IN ('super_admin', 'admin')`.
* **Conditions:** `user.role` check in session token.
* **Expected Result:** Contact info is returned immediately without wallet checks or transaction logging.
* **Exceptions:** None.

---

### BR-007: Company Creation Role Elevation & Owner Assignment
* **Rule ID:** BR-007
* **Description:** When a user registers a new company, their user role is updated to `company_owner` and they are granted owner privileges in `company_members`.
* **Module:** Company Directory
* **Trigger:** `POST /api/companies` form submission.
* **Conditions:** User does not already own a company.
* **Expected Result:** `UPDATE users SET company_id = ?, role = 'company_owner'`, and `INSERT INTO company_members (role = 'owner')`.
* **Exceptions:** System admins creating companies on behalf of users.

---

### BR-008: Default Pending Status for New Listings
* **Rule ID:** BR-008
* **Description:** New company listings must be reviewed and approved by an Admin before appearing in public searches.
* **Module:** Company Directory / Moderation
* **Trigger:** `POST /api/companies`.
* **Conditions:** Initial insertion.
* **Expected Result:** `companies.status` is set to `'pending'`. Company is hidden from `GET /api/companies` public queries until Admin updates status to `'approved'`.
* **Exceptions:** Admins creating companies are auto-approved.

---

### BR-009: Verified Badge Eligibility & Admin Review
* **Rule ID:** BR-009
* **Description:** The blue "Verified Badge" can only be conferred after document review by an Admin.
* **Module:** Verification & Compliance
* **Trigger:** Admin clicks "Approve Verification Request" in `/admin/verification`.
* **Conditions:** `verification_requests.status = 'pending'`.
* **Expected Result:** `companies.is_verified = 1`, `companies.verification_status = 'verified'`, `verification_requests.status = 'approved'`, `reviewed_by = admin.id`.
* **Exceptions:** None.

---

### BR-010: Public Directory Isolation
* **Rule ID:** BR-010
* **Description:** Public directory searches must strictly exclude pending, rejected, or suspended companies.
* **Module:** Marketplace & Search
* **Trigger:** `GET /api/companies` query from non-admin client.
* **Conditions:** Non-authenticated or standard user session.
* **Expected Result:** Query enforces `WHERE c.status = 'approved'`.
* **Exceptions:** Admin panel queries (`/api/admin/companies`) allow filtering across all statuses.

---

### BR-011: Slug Uniqueness Collision Handling
* **Rule ID:** BR-011
* **Description:** Company URL slugs must be unique across the platform.
* **Module:** Company Directory
* **Trigger:** Company creation or name edit.
* **Conditions:** `slugify(name)` matches an existing company slug in the database.
* **Expected Result:** System automatically appends current Unix timestamp to guarantee uniqueness (`${slug}-${Date.now()}`).
* **Exceptions:** None.

---

### BR-012: Messaging Restricted to Connections
* **Rule ID:** BR-012
* **Description:** Direct messages can only be sent between users who have an active, accepted connection.
* **Module:** Social & Messaging
* **Trigger:** Initiating chat or sending message (`POST /api/messages`).
* **Conditions:** `SELECT status FROM connections WHERE (requester_id = A AND receiver_id = B) OR (requester_id = B AND receiver_id = A)`. Status must equal `'accepted'`.
* **Expected Result:** Message is delivered and conversation thread updated. If not connected, system returns HTTP 403 Forbidden (`"Connection required to send messages"`).
* **Exceptions:** Admin users can message any user for support/moderation.

---

### BR-013: Admin Middleware Guard Enforcement
* **Rule ID:** BR-013
* **Description:** Access to administrative pages and APIs is restricted to authorized administrative roles.
* **Module:** Authentication / Middleware
* **Trigger:** Request to any URL starting with `/admin` or `/api/admin`.
* **Conditions:** Decoded JWT session check.
* **Expected Result:** If `user.role` is NOT in `['super_admin', 'admin', 'moderator']`, request is redirected to `/app` or returns HTTP 403.
* **Exceptions:** None.

---

### BR-014: Monthly Subscription Credit Allowance Allocation
* **Rule ID:** BR-014
* **Description:** Subscribing to a paid plan grants a monthly contact reveal credit quota.
* **Module:** Billing & Subscriptions
* **Trigger:** Subscription activation or monthly renewal event.
* **Conditions:** Starter Plan grants 30 credits; Professional Plan grants 50 credits; Enterprise Plan grants unlimited (-1 or custom quota).
* **Expected Result:** Credit balance is updated in `contact_credit_wallets`, and a `credit` transaction is logged.
* **Exceptions:** None.

---

### BR-015: Content Report Moderation Workflow
* **Rule ID:** BR-015
* **Description:** User reports regarding inappropriate content must progress through a structured moderation pipeline.
* **Module:** Admin & Moderation
* **Trigger:** `POST /api/admin/reports`.
* **Conditions:** Report targets a `'company'`, `'user'`, or `'message'`.
* **Expected Result:** Initial status is `'pending'`. Admin review updates status to `'reviewed'`, `'resolved'`, or `'dismissed'`.
* **Exceptions:** None.
