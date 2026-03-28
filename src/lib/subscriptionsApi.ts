import { apiFetch } from './apiClient';

export type Plan = {
  id: string;
  name?: string;
  price?: number;
  features?: Record<string, any>;
  limits?: Record<string, any>;
};

export type Subscription = {
  id: string;
  seller_id?: string;
  plan_tier?: string;
  status?: string;
  renewal_date?: string;
  auto_renew?: boolean;
  created_at?: string;
  updated_at?: string;
};

export type Usage = {
  seller_id?: string;
  date?: string;
  year_month?: string;
  messages_used?: number;
  api_calls?: number;
  storage_mb?: number;
  group_buys?: number;
};

export type SubscriptionView = {
  subscription?: Subscription;
  usage?: Usage;
  limits?: Record<string, any>;
};

export type Invoice = {
  id: string;
  period_start?: string;
  period_end?: string;
  status?: string;
  amount_due?: string;
  paid_at?: string | null;
  method?: string;
  pdf_s3_key?: string;
  download_url?: string;
};

export type BillingEvent = {
  id: string;
  kind?: string;
  status?: string;
  source?: string;
  payload?: Record<string, any>;
  error_text?: string;
  created_at?: string;
  processed_at?: string;
};

export type PaymentResponse = Record<string, any>;

const unwrapList = <T>(data: any): T[] => {
  if (Array.isArray(data)) return data;
  if (data?.items && Array.isArray(data.items)) return data.items;
  return [];
};

export const listPlans = async (): Promise<Plan[]> =>
  unwrapList(await apiFetch('/v1/subscriptions/plans'));

export const getSubscriptionView = async (): Promise<SubscriptionView> =>
  apiFetch('/v1/subscriptions/me');

export const upgradeSubscription = async (payload: { plan_tier: string; mpesa_phone: string }) =>
  apiFetch('/v1/subscriptions/upgrade', { method: 'POST', body: JSON.stringify(payload) });

export const downgradeSubscription = async (payload: { plan_tier: string }) =>
  apiFetch('/v1/subscriptions/downgrade', { method: 'POST', body: JSON.stringify(payload) });

export const cancelSubscription = async () =>
  apiFetch('/v1/subscriptions/cancel', { method: 'POST' });

export const startTrial = async (payload: { plan_tier: string }) =>
  apiFetch('/v1/subscriptions/trial', { method: 'POST', body: JSON.stringify(payload) });

export const reactivateSubscription = async () =>
  apiFetch('/v1/subscriptions/reactivate', { method: 'POST' });

export const listInvoices = async (): Promise<Invoice[]> =>
  unwrapList(await apiFetch('/v1/subscriptions/invoices'));

export const getInvoiceDownloadUrl = async (invoiceId: string): Promise<{ download_url?: string }> =>
  apiFetch(`/v1/subscriptions/invoices/${encodeURIComponent(invoiceId)}/download`);

export const listBillingEvents = async (): Promise<BillingEvent[]> =>
  unwrapList(await apiFetch('/v1/subscriptions/billing-events'));

export const initiatePayment = async (payload: { amount: number; mpesa_phone: string }): Promise<PaymentResponse> =>
  apiFetch('/v1/subscriptions/pay', { method: 'POST', body: JSON.stringify(payload) });

export const getUsage = async (): Promise<Usage> =>
  apiFetch('/v1/subscriptions/usage');

export const getLimits = async (): Promise<Record<string, any>> =>
  apiFetch('/v1/subscriptions/limits');
