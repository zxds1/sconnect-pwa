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
  Flag
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Product } from '../types';
import { SELLERS } from '../mockData';
import { ProductAIChat } from './ProductAIChat';

interface ProductDetailProps {
  product: Product;
  onClose: () => void;
  onChatOpen: (product: Product) => void;
  onOpenSupportChat?: () => void;
  onAddToComparison: (product: Product) => void;
  isCompared: boolean;
  onBuyNow?: (product: Product) => void;
  onAddToBag?: (product: Product) => void;
}

export const ProductDetail: React.FC<ProductDetailProps> = ({ product, onClose, onChatOpen, onOpenSupportChat, onAddToComparison, isCompared, onBuyNow, onAddToBag }) => {
  const [showAIChat, setShowAIChat] = React.useState(false);
  const [quantity, setQuantity] = React.useState(1);
  const [flyThumb, setFlyThumb] = React.useState<null | { src: string; start: { x: number; y: number; size: number }; end: { x: number; y: number; size: number } }>(null);
  const imageRef = React.useRef<HTMLImageElement | null>(null);
  const [showReviewForm, setShowReviewForm] = React.useState(false);
  const [reviewForm, setReviewForm] = React.useState({ name: 'You', rating: 5, comment: '' });
  const [isWatched, setIsWatched] = React.useState(false);
  const [watchTarget, setWatchTarget] = React.useState<number | null>(null);
  const [followUpEnabled, setFollowUpEnabled] = React.useState(false);
  const [qaList, setQaList] = React.useState<Array<{ id: string; question: string; answer?: string; author: string }>>([
    { id: 'q1', question: 'TV hii inafanya na solar?', answer: 'Nimeitumia na inverter, works vizuri.', author: 'Mary' },
    { id: 'q2', question: 'Shop huu huuza original?', answer: 'Nimenunua mara 3, zote original.', author: 'John' }
  ]);
  const [qaInput, setQaInput] = React.useState('');
  const seller = SELLERS.find(s => s.id === product.sellerId);
  const storedReviews = React.useMemo(() => {
    try {
      const raw = localStorage.getItem('soko:reviews');
      if (!raw) return [];
      const data = JSON.parse(raw);
      return Array.isArray(data?.[product.id]) ? data[product.id] : [];
    } catch {
      return [];
    }
  }, [product.id]);
  const allReviews = React.useMemo(() => {
    return [...(product.reviews || []), ...storedReviews];
  }, [product.reviews, storedReviews]);
  const averageRating = allReviews.length 
    ? (allReviews.reduce((acc, r) => acc + r.rating, 0) / allReviews.length).toFixed(1)
    : seller?.rating || 0;

  const handleWhatsApp = () => {
    if (seller?.whatsappNumber) {
      const message = encodeURIComponent(`Hi, I'm interested in ${product.name} I saw on Sconnect. Is it still available?`);
      window.open(`https://wa.me/${seller.whatsappNumber}?text=${message}`, '_blank');
    }
  };

  const handleGetDirections = () => {
    if (product.location) {
      window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(product.location.address)}`, '_blank');
    }
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
    setFlyThumb({ src: product.mediaUrl, start, end });
    window.setTimeout(() => setFlyThumb(null), 850);
  };

  const handleAddToComparisonClick = () => {
    if (isCompared) return;
    onAddToComparison(product);
    window.setTimeout(triggerComparisonFly, 60);
  };

  const handleBuyNow = () => {
    if (onBuyNow) {
      onBuyNow(product);
      return;
    }
    alert(`Purchase simulated for ${product.name}. Redirecting to checkout (not implemented).`);
  };

  const handleSubmitReview = () => {
    if (!reviewForm.comment.trim()) return;
    const newReview = {
      id: `r_${Date.now()}`,
      userId: 'me',
      userName: reviewForm.name || 'You',
      userAvatar: 'https://i.pravatar.cc/150?u=me',
      rating: reviewForm.rating,
      comment: reviewForm.comment,
      timestamp: Date.now(),
      isVerifiedPurchase: true,
      replies: []
    };
    try {
      const raw = localStorage.getItem('soko:reviews');
      const data = raw ? JSON.parse(raw) : {};
      const list = Array.isArray(data[product.id]) ? data[product.id] : [];
      data[product.id] = [newReview, ...list];
      localStorage.setItem('soko:reviews', JSON.stringify(data));
      setReviewForm({ name: 'You', rating: 5, comment: '' });
      setShowReviewForm(false);
      alert('Review submitted.');
    } catch {
      alert('Could not save review.');
    }
  };

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem('soko:watchlist');
      const list = raw ? JSON.parse(raw) : [];
      setIsWatched(Array.isArray(list) && list.includes(product.id));
      const prefsRaw = localStorage.getItem('soko:watchlist_prefs');
      const prefs = prefsRaw ? JSON.parse(prefsRaw) : {};
      setWatchTarget(prefs[product.id]?.targetPrice ?? null);
    } catch {
      setIsWatched(false);
    }
  }, [product.id]);

  const toggleWatch = () => {
    try {
      const raw = localStorage.getItem('soko:watchlist');
      const list = raw ? JSON.parse(raw) : [];
      const next = Array.isArray(list)
        ? (list.includes(product.id) ? list.filter((id: string) => id !== product.id) : [product.id, ...list])
        : [product.id];
      localStorage.setItem('soko:watchlist', JSON.stringify(next));
      setIsWatched(next.includes(product.id));
      const prefsRaw = localStorage.getItem('soko:watchlist_prefs');
      const prefs = prefsRaw ? JSON.parse(prefsRaw) : {};
      if (next.includes(product.id)) {
        const targetInput = window.prompt('Target price for alert (KES):', String(product.price));
        const target = targetInput ? Number(targetInput) : product.price;
        prefs[product.id] = { targetPrice: target, createdAt: Date.now() };
        setWatchTarget(target);
      } else {
        delete prefs[product.id];
        setWatchTarget(null);
      }
      localStorage.setItem('soko:watchlist_prefs', JSON.stringify(prefs));
    } catch {
      setIsWatched(!isWatched);
    }
  };

  const handleShareReward = async () => {
    const text = `Check out ${product.name} on Sconnect!`;
    if (navigator.share) {
      try {
        await navigator.share({ title: product.name, text, url: window.location.href });
      } catch {}
      return;
    }
    alert('Share link copied. Earn rewards when friends confirm purchases.');
  };

  return (
    <motion.div 
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed inset-0 z-[60] bg-white flex flex-col overflow-hidden"
    >
      {/* Header */}
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
        {/* Media */}
        <div className="aspect-square relative">
          <img 
            src={product.mediaUrl} 
            className="w-full h-full object-cover" 
            alt={product.name}
            referrerPolicy="no-referrer"
            ref={imageRef}
          />
          <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-xl shadow-lg border border-white/20 flex flex-col items-end">
            <span className="text-lg font-black text-zinc-900">${product.price}</span>
            {product.competitorPrice && (
              <span className="text-[10px] text-zinc-400 line-through">Market: ${product.competitorPrice}</span>
            )}
          </div>
          
          {product.isGoodDeal && (
            <div className="absolute top-4 left-4 bg-emerald-500 text-white px-3 py-1.5 rounded-full text-[10px] font-black flex items-center gap-1.5 shadow-xl">
              <TrendingDown className="w-3 h-3" /> GOOD DEAL
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-2xl font-black text-zinc-900 mb-1">{product.name}</h1>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-zinc-100 rounded text-[10px] font-bold uppercase tracking-tight text-zinc-500">
                  {product.category}
                </span>
                <div className="flex items-center gap-1 text-amber-500">
                  <Star className="w-3 h-3 fill-amber-500" />
                  <span className="text-xs font-bold">{averageRating}</span>
                  <span className="text-[10px] text-zinc-400 font-medium">({allReviews.length} reviews)</span>
                </div>
              </div>
            </div>
            <button className="p-3 bg-zinc-50 rounded-2xl text-zinc-400 hover:text-red-500 transition-colors">
              <Heart className="w-6 h-6" />
            </button>
          </div>

          <p className="text-zinc-500 text-sm leading-relaxed mb-6">
            {product.description}
          </p>

          {/* Price Fairness Indicator */}
          {product.competitorPrice && (
            <div className="mb-6 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center gap-3">
              <div className="p-2 bg-emerald-500 rounded-xl">
                <TrendingDown className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs font-black text-emerald-900 uppercase tracking-tight">Price Fairness Indicator</p>
                <p className="text-[10px] text-emerald-600 font-bold">
                  This price is {Math.round(((product.competitorPrice - product.price) / product.competitorPrice) * 100)}% lower than nearby shops.
                </p>
              </div>
            </div>
          )}

          {product.competitorPrice && product.price < product.competitorPrice * 0.6 && (
            <div className="mb-6 p-4 bg-amber-50 border border-amber-100 rounded-2xl flex items-center gap-3">
              <div className="p-2 bg-amber-500 rounded-xl">
                <AlertTriangle className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs font-black text-amber-900 uppercase tracking-tight">Price Anomaly Warning</p>
                <p className="text-[10px] text-amber-700 font-bold">This price is 40%+ below market average. Verify seller and product authenticity.</p>
              </div>
            </div>
          )}

          {/* Price Drop Alerts */}
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
            <button
              onClick={toggleWatch}
              className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase ${isWatched ? 'bg-emerald-600 text-white' : 'bg-white text-indigo-600 border border-indigo-200'}`}
            >
              {isWatched ? 'Watching' : 'Watch'}
            </button>
          </div>

          {/* Price History Chart */}
          {product.priceHistory && (
            <div className="mb-8">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-4">Price History</h3>
              <div className="h-48 w-full bg-zinc-50 rounded-3xl p-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={product.priceHistory}>
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

          {/* Stock Warning */}
          {product.stockLevel < 5 && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 animate-pulse">
              <div className="p-2 bg-red-500 rounded-xl">
                <AlertTriangle className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs font-black text-red-900 uppercase tracking-tight">Critical Stock Warning</p>
                <p className="text-[10px] text-red-600 font-bold">Only {product.stockLevel} units left! Order soon to avoid missing out.</p>
              </div>
            </div>
          )}

          {/* Quantity Selector */}
          <div className="mb-8 p-4 bg-zinc-50 rounded-2xl flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">Quantity</p>
              <p className="text-xs font-bold text-zinc-900">Select amount</p>
            </div>
            <div className="flex items-center gap-4 bg-white p-2 rounded-xl border border-zinc-200">
              <button 
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="p-1 hover:bg-zinc-100 rounded-lg transition-colors text-zinc-400"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="text-sm font-black text-zinc-900 min-w-[20px] text-center">{quantity}</span>
              <button 
                onClick={() => setQuantity(Math.min(product.stockLevel, quantity + 1))}
                className="p-1 hover:bg-zinc-100 rounded-lg transition-colors text-zinc-400"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Seller Info */}
          <div className="p-6 bg-zinc-50 rounded-3xl mb-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <img src={seller?.avatar} className="w-14 h-14 rounded-full border-2 border-white shadow-sm" alt="seller" />
                  {seller?.isVerified && (
                    <div className="absolute -bottom-1 -right-1 bg-indigo-600 text-white p-1 rounded-full border-2 border-white">
                      <ShieldCheck className="w-3 h-3" />
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-sm font-bold text-zinc-900">@{seller?.name}</p>
                  <p className="text-[10px] text-zinc-400 font-medium uppercase tracking-tighter">Verified Merchant</p>
                </div>
              </div>
              <div className="flex flex-col items-end">
                <div className="flex items-center gap-1 text-amber-500 mb-1">
                  <Star className="w-3 h-3 fill-amber-500" />
                  <span className="text-xs font-bold">{seller?.rating}</span>
                </div>
                <p className="text-[10px] text-zinc-400 font-bold">{seller?.followersCount} Followers</p>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-3">
              <button 
                onClick={() => onChatOpen(product)}
                className="flex items-center justify-center gap-2 py-3 bg-white border border-zinc-200 rounded-2xl text-xs font-bold text-zinc-600 hover:bg-zinc-100 transition-colors"
              >
                <MessageCircle className="w-4 h-4" /> Chat
              </button>
              <button 
                onClick={handleWhatsApp}
                className="flex items-center justify-center gap-2 py-3 bg-emerald-500 text-white rounded-2xl text-xs font-bold hover:bg-emerald-600 transition-colors"
              >
                <Phone className="w-4 h-4" /> WhatsApp
              </button>
              <button
                onClick={() => alert('Calling seller...')}
                className="flex items-center justify-center gap-2 py-3 bg-indigo-600 text-white rounded-2xl text-xs font-bold hover:bg-indigo-700 transition-colors"
              >
                <Phone className="w-4 h-4" /> Call
              </button>
            </div>
            {onOpenSupportChat && (
              <button
                onClick={onOpenSupportChat}
                className="mt-3 w-full py-3 bg-[#1976D2] text-white rounded-2xl text-xs font-bold"
              >
                Duka Support
              </button>
            )}
            <div className="mt-4 bg-white border border-zinc-200 rounded-2xl p-3 text-[10px] text-zinc-500 font-bold flex items-center justify-between">
              <span>Masked number active • Your contact is protected</span>
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <div className="mt-3 bg-white border border-zinc-200 rounded-2xl p-3 text-[10px] text-zinc-600 font-bold">
              Seller history: 6 months active • 92% response rate • 3 counterfeit reports resolved.
            </div>
          </div>

          {/* Reviews Section */}
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

            {allReviews.length > 0 ? (
              <div className="space-y-4">
                {allReviews.map((review) => (
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
                      <button onClick={() => alert('Review flagged for moderation.')} className="text-amber-600">Flag</button>
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
                <h4 className="text-zinc-900 font-bold text-sm mb-1">No reviews yet</h4>
                <p className="text-[10px] text-zinc-400">Be the first to share your experience with this product!</p>
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
                      className="w-full p-2.5 bg-white rounded-xl text-xs font-bold"
                      value={reviewForm.name}
                      onChange={(e) => setReviewForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Your name"
                    />
                    <select
                      className="w-full p-2.5 bg-white rounded-xl text-xs font-bold"
                      value={reviewForm.rating}
                      onChange={(e) => setReviewForm(prev => ({ ...prev, rating: Number(e.target.value) }))}
                    >
                      {[5,4,3,2,1].map(r => <option key={r} value={r}>{r} Stars</option>)}
                    </select>
                  </div>
                  <textarea
                    className="w-full p-3 bg-white rounded-xl text-xs font-bold"
                    rows={3}
                    value={reviewForm.comment}
                    onChange={(e) => setReviewForm(prev => ({ ...prev, comment: e.target.value }))}
                    placeholder="Share your experience..."
                  />
                  <div className="flex items-center gap-2">
                    <button onClick={handleSubmitReview} className="px-4 py-2 bg-zinc-900 text-white rounded-xl text-xs font-bold">Submit</button>
                    <button onClick={() => setShowReviewForm(false)} className="px-4 py-2 bg-zinc-100 text-zinc-700 rounded-xl text-xs font-bold">Cancel</button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Community Q&A */}
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
                    <p className="text-[10px] text-zinc-400 mt-1">No answers yet</p>
                  )}
                  <p className="text-[9px] text-zinc-400 mt-1">— {item.author}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 flex gap-2">
              <input
                className="flex-1 p-3 bg-zinc-50 rounded-xl text-[10px] font-bold"
                placeholder="Ask a question about this product..."
                value={qaInput}
                onChange={(e) => setQaInput(e.target.value)}
              />
              <button
                onClick={() => {
                  if (!qaInput.trim()) return;
                  setQaList(prev => [{ id: `q_${Date.now()}`, question: qaInput.trim(), author: 'You' }, ...prev]);
                  setQaInput('');
                }}
                className="px-4 py-3 bg-zinc-900 text-white rounded-xl text-[10px] font-black"
              >
                Ask
              </button>
            </div>
          </div>

          {/* Trust & Safety */}
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
              onClick={() => alert('Report submitted. Our team will review this listing.')}
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
              onClick={() => alert('Dispute opened. Our team will contact you within 24 hours.')}
              className="px-3 py-2 bg-red-600 text-white rounded-xl text-[10px] font-black uppercase"
            >
              Start Dispute
            </button>
          </div>

          {/* Location & Stock */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <button 
              onClick={handleGetDirections}
              className="p-4 bg-zinc-50 rounded-2xl text-left group"
            >
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="w-4 h-4 text-indigo-600" />
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Location</span>
              </div>
              <p className="text-xs font-bold text-zinc-900 truncate group-hover:text-indigo-600 transition-colors">
                {product.location?.address || 'Online Only'}
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
              <p className={`text-xs font-bold ${product.stockLevel < 10 ? 'text-red-500' : 'text-emerald-600'}`}>
                {product.stockLevel} Units Left
              </p>
              <p className="text-[9px] text-zinc-400 mt-1">Confirmed 10m ago</p>
            </div>
          </div>

          {/* Post-Purchase Follow-up */}
          <div className="mb-8 p-4 bg-zinc-50 rounded-2xl border border-zinc-100 flex items-center justify-between">
            <div>
              <p className="text-xs font-black text-zinc-900 uppercase tracking-tight">Post-Purchase Follow-up</p>
              <p className="text-[10px] text-zinc-500 font-bold">Get a reminder to confirm your purchase and earn rewards.</p>
            </div>
            <button
              onClick={() => setFollowUpEnabled(prev => !prev)}
              className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase ${followUpEnabled ? 'bg-emerald-600 text-white' : 'bg-white text-zinc-600 border border-zinc-200'}`}
            >
              {followUpEnabled ? 'Enabled' : 'Enable'}
            </button>
          </div>

          {/* Social Proof */}
          <div className="mb-8 p-5 bg-white border border-zinc-100 rounded-3xl shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-black uppercase tracking-widest text-zinc-400">Social Proof</h3>
              <span className="text-[10px] text-zinc-500 font-bold">Verified purchases</span>
            </div>
            <div className="p-3 bg-emerald-50 rounded-2xl text-[10px] font-bold text-emerald-700">
              45 customers bought this here this month.
            </div>
            <div className="mt-3 grid grid-cols-5 gap-2">
              {[1,2,3,4,5].map(i => (
                <img key={i} src={`https://picsum.photos/seed/community-${product.id}-${i}/80/80`} className="w-full aspect-square rounded-xl object-cover" alt="community" />
              ))}
            </div>
          </div>

          {/* Share Reward */}
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

          {/* AI Assistant Trigger */}
          <div className="mb-20">
            <button 
              onClick={() => setShowAIChat(true)}
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

      {/* AI Chat Overlay */}
      <AnimatePresence>
        {showAIChat && (
          <div className="fixed inset-0 z-[70]">
            <div 
              className="absolute inset-0 bg-black/30 backdrop-blur-[1px]"
              onClick={() => setShowAIChat(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.98 }}
              className="absolute bottom-4 right-4 w-[min(420px,90vw)] pointer-events-auto"
            >
              <ProductAIChat product={product} onClose={() => setShowAIChat(false)} />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Bottom Action Bar */}
      <div className="p-6 border-t bg-white flex gap-4">
        <button 
          onClick={() => onAddToBag?.(product)}
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

      {/* Fly-to-compare animation */}
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
