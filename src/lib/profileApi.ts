import { apiFetch } from './apiClient';

const unwrapList = <T>(data: any): T[] => {
  if (Array.isArray(data)) return data;
  if (data?.items && Array.isArray(data.items)) return data.items;
  return [];
};

export const getProfile = async () => apiFetch('/v1/profile');

export const updateProfile = async (payload: {
  display_name?: string;
  bio?: string;
  description?: string;
  avatar_url?: string;
  is_public?: boolean;
}) =>
  apiFetch('/v1/profile', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });

export const listProfilePosts = async () => unwrapList(await apiFetch('/v1/profile/posts'));

export const createProfilePost = async (payload: { content?: string; media_url?: string }) =>
  apiFetch('/v1/profile/posts', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const deleteProfilePost = async (id: string) =>
  apiFetch(`/v1/profile/posts/${id}`, { method: 'DELETE' });

export const getProfileInsights = async () => apiFetch('/v1/profile/insights');

export const getProfileInsightsHistory = async () => unwrapList(await apiFetch('/v1/profile/insights/history'));

export const getProfileInsightsReach = async () => apiFetch('/v1/profile/insights/reach');

export const getProfileInsightsTrending = async () => apiFetch('/v1/profile/insights/trending');

export const getProfileInsightsEngagement = async () => apiFetch('/v1/profile/insights/engagement');

export const listProfileLikes = async () => unwrapList(await apiFetch('/v1/profile/likes'));

export const likeProfileProduct = async (payload: { product_id: string }) =>
  apiFetch('/v1/profile/likes', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const unlikeProfileProduct = async (productId: string) =>
  apiFetch(`/v1/profile/likes/${productId}`, { method: 'DELETE' });

export const listProfileFavorites = async () => unwrapList(await apiFetch('/v1/profile/favorites'));

export const addProfileFavorite = async (payload: { seller_id: string }) =>
  apiFetch('/v1/profile/favorites', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const removeProfileFavorite = async (sellerId: string) =>
  apiFetch(`/v1/profile/favorites/${sellerId}`, { method: 'DELETE' });

export const getProfileShop = async () => apiFetch('/v1/profile/shop');

export const updateProfileShop = async (payload: Record<string, any>) =>
  apiFetch('/v1/profile/shop', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });

export const createProfileShare = async () => apiFetch('/v1/profile/share', { method: 'POST' });

export const getProfileShareLink = async () => apiFetch('/v1/profile/share-link');

export const listProfileSocial = async () => unwrapList(await apiFetch('/v1/profile/social'));

export const connectProfileSocial = async (payload: { platform: string; account_id?: string; token_ref?: string }) =>
  apiFetch('/v1/profile/social/connect', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const disconnectProfileSocial = async (payload: { platform: string }) =>
  apiFetch('/v1/profile/social/disconnect', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const listProfileReviews = async () => unwrapList(await apiFetch('/v1/profile/reviews'));
