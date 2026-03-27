import React from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Sparkles, Store, ShoppingBag, Upload } from 'lucide-react';
import { postAssistantEvent } from '../lib/assistantApi';
import { postAnalyticsEvent } from '../lib/analyticsApi';
import { getSellerOnboardingState, setSellerShopType as setSellerShopTypeApi } from '../lib/sellerOnboardingApi';
import { getSellerProfile, updateSellerProfile } from '../lib/sellerProfileApi';
import { getProfile, updateProfile } from '../lib/profileApi';
import { getAuthItem, setAuthItem } from '../lib/authStorage';
import { uploadMediaFile } from '../lib/mediaUpload';
import { LocationPinPicker } from './LocationPinPicker';

interface AuthOnboardingProps {
  onBack?: () => void;
  onFinish?: (intent: 'buyer' | 'seller') => void;
}

export const AuthOnboarding: React.FC<AuthOnboardingProps> = ({ onBack, onFinish }) => {
  const shopTypeOptions = [
    { id: 'physical', label: 'Physical Shop' },
    { id: 'online', label: 'Online Store' },
    { id: 'hybrid', label: 'Hybrid' },
    { id: 'marketplace', label: 'Marketplace' },
  ] as const;
  const sellerModeOptions = [
    { id: 'fixed_shop', label: 'Fixed Shop' },
    { id: 'open_market_stall', label: 'Market Stall' },
    { id: 'ground_trader', label: 'Ground Trader' },
    { id: 'solopreneur', label: 'Solopreneur' },
    { id: 'hybrid', label: 'Hybrid' },
  ] as const;
  const buyerReachOptions = [
    { id: 'fixed_address', label: 'Fixed Address' },
    { id: 'market_stall', label: 'Market Stall / Walk-in' },
    { id: 'delivery_only', label: 'Delivery / WhatsApp' },
  ] as const;
  const isUrl = (value: string) => /^https?:\/\//i.test(value.trim());
  const toggleMulti = (current: string[], value: string) =>
    current.includes(value)
      ? (current.length === 1 ? current : current.filter((item) => item !== value))
      : [...current, value];

  const [intent, setIntent] = React.useState<'buyer' | 'seller' | null>(null);
  const [sellerShopType, setSellerShopType] = React.useState<'physical' | 'online' | 'hybrid' | 'marketplace'>('physical');
  const [sellerMode, setSellerMode] = React.useState<'fixed_shop' | 'open_market_stall' | 'ground_trader' | 'solopreneur' | 'hybrid'>('fixed_shop');
  const [displayName, setDisplayName] = React.useState('');
  const [sellerBusinessName, setSellerBusinessName] = React.useState('');
  const [sellerShopTypes, setSellerShopTypes] = React.useState<string[]>(['physical']);
  const [sellerModes, setSellerModes] = React.useState<string[]>(['fixed_shop']);
  const [sellerReachChannels, setSellerReachChannels] = React.useState<string[]>(['fixed_address']);
  const [sellerWhatsApp, setSellerWhatsApp] = React.useState('');
  const [sellerDeliveryRadius, setSellerDeliveryRadius] = React.useState('');
  const [sellerMarketName, setSellerMarketName] = React.useState('');
  const [sellerPinnedPlaceName, setSellerPinnedPlaceName] = React.useState('');
  const [sellerPinnedLat, setSellerPinnedLat] = React.useState<number | undefined>(undefined);
  const [sellerPinnedLng, setSellerPinnedLng] = React.useState<number | undefined>(undefined);
  const [sellerVisualMarker, setSellerVisualMarker] = React.useState('');
  const [sellerVisualMarkerUploading, setSellerVisualMarkerUploading] = React.useState(false);
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
    try {
      const storedIntent = getAuthItem('soko:account_intent');
      if (storedIntent === 'buyer' || storedIntent === 'seller') {
        setIntent(storedIntent);
      }
    } catch {}
  }, []);

  React.useEffect(() => {
    trackEvent({ action: 'view' });
    trackAnalytics({ action: 'view' });
  }, []);

  React.useEffect(() => {
    let ignore = false;
    const loadSellerSetup = async () => {
      try {
        const [onboarding, profile, userProfile] = await Promise.all([
          getSellerOnboardingState().catch(() => null),
          getSellerProfile().catch(() => null),
          getProfile().catch(() => null),
        ]);
        if (ignore) return;
        if (userProfile?.display_name) {
          setDisplayName(userProfile.display_name);
          setAuthItem('soko:display_name', userProfile.display_name);
        }
        if (onboarding?.shop_type) {
          setSellerShopType(onboarding.shop_type as typeof sellerShopType);
          setSellerShopTypes([onboarding.shop_type]);
        }
        if (profile?.name) setSellerBusinessName(profile.name);
        const resolvedMode = profile?.seller_mode || onboarding?.seller_mode;
        if (resolvedMode) {
          setSellerMode(resolvedMode as typeof sellerMode);
          setSellerModes([resolvedMode]);
          setIntent('seller');
        }
        const profileServiceArea = (profile?.service_area && typeof profile.service_area === 'object'
          ? profile.service_area
          : {}) as Record<string, any>;
        if (Array.isArray(profileServiceArea.shop_types) && profileServiceArea.shop_types.length) {
          const nextShopTypes = profileServiceArea.shop_types.filter(Boolean) as string[];
          setSellerShopTypes(nextShopTypes);
          setSellerShopType((nextShopTypes[0] || sellerShopType) as typeof sellerShopType);
        }
        if (Array.isArray(profileServiceArea.selling_modes) && profileServiceArea.selling_modes.length) {
          const nextSellerModes = profileServiceArea.selling_modes.filter(Boolean) as string[];
          setSellerModes(nextSellerModes);
          setSellerMode((nextSellerModes[0] || sellerMode) as typeof sellerMode);
        }
        if (Array.isArray(profileServiceArea.reach_channels) && profileServiceArea.reach_channels.length) {
          setSellerReachChannels(profileServiceArea.reach_channels.filter(Boolean));
        }
        if (profile?.whatsapp_number || onboarding?.whatsapp_number) {
          setSellerWhatsApp(profile?.whatsapp_number || onboarding?.whatsapp_number || '');
        }
        if (typeof profile?.delivery_radius_km === 'number' || typeof onboarding?.delivery_radius_km === 'number') {
          setSellerDeliveryRadius(String(profile?.delivery_radius_km ?? onboarding?.delivery_radius_km ?? ''));
        }
        if (profile?.market_name) setSellerMarketName(profile.market_name);
        if (typeof profileServiceArea.daily_place_name === 'string') {
          setSellerPinnedPlaceName(profileServiceArea.daily_place_name);
        }
        if (typeof profile?.daily_lat === 'number') setSellerPinnedLat(profile.daily_lat);
        if (typeof profile?.daily_lng === 'number') setSellerPinnedLng(profile.daily_lng);
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

  const handleVisualMarkerUpload = async (file: File) => {
    setFormError(null);
    setSellerVisualMarkerUploading(true);
    try {
      const uploaded = await uploadMediaFile(file, 'seller_visual_marker');
      setSellerVisualMarker(uploaded.url);
    } catch (err: any) {
      setFormError(err?.message || 'Unable to upload marker photo.');
    } finally {
      setSellerVisualMarkerUploading(false);
    }
  };

  const handleContinue = async () => {
    if (!intent) return;
    if (!displayName.trim()) {
      setFormError('Tell us what name to show on your profile.');
      return;
    }
    const selectedShopTypes = sellerShopTypes.length ? sellerShopTypes : [sellerShopType];
    const selectedSellerModes = sellerModes.length ? sellerModes : [sellerMode];
    const selectedReachChannels = sellerReachChannels.length ? sellerReachChannels : ['fixed_address'];
    const primaryShopType = (selectedShopTypes[0] || sellerShopType) as typeof sellerShopType;
    const primarySellerMode = (selectedSellerModes[0] || sellerMode) as typeof sellerMode;
    const needsMarketFields = selectedReachChannels.includes('market_stall')
      || selectedSellerModes.includes('open_market_stall')
      || selectedSellerModes.includes('ground_trader');
    const needsDeliveryFields = selectedReachChannels.includes('delivery_only')
      || selectedSellerModes.includes('solopreneur');
    if (intent === 'seller' && !sellerWhatsApp.trim()) {
      setFormError('WhatsApp number is required to receive customer inquiries.');
      return;
    }
    if (intent === 'seller' && !sellerBusinessName.trim()) {
      setFormError('Add the business or shop name buyers should see.');
      return;
    }
    if (intent === 'seller' && needsMarketFields && (!sellerMarketName.trim() || !sellerVisualMarker.trim())) {
      setFormError('Market sellers need a place name and a visual marker photo.');
      return;
    }
    if (intent === 'seller' && needsMarketFields && (!sellerPinnedPlaceName.trim() || sellerPinnedLat === undefined || sellerPinnedLng === undefined)) {
      setFormError('Market sellers need a pinned map location so buyers can find them.');
      return;
    }
    if (intent === 'seller' && needsDeliveryFields && !sellerDeliveryRadius.trim()) {
      setFormError('Delivery sellers need a delivery radius.');
      return;
    }
    try {
      await updateProfile({ display_name: displayName.trim() });
      setAuthItem('soko:display_name', displayName.trim());
      if (intent === 'seller') {
        const radiusValue = Number(sellerDeliveryRadius);
        await setSellerShopTypeApi({ shop_type: primaryShopType });
        await updateSellerProfile({
          name: sellerBusinessName.trim() || undefined,
          seller_mode: primarySellerMode,
          market_name: sellerMarketName.trim() || undefined,
          visual_marker: sellerVisualMarker.trim() || undefined,
          delivery_radius_km: Number.isFinite(radiusValue) && radiusValue > 0 ? radiusValue : undefined,
          daily_lat: sellerPinnedLat,
          daily_lng: sellerPinnedLng,
          whatsapp_number: sellerWhatsApp.trim(),
          service_area: {
            shop_types: selectedShopTypes,
            selling_modes: selectedSellerModes,
            reach_channels: selectedReachChannels,
            daily_place_name: sellerPinnedPlaceName.trim() || undefined,
          },
        });
      }
    } catch {}
    trackEvent({
      action: 'complete',
      intent,
      checklist,
      shop_type: intent === 'seller' ? primaryShopType : undefined,
      seller_mode: intent === 'seller' ? primarySellerMode : undefined,
    });
    trackAnalytics({
      action: 'complete',
      intent,
      checklist,
      shop_type: intent === 'seller' ? primaryShopType : undefined,
      seller_mode: intent === 'seller' ? primarySellerMode : undefined,
    });
    try {
      setAuthItem('soko:account_intent', intent);
      setAuthItem('soko:role', intent);
      if (displayName.trim()) {
        setAuthItem('soko:display_name', displayName.trim());
      }
    } catch {}
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
            try {
              setAuthItem('soko:account_intent', 'buyer');
            } catch {}
            trackEvent({ action: 'select_intent', intent: 'buyer' });
            trackAnalytics({ action: 'select_intent', intent: 'buyer' });
          }}
          className={`w-full text-left rounded-3xl p-6 shadow-sm transition ${
            intent === 'buyer'
              ? 'bg-emerald-50 border-2 border-emerald-500 shadow-md'
              : 'bg-white border border-zinc-100 hover:shadow-md'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-2xl bg-emerald-50 text-emerald-600">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-zinc-900">I’m a buyer</p>
              <p className="text-xs text-zinc-500">Discover products, track rewards, and shop deals.</p>
            </div>
            {intent === 'buyer' && (
              <div className="ml-auto text-[10px] font-black uppercase tracking-widest text-emerald-700">Selected</div>
            )}
          </div>
        </button>

        <button
          onClick={() => {
            setIntent('seller');
            setFormError(null);
            try {
              setAuthItem('soko:account_intent', 'seller');
            } catch {}
            trackEvent({ action: 'select_intent', intent: 'seller' });
            trackAnalytics({ action: 'select_intent', intent: 'seller' });
          }}
          className={`w-full text-left rounded-3xl p-6 shadow-sm transition ${
            intent === 'seller'
              ? 'bg-amber-50 border-2 border-amber-500 shadow-md'
              : 'bg-white border border-zinc-100 hover:shadow-md'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-2xl bg-amber-50 text-amber-600">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-zinc-900">I’m a seller</p>
              <p className="text-xs text-zinc-500">Open a shop, manage inventory, and reach customers.</p>
            </div>
            {intent === 'seller' && (
              <div className="ml-auto text-[10px] font-black uppercase tracking-widest text-amber-700">Selected</div>
            )}
          </div>
        </button>

        {intent && (
          <div className="bg-white border border-zinc-100 rounded-3xl p-6 shadow-sm">
            <p className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold">Profile Name</p>
            <p className="text-sm font-bold text-zinc-900 mt-1">What should people call you?</p>
            <input
              className="mt-3 w-full px-3 py-2 rounded-2xl bg-zinc-50 border border-zinc-200 text-zinc-800"
              value={displayName}
              onChange={(e) => {
                setDisplayName(e.target.value);
                setFormError(null);
              }}
              placeholder={intent === 'seller' ? 'Jane from Duka Fresh' : 'Jane Wanjiku'}
            />
          </div>
        )}

        {intent === 'seller' && (
          <div className="bg-white border border-zinc-100 rounded-3xl p-6 shadow-sm">
            <p className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold">Shop Type</p>
            <p className="text-sm font-bold text-zinc-900 mt-1">How do you sell today?</p>
            <p className="text-xs text-zinc-500 mt-1">Choose all that apply. The first one becomes your primary setup.</p>
            <label className="mt-4 block text-[10px] font-bold text-zinc-500">
              Shop / Business Name
              <input
                className="mt-2 w-full px-3 py-2 rounded-2xl bg-zinc-50 border border-zinc-200 text-zinc-800"
                value={sellerBusinessName}
                onChange={(e) => {
                  setSellerBusinessName(e.target.value);
                  setFormError(null);
                }}
                placeholder="Mama Mboga Corner"
              />
            </label>
            <div className="mt-4 grid grid-cols-2 gap-2 text-[10px] font-bold">
              {shopTypeOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => {
                    const next = toggleMulti(sellerShopTypes, option.id);
                    setSellerShopTypes(next);
                    setSellerShopType((next[0] || option.id) as typeof sellerShopType);
                    trackEvent({ action: 'select_shop_type', shop_type: option.id });
                    trackAnalytics({ action: 'select_shop_type', shop_type: option.id });
                  }}
                  className={`px-3 py-2 rounded-2xl border ${
                    sellerShopTypes.includes(option.id)
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
              <p className="text-xs text-zinc-500 mt-1">Choose all the selling setups that describe you.</p>
              <div className="mt-3 grid grid-cols-2 gap-2 text-[10px] font-bold">
                {sellerModeOptions.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => {
                      const next = toggleMulti(sellerModes, option.id);
                      setSellerModes(next);
                      setSellerMode((next[0] || option.id) as typeof sellerMode);
                      trackEvent({ action: 'select_seller_mode', seller_mode: option.id });
                      trackAnalytics({ action: 'select_seller_mode', seller_mode: option.id });
                    }}
                    className={`px-3 py-2 rounded-2xl border ${
                      sellerModes.includes(option.id)
                        ? 'bg-emerald-600 border-emerald-600 text-white'
                        : 'bg-zinc-50 border-zinc-200 text-zinc-700'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              <div className="mt-5">
                <p className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold">How Do Buyers Reach You?</p>
                <p className="text-xs text-zinc-500 mt-1">Choose every way customers can find or contact you.</p>
                <div className="mt-3 grid grid-cols-1 gap-2 text-[10px] font-bold">
                  {buyerReachOptions.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => {
                        const next = toggleMulti(sellerReachChannels, option.id);
                        setSellerReachChannels(next);
                        setFormError(null);
                      }}
                      className={`px-3 py-2 rounded-2xl border ${
                        sellerReachChannels.includes(option.id)
                          ? 'bg-indigo-600 border-indigo-600 text-white'
                          : 'bg-zinc-50 border-zinc-200 text-zinc-700'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
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
                  Market / Place Name
                  <input
                    className="mt-2 w-full px-3 py-2 rounded-2xl bg-zinc-50 border border-zinc-200 text-zinc-800"
                    value={sellerMarketName}
                    onChange={(e) => setSellerMarketName(e.target.value)}
                    placeholder="My Gikomba Spot"
                  />
                </label>
                <LocationPinPicker
                  title="Pinned Selling Location"
                  helpText="Search, drag, or tap the exact place where buyers should find your stall, shop, or delivery base."
                  value={{
                    label: sellerPinnedPlaceName,
                    lat: sellerPinnedLat,
                    lng: sellerPinnedLng,
                  }}
                  onChange={(next) => {
                    setSellerPinnedPlaceName(next.label || '');
                    setSellerPinnedLat(next.lat);
                    setSellerPinnedLng(next.lng);
                    setFormError(null);
                  }}
                  searchPlaceholder="Search market, estate, stage, or building"
                />
                <div className="text-[10px] font-bold text-zinc-500">
                  Visual Marker Photo
                  <div className="mt-2 flex items-center gap-3">
                    <label className="inline-flex items-center gap-2 px-3 py-2 rounded-2xl bg-zinc-50 border border-zinc-200 text-zinc-700 cursor-pointer">
                      <Upload className="w-4 h-4" />
                      <span>{sellerVisualMarkerUploading ? 'Uploading…' : 'Upload Marker Photo'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) void handleVisualMarkerUpload(file);
                        }}
                      />
                    </label>
                    {sellerVisualMarker && !isUrl(sellerVisualMarker) && (
                      <span className="text-[10px] text-zinc-500">{sellerVisualMarker}</span>
                    )}
                  </div>
                  {sellerVisualMarker && isUrl(sellerVisualMarker) && (
                    <img
                      src={sellerVisualMarker}
                      alt="Visual marker"
                      className="mt-3 h-24 w-24 rounded-2xl object-cover border border-zinc-200"
                    />
                  )}
                </div>
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
