import React from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Sparkles, Store, ShoppingBag } from 'lucide-react';
import { postAssistantEvent } from '../lib/assistantApi';
import { postAnalyticsEvent } from '../lib/analyticsApi';
import { getSellerOnboardingState, setSellerShopType as setSellerShopTypeApi } from '../lib/sellerOnboardingApi';
import { getSellerProfile, updateSellerProfile } from '../lib/sellerProfileApi';

interface AuthOnboardingProps {
  onBack?: () => void;
  onFinish?: (intent: 'buyer' | 'seller') => void;
}

export const AuthOnboarding: React.FC<AuthOnboardingProps> = ({ onBack, onFinish }) => {
  const [intent, setIntent] = React.useState<'buyer' | 'seller' | null>(null);
  const [sellerShopType, setSellerShopType] = React.useState<'physical' | 'online' | 'hybrid' | 'marketplace'>('physical');
  const [sellerMode, setSellerMode] = React.useState<'fixed_shop' | 'open_market_stall' | 'ground_trader' | 'solopreneur' | 'hybrid'>('fixed_shop');
  const [sellerWhatsApp, setSellerWhatsApp] = React.useState('');
  const [sellerDeliveryRadius, setSellerDeliveryRadius] = React.useState('');
  const [sellerMarketName, setSellerMarketName] = React.useState('');
  const [sellerVisualMarker, setSellerVisualMarker] = React.useState('');
  const [formError, setFormError] = React.useState<string | null>(null);
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

  React.useEffect(() => {
    let ignore = false;
    const loadSellerSetup = async () => {
      try {
        const [onboarding, profile] = await Promise.all([
          getSellerOnboardingState().catch(() => null),
          getSellerProfile().catch(() => null),
        ]);
        if (ignore) return;
        if (onboarding?.shop_type) {
          setSellerShopType(onboarding.shop_type as typeof sellerShopType);
        }
        const resolvedMode = profile?.seller_mode || onboarding?.seller_mode;
        if (resolvedMode) {
          setSellerMode(resolvedMode as typeof sellerMode);
          setIntent('seller');
        }
        if (profile?.whatsapp_number || onboarding?.whatsapp_number) {
          setSellerWhatsApp(profile?.whatsapp_number || onboarding?.whatsapp_number || '');
        }
        if (typeof profile?.delivery_radius_km === 'number' || typeof onboarding?.delivery_radius_km === 'number') {
          setSellerDeliveryRadius(String(profile?.delivery_radius_km ?? onboarding?.delivery_radius_km ?? ''));
        }
        if (profile?.market_name) setSellerMarketName(profile.market_name);
        if (profile?.visual_marker) setSellerVisualMarker(profile.visual_marker);
        if (onboarding?.shop_type || resolvedMode || profile?.whatsapp_number) {
          setIntent('seller');
        }
      } catch {
        // Best effort only; the form still works without prefill.
      }
    };
    loadSellerSetup();
    return () => {
      ignore = true;
    };
  }, []);

  const handleContinue = async () => {
    if (!intent) return;
    if (intent === 'seller' && !sellerWhatsApp.trim()) {
      setFormError('WhatsApp number is required to receive customer inquiries.');
      return;
    }
    try {
      if (intent === 'seller') {
        const radiusValue = Number(sellerDeliveryRadius);
        await setSellerShopTypeApi({ shop_type: sellerShopType });
        await updateSellerProfile({
          seller_mode: sellerMode,
          market_name: sellerMarketName.trim() || undefined,
          visual_marker: sellerVisualMarker.trim() || undefined,
          delivery_radius_km: Number.isFinite(radiusValue) && radiusValue > 0 ? radiusValue : undefined,
          whatsapp_number: sellerWhatsApp.trim(),
        });
      }
    } catch {}
    trackEvent({
      action: 'complete',
      intent,
      checklist,
      shop_type: intent === 'seller' ? sellerShopType : undefined,
      seller_mode: intent === 'seller' ? sellerMode : undefined,
    });
    trackAnalytics({
      action: 'complete',
      intent,
      checklist,
      shop_type: intent === 'seller' ? sellerShopType : undefined,
      seller_mode: intent === 'seller' ? sellerMode : undefined,
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
            setFormError(null);
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
            setFormError(null);
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
            <div className="mt-5">
              <p className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold">Seller Mode</p>
              <p className="text-xs text-zinc-500 mt-1">Used for open market + delivery coordination.</p>
              <div className="mt-3 grid grid-cols-2 gap-2 text-[10px] font-bold">
                {[
                  { id: 'fixed_shop', label: 'Fixed Shop' },
                  { id: 'open_market_stall', label: 'Market Stall' },
                  { id: 'ground_trader', label: 'Ground Trader' },
                  { id: 'solopreneur', label: 'Solopreneur' },
                  { id: 'hybrid', label: 'Hybrid' }
                ].map((option) => (
                  <button
                    key={option.id}
                    onClick={() => {
                      setSellerMode(option.id as typeof sellerMode);
                      trackEvent({ action: 'select_seller_mode', seller_mode: option.id });
                      trackAnalytics({ action: 'select_seller_mode', seller_mode: option.id });
                    }}
                    className={`px-3 py-2 rounded-2xl border ${
                      sellerMode === option.id
                        ? 'bg-emerald-600 border-emerald-600 text-white'
                        : 'bg-zinc-50 border-zinc-200 text-zinc-700'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              <div className="mt-4 grid grid-cols-1 gap-2">
                <label className="text-[10px] font-bold text-zinc-500">
                  WhatsApp Number
                  <input
                    className="mt-2 w-full px-3 py-2 rounded-2xl bg-zinc-50 border border-zinc-200 text-zinc-800"
                    value={sellerWhatsApp}
                    onChange={(e) => {
                      setSellerWhatsApp(e.target.value);
                      setFormError(null);
                    }}
                    placeholder="+2547..."
                    required
                  />
                </label>
                {formError && (
                  <div className="text-[10px] font-bold text-red-600">{formError}</div>
                )}
                <label className="text-[10px] font-bold text-zinc-500">
                  Delivery Radius (km)
                  <input
                    className="mt-2 w-full px-3 py-2 rounded-2xl bg-zinc-50 border border-zinc-200 text-zinc-800"
                    value={sellerDeliveryRadius}
                    onChange={(e) => setSellerDeliveryRadius(e.target.value)}
                    placeholder="5"
                  />
                </label>
                <label className="text-[10px] font-bold text-zinc-500">
                  Market Name (optional)
                  <input
                    className="mt-2 w-full px-3 py-2 rounded-2xl bg-zinc-50 border border-zinc-200 text-zinc-800"
                    value={sellerMarketName}
                    onChange={(e) => setSellerMarketName(e.target.value)}
                    placeholder="My Gikomba Spot"
                  />
                </label>
                <label className="text-[10px] font-bold text-zinc-500">
                  Visual Marker (optional)
                  <input
                    className="mt-2 w-full px-3 py-2 rounded-2xl bg-zinc-50 border border-zinc-200 text-zinc-800"
                    value={sellerVisualMarker}
                    onChange={(e) => setSellerVisualMarker(e.target.value)}
                    placeholder="Blue tarp"
                  />
                </label>
              </div>
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
