import { apiFetch, apiFetchRaw } from './apiClient';

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

export type SupplierApplication = {
  id?: string;
  seller_id?: string;
  business_name?: string;
  category?: string;
  lat?: number;
  lng?: number;
  address?: string;
  notes?: string;
  status?: string;
  decision_reason?: string;
  created_at?: string;
  updated_at?: string;
  reviewed_at?: string;
  reviewed_by?: string;
};

export type CreateSupplierApplicationPayload = {
  business_name: string;
  category: string;
  lat: number;
  lng: number;
  address?: string;
  notes?: string;
};

export type ReviewSupplierApplicationPayload = {
  decision_reason?: string;
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

export const listSupplierApplications = async (): Promise<SupplierApplication[]> =>
  unwrapList(await apiFetch('/v1/suppliers/applications'));

export const getSupplierApplication = async (id: string): Promise<SupplierApplication> =>
  apiFetch(`/v1/suppliers/applications/${id}`);

export const listSupplierApplicationsAdmin = async (status?: string): Promise<SupplierApplication[]> => {
  const query = status ? `?status=${encodeURIComponent(status)}` : '';
  return unwrapList(await apiFetch(`/v1/suppliers/applications/admin${query}`));
};

export const getSupplierApplicationAdmin = async (id: string): Promise<SupplierApplication> =>
  apiFetch(`/v1/suppliers/applications/admin/${id}`);

const parseSseStream = async (
  res: Response,
  onItems: (items: SupplierApplication[]) => void,
  onError?: (message: string) => void,
  signal?: AbortSignal
) => {
  if (!res.body) throw new Error('Stream not available');
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    if (signal?.aborted) break;
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const parts = buffer.split('\n\n');
    buffer = parts.pop() || '';
    for (const chunk of parts) {
      const lines = chunk.split('\n');
      let data = '';
      let event = '';
      for (const line of lines) {
        if (line.startsWith('event:')) {
          event = line.replace('event:', '').trim();
        } else if (line.startsWith('data:')) {
          data += line.replace('data:', '').trim();
        }
      }
      if (!data) continue;
      try {
        const payload = JSON.parse(data);
        if (event === 'error') {
          onError?.(payload?.message || 'Stream error');
          continue;
        }
        const items = unwrapList<SupplierApplication>(payload);
        onItems(items);
      } catch (err: any) {
        onError?.(err?.message || 'Stream parse error');
      }
    }
  }
};

export const streamSupplierApplications = async (
  onItems: (items: SupplierApplication[]) => void,
  onError?: (message: string) => void
) => {
  const controller = new AbortController();
  const res = await apiFetchRaw('/v1/suppliers/applications/stream', {
    method: 'GET',
    signal: controller.signal,
  });
  if (!res.ok) {
    throw new Error('Unable to open applications stream');
  }
  parseSseStream(res, onItems, onError, controller.signal);
  return () => controller.abort();
};

export const streamSupplierApplicationsAdmin = async (
  onItems: (items: SupplierApplication[]) => void,
  onError?: (message: string) => void,
  status?: string
) => {
  const controller = new AbortController();
  const query = status ? `?status=${encodeURIComponent(status)}` : '';
  const res = await apiFetchRaw(`/v1/suppliers/applications/admin/stream${query}`, {
    method: 'GET',
    signal: controller.signal,
  });
  if (!res.ok) {
    throw new Error('Unable to open admin applications stream');
  }
  parseSseStream(res, onItems, onError, controller.signal);
  return () => controller.abort();
};

export const createSupplierApplication = async (payload: CreateSupplierApplicationPayload): Promise<SupplierApplication> =>
  apiFetch('/v1/suppliers/applications', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const approveSupplierApplication = async (
  id: string,
  payload?: ReviewSupplierApplicationPayload
) =>
  apiFetch(`/v1/suppliers/applications/${id}/approve`, {
    method: 'POST',
    body: payload ? JSON.stringify(payload) : undefined,
  });

export const rejectSupplierApplication = async (
  id: string,
  payload?: ReviewSupplierApplicationPayload
) =>
  apiFetch(`/v1/suppliers/applications/${id}/reject`, {
    method: 'POST',
    body: payload ? JSON.stringify(payload) : undefined,
  });

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
