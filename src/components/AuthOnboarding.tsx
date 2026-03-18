import React from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Sparkles, Store, ShoppingBag } from 'lucide-react';
import { postAssistantEvent } from '../lib/assistantApi';
import { postAnalyticsEvent } from '../lib/analyticsApi';

interface AuthOnboardingProps {
  onBack?: () => void;
  onFinish?: (intent: 'buyer' | 'seller') => void;
}

export const AuthOnboarding: React.FC<AuthOnboardingProps> = ({ onBack, onFinish }) => {
  const [intent, setIntent] = React.useState<'buyer' | 'seller' | null>(null);
  const [sellerShopType, setSellerShopType] = React.useState<'physical' | 'online' | 'hybrid' | 'marketplace'>('physical');
  const [checklist, setChecklist] = React.useState({
    profile: false,
    favorites: false,
    notifications: false,
    first_action: false,
  });

  const trackEvent = async (payload: Record<string, any>) => {
    try {
      await postAssistantEvent({
        event_name: 'auth_onboarding',
        ...payload,
      });
    } catch {}
  };

  const trackAnalytics = async (payload: Record<string, any>) => {
    try {
      await postAnalyticsEvent({
        name: 'auth_onboarding',
        action: payload.action,
        properties: payload,
      });
    } catch {}
  };

  React.useEffect(() => {
    trackEvent({ action: 'view' });
    trackAnalytics({ action: 'view' });
  }, []);

  const handleContinue = () => {
    if (!intent) return;
    try {
      localStorage.setItem('soko:account_intent', intent);
      localStorage.setItem('soko:onboarding_checklist', JSON.stringify(checklist));
      if (intent === 'seller') {
        localStorage.setItem('soko:shop_type', sellerShopType);
      }
    } catch {}
    trackEvent({
      action: 'complete',
      intent,
      checklist,
      shop_type: intent === 'seller' ? sellerShopType : undefined,
    });
    trackAnalytics({
      action: 'complete',
      intent,
      checklist,
      shop_type: intent === 'seller' ? sellerShopType : undefined,
    });
    onFinish?.(intent);
  };

  return (
    <div className="h-full w-full bg-white flex flex-col">
      <div className="p-4 flex items-center gap-3 border-b border-zinc-100">
        {onBack && (
          <button onClick={onBack} className="p-2 rounded-full hover:bg-zinc-100">
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
        <img src="/logo-header.jpg" alt="Sconnect" className="w-8 h-8 rounded-lg object-cover" />
        <div>
          <p className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold">Quick Setup</p>
          <h1 className="text-lg font-black text-zinc-900">How will you use Sconnect?</h1>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-indigo-50 border border-indigo-100 rounded-3xl p-6 shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-2xl bg-white text-indigo-600">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-indigo-900">Personalize your experience</p>
              <p className="text-xs text-indigo-700">We’ll tailor tools and shortcuts based on your intent.</p>
            </div>
          </div>
        </motion.div>

        <button
          onClick={() => {
            setIntent('buyer');
            trackEvent({ action: 'select_intent', intent: 'buyer' });
            trackAnalytics({ action: 'select_intent', intent: 'buyer' });
          }}
          className="w-full text-left bg-white border border-zinc-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-2xl bg-emerald-50 text-emerald-600">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-zinc-900">I’m a buyer</p>
              <p className="text-xs text-zinc-500">Discover products, track rewards, and shop deals.</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => {
            setIntent('seller');
            trackEvent({ action: 'select_intent', intent: 'seller' });
            trackAnalytics({ action: 'select_intent', intent: 'seller' });
          }}
          className="w-full text-left bg-white border border-zinc-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-2xl bg-amber-50 text-amber-600">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-zinc-900">I’m a seller</p>
              <p className="text-xs text-zinc-500">Open a shop, manage inventory, and reach customers.</p>
            </div>
          </div>
        </button>

        {intent === 'seller' && (
          <div className="bg-white border border-zinc-100 rounded-3xl p-6 shadow-sm">
            <p className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold">Shop Type</p>
            <p className="text-sm font-bold text-zinc-900 mt-1">How do you sell today?</p>
            <div className="mt-4 grid grid-cols-2 gap-2 text-[10px] font-bold">
              {[
                { id: 'physical', label: 'Physical' },
                { id: 'online', label: 'Online' },
                { id: 'hybrid', label: 'Hybrid' },
                { id: 'marketplace', label: 'Marketplace' },
              ].map((option) => (
                <button
                  key={option.id}
                  onClick={() => {
                    setSellerShopType(option.id as typeof sellerShopType);
                    trackEvent({ action: 'select_shop_type', shop_type: option.id });
                    trackAnalytics({ action: 'select_shop_type', shop_type: option.id });
                  }}
                  className={`px-3 py-2 rounded-2xl border ${
                    sellerShopType === option.id
                      ? 'bg-emerald-600 border-emerald-600 text-white'
                      : 'bg-zinc-50 border-zinc-200 text-zinc-700'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white border border-zinc-100 rounded-3xl p-6 shadow-sm">
          <p className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold">Welcome Checklist</p>
          <p className="text-sm font-bold text-zinc-900 mt-1">Finish setup to unlock shortcuts.</p>
          <div className="mt-4 space-y-3 text-xs font-bold text-zinc-600">
            {[
              { key: 'profile', label: 'Complete your profile' },
              { key: 'favorites', label: 'Follow 3 favorite shops' },
              { key: 'notifications', label: 'Enable notifications' },
              { key: 'first_action', label: 'Start your first chat or search' },
            ].map((item) => (
              <label key={item.key} className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={checklist[item.key as keyof typeof checklist]}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setChecklist((prev) => ({ ...prev, [item.key]: checked }));
                    trackEvent({
                      action: 'toggle_checklist',
                      item: item.key,
                      checked,
                    });
                    trackAnalytics({
                      action: 'toggle_checklist',
                      item: item.key,
                      checked,
                    });
                  }}
                />
                {item.label}
              </label>
            ))}
          </div>
        </div>

        <button
          onClick={handleContinue}
          disabled={!intent}
          className={`w-full py-3 rounded-2xl text-xs font-black uppercase tracking-widest ${
            intent ? 'bg-zinc-900 text-white' : 'bg-zinc-200 text-zinc-500'
          }`}
        >
          Continue
        </button>
      </div>
    </div>
  );
};
