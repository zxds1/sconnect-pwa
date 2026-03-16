import { apiFetch } from './apiClient';

export interface RewardsBalance {
  seller_id?: string;
  balance?: number;
  pending?: number;
  currency?: string;
}

export interface RewardsLedgerEntry {
  id: string;
  seller_id?: string;
  type?: string;
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
  merchant_id?: string;
  total_amount?: number;
  receipt_date?: string | null;
  dedup_key?: string;
  ocr_confidence?: number;
  reward_issued?: number;
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
  verified?: boolean;
  created_at?: string;
}

export interface RewardsFraudAlert {
  id: string;
  seller_id?: string;
  type?: string;
  details?: string;
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
