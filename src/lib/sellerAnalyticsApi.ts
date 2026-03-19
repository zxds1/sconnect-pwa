import { apiFetch } from './apiClient';

export type KPISummary = {
  seller_id?: string;
  revenue?: string;
  orders?: number;
  margin?: string;
  gross_revenue?: string;
  net_revenue?: string;
  aov?: string;
  conversion_rate?: number;
  repeat_rate_d30?: number;
  sessions?: number;
  pdp_views_per_session?: number;
  cart_abandonment?: number;
};

export type FunnelMetrics = {
  seller_id?: string;
  sessions?: number;
  pdp_views?: number;
  add_to_cart?: number;
  checkout_start?: number;
  payment_success?: number;
  cart_abandonment?: number;
};

export type InventoryInsight = {
  seller_id?: string;
  stockout_risk?: number;
  reorder_point?: number;
  days_cover?: number;
  inventory_value?: number;
};

export type BuyerInsight = {
  seller_id?: string;
  clv?: string;
  cac?: string;
  new_buyers?: number;
  repeat_rate?: number;
};

export type MarketBenchmarks = {
  seller_id?: string;
  price_position?: number;
  competitor_stock?: number;
  market_share?: number;
  competitor_median_price?: number;
};

export type Anomaly = {
  seller_id?: string;
  type?: string;
  severity?: number;
  details?: string;
  created_at?: string;
};

const unwrapList = <T>(data: any): T[] => {
  if (Array.isArray(data)) return data;
  if (data?.items && Array.isArray(data.items)) return data.items;
  return [];
};

export const getSellerKpiSummary = async (): Promise<KPISummary> =>
  apiFetch('/v1/analytics/dashboard');

export const getSellerFunnel = async (): Promise<FunnelMetrics> =>
  apiFetch('/v1/analytics/funnel');

export const getSellerInventoryInsight = async (): Promise<InventoryInsight> =>
  apiFetch('/v1/analytics/inventory');

export const getSellerBuyerInsight = async (): Promise<BuyerInsight> =>
  apiFetch('/v1/analytics/buyers');

export const getSellerMarketBenchmarks = async (): Promise<MarketBenchmarks> =>
  apiFetch('/v1/analytics/market');

export const listSellerAnomalies = async (): Promise<Anomaly[]> =>
  unwrapList(await apiFetch('/v1/analytics/anomalies'));

export const requestSellerWhatsAppDailySummary = async () =>
  apiFetch('/v1/seller/comms/whatsapp/daily-summary', { method: 'POST' });
