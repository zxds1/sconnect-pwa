import React from 'react';
import { Download, Trash2, ShieldCheck, Database, CalendarDays, FileText, Eye, CheckCircle2 } from 'lucide-react';

interface DataDashboardProps {
  onBack?: () => void;
}

const AUDIT_LOG = [
  { id: 'a1', action: 'Receipt uploaded', detail: 'Unga 2kg • KES 180', date: 'Today' },
  { id: 'a2', action: 'Search', detail: 'Samsung TV 55-inch', date: 'Today' },
  { id: 'a3', action: 'Purchase confirmed', detail: 'Shop A • KES 49,500', date: 'Yesterday' },
  { id: 'a4', action: 'Review submitted', detail: '5 stars • Verified', date: '2 days ago' },
  { id: 'a5', action: 'Referral reward', detail: 'Friend joined • KES 15', date: '3 days ago' }
];

export const DataDashboard: React.FC<DataDashboardProps> = ({ onBack }) => {
  return (
    <div className="h-full bg-zinc-50 flex flex-col overflow-y-auto no-scrollbar">
      <div className="p-6 bg-white border-b border-zinc-100 sticky top-0 z-10 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Data Dashboard</p>
          <h1 className="text-xl font-bold text-zinc-900">Your Data, Your Control</h1>
        </div>
        {onBack && (
          <button onClick={onBack} className="px-4 py-2 bg-zinc-900 text-white rounded-xl text-[10px] font-black">
            Back
          </button>
        )}
      </div>

      <div className="p-6 space-y-6">
        <section className="bg-white rounded-3xl border border-zinc-100 p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <Database className="w-5 h-5 text-emerald-500" />
            <div>
              <p className="text-sm font-bold text-zinc-900">View My Data</p>
              <p className="text-[10px] text-zinc-500">Summary of what SokoConnect stores about you.</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 text-[10px] font-bold text-zinc-600">
            <div className="p-3 bg-zinc-50 rounded-2xl">Searches: 347</div>
            <div className="p-3 bg-zinc-50 rounded-2xl">Receipts: 128</div>
            <div className="p-3 bg-zinc-50 rounded-2xl">Purchases: 34</div>
            <div className="p-3 bg-zinc-50 rounded-2xl">Reviews: 19</div>
          </div>
        </section>

        <section className="bg-white rounded-3xl border border-zinc-100 p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <Eye className="w-5 h-5 text-indigo-500" />
            <div>
              <p className="text-sm font-bold text-zinc-900">Consent Management</p>
              <p className="text-[10px] text-zinc-500">Control what data is shared and with whom.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-2 text-[10px] font-bold text-zinc-600">
            <div className="p-3 bg-zinc-50 rounded-2xl">Location for “near me” search • Enabled</div>
            <div className="p-3 bg-zinc-50 rounded-2xl">Receipt uploads for price intelligence • Enabled</div>
            <div className="p-3 bg-zinc-50 rounded-2xl">Personalized recommendations • Enabled</div>
            <div className="p-3 bg-zinc-50 rounded-2xl">Marketing and promotions • Disabled</div>
          </div>
        </section>

        <section className="bg-white rounded-3xl border border-zinc-100 p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <Download className="w-5 h-5 text-indigo-500" />
            <div>
              <p className="text-sm font-bold text-zinc-900">Download My Data</p>
              <p className="text-[10px] text-zinc-500">Export your searches, receipts, and purchases.</p>
            </div>
          </div>
          <button className="w-full py-3 bg-zinc-900 text-white rounded-xl text-xs font-bold">
            Export Data
          </button>
        </section>

        <section className="bg-white rounded-3xl border border-zinc-100 p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <FileText className="w-5 h-5 text-amber-500" />
            <div>
              <p className="text-sm font-bold text-zinc-900">Audit Log</p>
              <p className="text-[10px] text-zinc-500">Transparent history of your data activity.</p>
            </div>
          </div>
          <div className="space-y-2">
            {AUDIT_LOG.map(entry => (
              <div key={entry.id} className="p-3 bg-zinc-50 rounded-2xl text-[10px] font-bold text-zinc-700 flex items-center justify-between">
                <div>
                  <p>{entry.action}</p>
                  <p className="text-[9px] text-zinc-400">{entry.detail}</p>
                </div>
                <span className="text-[9px] text-zinc-400">{entry.date}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-white rounded-3xl border border-emerald-100 p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <ShieldCheck className="w-5 h-5 text-emerald-500" />
            <div>
              <p className="text-sm font-bold text-zinc-900">Data Protection</p>
              <p className="text-[10px] text-zinc-500">We protect your data with verified access logs.</p>
            </div>
          </div>
          <div className="p-3 bg-emerald-50 rounded-2xl text-[10px] font-bold text-emerald-700 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" /> Last access verified • 2 hours ago
          </div>
        </section>

        <section className="bg-white rounded-3xl border border-red-100 p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <Trash2 className="w-5 h-5 text-red-500" />
            <div>
              <p className="text-sm font-bold text-zinc-900">Delete My Data</p>
              <p className="text-[10px] text-zinc-500">Request permanent deletion of your data.</p>
            </div>
          </div>
          <button className="w-full py-3 bg-red-600 text-white rounded-xl text-xs font-bold">
            Request Data Deletion
          </button>
        </section>

        <section className="bg-white rounded-3xl border border-zinc-100 p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <CalendarDays className="w-5 h-5 text-blue-500" />
            <div>
              <p className="text-sm font-bold text-zinc-900">Data Retention</p>
              <p className="text-[10px] text-zinc-500">Receipts retained for 24 months unless deleted.</p>
            </div>
          </div>
          <div className="p-3 bg-zinc-50 rounded-2xl text-[10px] font-bold text-zinc-600">
            You can adjust retention settings in Consent Management.
          </div>
        </section>
      </div>
    </div>
  );
};
