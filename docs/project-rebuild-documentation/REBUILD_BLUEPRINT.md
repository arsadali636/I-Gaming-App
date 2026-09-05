# Final Rebuild Blueprint — iGaming Connect (Django Stack)

This master blueprint provides step-by-step guidance for a software engineering team to rebuild **iGaming Connect** completely from scratch using **Django + Django REST Framework** and **PostgreSQL**.

---

## 1. What Needs to Be Rebuilt
The goal is to replace the current Node/Next.js/SQLite application with a decoupled architecture:
* **Backend:** Django 5.x + Django REST Framework + PostgreSQL 16 + Redis 7 + Celery 5.4.
* **Frontend:** Modern SPA (React / Next.js / Vue) communicating via RESTful JSON APIs.
* **Authentication:** Custom JWT-based authentication via HTTP-only cookies or Bearer headers.
* **Monetization:** Stripe Billing & Subscription Webhooks + Contact Reveal Credit Engine.

---

## 2. Recommended Phased Development Order

```
[Phase 1: Project Setup & Auth Core]
  └── Setup Django 5.1, PostgreSQL, Redis, custom User model, JWT auth & wallet auto-provisioning.
        │
        ▼
[Phase 2: Core Directory & Geography Taxonomies]
  └── Build Country, Category, Product, and Service catalog models & seed scripts.
        │
        ▼
[Phase 3: Company Profiles & Member RBAC]
  └── Implement Company, CompanyMember, CompanyContact, CompanyLicense models & CRUD APIs.
        │
        ▼
[Phase 4: Marketplace Search Engine]
  └── Build PostgreSQL Full-Text Search endpoints & faceted filter query builders.
        │
        ▼
[Phase 5: Subscriptions & Stripe Billing]
  └── Implement Plan & Subscription models, Stripe Checkout, Webhooks, and offline dev fallback mode.
        │
        ▼
[Phase 6: Contact Credit Wallet & ACID Reveals]
  └── Build atomic credit debit transaction views, wallet ledgers, and revealed contact tracking.
        │
        ▼
[Phase 7: Social Networking & Messaging]
  └── Implement Connection, Conversation, Message, and Notification modules.
        │
        ▼
[Phase 8: B2B Opportunities & RFPs]
  └── Implement Opportunity Board models and sourcing matching APIs.
        │
        ▼
[Phase 9: Admin Moderation Desk]
  └── Build Verification Request workflows, Report moderation APIs, and Audit logging views.
        │
        ▼
[Phase 10: End-to-End Testing & Production Deployment]
  └── Execute unit/integration test suites, configure Docker Compose, setup CI/CD pipelines.
```

---

## 3. Django Apps Structure
Create the following 8 Django applications inside `apps/`:
1. `apps.accounts`: User authentication, JWT sessions, custom User model, RBAC policies.
2. `apps.companies`: Company listings, members, contacts, licenses.
3. `apps.directory`: Categories, countries, products, services, search, saved items.
4. `apps.credits`: Contact reveal wallets, debit transactions, revealed contact archive.
5. `apps.subscriptions`: Subscription plans, Stripe integration, local billing mock.
6. `apps.opportunities`: B2B RFPs and lead posting engine.
7. `apps.networking`: User connections, direct messaging, system notifications.
8. `apps.moderation`: Verification reviews, report resolution, audit logging.

---

## 4. Database Migration Order
1. Migrate `accounts` (`User`).
2. Migrate `directory` (`Country`, `Category`, `Product`, `Service`).
3. Migrate `companies` (`Company`, `CompanyCategory`, `CompanyProduct`, `CompanyService`, `CompanyLicense`, `CompanyContact`, `CompanyMember`).
4. Migrate `credits` (`ContactCreditWallet`, `ContactCreditTransaction`, `RevealedContact`).
5. Migrate `subscriptions` (`Plan`, `Subscription`).
6. Migrate `opportunities` (`Opportunity`).
7. Migrate `networking` (`Connection`, `Conversation`, `Message`, `Notification`).
8. Migrate `moderation` (`VerificationRequest`, `Report`, `AuditLog`, `AnalyticsEvent`).

---

## 5. API Development Order
1. Auth APIs: `/api/v1/auth/register/`, `/login/`, `/me/`
2. Taxonomies: `/api/v1/categories/`, `/countries/`
3. Companies: `/api/v1/companies/` (GET list, POST create, GET detail, PUT update)
4. Contacts & Licenses: `/api/v1/companies/<id>/contacts/`, `/licenses/`
5. Marketplace Search: `/api/v1/marketplace/search/`
6. Subscriptions: `/api/v1/subscriptions/checkout/`, `/webhook/`
7. Contact Reveal: `/api/v1/contacts/reveal/` (Atomic Credit Debit)
8. Networking: `/api/v1/connections/`, `/messages/`
9. Admin: `/api/v1/admin/companies/`, `/verification/`, `/reports/`, `/credits/`

---

## 6. Authentication & Permission Setup
* **JWT Configuration:** Use `djangorestframework-simplejwt` with custom claims (`id`, `email`, `full_name`, `role`, `company_id`).
* **Middleware Guard:** Implement custom middleware or DRF permission classes (`IsSuperAdmin`, `IsAdmin`, `IsCompanyOwner`, `IsActiveSubscriber`).

---

## 7. Payment Setup
* **Stripe Webhooks:** Use Celery background workers to process asynchronous Stripe events (`checkout.session.completed`, `customer.subscription.created`, `customer.subscription.deleted`).
* **Offline Local Mode:** Provide an environment flag (`STRIPE_OFFLINE_DEV=True`) to allow full local subscription testing without a live Stripe key.

---

## 8. Testing Strategy
* **Unit Tests:** Test models, validations, and custom managers (`pytest-django`).
* **API Integration Tests:** Test endpoints, HTTP status codes, and authorization rules (`rest_framework.test.APITestCase`).
* **Transaction Safety Tests:** Test concurrent contact reveal requests to ensure no credit double-spending occurs (`select_for_update()`).

---

## 9. Production Deployment Requirements
* **WSGI / ASGI Server:** Gunicorn or Uvicorn behind Nginx reverse proxy.
* **Database:** Managed PostgreSQL instance (AWS RDS, DigitalOcean Managed Database) with automated backups.
* **Cache & Broker:** Redis instance for Celery task queuing and session caching.
* **Object Storage:** AWS S3 / Cloudflare R2 for storing logos, avatars, and verification documents via `django-storages`.
