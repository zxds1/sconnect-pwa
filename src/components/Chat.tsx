import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { Send, X, Loader2, PhoneCall, Star, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Product, Message } from '../types';
import { createChatThread, listChatMessages, createChatMessage, escalateChatThread } from '../lib/supportApi';

interface ChatProps {
  product: Product | null;
  onClose: () => void;
  onEscalate: () => void;
}

type QuickReply = {
  label: string;
  value: string;
};

const QUICK_REPLIES: QuickReply[] = [
  { label: 'QR Setup', value: 'QR not scanning. Help me fix it.' },
  { label: 'Photo Stock', value: 'I sent a shelf photo. How many units did you count?' },
  { label: 'Rank Help', value: 'Why am I #3 rank today?' },
  { label: 'Billing', value: 'How do I redeem SC rewards?' }
];

const normalizeMessage = (message: any): Message => {
  const role = message.role || message.sender || (message.from === 'user' ? 'user' : 'model');
  return {
    role: role === 'user' ? 'user' : 'model',
    content: message.content || message.body || message.text || '',
  };
};

export const Chat: React.FC<ChatProps> = ({ product, onClose, onEscalate }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const refreshMessages = async (id: string) => {
    const items = await listChatMessages(id);
    setMessages(items.map(normalizeMessage));
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (!product) return;
    let alive = true;
    const init = async () => {
      setLoading(true);
      setError(null);
      try {
        const thread = await createChatThread({
          topic: `support:${product.id}`,
          seller_id: product.sellerId,
        });
        if (!alive) return;
        const id = thread?.id || thread?.thread_id || thread?.threadId;
        if (id) {
          setThreadId(id);
          await refreshMessages(id);
        }
      } catch (err: any) {
        if (!alive) return;
        setError(err?.message || 'Unable to start support chat.');
      } finally {
        if (alive) setLoading(false);
      }
    };
    init();
    return () => {
      alive = false;
    };
  }, [product?.id, product?.sellerId]);

  const handleSend = async () => {
    if (!input.trim() || !product || !threadId) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      await createChatMessage(threadId, { content: userMessage.content, role: 'user' });
      await refreshMessages(threadId);
    } catch (error) {
      setError('Sorry, I could not send that message.');
    } finally {
      setLoading(false);
    }
  };

  const handleEscalate = async () => {
    if (!threadId) return;
    try {
      await escalateChatThread(threadId);
      onEscalate();
    } catch (err: any) {
      setError(err?.message || 'Unable to escalate chat.');
    }
  };

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
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm">SokoConnect Support</h3>
              <p className="text-[10px] opacity-60">Product chat • AI + seller escalation</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-bold">
            <div className="px-2 py-1 rounded-full bg-white/10 flex items-center gap-1">
              <Star className="w-3 h-3 text-amber-300" /> +5⭐
            </div>
            <div className="px-2 py-1 rounded-full bg-white/10">Data Blue</div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleEscalate}
              className="p-2 hover:bg-white/10 rounded-full transition-colors text-emerald-400"
              title="Escalate to seller"
            >
              <PhoneCall className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="px-4 py-3 bg-[#f4f7fb] border-b border-[#e4edf7] flex gap-2 overflow-x-auto no-scrollbar">
          {QUICK_REPLIES.map((q) => (
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
          {error && (
            <div className="bg-red-50 border border-red-100 text-red-700 text-[10px] font-bold rounded-2xl px-3 py-2">
              {error}
            </div>
          )}
          {messages.filter(m => m.role !== 'system').map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] p-3 rounded-2xl ${
                m.role === 'user'
                  ? 'bg-[#1976D2] text-white rounded-tr-none'
                  : 'bg-white border border-[#d6e6fa] rounded-tl-none text-zinc-800 shadow-sm'
              }`}>
                <div className="prose prose-sm max-w-none">
                  <ReactMarkdown>{m.content}</ReactMarkdown>
                </div>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-white border border-[#d6e6fa] rounded-2xl rounded-tl-none p-3 shadow-sm flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-[#1976D2]" />
                <span className="text-[10px] font-bold text-zinc-500">Support typing...</span>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t bg-white">
          <div className="flex gap-2">
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
              disabled={!input.trim() || loading || !threadId}
              className="p-3 bg-zinc-900 text-white rounded-full disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </>
  );
};
