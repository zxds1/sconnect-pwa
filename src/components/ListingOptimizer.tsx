import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { Sparkles, Send, Bot, User, X, Loader2, ImageIcon, Video, Check, RefreshCw } from 'lucide-react';
import { createThread, streamThreadMessage } from '../lib/assistantApi';
import { applyListingSession, createListingSession, sendListingMessage } from '../lib/listingAssistantApi';

interface Message {
  role: 'user' | 'model';
  content: string;
  suggestion?: {
    title: string;
    description: string;
    price: number;
    category: string;
  };
  media?: { type: 'image' | 'video'; url: string }[];
}

interface ListingOptimizerProps {
  initialData: {
    name: string;
    description: string;
    price: string;
    category: string;
  };
  onApply: (data: { name: string; description: string; price: string; category: string }) => void;
  onClose: () => void;
}

export const ListingOptimizer: React.FC<ListingOptimizerProps> = ({ initialData, onApply, onClose }) => {
  const [messages, setMessages] = useState<Message[]>([
    { 
      role: 'model', 
      content: "Hi! I'm your AI Listing Expert. I can help you optimize your product for better visibility and sales. What would you like to improve about your listing? You can also share photos or videos of the product for better context!" 
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentSuggestion, setCurrentSuggestion] = useState<Message['suggestion'] | null>(null);
  const [listingSessionId, setListingSessionId] = useState<string | null>(null);
  const [assistantThreadId, setAssistantThreadId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const aliveRef = useRef(true);

  useEffect(() => {
    aliveRef.current = true;
    const bootstrap = async () => {
      try {
        const [session, thread] = await Promise.all([
          createListingSession(),
          createThread({ title: 'Listing Optimizer' })
        ]);
        if (!aliveRef.current) return;
        if (session?.session_id) setListingSessionId(session.session_id);
        if (thread?.id) setAssistantThreadId(thread.id);
      } catch {
        // If assistant services are unavailable, keep UI functional.
      }
    };
    bootstrap();
    return () => {
      aliveRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const parseSuggestion = (payload: string) => {
    const trimmed = payload.trim();
    const jsonMatch = trimmed.match(/```json\\n([\\s\\S]*?)```/i);
    const candidate = jsonMatch ? jsonMatch[1] : trimmed;
    if (!candidate.startsWith('{')) return null;
    try {
      const data = JSON.parse(candidate);
      if (data?.suggestion) return data.suggestion as Message['suggestion'];
      if (data?.title && data?.description && data?.price && data?.category) {
        return {
          title: data.title,
          description: data.description,
          price: Number(data.price),
          category: data.category
        };
      }
    } catch {}
    return null;
  };

  const handleSend = async (text?: string, media?: Message['media']) => {
    const userMessage = text || input.trim();
    if (!userMessage && !media) return;

    if (!text) setInput('');
    
    const newMessage: Message = { role: 'user', content: userMessage, media };
    setMessages(prev => [...prev, newMessage]);
    setIsLoading(true);

    try {
      let sessionId = listingSessionId;
      if (!sessionId) {
        const session = await createListingSession();
        sessionId = session?.session_id || null;
        if (sessionId) setListingSessionId(sessionId);
      }
      if (sessionId) {
        await sendListingMessage({ session_id: sessionId, role: 'user', content: userMessage });
      }
      let assistantReply = '';
      if (assistantThreadId) {
        assistantReply = await streamThreadMessage(assistantThreadId, {
          content: userMessage,
          metadata: {
            mode: 'listing_optimizer',
            product: initialData
          }
        });
      }
      const suggestion = assistantReply ? parseSuggestion(assistantReply) : null;
      setMessages(prev => [...prev, { 
        role: 'model', 
        content: assistantReply || 'Message sent. Assistant response pending.',
        suggestion: suggestion || undefined
      }]);
      if (suggestion) {
        setCurrentSuggestion(suggestion);
      }
    } catch (error) {
      console.error("AI Error:", error);
      setMessages(prev => [...prev, { role: 'model', content: "I'm having a bit of trouble right now. Let's try again!" }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = async () => {
    if (currentSuggestion) {
      onApply({
        name: currentSuggestion.title,
        description: currentSuggestion.description,
        price: currentSuggestion.price.toString(),
        category: currentSuggestion.category
      });
      if (listingSessionId) {
        try {
          await applyListingSession({ session_id: listingSessionId });
        } catch {}
      }
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="flex flex-col h-[70vh] sm:h-[600px] bg-white rounded-none sm:rounded-3xl shadow-2xl border border-zinc-100 overflow-hidden"
    >
      {/* Header */}
      <div className="p-4 bg-zinc-900 text-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500 rounded-xl">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-widest">Listing Optimizer</p>
            <p className="text-[10px] text-zinc-400 font-bold">AI Business Partner</p>
          </div>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-full transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar bg-zinc-50"
      >
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex flex-col gap-2 max-w-[85%] ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
              <div className={`flex gap-2 ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${m.role === 'user' ? 'bg-zinc-900' : 'bg-indigo-600'}`}>
                  {m.role === 'user' ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-white" />}
                </div>
                <div className={`p-3 rounded-2xl text-xs font-medium leading-relaxed shadow-sm ${
                  m.role === 'user' 
                    ? 'bg-zinc-900 text-white rounded-tr-none' 
                    : 'bg-white text-zinc-800 rounded-tl-none border border-zinc-100'
                }`}>
                  {m.content}
                  
                  {m.media && (
                    <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
                      {m.media.map((med, idx) => (
                        <div key={idx} className="w-20 h-20 rounded-lg overflow-hidden shrink-0 border border-zinc-200">
                          {med.type === 'image' ? (
                            <img src={med.url} className="w-full h-full object-cover" alt="upload" />
                          ) : (
                            <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
                              <Video className="w-6 h-6 text-white" />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {m.suggestion && (
                <div className="ml-10 p-4 bg-indigo-50 border border-indigo-100 rounded-2xl space-y-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Check className="w-4 h-4 text-indigo-600" />
                    <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">New Suggestion</span>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-zinc-400 uppercase">Title</p>
                    <p className="text-xs font-bold text-zinc-900">{m.suggestion.title}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-zinc-400 uppercase">Price</p>
                    <p className="text-xs font-bold text-zinc-900">${m.suggestion.price}</p>
                  </div>
                  <button 
                    onClick={handleApply}
                    className="w-full py-2 bg-indigo-600 text-white rounded-lg text-[10px] font-bold shadow-lg shadow-indigo-600/20"
                  >
                    Apply Optimization
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="flex gap-2 items-start">
              <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center shrink-0 animate-pulse">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="flex gap-2 items-center bg-white p-3 rounded-2xl border border-zinc-100 shadow-sm rounded-tl-none">
                <Loader2 className="w-3 h-3 text-indigo-600 animate-spin" />
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">AI is thinking...</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-4 bg-white border-t">
        <div className="flex gap-2 mb-3">
          <button className="p-2 bg-zinc-100 rounded-lg text-zinc-500 hover:bg-zinc-200 transition-colors">
            <ImageIcon className="w-4 h-4" />
          </button>
          <button className="p-2 bg-zinc-100 rounded-lg text-zinc-500 hover:bg-zinc-200 transition-colors">
            <Video className="w-4 h-4" />
          </button>
          <div className="flex-1" />
          <button 
            onClick={() => handleSend("Optimize my current listing details")}
            className="px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-bold flex items-center gap-1.5"
          >
            <RefreshCw className="w-3 h-3" /> Auto-Optimize
          </button>
        </div>
        <div className="relative">
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Describe your product or ask for tips..."
            className="w-full pl-4 pr-12 py-3 bg-zinc-100 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button 
            onClick={() => handleSend()}
            disabled={!input.trim() || isLoading}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-zinc-900 text-white rounded-lg disabled:opacity-50 transition-opacity"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};
