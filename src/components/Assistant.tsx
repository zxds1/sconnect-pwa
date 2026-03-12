import React, { useEffect, useRef, useState } from 'react';
import { Sparkles, Send, Search, ShoppingBag, ArrowRightLeft, User, Trophy, MessageCircle, Plug, Mic, Camera, Video, Star, Plus, BadgeCheck, TrendingUp, ChevronRight } from 'lucide-react';
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
  const [showMediaTray, setShowMediaTray] = useState(false);
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
  const suggestionChips = [
    { label: 'Search for rice deals', value: '/search rice deals' },
    { label: 'Take a photo of shelf', value: '/photo shelf photo' },
    { label: 'Compare Omo vs Sunlight', value: '/compare Omo vs Sunlight' },
    { label: 'Start RFQ for sugar', value: '/rfq sugar 50kg' },
    { label: 'Open rewards', value: '/rewards' }
  ];

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

            <div className="mt-4 space-y-2">
              <button
                onClick={() => setChats(prev => [{
                  id: `chat_${Date.now()}`,
                  title: 'New chat',
                  messages: [
                    {
                      role: 'assistant',
                      content: 'Hi! I’m your Sconnect assistant. Ask me to search, compare, add to bag, open a shop, or start an RFQ.',
                    }
                  ],
                  updatedAt: Date.now()
                }, ...prev])}
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
                        onClick={() => setChats(prev => prev.map(c => c.id === chat.id ? { ...c, pinned: !c.pinned } : c))}
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
                  setIsSidebarOpen(false);
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
          <button
            onClick={onOpenProfile}
            className="h-11 w-11 rounded-full bg-white/10 flex items-center justify-center"
            aria-label="Open profile"
          >
            <User className="w-5 h-5" />
          </button>
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
              <div key={i} className={`max-w-[90%] ${msg.role === 'user' ? 'ml-auto text-right' : ''}`}>
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
    </div>
  );
};
