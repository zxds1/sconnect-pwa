import { apiFetch } from './apiClient';
import { getOpsConfig } from './opsConfigApi';

export type AuthTokens = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type?: string;
};

export type AuthDevicePayload = {
  fingerprint?: string;
  user_agent?: string;
  ip_address?: string;
  locale?: string;
  screen?: string;
};

const OFFLINE_LOGIN = {
  phone: '+254700000000',
  pin: '1234',
  tenant_id: 'tenant_001',
  user_id: 'buyer_offline',
  role: 'buyer',
};

const createOfflineTokens = (): AuthTokens => ({
  access_token: `offline_access_${Date.now().toString(16)}`,
  refresh_token: `offline_refresh_${Math.random().toString(16).slice(2)}`,
  expires_in: 60 * 60 * 24,
  token_type: 'Bearer',
});

const matchesOfflineLogin = (payload: { phone: string; pin: string; tenant_id: string }) => {
  const phone = payload.phone.trim();
  const pin = payload.pin.trim();
  const tenant = payload.tenant_id.trim() || OFFLINE_LOGIN.tenant_id;
  return phone === OFFLINE_LOGIN.phone && pin === OFFLINE_LOGIN.pin && tenant === OFFLINE_LOGIN.tenant_id;
};

const isOfflineLoginEnabled = async (): Promise<boolean> => {
  try {
    const cfg = await getOpsConfig('features.offline_login');
    return Boolean((cfg as any)?.value?.enabled);
  } catch {
    return false;
  }
};

const getDeviceFingerprint = () => {
  try {
    const stored = localStorage.getItem('soko:device_fingerprint');
    if (stored) return stored;
    const fp = `fp_${Date.now()}_${Math.random().toString(16).slice(2)}`;
    localStorage.setItem('soko:device_fingerprint', fp);
    return fp;
  } catch {
    return undefined;
  }
};

export const getDevicePayload = (): AuthDevicePayload => {
  const screen = typeof window !== 'undefined'
    ? `${window.screen?.width || 0}x${window.screen?.height || 0}`
    : undefined;
  return {
    fingerprint: getDeviceFingerprint(),
    user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
    locale: typeof navigator !== 'undefined' ? navigator.language : undefined,
    screen,
  };
};

export const login = async (payload: {
  phone: string;
  pin: string;
  tenant_id: string;
  device?: AuthDevicePayload;
}): Promise<AuthTokens> => {
  try {
    return await apiFetch('/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  } catch (err) {
    const offlineEnabled = import.meta.env.DEV && await isOfflineLoginEnabled();
    if (offlineEnabled && matchesOfflineLogin(payload)) {
      try {
        localStorage.setItem('soko:role', OFFLINE_LOGIN.role);
        localStorage.setItem('soko:user_id', OFFLINE_LOGIN.user_id);
        localStorage.setItem('soko:tenant_id', OFFLINE_LOGIN.tenant_id);
        localStorage.setItem('soko:session_id', `offline_${Date.now().toString(16)}`);
      } catch {}
      return createOfflineTokens();
    }
    throw err;
  }
};

export const register = async (payload: {
  phone: string;
  pin: string;
  tenant_id: string;
  device?: AuthDevicePayload;
}): Promise<AuthTokens> =>
  apiFetch('/v1/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const requestPasswordReset = async (payload: {
  phone: string;
  tenant_id: string;
}) =>
  apiFetch('/v1/auth/password/reset/request', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const confirmPasswordReset = async (payload: {
  phone: string;
  reset_code: string;
  new_pin: string;
  tenant_id: string;
}) =>
  apiFetch('/v1/auth/password/reset/confirm', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
