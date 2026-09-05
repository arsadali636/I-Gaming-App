# DJANGO BUILD SEQUENCE — iGaming Connect

This guide outlines the strict step-by-step build order for constructing the **NEW Django 5.1+ backend** from scratch in a separate directory/repository.

---

## PHASE 0 — New Project Initialization & Directory Setup

- **Goal**: Initialize the new Django 5.1 project, set up Python 3.12 virtual environment, and construct clean domain application structure.
- **Commands**:
  ```bash
  mkdir igaming-connect-django && cd igaming-connect-django
  python3 -m venv venv
  source venv/bin/activate
  pip install django djangorestframework djangorestframework-simplejwt psycopg2-binary stripe django-cors-headers drf-spectacular redis celery pytest-django
  django-admin startproject config .
  mkdir -p apps
  ```
- **Django Apps to Initialize**:
  - `python manage.py startapp accounts apps/accounts`
  - `python manage.py startapp directory apps/directory`
  - `python manage.py startapp companies apps/companies`
  - `python manage.py startapp credits apps/credits`
  - `python manage.py startapp subscriptions apps/subscriptions`
  - `python manage.py startapp opportunities apps/opportunities`
  - `python manage.py startapp networking apps/networking`
  - `python manage.py startapp moderation apps/moderation`
- **Dependencies**: Python 3.12+, PostgreSQL 16 server, Redis 7 server.
- **Completion Criteria**: Clean Django project directory structure with 8 initialized domain apps under `apps/` and database connectivity configured in `config/settings.py`.

---

## PHASE 1 — Architecture, Database & Environment Configuration

- **Goal**: Configure PostgreSQL 16 settings, environment variables (`django-environ`), CORS, static/media files, and OpenAPI documentation (`drf-spectacular`).
- **Django Apps Involved**: `config`
- **Settings Configuration**:
  - Set `DATABASES` to PostgreSQL 16 instance.
  - Set `AUTH_USER_MODEL = 'accounts.User'`.
  - Configure `REST_FRAMEWORK` default authentication (`simplejwt`) and permission classes (`IsAuthenticated`).
  - Configure CORS allowed origins and `CORS_ALLOW_CREDENTIALS = True`.
- **Dependencies**: `psycopg2-binary`, `django-environ`, `drf-spectacular`.
- **Testing Checklist**:
  - Run `python manage.py check` -> 0 errors.
  - Test PostgreSQL connection via `python manage.py dbshell`.
- **Completion Criteria**: PostgreSQL database created and initialized with settings ready for initial migrations.

---

## PHASE 2 — Custom User Model & Authentication Architecture

- **Goal**: Implement the custom `User` model, JWT authentication serializers, registration endpoint with auto wallet creation, and cookie-based session handling.
- **Django Apps Involved**: `apps.accounts`, `apps.credits`
- **Models to Create**:
  - `accounts.User`: `id` (UUID PK), `email` (UNIQUE), `full_name`, `avatar_url`, `role` (choices: super_admin, admin, moderator, company_owner, company_member, professional), `company_id`.
  - `credits.ContactCreditWallet`: `id` (UUID PK), `user` (OneToOneField `User`), `balance` (default=0), `total_earned`, `total_used`.
- **APIs to Create**:
  - `POST /api/v1/auth/register/` (Register user, hash password, auto-create `ContactCreditWallet`, set JWT cookie).
  - `POST /api/v1/auth/login/` (Authenticate credentials, issue JWT cookie).
  - `POST /api/v1/auth/logout/` (Clear session cookie).
  - `GET /api/v1/auth/me/` (Retrieve current session user & wallet balance).
- **Business Rules**: BR-001 (Auto-provision wallet balance=0 on registration), BR-002 (Password hashing, min length=8).
- **Validation Requirements**: Valid email format, email uniqueness in DB, password min length = 8.
- **Testing Checklist**:
  - Unit test registration: Verify user row inserted and wallet row created with balance 0.
  - Unit test login: Verify JWT cookie returned.
- **Completion Criteria**: Registration, login, logout, and `/auth/me/` endpoints passing unit tests.

---

## PHASE 3 — Core Directory & Taxonomy Models

- **Goal**: Build industry categories, countries, products, services catalog, and seed initial database tables.
- **Django Apps Involved**: `apps.directory`
- **Models to Create**:
  - `directory.Country`: `id` (UUID PK), `name`, `code` (UNIQUE), `region`.
  - `directory.Category`: `id` (UUID PK), `name`, `slug` (UNIQUE), `description`, `icon`, `color`, `sort_order`, `is_active`.
  - `directory.Product`: `id` (UUID PK), `name`, `description`, `category` (FK `Category`).
  - `directory.Service`: `id` (UUID PK), `name`, `description`, `category` (FK `Category`).
- **APIs to Create**:
  - `GET /api/v1/categories/`
  - `GET /api/v1/categories/<slug>/`
  - `GET /api/v1/countries/`
- **Dependencies**: `apps.accounts`
- **Testing Checklist**:
  - Execute seed command `python manage.py seed_taxonomies` to populate 13 categories and 38 countries.
  - Test GET `/api/v1/categories/` response.
- **Completion Criteria**: Category and country taxonomies seeded and queryable via REST APIs.

---

## PHASE 4 — Company Profiles, Contacts, Licenses & RBAC

- **Goal**: Build company profile management, team member assignments, executive contacts, regulatory licenses, and role elevation.
- **Django Apps Involved**: `apps.companies`, `apps.accounts`
- **Models to Create**:
  - `companies.Company`: `id`, `name`, `slug` (UNIQUE), `logo_url`, `description`, `website`, `founded_year`, `headquarters`, `country` (FK), `market`, `employee_count`, `revenue_range`, `status` (pending, approved, rejected, suspended), `is_verified`, `is_featured`, `verification_status`, `created_by` (FK), `categories` (M2M), `products` (M2M), `services` (M2M).
  - `companies.CompanyLicense`: `id`, `company` (FK), `license_name`, `jurisdiction`, `license_number`, `status`.
  - `companies.CompanyContact`: `id`, `company` (FK), `full_name`, `position`, `email`, `phone`, `linkedin`, `is_primary`.
  - `companies.CompanyMember`: `id`, `company` (FK), `user` (FK), `role` (owner, admin, member).
- **APIs to Create**:
  - `GET/POST /api/v1/companies/` (Create sets `status='pending'`, elevates user to `company_owner`).
  - `GET/PUT/DELETE /api/v1/companies/<slug>/` (Detail masks unrevealed contacts; DELETE sets `status='suspended'`).
  - `GET/POST /api/v1/companies/<id>/contacts/`
  - `GET/POST /api/v1/companies/<id>/licenses/`
  - `GET/POST /api/v1/companies/<id>/members/`
- **Business Rules**: BR-007 (Role elevation to `company_owner`), BR-008 (Default `status='pending'`), BR-011 (Slug timestamp suffix on collision), BR-013 (Unrevealed contact masking), BR-016 (Soft delete).
- **Validation Requirements**: Contact email format, company name min length = 2.
- **Testing Checklist**:
  - Test company creation: Verify status is 'pending' and user role is updated to 'company_owner'.
  - Test unrevealed contact GET: Verify email is masked.
- **Completion Criteria**: Company profile CRUD, team invites, contact masking, and soft deletion fully verified.

---

## PHASE 5 — Directory Search & Sourcing Engine

- **Goal**: Implement high-performance PostgreSQL full-text search, faceted marketplace filtering, and user saved bookmarks.
- **Django Apps Involved**: `apps.directory`, `apps.companies`
- **Models to Create**:
  - `directory.SavedCompany`: `id`, `user` (FK), `company` (FK), `notes`. UniqueTogether(`user`, `company`).
  - `directory.SavedSearch`: `id`, `user` (FK), `name`, `filters` (JSONField).
- **APIs to Create**:
  - `GET /api/v1/companies/` (Enhanced with PostgreSQL `SearchVector` and faceted filters: category, country, market, verified).
  - `GET/POST/DELETE /api/v1/saved-companies/`
  - `GET/POST/DELETE /api/v1/saved-searches/`
- **Business Rules**: BR-010 (Public directory strictly filters `status='approved'`).
- **Testing Checklist**:
  - Perform marketplace search with keyword "Sportsbook" -> verify only approved companies are returned.
  - Test bookmarking a company -> verify row inserted in `SavedCompany`.
- **Completion Criteria**: Marketplace search and bookmarking endpoints fully operational.

---

## PHASE 6 — Contact Credit Wallet & Atomic Reveal Engine

- **Goal**: Implement atomic contact reveal logic using PostgreSQL row-level locks (`select_for_update()`) to prevent credit double-spending.
- **Django Apps Involved**: `apps.credits`, `apps.companies`, `apps.subscriptions`
- **Models to Create**:
  - `credits.ContactCreditTransaction`: `id`, `wallet` (FK), `user` (FK), `type` (credit, debit, refund, bonus), `amount`, `description`, `reference_id`.
  - `credits.RevealedContact`: `id`, `user` (FK), `company_contact` (FK). UniqueTogether(`user`, `company_contact`).
- **APIs to Create**:
  - `POST /api/v1/contacts/reveal/` (Atomic reveal view).
  - `GET /api/v1/credits/wallet/`
  - `GET /api/v1/credits/history/`
- **Business Rules**: BR-003 (Active subscription required), BR-004 (Atomic 1 credit debit), BR-005 (Idempotent 0 credit duplicate reveal), BR-006 (Admin reveal bypass).
- **Testing Checklist**:
  - Test reveal with 0 credit balance -> verify HTTP 402 Payment Required returned.
  - Test reveal without active subscription -> verify HTTP 403 Forbidden returned.
  - Test valid reveal -> verify balance decrements by 1, transaction logged, and unmasked email/phone returned.
  - Test duplicate reveal -> verify 0 credits deducted and `already_revealed: True` returned.
- **Completion Criteria**: Atomic credit debit and reveal logic passing all concurrent safety tests.

---

## PHASE 7 — Subscriptions & Stripe Billing Engine

- **Goal**: Build subscription tier models, Stripe Checkout session generator, Stripe Billing Portal redirect, webhook event receiver, and offline local dev mock mode.
- **Django Apps Involved**: `apps.subscriptions`, `apps.credits`
- **Models to Create**:
  - `subscriptions.Plan`: `id`, `name`, `slug` (UNIQUE), `price`, `credits`, `features` (JSONField), `stripe_price_id`, `is_active`.
  - `subscriptions.Subscription`: `id`, `user` (FK), `plan` (FK), `stripe_subscription_id` (UNIQUE), `stripe_customer_id`, `status` (active, canceled, past_due, trialing), `current_period_start`, `current_period_end`.
- **APIs to Create**:
  - `GET /api/v1/subscriptions/plan/`
  - `POST /api/v1/subscriptions/checkout/`
  - `POST /api/v1/subscriptions/portal/`
  - `POST /api/v1/stripe/webhook/`
- **Business Rules**: BR-014 (Subscription purchase grants monthly credit quota: +30 Starter, +50 Professional).
- **Dependencies**: Stripe Python SDK (`stripe`).
- **Testing Checklist**:
  - Test local dev mock checkout (`STRIPE_OFFLINE_DEV=True`) -> verify subscription status becomes 'active' and wallet balance increases by plan quota.
  - Test Stripe webhook receiver with simulated event.
- **Completion Criteria**: Subscription billing and credit quota allocation engine operational.

---

## PHASE 8 — Networking, Messaging & Opportunities Board

- **Goal**: Implement professional connection requests, direct messaging guard, automated notifications, and B2B RFP opportunity board.
- **Django Apps Involved**: `apps.networking`, `apps.opportunities`
- **Models to Create**:
  - `networking.Connection`: `id`, `requester` (FK), `receiver` (FK), `status` (pending, accepted, rejected, blocked), `message`.
  - `networking.Conversation`: `id`, `participant_1` (FK), `participant_2` (FK), `last_message_at`.
  - `networking.Message`: `id`, `conversation` (FK), `sender` (FK), `content`, `is_read`.
  - `networking.Notification`: `id`, `user` (FK), `title`, `message`, `type`, `is_read`, `link`.
  - `opportunities.Opportunity`: `id`, `title`, `description`, `type` (looking_for, offering, partnership), `category` (FK), `created_by` (FK), `company` (FK), `status` (open, closed, filled), `budget`, `timeline`.
- **APIs to Create**:
  - `GET/POST /api/v1/connections/` & `PUT /api/v1/connections/<id>/` (Accept sends notification).
  - `GET/POST /api/v1/messages/` (Checks accepted connection status before send; dispatches notification).
  - `GET/POST /api/v1/opportunities/`
- **Business Rules**: BR-012 (Connection required to send messages), BR-014 (Auto-notification on connection accept), BR-015 (Auto-notification on message).
- **Testing Checklist**:
  - Attempt message without connection -> verify HTTP 403 Forbidden.
  - Accept connection -> verify notification created for requester.
  - Send message -> verify notification created for recipient.
- **Completion Criteria**: Networking, messaging, notifications, and opportunity board endpoints passing integration tests.

---

## PHASE 9 — Admin Suite, Moderation & Audit Logging

- **Goal**: Build executive admin suite APIs for company moderation, verification document reviews, manual credit grants, content report moderation, and audit logs.
- **Django Apps Involved**: `apps.moderation`, `apps.companies`, `apps.credits`, `apps.accounts`
- **Models to Create**:
  - `moderation.VerificationRequest`: `id`, `company` (FK), `requested_by` (FK), `documents` (JSONField), `status` (pending, approved, rejected), `reviewed_by` (FK), `review_notes`.
  - `moderation.Report`: `id`, `reporter` (FK), `target_type`, `target_id`, `reason`, `description`, `status`.
  - `moderation.AnalyticsEvent`: `id`, `user` (FK), `event_type`, `entity_type`, `entity_id`, `metadata` (JSONField), `ip_address`.
  - `moderation.AuditLog`: `id`, `user` (FK), `action`, `entity_type`, `entity_id`, `details` (JSONField), `ip_address`.
- **APIs to Create**:
  - `GET/PUT /api/v1/admin/companies/<id>/` (Approve/reject/suspend company).
  - `GET/PUT /api/v1/admin/verification/<id>/` (Grant blue Verified Badge).
  - `POST /api/v1/admin/credits/grant/` (Manual credit adjustment).
  - `POST /api/v1/admin/featured/<id>/` (Toggle featured status).
  - `GET /api/v1/admin/users/`
  - `GET/PUT /api/v1/admin/reports/<id>/`
  - `GET /api/v1/admin/audit-logs/`
- **Business Rules**: BR-006 (Admin reveal bypass), BR-009 (Verification badge review).
- **Testing Checklist**:
  - Approve company listing -> verify status becomes 'approved' and company appears in public directory.
  - Approve verification -> verify `is_verified` becomes 1.
  - Grant manual credits -> verify wallet balance updates and transaction log created.
- **Completion Criteria**: Complete administrative suite operational and protected by `IsAdminPermission`.

---

## PHASE 10 — Testing, Security Hardening & Production Deployment

- **Goal**: Execute comprehensive test suite, configure Nginx, Gunicorn, Celery async workers, Redis caching, and Docker containerization.
- **Tasks**:
  1. **Automated Testing**: Run full test suite with `pytest`:
     - Test unit models, serializers, views, permissions.
     - Test concurrent contact reveal requests.
  2. **Security Hardening**:
     - Verify `DEBUG = False`.
     - Configure `SECURE_SSL_REDIRECT`, `SESSION_COOKIE_SECURE`, `CSRF_COOKIE_SECURE`.
     - Setup DRF API rate throttling (`5 attempts/minute` on login/register).
  3. **Celery Workers Setup**:
     - Configure Celery worker for asynchronous Stripe webhook handling and monthly subscription renewals.
  4. **Docker Compose**:
     - Create `Dockerfile` and `docker-compose.yml` for Django, PostgreSQL, Redis, Celery, and Nginx.
- **Completion Criteria**: Production Docker container stack running smoothly with zero test failures.
