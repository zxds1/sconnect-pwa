import { apiFetch } from './apiClient';

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
}): Promise<AuthTokens> =>
  apiFetch('/v1/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

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
