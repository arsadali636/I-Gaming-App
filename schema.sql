-- iGaming Connect Database Schema
-- PostgreSQL

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'professional' CHECK (role IN ('super_admin', 'admin', 'moderator', 'company_owner', 'company_member', 'professional')),
  company_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Countries table
CREATE TABLE countries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  region TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Categories table
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  icon TEXT,
  color TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Products table
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  category_id UUID REFERENCES categories(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Services table
CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  category_id UUID REFERENCES categories(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Companies table
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  description TEXT NOT NULL,
  website TEXT,
  founded_year INTEGER,
  headquarters TEXT,
  country_id UUID REFERENCES countries(id),
  market TEXT,
  employee_count TEXT,
  revenue_range TEXT,
  technology TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'suspended')),
  is_verified BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  verification_status TEXT NOT NULL DEFAULT 'unverified' CHECK (verification_status IN ('unverified', 'pending', 'verified')),
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Company-Categories junction
CREATE TABLE company_categories (
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  PRIMARY KEY (company_id, category_id)
);

-- Company-Products junction
CREATE TABLE company_products (
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  PRIMARY KEY (company_id, product_id)
);

-- Company-Services junction
CREATE TABLE company_services (
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  service_id UUID REFERENCES services(id) ON DELETE CASCADE,
  PRIMARY KEY (company_id, service_id)
);

-- Company Licenses
CREATE TABLE company_licenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  license_name TEXT NOT NULL,
  jurisdiction TEXT NOT NULL,
  license_number TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'pending', 'expired')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Company Contacts
CREATE TABLE company_contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  position TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  linkedin TEXT,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Company Members
CREATE TABLE company_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(company_id, user_id)
);

-- Plans
CREATE TABLE plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  credits INTEGER NOT NULL DEFAULT 0,
  features JSONB DEFAULT '[]',
  stripe_price_id TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Subscriptions
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES plans(id),
  stripe_subscription_id TEXT UNIQUE,
  stripe_customer_id TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'past_due', 'trialing')),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Contact Credit Wallets
CREATE TABLE contact_credit_wallets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  balance INTEGER NOT NULL DEFAULT 0,
  total_earned INTEGER NOT NULL DEFAULT 0,
  total_used INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Contact Credit Transactions
CREATE TABLE contact_credit_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_id UUID NOT NULL REFERENCES contact_credit_wallets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('credit', 'debit', 'refund', 'bonus')),
  amount INTEGER NOT NULL,
  description TEXT NOT NULL,
  reference_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Revealed Contacts
CREATE TABLE revealed_contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company_contact_id UUID NOT NULL REFERENCES company_contacts(id) ON DELETE CASCADE,
  revealed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, company_contact_id)
);

-- Connections
CREATE TABLE connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  requester_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'blocked')),
  message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(requester_id, receiver_id)
);

-- Conversations
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  participant_1_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  participant_2_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  last_message_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Messages
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  link TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Opportunities
CREATE TABLE opportunities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('looking_for', 'offering', 'partnership')),
  category_id UUID REFERENCES categories(id),
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed', 'filled')),
  budget TEXT,
  timeline TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Saved Companies
CREATE TABLE saved_companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, company_id)
);

-- Saved Searches
CREATE TABLE saved_searches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  filters JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Verification Requests
CREATE TABLE verification_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  requested_by UUID NOT NULL REFERENCES users(id),
  documents JSONB DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID REFERENCES users(id),
  review_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ
);

-- Reports
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id UUID NOT NULL REFERENCES users(id),
  target_type TEXT NOT NULL CHECK (target_type IN ('company', 'user', 'message')),
  target_id UUID NOT NULL,
  reason TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
  reviewed_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ
);

-- Analytics Events
CREATE TABLE analytics_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  event_type TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  metadata JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Audit Logs
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  details JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_companies_slug ON companies(slug);
CREATE INDEX idx_companies_status ON companies(status);
CREATE INDEX idx_companies_country ON companies(country_id);
CREATE INDEX idx_company_contacts_company ON company_contacts(company_id);
CREATE INDEX idx_company_licenses_company ON company_licenses(company_id);
CREATE INDEX idx_company_members_company ON company_members(company_id);
CREATE INDEX idx_company_members_user ON company_members(user_id);
CREATE INDEX idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_wallets_user ON contact_credit_wallets(user_id);
CREATE INDEX idx_transactions_wallet ON contact_credit_transactions(wallet_id);
CREATE INDEX idx_revealed_contacts_user ON revealed_contacts(user_id);
CREATE INDEX idx_revealed_contacts_contact ON revealed_contacts(company_contact_id);
CREATE INDEX idx_connections_requester ON connections(requester_id);
CREATE INDEX idx_connections_receiver ON connections(receiver_id);
CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_opportunities_type ON opportunities(type);
CREATE INDEX idx_saved_companies_user ON saved_companies(user_id);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_analytics_events_type ON analytics_events(event_type);

-- Seed default categories
INSERT INTO categories (name, slug, description, icon, color) VALUES
('Sportsbook', 'sportsbook', 'Sports betting platforms and odds providers', 'Trophy', '#6c5ce7'),
('Casino', 'casino', 'Online casino platforms and operators', 'Dice1', '#00d2ff'),
('Slots', 'slots', 'Slot game providers and platforms', 'Sliders', '#00ffc8'),
('Bingo', 'bingo', 'Online bingo platforms and providers', 'Grid3x3', '#ff6b9d'),
('Virtual Games', 'virtual-games', 'Virtual and simulated gaming products', 'Gamepad2', '#a29bfe'),
('Game Studios', 'game-studios', 'Game development studios and studios', 'Palette', '#fd79a8'),
('Operators', 'operators', 'Online and retail gaming operators', 'Building2', '#00cec9'),
('Platform Providers', 'platform-providers', 'Full-stack gaming platform solutions', 'Server', '#6c5ce7'),
('PSP / Payments', 'psp-payments', 'Payment service providers and processors', 'CreditCard', '#00d2ff'),
('Licensing', 'licensing', 'Licensing authorities and consultees', 'Shield', '#00ffc8'),
('Aggregators', 'aggregators', 'Game and content aggregators', 'Layers', '#fdcb6e'),
('Technology Providers', 'technology-providers', 'Gaming technology and infrastructure', 'Cpu', '#e17055'),
('Compliance / KYC / AML', 'compliance-kyc-aml', 'Compliance, identity verification, and AML solutions', 'FileCheck', '#ff4757');

-- Seed default plans
INSERT INTO plans (name, slug, price, credits, features, stripe_price_id) VALUES
('Starter', 'starter', 299, 30, '["30 contact reveals per month", "Browse all companies", "Basic search filters", "Save companies", "Email support"]', NULL),
('Professional', 'professional', 499, 50, '["50 contact reveals per month", "Priority search ranking", "Advanced filters", "Company analytics", "Priority support", "Export contacts"]', NULL),
('Enterprise', 'enterprise', 0, -1, '["Unlimited contact reveals", "Custom integrations", "Dedicated account manager", "API access", "Custom branding", "SLA guarantee"]', NULL);

-- Seed countries
INSERT INTO countries (name, code, region) VALUES
('Malta', 'MT', 'Europe'),
('United Kingdom', 'GB', 'Europe'),
('Gibraltar', 'GI', 'Europe'),
('Isle of Man', 'IM', 'Europe'),
('Curaçao', 'CW', 'Caribbean'),
('Sweden', 'SE', 'Europe'),
('Denmark', 'DK', 'Europe'),
('Spain', 'ES', 'Europe'),
('Italy', 'IT', 'Europe'),
('Germany', 'DE', 'Europe'),
('France', 'FR', 'Europe'),
('Netherlands', 'NL', 'Europe'),
('Poland', 'PL', 'Europe'),
('Romania', 'RO', 'Europe'),
('Portugal', 'PT', 'Europe'),
('Ireland', 'IE', 'Europe'),
('Latvia', 'LV', 'Europe'),
('Lithuania', 'LT', 'Europe'),
('Estonia', 'EE', 'Europe'),
('Bulgaria', 'BG', 'Europe'),
('Czech Republic', 'CZ', 'Europe'),
('Greece', 'GR', 'Europe'),
('Cyprus', 'CY', 'Europe'),
('Ukraine', 'UA', 'Europe'),
('Georgia', 'GE', 'Europe'),
('Philippines', 'PH', 'Asia'),
('India', 'IN', 'Asia'),
('Japan', 'JP', 'Asia'),
('Australia', 'AU', 'Oceania'),
('New Zealand', 'NZ', 'Oceania'),
('Canada', 'CA', 'Americas'),
('United States', 'US', 'Americas'),
('Brazil', 'BR', 'Americas'),
('Mexico', 'MX', 'Americas'),
('Argentina', 'AR', 'Americas'),
('South Africa', 'ZA', 'Africa'),
('Nigeria', 'NG', 'Africa'),
('Kenya', 'KE', 'Africa');
