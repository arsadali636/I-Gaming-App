import Stripe from "stripe";
import { env } from "./env";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    const key = env.STRIPE_SECRET_KEY || "sk_test_mock_key_for_local_dev_only";
    _stripe = new Stripe(key, {
      typescript: true,
    });
  }
  return _stripe;
}

// Lazy proxy for backwards compatibility
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop, receiver) {
    const client = getStripe();
    const value = Reflect.get(client, prop, receiver);
    if (typeof value === "function") {
      return value.bind(client);
    }
    return value;
  },
});

export const STRIPE_PLANS = {
  starter: {
    name: "Starter",
    price: 299,
    credits: 30,
    stripePriceId: env.STRIPE_STARTER_PRICE_ID,
  },
  professional: {
    name: "Professional",
    price: 499,
    credits: 50,
    stripePriceId: env.STRIPE_PROFESSIONAL_PRICE_ID,
  },
  enterprise: {
    name: "Enterprise",
    price: 0,
    credits: -1,
    stripePriceId: "",
  },
} as const;
