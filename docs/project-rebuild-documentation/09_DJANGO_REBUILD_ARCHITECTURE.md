# 09 — Django Rebuild Architecture Recommendation

This document outlines the recommended technical architecture for rebuilding **iGaming Connect** using **Django 5.x**, **Django REST Framework (DRF)**, and **PostgreSQL**.

---

## 1. Modular Django App Design

We recommend partitioning the backend into 8 decoupled, domain-driven Django applications inside an `apps/` namespace:

```
config/                     # Django Project Settings & Root URLs
  ├── settings/
  │     ├── base.py
  │     ├── local.py
  │     └── production.py
  ├── urls.py
  └── wsgi.py / asgi.py

apps/
  ├── accounts/             # Custom User Model, Authentication & RBAC
  ├── companies/            # Company Profiles, Members, Contacts, Licenses
  ├── directory/            # Categories, Countries, Products, Services & Search
  ├── credits/              # Credit Wallets, Debit Transactions & Contact Reveals
  ├── subscriptions/        # Plans, Stripe Billing, Webhooks & Offline Fallback
  ├── opportunities/        # B2B RFPs & Lead Postings
  ├── networking/           # User Connections, Conversations & Messaging
  └── moderation/           # Verification Requests, Reports & Audit Logging
```

---

## 2. App-by-App Breakdown

### 2.1 `apps.accounts`
* **Responsibility:** Manages the custom user model (`AbstractUser` with UUID primary key), authentication endpoints, password hashing, user roles, and JWT session handling.
* **Models:** `User`
* **Main APIs:** `/api/v1/auth/register/`, `/api/v1/auth/login/`, `/api/v1/auth/logout/`, `/api/v1/auth/me/`
* **Permissions:** Custom DRF permissions (`IsSuperAdmin`, `IsAdmin`, `IsCompanyOwner`, `IsProfessional`).

---

### 2.2 `apps.companies`
* **Responsibility:** Handles company listings, team member associations, regulatory license certificates, and executive contacts directory.
* **Models:** `Company`, `CompanyLicense`, `CompanyContact`, `CompanyMember`
* **Main APIs:** `/api/v1/companies/`, `/api/v1/companies/<id>/contacts/`, `/api/v1/companies/<id>/members/`
* **Dependencies:** `directory`, `accounts`

---

### 2.3 `apps.directory`
* **Responsibility:** Manages tax/jurisdiction countries, industry category taxonomy, products/services catalog, faceted marketplace search, and saved user bookmarks.
* **Models:** `Category`, `Country`, `Product`, `Service`, `SavedCompany`, `SavedSearch`
* **Main APIs:** `/api/v1/categories/`, `/api/v1/countries/`, `/api/v1/marketplace/search/`, `/api/v1/saved-companies/`
* **Features:** Django PostgreSQL Full-Text Search (`SearchVector`, `SearchQuery`) for fast keyword querying across company names and descriptions.

---

### 2.4 `apps.credits`
* **Responsibility:** Manages contact reveal wallets, credit balances, transaction ledgers, and contact unlock permissions.
* **Models:** `ContactCreditWallet`, `ContactCreditTransaction`, `RevealedContact`
* **Main APIs:** `/api/v1/contacts/reveal/`, `/api/v1/credits/wallet/`, `/api/v1/credits/history/`
* **Key Implementation Pattern:** `transaction.atomic()` with `select_for_update()` on the `ContactCreditWallet` model to eliminate race conditions during simultaneous credit deductions.

---

### 2.5 `apps.subscriptions`
* **Responsibility:** Manages subscription plans, active user billing records, Stripe Checkout session generation, Stripe Customer Portal redirects, webhook event consumption, and local dev offline billing bypass.
* **Models:** `Plan`, `Subscription`
* **Main APIs:** `/api/v1/subscriptions/checkout/`, `/api/v1/subscriptions/portal/`, `/api/v1/subscriptions/webhook/`
* **Dependencies:** Stripe Python SDK (`stripe`).

---

### 2.6 `apps.opportunities`
* **Responsibility:** B2B bulletin board for project RFPs, partnership requests, and service offerings.
* **Models:** `Opportunity`
* **Main APIs:** `/api/v1/opportunities/`

---

### 2.7 `apps.networking`
* **Responsibility:** User connection requests (`pending`, `accepted`, `rejected`, `blocked`), conversation threads, and 1-on-1 direct messaging.
* **Models:** `Connection`, `Conversation`, `Message`, `Notification`
* **Main APIs:** `/api/v1/connections/`, `/api/v1/messages/`
* **Tech Option:** Django Channels + Redis WebSockets for real-time instant messaging.

---

### 2.8 `apps.moderation`
* **Responsibility:** Handles company verification document reviews, user content flags/reports, and global system audit logging.
* **Models:** `VerificationRequest`, `Report`, `AuditLog`
* **Main APIs:** `/api/v1/admin/verification/`, `/api/v1/admin/reports/`, `/api/v1/admin/audit-logs/`

---

## 3. Technology Stack & Library Recommendations

| Layer | Recommended Technology | Purpose |
| :--- | :--- | :--- |
| **Language** | Python 3.12+ | High performance, strict type annotations (`mypy`). |
| **Web Framework** | Django 5.1+ | Robust ORM, built-in admin, security defaults. |
| **REST API** | Django REST Framework 3.15+ | Serializers, Class-Based Views, ViewSets, FilterSets. |
| **Database** | PostgreSQL 16 | ACID transactions, JSONB, native UUIDs, full-text search. |
| **Auth Strategy** | `djangorestframework-simplejwt` | Custom JWT token authentication via HTTP-only cookies. |
| **Task Queue** | Celery 5.4 + Redis 7 | Asynchronous webhook processing, monthly credit refills. |
| **API Documentation** | `drf-spectacular` | Automatic OpenAPI 3.0 schema & Swagger UI generation. |
| **Payment Gateway** | `stripe` Python SDK | Subscription billing & checkout management. |
| **File Storage** | `django-storages` + S3 / R2 | Company logos, verification documents, avatars. |
