import { apiFetch } from './apiClient';

const unwrapList = <T>(data: any): T[] => {
  if (Array.isArray(data)) return data;
  if (data?.items && Array.isArray(data.items)) return data.items;
  return [];
};

export interface CompareList {
  id: string;
  user_id?: string;
  tenant_id?: string;
  items: CompareListItem[];
  updated_at?: string;
}

export interface CompareListItem {
  id: string;
  product_id: string;
  product_name?: string;
  product_image_url?: string;
  created_at?: string;
}

export interface CompareAnalysisResponse {
  product_id: string;
  product: CompareProduct;
  offers: CompareOffer[];
  tabs: string[];
}

export interface CompareProduct {
  id: string;
  name: string;
  image_url?: string;
  brand?: string;
  category_id?: string;
}

export interface CompareLocation {
  lat: number;
  lng: number;
  address?: string;
}

export interface CompareProductSummary {
  refurb_status?: string;
  accessories_score?: number;
  packaging_score?: number;
  installation_score?: number;
}

export interface CompareOffer {
  offer_id: string;
  seller_id: string;
  seller_name?: string;
  price?: number;
  currency?: string;
  availability_status?: string;
  stock_status?: string;
  rating?: number;
  value_score?: number;
  price_score?: number;
  convenience_score?: number;
  trust_score?: number;
  product_quality_score?: number;
  ownership_cost_score?: number;
  distance_km?: number;
  pickup_eta_minutes?: number;
  delivery_eta_minutes?: number;
  warranty_months?: number;
  warranty_label?: string;
  trust_label?: string;
  quality_label?: string;
  price_position?: string;
  convenience_note?: string;
  location?: CompareLocation;
  product_summary?: CompareProductSummary;
  badges?: string[];
}

export interface CompareMapResponse {
  product_id: string;
  items: CompareMapItem[];
}

export interface CompareMapItem {
  seller_id: string;
  seller_name?: string;
  offer_id?: string;
  price?: number;
  lat?: number;
  lng?: number;
  distance_km?: number;
  badges?: string[];
  location?: CompareLocation;
  seller_address?: string;
  address?: string;
}

export interface CompareHistoryItem {
  id: string;
  product_id: string;
  product_name?: string;
  event_type?: string;
  created_at?: string;
}

export const getCompareList = async (): Promise<CompareList> => apiFetch('/v1/compare');

export const addCompareItem = async (payload: { product_id: string }) =>
  apiFetch('/v1/compare', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const removeCompareItem = async (productId: string) =>
  apiFetch(`/v1/compare/${productId}`, {
    method: 'DELETE',
  });

export const getCompareAnalysis = async (params: { product_id: string; lat?: number; lng?: number; region_id?: string }): Promise<CompareAnalysisResponse> => {
  const search = new URLSearchParams({ product_id: params.product_id });
  if (params.lat !== undefined) search.set('lat', String(params.lat));
  if (params.lng !== undefined) search.set('lng', String(params.lng));
  if (params.region_id) search.set('region_id', params.region_id);
  return apiFetch(`/v1/compare/analysis?${search.toString()}`);
};

export const getCompareMap = async (params: { product_id: string; lat?: number; lng?: number; region_id?: string }): Promise<CompareMapResponse> => {
  const search = new URLSearchParams({ product_id: params.product_id });
  if (params.lat !== undefined) search.set('lat', String(params.lat));
  if (params.lng !== undefined) search.set('lng', String(params.lng));
  if (params.region_id) search.set('region_id', params.region_id);
  return apiFetch(`/v1/compare/map?${search.toString()}`);
};

export const getCompareHistory = async (limit = 25): Promise<CompareHistoryItem[]> => unwrapList(await apiFetch(`/v1/compare/history?limit=${limit}`));
