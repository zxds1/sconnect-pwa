import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { Send, X, Loader2, Paperclip, Mic, Star, Sparkles, ShieldCheck, Minus } from 'lucide-react';

type SupportMode = 'duka' | 'seller-ai' | 'brand';

type SupportMessage = {
  role: 'user' | 'assistant';
  content: string;
};

const MODE_COPY: Record<SupportMode, { title: string; subtitle: string; starter: string; badge: string }> = {
  duka: {
    title: 'Duka Support',
    subtitle: 'AI + Human • QR, stock, rewards',
    starter: 'Habari! Need help with QR, receipts, or rewards? I can help right away.',
    badge: '+5⭐'
  },
  'seller-ai': {
    title: 'Seller Studio AI',
    subtitle: 'Insights • Rankings • Forecasts',
    starter: 'Ask me to analyze your data. Example: “Why am I #3 today?”',
    badge: 'Insights'
  },
  brand: {
    title: 'Brand Executive',
    subtitle: 'Live market intelligence',
    starter: 'Welcome. Ask for heatmaps, top dukas, and demand spikes.',
    badge: 'Live'
  }
};

const QUICK_REPLIES: Record<SupportMode, Array<{ label: string; value: string }>> = {
  duka: [
    { label: 'QR Setup', value: 'QR not scanning. Help me fix it.' },
    { label: 'Photo Stock', value: 'I sent a shelf photo. How many units did you count?' },
    { label: 'Rank Help', value: 'Why am I #3 rank today?' },
    { label: 'Billing', value: 'How do I redeem SC rewards?' }
  ],
  'seller-ai': [
    { label: 'Rank', value: 'Why am I #3 rank today?' },
    { label: 'Forecast', value: 'Forecast demand for Unga this week.' },
    { label: 'Compare', value: 'Compare my prices vs nearby shops.' },
    { label: 'Boost', value: 'How do I boost my visibility?' }
  ],
  brand: [
    { label: 'Heatmap', value: 'Show Kibera heatmap for Omo.' },
    { label: 'Top Dukas', value: 'Top 5 dukas for Omo today?' },
    { label: 'Price Gap', value: 'Where is price below average?' },
    { label: 'Alerts', value: 'Any demand spikes this hour?' }
  ]
};

type SupportContext = {
  sellerName: string;
  sellerRank: number;
  sellerScore: number;
  sellerBalance: number;
  topProductName: string;
  topProductPrice: number;
  topProductGapPct: number;
  topDukas: Array<{ name: string; scans: number }>;
  demandSpike: string;
  avgPriceGapText: string;
};

export const SupportChat: React.FC<{
  mode: SupportMode;
  onClose: () => void;
  context: SupportContext;
}> = ({ mode, onClose, context }) => {
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [typingDots, setTypingDots] = useState(0);
  const [isMinimized, setIsMinimized] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages([{ role: 'assistant', content: MODE_COPY[mode].starter }]);
  }, [mode]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, loading]);

  useEffect(() => {
    if (!loading) return;
    const timer = setInterval(() => setTypingDots(prev => (prev + 1) % 4), 400);
    return () => clearInterval(timer);
  }, [loading]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const handleSend = () => {
    if (!input.trim()) return;
    const text = input.trim();
    setMessages(prev => [...prev, { role: 'user', content: text }]);
    setInput('');
    setLoading(true);
    window.setTimeout(() => {
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content:
            mode === 'brand'
              ? `Demand spike: ${context.demandSpike}. Top 5 dukas right now: ${context.topDukas
                  .map(d => `${d.name} (${d.scans} scans)`)
                  .join(', ')}. Want the live heatmap embed?`
              : mode === 'seller-ai'
              ? `Rank #${context.sellerRank} today. ${context.avgPriceGapText} Top item: ${context.topProductName} at KES ${context.topProductPrice}. Photo shelf → +2⭐ could push you #1.`
              : `Hi ${context.sellerName}. QR + receipts are live. SC Wallet: ${context.sellerBalance} SC. 📸 Send counter sticker photo → +5⭐.`
        }
      ]);
      setLoading(false);
    }, 700);
  };

  if (isMinimized) {
    return (
      <button
        onClick={() => setIsMinimized(false)}
        className="fixed bottom-6 right-6 z-[95] bg-[#0b1d3a] text-white px-4 py-3 rounded-full shadow-2xl text-[10px] font-black"
      >
        {MODE_COPY[mode].title} • Tap to open
      </button>
    );
  }

  return (
    <>
    <div
      className="fixed inset-0 z-[49] bg-black/10"
      onClick={onClose}
    />
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed inset-0 z-50 bg-white flex flex-col sm:inset-auto sm:right-4 sm:bottom-4 sm:w-[420px] sm:h-[640px] sm:rounded-2xl sm:shadow-2xl overflow-hidden"
    >
      <div className="p-4 border-b flex items-center justify-between bg-[#0b1d3a] text-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#1976D2] flex items-center justify-center">
            {mode === 'brand' ? <ShieldCheck className="w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
          </div>
          <div>
            <h3 className="font-bold text-sm">{MODE_COPY[mode].title}</h3>
            <p className="text-[10px] opacity-60">{MODE_COPY[mode].subtitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-bold">
          <div className="px-2 py-1 rounded-full bg-white/10 flex items-center gap-1">
            <Star className="w-3 h-3 text-amber-300" /> {MODE_COPY[mode].badge}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsMinimized(true)}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
            title="Minimize"
          >
            <Minus className="w-5 h-5" />
          </button>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors" title="Close">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="px-4 py-3 bg-[#f4f7fb] border-b border-[#e4edf7] flex gap-2 overflow-x-auto no-scrollbar">
        {QUICK_REPLIES[mode].map((q) => (
          <button
            key={q.label}
            onClick={() => setInput(q.value)}
            className="px-3 py-2 rounded-full bg-white text-[10px] font-black text-[#1976D2] border border-[#d6e6fa] whitespace-nowrap"
          >
            {q.label}
          </button>
        ))}
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#f7faff]">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-3 rounded-2xl ${
              m.role === 'user'
                ? 'bg-[#1976D2] text-white rounded-tr-none'
                : 'bg-white border border-[#d6e6fa] rounded-tl-none text-zinc-800 shadow-sm'
            }`}>
              <span className="text-sm">{m.content}</span>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border border-[#d6e6fa] rounded-2xl rounded-tl-none p-3 shadow-sm flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-[#1976D2]" />
              <span className="text-[10px] font-bold text-zinc-500">Typing{'.'.repeat(typingDots)}</span>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 border-t bg-white">
        <div className="flex gap-2">
          <button className="p-2 bg-[#eaf2ff] text-[#1976D2] rounded-full">
            <Paperclip className="w-4 h-4" />
          </button>
          <button className="p-2 bg-[#eaf2ff] text-[#1976D2] rounded-full">
            <Mic className="w-4 h-4" />
          </button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type a message..."
            className="flex-1 px-4 py-3 bg-[#f1f6ff] rounded-full focus:outline-none focus:ring-2 focus:ring-[#1976D2] text-sm"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="p-3 bg-[#1976D2] text-white rounded-full disabled:opacity-50 transition-opacity"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        <div className="mt-3 flex items-center justify-between text-[10px] text-zinc-400 font-bold">
          <span>Offline-ready • Syncs later</span>
          <span>Swahili Voice Supported</span>
        </div>
      </div>
    </motion.div>
    </>
  );
};
