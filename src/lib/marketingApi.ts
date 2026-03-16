import { apiFetch } from './apiClient';

export type Campaign = {
  id: string;
  name?: string;
  objective?: string;
  budget_total?: string;
  spend_to_date?: string;
  targeting_rules?: Record<string, any>;
  status?: string;
  product_id?: string | null;
  channel?: string;
  created_at?: string;
};

export type Promotion = {
  id?: string;
  type?: string;
  title?: string;
  description?: string;
  budget?: string;
  status?: string;
  active?: boolean;
  created_at?: string;
};

export type KPIStat = {
  roas?: number;
  cac?: number;
  ltv?: number;
  date?: string;
};

export type Hotspot = {
  id?: string;
  product_id?: string;
  hotspot_score?: number;
  resolved?: boolean;
  created_at?: string;
};

export type StockAlert = {
  id?: string;
  product_id?: string;
  threshold?: number;
  message?: string;
  status?: string;
};

export type FanOffer = {
  id?: string;
  offer_title?: string;
  discount?: string;
  status?: string;
};

export type CategorySpotlight = {
  id?: string;
  category?: string;
  budget?: string;
  status?: string;
};

export type CampaignStat = {
  campaign_id?: string;
  impressions?: number;
  clicks?: number;
  conversions?: number;
  spend?: number;
  updated_at?: string;
};

export type Referral = {
  id?: string;
  code?: string;
  invited?: number;
  converted?: number;
  reward_amount?: string;
};

const unwrapList = <T>(data: any): T[] => {
  if (Array.isArray(data)) return data;
  if (data?.items && Array.isArray(data.items)) return data.items;
  return [];
};

export const listSellerCampaigns = async (): Promise<Campaign[]> =>
  unwrapList(await apiFetch('/v1/seller/campaigns'));

export const createSellerCampaign = async (payload: {
  name: string;
  objective: string;
  budget_total: number;
  targeting_rules?: Record<string, any>;
  product_id?: string;
  channel: string;
}): Promise<Campaign> =>
  apiFetch('/v1/seller/campaigns', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const updateSellerCampaign = async (id: string, payload: Partial<{
  name: string;
  objective: string;
  budget_total: number;
  targeting_rules: Record<string, any>;
  product_id: string | null;
  channel: string;
  status: string;
}>): Promise<Campaign> =>
  apiFetch(`/v1/seller/campaigns/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });

export const deleteSellerCampaign = async (id: string) =>
  apiFetch(`/v1/seller/campaigns/${id}`, { method: 'DELETE' });

export const activateSellerCampaign = async (id: string) =>
  apiFetch(`/v1/seller/campaigns/${id}/activate`, { method: 'POST' });

export const pauseSellerCampaign = async (id: string) =>
  apiFetch(`/v1/seller/campaigns/${id}/pause`, { method: 'POST' });

export const cloneSellerCampaign = async (id: string): Promise<Campaign> =>
  apiFetch(`/v1/seller/campaigns/${id}/clone`, { method: 'POST' });

export const extendSellerCampaign = async (id: string) =>
  apiFetch(`/v1/seller/campaigns/${id}/extend`, { method: 'POST' });

export const getSellerCampaignStats = async (id: string): Promise<CampaignStat> =>
  apiFetch(`/v1/seller/campaigns/${id}/stats`);

export const listSellerReferrals = async (): Promise<Referral[]> =>
  unwrapList(await apiFetch('/v1/seller/referrals'));

export const inviteSellerReferral = async (payload: { code: string }): Promise<Referral> =>
  apiFetch('/v1/seller/referrals/invite', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const listPromotions = async (): Promise<Promotion[]> =>
  unwrapList(await apiFetch('/v1/seller/marketing/promotions'));

export const createPromotion = async (payload: { type: string; title: string; description?: string; budget: number; expires_at?: string }) =>
  apiFetch('/v1/seller/marketing/promotions', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const activatePromotion = async (id: string) =>
  apiFetch(`/v1/seller/marketing/promotions/${id}/activate`, { method: 'POST' });

export const pausePromotion = async (id: string) =>
  apiFetch(`/v1/seller/marketing/promotions/${id}/pause`, { method: 'POST' });

export const getMarketingKPIs = async (range?: string): Promise<KPIStat> => {
  const suffix = range ? `?range=${encodeURIComponent(range)}` : '';
  return apiFetch(`/v1/seller/marketing/kpis${suffix}`);
};

export const listHotspots = async (): Promise<Hotspot[]> =>
  unwrapList(await apiFetch('/v1/seller/marketing/demand-hotspots'));

export const createStockAlert = async (payload: { product_id: string; threshold: number; message: string }) =>
  apiFetch('/v1/seller/marketing/stock-alerts', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const listStockAlerts = async (): Promise<StockAlert[]> =>
  unwrapList(await apiFetch('/v1/seller/marketing/stock-alerts'));

export const broadcastStockAlerts = async () =>
  apiFetch('/v1/seller/marketing/stock-alerts/broadcast', { method: 'POST' });

export const createFanOffer = async (payload: { offer_title: string; discount: string }) =>
  apiFetch('/v1/seller/marketing/fan-offers', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const listFanOffers = async (): Promise<FanOffer[]> =>
  unwrapList(await apiFetch('/v1/seller/marketing/fan-offers'));

export const createCategorySpotlight = async (payload: { category: string; budget: number }) =>
  apiFetch('/v1/seller/marketing/category-spotlight', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const listCategorySpotlights = async (): Promise<CategorySpotlight[]> =>
  unwrapList(await apiFetch('/v1/seller/marketing/category-spotlight'));

export const activateFeatured = async () =>
  apiFetch('/v1/seller/marketing/featured', { method: 'POST' });
