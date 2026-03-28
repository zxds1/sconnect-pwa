import { apiFetch } from './apiClient';

export type SellerVerificationOcrRequest = {
  seller_id: string;
  confidence: number;
  doc_quality: number;
  blurry?: boolean;
};

export type SellerFaceMatchRequest = {
  seller_id: string;
  score: number;
  no_face?: boolean;
};

export type SellerVerificationDocUpload = {
  type: string;
  file_url: string;
  expires_at?: string;
};

export const submitSellerVerificationOcr = async (payload: SellerVerificationOcrRequest) =>
  apiFetch('/v1/verification/ocr', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const submitSellerFaceMatch = async (payload: SellerFaceMatchRequest) =>
  apiFetch('/v1/verification/face-match', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const uploadSellerVerificationDoc = async (payload: SellerVerificationDocUpload) =>
  apiFetch('/v1/seller/verification/docs', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
