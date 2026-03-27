import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { Send, Bot, User, X, Sparkles, Loader2, PhoneCall, Paperclip } from 'lucide-react';
import { Product } from '../types';
import { createChatThread, listChatMessages, createChatMessage, escalateChatThread, createSupportTicketAttachment } from '../lib/supportApi';
import { createThread, listMessages, streamThreadMessage } from '../lib/assistantApi';
import { requestUploadPresign } from '../lib/uploadsApi';
import { requestMediaUploadPreview } from '../lib/mediaPreview';

interface Message {
  role: 'user' | 'model';
  content: string;
  metadata?: Record<string, any>;
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
  const [ticketId, setTicketId] = useState<string | null>(null);
  const [assistantThreadId, setAssistantThreadId] = useState<string | null>(null);
  const [assistantMetaByContent, setAssistantMetaByContent] = useState<Record<string, any>>({});
  const [error, setError] = useState<string | null>(null);
  const [isEscalating, setIsEscalating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [attachmentStatus, setAttachmentStatus] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const attachmentAccept = 'image/*,video/*,.pdf,.doc,.docx,.txt,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain';

  const refreshMessages = async (id: string) => {
    const items = await listChatMessages(id);
    setMessages(
      items.map((item) => {
        const normalized = normalizeMessage(item);
        const meta = assistantMetaByContent[normalized.content];
        return meta ? { ...normalized, metadata: meta } : normalized;
      })
    );
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
          seller_id: product.sellerId,
        });
        if (!alive) return;
        const id = thread?.id || thread?.thread_id || thread?.threadId;
        if (id) {
          setThreadId(id);
          await refreshMessages(id);
        }
        try {
          const aiThread = await createThread({ title: `Product Assistant ${product.id}` });
          if (aiThread?.id) {
            setAssistantThreadId(aiThread.id);
          }
        } catch {}
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
      if (assistantThreadId) {
        const aiText = await streamThreadMessage(assistantThreadId, {
          content: userMessage,
          metadata: {
            mode: 'product_assistant',
            product_id: product.id,
            seller_id: product.sellerId
          }
        });
        if (aiText?.trim()) {
          await createChatMessage(threadId, { role: 'assistant', content: aiText.trim() });
          const aiMessages = await listMessages(assistantThreadId);
          const lastAssistant = [...aiMessages].reverse().find((msg) => msg.role === 'assistant');
          if (lastAssistant?.content) {
            setAssistantMetaByContent((prev) => ({
              ...prev,
              [lastAssistant.content]: lastAssistant.metadata || {}
            }));
          }
          await refreshMessages(threadId);
        }
      }
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
      const ticket = await escalateChatThread(threadId);
      const id = ticket?.id || ticket?.ticket_id || ticket?.ticketId || null;
      setTicketId(id);
    } catch (err: any) {
      setError(err?.message || 'Unable to escalate chat.');
    } finally {
      setIsEscalating(false);
    }
  };

  const uploadToPresignedUrl = async (file: File, presign: any) => {
    const uploadUrl = presign?.upload_url || presign?.url;
    if (!uploadUrl) throw new Error('Missing upload URL');
    const method = (presign?.method || 'PUT').toUpperCase();
    const headers: Record<string, string> = { ...(presign?.headers || {}) };
    if (!headers['Content-Type'] && file.type) {
      headers['Content-Type'] = file.type;
    }
    const res = await fetch(uploadUrl, { method, headers, body: file });
    if (!res.ok) {
      throw new Error(`Upload failed (${res.status})`);
    }
    return presign?.s3_key || presign?.key;
  };

  const uploadAttachmentFile = async (file: File) => {
    if (!file || !threadId) return;
    const approvedFile = await requestMediaUploadPreview(file, {
      title: 'Preview product AI attachment',
      description: 'Review the image or video before sending it into the chat.',
      confirmLabel: 'Send attachment'
    });
    setUploading(true);
    setError(null);
    setAttachmentStatus(null);
    try {
      let currentTicketId = ticketId;
      if (!currentTicketId) {
        const ticket = await escalateChatThread(threadId);
        currentTicketId = ticket?.id ?? ticket?.ticket_id ?? ticket?.ticketId ?? null;
        setTicketId(currentTicketId);
      }
      if (!currentTicketId) {
        throw new Error('Unable to create support ticket for attachment.');
      }
      const presign = await requestUploadPresign({
        file_name: approvedFile.name,
        mime_type: approvedFile.type || 'application/octet-stream',
        content_length: approvedFile.size,
        context: 'support'
      });
      const s3Key = await uploadToPresignedUrl(approvedFile, presign);
      await createSupportTicketAttachment(currentTicketId, {
        s3_key: s3Key,
        file_name: approvedFile.name,
        mime_type: approvedFile.type || 'application/octet-stream'
      });
      await createChatMessage(threadId, { role: 'user', content: `Uploaded attachment: ${approvedFile.name}` });
      await refreshMessages(threadId);
      setAttachmentStatus('Attachment uploaded.');
    } catch (err: any) {
      setAttachmentStatus(err?.message || 'Attachment upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const handleAttachmentSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    await uploadAttachmentFile(file);
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
        <div className="p-4 bg-slate-950 text-white flex items-center justify-between border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 rounded-xl border border-emerald-400/20">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-widest">Product AI</p>
              <p className="text-[10px] text-white/60 font-bold">Seller escalation + product intelligence</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleEscalate}
              disabled={isEscalating || !threadId}
              className="p-2 hover:bg-white/10 rounded-full transition-colors text-emerald-300 focus:outline-none focus:ring-2 focus:ring-white/30 disabled:opacity-50"
              title="Escalate to seller"
              aria-label="Escalate to seller"
            >
              <PhoneCall className="w-5 h-5" />
            </button>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-white/30" aria-label="Close product chat">
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
          {messages.map((m, i) => {
            const isUser = m.role === 'user';
            return (
              <div key={i} className={`flex items-start gap-3 ${isUser ? 'justify-end flex-row-reverse' : 'justify-start'}`}>
                <div className={`h-8 w-8 rounded-2xl flex items-center justify-center shrink-0 ${isUser ? 'bg-[#1976D2] text-white' : 'bg-white border border-[#d6e6fa] text-[#1976D2]'}`}>
                  {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>
                <div className="max-w-[82%] space-y-2">
                  <div className={`text-[10px] font-bold ${isUser ? 'text-[#1976D2]' : 'text-zinc-500'}`}>
                    {isUser ? 'You' : 'Product AI'}
                  </div>
                  <div className={`p-3 rounded-2xl text-xs font-medium leading-relaxed shadow-sm ${
                    isUser
                      ? 'bg-[#1976D2] text-white rounded-tr-none'
                      : 'bg-white text-zinc-800 rounded-tl-none border border-[#d6e6fa]'
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
                  </div>
                </div>
              </div>
            );
          })}
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
          {attachmentStatus && (
            <div className={`mb-2 text-[10px] font-bold ${attachmentStatus.includes('uploaded') ? 'text-emerald-600' : 'text-amber-600'}`}>
              {attachmentStatus}
            </div>
          )}
          <div className="relative">
            <input
              ref={fileInputRef}
              type="file"
              accept={attachmentAccept}
              className="hidden"
              onChange={handleAttachmentSelected}
            />
            <input
              type="text"
              className="w-full pl-12 pr-12 py-3 bg-[#f1f6ff] rounded-xl text-xs font-medium text-zinc-900 placeholder:text-zinc-500 caret-[#1976D2] focus:outline-none focus:ring-2 focus:ring-[#1976D2]/40"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask about this product..."
              aria-label="Message input"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading || !threadId}
              className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-[#eaf2ff] text-[#1976D2] rounded-full disabled:opacity-50 transition-colors focus:outline-none focus:ring-2 focus:ring-[#1976D2]/30"
              aria-label="Attach a file"
            >
              <Paperclip className="w-4 h-4" />
            </button>
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading || !threadId}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-zinc-900 text-white rounded-full disabled:opacity-50 transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-400"
              aria-label="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          <p className="mt-2 text-[10px] font-bold text-zinc-400">
            Attach images, video, or documents.
          </p>
        </div>
      </motion.div>
    </>
  );
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
