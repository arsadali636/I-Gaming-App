import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  full_name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().min(1, "Phone number is required"),
  telegram_id: z.string().min(1, "Telegram ID is required"),
  instagram: z.string().optional(),
  discord: z.string().optional(),
  company_name: z.string().optional(),
  company_size_id: z.string().optional(),
  country_id: z.string().optional(),
  city: z.string().optional(),
  state_region: z.string().optional(),
  business_role_id: z.string().optional(),
});

export const step1RegisterSchema = z.object({
  email: z.string().trim().email("Please enter a valid business email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  full_name: z.string().trim().min(2, "Name must be at least 2 characters"),
  phone: z.string().trim().min(1, "Phone number is required"),
  telegram_id: z.string().trim().min(1, "Telegram ID is required"),
  instagram: z.string().trim().optional(),
  discord: z.string().trim().optional(),
});

export const step2RegisterSchema = z.object({
  company_name: z
    .string()
    .trim()
    .min(2, "Company name must be at least 2 characters")
    .max(100, "Company name cannot exceed 100 characters")
    .refine((val) => !/^(test|asdf|qwerty|1234|abc|none)$/i.test(val), {
      message: "Please enter a valid company name",
    }),
  company_size_id: z.string().min(1, "Please select a company size"),
  country_id: z.string().min(1, "Please select a country"),
  city: z.string().trim().min(2, "City is required"),
  state_region: z.string().trim().optional(),
  business_role_id: z.string().min(1, "Please select a business role"),
});

export const companySchema = z.object({
  name: z.string().min(2, "Company name is required"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  website: z.string().url().optional().or(z.literal("")),
  founded_year: z.number().min(1900).max(new Date().getFullYear()).optional(),
  headquarters: z.string().optional(),
  country_id: z.string().optional(),
  market: z.string().optional(),
  employee_count: z.string().optional(),
  revenue_range: z.string().optional(),
  category_ids: z.array(z.string()).min(1, "Select at least one category"),
  product_ids: z.array(z.string()).optional(),
  service_ids: z.array(z.string()).optional(),
  license_ids: z.array(z.string()).optional(),
});

export const companyContactSchema = z.object({
  full_name: z.string().min(2, "Name is required"),
  position: z.string().min(1, "Position is required"),
  email: z.string().email("Invalid email"),
  phone: z.string().optional(),
  linkedin: z.string().optional(),
  is_primary: z.boolean().default(false),
});

export const opportunitySchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  description: z.string().min(20, "Description must be at least 20 characters"),
  type: z.enum(["looking_for", "offering", "partnership"]),
  category_id: z.string().optional(),
  budget: z.string().optional(),
  timeline: z.string().optional(),
});

export const messageSchema = z.object({
  content: z.string().min(1, "Message cannot be empty").max(5000, "Message too long"),
  conversation_id: z.string().optional(),
  receiver_id: z.string().optional(),
});

export const reportSchema = z.object({
  target_type: z.enum(["company", "user", "message"]),
  target_id: z.string(),
  reason: z.string().min(5, "Reason is required"),
  description: z.string().optional(),
});

export const profileSchema = z.object({
  full_name: z.string().min(2, "Name is required"),
  avatar_url: z.string().url().optional().or(z.literal("")),
});

export const categorySchema = z.object({
  name: z.string().min(2, "Name is required"),
  slug: z.string().optional(),
  description: z.string().optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
});

export const planSchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().optional(),
  price: z.number().min(0),
  credits: z.number().min(-1),
  features: z.array(z.string()),
  stripe_price_id: z.string().optional(),
  is_active: z.boolean().default(true),
});
