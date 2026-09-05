# 02 — User Roles & Permissions Documentation

## 1. Discovered System Roles
The system implements a dual-layer Role-Based Access Control (RBAC) architecture:
1. **Global System Roles** (stored on `users.role` table):
   * `super_admin`: Complete platform oversight, revenue management, credit adjustment, system configuration.
   * `admin`: Operational administrator managing approvals, verifications, and content moderation.
   * `moderator`: Content reviewer for reports, listings, and flagged messages.
   * `company_owner`: User who created or owns a verified company listing.
   * `company_member`: User associated with an existing company profile.
   * `professional`: Default role upon registration (individual user or buyer/seller).

2. **Company Organization Roles** (stored on `company_members.role` table):
   * `owner`: Primary owner of the company listing, full edit/delete & team management rights.
   * `admin`: Delegate company administrator, can update company details and team contacts.
   * `member`: Standard company employee with read-only access to company dashboard metrics.

---

## 2. Detailed Role Definitions

### 2.1 Super Admin (`super_admin`)
* **Purpose:** Executive platform administrator with unrestricted privileges across the system.
* **Dashboard Access:** `/admin` (Full Admin Suite).
* **Pages Accessible:** All public routes, all dashboard routes (`/app/*`), all admin routes (`/admin/*`).
* **Features Accessible:** User management, credit manual grant/revoke, company status override (`approved`, `rejected`, `suspended`), verification approvals, category management, featured listing overrides, financial analytics, audit logs.
* **Actions Allowed:** Create/Edit/Delete any resource, change user roles, adjust credit balances, execute database seed/reset actions.
* **Actions NOT Allowed:** None.
* **API Permissions:** Unrestricted access to `/api/admin/*`, `/api/*`.

---

### 2.2 Admin (`admin`)
* **Purpose:** Day-to-day platform manager handling user support and company moderation.
* **Dashboard Access:** `/admin`.
* **Pages Accessible:** All public routes, `/app/*`, `/admin/companies`, `/admin/users`, `/admin/verification`, `/admin/reports`, `/admin/categories`, `/admin/contact-reveals`.
* **Features Accessible:** Review pending companies, review verification requests, process user/company reports, edit category icons, view contact reveal transaction history.
* **Actions Allowed:** Approve/Reject/Suspend companies, approve/reject verification requests, resolve content reports, edit public category definitions.
* **Actions NOT Allowed:** Modify super admin accounts, purge audit logs, alter global platform billing configuration.
* **API Permissions:** Access to `/api/admin/*` endpoints (excluding super-admin sensitive operations).

---

### 2.3 Moderator (`moderator`)
* **Purpose:** Community safety and content reviewer.
* **Dashboard Access:** `/admin/reports`, `/admin/companies`.
* **Pages Accessible:** All public routes, `/app/*`, `/admin/reports`, `/admin/companies`.
* **Features Accessible:** Read company listings, inspect flagged messages/reports, toggle report status (`pending`, `reviewed`, `resolved`, `dismissed`).
* **Actions Allowed:** Mark reports as reviewed/resolved, issue warning notifications to users.
* **Actions NOT Allowed:** Approve company verifications, adjust user credit balances, delete users.
* **API Permissions:** Restricted to `/api/admin/reports` GET/PUT and `/api/admin/companies` GET.

---

### 2.4 Company Owner (`company_owner`)
* **Purpose:** Primary business representative managing their organization's listing.
* **Dashboard Access:** `/app`.
* **Pages Accessible:** All public routes, `/app`, `/app/company`, `/app/company-profile`, `/app/marketplace`, `/app/opportunities`, `/app/connections`, `/app/messages`, `/app/billing`, `/app/subscription`, `/app/contacts`, `/app/saved`.
* **Features Accessible:** Edit company profile, manage team members/contacts, post B2B opportunities, request verification, buy subscriptions, reveal contacts.
* **Actions Allowed:** Update company logo/details, add/remove company contacts & licenses, invite team members, manage billing & subscription plans, reveal competitor/partner contacts using wallet credits.
* **Actions NOT Allowed:** Access `/admin/*` routes, auto-approve own verification requests, modify other companies' data.
* **API Permissions:** Full CRUD on owned `/api/companies/[id]`, `/api/companies/[id]/contacts`, `/api/companies/[id]/members`.

---

### 2.5 Company Member (`company_member`)
* **Purpose:** Staff member associated with a company profile.
* **Dashboard Access:** `/app`.
* **Pages Accessible:** All public routes, `/app`, `/app/company-profile`, `/app/marketplace`, `/app/opportunities`, `/app/connections`, `/app/messages`, `/app/subscription`, `/app/contacts`.
* **Features Accessible:** View company profile details, post B2B opportunities under company name, utilize shared/personal credit wallet, message connected professionals.
* **Actions Allowed:** View internal company contacts, initiate connection requests, send messages, reveal contacts using available credits.
* **Actions NOT Allowed:** Change company owner, delete company profile, alter billing payment method.
* **API Permissions:** GET/POST on opportunities, connections, messages, reveals; GET on company profile.

---

### 2.6 Professional (`professional`)
* **Purpose:** Default individual user account (buyer, seller, independent consultant).
* **Dashboard Access:** `/app`.
* **Pages Accessible:** All public routes, `/app`, `/app/company` (to create new company), `/app/marketplace`, `/app/opportunities`, `/app/connections`, `/app/messages`, `/app/subscription`, `/app/billing`, `/app/contacts`, `/app/saved`, `/app/settings`.
* **Features Accessible:** Register new company, buy subscription plans, search marketplace, reveal contacts, connect with users, save search queries, post opportunities.
* **Actions Allowed:** Initiate subscription checkout, deduct wallet credits for reveals, edit own user profile (`full_name`, `avatar_url`), create a new company profile.
* **Actions NOT Allowed:** Access `/admin/*`, manage non-owned companies.
* **API Permissions:** Standard user permissions (`/api/companies` POST, `/api/contacts/reveal` POST, `/api/connections` POST, `/api/messages` POST, `/api/opportunities` POST).

---

## 3. Comprehensive Role Permission Matrix

| Feature / Action | Super Admin | Admin | Moderator | Company Owner | Company Member | Professional | Guest / Anonymous |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Browse Directory & Marketplace** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **View Free Company Overview** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **View Unlocked Contacts** | ✅ | ✅ | ✅ | ✅ (If Revealed) | ✅ (If Revealed) | ✅ (If Revealed) | ❌ |
| **Reveal Contact (Consume Credit)** | ✅ (Free) | ✅ (Free) | ❌ | ✅ (Consumes 1 Cr) | ✅ (Consumes 1 Cr) | ✅ (Consumes 1 Cr) | ❌ |
| **Register & Create Account** | N/A | N/A | N/A | N/A | N/A | ✅ | ✅ |
| **Create Company Listing** | ✅ | ✅ | ❌ | ✅ | ❌ | ✅ | ❌ |
| **Edit Owned Company Details** | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| **Approve / Reject Company Status**| ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Request Verification Badge** | N/A | N/A | N/A | ✅ | ❌ | ❌ | ❌ |
| **Approve Verification Request** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Post B2B Opportunity** | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ❌ |
| **Send Connection Request** | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ❌ |
| **Send 1-on-1 Direct Message** | ✅ | ✅ | ❌ | ✅ (If Connected) | ✅ (If Connected) | ✅ (If Connected) | ❌ |
| **Subscribe to Paid Plan (Stripe)**| N/A | N/A | N/A | ✅ | ✅ | ✅ | ❌ |
| **Manage Credit Balances (Admin)**| ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Access Admin Panel (`/admin`)** | ✅ | ✅ | ✅ (Partial) | ❌ | ❌ | ❌ | ❌ |
| **View Platform Audit Logs** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

---

## 4. Special Business Rules & Authorization Middleware
1. **Admin Middleware Guard (`src/middleware.ts`):**
   * Any URL starting with `/admin` is intercepted. If `user.role` is NOT in `['super_admin', 'admin', 'moderator']`, the server responds with an immediate HTTP 307 Redirect to `/app`.
2. **Contact Reveal Active Subscription Guard (`/api/contacts/reveal`):**
   * Contact reveal requires an active subscription record (`status = 'active'`) on the `subscriptions` table. If no active subscription exists, request returns HTTP 403 Forbidden.
   * `super_admin` and `admin` bypass the credit balance deduction logic.
3. **Company Ownership Immutability & Member Promotion:**
   * When a `professional` creates a company, the system automatically inserts a record into `company_members` with `role = 'owner'` and updates `users.role = 'company_owner'` and `users.company_id = <new_company_id>`.
