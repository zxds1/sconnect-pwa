import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, BarChart3, Settings, Package, 
  Sparkles, X, Upload, Star, MapPin, Edit3, Save, Trash2,
  Wand2, TrendingUp, Users, AlertCircle,
  ArrowUpRight, Wallet, Megaphone, QrCode, Download, 
  ShieldCheck, Clock, MessageSquare, Heart, Phone, ImageIcon,
  LineChart as LineChartIcon, Zap, Send, Search as SearchIcon
} from 'lucide-react';
import { MARKETING_SPEND, ORDERS, PRODUCTS, SELLERS } from '../mockData';
import { Product, Seller } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell,
  LineChart, Line, Legend
} from 'recharts';
import { ListingOptimizer } from './ListingOptimizer';
import {
  getSellerBuyerInsight,
  getSellerFunnel,
  getSellerInventoryInsight,
  getSellerKpiSummary,
  getSellerMarketBenchmarks,
  listSellerAnomalies,
  requestSellerWhatsAppDailySummary,
  type Anomaly,
  type BuyerInsight,
  type FunnelMetrics,
  type InventoryInsight,
  type KPISummary,
  type MarketBenchmarks
} from '../lib/sellerAnalyticsApi';
import {
  activateFeatured,
  createFanOffer,
  createStockAlert,
  createCategorySpotlight,
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
  type KPIStat as MarketingKPIStat
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
  createBulkBuyGroup,
  joinBulkBuyGroup
} from '../lib/growthApi';
import {
  completeSellerOnboarding,
  completeSellerTutorial,
  getSellerOnboardingEligibility,
  getSellerOnboardingState,
  getSellerVerificationStatus,
  listSellerTutorials,
  recordSellerOnboardingEvent,
  refreshSellerShareLink,
  requestSellerVerification,
  type OnboardingState as SellerOnboardingState,
  type Tutorial as SellerTutorial,
  type VerificationStatus as SellerVerificationStatus
} from '../lib/sellerOnboardingApi';
import {
  bulkImportSellerProducts,
  bulkStockUpdateSellerProducts,
  createSellerProduct,
  deleteSellerProduct,
  listSellerProducts,
  listSellerProductInsights,
  listSellerLowStock,
  addSellerProductMedia,
  removeSellerProductMedia,
  updateSellerProduct,
  updateSellerProductPrice,
  updateSellerProductStock,
  type SellerProduct,
  type SellerProductInsight,
  type SellerLowStock
} from '../lib/sellerProductsApi';
import { listProductMedia, listProductReviews, replyProductReview, type ProductMedia, type ProductReview } from '../lib/catalogApi';
import { requestUploadPresign } from '../lib/uploadsApi';
import {
  getSellerProfile,
  updateSellerProfile,
  listSellerLocations,
  createSellerLocation,
  updateSellerLocation,
  type SellerLocation
} from '../lib/sellerProfileApi';
import { listShopReviews, replyShopReview, type ShopReview } from '../lib/sellerShopApi';
import { getSellerNotificationPreferences, updateSellerNotificationPreferences } from '../lib/sellerNotificationsApi';
import { getSessionInfo } from '../lib/identityApi';
import {
  acceptRFQResponse,
  createRFQ,
  declineRFQResponse,
  getRFQComparison,
  getSupplierDelivery,
  getSupplierOffers,
  listSupplierApplicationsAdmin,
  approveSupplierApplication,
  rejectSupplierApplication,
  streamSupplierApplicationsAdmin,
  listRFQResponses,
  listRFQs,
  listSuppliers,
  type RFQComparison,
  type RFQResponse,
  type RFQThread,
  type Supplier,
  type SupplierApplication,
  type SupplierDelivery,
  type SupplierOffer
} from '../lib/suppliersApi';

const WEEK_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const HOUR_LABELS = ['8am', '10am', '12pm', '2pm', '4pm', '6pm', '8pm', '10pm'];
const WEEK_WEIGHTS = [0.12, 0.1, 0.09, 0.13, 0.17, 0.19, 0.2];
const HOUR_WEIGHTS = [0.06, 0.12, 0.16, 0.14, 0.18, 0.2, 0.1, 0.04];

const spreadSeries = (total: number, weights: number[]) =>
  weights.map((w) => Math.max(0, Math.round(total * w)));

const clamp = (value: number, min = 0, max = 100) => Math.min(max, Math.max(min, value));

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

const normalizeRole = (role?: string) => {
  const normalized = (role || '').toLowerCase();
  if (normalized === 'admin' || normalized === 'owner') return 'admin';
  if (normalized === 'seller') return 'seller';
  return 'viewer';
};


interface SellerDashboardProps {
  products: Product[];
  onProductsChange: (next: Product[]) => void;
  onToast?: (msg: string) => void;
  sellerBalance: number;
  onSellerBalanceChange: (next: number) => void;
  sellerPayouts: Array<{ id: string; amount: number; reason: string; timestamp: number }>;
  onSellerPayoutsChange: (next: Array<{ id: string; amount: number; reason: string; timestamp: number }>) => void;
  verifiedSellerIds: string[];
  onVerifiedSellerIdsChange: (next: string[]) => void;
  onOpenSellerChat?: () => void;
  onOpenSupportChat?: () => void;
}

export const SellerDashboard: React.FC<SellerDashboardProps> = ({
  products,
  onProductsChange,
  onToast,
  sellerBalance,
  onSellerBalanceChange,
  sellerPayouts,
  onSellerPayoutsChange,
  verifiedSellerIds,
  onVerifiedSellerIdsChange,
  onOpenSellerChat,
  onOpenSupportChat
}) => {
  const mediaInputRef = useRef<HTMLInputElement | null>(null);
  const mediaDrawerInputRef = useRef<HTMLInputElement | null>(null);
  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const [activeTab, setActiveTab] = useState('onboarding');
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [seller, setSeller] = useState<Seller>(SELLERS[0]); // Mocking s1
  const [myProducts, setMyProducts] = useState<Product[]>(
    products.filter(p => p.sellerId === SELLERS[0].id)
  );
  const [showReferralModal, setShowReferralModal] = useState(false);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);
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
    budget: 1200,
    durationDays: 7,
    productId: '',
    channel: 'search' as 'search' | 'feed' | 'messages'
  });
  const [campaignStatus, setCampaignStatus] = useState<string | null>(null);
  const [campaignLoading, setCampaignLoading] = useState(false);
  const [referralPhone, setReferralPhone] = useState('');

  // Form States
  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    price: string;
    category: string;
    mediaUrl: string;
    stockLevel: number;
    expiryDate?: string;
  }>({
    name: '',
    description: '',
    price: '',
    category: '',
    mediaUrl: '',
    stockLevel: 10,
    expiryDate: ''
  });

  // Profile Form States
  const [profileData, setProfileData] = useState({
    name: seller.name,
    description: seller.description,
    address: seller.location?.address || ''
  });

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
  const [adminSupplierApps, setAdminSupplierApps] = useState<SupplierApplication[]>([]);
  const [adminSupplierAppsLoading, setAdminSupplierAppsLoading] = useState(false);
  const [adminSupplierAppsStatus, setAdminSupplierAppsStatus] = useState<string | null>(null);
  const [adminDecisionReasons, setAdminDecisionReasons] = useState<Record<string, string>>({});
  const [isAdmin, setIsAdmin] = useState(false);
  const [rfqThreadsRemote, setRfqThreadsRemote] = useState<RFQThread[]>([]);
  const [rfqResponsesById, setRfqResponsesById] = useState<Record<string, RFQResponse[]>>({});
  const [rfqComparisonById, setRfqComparisonById] = useState<Record<string, RFQComparison>>({});
  const [rfqItemsById, setRfqItemsById] = useState<Record<string, Array<{ name: string; quantity: number; unit: string }>>>({});
  const [rfqLoading, setRfqLoading] = useState(false);
  const [rfqStatus, setRfqStatus] = useState<string | null>(null);
  const [rfqLastUpdated, setRfqLastUpdated] = useState<Date | null>(null);
  const [sellerFilters, setSellerFilters] = useState({
    category: '',
    maxDistance: 50,
    minRating: 0,
    verifiedOnly: false,
    minOrderValue: 0
  });
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
  const [analyticsStatus, setAnalyticsStatus] = useState<string | null>(null);
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [broadcastMessage, setBroadcastMessage] = useState('Leo Unga 2kg KES 175 • Sukari 1kg KES 150 • Maziwa fresh!');
  const [commsStatus, setCommsStatus] = useState<string | null>(null);
  const [marketingKpis, setMarketingKpis] = useState<MarketingKPIStat | null>(null);
  const [marketingHotspots, setMarketingHotspots] = useState<MarketingHotspot[]>([]);
  const [marketingStockAlerts, setMarketingStockAlerts] = useState<Array<{ id?: string; product_id?: string; message?: string; status?: string }>>([]);
  const [marketingFanOffers, setMarketingFanOffers] = useState<Array<{ id?: string; offer_title?: string; discount?: string; status?: string }>>([]);
  const [marketingCategorySpotlights, setMarketingCategorySpotlights] = useState<Array<{ id?: string; category?: string; budget?: string; status?: string }>>([]);
  const [marketingStatus, setMarketingStatus] = useState<string | null>(null);
  const [stockAlertProductId, setStockAlertProductId] = useState('');
  const [onboardingState, setOnboardingState] = useState<SellerOnboardingState | null>(null);
  const [onboardingEligible, setOnboardingEligible] = useState<boolean | null>(null);
  const [onboardingTutorials, setOnboardingTutorials] = useState<SellerTutorial[]>([]);
  const [onboardingStatus, setOnboardingStatus] = useState<string | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<SellerVerificationStatus | null>(null);
  const [productsStatus, setProductsStatus] = useState<string | null>(null);
  const [productsLoading, setProductsLoading] = useState(false);
  const [mediaUploading, setMediaUploading] = useState(false);
  const [productInsights, setProductInsights] = useState<SellerProductInsight[]>([]);
  const [productLowStock, setProductLowStock] = useState<SellerLowStock[]>([]);
  const [productMediaByProductId, setProductMediaByProductId] = useState<Record<string, ProductMedia[]>>({});
  const [showMediaDrawer, setShowMediaDrawer] = useState(false);
  const [mediaDrawerProduct, setMediaDrawerProduct] = useState<Product | null>(null);
  const [settingsStatus, setSettingsStatus] = useState<string | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [sellerLocations, setSellerLocations] = useState<SellerLocation[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [notificationPrefs, setNotificationPrefs] = useState<{ email?: boolean; in_app?: boolean; whatsapp?: boolean; sms?: boolean }>({
    email: true,
    in_app: true,
    whatsapp: false,
    sms: false
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

  useEffect(() => {
    const isVerified = verifiedSellerIds.includes(seller.id);
    setSeller(prev => ({ ...prev, isVerified }));
    setMyProducts(products.filter(p => p.sellerId === seller.id));
  }, [products, seller.id, verifiedSellerIds]);

  useEffect(() => {
    try {
      const rawBroadcasts = localStorage.getItem(`soko:seller_broadcasts:${seller.id}`);
      setBroadcastCount(rawBroadcasts ? Number(rawBroadcasts) : 0);
    } catch {
      setBroadcastCount(0);
    }
  }, [seller.id]);

  useEffect(() => {
    let ignore = false;
    const loadRole = async () => {
      try {
        const session = await getSessionInfo();
        if (ignore) return;
        const role = normalizeRole(session?.role);
        setIsAdmin(role === 'admin');
        if (session?.role) {
          try {
            localStorage.setItem('soko:role', String(session.role).toLowerCase());
          } catch {}
        }
      } catch {
        if (!ignore) setIsAdmin(false);
      }
    };
    loadRole();
    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    if (activeTab !== 'analytics' && activeTab !== 'marketing') return;
    let ignore = false;
    const loadAnalytics = async () => {
      setAnalyticsStatus(null);
      try {
        const [summary, funnel, inventory, buyers, market, anomalies] = await Promise.all([
          getSellerKpiSummary(),
          getSellerFunnel(),
          getSellerInventoryInsight(),
          getSellerBuyerInsight(),
          getSellerMarketBenchmarks(),
          listSellerAnomalies()
        ]);
        if (ignore) return;
        setAnalyticsSummary(summary);
        setAnalyticsFunnel(funnel);
        setAnalyticsInventory(inventory);
        setAnalyticsBuyers(buyers);
        setAnalyticsMarket(market);
        setAnalyticsAnomalies(anomalies);
      } catch (err: any) {
        if (!ignore) setAnalyticsStatus(err?.message || 'Unable to load analytics.');
      }
    };
    loadAnalytics();
    return () => {
      ignore = true;
    };
  }, [activeTab]);

  useEffect(() => {
    if (activeTab !== 'suppliers') return;
    if (rfqThreadsRemote.length === 0) return;
    let cancelled = false;
    const poll = async () => {
      try {
        const { responsesById, comparisonsById } = await buildRfqUpdates(rfqThreadsRemote);
        if (cancelled) return;
        setRfqResponsesById(responsesById);
        setRfqComparisonById(comparisonsById);
        setRfqLastUpdated(new Date());
      } catch {
        // Ignore polling errors.
      }
    };
    poll();
    const interval = window.setInterval(poll, 20000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [activeTab, rfqThreadsRemote]);

  useEffect(() => {
    if (activeTab !== 'marketing') return;
    let ignore = false;
    const loadMarketing = async () => {
      setCampaignStatus(null);
      setMarketingStatus(null);
      setCampaignLoading(true);
      try {
        const [items, kpis, hotspots, stockAlerts, fanOffers, spotlights] = await Promise.all([
          listSellerCampaigns(),
          getMarketingKPIs('30d'),
          listHotspots(),
          listStockAlerts(),
          listFanOffers(),
          listCategorySpotlights()
        ]);
        if (ignore) return;
        const normalized = items.map((c: ApiCampaign) => {
          const targeting = (c.targeting_rules || {}) as Record<string, any>;
          const durationDays = Number(targeting.duration_days ?? 7);
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
        setCampaigns(normalized);
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
    loadMarketing();
    return () => {
      ignore = true;
    };
  }, [activeTab]);

  useEffect(() => {
    if (activeTab !== 'onboarding') return;
    let ignore = false;
    const loadOnboarding = async () => {
      setOnboardingStatus(null);
      try {
        const [state, eligibility, tutorials, verification] = await Promise.all([
          getSellerOnboardingState(),
          getSellerOnboardingEligibility(),
          listSellerTutorials(),
          getSellerVerificationStatus()
        ]);
        if (ignore) return;
        setOnboardingState(state);
        setOnboardingEligible(eligibility?.eligible ?? null);
        setOnboardingTutorials(tutorials);
        setVerificationStatus(verification);
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
    if (activeTab !== 'settings') return;
    let ignore = false;
    const loadSettings = async () => {
      setSettingsStatus(null);
      setProfileLoading(true);
      setReviewsLoading(true);
      try {
        const [profile, locations, verification] = await Promise.all([
          getSellerProfile(),
          listSellerLocations(),
          getSellerVerificationStatus()
        ]);
        if (ignore) return;
        setSellerLocations(locations);
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
        if (verification) {
          setVerificationStatus(verification);
          if (verification?.verified || verification?.status === 'verified') {
            onVerifiedSellerIdsChange(Array.from(new Set([...verifiedSellerIds, seller.id])));
          }
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
            email: prefs?.email ?? true,
            in_app: prefs?.in_app ?? true,
            whatsapp: prefs?.whatsapp ?? false,
            sms: prefs?.sms ?? false
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
      try {
        rfqList = await listRFQs();
        if (ignore) return;
        setRfqThreadsRemote(rfqList);
      } catch (err: any) {
        if (!ignore) setRfqStatus(err?.message || 'Unable to load RFQs.');
      }
      if (suppliersList.length) {
        const offerEntries = await Promise.all(
          suppliersList.map(async (supplier) => {
            if (!supplier.id) return null;
            try {
              const offers = await getSupplierOffers(supplier.id);
              return [supplier.id, offers] as const;
            } catch {
              return [supplier.id, []] as const;
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
    if (activeTab !== 'suppliers' || !isAdmin) return;
    let stop: null | (() => void) = null;
    let cancelled = false;
    const start = async () => {
      try {
        stop = await streamSupplierApplicationsAdmin(
          (items) => {
            if (cancelled) return;
            setAdminSupplierApps(items || []);
          },
          (message) => {
            if (cancelled) return;
            setAdminSupplierAppsStatus(message);
          }
        );
      } catch (err: any) {
        if (cancelled) return;
        setAdminSupplierAppsStatus(err?.message || 'Unable to open admin updates.');
      }
    };
    start();
    return () => {
      cancelled = true;
      if (stop) stop();
    };
  }, [activeTab, isAdmin]);

  useEffect(() => {
    if (activeTab !== 'suppliers') return;
    if (!isAdmin) return;
    refreshAdminSupplierApps();
  }, [activeTab, isAdmin]);

  useEffect(() => {
    if (activeTab !== 'comms') return;
    let ignore = false;
    const loadBroadcasts = async () => {
      setCommsStatus(null);
      try {
        const items = await listBroadcasts(50);
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
  }, [activeTab]);

  useEffect(() => {
    if (activeTab !== 'growth') return;
    let ignore = false;
    const loadGrowth = async () => {
      setGrowthStatus(null);
      try {
        const [overview, cashflow, health, loan, projection, referrals, groups] = await Promise.all([
          getGrowthOverview(),
          getCashflow(),
          getFinancialHealth(),
          getLoanEligibility(),
          getFinancialProjections('cashflow'),
          getGrowthReferrals(),
          listBulkBuyGroups()
        ]);
        if (ignore) return;
        setGrowthOverview(overview);
        setGrowthCashflow(cashflow);
        setGrowthHealth(health);
        setGrowthLoan(loan);
        setGrowthProjection(projection);
        setGrowthReferrals(referrals);
        setBulkGroups(groups);
      } catch (err: any) {
        if (!ignore) setGrowthStatus(err?.message || 'Unable to load growth data.');
      }
    };
    loadGrowth();
    return () => {
      ignore = true;
    };
  }, [activeTab]);

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
      stockStatus: (item.stock_status as Product['stockStatus']) || (Number(item.stock_level ?? 0) <= 0 ? 'out_of_stock' : Number(item.stock_level ?? 0) < 5 ? 'low_stock' : 'in_stock'),
      discountPrice: item.discount_price ?? undefined,
      isFeatured: item.is_featured,
      location: seller.location
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
        const [insights, lowStock] = await Promise.all([
          listSellerProductInsights(),
          listSellerLowStock()
        ]);
        if (!ignore) {
          setProductInsights(insights);
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
  const ordersForSeller = ORDERS.filter(o => o.sellerId === seller.id);
  const last30Orders = ordersForSeller.filter(o => (now.getTime() - new Date(o.createdAt).getTime()) <= 30 * 24 * 60 * 60 * 1000);
  const last30Revenue = last30Orders.reduce((sum, o) => sum + o.quantity * o.unitPrice, 0);
  const last30Customers = new Set(last30Orders.map(o => o.customerId)).size;
  const totalOrders = ordersForSeller.length;
  const totalUnits = ordersForSeller.reduce((sum, o) => sum + o.quantity, 0);
  const totalRevenue = ordersForSeller.reduce((sum, o) => sum + o.quantity * o.unitPrice, 0);
  const totalCost = ordersForSeller.reduce((sum, o) => sum + o.quantity * o.unitCost, 0);
  const averagePrice = totalOrders ? totalRevenue / totalOrders : (myProducts.reduce((sum, p) => sum + p.price, 0) / Math.max(myProducts.length, 1));
  const estimatedMonthlyViews = seller.dailyViews * 30;
  const estimatedMonthlyOrders = Math.max(1, last30Orders.length || totalOrders || 1);
  const conversionRate = estimatedMonthlyViews ? (estimatedMonthlyOrders / estimatedMonthlyViews) * 100 : 0;
  const estimatedMonthlyRevenue = totalOrders ? (totalRevenue / Math.max(totalOrders, 1)) * estimatedMonthlyOrders : estimatedMonthlyOrders * averagePrice;
  const marketingSpend = MARKETING_SPEND.filter(m => m.sellerId === seller.id).reduce((sum, m) => sum + m.amount, 0);
  const customerOrderCounts = ordersForSeller.reduce((map, o) => {
    map.set(o.customerId, (map.get(o.customerId) || 0) + 1);
    return map;
  }, new Map<string, number>());
  const uniqueCustomers = customerOrderCounts.size || 1;
  const newCustomers = Array.from(customerOrderCounts.values()).filter(c => c === 1).length || 1;
  const purchaseFrequency = totalOrders / uniqueCustomers;
  const churnRate = 0.25;
  const ltv = Math.round(averagePrice * purchaseFrequency / churnRate);
  const cac = Math.round(marketingSpend / Math.max(newCustomers, 1));
  const roas = marketingSpend ? (estimatedMonthlyRevenue / marketingSpend) : 0;
  const marketingROAS = Number.isFinite(Number(marketingKpis?.roas)) ? Number(marketingKpis?.roas) : roas;
  const marketingCAC = Number.isFinite(Number(marketingKpis?.cac)) ? Number(marketingKpis?.cac) : cac;
  const marketingLTV = Number.isFinite(Number(marketingKpis?.ltv)) ? Number(marketingKpis?.ltv) : ltv;
  const marketingRevenue30d = Number(analyticsSummary?.gross_revenue ?? analyticsSummary?.net_revenue ?? last30Revenue);
  const marketingOrders30d = Number(analyticsFunnel?.payment_success ?? last30Orders.length);
  const marketingNewCustomers = Number(analyticsBuyers?.new_buyers ?? newCustomers);
  const marketingUnits30d = Number(analyticsFunnel?.add_to_cart ?? last30Orders.reduce((sum, o) => sum + o.quantity, 0));
  const marketingReturns30d = analyticsSummary?.cart_abandonment
    ? Math.round((Number(analyticsSummary.cart_abandonment) / 100) * Number(analyticsFunnel?.checkout_start ?? marketingOrders30d))
    : last30Orders.filter(o => o.returned).length;
  const totalStock = myProducts.reduce((sum, p) => sum + p.stockLevel, 0);
  const stockCoverageDays = Math.round(totalStock / Math.max(estimatedMonthlyOrders / 30, 1));
  const repeatRate = Math.min(70, Math.round((purchaseFrequency / Math.max(1, purchaseFrequency + 1)) * 100 + seller.rating * 4));
  const topCategories = Array.from(
    myProducts.reduce((map, p) => {
      map.set(p.category, (map.get(p.category) || 0) + 1);
      return map;
    }, new Map<string, number>())
  )
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 4);

  const funnelSessions = analyticsFunnel?.sessions ?? 0;
  const funnelViews = analyticsFunnel?.pdp_views ?? 0;
  const funnelInquiries = analyticsFunnel?.add_to_cart ?? 0;
  const funnelSales = analyticsFunnel?.payment_success ?? 0;
  const dailyViews = funnelViews;
  const dailyInquiries = funnelInquiries;
  const viewsDeltaPct = Math.round((funnelViews / Math.max(1, funnelSessions)) * 100);
  const inquiriesDeltaPct = Math.round((funnelInquiries / Math.max(1, funnelViews || funnelSessions)) * 100);

  const analyticsSalesData = WEEK_DAYS.map((name, idx) => ({
    name,
    sales: spreadSeries(funnelSales || Math.round(funnelSessions * 0.2), WEEK_WEIGHTS)[idx] || 0,
    reach: spreadSeries(funnelViews || funnelSessions, WEEK_WEIGHTS)[idx] || 0,
  }));

  const analyticsSalesVelocity = WEEK_DAYS.map((name, idx) => {
    const velocity = analyticsSalesData[idx]?.sales ?? 0;
    const target = Math.max(1, Math.round((funnelSales || 0) / 7) || 0);
    return { name, velocity, target };
  });

  const analyticsPeakHours = HOUR_LABELS.map((hour, idx) => ({
    hour,
    searches: spreadSeries(funnelViews || funnelSessions, HOUR_WEIGHTS)[idx] || 0,
  }));

  const analyticsCompetitorPricing = myProducts.slice(0, 4).map((product, idx) => {
    const avgPrice = analyticsMarket?.competitor_median_price ?? product.price * 0.95;
    const competitorMin = avgPrice ? Math.round(avgPrice * 0.9) : Math.round(product.price * 0.9);
    return {
      name: product.name,
      yourPrice: product.price,
      avgPrice: Math.round(avgPrice),
      competitorMin: Math.max(1, competitorMin - idx),
    };
  });

  const stockoutRisk = clamp(analyticsInventory?.stockout_risk ?? 0);
  const lowStock = clamp(Math.round(stockoutRisk * 0.6), 0, 60);
  const outOfStock = clamp(Math.round(stockoutRisk * 0.3), 0, 30);
  const healthyStock = clamp(100 - lowStock - outOfStock, 0, 100);

  const analyticsStockHealth = [
    { name: 'Healthy', value: healthyStock, color: '#10b981' },
    { name: 'Low Stock', value: lowStock, color: '#f59e0b' },
    { name: 'Out of Stock', value: outOfStock, color: '#ef4444' },
  ];

  const analyticsDemographics = [
    { name: 'Gen Z (18-24)', value: clamp(30 + Math.round((analyticsBuyers?.repeat_rate ?? 0) * 10)), color: '#6366f1' },
    { name: 'Millennials (25-34)', value: clamp(40 + Math.round((analyticsBuyers?.repeat_rate ?? 0) * 5)), color: '#8b5cf6' },
    { name: 'Gen X (35-50)', value: clamp(20 - Math.round((analyticsBuyers?.repeat_rate ?? 0) * 5), 5, 30), color: '#d946ef' },
    { name: 'Others', value: clamp(10, 5, 15), color: '#f43f5e' },
  ].map((item, _, arr) => {
    const total = arr.reduce((sum, i) => sum + i.value, 0) || 1;
    return { ...item, value: Math.round((item.value / total) * 100) };
  });

  const analyticsTopSearched = topCategories.slice(0, 3).map((cat, idx) => ({
    name: cat.category,
    searches: Math.max(10, cat.count * 10 + idx * 8),
    trend: `${Math.max(1, Math.round((analyticsMarket?.market_share ?? 0) * 100) + idx * 2)}%`
  }));

  const analyticsTrendingProducts = myProducts.slice(0, 3).map((product, idx) => ({
    name: product.name,
    demand: idx === 0 ? 'High' : idx === 1 ? 'Medium' : 'Rising',
    supplier: product.supplier || `Supplier ${idx + 1}`
  }));

  const analyticsCategoryDemand = topCategories.map((cat, idx) => ({
    category: cat.category,
    demand: clamp(40 + cat.count * 10 + idx * 5),
    sellerShare: clamp(Math.round((cat.count / Math.max(1, myProducts.length)) * 100))
  }));

  const analyticsGodViewSources = [
    { label: 'QR', value: funnelViews || 0 },
    { label: 'Photos', value: Math.round((analyticsInventory?.days_cover ?? 0) * 10) },
    { label: 'POS', value: funnelSales || 0 },
    { label: 'CRM', value: analyticsBuyers?.new_buyers ?? 0 }
  ];

  const analyticsSourceMap = analyticsGodViewSources.reduce<Record<string, number>>((acc, item) => {
    acc[item.label] = item.value;
    return acc;
  }, {});

  const sokoscore = Number(growthHealth?.sokoscore ?? seller.sokoScore);
  const loanMaxAmount = Number(growthLoan?.max_amount ?? loanEligibilityMax);
  const loanMinAmount = Math.max(0, Math.round(loanMaxAmount * 0.35));
  const cashflowIn = Number(growthCashflow?.inflow ?? 0);
  const cashflowOut = Number(growthCashflow?.outflow ?? 0);
  const cashflowNet = Number(growthCashflow?.net_cashflow ?? (cashflowIn - cashflowOut));
  const projectionSeriesFallback = analyticsSalesData.map((d) => ({ name: d.name, revenue: d.sales }));
  const projectionSeries = projectionToSeries(growthProjection?.forecast as Record<string, any>, projectionSeriesFallback);
  const growthRetention = Number(growthOverview?.retention_rate ?? repeatRate);
  const growthChurn = Number(growthOverview?.churn_rate ?? churnRate * 100);

  const analyticsGodViewDemand = analyticsTopSearched.map((item) => ({
    name: item.name,
    pct: clamp(Math.round((item.searches / Math.max(1, analyticsTopSearched[0]?.searches || 1)) * 100))
  }));

  const analyticsGodViewBuyers = Array.from({ length: Math.max(1, Math.min(4, analyticsBuyers?.new_buyers ?? 0 || 1)) }).map((_, idx) => ({
    name: `Buyer ${idx + 1}`,
    item: analyticsTrendingProducts[idx]?.name || 'Top item',
    price: `KSh ${Math.round(averagePrice)}`,
    source: idx % 2 === 0 ? 'QR' : 'POS'
  }));

  const analyticsGodViewCompetitors = [
    { name: 'YOU', price: `KSh${Math.round(averagePrice)}`, stock: totalStock, trend: '—' },
    { name: 'Competitor A', price: `KSh${Math.round((analyticsMarket?.competitor_median_price ?? averagePrice) * 0.98)}`, stock: Math.round((analyticsMarket?.competitor_stock ?? 0) * 100), trend: '🔻' },
    { name: 'Competitor B', price: `KSh${Math.round((analyticsMarket?.competitor_median_price ?? averagePrice) * 1.02)}`, stock: Math.round((analyticsMarket?.competitor_stock ?? 0) * 90), trend: '🔺' },
    { name: 'Network Avg', price: `KSh${Math.round(analyticsMarket?.competitor_median_price ?? averagePrice)}`, stock: Math.round((analyticsMarket?.competitor_stock ?? 0) * 95), trend: '—' }
  ];

  const analyticsGodViewInventory = analyticsTrendingProducts.map((item) => ({
    name: item.name,
    your: `${Math.round(totalStock / Math.max(1, analyticsTrendingProducts.length))} units`,
    network: `${Math.round((analyticsMarket?.market_share ?? 0) * 100)}% demand`
  }));

  const analyticsGodViewAlerts = analyticsAnomalies.length
    ? analyticsAnomalies.slice(0, 4).map((item) => item.details || `${item.type} anomaly`)
    : ['No active anomalies detected'];

  const productById = myProducts.reduce((map, item) => {
    map.set(item.id, item);
    return map;
  }, new Map<string, Product>());

  const lowStockItems = productLowStock.length > 0
    ? productLowStock
    : myProducts
        .filter(p => p.stockLevel < 5)
        .map(p => ({ seller_product_id: p.id, stock_level: p.stockLevel, status: p.stockStatus || 'low_stock' }));

  const reorderRecommendations = productInsights.length > 0
    ? productInsights
        .map((insight) => {
          const product = productById.get(insight.seller_product_id || '');
          const conversions = insight.conversions ?? 0;
          return { product, conversions };
        })
        .filter(item => item.product)
        .sort((a, b) => b.conversions - a.conversions)
        .slice(0, 3)
        .map(({ product, conversions }) => {
          const recommended = Math.max(5, Math.round(conversions * 2 + (product?.stockLevel || 0) * 0.3));
          return `${product?.name}: ${conversions} conversions → reorder ${recommended}`;
        })
    : [];

  const demandHeatmap = (marketingHotspots.length > 0
    ? marketingHotspots.map((h, i) => {
        const product = myProducts.find(p => p.id === h.product_id) || myProducts[i % Math.max(1, myProducts.length)];
        return {
          id: h.product_id || product?.id || `hotspot_${i}`,
          name: product?.name || 'Hotspot',
          location: product?.location,
          demand: Math.max(10, Math.round((h.hotspot_score || 0) * 100))
        };
      })
    : myProducts.map((p, i) => ({
        id: p.id,
        name: p.name,
        location: p.location,
        demand: 40 + ((i * 23) % 60)
      }))).filter(p => p.location);

  const productsWithCompetitor = myProducts.filter(p => p.competitorPrice);
  const priceCompetitiveness = productsWithCompetitor.length
    ? (productsWithCompetitor.reduce((sum, p) => sum + (p.price / (p.competitorPrice || p.price)), 0) / productsWithCompetitor.length) * 100
    : 100;
  const stockoutRate = myProducts.length
    ? (myProducts.filter(p => p.stockLevel === 0).length / myProducts.length) * 100
    : 0;
  const sellThroughRate = totalStock + estimatedMonthlyOrders > 0
    ? (estimatedMonthlyOrders / (totalStock + estimatedMonthlyOrders)) * 100
    : 0;
  const grossMarginPct = totalRevenue ? ((totalRevenue - totalCost) / totalRevenue) * 100 : 0;
  const netMarginPct = totalRevenue ? ((totalRevenue - totalCost - marketingSpend - totalRevenue * 0.05) / totalRevenue) * 100 : 0;
  const avgInventoryValue = myProducts.reduce((sum, p) => sum + p.stockLevel * (p.costPrice || p.price * 0.65), 0);
  const inventoryTurns = avgInventoryValue ? ((totalCost || estimatedMonthlyRevenue * 0.65) / avgInventoryValue) * 12 : 0;
  const gmroi = avgInventoryValue ? ((totalRevenue - totalCost) / avgInventoryValue) * 12 : 0;
  const returnRate = totalOrders ? (ordersForSeller.filter(o => o.returned).length / totalOrders) * 100 : 0;
  const cartAbandonRate = Math.min(90, Math.max(30, 100 - (conversionRate / 0.12)));
  const avgItemsPerOrder = totalOrders ? totalUnits / totalOrders : 1;
  const promoLift = Math.min(30, Math.max(5, marketingROAS * 3));
  const repeatPurchaseIntervalDays = (() => {
    const intervals: number[] = [];
    customerOrderCounts.forEach((_, customerId) => {
      const customerOrders = ordersForSeller.filter(o => o.customerId === customerId)
        .map(o => new Date(o.createdAt).getTime())
        .sort((a, b) => a - b);
      for (let i = 1; i < customerOrders.length; i += 1) {
        intervals.push((customerOrders[i] - customerOrders[i - 1]) / (1000 * 60 * 60 * 24));
      }
    });
    if (intervals.length === 0) return 60;
    return Math.round(intervals.reduce((sum, v) => sum + v, 0) / intervals.length);
  })();
  const channelMix = ['search', 'feed', 'messages', 'direct'].map((name) => {
    const count = ordersForSeller.filter(o => o.channel === name).length;
    return { name: name[0].toUpperCase() + name.slice(1), value: totalOrders ? Math.round((count / totalOrders) * 100) : 0 };
  });
  const onTimeRate = totalOrders
    ? (ordersForSeller.filter(o => o.slaMet).length / totalOrders) * 100
    : 0;
  const csat = Math.min(5, Math.max(3, seller.rating));
  const dataCoverageRate = myProducts.length
    ? (myProducts.filter(p => p.location).length / myProducts.length) * 100
    : 0;
  const dataFreshnessDays = myProducts.reduce((sum, p) => {
    const last = p.priceHistory?.[p.priceHistory.length - 1]?.date;
    if (!last) return sum + 30;
    const diff = (Date.now() - new Date(last).getTime()) / (1000 * 60 * 60 * 24);
    return sum + Math.min(90, Math.max(0, diff));
  }, 0) / Math.max(myProducts.length, 1);
  const verificationRate = Math.min(98, 70 + seller.rating * 5);
  const anomalyRate = Math.max(0.5, 6 - seller.rating);
  const lostSalesEstimate = Math.round((stockoutRate / 100) * estimatedMonthlyOrders * averagePrice);

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

  const handleStartWhatsAppOnboarding = async () => {
    setOnboardingStatus(null);
    try {
      await recordSellerOnboardingEvent({ step: 'whatsapp_onboarding', status: 'started' });
      const state = await getSellerOnboardingState();
      setOnboardingState(state);
      setOnboardingStatus('WhatsApp onboarding started.');
    } catch (err: any) {
      setOnboardingStatus(err?.message || 'Unable to start WhatsApp onboarding.');
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
      await refreshSellerShareLink();
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

  const uploadMediaFile = async (file: File) => {
    const presign = await requestUploadPresign({
      file_name: file.name,
      mime_type: file.type,
      content_length: file.size,
      context: 'seller_product_media'
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
      form.append('file', file);
      await fetch(uploadUrl, {
        method: presign.method || 'POST',
        body: form,
        headers: presign.headers
      });
    } else {
      await fetch(uploadUrl, {
        method: presign.method || 'PUT',
        headers: presign.headers || { 'Content-Type': file.type },
        body: file
      });
    }
    return presign.url || uploadUrl;
  };

  const handleProductMediaUpload = async (file: File, targetProduct?: Product) => {
    setProductsStatus(null);
    setMediaUploading(true);
    try {
      const url = await uploadMediaFile(file);
      setFormData(prev => ({ ...prev, mediaUrl: url }));
      const activeProduct = targetProduct || editingProduct;
      if (activeProduct) {
        await addSellerProductMedia(activeProduct.id, {
          url,
          media_type: file.type.startsWith('video') ? 'video' : 'image'
        });
        if (activeProduct.productId) {
          const media = await listProductMedia(activeProduct.productId);
          setProductMediaByProductId(prev => ({ ...prev, [activeProduct.productId!]: media }));
        }
        setMyProducts(prev => {
          const next = prev.map(p => (p.id === activeProduct.id ? { ...p, mediaUrl: url, mediaType: file.type.startsWith('video') ? 'video' : 'image' } : p));
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
    }
  };

  const handleAvatarUpload = async (file: File) => {
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
    const product = myProducts.find(p => p.id === stockAlertProductId);
    const threshold = Math.max(1, Math.round((product?.stockLevel ?? 10) * 0.2));
    const message = product
      ? `Fresh stock of ${product.name} just landed. Limited availability.`
      : 'Fresh stock now available. Limited availability.';
    setMarketingStatus(null);
    try {
      await createStockAlert({ product_id: stockAlertProductId, threshold, message });
      await broadcastStockAlerts();
      const latestAlerts = await listStockAlerts();
      setMarketingStockAlerts(latestAlerts);
      setMarketingStatus('Stock alert broadcasted to followers.');
    } catch (err: any) {
      setMarketingStatus(err?.message || 'Unable to send stock alert.');
    }
  };

  const handleCreateFanOffer = async () => {
    setMarketingStatus(null);
    const discountPct = Math.max(5, Math.min(20, Math.round((marketingROAS || 10) * 4)));
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

  const handleCreateCategorySpotlight = async () => {
    const category = topCategories[0]?.category;
    if (!category) {
      setMarketingStatus('Add products to request a category spotlight.');
      return;
    }
    setMarketingStatus(null);
    try {
      const created = await createCategorySpotlight({ category, budget: 500 });
      setMarketingCategorySpotlights(prev => [created, ...prev]);
      setMarketingStatus(`Category spotlight requested for ${category}.`);
    } catch (err: any) {
      setMarketingStatus(err?.message || 'Unable to request category spotlight.');
    }
  };

  const handleAddProduct = () => {
    setEditingProduct(null);
    setFormData({ name: '', description: '', price: '', category: '', mediaUrl: '', stockLevel: 10, expiryDate: '' });
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
      expiryDate: product.expiryDate || ''
    });
    setIsAddingProduct(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const price = Number(formData.price);
    const stockLevel = Number(formData.stockLevel);
    const stockStatus = stockLevel <= 0 ? 'out_of_stock' : stockLevel < 5 ? 'low_stock' : 'in_stock';
    setProductsStatus(null);
    try {
      if (editingProduct) {
        const updated = await updateSellerProduct(editingProduct.id, {
          alias: formData.name,
          category_id: formData.category,
          current_price: price,
          stock_level: stockLevel,
          stock_status: stockStatus
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
          stockStatus: (updated.stock_status as Product['stockStatus']) || stockStatus,
          discountPrice: updated.discount_price ?? undefined,
          isFeatured: updated.is_featured ?? editingProduct.isFeatured,
          mediaUrl: formData.mediaUrl || editingProduct.mediaUrl
        };
        setMyProducts(prev => {
          const next = prev.map(p => (p.id === editingProduct.id ? nextProduct : p));
          pushProducts(next);
          return next;
        });
      } else {
        const productId = `prod_${Date.now()}`;
        const created = await createSellerProduct({
          product_id: productId,
          alias: formData.name,
          category_id: formData.category,
          current_price: price,
          stock_level: stockLevel || 10,
          stock_status: stockStatus
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
          name: created.alias || formData.name,
          description: formData.description,
          price: Number(created.current_price ?? price),
          category: created.category_id || formData.category,
          mediaUrl: toPlaceholderImage(created.alias || productId),
          mediaType: 'image',
          tags: [],
          stockLevel: Number(created.stock_level ?? stockLevel),
          stockStatus: (created.stock_status as Product['stockStatus']) || stockStatus,
          location: seller.location,
          expiryDate: formData.expiryDate,
          discountPrice: created.discount_price ?? undefined,
          isFeatured: created.is_featured
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
      await updateSellerProfile({
        name: profileData.name,
        description: profileData.description
      });
      const existing = sellerLocations[0];
      if (profileData.address) {
        if (existing?.id) {
          await updateSellerLocation(existing.id, { address: profileData.address, lat: existing.lat, lng: existing.lng });
        } else {
          await createSellerLocation({ address: profileData.address, lat: seller.location?.lat, lng: seller.location?.lng });
        }
      }
      const refreshedProfile = await getSellerProfile();
      const refreshedLocations = await listSellerLocations();
      setSellerLocations(refreshedLocations);
      setSeller(prev => ({
        ...prev,
        name: refreshedProfile?.name || profileData.name,
        description: refreshedProfile?.description || profileData.description,
        avatar: refreshedProfile?.logo_url || prev.avatar,
        location: refreshedLocations[0]
          ? { lat: refreshedLocations[0].lat || prev.location?.lat || 0, lng: refreshedLocations[0].lng || prev.location?.lng || 0, address: refreshedLocations[0].address || profileData.address }
          : prev.location
      }));
      setSettingsStatus('Profile updated.');
    } catch (err: any) {
      setSettingsStatus(err?.message || 'Unable to update profile.');
    }
  };

  const applyReceiptSimulation = async () => {
    setProductsStatus(null);
    try {
      const result = await bulkImportSellerProducts();
      const refreshed = await listSellerProducts();
      const mapped = mapSellerProducts(refreshed);
      setMyProducts(mapped);
      pushProducts(mapped);
      await loadMediaForProducts(mapped);
      const [insights, lowStock] = await Promise.all([
        listSellerProductInsights(),
        listSellerLowStock()
      ]);
      setProductInsights(insights);
      setProductLowStock(lowStock);
      setProductsStatus(result?.import_id ? `Receipts queued. Import ${result.import_id}.` : 'Receipts queued for processing.');
      onToast?.('Receipts queued for processing.');
    } catch (err: any) {
      setProductsStatus(err?.message || 'Unable to upload receipts.');
    }
  };

  const applyPriceMatch = async () => {
    if (myProducts.length === 0) return;
    const target = myProducts[0];
    const nextPrice = Math.max(1, target.price - 5);
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

  const applyBulkUpdate = async () => {
    setProductsStatus(null);
    try {
      const result = await bulkStockUpdateSellerProducts();
      const refreshed = await listSellerProducts();
      const mapped = mapSellerProducts(refreshed);
      setMyProducts(mapped);
      pushProducts(mapped);
      await loadMediaForProducts(mapped);
      const [insights, lowStock] = await Promise.all([
        listSellerProductInsights(),
        listSellerLowStock()
      ]);
      setProductInsights(insights);
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
                stockStatus: (updated.stock_status as Product['stockStatus']) || (nextStock <= 0 ? 'out_of_stock' : nextStock < 5 ? 'low_stock' : 'in_stock')
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
      const items = await listBroadcasts(50);
      setBroadcasts(items);
      setBroadcastCount(items.length);
      onToast?.('Broadcast sent to followers.');
    } catch (err: any) {
      setCommsStatus(err?.message || 'Broadcast failed.');
    }
  };

  const handleWhatsAppSummaryRequest = async () => {
    setAnalyticsStatus(null);
    try {
      const resp = await requestSellerWhatsAppDailySummary();
      const status = resp?.status || 'queued';
      setAnalyticsStatus(`WhatsApp summary ${status}.`);
    } catch (err: any) {
      setAnalyticsStatus(err?.message || 'Unable to send WhatsApp summary.');
    }
  };

  const handleCommsWhatsAppSummary = async () => {
    setCommsStatus(null);
    const summary = `Daily summary: ${dailyViews} views, ${dailyInquiries} inquiries, ${funnelSales} sales.`;
    try {
      const resp = await sendWhatsApp({ content: summary });
      if (resp?.id) {
        try {
          const status = await getCommsWhatsAppStatus(resp.id);
          if (status?.status) {
            setCommsStatus(`WhatsApp ${status.status}.`);
          }
        } catch {}
      } else {
        setCommsStatus(resp?.status ? `WhatsApp ${resp.status}.` : 'WhatsApp message queued.');
      }
    } catch (err: any) {
      setCommsStatus(err?.message || 'Unable to send WhatsApp summary.');
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

  const handleFollowerNotificationsToggle = async (field: keyof typeof notificationPrefs) => {
    const previous = { ...notificationPrefs };
    const next = { ...notificationPrefs, [field]: !notificationPrefs[field] };
    setNotificationPrefs(next);
    setNotificationsUpdating(true);
    setSettingsStatus(null);
    try {
      await updateSellerNotificationPreferences({
        ...next,
        followers: true
      });
      setSettingsStatus('Notification preferences updated.');
    } catch (err: any) {
      setSettingsStatus(err?.message || 'Unable to update notifications.');
      setNotificationPrefs(previous);
    } finally {
      setNotificationsUpdating(false);
    }
  };

  const handleAllNotificationsToggle = async () => {
    const previous = { ...notificationPrefs };
    const enableAll = !(notificationPrefs.email || notificationPrefs.in_app || notificationPrefs.whatsapp || notificationPrefs.sms);
    const next = {
      ...notificationPrefs,
      email: enableAll,
      in_app: enableAll,
      whatsapp: enableAll,
      sms: enableAll
    };
    setNotificationPrefs(next);
    setNotificationsUpdating(true);
    setSettingsStatus(null);
    try {
      await updateSellerNotificationPreferences({
        ...next,
        followers: true
      });
      setSettingsStatus('Notification preferences updated.');
    } catch (err: any) {
      setSettingsStatus(err?.message || 'Unable to update notifications.');
      setNotificationPrefs(previous);
    } finally {
      setNotificationsUpdating(false);
    }
  };

  const loanBase = Math.round((Math.min(850, seller.sokoScore) / 850) * 150000);
  const loanRevenueBoost = Math.round(estimatedMonthlyRevenue * 0.4);
  const loanEligibilityMax = Math.max(50000, Math.min(300000, loanBase + loanRevenueBoost));
  const loanEligibilityMin = Math.max(50000, Math.round(loanEligibilityMax * 0.35));

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

  const refreshAdminSupplierApps = async () => {
    if (!isAdmin) return;
    setAdminSupplierAppsStatus(null);
    setAdminSupplierAppsLoading(true);
    try {
      const apps = await listSupplierApplicationsAdmin();
      setAdminSupplierApps(apps || []);
    } catch (err: any) {
      setAdminSupplierAppsStatus(err?.message || 'Unable to load supplier applications.');
    } finally {
      setAdminSupplierAppsLoading(false);
    }
  };

  const handleApproveSupplierApp = async (id: string) => {
    setAdminSupplierAppsStatus(null);
    try {
      await approveSupplierApplication(id, {
        decision_reason: adminDecisionReasons[id] || ''
      });
      await refreshAdminSupplierApps();
    } catch (err: any) {
      setAdminSupplierAppsStatus(err?.message || 'Unable to approve application.');
    }
  };

  const handleRejectSupplierApp = async (id: string) => {
    setAdminSupplierAppsStatus(null);
    try {
      await rejectSupplierApplication(id, {
        decision_reason: adminDecisionReasons[id] || ''
      });
      await refreshAdminSupplierApps();
    } catch (err: any) {
      setAdminSupplierAppsStatus(err?.message || 'Unable to reject application.');
    }
  };

  const baseLocation = userCoords || seller.location || null;
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
          return [thread.id, responses] as const;
        } catch {
          return [thread.id, []] as const;
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
        setRfqThreadsRemote(prev => [created, ...prev]);
        setRfqItemsById(prev => ({ ...prev, [created.id]: items }));
        setSelectedThreadId(created.id);
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

  const sellersWithMeta = SELLERS.map((s) => {
    const sellerOrders = ORDERS.filter(o => o.sellerId === s.id);
    const sellerRevenue = sellerOrders.reduce((sum, o) => sum + o.unitPrice * o.quantity, 0);
    const avgOrderValue = sellerOrders.length ? sellerRevenue / sellerOrders.length : 0;
    const categories = Array.from(new Set(PRODUCTS.filter(p => p.sellerId === s.id).map(p => p.category)));
    const distance = baseLocation && s.location
      ? calculateDistance(baseLocation.lat, baseLocation.lng, s.location.lat, s.location.lng)
      : null;
    const score = s.rating * 20 * 0.5 + (distance ? Math.max(0, 100 - (distance / Math.max(sellerFilters.maxDistance, 1)) * 100) : 40) * 0.3 + Math.min(100, sellerRevenue / 100) * 0.2;
    return { seller: s, categories, avgOrderValue, distance, score };
  }).filter(({ seller, categories, avgOrderValue, distance }) => {
    if (sellerFilters.category && !categories.includes(sellerFilters.category)) return false;
    if (sellerFilters.verifiedOnly && !seller.isVerified) return false;
    if (sellerFilters.minRating && seller.rating < sellerFilters.minRating) return false;
    if (sellerFilters.minOrderValue && avgOrderValue < sellerFilters.minOrderValue) return false;
    if (sellerFilters.maxDistance && distance !== null && distance > sellerFilters.maxDistance) return false;
    return true;
  }).sort((a, b) => b.score - a.score);



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

  return (
    <div className="h-full bg-zinc-50 flex flex-col">
      {/* Sidebar / Nav */}
      <div className="flex border-b bg-white overflow-x-auto no-scrollbar">
        {[
          { id: 'onboarding', icon: Sparkles, label: 'Onboarding' },
          { id: 'products', icon: Package, label: 'Products' },
          { id: 'analytics', icon: BarChart3, label: 'Intelligence' },
          { id: 'rewards', icon: Star, label: 'Rewards' },
          { id: 'marketing', icon: Megaphone, label: 'Marketing' },
          { id: 'growth', icon: Wallet, label: 'Growth' },
          { id: 'suppliers', icon: MapPin, label: 'Suppliers' },
          { id: 'comms', icon: MessageSquare, label: 'Comms' },
          { id: 'offline', icon: Clock, label: 'Offline' },
          { id: 'settings', icon: Settings, label: 'Shop Profile' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-none px-6 flex flex-col items-center py-3 gap-1 transition-colors ${
              activeTab === tab.id ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-zinc-400'
            }`}
          >
            <tab.icon className="w-5 h-5" />
            <span className="text-[10px] font-bold uppercase tracking-wider">{tab.label}</span>
          </button>
        ))}
      </div>

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
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">WhatsApp-Based Onboarding</p>
                  <p className="text-sm font-bold text-zinc-900">Send “Hi” → guided flow creates your shop</p>
                </div>
                <button
                  onClick={() => setShowOnboardingModal(true)}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-[10px] font-black"
                >
                  Start on WhatsApp
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3 text-[10px] font-bold text-zinc-600">
                <div className="p-3 bg-zinc-50 rounded-2xl">1. Jina la duka</div>
                <div className="p-3 bg-zinc-50 rounded-2xl">2. Eneo la duka</div>
                <div className="p-3 bg-zinc-50 rounded-2xl">3. Aina ya bidhaa</div>
                <div className="p-3 bg-zinc-50 rounded-2xl">4. Tuma picha za bidhaa</div>
              </div>
              <div className="mt-4 text-[10px] text-zinc-500 font-bold">Voice onboarding available for low-literacy sellers.</div>
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
                  <p className="text-sm font-black text-zinc-900">soko.connect/shop/{seller.name.toLowerCase().replace(/\s/g, '')}</p>
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
                5 customers uploaded receipts from your shop this week.
              </div>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={handleClaimShop}
                  className="flex-1 py-3 bg-emerald-600 text-white rounded-xl text-[10px] font-black"
                >
                  Claim Shop (KES 200 bonus)
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
                <p className="text-[10px] text-zinc-500">{seller.location?.address || 'Kawangware, Stage Road'} • Open 7am-9pm</p>
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
                            setFormData({
                              name: p.name,
                              description: p.description,
                              price: (p.price * 0.7).toFixed(2),
                              category: p.category,
                              mediaUrl: p.mediaUrl,
                              stockLevel: p.stockLevel,
                              expiryDate: p.expiryDate || ''
                            });
                            setEditingProduct(p);
                            setIsAddingProduct(true);
                          }}
                          className="px-3 py-1.5 bg-amber-600 text-white rounded-lg text-[10px] font-bold shadow-sm"
                        >
                          Clearance Promotion (30% Off)
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
                <button onClick={applyReceiptSimulation} className="mt-3 w-full py-3 bg-emerald-600 text-white rounded-xl text-[10px] font-black">
                  Upload Daily Receipts
                </button>
                <div className="mt-3 p-3 bg-emerald-50 rounded-2xl text-[10px] font-bold text-emerald-700">
                  Today: Unga sold 15 • Stock left 5 • Sales KES 8,450
                </div>
              </div>
              <div className="bg-white rounded-3xl border border-zinc-100 p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <MessageSquare className="w-4 h-4 text-indigo-600" />
                  <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400">WhatsApp Inventory Commands</h3>
                </div>
                <div className="space-y-2 text-[10px] font-bold text-zinc-600">
                  <div className="p-2 bg-zinc-50 rounded-xl">"Bei Unga 185" → price updated</div>
                  <div className="p-2 bg-zinc-50 rounded-xl">"Stock Unga 25" → stock updated</div>
                  <div className="p-2 bg-zinc-50 rounded-xl">"Remove Sukari" → product hidden</div>
                </div>
                <button onClick={applyBulkUpdate} className="mt-3 w-full py-3 bg-zinc-900 text-white rounded-xl text-[10px] font-black">
                  Try WhatsApp Update
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
                    onClick={applyReceiptSimulation}
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
                      {product.stockLevel < 10 && (
                        <div className="flex items-center gap-1 px-1.5 py-0.5 bg-red-50 rounded text-[8px] font-bold text-red-600 uppercase">
                          <AlertCircle className="w-2 h-2" /> Low Stock: {product.stockLevel}
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
                  <button className="flex-1 py-3 bg-emerald-600 text-white rounded-xl text-[10px] font-black">Boost Unga (KES 100)</button>
                  <button className="flex-1 py-3 bg-zinc-100 text-zinc-600 rounded-xl text-[10px] font-black">Update Stock</button>
                </div>
              </div>
              <div className="bg-white rounded-3xl border border-zinc-100 p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <LineChartIcon className="w-4 h-4 text-indigo-600" />
                  <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400">Competitive Intelligence</h3>
                </div>
                <div className="p-3 bg-indigo-50 rounded-2xl text-[10px] font-bold text-indigo-700">
                  Price position {Math.round((analyticsMarket?.price_position ?? 0) * 100)}% • Market median KES {Math.round(analyticsMarket?.competitor_median_price ?? averagePrice)} • Market share {Math.round((analyticsMarket?.market_share ?? 0) * 100)}%
                </div>
                <div className="mt-3 flex gap-2">
                <button onClick={applyPriceMatch} className="flex-1 py-3 bg-indigo-600 text-white rounded-xl text-[10px] font-black">Match KES 175</button>
                <button className="flex-1 py-3 bg-zinc-100 text-zinc-600 rounded-xl text-[10px] font-black">View All Prices</button>
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
                  <p className="text-[10px] text-white/60 font-black">Rank</p>
                  <p className="text-sm font-black">🥉 #3 Mombasa</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 text-[10px] font-bold">
                <div className="bg-white/10 rounded-2xl p-3">
                  <p className="text-white/60 uppercase">Stars</p>
                  <p className="text-sm font-black">{Math.round(seller.sokoScore * 1.4)}</p>
                </div>
                <div className="bg-white/10 rounded-2xl p-3">
                  <p className="text-white/60 uppercase">Revenue</p>
                  <p className="text-sm font-black">KSh {estimatedMonthlyRevenue.toFixed(0)}</p>
                </div>
                <div className="bg-white/10 rounded-2xl p-3">
                  <p className="text-white/60 uppercase">Network</p>
                  <p className="text-sm font-black">16k dukas</p>
                </div>
              </div>
              <div className="mt-4 bg-white/10 rounded-2xl p-3">
                <p className="text-[10px] font-black text-white/70 mb-2">Data Sources (Active)</p>
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
              </div>
            </div>

            {/* Unified Demand Intelligence */}
            <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold">Live Demand Forecasts</h3>
                <button className="px-3 py-2 bg-zinc-900 text-white rounded-xl text-[10px] font-bold">Stock Up</button>
              </div>
              <div className="space-y-3">
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
                <h3 className="text-sm font-bold">Verified Buyers</h3>
                <span className="text-[10px] font-bold text-emerald-600">Repeat rate: 67%</span>
              </div>
              <div className="space-y-2 text-[10px] font-bold text-zinc-600">
                {analyticsGodViewBuyers.map(buyer => (
                  <div key={`${buyer.name}-${buyer.item}`} className="flex items-center justify-between bg-zinc-50 rounded-2xl p-2">
                    <span>{buyer.name} ({buyer.source})</span>
                    <span>{buyer.item} • {buyer.price}</span>
                  </div>
                ))}
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
                <span className="text-[10px] font-bold text-emerald-600">+247⭐ earned today</span>
              </div>
              <div className="space-y-2 text-[10px] font-bold text-zinc-600">
                <div className="flex items-center justify-between bg-zinc-50 rounded-2xl p-2"><span>QR Scans</span><span>● {analyticsSourceMap.QR ?? 0} today</span></div>
                <div className="flex items-center justify-between bg-zinc-50 rounded-2xl p-2"><span>Shelf Photos</span><span>● {analyticsSourceMap.Photos ?? 0} shelves</span></div>
                <div className="flex items-center justify-between bg-zinc-50 rounded-2xl p-2"><span>MyDuka POS</span><span>● {analyticsSourceMap.POS ?? 0} products</span></div>
                <div className="flex items-center justify-between bg-zinc-50 rounded-2xl p-2"><span>SAP B1</span><span>● {Math.round((analyticsSourceMap.POS ?? 0) * 1.4)} items</span></div>
                <div className="flex items-center justify-between bg-zinc-50 rounded-2xl p-2"><span>Zoho CRM</span><span>● {analyticsSourceMap.CRM ?? 0} contacts</span></div>
              </div>
            </div>

            {/* Actionable Alerts */}
            <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold">Action Required</h3>
                <div className="flex gap-2">
                  <button className="px-3 py-2 bg-zinc-900 text-white rounded-xl text-[10px] font-bold">Stock Omo</button>
                  <button className="px-3 py-2 bg-emerald-600 text-white rounded-xl text-[10px] font-bold">Photo Now</button>
                </div>
              </div>
              <div className="space-y-2 text-[10px] font-bold text-zinc-600">
                {analyticsGodViewAlerts.map(alert => (
                  <div key={alert} className="p-2 bg-zinc-50 rounded-2xl">{alert}</div>
                ))}
              </div>
            </div>

            {/* Neighborhood Heatmap */}
            <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold">Neighborhood Heatmap</h3>
                <span className="text-[10px] font-bold text-zinc-400">Your rank #3 vs 127 dukas</span>
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
                <span className="text-[10px] font-bold text-emerald-400">KSh2k →</span>
              </div>
              <div className="space-y-2 text-[10px] font-bold text-white/80">
                <div>✓ Full buyer phone numbers</div>
                <div>✓ Competitor stock levels</div>
                <div>✓ API exports</div>
              </div>
              <div className="mt-3 text-[10px] text-white/70 font-bold">“127 buyers waiting…”</div>
            </div>

            {/* Key Metrics Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-5 rounded-3xl border border-zinc-100 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-indigo-50 rounded-xl">
                    <TrendingUp className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div className="flex items-center gap-1 text-emerald-500 font-bold text-xs">
                    <ArrowUpRight className="w-3 h-3" /> 12.5%
                  </div>
                </div>
                <p className="text-[10px] text-zinc-400 font-black uppercase tracking-widest">Total Revenue</p>
                <p className="text-2xl font-black text-zinc-900 mt-1">$12,450.00</p>
              </div>
              <div className="bg-white p-5 rounded-3xl border border-zinc-100 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-emerald-50 rounded-xl">
                    <Users className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div className="flex items-center gap-1 text-emerald-500 font-bold text-xs">
                    <ArrowUpRight className="w-3 h-3" /> 8.2%
                  </div>
                </div>
                <p className="text-[10px] text-zinc-400 font-black uppercase tracking-widest">Customer Reach</p>
                <p className="text-2xl font-black text-zinc-900 mt-1">45.2k</p>
              </div>
            </div>

            {/* Business KPI Suite */}
            <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-black uppercase tracking-widest text-zinc-400">Business KPIs</h3>
                  <p className="text-[10px] text-zinc-500">Estimated from current catalog and activity</p>
                </div>
                <div className="px-2 py-1 bg-zinc-100 rounded-full text-[10px] font-bold text-zinc-500 uppercase">Estimated</div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'CAC', value: `KES ${Math.round(marketingCAC)}` },
                  { label: 'ROAS', value: `${marketingROAS.toFixed(1)}x` },
                  { label: 'LTV', value: `KES ${Math.round(marketingLTV)}` },
                  { label: 'Gross Margin', value: `${grossMarginPct.toFixed(0)}%` },
                  { label: 'Net Margin', value: `${netMarginPct.toFixed(0)}%` },
                  { label: 'Return Rate', value: `${returnRate.toFixed(1)}%` },
                  { label: 'Cart Abandon', value: `${cartAbandonRate.toFixed(0)}%` },
                  { label: 'Items/Order', value: `${avgItemsPerOrder.toFixed(1)}` },
                  { label: 'Promo Lift', value: `${promoLift}%` },
                  { label: 'Repeat Interval', value: `${repeatPurchaseIntervalDays} days` },
                  { label: 'On-time Rate', value: `${onTimeRate}%` },
                  { label: 'CSAT', value: `${csat.toFixed(1)}/5` }
                ].map(metric => (
                  <div key={metric.label} className="p-3 bg-zinc-50 rounded-2xl">
                    <p className="text-[10px] font-black uppercase text-zinc-400">{metric.label}</p>
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
                  <p className="text-[10px] text-zinc-500">Unlimited scans driving your stars</p>
                </div>
                <div className="px-2 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black">+50⭐ unlocked</div>
              </div>
              <div className="grid grid-cols-3 gap-3 text-[10px] font-bold text-zinc-600">
                <div className="p-3 bg-zinc-50 rounded-2xl">
                  <p className="text-[9px] text-zinc-400 uppercase">Today scans</p>
                  <p className="text-sm font-black text-zinc-900">127</p>
                </div>
                <div className="p-3 bg-zinc-50 rounded-2xl">
                  <p className="text-[9px] text-zinc-400 uppercase">Stars earned</p>
                  <p className="text-sm font-black text-zinc-900">+50</p>
                </div>
                <div className="p-3 bg-zinc-50 rounded-2xl">
                  <p className="text-[9px] text-zinc-400 uppercase">Rank</p>
                  <p className="text-sm font-black text-zinc-900">#3 Mombasa</p>
                </div>
              </div>
              <div className="mt-4 h-40 rounded-2xl bg-zinc-100 flex items-center justify-center text-[10px] font-bold text-zinc-500">
                Live buyer map: Kibera 42 scans, CBD 85 scans
              </div>
              <div className="mt-3 text-[10px] text-zinc-500 font-bold">Daily nudge: “127 buyers scanned today! Photo fresh stock?”</div>
            </div>

            {/* Demand Alerts */}
            <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold">Demand Alerts</h3>
                <span className="text-[10px] text-emerald-600 font-bold">Actionable</span>
              </div>
              <div className="space-y-3">
                {analyticsTrendingProducts.map((item) => (
                  <div key={item.name} className="p-3 bg-zinc-50 rounded-2xl flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-zinc-900">{item.name}</p>
                      <p className="text-[10px] text-zinc-500">Demand: {item.demand} • Supplier: {item.supplier}</p>
                    </div>
                    <button className="px-3 py-2 bg-zinc-900 text-white rounded-xl text-[10px] font-bold">
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
                    <button className="px-3 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-bold">
                      Add Stock
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Peak Hours */}
            <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold">Peak Hours Report</h3>
                <span className="text-[10px] text-zinc-400 font-bold">Search intensity</span>
              </div>
              <div className="h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analyticsPeakHours}>
                    <defs>
                      <linearGradient id="peakFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="hour" tick={{ fontSize: 10 }} />
                    <YAxis hide />
                    <Tooltip />
                    <Area type="monotone" dataKey="searches" stroke="#6366f1" fill="url(#peakFill)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Sales Velocity */}
            <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold">Sales Velocity Trends</h3>
                <span className="text-[10px] text-emerald-600 font-bold">Target 40/day</span>
              </div>
              <div className="h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={analyticsSalesVelocity}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis hide />
                    <Tooltip />
                    <Line type="monotone" dataKey="velocity" stroke="#10b981" strokeWidth={2} />
                    <Line type="monotone" dataKey="target" stroke="#f59e0b" strokeWidth={2} strokeDasharray="4 4" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Competitor Price Benchmarks */}
            <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold">Competitor Price Benchmarks</h3>
                <span className="text-[10px] text-zinc-400 font-bold">Market comparison</span>
              </div>
              <div className="space-y-3">
                {analyticsCompetitorPricing.map((item) => (
                  <div key={item.name} className="p-3 bg-zinc-50 rounded-2xl">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-bold text-zinc-900">{item.name}</p>
                      <span className="text-[10px] font-bold text-zinc-500">Avg: ${item.avgPrice}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-600">
                      <span>Your: ${item.yourPrice}</span>
                      <span>Min: ${item.competitorMin}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Sales Performance Chart */}
            <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-black uppercase tracking-widest text-zinc-400">Sales Performance</h3>
                <select className="text-[10px] font-bold bg-zinc-50 border-none rounded-lg px-2 py-1">
                  <option>Last 7 Days</option>
                  <option>Last 30 Days</option>
                </select>
              </div>
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
                    <Tooltip 
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      labelStyle={{ fontWeight: 800, color: '#18181b' }}
                    />
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
            </div>

            {/* Sales Velocity Trends */}
            <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-sm font-black uppercase tracking-widest text-zinc-400">Sales Velocity Trends</h3>
                  <p className="text-[10px] text-zinc-400 mt-1">Units sold per day vs Target</p>
                </div>
                <div className="p-2 bg-indigo-50 rounded-xl">
                  <LineChartIcon className="w-5 h-5 text-indigo-600" />
                </div>
              </div>
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
                    <Tooltip 
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    />
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
            </div>

            {/* Inventory & Data Management */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm">
                <h3 className="text-sm font-black uppercase tracking-widest text-zinc-400 mb-4">Inventory Management</h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Stockout Rate', value: `${stockoutRate.toFixed(1)}%` },
                    { label: 'Sell-Through', value: `${sellThroughRate.toFixed(1)}%` },
                    { label: 'Inventory Turns', value: `${inventoryTurns.toFixed(1)}x` },
                    { label: 'GMROI', value: `${gmroi.toFixed(2)}x` },
                    { label: 'Price Index', value: `${priceCompetitiveness.toFixed(0)}%` },
                    { label: 'Lost Sales', value: `KES ${lostSalesEstimate}` }
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
                    { label: 'Coverage', value: `${dataCoverageRate.toFixed(0)}%` },
                    { label: 'Freshness', value: `${Math.round(dataFreshnessDays)} days` },
                    { label: 'Verification', value: `${verificationRate.toFixed(0)}%` },
                    { label: 'Anomaly Rate', value: `${anomalyRate.toFixed(1)}%` }
                  ].map(metric => (
                    <div key={metric.label} className="p-3 bg-zinc-50 rounded-2xl">
                      <p className="text-[10px] font-black uppercase text-zinc-400">{metric.label}</p>
                      <p className="text-sm font-black text-zinc-900 mt-1">{metric.value}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex items-center justify-between text-[10px] text-zinc-500 font-bold">
                  <span>Receipt match rate</span>
                  <span>{Math.min(98, verificationRate + 2).toFixed(0)}%</span>
                </div>
                <div className="mt-2 flex items-center justify-between text-[10px] text-zinc-500 font-bold">
                  <span>Geo completeness</span>
                  <span>{dataCoverageRate.toFixed(0)}%</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-zinc-100 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold">Peak Hours Report</h3>
                <span className="text-[10px] text-zinc-400 font-bold">Updated today</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {['Mon-Wed 5-7pm', 'Thu-Fri 4-8pm', 'Sat 10am-2pm'].map(slot => (
                  <div key={slot} className="px-3 py-2 bg-zinc-50 rounded-xl text-[10px] font-bold text-zinc-600">
                    {slot}
                  </div>
                ))}
              </div>
            </div>

            {/* Channel Mix */}
            <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-black uppercase tracking-widest text-zinc-400">Channel Mix</h3>
                <span className="text-[10px] text-zinc-400 font-bold">Traffic sources</span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {channelMix.map(c => (
                  <div key={c.name} className="p-3 bg-zinc-50 rounded-2xl text-center">
                    <p className="text-xs font-black text-zinc-900">{c.value}%</p>
                    <p className="text-[10px] text-zinc-400 font-bold uppercase">{c.name}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Searched & Peak Hours */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-widest text-zinc-400">Top Searched (Your Area)</h3>
                    <p className="text-[10px] text-zinc-400 mt-1">Opportunity for inventory expansion</p>
                  </div>
                  <div className="p-2 bg-zinc-50 rounded-xl">
                    <SearchIcon className="w-5 h-5 text-zinc-400" />
                  </div>
                </div>
                <div className="space-y-4">
                  {analyticsTopSearched.map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-zinc-50 rounded-2xl">
                      <div>
                        <p className="text-xs font-bold text-zinc-900">{item.name}</p>
                        <p className="text-[10px] text-zinc-400">{item.searches} searches this week</p>
                      </div>
                      <span className="text-[10px] font-black text-emerald-500">{item.trend}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-widest text-zinc-400">Peak Hours Report</h3>
                    <p className="text-[10px] text-zinc-400 mt-1">Optimal operating times</p>
                  </div>
                  <div className="p-2 bg-zinc-50 rounded-xl">
                    <Clock className="w-5 h-5 text-zinc-400" />
                  </div>
                </div>
                <div className="h-48 w-full">
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
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      />
                      <Bar dataKey="searches" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <p className="text-[10px] text-zinc-500 mt-4 font-medium italic">
                  "Most searches in your area happen 5-7pm. Consider staying open later."
                </p>
              </div>
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
                    <button className="px-3 py-1.5 bg-zinc-900 text-white rounded-lg text-[10px] font-bold">
                      Connect
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Stock Health & AI Insights */}
            <div className="grid grid-cols-1 gap-6">
              <div className="bg-zinc-900 text-white p-6 rounded-3xl shadow-xl relative overflow-hidden">
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-6">
                    <Sparkles className="w-5 h-5 text-indigo-400" />
                    <h3 className="text-sm font-black uppercase tracking-widest">AI Strategic Insights</h3>
                  </div>
                  <div className="space-y-4">
                    <div className="flex gap-4 items-start">
                      <div className="p-2 bg-indigo-500/20 rounded-xl shrink-0">
                        <TrendingUp className="w-4 h-4 text-indigo-400" />
                      </div>
                      <div>
                        <p className="text-xs font-bold mb-1">Demand Surge Detected</p>
                        <p className="text-[10px] text-zinc-400 leading-relaxed">
                          Accessories category is trending 25% higher than your current inventory levels. Consider restocking "Bamboo Watch" variants.
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-4 items-start">
                      <div className="p-2 bg-amber-500/20 rounded-xl shrink-0">
                        <AlertCircle className="w-4 h-4 text-amber-400" />
                      </div>
                      <div>
                        <p className="text-xs font-bold mb-1">Pricing Optimization</p>
                        <p className="text-[10px] text-zinc-400 leading-relaxed">
                          Your "Quantum Headphones" are priced 12% above the platform average. A temporary 5% discount could increase conversion by 18%.
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-4 items-start bg-indigo-500/10 p-3 rounded-2xl border border-indigo-500/20">
                      <div className="p-2 bg-indigo-500/20 rounded-xl shrink-0">
                        <Zap className="w-4 h-4 text-indigo-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-bold mb-1 text-indigo-300">Demand Alert</p>
                        <p className="text-[10px] text-zinc-400 leading-relaxed">
                          5 people searched for "Eco Tote" near your shop today. You have it in stock. Want to feature it?
                        </p>
                        <button className="mt-2 px-3 py-1 bg-indigo-600 text-white rounded-lg text-[10px] font-bold">
                          Feature Now
                        </button>
                      </div>
                    </div>
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
                    <p className="text-2xl font-black text-zinc-900">{dailyViews}</p>
                    <p className="text-[10px] text-emerald-500 font-bold">+{viewsDeltaPct}% from yesterday</p>
                  </div>
                  <div className="p-4 bg-zinc-50 rounded-2xl">
                    <p className="text-[10px] text-zinc-400 font-bold uppercase">Inquiries</p>
                    <p className="text-2xl font-black text-zinc-900">{dailyInquiries}</p>
                    <p className="text-[10px] text-emerald-500 font-bold">+{inquiriesDeltaPct}% from yesterday</p>
                  </div>
                </div>
                <p className="text-[10px] text-zinc-500 mt-4 text-center font-medium">
                  "Today: {dailyViews} people saw your products. {dailyInquiries} clicked to message you."
                </p>
              </div>

              {/* WhatsApp Daily Summary Simulation */}
              <div 
                onClick={() => {
                  handleWhatsAppSummaryRequest();
                  setShowWhatsAppModal(true);
                }}
                className="bg-emerald-50 border border-emerald-100 p-6 rounded-3xl cursor-pointer hover:bg-emerald-100 transition-colors"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-emerald-500 rounded-xl">
                    <MessageSquare className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-emerald-900">WhatsApp Daily Summary</h3>
                    <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">Automated Report</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="bg-white/50 p-3 rounded-xl text-[11px] text-emerald-800 italic">
                    "Hi {seller.name}! Yesterday you had {dailyViews} views and {funnelSales} sales. Click to view full report."
                  </div>
                  <button className="w-full py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold shadow-lg shadow-emerald-500/20">
                    View Full Summary
                  </button>
                </div>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold">WhatsApp Business Tools</h3>
                  <div className="p-2 bg-emerald-50 rounded-xl">
                    <MessageSquare className="w-5 h-5 text-emerald-600" />
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="p-4 bg-zinc-50 rounded-2xl">
                    <p className="text-xs font-bold mb-1">Inventory via WhatsApp</p>
                    <p className="text-[10px] text-zinc-500 leading-relaxed">
                      Send "Add new stock" + Photo + Price to our number to list products instantly.
                    </p>
                  </div>
                  <div className="p-4 bg-zinc-50 rounded-2xl">
                    <p className="text-xs font-bold mb-1 text-emerald-700">WhatsApp Onboarding</p>
                    <p className="text-[10px] text-zinc-500 leading-relaxed">
                      Invite fellow sellers! They can send "Hi" to start their shop setup without the app.
                    </p>
                  </div>
                </div>
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
                { label: 'Revenue (30d)', value: `KES ${marketingRevenue30d.toFixed(0)}`, hint: 'Completed orders' },
                { label: 'Orders (30d)', value: `${marketingOrders30d}`, hint: 'All channels' },
                { label: 'New Customers', value: `${marketingNewCustomers}`, hint: 'First-time buyers' },
                { label: 'ROAS', value: `${marketingROAS.toFixed(2)}x`, hint: 'Revenue / spend' }
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
                { label: 'CAC', value: `KES ${Math.round(marketingCAC)}`, hint: 'Cost per customer' },
                { label: 'ROAS', value: `${marketingROAS.toFixed(1)}x`, hint: 'Revenue / spend' },
                { label: 'LTV', value: `KES ${Math.round(marketingLTV)}`, hint: 'Value per customer' }
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
                <span className="text-[10px] font-bold text-indigo-600">Last 30 days</span>
              </div>
              <div className="grid grid-cols-4 gap-3 text-center">
                {[
                  { label: 'Customers', value: marketingNewCustomers },
                  { label: 'Orders', value: marketingOrders30d },
                  { label: 'Units', value: marketingUnits30d },
                  { label: 'Returns', value: marketingReturns30d }
                ].map((step) => (
                  <div key={step.label} className="bg-zinc-50 rounded-2xl p-3">
                    <p className="text-xs font-black text-zinc-900">{step.value.toLocaleString()}</p>
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
                <div className="absolute inset-0 opacity-40 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)', backgroundSize: '22px 22px' }} />
                {demandHeatmap.map((p) => {
                  const top = ((p.location!.lat - 34) * 11) % 80 + 10;
                  const left = ((p.location!.lng + 120) * 11) % 80 + 10;
                  const size = Math.max(18, Math.min(54, p.demand));
                  return (
                    <div
                      key={p.id}
                      className="absolute rounded-full bg-rose-500/30 border border-rose-500/40 backdrop-blur-sm"
                      style={{ top: `${top}%`, left: `${left}%`, width: `${size}px`, height: `${size}px` }}
                      title={`${p.name} • Demand ${p.demand}`}
                    />
                  );
                })}
                <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full text-[10px] font-bold text-zinc-700">
                  Warmer circles = higher demand
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
              <p className="text-xs text-zinc-500 mb-4">Boost your visibility for 7 days. Reach up to 5x more customers.</p>
              
              {myProducts.length >= 50 ? (
                <div className="mb-4 p-3 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center gap-2">
                  <Zap className="w-4 h-4 text-emerald-600" />
                  <p className="text-[10px] text-emerald-700 font-bold">Scale Discount Active! 20% off featured rates for 50+ products.</p>
                </div>
              ) : (
                <p className="text-[10px] text-indigo-600 font-bold mb-4">Tip: List 50+ products to unlock a 20% discount on featured rates!</p>
              )}

              <button
                onClick={handleActivateFeatured}
                className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold text-xs shadow-lg shadow-indigo-500/20"
              >
                Activate for KES 500/week
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
              <p className="text-xs text-zinc-400 mb-6 italic">"Just got fresh stock of X. Notify your followers?"</p>
              <div className="flex gap-2">
                <select
                  className="flex-1 bg-zinc-800 border-none rounded-xl text-xs font-bold px-4 py-3"
                  value={stockAlertProductId}
                  onChange={(e) => setStockAlertProductId(e.target.value)}
                >
                  <option value="">Select Product...</option>
                  {myProducts.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
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
                  <div className="px-3 py-1 bg-white/20 rounded-full text-[10px] font-bold">Current Rank: #3</div>
                  <div className="px-3 py-1 bg-white/20 rounded-full text-[10px] font-bold">Rating: {seller.rating}</div>
                </div>
                <button
                  onClick={handleCreateCategorySpotlight}
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
                <button className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-lg text-xs font-bold hover:bg-white/20 transition-colors">
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
              <p className="text-[10px] text-zinc-500 font-bold">Daily receipts earn KES 20-50. Streak bonuses at 7 & 30 days.</p>
              <div className="mt-3 p-3 bg-emerald-50 rounded-2xl text-[10px] font-bold text-emerald-700">
                6-day streak • Bonus tomorrow: KES 100
              </div>
                <div className="mt-3 p-3 bg-zinc-50 rounded-2xl text-[10px] font-bold text-zinc-600">
                SC Wallet balance: {sellerBalance} SC
              </div>
              <button onClick={applyReceiptSimulation} className="mt-3 w-full py-3 bg-emerald-600 text-white rounded-xl text-[10px] font-black">
                Upload Receipts Now
              </button>
            </div>

            <div className="bg-white rounded-3xl border border-zinc-100 p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <Edit3 className="w-4 h-4 text-indigo-600" />
                <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400">Data Sharing Rewards</h3>
              </div>
              <div className="grid grid-cols-2 gap-3 text-[10px] font-bold text-zinc-600">
                <div className="p-3 bg-zinc-50 rounded-2xl">Price update: KES 10</div>
                <div className="p-3 bg-zinc-50 rounded-2xl">Stock update: KES 5</div>
                <div className="p-3 bg-zinc-50 rounded-2xl">Photo upload: KES 5</div>
                <div className="p-3 bg-zinc-50 rounded-2xl">Complete profile: KES 100</div>
              </div>
              <button onClick={applyBulkUpdate} className="mt-3 w-full py-3 bg-zinc-900 text-white rounded-xl text-[10px] font-black">
                Update Prices + Stock
              </button>
            </div>

            <div className="bg-white rounded-3xl border border-zinc-100 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold">Payout History</h3>
                <button
                  onClick={() => {
                    onSellerBalanceChange(0);
                    onSellerPayoutsChange([]);
                  }}
                  className="text-[10px] font-bold text-zinc-400"
                >
                  Clear
                </button>
              </div>
              <div className="space-y-2">
                {sellerPayouts.length === 0 && (
                  <div className="p-3 bg-zinc-50 rounded-2xl text-[10px] font-bold text-zinc-500">
                    No payouts yet.
                  </div>
                )}
                {sellerPayouts.map(p => (
                  <div key={p.id} className="p-3 bg-zinc-50 rounded-2xl text-[10px] font-bold text-zinc-600 flex items-center justify-between">
                    <span>{p.reason}</span>
                    <span className="text-emerald-600">+KES {p.amount}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-zinc-100 p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <Users className="w-5 h-5 text-indigo-600" />
                <div>
                  <h3 className="text-sm font-bold">Referral Rewards</h3>
                  <p className="text-[10px] text-zinc-400">KES 200 per shop • KES 500 per supplier</p>
                </div>
              </div>
              <button
                onClick={() => setShowReferralModal(true)}
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
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">WhatsApp Daily Summary</p>
                  <p className="text-sm font-bold text-zinc-900">Morning report + evening receipt reminder</p>
                </div>
                <button
                  onClick={() => {
                    handleCommsWhatsAppSummary();
                    setShowWhatsAppModal(true);
                  }}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-[10px] font-black"
                >
                  Preview Summary
                </button>
              </div>
              <div className="p-3 bg-zinc-50 rounded-2xl text-[10px] font-bold text-zinc-600">
                Alerts: demand spikes, stockouts, competitor price drops, weekly review.
              </div>
              {commsStatus && (
                <div className="mt-2 text-[10px] font-bold text-emerald-700">
                  {commsStatus}
                </div>
              )}
            </div>

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
                <button className="w-full py-3 bg-zinc-900 text-white rounded-xl text-[10px] font-black">Open Customer Inbox</button>
              </div>
              <div className="bg-white rounded-3xl border border-zinc-100 p-5 shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2">Supplier Chat</p>
                <button className="w-full py-3 bg-emerald-600 text-white rounded-xl text-[10px] font-black">Message Supplier</button>
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

        {activeTab === 'offline' && (
          <div className="space-y-6 pb-20">
            <h2 className="text-2xl font-black text-zinc-900">Offline & Accessibility</h2>

            <div className="bg-white rounded-3xl border border-zinc-100 p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <Phone className="w-4 h-4 text-emerald-600" />
                <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400">USSD Interface</h3>
              </div>
              <div className="p-3 bg-zinc-50 rounded-2xl text-[10px] font-bold text-zinc-600">
                Dial `*384*123#` → 1. Views 2. Update price 3. Update stock 4. Alerts
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-zinc-100 p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <MessageSquare className="w-4 h-4 text-indigo-600" />
                <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400">SMS Alerts</h3>
              </div>
              <div className="p-3 bg-indigo-50 rounded-2xl text-[10px] font-bold text-indigo-700">
                “Wateja 8 wanatafuta Sukari karibu nawe leo.”
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-zinc-100 p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <MessageSquare className="w-4 h-4 text-amber-500" />
                <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400">Voice Commands</h3>
              </div>
              <div className="p-3 bg-amber-50 rounded-2xl text-[10px] font-bold text-amber-700">
                Call and say: “Stock Unga 25” or “Bei Sukari 150”
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
                { label: 'Est. Monthly Revenue', value: `KES ${Math.round(cashflowIn || estimatedMonthlyRevenue)}` },
                { label: 'Avg Order Value', value: `KES ${averagePrice.toFixed(0)}` },
                { label: 'Repeat Rate', value: `${Math.round(growthRetention)}%` },
                { label: 'Stock Coverage', value: `${stockCoverageDays} days` }
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
                  <div className="px-2 py-1 bg-white/20 rounded-lg text-[10px] font-bold">Excellent</div>
                </div>
                <div className="flex items-end gap-2 mb-2">
                  <span className="text-5xl font-black">{Math.min(850, sokoscore)}</span>
                  <span className="text-emerald-200 text-sm font-bold mb-1">/ 850</span>
                </div>
                <p className="text-xs text-emerald-100 mb-6">Based on transaction volume, consistency, verification, and reviews.</p>
                <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                  <div className="h-full bg-white rounded-full" style={{ width: `${(Math.min(850, sokoscore) / 850) * 100}%` }} />
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
                <span className="text-[10px] text-emerald-600 font-bold">+{Math.round(growthRetention / 4)}% projected</span>
              </div>
              <p className="text-xs text-zinc-500 mb-4">Offer a loyalty perk on top sellers to lift repeat rate and stabilize monthly revenue.</p>
              <div className="grid grid-cols-2 gap-3">
                {myProducts.slice(0, 2).map(p => (
                  <div key={p.id} className="p-3 bg-zinc-50 rounded-2xl flex items-center gap-3">
                    <img src={p.mediaUrl} className="w-10 h-10 rounded-xl object-cover" alt={p.name} />
                    <div>
                      <p className="text-xs font-bold text-zinc-900 line-clamp-1">{p.name}</p>
                      <p className="text-[10px] text-zinc-500">KES {p.price}</p>
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={async () => {
                  const topProduct = myProducts[0];
                  try {
                    const title = topProduct ? `Loyalty: ${topProduct.name}` : 'Loyalty Offer';
                    await createLoyaltyOffer({
                      title,
                      discount: '5%',
                      rules: { product_id: topProduct?.id, min_orders: 3 }
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
                  <p className="text-[10px] text-zinc-400">Earn KES 200 per shop referral</p>
                </div>
              </div>
              <p className="text-xs text-zinc-500 mb-4">
                When a seller you refer uploads their first 10 products, both of you receive a <span className="font-bold text-zinc-900">KES 200 M-PESA bonus</span>.
              </p>
              <p className="text-[10px] text-zinc-500 mb-4 font-bold">
                Referrals: {growthReferrals?.referrals ?? 0} • Conversions: {growthReferrals?.conversions ?? 0} • Paid: KES {growthReferrals?.reward_paid ?? '0'}
              </p>
              <div className="flex gap-2">
                <div className="flex-1 p-3 bg-zinc-50 rounded-xl text-xs font-mono font-bold text-zinc-400 truncate">
                  SCON-REF-{seller.id.toUpperCase()}
                </div>
                <button 
                  onClick={() => setShowReferralModal(true)}
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
                  <p className="text-[10px] text-zinc-400">Earn KES 500 per supplier referral</p>
                </div>
              </div>
              <button
                onClick={() => {
                  onSellerPayoutsChange([{ id: `pay_${Date.now()}`, amount: 500, reason: 'Supplier referral reward', timestamp: Date.now() }, ...sellerPayouts]);
                  onSellerBalanceChange(sellerBalance + 500);
                  onToast?.('Supplier referral reward added.');
                }}
                className="w-full py-3 bg-emerald-600 text-white rounded-xl text-[10px] font-black"
              >
                Simulate Supplier Referral Reward
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
                <div className="flex -space-x-2">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-zinc-200" />
                  ))}
                  <div className="w-8 h-8 rounded-full border-2 border-white bg-zinc-100 flex items-center justify-center text-[10px] font-bold text-zinc-400">+2</div>
                </div>
                <span className="text-[10px] font-bold text-emerald-600">
                  {bulkGroups.length > 0 ? 'Group active' : 'No active group'}
                </span>
              </div>
              <button
                onClick={async () => {
                  try {
                    if (bulkGroups.length === 0) {
                      const created = await createBulkBuyGroup({
                        title: 'Starter Bulk Buy',
                        product_category: 'general',
                        target_qty: 100
                      });
                      setBulkGroups([created, ...bulkGroups]);
                      setGrowthStatus('Bulk-buy group created.');
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
                {bulkGroups.length > 0 ? 'Join Bulk Order' : 'Create Bulk Order'}
              </button>
            </div>

            {/* Loan Matchmaking */}
            <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm">
              <h3 className="text-sm font-bold mb-4">Available Capital</h3>
              <div className="space-y-4">
                <div className="p-4 bg-zinc-50 rounded-2xl flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-zinc-400 font-black uppercase">Working Capital Loan</p>
                    <p className="text-lg font-black text-zinc-900">Up to KES {loanMaxAmount.toLocaleString()}</p>
                  </div>
                  <button
                    onClick={async () => {
                      const amountRaw = window.prompt('Loan amount requested (KES):', String(Math.round(loanMaxAmount * 0.5)));
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
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold"
                  >
                    Apply
                  </button>
                </div>
                <div className="p-4 bg-zinc-50 rounded-2xl flex items-center justify-between opacity-50">
                  <div>
                    <p className="text-[10px] text-zinc-400 font-black uppercase">Inventory Finance</p>
                    <p className="text-lg font-black text-zinc-900">Up to KES {(loanMaxAmount * 1.6).toLocaleString()}</p>
                  </div>
                  <span className="text-[10px] font-bold text-zinc-400">Score 900+</span>
                </div>
              </div>
              <div className="mt-3 p-3 bg-indigo-50 rounded-2xl text-[10px] font-bold text-indigo-700">
                Eligibility range: KES {loanMinAmount.toLocaleString()} - {loanMaxAmount.toLocaleString()} based on SokoScore + recent sales.
              </div>
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

            {isAdmin && (
              <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-bold">Supplier Applications</h3>
                    <p className="text-[10px] text-zinc-500 font-bold">Admin review queue</p>
                  </div>
                  <button
                    onClick={refreshAdminSupplierApps}
                    className="px-3 py-2 rounded-xl text-[10px] font-bold bg-white border border-zinc-200 text-zinc-700"
                  >
                    Refresh
                  </button>
                </div>
                {adminSupplierAppsStatus && (
                  <div className="mb-3 p-3 bg-amber-50 border border-amber-100 rounded-2xl text-[10px] font-bold text-amber-700">
                    {adminSupplierAppsStatus}
                  </div>
                )}
                {adminSupplierAppsLoading && (
                  <div className="text-[10px] font-bold text-zinc-500">Loading applications…</div>
                )}
                <div className="space-y-3">
                  {adminSupplierApps.map((app) => (
                    <div key={app.id || `${app.seller_id}-${app.created_at}`} className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-bold text-zinc-900">{app.business_name || 'Business'}</p>
                          <p className="text-[10px] text-zinc-500 font-bold">
                            {app.category || 'Category'} • Seller {app.seller_id || '—'}
                          </p>
                          {app.address && (
                            <p className="text-[10px] text-zinc-500 mt-1">{app.address}</p>
                          )}
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                            app.status === 'approved'
                              ? 'bg-emerald-50 text-emerald-600'
                              : app.status === 'rejected'
                                ? 'bg-red-50 text-red-600'
                                : 'bg-amber-50 text-amber-600'
                          }`}
                        >
                          {app.status || 'pending'}
                        </span>
                      </div>
                      {app.notes && (
                        <div className="mt-2 text-[10px] text-zinc-600 font-bold">
                          Notes: {app.notes}
                        </div>
                      )}
                      <div className="mt-3 flex flex-col gap-2">
                        <input
                          value={adminDecisionReasons[app.id || ''] || ''}
                          onChange={(e) =>
                            setAdminDecisionReasons((prev) => ({ ...prev, [app.id || '']: e.target.value }))
                          }
                          className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-[11px] font-semibold text-zinc-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          placeholder="Decision reason (optional)"
                        />
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => app.id && handleApproveSupplierApp(app.id)}
                            disabled={!app.id || app.status !== 'pending'}
                            className={`px-3 py-2 rounded-lg text-[10px] font-bold ${
                              !app.id || app.status !== 'pending'
                                ? 'bg-zinc-200 text-zinc-500'
                                : 'bg-emerald-600 text-white'
                            }`}
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => app.id && handleRejectSupplierApp(app.id)}
                            disabled={!app.id || app.status !== 'pending'}
                            className={`px-3 py-2 rounded-lg text-[10px] font-bold ${
                              !app.id || app.status !== 'pending'
                                ? 'bg-zinc-200 text-zinc-500'
                                : 'bg-red-600 text-white'
                            }`}
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {adminSupplierApps.length === 0 && !adminSupplierAppsLoading && (
                    <div className="p-6 bg-zinc-50 rounded-2xl text-center text-[10px] text-zinc-500 font-bold">
                      No supplier applications in the queue.
                    </div>
                  )}
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
                    placeholder="Max unit cost"
                    className="w-full p-2.5 bg-zinc-50 border-none rounded-xl text-xs font-bold"
                    value={supplierFilters.maxUnitCost}
                    onChange={(e) => setSupplierFilters(prev => ({ ...prev, maxUnitCost: Number(e.target.value) }))}
                  />
                  <input
                    type="number"
                    placeholder="Max MOQ"
                    className="w-full p-2.5 bg-zinc-50 border-none rounded-xl text-xs font-bold"
                    value={supplierFilters.maxMOQ}
                    onChange={(e) => setSupplierFilters(prev => ({ ...prev, maxMOQ: Number(e.target.value) }))}
                  />
                  <input
                    type="number"
                    placeholder="Max lead time"
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
                      <div className="mt-3 flex gap-2">
                        <button className="px-3 py-2 bg-zinc-900 text-white rounded-lg text-[10px] font-bold">Contact</button>
                        <button className="px-3 py-2 bg-white border border-zinc-200 rounded-lg text-[10px] font-bold">Request Quote</button>
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
                    {Array.from(new Set(PRODUCTS.map(p => p.category))).map(cat => (
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
                  <input
                    type="number"
                    placeholder="Min order value"
                    className="w-full p-2.5 bg-zinc-50 border-none rounded-xl text-xs font-bold"
                    value={sellerFilters.minOrderValue}
                    onChange={(e) => setSellerFilters(prev => ({ ...prev, minOrderValue: Number(e.target.value) }))}
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

                <div className="space-y-3">
                  {sellersWithMeta.map(({ seller: s, categories, avgOrderValue, distance, score }) => (
                    <div key={s.id} className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="text-sm font-bold text-zinc-900">{s.name}</p>
                          <p className="text-[10px] text-zinc-500">{categories.join(', ') || 'No categories'}</p>
                        </div>
                        <span className="text-[10px] font-black text-emerald-600">{score.toFixed(0)} score</span>
                      </div>
                      <div className="flex flex-wrap gap-2 text-[10px] font-bold text-zinc-600">
                        <span>Rating {s.rating}</span>
                        <span>AOV KES {avgOrderValue.toFixed(0)}</span>
                        <span>{distance !== null ? `${distance.toFixed(1)} km` : 'Distance N/A'}</span>
                      </div>
                      <div className="mt-3 flex gap-2">
                        <button className="px-3 py-2 bg-zinc-900 text-white rounded-lg text-[10px] font-bold">Contact</button>
                        <button className="px-3 py-2 bg-white border border-zinc-200 rounded-lg text-[10px] font-bold">Send Offer</button>
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
                  {seller.isVerified || verificationStatus?.status === 'verified' || verificationStatus?.verified ? 'Verified' : 'Verify for KES 500'}
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
                  <p className="text-xs font-black text-amber-600">March 2026</p>
                </div>
              </div>
            </div>

            {/* Follower Notifications */}
            <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <Heart className="w-5 h-5 text-pink-500" />
                <div>
                  <h3 className="text-sm font-bold">Follower Notifications</h3>
                  <p className="text-[10px] text-zinc-500">Notify you when new customers follow your shop.</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-zinc-600">Choose channels</span>
                <div className="flex gap-2">
                  <button
                    onClick={handleAllNotificationsToggle}
                    disabled={notificationsUpdating}
                    className={`px-3 py-2 rounded-xl text-[10px] font-bold ${
                      notificationPrefs.email || notificationPrefs.in_app || notificationPrefs.whatsapp || notificationPrefs.sms
                        ? 'bg-zinc-100 text-zinc-600'
                        : 'bg-zinc-900 text-white'
                    }`}
                  >
                    {notificationsUpdating ? 'Saving…' : (notificationPrefs.email || notificationPrefs.in_app || notificationPrefs.whatsapp || notificationPrefs.sms ? 'Disable All' : 'Enable All')}
                  </button>
                  {[
                    { key: 'email', label: 'Email' },
                    { key: 'in_app', label: 'In-app' },
                    { key: 'whatsapp', label: 'WhatsApp' },
                    { key: 'sms', label: 'SMS' }
                  ].map(({ key, label }) => (
                    <button
                      key={key}
                      onClick={() => handleFollowerNotificationsToggle(key as keyof typeof notificationPrefs)}
                      disabled={notificationsUpdating}
                      className={`px-3 py-2 rounded-xl text-[10px] font-bold ${
                        notificationPrefs[key as keyof typeof notificationPrefs]
                          ? 'bg-zinc-900 text-white'
                          : 'bg-zinc-100 text-zinc-500'
                      }`}
                    >
                      {notificationsUpdating ? 'Saving…' : label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

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
                  <h3 className="text-xl font-black text-zinc-900">Invite a Shop</h3>
                  <p className="text-xs text-zinc-500 font-bold">Grow the Sconnect community</p>
                </div>
              </div>
              <div className="space-y-4 mb-8">
                <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl">
                  <p className="text-xs font-bold text-emerald-800 mb-1">Referral Reward</p>
                  <p className="text-[10px] text-emerald-600">You get KES 200. They get KES 200. Everyone wins!</p>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Shop Phone Number</label>
                  <input 
                    type="tel" 
                    placeholder="+254..." 
                    value={referralPhone}
                    onChange={(e) => setReferralPhone(e.target.value)}
                    className="w-full p-4 bg-zinc-100 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
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

      {/* WhatsApp Summary Modal */}
      <AnimatePresence>
        {showWhatsAppModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="bg-white rounded-3xl overflow-hidden max-w-sm w-full shadow-2xl"
            >
              <div className="bg-emerald-600 p-4 text-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-black">Sconnect Business</p>
                    <p className="text-[10px] text-emerald-100">Daily Summary</p>
                  </div>
                </div>
                <button onClick={() => setShowWhatsAppModal(false)}>
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 bg-zinc-50 space-y-4">
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-zinc-100 relative">
                  <div className="absolute -left-2 top-4 w-4 h-4 bg-white rotate-45 border-l border-b border-zinc-100" />
                  <p className="text-xs font-bold text-zinc-900 mb-2">Habari! Here is your daily summary for {now.toLocaleDateString()}:</p>
                  <div className="space-y-2 text-[10px] text-zinc-600 font-medium">
                    <p>• Yesterday: <span className="text-emerald-600 font-bold">{dailyViews} views</span>, <span className="text-indigo-600 font-bold">{dailyInquiries} inquiries</span>.</p>
                    <p>• Today's demand alerts: <span className="text-amber-600 font-bold">{analyticsGodViewDemand.length} products</span> trending in your area.</p>
                    <p>• Stock Alert: <span className="text-red-500 font-bold">{analyticsStockHealth.find(item => item.name === 'Low Stock')?.value || 0}%</span> low stock risk.</p>
                  </div>
                  <p className="text-[10px] text-zinc-400 mt-4">8:00 AM</p>
                </div>
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-zinc-100 relative">
                  <div className="absolute -left-2 top-4 w-4 h-4 bg-white rotate-45 border-l border-b border-zinc-100" />
                  <p className="text-xs font-bold text-zinc-900 mb-2">New Opportunity!</p>
                  <p className="text-[10px] text-zinc-600 font-medium">People near you searched for "{analyticsTopSearched[0]?.name || 'Top item'}" today. You have them in stock! Reply "FEATURE" to boost them.</p>
                  <p className="text-[10px] text-zinc-400 mt-1">8:05 AM</p>
                </div>
              </div>
              <div className="p-4 bg-white border-t space-y-2">
                {analyticsStatus && (
                  <div className="text-[10px] font-bold text-emerald-700">
                    {analyticsStatus}
                  </div>
                )}
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="Type a message..." 
                    className="flex-1 bg-zinc-100 rounded-full px-4 py-2 text-xs outline-none"
                    readOnly
                  />
                  <button className="p-2 bg-emerald-600 text-white rounded-full">
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* WhatsApp Onboarding Modal */}
      <AnimatePresence>
        {showOnboardingModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="bg-white rounded-3xl overflow-hidden max-w-sm w-full shadow-2xl"
            >
              <div className="bg-emerald-600 p-4 text-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-black">SokoConnect Onboarding</p>
                    <p className="text-[10px] text-emerald-100">WhatsApp Flow</p>
                  </div>
                </div>
                <button onClick={() => setShowOnboardingModal(false)}>
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 bg-zinc-50 space-y-4">
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-zinc-100 relative">
                  <div className="absolute -left-2 top-4 w-4 h-4 bg-white rotate-45 border-l border-b border-zinc-100" />
                  <p className="text-xs font-bold text-zinc-900 mb-2">Karibu SokoConnect kwa wafanyabiashara!</p>
                  <div className="space-y-2 text-[10px] text-zinc-600 font-medium">
                    <p>1. Jina la duka</p>
                    <p>2. Eneo (mfano: Luthuli Avenue, Shop 45)</p>
                    <p>3. Aina ya bidhaa</p>
                  </div>
                  <p className="text-[10px] text-zinc-400 mt-4">8:00 AM</p>
                </div>
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-zinc-100 relative">
                  <div className="absolute -left-2 top-4 w-4 h-4 bg-white rotate-45 border-l border-b border-zinc-100" />
                  <p className="text-xs font-bold text-zinc-900 mb-2">Tuma picha za bidhaa zako (hadi 10)</p>
                  <p className="text-[10px] text-zinc-600 font-medium">Bei ya bidhaa ya kwanza?</p>
                  <p className="text-[10px] text-zinc-400 mt-2">8:02 AM</p>
                </div>
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-zinc-100 relative">
                  <div className="absolute -left-2 top-4 w-4 h-4 bg-white rotate-45 border-l border-b border-zinc-100" />
                  <p className="text-xs font-bold text-zinc-900 mb-2">Hongera! Duka lako sasa liko kwenye SokoConnect.</p>
                  <p className="text-[10px] text-zinc-600 font-medium">Wateja wataweza kukupata wakitafuta bidhaa karibu nao.</p>
                  <p className="text-[10px] text-zinc-400 mt-2">8:05 AM</p>
                </div>
              </div>
              <div className="p-4 bg-white border-t flex gap-3">
                <button
                  onClick={() => setShowOnboardingModal(false)}
                  className="flex-1 py-3 bg-zinc-100 text-zinc-600 rounded-2xl font-bold text-xs"
                >
                  Close
                </button>
                <button
                  onClick={async () => {
                    await handleStartWhatsAppOnboarding();
                    setShowOnboardingModal(false);
                  }}
                  className="flex-1 py-3 bg-emerald-600 text-white rounded-2xl font-bold text-xs"
                >
                  Start Now
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
                <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Media URL (Image/Video)</label>
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
