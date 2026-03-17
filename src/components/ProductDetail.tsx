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
import { Product, PricePoint, Review } from '../types';
import { ProductAIChat } from './ProductAIChat';
import {
  getProductDetail,
  getProductMedia,
  getProductPriceHistory,
  getProductBenchmark,
  getProductGoodDeal,
  listProductReviews,
  createProductReview,
  listProductQuestions,
  createProductQuestion,
  answerProductQuestion,
  watchProduct,
  updateWatch,
  unwatchProduct,
  shareProduct
} from '../lib/productDetailApi';
import { addCartItem, checkoutCart, scheduleOrderFollowup, submitOrderRating } from '../lib/cartApi';
import { getShopProfile } from '../lib/shopDirectoryApi';
import {
  createCounterfeitReport,
  createDispute,
  createModerationReview,
  getCounterfeitSummary,
  getDisputeSummary,
  getSellerReputation,
  uploadDisputeEvidence
} from '../lib/supportApi';
import { createAuditEvent } from '../lib/securityApi';
import { requestUploadPresign } from '../lib/uploadsApi';

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

type QuestionItem = { id: string; question: string; answer?: string; author?: string };

type SellerProfile = Record<string, any>;

type SellerReputation = Record<string, any>;

type SummaryStat = Record<string, any>;

const numberOrZero = (value: any) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const resolveMediaUrl = (media: any[]) => {
  if (!media?.length) return undefined;
  const item = media[0];
  return item?.url || item?.media_url || item?.src || item?.path || undefined;
};

const normalizeExternalUrl = (value?: string) => {
  if (!value) return '';
  const trimmed = value.trim();
  if (!trimmed) return '';
  return trimmed.startsWith('http') ? trimmed : `https://${trimmed}`;
};

const normalizePriceHistory = (data: any[]): PricePoint[] => {
  return (data || []).map((point) => ({
    date: point.date || point.timestamp || point.day || point.created_at || '',
    price: numberOrZero(point.price ?? point.amount ?? point.value),
  })).filter((point) => point.price > 0);
};

const normalizeReview = (review: any): Review => ({
  id: review.id || `r_${Math.random().toString(16).slice(2)}`,
  userId: review.user_id || review.userId || 'user',
  userName: review.user_name || review.userName || 'Anonymous',
  userAvatar: review.user_avatar || review.userAvatar || `https://i.pravatar.cc/150?u=${review.user_id || review.userId || review.id}`,
  rating: numberOrZero(review.rating) || 0,
  comment: review.comment || review.body || '',
  timestamp: review.timestamp ? Number(review.timestamp) : new Date(review.created_at || Date.now()).getTime(),
  isVerifiedPurchase: review.verified || review.is_verified_purchase || review.isVerifiedPurchase,
  replies: Array.isArray(review.replies) ? review.replies.map((reply: any) => ({
    id: reply.id || `rp_${Math.random().toString(16).slice(2)}`,
    sellerId: reply.seller_id || reply.sellerId || 'seller',
    sellerName: reply.seller_name || reply.sellerName || 'Seller',
    comment: reply.comment || reply.body || '',
    timestamp: reply.timestamp ? Number(reply.timestamp) : new Date(reply.created_at || Date.now()).getTime(),
  })) : [],
});

const normalizeQuestion = (item: any): QuestionItem => ({
  id: item.id || `q_${Math.random().toString(16).slice(2)}`,
  question: item.question || item.body || item.text || '',
  answer: item.answer || item.reply || item.response,
  author: item.author || item.user_name || 'Community',
});

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
  const [followupOrderId, setFollowupOrderId] = React.useState('');
  const [ratingOrderId, setRatingOrderId] = React.useState('');
  const [orderRating, setOrderRating] = React.useState(5);
  const [orderComment, setOrderComment] = React.useState('');
  const [qaList, setQaList] = React.useState<QuestionItem[]>([]);
  const [qaInput, setQaInput] = React.useState('');
  const [productDetail, setProductDetail] = React.useState<Product>(product);
  const [media, setMedia] = React.useState<any[]>([]);
  const [priceHistory, setPriceHistory] = React.useState<PricePoint[]>([]);
  const [benchmark, setBenchmark] = React.useState<Record<string, any> | null>(null);
  const [goodDeal, setGoodDeal] = React.useState<Record<string, any> | null>(null);
  const [reviews, setReviews] = React.useState<Review[]>([]);
  const [sellerProfile, setSellerProfile] = React.useState<SellerProfile | null>(null);
  const [sellerReputation, setSellerReputation] = React.useState<SellerReputation | null>(null);
  const [counterfeitSummary, setCounterfeitSummary] = React.useState<SummaryStat | null>(null);
  const [, setDisputeSummary] = React.useState<SummaryStat | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [showCounterfeitModal, setShowCounterfeitModal] = React.useState(false);
  const [showDisputeModal, setShowDisputeModal] = React.useState(false);
  const [counterfeitForm, setCounterfeitForm] = React.useState({
    reason: '',
    orderId: '',
    evidenceKeys: '',
  });
  const [counterfeitErrors, setCounterfeitErrors] = React.useState<{ reason?: string }>({});
  const [disputeForm, setDisputeForm] = React.useState({
    orderId: '',
    reason: '',
    amount: '0',
    delivered: false,
    notReceived: true,
    gpsProof: false,
  });
  const [disputeErrors, setDisputeErrors] = React.useState<{ orderId?: string; reason?: string; amount?: string }>({});
  const [disputeId, setDisputeId] = React.useState('');
  const [disputeStatus, setDisputeStatus] = React.useState<string | null>(null);
  const [evidenceForm, setEvidenceForm] = React.useState({
    s3Key: '',
    fileName: '',
    mimeType: '',
    gpsLat: '',
    gpsLng: '',
    buyerPhone: '',
  });
  const [evidenceErrors, setEvidenceErrors] = React.useState<{ s3Key?: string; fileName?: string; mimeType?: string }>({});
  const [evidenceStatus, setEvidenceStatus] = React.useState<string | null>(null);
  const [uploadStatus, setUploadStatus] = React.useState<string | null>(null);
  const [uploading, setUploading] = React.useState(false);

  const activeProduct = React.useMemo(() => ({ ...product, ...productDetail }), [product, productDetail]);
  const productId = activeProduct.id;
  const sellerId = (activeProduct as any).seller_id || activeProduct.sellerId || (productDetail as any).seller_id || product.sellerId;
  const primaryMedia = resolveMediaUrl(media) || activeProduct.mediaUrl;
  const externalProductUrl = normalizeExternalUrl(
    (activeProduct as any).product_url
      || (activeProduct as any).external_url
      || (activeProduct as any).website_url
      || (activeProduct as any).url
      || sellerProfile?.website_url
      || sellerProfile?.website
      || sellerProfile?.store_url
      || sellerProfile?.shop_url
      || sellerProfile?.external_url
      || sellerProfile?.url
  );
  const baseRating = numberOrZero(sellerReputation?.rating ?? sellerProfile?.rating);
  const averageRating = reviews.length
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
    : baseRating.toFixed(1);

  const benchmarkPrice = numberOrZero(
    benchmark?.average_price ?? benchmark?.avg_price ?? benchmark?.price ?? benchmark?.market_price ?? activeProduct.competitorPrice
  );

  const goodDealFlag = Boolean(goodDeal?.is_good_deal || goodDeal?.good_deal || activeProduct.isGoodDeal);

  const handleWhatsApp = () => {
    const phone = sellerProfile?.whatsappNumber || sellerProfile?.whatsapp_number || sellerProfile?.whatsapp;
    if (phone) {
      const message = encodeURIComponent(`Hi, I'm interested in ${activeProduct.name} I saw on Sconnect. Is it still available?`);
      window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
      return;
    }
    setError('WhatsApp contact not available for this seller.');
  };

  const handleGetDirections = () => {
    const address = activeProduct.location?.address || sellerProfile?.location?.address || sellerProfile?.address;
    if (address) {
      window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`, '_blank');
    }
  };

  const handleVisitSite = () => {
    if (!externalProductUrl) return;
    window.open(externalProductUrl, '_blank');
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
    setFlyThumb({ src: primaryMedia, start, end });
    window.setTimeout(() => setFlyThumb(null), 850);
  };

  const handleAddToComparisonClick = () => {
    if (isCompared) return;
    onAddToComparison(activeProduct);
    window.setTimeout(triggerComparisonFly, 60);
  };

  const handleBuyNow = async () => {
    if (onBuyNow) {
      onBuyNow(activeProduct);
      return;
    }
    try {
      if (!sellerId) {
        setError('Seller unavailable for this product.');
        return;
      }
      await addCartItem({
        product_id: productId,
        seller_id: sellerId,
        quantity,
        unit_price: activeProduct.price,
      });
      await checkoutCart();
      void createAuditEvent({ action: 'buy_now', entity_type: 'product', entity_id: productId }).catch(() => {});
    } catch (err: any) {
      setError(err?.message || 'Unable to complete checkout.');
    }
  };

  const handleAddToBagClick = async () => {
    try {
      if (!sellerId) {
        setError('Seller unavailable for this product.');
        return;
      }
      await addCartItem({
        product_id: productId,
        seller_id: sellerId,
        quantity,
        unit_price: activeProduct.price,
      });
      onAddToBag?.(activeProduct);
      void createAuditEvent({ action: 'add_to_cart', entity_type: 'product', entity_id: productId }).catch(() => {});
    } catch (err: any) {
      setError(err?.message || 'Unable to add to bag.');
    }
  };

  const handleSubmitReview = async () => {
    if (!reviewForm.comment.trim()) return;
    try {
      const created = await createProductReview(productId, {
        rating: reviewForm.rating,
        comment: reviewForm.comment,
      });
      const nextReview = normalizeReview(created || {
        id: `r_${Date.now()}`,
        user_name: reviewForm.name || 'You',
        rating: reviewForm.rating,
        comment: reviewForm.comment,
        created_at: new Date().toISOString(),
        verified: true,
      });
      setReviews(prev => [nextReview, ...prev]);
      setReviewForm({ name: 'You', rating: 5, comment: '' });
      setShowReviewForm(false);
      void createAuditEvent({ action: 'create_review', entity_type: 'product', entity_id: productId }).catch(() => {});
    } catch (err: any) {
      setError(err?.message || 'Could not submit review.');
    }
  };

  const handleFlagReview = async (reviewId: string) => {
    try {
      await createModerationReview({
        source_type: 'product_review',
        source_id: reviewId,
        seller_id: sellerId,
        reason: 'flagged_by_user',
      });
      void createAuditEvent({ action: 'flag_review', entity_type: 'review', entity_id: reviewId }).catch(() => {});
    } catch (err: any) {
      setError(err?.message || 'Unable to flag review.');
    }
  };

  const handleAskQuestion = async () => {
    if (!qaInput.trim()) return;
    try {
      const created = await createProductQuestion(productId, { question: qaInput.trim() });
      const nextQuestion = normalizeQuestion(created || { question: qaInput.trim(), author: 'You' });
      setQaList(prev => [nextQuestion, ...prev]);
      setQaInput('');
      void createAuditEvent({ action: 'ask_question', entity_type: 'product', entity_id: productId }).catch(() => {});
    } catch (err: any) {
      setError(err?.message || 'Unable to submit question.');
    }
  };

  const handleAnswerQuestion = async (questionId: string) => {
    const answer = window.prompt('Answer this question:');
    if (!answer?.trim()) return;
    try {
      await answerProductQuestion(questionId, { comment: answer.trim() });
      setQaList(prev => prev.map(item => item.id === questionId ? { ...item, answer: answer.trim() } : item));
    } catch (err: any) {
      setError(err?.message || 'Unable to submit answer.');
    }
  };

  const handleToggleWatch = async () => {
    try {
      if (!isWatched) {
        const targetInput = window.prompt('Target price for alert (KES):', String(activeProduct.price));
        const target = targetInput ? Number(targetInput) : activeProduct.price;
        await watchProduct(productId, { target_price: target });
        setIsWatched(true);
        setWatchTarget(target);
        void createAuditEvent({ action: 'watch_product', entity_type: 'product', entity_id: productId }).catch(() => {});
      } else {
        await unwatchProduct(productId);
        setIsWatched(false);
        setWatchTarget(null);
        void createAuditEvent({ action: 'unwatch_product', entity_type: 'product', entity_id: productId }).catch(() => {});
      }
    } catch (err: any) {
      setError(err?.message || 'Unable to update watchlist.');
    }
  };

  const handleUpdateWatch = async () => {
    if (!isWatched) return;
    const targetInput = window.prompt('Update target price (KES):', String(watchTarget ?? activeProduct.price));
    const target = targetInput ? Number(targetInput) : watchTarget ?? activeProduct.price;
    try {
      await updateWatch(productId, { target_price: target });
      setWatchTarget(target);
    } catch (err: any) {
      setError(err?.message || 'Unable to update watch target.');
    }
  };

  const handleShareReward = async () => {
    try {
      const channel = typeof navigator !== 'undefined' && 'share' in navigator ? 'native' : 'link';
      await shareProduct(productId, { channel });
      void createAuditEvent({ action: 'share_product', entity_type: 'product', entity_id: productId }).catch(() => {});
    } catch (err: any) {
      setError(err?.message || 'Unable to register share reward.');
    }

    const text = `Check out ${activeProduct.name} on Sconnect!`;
    if (navigator.share) {
      try {
        await navigator.share({ title: activeProduct.name, text, url: window.location.href });
      } catch {}
      return;
    }
    alert('Share link copied. Earn rewards when friends confirm purchases.');
  };

  const handleCounterfeitReport = async () => {
    const reason = counterfeitForm.reason.trim();
    if (!reason) {
      setCounterfeitErrors({ reason: 'Reason is required.' });
      return;
    }
    setCounterfeitErrors({});
    const evidenceKeys = counterfeitForm.evidenceKeys
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean);
    try {
      await createCounterfeitReport({
        product_id: productId,
        seller_id: sellerId,
        reason,
        details: reason,
        order_id: counterfeitForm.orderId.trim() || null,
        similarity_score: null,
        evidence_keys: evidenceKeys,
      });
      void createAuditEvent({ action: 'report_counterfeit', entity_type: 'product', entity_id: productId }).catch(() => {});
      setShowCounterfeitModal(false);
      setCounterfeitForm({ reason: '', orderId: '', evidenceKeys: '' });
    } catch (err: any) {
      setError(err?.message || 'Unable to submit counterfeit report.');
    }
  };

  const handleDispute = async () => {
    if (!disputeForm.orderId.trim()) {
      setDisputeErrors({ orderId: 'Order ID is required.' });
      return;
    }
    const reason = disputeForm.reason.trim();
    if (!reason) {
      setDisputeErrors({ orderId: '', reason: 'Reason is required.' });
      return;
    }
    const disputeAmount = Number(disputeForm.amount);
    if (!Number.isFinite(disputeAmount) || disputeAmount < 0) {
      setDisputeErrors({ orderId: '', reason: '', amount: 'Amount must be a valid number.' });
      return;
    }
    setDisputeErrors({});
    try {
      const created = await createDispute({
        seller_id: sellerId,
        order_id: disputeForm.orderId.trim(),
        product_id: productId,
        dispute_amount: Number.isFinite(disputeAmount) ? disputeAmount : 0,
        reason,
        details: reason,
        gps_mismatch_km: 0,
        order_delivered: disputeForm.delivered,
        buyer_claims_not_received: disputeForm.notReceived,
        has_gps_proof: disputeForm.gpsProof,
      });
      const createdId = created?.id || created?.dispute_id || '';
      if (createdId) setDisputeId(createdId);
      setDisputeStatus('Dispute created. You can add evidence below.');
      void createAuditEvent({ action: 'create_dispute', entity_type: 'order', entity_id: disputeForm.orderId.trim() }).catch(() => {});
    } catch (err: any) {
      setError(err?.message || 'Unable to open dispute.');
    }
  };

  const handleEvidenceUpload = async () => {
    if (!disputeId) {
      setEvidenceStatus('Create the dispute first to add evidence.');
      return;
    }
    const hasAnyField = Object.values(evidenceForm).some((value) => value.trim() !== '');
    if (!hasAnyField) {
      setEvidenceStatus('Add at least one evidence field before submitting.');
      return;
    }
    if (!evidenceForm.s3Key.trim() || !evidenceForm.fileName.trim() || !evidenceForm.mimeType.trim()) {
      setEvidenceErrors({
        s3Key: evidenceForm.s3Key.trim() ? '' : 'S3 key is required.',
        fileName: evidenceForm.fileName.trim() ? '' : 'File name is required.',
        mimeType: evidenceForm.mimeType.trim() ? '' : 'MIME type is required.',
      });
      return;
    }
    setEvidenceErrors({});
    setEvidenceStatus(null);
    try {
      await uploadDisputeEvidence(disputeId, {
        s3_key: evidenceForm.s3Key.trim(),
        file_name: evidenceForm.fileName.trim(),
        mime_type: evidenceForm.mimeType.trim(),
        gps_lat: evidenceForm.gpsLat.trim() || undefined,
        gps_lng: evidenceForm.gpsLng.trim() || undefined,
        buyer_phone: evidenceForm.buyerPhone.trim() || undefined,
      });
      setEvidenceStatus('Evidence uploaded.');
      setEvidenceForm({ s3Key: '', fileName: '', mimeType: '', gpsLat: '', gpsLng: '', buyerPhone: '' });
    } catch (err: any) {
      setEvidenceStatus(err?.message || 'Unable to upload evidence.');
    }
  };

  const handleEvidenceFileSelect = async (file?: File) => {
    if (!file) return;
    setUploading(true);
    setUploadStatus('Requesting upload link...');
    try {
      const presign = await requestUploadPresign({
        file_name: file.name,
        mime_type: file.type,
        content_length: file.size,
        context: 'dispute_evidence',
      });
      const uploadUrl = presign.upload_url || presign.url;
      if (!uploadUrl) {
        setUploadStatus('Upload URL missing.');
        setUploading(false);
        return;
      }
      const method = (presign.method || (presign.fields ? 'POST' : 'PUT')).toUpperCase();
      if (presign.fields) {
        const form = new FormData();
        Object.entries(presign.fields).forEach(([key, value]) => form.append(key, value));
        form.append('file', file);
        setUploadStatus('Uploading file...');
        await fetch(uploadUrl, { method: 'POST', body: form });
        const inferredKey = presign.fields.key || presign.s3_key || presign.key || '';
        setEvidenceForm(prev => ({
          ...prev,
          s3Key: inferredKey || prev.s3Key,
          fileName: file.name,
          mimeType: file.type,
        }));
      } else {
        const headers: Record<string, string> = { ...(presign.headers || {}) };
        if (!headers['Content-Type'] && file.type) headers['Content-Type'] = file.type;
        setUploadStatus('Uploading file...');
        await fetch(uploadUrl, { method, body: file, headers });
        setEvidenceForm(prev => ({
          ...prev,
          s3Key: presign.s3_key || presign.key || prev.s3Key,
          fileName: file.name,
          mimeType: file.type,
        }));
      }
      setUploadStatus('Upload complete. Add evidence details and submit.');
    } catch (err: any) {
      setUploadStatus(err?.message || 'Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const handleFollowup = async () => {
    if (followUpEnabled) return;
    const orderId = followupOrderId || window.prompt('Order ID to schedule follow-up:');
    if (!orderId?.trim()) return;
    const due = new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString();
    try {
      await scheduleOrderFollowup(orderId.trim(), { follow_type: 'purchase_confirmation', due_at: due });
      setFollowUpEnabled(true);
      setFollowupOrderId(orderId.trim());
      void createAuditEvent({ action: 'schedule_followup', entity_type: 'order', entity_id: orderId.trim() }).catch(() => {});
    } catch (err: any) {
      setError(err?.message || 'Unable to schedule follow-up.');
    }
  };

  const handleOrderRating = async () => {
    if (!ratingOrderId.trim()) {
      setError('Order ID is required to submit a rating.');
      return;
    }
    try {
      await submitOrderRating(ratingOrderId.trim(), {
        seller_id: sellerId,
        rating: orderRating,
        comment: orderComment || undefined,
      });
      setOrderComment('');
      void createAuditEvent({ action: 'rate_order', entity_type: 'order', entity_id: ratingOrderId.trim() }).catch(() => {});
    } catch (err: any) {
      setError(err?.message || 'Unable to submit order rating.');
    }
  };

  React.useEffect(() => {
    let alive = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const detail = await getProductDetail(productId);
        if (!alive) return;
        setProductDetail((prev) => ({ ...prev, ...(detail as any) }));

        const sellerProductId = (detail as any)?.seller_product_id || (detail as any)?.sellerProductId;
        const [mediaResp, historyResp, benchmarkResp, goodDealResp, reviewResp, questionResp, counterfeitResp, disputeResp] = await Promise.all([
          getProductMedia(productId),
          getProductPriceHistory(productId),
          getProductBenchmark(productId, { category_id: (detail as any)?.category_id || undefined }),
          sellerProductId ? getProductGoodDeal(productId, { seller_product_id: sellerProductId }) : Promise.resolve(null),
          listProductReviews(productId),
          listProductQuestions(productId),
          getCounterfeitSummary().catch(() => null),
          getDisputeSummary().catch(() => null),
        ]);
        if (!alive) return;

        setMedia(mediaResp || []);
        setPriceHistory(normalizePriceHistory(historyResp || []));
        setBenchmark(benchmarkResp || null);
        setGoodDeal(goodDealResp || null);
        setReviews((reviewResp || []).map(normalizeReview));
        setQaList((questionResp || []).map(normalizeQuestion));
        setCounterfeitSummary(counterfeitResp || null);
        setDisputeSummary(disputeResp || null);

        if (sellerId) {
          const [profileResp, repResp] = await Promise.all([
            getShopProfile(sellerId).catch(() => null),
            getSellerReputation(sellerId).catch(() => null),
          ]);
          if (!alive) return;
          setSellerProfile(profileResp || null);
          setSellerReputation(repResp || null);
        }
      } catch (err: any) {
        if (!alive) return;
        setError(err?.message || 'Unable to load product detail.');
      } finally {
        if (alive) setLoading(false);
      }
    };
    load();
    return () => {
      alive = false;
    };
  }, [productId, sellerId]);

  return (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed inset-0 z-[60] bg-white flex flex-col overflow-hidden"
    >
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
        {error && (
          <div className="m-4 bg-red-50 border border-red-100 text-red-700 text-[11px] font-bold rounded-2xl px-4 py-3">
            {error}
          </div>
        )}

        {loading && (
          <div className="m-4 bg-white rounded-2xl border border-zinc-100 p-5 text-[11px] font-bold text-zinc-500">
            Loading product details...
          </div>
        )}

        <div className="aspect-square relative">
          <img
            src={primaryMedia}
            className="w-full h-full object-cover"
            alt={activeProduct.name}
            referrerPolicy="no-referrer"
            ref={imageRef}
          />
          <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-xl shadow-lg border border-white/20 flex flex-col items-end">
            <span className="text-lg font-black text-zinc-900">KES {activeProduct.price}</span>
            {benchmarkPrice > 0 && (
              <span className="text-[10px] text-zinc-400 line-through">Market: KES {benchmarkPrice}</span>
            )}
          </div>

          {goodDealFlag && (
            <div className="absolute top-4 left-4 bg-emerald-500 text-white px-3 py-1.5 rounded-full text-[10px] font-black flex items-center gap-1.5 shadow-xl">
              <TrendingDown className="w-3 h-3" /> GOOD DEAL
            </div>
          )}
        </div>

        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-2xl font-black text-zinc-900 mb-1">{activeProduct.name}</h1>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-zinc-100 rounded text-[10px] font-bold uppercase tracking-tight text-zinc-500">
                  {activeProduct.category}
                </span>
                <div className="flex items-center gap-1 text-amber-500">
                  <Star className="w-3 h-3 fill-amber-500" />
                  <span className="text-xs font-bold">{averageRating}</span>
                  <span className="text-[10px] text-zinc-400 font-medium">({reviews.length} reviews)</span>
                </div>
              </div>
            </div>
            <button className="p-3 bg-zinc-50 rounded-2xl text-zinc-400 hover:text-red-500 transition-colors">
              <Heart className="w-6 h-6" />
            </button>
          </div>

          <p className="text-zinc-500 text-sm leading-relaxed mb-6">
            {activeProduct.description}
          </p>

          {benchmarkPrice > 0 && (
            <div className="mb-6 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center gap-3">
              <div className="p-2 bg-emerald-500 rounded-xl">
                <TrendingDown className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs font-black text-emerald-900 uppercase tracking-tight">Price Fairness Indicator</p>
                <p className="text-[10px] text-emerald-600 font-bold">
                  This price is {Math.round(((benchmarkPrice - activeProduct.price) / benchmarkPrice) * 100)}% lower than nearby shops.
                </p>
              </div>
            </div>
          )}

          {benchmarkPrice > 0 && activeProduct.price < benchmarkPrice * 0.6 && (
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
            <div className="flex gap-2">
              <button
                onClick={handleToggleWatch}
                className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase ${isWatched ? 'bg-emerald-600 text-white' : 'bg-white text-indigo-600 border border-indigo-200'}`}
              >
                {isWatched ? 'Watching' : 'Watch'}
              </button>
              {isWatched && (
                <button
                  onClick={handleUpdateWatch}
                  className="px-3 py-2 rounded-xl text-[10px] font-black uppercase bg-white text-indigo-600 border border-indigo-200"
                >
                  Update
                </button>
              )}
            </div>
          </div>

          {priceHistory.length > 0 && (
            <div className="mb-8">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-4">Price History</h3>
              <div className="h-48 w-full bg-zinc-50 rounded-3xl p-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={priceHistory}>
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

          {activeProduct.stockLevel < 5 && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 animate-pulse">
              <div className="p-2 bg-red-500 rounded-xl">
                <AlertTriangle className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs font-black text-red-900 uppercase tracking-tight">Critical Stock Warning</p>
                <p className="text-[10px] text-red-600 font-bold">Only {activeProduct.stockLevel} units left! Order soon to avoid missing out.</p>
              </div>
            </div>
          )}

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
                onClick={() => setQuantity(Math.min(activeProduct.stockLevel || quantity + 1, quantity + 1))}
                className="p-1 hover:bg-zinc-100 rounded-lg transition-colors text-zinc-400"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="p-6 bg-zinc-50 rounded-3xl mb-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <img src={sellerProfile?.avatar || sellerProfile?.logo || `https://picsum.photos/seed/${sellerId}/80/80`} className="w-14 h-14 rounded-full border-2 border-white shadow-sm" alt="seller" />
                  {(sellerProfile?.verified || sellerProfile?.isVerified) && (
                    <div className="absolute -bottom-1 -right-1 bg-indigo-600 text-white p-1 rounded-full border-2 border-white">
                      <ShieldCheck className="w-3 h-3" />
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-sm font-bold text-zinc-900">@{sellerProfile?.name || sellerProfile?.display_name || 'Seller'}</p>
                  <p className="text-[10px] text-zinc-400 font-medium uppercase tracking-tighter">{sellerProfile?.verified ? 'Verified Merchant' : 'Merchant'}</p>
                </div>
              </div>
              <div className="flex flex-col items-end">
                <div className="flex items-center gap-1 text-amber-500 mb-1">
                  <Star className="w-3 h-3 fill-amber-500" />
                  <span className="text-xs font-bold">{sellerReputation?.rating || sellerProfile?.rating || '--'}</span>
                </div>
                <p className="text-[10px] text-zinc-400 font-bold">{sellerReputation?.followers || sellerProfile?.followers || '—'} Followers</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => onChatOpen(activeProduct)}
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
                onClick={() => setError('Calling seller...')}
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
              Seller history: {sellerReputation?.active_since || '—'} • {sellerReputation?.response_rate || '—'} response rate • {counterfeitSummary?.resolved_reports || 0} counterfeit reports resolved.
            </div>
          </div>

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

            {reviews.length > 0 ? (
              <div className="space-y-4">
                {reviews.map((review) => (
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
                      <button onClick={() => handleFlagReview(review.id)} className="text-amber-600">Flag</button>
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
                      {[5, 4, 3, 2, 1].map(r => <option key={r} value={r}>{r} Stars</option>)}
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
                  <div className="mt-2 flex items-center justify-between">
                    <p className="text-[9px] text-zinc-400">— {item.author}</p>
                    {!item.answer && (
                      <button
                        onClick={() => handleAnswerQuestion(item.id)}
                        className="text-[9px] font-bold text-indigo-600"
                      >
                        Answer
                      </button>
                    )}
                  </div>
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
                onClick={handleAskQuestion}
                className="px-4 py-3 bg-zinc-900 text-white rounded-xl text-[10px] font-black"
              >
                Ask
              </button>
            </div>
          </div>

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
              onClick={() => setShowCounterfeitModal(true)}
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
              onClick={() => setShowDisputeModal(true)}
              className="px-3 py-2 bg-red-600 text-white rounded-xl text-[10px] font-black uppercase"
            >
              Start Dispute
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            <button
              onClick={handleGetDirections}
              className="p-4 bg-zinc-50 rounded-2xl text-left group"
            >
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="w-4 h-4 text-indigo-600" />
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Location</span>
              </div>
              <p className="text-xs font-bold text-zinc-900 truncate group-hover:text-indigo-600 transition-colors">
                {activeProduct.location?.address || sellerProfile?.location?.address || 'Online Only'}
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
              <p className={`text-xs font-bold ${activeProduct.stockLevel < 10 ? 'text-red-500' : 'text-emerald-600'}`}>
                {activeProduct.stockLevel} Units Left
              </p>
              <p className="text-[9px] text-zinc-400 mt-1">Confirmed recently</p>
            </div>
            {externalProductUrl && (
              <button
                onClick={handleVisitSite}
                className="p-4 bg-zinc-50 rounded-2xl text-left group"
              >
                <div className="flex items-center gap-2 mb-2">
                  <ExternalLink className="w-4 h-4 text-zinc-900" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Visit Site</span>
                </div>
                <p className="text-xs font-bold text-zinc-900 truncate group-hover:text-indigo-600 transition-colors">
                  Open seller website
                </p>
                <div className="mt-2 flex items-center gap-1 text-[9px] font-bold text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity">
                  Go to site <ExternalLink className="w-2 h-2" />
                </div>
              </button>
            )}
          </div>

          <div className="mb-8 p-4 bg-zinc-50 rounded-2xl border border-zinc-100 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-black text-zinc-900 uppercase tracking-tight">Post-Purchase Follow-up</p>
                <p className="text-[10px] text-zinc-500 font-bold">Get a reminder to confirm your purchase and earn rewards.</p>
              </div>
              <button
                onClick={handleFollowup}
                disabled={followUpEnabled}
                className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase ${followUpEnabled ? 'bg-emerald-600 text-white' : 'bg-white text-zinc-600 border border-zinc-200'}`}
              >
                {followUpEnabled ? 'Scheduled' : 'Enable'}
              </button>
            </div>
            <input
              value={followupOrderId}
              onChange={(e) => setFollowupOrderId(e.target.value)}
              placeholder="Order ID for follow-up"
              className="w-full p-2.5 bg-white rounded-xl text-[10px] font-bold"
            />
          </div>

          <div className="mb-8 p-4 bg-white border border-zinc-100 rounded-2xl">
            <p className="text-xs font-black text-zinc-900 uppercase tracking-tight mb-2">Rate Your Order</p>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <input
                value={ratingOrderId}
                onChange={(e) => setRatingOrderId(e.target.value)}
                placeholder="Order ID"
                className="w-full p-2.5 bg-zinc-50 rounded-xl text-[10px] font-bold"
              />
              <select
                value={orderRating}
                onChange={(e) => setOrderRating(Number(e.target.value))}
                className="w-full p-2.5 bg-zinc-50 rounded-xl text-[10px] font-bold"
              >
                {[5,4,3,2,1].map(r => <option key={r} value={r}>{r} Stars</option>)}
              </select>
            </div>
            <textarea
              value={orderComment}
              onChange={(e) => setOrderComment(e.target.value)}
              placeholder="Optional comment"
              className="w-full p-3 bg-zinc-50 rounded-xl text-[10px] font-bold"
              rows={2}
            />
            <button
              onClick={handleOrderRating}
              className="mt-3 px-4 py-2 bg-zinc-900 text-white rounded-xl text-[10px] font-black"
            >
              Submit Rating
            </button>
          </div>

          <div className="mb-8 p-5 bg-white border border-zinc-100 rounded-3xl shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-black uppercase tracking-widest text-zinc-400">Social Proof</h3>
              <span className="text-[10px] text-zinc-500 font-bold">Verified purchases</span>
            </div>
            <div className="p-3 bg-emerald-50 rounded-2xl text-[10px] font-bold text-emerald-700">
              {sellerReputation?.monthly_buyers || 0} customers bought this here this month.
            </div>
            <div className="mt-3 grid grid-cols-5 gap-2">
              {[1,2,3,4,5].map(i => (
                <img key={i} src={`https://picsum.photos/seed/community-${productId}-${i}/80/80`} className="w-full aspect-square rounded-xl object-cover" alt="community" />
              ))}
            </div>
          </div>

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

      <AnimatePresence>
        {showCounterfeitModal && (
          <div className="fixed inset-0 z-[70]">
            <div
              className="absolute inset-0 bg-black/40"
              onClick={() => {
                setShowCounterfeitModal(false);
                setCounterfeitErrors({});
              }}
            />
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.98 }}
              className="absolute left-1/2 top-1/2 w-[min(92vw,420px)] -translate-x-1/2 -translate-y-1/2 bg-white rounded-3xl border border-zinc-100 shadow-2xl p-5"
            >
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-black">Report Counterfeit</p>
                <button
                  onClick={() => {
                    setShowCounterfeitModal(false);
                    setCounterfeitErrors({});
                  }}
                  className="text-[10px] font-black text-zinc-400"
                >
                  Close
                </button>
              </div>
              <div className="space-y-3">
                <textarea
                  className={`w-full p-3 rounded-xl text-xs font-bold ${counterfeitErrors.reason ? 'bg-red-50 border border-red-200 text-red-700' : 'bg-zinc-50 border border-transparent'}`}
                  rows={3}
                  placeholder="Describe the issue"
                  value={counterfeitForm.reason}
                  onChange={(e) => {
                    setCounterfeitForm(prev => ({ ...prev, reason: e.target.value }));
                    setCounterfeitErrors(prev => ({ ...prev, reason: '' }));
                  }}
                />
                {counterfeitErrors.reason && (
                  <p className="text-[10px] font-bold text-red-600">{counterfeitErrors.reason}</p>
                )}
                <input
                  className="w-full p-3 bg-zinc-50 rounded-xl text-xs font-bold border border-transparent"
                  placeholder="Order ID (optional)"
                  value={counterfeitForm.orderId}
                  onChange={(e) => setCounterfeitForm(prev => ({ ...prev, orderId: e.target.value }))}
                />
                <input
                  className="w-full p-3 bg-zinc-50 rounded-xl text-xs font-bold border border-transparent"
                  placeholder="Evidence keys (comma-separated)"
                  value={counterfeitForm.evidenceKeys}
                  onChange={(e) => setCounterfeitForm(prev => ({ ...prev, evidenceKeys: e.target.value }))}
                />
              </div>
              <div className="mt-4 flex gap-2">
                <button onClick={handleCounterfeitReport} className="flex-1 py-2 bg-amber-600 text-white rounded-xl text-[10px] font-black uppercase">
                  Submit
                </button>
                <button
                  onClick={() => {
                    setShowCounterfeitModal(false);
                    setCounterfeitErrors({});
                  }}
                  className="flex-1 py-2 bg-zinc-100 text-zinc-700 rounded-xl text-[10px] font-black uppercase"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showDisputeModal && (
          <div className="fixed inset-0 z-[70]">
            <div
              className="absolute inset-0 bg-black/40"
              onClick={() => {
                setShowDisputeModal(false);
                setDisputeErrors({});
                setEvidenceErrors({});
                setEvidenceStatus(null);
                setDisputeStatus(null);
                setDisputeId('');
              }}
            />
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.98 }}
              className="absolute left-1/2 top-1/2 w-[min(92vw,420px)] -translate-x-1/2 -translate-y-1/2 bg-white rounded-3xl border border-zinc-100 shadow-2xl p-5"
            >
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-black">Start Dispute</p>
                <button
                  onClick={() => {
                    setShowDisputeModal(false);
                    setDisputeErrors({});
                    setEvidenceErrors({});
                    setEvidenceStatus(null);
                    setDisputeStatus(null);
                    setDisputeId('');
                  }}
                  className="text-[10px] font-black text-zinc-400"
                >
                  Close
                </button>
              </div>
              <div className="space-y-3">
                <input
                  className={`w-full p-3 rounded-xl text-xs font-bold ${disputeErrors.orderId ? 'bg-red-50 border border-red-200 text-red-700' : 'bg-zinc-50 border border-transparent'}`}
                  placeholder="Order ID"
                  value={disputeForm.orderId}
                  onChange={(e) => {
                    setDisputeForm(prev => ({ ...prev, orderId: e.target.value }));
                    setDisputeErrors(prev => ({ ...prev, orderId: '' }));
                  }}
                />
                {disputeErrors.orderId && (
                  <p className="text-[10px] font-bold text-red-600">{disputeErrors.orderId}</p>
                )}
                <textarea
                  className={`w-full p-3 rounded-xl text-xs font-bold ${disputeErrors.reason ? 'bg-red-50 border border-red-200 text-red-700' : 'bg-zinc-50 border border-transparent'}`}
                  rows={3}
                  placeholder="Describe the dispute"
                  value={disputeForm.reason}
                  onChange={(e) => {
                    setDisputeForm(prev => ({ ...prev, reason: e.target.value }));
                    setDisputeErrors(prev => ({ ...prev, reason: '' }));
                  }}
                />
                {disputeErrors.reason && (
                  <p className="text-[10px] font-bold text-red-600">{disputeErrors.reason}</p>
                )}
                <input
                  className={`w-full p-3 rounded-xl text-xs font-bold ${disputeErrors.amount ? 'bg-red-50 border border-red-200 text-red-700' : 'bg-zinc-50 border border-transparent'}`}
                  placeholder="Dispute amount (KES)"
                  value={disputeForm.amount}
                  onChange={(e) => {
                    setDisputeForm(prev => ({ ...prev, amount: e.target.value }));
                    setDisputeErrors(prev => ({ ...prev, amount: '' }));
                  }}
                />
                {disputeErrors.amount && (
                  <p className="text-[10px] font-bold text-red-600">{disputeErrors.amount}</p>
                )}
                <label className="flex items-center gap-2 text-[10px] font-bold text-zinc-600">
                  <input
                    type="checkbox"
                    checked={disputeForm.delivered}
                    onChange={(e) => setDisputeForm(prev => ({ ...prev, delivered: e.target.checked }))}
                    className="accent-zinc-900"
                  />
                  Order marked as delivered
                </label>
                <label className="flex items-center gap-2 text-[10px] font-bold text-zinc-600">
                  <input
                    type="checkbox"
                    checked={disputeForm.notReceived}
                    onChange={(e) => setDisputeForm(prev => ({ ...prev, notReceived: e.target.checked }))}
                    className="accent-zinc-900"
                  />
                  Claiming order not received
                </label>
                <label className="flex items-center gap-2 text-[10px] font-bold text-zinc-600">
                  <input
                    type="checkbox"
                    checked={disputeForm.gpsProof}
                    onChange={(e) => setDisputeForm(prev => ({ ...prev, gpsProof: e.target.checked }))}
                    className="accent-zinc-900"
                  />
                  I have GPS proof
                </label>
              </div>
              {disputeStatus && (
                <p className="mt-3 text-[10px] font-bold text-emerald-600">{disputeStatus}</p>
              )}

              <div className="mt-4 rounded-2xl border border-dashed border-zinc-200 p-3 space-y-2">
                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Evidence Upload</p>
                <div className="space-y-2">
                  <input
                    type="file"
                    className="w-full text-[10px] font-bold"
                    onChange={(e) => handleEvidenceFileSelect(e.target.files?.[0])}
                  />
                  {uploadStatus && (
                    <p className={`text-[10px] font-bold ${uploadStatus.includes('failed') ? 'text-red-600' : 'text-zinc-500'}`}>
                      {uploadStatus}
                    </p>
                  )}
                  {uploading && (
                    <p className="text-[10px] font-bold text-indigo-600">Uploading...</p>
                  )}
                </div>
                <input
                  className={`w-full p-2.5 rounded-xl text-[10px] font-bold ${evidenceErrors.s3Key ? 'bg-red-50 border border-red-200 text-red-700' : 'bg-zinc-50 border border-transparent'}`}
                  placeholder="S3 Key"
                  value={evidenceForm.s3Key}
                  onChange={(e) => {
                    setEvidenceForm(prev => ({ ...prev, s3Key: e.target.value }));
                    setEvidenceErrors(prev => ({ ...prev, s3Key: '' }));
                  }}
                />
                {evidenceErrors.s3Key && (
                  <p className="text-[10px] font-bold text-red-600">{evidenceErrors.s3Key}</p>
                )}
                <input
                  className={`w-full p-2.5 rounded-xl text-[10px] font-bold ${evidenceErrors.fileName ? 'bg-red-50 border border-red-200 text-red-700' : 'bg-zinc-50 border border-transparent'}`}
                  placeholder="File Name"
                  value={evidenceForm.fileName}
                  onChange={(e) => {
                    setEvidenceForm(prev => ({ ...prev, fileName: e.target.value }));
                    setEvidenceErrors(prev => ({ ...prev, fileName: '' }));
                  }}
                />
                {evidenceErrors.fileName && (
                  <p className="text-[10px] font-bold text-red-600">{evidenceErrors.fileName}</p>
                )}
                <input
                  className={`w-full p-2.5 rounded-xl text-[10px] font-bold ${evidenceErrors.mimeType ? 'bg-red-50 border border-red-200 text-red-700' : 'bg-zinc-50 border border-transparent'}`}
                  placeholder="MIME Type"
                  value={evidenceForm.mimeType}
                  onChange={(e) => {
                    setEvidenceForm(prev => ({ ...prev, mimeType: e.target.value }));
                    setEvidenceErrors(prev => ({ ...prev, mimeType: '' }));
                  }}
                />
                {evidenceErrors.mimeType && (
                  <p className="text-[10px] font-bold text-red-600">{evidenceErrors.mimeType}</p>
                )}
                <div className="grid grid-cols-2 gap-2">
                  <input
                    className="w-full p-2.5 bg-zinc-50 rounded-xl text-[10px] font-bold border border-transparent"
                    placeholder="GPS Lat (optional)"
                    value={evidenceForm.gpsLat}
                    onChange={(e) => setEvidenceForm(prev => ({ ...prev, gpsLat: e.target.value }))}
                  />
                  <input
                    className="w-full p-2.5 bg-zinc-50 rounded-xl text-[10px] font-bold border border-transparent"
                    placeholder="GPS Lng (optional)"
                    value={evidenceForm.gpsLng}
                    onChange={(e) => setEvidenceForm(prev => ({ ...prev, gpsLng: e.target.value }))}
                  />
                </div>
                <input
                  className="w-full p-2.5 bg-zinc-50 rounded-xl text-[10px] font-bold border border-transparent"
                  placeholder="Buyer phone (optional)"
                  value={evidenceForm.buyerPhone}
                  onChange={(e) => setEvidenceForm(prev => ({ ...prev, buyerPhone: e.target.value }))}
                />
                {evidenceStatus && (
                  <p className={`text-[10px] font-bold ${evidenceStatus.includes('uploaded') ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {evidenceStatus}
                  </p>
                )}
                <button
                  onClick={handleEvidenceUpload}
                  className="mt-2 w-full py-2 bg-zinc-900 text-white rounded-xl text-[10px] font-black uppercase"
                >
                  Upload Evidence
                </button>
              </div>
              <div className="mt-4 flex gap-2">
                <button onClick={handleDispute} className="flex-1 py-2 bg-red-600 text-white rounded-xl text-[10px] font-black uppercase">
                  Submit
                </button>
                <button
                  onClick={() => {
                    setShowDisputeModal(false);
                    setDisputeErrors({});
                    setEvidenceErrors({});
                    setEvidenceStatus(null);
                    setDisputeStatus(null);
                    setDisputeId('');
                  }}
                  className="flex-1 py-2 bg-zinc-100 text-zinc-700 rounded-xl text-[10px] font-black uppercase"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
              <ProductAIChat product={activeProduct} onClose={() => setShowAIChat(false)} />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="p-6 border-t bg-white flex gap-4">
        <button
          onClick={handleAddToBagClick}
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
