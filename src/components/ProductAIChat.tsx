import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { Send, Bot, User, X, Sparkles, Loader2, Paperclip, Mic } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { Product } from '../types';

interface Message {
  role: 'user' | 'model';
  content: string;
}

interface ProductAIChatProps {
  product: Product;
  onClose: () => void;
}

export const ProductAIChat: React.FC<ProductAIChatProps> = ({ product, onClose }) => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', content: `Hi! I'm your AI shopping assistant for the **${product.name}**. How can I help you today? I can tell you about its features, compare it with others, or help you with your purchase!` }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const model = "gemini-3-flash-preview";
      
      const systemInstruction = `You are an expert shopping assistant for a marketplace. 
      You are currently helping a user with the product: ${product.name}.
      Product Details:
      - Description: ${product.description}
      - Price: $${product.price}
      - Category: ${product.category}
      - Stock Level: ${product.stockLevel}
      - Tags: ${product.tags.join(', ')}
      
      Your goal is to:
      1. Answer specific questions about this product.
      2. Provide recommendations based on its features.
      3. Facilitate the sale by highlighting its value.
      4. Be helpful, professional, and concise.
      5. If asked about other products, you can mention that the user can find more in the search view.
      
      Keep responses under 3 sentences unless a detailed explanation is needed.`;

      const chatHistory = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.content }]
      }));

      const response = await ai.models.generateContent({
        model,
        contents: [
          ...chatHistory,
          { role: 'user', parts: [{ text: userMessage }] }
        ],
        config: {
          systemInstruction,
          temperature: 0.7,
        }
      });

      const aiResponse = response.text || "I'm sorry, I couldn't process that. How else can I help?";
      setMessages(prev => [...prev, { role: 'model', content: aiResponse }]);
    } catch (error) {
      console.error("AI Error:", error);
      setMessages(prev => [...prev, { role: 'model', content: "I'm having a bit of trouble connecting right now. Please try again in a moment!" }]);
    } finally {
      setIsLoading(false);
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
      className="fixed z-[70] bottom-4 right-4 flex flex-col h-[500px] w-[min(420px,90vw)] bg-white rounded-3xl shadow-2xl border border-zinc-100 overflow-hidden"
    >
      {/* Header */}
      <div className="p-4 bg-[#0b1d3a] text-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#1976D2] rounded-xl">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-widest">AI Assistant</p>
            <p className="text-[10px] text-zinc-400 font-bold">Powered by Gemini</p>
          </div>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-full transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar bg-[#f7faff]"
      >
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex gap-2 max-w-[85%] ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${m.role === 'user' ? 'bg-[#0b1d3a]' : 'bg-[#1976D2]'} ${m.role === 'model' && isLoading && i === messages.length - 1 ? 'animate-pulse' : ''}`}>
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
            <div className="flex gap-2 items-start">
              <div className="w-8 h-8 rounded-full bg-[#1976D2] flex items-center justify-center shrink-0 animate-pulse">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="flex gap-2 items-center bg-white p-3 rounded-2xl border border-[#d6e6fa] shadow-sm rounded-tl-none">
                <Loader2 className="w-3 h-3 text-[#1976D2] animate-spin" />
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">AI is thinking...</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-4 bg-white border-t">
        <div className="relative">
          <div className="absolute left-2 top-1/2 -translate-y-1/2 flex gap-1">
            <button className="p-2 bg-[#eaf2ff] text-[#1976D2] rounded-full">
              <Paperclip className="w-3.5 h-3.5" />
            </button>
            <button className="p-2 bg-[#eaf2ff] text-[#1976D2] rounded-full">
              <Mic className="w-3.5 h-3.5" />
            </button>
          </div>
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask about this product..."
            className="w-full pl-20 pr-12 py-3 bg-[#f1f6ff] rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#1976D2]"
          />
          <button 
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
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
