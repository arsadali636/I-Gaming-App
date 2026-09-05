# 05 — Complete User Flows Documentation

This document outlines all end-to-end user journeys and system execution sequences.

---

## 1. Authentication & Onboarding Flows

### Flow 1.1: User Registration
```
User opens /register
  │
  ├──► Enters email, full_name, password
  │
  ├──► Form submits POST /api/auth/register
  │     ├── Validates Zod schema (password >= 6 chars)
  │     ├── Checks for existing email in users table
  │     │     └── If exists -> Return 400 "Email already registered"
  │     ├── Hashes password using scryptSync(password, salt, 64)
  │     ├── Inserts new user record (role = 'professional')
  │     ├── Inserts contact_credit_wallets record (balance = 0)
  │     └── Issues JWT cookie (igc-session, HS256, 7 days expiration)
  │
  └──► Server returns 201 Created -> Redirect to /app
```

---

### Flow 1.2: User Login & Role Routing
```
User opens /login
  │
  ├──► Enters email and password
  │
  ├──► Form submits POST /api/auth/login
  │     ├── Queries user record by email
  │     ├── Verifies password hash using verifyPassword()
  │     │     └── If mismatch -> Return 401 "Invalid email or password"
  │     ├── Generates JWT signed payload
  │     └── Sets HTTP-only cookie igc-session
  │
  └──► Client checks user role
        ├── If role == 'super_admin' or 'admin' -> Redirect to /admin
        └── Otherwise -> Redirect to /app (or original redirect URL)
```

---

## 2. Directory & Sourcing Flows

### Flow 2.1: Buyer / Operator Search & Sourcing Journey
```
Buyer opens /marketplace
  │
  ├──► Types search query (e.g. "Sportsbook PAM") & selects filters (e.g. Category = "Sportsbook", Country = "Malta", Verified = true)
  │
  ├──► System fetches GET /api/companies?search=Sportsbook&category=sportsbook&country=Malta&verified=true
  │     └── Database performs filtered JOIN query on companies status = 'approved'
  │
  ├──► Buyer views search results cards (Displays logo, name, category pills, country code, verified badge)
  │
  ├──► Buyer clicks company card -> Opens Company Detail View (/company/[slug])
  │     └── Public overview displayed (Description, website, founded year, active licenses)
  │
  └──► Buyer clicks "Save Company" -> Saved to saved_companies table with optional notes
```

---

## 3. Contact Reveal & Credit Flows

### Flow 3.1: Contact Reveal & Credit Deduction Flow
```
User views company key contacts modal on /marketplace or /company/[slug]
  │
  ├──► User clicks "Unlock Contact" for target contact (contact_id)
  │
  ├──► System executes POST /api/contacts/reveal
  │     │
  │     ├── Check 1: Is contact already revealed? (SELECT FROM revealed_contacts)
  │     │     └── If YES -> Return contact info immediately with already_revealed = true (0 credits deducted)
  │     │
  │     ├── Check 2: Does user have active subscription? (SELECT FROM subscriptions WHERE status = 'active')
  │     │     └── If NO -> Return 403 Forbidden "Active subscription required"
  │     │
  │     ├── Check 3: Is wallet balance > 0? (SELECT balance FROM contact_credit_wallets)
  │     │     └── If NO -> Return 402 Payment Required "Insufficient credits"
  │     │
  │     └── Check 4: Execute ACID Transaction:
  │           ├── UPDATE contact_credit_wallets SET balance = balance - 1, total_used = total_used + 1
  │           ├── INSERT INTO contact_credit_transactions (type = 'debit', amount = 1, reference_id = contact_id)
  │           └── INSERT INTO revealed_contacts (user_id, company_contact_id)
  │
  └──► Server returns 200 OK with unlocked contact details (email, phone, LinkedIn) & updated balance
```

---

## 4. Payment & Stripe Flows

### Flow 4.1: Subscription Purchase Flow
```
User navigates to /pricing or /app/subscription
  │
  ├──► Selects Plan (e.g. Professional Plan - $499/mo)
  │
  ├──► Clicks "Subscribe Now" -> POST /api/stripe/checkout { plan_slug: "professional" }
  │     │
  │     ├── Branch A: Production Environment (STRIPE_SECRET_KEY present)
  │     │     ├── Creates Stripe Checkout Session
  │     │     └── Returns { url: session.url } -> Browser redirects to Stripe Checkout Page
  │     │           │
  │     │           ├── User completes payment on Stripe
  │     │           └── Stripe sends webhook event customer.subscription.created to /api/stripe/webhook
  │     │                 ├── Backend updates subscriptions table (status = 'active')
  │     │                 └── Credits wallet with 50 credits in contact_credit_wallets
  │     │
  │     └── Branch B: Offline Local Development (No Stripe Key)
  │           ├── Automatically creates/updates subscriptions record (status = 'active', 30-day period)
  │           ├── Refills contact_credit_wallets balance (+50 credits)
  │           └── Returns { url: "/app/subscription?success=true" }
  │
  └──► User redirected to /app/subscription dashboard with active plan status badge
```

---

## 5. B2B Opportunities & Networking Flows

### Flow 5.1: Opportunity Sourcing & RFP Posting Flow
```
Seller or Buyer opens /app/opportunities
  │
  ├──► Clicks "Post Opportunity"
  │
  ├──► Fills Form: Title, Description, Type ("looking_for"), Category ("Casino"), Budget ("$50k-$100k"), Timeline ("Q3 2026")
  │
  ├──► Submits POST /api/opportunities
  │     └── Inserts record into opportunities table with status = 'open'
  │
  └──► Opportunity appears on public/dashboard Opportunity Feed
        └── Interested vendors view opportunity and click "Connect with Poster"
```

---

### Flow 5.2: Connection & Direct Messaging Flow
```
User A views User B's profile or opportunity
  │
  ├──► User A clicks "Connect" -> Submits POST /api/connections { receiver_id: User_B_ID, message: "Hi, let's discuss PAM integration" }
  │     └── Inserts connections record with status = 'pending'
  │
  ├──► User B receives notification & views /app/connections
  │     └── User B clicks "Accept" -> Updates connections status = 'accepted'
  │
  ├──► System creates conversations record between User A and User B
  │
  ├──► User A or User B opens /app/messages
  │     └── Types message content -> Submits POST /api/messages { conversation_id, content }
  │
  └──► Recipient receives real-time chat update & unread badge notification
```

---

## 6. Admin & Moderation Flows

### Flow 6.1: Company Listing Verification Journey
```
Company Owner uploads regulatory license/incorporation documents on /app/company-profile
  │
  ├──► System inserts verification_requests record (status = 'pending') & sets company verification_status = 'pending'
  │
  ├──► Super Admin / Admin logs into /admin/verification
  │     └── Inspects submitted documentation JSON & company licenses
  │
  ├──► Admin selects Action:
  │     ├── Option 1: Approve -> Updates verification_requests.status = 'approved', companies.is_verified = 1, verification_status = 'verified'
  │     └── Option 2: Reject -> Updates verification_requests.status = 'rejected', includes review_notes
  │
  └──► System posts notification to Company Owner with verification result
```
