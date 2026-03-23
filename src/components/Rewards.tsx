import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Crown, Trophy, ArrowRight, Star, Sparkles, QrCode, MapPin, Wallet, Camera as CameraIcon, Receipt, Gift, Upload, ShieldCheck } from 'lucide-react';
import { BrowserMultiFormatReader } from '@zxing/browser';
import {
  createReferral,
  getRewardsBalance,
  getRewardsLedger,
  getRewardStreaks,
  getRewardsStarsSummary,
  listFraudAlerts,
  listRewardsLeaderboard,
  listReceipts,
  listReceiptInventoryItems,
  listReferrals,
  queueReceipts,
  redeemRewards,
  resetRewardStreaks,
  submitReceipt,
  updateReceiptInventoryItem,
  submitRewardsQrScan,
  verifyRewardsGps,
  ReceiptInventoryItem,
  RewardsFraudAlert,
  RewardsLedgerEntry,
  RewardsLeaderboardEntry,
  RewardsReceipt,
  RewardsQrScanResponse,
  RewardsStarsSummary,
  RewardsStreak
} from '../lib/rewardsApi';
import { requestUploadPresign } from '../lib/uploadsApi';
import { getOCRStatus, runOCR } from '../lib/assistantApi';
import { listSellerProducts, SellerProduct } from '../lib/sellerProductsApi';
import { getOpsConfig } from '../lib/opsConfigApi';
import { getAuthItem } from '../lib/authStorage';

interface RewardsProps {
  openQrOnMount?: boolean;
  onOpenQrHandled?: () => void;
  onOpenQrRequested?: () => void;
  onCloseQrRequested?: () => void;
}

export const Rewards: React.FC<RewardsProps> = ({ openQrOnMount, onOpenQrHandled, onOpenQrRequested, onCloseQrRequested }) => {
  const [starsSummary, setStarsSummary] = useState<RewardsStarsSummary | null>(null);
  const [leaderboard, setLeaderboard] = useState<RewardsLeaderboardEntry[]>([]);
  const currentStars = Number(starsSummary?.stars_total ?? 0);
  const currentRank = Number(starsSummary?.rank ?? 0);
  const [activeTab, setActiveTab] = useState<'stars' | 'wallet' | 'receipts'>('stars');
  const [buyerCoins, setBuyerCoins] = useState(0);
  const [buyerPayouts, setBuyerPayouts] = useState<Array<{ id: string; amount: number; reason: string; timestamp: number }>>([]);
  const [milestones, setMilestones] = useState<Array<{ stars: number; label: string }>>([]);
  const [walletOffers, setWalletOffers] = useState<Array<{ label: string; cost: number }>>([]);
  const [walletHint, setWalletHint] = useState('');
  const [referralConfig, setReferralConfig] = useState<{ currency?: string; shop?: number; supplier?: number; next_bonus_invites?: number; next_bonus_amount?: number; pair_bonus_amount?: number } | null>(null);
  const [showQrModal, setShowQrModal] = useState(false);
  const [qrStep, setQrStep] = useState<'scan' | 'product' | 'price' | 'reward'>('scan');
  const [survey, setSurvey] = useState({ price: '', stock: 'Full', repeat: 'Yes', cleanliness: 4, product: '' });
  const [quantity, setQuantity] = useState(1);
  const [sellerId, setSellerId] = useState('');
  const [qrPayload, setQrPayload] = useState('');
  const [scanStatus, setScanStatus] = useState<'idle' | 'scanning' | 'found' | 'error'>('idle');
  const [scanError, setScanError] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<RewardsQrScanResponse | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const scanActiveRef = useRef(false);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const zxingReaderRef = useRef<BrowserMultiFormatReader | null>(null);
  const zxingControlsRef = useRef<any>(null);
  const [gpsStatus, setGpsStatus] = useState<'idle' | 'checking' | 'verified' | 'failed'>('idle');
  const [distanceMeters, setDistanceMeters] = useState<number | null>(null);
  const [fraudWarning, setFraudWarning] = useState<string | null>(null);
  const [receiptUploads, setReceiptUploads] = useState<Array<{ id: string; merchantName: string; totalAmount: number; rewardIssued: number; status: string }>>([]);
  const [receiptStreak, setReceiptStreak] = useState(0);
  const [referralPhone, setReferralPhone] = useState('');
  const [referralsCount, setReferralsCount] = useState(0);
  const [showReceiptQueue, setShowReceiptQueue] = useState(false);
  const [receiptQueueMessage, setReceiptQueueMessage] = useState<string | null>(null);
  const [receiptQueueCount, setReceiptQueueCount] = useState<number | null>(null);
  const [receiptQueueLoading, setReceiptQueueLoading] = useState(false);
  const [fraudAlerts, setFraudAlerts] = useState<RewardsFraudAlert[]>([]);
  const [receiptUploading, setReceiptUploading] = useState(false);
  const [receiptUploadStatus, setReceiptUploadStatus] = useState<string | null>(null);
  const [receiptScanOpen, setReceiptScanOpen] = useState(false);
  const [receiptScanStream, setReceiptScanStream] = useState<MediaStream | null>(null);
  const [receiptScanPreview, setReceiptScanPreview] = useState<string | null>(null);
  const [receiptScanText, setReceiptScanText] = useState<string | null>(null);
  const [receiptScanSubmitting, setReceiptScanSubmitting] = useState(false);
  const [receiptItems, setReceiptItems] = useState<ReceiptInventoryItem[]>([]);
  const [sellerProducts, setSellerProducts] = useState<SellerProduct[]>([]);
  const [receiptMergeTargets, setReceiptMergeTargets] = useState<Record<string, string>>({});
  const receiptVideoRef = useRef<HTMLVideoElement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (openQrOnMount) {
      setActiveTab('wallet');
      setShowQrModal(true);
      setQrStep('scan');
      onOpenQrHandled?.();
    } else {
      setShowQrModal(false);
    }
  }, [openQrOnMount, onOpenQrHandled]);

  useEffect(() => {
    if (!sellerId && qrPayload) {
      const parsed = parseSellerIdFromPayload(qrPayload);
      if (parsed) {
        setSellerId(parsed);
      }
    }
  }, [qrPayload, sellerId]);

  useEffect(() => {
    let active = true;
    Promise.all([
      getOpsConfig('rewards.milestones').catch(() => null),
      getOpsConfig('rewards.wallet_offers').catch(() => null),
      getOpsConfig('rewards.wallet_copy').catch(() => null),
      getOpsConfig('rewards.referrals').catch(() => null),
    ])
      .then(([milestonesResp, offersResp, walletCopyResp, referralsResp]) => {
        if (!active) return;
        const items = Array.isArray(milestonesResp?.value) ? milestonesResp.value : [];
        setMilestones(items);
        const offers = Array.isArray(offersResp?.value) ? offersResp.value : [];
        setWalletOffers(
          offers
            .map((item: any) => ({
              label: String(item?.label || ''),
              cost: Number(item?.cost ?? 0),
            }))
            .filter((item: any) => item.label && Number.isFinite(item.cost) && item.cost > 0)
        );
        const hint = String((walletCopyResp as any)?.value?.wallet_hint || '');
        setWalletHint(hint);
        setReferralConfig((referralsResp as any)?.value ?? null);
      })
      .catch(() => {
        if (!active) return;
        setMilestones([]);
        setWalletOffers([]);
        setWalletHint('');
        setReferralConfig(null);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [balanceResp, ledgerResp, receiptsResp, streaksResp, referralsResp, fraudResp, starsResp, leaderboardResp, receiptItemsResp, sellerProductsResp] = await Promise.all([
          getRewardsBalance(),
          getRewardsLedger(),
          listReceipts(),
          getRewardStreaks(),
          listReferrals(),
          listFraudAlerts(),
          getRewardsStarsSummary(),
          listRewardsLeaderboard(),
          listReceiptInventoryItems({ status: 'awaiting_verification', limit: 20 }),
          listSellerProducts()
        ]);
        if (!alive) return;
        const coins = Number(balanceResp?.balance ?? 0);
        setBuyerCoins(Number.isFinite(coins) ? coins : 0);
        setBuyerCoins(Number.isFinite(coins) ? coins : 0);
        setBuyerPayouts((ledgerResp || []).map((entry: RewardsLedgerEntry) => ({
          id: entry.id || entry.ledger_id || `lg_${Math.random().toString(16).slice(2)}`,
          amount: Number(entry.amount || 0),
          reason: entry.type || entry.reason || 'Reward',
          timestamp: new Date(entry.created_at || Date.now()).getTime()
        })));
        setReceiptUploads((receiptsResp || []).map((rec: RewardsReceipt) => ({
          id: rec.id || `r_${Math.random().toString(16).slice(2)}`,
          merchantName: rec.merchant_name || rec.merchant || 'Receipt',
          totalAmount: Number(rec.total_amount || 0),
          rewardIssued: Number(rec.reward_issued || 0),
          status: rec.status || 'pending'
        })));
        const receiptStreakEntry = (streaksResp || []).find((s: RewardsStreak) => s.type === 'receipt');
        setReceiptStreak(Number(receiptStreakEntry?.count || 0));
        setReferralsCount((referralsResp || []).length);
        const alerts = Array.isArray(fraudResp) ? fraudResp : [];
        setFraudAlerts(alerts as RewardsFraudAlert[]);
        if (alerts.length) {
          setFraudWarning(alerts[0]?.message || 'Potential fraud detected.');
        }
        setStarsSummary(starsResp as RewardsStarsSummary);
        setLeaderboard(Array.isArray(leaderboardResp) ? (leaderboardResp as RewardsLeaderboardEntry[]) : []);
        setReceiptItems(Array.isArray(receiptItemsResp) ? (receiptItemsResp as ReceiptInventoryItem[]) : []);
        setSellerProducts(Array.isArray(sellerProductsResp) ? (sellerProductsResp as SellerProduct[]) : []);
      } catch (err: any) {
        if (!alive) return;
        setError('Unable to load rewards data.');
      } finally {
        if (alive) setLoading(false);
      }
    };
    load();
    return () => {
      alive = false;
    };
  }, []);

  const applyBalanceFromResponse = (balanceResp: any) => {
    const coins = Number(balanceResp?.balance ?? 0);
    if (Number.isFinite(coins)) {
      setBuyerCoins(coins);
    }
  };

  const applyLedgerFromResponse = (ledgerResp: RewardsLedgerEntry[]) => {
    setBuyerPayouts((ledgerResp || []).map((entry: RewardsLedgerEntry) => ({
      id: entry.id || entry.ledger_id || `lg_${Math.random().toString(16).slice(2)}`,
      amount: Number(entry.amount || 0),
      reason: entry.reason || entry.type || 'Reward',
      timestamp: new Date(entry.created_at || Date.now()).getTime()
    })));
  };

  const refreshBalanceAndLedger = async () => {
    const [balanceResp, ledgerResp] = await Promise.all([
      getRewardsBalance(),
      getRewardsLedger()
    ]);
    applyBalanceFromResponse(balanceResp);
    applyLedgerFromResponse(ledgerResp || []);
  };

  const refreshReceiptsAndStreaks = async () => {
    const [receiptsResp, streaksResp, receiptItemsResp, sellerProductsResp] = await Promise.all([
      listReceipts(),
      getRewardStreaks(),
      listReceiptInventoryItems({ status: 'awaiting_verification', limit: 20 }),
      listSellerProducts()
    ]);
    setReceiptUploads((receiptsResp || []).map((rec: RewardsReceipt) => ({
      id: rec.id || `r_${Math.random().toString(16).slice(2)}`,
      merchantName: rec.merchant_name || rec.merchant || 'Receipt',
      totalAmount: Number(rec.total_amount || 0),
      rewardIssued: Number(rec.reward_issued || 0),
      status: rec.status || 'pending'
    })));
    const receiptStreakEntry = (streaksResp || []).find((s: RewardsStreak) => s.type === 'receipt');
    setReceiptStreak(Number(receiptStreakEntry?.count || 0));
    setReceiptItems(Array.isArray(receiptItemsResp) ? (receiptItemsResp as ReceiptInventoryItem[]) : []);
    setSellerProducts(Array.isArray(sellerProductsResp) ? (sellerProductsResp as SellerProduct[]) : []);
  };

  const refreshStarsAndLeaderboard = async () => {
    try {
      const [starsResp, leaderboardResp] = await Promise.all([
        getRewardsStarsSummary(),
        listRewardsLeaderboard()
      ]);
      setStarsSummary(starsResp as RewardsStarsSummary);
      setLeaderboard(Array.isArray(leaderboardResp) ? (leaderboardResp as RewardsLeaderboardEntry[]) : []);
    } catch {}
  };

  const closeQrModal = () => {
    onCloseQrRequested?.();
    setShowQrModal(false);
  };

  const stopScanner = () => {
    scanActiveRef.current = false;
    if (mediaStream) {
      mediaStream.getTracks().forEach((track) => track.stop());
    }
    if (zxingControlsRef.current?.stop) {
      try {
        zxingControlsRef.current.stop();
      } catch {}
    }
    if (zxingReaderRef.current) {
      try {
        (zxingReaderRef.current as any).reset?.();
      } catch {}
    }
    zxingControlsRef.current = null;
    zxingReaderRef.current = null;
    setMediaStream(null);
    setCameraActive(false);
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const startScanner = async () => {
    setScanError(null);
    setScanStatus('scanning');
    if (!navigator.mediaDevices?.getUserMedia) {
      setScanError('Camera not available on this device.');
      setScanStatus('error');
      return;
    }
    if (typeof window !== 'undefined' && !window.isSecureContext && window.location.hostname !== 'localhost') {
      setScanError('Camera access requires HTTPS.');
      setScanStatus('error');
      return;
    }
    try {
      scanActiveRef.current = true;
      if ((window as any).BarcodeDetector) {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        setCameraActive(true);
        setMediaStream(stream);
        await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));
        if (!videoRef.current) {
          throw new Error('Camera view unavailable.');
        }
        videoRef.current.srcObject = stream;
        videoRef.current.muted = true;
        await videoRef.current.play();
        const detector = new (window as any).BarcodeDetector({ formats: ['qr_code'] });
        const tick = async () => {
          if (!scanActiveRef.current || !videoRef.current) return;
          try {
            const barcodes = await detector.detect(videoRef.current);
            if (barcodes?.length) {
              const raw = barcodes[0].rawValue || '';
              if (raw) {
                setQrPayload(raw);
                setScanStatus('found');
                stopScanner();
                return;
              }
            }
          } catch {}
          if (scanActiveRef.current) {
            setTimeout(tick, 500);
          }
        };
        tick();
        return;
      }
      const reader = new BrowserMultiFormatReader();
      zxingReaderRef.current = reader;
      setCameraActive(true);
      await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));
      if (!videoRef.current) {
        throw new Error('Camera view unavailable.');
      }
      videoRef.current.muted = true;
      const controls = await reader.decodeFromConstraints(
        { video: { facingMode: 'environment' } },
        videoRef.current,
        (result) => {
          if (!result) return;
          const raw = result.getText?.() || '';
          if (!raw) return;
          setQrPayload(raw);
          setScanStatus('found');
          stopScanner();
        }
      );
      zxingControlsRef.current = controls;
    } catch (err: any) {
      setScanError(err?.message || 'Unable to access camera.');
      setScanStatus('error');
      stopScanner();
    }
  };

  useEffect(() => {
    if (!showQrModal) {
      stopScanner();
      setScanStatus('idle');
    }
  }, [showQrModal]);

  useEffect(() => {
    return () => {
      if (receiptScanStream) {
        receiptScanStream.getTracks().forEach(track => track.stop());
      }
      if (receiptScanPreview) {
        URL.revokeObjectURL(receiptScanPreview);
      }
    };
  }, [receiptScanStream, receiptScanPreview]);

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
      return {
        s3Key: presign.fields.key || presign.s3_key || presign.key || '',
        mediaUrl: presign.url || ''
      };
    }
    const headers: Record<string, string> = { ...(presign?.headers || {}) };
    if (!headers['Content-Type'] && file.type) headers['Content-Type'] = file.type;
    const res = await fetch(uploadUrl, { method, headers, body: file });
    if (!res.ok) throw new Error(`Upload failed (${res.status})`);
    return {
      s3Key: presign?.s3_key || presign?.key || '',
      mediaUrl: presign?.url || ''
    };
  };

  const parseReceiptLines = (text: string) => {
    const lines = text
      .split(/\r?\n/)
      .map(line => line.trim())
      .filter(Boolean);
    const ignore = ['total', 'subtotal', 'vat', 'tax', 'change', 'balance', 'mpesa', 'cash', 'card', 'amount'];
    const items: string[] = [];
    lines.forEach(line => {
      const lower = line.toLowerCase();
      if (ignore.some(term => lower.includes(term))) return;
      if (!/[a-z]/i.test(line)) return;
      items.push(line);
    });
    return items.slice(0, 10);
  };

  const extractReceiptSummary = (text: string) => {
    const lines = text
      .split(/\r?\n/)
      .map(line => line.trim())
      .filter(Boolean);
    const merchant = lines[0] || '';
    let total: number | undefined;
    for (const line of lines) {
      const lower = line.toLowerCase();
      if (!lower.includes('total')) continue;
      const match = line.match(/(\d+[.,]?\d*)/g);
      if (match && match.length) {
        const raw = match[match.length - 1].replace(',', '');
        const num = Number(raw);
        if (Number.isFinite(num)) {
          total = num;
          break;
        }
      }
    }
    return { merchant, total };
  };

  const waitForOcrResult = async (jobId: string) => {
    let last: any = null;
    for (let i = 0; i < 6; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      const job = await getOCRStatus(jobId);
      last = job;
      const resultText = job?.result?.text || job?.result?.transcript || job?.result?.ocr_text;
      if (resultText) return { job, text: String(resultText) };
      // eslint-disable-next-line no-await-in-loop
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    const fallbackText = last?.result?.text || last?.result?.transcript || last?.result?.ocr_text;
    return { job: last, text: fallbackText ? String(fallbackText) : '' };
  };

  const processReceiptOCR = async (s3Key: string, mediaUrl: string) => {
    setReceiptUploadStatus('Running OCR...');
    try {
      if (!mediaUrl) {
        await submitReceipt({ s3_key: s3Key });
        setReceiptUploadStatus('Receipt submitted and awaiting verification.');
        return;
      }
      const job = await runOCR({ image_url: mediaUrl });
      if (!job?.id) {
        setReceiptUploadStatus('OCR queued. Receipt will sync when ready.');
        await submitReceipt({ s3_key: s3Key });
        return;
      }
      const { text } = await waitForOcrResult(job.id);
      const ocrText = text || '';
      setReceiptScanText(ocrText || null);
      const items = ocrText ? parseReceiptLines(ocrText) : [];
      const summary = ocrText ? extractReceiptSummary(ocrText) : { merchant: '', total: undefined };
      await submitReceipt({
        s3_key: s3Key,
        merchant_name: summary.merchant || undefined,
        total_amount: summary.total,
        ocr_text: ocrText || undefined,
        line_items: items.length ? items : undefined
      });
      setReceiptUploadStatus('Receipt submitted and awaiting verification.');
      await Promise.all([
        refreshBalanceAndLedger(),
        refreshReceiptsAndStreaks(),
        refreshStarsAndLeaderboard()
      ]);
    } catch {
      try {
        await submitReceipt({ s3_key: s3Key });
      } catch {}
      setReceiptUploadStatus('Receipt submitted and awaiting verification.');
    }
  };

  const openReceiptScanner = async () => {
    if (receiptScanOpen || receiptUploading) return;
    setReceiptUploadStatus(null);
    setReceiptScanText(null);
    if (receiptScanPreview) {
      URL.revokeObjectURL(receiptScanPreview);
      setReceiptScanPreview(null);
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      setReceiptScanStream(stream);
      setReceiptScanOpen(true);
      await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));
      if (!receiptVideoRef.current) {
        throw new Error('Camera view unavailable.');
      }
      receiptVideoRef.current.srcObject = stream;
      receiptVideoRef.current.muted = true;
      await receiptVideoRef.current.play();
    } catch {
      setReceiptUploadStatus('Unable to access camera.');
    }
  };

  const closeReceiptScanner = () => {
    if (receiptScanStream) {
      receiptScanStream.getTracks().forEach(track => track.stop());
    }
    setReceiptScanStream(null);
    setReceiptScanOpen(false);
    if (receiptVideoRef.current) {
      receiptVideoRef.current.srcObject = null;
    }
  };

  const captureReceipt = async () => {
    if (!receiptVideoRef.current || receiptUploading) return;
    const video = receiptVideoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 720;
    canvas.height = video.videoHeight || 1280;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const blob: Blob | null = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.85));
    if (!blob) return;
    const file = new File([blob], `receipt_${Date.now()}.jpg`, { type: 'image/jpeg' });
    if (receiptScanPreview) {
      URL.revokeObjectURL(receiptScanPreview);
    }
    const previewUrl = URL.createObjectURL(file);
    setReceiptScanPreview(previewUrl);
    closeReceiptScanner();
    await handleReceiptFileSelected(file);
  };

  const handleReceiptFileSelected = async (file?: File | null) => {
    if (!file) return;
    setReceiptUploading(true);
    setReceiptScanSubmitting(true);
    setReceiptUploadStatus('Uploading receipt...');
    setReceiptScanText(null);
    try {
      if (receiptScanPreview) {
        URL.revokeObjectURL(receiptScanPreview);
      }
      const previewUrl = URL.createObjectURL(file);
      setReceiptScanPreview(previewUrl);
      const presign = await requestUploadPresign({
        file_name: file.name,
        mime_type: file.type || 'application/octet-stream',
        content_length: file.size,
        context: 'receipt'
      });
      const uploaded = await uploadToPresignedUrl(file, presign);
      await processReceiptOCR(uploaded.s3Key, uploaded.mediaUrl);
    } catch {
      setReceiptUploadStatus('Receipt upload failed. Try again.');
    } finally {
      setReceiptUploading(false);
      setReceiptScanSubmitting(false);
    }
  };

  const currentUserId = useMemo(() => {
    try {
      return getAuthItem('soko:user_id') || '';
    } catch {
      return '';
    }
  }, []);

  const formatLeaderboardName = (userId: string) => {
    if (!userId) return 'User';
    if (userId === currentUserId) return 'YOU';
    return `User ${userId.slice(0, 4)}`;
  };

  const parseSellerIdFromPayload = (payload: string) => {
    if (!payload) return '';
    const trimmed = payload.trim();
    if (!trimmed) return '';
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      try {
        const parsed = JSON.parse(trimmed);
        const candidate = parsed.seller_id || parsed.sellerId || parsed.seller;
        if (typeof candidate === 'string') return candidate;
      } catch {}
    }
    const match = trimmed.match(/seller(?:_id)?[:/=?]+([a-zA-Z0-9_-]+)/i);
    if (match?.[1]) return match[1];
    return '';
  };

  const scannerSupported = useMemo(() => {
    return typeof window !== 'undefined' && !!window.navigator?.mediaDevices?.getUserMedia;
  }, []);

  const nextMilestone = useMemo(() => {
    if (milestones.length === 0) return null;
    return milestones.find(m => currentStars < m.stars) || milestones[milestones.length - 1];
  }, [currentStars, milestones]);

  const progressPct = nextMilestone
    ? Math.min(100, Math.round((currentStars / nextMilestone.stars) * 100))
    : 0;


  const handleReferral = async () => {
    if (!referralPhone.trim()) return;
    try {
      await createReferral({ invitee_phone: referralPhone.trim() });
      const [balanceResp, referralsResp, ledgerResp] = await Promise.all([
        getRewardsBalance(),
        listReferrals(),
        getRewardsLedger()
      ]);
      const coins = Number(balanceResp?.coins ?? balanceResp?.wallet ?? balanceResp?.balance ?? 0);
      setBuyerCoins(Number.isFinite(coins) ? coins : buyerCoins);
      setReferralsCount((referralsResp || []).length);
      setBuyerPayouts((ledgerResp || []).map((entry: any) => ({
        id: entry.id || entry.ledger_id || `lg_${Math.random().toString(16).slice(2)}`,
        amount: Number(entry.amount || 0),
        reason: entry.reason || entry.type || 'Reward',
        timestamp: new Date(entry.created_at || Date.now()).getTime()
      })));
      setReferralPhone('');
      await refreshStarsAndLeaderboard();
    } catch (err: any) {
      setError('Unable to create referral.');
    }
  };

  const handleReceiptQueueSync = async () => {
    setReceiptQueueLoading(true);
    setReceiptQueueMessage(null);
    try {
      const pending = receiptUploads.filter((rec) => rec.status === 'pending');
      if (pending.length === 0) {
        setReceiptQueueCount(0);
        setReceiptQueueMessage('No pending receipts to queue.');
        return;
      }
      setReceiptUploads(prev => prev.map((rec) => (
        rec.status === 'pending' ? { ...rec, status: 'queued' } : rec
      )));
      for (const rec of pending) {
        await queueReceipts({ receipt_id: rec.id });
      }
      setReceiptQueueCount(pending.length);
      setReceiptQueueMessage('Queued pending receipts for processing.');
      await refreshReceiptsAndStreaks();
    } catch (err: any) {
      await refreshReceiptsAndStreaks();
      setReceiptQueueMessage('Unable to sync receipt queue.');
    } finally {
      setReceiptQueueLoading(false);
    }
  };

  const handleVerifyReceiptItem = async (item: ReceiptInventoryItem) => {
    try {
      const target = receiptMergeTargets[item.id] || '';
      await updateReceiptInventoryItem(item.id, { status: 'verified', seller_product_id: target || undefined });
      await refreshReceiptsAndStreaks();
    } catch {
      setError('Unable to verify receipt item.');
    }
  };

  const handleResetReceiptStreak = async () => {
    try {
      await resetRewardStreaks({ type: 'receipt' });
      await refreshReceiptsAndStreaks();
    } catch (err: any) {
      setError('Unable to reset receipt streak.');
    }
  };

  const handleRedeemWallet = async (reward: { label: string; cost: number }) => {
    try {
      await redeemRewards({ amount: reward.cost });
      await refreshBalanceAndLedger();
    } catch (err: any) {
      setError(`Unable to redeem ${reward.label}.`);
    }
  };

  const handleQrSurveySubmit = async () => {
    if (!qrPayload.trim()) {
      setScanError('Scan a QR code or enter the code manually.');
      setQrStep('scan');
      return;
    }
    if (gpsStatus !== 'verified') {
      setFraudWarning('GPS verification failed. No rewards will be paid out.');
      return;
    }
    setError(null);
    try {
      const payload = {
        qr_payload: qrPayload.trim(),
        seller_id: sellerId.trim() || undefined,
        product_name: survey.product.trim() || undefined,
        price: survey.price ? Number(survey.price) : undefined,
        quantity,
        stock_status: survey.stock,
        repeat_purchase: survey.repeat,
        cleanliness: survey.cleanliness,
        gps_distance_m: distanceMeters ?? undefined,
        gps_verified: gpsStatus === 'verified'
      };
      const resp = await submitRewardsQrScan(payload);
      setScanResult(resp);
      if (typeof resp?.balance === 'number') {
        setBuyerCoins(resp.balance);
      } else {
        await refreshBalanceAndLedger();
      }
      await refreshStarsAndLeaderboard();
      setQrStep('reward');
    } catch (err: any) {
      setError('Unable to submit QR scan.');
    }
  };

  return (
    <div className="h-full bg-gradient-to-br from-slate-50 to-blue-50 flex flex-col overflow-y-auto no-scrollbar pb-24">
      {/* Header */}
      <div className="p-6 bg-white border-b border-blue-100 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black">SC</div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-blue-500">Stars Dashboard</p>
              <p className="text-sm font-bold text-zinc-900">Rewards</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-blue-600 text-white px-3 py-1.5 rounded-full text-xs font-black">
              <Star className="w-3 h-3" /> {nextMilestone ? `${currentStars}/${nextMilestone.stars}` : currentStars}
            </div>
            <div className="flex items-center gap-1 bg-yellow-200 text-yellow-900 px-3 py-1.5 rounded-full text-[10px] font-black">
              <Crown className="w-3 h-3" /> #{currentRank || '—'}
            </div>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-2">
          {[
            { id: 'stars', label: 'Stars Dashboard' },
            { id: 'wallet', label: 'SC Wallet' },
            { id: 'receipts', label: 'Receipts & Rewards' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 'stars' | 'wallet' | 'receipts')}
              className={`px-4 py-2 rounded-full text-[10px] font-black ${activeTab === tab.id ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-600'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-6 space-y-8">
        {error && (
          <div className="bg-red-50 border border-red-100 text-red-700 text-[11px] font-bold rounded-2xl px-4 py-3">
            {error}
          </div>
        )}
        {loading && (
          <div className="bg-white rounded-2xl border border-blue-100 p-5 text-[11px] font-bold text-zinc-500">
            Loading rewards...
          </div>
        )}
        {activeTab === 'receipts' && (
          <>
            <section className="bg-white rounded-3xl border border-blue-100 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-3">
                <Receipt className="w-4 h-4 text-emerald-600" />
                <h3 className="text-xs font-black uppercase tracking-widest text-blue-500">Receipt Upload Rewards</h3>
              </div>
              <p className="text-[10px] text-slate-500 font-bold">Scan a receipt to auto-read items and sync inventory.</p>
              <div className="mt-4 space-y-3">
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={openReceiptScanner}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-[10px] font-black"
                    disabled={receiptUploading || receiptScanSubmitting}
                  >
                    <CameraIcon className="w-4 h-4 inline-block mr-2" />
                    Scan Receipt
                  </button>
                  <label className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-[10px] font-black cursor-pointer">
                    <Upload className="w-4 h-4 inline-block mr-2" />
                    Upload Receipt
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        e.currentTarget.value = '';
                        handleReceiptFileSelected(file);
                      }}
                      disabled={receiptUploading || receiptScanSubmitting}
                    />
                  </label>
                </div>
                {receiptUploadStatus && (
                  <div className="p-3 bg-emerald-50 rounded-2xl text-[10px] font-bold text-emerald-700">
                    {receiptUploadStatus}
                  </div>
                )}
                {receiptScanText && (
                  <div className="p-3 bg-slate-50 rounded-2xl text-[10px] font-bold text-slate-600">
                    OCR Preview: {receiptScanText.slice(0, 120)}{receiptScanText.length > 120 ? '...' : ''}
                  </div>
                )}
                {receiptScanPreview && (
                  <div className="rounded-2xl overflow-hidden border border-slate-100">
                    <img src={receiptScanPreview} className="w-full h-48 object-cover" alt="receipt preview" />
                  </div>
                )}
                <div className="p-3 bg-emerald-50 rounded-2xl text-[10px] font-bold text-emerald-700">
                  Streak: {receiptStreak} days • Bonus at 7 days (KES 50) and 30 days (KES 200)
                </div>
                <button
                  onClick={async () => {
                    const next = !showReceiptQueue;
                    setShowReceiptQueue(next);
                    if (next) {
                      await handleReceiptQueueSync();
                    }
                  }}
                  className="w-full py-3 bg-slate-100 text-slate-700 rounded-xl text-[10px] font-black"
                >
                  {showReceiptQueue ? 'Hide' : 'Show'} Offline Receipt Queue
                </button>
                {showReceiptQueue && (
                  <div className="p-3 bg-slate-50 rounded-2xl text-[10px] font-bold text-slate-600">
                    {receiptQueueLoading
                      ? 'Syncing offline receipts...'
                      : receiptQueueMessage || `${receiptQueueCount ?? 0} receipts queued. Will upload automatically when online.`}
                  </div>
                )}
                <button
                  onClick={handleResetReceiptStreak}
                  className="w-full py-2 bg-slate-50 text-slate-600 rounded-xl text-[10px] font-black"
                >
                  Reset Receipt Streak
                </button>
              </div>
              {receiptItems.length > 0 && (
                <div className="mt-4 bg-white rounded-2xl border border-slate-100 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Pending Inventory</p>
                    <span className="text-[10px] font-bold text-slate-500">{receiptItems.length} items</span>
                  </div>
                  <div className="space-y-2">
                    {receiptItems.slice(0, 6).map((item) => (
                      <div key={item.id} className="p-3 bg-slate-50 rounded-xl flex items-center justify-between gap-2">
                        <div>
                          <p className="text-[10px] font-black text-slate-800">{item.item_name || 'Receipt item'}</p>
                          <p className="text-[9px] font-bold text-slate-500">
                            Qty {item.quantity || 1} • {item.unit_price ? `KES ${item.unit_price}` : 'Price pending'}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <select
                            value={receiptMergeTargets[item.id] || ''}
                            onChange={(e) => setReceiptMergeTargets(prev => ({ ...prev, [item.id]: e.target.value }))}
                            className="text-[9px] font-bold bg-white border border-slate-200 rounded-lg px-2 py-1"
                          >
                            <option value="">Auto-match</option>
                            {sellerProducts.slice(0, 50).map((product) => (
                              <option key={product.id} value={product.id}>
                                {product.alias || product.product_id || product.id}
                              </option>
                            ))}
                          </select>
                          <button
                            onClick={() => handleVerifyReceiptItem(item)}
                            className="px-3 py-1.5 bg-emerald-600 text-white rounded-full text-[9px] font-black"
                          >
                            Merge &amp; Verify
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {receiptUploads.length > 0 && (
                <div className="mt-4 space-y-2">
                  {receiptUploads.map(upload => (
                    <div key={upload.id} className="p-3 bg-slate-50 rounded-2xl text-[10px] font-bold text-slate-700">
                      <div className="flex items-center justify-between">
                        <div>
                          {upload.merchantName} • KES {upload.totalAmount} • Reward KES {upload.rewardIssued}
                        </div>
                        <button
                          onClick={async () => {
                            setReceiptUploads(prev => prev.map((rec) => (
                              rec.id === upload.id ? { ...rec, status: 'queued' } : rec
                            )));
                            try {
                              await queueReceipts({ receipt_id: upload.id });
                              await refreshReceiptsAndStreaks();
                            } catch (err: any) {
                              await refreshReceiptsAndStreaks();
                              setError(err?.message || 'Unable to queue receipt.');
                            }
                          }}
                          disabled={upload.status === 'queued'}
                          className={`px-2 py-1 rounded-lg text-[9px] font-black ${upload.status === 'queued' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-700'}`}
                        >
                          {upload.status === 'queued' ? 'Queued' : 'Queue'}
                        </button>
                      </div>
                      <div className="text-[9px] text-slate-500 mt-1">Status: {upload.status}</div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="bg-white rounded-3xl border border-blue-100 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-3">
                <Gift className="w-4 h-4 text-amber-500" />
                <h3 className="text-xs font-black uppercase tracking-widest text-blue-500">Referral Rewards</h3>
              </div>
              <div className="flex gap-2">
                <input
                  className="flex-1 p-3 bg-slate-100 rounded-xl text-[10px] font-bold text-slate-700"
                  placeholder="Friend's phone number"
                  value={referralPhone}
                  onChange={(e) => setReferralPhone(e.target.value)}
                />
                <button
                  onClick={handleReferral}
                  className="px-4 py-3 bg-amber-500 text-white rounded-xl text-[10px] font-black"
                >
                  Invite
                </button>
              </div>
              <div className="mt-3 text-[10px] font-bold text-slate-600">
                {referralConfig ? (
                  <>
                    Referrals: {referralsCount}
                    {referralConfig.next_bonus_invites && referralConfig.next_bonus_amount !== undefined && (
                      <> • Next bonus at {referralConfig.next_bonus_invites} invites ({referralConfig.currency ? `${referralConfig.currency} ` : ''}{referralConfig.next_bonus_amount})</>
                    )}
                    {referralConfig.pair_bonus_amount !== undefined && (
                      <> • Refer a shop: both earn {referralConfig.currency ? `${referralConfig.currency} ` : ''}{referralConfig.pair_bonus_amount}</>
                    )}
                  </>
                ) : (
                  <>Referrals: {referralsCount} • Referral rewards not configured.</>
                )}
              </div>
            </section>

          </>
        )}

        {activeTab === 'wallet' && (
          <>
            <section className="bg-white rounded-3xl border border-blue-100 shadow-sm p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-blue-500">SC Wallet</p>
                  <p className="text-sm font-bold text-slate-900">Your Balance: {buyerCoins} SC</p>
                </div>
                <button
                  onClick={() => {
                    onOpenQrRequested?.();
                    setShowQrModal(true);
                    setQrStep('scan');
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl text-[10px] font-black flex items-center gap-2"
                >
                  <QrCode className="w-4 h-4" /> Scan QR
                </button>
              </div>
              <p className="mt-3 text-[10px] text-slate-500 font-bold">
                {walletHint || 'Scan QR codes to earn SC rewards.'}
              </p>
            </section>

            <section className="bg-white rounded-3xl border border-blue-100 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-4">
                <Wallet className="w-4 h-4 text-emerald-600" />
                <h3 className="text-xs font-black uppercase tracking-widest text-blue-500">Redeem SC</h3>
              </div>
              <div className="grid grid-cols-2 gap-3 text-[10px] font-bold">
                {walletOffers.length === 0 && (
                  <div className="col-span-2 p-3 bg-slate-50 rounded-2xl text-slate-500">
                    No redemption offers configured yet.
                  </div>
                )}
                {walletOffers.map(reward => (
                  <button
                    key={reward.label}
                    onClick={() => handleRedeemWallet(reward)}
                    className="p-3 bg-blue-50 rounded-2xl text-blue-700 hover:bg-blue-100"
                  >
                      {reward.label}
                    </button>
                ))}
              </div>
            </section>

            <section className="bg-white rounded-3xl border border-blue-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-black uppercase tracking-widest text-blue-500">SC Wallet History</h3>
                <button
                  onClick={refreshBalanceAndLedger}
                  className="text-[10px] font-bold text-zinc-400"
                >
                  Refresh
                </button>
              </div>
              <div className="space-y-2 text-[10px] font-bold text-slate-600">
                {buyerPayouts.length === 0 && (
                  <div className="p-3 bg-slate-50 rounded-2xl text-slate-500">No wallet activity yet.</div>
                )}
                {buyerPayouts.map(p => (
                  <div key={p.id} className="p-3 bg-slate-50 rounded-2xl flex items-center justify-between">
                    <span>{p.reason}</span>
                    <span className={p.amount >= 0 ? 'text-emerald-600' : 'text-red-500'}>
                      {p.amount >= 0 ? '+' : ''}{p.amount} SC
                    </span>
                  </div>
                ))}
              </div>
            </section>

            <section className="bg-white rounded-3xl border border-blue-100 shadow-sm p-5">
                <div className="flex items-center gap-2 mb-3">
                  <ShieldCheck className="w-4 h-4 text-amber-500" />
                  <h3 className="text-xs font-black uppercase tracking-widest text-blue-500">Anti-Fraud Checks</h3>
                </div>
                <div className="space-y-2 text-[10px] font-bold text-slate-600">
                  {fraudAlerts.length === 0 && (
                    <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-700">No active fraud alerts.</div>
                  )}
                  {fraudAlerts.map((alert, idx) => (
                    <div
                      key={alert.id || `fraud_${idx}`}
                      className="p-3 rounded-2xl bg-amber-50"
                    >
                      {alert?.details || alert?.type || 'Fraud alert'}
                    </div>
                  ))}
                </div>
              </section>

          </>
        )}

          {activeTab === 'stars' && (
          <>
        {/* Leaderboard */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-black uppercase tracking-widest text-blue-500">Leaderboard</h3>
            <div className="text-[10px] text-zinc-500 font-bold">Live</div>
          </div>
          <div className="space-y-2">
            {leaderboard.map((leader) => {
              const name = formatLeaderboardName(leader.user_id);
              const rank = leader.rank ?? 0;
              const stars = Number(leader.stars_total ?? 0);
              return (
                <div key={`${leader.user_id}-${rank}`} className="flex items-center p-3 bg-white rounded-2xl border border-blue-100 shadow-sm">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-black ${
                      rank === 1
                        ? 'bg-yellow-200'
                        : rank === 2
                        ? 'bg-zinc-200'
                        : rank === 3
                        ? 'bg-blue-600 text-white'
                        : 'bg-blue-50'
                    }`}
                  >
                    {rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : '🥴'}
                  </div>
                  <div className="ml-3">
                    <p className={`text-sm font-bold ${name === 'YOU' ? 'text-blue-600' : 'text-zinc-800'}`}>{name}</p>
                    <p className="text-[10px] text-zinc-400">Rank #{rank || '—'}</p>
                  </div>
                  <span className="ml-auto text-blue-600 font-black text-sm">{stars}⭐</span>
                </div>
              );
            })}
          </div>
        </section>

        {/* Progress */}
        <section className="bg-white rounded-3xl border border-blue-100 shadow-sm p-5">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center">
                📊
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-blue-500">Progress</p>
                <p className="text-[10px] text-zinc-500">
                  {nextMilestone ? `${currentStars}/${nextMilestone.stars} ⭐ → ${nextMilestone.label}` : `${currentStars} ⭐`}
                </p>
              </div>
            </div>
            <div className="w-full bg-blue-50 rounded-full h-3">
              <div
                className="h-3 rounded-full"
                style={{ width: `${progressPct}%`, background: 'linear-gradient(90deg, #1976D2, #42A5F5)' }}
              />
            </div>
            <div className="mt-3 text-[10px] font-bold text-blue-600">{progressPct}% complete</div>
          </div>
        </section>

        {/* Reward Unlocks */}
        <section className="bg-white rounded-3xl border border-blue-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="w-4 h-4 text-blue-600" />
            <h3 className="text-xs font-black uppercase tracking-widest text-blue-500">Reward Unlocks</h3>
          </div>
          <div className="space-y-3">
            {milestones.length === 0 && (
              <div className="p-3 bg-blue-50 rounded-2xl text-[10px] font-bold text-zinc-500">
                Milestones not configured yet.
              </div>
            )}
            {milestones.map((milestone) => (
              <div key={milestone.stars} className="p-3 bg-blue-50 rounded-2xl flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-zinc-900">{milestone.label}</p>
                  <p className="text-[10px] text-zinc-500">{milestone.stars} stars required</p>
                </div>
                {currentStars >= milestone.stars ? (
                  <span className="text-[10px] font-black text-emerald-600">Unlocked</span>
                ) : (
                  <button className="text-[10px] font-black text-blue-600 flex items-center gap-1">
                    Earn <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Footer CTA */}
        <section className="bg-blue-600 text-white rounded-3xl p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-blue-100">Rewards</p>
            <p className="text-sm font-bold">
              {nextMilestone ? `Free Pro in ${Math.max(0, nextMilestone.stars - currentStars)}⭐` : 'Earn stars to unlock rewards'}
            </p>
          </div>
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
        </section>

        </>
        )}
      </div>

      {showQrModal && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="w-full max-w-sm bg-white rounded-3xl overflow-hidden">
            <div className="p-4 border-b flex items-center justify-between">
              <div className="text-xs font-black text-slate-800">QR Scan (Unlimited)</div>
              <button onClick={closeQrModal} className="text-slate-400" aria-label="Close QR scanner">✕</button>
            </div>
            <div className="p-5 space-y-4">
              {qrStep === 'scan' && (
                <>
                  <div className="space-y-3">
                    {scannerSupported ? (
                      <div className="h-44 bg-slate-100 rounded-2xl overflow-hidden flex items-center justify-center">
                        {cameraActive ? (
                          <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline muted />
                        ) : (
                          <div className="text-[10px] font-bold text-slate-400">Camera idle</div>
                        )}
                      </div>
                    ) : (
                      <div className="h-20 bg-slate-100 rounded-2xl flex items-center justify-center text-[10px] font-bold text-slate-400">
                        Camera not available
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-[10px] font-bold">
                      {scannerSupported && (
                        <button
                          onClick={() => (cameraActive ? stopScanner() : startScanner())}
                          className="flex-1 py-2 rounded-xl bg-slate-900 text-white"
                        >
                          {cameraActive ? 'Stop Scanner' : 'Start Scanner'}
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setQrPayload('');
                          setScanStatus('idle');
                          setScanError(null);
                        }}
                        className="flex-1 py-2 rounded-xl bg-slate-100 text-slate-600"
                      >
                        Clear
                      </button>
                    </div>
                    <div className="text-[10px] text-slate-500 font-bold">
                      Status: {scanStatus === 'scanning' ? 'Scanning…' : scanStatus === 'found' ? 'QR detected' : scanStatus === 'error' ? 'Scanner error' : 'Idle'}
                    </div>
                    {scanError && (
                      <div className="p-3 bg-red-50 rounded-2xl text-[10px] font-bold text-red-700">
                        {scanError}
                      </div>
                    )}
                    <input
                      value={qrPayload}
                      onChange={(e) => {
                        setQrPayload(e.target.value);
                        if (e.target.value.trim()) {
                          setScanStatus('found');
                          setScanError(null);
                        }
                      }}
                      placeholder="Paste or enter QR code"
                      className="w-full p-3 bg-white rounded-xl border border-slate-200 text-[10px] font-bold text-slate-700"
                    />
                    <input
                      value={sellerId}
                      onChange={(e) => setSellerId(e.target.value)}
                      placeholder="Seller ID (optional)"
                      className="w-full p-3 bg-white rounded-xl border border-slate-200 text-[10px] font-bold text-slate-700"
                    />
                  </div>
                  <div className="p-3 rounded-2xl bg-blue-50 text-blue-700 text-[10px] font-bold">
                    Shop-wide QR scan (only workflow)
                  </div>
                  <p className="text-[10px] text-slate-500 font-bold">Quick 30s survey to earn SC.</p>
                  <button
                    onClick={() => {
                      if (!qrPayload.trim()) {
                        setScanError('Scan a QR code or enter the code manually.');
                        return;
                      }
                      setGpsStatus('checking');
                      setFraudWarning(null);
                      if (navigator.geolocation) {
                        navigator.geolocation.getCurrentPosition(
                          async (pos) => {
                            try {
                              const distanceM = Number.isFinite(pos.coords.accuracy) ? pos.coords.accuracy : 0;
                              const verified = distanceM <= 25;
                              const resp = await verifyRewardsGps({
                                lat_enc: pos.coords.latitude.toFixed(6),
                                lng_enc: pos.coords.longitude.toFixed(6),
                                distance_m: distanceM,
                                verified
                              });
                              const apiMeters = Number(resp?.distance_m ?? resp?.distance ?? resp?.meters);
                              const meters = Number.isFinite(apiMeters) ? apiMeters : distanceM;
                              setDistanceMeters(Number.isFinite(meters) ? meters : null);
                              const verifiedResp = typeof resp?.verified === 'boolean'
                                ? resp.verified
                                : Number.isFinite(meters)
                                  ? meters <= 25
                                  : false;
                              if (verifiedResp) {
                                setGpsStatus('verified');
                              } else {
                                setGpsStatus('failed');
                                setFraudWarning(resp?.message || 'Location mismatch detected. Rewards locked. Repeat attempts lead to bans.');
                              }
                            } catch (err: any) {
                              setGpsStatus('failed');
                              setFraudWarning(err?.message || 'GPS verification failed. Rewards locked. Repeat attempts lead to bans.');
                            }
                          },
                          (geoErr) => {
                            setGpsStatus('failed');
                            setFraudWarning(geoErr?.message || 'GPS verification failed. Rewards locked. Repeat attempts lead to bans.');
                          },
                          { enableHighAccuracy: true, timeout: 8000 }
                        );
                      } else {
                        setGpsStatus('failed');
                        setFraudWarning('GPS unavailable. Rewards locked. Repeat attempts lead to bans.');
                      }
                      setQrStep('product');
                    }}
                    className="w-full py-3 bg-blue-600 text-white rounded-xl text-[10px] font-black"
                  >
                    Start Survey
                  </button>
                </>
              )}
              {qrStep === 'product' && (
                <>
                  <div className="p-3 bg-blue-50 rounded-2xl text-[10px] font-bold text-blue-700 flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    {sellerId ? `Seller ${sellerId}` : 'Seller detected from QR'}
                  </div>
                  <div className="text-[10px] font-bold text-slate-600">
                    GPS check: {gpsStatus === 'checking' ? 'checking…' : gpsStatus === 'verified' ? `verified (${distanceMeters?.toFixed(1)}m)` : 'failed'}
                  </div>
                  {fraudWarning && (
                    <div className="p-3 bg-red-50 rounded-2xl text-[10px] font-bold text-red-700">
                      ⚠ {fraudWarning}
                    </div>
                  )}
                  <div className="text-[10px] font-black text-slate-800">What did you buy today?</div>
                  <div className="space-y-2 text-[10px] font-bold text-slate-600">
                    <input
                      className="p-3 bg-slate-100 rounded-xl text-slate-900 w-full"
                      placeholder="Type product name"
                      value={survey.product}
                      onChange={(e) => setSurvey(prev => ({ ...prev, product: e.target.value }))}
                    />
                  </div>
                  <button
                    onClick={() => setQrStep('price')}
                    disabled={gpsStatus !== 'verified'}
                    className={`w-full py-3 rounded-xl text-[10px] font-black ${gpsStatus === 'verified' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-400'}`}
                  >
                    Continue
                  </button>
                </>
              )}
              {qrStep === 'price' && (
                <>
                  <div className="space-y-2 text-[10px] font-bold text-slate-600">
                    <label className="flex flex-col gap-1">
                      {survey.product || 'Item'} price today? KSh
                      <input
                        className="p-2 bg-slate-100 rounded-xl text-slate-900"
                        value={survey.price}
                        onChange={(e) => setSurvey(prev => ({ ...prev, price: e.target.value }))}
                      />
                    </label>
                    <label className="flex flex-col gap-1">
                      Quantity
                      <div className="flex gap-2">
                        {[1, 2, 3].map((q) => (
                          <button
                            key={q}
                            onClick={() => setQuantity(q)}
                            className={`flex-1 py-2 rounded-xl ${quantity === q ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}
                          >
                            {q}
                          </button>
                        ))}
                        <button
                          onClick={() => setQuantity(4)}
                          className={`flex-1 py-2 rounded-xl ${quantity === 4 ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}
                        >
                          3+
                        </button>
                      </div>
                    </label>
                    <label className="flex flex-col gap-1">
                      Stock available?
                      <select
                        className="p-2 bg-slate-100 rounded-xl"
                        value={survey.stock}
                        onChange={(e) => setSurvey(prev => ({ ...prev, stock: e.target.value }))}
                      >
                        <option>Full</option>
                        <option>Half</option>
                        <option>Empty</option>
                      </select>
                    </label>
                    <label className="flex flex-col gap-1">
                      Will buy again?
                      <select
                        className="p-2 bg-slate-100 rounded-xl"
                        value={survey.repeat}
                        onChange={(e) => setSurvey(prev => ({ ...prev, repeat: e.target.value }))}
                      >
                        <option>Yes</option>
                        <option>No</option>
                      </select>
                    </label>
                    <label className="flex flex-col gap-1">
                      Duka clean? (1-5)
                      <input
                        type="number"
                        min={1}
                        max={5}
                        className="p-2 bg-slate-100 rounded-xl"
                        value={survey.cleanliness}
                        onChange={(e) => setSurvey(prev => ({ ...prev, cleanliness: Number(e.target.value) }))}
                      />
                    </label>
                  </div>
                  <button
                    onClick={handleQrSurveySubmit}
                    className="w-full py-3 bg-emerald-600 text-white rounded-xl text-[10px] font-black"
                  >
                    Complete Survey (earn SC)
                  </button>
                </>
              )}
              {qrStep === 'reward' && (
                <>
                  <div className="p-4 bg-emerald-50 rounded-2xl text-emerald-700 text-[10px] font-bold">
                    ✅ Scan complete! +{scanResult?.rewards_issued ?? 0} SC • Balance: {buyerCoins} SC
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[10px] font-bold">
                    {walletOffers.slice(0, 2).map((offer) => (
                      <button key={offer.label} className="p-3 bg-blue-50 rounded-2xl text-blue-700">
                        {offer.label}
                      </button>
                    ))}
                    {walletOffers.length === 0 && (
                      <div className="col-span-2 p-3 bg-blue-50 rounded-2xl text-blue-700 text-center">
                        Rewards are applied to your SC wallet.
                      </div>
                    )}
                  </div>
                  <div className="p-3 bg-zinc-50 rounded-2xl text-[10px] text-zinc-600 font-bold">
                    Stars earned: {scanResult?.stars_awarded ?? 0}
                    {typeof scanResult?.raw_stars === 'number' && scanResult.raw_stars !== scanResult?.stars_awarded
                      ? ` (from ${scanResult.raw_stars} raw)`
                      : ''}
                    • Product: {survey.product || 'Item'} • Qty: {quantity} • Repeat: {survey.repeat}.
                  </div>
                  {Array.isArray(scanResult?.breakdown) && scanResult.breakdown.length > 0 && (
                    <div className="p-3 bg-white rounded-2xl border border-zinc-200 text-[10px] text-zinc-700">
                      <div className="mb-2 font-black uppercase tracking-[0.2em] text-zinc-500">Score breakdown</div>
                      <div className="space-y-2">
                        {scanResult.breakdown.map((item, index) => (
                          <div key={`${item.key || index}`} className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="font-bold text-zinc-900">{item.label || item.key || 'Score item'}</div>
                              {item.note && <div className="text-zinc-500">{item.note}</div>}
                            </div>
                            <div className="font-black text-emerald-700 whitespace-nowrap">
                              +{Number(item.points ?? 0).toFixed(2)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {typeof scanResult?.raw_stars === 'number' && typeof scanResult?.stars_awarded === 'number' && scanResult.raw_stars > scanResult.stars_awarded && (
                    <div className="p-3 bg-amber-50 rounded-2xl text-[10px] text-amber-800 font-bold">
                      Final score capped at {scanResult.stars_awarded} stars from {scanResult.raw_stars} raw stars.
                    </div>
                  )}
                  <button
                    onClick={() => {
                      setQrStep('scan');
                      closeQrModal();
                      setQrPayload('');
                      setSellerId('');
                      setSurvey({ price: '', stock: 'Full', repeat: 'Yes', cleanliness: 4, product: '' });
                      setQuantity(1);
                      setGpsStatus('idle');
                      setDistanceMeters(null);
                      setFraudWarning(null);
                      setScanResult(null);
                    }}
                    className="w-full py-3 bg-blue-600 text-white rounded-xl text-[10px] font-black"
                  >
                    Scan Again
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {receiptScanOpen && (
        <div className="fixed inset-0 z-[90] bg-black/70 flex items-center justify-center p-4">
          <div className="bg-black w-full max-w-md rounded-3xl overflow-hidden">
            <div className="relative">
              <video ref={receiptVideoRef} className="w-full h-96 object-cover" autoPlay playsInline muted />
              <button
                onClick={closeReceiptScanner}
                className="absolute top-3 right-3 p-2 bg-black/60 rounded-full text-white"
              >
                X
              </button>
            </div>
            <div className="p-4 flex items-center justify-between">
              <span className="text-xs text-white font-bold">Receipt Scanner</span>
              <button
                onClick={captureReceipt}
                className="px-4 py-2 bg-white text-black rounded-xl text-xs font-bold"
              >
                Capture
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
