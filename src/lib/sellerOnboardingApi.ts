import { apiFetch } from './apiClient';

type OnboardingStepState = Record<string, string>;

export type OnboardingState = {
  steps?: OnboardingStepState;
  completion?: number;
  eligible?: boolean;
  grace_until?: string | null;
  last_updated?: string;
};

export type OnboardingEligibility = {
  eligible?: boolean;
  completion?: number;
};

export type Tutorial = {
  id?: string;
  title?: string;
  description?: string;
  status?: string;
};

export type VerificationStatus = {
  status?: string;
  verified?: boolean;
  submitted_at?: string;
};

const unwrapList = <T>(data: any): T[] => {
  if (Array.isArray(data)) return data;
  if (data?.items && Array.isArray(data.items)) return data.items;
  return [];
};

export const getSellerOnboardingState = async (): Promise<OnboardingState> =>
  apiFetch('/v1/seller/onboarding/state');

export const completeSellerOnboarding = async () =>
  apiFetch('/v1/seller/onboarding/complete', { method: 'POST' });

export const resetSellerOnboarding = async () =>
  apiFetch('/v1/seller/onboarding/reset', { method: 'POST' });

export const recordSellerOnboardingEvent = async (payload: { step: string; status: string }) =>
  apiFetch('/v1/seller/onboarding/event', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const getSellerOnboardingEligibility = async (): Promise<OnboardingEligibility> =>
  apiFetch('/v1/seller/onboarding/eligibility');

export const grantSellerOnboardingGrace = async (payload: { hours: number }) =>
  apiFetch('/v1/seller/onboarding/grace', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const completeVoiceOnboarding = async () =>
  apiFetch('/v1/seller/onboarding/voice', { method: 'POST' });

export const listSellerTutorials = async (): Promise<Tutorial[]> =>
  unwrapList(await apiFetch('/v1/seller/tutorials'));

export const completeSellerTutorial = async (payload: { tutorial_id: string }) =>
  apiFetch('/v1/seller/tutorials/complete', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const refreshSellerShareLink = async () =>
  apiFetch('/v1/seller/share-link/refresh', { method: 'POST' });

export const requestSellerVerification = async () =>
  apiFetch('/v1/seller/verification/request', { method: 'POST' });

export const getSellerVerificationStatus = async (): Promise<VerificationStatus> =>
  apiFetch('/v1/seller/verification/status');
