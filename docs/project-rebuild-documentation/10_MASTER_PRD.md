# 10 — Master Product Requirements Document (PRD)

# iGaming Connect — Master PRD

---

## 1. Executive Summary
**iGaming Connect** is a B2B Marketplace and Verified Business Directory specifically designed for the global online gaming, casino, sportsbook, and regulatory ecosystem. The platform enables B2B stakeholders—including gaming operators, software platform providers, game aggregators, payment gateways, and compliance labs—to discover validated vendors, verify regulatory licenses, unlock direct decision-maker contact details via a credit wallet model, and execute B2B partnerships.

---

## 2. Product Overview
* **Product Name:** iGaming Connect
* **Industry Vertical:** iGaming, Sports Betting, Online Casino, FinTech/Payments, Regulatory Compliance.
* **Core Value Proposition:** Solves fragmented vendor discovery, opaque regulatory compliance, and unverified decision-maker contacts in the iGaming ecosystem.
* **Monetization Engine:** Tiered subscriptions (Starter $299/mo, Professional $499/mo, Enterprise Custom) combined with a credit-based wallet for unlocking verified executive contacts.

---

## 3. Target Users
1. **iGaming Operators:** Online sportsbooks, casinos, lottery, and retail operators seeking platform software, game studios, or payment gateways.
2. **Platform & Software Providers:** B2B providers selling PAM (Player Account Management), sportsbook software, or white-label platforms.
3. **Game Studios & Aggregators:** Slot developers, live dealer studios, and content aggregators selling game content feeds.
4. **Payment Service Providers (PSPs):** Merchant account providers, localization payment gateways, and crypto processors.
5. **Compliance Labs & Advisors:** Testing agencies (GLI, iTech Labs), legal advisors, and KYC/AML solution providers.
6. **B2B iGaming Professionals:** Sales executives, business development heads, CTOs, and founders.

---

## 4. User Roles & Access Control
* **Super Admin:** Complete oversight over platform settings, revenue, user management, credit grants, and database operations.
* **Admin:** Operational administrator managing company approvals, verification requests, category management, and report moderation.
* **Moderator:** Content reviewer processing flagged messages, listings, and user reports.
* **Company Owner:** Primary organization representative with full edit/delete rights over company profile, team contacts, and billing.
* **Company Member:** Staff member associated with a company profile, authorized to view metrics and post opportunities.
* **Professional:** Default registered user (buyer, seller, or consultant) with access to marketplace search, contact reveals, and networking.

---

## 5. Feature Breakdown

### 5.1 Marketplace & Search
* **Faceted Search:** Search by name/description keywords, category taxonomy, country/jurisdiction, market region, and verified status.
* **Sorting & Pagination:** Sort by newest, name, or featured listing priority. Default page size: 12 items.
* **Bookmarks & Saved Searches:** Users save target companies with custom notes or save search query filters for alerts.

### 5.2 Company Profiles & Verification
* **Rich Profiles:** Showcase overview, logo, founded year, employee count, technology stack, products/services, and active licenses.
* **Verification Badging:** Companies upload regulatory licenses/certificates to earn a "Verified" badge reviewed by Admins.

### 5.3 Contact Reveals & Credit Wallet
* **Credit Wallet:** Every user possesses a wallet tracking credit balance, total earned, and total used.
* **Contact Reveal:** Unlocking an executive contact (email, phone, LinkedIn) costs 1 credit. Duplicate reveals cost 0 credits.
* **Subscription Allocation:** Starter Plan (+30 credits/mo), Professional Plan (+50 credits/mo).

### 5.4 Opportunities & RFPs
* **B2B Opportunity Board:** Post RFPs under types (`looking_for`, `offering`, `partnership`) with budget and timeline criteria.

### 5.5 Networking & Messaging
* **Connections:** Request professional connection (`pending`, `accepted`, `rejected`, `blocked`).
* **1-on-1 Messaging:** Direct chat enabled exclusively between connected users.

### 5.6 Subscriptions & Billing
* **Stripe Integration:** Supports Stripe Checkout for subscriptions, Stripe Customer Portal for billing management, and Webhooks for provisioning. Includes an offline local dev fallback.

---

## 6. Functional Requirements
* **FR-001:** Registration must automatically provision an empty credit wallet for the user.
* **FR-002:** User passwords must be hashed using Scrypt with salt before database storage.
* **FR-003:** Contact reveals must execute inside an atomic database transaction (`transaction.atomic()`).
* **FR-004:** Public marketplace queries must strictly filter for `status = 'approved'`.
* **FR-005:** Direct messages can only be sent if an accepted connection exists between sender and receiver.

---

## 7. Non-Functional Requirements
* **Performance:** Directory search query response time < 200ms for 100,000 company records.
* **Security:** JWT session cookies must be `HttpOnly`, `SameSite=Lax`, and `Secure` in production.
* **Scalability:** Statistically scalable Django REST Framework API with stateless JWT session validation.
* **Data Integrity:** Database foreign keys must enforce `ON DELETE CASCADE` for company child entities.

---

## 8. Key Business Rules Summary
1. Unlocking contact details requires an active subscription (`subscriptions.status = 'active'`) and `balance > 0`.
2. Revealing an already unlocked contact by the same user does not deduct credits.
3. Creating a company promotes a user from `professional` to `company_owner`.
4. New company listings require Admin approval before appearing in public searches.

---

## 9. Security & Compliance Requirements
* OWASP Top 10 compliance: SQL injection protection via ORM parameterized queries, XSS protection via sanitized inputs, CSRF protection on forms.
* Rate limiting on authentication endpoints (`5 attempts/minute`) to prevent brute-force attacks.
* Audit logging of sensitive admin operations (status changes, credit grants, document approvals).

---

## 10. Acceptance Criteria
* **AC-1:** User registers -> Wallet initialized -> Can log in and receive JWT token.
* **AC-2:** User creates company -> Status set to `pending` -> Admin approves -> Appears on `/marketplace`.
* **AC-3:** User subscribes to Professional Plan -> Receives +50 credits -> Reveals contact -> Balance decrements to 49.
* **AC-4:** User re-opens same contact -> Balance stays at 49 -> Returns contact info.
