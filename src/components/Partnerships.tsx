import React, { useMemo, useState } from 'react';
import { Plug, Search, Filter, Star, MapPin, ShieldCheck, Building2, Layers, Users } from 'lucide-react';
import { SELLERS, PRODUCTS } from '../mockData';

const SYSTEM_TYPES = ['ERP', 'POS', 'CRM', 'Ecommerce', 'Marketplace', 'CSV', 'Google Sheets', 'API'];
const DIRECTORY_TYPES = ['Shop', 'Ecommerce', 'Marketplace', 'ERP', 'POS', 'CRM'];

type PartnerEntry = {
  id: string;
  name: string;
  type: string;
  rating: number;
  location?: string;
  systems: string[];
  status: 'live' | 'paused';
  products: number;
  starsEarned: number;
  lastSync: string;
};

export const Partnerships: React.FC<{ onBack?: () => void; onOpenBrandChat?: () => void }> = ({ onBack, onOpenBrandChat }) => {
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | 'live' | 'paused'>('All');
  const [minRating, setMinRating] = useState(0);
  const [role, setRole] = useState<'viewer' | 'owner' | 'admin'>('viewer');

  const directory = useMemo<PartnerEntry[]>(() => {
    const shopEntries: PartnerEntry[] = SELLERS.slice(0, 40).map((s, idx) => {
      const shopProducts = PRODUCTS.filter(p => p.sellerId === s.id).length;
      return {
        id: s.id,
        name: s.name,
        type: 'Shop',
        rating: s.rating,
        location: s.location?.address,
        systems: ['POS', idx % 2 === 0 ? 'CSV' : 'Google Sheets'],
        status: idx % 5 === 0 ? 'paused' : 'live',
        products: shopProducts,
        starsEarned: 120 + (idx % 6) * 30,
        lastSync: idx % 2 === 0 ? '15m ago' : '2h ago'
      };
    });

    const platformEntries: PartnerEntry[] = [
      {
        id: 'jumia',
        name: 'Jumia Seller',
        type: 'Marketplace',
        rating: 4.6,
        location: 'Nationwide',
        systems: ['Marketplace', 'API'],
        status: 'live',
        products: 1247,
        starsEarned: 520,
        lastSync: '5m ago'
      },
      {
        id: 'kilimall',
        name: 'Kilimall',
        type: 'Marketplace',
        rating: 4.4,
        location: 'Nationwide',
        systems: ['Marketplace', 'API'],
        status: 'live',
        products: 892,
        starsEarned: 410,
        lastSync: '20m ago'
      },
      {
        id: 'sap',
        name: 'SAP Business One',
        type: 'ERP',
        rating: 4.8,
        location: 'Enterprise',
        systems: ['ERP', 'API'],
        status: 'live',
        products: 2595,
        starsEarned: 800,
        lastSync: '10m ago'
      },
      {
        id: 'odoo',
        name: 'Odoo ERP',
        type: 'ERP',
        rating: 4.5,
        location: 'Enterprise',
        systems: ['ERP', 'API'],
        status: 'paused',
        products: 640,
        starsEarned: 210,
        lastSync: '3d ago'
      },
      {
        id: 'zoho',
        name: 'Zoho CRM',
        type: 'CRM',
        rating: 4.3,
        location: 'Enterprise',
        systems: ['CRM', 'API'],
        status: 'live',
        products: 0,
        starsEarned: 150,
        lastSync: '1h ago'
      }
    ];

    return [...shopEntries, ...platformEntries];
  }, []);

  const filtered = useMemo(() => {
    return directory.filter(entry => {
      const matchesQuery = entry.name.toLowerCase().includes(query.toLowerCase());
      const matchesType = typeFilter === 'All' || entry.type === typeFilter;
      const matchesStatus = statusFilter === 'All' || entry.status === statusFilter;
      const matchesRating = entry.rating >= minRating;
      return matchesQuery && matchesType && matchesStatus && matchesRating;
    });
  }, [directory, query, typeFilter, statusFilter, minRating]);

  return (
    <div className="h-full bg-zinc-50 flex flex-col overflow-y-auto no-scrollbar">
      <div className="p-4 bg-white border-b border-zinc-100 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-black text-zinc-900">Data Partnerships Directory</p>
            <p className="text-[10px] text-zinc-500">All connected shops, stores, marketplaces, and systems</p>
          </div>
          {onBack && (
            <button onClick={onBack} className="text-[10px] font-black text-zinc-500">Close</button>
          )}
        </div>
        <div className="mt-3 flex items-center gap-2">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search shops, marketplaces, ERPs..."
              className="w-full pl-9 pr-3 py-2 bg-zinc-100 rounded-xl text-[10px] font-bold"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-zinc-400" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-zinc-100 rounded-xl text-[10px] font-bold px-2 py-2"
            >
              <option>All</option>
              {DIRECTORY_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'All' | 'live' | 'paused')}
              className="bg-zinc-100 rounded-xl text-[10px] font-bold px-2 py-2"
            >
              <option value="All">All</option>
              <option value="live">Live</option>
              <option value="paused">Paused</option>
            </select>
            <select
              value={minRating}
              onChange={(e) => setMinRating(Number(e.target.value))}
              className="bg-zinc-100 rounded-xl text-[10px] font-bold px-2 py-2"
            >
              <option value={0}>Any Rating</option>
              <option value={4}>4.0+</option>
              <option value={4.5}>4.5+</option>
            </select>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-4">
        {onOpenBrandChat && (
          <section className="bg-[#0b1d3a] text-white rounded-3xl p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-white/60">Brand Executive Chat</p>
                <p className="text-sm font-bold">Unilever Rep: Live now</p>
                <p className="text-[10px] text-white/70 mt-1">Ask for heatmaps, top dukas, and demand spikes.</p>
              </div>
              <button
                onClick={onOpenBrandChat}
                className="px-4 py-2 bg-white text-[#0b1d3a] rounded-xl text-[10px] font-black"
              >
                Open Chat
              </button>
            </div>
          </section>
        )}
        <section className="bg-white rounded-3xl border border-zinc-100 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-zinc-500">Access Control</p>
              <p className="text-[10px] text-zinc-500">Only owners/admins can revoke or pause integrations.</p>
            </div>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as 'viewer' | 'owner' | 'admin')}
              className="p-2 bg-zinc-50 rounded-xl text-[10px] font-black"
            >
              <option value="viewer">Viewer</option>
              <option value="owner">Owner</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </section>

        <div className="grid grid-cols-1 gap-3">
          {filtered.map(entry => (
            <div key={entry.id} className="bg-white rounded-2xl border border-zinc-100 p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                    {entry.type === 'Shop' ? <Building2 className="w-4 h-4 text-blue-600" /> : <Plug className="w-4 h-4 text-blue-600" />}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-zinc-900">{entry.name}</p>
                    <p className="text-[10px] text-zinc-500">{entry.type} • {entry.status.toUpperCase()}</p>
                  </div>
                </div>
                <div className="text-[10px] font-black text-amber-500 flex items-center gap-1">
                  <Star className="w-3 h-3 fill-amber-500" /> {entry.rating.toFixed(1)}
                </div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3 text-[10px] font-bold text-zinc-600">
                <div className="flex items-center gap-2"><MapPin className="w-3 h-3 text-zinc-400" /> {entry.location || 'Online'}</div>
                <div className="flex items-center gap-2"><Layers className="w-3 h-3 text-zinc-400" /> {entry.products} products</div>
                <div className="flex items-center gap-2"><ShieldCheck className="w-3 h-3 text-zinc-400" /> {entry.starsEarned}⭐ earned</div>
                <div className="flex items-center gap-2"><Users className="w-3 h-3 text-zinc-400" /> Sync {entry.lastSync}</div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {entry.systems.map(s => (
                  <span key={s} className="px-2 py-1 bg-zinc-100 rounded-full text-[9px] font-bold text-zinc-600">{s}</span>
                ))}
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className={`text-[10px] font-black ${entry.status === 'live' ? 'text-emerald-600' : 'text-amber-500'}`}>{entry.status === 'live' ? 'LIVE SYNC' : 'PAUSED'}</span>
                <div className="flex gap-2">
                  <button className={`px-3 py-2 rounded-xl text-[10px] font-black ${role === 'viewer' ? 'bg-zinc-100 text-zinc-400' : 'bg-white border border-zinc-200'}`} disabled={role === 'viewer'}>
                    Pause
                  </button>
                  <button className={`px-3 py-2 rounded-xl text-[10px] font-black ${role === 'viewer' ? 'bg-zinc-100 text-zinc-400' : 'bg-red-50 text-red-600'}`} disabled={role === 'viewer'}>
                    Revoke
                  </button>
                </div>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="p-6 bg-white rounded-2xl border border-dashed border-zinc-200 text-center text-[10px] font-bold text-zinc-500">
              No connected partners match your filters.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
