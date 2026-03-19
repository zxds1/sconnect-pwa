import { apiFetch } from './apiClient';

export type SellerProduct = {
  id: string;
  seller_id?: string;
  product_id: string;
  alias?: string;
  neighborhood?: string;
  category_id?: string;
  current_price?: number;
  discount_price?: number | null;
  stock_level?: number;
  stock_status?: string;
  is_featured?: boolean;
  group_buy_eligible?: boolean;
  group_buy_tiers?: Array<{ qty: number; price: number; discount?: string }>;
  updated_at?: string;
};

export type SellerProductInsight = {
  seller_product_id?: string;
  views?: number;
  clicks?: number;
  conversions?: number;
  updated_at?: string;
};

export type SellerLowStock = {
  seller_product_id?: string;
  stock_level?: number;
  status?: string;
};

const unwrapList = <T>(data: any): T[] => {
  if (Array.isArray(data)) return data;
  if (data?.items && Array.isArray(data.items)) return data.items;
  return [];
};

export const listSellerProducts = async (): Promise<SellerProduct[]> =>
  unwrapList(await apiFetch('/v1/seller/products'));

export const createSellerProduct = async (payload: {
  product_id: string;
  alias?: string;
  neighborhood?: string;
  category_id?: string;
  current_price?: number;
  discount_price?: number | null;
  stock_level?: number;
  stock_status?: string;
  is_featured?: boolean;
  group_buy_eligible?: boolean;
  group_buy_tiers?: Array<{ qty: number; price: number; discount?: string }>;
}): Promise<SellerProduct> =>
  apiFetch('/v1/seller/products', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const updateSellerProduct = async (id: string, payload: {
  alias?: string;
  neighborhood?: string;
  category_id?: string;
  current_price?: number;
  discount_price?: number | null;
  stock_level?: number;
  stock_status?: string;
  is_featured?: boolean;
  group_buy_eligible?: boolean;
  group_buy_tiers?: Array<{ qty: number; price: number; discount?: string }>;
}): Promise<SellerProduct> =>
  apiFetch(`/v1/seller/products/${id}`,
    {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }
  );

export const deleteSellerProduct = async (id: string) =>
  apiFetch(`/v1/seller/products/${id}`, { method: 'DELETE' });

export const updateSellerProductPrice = async (id: string, payload: {
  current_price: number;
  discount_price?: number | null;
}): Promise<SellerProduct> =>
  apiFetch(`/v1/seller/products/${id}/price`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });

export const updateSellerProductStock = async (id: string, payload: { stock_level: number }): Promise<SellerProduct> =>
  apiFetch(`/v1/seller/products/${id}/stock`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });

export const bulkPriceUpdateSellerProducts = async () =>
  apiFetch('/v1/seller/products/bulk/price', { method: 'POST' });

export const bulkStockUpdateSellerProducts = async () =>
  apiFetch('/v1/seller/products/bulk/stock', { method: 'POST' });

export const bulkImportSellerProducts = async () =>
  apiFetch('/v1/seller/products/bulk/import', { method: 'POST' });

export const featureSellerProduct = async (id: string) =>
  apiFetch(`/v1/seller/products/${id}/feature`, { method: 'POST' });

export const addSellerProductMedia = async (id: string, payload: { url: string; media_type?: string }) =>
  apiFetch(`/v1/seller/products/${id}/media`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const removeSellerProductMedia = async (id: string, mediaId: string) =>
  apiFetch(`/v1/seller/products/${id}/media/${mediaId}`, { method: 'DELETE' });

export const listSellerProductInsights = async (): Promise<SellerProductInsight[]> =>
  unwrapList(await apiFetch('/v1/seller/products/insights'));

export const listSellerLowStock = async (): Promise<SellerLowStock[]> =>
  unwrapList(await apiFetch('/v1/seller/products/low-stock'));
