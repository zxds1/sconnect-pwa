import { apiFetch } from './apiClient';

export type OpsConfig = {
  config_key: string;
  value: any;
  updated_at?: string;
};

export const getOpsConfig = async (key: string): Promise<OpsConfig> =>
  apiFetch(`/v1/ops/configs/${encodeURIComponent(key)}`);

export const setOpsConfig = async (key: string, value: any): Promise<OpsConfig> =>
  apiFetch(`/v1/ops/configs/${encodeURIComponent(key)}`, {
    method: 'PUT',
    body: JSON.stringify({ value }),
  });
