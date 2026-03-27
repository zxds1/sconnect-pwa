import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, BarChart3, Settings, Package, 
  Sparkles, X, Upload, Star, MapPin, Edit3, Save, Trash2,
  Wand2, TrendingUp, Users, AlertCircle, Maximize2, Minimize2,
  ArrowUpRight, Wallet, Megaphone, QrCode, Download, 
  ShieldCheck, Clock, MessageSquare, Heart, Phone, ImageIcon,
  LineChart as LineChartIcon, Zap, Send
} from 'lucide-react';
import { Product, Seller } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell,
  LineChart, Line, Legend
} from 'recharts';
import { ListingOptimizer } from './ListingOptimizer';
import { createThread, listMessages, streamThreadMessage } from '../lib/assistantApi';
import {
  getSellerBuyerInsight,
  getSellerAlerts,
  getSellerChannelMix,
  getSellerCustomerDemographics,
  getSellerFunnel,
  getSellerInventoryInsight,
  getSellerInventorySeries,
  getSellerKpiSummary,
  getSellerLiveBuyers,
  getSellerMarketDemand,
  getSellerMarketBenchmarks,
  getSellerMarketTrending,
  getSellerTrendingSuppliers,
  getSellerPeakHours,
  getSellerDataQuality,
  getSellerConversionSeries,
  getSellerPerformanceAnalysis,
  getSellerProductPerformance,
  getSellerPricingCompetitiveAnalysis,
  getSellerCategoryHealthAnalysis,
  getSellerDemandStockAnalysis,
  getSellerActionRecommendations,
  getSellerTopProducts,
  getSellerSalesVelocity,
  getSellerSalesSeries,
  listSellerAnomalies,
  updateSellerAlerts,
  type Anomaly,
  type BuyerInsight,
  type ChannelMixItem,
  type CustomerDemographicItem,
  type FunnelMetrics,
  type InventoryInsight,
  type InventorySeriesItem,
  type KPISummary,
  type LiveBuyerPoint,
  type MarketBenchmarks,
  type MarketDemandItem,
  type MarketTrendingItem,
  type TrendingSupplierItem,
  type PeakHourItem,
  type ConversionSeriesItem,
  type DataQuality,
  type TopProductItem,
  type SalesSeriesItem,
  type SalesVelocityItem,
  type SellerAlert,
  type PerformanceAnalysis,
  type ProductPerformanceAnalysis,
  type PricingCompetitiveAnalysis,
  type CategoryHealthAnalysis,
  type DemandStockAnalysis,
  type ActionRecommendations
} from '../lib/sellerAnalyticsApi';
import { buildWsUrl } from '../lib/realtime';
import {
  activateFeatured,
  createFanOffer,
  createStockAlert,
  createCategorySpotlight,
  listSellerReferrals,
  listCategorySpotlights,
  listFanOffers,
  listHotspots,
  listStockAlerts,
  getMarketingKPIs,
  broadcastStockAlerts,
  createSellerCampaign,
  listSellerCampaigns,
  type Campaign as ApiCampaign,
  type Hotspot as MarketingHotspot,
  type KPIStat as MarketingKPIStat,
  type Referral as MarketingReferral
} from '../lib/marketingApi';
import {
  createBroadcast,
  getWhatsAppStatus as getCommsWhatsAppStatus,
  listBroadcasts,
  sendWhatsApp,
  type Broadcast
} from '../lib/commsApi';
import {
  getCashflow,
  getFinancialHealth,
  getFinancialProjections,
  getGrowthOverview,
  getGrowthReferrals,
  inviteGrowthReferral,
  getLoanEligibility,
  requestLoan,
  createLoyaltyOffer,
  listBulkBuyGroups,
  joinBulkBuyGroup
} from '../lib/growthApi';
import { getRewardsBalance, getRewardsLedger, getRewardStreaks, listReceipts, submitReceipt, type RewardsLedgerEntry, type RewardsStreak, type RewardsReceipt } from '../lib/rewardsApi';
import {
  completeSellerOnboarding,
  completeSellerTutorial,
  getSellerOnboardingEligibility,
  getSellerOnboardingState,
  getSellerVerificationStatus,
  listSellerTutorials,
  setSellerShopType,
  connectOnlineStore,
  startOnlineOAuth,
  completeOnlineOAuth,
  bulkProductMappings,
  getConnectionStatus,
  getConnectionMappingSuggestions,
  triggerConnectionSync,
  recordSellerOnboardingEvent,
  getSellerShareLink,
  refreshSellerShareLink,
  requestSellerVerification,
  type OnboardingState as SellerOnboardingState,
  type Tutorial as SellerTutorial,
  type VerificationStatus as SellerVerificationStatus,
  type OnlineConnectRequest,
  type ProductMappingItem,
  type MappingSuggestion
} from '../lib/sellerOnboardingApi';
import {
  bulkImportSellerProducts,
  bulkStockUpdateSellerProducts,
  createSellerProduct,
  deleteSellerProduct,
  listSellerProducts,
  listSellerLowStock,
  listSellerRecommendations,
  addSellerProductMedia,
  removeSellerProductMedia,
  updateSellerProduct,
  updateSellerProductPrice,
  updateSellerProductStock,
  type SellerProduct,
  type SellerLowStock,
  type SellerRecommendation
} from '../lib/sellerProductsApi';
import { listPlans, getSubscriptionView, type Plan, type SubscriptionView } from '../lib/subscriptionsApi';
import { createGroupBuyOffer } from '../lib/groupBuyApi';
import { createProduct, listProductMedia, listProductReviews, replyProductReview, type ProductMedia, type ProductReview } from '../lib/catalogApi';
import { requestUploadPresign } from '../lib/uploadsApi';
import { getVideoDurationSeconds, uploadMediaFile as uploadSharedMediaFile } from '../lib/mediaUpload';
import { requestMediaUploadPreview } from '../lib/mediaPreview';
import { addPathLandmark, createPlace, createRegion, deletePath, deletePlace, deleteRegion, listPathWaypoints, listPlaces, listRegions, listSellerPaths, precomputePathWaypoints, recordPath, setPrimaryPath, updatePlace, updateRegion, type PathPoint, type PathWaypoint, type Place, type Region, type RecordedPath } from '../lib/searchApi';
import { getOpsConfig } from '../lib/opsConfigApi';
import {
  getSellerRank,
  getSellerMetrics,
  getSellerProfile,
  updateSellerProfile,
  listSellerLocations,
  listSellerLocationHistory,
  createSellerLocation,
  updateSellerLocation,
  type SellerLocation,
  type ShopLandmark,
  type DeliveryDetails
} from '../lib/sellerProfileApi';
import { getSellerPreferences, updateSellerPreferences, type SellerPreferences as SellerPreferencesApi } from '../lib/sellerPreferencesApi';
import { listShopReviews, replyShopReview, type ShopReview } from '../lib/sellerShopApi';
import { getSellerNotificationPreferences, updateSellerNotificationPreferences, type SellerNotificationPreferences } from '../lib/sellerNotificationsApi';
import { searchShops, type ShopDirectoryEntry } from '../lib/shopDirectoryApi';
import { VideoTrimModal } from './VideoTrimModal';
import { LocationPinPicker } from './LocationPinPicker';
import {
  acceptRFQResponse,
  createRFQ,
  declineRFQResponse,
  getRFQComparison,
  getSupplierDelivery,
  getSupplierOffers,
  listRFQResponses,
  listRFQs,
  listSuppliers,
  type RFQComparison,
  type RFQResponse,
  type RFQThread,
  type Supplier,
  type SupplierDelivery,
  type SupplierOffer
} from '../lib/suppliersApi';

const WEEK_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const SHOP_TYPE_OPTIONS = [
  { id: 'physical', label: 'Physical Shop' },
  { id: 'online', label: 'Online Store' },
  { id: 'hybrid', label: 'Hybrid' },
  { id: 'marketplace', label: 'Marketplace' },
] as const;
const SELLER_MODE_OPTIONS = [
  { id: 'fixed_shop', label: 'Fixed Shop' },
  { id: 'open_market_stall', label: 'Market Stall' },
  { id: 'ground_trader', label: 'Ground Trader' },
  { id: 'solopreneur', label: 'Solopreneur' },
  { id: 'hybrid', label: 'Hybrid' },
] as const;
const BUYER_REACH_OPTIONS = [
  { id: 'fixed_address', label: 'Fixed Address' },
  { id: 'market_stall', label: 'Market Stall / Walk-in' },
  { id: 'delivery_only', label: 'Delivery / WhatsApp' },
] as const;
const uniqueStrings = (value: unknown): string[] =>
  Array.isArray(value)
    ? Array.from(new Set(value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0).map((item) => item.trim())))
    : [];
const toggleMultiSelection = (current: string[], value: string) =>
  current.includes(value)
    ? (current.length === 1 ? current : current.filter((item) => item !== value))
    : [...current, value];
const isHttpUrl = (value: string) => /^https?:\/\//i.test(value.trim());
const EMPTY_SELLER: Seller = {
  id: '',
  name: 'Seller',
  avatar: '/logo.jpg',
  description: '',
  rating: 0,
  followersCount: 0,
  sokoScore: 0,
  dailyViews: 0,
  totalSales: 0
};

const clamp = (value: number, min = 0, max = 100) => Math.min(max, Math.max(min, value));

const formatCompactNumber = (value: number) =>
  new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(value);

const formatCurrencyKES = (value: number) =>
  `KES ${Math.round(value).toLocaleString()}`;

const formatHourLabel = (hour: number) => {
  const normalized = ((hour % 24) + 24) % 24;
  const period = normalized >= 12 ? 'pm' : 'am';
  const display = normalized % 12 || 12;
  return `${display}${period}`;
};

const formatHourRange = (hour: number) =>
  `${formatHourLabel(hour)}-${formatHourLabel((hour + 2) % 24)}`;

const formatMatchConfidence = (value?: number) =>
  typeof value === 'number' && Number.isFinite(value)
    ? `${Math.round(value * 100)}% match`
    : 'Needs review';

const formatDateLabel = (value?: string) => {
  if (!value) return '';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString('en', { month: 'short', day: 'numeric' });
};

const SalesSeriesTooltip = ({ active, payload }: { active?: boolean; payload?: any[] }) => {
  if (!active || !payload || payload.length === 0) return null;
  const data = payload[0]?.payload || {};
  const date = formatDateLabel(data.date || data.label);
  const sales = Number(data.sales ?? 0);
  const orders = Number(data.orders ?? data.velocity ?? 0);
  const sessions = Number(data.sessions ?? data.reach ?? 0);
  return (
    <div className="rounded-xl bg-white p-2 text-[10px] font-bold text-zinc-700 shadow">
      {date && <div className="text-zinc-500">{date}</div>}
      {Number.isFinite(sales) && sales > 0 && <div>Sales: KES {Math.round(sales).toLocaleString()}</div>}
      {Number.isFinite(orders) && orders > 0 && <div>Orders: {orders}</div>}
      {Number.isFinite(sessions) && sessions > 0 && <div>Sessions: {sessions}</div>}
    </div>
  );
};

const haversineDistance = (a: { lat: number; lng: number }, b: { lat: number; lng: number }) => {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLon = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h)) * 1000;
};

const AGENT_STATUS_LABELS: Record<string, string> = {
  orchestrator: 'Orchestrator: Coordinating…',
  discovery: 'Discovery: Comparing offers…',
  negotiation: 'Negotiation: Checking deals…',
  purchase: 'Purchase: Optimizing checkout…',
  insight: 'Insight: Pulling market signals…',
  routing: 'Routing: Comparing routes…'
};


const projectionToSeries = (forecast?: Record<string, any>, fallback: Array<{ name: string; revenue: number }> = []) => {
  if (!forecast) return fallback;
  const series = forecast.series || forecast.points || forecast.data;
  if (Array.isArray(series)) {
    return series
      .map((point: any, idx: number) => ({
        name: point.name || point.label || point.date || WEEK_DAYS[idx % WEEK_DAYS.length],
        revenue: Number(point.value ?? point.revenue ?? point.amount ?? 0),
      }))
      .filter((item) => item.name);
  }
  return fallback;
};

const extractUrls = (text?: string) => {
  if (!text) return [];
  const matches = text.match(/https?:\/\/[^\s]+/g) || [];
  return matches.map((url) => url.replace(/[),.]+$/, ''));
};

const guessMediaType = (url: string): 'image' | 'video' | 'audio' | 'file' => {
  const lower = url.toLowerCase();
  if (lower.match(/\.(png|jpe?g|gif|webp|bmp|svg)$/)) return 'image';
  if (lower.match(/\.(mp4|webm|mov|m4v|avi)$/)) return 'video';
  if (lower.match(/\.(mp3|wav|m4a|aac|ogg)$/)) return 'audio';
  return 'file';
};

const mediaFromMetadata = (metadata?: Record<string, any>) => {
  const media: Array<{ url: string; type: 'image' | 'video' | 'audio' | 'file' }> = [];
  const candidates = [
    metadata?.media_url,
    metadata?.file_url,
    metadata?.image_url,
    metadata?.video_url,
    metadata?.audio_url
  ].filter(Boolean) as string[];
  for (const url of candidates) {
    media.push({ url, type: guessMediaType(url) });
  }
  return media;
};

const renderMedia = (metadata?: Record<string, any>, content?: string) => {
  const media = mediaFromMetadata(metadata);
  const contentUrls = extractUrls(content);
  for (const url of contentUrls) {
    media.push({ url, type: guessMediaType(url) });
  }
  const deduped = media.filter(
    (item, idx) => media.findIndex((m) => m.url === item.url) === idx
  );
  if (!deduped.length) return null;
  return (
    <div className="mt-3 grid grid-cols-1 gap-2">
      {deduped.map((item, idx) => {
        if (item.type === 'image') {
          return (
            <img
              key={`${item.url}-${idx}`}
              src={item.url}
              alt="assistant response"
              className="rounded-2xl border border-white/10 max-h-56 object-cover"
              loading="lazy"
            />
          );
        }
        if (item.type === 'video') {
          return (
            <video
              key={`${item.url}-${idx}`}
              src={item.url}
              controls
              className="rounded-2xl border border-white/10 max-h-56 w-full"
            />
          );
        }
        if (item.type === 'audio') {
          return (
            <audio key={`${item.url}-${idx}`} src={item.url} controls className="w-full" />
          );
        }
        return (
          <a
            key={`${item.url}-${idx}`}
            href={item.url}
            target="_blank"
            rel="noreferrer"
            className="text-[11px] text-indigo-200 underline"
          >
            Open attachment
          </a>
        );
      })}
    </div>
  );
};

const formatRelativeTime = (date: Date, now = new Date()) => {
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.round(diffMs / 1000);
  if (diffSec < 10) return 'just now';
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.round(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.round(diffHr / 24);
  return `${diffDay}d ago`;
};

const toPlaceholderImage = (label: string) => {
  const safe = (label || 'Product').slice(0, 2).toUpperCase();
  const svg = `<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"96\" height=\"96\"><rect width=\"100%\" height=\"100%\" fill=\"#e5e7eb\"/><text x=\"50%\" y=\"52%\" text-anchor=\"middle\" font-family=\"Arial\" font-size=\"28\" fill=\"#6b7280\">${safe}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

const backendSeriesDays = (value?: number) => (Number.isFinite(value ?? NaN) && (value ?? 0) > 0 ? value : undefined);

interface SellerDashboardProps {
  products: Product[];
  onProductsChange: (next: Product[]) => void;
  onToast?: (msg: string) => void;
  verifiedSellerIds: string[];
  onVerifiedSellerIdsChange: (next: string[]) => void;
  onOpenSellerChat?: () => void;
  onOpenSupportChat?: () => void;
  onOpenSupplierChat?: () => void;
}

export const SellerDashboard: React.FC<SellerDashboardProps> = ({
  products,
  onProductsChange,
  onToast,
  verifiedSellerIds,
  onVerifiedSellerIdsChange,
  onOpenSellerChat,
  onOpenSupportChat,
  onOpenSupplierChat
}) => {
  const mediaInputRef = useRef<HTMLInputElement | null>(null);
  const mediaDrawerInputRef = useRef<HTMLInputElement | null>(null);
  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const shopFrontInputRef = useRef<HTMLInputElement | null>(null);
  const [activeTab, setActiveTab] = useState('onboarding');
  const sellerTabHistoryReadyRef = useRef(false);
  const sellerTabSuppressPushRef = useRef(false);
  const initialSellerTabRef = useRef<string | null>(
    typeof window === 'undefined'
      ? null
      : (typeof window.history.state?.sellerTab === 'string' && window.history.state.sellerTab
        ? window.history.state.sellerTab
        : null),
  );
  const sellerDefaultTabResolvedRef = useRef(false);
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [seller, setSeller] = useState<Seller>(EMPTY_SELLER);
  const [myProducts, setMyProducts] = useState<Product[]>([]);
  const [showReferralModal, setShowReferralModal] = useState(false);
  const [referralTarget, setReferralTarget] = useState<'shop' | 'supplier'>('shop');
  const [sellerRewardsBalance, setSellerRewardsBalance] = useState<{ balance?: number; pending?: number; currency?: string } | null>(null);
  const [sellerRewardsLedger, setSellerRewardsLedger] = useState<RewardsLedgerEntry[]>([]);
  const [sellerRewardStreaks, setSellerRewardStreaks] = useState<RewardsStreak[]>([]);
  const [sellerReceipts, setSellerReceipts] = useState<RewardsReceipt[]>([]);
  const [sellerRewardsLoading, setSellerRewardsLoading] = useState(false);
  const [sellerRewardsError, setSellerRewardsError] = useState<string | null>(null);
  const [receiptUploadStatus, setReceiptUploadStatus] = useState<string | null>(null);
  const [receiptUploading, setReceiptUploading] = useState(false);
  const receiptUploadInputRef = useRef<HTMLInputElement | null>(null);
  const [dataSharingRewards, setDataSharingRewards] = useState<{ price_update?: number; stock_update?: number; photo_upload?: number; complete_profile?: number; currency?: string } | null>(null);
  const [referralRewards, setReferralRewards] = useState<{ shop?: number; supplier?: number; currency?: string } | null>(null);
  const [receiptRewardsConfig, setReceiptRewardsConfig] = useState<{ daily_min?: number; daily_max?: number; streak_bonus?: number; streak_days?: number; currency?: string } | null>(null);
  const [claimShopRewardConfig, setClaimShopRewardConfig] = useState<{ amount?: number; currency?: string } | null>(null);
  const [verificationRewardConfig, setVerificationRewardConfig] = useState<{ amount?: number; currency?: string } | null>(null);
  const [featuredListingConfig, setFeaturedListingConfig] = useState<{ price_per_week?: number; currency?: string; duration_days?: number; discount_threshold?: number; discount_pct?: number } | null>(null);
  const [categorySpotlightConfig, setCategorySpotlightConfig] = useState<{ budget?: number; currency?: string; min_budget?: number; max_budget?: number } | null>(null);
  const [clearancePromoConfig, setClearancePromoConfig] = useState<{ discount_pct?: number; currency?: string } | null>(null);
  const [fanOfferConfig, setFanOfferConfig] = useState<{ discount_pct?: number; min_pct?: number; max_pct?: number } | null>(null);
  const [campaignDefaults, setCampaignDefaults] = useState<{ budget?: number; duration_days?: number; objective?: string; channel?: string } | null>(null);
  const [campaignDefaultsApplied, setCampaignDefaultsApplied] = useState(false);
  const [marketingKpiDefaults, setMarketingKpiDefaults] = useState<{ range?: string } | null>(null);
  const [groupBuyDefaults, setGroupBuyDefaults] = useState<{ min_group_size?: number; max_groups?: number; duration_hours?: number } | null>(null);
  const [analyticsDefaults, setAnalyticsDefaults] = useState<{ sales_series_days?: number; sales_velocity_days?: number; peak_hours_days?: number; inventory_series_days?: number; conversion_series_days?: number } | null>(null);
  const [analyticsDefaultsApplied, setAnalyticsDefaultsApplied] = useState(false);
  const [topProductsDefaults, setTopProductsDefaults] = useState<{ days?: number; limit?: number } | null>(null);
  const [broadcastsDefaults, setBroadcastsDefaults] = useState<{ limit?: number } | null>(null);
  const [quickBoostConfig, setQuickBoostConfig] = useState<{ budget?: number; currency?: string } | null>(null);
  const [offlineUssdConfig, setOfflineUssdConfig] = useState<{ code?: string; menu?: string } | null>(null);
  const [offlineSmsConfig, setOfflineSmsConfig] = useState<{ sample?: string } | null>(null);
  const [offlineVoiceConfig, setOfflineVoiceConfig] = useState<{ sample?: string } | null>(null);
  const [subscriptionPlans, setSubscriptionPlans] = useState<Plan[]>([]);
  const [subscriptionView, setSubscriptionView] = useState<SubscriptionView | null>(null);
  const [sellerRankInfo, setSellerRankInfo] = useState<{ rank?: number; breakdown?: Record<string, any> } | null>(null);
  const [offlineEnabled, setOfflineEnabled] = useState(false);
  const [campaigns, setCampaigns] = useState<Array<{
    id: string;
    name: string;
    objective: 'reach' | 'sales' | 'favorites';
    budget: number;
    durationDays: number;
    productId: string;
    channel: 'search' | 'feed' | 'messages';
    status: 'scheduled' | 'active' | 'completed' | 'paused' | 'draft';
  }>>([]);
  const [campaignForm, setCampaignForm] = useState({
    name: '',
    objective: 'sales' as 'reach' | 'sales' | 'favorites',
    budget: 0,
    durationDays: 0,
    productId: '',
    channel: 'search' as 'search' | 'feed' | 'messages'
  });
  const [campaignStatus, setCampaignStatus] = useState<string | null>(null);
  const [campaignLoading, setCampaignLoading] = useState(false);
  const [referralPhone, setReferralPhone] = useState('');
  const [pendingVideoTrim, setPendingVideoTrim] = useState<{
    file: File;
    kind: 'product' | 'avatar' | 'landmark';
    targetProduct?: Product | null;
    landmarkIndex?: number | null;
  } | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handlePopState = (event: PopStateEvent) => {
      const nextTab = String(event.state?.sellerTab || '');
      if (!nextTab) return;
      sellerTabSuppressPushRef.current = true;
      setActiveTab(nextTab);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const nextState = { ...(window.history.state || {}), sellerTab: activeTab };
    const nextUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    if (!sellerTabHistoryReadyRef.current) {
      window.history.replaceState(nextState, '', nextUrl);
      sellerTabHistoryReadyRef.current = true;
      return;
    }
    if (sellerTabSuppressPushRef.current) {
      sellerTabSuppressPushRef.current = false;
      window.history.replaceState(nextState, '', nextUrl);
      return;
    }
    window.history.pushState(nextState, '', nextUrl);
  }, [activeTab]);

  const selectTab = (tabId: string) => {
    setActiveTab(tabId);
  };

  useEffect(() => {
    if (!seller.id) return;
    setMyProducts(products.filter(p => p.sellerId === seller.id));
  }, [seller.id, products]);

  useEffect(() => {
    let ignore = false;
    const loadSeller = async () => {
      try {
      const [profile, locations, , shareLink, metrics, prefsResp, regions, places] = await Promise.all([
        getSellerProfile(),
        listSellerLocations(),
        listSellerLocationHistory().catch(() => []),
        getSellerShareLink().catch(() => null),
        getSellerMetrics().catch(() => null),
        getSellerPreferences().catch(() => null),
        listRegions().catch(() => []),
        listPlaces().catch(() => [])
        ]);
        if (ignore || !profile) return;
        const primaryLocation = locations?.[0];
        const rawLocation = primaryLocation || null;
        const location =
          typeof rawLocation === 'string'
            ? { address: rawLocation }
            : rawLocation
            ? (() => {
                const latRaw = (rawLocation as any).lat ?? (rawLocation as any).latitude;
                const lngRaw = (rawLocation as any).lng ?? (rawLocation as any).longitude;
                const lat = Number.isFinite(Number(latRaw)) ? Number(latRaw) : undefined;
                const lng = Number.isFinite(Number(lngRaw)) ? Number(lngRaw) : undefined;
                return {
                  address: (rawLocation as any).address || (rawLocation as any).label || (rawLocation as any).name || '',
                  ...(lat !== undefined ? { lat } : {}),
                  ...(lng !== undefined ? { lng } : {})
                };
              })()
            : undefined;
        const locationLatRaw =
          (primaryLocation as any)?.lat ??
          (primaryLocation as any)?.latitude ??
          location?.lat;
        const locationLngRaw =
          (primaryLocation as any)?.lng ??
          (primaryLocation as any)?.longitude ??
          location?.lng;
        const locationLat = Number.isFinite(Number(locationLatRaw)) ? Number(locationLatRaw) : undefined;
        const locationLng = Number.isFinite(Number(locationLngRaw)) ? Number(locationLngRaw) : undefined;
        setSeller(prev => ({
          ...prev,
          id: profile.seller_id || prev.id,
          name: profile.name || prev.name,
          description: profile.description || prev.description,
          avatar: profile.logo_url || prev.avatar,
          rating: Number((metrics as any)?.avg_rating ?? prev.rating),
          followersCount: Number((metrics as any)?.followers ?? prev.followersCount),
          location: location && location.lat !== undefined && location.lng !== undefined
            ? { address: location.address, lat: location.lat, lng: location.lng }
            : prev.location
        }));
        setLocationRegions(Array.isArray(regions) ? regions : []);
        setLocationPlaces(Array.isArray(places) ? places : []);
        setProfileData({
          name: profile.name || seller.name,
          description: profile.description || seller.description,
          address: locations?.[0]?.address || seller.location?.address || '',
          placeId: profile.place_id || locations?.[0]?.place_id || '',
          defaultRegionId: profile.default_region_id || locations?.[0]?.region_id || '',
          locationMode: profile.location_mode || 'fixed'
        });
        setShopLocationLat(locationLat ?? '');
        setShopLocationLng(locationLng ?? '');
        setSellerShareLink((shareLink as any)?.share_url ?? null);
        const prefs = (prefsResp as SellerPreferencesApi | null) ?? null;
        setSellerPreferences(prefs);
        if (prefs?.analytics) {
          const salesDays = Number(prefs.analytics.sales_series_days);
          const velocityDays = Number(prefs.analytics.sales_velocity_days);
          const peakDays = Number(prefs.analytics.peak_hours_days);
          const inventoryDays = Number(prefs.analytics.inventory_series_days);
          const conversionDays = Number(prefs.analytics.conversion_series_days);
          if (Number.isFinite(salesDays) && salesDays > 0) setSalesSeriesDays(salesDays);
          if (Number.isFinite(velocityDays) && velocityDays > 0) setSalesVelocityDays(velocityDays);
          if (Number.isFinite(peakDays) && peakDays > 0) setPeakHoursDays(peakDays);
          if (Number.isFinite(inventoryDays) && inventoryDays > 0) setInventorySeriesDays(inventoryDays);
          if (Number.isFinite(conversionDays) && conversionDays > 0) setConversionSeriesDays(conversionDays);
        }
        setSellerPreferencesDraft(prev => ({
          marketing: {
            ...prev.marketing,
            ...(prefs?.marketing ?? {}),
            kpi_range: String(prefs?.marketing?.kpi_range ?? prev.marketing.kpi_range ?? '30d'),
            campaign_duration_days: Number(prefs?.marketing?.campaign_duration_days ?? prev.marketing.campaign_duration_days ?? 7),
            top_products_days: Number(prefs?.marketing?.top_products_days ?? prev.marketing.top_products_days ?? 30),
            top_products_limit: Number(prefs?.marketing?.top_products_limit ?? prev.marketing.top_products_limit ?? 5),
            broadcast_limit: Number(prefs?.marketing?.broadcast_limit ?? prev.marketing.broadcast_limit ?? 50),
            quick_boost_budget: Number(prefs?.marketing?.quick_boost_budget ?? prev.marketing.quick_boost_budget ?? 500)
          },
          growth: {
            ...prev.growth,
            ...(prefs?.growth ?? {}),
            projection_type: String(prefs?.growth?.projection_type ?? prev.growth.projection_type ?? 'cashflow'),
            loan_request_ratio: Number(prefs?.growth?.loan_request_ratio ?? prev.growth.loan_request_ratio ?? 0.5)
          },
          comms: {
            ...prev.comms,
            ...(prefs?.comms ?? {}),
            broadcast_limit: Number(prefs?.comms?.broadcast_limit ?? prev.comms.broadcast_limit ?? 50)
          },
          analytics: {
            ...prev.analytics,
            ...(prefs?.analytics ?? {}),
            sales_series_days: Number(prefs?.analytics?.sales_series_days ?? prev.analytics.sales_series_days ?? 7),
            sales_velocity_days: Number(prefs?.analytics?.sales_velocity_days ?? prev.analytics.sales_velocity_days ?? 7),
            peak_hours_days: Number(prefs?.analytics?.peak_hours_days ?? prev.analytics.peak_hours_days ?? 7),
            inventory_series_days: Number(prefs?.analytics?.inventory_series_days ?? prev.analytics.inventory_series_days ?? 14),
            conversion_series_days: Number(prefs?.analytics?.conversion_series_days ?? prev.analytics.conversion_series_days ?? 14)
          },
          procurement: {
            ...prev.procurement,
            ...(prefs?.procurement ?? {}),
            max_distance_km: Number(prefs?.procurement?.max_distance_km ?? prev.procurement.max_distance_km ?? 50),
            max_unit_cost: Number(prefs?.procurement?.max_unit_cost ?? prev.procurement.max_unit_cost ?? 500),
            max_moq: Number(prefs?.procurement?.max_moq ?? prev.procurement.max_moq ?? 50),
            max_lead_time_days: Number(prefs?.procurement?.max_lead_time_days ?? prev.procurement.max_lead_time_days ?? 14),
            min_rating: Number(prefs?.procurement?.min_rating ?? prev.procurement.min_rating ?? 0),
            verified_only: Boolean(prefs?.procurement?.verified_only ?? prev.procurement.verified_only ?? false)
          }
        }));
      } catch {
        // Ignore profile errors; screen still renders.
      }
    };
    loadSeller();
    return () => {
      ignore = true;
    };
  }, []);

  // Form States
  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    price: string;
    category: string;
    mediaUrl: string;
    stockLevel: number;
    expiryDate?: string;
    groupBuyEligible: boolean;
    groupBuyTiers: Array<{ qty: number; price: number; discount?: string }>;
  }>({
    name: '',
    description: '',
    price: '',
    category: '',
    mediaUrl: '',
    stockLevel: 10,
    expiryDate: '',
    groupBuyEligible: false,
    groupBuyTiers: []
  });

  // Profile Form States
  const [profileData, setProfileData] = useState({
    name: seller.name,
    description: seller.description,
    address: seller.location?.address || '',
    placeId: '',
    defaultRegionId: '',
    locationMode: 'fixed',
  });
  const [shopLocationLat, setShopLocationLat] = useState<number | ''>('');
  const [shopLocationLng, setShopLocationLng] = useState<number | ''>('');
  const [shopFrontImageUrl, setShopFrontImageUrl] = useState('');
  const [directionsNote, setDirectionsNote] = useState('');
  const [shopLandmarks, setShopLandmarks] = useState<Array<ShopLandmark & { uploading?: boolean }>>([]);
  const [locationRegions, setLocationRegions] = useState<Region[]>([]);
  const [locationPlaces, setLocationPlaces] = useState<Place[]>([]);
  const [locationAdminStatus, setLocationAdminStatus] = useState<string | null>(null);
  const [regionDraft, setRegionDraft] = useState({ type: 'market_zone', name: '', parentId: '', lat: '', lng: '', locationLabel: '' });
  const [placeDraft, setPlaceDraft] = useState({ type: 'pickup_point', name: '', regionId: '', addressLine: '', lat: '', lng: '', locationLabel: '' });
  const [editingRegionId, setEditingRegionId] = useState<string | null>(null);
  const [editingPlaceId, setEditingPlaceId] = useState<string | null>(null);
  const activeShopLocationLabel = (() => {
    const selectedPlace = locationPlaces.find((place) => place.id === profileData.placeId);
    const selectedRegion = locationRegions.find((region) => region.id === profileData.defaultRegionId);
    if (selectedPlace?.name) return `Using ${selectedPlace.name}`;
    if (selectedRegion?.name) return `Using ${selectedRegion.name}`;
    if (profileData.address.trim()) return `Using ${profileData.address.trim()}`;
    return '';
  })();

  const [showListingOptimizer, setShowListingOptimizer] = useState(false);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [supplierFilters, setSupplierFilters] = useState({
    category: '',
    maxDistance: 50,
    minRating: 0,
    verifiedOnly: false,
    maxLeadTime: 14,
    maxMOQ: 50,
    maxUnitCost: 500,
    paymentTerms: ''
  });
  const [suppliersData, setSuppliersData] = useState<Supplier[]>([]);
  const [suppliersLoading, setSuppliersLoading] = useState(false);
  const [suppliersStatus, setSuppliersStatus] = useState<string | null>(null);
  const [supplierOffersById, setSupplierOffersById] = useState<Record<string, SupplierOffer[]>>({});
  const [supplierDeliveryById, setSupplierDeliveryById] = useState<Record<string, SupplierDelivery>>({});
  const [rfqThreadsRemote, setRfqThreadsRemote] = useState<RFQThread[]>([]);
  const [rfqResponsesById, setRfqResponsesById] = useState<Record<string, RFQResponse[]>>({});
  const [rfqComparisonById, setRfqComparisonById] = useState<Record<string, RFQComparison>>({});
  const [rfqItemsById, setRfqItemsById] = useState<Record<string, Array<{ name: string; quantity: number; unit: string }>>>({});
  const [rfqLoading, setRfqLoading] = useState(false);
  const [rfqStatus, setRfqStatus] = useState<string | null>(null);
  const [rfqLastUpdated, setRfqLastUpdated] = useState<Date | null>(null);
  const rfqThreadsRef = useRef<RFQThread[]>([]);
  const [sellerFilters, setSellerFilters] = useState({
    category: '',
    maxDistance: 50,
    minRating: 0,
    verifiedOnly: false
  });
  const [sellerDirectory, setSellerDirectory] = useState<Array<{
    shop: ShopDirectoryEntry;
    distanceKm: number | null;
    score: number;
  }>>([]);
  const [sellerDirectoryLoading, setSellerDirectoryLoading] = useState(false);
  const [sellerDirectoryStatus, setSellerDirectoryStatus] = useState<string | null>(null);
  const [sellerReviews, setSellerReviews] = useState<any[]>([]);
  const [shopReviews, setShopReviews] = useState<any[]>([]);
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [showRfqModal, setShowRfqModal] = useState(false);
  const [rfqStep, setRfqStep] = useState<'details' | 'suppliers' | 'review'>('details');
  const [rfqDraft, setRfqDraft] = useState({
    type: 'single' as 'single' | 'multi' | 'group' | 'standing' | 'emergency',
    title: '',
    deliveryLocation: '',
    items: [{ name: '', quantity: 1, unit: 'units' }],
    supplierIds: [] as string[]
  });
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [compareSort, setCompareSort] = useState<'price' | 'eta' | 'rating' | 'distance'>('price');
  const [broadcastCount, setBroadcastCount] = useState(0);
  const [analyticsSummary, setAnalyticsSummary] = useState<KPISummary | null>(null);
  const [analyticsFunnel, setAnalyticsFunnel] = useState<FunnelMetrics | null>(null);
  const [analyticsInventory, setAnalyticsInventory] = useState<InventoryInsight | null>(null);
  const [analyticsBuyers, setAnalyticsBuyers] = useState<BuyerInsight | null>(null);
  const [analyticsMarket, setAnalyticsMarket] = useState<MarketBenchmarks | null>(null);
  const [analyticsAnomalies, setAnalyticsAnomalies] = useState<Anomaly[]>([]);
  const [analyticsChannelMix, setAnalyticsChannelMix] = useState<ChannelMixItem[]>([]);
  const [analyticsDemographicsData, setAnalyticsDemographicsData] = useState<CustomerDemographicItem[]>([]);
  const [analyticsMarketDemand, setAnalyticsMarketDemand] = useState<MarketDemandItem[]>([]);
  const [analyticsMarketTrending, setAnalyticsMarketTrending] = useState<MarketTrendingItem[]>([]);
  const [analyticsTrendingSuppliers, setAnalyticsTrendingSuppliers] = useState<TrendingSupplierItem[]>([]);
  const [analyticsLiveBuyers, setAnalyticsLiveBuyers] = useState<LiveBuyerPoint[]>([]);
  const [analyticsPeakHoursData, setAnalyticsPeakHoursData] = useState<PeakHourItem[]>([]);
  const [analyticsSalesSeries, setAnalyticsSalesSeries] = useState<SalesSeriesItem[]>([]);
  const [analyticsSalesVelocitySeries, setAnalyticsSalesVelocitySeries] = useState<SalesVelocityItem[]>([]);
  const [analyticsInventorySeries, setAnalyticsInventorySeries] = useState<InventorySeriesItem[]>([]);
  const [analyticsConversionSeries, setAnalyticsConversionSeries] = useState<ConversionSeriesItem[]>([]);
  const [analyticsTopProducts, setAnalyticsTopProducts] = useState<TopProductItem[]>([]);
  const [analyticsDataQuality, setAnalyticsDataQuality] = useState<DataQuality | null>(null);
  const [analyticsPerformanceV2, setAnalyticsPerformanceV2] = useState<PerformanceAnalysis | null>(null);
  const [analyticsProductPerformanceV2, setAnalyticsProductPerformanceV2] = useState<ProductPerformanceAnalysis | null>(null);
  const [analyticsPricingV2, setAnalyticsPricingV2] = useState<PricingCompetitiveAnalysis | null>(null);
  const [analyticsCategoryHealthV2, setAnalyticsCategoryHealthV2] = useState<CategoryHealthAnalysis | null>(null);
  const [analyticsDemandStockV2, setAnalyticsDemandStockV2] = useState<DemandStockAnalysis | null>(null);
  const [analyticsActionsV2, setAnalyticsActionsV2] = useState<ActionRecommendations | null>(null);
  const [, setAnalyticsStatus] = useState<string | null>(null);
  const [salesSeriesDays, setSalesSeriesDays] = useState<number | undefined>(undefined);
  const [salesVelocityDays, setSalesVelocityDays] = useState<number | undefined>(undefined);
  const [peakHoursDays, setPeakHoursDays] = useState<number | undefined>(undefined);
  const [inventorySeriesDays, setInventorySeriesDays] = useState<number | undefined>(undefined);
  const [conversionSeriesDays, setConversionSeriesDays] = useState<number | undefined>(undefined);
  const [salesSeriesLoading, setSalesSeriesLoading] = useState(false);
  const [salesVelocityLoading, setSalesVelocityLoading] = useState(false);
  const [peakHoursLoading, setPeakHoursLoading] = useState(false);
  const [inventorySeriesLoading, setInventorySeriesLoading] = useState(false);
  const [conversionSeriesLoading, setConversionSeriesLoading] = useState(false);
  const [, setSellerAlerts] = useState<SellerAlert[]>([]);
  const [sellerAlertsDraft, setSellerAlertsDraft] = useState<SellerAlert[]>([]);
  const [sellerAlertsStatus, setSellerAlertsStatus] = useState<string | null>(null);
  const [sellerAlertsSaving, setSellerAlertsSaving] = useState(false);
  const heatmapContainerRef = useRef<HTMLDivElement | null>(null);
  const heatmapMapRef = useRef<any>(null);
  const heatmapReadyRef = useRef(false);
  const mapboxToken = typeof (import.meta as any)?.env?.VITE_MAPBOX_TOKEN === 'string'
    ? (import.meta as any).env.VITE_MAPBOX_TOKEN
    : '';
  const mapboxModuleRef = useRef<any>(null);
  const mapboxLoadingRef = useRef<Promise<any> | null>(null);
  const [showPathRecorder, setShowPathRecorder] = useState(false);
  const [isPathRecorderExpanded, setIsPathRecorderExpanded] = useState(false);
  const [pathRecordingActive, setPathRecordingActive] = useState(false);
  const [pathRecordingPoints, setPathRecordingPoints] = useState<PathPoint[]>([]);
  const [pathRecordingDistance, setPathRecordingDistance] = useState(0);
  const [pathRecordingStart, setPathRecordingStart] = useState<number | null>(null);
  const [pathRecordingPaused, setPathRecordingPaused] = useState(false);
  const [pathRecordingName, setPathRecordingName] = useState('');
  const [pathRecordingShared, setPathRecordingShared] = useState(true);
  const [pathRecordingPrimary, setPathRecordingPrimary] = useState(true);
  const [pathRecordingStartLabel, setPathRecordingStartLabel] = useState('');
  const [pathRecordingEndLabel, setPathRecordingEndLabel] = useState('');
  const [pathLandmarkDrafts, setPathLandmarkDrafts] = useState<Array<{ label: string; type: string; imageUrl?: string; lat?: number; lng?: number; sequence?: number; uploading?: boolean }>>([]);
  const [pathRecordingStatus, setPathRecordingStatus] = useState<string | null>(null);
  const [sellerPaths, setSellerPaths] = useState<RecordedPath[]>([]);
  const [sellerPathsStatus, setSellerPathsStatus] = useState<string | null>(null);
  const [selectedPathId, setSelectedPathId] = useState<string | null>(null);
  const [selectedPathWaypoints, setSelectedPathWaypoints] = useState<PathWaypoint[]>([]);
  const [selectedPathLoading, setSelectedPathLoading] = useState(false);
  const landmarkDragIndexRef = useRef<number | null>(null);
  const pathRecorderContainerRef = useRef<HTMLDivElement | null>(null);
  const pathRecorderMapRef = useRef<any>(null);
  const pathRecordingWatchIdRef = useRef<number | null>(null);
  const [, setBroadcasts] = useState<Broadcast[]>([]);
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [, setCommsStatus] = useState<string | null>(null);
  const [marketingKpis, setMarketingKpis] = useState<MarketingKPIStat | null>(null);
  const [marketingHotspots, setMarketingHotspots] = useState<MarketingHotspot[]>([]);
  const [marketingStockAlerts, setMarketingStockAlerts] = useState<Array<{ id?: string; product_id?: string; message?: string; status?: string }>>([]);
  const [, setMarketingFanOffers] = useState<Array<{ id?: string; offer_title?: string; discount?: string; status?: string }>>([]);
  const [marketingCategorySpotlights, setMarketingCategorySpotlights] = useState<Array<{ id?: string; category?: string; budget?: string; status?: string }>>([]);
  const [marketingStatus, setMarketingStatus] = useState<string | null>(null);
  const [sellerPreferences, setSellerPreferences] = useState<SellerPreferencesApi | null>(null);
  const [sellerPreferencesDraft, setSellerPreferencesDraft] = useState({
    marketing: {
      kpi_range: '30d',
      campaign_duration_days: 7,
      top_products_days: 30,
      top_products_limit: 5,
      broadcast_limit: 50,
      quick_boost_budget: 500
    },
    growth: {
      projection_type: 'cashflow',
      loan_request_ratio: 0.5
    },
    comms: {
      broadcast_limit: 50
    },
    analytics: {
      sales_series_days: 7,
      sales_velocity_days: 7,
      peak_hours_days: 7,
      inventory_series_days: 14,
      conversion_series_days: 14
    },
    procurement: {
      max_distance_km: 50,
      max_unit_cost: 500,
      max_moq: 50,
      max_lead_time_days: 14,
      min_rating: 0,
      verified_only: false
    }
  });
  const [sellerPreferencesSaving, setSellerPreferencesSaving] = useState(false);
  const [sellerPreferencesStatus, setSellerPreferencesStatus] = useState<string | null>(null);
  const [stockAlertProductId, setStockAlertProductId] = useState('');
  const [sellerReferralCodes, setSellerReferralCodes] = useState<MarketingReferral[]>([]);
  const [onboardingState, setOnboardingState] = useState<SellerOnboardingState | null>(null);
  const [onboardingEligible, setOnboardingEligible] = useState<boolean | null>(null);
  const [onboardingTutorials, setOnboardingTutorials] = useState<SellerTutorial[]>([]);
  const [onboardingStatus, setOnboardingStatus] = useState<string | null>(null);
  const [sellerShareLink, setSellerShareLink] = useState<string | null>(null);
  const [shopType, setShopType] = useState('physical');
  const [shopTypeSelections, setShopTypeSelections] = useState<string[]>(['physical']);
  const [sellerMode, setSellerMode] = useState('fixed_shop');
  const [sellerModeSelections, setSellerModeSelections] = useState<string[]>(['fixed_shop']);
  const [buyerReach, setBuyerReach] = useState<'fixed_address' | 'market_stall' | 'delivery_only'>('fixed_address');
  const [buyerReachSelections, setBuyerReachSelections] = useState<string[]>(['fixed_address']);
  const [sellerServiceArea, setSellerServiceArea] = useState<Record<string, any>>({});
  const [marketName, setMarketName] = useState('');
  const [visualMarker, setVisualMarker] = useState('');
  const [visualMarkerUploading, setVisualMarkerUploading] = useState(false);
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [deliveryRadiusKm, setDeliveryRadiusKm] = useState<number | ''>('');
  const [dailyPlaceName, setDailyPlaceName] = useState('');
  const [dailyLat, setDailyLat] = useState<number | ''>('');
  const [dailyLng, setDailyLng] = useState<number | ''>('');
  const [deliveryDetails, setDeliveryDetails] = useState<DeliveryDetails>({
    offers_delivery: false,
    delivery_days: [],
    delivery_zones: []
  });
  const [deliveryZonesInput, setDeliveryZonesInput] = useState('');
  const [paymentOptionsInput, setPaymentOptionsInput] = useState('');
  const [installationServicesInput, setInstallationServicesInput] = useState('');
  const [afterSalesSupportInput, setAfterSalesSupportInput] = useState('');
  const visualMarkerInputRef = useRef<HTMLInputElement | null>(null);
  const [onlineConnectForm, setOnlineConnectForm] = useState<OnlineConnectRequest>({
    platform: 'shopify',
    shop_domain: '',
    api_base_url: '',
    api_key: '',
    api_secret: '',
    webhook_secret: '',
    webhook_url: '',
    products_endpoint: '',
    orders_endpoint: '',
    demand_endpoint: '',
    csv_import_url: '',
    auth_code: '',
    scopes: ''
  });
  const [onlineConnectionStatus, setOnlineConnectionStatus] = useState<string | null>(null);
  const [onlineConnectionId, setOnlineConnectionId] = useState<string | null>(null);
  const [onlineAuthUrl, setOnlineAuthUrl] = useState<string | null>(null);
  const [oauthStatus, setOauthStatus] = useState<string | null>(null);
  const [groupBuyOfferStatus, setGroupBuyOfferStatus] = useState<string | null>(null);
  const [mappingItems, setMappingItems] = useState<ProductMappingItem[]>([]);
  const [mappingSuggestions, setMappingSuggestions] = useState<MappingSuggestion[]>([]);
  const [mappingStatus, setMappingStatus] = useState<string | null>(null);
  const [mappingSyncing, setMappingSyncing] = useState(false);
  const [mappingSuggestionsLoading, setMappingSuggestionsLoading] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<SellerVerificationStatus | null>(null);
  const [productsStatus, setProductsStatus] = useState<string | null>(null);
  const [productsLoading, setProductsLoading] = useState(false);
  const [mediaUploading, setMediaUploading] = useState(false);
  const [sellerRecommendations, setSellerRecommendations] = useState<SellerRecommendation[]>([]);
  const [productLowStock, setProductLowStock] = useState<SellerLowStock[]>([]);


  const [productMediaByProductId, setProductMediaByProductId] = useState<Record<string, ProductMedia[]>>({});
  const [showMediaDrawer, setShowMediaDrawer] = useState(false);
  const [mediaDrawerProduct, setMediaDrawerProduct] = useState<Product | null>(null);
  const [settingsStatus, setSettingsStatus] = useState<string | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [sellerLocations, setSellerLocations] = useState<SellerLocation[]>([]);
  const [sellerLocationHistory, setSellerLocationHistory] = useState<Array<{
    id: string;
    lat: number;
    lng: number;
    region_id?: string;
    place_id?: string;
    source?: string;
    created_at?: string;
  }>>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [notificationPrefs, setNotificationPrefs] = useState<SellerNotificationPreferences>({
    price_drops: true,
    back_in_stock: true,
    trending: true,
    marketing: true,
    rewards: true,
    support: true,
    system: true,
    watched_items: true,
    location_based: true,
    frequency: 'instant',
    quiet_hours_start: '',
    quiet_hours_end: ''
  });
  const [notificationsUpdating, setNotificationsUpdating] = useState(false);
  const [growthOverview, setGrowthOverview] = useState<Record<string, any> | null>(null);
  const [growthCashflow, setGrowthCashflow] = useState<Record<string, any> | null>(null);
  const [growthHealth, setGrowthHealth] = useState<Record<string, any> | null>(null);
  const [growthLoan, setGrowthLoan] = useState<Record<string, any> | null>(null);
  const [growthProjection, setGrowthProjection] = useState<Record<string, any> | null>(null);
  const [growthReferrals, setGrowthReferrals] = useState<Record<string, any> | null>(null);
  const [growthStatus, setGrowthStatus] = useState<string | null>(null);
  const [bulkGroups, setBulkGroups] = useState<Array<{ id?: string; title?: string; product_category?: string; target_qty?: number; status?: string }>>([]);
  const [aiInsightMessage, setAiInsightMessage] = useState('');
  const [aiInsightMeta, setAiInsightMeta] = useState<Record<string, any> | null>(null);
  const [aiInsightLoading, setAiInsightLoading] = useState(false);
  const [aiInsightError, setAiInsightError] = useState<string | null>(null);
  const [aiInsightThreadId, setAiInsightThreadId] = useState<string | null>(null);
  const aiInsightContextRef = useRef<string>('');
  const aiInsightInFlightRef = useRef(false);

  const sellerMarketingPreferences = sellerPreferences?.marketing || {};
  const sellerGrowthPreferences = sellerPreferences?.growth || {};
  const sellerCommsPreferences = sellerPreferences?.comms || {};
  const sellerAnalyticsPreferences = sellerPreferences?.analytics || {};
  const sellerProcurementPreferences = sellerPreferences?.procurement || {};
  const marketingKpiRange = String(sellerMarketingPreferences.kpi_range ?? marketingKpiDefaults?.range ?? '30d').trim() || '30d';
  const campaignDurationDays = Number(sellerMarketingPreferences.campaign_duration_days ?? campaignDefaults?.duration_days ?? 7);
  const topProductsDays = Number(sellerMarketingPreferences.top_products_days ?? topProductsDefaults?.days ?? 30);
  const topProductsLimit = Number(sellerMarketingPreferences.top_products_limit ?? topProductsDefaults?.limit ?? 5);
  const broadcastsLimit = Number(sellerCommsPreferences.broadcast_limit ?? broadcastsDefaults?.limit ?? 50);
  const growthProjectionType = String(sellerGrowthPreferences.projection_type ?? 'cashflow').trim() || 'cashflow';
  const loanRequestRatio = Number(sellerGrowthPreferences.loan_request_ratio ?? 0.5);
  const analyticsSalesDays = Number(sellerAnalyticsPreferences.sales_series_days ?? analyticsDefaults?.sales_series_days ?? 7);
  const analyticsVelocityDays = Number(sellerAnalyticsPreferences.sales_velocity_days ?? analyticsDefaults?.sales_velocity_days ?? 7);
  const analyticsPeakHoursDays = Number(sellerAnalyticsPreferences.peak_hours_days ?? analyticsDefaults?.peak_hours_days ?? 7);
  const analyticsInventoryDays = Number(sellerAnalyticsPreferences.inventory_series_days ?? analyticsDefaults?.inventory_series_days ?? 14);
  const analyticsConversionDays = Number(sellerAnalyticsPreferences.conversion_series_days ?? analyticsDefaults?.conversion_series_days ?? 14);

  useEffect(() => {
    const isVerified = verifiedSellerIds.includes(seller.id);
    setSeller(prev => ({ ...prev, isVerified }));
    setMyProducts(products.filter(p => p.sellerId === seller.id));
  }, [products, seller.id, verifiedSellerIds]);

  useEffect(() => {
    setSupplierFilters(prev => ({
      ...prev,
      maxDistance: Number(sellerProcurementPreferences.max_distance_km ?? prev.maxDistance ?? 50),
      maxUnitCost: Number(sellerProcurementPreferences.max_unit_cost ?? prev.maxUnitCost ?? 500),
      maxMOQ: Number(sellerProcurementPreferences.max_moq ?? prev.maxMOQ ?? 50),
      maxLeadTime: Number(sellerProcurementPreferences.max_lead_time_days ?? prev.maxLeadTime ?? 14),
      minRating: Number(sellerProcurementPreferences.min_rating ?? prev.minRating ?? 0),
      verifiedOnly: Boolean(sellerProcurementPreferences.verified_only ?? prev.verifiedOnly ?? false)
    }));
  }, [sellerProcurementPreferences.max_distance_km, sellerProcurementPreferences.max_lead_time_days, sellerProcurementPreferences.max_moq, sellerProcurementPreferences.max_unit_cost, sellerProcurementPreferences.min_rating, sellerProcurementPreferences.verified_only]);

  useEffect(() => {
    if (broadcastMessage.trim()) return;
    if (marketingStockAlerts.length === 0) return;
    const alerts = marketingStockAlerts
      .filter((alert) => alert.message)
      .slice(0, 3)
      .map((alert) => alert.message)
      .join(' • ');
    if (alerts) setBroadcastMessage(alerts);
  }, [broadcastMessage, marketingStockAlerts]);

  const loadSellerRewards = React.useCallback(async () => {
    setSellerRewardsLoading(true);
    setSellerRewardsError(null);
    try {
      const [balance, ledger, streaks, receipts] = await Promise.all([
        getRewardsBalance(),
        getRewardsLedger(),
        getRewardStreaks().catch(() => []),
        listReceipts().catch(() => [])
      ]);
      setSellerRewardsBalance(balance || null);
      setSellerRewardsLedger(Array.isArray(ledger) ? ledger : []);
      setSellerRewardStreaks(Array.isArray(streaks) ? streaks : []);
      setSellerReceipts(Array.isArray(receipts) ? receipts : []);
    } catch (err: any) {
      setSellerRewardsError(err?.message || 'Unable to load rewards wallet.');
    } finally {
      setSellerRewardsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSellerRewards();
  }, [loadSellerRewards]);

  const loadRewardConfigs = React.useCallback(async () => {
    try {
      const [
        dataSharingResp,
        referralResp,
        offlineResp,
        receiptRewardsResp,
        claimShopResp,
        verificationResp,
        featuredListingResp,
        clearancePromoResp,
        categorySpotlightResp,
        fanOfferResp,
        campaignDefaultsResp,
        marketingKpiDefaultsResp,
        groupBuyDefaultsResp,
        analyticsDefaultsResp,
        topProductsDefaultsResp,
        broadcastsDefaultsResp,
        quickBoostResp,
        offlineUssdResp,
        offlineSmsResp,
        offlineVoiceResp
      ] = await Promise.all([
        getOpsConfig('rewards.data_sharing').catch(() => null),
        getOpsConfig('rewards.referrals').catch(() => null),
        getOpsConfig('features.offline').catch(() => null),
        getOpsConfig('rewards.receipts').catch(() => null),
        getOpsConfig('rewards.claim_shop').catch(() => null),
        getOpsConfig('rewards.verification').catch(() => null),
        getOpsConfig('marketing.featured_listing').catch(() => null),
        getOpsConfig('marketing.clearance_promotion').catch(() => null),
        getOpsConfig('marketing.category_spotlight').catch(() => null),
        getOpsConfig('marketing.fan_offer').catch(() => null),
        getOpsConfig('marketing.campaign_defaults').catch(() => null),
        getOpsConfig('marketing.kpi_defaults').catch(() => null),
        getOpsConfig('groupbuy.offer_defaults').catch(() => null),
        getOpsConfig('analytics.series_defaults').catch(() => null),
        getOpsConfig('analytics.top_products_defaults').catch(() => null),
        getOpsConfig('comms.broadcasts_defaults').catch(() => null),
        getOpsConfig('marketing.quick_boost').catch(() => null),
        getOpsConfig('offline.ussd').catch(() => null),
        getOpsConfig('offline.sms_sample').catch(() => null),
        getOpsConfig('offline.voice_sample').catch(() => null)
      ]);
      setDataSharingRewards((dataSharingResp as any)?.value ?? null);
      setReferralRewards((referralResp as any)?.value ?? null);
      const offlineValue = (offlineResp as any)?.value;
      setOfflineEnabled(
        typeof offlineValue === 'boolean'
          ? offlineValue
          : typeof offlineValue === 'string'
            ? offlineValue.toLowerCase() === 'true'
            : Boolean(offlineValue?.enabled ?? offlineValue?.value ?? offlineValue?.active),
      );
      setReceiptRewardsConfig((receiptRewardsResp as any)?.value ?? null);
      setClaimShopRewardConfig((claimShopResp as any)?.value ?? null);
      setVerificationRewardConfig((verificationResp as any)?.value ?? null);
      setFeaturedListingConfig((featuredListingResp as any)?.value ?? null);
      setClearancePromoConfig((clearancePromoResp as any)?.value ?? null);
      setCategorySpotlightConfig((categorySpotlightResp as any)?.value ?? null);
      setFanOfferConfig((fanOfferResp as any)?.value ?? null);
      setCampaignDefaults((campaignDefaultsResp as any)?.value ?? null);
      setMarketingKpiDefaults((marketingKpiDefaultsResp as any)?.value ?? null);
      setGroupBuyDefaults((groupBuyDefaultsResp as any)?.value ?? null);
      setAnalyticsDefaults((analyticsDefaultsResp as any)?.value ?? null);
      setTopProductsDefaults((topProductsDefaultsResp as any)?.value ?? null);
      setBroadcastsDefaults((broadcastsDefaultsResp as any)?.value ?? null);
      setQuickBoostConfig((quickBoostResp as any)?.value ?? null);
      setOfflineUssdConfig((offlineUssdResp as any)?.value ?? null);
      setOfflineSmsConfig((offlineSmsResp as any)?.value ?? null);
      setOfflineVoiceConfig((offlineVoiceResp as any)?.value ?? null);
    } catch {
      setDataSharingRewards(null);
      setReferralRewards(null);
      setOfflineEnabled(false);
      setReceiptRewardsConfig(null);
      setClaimShopRewardConfig(null);
      setVerificationRewardConfig(null);
      setFeaturedListingConfig(null);
      setClearancePromoConfig(null);
      setCategorySpotlightConfig(null);
      setFanOfferConfig(null);
      setCampaignDefaults(null);
      setMarketingKpiDefaults(null);
      setGroupBuyDefaults(null);
      setAnalyticsDefaults(null);
      setTopProductsDefaults(null);
      setBroadcastsDefaults(null);
      setQuickBoostConfig(null);
      setOfflineUssdConfig(null);
      setOfflineSmsConfig(null);
      setOfflineVoiceConfig(null);
    }
  }, []);

  useEffect(() => {
    loadRewardConfigs();
  }, [loadRewardConfigs]);

  useEffect(() => {
    if (!analyticsDefaults || analyticsDefaultsApplied) return;
    const salesDays = Number(analyticsDefaults.sales_series_days);
    const velocityDays = Number(analyticsDefaults.sales_velocity_days);
    const peakDays = Number(analyticsDefaults.peak_hours_days);
    const inventoryDays = Number(analyticsDefaults.inventory_series_days);
    const conversionDays = Number(analyticsDefaults.conversion_series_days);
    if (Number.isFinite(salesDays) && salesDays > 0) setSalesSeriesDays(salesDays);
    if (Number.isFinite(velocityDays) && velocityDays > 0) setSalesVelocityDays(velocityDays);
    if (Number.isFinite(peakDays) && peakDays > 0) setPeakHoursDays(peakDays);
    if (Number.isFinite(inventoryDays) && inventoryDays > 0) setInventorySeriesDays(inventoryDays);
    if (Number.isFinite(conversionDays) && conversionDays > 0) setConversionSeriesDays(conversionDays);
    setAnalyticsDefaultsApplied(true);
  }, [analyticsDefaults, analyticsDefaultsApplied]);

  useEffect(() => {
    if (!campaignDefaults || campaignDefaultsApplied) return;
    setCampaignForm((prev) => {
      const next = { ...prev };
      if (!next.budget || next.budget === 0) {
        const budget = Number(campaignDefaults.budget ?? 0);
        if (budget > 0) next.budget = budget;
      }
      if (!next.durationDays || next.durationDays === 0) {
        const duration = Number(campaignDurationDays ?? 0);
        if (duration > 0) next.durationDays = duration;
      }
      if (campaignDefaults.objective && ['reach', 'sales', 'favorites'].includes(String(campaignDefaults.objective))) {
        next.objective = campaignDefaults.objective as 'reach' | 'sales' | 'favorites';
      }
      if (campaignDefaults.channel && ['search', 'feed', 'messages'].includes(String(campaignDefaults.channel))) {
        next.channel = campaignDefaults.channel as 'search' | 'feed' | 'messages';
      }
      return next;
    });
    setCampaignDefaultsApplied(true);
  }, [campaignDurationDays, campaignDefaults, campaignDefaultsApplied]);

  useEffect(() => {
    let ignore = false;
    const loadSubscriptions = async () => {
      try {
        const [plans, view] = await Promise.all([
          listPlans().catch(() => []),
          getSubscriptionView().catch(() => null)
        ]);
        if (ignore) return;
        setSubscriptionPlans(Array.isArray(plans) ? plans : []);
        setSubscriptionView(view as SubscriptionView | null);
      } catch {
        if (!ignore) {
          setSubscriptionPlans([]);
          setSubscriptionView(null);
        }
      }
    };
    loadSubscriptions();
    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    let ignore = false;
    const loadRank = async () => {
      try {
        const rank = await getSellerRank();
        if (!ignore) setSellerRankInfo(rank as any);
      } catch {
        if (!ignore) setSellerRankInfo(null);
      }
    };
    loadRank();
    return () => {
      ignore = true;
    };
  }, [seller.id]);

  useEffect(() => {
    if (!offlineEnabled && activeTab === 'offline') {
      setActiveTab('onboarding');
    }
  }, [offlineEnabled, activeTab]);

  const runAiInsight = React.useCallback(async (force = false) => {
    if (!seller?.id) return;
    if (!analyticsSummary && !analyticsMarket && !analyticsInventory && !growthCashflow && !growthLoan) return;
    if (aiInsightInFlightRef.current) return;
    const context = {
      revenue: analyticsSummary?.revenue,
      orders: analyticsSummary?.orders,
      margin: analyticsSummary?.margin,
      inventory_value: analyticsInventory?.inventory_value,
      low_stock: productLowStock.length,
      price_position: analyticsMarket?.price_position,
      market_share: analyticsMarket?.market_share,
      cashflow: growthCashflow?.summary || growthCashflow,
      loan_eligibility: growthLoan?.eligible
    };
    const contextKey = JSON.stringify(context);
    if (!force && aiInsightContextRef.current === contextKey && aiInsightMessage) return;
    aiInsightContextRef.current = contextKey;
    aiInsightInFlightRef.current = true;
    let active = true;
    setAiInsightLoading(true);
    setAiInsightError(null);
    try {
      let threadId = aiInsightThreadId;
      if (!threadId) {
        const thread = await createThread({ title: `Seller Dashboard Insights ${seller.id}` });
        threadId = thread?.id ?? null;
        if (active) setAiInsightThreadId(threadId);
      }
      if (!threadId) return;
      const prompt = `Provide 3 strategic insights for this seller dashboard. Prioritize actions that increase sales or reduce stock risk. Use tools if needed. Context: ${contextKey}`;
      const aiText = await streamThreadMessage(threadId, {
        content: prompt,
        metadata: { mode: 'seller_dashboard_insights', seller_id: seller.id }
      });
      if (!active) return;
      setAiInsightMessage(aiText?.trim() || '');
      const aiMessages = await listMessages(threadId);
      const lastAssistant = [...aiMessages].reverse().find((msg) => msg.role === 'assistant');
      if (lastAssistant?.metadata) {
        setAiInsightMeta(lastAssistant.metadata);
      }
    } catch (err: any) {
      if (active) setAiInsightError(err?.message || 'AI insights unavailable.');
    } finally {
      if (active) setAiInsightLoading(false);
      aiInsightInFlightRef.current = false;
    }
  }, [analyticsInventory, analyticsMarket, analyticsSummary, aiInsightMessage, aiInsightThreadId, growthCashflow, growthLoan, productLowStock.length, seller?.id]);

  useEffect(() => {
    runAiInsight(false);
  }, [runAiInsight]);

  const beginPathRecordingWatch = () => {
    if (!navigator.geolocation) {
      setPathRecordingStatus('Geolocation not supported.');
      return;
    }
    if (pathRecordingWatchIdRef.current) {
      navigator.geolocation.clearWatch(pathRecordingWatchIdRef.current);
    }
    const id = navigator.geolocation.watchPosition(
      (pos) => {
        const point = { lat: pos.coords.latitude, lng: pos.coords.longitude, recorded_at: new Date().toISOString() };
        setPathRecordingPoints((prev) => {
          if (prev.length > 0) {
            const last = prev[prev.length - 1];
            const segment = haversineDistance({ lat: last.lat, lng: last.lng }, { lat: point.lat, lng: point.lng });
            setPathRecordingDistance((dist) => dist + segment);
          }
          return [...prev, point];
        });
        if (pathRecorderMapRef.current) {
          pathRecorderMapRef.current.easeTo({ center: [point.lng, point.lat], duration: 500 });
        }
      },
      () => {
        setPathRecordingStatus('Unable to read GPS location.');
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }
    );
    pathRecordingWatchIdRef.current = id;
  };

  const startPathRecording = () => {
    setPathRecordingPoints([]);
    setPathRecordingDistance(0);
    setPathRecordingStart(Date.now());
    setPathRecordingActive(true);
    setPathRecordingPaused(false);
    setPathRecordingStatus(null);
    beginPathRecordingWatch();
  };

  const pausePathRecording = () => {
    if (pathRecordingWatchIdRef.current) {
      navigator.geolocation.clearWatch(pathRecordingWatchIdRef.current);
      pathRecordingWatchIdRef.current = null;
    }
    setPathRecordingPaused(true);
  };

  const resumePathRecording = () => {
    setPathRecordingPaused(false);
    beginPathRecordingWatch();
  };

  const stopPathRecording = () => {
    if (pathRecordingWatchIdRef.current) {
      navigator.geolocation.clearWatch(pathRecordingWatchIdRef.current);
      pathRecordingWatchIdRef.current = null;
    }
    setPathRecordingPaused(false);
    setPathRecordingActive(false);
  };

  const addLandmarkDraft = () => {
    const lastPoint = pathRecordingPoints[pathRecordingPoints.length - 1];
    setPathLandmarkDrafts(prev => ([
      ...prev,
      {
        label: '',
        type: 'landmark',
        lat: lastPoint?.lat,
        lng: lastPoint?.lng,
        sequence: prev.length + 1
      }
    ]));
  };

  const handleLandmarkFile = async (index: number, file?: File | null) => {
    if (!file) return;
    try {
      if (await shouldTrimVideo(file)) {
        queueVideoTrim(file, 'landmark', { landmarkIndex: index });
        return;
      }
      await uploadLandmarkMedia(file, index);
    } catch {
      setPathLandmarkDrafts(prev => prev.map((item, i) => i === index ? { ...item, uploading: false } : item));
    }
  };

  const savePathRecording = async () => {
    if (pathRecordingPoints.length < 2) {
      setPathRecordingStatus('Record at least two points.');
      return;
    }
    try {
      const saved = await recordPath({
        name: pathRecordingName || `${seller.name} path`,
        shared: pathRecordingShared,
        seller_id: seller.id,
        start_label: pathRecordingStartLabel,
        end_label: pathRecordingEndLabel,
        points: pathRecordingPoints
      });
      if (saved?.id) {
        precomputePathWaypoints(saved.id).catch(() => {});
        if (pathRecordingPrimary) {
          setPrimaryPath(saved.id, true).catch(() => {});
        }
        if (pathLandmarkDrafts.length > 0) {
          await Promise.all(
            pathLandmarkDrafts
              .filter((item) => item.label && item.imageUrl)
              .map((item, idx) =>
                addPathLandmark(saved.id, {
                  label: item.label,
                  type: item.type,
                  image_url: item.imageUrl!,
                  lat: item.lat,
                  lng: item.lng,
                  sequence: idx + 1
                })
              )
          );
        }
        listSellerPaths(seller.id, true)
          .then((items) => setSellerPaths(items))
          .catch(() => {});
        recordSellerOnboardingEvent({ step: 'shop_path', status: 'completed' }).catch(() => {});
      }
      setPathRecordingStatus('Path saved.');
      setPathRecordingName('');
      setPathRecordingShared(true);
      setPathRecordingPrimary(true);
      setPathRecordingStartLabel('');
      setPathRecordingEndLabel('');
      setPathLandmarkDrafts([]);
      setPathRecordingPoints([]);
      setPathRecordingDistance(0);
      setPathRecordingStart(null);
      setPathRecordingActive(false);
      setShowPathRecorder(false);
    } catch (err: any) {
      setPathRecordingStatus(err?.message || 'Unable to save path.');
    }
  };

  useEffect(() => {
    if (!showPathRecorder) return;
    let ignore = false;
    setSellerPathsStatus(null);
    listSellerPaths(seller.id, true)
      .then((items) => {
        if (!ignore) setSellerPaths(items);
      })
      .catch((err: any) => {
        if (!ignore) setSellerPathsStatus(err?.message || 'Unable to load paths.');
      });
    return () => {
      ignore = true;
    };
  }, [seller.id, showPathRecorder]);

  const handleSetPrimaryPath = async (pathId: string) => {
    setSellerPathsStatus(null);
    try {
      await setPrimaryPath(pathId, true);
      const items = await listSellerPaths(seller.id, true);
      setSellerPaths(items);
    } catch (err: any) {
      setSellerPathsStatus(err?.message || 'Unable to set primary path.');
    }
  };

  const handleViewPathWaypoints = async (pathId: string) => {
    setSellerPathsStatus(null);
    setSelectedPathLoading(true);
    setSelectedPathId(pathId);
    try {
      const items = await listPathWaypoints(pathId);
      setSelectedPathWaypoints(items);
    } catch (err: any) {
      setSellerPathsStatus(err?.message || 'Unable to load waypoints.');
    } finally {
      setSelectedPathLoading(false);
    }
  };

  const handleDeletePath = async (pathId: string) => {
    setSellerPathsStatus(null);
    try {
      await deletePath(pathId);
      const items = await listSellerPaths(seller.id, true);
      setSellerPaths(items);
      if (selectedPathId === pathId) {
        setSelectedPathId(null);
        setSelectedPathWaypoints([]);
      }
      setSellerPathsStatus('Path deleted.');
    } catch (err: any) {
      setSellerPathsStatus(err?.message || 'Unable to delete path.');
    }
  };

  useEffect(() => {
    if (activeTab !== 'analytics' && activeTab !== 'marketing') return;
    let cancelled = false;
    let ws: WebSocket | null = null;

    const loadOnce = async () => {
      try {
        const [summary, funnel, inventory, buyers, market, anomalies, channelMix, demographics, marketDemand, marketTrending, trendingSuppliers, liveBuyers, peakHours, salesSeries, inventorySeries, conversionSeries, dataQuality, topProducts, stockRecommendations, performanceV2, productPerformanceV2, pricingV2, categoryHealthV2, demandStockV2, actionsV2] = await Promise.all([
          getSellerKpiSummary(),
          getSellerFunnel(),
          getSellerInventoryInsight(),
          getSellerBuyerInsight(),
          getSellerMarketBenchmarks(),
          listSellerAnomalies(),
          getSellerChannelMix(),
          getSellerCustomerDemographics(),
          getSellerMarketDemand(),
          getSellerMarketTrending(),
          getSellerTrendingSuppliers(),
          getSellerLiveBuyers(),
          getSellerPeakHours(backendSeriesDays(peakHoursDays)),
          getSellerSalesSeries(backendSeriesDays(salesSeriesDays)),
          getSellerInventorySeries(backendSeriesDays(inventorySeriesDays)),
          getSellerConversionSeries(backendSeriesDays(conversionSeriesDays)),
          getSellerDataQuality(),
          getSellerTopProducts(
            backendSeriesDays(topProductsDays),
            Number.isFinite(topProductsLimit) ? topProductsLimit : undefined
          ),
          listSellerRecommendations('stock'),
          getSellerPerformanceAnalysis(backendSeriesDays(salesSeriesDays)),
          getSellerProductPerformance(30, 20),
          getSellerPricingCompetitiveAnalysis(30, 30),
          getSellerCategoryHealthAnalysis(30),
          getSellerDemandStockAnalysis(),
          getSellerActionRecommendations()
        ]);
        if (cancelled) return;
        setAnalyticsSummary(summary);
        setAnalyticsFunnel(funnel);
        setAnalyticsInventory(inventory);
        setAnalyticsBuyers(buyers);
        setAnalyticsMarket(market);
        setAnalyticsAnomalies(anomalies);
        setAnalyticsChannelMix(channelMix);
        setAnalyticsDemographicsData(demographics);
        setAnalyticsMarketDemand(marketDemand);
        setAnalyticsMarketTrending(marketTrending);
        setAnalyticsTrendingSuppliers(trendingSuppliers);
        setAnalyticsLiveBuyers(liveBuyers);
        setAnalyticsPeakHoursData(peakHours);
        setAnalyticsSalesSeries(salesSeries);
        setAnalyticsInventorySeries(inventorySeries);
        setAnalyticsConversionSeries(conversionSeries);
        setAnalyticsDataQuality(dataQuality);
        setAnalyticsTopProducts(topProducts);
        setSellerRecommendations(stockRecommendations);
        setAnalyticsPerformanceV2(performanceV2);
        setAnalyticsProductPerformanceV2(productPerformanceV2);
        setAnalyticsPricingV2(pricingV2);
        setAnalyticsCategoryHealthV2(categoryHealthV2);
        setAnalyticsDemandStockV2(demandStockV2);
        setAnalyticsActionsV2(actionsV2);
      } catch (err: any) {
        if (!cancelled) setAnalyticsStatus(err?.message || 'Unable to load analytics.');
      }
    };

    const connect = () => {
      setAnalyticsStatus(null);
      ws = new WebSocket(buildWsUrl('/v1/analytics/ws'));
      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload?.type !== 'analytics:update') return;
          const data = payload?.data || {};
          setAnalyticsSummary(data.dashboard ?? null);
          setAnalyticsFunnel(data.funnel ?? null);
          setAnalyticsInventory(data.inventory ?? null);
          setAnalyticsBuyers(data.buyers ?? null);
          setAnalyticsMarket(data.market ?? null);
          setAnalyticsAnomalies(Array.isArray(data.anomalies) ? data.anomalies : []);
          if (Array.isArray(data.channel_mix)) {
            setAnalyticsChannelMix(data.channel_mix);
          }
          if (Array.isArray(data.demographics)) {
            setAnalyticsDemographicsData(data.demographics);
          }
          if (Array.isArray(data.market_demand)) {
            setAnalyticsMarketDemand(data.market_demand);
          }
          if (Array.isArray(data.market_trending)) {
            setAnalyticsMarketTrending(data.market_trending);
          }
          if (Array.isArray(data.trending_suppliers)) {
            setAnalyticsTrendingSuppliers(data.trending_suppliers);
          }
        } catch {
          // Ignore parse errors.
        }
      };
      ws.onerror = () => {
        if (cancelled) return;
        setAnalyticsStatus('Live analytics connection failed. Showing last known data.');
        loadOnce();
      };
      ws.onclose = () => {
        if (cancelled) return;
        setAnalyticsStatus('Live analytics disconnected.');
      };
    };

    loadOnce();
    connect();

    return () => {
      cancelled = true;
      if (ws) ws.close();
    };
  }, [
    activeTab,
    analyticsConversionDays,
    analyticsInventoryDays,
    analyticsPeakHoursDays,
    analyticsSalesDays,
    topProductsDays,
    topProductsLimit
  ]);

  // Series day ranges are backend-configured.

  useEffect(() => {
    let cancelled = false;
    if (activeTab !== 'analytics') return () => {};
    setSalesSeriesLoading(true);
    getSellerSalesSeries(backendSeriesDays(salesSeriesDays ?? analyticsSalesDays))
      .then((items) => {
        if (!cancelled) setAnalyticsSalesSeries(items);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setSalesSeriesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activeTab, salesSeriesDays, analyticsSalesDays]);

  useEffect(() => {
    let cancelled = false;
    if (activeTab !== 'analytics') return () => {};
    setSalesVelocityLoading(true);
    getSellerSalesVelocity(backendSeriesDays(salesVelocityDays ?? analyticsVelocityDays))
      .then((items) => {
        if (!cancelled) setAnalyticsSalesVelocitySeries(items);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setSalesVelocityLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activeTab, salesVelocityDays, analyticsVelocityDays]);

  useEffect(() => {
    let cancelled = false;
    if (activeTab !== 'analytics') return () => {};
    setPeakHoursLoading(true);
    getSellerPeakHours(backendSeriesDays(peakHoursDays ?? analyticsPeakHoursDays))
      .then((items) => {
        if (!cancelled) setAnalyticsPeakHoursData(items);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setPeakHoursLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activeTab, peakHoursDays, analyticsPeakHoursDays]);

  useEffect(() => {
    let cancelled = false;
    if (activeTab !== 'analytics') return () => {};
    setInventorySeriesLoading(true);
    getSellerInventorySeries(backendSeriesDays(inventorySeriesDays ?? analyticsInventoryDays))
      .then((items) => {
        if (!cancelled) setAnalyticsInventorySeries(items);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setInventorySeriesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activeTab, inventorySeriesDays, analyticsInventoryDays]);

  // Series day ranges are backend-configured.

  useEffect(() => {
    let cancelled = false;
    if (activeTab !== 'analytics') return () => {};
    setConversionSeriesLoading(true);
    getSellerConversionSeries(backendSeriesDays(conversionSeriesDays ?? analyticsConversionDays))
      .then((items) => {
        if (!cancelled) setAnalyticsConversionSeries(items);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setConversionSeriesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activeTab, conversionSeriesDays, analyticsConversionDays]);

  // Series day ranges are backend-configured.

  useEffect(() => {
    let cancelled = false;
    setSellerAlertsStatus(null);
    getSellerAlerts()
      .then((items) => {
        if (cancelled) return;
        setSellerAlerts(items);
        setSellerAlertsDraft(items);
      })
      .catch((err: any) => {
        if (!cancelled) setSellerAlertsStatus(err?.message || 'Unable to load alert preferences.');
      });
    return () => {
      cancelled = true;
    };
  }, [seller.id]);

  const handleToggleSellerAlert = (type: string) => {
    setSellerAlertsDraft((prev) =>
      prev.map((item) => (item.type === type ? { ...item, active: !item.active } : item)),
    );
  };

  const handleSellerAlertThreshold = (type: string, value: number) => {
    setSellerAlertsDraft((prev) =>
      prev.map((item) => (item.type === type ? { ...item, threshold: value } : item)),
    );
  };

  const handleSaveSellerAlerts = async () => {
    setSellerAlertsSaving(true);
    setSellerAlertsStatus(null);
    try {
      const updated = await updateSellerAlerts(
        sellerAlertsDraft.map((item) => ({
          type: item.type,
          threshold: Number(item.threshold ?? 0),
          active: Boolean(item.active),
        })),
      );
      setSellerAlerts(updated);
      setSellerAlertsDraft(updated);
      setSellerAlertsStatus('Alert preferences saved.');
    } catch (err: any) {
      setSellerAlertsStatus(err?.message || 'Unable to save alert preferences.');
    } finally {
      setSellerAlertsSaving(false);
    }
  };

  useEffect(() => {
    if (activeTab !== 'suppliers' && activeTab !== 'analytics') return;
    let cancelled = false;
    let ws: WebSocket | null = null;

    const connect = () => {
      ws = new WebSocket(buildWsUrl('/v1/rfq/ws'));
      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload?.type !== 'rfq:update') return;
          const data = payload?.data || {};
          const threads = Array.isArray(data.threads) ? data.threads : [];
          const responses = data.responses && typeof data.responses === 'object' ? data.responses : {};
          const comparisons = data.comparisons && typeof data.comparisons === 'object' ? data.comparisons : {};
          if (threads.length) {
            setRfqThreadsRemote(threads);
          }
          setRfqResponsesById(responses);
          setRfqComparisonById(comparisons);
          setRfqLastUpdated(new Date());
        } catch {
          // Ignore parse errors.
        }
      };
      ws.onerror = () => {
        if (cancelled) return;
        const threads = rfqThreadsRef.current;
        if (threads.length) {
          buildRfqUpdates(threads)
            .then(({ responsesById, comparisonsById }) => {
              if (cancelled) return;
              setRfqResponsesById(responsesById);
              setRfqComparisonById(comparisonsById);
              setRfqLastUpdated(new Date());
            })
            .catch(() => {});
        }
      };
    };

    connect();
    return () => {
      cancelled = true;
      if (ws) ws.close();
    };
  }, [activeTab, campaignDefaults?.duration_days]);

  useEffect(() => {
    if (activeTab !== 'marketing') return;
    let ignore = false;
    let ws: WebSocket | null = null;

    const normalizeCampaigns = (items: ApiCampaign[]) =>
      items.map((c: ApiCampaign) => {
        const targeting = (c.targeting_rules || {}) as Record<string, any>;
        const durationDays = Number(targeting.duration_days ?? campaignDefaults?.duration_days ?? 7);
        return {
          id: c.id,
          name: c.name || 'Campaign',
          objective: (c.objective as 'reach' | 'sales' | 'favorites') || 'sales',
          budget: Number(c.budget_total || 0),
          durationDays: Number.isFinite(durationDays) ? durationDays : 7,
          productId: c.product_id || '',
          channel: (c.channel as 'search' | 'feed' | 'messages') || 'search',
          status: (c.status as 'scheduled' | 'active' | 'completed' | 'paused' | 'draft') || 'draft',
        };
      });

    const loadMarketing = async () => {
      setCampaignStatus(null);
      setMarketingStatus(null);
      setCampaignLoading(true);
      try {
        const [items, kpis, hotspots, stockAlerts, fanOffers, spotlights] = await Promise.all([
          listSellerCampaigns(),
          getMarketingKPIs(marketingKpiRange),
          listHotspots(),
          listStockAlerts(),
          listFanOffers(),
          listCategorySpotlights()
        ]);
        if (ignore) return;
        setCampaigns(normalizeCampaigns(items));
        setMarketingKpis(kpis);
        setMarketingHotspots(hotspots);
        setMarketingStockAlerts(stockAlerts);
        setMarketingFanOffers(fanOffers);
        setMarketingCategorySpotlights(spotlights);
      } catch (err: any) {
        if (!ignore) setMarketingStatus(err?.message || 'Unable to load marketing data.');
      } finally {
        if (!ignore) setCampaignLoading(false);
      }
    };

    const connect = () => {
      ws = new WebSocket(buildWsUrl('/v1/marketing/ws'));
      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload?.type !== 'marketing:update') return;
          const data = payload?.data || {};
          setCampaigns(normalizeCampaigns(Array.isArray(data.campaigns) ? data.campaigns : []));
          setMarketingKpis(data.kpis ?? null);
          setMarketingHotspots(Array.isArray(data.hotspots) ? data.hotspots : []);
          setMarketingStockAlerts(Array.isArray(data.stock_alerts) ? data.stock_alerts : []);
          setMarketingFanOffers(Array.isArray(data.fan_offers) ? data.fan_offers : []);
          setMarketingCategorySpotlights(Array.isArray(data.category_spotlight) ? data.category_spotlight : []);
          setCampaignLoading(false);
        } catch {
          // ignore parse errors
        }
      };
      ws.onerror = () => {
        if (ignore) return;
        setMarketingStatus('Live marketing connection failed. Showing last known data.');
        loadMarketing();
      };
      ws.onclose = () => {
        if (ignore) return;
        setMarketingStatus('Live marketing disconnected.');
      };
    };

    loadMarketing();
    connect();

    return () => {
      ignore = true;
      if (ws) ws.close();
    };
  }, [activeTab, marketingKpiRange]);

  useEffect(() => {
    if (activeTab !== 'onboarding') return;
    let ignore = false;
    const loadOnboarding = async () => {
      setOnboardingStatus(null);
      try {
        const [state, eligibility, tutorials, verification, profile] = await Promise.all([
          getSellerOnboardingState(),
          getSellerOnboardingEligibility(),
          listSellerTutorials(),
          getSellerVerificationStatus(),
          getSellerProfile()
        ]);
        if (ignore) return;
        setOnboardingState(state);
        setOnboardingEligible(eligibility?.eligible ?? null);
        setOnboardingTutorials(tutorials);
        setVerificationStatus(verification);
        if (!sellerDefaultTabResolvedRef.current) {
          sellerDefaultTabResolvedRef.current = true;
          if (!initialSellerTabRef.current && (state?.completion ?? 0) >= 0.9) {
            sellerTabSuppressPushRef.current = true;
            setActiveTab('products');
          }
        }
        if (state?.shop_type) {
          setShopType(state.shop_type);
          setShopTypeSelections([state.shop_type]);
        }
        if (state?.seller_mode) {
          setSellerMode(state.seller_mode);
          setSellerModeSelections([state.seller_mode]);
        }
        if (typeof state?.delivery_radius_km === 'number') {
          setDeliveryRadiusKm(state.delivery_radius_km || '');
        }
        if (state?.whatsapp_number) setWhatsappNumber(state.whatsapp_number);
        if (profile?.seller_mode) {
          setSellerMode(profile.seller_mode);
          setSellerModeSelections([profile.seller_mode]);
        }
        if (profile?.service_area && typeof profile.service_area === 'object') {
          const serviceArea = profile.service_area as Record<string, any>;
          setSellerServiceArea(serviceArea);
          const loadedShopTypes = uniqueStrings(serviceArea.shop_types);
          const loadedSellerModes = uniqueStrings(serviceArea.selling_modes);
          const loadedReachChannels = uniqueStrings(serviceArea.reach_channels);
          if (loadedShopTypes.length) {
            setShopTypeSelections(loadedShopTypes);
            setShopType(loadedShopTypes[0]);
          }
          if (loadedSellerModes.length) {
            setSellerModeSelections(loadedSellerModes);
            setSellerMode(loadedSellerModes[0]);
          }
          if (loadedReachChannels.length) {
            setBuyerReachSelections(loadedReachChannels);
            setBuyerReach(loadedReachChannels[0] as typeof buyerReach);
          }
          if (typeof serviceArea.daily_place_name === 'string') {
            setDailyPlaceName(serviceArea.daily_place_name);
          }
        } else {
          setSellerServiceArea({});
        }
        if (profile?.market_name) setMarketName(profile.market_name);
        if (profile?.visual_marker) setVisualMarker(profile.visual_marker);
        if (profile?.whatsapp_number) setWhatsappNumber(profile.whatsapp_number);
        if (typeof profile?.delivery_radius_km === 'number') {
          setDeliveryRadiusKm(profile.delivery_radius_km || '');
        }
        if (typeof profile?.daily_lat === 'number') setDailyLat(profile.daily_lat);
        if (typeof profile?.daily_lng === 'number') setDailyLng(profile.daily_lng);
        if (profile?.delivery_details) {
          setDeliveryDetails(profile.delivery_details);
          if (Array.isArray(profile.delivery_details.delivery_zones)) {
            setDeliveryZonesInput(profile.delivery_details.delivery_zones.join(', '));
          }
          if (Array.isArray(profile.delivery_details.payment_options)) {
            setPaymentOptionsInput(profile.delivery_details.payment_options.join(', '));
          }
          if (typeof profile.delivery_details.installation_services === 'string') {
            setInstallationServicesInput(profile.delivery_details.installation_services);
          }
          if (typeof profile.delivery_details.after_sales_support === 'string') {
            setAfterSalesSupportInput(profile.delivery_details.after_sales_support);
          }
          if (typeof profile.delivery_details.delivery_radius_km === 'number') {
            setDeliveryRadiusKm(profile.delivery_details.delivery_radius_km || '');
          }
        }
        const effectiveMode = profile?.seller_mode || state?.seller_mode || sellerMode;
        if (effectiveMode && effectiveMode !== 'hybrid' && !uniqueStrings((profile?.service_area as any)?.reach_channels).length) {
          if (effectiveMode === 'fixed_shop') {
            setBuyerReach('fixed_address');
            setBuyerReachSelections(['fixed_address']);
          }
          if (effectiveMode === 'open_market_stall' || effectiveMode === 'ground_trader') {
            setBuyerReach('market_stall');
            setBuyerReachSelections(['market_stall']);
          }
          if (effectiveMode === 'solopreneur') {
            setBuyerReach('delivery_only');
            setBuyerReachSelections(['delivery_only']);
          }
        }
        if (state?.connection?.id) {
          setOnlineConnectionId(state.connection.id);
          if (state.connection.connection_status) {
            setOnlineConnectionStatus(`Status: ${state.connection.connection_status}`);
          }
          setOnlineConnectForm(prev => ({
            ...prev,
            platform: state.connection?.platform || prev.platform,
            api_base_url: state.connection?.api_base_url || prev.api_base_url,
            shop_domain: state.connection?.shop_domain || prev.shop_domain,
            products_endpoint: state.connection?.products_endpoint || prev.products_endpoint,
            orders_endpoint: state.connection?.orders_endpoint || prev.orders_endpoint,
            demand_endpoint: state.connection?.demand_endpoint || prev.demand_endpoint,
            csv_import_url: state.connection?.csv_import_url || prev.csv_import_url,
            webhook_url: state.connection?.webhook_url || prev.webhook_url,
            scopes: state.connection?.scopes || prev.scopes
          }));
          void loadMappingSuggestions(state.connection.id);
        }
      } catch (err: any) {
        if (!ignore) setOnboardingStatus(err?.message || 'Unable to load onboarding status.');
      }
    };
    loadOnboarding();
    return () => {
      ignore = true;
    };
  }, [activeTab]);

  useEffect(() => {
    if (activeTab !== 'onboarding') return;
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const shop = params.get('shop');
    if (code) {
      setOnlineConnectForm(prev => ({
        ...prev,
        platform: 'shopify',
        auth_code: code,
        shop_domain: shop || prev.shop_domain
      }));
    }
  }, [activeTab]);

  const onlinePlatform = onlineConnectForm.platform;
  const suggestedMappingSuggestions = mappingSuggestions.filter((item) => item.status === 'suggested');
  const reviewMappingSuggestions = mappingSuggestions.filter((item) => item.status === 'needs_review');
  const mappedMappingSuggestions = mappingSuggestions.filter((item) => item.status === 'mapped');

  useEffect(() => {
    setOnlineAuthUrl(null);
    setOnlineConnectForm(prev => {
      const next = { ...prev };
      if ((onlinePlatform === 'custom' || onlinePlatform === 'marketplace') && !next.products_endpoint) {
        next.products_endpoint = '/api/products';
      }
      if ((onlinePlatform === 'custom' || onlinePlatform === 'marketplace') && !next.orders_endpoint) {
        next.orders_endpoint = '/api/orders';
      }
      if (onlinePlatform === 'opencart' && !next.products_endpoint) {
        next.products_endpoint = '/api/products';
      }
      if (onlinePlatform === 'opencart' && !next.orders_endpoint) {
        next.orders_endpoint = '/api/orders';
      }
      return next;
    });
  }, [onlinePlatform]);

  useEffect(() => {
    rfqThreadsRef.current = rfqThreadsRemote;
  }, [rfqThreadsRemote]);

  useEffect(() => {
    if (activeTab !== 'settings') return;
    let ignore = false;
    const loadSettings = async () => {
      setSettingsStatus(null);
      setProfileLoading(true);
      setReviewsLoading(true);
      try {
        const [profile, locations, history, verification, prefs] = await Promise.all([
          getSellerProfile(),
          listSellerLocations(),
          listSellerLocationHistory().catch(() => []),
          getSellerVerificationStatus(),
          getSellerPreferences().catch(() => null)
        ]);
        if (ignore) return;
        setSellerLocations(locations);
        setSellerLocationHistory(Array.isArray(history) ? history : []);
        if (profile?.name || profile?.description) {
          setProfileData(prev => ({
            ...prev,
            name: profile.name || prev.name,
            description: profile.description || prev.description
          }));
        }
        if (locations[0]?.address) {
          setProfileData(prev => ({ ...prev, address: locations[0]?.address || prev.address }));
        }
        if (profile?.name || profile?.description || profile?.logo_url) {
          setSeller(prev => ({
            ...prev,
            name: profile?.name || prev.name,
            description: profile?.description || prev.description,
            avatar: profile?.logo_url || prev.avatar
          }));
        }
        if (typeof profile?.shop_front_image_url === 'string') {
          setShopFrontImageUrl(profile.shop_front_image_url);
        }
        if (typeof profile?.directions_note === 'string') {
          setDirectionsNote(profile.directions_note);
        }
        if (Array.isArray(profile?.landmarks)) {
          setShopLandmarks(profile.landmarks);
        }
        if (verification) {
          setVerificationStatus(verification);
          if (verification?.verified || verification?.status === 'verified') {
            onVerifiedSellerIdsChange(Array.from(new Set([...verifiedSellerIds, seller.id])));
          }
        }
        if (prefs) {
          setSellerPreferences(prefs);
          if (prefs.analytics) {
            const salesDays = Number(prefs.analytics.sales_series_days);
            const velocityDays = Number(prefs.analytics.sales_velocity_days);
            const peakDays = Number(prefs.analytics.peak_hours_days);
            const inventoryDays = Number(prefs.analytics.inventory_series_days);
            const conversionDays = Number(prefs.analytics.conversion_series_days);
            if (Number.isFinite(salesDays) && salesDays > 0) setSalesSeriesDays(salesDays);
            if (Number.isFinite(velocityDays) && velocityDays > 0) setSalesVelocityDays(velocityDays);
            if (Number.isFinite(peakDays) && peakDays > 0) setPeakHoursDays(peakDays);
            if (Number.isFinite(inventoryDays) && inventoryDays > 0) setInventorySeriesDays(inventoryDays);
            if (Number.isFinite(conversionDays) && conversionDays > 0) setConversionSeriesDays(conversionDays);
          }
          setSellerPreferencesDraft(prev => ({
            marketing: {
              ...prev.marketing,
              ...(prefs.marketing ?? {}),
              kpi_range: String(prefs.marketing?.kpi_range ?? prev.marketing.kpi_range ?? '30d'),
              campaign_duration_days: Number(prefs.marketing?.campaign_duration_days ?? prev.marketing.campaign_duration_days ?? 7),
              top_products_days: Number(prefs.marketing?.top_products_days ?? prev.marketing.top_products_days ?? 30),
              top_products_limit: Number(prefs.marketing?.top_products_limit ?? prev.marketing.top_products_limit ?? 5),
              broadcast_limit: Number(prefs.marketing?.broadcast_limit ?? prev.marketing.broadcast_limit ?? 50),
              quick_boost_budget: Number(prefs.marketing?.quick_boost_budget ?? prev.marketing.quick_boost_budget ?? 500)
            },
            growth: {
              ...prev.growth,
              ...(prefs.growth ?? {}),
              projection_type: String(prefs.growth?.projection_type ?? prev.growth.projection_type ?? 'cashflow'),
              loan_request_ratio: Number(prefs.growth?.loan_request_ratio ?? prev.growth.loan_request_ratio ?? 0.5)
            },
            comms: {
              ...prev.comms,
              ...(prefs.comms ?? {}),
              broadcast_limit: Number(prefs.comms?.broadcast_limit ?? prev.comms.broadcast_limit ?? 50)
            },
            analytics: {
              ...prev.analytics,
              ...(prefs.analytics ?? {}),
              sales_series_days: Number(prefs.analytics?.sales_series_days ?? prev.analytics.sales_series_days ?? 7),
              sales_velocity_days: Number(prefs.analytics?.sales_velocity_days ?? prev.analytics.sales_velocity_days ?? 7),
              peak_hours_days: Number(prefs.analytics?.peak_hours_days ?? prev.analytics.peak_hours_days ?? 7),
              inventory_series_days: Number(prefs.analytics?.inventory_series_days ?? prev.analytics.inventory_series_days ?? 14),
              conversion_series_days: Number(prefs.analytics?.conversion_series_days ?? prev.analytics.conversion_series_days ?? 14)
            },
            procurement: {
              ...prev.procurement,
              ...(prefs.procurement ?? {}),
              max_distance_km: Number(prefs.procurement?.max_distance_km ?? prev.procurement.max_distance_km ?? 50),
              max_unit_cost: Number(prefs.procurement?.max_unit_cost ?? prev.procurement.max_unit_cost ?? 500),
              max_moq: Number(prefs.procurement?.max_moq ?? prev.procurement.max_moq ?? 50),
              max_lead_time_days: Number(prefs.procurement?.max_lead_time_days ?? prev.procurement.max_lead_time_days ?? 14),
              min_rating: Number(prefs.procurement?.min_rating ?? prev.procurement.min_rating ?? 0),
              verified_only: Boolean(prefs.procurement?.verified_only ?? prev.procurement.verified_only ?? false)
            }
          }));
        }
      } catch (err: any) {
        if (!ignore) setSettingsStatus(err?.message || 'Unable to load profile.');
      } finally {
        if (!ignore) setProfileLoading(false);
      }
      try {
        const prefs = await getSellerNotificationPreferences();
        if (!ignore) {
          setNotificationPrefs({
            price_drops: prefs?.price_drops ?? true,
            back_in_stock: prefs?.back_in_stock ?? true,
            trending: prefs?.trending ?? true,
            marketing: prefs?.marketing ?? true,
            rewards: prefs?.rewards ?? true,
            support: prefs?.support ?? true,
            system: prefs?.system ?? true,
            watched_items: prefs?.watched_items ?? true,
            location_based: prefs?.location_based ?? true,
            frequency: prefs?.frequency ?? 'instant',
            quiet_hours_start: prefs?.quiet_hours_start ?? '',
            quiet_hours_end: prefs?.quiet_hours_end ?? ''
          });
        }
      } catch {}
      try {
        const shopReviewItems = await listShopReviews(seller.id);
        if (!ignore) {
          const mappedShop = (shopReviewItems as ShopReview[]).map((review) => ({
            id: review.id,
            userName: review.user_name || 'Customer',
            rating: review.rating || 0,
            comment: review.comment || '',
            timestamp: review.created_at ? new Date(review.created_at).getTime() : Date.now(),
            replies: (review.replies || []).map(reply => ({
              id: reply.id,
              sellerName: reply.seller_name || seller.name,
              comment: reply.comment || '',
              timestamp: reply.created_at ? new Date(reply.created_at).getTime() : Date.now()
            }))
          }));
          setShopReviews(mappedShop);
        }
        const productReviewItems = await Promise.all(
          myProducts
            .map(p => p.productId)
            .filter(Boolean)
            .map(async (productId) => {
              const reviews = await listProductReviews(productId as string);
              return (reviews as ProductReview[]).map(r => ({
                id: r.id,
                userName: r.user_name || 'Customer',
                rating: r.rating || 0,
                comment: r.comment || '',
                timestamp: r.created_at ? new Date(r.created_at).getTime() : Date.now(),
                productId,
                productName: myProducts.find(p => p.productId === productId)?.name,
                replies: (r.replies || []).map(reply => ({
                  id: reply.id,
                  sellerName: reply.seller_name || seller.name,
                  comment: reply.comment || '',
                  timestamp: reply.created_at ? new Date(reply.created_at).getTime() : Date.now()
                }))
              }));
            })
        );
        if (!ignore) {
          const flattened = productReviewItems.flat();
          flattened.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
          setSellerReviews(flattened.slice(0, 20));
        }
      } catch (err: any) {
        if (!ignore) setSettingsStatus(err?.message || 'Unable to load reviews.');
      } finally {
        if (!ignore) setReviewsLoading(false);
      }
    };
    loadSettings();
    return () => {
      ignore = true;
    };
  }, [activeTab, seller.id, myProducts]);

  useEffect(() => {
    if (activeTab !== 'suppliers') return;
    let ignore = false;
    const loadSuppliers = async () => {
      setSuppliersStatus(null);
      setRfqStatus(null);
      setSuppliersLoading(true);
      setRfqLoading(true);
      let suppliersList: Supplier[] = [];
    let rfqList: RFQThread[] = [];
    try {
      suppliersList = await listSuppliers();
      if (ignore) return;
      setSuppliersData(suppliersList);
    } catch (err: any) {
      if (!ignore) setSuppliersStatus(err?.message || 'Unable to load suppliers.');
    }
    if (activeTab === 'suppliers') {
      try {
        rfqList = await listRFQs();
        if (ignore) return;
        setRfqThreadsRemote(rfqList);
      } catch (err: any) {
        if (!ignore) setRfqStatus(err?.message || 'Unable to load RFQs.');
      }
    }
      if (suppliersList.length) {
        const offerEntries = await Promise.all(
          suppliersList.map(async (supplier) => {
            if (!supplier.id) return null;
            try {
              const offers = await getSupplierOffers(supplier.id);
              return [supplier.id, (offers || []) as SupplierOffer[]] as const;
            } catch {
              return [supplier.id, [] as SupplierOffer[]] as const;
            }
          })
        );
        if (!ignore) {
          const offersById = offerEntries.reduce<Record<string, SupplierOffer[]>>((acc, entry) => {
            if (entry) acc[entry[0]] = entry[1];
            return acc;
          }, {});
          setSupplierOffersById(offersById);
        }
        const deliveryEntries = await Promise.all(
          suppliersList.map(async (supplier) => {
            if (!supplier.id) return null;
            try {
              const delivery = await getSupplierDelivery(supplier.id);
              return [supplier.id, delivery] as const;
            } catch {
              return null;
            }
          })
        );
        if (!ignore) {
          const deliveryById = deliveryEntries.reduce<Record<string, SupplierDelivery>>((acc, entry) => {
            if (entry) acc[entry[0]] = entry[1];
            return acc;
          }, {});
          setSupplierDeliveryById(deliveryById);
        }
      }
      if (rfqList.length) {
        const { responsesById, comparisonsById } = await buildRfqUpdates(rfqList);
        if (!ignore) {
          setRfqResponsesById(responsesById);
          setRfqComparisonById(comparisonsById);
          setRfqLastUpdated(new Date());
        }
      }
      if (!ignore) {
        setSuppliersLoading(false);
        setRfqLoading(false);
      }
    };
    loadSuppliers();
    return () => {
      ignore = true;
    };
  }, [activeTab]);

  useEffect(() => {
    if (activeTab !== 'comms') return;
    let ignore = false;
    const loadBroadcasts = async () => {
      setCommsStatus(null);
      try {
        const limit = Number.isFinite(broadcastsLimit) && broadcastsLimit > 0 ? broadcastsLimit : 50;
        const items = await listBroadcasts(limit);
        if (!ignore) {
          setBroadcasts(items);
          setBroadcastCount(items.length);
        }
      } catch (err: any) {
        if (!ignore) setCommsStatus(err?.message || 'Unable to load broadcasts.');
      }
    };
    loadBroadcasts();
    return () => {
      ignore = true;
    };
  }, [activeTab, broadcastsLimit]);

  useEffect(() => {
    if (activeTab !== 'growth') return;
    let ignore = false;
    let ws: WebSocket | null = null;

    const loadGrowth = async () => {
      setGrowthStatus(null);
      try {
        const [overview, cashflow, health, loan, projection, referrals, groups, referralCodes] = await Promise.all([
          getGrowthOverview(),
          getCashflow(),
          getFinancialHealth(),
          getLoanEligibility(),
          getFinancialProjections(growthProjectionType),
          getGrowthReferrals(),
          listBulkBuyGroups(),
          listSellerReferrals().catch(() => [])
        ]);
        if (ignore) return;
        setGrowthOverview(overview);
        setGrowthCashflow(cashflow);
        setGrowthHealth(health);
        setGrowthLoan(loan);
        setGrowthProjection(projection);
        setGrowthReferrals(referrals);
        setBulkGroups(groups);
        setSellerReferralCodes(Array.isArray(referralCodes) ? referralCodes : []);
      } catch (err: any) {
        if (!ignore) setGrowthStatus(err?.message || 'Unable to load growth data.');
      }
    };

    const connect = () => {
      ws = new WebSocket(buildWsUrl('/v1/growth/ws'));
      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload?.type !== 'growth:update') return;
          const data = payload?.data || {};
          setGrowthOverview(data.overview ?? null);
          setGrowthCashflow(data.cashflow ?? null);
          setGrowthHealth(data.health ?? null);
          setGrowthLoan(data.loan ?? null);
          setGrowthProjection(data.projection ?? null);
          setGrowthReferrals(data.referrals ?? null);
          setBulkGroups(Array.isArray(data.groups) ? data.groups : []);
          if (Array.isArray(data.referral_codes)) {
            setSellerReferralCodes(data.referral_codes);
          }
        } catch {
          // ignore parse errors
        }
      };
      ws.onerror = () => {
        if (ignore) return;
        setGrowthStatus('Live growth connection failed. Showing last known data.');
        loadGrowth();
      };
      ws.onclose = () => {
        if (ignore) return;
        setGrowthStatus('Live growth disconnected.');
      };
    };

    loadGrowth();
    connect();

    return () => {
      ignore = true;
      if (ws) ws.close();
    };
  }, [activeTab, growthProjectionType]);

  const mapSellerProducts = (items: SellerProduct[]): Product[] =>
    items.map((item) => ({
      id: item.id,
      sellerId: seller.id,
      productId: item.product_id,
      name: item.alias || item.product_id || 'Product',
      description: '',
      price: Number(item.current_price ?? 0),
      category: item.category_id || 'General',
      mediaUrl: toPlaceholderImage(item.alias || item.product_id || 'Product'),
      mediaType: 'image',
      tags: [],
      stockLevel: Number(item.stock_level ?? 0),
      stockStatus: (item.stock_status as Product['stockStatus']) || 'in_stock',
      discountPrice: item.discount_price ?? undefined,
      isFeatured: item.is_featured,
      location: seller.location,
      expiryDate: item.expiry_date || undefined,
      groupBuyEligible: item.group_buy_eligible,
      groupBuyTiers: item.group_buy_tiers || []
    }));

  const loadMediaForProducts = async (items: Product[]) => {
    const productIds = Array.from(new Set(items.map(p => p.productId).filter(Boolean))) as string[];
    if (productIds.length === 0) return;
    try {
      const entries = await Promise.all(
        productIds.map(async (id) => ({
          id,
          media: await listProductMedia(id)
        }))
      );
      const mediaMap = entries.reduce<Record<string, ProductMedia[]>>((acc, item) => {
        acc[item.id] = item.media;
        return acc;
      }, {});
      setProductMediaByProductId(mediaMap);
      setMyProducts(prev => {
        const next = prev.map(p => {
          const media = p.productId ? mediaMap[p.productId] : undefined;
          if (media && media.length > 0 && media[0]?.url) {
            return {
              ...p,
              mediaUrl: media[0].url || p.mediaUrl,
              mediaType: (media[0].media_type as Product['mediaType']) || p.mediaType
            };
          }
          return p;
        });
        pushProducts(next);
        return next;
      });
    } catch {
      // Ignore media failures; products still render with placeholders.
    }
  };

  useEffect(() => {
    if (activeTab !== 'products') return;
    let ignore = false;
    const loadProducts = async () => {
      setProductsStatus(null);
      setProductsLoading(true);
      try {
        const items = await listSellerProducts();
        if (ignore) return;
        const mapped = mapSellerProducts(items);
        setMyProducts(mapped);
        pushProducts(mapped);
        await loadMediaForProducts(mapped);
        const [lowStock] = await Promise.all([
          listSellerLowStock()
        ]);
        if (!ignore) {
          setProductLowStock(lowStock);
        }
      } catch (err: any) {
        if (!ignore) setProductsStatus(err?.message || 'Unable to load products.');
      } finally {
        if (!ignore) setProductsLoading(false);
      }
    };
    loadProducts();
    return () => {
      ignore = true;
    };
  }, [activeTab, seller.id]);

  const pushProducts = (nextMyProducts: Product[]) => {
    const others = products.filter(p => p.sellerId !== seller.id);
    onProductsChange([...nextMyProducts, ...others]);
  };

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const totalOrders = analyticsSummary?.orders ?? null;
  const totalRevenue =
    analyticsSummary?.gross_revenue !== undefined ? Number(analyticsSummary.gross_revenue)
    : analyticsSummary?.net_revenue !== undefined ? Number(analyticsSummary.net_revenue)
    : analyticsSummary?.revenue !== undefined ? Number(analyticsSummary.revenue)
    : null;
  const averagePrice = totalOrders && totalRevenue !== null ? totalRevenue / totalOrders : null;
  const newCustomers = analyticsBuyers?.new_buyers ?? null;
  const ltv = analyticsBuyers?.clv ? Number(analyticsBuyers.clv) : null;
  const cac = analyticsBuyers?.cac ? Number(analyticsBuyers.cac) : null;
  const roas = marketingKpis?.roas !== undefined ? Number(marketingKpis.roas) : null;
  const marketingROAS = roas;
  const marketingCAC = marketingKpis?.cac !== undefined ? Number(marketingKpis.cac) : cac;
  const marketingLTV = marketingKpis?.ltv !== undefined ? Number(marketingKpis.ltv) : ltv;
  const marketingRevenue30d =
    analyticsSummary?.gross_revenue !== undefined ? Number(analyticsSummary.gross_revenue)
    : analyticsSummary?.net_revenue !== undefined ? Number(analyticsSummary.net_revenue)
    : null;
  const marketingOrders30d = analyticsFunnel?.payment_success ?? null;
  const marketingNewCustomers = analyticsBuyers?.new_buyers ?? null;
  const marketingUnits30d = analyticsFunnel?.add_to_cart ?? null;
  const marketingReturns30d = (analyticsSummary as any)?.returns ?? null;
  const totalStock = analyticsInventory?.total_stock ?? null;
  const repeatRate = analyticsBuyers?.repeat_rate !== undefined
    ? Math.round(Number(analyticsBuyers.repeat_rate) * 100)
    : null;
  const repeatRateD30 =
    analyticsSummary?.repeat_rate_d30 !== undefined
      ? Number(analyticsSummary.repeat_rate_d30) * 100
      : null;
  const topCategories = (analyticsInventory?.top_categories || [])
    .map((entry) => ({ category: entry.category || 'General', count: Number(entry.count ?? 0) }))
    .filter((entry) => entry.category);

  const funnelSessions = analyticsFunnel?.sessions ?? null;
  const funnelViews = analyticsFunnel?.pdp_views ?? null;
  const funnelInquiries = analyticsFunnel?.add_to_cart ?? null;
  const dailyViews = funnelViews;
  const dailyInquiries = funnelInquiries;

  const analyticsSalesData = analyticsSalesSeries.map((item, idx) => ({
    name: item.label || item.date || WEEK_DAYS[idx % WEEK_DAYS.length],
    date: item.date,
    sales: Number(item.sales ?? 0),
    reach: Number(item.reach ?? item.sessions ?? 0),
    sessions: Number(item.sessions ?? 0),
    orders: Number(item.orders ?? 0),
  }));

  const analyticsSalesVelocityData = analyticsSalesVelocitySeries.map((item, idx) => ({
    name: item.label || item.date || WEEK_DAYS[idx % WEEK_DAYS.length],
    date: item.date,
    velocity: Number(item.velocity ?? item.orders ?? 0),
    sessions: Number(item.sessions ?? 0),
  }));
  const avgVelocity = analyticsSalesVelocityData.length
    ? analyticsSalesVelocityData.reduce((sum, item) => sum + (item.velocity || 0), 0) / analyticsSalesVelocityData.length
    : 0;
  const analyticsSalesVelocity = analyticsSalesVelocityData.map((item) => ({
    name: item.name,
    date: item.date,
    velocity: item.velocity,
    sessions: item.sessions,
    target: Math.max(1, Math.round(avgVelocity)),
  }));

  const salesMinMax = analyticsSalesData.reduce(
    (acc, item) => ({
      min: item.sales < acc.min ? item.sales : acc.min,
      max: item.sales > acc.max ? item.sales : acc.max,
    }),
    { min: Number.POSITIVE_INFINITY, max: Number.NEGATIVE_INFINITY },
  );

  const salesVelocityMinMax = analyticsSalesVelocity.reduce(
    (acc, item) => ({
      min: item.velocity < acc.min ? item.velocity : acc.min,
      max: item.velocity > acc.max ? item.velocity : acc.max,
    }),
    { min: Number.POSITIVE_INFINITY, max: Number.NEGATIVE_INFINITY },
  );

  const analyticsInventoryTrend = analyticsInventorySeries.map((item, idx) => ({
    name: item.label || item.date || WEEK_DAYS[idx % WEEK_DAYS.length],
    date: item.date,
    stock: Number(item.stock_level ?? item.stockLevel ?? 0),
  }));

  const analyticsConversionTrend = analyticsConversionSeries.map((item, idx) => ({
    name: item.label || item.date || WEEK_DAYS[idx % WEEK_DAYS.length],
    date: item.date,
    rate: Number(item.conversion_rate ?? item.conversionRate ?? 0),
  }));

  const inventoryMinMax = analyticsInventoryTrend.reduce(
    (acc, item) => ({
      min: item.stock < acc.min ? item.stock : acc.min,
      max: item.stock > acc.max ? item.stock : acc.max,
    }),
    { min: Number.POSITIVE_INFINITY, max: Number.NEGATIVE_INFINITY },
  );
  const inventoryTrendDelta =
    analyticsInventoryTrend.length > 1
      ? analyticsInventoryTrend[analyticsInventoryTrend.length - 1].stock -
        analyticsInventoryTrend[0].stock
      : 0;
  const inventoryTrendLabel =
    analyticsInventoryTrend.length > 1
      ? inventoryTrendDelta >= 0
        ? `Up ${inventoryTrendDelta}`
        : `Down ${Math.abs(inventoryTrendDelta)}`
      : '—';

  const conversionMinMax = analyticsConversionTrend.reduce(
    (acc, item) => ({
      min: item.rate < acc.min ? item.rate : acc.min,
      max: item.rate > acc.max ? item.rate : acc.max,
    }),
    { min: Number.POSITIVE_INFINITY, max: Number.NEGATIVE_INFINITY },
  );
  const conversionTrendDelta =
    analyticsConversionTrend.length > 1
      ? analyticsConversionTrend[analyticsConversionTrend.length - 1].rate -
        analyticsConversionTrend[0].rate
      : 0;
  const conversionTrendLabel =
    analyticsConversionTrend.length > 1
      ? conversionTrendDelta >= 0
        ? `Up ${conversionTrendDelta.toFixed(1)}%`
        : `Down ${Math.abs(conversionTrendDelta).toFixed(1)}%`
      : '—';

  const analyticsPeakHours = analyticsPeakHoursData.length
    ? analyticsPeakHoursData.map((item) => ({
        hour: formatHourLabel(Number(item.hour ?? 0)),
        searches: Number(item.searches ?? 0),
      }))
    : [];

  const peakMinMax = analyticsPeakHours.reduce(
    (acc, item) => ({
      min: item.searches < acc.min ? item.searches : acc.min,
      max: item.searches > acc.max ? item.searches : acc.max,
    }),
    { min: Number.POSITIVE_INFINITY, max: Number.NEGATIVE_INFINITY },
  );

  const peakHourSlots = analyticsPeakHoursData
    .slice()
    .sort((a, b) => Number(b.searches ?? 0) - Number(a.searches ?? 0))
    .slice(0, 3)
    .map((item) => formatHourRange(Number(item.hour ?? 0)));

  const liveBuyerTotalScans = analyticsLiveBuyers.reduce(
    (sum, item) => sum + Number(item.scan_count ?? item.scanCount ?? 0),
    0,
  );
  const liveBuyerHotspots = analyticsLiveBuyers
    .slice()
    .sort((a, b) => Number(b.scan_count ?? b.scanCount ?? 0) - Number(a.scan_count ?? a.scanCount ?? 0))
    .slice(0, 3);
  const liveBuyerTop = liveBuyerHotspots[0];

  const analyticsCompetitorPricing =
    (analyticsMarket?.competitor_pricing || [])
      .filter((item) => item.category && (Number(item.your_price ?? 0) > 0 || Number(item.market_price ?? 0) > 0))
      .map((item) => ({
        name: item.category || 'Category',
        yourPrice: Number(item.your_price ?? 0),
        avgPrice: Number(item.market_price ?? 0),
      }));

  const stockoutRisk = clamp(analyticsInventory?.stockout_risk ?? 0);
  const lowStock = clamp(Math.round(stockoutRisk * 0.6), 0, 60);
  const outOfStock = clamp(Math.round(stockoutRisk * 0.3), 0, 30);
  const healthyStock = clamp(100 - lowStock - outOfStock, 0, 100);

  const analyticsStockHealth = [
    { name: 'Healthy', value: healthyStock, color: '#10b981' },
    { name: 'Low Stock', value: lowStock, color: '#f59e0b' },
    { name: 'Out of Stock', value: outOfStock, color: '#ef4444' },
  ];

  const handleAddStockFromTrend = (item: { name?: string; category?: string }) => {
    setEditingProduct(null);
    setFormData({
      name: item.name || '',
      description: '',
      price: '',
      category: item.category || '',
      mediaUrl: '',
      stockLevel: 10,
      expiryDate: '',
      groupBuyEligible: false,
      groupBuyTiers: []
    });
    setIsAddingProduct(true);
  };

  const demographicPalette = ['#6366f1', '#8b5cf6', '#d946ef', '#f43f5e', '#0ea5e9', '#10b981'];
  const analyticsDemographics = analyticsDemographicsData
    .map((item, idx) => ({
      name: item.segment || item.name || `Segment ${idx + 1}`,
      value: Number(item.percent ?? item.value ?? 0),
      color: item.color || demographicPalette[idx % demographicPalette.length]
    }))
    .filter((item) => Number.isFinite(item.value));

  const analyticsTopSearched = analyticsMarketTrending.map((item, idx) => ({
    name: item.name || `Trend ${idx + 1}`,
    searches: Number(item.searches ?? 0),
    trend: item.trend || '',
    category: item.category || item.category_path || ''
  }));

  const analyticsTrendingProducts = analyticsTrendingSuppliers.map((item, idx) => ({
    name: item.name || `Trending Item ${idx + 1}`,
    demand: item.searches ? `${item.searches} searches` : '—',
    supplier: item.supplier_name || 'No suppliers available yet',
    supplierId: item.supplier_id
  }));

  const analyticsCategoryDemand = analyticsMarketDemand.map((item, idx) => ({
    category: item.category || `Category ${idx + 1}`,
    demand: clamp(Number(item.demand ?? 0)),
    sellerShare: clamp(Number(item.sellerShare ?? item.seller_share ?? 0))
  }));

  const analyticsGodViewSources = analyticsChannelMix.map((item, idx) => ({
    label: item.label || item.channel || `Source ${idx + 1}`,
    value: Number(item.value ?? item.pct ?? item.count ?? 0)
  }));

  const sokoscore = growthHealth?.sokoscore !== undefined ? Number(growthHealth.sokoscore) : null;
  const loanMaxAmount = growthLoan?.max_amount ?? null;
  const cashflowIn = Number(growthCashflow?.inflow ?? 0);
  const aovValue = analyticsSummary?.aov ? Number(analyticsSummary.aov) : null;
  const projectionSeries = projectionToSeries(growthProjection?.forecast as Record<string, any>, []);
  const growthRetention =
    growthOverview?.retention_rate !== undefined
      ? Number(growthOverview.retention_rate)
      : repeatRate !== null
        ? repeatRate
        : null;

  const analyticsGodViewDemand = analyticsCategoryDemand.map((item) => ({
    name: item.category,
    pct: clamp(item.demand)
  }));

  const analyticsGodViewCompetitors = [
    { name: 'Your Price', price: averagePrice !== null ? `KSh${Math.round(averagePrice)}` : '—', stock: totalStock !== null ? String(totalStock) : '—', trend: '—' },
    analyticsMarket?.competitor_median_price
      ? {
          name: 'Market Median',
          price: `KSh${Math.round(analyticsMarket.competitor_median_price)}`,
          stock: `${Math.round((analyticsMarket?.competitor_stock ?? 0) * 100)}`,
          trend: '—'
        }
      : null
  ].filter(Boolean) as Array<{ name: string; price: string; stock: string; trend: string }>;

  const analyticsGodViewInventory = analyticsTrendingProducts.map((item) => ({
    name: item.name,
    your: totalStock !== null
      ? `${Math.round(totalStock / Math.max(1, analyticsTrendingProducts.length))} units`
      : '—',
    network: `${Math.round((analyticsMarket?.market_share ?? 0) * 100)}% demand`
  }));

  const analyticsGodViewAlerts = analyticsAnomalies.length
    ? analyticsAnomalies.slice(0, 4).map((item) => item.details || `${item.type} anomaly`)
    : ['No active anomalies detected'];

  const receiptWeekCount = sellerReceipts.filter((r) => {
    const created = r.created_at ? new Date(r.created_at) : null;
    if (!created || Number.isNaN(created.getTime())) return false;
    return now.getTime() - created.getTime() <= 7 * 24 * 60 * 60 * 1000;
  }).length;

  const todayRewardsTotal = sellerRewardsLedger.reduce((sum, entry) => {
    if (!entry.created_at) return sum;
    const created = new Date(entry.created_at);
    if (Number.isNaN(created.getTime()) || created < startOfToday) return sum;
    const amount = Number(entry.amount ?? 0);
    return amount > 0 ? sum + amount : sum;
  }, 0);

  const receiptStreak = sellerRewardStreaks.find((s) => String(s.type || '').toLowerCase().includes('receipt'));
  const receiptStreakCount = receiptStreak?.count ?? 0;

  const quickBoostBudget = Number(
    sellerPreferencesDraft.marketing.quick_boost_budget
      ?? sellerMarketingPreferences.quick_boost_budget
      ?? quickBoostConfig?.budget
      ?? 0,
  );
  const quickBoostCurrency = quickBoostConfig?.currency ?? 'KES';
  const quickBoostTarget = analyticsMarketTrending[0]?.name;
  const quickBoostLabel = quickBoostTarget ? `Boost ${quickBoostTarget}` : 'Boost Demand';
  const quickBoostCta = quickBoostBudget > 0 ? `${quickBoostLabel} (${quickBoostCurrency} ${quickBoostBudget})` : quickBoostLabel;

  const priceMatchValue = analyticsMarket?.competitor_median_price
    ? Math.round(Number(analyticsMarket.competitor_median_price))
    : null;

  const rankScore = sellerRankInfo?.rank;
  const networkFollowers = seller.followersCount;

  const proPlan = subscriptionPlans.find((plan) => String(plan.name || '').toLowerCase().includes('pro'))
    || [...subscriptionPlans].sort((a, b) => (Number(b.price ?? 0) - Number(a.price ?? 0)))[0];
  const proPrice = proPlan?.price ?? null;
  const proCurrency = (proPlan?.features as any)?.currency ?? 'KES';
  const activePlanTier = String(subscriptionView?.subscription?.plan_tier ?? '');
  const isProActive = Boolean(proPlan?.name && activePlanTier && activePlanTier.toLowerCase() === String(proPlan.name).toLowerCase());
  const proFeaturesRaw = proPlan?.features;
  const proFeatures = Array.isArray(proFeaturesRaw)
    ? proFeaturesRaw
    : proFeaturesRaw && typeof proFeaturesRaw === 'object'
      ? Object.values(proFeaturesRaw)
      : [];
  const featuredListingPrice = featuredListingConfig?.price_per_week ?? null;
  const featuredListingCurrency = featuredListingConfig?.currency ?? 'KES';
  const featuredListingDiscountThreshold = featuredListingConfig?.discount_threshold ?? null;
  const featuredListingDiscountPct = featuredListingConfig?.discount_pct ?? null;

  const claimShopBonusLabel = claimShopRewardConfig?.amount
    ? `${claimShopRewardConfig.currency ?? 'KES'} ${claimShopRewardConfig.amount}`
    : null;
  const verificationBonusLabel = verificationRewardConfig?.amount
    ? `${verificationRewardConfig.currency ?? 'KES'} ${verificationRewardConfig.amount}`
    : null;
  const receiptRewardsHint = receiptRewardsConfig?.daily_min !== undefined && receiptRewardsConfig?.daily_max !== undefined
    ? `Daily receipts earn ${receiptRewardsConfig.currency ?? 'KES'} ${receiptRewardsConfig.daily_min}-${receiptRewardsConfig.daily_max}.`
    : 'Submit receipts to earn rewards.';
  const receiptStreakHint = receiptRewardsConfig?.streak_bonus && receiptRewardsConfig?.streak_days
    ? `Streak bonus at ${receiptRewardsConfig.streak_days} days: ${receiptRewardsConfig.currency ?? 'KES'} ${receiptRewardsConfig.streak_bonus}.`
    : '';

  const productById = myProducts.reduce((map, item) => {
    map.set(item.id, item);
    return map;
  }, new Map<string, Product>());

  const retentionProducts = analyticsTopProducts
    .map((item, idx) => {
      const matched = item.seller_product_id
        ? myProducts.find(p => p.id === item.seller_product_id)
        : myProducts.find(p => p.productId === item.product_id);
      if (matched) {
        return {
          id: matched.id,
          name: matched.name,
          price: matched.price,
          mediaUrl: matched.mediaUrl,
          productId: matched.id
        };
      }
      return {
        id: item.seller_product_id || item.product_id || `top_${idx}`,
        name: item.name || 'Top product',
        price: Number.isFinite(item.current_price) ? Number(item.current_price) : null,
        mediaUrl: toPlaceholderImage(item.name || 'Product'),
        productId: item.seller_product_id || ''
      };
    })
    .filter((item) => item.name);

  const lowStockItems = productLowStock;

  const reorderRecommendations = sellerRecommendations
    .map((rec) => {
      let payload: any = rec.payload || {};
      if (typeof payload === 'string') {
        try {
          payload = JSON.parse(payload);
        } catch {
          payload = {};
        }
      }
      const name = payload.product_name || payload.product_id || 'Item';
      const recommended = Number(payload.recommended_reorder ?? NaN);
      if (Number.isFinite(recommended) && recommended > 0) {
        return `${name}: reorder ${Math.round(recommended)}`;
      }
      if (payload.message) {
        return String(payload.message);
      }
      return null;
    })
    .filter((item): item is string => Boolean(item))
    .slice(0, 3);

  const performanceGrowthPct = Number(analyticsPerformanceV2?.sales_growth_pct ?? 0);
  const performanceTopCategories = (analyticsPerformanceV2?.category_revenue_share || [])
    .slice(0, 3)
    .map((item) => ({
      name: item.category || 'Category',
      share: Number(item.share_pct ?? 0),
      revenue: Number(item.revenue ?? 0),
    }));

  const demandStockItems = analyticsDemandStockV2?.items || [];
  const stockoutRiskItems = demandStockItems
    .filter((item) => item.stockout_risk)
    .sort((a, b) => Number(a.stock_coverage_days ?? 999) - Number(b.stock_coverage_days ?? 999))
    .slice(0, 5);

  const pricingOpportunities = (analyticsPricingV2?.items || [])
    .map((item) => {
      const market = Number(item.market_avg_price ?? 0);
      const store = Number(item.store_avg_price ?? 0);
      if (market <= 0) return null;
      const deltaPct = ((store - market) / market) * 100;
      return {
        name: item.name || 'Product',
        category: item.category || 'General',
        deltaPct,
        store,
        market,
      };
    })
    .filter((item): item is { name: string; category: string; deltaPct: number; store: number; market: number } => Boolean(item))
    .sort((a, b) => Math.abs(b.deltaPct) - Math.abs(a.deltaPct))
    .slice(0, 4);

  const slowMoverCount = (analyticsProductPerformanceV2?.items || []).filter((item) => item.slow_mover).length;
  const highGrowthCategoryCount = (analyticsCategoryHealthV2?.items || []).filter((item) => Number(item.growth_pct ?? 0) > 10).length;

  const actionNowCards = [
    ...(analyticsActionsV2?.stock_more || []).slice(0, 2),
    ...(analyticsActionsV2?.raise_prices || []).slice(0, 2),
    ...(analyticsActionsV2?.lower_prices || []).slice(0, 2),
    ...(analyticsActionsV2?.reduce_drop || []).slice(0, 2),
  ].slice(0, 6);

  const demandHeatmap = marketingHotspots
    .map((h, i) => {
      const product = myProducts.find(p => p.id === h.product_id) || myProducts[i % Math.max(1, myProducts.length)];
      return {
        id: h.product_id || product?.id || `hotspot_${i}`,
        name: product?.name || 'Hotspot',
        location: product?.location,
        demand: Math.max(10, Math.round((h.hotspot_score || 0) * 100))
      };
    })
    .filter(p => p.location);

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

  useEffect(() => {
    if (activeTab !== 'marketing') return;
    if (!mapboxToken) return;
    if (!heatmapContainerRef.current) return;
    if (demandHeatmap.length === 0) {
      if (heatmapMapRef.current) {
        heatmapMapRef.current.remove();
        heatmapMapRef.current = null;
        heatmapReadyRef.current = false;
      }
      return;
    }
    let active = true;
    ensureMapbox().then((mapboxgl) => {
      if (!active) return;
      mapboxgl.accessToken = mapboxToken;
      if (!heatmapMapRef.current) {
        const center = [demandHeatmap[0].location!.lng, demandHeatmap[0].location!.lat];
        const map = new mapboxgl.Map({
          container: heatmapContainerRef.current!,
          style: 'mapbox://styles/mapbox/streets-v12',
          center,
          zoom: 11
        });
        map.addControl(new mapboxgl.NavigationControl(), 'top-right');
        map.on('load', () => {
          heatmapReadyRef.current = true;
          if (!map.getSource('demand-heat')) {
            map.addSource('demand-heat', {
              type: 'geojson',
              data: { type: 'FeatureCollection', features: [] }
            });
            map.addLayer({
              id: 'demand-heatmap',
              type: 'heatmap',
              source: 'demand-heat',
              paint: {
                'heatmap-weight': ['interpolate', ['linear'], ['get', 'demand'], 0, 0, 100, 1],
                'heatmap-intensity': 1.1,
                'heatmap-radius': 22,
                'heatmap-opacity': 0.8,
                'heatmap-color': [
                  'interpolate',
                  ['linear'],
                  ['heatmap-density'],
                  0, 'rgba(14, 165, 233, 0)',
                  0.4, 'rgba(99, 102, 241, 0.6)',
                  0.7, 'rgba(236, 72, 153, 0.7)',
                  1, 'rgba(244, 63, 94, 0.9)'
                ]
              }
            });
            map.addLayer({
              id: 'demand-points',
              type: 'circle',
              source: 'demand-heat',
              paint: {
                'circle-color': '#ef4444',
                'circle-radius': 4,
                'circle-opacity': 0.6
              }
            });
          }
        });
        heatmapMapRef.current = map;
      }
      if (heatmapMapRef.current && heatmapReadyRef.current) {
        const source = heatmapMapRef.current.getSource('demand-heat') as any;
        if (source) {
          const features = demandHeatmap.map((p) => ({
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [p.location!.lng, p.location!.lat]
            },
            properties: {
              demand: p.demand,
              name: p.name
            }
          }));
          source.setData({ type: 'FeatureCollection', features } as any);
        }
      }
    });
    return () => {
      active = false;
    };
  }, [activeTab, demandHeatmap, mapboxToken]);

  useEffect(() => {
    if (!showPathRecorder) return;
    if (!mapboxToken) return;
    if (!pathRecorderContainerRef.current) return;
    if (!sellerLocations[0]?.lat || !sellerLocations[0]?.lng) {
      setPathRecordingStatus('Set your shop location to record paths.');
      return;
    }
    let active = true;
    ensureMapbox().then((mapboxgl) => {
      if (!active) return;
      mapboxgl.accessToken = mapboxToken;
      if (!pathRecorderMapRef.current) {
        const map = new mapboxgl.Map({
          container: pathRecorderContainerRef.current!,
          style: 'mapbox://styles/mapbox/streets-v12',
          center: [sellerLocations[0].lng, sellerLocations[0].lat],
          zoom: 14
        });
        map.addControl(new mapboxgl.NavigationControl(), 'top-right');
        map.on('load', () => {
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
        pathRecorderMapRef.current = map;
      }
    });
    return () => {
      active = false;
    };
  }, [mapboxToken, sellerLocations, showPathRecorder]);

  useEffect(() => {
    if (!showPathRecorder) {
      setIsPathRecorderExpanded(false);
      return;
    }
    if (!pathRecorderMapRef.current) return;
    const raf = window.requestAnimationFrame(() => {
      pathRecorderMapRef.current?.resize?.();
    });
    return () => window.cancelAnimationFrame(raf);
  }, [isPathRecorderExpanded, showPathRecorder, sellerLocations]);

  useEffect(() => {
    if (!showPathRecorder || !pathRecorderMapRef.current) return;
    const source = pathRecorderMapRef.current.getSource('recording-path') as any;
    if (!source) return;
    if (pathRecordingPoints.length < 2) {
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
            coordinates: pathRecordingPoints.map((p) => [p.lng, p.lat])
          },
          properties: {}
        }
      ]
    };
    source.setData(line as any);
  }, [pathRecordingPoints, showPathRecorder]);

  useEffect(() => {
    if (showPathRecorder || !pathRecorderMapRef.current) return;
    pathRecorderMapRef.current.remove();
    pathRecorderMapRef.current = null;
    if (pathRecordingWatchIdRef.current) {
      navigator.geolocation.clearWatch(pathRecordingWatchIdRef.current);
      pathRecordingWatchIdRef.current = null;
    }
    setPathRecordingActive(false);
    setPathRecordingPaused(false);
    setPathRecordingPoints([]);
    setPathRecordingDistance(0);
    setPathRecordingStart(null);
  }, [showPathRecorder]);

  useEffect(() => {
    if (activeTab === 'marketing') return;
    if (heatmapMapRef.current) {
      heatmapMapRef.current.remove();
      heatmapMapRef.current = null;
      heatmapReadyRef.current = false;
    }
  }, [activeTab]);

  const cartAbandonRate = analyticsFunnel?.cart_abandonment ?? null;
  const avgItemsPerOrder = analyticsSummary?.items_per_order ?? null;
  const channelMixTotal = analyticsChannelMix.reduce((sum, item) => sum + Number(item.value ?? item.pct ?? item.count ?? 0), 0);
  const channelMix = analyticsChannelMix.map((item, idx) => {
    const raw = Number(item.value ?? item.pct ?? item.count ?? 0);
    const pct = channelMixTotal > 0 ? Math.round((raw / channelMixTotal) * 100) : 0;
    const name = item.label || item.channel || `Channel ${idx + 1}`;
    return { name, value: pct };
  });
  const csat = analyticsSummary?.rating_avg ?? null;
  const csatCount = analyticsSummary?.rating_count ?? 0;
  const dataCoverageRate = analyticsDataQuality?.coverage ?? null;
  const dataFreshnessDays = analyticsDataQuality?.freshness_days ?? null;
  const verificationRate = analyticsDataQuality?.verification_rate ?? null;
  const anomalyRate = analyticsDataQuality?.anomaly_rate ?? null;
  const dataMediaCoverage = analyticsDataQuality?.media_coverage ?? null;
  const dataCategoryCoverage = analyticsDataQuality?.category_coverage ?? null;

  const handleLaunchCampaign = async () => {
    if (!campaignForm.name || !campaignForm.productId) {
      setCampaignStatus('Campaign name and product are required.');
      return;
    }
    setCampaignStatus(null);
    setCampaignLoading(true);
    try {
      const created = await createSellerCampaign({
        name: campaignForm.name,
        objective: campaignForm.objective,
        budget_total: campaignForm.budget,
        targeting_rules: { duration_days: campaignForm.durationDays },
        product_id: campaignForm.productId,
        channel: campaignForm.channel
      });
      const nextCampaign = {
        id: created.id,
        name: created.name || campaignForm.name,
        objective: (created.objective as 'reach' | 'sales' | 'favorites') || campaignForm.objective,
        budget: Number(created.budget_total || campaignForm.budget),
        durationDays: campaignForm.durationDays,
        productId: created.product_id || campaignForm.productId,
        channel: (created.channel as 'search' | 'feed' | 'messages') || campaignForm.channel,
        status: (created.status as 'scheduled' | 'active' | 'completed' | 'paused' | 'draft') || 'draft',
      };
      setCampaigns(prev => [nextCampaign, ...prev]);
      setCampaignForm({
        name: '',
        objective: 'sales',
        budget: 1200,
        durationDays: 7,
        productId: '',
        channel: 'search'
      });
      setCampaignStatus('Campaign created.');
    } catch (err: any) {
      setCampaignStatus(err?.message || 'Campaign creation failed.');
    } finally {
      setCampaignLoading(false);
    }
  };

  const handleClaimShop = async () => {
    setOnboardingStatus(null);
    try {
      await recordSellerOnboardingEvent({ step: 'claim_shop', status: 'complete' });
      await completeSellerOnboarding();
      const state = await getSellerOnboardingState();
      setOnboardingState(state);
      setOnboardingStatus('Shop claimed successfully.');
    } catch (err: any) {
      setOnboardingStatus(err?.message || 'Unable to claim shop.');
    }
  };

  const handleStartVerification = async () => {
    setOnboardingStatus(null);
    try {
      await requestSellerVerification();
      const status = await getSellerVerificationStatus();
      setVerificationStatus(status);
      setOnboardingStatus('Verification request submitted.');
    } catch (err: any) {
      setOnboardingStatus(err?.message || 'Unable to start verification.');
    }
  };

  const handleRefreshShareLink = async () => {
    setOnboardingStatus(null);
    try {
      const updated = await refreshSellerShareLink();
      setSellerShareLink((updated as any)?.share_url ?? sellerShareLink);
      setOnboardingStatus('Share link refreshed.');
    } catch (err: any) {
      setOnboardingStatus(err?.message || 'Unable to refresh share link.');
    }
  };

  const handleEditStorefront = async () => {
    setOnboardingStatus(null);
    try {
      await recordSellerOnboardingEvent({ step: 'storefront_edit', status: 'started' });
      setOnboardingStatus('Storefront edit opened.');
    } catch (err: any) {
      setOnboardingStatus(err?.message || 'Unable to open storefront editor.');
    }
  };

  const uploadMediaFile = async (file: File, context = 'seller_product_media') => {
    const uploaded = await uploadSharedMediaFile(file, context);
    return uploaded.url;
  };

  const uploadProductMedia = async (file: File, targetProduct?: Product) => {
    setProductsStatus(null);
    setMediaUploading(true);
    try {
      const url = await uploadMediaFile(file);
      setFormData(prev => ({ ...prev, mediaUrl: url }));
      const activeProduct = targetProduct || editingProduct;
      if (activeProduct) {
        const mediaType: 'video' | 'image' = file.type.startsWith('video') ? 'video' : 'image';
        await addSellerProductMedia(activeProduct.id, {
          url,
          media_type: mediaType
        });
        if (activeProduct.productId) {
          const media = await listProductMedia(activeProduct.productId);
          setProductMediaByProductId(prev => ({ ...prev, [activeProduct.productId!]: media }));
        }
        setMyProducts(prev => {
          const next = prev.map(p => (p.id === activeProduct.id ? { ...p, mediaUrl: url, mediaType } : p));
          pushProducts(next);
          return next;
        });
      }
      setProductsStatus('Media uploaded.');
    } catch (err: any) {
      setProductsStatus(err?.message || 'Unable to upload media.');
    } finally {
      setMediaUploading(false);
      if (mediaInputRef.current) mediaInputRef.current.value = '';
      if (mediaDrawerInputRef.current) mediaDrawerInputRef.current.value = '';
    }
  };

  const uploadAvatar = async (file: File) => {
    setSettingsStatus(null);
    setAvatarUploading(true);
    try {
      const url = await uploadMediaFile(file);
      await updateSellerProfile({ logo_url: url });
      setSeller(prev => ({ ...prev, avatar: url }));
      setSettingsStatus('Logo updated.');
    } catch (err: any) {
      setSettingsStatus(err?.message || 'Unable to upload logo.');
    } finally {
      setAvatarUploading(false);
      if (avatarInputRef.current) avatarInputRef.current.value = '';
    }
  };

  const uploadShopFrontImage = async (file: File) => {
    setSettingsStatus(null);
    try {
      const url = await uploadMediaFile(file, 'shop_front');
      setShopFrontImageUrl(url);
      setSettingsStatus('Shop front photo uploaded.');
    } catch (err: any) {
      setSettingsStatus(err?.message || 'Unable to upload shop front photo.');
    } finally {
      if (shopFrontInputRef.current) shopFrontInputRef.current.value = '';
    }
  };

  const uploadLandmarkMedia = async (file: File, index: number) => {
    setPathLandmarkDrafts(prev => prev.map((item, i) => i === index ? { ...item, uploading: true } : item));
    try {
      const url = await uploadMediaFile(file, 'path_landmark');
      setPathLandmarkDrafts(prev => prev.map((item, i) => i === index ? { ...item, imageUrl: url, uploading: false } : item));
    } catch {
      setPathLandmarkDrafts(prev => prev.map((item, i) => i === index ? { ...item, uploading: false } : item));
    }
  };

  const addShopLandmark = () => {
    setShopLandmarks(prev => ([
      ...prev,
      { label: '', type: 'landmark', image_url: '', sequence: prev.length + 1 }
    ]));
  };

  const updateShopLandmark = (index: number, patch: Partial<ShopLandmark & { uploading?: boolean }>) => {
    setShopLandmarks(prev => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  };

  const handleShopLandmarkFile = async (index: number, file?: File | null) => {
    if (!file) return;
    try {
      const url = await uploadMediaFile(file, 'shop_landmark');
      updateShopLandmark(index, { image_url: url });
    } catch (err: any) {
      setSettingsStatus(err?.message || 'Unable to upload landmark photo.');
    }
  };

  const shouldTrimVideo = async (file: File) => {
    if (!file.type.startsWith('video/')) return false;
    const duration = await getVideoDurationSeconds(file);
    return duration > 60;
  };

  const queueVideoTrim = (
    file: File,
    kind: 'product' | 'avatar' | 'landmark',
    options: { targetProduct?: Product | null; landmarkIndex?: number | null } = {}
  ) => {
    setPendingVideoTrim({
      file,
      kind,
      targetProduct: options.targetProduct ?? null,
      landmarkIndex: options.landmarkIndex ?? null
    });
  };

  const uploadReceiptFile = async (file: File) => {
    const approvedFile = await requestMediaUploadPreview(file, {
      title: 'Preview receipt upload',
      description: 'Review the receipt image before sending it for OCR processing.',
      confirmLabel: 'Upload receipt'
    });
    const presign = await requestUploadPresign({
      file_name: approvedFile.name,
      mime_type: approvedFile.type,
      content_length: approvedFile.size,
      context: 'reward_receipt'
    });
    if (!presign.upload_url && !presign.url) {
      throw new Error('Upload presign failed.');
    }
    const uploadUrl = presign.upload_url || presign.url!;
    if (presign.fields) {
      const form = new FormData();
      Object.entries(presign.fields).forEach(([key, value]) => {
        form.append(key, value);
      });
      form.append('file', approvedFile);
      await fetch(uploadUrl, {
        method: presign.method || 'POST',
        body: form,
        headers: presign.headers
      });
    } else {
      await fetch(uploadUrl, {
        method: presign.method || 'PUT',
        headers: presign.headers || { 'Content-Type': approvedFile.type },
        body: approvedFile
      });
    }
    const key = presign.s3_key || presign.key;
    if (!key) {
      throw new Error('Upload key missing.');
    }
    return key;
  };

  const handleProductMediaUpload = async (file: File, targetProduct?: Product) => {
    try {
      if (await shouldTrimVideo(file)) {
        queueVideoTrim(file, 'product', { targetProduct: targetProduct ?? editingProduct });
        return;
      }
      await uploadProductMedia(file, targetProduct);
    } catch (err: any) {
      setProductsStatus(err?.message || 'Unable to upload media.');
    } finally {
      if (mediaInputRef.current) mediaInputRef.current.value = '';
      if (mediaDrawerInputRef.current) mediaDrawerInputRef.current.value = '';
    }
  };

  const handleAvatarUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setSettingsStatus('Avatar must be an image.');
      if (avatarInputRef.current) avatarInputRef.current.value = '';
      return;
    }
    try {
      await uploadAvatar(file);
    } catch (err: any) {
      setSettingsStatus(err?.message || 'Unable to upload logo.');
    } finally {
      if (avatarInputRef.current) avatarInputRef.current.value = '';
    }
  };

  const handleTrimmedVideoConfirm = async (trimmedFile: File) => {
    const pending = pendingVideoTrim;
    setPendingVideoTrim(null);
    if (!pending) return;
    if (pending.kind === 'product') {
      await uploadProductMedia(trimmedFile, pending.targetProduct ?? undefined);
      return;
    }
    if (pending.kind === 'landmark' && typeof pending.landmarkIndex === 'number') {
      await uploadLandmarkMedia(trimmedFile, pending.landmarkIndex);
      return;
    }
    await uploadAvatar(trimmedFile);
  };

  const handleTrimmedVideoCancel = () => {
    const pending = pendingVideoTrim;
    setPendingVideoTrim(null);
    if (pending?.kind === 'product' || pending?.kind === 'landmark') {
      if (mediaInputRef.current) mediaInputRef.current.value = '';
      if (mediaDrawerInputRef.current) mediaDrawerInputRef.current.value = '';
    }
    if (pending?.kind === 'avatar' && avatarInputRef.current) {
      avatarInputRef.current.value = '';
    }
  };

  const handleRemoveProductMediaFor = async (product: Product, mediaId: string) => {
    setProductsStatus(null);
    try {
      await removeSellerProductMedia(product.id, mediaId);
      if (product.productId) {
        const media = await listProductMedia(product.productId);
        setProductMediaByProductId(prev => ({ ...prev, [product.productId!]: media }));
        setMyProducts(prev => {
          const next = prev.map(p => {
            if (p.id !== product.id) return p;
            const nextUrl = media[0]?.url || toPlaceholderImage(p.name);
            return {
              ...p,
              mediaUrl: nextUrl,
              mediaType: (media[0]?.media_type as Product['mediaType']) || p.mediaType
            };
          });
          pushProducts(next);
          return next;
        });
      }
      setProductsStatus('Media removed.');
    } catch (err: any) {
      setProductsStatus(err?.message || 'Unable to remove media.');
    }
  };

  const handleRemoveProductMedia = async (mediaId: string) => {
    if (!editingProduct) return;
    await handleRemoveProductMediaFor(editingProduct, mediaId);
  };

  const handleOpenMediaDrawer = (product: Product) => {
    setMediaDrawerProduct(product);
    setShowMediaDrawer(true);
  };

  const handleCompleteTutorial = async (tutorialId?: string) => {
    if (!tutorialId) return;
    setOnboardingStatus(null);
    try {
      await completeSellerTutorial({ tutorial_id: tutorialId });
      setOnboardingTutorials(prev =>
        prev.map(t => (t.id === tutorialId ? { ...t, status: 'completed' } : t))
      );
      setOnboardingStatus('Tutorial marked complete.');
    } catch (err: any) {
      setOnboardingStatus(err?.message || 'Unable to complete tutorial.');
    }
  };

  const handleShopTypeSelect = async (type: string) => {
    const nextSelections = toggleMultiSelection(shopTypeSelections, type);
    const primaryType = nextSelections[0] || type;
    setShopType(primaryType);
    setShopTypeSelections(nextSelections);
    setOnboardingStatus(null);
    try {
      const nextServiceArea = {
        ...sellerServiceArea,
        shop_types: nextSelections,
        selling_modes: sellerModeSelections,
        reach_channels: buyerReachSelections,
        daily_place_name: dailyPlaceName || undefined,
      };
      const state = await setSellerShopType({ shop_type: primaryType });
      await updateSellerProfile({ service_area: nextServiceArea });
      setSellerServiceArea(nextServiceArea);
      setOnboardingState(state);
      setOnboardingStatus('Shop type saved.');
    } catch (err: any) {
      setOnboardingStatus(err?.message || 'Unable to save shop type.');
    }
  };

  const handleSellerModeSelect = async (mode: string) => {
    const nextSelections = toggleMultiSelection(sellerModeSelections, mode);
    const primaryMode = nextSelections[0] || mode;
    setSellerMode(primaryMode);
    setSellerModeSelections(nextSelections);
    if (primaryMode !== 'hybrid') {
      if (primaryMode === 'fixed_shop') setBuyerReach('fixed_address');
      if (primaryMode === 'open_market_stall' || primaryMode === 'ground_trader') setBuyerReach('market_stall');
      if (primaryMode === 'solopreneur') setBuyerReach('delivery_only');
    }
    setOnboardingStatus(null);
    try {
      const nextServiceArea = {
        ...sellerServiceArea,
        shop_types: shopTypeSelections,
        selling_modes: nextSelections,
        reach_channels: buyerReachSelections,
        daily_place_name: dailyPlaceName || undefined,
      };
      await updateSellerProfile({ seller_mode: primaryMode, service_area: nextServiceArea });
      setSellerServiceArea(nextServiceArea);
      await recordSellerOnboardingEvent({ step: 'seller_mode', status: 'complete' });
      const state = await getSellerOnboardingState();
      setOnboardingState(state);
      setOnboardingStatus('Seller mode saved.');
    } catch (err: any) {
      setOnboardingStatus(err?.message || 'Unable to save seller mode.');
    }
  };

  const updateDeliveryDetail = (patch: Partial<DeliveryDetails>) => {
    setDeliveryDetails(prev => ({ ...prev, ...patch }));
  };

  const toggleDeliveryDay = (day: string) => {
    setDeliveryDetails(prev => {
      const days = prev.delivery_days ? [...prev.delivery_days] : [];
      const idx = days.indexOf(day);
      if (idx >= 0) {
        days.splice(idx, 1);
      } else {
        days.push(day);
      }
      return { ...prev, delivery_days: days };
    });
  };

  const handleVisualMarkerUpload = async (file: File) => {
    setVisualMarkerUploading(true);
    setOnboardingStatus(null);
    try {
      const url = await uploadMediaFile(file, 'seller_visual_marker');
      setVisualMarker(url);
      setOnboardingStatus('Visual marker photo uploaded.');
    } catch (err: any) {
      setOnboardingStatus(err?.message || 'Unable to upload visual marker.');
    } finally {
      setVisualMarkerUploading(false);
    }
  };

  const handleSaveDeliveryDetails = async () => {
    setOnboardingStatus(null);
    try {
      const zones = deliveryZonesInput
        .split(',')
        .map(zone => zone.trim())
        .filter(Boolean);
      const paymentOptions = paymentOptionsInput
        .split(',')
        .map(opt => opt.trim())
        .filter(Boolean);
      const selectedReach = buyerReachSelections.length ? buyerReachSelections : [buyerReach];
      const selectedModes = sellerModeSelections.length ? sellerModeSelections : [sellerMode];
      const hasDailyPin = dailyLat !== '' && dailyLng !== '';
      if ((selectedReach.includes('market_stall') || selectedModes.includes('ground_trader') || selectedModes.includes('open_market_stall')) &&
        (!marketName.trim() || !visualMarker.trim() || !whatsappNumber.trim() || !dailyPlaceName.trim() || !hasDailyPin)) {
        setOnboardingStatus('Market sellers need a place name, pinned map location, visual marker photo, and WhatsApp number.');
        return;
      }
      if ((selectedReach.includes('delivery_only') || selectedModes.includes('solopreneur')) &&
        (!whatsappNumber.trim() || (deliveryRadiusKm === '' && zones.length === 0))) {
        setOnboardingStatus('Delivery sellers need WhatsApp and a delivery radius or zones.');
        return;
      }
      const normalizedDetails: DeliveryDetails = {
        ...deliveryDetails,
        delivery_radius_km: deliveryRadiusKm === '' ? deliveryDetails.delivery_radius_km : Number(deliveryRadiusKm),
        delivery_zones: zones,
        offers_delivery: deliveryDetails.offers_delivery ?? (deliveryRadiusKm !== '' && Number(deliveryRadiusKm) > 0),
        payment_options: paymentOptions,
        installation_services: installationServicesInput || undefined,
        after_sales_support: afterSalesSupportInput || undefined
      };
      const nextServiceArea = {
        ...sellerServiceArea,
        shop_types: shopTypeSelections,
        selling_modes: sellerModeSelections,
        reach_channels: selectedReach,
        daily_place_name: dailyPlaceName.trim() || undefined,
      };
      await updateSellerProfile({
        market_name: marketName || undefined,
        visual_marker: visualMarker || undefined,
        whatsapp_number: whatsappNumber || undefined,
        delivery_radius_km: deliveryRadiusKm === '' ? undefined : Number(deliveryRadiusKm),
        daily_lat: dailyLat === '' ? undefined : Number(dailyLat),
        daily_lng: dailyLng === '' ? undefined : Number(dailyLng),
        delivery_details: normalizedDetails,
        service_area: nextServiceArea,
      });
      setSellerServiceArea(nextServiceArea);
      await recordSellerOnboardingEvent({ step: 'delivery_details', status: 'complete' });
      const state = await getSellerOnboardingState();
      setOnboardingState(state);
      setOnboardingStatus('Delivery details saved.');
    } catch (err: any) {
      setOnboardingStatus(err?.message || 'Unable to save delivery details.');
    }
  };

  const handleConnectOnline = async () => {
    setOnlineConnectionStatus(null);
    setMappingStatus(null);
    setOauthStatus(null);
    try {
      const platform = onlineConnectForm.platform;
      if (platform === 'shopify' || platform === 'woocommerce') {
        const redirectUrl = `${window.location.origin}${window.location.pathname}?oauth=1&platform=${platform}&shop=${encodeURIComponent(onlineConnectForm.shop_domain || '')}`;
        const start = await startOnlineOAuth({
          platform,
          shop_domain: onlineConnectForm.shop_domain || undefined,
          scopes: onlineConnectForm.scopes || undefined,
          redirect_url: redirectUrl
        });
        if (start?.auth_url) {
          window.location.href = start.auth_url;
          return;
        }
      }
      const payload: OnlineConnectRequest = {
        ...onlineConnectForm,
        shop_type: shopType
      };
      const response = await connectOnlineStore(payload);
      const connection = (response as any)?.connection ?? (response as any);
      if (response?.auth_url) {
        setOnlineAuthUrl(response.auth_url);
      } else {
        setOnlineAuthUrl(null);
      }
      if (connection?.id) {
        setOnlineConnectionId(connection.id);
        setOnlineConnectionStatus(`Connection ${connection.connection_status || 'created'}.`);
        void loadMappingSuggestions(connection.id);
      } else if (response?.auth_url) {
        setOnlineConnectionStatus('Authorization required. Complete Shopify OAuth to finish.');
      } else {
        setOnlineConnectionStatus('Connection created.');
      }
      const state = await getSellerOnboardingState();
      setOnboardingState(state);
    } catch (err: any) {
      setOnlineConnectionStatus(err?.message || 'Unable to connect store.');
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('oauth') !== '1') return;
    const platform = params.get('platform') || '';
    const shop = params.get('shop') || onlineConnectForm.shop_domain || '';
    const code = params.get('code') || '';
    const state = params.get('state') || '';
    const hmac = params.get('hmac') || '';
    const timestamp = params.get('timestamp') || '';
    const host = params.get('host') || '';
    const consumerKey = params.get('consumer_key') || '';
    const consumerSecret = params.get('consumer_secret') || '';
    const signature = params.get('signature') || '';
    const userId = params.get('user_id') || '';
    const scope = params.get('scope') || '';
    const returnUrl = params.get('return_url') || '';
    const callbackUrl = params.get('callback_url') || '';

    const finish = async () => {
      if (!platform) return;
      setOauthStatus('Finalizing OAuth connection...');
      try {
        await completeOnlineOAuth({
          platform,
          shop_domain: shop || undefined,
          code: code || undefined,
          state: state || undefined,
          hmac: hmac || undefined,
          timestamp: timestamp || undefined,
          host: host || undefined,
          consumer_key: consumerKey || undefined,
          consumer_secret: consumerSecret || undefined,
          signature: signature || undefined,
          user_id: userId || undefined,
          scope: scope || undefined,
          return_url: returnUrl || undefined,
          callback_url: callbackUrl || undefined
        });
        setOauthStatus('OAuth connection complete.');
        const stateResp = await getSellerOnboardingState();
        setOnboardingState(stateResp);
        if (stateResp?.connection?.id) {
          setOnlineConnectionId(stateResp.connection.id);
          void loadMappingSuggestions(stateResp.connection.id);
        }
      } catch (err: any) {
        setOauthStatus(err?.message || 'OAuth completion failed.');
      } finally {
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    };
    finish();
  }, []);

  const handleAddMappingRow = () => {
    setMappingItems(prev => ([
      ...prev,
      { external_sku: '', canonical_sku: '', platform: onlineConnectForm.platform || 'custom', sync_enabled: true }
    ]));
  };

  const upsertMappingDraft = (item: ProductMappingItem) => {
    setMappingItems(prev => {
      const next = [...prev];
      const idx = next.findIndex((entry) =>
        entry.external_sku.trim().toLowerCase() === item.external_sku.trim().toLowerCase()
        && entry.platform.trim().toLowerCase() === item.platform.trim().toLowerCase()
      );
      if (idx >= 0) {
        next[idx] = { ...next[idx], ...item, sync_enabled: true };
        return next;
      }
      return [...next, { ...item, sync_enabled: true }];
    });
  };

  const loadMappingSuggestions = async (connectionId?: string | null) => {
    const target = connectionId || onlineConnectionId;
    if (!target) {
      setMappingSuggestions([]);
      return;
    }
    setMappingSuggestionsLoading(true);
    try {
      const items = await getConnectionMappingSuggestions(target);
      setMappingSuggestions(items || []);
    } catch (err: any) {
      setMappingSuggestions([]);
      setMappingStatus(err?.message || 'Unable to load mapping suggestions.');
    } finally {
      setMappingSuggestionsLoading(false);
    }
  };

  const handleApplySuggestedMapping = (suggestion: MappingSuggestion, canonicalSKU?: string) => {
    const selected = canonicalSKU || suggestion.canonical_sku;
    if (!selected || !suggestion.external_sku) return;
    upsertMappingDraft({
      external_sku: suggestion.external_sku,
      canonical_sku: selected,
      platform: suggestion.platform || onlineConnectForm.platform || 'custom',
      sync_enabled: true,
    });
    setMappingStatus(`Added mapping draft for ${suggestion.external_title || suggestion.external_sku}. Save mappings to apply it.`);
  };

  const handleDraftManualMapping = (suggestion: MappingSuggestion) => {
    if (!suggestion.external_sku) return;
    upsertMappingDraft({
      external_sku: suggestion.external_sku,
      canonical_sku: '',
      platform: suggestion.platform || onlineConnectForm.platform || 'custom',
      sync_enabled: true,
    });
    setMappingStatus(`Created a manual mapping draft for ${suggestion.external_title || suggestion.external_sku}. Add the catalog product ID, then save.`);
  };

  const handleApplyAllSuggestedMappings = () => {
    const suggested = mappingSuggestions.filter((item) => item.status === 'suggested' && item.canonical_sku);
    if (suggested.length === 0) {
      setMappingStatus('No high-confidence suggestions available yet.');
      return;
    }
    suggested.forEach((item) => {
      if (item.canonical_sku) {
        upsertMappingDraft({
          external_sku: item.external_sku,
          canonical_sku: item.canonical_sku,
          platform: item.platform || onlineConnectForm.platform || 'custom',
          sync_enabled: true,
        });
      }
    });
    setMappingStatus(`Added ${suggested.length} suggested mapping${suggested.length === 1 ? '' : 's'} to the draft list. Save mappings to apply them.`);
  };

  const handleSaveMappings = async () => {
    if (mappingItems.length === 0) {
      setMappingStatus('Manual mappings are only needed for items the sync could not match automatically.');
      return;
    }
    setMappingStatus(null);
    setMappingSyncing(true);
    try {
      await bulkProductMappings(mappingItems);
      setMappingStatus('Mappings saved.');
      await loadMappingSuggestions();
    } catch (err: any) {
      setMappingStatus(err?.message || 'Unable to save mappings.');
    } finally {
      setMappingSyncing(false);
    }
  };

  const handleRefreshConnection = async () => {
    if (!onlineConnectionId) return;
    setOnlineConnectionStatus(null);
    try {
      const status = await getConnectionStatus(onlineConnectionId);
      if (status?.connection_status || status?.last_error) {
        const parts: string[] = [];
        if (status?.connection_status) {
          parts.push(`Status: ${status.connection_status}`);
        }
        if (status?.last_error) {
          parts.push(status.last_error);
        }
        setOnlineConnectionStatus(parts.join(' - '));
      }
      await loadMappingSuggestions(onlineConnectionId);
    } catch (err: any) {
      setOnlineConnectionStatus(err?.message || 'Unable to fetch connection status.');
    }
  };

  const handleCreateGroupBuyOffer = async (product: Product) => {
    setGroupBuyOfferStatus(null);
    if (!product.productId) {
      setGroupBuyOfferStatus('Product SKU missing.');
      return;
    }
    if (!product.groupBuyEligible) {
      setGroupBuyOfferStatus('Enable group buy eligibility first.');
      return;
    }
    if (!groupBuyDefaults) {
      setGroupBuyOfferStatus('Group buy defaults not configured yet.');
      return;
    }
    try {
      await createGroupBuyOffer({
        product_sku: product.productId,
        tiers: product.groupBuyTiers || [],
        min_group_size: groupBuyDefaults.min_group_size,
        max_groups: groupBuyDefaults.max_groups,
        duration_hours: groupBuyDefaults.duration_hours
      });
      setGroupBuyOfferStatus(`Group buy published for ${product.name}.`);
    } catch (err: any) {
      setGroupBuyOfferStatus(err?.message || 'Unable to publish group buy.');
    }
  };

  const handleSyncNow = async () => {
    if (!onlineConnectionId) return;
    setOnlineConnectionStatus(null);
    try {
      const status = await triggerConnectionSync(onlineConnectionId);
      setOnlineConnectionStatus(`Sync started (${status?.connection_status || 'syncing'}).`);
      await loadMappingSuggestions(onlineConnectionId);
    } catch (err: any) {
      setOnlineConnectionStatus(err?.message || 'Unable to trigger sync.');
    }
  };

  const handleActivateFeatured = async () => {
    setMarketingStatus(null);
    try {
      await activateFeatured();
      setMarketingStatus('Featured listing activated.');
    } catch (err: any) {
      setMarketingStatus(err?.message || 'Unable to activate featured listing.');
    }
  };

  const handleBroadcastStockAlert = async () => {
    if (!stockAlertProductId) {
      setMarketingStatus('Select a product to broadcast.');
      return;
    }
    setMarketingStatus(null);
    try {
      await createStockAlert({ product_id: stockAlertProductId });
      await broadcastStockAlerts();
      const latestAlerts = await listStockAlerts();
      setMarketingStockAlerts(latestAlerts);
      setMarketingStatus('Stock alert broadcasted to followers.');
    } catch (err: any) {
      setMarketingStatus(err?.message || 'Unable to send stock alert.');
    }
  };

  const isShopify = onlinePlatform === 'shopify';
  const isWoo = onlinePlatform === 'woocommerce';
  const isOpenCart = onlinePlatform === 'opencart';
  const isCustom = onlinePlatform === 'custom';
  const isCSV = onlinePlatform === 'csv';
  const isMarketplace = onlinePlatform === 'marketplace';

  const handleCreateFanOffer = async () => {
    setMarketingStatus(null);
    if (!fanOfferConfig?.discount_pct) {
      setMarketingStatus('Fan offer discount not configured yet.');
      return;
    }
    const discountPct = Math.round(Number(fanOfferConfig.discount_pct));
    if (!Number.isFinite(discountPct) || discountPct <= 0) {
      setMarketingStatus('Fan offer discount not configured yet.');
      return;
    }
    try {
      const created = await createFanOffer({
        offer_title: `${seller.name} Fan Exclusive`,
        discount: `${discountPct}%`
      });
      setMarketingFanOffers(prev => [created, ...prev]);
      setMarketingStatus('Fan-only offer created.');
    } catch (err: any) {
      setMarketingStatus(err?.message || 'Unable to create fan offer.');
    }
  };

  const handleCreateCategorySpotlight = async (categoryOverride?: string) => {
    const category = categoryOverride || topCategories[0]?.category;
    if (!category) {
      setMarketingStatus('Add products to request a category spotlight.');
      return;
    }
    const budget = categorySpotlightConfig?.budget;
    if (!budget) {
      setMarketingStatus('Category spotlight pricing not configured yet.');
      return;
    }
    setMarketingStatus(null);
    try {
      const created = await createCategorySpotlight({ category, budget });
      setMarketingCategorySpotlights(prev => [created, ...prev]);
      setMarketingStatus(`Category spotlight requested for ${category}.`);
    } catch (err: any) {
      setMarketingStatus(err?.message || 'Unable to request category spotlight.');
    }
  };

  const handleAddProduct = () => {
    setEditingProduct(null);
    setFormData({ name: '', description: '', price: '', category: '', mediaUrl: '', stockLevel: 10, expiryDate: '', groupBuyEligible: false, groupBuyTiers: [] });
    setIsAddingProduct(true);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      category: product.category,
      mediaUrl: product.mediaUrl,
      stockLevel: product.stockLevel,
      expiryDate: product.expiryDate || '',
      groupBuyEligible: Boolean(product.groupBuyEligible),
      groupBuyTiers: Array.isArray(product.groupBuyTiers) ? product.groupBuyTiers : []
    });
    setIsAddingProduct(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const price = Number(formData.price);
    const stockLevel = Number(formData.stockLevel);
    setProductsStatus(null);
    try {
      if (editingProduct) {
        const updated = await updateSellerProduct(editingProduct.id, {
          alias: formData.name,
          category_id: formData.category,
          current_price: price,
          stock_level: stockLevel,
          group_buy_eligible: formData.groupBuyEligible,
          group_buy_tiers: formData.groupBuyTiers,
          expiry_date: formData.expiryDate
        });
        if (formData.mediaUrl) {
          await addSellerProductMedia(editingProduct.id, {
            url: formData.mediaUrl,
            media_type: formData.mediaUrl.endsWith('.mp4') ? 'video' : 'image'
          });
          if (editingProduct.productId) {
            const media = await listProductMedia(editingProduct.productId);
            setProductMediaByProductId(prev => ({ ...prev, [editingProduct.productId!]: media }));
          }
        }
        const nextProduct: Product = {
          ...editingProduct,
          name: updated.alias || formData.name,
          price: Number(updated.current_price ?? price),
          category: updated.category_id || formData.category,
          stockLevel: Number(updated.stock_level ?? stockLevel),
          stockStatus: (updated.stock_status as Product['stockStatus']) || editingProduct.stockStatus,
          discountPrice: updated.discount_price ?? undefined,
          isFeatured: updated.is_featured ?? editingProduct.isFeatured,
          mediaUrl: formData.mediaUrl || editingProduct.mediaUrl,
          expiryDate: updated.expiry_date ?? formData.expiryDate,
          groupBuyEligible: updated.group_buy_eligible ?? formData.groupBuyEligible,
          groupBuyTiers: updated.group_buy_tiers ?? formData.groupBuyTiers
        };
        setMyProducts(prev => {
          const next = prev.map(p => (p.id === editingProduct.id ? nextProduct : p));
          pushProducts(next);
          return next;
        });
      } else {
        const baseProduct = await createProduct({
          name: formData.name,
          description: formData.description,
          category_id: formData.category,
          tags: []
        });
        const productId = baseProduct?.id;
        if (!productId) {
          throw new Error('Unable to create product.');
        }
        const created = await createSellerProduct({
          product_id: productId,
          alias: formData.name,
          category_id: formData.category,
          current_price: price,
          stock_level: stockLevel || 10,
          group_buy_eligible: formData.groupBuyEligible,
          group_buy_tiers: formData.groupBuyTiers,
          expiry_date: formData.expiryDate
        });
        if (formData.mediaUrl) {
          await addSellerProductMedia(created.id, {
            url: formData.mediaUrl,
            media_type: formData.mediaUrl.endsWith('.mp4') ? 'video' : 'image'
          });
          const media = await listProductMedia(productId);
          setProductMediaByProductId(prev => ({ ...prev, [productId]: media }));
        }
        const newProduct: Product = {
          id: created.id,
          sellerId: seller.id,
          productId,
          name: created.alias || baseProduct?.name || formData.name,
          description: formData.description,
          price: Number(created.current_price ?? price),
          category: created.category_id || formData.category,
          mediaUrl: toPlaceholderImage(created.alias || productId),
          mediaType: 'image',
          tags: [],
          stockLevel: Number(created.stock_level ?? stockLevel),
          stockStatus: (created.stock_status as Product['stockStatus']) || 'in_stock',
          location: seller.location,
          expiryDate: created.expiry_date ?? formData.expiryDate,
          discountPrice: created.discount_price ?? undefined,
          isFeatured: created.is_featured,
          groupBuyEligible: created.group_buy_eligible ?? formData.groupBuyEligible,
          groupBuyTiers: created.group_buy_tiers ?? formData.groupBuyTiers
        };
        setMyProducts(prev => {
          const next = [newProduct, ...prev];
          pushProducts(next);
          return next;
        });
      }
      setIsAddingProduct(false);
      setProductsStatus('Product saved.');
      onToast?.('Product saved.');
    } catch (err: any) {
      setProductsStatus(err?.message || 'Unable to save product.');
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    setProductsStatus(null);
    try {
      await deleteSellerProduct(id);
      setMyProducts(prev => {
        const next = prev.filter(p => p.id !== id);
        pushProducts(next);
        return next;
      });
      setProductsStatus('Product removed.');
      onToast?.('Product removed.');
    } catch (err: any) {
      setProductsStatus(err?.message || 'Unable to delete product.');
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsStatus(null);
    try {
      const resolvedShopLat = shopLocationLat === '' ? undefined : Number(shopLocationLat);
      const resolvedShopLng = shopLocationLng === '' ? undefined : Number(shopLocationLng);
      const resolvedAddress = profileData.address.trim();
      await updateSellerProfile({
        name: profileData.name,
        description: profileData.description,
        place_id: profileData.placeId || undefined,
        default_region_id: profileData.defaultRegionId || undefined,
        location_mode: profileData.locationMode || undefined,
        shop_front_image_url: shopFrontImageUrl || undefined,
        directions_note: directionsNote || undefined,
        landmarks: shopLandmarks
          .filter(item => item.label.trim() || item.image_url.trim())
          .map((item, index) => ({
            id: item.id,
            label: item.label,
            type: item.type || 'landmark',
            image_url: item.image_url,
            lat: item.lat,
            lng: item.lng,
            sequence: item.sequence || index + 1
          }))
      });
      const existing = sellerLocations[0];
      if (resolvedAddress || resolvedShopLat !== undefined || resolvedShopLng !== undefined) {
        if (existing?.id) {
          await updateSellerLocation(existing.id, {
            address: resolvedAddress || existing.address || '',
            lat: resolvedShopLat ?? existing.lat,
            lng: resolvedShopLng ?? existing.lng,
            region_id: profileData.defaultRegionId || existing.region_id,
            place_id: profileData.placeId || existing.place_id,
            source: existing.source || 'manual_pin'
          });
        } else {
          await createSellerLocation({
            address: resolvedAddress,
            lat: resolvedShopLat ?? seller.location?.lat,
            lng: resolvedShopLng ?? seller.location?.lng,
            region_id: profileData.defaultRegionId,
            place_id: profileData.placeId,
            source: 'manual_pin'
          });
        }
      }
      const refreshedProfile = await getSellerProfile();
      const refreshedLocations = await listSellerLocations();
      const refreshedHistory = await listSellerLocationHistory().catch(() => []);
      setSellerLocations(refreshedLocations);
      setSellerLocationHistory(Array.isArray(refreshedHistory) ? refreshedHistory : []);
      setShopLocationLat(refreshedLocations[0]?.lat ?? '');
      setShopLocationLng(refreshedLocations[0]?.lng ?? '');
      setSeller(prev => ({
        ...prev,
        name: refreshedProfile?.name || profileData.name,
        description: refreshedProfile?.description || profileData.description,
        avatar: refreshedProfile?.logo_url || prev.avatar,
        location: refreshedLocations[0]
          ? { lat: refreshedLocations[0].lat || prev.location?.lat || 0, lng: refreshedLocations[0].lng || prev.location?.lng || 0, address: refreshedLocations[0].address || profileData.address }
          : prev.location
      }));
      setShopFrontImageUrl(refreshedProfile?.shop_front_image_url || shopFrontImageUrl);
      setDirectionsNote(refreshedProfile?.directions_note || directionsNote);
      setProfileData(prev => ({
        ...prev,
        address: refreshedLocations[0]?.address || prev.address,
        placeId: refreshedProfile?.place_id || prev.placeId,
        defaultRegionId: refreshedProfile?.default_region_id || prev.defaultRegionId,
        locationMode: refreshedProfile?.location_mode || prev.locationMode
      }));
      if (Array.isArray(refreshedProfile?.landmarks)) {
        setShopLandmarks(refreshedProfile.landmarks);
      }
      setSettingsStatus('Profile updated.');
    } catch (err: any) {
      setSettingsStatus(err?.message || 'Unable to update profile.');
    }
  };

  const refreshLocationCatalog = async () => {
    const [regions, places] = await Promise.all([
      listRegions().catch(() => []),
      listPlaces().catch(() => [])
    ]);
    setLocationRegions(Array.isArray(regions) ? regions : []);
    setLocationPlaces(Array.isArray(places) ? places : []);
  };

  const handleCreateRegion = async () => {
    setLocationAdminStatus(null);
    try {
      const isEditing = Boolean(editingRegionId);
      if (!regionDraft.name.trim()) {
        setLocationAdminStatus('Region name is required.');
        return;
      }
      const payload = {
        id: '',
        type: regionDraft.type,
        name: regionDraft.name.trim(),
        parent_id: regionDraft.parentId || undefined,
        centroid_lat: regionDraft.lat ? Number(regionDraft.lat) : undefined,
        centroid_lng: regionDraft.lng ? Number(regionDraft.lng) : undefined,
        metadata: {}
      };
      const created = editingRegionId
        ? await updateRegion(editingRegionId, payload as Region)
        : await createRegion(payload as Region);
      await refreshLocationCatalog();
      if (created?.id) {
        setProfileData(prev => ({ ...prev, defaultRegionId: created.id }));
      }
      setRegionDraft({ type: 'market_zone', name: '', parentId: '', lat: '', lng: '', locationLabel: '' });
      setEditingRegionId(null);
      setLocationAdminStatus(isEditing ? 'Region updated.' : 'Region created.');
    } catch (err: any) {
      setLocationAdminStatus(err?.message || 'Unable to create region.');
    }
  };

  const handleCreatePlace = async () => {
    setLocationAdminStatus(null);
    try {
      const isEditing = Boolean(editingPlaceId);
      if (!placeDraft.name.trim()) {
        setLocationAdminStatus('Place name is required.');
        return;
      }
      const payload = {
        id: '',
        type: placeDraft.type,
        name: placeDraft.name.trim(),
        region_id: placeDraft.regionId || undefined,
        address_line: placeDraft.addressLine || '',
        lat: placeDraft.lat ? Number(placeDraft.lat) : undefined,
        lng: placeDraft.lng ? Number(placeDraft.lng) : undefined,
        metadata: {}
      };
      const created = editingPlaceId
        ? await updatePlace(editingPlaceId, payload as Place)
        : await createPlace(payload as Place);
      await refreshLocationCatalog();
      if (created?.id) {
        setProfileData(prev => ({ ...prev, placeId: created.id, defaultRegionId: prev.defaultRegionId || placeDraft.regionId }));
      }
      setPlaceDraft({ type: 'pickup_point', name: '', regionId: '', addressLine: '', lat: '', lng: '', locationLabel: '' });
      setEditingPlaceId(null);
      setLocationAdminStatus(isEditing ? 'Place updated.' : 'Place created.');
    } catch (err: any) {
      setLocationAdminStatus(err?.message || 'Unable to create place.');
    }
  };

  const handleEditRegion = (region: Region) => {
    setEditingRegionId(region.id);
    setRegionDraft({
      type: region.type || 'market_zone',
      name: region.name || '',
      parentId: region.parent_id || '',
      lat: region.centroid_lat !== undefined && region.centroid_lat !== null ? String(region.centroid_lat) : '',
      lng: region.centroid_lng !== undefined && region.centroid_lng !== null ? String(region.centroid_lng) : '',
      locationLabel: region.name || ''
    });
    setLocationAdminStatus(`Editing region: ${region.name}`);
  };

  const handleEditPlace = (place: Place) => {
    setEditingPlaceId(place.id);
    setPlaceDraft({
      type: place.type || 'pickup_point',
      name: place.name || '',
      regionId: place.region_id || '',
      addressLine: place.address_line || '',
      lat: place.lat !== undefined && place.lat !== null ? String(place.lat) : '',
      lng: place.lng !== undefined && place.lng !== null ? String(place.lng) : '',
      locationLabel: place.address_line || place.name || ''
    });
    setLocationAdminStatus(`Editing place: ${place.name}`);
  };

  const handleDeleteRegion = async (id: string) => {
    setLocationAdminStatus(null);
    try {
      await deleteRegion(id);
      await refreshLocationCatalog();
      setProfileData(prev => (prev.defaultRegionId === id ? { ...prev, defaultRegionId: '' } : prev));
      setLocationAdminStatus('Region deleted.');
    } catch (err: any) {
      setLocationAdminStatus(err?.message || 'Unable to delete region.');
    }
  };

  const handleDeletePlace = async (id: string) => {
    setLocationAdminStatus(null);
    try {
      await deletePlace(id);
      await refreshLocationCatalog();
      setProfileData(prev => (prev.placeId === id ? { ...prev, placeId: '' } : prev));
      setLocationAdminStatus('Place deleted.');
    } catch (err: any) {
      setLocationAdminStatus(err?.message || 'Unable to delete place.');
    }
  };

  const handleSavePreferences = async (e: React.FormEvent) => {
    e.preventDefault();
    setSellerPreferencesStatus(null);
    setSellerPreferencesSaving(true);
    try {
      const payload = {
        marketing: {
          kpi_range: sellerPreferencesDraft.marketing.kpi_range,
          campaign_duration_days: Number(sellerPreferencesDraft.marketing.campaign_duration_days),
          top_products_days: Number(sellerPreferencesDraft.marketing.top_products_days),
          top_products_limit: Number(sellerPreferencesDraft.marketing.top_products_limit),
          broadcast_limit: Number(sellerPreferencesDraft.marketing.broadcast_limit),
          quick_boost_budget: Number(sellerPreferencesDraft.marketing.quick_boost_budget)
        },
        growth: {
          projection_type: sellerPreferencesDraft.growth.projection_type,
          loan_request_ratio: Number(sellerPreferencesDraft.growth.loan_request_ratio)
        },
        comms: {
          broadcast_limit: Number(sellerPreferencesDraft.comms.broadcast_limit)
        },
        analytics: {
          sales_series_days: Number(sellerPreferencesDraft.analytics.sales_series_days),
          sales_velocity_days: Number(sellerPreferencesDraft.analytics.sales_velocity_days),
          peak_hours_days: Number(sellerPreferencesDraft.analytics.peak_hours_days),
          inventory_series_days: Number(sellerPreferencesDraft.analytics.inventory_series_days),
          conversion_series_days: Number(sellerPreferencesDraft.analytics.conversion_series_days)
        },
        procurement: {
          max_distance_km: Number(sellerPreferencesDraft.procurement.max_distance_km),
          max_unit_cost: Number(sellerPreferencesDraft.procurement.max_unit_cost),
          max_moq: Number(sellerPreferencesDraft.procurement.max_moq),
          max_lead_time_days: Number(sellerPreferencesDraft.procurement.max_lead_time_days),
          min_rating: Number(sellerPreferencesDraft.procurement.min_rating),
          verified_only: Boolean(sellerPreferencesDraft.procurement.verified_only)
        }
      };
      const saved = await updateSellerPreferences(payload);
      setSellerPreferences(saved);
      if (saved.analytics) {
        const salesDays = Number(saved.analytics.sales_series_days);
        const velocityDays = Number(saved.analytics.sales_velocity_days);
        const peakDays = Number(saved.analytics.peak_hours_days);
        const inventoryDays = Number(saved.analytics.inventory_series_days);
        const conversionDays = Number(saved.analytics.conversion_series_days);
        if (Number.isFinite(salesDays) && salesDays > 0) setSalesSeriesDays(salesDays);
        if (Number.isFinite(velocityDays) && velocityDays > 0) setSalesVelocityDays(velocityDays);
        if (Number.isFinite(peakDays) && peakDays > 0) setPeakHoursDays(peakDays);
        if (Number.isFinite(inventoryDays) && inventoryDays > 0) setInventorySeriesDays(inventoryDays);
        if (Number.isFinite(conversionDays) && conversionDays > 0) setConversionSeriesDays(conversionDays);
      }
      setSellerPreferencesDraft(prev => ({
        marketing: {
          ...prev.marketing,
          ...(saved.marketing ?? {}),
          kpi_range: String(saved.marketing?.kpi_range ?? prev.marketing.kpi_range ?? '30d'),
          campaign_duration_days: Number(saved.marketing?.campaign_duration_days ?? prev.marketing.campaign_duration_days ?? 7),
          top_products_days: Number(saved.marketing?.top_products_days ?? prev.marketing.top_products_days ?? 30),
          top_products_limit: Number(saved.marketing?.top_products_limit ?? prev.marketing.top_products_limit ?? 5),
          broadcast_limit: Number(saved.marketing?.broadcast_limit ?? prev.marketing.broadcast_limit ?? 50),
          quick_boost_budget: Number(saved.marketing?.quick_boost_budget ?? prev.marketing.quick_boost_budget ?? 500)
        },
        growth: {
          ...prev.growth,
          ...(saved.growth ?? {}),
          projection_type: String(saved.growth?.projection_type ?? prev.growth.projection_type ?? 'cashflow'),
          loan_request_ratio: Number(saved.growth?.loan_request_ratio ?? prev.growth.loan_request_ratio ?? 0.5)
        },
        comms: {
          ...prev.comms,
          ...(saved.comms ?? {}),
          broadcast_limit: Number(saved.comms?.broadcast_limit ?? prev.comms.broadcast_limit ?? 50)
        },
        analytics: {
          ...prev.analytics,
          ...(saved.analytics ?? {}),
          sales_series_days: Number(saved.analytics?.sales_series_days ?? prev.analytics.sales_series_days ?? 7),
          sales_velocity_days: Number(saved.analytics?.sales_velocity_days ?? prev.analytics.sales_velocity_days ?? 7),
          peak_hours_days: Number(saved.analytics?.peak_hours_days ?? prev.analytics.peak_hours_days ?? 7),
          inventory_series_days: Number(saved.analytics?.inventory_series_days ?? prev.analytics.inventory_series_days ?? 14),
          conversion_series_days: Number(saved.analytics?.conversion_series_days ?? prev.analytics.conversion_series_days ?? 14)
        },
        procurement: {
          ...prev.procurement,
          ...(saved.procurement ?? {}),
          max_distance_km: Number(saved.procurement?.max_distance_km ?? prev.procurement.max_distance_km ?? 50),
          max_unit_cost: Number(saved.procurement?.max_unit_cost ?? prev.procurement.max_unit_cost ?? 500),
          max_moq: Number(saved.procurement?.max_moq ?? prev.procurement.max_moq ?? 50),
          max_lead_time_days: Number(saved.procurement?.max_lead_time_days ?? prev.procurement.max_lead_time_days ?? 14),
          min_rating: Number(saved.procurement?.min_rating ?? prev.procurement.min_rating ?? 0),
          verified_only: Boolean(saved.procurement?.verified_only ?? prev.procurement.verified_only ?? false)
        }
      }));
      setSellerPreferencesStatus('Preferences saved.');
      onToast?.('Preferences saved.');
    } catch (err: any) {
      setSellerPreferencesStatus(err?.message || 'Unable to save preferences.');
    } finally {
      setSellerPreferencesSaving(false);
    }
  };

  const handleReceiptUpload = async (file: File) => {
    setReceiptUploadStatus(null);
    setReceiptUploading(true);
    try {
      const key = await uploadReceiptFile(file);
      await submitReceipt({ s3_key: key });
      setReceiptUploadStatus('Receipt uploaded. OCR processing queued.');
      onToast?.('Receipt uploaded for processing.');
      loadSellerRewards();
    } catch (err: any) {
      setReceiptUploadStatus(err?.message || 'Unable to upload receipt.');
    } finally {
      setReceiptUploading(false);
    }
  };

  const applyPriceMatch = async () => {
    if (myProducts.length === 0) {
      onToast?.('Add a product first to match market pricing.');
      return;
    }
    const target = myProducts.find(p => typeof p.competitorPrice === 'number') || myProducts[0];
    const matchPrice = Number(target.competitorPrice ?? priceMatchValue ?? 0);
    if (!matchPrice) {
      onToast?.('No market price available to match yet.');
      return;
    }
    const nextPrice = Math.max(1, matchPrice);
    setProductsStatus(null);
    try {
      const updated = await updateSellerProductPrice(target.id, { current_price: nextPrice });
      setMyProducts(prev => {
        const next = prev.map(p => p.id === target.id ? { ...p, price: Number(updated.current_price ?? nextPrice) } : p);
        pushProducts(next);
        return next;
      });
      setProductsStatus(`Price updated for ${target.name}.`);
      onToast?.(`Price updated for ${target.name}.`);
    } catch (err: any) {
      setProductsStatus(err?.message || 'Unable to update price.');
    }
  };

  const handleOpenProductsTab = () => {
    setActiveTab('products');
  };

  const findProductForAction = (productId?: string, name?: string) => {
    if (!productId && !name) return null;
    const byId = myProducts.find((p) => p.id === productId || p.productId === productId);
    if (byId) return byId;
    if (!name) return null;
    const target = name.trim().toLowerCase();
    return myProducts.find((p) => p.name.trim().toLowerCase() === target) || null;
  };

  const handleActionCard = (item: { action?: string; product_id?: string; name?: string; value?: number }) => {
    const action = String(item.action || '').toLowerCase();
    const product = findProductForAction(item.product_id, item.name);
    setActiveTab('products');
    if (!product) {
      setProductsStatus('Open product list to apply this recommendation manually.');
      return;
    }

    handleEditProduct(product);

    if (action === 'stock_more') {
      const suggested = Number(item.value ?? 0);
      if (Number.isFinite(suggested) && suggested > 0) {
        const nextStock = Math.max(0, Number(product.stockLevel || 0) + Math.round(suggested));
        setFormData((prev) => ({ ...prev, stockLevel: nextStock }));
      }
      setProductsStatus(`Restock suggestion loaded for ${product.name}.`);
      return;
    }

    if (action === 'raise_price' || action === 'lower_price') {
      const delta = Number(item.value ?? 0);
      if (Number.isFinite(delta) && delta > 0) {
        const sign = action === 'raise_price' ? 1 : -1;
        const nextPrice = Math.max(1, Number(product.price || 0) + sign * delta);
        setFormData((prev) => ({ ...prev, price: nextPrice.toFixed(2) }));
      }
      setProductsStatus(`Price recommendation loaded for ${product.name}.`);
      return;
    }

    if (action === 'reduce_drop') {
      setProductsStatus(`Review ${product.name} for markdown or replacement.`);
      return;
    }

    setProductsStatus('Recommendation loaded for review.');
  };

  const handleQuickBoost = () => {
    setActiveTab('marketing');
    setCampaignForm(prev => ({
      ...prev,
      name: quickBoostLabel,
      budget: quickBoostBudget > 0 ? quickBoostBudget : prev.budget,
      productId: prev.productId || (myProducts[0]?.id ?? '')
    }));
  };

  const applyBulkUpdate = async () => {
    setProductsStatus(null);
    try {
      const result = await bulkStockUpdateSellerProducts();
      const refreshed = await listSellerProducts();
      const mapped = mapSellerProducts(refreshed);
      setMyProducts(mapped);
      pushProducts(mapped);
      await loadMediaForProducts(mapped);
      const [lowStock] = await Promise.all([
        listSellerLowStock()
      ]);
      setProductLowStock(lowStock);
      setProductsStatus(result?.batch_id ? `Bulk update started. Batch ${result.batch_id}.` : 'Bulk update started.');
      onToast?.('Bulk update queued.');
    } catch (err: any) {
      setProductsStatus(err?.message || 'Unable to run bulk update.');
    }
  };

  const handleRestockProduct = async (product: Product) => {
    const nextStock = product.stockLevel + 10;
    setProductsStatus(null);
    try {
      const updated = await updateSellerProductStock(product.id, { stock_level: nextStock });
      setMyProducts(prev => {
        const next = prev.map(p =>
          p.id === product.id
            ? {
                ...p,
                stockLevel: Number(updated.stock_level ?? nextStock),
                stockStatus: (updated.stock_status as Product['stockStatus']) || product.stockStatus
              }
            : p
        );
        pushProducts(next);
        return next;
      });
      setProductsStatus(`Restocked ${product.name}.`);
    } catch (err: any) {
      setProductsStatus(err?.message || 'Unable to restock product.');
    }
  };

  const handleCsvImport = async () => {
    setProductsStatus(null);
    try {
      const result = await bulkImportSellerProducts();
      setProductsStatus(result?.import_id ? `CSV import queued. Import ${result.import_id}.` : 'CSV import queued.');
      onToast?.('CSV import queued.');
    } catch (err: any) {
      setProductsStatus(err?.message || 'Unable to import CSV.');
    }
  };

  const handleBroadcast = async () => {
    const message = broadcastMessage.trim();
    if (!message) {
      setCommsStatus('Message is required.');
      return;
    }
    setCommsStatus(null);
    try {
      const limit = Number.isFinite(broadcastsLimit) && broadcastsLimit > 0 ? broadcastsLimit : 50;
      await createBroadcast({
        name: message.slice(0, 60),
        channel: 'whatsapp',
        segment_criteria: { content: message }
      });
      const sent = await sendWhatsApp({ content: message });
      if (sent?.id) {
        try {
          const status = await getCommsWhatsAppStatus(sent.id);
          if (status?.status) {
            setCommsStatus(`Broadcast ${status.status}.`);
          }
        } catch {}
      }
      const items = await listBroadcasts(limit);
      setBroadcasts(items);
      setBroadcastCount(items.length);
      onToast?.('Broadcast sent to followers.');
    } catch (err: any) {
      setCommsStatus(err?.message || 'Broadcast failed.');
    }
  };

  const handleVerifySeller = async () => {
    setSettingsStatus(null);
    try {
      await requestSellerVerification();
      const status = await getSellerVerificationStatus();
      setVerificationStatus(status);
      if (status?.verified || status?.status === 'verified') {
        onVerifiedSellerIdsChange(Array.from(new Set([...verifiedSellerIds, seller.id])));
        setSeller(prev => ({ ...prev, isVerified: true }));
        onToast?.('Verification completed.');
      } else {
        onToast?.('Verification request submitted.');
      }
    } catch (err: any) {
      setSettingsStatus(err?.message || 'Unable to request verification.');
    }
  };

  const persistNotificationPrefs = async (next: SellerNotificationPreferences) => {
    const previous = { ...notificationPrefs };
    setNotificationPrefs(next);
    setNotificationsUpdating(true);
    setSettingsStatus(null);
    try {
      await updateSellerNotificationPreferences(next);
      setSettingsStatus('Notification preferences updated.');
    } catch (err: any) {
      setSettingsStatus(err?.message || 'Unable to update notifications.');
      setNotificationPrefs(previous);
    } finally {
      setNotificationsUpdating(false);
    }
  };

  const toggleNotificationPref = async (field: keyof SellerNotificationPreferences) => {
    const current = Boolean(notificationPrefs[field]);
    await persistNotificationPrefs({
      ...notificationPrefs,
      [field]: !current
    });
  };

  const updateNotificationPrefField = async (field: keyof SellerNotificationPreferences, value: string) => {
    await persistNotificationPrefs({
      ...notificationPrefs,
      [field]: value
    });
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const requestLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setUserCoords(null),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const baseLocation = userCoords || seller.location || null;
  useEffect(() => {
    if (activeTab !== 'suppliers') return;
    let ignore = false;
    const loadDirectory = async () => {
      setSellerDirectoryLoading(true);
      setSellerDirectoryStatus(null);
      try {
        const results = await searchShops({
          category: sellerFilters.category || undefined,
          minRating: sellerFilters.minRating || undefined,
          verified: sellerFilters.verifiedOnly || undefined,
          lat: baseLocation?.lat,
          lng: baseLocation?.lng,
          radiusKm: sellerFilters.maxDistance || undefined,
          sort: 'rating'
        });
        if (ignore) return;
        const mapped = results.map((shop) => {
          const loc = typeof shop.location === 'object' ? shop.location : {};
          const lat = Number((loc as any)?.lat ?? (loc as any)?.latitude);
          const lng = Number((loc as any)?.lng ?? (loc as any)?.longitude);
          const distanceKm = baseLocation && Number.isFinite(lat) && Number.isFinite(lng)
            ? calculateDistance(baseLocation.lat, baseLocation.lng, lat, lng)
            : null;
          const rating = Number(shop.rating ?? 0);
          const distanceScore = distanceKm !== null && sellerFilters.maxDistance
            ? Math.max(0, 100 - (distanceKm / Math.max(sellerFilters.maxDistance, 1)) * 100)
            : 40;
          const score = rating * 20 * 0.6 + distanceScore * 0.4;
          return { shop, distanceKm, score };
        }).sort((a, b) => b.score - a.score);
        setSellerDirectory(mapped);
      } catch (err: any) {
        if (!ignore) {
          setSellerDirectory([]);
          setSellerDirectoryStatus(err?.message || 'Unable to load sellers.');
        }
      } finally {
        if (!ignore) setSellerDirectoryLoading(false);
      }
    };
    loadDirectory();
    return () => {
      ignore = true;
    };
  }, [activeTab, sellerFilters.category, sellerFilters.minRating, sellerFilters.verifiedOnly, sellerFilters.maxDistance, baseLocation?.lat, baseLocation?.lng]);

  const sellerDirectoryCategories = Array.from(new Set(
    sellerDirectory.map(({ shop }) => shop.category).filter((cat): cat is string => Boolean(cat))
  ));
  const suppliersById = suppliersData.reduce<Record<string, Supplier>>((acc, supplier) => {
    if (supplier.id) acc[supplier.id] = supplier;
    return acc;
  }, {});
  const getSupplierName = (id: string) => suppliersById[id]?.name || id;
  const rfqDetailsValid = Boolean(rfqDraft.title && rfqDraft.deliveryLocation && rfqDraft.items.every(i => i.name && i.quantity));
  const rfqSuppliersValid = rfqDraft.supplierIds.length > 0;

  const formatRfqTitle = (notes?: string, category?: string) => {
    if (notes) {
      const line = notes.split('\n').find(l => l.toLowerCase().startsWith('title:'));
      if (line) return line.replace(/title:/i, '').trim();
      const first = notes.split('\n')[0]?.trim();
      if (first) return first;
    }
    if (category) return `${category} RFQ`;
    return 'RFQ Request';
  };

  const buildRfqUpdates = async (threads: RFQThread[]) => {
    const validThreads = threads.filter(thread => thread.id);
    if (validThreads.length === 0) {
      return { responsesById: {}, comparisonsById: {} } as {
        responsesById: Record<string, RFQResponse[]>;
        comparisonsById: Record<string, RFQComparison>;
      };
    }
    const responseEntries = await Promise.all(
      validThreads.map(async (thread) => {
        if (!thread.id) return null;
        try {
          const responses = await listRFQResponses(thread.id);
          return [thread.id, (responses || []) as RFQResponse[]] as const;
        } catch {
          return [thread.id, [] as RFQResponse[]] as const;
        }
      })
    );
    const comparisonEntries = await Promise.all(
      validThreads.map(async (thread) => {
        if (!thread.id) return null;
        try {
          const comparison = await getRFQComparison(thread.id);
          return [thread.id, comparison] as const;
        } catch {
          return null;
        }
      })
    );
    const responsesById = responseEntries.reduce<Record<string, RFQResponse[]>>((acc, entry) => {
      if (entry) acc[entry[0]] = entry[1];
      return acc;
    }, {});
    const comparisonsById = comparisonEntries.reduce<Record<string, RFQComparison>>((acc, entry) => {
      if (entry) acc[entry[0]] = entry[1];
      return acc;
    }, {});
    return { responsesById, comparisonsById };
  };

  const rfqThreads = rfqThreadsRemote.map((thread, idx) => {
    const id = thread.id || `rfq-${idx}`;
    const responsesSource =
      (rfqResponsesById[id] && rfqResponsesById[id].length > 0)
        ? rfqResponsesById[id]
        : (rfqComparisonById[id]?.ranked || []);
    const items = rfqItemsById[id] ?? (thread.category ? [{
      name: thread.category,
      quantity: Number(thread.quantity ?? 0),
      unit: 'units'
    }] : []);
    const responses = responsesSource.map((resp) => {
      const supplierId = resp.supplier_id || '';
      const supplier = supplierId ? suppliersById[supplierId] : undefined;
      const delivery = supplierId ? supplierDeliveryById[supplierId] : undefined;
      const offers = supplierId ? (supplierOffersById[supplierId] || []) : [];
      const bestOffer = [...offers].sort((a, b) => Number(a.unit_cost ?? 0) - Number(b.unit_cost ?? 0))[0];
      const distanceKm = baseLocation && supplier?.lat && supplier?.lng
        ? calculateDistance(baseLocation.lat, baseLocation.lng, supplier.lat, supplier.lng)
        : undefined;
      return {
        id: resp.id,
        supplierId,
        price: Number(resp.price_per_unit ?? 0),
        etaHours: Number(resp.eta_hours ?? 0),
        rating: Number(resp.supplier_rating ?? supplier?.rating ?? 0),
        moq: resp.moq,
        paymentTerms: delivery?.payment_terms,
        leadTimeDays: Number.isFinite(Number(resp.lead_time_days)) ? Number(resp.lead_time_days) : delivery?.lead_time_days,
        verified: resp.verified_supplier ?? supplier?.verified ?? false,
        distanceKm,
        status: resp.status || 'responded',
        respondedAt: resp.submitted_at,
        stock: bestOffer?.available_units,
        deliveryFee: resp.delivery_fee,
        compositeScore: resp.composite_score
      };
    });
    return {
      id,
      title: formatRfqTitle(thread.notes, thread.category),
      status: thread.status || 'pending',
      createdAt: thread.created_at,
      expiresAt: thread.expiry_at,
      deliveryLocation: thread.delivery_address || '',
      type: thread.category || 'general',
      items,
      responses
    };
  });

  const rfqActive = rfqThreads.filter(t => t.status === 'active');
  const rfqResponses = rfqThreads.reduce((sum, t) => sum + t.responses.length, 0);
  const rfqBestSavings = rfqThreads.reduce((sum, t) => {
    const prices = t.responses.map(r => r.price).filter(p => Number.isFinite(p));
    if (prices.length < 2) return sum;
    const max = Math.max(...prices);
    const min = Math.min(...prices);
    return sum + (max - min);
  }, 0);
  const selectedThread = rfqThreads.find(t => t.id === selectedThreadId) || null;

  const handleCreateRfq = async () => {
    if (!rfqDetailsValid) return;
    setRfqLoading(true);
    setRfqStatus(null);
    const items = rfqDraft.items.map(item => ({
      name: item.name.trim(),
      quantity: Number(item.quantity),
      unit: item.unit.trim() || 'units'
    })).filter(item => item.name && Number.isFinite(item.quantity));
    const totalQuantity = items.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
    const notes = [
      rfqDraft.title ? `Title: ${rfqDraft.title}` : null,
      rfqDraft.type ? `Type: ${rfqDraft.type}` : null,
      items.length ? `Items: ${items.map(item => `${item.name} (${item.quantity} ${item.unit})`).join('; ')}` : null
    ].filter(Boolean).join('\n');
    try {
      const created = await createRFQ({
        category: items[0]?.name || rfqDraft.title || 'General',
        quantity: totalQuantity || 1,
        delivery_lat: baseLocation?.lat,
        delivery_lng: baseLocation?.lng,
        delivery_address: rfqDraft.deliveryLocation,
        notes,
        invited_suppliers: rfqDraft.supplierIds,
        items
      });
      if (created?.id) {
        const createdId = String(created.id);
        setRfqThreadsRemote(prev => [created, ...prev]);
        setRfqItemsById(prev => ({ ...prev, [createdId]: items }));
        setSelectedThreadId(createdId);
      }
      setShowRfqModal(false);
      setRfqStep('details');
      setRfqDraft({
        type: 'single',
        title: '',
        deliveryLocation: '',
        items: [{ name: '', quantity: 1, unit: 'units' }],
        supplierIds: []
      });
    } catch (err: any) {
      setRfqStatus(err?.message || 'Unable to create RFQ.');
    } finally {
      setRfqLoading(false);
    }
  };

  const handleRefreshRfqs = async () => {
    if (rfqThreadsRemote.length === 0) return;
    setRfqStatus(null);
    setRfqLoading(true);
    try {
      const { responsesById, comparisonsById } = await buildRfqUpdates(rfqThreadsRemote);
      setRfqResponsesById(responsesById);
      setRfqComparisonById(comparisonsById);
      setRfqLastUpdated(new Date());
    } catch (err: any) {
      setRfqStatus(err?.message || 'Unable to refresh RFQs.');
    } finally {
      setRfqLoading(false);
    }
  };

  const handleAcceptRfqResponse = async (threadId: string, responseId?: string) => {
    if (!responseId) return;
    setRfqStatus(null);
    try {
      await acceptRFQResponse(threadId, responseId);
      setRfqResponsesById(prev => ({
        ...prev,
        [threadId]: (prev[threadId] || []).map(resp =>
          resp.id === responseId ? { ...resp, status: 'accepted' } : resp
        )
      }));
      setRfqComparisonById(prev => {
        const current = prev[threadId];
        if (!current) return prev;
        return {
          ...prev,
          [threadId]: {
            ...current,
            ranked: (current.ranked || []).map(resp =>
              resp.id === responseId ? { ...resp, status: 'accepted' } : resp
            )
          }
        };
      });
      onToast?.('Supplier selected.');
    } catch (err: any) {
      setRfqStatus(err?.message || 'Unable to select supplier.');
    }
  };

  const handleDeclineRfqResponse = async (threadId: string, responseId?: string) => {
    if (!responseId) return;
    setRfqStatus(null);
    try {
      await declineRFQResponse(threadId, responseId);
      setRfqResponsesById(prev => ({
        ...prev,
        [threadId]: (prev[threadId] || []).filter(resp => resp.id !== responseId)
      }));
      setRfqComparisonById(prev => {
        const current = prev[threadId];
        if (!current) return prev;
        return {
          ...prev,
          [threadId]: {
            ...current,
            ranked: (current.ranked || []).filter(resp => resp.id !== responseId)
          }
        };
      });
    } catch (err: any) {
      setRfqStatus(err?.message || 'Unable to decline response.');
    }
  };

  const supplierCategoryOptions = Array.from(new Set([
    ...suppliersData.map(s => s.category).filter(Boolean) as string[],
    ...Object.values(supplierOffersById).flat().map(offer => offer.category).filter(Boolean) as string[]
  ]));

  const supplierMatches = suppliersData.map((supplier) => {
    const offers = supplier.id ? (supplierOffersById[supplier.id] || []) : [];
    const filteredOffers = supplierFilters.category
      ? offers.filter(o => o.category === supplierFilters.category)
      : offers;
    const bestOffer = [...filteredOffers].sort((a, b) => Number(a.unit_cost ?? 0) - Number(b.unit_cost ?? 0))[0];
    const delivery = supplier.id ? supplierDeliveryById[supplier.id] : undefined;
    const distance = baseLocation && supplier.lat && supplier.lng
      ? calculateDistance(baseLocation.lat, baseLocation.lng, supplier.lat, supplier.lng)
      : null;
    const priceScore = bestOffer && supplierFilters.maxUnitCost
      ? Math.max(0, 100 - (Number(bestOffer.unit_cost ?? 0) / supplierFilters.maxUnitCost) * 100)
      : 50;
    const leadDays = Number(delivery?.lead_time_days ?? 0);
    const leadScore = Number.isFinite(leadDays) ? Math.max(0, 100 - leadDays * 6) : 50;
    const distanceScore = distance !== null && supplierFilters.maxDistance
      ? Math.max(0, 100 - (distance / supplierFilters.maxDistance) * 100)
      : 40;
    const ratingScore = Number(supplier.rating ?? 0) * 20 * 0.4;
    const score = ratingScore + priceScore * 0.25 + leadScore * 0.2 + distanceScore * 0.15 + (supplier.verified ? 5 : 0);
    return { supplier, bestOffer, delivery, distance, score };
  }).filter(({ supplier, bestOffer, delivery, distance }) => {
    if (supplierFilters.category) {
      const categoryMatch = supplier.category === supplierFilters.category
        || (bestOffer?.category && bestOffer.category === supplierFilters.category);
      if (!categoryMatch) return false;
    }
    if (supplierFilters.verifiedOnly && !supplier.verified) return false;
    if (supplierFilters.paymentTerms && delivery?.payment_terms !== supplierFilters.paymentTerms) return false;
    if (supplierFilters.minRating && Number(supplier.rating ?? 0) < supplierFilters.minRating) return false;
    if (supplierFilters.maxLeadTime && Number(delivery?.lead_time_days ?? 0) > supplierFilters.maxLeadTime) return false;
    if (supplierFilters.maxMOQ && bestOffer?.moq && bestOffer.moq > supplierFilters.maxMOQ) return false;
    if (supplierFilters.maxUnitCost && bestOffer?.unit_cost && Number(bestOffer.unit_cost) > supplierFilters.maxUnitCost) return false;
    if (supplierFilters.maxDistance && distance !== null && distance > supplierFilters.maxDistance) return false;
    return true;
  }).sort((a, b) => b.score - a.score);

  const rfqDraftPreviewResponses = rfqDraft.supplierIds.map((supplierId, index) => {
    const supplier = suppliersById[supplierId];
    const offers = supplierOffersById[supplierId] || [];
    const bestOffer = [...offers].sort((a, b) => Number(a.unit_cost ?? 0) - Number(b.unit_cost ?? 0))[0];
    const delivery = supplierDeliveryById[supplierId];
    const distanceKm = baseLocation && supplier?.lat && supplier?.lng
      ? calculateDistance(baseLocation.lat, baseLocation.lng, supplier.lat, supplier.lng)
      : undefined;
    return {
      supplierId,
      price: Number(bestOffer?.unit_cost ?? 0),
      etaHours: delivery?.lead_time_days ? delivery.lead_time_days * 24 : undefined,
      rating: Number(supplier?.rating ?? 0),
      moq: bestOffer?.moq,
      paymentTerms: delivery?.payment_terms,
      leadTimeDays: delivery?.lead_time_days,
      verified: supplier?.verified ?? false,
      distanceKm,
      status: index === 0 ? 'pending' : 'pending',
      respondedAt: undefined,
      stock: bestOffer?.available_units
    };
  });

  const sellersWithMeta = sellerDirectory;



  const handleReply = async (review: any) => {
    const replyText = replyDrafts[review.id];
    if (!replyText?.trim()) return;
    try {
      await replyProductReview(review.id, { comment: replyText });
      const reply = {
        id: `rep_${Date.now()}`,
        sellerName: seller.name,
        comment: replyText,
        timestamp: Date.now()
      };
      setReplyDrafts(prev => ({ ...prev, [review.id]: '' }));
      setSellerReviews(prev => prev.map(r => r.id === review.id ? { ...r, replies: [...(r.replies || []), reply] } : r));
    } catch (err: any) {
      setSettingsStatus(err?.message || 'Unable to reply to review.');
    }
  };

  const handleShopReply = async (review: any) => {
    const replyText = replyDrafts[review.id];
    if (!replyText?.trim()) return;
    try {
      await replyShopReview(seller.id, review.id, { comment: replyText });
      const reply = {
        id: `rep_${Date.now()}`,
        sellerName: seller.name,
        comment: replyText,
        timestamp: Date.now()
      };
      setReplyDrafts(prev => ({ ...prev, [review.id]: '' }));
      setShopReviews(prev => prev.map(r => r.id === review.id ? { ...r, replies: [...(r.replies || []), reply] } : r));
    } catch (err: any) {
      setSettingsStatus(err?.message || 'Unable to reply to shop review.');
    }
  };

  const showMarketFields = buyerReachSelections.includes('market_stall')
    || sellerModeSelections.includes('open_market_stall')
    || sellerModeSelections.includes('ground_trader')
    || sellerModeSelections.includes('hybrid');
  const showDeliveryConfig = Boolean(deliveryDetails.offers_delivery)
    || buyerReachSelections.includes('delivery_only')
    || sellerModeSelections.includes('solopreneur')
    || sellerModeSelections.includes('hybrid');
  const tabs = [
    { id: 'onboarding', icon: Sparkles, label: 'Onboarding' },
    { id: 'products', icon: Package, label: 'Products' },
    { id: 'analytics', icon: BarChart3, label: 'Intelligence' },
    { id: 'rewards', icon: Star, label: 'Rewards' },
    { id: 'marketing', icon: Megaphone, label: 'Marketing' },
    { id: 'growth', icon: Wallet, label: 'Growth' },
    { id: 'suppliers', icon: MapPin, label: 'Suppliers' },
    { id: 'comms', icon: MessageSquare, label: 'Comms' },
    ...(offlineEnabled ? [{ id: 'offline', icon: Clock, label: 'Offline' }] : []),
    { id: 'settings', icon: Settings, label: 'Shop Profile' }
  ];

  return (
    <div className="h-full bg-zinc-50 flex flex-col">
      {/* Sidebar / Nav */}
      <div className="flex border-b bg-white overflow-x-auto no-scrollbar">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => selectTab(tab.id)}
            className={`flex-none px-6 flex flex-col items-center py-3 gap-1 transition-colors ${
              activeTab === tab.id ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-zinc-400'
            }`}
          >
            <tab.icon className="w-5 h-5" />
            <span className="text-[10px] font-bold uppercase tracking-wider">{tab.label}</span>
          </button>
        ))}
      </div>

      <input
        ref={receiptUploadInputRef}
        type="file"
        accept="image/*,application/pdf"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleReceiptUpload(file);
          if (e.currentTarget) e.currentTarget.value = '';
        }}
      />

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-6 no-scrollbar">
        {activeTab === 'onboarding' && (
          <div className="space-y-6 pb-20">
            <div>
              <h2 className="text-2xl font-black text-zinc-900">Seller Onboarding & Presence</h2>
              <p className="text-xs text-zinc-500 font-bold mt-1">Zero-effort setup via WhatsApp or basic phone.</p>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] font-bold text-zinc-500">
                {typeof onboardingState?.completion === 'number' && (
                  <span className="px-2 py-1 bg-zinc-100 rounded-full">
                    Completion: {Math.round(onboardingState.completion * 100)}%
                  </span>
                )}
                {typeof onboardingEligible === 'boolean' && (
                  <span className={`px-2 py-1 rounded-full ${onboardingEligible ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                    {onboardingEligible ? 'Eligible' : 'Not eligible'}
                  </span>
                )}
                {verificationStatus?.status && (
                  <span className="px-2 py-1 bg-indigo-50 text-indigo-600 rounded-full">
                    Verification: {verificationStatus.status}
                  </span>
                )}
              </div>
              {onboardingStatus && (
                <div className="mt-3 p-3 bg-emerald-50 border border-emerald-100 rounded-2xl text-[10px] font-bold text-emerald-700">
                  {onboardingStatus}
                </div>
              )}
              {onboardingState?.steps && (
                <div className="mt-3 grid grid-cols-2 gap-2 text-[10px] font-bold text-zinc-600">
                  {Object.entries(onboardingState.steps).map(([step, status]) => (
                    <div key={step} className="flex items-center justify-between bg-zinc-50 rounded-2xl px-3 py-2">
                      <span className="capitalize">{step.replace(/_/g, ' ')}</span>
                      <span className={status === 'complete' ? 'text-emerald-600' : 'text-amber-500'}>
                        {status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              {typeof onboardingState?.completion === 'number' && (
                <div className="mt-3">
                  <div className="flex items-center justify-between text-[10px] font-bold text-zinc-500">
                    <span>Progress</span>
                    <span>{Math.round(onboardingState.completion * 100)}%</span>
                  </div>
                  <div className="mt-2 h-2 bg-zinc-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full"
                      style={{ width: `${Math.min(100, Math.max(0, onboardingState.completion * 100))}%` }}
                    />
                  </div>
                </div>
              )}
              {onboardingTutorials.length > 0 && (
                <div className="mt-3 space-y-2">
                  {onboardingTutorials.map(tutorial => (
                    <div key={tutorial.id || tutorial.title} className="flex items-center justify-between bg-zinc-50 rounded-2xl px-3 py-2">
                      <div>
                        <p className="text-[10px] font-black text-zinc-700">{tutorial.title || 'Tutorial'}</p>
                        {tutorial.description && (
                          <p className="text-[9px] text-zinc-500">{tutorial.description}</p>
                        )}
                      </div>
                      {onboardingEligible === false ? (
                        <span className="px-3 py-1 rounded-full text-[9px] font-black bg-amber-50 text-amber-600">
                          Locked
                        </span>
                      ) : (
                        <button
                          onClick={() => handleCompleteTutorial(tutorial.id)}
                          className={`px-3 py-1 rounded-full text-[9px] font-black ${
                            tutorial.status === 'completed'
                              ? 'bg-emerald-50 text-emerald-600'
                              : 'bg-indigo-600 text-white'
                          }`}
                        >
                          {tutorial.status === 'completed' ? 'Completed' : 'Mark Done'}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white rounded-3xl border border-zinc-100 p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Seller Mode</p>
                  <p className="text-sm font-bold text-zinc-900">Which selling setups describe you today?</p>
                  <p className="text-[10px] text-zinc-500">Choose all that apply. The first one stays your primary mode.</p>
                </div>
                <span className="px-3 py-1 rounded-full bg-zinc-50 text-[10px] font-black text-zinc-600">
                  Current: {sellerMode.replace('_', ' ')}
                </span>
              </div>
              <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-2 text-[10px] font-bold">
                {SELLER_MODE_OPTIONS.map(option => (
                  <button
                    key={option.id}
                    onClick={() => handleSellerModeSelect(option.id)}
                    className={`px-3 py-3 rounded-2xl border ${
                      sellerModeSelections.includes(option.id)
                        ? 'bg-emerald-600 border-emerald-600 text-white'
                        : 'bg-zinc-50 border-zinc-200 text-zinc-700'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-zinc-100 p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Buyer Reach</p>
                  <p className="text-sm font-bold text-zinc-900">How do buyers reach you?</p>
                  <p className="text-[10px] text-zinc-500">Choose every way buyers can find, contact, or order from you.</p>
                </div>
                <span className="px-3 py-1 rounded-full bg-zinc-50 text-[10px] font-black text-zinc-600">
                  Selected: {buyerReach.replace('_', ' ')}
                </span>
              </div>
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2 text-[10px] font-bold">
                {BUYER_REACH_OPTIONS.map(option => (
                  <button
                    key={option.id}
                    onClick={() => {
                      const next = toggleMultiSelection(buyerReachSelections, option.id);
                      setBuyerReachSelections(next);
                      setBuyerReach((next[0] || option.id) as typeof buyerReach);
                    }}
                    className={`px-3 py-3 rounded-2xl border ${
                      buyerReachSelections.includes(option.id)
                        ? 'bg-indigo-600 border-indigo-600 text-white'
                        : 'bg-zinc-50 border-zinc-200 text-zinc-700'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              <div className="mt-3 text-[10px] text-zinc-500 font-bold">
                Fixed address details live in the Shop Profile tab.
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-zinc-100 p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Unified Shop Registry</p>
                  <p className="text-sm font-bold text-zinc-900">Select how you sell today</p>
                  <p className="text-[10px] text-zinc-500">Choose all sales channels that apply to your business.</p>
                </div>
                <span className="px-3 py-1 rounded-full bg-zinc-50 text-[10px] font-black text-zinc-600">
                  Current: {shopType}
                </span>
              </div>
              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2 text-[10px] font-bold">
                {SHOP_TYPE_OPTIONS.map(option => (
                  <button
                    key={option.id}
                    onClick={() => handleShopTypeSelect(option.id)}
                    className={`px-3 py-3 rounded-2xl border ${
                      shopTypeSelections.includes(option.id)
                        ? 'bg-emerald-600 border-emerald-600 text-white'
                        : 'bg-zinc-50 border-zinc-200 text-zinc-700'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              {onboardingStatus && (
                <div className="mt-3 text-[10px] font-bold text-emerald-600">{onboardingStatus}</div>
              )}
            </div>

            <div className="bg-white rounded-3xl border border-zinc-100 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Delivery Details</p>
                  <p className="text-sm font-bold text-zinc-900">Share how buyers can reach you</p>
                  <p className="text-[10px] text-zinc-500">Required for all seller modes. Save once and reuse it everywhere.</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <label className="text-[10px] font-bold text-zinc-500">
                  WhatsApp Number
                  <input
                    className="mt-2 w-full px-3 py-2 rounded-2xl bg-zinc-50 border border-zinc-200 text-zinc-800"
                    value={whatsappNumber}
                    onChange={(e) => setWhatsappNumber(e.target.value)}
                    placeholder="+2547..."
                  />
                </label>
                <label className="text-[10px] font-bold text-zinc-500 flex items-center gap-2">
                  <input
                    type="checkbox"
                    className="accent-emerald-600"
                    checked={deliveryDetails.offers_delivery ?? false}
                    onChange={(e) => updateDeliveryDetail({ offers_delivery: e.target.checked })}
                  />
                  Offers Delivery
                </label>
                <label className="text-[10px] font-bold text-zinc-500">
                  Delivery Radius (km)
                  <input
                    type="number"
                    min={0}
                    className="mt-2 w-full px-3 py-2 rounded-2xl bg-zinc-50 border border-zinc-200 text-zinc-800"
                    value={deliveryRadiusKm}
                    onChange={(e) => setDeliveryRadiusKm(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="5"
                  />
                </label>
                <label className="text-[10px] font-bold text-zinc-500">
                  Delivery Zones
                  <input
                    className="mt-2 w-full px-3 py-2 rounded-2xl bg-zinc-50 border border-zinc-200 text-zinc-800"
                    value={deliveryZonesInput}
                    onChange={(e) => setDeliveryZonesInput(e.target.value)}
                    placeholder="CBD, Westlands, Eastlands"
                  />
                </label>
                {showMarketFields && (
                  <>
                    <label className="text-[10px] font-bold text-zinc-500">
                      Market / Place Name
                      <input
                        className="mt-2 w-full px-3 py-2 rounded-2xl bg-zinc-50 border border-zinc-200 text-zinc-800"
                        value={marketName}
                        onChange={(e) => setMarketName(e.target.value)}
                        placeholder="My Gikomba Spot"
                      />
                    </label>
                    <div className="text-[10px] font-bold text-zinc-500">
                      Visual Marker Photo
                      <input
                        ref={visualMarkerInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) void handleVisualMarkerUpload(file);
                          if (e.currentTarget) e.currentTarget.value = '';
                        }}
                      />
                      <div className="mt-2 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => visualMarkerInputRef.current?.click()}
                          className="px-3 py-2 rounded-2xl bg-zinc-50 border border-zinc-200 text-zinc-700 flex items-center gap-2"
                          disabled={visualMarkerUploading}
                        >
                          <Upload className="w-4 h-4" />
                          {visualMarkerUploading ? 'Uploading…' : 'Upload Photo'}
                        </button>
                        {visualMarker && isHttpUrl(visualMarker) && (
                          <span className="text-[10px] text-zinc-500">Marker photo ready</span>
                        )}
                      </div>
                      {visualMarker && isHttpUrl(visualMarker) && (
                        <img src={visualMarker} alt="Visual marker" className="mt-3 h-24 w-24 rounded-2xl object-cover border border-zinc-200" />
                      )}
                    </div>
                  </>
                )}
                {showDeliveryConfig && (
                  <>
                    <label className="text-[10px] font-bold text-zinc-500">
                      Delivery Fee (flat)
                      <input
                        type="number"
                        min={0}
                        className="mt-2 w-full px-3 py-2 rounded-2xl bg-zinc-50 border border-zinc-200 text-zinc-800"
                        value={deliveryDetails.delivery_fee_flat ?? ''}
                        onChange={(e) => updateDeliveryDetail({ delivery_fee_flat: e.target.value === '' ? undefined : Number(e.target.value) })}
                        placeholder="50"
                      />
                    </label>
                    <label className="text-[10px] font-bold text-zinc-500">
                      Delivery Fee per KM
                      <input
                        type="number"
                        min={0}
                        className="mt-2 w-full px-3 py-2 rounded-2xl bg-zinc-50 border border-zinc-200 text-zinc-800"
                        value={deliveryDetails.delivery_fee_per_km ?? ''}
                        onChange={(e) => updateDeliveryDetail({ delivery_fee_per_km: e.target.value === '' ? undefined : Number(e.target.value) })}
                        placeholder="20"
                      />
                    </label>
                    <label className="text-[10px] font-bold text-zinc-500">
                      Free Delivery Threshold
                      <input
                        type="number"
                        min={0}
                        className="mt-2 w-full px-3 py-2 rounded-2xl bg-zinc-50 border border-zinc-200 text-zinc-800"
                        value={deliveryDetails.free_delivery_threshold ?? ''}
                        onChange={(e) => updateDeliveryDetail({ free_delivery_threshold: e.target.value === '' ? undefined : Number(e.target.value) })}
                        placeholder="1500"
                      />
                    </label>
                    <label className="text-[10px] font-bold text-zinc-500">
                      Minimum Order Value
                      <input
                        type="number"
                        min={0}
                        className="mt-2 w-full px-3 py-2 rounded-2xl bg-zinc-50 border border-zinc-200 text-zinc-800"
                        value={deliveryDetails.minimum_order_value ?? ''}
                        onChange={(e) => updateDeliveryDetail({ minimum_order_value: e.target.value === '' ? undefined : Number(e.target.value) })}
                        placeholder="500"
                      />
                    </label>
                    <label className="text-[10px] font-bold text-zinc-500">
                      Average ETA (minutes)
                      <input
                        type="number"
                        min={0}
                        className="mt-2 w-full px-3 py-2 rounded-2xl bg-zinc-50 border border-zinc-200 text-zinc-800"
                        value={deliveryDetails.average_eta_minutes ?? ''}
                        onChange={(e) => updateDeliveryDetail({ average_eta_minutes: e.target.value === '' ? undefined : Number(e.target.value) })}
                        placeholder="45"
                      />
                    </label>
                    <label className="text-[10px] font-bold text-zinc-500 flex items-center gap-2">
                      <input
                        type="checkbox"
                        className="accent-emerald-600"
                        checked={deliveryDetails.same_day_available ?? false}
                        onChange={(e) => updateDeliveryDetail({ same_day_available: e.target.checked })}
                      />
                      Same Day Available
                    </label>
                    <label className="text-[10px] font-bold text-zinc-500">
                      Same Day Cutoff
                      <input
                        className="mt-2 w-full px-3 py-2 rounded-2xl bg-zinc-50 border border-zinc-200 text-zinc-800"
                        value={deliveryDetails.same_day_cutoff_time ?? ''}
                        onChange={(e) => updateDeliveryDetail({ same_day_cutoff_time: e.target.value })}
                        placeholder="14:00"
                      />
                    </label>
                    <label className="text-[10px] font-bold text-zinc-500">
                      Delivery Hours
                      <input
                        className="mt-2 w-full px-3 py-2 rounded-2xl bg-zinc-50 border border-zinc-200 text-zinc-800"
                        value={deliveryDetails.delivery_hours ?? ''}
                        onChange={(e) => updateDeliveryDetail({ delivery_hours: e.target.value })}
                        placeholder="8:00-18:00"
                      />
                    </label>
                    <div className="text-[10px] font-bold text-zinc-500">
                      Delivery Days
                      <div className="mt-2 flex flex-wrap gap-2">
                        {WEEK_DAYS.map(day => (
                          <button
                            key={day}
                            onClick={() => toggleDeliveryDay(day)}
                            className={`px-3 py-1 rounded-full border text-[9px] font-black ${
                              deliveryDetails.delivery_days?.includes(day)
                                ? 'bg-emerald-600 border-emerald-600 text-white'
                                : 'bg-zinc-50 border-zinc-200 text-zinc-600'
                            }`}
                          >
                            {day}
                          </button>
                        ))}
                      </div>
                    </div>
                    <label className="text-[10px] font-bold text-zinc-500 flex items-center gap-2">
                      <input
                        type="checkbox"
                        className="accent-emerald-600"
                        checked={deliveryDetails.pickup_available ?? false}
                        onChange={(e) => updateDeliveryDetail({ pickup_available: e.target.checked })}
                      />
                      Pickup Available
                    </label>
                    <label className="text-[10px] font-bold text-zinc-500">
                      Pickup Instructions
                      <input
                        className="mt-2 w-full px-3 py-2 rounded-2xl bg-zinc-50 border border-zinc-200 text-zinc-800"
                        value={deliveryDetails.pickup_instructions ?? ''}
                        onChange={(e) => updateDeliveryDetail({ pickup_instructions: e.target.value })}
                        placeholder="Call on arrival, rear entrance"
                      />
                    </label>
                    <label className="text-[10px] font-bold text-zinc-500 flex items-center gap-2">
                      <input
                        type="checkbox"
                        className="accent-emerald-600"
                        checked={deliveryDetails.cash_on_delivery ?? false}
                        onChange={(e) => updateDeliveryDetail({ cash_on_delivery: e.target.checked })}
                      />
                      Cash on Delivery
                    </label>
                    <label className="text-[10px] font-bold text-zinc-500">
                      Delivery Partner
                      <input
                        className="mt-2 w-full px-3 py-2 rounded-2xl bg-zinc-50 border border-zinc-200 text-zinc-800"
                        value={deliveryDetails.delivery_partner ?? ''}
                        onChange={(e) => updateDeliveryDetail({ delivery_partner: e.target.value })}
                        placeholder="In-house, rider, 3rd-party"
                      />
                    </label>
                    <label className="text-[10px] font-bold text-zinc-500">
                      Order Tracking Method
                      <input
                        className="mt-2 w-full px-3 py-2 rounded-2xl bg-zinc-50 border border-zinc-200 text-zinc-800"
                        value={deliveryDetails.order_tracking_method ?? ''}
                        onChange={(e) => updateDeliveryDetail({ order_tracking_method: e.target.value })}
                        placeholder="whatsapp, sms, link"
                      />
                    </label>
                    <label className="text-[10px] font-bold text-zinc-500">
                      Payment Options
                      <input
                        className="mt-2 w-full px-3 py-2 rounded-2xl bg-zinc-50 border border-zinc-200 text-zinc-800"
                        value={paymentOptionsInput}
                        onChange={(e) => setPaymentOptionsInput(e.target.value)}
                        placeholder="M-Pesa, Cash, Card"
                      />
                    </label>
                    <label className="text-[10px] font-bold text-zinc-500">
                      Installation Services
                      <input
                        className="mt-2 w-full px-3 py-2 rounded-2xl bg-zinc-50 border border-zinc-200 text-zinc-800"
                        value={installationServicesInput}
                        onChange={(e) => setInstallationServicesInput(e.target.value)}
                        placeholder="Setup, calibration, assembly"
                      />
                    </label>
                    <label className="text-[10px] font-bold text-zinc-500">
                      After-Sales Support
                      <input
                        className="mt-2 w-full px-3 py-2 rounded-2xl bg-zinc-50 border border-zinc-200 text-zinc-800"
                        value={afterSalesSupportInput}
                        onChange={(e) => setAfterSalesSupportInput(e.target.value)}
                        placeholder="Warranty claims, return handling"
                      />
                    </label>
                  </>
                )}
                <LocationPinPicker
                  title="Selling Location Pin"
                  helpText="Search for your market or stall, then drag the pin to the exact place buyers should find you."
                  value={{
                    label: dailyPlaceName,
                    lat: dailyLat === '' ? undefined : Number(dailyLat),
                    lng: dailyLng === '' ? undefined : Number(dailyLng),
                  }}
                  onChange={(next) => {
                    setDailyPlaceName(next.label || '');
                    setDailyLat(next.lat === undefined ? '' : next.lat);
                    setDailyLng(next.lng === undefined ? '' : next.lng);
                    setOnboardingStatus(null);
                  }}
                  searchPlaceholder="Search market, building, stage, or landmark"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={handleSaveDeliveryDetails}
                  className="px-4 py-2 rounded-2xl bg-emerald-600 text-white text-[10px] font-black"
                >
                  Save Delivery Details
                </button>
              </div>
            </div>

            {shopType !== 'physical' && (
              <div className="bg-white rounded-3xl border border-zinc-100 p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Online Connection</p>
                    <p className="text-sm font-bold text-zinc-900">Connect your store in 60 seconds</p>
                  </div>
                  {onlineConnectionId && (
                    <div className="text-[10px] text-zinc-500 font-bold">
                      Connection ID: {onlineConnectionId}
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="text-[10px] font-bold text-zinc-500">
                    Platform
                    <select
                      className="mt-2 w-full px-3 py-2 rounded-2xl bg-zinc-50 border border-zinc-200 text-zinc-800"
                      value={onlineConnectForm.platform}
                      onChange={(e) => setOnlineConnectForm(prev => ({ ...prev, platform: e.target.value }))}
                    >
                      <option value="shopify">Shopify</option>
                      <option value="woocommerce">WooCommerce</option>
                      <option value="opencart">OpenCart</option>
                      <option value="custom">Custom API</option>
                      <option value="csv">CSV Upload</option>
                      <option value="marketplace">Marketplace</option>
                    </select>
                  </label>
                  {isShopify && (
                  <label className="text-[10px] font-bold text-zinc-500">
                    Shop Domain
                    <input
                      className="mt-2 w-full px-3 py-2 rounded-2xl bg-zinc-50 border border-zinc-200 text-zinc-800"
                      value={onlineConnectForm.shop_domain || ''}
                      onChange={(e) => setOnlineConnectForm(prev => ({ ...prev, shop_domain: e.target.value }))}
                      placeholder="yourstore.myshopify.com"
                    />
                  </label>
                )}
                {(isWoo || isOpenCart || isCustom || isMarketplace) && (
                  <label className="text-[10px] font-bold text-zinc-500">
                    Store Base URL
                    <input
                      className="mt-2 w-full px-3 py-2 rounded-2xl bg-zinc-50 border border-zinc-200 text-zinc-800"
                      value={onlineConnectForm.api_base_url || ''}
                      onChange={(e) => setOnlineConnectForm(prev => ({ ...prev, api_base_url: e.target.value }))}
                      placeholder="https://store.example.com"
                    />
                  </label>
                )}
                {!isCSV && (
                  <label className="text-[10px] font-bold text-zinc-500">
                    API Key / Token
                    <input
                      className="mt-2 w-full px-3 py-2 rounded-2xl bg-zinc-50 border border-zinc-200 text-zinc-800"
                      value={onlineConnectForm.api_key || ''}
                      onChange={(e) => setOnlineConnectForm(prev => ({ ...prev, api_key: e.target.value }))}
                      placeholder={isShopify ? 'OAuth access token (auto after auth)' : 'secure token'}
                    />
                  </label>
                )}
                {(isWoo || isCustom || isMarketplace) && (
                  <label className="text-[10px] font-bold text-zinc-500">
                    API Secret
                    <input
                      className="mt-2 w-full px-3 py-2 rounded-2xl bg-zinc-50 border border-zinc-200 text-zinc-800"
                      value={onlineConnectForm.api_secret || ''}
                      onChange={(e) => setOnlineConnectForm(prev => ({ ...prev, api_secret: e.target.value }))}
                      placeholder="secret key"
                    />
                  </label>
                )}
                {(isCustom || isMarketplace || isOpenCart) && (
                  <label className="text-[10px] font-bold text-zinc-500">
                    Products Endpoint
                    <input
                      className="mt-2 w-full px-3 py-2 rounded-2xl bg-zinc-50 border border-zinc-200 text-zinc-800"
                      value={onlineConnectForm.products_endpoint || ''}
                      onChange={(e) => setOnlineConnectForm(prev => ({ ...prev, products_endpoint: e.target.value }))}
                      placeholder="/api/products"
                    />
                  </label>
                )}
                {(isCustom || isMarketplace || isOpenCart) && (
                  <label className="text-[10px] font-bold text-zinc-500">
                    Orders Endpoint
                    <input
                      className="mt-2 w-full px-3 py-2 rounded-2xl bg-zinc-50 border border-zinc-200 text-zinc-800"
                      value={onlineConnectForm.orders_endpoint || ''}
                      onChange={(e) => setOnlineConnectForm(prev => ({ ...prev, orders_endpoint: e.target.value }))}
                      placeholder="/api/orders"
                    />
                  </label>
                )}
                {(isCustom || isMarketplace) && (
                  <label className="text-[10px] font-bold text-zinc-500">
                    Demand Endpoint (optional)
                    <input
                      className="mt-2 w-full px-3 py-2 rounded-2xl bg-zinc-50 border border-zinc-200 text-zinc-800"
                      value={onlineConnectForm.demand_endpoint || ''}
                      onChange={(e) => setOnlineConnectForm(prev => ({ ...prev, demand_endpoint: e.target.value }))}
                      placeholder="/api/demand"
                    />
                  </label>
                )}
                {isCSV && (
                  <label className="text-[10px] font-bold text-zinc-500 sm:col-span-2">
                    CSV Import URL
                    <input
                      className="mt-2 w-full px-3 py-2 rounded-2xl bg-zinc-50 border border-zinc-200 text-zinc-800"
                      value={onlineConnectForm.csv_import_url || ''}
                      onChange={(e) => setOnlineConnectForm(prev => ({ ...prev, csv_import_url: e.target.value }))}
                      placeholder="https://files.example.com/products.csv"
                    />
                  </label>
                )}
                {!isCSV && (
                  <label className="text-[10px] font-bold text-zinc-500">
                    Webhook Secret
                    <input
                      type="password"
                      autoComplete="new-password"
                      className="mt-2 w-full px-3 py-2 rounded-2xl bg-zinc-50 border border-zinc-200 text-zinc-800"
                      value={onlineConnectForm.webhook_secret || ''}
                      onChange={(e) => setOnlineConnectForm(prev => ({ ...prev, webhook_secret: e.target.value }))}
                      placeholder="auto-generated secret"
                    />
                  </label>
                )}
                {!isCSV && (
                  <label className="text-[10px] font-bold text-zinc-500 sm:col-span-2">
                    Webhook URL
                    <input
                      className="mt-2 w-full px-3 py-2 rounded-2xl bg-zinc-50 border border-zinc-200 text-zinc-800"
                      value={onlineConnectForm.webhook_url || ''}
                      onChange={(e) => setOnlineConnectForm(prev => ({ ...prev, webhook_url: e.target.value }))}
                      placeholder="https://yourstore.com/sokoconnect/webhook"
                    />
                  </label>
                )}
                {isShopify && (
                  <label className="text-[10px] font-bold text-zinc-500">
                    OAuth Code (after auth)
                    <input
                      className="mt-2 w-full px-3 py-2 rounded-2xl bg-zinc-50 border border-zinc-200 text-zinc-800"
                      value={onlineConnectForm.auth_code || ''}
                      onChange={(e) => setOnlineConnectForm(prev => ({ ...prev, auth_code: e.target.value }))}
                      placeholder="Paste Shopify auth code"
                    />
                  </label>
                )}
                {isShopify && (
                  <label className="text-[10px] font-bold text-zinc-500">
                    Scopes (optional)
                    <input
                      className="mt-2 w-full px-3 py-2 rounded-2xl bg-zinc-50 border border-zinc-200 text-zinc-800"
                      value={onlineConnectForm.scopes || ''}
                      onChange={(e) => setOnlineConnectForm(prev => ({ ...prev, scopes: e.target.value }))}
                      placeholder="read_products,read_orders,read_customers"
                    />
                  </label>
                )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={handleConnectOnline}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-[10px] font-black"
                  >
                    {isShopify || isWoo ? 'Connect via OAuth' : 'Connect Store'}
                  </button>
                  {onlineAuthUrl && (
                    <button
                      onClick={() => window.open(onlineAuthUrl, '_blank', 'noopener')}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black"
                    >
                      Authorize Shopify
                    </button>
                  )}
                  <button
                    onClick={handleRefreshConnection}
                    className="px-4 py-2 bg-zinc-100 text-zinc-800 rounded-xl text-[10px] font-black"
                    disabled={!onlineConnectionId}
                  >
                    Refresh Status
                  </button>
                  <button
                    onClick={handleSyncNow}
                    className="px-4 py-2 bg-zinc-900 text-white rounded-xl text-[10px] font-black"
                    disabled={!onlineConnectionId}
                  >
                    Start Sync
                  </button>
                </div>
                {onlineConnectionStatus && (
                  <div className="text-[10px] font-bold text-emerald-600">{onlineConnectionStatus}</div>
                )}
                {oauthStatus && (
                  <div className="text-[10px] font-bold text-indigo-600">{oauthStatus}</div>
                )}
              </div>
            )}

            {shopType !== 'physical' && (
              <div className="bg-white rounded-3xl border border-zinc-100 p-6 shadow-sm space-y-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Mapping Preview</p>
                  <p className="text-sm font-bold text-zinc-900">Match external SKU → SConnect catalog product</p>
                  <p className="text-[10px] text-zinc-500">Sync now auto-matches exact catalog products first. Add manual mappings only for unmatched items.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <div className="px-3 py-2 rounded-2xl bg-emerald-50 text-emerald-700 text-[10px] font-black">
                    Suggested {suggestedMappingSuggestions.length}
                  </div>
                  <div className="px-3 py-2 rounded-2xl bg-amber-50 text-amber-700 text-[10px] font-black">
                    Needs review {reviewMappingSuggestions.length}
                  </div>
                  <div className="px-3 py-2 rounded-2xl bg-zinc-100 text-zinc-700 text-[10px] font-black">
                    Already mapped {mappedMappingSuggestions.length}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => void loadMappingSuggestions()}
                    className="px-4 py-2 bg-zinc-100 text-zinc-800 rounded-xl text-[10px] font-black"
                    disabled={!onlineConnectionId || mappingSuggestionsLoading}
                  >
                    {mappingSuggestionsLoading ? 'Refreshing…' : 'Refresh Suggestions'}
                  </button>
                  <button
                    onClick={handleApplyAllSuggestedMappings}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-[10px] font-black"
                    disabled={mappingSuggestionsLoading || suggestedMappingSuggestions.length === 0}
                  >
                    Apply All Suggested
                  </button>
                </div>
                {!onlineConnectionId && (
                  <div className="text-[10px] text-zinc-500 font-bold bg-zinc-50 rounded-2xl px-3 py-2">
                    Connect a store first. Once the connection is ready, Seller Studio will pull external products and suggest catalog matches here.
                  </div>
                )}
                {onlineConnectionId && mappingSuggestionsLoading && (
                  <div className="text-[10px] text-zinc-500 font-bold bg-zinc-50 rounded-2xl px-3 py-2">
                    Loading product matches from your connected store...
                  </div>
                )}
                {onlineConnectionId && !mappingSuggestionsLoading && mappingSuggestions.length === 0 && (
                  <div className="text-[10px] text-zinc-500 font-bold bg-zinc-50 rounded-2xl px-3 py-2">
                    No external products found yet. Run a sync or refresh the connection after your shop catalog is available.
                  </div>
                )}
                {suggestedMappingSuggestions.length > 0 && (
                  <div className="space-y-2">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500">High Confidence Matches</p>
                      <p className="text-[10px] text-zinc-500">These look safe to accept in one click.</p>
                    </div>
                    {suggestedMappingSuggestions.map((suggestion) => (
                      <div key={`suggested_${suggestion.external_sku}`} className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-3 space-y-2">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <p className="text-xs font-black text-zinc-900">{suggestion.external_title || suggestion.external_sku}</p>
                            <p className="text-[10px] text-zinc-500">SKU {suggestion.external_sku} · {formatCurrencyKES(suggestion.price || 0)} · Stock {suggestion.stock || 0}</p>
                          </div>
                          <div className="px-2 py-1 rounded-full bg-white text-[10px] font-black text-emerald-700">
                            {formatMatchConfidence(suggestion.confidence)}
                          </div>
                        </div>
                        <div className="rounded-2xl bg-white px-3 py-2 text-[10px] text-zinc-700">
                          <span className="font-black text-zinc-900">{suggestion.canonical_name || 'Suggested catalog product'}</span>
                          {' '}
                          <span className="text-zinc-500">({suggestion.canonical_sku})</span>
                          {suggestion.reason ? ` · ${suggestion.reason.replaceAll('_', ' ')}` : ''}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => handleApplySuggestedMapping(suggestion)}
                            className="px-3 py-2 bg-emerald-600 text-white rounded-xl text-[10px] font-black"
                          >
                            Use Suggestion
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {reviewMappingSuggestions.length > 0 && (
                  <div className="space-y-2">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-amber-500">Needs Review</p>
                      <p className="text-[10px] text-zinc-500">Pick one of the likely catalog matches, or start a manual draft if none are right.</p>
                    </div>
                    {reviewMappingSuggestions.map((suggestion) => (
                      <div key={`review_${suggestion.external_sku}`} className="rounded-2xl border border-amber-100 bg-amber-50/60 p-3 space-y-2">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <p className="text-xs font-black text-zinc-900">{suggestion.external_title || suggestion.external_sku}</p>
                            <p className="text-[10px] text-zinc-500">SKU {suggestion.external_sku} · {formatCurrencyKES(suggestion.price || 0)} · Stock {suggestion.stock || 0}</p>
                          </div>
                          <div className="px-2 py-1 rounded-full bg-white text-[10px] font-black text-amber-700">
                            {formatMatchConfidence(suggestion.confidence)}
                          </div>
                        </div>
                        {suggestion.candidates && suggestion.candidates.length > 0 ? (
                          <div className="space-y-2">
                            {suggestion.candidates.map((candidate) => (
                              <div key={`${suggestion.external_sku}_${candidate.canonical_sku}`} className="rounded-2xl bg-white px-3 py-2 flex flex-wrap items-center justify-between gap-2">
                                <div>
                                  <p className="text-[10px] font-black text-zinc-900">{candidate.name}</p>
                                  <p className="text-[10px] text-zinc-500">{candidate.canonical_sku} · {formatMatchConfidence(candidate.confidence)} · {candidate.reason.replaceAll('_', ' ')}</p>
                                </div>
                                <button
                                  onClick={() => handleApplySuggestedMapping(suggestion, candidate.canonical_sku)}
                                  className="px-3 py-2 bg-amber-500 text-white rounded-xl text-[10px] font-black"
                                >
                                  Use This Match
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="rounded-2xl bg-white px-3 py-2 text-[10px] text-zinc-500">
                            No safe catalog match found yet for this item.
                          </div>
                        )}
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => handleDraftManualMapping(suggestion)}
                            className="px-3 py-2 bg-zinc-900 text-white rounded-xl text-[10px] font-black"
                          >
                            Draft Manual Mapping
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {mappedMappingSuggestions.length > 0 && (
                  <div className="space-y-2">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Already Mapped</p>
                      <p className="text-[10px] text-zinc-500">These products are already connected to a catalog item.</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {mappedMappingSuggestions.map((suggestion) => (
                        <div key={`mapped_${suggestion.external_sku}`} className="rounded-2xl border border-zinc-200 bg-zinc-50 px-3 py-2">
                          <p className="text-[10px] font-black text-zinc-900">{suggestion.external_title || suggestion.external_sku}</p>
                          <p className="text-[10px] text-zinc-500">{suggestion.external_sku} → {suggestion.canonical_name || suggestion.canonical_sku}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div className="space-y-2">
                  {mappingItems.length === 0 && (
                    <div className="text-[10px] text-zinc-500 font-bold bg-zinc-50 rounded-2xl px-3 py-2">
                      No manual mappings added yet. Start sync first and only review the products that could not be matched automatically.
                    </div>
                  )}
                  {mappingItems.map((item, idx) => (
                    <div key={`${item.external_sku}_${idx}`} className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <input
                        className="px-3 py-2 rounded-xl bg-zinc-50 border border-zinc-200 text-[10px] font-bold"
                        placeholder="External SKU"
                        value={item.external_sku}
                        onChange={(e) => {
                          const value = e.target.value;
                          setMappingItems(prev => prev.map((m, i) => i === idx ? { ...m, external_sku: value } : m));
                        }}
                      />
                      <input
                        className="px-3 py-2 rounded-xl bg-zinc-50 border border-zinc-200 text-[10px] font-bold"
                        placeholder="Catalog product ID"
                        value={item.canonical_sku}
                        onChange={(e) => {
                          const value = e.target.value;
                          setMappingItems(prev => prev.map((m, i) => i === idx ? { ...m, canonical_sku: value } : m));
                        }}
                      />
                      <input
                        className="px-3 py-2 rounded-xl bg-zinc-50 border border-zinc-200 text-[10px] font-bold"
                        placeholder="Platform"
                        value={item.platform}
                        onChange={(e) => {
                          const value = e.target.value;
                          setMappingItems(prev => prev.map((m, i) => i === idx ? { ...m, platform: value } : m));
                        }}
                      />
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={handleAddMappingRow}
                    className="px-4 py-2 bg-zinc-100 text-zinc-800 rounded-xl text-[10px] font-black"
                  >
                    Add Mapping
                  </button>
                  <button
                    onClick={handleSaveMappings}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black"
                    disabled={mappingSyncing}
                  >
                    {mappingSyncing ? 'Saving…' : 'Save Mappings'}
                  </button>
                </div>
                {mappingStatus && (
                  <div className="text-[10px] font-bold text-emerald-600">{mappingStatus}</div>
                )}
              </div>
            )}

            <div className="bg-white rounded-3xl border border-zinc-100 p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <MapPin className="w-5 h-5 text-emerald-600" />
                <div>
                  <p className="text-sm font-bold text-zinc-900">Record Path To Your Shop</p>
                  <p className="text-[10px] text-zinc-500">Capture the real route so buyers can find you faster.</p>
                </div>
              </div>
              <button
                onClick={() => setShowPathRecorder(true)}
                className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-[10px] font-black"
              >
                Open Path Recorder
              </button>
            </div>


            <div className="bg-white rounded-3xl border border-zinc-100 p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <QrCode className="w-5 h-5 text-indigo-600" />
                <div>
                  <p className="text-sm font-bold text-zinc-900">QR Code Storefront</p>
                  <p className="text-[10px] text-zinc-500">Share your shop instantly on WhatsApp and posters.</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-zinc-400 uppercase">Your public page</p>
                  <p className="text-sm font-black text-zinc-900">
                    {sellerShareLink || 'Share link not available yet.'}
                  </p>
                </div>
                <button
                  onClick={handleRefreshShareLink}
                  className="px-4 py-2 bg-zinc-900 text-white rounded-xl text-[10px] font-black"
                >
                  Download QR
                </button>
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-zinc-100 p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <Upload className="w-5 h-5 text-emerald-600" />
                <div>
                  <p className="text-sm font-bold text-zinc-900">Passive Discovery from Receipts</p>
                  <p className="text-[10px] text-zinc-500">Customers upload receipts → your catalog appears automatically.</p>
                </div>
              </div>
              <div className="p-3 bg-emerald-50 rounded-2xl text-[10px] font-bold text-emerald-700">
                {receiptWeekCount > 0
                  ? `${receiptWeekCount} customers uploaded receipts from your shop this week.`
                  : 'No receipt uploads yet this week.'}
              </div>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={handleClaimShop}
                  className="flex-1 py-3 bg-emerald-600 text-white rounded-xl text-[10px] font-black"
                >
                  {claimShopBonusLabel ? `Claim Shop (${claimShopBonusLabel} bonus)` : 'Claim Shop'}
                </button>
                <button
                  onClick={handleStartVerification}
                  className="flex-1 py-3 bg-zinc-100 text-zinc-600 rounded-xl text-[10px] font-black"
                >
                  Start Verification
                </button>
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-zinc-100 p-6 shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-3">Digital Storefront Preview</p>
              <div className="p-4 bg-zinc-50 rounded-2xl">
                <p className="text-sm font-black text-zinc-900">{seller.name}</p>
                <p className="text-[10px] text-zinc-500">
                  {seller.location?.address ? seller.location.address : 'Add your address'} • {deliveryDetails.delivery_hours || 'Hours not set'}
                </p>
                <div className="mt-3 grid grid-cols-4 gap-2">
                  {myProducts.slice(0, 4).map(p => (
                    <div key={p.id} className="text-[9px] font-bold text-zinc-700 bg-white rounded-xl p-2 text-center">
                      {p.name.split(' ')[0]} • KES {p.price}
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={handleEditStorefront}
                    className="px-3 py-2 bg-zinc-900 text-white rounded-xl text-[10px] font-black"
                  >
                    Edit Page
                  </button>
                  <button
                    onClick={handleRefreshShareLink}
                    className="px-3 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black"
                  >
                    Share QR
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'products' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-zinc-900">{seller.name}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex items-center gap-1 text-amber-500">
                    <Star className="w-3 h-3 fill-amber-500" />
                    <span className="text-xs font-bold">{seller.rating} Rating</span>
                  </div>
                  <span className="text-zinc-300">•</span>
                  <span className="text-xs text-zinc-500">{myProducts.length} Products</span>
                </div>
              </div>
              <button 
                onClick={handleAddProduct}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold text-sm shadow-lg shadow-indigo-500/30"
              >
                <Plus className="w-4 h-4" /> Add Product
              </button>
            </div>
            {productsStatus && (
              <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-2xl text-[10px] font-bold text-emerald-700">
                {productsStatus}
              </div>
            )}
            {productsLoading && (
              <div className="text-[10px] font-bold text-zinc-500">Loading products…</div>
            )}

            {/* Expiry Alerts Section */}
            {myProducts.some(p => p.expiryDate && new Date(p.expiryDate).getTime() < Date.now() + 86400000 * 30) && (
              <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl">
                <div className="flex items-center gap-2 mb-3">
                  <AlertCircle className="w-5 h-5 text-amber-600" />
                  <h3 className="text-sm font-bold text-amber-900 uppercase tracking-tight">Expiry Alerts</h3>
                </div>
                <div className="space-y-2">
                  {myProducts
                    .filter(p => p.expiryDate && new Date(p.expiryDate).getTime() < Date.now() + 86400000 * 30)
                    .map(p => (
                      <div key={p.id} className="flex items-center justify-between bg-white/50 p-2 rounded-xl border border-amber-100">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg overflow-hidden">
                            <img src={p.mediaUrl} className="w-full h-full object-cover" alt="" loading="lazy" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-zinc-900">{p.name}</p>
                            <p className="text-[10px] text-amber-600 font-medium">Expires: {p.expiryDate}</p>
                          </div>
                        </div>
                          <button 
                            onClick={() => {
                            if (!clearancePromoConfig?.discount_pct) {
                              setProductsStatus('Clearance promotion not configured yet.');
                              return;
                            }
                            const discountPct = Number(clearancePromoConfig.discount_pct);
                            setFormData({
                              name: p.name,
                              description: p.description,
                              price: (p.price * (1 - discountPct / 100)).toFixed(2),
                              category: p.category,
                              mediaUrl: p.mediaUrl,
                              stockLevel: p.stockLevel,
                              expiryDate: p.expiryDate || '',
                              groupBuyEligible: Boolean(p.groupBuyEligible),
                              groupBuyTiers: Array.isArray(p.groupBuyTiers) ? p.groupBuyTiers : []
                            });
                            setEditingProduct(p);
                            setIsAddingProduct(true);
                          }}
                          className="px-3 py-1.5 bg-amber-600 text-white rounded-lg text-[10px] font-bold shadow-sm"
                        >
                          Clearance Promotion
                        </button>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Low Stock Section */}
            {lowStockItems.length > 0 && (
              <div className="bg-red-50 border border-red-200 p-4 rounded-2xl">
                <div className="flex items-center gap-2 mb-3">
                  <Zap className="w-5 h-5 text-red-600" />
                  <h3 className="text-sm font-bold text-red-900 uppercase tracking-tight">Low Stock Alerts</h3>
                </div>
                <div className="space-y-2">
                  {lowStockItems.map((item) => {
                    const product = productById.get(item.seller_product_id || '');
                    const stockLevel = Number(item.stock_level ?? product?.stockLevel ?? 0);
                    return (
                      <div key={item.seller_product_id || product?.id} className="flex items-center justify-between bg-white/50 p-2 rounded-xl border border-red-100">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg overflow-hidden">
                            <img src={product?.mediaUrl || toPlaceholderImage(product?.name || 'Product')} className="w-full h-full object-cover" alt="" loading="lazy" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-zinc-900">{product?.name || item.seller_product_id || 'Product'}</p>
                            <p className="text-[10px] text-red-600 font-bold">Stock: {stockLevel} units</p>
                          </div>
                        </div>
                        <button
                          onClick={() => product && handleRestockProduct(product)}
                          disabled={!product}
                          className="px-3 py-1.5 bg-zinc-900 text-white rounded-lg text-[10px] font-bold"
                        >
                          Restock Now
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="bg-white rounded-3xl border border-zinc-100 p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <Upload className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400">Receipt-Based Auto-Update</h3>
                </div>
                <p className="text-[10px] text-zinc-500 font-bold">Send daily receipts → stock auto-updates and sales totals.</p>
                <button
                  onClick={() => receiptUploadInputRef.current?.click()}
                  className="mt-3 w-full py-3 bg-emerald-600 text-white rounded-xl text-[10px] font-black"
                >
                  Upload Daily Receipts
                </button>
              </div>
              <div className="bg-white rounded-3xl border border-zinc-100 p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <MessageSquare className="w-4 h-4 text-indigo-600" />
                  <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400">Bulk Inventory Update</h3>
                </div>
                <p className="text-[10px] text-zinc-500 font-bold">
                  Sync stock and pricing from your latest import or POS export.
                </p>
                <button onClick={applyBulkUpdate} className="mt-3 w-full py-3 bg-zinc-900 text-white rounded-xl text-[10px] font-black">
                  Run Bulk Update
                </button>
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-zinc-100 p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-4 h-4 text-amber-500" />
                <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400">Smart Reorder Recommendations</h3>
              </div>
              <div className="p-3 bg-amber-50 rounded-2xl text-[10px] font-bold text-amber-700">
                {reorderRecommendations.length > 0
                  ? reorderRecommendations.join(' • ')
                  : 'Reorder signals will appear once product insights are available.'}
              </div>
              <div className="mt-3 flex gap-2">
                <button className="flex-1 py-3 bg-amber-600 text-white rounded-xl text-[10px] font-black">Order Recommendations</button>
                <button className="flex-1 py-3 bg-zinc-100 text-zinc-600 rounded-xl text-[10px] font-black">Adjust Quantities</button>
              </div>
            </div>

            {/* AI Assistant Banner */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="bg-gradient-to-r from-indigo-600 to-violet-600 p-6 rounded-2xl text-white relative overflow-hidden shadow-xl">
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-5 h-5 text-indigo-200" />
                    <span className="text-xs font-bold uppercase tracking-widest text-indigo-100">AI Powered</span>
                  </div>
                  <h3 className="text-xl font-bold mb-2">Smart Listing</h3>
                  <p className="text-sm text-indigo-100 mb-4 max-w-[250px]">
                    Let AI optimize your product descriptions and pricing.
                  </p>
                  <button 
                    onClick={() => setShowListingOptimizer(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-white text-indigo-600 rounded-lg font-bold text-sm hover:bg-indigo-50 transition-colors"
                  >
                    <Wand2 className="w-4 h-4" /> Start AI Listing
                  </button>
                </div>
                <Sparkles className="absolute -right-4 -bottom-4 w-32 h-32 text-white/10 rotate-12" />
              </div>

              <div className="bg-white p-6 rounded-2xl border border-zinc-200 relative overflow-hidden shadow-sm">
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-2">
                    <QrCode className="w-5 h-5 text-indigo-600" />
                    <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">Inventory Sync</span>
                  </div>
                  <h3 className="text-xl font-bold mb-2 text-zinc-900">Receipt OCR</h3>
                  <p className="text-sm text-zinc-500 mb-4 max-w-[250px]">
                    Upload a customer receipt to automatically list new products.
                  </p>
                  <button
                    onClick={() => receiptUploadInputRef.current?.click()}
                    className="flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white rounded-lg font-bold text-sm hover:bg-zinc-800 transition-colors"
                  >
                    <Upload className="w-4 h-4" /> Scan Receipt
                  </button>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-zinc-200 relative overflow-hidden shadow-sm">
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-2">
                    <Upload className="w-5 h-5 text-emerald-600" />
                    <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">Bulk Upload</span>
                  </div>
                  <h3 className="text-xl font-bold mb-2 text-zinc-900">CSV Import</h3>
                  <p className="text-sm text-zinc-500 mb-4 max-w-[250px]">
                    Upload a spreadsheet to add hundreds of products in one step.
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={handleCsvImport}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg font-bold text-sm"
                    >
                      <Upload className="w-4 h-4" /> Upload CSV
                    </button>
                    <button className="px-4 py-2 bg-zinc-100 text-zinc-700 rounded-lg font-bold text-sm">
                      Template
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {myProducts.map(product => (
                <div key={product.id} className="bg-white p-4 rounded-xl border border-zinc-200 flex gap-4 items-center group">
                  <div className="w-16 h-16 bg-zinc-100 rounded-lg flex items-center justify-center overflow-hidden">
                    <img src={product.mediaUrl} className="w-full h-full object-cover" alt={product.name} loading="lazy" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-zinc-800">{product.name}</h4>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-xs text-zinc-500">${product.price} • {product.category}</p>
                      {product.stockStatus && product.stockStatus !== 'in_stock' && (
                        <div className="flex items-center gap-1 px-1.5 py-0.5 bg-red-50 rounded text-[8px] font-bold text-red-600 uppercase">
                          <AlertCircle className="w-2 h-2" /> {product.stockStatus === 'out_of_stock' ? 'Out of Stock' : 'Low Stock'}: {product.stockLevel}
                        </div>
                      )}
                      {product.expiryDate && (
                        <div className="flex items-center gap-1 px-1.5 py-0.5 bg-amber-50 rounded text-[8px] font-bold text-amber-600 uppercase">
                          <Clock className="w-2 h-2" /> Exp: {product.expiryDate}
                        </div>
                      )}
                    </div>
                    {product.productId && (productMediaByProductId[product.productId] || []).length > 0 && (
                      <div className="mt-2 space-y-2">
                        <div className="flex items-center gap-2 overflow-x-auto">
                          {(productMediaByProductId[product.productId] || []).slice(0, 6).map((media) => (
                            <div key={media.id || media.url} className="w-12 h-12 rounded-lg overflow-hidden border border-zinc-100">
                              <img
                                src={media.url || product.mediaUrl}
                                className="w-full h-full object-cover"
                                alt=""
                                loading="lazy"
                              />
                            </div>
                          ))}
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {(productMediaByProductId[product.productId] || []).map((media) => (
                            <span
                              key={`status-${media.id || media.url}`}
                              className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase ${
                                media.status === 'ready'
                                  ? 'bg-emerald-50 text-emerald-600'
                                  : media.status === 'processing'
                                    ? 'bg-amber-50 text-amber-600'
                                    : 'bg-zinc-100 text-zinc-500'
                              }`}
                            >
                              {media.status || 'pending'}
                            </span>
                          ))}
                        </div>
                        <button
                          onClick={() => handleOpenMediaDrawer(product)}
                          className="text-[9px] font-bold text-indigo-600"
                        >
                          View All Media
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {product.groupBuyEligible && (
                      <button
                        onClick={() => handleCreateGroupBuyOffer(product)}
                        className="p-2 hover:bg-zinc-100 rounded-lg transition-colors text-emerald-600"
                        title="Publish group buy"
                      >
                        <Users className="w-4 h-4" />
                      </button>
                    )}
                    {product.productId && (
                      <button
                        onClick={() => handleOpenMediaDrawer(product)}
                        className="p-2 hover:bg-zinc-100 rounded-lg transition-colors text-zinc-400 hover:text-indigo-600"
                        title="View media"
                      >
                        <ImageIcon className="w-4 h-4" />
                      </button>
                    )}
                    <button 
                      onClick={() => handleEditProduct(product)}
                      className="p-2 hover:bg-zinc-100 rounded-lg transition-colors text-zinc-400 hover:text-indigo-600"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDeleteProduct(product.id)}
                      className="p-2 hover:bg-zinc-100 rounded-lg transition-colors text-zinc-400 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              {myProducts.length === 0 && (
                <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-zinc-300">
                  <Package className="w-12 h-12 text-zinc-200 mx-auto mb-4" />
                  <p className="text-zinc-400 font-medium">No products listed yet.</p>
                </div>
              )}
            </div>
            {groupBuyOfferStatus && (
              <div className="text-[10px] font-bold text-emerald-600">{groupBuyOfferStatus}</div>
            )}
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-6 pb-20">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="bg-white rounded-3xl border border-zinc-100 p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <Zap className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400">Real-Time Demand Alerts</h3>
                </div>
                <div className="p-3 bg-emerald-50 rounded-2xl text-[10px] font-bold text-emerald-700">
                  {analyticsAnomalies.length > 0
                    ? analyticsAnomalies.slice(0, 3).map((item) => item.details || item.type).join(' • ')
                    : 'No active demand alerts right now.'}
                </div>
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={handleQuickBoost}
                    className="flex-1 py-3 bg-emerald-600 text-white rounded-xl text-[10px] font-black"
                  >
                    {quickBoostCta}
                  </button>
                  <button
                    onClick={handleOpenProductsTab}
                    className="flex-1 py-3 bg-zinc-100 text-zinc-600 rounded-xl text-[10px] font-black"
                  >
                    Update Stock
                  </button>
                </div>
              </div>
              <div className="bg-white rounded-3xl border border-zinc-100 p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <LineChartIcon className="w-4 h-4 text-indigo-600" />
                  <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400">Competitive Intelligence</h3>
                </div>
                <div className="p-3 bg-indigo-50 rounded-2xl text-[10px] font-bold text-indigo-700">
                  Price position {Math.round((analyticsMarket?.price_position ?? 0) * 100)}% • Market median {analyticsMarket?.competitor_median_price !== undefined
                    ? `KES ${Math.round(analyticsMarket.competitor_median_price)}`
                    : '—'} • Market share {Math.round((analyticsMarket?.market_share ?? 0) * 100)}%
                </div>
                <div className="mt-3 flex gap-2">
                <button
                  onClick={applyPriceMatch}
                  className="flex-1 py-3 bg-indigo-600 text-white rounded-xl text-[10px] font-black"
                >
                  {priceMatchValue ? `Match KES ${priceMatchValue}` : 'Match Market Price'}
                </button>
                <button
                  onClick={handleOpenProductsTab}
                  className="flex-1 py-3 bg-zinc-100 text-zinc-600 rounded-xl text-[10px] font-black"
                >
                  View All Prices
                </button>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-zinc-100 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400">Core Analyses (v2)</h3>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-black ${performanceGrowthPct >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    Sales {performanceGrowthPct >= 0 ? '+' : ''}{performanceGrowthPct.toFixed(1)}%
                  </span>
                  <span className="text-[10px] font-black text-amber-600">Slow movers {slowMoverCount}</span>
                  <span className="text-[10px] font-black text-indigo-600">Growing categories {highGrowthCategoryCount}</span>
                </div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                <div className="p-3 bg-zinc-50 rounded-2xl">
                  <p className="text-[10px] font-black uppercase text-zinc-400 mb-2">Category Revenue Share</p>
                  <div className="space-y-2 text-[10px] font-bold text-zinc-700">
                    {performanceTopCategories.length === 0 && <div className="text-zinc-400">No category split yet.</div>}
                    {performanceTopCategories.map((item) => (
                      <div key={item.name} className="flex items-center justify-between">
                        <span>{item.name}</span>
                        <span>{item.share.toFixed(1)}%</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="p-3 bg-zinc-50 rounded-2xl">
                  <p className="text-[10px] font-black uppercase text-zinc-400 mb-2">Stock-Out Risks (&lt;3 days)</p>
                  <div className="space-y-2 text-[10px] font-bold text-zinc-700">
                    {stockoutRiskItems.length === 0 && <div className="text-zinc-400">No immediate stock-out risk.</div>}
                    {stockoutRiskItems.map((item) => (
                      <div key={`${item.seller_product_id || item.product_id || item.name}`} className="flex items-center justify-between">
                        <span className="truncate pr-2">{item.name || item.product_id || 'Product'}</span>
                        <span>{Number(item.stock_coverage_days ?? 0).toFixed(1)}d</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="p-3 bg-zinc-50 rounded-2xl">
                  <p className="text-[10px] font-black uppercase text-zinc-400 mb-2">Pricing Gaps vs Market</p>
                  <div className="space-y-2 text-[10px] font-bold text-zinc-700">
                    {pricingOpportunities.length === 0 && <div className="text-zinc-400">No pricing delta data yet.</div>}
                    {pricingOpportunities.map((item) => (
                      <div key={`${item.name}-${item.category}`} className="flex items-center justify-between">
                        <span className="truncate pr-2">{item.name}</span>
                        <span className={item.deltaPct >= 0 ? 'text-rose-600' : 'text-emerald-600'}>
                          {item.deltaPct >= 0 ? '+' : ''}{item.deltaPct.toFixed(1)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="mt-4">
                <p className="text-[10px] font-black uppercase text-zinc-400 mb-2">Do This Now</p>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                  {actionNowCards.length === 0 && (
                    <div className="p-3 bg-zinc-50 rounded-2xl text-[10px] font-bold text-zinc-500">
                      No urgent actions generated yet.
                    </div>
                  )}
                  {actionNowCards.map((item, idx) => (
                    <div key={`${item.action || 'action'}-${item.product_id || item.name || idx}`} className="p-3 bg-zinc-50 rounded-2xl">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-[10px] font-black text-zinc-800 uppercase tracking-widest">{String(item.action || 'action').replace('_', ' ')}</p>
                        {item.value !== undefined && Number.isFinite(Number(item.value)) && (
                          <span className="text-[10px] font-black text-indigo-600">{Number(item.value).toFixed(1)}</span>
                        )}
                      </div>
                      <p className="mt-1 text-[10px] font-bold text-zinc-700">{item.name || item.product_id || item.category || 'Item'}</p>
                      <p className="mt-1 text-[10px] text-zinc-500">{item.reason || 'Action generated from analytics rules.'}</p>
                      <div className="mt-2">
                        <button
                          onClick={() => handleActionCard(item)}
                          className="px-3 py-2 rounded-xl bg-zinc-900 text-white text-[10px] font-black"
                        >
                          Apply In Products
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-black text-zinc-900">Intelligence Hub</h2>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                  <Sparkles className="w-3 h-3" /> Live Engine
                </div>
                {onOpenSellerChat && (
                  <button
                    onClick={onOpenSellerChat}
                    className="p-2 rounded-full bg-[#1976D2] text-white shadow-lg"
                    title="Seller Studio AI Assistant"
                  >
                    <MessageSquare className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* God View Summary */}
            <div className="bg-zinc-900 text-white rounded-3xl p-6 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-white/60 font-black">God View</p>
                  <p className="text-lg font-black">{seller.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-white/60 font-black">Rank Score</p>
                  <p className="text-sm font-black">{rankScore !== undefined ? rankScore.toFixed(2) : '—'}</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 text-[10px] font-bold">
                <div className="bg-white/10 rounded-2xl p-3">
                  <p className="text-white/60 uppercase">Rewards (24h)</p>
                  <p className="text-sm font-black">
                    {todayRewardsTotal > 0 ? `${sellerRewardsBalance?.currency ?? 'KES'} ${Math.round(todayRewardsTotal)}` : '—'}
                  </p>
                </div>
                <div className="bg-white/10 rounded-2xl p-3">
                  <p className="text-white/60 uppercase">Revenue</p>
                  <p className="text-sm font-black">
                    {totalRevenue !== null ? `KSh ${Math.round(totalRevenue)}` : '—'}
                  </p>
                </div>
                <div className="bg-white/10 rounded-2xl p-3">
                  <p className="text-white/60 uppercase">Network</p>
                  <p className="text-sm font-black">
                    {networkFollowers ? `${networkFollowers.toLocaleString()} followers` : '—'}
                  </p>
                </div>
              </div>
              <div className="mt-4 bg-white/10 rounded-2xl p-3">
                <p className="text-[10px] font-black text-white/70 mb-2">Data Sources (Active)</p>
                {analyticsGodViewSources.length === 0 ? (
                  <div className="p-2 bg-white/10 rounded-xl text-[10px] text-white/70">
                    No data sources yet.
                  </div>
                ) : (
                  <div className="grid grid-cols-5 gap-2 text-[10px] font-bold text-white/80">
                    {analyticsGodViewSources.map(source => (
                      <div key={source.label} className="bg-white/10 rounded-xl p-2 text-center">
                        <p className="text-white/60">{source.label}</p>
                        <p className="text-white font-black">{source.value}</p>
                      </div>
                    ))}
                    <div className="bg-emerald-500/20 rounded-xl p-2 text-center">
                      <p className="text-white/60">Total</p>
                      <p className="text-white font-black">{analyticsGodViewSources.reduce((sum, s) => sum + s.value, 0)}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Unified Demand Intelligence */}
            <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold">Live Demand Forecasts</h3>
                <button
                  onClick={handleOpenProductsTab}
                  className="px-3 py-2 bg-zinc-900 text-white rounded-xl text-[10px] font-bold"
                >
                  Stock Up
                </button>
              </div>
              <div className="space-y-3">
                {analyticsGodViewDemand.length === 0 && (
                  <div className="p-3 bg-zinc-50 rounded-2xl text-[10px] font-bold text-zinc-500">
                    No demand data yet.
                  </div>
                )}
                {analyticsGodViewDemand.map(item => (
                  <div key={item.name}>
                    <div className="flex items-center justify-between text-[10px] font-bold text-zinc-600">
                      <span>{item.name}</span>
                      <span>{item.pct}%</span>
                    </div>
                    <div className="h-2 bg-zinc-100 rounded-full mt-1 overflow-hidden">
                      <div className="h-2 bg-emerald-500 rounded-full" style={{ width: `${item.pct}%` }} />
                    </div>
                  </div>
                ))}
                <div className="mt-3 p-3 bg-emerald-50 rounded-2xl text-[10px] font-bold text-emerald-700">
                  🔔 {analyticsGodViewAlerts[0] || 'No active alerts'}
                </div>
              </div>
            </div>

            {/* Buyer Insights */}
            <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold">Buyer Insights</h3>
                <span className="text-[10px] font-bold text-emerald-600">
                  Repeat rate: {analyticsBuyers?.repeat_rate !== undefined ? `${Math.round(Number(analyticsBuyers.repeat_rate) * 100)}%` : '—'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-[10px] font-bold text-zinc-600">
                <div className="p-3 bg-zinc-50 rounded-2xl">
                  New buyers: {analyticsBuyers?.new_buyers ?? '—'}
                </div>
                <div className="p-3 bg-zinc-50 rounded-2xl">
                  CLV: {analyticsBuyers?.clv ? `KES ${analyticsBuyers.clv}` : '—'}
                </div>
                <div className="p-3 bg-zinc-50 rounded-2xl">
                  CAC: {analyticsBuyers?.cac ? `KES ${analyticsBuyers.cac}` : '—'}
                </div>
                <div className="p-3 bg-zinc-50 rounded-2xl">
                  Repeat buyers: {analyticsBuyers?.repeat_rate !== undefined
                    ? `${Math.round(Number(analyticsBuyers.repeat_rate) * 100)}%`
                    : '—'}
                </div>
              </div>
            </div>

            {/* Competitor Benchmark */}
            <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold">Competitor Benchmark</h3>
                <span className="text-[10px] font-bold text-zinc-400">Network data</span>
              </div>
              <div className="grid grid-cols-4 gap-2 text-[10px] font-bold text-zinc-500">
                <div>Duka</div>
                <div>Omo Price</div>
                <div>Stock</div>
                <div>Trend</div>
              </div>
              <div className="space-y-2 mt-2">
                {analyticsGodViewCompetitors.map(row => (
                  <div key={row.name} className="grid grid-cols-4 gap-2 text-[10px] font-bold text-zinc-700 bg-zinc-50 rounded-2xl p-2">
                    <div>{row.name}</div>
                    <div>{row.price}</div>
                    <div>{row.stock}</div>
                    <div>{row.trend}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Inventory Synopsis */}
            <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold">Inventory Synopsis</h3>
                <span className="text-[10px] font-bold text-zinc-400">Photos + POS + ERP</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-[10px] font-bold text-zinc-500">
                <div>Product</div>
                <div>Your Stock</div>
                <div>Network</div>
              </div>
              <div className="space-y-2 mt-2">
                {analyticsGodViewInventory.map(item => (
                  <div key={item.name} className="grid grid-cols-3 gap-2 text-[10px] font-bold text-zinc-700 bg-zinc-50 rounded-2xl p-2">
                    <div>{item.name}</div>
                    <div>{item.your}</div>
                    <div>{item.network}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Live Data Feeds */}
            <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold">Live Data Feeds</h3>
                <span className="text-[10px] font-bold text-emerald-600">
                  {todayRewardsTotal > 0
                    ? `+${Math.round(todayRewardsTotal)} ${sellerRewardsBalance?.currency ?? 'KES'} earned today`
                    : 'No rewards yet today'}
                </span>
              </div>
              <div className="space-y-2 text-[10px] font-bold text-zinc-600">
                {analyticsGodViewSources.length === 0 && (
                  <div className="p-2 bg-zinc-50 rounded-2xl text-zinc-400">No live feed data yet.</div>
                )}
                {analyticsGodViewSources.map((source) => (
                  <div key={source.label} className="flex items-center justify-between bg-zinc-50 rounded-2xl p-2">
                    <span>{source.label}</span>
                    <span>● {source.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Actionable Alerts */}
            <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold">Action Required</h3>
              </div>
              <div className="space-y-2 text-[10px] font-bold text-zinc-600">
                {analyticsGodViewAlerts.length === 0 && (
                  <div className="p-2 bg-zinc-50 rounded-2xl text-zinc-400">No actions required right now.</div>
                )}
                {analyticsGodViewAlerts.map(alert => (
                  <div key={alert} className="p-2 bg-zinc-50 rounded-2xl">{alert}</div>
                ))}
              </div>
            </div>

            {/* Neighborhood Heatmap */}
            <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold">Neighborhood Heatmap</h3>
                <span className="text-[10px] font-bold text-zinc-400">Live demand overview</span>
              </div>
              <div className="space-y-3">
                {analyticsGodViewDemand.map(item => (
                  <div key={item.name} className="flex items-center justify-between text-[10px] font-bold text-zinc-600">
                    <span>{item.name}</span>
                    <span>{item.pct}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Pro Upsell */}
            <div className="bg-zinc-900 text-white p-6 rounded-3xl shadow-xl">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold">Pro Unlocks</h3>
                <span className="text-[10px] font-bold text-emerald-400">
                  {isProActive
                    ? `Current plan: ${proPlan?.name ?? (activePlanTier || 'Pro')}`
                    : proPrice !== null
                      ? `${proCurrency} ${proPrice} →`
                      : 'Upgrade →'}
                </span>
              </div>
              <div className="space-y-2 text-[10px] font-bold text-white/80">
                {proFeatures.length > 0 ? (
                  proFeatures.slice(0, 3).map((feature, idx) => (
                    <div key={`${feature}-${idx}`}>✓ {String(feature)}</div>
                  ))
                ) : (
                  <div>✓ Unlock premium analytics and exports</div>
                )}
              </div>
              <div className="mt-3 text-[10px] text-white/70 font-bold">
                {liveBuyerTotalScans > 0
                  ? `${liveBuyerTotalScans} buyer signals in the last 24h`
                  : 'No buyer signals yet.'}
              </div>
            </div>

            {/* Key Metrics Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-5 rounded-3xl border border-zinc-100 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-indigo-50 rounded-xl">
                    <TrendingUp className="w-5 h-5 text-indigo-600" />
                  </div>
                </div>
                <p className="text-[10px] text-zinc-400 font-black uppercase tracking-widest">Total Revenue</p>
                <p className="text-2xl font-black text-zinc-900 mt-1">
                  {totalRevenue !== null ? formatCurrencyKES(totalRevenue) : '—'}
                </p>
              </div>
              <div className="bg-white p-5 rounded-3xl border border-zinc-100 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-emerald-50 rounded-xl">
                    <Users className="w-5 h-5 text-emerald-600" />
                  </div>
                </div>
                <p className="text-[10px] text-zinc-400 font-black uppercase tracking-widest">Customer Reach</p>
                <p className="text-2xl font-black text-zinc-900 mt-1">
                  {funnelSessions !== null ? formatCompactNumber(funnelSessions) : '—'}
                </p>
              </div>
            </div>

            {/* Business KPI Suite */}
            <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-black uppercase tracking-widest text-zinc-400">Business KPIs</h3>
                  <p className="text-[10px] text-zinc-500">All KPIs are backend sourced.</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Gross Revenue', value: analyticsSummary?.gross_revenue !== undefined && analyticsSummary.gross_revenue !== '' ? `KES ${analyticsSummary.gross_revenue}` : '—', source: 'Analytics' },
                  { label: 'Net Revenue', value: analyticsSummary?.net_revenue !== undefined && analyticsSummary.net_revenue !== '' ? `KES ${analyticsSummary.net_revenue}` : '—', source: 'Analytics' },
                  { label: 'AOV', value: analyticsSummary?.aov !== undefined && analyticsSummary.aov !== '' ? `KES ${analyticsSummary.aov}` : '—', source: 'Analytics' },
                  { label: 'Orders', value: totalOrders !== null ? `${totalOrders}` : '—', source: 'Orders' },
                  { label: 'New Buyers', value: newCustomers !== null ? `${newCustomers}` : '—', source: 'Analytics' },
                  { label: 'Conversion', value: analyticsSummary?.conversion_rate !== undefined ? `${Number(analyticsSummary.conversion_rate).toFixed(1)}%` : '—', source: 'Analytics' },
                  { label: 'Repeat Rate', value: repeatRateD30 !== null ? `${repeatRateD30.toFixed(1)}%` : repeatRate !== null ? `${repeatRate}%` : '—', source: 'Analytics' },
                  { label: 'Sessions', value: analyticsSummary?.sessions !== undefined ? `${analyticsSummary.sessions}` : '—', source: 'Analytics' },
                  { label: 'CAC', value: marketingCAC !== null && Number.isFinite(marketingCAC) ? `KES ${Math.round(marketingCAC)}` : '—', source: 'Marketing' },
                  { label: 'LTV', value: marketingLTV !== null && Number.isFinite(marketingLTV) ? `KES ${Math.round(marketingLTV)}` : '—', source: 'Marketing' },
                  { label: 'ROAS', value: marketingROAS !== null && Number.isFinite(marketingROAS) ? `${marketingROAS.toFixed(1)}x` : '—', source: 'Marketing' },
                  { label: 'Cart Abandon', value: cartAbandonRate !== null ? `${cartAbandonRate.toFixed(0)}%` : '—', source: 'Analytics' },
                  { label: 'Items/Order', value: avgItemsPerOrder !== null && avgItemsPerOrder !== undefined ? `${avgItemsPerOrder.toFixed(1)}` : '—', source: 'Orders' },
                  { label: 'Rating', value: csat && csatCount > 0 ? `${csat.toFixed(1)}/5` : '—', source: 'Ratings' }
                ].map(metric => (
                  <div key={metric.label} className="p-3 bg-zinc-50 rounded-2xl">
                    <div className="flex items-center gap-2">
                      <p className="text-[10px] font-black uppercase text-zinc-400">{metric.label}</p>
                      {metric.source && (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-zinc-200 text-zinc-600">
                          {metric.source}
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-black text-zinc-900 mt-1">{metric.value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Buyer Scan Rewards */}
            <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold">Buyer QR Rewards</h3>
                  <p className="text-[10px] text-zinc-500">Live buyer signals from scans and searches</p>
                </div>
                <div className="px-2 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black">Live signals</div>
              </div>
              <div className="grid grid-cols-3 gap-3 text-[10px] font-bold text-zinc-600">
                <div className="p-3 bg-zinc-50 rounded-2xl">
                  <p className="text-[9px] text-zinc-400 uppercase">24h scans</p>
                  <p className="text-sm font-black text-zinc-900">{Number.isFinite(liveBuyerTotalScans) ? liveBuyerTotalScans : '—'}</p>
                </div>
                <div className="p-3 bg-zinc-50 rounded-2xl">
                  <p className="text-[9px] text-zinc-400 uppercase">Hotspots</p>
                  <p className="text-sm font-black text-zinc-900">{liveBuyerHotspots.length}</p>
                </div>
                <div className="p-3 bg-zinc-50 rounded-2xl">
                  <p className="text-[9px] text-zinc-400 uppercase">Top hotspot</p>
                  <p className="text-sm font-black text-zinc-900">
                    {liveBuyerTop && typeof liveBuyerTop.lat === 'number' && typeof liveBuyerTop.lng === 'number'
                      ? `${liveBuyerTop.lat.toFixed(2)}, ${liveBuyerTop.lng.toFixed(2)}`
                      : '—'}
                  </p>
                </div>
              </div>
              <div className="mt-4 h-40 rounded-2xl bg-zinc-100 flex items-center justify-center text-[10px] font-bold text-zinc-500">
                {liveBuyerHotspots.length === 0
                  ? 'No live buyer signals yet.'
                  : `Top hotspots: ${liveBuyerHotspots
                      .map(
                        (item) =>
                          `${item.lat?.toFixed(2) ?? '—'}, ${item.lng?.toFixed(2) ?? '—'} (${item.scan_count ?? item.scanCount ?? 0})`,
                      )
                      .join(' • ')}`}
              </div>
              <div className="mt-3 text-[10px] text-zinc-500 font-bold">
                {liveBuyerTotalScans > 0
                  ? `Daily nudge: ${liveBuyerTotalScans} buyer signals in the last 24h. Refresh top SKUs.`
                  : 'Daily nudge: No buyer signals yet. Promote or share your top items.'}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Demand Alerts */}
              <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold">Demand Alerts</h3>
                  <span className="text-[10px] text-emerald-600 font-bold">Actionable</span>
                </div>
                <div className="space-y-3">
                  {analyticsTopSearched.length === 0 && (
                    <div className="p-3 bg-zinc-50 rounded-2xl text-[10px] font-bold text-zinc-500">
                      No demand alerts yet.
                    </div>
                  )}
                  {analyticsTopSearched.slice(0, 3).map((item) => (
                    <div key={item.name} className="p-3 bg-zinc-50 rounded-2xl flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-zinc-900">{item.name}</p>
                        <p className="text-[10px] text-zinc-500">{item.searches} searches • {item.trend || 'steady'}</p>
                      </div>
                      <button
                        onClick={() => handleCreateCategorySpotlight(item.category)}
                        className="px-3 py-2 bg-zinc-900 text-white rounded-xl text-[10px] font-bold"
                      >
                        Feature
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Searched Products */}
              <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold">Top Searched Products</h3>
                  <span className="text-[10px] text-zinc-400 font-bold">Your area</span>
                </div>
                <div className="space-y-3">
                  {analyticsTopSearched.map((item) => (
                    <div key={item.name} className="p-3 bg-zinc-50 rounded-2xl flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-zinc-900">{item.name}</p>
                        <p className="text-[10px] text-zinc-500">{item.searches} searches • {item.trend}</p>
                      </div>
                      <button
                        onClick={() => handleAddStockFromTrend(item)}
                        className="px-3 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-bold"
                      >
                        Add Stock
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Competitor Price Benchmarks */}
              <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold">Competitor Price Benchmarks</h3>
                  <span className="text-[10px] text-zinc-400 font-bold">Market comparison</span>
                </div>
                <div className="space-y-3">
                  {analyticsCompetitorPricing.length === 0 && (
                    <div className="p-3 bg-zinc-50 rounded-2xl text-[10px] font-bold text-zinc-500">
                      No market pricing data yet.
                    </div>
                  )}
                  {analyticsCompetitorPricing.map((item) => (
                    <div key={item.name} className="p-3 bg-zinc-50 rounded-2xl">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-bold text-zinc-900">{item.name}</p>
                        <span className="text-[10px] font-bold text-zinc-500">Market median: KES {item.avgPrice}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-600">
                        <span>Your: KES {item.yourPrice}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Sales Performance Chart */}
              <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-sm font-black uppercase tracking-widest text-zinc-400">Sales Performance</h3>
                  <div className="flex items-center gap-2">
                    {[7, 14, 30].map((days) => (
                      <button
                        key={days}
                        onClick={() => setSalesSeriesDays(days)}
                        className={`px-2 py-1 rounded-lg text-[10px] font-bold ${salesSeriesDays === days ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-600'}`}
                      >
                        {days}d
                      </button>
                    ))}
                  </div>
                </div>
                {analyticsSalesData.length === 0 ? (
                  <div className="h-64 rounded-2xl bg-zinc-50 flex items-center justify-center text-[10px] font-bold text-zinc-500">
                    No sales data yet.
                  </div>
                ) : (
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={analyticsSalesData}>
                        <defs>
                          <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1}/>
                            <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
                        <XAxis 
                          dataKey="name" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fontSize: 10, fontWeight: 700, fill: '#a1a1aa' }}
                        />
                        <YAxis hide />
                        <Tooltip content={<SalesSeriesTooltip />} />
                        <Area 
                          type="monotone" 
                          dataKey="sales" 
                          stroke="#4f46e5" 
                          strokeWidth={3}
                          fillOpacity={1} 
                          fill="url(#colorSales)" 
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                )}
                {analyticsSalesData.length > 0 && (
                  <div className="mt-3 flex items-center justify-between text-[10px] text-zinc-500 font-bold">
                    <span>Min KES {Number.isFinite(salesMinMax.min) ? Math.round(salesMinMax.min).toLocaleString() : '0'}</span>
                    <span>Max KES {Number.isFinite(salesMinMax.max) ? Math.round(salesMinMax.max).toLocaleString() : '0'}</span>
                  </div>
                )}
                {salesSeriesLoading && (
                  <div className="mt-2 text-[10px] text-zinc-400 font-bold">Updating sales performance…</div>
                )}
              </div>

              {/* Sales Velocity Trends */}
              <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-widest text-zinc-400">Sales Velocity Trends</h3>
                    <p className="text-[10px] text-zinc-400 mt-1">Units sold per day vs Target</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {[7, 14, 30].map((days) => (
                      <button
                        key={days}
                        onClick={() => setSalesVelocityDays(days)}
                        className={`px-2 py-1 rounded-lg text-[10px] font-bold ${salesVelocityDays === days ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-600'}`}
                      >
                        {days}d
                      </button>
                    ))}
                  </div>
                </div>
                {analyticsSalesVelocity.length === 0 ? (
                  <div className="h-64 rounded-2xl bg-zinc-50 flex items-center justify-center text-[10px] font-bold text-zinc-500">
                    No velocity data yet.
                  </div>
                ) : (
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={analyticsSalesVelocity}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
                        <XAxis 
                          dataKey="name" 
                          axisLine={false} 
                          tickLine={false}
                          tick={{ fontSize: 10, fontWeight: 700, fill: '#18181b' }}
                        />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#a1a1aa' }} />
                        <Tooltip content={<SalesSeriesTooltip />} />
                        <Legend iconType="circle" wrapperStyle={{ fontSize: 10, fontWeight: 700, paddingTop: 20 }} />
                        <Line 
                          type="monotone" 
                          dataKey="velocity" 
                          stroke="#4f46e5" 
                          strokeWidth={3} 
                          dot={{ r: 4, fill: '#4f46e5', strokeWidth: 2, stroke: '#fff' }}
                          activeDot={{ r: 6 }}
                          name="Current Velocity"
                        />
                        <Line 
                          type="monotone" 
                          dataKey="target" 
                          stroke="#e2e8f0" 
                          strokeWidth={2} 
                          strokeDasharray="5 5"
                          dot={false}
                          name="Daily Target"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
                {analyticsSalesVelocity.length > 0 && (
                  <div className="mt-3 flex items-center justify-between text-[10px] text-zinc-500 font-bold">
                    <span>Min {Number.isFinite(salesVelocityMinMax.min) ? salesVelocityMinMax.min : 0}</span>
                    <span>Max {Number.isFinite(salesVelocityMinMax.max) ? salesVelocityMinMax.max : 0}</span>
                  </div>
                )}
                {salesVelocityLoading && (
                  <div className="mt-2 text-[10px] text-zinc-400 font-bold">Updating velocity…</div>
                )}
              </div>
            </div>

            {/* Inventory & Data Management */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm">
                <h3 className="text-sm font-black uppercase tracking-widest text-zinc-400 mb-4">Inventory Management</h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Stockout Risk', value: `${stockoutRisk.toFixed(0)}%` },
                    { label: 'Days Cover', value: analyticsInventory?.days_cover ? `${analyticsInventory.days_cover.toFixed(1)} days` : '—' },
                    { label: 'Reorder Point', value: analyticsInventory?.reorder_point ? `${analyticsInventory.reorder_point}` : '—' }
                  ].map(metric => (
                    <div key={metric.label} className="p-3 bg-zinc-50 rounded-2xl">
                      <p className="text-[10px] font-black uppercase text-zinc-400">{metric.label}</p>
                      <p className="text-sm font-black text-zinc-900 mt-1">{metric.value}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 p-3 bg-amber-50 rounded-2xl text-[10px] font-bold text-amber-700">
                  Tip: Improve stock coverage by prioritizing top-selling SKUs and setting reorder points.
                </div>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm">
                <h3 className="text-sm font-black uppercase tracking-widest text-zinc-400 mb-4">Data Management</h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Coverage', value: dataCoverageRate !== null ? `${dataCoverageRate.toFixed(0)}%` : '—', tooltip: 'Share of required analytics inputs present for this seller.' },
                    { label: 'Freshness', value: dataFreshnessDays !== null ? `${Math.round(dataFreshnessDays)} days` : '—', tooltip: 'Average age of key data feeds used for analytics.' },
                    { label: 'Verification', value: verificationRate !== null ? `${verificationRate.toFixed(0)}%` : '—', tooltip: 'Portion of data that has been verified via trusted sources.' },
                    { label: 'Anomaly Rate', value: anomalyRate !== null ? `${anomalyRate.toFixed(1)}%` : '—', tooltip: 'Percentage of events flagged as anomalies in the last 30 days.' }
                  ].map(metric => (
                    <div key={metric.label} className="p-3 bg-zinc-50 rounded-2xl">
                      <p className="text-[10px] font-black uppercase text-zinc-400" title={metric.tooltip}>{metric.label}</p>
                      <p className="text-sm font-black text-zinc-900 mt-1">{metric.value}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex items-center justify-between text-[10px] text-zinc-500 font-bold">
                  <span title="Percent of listings with at least one verified media asset.">Media coverage</span>
                  <span>{dataMediaCoverage !== null ? dataMediaCoverage.toFixed(0) : '—'}%</span>
                </div>
                <div className="mt-2 flex items-center justify-between text-[10px] text-zinc-500 font-bold">
                  <span title="Percent of listings mapped to a valid category.">Category coverage</span>
                  <span>{dataCategoryCoverage !== null ? dataCategoryCoverage.toFixed(0) : '—'}%</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-widest text-zinc-400">Inventory Trend</h3>
                    <p className="text-[10px] text-zinc-500">Change: {inventoryTrendLabel}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {[7, 14, 30].map((days) => (
                      <button
                        key={days}
                        onClick={() => setInventorySeriesDays(days)}
                        className={`px-2 py-1 rounded-lg text-[10px] font-bold ${inventorySeriesDays === days ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-600'}`}
                      >
                        {days}d
                      </button>
                    ))}
                  </div>
                </div>
                {analyticsInventoryTrend.length === 0 ? (
                  <div className="h-40 rounded-2xl bg-zinc-50 flex items-center justify-center text-[10px] font-bold text-zinc-500">
                    No inventory trend data yet.
                  </div>
                ) : (
                  <div className="h-40">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={analyticsInventoryTrend}>
                        <defs>
                          <linearGradient id="inventoryFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#22c55e" stopOpacity={0.35} />
                            <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
                        <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                        <YAxis hide />
                        <Tooltip labelFormatter={(_, payload) => formatDateLabel(payload?.[0]?.payload?.date)} />
                        <Area type="monotone" dataKey="stock" stroke="#16a34a" fill="url(#inventoryFill)" strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                )}
                {analyticsInventoryTrend.length > 0 && (
                  <div className="mt-3 flex items-center justify-between text-[10px] text-zinc-500 font-bold">
                    <span>Min {Number.isFinite(inventoryMinMax.min) ? inventoryMinMax.min : 0}</span>
                    <span>Max {Number.isFinite(inventoryMinMax.max) ? inventoryMinMax.max : 0}</span>
                  </div>
                )}
                {inventorySeriesLoading && (
                  <div className="mt-2 text-[10px] text-zinc-400 font-bold">Updating inventory trend…</div>
                )}
              </div>

              <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-widest text-zinc-400">Conversion Trend</h3>
                    <p className="text-[10px] text-zinc-500">Change: {conversionTrendLabel}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {[7, 14, 30].map((days) => (
                      <button
                        key={days}
                        onClick={() => setConversionSeriesDays(days)}
                        className={`px-2 py-1 rounded-lg text-[10px] font-bold ${conversionSeriesDays === days ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-600'}`}
                      >
                        {days}d
                      </button>
                    ))}
                  </div>
                </div>
                {analyticsConversionTrend.length === 0 ? (
                  <div className="h-40 rounded-2xl bg-zinc-50 flex items-center justify-center text-[10px] font-bold text-zinc-500">
                    No conversion data yet.
                  </div>
                ) : (
                  <div className="h-40">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={analyticsConversionTrend}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
                        <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                        <YAxis hide />
                        <Tooltip
                          formatter={(value) => `${Number(value).toFixed(1)}%`}
                          labelFormatter={(_, payload) => formatDateLabel(payload?.[0]?.payload?.date)}
                        />
                        <Line type="monotone" dataKey="rate" stroke="#f97316" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
                {analyticsConversionTrend.length > 0 && (
                  <div className="mt-3 flex items-center justify-between text-[10px] text-zinc-500 font-bold">
                    <span>Min {Number.isFinite(conversionMinMax.min) ? conversionMinMax.min.toFixed(1) : '0.0'}%</span>
                    <span>Max {Number.isFinite(conversionMinMax.max) ? conversionMinMax.max.toFixed(1) : '0.0'}%</span>
                  </div>
                )}
                {conversionSeriesLoading && (
                  <div className="mt-2 text-[10px] text-zinc-400 font-bold">Updating conversion trend…</div>
                )}
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-black uppercase tracking-widest text-zinc-400">Alert Preferences</h3>
                  <p className="text-[10px] text-zinc-500">Opt-in alerts based on your live analytics.</p>
                </div>
                <button
                  onClick={handleSaveSellerAlerts}
                  disabled={sellerAlertsSaving}
                  className="px-3 py-2 rounded-xl text-[10px] font-bold bg-zinc-900 text-white disabled:opacity-60"
                >
                  {sellerAlertsSaving ? 'Saving…' : 'Save'}
                </button>
              </div>
              {sellerAlertsStatus && (
                <div className="mb-3 text-[10px] font-bold text-zinc-500">{sellerAlertsStatus}</div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {sellerAlertsDraft.map((def) => {
                  const active = def.active ?? false;
                  const threshold = typeof def.threshold === 'number' ? def.threshold : 0;
                  const label = def.label || def.type || 'Alert';
                  const unit = def.unit || '';
                  return (
                    <div key={def.type || label} className="p-3 bg-zinc-50 rounded-2xl">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-bold text-zinc-900">{label}</p>
                        <button
                          onClick={() => def.type && handleToggleSellerAlert(def.type)}
                          className={`px-2 py-1 rounded-full text-[10px] font-bold ${active ? 'bg-emerald-100 text-emerald-700' : 'bg-zinc-200 text-zinc-600'}`}
                        >
                          {active ? 'On' : 'Off'}
                        </button>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-zinc-500 font-bold">
                        <span>Threshold</span>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            className="w-20 px-2 py-1 rounded-lg bg-white border border-zinc-200 text-[10px] font-bold text-zinc-700"
                            value={threshold}
                            min={0}
                            step={unit === 'stars' ? 0.1 : 1}
                            onChange={(e) => def.type && handleSellerAlertThreshold(def.type, Number(e.target.value || 0))}
                          />
                          <span>{unit}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {sellerAlertsDraft.length === 0 && (
                  <div className="col-span-2 p-3 bg-zinc-50 rounded-2xl text-center text-[10px] text-zinc-500 font-bold">
                    No alert rules configured yet.
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-zinc-100 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold">Peak Hours Report</h3>
                <div className="flex items-center gap-2">
                  {[7, 14, 30].map((days) => (
                    <button
                      key={days}
                      onClick={() => setPeakHoursDays(days)}
                      className={`px-2 py-1 rounded-lg text-[10px] font-bold ${peakHoursDays === days ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-600'}`}
                    >
                      {days}d
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  {[7, 14, 30].map((days) => (
                    <button
                      key={days}
                      onClick={() => setPeakHoursDays(days)}
                      className={`px-2 py-1 rounded-lg text-[10px] font-bold ${peakHoursDays === days ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-600'}`}
                    >
                      {days}d
                    </button>
                  ))}
                </div>
                {peakHourSlots.length === 0 && (
                  <div className="px-3 py-2 bg-zinc-50 rounded-xl text-[10px] font-bold text-zinc-600">
                    No peak hour data yet.
                  </div>
                )}
                {peakHourSlots.map((slot) => (
                  <div key={slot} className="px-3 py-2 bg-zinc-50 rounded-xl text-[10px] font-bold text-zinc-600">
                    {slot}
                  </div>
                ))}
              </div>
              {analyticsPeakHours.length === 0 ? (
                <div className="mt-4 h-48 rounded-2xl bg-zinc-50 flex items-center justify-center text-[10px] font-bold text-zinc-500">
                  No peak hour data yet.
                </div>
              ) : (
                <div className="mt-4 h-48 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analyticsPeakHours}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
                      <XAxis
                        dataKey="hour"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 8, fontWeight: 700, fill: '#18181b' }}
                      />
                      <YAxis hide />
                      <Tooltip />
                      <Bar dataKey="searches" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
              {analyticsPeakHours.length > 0 && (
                <div className="mt-3 flex items-center justify-between text-[10px] text-zinc-500 font-bold">
                  <span>Min {Number.isFinite(peakMinMax.min) ? peakMinMax.min : 0}</span>
                  <span>Max {Number.isFinite(peakMinMax.max) ? peakMinMax.max : 0}</span>
                </div>
              )}
              {peakHoursLoading && (
                <div className="mt-2 text-[10px] text-zinc-400 font-bold">Updating peak hours…</div>
              )}
              <p className="mt-4 text-[10px] text-zinc-500 font-medium italic">
                {peakHourSlots.length > 0
                  ? `"Most searches happen around ${peakHourSlots[0]}. Consider staffing for that window."`
                  : '"Peak hour insights will appear once search data is available."'}
              </p>
            </div>

            {/* Channel Mix */}
            <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-black uppercase tracking-widest text-zinc-400">Channel Mix</h3>
                <span className="text-[10px] text-zinc-400 font-bold">Traffic sources</span>
              </div>
              {channelMix.length === 0 ? (
                <div className="p-3 bg-zinc-50 rounded-2xl text-[10px] font-bold text-zinc-500">
                  No channel mix data yet.
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-3">
                  {channelMix.map(c => (
                    <div key={c.name} className="p-3 bg-zinc-50 rounded-2xl text-center">
                      <p className="text-xs font-black text-zinc-900">{c.value}%</p>
                      <p className="text-[10px] text-zinc-400 font-bold uppercase">{c.name}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Market Demand vs Seller Share */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-widest text-zinc-400">Market Demand</h3>
                    <p className="text-[10px] text-zinc-400 mt-1">Benchmarked against 50+ onboarded shops</p>
                  </div>
                  <div className="p-2 bg-zinc-50 rounded-xl">
                    <BarChart3 className="w-5 h-5 text-zinc-400" />
                  </div>
                </div>
                {analyticsCategoryDemand.length === 0 ? (
                  <div className="p-3 bg-zinc-50 rounded-2xl text-[10px] font-bold text-zinc-500">
                    No market demand data yet.
                  </div>
                ) : (
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analyticsCategoryDemand} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f4f4f5" />
                        <XAxis type="number" hide />
                        <YAxis 
                          dataKey="category" 
                          type="category" 
                          axisLine={false} 
                          tickLine={false}
                          tick={{ fontSize: 10, fontWeight: 700, fill: '#18181b' }}
                          width={80}
                        />
                        <Tooltip 
                          cursor={{ fill: '#f8fafc' }}
                          contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                        />
                        <Bar dataKey="demand" fill="#e2e8f0" radius={[0, 4, 4, 0]} barSize={12} name="Market Avg" />
                        <Bar dataKey="sellerShare" fill="#4f46e5" radius={[0, 4, 4, 0]} barSize={12} name="Your Share" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-widest text-zinc-400">Customer Demographics</h3>
                    <p className="text-[10px] text-zinc-400 mt-1">Audience age distribution</p>
                  </div>
                  <div className="p-2 bg-zinc-50 rounded-xl">
                    <Users className="w-5 h-5 text-zinc-400" />
                  </div>
                </div>
                {analyticsDemographics.length === 0 ? (
                  <div className="p-3 bg-zinc-50 rounded-2xl text-[10px] font-bold text-zinc-500">
                    No demographic data yet.
                  </div>
                ) : (
                  <div className="flex items-center gap-8">
                    <div className="w-40 h-40">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={analyticsDemographics}
                            cx="50%"
                            cy="50%"
                            innerRadius={40}
                            outerRadius={60}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {analyticsDemographics.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex-1 space-y-2">
                      {analyticsDemographics.map((item) => (
                        <div key={item.name} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                            <span className="text-[10px] font-bold text-zinc-600">{item.name}</span>
                          </div>
                          <span className="text-[10px] font-black">{item.value}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Competitor Pricing Insights */}
            <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-sm font-black uppercase tracking-widest text-zinc-400">Competitor Pricing Benchmarks</h3>
                  <p className="text-[10px] text-zinc-400 mt-1">Your price vs Market average</p>
                </div>
                <div className="p-2 bg-zinc-50 rounded-xl">
                  <TrendingUp className="w-5 h-5 text-zinc-400" />
                </div>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analyticsCompetitorPricing}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false}
                      tick={{ fontSize: 10, fontWeight: 700, fill: '#18181b' }}
                    />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#a1a1aa' }} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    />
                    <Bar dataKey="yourPrice" fill="#4f46e5" radius={[4, 4, 0, 0]} barSize={20} name="Your Price" />
                    <Bar dataKey="avgPrice" fill="#e2e8f0" radius={[4, 4, 0, 0]} barSize={20} name="Market Avg" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 p-3 bg-amber-50 border border-amber-100 rounded-xl">
                <p className="text-[10px] text-amber-700 font-bold">
                  <AlertCircle className="w-3 h-3 inline mr-1" />
                  Your price is {Math.round((analyticsMarket?.price_position ?? 0) * 100)}% above the market median. Consider adjusting.
                </p>
              </div>
            </div>

            {/* Trending Products & Supplier Connection */}
            <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-sm font-black uppercase tracking-widest text-zinc-400">Trending Products & Suppliers</h3>
                  <p className="text-[10px] text-zinc-400 mt-1">Connect with wholesalers for trending items</p>
                </div>
                <div className="p-2 bg-zinc-50 rounded-xl">
                  <ArrowUpRight className="w-5 h-5 text-zinc-400" />
                </div>
              </div>
              <div className="space-y-4">
                {analyticsTrendingProducts.map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-zinc-50 rounded-2xl">
                    <div>
                      <p className="text-xs font-bold text-zinc-900">{item.name}</p>
                      <p className="text-[10px] text-zinc-500">Demand: <span className="text-emerald-600 font-black">{item.demand}</span></p>
                      <p className="text-[10px] text-zinc-400">Supplier: {item.supplier}</p>
                    </div>
                    <button
                      onClick={() => setActiveTab('suppliers')}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold ${item.supplierId ? 'bg-zinc-900 text-white' : 'bg-zinc-200 text-zinc-500'}`}
                      disabled={!item.supplierId}
                    >
                      {item.supplierId ? 'Connect' : 'Browse Suppliers'}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Stock Health & AI Insights */}
            <div className="grid grid-cols-1 gap-6">
              <div className="bg-zinc-900 text-white p-6 rounded-3xl shadow-xl relative overflow-hidden">
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-indigo-400" />
                      <h3 className="text-sm font-black uppercase tracking-widest">AI Strategic Insights</h3>
                    </div>
                    <button
                      onClick={() => runAiInsight(true)}
                      className="px-3 py-1.5 rounded-full text-[9px] font-black uppercase bg-white/10 text-white/70 hover:text-white hover:bg-white/20"
                    >
                      Refresh Insights
                    </button>
                  </div>
                  <div className="space-y-4">
                    {aiInsightLoading && (
                      <div className="flex items-center gap-2 text-[10px] text-indigo-200">
                        <span className="inline-flex h-2 w-2 rounded-full bg-indigo-400 animate-pulse" />
                        Generating insights…
                      </div>
                    )}
                    {aiInsightError && (
                      <div className="text-[10px] text-amber-300 font-bold">
                        {aiInsightError}
                      </div>
                    )}
                    {!aiInsightLoading && aiInsightMessage && (
                      <div className="space-y-3">
                        <p className="text-[11px] text-white/80 leading-relaxed">{aiInsightMessage}</p>
                        {aiInsightMeta?.agent_status && Array.isArray(aiInsightMeta.agent_status) && aiInsightMeta.agent_status.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {aiInsightMeta.agent_status.map((status: string, idx: number) => {
                              const key = String(status || '').toLowerCase();
                              const label = AGENT_STATUS_LABELS[key] || status;
                              return (
                                <span
                                  key={`insight-agent-${idx}`}
                                  className="px-2 py-1 rounded-full text-[9px] font-semibold tracking-[0.12em] bg-white/10 text-white/70"
                                >
                                  {label}
                                </span>
                              );
                            })}
                          </div>
                        )}
                        {renderMedia(aiInsightMeta || undefined, aiInsightMessage)}
                        {Array.isArray(aiInsightMeta?.references) && aiInsightMeta?.references.length > 0 && (
                          <div className="space-y-2">
                            <div className="flex flex-wrap gap-2">
                              {aiInsightMeta.references.map((ref: any, idx: number) => (
                                <span
                                  key={`insight-ref-${idx}`}
                                  className="px-2 py-1 rounded-full text-[9px] font-semibold tracking-[0.12em] bg-emerald-500/10 text-emerald-200"
                                >
                                  {ref.label}{ref.detail ? ` · ${ref.detail}` : ''}
                                </span>
                              ))}
                            </div>
                            <div className="space-y-1">
                              {aiInsightMeta.references.map((ref: any, idx: number) => {
                                const items = ref?.data?.items;
                                if (!Array.isArray(items) || items.length === 0) return null;
                                return (
                                  <div key={`insight-ref-items-${idx}`} className="text-[10px] text-white/70 space-y-1">
                                    {items.slice(0, 3).map((item: any, itemIdx: number) => (
                                      <div key={`insight-ref-item-${idx}-${itemIdx}`} className="flex flex-wrap gap-2">
                                        {Object.entries(item).map(([key, value]) => (
                                          <span key={key} className="px-2 py-1 rounded-full bg-white/5">
                                            {key}: {String(value ?? '')}
                                          </span>
                                        ))}
                                      </div>
                                    ))}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    {!aiInsightLoading && !aiInsightMessage && !aiInsightError && (
                      <div className="text-[10px] text-white/60">
                        Insights will appear once your data refreshes.
                      </div>
                    )}
                  </div>
                </div>
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/10 blur-3xl -mr-16 -mt-16" />
              </div>

              {/* Daily View Counts */}
              <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-black uppercase tracking-widest text-zinc-400">Daily Engagement</h3>
                  <div className="p-2 bg-zinc-50 rounded-xl">
                    <Users className="w-5 h-5 text-zinc-400" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-zinc-50 rounded-2xl">
                    <p className="text-[10px] text-zinc-400 font-bold uppercase">Product Views</p>
                    <p className="text-2xl font-black text-zinc-900">{dailyViews ?? '—'}</p>
                    <p className="text-[10px] text-zinc-500 font-bold">Last 24h views</p>
                  </div>
                  <div className="p-4 bg-zinc-50 rounded-2xl">
                    <p className="text-[10px] text-zinc-400 font-bold uppercase">Inquiries</p>
                    <p className="text-2xl font-black text-zinc-900">{dailyInquiries ?? '—'}</p>
                    <p className="text-[10px] text-zinc-500 font-bold">Last 24h inquiries</p>
                  </div>
                </div>
                <p className="text-[10px] text-zinc-500 mt-4 text-center font-medium">
                  Today: {dailyViews ?? '—'} people saw your products. {dailyInquiries ?? '—'} clicked to message you.
                </p>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm">
                <h3 className="text-sm font-black uppercase tracking-widest text-zinc-400 mb-6">Inventory Health</h3>
                <div className="flex items-center gap-8">
                  <div className="w-32 h-32">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={analyticsStockHealth}
                          cx="50%"
                          cy="50%"
                          innerRadius={30}
                          outerRadius={45}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {analyticsStockHealth.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex-1 space-y-3">
                    {analyticsStockHealth.map((item) => (
                      <div key={item.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                          <span className="text-[10px] font-bold text-zinc-600">{item.name}</span>
                        </div>
                        <span className="text-[10px] font-black">{item.value}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'marketing' && (
          <div className="space-y-6 pb-20">
            <h2 className="text-2xl font-black text-zinc-900">Marketing Hub</h2>
            {marketingStatus && (
              <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-2xl text-[10px] font-bold text-emerald-700">
                {marketingStatus}
              </div>
            )}

            {/* Marketing KPI Snapshot */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Revenue', value: marketingRevenue30d !== null ? `KES ${marketingRevenue30d.toFixed(0)}` : '—', hint: 'Completed orders' },
                { label: 'Orders (30d)', value: `${marketingOrders30d}`, hint: 'All channels' },
                { label: 'New Customers', value: `${marketingNewCustomers}`, hint: 'First-time buyers' },
                { label: 'ROAS', value: marketingROAS !== null ? `${marketingROAS.toFixed(2)}x` : '—', hint: 'Revenue / spend' }
              ].map((stat) => (
                <div key={stat.label} className="bg-white p-4 rounded-2xl border border-zinc-100 shadow-sm">
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">{stat.label}</p>
                  <p className="text-xl font-black text-zinc-900 mt-2">{stat.value}</p>
                  <p className="text-[10px] text-zinc-500 mt-1">{stat.hint}</p>
                </div>
              ))}
            </div>

            {/* Advanced KPIs */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'CAC', value: marketingCAC !== null ? `KES ${Math.round(marketingCAC)}` : '—', hint: 'Cost per customer' },
                { label: 'ROAS', value: marketingROAS !== null ? `${marketingROAS.toFixed(1)}x` : '—', hint: 'Revenue / spend' },
                { label: 'LTV', value: marketingLTV !== null ? `KES ${Math.round(marketingLTV)}` : '—', hint: 'Value per customer' }
              ].map((stat) => (
                <div key={stat.label} className="bg-white p-4 rounded-2xl border border-zinc-100 shadow-sm">
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">{stat.label}</p>
                  <p className="text-lg font-black text-zinc-900 mt-2">{stat.value}</p>
                  <p className="text-[10px] text-zinc-500 mt-1">{stat.hint}</p>
                </div>
              ))}
            </div>

            {/* Growth Funnel */}
            <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold">Order Funnel</h3>
                <span className="text-[10px] font-bold text-indigo-600">Latest</span>
              </div>
              <div className="grid grid-cols-4 gap-3 text-center">
                {[
                  { label: 'Customers', value: marketingNewCustomers },
                  { label: 'Orders', value: marketingOrders30d },
                  { label: 'Units', value: marketingUnits30d },
                  { label: 'Returns', value: marketingReturns30d }
                ].map((step) => (
                  <div key={step.label} className="bg-zinc-50 rounded-2xl p-3">
                    <p className="text-xs font-black text-zinc-900">
                      {step.value !== null && step.value !== undefined ? Number(step.value).toLocaleString() : '—'}
                    </p>
                    <p className="text-[10px] text-zinc-400 font-bold uppercase">{step.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Demand Heatmap */}
            <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold">Demand Heatmap</h3>
                <span className="text-[10px] text-zinc-400 font-bold">Hotspots by product demand</span>
              </div>
              <div className="relative h-64 rounded-2xl overflow-hidden bg-zinc-100 border border-zinc-200">
                <div ref={heatmapContainerRef} className="absolute inset-0" />
                {!mapboxToken && (
                  <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white bg-zinc-900/70">
                    Mapbox token missing. Add VITE_MAPBOX_TOKEN to enable maps.
                  </div>
                )}
                {mapboxToken && demandHeatmap.length === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-zinc-600 bg-white/80">
                    No demand hotspots yet.
                  </div>
                )}
                <div className="absolute top-3 right-3 flex flex-col gap-2">
                  <button
                    onClick={() => setShowPathRecorder(true)}
                    className="px-3 py-1.5 rounded-full bg-white/90 backdrop-blur text-[9px] font-black text-zinc-700 shadow border border-white"
                  >
                    Record Path
                  </button>
                </div>
                <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full text-[10px] font-bold text-zinc-700">
                  Warmer areas = higher demand
                </div>
              </div>
            </div>
            
            {/* Featured Listing */}
            <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-50 rounded-xl">
                    <Megaphone className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold">Featured Listing</h3>
                    <p className="text-[10px] text-zinc-400">Appear at the top of searches</p>
                  </div>
                </div>
                <span className="px-2 py-1 bg-zinc-100 rounded-lg text-[10px] font-bold text-zinc-500 uppercase">Inactive</span>
              </div>
                <p className="text-xs text-zinc-500 mb-4">
                  {featuredListingConfig?.duration_days
                    ? `Boost your visibility for ${featuredListingConfig.duration_days} days with featured placement.`
                    : 'Boost your visibility with featured placement.'}
                </p>
              
              {featuredListingDiscountThreshold && featuredListingDiscountPct ? (
                myProducts.length >= featuredListingDiscountThreshold ? (
                  <div className="mb-4 p-3 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center gap-2">
                    <Zap className="w-4 h-4 text-emerald-600" />
                    <p className="text-[10px] text-emerald-700 font-bold">
                      Scale Discount Active! {featuredListingDiscountPct}% off featured rates for {featuredListingDiscountThreshold}+ products.
                    </p>
                  </div>
                ) : (
                  <p className="text-[10px] text-indigo-600 font-bold mb-4">
                    Tip: List {featuredListingDiscountThreshold}+ products to unlock a {featuredListingDiscountPct}% discount on featured rates.
                  </p>
                )
              ) : (
                <p className="text-[10px] text-indigo-600 font-bold mb-4">Tip: List more products to unlock featured discounts.</p>
              )}

              <button
                onClick={handleActivateFeatured}
                className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold text-xs shadow-lg shadow-indigo-500/20"
              >
                {featuredListingPrice
                  ? `Activate for ${featuredListingCurrency} ${featuredListingPrice}/week`
                  : 'Activate Featured Listing'}
              </button>
            </div>

            {/* Active Campaigns */}
            <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold">Active Campaigns</h3>
                <span className="text-[10px] text-zinc-400 font-bold">
                  {campaigns.filter(c => c.status === 'active').length} Live
                </span>
              </div>
              {campaignStatus && (
                <div className="mb-3 p-2 bg-emerald-50 border border-emerald-100 rounded-xl text-[10px] font-bold text-emerald-700">
                  {campaignStatus}
                </div>
              )}
              {campaigns.length === 0 ? (
                <div className="p-4 bg-zinc-50 rounded-2xl text-center">
                  <p className="text-xs font-bold text-zinc-900">{campaignLoading ? 'Loading campaigns…' : 'No campaigns yet'}</p>
                  <p className="text-[10px] text-zinc-500">
                    {campaignLoading ? 'Fetching latest campaign data.' : 'Launch a campaign to boost reach and conversions.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {campaigns.map(c => {
                    const product = myProducts.find(p => p.id === c.productId);
                    return (
                      <div key={c.id} className="p-3 bg-zinc-50 rounded-2xl flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl overflow-hidden bg-white">
                            {product && <img src={product.mediaUrl} className="w-full h-full object-cover" alt={product.name} />}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-zinc-900">{c.name}</p>
                            <p className="text-[10px] text-zinc-500">{c.objective} • {c.channel} • {c.durationDays} days</p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span className="text-[10px] font-black text-emerald-600">KES {c.budget}</span>
                          <span className="text-[9px] font-bold text-zinc-400">{c.status}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Urgent Stock Alert */}
            <div className="bg-zinc-900 text-white p-6 rounded-3xl shadow-xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-amber-500 rounded-xl">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-bold">Urgent Stock Alert</h3>
                  <p className="text-[10px] text-zinc-400">
                    Broadcast to your {seller.followersCount} followers • {marketingStockAlerts.length} active alerts
                  </p>
                </div>
              </div>
              {broadcastMessage.trim() ? (
                <p className="text-xs text-zinc-400 mb-6 italic">"{broadcastMessage.trim()}"</p>
              ) : (
                <p className="text-xs text-zinc-400 mb-6 italic">Pick a product or create a stock alert to prefill the message.</p>
              )}
              <div className="flex gap-2">
                <select
                  className="flex-1 bg-zinc-800 border-none rounded-xl text-xs font-bold px-4 py-3"
                  value={stockAlertProductId}
                  onChange={(e) => setStockAlertProductId(e.target.value)}
                >
                  <option value="">Select Product...</option>
                  {myProducts.filter(p => p.productId).map(p => (
                    <option key={p.id} value={p.productId}>{p.name}</option>
                  ))}
                </select>
                <button
                  onClick={handleBroadcastStockAlert}
                  className="px-6 py-3 bg-amber-500 text-white rounded-xl font-bold text-xs shadow-lg shadow-amber-500/20"
                >
                  Broadcast
                </button>
              </div>
            </div>

            {/* Targeted Promotions */}
            <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-pink-50 rounded-xl">
                    <Heart className="w-5 h-5 text-pink-500" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold">Targeted Promotions</h3>
                    <p className="text-[10px] text-zinc-400">Engage your top fans</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-black uppercase">
                  <ShieldCheck className="w-3 h-3" /> Opt-in Only
                </div>
              </div>
              <p className="text-xs text-zinc-500 mb-4">Send exclusive offers to customers who have favorited your shop.</p>
              <button
                onClick={handleCreateFanOffer}
                className="w-full py-3 bg-pink-500 text-white rounded-xl font-bold text-xs shadow-lg shadow-pink-500/20"
              >
                Create Fan-Only Offer
              </button>
            </div>

            {/* Audience & Category Focus */}
            <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold">Audience & Category Focus</h3>
                <span className="text-[10px] text-zinc-400 font-bold">Based on your catalog</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {topCategories.map((cat) => (
                  <div key={cat.category} className="p-3 bg-zinc-50 rounded-2xl">
                    <p className="text-xs font-black text-zinc-900">{cat.category}</p>
                    <p className="text-[10px] text-zinc-500">{cat.count} listings</p>
                  </div>
                ))}
                {topCategories.length === 0 && (
                  <div className="col-span-2 p-3 bg-zinc-50 rounded-2xl text-center text-[10px] text-zinc-500 font-bold">
                    Add products to unlock category insights.
                  </div>
                )}
              </div>
            </div>

            {/* Category Spotlight */}
            <div className="bg-gradient-to-r from-amber-400 to-orange-500 p-6 rounded-3xl text-white shadow-xl relative overflow-hidden">
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-4">
                  <Star className="w-5 h-5 text-white fill-white" />
                  <h3 className="text-sm font-black uppercase tracking-widest">Category Spotlight</h3>
                </div>
                <p className="text-xs font-bold mb-2">Featured Shop of the Week</p>
                <p className="text-[10px] text-amber-50 leading-relaxed mb-4">
                  {marketingCategorySpotlights.length > 0
                    ? `You have ${marketingCategorySpotlights.length} spotlight request(s) pending.`
                    : 'Boost a top category to appear in weekly spotlights.'}
                </p>
                <div className="flex items-center gap-2">
                  <div className="px-3 py-1 bg-white/20 rounded-full text-[10px] font-bold">
                    Rank Score: {rankScore !== undefined ? rankScore.toFixed(2) : '—'}
                  </div>
                  <div className="px-3 py-1 bg-white/20 rounded-full text-[10px] font-bold">Rating: {seller.rating}</div>
                </div>
                <button
                  onClick={() => handleCreateCategorySpotlight()}
                  className="mt-4 px-4 py-2 bg-white text-amber-600 rounded-xl text-[10px] font-black shadow"
                >
                  Request Spotlight
                </button>
              </div>
              <Sparkles className="absolute -right-4 -bottom-4 w-32 h-32 text-white/20 rotate-12" />
            </div>

            {/* Promotion Builder */}
            <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm">
              <h3 className="text-sm font-bold mb-4">Campaign Builder</h3>
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-zinc-400">Campaign Name</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Weekend Flash Sale"
                    value={campaignForm.name}
                    onChange={(e) => setCampaignForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full p-3 bg-zinc-50 border-none rounded-xl text-xs font-bold"
                  />
                  <p className="text-[9px] text-zinc-400 font-bold">Use a name you will recognize later.</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-zinc-400">Objective</label>
                    <select 
                      className="w-full p-3 bg-zinc-50 border-none rounded-xl text-xs font-bold"
                      value={campaignForm.objective}
                      onChange={(e) => setCampaignForm(prev => ({ ...prev, objective: e.target.value as any }))}
                    >
                      <option value="sales">Drive Sales</option>
                      <option value="reach">Maximize Reach</option>
                      <option value="favorites">Increase Favorites</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-zinc-400">Channel</label>
                    <select 
                      className="w-full p-3 bg-zinc-50 border-none rounded-xl text-xs font-bold"
                      value={campaignForm.channel}
                      onChange={(e) => setCampaignForm(prev => ({ ...prev, channel: e.target.value as any }))}
                    >
                      <option value="search">Search</option>
                      <option value="feed">Feed</option>
                      <option value="messages">Messages</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-zinc-400">Featured Product</label>
                  <select
                    className="w-full p-3 bg-zinc-50 border-none rounded-xl text-xs font-bold"
                    value={campaignForm.productId}
                    onChange={(e) => setCampaignForm(prev => ({ ...prev, productId: e.target.value }))}
                  >
                    <option value="">Select product</option>
                    {myProducts.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-zinc-400">Budget (KES)</label>
                    <input 
                      type="number" 
                      placeholder="1200"
                      value={campaignForm.budget}
                      onChange={(e) => setCampaignForm(prev => ({ ...prev, budget: Number(e.target.value) }))}
                      className="w-full p-3 bg-zinc-50 border-none rounded-xl text-xs font-bold"
                    />
                    <p className="text-[9px] text-zinc-400 font-bold">This is the total amount you want to spend.</p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-zinc-400">Duration (days)</label>
                    <input 
                      type="number"
                      value={campaignForm.durationDays}
                      onChange={(e) => setCampaignForm(prev => ({ ...prev, durationDays: Number(e.target.value) }))}
                      className="w-full p-3 bg-zinc-50 border-none rounded-xl text-xs font-bold"
                    />
                  </div>
                </div>
                <button 
                  onClick={handleLaunchCampaign}
                  disabled={campaignLoading}
                  className="w-full py-3 bg-zinc-900 text-white rounded-xl font-bold text-xs disabled:opacity-50"
                >
                  {campaignLoading ? 'Launching…' : 'Launch Campaign'}
                </button>
              </div>
            </div>

            {/* QR Code Storefront */}
            <div className="bg-zinc-900 text-white p-6 rounded-3xl shadow-xl flex items-center gap-6">
              <div className="flex-1">
                <h3 className="text-sm font-bold mb-1">QR Code Storefront</h3>
                <p className="text-[10px] text-zinc-400 mb-4">Share your shop's unique code with customers on WhatsApp.</p>
                <button
                  onClick={handleRefreshShareLink}
                  className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-lg text-xs font-bold hover:bg-white/20 transition-colors"
                >
                  <Download className="w-4 h-4" /> Download QR
                </button>
              </div>
              <div className="w-20 h-20 bg-white p-2 rounded-xl shrink-0">
                <QrCode className="w-full h-full text-zinc-900" />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'rewards' && (
          <div className="space-y-6 pb-20">
            <h2 className="text-2xl font-black text-zinc-900">Rewards & Incentives</h2>

            <div className="bg-white rounded-3xl border border-zinc-100 p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <Upload className="w-4 h-4 text-emerald-600" />
                <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400">Receipt Submission Rewards</h3>
              </div>
              <p className="text-[10px] text-zinc-500 font-bold">
                {receiptRewardsHint} {receiptStreakHint}
              </p>
              {sellerRewardsError && (
                <div className="mt-3 p-3 bg-rose-50 rounded-2xl text-[10px] font-bold text-rose-700">
                  {sellerRewardsError}
                </div>
              )}
              <div className="mt-3 p-3 bg-emerald-50 rounded-2xl text-[10px] font-bold text-emerald-700">
                {receiptStreakCount > 0
                  ? `${receiptStreakCount}-day streak`
                  : 'Start your first receipt streak today.'}
                {receiptRewardsConfig?.streak_bonus && receiptRewardsConfig?.streak_days && receiptStreakCount > 0
                  ? ` • Next bonus at day ${receiptRewardsConfig.streak_days}`
                  : ''}
              </div>
              <div className="mt-3 p-3 bg-zinc-50 rounded-2xl text-[10px] font-bold text-zinc-600">
                Wallet balance:{' '}
                {sellerRewardsBalance?.currency ? `${sellerRewardsBalance.currency} ` : ''}
                {Number(sellerRewardsBalance?.balance ?? 0).toFixed(0)}
              </div>
              {receiptUploadStatus && (
                <div className="mt-3 text-[10px] font-bold text-emerald-600">{receiptUploadStatus}</div>
              )}
              <button
                onClick={() => receiptUploadInputRef.current?.click()}
                disabled={receiptUploading}
                className="mt-3 w-full py-3 bg-emerald-600 text-white rounded-xl text-[10px] font-black disabled:opacity-60"
              >
                {receiptUploading ? 'Uploading…' : 'Upload Receipt'}
              </button>
            </div>

            <div className="bg-white rounded-3xl border border-zinc-100 p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <Edit3 className="w-4 h-4 text-indigo-600" />
                <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400">Data Sharing Rewards</h3>
              </div>
              {dataSharingRewards ? (
                <div className="grid grid-cols-2 gap-3 text-[10px] font-bold text-zinc-600">
                  <div className="p-3 bg-zinc-50 rounded-2xl">
                    Price update: {dataSharingRewards.currency ? `${dataSharingRewards.currency} ` : ''}{dataSharingRewards.price_update ?? 0}
                  </div>
                  <div className="p-3 bg-zinc-50 rounded-2xl">
                    Stock update: {dataSharingRewards.currency ? `${dataSharingRewards.currency} ` : ''}{dataSharingRewards.stock_update ?? 0}
                  </div>
                  <div className="p-3 bg-zinc-50 rounded-2xl">
                    Photo upload: {dataSharingRewards.currency ? `${dataSharingRewards.currency} ` : ''}{dataSharingRewards.photo_upload ?? 0}
                  </div>
                  <div className="p-3 bg-zinc-50 rounded-2xl">
                    Complete profile: {dataSharingRewards.currency ? `${dataSharingRewards.currency} ` : ''}{dataSharingRewards.complete_profile ?? 0}
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-zinc-50 rounded-2xl text-[10px] font-bold text-zinc-500">
                  Rewards not configured yet.
                </div>
              )}
              <button onClick={applyBulkUpdate} className="mt-3 w-full py-3 bg-zinc-900 text-white rounded-xl text-[10px] font-black">
                Update Prices + Stock
              </button>
            </div>

            <div className="bg-white rounded-3xl border border-zinc-100 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold">Payout History</h3>
                <button
                  onClick={loadSellerRewards}
                  className="text-[10px] font-bold text-zinc-400"
                  disabled={sellerRewardsLoading}
                >
                  {sellerRewardsLoading ? 'Refreshing…' : 'Refresh'}
                </button>
              </div>
              <div className="space-y-2">
                {sellerRewardsLedger.length === 0 && (
                  <div className="p-3 bg-zinc-50 rounded-2xl text-[10px] font-bold text-zinc-500">
                    No payouts yet.
                  </div>
                )}
                {sellerRewardsLedger.map(entry => {
                  const amount = Number(entry.amount ?? 0);
                  const label = entry.reason || entry.type || 'Reward';
                  return (
                    <div key={entry.id} className="p-3 bg-zinc-50 rounded-2xl text-[10px] font-bold text-zinc-600 flex items-center justify-between">
                      <span>{label}</span>
                      <span className="text-emerald-600">
                        {sellerRewardsBalance?.currency ? `${sellerRewardsBalance.currency} ` : ''}{amount.toFixed(0)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-zinc-100 p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <Users className="w-5 h-5 text-indigo-600" />
                <div>
                  <h3 className="text-sm font-bold">Referral Rewards</h3>
                  <p className="text-[10px] text-zinc-400">
                    {referralRewards
                      ? `${referralRewards.currency ? `${referralRewards.currency} ` : ''}${referralRewards.shop ?? 0} per shop • ${referralRewards.currency ? `${referralRewards.currency} ` : ''}${referralRewards.supplier ?? 0} per supplier`
                      : 'Referral rewards not configured.'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setReferralTarget('shop');
                  setShowReferralModal(true);
                }}
                className="w-full py-3 bg-indigo-600 text-white rounded-xl text-[10px] font-black"
              >
                Invite a Shop
              </button>
            </div>
          </div>
        )}

        {activeTab === 'comms' && (
          <div className="space-y-6 pb-20">
            <h2 className="text-2xl font-black text-zinc-900">Communication & Engagement</h2>

            <div className="bg-white rounded-3xl border border-zinc-100 p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <Send className="w-4 h-4 text-indigo-600" />
                <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400">Broadcast to Followers</h3>
              </div>
              <textarea
                className="w-full p-3 bg-zinc-50 rounded-xl text-[10px] font-bold text-zinc-700"
                rows={3}
                value={broadcastMessage}
                onChange={(e) => setBroadcastMessage(e.target.value)}
              />
              <button onClick={handleBroadcast} className="mt-3 w-full py-3 bg-indigo-600 text-white rounded-xl text-[10px] font-black">
                Send Promotion
              </button>
              <div className="mt-2 text-[10px] text-zinc-500 font-bold">Broadcasts sent: {broadcastCount}</div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="bg-white rounded-3xl border border-zinc-100 p-5 shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2">Customer Chat</p>
                <button
                  onClick={onOpenSupportChat}
                  disabled={!onOpenSupportChat}
                  className="w-full py-3 bg-zinc-900 text-white rounded-xl text-[10px] font-black disabled:opacity-50"
                >
                  Open Customer Inbox
                </button>
              </div>
              <div className="bg-white rounded-3xl border border-zinc-100 p-5 shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2">Supplier Chat</p>
                <button
                  onClick={onOpenSupplierChat}
                  disabled={!onOpenSupplierChat}
                  className="w-full py-3 bg-emerald-600 text-white rounded-xl text-[10px] font-black disabled:opacity-50"
                >
                  Message Supplier
                </button>
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-zinc-100 p-5 shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2">Support Chat</p>
              <button
                onClick={onOpenSupportChat}
                className="w-full py-3 bg-[#1976D2] text-white rounded-xl text-[10px] font-black"
              >
                Contact SokoConnect
              </button>
            </div>
          </div>
        )}

        {activeTab === 'offline' && offlineEnabled && (
          <div className="space-y-6 pb-20">
            <h2 className="text-2xl font-black text-zinc-900">Offline & Accessibility</h2>

            <div className="bg-white rounded-3xl border border-zinc-100 p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <Phone className="w-4 h-4 text-emerald-600" />
                <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400">USSD Interface</h3>
              </div>
              <div className="p-3 bg-zinc-50 rounded-2xl text-[10px] font-bold text-zinc-600">
                {offlineUssdConfig?.code
                  ? `Dial ${offlineUssdConfig.code}${offlineUssdConfig.menu ? ` → ${offlineUssdConfig.menu}` : ''}`
                  : 'USSD config not available yet.'}
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-zinc-100 p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <MessageSquare className="w-4 h-4 text-indigo-600" />
                <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400">SMS Alerts</h3>
              </div>
              <div className="p-3 bg-indigo-50 rounded-2xl text-[10px] font-bold text-indigo-700">
                {offlineSmsConfig?.sample || 'SMS config not available yet.'}
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-zinc-100 p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <MessageSquare className="w-4 h-4 text-amber-500" />
                <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400">Voice Commands</h3>
              </div>
              <div className="p-3 bg-amber-50 rounded-2xl text-[10px] font-bold text-amber-700">
                {offlineVoiceConfig?.sample || 'Voice config not available yet.'}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'growth' && (
          <div className="space-y-6 pb-20">
            <h2 className="text-2xl font-black text-zinc-900">Financial Growth</h2>
            {growthStatus && (
              <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-2xl text-[10px] font-bold text-emerald-700">
                {growthStatus}
              </div>
            )}

            {/* Growth Snapshot */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Monthly Revenue', value: cashflowIn ? `KES ${Math.round(cashflowIn)}` : (totalRevenue ? `KES ${Math.round(totalRevenue)}` : '—') },
                { label: 'Avg Order Value', value: aovValue ? `KES ${Math.round(aovValue)}` : '—' },
                { label: 'Repeat Rate', value: growthRetention !== null && Number.isFinite(growthRetention) ? `${Math.round(growthRetention)}%` : '—' },
                { label: 'Stock Coverage', value: analyticsInventory?.days_cover ? `${analyticsInventory.days_cover.toFixed(1)} days` : '—' }
              ].map((stat) => (
                <div key={stat.label} className="bg-white p-4 rounded-2xl border border-zinc-100 shadow-sm">
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">{stat.label}</p>
                  <p className="text-xl font-black text-zinc-900 mt-2">{stat.value}</p>
                </div>
              ))}
            </div>

            {/* SokoScore Card */}
            <div className="bg-gradient-to-br from-emerald-600 to-teal-700 p-6 rounded-3xl text-white shadow-xl relative overflow-hidden">
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-200" />
                    <span className="text-xs font-black uppercase tracking-widest text-emerald-100">SokoScore</span>
                  </div>
                  <div className="px-2 py-1 bg-white/20 rounded-lg text-[10px] font-bold">
                    {growthHealth?.repayment_risk || '—'}
                  </div>
                </div>
                <div className="flex items-end gap-2 mb-2">
                  <span className="text-5xl font-black">{sokoscore !== null ? Math.min(850, sokoscore) : '—'}</span>
                  <span className="text-emerald-200 text-sm font-bold mb-1">/ 850</span>
                </div>
                <p className="text-xs text-emerald-100 mb-6">Based on transaction volume, consistency, verification, and reviews.</p>
                <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-white rounded-full"
                    style={{ width: `${sokoscore !== null ? (Math.min(850, sokoscore) / 850) * 100 : 0}%` }}
                  />
                </div>
              </div>
              <Sparkles className="absolute -right-4 -bottom-4 w-32 h-32 text-white/10 rotate-12" />
            </div>

            {/* Cashflow Forecast */}
            <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold">Cashflow Forecast</h3>
                <span className="text-[10px] text-zinc-400 font-bold">Next 7 days</span>
              </div>
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={projectionSeries.map(d => ({ ...d, revenue: Math.round(d.revenue) }))}>
                    <defs>
                      <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis hide />
                    <Tooltip />
                    <Area type="monotone" dataKey="revenue" stroke="#10b981" fill="url(#revFill)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Retention Builder */}
            <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold">Repeat Buyer Boost</h3>
                <span className="text-[10px] text-emerald-600 font-bold">
                  Retention: {growthRetention !== null && Number.isFinite(growthRetention) ? `${Math.round(growthRetention)}%` : '—'}
                </span>
              </div>
              <p className="text-xs text-zinc-500 mb-4">Offer a loyalty perk on top sellers to lift repeat rate and stabilize monthly revenue.</p>
              <div className="grid grid-cols-2 gap-3">
                {retentionProducts.slice(0, 2).map(p => (
                  <div key={p.id} className="p-3 bg-zinc-50 rounded-2xl flex items-center gap-3">
                    <img src={p.mediaUrl} className="w-10 h-10 rounded-xl object-cover" alt={p.name} />
                    <div>
                      <p className="text-xs font-bold text-zinc-900 line-clamp-1">{p.name}</p>
                      <p className="text-[10px] text-zinc-500">{p.price !== null ? `KES ${p.price}` : 'Price —'}</p>
                    </div>
                  </div>
                ))}
                {retentionProducts.length === 0 && (
                  <div className="col-span-2 p-3 bg-zinc-50 rounded-2xl text-center text-[10px] text-zinc-500 font-bold">
                    Top products will appear after orders are captured.
                  </div>
                )}
              </div>
              <button
                onClick={async () => {
                  try {
                    const topProduct = retentionProducts[0];
                    const title = topProduct ? `Loyalty: ${topProduct.name}` : 'Loyalty Offer';
                    await createLoyaltyOffer({
                      title,
                      discount: '5%',
                      rules: topProduct?.productId ? { product_id: topProduct.productId, min_orders: 3 } : { min_orders: 3 }
                    });
                    setGrowthStatus('Loyalty offer created.');
                  } catch (err: any) {
                    setGrowthStatus(err?.message || 'Unable to create loyalty offer.');
                  }
                }}
                className="w-full py-3 mt-4 bg-zinc-900 text-white rounded-xl font-bold text-xs"
              >
                Create Loyalty Offer
              </button>
            </div>

            {/* Referral Program */}
            <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-indigo-50 rounded-xl">
                  <Users className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-sm font-bold">Referral Program</h3>
                  <p className="text-[10px] text-zinc-400">
                    {referralRewards
                      ? `Earn ${referralRewards.currency ? `${referralRewards.currency} ` : ''}${referralRewards.shop ?? 0} per shop referral`
                      : 'Referral rewards not configured.'}
                  </p>
                </div>
              </div>
              <p className="text-xs text-zinc-500 mb-4">
                Earn a reward when your referral completes their onboarding steps.{' '}
                <span className="font-bold text-zinc-900">
                  {referralRewards ? `${referralRewards.currency ? `${referralRewards.currency} ` : ''}${referralRewards.shop ?? 0}` : 'a bonus'}
                </span>.
              </p>
              <p className="text-[10px] text-zinc-500 mb-4 font-bold">
                Referrals: {growthReferrals?.referrals ?? '—'} • Conversions: {growthReferrals?.conversions ?? '—'} • Paid:{' '}
                {growthReferrals?.reward_paid !== undefined ? `KES ${growthReferrals.reward_paid}` : '—'}
              </p>
              <div className="flex gap-2">
                <div className="flex-1 p-3 bg-zinc-50 rounded-xl text-xs font-mono font-bold text-zinc-400 truncate">
                  {sellerReferralCodes[0]?.code || 'No referral code yet.'}
                </div>
                <button 
                  onClick={() => {
                    setReferralTarget('shop');
                    setShowReferralModal(true);
                  }}
                  className="px-4 py-3 bg-zinc-900 text-white rounded-xl font-bold text-xs"
                >
                  Invite Shop
                </button>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-emerald-50 rounded-xl">
                  <Users className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-sm font-bold">Supplier Referral</h3>
                  <p className="text-[10px] text-zinc-400">
                    {referralRewards
                      ? `Earn ${referralRewards.currency ? `${referralRewards.currency} ` : ''}${referralRewards.supplier ?? 0} per supplier referral`
                      : 'Referral rewards not configured.'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setReferralTarget('supplier');
                  setShowReferralModal(true);
                }}
                className="w-full py-3 bg-emerald-600 text-white rounded-xl text-[10px] font-black"
              >
                Invite Supplier
              </button>
            </div>

            {/* Group Buying Power */}
            <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-emerald-50 rounded-xl">
                  <Package className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-sm font-bold">Group Buying Power</h3>
                  <p className="text-[10px] text-zinc-400">Bulk orders with nearby shops</p>
                </div>
              </div>
              <p className="text-xs text-zinc-500 mb-4">
                {bulkGroups.length > 0
                  ? `Join bulk order: ${bulkGroups[0]?.title || 'Bulk group'} (${bulkGroups[0]?.product_category || 'general'}), target ${bulkGroups[0]?.target_qty || 0} units.`
                  : 'Start a bulk-buy group to unlock wholesale pricing.'}
              </p>
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-bold text-zinc-500">
                  Active groups: {bulkGroups.length}
                </span>
                <span className="text-[10px] font-bold text-emerald-600">
                  {bulkGroups.length > 0 ? 'Group active' : 'No active group'}
                </span>
              </div>
              <button
                onClick={async () => {
                  try {
                    if (bulkGroups.length === 0) {
                      setGrowthStatus('No active groups available yet.');
                      return;
                    }
                    const groupId = bulkGroups[0]?.id;
                    if (!groupId) return;
                    await joinBulkBuyGroup(groupId);
                    setGrowthStatus('Joined bulk-buy group.');
                  } catch (err: any) {
                    setGrowthStatus(err?.message || 'Bulk-buy action failed.');
                  }
                }}
                className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold text-xs shadow-lg shadow-emerald-500/20"
              >
                {bulkGroups.length > 0 ? 'Join Bulk Order' : 'Browse Groups'}
              </button>
            </div>

            {/* Loan Matchmaking */}
            <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm">
              <h3 className="text-sm font-bold mb-4">Available Capital</h3>
              <div className="space-y-4">
                <div className="p-4 bg-zinc-50 rounded-2xl flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-zinc-400 font-black uppercase">Working Capital Loan</p>
                    <p className="text-lg font-black text-zinc-900">
                      {loanMaxAmount !== null ? `Up to KES ${loanMaxAmount.toLocaleString()}` : 'No offers yet'}
                    </p>
                  </div>
                  <button
                    onClick={async () => {
                      if (loanMaxAmount === null) {
                        setGrowthStatus('No loan offers available yet.');
                        return;
                      }
                      const ratio = Number.isFinite(loanRequestRatio) && loanRequestRatio > 0 ? loanRequestRatio : 0.5;
                      const amountRaw = window.prompt('Loan amount requested (KES):', String(Math.round(loanMaxAmount * ratio)));
                      if (!amountRaw) return;
                      const amount = Number(amountRaw);
                      if (!Number.isFinite(amount) || amount <= 0) {
                        setGrowthStatus('Enter a valid loan amount.');
                        return;
                      }
                      try {
                        const resp = await requestLoan({ amount_requested: amount });
                        setGrowthStatus(resp?.status ? `Loan request ${resp.status}.` : 'Loan request submitted.');
                      } catch (err: any) {
                        setGrowthStatus(err?.message || 'Loan request failed.');
                      }
                    }}
                    disabled={loanMaxAmount === null}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold"
                  >
                    Apply
                  </button>
                </div>
              </div>
              {growthLoan?.rejection_reasons?.length ? (
                <div className="mt-3 p-3 bg-amber-50 rounded-2xl text-[10px] font-bold text-amber-700">
                  {growthLoan.rejection_reasons.join(' • ')}
                </div>
              ) : null}
            </div>

            {/* Transaction History Export */}
            <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold">Transaction History</h3>
                <button className="flex items-center gap-2 text-indigo-600 text-xs font-bold">
                  <Download className="w-4 h-4" /> Export CSV
                </button>
              </div>
              <p className="text-xs text-zinc-500">Download your sales data to show banks for loan applications outside Sconnect.</p>
            </div>
          </div>
        )}

        {activeTab === 'suppliers' && (
          <div className="space-y-6 pb-20">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-black text-zinc-900">Supplier Network</h2>
              <button 
                onClick={requestLocation}
                className="px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest"
              >
                Use My Location
              </button>
            </div>
            {(suppliersStatus || rfqStatus) && (
              <div className="p-3 bg-amber-50 border border-amber-100 rounded-2xl text-[10px] font-bold text-amber-700">
                {suppliersStatus || rfqStatus}
              </div>
            )}
            {(suppliersLoading || rfqLoading) && (
              <div className="text-[10px] font-bold text-zinc-500">Loading supplier network…</div>
            )}

            {/* RFQ Summary */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Active RFQs', value: rfqActive.length },
                { label: 'Total Responses', value: rfqResponses },
                { label: 'Best Savings', value: `KES ${rfqBestSavings.toFixed(0)}` }
              ].map((stat) => (
                <div key={stat.label} className="bg-white p-4 rounded-2xl border border-zinc-100 shadow-sm">
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">{stat.label}</p>
                  <p className="text-lg font-black text-zinc-900 mt-2">{stat.value}</p>
                </div>
              ))}
            </div>

            {/* RFQ Threads */}
            <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold">RFQ Threads</h3>
                  <p
                    className="text-[10px] text-zinc-400 font-bold"
                    title={rfqLastUpdated ? rfqLastUpdated.toLocaleString() : 'Not updated yet'}
                  >
                    Updated {rfqLastUpdated ? formatRelativeTime(rfqLastUpdated) : '—'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleRefreshRfqs}
                    disabled={rfqLoading || rfqThreadsRemote.length === 0}
                    className={`px-3 py-2 rounded-xl text-[10px] font-bold ${
                      rfqLoading || rfqThreadsRemote.length === 0
                        ? 'bg-zinc-200 text-zinc-500'
                        : 'bg-white border border-zinc-200 text-zinc-700'
                    }`}
                  >
                    Refresh
                  </button>
                  <button 
                    onClick={() => setShowRfqModal(true)}
                    className="px-3 py-2 bg-zinc-900 text-white rounded-xl text-[10px] font-bold"
                  >
                    New RFQ
                  </button>
                </div>
              </div>
              <div className="space-y-4">
                {rfqThreads.map((thread) => (
                  <div key={thread.id} className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="text-sm font-bold text-zinc-900">{thread.title}</p>
                        <p className="text-[10px] text-zinc-500">{thread.id} • {(thread.type || 'RFQ').toUpperCase()} • {thread.status}</p>
                      </div>
                      <span className="text-[10px] font-black text-indigo-600">{thread.responses.length} responses</span>
                    </div>
                    <div className="text-[10px] text-zinc-500 font-bold mb-3">
                      Delivery: {thread.deliveryLocation || 'N/A'} • Expires: {thread.expiresAt ? new Date(thread.expiresAt).toLocaleString() : 'N/A'}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[10px] font-bold text-zinc-600">
                      {thread.items.map((item, idx) => (
                        <div key={idx} className="bg-white rounded-lg p-2 border border-zinc-100">
                          {item.name} • {item.quantity} {item.unit}
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 space-y-2">
                      {thread.responses.map((r, idx) => (
                        <div key={`${thread.id}-${idx}`} className="flex items-center justify-between text-[10px] font-bold text-zinc-600">
                          <span>
                            {getSupplierName(r.supplierId)} • KES {r.price} • ETA {Number.isFinite(r.etaHours) && r.etaHours ? `${r.etaHours}h` : 'N/A'} • {Number.isFinite(r.rating) ? r.rating : 'N/A'}★
                          </span>
                          <span className={`px-2 py-0.5 rounded-full ${r.status === 'accepted' || r.status === 'responded' ? 'bg-emerald-50 text-emerald-600' : 'bg-zinc-200 text-zinc-500'}`}>
                            {r.status}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 flex gap-2">
                      <button 
                        onClick={() => setSelectedThreadId(thread.id)}
                        className="px-3 py-2 bg-white border border-zinc-200 rounded-lg text-[10px] font-bold"
                      >
                        Compare
                      </button>
                      <button
                        onClick={() => {
                          const best = [...thread.responses].filter(r => r.id).sort((a, b) => a.price - b.price)[0];
                          if (best?.id) handleAcceptRfqResponse(thread.id, best.id);
                        }}
                        disabled={thread.responses.length === 0}
                        className={`px-3 py-2 rounded-lg text-[10px] font-bold ${thread.responses.length === 0 ? 'bg-zinc-200 text-zinc-500' : 'bg-zinc-900 text-white'}`}
                      >
                        Select Supplier
                      </button>
                      <button className="px-3 py-2 bg-emerald-600 text-white rounded-lg text-[10px] font-bold">Message Suppliers</button>
                    </div>
                  </div>
                ))}
                {rfqThreads.length === 0 && (
                  <div className="p-6 bg-zinc-50 rounded-2xl text-center text-[10px] text-zinc-500 font-bold">
                    No RFQs yet. Create one to get quotes.
                  </div>
                )}
              </div>
            </div>

            {/* RFQ Comparison */}
            {selectedThread && (
              <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-bold">Compare Quotes</h3>
                    <p className="text-[10px] text-zinc-500">{selectedThread.title} • {selectedThread.id}</p>
                  </div>
                  <select 
                    className="text-[10px] font-bold bg-zinc-50 border-none rounded-lg px-2 py-1"
                    value={compareSort}
                    onChange={(e) => setCompareSort(e.target.value as any)}
                  >
                    <option value="price">Sort by Price</option>
                    <option value="eta">Sort by ETA</option>
                    <option value="rating">Sort by Rating</option>
                    <option value="distance">Sort by Distance</option>
                  </select>
                </div>
                <div className="overflow-x-auto">
                  <div className="flex gap-4 min-w-max">
                    {[...selectedThread.responses]
                      .sort((a, b) => {
                        if (compareSort === 'price') return Number(a.price || 0) - Number(b.price || 0);
                        if (compareSort === 'eta') return (a.etaHours || 999) - (b.etaHours || 999);
                        if (compareSort === 'rating') return Number(b.rating || 0) - Number(a.rating || 0);
                        if (compareSort === 'distance') return (a.distanceKm || 999) - (b.distanceKm || 999);
                        return 0;
                      })
                      .map((r, idx) => (
                        <div key={`${selectedThread.id}-cmp-${idx}`} className="w-72 bg-zinc-50 rounded-2xl border border-zinc-100 p-4 flex flex-col">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <p className="text-sm font-bold text-zinc-900">{getSupplierName(r.supplierId)}</p>
                              <p className="text-[10px] text-zinc-500">
                                {(r.status || 'pending').toUpperCase()} • {Number.isFinite(r.rating) ? r.rating : 'N/A'}★ • {r.verified ? 'Verified' : 'Unverified'}
                              </p>
                            </div>
                            <span className="text-[10px] font-black text-emerald-600">KES {r.price}</span>
                          </div>
                          <div className="space-y-2 text-[10px] font-bold text-zinc-600">
                            <div className="flex items-center justify-between">
                              <span>ETA</span>
                              <span>{Number.isFinite(r.etaHours) && r.etaHours ? `${r.etaHours}h` : 'N/A'}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span>Lead Time</span>
                              <span>{r.leadTimeDays ? `${r.leadTimeDays}d` : 'N/A'}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span>Stock</span>
                              <span>{r.stock ?? 'N/A'}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span>MOQ</span>
                              <span>{r.moq ?? 'N/A'}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span>Terms</span>
                              <span>{r.paymentTerms ?? 'N/A'}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span>Distance</span>
                              <span>{r.distanceKm ? `${r.distanceKm.toFixed(1)} km` : 'N/A'}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span>Response</span>
                              <span>{r.respondedAt ? new Date(r.respondedAt).toLocaleTimeString() : 'Pending'}</span>
                            </div>
                          </div>
                          <div className="mt-4 flex gap-2">
                            <button className="flex-1 py-2 bg-white border border-zinc-200 rounded-lg text-[10px] font-bold">Message</button>
                            <button
                              onClick={() => handleAcceptRfqResponse(selectedThread.id, r.id)}
                              className="flex-1 py-2 bg-zinc-900 text-white rounded-lg text-[10px] font-bold"
                            >
                              Choose
                            </button>
                          </div>
                          <button
                            onClick={() => handleDeclineRfqResponse(selectedThread.id, r.id)}
                            className="mt-2 py-2 text-[10px] font-bold text-zinc-500 hover:text-red-500"
                          >
                            Remove from comparison
                          </button>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Find Suppliers */}
              <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold">Find Nearby Suppliers</h3>
                  <span className="text-[10px] text-zinc-400 font-bold">{supplierMatches.length} matches</span>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <select
                    className="w-full p-2.5 bg-zinc-50 border-none rounded-xl text-xs font-bold"
                    value={supplierFilters.category}
                    onChange={(e) => setSupplierFilters(prev => ({ ...prev, category: e.target.value }))}
                  >
                    <option value="">All Categories</option>
                    {supplierCategoryOptions.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  <select
                    className="w-full p-2.5 bg-zinc-50 border-none rounded-xl text-xs font-bold"
                    value={supplierFilters.paymentTerms}
                    onChange={(e) => setSupplierFilters(prev => ({ ...prev, paymentTerms: e.target.value }))}
                  >
                    <option value="">Any Terms</option>
                    <option value="cash">Cash</option>
                    <option value="net7">Net 7</option>
                    <option value="net14">Net 14</option>
                    <option value="net30">Net 30</option>
                  </select>
                  <input
                    type="number"
                    placeholder="Max distance (km)"
                    className="w-full p-2.5 bg-zinc-50 border-none rounded-xl text-xs font-bold"
                    value={supplierFilters.maxDistance}
                    onChange={(e) => setSupplierFilters(prev => ({ ...prev, maxDistance: Number(e.target.value) }))}
                  />
                  <input
                    type="number"
                    className="w-full p-2.5 bg-zinc-50 border-none rounded-xl text-xs font-bold"
                    value={supplierFilters.maxUnitCost}
                    onChange={(e) => setSupplierFilters(prev => ({ ...prev, maxUnitCost: Number(e.target.value) }))}
                  />
                  <input
                    type="number"
                    className="w-full p-2.5 bg-zinc-50 border-none rounded-xl text-xs font-bold"
                    value={supplierFilters.maxMOQ}
                    onChange={(e) => setSupplierFilters(prev => ({ ...prev, maxMOQ: Number(e.target.value) }))}
                  />
                  <input
                    type="number"
                    className="w-full p-2.5 bg-zinc-50 border-none rounded-xl text-xs font-bold"
                    value={supplierFilters.maxLeadTime}
                    onChange={(e) => setSupplierFilters(prev => ({ ...prev, maxLeadTime: Number(e.target.value) }))}
                  />
                  <input
                    type="number"
                    placeholder="Min rating"
                    className="w-full p-2.5 bg-zinc-50 border-none rounded-xl text-xs font-bold"
                    value={supplierFilters.minRating}
                    onChange={(e) => setSupplierFilters(prev => ({ ...prev, minRating: Number(e.target.value) }))}
                  />
                  <label className="flex items-center gap-2 text-[10px] font-bold text-zinc-500">
                    <input
                      type="checkbox"
                      checked={supplierFilters.verifiedOnly}
                      onChange={(e) => setSupplierFilters(prev => ({ ...prev, verifiedOnly: e.target.checked }))}
                    />
                    Verified only
                  </label>
                </div>

                <div className="space-y-3">
                  {supplierMatches.map(({ supplier, bestOffer, delivery, distance, score }, idx) => (
                    <div key={supplier.id || `supplier-${idx}`} className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="text-sm font-bold text-zinc-900">{supplier.name || 'Supplier'}</p>
                          <p className="text-[10px] text-zinc-500">{supplier.category || 'General supply'}</p>
                        </div>
                        <span className="text-[10px] font-black text-emerald-600">{score.toFixed(0)} score</span>
                      </div>
                      <div className="flex flex-wrap gap-2 text-[10px] font-bold text-zinc-600">
                        <span>Rating {Number.isFinite(supplier.rating) ? supplier.rating : 'N/A'}</span>
                        <span>Lead {delivery?.lead_time_days ? `${delivery.lead_time_days}d` : '—'}</span>
                        <span>MOQ {bestOffer?.moq ?? '—'}</span>
                        <span>Unit KES {bestOffer?.unit_cost ?? '—'}</span>
                        <span>{distance !== null ? `${distance.toFixed(1)} km` : 'Distance N/A'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Find Sellers (for Suppliers) */}
              <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold">Find Nearby Sellers</h3>
                  <span className="text-[10px] text-zinc-400 font-bold">{sellersWithMeta.length} matches</span>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <select
                    className="w-full p-2.5 bg-zinc-50 border-none rounded-xl text-xs font-bold"
                    value={sellerFilters.category}
                    onChange={(e) => setSellerFilters(prev => ({ ...prev, category: e.target.value }))}
                  >
                    <option value="">All Categories</option>
                    {sellerDirectoryCategories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    placeholder="Max distance (km)"
                    className="w-full p-2.5 bg-zinc-50 border-none rounded-xl text-xs font-bold"
                    value={sellerFilters.maxDistance}
                    onChange={(e) => setSellerFilters(prev => ({ ...prev, maxDistance: Number(e.target.value) }))}
                  />
                  <input
                    type="number"
                    placeholder="Min rating"
                    className="w-full p-2.5 bg-zinc-50 border-none rounded-xl text-xs font-bold"
                    value={sellerFilters.minRating}
                    onChange={(e) => setSellerFilters(prev => ({ ...prev, minRating: Number(e.target.value) }))}
                  />
                  <label className="flex items-center gap-2 text-[10px] font-bold text-zinc-500">
                    <input
                      type="checkbox"
                      checked={sellerFilters.verifiedOnly}
                      onChange={(e) => setSellerFilters(prev => ({ ...prev, verifiedOnly: e.target.checked }))}
                    />
                    Verified only
                  </label>
                </div>

                {sellerDirectoryStatus && (
                  <div className="p-3 bg-red-50 text-red-600 rounded-xl text-[10px] font-bold">
                    {sellerDirectoryStatus}
                  </div>
                )}
                {sellerDirectoryLoading && (
                  <div className="p-3 bg-zinc-50 rounded-xl text-[10px] font-bold text-zinc-500">
                    Loading sellers...
                  </div>
                )}
                <div className="space-y-3">
                  {sellersWithMeta.map(({ shop, distanceKm, score }) => (
                    <div key={shop.id || shop.seller_id} className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="text-sm font-bold text-zinc-900">{shop.name || 'Seller'}</p>
                          <p className="text-[10px] text-zinc-500">{shop.category || 'General'}</p>
                        </div>
                        <span className="text-[10px] font-black text-emerald-600">{score.toFixed(0)} score</span>
                      </div>
                      <div className="flex flex-wrap gap-2 text-[10px] font-bold text-zinc-600">
                        <span>Rating {shop.rating ?? '—'}</span>
                        <span>{distanceKm !== null ? `${distanceKm.toFixed(1)} km` : 'Distance N/A'}</span>
                        <span>{shop.verified ? 'Verified' : 'Unverified'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
        {activeTab === 'settings' && (
          <div className="space-y-6 pb-20">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-zinc-900">Shop Profile</h2>
              <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${seller.isVerified ? 'bg-emerald-50 text-emerald-600' : 'bg-zinc-100 text-zinc-400'}`}>
                {seller.isVerified ? <ShieldCheck className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                {seller.isVerified ? 'Verified Shop' : 'Unverified'}
              </div>
            </div>
            {settingsStatus && (
              <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-2xl text-[10px] font-bold text-emerald-700">
                {settingsStatus}
              </div>
            )}
            {sellerPreferencesStatus && (
              <div className="p-3 bg-blue-50 border border-blue-100 rounded-2xl text-[10px] font-bold text-blue-700">
                {sellerPreferencesStatus}
              </div>
            )}
            {profileLoading && (
              <div className="text-[10px] font-bold text-zinc-500">Loading profile…</div>
            )}

            <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Verified Seller Program</p>
                  <p className="text-sm font-bold text-zinc-900">Higher ranking, more trust, loan eligibility</p>
                </div>
                <button
                  onClick={handleVerifySeller}
                  disabled={seller.isVerified || verificationStatus?.status === 'verified' || verificationStatus?.verified}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-[10px] font-black"
                >
                  {seller.isVerified || verificationStatus?.status === 'verified' || verificationStatus?.verified
                    ? 'Verified'
                    : verificationBonusLabel
                      ? `Verify for ${verificationBonusLabel}`
                      : 'Verify Seller'}
                </button>
              </div>
              <div className="grid grid-cols-3 gap-2 text-[10px] font-bold text-zinc-600">
                <div className="p-3 bg-zinc-50 rounded-2xl">ID verified ✓</div>
                <div className="p-3 bg-zinc-50 rounded-2xl">Business verified ✓</div>
                <div className="p-3 bg-zinc-50 rounded-2xl">Visit verified ✓</div>
              </div>
            </div>

            {/* Community Stats & Badges */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-2xl border border-zinc-100 shadow-sm flex items-center gap-3">
                <div className="p-2 bg-pink-50 rounded-xl">
                  <Heart className="w-4 h-4 text-pink-500" />
                </div>
                <div>
                  <p className="text-[10px] text-zinc-400 font-black uppercase">Followers</p>
                  <p className="text-lg font-black text-zinc-900">{seller.followersCount}</p>
                </div>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-zinc-100 shadow-sm flex items-center gap-3">
                <div className="p-2 bg-amber-50 rounded-xl">
                  <Star className="w-4 h-4 text-amber-500" />
                </div>
                <div>
                  <p className="text-[10px] text-zinc-400 font-black uppercase">Top Shop</p>
                  <p className="text-xs font-black text-amber-600">
                    {rankScore !== undefined && rankScore !== null ? `Score ${Math.round(rankScore)}` : 'Awaiting rank'}
                  </p>
                </div>
              </div>
            </div>

            {/* Follower Notifications */}
            <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <Heart className="w-5 h-5 text-pink-500" />
                <div>
                  <h3 className="text-sm font-bold">Notification Preferences</h3>
                  <p className="text-[10px] text-zinc-500">Choose which alerts you want and when you want them.</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { key: 'price_drops', label: 'Price Drops' },
                  { key: 'back_in_stock', label: 'Back in Stock' },
                  { key: 'trending', label: 'Trending' },
                  { key: 'marketing', label: 'Marketing' },
                  { key: 'rewards', label: 'Rewards' },
                  { key: 'support', label: 'Support' },
                  { key: 'system', label: 'System' },
                  { key: 'watched_items', label: 'Watched Items' },
                  { key: 'location_based', label: 'Location Based' }
                ].map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => toggleNotificationPref(key as keyof SellerNotificationPreferences)}
                    disabled={notificationsUpdating}
                    className={`px-3 py-2 rounded-xl text-[10px] font-bold ${
                      notificationPrefs[key as keyof SellerNotificationPreferences]
                        ? 'bg-zinc-900 text-white'
                        : 'bg-zinc-100 text-zinc-500'
                    }`}
                  >
                    {notificationsUpdating ? 'Saving…' : label}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
                <label className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Frequency</span>
                  <select
                    value={notificationPrefs.frequency || 'instant'}
                    onChange={(e) => updateNotificationPrefField('frequency', e.target.value)}
                    disabled={notificationsUpdating}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-xs font-bold"
                  >
                    <option value="instant">Instant</option>
                    <option value="hourly">Hourly</option>
                    <option value="daily">Daily</option>
                  </select>
                </label>
                <label className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Quiet Start</span>
                  <input
                    type="time"
                    value={notificationPrefs.quiet_hours_start || ''}
                    onChange={(e) => updateNotificationPrefField('quiet_hours_start', e.target.value)}
                    disabled={notificationsUpdating}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-xs font-bold"
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Quiet End</span>
                  <input
                    type="time"
                    value={notificationPrefs.quiet_hours_end || ''}
                    onChange={(e) => updateNotificationPrefField('quiet_hours_end', e.target.value)}
                    disabled={notificationsUpdating}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-xs font-bold"
                  />
                </label>
              </div>
            </div>

            <form onSubmit={handleSavePreferences} className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Seller Preferences</p>
                  <p className="text-sm font-bold text-zinc-900">Your marketing and growth defaults</p>
                </div>
                <button
                  type="submit"
                  disabled={sellerPreferencesSaving}
                  className="px-4 py-2 bg-zinc-900 text-white rounded-xl text-[10px] font-black"
                >
                  {sellerPreferencesSaving ? 'Saving…' : 'Save Preferences'}
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <label className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Marketing KPI Range</span>
                  <select
                    value={sellerPreferencesDraft.marketing.kpi_range}
                    onChange={(e) => setSellerPreferencesDraft(prev => ({ ...prev, marketing: { ...prev.marketing, kpi_range: e.target.value } }))}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-xs font-bold"
                  >
                    <option value="7d">Last 7 days</option>
                    <option value="30d">Last 30 days</option>
                    <option value="90d">Last 90 days</option>
                  </select>
                </label>
                <label className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Default Campaign Days</span>
                  <input
                    type="number"
                    min={1}
                    value={sellerPreferencesDraft.marketing.campaign_duration_days}
                    onChange={(e) => setSellerPreferencesDraft(prev => ({ ...prev, marketing: { ...prev.marketing, campaign_duration_days: Number(e.target.value) } }))}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-xs font-bold"
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Top Products Window</span>
                  <input
                    type="number"
                    min={1}
                    value={sellerPreferencesDraft.marketing.top_products_days}
                    onChange={(e) => setSellerPreferencesDraft(prev => ({ ...prev, marketing: { ...prev.marketing, top_products_days: Number(e.target.value) } }))}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-xs font-bold"
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Top Products Limit</span>
                  <input
                    type="number"
                    min={1}
                    value={sellerPreferencesDraft.marketing.top_products_limit}
                    onChange={(e) => setSellerPreferencesDraft(prev => ({ ...prev, marketing: { ...prev.marketing, top_products_limit: Number(e.target.value) } }))}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-xs font-bold"
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Quick Boost Budget</span>
                  <input
                    type="number"
                    min={1}
                    value={sellerPreferencesDraft.marketing.quick_boost_budget}
                    onChange={(e) => setSellerPreferencesDraft(prev => ({ ...prev, marketing: { ...prev.marketing, quick_boost_budget: Number(e.target.value) } }))}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-xs font-bold"
                  />
                </label>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <label className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Sales Series Days</span>
                  <input
                    type="number"
                    min={1}
                    value={sellerPreferencesDraft.analytics.sales_series_days}
                    onChange={(e) => setSellerPreferencesDraft(prev => ({ ...prev, analytics: { ...prev.analytics, sales_series_days: Number(e.target.value) } }))}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-xs font-bold"
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Sales Velocity Days</span>
                  <input
                    type="number"
                    min={1}
                    value={sellerPreferencesDraft.analytics.sales_velocity_days}
                    onChange={(e) => setSellerPreferencesDraft(prev => ({ ...prev, analytics: { ...prev.analytics, sales_velocity_days: Number(e.target.value) } }))}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-xs font-bold"
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Peak Hours Days</span>
                  <input
                    type="number"
                    min={1}
                    value={sellerPreferencesDraft.analytics.peak_hours_days}
                    onChange={(e) => setSellerPreferencesDraft(prev => ({ ...prev, analytics: { ...prev.analytics, peak_hours_days: Number(e.target.value) } }))}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-xs font-bold"
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Inventory Days</span>
                  <input
                    type="number"
                    min={1}
                    value={sellerPreferencesDraft.analytics.inventory_series_days}
                    onChange={(e) => setSellerPreferencesDraft(prev => ({ ...prev, analytics: { ...prev.analytics, inventory_series_days: Number(e.target.value) } }))}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-xs font-bold"
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Conversion Days</span>
                  <input
                    type="number"
                    min={1}
                    value={sellerPreferencesDraft.analytics.conversion_series_days}
                    onChange={(e) => setSellerPreferencesDraft(prev => ({ ...prev, analytics: { ...prev.analytics, conversion_series_days: Number(e.target.value) } }))}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-xs font-bold"
                  />
                </label>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <label className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Broadcast Limit</span>
                  <input
                    type="number"
                    min={1}
                    value={sellerPreferencesDraft.comms.broadcast_limit}
                    onChange={(e) => setSellerPreferencesDraft(prev => ({ ...prev, comms: { ...prev.comms, broadcast_limit: Number(e.target.value) }, marketing: { ...prev.marketing, broadcast_limit: Number(e.target.value) } }))}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-xs font-bold"
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Loan Prompt Ratio</span>
                  <input
                    type="number"
                    min={0.1}
                    max={1}
                    step={0.05}
                    value={sellerPreferencesDraft.growth.loan_request_ratio}
                    onChange={(e) => setSellerPreferencesDraft(prev => ({ ...prev, growth: { ...prev.growth, loan_request_ratio: Number(e.target.value) } }))}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-xs font-bold"
                  />
                </label>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <label className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Max Distance (km)</span>
                  <input
                    type="number"
                    min={0}
                    value={sellerPreferencesDraft.procurement.max_distance_km}
                    onChange={(e) => setSellerPreferencesDraft(prev => ({ ...prev, procurement: { ...prev.procurement, max_distance_km: Number(e.target.value) } }))}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-xs font-bold"
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Max Unit Cost</span>
                  <input
                    type="number"
                    min={0}
                    value={sellerPreferencesDraft.procurement.max_unit_cost}
                    onChange={(e) => setSellerPreferencesDraft(prev => ({ ...prev, procurement: { ...prev.procurement, max_unit_cost: Number(e.target.value) } }))}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-xs font-bold"
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Max MOQ</span>
                  <input
                    type="number"
                    min={0}
                    value={sellerPreferencesDraft.procurement.max_moq}
                    onChange={(e) => setSellerPreferencesDraft(prev => ({ ...prev, procurement: { ...prev.procurement, max_moq: Number(e.target.value) } }))}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-xs font-bold"
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Max Lead Time</span>
                  <input
                    type="number"
                    min={0}
                    value={sellerPreferencesDraft.procurement.max_lead_time_days}
                    onChange={(e) => setSellerPreferencesDraft(prev => ({ ...prev, procurement: { ...prev.procurement, max_lead_time_days: Number(e.target.value) } }))}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-xs font-bold"
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Min Rating</span>
                  <input
                    type="number"
                    min={0}
                    max={5}
                    step={0.1}
                    value={sellerPreferencesDraft.procurement.min_rating}
                    onChange={(e) => setSellerPreferencesDraft(prev => ({ ...prev, procurement: { ...prev.procurement, min_rating: Number(e.target.value) } }))}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-xs font-bold"
                  />
                </label>
                <label className="flex items-center gap-2 mt-6 text-[10px] font-bold text-zinc-500">
                  <input
                    type="checkbox"
                    checked={Boolean(sellerPreferencesDraft.procurement.verified_only)}
                    onChange={(e) => setSellerPreferencesDraft(prev => ({ ...prev, procurement: { ...prev.procurement, verified_only: e.target.checked } }))}
                  />
                  Verified suppliers only
                </label>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <label className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Growth Projection</span>
                  <select
                    value={sellerPreferencesDraft.growth.projection_type}
                    onChange={(e) => setSellerPreferencesDraft(prev => ({ ...prev, growth: { ...prev.growth, projection_type: e.target.value } }))}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-xs font-bold"
                  >
                    <option value="cashflow">Cashflow</option>
                    <option value="revenue">Revenue</option>
                    <option value="inventory">Inventory</option>
                  </select>
                </label>
              </div>
              <p className="text-[10px] text-zinc-500 font-bold">
                These are your personal defaults. Admin still controls thresholds, incentives, and platform-wide limits.
              </p>
            </form>

            {/* Recent Reviews */}
            <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm">
              <h3 className="text-sm font-bold mb-4">Recent Reviews</h3>
              <div className="space-y-4">
                {reviewsLoading && (
                  <div className="p-4 bg-zinc-50 rounded-2xl text-[10px] text-zinc-500 font-bold text-center">
                    Loading reviews…
                  </div>
                )}
                {!reviewsLoading && sellerReviews.length === 0 && (
                  <div className="p-4 bg-zinc-50 rounded-2xl text-[10px] text-zinc-500 font-bold text-center">
                    No reviews yet.
                  </div>
                )}
                {sellerReviews.map((review) => (
                  <div key={review.id} className="p-4 bg-zinc-50 rounded-2xl space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-zinc-900">{review.userName}</span>
                        <span className="text-[10px] text-zinc-400">{new Date(review.timestamp).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex text-amber-500">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`w-3 h-3 ${i < review.rating ? 'fill-amber-500' : 'text-zinc-200'}`} />
                        ))}
                      </div>
                      <span className="text-[10px] text-zinc-400">{review.productName}</span>
                    </div>
                    <p className="text-xs text-zinc-600 italic">"{review.comment}"</p>
                    {review.replies && review.replies.length > 0 && (
                      <div className="space-y-2">
                        {review.replies.map((reply: any) => (
                          <div key={reply.id} className="p-2 bg-white rounded-xl border border-zinc-100">
                            <p className="text-[10px] font-bold text-zinc-900">{reply.sellerName}</p>
                            <p className="text-[10px] text-zinc-600">{reply.comment}</p>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <input
                        className="flex-1 p-2 bg-white rounded-xl text-[10px] font-bold"
                        placeholder="Reply to this review..."
                        value={replyDrafts[review.id] || ''}
                        onChange={(e) => setReplyDrafts(prev => ({ ...prev, [review.id]: e.target.value }))}
                      />
                      <button 
                        onClick={() => handleReply(review)}
                        className="px-3 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-bold"
                      >
                        Reply
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Shop Reviews */}
            <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm">
              <h3 className="text-sm font-bold mb-4">Shop Reviews</h3>
              <div className="space-y-4">
                {reviewsLoading && (
                  <div className="p-4 bg-zinc-50 rounded-2xl text-[10px] text-zinc-500 font-bold text-center">
                    Loading reviews…
                  </div>
                )}
                {!reviewsLoading && shopReviews.length === 0 && (
                  <div className="p-4 bg-zinc-50 rounded-2xl text-[10px] text-zinc-500 font-bold text-center">
                    No shop reviews yet.
                  </div>
                )}
                {shopReviews.map((review) => (
                  <div key={review.id} className="p-4 bg-zinc-50 rounded-2xl space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-zinc-900">{review.userName}</span>
                        <span className="text-[10px] text-zinc-400">{new Date(review.timestamp).toLocaleDateString()}</span>
                    </div>
                    <div className="flex text-amber-500">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`w-3 h-3 ${i < review.rating ? 'fill-amber-500' : 'text-zinc-200'}`} />
                      ))}
                    </div>
                    <p className="text-xs text-zinc-600 italic">"{review.comment}"</p>
                    {review.replies && review.replies.length > 0 && (
                      <div className="space-y-2">
                        {review.replies.map((reply: any) => (
                          <div key={reply.id} className="p-2 bg-white rounded-xl border border-zinc-100">
                            <p className="text-[10px] font-bold text-zinc-900">{reply.sellerName}</p>
                            <p className="text-[10px] text-zinc-600">{reply.comment}</p>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <input
                        className="flex-1 p-2 bg-white rounded-xl text-[10px] font-bold"
                        placeholder="Reply to this shop review..."
                        value={replyDrafts[review.id] || ''}
                        onChange={(e) => setReplyDrafts(prev => ({ ...prev, [review.id]: e.target.value }))}
                      />
                      <button 
                        onClick={() => handleShopReply(review)}
                        className="px-3 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-bold"
                      >
                        Reply
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <form onSubmit={handleUpdateProfile} className="space-y-6">
              <div className="flex items-center gap-6">
                <div className="relative">
                  <img src={seller.avatar} className="w-24 h-24 rounded-2xl object-cover" alt="avatar" />
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleAvatarUpload(file);
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    className="absolute -bottom-2 -right-2 p-2 bg-white rounded-lg shadow-lg border border-zinc-100"
                    disabled={avatarUploading}
                  >
                    <Upload className="w-4 h-4 text-zinc-600" />
                  </button>
                  {avatarUploading && (
                    <div className="mt-2 text-[10px] text-zinc-500 font-bold">Uploading…</div>
                  )}
                </div>
                <div className="flex-1 space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Shop Name</label>
                    <input 
                      type="text" 
                      value={profileData.name}
                      onChange={e => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full p-3 bg-white border border-zinc-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Description</label>
                <textarea 
                  rows={3}
                  value={profileData.description}
                  onChange={e => setProfileData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full p-3 bg-white border border-zinc-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Location / Address</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <input 
                    type="text" 
                    value={profileData.address}
                    onChange={e => setProfileData(prev => ({ ...prev, address: e.target.value }))}
                    className="w-full pl-10 pr-4 py-3 bg-white border border-zinc-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                {(() => {
                  const selectedPlace = locationPlaces.find((place) => place.id === profileData.placeId);
                  const selectedRegion = locationRegions.find((region) => region.id === profileData.defaultRegionId);
                  const locationLabel = selectedPlace?.name
                    ? `Using ${selectedPlace.name}`
                    : selectedRegion?.name
                      ? `Using ${selectedRegion.name}`
                      : profileData.address.trim()
                        ? `Using ${profileData.address.trim()}`
                        : '';
                  return locationLabel ? (
                    <div className="inline-flex items-center px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 text-[9px] font-black uppercase tracking-widest">
                      {locationLabel}
                    </div>
                  ) : null;
                })()}
                <LocationPinPicker
                  title="Shop Pin"
                  helpText="Search, drag, or tap the exact storefront location buyers should use for directions."
                  value={{
                    label: profileData.address,
                    lat: shopLocationLat === '' ? undefined : Number(shopLocationLat),
                    lng: shopLocationLng === '' ? undefined : Number(shopLocationLng),
                  }}
                  onChange={(next) => {
                    setProfileData(prev => ({
                      ...prev,
                      address: next.label || prev.address,
                    }));
                    setShopLocationLat(next.lat === undefined ? '' : next.lat);
                    setShopLocationLng(next.lng === undefined ? '' : next.lng);
                    setSettingsStatus(null);
                  }}
                  searchPlaceholder="Search shop building, road, stage, or landmark"
                  className="mt-4"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Default Region</label>
                  <select
                    value={profileData.defaultRegionId}
                    onChange={e => setProfileData(prev => ({ ...prev, defaultRegionId: e.target.value }))}
                    className="w-full p-3 bg-white border border-zinc-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Select region</option>
                    {locationRegions.map((region) => (
                      <option key={region.id} value={region.id}>
                        {region.name} {region.type ? `(${region.type})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Base Place</label>
                  <select
                    value={profileData.placeId}
                    onChange={e => setProfileData(prev => ({ ...prev, placeId: e.target.value }))}
                    className="w-full p-3 bg-white border border-zinc-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Select place</option>
                    {locationPlaces.map((place) => (
                      <option key={place.id} value={place.id}>
                        {place.name} {place.address_line ? `- ${place.address_line}` : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Location Mode</label>
                  <select
                    value={profileData.locationMode}
                    onChange={e => setProfileData(prev => ({ ...prev, locationMode: e.target.value }))}
                    className="w-full p-3 bg-white border border-zinc-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="fixed">Fixed</option>
                    <option value="semi_mobile">Semi Mobile</option>
                    <option value="mobile">Mobile</option>
                  </select>
                </div>
              </div>

              <div className="space-y-3 rounded-2xl border border-zinc-100 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Location Catalog</p>
                    <p className="text-sm font-bold text-zinc-900">Create regions and places, then pick them above.</p>
                  </div>
                  {locationAdminStatus && (
                    <span className="text-[10px] font-bold text-zinc-500">{locationAdminStatus}</span>
                  )}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  <div className="space-y-3 rounded-2xl bg-zinc-50 p-3 border border-zinc-100">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">{editingRegionId ? 'Edit Region' : 'Create Region'}</p>
                      {editingRegionId && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingRegionId(null);
                            setRegionDraft({ type: 'market_zone', name: '', parentId: '', lat: '', lng: '', locationLabel: '' });
                            setLocationAdminStatus(null);
                          }}
                          className="text-[10px] font-black text-zinc-500"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                    <select
                      value={regionDraft.type}
                      onChange={(e) => setRegionDraft(prev => ({ ...prev, type: e.target.value }))}
                      className="w-full p-3 bg-white border border-zinc-200 rounded-xl text-xs font-bold"
                    >
                      <option value="country">Country</option>
                      <option value="county">County</option>
                      <option value="city">City</option>
                      <option value="subcounty">Subcounty</option>
                      <option value="ward">Ward</option>
                      <option value="market_zone">Market Zone</option>
                    </select>
                    <input
                      value={regionDraft.name}
                      onChange={(e) => setRegionDraft(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Region name"
                      className="w-full p-3 bg-white border border-zinc-200 rounded-xl text-xs font-bold"
                    />
                    <select
                      value={regionDraft.parentId}
                      onChange={(e) => setRegionDraft(prev => ({ ...prev, parentId: e.target.value }))}
                      className="w-full p-3 bg-white border border-zinc-200 rounded-xl text-xs font-bold"
                    >
                      <option value="">Parent region (optional)</option>
                      {locationRegions.map((region) => (
                        <option key={region.id} value={region.id}>
                          {region.name}
                        </option>
                      ))}
                    </select>
                    <LocationPinPicker
                      title="Region Pin"
                      helpText="Search and drag to the center of this region."
                      value={{
                        label: regionDraft.locationLabel,
                        lat: regionDraft.lat ? Number(regionDraft.lat) : undefined,
                        lng: regionDraft.lng ? Number(regionDraft.lng) : undefined,
                      }}
                      onChange={(next) => {
                        setRegionDraft(prev => ({
                          ...prev,
                          lat: next.lat === undefined ? '' : String(next.lat),
                          lng: next.lng === undefined ? '' : String(next.lng),
                          locationLabel: next.label || prev.locationLabel,
                        }));
                        setLocationAdminStatus(null);
                      }}
                      searchPlaceholder="Search region center, market, or landmark"
                    />
                    <button
                      type="button"
                      onClick={handleCreateRegion}
                      className="w-full py-2.5 rounded-xl bg-zinc-900 text-white text-[10px] font-black"
                    >
                      {editingRegionId ? 'Save Region' : 'Add Region'}
                    </button>
                  </div>
                  <div className="space-y-3 rounded-2xl bg-zinc-50 p-3 border border-zinc-100">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">{editingPlaceId ? 'Edit Place' : 'Create Place'}</p>
                      {editingPlaceId && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingPlaceId(null);
                            setPlaceDraft({ type: 'pickup_point', name: '', regionId: '', addressLine: '', lat: '', lng: '', locationLabel: '' });
                            setLocationAdminStatus(null);
                          }}
                          className="text-[10px] font-black text-zinc-500"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                    <select
                      value={placeDraft.type}
                      onChange={(e) => setPlaceDraft(prev => ({ ...prev, type: e.target.value }))}
                      className="w-full p-3 bg-white border border-zinc-200 rounded-xl text-xs font-bold"
                    >
                      <option value="open_market">Open Market</option>
                      <option value="mall">Mall</option>
                      <option value="estate">Estate</option>
                      <option value="pickup_point">Pickup Point</option>
                      <option value="office">Office</option>
                      <option value="warehouse">Warehouse</option>
                    </select>
                    <input
                      value={placeDraft.name}
                      onChange={(e) => setPlaceDraft(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Place name"
                      className="w-full p-3 bg-white border border-zinc-200 rounded-xl text-xs font-bold"
                    />
                    <select
                      value={placeDraft.regionId}
                      onChange={(e) => setPlaceDraft(prev => ({ ...prev, regionId: e.target.value }))}
                      className="w-full p-3 bg-white border border-zinc-200 rounded-xl text-xs font-bold"
                    >
                      <option value="">Region (optional)</option>
                      {locationRegions.map((region) => (
                        <option key={region.id} value={region.id}>
                          {region.name}
                        </option>
                      ))}
                    </select>
                    <input
                      value={placeDraft.addressLine}
                      onChange={(e) => setPlaceDraft(prev => ({ ...prev, addressLine: e.target.value }))}
                      placeholder="Address line"
                      className="w-full p-3 bg-white border border-zinc-200 rounded-xl text-xs font-bold"
                    />
                    <LocationPinPicker
                      title="Place Pin"
                      helpText="Search and drag to the exact pickup point, building, or market spot."
                      value={{
                        label: placeDraft.locationLabel,
                        lat: placeDraft.lat ? Number(placeDraft.lat) : undefined,
                        lng: placeDraft.lng ? Number(placeDraft.lng) : undefined,
                      }}
                      onChange={(next) => {
                        setPlaceDraft(prev => ({
                          ...prev,
                          lat: next.lat === undefined ? '' : String(next.lat),
                          lng: next.lng === undefined ? '' : String(next.lng),
                          locationLabel: next.label || prev.locationLabel,
                          addressLine: next.label || prev.addressLine,
                        }));
                        setLocationAdminStatus(null);
                      }}
                      searchPlaceholder="Search pickup point, building, or landmark"
                    />
                    <button
                      type="button"
                      onClick={handleCreatePlace}
                      className="w-full py-2.5 rounded-xl bg-zinc-900 text-white text-[10px] font-black"
                    >
                      {editingPlaceId ? 'Save Place' : 'Add Place'}
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Regions</p>
                    <div className="max-h-40 overflow-auto space-y-1">
                      {locationRegions.slice(0, 8).map((region) => (
                        <div key={region.id} className="px-3 py-2 rounded-xl bg-zinc-50 border border-zinc-100 text-[10px] font-bold text-zinc-700 flex items-center justify-between gap-2">
                          <div>
                            {region.name} <span className="text-zinc-400">{region.type}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleEditRegion(region)}
                              className="text-[10px] font-black text-indigo-600"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteRegion(region.id)}
                              className="text-[10px] font-black text-red-500"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
                      {locationRegions.length === 0 && (
                        <p className="text-[10px] text-zinc-500 font-bold">No regions yet.</p>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Places</p>
                    <div className="max-h-40 overflow-auto space-y-1">
                      {locationPlaces.slice(0, 8).map((place) => (
                        <div key={place.id} className="px-3 py-2 rounded-xl bg-zinc-50 border border-zinc-100 text-[10px] font-bold text-zinc-700 flex items-center justify-between gap-2">
                          <div>
                            {place.name} <span className="text-zinc-400">{place.type}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleEditPlace(place)}
                              className="text-[10px] font-black text-indigo-600"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeletePlace(place.id)}
                              className="text-[10px] font-black text-red-500"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
                      {locationPlaces.length === 0 && (
                        <p className="text-[10px] text-zinc-500 font-bold">No places yet.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3 rounded-2xl border border-zinc-100 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Location History</p>
                    <p className="text-sm font-bold text-zinc-900">Read-only audit trail of shop movements</p>
                  </div>
                  <span className="text-[10px] font-bold text-zinc-500">{sellerLocationHistory.length} records</span>
                </div>
                <div className="space-y-2 max-h-48 overflow-auto">
                  {sellerLocationHistory.slice(0, 8).map((item) => (
                    <div key={item.id} className="flex items-center justify-between rounded-2xl bg-zinc-50 border border-zinc-100 px-3 py-2 text-[10px] font-bold text-zinc-600">
                      <div className="min-w-0">
                        <p className="text-zinc-800">{item.source || 'manual_pin'}</p>
                        <p className="text-zinc-400 truncate">
                          {item.lat.toFixed(5)}, {item.lng.toFixed(5)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-zinc-500">{item.created_at ? new Date(item.created_at).toLocaleString() : ''}</p>
                        <p className="text-zinc-400">{item.region_id || item.place_id || 'Unlinked'}</p>
                      </div>
                    </div>
                  ))}
                  {sellerLocationHistory.length === 0 && (
                    <p className="text-[10px] text-zinc-500 font-bold">No history records yet.</p>
                  )}
                </div>
              </div>

              <div className="space-y-3 rounded-2xl border border-zinc-100 bg-zinc-50/70 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Shop Front Photo</label>
                    <p className="text-[10px] text-zinc-500 font-medium">Used in buyer directions and shop detail cards.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => shopFrontInputRef.current?.click()}
                    className="px-3 py-2 rounded-xl bg-zinc-900 text-white text-[10px] font-black"
                  >
                    Upload
                  </button>
                </div>
                <input
                  ref={shopFrontInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      void uploadShopFrontImage(file);
                    }
                    e.currentTarget.value = '';
                  }}
                />
                {shopFrontImageUrl && (
                  <img src={shopFrontImageUrl} alt="Shop front preview" className="h-40 w-full object-cover rounded-2xl border border-zinc-200 bg-white" />
                )}
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Directions Note</label>
                  <textarea
                    rows={3}
                    value={directionsNote}
                    onChange={e => setDirectionsNote(e.target.value)}
                    placeholder="Opposite the green kiosk, next to the service lane, first door on the left..."
                    className="w-full p-3 bg-white border border-zinc-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Landmark Photos</label>
                      <p className="text-[10px] text-zinc-500 font-medium">Add 1-5 visual cues to make the route easy to follow.</p>
                    </div>
                    <button
                      type="button"
                      onClick={addShopLandmark}
                      className="px-3 py-2 rounded-xl bg-white border border-zinc-200 text-[10px] font-black text-zinc-700"
                    >
                      Add Landmark
                    </button>
                  </div>
                  <div className="space-y-2">
                    {shopLandmarks.length === 0 && (
                      <p className="text-[10px] text-zinc-500 font-bold">No landmark photos added yet.</p>
                    )}
                    {shopLandmarks.map((item, idx) => (
                      <div key={`${item.id || idx}`} className="grid grid-cols-1 sm:grid-cols-[auto_1.2fr_1fr_auto] gap-2 bg-white rounded-2xl p-3 border border-dashed border-zinc-200">
                        <div className="space-y-2">
                          <div className="w-12 h-12 rounded-xl overflow-hidden border border-zinc-100 bg-zinc-50 flex items-center justify-center">
                            {item.image_url ? (
                              <img src={item.image_url} alt={item.label || `Landmark ${idx + 1}`} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-[9px] text-zinc-400 font-bold">Photo</span>
                            )}
                          </div>
                          <label className="inline-flex items-center justify-center px-3 py-2 rounded-xl bg-zinc-100 text-zinc-700 text-[9px] font-black cursor-pointer">
                            Upload
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  void handleShopLandmarkFile(idx, file);
                                }
                                e.currentTarget.value = '';
                              }}
                            />
                          </label>
                        </div>
                        <div className="space-y-2">
                          <input
                            value={item.label}
                            onChange={(e) => updateShopLandmark(idx, { label: e.target.value })}
                            placeholder="Label"
                            className="w-full px-3 py-2 rounded-xl bg-zinc-50 border border-zinc-200 text-[10px] font-bold"
                          />
                          <input
                            value={item.image_url}
                            onChange={(e) => updateShopLandmark(idx, { image_url: e.target.value })}
                            placeholder="Image URL"
                            className="w-full px-3 py-2 rounded-xl bg-zinc-50 border border-zinc-200 text-[10px] font-bold"
                          />
                        </div>
                        <div className="space-y-2">
                          <select
                            value={item.type || 'landmark'}
                            onChange={(e) => updateShopLandmark(idx, { type: e.target.value })}
                            className="w-full px-3 py-2 rounded-xl bg-zinc-50 border border-zinc-200 text-[10px] font-bold"
                          >
                            <option value="landmark">Landmark</option>
                            <option value="shop_front">Shop Front</option>
                            <option value="turn">Turn</option>
                          </select>
                          <div className="grid grid-cols-2 gap-2">
                            <input
                              type="number"
                              value={item.lat ?? ''}
                              onChange={(e) => updateShopLandmark(idx, { lat: e.target.value === '' ? undefined : Number(e.target.value) })}
                              placeholder="Lat"
                              className="w-full px-3 py-2 rounded-xl bg-zinc-50 border border-zinc-200 text-[10px] font-bold"
                            />
                            <input
                              type="number"
                              value={item.lng ?? ''}
                              onChange={(e) => updateShopLandmark(idx, { lng: e.target.value === '' ? undefined : Number(e.target.value) })}
                              placeholder="Lng"
                              className="w-full px-3 py-2 rounded-xl bg-zinc-50 border border-zinc-200 text-[10px] font-bold"
                            />
                          </div>
                        </div>
                        <div className="flex items-start">
                          <button
                            type="button"
                            onClick={() => setShopLandmarks(prev => prev.filter((_, i) => i !== idx))}
                            className="px-3 py-2 rounded-xl bg-zinc-100 text-zinc-600 text-[10px] font-black"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <button 
                type="submit"
                className="w-full py-4 bg-zinc-900 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-zinc-800 transition-colors"
              >
                <Save className="w-5 h-5" /> Save Changes
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Referral Modal */}
      <AnimatePresence>
        {showReferralModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-indigo-100 rounded-2xl">
                  <Users className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-zinc-900">
                    {referralTarget === 'supplier' ? 'Invite a Supplier' : 'Invite a Shop'}
                  </h3>
                  <p className="text-xs text-zinc-500 font-bold">Grow the Sconnect community</p>
                </div>
              </div>
              <div className="space-y-4 mb-8">
                <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl">
                  <p className="text-xs font-bold text-emerald-800 mb-1">Referral Reward</p>
                  <p className="text-[10px] text-emerald-600">
                    {referralRewards
                      ? `You get ${referralRewards.currency ? `${referralRewards.currency} ` : ''}${referralTarget === 'supplier' ? (referralRewards.supplier ?? 0) : (referralRewards.shop ?? 0)}. They get the same.`
                      : 'Rewards not configured yet.'}
                  </p>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Phone Number</label>
                  <input 
                    type="tel" 
                    value={referralPhone}
                    onChange={(e) => setReferralPhone(e.target.value)}
                    className="w-full p-4 bg-zinc-100 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                  <p className="text-[9px] text-zinc-400 font-bold">Add the number you want to invite or share with.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowReferralModal(false)}
                  className="flex-1 py-4 bg-zinc-100 text-zinc-600 rounded-2xl font-bold text-xs"
                >
                  Cancel
                </button>
                <button 
                  onClick={async () => {
                    if (!referralPhone.trim()) {
                      onToast?.('Enter a phone number to invite.');
                      return;
                    }
                    try {
                      await inviteGrowthReferral({ code: referralPhone.trim(), contact: referralPhone.trim() });
                      onToast?.('Referral invite queued.');
                      setShowReferralModal(false);
                      setReferralPhone('');
                    } catch (err: any) {
                      onToast?.(err?.message || 'Referral invite failed.');
                    }
                  }}
                  className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-bold text-xs shadow-lg shadow-indigo-600/20"
                >
                  Send Invite
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Product Media Drawer */}
      <AnimatePresence>
        {showMediaDrawer && mediaDrawerProduct && (
          <div className="fixed inset-0 z-[70]">
            <div
              className="absolute inset-0 bg-black/60"
              onClick={() => setShowMediaDrawer(false)}
            />
            <motion.div
              initial={{ x: 320, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 320, opacity: 0 }}
              className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl flex flex-col"
            >
              <div className="p-4 border-b flex items-center justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-zinc-400">Media Library</p>
                  <p className="text-sm font-bold text-zinc-900">{mediaDrawerProduct.name}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => mediaDrawerInputRef.current?.click()}
                    className="p-2 rounded-full hover:bg-zinc-100"
                    title="Upload media"
                  >
                    <Upload className="w-5 h-5" />
                  </button>
                  <button onClick={() => setShowMediaDrawer(false)} className="p-2 rounded-full hover:bg-zinc-100">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <input
                ref={mediaDrawerInputRef}
                type="file"
                accept="image/*,video/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    handleProductMediaUpload(file, mediaDrawerProduct);
                  }
                }}
              />
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {(mediaDrawerProduct.productId && (productMediaByProductId[mediaDrawerProduct.productId] || []).length > 0) ? (
                  <div className="grid grid-cols-2 gap-3">
                    {(productMediaByProductId[mediaDrawerProduct.productId] || []).map((media) => (
                      <div key={media.id || media.url} className="bg-zinc-50 rounded-2xl overflow-hidden border border-zinc-100">
                        <div className="w-full h-32 bg-zinc-100">
                          <img
                            src={media.url || mediaDrawerProduct.mediaUrl}
                            className="w-full h-full object-cover"
                            alt=""
                            loading="lazy"
                          />
                        </div>
                        <div className="p-3 space-y-2">
                          <div className="text-[9px] font-bold text-zinc-400 truncate">{media.url}</div>
                          <span
                            className={`inline-flex px-2 py-0.5 rounded-full text-[8px] font-black uppercase ${
                              media.status === 'ready'
                                ? 'bg-emerald-50 text-emerald-600'
                                : media.status === 'processing'
                                  ? 'bg-amber-50 text-amber-600'
                                  : 'bg-zinc-100 text-zinc-500'
                            }`}
                          >
                            {media.status || 'pending'}
                          </span>
                          {media.id && (
                            <button
                              onClick={() => handleRemoveProductMediaFor(mediaDrawerProduct, media.id!)}
                              className="w-full py-1.5 bg-red-50 text-red-600 rounded-full text-[9px] font-black"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 bg-zinc-50 rounded-2xl text-[10px] font-bold text-zinc-500">
                    No media uploaded yet.
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Product Addition/Edit Modal */}
      {isAddingProduct && (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <motion.div 
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            <div className="p-6 border-b flex justify-between items-center">
              <h3 className="text-xl font-bold">{editingProduct ? 'Edit Product' : 'Add New Product'}</h3>
              <div className="flex items-center gap-2">
                {editingProduct && (
                  <button
                    onClick={() => handleOpenMediaDrawer(editingProduct)}
                    className="p-2 hover:bg-zinc-100 rounded-full"
                    title="View media"
                  >
                    <ImageIcon className="w-5 h-5" />
                  </button>
                )}
                <button onClick={() => setIsAddingProduct(false)} className="p-2 hover:bg-zinc-100 rounded-full">
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            <form onSubmit={handleSaveProduct} className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
              <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shrink-0">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-indigo-900 uppercase tracking-wider">Smart Listing AI</h4>
                    <p className="text-[10px] text-indigo-600 font-medium">Auto-generate details from your draft</p>
                  </div>
                </div>
                <button 
                  type="button"
                  onClick={() => {
                    setIsAddingProduct(false);
                    setShowListingOptimizer(true);
                  }}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold shadow-md shadow-indigo-500/20 flex items-center gap-2 transition-all active:scale-95"
                >
                  <Wand2 className="w-3 h-3" />
                  Optimize
                </button>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Product Name</label>
                <input 
                  required
                  type="text" 
                  value={formData.name}
                  onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. Premium Wireless Headphones"
                  className="w-full p-3 bg-zinc-50 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Price ($)</label>
                  <input 
                    required
                    type="number" 
                    step="0.01"
                    value={formData.price}
                    onChange={e => setFormData(prev => ({ ...prev, price: e.target.value }))}
                    placeholder="0.00"
                    className="w-full p-3 bg-zinc-50 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Category</label>
                  <select 
                    required
                    value={formData.category}
                    onChange={e => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full p-3 bg-zinc-50 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Select...</option>
                    <option value="Electronics">Electronics</option>
                    <option value="Fashion">Fashion</option>
                    <option value="Home">Home</option>
                    <option value="Accessories">Accessories</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Description</label>
                <textarea 
                  required
                  rows={3}
                  value={formData.description}
                  onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe your product..."
                  className="w-full p-3 bg-zinc-50 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Expiry Date (Optional)</label>
                <input 
                  type="date" 
                  value={formData.expiryDate || ''}
                  onChange={e => setFormData(prev => ({ ...prev, expiryDate: e.target.value }))}
                  className="w-full p-3 bg-zinc-50 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Media Upload (video clips must be 60s max)</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={formData.mediaUrl}
                    onChange={e => setFormData(prev => ({ ...prev, mediaUrl: e.target.value }))}
                    placeholder="https://..."
                    className="flex-1 p-3 bg-zinc-50 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500"
                  />
                  <input
                    ref={mediaInputRef}
                    type="file"
                  accept="image/*,video/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleProductMediaUpload(file);
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => mediaInputRef.current?.click()}
                    className="p-3 bg-zinc-100 rounded-xl text-zinc-500 disabled:opacity-60"
                    disabled={mediaUploading}
                  >
                    <Upload className="w-5 h-5" />
                  </button>
                </div>
                {mediaUploading && (
                  <p className="text-[10px] text-zinc-500 font-bold">Uploading media…</p>
                )}
                {editingProduct?.productId && (productMediaByProductId[editingProduct.productId] || []).length > 0 && (
                  <div className="mt-2 space-y-2">
                    {(productMediaByProductId[editingProduct.productId] || []).map((media) => (
                      <div key={media.id || media.url} className="flex items-center justify-between bg-zinc-50 rounded-xl px-3 py-2 gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-lg overflow-hidden border border-zinc-100">
                            <img src={media.url || formData.mediaUrl} className="w-full h-full object-cover" alt="" loading="lazy" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-[10px] font-bold text-zinc-600 truncate">
                              {media.url}
                            </div>
                            <div className="text-[9px] font-bold text-zinc-400">
                              Status: {media.status || 'pending'}
                            </div>
                          </div>
                        </div>
                        {media.id && (
                          <button
                            type="button"
                            onClick={() => handleRemoveProductMedia(media.id!)}
                            className="px-2 py-1 bg-red-50 text-red-600 rounded-full text-[9px] font-black"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-3 rounded-2xl border border-zinc-100 bg-zinc-50 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-widest text-zinc-500">Group Buy Eligible</h4>
                    <p className="text-[10px] text-zinc-500">Opt-in and set tiered pricing for bulk buyers.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.groupBuyEligible}
                    onChange={(e) => {
                      const enabled = e.target.checked;
                      setFormData(prev => ({
                        ...prev,
                        groupBuyEligible: enabled,
                        groupBuyTiers: enabled && prev.groupBuyTiers.length === 0
                          ? [{ qty: 5, price: Number(prev.price || 0), discount: '' }]
                          : enabled
                            ? prev.groupBuyTiers
                            : []
                      }));
                    }}
                    className="h-5 w-5"
                  />
                </div>
                {formData.groupBuyEligible && (
                  <div className="space-y-3">
                    {formData.groupBuyTiers.map((tier, idx) => (
                      <div key={`${tier.qty}-${idx}`} className="grid grid-cols-3 gap-2">
                        <input
                          type="number"
                          value={tier.qty}
                          onChange={(e) => {
                            const qty = Number(e.target.value || 0);
                            setFormData(prev => ({
                              ...prev,
                              groupBuyTiers: prev.groupBuyTiers.map((t, i) => i === idx ? { ...t, qty } : t)
                            }));
                          }}
                          placeholder="Qty"
                          className="px-3 py-2 rounded-xl bg-white text-sm font-semibold"
                        />
                        <input
                          type="number"
                          value={tier.price}
                          onChange={(e) => {
                            const price = Number(e.target.value || 0);
                            setFormData(prev => ({
                              ...prev,
                              groupBuyTiers: prev.groupBuyTiers.map((t, i) => i === idx ? { ...t, price } : t)
                            }));
                          }}
                          placeholder="Price"
                          className="px-3 py-2 rounded-xl bg-white text-sm font-semibold"
                        />
                        <input
                          type="text"
                          value={tier.discount || ''}
                          onChange={(e) => {
                            const discount = e.target.value;
                            setFormData(prev => ({
                              ...prev,
                              groupBuyTiers: prev.groupBuyTiers.map((t, i) => i === idx ? { ...t, discount } : t)
                            }));
                          }}
                          placeholder="Discount"
                          className="px-3 py-2 rounded-xl bg-white text-sm font-semibold"
                        />
                      </div>
                    ))}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, groupBuyTiers: [...prev.groupBuyTiers, { qty: 10, price: 0, discount: '' }] }))}
                        className="px-3 py-2 rounded-xl bg-white text-xs font-bold border border-zinc-200"
                      >
                        + Add Tier
                      </button>
                      {formData.groupBuyTiers.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, groupBuyTiers: prev.groupBuyTiers.slice(0, -1) }))}
                          className="px-3 py-2 rounded-xl bg-white text-xs font-bold border border-zinc-200 text-zinc-500"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-4">
                <button 
                  type="submit"
                  className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-500/30 hover:bg-indigo-700 transition-colors"
                >
                  {editingProduct ? 'Update Product' : 'List Product'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
      {/* RFQ Creation Modal */}
      <AnimatePresence>
        {showRfqModal && (
          <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.98, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 10 }}
              className="w-full max-w-3xl bg-white rounded-3xl p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-black text-zinc-900">Create RFQ</h3>
                  <p className="text-[10px] text-zinc-500 font-bold">Step {rfqStep === 'details' ? '1' : rfqStep === 'suppliers' ? '2' : '3'} of 3</p>
                </div>
                <button 
                  onClick={() => setShowRfqModal(false)}
                  className="p-2 rounded-full hover:bg-zinc-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {rfqStep === 'details' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-zinc-400">RFQ Type</label>
                      <select
                        className="w-full p-3 bg-zinc-50 border-none rounded-xl text-xs font-bold"
                        value={rfqDraft.type}
                        onChange={(e) => setRfqDraft(prev => ({ ...prev, type: e.target.value as any }))}
                      >
                        <option value="single">Single Product</option>
                        <option value="multi">Multi Product</option>
                        <option value="group">Group Buying</option>
                        <option value="standing">Standing RFQ</option>
                        <option value="emergency">Emergency</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-zinc-400">Delivery Location</label>
                      <input
                        className="w-full p-3 bg-zinc-50 border-none rounded-xl text-xs font-bold"
                        placeholder="e.g. Kawangware, Stage Road"
                        value={rfqDraft.deliveryLocation}
                        onChange={(e) => setRfqDraft(prev => ({ ...prev, deliveryLocation: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-zinc-400">RFQ Title</label>
                    <input
                      className="w-full p-3 bg-zinc-50 border-none rounded-xl text-xs font-bold"
                      placeholder="e.g. Unga 50kg x 20"
                      value={rfqDraft.title}
                      onChange={(e) => setRfqDraft(prev => ({ ...prev, title: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase text-zinc-400">Items</label>
                    {rfqDraft.items.map((item, idx) => (
                      <div key={idx} className="grid grid-cols-12 gap-2">
                        <input
                          className="col-span-6 p-3 bg-zinc-50 border-none rounded-xl text-xs font-bold"
                          placeholder="Item name"
                          value={item.name}
                          onChange={(e) => setRfqDraft(prev => ({
                            ...prev,
                            items: prev.items.map((it, i) => i === idx ? { ...it, name: e.target.value } : it)
                          }))}
                        />
                        <input
                          type="number"
                          className="col-span-3 p-3 bg-zinc-50 border-none rounded-xl text-xs font-bold"
                          placeholder="Qty"
                          value={item.quantity}
                          onChange={(e) => setRfqDraft(prev => ({
                            ...prev,
                            items: prev.items.map((it, i) => i === idx ? { ...it, quantity: Number(e.target.value) } : it)
                          }))}
                        />
                        <input
                          className="col-span-2 p-3 bg-zinc-50 border-none rounded-xl text-xs font-bold"
                          placeholder="Unit"
                          value={item.unit}
                          onChange={(e) => setRfqDraft(prev => ({
                            ...prev,
                            items: prev.items.map((it, i) => i === idx ? { ...it, unit: e.target.value } : it)
                          }))}
                        />
                        <button
                          onClick={() => setRfqDraft(prev => ({ ...prev, items: prev.items.filter((_, i) => i !== idx) }))}
                          className="col-span-1 p-3 bg-zinc-100 rounded-xl text-zinc-500"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => setRfqDraft(prev => ({ ...prev, items: [...prev.items, { name: '', quantity: 1, unit: 'units' }] }))}
                      className="w-full py-3 bg-zinc-900 text-white rounded-xl text-xs font-bold"
                    >
                      Add Item
                    </button>
                  </div>
                </div>
              )}

              {rfqStep === 'suppliers' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    {suppliersData.map(s => (
                      <label key={s.id} className="p-3 bg-zinc-50 rounded-2xl border border-zinc-100 flex items-center gap-3 text-xs font-bold text-zinc-700">
                        <input
                          type="checkbox"
                          checked={rfqDraft.supplierIds.includes(s.id)}
                          onChange={(e) => setRfqDraft(prev => ({
                            ...prev,
                            supplierIds: e.target.checked
                              ? [...prev.supplierIds, s.id]
                              : prev.supplierIds.filter(id => id !== s.id)
                          }))}
                        />
                        <div>
                          <p className="text-xs font-black text-zinc-900">{s.name || 'Supplier'}</p>
                          <p className="text-[10px] text-zinc-500">{s.category || 'General'} • {Number.isFinite(s.rating) ? s.rating : 'N/A'}★</p>
                        </div>
                      </label>
                    ))}
                  </div>
                  {!suppliersLoading && suppliersData.length === 0 && (
                    <p className="text-[10px] text-zinc-500 font-bold">No suppliers available yet.</p>
                  )}
                  {rfqDraft.supplierIds.length === 0 && (
                    <p className="text-[10px] text-zinc-500 font-bold">Select at least one supplier to continue.</p>
                  )}
                </div>
              )}

              {rfqStep === 'review' && (
                <div className="space-y-4">
                  <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                    <p className="text-sm font-bold text-zinc-900">{rfqDraft.title}</p>
                    <p className="text-[10px] text-zinc-500">Type: {rfqDraft.type.toUpperCase()} • Delivery: {rfqDraft.deliveryLocation}</p>
                    <div className="mt-2 grid grid-cols-2 gap-2 text-[10px] font-bold text-zinc-600">
                      {rfqDraft.items.map((item, idx) => (
                        <div key={idx} className="bg-white rounded-lg p-2 border border-zinc-100">
                          {item.name} • {item.quantity} {item.unit}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black uppercase tracking-widest text-zinc-400">Quote Comparison</h4>
                    <select 
                      className="text-[10px] font-bold bg-zinc-50 border-none rounded-lg px-2 py-1"
                      value={compareSort}
                      onChange={(e) => setCompareSort(e.target.value as any)}
                    >
                      <option value="price">Sort by Price</option>
                      <option value="eta">Sort by ETA</option>
                      <option value="rating">Sort by Rating</option>
                      <option value="distance">Sort by Distance</option>
                    </select>
                  </div>

                  <div className="overflow-x-auto">
                    <div className="flex gap-4 min-w-max">
                      {rfqDraftPreviewResponses
                        .sort((a, b) => {
                          if (compareSort === 'price') return Number(a.price || 0) - Number(b.price || 0);
                          if (compareSort === 'eta') return (a.etaHours || 999) - (b.etaHours || 999);
                          if (compareSort === 'rating') return Number(b.rating || 0) - Number(a.rating || 0);
                          if (compareSort === 'distance') return (a.distanceKm || 999) - (b.distanceKm || 999);
                          return 0;
                        })
                        .map((r, idx) => (
                          <div key={idx} className="w-72 bg-white rounded-2xl border border-zinc-100 p-4 flex flex-col">
                            <div className="flex items-center justify-between mb-3">
                              <div>
                                <p className="text-sm font-bold text-zinc-900">{getSupplierName(r.supplierId)}</p>
                                <p className="text-[10px] text-zinc-500">{Number.isFinite(r.rating) ? r.rating : 'N/A'}★ • ETA {r.etaHours ? `${r.etaHours}h` : 'N/A'} • {r.verified ? 'Verified' : 'Unverified'}</p>
                              </div>
                              <span className="text-[10px] font-black text-emerald-600">KES {r.price}</span>
                            </div>
                            <div className="space-y-2 text-[10px] font-bold text-zinc-600">
                              <div className="flex items-center justify-between">
                                <span>Stock</span>
                                <span>{r.stock ?? 'N/A'}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span>MOQ</span>
                                <span>{r.moq ?? 'N/A'}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span>Terms</span>
                                <span>{r.paymentTerms ?? 'N/A'}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span>Lead Time</span>
                                <span>{r.leadTimeDays ? `${r.leadTimeDays}d` : 'N/A'}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span>Distance</span>
                                <span>{r.distanceKm ? `${r.distanceKm.toFixed(1)} km` : 'N/A'}</span>
                              </div>
                            </div>
                            <button
                              onClick={() => setRfqDraft(prev => ({ ...prev, supplierIds: prev.supplierIds.filter(id => id !== r.supplierId) }))}
                              className="mt-3 py-2 text-[10px] font-bold text-zinc-500 hover:text-red-500"
                            >
                              Remove from comparison
                            </button>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-6 flex items-center justify-between">
                <button
                  onClick={() => {
                    if (rfqStep === 'details') return setShowRfqModal(false);
                    setRfqStep(rfqStep === 'review' ? 'suppliers' : 'details');
                  }}
                  className="px-4 py-2 bg-zinc-100 rounded-xl text-xs font-bold text-zinc-600"
                >
                  {rfqStep === 'details' ? 'Cancel' : 'Back'}
                </button>
                {rfqStep !== 'review' ? (
                  <button
                    onClick={() => {
                      if (rfqStep === 'details') setRfqStep('suppliers');
                      if (rfqStep === 'suppliers') setRfqStep('review');
                    }}
                    disabled={(rfqStep === 'details' && !rfqDetailsValid) || (rfqStep === 'suppliers' && !rfqSuppliersValid)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold ${((rfqStep === 'details' && !rfqDetailsValid) || (rfqStep === 'suppliers' && !rfqSuppliersValid)) ? 'bg-zinc-200 text-zinc-500' : 'bg-zinc-900 text-white'}`}
                  >
                    Next
                  </button>
                ) : (
                  <button
                    onClick={handleCreateRfq}
                    disabled={rfqLoading}
                    className={`px-4 py-2 rounded-xl text-xs font-bold ${rfqLoading ? 'bg-emerald-200 text-emerald-700' : 'bg-emerald-600 text-white'}`}
                  >
                    {rfqLoading ? 'Sending…' : 'Send RFQ'}
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showPathRecorder && (
          <div className="fixed inset-0 z-[95] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className={`${isPathRecorderExpanded ? 'fixed inset-0 w-full h-full rounded-none' : 'w-full max-w-2xl rounded-3xl'} bg-white overflow-hidden shadow-2xl flex flex-col`}
            >
              <div className="p-4 border-b flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-emerald-600" />
                  <div>
                    <p className="text-sm font-black text-zinc-900">Record Shop Path</p>
                    <p className="text-[10px] text-zinc-500 font-bold">Capture the real route to your shop</p>
                    {activeShopLocationLabel && (
                      <p className="text-[10px] text-emerald-600 font-black uppercase tracking-wider">
                        {activeShopLocationLabel}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setShowPathRecorder(false)}
                  className="p-2 rounded-full hover:bg-zinc-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className={`${isPathRecorderExpanded ? 'flex-1 min-h-0' : 'relative h-[360px]'} bg-zinc-100 relative`}>
                <div ref={pathRecorderContainerRef} className="absolute inset-0" />
                {!mapboxToken && (
                  <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white bg-zinc-900/70">
                    Mapbox token missing. Add VITE_MAPBOX_TOKEN to enable maps.
                  </div>
                )}
                {mapboxToken && !sellerLocations[0]?.lat && (
                  <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-zinc-600 bg-white/80">
                    Set your shop location to enable path recording.
                  </div>
                )}
                {activeShopLocationLabel && (
                  <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-2xl text-[10px] font-black text-emerald-700 shadow">
                    {activeShopLocationLabel}
                  </div>
                )}
                <div className="absolute top-3 right-3 z-10">
                  <button
                    onClick={() => setIsPathRecorderExpanded((prev) => !prev)}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/90 backdrop-blur-md border border-white shadow text-[9px] font-black text-zinc-700"
                  >
                    {isPathRecorderExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                    {isPathRecorderExpanded ? 'Exit Fullscreen' : 'Fullscreen'}
                  </button>
                </div>
                {pathRecordingActive && (
                  <div className="absolute top-3 left-3 bg-rose-600/90 text-white px-3 py-1.5 rounded-2xl text-[10px] font-bold shadow space-y-1">
                    <div>
                      Recording… {Math.round(pathRecordingDistance)}m · {Math.floor((pathRecordingStart ? (Date.now() - pathRecordingStart) : 0) / 60000)}m
                    </div>
                    <div className="text-[9px] text-white/80">Points: {pathRecordingPoints.length} / 10</div>
                  </div>
                )}
                <div className="absolute bottom-4 left-4 right-4 z-20 flex flex-wrap gap-2">
                  <button
                    onClick={() => {
                      if (pathRecordingActive) {
                        stopPathRecording();
                      } else {
                        startPathRecording();
                      }
                    }}
                    className={`px-3 py-1.5 rounded-full text-[9px] font-black shadow ${pathRecordingActive ? 'bg-rose-600 text-white' : 'bg-emerald-600 text-white'}`}
                  >
                    {pathRecordingActive ? 'Stop Recording' : 'Record Path'}
                  </button>
                  {pathRecordingActive && (
                    <button
                      onClick={pathRecordingPaused ? resumePathRecording : pausePathRecording}
                      className="px-3 py-1.5 rounded-full text-[9px] font-black bg-white/90 text-zinc-700 shadow"
                    >
                      {pathRecordingPaused ? 'Resume' : 'Pause'}
                    </button>
                  )}
                </div>
              </div>
              <div className="p-4 border-t">
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <input
                    value={pathRecordingName}
                    onChange={(e) => setPathRecordingName(e.target.value)}
                    placeholder="Name this path"
                    className="w-full px-3 py-2 bg-zinc-50 rounded-xl text-xs font-bold"
                  />
                  <label className="flex items-center gap-2 text-[10px] font-bold text-zinc-600">
                    <input
                      type="checkbox"
                      checked={pathRecordingShared}
                      onChange={(e) => setPathRecordingShared(e.target.checked)}
                    />
                    Share with community
                  </label>
                </div>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <input
                    value={pathRecordingStartLabel}
                    onChange={(e) => setPathRecordingStartLabel(e.target.value)}
                    placeholder="Start label (e.g. Main road)"
                    className="w-full px-3 py-2 bg-zinc-50 rounded-xl text-xs font-bold"
                  />
                  <input
                    value={pathRecordingEndLabel}
                    onChange={(e) => setPathRecordingEndLabel(e.target.value)}
                    placeholder="End label (e.g. Shop front)"
                    className="w-full px-3 py-2 bg-zinc-50 rounded-xl text-xs font-bold"
                  />
                </div>
                <label className="flex items-center gap-2 text-[10px] font-bold text-zinc-600 mb-3">
                  <input
                    type="checkbox"
                    checked={pathRecordingPrimary}
                    onChange={(e) => setPathRecordingPrimary(e.target.checked)}
                  />
                  Set as primary route for buyers
                </label>
                <div className="mb-3">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Landmarks & Shop Front</p>
                    <button
                      onClick={addLandmarkDraft}
                      className="px-3 py-1 rounded-full bg-zinc-900 text-white text-[9px] font-black"
                      type="button"
                    >
                      Add Landmark
                    </button>
                  </div>
                  {pathLandmarkDrafts.length === 0 && (
                    <p className="mt-2 text-[10px] text-zinc-500 font-bold">Add photos so buyers can recognize your route.</p>
                  )}
                  <div className="mt-2 space-y-2">
                    {pathLandmarkDrafts.map((item, idx) => (
                      <div
                        key={`${item.label}-${idx}`}
                        className="grid grid-cols-1 sm:grid-cols-[auto_auto_1fr_1fr] gap-2 bg-zinc-50 rounded-2xl p-3 border border-dashed border-zinc-200"
                        draggable
                        onDragStart={() => {
                          landmarkDragIndexRef.current = idx;
                        }}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={() => {
                          const from = landmarkDragIndexRef.current;
                          if (from === null || from === idx) return;
                          setPathLandmarkDrafts((prev) => {
                            const next = [...prev];
                            const [moved] = next.splice(from, 1);
                            next.splice(idx, 0, moved);
                            return next;
                          });
                          landmarkDragIndexRef.current = null;
                        }}
                      >
                        <div className="flex items-center justify-center text-[10px] font-black text-zinc-400 cursor-move">
                          #{idx + 1}
                        </div>
                        <div className="w-12 h-12 rounded-xl overflow-hidden border border-white/60 bg-white shadow-sm flex items-center justify-center">
                          {item.imageUrl ? (
                            <img src={item.imageUrl} alt="Landmark preview" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-[9px] text-zinc-400 font-bold">Preview</span>
                          )}
                        </div>
                        <input
                          value={item.label}
                          onChange={(e) => {
                            const value = e.target.value;
                            setPathLandmarkDrafts(prev => prev.map((p, i) => i === idx ? { ...p, label: value } : p));
                          }}
                          placeholder="Landmark label"
                          className="px-3 py-2 rounded-xl bg-white border border-zinc-200 text-[10px] font-bold"
                        />
                        <select
                          value={item.type}
                          onChange={(e) => {
                            const value = e.target.value;
                            setPathLandmarkDrafts(prev => prev.map((p, i) => i === idx ? { ...p, type: value } : p));
                          }}
                          className="px-3 py-2 rounded-xl bg-white border border-zinc-200 text-[10px] font-bold"
                        >
                          <option value="landmark">Landmark</option>
                          <option value="shop_front">Shop Front</option>
                          <option value="turn">Turn</option>
                        </select>
                        <label className="px-3 py-2 rounded-xl bg-white border border-dashed border-zinc-200 text-[10px] font-bold text-zinc-500 cursor-pointer">
                          {item.uploading ? 'Uploading…' : item.imageUrl ? 'Image added' : 'Upload image'}
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                handleLandmarkFile(idx, file);
                              }
                              e.currentTarget.value = '';
                            }}
                          />
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="mb-3">
                  <div className="flex items-center justify-between text-[9px] font-bold text-zinc-500">
                    <span>Recording progress</span>
                    <span>{pathRecordingPoints.length} / 10 points</span>
                  </div>
                  <div className="mt-2 h-2 bg-zinc-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full"
                      style={{ width: `${Math.min(100, Math.round((pathRecordingPoints.length / 10) * 100))}%` }}
                    />
                  </div>
                </div>
                <button
                  onClick={savePathRecording}
                  disabled={pathRecordingPoints.length < 2}
                  className="w-full py-2 rounded-xl bg-emerald-600 text-white text-xs font-black disabled:opacity-50"
                >
                  Save Path
                </button>
                {pathRecordingStatus && (
                  <div className="mt-2 text-[10px] font-bold text-zinc-500">{pathRecordingStatus}</div>
                )}
                {sellerPaths.length > 0 && (
                  <div className="mt-4 border-t border-zinc-100 pt-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Saved Routes</p>
                      {activeShopLocationLabel && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[9px] font-black uppercase tracking-widest">
                          {activeShopLocationLabel}
                        </span>
                      )}
                    </div>
                    <div className="mt-2 space-y-2">
                      {sellerPaths.map((path) => (
                        <div key={path.id} className="flex items-center justify-between bg-zinc-50 rounded-2xl px-3 py-2 text-[10px] font-bold text-zinc-600">
                          <div>
                            <p className="text-[10px] font-black text-zinc-800">{path.name || 'Recorded path'}</p>
                            <p className="text-[9px] text-zinc-500">
                              {path.usage_count || 0} uses · {path.distance_meters ? `${Math.round(path.distance_meters / 10) / 100} km` : '—'}
                              {path.start_label || path.end_label ? ` · ${path.start_label || 'Start'} → ${path.end_label || 'Shop'}` : ''}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleViewPathWaypoints(path.id)}
                              className="px-2 py-1 rounded-full bg-white border border-zinc-200 text-[9px] font-black text-zinc-700"
                            >
                              Waypoints
                            </button>
                            {path.is_primary ? (
                              <span className="px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 text-[9px] font-black">
                                Primary
                              </span>
                            ) : (
                              <button
                                onClick={() => handleSetPrimaryPath(path.id)}
                                className="px-2 py-1 rounded-full bg-zinc-900 text-white text-[9px] font-black"
                              >
                                Set Primary
                              </button>
                            )}
                            <button
                              onClick={() => handleDeletePath(path.id)}
                              className="px-2 py-1 rounded-full bg-red-50 text-red-600 text-[9px] font-black"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                    {selectedPathId && (
                      <div className="mt-3 rounded-2xl border border-zinc-100 bg-white p-3">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Waypoints</p>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedPathId(null);
                              setSelectedPathWaypoints([]);
                            }}
                            className="text-[10px] font-black text-zinc-500"
                          >
                            Close
                          </button>
                        </div>
                        {selectedPathLoading && (
                          <p className="text-[10px] text-zinc-500 font-bold">Loading waypoints…</p>
                        )}
                        {!selectedPathLoading && selectedPathWaypoints.length === 0 && (
                          <p className="text-[10px] text-zinc-500 font-bold">No waypoints saved yet.</p>
                        )}
                        {!selectedPathLoading && selectedPathWaypoints.length > 0 && (
                          <div className="space-y-1 max-h-40 overflow-auto">
                            {selectedPathWaypoints.map((point) => (
                              <div key={`${point.index}-${point.lat}-${point.lng}`} className="flex items-center justify-between text-[10px] font-bold text-zinc-600 bg-zinc-50 rounded-xl px-2 py-1">
                                <span>#{point.index + 1}</span>
                                <span>{point.lat.toFixed(5)}, {point.lng.toFixed(5)}</span>
                                <span>{Math.round(point.distance_from_start_meters || 0)}m</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
                {sellerPathsStatus && (
                  <div className="mt-2 text-[10px] font-bold text-amber-600">{sellerPathsStatus}</div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <VideoTrimModal
        open={Boolean(pendingVideoTrim)}
        file={pendingVideoTrim?.file || null}
        maxDurationSeconds={60}
        onCancel={handleTrimmedVideoCancel}
        onConfirm={handleTrimmedVideoConfirm}
      />
      {/* AI Listing Optimizer Overlay */}
      <AnimatePresence>
        {showListingOptimizer && (
          <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-2xl">
              <ListingOptimizer 
                initialData={formData}
                onClose={() => setShowListingOptimizer(false)}
                onApply={(data) => {
                  setFormData(prev => ({ ...prev, ...data }));
                  setShowListingOptimizer(false);
                  setIsAddingProduct(true);
                }}
              />
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
