# 12 — Documentation Gap Analysis Report

This document records all discrepancies, missing features, un-documented business rules, missing validation constraints, and missing screens identified by comparing the initial reverse engineering documentation against the authoritative codebase of **iGaming Connect**.

---

## Summary of Identified Gaps

| Gap ID | Feature / Rule Name | Source Code Location | Priority | Document Target |
| :--- | :--- | :--- | :---: | :--- |
| **GAP-01** | Contact Detail Masking & Sanitization Rule | `src/app/api/companies/[id]/route.ts` (L78-90), `src/app/api/companies/[id]/contacts/route.ts` (L41-52) | **Critical** | `06_BUSINESS_RULES.md`, `08_API_REQUIREMENTS.md` |
| **GAP-02** | Registration Password Min Length (8 chars) & Optional Company Name | `src/lib/validations.ts` (L8-13) | **High** | `03_COMPLETE_FEATURE_DOCUMENTATION.md`, `06_BUSINESS_RULES.md` |
| **GAP-03** | Auto-Notification Trigger on Connection Accept | `src/app/api/connections/[id]/route.ts` (L60-66) | **High** | `04_MODULE_DOCUMENTATION.md`, `05_USER_FLOWS.md` |
| **GAP-04** | Auto-Notification Trigger on New Direct Message | `src/app/api/messages/route.ts` (L189-204) | **High** | `04_MODULE_DOCUMENTATION.md`, `05_USER_FLOWS.md` |
| **GAP-05** | Company Soft Deletion via Status Update | `src/app/api/companies/[id]/route.ts` (L201-221) | **Medium** | `03_COMPLETE_FEATURE_DOCUMENTATION.md`, `08_API_REQUIREMENTS.md` |
| **GAP-06** | Dedicated Dashboard Sub-Pages Inventory | `src/app/(dashboard)/app/company-profile/` (`edit`, `team`, `analytics`) | **Medium** | `11_SCREEN_PAGE_INVENTORY.md` |
| **GAP-07** | Registration Onboarding Flow Wizard | `src/app/(auth)/register/onboarding/page.tsx` | **Medium** | `05_USER_FLOWS.md`, `11_SCREEN_PAGE_INVENTORY.md` |
| **GAP-08** | Admin Settings, Subscriptions & Payments Pages | `src/app/(admin)/admin/` (`settings`, `subscriptions`, `payments`) | **Medium** | `11_SCREEN_PAGE_INVENTORY.md` |
| **GAP-09** | Message Content Max Length (5000 chars) & Schema Validation | `src/lib/validations.ts` (L49-53) | **Low** | `03_COMPLETE_FEATURE_DOCUMENTATION.md`, `08_API_REQUIREMENTS.md` |
| **GAP-10** | Opportunity Validation Constraints (Title min 5, Desc min 20) | `src/lib/validations.ts` (L40-47) | **Low** | `03_COMPLETE_FEATURE_DOCUMENTATION.md` |

---

## Detailed Gap Findings

### GAP-01: Contact Detail Masking & Sanitization Security Rule [CRITICAL]
* **Feature/Rule Name:** Unrevealed Contact Detail Masking (`maskEmail`, `maskPhone`, `linkedin = null`).
* **Where It Exists:** `src/app/api/companies/[id]/route.ts` (Lines 78-90) & `src/app/api/companies/[id]/contacts/route.ts` (Lines 41-52).
* **Why It Is Important:** Security and revenue protection requirement. Unless a user has revealed the contact (`revealed_contacts` entry) or is the owner of the company (`company.created_by === user.id`), `email` must be masked (e.g., `j***e@domain.com`), `phone` masked (e.g., `+356 *** 3456`), and `linkedin` forced to `null`. Without this rule in DRF, API serializers could accidentally leak private executive emails to non-paying users.
* **Which File Should Contain It:** `06_BUSINESS_RULES.md` (BR-016), `08_API_REQUIREMENTS.md` (API-006).

---

### GAP-02: Registration Password Min Length (8 chars) & Optional Company Name [HIGH]
* **Feature/Rule Name:** Signup Password Strength & Optional Company Name Field.
* **Where It Exists:** `src/lib/validations.ts` (Lines 8-13).
* **Why It Is Important:** `registerSchema` explicitly enforces `password: z.string().min(8)` and accepts an optional `company_name` string. Initial docs listed password min length as 6 characters (which applies to login, but not signup).
* **Which File Should Contain It:** `03_COMPLETE_FEATURE_DOCUMENTATION.md` (F-001), `06_BUSINESS_RULES.md` (BR-002).

---

### GAP-03: Auto-Notification Trigger on Connection Accept [HIGH]
* **Feature/Rule Name:** Connection Acceptance Notification Dispatch.
* **Where It Exists:** `src/app/api/connections/[id]/route.ts` (Lines 60-66).
* **Why It Is Important:** When a user accepts a connection request (`PUT /api/connections/[id]` with `status = 'accepted'`), the system automatically creates a record in `notifications` for the requester (`type = 'connection_accepted'`, `title = 'Connection Accepted'`).
* **Which File Should Contain It:** `04_MODULE_DOCUMENTATION.md` (Module 9), `05_USER_FLOWS.md` (Flow 5.2).

---

### GAP-04: Auto-Notification Trigger on New Direct Message [HIGH]
* **Feature/Rule Name:** New Direct Message Notification Dispatch.
* **Where It Exists:** `src/app/api/messages/route.ts` (Lines 189-204).
* **Why It Is Important:** Sending a direct message (`POST /api/messages`) automatically creates a notification record in `notifications` for the recipient (`type = 'new_message'`, `link = '/messages/[conversation_id]'`).
* **Which File Should Contain It:** `04_MODULE_DOCUMENTATION.md` (Module 9), `05_USER_FLOWS.md` (Flow 5.2).

---

### GAP-05: Company Soft Deletion via Status Update [MEDIUM]
* **Feature/Rule Name:** Admin Company Soft Delete (`DELETE /api/companies/[id]`).
* **Where It Exists:** `src/app/api/companies/[id]/route.ts` (Lines 201-221).
* **Why It Is Important:** Executing HTTP DELETE on a company by an Admin does not drop the database row; it updates `status = 'suspended'`.
* **Which File Should Contain It:** `03_COMPLETE_FEATURE_DOCUMENTATION.md` (F-012), `08_API_REQUIREMENTS.md` (API-005).

---

### GAP-06: Dedicated Dashboard Sub-Pages Inventory [MEDIUM]
* **Feature/Rule Name:** Company Profile Sub-Pages (`/app/company-profile/edit`, `/app/company-profile/team`, `/app/company-profile/analytics`).
* **Where It Exists:** `src/app/(dashboard)/app/company-profile/` subdirectories.
* **Why It Is Important:** The company profile dashboard is split across dedicated tab pages (`/edit` for basic info, `/team` for staff, `/analytics` for profile metrics).
* **Which File Should Contain It:** `11_SCREEN_PAGE_INVENTORY.md`.

---

### GAP-07: Registration Onboarding Flow Wizard [MEDIUM]
* **Feature/Rule Name:** Signup Onboarding Wizard (`/register/onboarding`).
* **Where It Exists:** `src/app/(auth)/register/onboarding/page.tsx`.
* **Why It Is Important:** Post-registration redirect guides new users through setting up initial profile details and company affiliations.
* **Which File Should Contain It:** `05_USER_FLOWS.md`, `11_SCREEN_PAGE_INVENTORY.md`.

---

### GAP-08: Admin Settings, Subscriptions & Payments Pages [MEDIUM]
* **Feature/Rule Name:** Additional Admin Suite Pages (`/admin/settings`, `/admin/subscriptions`, `/admin/payments`).
* **Where It Exists:** `src/app/(admin)/admin/` subdirectories.
* **Why It Is Important:** Admin panel includes dedicated screens for platform settings configuration, subscription monitoring, and financial payment ledger overview.
* **Which File Should Contain It:** `11_SCREEN_PAGE_INVENTORY.md`.

---

### GAP-09 & GAP-10: Message & Opportunity Zod Constraints [LOW]
* **Feature/Rule Name:** Opportunity & Message Schema Constraints.
* **Where It Exists:** `src/lib/validations.ts` (Lines 40-53).
* **Why It Is Important:** Message content max length = 5000 characters. Opportunity title min = 5 characters, description min = 20 characters.
* **Which File Should Contain It:** `03_COMPLETE_FEATURE_DOCUMENTATION.md`.
