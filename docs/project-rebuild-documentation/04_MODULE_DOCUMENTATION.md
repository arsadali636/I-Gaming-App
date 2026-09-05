# 04 — Module-Wise Documentation

This document breaks down the **10 Core Business Modules** of iGaming Connect.

---

## Module 1: Authentication & User Management

### 1. Purpose
Manages user onboarding, identity verification, session persistence, role assignment, password hashing, and user profile metadata.

### 2. Users
All Roles (Guests, Professionals, Company Owners, Admins, Super Admins).

### 3. Screens / Pages
* `/login` (User Login Page)
* `/register` (User Account Creation Page)
* `/app/settings` (User Account Settings & Security)

### 4. Actions
Register Account, Login, Logout, Update Profile (Name, Avatar), Change Password, Retrieve Current Session (`/api/auth/me`).

### 5. Business Rules
* Passwords must be hashed using Scrypt with a 16-byte random salt.
* Every newly registered user automatically gets an empty Credit Wallet (`balance = 0`).
* JWT session token expires in 7 days and is stored in an HTTP-Only cookie (`igc-session`).

### 6. Validation Rules
* `email`: Required, valid email format, unique in system.
* `password`: Required, minimum 6 characters.
* `full_name`: Required, minimum 2 characters.

### 7. Database Entities
`users`

### 8. Relationships
* `users` ──(1:1)──> `contact_credit_wallets`
* `users` ──(1:N)──> `subscriptions`
* `users` ──(N:1)──> `companies` (`company_id`)

### 9. APIs Involved
`POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`

### 10. Permissions
Public for login/register; Authenticated for logout/me.

### 11. Edge Cases
Logging in with incorrect password returns generic `"Invalid email or password"` to prevent user enumeration.

---

## Module 2: Company Directory & Profiles

### 1. Purpose
Stores, structures, and presents comprehensive iGaming business profiles, including company metadata, headquarters, employee count, revenue, regulatory licenses, key decision-maker contacts, and team members.

### 2. Users
Company Owners, Company Members, Professionals, Admins.

### 3. Screens / Pages
* `/company/[slug]` (Public Company Detail Page)
* `/app/company` (Create Company Form)
* `/app/company-profile` (Company Owner Dashboard Editor)
* `/app/contacts` (Internal Team Contact Manager)

### 4. Actions
Create Company, Update Company Profile, Add/Remove Key Contacts, Add/Remove Licenses, Invite Team Members.

### 5. Business Rules
* Creating a company automatically promotes the user to `company_owner` and assigns them as `owner` in `company_members`.
* New company listings are created in `status = 'pending'` and require Admin approval to appear in the public marketplace.
* Slugs must be URL-safe and unique. Clashing names receive a timestamp suffix (`slug-1725350000`).

### 6. Validation Rules
* `name`: Minimum 2 characters.
* `description`: Minimum 10 characters.
* `founded_year`: Integer between 1800 and current year.

### 7. Database Entities
`companies`, `company_categories`, `company_licenses`, `company_contacts`, `company_members`

### 8. Relationships
* `companies` ──(M:N)──> `categories` (via `company_categories`)
* `companies` ──(1:N)──> `company_licenses`
* `companies` ──(1:N)──> `company_contacts`
* `companies` ──(1:N)──> `company_members`

### 9. APIs Involved
`GET/POST /api/companies`, `GET/PUT/DELETE /api/companies/[id]`, `POST/DELETE /api/companies/[id]/contacts`, `POST/DELETE /api/companies/[id]/members`

### 10. Permissions
Public GET for approved companies; Company Owner/Admin for editing.

### 11. Edge Cases
Deleting a company cascades deletion to licenses, contacts, products, services, and member junctions (`ON DELETE CASCADE`).

---

## Module 3: Products & Services Catalog

### 1. Purpose
Allows companies to showcase their software solutions (e.g. PAM platforms, Sportsbook odds engines, Casino slot aggregators) and specialized services (e.g. Legal, KYC, Payments integration).

### 2. Users
Company Owners, Company Members, Marketplace Buyers.

### 3. Screens / Pages
* `/company/[slug]` (Products & Services Section)
* `/app/company-profile` (Catalog Management Tab)

### 4. Actions
Link Product/Service to Category, Assign Product to Company, Remove Product Association.

### 5. Database Entities
`products`, `services`, `company_products`, `company_services`

### 6. Relationships
* `products` ──(N:1)──> `categories`
* `services` ──(N:1)──> `categories`
* `companies` ──(M:N)──> `products` (via `company_products`)
* `companies` ──(M:N)──> `services` (via `company_services`)

---

## Module 4: Verification & Compliance

### 1. Purpose
Verifies the legitimacy of iGaming companies by validating business documentation and regulatory license certificates.

### 2. Users
Company Owners (Submitters), Admins/Super Admins (Reviewers).

### 3. Screens / Pages
* `/app/company-profile` (Verification Tab)
* `/admin/verification` (Admin Verification Desk)

### 4. Actions
Submit Verification Documents, Review Verification Request, Approve Request (Grants `is_verified = 1`), Reject Request with Review Notes.

### 5. Business Rules
* Companies with `is_verified = 1` display a blue "Verified" checkmark badge across all marketplace cards and detail pages.
* Approving a verification request automatically logs the reviewer ID and timestamp.

### 6. Database Entities
`verification_requests`, `companies`

### 7. APIs Involved
`POST /api/admin/verification`

---

## Module 5: Credit Wallet & Contact Reveals

### 1. Purpose
Monetizes decision-maker contact details through a wallet credit balance model.

### 2. Users
Professionals, Company Owners, Super Admins.

### 3. Screens / Pages
* `/marketplace` (Contact Reveal Modal)
* `/app/contacts` (Unlocked Contacts Archive)
* `/admin/contact-reveals` (Admin Credit Ledger)

### 4. Actions
Reveal Contact (Deducts 1 Credit), View Unlocked Contacts List, Manual Admin Credit Grant/Adjustment.

### 5. Business Rules
* User must have an active subscription (`subscriptions.status = 'active'`).
* Unlocking a contact costs 1 credit.
* Re-opening an already revealed contact by the same user costs 0 credits.
* Deductions are logged as debit transactions in `contact_credit_transactions`.

### 6. Database Entities
`contact_credit_wallets`, `contact_credit_transactions`, `revealed_contacts`

### 7. APIs Involved
`POST /api/contacts/reveal`, `POST /api/admin/credits`

---

## Module 6: Subscriptions & Billing Engine

### 1. Purpose
Handles user subscription plans, monthly credit allocations, Stripe Checkout sessions, billing portal redirects, and webhook events.

### 2. Users
All Authenticated Users.

### 3. Screens / Pages
* `/pricing` (Public Pricing Table)
* `/app/subscription` (Active Plan & Wallet Overview)
* `/app/billing` (Invoice & Payment Method Management)

### 4. Actions
Checkout Subscription, Open Stripe Portal, Handle Stripe Webhook Events (`customer.subscription.created`, `updated`, `deleted`).

### 5. Business Rules
* Starter Plan ($299/mo): 30 credits/month.
* Professional Plan ($499/mo): 50 credits/month.
* Enterprise Plan: Custom quota.
* Renewal automatically refills credits or increments balance based on plan configuration.

### 6. Database Entities
`plans`, `subscriptions`

### 7. APIs Involved
`POST /api/stripe/checkout`, `POST /api/stripe/portal`, `POST /api/stripe/webhook`, `GET /api/subscriptions`

---

## Module 7: Marketplace Search & Bookmarks

### 1. Purpose
Facilitates discovery through multi-parameter faceted search and allows users to save target companies or search criteria.

### 2. Users
All Users (Public and Authenticated).

### 3. Screens / Pages
* `/marketplace` (Main Search Page)
* `/app/saved` (Saved Companies & Searches Dashboard)

### 4. Actions
Execute Search, Apply Filters, Save Company with Personal Notes, Save Search Filter Query, Delete Saved Item.

### 5. Database Entities
`saved_companies`, `saved_searches`, `categories`, `countries`

### 6. APIs Involved
`GET /api/companies`, `GET/POST/DELETE /api/saved-companies` (Conceptual / Dashboard)

---

## Module 8: Opportunities & RFPs

### 1. Purpose
A B2B bulletin board where gaming operators and software providers post active requests for proposals (RFPs), partnership inquiries, or service offerings.

### 2. Users
Professionals, Company Owners, Company Members.

### 3. Screens / Pages
* `/app/opportunities` (B2B Opportunity Board)

### 4. Actions
Post Opportunity (`looking_for`, `offering`, `partnership`), Filter Opportunities, Update Status (`open`, `closed`, `filled`).

### 5. Database Entities
`opportunities`

### 6. APIs Involved
`GET /api/opportunities`, `POST /api/opportunities`

---

## Module 9: Social Connections & Messaging

### 1. Purpose
Enables peer-to-peer networking, connection requests, and real-time private messaging between iGaming professionals.

### 2. Users
Authenticated Users.

### 3. Screens / Pages
* `/app/connections` (My Network & Invitations)
* `/app/messages` (1-on-1 Chat Interface)

### 4. Actions
Send Connection Request, Accept/Reject Request, Block User, Create Conversation Thread, Send Message, Mark Messages Read.

### 5. Business Rules
* Messages can only be sent between users with an `'accepted'` connection status.

### 6. Database Entities
`connections`, `conversations`, `messages`, `notifications`

### 7. APIs Involved
`GET/POST /api/connections`, `PUT/DELETE /api/connections/[id]`, `GET/POST /api/messages`

---

## Module 10: Admin Control & Moderation

### 1. Purpose
Provides system administrators with tools for content moderation, platform audit trail analysis, company status management, category configuration, and reporting review.

### 2. Users
Super Admin, Admin, Moderator.

### 3. Screens / Pages
* `/admin` (Metrics Dashboard)
* `/admin/companies` (Company Approvals & Suspensions)
* `/admin/users` (User Management)
* `/admin/reports` (Content Flags)
* `/admin/categories` (Category Management)
* `/admin/audit-log` (Security Log Viewer)

### 4. Actions
Approve/Reject Company, Suspend Account, Review Document, Resolve Report, View Audit Logs, Edit Category.

### 5. Database Entities
`reports`, `audit_logs`, `analytics_events`

### 6. APIs Involved
`GET/PUT /api/admin/companies`, `GET/PUT /api/admin/users`, `GET/PUT /api/admin/reports`, `GET /api/admin/audit`
