# 07 — Database Requirements Documentation

This document defines the complete data layer requirements for rebuilding the iGaming Connect application in **Django + PostgreSQL**.

---

## 1. Entity Architecture Overview

The database comprises 24 primary entities and junction tables supporting identity, business directory, billing, social networking, and moderation.

---

## 2. Entity Specifications

### 2.1 Entity: `User` (`users`)
* **Purpose:** Core user account entity representing buyers, sellers, and administrators.
* **Fields:**
  * `id`: UUID, Primary Key.
  * `email`: String (VARCHAR 255), Unique, Required, Indexed.
  * `full_name`: String (VARCHAR 255), Required.
  * `avatar_url`: String (TEXT), Optional.
  * `password_hash`: String (VARCHAR 255), Required.
  * `role`: Enum / String (`super_admin`, `admin`, `moderator`, `company_owner`, `company_member`, `professional`), Default: `'professional'`.
  * `company_id`: UUID, Foreign Key (`companies.id`), Optional.
  * `created_at`: Timestamp with Timezone, Default: `NOW()`.
  * `updated_at`: Timestamp with Timezone, Default: `NOW()`.
* **Constraints:** `email` unique. Role check constraint.
* **Indexes:** `idx_users_email` (UNIQUE), `idx_users_role`, `idx_users_company`.

---

### 2.2 Entity: `Company` (`companies`)
* **Purpose:** Business listing entity representing gaming operators, platform vendors, aggregators, etc.
* **Fields:**
  * `id`: UUID, Primary Key.
  * `name`: String (VARCHAR 255), Required.
  * `slug`: String (VARCHAR 255), Unique, Required, Indexed.
  * `logo_url`: String (TEXT), Optional.
  * `description`: Text, Required.
  * `website`: String (VARCHAR 255), Optional.
  * `founded_year`: Integer, Optional.
  * `headquarters`: String (VARCHAR 255), Optional.
  * `country_id`: UUID, Foreign Key (`countries.id`), Optional, Indexed.
  * `market`: String (VARCHAR 255), Optional.
  * `employee_count`: String (VARCHAR 100), Optional.
  * `revenue_range`: String (VARCHAR 100), Optional.
  * `technology`: Text, Optional.
  * `status`: Enum (`pending`, `approved`, `rejected`, `suspended`), Default: `'pending'`, Indexed.
  * `is_verified`: Boolean, Default: `false`.
  * `is_featured`: Boolean, Default: `false`.
  * `verification_status`: Enum (`unverified`, `pending`, `verified`), Default: `'unverified'`.
  * `created_by`: UUID, Foreign Key (`users.id`), Optional.
  * `created_at`: Timestamp with Timezone, Default: `NOW()`.
  * `updated_at`: Timestamp with Timezone, Default: `NOW()`.
* **Indexes:** `idx_companies_slug` (UNIQUE), `idx_companies_status`, `idx_companies_country`.

---

### 2.3 Entity: `Category` (`categories`)
* **Purpose:** Industry vertical classification (e.g., Sportsbook, Casino, Slots, PSP/Payments).
* **Fields:** `id` (UUID PK), `name` (VARCHAR 100), `slug` (VARCHAR 100 UNIQUE), `description` (TEXT), `icon` (VARCHAR 50), `color` (VARCHAR 20), `sort_order` (INT default 0), `is_active` (BOOLEAN default true).

---

### 2.4 Entity: `CompanyLicense` (`company_licenses`)
* **Purpose:** Regulatory permissions and certificates held by a company.
* **Fields:** `id` (UUID PK), `company_id` (UUID FK ON DELETE CASCADE), `license_name` (VARCHAR 255), `jurisdiction` (VARCHAR 100), `license_number` (VARCHAR 100), `status` (`active`, `pending`, `expired`).

---

### 2.5 Entity: `CompanyContact` (`company_contacts`)
* **Purpose:** Key decision-makers and executive contacts associated with a company profile.
* **Fields:** `id` (UUID PK), `company_id` (UUID FK ON DELETE CASCADE), `full_name` (VARCHAR 255), `position` (VARCHAR 255), `email` (VARCHAR 255), `phone` (VARCHAR 50), `linkedin` (VARCHAR 255), `is_primary` (BOOLEAN default false).

---

### 2.6 Entity: `ContactCreditWallet` (`contact_credit_wallets`)
* **Purpose:** User wallet balance for revealing contacts.
* **Fields:** `id` (UUID PK), `user_id` (UUID FK UNIQUE ON DELETE CASCADE), `balance` (INT default 0), `total_earned` (INT default 0), `total_used` (INT default 0).

---

### 2.7 Entity: `ContactCreditTransaction` (`contact_credit_transactions`)
* **Purpose:** Audit log for all credit grants, debits, refunds, and bonuses.
* **Fields:** `id` (UUID PK), `wallet_id` (UUID FK), `user_id` (UUID FK), `type` (`credit`, `debit`, `refund`, `bonus`), `amount` (INT), `description` (TEXT), `reference_id` (VARCHAR 255), `created_at` (TIMESTAMPTZ).

---

### 2.8 Entity: `RevealedContact` (`revealed_contacts`)
* **Purpose:** Tracks which user has unlocked which company contact.
* **Fields:** `id` (UUID PK), `user_id` (UUID FK), `company_contact_id` (UUID FK), `revealed_at` (TIMESTAMPTZ).
* **Constraints:** `UNIQUE(user_id, company_contact_id)`.

---

### 2.9 Entity: `Plan` (`plans`) & `Subscription` (`subscriptions`)
* **Purpose:** Tiered subscription products and active user subscriptions via Stripe.
* **Fields (`plans`):** `id`, `name`, `slug` (UNIQUE), `price` (DECIMAL 10,2), `credits` (INT), `features` (JSONB), `stripe_price_id` (VARCHAR), `is_active` (BOOLEAN).
* **Fields (`subscriptions`):** `id`, `user_id` (UUID FK), `plan_id` (UUID FK), `stripe_subscription_id` (VARCHAR UNIQUE), `stripe_customer_id` (VARCHAR), `status` (`active`, `canceled`, `past_due`, `trialing`), `current_period_start`, `current_period_end`.

---

### 2.10 Entity: `Connection` (`connections`) & `Message` (`messages`)
* **Purpose:** Networking relationships and 1-on-1 private messaging.
* **Fields (`connections`):** `id`, `requester_id` (FK users), `receiver_id` (FK users), `status` (`pending`, `accepted`, `rejected`, `blocked`), `message` (TEXT). UNIQUE(`requester_id`, `receiver_id`).
* **Fields (`conversations`):** `id`, `participant_1_id` (FK users), `participant_2_id` (FK users), `last_message_at`.
* **Fields (`messages`):** `id`, `conversation_id` (FK conversations), `sender_id` (FK users), `content` (TEXT), `is_read` (BOOLEAN).

---

### 2.11 Entity: `Opportunity` (`opportunities`)
* **Purpose:** B2B project postings and RFPs.
* **Fields:** `id`, `title`, `description`, `type` (`looking_for`, `offering`, `partnership`), `category_id` (FK), `created_by` (FK users), `company_id` (FK companies), `status` (`open`, `closed`, `filled`), `budget`, `timeline`.

---

### 2.12 Administrative Entities: `VerificationRequest`, `Report`, `AuditLog`
* **VerificationRequest:** `id`, `company_id`, `requested_by`, `documents` (JSONB), `status` (`pending`, `approved`, `rejected`), `reviewed_by`, `review_notes`.
* **Report:** `id`, `reporter_id`, `target_type` (`company`, `user`, `message`), `target_id`, `reason`, `description`, `status`.
* **AuditLog:** `id`, `user_id`, `action`, `entity_type`, `entity_id`, `details` (JSONB), `ip_address`, `created_at`.
