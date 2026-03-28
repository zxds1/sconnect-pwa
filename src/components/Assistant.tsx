import React, { useEffect, useMemo, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Sparkles, Send, Search, ShoppingBag, ArrowRightLeft, User, Trophy, Plug, Mic, Plus, BadgeCheck, TrendingUp, Camera, Users, MapPin, ExternalLink, SlidersHorizontal, Trash2 } from 'lucide-react';
import { Product } from '../types';
import { CameraCaptureOverlay } from './CameraCaptureOverlay';
import {
  createMessage,
  createMessageFeedback,
  createThread,
  deleteThread,
  getAssistantPreferences,
  listMessages,
  listSuggestions,
  listThreads,
  runOCR,
  runVisionSearch,
  streamThreadMessage,
  transcribeAudio,
  updateAssistantPreferences,
  updateThread
} from '../lib/assistantApi';
import { requestUploadPresign } from '../lib/uploadsApi';
import { requestMediaUploadPreview } from '../lib/mediaPreview';
import {
  getSellerBuyerInsight,
  getSellerFunnel,
  getSellerInventoryInsight,
  getSellerKpiSummary,
  getSellerMarketBenchmarks,
  listSellerAnomalies,
  type BuyerInsight,
  type FunnelMetrics,
  type InventoryInsight,
  type KPISummary,
  type MarketBenchmarks,
  type Anomaly
} from '../lib/sellerAnalyticsApi';
import { getSellerProfile } from '../lib/sellerProfileApi';
import { listSellerLowStock, type SellerLowStock } from '../lib/sellerProductsApi';
import { getMarketingKPIs, listHotspots, listSellerCampaigns, type Hotspot, type KPIStat } from '../lib/marketingApi';
import { getCashflow, getLoanEligibility, type Cashflow, type LoanEligibility } from '../lib/growthApi';
import { getDisputeSummary } from '../lib/supportApi';
import { listProfileFavorites, listProfileReviews } from '../lib/profileApi';
import { listRFQs, listRFQResponses, type RFQResponse, type RFQThread } from '../lib/suppliersApi';
import { getOpsConfig } from '../lib/opsConfigApi';
import {
  listRecentSearches,
  listSavedSearches,
  listSearchAlerts,
  listWatchlist,
  getIntelligence
} from '../lib/searchApi';
import { searchShops } from '../lib/shopDirectoryApi';
import { getCartInsights, getCartSummary, getCartRecommendations, getCartAlerts } from '../lib/cartApi';
import { getCompareList } from '../lib/compareApi';
import { getComparisonPreferences } from '../lib/settingsApi';
import { getRewardsBalance, getRewardStreaks, type RewardsBalance, type RewardsStreak } from '../lib/rewardsApi';
import { listNotifications, type NotificationListResponse } from '../lib/notificationsApi';
import { getAccountLabel, getAuthItem } from '../lib/authStorage';

type AssistantAction = {
  label: string;
  onClick: () => void;
};

type QuickAction = AssistantAction & {
  icon: any;
  tone: string;
};

type AssistantMessage = {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
  metadata?: Record<string, any>;
  actions?: AssistantAction[];
};

type AssistantReference = {
  label: string;
  detail?: string;
  data?: Record<string, any>;
};

type AssistantChat = {
  id: string;
  title: string;
  messages: AssistantMessage[];
  updatedAt: number;
  pinned?: boolean;
  draft?: boolean;
};

type SummaryStat = Record<string, any>;

const feedbackIntents = ['general', 'shopping', 'compare', 'bag', 'rfq', 'seller', 'support', 'search', 'analytics', 'ops', 'admin', 'compliance'];
const feedbackProfiles = ['default', 'buyer', 'compare', 'bag', 'rfq', 'seller', 'support', 'search', 'analytics', 'ops', 'admin', 'compliance'];

interface AssistantProps {
  products: Product[];
  onOpenSearch: (query: string) => void;
  onOpenProduct: (product: Product) => void;
  onAddToBag: (product: Product) => void;
  onAddToComparison: (product: Product) => void;
  onOpenSeller: (sellerId: string) => void;
  onStartNavigation: (payload: Record<string, any>) => void;
  onOpenRewards: () => void;
  onOpenProfile: () => void;
  onOpenSellerStudio: () => void;
  onOpenRFQ: () => void;
  onToast: (msg: string) => void;
  onOpenOnboarding: () => void;
  onOpenBag: () => void;
  onOpenQrScan: () => void;
  onOpenSubscriptions: () => void;
  onOpenPartnerships: () => void;
  onOpenFeed: () => void;
  onOpenGroupBuys: () => void;
  onOpenLogin: () => void;
  onOpenRegister: () => void;
  authPromptMessage?: string | null;
}

export const Assistant: React.FC<AssistantProps> = ({
  products,
  onOpenSearch,
  onOpenProduct,
  onAddToBag,
  onAddToComparison,
  onOpenSeller,
  onStartNavigation,
  onOpenRewards,
  onOpenProfile,
  onOpenSellerStudio,
  onOpenRFQ,
  onOpenOnboarding,
  onOpenBag,
  onOpenQrScan,
  onOpenSubscriptions,
  onOpenPartnerships,
  onOpenFeed,
  onOpenGroupBuys,
  onOpenLogin,
  onOpenRegister,
  authPromptMessage,
  onToast
}) => {
  void onOpenQrScan;
  const [chats, setChats] = useState<AssistantChat[]>([]);
  const [activeChatId, setActiveChatId] = useState('');
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [mediaUploading, setMediaUploading] = useState(false);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraBusy, setCameraBusy] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [transcribing, setTranscribing] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);
  const mediaInputRef = useRef<HTMLInputElement | null>(null);
  const cameraVideoRef = useRef<HTMLVideoElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingStreamRef = useRef<MediaStream | null>(null);
  const recordingChunksRef = useRef<BlobPart[]>([]);
  const recordingTimerRef = useRef<number | null>(null);
  const stopTimeoutRef = useRef<number | null>(null);
  const [isSellerAccount, setIsSellerAccount] = useState<boolean | null>(null);
  const [assistantActionUsage, setAssistantActionUsage] = useState<Record<string, number>>({});
  const [showModelPicker, setShowModelPicker] = useState(false);
  const [llmModel, setLlmModel] = useState('');
  const [llmProvider, setLlmProvider] = useState('');
  const [modelProviders, setModelProviders] = useState<Array<{ id: string; label?: string; models?: Array<{ id: string; label?: string }> }>>([]);
  const [defaultProvider, setDefaultProvider] = useState('');
  const [defaultModel, setDefaultModel] = useState('');
  const [effectiveProvider, setEffectiveProvider] = useState('');
  const [effectiveModel, setEffectiveModel] = useState('');
  const [allowModelOverride, setAllowModelOverride] = useState(false);
  const [modelConfigError, setModelConfigError] = useState<string | null>(null);
  const [modelConfigLoading, setModelConfigLoading] = useState(false);
  const [providerSearch, setProviderSearch] = useState('');
  const [modelSearch, setModelSearch] = useState('');
  const [providerMenuOpen, setProviderMenuOpen] = useState(false);
  const [modelMenuOpen, setModelMenuOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [sellerKpis, setSellerKpis] = useState<KPISummary | null>(null);
  const [sellerFunnel, setSellerFunnel] = useState<FunnelMetrics | null>(null);
  const [inventoryInsight, setInventoryInsight] = useState<InventoryInsight | null>(null);
  const [buyerInsight, setBuyerInsight] = useState<BuyerInsight | null>(null);
  const [marketBenchmarks, setMarketBenchmarks] = useState<MarketBenchmarks | null>(null);
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [comparisonPrefs, setComparisonPrefs] = useState<Record<string, any> | null>(null);
  const [lowStock, setLowStock] = useState<SellerLowStock[]>([]);
  const [marketingKpis, setMarketingKpis] = useState<KPIStat | null>(null);
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const [campaigns, setCampaigns] = useState<Array<{ id?: string; status?: string }>>([]);
  const [cashflow, setCashflow] = useState<Cashflow | null>(null);
  const [loanEligibility, setLoanEligibility] = useState<LoanEligibility | null>(null);
  const [disputeSummary, setDisputeSummary] = useState<SummaryStat | null>(null);
  const [profileReviews, setProfileReviews] = useState<any[]>([]);
  const [rfqThreads, setRfqThreads] = useState<RFQThread[]>([]);
  const [rfqResponses, setRfqResponses] = useState<RFQResponse[]>([]);
  const [, setRecentSearches] = useState<Array<{ id?: string; query?: string }>>([]);
  const [savedSearches, setSavedSearches] = useState<Array<{ id?: string; query?: string }>>([]);
  const [, setSearchAlerts] = useState<Array<{ id?: string }>>([]);
  const [, setWatchlist] = useState<Array<{ id?: string }>>([]);
  const [trendingSearches, setTrendingSearches] = useState<string[]>([]);
  const [, setSearchRecs] = useState<any[]>([]);
  const [cartInsights, setCartInsights] = useState<{ items?: number; seller_count?: number; total?: number } | null>(null);
  const [cartSummary, setCartSummary] = useState<{ total?: number; currency?: string } | null>(null);
  const [, setCartRecs] = useState<any[]>([]);
  const [, setCartAlerts] = useState<any[]>([]);
  const [, setCompareList] = useState<{ items?: any[] } | null>(null);
  const [rewardsBalance, setRewardsBalance] = useState<RewardsBalance | null>(null);
  const [rewardStreaks, setRewardStreaks] = useState<RewardsStreak[]>([]);
  const [notificationSummary, setNotificationSummary] = useState<NotificationListResponse | null>(null);
  const [favoriteShops, setFavoriteShops] = useState<any[]>([]);
  const [messageFeedbackTarget, setMessageFeedbackTarget] = useState<{ messageId: string; threadId: string } | null>(null);
  const [messageFeedbackRating, setMessageFeedbackRating] = useState('3');
  const [messageFeedbackOutcome, setMessageFeedbackOutcome] = useState('needs_correction');
  const [messageFeedbackComment, setMessageFeedbackComment] = useState('');
  const [messageFeedbackCorrection, setMessageFeedbackCorrection] = useState('');
  const [messageFeedbackCorrectIntent, setMessageFeedbackCorrectIntent] = useState('support');
  const [messageFeedbackCorrectProfile, setMessageFeedbackCorrectProfile] = useState('support');
  const [messageFeedbackUseInPlanner, setMessageFeedbackUseInPlanner] = useState(true);
  const [messageFeedbackSaving, setMessageFeedbackSaving] = useState(false);
  const endRef = useRef<HTMLDivElement | null>(null);
  const isVisitor = !getAuthItem('soko:auth_token');
  const accountLabel = getAccountLabel();

  const activeChat = chats.find(c => c.id === activeChatId) || chats[0];
  const activeMessages = activeChat?.messages || [];
  const showIntroCards = !activeMessages.some(m => m.role === 'user');
  const resolvedProviderId = llmProvider || defaultProvider;
  const providerModels = modelProviders.find((provider) => provider.id === resolvedProviderId)?.models || [];
  const filteredProviders = modelProviders.filter((provider) => {
    const label = (provider.label || provider.id || '').toLowerCase();
    return label.includes(providerSearch.trim().toLowerCase());
  });
  const filteredModels = providerModels.filter((model) => {
    const label = (model.label || model.id || '').toLowerCase();
    return label.includes(modelSearch.trim().toLowerCase());
  });
  const [showNewMemberIntro, setShowNewMemberIntro] = useState(false);
  const isGhostChat = (chat: AssistantChat) =>
    !chat.draft && chat.messages.length === 0 && chat.title.trim().toLowerCase() === 'new chat';
  const visibleChats = useMemo(
    () =>
      chats
        .filter((chat) => !isGhostChat(chat))
        .sort((a, b) => {
          if (!!a.pinned !== !!b.pinned) return a.pinned ? -1 : 1;
          return b.updatedAt - a.updatedAt;
        }),
    [chats]
  );

  useEffect(() => {
    let active = true;
    setModelConfigLoading(true);
    setModelConfigError(null);
    getAssistantPreferences()
      .then((resp) => {
        if (!active) return;
        const providers = Array.isArray(resp?.providers) ? resp.providers : [];
        setModelProviders(providers as any);
        setDefaultProvider(resp?.default_provider || '');
        setDefaultModel(resp?.default_model || '');
        setAllowModelOverride(Boolean(resp?.allow_user_override));
        setEffectiveProvider(resp?.effective_provider || resp?.default_provider || '');
        setEffectiveModel(resp?.effective_model || resp?.default_model || '');
        setLlmProvider(resp?.preferred_provider || '');
        setLlmModel(resp?.preferred_model || '');
        setAssistantActionUsage(resp?.action_usage || {});
        if (typeof resp?.sidebar_open === 'boolean') {
          setIsSidebarOpen(resp.sidebar_open);
        }
        if (typeof resp?.intro_seen === 'boolean') {
          const completed = localStorage.getItem('soko:onboarding_completed') === 'true';
          if (completed && !resp.intro_seen) {
            setShowNewMemberIntro(true);
          }
        }
      })
      .catch((err: any) => {
        if (!active) return;
        setModelConfigError(err?.message || 'Unable to load model preferences.');
      })
      .finally(() => {
        if (active) setModelConfigLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let alive = true;
    const loadComparisonPrefs = async () => {
      try {
        const prefs = await getComparisonPreferences();
        if (!alive) return;
        setComparisonPrefs(prefs || null);
      } catch {}
    };
    loadComparisonPrefs();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!showCamera || !cameraStream || !cameraVideoRef.current) return;
    const video = cameraVideoRef.current;
    video.srcObject = cameraStream;
    video.muted = true;
    (video as any).playsInline = true;
    video.play().catch(() => {
      setCameraError('Unable to start camera preview.');
    });
  }, [showCamera, cameraStream]);

  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop());
      }
      if (recordingStreamRef.current) {
        recordingStreamRef.current.getTracks().forEach((track) => track.stop());
        recordingStreamRef.current = null;
      }
      if (recordingTimerRef.current) {
        window.clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
    };
  }, [cameraStream]);
  const toNumber = (value: any) => {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  };
  const formatPct = (value: number) => {
    if (!Number.isFinite(value)) return '—';
    const normalized = value > 1 ? value : value * 100;
    return `${Math.round(normalized)}%`;
  };
  const formatKES = (value: any) => {
    const n = toNumber(value);
    if (!n) return '—';
    return `KES ${Math.round(n).toLocaleString()}`;
  };
  const lowStockCount = lowStock.length;
  const abandonmentRate = sellerKpis?.cart_abandonment ?? sellerFunnel?.cart_abandonment;
  const demandHotspotCount = hotspots.length;
  const competitorMedian = marketBenchmarks?.competitor_median_price;
  const conversionRate = sellerKpis?.conversion_rate
    ?? (sellerFunnel?.sessions ? (toNumber(sellerFunnel.payment_success) / Math.max(1, toNumber(sellerFunnel.sessions))) : 0);
  const roas = toNumber(marketingKpis?.roas);
  const repeatRate = buyerInsight?.repeat_rate ?? sellerKpis?.repeat_rate_d30;
  const fulfillmentIssues = anomalies.filter(a => {
    const type = (a.type || '').toLowerCase();
    return type.includes('sla') || type.includes('fulfillment') || type.includes('delivery');
  }).length;
  const supplierRatingAvg = rfqResponses.length
    ? rfqResponses.reduce((sum, r) => sum + toNumber(r.supplier_rating), 0) / rfqResponses.length
    : 0;
  const avgReviewRating = profileReviews.length
    ? profileReviews.reduce((sum, r) => sum + toNumber(r.rating), 0) / profileReviews.length
    : 0;
  const disputeOpenCount = toNumber(disputeSummary?.open_count ?? disputeSummary?.open ?? disputeSummary?.pending ?? disputeSummary?.total_open);
  const activeCampaigns = campaigns.filter(c => (c.status || '').toLowerCase() === 'active').length;

  const insightCard = useMemo(() => {
    if (isSellerAccount === true) {
      if (lowStockCount > 0) {
        return {
          title: 'Inventory risk',
          metric: `${lowStockCount} low-stock`,
          detail: 'Items likely to stock out soon'
        };
      }
      if (fulfillmentIssues > 0) {
        return {
          title: 'Fulfillment delays',
          metric: `${fulfillmentIssues} alerts`,
          detail: 'Resolve delivery/SLA issues'
        };
      }
      if (disputeOpenCount > 0) {
        return {
          title: 'Disputes',
          metric: `${disputeOpenCount} open`,
          detail: 'Unresolved buyer issues'
        };
      }
      if (cashflow?.net_cashflow) {
        return {
          title: 'Cashflow',
          metric: formatKES(cashflow.net_cashflow),
          detail: 'Latest net cashflow'
        };
      }
      if (loanEligibility?.max_amount) {
        return {
          title: 'Credit eligibility',
          metric: formatKES(loanEligibility.max_amount),
          detail: loanEligibility.status ? `Status: ${loanEligibility.status}` : 'Eligible credit line'
        };
      }
      if (Number.isFinite(roas) && Number(roas) > 0) {
        return {
          title: 'Campaign ROAS',
          metric: `${toNumber(roas).toFixed(1)}x`,
          detail: 'Return on ad spend'
        };
      }
      if (avgReviewRating > 0) {
        return {
          title: 'Recent reviews',
          metric: `${avgReviewRating.toFixed(1)}★`,
          detail: 'Average rating'
        };
      }
      return null;
    }

    if (isSellerAccount === false) {
      if (rewardsBalance?.pending || rewardsBalance?.balance) {
        return {
          title: 'Rewards',
          metric: rewardsBalance?.balance ? formatKES(rewardsBalance.balance) : '—',
          detail: rewardsBalance?.pending ? `Pending ${formatKES(rewardsBalance.pending)}` : 'Rewards ready'
        };
      }
      if (notificationSummary?.unread_count) {
        return {
          title: 'Notifications',
          metric: `${notificationSummary.unread_count} unread`,
          detail: 'New alerts waiting'
        };
      }
      if (cartInsights?.items) {
        const currency = cartSummary?.currency || 'KES';
        const total = cartSummary?.total ? `${currency} ${Math.round(toNumber(cartSummary.total)).toLocaleString()}` : '—';
        return {
          title: 'Cart snapshot',
          metric: `${cartInsights.items} items`,
          detail: `Total ${total}`
        };
      }
      if (savedSearches.length > 0 && savedSearches[0]?.query) {
        return {
          title: 'Saved search',
          metric: savedSearches[0].query,
          detail: `${savedSearches.length} saved searches`
        };
      }
      if (trendingSearches.length > 0 && trendingSearches[0]) {
        return {
          title: 'Trending near you',
          metric: trendingSearches[0],
          detail: `${trendingSearches.length} trends`
        };
      }
      if (favoriteShops.length > 0) {
        return {
          title: 'Favorite shops',
          metric: `${favoriteShops.length} shops`,
          detail: 'Shops you follow'
        };
      }
      return null;
    }

    return null;
  }, [
    isSellerAccount,
    lowStockCount,
    fulfillmentIssues,
    disputeOpenCount,
    cashflow,
    loanEligibility,
    roas,
    avgReviewRating,
    rewardsBalance,
    notificationSummary,
    cartInsights,
    cartSummary,
    savedSearches,
    trendingSearches,
    favoriteShops
  ]);

  const ownerCards = isSellerAccount ? [
    {
      title: 'Top SKU at Risk',
      metric: `${lowStockCount} items`,
      detail: 'Likely to stock out in 48h',
      action: 'Reorder now',
      onClick: onOpenRFQ,
      show: lowStockCount > 0,
    },
    {
      title: 'Money Leaks',
      metric: formatPct(abandonmentRate || 0),
      detail: 'Cart abandonment rate',
      action: 'Review causes',
      onClick: onOpenSellerStudio,
      show: Boolean(abandonmentRate),
    },
    {
      title: 'Demand Spike Alerts',
      metric: `${demandHotspotCount} hotspot${demandHotspotCount === 1 ? '' : 's'}`,
      detail: 'Demand hotspots flagged today',
      action: 'Create promo',
      onClick: onOpenSellerStudio,
      show: demandHotspotCount > 0,
    },
    {
      title: 'Competitor Price Gap',
      metric: formatKES(competitorMedian),
      detail: 'Competitor median price',
      action: 'Update price',
      onClick: onOpenSellerStudio,
      show: Boolean(competitorMedian),
    },
    {
      title: 'Low Stock Radar',
      metric: `${lowStockCount} SKUs`,
      detail: inventoryInsight?.stockout_risk
        ? `Stockout risk ${formatPct(inventoryInsight.stockout_risk)}`
        : 'Below safety stock',
      action: 'Bulk restock',
      onClick: onOpenRFQ,
      show: lowStockCount > 0 || Boolean(inventoryInsight?.stockout_risk),
    },
    {
      title: 'Conversion Snapshot',
      metric: formatPct(conversionRate || 0),
      detail: 'Views → chats → orders',
      action: 'Fix bottleneck',
      onClick: onOpenSellerStudio,
      show: Boolean(conversionRate),
    },
    {
      title: 'Best Channel ROI',
      metric: roas ? `${roas.toFixed(1)}x` : '',
      detail: 'Return on ad spend',
      action: 'Shift budget',
      onClick: onOpenSellerStudio,
      show: Boolean(roas),
    },
    {
      title: 'Repeat Customers',
      metric: formatPct(repeatRate || 0),
      detail: 'Repeat buyer rate',
      action: 'Send offer',
      onClick: onOpenSellerStudio,
      show: Boolean(repeatRate),
    },
    {
      title: 'Fulfillment SLA Health',
      metric: `${Math.max(0, 100 - fulfillmentIssues * 5)}%`,
      detail: `${fulfillmentIssues} SLA issue${fulfillmentIssues === 1 ? '' : 's'} flagged`,
      action: 'Resolve delays',
      onClick: onOpenSellerStudio,
      show: fulfillmentIssues > 0,
    },
    {
      title: 'Supplier Performance',
      metric: `${supplierRatingAvg.toFixed(1)}★`,
      detail: 'Avg supplier rating from RFQs',
      action: 'Switch default',
      onClick: onOpenRFQ,
      show: supplierRatingAvg > 0,
    },
    {
      title: 'Review Heatmap',
      metric: `${avgReviewRating.toFixed(1)}★`,
      detail: 'Avg rating from recent reviews',
      action: 'Reply fast',
      onClick: onOpenProfile,
      show: profileReviews.length > 0,
    },
    {
      title: 'Dispute Alerts',
      metric: `${disputeOpenCount} open`,
      detail: 'Unresolved disputes',
      action: 'Resolve now',
      onClick: onOpenProfile,
      show: disputeOpenCount > 0,
    },
    {
      title: 'Cashflow Forecast',
      metric: formatKES(cashflow?.net_cashflow),
      detail: 'Latest net cashflow',
      action: 'View forecast',
      onClick: onOpenSellerStudio,
      show: Boolean(cashflow?.net_cashflow),
    },
    {
      title: 'Credit Eligibility',
      metric: formatKES(loanEligibility?.max_amount),
      detail: loanEligibility?.status ? `Status: ${loanEligibility.status}` : 'Eligibility status',
      action: 'Apply now',
      onClick: onOpenSellerStudio,
      show: Boolean(loanEligibility?.max_amount) || Boolean(loanEligibility?.status),
    },
    {
      title: 'Win-back List',
      metric: `${buyerInsight?.new_buyers} buyers`,
      detail: 'New vs returning split',
      action: 'Send win-back',
      onClick: onOpenSellerStudio,
      show: Boolean(buyerInsight?.new_buyers),
    },
    {
      title: 'Promo Effectiveness',
      metric: `${activeCampaigns} active`,
      detail: 'Active campaigns running',
      action: 'Duplicate offer',
      onClick: onOpenSellerStudio,
      show: activeCampaigns > 0,
    }
  ].filter(card => card.show) : [];

  const buyerCards = isSellerAccount === false ? [
    {
      title: 'Rewards Balance',
      metric: rewardsBalance?.balance ? formatKES(rewardsBalance.balance) : '',
      detail: rewardsBalance?.pending ? `Pending ${formatKES(rewardsBalance.pending)}` : 'Rewards ready',
      action: 'Open rewards',
      onClick: onOpenRewards,
      show: Boolean(rewardsBalance?.balance) || Boolean(rewardsBalance?.pending),
    },
    {
      title: 'Rewards Streak',
      metric: rewardStreaks.length ? `${rewardStreaks[0]?.count || 0} days` : '',
      detail: rewardStreaks[0]?.type ? `${rewardStreaks[0].type} streak` : 'Keep it going',
      action: 'Earn more',
      onClick: onOpenRewards,
      show: rewardStreaks.length > 0 && Boolean(rewardStreaks[0]?.count),
    },
    {
      title: 'Notifications',
      metric: notificationSummary?.unread_count ? `${notificationSummary.unread_count} unread` : '',
      detail: notificationSummary?.unread_count ? 'New alerts waiting' : '',
      action: 'Open notifications',
      onClick: onOpenProfile,
      show: Boolean(notificationSummary?.unread_count),
    },
    {
      title: 'Favorite Shops',
      metric: favoriteShops.length ? `${favoriteShops.length} shops` : '',
      detail: favoriteShops.length ? 'Shops you follow' : '',
      action: 'View profile',
      onClick: onOpenProfile,
      show: favoriteShops.length > 0,
    },
    {
      title: 'Saved Searches',
      metric: savedSearches.length ? `${savedSearches.length} saved` : '',
      detail: savedSearches[0]?.query ? `Saved: ${savedSearches[0].query}` : '',
      action: 'Open search',
      onClick: () => onOpenSearch(savedSearches[0]?.query || ''),
      show: savedSearches.length > 0 && Boolean(savedSearches[0]?.query),
    },
    {
      title: 'Trending Near You',
      metric: trendingSearches.length ? `${trendingSearches.length} trends` : '',
      detail: trendingSearches[0] ? `Top: ${trendingSearches[0]}` : '',
      action: 'Explore',
      onClick: () => onOpenSearch(trendingSearches[0] || ''),
      show: trendingSearches.length > 0 && Boolean(trendingSearches[0]),
    }
  ].filter(card => card.show) : [];
  const canAccessSeller = isSellerAccount === true;
  const [suggestionChips, setSuggestionChips] = useState<Array<{ label: string; value: string }>>([]);

  const agentStatusLabels: Record<string, string> = {
    orchestrator: 'Orchestrator: Coordinating agents…',
    discovery: 'Discovery: Comparing offers…',
    negotiation: 'Negotiation: Checking deals…',
    purchase: 'Purchase: Optimizing checkout…',
    insight: 'Insight: Pulling market signals…',
    routing: 'Routing: Comparing routes…'
  };

  const findProductById = (productId?: string) =>
    products.find((product) => product.id === productId || product.productId === productId);

  const getActionUsage = (label: string) => {
    return assistantActionUsage[label] ?? 0;
  };

  const getActionTone = (label: string) => {
    switch (label) {
      case 'Search':
        return 'cyan';
      case 'Compare':
        return 'violet';
      case 'Group Buys':
        return 'amber';
      case 'Bag':
        return 'emerald';
      case 'Rewards':
        return 'rose';
      case 'Subscriptions':
        return 'slate';
      case 'Partnerships':
        return 'indigo';
      case 'Feed':
        return 'emerald';
      case 'RFQ':
        return 'amber';
      case 'Seller Studio':
        return 'violet';
      default:
        return 'slate';
    }
  };

  const actionToneClasses: Record<string, string> = {
    cyan: 'border-cyan-400/20 bg-cyan-500/10 text-cyan-100 hover:bg-cyan-500/20',
    violet: 'border-violet-400/20 bg-violet-500/10 text-violet-100 hover:bg-violet-500/20',
    amber: 'border-amber-400/20 bg-amber-500/10 text-amber-100 hover:bg-amber-500/20',
    emerald: 'border-emerald-400/20 bg-emerald-500/10 text-emerald-100 hover:bg-emerald-500/20',
    rose: 'border-rose-400/20 bg-rose-500/10 text-rose-100 hover:bg-rose-500/20',
    slate: 'border-white/10 bg-white/10 text-white/80 hover:bg-white/20',
    indigo: 'border-indigo-400/20 bg-indigo-500/10 text-indigo-100 hover:bg-indigo-500/20',
    fuchsia: 'border-fuchsia-400/20 bg-fuchsia-500/10 text-fuchsia-100 hover:bg-fuchsia-500/20',
  };

  const bumpActionUsage = (label: string) => {
    setAssistantActionUsage((prev) => {
      const parsed = { ...prev, [label]: (prev[label] ?? 0) + 1 };
      void updateAssistantPreferences({ action_usage: parsed }).catch(() => {});
      return parsed;
    });
  };

  const sortActionsByUsage = <T extends AssistantAction>(items: T[]) =>
    [...items].sort((a, b) => {
      const usageDiff = getActionUsage(b.label) - getActionUsage(a.label);
      if (usageDiff !== 0) return usageDiff;
      return a.label.localeCompare(b.label);
    });

  const quickActions = sortActionsByUsage<QuickAction>([
    { label: 'Feed', icon: Sparkles, onClick: onOpenFeed, tone: getActionTone('Feed') },
    { label: 'Search', icon: Search, onClick: () => onOpenSearch(''), tone: getActionTone('Search') },
    { label: 'Compare', icon: ArrowRightLeft, onClick: () => setInput('/compare '), tone: getActionTone('Compare') },
    { label: 'Group Buys', icon: Users, onClick: () => onOpenGroupBuys(), tone: getActionTone('Group Buys') },
    { label: 'Bag', icon: ShoppingBag, onClick: () => onOpenBag(), tone: getActionTone('Bag') },
    { label: 'Rewards', icon: Trophy, onClick: () => onOpenRewards(), tone: getActionTone('Rewards') },
    { label: 'Subscriptions', icon: BadgeCheck, onClick: () => onOpenSubscriptions(), tone: getActionTone('Subscriptions') },
    { label: 'Partnerships', icon: Plug, onClick: () => onOpenPartnerships(), tone: getActionTone('Partnerships') },
    ...(canAccessSeller ? [
      { label: 'RFQ', icon: Plug, onClick: () => onOpenRFQ(), tone: getActionTone('RFQ') },
      { label: 'Seller Studio', icon: Sparkles, onClick: () => onOpenSellerStudio(), tone: getActionTone('Seller Studio') },
    ] : []),
  ]);

  const sortedSuggestionChips = useMemo(() => {
    return [...suggestionChips].sort((a, b) => {
      const usageDiff = getActionUsage(b.label) - getActionUsage(a.label);
      if (usageDiff !== 0) return usageDiff;
      return a.label.localeCompare(b.label);
    });
  }, [assistantActionUsage, suggestionChips]);

  const buildMapUrl = (payload?: Record<string, any>) => {
    if (!payload) return '';
    const explicit = String(payload?.map_url || payload?.maps_url || payload?.navigation_url || payload?.directions_url || '').trim();
    if (explicit) return explicit;
    const lat = String(payload?.lat || payload?.latitude || payload?.y || '').trim();
    const lng = String(payload?.lng || payload?.lon || payload?.longitude || payload?.x || '').trim();
    const address = String(payload?.address || payload?.address_line || payload?.location_address || payload?.formatted_address || '').trim();
    if (lat && lng) {
      return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${lat},${lng}`)}`;
    }
    if (address) {
      return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
    }
    return '';
  };

  const mapPayloadPreview = (payload?: Record<string, any>) => {
    if (!payload) return null;
    const address = String(payload?.address || payload?.address_line || payload?.location_address || payload?.formatted_address || '').trim();
    const region = String(payload?.region || payload?.region_name || payload?.city || payload?.county || payload?.market_zone || '').trim();
    const lat = String(payload?.lat || payload?.latitude || payload?.y || '').trim();
    const lng = String(payload?.lng || payload?.lon || payload?.longitude || payload?.x || '').trim();
    const bits = [address, region, lat && lng ? `${lat}, ${lng}` : ''].filter(Boolean);
    return bits.length ? bits : null;
  };

  const buildActionsFromMetadata = (metadata?: Record<string, any>): AssistantAction[] => {
    const rawActions = Array.isArray(metadata?.actions) ? metadata.actions : [];
    const mapped = rawActions
      .map((action: any) => {
        const type = String(action?.type || '').toLowerCase();
        const label = action?.label || 'Take action';
        const payload = action?.payload || {};
        if (!type) return null;
        switch (type) {
          case 'add_to_cart': {
            const productId = payload.product_id || payload.id;
            const product = findProductById(productId);
            if (!product) {
              const fallbackQuery = payload.name || payload.product_name || payload.query || '';
              return {
                label: label || 'Open search',
                onClick: () => {
                  if (fallbackQuery) {
                    onOpenSearch(fallbackQuery);
                  } else {
                    onToast('Open the product to add it to cart.');
                  }
                }
              };
            }
            return {
              label: label || `Add ${product.name}`,
              onClick: () => onAddToBag(product)
            };
          }
          case 'open_compare': {
            const productId = payload.product_id || payload.id;
            const product = findProductById(productId);
            if (!product) {
              return {
                label: label || 'Open compare',
                onClick: () => onToast('Open a product to compare offers.')
              };
            }
            return {
              label: label || 'Compare offers',
              onClick: () => onAddToComparison(product)
            };
          }
          case 'open_search': {
            const query = payload.query || payload.text || payload.value || '';
            return {
              label: label || 'Open search',
              onClick: () => onOpenSearch(query || input)
            };
          }
          case 'open_supplier': {
            const sellerId = payload.seller_id || payload.id;
            return {
              label: label || 'View supplier',
              onClick: () => {
                if (sellerId) {
                  onOpenSeller(sellerId);
                } else {
                  onToast('Supplier details unavailable.');
                }
              }
            };
          }
          case 'show_paths':
          case 'start_navigation': {
            const sellerId = payload.seller_id || payload.destination_seller_id;
            const mapUrl = buildMapUrl(payload);
            return {
              label: label || (type === 'start_navigation' ? 'Start Navigation' : 'Show Paths'),
              onClick: () => {
                if (type === 'start_navigation') {
                  if (sellerId || payload.product_id || payload.id || payload.path_id || payload.preferred_path_id || payload.route_id) {
                    onStartNavigation(payload);
                    return;
                  }
                  if (mapUrl) {
                    window.open(mapUrl, '_blank', 'noopener,noreferrer');
                    return;
                  }
                  onToast('Open the location to view directions.');
                  return;
                }
                if (sellerId) {
                  onOpenSeller(sellerId);
                  return;
                }
                if (mapUrl) {
                  window.open(mapUrl, '_blank', 'noopener,noreferrer');
                  return;
                }
                onToast('Open the seller to view directions.');
              }
            };
          }
          case 'open_map': {
            const mapUrl = buildMapUrl(payload);
            return {
              label: label || 'Open map',
              onClick: () => {
                if (mapUrl) {
                  window.open(mapUrl, '_blank', 'noopener,noreferrer');
                  return;
                }
                onToast('Map location unavailable.');
              }
            };
          }
          case 'open_rfq':
          case 'start_rfq':
            return {
              label: label || 'Open RFQ',
              onClick: () => onOpenRFQ()
            };
          case 'join_group_buy':
            return {
              label: label || 'Join Group Buy',
              onClick: () => {
                onOpenFeed();
                onToast('Opening group buy opportunities.');
              }
            };
          case 'open_cart':
            return {
              label: label || 'View cart',
              onClick: () => onOpenBag()
            };
          case 'view_insights':
            return {
              label: label || 'View insights',
              onClick: () => onOpenSellerStudio()
            };
          case 'open_seller_studio':
            return {
              label: label || 'Open Seller Studio',
              onClick: () => onOpenSellerStudio()
            };
          case 'open_rewards':
            return {
              label: label || 'Open Rewards',
              onClick: () => onOpenRewards()
            };
          case 'open_subscriptions':
            return {
              label: label || 'Open Subscriptions',
              onClick: () => onOpenSubscriptions()
            };
          case 'open_partnerships':
            return {
              label: label || 'Open Partnerships',
              onClick: () => onOpenPartnerships()
            };
          case 'open_feed':
            return {
              label: label || 'Open Feed',
              onClick: () => onOpenFeed()
            };
          case 'open_profile':
            return {
              label: label || (accountLabel ? `Open ${accountLabel}` : 'Open Profile'),
              onClick: () => onOpenProfile()
            };
          default:
            return null;
        }
      })
      .filter((action): action is AssistantAction => Boolean(action));
    return sortActionsByUsage(mapped).map((action) => ({
      label: action.label,
      onClick: () => {
        bumpActionUsage(action.label);
        action.onClick();
      }
    }));
  };

  const toAssistantMessages = (items: any[]): AssistantMessage[] =>
    (items || []).map((msg) => ({
      id: msg.id,
      role: msg.role === 'assistant' ? 'assistant' : 'user',
      content: msg.content || '',
      metadata: msg.metadata || {},
      actions: buildActionsFromMetadata(msg.metadata)
    }));

  const deriveChatTitle = (thread: any, messages: AssistantMessage[]) => {
    const rawTitle = String(thread?.title || '').trim();
    if (rawTitle && rawTitle.toLowerCase() !== 'new chat') return rawTitle;
    const firstUserMessage = messages.find((message) => message.role === 'user' && message.content.trim());
    if (firstUserMessage?.content) {
      return firstUserMessage.content.trim().slice(0, 28);
    }
    return 'New chat';
  };

  const mapThreadToChat = (thread: any, messages: AssistantMessage[] = []): AssistantChat => ({
    id: thread.id,
    title: deriveChatTitle(thread, messages),
    messages,
    updatedAt: thread.updated_at ? new Date(thread.updated_at).getTime() : Date.now(),
    pinned: !!thread.pinned,
    draft: false
  });

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
    const attachments = Array.isArray(metadata?.attachments) ? metadata?.attachments : [];
    for (const att of attachments) {
      const url = att?.url || att?.file_url || att?.media_url;
      if (!url) continue;
      const type = att?.type || guessMediaType(url);
      media.push({ url, type });
    }
    return media;
  };

  const extractUrls = (text?: string) => {
    if (!text) return [];
    const matches = text.match(/https?:\/\/[^\s]+/g) || [];
    return matches.map((url) => url.replace(/[),.]+$/, ''));
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
      <div className="mt-2 grid grid-cols-1 gap-2">
        {deduped.map((item, idx) => {
          if (item.type === 'image') {
            return (
              <img
                key={`${item.url}-${idx}`}
                src={item.url}
                alt="assistant response"
                className="rounded-2xl border border-white/10 max-h-72 object-cover"
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
                className="rounded-2xl border border-white/10 max-h-72 w-full"
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
              className="text-[11px] text-emerald-200 underline"
            >
              Open attachment
            </a>
          );
        })}
      </div>
    );
  };

  type AssistantBlock =
    | { type: 'text'; content: string }
    | { type: 'table'; headers: string[]; rows: string[][] };

  const isTableSeparator = (line: string) => /^\s*\|?(\s*:?-{3,}:?\s*\|)+\s*:?-{3,}:?\s*\|?\s*$/.test(line.trim());
  const isTableRow = (line: string) => line.includes('|') && !line.trim().startsWith('```');

  const splitTableCells = (line: string) =>
    line
      .trim()
      .replace(/^\|/, '')
      .replace(/\|$/, '')
      .split('|')
      .map((cell) => cell.trim());

  const parseAssistantBlocks = (content: string): AssistantBlock[] => {
    const lines = String(content || '').replace(/\r\n/g, '\n').split('\n');
    const blocks: AssistantBlock[] = [];
    const textBuffer: string[] = [];
    const flushText = () => {
      const text = textBuffer.join('\n').trim();
      if (text) blocks.push({ type: 'text', content: text });
      textBuffer.length = 0;
    };

    for (let i = 0; i < lines.length; i += 1) {
      const line = lines[i];
      const next = lines[i + 1] ?? '';
      if (isTableRow(line) && isTableSeparator(next)) {
        const headers = splitTableCells(line);
        const rows: string[][] = [];
        i += 2;
        for (; i < lines.length; i += 1) {
          const rowLine = lines[i];
          if (!isTableRow(rowLine) || isTableSeparator(rowLine)) {
            i -= 1;
            break;
          }
          rows.push(splitTableCells(rowLine));
        }
        flushText();
        if (headers.length > 0) {
          blocks.push({ type: 'table', headers, rows });
        }
        continue;
      }
      textBuffer.push(line);
    }
    flushText();
    return blocks;
  };

  const renderAssistantContent = (msg: AssistantMessage) => {
    const blocks = parseAssistantBlocks(msg.content || '');
    return (
      <div className="space-y-3 text-[12.5px] leading-[1.72] tracking-[0.01em] text-white/88">
        {blocks.map((block, idx) => {
          if (block.type === 'table') {
            return (
              <div key={`${msg.id || 'assistant'}-table-${idx}`} className="overflow-x-auto rounded-[1.25rem] border border-white/10 bg-white/5">
                <table className="min-w-full text-left text-[11px] leading-[1.55]">
                  <thead className="bg-white/8 text-white/75">
                    <tr>
                      {block.headers.map((header, headerIdx) => (
                        <th key={`${msg.id || 'assistant'}-th-${idx}-${headerIdx}`} className="px-3 py-2.5 font-black uppercase tracking-[0.14em] whitespace-nowrap">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {block.rows.map((row, rowIdx) => (
                      <tr key={`${msg.id || 'assistant'}-tr-${idx}-${rowIdx}`} className="border-t border-white/10">
                        {block.headers.map((_, cellIdx) => (
                          <td key={`${msg.id || 'assistant'}-td-${idx}-${rowIdx}-${cellIdx}`} className="px-3 py-2.5 text-white/88 align-top">
                            {row[cellIdx] || '—'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          }
          return (
            <div key={`${msg.id || 'assistant'}-text-${idx}`} className="text-[12.5px] leading-[1.72] tracking-[0.01em] text-white/88">
              <ReactMarkdown
                components={{
                  p: ({ children }) => <p className="mb-2.5 last:mb-0">{children}</p>,
                  a: ({ children, href }) => (
                    <a href={href || '#'} target="_blank" rel="noreferrer" className="text-emerald-200 underline decoration-emerald-200/35 underline-offset-2">
                      {children}
                    </a>
                  ),
                  ul: ({ children }) => <ul className="my-2 ml-4 list-disc space-y-1">{children}</ul>,
                  ol: ({ children }) => <ol className="my-2 ml-4 list-decimal space-y-1">{children}</ol>,
                  li: ({ children }) => <li className="pl-1">{children}</li>,
                  strong: ({ children }) => <strong className="font-extrabold text-white">{children}</strong>,
                  em: ({ children }) => <em className="italic text-white/90">{children}</em>,
                  blockquote: ({ children }) => (
                    <blockquote className="my-2 border-l-2 border-emerald-400/35 pl-4 text-white/72">{children}</blockquote>
                  ),
                  code: ({ children }) => (
                    <code className="rounded bg-black/30 px-1.5 py-0.5 text-[11px] font-medium text-emerald-100">{children}</code>
                  ),
                  pre: ({ children }) => (
                    <pre className="my-2 overflow-x-auto rounded-[1.25rem] border border-white/10 bg-black/30 p-3 text-[11px] leading-relaxed text-emerald-50">{children}</pre>
                  ),
                  h1: ({ children }) => <h1 className="mb-2.5 text-[15px] font-black tracking-tight text-white">{children}</h1>,
                  h2: ({ children }) => <h2 className="mb-2 text-[13px] font-black tracking-tight text-white">{children}</h2>,
                  h3: ({ children }) => <h3 className="mb-2 text-[12px] font-black tracking-tight text-white">{children}</h3>,
                }}
              >
                {block.content}
              </ReactMarkdown>
            </div>
          );
        })}
      </div>
    );
  };

  const renderAssistantLinks = (metadata?: Record<string, any>) => {
    const links = Array.isArray(metadata?.links) ? metadata.links : [];
    if (!links.length) return null;
    return (
      <div className="flex flex-wrap gap-2">
        {links.slice(0, 6).map((link: any, idx: number) => {
          const url = String(link?.url || link?.href || link?.link || '').trim();
          if (!url) return null;
          const label = String(link?.label || link?.title || 'Open link').trim();
          return (
            <a
              key={`${url}-${idx}`}
              href={url}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-2 rounded-full text-[10px] font-semibold bg-white/8 hover:bg-white/15 transition-colors text-white/88 underline underline-offset-2"
            >
              {label}
            </a>
          );
        })}
      </div>
    );
  };

  const isLocationLikeItem = (item: any) => {
    if (!item || typeof item !== 'object') return false;
    return Boolean(
      String(item?.address || item?.address_line || item?.location_address || item?.formatted_address || '').trim() ||
      String(item?.region || item?.region_name || item?.city || item?.county || item?.market_zone || '').trim() ||
      String(item?.lat || item?.latitude || item?.y || '').trim() ||
      String(item?.lng || item?.lon || item?.longitude || item?.x || '').trim() ||
      String(item?.map_url || item?.maps_url || item?.navigation_url || item?.directions_url || '').trim() ||
      String(item?.path_id || item?.route_id || item?.preferred_path_id || '').trim()
    );
  };

  const locationCardLabel = (item: any) => {
    const rawType = String(item?.type || item?.kind || item?.source || item?.category || item?.place_type || item?.point_type || item?.route_type || '').toLowerCase();
    if (rawType.includes('pickup')) return 'Pickup point';
    if (rawType.includes('delivery')) return 'Delivery point';
    if (rawType.includes('route') || rawType.includes('path')) return 'Route';
    if (rawType.includes('market') || rawType.includes('shop') || rawType.includes('store') || rawType.includes('place')) return 'Place';
    if (rawType.includes('map') || rawType.includes('pin') || rawType.includes('point')) return 'Map target';
    if (String(item?.path_id || item?.route_id || item?.preferred_path_id || '').trim()) return 'Route';
    if (String(item?.seller_id || item?.supplier_id || item?.merchant_id || '').trim()) return 'Shop';
    return 'Location';
  };

  const locationCardTone = (kindLabel: string) => {
    const kind = String(kindLabel || '').toLowerCase();
    if (kind.includes('pickup')) {
      return {
        badge: 'bg-amber-400/10 text-amber-100',
        pill: 'bg-amber-400/8 text-amber-100',
        icon: 'border-amber-300/20 bg-amber-400/10 text-amber-50',
        border: 'border-amber-300/20'
      };
    }
    if (kind.includes('delivery')) {
      return {
        badge: 'bg-sky-400/10 text-sky-100',
        pill: 'bg-sky-400/8 text-sky-100',
        icon: 'border-sky-300/20 bg-sky-400/10 text-sky-50',
        border: 'border-sky-300/20'
      };
    }
    if (kind.includes('route')) {
      return {
        badge: 'bg-violet-400/10 text-violet-100',
        pill: 'bg-violet-400/8 text-violet-100',
        icon: 'border-violet-300/20 bg-violet-400/10 text-violet-50',
        border: 'border-violet-300/20'
      };
    }
    if (kind.includes('shop')) {
      return {
        badge: 'bg-emerald-400/10 text-emerald-100',
        pill: 'bg-emerald-400/8 text-emerald-100',
        icon: 'border-emerald-300/20 bg-emerald-400/10 text-emerald-50',
        border: 'border-emerald-300/20'
      };
    }
    if (kind.includes('place')) {
      return {
        badge: 'bg-teal-400/10 text-teal-100',
        pill: 'bg-teal-400/8 text-teal-100',
        icon: 'border-teal-300/20 bg-teal-400/10 text-teal-50',
        border: 'border-teal-300/20'
      };
    }
    if (kind.includes('map target')) {
      return {
        badge: 'bg-slate-400/10 text-slate-100',
        pill: 'bg-slate-400/8 text-slate-100',
        icon: 'border-slate-300/20 bg-slate-400/10 text-slate-50',
        border: 'border-slate-300/20'
      };
    }
    return {
      badge: 'bg-white/8 text-white/75',
      pill: 'bg-white/4 text-white/65',
      icon: 'border-white/10 bg-white/5 text-white/80',
      border: 'border-white/10'
    };
  };

  const referenceCardLabel = (item: any) => {
    if (item?.product_id || item?.canonical_id) return 'Product';
    if (item?.seller_id || item?.supplier_id || item?.merchant_id) return 'Seller';
    if (item?.path_id || item?.route_id || item?.preferred_path_id) return 'Route';
    if (item?.address || item?.address_line || item?.location || item?.region || item?.lat || item?.lng) return 'Location';
    return 'Result';
  };

  const referenceCardTone = (label: string) => {
    const kind = String(label || '').toLowerCase();
    if (kind.includes('product')) {
      return {
        badge: 'bg-indigo-400/10 text-indigo-100',
        pill: 'bg-indigo-400/8 text-indigo-100',
        icon: 'border-indigo-300/20 bg-indigo-400/10 text-indigo-50',
        border: 'border-indigo-300/20'
      };
    }
    if (kind.includes('seller')) {
      return {
        badge: 'bg-emerald-400/10 text-emerald-100',
        pill: 'bg-emerald-400/8 text-emerald-100',
        icon: 'border-emerald-300/20 bg-emerald-400/10 text-emerald-50',
        border: 'border-emerald-300/20'
      };
    }
    if (kind.includes('route')) {
      return {
        badge: 'bg-violet-400/10 text-violet-100',
        pill: 'bg-violet-400/8 text-violet-100',
        icon: 'border-violet-300/20 bg-violet-400/10 text-violet-50',
        border: 'border-violet-300/20'
      };
    }
    if (kind.includes('location')) {
      return {
        badge: 'bg-teal-400/10 text-teal-100',
        pill: 'bg-teal-400/8 text-teal-100',
        icon: 'border-teal-300/20 bg-teal-400/10 text-teal-50',
        border: 'border-teal-300/20'
      };
    }
    return {
      badge: 'bg-white/8 text-white/75',
      pill: 'bg-white/4 text-white/65',
      icon: 'border-white/10 bg-white/5 text-white/80',
      border: 'border-white/10'
    };
  };

  const isReferenceRecord = (value: any): value is Record<string, any> =>
    !!value && typeof value === 'object' && !Array.isArray(value);

  const getSafeReferences = (metadata?: Record<string, any>): AssistantReference[] =>
    (Array.isArray(metadata?.references) ? metadata.references : []).filter(isReferenceRecord) as AssistantReference[];

  const getSafeReferenceItems = (reference?: AssistantReference | Record<string, any>) =>
    (Array.isArray(reference?.data?.items) ? reference.data.items : []).filter(isReferenceRecord);

  const renderAssistantLocationCards = (metadata?: Record<string, any>) => {
    const references = getSafeReferences(metadata);
    const rawItems: any[] = [];
    references.forEach((ref: any) => {
      const items = getSafeReferenceItems(ref);
      items.forEach((item: any) => {
        if (isLocationLikeItem(item)) rawItems.push(item);
      });
    });
    const metadataLocation = metadata?.location && typeof metadata.location === 'object' ? metadata.location : null;
    if (metadataLocation && isLocationLikeItem(metadataLocation)) {
      rawItems.unshift(metadataLocation);
    }
    const items = rawItems.filter((item, idx) => rawItems.findIndex((candidate) => JSON.stringify(candidate) === JSON.stringify(item)) === idx);
    if (!items.length) return null;

    return (
      <div className="rounded-2xl border border-white/10 bg-slate-950/45 p-3 shadow-[0_12px_30px_rgba(2,6,23,0.18)] backdrop-blur-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-white/85">Locations</p>
            <p className="mt-1 text-[10px] leading-relaxed text-white/55">Addresses, routes, and map targets you can open quickly.</p>
          </div>
          <div className="rounded-full bg-white/5 px-2 py-1 text-[9px] font-bold uppercase tracking-[0.18em] text-white/75">
            {items.length} place{items.length === 1 ? '' : 's'}
          </div>
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {items.slice(0, 4).map((item: any, idx: number) => {
            const name = String(item?.name || item?.title || item?.label || 'Location').trim();
            const kindLabel = locationCardLabel(item);
            const tone = locationCardTone(kindLabel);
            const address = String(item?.address || item?.address_line || item?.location_address || item?.formatted_address || '').trim();
            const region = String(item?.region || item?.region_name || item?.city || item?.county || item?.market_zone || '').trim();
            const lat = String(item?.lat || item?.latitude || item?.y || '').trim();
            const lng = String(item?.lng || item?.lon || item?.longitude || item?.x || '').trim();
            const distance = String(item?.distance || item?.distance_km || item?.distance_m || '').trim();
            const duration = String(item?.duration || item?.duration_min || item?.eta || item?.eta_min || '').trim();
            const mapUrl = buildMapUrl(item);
            const pathId = String(item?.path_id || item?.route_id || item?.preferred_path_id || '').trim();
            const sellerId = String(item?.seller_id || item?.supplier_id || item?.merchant_id || '').trim();
            const locationBits = [address, region, lat && lng ? `${lat}, ${lng}` : ''].filter(Boolean);
            const routeBits = [distance ? `Distance: ${distance}` : '', duration ? `ETA: ${duration}` : '', pathId ? `Route: ${pathId}` : ''].filter(Boolean);
            return (
              <div key={`${name}-${idx}`} className={`rounded-xl border bg-slate-950/30 p-3 backdrop-blur-sm ${tone.border}`}>
                <div className="flex items-start gap-3">
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border ${tone.icon}`}>
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-[11px] font-black leading-snug tracking-tight text-white/90">{name}</p>
                      <span className={`rounded-full px-2 py-1 text-[8px] font-black uppercase tracking-[0.22em] ${tone.badge}`}>
                        {kindLabel}
                      </span>
                    </div>
                    {routeBits.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        {routeBits.map((bit: string, bitIdx: number) => (
                          <span key={`${name}-${idx}-route-${bitIdx}`} className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[9px] font-bold ${tone.pill}`}>
                            {bit}
                          </span>
                        ))}
                      </div>
                    )}
                    {locationBits.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        {locationBits.map((bit: string, bitIdx: number) => (
                          <span key={`${name}-${idx}-bit-${bitIdx}`} className="inline-flex items-center gap-1 rounded-full bg-white/5 px-2 py-1 text-[9px] text-white/65">
                            <MapPin className="h-3 w-3 text-emerald-200" />
                            {bit}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="mt-2 flex flex-wrap gap-2">
                      {mapUrl && (
                        <button
                          type="button"
                          onClick={() => window.open(mapUrl, '_blank', 'noopener,noreferrer')}
                          className="inline-flex items-center gap-1 rounded-full bg-white/8 px-2.5 py-1 text-[9px] font-black text-white/85 shadow-[0_0_0_1px_rgba(255,255,255,0.08)]"
                        >
                          <ExternalLink className="h-3 w-3" />
                          Open in Maps
                        </button>
                      )}
                      {(pathId || sellerId) && (
                        <button
                          type="button"
                          onClick={() => {
                            if (pathId || sellerId) {
                              onStartNavigation({
                                path_id: pathId || undefined,
                                seller_id: sellerId || undefined,
                                address,
                                region,
                                lat,
                                lng,
                                map_url: mapUrl
                              });
                            } else if (mapUrl) {
                              window.open(mapUrl, '_blank', 'noopener,noreferrer');
                            }
                              }}
                          className="rounded-full bg-white/10 px-2.5 py-1 text-[9px] font-bold text-white/80"
                        >
                          Navigate
                        </button>
                      )}
                    </div>
                    {mapUrl && (
                          <p className="mt-2 text-[9px] leading-relaxed text-white/55">
                        Tap Open in Maps for turn-by-turn directions or use Navigate to continue inside Sconnect.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderAssistantReferenceCards = (metadata?: Record<string, any>) => {
    const references = getSafeReferences(metadata);
    if (!references.length) return null;
    return (
      <div className="grid gap-2 sm:grid-cols-2">
        {references.slice(0, 4).map((ref: any, idx: number) => {
          const items = getSafeReferenceItems(ref);
          if (!items.length) return null;
          const kindLabel = referenceCardLabel(items[0]);
          const tone = referenceCardTone(kindLabel);
          return (
            <div key={`${ref?.label || 'ref'}-${idx}`} className={`rounded-2xl border bg-slate-950/45 p-3 shadow-[0_12px_30px_rgba(2,6,23,0.18)] backdrop-blur-sm ${tone.border}`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-[11px] font-black uppercase tracking-[0.2em] text-white/85">{String(ref?.label || 'Results')}</p>
                    <span className={`rounded-full px-2 py-1 text-[8px] font-black uppercase tracking-[0.22em] ${tone.badge}`}>
                      {kindLabel}
                    </span>
                  </div>
                  {ref?.detail ? <p className="mt-1 text-[10px] leading-relaxed text-white/55">{String(ref.detail)}</p> : null}
                </div>
                <div className={`rounded-full px-2 py-1 text-[9px] font-bold uppercase tracking-[0.18em] ${tone.badge}`}>
                  {items.length} item{items.length === 1 ? '' : 's'}
                </div>
              </div>
              <div className="mt-3 space-y-2">
                {items.slice(0, 3).map((item: any, itemIdx: number) => {
                  const name = String(item?.name || item?.title || item?.label || 'Item').trim();
                  const detailBits = [
                    item?.price ? `KES ${item.price}` : '',
                    item?.currency ? String(item.currency) : '',
                    item?.rating ? `${item.rating}★` : '',
                    item?.distance ? String(item.distance) : '',
                    item?.location ? String(item.location) : '',
                    item?.address ? String(item.address) : '',
                    item?.region ? String(item.region) : '',
                    item?.lat && item?.lng ? `${item.lat},${item.lng}` : ''
                  ].filter(Boolean);
                  const url = String(item?.url || item?.link || item?.href || '').trim();
                  const image = String(item?.image_url || item?.thumbnail_url || '').trim();
                  const mapUrl = buildMapUrl(item);
                  const mapPreview = mapPayloadPreview(item);
                  return (
                    <div key={`${ref?.label || 'ref'}-${idx}-${itemIdx}`} className={`rounded-xl border bg-slate-950/30 p-3 backdrop-blur-sm ${tone.border}`}>
                      <div className="flex items-start gap-3">
                        {image ? (
                          <img
                            src={image}
                            alt={name}
                            className="h-14 w-14 shrink-0 rounded-xl object-cover border border-white/10"
                            loading="lazy"
                          />
                        ) : (
                          <div className={`h-14 w-14 shrink-0 rounded-xl border ${tone.icon}`} />
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-[11px] font-black leading-snug tracking-tight text-white/90">{name}</p>
                          {detailBits.length > 0 && (
                            <p className="mt-1 text-[10px] leading-relaxed text-white/55">{detailBits.join(' • ')}</p>
                          )}
                          {mapPreview?.length ? (
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {mapPreview.map((bit: string, bitIdx: number) => (
                                <span key={`${ref?.label || 'ref'}-${idx}-${itemIdx}-loc-${bitIdx}`} className="inline-flex items-center gap-1 rounded-full bg-white/5 px-2 py-1 text-[9px] text-white/65">
                                  <MapPin className="h-3 w-3 text-white/75" />
                                  {bit}
                                </span>
                              ))}
                            </div>
                          ) : null}
                          <div className="mt-2 flex flex-wrap gap-2">
                            {url && (
                              <a
                                href={url}
                                target="_blank"
                                rel="noreferrer"
                                className={`px-2.5 py-1 rounded-full text-[9px] font-bold underline underline-offset-2 ${tone.pill}`}
                              >
                                Open
                              </a>
                            )}
                            {item?.seller_id && (
                              <button
                                type="button"
                                onClick={() => onOpenSeller(String(item.seller_id))}
                                className={`px-2.5 py-1 rounded-full text-[9px] font-bold ${tone.pill}`}
                              >
                                Seller
                              </button>
                            )}
                            {item?.product_id && (
                              <button
                                type="button"
                                onClick={() => {
                                  const product = findProductById(String(item.product_id));
                                  if (product) {
                                    onOpenProduct(product);
                                  } else {
                                    onOpenSearch(name);
                                  }
                                }}
                                className={`px-2.5 py-1 rounded-full text-[9px] font-bold ${tone.pill}`}
                              >
                                Product
                              </button>
                            )}
                            {mapUrl && (
                              <button
                                type="button"
                                onClick={() => window.open(mapUrl, '_blank', 'noopener,noreferrer')}
                                className={`px-2.5 py-1 rounded-full text-[9px] font-bold inline-flex items-center gap-1 ${tone.badge}`}
                              >
                                <ExternalLink className="h-3 w-3" />
                                Map
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const uploadToPresignedUrl = async (file: File, presign: any) => {
    const uploadUrl = presign?.upload_url || presign?.url;
    if (!uploadUrl) throw new Error('Missing upload URL');
    const method = (presign?.method || (presign?.fields ? 'POST' : 'PUT')).toUpperCase();
    if (presign?.fields) {
      const form = new FormData();
      Object.entries(presign.fields).forEach(([key, value]) => form.append(key, value as string));
      form.append('file', file);
      const res = await fetch(uploadUrl, { method: 'POST', body: form });
      if (!res.ok) throw new Error(`Upload failed (${res.status})`);
      return presign.fields.key || presign.s3_key || presign.key || '';
    }
    const headers: Record<string, string> = { ...(presign?.headers || {}) };
    if (!headers['Content-Type'] && file.type) headers['Content-Type'] = file.type;
    const res = await fetch(uploadUrl, { method, headers, body: file });
    if (!res.ok) throw new Error(`Upload failed (${res.status})`);
    return presign?.s3_key || presign?.key || '';
  };

  const uploadAssistantMedia = async (file: File) => {
    const approvedFile = await requestMediaUploadPreview(file, {
      title: 'Preview assistant attachment',
      description: 'Check the image or video before sending it to the assistant.',
      confirmLabel: 'Attach media'
    });
    const presign = await requestUploadPresign({
      file_name: approvedFile.name,
      mime_type: approvedFile.type || 'application/octet-stream',
      content_length: approvedFile.size,
      context: 'assistant_media'
    });
    const mediaKey = await uploadToPresignedUrl(approvedFile, presign);
    const mediaUrl = presign?.file_url || presign?.url || '';
    if (!mediaUrl) {
      throw new Error('Missing media URL');
    }
    return {
      mediaKey,
      mediaUrl
    };
  };

  const openCamera = async () => {
    if (cameraBusy || showCamera) return;
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError('Camera not supported on this device.');
      return;
    }
    setCameraBusy(true);
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false
      });
      setCameraStream(stream);
      setShowCamera(true);
    } catch (err: any) {
      setCameraError(err?.message || 'Unable to access camera.');
    } finally {
      setCameraBusy(false);
    }
  };

  const closeCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
    }
    setCameraStream(null);
    setShowCamera(false);
    if (cameraVideoRef.current) {
      cameraVideoRef.current.srcObject = null;
    }
  };

  const handleCapturePhoto = async () => {
    if (!cameraVideoRef.current) return;
    if (cameraBusy) return;
    setCameraBusy(true);
    try {
      const video = cameraVideoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Camera unavailable.');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const blob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.9));
      if (!blob) throw new Error('Unable to capture photo.');
      const file = new File([blob], `assistant_photo_${Date.now()}.jpg`, { type: 'image/jpeg' });
      await handleAssistantMedia(file);
      closeCamera();
    } catch (err: any) {
      setCameraError(err?.message || 'Unable to capture photo.');
    } finally {
      setCameraBusy(false);
    }
  };

  const stopRecording = () => {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state === 'inactive') {
      if (recordingStreamRef.current) {
        recordingStreamRef.current.getTracks().forEach((track) => track.stop());
        recordingStreamRef.current = null;
      }
      if (recordingTimerRef.current) {
        window.clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
      setRecordingSeconds(0);
      setIsRecording(false);
      return;
    }
    try {
      recorder.stop();
      if (stopTimeoutRef.current) window.clearTimeout(stopTimeoutRef.current);
      stopTimeoutRef.current = window.setTimeout(() => {
        if (mediaRecorderRef.current?.state !== 'inactive') {
          try {
            mediaRecorderRef.current?.stop();
          } catch {}
        }
        if (recordingStreamRef.current) {
          recordingStreamRef.current.getTracks().forEach((track) => track.stop());
          recordingStreamRef.current = null;
        }
        if (recordingTimerRef.current) {
          window.clearInterval(recordingTimerRef.current);
          recordingTimerRef.current = null;
        }
        setRecordingSeconds(0);
        setIsRecording(false);
      }, 1500);
    } catch {
      setIsRecording(false);
    }
  };

  const startRecording = async () => {
    if (isRecording || transcribing) return;
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      onToast('Voice recording is not supported on this browser.');
      return;
    }
    setTranscribing(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      recordingStreamRef.current = stream;
      recordingChunksRef.current = [];
      setRecordingSeconds(0);
      if (recordingTimerRef.current) window.clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = window.setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
      recorder.ondataavailable = (evt) => {
        if (evt.data && evt.data.size > 0) recordingChunksRef.current.push(evt.data);
      };
      recorder.onstop = async () => {
        if (stopTimeoutRef.current) {
          window.clearTimeout(stopTimeoutRef.current);
          stopTimeoutRef.current = null;
        }
        stream.getTracks().forEach((track) => track.stop());
        recordingStreamRef.current = null;
        if (recordingTimerRef.current) {
          window.clearInterval(recordingTimerRef.current);
          recordingTimerRef.current = null;
        }
        setRecordingSeconds(0);
        const blob = new Blob(recordingChunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        if (!blob.size) {
          setIsRecording(false);
          onToast('No audio captured.');
          return;
        }
        setIsRecording(false);
        setTranscribing(true);
        try {
          const fileName = `assistant_audio_${Date.now()}.webm`;
          const file = new File([blob], fileName, { type: blob.type || 'audio/webm' });
          const presign = await requestUploadPresign({
            file_name: file.name,
            mime_type: file.type || 'audio/webm',
            content_length: file.size,
            context: 'assistant_audio'
          });
          const uploadUrl = presign?.upload_url || presign?.url;
          const s3Key = await uploadToPresignedUrl(file, presign);
          const publicUrl = presign?.file_url || (uploadUrl ? uploadUrl.split('?')[0] : '');
          const audioUrl = publicUrl || s3Key;
          if (!audioUrl) throw new Error('Audio URL unavailable.');
          const job = await transcribeAudio({ audio_url: audioUrl });
          const transcript = job?.result?.text || job?.result?.transcript;
          if (transcript && typeof transcript === 'string') {
            setInput(transcript);
            onToast('Voice captured. Review and send.');
          } else {
            onToast(job?.id ? `Transcription queued: ${job.id}` : 'Transcription queued.');
          }
        } catch (err: any) {
          onToast(err?.message || 'Transcription failed.');
        } finally {
          setTranscribing(false);
        }
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
    } catch (err: any) {
      onToast(err?.message || 'Microphone access failed.');
      setIsRecording(false);
    }
  };

  const saveModelPreferences = async () => {
    if (!allowModelOverride) {
      onToast('Model preferences are managed by your administrator.');
      return;
    }
    try {
      const payload = {
        preferred_provider: llmProvider.trim(),
        preferred_model: llmModel.trim()
      };
      const updated = await updateAssistantPreferences(payload);
      setEffectiveProvider(updated?.effective_provider || updated?.default_provider || '');
      setEffectiveModel(updated?.effective_model || updated?.default_model || '');
      setLlmProvider(updated?.preferred_provider || '');
      setLlmModel(updated?.preferred_model || '');
      onToast('AI model preferences updated.');
      setShowModelPicker(false);
    } catch (err: any) {
      onToast(err?.message || 'Unable to save AI model preferences.');
    }
  };

  const syncMessages = async (threadId: string) => {
    try {
      const items = await listMessages(threadId);
      setChats((prev) => prev.map((chat) => (
        chat.id === threadId
          ? { ...chat, messages: toAssistantMessages(items), updatedAt: Date.now(), draft: false }
          : chat
      )));
    } catch {}
  };

  const sendStreamMessage = async (threadId: string, content: string, metadata?: Record<string, any>) => {
    try {
      const enrichedMetadata = comparisonPrefs
        ? { ...(metadata || {}), comparison_preferences: comparisonPrefs }
        : metadata;
      await streamThreadMessage(threadId, { content, metadata: enrichedMetadata });
      await syncMessages(threadId);
      return true;
    } catch {
      return false;
    }
  };

  const sendUserMessage = async (threadId: string, content: string) => {
    try {
      await createMessage(threadId, { role: 'user', content });
      await syncMessages(threadId);
      return true;
    } catch {
      return false;
    }
  };

  const createAndActivateChat = async () => {
    const created = await createThread({ title: 'New chat' });
    const newChat = { ...mapThreadToChat(created, []), draft: true };
    setChats((prev) => [newChat, ...prev.filter((chat) => chat.id !== newChat.id)]);
    setActiveChatId(newChat.id);
    return newChat.id;
  };

  const ensureActiveChatId = async () => {
    if (activeChatId) return activeChatId;
    const existingId = visibleChats[0]?.id;
    if (existingId) {
      setActiveChatId(existingId);
      return existingId;
    }
    return createAndActivateChat();
  };

  const deleteChatLocally = (chatId: string) => {
    setChats((prev) => {
      const next = prev.filter((chat) => chat.id !== chatId);
      if (activeChatId === chatId) {
        const nextVisible = next
          .filter((chat) => !isGhostChat(chat))
          .sort((a, b) => {
            if (!!a.pinned !== !!b.pinned) return a.pinned ? -1 : 1;
            return b.updatedAt - a.updatedAt;
          })[0];
        setActiveChatId(nextVisible?.id || '');
      }
      return next;
    });
  };

  const openMessageFeedback = (messageId: string) => {
    setMessageFeedbackTarget({ messageId, threadId: activeChatId });
    setMessageFeedbackRating('3');
    setMessageFeedbackOutcome('needs_correction');
    setMessageFeedbackComment('');
    setMessageFeedbackCorrection('');
    setMessageFeedbackCorrectIntent('support');
    setMessageFeedbackCorrectProfile('support');
    setMessageFeedbackUseInPlanner(true);
  };

  const submitMessageFeedback = async (quick = false, messageIdOverride?: string) => {
    const targetMessageId = messageIdOverride || messageFeedbackTarget?.messageId;
    const targetThreadId = messageFeedbackTarget?.threadId || activeChatId;
    if (!targetMessageId || !targetThreadId) return;
    setMessageFeedbackSaving(true);
    try {
      let correction: Record<string, any> | undefined;
      const rawCorrection = messageFeedbackCorrection.trim();
      if (!quick && rawCorrection) {
        correction = JSON.parse(rawCorrection);
      }
      await createMessageFeedback(targetThreadId, targetMessageId, {
        rating: quick ? 5 : Math.max(1, Math.min(5, Number(messageFeedbackRating) || 3)),
        outcome: quick ? 'helpful' : messageFeedbackOutcome.trim() || undefined,
        comment: quick ? 'Helpful' : messageFeedbackComment.trim() || undefined,
        user_response_text: quick ? undefined : messageFeedbackComment.trim() || undefined,
        correction: quick ? undefined : correction,
        correct_intent: quick ? undefined : messageFeedbackCorrectIntent.trim() || undefined,
        correct_agent_profile: quick ? undefined : messageFeedbackCorrectProfile.trim() || undefined,
        use_in_planner: quick ? true : messageFeedbackUseInPlanner,
      });
      setMessageFeedbackTarget(null);
      setMessageFeedbackRating('3');
      setMessageFeedbackOutcome('needs_correction');
      setMessageFeedbackComment('');
      setMessageFeedbackCorrection('');
      setMessageFeedbackUseInPlanner(true);
      onToast(quick ? 'Marked as helpful.' : 'Correction sent to the assistant.');
    } catch (err: any) {
      onToast(err?.message || 'Unable to save message feedback.');
    } finally {
      setMessageFeedbackSaving(false);
    }
  };

  const handleAssistantMedia = React.useCallback(async (file: File) => {
    if (mediaUploading) return;
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');
    if (!isImage && !isVideo) {
      setMediaError('Unsupported media type.');
      return;
    }
    setMediaUploading(true);
    setMediaError(null);
    try {
      const threadId = await ensureActiveChatId();
      const uploaded = await uploadAssistantMedia(file);
      const query = input.trim();
      let prompt = query || 'Analyze this media and suggest the best next actions.';
      let metadata: Record<string, any> = {
        media_url: uploaded.mediaUrl,
        media_key: uploaded.mediaKey,
        mime_type: file.type,
        media_type: isVideo ? 'video' : 'image'
      };
      if (isImage) {
        const [ocrRes, visionRes] = await Promise.allSettled([
          runOCR({ image_url: uploaded.mediaUrl }),
          runVisionSearch({ image_url: uploaded.mediaUrl, query: query || undefined })
        ]);
        const ocrText =
          ocrRes.status === 'fulfilled'
            ? ocrRes.value?.result?.text || ocrRes.value?.text || ''
            : '';
        const visionQuery =
          visionRes.status === 'fulfilled'
            ? visionRes.value?.result?.query || visionRes.value?.query || ''
            : '';
        const hints: string[] = [];
        if (visionQuery) hints.push(`Image cues: ${visionQuery}`);
        if (ocrText) hints.push(`Text found: ${ocrText}`);
        if (!query) {
          prompt = 'Analyze this image for product discovery, suppliers, and next actions.';
        }
        if (hints.length) {
          prompt = `${prompt}\n\n${hints.join('\n')}`;
        }
        metadata = { ...metadata, ocr_text: ocrText, vision_query: visionQuery };
      } else if (uploaded.mediaUrl) {
        prompt = `${prompt}\n\nVideo URL: ${uploaded.mediaUrl}`;
      }
      setInput('');
      setIsStreaming(true);
      const apiOk = await sendStreamMessage(threadId, prompt, metadata);
      if (!apiOk) {
        setMediaError('Assistant is unavailable right now. Please try again.');
      }
      setIsStreaming(false);
    } catch (err: any) {
      setMediaError(err?.message || 'Media upload failed.');
      setIsStreaming(false);
    } finally {
      setMediaUploading(false);
    }
  }, [activeChatId, input, mediaUploading, sendStreamMessage, uploadAssistantMedia, visibleChats]);
  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const [threads, suggestions] = await Promise.all([
          listThreads(),
          listSuggestions()
        ]);
        if (!alive) return;
        const mapped = await Promise.all(
          (threads || []).map(async (thread: any) => {
            const items = await listMessages(thread.id).catch(() => []);
            return mapThreadToChat(thread, toAssistantMessages(items));
          })
        );
        const filtered = mapped.filter((chat) => !isGhostChat(chat));
        setChats(filtered);
        setActiveChatId(filtered[0]?.id || '');
        if (suggestions && suggestions.length) {
          const filteredSuggestions = suggestions.filter((s: any) => {
            const text = String([s?.label, s?.title, s?.name, s?.payload, s?.value].filter(Boolean).join(' ')).toLowerCase();
            return !/(scan\s*qr|\bqr\b)/i.test(text);
          });
          setSuggestionChips(filteredSuggestions.map((s: any) => ({
            label: s.label || s.title || s.name || 'Suggestion',
            value: s.payload || s.value || s.label || ''
          })));
        }
      } catch {}
    };
    load();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!isSellerAccount) return;
    let alive = true;
    const loadSellerSignals = async () => {
      try {
        const marketingDefaults = await getOpsConfig('marketing.kpi_defaults').catch(() => null);
        const configuredRange = String((marketingDefaults as any)?.value?.range || '').trim();
        const [
          kpis,
          funnel,
          inventory,
          buyers,
          market,
          anomalyList,
          lowStockList,
          kpiStats,
          hotspotList,
          campaignList,
          cashflowResp,
          loanResp,
          disputeResp,
          reviews,
          rfqs
        ] = await Promise.all([
          getSellerKpiSummary().catch(() => null),
          getSellerFunnel().catch(() => null),
          getSellerInventoryInsight().catch(() => null),
          getSellerBuyerInsight().catch(() => null),
          getSellerMarketBenchmarks().catch(() => null),
          listSellerAnomalies().catch(() => []),
          listSellerLowStock().catch(() => []),
          getMarketingKPIs(configuredRange || '30d').catch(() => null),
          listHotspots().catch(() => []),
          listSellerCampaigns().catch(() => []),
          getCashflow().catch(() => null),
          getLoanEligibility().catch(() => null),
          getDisputeSummary().catch(() => null),
          listProfileReviews().catch(() => []),
          listRFQs().catch(() => [])
        ]);
        if (!alive) return;
        setSellerKpis(kpis);
        setSellerFunnel(funnel);
        setInventoryInsight(inventory);
        setBuyerInsight(buyers);
        setMarketBenchmarks(market);
        setAnomalies(anomalyList as Anomaly[]);
        setLowStock(lowStockList as SellerLowStock[]);
        setMarketingKpis(kpiStats);
        setHotspots(hotspotList as Hotspot[]);
        setCampaigns((campaignList as Array<{ id?: string; status?: string }>) || []);
        setCashflow(cashflowResp);
        setLoanEligibility(loanResp);
        setDisputeSummary(disputeResp as SummaryStat);
        setProfileReviews(reviews as any[]);
        setRfqThreads(rfqs as RFQThread[]);
      } catch {
        // Ignore signal load errors.
      }
    };
    loadSellerSignals();
    return () => {
      alive = false;
    };
  }, [isSellerAccount]);

  useEffect(() => {
    if (isSellerAccount !== false) return;
    let alive = true;
    const loadBuyerSignals = async () => {
      try {
        const intelligence = await getIntelligence({ limit: 12 }).catch(() => null);
        const [
          recent,
          saved,
          alerts,
          watch,
          insights,
          summary,
          cartRecommendations,
          cartAlertItems,
          compare,
          rewards,
          streaks,
          notifications,
          favorites
        ] = await Promise.all([
          listRecentSearches().catch(() => []),
          listSavedSearches().catch(() => []),
          listSearchAlerts().catch(() => []),
          listWatchlist().catch(() => []),
          getCartInsights().catch(() => null),
          getCartSummary().catch(() => null),
          getCartRecommendations().catch(() => []),
          getCartAlerts().catch(() => []),
          getCompareList().catch(() => null),
          getRewardsBalance().catch(() => null),
          getRewardStreaks().catch(() => []),
          listNotifications({ limit: 20 }).catch(() => ({ items: [], unread_count: 0 })),
          listProfileFavorites().catch(() => [])
        ]);
        if (!alive) return;
        setRecentSearches(recent as any[]);
        setSavedSearches(saved as any[]);
        setSearchAlerts(alerts as any[]);
        setWatchlist(watch as any[]);
        setTrendingSearches((intelligence?.trending || []) as string[]);
        setSearchRecs((intelligence?.recommendations || []) as any[]);
        setCartInsights(insights as any);
        setCartSummary(summary as any);
        setCartRecs(cartRecommendations as any[]);
        setCartAlerts(cartAlertItems as any[]);
        setCompareList(compare as any);
        setRewardsBalance(rewards as RewardsBalance);
        setRewardStreaks(streaks as RewardsStreak[]);
        setNotificationSummary(notifications as NotificationListResponse);
        setFavoriteShops(favorites as any[]);
      } catch {
        // Ignore buyer signal load errors.
      }
    };
    loadBuyerSignals();
    return () => {
      alive = false;
    };
  }, [isSellerAccount]);

  useEffect(() => {
    if (!isSellerAccount) return;
    let alive = true;
    const loadRfqResponses = async () => {
      if (rfqThreads.length === 0) return;
      try {
        const responses = await Promise.all(
          rfqThreads.map((thread) => thread.id ? listRFQResponses(thread.id).catch(() => []) : Promise.resolve([]))
        );
        if (!alive) return;
        setRfqResponses(responses.flat() as RFQResponse[]);
      } catch {
        // Ignore RFQ response errors.
      }
    };
    loadRfqResponses();
    return () => {
      alive = false;
    };
  }, [isSellerAccount, rfqThreads]);

  useEffect(() => {
    if (!showNewMemberIntro) return;
    try {
      updateAssistantPreferences({ intro_seen: true }).catch(() => {});
    } catch {}
  }, [showNewMemberIntro]);

  useEffect(() => {
    const handleOnboardingComplete = () => {
      try {
        const completed = localStorage.getItem('soko:onboarding_completed') === 'true';
        if (completed) {
          getAssistantPreferences()
            .then((resp) => {
              if (!resp?.intro_seen) setShowNewMemberIntro(true);
            })
            .catch(() => {});
        }
      } catch {}
    };
    window.addEventListener('soko:onboarding-complete', handleOnboardingComplete);
    return () => {
      window.removeEventListener('soko:onboarding-complete', handleOnboardingComplete);
    };
  }, []);

  useEffect(() => {
    let alive = true;
    const checkSeller = async () => {
      try {
        await getSellerProfile();
        if (alive) setIsSellerAccount(true);
      } catch {
        if (alive) setIsSellerAccount(false);
      }
    };
    checkSeller();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!activeChatId) return;
    syncMessages(activeChatId);
  }, [activeChatId]);

useEffect(() => {
    if (!activeChatId && visibleChats[0]) {
      setActiveChatId(visibleChats[0].id);
    }
  }, [activeChatId, visibleChats]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chats, isStreaming]);

  useEffect(() => {
    const handlePaste = (event: ClipboardEvent) => {
      if (!event.clipboardData) return;
      const items = Array.from(event.clipboardData.items || []);
      const fileItem = items.find((item) => item.kind === 'file' && (item.type.startsWith('image/') || item.type.startsWith('video/')));
      if (!fileItem) return;
      const file = fileItem.getAsFile();
      if (!file) return;
      event.preventDefault();
      handleAssistantMedia(file);
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [handleAssistantMedia]);

  useEffect(() => {
    updateAssistantPreferences({ sidebar_open: isSidebarOpen }).catch(() => {});
  }, [isSidebarOpen]);

  const matchedProduct = (text: string) => {
    const lower = text.toLowerCase();
    return products.find(p => p.name.toLowerCase().includes(lower)) ||
      products.find(p => lower.split(' ').some(t => p.name.toLowerCase().includes(t)));
  };

  const matchedSeller = async (text: string) => {
    const query = text.trim();
    if (!query) return null;
    try {
      const shops = await searchShops({ query });
      const lower = query.toLowerCase();
      return shops.find(s => (s.name || '').toLowerCase().includes(lower)) || shops[0] || null;
    } catch {
      return null;
    }
  };

  const handleCommand = async (text: string) => {
    const parts = text.trim().split(' ');
    const cmd = parts[0].toLowerCase();
    const arg = parts.slice(1).join(' ').trim();
    if (cmd === '/search') {
      onOpenSearch(arg);
      return `Searching for: ${arg || 'all results'}`;
    }
    if (cmd === '/compare') {
      const product = matchedProduct(arg);
      if (product) {
        onAddToComparison(product);
        return `Added ${product.name} to comparison.`;
      }
      return 'I could not find that product to compare.';
    }
    if (cmd === '/add') {
      const product = matchedProduct(arg);
      if (product) {
        onAddToBag(product);
        return `Added ${product.name} to bag.`;
      }
      return 'I could not find that product to add to bag.';
    }
    if (cmd === '/open') {
      const product = matchedProduct(arg);
      const seller = product ? null : await matchedSeller(arg);
      if (product) {
        onOpenProduct(product);
        return `Opening ${product.name}.`;
      }
      if (seller) {
        const sellerId = seller.id || seller.seller_id || '';
        if (sellerId) {
          onOpenSeller(sellerId);
          return `Opening ${seller.name || 'seller'}.`;
        }
      }
      return 'I could not find that product or seller.';
    }
    if (cmd === '/rfq') {
      onOpenRFQ();
      return 'Starting an RFQ. Open Seller Studio → Suppliers to proceed.';
    }
    if (cmd === '/rewards') {
      onOpenRewards();
      return 'Opening rewards.';
    }
    if (cmd === '/profile') {
      onOpenProfile();
      return accountLabel ? `Opening ${accountLabel}.` : 'Opening your profile.';
    }
    if (cmd === '/bag') {
      onOpenBag();
      return 'Opening your bag.';
    }
    if (cmd === '/subscribe') {
      onOpenSubscriptions();
      return 'Opening subscriptions.';
    }
    if (cmd === '/partners') {
      onOpenPartnerships();
      return 'Opening partnerships.';
    }
    if (cmd === '/onboarding') {
      onOpenOnboarding();
      return 'Opening onboarding.';
    }
    return '';
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    const text = input.trim();
    const threadId = await ensureActiveChatId();
    setChats(prev => prev.map(chat => {
      if (chat.id !== threadId) return chat;
      const nextTitle = chat.title === 'New chat' ? text.slice(0, 28) : chat.title;
      return {
        ...chat,
        title: nextTitle,
        messages: [...chat.messages, { role: 'user', content: text }],
        updatedAt: Date.now(),
        draft: false
      };
    }));
    setInput('');

    if (text.startsWith('/')) {
      const response = await handleCommand(text);
      setChats(prev => prev.map(chat => {
        if (chat.id !== threadId) return chat;
        return {
          ...chat,
          messages: [...chat.messages, { role: 'assistant', content: response }],
          updatedAt: Date.now(),
          draft: false
        };
      }));
      await sendUserMessage(threadId, text);
      return;
    }

    setIsStreaming(true);
    const apiOk = await sendStreamMessage(threadId, text);
    if (!apiOk) {
      onToast('Assistant is unavailable right now. Please try again.');
    }
    setIsStreaming(false);
  };

  return (
    <div
      className="h-[100dvh] min-h-[100dvh] bg-slate-950 text-white flex overflow-hidden relative"
      onDragOver={(event) => {
        event.preventDefault();
        setIsDragActive(true);
      }}
      onDragLeave={() => setIsDragActive(false)}
      onDrop={(event) => {
        event.preventDefault();
        setIsDragActive(false);
        const file = event.dataTransfer?.files?.[0];
        if (file) handleAssistantMedia(file);
      }}
    >
      {isDragActive && (
        <div className="absolute inset-0 z-[90] flex items-center justify-center bg-emerald-500/10 border-2 border-dashed border-emerald-400">
          <div className="px-4 py-2 bg-black/80 rounded-full text-xs font-bold text-emerald-200">
            Drop an image or video to analyze
          </div>
        </div>
      )}
      {/* Sidebar (desktop) */}
      <div className={`bg-black/60 border-r border-white/10 shrink-0 transition-all duration-200 ${isSidebarOpen ? 'w-72 p-4' : 'w-16 p-2'} hidden lg:flex lg:flex-col h-full min-h-0`}>
        <div className={`flex items-center ${isSidebarOpen ? 'justify-between' : 'justify-center'} mb-4`}>
          {isSidebarOpen && (
            <div className="flex items-center gap-2">
              <img
                src="/logo-header.jpg"
                alt="Sconnect"
                className="w-8 h-8 rounded-xl object-cover border border-white/10"
              />
              <div>
                <p className="text-sm font-black tracking-tight">Conversations</p>
                <p className="text-[10px] text-white/50">{visibleChats.length} chats</p>
              </div>
            </div>
          )}
          {!isSidebarOpen && (
            <img
              src="/logo-header.jpg"
              alt="Sconnect"
              className="w-9 h-9 rounded-xl object-cover border border-white/10"
            />
          )}
          <button
            onClick={() => setIsSidebarOpen(prev => !prev)}
            className="p-2 bg-white/10 rounded-xl text-white text-lg font-black leading-none"
            title={isSidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
            aria-label={isSidebarOpen ? 'Collapse navigation' : 'Expand navigation'}
          >
            &gt;
          </button>
        </div>

        {isSidebarOpen && (
          <div className="flex-1 min-h-0 overflow-y-auto pr-1">
            {isVisitor && (
              <div className="mb-3 rounded-2xl border border-white/10 bg-white/5 p-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-300">Guest access</p>
                <p className="mt-1 text-[11px] leading-relaxed text-white/75">
                  {authPromptMessage || 'Browse the platform normally. Sign in only when you want to post, save, buy, or manage seller tools.'}
                </p>
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={onOpenLogin}
                    className="flex-1 rounded-xl bg-emerald-500 px-3 py-2 text-[10px] font-black text-white"
                  >
                    Log in
                  </button>
                  <button
                    onClick={onOpenRegister}
                    className="flex-1 rounded-xl bg-white/10 px-3 py-2 text-[10px] font-black text-white"
                  >
                    Sign up
                  </button>
                </div>
              </div>
            )}
            <div className="space-y-2">
              {visibleChats
                .slice(0, 12)
                .map((chat) => (
                  <div
                    key={chat.id}
                    className={`w-full text-left p-2 rounded-xl text-[10px] font-semibold tracking-[0.06em] flex items-center justify-between ${activeChatId === chat.id ? 'bg-white/15 text-white' : 'bg-white/5 text-white/72'}`}
                  >
                    <button
                      onClick={() => setActiveChatId(chat.id)}
                      className="flex-1 text-left tracking-tight"
                    >
                      {chat.title || 'New chat'}
                    </button>
                    <div className="flex items-center gap-1 ml-2">
                      <button
                        onClick={async () => {
                          const nextPinned = !chat.pinned;
                          setChats(prev => prev.map(c => c.id === chat.id ? { ...c, pinned: nextPinned } : c));
                          try {
                            await updateThread(chat.id, { pinned: nextPinned });
                          } catch {}
                        }}
                        className="px-2 py-1 bg-white/10 rounded-lg text-[9px] font-semibold tracking-[0.08em]"
                        title="Pin chat"
                      >
                        {chat.pinned ? 'Unpin' : 'Pin'}
                      </button>
                      <button
                        onClick={async () => {
                          deleteChatLocally(chat.id);
                          try {
                            await deleteThread(chat.id);
                          } catch {}
                        }}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-white/10 rounded-lg text-[9px] font-semibold tracking-[0.08em]"
                        title="Delete chat"
                      >
                        <Trash2 className="w-3 h-3" />
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
            </div>

            <div className="mt-4 space-y-2">
                <button
                  onClick={async () => {
                    try {
                      await createAndActivateChat();
                    } catch {
                      onToast('Unable to start assistant chat.');
                    }
                  }}
                className="w-full px-3 py-2 bg-white/10 rounded-xl text-[10px] font-semibold tracking-[0.08em] flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" /> New chat
              </button>
              <button
                onClick={() => onOpenOnboarding()}
                className="w-full px-3 py-2 bg-white/10 rounded-xl text-[10px] font-semibold tracking-[0.08em] flex items-center justify-center gap-2"
              >
                <Trophy className="w-4 h-4" /> Onboarding
              </button>
            </div>

          </div>
        )}
      </div>
{/* Sidebar (mobile drawer) */}
      {isSidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setIsSidebarOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 w-72 bg-slate-950 border-r border-white/10 p-4 flex flex-col h-[100dvh] min-h-0">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <img
                  src="/logo-header.jpg"
                  alt="Sconnect"
                  className="w-8 h-8 rounded-xl object-cover border border-white/10"
                />
                <div>
                  <p className="text-sm font-black tracking-tight">Conversations</p>
                  <p className="text-[10px] text-white/50">{visibleChats.length} chats</p>
                </div>
              </div>
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="p-2 bg-white/10 rounded-xl text-white text-lg font-black leading-none"
                aria-label="Close navigation"
              >
                &gt;
              </button>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto pr-1">
            {isVisitor && (
              <div className="mb-3 rounded-2xl border border-white/10 bg-white/5 p-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-300">Guest access</p>
                <p className="mt-1 text-[11px] leading-relaxed text-white/75">
                  {authPromptMessage || 'Browse the platform normally. Sign in only when you want to post, save, buy, or manage seller tools.'}
                </p>
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={onOpenLogin}
                      className="flex-1 rounded-xl bg-emerald-500 px-3 py-2 text-[10px] font-black text-white"
                    >
                      Log in
                    </button>
                    <button
                      onClick={onOpenRegister}
                      className="flex-1 rounded-xl bg-white/10 px-3 py-2 text-[10px] font-black text-white"
                    >
                      Sign up
                    </button>
                  </div>
                </div>
              )}
              <div className="space-y-2">
                {visibleChats
                  .slice(0, 12)
                  .map((chat) => (
                    <div
                      key={chat.id}
                    className={`w-full text-left p-2 rounded-xl text-[10px] font-semibold tracking-[0.06em] flex items-center justify-between ${activeChatId === chat.id ? 'bg-white/15 text-white' : 'bg-white/5 text-white/72'}`}
                    >
                      <button
                        onClick={() => {
                          setActiveChatId(chat.id);
                          setIsSidebarOpen(false);
                        }}
                        className="flex-1 text-left tracking-tight"
                      >
                        {chat.title || 'New chat'}
                      </button>
                      <div className="flex items-center gap-1 ml-2">
                        <button
                          onClick={async () => {
                            const nextPinned = !chat.pinned;
                            setChats(prev => prev.map(c => c.id === chat.id ? { ...c, pinned: nextPinned } : c));
                            try {
                              await updateThread(chat.id, { pinned: nextPinned });
                            } catch {}
                          }}
                          className="px-2 py-1 bg-white/10 rounded-lg text-[9px] font-semibold tracking-[0.08em]"
                          title="Pin chat"
                        >
                          {chat.pinned ? 'Unpin' : 'Pin'}
                        </button>
                        <button
                          onClick={async () => {
                            deleteChatLocally(chat.id);
                            try {
                              await deleteThread(chat.id);
                            } catch {}
                          }}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-white/10 rounded-lg text-[9px] font-semibold tracking-[0.08em]"
                          title="Delete chat"
                        >
                          <Trash2 className="w-3 h-3" />
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
              </div>

              <div className="mt-4 space-y-2">
                <button
                  onClick={async () => {
                    try {
                      await createAndActivateChat();
                      setIsSidebarOpen(false);
                    } catch {
                      onToast('Unable to start assistant chat.');
                    }
                  }}
                  className="w-full px-3 py-2 bg-white/10 rounded-xl text-[10px] font-semibold tracking-[0.08em] flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4" /> New chat
                </button>
                <button
                  onClick={() => {
                    onOpenOnboarding();
                    setIsSidebarOpen(false);
                  }}
                  className="w-full px-3 py-2 bg-white/10 rounded-xl text-[10px] font-semibold tracking-[0.08em] flex items-center justify-center gap-2"
                >
                  <Trophy className="w-4 h-4" /> Onboarding
                </button>
              </div>

            </div>
          </div>
        </div>
      )}
      <div className="flex-1 flex flex-col relative">

        {/* Header */}
        <div className="fixed top-0 left-0 right-0 px-4 pt-4 pb-3 sm:px-5 sm:pt-5 sm:pb-4 border-b border-white/10 flex items-center justify-between z-40 bg-slate-950/95 backdrop-blur">
          <div className="w-full max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden h-11 w-11 rounded-2xl bg-white/10 flex items-center justify-center"
              aria-label="Open navigation"
            >
              <span className="text-lg font-black leading-none text-white">&gt;</span>
            </button>
            <img
              src="/logo-header.jpg"
              alt="Sconnect"
              className="w-10 h-10 rounded-2xl object-cover border border-white/10"
            />
            <div>
              <p className="text-sm font-black">Sconnect</p>
              <p className="text-[10px] text-white/60">Kenya's duka demand engine</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowModelPicker(true)}
              className="h-11 w-11 rounded-full bg-white/10 flex items-center justify-center"
              aria-label="Choose AI model"
            >
              <SlidersHorizontal className="w-5 h-5" />
            </button>
            <button
              onClick={onOpenProfile}
              className="h-11 w-11 rounded-full bg-white/10 flex items-center justify-center"
              aria-label="Open profile"
            >
              <User className="w-5 h-5" />
            </button>
          </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-h-0 px-4 pt-24 pb-28 sm:px-5 sm:pt-24 sm:pb-40 flex flex-col gap-4 sm:gap-5 max-w-5xl mx-auto w-full">
          {showIntroCards && (
            <>
              {showNewMemberIntro && (
                <>
              <section className="bg-white/5 rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-white/10">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-white/60 font-bold">Quick Start</p>
                    <p className="text-[11px] text-white/70 mt-2">Open onboarding to set your intent and personalize the assistant.</p>
                  </div>
                      <button
                        onClick={() => onOpenOnboarding()}
                        className="h-11 w-11 rounded-full bg-white/10 flex items-center justify-center"
                        aria-label="Open onboarding"
                      >
                        <Sparkles className="w-5 h-5 text-amber-300" />
                  </button>
                </div>
              </section>
            </>
          )}

          {insightCard && (
            <section className="bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-emerald-500/20">
              <div className="flex items-center gap-2 text-emerald-200 text-[10px] font-bold uppercase tracking-[0.2em]">
                <TrendingUp className="w-3 h-3" /> Insight
              </div>
              <div className="mt-3 flex items-end gap-3">
                <p className="text-2xl sm:text-3xl font-black">{insightCard.metric}</p>
                <div className="text-[11px] text-emerald-100/80">
                  {insightCard.detail}
                </div>
              </div>
            </section>
          )}

              {ownerCards.length > 0 && (
                <section className="bg-white/5 rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-white/10">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-white/60 font-bold">Owner Command Cards</p>
                    <p className="text-[11px] text-white/70">Daily signals to move inventory and cash.</p>
                  </div>
                </div>
                <div className="max-h-[55vh] overflow-y-auto pr-1 space-y-3">
                  {ownerCards.map((card) => (
                    <div key={card.title} className="p-3 rounded-2xl bg-white/10 border border-white/10">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-[11px] font-black text-white">{card.title}</p>
                          <p className="text-[10px] text-white/60 mt-1">{card.detail}</p>
                        </div>
                        <div className="text-xs font-black text-amber-300">{card.metric}</div>
                      </div>
                      <div className="mt-3">
                        <button
                          onClick={card.onClick}
                          className="px-3 py-2 bg-white/10 rounded-full text-[10px] font-bold hover:bg-white/20 transition-colors"
                        >
                          {card.action}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
              )}

              {buyerCards.length > 0 && (
                <section className="bg-white/5 rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-white/10">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.2em] text-white/60 font-bold">Buyer Signals</p>
                      <p className="text-[11px] text-white/70">Personalized shopping insights.</p>
                    </div>
                  </div>
                  <div className="max-h-[55vh] overflow-y-auto pr-1 space-y-3">
                    {buyerCards.map((card) => (
                      <div key={card.title} className="p-3 rounded-2xl bg-white/10 border border-white/10">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-[11px] font-black text-white">{card.title}</p>
                            <p className="text-[10px] text-white/60 mt-1">{card.detail}</p>
                          </div>
                          <div className="text-xs font-black text-amber-300">{card.metric}</div>
                        </div>
                        <div className="mt-3">
                          <button
                            onClick={card.onClick}
                            className="px-3 py-2 bg-white/10 rounded-full text-[10px] font-bold hover:bg-white/20 transition-colors"
                          >
                            {card.action}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </>
          )}

          {/* Quick Actions + More moved to sidebar navigation */}

          <div className="flex-1 min-h-0 overflow-y-auto space-y-3">
            {isStreaming && (
              <div className="flex items-center gap-2 text-[10px] text-white/60">
                <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="uppercase tracking-[0.3em]">Agents working</span>
              </div>
            )}
            {activeMessages.map((msg, i) => {
              const isUser = msg.role === 'user';
              const messageReferences = getSafeReferences(msg.metadata);
              return (
                <div
                  key={msg.id || `msg_${i}`}
                  className={`flex items-start gap-2.5 ${isUser ? 'flex-row-reverse ml-auto text-right' : ''}`}
                >
                  <div className={`h-8 w-8 rounded-2xl flex items-center justify-center text-[9px] font-black ${isUser ? 'bg-indigo-500/70 text-white' : 'bg-white/8 text-white/75'}`}>
                    {isUser ? 'You' : 'AI'}
                  </div>
                  <div className="max-w-[82%] space-y-1.5">
                    <div className={`text-[10px] font-semibold tracking-[0.12em] uppercase ${isUser ? 'text-white/55' : 'text-white/65'}`}>
                      {isUser ? 'You' : 'Soko AI'}
                    </div>
                    {msg.role === 'assistant' && Array.isArray(msg.metadata?.agent_status) && msg.metadata.agent_status.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {msg.metadata.agent_status.map((status: string) => {
                          const key = String(status || '').toLowerCase();
                          const label = agentStatusLabels[key] || status;
                          return (
                            <span
                              key={`${msg.id || i}-${status}`}
                              className="px-2 py-1 rounded-full text-[9px] font-semibold tracking-[0.12em] bg-white/10 text-white/70"
                            >
                              {label}
                            </span>
                          );
                        })}
                      </div>
                    )}
                    <div className={`px-4 py-3 rounded-[1.25rem] ${isUser ? 'bg-indigo-500/70 text-white' : 'border border-white/10 bg-slate-950/35 text-white/90 backdrop-blur-sm'}`}>
                      {isUser ? (
                        <div className="text-[12.5px] leading-[1.72] tracking-[0.01em] whitespace-pre-wrap">{msg.content}</div>
                      ) : (
                        renderAssistantContent(msg)
                      )}
                    </div>
                    {msg.role === 'assistant' && renderMedia(msg.metadata, msg.content)}
                    {msg.role === 'assistant' && renderAssistantLinks(msg.metadata)}
                    {msg.role === 'assistant' && renderAssistantLocationCards(msg.metadata)}
                    {msg.role === 'assistant' && renderAssistantReferenceCards(msg.metadata)}
                    {msg.role === 'assistant' && messageReferences.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex flex-wrap gap-2">
                          {messageReferences.map((ref, idx) => (
                            <span
                              key={`${msg.id || i}-ref-${idx}`}
                            className="px-2 py-1 rounded-full text-[9px] font-semibold tracking-[0.12em] bg-emerald-500/10 text-emerald-200"
                            >
                              {ref.label}{ref.detail ? ` · ${ref.detail}` : ''}
                            </span>
                          ))}
                        </div>
                        <div className="space-y-1">
                          {messageReferences.map((ref, idx) => {
                            const items = getSafeReferenceItems(ref);
                            if (!items.length) return null;
                            return (
                              <div key={`${msg.id || i}-ref-detail-${idx}`} className="text-[10px] leading-relaxed text-white/70 space-y-1">
                                {items.slice(0, 3).map((item: any, itemIdx: number) => (
                                  <div key={`${msg.id || i}-ref-item-${idx}-${itemIdx}`} className="flex flex-wrap gap-2">
                                    {Object.entries(item).map(([key, value]) => {
                                      if (value == null || value === '') return null;
                                      if (key === 'url' || key === 'link' || key === 'href') {
                                        return (
                                          <a key={key} href={String(value)} target="_blank" rel="noreferrer" className="px-2 py-1 rounded-full bg-white/5 underline underline-offset-2 text-emerald-200">
                                            {String(value)}
                                          </a>
                                        );
                                      }
                                      return (
                                        <span key={key} className="px-2 py-1 rounded-full bg-white/5">
                                          {key}: {String(value ?? '')}
                                        </span>
                                      );
                                    })}
                                  </div>
                                ))}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    {msg.actions && msg.actions.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {msg.actions.map((action, idx) => (
                          <button
                            key={idx}
                            onClick={action.onClick}
                            className="px-3 py-2 bg-white/10 rounded-full text-[10px] font-semibold tracking-[0.08em] hover:bg-white/20 transition-colors"
                          >
                            {action.label}
                          </button>
                        ))}
                      </div>
                    )}
                    {msg.role === 'assistant' && msg.id && (
                      <div className="space-y-2">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => void submitMessageFeedback(true, msg.id!)}
                            disabled={messageFeedbackSaving && (messageFeedbackTarget?.messageId === msg.id || messageFeedbackTarget == null)}
                            className="px-3 py-2 bg-emerald-500/10 rounded-full text-[10px] font-semibold tracking-[0.08em] hover:bg-emerald-500/20 transition-colors"
                          >
                            Helpful
                          </button>
                          <button
                            type="button"
                            onClick={() => openMessageFeedback(msg.id!)}
                            className="px-3 py-2 bg-white/10 rounded-full text-[10px] font-semibold tracking-[0.08em] hover:bg-white/20 transition-colors"
                          >
                            Correct this
                          </button>
                        </div>
                        {messageFeedbackTarget?.messageId === msg.id && (
                          <div className="space-y-3 rounded-2xl border border-white/10 bg-slate-950/30 p-3 backdrop-blur-sm">
                            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/60">Correction feedback</div>
                            <div className="grid gap-3 sm:grid-cols-2">
                              <label className="grid gap-1 text-[11px]">
                                <span>Rating</span>
                                <select className="input" value={messageFeedbackRating} onChange={(e) => setMessageFeedbackRating(e.target.value)}>
                                  <option value="5">5 - excellent</option>
                                  <option value="4">4 - good</option>
                                  <option value="3">3 - partial</option>
                                  <option value="2">2 - weak</option>
                                  <option value="1">1 - wrong</option>
                                </select>
                              </label>
                              <label className="grid gap-1 text-[11px]">
                                <span>Outcome</span>
                                <input className="input" value={messageFeedbackOutcome} onChange={(e) => setMessageFeedbackOutcome(e.target.value)} placeholder="correct, partial, wrong" />
                              </label>
                            </div>
                            <div className="grid gap-3 sm:grid-cols-2">
                              <label className="grid gap-1 text-[11px]">
                                <span>Correct intent</span>
                                <select className="input" value={messageFeedbackCorrectIntent} onChange={(e) => setMessageFeedbackCorrectIntent(e.target.value)}>
                                  {feedbackIntents.map((intent) => (
                                    <option key={intent} value={intent}>{intent}</option>
                                  ))}
                                </select>
                              </label>
                              <label className="grid gap-1 text-[11px]">
                                <span>Correct profile</span>
                                <select className="input" value={messageFeedbackCorrectProfile} onChange={(e) => setMessageFeedbackCorrectProfile(e.target.value)}>
                                  {feedbackProfiles.map((profile) => (
                                    <option key={profile} value={profile}>{profile}</option>
                                  ))}
                                </select>
                              </label>
                            </div>
                            <label className="flex items-center gap-2 text-[11px]">
                              <input
                                type="checkbox"
                                checked={messageFeedbackUseInPlanner}
                                onChange={(e) => setMessageFeedbackUseInPlanner(e.target.checked)}
                              />
                              <span>Use this correction in the next planner prompt</span>
                            </label>
                            <label className="grid gap-1 text-[11px]">
                              <span>Comment</span>
                              <textarea
                                className="input"
                                rows={3}
                                value={messageFeedbackComment}
                                onChange={(e) => setMessageFeedbackComment(e.target.value)}
                                placeholder="What should the assistant have answered instead?"
                              />
                            </label>
                            <label className="grid gap-1 text-[11px]">
                              <span>Correction JSON</span>
                              <textarea
                                className="input"
                                rows={4}
                                value={messageFeedbackCorrection}
                                onChange={(e) => setMessageFeedbackCorrection(e.target.value)}
                                placeholder='{"correct_intent":"support","correct_agent_profile":"support"}'
                              />
                            </label>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => void submitMessageFeedback(false)}
                                disabled={messageFeedbackSaving}
                                className="px-3 py-2 bg-white/10 rounded-full text-[10px] font-bold hover:bg-white/20 transition-colors"
                              >
                                Save correction
                              </button>
                              <button
                                type="button"
                                onClick={() => setMessageFeedbackTarget(null)}
                                className="px-3 py-2 bg-transparent rounded-full text-[10px] font-bold border border-white/10 hover:bg-white/10 transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            <div ref={endRef} />
          </div>
        </div>

        {/* Sticky Action Bar */}
        <div className="fixed bottom-0 left-0 right-0 w-full bg-slate-950/95 backdrop-blur border-t border-white/10 px-4 pt-3 pb-4 sm:pb-5 z-40">
        <div className="w-full max-w-5xl mx-auto">
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-3">
              {quickActions.map((action) => (
                <button
                  key={action.label}
                  onClick={action.onClick}
                  className={`shrink-0 px-3 py-2 rounded-full text-[10px] font-semibold tracking-[0.08em] whitespace-nowrap flex items-center gap-2 border transition-colors ${actionToneClasses[action.tone] || actionToneClasses.slate}`}
                >
                  <action.icon className="w-3 h-3" /> {action.label}
                </button>
              ))}
            </div>
            {sortedSuggestionChips.length > 0 && (
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                {sortedSuggestionChips.map(chip => (
                  <button
                    key={chip.label}
                    onClick={() => {
                      bumpActionUsage(chip.label);
                      setInput(chip.value);
                    }}
                    className="px-3 py-2 bg-white/8 rounded-full text-[10px] font-semibold tracking-[0.08em] whitespace-nowrap text-white/80 hover:bg-white/15 transition-colors"
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            )}

            {(mediaUploading || mediaError) && (
              <div className="mb-3 text-[10px] font-bold text-amber-200">
                {mediaUploading ? 'Uploading media...' : mediaError}
              </div>
            )}
            {transcribing && (
              <div className="mb-3 text-[10px] font-bold text-emerald-200">
                Transcribing voice…
              </div>
            )}
            {isRecording && (
              <div className="mb-3 flex items-center justify-between bg-emerald-500/10 text-emerald-100 px-3 py-2 rounded-xl text-[10px] font-black">
                <span>Recording… {String(Math.floor(recordingSeconds / 60)).padStart(2, '0')}:{String(recordingSeconds % 60).padStart(2, '0')}</span>
                <button
                  onClick={stopRecording}
                  className="px-3 py-1 rounded-full bg-emerald-500 text-white"
                >
                  Stop
                </button>
              </div>
            )}

            <div className="flex items-center gap-2">
              <button
                onClick={isRecording ? stopRecording : startRecording}
                className={`h-11 w-11 rounded-full flex items-center justify-center ${isRecording ? 'bg-emerald-500 text-white' : 'bg-white/10'} focus:outline-none focus:ring-2 focus:ring-emerald-400/40`}
                aria-label="Voice message"
              >
                <Mic className="w-5 h-5" />
              </button>
              <input
                className="flex-1 min-w-0 h-11 bg-slate-900/55 border border-white/10 rounded-full px-4 text-[13px] leading-none text-white placeholder:text-white/35 caret-emerald-300 outline-none focus:ring-2 focus:ring-emerald-400/40 backdrop-blur-sm"
                placeholder="Ask Sconnect to search, compare, or buy..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              />
              <input
                ref={mediaInputRef}
                type="file"
                accept="image/*,video/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  e.target.value = '';
                  if (file) handleAssistantMedia(file);
                }}
              />
              <button
                onClick={() => mediaInputRef.current?.click()}
                className="h-11 w-11 rounded-full flex items-center justify-center bg-white/10 focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
                aria-label="Add media (60s max)"
              >
                <Plus className="w-5 h-5" />
              </button>
              <button
                onClick={openCamera}
                className="h-11 w-11 rounded-full flex items-center justify-center bg-white/10 focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
                aria-label="Open camera"
              >
                <Camera className="w-5 h-5" />
              </button>
              <button
                onClick={handleSend}
                className="h-11 w-11 rounded-full bg-emerald-500 flex items-center justify-center text-white focus:outline-none focus:ring-2 focus:ring-emerald-200"
                aria-label="Send"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <CameraCaptureOverlay
        open={showCamera}
        videoRef={cameraVideoRef}
        title="Capture For Assistant"
        subtitle="Show the product, shelf, receipt, or problem clearly so the assistant can respond with better context."
        hint="Fill the frame with the item you want help with and hold steady for one clean shot."
        statusLabel="Assistant vision ready"
        captureLabel="Use This Photo"
        closeLabel="Back"
        busy={cameraBusy}
        error={cameraError}
        onClose={closeCamera}
        onCapture={handleCapturePhoto}
      />
      {showModelPicker && (
        <div className="fixed inset-0 z-[80] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-950 text-white border border-white/10 rounded-3xl overflow-hidden">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <div>
                <p className="text-sm font-black">AI Model Preferences</p>
                <p className="text-[10px] text-white/60">Choose from admin-approved providers and models.</p>
              </div>
              <button
                onClick={() => setShowModelPicker(false)}
                className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center"
                aria-label="Close model picker"
              >
                ✕
              </button>
            </div>
            <div className="p-4 space-y-3">
              {modelConfigLoading ? (
                <div className="text-[11px] text-white/60">Loading model options...</div>
              ) : (
                <>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setProviderMenuOpen((prev) => !prev)}
                      disabled={!allowModelOverride}
                      className="w-full h-11 rounded-2xl bg-white/10 px-3 text-[12px] text-left text-white disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
                    >
                      {llmProvider
                        ? (modelProviders.find((p) => p.id === llmProvider)?.label || llmProvider)
                        : 'Default provider (admin)'}
                    </button>
                    {providerMenuOpen && (
                      <div className="absolute z-10 mt-2 w-full rounded-2xl border border-white/10 bg-slate-950 p-2 space-y-2">
                        <input
                          className="w-full h-9 rounded-xl bg-white/10 px-3 text-[11px] text-white placeholder:text-white/40 caret-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
                          placeholder="Search providers..."
                          value={providerSearch}
                          onChange={(e) => setProviderSearch(e.target.value)}
                        />
                        <button
                          type="button"
                          className="w-full text-left text-[11px] px-3 py-2 rounded-xl hover:bg-white/5"
                          onClick={() => {
                            setLlmProvider('');
                            setLlmModel('');
                            setProviderMenuOpen(false);
                            setModelMenuOpen(false);
                            setProviderSearch('');
                          }}
                        >
                          Default provider (admin)
                        </button>
                        {filteredProviders.map((provider) => (
                          <button
                            key={provider.id}
                            type="button"
                            className="w-full text-left text-[11px] px-3 py-2 rounded-xl hover:bg-white/5"
                            onClick={() => {
                              setLlmProvider(provider.id);
                              const models = provider.models || [];
                              if (!models.some((m) => m.id === llmModel)) {
                                setLlmModel(models[0]?.id || '');
                              }
                              setProviderMenuOpen(false);
                              setModelMenuOpen(false);
                              setProviderSearch('');
                            }}
                          >
                            {provider.label || provider.id}
                          </button>
                        ))}
                        {filteredProviders.length === 0 && (
                          <div className="text-[10px] text-white/60 px-3 py-2">No providers found.</div>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setModelMenuOpen((prev) => !prev)}
                      disabled={!allowModelOverride || !llmProvider}
                      className="w-full h-11 rounded-2xl bg-white/10 px-3 text-[12px] text-left text-white disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
                    >
                      {llmModel
                        ? (providerModels.find((m) => m.id === llmModel)?.label || llmModel)
                        : 'Default model (admin)'}
                    </button>
                    {modelMenuOpen && (
                      <div className="absolute z-10 mt-2 w-full rounded-2xl border border-white/10 bg-slate-950 p-2 space-y-2">
                        <input
                          className="w-full h-9 rounded-xl bg-white/10 px-3 text-[11px] text-white placeholder:text-white/40 caret-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
                          placeholder="Search models..."
                          value={modelSearch}
                          onChange={(e) => setModelSearch(e.target.value)}
                        />
                        <button
                          type="button"
                          className="w-full text-left text-[11px] px-3 py-2 rounded-xl hover:bg-white/5"
                          onClick={() => {
                            setLlmModel('');
                            setModelMenuOpen(false);
                            setModelSearch('');
                          }}
                        >
                          Default model (admin)
                        </button>
                        {filteredModels.map((model) => (
                          <button
                            key={model.id}
                            type="button"
                            className="w-full text-left text-[11px] px-3 py-2 rounded-xl hover:bg-white/5"
                            onClick={() => {
                              setLlmModel(model.id);
                              setModelMenuOpen(false);
                              setModelSearch('');
                            }}
                          >
                            {model.label || model.id}
                          </button>
                        ))}
                        {filteredModels.length === 0 && (
                          <div className="text-[10px] text-white/60 px-3 py-2">No models found.</div>
                        )}
                      </div>
                    )}
                  </div>
                </>
              )}
              {modelConfigError && (
                <div className="text-[10px] text-red-200">{modelConfigError}</div>
              )}
              <div className="text-[10px] text-white/60">
                Effective: {effectiveProvider || defaultProvider || '—'} / {effectiveModel || defaultModel || '—'}
              </div>
              {!allowModelOverride && (
                <div className="text-[10px] text-white/60">Managed by your administrator.</div>
              )}
              <div className="flex items-center gap-2">
                <button
                  onClick={saveModelPreferences}
                  className="px-4 py-2 bg-emerald-500 rounded-xl text-[10px] font-black text-white disabled:opacity-50"
                  disabled={!allowModelOverride}
                >
                  Save
                </button>
                <button
                  onClick={() => setShowModelPicker(false)}
                  className="px-4 py-2 bg-white/10 rounded-xl text-[10px] font-black"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
