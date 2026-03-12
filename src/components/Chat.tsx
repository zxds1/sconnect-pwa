import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { Send, X, Bot, Loader2, PhoneCall, Paperclip, Mic, Star, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { GoogleGenAI } from '@google/genai';
import { Product, Message } from '../types';

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

export const Chat: React.FC<ChatProps> = ({ product, onClose, onEscalate }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [typingDots, setTypingDots] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (product && messages.length === 0) {
      setMessages([
        {
          role: 'system',
          content: `You are an AI sales assistant for Sconnect. You are helping a customer with the product: ${product.name}. 
          Description: ${product.description}. Price: $${product.price}. 
          Be helpful, engaging, and try to close the sale. If the user asks for a human or has complex issues, suggest "Seller Escalation".`
        },
        {
          role: 'model',
          content: `Hi! I'm your SokoConnect AI assistant. I can help with product questions, QR issues, pricing, or rewards. What do you need?`
        }
      ]);
    }
  }, [product]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (!loading) return;
    const timer = setInterval(() => {
      setTypingDots(prev => (prev + 1) % 4);
    }, 400);
    return () => clearInterval(timer);
  }, [loading]);

  const handleSend = async () => {
    if (!input.trim() || !product) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: (process.env as any).GEMINI_API_KEY });
      const model = ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: messages.concat(userMessage).map(m => ({
          role: m.role === 'model' ? 'model' : 'user',
          parts: [{ text: m.content }]
        })),
        config: {
          systemInstruction: messages[0].content
        }
      });

      const response = await model;
      const modelMessage: Message = { role: 'model', content: response.text || "I'm sorry, I couldn't process that." };
      setMessages(prev => [...prev, modelMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, { role: 'model', content: "Sorry, I'm having trouble connecting right now." }]);
    } finally {
      setLoading(false);
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
      {/* Header */}
      <div className="p-4 border-b flex items-center justify-between bg-[#0b1d3a] text-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#1976D2] flex items-center justify-center">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm">SokoConnect Support</h3>
            <p className="text-[10px] opacity-60">Duka Support • AI + Human</p>
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
            onClick={onEscalate}
            className="p-2 hover:bg-white/10 rounded-full transition-colors text-emerald-400"
            title="Escalate to Seller"
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

      {/* Quick Replies */}
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

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#f7faff]">
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
              <span className="text-[10px] font-bold text-zinc-500">Support typing{'.'.repeat(typingDots)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
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
