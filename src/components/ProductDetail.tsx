import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Star,
  MapPin,
  ShoppingBag,
  MessageCircle,
  Heart,
  ChevronRight,
  ArrowRightLeft,
  Check,
  Sparkles,
  AlertTriangle,
  Minus,
  Plus,
  TrendingDown,
  ExternalLink,
  ShieldCheck,
  Phone,
  Bell,
  Share2,
  Flag,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Product, PricePoint, Review } from '../types';
import { ProductAIChat } from './ProductAIChat';
import { getCustomNavigation, listPathLandmarks, listPopularPaths, listSellerPaths, listUserLocations, precomputePathWaypoints, recordPath, type PathLandmark, type PathPoint, type RecordedPath, type UserLocation } from '../lib/searchApi';
import {
  getProductDetail,
  getProductMedia,
  getProductPriceHistory,
  getProductBenchmark,
  getProductGoodDeal,
  listProductReviews,
  createProductReview,
  listProductQuestions,
  createProductQuestion,
  answerProductQuestion,
  watchProduct,
  updateWatch,
  unwatchProduct,
  shareProduct
} from '../lib/productDetailApi';
import { addCartItem, checkoutCart, scheduleOrderFollowup, submitOrderRating } from '../lib/cartApi';
import { getShopProfile } from '../lib/shopDirectoryApi';
import {
  createCounterfeitReport,
  createDispute,
  createModerationReview,
  getCounterfeitSummary,
  getDisputeSummary,
  getSellerReputation,
  uploadDisputeEvidence
} from '../lib/supportApi';
import { createAuditEvent } from '../lib/securityApi';
import { requestUploadPresign } from '../lib/uploadsApi';
import { requestMediaUploadPreview } from '../lib/mediaPreview';
import { createRouteTelemetryTracker } from '../lib/routeTelemetry';
import { getOpsConfig } from '../lib/opsConfigApi';
import { getUiPreferences, updateUiPreferences } from '../lib/settingsApi';
import { getAuthItem } from '../lib/authStorage';
import {
  detectCityKey,
  getCityMultiplier,
  getDefaultRouteMultipliers,
  getProfileMultiplier,
  getStepRoadMultiplier,
  loadRouteMultipliers,
  type RouteProfile,
  type RouteMultipliersConfig
} from '../lib/routeMultipliers';

interface ProductDetailProps {
  product: Product;
  onClose: () => void;
  onChatOpen: (product: Product) => void;
  onOpenSupportChat?: () => void;
  onRequireLogin?: (message: string) => void;
  onAddToComparison: (product: Product) => void;
  isCompared: boolean;
  onBuyNow?: (product: Product) => void;
  onAddToBag?: (product: Product) => void;
  initialShowMap?: boolean;
  initialPreferredPathId?: string | null;
  initialRouteProfile?: 'driving' | 'walking' | 'cycling' | 'motorbike' | 'scooter' | 'tuktuk';
  initialNavigationMode?: 'silent' | 'mapbox';
}

type QuestionItem = { id: string; question: string; answer?: string; author?: string };

type SellerProfile = Record<string, any>;

type SellerReputation = Record<string, any>;

type SummaryStat = Record<string, any>;
type ProductDetailModal = 'ai-chat' | 'counterfeit' | 'dispute' | 'map' | 'recording';

const numberOrZero = (value: any) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const parsePriceValue = (value: any) => {
  if (typeof value === 'number') {
    return Number.isFinite(value) && value > 0 ? value : 0;
  }
  if (typeof value === 'string') {
    const match = value.replace(/,/g, '').match(/-?\d+(?:\.\d+)?/);
    if (match) {
      const parsed = Number(match[0]);
      return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
    }
  }
  return 0;
};

const formatKES = (value: any) => `KES ${parsePriceValue(value).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

const normalizeLabel = (value: any) => {
  if (value === null || value === undefined) return '';
  return String(value).replace(/\s+/g, ' ').trim();
};

const isPlaceholderSellerLabel = (value: string) => {
  const normalized = normalizeLabel(value).toLowerCase();
  if (!normalized) return true;
  return new Set([
    'seller',
    'merchant',
    'store',
    'shop',
    'seller profile',
    'merchant profile',
    'shop profile',
    'publicly collected shop',
    'publicly collected store',
  ]).has(normalized);
};

const pickMeaningfulLabel = (...values: any[]) => {
  for (const value of values) {
    const label = normalizeLabel(value);
    if (!label || isPlaceholderSellerLabel(label)) continue;
    return label;
  }
  return '';
};

const formatCountLabel = (value: any, fallback: string) => {
  if (value === null || value === undefined || value === '') return fallback;
  const label = normalizeLabel(value);
  if (!label) return fallback;
  return label;
};

const deriveBrandFromUrl = (...values: any[]) => {
  for (const value of values) {
    const raw = normalizeLabel(value);
    if (!raw) continue;
    try {
      const host = new URL(raw).hostname.replace(/^www\./i, '').toLowerCase();
      if (!host) continue;
      const parts = host.split('.').filter(Boolean);
      if (parts.length === 0) continue;
      const knownSecondLevelTlds = new Set(['co', 'com', 'org', 'net', 'go', 'ac']);
      const brandIndex = parts.length > 2 && knownSecondLevelTlds.has(parts[parts.length - 2])
        ? parts.length - 3
        : parts.length - 2;
      const candidate = parts[Math.max(0, brandIndex)] || parts[0];
      const cleaned = candidate.replace(/[^a-z0-9-]/gi, '').replace(/[-_]+/g, ' ').trim();
      if (!cleaned) continue;
      return cleaned
        .split(' ')
        .filter(Boolean)
        .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
        .join(' ');
    } catch {
      continue;
    }
  }
  return '';
};

const resolveMediaUrl = (media: any[]) => {
  if (!media?.length) return undefined;
  const item = media[0];
  return item?.url || item?.media_url || item?.src || item?.path || undefined;
};

const normalizeExternalUrl = (value?: string) => {
  if (!value) return '';
  const trimmed = value.trim();
  if (!trimmed) return '';
  return trimmed.startsWith('http') ? trimmed : `https://${trimmed}`;
};

const normalizePriceHistory = (data: any[]): PricePoint[] => {
  return (data || []).map((point) => ({
    date: point.date || point.timestamp || point.day || point.created_at || '',
    price: numberOrZero(point.price ?? point.amount ?? point.value),
  })).filter((point) => point.price > 0);
};

const normalizeReview = (review: any): Review => ({
  id: review.id || `r_${Math.random().toString(16).slice(2)}`,
  userId: review.user_id || review.userId || 'user',
  userName: review.user_name || review.userName || 'Anonymous',
  userAvatar: review.user_avatar || review.userAvatar || `https://i.pravatar.cc/150?u=${review.user_id || review.userId || review.id}`,
  rating: numberOrZero(review.rating) || 0,
  comment: review.comment || review.body || '',
  timestamp: review.timestamp ? Number(review.timestamp) : new Date(review.created_at || Date.now()).getTime(),
  isVerifiedPurchase: review.verified || review.is_verified_purchase || review.isVerifiedPurchase,
  replies: Array.isArray(review.replies) ? review.replies.map((reply: any) => ({
    id: reply.id || `rp_${Math.random().toString(16).slice(2)}`,
    sellerId: reply.seller_id || reply.sellerId || 'seller',
    sellerName: reply.seller_name || reply.sellerName || 'Seller',
    comment: reply.comment || reply.body || '',
    timestamp: reply.timestamp ? Number(reply.timestamp) : new Date(reply.created_at || Date.now()).getTime(),
  })) : [],
});

const normalizeQuestion = (item: any): QuestionItem => ({
  id: item.id || `q_${Math.random().toString(16).slice(2)}`,
  question: item.question || item.body || item.text || '',
  answer: item.answer || item.reply || item.response,
  author: item.author || item.user_name || 'Community',
});

const toMapboxProfile = (profile: RouteProfile) => {
  if (profile === 'walking' || profile === 'cycling') return profile;
  return 'driving-traffic';
};

export const ProductDetail: React.FC<ProductDetailProps> = ({
  product,
  onClose,
  onChatOpen,
  onOpenSupportChat,
  onRequireLogin,
  onAddToComparison,
  isCompared,
  onBuyNow,
  onAddToBag,
  initialShowMap,
  initialPreferredPathId,
  initialRouteProfile,
  initialNavigationMode
}) => {
  const initials = (value?: string) =>
    String(value || '')
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() || '')
      .join('') || 'S';
  const [showAIChat, setShowAIChat] = React.useState(false);
  const [quantity, setQuantity] = React.useState(1);
  const [flyThumb, setFlyThumb] = React.useState<null | { src: string; start: { x: number; y: number; size: number }; end: { x: number; y: number; size: number } }>(null);
  const imageRef = React.useRef<HTMLImageElement | null>(null);
  const [showReviewForm, setShowReviewForm] = React.useState(false);
  const [reviewForm, setReviewForm] = React.useState({ name: 'You', rating: 5, comment: '' });
  const [isWatched, setIsWatched] = React.useState(false);
  const [watchTarget, setWatchTarget] = React.useState<number | null>(null);
  const [followUpEnabled, setFollowUpEnabled] = React.useState(false);
  const [followupOrderId, setFollowupOrderId] = React.useState('');
  const [ratingOrderId, setRatingOrderId] = React.useState('');
  const [showMapModal, setShowMapModal] = React.useState(Boolean(initialShowMap));
  const [isMapExpanded, setIsMapExpanded] = React.useState(false);
  const [routeInfo, setRouteInfo] = React.useState<{ distanceKm: number; durationMin: number } | null>(null);
  const [routeSteps, setRouteSteps] = React.useState<Array<{ instruction: string; distance: number; duration: number }>>([]);
  const [userCoords, setUserCoords] = React.useState<{ lat: number; lng: number } | null>(null);
  const [routeProfile, setRouteProfile] = React.useState<RouteProfile>(initialRouteProfile || 'driving');
  const [isRecording, setIsRecording] = React.useState(false);
  const [recordingPaused, setRecordingPaused] = React.useState(false);
  const [recordingPoints, setRecordingPoints] = React.useState<PathPoint[]>([]);
  const [recordingDistance, setRecordingDistance] = React.useState(0);
  const [recordingStart, setRecordingStart] = React.useState<number | null>(null);
  const [pricingWarningConfig, setPricingWarningConfig] = React.useState<{ threshold_pct?: number; message?: string } | null>(null);
  const [showRecordingPanel, setShowRecordingPanel] = React.useState(false);
  const [recordingName, setRecordingName] = React.useState('');
  const [recordingShared, setRecordingShared] = React.useState(true);
  const [recordingStatus, setRecordingStatus] = React.useState<string | null>(null);
  const [voiceDirectionsEnabled, setVoiceDirectionsEnabled] = React.useState(false);
  const [popularPaths, setPopularPaths] = React.useState<RecordedPath[]>([]);
  const [preferredPathId, setPreferredPathId] = React.useState<string | null>(initialPreferredPathId ?? null);
  const [navigationMode, setNavigationMode] = React.useState<'silent' | 'mapbox'>(initialNavigationMode || 'silent');
  const [pathLandmarks, setPathLandmarks] = React.useState<PathLandmark[]>([]);
  const [buyerLocationLabel, setBuyerLocationLabel] = React.useState<string | null>(null);
  const mapContainerRef = React.useRef<HTMLDivElement | null>(null);
  const mapRef = React.useRef<any>(null);
  const userMarkerRef = React.useRef<any>(null);
  const sellerMarkerRef = React.useRef<any>(null);
  const mapReadyRef = React.useRef(false);
  const routeManeuversRef = React.useRef<Array<{ instruction: string; location: [number, number] }>>([]);
  const routeStepIndexRef = React.useRef(0);
  const routeStepMarkersRef = React.useRef<any[]>([]);
  const landmarkMarkersRef = React.useRef<any[]>([]);
  const recordingWatchIdRef = React.useRef<number | null>(null);
  const navWatchIdRef = React.useRef<number | null>(null);
  const buyerLocationInitRef = React.useRef(false);
  const mapboxToken = typeof (import.meta as any)?.env?.VITE_MAPBOX_TOKEN === 'string'
    ? (import.meta as any).env.VITE_MAPBOX_TOKEN
    : '';
  const mapboxModuleRef = React.useRef<any>(null);
  const mapboxLoadingRef = React.useRef<Promise<any> | null>(null);

  const syncModalFromHistory = React.useCallback((modal?: ProductDetailModal) => {
    setShowAIChat(modal === 'ai-chat');
    setShowCounterfeitModal(modal === 'counterfeit');
    setShowDisputeModal(modal === 'dispute');
    setShowMapModal(modal === 'map');
    setShowRecordingPanel(modal === 'recording');
  }, []);

  const pushModalHistory = React.useCallback((modal: ProductDetailModal) => {
    if (typeof window === 'undefined') return;
    const nextState = { ...(window.history.state || {}), productDetailModal: modal };
    window.history.pushState(nextState, '', `${window.location.pathname}${window.location.search}${window.location.hash}`);
  }, []);

  const setModal = React.useCallback((modal: ProductDetailModal, next: boolean) => {
    if (next) {
      syncModalFromHistory(modal);
      pushModalHistory(modal);
      return;
    }
    if (typeof window !== 'undefined' && window.history.state?.productDetailModal === modal) {
      window.history.back();
      return;
    }
    syncModalFromHistory(undefined);
  }, [pushModalHistory, syncModalFromHistory]);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const handlePopState = (event: PopStateEvent) => {
      const nextModal = event.state?.productDetailModal as ProductDetailModal | undefined;
      syncModalFromHistory(nextModal);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [syncModalFromHistory]);

  const ensureMapbox = async () => {
    if (mapboxModuleRef.current) {
      return mapboxModuleRef.current;
    }
    if (!mapboxLoadingRef.current) {
      mapboxLoadingRef.current = Promise.all([
        import('mapbox-gl'),
        import('mapbox-gl/dist/mapbox-gl.css')
      ]).then(([module]) => {
        const loaded = (module as any).default ?? module;
        mapboxModuleRef.current = loaded;
        return loaded;
      });
    }
    return mapboxLoadingRef.current;
  };
  const [orderRating, setOrderRating] = React.useState(5);
  const [orderComment, setOrderComment] = React.useState('');
  const [qaList, setQaList] = React.useState<QuestionItem[]>([]);
  const [qaInput, setQaInput] = React.useState('');
  const [productDetail, setProductDetail] = React.useState<Product>(product);
  const [media, setMedia] = React.useState<any[]>([]);
  const [priceHistory, setPriceHistory] = React.useState<PricePoint[]>([]);
  const [benchmark, setBenchmark] = React.useState<Record<string, any> | null>(null);
  const [goodDeal, setGoodDeal] = React.useState<Record<string, any> | null>(null);
  const [reviews, setReviews] = React.useState<Review[]>([]);
  const [sellerProfile, setSellerProfile] = React.useState<SellerProfile | null>(null);
  const sellerNavigationLandmarks = React.useMemo(
    () => (Array.isArray(sellerProfile?.landmarks) ? (sellerProfile.landmarks as PathLandmark[]) : []),
    [sellerProfile]
  );
  const navigationLandmarks = React.useMemo(
    () => (pathLandmarks.length > 0 ? pathLandmarks : sellerNavigationLandmarks),
    [pathLandmarks, sellerNavigationLandmarks]
  );
  const shopFrontImage = React.useMemo(
    () => navigationLandmarks.find((landmark) => landmark.type === 'shop_front')?.image_url || sellerProfile?.shop_front_image_url,
    [navigationLandmarks, sellerProfile?.shop_front_image_url]
  );
  const directionsNote = React.useMemo(
    () => String(sellerProfile?.directions_note || '').trim(),
    [sellerProfile?.directions_note]
  );
  const [sellerReputation, setSellerReputation] = React.useState<SellerReputation | null>(null);
  const [counterfeitSummary, setCounterfeitSummary] = React.useState<SummaryStat | null>(null);
  const [, setDisputeSummary] = React.useState<SummaryStat | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [showCounterfeitModal, setShowCounterfeitModal] = React.useState(false);
  const [showDisputeModal, setShowDisputeModal] = React.useState(false);
  const [counterfeitForm, setCounterfeitForm] = React.useState({
    reason: '',
    orderId: '',
    evidenceKeys: '',
  });
  const [counterfeitErrors, setCounterfeitErrors] = React.useState<{ reason?: string }>({});
  const [counterfeitEvidenceStatus, setCounterfeitEvidenceStatus] = React.useState<string | null>(null);
  const [counterfeitUploading, setCounterfeitUploading] = React.useState(false);
  const [disputeForm, setDisputeForm] = React.useState({
    orderId: '',
    reason: '',
    amount: '0',
    delivered: false,
    notReceived: true,
    gpsProof: false,
  });
  const [disputeErrors, setDisputeErrors] = React.useState<{ orderId?: string; reason?: string; amount?: string }>({});
  const [disputeId, setDisputeId] = React.useState('');
  const [disputeStatus, setDisputeStatus] = React.useState<string | null>(null);
  const [evidenceForm, setEvidenceForm] = React.useState({
    s3Key: '',
    fileName: '',
    mimeType: '',
    gpsLat: '',
    gpsLng: '',
    buyerPhone: '',
  });
  const [evidenceErrors, setEvidenceErrors] = React.useState<{ s3Key?: string; fileName?: string; mimeType?: string }>({});
  const [evidenceStatus, setEvidenceStatus] = React.useState<string | null>(null);
  const [uploadStatus, setUploadStatus] = React.useState<string | null>(null);
  const [shareStatus, setShareStatus] = React.useState<string | null>(null);
  const [uploading, setUploading] = React.useState(false);
  const [routeConfig, setRouteConfig] = React.useState<RouteMultipliersConfig>(() => getDefaultRouteMultipliers());
  const routeTelemetry = React.useMemo(() => createRouteTelemetryTracker('product_detail'), []);
  const evidenceAccept = '.png,.jpg,.jpeg,.gif,.webp,.bmp,.svg,.mp4,.webm,.mov,.m4v,.pdf,.doc,.docx,.txt,image/*,video/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain';

  React.useEffect(() => {
    let active = true;
    loadRouteMultipliers().then((config) => {
      if (active) setRouteConfig(config);
    });
    return () => {
      active = false;
    };
  }, []);

  React.useEffect(() => {
    let active = true;
    getOpsConfig('pricing.anomaly_warning')
      .then((resp) => {
        if (!active) return;
        setPricingWarningConfig((resp as any)?.value ?? null);
      })
      .catch(() => {
        if (!active) return;
        setPricingWarningConfig(null);
      });
    return () => {
      active = false;
    };
  }, []);

  React.useEffect(() => {
    if (initialShowMap) {
      setModal('map', true);
    }
  }, [initialShowMap, setModal]);

  React.useEffect(() => {
    if (initialPreferredPathId) {
      setPreferredPathId(initialPreferredPathId);
    }
  }, [initialPreferredPathId]);

  React.useEffect(() => {
    if (initialRouteProfile) {
      setRouteProfile(initialRouteProfile);
    }
  }, [initialRouteProfile]);

  React.useEffect(() => {
    if (initialNavigationMode) {
      setNavigationMode(initialNavigationMode);
    }
  }, [initialNavigationMode]);

  const activeProduct = React.useMemo(() => ({ ...product, ...productDetail }), [product, productDetail]);
  const productId = activeProduct.id;
  const displayPrice = React.useMemo(() => {
    return parsePriceValue(
      (activeProduct as any).current_price
      ?? (activeProduct as any).price
      ?? (activeProduct as any).unit_price
      ?? (activeProduct as any).sale_price
      ?? (activeProduct as any).offer_price
    ) || 0;
  }, [activeProduct]);
  const displayDiscountPrice = React.useMemo(() => {
    return parsePriceValue(
      (activeProduct as any).discount_price
      ?? (activeProduct as any).discountPrice
      ?? (activeProduct as any).sale_price
      ?? (activeProduct as any).offer_price
    ) || 0;
  }, [activeProduct]);
  const priceLabel = displayPrice > 0 ? formatKES(displayPrice) : 'Price on request';
  const previousPriceLabel = displayDiscountPrice > displayPrice ? formatKES(displayDiscountPrice) : '';
  const sellerId = (activeProduct as any).seller_id || activeProduct.sellerId || (productDetail as any).seller_id || product.sellerId;
  const sourceOrigin = String((activeProduct as any)?.sourceOrigin || (activeProduct as any)?.source_origin || (product as any)?.sourceOrigin || (product as any)?.source_origin || '').toLowerCase();
  const sourceLabel = (activeProduct as any)?.sourceLabel || (activeProduct as any)?.source_label || (product as any)?.sourceLabel || (product as any)?.source_label || '';
  const isPubliclyCollected = sourceOrigin === 'publicly_collected';
  const rawSourceShopLabel = (() => {
    const label = normalizeLabel(sourceLabel);
    if (!label) return '';
    return label.replace(/^publicly collected data from\s+/i, '').trim();
  })();
  const sellerUrlBrand = deriveBrandFromUrl(
    sellerProfile?.shop_url,
    sellerProfile?.website_url,
    sellerProfile?.store_url,
    sellerProfile?.external_url,
    sellerProfile?.url,
    (activeProduct as any)?.product_url,
    (activeProduct as any)?.external_url,
    (activeProduct as any)?.website_url,
    (activeProduct as any)?.url,
  );
  const publicSourceShopLabel = pickMeaningfulLabel(
    rawSourceShopLabel,
    sellerUrlBrand,
    (activeProduct as any)?.seller_name,
    (activeProduct as any)?.sellerName,
    (activeProduct as any)?.shop_name,
    (activeProduct as any)?.shopName,
    (activeProduct as any)?.merchant_name,
    (activeProduct as any)?.merchantName,
  );
  const profileShopLabel = pickMeaningfulLabel(
    sellerProfile?.shop_name,
    sellerProfile?.display_name,
    sellerProfile?.name,
    sellerProfile?.market_name,
  );
  const marketplaceDisplayName = (isPubliclyCollected ? publicSourceShopLabel : profileShopLabel)
    || publicSourceShopLabel
    || profileShopLabel
    || 'Shop';
  const merchantProfileDisplayName = profileShopLabel || 'Merchant profile';
  const sellerDisplaySubtitle = sellerProfile?.verified || sellerProfile?.isVerified
    ? 'Verified merchant'
    : publicSourceShopLabel
      ? `Collected from ${publicSourceShopLabel}`
      : isPubliclyCollected
        ? 'Publicly collected shop'
        : 'Merchant';
  const sellerLocationLabel = sellerProfile?.market_name
    || sellerProfile?.location?.address
    || sellerProfile?.address
    || '';
  const primaryMedia = resolveMediaUrl(media) || activeProduct.mediaUrl;
  const externalProductUrl = normalizeExternalUrl(
    (activeProduct as any).product_url
      || (activeProduct as any).external_url
      || (activeProduct as any).website_url
      || (activeProduct as any).url
      || sellerProfile?.website_url
      || sellerProfile?.website
      || sellerProfile?.store_url
      || sellerProfile?.shop_url
      || sellerProfile?.external_url
      || sellerProfile?.url
  );
  const baseRating = numberOrZero(sellerReputation?.rating ?? sellerProfile?.rating);
  const buyerAvatars = Array.isArray((sellerReputation as any)?.buyer_avatars)
    ? ((sellerReputation as any).buyer_avatars as string[]).filter(Boolean)
    : [];
  const averageRating = reviews.length
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
    : baseRating.toFixed(1);
  const deliveryDetails = (sellerProfile?.delivery_details || sellerProfile?.deliveryDetails || {}) as Record<string, any>;
  const deliveryPaymentOptions = Array.isArray(deliveryDetails.payment_options)
    ? deliveryDetails.payment_options.join(', ')
    : '';
  const sellerModeLabel = (sellerProfile?.seller_mode || sellerProfile?.sellerMode || '').toString();
  const sellerRatingLabel = formatCountLabel(sellerReputation?.rating ?? sellerProfile?.rating, 'No rating yet');
  const sellerFollowersLabel = formatCountLabel(sellerReputation?.followers ?? sellerProfile?.followers, 'No followers yet');

  const haversine = (a: { lat: number; lng: number }, b: { lat: number; lng: number }) => {
    const R = 6371;
    const dLat = ((b.lat - a.lat) * Math.PI) / 180;
    const dLon = ((b.lng - a.lng) * Math.PI) / 180;
    const lat1 = (a.lat * Math.PI) / 180;
    const lat2 = (b.lat * Math.PI) / 180;
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h)) * 1000;
  };

  const speak = (text: string) => {
    if (!voiceDirectionsEnabled) return;
    if ('speechSynthesis' in window && text) {
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = 'en-US';
      window.speechSynthesis.speak(utter);
    }
  };

  const benchmarkPrice = numberOrZero(
    benchmark?.average_price ?? benchmark?.avg_price ?? benchmark?.price ?? benchmark?.market_price ?? activeProduct.competitorPrice
  );

  const goodDealFlag = Boolean(goodDeal?.is_good_deal || goodDeal?.good_deal || activeProduct.isGoodDeal);
  const anomalyThresholdPct = pricingWarningConfig?.threshold_pct;
  const anomalyThresholdRatio = anomalyThresholdPct !== undefined
    ? Math.max(0, 1 - Number(anomalyThresholdPct) / 100)
    : 0.6;
  const anomalyWarningMessage = pricingWarningConfig?.message
    || 'This price is significantly below market average. Verify seller and product authenticity.';

  const handleWhatsApp = () => {
    const rawPhone = sellerProfile?.whatsappNumber || sellerProfile?.whatsapp_number || sellerProfile?.whatsapp;
    const phone = typeof rawPhone === 'string' ? rawPhone.replace(/[^\d]/g, '') : '';
    if (phone) {
      const message = encodeURIComponent(`Hi, I'm interested in ${activeProduct.name} I saw on Sconnect. Is it still available?`);
      window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
      return;
    }
    setError('WhatsApp contact not available for this seller.');
  };

  const handleCallSeller = () => {
    const rawPhone = sellerProfile?.phone_number || sellerProfile?.whatsappNumber || sellerProfile?.whatsapp_number || sellerProfile?.whatsapp;
    const phone = typeof rawPhone === 'string' ? rawPhone.replace(/[^\d+]/g, '') : '';
    if (phone) {
      window.location.href = `tel:${phone}`;
      return;
    }
    setError('Phone contact not available for this seller.');
  };

  const handleGetDirections = () => {
    const address = activeProduct.location?.address || sellerProfile?.location?.address || sellerProfile?.address;
    const loc = activeProduct.location || sellerProfile?.location;
    if (mapboxToken && loc?.lat && loc?.lng) {
      setModal('map', true);
      return;
    }
    if (address) {
      window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`, '_blank');
      return;
    }
    setError('Directions are not available for this listing yet.');
  };

  const handleVisitSite = () => {
    if (!externalProductUrl) return;
    window.open(externalProductUrl, '_blank');
  };

  const triggerComparisonFly = () => {
    if (!imageRef.current) return;
    const startRect = imageRef.current.getBoundingClientRect();
    const target = document.querySelector('[data-compare-target="search"]') as HTMLElement | null;
    const targetRect = target?.getBoundingClientRect();
    const start = {
      x: startRect.left + startRect.width / 2,
      y: startRect.top + startRect.height / 2,
      size: Math.min(startRect.width, startRect.height)
    };
    const end = targetRect
      ? {
          x: targetRect.left + targetRect.width / 2,
          y: targetRect.top + targetRect.height / 2,
          size: Math.min(targetRect.width, targetRect.height)
        }
      : {
          x: window.innerWidth - 48,
          y: window.innerHeight - 120,
          size: 24
        };
    setFlyThumb({ src: primaryMedia, start, end });
    window.setTimeout(() => setFlyThumb(null), 850);
  };

  const handleAddToComparisonClick = () => {
    if (isCompared) return;
    onAddToComparison(activeProduct);
    window.setTimeout(triggerComparisonFly, 60);
  };

  const handleBuyNow = async () => {
    const hasSession = Boolean(getAuthItem('soko:auth_token'));
    if (onBuyNow) {
      onBuyNow(activeProduct);
      return;
    }
    try {
      if (!sellerId) {
        setError('Seller unavailable for this product.');
        return;
      }
        await addCartItem({
          product_id: productId,
          seller_id: sellerId,
          quantity,
          unit_price: displayPrice,
        });
      if (!hasSession) {
        onAddToBag?.(activeProduct);
        setError('Added to bag. Open your bag to checkout.');
        return;
      }
      await checkoutCart();
      void createAuditEvent({ action: 'buy_now', entity_type: 'product', entity_id: productId }).catch(() => {});
    } catch (err: any) {
      setError(err?.message || 'Unable to complete checkout.');
    }
  };

  const handleAddToBagClick = async () => {
    try {
      if (!sellerId) {
        setError('Seller unavailable for this product.');
        return;
      }
        await addCartItem({
          product_id: productId,
          seller_id: sellerId,
          quantity,
          unit_price: displayPrice,
        });
      onAddToBag?.(activeProduct);
      void createAuditEvent({ action: 'add_to_cart', entity_type: 'product', entity_id: productId }).catch(() => {});
    } catch (err: any) {
      setError(err?.message || 'Unable to add to bag.');
    }
  };

  const handleSubmitReview = async () => {
    if (!getAuthItem('soko:auth_token')) {
      onRequireLogin?.('Sign in to leave a product review.');
      return;
    }
    if (!reviewForm.comment.trim()) return;
    try {
      const created = await createProductReview(productId, {
        rating: reviewForm.rating,
        comment: reviewForm.comment,
      });
      const nextReview = normalizeReview(created || {
        id: `r_${Date.now()}`,
        user_name: reviewForm.name || 'You',
        rating: reviewForm.rating,
        comment: reviewForm.comment,
        created_at: new Date().toISOString(),
        verified: true,
      });
      setReviews(prev => [nextReview, ...prev]);
      setReviewForm({ name: 'You', rating: 5, comment: '' });
      setShowReviewForm(false);
      void createAuditEvent({ action: 'create_review', entity_type: 'product', entity_id: productId }).catch(() => {});
    } catch (err: any) {
      setError(err?.message || 'Could not submit review.');
    }
  };

  const handleFlagReview = async (reviewId: string) => {
    if (!getAuthItem('soko:auth_token')) {
      onRequireLogin?.('Sign in to flag a review.');
      return;
    }
    try {
      await createModerationReview({
        source_type: 'product_review',
        source_id: reviewId,
        seller_id: sellerId,
        reason: 'flagged_by_user',
      });
      void createAuditEvent({ action: 'flag_review', entity_type: 'review', entity_id: reviewId }).catch(() => {});
    } catch (err: any) {
      setError(err?.message || 'Unable to flag review.');
    }
  };

  const handleAskQuestion = async () => {
    if (!getAuthItem('soko:auth_token')) {
      onRequireLogin?.('Sign in to ask a product question.');
      return;
    }
    if (!qaInput.trim()) return;
    try {
      const created = await createProductQuestion(productId, { question: qaInput.trim() });
      const nextQuestion = normalizeQuestion(created || { question: qaInput.trim(), author: 'You' });
      setQaList(prev => [nextQuestion, ...prev]);
      setQaInput('');
      void createAuditEvent({ action: 'ask_question', entity_type: 'product', entity_id: productId }).catch(() => {});
    } catch (err: any) {
      setError(err?.message || 'Unable to submit question.');
    }
  };

  const handleAnswerQuestion = async (questionId: string) => {
    if (!getAuthItem('soko:auth_token')) {
      onRequireLogin?.('Sign in to answer product questions.');
      return;
    }
    const answer = window.prompt('Answer this question:');
    if (!answer?.trim()) return;
    try {
      await answerProductQuestion(questionId, { comment: answer.trim() });
      setQaList(prev => prev.map(item => item.id === questionId ? { ...item, answer: answer.trim() } : item));
    } catch (err: any) {
      setError(err?.message || 'Unable to submit answer.');
    }
  };

  const handleToggleWatch = async () => {
    if (!getAuthItem('soko:auth_token')) {
      onRequireLogin?.('Sign in to watch this product and receive alerts.');
      return;
    }
    try {
      if (!isWatched) {
        const targetInput = window.prompt('Target price for alert (KES):', String(displayPrice || 0));
        const target = targetInput ? Number(targetInput) : displayPrice;
        await watchProduct(productId, { target_price: target });
        setIsWatched(true);
        setWatchTarget(target);
        void createAuditEvent({ action: 'watch_product', entity_type: 'product', entity_id: productId }).catch(() => {});
      } else {
        await unwatchProduct(productId);
        setIsWatched(false);
        setWatchTarget(null);
        void createAuditEvent({ action: 'unwatch_product', entity_type: 'product', entity_id: productId }).catch(() => {});
      }
    } catch (err: any) {
      setError(err?.message || 'Unable to update watchlist.');
    }
  };

  const handleUpdateWatch = async () => {
    if (!isWatched) return;
    const targetInput = window.prompt('Update target price (KES):', String(watchTarget ?? displayPrice));
    const target = targetInput ? Number(targetInput) : watchTarget ?? displayPrice;
    try {
      await updateWatch(productId, { target_price: target });
      setWatchTarget(target);
    } catch (err: any) {
      setError(err?.message || 'Unable to update watch target.');
    }
  };

  const handleShareReward = async () => {
    if (!getAuthItem('soko:auth_token')) {
      onRequireLogin?.('Sign in to earn share rewards.');
      return;
    }
    try {
      const channel = typeof navigator !== 'undefined' && 'share' in navigator ? 'native' : 'link';
      await shareProduct(productId, { channel });
      void createAuditEvent({ action: 'share_product', entity_type: 'product', entity_id: productId }).catch(() => {});
    } catch (err: any) {
      setError(err?.message || 'Unable to register share reward.');
    }

    const text = `Check out ${activeProduct.name} on Sconnect!`;
    if (navigator.share) {
      try {
        await navigator.share({ title: activeProduct.name, text, url: window.location.href });
        setShareStatus('Share sheet opened. Your reward will track once the link is shared.');
        return;
      } catch {}
    }
    try {
      await navigator.clipboard.writeText(window.location.href);
      setShareStatus('Share link copied. Earn rewards when friends confirm purchases.');
    } catch {
      setShareStatus(`Share this link to earn rewards: ${window.location.href}`);
    }
  };

  const handleCounterfeitReport = async () => {
    if (!getAuthItem('soko:auth_token')) {
      onRequireLogin?.('Sign in to report counterfeit products.');
      return;
    }
    const reason = counterfeitForm.reason.trim();
    if (!reason) {
      setCounterfeitErrors({ reason: 'Reason is required.' });
      return;
    }
    setCounterfeitErrors({});
    const evidenceKeys = counterfeitForm.evidenceKeys
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean);
    try {
      await createCounterfeitReport({
        product_id: productId,
        seller_id: sellerId,
        reason,
        details: reason,
        order_id: counterfeitForm.orderId.trim() || null,
        similarity_score: null,
        evidence_keys: evidenceKeys,
      });
      void createAuditEvent({ action: 'report_counterfeit', entity_type: 'product', entity_id: productId }).catch(() => {});
      setModal('counterfeit', false);
      setCounterfeitForm({ reason: '', orderId: '', evidenceKeys: '' });
    } catch (err: any) {
      setError(err?.message || 'Unable to submit counterfeit report.');
    }
  };

  const handleDispute = async () => {
    if (!getAuthItem('soko:auth_token')) {
      onRequireLogin?.('Sign in to open a dispute.');
      return;
    }
    if (!disputeForm.orderId.trim()) {
      setDisputeErrors({ orderId: 'Order ID is required.' });
      return;
    }
    const reason = disputeForm.reason.trim();
    if (!reason) {
      setDisputeErrors({ orderId: '', reason: 'Reason is required.' });
      return;
    }
    const disputeAmount = Number(disputeForm.amount);
    if (!Number.isFinite(disputeAmount) || disputeAmount < 0) {
      setDisputeErrors({ orderId: '', reason: '', amount: 'Amount must be a valid number.' });
      return;
    }
    setDisputeErrors({});
    try {
      const created = await createDispute({
        seller_id: sellerId,
        order_id: disputeForm.orderId.trim(),
        product_id: productId,
        dispute_amount: Number.isFinite(disputeAmount) ? disputeAmount : 0,
        reason,
        details: reason,
        gps_mismatch_km: 0,
        order_delivered: disputeForm.delivered,
        buyer_claims_not_received: disputeForm.notReceived,
        has_gps_proof: disputeForm.gpsProof,
      });
      const createdId = created?.id || created?.dispute_id || '';
      if (createdId) setDisputeId(createdId);
      setDisputeStatus('Dispute created. You can add evidence below.');
      void createAuditEvent({ action: 'create_dispute', entity_type: 'order', entity_id: disputeForm.orderId.trim() }).catch(() => {});
    } catch (err: any) {
      setError(err?.message || 'Unable to open dispute.');
    }
  };

  const uploadEvidenceAttachment = async (file: File, context: 'dispute' | 'counterfeit') => {
    if (!getAuthItem('soko:auth_token')) {
      onRequireLogin?.('Sign in to upload evidence.');
      return null;
    }
    const approvedFile = await requestMediaUploadPreview(file, {
      title: context === 'dispute' ? 'Preview dispute evidence' : 'Preview counterfeit evidence',
      description: 'Review the image or video before attaching it as evidence.',
      confirmLabel: 'Attach evidence'
    });
    const presign = await requestUploadPresign({
      file_name: approvedFile.name,
      mime_type: approvedFile.type,
      content_length: approvedFile.size,
      context: context === 'dispute' ? 'dispute_evidence' : 'counterfeit_evidence',
    });
    const uploadUrl = presign.upload_url || presign.url;
    if (!uploadUrl) {
      throw new Error('Upload URL missing.');
    }
    const method = (presign.method || (presign.fields ? 'POST' : 'PUT')).toUpperCase();
    if (presign.fields) {
      const form = new FormData();
      Object.entries(presign.fields).forEach(([key, value]) => form.append(key, value));
      form.append('file', approvedFile);
      await fetch(uploadUrl, { method: 'POST', body: form });
    } else {
      const headers: Record<string, string> = { ...(presign.headers || {}) };
      if (!headers['Content-Type'] && approvedFile.type) headers['Content-Type'] = approvedFile.type;
      await fetch(uploadUrl, { method, body: approvedFile, headers });
    }
    return {
      s3Key: presign.fields?.key || presign.s3_key || presign.key || '',
      fileName: approvedFile.name,
      mimeType: approvedFile.type,
    };
  };

  const handleEvidenceUpload = async () => {
    if (!getAuthItem('soko:auth_token')) {
      onRequireLogin?.('Sign in to upload dispute evidence.');
      return;
    }
    if (!disputeId) {
      setEvidenceStatus('Create the dispute first to add evidence.');
      return;
    }
    const hasAnyField = Object.values(evidenceForm).some((value) => value.trim() !== '');
    if (!hasAnyField) {
      setEvidenceStatus('Add at least one evidence field before submitting.');
      return;
    }
    if (!evidenceForm.s3Key.trim() || !evidenceForm.fileName.trim() || !evidenceForm.mimeType.trim()) {
      setEvidenceErrors({
        s3Key: evidenceForm.s3Key.trim() ? '' : 'Evidence file is required.',
        fileName: evidenceForm.fileName.trim() ? '' : 'File name is required.',
        mimeType: evidenceForm.mimeType.trim() ? '' : 'MIME type is required.',
      });
      return;
    }
    setEvidenceErrors({});
    setEvidenceStatus(null);
    try {
      await uploadDisputeEvidence(disputeId, {
        s3_key: evidenceForm.s3Key.trim(),
        file_name: evidenceForm.fileName.trim(),
        mime_type: evidenceForm.mimeType.trim(),
        gps_lat: evidenceForm.gpsLat.trim() || undefined,
        gps_lng: evidenceForm.gpsLng.trim() || undefined,
        buyer_phone: evidenceForm.buyerPhone.trim() || undefined,
      });
      setEvidenceStatus('Evidence uploaded.');
      setEvidenceForm({ s3Key: '', fileName: '', mimeType: '', gpsLat: '', gpsLng: '', buyerPhone: '' });
    } catch (err: any) {
      setEvidenceStatus(err?.message || 'Unable to upload evidence.');
    }
  };

  const handleEvidenceFileSelect = async (file?: File) => {
    if (!file) return;
    setUploading(true);
    setUploadStatus('Requesting upload link...');
    try {
      setUploadStatus('Uploading file...');
      const next = await uploadEvidenceAttachment(file, 'dispute');
      if (next) {
        setEvidenceForm(prev => ({
          ...prev,
          s3Key: next.s3Key || prev.s3Key,
          fileName: next.fileName,
          mimeType: next.mimeType,
        }));
      }
      setUploadStatus('Upload complete. Add evidence details and submit.');
    } catch (err: any) {
      setUploadStatus(err?.message || 'Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const handleCounterfeitEvidenceFileSelect = async (file?: File) => {
    if (!file) return;
    setCounterfeitUploading(true);
    setCounterfeitEvidenceStatus('Uploading evidence...');
    try {
      const next = await uploadEvidenceAttachment(file, 'counterfeit');
      if (next?.s3Key) {
        setCounterfeitForm((prev) => ({
          ...prev,
          evidenceKeys: prev.evidenceKeys
            ? `${prev.evidenceKeys}, ${next.s3Key}`
            : next.s3Key
        }));
        setCounterfeitEvidenceStatus(`Attached ${next.fileName}.`);
      } else {
        setCounterfeitEvidenceStatus(`Attached ${file.name}.`);
      }
    } catch (err: any) {
      setCounterfeitEvidenceStatus(err?.message || 'Upload failed.');
    } finally {
      setCounterfeitUploading(false);
    }
  };

  const handleFollowup = async () => {
    if (followUpEnabled) return;
    const orderId = followupOrderId || window.prompt('Order ID to schedule follow-up:');
    if (!orderId?.trim()) return;
    const due = new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString();
    try {
      await scheduleOrderFollowup(orderId.trim(), { follow_type: 'purchase_confirmation', due_at: due });
      setFollowUpEnabled(true);
      setFollowupOrderId(orderId.trim());
      void createAuditEvent({ action: 'schedule_followup', entity_type: 'order', entity_id: orderId.trim() }).catch(() => {});
    } catch (err: any) {
      setError(err?.message || 'Unable to schedule follow-up.');
    }
  };

  const handleOrderRating = async () => {
    if (!ratingOrderId.trim()) {
      setError('Order ID is required to submit a rating.');
      return;
    }
    try {
      await submitOrderRating(ratingOrderId.trim(), {
        seller_id: sellerId,
        rating: orderRating,
        comment: orderComment || undefined,
      });
      setOrderComment('');
      void createAuditEvent({ action: 'rate_order', entity_type: 'order', entity_id: ratingOrderId.trim() }).catch(() => {});
    } catch (err: any) {
      setError(err?.message || 'Unable to submit order rating.');
    }
  };

  React.useEffect(() => {
    let alive = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const detail = await getProductDetail(productId);
        if (!alive) return;
        setProductDetail((prev) => ({ ...prev, ...(detail as any) }));

        const sellerProductId = (detail as any)?.seller_product_id || (detail as any)?.sellerProductId;
        const [mediaResp, historyResp, benchmarkResp, goodDealResp, reviewResp, questionResp, counterfeitResp, disputeResp] = await Promise.all([
          getProductMedia(productId),
          getProductPriceHistory(productId),
          getProductBenchmark(productId, { category_id: (detail as any)?.category_id || undefined }),
          sellerProductId ? getProductGoodDeal(productId, { seller_product_id: sellerProductId }) : Promise.resolve(null),
          listProductReviews(productId),
          listProductQuestions(productId),
          getCounterfeitSummary().catch(() => null),
          getDisputeSummary().catch(() => null),
        ]);
        if (!alive) return;

        setMedia(mediaResp || []);
        setPriceHistory(normalizePriceHistory(historyResp || []));
        setBenchmark(benchmarkResp || null);
        setGoodDeal(goodDealResp || null);
        setReviews((reviewResp || []).map(normalizeReview));
        setQaList((questionResp || []).map(normalizeQuestion));
        setCounterfeitSummary(counterfeitResp || null);
        setDisputeSummary(disputeResp || null);

        if (sellerId) {
          const [profileResp, repResp] = await Promise.all([
            getShopProfile(sellerId).catch(() => null),
            getSellerReputation(sellerId).catch(() => null),
          ]);
          if (!alive) return;
          setSellerProfile(profileResp || null);
          setSellerReputation(repResp || null);
        }
      } catch (err: any) {
        if (!alive) return;
        setError(err?.message || 'Unable to load product detail.');
      } finally {
        if (alive) setLoading(false);
      }
    };
    load();
    return () => {
      alive = false;
    };
  }, [productId, sellerId]);

  React.useEffect(() => {
    let alive = true;
    if (!getAuthItem('soko:auth_token')) {
      setVoiceDirectionsEnabled(false);
      return () => {
        alive = false;
      };
    }
    getUiPreferences()
      .then((prefs) => {
        if (!alive) return;
        setVoiceDirectionsEnabled(Boolean(prefs?.voice_directions_enabled));
      })
      .catch(() => {
        if (!alive) return;
        setVoiceDirectionsEnabled(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  React.useEffect(() => {
    if (!showMapModal) return;
    if (!getAuthItem('soko:auth_token')) return;
    let active = true;
    const hasCoords = (loc?: UserLocation | null) =>
      Boolean(loc && loc.lat !== undefined && loc.lng !== undefined && Number.isFinite(Number(loc.lat)) && Number.isFinite(Number(loc.lng)));
    const resolveBuyerLocation = async () => {
      try {
        const locations = await listUserLocations().catch(() => []);
        if (!active) return;
        if (buyerLocationInitRef.current || userCoords) return;
        const preferred = (locations || []).find((location) => location.is_default && hasCoords(location))
          || (locations || []).find((location) => hasCoords(location));
        if (preferred && hasCoords(preferred)) {
          buyerLocationInitRef.current = true;
          setUserCoords({ lat: Number(preferred.lat), lng: Number(preferred.lng) });
          setBuyerLocationLabel(preferred.label || preferred.address_line || 'Saved Location');
          return;
        }
        if (!navigator.geolocation) return;
        navigator.geolocation.getCurrentPosition(
          (position) => {
            if (!active || buyerLocationInitRef.current || userCoords) return;
            buyerLocationInitRef.current = true;
            setUserCoords({
              lat: position.coords.latitude,
              lng: position.coords.longitude
            });
            setBuyerLocationLabel('My Location');
          },
          () => {}
        );
      } catch {}
    };
    resolveBuyerLocation();
    return () => {
      active = false;
    };
  }, [showMapModal]);

  React.useEffect(() => {
    if (!showMapModal) {
      buyerLocationInitRef.current = false;
      setBuyerLocationLabel(null);
      setIsMapExpanded(false);
      return;
    }
    if (!mapReadyRef.current || !mapRef.current || !userCoords) return;
    const mapboxgl = mapboxModuleRef.current;
    if (!mapboxgl) return;
    mapRef.current.easeTo({
      center: [userCoords.lng, userCoords.lat],
      duration: 500
    });
    if (userMarkerRef.current) {
      userMarkerRef.current.setLngLat([userCoords.lng, userCoords.lat]);
    } else {
      userMarkerRef.current = new mapboxgl.Marker({ color: '#10b981' })
        .setLngLat([userCoords.lng, userCoords.lat])
        .addTo(mapRef.current);
    }
  }, [showMapModal, userCoords]);

  React.useEffect(() => {
    if (!showMapModal) return;
    const loc = activeProduct.location || sellerProfile?.location;
    const lat = loc?.lat;
    const lng = loc?.lng;
    if (!mapboxToken || !Number.isFinite(lat) || !Number.isFinite(lng)) return;
    if (!mapContainerRef.current) return;
    let active = true;
    ensureMapbox().then((mapboxgl) => {
      if (!active) return;
      mapboxgl.accessToken = mapboxToken;
      if (!mapRef.current) {
        const map = new mapboxgl.Map({
          container: mapContainerRef.current,
          style: 'mapbox://styles/mapbox/streets-v12',
          center: [lng as number, lat as number],
          zoom: 14
        });
        map.addControl(new mapboxgl.NavigationControl(), 'top-right');
        map.on('load', () => {
          mapReadyRef.current = true;
          if (!map.getSource('route-line')) {
            map.addSource('route-line', {
              type: 'geojson',
              data: { type: 'FeatureCollection', features: [] }
            });
            map.addLayer({
              id: 'route-line',
              type: 'line',
              source: 'route-line',
              paint: {
                'line-color': '#4f46e5',
                'line-width': 4
              }
            });
          }
          if (!map.getSource('popular-paths')) {
            map.addSource('popular-paths', {
              type: 'geojson',
              data: { type: 'FeatureCollection', features: [] }
            });
            map.addLayer({
              id: 'popular-paths',
              type: 'line',
              source: 'popular-paths',
              paint: {
                'line-color': '#f97316',
                'line-width': 3,
                'line-opacity': 0.6
              }
            });
          }
          if (!map.getSource('recording-path')) {
            map.addSource('recording-path', {
              type: 'geojson',
              data: { type: 'FeatureCollection', features: [] }
            });
            map.addLayer({
              id: 'recording-path',
              type: 'line',
              source: 'recording-path',
              paint: {
                'line-color': '#ef4444',
                'line-width': 4
              }
            });
          }
        });
        mapRef.current = map;
        sellerMarkerRef.current = new mapboxgl.Marker({ color: '#4f46e5' })
          .setLngLat([lng as number, lat as number])
          .addTo(map);
      }
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const coords = { lat: position.coords.latitude, lng: position.coords.longitude };
            setUserCoords(coords);
            if (mapRef.current) {
              userMarkerRef.current?.remove();
              userMarkerRef.current = new mapboxgl.Marker({ color: '#10b981' })
                .setLngLat([coords.lng, coords.lat])
                .addTo(mapRef.current);
            }
          },
          () => {}
        );
      }
      (async () => {
        try {
          const pad = 0.05;
          const bbox = [
            Number(lng) - pad,
            Number(lat) - pad,
            Number(lng) + pad,
            Number(lat) + pad
          ].join(',');
          let paths: RecordedPath[] = [];
          const sellerPathsList = sellerId ? await listSellerPaths(sellerId) : [];
          if (sellerPathsList.length > 0) {
            paths = sellerPathsList;
            setPopularPaths(sellerPathsList);
            if (!preferredPathId) {
              const primary = sellerPathsList.find((path) => path.is_primary);
              if (primary?.id) {
                setPreferredPathId(primary.id);
              } else if (sellerPathsList[0]?.id) {
                setPreferredPathId(sellerPathsList[0].id);
              }
            }
          } else {
            paths = await listPopularPaths({ bbox, limit: 30 });
            setPopularPaths(paths);
            if (!preferredPathId) {
              const best = paths.sort((a, b) => (b.usage_count || 0) - (a.usage_count || 0))[0];
              if (best?.id) {
                setPreferredPathId(best.id);
              }
            }
          }
          const source = mapRef.current?.getSource('popular-paths') as any;
          if (source) {
            const features = paths
              .map((path) => path.line_geojson ? ({
                type: 'Feature',
                geometry: path.line_geojson,
                properties: { id: path.id, name: path.name, usage_count: path.usage_count || 0 }
              }) : null)
              .filter(Boolean);
            source.setData({ type: 'FeatureCollection', features } as any);
          }
        } catch {}
      })();
    });
    return () => {
      active = false;
    };
  }, [activeProduct.location, mapboxToken, sellerId, sellerProfile?.location, showMapModal]);

  React.useEffect(() => {
    if (!showMapModal || !mapReadyRef.current || !mapRef.current) return;
    const source = mapRef.current.getSource('recording-path') as any;
    if (!source) return;
    if (recordingPoints.length < 2) {
      source.setData({ type: 'FeatureCollection', features: [] } as any);
      return;
    }
    const line = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: recordingPoints.map((p) => [p.lng, p.lat])
          },
          properties: {}
        }
      ]
    };
    source.setData(line as any);
  }, [recordingPoints, showMapModal]);

  React.useEffect(() => {
    if (!showMapModal || !mapReadyRef.current || !mapRef.current || !userCoords) return;
    const mapboxgl = mapboxModuleRef.current;
    if (!mapboxgl) return;
    const loc = activeProduct.location || sellerProfile?.location;
    const lat = loc?.lat;
    const lng = loc?.lng;
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
    const fromLng = userCoords.lng;
    const fromLat = userCoords.lat;
    const toLng = Number(lng);
    const toLat = Number(lat);
    const fetchRoute = async () => {
      try {
        const profile = toMapboxProfile(routeProfile);
        let data: any = null;
        if (preferredPathId) {
          data = await getCustomNavigation({
            path_id: preferredPathId,
            from_lng: fromLng,
            from_lat: fromLat,
            to_lng: toLng,
            to_lat: toLat,
            profile
          });
        } else {
          const url = `https://api.mapbox.com/directions/v5/mapbox/${profile}/${fromLng},${fromLat};${toLng},${toLat}?geometries=geojson&overview=full&access_token=${mapboxToken}`;
          const res = await fetch(url);
          if (!res.ok) return;
          data = await res.json();
        }
        const route = data?.routes?.[0];
        if (!route) return;
        const geojson = {
          type: 'FeatureCollection',
          features: [
            {
              type: 'Feature',
              geometry: route.geometry,
              properties: {}
            }
          ]
        };
        const source = mapRef.current?.getSource('route-line') as any;
        source?.setData(geojson as any);
        const steps = route.legs?.[0]?.steps || [];
        const cityKey = detectCityKey(activeProduct.location?.address || sellerProfile?.location?.address);
        const cityMultiplier = getCityMultiplier(routeConfig, cityKey, routeProfile);
        const profileMultiplier = getProfileMultiplier(routeConfig, routeProfile);
        const adjustedSteps: Array<{ instruction: string; distance: number; duration: number }> = steps.map((step: any) => ({
          instruction: step.maneuver?.instruction || 'Continue',
          distance: Math.round(step.distance || 0),
          duration: Math.round((step.duration || 0) * profileMultiplier * cityMultiplier * getStepRoadMultiplier(routeConfig, step))
        }));
        const adjustedDuration = adjustedSteps.reduce((sum: number, step) => sum + (step.duration || 0), 0);
        setRouteInfo({
          distanceKm: Math.round((route.distance / 1000) * 10) / 10,
          durationMin: Math.max(1, Math.round(adjustedDuration / 60))
        });
        setRouteSteps(adjustedSteps);
        routeTelemetry({
          profile: routeProfile,
          city: cityKey,
          distance_km: Math.round((route.distance / 1000) * 10) / 10,
          duration_min: Math.max(1, Math.round(adjustedDuration / 60)),
          path_id: preferredPathId,
          seller_id: sellerId || null,
          product_id: productId || null
        });
        routeManeuversRef.current = steps
          .map((step: any) => ({
            instruction: step.maneuver?.instruction || 'Continue',
            location: step.maneuver?.location as [number, number]
          }))
          .filter((item: any) => Array.isArray(item.location) && item.location.length === 2);
        routeStepIndexRef.current = 0;
        routeStepMarkersRef.current.forEach((marker) => marker.remove());
        routeStepMarkersRef.current = [];
        routeManeuversRef.current.slice(0, 8).forEach((step, idx) => {
          const el = document.createElement('div');
          el.className = 'w-6 h-6 rounded-full bg-indigo-600 text-white text-[10px] font-black flex items-center justify-center shadow';
          el.textContent = String(idx + 1);
          const marker = new mapboxgl.Marker({ element: el })
            .setLngLat(step.location)
            .addTo(mapRef.current!);
          routeStepMarkersRef.current.push(marker);
        });
      } catch {}
    };
    fetchRoute();
  }, [activeProduct.location, mapboxToken, navigationMode, preferredPathId, routeProfile, sellerProfile?.location, showMapModal, userCoords]);

  React.useEffect(() => {
    if (!showMapModal && mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
      userMarkerRef.current = null;
      sellerMarkerRef.current = null;
      routeStepMarkersRef.current.forEach((marker) => marker.remove());
      routeStepMarkersRef.current = [];
      landmarkMarkersRef.current.forEach((marker) => marker.remove());
      landmarkMarkersRef.current = [];
      mapReadyRef.current = false;
      setRouteInfo(null);
      setRouteSteps([]);
      if (navWatchIdRef.current) {
        navigator.geolocation.clearWatch(navWatchIdRef.current);
        navWatchIdRef.current = null;
      }
      if (recordingWatchIdRef.current) {
        navigator.geolocation.clearWatch(recordingWatchIdRef.current);
        recordingWatchIdRef.current = null;
      }
      setIsRecording(false);
      setRecordingPaused(false);
      setShowRecordingPanel(false);
      setRecordingPoints([]);
      setRecordingDistance(0);
      setRecordingStart(null);
    }
  }, [showMapModal]);

  React.useEffect(() => {
    if (!showMapModal || !mapRef.current) return;
    const raf = window.requestAnimationFrame(() => {
      mapRef.current?.resize?.();
    });
    return () => window.cancelAnimationFrame(raf);
  }, [isMapExpanded, showMapModal, userCoords, routeInfo]);

  const stopNavWatch = () => {
    if (navWatchIdRef.current) {
      navigator.geolocation.clearWatch(navWatchIdRef.current);
      navWatchIdRef.current = null;
    }
  };

  const beginNavWatch = () => {
    if (!navigator.geolocation || navWatchIdRef.current) return;
    const id = navigator.geolocation.watchPosition(
      (pos) => {
        const point = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserCoords(point);
        if (userMarkerRef.current && mapRef.current) {
          userMarkerRef.current.setLngLat([point.lng, point.lat]);
        }
        if (routeManeuversRef.current.length > 0) {
          const idx = routeStepIndexRef.current;
          const next = routeManeuversRef.current[idx];
          if (next?.location) {
            const dist = haversine({ lat: point.lat, lng: point.lng }, { lat: next.location[1], lng: next.location[0] });
            if (dist < 25 && idx < routeManeuversRef.current.length - 1) {
              routeStepIndexRef.current = idx + 1;
              speak(next.instruction);
            }
          }
        }
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }
    );
    navWatchIdRef.current = id;
  };

  React.useEffect(() => {
    if (!voiceDirectionsEnabled || !showMapModal || !mapReadyRef.current || isRecording) {
      stopNavWatch();
      return;
    }
    if (!routeManeuversRef.current.length) {
      stopNavWatch();
      return;
    }
    beginNavWatch();
    return () => stopNavWatch();
  }, [isRecording, routeSteps.length, showMapModal, voiceDirectionsEnabled]);

  const beginRecordingWatch = () => {
    if (!navigator.geolocation) {
      setRecordingStatus('Geolocation not supported.');
      return;
    }
    if (recordingWatchIdRef.current) {
      navigator.geolocation.clearWatch(recordingWatchIdRef.current);
    }
    const id = navigator.geolocation.watchPosition(
      (pos) => {
        const point = { lat: pos.coords.latitude, lng: pos.coords.longitude, recorded_at: new Date().toISOString() };
        setRecordingPoints((prev) => {
          if (prev.length > 0) {
            const last = prev[prev.length - 1];
            const segment = haversine({ lat: last.lat, lng: last.lng }, { lat: point.lat, lng: point.lng });
            setRecordingDistance((dist) => dist + segment);
          }
          return [...prev, point];
        });
        if (mapRef.current) {
          mapRef.current.easeTo({ center: [point.lng, point.lat], duration: 500 });
        }
      },
      () => {
        setRecordingStatus('Unable to read GPS location.');
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }
    );
    recordingWatchIdRef.current = id;
  };

  const startRecording = () => {
    setRecordingPoints([]);
    setRecordingDistance(0);
    setRecordingStart(Date.now());
    setIsRecording(true);
    setRecordingPaused(false);
    setRecordingStatus(null);
    beginRecordingWatch();
  };

  const pauseRecording = () => {
    if (recordingWatchIdRef.current) {
      navigator.geolocation.clearWatch(recordingWatchIdRef.current);
      recordingWatchIdRef.current = null;
    }
    setRecordingPaused(true);
  };

  const resumeRecording = () => {
    if (!isRecording) return;
    setRecordingPaused(false);
    beginRecordingWatch();
  };

  const stopRecording = () => {
    if (recordingWatchIdRef.current) {
      navigator.geolocation.clearWatch(recordingWatchIdRef.current);
      recordingWatchIdRef.current = null;
    }
    setRecordingPaused(false);
    setIsRecording(false);
    setModal('recording', true);
  };

  const saveRecording = async () => {
    if (recordingPoints.length < 2) {
      setRecordingStatus('Record at least two points.');
      return;
    }
    try {
      const saved = await recordPath({
        name: recordingName || 'Recorded path',
        shared: recordingShared,
        seller_id: sellerId || undefined,
        points: recordingPoints
      });
      if (saved?.id) {
        precomputePathWaypoints(saved.id).catch(() => {});
      }
      setRecordingStatus(saved?.id ? 'Path saved.' : 'Path saved.');
      setModal('recording', false);
      setRecordingName('');
      setRecordingShared(true);
      setRecordingPoints([]);
      setRecordingDistance(0);
      setRecordingStart(null);
    } catch (err: any) {
      setRecordingStatus(err?.message || 'Unable to save path.');
    }
  };

  const sellerPaths = React.useMemo(
    () => popularPaths.filter((path) => path.seller_id && sellerId && path.seller_id === sellerId),
    [popularPaths, sellerId]
  );
  const availablePaths = sellerPaths.length > 0 ? sellerPaths : popularPaths;
  const selectedPath = React.useMemo(
    () => availablePaths.find((path) => path.id === preferredPathId) || availablePaths[0],
    [availablePaths, preferredPathId]
  );

  React.useEffect(() => {
    if (availablePaths.length === 0) return;
    if (!preferredPathId || !availablePaths.find((path) => path.id === preferredPathId)) {
      setPreferredPathId(availablePaths[0].id);
    }
  }, [availablePaths, preferredPathId]);

  React.useEffect(() => {
    if (!preferredPathId) {
      setPathLandmarks([]);
      return;
    }
    let ignore = false;
    listPathLandmarks(preferredPathId)
      .then((items) => {
        if (!ignore) setPathLandmarks(items);
      })
      .catch(() => {
        if (!ignore) setPathLandmarks([]);
      });
    return () => {
      ignore = true;
    };
  }, [preferredPathId]);

  React.useEffect(() => {
    if (!mapRef.current || !mapReadyRef.current) return;
    const mapboxgl = mapboxModuleRef.current;
    if (!mapboxgl) return;
    landmarkMarkersRef.current.forEach((marker) => marker.remove());
    landmarkMarkersRef.current = [];
    if (navigationLandmarks.length === 0) return;
    navigationLandmarks
      .filter((landmark) => Number.isFinite(landmark.lat) && Number.isFinite(landmark.lng))
      .forEach((landmark, idx) => {
        const el = document.createElement('div');
        el.className = 'w-9 h-9 rounded-full bg-white shadow-lg border border-white/70 flex items-center justify-center';
        const thumb = document.createElement('div');
        thumb.className = 'w-8 h-8 rounded-full bg-zinc-200 bg-center bg-cover border border-white';
        thumb.style.backgroundImage = `url(${landmark.image_url})`;
        const badge = document.createElement('div');
        badge.className = 'absolute -top-2 -right-1 w-5 h-5 rounded-full bg-emerald-600 text-white text-[10px] font-black flex items-center justify-center shadow';
        badge.textContent = String(idx + 1);
        el.style.position = 'relative';
        el.appendChild(thumb);
        el.appendChild(badge);
        const marker = new mapboxgl.Marker({ element: el })
          .setLngLat([landmark.lng as number, landmark.lat as number])
          .addTo(mapRef.current!);
        landmarkMarkersRef.current.push(marker);
      });
  }, [navigationLandmarks, showMapModal]);

  return (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed inset-0 z-[60] bg-white flex flex-col overflow-hidden"
    >
      <div className="p-4 border-b flex justify-between items-center bg-white sticky top-0 z-10">
        <button onClick={onClose} className="p-2 hover:bg-zinc-100 rounded-full">
          <X className="w-6 h-6 text-zinc-900" />
        </button>
        <h2 className="text-sm font-black uppercase tracking-widest text-zinc-400">Product Details</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={handleAddToComparisonClick}
            disabled={isCompared}
            className={`px-3 py-2 rounded-full transition-colors flex items-center gap-2 text-xs font-bold ${
              isCompared ? 'bg-emerald-600 text-white' : 'hover:bg-zinc-100 text-zinc-400'
            }`}
          >
            {isCompared ? (
              <>
                <Check className="w-4 h-4" /> Added
              </>
            ) : (
              <>
                <ArrowRightLeft className="w-5 h-5" />
              </>
            )}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar">
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
            Loading product details...
          </div>
        )}

        <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-zinc-100 via-white to-zinc-200 aspect-[4/3] lg:aspect-[21/9] lg:mx-auto lg:w-full lg:max-w-7xl lg:px-8">
          <img
            src={primaryMedia}
            className="w-full h-full object-contain object-center p-4 lg:p-8"
            alt={activeProduct.name}
            referrerPolicy="no-referrer"
            ref={imageRef}
          />
          <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-xl shadow-lg border border-white/20 flex flex-col items-end">
            <span className="text-lg font-black text-zinc-900">{priceLabel}</span>
            {previousPriceLabel && (
              <span className="text-[10px] text-zinc-400 line-through">{previousPriceLabel}</span>
            )}
            {benchmarkPrice > 0 && (
              <span className="text-[10px] text-zinc-400">Market: {formatKES(benchmarkPrice)}</span>
            )}
          </div>

          {goodDealFlag && (
            <div className="absolute top-4 left-4 bg-emerald-500 text-white px-3 py-1.5 rounded-full text-[10px] font-black flex items-center gap-1.5 shadow-xl">
              <TrendingDown className="w-3 h-3" /> GOOD DEAL
            </div>
          )}
        </div>

        <div className="mx-auto w-full max-w-7xl px-4 py-6 lg:px-8">
          <div className="flex justify-between items-start mb-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl lg:text-4xl font-black text-zinc-900 mb-1 tracking-tight">{activeProduct.name}</h1>
                {isPubliclyCollected && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-sky-700">
                    <ShieldCheck className="w-3 h-3" />
                    Publicly collected
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2 py-0.5 bg-zinc-100 rounded text-[10px] font-bold uppercase tracking-tight text-zinc-500">
                  {activeProduct.category}
                </span>
                <div className="flex items-center gap-1 text-amber-500">
                  <Star className="w-3 h-3 fill-amber-500" />
                  <span className="text-xs font-bold">{averageRating}</span>
                  <span className="text-[10px] text-zinc-400 font-medium">({reviews.length} reviews)</span>
                </div>
              </div>
            </div>
            <button className="p-3 bg-zinc-50 rounded-2xl text-zinc-400 hover:text-red-500 transition-colors lg:shrink-0">
              <Heart className="w-6 h-6" />
            </button>
          </div>

          {isPubliclyCollected && (
            <div className="mb-6 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-sky-700">Publicly collected data</p>
              <p className="mt-1 text-xs font-medium text-sky-800">
                This listing was collected from a public web source{sourceLabel ? `: ${sourceLabel}` : ''}. Please verify details before purchase.
              </p>
            </div>
          )}

          <div className="mb-6 grid gap-3 lg:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)]">
            <div className="rounded-3xl border border-zinc-100 bg-white px-4 py-4 shadow-sm lg:min-h-[180px]">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Current Price</p>
              <p className="mt-2 text-3xl font-black text-zinc-900">{priceLabel}</p>
              {previousPriceLabel && (
                <p className="mt-1 text-xs font-bold text-zinc-400 line-through">{previousPriceLabel}</p>
              )}
              {benchmarkPrice > 0 && (
                <p className="mt-2 text-[11px] font-bold text-zinc-500">Market benchmark: {formatKES(benchmarkPrice)}</p>
              )}
            </div>
            <div className="rounded-3xl border border-zinc-100 bg-zinc-50 px-4 py-4 lg:min-h-[180px]">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Listing Notes</p>
              <p className="mt-2 text-sm leading-relaxed text-zinc-600">
                {activeProduct.description}
              </p>
            </div>
          </div>
          {benchmarkPrice > 0 && displayPrice > 0 && (
            <div className="mb-6 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center gap-3">
              <div className="p-2 bg-emerald-500 rounded-xl">
                <TrendingDown className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs font-black text-emerald-900 uppercase tracking-tight">Price Fairness Indicator</p>
                <p className="text-[10px] text-emerald-600 font-bold">
                  This price is {Math.round(((benchmarkPrice - displayPrice) / benchmarkPrice) * 100)}% lower than nearby shops.
                </p>
              </div>
            </div>
          )}

          {benchmarkPrice > 0 && displayPrice > 0 && displayPrice < benchmarkPrice * anomalyThresholdRatio && (
            <div className="mb-6 p-4 bg-amber-50 border border-amber-100 rounded-2xl flex items-center gap-3">
              <div className="p-2 bg-amber-500 rounded-xl">
                <AlertTriangle className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs font-black text-amber-900 uppercase tracking-tight">Price Anomaly Warning</p>
                <p className="text-[10px] text-amber-700 font-bold">{anomalyWarningMessage}</p>
              </div>
            </div>
          )}

          <div className="mb-6 p-4 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-600 rounded-xl">
                <Bell className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-xs font-black text-indigo-900 uppercase tracking-tight">Price Drop Alert</p>
                <p className="text-[10px] text-indigo-600 font-bold">Get notified when price hits your target.</p>
                {watchTarget !== null && (
                  <p className="text-[10px] text-indigo-500 font-bold">Target: KES {watchTarget}</p>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleToggleWatch}
                className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase ${isWatched ? 'bg-emerald-600 text-white' : 'bg-white text-indigo-600 border border-indigo-200'}`}
              >
                {isWatched ? 'Watching' : 'Watch'}
              </button>
              {isWatched && (
                <button
                  onClick={handleUpdateWatch}
                  className="px-3 py-2 rounded-xl text-[10px] font-black uppercase bg-white text-indigo-600 border border-indigo-200"
                >
                  Update
                </button>
              )}
            </div>
          </div>

          {priceHistory.length > 0 && (
            <div className="mb-8">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-4">Price History</h3>
              <div className="h-48 w-full bg-zinc-50 rounded-3xl p-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={priceHistory}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="date" hide />
                    <YAxis hide domain={['auto', 'auto']} />
                    <Tooltip
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      labelStyle={{ display: 'none' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="price"
                      stroke="#4f46e5"
                      strokeWidth={3}
                      dot={{ r: 4, fill: '#4f46e5', strokeWidth: 2, stroke: '#fff' }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {activeProduct.stockLevel < 5 && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 animate-pulse">
              <div className="p-2 bg-red-500 rounded-xl">
                <AlertTriangle className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs font-black text-red-900 uppercase tracking-tight">Critical Stock Warning</p>
                <p className="text-[10px] text-red-600 font-bold">Only {activeProduct.stockLevel} units left! Order soon to avoid missing out.</p>
              </div>
            </div>
          )}

          <div className="mb-8 grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(280px,0.85fr)]">
            <div className="p-5 bg-zinc-50 rounded-3xl border border-zinc-100 lg:sticky lg:top-6 lg:self-start">
              <div className="flex items-start justify-between gap-4 mb-5">
                <div className="flex items-center gap-4">
                  <div className="relative shrink-0">
                    {sellerProfile?.avatar || sellerProfile?.logo ? (
                      <img src={sellerProfile?.avatar || sellerProfile?.logo} className="w-16 h-16 rounded-3xl border border-white shadow-sm object-cover bg-white" alt="seller" />
                    ) : (
                      <div className="flex h-16 w-16 items-center justify-center rounded-3xl border border-white bg-zinc-900 text-sm font-black text-white shadow-sm">
                        {initials(marketplaceDisplayName)}
                      </div>
                    )}
                    {(sellerProfile?.verified || sellerProfile?.isVerified) && (
                      <div className="absolute -bottom-1 -right-1 bg-indigo-600 text-white p-1.5 rounded-full border-2 border-white shadow">
                        <ShieldCheck className="w-3 h-3" />
                      </div>
                    )}
                  </div>
                <div className="min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-zinc-400">Sold by</p>
                    <p className="mt-1 text-lg font-black text-zinc-900 truncate">{marketplaceDisplayName}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center rounded-full bg-white px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500 border border-zinc-200">
                        {sellerDisplaySubtitle}
                      </span>
                      {sellerModeLabel && (
                        <span className="inline-flex items-center rounded-full bg-zinc-900 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-white">
                          {sellerModeLabel.replace(/_/g, ' ')}
                        </span>
                      )}
                    </div>
                    {isPubliclyCollected && merchantProfileDisplayName && merchantProfileDisplayName !== marketplaceDisplayName && (
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center rounded-full bg-zinc-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500 border border-zinc-200">
                          Merchant profile
                        </span>
                        <span className="text-xs font-bold text-zinc-900 truncate">{merchantProfileDisplayName}</span>
                      </div>
                    )}
                    {sellerLocationLabel && (
                      <p className="mt-2 text-xs font-medium text-zinc-500">{sellerLocationLabel}</p>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end text-right">
                  <div className="flex items-center gap-1 text-amber-500 mb-1">
                    <Star className="w-3 h-3 fill-amber-500" />
                    <span className="text-xs font-bold">{sellerRatingLabel}</span>
                  </div>
                  <p className="text-[10px] text-zinc-400 font-bold">{sellerFollowersLabel} followers</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-2xl bg-white border border-zinc-200 px-3 py-3">
                  <p className="text-[9px] font-black uppercase tracking-[0.18em] text-zinc-400">Store</p>
                  <p className="mt-1 text-xs font-bold text-zinc-900 truncate">{marketplaceDisplayName}</p>
                  <p className="mt-1 text-[10px] font-medium text-zinc-500 truncate">{sellerDisplaySubtitle}</p>
                </div>
                <div className="rounded-2xl bg-white border border-zinc-200 px-3 py-3">
                  <p className="text-[9px] font-black uppercase tracking-[0.18em] text-zinc-400">Rating</p>
                  <p className="mt-1 text-xs font-bold text-zinc-900">{sellerRatingLabel}</p>
                </div>
                <div className="rounded-2xl bg-white border border-zinc-200 px-3 py-3">
                  <p className="text-[9px] font-black uppercase tracking-[0.18em] text-zinc-400">Followers</p>
                  <p className="mt-1 text-xs font-bold text-zinc-900">{sellerFollowersLabel}</p>
                </div>
              </div>
            </div>

            <div className="p-5 bg-zinc-50 rounded-3xl border border-zinc-100">
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-zinc-400 mb-3">Quantity</p>
              <p className="text-sm font-bold text-zinc-900 mb-4">Choose how many you want</p>
              <div className="flex items-center justify-between gap-4 bg-white p-2.5 rounded-2xl border border-zinc-200">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-2 hover:bg-zinc-100 rounded-xl transition-colors text-zinc-400"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="text-base font-black text-zinc-900 min-w-[28px] text-center">{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.min(activeProduct.stockLevel || quantity + 1, quantity + 1))}
                  className="p-2 hover:bg-zinc-100 rounded-xl transition-colors text-zinc-400"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <p className="mt-3 text-[10px] text-zinc-400 font-medium">Stock left: {activeProduct.stockLevel || '—'}</p>
            </div>
          </div>

            <div className="grid grid-cols-3 gap-2.5 lg:gap-3">
              <button
                onClick={() => onChatOpen(activeProduct)}
                className="flex items-center justify-center gap-2 py-2.5 bg-white border border-zinc-200 rounded-2xl text-[10px] font-bold text-zinc-600 hover:bg-zinc-100 transition-colors"
              >
                <MessageCircle className="w-3.5 h-3.5" /> Chat
              </button>
              <button
                onClick={handleWhatsApp}
                className="flex items-center justify-center gap-2 py-2.5 bg-emerald-500 text-white rounded-2xl text-[10px] font-bold hover:bg-emerald-600 transition-colors"
              >
                <Phone className="w-3.5 h-3.5" /> WhatsApp
              </button>
              <button
                onClick={handleCallSeller}
                className="flex items-center justify-center gap-2 py-2.5 bg-indigo-600 text-white rounded-2xl text-[10px] font-bold hover:bg-indigo-700 transition-colors"
              >
                <Phone className="w-3.5 h-3.5" /> Call
              </button>
            </div>
            {onOpenSupportChat && (
              <button
                onClick={onOpenSupportChat}
                className="mt-3 w-full py-2.5 bg-[#1976D2] text-white rounded-2xl text-[10px] font-bold"
              >
                Duka Support
              </button>
            )}
            <div className="mt-4 bg-white border border-zinc-200 rounded-2xl p-3 text-[10px] text-zinc-500 font-bold flex items-center justify-between">
              <span>Masked number active • Your contact is protected</span>
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <div className="mt-3 bg-white border border-zinc-200 rounded-2xl p-3 text-[10px] text-zinc-600 font-bold">
              Seller history: {sellerReputation?.active_since || '—'} • {sellerReputation?.response_rate || '—'} response rate • {counterfeitSummary?.resolved_reports || 0} counterfeit reports resolved.
            </div>
            {(sellerModeLabel || Object.keys(deliveryDetails).length > 0) && (
              <div className="mt-3 bg-white border border-zinc-200 rounded-2xl p-3 text-[10px] text-zinc-600 font-bold space-y-1">
                <div className="text-[10px] text-zinc-400 font-black uppercase tracking-widest">Delivery & Service</div>
                {sellerModeLabel && (
                  <div>Seller Mode: {sellerModeLabel.replace(/_/g, ' ')}</div>
                )}
                {sellerProfile?.market_name && (
                  <div>Market: {sellerProfile.market_name}</div>
                )}
                {sellerProfile?.visual_marker && (
                  <div>Marker: {/^https?:\/\//i.test(String(sellerProfile.visual_marker)) ? 'Photo marker available' : sellerProfile.visual_marker}</div>
                )}
                {typeof sellerProfile?.delivery_radius_km === 'number' && sellerProfile.delivery_radius_km > 0 && (
                  <div>Delivery Radius: {sellerProfile.delivery_radius_km} km</div>
                )}
                {deliveryDetails.delivery_fee_flat && (
                  <div>Delivery Fee: KES {deliveryDetails.delivery_fee_flat}</div>
                )}
                {deliveryDetails.delivery_fee_per_km && (
                  <div>Fee per km: KES {deliveryDetails.delivery_fee_per_km}</div>
                )}
                {deliveryDetails.average_eta_minutes && (
                  <div>ETA: {deliveryDetails.average_eta_minutes} min</div>
                )}
                {deliveryPaymentOptions && (
                  <div>Payments: {deliveryPaymentOptions}</div>
                )}
                {deliveryDetails.installation_services && (
                  <div>Installation: {deliveryDetails.installation_services}</div>
                )}
                {deliveryDetails.after_sales_support && (
                  <div>After Sales: {deliveryDetails.after_sales_support}</div>
                )}
              </div>
            )}
          <div className="space-y-6 mb-8">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black uppercase tracking-widest text-zinc-400">Customer Reviews</h3>
              <button
                onClick={() => setShowReviewForm(true)}
                className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider hover:underline"
              >
                Write a review
              </button>
            </div>

            {reviews.length > 0 ? (
              <div className="space-y-4">
                {reviews.map((review) => (
                  <div key={review.id} className="p-4 bg-white border border-zinc-100 rounded-2xl shadow-sm">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2">
                        <img src={review.userAvatar} className="w-8 h-8 rounded-full" alt={review.userName} />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <p className="text-xs font-bold text-zinc-900">{review.userName}</p>
                            {review.isVerifiedPurchase && (
                              <div className="bg-indigo-50 text-indigo-600 text-[8px] font-black px-1.5 py-0.5 rounded uppercase">Verified</div>
                            )}
                          </div>
                          <p className="text-[8px] text-zinc-400 font-medium uppercase tracking-tighter">
                            {new Date(review.timestamp).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3 h-3 ${i < review.rating ? 'text-amber-400 fill-amber-400' : 'text-zinc-200'}`}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-zinc-600 leading-relaxed">
                      {review.comment}
                    </p>
                    <div className="mt-2 flex items-center justify-between text-[9px] font-bold text-zinc-400">
                      <span>Helpful?</span>
                      <button onClick={() => handleFlagReview(review.id)} className="text-amber-600">Flag</button>
                    </div>
                    {review.replies && review.replies.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {review.replies.map((reply: any) => (
                          <div key={reply.id} className="p-3 bg-zinc-50 rounded-xl border border-zinc-100">
                            <div className="flex items-center justify-between mb-1">
                              <p className="text-[10px] font-bold text-zinc-900">{reply.sellerName}</p>
                              <p className="text-[8px] text-zinc-400">{new Date(reply.timestamp).toLocaleDateString()}</p>
                            </div>
                            <p className="text-[10px] text-zinc-600">{reply.comment}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 flex flex-col items-center justify-center text-center px-6 bg-zinc-50 rounded-3xl border border-dashed border-zinc-200">
                <Star className="w-8 h-8 text-zinc-200 mb-3" />
                <h4 className="text-zinc-900 font-bold text-sm mb-1">No production reviews yet</h4>
                <p className="text-[10px] text-zinc-400">This product will show live customer reviews as soon as the catalog sync returns them.</p>
              </div>
            )}
            <div className="mt-4">
              {!showReviewForm ? (
                <button
                  onClick={() => setShowReviewForm(true)}
                  className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider hover:underline"
                >
                  Write a review
                </button>
              ) : (
                <div className="mt-3 p-4 bg-zinc-50 rounded-2xl border border-zinc-100 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      className="w-full p-2.5 bg-white rounded-xl text-xs font-bold text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#1976D2]/30"
                      value={reviewForm.name}
                      onChange={(e) => setReviewForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Your name"
                      aria-label="Your name"
                    />
                    <select
                      className="w-full p-2.5 bg-white rounded-xl text-xs font-bold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#1976D2]/30"
                      value={reviewForm.rating}
                      onChange={(e) => setReviewForm(prev => ({ ...prev, rating: Number(e.target.value) }))}
                      aria-label="Rating"
                    >
                      {[5, 4, 3, 2, 1].map(r => <option key={r} value={r}>{r} Stars</option>)}
                    </select>
                  </div>
                  <textarea
                    className="w-full p-3 bg-white rounded-xl text-xs font-bold text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#1976D2]/30"
                    rows={3}
                    value={reviewForm.comment}
                    onChange={(e) => setReviewForm(prev => ({ ...prev, comment: e.target.value }))}
                    placeholder="Share your experience..."
                    aria-label="Review comment"
                  />
                  <div className="flex items-center gap-2">
                    <button onClick={handleSubmitReview} className="px-4 py-2 bg-zinc-900 text-white rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-zinc-400" aria-label="Submit review">Submit</button>
                    <button onClick={() => setShowReviewForm(false)} className="px-4 py-2 bg-zinc-100 text-zinc-700 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-zinc-300" aria-label="Cancel review">Cancel</button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="mb-8 p-5 bg-white border border-zinc-100 rounded-3xl shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-black uppercase tracking-widest text-zinc-400">Community Q&A</h3>
              <span className="text-[10px] text-zinc-400 font-bold">Answer rewards active</span>
            </div>
            <div className="space-y-3">
              {qaList.map(item => (
                <div key={item.id} className="p-3 bg-zinc-50 rounded-2xl">
                  <p className="text-[10px] font-bold text-zinc-700">Q: {item.question}</p>
                  {item.answer ? (
                    <p className="text-[10px] text-emerald-700 font-bold mt-1">A: {item.answer} ✓</p>
                  ) : (
                    <p className="text-[10px] text-zinc-400 mt-1">No catalog answers yet</p>
                  )}
                  <div className="mt-2 flex items-center justify-between">
                    <p className="text-[9px] text-zinc-400">— {item.author}</p>
                    {!item.answer && (
                      <button
                        onClick={() => handleAnswerQuestion(item.id)}
                        className="text-[9px] font-bold text-indigo-600"
                      >
                        Answer
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 flex gap-2">
              <input
                className="flex-1 p-3 bg-zinc-50 rounded-xl text-[10px] font-bold text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#1976D2]/30"
                placeholder="Ask a question about this product..."
                value={qaInput}
                onChange={(e) => setQaInput(e.target.value)}
                aria-label="Ask a question about this product"
              />
              <button
                onClick={handleAskQuestion}
                className="px-4 py-3 bg-zinc-900 text-white rounded-xl text-[10px] font-black focus:outline-none focus:ring-2 focus:ring-zinc-400"
                aria-label="Submit product question"
              >
                Ask
              </button>
            </div>
          </div>

          <div className="mb-8 p-4 bg-amber-50 border border-amber-100 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500 rounded-xl">
                <Flag className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-xs font-black text-amber-900 uppercase tracking-tight">Counterfeit Risk</p>
                <p className="text-[10px] text-amber-700 font-bold">Report suspicious listing to protect others.</p>
              </div>
            </div>
            <button
              onClick={() => setModal('counterfeit', true)}
              className="px-3 py-2 bg-amber-600 text-white rounded-xl text-[10px] font-black uppercase"
            >
              Report
            </button>
          </div>

          <div className="mb-8 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center justify-between">
            <div>
              <p className="text-xs font-black text-red-900 uppercase tracking-tight">Dispute Resolution</p>
              <p className="text-[10px] text-red-700 font-bold">Issue with a purchase? Start a dispute and we mediate.</p>
            </div>
            <button
              onClick={() => setModal('dispute', true)}
              className="px-3 py-2 bg-red-600 text-white rounded-xl text-[10px] font-black uppercase"
            >
              Start Dispute
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            <button
              onClick={handleGetDirections}
              className="p-4 bg-zinc-50 rounded-2xl text-left group"
            >
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="w-4 h-4 text-indigo-600" />
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Location</span>
              </div>
              <p className="text-xs font-bold text-zinc-900 truncate group-hover:text-indigo-600 transition-colors">
                {activeProduct.location?.address || sellerProfile?.location?.address || 'Online Only'}
              </p>
              <div className="mt-2 flex items-center gap-1 text-[9px] font-bold text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity">
                Get Directions <ExternalLink className="w-2 h-2" />
              </div>
            </button>
            <div className="p-4 bg-zinc-50 rounded-2xl">
              <div className="flex items-center gap-2 mb-2">
                <ShoppingBag className="w-4 h-4 text-emerald-600" />
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Stock Level</span>
              </div>
              <p className={`text-xs font-bold ${activeProduct.stockLevel < 10 ? 'text-red-500' : 'text-emerald-600'}`}>
                {activeProduct.stockLevel} Units Left
              </p>
              <p className="text-[9px] text-zinc-400 mt-1">Confirmed recently</p>
            </div>
            {externalProductUrl && (
              <button
                onClick={handleVisitSite}
                className="p-4 bg-zinc-50 rounded-2xl text-left group"
              >
                <div className="flex items-center gap-2 mb-2">
                  <ExternalLink className="w-4 h-4 text-zinc-900" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Visit Site</span>
                </div>
                <p className="text-xs font-bold text-zinc-900 truncate group-hover:text-indigo-600 transition-colors">
                  Open seller website
                </p>
                <div className="mt-2 flex items-center gap-1 text-[9px] font-bold text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity">
                  Go to site <ExternalLink className="w-2 h-2" />
                </div>
              </button>
            )}
          </div>

          <div className="mb-8 p-4 bg-zinc-50 rounded-2xl border border-zinc-100 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-black text-zinc-900 uppercase tracking-tight">Post-Purchase Follow-up</p>
                <p className="text-[10px] text-zinc-500 font-bold">Get a reminder to confirm your purchase and earn rewards.</p>
              </div>
              <button
                onClick={handleFollowup}
                disabled={followUpEnabled}
                className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase ${followUpEnabled ? 'bg-emerald-600 text-white' : 'bg-white text-zinc-600 border border-zinc-200'}`}
              >
                {followUpEnabled ? 'Scheduled' : 'Enable'}
              </button>
            </div>
            <input
              value={followupOrderId}
              onChange={(e) => setFollowupOrderId(e.target.value)}
              placeholder="Order ID for follow-up"
              className="w-full p-2.5 bg-white rounded-xl text-[10px] font-bold"
            />
          </div>

          <div className="mb-8 p-4 bg-white border border-zinc-100 rounded-2xl">
            <p className="text-xs font-black text-zinc-900 uppercase tracking-tight mb-2">Rate Your Order</p>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <input
                value={ratingOrderId}
                onChange={(e) => setRatingOrderId(e.target.value)}
                placeholder="Order ID"
                className="w-full p-2.5 bg-zinc-50 rounded-xl text-[10px] font-bold"
              />
              <select
                value={orderRating}
                onChange={(e) => setOrderRating(Number(e.target.value))}
                className="w-full p-2.5 bg-zinc-50 rounded-xl text-[10px] font-bold"
              >
                {[5,4,3,2,1].map(r => <option key={r} value={r}>{r} Stars</option>)}
              </select>
            </div>
            <textarea
              value={orderComment}
              onChange={(e) => setOrderComment(e.target.value)}
              placeholder="Optional comment"
              className="w-full p-3 bg-zinc-50 rounded-xl text-[10px] font-bold"
              rows={2}
            />
            <button
              onClick={handleOrderRating}
              className="mt-3 px-4 py-2 bg-zinc-900 text-white rounded-xl text-[10px] font-black"
            >
              Submit Rating
            </button>
          </div>

          <div className="mb-8 p-5 bg-white border border-zinc-100 rounded-3xl shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-black uppercase tracking-widest text-zinc-400">Social Proof</h3>
              <span className="text-[10px] text-zinc-500 font-bold">Verified purchases</span>
            </div>
            <div className="p-3 bg-emerald-50 rounded-2xl text-[10px] font-bold text-emerald-700">
              {sellerReputation?.monthly_buyers || 0} customers bought this here this month.
            </div>
            {buyerAvatars.length > 0 ? (
              <div className="mt-3 grid grid-cols-5 gap-2">
                {buyerAvatars.slice(0, 10).map((url, i) => (
                  <img key={`${url}-${i}`} src={url} className="w-full aspect-square rounded-xl object-cover" alt="buyer" />
                ))}
              </div>
            ) : (
              <div className="mt-3 p-3 bg-zinc-50 rounded-2xl text-[10px] font-bold text-zinc-400">
                No buyer avatars were returned from the live data source yet.
              </div>
            )}
          </div>

          <div className="mb-10 p-5 bg-indigo-600 rounded-3xl text-white flex items-center justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-indigo-100">Share & Earn</p>
              <p className="text-sm font-bold">Share this product. If a friend buys, both of you earn rewards.</p>
            </div>
            <button
              onClick={handleShareReward}
              className="px-4 py-3 bg-white/20 rounded-2xl text-[10px] font-black uppercase flex items-center gap-2"
            >
              <Share2 className="w-4 h-4" /> Share
            </button>
          </div>

          <div className="mb-20">
            <button
              onClick={() => setModal('ai-chat', true)}
              className="w-full p-6 bg-gradient-to-br from-indigo-600 to-violet-700 rounded-3xl text-white flex items-center justify-between group overflow-hidden relative"
            >
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="w-5 h-5 text-indigo-200" />
                  <span className="text-xs font-black uppercase tracking-widest text-indigo-100">AI Personal Shopper</span>
                </div>
                <p className="text-lg font-bold text-left">Have questions? Ask our AI assistant about this item.</p>
              </div>
              <div className="relative z-10 p-3 bg-white/20 rounded-2xl backdrop-blur-sm group-hover:scale-110 transition-transform">
                <ChevronRight className="w-6 h-6" />
              </div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showCounterfeitModal && (
          <div className="fixed inset-0 z-[70]">
            <div
              className="absolute inset-0 bg-black/40"
              onClick={() => {
                setModal('counterfeit', false);
                setCounterfeitErrors({});
              }}
            />
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.98 }}
              className="absolute left-1/2 top-1/2 w-[min(92vw,420px)] -translate-x-1/2 -translate-y-1/2 bg-white rounded-3xl border border-zinc-100 shadow-2xl p-5"
            >
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-black">Report Counterfeit</p>
                <button
                  onClick={() => {
                    setModal('counterfeit', false);
                    setCounterfeitErrors({});
                    setCounterfeitEvidenceStatus(null);
                    setCounterfeitUploading(false);
                  }}
                  className="rounded-full px-2 py-1 text-[10px] font-black text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-300"
                  aria-label="Close counterfeit report"
                >
                  Close
                </button>
              </div>
              <div className="space-y-3">
                <textarea
                  className={`w-full p-3 rounded-xl text-xs font-bold placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#1976D2]/30 ${counterfeitErrors.reason ? 'bg-red-50 border border-red-200 text-red-700' : 'bg-zinc-50 border border-transparent text-zinc-900'}`}
                  rows={3}
                  placeholder="Describe the issue"
                  value={counterfeitForm.reason}
                  onChange={(e) => {
                    setCounterfeitForm(prev => ({ ...prev, reason: e.target.value }));
                    setCounterfeitErrors(prev => ({ ...prev, reason: '' }));
                  }}
                  aria-label="Describe the issue"
                />
                {counterfeitErrors.reason && (
                  <p className="text-[10px] font-bold text-red-600">{counterfeitErrors.reason}</p>
                )}
                <input
                  className="w-full p-3 bg-zinc-50 rounded-xl text-xs font-bold text-zinc-900 placeholder:text-zinc-400 border border-transparent focus:outline-none focus:ring-2 focus:ring-[#1976D2]/30"
                  placeholder="Order ID (optional)"
                  value={counterfeitForm.orderId}
                  onChange={(e) => setCounterfeitForm(prev => ({ ...prev, orderId: e.target.value }))}
                  aria-label="Order ID optional"
                />
                <input
                  className="w-full p-3 bg-zinc-50 rounded-xl text-xs font-bold text-zinc-900 placeholder:text-zinc-400 border border-transparent focus:outline-none focus:ring-2 focus:ring-[#1976D2]/30"
                  placeholder="Evidence keys (comma-separated)"
                  value={counterfeitForm.evidenceKeys}
                  onChange={(e) => setCounterfeitForm(prev => ({ ...prev, evidenceKeys: e.target.value }))}
                  aria-label="Evidence keys comma separated"
                />
                <div className="rounded-2xl border border-dashed border-zinc-200 p-3 space-y-2">
                  <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Evidence Upload</p>
                  <input
                    type="file"
                    accept={evidenceAccept}
                    className="w-full text-[10px] font-bold text-zinc-700 focus:outline-none focus:ring-2 focus:ring-[#1976D2]/30 rounded-xl"
                    onChange={(e) => {
                      void handleCounterfeitEvidenceFileSelect(e.target.files?.[0]);
                      e.currentTarget.value = '';
                    }}
                    aria-label="Upload counterfeit evidence file"
                    disabled={counterfeitUploading}
                  />
                  {counterfeitUploading && (
                    <p className="text-[10px] font-bold text-indigo-600">Uploading...</p>
                  )}
                  {counterfeitEvidenceStatus && (
                    <p className={`text-[10px] font-bold ${counterfeitEvidenceStatus.includes('Attached') ? 'text-emerald-600' : counterfeitEvidenceStatus.includes('failed') || counterfeitEvidenceStatus.includes('Upload') ? 'text-amber-600' : 'text-zinc-500'}`}>
                      {counterfeitEvidenceStatus}
                    </p>
                  )}
                  <p className="text-[9px] text-zinc-400 font-bold">
                    Attach images, video, or documents to support the report.
                  </p>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <button onClick={handleCounterfeitReport} className="flex-1 py-2 bg-amber-600 text-white rounded-xl text-[10px] font-black uppercase focus:outline-none focus:ring-2 focus:ring-amber-200" aria-label="Submit counterfeit report">
                  Submit
                </button>
                <button
                  onClick={() => {
                    setModal('counterfeit', false);
                    setCounterfeitErrors({});
                    setCounterfeitEvidenceStatus(null);
                    setCounterfeitUploading(false);
                  }}
                  className="flex-1 py-2 bg-zinc-100 text-zinc-700 rounded-xl text-[10px] font-black uppercase focus:outline-none focus:ring-2 focus:ring-zinc-300"
                  aria-label="Cancel counterfeit report"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showDisputeModal && (
          <div className="fixed inset-0 z-[70]">
            <div
              className="absolute inset-0 bg-black/40"
              onClick={() => {
                setModal('dispute', false);
                setDisputeErrors({});
                setEvidenceErrors({});
                setEvidenceStatus(null);
                setDisputeStatus(null);
                setDisputeId('');
              }}
            />
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.98 }}
              className="absolute left-1/2 top-1/2 w-[min(92vw,420px)] -translate-x-1/2 -translate-y-1/2 bg-white rounded-3xl border border-zinc-100 shadow-2xl p-5"
            >
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-black">Start Dispute</p>
                <button
                  onClick={() => {
                    setModal('dispute', false);
                    setDisputeErrors({});
                    setEvidenceErrors({});
                    setEvidenceStatus(null);
                    setDisputeStatus(null);
                    setDisputeId('');
                    setUploadStatus(null);
                    setUploading(false);
                  }}
                  className="rounded-full px-2 py-1 text-[10px] font-black text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-300"
                  aria-label="Close dispute modal"
                >
                  Close
                </button>
              </div>
              <div className="space-y-3">
                <input
                  className={`w-full p-3 rounded-xl text-xs font-bold placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#1976D2]/30 ${disputeErrors.orderId ? 'bg-red-50 border border-red-200 text-red-700' : 'bg-zinc-50 border border-transparent text-zinc-900'}`}
                  placeholder="Order ID"
                  value={disputeForm.orderId}
                  onChange={(e) => {
                    setDisputeForm(prev => ({ ...prev, orderId: e.target.value }));
                    setDisputeErrors(prev => ({ ...prev, orderId: '' }));
                  }}
                  aria-label="Dispute order ID"
                />
                {disputeErrors.orderId && (
                  <p className="text-[10px] font-bold text-red-600">{disputeErrors.orderId}</p>
                )}
                <textarea
                  className={`w-full p-3 rounded-xl text-xs font-bold placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#1976D2]/30 ${disputeErrors.reason ? 'bg-red-50 border border-red-200 text-red-700' : 'bg-zinc-50 border border-transparent text-zinc-900'}`}
                  rows={3}
                  placeholder="Describe the dispute"
                  value={disputeForm.reason}
                  onChange={(e) => {
                    setDisputeForm(prev => ({ ...prev, reason: e.target.value }));
                    setDisputeErrors(prev => ({ ...prev, reason: '' }));
                  }}
                  aria-label="Describe the dispute"
                />
                {disputeErrors.reason && (
                  <p className="text-[10px] font-bold text-red-600">{disputeErrors.reason}</p>
                )}
                <input
                  className={`w-full p-3 rounded-xl text-xs font-bold placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#1976D2]/30 ${disputeErrors.amount ? 'bg-red-50 border border-red-200 text-red-700' : 'bg-zinc-50 border border-transparent text-zinc-900'}`}
                  placeholder="Dispute amount (KES)"
                  value={disputeForm.amount}
                  onChange={(e) => {
                    setDisputeForm(prev => ({ ...prev, amount: e.target.value }));
                    setDisputeErrors(prev => ({ ...prev, amount: '' }));
                  }}
                  aria-label="Dispute amount in KES"
                />
                {disputeErrors.amount && (
                  <p className="text-[10px] font-bold text-red-600">{disputeErrors.amount}</p>
                )}
                <label className="flex items-center gap-2 text-[10px] font-bold text-zinc-600">
                  <input
                    type="checkbox"
                    checked={disputeForm.delivered}
                    onChange={(e) => setDisputeForm(prev => ({ ...prev, delivered: e.target.checked }))}
                    className="accent-zinc-900"
                  />
                  Order marked as delivered
                </label>
                <label className="flex items-center gap-2 text-[10px] font-bold text-zinc-600">
                  <input
                    type="checkbox"
                    checked={disputeForm.notReceived}
                    onChange={(e) => setDisputeForm(prev => ({ ...prev, notReceived: e.target.checked }))}
                    className="accent-zinc-900"
                  />
                  Claiming order not received
                </label>
                <label className="flex items-center gap-2 text-[10px] font-bold text-zinc-600">
                  <input
                    type="checkbox"
                    checked={disputeForm.gpsProof}
                    onChange={(e) => setDisputeForm(prev => ({ ...prev, gpsProof: e.target.checked }))}
                    className="accent-zinc-900"
                  />
                  I have GPS proof
                </label>
              </div>
              {disputeStatus && (
                <p className="mt-3 text-[10px] font-bold text-emerald-600">{disputeStatus}</p>
              )}

              <div className="mt-4 rounded-2xl border border-dashed border-zinc-200 p-3 space-y-2">
                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Evidence Upload</p>
                <div className="space-y-2">
                  <input
                    type="file"
                    accept={evidenceAccept}
                    className="w-full text-[10px] font-bold text-zinc-700 focus:outline-none focus:ring-2 focus:ring-[#1976D2]/30 rounded-xl"
                    onChange={(e) => {
                      void handleEvidenceFileSelect(e.target.files?.[0]);
                      e.currentTarget.value = '';
                    }}
                    aria-label="Upload evidence file"
                    disabled={uploading}
                  />
                  {uploadStatus && (
                    <p className={`text-[10px] font-bold ${uploadStatus.includes('failed') ? 'text-red-600' : 'text-zinc-500'}`}>
                      {uploadStatus}
                    </p>
                  )}
                  {uploading && (
                    <p className="text-[10px] font-bold text-indigo-600">Uploading...</p>
                  )}
                  {evidenceErrors.s3Key && (
                    <p className="text-[10px] font-bold text-red-600">{evidenceErrors.s3Key}</p>
                  )}
                </div>
                <input
                  className={`w-full p-2.5 rounded-xl text-[10px] font-bold placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#1976D2]/30 ${evidenceErrors.fileName ? 'bg-red-50 border border-red-200 text-red-700' : 'bg-zinc-50 border border-transparent text-zinc-900'}`}
                  placeholder="File Name"
                  value={evidenceForm.fileName}
                  onChange={(e) => {
                    setEvidenceForm(prev => ({ ...prev, fileName: e.target.value }));
                    setEvidenceErrors(prev => ({ ...prev, fileName: '' }));
                  }}
                  aria-label="Evidence file name"
                />
                {evidenceErrors.fileName && (
                  <p className="text-[10px] font-bold text-red-600">{evidenceErrors.fileName}</p>
                )}
                <input
                  className={`w-full p-2.5 rounded-xl text-[10px] font-bold placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#1976D2]/30 ${evidenceErrors.mimeType ? 'bg-red-50 border border-red-200 text-red-700' : 'bg-zinc-50 border border-transparent text-zinc-900'}`}
                  placeholder="MIME Type"
                  value={evidenceForm.mimeType}
                  onChange={(e) => {
                    setEvidenceForm(prev => ({ ...prev, mimeType: e.target.value }));
                    setEvidenceErrors(prev => ({ ...prev, mimeType: '' }));
                  }}
                  aria-label="Evidence mime type"
                />
                {evidenceErrors.mimeType && (
                  <p className="text-[10px] font-bold text-red-600">{evidenceErrors.mimeType}</p>
                )}
                <div className="grid grid-cols-2 gap-2">
                  <input
                    className="w-full p-2.5 bg-zinc-50 rounded-xl text-[10px] font-bold text-zinc-900 placeholder:text-zinc-400 border border-transparent focus:outline-none focus:ring-2 focus:ring-[#1976D2]/30"
                    placeholder="GPS Lat (optional)"
                    value={evidenceForm.gpsLat}
                    onChange={(e) => setEvidenceForm(prev => ({ ...prev, gpsLat: e.target.value }))}
                    aria-label="Evidence GPS latitude optional"
                  />
                  <input
                    className="w-full p-2.5 bg-zinc-50 rounded-xl text-[10px] font-bold text-zinc-900 placeholder:text-zinc-400 border border-transparent focus:outline-none focus:ring-2 focus:ring-[#1976D2]/30"
                    placeholder="GPS Lng (optional)"
                    value={evidenceForm.gpsLng}
                    onChange={(e) => setEvidenceForm(prev => ({ ...prev, gpsLng: e.target.value }))}
                    aria-label="Evidence GPS longitude optional"
                  />
                </div>
                <input
                  className="w-full p-2.5 bg-zinc-50 rounded-xl text-[10px] font-bold text-zinc-900 placeholder:text-zinc-400 border border-transparent focus:outline-none focus:ring-2 focus:ring-[#1976D2]/30"
                  placeholder="Buyer phone (optional)"
                  value={evidenceForm.buyerPhone}
                  onChange={(e) => setEvidenceForm(prev => ({ ...prev, buyerPhone: e.target.value }))}
                  aria-label="Buyer phone optional"
                />
                {evidenceStatus && (
                  <p className={`text-[10px] font-bold ${evidenceStatus.includes('uploaded') ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {evidenceStatus}
                  </p>
                )}
                <button
                  onClick={handleEvidenceUpload}
                  className="mt-2 w-full py-2 bg-zinc-900 text-white rounded-xl text-[10px] font-black uppercase focus:outline-none focus:ring-2 focus:ring-zinc-400"
                  aria-label="Upload evidence"
                >
                  Upload Evidence
                </button>
              </div>
              <div className="mt-4 flex gap-2">
                <button onClick={handleDispute} className="flex-1 py-2 bg-red-600 text-white rounded-xl text-[10px] font-black uppercase">
                  Submit
                </button>
                <button
                  onClick={() => {
                    setModal('dispute', false);
                    setDisputeErrors({});
                    setEvidenceErrors({});
                    setEvidenceStatus(null);
                    setDisputeStatus(null);
                    setDisputeId('');
                    setUploadStatus(null);
                    setUploading(false);
                  }}
                  className="flex-1 py-2 bg-zinc-100 text-zinc-700 rounded-xl text-[10px] font-black uppercase"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAIChat && (
          <div className="fixed inset-0 z-[70]">
            <div
              className="absolute inset-0 bg-black/30 backdrop-blur-[1px]"
              onClick={() => setModal('ai-chat', false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.98 }}
              className="absolute bottom-4 right-4 w-[min(420px,90vw)] pointer-events-auto"
            >
              <ProductAIChat product={activeProduct} onClose={() => setModal('ai-chat', false)} />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showMapModal && (
          <motion.div
            className="fixed inset-0 z-[80] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className={`${isMapExpanded ? 'fixed inset-0 w-full h-full rounded-none' : 'w-full max-w-2xl rounded-3xl'} bg-white overflow-hidden shadow-2xl flex flex-col`}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
            >
              <div className="p-4 border-b flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-100 rounded-xl">
                    <MapPin className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-zinc-900">Pickup Directions</p>
                    {buyerLocationLabel && (
                      <p className="text-[10px] text-indigo-600 font-black uppercase tracking-wider">
                        Using {buyerLocationLabel}
                      </p>
                    )}
                    {routeInfo && (
                      <p className="text-[10px] text-zinc-500 font-bold">
                        {routeInfo.distanceKm} km • {routeInfo.durationMin} min
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setModal('map', false)}
                    className="p-2 rounded-full hover:bg-zinc-100"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              {availablePaths.length > 0 && (
                <div className="px-4 py-3 border-b bg-zinc-50/70 flex flex-wrap items-center gap-2 text-[10px] font-bold text-zinc-600">
                  <span className="uppercase tracking-wider text-zinc-400">Preferred Route</span>
                  <select
                    className="px-3 py-2 rounded-2xl border border-zinc-200 bg-white text-zinc-700 text-[10px] font-bold"
                    value={preferredPathId || availablePaths[0]?.id || ''}
                    onChange={(e) => {
                      const next = e.target.value || null;
                      setPreferredPathId(next);
                      setNavigationMode(next ? 'silent' : 'mapbox');
                    }}
                  >
                    {availablePaths.map((path) => (
                      <option key={path.id} value={path.id}>
                        {path.name || 'Recorded path'} · {path.usage_count || 0} uses · {path.start_label ? `From ${path.start_label}` : path.start_lat ? `From ${path.start_lat.toFixed(3)}, ${path.start_lng?.toFixed(3)}` : 'Custom start'}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              {(selectedPath || navigationLandmarks.length > 0 || directionsNote) && (
                <div className="px-4 py-3 border-b bg-white">
                  {shopFrontImage && (
                    <div className="mb-3 overflow-hidden rounded-2xl border border-zinc-100">
                      <img src={shopFrontImage} alt="Shop front" className="h-40 w-full object-cover" />
                    </div>
                  )}
                  {directionsNote && (
                    <div className="mb-3 rounded-2xl border border-amber-100 bg-amber-50 px-3 py-2 text-[10px] font-bold text-amber-900">
                      {directionsNote}
                    </div>
                  )}
                  <div className="flex flex-wrap gap-3 text-[10px] font-bold text-zinc-600">
                    {selectedPath?.start_label && (
                      <span className="px-2 py-1 rounded-full bg-emerald-50 text-emerald-700">
                        Start: {selectedPath.start_label}
                      </span>
                    )}
                    {selectedPath?.end_label && (
                      <span className="px-2 py-1 rounded-full bg-indigo-50 text-indigo-700">
                        End: {selectedPath.end_label}
                      </span>
                    )}
                    {!selectedPath?.start_label && selectedPath?.start_lat && (
                      <span className="px-2 py-1 rounded-full bg-zinc-100 text-zinc-600">
                        Start: {selectedPath.start_lat.toFixed(3)}, {selectedPath.start_lng?.toFixed(3)}
                      </span>
                    )}
                  </div>
                  {navigationLandmarks.length > 0 && (
                    <div className="mt-3 overflow-x-auto">
                      <div className="flex gap-3 min-w-max">
                        {navigationLandmarks.map((landmark) => (
                          <div key={landmark.id || landmark.image_url} className="w-40 bg-zinc-50 rounded-2xl border border-zinc-100 overflow-hidden">
                            <img src={landmark.image_url} alt={landmark.label} className="h-24 w-full object-cover" />
                            <div className="p-2">
                              <p className="text-[10px] font-black text-zinc-800">{landmark.label}</p>
                              <p className="text-[9px] text-zinc-500 uppercase">{landmark.type || 'Landmark'}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
              <div className={`${isMapExpanded ? 'flex-1 min-h-0' : 'relative h-[360px]'} bg-zinc-100 relative`}>
                <div ref={mapContainerRef} className="absolute inset-0" />
                {!mapboxToken && (
                  <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white bg-zinc-900/70">
                    <div className="max-w-xs space-y-3 rounded-3xl border border-white/10 bg-zinc-950/80 p-5 text-center backdrop-blur">
                      <p>Mapbox token missing. Add VITE_MAPBOX_TOKEN to enable maps.</p>
                      <div className="flex flex-wrap items-center justify-center gap-2">
                        <button
                          onClick={handleGetDirections}
                          className="rounded-full bg-white px-3 py-2 text-[10px] font-black text-zinc-900"
                        >
                          Open in Maps
                        </button>
                        <button
                          onClick={() => setModal('map', false)}
                          className="rounded-full bg-white/10 px-3 py-2 text-[10px] font-black text-white"
                        >
                          Close
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                <div className="absolute top-3 right-3 z-10">
                  <button
                    onClick={() => setIsMapExpanded((prev) => !prev)}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-2xl bg-white/90 backdrop-blur-md border border-white shadow-xl text-[10px] font-black text-zinc-700"
                  >
                    {isMapExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                    {isMapExpanded ? 'Exit Fullscreen' : 'Fullscreen'}
                  </button>
                </div>
                {isRecording && (
                  <div className="absolute top-12 left-3 bg-rose-600/90 text-white px-3 py-1.5 rounded-2xl text-[10px] font-bold shadow space-y-1">
                    <div>
                      Recording… {Math.round(recordingDistance)}m · {Math.floor((recordingStart ? (Date.now() - recordingStart) : 0) / 60000)}m
                    </div>
                    <div className="text-[9px] text-white/80">Points: {recordingPoints.length} / 10</div>
                  </div>
                )}
                <div className="absolute bottom-4 left-4 right-4 z-20 flex flex-wrap gap-2">
                  <div className="bg-white/90 backdrop-blur-md px-2 py-1.5 rounded-2xl border border-white shadow-xl flex flex-wrap gap-1 text-[9px] font-bold text-zinc-700">
                    {[
                      { label: 'Drive', value: 'driving' },
                      { label: 'Motorbike', value: 'motorbike' },
                      { label: 'Scooter', value: 'scooter' },
                      { label: 'TukTuk', value: 'tuktuk' },
                      { label: 'Cycle', value: 'cycling' },
                      { label: 'Walk', value: 'walking' }
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setRouteProfile(opt.value as any)}
                        className={`px-2 py-1 rounded-full ${routeProfile === opt.value ? 'bg-indigo-600 text-white' : 'bg-zinc-100 text-zinc-600'}`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  {preferredPathId && (
                    <div className="bg-white/90 backdrop-blur-md px-2 py-1.5 rounded-2xl border border-white shadow-xl flex items-center gap-1 text-[9px] font-bold text-zinc-700">
                      <button
                        onClick={() => setNavigationMode('silent')}
                        className={`px-2 py-1 rounded-full ${navigationMode === 'silent' ? 'bg-emerald-600 text-white' : 'bg-zinc-100 text-zinc-600'}`}
                      >
                        Seller Path
                      </button>
                      <button
                        onClick={() => setNavigationMode('mapbox')}
                        className={`px-2 py-1 rounded-full ${navigationMode === 'mapbox' ? 'bg-indigo-600 text-white' : 'bg-zinc-100 text-zinc-600'}`}
                      >
                        Standard
                      </button>
                    </div>
                  )}
                  <div className="bg-white/90 backdrop-blur-md px-2 py-1.5 rounded-2xl border border-white shadow-xl flex items-center gap-1 text-[9px] font-bold text-zinc-700">
                    <button
                      onClick={() => {
                        const next = !voiceDirectionsEnabled;
                        setVoiceDirectionsEnabled(next);
                        void updateUiPreferences({ voice_directions_enabled: next }).catch(() => {});
                      }}
                      className={`px-3 py-1 rounded-full ${voiceDirectionsEnabled ? 'bg-indigo-600 text-white' : 'bg-zinc-100 text-zinc-700'}`}
                    >
                      {voiceDirectionsEnabled ? 'Voice On' : 'Voice Off'}
                    </button>
                    <button
                      onClick={() => {
                        if (isRecording) {
                          stopRecording();
                        } else {
                          startRecording();
                        }
                      }}
                      className={`px-3 py-1 rounded-full ${isRecording ? 'bg-rose-600 text-white' : 'bg-emerald-600 text-white'}`}
                    >
                      {isRecording ? 'Stop' : 'Record'}
                    </button>
                    {isRecording && (
                      <button
                        onClick={recordingPaused ? resumeRecording : pauseRecording}
                        className="px-3 py-1 rounded-full bg-zinc-100 text-zinc-700"
                      >
                        {recordingPaused ? 'Resume' : 'Pause'}
                      </button>
                    )}
                  </div>
                </div>
              <div className="absolute bottom-0 left-0 right-0 pb-3 px-3">
                  <div className="bg-white/95 backdrop-blur-md rounded-t-3xl border border-white shadow-2xl p-4 max-h-[40vh] overflow-hidden">
                    {routeSteps.length > 0 && (
                      <div className="max-h-28 overflow-auto text-[10px] text-zinc-700 space-y-1">
                        <div className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Directions</div>
                        {routeSteps.slice(0, 5).map((step, idx) => (
                          <div key={`pd-route-step-${idx}`} className="flex items-center justify-between gap-2">
                            <span className="font-bold">{step.instruction}</span>
                            <span className="text-[9px] text-zinc-500">
                              {Math.max(1, Math.round(step.distance / 10) * 10)}m · {Math.max(1, Math.round(step.duration / 60))}m
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                    {routeSteps.length === 0 && routeInfo && (
                      <div className="text-[10px] font-bold text-zinc-600">
                        Directions unavailable. Enable location services and try again.
                      </div>
                    )}
                  </div>
                </div>
              </div>
              {showRecordingPanel && (
                <div className="p-4 border-t bg-white">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-xs font-black text-zinc-900">Save Recorded Path</div>
                    <button
                      onClick={() => {
      setModal('recording', false);
      setRecordingPoints([]);
      setRecordingDistance(0);
      setRecordingStart(null);
                      }}
                      className="text-[10px] font-bold text-zinc-400"
                    >
                      Discard
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <input
                      value={recordingName}
                      onChange={(e) => setRecordingName(e.target.value)}
                      placeholder="Name this path"
                      className="w-full px-3 py-2 bg-zinc-50 rounded-xl text-xs font-bold"
                    />
                    <label className="flex items-center gap-2 text-[10px] font-bold text-zinc-600">
                      <input
                        type="checkbox"
                        checked={recordingShared}
                        onChange={(e) => setRecordingShared(e.target.checked)}
                      />
                      Share with community
                    </label>
                  </div>
                  <div className="mb-3">
                    <div className="flex items-center justify-between text-[9px] font-bold text-zinc-500">
                      <span>Recording progress</span>
                      <span>{recordingPoints.length} / 10 points</span>
                    </div>
                    <div className="mt-2 h-2 bg-zinc-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full"
                        style={{ width: `${Math.min(100, Math.round((recordingPoints.length / 10) * 100))}%` }}
                      />
                    </div>
                  </div>
                  <button
                    onClick={saveRecording}
                    disabled={recordingPoints.length < 2}
                    className="w-full py-2 rounded-xl bg-indigo-600 text-white text-xs font-black"
                  >
                    Save Path
                  </button>
                  {recordingStatus && (
                    <div className="mt-2 text-[10px] font-bold text-zinc-500">{recordingStatus}</div>
                  )}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="p-6 border-t bg-white flex gap-4">
        <button
          onClick={handleAddToBagClick}
          className="flex-1 py-4 bg-zinc-900 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform"
        >
          Add to Bag
        </button>
        <button
          onClick={handleBuyNow}
          className="px-6 py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform shadow-lg shadow-indigo-600/20"
        >
          Buy Now <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <AnimatePresence>
        {flyThumb && (
          <motion.img
            src={flyThumb.src}
            alt="compare-fly"
            className="fixed z-[80] rounded-full shadow-2xl pointer-events-none object-cover"
            initial={{
              x: flyThumb.start.x - flyThumb.start.size / 2,
              y: flyThumb.start.y - flyThumb.start.size / 2,
              width: flyThumb.start.size,
              height: flyThumb.start.size,
              opacity: 1,
              scale: 1
            }}
            animate={{
              x: flyThumb.end.x - flyThumb.end.size / 2,
              y: flyThumb.end.y - flyThumb.end.size / 2,
              width: flyThumb.end.size,
              height: flyThumb.end.size,
              opacity: 0.2,
              scale: 0.3
            }}
            transition={{ duration: 0.6, ease: 'easeInOut' }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};
