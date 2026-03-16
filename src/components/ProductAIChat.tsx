import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { Send, Bot, User, X, Sparkles, Loader2, PhoneCall } from 'lucide-react';
import { Product } from '../types';
import { createChatThread, listChatMessages, createChatMessage, escalateChatThread } from '../lib/supportApi';

interface Message {
  role: 'user' | 'model';
  content: string;
}

interface ProductAIChatProps {
  product: Product;
  onClose: () => void;
}

const normalizeMessage = (message: any): Message => {
  const role = message.role || message.sender || (message.from === 'user' ? 'user' : 'model');
  return {
    role: role === 'user' ? 'user' : 'model',
    content: message.content || message.body || message.text || '',
  };
};

export const ProductAIChat: React.FC<ProductAIChatProps> = ({ product, onClose }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isEscalating, setIsEscalating] = useState(false);
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
    let alive = true;
    const init = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const thread = await createChatThread({
          topic: `product:${product.id}`,
        });
        if (!alive) return;
        const id = thread?.id || thread?.thread_id || thread?.threadId;
        if (id) {
          setThreadId(id);
          await refreshMessages(id);
        }
      } catch (err: any) {
        if (!alive) return;
        setError(err?.message || 'Unable to start chat.');
      } finally {
        if (alive) setIsLoading(false);
      }
    };
    init();
    return () => {
      alive = false;
    };
  }, [product.id, product.sellerId]);

  const handleSend = async () => {
    if (!input.trim() || isLoading || !threadId) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      await createChatMessage(threadId, { content: userMessage, role: 'user' });
      await refreshMessages(threadId);
    } catch (error) {
      setError('Unable to send message.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEscalate = async () => {
    if (!threadId) return;
    setIsEscalating(true);
    try {
      await escalateChatThread(threadId);
    } catch (err: any) {
      setError(err?.message || 'Unable to escalate chat.');
    } finally {
      setIsEscalating(false);
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 z-[69] bg-black/20"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="fixed inset-0 z-[70] flex flex-col bg-white rounded-none sm:inset-auto sm:bottom-4 sm:right-4 sm:h-[500px] sm:w-[min(420px,90vw)] sm:rounded-3xl shadow-2xl border border-zinc-100 overflow-hidden"
      >
        <div className="p-4 bg-[#0b1d3a] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#1976D2] rounded-xl">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-widest">AI Assistant</p>
              <p className="text-[10px] text-zinc-400 font-bold">Live support + automation</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleEscalate}
              disabled={isEscalating || !threadId}
              className="p-2 hover:bg-zinc-800 rounded-full transition-colors text-emerald-300"
              title="Escalate to seller"
            >
              <PhoneCall className="w-5 h-5" />
            </button>
            <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-full transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar bg-[#f7faff]"
        >
          {error && (
            <div className="bg-red-50 border border-red-100 text-red-700 text-[10px] font-bold rounded-2xl px-3 py-2">
              {error}
            </div>
          )}
          {messages.length === 0 && !isLoading && (
            <div className="text-[10px] text-zinc-400 font-bold">Start the conversation about this product.</div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex gap-2 max-w-[85%] ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${m.role === 'user' ? 'bg-[#0b1d3a]' : 'bg-[#1976D2]'}`}>
                  {m.role === 'user' ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-white" />}
                </div>
                <div className={`p-3 rounded-2xl text-xs font-medium leading-relaxed shadow-sm ${
                  m.role === 'user'
                    ? 'bg-[#1976D2] text-white rounded-tr-none'
                    : 'bg-white text-zinc-800 rounded-tl-none border border-[#d6e6fa]'
                }`}>
                  {m.content}
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="flex gap-2 items-center bg-white p-3 rounded-2xl border border-[#d6e6fa] shadow-sm rounded-tl-none">
                <Loader2 className="w-3 h-3 text-[#1976D2] animate-spin" />
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Sending...</span>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 bg-white border-t">
          <div className="relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask about this product..."
              className="w-full pl-4 pr-12 py-3 bg-[#f1f6ff] rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#1976D2]"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading || !threadId}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-zinc-900 text-white rounded-lg disabled:opacity-50 transition-opacity"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </>
  );
};
