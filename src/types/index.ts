export type UserRole = "super_admin" | "admin" | "moderator" | "company_owner" | "company_member" | "professional";

export interface User {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  telegram_id?: string;
  instagram?: string;
  discord?: string;
  avatar_url?: string;
  role: UserRole;
  company_id?: string;
  created_at: string;
  updated_at: string;
}

export interface BusinessRole {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  status: "active" | "inactive";
  sort_order: number;
}

export interface CompanySize {
  id: string;
  label: string;
  min_employees: number;
  max_employees: number;
  status: "active" | "inactive";
  sort_order: number;
}

export interface Company {
  id: string;
  name: string;
  slug: string;
  logo_url?: string;
  description: string;
  website?: string;
  founded_year?: number;
  headquarters?: string;
  country_id?: string;
  market?: string;
  employee_count?: string;
  revenue_range?: string;
  business_role_id?: string;
  business_role?: BusinessRole;
  company_size_id?: string;
  company_size?: CompanySize | string;
  city?: string;
  state_region?: string;
  marketplace_visibility?: "visible" | "hidden";
  status: "pending" | "approved" | "rejected" | "suspended";
  is_verified: boolean;
  is_featured: boolean;
  verification_status: "unverified" | "pending" | "verified";
  created_by: string;
  created_at: string;
  updated_at: string;

  // Optional relations and marketplace calculations
  categories?: any[];
  category_ids?: string[];
  country?: any;
  topGeos?: any[];
  allGeos?: any[];
  softwareTypes?: any[];
  serviceTypes?: any[];
  licenses?: any[];
  completionPercentage?: number;
  is_unlocked?: boolean;
  contact_locked?: boolean;
  owner_user?: any;
  contact_email?: string | null;
}


export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  color?: string;
  company_count?: number;
}

export interface Country {
  id: string;
  name: string;
  code: string;
  region?: string;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  category_id?: string;
}

export interface Service {
  id: string;
  name: string;
  description?: string;
  category_id?: string;
}

export interface CompanyLicense {
  id: string;
  company_id: string;
  license_name: string;
  jurisdiction: string;
  license_number?: string;
  status: "active" | "pending" | "expired";
}

export interface CompanyContact {
  id: string;
  company_id: string;
  full_name: string;
  position: string;
  email?: string | null;
  phone?: string | null;
  linkedin?: string | null;
  is_primary: boolean;
  locked?: boolean;
  is_unlocked?: boolean;
}

export interface CompanyMember {
  id: string;
  company_id: string;
  user_id: string;
  role: "owner" | "admin" | "member";
  invited_at?: string;
  accepted_at?: string;
}

export interface Plan {
  id: string;
  name: string;
  slug: string;
  price: number;
  credits: number;
  features: string[];
  stripe_price_id?: string;
  is_active: boolean;
}

export interface Subscription {
  id: string;
  user_id: string;
  plan_id: string;
  stripe_subscription_id?: string;
  stripe_customer_id?: string;
  status: "active" | "canceled" | "past_due" | "trialing";
  current_period_start?: string;
  current_period_end?: string;
  created_at: string;
}

export interface ContactCreditWallet {
  id: string;
  user_id: string;
  balance: number;
  total_earned: number;
  total_used: number;
}

export interface ContactCreditTransaction {
  id: string;
  wallet_id: string;
  user_id: string;
  type: "credit" | "debit" | "refund" | "bonus";
  amount: number;
  description: string;
  reference_id?: string;
  created_at: string;
}

export interface RevealedContact {
  id: string;
  user_id: string;
  company_contact_id?: string | null;
  company_id?: string | null;
  revealed_at: string;
}


export interface Connection {
  id: string;
  requester_id: string;
  receiver_id: string;
  status: "pending" | "accepted" | "rejected" | "blocked";
  message?: string;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

export interface Conversation {
  id: string;
  participant_1_id: string;
  participant_2_id: string;
  last_message_at?: string;
  created_at: string;
}

export interface Opportunity {
  id: string;
  title: string;
  description: string;
  type: "looking_for" | "offering" | "partnership";
  category_id?: string;
  created_by: string;
  company_id?: string;
  status: "open" | "closed" | "filled";
  budget?: string;
  timeline?: string;
  created_at: string;
  updated_at: string;
}

export interface SavedCompany {
  id: string;
  user_id: string;
  company_id: string;
  notes?: string;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  link?: string;
  created_at: string;
}

export interface VerificationRequest {
  id: string;
  company_id: string;
  requested_by: string;
  documents: string[];
  status: "pending" | "approved" | "rejected";
  reviewed_by?: string;
  review_notes?: string;
  created_at: string;
  reviewed_at?: string;
}

export interface Report {
  id: string;
  reporter_id: string;
  target_type: "company" | "user" | "message";
  target_id: string;
  reason: string;
  description?: string;
  status: "pending" | "reviewed" | "resolved" | "dismissed";
  reviewed_by?: string;
  created_at: string;
  reviewed_at?: string;
}

export interface AuditLog {
  id: string;
  user_id?: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  details?: Record<string, unknown>;
  ip_address?: string;
  created_at: string;
}

export interface MarketplaceFilters {
  search?: string;
  category?: string;
  country?: string;
  market?: string;
  verified?: boolean;
  page?: number;
  limit?: number;
  sort?: "newest" | "oldest" | "name" | "featured";
}
