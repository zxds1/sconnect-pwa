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

export default function App() {
  const [view, setView] = useState<'feed' | 'assistant' | 'seller' | 'intelligence' | 'profile' | 'shops' | 'search' | 'settings' | 'comparison' | 'rewards' | 'bag' | 'subscriptions' | 'partnerships' | 'data' | 'whatsapp'>('feed');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedSellerId, setSelectedSellerId] = useState<string | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isProductDetailOpen, setIsProductDetailOpen] = useState(false);
  const [comparisonList, setComparisonList] = useState<Product[]>([]);
  const [products, setProducts] = useState<Product[]>(PRODUCTS);
  const [bag, setBag] = useState<Product[]>([]);
  const [followedSellerIds, setFollowedSellerIds] = useState<string[]>([]);
  const [likedProductIds, setLikedProductIds] = useState<string[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchAction, setSearchAction] = useState<null | 'voice' | 'photo' | 'video' | 'hybrid'>(null);
  const [supportChatMode, setSupportChatMode] = useState<'duka' | 'seller-ai' | 'brand' | null>(null);
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
  const [showOnboarding, setShowOnboarding] = useState(() => {
    if (typeof window === 'undefined') return true;
    return localStorage.getItem('soko:onboarding_complete') !== 'true';
  });

  const handleAddToComparison = (product: Product) => {
    if (comparisonList.find(p => p.id === product.id)) {
      setComparisonList(prev => prev.filter(p => p.id !== product.id));
      return;
    }
    setComparisonList(prev => [...prev, product]);
    handleInteraction(product.id, 'add_to_comparison');
  };

  const handleRemoveFromComparison = (id: string) => {
    setComparisonList(prev => prev.filter(p => p.id !== id));
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

  const handleAddToBag = (product: Product) => {
    setBag(prev => (prev.find(p => p.id === product.id) ? prev : [...prev, product]));
    setToast(`${product.name} added to bag.`);
  };

  const handleBuyNow = (product: Product) => {
    handleAddToBag(product);
    alert(`Proceeding to checkout for ${product.name}.`);
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
    <div className="h-screen w-screen bg-black overflow-hidden flex flex-col font-sans">
      {/* Main Content Area */}
      <main className="flex-1 relative overflow-hidden">
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
                products={products} 
                onChatOpen={handleChatOpen}
                onProductOpen={handleProductOpen}
                onInteraction={handleInteraction}
                onSellerOpen={handleShopClick}
                onToggleFollow={handleToggleFollow}
                followedSellerIds={followedSellerIds}
                onAddToBag={handleAddToBag}
                onBuyNow={handleBuyNow}
                onCreatePost={handleCreatePost}
                likedProductIds={likedProductIds}
                onToggleLike={handleToggleLike}
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
                products={products}
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
                onOpenSellerStudio={() => setView('seller')}
                onOpenRFQ={() => {
                  setView('seller');
                  setToast('Open Supplier tab to start RFQ.');
                }}
                onOpenOnboarding={() => setShowOnboarding(true)}
                onOpenBag={() => setView('bag')}
                onOpenQrScan={() => {
                  localStorage.setItem('soko:open_qr', 'true');
                  setView('rewards');
                }}
                onOpenSubscriptions={() => setView('subscriptions')}
                onOpenPartnerships={() => setView('partnerships')}
                onOpenWhatsApp={() => setView('whatsapp')}
                onToast={setToast}
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
                products={comparisonList} 
                onClose={() => setView('search')}
                onRemove={handleRemoveFromComparison}
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
                items={bag}
                allProducts={products}
                onBack={() => setView('assistant')}
                onRemove={(id) => setBag(prev => prev.filter(p => p.id !== id))}
                onOpenProduct={handleProductOpen}
                onSwap={(current, next) => {
                  setBag(prev => prev.map(p => (p.id === current.id ? next : p)));
                  setToast(`Switched to ${next.name}.`);
                }}
                onSwitchAll={(target) => {
                  if (target.length === 0) return;
                  setBag(target);
                  setToast('Switched all bag items.');
                }}
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
                <h1 className="ml-4 text-xl font-bold">Seller Studio</h1>
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
                <h1 className="ml-4 text-xl font-bold">Settings</h1>
              </div>
              <Settings onOpenDataDashboard={() => setView('data')} />
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
              localStorage.setItem('soko:onboarding_complete', 'true');
              setShowOnboarding(false);
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

      {view !== 'assistant' && (
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
          context={(() => {
            const seller = SELLERS[0];
            const sellerProducts = products.filter(p => p.sellerId === seller.id);
            const topProduct = sellerProducts[0] || products[0];
            const comp = topProduct?.competitorPrice || (topProduct?.price ?? 1) * 1.08;
            const gapPct = comp ? Math.round(((comp - (topProduct?.price || 0)) / comp) * 100) : 0;
            const ranked = [...SELLERS].sort((a, b) => b.sokoScore - a.sokoScore);
            const rank = Math.max(1, ranked.findIndex(s => s.id === seller.id) + 1);
            const topDukas = ranked.slice(0, 5).map((s, idx) => ({
              name: s.name,
              scans: 120 - idx * 9
            }));
            return {
              sellerName: seller.name,
              sellerRank: rank,
              sellerScore: seller.sokoScore,
              sellerBalance,
              topProductName: topProduct?.name || 'Top product',
              topProductPrice: topProduct?.price || 0,
              topProductGapPct: gapPct,
              topDukas,
              demandSpike: 'Omo +47% Kibera',
              avgPriceGapText: gapPct > 0 ? `You are ${gapPct}% above area average.` : 'You are priced at the area average.'
            };
          })()}
        />
      )}
    </div>
  );
}
