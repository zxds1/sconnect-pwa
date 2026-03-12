import React, { useState } from 'react';
import { MessageCircle, Sparkles, Zap, Gift, Bell, Share2, ShieldCheck, Database, WifiOff, Mic, CheckCircle2 } from 'lucide-react';

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
  const [demoLog, setDemoLog] = useState<Array<{ id: string; text: string }>>([]);
  const [demoReward, setDemoReward] = useState<string | null>(null);

  const pushDemo = (text: string, reward?: string) => {
    setDemoLog(prev => [{ id: `d_${Date.now()}`, text }, ...prev].slice(0, 6));
    if (reward) {
      setDemoReward(reward);
      window.setTimeout(() => setDemoReward(null), 2000);
    }
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
            <button onClick={() => pushDemo('Multi-modal search triggered (text + voice + photo).', 'Search complete')} className="p-3 bg-zinc-100 rounded-2xl text-zinc-700 flex items-center gap-2">
              <Zap className="w-3 h-3" /> Search
            </button>
            <button onClick={() => pushDemo('Receipt OCR processed. KES 15 M-PESA sent.', 'KES 15 sent')} className="p-3 bg-emerald-50 rounded-2xl text-emerald-700 flex items-center gap-2">
              <Gift className="w-3 h-3" /> Receipt Reward
            </button>
            <button onClick={() => pushDemo('Price drop alert fired for watched item.', 'Alert delivered')} className="p-3 bg-indigo-50 rounded-2xl text-indigo-700 flex items-center gap-2">
              <Bell className="w-3 h-3" /> Price Alert
            </button>
            <button onClick={() => pushDemo('Referral confirmed. Both users earned KES 15.', 'KES 15 + KES 15')} className="p-3 bg-amber-50 rounded-2xl text-amber-700 flex items-center gap-2">
              <Share2 className="w-3 h-3" /> Referral
            </button>
            <button onClick={() => pushDemo('Verified seller badge viewed. Trust score updated.', 'Trust verified')} className="p-3 bg-blue-50 rounded-2xl text-blue-700 flex items-center gap-2">
              <ShieldCheck className="w-3 h-3" /> Trust Check
            </button>
            <button onClick={() => pushDemo('Data dashboard opened. Export + delete ready.', 'Data control')} className="p-3 bg-slate-100 rounded-2xl text-slate-700 flex items-center gap-2">
              <Database className="w-3 h-3" /> Data Control
            </button>
            <button onClick={() => pushDemo('Offline queue synced. 2 receipts uploaded.', 'Synced')} className="p-3 bg-zinc-100 rounded-2xl text-zinc-700 flex items-center gap-2">
              <WifiOff className="w-3 h-3" /> Offline Sync
            </button>
            <button onClick={() => pushDemo('Voice search detected Swahili + transcript chips.', 'Voice captured')} className="p-3 bg-zinc-100 rounded-2xl text-zinc-700 flex items-center gap-2">
              <Mic className="w-3 h-3" /> Voice Search
            </button>
          </div>
          {demoReward && (
            <div className="mt-3 p-3 bg-emerald-600 text-white rounded-2xl text-[10px] font-black">
              {demoReward}
            </div>
          )}
          {demoLog.length > 0 && (
            <div className="mt-3 space-y-2">
              {demoLog.map(item => (
                <div key={item.id} className="p-3 bg-zinc-50 rounded-2xl text-[10px] font-bold text-zinc-600">
                  {item.text}
                </div>
              ))}
            </div>
          )}
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
