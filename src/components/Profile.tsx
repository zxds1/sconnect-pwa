import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { motion } from 'motion/react';
import { Settings as SettingsIcon, Grid, Heart, ShoppingBag, Edit2, Share2, ChevronLeft, BarChart3, Star, MapPin, BadgeCheck, Facebook, Twitter, Instagram, ExternalLink, Sparkles, TrendingUp, Linkedin, Globe, X } from 'lucide-react';
import { Product } from '../types';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, Tooltip
} from 'recharts';
import {
  addProfileFavorite,
  connectProfileSocial,
  createProfilePost,
  createProfileShare,
  deleteProfilePost,
  disconnectProfileSocial,
  getProfile,
  getProfileInsights,
  getProfileInsightsEngagement,
  getProfileInsightsHistory,
  getProfileInsightsReach,
  getProfileInsightsTrending,
  getProfileShareLink,
  listProfileFavorites,
  listProfileLikes,
  listProfilePosts,
  listProfileReviews,
  listProfileSocial,
  removeProfileFavorite,
  updateProfile
} from '../lib/profileApi';
import { getAccountLabel, getAuthItem, getVisitorId, setAuthItem } from '../lib/authStorage';
import { getShopProducts, getShopProfile, getShopStats } from '../lib/shopDirectoryApi';
import { getSellerProfile, type SellerProfile, updateSellerProfile } from '../lib/sellerProfileApi';
import { getOpsConfig } from '../lib/opsConfigApi';
import { postAnalyticsEvent } from '../lib/analyticsApi';
import {
  createSupplierApplication,
  listSupplierApplications,
  streamSupplierApplications,
  SupplierApplication
} from '../lib/suppliersApi';
import { getVideoDurationSeconds, uploadMediaFile } from '../lib/mediaUpload';
import { VideoTrimModal } from './VideoTrimModal';

interface ProfileProps {
  onBack?: () => void;
  onSettingsOpen?: () => void;
  onRequireLogin?: (message: string) => void;
  onOpenSellerStudio?: () => void;
  onSellerAccountCreated?: () => void;
  sellerFastTrack?: boolean;
  onSellerFastTrackConsumed?: () => void;
  isSellerAccount?: boolean | null;
  onProductOpen: (product: Product) => void;
  sellerId?: string;
  products: Product[];
  isFollowing?: boolean;
  onToggleFollow?: (sellerId: string) => void;
}

type ProfileData = {
  id?: string;
  display_name?: string;
  name?: string;
  avatar_url?: string;
  avatar?: string;
  bio?: string;
  description?: string;
  is_public?: boolean;
};

const guessMediaType = (url: string): 'video' | 'image' => {
  const lower = url.toLowerCase();
  if (lower.endsWith('.mp4') || lower.endsWith('.mov') || lower.endsWith('.webm') || lower.endsWith('.m4v')) {
    return 'video';
  }
  return 'image';
};

const normalizeAccountName = (value?: string) => {
  const trimmed = String(value || '').trim();
  if (!trimmed) return '';
  const normalized = trimmed.toLowerCase();
  if (normalized === 'profile' || normalized === 'my profile') return '';
  return trimmed;
};

const parsePriceValue = (value: any) => {
  if (value === null || value === undefined || value === '') return 0;
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  const text = String(value).trim();
  if (!text) return 0;
  const normalized = text.replace(/[, ]+/g, '').replace(/[^\d.-]/g, '');
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
};

const formatKES = (value: any) => `KES ${parsePriceValue(value).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

const normalizeShopProduct = (raw: any): Product | null => {
  if (!raw) return null;
  const id = raw.id || raw.product_id || raw.productId;
  if (!id) return null;
  const mediaUrl = raw.media_url || raw.mediaUrl || raw.image_url || raw.image || '';
  const lat = raw.location?.lat ?? raw.lat;
  const lng = raw.location?.lng ?? raw.lng;
  const address = raw.location?.address ?? raw.address ?? '';
  return {
    id: String(id),
    sellerId: String(raw.seller_id || raw.sellerId || ''),
    productId: raw.product_id || raw.productId || String(id),
    name: raw.name || raw.title || raw.product_name || 'Product',
    description: raw.description || raw.summary || '',
    price: parsePriceValue(raw.price ?? raw.current_price ?? raw.unit_price ?? raw.sale_price ?? raw.offer_price),
    category: raw.category || raw.category_name || 'general',
    mediaUrl,
    mediaType: String(raw.media_type || raw.mediaType || '').toLowerCase() === 'video' ? 'video' : guessMediaType(mediaUrl),
    tags: Array.isArray(raw.tags) ? raw.tags : [],
    stockLevel: parsePriceValue(raw.stock_level ?? raw.stockLevel ?? raw.stock ?? 0),
    stockStatus: raw.stock_status || raw.stockStatus,
    expiryDate: raw.expiry_date || raw.expiryDate,
    isFeatured: raw.is_featured ?? raw.isFeatured,
    discountPrice: raw.discount_price ?? raw.discountPrice,
    location: Number.isFinite(Number(lat)) && Number.isFinite(Number(lng))
      ? { lat: Number(lat), lng: Number(lng), address }
      : undefined,
  };
};

export const Profile: React.FC<ProfileProps> = ({ onBack, onSettingsOpen, onRequireLogin, onOpenSellerStudio, onSellerAccountCreated, sellerFastTrack, onSellerFastTrackConsumed, isSellerAccount, onProductOpen, sellerId, products, onToggleFollow }) => {
  const hasSession = Boolean(getAuthItem('soko:auth_token'));
  const initials = (value?: string) =>
    String(value || '')
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() || '')
      .join('') || 'S';
  const [activeTab, setActiveTab] = useState(sellerId ? 'shop' : 'grid');
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [ownSellerProfile, setOwnSellerProfile] = useState<SellerProfile | null>(null);
  const [shopProfile, setShopProfile] = useState<Record<string, any> | null>(null);
  const [shopStats, setShopStats] = useState<Record<string, any> | null>(null);
  const [shopProducts, setShopProducts] = useState<Product[] | null>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [likes, setLikes] = useState<any[]>([]);
  const [favorites, setFavorites] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [insights, setInsights] = useState<Record<string, any> | null>(null);
  const [insightsHistory, setInsightsHistory] = useState<any[]>([]);
  const [insightsTrending, setInsightsTrending] = useState<{ trending?: string; status?: string } | null>(null);
  const [insightsReach, setInsightsReach] = useState<Record<string, any> | null>(null);
  const [insightsEngagement, setInsightsEngagement] = useState<Record<string, any> | null>(null);
  const [insightsTargets, setInsightsTargets] = useState<{ reach_target?: number; engagement_target?: number; rating_target?: number; active_items_target?: number } | null>(null);
  const [socialConnections, setSocialConnections] = useState<any[]>([]);
  const [shareLink, setShareLink] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEdit, setShowEdit] = useState(false);
  const [editForm, setEditForm] = useState({ display_name: '', bio: '', description: '', avatar_url: '', is_public: true });
  const [socialForm, setSocialForm] = useState({ facebook: '', twitter: '', instagram: '', tiktok: '', linkedin: '', website: '' });
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [showAvatarViewer, setShowAvatarViewer] = useState(false);
  const [newPost, setNewPost] = useState({ content: '', media_url: '' });
  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const postMediaInputRef = useRef<HTMLInputElement | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [postMediaUploading, setPostMediaUploading] = useState(false);
  const [postTrimFile, setPostTrimFile] = useState<File | null>(null);
  const [creatingSellerAccount, setCreatingSellerAccount] = useState(false);
  const [sellerAccountStatus, setSellerAccountStatus] = useState<string | null>(null);
  const [autoSellerRequested, setAutoSellerRequested] = useState(false);
  const [supplierApps, setSupplierApps] = useState<SupplierApplication[]>([]);
  const [supplierAppLoading, setSupplierAppLoading] = useState(false);
  const [supplierAppError, setSupplierAppError] = useState<string | null>(null);
  const [creatingSupplierApp, setCreatingSupplierApp] = useState(false);
  const [shareStatus, setShareStatus] = useState<string | null>(null);
  const [supplierForm, setSupplierForm] = useState({
    business_name: '',
    category: '',
    address: '',
    notes: '',
  });
  const [supplierLocation, setSupplierLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [showSupplierForm, setShowSupplierForm] = useState(false);

  const isOwnProfile = !sellerId;
  const isGuestOwnProfile = isOwnProfile && !hasSession;
  const canManageOwnProfile = isOwnProfile && hasSession;
  const visitorId = useMemo(() => (isGuestOwnProfile ? getVisitorId() : ''), [isGuestOwnProfile]);
  const accountIntent = isOwnProfile ? String(getAuthItem('soko:account_intent') || '').toLowerCase() : '';
  const storedAccountLabel = useMemo(() => (isOwnProfile ? getAccountLabel() : ''), [isOwnProfile]);
  const visitorLabel = visitorId ? `Guest ${visitorId.slice(-4).toUpperCase()}` : 'Guest';
  const guestProfileName = accountIntent === 'seller' ? 'Guest Seller' : 'Guest Shopper';

  const profileData = useMemo(() => {
    if (!isOwnProfile && shopProfile) {
      return {
        name: normalizeAccountName(shopProfile.name) || 'Seller',
        avatar: shopProfile.avatar || shopProfile.logo || '',
        bio: shopProfile.bio || '',
        description: shopProfile.description || '',
        is_verified: shopProfile.verified,
      } as any;
    }
    return {
      name:
        normalizeAccountName(profile?.display_name) ||
        normalizeAccountName(profile?.name) ||
        normalizeAccountName(ownSellerProfile?.name) ||
        normalizeAccountName(storedAccountLabel) ||
        (isGuestOwnProfile ? guestProfileName : getAuthItem('soko:username') || 'My Account'),
      avatar: profile?.avatar_url || profile?.avatar || '',
      bio: profile?.bio || '',
      description: profile?.description || '',
      is_verified: false,
    } as any;
  }, [isOwnProfile, isGuestOwnProfile, guestProfileName, profile, ownSellerProfile, shopProfile, storedAccountLabel]);

  const effectiveSellerId = sellerId || (isOwnProfile ? ownSellerProfile?.seller_id || '' : '');
  const sellerDisplayName =
    normalizeAccountName(profileData.name) ||
    (isOwnProfile ? normalizeAccountName(getAuthItem('soko:username')) || 'My Account' : 'Seller');
  const sellerProducts = effectiveSellerId ? (shopProducts ?? products.filter(p => p.sellerId === effectiveSellerId)) : [];

  const parseNumber = (value: any) => {
    if (value === null || value === undefined || value === '') return null;
    if (typeof value === 'string') {
      const cleaned = value.replace('%', '').trim();
      const parsed = Number(cleaned);
      return Number.isFinite(parsed) ? parsed : null;
    }
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  };

  const reachValue = parseNumber(insightsReach?.reach_24h ?? insightsReach?.total_reach ?? insights?.reach_24h ?? insights?.total_reach);
  const engagementValue = parseNumber(insightsEngagement?.engagement_24h ?? insightsEngagement?.engagement_rate ?? insights?.engagement_24h ?? insights?.engagement_rate);
  const ratingValue = parseNumber(shopStats?.rating ?? shopProfile?.rating);
  const activeItemsValue = sellerProducts.length;

  const reachTarget = Number(insightsTargets?.reach_target ?? 0);
  const engagementTarget = Number(insightsTargets?.engagement_target ?? 0);
  const ratingTarget = Number(insightsTargets?.rating_target ?? 0);
  const activeItemsTarget = Number(insightsTargets?.active_items_target ?? 0);

  const reachPct = reachValue !== null && reachTarget > 0 ? Math.min(100, (reachValue / reachTarget) * 100) : null;
  const engagementPct = engagementValue !== null && engagementTarget > 0 ? Math.min(100, (engagementValue / engagementTarget) * 100) : null;
  const ratingPct = ratingValue !== null && ratingTarget > 0 ? Math.min(100, (ratingValue / ratingTarget) * 100) : null;
  const activeItemsPct = activeItemsTarget > 0 ? Math.min(100, (activeItemsValue / activeItemsTarget) * 100) : null;

  const formatEngagement = () => {
    const raw = insightsEngagement?.engagement_24h ?? insightsEngagement?.engagement_rate ?? insights?.engagement_24h ?? insights?.engagement_rate;
    if (raw === null || raw === undefined || raw === '') return '—';
    if (typeof raw === 'string') {
      const trimmed = raw.trim();
      if (!trimmed) return '—';
      if (trimmed.includes('%')) return trimmed;
      const parsed = Number(trimmed);
      return Number.isFinite(parsed)
        ? parsed.toLocaleString(undefined, { maximumFractionDigits: 1 })
        : trimmed;
    }
    const numeric = Number(raw);
    return Number.isFinite(numeric)
      ? numeric.toLocaleString(undefined, { maximumFractionDigits: 1 })
      : '—';
  };

  const insightsChartData = useMemo(() => {
    if (!Array.isArray(insightsHistory) || insightsHistory.length === 0) return [];
    return insightsHistory
      .map((item: any, index: number) => {
        const rawDate = item?.updated_at || item?.date || item?.created_at || '';
        const parsedDate = rawDate ? new Date(rawDate) : null;
        const label = parsedDate && !Number.isNaN(parsedDate.getTime())
          ? parsedDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
          : `Day ${index + 1}`;
        return {
          label,
          reach: parseNumber(item?.reach ?? item?.reach_24h ?? item?.total_reach) ?? 0,
          engagement: parseNumber(item?.engagement ?? item?.engagement_24h ?? item?.engagement_rate) ?? 0,
        };
      })
      .reverse();
  }, [insightsHistory]);

  const stats = useMemo(() => {
    if (!isOwnProfile && shopStats) {
      return {
        following: shopStats.following || 0,
        followers: shopStats.followers || shopStats.follower_count || 0,
        likes: shopStats.likes || 0,
      };
    }
    return {
      following: favorites.length,
      followers: insights?.followers || insights?.total_followers || 0,
      likes: likes.length,
    };
  }, [isOwnProfile, shopStats, favorites.length, insights, likes.length]);

  const likedProducts = useMemo(() => {
    const likedIds = likes.map((item) => item.product_id || item.productId || item.id);
    return products.filter(p => likedIds.includes(p.id));
  }, [likes, products]);

  const isFollowingSeller = useMemo(() => {
    if (!sellerId) return false;
    const favIds = favorites.map((f) => f.seller_id || f.sellerId || f.id);
    return favIds.includes(sellerId);
  }, [favorites, sellerId]);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        if (sellerId) {
          const [shop, statsResp, shopProductsResp] = await Promise.all([
            getShopProfile(sellerId),
            getShopStats(sellerId).catch(() => null),
            getShopProducts(sellerId).catch(() => []),
          ]);
          if (!alive) return;
          setOwnSellerProfile(null);
          setShopProfile(shop || null);
          setShopStats(statsResp || null);
          setShopProducts((Array.isArray(shopProductsResp) ? shopProductsResp : []).map(normalizeShopProduct).filter(Boolean) as Product[]);
        } else if (!hasSession) {
          if (!alive) return;
          setProfile(null);
          setOwnSellerProfile(null);
          setShopProducts(null);
          setPosts([]);
          setLikes([]);
          setFavorites([]);
          setReviews([]);
          setInsights(null);
          setInsightsHistory([]);
          setInsightsTrending(null);
          setInsightsReach(null);
          setInsightsEngagement(null);
          setSocialConnections([]);
          setShareLink('');
        } else {
          const [profileResp, postsResp, likesResp, favResp, reviewsResp, insightsResp, insightsHistResp, trendResp, reachResp, engagementResp, socialResp, shareResp, sellerProfileResp] = await Promise.all([
            getProfile(),
            listProfilePosts(),
            listProfileLikes(),
            listProfileFavorites(),
            listProfileReviews(),
            getProfileInsights(),
            getProfileInsightsHistory(),
            getProfileInsightsTrending(),
            getProfileInsightsReach(),
            getProfileInsightsEngagement(),
            listProfileSocial(),
            getProfileShareLink().catch(() => null),
            isSellerAccount ? getSellerProfile().catch(() => null) : Promise.resolve(null),
          ]);
          if (!alive) return;
          let ownShopProfileResp: Record<string, any> | null = null;
          let ownShopStatsResp: Record<string, any> | null = null;
          let ownShopProductsResp: any[] | null = null;
          if (sellerProfileResp?.seller_id) {
            [ownShopProfileResp, ownShopStatsResp, ownShopProductsResp] = await Promise.all([
              getShopProfile(sellerProfileResp.seller_id).catch(() => null),
              getShopStats(sellerProfileResp.seller_id).catch(() => null),
              getShopProducts(sellerProfileResp.seller_id).catch(() => []),
            ]);
            if (!alive) return;
          }
          setProfile(profileResp || null);
          if (profileResp?.display_name) {
            setAuthItem('soko:display_name', profileResp.display_name);
          }
          setOwnSellerProfile(sellerProfileResp || null);
          setShopProfile(ownShopProfileResp || null);
          setShopStats(ownShopStatsResp || null);
          setShopProducts(
            Array.isArray(ownShopProductsResp)
              ? ownShopProductsResp.map(normalizeShopProduct).filter(Boolean) as Product[]
              : null
          );
          setPosts(postsResp || []);
          setLikes(likesResp || []);
          setFavorites(favResp || []);
          setReviews(reviewsResp || []);
          setInsights(insightsResp || null);
          setInsightsHistory(insightsHistResp || []);
          setInsightsTrending(trendResp || null);
          setInsightsReach(reachResp || null);
          setInsightsEngagement(engagementResp || null);
          setSocialConnections(socialResp || []);
          setShareLink(shareResp?.share_token || '');
          setEditForm({
            display_name: profileResp?.display_name || sellerProfileResp?.name || '',
            bio: profileResp?.bio || '',
            description: profileResp?.description || '',
            avatar_url: profileResp?.avatar_url || '',
            is_public: profileResp?.is_public ?? true,
          });
          const normalizeSocial = (item: any) =>
            item?.url || item?.account_url || item?.profile_url || item?.account_id || item?.handle || '';
          const socialMap = (socialResp || []).reduce((acc: Record<string, string>, item: any) => {
            const platform = String(item?.platform || '').toLowerCase();
            if (!platform) return acc;
            acc[platform] = normalizeSocial(item);
            return acc;
          }, {});
          setSocialForm({
            facebook: socialMap.facebook || '',
            twitter: socialMap.twitter || '',
            instagram: socialMap.instagram || '',
            tiktok: socialMap.tiktok || '',
            linkedin: socialMap.linkedin || '',
            website: socialMap.website || ''
          });
        }
      } catch (err: any) {
        if (!alive) return;
        setError(isGuestOwnProfile ? null : (err?.message || 'Unable to load profile.'));
      } finally {
        if (alive) setLoading(false);
      }
    };
    load();
    return () => {
      alive = false;
    };
  }, [sellerId, hasSession, isGuestOwnProfile, isSellerAccount]);

  useEffect(() => {
    let active = true;
    getOpsConfig('profile.insights_targets')
      .then((resp) => {
        if (!active) return;
        setInsightsTargets((resp as any)?.value ?? null);
      })
      .catch(() => {
        if (!active) return;
        setInsightsTargets(null);
      });
    return () => {
      active = false;
    };
  }, []);

  const refreshSupplierApps = useCallback(async (aliveRef?: { current: boolean }) => {
    if (!isOwnProfile || !isSellerAccount) return;
    setSupplierAppLoading(true);
    setSupplierAppError(null);
    try {
      const apps = await listSupplierApplications();
      if (aliveRef && !aliveRef.current) return;
      setSupplierApps(apps || []);
    } catch (err: any) {
      if (aliveRef && !aliveRef.current) return;
      setSupplierAppError(err?.message || 'Unable to load supplier applications.');
    } finally {
      if (!aliveRef || aliveRef.current) setSupplierAppLoading(false);
    }
  }, [isOwnProfile, isSellerAccount]);

  useEffect(() => {
    const aliveRef = { current: true };
    refreshSupplierApps(aliveRef);
    return () => {
      aliveRef.current = false;
    };
  }, [refreshSupplierApps]);

  useEffect(() => {
    if (!isOwnProfile || !isSellerAccount) return;
    let stop: null | (() => void) = null;
    let cancelled = false;
    const start = async () => {
      try {
        stop = await streamSupplierApplications(
          (items) => {
            if (cancelled) return;
            setSupplierApps(items || []);
          },
          (message) => {
            if (cancelled) return;
            setSupplierAppError(message);
          }
        );
      } catch (err: any) {
        if (cancelled) return;
        setSupplierAppError(err?.message || 'Unable to open live updates.');
      }
    };
    start();
    return () => {
      cancelled = true;
      if (stop) stop();
    };
  }, [isOwnProfile, isSellerAccount]);

  const recordGuestAction = async (action: string) => {
    try {
      await postAnalyticsEvent({
        name: 'guest_profile_action',
        action,
        source: 'profile',
        properties: {
          profile_id: sellerId || profile?.id || undefined,
          profile_name: profileData.name,
        },
      });
    } catch {}
  };

  const handleShare = async () => {
    if (!hasSession) {
      await recordGuestAction('share_prompt');
      onRequireLogin?.('Sign in to share and follow profiles.');
      return;
    }
    try {
      const created = isOwnProfile ? await createProfileShare() : null;
      const shareToken = created?.share_token || shareLink || '';
      const isUrl = /^https?:\/\//i.test(shareToken);
      const url = isUrl ? shareToken : window.location.href;
      const text = shareToken && !isUrl
        ? `Share token: ${shareToken}`
        : `Check out ${profileData.name} on Sconnect!`;
      if (navigator.share) {
        await navigator.share({
          title: `${profileData.name} Profile`,
          text,
          url,
        });
      } else {
        await navigator.clipboard.writeText(isUrl ? url : shareToken || url);
        setShareStatus(isUrl ? 'Profile link copied to clipboard.' : 'Share token copied to clipboard.');
      }
    } catch (err: any) {
      setError(err?.message || 'Unable to share profile.');
    }
  };

  const normalizeSocialValue = (item: any) =>
    item?.url || item?.account_url || item?.profile_url || item?.account_id || item?.handle || '';

  const getSocialLink = (platform: string) => {
    const key = platform.toLowerCase();
    const match = socialConnections.find((s) => String(s.platform || '').toLowerCase() === key);
    return normalizeSocialValue(match);
  };

  const buildSocialUrl = (platform: string, raw: string) => {
    const key = platform.toLowerCase();
    const trimmed = raw.trim();
    if (!trimmed) return '';
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    if (key === 'website') return `https://${trimmed.replace(/^\/+/, '')}`;
    const handle = trimmed.replace(/^@/, '');
    if (key === 'facebook') return `https://www.facebook.com/${handle}`;
    if (key === 'twitter') return `https://twitter.com/${handle}`;
    if (key === 'instagram') return `https://www.instagram.com/${handle}`;
    if (key === 'tiktok') return `https://www.tiktok.com/@${handle}`;
    if (key === 'linkedin') return `https://www.linkedin.com/in/${handle}`;
    return trimmed;
  };

  const hasSocialLinks = useMemo(() => {
    if (!socialConnections.length) return false;
    return socialConnections.some((s) => Boolean(normalizeSocialValue(s)));
  }, [socialConnections]);

  const handleSocialAction = async (platform: string) => {
    if (!hasSession) {
      await recordGuestAction(`social_${platform}`);
      onRequireLogin?.('Sign in to open social links and interact with profiles.');
      return;
    }
    const raw = getSocialLink(platform);
    const url = buildSocialUrl(platform, raw);
    if (url) {
      window.open(url, '_blank');
      return;
    }
    if (isOwnProfile) {
      setShowEdit(true);
    }
  };

  const handleFollow = async () => {
    if (!sellerId) return;
    if (!hasSession) {
      await recordGuestAction(isFollowingSeller ? 'follow_prompt_unfollow' : 'follow_prompt_follow');
      onRequireLogin?.('Sign in to follow sellers and manage profile interactions.');
      return;
    }
    try {
      if (isFollowingSeller) {
        await removeProfileFavorite(sellerId);
      } else {
        await addProfileFavorite({ seller_id: sellerId });
      }
      const updated = await listProfileFavorites();
      setFavorites(updated || []);
      onToggleFollow?.(sellerId);
    } catch (err: any) {
      setError(err?.message || 'Unable to update follow status.');
    }
  };

  const handleProfileUpdate = async () => {
    if (!hasSession) {
      onRequireLogin?.('Sign in to edit your profile.');
      return;
    }
    try {
      const updated = await updateProfile(editForm);
      setProfile((prev) => ({ ...prev, ...(updated || editForm) }));
      const nextDisplayName = String(updated?.display_name || editForm.display_name || '').trim();
      if (nextDisplayName) {
        setAuthItem('soko:display_name', nextDisplayName);
      }
      const platforms: Array<keyof typeof socialForm> = ['facebook', 'twitter', 'instagram', 'tiktok', 'linkedin', 'website'];
      await Promise.all(platforms.map(async (platform) => {
        const desired = (socialForm[platform] || '').trim();
        const existing = getSocialLink(platform).trim();
        if (desired) {
          if (desired !== existing) {
            await connectProfileSocial({ platform, account_id: desired });
          }
        } else if (existing) {
          await disconnectProfileSocial({ platform });
        }
      }));
      const updatedSocial = await listProfileSocial();
      setSocialConnections(updatedSocial || []);
      setShowEdit(false);
    } catch (err: any) {
      setError(err?.message || 'Unable to update profile.');
    }
  };

  const handleCreatePost = async () => {
    if (!hasSession) {
      onRequireLogin?.('Sign in to create posts.');
      return;
    }
    if (!newPost.content.trim() && !newPost.media_url.trim()) return;
    try {
      const created = await createProfilePost({ content: newPost.content.trim(), media_url: newPost.media_url.trim() || undefined });
      setPosts(prev => [created, ...prev]);
      setNewPost({ content: '', media_url: '' });
    } catch (err: any) {
      setError(err?.message || 'Unable to create post.');
    }
  };

  const handleProfilePostMediaUpload = async (file: File) => {
    if (file.type.startsWith('video/')) {
      const duration = await getVideoDurationSeconds(file);
      if (duration > 60) {
        setPostTrimFile(file);
        return;
      }
    }
    setPostMediaUploading(true);
    try {
      const uploaded = await uploadMediaFile(file, 'profile_post_media');
      setNewPost((prev) => ({ ...prev, media_url: uploaded.url }));
    } catch (err: any) {
      setError(err?.message || 'Unable to upload media.');
    } finally {
      setPostMediaUploading(false);
      if (postMediaInputRef.current) {
        postMediaInputRef.current.value = '';
      }
    }
  };

  const handleTrimmedProfilePostMedia = async (file: File) => {
    setPostTrimFile(null);
    setPostMediaUploading(true);
    try {
      const uploaded = await uploadMediaFile(file, 'profile_post_media');
      setNewPost((prev) => ({ ...prev, media_url: uploaded.url }));
    } catch (err: any) {
      setError(err?.message || 'Unable to upload media.');
    } finally {
      setPostMediaUploading(false);
      if (postMediaInputRef.current) {
        postMediaInputRef.current.value = '';
      }
    }
  };

  const handleAvatarUpload = async (file: File) => {
    if (!hasSession) {
      onRequireLogin?.('Sign in to update your profile photo.');
      return;
    }
    if (!file.type.startsWith('image/')) {
      setError('Avatar must be an image.');
      if (avatarInputRef.current) {
        avatarInputRef.current.value = '';
      }
      return;
    }
    setAvatarUploading(true);
    try {
      const uploaded = await uploadMediaFile(file, 'profile_avatar');
      setEditForm((prev) => ({ ...prev, avatar_url: uploaded.url }));
      setProfile((prev) => prev ? { ...prev, avatar_url: uploaded.url, avatar: uploaded.url } : prev);
    } catch (err: any) {
      setError(err?.message || 'Unable to upload avatar.');
    } finally {
      setAvatarUploading(false);
      if (avatarInputRef.current) {
        avatarInputRef.current.value = '';
      }
    }
  };

  const handleDeletePost = async (id: string) => {
    if (!hasSession) {
      onRequireLogin?.('Sign in to manage your posts.');
      return;
    }
    try {
      await deleteProfilePost(id);
      setPosts(prev => prev.filter(p => (p.id || p.post_id) !== id));
    } catch (err: any) {
      setError(err?.message || 'Unable to delete post.');
    }
  };

  const handleCreateSellerAccount = async () => {
    if (!hasSession) {
      onRequireLogin?.('Sign in to create a seller account.');
      return;
    }
    setSellerAccountStatus(null);
    setCreatingSellerAccount(true);
    try {
      await updateSellerProfile({
        name: profileData.name?.trim() || undefined,
        description: profileData.description?.trim() || undefined
      });
      setActiveTab('shop');
      onSellerAccountCreated?.();
      setSellerAccountStatus('Seller account created.');
    } catch (err: any) {
      setSellerAccountStatus(err?.message || 'Unable to create seller account.');
    } finally {
      setCreatingSellerAccount(false);
    }
  };

  useEffect(() => {
    if (!isOwnProfile) return;
    if (isSellerAccount !== false) return;
    if (autoSellerRequested || !sellerFastTrack) return;
    setAutoSellerRequested(true);
    handleCreateSellerAccount();
    onSellerFastTrackConsumed?.();
  }, [isOwnProfile, isSellerAccount, autoSellerRequested, sellerFastTrack, onSellerFastTrackConsumed]);

  const requestSupplierLocation = async (): Promise<{ lat: number; lng: number } | null> => {
    if (!navigator.geolocation) {
      setSupplierAppError('Location services are not available.');
      return null;
    }
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        (err) => {
          setSupplierAppError(err?.message || 'Unable to read your location.');
          resolve(null);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });
  };

  const handleUseSupplierLocation = async () => {
    setSupplierAppError(null);
    const loc = await requestSupplierLocation();
    if (loc) {
      setSupplierLocation(loc);
    }
  };

  const latestSupplierApp = useMemo(() => {
    if (!supplierApps.length) return null;
    const sorted = [...supplierApps].sort((a, b) => {
      const aTime = new Date(a.created_at || 0).getTime();
      const bTime = new Date(b.created_at || 0).getTime();
      return bTime - aTime;
    });
    return sorted[0] || null;
  }, [supplierApps]);

  const handleCreateSupplierApplication = async () => {
    setSupplierAppError(null);
    setCreatingSupplierApp(true);
    try {
      let loc = supplierLocation;
      if (!loc) {
        loc = await requestSupplierLocation();
      }
      if (!loc) {
        setCreatingSupplierApp(false);
        return;
      }
      const payload = {
        business_name: supplierForm.business_name.trim() || profileData.name || 'My Business',
        category: supplierForm.category.trim() || 'General',
        lat: loc.lat,
        lng: loc.lng,
        address: supplierForm.address.trim(),
        notes: supplierForm.notes.trim(),
      };
      const created = await createSupplierApplication(payload);
      setSupplierApps(prev => [created, ...prev]);
      setShowSupplierForm(false);
      setSupplierForm({ business_name: '', category: '', address: '', notes: '' });
      setSupplierLocation(loc);
    } catch (err: any) {
      setSupplierAppError(err?.message || 'Unable to submit supplier application.');
    } finally {
      setCreatingSupplierApp(false);
    }
  };

  return (
    <div className="theme-page-shell h-full flex flex-col overflow-y-auto no-scrollbar pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
      <div className="theme-page-header sticky top-0 z-20 flex items-center justify-between border-b p-4">
        <div className="flex items-center gap-3">
          {onBack && (
            <button onClick={onBack} className="p-1 hover:bg-zinc-100 rounded-full">
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}
          <img
            src="/logo-header.jpg"
            alt="Sconnect"
            className="w-7 h-7 rounded-lg object-cover"
          />
          <div className="flex items-center gap-1">
            <h2 className="font-bold text-lg">{sellerDisplayName}</h2>
            {profileData.is_verified && <BadgeCheck className="w-4 h-4 text-indigo-600 fill-indigo-50" />}
          </div>
        </div>
        <div className="flex gap-4">
          <button onClick={handleShare} className="p-1 hover:bg-zinc-100 rounded-full transition-colors">
            <Share2 className="w-6 h-6 text-zinc-800" />
          </button>
          {canManageOwnProfile && onSettingsOpen && (
            <button onClick={onSettingsOpen} className="p-1 hover:bg-zinc-100 rounded-full transition-colors">
              <SettingsIcon className="w-6 h-6 text-zinc-800" />
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="m-4 bg-red-50 border border-red-100 text-red-700 text-[11px] font-bold rounded-2xl px-4 py-3">
          {error}
        </div>
      )}
      {shareStatus && (
        <div className="m-4 bg-emerald-50 border border-emerald-100 text-emerald-700 text-[11px] font-bold rounded-2xl px-4 py-3 flex items-start justify-between gap-3">
          <span>{shareStatus}</span>
          <button onClick={() => setShareStatus(null)} className="text-emerald-600 hover:text-emerald-700">
            Dismiss
          </button>
        </div>
      )}
      {loading && (
        <div className="m-4 bg-white rounded-2xl border border-zinc-100 p-5 text-[11px] font-bold text-zinc-500">
          Loading profile...
        </div>
      )}

      {canManageOwnProfile && (
        <div className="mx-4 mt-2 mb-4 bg-white rounded-2xl border border-zinc-100 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold">Seller Account</p>
              <p className="text-sm font-bold text-zinc-900 mt-1">
                {isSellerAccount === null ? 'Checking seller status…' : (isSellerAccount ? 'Active seller account' : 'Create a seller account to open your shop')}
              </p>
              {sellerAccountStatus && (
                <p className="text-[10px] text-zinc-500 font-bold mt-1">{sellerAccountStatus}</p>
              )}
            </div>
            {isSellerAccount ? (
              <button
                onClick={onOpenSellerStudio}
                className="px-4 py-2 bg-zinc-900 text-white rounded-xl text-[10px] font-bold"
              >
                Open Seller Studio
              </button>
            ) : (
              <button
                onClick={handleCreateSellerAccount}
                disabled={creatingSellerAccount || isSellerAccount === null}
                className={`px-4 py-2 rounded-xl text-[10px] font-bold ${
                  creatingSellerAccount || isSellerAccount === null ? 'bg-zinc-200 text-zinc-500' : 'bg-indigo-600 text-white'
                }`}
              >
                {creatingSellerAccount ? 'Creating…' : 'Create Seller Account'}
              </button>
            )}
          </div>
        </div>
      )}

      {canManageOwnProfile && isSellerAccount && (
        <div className="mx-4 mb-4 bg-white rounded-2xl border border-zinc-100 p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold">Supplier Status</p>
              <p className="text-sm font-bold text-zinc-900 mt-1">
                {latestSupplierApp?.status === 'approved'
                  ? 'Approved supplier'
                  : latestSupplierApp?.status === 'rejected'
                    ? 'Application rejected'
                    : latestSupplierApp?.status === 'pending'
                      ? 'Application under review'
                      : 'Apply to become a supplier'}
              </p>
              {latestSupplierApp?.decision_reason && (
                <p className="text-[10px] text-zinc-500 font-bold mt-1">
                  {latestSupplierApp.decision_reason}
                </p>
              )}
            </div>
            <div className="flex flex-col items-end gap-2">
              {supplierAppLoading ? (
                <span className="text-[10px] font-bold text-zinc-400">Loading…</span>
              ) : latestSupplierApp?.status === 'approved' ? (
                <span className="text-[10px] font-bold text-emerald-600">Verified</span>
              ) : (
                <button
                  onClick={() => {
                    if (latestSupplierApp?.status === 'pending') return;
                    setShowSupplierForm((prev) => !prev);
                  }}
                  disabled={latestSupplierApp?.status === 'pending'}
                  className={`px-4 py-2 rounded-xl text-[10px] font-bold ${
                    latestSupplierApp?.status === 'pending' ? 'bg-zinc-200 text-zinc-500' : 'bg-indigo-600 text-white'
                  }`}
                >
                  {latestSupplierApp?.status === 'pending'
                    ? 'Pending'
                    : (showSupplierForm ? 'Hide Form' : 'Apply')}
                </button>
              )}
            </div>
          </div>
          {supplierAppError && (
            <div className="mt-3 bg-red-50 border border-red-100 text-red-700 text-[10px] font-bold rounded-xl px-3 py-2">
              {supplierAppError}
            </div>
          )}
          {showSupplierForm && latestSupplierApp?.status !== 'approved' && latestSupplierApp?.status !== 'pending' && (
            <div className="mt-4 grid gap-3">
              <div>
                <label className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold">Business Name</label>
                <input
                  value={supplierForm.business_name}
                  onChange={(e) => setSupplierForm((prev) => ({ ...prev, business_name: e.target.value }))}
                  className="mt-2 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm font-semibold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Soko Wholesale"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold">Category</label>
                <input
                  value={supplierForm.category}
                  onChange={(e) => setSupplierForm((prev) => ({ ...prev, category: e.target.value }))}
                  className="mt-2 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm font-semibold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Groceries, Produce, Hardware..."
                />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold">Address</label>
                <input
                  value={supplierForm.address}
                  onChange={(e) => setSupplierForm((prev) => ({ ...prev, address: e.target.value }))}
                  className="mt-2 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm font-semibold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Street, City"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold">Notes</label>
                <textarea
                  value={supplierForm.notes}
                  onChange={(e) => setSupplierForm((prev) => ({ ...prev, notes: e.target.value }))}
                  className="mt-2 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm font-semibold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  rows={3}
                  placeholder="Anything else we should know?"
                />
              </div>
              <div className="flex items-center justify-between gap-3">
                <button
                  onClick={handleUseSupplierLocation}
                  className="px-3 py-2 rounded-xl text-[10px] font-bold bg-zinc-100 text-zinc-700"
                >
                  {supplierLocation ? 'Location saved' : 'Use my location'}
                </button>
                <button
                  onClick={handleCreateSupplierApplication}
                  disabled={creatingSupplierApp}
                  className={`px-4 py-2 rounded-xl text-[10px] font-bold ${
                    creatingSupplierApp ? 'bg-zinc-200 text-zinc-500' : 'bg-zinc-900 text-white'
                  }`}
                >
                  {creatingSupplierApp ? 'Submitting…' : 'Submit Application'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="px-4 pt-6 pb-8 flex flex-col items-center">
        <div
          className="relative mb-4 rounded-full focus-within:ring-2 focus-within:ring-indigo-500/40"
        >
          <button
            type="button"
            onClick={() => setShowAvatarViewer(true)}
            className="block rounded-full"
            aria-label="View profile photo"
          >
            {profileData.avatar ? (
              <img
                src={profileData.avatar}
                className="w-24 h-24 rounded-full border-2 border-zinc-100 p-1 object-cover shadow-xl cursor-zoom-in"
                alt="profile"
              />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-full border-2 border-zinc-100 bg-zinc-900 p-1 text-xl font-black text-white shadow-xl cursor-zoom-in">
                {initials(profileData.name)}
              </div>
            )}
          </button>
          {canManageOwnProfile && (
            <>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    void handleAvatarUpload(file);
                  }
                }}
              />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  avatarInputRef.current?.click();
                }}
                className="absolute bottom-0 right-0 bg-indigo-600 rounded-full p-1.5 border-2 border-white shadow-lg hover:bg-indigo-700 transition-colors"
                disabled={avatarUploading}
                aria-label="Change profile photo"
              >
                <Edit2 className="w-3 h-3 text-white" />
              </button>
            </>
          )}
        </div>
        {canManageOwnProfile && avatarUploading && (
          <p className="mb-3 text-[10px] font-bold text-zinc-500">Uploading avatar…</p>
        )}
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-xl font-black text-zinc-900">{sellerDisplayName}</h1>
          {profileData.is_verified && (
            <div className="group relative">
              <BadgeCheck className="w-5 h-5 text-indigo-600 fill-indigo-50" />
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-zinc-900 text-white text-[10px] font-bold rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                Verified Merchant
              </div>
            </div>
          )}
        </div>

        {!isOwnProfile && shopProfile?.location && (
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(shopProfile.location.address)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-indigo-600 hover:text-indigo-700 transition-colors mb-3 group"
          >
            <MapPin className="w-3.5 h-3.5" />
            <span className="text-xs font-bold group-hover:underline">{shopProfile.location.address}</span>
          </a>
        )}

        {profileData.bio ? (
          <p className="text-sm text-zinc-700 mb-2 text-center max-w-xs leading-relaxed font-semibold">
            {profileData.bio}
          </p>
        ) : (
          canManageOwnProfile && (
            <p className="text-xs text-zinc-400 mb-2 text-center max-w-xs leading-relaxed">
              Add a short bio so people know {sellerDisplayName}.
            </p>
          )
        )}
        {(() => {
          const description = profileData.description || '';
          const limit = 160;
          const isLong = description.length > limit;
          const displayText = showFullDescription || !isLong
            ? description
            : `${description.slice(0, limit).trim()}…`;
          if (!description) {
            return isOwnProfile ? (
              <p className="text-sm text-zinc-500 mb-6 text-center max-w-xs leading-relaxed">
                Add a description for {sellerDisplayName}'s profile or shop.
              </p>
            ) : null;
          }
          return (
            <div className="mb-6 text-center max-w-xs">
              <p className="text-sm text-zinc-500 leading-relaxed">{displayText}</p>
              {isLong && (
                <button
                  onClick={() => setShowFullDescription((prev) => !prev)}
                  className="mt-1 text-[10px] font-bold text-indigo-600"
                >
                  {showFullDescription ? 'Show less' : 'Show more'}
                </button>
              )}
            </div>
          );
        })()}

        {isGuestOwnProfile && (
          <div className="mb-6 w-full max-w-sm rounded-2xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-center">
            <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500">Guest profile</p>
            <p className="mt-1 text-xs font-semibold text-indigo-700">
              Browsing as {visitorLabel}. Sign in to save your real profile name, posts, and seller tools.
            </p>
          </div>
        )}

        {(isOwnProfile || hasSocialLinks) && (
          <div className="flex gap-4 mb-8">
            <button onClick={() => handleSocialAction('facebook')} className="p-2 bg-zinc-50 rounded-full hover:bg-zinc-100 transition-colors text-zinc-600">
              <Facebook className="w-5 h-5" />
            </button>
            <button onClick={() => handleSocialAction('twitter')} className="p-2 bg-zinc-50 rounded-full hover:bg-zinc-100 transition-colors text-zinc-600">
              <Twitter className="w-5 h-5" />
            </button>
            <button onClick={() => handleSocialAction('instagram')} className="p-2 bg-zinc-50 rounded-full hover:bg-zinc-100 transition-colors text-zinc-600">
              <Instagram className="w-5 h-5" />
            </button>
            {canManageOwnProfile && (
              <button onClick={() => setShowEdit(true)} className="p-2 bg-zinc-900 rounded-full hover:bg-zinc-800 transition-colors text-white">
                <ExternalLink className="w-5 h-5" />
              </button>
            )}
          </div>
        )}

        <div className="flex w-full justify-around mb-8 max-w-sm">
          <div className="flex flex-col items-center">
            <span className="font-black text-lg">{stats.following}</span>
            <span className="text-[10px] text-zinc-400 uppercase font-black tracking-widest">Following</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="font-black text-lg">{stats.followers}</span>
            <span className="text-[10px] text-zinc-400 uppercase font-black tracking-widest">Followers</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="font-black text-lg">{stats.likes}</span>
            <span className="text-[10px] text-zinc-400 uppercase font-black tracking-widest">Likes</span>
          </div>
        </div>

        <div className="flex w-full gap-3 px-4 max-w-sm">
          {canManageOwnProfile ? (
            <>
              <button onClick={() => setShowEdit(true)} className="flex-1 py-2.5 bg-zinc-900 text-white rounded-xl font-bold text-sm shadow-lg shadow-zinc-900/20 active:scale-95 transition-transform">
                Edit Profile
              </button>
              <button onClick={handleShare} className="flex-1 py-2.5 bg-zinc-100 text-zinc-900 rounded-xl font-bold text-sm active:scale-95 transition-transform">
                Share Profile
              </button>
            </>
          ) : isGuestOwnProfile ? (
            <>
              <button
                onClick={() => onRequireLogin?.('Sign in to edit your profile.')}
                className="flex-1 py-2.5 bg-zinc-900 text-white rounded-xl font-bold text-sm shadow-lg shadow-zinc-900/20 active:scale-95 transition-transform"
              >
                Sign in to edit
              </button>
              <button
                onClick={() => onRequireLogin?.('Sign in to manage your profile and seller tools.')}
                className="flex-1 py-2.5 bg-zinc-100 text-zinc-900 rounded-xl font-bold text-sm active:scale-95 transition-transform"
              >
                Sign in to continue
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleFollow}
                className={`flex-1 py-2.5 rounded-xl font-bold text-sm shadow-lg active:scale-95 transition-transform ${
                  isFollowingSeller ? 'bg-zinc-900 text-white' : 'bg-indigo-600 text-white shadow-indigo-600/20'
                }`}
              >
                {isFollowingSeller ? 'Following' : 'Follow'}
              </button>
            </>
          )}
        </div>
      </div>

      <div className="flex border-b border-zinc-100 sticky top-[60px] bg-white z-10">
        {[
          { id: 'grid', icon: Grid, label: 'Posts' },
          { id: 'intelligence', icon: BarChart3, label: 'Intelligence' },
          { id: 'likes', icon: Heart, label: 'Likes' },
          { id: 'shop', icon: ShoppingBag, label: 'Shop' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex flex-col items-center justify-center py-3 transition-colors relative ${activeTab === tab.id ? 'text-zinc-900' : 'text-zinc-300'}`}
          >
            <tab.icon className={`w-5 h-5 ${activeTab === tab.id ? 'fill-zinc-900' : ''}`} />
            <span className="text-[8px] font-bold uppercase mt-1 tracking-tighter">{tab.label}</span>
            {activeTab === tab.id && (
              <motion.div
                layoutId="profileTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-zinc-900"
              />
            )}
          </button>
        ))}
      </div>

      <div className="flex-1">
        {activeTab === 'intelligence' || activeTab === 'stats' ? (
          <div className="p-6 space-y-6 bg-zinc-50 h-full">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black uppercase tracking-widest text-zinc-400">
                {isOwnProfile ? 'Shop Intelligence' : 'Public Intelligence'}
              </h3>
              {activeTab === 'stats' && (
                <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-full">
                  <TrendingUp className="w-3 h-3" /> Trending
                </div>
              )}
            </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-2xl border border-zinc-100 shadow-sm">
                <p className="text-[10px] font-bold text-zinc-400 uppercase mb-1">
                  {activeTab === 'intelligence' ? 'Total Reach' : 'Merchant Rating'}
                </p>
                <div className="flex items-center gap-2">
                  <p className="text-xl font-black text-zinc-900">
                    {activeTab === 'intelligence'
                      ? (reachValue !== null ? reachValue.toLocaleString() : '—')
                      : (ratingValue !== null ? ratingValue.toFixed(1) : '—')}
                  </p>
                  {activeTab === 'stats' && <Star className="w-4 h-4 text-amber-500 fill-amber-500" />}
                </div>
                <div className="mt-2 h-1 w-full bg-zinc-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-500"
                    style={{ width: `${activeTab === 'intelligence' ? (reachPct ?? 0) : (ratingPct ?? 0)}%` }}
                  />
                </div>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-zinc-100 shadow-sm">
                <p className="text-[10px] font-bold text-zinc-400 uppercase mb-1">
                  {activeTab === 'intelligence' ? 'Engagement' : 'Active Items'}
                </p>
                <p className="text-xl font-black text-zinc-900">
                  {activeTab === 'intelligence' ? formatEngagement() : activeItemsValue}
                </p>
                <div className="mt-2 h-1 w-full bg-zinc-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500"
                    style={{ width: `${activeTab === 'intelligence' ? (engagementPct ?? 0) : (activeItemsPct ?? 0)}%` }}
                  />
                </div>
              </div>
            </div>

            {activeTab === 'stats' && (
              <div className="bg-white p-5 rounded-2xl border border-zinc-100 shadow-sm">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-4">Recent Sales Trend</h4>
                <div className="h-32 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={insightsChartData}>
                      <defs>
                        <linearGradient id="colorSalesStats" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1}/>
                          <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="label" hide />
                      <Tooltip
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '10px' }}
                      />
                      <Area
                        type="monotone"
                        dataKey="reach"
                        stroke="#4f46e5"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorSalesStats)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <p className="text-[10px] text-zinc-400 text-center mt-2 font-medium">Reach updated with live insights</p>
              </div>
            )}

            {activeTab === 'intelligence' && (
              <div className="bg-zinc-900 text-white p-5 rounded-2xl shadow-xl">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                  <h4 className="text-xs font-bold uppercase tracking-wider">AI Growth Tip</h4>
                </div>
                <p className="text-[10px] text-zinc-400 italic leading-relaxed">
                  {insights?.tip || 'Actionable insights will appear here based on your data.'}
                </p>
              </div>
            )}

            <div className="bg-white p-5 rounded-2xl border border-zinc-100 shadow-sm">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-4">Trending Status</h4>
              <div className="space-y-2 text-[10px] font-bold text-zinc-600">
                <div className="flex items-center justify-between">
                  <span>Status</span>
                  <span className="text-zinc-900">{insightsTrending?.status || insights?.status || 'unknown'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Trending</span>
                  <span className="text-zinc-900">{insightsTrending?.trending || insights?.trending || 'none'}</span>
                </div>
              </div>
            </div>
          </div>
        ) : activeTab === 'shop' ? (
          <div className="p-4 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black uppercase tracking-widest text-zinc-400">Seller Collection</h3>
              <span className="text-[10px] font-bold text-zinc-400">{sellerProducts.length} Items</span>
            </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-6">
              {sellerProducts.length > 0 ? (
                sellerProducts.map((product) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-2xl border border-zinc-100 overflow-hidden shadow-sm flex flex-col cursor-pointer"
                    onClick={() => onProductOpen(product)}
                  >
                    <div className="aspect-video relative">
                      {product.mediaType === 'video' ? (
                        <video src={product.mediaUrl} className="w-full h-full object-cover" autoPlay muted loop playsInline />
                      ) : (
                        <img src={product.mediaUrl} className="w-full h-full object-cover" alt={product.name} />
                      )}
                      <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg shadow-sm">
                        <span className="text-xs font-black text-zinc-900">{formatKES(product.price)}</span>
                      </div>
                      {product.stockLevel < 10 && (
                        <div className="absolute top-3 left-3 bg-red-500 text-white px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter">
                          Low Stock: {product.stockLevel}
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-bold text-zinc-900">{product.name}</h4>
                          <p className="text-[10px] text-zinc-400 uppercase font-bold tracking-tight">{product.category}</p>
                        </div>
                        <div className="flex items-center gap-1 text-amber-500">
                          <Star className="w-3 h-3 fill-amber-500" />
                          <span className="text-xs font-bold">
                            {ratingValue !== null ? ratingValue.toFixed(1) : '--'}
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-zinc-500 line-clamp-2 mb-4 leading-relaxed">
                        {product.description}
                      </p>

                      {product.location && (
                        <div className="flex items-center gap-2 mb-4 p-2 bg-zinc-50 rounded-xl">
                          <MapPin className="w-3.5 h-3.5 text-indigo-600" />
                          <span className="text-[10px] font-medium text-zinc-600 truncate">{product.location.address}</span>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <button className="flex-1 py-2.5 bg-zinc-900 text-white rounded-xl font-bold text-xs active:scale-95 transition-transform">
                          Buy Now
                        </button>
                        {product.location && (
                          <button
                            onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(product.location!.address)}`, '_blank')}
                            className="flex-1 py-2.5 bg-indigo-50 text-indigo-600 rounded-xl font-bold text-xs flex items-center justify-center gap-2 active:scale-95 transition-transform"
                          >
                            Visit Shop <ExternalLink className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="py-20 flex flex-col items-center justify-center text-center px-6">
                  <ShoppingBag className="w-12 h-12 text-zinc-200 mb-4" />
                  <h4 className="text-zinc-900 font-bold mb-1">No products yet</h4>
                  <p className="text-xs text-zinc-400">
                    {canManageOwnProfile && isSellerAccount
                      ? 'Add products in Seller Studio and they will appear here automatically.'
                      : "This seller hasn't listed any items for sale in their shop tab."}
                  </p>
                </div>
              )}
            </div>

            {canManageOwnProfile && (
              <div className="bg-white p-5 rounded-2xl border border-zinc-100 shadow-sm">
                <h4 className="text-xs font-black uppercase tracking-wider text-zinc-400 mb-4">Your Reviews</h4>
                <div className="space-y-3">
                  {reviews.length === 0 && (
                    <div className="p-4 bg-zinc-50 rounded-2xl text-[10px] text-zinc-500 font-bold text-center">
                      No production reviews yet.
                    </div>
                  )}
                  {reviews.map((review) => (
                    <div key={review.id} className="p-4 bg-zinc-50 rounded-2xl space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-zinc-900">{review.product_name || review.product_id || 'Product'}</span>
                        <span className="text-[10px] text-zinc-400">{new Date(review.created_at || Date.now()).toLocaleDateString()}</span>
                      </div>
                      <div className="flex text-amber-500">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`w-3 h-3 ${i < (review.rating || 0) ? 'fill-amber-500' : 'text-zinc-200'}`} />
                        ))}
                      </div>
                      <p className="text-xs text-zinc-600 italic">"{review.comment || 'Review submitted.'}"</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : activeTab === 'likes' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-3 p-4">
            {likedProducts.length === 0 && (
              <div className="col-span-2 sm:col-span-3 lg:col-span-4 2xl:col-span-5 p-6 bg-zinc-50 rounded-2xl text-center text-[10px] font-bold text-zinc-500">
                No liked products yet.
              </div>
            )}
            {likedProducts.map((product) => (
              <div key={product.id} className="bg-white rounded-2xl border border-zinc-100 overflow-hidden shadow-sm" onClick={() => onProductOpen(product)}>
                <div className="aspect-square">
                  {product.mediaType === 'video' ? (
                    <video src={product.mediaUrl} className="w-full h-full object-cover" autoPlay muted loop playsInline />
                  ) : (
                    <img src={product.mediaUrl} className="w-full h-full object-cover" alt={product.name} />
                  )}
                </div>
                <div className="p-3">
                  <p className="text-xs font-bold text-zinc-900 line-clamp-1">{product.name}</p>
                  <p className="text-[10px] text-zinc-400">{formatKES(product.price)}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 space-y-4">
            {canManageOwnProfile && (
              <div className="bg-white rounded-2xl border border-zinc-100 p-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2">Create Post</p>
                <input
                  className="w-full p-2.5 bg-zinc-50 rounded-xl text-[10px] font-bold mb-2"
                  placeholder="What's new?"
                  value={newPost.content}
                  onChange={(e) => setNewPost(prev => ({ ...prev, content: e.target.value }))}
                />
                <input
                  ref={postMediaInputRef}
                  type="file"
                  accept="image/*,video/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      void handleProfilePostMediaUpload(file);
                    }
                  }}
                />
                <div className="flex gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => postMediaInputRef.current?.click()}
                    className="flex-1 py-2.5 bg-indigo-50 text-indigo-700 rounded-xl text-[10px] font-bold"
                    disabled={postMediaUploading}
                  >
                    {postMediaUploading ? 'Uploading…' : 'Upload Media (60s max)'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewPost((prev) => ({ ...prev, media_url: '' }))}
                    className="px-3 py-2.5 bg-zinc-100 text-zinc-700 rounded-xl text-[10px] font-bold"
                  >
                    Clear
                  </button>
                </div>
                <input
                  className="w-full p-2.5 bg-zinc-50 rounded-xl text-[10px] font-bold mb-2"
                  placeholder="Media URL (optional fallback)"
                  value={newPost.media_url}
                  onChange={(e) => setNewPost(prev => ({ ...prev, media_url: e.target.value }))}
                />
                {newPost.media_url && (
                  <div className="mb-3 rounded-2xl overflow-hidden border border-zinc-100">
                    {guessMediaType(newPost.media_url) === 'video' ? (
                      <video src={newPost.media_url} className="w-full h-40 object-cover" controls />
                    ) : (
                      <img src={newPost.media_url} className="w-full h-40 object-cover" alt="preview" />
                    )}
                  </div>
                )}
                <button onClick={handleCreatePost} className="w-full py-2 bg-zinc-900 text-white rounded-xl text-[10px] font-black">
                  Post
                </button>
              </div>
            )}
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 2xl:grid-cols-6 gap-1">
              {posts.length === 0 && (
                <div className="col-span-3 sm:col-span-4 lg:col-span-5 2xl:col-span-6 p-6 bg-zinc-50 rounded-2xl text-center text-[10px] font-bold text-zinc-500">
                  No posts yet.
                </div>
              )}
              {posts.map((post, i) => (
                <motion.div
                  key={post.id || post.post_id || i}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.02 }}
                  className="aspect-[3/4] bg-zinc-100 relative group overflow-hidden cursor-pointer"
                >
                  {post.media_url ? (
                    guessMediaType(post.media_url) === 'video' ? (
                      <video
                        src={post.media_url}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        autoPlay
                        muted
                        loop
                        playsInline
                        controls={false}
                      />
                    ) : (
                      <img
                        src={post.media_url}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        alt="post"
                      />
                    )
                  ) : (
                    <div className="w-full h-full flex items-center justify-center p-3 text-[10px] font-bold text-zinc-600">
                      {post.content || 'Post'}
                    </div>
                  )}
                  {canManageOwnProfile && (
                    <button
                      onClick={() => handleDeletePost(post.id || post.post_id)}
                      className="absolute top-2 right-2 bg-white/80 text-zinc-600 text-[9px] font-bold px-2 py-1 rounded"
                    >
                      Delete
                    </button>
                  )}
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="flex items-center gap-1 text-white font-bold text-xs">
                      <Heart className="w-4 h-4 fill-white" />
                      <span>{post.likes || 0}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>

      {showAvatarViewer && (
        <div className="fixed inset-0 z-[70] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-2xl">
            <div className="p-4 flex items-center justify-between border-b border-zinc-100">
              <div>
                <p className="text-sm font-black text-zinc-900">Profile photo</p>
                <p className="text-[11px] text-zinc-500 font-medium">View or update the picture on your profile.</p>
              </div>
              <button onClick={() => setShowAvatarViewer(false)} className="p-2 rounded-full bg-zinc-100 text-zinc-600" aria-label="Close photo viewer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4">
              <div className="rounded-3xl overflow-hidden bg-zinc-100">
                {profileData.avatar ? (
                  <img src={profileData.avatar} alt="profile preview" className="w-full h-72 object-cover" />
                ) : (
                  <div className="flex h-72 w-full items-center justify-center bg-zinc-900 text-3xl font-black text-white">
                    {initials(profileData.name)}
                  </div>
                )}
              </div>
              <div className="mt-4 grid gap-2">
                {canManageOwnProfile && (
                  <button
                    onClick={() => {
                      avatarInputRef.current?.click();
                      setShowAvatarViewer(false);
                    }}
                    className="w-full py-3 bg-indigo-600 text-white rounded-2xl text-xs font-black"
                    disabled={avatarUploading}
                  >
                    {avatarUploading ? 'Uploading…' : 'Choose from gallery'}
                  </button>
                )}
                <button
                  onClick={() => setShowAvatarViewer(false)}
                  className="w-full py-3 bg-zinc-100 text-zinc-700 rounded-2xl text-xs font-black"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showEdit && (
        <div className="fixed inset-0 z-[60]">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowEdit(false)} />
          <div className="absolute left-1/2 top-1/2 w-[min(92vw,420px)] -translate-x-1/2 -translate-y-1/2 bg-white rounded-3xl border border-zinc-100 shadow-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-black">Edit Profile</p>
              <button onClick={() => setShowEdit(false)} className="text-[10px] font-black text-zinc-400">Close</button>
            </div>
            <div className="space-y-3">
              <input
                className="w-full p-3 bg-zinc-50 rounded-xl text-xs font-bold"
                placeholder="Display name"
                value={editForm.display_name}
                onChange={(e) => setEditForm(prev => ({ ...prev, display_name: e.target.value }))}
              />
              <textarea
                className="w-full p-3 bg-zinc-50 rounded-xl text-xs font-bold"
                rows={3}
                placeholder="Bio"
                value={editForm.bio}
                onChange={(e) => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
              />
              <textarea
                className="w-full p-3 bg-zinc-50 rounded-xl text-xs font-bold"
                rows={4}
                placeholder="Description"
                value={editForm.description}
                onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
              />
              <input
                className="w-full p-3 bg-zinc-50 rounded-xl text-xs font-bold"
                placeholder="Avatar URL (optional fallback)"
                value={editForm.avatar_url}
                onChange={(e) => setEditForm(prev => ({ ...prev, avatar_url: e.target.value }))}
              />
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                className="w-full p-3 bg-indigo-50 text-indigo-700 rounded-xl text-xs font-bold"
                disabled={avatarUploading}
              >
                {avatarUploading ? 'Uploading avatar…' : 'Choose from gallery'}
              </button>
              <div className="pt-2">
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Social Links</p>
                <div className="mt-2 grid grid-cols-1 gap-2">
                  <label className="flex items-center gap-2 text-[10px] font-bold text-zinc-600">
                    <Facebook className="w-4 h-4" />
                    <input
                      className="flex-1 p-2 bg-zinc-50 rounded-xl text-xs font-bold"
                      placeholder="facebook.com/yourname"
                      value={socialForm.facebook}
                      onChange={(e) => setSocialForm(prev => ({ ...prev, facebook: e.target.value }))}
                    />
                  </label>
                  <label className="flex items-center gap-2 text-[10px] font-bold text-zinc-600">
                    <Twitter className="w-4 h-4" />
                    <input
                      className="flex-1 p-2 bg-zinc-50 rounded-xl text-xs font-bold"
                      placeholder="twitter.com/yourname"
                      value={socialForm.twitter}
                      onChange={(e) => setSocialForm(prev => ({ ...prev, twitter: e.target.value }))}
                    />
                  </label>
                  <label className="flex items-center gap-2 text-[10px] font-bold text-zinc-600">
                    <Instagram className="w-4 h-4" />
                    <input
                      className="flex-1 p-2 bg-zinc-50 rounded-xl text-xs font-bold"
                      placeholder="instagram.com/yourname"
                      value={socialForm.instagram}
                      onChange={(e) => setSocialForm(prev => ({ ...prev, instagram: e.target.value }))}
                    />
                  </label>
                  <label className="flex items-center gap-2 text-[10px] font-bold text-zinc-600">
                    <Linkedin className="w-4 h-4" />
                    <input
                      className="flex-1 p-2 bg-zinc-50 rounded-xl text-xs font-bold"
                      placeholder="linkedin.com/in/yourname"
                      value={socialForm.linkedin}
                      onChange={(e) => setSocialForm(prev => ({ ...prev, linkedin: e.target.value }))}
                    />
                  </label>
                  <label className="flex items-center gap-2 text-[10px] font-bold text-zinc-600">
                    <Globe className="w-4 h-4" />
                    <input
                      className="flex-1 p-2 bg-zinc-50 rounded-xl text-xs font-bold"
                      placeholder="yourwebsite.com"
                      value={socialForm.website}
                      onChange={(e) => setSocialForm(prev => ({ ...prev, website: e.target.value }))}
                    />
                  </label>
                </div>
              </div>
              <label className="flex items-center gap-2 text-[10px] font-bold text-zinc-600">
                <input
                  type="checkbox"
                  checked={editForm.is_public}
                  onChange={(e) => setEditForm(prev => ({ ...prev, is_public: e.target.checked }))}
                  className="accent-zinc-900"
                />
                Public profile
              </label>
            </div>
            <div className="mt-4 flex gap-2">
              <button onClick={handleProfileUpdate} className="flex-1 py-2 bg-zinc-900 text-white rounded-xl text-[10px] font-black">
                Save
              </button>
              <button onClick={() => setShowEdit(false)} className="flex-1 py-2 bg-zinc-100 text-zinc-700 rounded-xl text-[10px] font-black">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <VideoTrimModal
        open={!!postTrimFile}
        file={postTrimFile}
        onCancel={() => {
          setPostTrimFile(null);
          setPostMediaUploading(false);
        }}
        onConfirm={handleTrimmedProfilePostMedia}
      />
    </div>
  );
};
