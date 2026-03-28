import { apiFetch } from './apiClient';

export type GrowthOverview = {
  revenue_growth?: number;
  buyer_growth?: number;
  retention_rate?: number;
  churn_rate?: number;
};

export type Cashflow = {
  inflow?: string;
  outflow?: string;
  net_cashflow?: string;
  updated_at?: string;
};

export type FinancialHealth = {
  sokoscore?: number;
  loan_limit?: string;
  repayment_risk?: string;
  components?: Record<string, any>;
};

export type LoanEligibility = {
  status?: string;
  max_amount?: number;
  rejection_reasons?: string[];
};

export type Projection = {
  type?: string;
  status?: string;
  confidence?: number;
  reasons?: string[];
  forecast?: Record<string, any>;
  generated_at?: string;
  updated_at?: string;
};

export type LoyaltyOffer = {
  id?: string;
  title?: string;
  discount?: string;
  rules?: Record<string, any>;
  status?: string;
  created_at?: string;
};

export type BulkBuyGroup = {
  id?: string;
  title?: string;
  product_category?: string;
  target_qty?: number;
  status?: string;
};

const unwrapList = <T>(data: any): T[] => {
  if (Array.isArray(data)) return data;
  if (data?.items && Array.isArray(data.items)) return data.items;
  return [];
};

export const getGrowthOverview = async (): Promise<GrowthOverview> =>
  apiFetch('/v1/seller/growth/overview');

export const getGrowthReferrals = async () =>
  apiFetch('/v1/seller/growth/referrals');

export const inviteGrowthReferral = async (payload: { code: string; contact?: string }) =>
  apiFetch('/v1/seller/referrals/invite', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const getCashflow = async (): Promise<Cashflow> =>
  apiFetch('/v1/seller/financial/cashflow');

export const getFinancialHealth = async (): Promise<FinancialHealth> =>
  apiFetch('/v1/seller/financial/health');

export const getLoanEligibility = async (): Promise<LoanEligibility> =>
  apiFetch('/v1/seller/financial/loan-eligibility');

export const requestLoan = async (payload: { amount_requested: number }) =>
  apiFetch('/v1/seller/financial/loan-request', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const getFinancialProjections = async (type?: string): Promise<Projection> =>
  apiFetch(`/v1/seller/financial/projections${type ? `?type=${encodeURIComponent(type)}` : ''}`);

export const getGrowthProjections = async (type?: string): Promise<Projection> =>
  apiFetch(`/v1/seller/growth/projections${type ? `?type=${encodeURIComponent(type)}` : ''}`);

export const getInventoryProjections = async (type?: string): Promise<Projection> =>
  apiFetch(`/v1/seller/inventory/projections${type ? `?type=${encodeURIComponent(type)}` : ''}`);

export const listLoyaltyOffers = async (): Promise<LoyaltyOffer[]> =>
  unwrapList(await apiFetch('/v1/seller/loyalty/offers'));

export const createLoyaltyOffer = async (payload: { title: string; discount: string; rules?: Record<string, any> }): Promise<LoyaltyOffer> =>
  apiFetch('/v1/seller/loyalty/offers', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const activateLoyaltyOffer = async (id: string) =>
  apiFetch(`/v1/seller/loyalty/offers/${id}/activate`, { method: 'POST' });

export const listBulkBuyGroups = async (): Promise<BulkBuyGroup[]> =>
  unwrapList(await apiFetch('/v1/bulk-buy'));

export const createBulkBuyGroup = async (payload: { title: string; product_category: string; target_qty: number }): Promise<BulkBuyGroup> =>
  apiFetch('/v1/bulk-buy', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const joinBulkBuyGroup = async (id: string) =>
  apiFetch(`/v1/bulk-buy/${id}/join`, { method: 'POST' });
