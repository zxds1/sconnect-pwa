import { coreFetch } from "./adminApi";

export type GrowthHealth = {
  seller_id: string;
  sokoscore: number;
  loan_limit: string;
  repayment_risk: string;
  components?: Record<string, unknown>;
  calculated_at?: string;
};

export type GrowthProjection = {
  seller_id: string;
  type: string;
  status: string;
  confidence?: number;
  reasons?: string[];
  forecast?: Record<string, unknown>;
  generated_at?: string;
  updated_at?: string;
};

export type SubscriptionState = {
  subscription: {
    id: string;
    seller_id: string;
    plan_tier: string;
    status: string;
    renewal_date?: string;
    auto_renew?: boolean;
    created_at?: string;
    updated_at?: string;
  };
  usage: {
    seller_id: string;
    year_month?: string;
    messages_used?: number;
    api_calls?: number;
    storage_mb?: number;
    group_buys?: number;
  };
  limits: Record<string, unknown>;
};

export type InvoiceItem = {
  id: string;
  seller_id: string;
  period_start?: string;
  period_end?: string;
  status: string;
  amount_due?: string;
  paid_at?: string;
  method?: string;
  pdf_s3_key?: string;
};

export type BillingEvent = {
  id: string;
  kind: string;
  status: string;
  source: string;
  payload?: Record<string, unknown>;
  error_text?: string;
  created_at?: string;
  processed_at?: string;
};

const unwrapItems = <T,>(payload: any, key = "items"): T[] => (Array.isArray(payload?.[key]) ? payload[key] : []);

export const getPhase3Snapshot = async () => {
  const [health, projection, subscription, invoices, billingEvents] = await Promise.all([
    coreFetch("/seller/financial/health").catch(() => null),
    coreFetch("/seller/growth/projections?type=cashflow").catch(() => null),
    coreFetch("/subscriptions/me").catch(() => null),
    coreFetch("/subscriptions/invoices").then((data) => unwrapItems<InvoiceItem>(data)).catch(() => []),
    coreFetch("/billing/events").then((data) => unwrapItems<BillingEvent>(data)).catch(() => []),
  ]);

  return { health, projection, subscription, invoices, billingEvents };
};
