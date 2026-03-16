import { apiFetch } from './apiClient';

export type PresignResponse = {
  upload_url?: string;
  url?: string;
  method?: string;
  headers?: Record<string, string>;
  fields?: Record<string, string>;
  s3_key?: string;
  key?: string;
};

export const requestUploadPresign = async (payload: {
  file_name: string;
  mime_type?: string;
  content_length?: number;
  context?: string;
}): Promise<PresignResponse> =>
  apiFetch('/v1/uploads/presign', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
