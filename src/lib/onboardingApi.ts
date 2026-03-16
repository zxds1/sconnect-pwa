import { apiFetch } from './apiClient';

export type OnboardingState = {
  step?: number;
  status?: string;
  completed_at?: string;
};

export const getOnboardingState = async (): Promise<OnboardingState> =>
  apiFetch('/v1/onboarding/state');

export const completeOnboarding = async (): Promise<void> =>
  apiFetch('/v1/onboarding/complete', { method: 'POST' });

export const recordOnboardingEvent = async (payload: { step: number; action: string }) =>
  apiFetch('/v1/onboarding/event', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
