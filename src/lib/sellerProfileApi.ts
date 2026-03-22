import { apiFetch } from './apiClient';

export type SellerProfile = {
  seller_id?: string;
  name?: string;
  description?: string;
  logo_url?: string;
  categories?: string[];
  hours?: Record<string, any>;
  service_area?: Record<string, any>;
  seller_mode?: string;
  place_id?: string;
  default_region_id?: string;
  default_lat?: number;
  default_lng?: number;
  location_mode?: string;
  service_regions?: string[];
  market_name?: string;
  visual_marker?: string;
  delivery_radius_km?: number;
  whatsapp_number?: string;
  shop_front_image_url?: string;
  directions_note?: string;
  landmarks?: ShopLandmark[];
  daily_lat?: number;
  daily_lng?: number;
  delivery_details?: DeliveryDetails;
};

export type ShopLandmark = {
  id?: string;
  label: string;
  type?: string;
  image_url: string;
  lat?: number;
  lng?: number;
  sequence?: number;
};

export type DeliveryDetails = {
  offers_delivery?: boolean;
  delivery_radius_km?: number;
  delivery_zones?: string[];
  delivery_fee_flat?: number;
  delivery_fee_per_km?: number;
  free_delivery_threshold?: number;
  minimum_order_value?: number;
  average_eta_minutes?: number;
  same_day_available?: boolean;
  same_day_cutoff_time?: string;
  delivery_days?: string[];
  delivery_hours?: string;
  pickup_available?: boolean;
  pickup_instructions?: string;
  cash_on_delivery?: boolean;
  delivery_partner?: string;
  order_tracking_method?: string;
  payment_options?: string[];
  installation_services?: string;
  after_sales_support?: string;
};

export type SellerLocation = {
  id?: string;
  address?: string;
  lat?: number;
  lng?: number;
  region_id?: string;
  place_id?: string;
  source?: string;
};

export type SellerRank = {
  seller_id?: string;
  rank?: number;
  breakdown?: Record<string, any>;
};

export type SellerMetrics = {
  seller_id?: string;
  followers?: number;
  reviews?: number;
  avg_rating?: number;
  stars_24h?: number;
  engagement_views?: number;
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
  seller_mode?: string;
  place_id?: string;
  default_region_id?: string;
  location_mode?: string;
  service_regions?: string[];
  market_name?: string;
  visual_marker?: string;
  delivery_radius_km?: number;
  whatsapp_number?: string;
  shop_front_image_url?: string;
  directions_note?: string;
  landmarks?: ShopLandmark[];
  daily_lat?: number;
  daily_lng?: number;
  delivery_details?: DeliveryDetails;
}) =>
  apiFetch('/v1/seller/profile', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });

export const listSellerLocations = async (): Promise<SellerLocation[]> =>
  unwrapList(await apiFetch('/v1/seller/locations'));

export const createSellerLocation = async (payload: { address: string; lat?: number; lng?: number; region_id?: string; place_id?: string; source?: string }) =>
  apiFetch('/v1/seller/locations', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const updateSellerLocation = async (id: string, payload: { address: string; lat?: number; lng?: number; region_id?: string; place_id?: string; source?: string }) =>
  apiFetch(`/v1/seller/locations/${id}`,
    {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }
  );

export const listSellerLocationHistory = async (): Promise<Array<{
  id: string;
  lat: number;
  lng: number;
  region_id?: string;
  place_id?: string;
  source?: string;
  created_at?: string;
}>> =>
  unwrapList(await apiFetch('/v1/seller/locations/history'));

export const getSellerRank = async (): Promise<SellerRank> =>
  apiFetch('/v1/seller/rank');

export const getSellerMetrics = async (): Promise<SellerMetrics> =>
  apiFetch('/v1/seller/metrics');
