import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { Sparkles, Send, Bot, User, X, Loader2, ImageIcon, Video, Check, RefreshCw } from 'lucide-react';
import { createThread, listMessages, streamThreadMessage } from '../lib/assistantApi';
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
  metadata?: Record<string, any>;
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

  const agentStatusLabels: Record<string, string> = {
    orchestrator: 'Orchestrator: Coordinating…',
    discovery: 'Discovery: Comparing offers…',
    negotiation: 'Negotiation: Checking deals…',
    purchase: 'Purchase: Optimizing checkout…',
    insight: 'Insight: Pulling market signals…',
    routing: 'Routing: Comparing routes…'
  };

  const extractUrls = (text?: string) => {
    if (!text) return [];
    const matches = text.match(/https?:\/\/[^\s]+/g) || [];
    return matches.map((url) => url.replace(/[),.]+$/, ''));
  };

  const guessMediaType = (url: string): 'image' | 'video' | 'audio' | 'file' => {
    const lower = url.toLowerCase();
    if (lower.match(/\.(png|jpe?g|gif|webp|bmp|svg)$/)) return 'image';
    if (lower.match(/\.(mp4|webm|mov|m4v|avi)$/)) return 'video';
    if (lower.match(/\.(mp3|wav|m4a|aac|ogg)$/)) return 'audio';
    return 'file';
  };

  const mediaFromMetadata = (metadata?: Record<string, any>) => {
    const media: Array<{ url: string; type: 'image' | 'video' | 'audio' | 'file' }> = [];
    const candidates = [
      metadata?.media_url,
      metadata?.file_url,
      metadata?.image_url,
      metadata?.video_url,
      metadata?.audio_url
    ].filter(Boolean) as string[];
    for (const url of candidates) {
      media.push({ url, type: guessMediaType(url) });
    }
    return media;
  };

  const renderMedia = (metadata?: Record<string, any>, content?: string) => {
    const media = mediaFromMetadata(metadata);
    const contentUrls = extractUrls(content);
    for (const url of contentUrls) {
      media.push({ url, type: guessMediaType(url) });
    }
    const deduped = media.filter(
      (item, idx) => media.findIndex((m) => m.url === item.url) === idx
    );
    if (!deduped.length) return null;
    return (
      <div className="mt-2 grid grid-cols-1 gap-2">
        {deduped.map((item, idx) => {
          if (item.type === 'image') {
            return (
              <img
                key={`${item.url}-${idx}`}
                src={item.url}
                alt="assistant response"
                className="rounded-2xl border border-zinc-200 max-h-56 object-cover"
                loading="lazy"
              />
            );
          }
          if (item.type === 'video') {
            return (
              <video
                key={`${item.url}-${idx}`}
                src={item.url}
                controls
                className="rounded-2xl border border-zinc-200 max-h-56 w-full"
              />
            );
          }
          if (item.type === 'audio') {
            return (
              <audio key={`${item.url}-${idx}`} src={item.url} controls className="w-full" />
            );
          }
          return (
            <a
              key={`${item.url}-${idx}`}
              href={item.url}
              target="_blank"
              rel="noreferrer"
              className="text-[11px] text-indigo-600 underline"
            >
              Open attachment
            </a>
          );
        })}
      </div>
    );
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
      let assistantMeta: Record<string, any> | undefined;
      if (assistantThreadId) {
        assistantReply = await streamThreadMessage(assistantThreadId, {
          content: userMessage,
          metadata: {
            mode: 'listing_optimizer',
            product: initialData
          }
        });
        const aiMessages = await listMessages(assistantThreadId);
        const lastAssistant = [...aiMessages].reverse().find((msg) => msg.role === 'assistant');
        if (lastAssistant?.metadata) {
          assistantMeta = lastAssistant.metadata;
        }
      }
      const suggestion = assistantReply ? parseSuggestion(assistantReply) : null;
      setMessages(prev => [...prev, { 
        role: 'model', 
        content: assistantReply || 'Message sent. Assistant response pending.',
        suggestion: suggestion || undefined,
        metadata: assistantMeta
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
      <div className="p-4 bg-slate-950 text-white flex items-center justify-between border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500/20 rounded-xl border border-emerald-400/20">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-widest">Listing Optimizer</p>
            <p className="text-[10px] text-white/60 font-bold">AI business partner</p>
          </div>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar bg-zinc-50"
      >
        {messages.map((m, i) => {
          const isUser = m.role === 'user';
          return (
            <div key={i} className={`flex items-start gap-3 ${isUser ? 'justify-end flex-row-reverse' : 'justify-start'}`}>
              <div className={`h-8 w-8 rounded-2xl flex items-center justify-center shrink-0 ${isUser ? 'bg-zinc-900 text-white' : 'bg-white border border-zinc-200 text-indigo-600'}`}>
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>
              <div className="max-w-[82%] space-y-2">
                <div className={`text-[10px] font-bold ${isUser ? 'text-zinc-700' : 'text-zinc-500'}`}>
                  {isUser ? 'You' : 'Listing AI'}
                </div>
                <div className={`p-3 rounded-2xl text-xs font-medium leading-relaxed shadow-sm ${
                  isUser 
                    ? 'bg-zinc-900 text-white rounded-tr-none' 
                    : 'bg-white text-zinc-800 rounded-tl-none border border-zinc-100'
                }`}>
                  {m.content}
                  {m.role === 'model' && renderMedia(m.metadata, m.content)}
                  {m.role === 'model' && Array.isArray(m.metadata?.agent_status) && m.metadata.agent_status.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {m.metadata.agent_status.map((status: string, idx: number) => {
                        const key = String(status || '').toLowerCase();
                        const label = agentStatusLabels[key] || status;
                        return (
                          <span
                            key={`${i}-agent-${idx}`}
                            className="px-2 py-1 rounded-full text-[9px] font-semibold tracking-[0.12em] bg-indigo-50 text-indigo-600"
                          >
                            {label}
                          </span>
                        );
                      })}
                    </div>
                  )}
                  {m.role === 'model' && Array.isArray(m.metadata?.references) && m.metadata.references.length > 0 && (
                    <div className="mt-2 space-y-2">
                      <div className="flex flex-wrap gap-2">
                        {m.metadata.references.map((ref: any, idx: number) => (
                          <span
                            key={`${i}-ref-${idx}`}
                            className="px-2 py-1 rounded-full text-[9px] font-semibold tracking-[0.12em] bg-emerald-50 text-emerald-700"
                          >
                            {ref.label}{ref.detail ? ` · ${ref.detail}` : ''}
                          </span>
                        ))}
                      </div>
                      <div className="space-y-1">
                        {m.metadata.references.map((ref: any, idx: number) => {
                          const items = ref?.data?.items;
                          if (!Array.isArray(items) || items.length === 0) return null;
                          return (
                            <div key={`${i}-ref-items-${idx}`} className="text-[10px] text-zinc-500 space-y-1">
                              {items.slice(0, 3).map((item: any, itemIdx: number) => (
                                <div key={`${i}-ref-item-${idx}-${itemIdx}`} className="flex flex-wrap gap-2">
                                  {Object.entries(item).map(([key, value]) => (
                                    <span key={key} className="px-2 py-1 rounded-full bg-zinc-50">
                                      {key}: {String(value ?? '')}
                                    </span>
                                  ))}
                                </div>
                              ))}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

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

                {m.suggestion && (
                  <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl space-y-3">
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
          );
        })}
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
            className="w-full pl-4 pr-12 py-3 bg-zinc-100 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
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
