# 08 — API Requirements Documentation (Django REST Framework)

This document specifies clean, standardized RESTful API endpoints for the rebuilt **Django REST Framework (DRF)** backend.

---

## 1. Authentication & User API Endpoints (`/api/v1/auth/`)

### API-001: Register User Account
* **Suggested Endpoint:** `POST /api/v1/auth/register/`
* **Purpose:** Create a new user account and initialize credit wallet.
* **Auth Required:** No (Public).
* **Request Body:**
  ```json
  {
    "email": "user@domain.com",
    "password": "SecretPassword123",
    "full_name": "John Doe",
    "role": "professional"
  }
  ```
* **Validation:** Email format, email uniqueness in `users`, password length >= 6.
* **Success Response (201 Created):**
  ```json
  {
    "user": {
      "id": "c1f2e3d4-...",
      "email": "user@domain.com",
      "full_name": "John Doe",
      "role": "professional"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6..."
  }
  ```
* **Error Cases:** `400 Bad Request` (Email already registered, validation error).
* **Database Actions:** `INSERT INTO users`, `INSERT INTO contact_credit_wallets`.

---

### API-002: Login User
* **Suggested Endpoint:** `POST /api/v1/auth/login/`
* **Purpose:** Authenticate credentials and return JWT bearer token or set HTTP-only cookie.
* **Auth Required:** No.
* **Request Body:** `{ "email": "user@domain.com", "password": "SecretPassword123" }`
* **Success Response (200 OK):** Returns token + user profile.
* **Error Cases:** `401 Unauthorized` (`"Invalid email or password"`).

---

### API-003: Get Current User Profile
* **Suggested Endpoint:** `GET /api/v1/auth/me/`
* **Purpose:** Retrieve active authenticated user metadata and wallet balance.
* **Auth Required:** Yes (`IsAuthenticated`).

---

## 2. Directory & Company API Endpoints (`/api/v1/companies/`)

### API-004: List & Search Companies
* **Suggested Endpoint:** `GET /api/v1/companies/`
* **Purpose:** Search and filter public company directory.
* **Auth Required:** No (Public).
* **Query Parameters:** `q` (search term), `category` (slug), `country` (name), `market`, `verified` (bool), `page` (int), `page_size` (int), `sort` (`newest`, `name`, `featured`).
* **Success Response (200 OK):**
  ```json
  {
    "count": 120,
    "next": "/api/v1/companies/?page=2",
    "previous": null,
    "results": [
      {
        "id": "a9b8c7...",
        "name": "BetTech Solutions",
        "slug": "bettech-solutions",
        "logo_url": "https://...",
        "description": "Leading sportsbook engine provider",
        "is_verified": true,
        "is_featured": true,
        "country": { "name": "Malta", "code": "MT" },
        "categories": [{ "name": "Sportsbook", "slug": "sportsbook" }]
      }
    ]
  }
  ```

---

### API-005: Create Company Profile
* **Suggested Endpoint:** `POST /api/v1/companies/`
* **Purpose:** Register a new company profile.
* **Auth Required:** Yes (`IsAuthenticated`).
* **Request Body:** `{ "name": "...", "description": "...", "website": "...", "founded_year": 2020, "country_id": "...", "category_ids": ["..."] }`
* **Business Logic:** Automatically sets `status = 'pending'`, binds user as `company_owner`, and inserts member record as `owner`.

---

### API-006: Get Company Detail
* **Suggested Endpoint:** `GET /api/v1/companies/<slug>/`
* **Purpose:** Retrieve full company profile overview, public licenses, products, services, and team contacts.
* **Auth Required:** No (Public). Sanitizes contact email/phone unless unlocked by requesting user.

---

## 3. Contact Reveal & Wallet API Endpoints (`/api/v1/contacts/`)

### API-007: Reveal Contact Details
* **Suggested Endpoint:** `POST /api/v1/contacts/reveal/`
* **Purpose:** Deduct 1 wallet credit to unlock direct decision-maker email/phone.
* **Auth Required:** Yes (`IsAuthenticated`).
* **Request Body:** `{ "contact_id": "c1d2e3-..." }`
* **Business Logic (DRF View / Atomic Transaction):**
  1. Checks if contact was already revealed (`RevealedContact.objects.filter(user=user, contact_id=contact_id)`). If yes, returns contact details immediately with `already_revealed = True`.
  2. Verifies active subscription (`Subscription.objects.filter(user=user, status='active')`). If none -> `403 Forbidden`.
  3. Checks balance (`wallet.balance > 0`). If <= 0 -> `402 Payment Required`.
  4. Wraps in `transaction.atomic()`:
     * `wallet.balance -= 1`
     * `wallet.total_used += 1`
     * `ContactCreditTransaction.objects.create(type='debit', amount=1)`
     * `RevealedContact.objects.create(user=user, contact_id=contact_id)`
* **Success Response (200 OK):**
  ```json
  {
    "contact": {
      "id": "c1d2e3-...",
      "full_name": "Jane Smith",
      "position": "Head of BD",
      "email": "jane@company.com",
      "phone": "+356 9912 3456",
      "linkedin": "https://linkedin.com/in/janesmith"
    },
    "already_revealed": false,
    "credits_remaining": 29
  }
  ```

---

## 4. Subscriptions & Stripe APIs (`/api/v1/subscriptions/`)

### API-008: Create Stripe Checkout Session
* **Suggested Endpoint:** `POST /api/v1/subscriptions/checkout/`
* **Purpose:** Initiate subscription plan purchase.
* **Auth Required:** Yes.
* **Request Body:** `{ "plan_slug": "professional" }`
* **Success Response (200 OK):** `{ "checkout_url": "https://checkout.stripe.com/c/pay/..." }`

---

### API-009: Stripe Webhook Listener
* **Suggested Endpoint:** `POST /api/v1/stripe/webhook/`
* **Purpose:** Handle incoming webhook events from Stripe (`customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`).
* **Auth Required:** No (Verifies Stripe Signature header).

---

## 5. Opportunities APIs (`/api/v1/opportunities/`)

### API-010: List & Create Opportunities
* **Suggested Endpoint:** `GET/POST /api/v1/opportunities/`
* **Purpose:** Browse or post B2B requests for proposal (RFPs).

---

## 6. Admin Control APIs (`/api/v1/admin/`)

### API-011: Admin Company Moderation
* **Suggested Endpoint:** `PATCH /api/v1/admin/companies/<id>/`
* **Purpose:** Update company status (`approved`, `rejected`, `suspended`) or toggle `is_featured`.
* **Auth Required:** Yes (`IsAdminUser`).

---

### API-012: Admin Credit Adjustment
* **Suggested Endpoint:** `POST /api/v1/admin/credits/grant/`
* **Purpose:** Grant bonus credits or refund a user's wallet.
* **Auth Required:** Yes (`IsSuperAdmin`).
