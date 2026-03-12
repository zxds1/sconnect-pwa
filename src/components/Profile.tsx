import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Settings as SettingsIcon, Grid, Heart, ShoppingBag, Edit2, Share2, ChevronLeft, BarChart3, Star, ArrowRight, MapPin, AlertTriangle, BadgeCheck, Facebook, Twitter, Instagram, ExternalLink, Sparkles, TrendingUp } from 'lucide-react';
import { Product } from '../types';
import { SELLERS } from '../mockData';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, Tooltip 
} from 'recharts';

const MOCK_SALES_TREND = [
  { name: 'W1', sales: 45 },
  { name: 'W2', sales: 52 },
  { name: 'W3', sales: 48 },
  { name: 'W4', sales: 70 },
];

interface ProfileProps {
  onBack?: () => void;
  onSettingsOpen?: () => void;
  onProductOpen: (product: Product) => void;
  sellerId?: string;
  products: Product[];
  isFollowing?: boolean;
  onToggleFollow?: (sellerId: string) => void;
}

export const Profile: React.FC<ProfileProps> = ({ onBack, onSettingsOpen, onProductOpen, sellerId, products, isFollowing, onToggleFollow }) => {
  const [activeTab, setActiveTab] = useState(sellerId ? 'shop' : 'grid');
  const [shopReviews, setShopReviews] = useState<any[]>([]);
  const [shopReviewForm, setShopReviewForm] = useState({ name: 'You', rating: 5, comment: '' });

  const seller = sellerId ? SELLERS.find(s => s.id === sellerId) : null;
  const isOwnProfile = !sellerId;

  const profileData = seller || {
    name: 'B-Tech Group',
    avatar: 'https://picsum.photos/seed/user/200/200',
    description: 'Passionate about tech and sustainable commerce. Exploring the future of AI shopping. 🚀',
    stats: {
      following: '124',
      followers: '45.2k',
      likes: '1.2M'
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${profileData.name} Profile`,
          text: `Check out ${profileData.name} on Sconnect!`,
          url: window.location.href,
        });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      alert('Profile link copied to clipboard!');
    }
  };

  const sellerProducts = sellerId ? products.filter(p => p.sellerId === sellerId) : [];

  useEffect(() => {
    if (!sellerId) return;
    try {
      const raw = localStorage.getItem('soko:shopReviews');
      const data = raw ? JSON.parse(raw) : {};
      const list = Array.isArray(data[sellerId]) ? data[sellerId] : [];
      setShopReviews(list);
    } catch {
      setShopReviews([]);
    }
  }, [sellerId]);

  const handleSubmitShopReview = () => {
    if (!sellerId || !shopReviewForm.comment.trim()) return;
    const review = {
      id: `sr_${Date.now()}`,
      userName: shopReviewForm.name || 'You',
      rating: shopReviewForm.rating,
      comment: shopReviewForm.comment,
      timestamp: Date.now(),
      replies: []
    };
    try {
      const raw = localStorage.getItem('soko:shopReviews');
      const data = raw ? JSON.parse(raw) : {};
      const list = Array.isArray(data[sellerId]) ? data[sellerId] : [];
      data[sellerId] = [review, ...list];
      localStorage.setItem('soko:shopReviews', JSON.stringify(data));
      setShopReviews(prev => [review, ...prev]);
      setShopReviewForm({ name: 'You', rating: 5, comment: '' });
      alert('Shop review submitted.');
    } catch {
      alert('Could not save shop review.');
    }
  };
  
  const handleSocialShare = (platform: string) => {
    const url = window.location.href;
    const text = `Check out ${profileData.name} on Sconnect!`;
    let shareUrl = '';
    
    switch (platform) {
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
        break;
      case 'instagram':
        alert('Copy link to share on Instagram!');
        return;
    }
    
    if (shareUrl) window.open(shareUrl, '_blank');
  };

  return (
    <div className="h-full bg-white flex flex-col overflow-y-auto no-scrollbar">
      {/* Header */}
      <div className="p-4 flex items-center justify-between sticky top-0 bg-white z-20 border-b border-zinc-100">
        <div className="flex items-center gap-3">
          {onBack && (
            <button onClick={onBack} className="p-1 hover:bg-zinc-100 rounded-full">
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}
          <div className="flex items-center gap-1">
            <h2 className="font-bold text-lg">{profileData.name.toLowerCase().replace(/\s/g, '_')}</h2>
            {seller?.isVerified && <BadgeCheck className="w-4 h-4 text-indigo-600 fill-indigo-50" />}
          </div>
        </div>
        <div className="flex gap-4">
          <button onClick={handleShare} className="p-1 hover:bg-zinc-100 rounded-full transition-colors">
            <Share2 className="w-6 h-6 text-zinc-800" />
          </button>
          {isOwnProfile && onSettingsOpen && (
            <button onClick={onSettingsOpen} className="p-1 hover:bg-zinc-100 rounded-full transition-colors">
              <SettingsIcon className="w-6 h-6 text-zinc-800" />
            </button>
          )}
        </div>
      </div>

      {/* Profile Info */}
      <div className="p-6 flex flex-col items-center">
        <div className="relative mb-4">
          <img 
            src={profileData.avatar} 
            className="w-24 h-24 rounded-full border-2 border-zinc-100 p-1 object-cover shadow-xl"
            alt="profile"
          />
          {isOwnProfile && (
            <button className="absolute bottom-0 right-0 bg-indigo-600 rounded-full p-1.5 border-2 border-white shadow-lg hover:bg-indigo-700 transition-colors">
              <Edit2 className="w-3 h-3 text-white" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-xl font-black text-zinc-900">{profileData.name}</h1>
          {seller?.isVerified && (
            <div className="group relative">
              <BadgeCheck className="w-5 h-5 text-indigo-600 fill-indigo-50" />
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-zinc-900 text-white text-[10px] font-bold rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                Verified Merchant
              </div>
            </div>
          )}
        </div>
        
        {!isOwnProfile && seller?.location && (
          <a 
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(seller.location.address)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-indigo-600 hover:text-indigo-700 transition-colors mb-3 group"
          >
            <MapPin className="w-3.5 h-3.5" />
            <span className="text-xs font-bold group-hover:underline">{seller.location.address}</span>
          </a>
        )}

        <p className="text-sm text-zinc-500 mb-6 text-center max-w-xs leading-relaxed">
          {profileData.description}
        </p>

        {/* Social Sharing */}
        <div className="flex gap-4 mb-8">
          <button onClick={() => handleSocialShare('facebook')} className="p-2 bg-zinc-50 rounded-full hover:bg-zinc-100 transition-colors text-zinc-600">
            <Facebook className="w-5 h-5" />
          </button>
          <button onClick={() => handleSocialShare('twitter')} className="p-2 bg-zinc-50 rounded-full hover:bg-zinc-100 transition-colors text-zinc-600">
            <Twitter className="w-5 h-5" />
          </button>
          <button onClick={() => handleSocialShare('instagram')} className="p-2 bg-zinc-50 rounded-full hover:bg-zinc-100 transition-colors text-zinc-600">
            <Instagram className="w-5 h-5" />
          </button>
        </div>

        {/* Stats */}
        <div className="flex w-full justify-around mb-8 max-w-sm">
          <div className="flex flex-col items-center">
            <span className="font-black text-lg">124</span>
            <span className="text-[10px] text-zinc-400 uppercase font-black tracking-widest">Following</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="font-black text-lg">45.2k</span>
            <span className="text-[10px] text-zinc-400 uppercase font-black tracking-widest">Followers</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="font-black text-lg">1.2M</span>
            <span className="text-[10px] text-zinc-400 uppercase font-black tracking-widest">Likes</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex w-full gap-3 px-4 max-w-sm">
          {isOwnProfile ? (
            <>
              <button className="flex-1 py-2.5 bg-zinc-900 text-white rounded-xl font-bold text-sm shadow-lg shadow-zinc-900/20 active:scale-95 transition-transform">
                Edit Profile
              </button>
              <button onClick={handleShare} className="flex-1 py-2.5 bg-zinc-100 text-zinc-900 rounded-xl font-bold text-sm active:scale-95 transition-transform">
                Share Profile
              </button>
            </>
          ) : (
            <>
              <button 
                onClick={() => sellerId && onToggleFollow?.(sellerId)}
                className={`flex-1 py-2.5 rounded-xl font-bold text-sm shadow-lg active:scale-95 transition-transform ${
                  isFollowing ? 'bg-zinc-900 text-white' : 'bg-indigo-600 text-white shadow-indigo-600/20'
                }`}
              >
                {isFollowing ? 'Following' : 'Follow'}
              </button>
              <button className="flex-1 py-2.5 bg-zinc-100 text-zinc-900 rounded-xl font-bold text-sm active:scale-95 transition-transform">
                Message
              </button>
              <button 
                onClick={() => alert('Seller escalation initiated. Our trust & safety team will review this shop.')}
                className="p-2.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors"
                title="Escalate Seller"
              >
                <AlertTriangle className="w-5 h-5" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-zinc-100 sticky top-[60px] bg-white z-10">
        {[
          { id: 'grid', icon: Grid, label: 'Posts' },
          ...(isOwnProfile ? [{ id: 'intelligence', icon: BarChart3, label: 'Intelligence' }] : [{ id: 'stats', icon: BarChart3, label: 'Stats' }]),
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

      {/* Content Area */}
      <div className="flex-1">
        {activeTab === 'intelligence' || activeTab === 'stats' ? (
          <div className="p-6 space-y-6 bg-zinc-50 h-full">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black uppercase tracking-widest text-zinc-400">
                {activeTab === 'intelligence' ? 'Shop Intelligence' : 'Public Stats'}
              </h3>
              {activeTab === 'stats' && (
                <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-full">
                  <TrendingUp className="w-3 h-3" /> Trending
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-2xl border border-zinc-100 shadow-sm">
                <p className="text-[10px] font-bold text-zinc-400 uppercase mb-1">
                  {activeTab === 'intelligence' ? 'Total Reach' : 'Merchant Rating'}
                </p>
                <div className="flex items-center gap-2">
                  <p className="text-xl font-black text-zinc-900">
                    {activeTab === 'intelligence' ? '45.2k' : (seller?.rating || '4.8')}
                  </p>
                  {activeTab === 'stats' && <Star className="w-4 h-4 text-amber-500 fill-amber-500" />}
                </div>
                <div className="mt-2 h-1 w-full bg-zinc-100 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500 w-[85%]" />
                </div>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-zinc-100 shadow-sm">
                <p className="text-[10px] font-bold text-zinc-400 uppercase mb-1">
                  {activeTab === 'intelligence' ? 'Engagement' : 'Active Items'}
                </p>
                <p className="text-xl font-black text-zinc-900">
                  {activeTab === 'intelligence' ? '12.4%' : sellerProducts.length}
                </p>
                <div className="mt-2 h-1 w-full bg-zinc-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 w-[62%]" />
                </div>
              </div>
            </div>

            {activeTab === 'stats' && (
              <div className="bg-white p-5 rounded-2xl border border-zinc-100 shadow-sm">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-4">Recent Sales Trend</h4>
                <div className="h-32 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={MOCK_SALES_TREND}>
                      <defs>
                        <linearGradient id="colorSalesStats" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1}/>
                          <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="name" hide />
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '10px' }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="sales" 
                        stroke="#4f46e5" 
                        strokeWidth={2}
                        fillOpacity={1} 
                        fill="url(#colorSalesStats)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <p className="text-[10px] text-zinc-400 text-center mt-2 font-medium">Sales velocity increased by 14% this month</p>
              </div>
            )}

            {activeTab === 'intelligence' && (
              <div className="bg-zinc-900 text-white p-5 rounded-2xl shadow-xl">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                  <h4 className="text-xs font-bold uppercase tracking-wider">AI Growth Tip</h4>
                </div>
                <p className="text-[10px] text-zinc-400 italic leading-relaxed">
                  "Your conversion rate is 15% higher on video posts than images. Consider shifting your content strategy to 80% video."
                </p>
              </div>
            )}

            <div className="bg-white p-5 rounded-2xl border border-zinc-100 shadow-sm">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-4">Trending Products</h4>
              <div className="space-y-4">
                {[1, 2].map(i => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-zinc-100 rounded-lg overflow-hidden">
                      <img src={`https://picsum.photos/seed/trend-${i}/100/100`} className="w-full h-full object-cover" alt="prod" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-bold text-zinc-800">Premium Item {i}</p>
                      <p className="text-[10px] text-zinc-400">Trending +15% this week</p>
                    </div>
                    <ArrowRight className="w-3 h-3 text-zinc-300" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : activeTab === 'shop' ? (
          <div className="p-4 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black uppercase tracking-widest text-zinc-400">Seller Collection</h3>
              <span className="text-[10px] font-bold text-zinc-400">{sellerProducts.length} Items</span>
            </div>
            
            <div className="grid grid-cols-1 gap-6">
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
                      <img src={product.mediaUrl} className="w-full h-full object-cover" alt={product.name} />
                      <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg shadow-sm">
                        <span className="text-xs font-black text-zinc-900">${product.price}</span>
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
                          <span className="text-xs font-bold">{seller?.rating}</span>
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
                  <p className="text-xs text-zinc-400">This seller hasn't listed any items for sale in their shop tab.</p>
                </div>
              )}
            </div>

            {/* Shop Reviews */}
            {sellerId && (
              <div className="bg-white p-5 rounded-2xl border border-zinc-100 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-xs font-black uppercase tracking-wider text-zinc-400">Shop Reviews</h4>
                  {!isOwnProfile && (
                    <button 
                      onClick={handleSubmitShopReview}
                      className="text-[10px] font-bold text-indigo-600 hover:underline"
                    >
                      Post Review
                    </button>
                  )}
                </div>

                {!isOwnProfile && (
                  <div className="mb-4 p-3 bg-zinc-50 rounded-2xl border border-zinc-100 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        className="w-full p-2.5 bg-white rounded-xl text-xs font-bold"
                        value={shopReviewForm.name}
                        onChange={(e) => setShopReviewForm(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Your name"
                      />
                      <select
                        className="w-full p-2.5 bg-white rounded-xl text-xs font-bold"
                        value={shopReviewForm.rating}
                        onChange={(e) => setShopReviewForm(prev => ({ ...prev, rating: Number(e.target.value) }))}
                      >
                        {[5,4,3,2,1].map(r => <option key={r} value={r}>{r} Stars</option>)}
                      </select>
                    </div>
                    <textarea
                      className="w-full p-3 bg-white rounded-xl text-xs font-bold"
                      rows={3}
                      value={shopReviewForm.comment}
                      onChange={(e) => setShopReviewForm(prev => ({ ...prev, comment: e.target.value }))}
                      placeholder="Write a shop review..."
                    />
                    <button onClick={handleSubmitShopReview} className="w-full py-2 bg-zinc-900 text-white rounded-xl text-xs font-bold">Submit Review</button>
                  </div>
                )}

                <div className="space-y-3">
                  {shopReviews.length === 0 && (
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
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-0.5 p-0.5">
            {[...Array(15)].map((_, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.02 }}
                className="aspect-[3/4] bg-zinc-100 relative group overflow-hidden cursor-pointer"
              >
                <img 
                  src={`https://picsum.photos/seed/profile-${activeTab}-${i}/300/400`} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  alt="post"
                />
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="flex items-center gap-1 text-white font-bold text-xs">
                    <Heart className="w-4 h-4 fill-white" />
                    <span>{Math.floor(Math.random() * 100)}k</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
