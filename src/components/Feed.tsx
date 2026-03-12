import React, { useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, MessageCircle, Share2, ShoppingBag, ChevronDown, Music2, Volume2, VolumeX, Plus, Star, Sparkles, ArrowRight, Copy, Send, User } from 'lucide-react';
import { Product } from '../types';
import { SELLERS } from '../mockData';

interface FeedProps {
  products: Product[];
  onChatOpen: (product: Product) => void;
  onProductOpen: (product: Product) => void;
  onInteraction: (productId: string, type: string) => void;
  onSellerOpen: (sellerId: string) => void;
  onToggleFollow: (sellerId: string) => void;
  followedSellerIds: string[];
  onAddToBag: (product: Product) => void;
  onBuyNow: (product: Product) => void;
  onCreatePost: (product: Product) => void;
  likedProductIds: string[];
  onToggleLike: (productId: string) => void;
}

export const Feed: React.FC<FeedProps> = ({ products, onChatOpen, onProductOpen, onInteraction, onSellerOpen, onToggleFollow, followedSellerIds, onAddToBag, onBuyNow, onCreatePost, likedProductIds, onToggleLike }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [viewedCategories, setViewedCategories] = useState<string[]>([]);
  const [shareProduct, setShareProduct] = useState<Product | null>(null);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [postForm, setPostForm] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    mediaUrl: '',
    tags: ''
  });
  const containerRef = useRef<HTMLDivElement>(null);

  const handleScroll = () => {
    if (!containerRef.current) return;
    const index = Math.round(containerRef.current.scrollTop / containerRef.current.clientHeight);
    if (index !== activeIndex && index >= 0 && index < products.length) {
      setActiveIndex(index);
      onInteraction(products[index].id, 'view');
      
      // Track category interest
      const category = products[index].category;
      setViewedCategories(prev => {
        const filtered = prev.filter(c => c !== category);
        return [category, ...filtered].slice(0, 5);
      });
    }
  };

  const recommendations = useMemo(() => {
    if (viewedCategories.length === 0) return products.slice(0, 4);
    
    // Simple recommendation: products in viewed categories that aren't the current one
    const recommended = products.filter(p => 
      viewedCategories.includes(p.category) && 
      p.id !== products[activeIndex]?.id
    );
    
    return recommended.length > 0 ? recommended.slice(0, 4) : products.slice(0, 4);
  }, [viewedCategories, products, activeIndex]);

  const handleShare = async (product: Product) => {
    onInteraction(product.id, 'share');
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          text: product.description,
          url: window.location.href,
        });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      setShareProduct(product);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    } catch {
      alert(`Link copied: ${window.location.href}`);
    }
  };

  const handleShareTo = (platform: string, product: Product) => {
    const url = window.location.href;
    const text = `${product.name} • ${product.description}`;
    let shareUrl = '';
    if (platform === 'whatsapp') shareUrl = `https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`;
    if (platform === 'facebook') shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
    if (platform === 'twitter') shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
    if (platform === 'telegram') shareUrl = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
    if (shareUrl) window.open(shareUrl, '_blank');
  };

  const handleCreatePost = () => {
    if (!postForm.name || !postForm.description || !postForm.price || !postForm.category) return;
    const newProduct: Product = {
      id: `p${Date.now()}`,
      sellerId: 's1',
      name: postForm.name,
      description: postForm.description,
      price: parseFloat(postForm.price),
      category: postForm.category,
      mediaUrl: postForm.mediaUrl || 'https://picsum.photos/seed/newpost/800/800',
      mediaType: 'image',
      tags: postForm.tags ? postForm.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      stockLevel: 10
    };
    onCreatePost(newProduct);
    setShowCreatePost(false);
    setPostForm({ name: '', description: '', price: '', category: '', mediaUrl: '', tags: '' });
  };
  return (
    <div className="relative h-full w-full bg-black overflow-hidden select-none">
      <div 
        ref={containerRef}
        onScroll={handleScroll}
        className="h-full w-full overflow-y-scroll snap-y snap-mandatory no-scrollbar"
        style={{ scrollSnapStop: 'always' }}
      >
        {products.map((product, index) => {
          const seller = SELLERS.find(s => s.id === product.sellerId);
          return (
            <div key={product.id} className="h-full w-full snap-start relative flex items-center justify-center overflow-hidden">
              {/* Media Background - Immersive */}
              <div className="absolute inset-0 z-0">
                <img 
                  src={product.mediaUrl} 
                  alt={product.name}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                {/* Overlay Gradients */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/80" />
                <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/60 to-transparent" />
              </div>

              {/* Content Overlay - Bottom Left */}
              <div className="absolute bottom-6 left-4 right-20 z-10 text-white pointer-events-none">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={index === activeIndex ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                  transition={{ duration: 0.5 }}
                  className="pointer-events-auto cursor-pointer"
                  onClick={() => onProductOpen(product)}
                >
                  <div className="flex items-center gap-2 mb-3 pointer-events-auto">
                    <img 
                      src={seller?.avatar} 
                      className="w-10 h-10 rounded-full border-2 border-white"
                      alt="avatar"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (seller) onSellerOpen(seller.id);
                      }}
                    />
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        if (seller) onSellerOpen(seller.id);
                      }}
                      className="font-bold text-lg shadow-sm"
                    >
                      @{seller?.name}
                    </button>
                    <div className="flex items-center gap-1 bg-black/20 backdrop-blur-md px-2 py-1 rounded-lg">
                      <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                      <span className="text-[10px] font-black">{seller?.rating}</span>
                    </div>
                    {seller && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleFollow(seller.id);
                        }}
                        className={`text-[10px] px-3 py-1 rounded-full font-bold uppercase tracking-wider ml-2 ${
                          followedSellerIds.includes(seller.id) ? 'bg-white text-zinc-900' : 'bg-red-500 text-white'
                        }`}
                      >
                        {followedSellerIds.includes(seller.id) ? 'Following' : 'Follow'}
                      </button>
                    )}
                  </div>
                  
                  <h3 className="text-xl font-bold mb-1 drop-shadow-lg">{product.name}</h3>
                  <p className="text-sm opacity-90 line-clamp-2 mb-4 drop-shadow-md max-w-[85%]">
                    {product.description}
                  </p>
                  
                  <div className="flex items-center gap-2 mb-4">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsMuted(m => !m);
                      }}
                      className="flex items-center gap-2"
                    >
                      <Music2 className="w-4 h-4 animate-spin" style={{ animationDuration: '3s' }} />
                      <span className="text-xs font-medium truncate max-w-[200px]">Original sound - {seller?.name}</span>
                      {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                    </button>
                  </div>

                  <div className="flex gap-2 pointer-events-auto">
                    {product.tags.map(tag => (
                      <span key={tag} className="px-2 py-1 bg-white/10 backdrop-blur-md rounded-md text-[10px] font-bold uppercase tracking-tight border border-white/10">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </motion.div>
              </div>

              {/* Action Sidebar - Right Side */}
              <div className="absolute right-3 bottom-10 z-20 flex flex-col gap-5 items-center">
                {/* Seller Avatar with Plus */}
                <div className="relative mb-4">
                  <img 
                    src={seller?.avatar} 
                    className="w-12 h-12 rounded-full border-2 border-white"
                    alt="seller"
                    onClick={() => seller && onSellerOpen(seller.id)}
                  />
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-red-500 rounded-full p-0.5 border-2 border-black">
                    <Plus className="w-3 h-3 text-white" />
                  </div>
                </div>

                <button 
                  onClick={() => {
                    onToggleLike(product.id);
                    onInteraction(product.id, 'like');
                  }}
                  className="flex flex-col items-center gap-1 group"
                >
                  <div className="p-2.5 bg-black/20 backdrop-blur-sm rounded-full group-active:scale-125 transition-transform">
                    <Heart className={`w-8 h-8 ${likedProductIds.includes(product.id) ? 'text-red-500 fill-red-500' : 'text-white fill-transparent'} transition-colors`} />
                  </div>
                  <span className="text-[11px] text-white font-bold drop-shadow-md">
                    {likedProductIds.includes(product.id) ? 'Liked' : 'Like'}
                  </span>
                </button>

                <button 
                  onClick={() => onChatOpen(product)}
                  className="flex flex-col items-center gap-1 group"
                >
                  <div className="p-2.5 bg-black/20 backdrop-blur-sm rounded-full group-active:scale-125 transition-transform">
                    <MessageCircle className="w-8 h-8 text-white fill-white/10" />
                  </div>
                  <span className="text-[11px] text-white font-bold drop-shadow-md">45.2k</span>
                </button>

                <button 
                  onClick={() => onProductOpen(product)}
                  className="flex flex-col items-center gap-1 group"
                >
                  <div className="p-2.5 bg-black/20 backdrop-blur-sm rounded-full group-active:scale-125 transition-transform">
                    <Star className="w-8 h-8 text-white fill-white/10" />
                  </div>
                  <span className="text-[11px] text-white font-bold drop-shadow-md">Reviews</span>
                </button>

                <button 
                  onClick={() => handleShare(product)}
                  className="flex flex-col items-center gap-1 group"
                >
                  <div className="p-2.5 bg-black/20 backdrop-blur-sm rounded-full group-active:scale-125 transition-transform">
                    <Share2 className="w-8 h-8 text-white fill-white/10" />
                  </div>
                  <span className="text-[11px] text-white font-bold drop-shadow-md">Share</span>
                </button>

                <button 
                  onClick={() => {
                    onAddToBag(product);
                    onInteraction(product.id, 'add_to_bag');
                  }}
                  className="flex flex-col items-center gap-1 group mt-2"
                >
                  <div className="p-3 bg-indigo-600 rounded-full shadow-xl shadow-indigo-500/40 group-active:scale-95 transition-transform">
                    <ShoppingBag className="w-7 h-7 text-white" />
                  </div>
                  <span className="text-[10px] text-white font-black mt-1 bg-black/40 px-2 py-0.5 rounded-full">Add to Bag</span>
                </button>

                <button 
                  onClick={() => onBuyNow(product)}
                  className="flex flex-col items-center gap-1 group"
                >
                  <div className="p-2.5 bg-emerald-500 rounded-full shadow-xl shadow-emerald-500/40 group-active:scale-95 transition-transform">
                    <ShoppingBag className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-[10px] text-white font-black mt-1 bg-black/40 px-2 py-0.5 rounded-full">Buy Now</span>
                </button>

                {/* Spinning Record Icon */}
                <div className="mt-4 w-10 h-10 rounded-full bg-zinc-800 border-4 border-zinc-700 flex items-center justify-center animate-spin overflow-hidden" style={{ animationDuration: '3s' }}>
                  <img src={product.mediaUrl} className="w-full h-full object-cover opacity-50" alt="record" />
                </div>
              </div>
            </div>
          );
        })}

        {/* Recommendations Section - Appears at the end of the feed */}
        <div className="h-full w-full snap-start bg-zinc-900 flex flex-col p-6 overflow-y-auto no-scrollbar">
          <div className="mt-12 mb-8">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-5 h-5 text-indigo-400" />
              <span className="text-xs font-black uppercase tracking-widest text-indigo-400">Personalized</span>
            </div>
            <h2 className="text-3xl font-black text-white leading-tight">Recommended<br />For You</h2>
            <p className="text-zinc-500 text-sm mt-2">Based on your recent viewing history</p>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-20">
            {recommendations.map((product, i) => (
              <motion.div 
                key={`rec-${product.id}`}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                className="bg-zinc-800 rounded-2xl overflow-hidden border border-white/5 group active:scale-95 transition-transform"
                onClick={() => onChatOpen(product)}
              >
                <div className="aspect-[3/4] relative">
                  <img 
                    src={product.mediaUrl} 
                    className="w-full h-full object-cover" 
                    alt={product.name}
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-2 left-2 right-2">
                    <p className="text-[10px] font-black text-white truncate">{product.name}</p>
                    <p className="text-[10px] font-bold text-indigo-400">${product.price}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <button 
            onClick={() => containerRef.current?.scrollTo({ top: 0, behavior: 'smooth' })}
            className="w-full py-4 bg-white text-black rounded-2xl font-black text-sm flex items-center justify-center gap-2 mt-auto mb-8"
          >
            Back to Top <ArrowRight className="w-4 h-4 -rotate-90" />
          </button>
        </div>
      </div>

      {/* Top Navigation */}
      <div className="absolute left-0 right-0 top-0 z-30 px-4 py-6 flex items-center justify-between">
        <button 
          onClick={() => setShowCreatePost(true)}
          className="p-2 bg-white/10 rounded-full text-white"
        >
          <Plus className="w-5 h-5" />
        </button>
        <div className="flex gap-6 text-white/60 font-bold text-base mx-auto">
          <button className="relative text-white after:absolute after:bottom-[-4px] after:left-1/2 after:-translate-x-1/2 after:w-6 after:h-1 after:bg-white after:rounded-full">
            For You
          </button>
          <button className="hover:text-white transition-colors">Following</button>
          <button className="hover:text-white transition-colors">Live</button>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => onSellerOpen('s1')}
            className="p-2 bg-white/10 rounded-full text-white"
          >
            <User className="w-5 h-5" />
          </button>
          <button 
            onClick={() => setIsMuted(!isMuted)}
            className="p-2 bg-black/20 backdrop-blur-md rounded-full text-white"
          >
            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Share Modal */}
      <AnimatePresence>
        {shareProduct && (
          <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="w-full max-w-md bg-white rounded-3xl p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold">Share</h3>
                <button onClick={() => setShareProduct(null)} className="p-2 rounded-full hover:bg-zinc-100">
                  <ChevronDown className="w-5 h-5" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => handleShareTo('whatsapp', shareProduct)} className="p-3 bg-zinc-100 rounded-xl text-xs font-bold flex items-center gap-2">
                  <Send className="w-4 h-4" /> WhatsApp
                </button>
                <button onClick={() => handleShareTo('facebook', shareProduct)} className="p-3 bg-zinc-100 rounded-xl text-xs font-bold flex items-center gap-2">
                  <Share2 className="w-4 h-4" /> Facebook
                </button>
                <button onClick={() => handleShareTo('twitter', shareProduct)} className="p-3 bg-zinc-100 rounded-xl text-xs font-bold flex items-center gap-2">
                  <Share2 className="w-4 h-4" /> X (Twitter)
                </button>
                <button onClick={() => handleShareTo('telegram', shareProduct)} className="p-3 bg-zinc-100 rounded-xl text-xs font-bold flex items-center gap-2">
                  <Send className="w-4 h-4" /> Telegram
                </button>
                <button onClick={handleCopyLink} className="p-3 bg-zinc-900 text-white rounded-xl text-xs font-bold flex items-center gap-2 col-span-2">
                  <Copy className="w-4 h-4" /> Copy Link
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Create Post Modal */}
      <AnimatePresence>
        {showCreatePost && (
          <div className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="w-full max-w-lg bg-white rounded-3xl p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold">Create Post</h3>
                <button onClick={() => setShowCreatePost(false)} className="p-2 rounded-full hover:bg-zinc-100">
                  <ChevronDown className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-3">
                <input className="w-full p-3 bg-zinc-50 rounded-xl text-xs font-bold" placeholder="Product name" value={postForm.name} onChange={(e) => setPostForm(prev => ({ ...prev, name: e.target.value }))} />
                <textarea className="w-full p-3 bg-zinc-50 rounded-xl text-xs font-bold" placeholder="Description" value={postForm.description} onChange={(e) => setPostForm(prev => ({ ...prev, description: e.target.value }))} />
                <div className="grid grid-cols-2 gap-3">
                  <input className="w-full p-3 bg-zinc-50 rounded-xl text-xs font-bold" placeholder="Price" value={postForm.price} onChange={(e) => setPostForm(prev => ({ ...prev, price: e.target.value }))} />
                  <input className="w-full p-3 bg-zinc-50 rounded-xl text-xs font-bold" placeholder="Category" value={postForm.category} onChange={(e) => setPostForm(prev => ({ ...prev, category: e.target.value }))} />
                </div>
                <input className="w-full p-3 bg-zinc-50 rounded-xl text-xs font-bold" placeholder="Media URL (optional)" value={postForm.mediaUrl} onChange={(e) => setPostForm(prev => ({ ...prev, mediaUrl: e.target.value }))} />
                <input className="w-full p-3 bg-zinc-50 rounded-xl text-xs font-bold" placeholder="Tags (comma separated)" value={postForm.tags} onChange={(e) => setPostForm(prev => ({ ...prev, tags: e.target.value }))} />
                <button onClick={handleCreatePost} className="w-full py-3 bg-zinc-900 text-white rounded-xl text-xs font-bold">Post</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Scroll Hints */}
      <AnimatePresence>
        {activeIndex === 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute left-1/2 -translate-x-1/2 bottom-32 z-30 pointer-events-none flex flex-col items-center gap-2"
          >
            <ChevronDown className="w-8 h-8 text-white animate-bounce" />
            <span className="text-white/60 text-[10px] font-bold uppercase tracking-widest">Swipe Up</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
