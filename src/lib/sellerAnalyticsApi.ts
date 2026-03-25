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
  items_per_order?: number;
  rating_avg?: number;
  rating_count?: number;
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
  total_stock?: number;
  total_items?: number;
  low_stock?: number;
  top_categories?: Array<{ category?: string; count?: number }>;
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
  competitor_pricing?: Array<{ category?: string; your_price?: number; market_price?: number }>;
};

export type Anomaly = {
  seller_id?: string;
  type?: string;
  severity?: number;
  details?: string;
  created_at?: string;
};

export type ChannelMixItem = {
  channel?: string;
  label?: string;
  value?: number;
  pct?: number;
  count?: number;
};

export type MarketDemandItem = {
  category?: string;
  demand?: number;
  seller_share?: number;
  sellerShare?: number;
};

export type MarketTrendingItem = {
  name?: string;
  searches?: number;
  trend?: string;
  category?: string;
  category_path?: string;
};

export type TrendingSupplierItem = {
  name?: string;
  searches?: number;
  trend?: string;
  category?: string;
  category_path?: string;
  supplier_id?: string;
  supplier_name?: string;
  supplier_rating?: number;
  supplier_verified?: boolean;
};

export type CustomerDemographicItem = {
  segment?: string;
  name?: string;
  percent?: number;
  value?: number;
  color?: string;
};

export type SellerAlert = {
  type?: string;
  label?: string;
  unit?: string;
  threshold?: number;
  active?: boolean;
};

export type LiveBuyerPoint = {
  lat?: number;
  lng?: number;
  scan_count?: number;
  scanCount?: number;
};

export type PeakHourItem = {
  hour?: number;
  searches?: number;
};

export type SalesSeriesItem = {
  date?: string;
  label?: string;
  sales?: number;
  orders?: number;
  sessions?: number;
  views?: number;
  reach?: number;
};

export type SalesVelocityItem = {
  date?: string;
  label?: string;
  orders?: number;
  sessions?: number;
  velocity?: number;
};

export type InventorySeriesItem = {
  date?: string;
  label?: string;
  stock_level?: number;
  stockLevel?: number;
};

export type ConversionSeriesItem = {
  date?: string;
  label?: string;
  orders?: number;
  sessions?: number;
  conversion_rate?: number;
  conversionRate?: number;
};

export type TopProductItem = {
  seller_product_id?: string;
  product_id?: string;
  name?: string;
  orders?: number;
  units?: number;
  revenue?: number;
  current_price?: number;
};

export type DataQuality = {
  coverage?: number;
  media_coverage?: number;
  category_coverage?: number;
  freshness_days?: number;
  verification_rate?: number;
  anomaly_rate?: number;
};

export type PerformanceAnalysis = {
  seller_id?: string;
  window_days?: number;
  total_sales_kes?: number;
  transaction_count?: number;
  average_basket_kes?: number;
  sales_growth_pct?: number;
  category_revenue_share?: Array<{ category?: string; revenue?: number; share_pct?: number }>;
  hourly_patterns?: Array<{ hour?: number; revenue?: number; orders?: number }>;
  weekday_patterns?: Array<{ weekday?: string; revenue?: number; orders?: number }>;
};

export type ProductPerformanceItem = {
  seller_product_id?: string;
  product_id?: string;
  name?: string;
  category?: string;
  revenue?: number;
  units_sold?: number;
  velocity_per_day?: number;
  growth_pct?: number;
  days_since_last_sale?: number;
  slow_mover?: boolean;
};

export type ProductPerformanceAnalysis = {
  seller_id?: string;
  window_days?: number;
  items?: ProductPerformanceItem[];
};

export type PricingCompetitiveItem = {
  seller_product_id?: string;
  product_id?: string;
  name?: string;
  category?: string;
  store_avg_price?: number;
  market_avg_price?: number;
  market_min_price?: number;
  market_max_price?: number;
  price_position?: string;
  price_index?: number;
  velocity_per_day?: number;
};

export type PricingCompetitiveAnalysis = {
  seller_id?: string;
  window_days?: number;
  items?: PricingCompetitiveItem[];
};

export type CategoryHealthItem = {
  category?: string;
  revenue_share_pct?: number;
  growth_pct?: number;
  avg_items?: number;
  velocity_per_day?: number;
};

export type CategoryHealthAnalysis = {
  seller_id?: string;
  window_days?: number;
  items?: CategoryHealthItem[];
};

export type DemandStockItem = {
  seller_product_id?: string;
  product_id?: string;
  name?: string;
  category?: string;
  avg_daily_units_30d?: number;
  stock_level?: number;
  stock_coverage_days?: number;
  stockout_risk?: boolean;
  overstock_risk?: boolean;
  reorder_point?: number;
  recommended_reorder?: number;
};

export type DemandStockAnalysis = {
  seller_id?: string;
  items?: DemandStockItem[];
};

export type ActionRecommendations = {
  seller_id?: string;
  generated_at?: string;
  stock_more?: Array<{ action?: string; product_id?: string; name?: string; category?: string; value?: number; reason?: string }>;
  reduce_drop?: Array<{ action?: string; product_id?: string; name?: string; category?: string; value?: number; reason?: string }>;
  raise_prices?: Array<{ action?: string; product_id?: string; name?: string; category?: string; value?: number; reason?: string }>;
  lower_prices?: Array<{ action?: string; product_id?: string; name?: string; category?: string; value?: number; reason?: string }>;
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

export const getSellerChannelMix = async (): Promise<ChannelMixItem[]> =>
  unwrapList(await apiFetch('/v1/seller/channel-mix'));

export const getSellerMarketDemand = async (): Promise<MarketDemandItem[]> =>
  unwrapList(await apiFetch('/v1/seller/market/demand'));

export const getSellerMarketTrending = async (): Promise<MarketTrendingItem[]> =>
  unwrapList(await apiFetch('/v1/seller/market/trending'));

export const getSellerTrendingSuppliers = async (): Promise<TrendingSupplierItem[]> =>
  unwrapList(await apiFetch('/v1/seller/market/trending-suppliers'));

export const getSellerCustomerDemographics = async (): Promise<CustomerDemographicItem[]> =>
  unwrapList(await apiFetch('/v1/seller/customers/demographics'));

export const getSellerAlerts = async (): Promise<SellerAlert[]> =>
  unwrapList(await apiFetch('/v1/seller/alerts'));

export const updateSellerAlerts = async (items: SellerAlert[]): Promise<SellerAlert[]> =>
  unwrapList(
    await apiFetch('/v1/seller/alerts', {
      method: 'PUT',
      body: JSON.stringify({ items }),
    }),
  );

export const getSellerLiveBuyers = async (windowHours?: number): Promise<LiveBuyerPoint[]> =>
  unwrapList(await apiFetch(`/v1/seller/live-buyers${windowHours ? `?window=${windowHours}` : ''}`));

export const getSellerPeakHours = async (days?: number): Promise<PeakHourItem[]> =>
  unwrapList(await apiFetch(`/v1/seller/peak-hours${days ? `?days=${days}` : ''}`));

export const getSellerSalesSeries = async (days?: number): Promise<SalesSeriesItem[]> =>
  unwrapList(await apiFetch(`/v1/seller/timeseries/sales${days ? `?days=${days}` : ''}`));

export const getSellerSalesVelocity = async (days?: number): Promise<SalesVelocityItem[]> =>
  unwrapList(await apiFetch(`/v1/seller/sales/velocity${days ? `?days=${days}` : ''}`));

export const getSellerInventorySeries = async (days?: number): Promise<InventorySeriesItem[]> =>
  unwrapList(await apiFetch(`/v1/seller/timeseries/inventory${days ? `?days=${days}` : ''}`));

export const getSellerConversionSeries = async (days?: number): Promise<ConversionSeriesItem[]> =>
  unwrapList(await apiFetch(`/v1/seller/timeseries/conversion${days ? `?days=${days}` : ''}`));

export const getSellerTopProducts = async (days?: number, limit?: number): Promise<TopProductItem[]> => {
  const params = new URLSearchParams();
  if (days && days > 0) params.set('days', String(days));
  if (limit && limit > 0) params.set('limit', String(limit));
  const query = params.toString();
  return unwrapList(await apiFetch(`/v1/seller/top-products${query ? `?${query}` : ''}`));
};

export const getSellerDataQuality = async (): Promise<DataQuality> =>
  apiFetch('/v1/seller/data-quality');

export const getSellerPerformanceAnalysis = async (days?: number): Promise<PerformanceAnalysis> =>
  apiFetch(`/v1/analytics/performance${days ? `?days=${days}` : ''}`);

export const getSellerProductPerformance = async (days?: number, limit?: number): Promise<ProductPerformanceAnalysis> => {
  const params = new URLSearchParams();
  if (days && days > 0) params.set('days', String(days));
  if (limit && limit > 0) params.set('limit', String(limit));
  const query = params.toString();
  return apiFetch(`/v1/analytics/products${query ? `?${query}` : ''}`);
};

export const getSellerPricingCompetitiveAnalysis = async (days?: number, limit?: number): Promise<PricingCompetitiveAnalysis> => {
  const params = new URLSearchParams();
  if (days && days > 0) params.set('days', String(days));
  if (limit && limit > 0) params.set('limit', String(limit));
  const query = params.toString();
  return apiFetch(`/v1/analytics/pricing${query ? `?${query}` : ''}`);
};

export const getSellerCategoryHealthAnalysis = async (days?: number): Promise<CategoryHealthAnalysis> =>
  apiFetch(`/v1/analytics/categories${days ? `?days=${days}` : ''}`);

export const getSellerDemandStockAnalysis = async (): Promise<DemandStockAnalysis> =>
  apiFetch('/v1/analytics/demand-stock');

export const getSellerActionRecommendations = async (): Promise<ActionRecommendations> =>
  apiFetch('/v1/analytics/recommendations');
