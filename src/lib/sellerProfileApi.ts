import { apiFetch } from './apiClient';

export type SellerProfile = {
  seller_id?: string;
  name?: string;
  description?: string;
  logo_url?: string;
  categories?: string[];
  hours?: Record<string, any>;
  service_area?: Record<string, any>;
};

export type SellerLocation = {
  id?: string;
  address?: string;
  lat?: number;
  lng?: number;
};

const unwrapList = <T>(data: any): T[] => {
  if (Array.isArray(data)) return data;
  if (data?.items && Array.isArray(data.items)) return data.items;
  return [];
};

export const getSellerProfile = async (): Promise<SellerProfile> =>
  apiFetch('/v1/seller/profile');

export const updateSellerProfile = async (payload: {
  name?: string;
  description?: string;
  logo_url?: string;
  categories?: string[];
  hours?: Record<string, any>;
  service_area?: Record<string, any>;
}) =>
  apiFetch('/v1/seller/profile', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });

export const listSellerLocations = async (): Promise<SellerLocation[]> =>
  unwrapList(await apiFetch('/v1/seller/locations'));

export const createSellerLocation = async (payload: { address: string; lat?: number; lng?: number }) =>
  apiFetch('/v1/seller/locations', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const updateSellerLocation = async (id: string, payload: { address: string; lat?: number; lng?: number }) =>
  apiFetch(`/v1/seller/locations/${id}`,
    {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }
  );
