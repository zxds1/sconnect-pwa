import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Sparkles, Send, Search, ShoppingBag, ArrowRightLeft, User, Trophy, MessageCircle, Plug, Mic, Plus, BadgeCheck, TrendingUp, Camera } from 'lucide-react';
import { Product } from '../types';
import {
  createMessage,
  createThread,
  deleteThread,
  listMessages,
  listSuggestions,
  listThreads,
  runOCR,
  runVisionSearch,
  streamThreadMessage,
  updateThread
} from '../lib/assistantApi';
import { requestUploadPresign } from '../lib/uploadsApi';
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
import {
  listRecentSearches,
  listSavedSearches,
  listSearchAlerts,
  listWatchlist,
  searchTrending,
  searchRecommendations
} from '../lib/searchApi';
import { searchShops } from '../lib/shopDirectoryApi';
import { getCartInsights, getCartSummary, getCartRecommendations, getCartAlerts } from '../lib/cartApi';
import { getCompareList } from '../lib/compareApi';
import { getComparisonPreferences } from '../lib/settingsApi';
import { getRewardsBalance, getRewardStreaks, type RewardsBalance, type RewardsStreak } from '../lib/rewardsApi';
import { listNotifications, type NotificationListResponse } from '../lib/notificationsApi';

type AssistantAction = {
  label: string;
  onClick: () => void;
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
};

type SummaryStat = Record<string, any>;

interface AssistantProps {
  products: Product[];
  onOpenSearch: (query: string) => void;
  onOpenSearchAction: (query: string, action: 'voice' | 'photo' | 'video' | 'hybrid') => void;
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
  onOpenWhatsApp: () => void;
  onOpenFeed: () => void;
}

export const Assistant: React.FC<AssistantProps> = ({
  products,
  onOpenSearch,
  onOpenSearchAction,
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
  onOpenWhatsApp,
  onOpenFeed,
  onToast
}) => {
  const [chats, setChats] = useState<AssistantChat[]>([]);
  const [activeChatId, setActiveChatId] = useState('');
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [mediaUploading, setMediaUploading] = useState(false);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const mediaInputRef = useRef<HTMLInputElement | null>(null);
  const [isSellerAccount, setIsSellerAccount] = useState<boolean | null>(null);
  const [usageTick, setUsageTick] = useState(0);
  const [showModelPicker, setShowModelPicker] = useState(false);
  const [llmModel, setLlmModel] = useState(() => {
    try {
      return localStorage.getItem('soko:llm_model') || '';
    } catch {
      return '';
    }
  });
  const [llmProvider, setLlmProvider] = useState(() => {
    try {
      return localStorage.getItem('soko:llm_provider') || '';
    } catch {
      return '';
    }
  });
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    try {
      const raw = localStorage.getItem('soko:assistant_sidebar');
      if (raw) return raw === 'open';
    } catch {}
    return true;
  });
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
  const endRef = useRef<HTMLDivElement | null>(null);

  const activeChat = chats.find(c => c.id === activeChatId) || chats[0];
  const activeMessages = activeChat?.messages || [];
  const showIntroCards = !activeMessages.some(m => m.role === 'user');
  const [showNewMemberIntro, setShowNewMemberIntro] = useState(() => {
    try {
      const completed = localStorage.getItem('soko:onboarding_completed') === 'true';
      const seen = localStorage.getItem('soko:assistant_new_member_intro_seen') === 'true';
      return completed && !seen;
    } catch {
      return false;
    }
  });

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
  const roas = marketingKpis?.roas;
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
  const quickActions = [
    { label: 'Feed', icon: Sparkles, onClick: onOpenFeed },
    { label: 'Search', icon: Search, onClick: () => setInput('/search ') },
    { label: 'Compare', icon: ArrowRightLeft, onClick: () => setInput('/compare ') },
    { label: 'Photo', icon: Camera, onClick: () => onOpenSearchAction('photo search', 'photo') },
    { label: 'Voice', icon: Mic, onClick: () => onOpenSearchAction('voice search', 'voice') },
    { label: 'Bag', icon: ShoppingBag, onClick: () => onOpenBag() },
    ...(canAccessSeller ? [{ label: 'RFQ', icon: Plug, onClick: () => onOpenRFQ() }] : []),
    { label: 'Rewards', icon: Trophy, onClick: () => onOpenRewards() }
  ];
  const moreActions = [
    { label: 'Subscriptions', icon: BadgeCheck, onClick: () => onOpenSubscriptions() },
    { label: 'Partnerships', icon: Plug, onClick: () => onOpenPartnerships() },
    { label: 'WhatsApp', icon: MessageCircle, onClick: () => onOpenWhatsApp() },
    ...(canAccessSeller ? [{ label: 'Seller Studio', icon: Sparkles, onClick: () => onOpenSellerStudio() }] : []),
    { label: 'Scan QR', icon: Camera, onClick: () => onOpenQrScan() }
  ];
  const [suggestionChips, setSuggestionChips] = useState<Array<{ label: string; value: string }>>([]);

  const mapThreadToChat = (thread: any): AssistantChat => ({
    id: thread.id,
    title: thread.title || 'New chat',
    messages: [],
    updatedAt: thread.updated_at ? new Date(thread.updated_at).getTime() : Date.now(),
    pinned: !!thread.pinned
  });

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
    if (typeof window === 'undefined') return 0;
    try {
      const raw = localStorage.getItem('soko:assistant_action_usage');
      if (!raw) return 0;
      const parsed = JSON.parse(raw) as Record<string, number>;
      return parsed[label] ?? 0;
    } catch {
      return 0;
    }
  };

  const bumpActionUsage = (label: string) => {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem('soko:assistant_action_usage');
      const parsed = raw ? (JSON.parse(raw) as Record<string, number>) : {};
      parsed[label] = (parsed[label] ?? 0) + 1;
      localStorage.setItem('soko:assistant_action_usage', JSON.stringify(parsed));
      setUsageTick((prev) => prev + 1);
    } catch {}
  };

  const sortActionsByUsage = (items: AssistantAction[]) =>
    [...items].sort((a, b) => {
      const usageDiff = getActionUsage(b.label) - getActionUsage(a.label);
      if (usageDiff !== 0) return usageDiff;
      return a.label.localeCompare(b.label);
    });

  const sortedSuggestionChips = useMemo(() => {
    return [...suggestionChips].sort((a, b) => {
      const usageDiff = getActionUsage(b.label) - getActionUsage(a.label);
      if (usageDiff !== 0) return usageDiff;
      return a.label.localeCompare(b.label);
    });
  }, [suggestionChips, usageTick]);

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
            return {
              label: label || (type === 'start_navigation' ? 'Start Navigation' : 'Show Paths'),
              onClick: () => {
                if (type === 'start_navigation') {
                  onStartNavigation(payload);
                  return;
                }
                if (sellerId) {
                  onOpenSeller(sellerId);
                  return;
                }
                onToast('Open the seller to view directions.');
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
          case 'open_whatsapp':
            return {
              label: label || 'Open WhatsApp',
              onClick: () => onOpenWhatsApp()
            };
          case 'open_feed':
            return {
              label: label || 'Open Feed',
              onClick: () => onOpenFeed()
            };
          case 'open_qr_scan':
            return {
              label: label || 'Scan QR',
              onClick: () => onOpenQrScan()
            };
          case 'open_profile':
            return {
              label: label || 'Open Profile',
              onClick: () => onOpenProfile()
            };
          default:
            return {
              label,
              onClick: () => onToast('Action not available yet.')
            };
        }
      })
      .filter(Boolean) as AssistantAction[];
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
    const presign = await requestUploadPresign({
      file_name: file.name,
      mime_type: file.type || 'application/octet-stream',
      content_length: file.size,
      context: 'assistant_media'
    });
    const mediaKey = await uploadToPresignedUrl(file, presign);
    const mediaUrl = presign?.file_url || presign?.url || '';
    if (!mediaUrl) {
      throw new Error('Missing media URL');
    }
    return {
      mediaKey,
      mediaUrl
    };
  };

  const saveModelPreferences = () => {
    try {
      if (llmModel) {
        localStorage.setItem('soko:llm_model', llmModel.trim());
      } else {
        localStorage.removeItem('soko:llm_model');
      }
      if (llmProvider) {
        localStorage.setItem('soko:llm_provider', llmProvider.trim());
      } else {
        localStorage.removeItem('soko:llm_provider');
      }
      onToast('AI model preferences updated.');
      setShowModelPicker(false);
    } catch {
      onToast('Unable to save AI model preferences.');
    }
  };

  const syncMessages = async (threadId: string) => {
    try {
      const items = await listMessages(threadId);
      setChats((prev) => prev.map((chat) => (
        chat.id === threadId
          ? { ...chat, messages: toAssistantMessages(items), updatedAt: Date.now() }
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

  const handleAssistantMedia = React.useCallback(async (file: File) => {
    if (!activeChatId) return;
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
      const apiOk = await sendStreamMessage(activeChatId, prompt, metadata);
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
  }, [activeChatId, input, mediaUploading, sendStreamMessage, uploadAssistantMedia]);
  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const [threads, suggestions] = await Promise.all([
          listThreads(),
          listSuggestions()
        ]);
        if (!alive) return;
        const mapped = (threads || []).map(mapThreadToChat);
        try {
          const created = await createThread({ title: 'New chat' });
          const newChat = mapThreadToChat(created);
          setChats([newChat, ...mapped]);
          setActiveChatId(newChat.id);
        } catch {
          if (mapped.length) {
            setChats(mapped);
            setActiveChatId(mapped[0]?.id || '');
          } else {
            onToast('Unable to start assistant chat.');
          }
        }
        if (suggestions && suggestions.length) {
          setSuggestionChips(suggestions.map((s: any) => ({
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
          getMarketingKPIs('30d').catch(() => null),
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
        const [
          recent,
          saved,
          alerts,
          watch,
          trending,
          recs,
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
          searchTrending().catch(() => []),
          searchRecommendations().catch(() => []),
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
        setTrendingSearches(trending as string[]);
        setSearchRecs(recs as any[]);
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
      localStorage.setItem('soko:assistant_new_member_intro_seen', 'true');
    } catch {}
  }, [showNewMemberIntro]);

  useEffect(() => {
    const handleOnboardingComplete = () => {
      try {
        const completed = localStorage.getItem('soko:onboarding_completed') === 'true';
        const seen = localStorage.getItem('soko:assistant_new_member_intro_seen') === 'true';
        if (completed && !seen) setShowNewMemberIntro(true);
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
    if (!activeChatId && chats[0]) {
      setActiveChatId(chats[0].id);
    }
  }, [activeChatId, chats]);

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
    try {
      localStorage.setItem('soko:assistant_sidebar', isSidebarOpen ? 'open' : 'closed');
    } catch {}
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
    if (cmd === '/voice') {
      onOpenSearchAction(arg || 'voice search', 'voice');
      return `Starting voice search: ${arg || 'open mic'}`;
    }
    if (cmd === '/photo') {
      onOpenSearchAction(arg || 'photo search', 'photo');
      return `Starting photo search: ${arg || 'open camera'}`;
    }
    if (cmd === '/video') {
      onOpenSearchAction(arg || 'video search', 'video');
      return `Starting video search: ${arg || 'open video'}`;
    }
    if (cmd === '/hybrid') {
      onOpenSearchAction(arg || 'hybrid search', 'hybrid');
      return `Starting hybrid search: ${arg || 'photo + text'}`;
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
      return 'Opening your profile.';
    }
    if (cmd === '/bag') {
      onOpenBag();
      return 'Opening your bag.';
    }
    if (cmd === '/scan') {
      onOpenQrScan();
      return 'Opening QR scanner.';
    }
    if (cmd === '/subscribe') {
      onOpenSubscriptions();
      return 'Opening subscriptions.';
    }
    if (cmd === '/partners') {
      onOpenPartnerships();
      return 'Opening partnerships.';
    }
    if (cmd === '/whatsapp') {
      onOpenWhatsApp();
      return 'Opening WhatsApp experience flows.';
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
    setChats(prev => prev.map(chat => {
      if (chat.id !== activeChatId) return chat;
      const nextTitle = chat.title === 'New chat' ? text.slice(0, 28) : chat.title;
      return {
        ...chat,
        title: nextTitle,
        messages: [...chat.messages, { role: 'user', content: text }],
        updatedAt: Date.now()
      };
    }));
    setInput('');

    if (text.startsWith('/')) {
      const response = await handleCommand(text);
      setChats(prev => prev.map(chat => {
        if (chat.id !== activeChatId) return chat;
        return {
          ...chat,
          messages: [...chat.messages, { role: 'assistant', content: response }],
          updatedAt: Date.now()
        };
      }));
      await sendUserMessage(activeChatId, text);
      return;
    }

    setIsStreaming(true);
    const apiOk = await sendStreamMessage(activeChatId, text);
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
                <p className="text-sm font-black">Conversations</p>
                <p className="text-[10px] text-white/50">{chats.length} chats</p>
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
            className="p-2 bg-white/10 rounded-xl"
            title={isSidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            <ArrowRightLeft className="w-4 h-4 text-white" />
          </button>
        </div>

        {isSidebarOpen && (
          <div className="flex-1 min-h-0 overflow-y-auto pr-1">
            <div className="space-y-2">
              {chats
                .sort((a, b) => {
                  if (!!a.pinned !== !!b.pinned) return a.pinned ? -1 : 1;
                  return b.updatedAt - a.updatedAt;
                })
                .slice(0, 12)
                .map((chat) => (
                  <div
                    key={chat.id}
                    className={`w-full text-left p-2 rounded-xl text-[10px] font-bold flex items-center justify-between ${activeChatId === chat.id ? 'bg-white/15 text-white' : 'bg-white/5 text-white/70'}`}
                  >
                    <button
                      onClick={() => setActiveChatId(chat.id)}
                      className="flex-1 text-left"
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
                        className="px-2 py-1 bg-white/10 rounded-lg text-[9px] font-black"
                        title="Pin chat"
                      >
                        {chat.pinned ? 'Unpin' : 'Pin'}
                      </button>
                      <button
                        onClick={async () => {
                          setChats(prev => prev.filter(c => c.id !== chat.id));
                          if (activeChatId === chat.id) {
                            const next = chats.find(c => c.id !== chat.id);
                            setActiveChatId(next?.id || '');
                          }
                          try {
                            await deleteThread(chat.id);
                          } catch {}
                        }}
                        className="px-2 py-1 bg-white/10 rounded-lg text-[9px] font-black"
                        title="Delete chat"
                      >
                        Del
                      </button>
                    </div>
                  </div>
                ))}
            </div>

            <div className="mt-4 space-y-2">
              <button
                onClick={async () => {
                  try {
                    const created = await createThread({ title: 'New chat' });
                    const newChat = mapThreadToChat(created);
                    setChats(prev => [newChat, ...prev]);
                    setActiveChatId(newChat.id);
                  } catch {
                    onToast('Unable to start assistant chat.');
                  }
                }}
                className="w-full px-3 py-2 bg-white/10 rounded-xl text-[10px] font-black flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" /> New chat
              </button>
              <button
                onClick={() => onOpenOnboarding()}
                className="w-full px-3 py-2 bg-white/10 rounded-xl text-[10px] font-black flex items-center justify-center gap-2"
              >
                <Trophy className="w-4 h-4" /> Onboarding
              </button>
            </div>

            <div className="mt-6">
              <p className="text-[10px] font-black uppercase tracking-widest text-white/50 mb-3">Quick Actions</p>
              <div className="space-y-2 text-[10px] font-bold">
                {quickActions.map(action => (
                  <button
                    key={action.label}
                    onClick={action.onClick}
                    className="w-full bg-white/5 rounded-xl py-2 flex items-center justify-center gap-2"
                  >
                    <action.icon className="w-3 h-3" /> {action.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6">
              <p className="text-[10px] font-black uppercase tracking-widest text-white/50 mb-3">More</p>
              <div className="space-y-2 text-[10px] font-bold">
                {moreActions.map(action => (
                  <button
                    key={action.label}
                    onClick={action.onClick}
                    className="w-full bg-white/5 rounded-xl py-2 flex items-center justify-center gap-2"
                  >
                    <action.icon className="w-3 h-3" /> {action.label}
                  </button>
                ))}
              </div>
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
                  <p className="text-sm font-black">Conversations</p>
                  <p className="text-[10px] text-white/50">{chats.length} chats</p>
                </div>
              </div>
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="p-2 bg-white/10 rounded-xl"
                aria-label="Close navigation"
              >
                <ArrowRightLeft className="w-4 h-4 text-white" />
              </button>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto pr-1">
              <div className="space-y-2">
                {chats
                  .sort((a, b) => {
                    if (!!a.pinned !== !!b.pinned) return a.pinned ? -1 : 1;
                    return b.updatedAt - a.updatedAt;
                  })
                  .slice(0, 12)
                  .map((chat) => (
                    <div
                      key={chat.id}
                      className={`w-full text-left p-2 rounded-xl text-[10px] font-bold flex items-center justify-between ${activeChatId === chat.id ? 'bg-white/15 text-white' : 'bg-white/5 text-white/70'}`}
                    >
                      <button
                        onClick={() => {
                          setActiveChatId(chat.id);
                          setIsSidebarOpen(false);
                        }}
                        className="flex-1 text-left"
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
                          className="px-2 py-1 bg-white/10 rounded-lg text-[9px] font-black"
                          title="Pin chat"
                        >
                          {chat.pinned ? 'Unpin' : 'Pin'}
                        </button>
                      </div>
                    </div>
                  ))}
              </div>

              <div className="mt-4 space-y-2">
                <button
                  onClick={async () => {
                    try {
                      const created = await createThread({ title: 'New chat' });
                      const newChat = mapThreadToChat(created);
                      setChats(prev => [newChat, ...prev]);
                      setActiveChatId(newChat.id);
                      setIsSidebarOpen(false);
                    } catch {
                      onToast('Unable to start assistant chat.');
                    }
                  }}
                  className="w-full px-3 py-2 bg-white/10 rounded-xl text-[10px] font-black flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4" /> New chat
                </button>
                <button
                  onClick={() => {
                    onOpenOnboarding();
                    setIsSidebarOpen(false);
                  }}
                  className="w-full px-3 py-2 bg-white/10 rounded-xl text-[10px] font-black flex items-center justify-center gap-2"
                >
                  <Trophy className="w-4 h-4" /> Onboarding
                </button>
              </div>

              <div className="mt-6">
                <p className="text-[10px] font-black uppercase tracking-widest text-white/50 mb-3">Quick Actions</p>
                <div className="space-y-2 text-[10px] font-bold">
                  {quickActions.map(action => (
                    <button
                      key={action.label}
                      onClick={() => {
                        action.onClick();
                        setIsSidebarOpen(false);
                      }}
                      className="w-full bg-white/5 rounded-xl py-2 flex items-center justify-center gap-2"
                    >
                      <action.icon className="w-3 h-3" /> {action.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-6">
                <p className="text-[10px] font-black uppercase tracking-widest text-white/50 mb-3">More</p>
                <div className="space-y-2 text-[10px] font-bold">
                  {moreActions.map(action => (
                    <button
                      key={action.label}
                      onClick={() => {
                        action.onClick();
                        setIsSidebarOpen(false);
                      }}
                      className="w-full bg-white/5 rounded-xl py-2 flex items-center justify-center gap-2"
                    >
                      <action.icon className="w-3 h-3" /> {action.label}
                    </button>
                  ))}
                </div>
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
              <MessageCircle className="w-5 h-5" />
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
              <Sparkles className="w-5 h-5" />
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
              return (
                <div
                  key={msg.id || `msg_${i}`}
                  className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse ml-auto text-right' : ''}`}
                >
                  <div className={`h-9 w-9 rounded-2xl flex items-center justify-center text-[9px] font-black ${isUser ? 'bg-indigo-500/80 text-white' : 'bg-white/10 text-white/80'}`}>
                    {isUser ? 'You' : 'AI'}
                  </div>
                  <div className="max-w-[85%] space-y-2">
                    <div className={`text-[10px] font-bold ${isUser ? 'text-white/60' : 'text-white/70'}`}>
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
                    <div className={`px-4 py-3 rounded-2xl text-[12px] leading-relaxed ${isUser ? 'bg-indigo-500/80 text-white' : 'bg-white/10 text-white/90'}`}>
                      {msg.content}
                    </div>
                    {msg.role === 'assistant' && renderMedia(msg.metadata, msg.content)}
                    {msg.role === 'assistant' && Array.isArray(msg.metadata?.references) && msg.metadata.references.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex flex-wrap gap-2">
                          {(msg.metadata.references as AssistantReference[]).map((ref, idx) => (
                            <span
                              key={`${msg.id || i}-ref-${idx}`}
                              className="px-2 py-1 rounded-full text-[9px] font-semibold tracking-[0.12em] bg-emerald-500/10 text-emerald-200"
                            >
                              {ref.label}{ref.detail ? ` · ${ref.detail}` : ''}
                            </span>
                          ))}
                        </div>
                        <div className="space-y-1">
                          {(msg.metadata.references as AssistantReference[]).map((ref, idx) => {
                            const items = (ref.data as any)?.items;
                            if (!Array.isArray(items) || items.length === 0) return null;
                            return (
                              <div key={`${msg.id || i}-ref-detail-${idx}`} className="text-[10px] text-white/70 space-y-1">
                                {items.slice(0, 3).map((item: any, itemIdx: number) => (
                                  <div key={`${msg.id || i}-ref-item-${idx}-${itemIdx}`} className="flex flex-wrap gap-2">
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
                    {msg.actions && msg.actions.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {msg.actions.map((action, idx) => (
                          <button
                            key={idx}
                            onClick={action.onClick}
                            className="px-3 py-2 bg-white/10 rounded-full text-[10px] font-bold hover:bg-white/20 transition-colors"
                          >
                            {action.label}
                          </button>
                        ))}
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
            {sortedSuggestionChips.length > 0 && (
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                {sortedSuggestionChips.map(chip => (
                  <button
                    key={chip.label}
                    onClick={() => {
                      bumpActionUsage(chip.label);
                      setInput(chip.value);
                    }}
                    className="px-3 py-2 bg-white/10 rounded-full text-[10px] font-bold whitespace-nowrap"
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

            <div className="flex items-center gap-2">
              <button
                onClick={() => onOpenSearchAction('voice search', 'voice')}
                className="h-11 w-11 rounded-full bg-white/10 flex items-center justify-center"
                aria-label="Voice search"
              >
                <Mic className="w-5 h-5" />
              </button>
              <input
                className="flex-1 min-w-0 h-11 bg-white/10 rounded-full px-4 text-sm outline-none focus:ring-2 focus:ring-emerald-400/40 placeholder:text-white/40"
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
                className="h-11 w-11 rounded-full flex items-center justify-center bg-white/10"
                aria-label="Add media"
              >
                <Plus className="w-5 h-5" />
              </button>
              <button
                onClick={handleSend}
                className="h-11 w-11 rounded-full bg-emerald-500 flex items-center justify-center text-white"
                aria-label="Send"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {showModelPicker && (
        <div className="fixed inset-0 z-[80] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-950 text-white border border-white/10 rounded-3xl overflow-hidden">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <div>
                <p className="text-sm font-black">AI Model Preferences</p>
                <p className="text-[10px] text-white/60">Choose provider + model (optional)</p>
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
              <input
                className="w-full h-11 rounded-2xl bg-white/10 px-3 text-[12px]"
                placeholder="Provider (e.g., openrouter, azure, anthropic)"
                value={llmProvider}
                onChange={(e) => setLlmProvider(e.target.value)}
              />
              <input
                className="w-full h-11 rounded-2xl bg-white/10 px-3 text-[12px]"
                placeholder="Model (e.g., gpt-4o-mini, claude-3.5-sonnet)"
                value={llmModel}
                onChange={(e) => setLlmModel(e.target.value)}
              />
              <div className="text-[10px] text-white/60">
                Leave blank to use the default configured on the server.
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={saveModelPreferences}
                  className="px-4 py-2 bg-emerald-500 rounded-xl text-[10px] font-black text-white"
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
