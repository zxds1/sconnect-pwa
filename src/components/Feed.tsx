import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, MessageCircle, Share2, ShoppingBag, ChevronDown, Music2, Volume2, VolumeX, Plus, Star, Sparkles, ArrowRight, Copy, Send, User, Radio } from 'lucide-react';
import { Product } from '../types';
import { addCartItem } from '../lib/cartApi';
import { getProduct } from '../lib/catalogApi';
import { getShopProfile } from '../lib/shopDirectoryApi';
import {
  createPost,
  followSeller,
  getFeed,
  getFeedNext,
  getFollowedSellers,
  getFollowingFeed,
  getTrendingFeed,
  joinLiveSession,
  leaveLiveSession,
  listLiveComments,
  createLiveComment,
  likeFeedItem,
  listLiveSessions,
  reportFeedItem,
  saveFeedItem,
  shareFeedItem,
  unfollowSeller,
  unlikeFeedItem,
  unsaveFeedItem
} from '../lib/feedApi';
import { buildWsUrl } from '../lib/realtime';

interface FeedProps {
  onChatOpen: (product: Product) => void;
  onProductOpen: (product: Product) => void;
  onSellerOpen: (sellerId: string) => void;
}

type FeedItem = {
  id: string;
  productId?: string;
  postId?: string;
  liveId?: string;
  sellerId: string;
  name: string;
  description: string;
  price: number;
  mediaUrl: string;
  mediaType: 'video' | 'image';
  tags: string[];
  category: string;
  stockLevel: number;
  sellerName?: string;
  sellerAvatar?: string;
  sellerRating?: number;
  sourceType?: 'post' | 'live' | 'product';
};

type LiveItem = {
  id: string;
  sellerId?: string;
  title?: string;
  startsAt?: string;
  status?: string;
  viewerCount?: number;
};

const normalizeFeedItem = (item: any): FeedItem | null => {
  if (!item) return null;
  const post = item.post || item.post_data;
  const live = item.live || item.live_data;
  const productId = item.product_id || item.productId;
  const postId = item.post_id || post?.id;
  const liveId = item.live_id || live?.id;
  const sellerId = item.seller_id || post?.seller_id || live?.seller_id || '';
  if (!sellerId) return null;
  const primaryMedia = post?.media?.[0];
  const content = post?.content || '';
  const nameGuess = content ? content.split('—')[0]?.trim() : '';
  return {
    id: item.id || postId || liveId || productId || sellerId,
    productId: productId || undefined,
    postId: postId || undefined,
    liveId: liveId || undefined,
    sellerId,
    name: nameGuess || live?.title || 'Post',
    description: content || live?.title || '',
    price: 0,
    mediaUrl: primaryMedia?.media_url || '',
    mediaType: (primaryMedia?.media_type as 'video' | 'image') || 'image',
    tags: [],
    category: item.category_id || live?.category_id || 'general',
    stockLevel: 0,
    sellerName: undefined,
    sellerAvatar: undefined,
    sellerRating: undefined,
    sourceType: postId ? 'post' : liveId ? 'live' : productId ? 'product' : undefined
  };
};

const toProduct = (item: FeedItem): Product => ({
  id: item.productId || '',
  sellerId: item.sellerId,
  name: item.name,
  description: item.description,
  price: item.price,
  category: item.category,
  mediaUrl: item.mediaUrl,
  mediaType: item.mediaType,
  tags: item.tags,
  stockLevel: item.stockLevel
});

export const Feed: React.FC<FeedProps> = ({ onChatOpen, onProductOpen, onSellerOpen }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [shareProduct, setShareProduct] = useState<FeedItem | null>(null);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [postForm, setPostForm] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    mediaUrl: '',
    tags: '',
    productId: '',
    neighborhoodId: ''
  });
  const [items, setItems] = useState<FeedItem[]>([]);
  const [trending, setTrending] = useState<FeedItem[]>([]);
  const [liveSessions, setLiveSessions] = useState<LiveItem[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [likedIds, setLikedIds] = useState<string[]>([]);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [followedSellerIds, setFollowedSellerIds] = useState<string[]>([]);
  const [tab, setTab] = useState<'for_you' | 'following' | 'live'>('for_you');
  const [activeLive, setActiveLive] = useState<LiveItem | null>(null);
  const [showLiveModal, setShowLiveModal] = useState(false);
  const [liveComments, setLiveComments] = useState<Array<{ id: string; userId?: string; message: string; createdAt?: string }>>([]);
  const [liveCommentsLoading, setLiveCommentsLoading] = useState(false);
  const [liveCommentInput, setLiveCommentInput] = useState('');
  const [liveViewerCount, setLiveViewerCount] = useState<number | null>(null);
  const [liveStatus, setLiveStatus] = useState<string | null>(null);
  const livePollRef = useRef<number | null>(null);
  const liveSocketRef = useRef<WebSocket | null>(null);
  const [liveTypingUsers, setLiveTypingUsers] = useState<string[]>([]);
  const typingTimeoutRef = useRef<number | null>(null);
  const [liveModeration, setLiveModeration] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  const getItemKey = (item: FeedItem) => item.postId || item.productId || item.liveId || item.id;

  const loadFeed = async (activeTab: 'for_you' | 'following' | 'live') => {
    setLoading(true);
    setError(null);
    try {
      if (activeTab === 'live') {
        const sessions = await listLiveSessions();
        setLiveSessions((sessions || []).map((s: any) => ({
          id: s.id,
          sellerId: s.seller_id,
          title: s.title,
          startsAt: s.starts_at,
          status: s.status,
          viewerCount: s.viewer_count
        })));
        setItems([]);
        setNextCursor(null);
      } else {
        const response = activeTab === 'following' ? await getFollowingFeed() : await getFeed();
        const list = (response.items || []).map(normalizeFeedItem).filter(Boolean) as FeedItem[];
        setItems(list);
        setNextCursor(response.next_cursor || null);
      }
    } catch (err: any) {
      setError(err?.message || 'Unable to load feed.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const [trendResp, followed] = await Promise.all([
          getTrendingFeed(),
          getFollowedSellers()
        ]);
        if (!alive) return;
        const trendItems = (trendResp.items || []).map(normalizeFeedItem).filter(Boolean) as FeedItem[];
        setTrending(trendItems);
        setFollowedSellerIds(followed);
      } catch {}
    };
    load();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    loadFeed(tab);
    setActiveIndex(0);
    containerRef.current?.scrollTo({ top: 0 });
  }, [tab]);

  const loadMore = async () => {
    if (!nextCursor || loadingMore || tab === 'live') return;
    setLoadingMore(true);
    try {
      const response = tab === 'following'
        ? await getFollowingFeed({ cursor: nextCursor })
        : await getFeedNext({ cursor: nextCursor });
      const list = (response.items || []).map(normalizeFeedItem).filter(Boolean) as FeedItem[];
      setItems(prev => [...prev, ...list]);
      setNextCursor(response.next_cursor || null);
    } catch (err: any) {
      setError(err?.message || 'Unable to load more feed items.');
    } finally {
      setLoadingMore(false);
    }
  };

  const handleScroll = () => {
    if (!containerRef.current || tab === 'live') return;
    const index = Math.round(containerRef.current.scrollTop / containerRef.current.clientHeight);
    if (index !== activeIndex && index >= 0 && index < items.length) {
      setActiveIndex(index);
    }
    if (index >= items.length - 2) {
      loadMore();
    }
  };

  const recommendations = useMemo(() => trending.filter((item) => item.productId).slice(0, 4), [trending]);

  const enrichFeedItems = async (list: FeedItem[]) => {
    if (list.length === 0) return list;
    const productIds = Array.from(new Set(list.map((item) => item.productId).filter(Boolean))) as string[];
    const sellerIds = Array.from(new Set(list.map((item) => item.sellerId).filter(Boolean))) as string[];

    const productEntries = await Promise.all(
      productIds.map(async (id) => {
        try {
          const product = await getProduct(id);
          return [id, product] as const;
        } catch {
          return [id, null] as const;
        }
      })
    );
    const sellerEntries = await Promise.all(
      sellerIds.map(async (id) => {
        try {
          const profile = await getShopProfile(id);
          return [id, profile] as const;
        } catch {
          return [id, null] as const;
        }
      })
    );
    const productMap = new Map<string, any>(productEntries.filter(([, v]) => v));
    const sellerMap = new Map<string, any>(sellerEntries.filter(([, v]) => v));

    return list.map((item) => {
      const product = item.productId ? productMap.get(item.productId) : null;
      const seller = item.sellerId ? sellerMap.get(item.sellerId) : null;
      const price = product?.price ?? product?.unit_price ?? product?.current_price;
      const mediaUrl = item.mediaUrl || product?.media_url || product?.mediaUrl || product?.image_url || '';
      return {
        ...item,
        name: product?.name || product?.title || item.name,
        description: product?.description || item.description,
        price: typeof price === 'number' ? price : item.price,
        mediaUrl,
        mediaType: (product?.media_type as 'video' | 'image') || item.mediaType,
        tags: Array.isArray(product?.tags) ? product.tags : item.tags,
        category: product?.category || product?.category_id || item.category,
        stockLevel: Number(product?.stock_level ?? product?.stockLevel ?? item.stockLevel ?? 0),
        sellerName: seller?.name || item.sellerName,
        sellerAvatar: seller?.logo_url || item.sellerAvatar,
        sellerRating: seller?.rating || item.sellerRating
      };
    });
  };

  useEffect(() => {
    let alive = true;
    const hydrate = async () => {
      const enriched = await enrichFeedItems(items);
      if (alive) setItems(enriched);
    };
    hydrate();
    return () => {
      alive = false;
    };
  }, [items.length]);

  useEffect(() => {
    let alive = true;
    const hydrate = async () => {
      const enriched = await enrichFeedItems(trending);
      if (alive) setTrending(enriched);
    };
    hydrate();
    return () => {
      alive = false;
    };
  }, [trending.length]);

  const handleShare = async (item: FeedItem) => {
    try {
      const targetId = item.postId || item.productId || item.id;
      const targetType = item.postId ? 'post' : 'product';
      await shareFeedItem({ target_type: targetType, target_id: targetId, channel: 'native' });
    } catch {}
    if (navigator.share) {
      try {
        await navigator.share({
          title: item.name,
          text: item.description,
          url: window.location.href,
        });
        return;
      } catch {}
    }
    setShareProduct(item);
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    } catch {
      alert(`Link copied: ${window.location.href}`);
    }
  };

  const handleShareTo = async (platform: string, item: FeedItem) => {
    try {
      const targetId = item.postId || item.productId || item.id;
      const targetType = item.postId ? 'post' : 'product';
      await shareFeedItem({ target_type: targetType, target_id: targetId, channel: platform });
    } catch {}
    const url = window.location.href;
    const text = `${item.name} • ${item.description}`;
    let shareUrl = '';
    if (platform === 'whatsapp') shareUrl = `https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`;
    if (platform === 'facebook') shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
    if (platform === 'twitter') shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
    if (platform === 'telegram') shareUrl = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
    if (shareUrl) window.open(shareUrl, '_blank');
  };

  const handleCreatePost = async () => {
    if (!postForm.name || !postForm.description || !postForm.category) return;
    try {
      await createPost({
        content: postForm.price
          ? `${postForm.name} — ${postForm.description} (KES ${postForm.price})`
          : `${postForm.name} — ${postForm.description}`,
        media_urls: postForm.mediaUrl ? [postForm.mediaUrl] : undefined,
        category_id: postForm.category,
        neighborhood_id: postForm.neighborhoodId || undefined,
        product_id: postForm.productId || undefined
      });
      setShowCreatePost(false);
      setPostForm({ name: '', description: '', price: '', category: '', mediaUrl: '', tags: '', productId: '', neighborhoodId: '' });
      loadFeed(tab);
    } catch (err: any) {
      setError(err?.message || 'Unable to create post.');
    }
  };

  const toggleLike = async (item: FeedItem) => {
    const key = getItemKey(item);
    const isLiked = likedIds.includes(key);
    try {
      if (isLiked) {
        await unlikeFeedItem(key);
        setLikedIds(prev => prev.filter(id => id !== key));
      } else {
        if (!item.postId && !item.productId) {
          setError('Unable to like this item.');
          return;
        }
        await likeFeedItem(item.postId ? { post_id: item.postId } : { target_id: item.productId });
        setLikedIds(prev => [...prev, key]);
      }
    } catch (err: any) {
      setError(err?.message || 'Unable to update like.');
    }
  };

  const toggleSave = async (item: FeedItem) => {
    const key = getItemKey(item);
    const isSaved = savedIds.includes(key);
    try {
      if (isSaved) {
        await unsaveFeedItem(key);
        setSavedIds(prev => prev.filter(id => id !== key));
      } else {
        if (!item.postId && !item.productId) {
          setError('Unable to save this item.');
          return;
        }
        await saveFeedItem(item.postId ? { post_id: item.postId } : { target_id: item.productId });
        setSavedIds(prev => [...prev, key]);
      }
    } catch (err: any) {
      setError(err?.message || 'Unable to update save.');
    }
  };

  const toggleFollow = async (sellerId: string) => {
    const isFollowed = followedSellerIds.includes(sellerId);
    try {
      if (isFollowed) {
        await unfollowSeller(sellerId);
        setFollowedSellerIds(prev => prev.filter(id => id !== sellerId));
      } else {
        await followSeller(sellerId);
        setFollowedSellerIds(prev => [...prev, sellerId]);
      }
    } catch (err: any) {
      setError(err?.message || 'Unable to update follow.');
    }
  };

  const handleAddToBag = async (item: FeedItem) => {
    try {
      if (!item.productId || !item.sellerId || !item.price) {
        setError('This post is not linked to a purchasable product.');
        return;
      }
      await addCartItem({ product_id: item.productId, seller_id: item.sellerId, quantity: 1, unit_price: item.price });
    } catch (err: any) {
      setError(err?.message || 'Unable to add to bag.');
    }
  };

  const handleBuyNow = async (item: FeedItem) => {
    await handleAddToBag(item);
    if (item.productId) {
      onProductOpen(toProduct(item));
    }
  };

  const handleReport = async (item: FeedItem) => {
    try {
      const targetId = item.postId || item.productId || item.id;
      const targetType = item.postId ? 'post' : 'product';
      await reportFeedItem({ target_type: targetType, target_id: targetId, report_type: 'feed', reason: 'user_report' });
    } catch {}
  };

  const fetchLiveComments = async (liveId: string) => {
    setLiveCommentsLoading(true);
    try {
      const resp = await listLiveComments(liveId, { limit: 50 });
      const items = Array.isArray(resp?.items) ? resp.items : [];
      const mapped = items.map((item: any) => ({
        id: item.id || item?.post?.id || item?.comment_id || Math.random().toString(16).slice(2),
        userId: item?.seller_id || item?.post?.user_id || item?.user_id,
        message: item?.post?.content || item?.message || item?.content || '',
        createdAt: item?.created_at || item?.post?.created_at
      }));
      setLiveComments(mapped.reverse());
    } catch {
      // ignore
    } finally {
      setLiveCommentsLoading(false);
    }
  };

  const openLiveSession = async (session: LiveItem) => {
    setActiveLive(session);
    setShowLiveModal(true);
    setLiveComments([]);
    setLiveCommentInput('');
    setLiveStatus(session.status || null);
    setLiveViewerCount(session.viewerCount ?? null);
    setLiveTypingUsers([]);
    setLiveModeration(null);
    try {
      const resp = await joinLiveSession(session.id);
      if (resp?.viewer_count !== undefined) {
        setLiveViewerCount(resp.viewer_count);
        setLiveSessions((prev) => prev.map((s) => (s.id === session.id ? { ...s, viewerCount: resp.viewer_count } : s)));
      }
    } catch {}
    fetchLiveComments(session.id);
    if (liveSocketRef.current) {
      liveSocketRef.current.close();
    }
    const ws = new WebSocket(buildWsUrl(`/v1/live/${session.id}/ws`));
    liveSocketRef.current = ws;
    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.type === 'comment') {
          setLiveComments((prev) => [...prev, {
            id: `${payload.user_id || 'user'}-${payload.created_at || Date.now()}`,
            userId: payload.user_id,
            message: payload.message || '',
            createdAt: payload.created_at
          }]);
        }
        if (payload.type === 'typing') {
          const userId = payload.user_id || 'user';
          setLiveTypingUsers((prev) => {
            const next = new Set(prev);
            if (payload.is_typing) {
              next.add(userId);
            } else {
              next.delete(userId);
            }
            return Array.from(next);
          });
        }
        if (payload.type === 'viewer' && typeof payload.viewer_count === 'number') {
          setLiveViewerCount(payload.viewer_count);
        }
        if (payload.type === 'status' && payload.status) {
          setLiveStatus(payload.status);
        }
        if (payload.type === 'moderation') {
          setLiveModeration(payload.reason || 'Comment blocked by moderation.');
        }
      } catch {}
    };
  };

  const closeLiveSession = async () => {
    if (liveSocketRef.current) {
      liveSocketRef.current.close();
      liveSocketRef.current = null;
    }
    if (activeLive?.id) {
      try {
        const resp = await leaveLiveSession(activeLive.id);
        if (resp?.viewer_count !== undefined) {
          setLiveViewerCount(resp.viewer_count);
          setLiveSessions((prev) => prev.map((s) => (s.id === activeLive.id ? { ...s, viewerCount: resp.viewer_count } : s)));
        }
      } catch {}
    }
    setShowLiveModal(false);
    setActiveLive(null);
    setLiveComments([]);
  };

  const handleSendLiveComment = async () => {
    if (!activeLive?.id || !liveCommentInput.trim()) return;
    const message = liveCommentInput.trim();
    setLiveCommentInput('');
    setLiveComments((prev) => [...prev, { id: `local-${Date.now()}`, message }]);
    if (liveSocketRef.current && liveSocketRef.current.readyState === WebSocket.OPEN) {
      liveSocketRef.current.send(JSON.stringify({ type: 'comment', message }));
      return;
    }
    try {
      await createLiveComment(activeLive.id, message);
      fetchLiveComments(activeLive.id);
    } catch {}
  };

  const sendTyping = (isTyping: boolean) => {
    if (!liveSocketRef.current || liveSocketRef.current.readyState !== WebSocket.OPEN) return;
    liveSocketRef.current.send(JSON.stringify({ type: 'typing', is_typing: isTyping }));
  };

  useEffect(() => {
    return () => {
      if (livePollRef.current) window.clearInterval(livePollRef.current);
      if (liveSocketRef.current) liveSocketRef.current.close();
    };
  }, []);

  if (tab === 'live') {
    return (
      <div className="relative h-full w-full bg-black overflow-hidden select-none">
        <div className="absolute left-0 right-0 top-0 z-30 px-4 py-6">
          <div className="w-full max-w-5xl mx-auto flex items-center justify-between">
            <button 
              onClick={() => setShowCreatePost(true)}
              className="p-2 bg-white/10 rounded-full text-white"
            >
              <Plus className="w-5 h-5" />
            </button>
            <div className="flex gap-6 text-white/60 font-bold text-base mx-auto">
              <button onClick={() => setTab('for_you')} className="hover:text-white transition-colors">For You</button>
              <button onClick={() => setTab('following')} className="hover:text-white transition-colors">Following</button>
              <button className="relative text-white after:absolute after:bottom-[-4px] after:left-1/2 after:-translate-x-1/2 after:w-6 after:h-1 after:bg-white after:rounded-full">
                Live
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => onSellerOpen('')}
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
        </div>

        <div className="pt-24 px-4 pb-8 space-y-4 overflow-y-auto h-full">
          <div className="w-full max-w-3xl mx-auto space-y-4">
          {error && (
            <div className="bg-red-500/20 border border-red-500/40 text-red-100 text-[10px] font-bold rounded-2xl px-4 py-3">
              {error}
            </div>
          )}
          {loading && (
            <div className="text-white/70 text-sm font-bold">Loading live sessions...</div>
          )}
          {!loading && liveSessions.length === 0 && (
            <div className="bg-white/10 border border-white/10 rounded-3xl p-6 text-white">
              <p className="text-lg font-black">No live sessions right now</p>
              <p className="text-[11px] text-white/70 mt-2">Start one to showcase your products in real time.</p>
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => setShowCreatePost(true)}
                  className="px-4 py-2 bg-emerald-500 text-white rounded-xl text-[10px] font-bold"
                >
                  Create Post
                </button>
                <button
                  onClick={() => setTab('for_you')}
                  className="px-4 py-2 bg-white/10 text-white rounded-xl text-[10px] font-bold"
                >
                  Explore Feed
                </button>
              </div>
            </div>
          )}
          {liveSessions.map(session => (
            <div key={session.id} className="bg-white/10 border border-white/10 rounded-3xl p-5 text-white">
              <div className="flex items-center gap-2 text-[10px] font-bold text-red-300 uppercase tracking-widest">
                <Radio className="w-4 h-4" /> Live
              </div>
              <h3 className="mt-2 text-lg font-black">{session.title || 'Live Session'}</h3>
              <p className="text-[11px] text-white/60">Viewers: {session.viewerCount ?? '—'}</p>
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => openLiveSession(session)}
                  className="px-4 py-2 bg-emerald-500 text-white rounded-xl text-[10px] font-bold"
                >
                  Enter Live
                </button>
                <button
                  onClick={() => leaveLiveSession(session.id)}
                  className="px-4 py-2 bg-white/10 text-white rounded-xl text-[10px] font-bold"
                >
                  Leave
                </button>
              </div>
            </div>
          ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full bg-black overflow-hidden select-none">
      <div 
        ref={containerRef}
        onScroll={handleScroll}
        className="h-full w-full overflow-y-scroll snap-y snap-mandatory no-scrollbar"
        style={{ scrollSnapStop: 'always' }}
      >
        {loading && (
          <div className="h-full w-full flex items-center justify-center text-white/70 text-sm font-bold">Loading feed...</div>
        )}

        {!loading && items.length === 0 && (
          <div className="h-full w-full flex items-center justify-center">
            <div className="w-full max-w-md bg-white/10 border border-white/10 rounded-3xl p-6 text-white text-center">
              <p className="text-lg font-black">Welcome to Sconnect Feed</p>
              <p className="text-[11px] text-white/70 mt-2">
                Follow sellers, discover new drops, or create your first post.
              </p>
              <div className="mt-5 flex flex-col gap-2">
                <button
                  onClick={() => setShowCreatePost(true)}
                  className="w-full py-3 bg-emerald-500 text-white rounded-2xl text-[11px] font-bold"
                >
                  Create Post
                </button>
                <button
                  onClick={() => setTab('following')}
                  className="w-full py-3 bg-white/10 text-white rounded-2xl text-[11px] font-bold"
                >
                  View Following
                </button>
                <button
                  onClick={() => setTab('for_you')}
                  className="w-full py-3 bg-white/10 text-white rounded-2xl text-[11px] font-bold"
                >
                  Explore For You
                </button>
              </div>
            </div>
          </div>
        )}

        {!loading && items.map((item, index) => (
          <div key={item.id} className="h-full w-full snap-start relative flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 z-0">
              {item.mediaUrl ? (
                <img 
                  src={item.mediaUrl} 
                  alt={item.name}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-full h-full bg-zinc-900" />
              )}
              <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/80" />
              <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/60 to-transparent" />
            </div>

            <div className="absolute inset-0 z-10 pointer-events-none">
              <div className="w-full max-w-5xl mx-auto h-full relative">
                <div className="absolute bottom-6 left-4 right-20 text-white pointer-events-none">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={index === activeIndex ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                    transition={{ duration: 0.5 }}
                    className="pointer-events-auto cursor-pointer"
                    onClick={() => {
                      if (item.productId) {
                        onProductOpen(toProduct(item));
                      }
                    }}
                  >
                    <div className="flex items-center gap-2 mb-3 pointer-events-auto">
                      {item.sellerAvatar ? (
                        <img 
                          src={item.sellerAvatar} 
                          className="w-10 h-10 rounded-full border-2 border-white"
                          alt="avatar"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (item.sellerId) onSellerOpen(item.sellerId);
                          }}
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full border-2 border-white bg-white/20 flex items-center justify-center text-[10px] font-black">
                          {item.sellerName?.slice(0, 2).toUpperCase() || 'SC'}
                        </div>
                      )}
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          if (item.sellerId) onSellerOpen(item.sellerId);
                        }}
                        className="font-bold text-lg shadow-sm"
                      >
                        @{item.sellerName || 'Seller'}
                      </button>
                      <div className="flex items-center gap-1 bg-black/20 backdrop-blur-md px-2 py-1 rounded-lg">
                        <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                        <span className="text-[10px] font-black">{item.sellerRating ?? '—'}</span>
                      </div>
                      {item.sellerId && (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFollow(item.sellerId);
                          }}
                          className={`text-[10px] px-3 py-1 rounded-full font-bold uppercase tracking-wider ml-2 ${
                            followedSellerIds.includes(item.sellerId) ? 'bg-white text-zinc-900' : 'bg-red-500 text-white'
                          }`}
                        >
                          {followedSellerIds.includes(item.sellerId) ? 'Following' : 'Follow'}
                        </button>
                      )}
                    </div>

                    <h3 className="text-xl font-bold mb-1 drop-shadow-lg">{item.name}</h3>
                    <p className="text-sm opacity-90 line-clamp-2 mb-4 drop-shadow-md max-w-[85%]">
                      {item.description}
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
                        <span className="text-xs font-medium truncate max-w-[200px]">Original sound</span>
                        {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                      </button>
                    </div>

                    <div className="flex gap-2 pointer-events-auto">
                      {item.tags.map(tag => (
                        <span key={tag} className="px-2 py-1 bg-white/10 backdrop-blur-md rounded-md text-[10px] font-bold uppercase tracking-tight border border-white/10">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </motion.div>
                </div>

                <div className="absolute right-4 bottom-10 z-20 flex flex-col gap-5 items-center pointer-events-auto">
              <div className="relative mb-4">
                {item.sellerAvatar ? (
                  <img 
                    src={item.sellerAvatar} 
                    className="w-12 h-12 rounded-full border-2 border-white"
                    alt="seller"
                    onClick={() => item.sellerId && onSellerOpen(item.sellerId)}
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full border-2 border-white bg-white/20 flex items-center justify-center text-[10px] font-black">
                    {item.sellerName?.slice(0, 2).toUpperCase() || 'SC'}
                  </div>
                )}
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-red-500 rounded-full p-0.5 border-2 border-black">
                  <Plus className="w-3 h-3 text-white" />
                </div>
              </div>

              <button 
                onClick={() => toggleLike(item)}
                className="flex flex-col items-center gap-1 group"
              >
                <div className="p-2.5 bg-black/20 backdrop-blur-sm rounded-full group-active:scale-125 transition-transform">
                  <Heart className={`w-8 h-8 ${likedIds.includes(getItemKey(item)) ? 'text-red-500 fill-red-500' : 'text-white fill-transparent'} transition-colors`} />
                </div>
                <span className="text-[11px] text-white font-bold drop-shadow-md">
                  {likedIds.includes(getItemKey(item)) ? 'Liked' : 'Like'}
                </span>
              </button>

              <button 
                onClick={() => {
                  if (item.productId) {
                    onChatOpen(toProduct(item));
                  }
                }}
                className="flex flex-col items-center gap-1 group"
              >
                <div className="p-2.5 bg-black/20 backdrop-blur-sm rounded-full group-active:scale-125 transition-transform">
                  <MessageCircle className="w-8 h-8 text-white fill-white/10" />
                </div>
                <span className="text-[11px] text-white font-bold drop-shadow-md">Chat</span>
              </button>

              <button 
                onClick={() => toggleSave(item)}
                className="flex flex-col items-center gap-1 group"
              >
                <div className="p-2.5 bg-black/20 backdrop-blur-sm rounded-full group-active:scale-125 transition-transform">
                  <Star className={`w-8 h-8 ${savedIds.includes(getItemKey(item)) ? 'text-amber-400 fill-amber-400' : 'text-white fill-white/10'}`} />
                </div>
                <span className="text-[11px] text-white font-bold drop-shadow-md">
                  {savedIds.includes(getItemKey(item)) ? 'Saved' : 'Save'}
                </span>
              </button>

              <button 
                onClick={() => handleShare(item)}
                className="flex flex-col items-center gap-1 group"
              >
                <div className="p-2.5 bg-black/20 backdrop-blur-sm rounded-full group-active:scale-125 transition-transform">
                  <Share2 className="w-8 h-8 text-white fill-white/10" />
                </div>
                <span className="text-[11px] text-white font-bold drop-shadow-md">Share</span>
              </button>

              <button 
                onClick={() => handleAddToBag(item)}
                className="flex flex-col items-center gap-1 group mt-2"
              >
                <div className="p-3 bg-indigo-600 rounded-full shadow-xl shadow-indigo-500/40 group-active:scale-95 transition-transform">
                  <ShoppingBag className="w-7 h-7 text-white" />
                </div>
                <span className="text-[10px] text-white font-black mt-1 bg-black/40 px-2 py-0.5 rounded-full">Add to Bag</span>
              </button>

              <button 
                onClick={() => handleBuyNow(item)}
                className="flex flex-col items-center gap-1 group"
              >
                <div className="p-2.5 bg-emerald-500 rounded-full shadow-xl shadow-emerald-500/40 group-active:scale-95 transition-transform">
                  <ShoppingBag className="w-6 h-6 text-white" />
                </div>
                <span className="text-[10px] text-white font-black mt-1 bg-black/40 px-2 py-0.5 rounded-full">Buy Now</span>
              </button>

              <button
                onClick={() => handleReport(item)}
                className="text-[9px] text-white/60 font-bold"
              >
                Report
              </button>

              <div className="mt-4 w-10 h-10 rounded-full bg-zinc-800 border-4 border-zinc-700 flex items-center justify-center animate-spin overflow-hidden" style={{ animationDuration: '3s' }}>
                {item.mediaUrl ? (
                  <img src={item.mediaUrl} className="w-full h-full object-cover opacity-50" alt="record" />
                ) : (
                  <div className="w-full h-full bg-zinc-700" />
                )}
              </div>
              </div>
            </div>
          </div>
          </div>
        ))}

        {recommendations.length > 0 && (
          <div className="h-full w-full snap-start bg-zinc-900 flex flex-col p-6 overflow-y-auto no-scrollbar">
            <div className="w-full max-w-5xl mx-auto">
              <div className="mt-12 mb-8">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-5 h-5 text-indigo-400" />
                <span className="text-xs font-black uppercase tracking-widest text-indigo-400">Personalized</span>
              </div>
              <h2 className="text-3xl font-black text-white leading-tight">Recommended<br />For You</h2>
              <p className="text-zinc-500 text-sm mt-2">Based on trending inventory</p>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-20">
              {recommendations.map((product, i) => (
                <motion.div 
                  key={`rec-${product.id}`}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-zinc-800 rounded-2xl overflow-hidden border border-white/5 group active:scale-95 transition-transform"
                  onClick={() => {
                    if (product.productId) {
                      onChatOpen(toProduct(product));
                    }
                  }}
                >
                  <div className="aspect-[3/4] relative">
                    {product.mediaUrl ? (
                      <img 
                        src={product.mediaUrl} 
                        className="w-full h-full object-cover" 
                        alt={product.name}
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full bg-zinc-700" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-2 left-2 right-2">
                      <p className="text-[10px] font-black text-white truncate">{product.name}</p>
                      <p className="text-[10px] font-bold text-indigo-400">KES {product.price || '—'}</p>
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
        )}
      </div>

      <div className="absolute left-0 right-0 top-0 z-30 px-4 py-6">
        <div className="w-full max-w-5xl mx-auto flex items-center justify-between">
          <button 
            onClick={() => setShowCreatePost(true)}
            className="p-2 bg-white/10 rounded-full text-white"
          >
            <Plus className="w-5 h-5" />
          </button>
          <div className="flex gap-6 text-white/60 font-bold text-base mx-auto">
            <button
              onClick={() => setTab('for_you')}
              className={`relative ${tab === 'for_you' ? 'text-white after:absolute after:bottom-[-4px] after:left-1/2 after:-translate-x-1/2 after:w-6 after:h-1 after:bg-white after:rounded-full' : 'hover:text-white transition-colors'}`}
            >
              For You
            </button>
            <button
              onClick={() => setTab('following')}
              className={`relative ${tab === 'following' ? 'text-white after:absolute after:bottom-[-4px] after:left-1/2 after:-translate-x-1/2 after:w-6 after:h-1 after:bg-white after:rounded-full' : 'hover:text-white transition-colors'}`}
            >
              Following
            </button>
            <button
              onClick={() => setTab('live')}
              className="relative hover:text-white transition-colors"
            >
              Live
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => onSellerOpen('')}
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
      </div>

      <AnimatePresence>
        {showLiveModal && activeLive && (
          <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="w-full max-w-lg bg-white rounded-3xl overflow-hidden"
            >
              <div className="p-4 bg-slate-950 text-white flex items-center justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-widest">Live Session</p>
                  <p className="text-[11px] text-white/70 mt-1">{activeLive.title || 'Live'}</p>
                </div>
                <button onClick={closeLiveSession} className="p-2 rounded-full hover:bg-white/10">
                  <ChevronDown className="w-5 h-5" />
                </button>
              </div>
              <div className="p-4 border-b flex items-center justify-between text-[10px] font-bold text-zinc-600">
                <span className="px-2 py-1 rounded-full bg-emerald-50 text-emerald-600 uppercase">
                  {liveStatus || activeLive.status || 'live'}
                </span>
                <span>{liveViewerCount ?? activeLive.viewerCount ?? 0} viewers</span>
              </div>
              <div className="max-h-[50vh] overflow-y-auto p-4 space-y-3 bg-zinc-50">
                {liveCommentsLoading && (
                  <div className="text-[10px] text-zinc-400 font-bold">Loading comments…</div>
                )}
                {!liveCommentsLoading && liveComments.length === 0 && (
                  <div className="text-[10px] text-zinc-400 font-bold">No comments yet. Be the first to say hi!</div>
                )}
                {liveComments.map((comment) => (
                  <div key={comment.id} className="bg-white rounded-2xl border border-zinc-100 px-3 py-2">
                    <div className="text-[9px] text-zinc-400 font-bold">User {comment.userId?.slice(-4) || 'anon'}</div>
                    <div className="text-[11px] text-zinc-800 font-semibold">{comment.message}</div>
                  </div>
                ))}
                {liveTypingUsers.length > 0 && (
                  <div className="text-[10px] text-zinc-400 font-bold">
                    {liveTypingUsers.slice(0, 3).map((u) => `User ${String(u).slice(-4)}`).join(', ')} typing…
                  </div>
                )}
              </div>
              <div className="p-4 border-t bg-white">
                {liveModeration && (
                  <div className="mb-2 text-[10px] font-bold text-rose-600">{liveModeration}</div>
                )}
                <div className="flex items-center gap-2">
                  <input
                    value={liveCommentInput}
                    onChange={(e) => {
                      setLiveCommentInput(e.target.value);
                      sendTyping(true);
                      if (typingTimeoutRef.current) {
                        window.clearTimeout(typingTimeoutRef.current);
                      }
                      typingTimeoutRef.current = window.setTimeout(() => {
                        sendTyping(false);
                      }, 1500);
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendLiveComment()}
                    onFocus={() => sendTyping(true)}
                    onBlur={() => sendTyping(false)}
                    placeholder="Write a comment..."
                    className="flex-1 px-3 py-2 rounded-full bg-zinc-100 text-sm outline-none focus:ring-2 focus:ring-emerald-500/30"
                  />
                  <button
                    onClick={handleSendLiveComment}
                    className="px-4 py-2 bg-emerald-500 text-white rounded-full text-[11px] font-bold"
                  >
                    Send
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
                <input className="w-full p-3 bg-zinc-50 rounded-xl text-xs font-bold text-zinc-900" placeholder="Product name" value={postForm.name} onChange={(e) => setPostForm(prev => ({ ...prev, name: e.target.value }))} />
                <textarea className="w-full p-3 bg-zinc-50 rounded-xl text-xs font-bold text-zinc-900" placeholder="Description" value={postForm.description} onChange={(e) => setPostForm(prev => ({ ...prev, description: e.target.value }))} />
                <div className="grid grid-cols-2 gap-3">
                  <input className="w-full p-3 bg-zinc-50 rounded-xl text-xs font-bold text-zinc-900" placeholder="Price" value={postForm.price} onChange={(e) => setPostForm(prev => ({ ...prev, price: e.target.value }))} />
                  <input className="w-full p-3 bg-zinc-50 rounded-xl text-xs font-bold text-zinc-900" placeholder="Category" value={postForm.category} onChange={(e) => setPostForm(prev => ({ ...prev, category: e.target.value }))} />
                </div>
                <input className="w-full p-3 bg-zinc-50 rounded-xl text-xs font-bold text-zinc-900" placeholder="Media URL (optional)" value={postForm.mediaUrl} onChange={(e) => setPostForm(prev => ({ ...prev, mediaUrl: e.target.value }))} />
                <input className="w-full p-3 bg-zinc-50 rounded-xl text-xs font-bold text-zinc-900" placeholder="Product ID (optional)" value={postForm.productId} onChange={(e) => setPostForm(prev => ({ ...prev, productId: e.target.value }))} />
                <input className="w-full p-3 bg-zinc-50 rounded-xl text-xs font-bold text-zinc-900" placeholder="Neighborhood ID (optional)" value={postForm.neighborhoodId} onChange={(e) => setPostForm(prev => ({ ...prev, neighborhoodId: e.target.value }))} />
                <input className="w-full p-3 bg-zinc-50 rounded-xl text-xs font-bold text-zinc-900" placeholder="Tags (comma separated)" value={postForm.tags} onChange={(e) => setPostForm(prev => ({ ...prev, tags: e.target.value }))} />
                <button onClick={handleCreatePost} className="w-full py-3 bg-zinc-900 text-white rounded-xl text-xs font-bold">Post</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {activeIndex === 0 && !loading && items.length > 0 && (
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
