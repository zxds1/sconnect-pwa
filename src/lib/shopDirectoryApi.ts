import { apiFetch } from './apiClient';

export type ShopDirectoryEntry = {
  id?: string;
  seller_id?: string;
  name?: string;
  category?: string;
  rating?: number;
  verified?: boolean;
  location?: string | { address?: string; lat?: number; lng?: number };
  products?: number;
  total_products?: number;
  stars_earned?: number;
  last_sync_at?: string;
};

export type ShopProfile = Record<string, any>;
export type ShopStats = Record<string, any>;

const unwrapList = <T>(data: any): T[] => {
  if (Array.isArray(data)) return data;
  if (data?.items && Array.isArray(data.items)) return data.items;
  if (data?.shops && Array.isArray(data.shops)) return data.shops;
  return [];
};

const buildQuery = (params: Record<string, string | number | boolean | undefined>) => {
  const query = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== '' && value !== null)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join('&');
  return query ? `?${query}` : '';
};

export const searchShops = async (params: {
  query?: string;
  category?: string;
  minRating?: number;
  verified?: boolean;
  lat?: number;
  lng?: number;
  radiusKm?: number;
  sort?: string;
} = {}): Promise<ShopDirectoryEntry[]> =>
  unwrapList(await apiFetch(`/v1/shops${buildQuery(params)}`));

export const getShopProfile = async (id: string): Promise<ShopProfile> =>
  apiFetch(`/v1/shops/${id}`);

export const getShopProducts = async (id: string): Promise<any[]> =>
  unwrapList(await apiFetch(`/v1/shops/${id}/products`));

export const getShopStats = async (id: string): Promise<ShopStats> =>
  apiFetch(`/v1/shops/${id}/stats`);

export const listShopFavorites = async (): Promise<any[]> =>
  unwrapList(await apiFetch('/v1/shops/favorites'));

export const addShopFavorite = async (sellerId: string): Promise<any> =>
  apiFetch('/v1/shops/favorites', {
    method: 'POST',
    body: JSON.stringify({ seller_id: sellerId }),
  });

export const removeShopFavorite = async (sellerId: string): Promise<void> => {
  await apiFetch(`/v1/shops/favorites/${sellerId}`, { method: 'DELETE' });
};
