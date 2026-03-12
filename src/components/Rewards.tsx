import React, { useMemo, useState } from 'react';
import { Camera, Users, Upload, Crown, Trophy, ArrowRight, Star, MessageCircle, Sparkles, QrCode, ShieldCheck, MapPin, Wallet, Camera as CameraIcon, Receipt, Gift, ClipboardCheck, BadgeCheck, Share2, CalendarDays } from 'lucide-react';
import { PRODUCTS, SELLERS } from '../mockData';

const MILESTONES = [
  { stars: 50, label: 'Free Pro Month' },
  { stars: 100, label: 'Featured Duka' },
  { stars: 250, label: 'KSh5k Voucher' },
  { stars: 500, label: 'Neighborhood Champion' }
];

const LEADERS = [
  { rank: 1, name: 'Jane', stars: 127 },
  { rank: 2, name: 'Ali', stars: 98 },
  { rank: 3, name: 'YOU', stars: 47 },
  { rank: 4, name: 'Fatma', stars: 42 }
];

interface RewardsProps {
  buyerBalance: number;
  onBuyerBalanceChange: (next: number) => void;
  buyerPayouts: Array<{ id: string; amount: number; reason: string; timestamp: number }>;
  onBuyerPayoutsChange: (next: Array<{ id: string; amount: number; reason: string; timestamp: number }>) => void;
}

export const Rewards: React.FC<RewardsProps> = ({
  buyerBalance,
  onBuyerBalanceChange,
  buyerPayouts,
  onBuyerPayoutsChange
}) => {
  const [currentStars, setCurrentStars] = useState(47);
  const [leaderboard, setLeaderboard] = useState(LEADERS);
  const currentRank = 3;
  const [activeTab, setActiveTab] = useState<'stars' | 'wallet' | 'receipts'>('stars');
  const [buyerCoins, setBuyerCoins] = useState(buyerBalance || 0);
  const [showQrModal, setShowQrModal] = useState(false);
  const [qrStep, setQrStep] = useState<'scan' | 'product' | 'price' | 'reward'>('scan');
  const [qrMode, setQrMode] = useState<'receipt' | 'manual'>('receipt');
  const [verificationMethod, setVerificationMethod] = useState<'counter_photo' | 'product_select' | 'neighbor'>('counter_photo');
  const [survey, setSurvey] = useState({ price: '', stock: 'Full', repeat: 'Yes', cleanliness: 4, product: '' });
  const [quantity, setQuantity] = useState(1);
  const [otherProduct, setOtherProduct] = useState('');
  const [detectedSellerId, setDetectedSellerId] = useState<string | null>(null);
  const [gpsStatus, setGpsStatus] = useState<'idle' | 'checking' | 'verified' | 'failed'>('idle');
  const [distanceMeters, setDistanceMeters] = useState<number | null>(null);
  const [fraudWarning, setFraudWarning] = useState<string | null>(null);
  const [receiptUploads, setReceiptUploads] = useState<Array<{ id: string; amount: number; items: string[]; paid: number }>>([]);
  const [receiptStreak, setReceiptStreak] = useState(5);
  const [dailyCheckIn, setDailyCheckIn] = useState(false);
  const [searchStreak] = useState(3);
  const [reviewStreak] = useState(2);
  const [shareStreak] = useState(1);
  const [referralPhone, setReferralPhone] = useState('');
  const [referralsCount, setReferralsCount] = useState(1);
  const [purchaseConfirmation, setPurchaseConfirmation] = useState<'idle' | 'confirmed'>('idle');
  const [showReceiptQueue, setShowReceiptQueue] = useState(false);

  React.useEffect(() => {
    try {
      const flag = localStorage.getItem('soko:open_qr');
      if (flag === 'true') {
        setActiveTab('wallet');
        setShowQrModal(true);
        setQrStep('scan');
        localStorage.removeItem('soko:open_qr');
      }
    } catch {}
  }, []);

  React.useEffect(() => {
    setBuyerCoins(buyerBalance || 0);
  }, [buyerBalance]);

  const detectedSeller = detectedSellerId ? SELLERS.find(s => s.id === detectedSellerId) : SELLERS[0];
  const detectedProducts = PRODUCTS.filter(p => p.sellerId === (detectedSeller?.id || PRODUCTS[0]?.sellerId)).slice(0, 6);

  const distanceMetersBetween = (a: { lat: number; lng: number }, b: { lat: number; lng: number }) => {
    const R = 6371e3;
    const dLat = (b.lat - a.lat) * Math.PI / 180;
    const dLon = (b.lng - a.lng) * Math.PI / 180;
    const lat1 = a.lat * Math.PI / 180;
    const lat2 = b.lat * Math.PI / 180;
    const x = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
    return 2 * R * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
  };

  const nextMilestone = useMemo(() => {
    return MILESTONES.find(m => currentStars < m.stars) || MILESTONES[MILESTONES.length - 1];
  }, [currentStars]);

  const progressPct = Math.min(100, Math.round((currentStars / nextMilestone.stars) * 100));

  const bumpLeaderboard = (delta: number) => {
    const nextStars = currentStars + delta;
    setCurrentStars(nextStars);
    setLeaderboard(prev => prev.map(entry => (
      entry.name === 'YOU' ? { ...entry, stars: nextStars } : entry
    )));
  };

  const handleReceiptUpload = () => {
    const id = `r_${Date.now()}`;
    const items = ['Unga 2kg', 'Sukari 1kg', 'Maziwa 500ml'];
    const paid = 15;
    const amount = 390;
    setReceiptUploads(prev => [{ id, amount, items, paid }, ...prev].slice(0, 6));
    setBuyerCoins(prev => prev + paid);
    onBuyerBalanceChange(buyerBalance + paid);
    onBuyerPayoutsChange([{ id: `bp_${Date.now()}`, amount: paid, reason: 'Receipt upload reward', timestamp: Date.now() }, ...buyerPayouts]);
    setReceiptStreak(prev => prev + 1);
    bumpLeaderboard(2);
  };

  const handleReferral = () => {
    if (!referralPhone.trim()) return;
    setReferralsCount(prev => prev + 1);
    setBuyerCoins(prev => prev + 15);
    onBuyerBalanceChange(buyerBalance + 15);
    onBuyerPayoutsChange([{ id: `bp_${Date.now()}`, amount: 15, reason: 'Referral reward', timestamp: Date.now() }, ...buyerPayouts]);
    setReferralPhone('');
    bumpLeaderboard(5);
  };

  const handlePurchaseConfirmation = () => {
    setPurchaseConfirmation('confirmed');
    setBuyerCoins(prev => prev + 5);
    onBuyerBalanceChange(buyerBalance + 5);
    onBuyerPayoutsChange([{ id: `bp_${Date.now()}`, amount: 5, reason: 'Purchase confirmation reward', timestamp: Date.now() }, ...buyerPayouts]);
    bumpLeaderboard(1);
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
              <p className="text-sm font-bold text-zinc-900">Mombasa</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-blue-600 text-white px-3 py-1.5 rounded-full text-xs font-black">
              <Star className="w-3 h-3" /> {currentStars}/{nextMilestone.stars}
            </div>
            <div className="flex items-center gap-1 bg-yellow-200 text-yellow-900 px-3 py-1.5 rounded-full text-[10px] font-black">
              <Crown className="w-3 h-3" /> #{currentRank}
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
        {activeTab === 'receipts' && (
          <>
            <section className="bg-white rounded-3xl border border-blue-100 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-3">
                <Receipt className="w-4 h-4 text-emerald-600" />
                <h3 className="text-xs font-black uppercase tracking-widest text-blue-500">Receipt Upload Rewards</h3>
              </div>
              <p className="text-[10px] text-slate-500 font-bold">Upload any receipt. Instant M-PESA rewards + price intelligence.</p>
              <div className="mt-4 grid grid-cols-1 gap-3">
                <button
                  onClick={handleReceiptUpload}
                  className="w-full py-3 bg-emerald-600 text-white rounded-xl text-[10px] font-black flex items-center justify-center gap-2"
                >
                  <Upload className="w-4 h-4" /> Upload Receipt Photo (KES 5-20)
                </button>
                <div className="p-3 bg-emerald-50 rounded-2xl text-[10px] font-bold text-emerald-700">
                  Streak: {receiptStreak} days • Bonus at 7 days (KES 50) and 30 days (KES 200)
                </div>
                <button
                  onClick={() => setShowReceiptQueue(prev => !prev)}
                  className="w-full py-3 bg-slate-100 text-slate-700 rounded-xl text-[10px] font-black"
                >
                  {showReceiptQueue ? 'Hide' : 'Show'} Offline Receipt Queue
                </button>
                {showReceiptQueue && (
                  <div className="p-3 bg-slate-50 rounded-2xl text-[10px] font-bold text-slate-600">
                    2 receipts queued. Will upload automatically when online.
                  </div>
                )}
              </div>
              {receiptUploads.length > 0 && (
                <div className="mt-4 space-y-2">
                  {receiptUploads.map(upload => (
                    <div key={upload.id} className="p-3 bg-slate-50 rounded-2xl text-[10px] font-bold text-slate-700">
                      OCR: {upload.items.join(', ')} • Total KES {upload.amount} • Reward KES {upload.paid}
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="bg-white rounded-3xl border border-blue-100 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-3">
                <ClipboardCheck className="w-4 h-4 text-indigo-600" />
                <h3 className="text-xs font-black uppercase tracking-widest text-blue-500">Purchase Confirmation Rewards</h3>
              </div>
              <div className="p-3 bg-indigo-50 rounded-2xl text-[10px] font-bold text-indigo-700">
                "Ulinunua Samsung TV kutoka Shop A?" Confirm and earn KES 5.
              </div>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={handlePurchaseConfirmation}
                  className="flex-1 py-3 bg-indigo-600 text-white rounded-xl text-[10px] font-black"
                >
                  Confirm Purchase
                </button>
                <button className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl text-[10px] font-black">
                  Upload Product Photo (+KES 10)
                </button>
              </div>
              <div className="mt-2 text-[10px] text-slate-500 font-bold">
                Status: {purchaseConfirmation === 'confirmed' ? 'Confirmed • Reward sent' : 'Pending'}
              </div>
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
                Referrals: {referralsCount} • Next bonus at 5 invites (KES 100) • Refer a duka: both earn KES 200
              </div>
            </section>

            <section className="bg-white rounded-3xl border border-blue-100 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-4">
                <BadgeCheck className="w-4 h-4 text-emerald-600" />
                <h3 className="text-xs font-black uppercase tracking-widest text-blue-500">Daily Engagement Rewards</h3>
              </div>
              <div className="grid grid-cols-2 gap-3 text-[10px] font-bold">
                <button
                  onClick={() => {
                    setDailyCheckIn(true);
                    setBuyerCoins(prev => prev + 5);
                  }}
                  className={`p-3 rounded-2xl ${dailyCheckIn ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-700'}`}
                >
                  <CalendarDays className="w-3 h-3 inline-block mr-1" /> Daily Check-in
                </button>
                <div className="p-3 bg-slate-100 rounded-2xl text-slate-700">Search streak: {searchStreak}/7</div>
                <div className="p-3 bg-slate-100 rounded-2xl text-slate-700">Review streak: {reviewStreak}/5</div>
                <div className="p-3 bg-slate-100 rounded-2xl text-slate-700">Share streak: {shareStreak}/3</div>
              </div>
              <div className="mt-3 text-[10px] text-slate-500 font-bold">Complete streaks for weekly bonuses.</div>
            </section>

            <section className="bg-white rounded-3xl border border-blue-100 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-3">
                <Share2 className="w-4 h-4 text-indigo-600" />
                <h3 className="text-xs font-black uppercase tracking-widest text-blue-500">Share & Earn</h3>
              </div>
              <div className="p-3 bg-indigo-50 rounded-2xl text-[10px] font-bold text-indigo-700">
                Share products daily. If a friend buys, both get rewards.
              </div>
              <button className="mt-3 w-full py-3 bg-indigo-600 text-white rounded-xl text-[10px] font-black">
                Share Top Deal
              </button>
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
                  onClick={() => setShowQrModal(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl text-[10px] font-black flex items-center gap-2"
                >
                  <QrCode className="w-4 h-4" /> Scan QR
                </button>
              </div>
              <p className="mt-3 text-[10px] text-slate-500 font-bold">Unlimited scans. 30-second survey. Instant SC rewards.</p>
            </section>

            <section className="bg-white rounded-3xl border border-blue-100 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-4">
                <Wallet className="w-4 h-4 text-emerald-600" />
                <h3 className="text-xs font-black uppercase tracking-widest text-blue-500">Redeem SC</h3>
              </div>
              <div className="grid grid-cols-2 gap-3 text-[10px] font-bold">
                {[
                  { label: 'KSh20 Airtime', cost: 20 },
                  { label: 'KSh50 M-Pesa', cost: 50 },
                  { label: '10% Jane’s Duka', cost: 15 },
                  { label: 'KSh100 Unilever', cost: 100 }
                ].map(reward => (
                  <button
                    key={reward.label}
                      onClick={() => {
                        const next = Math.max(0, buyerCoins - reward.cost);
                        setBuyerCoins(next);
                        onBuyerBalanceChange(next);
                        onBuyerPayoutsChange([{ id: `bp_${Date.now()}`, amount: -reward.cost, reason: `Redeem: ${reward.label}`, timestamp: Date.now() }, ...buyerPayouts]);
                      }}
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
                  onClick={() => onBuyerPayoutsChange([])}
                  className="text-[10px] font-bold text-zinc-400"
                >
                  Clear
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
                  <div className="p-3 bg-amber-50 rounded-2xl">Same QR scanned 5 minutes ago. Wait 2 hours.</div>
                  <div className="p-3 bg-amber-50 rounded-2xl">No GPS movement detected. Walk 50m to confirm.</div>
                  <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-700">New location verified. +5 SC approved.</div>
                </div>
              </section>

            <section className="bg-white rounded-3xl border border-blue-100 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-3">
                <MapPin className="w-4 h-4 text-indigo-600" />
                <h3 className="text-xs font-black uppercase tracking-widest text-blue-500">Buyer Scan Heatmap</h3>
              </div>
              <div className="h-36 bg-blue-50 rounded-2xl flex items-center justify-center text-[10px] font-bold text-blue-600">
                Kibera 42 scans • CBD 85 scans
              </div>
            </section>
          </>
        )}

          {activeTab === 'stars' && (
          <>
        {/* Leaderboard */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-black uppercase tracking-widest text-blue-500">Mombasa Leaderboard</h3>
            <div className="text-[10px] text-zinc-500 font-bold">Live</div>
          </div>
          <div className="space-y-2">
            {leaderboard
              .sort((a, b) => b.stars - a.stars)
              .map((leader) => (
                <div key={leader.rank} className="flex items-center p-3 bg-white rounded-2xl border border-blue-100 shadow-sm">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-black ${
                      leader.rank === 1
                        ? 'bg-yellow-200'
                        : leader.rank === 2
                        ? 'bg-zinc-200'
                        : leader.rank === 3
                        ? 'bg-blue-600 text-white'
                        : 'bg-blue-50'
                    }`}
                  >
                    {leader.rank === 1 ? '🥇' : leader.rank === 2 ? '🥈' : leader.rank === 3 ? '🥉' : '🥴'}
                  </div>
                  <div className="ml-3">
                    <p className={`text-sm font-bold ${leader.name === 'YOU' ? 'text-blue-600' : 'text-zinc-800'}`}>{leader.name}</p>
                    <p className="text-[10px] text-zinc-400">Rank #{leader.rank}</p>
                  </div>
                  <span className="ml-auto text-blue-600 font-black text-sm">{leader.stars}⭐</span>
                </div>
              ))}
          </div>
        </section>

        {/* Progress + Quick Actions */}
        <section className="bg-white rounded-3xl border border-blue-100 shadow-sm p-5">
          <div className="grid grid-cols-1 sm:grid-cols-[1fr,1fr] gap-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center">
                  📊
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-blue-500">Progress</p>
                  <p className="text-[10px] text-zinc-500">{currentStars}/{nextMilestone.stars} ⭐ → {nextMilestone.label}</p>
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
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-black uppercase tracking-widest text-blue-500">Quick Actions</h3>
                <span className="text-[10px] text-zinc-500 font-bold">One-tap earn</span>
              </div>
              <div className="grid grid-cols-1 gap-3">
                <button
                  onClick={() => bumpLeaderboard(2)}
                  className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-2xl shadow-lg flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <Camera className="w-4 h-4" />
                    <span className="text-sm font-bold">Photo Stock</span>
                  </div>
                  <span className="text-xs font-black">+2⭐</span>
                </button>
                <button
                  onClick={() => bumpLeaderboard(5)}
                  className="p-3 bg-emerald-500 text-white rounded-2xl shadow-lg flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    <span className="text-sm font-bold">Invite Friend</span>
                  </div>
                  <span className="text-xs font-black">+5⭐</span>
                </button>
                <button
                  onClick={() => bumpLeaderboard(10)}
                  className="p-3 bg-purple-500 text-white rounded-2xl shadow-lg flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <Upload className="w-4 h-4" />
                    <span className="text-sm font-bold">CSV Upload</span>
                  </div>
                  <span className="text-xs font-black">+10⭐</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* WhatsApp Bot Sync */}
        <section className="bg-white rounded-3xl border border-blue-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-3">
            <MessageCircle className="w-4 h-4 text-emerald-600" />
            <h3 className="text-xs font-black uppercase tracking-widest text-blue-500">WhatsApp Bot Sync</h3>
          </div>
          <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100 text-[10px] text-zinc-600 font-bold">
            📸 Stock photo confirmed! +2⭐ — YOU: {currentStars}/50 ⭐👑 #{currentRank} Mombasa
          </div>
        </section>

        {/* Reward Unlocks */}
        <section className="bg-white rounded-3xl border border-blue-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="w-4 h-4 text-blue-600" />
            <h3 className="text-xs font-black uppercase tracking-widest text-blue-500">Reward Unlocks</h3>
          </div>
          <div className="space-y-3">
            {MILESTONES.map((milestone) => (
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
            <p className="text-sm font-bold">Free Pro in {Math.max(0, nextMilestone.stars - currentStars)}⭐</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
        </section>

        <section className="bg-white rounded-3xl border border-blue-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <Crown className="w-4 h-4 text-amber-500" />
            <h3 className="text-xs font-black uppercase tracking-widest text-blue-500">Subscription Tiers</h3>
          </div>
          <div className="grid grid-cols-1 gap-3 text-[10px] font-bold">
            <div className="p-4 bg-blue-50 rounded-2xl">
              <p className="text-slate-900 font-black">Free</p>
              <p className="text-slate-600">Basic demand + 10⭐/day display</p>
            </div>
            <div className="p-4 bg-blue-50 rounded-2xl">
              <p className="text-slate-900 font-black">Pro (KSh2k/mo)</p>
              <p className="text-slate-600">Unlimited stars + buyer insights</p>
            </div>
            <div className="p-4 bg-blue-50 rounded-2xl">
              <p className="text-slate-900 font-black">Enterprise (KSh20k/mo)</p>
              <p className="text-slate-600">Full buyer data + API access</p>
            </div>
          </div>
        </section>

        <section className="bg-white rounded-3xl border border-blue-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="w-4 h-4 text-indigo-600" />
            <h3 className="text-xs font-black uppercase tracking-widest text-blue-500">Brand Subscriptions</h3>
          </div>
          <div className="grid grid-cols-1 gap-3 text-[10px] font-bold">
            <div className="p-4 bg-indigo-50 rounded-2xl">
              <p className="text-slate-900 font-black">Basic (KSh100k/mo)</p>
              <p className="text-slate-600">Top 100 duka access</p>
            </div>
            <div className="p-4 bg-indigo-50 rounded-2xl">
              <p className="text-slate-900 font-black">Pro (KSh500k/mo)</p>
              <p className="text-slate-600">Live buyer sentiment + heatmaps</p>
            </div>
            <div className="p-4 bg-indigo-50 rounded-2xl">
              <p className="text-slate-900 font-black">Enterprise (KSh2M/mo)</p>
              <p className="text-slate-600">Full consumer dataset</p>
            </div>
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
              <button onClick={() => setShowQrModal(false)} className="text-slate-400">✕</button>
            </div>
            <div className="p-5 space-y-4">
              {qrStep === 'scan' && (
                <>
                  <div className="h-40 bg-slate-100 rounded-2xl flex items-center justify-center text-[10px] font-bold text-slate-400">
                    QR Scanner Active
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[10px] font-bold">
                    <button
                      onClick={() => setQrMode('receipt')}
                      className={`p-3 rounded-2xl ${qrMode === 'receipt' ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-700'}`}
                    >
                      Receipt QR
                    </button>
                    <button
                      onClick={() => setQrMode('manual')}
                      className={`p-3 rounded-2xl ${qrMode === 'manual' ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-700'}`}
                    >
                      Manual Duka
                    </button>
                  </div>
                  <div className="p-3 bg-zinc-50 rounded-2xl text-[10px] text-zinc-600 font-bold">
                    {qrMode === 'receipt' ? (
                      <>Dynamic QR: sconnect.co/r?tx=ABC123 • Duka ID: DK-009 • GPS hash: 34X9</>
                    ) : (
                      <>Counter sticker QR • Duka ID: DK-009 • GPS hash: 34X9</>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-500 font-bold">Thank you Priya! Quick 30s survey?</p>
                  <button
                    onClick={() => {
                      const encoded = Math.floor(Date.now() / 1000) % SELLERS.length;
                      setDetectedSellerId(SELLERS[encoded]?.id || SELLERS[0]?.id || null);
                      setGpsStatus('checking');
                      setFraudWarning(null);
                      const shop = SELLERS[encoded]?.location || SELLERS[0]?.location;
                      if (navigator.geolocation && shop) {
                        navigator.geolocation.getCurrentPosition(
                          (pos) => {
                            const buyer = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                            const meters = distanceMetersBetween(buyer, shop);
                            setDistanceMeters(meters);
                            if (meters <= 10) {
                              setGpsStatus('verified');
                            } else {
                              setGpsStatus('failed');
                              setFraudWarning('Location mismatch detected (over 10m). Rewards locked. Repeat attempts lead to bans.');
                            }
                          },
                          () => {
                            setGpsStatus('failed');
                            setFraudWarning('GPS verification failed. Rewards locked. Repeat attempts lead to bans.');
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
                    {detectedSeller?.name}, {detectedSeller?.location?.address || 'Duka detected'} (from QR)
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
                  <div className="grid grid-cols-1 gap-2 text-[10px] font-bold">
                    {detectedProducts.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => setSurvey(prev => ({ ...prev, product: p.name }))}
                        className={`p-3 rounded-2xl text-left ${survey.product === p.name ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}
                      >
                        {p.name}
                      </button>
                    ))}
                    <button
                      onClick={() => setSurvey(prev => ({ ...prev, product: 'Other' }))}
                      className={`p-3 rounded-2xl text-left ${survey.product === 'Other' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}
                    >
                      Other...
                    </button>
                  </div>
                  {survey.product === 'Other' && (
                    <div className="mt-2 space-y-2 text-[10px] font-bold text-slate-600">
                      <input
                        className="p-2 bg-slate-100 rounded-xl text-slate-900 w-full"
                        placeholder="Type product name"
                        value={otherProduct}
                        onChange={(e) => setOtherProduct(e.target.value)}
                      />
                      <button className="w-full py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black flex items-center justify-center gap-2">
                        <CameraIcon className="w-3 h-3" /> Add photo proof
                      </button>
                    </div>
                  )}
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
                  {qrMode === 'manual' && (
                    <div className="space-y-2 text-[10px] font-bold text-slate-600">
                      <div className="p-3 bg-slate-50 rounded-2xl">Manual duka verification enabled</div>
                    </div>
                  )}
                  <div className="space-y-2 text-[10px] font-bold text-slate-600">
                    <label className="flex flex-col gap-1">
                      {(survey.product === 'Other' ? otherProduct || 'Other' : survey.product || 'Item')} price today? KSh
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
                  {qrMode === 'manual' && (
                    <div className="space-y-2 text-[10px] font-bold text-slate-600">
                      <p className="text-[10px] text-slate-500 font-black">Manual verification method</p>
                      <div className="grid grid-cols-1 gap-2">
                        <button
                          onClick={() => setVerificationMethod('counter_photo')}
                          className={`p-2 rounded-xl ${verificationMethod === 'counter_photo' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'}`}
                        >
                          Counter QR + shelf photo (+5 SC, +2⭐ duka)
                        </button>
                        <button
                          onClick={() => setVerificationMethod('product_select')}
                          className={`p-2 rounded-xl ${verificationMethod === 'product_select' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'}`}
                        >
                          Product selection survey (+3 SC, +1⭐ duka)
                        </button>
                        <button
                          onClick={() => setVerificationMethod('neighbor')}
                          className={`p-2 rounded-xl ${verificationMethod === 'neighbor' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'}`}
                        >
                          Neighbor verification (within 100m) (+5 SC)
                        </button>
                      </div>
                    </div>
                  )}
                  <button
                    onClick={() => {
                      if (gpsStatus !== 'verified') {
                        setFraudWarning('GPS verification failed. No rewards will be paid out. Repeat attempts may result in a ban.');
                        return;
                      }
                      const coinGain = qrMode === 'manual' && verificationMethod === 'product_select' ? 3 : 5;
                      const next = buyerCoins + coinGain;
                      setBuyerCoins(next);
                      onBuyerBalanceChange(next);
                      onBuyerPayoutsChange([{ id: `bp_${Date.now()}`, amount: coinGain, reason: 'QR scan reward', timestamp: Date.now() }, ...buyerPayouts]);
                      setQrStep('reward');
                    }}
                    className="w-full py-3 bg-emerald-600 text-white rounded-xl text-[10px] font-black"
                  >
                    Complete Survey (earn SC)
                  </button>
                </>
              )}
              {qrStep === 'reward' && (
                <>
                  <div className="p-4 bg-emerald-50 rounded-2xl text-emerald-700 text-[10px] font-bold">
                    ✅ Scan complete! Total: {buyerCoins} SC
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[10px] font-bold">
                    <button className="p-3 bg-blue-50 rounded-2xl text-blue-700">KSh20 Airtime</button>
                    <button className="p-3 bg-blue-50 rounded-2xl text-blue-700">10% OFF</button>
                  </div>
                  <div className="p-3 bg-zinc-50 rounded-2xl text-[10px] text-zinc-600 font-bold">
                    Duka gets +5⭐ from your scan. Product: {survey.product === 'Other' ? otherProduct || 'Other' : survey.product}. Qty: {quantity}. Repeat: {survey.repeat}.
                  </div>
                  <button
                    onClick={() => {
                      setQrStep('scan');
                      setShowQrModal(false);
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
    </div>
  );
};
