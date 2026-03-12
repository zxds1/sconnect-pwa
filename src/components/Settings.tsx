import React from 'react';
import { 
  Bell, 
  Lock, 
  Eye, 
  Smartphone, 
  Globe, 
  HelpCircle, 
  LogOut, 
  ChevronRight,
  User,
  CreditCard,
  ShieldCheck,
  Download,
  WifiOff,
  ToggleLeft,
  ToggleRight,
  Trash2,
  Database,
  Volume2,
  Sparkles
} from 'lucide-react';

interface SettingsProps {
  onOpenDataDashboard?: () => void;
}

export const Settings: React.FC<SettingsProps> = ({ onOpenDataDashboard }) => {
  const [offlineMode, setOfflineMode] = React.useState(false);
  const [language, setLanguage] = React.useState('English');
  const [consents, setConsents] = React.useState({
    location: true,
    receipts: true,
    personalization: true,
    marketing: false
  });
  const [favoriteAlerts, setFavoriteAlerts] = React.useState(true);
  const [voiceFeedback, setVoiceFeedback] = React.useState(() => {
    try {
      return localStorage.getItem('soko:voice_feedback') === 'true';
    } catch {
      return false;
    }
  });
  const [dataSummary] = React.useState({
    searches: 347,
    receipts: 128,
    purchases: 34,
    reviews: 19
  });
  const [preferredCategories, setPreferredCategories] = React.useState<string[]>(['Electronics', 'Groceries']);
  const [priceRange, setPriceRange] = React.useState<[number, number]>([200, 20000]);
  const [savedLocations] = React.useState({ home: 'Kawangware', work: 'CBD' });
  const [alertPrefs, setAlertPrefs] = React.useState(() => {
    try {
      const raw = localStorage.getItem('soko:alert_prefs');
      return raw ? JSON.parse(raw) : { priceDrops: true, backInStock: true, trending: true };
    } catch {
      return { priceDrops: true, backInStock: true, trending: true };
    }
  });

  React.useEffect(() => {
    try {
      localStorage.setItem('soko:voice_feedback', voiceFeedback ? 'true' : 'false');
      localStorage.setItem('soko:alert_prefs', JSON.stringify(alertPrefs));
    } catch {}
  }, [voiceFeedback, alertPrefs]);

  const sections = [
    {
      title: 'Account',
      items: [
        { icon: User, label: 'Personal Information', color: 'text-blue-500' },
        { icon: Lock, label: 'Password & Security', color: 'text-indigo-500' },
        { icon: CreditCard, label: 'Payments & Payouts', color: 'text-emerald-500' },
      ]
    },
    {
      title: 'Preferences',
      items: [
        { icon: Bell, label: 'Notifications', color: 'text-amber-500' },
        { icon: Eye, label: 'Privacy & Visibility', color: 'text-purple-500' },
        { icon: Globe, label: 'Language & Region', color: 'text-cyan-500' },
        { icon: Smartphone, label: 'App Appearance', color: 'text-zinc-500' },
      ]
    },
    {
      title: 'Support',
      items: [
        { icon: HelpCircle, label: 'Help Center', color: 'text-rose-500' },
        { icon: ShieldCheck, label: 'Terms & Policies', color: 'text-zinc-400' },
      ]
    }
  ];

  return (
    <div className="h-full bg-zinc-50 flex flex-col overflow-y-auto no-scrollbar">
      <div className="p-6 bg-white border-b border-zinc-100 sticky top-0 z-10">
        <h1 className="text-2xl font-bold text-zinc-900">Settings</h1>
      </div>

      <div className="p-6 space-y-8">
        {sections.map((section, idx) => (
          <div key={idx} className="space-y-3">
            <h2 className="text-xs font-bold uppercase text-zinc-400 tracking-widest px-2">{section.title}</h2>
            <div className="bg-white rounded-2xl border border-zinc-100 overflow-hidden shadow-sm">
              {section.items.map((item, itemIdx) => (
                <button 
                  key={itemIdx}
                  className="w-full flex items-center justify-between p-4 hover:bg-zinc-50 transition-colors border-b last:border-b-0 border-zinc-50"
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-lg bg-zinc-50 ${item.color}`}>
                      <item.icon className="w-5 h-5" />
                    </div>
                    <span className="text-sm font-bold text-zinc-700">{item.label}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-zinc-300" />
                </button>
              ))}
            </div>
          </div>
        ))}

        <button className="w-full flex items-center justify-center gap-2 p-4 bg-white text-red-500 rounded-2xl border border-red-100 font-bold text-sm shadow-sm hover:bg-red-50 transition-colors">
          <LogOut className="w-5 h-5" />
          Log Out
        </button>

        {/* Offline Mode */}
        <div className="bg-white rounded-2xl border border-zinc-100 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <WifiOff className="w-5 h-5 text-zinc-500" />
              <div>
                <p className="text-sm font-bold text-zinc-900">Offline Mode</p>
                <p className="text-[10px] text-zinc-500">Cache recent searches and saved items.</p>
              </div>
            </div>
            <button onClick={() => setOfflineMode(prev => !prev)} className="p-1 rounded-full">
              {offlineMode ? <ToggleRight className="w-6 h-6 text-emerald-600" /> : <ToggleLeft className="w-6 h-6 text-zinc-300" />}
            </button>
          </div>
          <div className="text-[10px] text-zinc-400">Status: {offlineMode ? 'Enabled' : 'Disabled'}</div>
        </div>

        {/* Language */}
        <div className="bg-white rounded-2xl border border-zinc-100 p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <Globe className="w-5 h-5 text-cyan-500" />
            <div>
              <p className="text-sm font-bold text-zinc-900">Language</p>
              <p className="text-[10px] text-zinc-500">Choose your preferred language.</p>
            </div>
          </div>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="w-full p-3 bg-zinc-50 rounded-xl text-xs font-bold"
          >
            <option>English</option>
            <option>Swahili</option>
            <option>Sheng</option>
          </select>
        </div>

        {/* Data Portability */}
        <div className="bg-white rounded-2xl border border-zinc-100 p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <Download className="w-5 h-5 text-indigo-500" />
            <div>
              <p className="text-sm font-bold text-zinc-900">Download Your Data</p>
              <p className="text-[10px] text-zinc-500">Export your activity and contributions.</p>
            </div>
          </div>
          <button className="w-full py-3 bg-zinc-900 text-white rounded-xl text-xs font-bold">
            Export Data
          </button>
        </div>

        {/* Data Dashboard */}
        <div className="bg-white rounded-2xl border border-zinc-100 p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <Database className="w-5 h-5 text-emerald-500" />
            <div>
              <p className="text-sm font-bold text-zinc-900">View My Data</p>
              <p className="text-[10px] text-zinc-500">Transparent summary of your activity.</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 text-[10px] font-bold text-zinc-600">
            <div className="p-3 bg-zinc-50 rounded-2xl">Searches: {dataSummary.searches}</div>
            <div className="p-3 bg-zinc-50 rounded-2xl">Receipts: {dataSummary.receipts}</div>
            <div className="p-3 bg-zinc-50 rounded-2xl">Purchases: {dataSummary.purchases}</div>
            <div className="p-3 bg-zinc-50 rounded-2xl">Reviews: {dataSummary.reviews}</div>
          </div>
          <button
            onClick={onOpenDataDashboard}
            className="mt-3 w-full py-3 bg-emerald-600 text-white rounded-xl text-xs font-bold"
          >
            Open Data Dashboard
          </button>
        </div>

        {/* Favorite Shop Alerts */}
        <div className="bg-white rounded-2xl border border-zinc-100 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-zinc-900">Favorite Shop Alerts</p>
              <p className="text-[10px] text-zinc-500">Notify me when favorite shops add new items.</p>
            </div>
            <button onClick={() => setFavoriteAlerts(prev => !prev)} className="p-1 rounded-full">
              {favoriteAlerts ? <ToggleRight className="w-6 h-6 text-emerald-600" /> : <ToggleLeft className="w-6 h-6 text-zinc-300" />}
            </button>
          </div>
        </div>

        {/* Alert Preferences */}
        <div className="bg-white rounded-2xl border border-zinc-100 p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <Bell className="w-5 h-5 text-amber-500" />
            <div>
              <p className="text-sm font-bold text-zinc-900">Alert Preferences</p>
              <p className="text-[10px] text-zinc-500">Choose which alerts you want to receive.</p>
            </div>
          </div>
          {[
            { key: 'priceDrops', label: 'Price drop alerts' },
            { key: 'backInStock', label: 'Back-in-stock alerts' },
            { key: 'trending', label: 'Trending near you alerts' },
          ].map(item => (
            <div key={item.key} className="flex items-center justify-between py-2">
              <span className="text-[10px] font-bold text-zinc-600">{item.label}</span>
              <button
                onClick={() => setAlertPrefs((prev: any) => ({ ...prev, [item.key]: !prev[item.key] }))}
                className="p-1 rounded-full"
              >
                {alertPrefs[item.key as keyof typeof alertPrefs] ? (
                  <ToggleRight className="w-6 h-6 text-emerald-600" />
                ) : (
                  <ToggleLeft className="w-6 h-6 text-zinc-300" />
                )}
              </button>
            </div>
          ))}
        </div>

        {/* Personalization Preferences */}
        <div className="bg-white rounded-2xl border border-zinc-100 p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <div>
              <p className="text-sm font-bold text-zinc-900">Personalization</p>
              <p className="text-[10px] text-zinc-500">Preferred categories, budgets, and locations.</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mb-3">
            {['Electronics', 'Groceries', 'Fashion', 'Home', 'Beauty'].map(cat => (
              <button
                key={cat}
                onClick={() => setPreferredCategories(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat])}
                className={`px-3 py-1.5 rounded-full text-[10px] font-bold ${preferredCategories.includes(cat) ? 'bg-indigo-600 text-white' : 'bg-zinc-100 text-zinc-600'}`}
              >
                {cat}
              </button>
            ))}
          </div>
          <div className="mb-3">
            <p className="text-[10px] font-bold text-zinc-500 mb-2">Default price range (KES)</p>
            <input
              type="range"
              min="100"
              max="100000"
              step="100"
              value={priceRange[1]}
              onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
              className="w-full accent-indigo-600"
            />
            <div className="text-[10px] text-zinc-600 font-bold">KES {priceRange[0]} - {priceRange[1]}</div>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[10px] font-bold text-zinc-600">
            <div className="p-2 bg-zinc-50 rounded-xl">Home: {savedLocations.home}</div>
            <div className="p-2 bg-zinc-50 rounded-xl">Work: {savedLocations.work}</div>
          </div>
        </div>

        {/* Consent & Privacy */}
        <div className="bg-white rounded-2xl border border-zinc-100 p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <ShieldCheck className="w-5 h-5 text-emerald-500" />
            <div>
              <p className="text-sm font-bold text-zinc-900">Data Sharing Consents</p>
              <p className="text-[10px] text-zinc-500">Opt-in control for each data type.</p>
            </div>
          </div>
          {[
            { key: 'location', label: 'Location for “near me” search' },
            { key: 'receipts', label: 'Receipt uploads for price intelligence' },
            { key: 'personalization', label: 'Personalized recommendations' },
            { key: 'marketing', label: 'Marketing and promotions' },
          ].map(item => (
            <div key={item.key} className="flex items-center justify-between py-2">
              <span className="text-[10px] font-bold text-zinc-600">{item.label}</span>
              <button 
                onClick={() => setConsents(prev => ({ ...prev, [item.key]: !prev[item.key as keyof typeof prev] }))}
                className="p-1 rounded-full"
              >
                {consents[item.key as keyof typeof consents] ? (
                  <ToggleRight className="w-6 h-6 text-emerald-600" />
                ) : (
                  <ToggleLeft className="w-6 h-6 text-zinc-300" />
                )}
              </button>
            </div>
          ))}
        </div>

        {/* Voice Feedback */}
        <div className="bg-white rounded-2xl border border-zinc-100 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Volume2 className="w-5 h-5 text-indigo-500" />
              <div>
                <p className="text-sm font-bold text-zinc-900">Voice-First Feedback</p>
                <p className="text-[10px] text-zinc-500">Read search results aloud.</p>
              </div>
            </div>
            <button onClick={() => setVoiceFeedback(prev => !prev)} className="p-1 rounded-full">
              {voiceFeedback ? <ToggleRight className="w-6 h-6 text-emerald-600" /> : <ToggleLeft className="w-6 h-6 text-zinc-300" />}
            </button>
          </div>
        </div>

        {/* Delete My Data */}
        <div className="bg-white rounded-2xl border border-red-100 p-5 shadow-sm">
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
        </div>

        <div className="text-center pb-10">
          <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">Sconnect Commerce Intelligence</p>
          <p className="text-[10px] text-zinc-300">Version 2.4.0 (Build 842)</p>
        </div>
      </div>
    </div>
  );
};
