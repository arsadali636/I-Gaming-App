# Database ERD — iGaming Connect

This document contains the complete Entity Relationship Diagram (ERD) for the **iGaming Connect** database schema in Mermaid format.

```mermaid
erDiagram
    USERS ||--o{ COMPANIES : "created by / owns"
    USERS ||--|| CONTACT_CREDIT_WALLETS : "has wallet"
    USERS ||--o{ SUBSCRIPTIONS : "subscribes to"
    USERS ||--o{ REVEALED_CONTACTS : "unlocks"
    USERS ||--o{ CONNECTIONS : "requests / receives"
    USERS ||--o{ MESSAGES : "sends"
    USERS ||--o{ OPPORTUNITIES : "posts"
    USERS ||--o{ SAVED_COMPANIES : "bookmarks"
    USERS ||--o{ AUDIT_LOGS : "triggers"

    COUNTRIES ||--o{ COMPANIES : "headquartered in"

    CATEGORIES ||--o{ PRODUCTS : "contains"
    CATEGORIES ||--o{ SERVICES : "contains"
    CATEGORIES ||--o{ COMPANY_CATEGORIES : "categorizes"
    CATEGORIES ||--o{ OPPORTUNITIES : "classified under"

    COMPANIES ||--o{ COMPANY_CATEGORIES : "belongs to"
    COMPANIES ||--o{ COMPANY_PRODUCTS : "offers"
    COMPANIES ||--o{ COMPANY_SERVICES : "provides"
    COMPANIES ||--o{ COMPANY_LICENSES : "holds"
    COMPANIES ||--o{ COMPANY_CONTACTS : "employs"
    COMPANIES ||--o{ COMPANY_MEMBERS : "has team"
    COMPANIES ||--o{ VERIFICATION_REQUESTS : "submits"
    COMPANIES ||--o{ SAVED_COMPANIES : "bookmarked by"

    PLANS ||--o{ SUBSCRIPTIONS : "defines"

    CONTACT_CREDIT_WALLETS ||--o{ CONTACT_CREDIT_TRANSACTIONS : "logs"

    COMPANY_CONTACTS ||--o{ REVEALED_CONTACTS : "revealed in"

    CONVERSATIONS ||--o{ MESSAGES : "contains"

    PRODUCTS ||--o{ COMPANY_PRODUCTS : "linked in"
    SERVICES ||--o{ COMPANY_SERVICES : "linked in"

    USERS {
        uuid id PK
        string email UK
        string full_name
        string role
        uuid company_id FK
        datetime created_at
    }

    COMPANIES {
        uuid id PK
        string name
        string slug UK
        uuid country_id FK
        string status
        boolean is_verified
        boolean is_featured
        datetime created_at
    }

    COMPANY_CONTACTS {
        uuid id PK
        uuid company_id FK
        string full_name
        string position
        string email
        string phone
        string linkedin
        boolean is_primary
    }

    CONTACT_CREDIT_WALLETS {
        uuid id PK
        uuid user_id FK UK
        integer balance
        integer total_earned
        integer total_used
    }

    REVEALED_CONTACTS {
        uuid id PK
        uuid user_id FK
        uuid company_contact_id FK
        datetime revealed_at
    }

    PLANS {
        uuid id PK
        string name
        string slug UK
        numeric price
        integer credits
        string stripe_price_id
    }

    SUBSCRIPTIONS {
        uuid id PK
        uuid user_id FK
        uuid plan_id FK
        string stripe_subscription_id UK
        string status
    }
```
