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
import { WhatsAppExperience } from './components/WhatsAppExperience';
import { ProductDetail } from './components/ProductDetail';
import { Bag } from './components/Bag';
import { Subscriptions } from './components/Subscriptions';
import { Partnerships } from './components/Partnerships';
import { SupportChat } from './components/SupportChat';
import { ComparisonView } from './components/ComparisonView';
import { Rewards } from './components/Rewards';
import { Onboarding } from './components/Onboarding';
import { Assistant } from './components/Assistant';
import { PullToRefresh } from './components/PullToRefresh';
import { PRODUCTS, SELLERS } from './mockData';
import { Product } from './types';
import { getOnboardingState } from './lib/onboardingApi';
import { addCompareItem, getCompareList, removeCompareItem } from './lib/compareApi';
import { getProduct } from './lib/catalogApi';
import { addCartItem, checkoutCart } from './lib/cartApi';
import { getSellerProfile } from './lib/sellerProfileApi';
import { getSessionInfo } from './lib/identityApi';

export default function App() {
  const [view, setView] = useState<'feed' | 'assistant' | 'seller' | 'intelligence' | 'profile' | 'shops' | 'search' | 'settings' | 'comparison' | 'rewards' | 'bag' | 'subscriptions' | 'partnerships' | 'data' | 'whatsapp' | 'notifications' | 'login' | 'register' | 'password-reset' | 'auth-onboarding'>(() => {
    if (typeof window === 'undefined') return 'assistant';
    try {
      const token = localStorage.getItem('soko:auth_token');
      return token ? 'assistant' : 'login';
    } catch {
      return 'assistant';
    }
  });
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedSellerId, setSelectedSellerId] = useState<string | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isProductDetailOpen, setIsProductDetailOpen] = useState(false);
  const [comparisonList, setComparisonList] = useState<Product[]>([]);
  const [products, setProducts] = useState<Product[]>(PRODUCTS);
  const [followedSellerIds, setFollowedSellerIds] = useState<string[]>([]);
  const [likedProductIds, setLikedProductIds] = useState<string[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchAction, setSearchAction] = useState<null | 'voice' | 'photo' | 'video' | 'hybrid'>(null);
  const [supportChatMode, setSupportChatMode] = useState<'duka' | 'seller-ai' | 'brand' | null>(null);
  const [isSellerAccount, setIsSellerAccount] = useState<boolean | null>(null);
  const [sellerBalance, setSellerBalance] = useState(() => {
    if (typeof window === 'undefined') return 0;
    const raw = localStorage.getItem('soko:seller_sc_balance');
    return raw ? Number(raw) : 0;
  });
  const [sellerPayouts, setSellerPayouts] = useState<Array<{ id: string; amount: number; reason: string; timestamp: number }>>(() => {
    if (typeof window === 'undefined') return [];
    const raw = localStorage.getItem('soko:seller_sc_payouts');
    return raw ? JSON.parse(raw) : [];
  });
  const [verifiedSellerIds, setVerifiedSellerIds] = useState<string[]>(() => {
    if (typeof window === 'undefined') return [];
    const raw = localStorage.getItem('soko:verified_sellers');
    return raw ? JSON.parse(raw) : [];
  });
  const [buyerBalance, setBuyerBalance] = useState(() => {
    if (typeof window === 'undefined') return 0;
    const raw = localStorage.getItem('soko:buyer_sc_balance');
    return raw ? Number(raw) : 0;
  });
  const [buyerPayouts, setBuyerPayouts] = useState<Array<{ id: string; amount: number; reason: string; timestamp: number }>>(() => {
    if (typeof window === 'undefined') return [];
    const raw = localStorage.getItem('soko:buyer_sc_payouts');
    return raw ? JSON.parse(raw) : [];
  });
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 1500);
    return () => clearTimeout(timer);
  }, [toast]);
  useEffect(() => {
    try {
      localStorage.setItem('soko:seller_sc_balance', String(sellerBalance));
      localStorage.setItem('soko:seller_sc_payouts', JSON.stringify(sellerPayouts));
      localStorage.setItem('soko:verified_sellers', JSON.stringify(verifiedSellerIds));
      localStorage.setItem('soko:buyer_sc_balance', String(buyerBalance));
      localStorage.setItem('soko:buyer_sc_payouts', JSON.stringify(buyerPayouts));
    } catch {}
  }, [sellerBalance, sellerPayouts, verifiedSellerIds, buyerBalance, buyerPayouts]);
  const [showPostOnboardingNudges, setShowPostOnboardingNudges] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('soko:onboarding_nudges') !== 'dismissed';
  });
  const [showOnboarding, setShowOnboarding] = useState(false);

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
        setShowOnboarding(true);
      }
    };
    load();
    return () => {
      alive = false;
    };
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

  const handleRemoveFromComparison = async (id: string) => {
    try {
      await removeCompareItem(id);
      await syncCompareList();
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
    setIsProductDetailOpen(true);
    handleInteraction(product.id, 'view_detail');
  };

  const handleCreatePost = (product: Product) => {
    setProducts(prev => [product, ...prev]);
    setToast('Post created and added to your feed.');
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

  const handleToggleLike = (productId: string) => {
    setLikedProductIds(prev => prev.includes(productId) ? prev.filter(id => id !== productId) : [...prev, productId]);
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
                onOpenSearchAction={(query, action) => {
                  setView('search');
                  setSearchQuery(query);
                  setSearchAction(action);
                }}
                onOpenProduct={handleProductOpen}
                onAddToBag={handleAddToBag}
                onAddToComparison={handleAddToComparison}
                onOpenSeller={handleShopClick}
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
                  localStorage.setItem('soko:open_qr', 'true');
                  setView('rewards');
                }}
                onOpenSubscriptions={() => setView('subscriptions')}
                onOpenPartnerships={() => setView('partnerships')}
                onOpenWhatsApp={() => setView('whatsapp')}
                onOpenFeed={() => setView('feed')}
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
                    try {
                      localStorage.setItem('soko:fast_track_seller', 'true');
                    } catch {}
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
                buyerBalance={buyerBalance}
                onBuyerBalanceChange={setBuyerBalance}
                buyerPayouts={buyerPayouts}
                onBuyerPayoutsChange={setBuyerPayouts}
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
              <Partnerships
                onBack={() => setView('assistant')}
                onOpenBrandChat={() => setSupportChatMode('brand')}
              />
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
                sellerBalance={sellerBalance}
                onSellerBalanceChange={setSellerBalance}
                sellerPayouts={sellerPayouts}
                onSellerPayoutsChange={setSellerPayouts}
                verifiedSellerIds={verifiedSellerIds}
                onVerifiedSellerIdsChange={setVerifiedSellerIds}
                onOpenSellerChat={() => setSupportChatMode('seller-ai')}
                onOpenSupportChat={() => setSupportChatMode('duka')}
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
              <Settings onOpenDataDashboard={() => setView('data')} onOpenNotifications={() => setView('notifications')} />
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

          {view === 'whatsapp' && (
            <motion.div
              key="whatsapp"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="h-full w-full bg-white z-50"
            >
              <WhatsAppExperience />
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
              onClose={() => setIsProductDetailOpen(false)}
              onChatOpen={(product) => {
                setIsProductDetailOpen(false);
                handleChatOpen(product);
              }}
              onOpenSupportChat={() => setSupportChatMode('duka')}
              onAddToComparison={handleAddToComparison}
              isCompared={comparisonList.some(p => p.id === selectedProduct.id)}
              onBuyNow={handleBuyNow}
              onAddToBag={handleAddToBag}
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

      {view === 'assistant' && showPostOnboardingNudges && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[90] w-[min(92vw,520px)] space-y-2">
          <div className="bg-blue-600 text-white px-4 py-3 rounded-2xl text-[10px] font-bold shadow-xl flex items-center justify-between">
            <span>2/50⭐ → Photo now → Free Pro</span>
            <button
              onClick={() => {
                localStorage.setItem('soko:onboarding_nudges', 'dismissed');
                setShowPostOnboardingNudges(false);
              }}
              className="text-white/70 hover:text-white"
            >
              ✕
            </button>
          </div>
          <div className="bg-white text-zinc-900 px-4 py-3 rounded-2xl text-[10px] font-bold shadow-xl border border-blue-100 flex items-center justify-between">
            <span>WhatsApp Sync: Dashboard updated! Check #3 rank</span>
            <button
              onClick={() => {
                localStorage.setItem('soko:onboarding_nudges', 'dismissed');
                setShowPostOnboardingNudges(false);
              }}
              className="text-zinc-400 hover:text-zinc-800"
            >
              ✕
            </button>
          </div>
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
