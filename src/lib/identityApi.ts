import { apiFetch } from './apiClient';

export type SessionInfo = {
  session_id?: string;
  user_id?: string;
  tenant_id?: string;
  role?: string;
  device_trust_score?: number;
  created_at?: string;
  expires_at?: string;
};

export const getSessionInfo = async (): Promise<SessionInfo> =>
  apiFetch('/v1/auth/session');
