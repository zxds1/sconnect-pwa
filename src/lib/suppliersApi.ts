import { apiFetch } from './apiClient';

export type Supplier = {
  id: string;
  name?: string;
  category?: string;
  rating?: number;
  verified?: boolean;
  lat?: number;
  lng?: number;
};

export type SupplierOffer = {
  id?: string;
  supplier_id?: string;
  category?: string;
  sku?: string;
  unit_cost?: number;
  moq?: number;
  available_units?: number;
  created_at?: string;
};

export type SupplierDelivery = {
  supplier_id?: string;
  lead_time_days?: number;
  delivery_fee?: number;
  payment_terms?: string;
};

export type RFQThread = {
  id?: string;
  buyer_id?: string;
  category?: string;
  quantity?: number;
  status?: string;
  expiry_at?: string;
  delivery_lat?: number;
  delivery_lng?: number;
  delivery_address?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
};

export type RFQResponse = {
  id?: string;
  rfq_id?: string;
  supplier_id?: string;
  price_per_unit?: number;
  eta_hours?: number;
  lead_time_days?: number;
  moq?: number;
  delivery_fee?: number;
  status?: string;
  composite_score?: number;
  submitted_at?: string;
  supplier_rating?: number;
  verified_supplier?: boolean;
};

export type RFQComparison = {
  rfq_id?: string;
  ranked?: RFQResponse[];
  computed_at?: string;
};

const unwrapList = <T>(data: any): T[] => {
  if (Array.isArray(data)) return data;
  if (data?.items && Array.isArray(data.items)) return data.items;
  return [];
};

export const listSuppliers = async (): Promise<Supplier[]> =>
  unwrapList(await apiFetch('/v1/suppliers'));

export const getSupplierOffers = async (id: string): Promise<SupplierOffer[]> =>
  unwrapList(await apiFetch(`/v1/suppliers/${id}/offers`));

export const getSupplierDelivery = async (id: string): Promise<SupplierDelivery> =>
  apiFetch(`/v1/suppliers/${id}/delivery`);

export const listRFQs = async (): Promise<RFQThread[]> =>
  unwrapList(await apiFetch('/v1/rfq'));

export const createRFQ = async (payload: {
  category: string;
  quantity: number;
  delivery_lat?: number;
  delivery_lng?: number;
  delivery_address?: string;
  notes?: string;
  expiry_at?: string;
  invited_suppliers?: string[];
  items?: Array<{ name: string; quantity: number; unit: string }>;
}): Promise<RFQThread> =>
  apiFetch('/v1/rfq', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const listRFQResponses = async (id: string): Promise<RFQResponse[]> =>
  unwrapList(await apiFetch(`/v1/rfq/${id}/responses`));

export const getRFQComparison = async (id: string): Promise<RFQComparison> =>
  apiFetch(`/v1/rfq/${id}/comparison`);

export const acceptRFQResponse = async (rfqId: string, responseId: string) =>
  apiFetch(`/v1/rfq/${rfqId}/accept/${responseId}`, { method: 'POST' });

export const declineRFQResponse = async (rfqId: string, responseId: string) =>
  apiFetch(`/v1/rfq/${rfqId}/decline/${responseId}`, { method: 'POST' });
