import React, { useEffect, useRef, useState } from 'react';
import { Sparkles, Send, Search, ShoppingBag, ArrowRightLeft, User, Trophy, MessageCircle, Plug, Mic, Camera, Video, Star, Plus, BadgeCheck, TrendingUp, ChevronRight } from 'lucide-react';
import { Product } from '../types';
import { SELLERS } from '../mockData';
import {
  createAttachment,
  createMemory,
  createMessage,
  createThread,
  createUpload,
  deleteMemory,
  deleteThread,
  executeTool,
  getAssistantMetrics,
  getOCRStatus,
  listAttachments,
  listMemory,
  listMessages,
  listSuggestions,
  listThreads,
  listToolHistory,
  postAssistantEvent,
  postModeration,
  postReport,
  runOCR,
  runVisionSearch,
  streamThreadMessage,
  transcribeAudio,
  updateMemory,
  updateThread,
  AssistantMemory,
  AssistantToolHistory,
  AssistantAttachment
} from '../lib/assistantApi';

type AssistantAction = {
  label: string;
  onClick: () => void;
};

type AssistantMessage = {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
  metadata?: Record<string, any>;
  actions?: AssistantAction[];
};

type AssistantChat = {
  id: string;
  title: string;
  messages: AssistantMessage[];
  updatedAt: number;
  pinned?: boolean;
};

interface AssistantProps {
  products: Product[];
  onOpenSearch: (query: string) => void;
  onOpenSearchAction: (query: string, action: 'voice' | 'photo' | 'video' | 'hybrid') => void;
  onOpenProduct: (product: Product) => void;
  onAddToBag: (product: Product) => void;
  onAddToComparison: (product: Product) => void;
  onOpenSeller: (sellerId: string) => void;
  onOpenRewards: () => void;
  onOpenProfile: () => void;
  onOpenSellerStudio: () => void;
  onOpenRFQ: () => void;
  onToast: (msg: string) => void;
  onOpenOnboarding: () => void;
  onOpenBag: () => void;
  onOpenQrScan: () => void;
  onOpenSubscriptions: () => void;
  onOpenPartnerships: () => void;
  onOpenWhatsApp: () => void;
  onOpenFeed: () => void;
}

export const Assistant: React.FC<AssistantProps> = ({
  products,
  onOpenSearch,
  onOpenSearchAction,
  onOpenProduct,
  onAddToBag,
  onAddToComparison,
  onOpenSeller,
  onOpenRewards,
  onOpenProfile,
  onOpenSellerStudio,
  onOpenRFQ,
  onOpenOnboarding,
  onOpenBag,
  onOpenQrScan,
  onOpenSubscriptions,
  onOpenPartnerships,
  onOpenWhatsApp,
  onOpenFeed
}) => {
  const [chats, setChats] = useState<AssistantChat[]>([]);
  const [activeChatId, setActiveChatId] = useState('');
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [showMediaTray, setShowMediaTray] = useState(false);
  const [showOpsPanel, setShowOpsPanel] = useState(false);
  const [attachments, setAttachments] = useState<AssistantAttachment[]>([]);
  const [memoryItems, setMemoryItems] = useState<AssistantMemory[]>([]);
  const [toolHistory, setToolHistory] = useState<AssistantToolHistory[]>([]);
  const [metricsPayload, setMetricsPayload] = useState<string>('');
  const [opsStatus, setOpsStatus] = useState<string | null>(null);
  const [uploadForm, setUploadForm] = useState({ file_url: '', mime_type: '', expires_at: '' });
  const [attachmentForm, setAttachmentForm] = useState({ message_id: '', file_url: '', mime_type: '', type: 'image', expires_at: '' });
  const [asrForm, setAsrForm] = useState({ audio_url: '', job_id: '' });
  const [ocrForm, setOcrForm] = useState({ image_url: '', job_id: '' });
  const [visionForm, setVisionForm] = useState({ image_url: '', query: '' });
  const [toolForm, setToolForm] = useState({ tool: '', params: '{}' });
  const [memoryForm, setMemoryForm] = useState({ key: '', value: '', source: 'manual', confidence: '0.8', consent_given: true });
  const [memoryUpdateForm, setMemoryUpdateForm] = useState({ id: '', value: '', consent_given: true });
  const [moderationText, setModerationText] = useState('');
  const [reportText, setReportText] = useState('');
  const [eventPayload, setEventPayload] = useState('{"event":"assistant_action"}');
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    try {
      const raw = localStorage.getItem('soko:assistant_sidebar');
      if (raw) return raw === 'open';
    } catch {}
    return true;
  });
  const endRef = useRef<HTMLDivElement | null>(null);

  const activeChat = chats.find(c => c.id === activeChatId) || chats[0];
  const activeMessages = activeChat?.messages || [];
  const lastMessage = activeMessages[activeMessages.length - 1];
  const showIntroCards = !activeMessages.some(m => m.role === 'user');
  const progressStars = 2;
  const totalStars = 50;
  const progressPct = Math.round((progressStars / totalStars) * 100);
  const quickActions = [
    { label: 'Feed', icon: Sparkles, onClick: onOpenFeed },
    { label: 'Search', icon: Search, onClick: () => setInput('/search ') },
    { label: 'Compare', icon: ArrowRightLeft, onClick: () => setInput('/compare ') },
    { label: 'Photo', icon: Camera, onClick: () => onOpenSearchAction('photo search', 'photo') },
    { label: 'Voice', icon: Mic, onClick: () => onOpenSearchAction('voice search', 'voice') },
    { label: 'Bag', icon: ShoppingBag, onClick: () => onOpenBag() },
    { label: 'RFQ', icon: Plug, onClick: () => onOpenRFQ() },
    { label: 'Rewards', icon: Trophy, onClick: () => onOpenRewards() }
  ];
  const moreActions = [
    { label: 'Subscriptions', icon: BadgeCheck, onClick: () => onOpenSubscriptions() },
    { label: 'Partnerships', icon: Plug, onClick: () => onOpenPartnerships() },
    { label: 'WhatsApp', icon: MessageCircle, onClick: () => onOpenWhatsApp() },
    { label: 'Seller Studio', icon: Sparkles, onClick: () => onOpenSellerStudio() },
    { label: 'Scan QR', icon: Camera, onClick: () => onOpenQrScan() }
  ];
  const [suggestionChips, setSuggestionChips] = useState<Array<{ label: string; value: string }>>([]);

  const mapThreadToChat = (thread: any): AssistantChat => ({
    id: thread.id,
    title: thread.title || 'New chat',
    messages: [],
    updatedAt: thread.updated_at ? new Date(thread.updated_at).getTime() : Date.now(),
    pinned: !!thread.pinned
  });

  const toAssistantMessages = (items: any[]): AssistantMessage[] =>
    (items || []).map((msg) => ({
      id: msg.id,
      role: msg.role === 'assistant' ? 'assistant' : 'user',
      content: msg.content || '',
      metadata: msg.metadata || {}
    }));

  const syncMessages = async (threadId: string) => {
    try {
      const items = await listMessages(threadId);
      setChats((prev) => prev.map((chat) => (
        chat.id === threadId
          ? { ...chat, messages: toAssistantMessages(items), updatedAt: Date.now() }
          : chat
      )));
    } catch {}
  };

  const sendStreamMessage = async (threadId: string, content: string) => {
    try {
      await streamThreadMessage(threadId, { content });
      await syncMessages(threadId);
      return true;
    } catch {
      return false;
    }
  };

  const sendUserMessage = async (threadId: string, content: string) => {
    try {
      await createMessage(threadId, { role: 'user', content });
      await syncMessages(threadId);
      return true;
    } catch {
      return false;
    }
  };

  const refreshOps = async () => {
    if (!activeChatId) return;
    const [mem, history, att] = await Promise.all([
      listMemory(),
      listToolHistory(),
      listAttachments(activeChatId)
    ]);
    setMemoryItems(mem);
    setToolHistory(history);
    setAttachments(att);
  };

  const handleUpload = async () => {
    setOpsStatus(null);
    try {
      const resp = await createUpload({
        file_url: uploadForm.file_url,
        mime_type: uploadForm.mime_type,
        expires_at: uploadForm.expires_at || undefined
      });
      setOpsStatus(`Upload created: ${resp.upload_id}`);
    } catch (err: any) {
      setOpsStatus(err?.message || 'Upload failed.');
    }
  };

  const handleCreateAttachment = async () => {
    if (!activeChatId) return;
    setOpsStatus(null);
    try {
      await createAttachment(activeChatId, {
        message_id: attachmentForm.message_id,
        file_url: attachmentForm.file_url,
        mime_type: attachmentForm.mime_type,
        type: attachmentForm.type,
        expires_at: attachmentForm.expires_at || undefined
      });
      await refreshOps();
      setOpsStatus('Attachment created.');
    } catch (err: any) {
      setOpsStatus(err?.message || 'Attachment failed.');
    }
  };

  const handleTranscribe = async () => {
    setOpsStatus(null);
    try {
      const job = await transcribeAudio({ audio_url: asrForm.audio_url });
      setAsrForm(prev => ({ ...prev, job_id: job.id || '' }));
      setOpsStatus(`ASR job queued: ${job.id}`);
    } catch (err: any) {
      setOpsStatus(err?.message || 'Transcription failed.');
    }
  };

  const handleOCR = async () => {
    setOpsStatus(null);
    try {
      const job = await runOCR({ image_url: ocrForm.image_url });
      setOcrForm(prev => ({ ...prev, job_id: job.id || '' }));
      setOpsStatus(`OCR job queued: ${job.id}`);
    } catch (err: any) {
      setOpsStatus(err?.message || 'OCR failed.');
    }
  };

  const handleOCRStatus = async () => {
    setOpsStatus(null);
    try {
      const job = await getOCRStatus(ocrForm.job_id);
      setOpsStatus(`OCR status: ${job.status || 'unknown'}`);
    } catch (err: any) {
      setOpsStatus(err?.message || 'OCR status failed.');
    }
  };

  const handleVision = async () => {
    setOpsStatus(null);
    try {
      const job = await runVisionSearch({ image_url: visionForm.image_url, query: visionForm.query || undefined });
      setOpsStatus(`Vision job queued: ${job.id}`);
    } catch (err: any) {
      setOpsStatus(err?.message || 'Vision failed.');
    }
  };

  const handleToolExecute = async () => {
    setOpsStatus(null);
    try {
      const params = toolForm.params ? JSON.parse(toolForm.params) : {};
      await executeTool({ tool: toolForm.tool, params, thread_id: activeChatId });
      await refreshOps();
      setOpsStatus('Tool executed.');
    } catch (err: any) {
      setOpsStatus(err?.message || 'Tool execution failed.');
    }
  };

  const handleCreateMemory = async () => {
    setOpsStatus(null);
    try {
      await createMemory({
        key: memoryForm.key,
        value: memoryForm.value,
        source: memoryForm.source,
        confidence: Number(memoryForm.confidence || 0),
        consent_given: memoryForm.consent_given
      });
      await refreshOps();
      setOpsStatus('Memory saved.');
    } catch (err: any) {
      setOpsStatus(err?.message || 'Memory save failed.');
    }
  };

  const handleUpdateMemory = async () => {
    setOpsStatus(null);
    try {
      await updateMemory(memoryUpdateForm.id, {
        value: memoryUpdateForm.value,
        consent_given: memoryUpdateForm.consent_given
      });
      await refreshOps();
      setOpsStatus('Memory updated.');
    } catch (err: any) {
      setOpsStatus(err?.message || 'Memory update failed.');
    }
  };

  const handleDeleteMemory = async (id: string) => {
    setOpsStatus(null);
    try {
      await deleteMemory(id);
      await refreshOps();
      setOpsStatus('Memory deleted.');
    } catch (err: any) {
      setOpsStatus(err?.message || 'Memory delete failed.');
    }
  };

  const handleModerate = async () => {
    setOpsStatus(null);
    try {
      await postModeration({ content: moderationText });
      setOpsStatus('Moderation queued.');
    } catch (err: any) {
      setOpsStatus(err?.message || 'Moderation failed.');
    }
  };

  const handleReport = async () => {
    setOpsStatus(null);
    try {
      await postReport({ content: reportText });
      setOpsStatus('Report queued.');
    } catch (err: any) {
      setOpsStatus(err?.message || 'Report failed.');
    }
  };

  const handlePostEvent = async () => {
    setOpsStatus(null);
    try {
      const payload = eventPayload ? JSON.parse(eventPayload) : {};
      await postAssistantEvent(payload);
      setOpsStatus('Event accepted.');
    } catch (err: any) {
      setOpsStatus(err?.message || 'Event failed.');
    }
  };

  const handleMetrics = async () => {
    setOpsStatus(null);
    try {
      const payload = await getAssistantMetrics();
      setMetricsPayload(JSON.stringify(payload, null, 2));
    } catch (err: any) {
      setOpsStatus(err?.message || 'Metrics failed.');
    }
  };


    useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const [threads, suggestions] = await Promise.all([
          listThreads(),
          listSuggestions()
        ]);
        if (!alive) return;
        if (threads && threads.length) {
          const mapped = threads.map(mapThreadToChat);
          setChats(mapped);
          setActiveChatId(mapped[0]?.id || '');
        } else {
          try {
            const created = await createThread({ title: 'New chat' });
            const mapped = mapThreadToChat(created);
            setChats([mapped]);
            setActiveChatId(mapped.id);
          } catch {
            onToast('Unable to start assistant chat.');
          }
        }
        if (suggestions && suggestions.length) {
          setSuggestionChips(suggestions.map((s: any) => ({
            label: s.label || s.title || s.name || 'Suggestion',
            value: s.payload || s.value || s.label || ''
          })));
        }
      } catch {}
    };
    load();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!activeChatId) return;
    syncMessages(activeChatId);
  }, [activeChatId]);

  useEffect(() => {
    if (!showOpsPanel || !activeChatId) return;
    const loadOps = async () => {
      try {
        const [mem, history, att] = await Promise.all([
          listMemory(),
          listToolHistory(),
          listAttachments(activeChatId)
        ]);
        setMemoryItems(mem);
        setToolHistory(history);
        setAttachments(att);
      } catch (err: any) {
        setOpsStatus(err?.message || 'Unable to load assistant ops.');
      }
    };
    loadOps();
  }, [showOpsPanel, activeChatId]);

useEffect(() => {
    if (!activeChatId && chats[0]) {
      setActiveChatId(chats[0].id);
    }
  }, [activeChatId, chats]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chats, isStreaming]);

  useEffect(() => {
    try {
      localStorage.setItem('soko:assistant_sidebar', isSidebarOpen ? 'open' : 'closed');
    } catch {}
  }, [isSidebarOpen]);

  const matchedProduct = (text: string) => {
    const lower = text.toLowerCase();
    return products.find(p => p.name.toLowerCase().includes(lower)) ||
      products.find(p => lower.split(' ').some(t => p.name.toLowerCase().includes(t)));
  };

  const matchedSeller = (text: string) => {
    const lower = text.toLowerCase();
    return SELLERS.find(s => s.name.toLowerCase().includes(lower));
  };

  const parseIntent = (text: string) => {
    const lower = text.toLowerCase();
    const intent = {
      wantsCompare: lower.includes('compare') || lower.includes('vs'),
      wantsDeal: lower.includes('cheap') || lower.includes('cheaper') || lower.includes('bei nafuu') || lower.includes('deal'),
      wantsAlerts: lower.includes('alert') || lower.includes('price drop') || lower.includes('watch'),
      wantsNearMe: lower.includes('near me') || lower.includes('karibu'),
      wantsVoice: lower.includes('voice') || lower.includes('sikiliza') || lower.includes('mic'),
      wantsPhoto: lower.includes('photo') || lower.includes('picha'),
      wantsVideo: lower.includes('video'),
      wantsHybrid: lower.includes('hybrid') || (lower.includes('photo') && lower.includes('text')),
      wantsReceipt: lower.includes('receipt') || lower.includes('risiti'),
      wantsSupport: lower.includes('help') || lower.includes('msaada') || lower.includes('support'),
      wantsSeller: lower.includes('seller') || lower.includes('duka'),
      wantsBudget: lower.match(/(?:under|below|chini ya|ksh|kes)\s?(\d+)/),
      wantsCategory: lower.match(/tv|unga|sukari|maziwa|charger|viatu|headphones|mouse/),
    };
    return intent;
  };

  const buildActions = (text: string): AssistantAction[] => {
    const actions: AssistantAction[] = [];
    const product = matchedProduct(text);
    const seller = matchedSeller(text);
    const intent = parseIntent(text);

    if (text.toLowerCase().includes('search')) {
      const query = text.replace(/search for|search/i, '').trim();
      actions.push({
        label: `Search: ${query || text}`,
        onClick: () => onOpenSearch(query || text)
      });
    }
    if (intent.wantsVoice) {
      actions.push({ label: 'Voice Search', onClick: () => onOpenSearchAction(text, 'voice') });
    }
    if (intent.wantsPhoto) {
      actions.push({ label: 'Photo Search', onClick: () => onOpenSearchAction(text, 'photo') });
    }
    if (intent.wantsVideo) {
      actions.push({ label: 'Video Search', onClick: () => onOpenSearchAction(text, 'video') });
    }
    if (intent.wantsHybrid) {
      actions.push({ label: 'Hybrid Search', onClick: () => onOpenSearchAction(text, 'hybrid') });
    }
    if (intent.wantsNearMe) {
      actions.push({ label: 'Search Near Me', onClick: () => onOpenSearch(`${text} near me`) });
    }
    if (intent.wantsAlerts) {
      actions.push({ label: 'Price Drop Alerts', onClick: () => onOpenSearch(`watch ${text}`) });
    }

    if (product) {
      actions.push({ label: `Open ${product.name}`, onClick: () => onOpenProduct(product) });
      actions.push({ label: 'Add to Bag', onClick: () => onAddToBag(product) });
      actions.push({ label: 'Compare', onClick: () => onAddToComparison(product) });
    }

    if (seller) {
      actions.push({ label: `Open ${seller.name}`, onClick: () => onOpenSeller(seller.id) });
    }

    if (text.toLowerCase().includes('reward')) {
      actions.push({ label: 'Open Rewards', onClick: onOpenRewards });
    }
    if (text.toLowerCase().includes('receipt') || text.toLowerCase().includes('risiti')) {
      actions.push({ label: 'Open Receipt Rewards', onClick: onOpenRewards });
    }
    if (text.toLowerCase().includes('price drop') || text.toLowerCase().includes('alert')) {
      actions.push({ label: 'Open Search Alerts', onClick: () => onOpenSearch(text) });
    }
    if (intent.wantsSupport) {
      actions.push({ label: 'Open WhatsApp Flows', onClick: onOpenWhatsApp });
    }

    if (text.toLowerCase().includes('profile')) {
      actions.push({ label: 'Open Profile', onClick: onOpenProfile });
    }

    if (text.toLowerCase().includes('bag') || text.toLowerCase().includes('cart')) {
      actions.push({ label: 'Open Bag', onClick: onOpenBag });
    }

    if (text.toLowerCase().includes('scan') || text.toLowerCase().includes('qr')) {
      actions.push({ label: 'Scan QR', onClick: onOpenQrScan });
    }

    if (text.toLowerCase().includes('subscribe') || text.toLowerCase().includes('upgrade')) {
      actions.push({ label: 'Open Subscriptions', onClick: onOpenSubscriptions });
    }

    if (text.toLowerCase().includes('partner') || text.toLowerCase().includes('integration')) {
      actions.push({ label: 'Open Partnerships', onClick: onOpenPartnerships });
    }
    if (text.toLowerCase().includes('whatsapp') || text.toLowerCase().includes('flows')) {
      actions.push({ label: 'Open WhatsApp Flows', onClick: onOpenWhatsApp });
    }

    if (text.toLowerCase().includes('seller studio') || text.toLowerCase().includes('dashboard')) {
      actions.push({ label: 'Open Seller Studio', onClick: onOpenSellerStudio });
    }

    if (text.toLowerCase().includes('rfq') || text.toLowerCase().includes('quote')) {
      actions.push({ label: 'Start RFQ', onClick: onOpenRFQ });
    }

    if (text.toLowerCase().includes('onboarding') || text.toLowerCase().includes('tour')) {
      actions.push({ label: 'Open Onboarding', onClick: onOpenOnboarding });
    }

    if (actions.length === 0) {
      actions.push({
        label: 'Search in app',
        onClick: () => onOpenSearch(text)
      });
    }

    return actions.slice(0, 4);
  };


  const handleCommand = (text: string) => {
    const parts = text.trim().split(' ');
    const cmd = parts[0].toLowerCase();
    const arg = parts.slice(1).join(' ').trim();
    if (cmd === '/search') {
      onOpenSearch(arg);
      return `Searching for: ${arg || 'all results'}`;
    }
    if (cmd === '/voice') {
      onOpenSearchAction(arg || 'voice search', 'voice');
      return `Starting voice search: ${arg || 'open mic'}`;
    }
    if (cmd === '/photo') {
      onOpenSearchAction(arg || 'photo search', 'photo');
      return `Starting photo search: ${arg || 'open camera'}`;
    }
    if (cmd === '/video') {
      onOpenSearchAction(arg || 'video search', 'video');
      return `Starting video search: ${arg || 'open video'}`;
    }
    if (cmd === '/hybrid') {
      onOpenSearchAction(arg || 'hybrid search', 'hybrid');
      return `Starting hybrid search: ${arg || 'photo + text'}`;
    }
    if (cmd === '/compare') {
      const product = matchedProduct(arg);
      if (product) {
        onAddToComparison(product);
        return `Added ${product.name} to comparison.`;
      }
      return 'I could not find that product to compare.';
    }
    if (cmd === '/add') {
      const product = matchedProduct(arg);
      if (product) {
        onAddToBag(product);
        return `Added ${product.name} to bag.`;
      }
      return 'I could not find that product to add to bag.';
    }
    if (cmd === '/open') {
      const product = matchedProduct(arg);
      const seller = matchedSeller(arg);
      if (product) {
        onOpenProduct(product);
        return `Opening ${product.name}.`;
      }
      if (seller) {
        onOpenSeller(seller.id);
        return `Opening ${seller.name}.`;
      }
      return 'I could not find that product or seller.';
    }
    if (cmd === '/rfq') {
      onOpenRFQ();
      return 'Starting an RFQ. Open Seller Studio → Suppliers to proceed.';
    }
    if (cmd === '/rewards') {
      onOpenRewards();
      return 'Opening rewards.';
    }
    if (cmd === '/profile') {
      onOpenProfile();
      return 'Opening your profile.';
    }
    if (cmd === '/bag') {
      onOpenBag();
      return 'Opening your bag.';
    }
    if (cmd === '/scan') {
      onOpenQrScan();
      return 'Opening QR scanner.';
    }
    if (cmd === '/subscribe') {
      onOpenSubscriptions();
      return 'Opening subscriptions.';
    }
    if (cmd === '/partners') {
      onOpenPartnerships();
      return 'Opening partnerships.';
    }
    if (cmd === '/whatsapp') {
      onOpenWhatsApp();
      return 'Opening WhatsApp experience flows.';
    }
    if (cmd === '/onboarding') {
      onOpenOnboarding();
      return 'Opening onboarding.';
    }
    return '';
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    const text = input.trim();
    setChats(prev => prev.map(chat => {
      if (chat.id !== activeChatId) return chat;
      const nextTitle = chat.title === 'New chat' ? text.slice(0, 28) : chat.title;
      return {
        ...chat,
        title: nextTitle,
        messages: [...chat.messages, { role: 'user', content: text }],
        updatedAt: Date.now()
      };
    }));
    setInput('');

    if (text.startsWith('/')) {
      const response = handleCommand(text);
      setChats(prev => prev.map(chat => {
        if (chat.id !== activeChatId) return chat;
        return {
          ...chat,
          messages: [...chat.messages, { role: 'assistant', content: response }],
          updatedAt: Date.now()
        };
      }));
      await sendUserMessage(activeChatId, text);
      return;
    }

    setIsStreaming(true);
    const apiOk = await sendStreamMessage(activeChatId, text);
    if (!apiOk) {
      onToast('Assistant is unavailable right now. Please try again.');
    }
    setIsStreaming(false);
  };

  return (
    <div className="h-full bg-slate-950 text-white flex">
            {/* Sidebar (desktop) */}
      <div className={`bg-black/60 border-r border-white/10 shrink-0 transition-all duration-200 ${isSidebarOpen ? 'w-72 p-4' : 'w-16 p-2'} hidden lg:block`}>
        <div className={`flex items-center ${isSidebarOpen ? 'justify-between' : 'justify-center'} mb-4`}>
          {isSidebarOpen && (
            <div className="flex items-center gap-2">
              <div className="p-2 bg-white/10 rounded-xl">
                <MessageCircle className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-black">Conversations</p>
                <p className="text-[10px] text-white/50">{chats.length} chats</p>
              </div>
            </div>
          )}
          {!isSidebarOpen && (
            <div className="p-2 bg-white/10 rounded-xl">
              <MessageCircle className="w-4 h-4 text-white" />
            </div>
          )}
          <button
            onClick={() => setIsSidebarOpen(prev => !prev)}
            className="p-2 bg-white/10 rounded-xl"
            title={isSidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            <ArrowRightLeft className="w-4 h-4 text-white" />
          </button>
        </div>

        {isSidebarOpen && (
          <>
            <div className="space-y-2 max-h-[45vh] overflow-y-auto pr-1">
              {chats
                .sort((a, b) => {
                  if (!!a.pinned !== !!b.pinned) return a.pinned ? -1 : 1;
                  return b.updatedAt - a.updatedAt;
                })
                .slice(0, 12)
                .map((chat) => (
                  <div
                    key={chat.id}
                    className={`w-full text-left p-2 rounded-xl text-[10px] font-bold flex items-center justify-between ${activeChatId === chat.id ? 'bg-white/15 text-white' : 'bg-white/5 text-white/70'}`}
                  >
                    <button
                      onClick={() => setActiveChatId(chat.id)}
                      className="flex-1 text-left"
                    >
                      {chat.title || 'New chat'}
                    </button>
                    <div className="flex items-center gap-1 ml-2">
                      <button
                        onClick={async () => {
                          const nextPinned = !chat.pinned;
                          setChats(prev => prev.map(c => c.id === chat.id ? { ...c, pinned: nextPinned } : c));
                          try {
                            await updateThread(chat.id, { pinned: nextPinned });
                          } catch {}
                        }}
                        className="px-2 py-1 bg-white/10 rounded-lg text-[9px] font-black"
                        title="Pin chat"
                      >
                        {chat.pinned ? 'Unpin' : 'Pin'}
                      </button>
                      <button
                        onClick={async () => {
                          setChats(prev => prev.filter(c => c.id !== chat.id));
                          if (activeChatId === chat.id) {
                            const next = chats.find(c => c.id !== chat.id);
                            setActiveChatId(next?.id || '');
                          }
                          try {
                            await deleteThread(chat.id);
                          } catch {}
                        }}
                        className="px-2 py-1 bg-white/10 rounded-lg text-[9px] font-black"
                        title="Delete chat"
                      >
                        Del
                      </button>
                    </div>
                  </div>
                ))}
            </div>

            <div className="mt-4 space-y-2">
              <button
                onClick={async () => {
                  try {
                    const created = await createThread({ title: 'New chat' });
                    const newChat = mapThreadToChat(created);
                    setChats(prev => [newChat, ...prev]);
                    setActiveChatId(newChat.id);
                  } catch {
                    onToast('Unable to start assistant chat.');
                  }
                }}
                className="w-full px-3 py-2 bg-white/10 rounded-xl text-[10px] font-black flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" /> New chat
              </button>
              <button
                onClick={() => onOpenOnboarding()}
                className="w-full px-3 py-2 bg-white/10 rounded-xl text-[10px] font-black flex items-center justify-center gap-2"
              >
                <Trophy className="w-4 h-4" /> Onboarding
              </button>
            </div>

            <div className="mt-6">
              <p className="text-[10px] font-black uppercase tracking-widest text-white/50 mb-3">Quick Actions</p>
              <div className="space-y-2 text-[10px] font-bold">
                {quickActions.map(action => (
                  <button
                    key={action.label}
                    onClick={action.onClick}
                    className="w-full bg-white/5 rounded-xl py-2 flex items-center justify-center gap-2"
                  >
                    <action.icon className="w-3 h-3" /> {action.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6">
              <p className="text-[10px] font-black uppercase tracking-widest text-white/50 mb-3">More</p>
              <div className="space-y-2 text-[10px] font-bold">
                {moreActions.map(action => (
                  <button
                    key={action.label}
                    onClick={action.onClick}
                    className="w-full bg-white/5 rounded-xl py-2 flex items-center justify-center gap-2"
                  >
                    <action.icon className="w-3 h-3" /> {action.label}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
{/* Sidebar (mobile drawer) */}
      {isSidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setIsSidebarOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 w-72 bg-slate-950 border-r border-white/10 p-4 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-white/10 rounded-xl">
                  <MessageCircle className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-black">Conversations</p>
                  <p className="text-[10px] text-white/50">{chats.length} chats</p>
                </div>
              </div>
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="p-2 bg-white/10 rounded-xl"
                aria-label="Close navigation"
              >
                <ArrowRightLeft className="w-4 h-4 text-white" />
              </button>
            </div>

            <div className="space-y-2 max-h-[45vh] overflow-y-auto pr-1">
              {chats
                .sort((a, b) => {
                  if (!!a.pinned !== !!b.pinned) return a.pinned ? -1 : 1;
                  return b.updatedAt - a.updatedAt;
                })
                .slice(0, 12)
                .map((chat) => (
                  <div
                    key={chat.id}
                    className={`w-full text-left p-2 rounded-xl text-[10px] font-bold flex items-center justify-between ${activeChatId === chat.id ? 'bg-white/15 text-white' : 'bg-white/5 text-white/70'}`}
                  >
                    <button
                      onClick={() => {
                        setActiveChatId(chat.id);
                        setIsSidebarOpen(false);
                      }}
                      className="flex-1 text-left"
                    >
                      {chat.title || 'New chat'}
                    </button>
                    <div className="flex items-center gap-1 ml-2">
                      <button
                        onClick={async () => {
                          const nextPinned = !chat.pinned;
                          setChats(prev => prev.map(c => c.id === chat.id ? { ...c, pinned: nextPinned } : c));
                          try {
                            await updateThread(chat.id, { pinned: nextPinned });
                          } catch {}
                        }}
                        className="px-2 py-1 bg-white/10 rounded-lg text-[9px] font-black"
                        title="Pin chat"
                      >
                        {chat.pinned ? 'Unpin' : 'Pin'}
                      </button>
                    </div>
                  </div>
                ))}
            </div>

            <div className="mt-4 space-y-2">
              <button
                onClick={async () => {
                  try {
                    const created = await createThread({ title: 'New chat' });
                    const newChat = mapThreadToChat(created);
                    setChats(prev => [newChat, ...prev]);
                    setActiveChatId(newChat.id);
                    setIsSidebarOpen(false);
                  } catch {
                    onToast('Unable to start assistant chat.');
                  }
                }}
                className="w-full px-3 py-2 bg-white/10 rounded-xl text-[10px] font-black flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" /> New chat
              </button>
              <button
                onClick={() => {
                  onOpenOnboarding();
                  setIsSidebarOpen(false);
                }}
                className="w-full px-3 py-2 bg-white/10 rounded-xl text-[10px] font-black flex items-center justify-center gap-2"
              >
                <Trophy className="w-4 h-4" /> Onboarding
              </button>
            </div>

            <div className="mt-6">
              <p className="text-[10px] font-black uppercase tracking-widest text-white/50 mb-3">Quick Actions</p>
              <div className="space-y-2 text-[10px] font-bold">
                {quickActions.map(action => (
                  <button
                    key={action.label}
                    onClick={() => {
                      action.onClick();
                      setIsSidebarOpen(false);
                    }}
                    className="w-full bg-white/5 rounded-xl py-2 flex items-center justify-center gap-2"
                  >
                    <action.icon className="w-3 h-3" /> {action.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6">
              <p className="text-[10px] font-black uppercase tracking-widest text-white/50 mb-3">More</p>
              <div className="space-y-2 text-[10px] font-bold">
                {moreActions.map(action => (
                  <button
                    key={action.label}
                    onClick={() => {
                      action.onClick();
                      setIsSidebarOpen(false);
                    }}
                    className="w-full bg-white/5 rounded-xl py-2 flex items-center justify-center gap-2"
                  >
                    <action.icon className="w-3 h-3" /> {action.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="flex-1 flex flex-col relative">

        {/* Header */}
        <div className="fixed top-0 left-0 right-0 px-4 pt-4 pb-3 sm:px-5 sm:pt-5 sm:pb-4 border-b border-white/10 flex items-center justify-between z-40 bg-slate-950/95 backdrop-blur">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden h-11 w-11 rounded-2xl bg-white/10 flex items-center justify-center"
              aria-label="Open navigation"
            >
              <MessageCircle className="w-5 h-5" />
            </button>
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center font-black">SC</div>
            <div>
              <p className="text-sm font-black">Sconnect</p>
              <p className="text-[10px] text-white/60">Kenya's duka demand engine</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowOpsPanel(true)}
              className="h-11 w-11 rounded-full bg-white/10 flex items-center justify-center"
              aria-label="Open assistant ops"
            >
              <Plug className="w-5 h-5" />
            </button>
            <button
              onClick={onOpenProfile}
              className="h-11 w-11 rounded-full bg-white/10 flex items-center justify-center"
              aria-label="Open profile"
            >
              <User className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-h-0 px-4 pt-24 pb-28 sm:px-5 sm:pt-24 sm:pb-40 flex flex-col gap-4 sm:gap-5">
          {showIntroCards && (
            <>
              <section className="bg-gradient-to-br from-white/10 via-white/5 to-white/10 rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-white/10">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-white/60 font-bold">Value Prop</p>
                    <h1 className="mt-2 text-lg sm:text-xl font-black">Kenya's duka demand engine</h1>
                    <p className="text-[11px] text-white/70 mt-2">Works on WhatsApp + PWA • Real-time buyer signals.</p>
                  </div>
                  <button
                    onClick={() => onOpenOnboarding()}
                    className="h-11 w-11 rounded-full bg-white/10 flex items-center justify-center"
                    aria-label="Open onboarding"
                  >
                    <Sparkles className="w-5 h-5 text-amber-300" />
                  </button>
                </div>
                <div className="mt-4 flex items-center gap-2">
                  <span className="px-3 py-1.5 rounded-full bg-white/10 text-[10px] font-bold flex items-center gap-1.5">
                    <MessageCircle className="w-3 h-3" /> WhatsApp
                  </span>
                  <span className="px-3 py-1.5 rounded-full bg-white/10 text-[10px] font-bold flex items-center gap-1.5">
                    <BadgeCheck className="w-3 h-3" /> PWA Ready
                  </span>
                </div>
              </section>

              <section className="bg-white/5 rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-white/10">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-white/60 font-bold">Active Conversation</p>
                    <p className="text-sm font-black mt-2">Sconnect Assistant</p>
                    <p className="text-[11px] text-white/60 mt-1 line-clamp-2">{lastMessage?.content || 'Ask me to search, compare, or open a shop.'}</p>
                  </div>
                  <button
                    onClick={() => setActiveChatId(activeChatId)}
                    className="h-11 w-11 rounded-full bg-white/10 flex items-center justify-center"
                    aria-label="Open conversation"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </section>

              <section className="bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-emerald-500/20">
                <div className="flex items-center gap-2 text-emerald-200 text-[10px] font-bold uppercase tracking-[0.2em]">
                  <TrendingUp className="w-3 h-3" /> Insight
                </div>
                <div className="mt-3 flex items-end gap-3">
                  <p className="text-2xl sm:text-3xl font-black">+47%</p>
                  <div className="text-[11px] text-emerald-100/80">
                    Omo demand spike in Mombasa • update your shelf today
                  </div>
                </div>
              </section>

              <section className="bg-white/5 rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-white/10">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-white/60 font-bold">Your Progress</p>
                    <p className="text-sm font-black mt-2">Rank: Bronze</p>
                    <p className="text-[11px] text-white/60">2/50 stars to Free Pro Month</p>
                  </div>
                  <button
                    onClick={onOpenRewards}
                    className="h-11 w-11 rounded-full bg-white/10 flex items-center justify-center"
                    aria-label="Open rewards"
                  >
                    <Trophy className="w-5 h-5 text-amber-300" />
                  </button>
                </div>
                <div className="mt-4 grid grid-cols-8 sm:grid-cols-10 gap-0.5 sm:gap-1">
                  {Array.from({ length: totalStars }).map((_, i) => (
                    <Star
                      key={`star-${i}`}
                      className={`w-2.5 h-2.5 sm:w-3 sm:h-3 ${i < progressStars ? 'text-amber-400 fill-amber-400' : 'text-white/20'}`}
                    />
                  ))}
                </div>
                <div className="mt-4 h-2 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-400" style={{ width: `${progressPct}%` }} />
                </div>
              </section>
            </>
          )}

          {/* Quick Actions + More moved to sidebar navigation */}

          <div className="flex-1 min-h-0 overflow-y-auto space-y-3">
            {activeMessages.map((msg, i) => (
              <div key={msg.id || `msg_${i}`} className={`max-w-[90%] ${msg.role === 'user' ? 'ml-auto text-right' : ''}`}>
                <div className={`px-4 py-3 rounded-2xl text-[12px] leading-relaxed ${msg.role === 'user' ? 'bg-indigo-500/80 text-white' : 'bg-white/10 text-white/90'}`}>
                  {msg.content}
                </div>
                {msg.actions && msg.actions.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {msg.actions.map((action, idx) => (
                      <button
                        key={idx}
                        onClick={action.onClick}
                        className="px-3 py-2 bg-white/10 rounded-full text-[10px] font-bold hover:bg-white/20 transition-colors"
                      >
                        {action.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <div ref={endRef} />
          </div>
        </div>

        {/* Sticky Action Bar */}
        <div className="fixed bottom-0 left-0 right-0 w-full bg-slate-950/95 backdrop-blur border-t border-white/10 px-4 pt-3 pb-4 sm:pb-5 z-40">
          {suggestionChips.length > 0 && (
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
              {suggestionChips.map(chip => (
                <button
                  key={chip.label}
                  onClick={() => setInput(chip.value)}
                  className="px-3 py-2 bg-white/10 rounded-full text-[10px] font-bold whitespace-nowrap"
                >
                  {chip.label}
                </button>
              ))}
            </div>
          )}

          {showMediaTray && (
            <div className="flex gap-2 mb-3">
              <button
                onClick={() => onOpenSearchAction('photo search', 'photo')}
                className="flex-1 h-11 rounded-2xl bg-white/10 flex items-center justify-center gap-2 text-[10px] font-bold"
              >
                <Camera className="w-4 h-4" /> Photo
              </button>
              <button
                onClick={() => onOpenSearchAction('video search', 'video')}
                className="flex-1 h-11 rounded-2xl bg-white/10 flex items-center justify-center gap-2 text-[10px] font-bold"
              >
                <Video className="w-4 h-4" /> Video
              </button>
              <button
                onClick={() => onOpenSearchAction('hybrid search', 'hybrid')}
                className="flex-1 h-11 rounded-2xl bg-white/10 flex items-center justify-center gap-2 text-[10px] font-bold"
              >
                <Sparkles className="w-4 h-4" /> Hybrid
              </button>
            </div>
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenSearchAction('voice search', 'voice')}
              className="h-11 w-11 rounded-full bg-white/10 flex items-center justify-center"
              aria-label="Voice search"
            >
              <Mic className="w-5 h-5" />
            </button>
            <input
              className="flex-1 min-w-0 h-11 bg-white/10 rounded-full px-4 text-sm outline-none"
              placeholder="Ask Sconnect to search, compare, or buy..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            />
            <button
              onClick={() => setShowMediaTray(prev => !prev)}
              className={`h-11 w-11 rounded-full flex items-center justify-center ${showMediaTray ? 'bg-white/20' : 'bg-white/10'}`}
              aria-label="Open media options"
            >
              <Plus className="w-5 h-5" />
            </button>
            <button
              onClick={handleSend}
              className="h-11 w-11 rounded-full bg-emerald-500 flex items-center justify-center text-white"
              aria-label="Send"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {showOpsPanel && (
        <div className="fixed inset-0 z-[80] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-4xl bg-slate-950 text-white border border-white/10 rounded-3xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <div>
                <p className="text-sm font-black">Assistant Ops</p>
                <p className="text-[10px] text-white/60">Live tools, memory, uploads, and moderation</p>
              </div>
              <button
                onClick={() => setShowOpsPanel(false)}
                className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center"
                aria-label="Close assistant ops"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {opsStatus && (
                <div className="text-[10px] font-bold text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-3 py-2">
                  {opsStatus}
                </div>
              )}

              <section className="bg-white/5 rounded-2xl p-4 border border-white/10 space-y-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-white/50">Uploads</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    className="h-10 rounded-xl bg-white/10 px-3 text-[10px] font-bold"
                    placeholder="File URL"
                    value={uploadForm.file_url}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, file_url: e.target.value }))}
                  />
                  <input
                    className="h-10 rounded-xl bg-white/10 px-3 text-[10px] font-bold"
                    placeholder="MIME type"
                    value={uploadForm.mime_type}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, mime_type: e.target.value }))}
                  />
                  <input
                    className="h-10 rounded-xl bg-white/10 px-3 text-[10px] font-bold"
                    placeholder="Expires at (RFC3339)"
                    value={uploadForm.expires_at}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, expires_at: e.target.value }))}
                  />
                </div>
                <button onClick={handleUpload} className="px-3 py-2 bg-indigo-600 rounded-xl text-[10px] font-black">
                  Create Upload
                </button>
              </section>

              <section className="bg-white/5 rounded-2xl p-4 border border-white/10 space-y-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-white/50">Attachments</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <select
                    className="h-10 rounded-xl bg-white/10 px-3 text-[10px] font-bold"
                    value={attachmentForm.message_id}
                    onChange={(e) => setAttachmentForm(prev => ({ ...prev, message_id: e.target.value }))}
                  >
                    <option value="">Select message</option>
                    {activeMessages.filter(m => m.id).map((msg) => (
                      <option key={msg.id} value={msg.id}>
                        {msg.role}: {msg.content.slice(0, 24)}
                      </option>
                    ))}
                  </select>
                  <select
                    className="h-10 rounded-xl bg-white/10 px-3 text-[10px] font-bold"
                    value={attachmentForm.type}
                    onChange={(e) => setAttachmentForm(prev => ({ ...prev, type: e.target.value }))}
                  >
                    <option value="image">image</option>
                    <option value="audio">audio</option>
                    <option value="video">video</option>
                    <option value="file">file</option>
                  </select>
                  <input
                    className="h-10 rounded-xl bg-white/10 px-3 text-[10px] font-bold"
                    placeholder="File URL"
                    value={attachmentForm.file_url}
                    onChange={(e) => setAttachmentForm(prev => ({ ...prev, file_url: e.target.value }))}
                  />
                  <input
                    className="h-10 rounded-xl bg-white/10 px-3 text-[10px] font-bold"
                    placeholder="MIME type"
                    value={attachmentForm.mime_type}
                    onChange={(e) => setAttachmentForm(prev => ({ ...prev, mime_type: e.target.value }))}
                  />
                  <input
                    className="h-10 rounded-xl bg-white/10 px-3 text-[10px] font-bold"
                    placeholder="Expires at (RFC3339)"
                    value={attachmentForm.expires_at}
                    onChange={(e) => setAttachmentForm(prev => ({ ...prev, expires_at: e.target.value }))}
                  />
                </div>
                <button onClick={handleCreateAttachment} className="px-3 py-2 bg-indigo-600 rounded-xl text-[10px] font-black">
                  Attach to Message
                </button>
                {attachments.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {attachments.map(att => (
                      <div key={att.id} className="p-3 bg-white/10 rounded-xl text-[10px] font-bold">
                        {att.type || 'file'} • {att.mime_type || 'mime'} • {att.file_url || 'url'}
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section className="bg-white/5 rounded-2xl p-4 border border-white/10 space-y-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-white/50">Audio + OCR + Vision</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    className="h-10 rounded-xl bg-white/10 px-3 text-[10px] font-bold"
                    placeholder="Audio URL"
                    value={asrForm.audio_url}
                    onChange={(e) => setAsrForm(prev => ({ ...prev, audio_url: e.target.value }))}
                  />
                  <button onClick={handleTranscribe} className="px-3 py-2 bg-emerald-600 rounded-xl text-[10px] font-black">
                    Transcribe
                  </button>
                  <input
                    className="h-10 rounded-xl bg-white/10 px-3 text-[10px] font-bold"
                    placeholder="ASR job id"
                    value={asrForm.job_id}
                    onChange={(e) => setAsrForm(prev => ({ ...prev, job_id: e.target.value }))}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    className="h-10 rounded-xl bg-white/10 px-3 text-[10px] font-bold"
                    placeholder="Image URL (OCR)"
                    value={ocrForm.image_url}
                    onChange={(e) => setOcrForm(prev => ({ ...prev, image_url: e.target.value }))}
                  />
                  <button onClick={handleOCR} className="px-3 py-2 bg-emerald-600 rounded-xl text-[10px] font-black">
                    OCR
                  </button>
                  <div className="flex gap-2">
                    <input
                      className="h-10 flex-1 rounded-xl bg-white/10 px-3 text-[10px] font-bold"
                      placeholder="OCR job id"
                      value={ocrForm.job_id}
                      onChange={(e) => setOcrForm(prev => ({ ...prev, job_id: e.target.value }))}
                    />
                    <button onClick={handleOCRStatus} className="px-3 py-2 bg-white/10 rounded-xl text-[10px] font-black">
                      Status
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    className="h-10 rounded-xl bg-white/10 px-3 text-[10px] font-bold"
                    placeholder="Image URL (Vision)"
                    value={visionForm.image_url}
                    onChange={(e) => setVisionForm(prev => ({ ...prev, image_url: e.target.value }))}
                  />
                  <input
                    className="h-10 rounded-xl bg-white/10 px-3 text-[10px] font-bold"
                    placeholder="Query"
                    value={visionForm.query}
                    onChange={(e) => setVisionForm(prev => ({ ...prev, query: e.target.value }))}
                  />
                  <button onClick={handleVision} className="px-3 py-2 bg-emerald-600 rounded-xl text-[10px] font-black">
                    Vision Search
                  </button>
                </div>
              </section>

              <section className="bg-white/5 rounded-2xl p-4 border border-white/10 space-y-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-white/50">Tool Calls</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    className="h-10 rounded-xl bg-white/10 px-3 text-[10px] font-bold"
                    placeholder="Tool name"
                    value={toolForm.tool}
                    onChange={(e) => setToolForm(prev => ({ ...prev, tool: e.target.value }))}
                  />
                  <textarea
                    className="min-h-[40px] rounded-xl bg-white/10 px-3 py-2 text-[10px] font-bold"
                    placeholder='Params JSON'
                    value={toolForm.params}
                    onChange={(e) => setToolForm(prev => ({ ...prev, params: e.target.value }))}
                  />
                </div>
                <button onClick={handleToolExecute} className="px-3 py-2 bg-indigo-600 rounded-xl text-[10px] font-black">
                  Execute Tool
                </button>
                {toolHistory.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {toolHistory.map(item => (
                      <div key={item.id} className="p-3 bg-white/10 rounded-xl text-[10px] font-bold">
                        {item.tool || 'tool'} • {item.created_at || ''}
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section className="bg-white/5 rounded-2xl p-4 border border-white/10 space-y-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-white/50">Memory</p>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                  <input
                    className="h-10 rounded-xl bg-white/10 px-3 text-[10px] font-bold"
                    placeholder="Key"
                    value={memoryForm.key}
                    onChange={(e) => setMemoryForm(prev => ({ ...prev, key: e.target.value }))}
                  />
                  <input
                    className="h-10 rounded-xl bg-white/10 px-3 text-[10px] font-bold"
                    placeholder="Value"
                    value={memoryForm.value}
                    onChange={(e) => setMemoryForm(prev => ({ ...prev, value: e.target.value }))}
                  />
                  <input
                    className="h-10 rounded-xl bg-white/10 px-3 text-[10px] font-bold"
                    placeholder="Source"
                    value={memoryForm.source}
                    onChange={(e) => setMemoryForm(prev => ({ ...prev, source: e.target.value }))}
                  />
                  <input
                    className="h-10 rounded-xl bg-white/10 px-3 text-[10px] font-bold"
                    placeholder="Confidence"
                    value={memoryForm.confidence}
                    onChange={(e) => setMemoryForm(prev => ({ ...prev, confidence: e.target.value }))}
                  />
                </div>
                <label className="text-[10px] font-bold text-white/70 flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={memoryForm.consent_given}
                    onChange={(e) => setMemoryForm(prev => ({ ...prev, consent_given: e.target.checked }))}
                  />
                  Consent given
                </label>
                <button onClick={handleCreateMemory} className="px-3 py-2 bg-indigo-600 rounded-xl text-[10px] font-black">
                  Save Memory
                </button>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    className="h-10 rounded-xl bg-white/10 px-3 text-[10px] font-bold"
                    placeholder="Memory ID"
                    value={memoryUpdateForm.id}
                    onChange={(e) => setMemoryUpdateForm(prev => ({ ...prev, id: e.target.value }))}
                  />
                  <input
                    className="h-10 rounded-xl bg-white/10 px-3 text-[10px] font-bold"
                    placeholder="New value"
                    value={memoryUpdateForm.value}
                    onChange={(e) => setMemoryUpdateForm(prev => ({ ...prev, value: e.target.value }))}
                  />
                  <label className="text-[10px] font-bold text-white/70 flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={memoryUpdateForm.consent_given}
                      onChange={(e) => setMemoryUpdateForm(prev => ({ ...prev, consent_given: e.target.checked }))}
                    />
                    Consent
                  </label>
                </div>
                <button onClick={handleUpdateMemory} className="px-3 py-2 bg-white/10 rounded-xl text-[10px] font-black">
                  Update Memory
                </button>

                {memoryItems.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {memoryItems.map(mem => (
                      <div key={mem.id} className="p-3 bg-white/10 rounded-xl text-[10px] font-bold flex items-center justify-between gap-2">
                        <div>
                          {mem.key}: {mem.value}
                        </div>
                        <button onClick={() => handleDeleteMemory(mem.id)} className="px-2 py-1 bg-red-500/20 rounded-lg text-[9px] font-black">
                          Delete
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section className="bg-white/5 rounded-2xl p-4 border border-white/10 space-y-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-white/50">Safety + Events + Metrics</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    className="h-10 rounded-xl bg-white/10 px-3 text-[10px] font-bold"
                    placeholder="Moderation text"
                    value={moderationText}
                    onChange={(e) => setModerationText(e.target.value)}
                  />
                  <button onClick={handleModerate} className="px-3 py-2 bg-white/10 rounded-xl text-[10px] font-black">
                    Moderate
                  </button>
                  <input
                    className="h-10 rounded-xl bg-white/10 px-3 text-[10px] font-bold"
                    placeholder="Report text"
                    value={reportText}
                    onChange={(e) => setReportText(e.target.value)}
                  />
                  <button onClick={handleReport} className="px-3 py-2 bg-white/10 rounded-xl text-[10px] font-black">
                    Report
                  </button>
                </div>
                <textarea
                  className="min-h-[60px] rounded-xl bg-white/10 px-3 py-2 text-[10px] font-bold"
                  placeholder='Event payload JSON'
                  value={eventPayload}
                  onChange={(e) => setEventPayload(e.target.value)}
                />
                <div className="flex items-center gap-2">
                  <button onClick={handlePostEvent} className="px-3 py-2 bg-indigo-600 rounded-xl text-[10px] font-black">
                    Send Event
                  </button>
                  <button onClick={handleMetrics} className="px-3 py-2 bg-white/10 rounded-xl text-[10px] font-black">
                    Fetch Metrics
                  </button>
                </div>
                {metricsPayload && (
                  <pre className="text-[10px] bg-black/40 rounded-xl p-3 overflow-x-auto">{metricsPayload}</pre>
                )}
              </section>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
