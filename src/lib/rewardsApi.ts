import { apiFetch } from './apiClient';

export interface RewardsBalance {
  seller_id?: string;
  balance?: number;
  coins?: number;
  wallet?: number;
  pending?: number;
  currency?: string;
}

export interface RewardsLedgerEntry {
  id: string;
  ledger_id?: string;
  seller_id?: string;
  type?: string;
  reason?: string;
  amount?: number;
  balance_after?: number;
  receipt_id?: string | null;
  created_at?: string;
}

export interface RewardsReceipt {
  id: string;
  seller_id?: string;
  s3_key?: string;
  merchant_name?: string;
  merchant?: string;
  merchant_id?: string;
  total_amount?: number;
  receipt_date?: string | null;
  dedup_key?: string;
  ocr_confidence?: number;
  reward_issued?: number;
  status?: string;
  created_at?: string;
}

export interface ReceiptInventoryItem {
  id: string;
  seller_id?: string;
  receipt_id?: string;
  item_name?: string;
  quantity?: number;
  unit_price?: number | null;
  seller_product_id?: string | null;
  status?: string;
  created_at?: string;
}

export interface RewardsStreak {
  id: string;
  seller_id?: string;
  type?: string;
  count?: number;
  updated_at?: string;
}

export interface RewardsReferral {
  id: string;
  inviter_id?: string;
  invitee_phone?: string;
  status?: string;
  referral_code?: string;
  created_at?: string;
}

export interface RewardsGpsVerification {
  id?: string;
  seller_id?: string;
  lat_enc?: string;
  lng_enc?: string;
  distance_m?: number;
  distance?: number;
  meters?: number;
  message?: string;
  verified?: boolean;
  created_at?: string;
}

export interface RewardsFraudAlert {
  id: string;
  seller_id?: string;
  type?: string;
  details?: string;
  message?: string;
  created_at?: string;
}

export interface RewardsStarsSummary {
  stars_total?: number;
  rank?: number;
  participants?: number;
  updated_at?: string;
}

export interface RewardsLeaderboardEntry {
  user_id: string;
  stars_total?: number;
  rank?: number;
  updated_at?: string;
}

export interface RewardsQrScanRequest {
  qr_payload: string;
  scan_type?: string;
  seller_id?: string;
  product_name?: string;
  price?: number;
  quantity?: number;
  stock_status?: string;
  repeat_purchase?: string;
  cleanliness?: number;
  verification_method?: string;
  gps_distance_m?: number;
  gps_verified?: boolean;
}

export interface RewardsQrScanResponse {
  scan_id?: string;
  rewards_issued?: number;
  stars_awarded?: number;
  balance?: number;
  stars_total?: number;
  rank?: number;
  participants?: number;
  created_at?: string;
}

const unwrapList = <T>(data: any): T[] => {
  if (Array.isArray(data)) return data;
  if (data?.items && Array.isArray(data.items)) return data.items;
  return [];
};

export const getRewardsBalance = async (): Promise<RewardsBalance> => apiFetch('/v1/rewards/balance');

export const getRewardsLedger = async (): Promise<RewardsLedgerEntry[]> => unwrapList(await apiFetch('/v1/rewards/ledger'));

export const submitReceipt = async (payload: {
  s3_key: string;
  merchant_name?: string;
  merchant_id?: string;
  total_amount?: number;
  receipt_date?: string;
  ocr_text?: string;
  ocr_confidence?: number;
  line_items?: string[];
}) =>
  apiFetch('/v1/rewards/receipt', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const listReceipts = async (): Promise<RewardsReceipt[]> => unwrapList(await apiFetch('/v1/rewards/receipts'));

export const queueReceipts = async (payload: { receipt_id: string }) =>
  apiFetch('/v1/rewards/receipts/queue', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const listReceiptInventoryItems = async (params?: { status?: string; limit?: number }): Promise<ReceiptInventoryItem[]> => {
  const query = params?.status || params?.limit
    ? `?${[
        params?.status ? `status=${encodeURIComponent(params.status)}` : '',
        params?.limit ? `limit=${encodeURIComponent(String(params.limit))}` : ''
      ].filter(Boolean).join('&')}`
    : '';
  return unwrapList(await apiFetch(`/v1/rewards/receipts/items${query}`));
};

export const updateReceiptInventoryItem = async (
  id: string,
  payload: { status?: string; seller_product_id?: string }
): Promise<ReceiptInventoryItem> =>
  apiFetch(`/v1/rewards/receipts/items/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });

export const getRewardStreaks = async (): Promise<RewardsStreak[]> => unwrapList(await apiFetch('/v1/rewards/streaks'));

export const resetRewardStreaks = async (payload?: { type?: string }) =>
  apiFetch('/v1/rewards/streaks/reset', {
    method: 'POST',
    body: payload ? JSON.stringify(payload) : undefined,
  });

export const createReferral = async (payload: { invitee_phone: string }) =>
  apiFetch('/v1/rewards/referrals', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const listReferrals = async (): Promise<RewardsReferral[]> => unwrapList(await apiFetch('/v1/rewards/referrals'));

export const verifyRewardsGps = async (payload: { lat_enc: string; lng_enc: string; distance_m: number; verified: boolean }): Promise<RewardsGpsVerification> =>
  apiFetch('/v1/rewards/gps/verify', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const listFraudAlerts = async (): Promise<RewardsFraudAlert[]> => unwrapList(await apiFetch('/v1/rewards/fraud-alerts'));

export const redeemRewards = async (payload: { amount: number }): Promise<RewardsLedgerEntry> =>
  apiFetch('/v1/rewards/redeem', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const getRewardsStarsSummary = async (): Promise<RewardsStarsSummary> =>
  apiFetch('/v1/rewards/stars/summary');

export const listRewardsLeaderboard = async (): Promise<RewardsLeaderboardEntry[]> =>
  unwrapList(await apiFetch('/v1/rewards/stars/leaderboard'));

export const submitRewardsQrScan = async (payload: RewardsQrScanRequest): Promise<RewardsQrScanResponse> =>
  apiFetch('/v1/rewards/qr/scan', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
