import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft } from 'lucide-react';
import { Feed } from './components/Feed';
import { Chat } from './components/Chat';
import { SellerDashboard } from './components/SellerDashboard';
import { Profile } from './components/Profile';
import { Shops } from './components/Shops';
import { Search as SearchView } from './components/Search';
import { Settings } from './components/Settings';
import { Login } from './components/Login';
import { Register } from './components/Register';
import { PasswordReset } from './components/PasswordReset';
import { AuthOnboarding } from './components/AuthOnboarding';
import { Notifications } from './components/Notifications';
import { DataDashboard } from './components/DataDashboard';
import { ProductDetail } from './components/ProductDetail';
import { Bag } from './components/Bag';
import { Subscriptions } from './components/Subscriptions';
import { Partnerships } from './components/Partnerships';
import { SupportChat } from './components/SupportChat';
import { ComparisonView } from './components/ComparisonView';
import { Rewards } from './components/Rewards';
import { Onboarding } from './components/Onboarding';
import { Assistant } from './components/Assistant';
import { GroupBuys } from './components/GroupBuys';
import { PullToRefresh } from './components/PullToRefresh';
import { Product } from './types';
import { completeOnboarding, getOnboardingState } from './lib/onboardingApi';
import { addCompareItem, getCompareList, removeCompareItem } from './lib/compareApi';
import { getProduct } from './lib/catalogApi';
import { searchRecommendations, type SearchResult } from './lib/searchApi';
import { getShopProducts, searchShops } from './lib/shopDirectoryApi';
import { addCartItem, checkoutCart } from './lib/cartApi';
import { getSellerProfile } from './lib/sellerProfileApi';
import { getSessionInfo } from './lib/identityApi';
import { listNotifications, markNotificationRead, type NotificationItem } from './lib/notificationsApi';

const numberOrZero = (value: any) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const resolveMediaUrl = (detail: any) => {
  if (!detail) return '';
  const direct = detail.media_url || detail.image_url || detail.cover_url || detail.thumbnail_url || detail.mediaUrl;
  if (direct) return direct;
  const media = detail.media || detail.media_items || detail.mediaItems || detail.images || detail.media_urls || detail.mediaUrls;
  if (Array.isArray(media) && media.length > 0) {
    const item = media[0];
    if (typeof item === 'string') return item;
    return item?.url || item?.media_url || item?.src || item?.path || '';
  }
  return '';
};

const buildProductFromSearch = (result: SearchResult, detail?: any): Product => {
  const sellerId = result.seller_id || detail?.seller_id || detail?.sellerId || '';
  const mediaUrl = resolveMediaUrl(detail);
  return {
    id: result.canonical_id || detail?.id || '',
    sellerId,
    name: detail?.name || result.name || 'Product',
    description: detail?.description || detail?.summary || '',
    price: numberOrZero(detail?.current_price ?? detail?.price ?? result.price),
    category: detail?.category || detail?.category_id || 'general',
    mediaUrl,
    mediaType: (detail?.media_type as 'video' | 'image') || (detail?.media?.[0]?.media_type as 'video' | 'image') || 'image',
    tags: Array.isArray(detail?.tags) ? detail.tags : [],
    stockLevel: numberOrZero(detail?.stock_level ?? detail?.stockLevel),
    stockStatus: detail?.stock_status || detail?.stockStatus,
    location: (result.lat !== undefined || result.lng !== undefined)
      ? { lat: numberOrZero(result.lat), lng: numberOrZero(result.lng), address: '' }
      : undefined,
    discountPrice: detail?.discount_price ?? detail?.discountPrice,
    competitorPrice: detail?.competitor_price ?? detail?.competitorPrice,
    isGoodDeal: detail?.is_good_deal ?? detail?.good_deal
  };
};

export default function App() {
  const [view, setView] = useState<'feed' | 'assistant' | 'seller' | 'intelligence' | 'profile' | 'shops' | 'search' | 'settings' | 'comparison' | 'rewards' | 'bag' | 'subscriptions' | 'partnerships' | 'data' | 'notifications' | 'group-buys' | 'login' | 'register' | 'password-reset' | 'auth-onboarding'>(() => {
    if (typeof window === 'undefined') return 'assistant';
    try {
      const token = localStorage.getItem('soko:auth_token');
      return token ? 'assistant' : 'login';
    } catch {
      return 'assistant';
    }
  });
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [navigationPreset, setNavigationPreset] = useState<{
    pathId?: string;
    profile?: 'driving' | 'walking' | 'cycling' | 'motorbike' | 'scooter' | 'tuktuk';
    mode?: 'silent' | 'mapbox';
    autoOpen: boolean;
  } | null>(null);
  const [selectedSellerId, setSelectedSellerId] = useState<string | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isProductDetailOpen, setIsProductDetailOpen] = useState(false);
  const [comparisonList, setComparisonList] = useState<Product[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [followedSellerIds, setFollowedSellerIds] = useState<string[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchAction, setSearchAction] = useState<null | 'voice' | 'photo' | 'video' | 'hybrid'>(null);
  const [supportChatMode, setSupportChatMode] = useState<'duka' | 'seller-ai' | 'brand' | null>(null);
  const [isSellerAccount, setIsSellerAccount] = useState<boolean | null>(null);
  const [verifiedSellerIds, setVerifiedSellerIds] = useState<string[]>([]);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 1500);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    let alive = true;
    const loadProducts = async () => {
      try {
        const recs = await searchRecommendations();
        const mapped = await Promise.all(
          recs.map(async (item) => {
            try {
              const detail = await getProduct(item.canonical_id);
              return buildProductFromSearch(item, detail);
            } catch {
              return buildProductFromSearch(item);
            }
          })
        );
        if (alive) {
          setProducts(mapped.filter((p) => p.id));
        }
      } catch {
        // Ignore errors; other screens will load their own data.
      }
    };
    loadProducts();
    return () => {
      alive = false;
    };
  }, []);
  useEffect(() => {
    let alive = true;
    const loadVerifiedSellers = async () => {
      try {
        const shops = await searchShops({ verified: true });
        if (!alive) return;
        const ids = shops
          .map((shop) => String(shop?.seller_id || shop?.id || '').trim())
          .filter(Boolean);
        setVerifiedSellerIds(Array.from(new Set(ids)));
      } catch {
        if (!alive) return;
        setVerifiedSellerIds([]);
      }
    };
    loadVerifiedSellers();
    return () => {
      alive = false;
    };
  }, []);
  const [showOnboarding, setShowOnboarding] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('soko:onboarding_completed') !== 'true';
  });
  const [topAlerts, setTopAlerts] = useState<NotificationItem[]>([]);
  const [updateReady, setUpdateReady] = useState(false);
  const [offlineReady, setOfflineReady] = useState(false);
  const [pendingUpdateReload, setPendingUpdateReload] = useState(false);
  const [pendingSellerFastTrack, setPendingSellerFastTrack] = useState(false);
  const [openRewardsQrOnMount, setOpenRewardsQrOnMount] = useState(false);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const state = await getOnboardingState();
        if (!alive) return;
        const completed = state?.status === 'completed' || !!state?.completed_at;
        try {
          localStorage.setItem('soko:onboarding_completed', completed ? 'true' : 'false');
        } catch {}
        if (completed) {
          window.dispatchEvent(new Event('soko:onboarding-complete'));
        }
        setShowOnboarding(!completed);
      } catch {
        if (!alive) return;
        try {
          const completed = localStorage.getItem('soko:onboarding_completed') === 'true';
          setShowOnboarding(!completed);
        } catch {
          setShowOnboarding(true);
        }
      }
    };
    load();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('oauth') === '1') {
      setView('seller');
    }
  }, []);

  useEffect(() => {
    let alive = true;
    const loadSellerStatus = async () => {
      try {
        await getSellerProfile();
        if (alive) setIsSellerAccount(true);
      } catch {
        if (alive) setIsSellerAccount(false);
      }
    };
    loadSellerStatus();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    let alive = true;
    const loadSessionRole = async () => {
      try {
        const session = await getSessionInfo();
        const role = String(session?.role || '').toLowerCase();
        if (!alive || !role) return;
        try {
          localStorage.setItem('soko:role', role);
          if (session?.session_id) {
            localStorage.setItem('soko:session_id', session.session_id);
          }
        } catch {}
      } catch {}
    };
    loadSessionRole();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    const handleUpdate = () => setUpdateReady(true);
    const handleOffline = () => setOfflineReady(true);
    window.addEventListener('soko:sw-update', handleUpdate);
    window.addEventListener('soko:sw-ready', handleOffline);
    return () => {
      window.removeEventListener('soko:sw-update', handleUpdate);
      window.removeEventListener('soko:sw-ready', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (!pendingUpdateReload) return;
    const sw = navigator.serviceWorker;
    if (!sw) return;
    const handleControllerChange = () => {
      window.location.reload();
    };
    sw.addEventListener('controllerchange', handleControllerChange, { once: true });
    return () => {
      sw.removeEventListener('controllerchange', handleControllerChange);
    };
  }, [pendingUpdateReload]);

  useEffect(() => {
    if (view === 'login' || view === 'register' || view === 'password-reset' || view === 'auth-onboarding') {
      setTopAlerts([]);
      return;
    }
    let alive = true;
    const loadAlerts = async () => {
      try {
        const res = await listNotifications({ limit: 2 });
        if (!alive) return;
        setTopAlerts((res?.items || []).filter(Boolean));
      } catch {
        if (alive) setTopAlerts([]);
      }
    };
    loadAlerts();
    const interval = window.setInterval(loadAlerts, 30000);
    return () => {
      alive = false;
      window.clearInterval(interval);
    };
  }, [view]);

  const handleOpenSellerStudio = () => {
    if (isSellerAccount === null) {
      setToast('Checking seller account...');
      return;
    }
    if (isSellerAccount === false) {
      setToast('Create a seller account to access Seller Studio.');
      setView('profile');
      return;
    }
    setView('seller');
  };

  const handleOpenRFQ = () => {
    if (isSellerAccount === null) {
      setToast('Checking seller account...');
      return;
    }
    if (isSellerAccount === false) {
      setToast('Create a seller account to start RFQs.');
      setView('profile');
      return;
    }
    setView('seller');
    setToast('Open Supplier tab to start RFQ.');
  };

  useEffect(() => {
    let alive = true;
    const loadCompare = async () => {
      try {
        await syncCompareList();
      } catch (err) {
        if (!alive) return;
        console.error(err);
      }
    };
    loadCompare();
    return () => {
      alive = false;
    };
  }, []);

  const syncCompareList = async () => {
    const listResp = await getCompareList();
    const items = Array.isArray(listResp?.items) ? listResp.items : [];
    const productEntries = await Promise.all(
      items.map(async (item) => {
        try {
          return await getProduct(item.product_id);
        } catch {
          return null;
        }
      })
    );
    setComparisonList(productEntries.filter(Boolean) as Product[]);
  };

  const handleAddToComparison = async (product: Product) => {
    try {
      if (comparisonList.find(p => p.id === product.id)) {
        await removeCompareItem(product.id);
      } else {
        await addCompareItem({ product_id: product.id });
      }
      await syncCompareList();
      handleInteraction(product.id, 'add_to_comparison');
    } catch (err) {
      console.error(err);
    }
  };

  const handleInteraction = (productId: string, type: string) => {
    console.log('Mined Interaction:', { productId, type, timestamp: Date.now() });
  };

  const handleChatOpen = (product: Product) => {
    setSelectedProduct(product);
    setIsChatOpen(true);
    handleInteraction(product.id, 'chat');
  };

  const handleProductOpen = (product: Product) => {
    setSelectedProduct(product);
    setNavigationPreset(null);
    setIsProductDetailOpen(true);
    handleInteraction(product.id, 'view_detail');
  };

  const normalizeProduct = (raw: any, fallbackSellerId?: string): Product | null => {
    if (!raw) return null;
    const id = raw.id || raw.product_id || raw.productId;
    if (!id) return null;
    const mediaType = String(raw.media_type || raw.mediaType || raw.type || '').toLowerCase() === 'video' ? 'video' : 'image';
    const tags = Array.isArray(raw.tags)
      ? raw.tags
      : typeof raw.tags === 'string'
        ? raw.tags.split(',').map((tag: string) => tag.trim()).filter(Boolean)
        : [];
    const lat = raw.location?.lat ?? raw.lat;
    const lng = raw.location?.lng ?? raw.lng;
    const address = raw.location?.address ?? raw.address ?? '';
    return {
      id: String(id),
      sellerId: raw.seller_id || raw.sellerId || fallbackSellerId || '',
      productId: raw.product_id || raw.productId,
      name: raw.name || raw.title || raw.product_name || 'Product',
      description: raw.description || raw.summary || '',
      price: Number(raw.price ?? raw.unit_price ?? raw.current_price ?? 0),
      costPrice: raw.cost_price ?? raw.costPrice,
      category: raw.category || raw.category_name || 'general',
      mediaUrl: raw.media_url || raw.mediaUrl || raw.image_url || raw.image || '',
      mediaType,
      tags,
      stockLevel: Number(raw.stock_level ?? raw.stockLevel ?? raw.stock ?? 0),
      stockStatus: raw.stock_status || raw.stockStatus,
      expiryDate: raw.expiry_date || raw.expiryDate,
      isFeatured: raw.is_featured ?? raw.isFeatured,
      discountPrice: raw.discount_price ?? raw.discountPrice,
      location: Number.isFinite(lat) && Number.isFinite(lng)
        ? { lat: Number(lat), lng: Number(lng), address }
        : undefined,
      reviews: raw.reviews,
      competitorPrice: raw.competitor_price ?? raw.competitorPrice,
      priceHistory: raw.price_history ?? raw.priceHistory,
      isGoodDeal: raw.is_good_deal ?? raw.isGoodDeal,
    };
  };

  const handleStartNavigation = async (payload: Record<string, any>) => {
    const sellerId = payload?.seller_id || payload?.destination_seller_id;
    const productId = payload?.product_id || payload?.id;
    const pathId = payload?.path_id || payload?.preferred_path_id || payload?.route_id;
    const profile = ['driving', 'walking', 'cycling', 'motorbike', 'scooter', 'tuktuk'].includes(String(payload?.profile))
      ? (payload.profile as 'driving' | 'walking' | 'cycling' | 'motorbike' | 'scooter' | 'tuktuk')
      : undefined;
    const mode = String(payload?.mode || '').toLowerCase() === 'mapbox' ? 'mapbox' : 'silent';
    let product: Product | null = null;
    if (productId) {
      try {
        const raw = await getProduct(String(productId));
        product = normalizeProduct(raw, sellerId);
      } catch {}
    }
    if (!product && sellerId) {
      try {
        const items = await getShopProducts(String(sellerId));
        product = normalizeProduct(items?.[0], sellerId);
      } catch {}
    }
    if (!product) {
      setToast('Unable to open navigation for this seller yet.');
      return;
    }
    setSelectedProduct(product);
    setNavigationPreset({
      pathId,
      profile,
      mode,
      autoOpen: true
    });
    setIsProductDetailOpen(true);
  };

  const handleAddToBag = async (product: Product) => {
    try {
      const sellerId = product.sellerId || (product as any).seller_id;
      const price = product.price;
      if (!sellerId) {
        setToast('Seller unavailable for this item.');
        return;
      }
      await addCartItem({ product_id: product.id, seller_id: sellerId, quantity: 1, unit_price: price });
      setToast(`${product.name} added to bag.`);
    } catch (err: any) {
      setToast(err?.message || 'Unable to add to bag.');
    }
  };

  const handleBuyNow = async (product: Product) => {
    try {
      await handleAddToBag(product);
      await checkoutCart();
      setToast(`Checkout started for ${product.name}.`);
    } catch (err: any) {
      setToast(err?.message || 'Unable to checkout.');
    }
  };

  const handleToggleFollow = (sellerId: string) => {
    setFollowedSellerIds(prev => prev.includes(sellerId) ? prev.filter(id => id !== sellerId) : [...prev, sellerId]);
  };

  const handleShopClick = (sellerId: string) => {
    setSelectedSellerId(sellerId);
    setView('profile');
  };

  return (
    <div className="min-h-[100dvh] w-full bg-black overflow-x-hidden flex flex-col font-sans">
      {/* Main Content Area */}
      <main className="flex-1 min-h-0 relative overflow-y-auto overflow-x-hidden">
        <PullToRefresh onRefresh={() => window.location.reload()}>
          <AnimatePresence mode="wait">
          {view === 'feed' && (
            <motion.div 
              key="feed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full w-full"
            >
              <Feed 
                onChatOpen={handleChatOpen}
                onProductOpen={handleProductOpen}
                onSellerOpen={handleShopClick}
              />
            </motion.div>
          )}

          {view === 'shops' && (
            <motion.div 
              key="shops"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full w-full bg-white z-40"
            >
              <Shops onShopClick={handleShopClick} />
            </motion.div>
          )}

          {view === 'search' && (
            <motion.div 
              key="search"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full w-full bg-white z-40"
            >
              <SearchView 
                onProductOpen={handleProductOpen} 
                comparisonList={comparisonList}
                onAddToComparison={handleAddToComparison}
                onOpenComparison={() => setView('comparison')}
                onAddToBag={handleAddToBag}
                onShopOpen={handleShopClick}
                initialQuery={searchQuery}
                initialAction={searchAction || undefined}
              />
            </motion.div>
          )}

          {view === 'assistant' && (
            <motion.div 
              key="assistant"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full w-full bg-white z-40"
            >
              <Assistant
                products={products}
                onOpenSearch={(query) => {
                  setView('search');
                  setSearchQuery(query);
                  setSearchAction(null);
                }}
                onOpenProduct={handleProductOpen}
                onAddToBag={handleAddToBag}
                onAddToComparison={handleAddToComparison}
                onOpenSeller={handleShopClick}
                onStartNavigation={handleStartNavigation}
                onOpenRewards={() => setView('rewards')}
                onOpenProfile={() => {
                  setSelectedSellerId(null);
                  setView('profile');
                }}
                onOpenSellerStudio={handleOpenSellerStudio}
                onOpenRFQ={handleOpenRFQ}
                onOpenOnboarding={() => setShowOnboarding(true)}
                onOpenBag={() => setView('bag')}
                onOpenQrScan={() => {
                  setOpenRewardsQrOnMount(true);
                  setView('rewards');
                }}
                onOpenSubscriptions={() => setView('subscriptions')}
                onOpenPartnerships={() => setView('partnerships')}
                onOpenFeed={() => setView('feed')}
                onOpenGroupBuys={() => setView('group-buys')}
                onToast={setToast}
              />
            </motion.div>
          )}

          {view === 'login' && (
            <motion.div
              key="login"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full w-full bg-white z-50"
            >
              <Login
                onBack={() => setView('assistant')}
                onRegisterOpen={() => setView('register')}
                onResetOpen={() => setView('password-reset')}
                onAuthenticated={() => setView('assistant')}
              />
            </motion.div>
          )}

          {view === 'register' && (
            <motion.div
              key="register"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full w-full bg-white z-50"
            >
              <Register
                onBack={() => setView('login')}
                onLoginOpen={() => setView('login')}
                onAuthenticated={() => setView('auth-onboarding')}
              />
            </motion.div>
          )}

          {view === 'password-reset' && (
            <motion.div
              key="password-reset"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full w-full bg-white z-50"
            >
              <PasswordReset
                onBack={() => setView('login')}
                onLoginOpen={() => setView('login')}
              />
            </motion.div>
          )}

          {view === 'auth-onboarding' && (
            <motion.div
              key="auth-onboarding"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full w-full bg-white z-50"
            >
              <AuthOnboarding
                onBack={() => setView('register')}
                onFinish={(intent) => {
                  if (intent === 'seller') {
                    setPendingSellerFastTrack(true);
                    setView('profile');
                  } else {
                    setView('assistant');
                  }
                }}
              />
            </motion.div>
          )}


          {view === 'comparison' && (
            <motion.div 
              key="comparison"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="h-full w-full bg-white z-40"
            >
              <ComparisonView 
                onClose={() => setView('search')}
                onProductOpen={handleProductOpen}
              />
            </motion.div>
          )}

          {view === 'rewards' && (
            <motion.div 
              key="rewards"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full w-full bg-white z-40"
            >
              <Rewards
                openQrOnMount={openRewardsQrOnMount}
                onOpenQrHandled={() => setOpenRewardsQrOnMount(false)}
              />
            </motion.div>
          )}

          {view === 'subscriptions' && (
            <motion.div 
              key="subscriptions"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="h-full w-full bg-white z-40"
            >
              <Subscriptions onBack={() => setView('assistant')} />
            </motion.div>
          )}

          {view === 'partnerships' && (
            <motion.div 
              key="partnerships"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="h-full w-full bg-white z-40"
            >
                <Partnerships onBack={() => setView('assistant')} />
              </motion.div>
            )}

          {view === 'bag' && (
            <motion.div 
              key="bag"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="h-full w-full bg-white z-40"
            >
              <Bag
                onBack={() => setView('assistant')}
                onOpenProduct={handleProductOpen}
              />
            </motion.div>
          )}

          {view === 'seller' && (
            <motion.div 
              key="seller"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="h-full w-full bg-white z-40"
            >
              <div className="flex items-center p-4 border-b bg-white sticky top-0 z-10">
                <button onClick={() => setView('assistant')} className="p-2 hover:bg-zinc-100 rounded-full">
                  <ArrowLeft className="w-6 h-6" />
                </button>
                <img
                  src="/logo-header.jpg"
                  alt="Sconnect"
                  className="ml-3 w-8 h-8 rounded-lg object-cover"
                />
                <h1 className="ml-3 text-xl font-bold">Seller Studio</h1>
              </div>
              <SellerDashboard
                products={products}
                onProductsChange={setProducts}
                onToast={setToast}
                verifiedSellerIds={verifiedSellerIds}
                onVerifiedSellerIdsChange={setVerifiedSellerIds}
                onOpenSellerChat={() => setSupportChatMode('seller-ai')}
                onOpenSupportChat={() => setSupportChatMode('duka')}
                onOpenSupplierChat={() => setSupportChatMode('brand')}
              />
            </motion.div>
          )}

          {view === 'profile' && (
            <motion.div 
              key="profile"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="h-full w-full bg-white z-40"
            >
              <Profile 
                onBack={() => {
                  if (selectedSellerId) {
                    setSelectedSellerId(null);
                    setView('assistant');
                  } else {
                    setView('assistant');
                  }
                }}
                onSettingsOpen={() => setView('settings')}
                onOpenSellerStudio={handleOpenSellerStudio}
                onSellerAccountCreated={() => {
                  setIsSellerAccount(true);
                  setView('seller');
                }}
                sellerFastTrack={pendingSellerFastTrack}
                onSellerFastTrackConsumed={() => setPendingSellerFastTrack(false)}
                isSellerAccount={isSellerAccount}
                onProductOpen={handleProductOpen}
                sellerId={selectedSellerId || undefined}
                products={products}
                isFollowing={selectedSellerId ? followedSellerIds.includes(selectedSellerId) : false}
                onToggleFollow={handleToggleFollow}
              />
            </motion.div>
          )}

          {view === 'settings' && (
            <motion.div 
              key="settings"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="h-full w-full bg-white z-50"
            >
              <div className="flex items-center p-4 border-b bg-white sticky top-0 z-10">
                <button onClick={() => setView('profile')} className="p-2 hover:bg-zinc-100 rounded-full">
                  <ArrowLeft className="w-6 h-6" />
                </button>
                <img
                  src="/logo-header.jpg"
                  alt="Sconnect"
                  className="ml-3 w-8 h-8 rounded-lg object-cover"
                />
                <h1 className="ml-3 text-xl font-bold">Settings</h1>
              </div>
              <Settings
                onOpenDataDashboard={() => setView('data')}
                onOpenNotifications={() => setView('notifications')}
                onOpenProfile={() => setView('profile')}
                onOpenSecurity={() => setView('password-reset')}
                onOpenPayments={() => setView('subscriptions')}
                onOpenSupport={() => setSupportChatMode('duka')}
                onOpenPolicies={() => setSupportChatMode('duka')}
              />
            </motion.div>
          )}

          {view === 'notifications' && (
            <motion.div
              key="notifications"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="h-full w-full bg-white z-50"
            >
              <Notifications onBack={() => setView('settings')} />
            </motion.div>
          )}

          {view === 'data' && (
            <motion.div
              key="data"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="h-full w-full bg-white z-50"
            >
              <DataDashboard onBack={() => setView('settings')} />
            </motion.div>
          )}

          {view === 'group-buys' && (
            <motion.div
              key="group-buys"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="h-full w-full bg-white z-50"
            >
              <GroupBuys onBack={() => setView('assistant')} />
            </motion.div>
          )}

          </AnimatePresence>
        </PullToRefresh>

        {/* AI Chat Overlay */}
        <AnimatePresence>
          {isChatOpen && (
            <Chat 
              product={selectedProduct} 
              onClose={() => setIsChatOpen(false)}
              onEscalate={() => {
                alert("Escalating to seller... A human representative will join shortly.");
                setIsChatOpen(false);
              }}
            />
          )}
        </AnimatePresence>

        {/* Product Detail Overlay */}
        <AnimatePresence>
          {isProductDetailOpen && selectedProduct && (
            <ProductDetail 
              product={selectedProduct} 
              onClose={() => {
                setIsProductDetailOpen(false);
                setNavigationPreset(null);
              }}
              onChatOpen={(product) => {
                setIsProductDetailOpen(false);
                handleChatOpen(product);
              }}
              onOpenSupportChat={() => setSupportChatMode('duka')}
              onAddToComparison={handleAddToComparison}
              isCompared={comparisonList.some(p => p.id === selectedProduct.id)}
              onBuyNow={handleBuyNow}
              onAddToBag={handleAddToBag}
              initialShowMap={Boolean(navigationPreset?.autoOpen)}
              initialPreferredPathId={navigationPreset?.pathId || null}
              initialRouteProfile={navigationPreset?.profile}
              initialNavigationMode={navigationPreset?.mode}
            />
          )}
        </AnimatePresence>

        {/* Onboarding Overlay */}
      {showOnboarding && (
        <Onboarding
          onFinish={() => {
            setShowOnboarding(false);
            try {
              localStorage.setItem('soko:onboarding_completed', 'true');
            } catch {}
            completeOnboarding().catch(() => {});
            window.dispatchEvent(new Event('soko:onboarding-complete'));
            setToast('📸 Ali photo’d Sugar. Beat him? +2⭐');
          }}
        />
      )}
      </main>

      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-zinc-900 text-white px-4 py-2 rounded-full text-xs font-bold shadow-xl">
          {toast}
        </div>
      )}

      {(topAlerts.length > 0 || updateReady || offlineReady) && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[90] w-[min(92vw,520px)] space-y-2">
          {updateReady && (
            <button
              onClick={() => {
                const updater = (window as any).__soko_updateSW;
                if (typeof updater === 'function') {
                  updater(true);
                }
                setUpdateReady(false);
                setPendingUpdateReload(true);
                setToast('Updating in background…');
              }}
              className="w-full text-left bg-zinc-900 text-white px-4 py-3 rounded-2xl text-[10px] font-bold shadow-xl flex items-center justify-between gap-3"
            >
              <span>Update available. Tap to download the latest.</span>
              <span className="px-3 py-1.5 rounded-full bg-white/10 text-white">Update</span>
            </button>
          )}
          {offlineReady && !updateReady && (
            <div className="bg-emerald-600 text-white px-4 py-2 rounded-2xl text-[10px] font-bold shadow-xl flex items-center justify-between gap-3">
              <span>App ready for offline use.</span>
              <button
                onClick={() => setOfflineReady(false)}
                className="text-white/80 hover:text-white"
                aria-label="Dismiss offline ready"
              >
                ✕
              </button>
            </div>
          )}
          {topAlerts.map((alert) => (
            <div
              key={alert.id}
              className="bg-white text-zinc-900 px-4 py-3 rounded-2xl text-[10px] font-bold shadow-xl border border-zinc-100 flex items-center justify-between gap-3"
            >
              <span className="truncate">
                {alert.title || alert.body || 'New update'}
              </span>
              <button
                onClick={() => {
                  markNotificationRead(alert.id).catch(() => {});
                  setTopAlerts((prev) => prev.filter((item) => item.id !== alert.id));
                }}
                className="text-zinc-400 hover:text-zinc-800"
                aria-label="Dismiss notification"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {view !== 'assistant' && view !== 'login' && view !== 'register' && view !== 'password-reset' && view !== 'auth-onboarding' && (
        <button
          onClick={() => setView('assistant')}
          className="fixed bottom-6 left-6 z-[90] bg-zinc-900 text-white px-4 py-3 rounded-full text-xs font-bold shadow-2xl"
        >
          Back to Assistant
        </button>
      )}

      {supportChatMode && (
        <SupportChat
          mode={supportChatMode}
          onClose={() => setSupportChatMode(null)}
        />
      )}
    </div>
  );
}
