import React, { useEffect, useRef, useState } from 'react';
import { Sparkles, Send, Search, ShoppingBag, ArrowRightLeft, User, Trophy, Store, MessageCircle, Crown, Plug, Mic, Camera, Video } from 'lucide-react';
import { Product } from '../types';
import { SELLERS } from '../mockData';

type AssistantAction = {
  label: string;
  onClick: () => void;
};

type AssistantMessage = {
  role: 'user' | 'assistant';
  content: string;
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
}

const QUICK_PROMPTS = [
  'Natafuta TV ya inchi 55 karibu na mimi',
  'Nipatie viatu kama hizi lakini vya bei nafuu',
  'Compare the best wireless mouse',
  'Show price drop alerts for Samsung TV',
  'Nataka kusikiliza search (voice)',
  'Nataka photo + text hybrid search'
];

const COMMAND_HELP = [
  '/search <query>',
  '/compare <product>',
  '/add <product>',
  '/open <product|shop>',
  '/voice <query>',
  '/photo <hint>',
  '/video <hint>',
  '/hybrid <text>',
  '/rfq <request>',
  '/rewards',
  '/profile',
  '/onboarding',
  '/bag',
  '/scan',
  '/subscribe',
  '/partners',
  '/whatsapp'
];

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
  onToast,
  onOpenOnboarding,
  onOpenBag,
  onOpenQrScan,
  onOpenSubscriptions,
  onOpenPartnerships,
  onOpenWhatsApp
}) => {
  const [chats, setChats] = useState<AssistantChat[]>(() => {
    try {
      const rawChats = localStorage.getItem('soko:assistant_chats');
      if (rawChats) return JSON.parse(rawChats);
      const rawMessages = localStorage.getItem('soko:assistant');
      if (rawMessages) {
        const legacy = JSON.parse(rawMessages);
        return [{
          id: `chat_${Date.now()}`,
          title: 'Recent chat',
          messages: legacy,
          updatedAt: Date.now()
        }];
      }
    } catch {}
    return [{
      id: `chat_${Date.now()}`,
      title: 'New chat',
      messages: [
        {
          role: 'assistant',
          content: 'Hi! I’m your Sconnect assistant. Ask me to search, compare, add to bag, open a shop, or start an RFQ.',
        }
      ],
      updatedAt: Date.now()
    }];
  });
  const [activeChatId, setActiveChatId] = useState(() => chats[0]?.id || '');
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
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

  useEffect(() => {
    if (!activeChatId && chats[0]) {
      setActiveChatId(chats[0].id);
    }
  }, [activeChatId, chats]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
    try {
      localStorage.setItem('soko:assistant_chats', JSON.stringify(chats));
      localStorage.removeItem('soko:assistant');
    } catch {}
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

  const streamAssistantReply = (text: string, actions: AssistantAction[]) => {
    const intent = parseIntent(text);
    const response = `Got it. I can understand your intent and run multimodal search (text, voice, photo, video, or hybrid). ${intent.wantsNearMe ? 'I will prioritize near you results.' : ''} ${intent.wantsDeal ? 'I will prioritize best price and good-deal options.' : ''}`.trim() + ' Here’s the best next step:';
    let idx = 0;
    setIsStreaming(true);
    setChats(prev => prev.map(chat => {
      if (chat.id !== activeChatId) return chat;
      return {
        ...chat,
        messages: [...chat.messages, { role: 'assistant', content: '' }],
        updatedAt: Date.now()
      };
    }));
    const interval = setInterval(() => {
      idx += 1;
      setChats(prev => prev.map(chat => {
        if (chat.id !== activeChatId) return chat;
        const updated = [...chat.messages];
        const last = updated[updated.length - 1];
        if (last && last.role === 'assistant') {
          last.content = response.slice(0, idx);
          if (idx >= response.length) {
            last.actions = actions;
          }
        }
        return { ...chat, messages: updated, updatedAt: Date.now() };
      }));
      if (idx >= response.length) {
        clearInterval(interval);
        setIsStreaming(false);
      }
    }, 15);
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

  const handleSend = () => {
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
      return;
    }
    const actions = buildActions(text);
    streamAssistantReply(text, actions);
  };

  return (
    <div className="h-full bg-zinc-950 text-white flex">
      {/* Sidebar */}
      <div className={`bg-black/60 border-r border-white/10 shrink-0 transition-all duration-200 ${isSidebarOpen ? 'w-72 p-4' : 'w-16 p-2'} ${isSidebarOpen ? 'block' : 'hidden'} sm:block`}>
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

        {isSidebarOpen ? (
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
                        onClick={() => setChats(prev => prev.map(c => c.id === chat.id ? { ...c, pinned: !c.pinned } : c))}
                        className="px-2 py-1 bg-white/10 rounded-lg text-[9px] font-black"
                        title="Pin chat"
                      >
                        {chat.pinned ? 'Unpin' : 'Pin'}
                      </button>
                      <button
                        onClick={() => {
                          setChats(prev => prev.filter(c => c.id !== chat.id));
                          if (activeChatId === chat.id) {
                            const next = chats.find(c => c.id !== chat.id);
                            setActiveChatId(next?.id || '');
                          }
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

            <div className="mt-6">
              <p className="text-[10px] font-black uppercase tracking-widest text-white/50 mb-3">MORE</p>
              <div className="space-y-2 text-[10px] font-bold">
                <button
                  onClick={() => {
                    const id = `chat_${Date.now()}`;
                    const newChat: AssistantChat = {
                      id,
                      title: 'New chat',
                      messages: [
                        {
                          role: 'assistant',
                          content: 'Hi! I’m your Sconnect assistant. Ask me to search, compare, add to bag, open a shop, or start an RFQ.',
                        }
                      ],
                      updatedAt: Date.now()
                    };
                    setChats(prev => [newChat, ...prev]);
                    setActiveChatId(id);
                  }}
                  className="w-full bg-white/10 rounded-xl py-2 flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-3 h-3" /> New Chat
                </button>
                <button onClick={() => onOpenSearch('')} className="w-full bg-white/5 rounded-xl py-2 flex items-center justify-center gap-2">
                  <Search className="w-3 h-3" /> Search
                </button>
            <button onClick={() => onOpenRewards()} className="w-full bg-white/5 rounded-xl py-2 flex items-center justify-center gap-2">
              <Trophy className="w-3 h-3" /> Rewards
            </button>
            <button onClick={() => onOpenBag()} className="w-full bg-white/5 rounded-xl py-2 flex items-center justify-center gap-2">
              <ShoppingBag className="w-3 h-3" /> Bag
            </button>
            <button onClick={() => onOpenQrScan()} className="w-full bg-white/5 rounded-xl py-2 flex items-center justify-center gap-2">
              <MessageCircle className="w-3 h-3" /> Scan QR
            </button>
            <button onClick={() => onOpenPartnerships()} className="w-full bg-white/5 rounded-xl py-2 flex items-center justify-center gap-2">
              <Plug className="w-3 h-3" /> Partnerships
            </button>
            <button onClick={() => onOpenSubscriptions()} className="w-full bg-white/5 rounded-xl py-2 flex items-center justify-center gap-2">
              <Crown className="w-3 h-3" /> Subscriptions
            </button>
            <button onClick={() => onOpenProfile()} className="w-full bg-white/5 rounded-xl py-2 flex items-center justify-center gap-2">
              <User className="w-3 h-3" /> Profile
            </button>
            <button onClick={() => onOpenWhatsApp()} className="w-full bg-white/5 rounded-xl py-2 flex items-center justify-center gap-2">
              <MessageCircle className="w-3 h-3" /> WhatsApp Flows
            </button>
                <button onClick={() => onOpenSellerStudio()} className="w-full bg-white/5 rounded-xl py-2 flex items-center justify-center gap-2">
                  <Store className="w-3 h-3" /> Seller Studio
                </button>
                <button onClick={() => onOpenRFQ()} className="w-full bg-white/5 rounded-xl py-2 flex items-center justify-center gap-2">
                  <MessageCircle className="w-3 h-3" /> RFQ
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col gap-3 items-center">
            <button onClick={() => onOpenSearch('')} className="p-2 bg-white/5 rounded-xl" title="Search">
              <Search className="w-4 h-4" />
            </button>
            <button onClick={() => onOpenRewards()} className="p-2 bg-white/5 rounded-xl" title="Rewards">
              <Trophy className="w-4 h-4" />
            </button>
            <button onClick={() => onOpenBag()} className="p-2 bg-white/5 rounded-xl" title="Bag">
              <ShoppingBag className="w-4 h-4" />
            </button>
            <button onClick={() => onOpenQrScan()} className="p-2 bg-white/5 rounded-xl" title="Scan QR">
              <MessageCircle className="w-4 h-4" />
            </button>
            <button onClick={() => onOpenPartnerships()} className="p-2 bg-white/5 rounded-xl" title="Partnerships">
              <Plug className="w-4 h-4" />
            </button>
            <button onClick={() => onOpenSubscriptions()} className="p-2 bg-white/5 rounded-xl" title="Subscriptions">
              <Crown className="w-4 h-4" />
            </button>
            <button onClick={() => onOpenProfile()} className="p-2 bg-white/5 rounded-xl" title="Profile">
              <User className="w-4 h-4" />
            </button>
            <button onClick={() => onOpenWhatsApp()} className="p-2 bg-white/5 rounded-xl" title="WhatsApp Flows">
              <MessageCircle className="w-4 h-4" />
            </button>
            <button onClick={() => onOpenSellerStudio()} className="p-2 bg-white/5 rounded-xl" title="Seller Studio">
              <Store className="w-4 h-4" />
            </button>
            <button onClick={() => onOpenRFQ()} className="p-2 bg-white/5 rounded-xl" title="RFQ">
              <MessageCircle className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Main Chat */}
      <div className="flex-1 flex flex-col">
        <div className="p-5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsSidebarOpen(prev => !prev)}
              className="sm:hidden p-2 bg-white/10 rounded-xl"
            >
              <MessageCircle className="w-4 h-4 text-white" />
            </button>
            <div className="p-2 bg-white/10 rounded-xl">
              <Sparkles className="w-4 h-4 text-amber-300" />
            </div>
            <div>
              <p className="text-sm font-black">Sconnect Assistant</p>
              <p className="text-[10px] text-white/60">Connected (stub) • Streaming enabled</p>
            </div>
          </div>
          <button 
            onClick={() => onToast('Assistant is running in stub mode.')}
            className="text-[10px] font-bold bg-white/10 px-3 py-1 rounded-full"
          >
            LiteLLM Stub
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {activeMessages.map((msg, i) => (
            <div key={i} className={`max-w-[85%] ${msg.role === 'user' ? 'ml-auto text-right' : ''}`}>
              <div className={`px-4 py-3 rounded-2xl text-sm ${msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-white/10 text-white'}`}>
                {msg.content}
              </div>
              {msg.actions && msg.actions.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {msg.actions.map((action, idx) => (
                    <button
                      key={idx}
                      onClick={action.onClick}
                      className="px-3 py-1.5 bg-white/10 rounded-full text-[10px] font-bold hover:bg-white/20 transition-colors"
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

        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-2 mb-3">
            <button
              onClick={() => onOpenSearchAction('voice search', 'voice')}
              className="px-3 py-2 bg-white/10 rounded-full text-[10px] font-bold flex items-center gap-2"
            >
              <Mic className="w-3 h-3" /> Voice
            </button>
            <button
              onClick={() => onOpenSearchAction('photo search', 'photo')}
              className="px-3 py-2 bg-white/10 rounded-full text-[10px] font-bold flex items-center gap-2"
            >
              <Camera className="w-3 h-3" /> Photo
            </button>
            <button
              onClick={() => onOpenSearchAction('video search', 'video')}
              className="px-3 py-2 bg-white/10 rounded-full text-[10px] font-bold flex items-center gap-2"
            >
              <Video className="w-3 h-3" /> Video
            </button>
            <button
              onClick={() => onOpenSearchAction('hybrid search', 'hybrid')}
              className="px-3 py-2 bg-white/10 rounded-full text-[10px] font-bold flex items-center gap-2"
            >
              <Sparkles className="w-3 h-3" /> Hybrid
            </button>
          </div>
          <div className="flex flex-wrap gap-2 mb-3">
            {QUICK_PROMPTS.map(prompt => (
              <button 
                key={prompt}
                onClick={() => setInput(prompt)}
                className="px-3 py-1.5 bg-white/10 rounded-full text-[10px] font-bold hover:bg-white/20 transition-colors"
              >
                {prompt}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2 mb-3">
            {COMMAND_HELP.map(cmd => (
              <span key={cmd} className="px-2 py-1 bg-white/5 rounded-full text-[9px] font-bold text-white/70">
                {cmd}
              </span>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <input
              className="flex-1 bg-white/10 rounded-2xl px-4 py-3 text-sm outline-none"
              placeholder="Ask me to search, compare, or buy..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            />
            <button 
              onClick={handleSend}
              className="p-3 bg-emerald-500 rounded-2xl text-white"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
