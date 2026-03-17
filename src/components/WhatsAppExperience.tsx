import React, { useEffect, useState } from 'react';
import { MessageCircle, Sparkles, Zap, Gift, Bell, Share2, ShieldCheck, Database, WifiOff, Mic, CheckCircle2 } from 'lucide-react';
import {
  createWhatsAppEvent,
  getWhatsAppConsent,
  getWhatsAppStatus,
  listWhatsAppEvents,
  optInWhatsApp,
  optOutWhatsApp,
  sendWhatsAppMessage,
  type WhatsAppConsent,
  type WhatsAppEvent
} from '../lib/whatsappApi';

type ChatLine = {
  role: 'user' | 'bot' | 'system';
  text: string;
};

const ChatCard: React.FC<{ title: string; lines: ChatLine[] }> = ({ title, lines }) => (
  <div className="bg-white rounded-3xl border border-zinc-100 p-5 shadow-sm">
    <div className="flex items-center gap-2 mb-4">
      <div className="p-2 bg-emerald-50 rounded-xl">
        <MessageCircle className="w-4 h-4 text-emerald-600" />
      </div>
      <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400">{title}</h3>
    </div>
    <div className="space-y-2">
      {lines.map((line, idx) => (
        <div
          key={idx}
          className={`max-w-[90%] rounded-2xl px-4 py-3 text-[11px] font-bold leading-relaxed ${
            line.role === 'user'
              ? 'ml-auto bg-emerald-600 text-white'
              : line.role === 'system'
              ? 'bg-zinc-100 text-zinc-600'
              : 'bg-zinc-900 text-white'
          }`}
        >
          {line.text}
        </div>
      ))}
    </div>
  </div>
);

export const WhatsAppExperience: React.FC = () => {
  const [events, setEvents] = useState<WhatsAppEvent[]>([]);
  const [consent, setConsent] = useState<WhatsAppConsent | null>(null);
  const [phone, setPhone] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [lastMessageId, setLastMessageId] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    const load = async () => {
      setLoading(true);
      try {
        const [consentResp, eventItems] = await Promise.all([
          getWhatsAppConsent(),
          listWhatsAppEvents(12),
        ]);
        if (ignore) return;
        setConsent(consentResp);
        setEvents(eventItems);
      } catch (err: any) {
        if (!ignore) {
          setStatusMessage(err?.message || 'Unable to load WhatsApp state.');
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    load();
    return () => {
      ignore = true;
    };
  }, []);

  const refreshEvents = async () => {
    try {
      const eventItems = await listWhatsAppEvents(12);
      setEvents(eventItems);
    } catch {}
  };

  const handleOptIn = async () => {
    setStatusMessage(null);
    try {
      const next = await optInWhatsApp({ consent_version: 'v1' });
      setConsent(next);
      setStatusMessage('WhatsApp opt-in saved.');
    } catch (err: any) {
      setStatusMessage(err?.message || 'Unable to opt in.');
    }
  };

  const handleOptOut = async () => {
    setStatusMessage(null);
    try {
      const next = await optOutWhatsApp({ consent_version: 'v1' });
      setConsent(next);
      setStatusMessage('WhatsApp opt-out saved.');
    } catch (err: any) {
      setStatusMessage(err?.message || 'Unable to opt out.');
    }
  };

  const handleAction = async (payload: {
    type: string;
    content: string;
    reward: string;
    metadata?: Record<string, string>;
  }) => {
    if (!phone.trim()) {
      setStatusMessage('Phone number is required.');
      return;
    }
    if (consent?.status !== 'opted_in') {
      setStatusMessage('Please opt in to WhatsApp first.');
      return;
    }
    setSending(true);
    setStatusMessage(null);
    try {
      await createWhatsAppEvent({
        type: payload.type,
        payload: {
          summary: payload.reward,
          ...payload.metadata,
        },
      });
      const msg = await sendWhatsAppMessage({
        phone: phone.trim(),
        content: payload.content,
        type: payload.type,
        event_type: payload.type,
        channel: 'whatsapp',
        metadata: payload.metadata ?? {},
      });
      setLastMessageId(msg?.id || null);
      setStatusMessage(msg?.status ? `${payload.reward} • ${msg.status}` : payload.reward);
      const messageId = msg?.id;
      if (messageId) {
        window.setTimeout(async () => {
          try {
            const status = await getWhatsAppStatus(messageId);
            if (status?.status) {
              setStatusMessage(`${payload.reward} • ${status.status}`);
            }
          } catch {}
        }, 1200);
      }
      refreshEvents();
    } catch (err: any) {
      setStatusMessage(err?.message || 'Action failed.');
    } finally {
      setSending(false);
    }
  };

  const formatEvent = (event: WhatsAppEvent) => {
    const summary = event.payload?.summary || event.payload?.message || event.payload?.action;
    return `${event.type || 'event'}${summary ? ` • ${summary}` : ''}`;
  };

  return (
    <div className="h-full bg-zinc-50 flex flex-col overflow-y-auto no-scrollbar">
      <div className="p-6 bg-white border-b border-zinc-100 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-black">SC</div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600">WhatsApp + PWA</p>
            <h1 className="text-xl font-bold text-zinc-900">Consumer Experience Flows</h1>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        <div className="bg-white rounded-3xl border border-zinc-100 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Interactive Demo</p>
              <h3 className="text-sm font-bold text-zinc-900">Tap any action to simulate the full consumer loop</h3>
            </div>
            <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-600">
              <CheckCircle2 className="w-4 h-4" /> Live
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[10px] font-bold">
            <button
              onClick={() =>
                handleAction({
                  type: 'search',
                  content: 'Multi-modal search triggered (text + voice + photo).',
                  reward: 'Search complete',
                  metadata: { action: 'search' }
                })
              }
              disabled={sending}
              className="p-3 bg-zinc-100 rounded-2xl text-zinc-700 flex items-center gap-2 disabled:opacity-50"
            >
              <Zap className="w-3 h-3" /> Search
            </button>
            <button
              onClick={() =>
                handleAction({
                  type: 'reward',
                  content: 'Receipt OCR processed. KES 15 M-PESA sent.',
                  reward: 'KES 15 sent',
                  metadata: { action: 'receipt_reward' }
                })
              }
              disabled={sending}
              className="p-3 bg-emerald-50 rounded-2xl text-emerald-700 flex items-center gap-2 disabled:opacity-50"
            >
              <Gift className="w-3 h-3" /> Receipt Reward
            </button>
            <button
              onClick={() =>
                handleAction({
                  type: 'price_alert',
                  content: 'Price drop alert fired for watched item.',
                  reward: 'Alert delivered',
                  metadata: { action: 'price_alert' }
                })
              }
              disabled={sending}
              className="p-3 bg-indigo-50 rounded-2xl text-indigo-700 flex items-center gap-2 disabled:opacity-50"
            >
              <Bell className="w-3 h-3" /> Price Alert
            </button>
            <button
              onClick={() =>
                handleAction({
                  type: 'referral',
                  content: 'Referral confirmed. Both users earned KES 15.',
                  reward: 'KES 15 + KES 15',
                  metadata: { action: 'referral' }
                })
              }
              disabled={sending}
              className="p-3 bg-amber-50 rounded-2xl text-amber-700 flex items-center gap-2 disabled:opacity-50"
            >
              <Share2 className="w-3 h-3" /> Referral
            </button>
            <button
              onClick={() =>
                handleAction({
                  type: 'verification',
                  content: 'Verified seller badge viewed. Trust score updated.',
                  reward: 'Trust verified',
                  metadata: { action: 'trust_check' }
                })
              }
              disabled={sending}
              className="p-3 bg-blue-50 rounded-2xl text-blue-700 flex items-center gap-2 disabled:opacity-50"
            >
              <ShieldCheck className="w-3 h-3" /> Trust Check
            </button>
            <button
              onClick={() =>
                handleAction({
                  type: 'data_control',
                  content: 'Data dashboard opened. Export + delete ready.',
                  reward: 'Data control',
                  metadata: { action: 'data_control' }
                })
              }
              disabled={sending}
              className="p-3 bg-slate-100 rounded-2xl text-slate-700 flex items-center gap-2 disabled:opacity-50"
            >
              <Database className="w-3 h-3" /> Data Control
            </button>
            <button
              onClick={() =>
                handleAction({
                  type: 'offline_sync',
                  content: 'Offline queue synced. 2 receipts uploaded.',
                  reward: 'Synced',
                  metadata: { action: 'offline_sync' }
                })
              }
              disabled={sending}
              className="p-3 bg-zinc-100 rounded-2xl text-zinc-700 flex items-center gap-2 disabled:opacity-50"
            >
              <WifiOff className="w-3 h-3" /> Offline Sync
            </button>
            <button
              onClick={() =>
                handleAction({
                  type: 'voice_search',
                  content: 'Voice search detected Swahili + transcript chips.',
                  reward: 'Voice captured',
                  metadata: { action: 'voice_search' }
                })
              }
              disabled={sending}
              className="p-3 bg-zinc-100 rounded-2xl text-zinc-700 flex items-center gap-2 disabled:opacity-50"
            >
              <Mic className="w-3 h-3" /> Voice Search
            </button>
          </div>
          <div className="mt-3 space-y-2">
            <div className="grid grid-cols-1 md:grid-cols-[1.2fr_0.8fr] gap-2">
              <div className="p-3 bg-zinc-50 rounded-2xl text-[10px] font-bold text-zinc-600">
                <div className="mb-2 text-[9px] uppercase tracking-widest text-zinc-400">WhatsApp Settings</div>
                <div className="flex flex-col gap-2">
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Recipient phone (e.g. +2547...)"
                    className="w-full px-3 py-2 rounded-xl bg-white border border-zinc-200 text-[11px] font-bold text-zinc-700"
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-zinc-500">
                      Consent: {consent?.status || (loading ? 'loading' : 'unknown')}
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={handleOptIn}
                        className="px-2 py-1 rounded-full bg-emerald-600 text-white text-[10px] font-bold"
                      >
                        Opt In
                      </button>
                      <button
                        onClick={handleOptOut}
                        className="px-2 py-1 rounded-full bg-zinc-200 text-zinc-700 text-[10px] font-bold"
                      >
                        Opt Out
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-3 bg-emerald-50 rounded-2xl text-[10px] font-bold text-emerald-700 flex items-center justify-between">
                <span>
                  {statusMessage || (sending ? 'Sending…' : 'Ready')}
                  {lastMessageId ? ` • ${lastMessageId.slice(0, 8)}` : ''}
                </span>
                <span className="text-[9px] uppercase tracking-widest text-emerald-600">Status</span>
              </div>
            </div>
            {events.length > 0 && (
              <div className="space-y-2">
                {events.map((item) => (
                  <div key={item.id} className="p-3 bg-zinc-50 rounded-2xl text-[10px] font-bold text-zinc-600">
                    {formatEvent(item)}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-zinc-100 p-5 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-3">Consumer Feature Coverage</p>
          <div className="grid grid-cols-2 gap-2 text-[10px] font-bold text-zinc-700">
            <div className="p-3 bg-emerald-50 rounded-2xl">Search & Discovery ✓</div>
            <div className="p-3 bg-emerald-50 rounded-2xl">Rewards & Incentives ✓</div>
            <div className="p-3 bg-emerald-50 rounded-2xl">Trust & Safety ✓</div>
            <div className="p-3 bg-emerald-50 rounded-2xl">Personalization ✓</div>
            <div className="p-3 bg-emerald-50 rounded-2xl">Social & Community ✓</div>
            <div className="p-3 bg-emerald-50 rounded-2xl">Handoff & Tracking ✓</div>
            <div className="p-3 bg-emerald-50 rounded-2xl">Offline & Accessibility ✓</div>
            <div className="p-3 bg-emerald-50 rounded-2xl">Data Control ✓</div>
          </div>
        </div>

        <ChatCard
          title="Visual Search"
          lines={[
            { role: 'user', text: '👤 Opens WhatsApp → Sends photo of shoes someone is wearing' },
            { role: 'bot', text: '🤖 "Inachambua picha..."' },
            { role: 'bot', text: '🤖 "Hizi ni Nike Air Max 90. Zinapatikana katika maduka 3 karibu nawe:\n    • Shop A: KES 8,500 (CBD)\n    • Shop B: KES 9,200 (Westlands)\n    • Jumia: KES 8,990 (delivery 3 days)"' },
            { role: 'user', text: '👤 "Show me similar but cheaper"' },
            { role: 'bot', text: '🤖 "Nimepata Nike Air Max 97 bei KES 7,500, na Adidas zinalingana bei KES 7,200..."' }
          ]}
        />

        <ChatCard
          title="Conversational AI"
          lines={[
            { role: 'user', text: '👤 "Natafuta charger"' },
            { role: 'bot', text: '🤖 "Charger ya simu gani?"' },
            { role: 'user', text: '👤 "Samsung"' },
            { role: 'bot', text: '🤖 "Aina gani? Fast charging, wireless, au ya kawaida?"' },
            { role: 'user', text: '👤 "Fast charging"' },
            { role: 'bot', text: '🤖 "Nimepata fast charging Samsung 25W:\n    • Shop A: KES 1,200 (CBD)\n    • Shop B: KES 1,350 (Westlands)\n    • Jumia: KES 1,150 (delivery kesho)"' }
          ]}
        />

        <ChatCard
          title="Price Drop Alerts"
          lines={[
            { role: 'user', text: '👤 Searches "Samsung TV 55-inch"' },
            { role: 'bot', text: '🤖 Shows results with "Good Deal" badge on one option' },
            { role: 'user', text: '👤 Clicks "Watch" on a TV priced at KES 55,000' },
            { role: 'bot', text: '🤖 "Bei gani unataka? Tuma namba"' },
            { role: 'user', text: '👤 "50000"' },
            { role: 'bot', text: '🤖 "Tutakujulisha ikipungua hadi KES 50,000"' },
            { role: 'system', text: '[Two weeks later]' },
            { role: 'bot', text: '🤖 "🔔 ALERT: Samsung TV 55-inch imeshuka bei!\n    Sasa: KES 49,500 (hapo awali KES 55,000)\n    Shop: Electronics Express, CBD"' },
            { role: 'user', text: '👤 Clicks to view' }
          ]}
        />

        <ChatCard
          title="Receipt Upload Rewards"
          lines={[
            { role: 'user', text: '👤 After shopping, takes photo of receipt' },
            { role: 'user', text: '👤 Sends to SokoConnect WhatsApp' },
            { role: 'bot', text: '🤖 "Inachambua risiti yako..."' },
            { role: 'bot', text: '🤖 "Risiti imechambuliwa! Umenunua:\n    • Unga 2kg - KES 180\n    • Sukari 1kg - KES 150\n    • Maziwa - KES 60\n    Umepokea KES 15 M-PESA!"' },
            { role: 'system', text: '💰 M-PESA: "Umepokea KES 15 kutoka SokoConnect"' },
            { role: 'bot', text: '🤖 "Umepakia risiti 5 mfululizo! Siku 2 zaidi kupata bonus KES 50 ✨"' }
          ]}
        />

        <ChatCard
          title="Purchase Confirmation Rewards"
          lines={[
            { role: 'system', text: '[3 days after handoff]' },
            { role: 'bot', text: '🤖 "Habari! Ulinunua Samsung TV kutoka Shop A?"' },
            { role: 'user', text: '👤 "NDIO"' },
            { role: 'bot', text: '🤖 "Hongera! Umepokea KES 5 M-PESA.\n    Taka kutuma picha ya TV? Pata KES 10 zaidi"' },
            { role: 'user', text: '👤 Sends photo of TV in their home' },
            { role: 'bot', text: '🤖 "Asante! Umepokea KES 10. Taka kuacha review kwa shop?"' },
            { role: 'user', text: '👤 "Shop alikuwa mwema, TV original"' },
            { role: 'bot', text: '🤖 "Review imehifadhiwa. Umepokea KES 5 bonus!"' }
          ]}
        />

        <ChatCard
          title="Referral Rewards"
          lines={[
            { role: 'bot', text: '🤖 "Rafiki yako anatafuta bidhaa? Mwalike kwa SokoConnect!\n    Utapata KES 15 na rafiki yako atapata KES 15.\n    Tuma namba ya rafiki yako"' },
            { role: 'user', text: '👤 "0712345678"' },
            { role: 'bot', text: '🤖 "Invitation imetumwa. Rafiki yako atapokea KES 15 akijiandikisha."' },
            { role: 'system', text: '[Friend joins, uploads receipt]' },
            { role: 'system', text: '💰 "Hongera! Rafiki yako amejiandikisha. Umepokea KES 15 M-PESA!"' }
          ]}
        />

        <ChatCard
          title="Community Q&A"
          lines={[
            { role: 'user', text: '👤 On shop page: "Maswali kutoka kwa wateja:\n    Q: \'Shop hii inauza original?\' - John\n    A: \'Nimenunua mara 3, zote original\' - Mary ✓"' },
            { role: 'bot', text: '👤 Can ask own question' }
          ]}
        />

        <ChatCard
          title="Leaderboard"
          lines={[
            { role: 'system', text: '[Sunday evening]' },
            { role: 'bot', text: '🤖 "📊 LEADERBOARD - KAWANGWARE\n    1. John M. - risiti 45\n    2. Mary W. - risiti 38\n    3. Peter K. - risiti 31\n    Wewe: risiti 23 - nafasi 5\n    \n    Wiki ijayo uwe juu! ✨"' }
          ]}
        />

        <ChatCard
          title="Trending Alert"
          lines={[
            { role: 'bot', text: '🤖 "🔔 Unga imerudi stock kwa Shop A karibu nawe.\n    Uliangalia wiki iliyopita bei KES 180. Sasa KES 175.\n    Taka kuona?"' }
          ]}
        />

        <div className="bg-emerald-600 text-white rounded-3xl p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-emerald-100">Always On</p>
            <p className="text-sm font-bold">WhatsApp + PWA, zero friction, instant rewards.</p>
          </div>
          <Sparkles className="w-5 h-5 text-emerald-100" />
        </div>
      </div>
    </div>
  );
};
