# 11 — Screen & Page Inventory Documentation

This document contains a comprehensive inventory of all 30 screens and pages in the **iGaming Connect** application.

---

## 1. Public Pages (`(public)`)

### P-01: Public Landing Page
* **Route:** `/`
* **Purpose:** Introduce iGaming Connect, showcase statistics, highlight featured companies, category quick-links, and value proposition.
* **Accessible Roles:** Anyone (Public).
* **Components:** Hero Banner, Category Grid, Featured Companies Carousel, Subscription Plan Overview, CTA Footer.
* **API Dependencies:** `GET /api/companies?sort=featured&limit=6`, `GET /api/categories`.

---

### P-02: Public Marketplace Directory
* **Route:** `/marketplace`
* **Purpose:** Core search interface for browsing, filtering, and discovering gaming companies.
* **Accessible Roles:** Anyone.
* **Components:** Search Bar, Category Sidebar, Country Filter, Verification Toggle, Company Card Grid, Contact Reveal Modal, Pagination Controls.
* **Actions:** Search keyword, toggle category filter, open contact reveal modal, bookmark company.
* **API Dependencies:** `GET /api/companies`, `POST /api/contacts/reveal`.

---

### P-03: Public Pricing Page
* **Route:** `/pricing`
* **Purpose:** Display subscription tiers (Starter, Professional, Enterprise) and credit allocations.
* **Accessible Roles:** Anyone.
* **Components:** Tier Toggle (Monthly/Annual), Plan Feature Comparison Table, FAQ Accordion, Subscribe CTAs.
* **Actions:** Click "Subscribe" -> Triggers Stripe Checkout redirect.
* **API Dependencies:** `POST /api/stripe/checkout`.

---

### P-04: Public Company Detail Page
* **Route:** `/company/[slug]`
* **Purpose:** Full showcase profile for a specific company.
* **Accessible Roles:** Anyone.
* **Components:** Header Hero (Logo, Name, Country, Verification Badge), About Section, Regulatory Licenses List, Products & Services Showcase, Key Contacts Section, Save Button.
* **API Dependencies:** `GET /api/companies/[slug]`, `POST /api/contacts/reveal`.

---

### P-05: Category Filter Page
* **Route:** `/category/[slug]`
* **Purpose:** Filtered directory view for a specific category (e.g. Sportsbook, Casino, Licensing).
* **Accessible Roles:** Anyone.

---

## 2. Authentication Pages (`(auth)`)

### P-06: User Registration Page
* **Route:** `/register`
* **Purpose:** B2B user onboarding form.
* **Form Fields:** Full Name, Email, Password, Role.
* **API Dependencies:** `POST /api/auth/register`.

---

### P-07: User Login Page
* **Route:** `/login`
* **Purpose:** Authentication credential submission page.
* **Form Fields:** Email, Password, "Remember Me" toggle.
* **API Dependencies:** `POST /api/auth/login`.

---

## 3. User Dashboard Pages (`(dashboard)/app`)

### P-08: User Dashboard Overview
* **Route:** `/app`
* **Purpose:** Central hub for logged-in users. Displays quick stats (Wallet Balance, Saved Companies, Connections, Active RFPs).
* **API Dependencies:** `GET /api/auth/me`, `GET /api/companies/my-company`.

---

### P-09: Create Company Page
* **Route:** `/app/company`
* **Purpose:** Form to register a new company listing.
* **Form Fields:** Name, Description, Website, Founded Year, Country, Employee Count, Revenue Range, Category selection.
* **API Dependencies:** `POST /api/companies`.

---

### P-10: Edit Company Profile
* **Route:** `/app/company-profile`
* **Purpose:** Management suite for Company Owners. Edit profile details, add contacts, manage licenses, and submit verification documents.
* **API Dependencies:** `PUT /api/companies/[id]`, `POST /api/companies/[id]/contacts`, `POST /api/admin/verification`.

---

### P-11: B2B Opportunity Board Page
* **Route:** `/app/opportunities`
* **Purpose:** View and post B2B RFPs and partnership requests.
* **Form Fields:** Title, Description, Type, Budget, Timeline.
* **API Dependencies:** `GET/POST /api/opportunities`.

---

### P-12: User Connections Page
* **Route:** `/app/connections`
* **Purpose:** Manage professional connections and incoming/outgoing invitations.
* **API Dependencies:** `GET/POST /api/connections`, `PUT /api/connections/[id]`.

---

### P-13: Direct Messaging Interface
* **Route:** `/app/messages`
* **Purpose:** Real-time 1-on-1 messaging interface between connected users.
* **API Dependencies:** `GET/POST /api/messages`.

---

### P-14: Unlocked Contacts Archive
* **Route:** `/app/contacts`
* **Purpose:** List of all company decision-maker contacts previously revealed by the user.

---

### P-15: Subscription & Wallet Dashboard
* **Route:** `/app/subscription`
* **Purpose:** Manage active subscription plan, check wallet credit balance, view transaction ledger, open Stripe portal.
* **API Dependencies:** `POST /api/stripe/portal`, `GET /api/subscriptions`.

---

## 4. Admin Panel Pages (`(admin)/admin`)

### P-16: Admin Overview Dashboard
* **Route:** `/admin`
* **Purpose:** Executive platform metrics (Total Users, Total Companies, Pending Approvals, Total Credit Reveals, Monthly Revenue).

---

### P-17: Admin Company Approvals
* **Route:** `/admin/companies`
* **Purpose:** Moderation panel to approve, reject, feature, or suspend company listings.
* **API Dependencies:** `GET/PUT /api/admin/companies`.

---

### P-18: Admin Verification Desk
* **Route:** `/admin/verification`
* **Purpose:** Review uploaded verification documents and grant blue Verified Badges.
* **API Dependencies:** `POST /api/admin/verification`.

---

### P-19: Admin User Management
* **Route:** `/admin/users`
* **Purpose:** User management desk to change roles, view activity, or adjust credit wallet balances manually.
* **API Dependencies:** `GET/PUT /api/admin/users`, `POST /api/admin/credits`.

---

### P-20: Admin Audit Logs
* **Route:** `/admin/audit-log`
* **Purpose:** Security log viewer displaying user IP addresses, actions, and metadata.
* **API Dependencies:** `GET /api/admin/audit`.
