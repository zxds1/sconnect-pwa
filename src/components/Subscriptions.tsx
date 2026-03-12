import React, { useState } from 'react';
import { Crown, Lock, CheckCircle2, ShieldCheck, BarChart3, Wallet, Megaphone } from 'lucide-react';

type Tab = 'duka' | 'brand' | 'billing';

type Props = {
  onBack?: () => void;
};

export const Subscriptions: React.FC<Props> = ({ onBack }) => {
  const [tab, setTab] = useState<Tab>('duka');
  const [showSuccess, setShowSuccess] = useState(false);

  return (
    <div className="h-full bg-zinc-50 flex flex-col overflow-y-auto no-scrollbar">
      <div className="p-4 bg-white border-b border-zinc-100 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-black text-zinc-900">Subscriptions</p>
            <p className="text-[10px] text-zinc-500">Upgrade paths and billing</p>
          </div>
          {onBack && (
            <button onClick={onBack} className="text-[10px] font-black text-zinc-500">Close</button>
          )}
        </div>
        <div className="mt-3 flex items-center gap-2">
          {[
            { id: 'duka', label: 'Duka Plans' },
            { id: 'brand', label: 'Brand Plans' },
            { id: 'billing', label: 'Billing' }
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setTab(item.id as Tab)}
              className={`px-4 py-2 rounded-full text-[10px] font-black ${tab === item.id ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-600'}`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-6 space-y-6">
        {tab === 'duka' && (
          <>
            <section className="bg-white rounded-3xl border border-zinc-100 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Crown className="w-4 h-4 text-amber-500" />
                  <h3 className="text-xs font-black uppercase tracking-widest text-zinc-500">Free Tier Dashboard</h3>
                </div>
                <div className="text-[10px] font-black text-indigo-600">247⭐ • #3 Rank</div>
              </div>
              <div className="bg-zinc-50 rounded-2xl p-4">
                <div className="flex items-center gap-2 text-[10px] font-black text-zinc-500 mb-3">
                  <Lock className="w-3 h-3" /> PRO FEATURES LOCKED
                </div>
                <div className="space-y-2 text-[10px] font-bold text-zinc-600">
                  <div>✓ Unlimited buyer insights</div>
                  <div>✓ Competitor prices</div>
                  <div>✓ Priority demand alerts</div>
                  <div>✓ Neighborhood heatmap</div>
                </div>
                <div className="mt-4 text-[10px] font-bold text-zinc-500">"127 buyers today - who?"</div>
              </div>
              <button
                onClick={() => setShowSuccess(true)}
                className="mt-4 w-full py-3 bg-blue-600 text-white rounded-xl text-[10px] font-black"
              >
                Upgrade KSh2k
              </button>
            </section>

            <section className="bg-white rounded-3xl border border-zinc-100 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-black uppercase tracking-widest text-zinc-500">Upgrade to Pro</h3>
                <span className="text-[10px] font-black text-blue-600">First month KSh1k</span>
              </div>
              <div className="space-y-2 text-[10px] font-bold text-zinc-600">
                <div>🎯 See every buyer’s name</div>
                <div>🏪 Ali KSh580 vs You KSh620</div>
                <div>🔔 “Omo +47% NOW” WhatsApp alerts</div>
                <div>🗺️ Kibera demand heatmap</div>
              </div>
              <div className="mt-4 p-3 bg-blue-50 rounded-2xl text-[10px] font-bold text-blue-700">30-day guarantee</div>
              <button
                onClick={() => setShowSuccess(true)}
                className="mt-4 w-full py-3 bg-blue-600 text-white rounded-xl text-[10px] font-black"
              >
                Subscribe
              </button>
            </section>

            <section className="bg-white rounded-3xl border border-zinc-100 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-black uppercase tracking-widest text-zinc-500">Enterprise Plan</h3>
                <span className="text-[10px] font-black text-zinc-900">KSh20,000 / month</span>
              </div>
              <div className="space-y-2 text-[10px] font-bold text-zinc-600">
                <div>💾 Full buyer CSV export</div>
                <div>🔗 Live API integration</div>
                <div>🏢 Multi-branch dashboard</div>
                <div>👨‍💼 Dedicated rep</div>
              </div>
              <button className="mt-4 w-full py-3 bg-zinc-900 text-white rounded-xl text-[10px] font-black">Demo Call</button>
            </section>

            {showSuccess && (
              <section className="bg-emerald-50 border border-emerald-100 rounded-3xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-xs font-black uppercase tracking-widest text-emerald-600">Pro Activated</h3>
                </div>
                <div className="space-y-2 text-[10px] font-bold text-emerald-700">
                  <div>⭐ Unlimited stars display</div>
                  <div>👥 Priya bought Omo x2</div>
                  <div>📈 Ali dropped to KSh580</div>
                  <div>🔔 Demand alerts ON</div>
                </div>
                <button className="mt-3 w-full py-3 bg-emerald-600 text-white rounded-xl text-[10px] font-black">View Buyer Insights →</button>
              </section>
            )}
          </>
        )}

        {tab === 'brand' && (
          <>
            <section className="bg-white rounded-3xl border border-zinc-100 p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <Megaphone className="w-4 h-4 text-indigo-600" />
                <h3 className="text-xs font-black uppercase tracking-widest text-zinc-500">Market Insights Teaser</h3>
              </div>
              <div className="space-y-2 text-[10px] font-bold text-zinc-600">
                <div>🥇 Jane’s Duka 127 sales</div>
                <div>🥈 Ali’s Shop 98 sales</div>
                <div>📈 Kibera demand +47%</div>
              </div>
              <div className="mt-4 p-3 bg-zinc-50 rounded-2xl text-[10px] font-bold text-zinc-600">🔒 Unlock Top 100 Dukas</div>
              <button className="mt-4 w-full py-3 bg-blue-600 text-white rounded-xl text-[10px] font-black">Start Free Week</button>
            </section>

            <section className="bg-white rounded-3xl border border-zinc-100 p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <BarChart3 className="w-4 h-4 text-emerald-600" />
                <h3 className="text-xs font-black uppercase tracking-widest text-zinc-500">Demand Intelligence</h3>
              </div>
              <div className="space-y-2 text-[10px] font-bold text-zinc-600">
                <div>🗺️ Real-time heatmaps</div>
                <div>📊 Buyer repeat rates</div>
                <div>💰 Price by neighborhood</div>
                <div>🔗 Full API + CSV exports</div>
              </div>
              <div className="mt-4 text-[10px] font-black text-zinc-900">KSh500,000 / month</div>
              <button className="mt-3 w-full py-3 bg-blue-600 text-white rounded-xl text-[10px] font-black">14-Day Trial</button>
              <button className="mt-2 w-full py-3 bg-zinc-900 text-white rounded-xl text-[10px] font-black">Enterprise Demo</button>
            </section>

            <section className="bg-white rounded-3xl border border-zinc-100 p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <ShieldCheck className="w-4 h-4 text-amber-500" />
                <h3 className="text-xs font-black uppercase tracking-widest text-zinc-500">Enterprise Platform</h3>
              </div>
              <div className="space-y-2 text-[10px] font-bold text-zinc-600">
                <div>🏪 Complete consumer dataset</div>
                <div>🤖 Predictive restocking AI</div>
                <div>📈 Custom executive reports</div>
                <div>👨‍💼 On-site implementation</div>
              </div>
              <div className="mt-4 text-[10px] font-black text-zinc-900">KSh2,000,000 / month</div>
              <button className="mt-3 w-full py-3 bg-blue-600 text-white rounded-xl text-[10px] font-black">CFO Call</button>
            </section>

            <section className="bg-blue-600 text-white rounded-3xl p-5">
              <div className="text-[10px] font-black uppercase tracking-widest text-blue-100">Duka Intelligence Platform</div>
              <div className="mt-2 text-sm font-black">Kenya’s 190k shops live</div>
              <div className="mt-3 space-y-2 text-[10px] font-bold text-blue-100">
                <div>📊 16k dukas verified</div>
                <div>🗺️ Kibera Omo +47% NOW</div>
                <div>🏆 Top 5 = 67% sales</div>
              </div>
              <div className="mt-4 flex gap-2">
                <button className="flex-1 py-3 bg-white text-blue-600 rounded-xl text-[10px] font-black">Free 14-Day Trial</button>
                <button className="flex-1 py-3 bg-blue-500 rounded-xl text-[10px] font-black">KSh100k/mo</button>
              </div>
            </section>
          </>
        )}

        {tab === 'billing' && (
          <section className="bg-white rounded-3xl border border-zinc-100 p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Wallet className="w-4 h-4 text-emerald-600" />
              <h3 className="text-xs font-black uppercase tracking-widest text-zinc-500">Subscription</h3>
            </div>
            <div className="text-[10px] font-bold text-zinc-600 space-y-2">
              <div>PRO Plan</div>
              <div>KSh2,000 × 1 month</div>
              <div>Next: Mar 20th</div>
              <div>M-Pesa Till: 123456</div>
              <div>Usage: 127 scans/mo</div>
              <div>⭐ Stars earned: 247</div>
            </div>
            <div className="mt-4 flex gap-2">
              <button className="flex-1 py-3 bg-zinc-900 text-white rounded-xl text-[10px] font-black">Change Plan</button>
              <button className="flex-1 py-3 bg-zinc-100 text-zinc-600 rounded-xl text-[10px] font-black">Cancel</button>
            </div>
          </section>
        )}
      </div>
    </div>
  );
};
