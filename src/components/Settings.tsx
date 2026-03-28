import React from 'react';
import { 
  Bell, 
  Lock, 
  HelpCircle, 
  LogOut, 
  ChevronRight,
  User,
  CreditCard,
  ShieldCheck,
  Download,
  ToggleLeft,
  ToggleRight,
  Trash2,
  Database,
  Volume2,
  Moon,
  Sun,
  MapPin,
  Plus,
  Pencil,
  Home,
  LocateFixed
} from 'lucide-react';
import { getNotificationPreferences, updateNotificationPreferences } from '../lib/notificationsApi';
import {
  getConsents,
  getSettingsSummary,
  requestSettingsDeletion,
  requestSettingsExport,
  updateConsentByType,
  getComparisonPreferences,
  updateComparisonPreferences,
  getUiPreferences,
  updateUiPreferences,
  type ComparisonPreferences
} from '../lib/settingsApi';
import {
  createUserLocation,
  deleteUserLocation,
  listRegions,
  listUserLocations,
  type UserLocation,
  type Region,
  updateUserLocation
} from '../lib/searchApi';
import type { NotificationPreferences } from '../lib/notificationsApi';
import { getAuthItem, setAuthItem } from '../lib/authStorage';

interface SettingsProps {
  onOpenDataDashboard?: () => void;
  onOpenNotifications?: () => void;
  onOpenProfile?: () => void;
  onOpenSecurity?: () => void;
  onOpenPayments?: () => void;
  onOpenSupport?: () => void;
  onOpenPolicies?: () => void;
  onRequireLogin?: (message: string) => void;
}

export const Settings: React.FC<SettingsProps> = ({ onOpenDataDashboard, onOpenNotifications, onOpenProfile, onOpenSecurity, onOpenPayments, onOpenSupport, onOpenPolicies, onRequireLogin }) => {
  const hasSession = Boolean(getAuthItem('soko:auth_token'));
  const guestStorageKey = (suffix: string) => `soko:guest_settings:${suffix}`;
  const readGuestJson = <T,>(suffix: string, fallback: T): T => {
    if (typeof window === 'undefined') return fallback;
    try {
      const raw = window.localStorage.getItem(guestStorageKey(suffix));
      if (!raw) return fallback;
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  };
  const writeGuestJson = (suffix: string, value: any) => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(guestStorageKey(suffix), JSON.stringify(value));
    } catch {}
  };
  const [consents, setConsents] = React.useState({
    location: false,
    receipts: false,
    personalization: false,
    marketing: false
  });
  const [consentLoading, setConsentLoading] = React.useState<Record<string, boolean>>({});
  const [notificationPrefs, setNotificationPrefs] = React.useState({
    price_drops: false,
    back_in_stock: false,
    trending: false,
    watched_items: false
  });
  const [theme, setTheme] = React.useState<'light' | 'dark' | 'system'>(() => {
    return 'system';
  });
  const [voiceFeedback, setVoiceFeedback] = React.useState(() => {
    return false;
  });
  const [voiceDirections, setVoiceDirections] = React.useState(() => {
    return false;
  });
  const [uiPrefsLoaded, setUiPrefsLoaded] = React.useState(false);
  const [dataSummary, setDataSummary] = React.useState({
    searches: 0,
    receipts: 0,
    purchases: 0,
    reviews: 0
  });
  const [consentHistory, setConsentHistory] = React.useState<Array<{ consent_type: string; consent_given: boolean; created_at?: string }>>([]);
  const [showConsentHistory, setShowConsentHistory] = React.useState(false);
  const [exportForm, setExportForm] = React.useState({
    exportType: '',
    verificationMethod: 'mfa',
    recentLoginAt: ''
  });
  const [exportStatus, setExportStatus] = React.useState<string | null>(null);
  const [comparisonWeights, setComparisonWeights] = React.useState({
    price: 30,
    convenience: 25,
    trust: 20,
    quality: 15,
    ownership: 10
  });
  const [dealThresholds, setDealThresholds] = React.useState({
    best_value: 85,
    fastest_pickup: 30,
    trusted_seller: 80,
    nearby: 3
  });
  const [comparisonProfile, setComparisonProfile] = React.useState('default');
  const [comparisonStatus, setComparisonStatus] = React.useState<string | null>(null);
  const [preferenceStatus, setPreferenceStatus] = React.useState<string | null>(null);
  const [savedLocations, setSavedLocations] = React.useState<UserLocation[]>([]);
  const [locationRegions, setLocationRegions] = React.useState<Region[]>([]);
  const [locationForm, setLocationForm] = React.useState({
    id: '',
    label: '',
    address_line: '',
    region_id: '',
    lat: '',
    lng: '',
    is_default: true
  });
  const [locationLoading, setLocationLoading] = React.useState(false);
  const [locationStatus, setLocationStatus] = React.useState<string | null>(null);
  const [deleteForm, setDeleteForm] = React.useState({
    verificationMethod: 'mfa',
    mfa: false,
    verifiedDevice: false,
    supportTicketId: ''
  });
  const [deleteStatus, setDeleteStatus] = React.useState<string | null>(null);
  React.useEffect(() => {
    let ignore = false;
    const load = async () => {
      try {
        if (!hasSession) {
          const savedUi = readGuestJson<{ theme?: 'light' | 'dark' | 'system'; voiceFeedback?: boolean; voiceDirections?: boolean }>('ui', {});
          const savedComparison = readGuestJson<ComparisonPreferences>('comparison', {});
          const savedNotifications = readGuestJson<NotificationPreferences>('notifications', {});
          const savedConsents = readGuestJson<{ location?: boolean; receipts?: boolean; personalization?: boolean; marketing?: boolean }>('consents', {});
          const savedLocationsGuest = readGuestJson<UserLocation[]>('locations', []);
          const savedSummary = readGuestJson<{ searches: number; receipts: number; purchases: number; reviews: number }>('summary', { searches: 0, receipts: 0, purchases: 0, reviews: 0 });
          setDataSummary({
            searches: Number(savedSummary.searches || 0),
            receipts: Number(savedSummary.receipts || 0),
            purchases: Number(savedSummary.purchases || 0),
            reviews: Number(savedSummary.reviews || 0)
          });
          setConsents({
            location: Boolean(savedConsents.location),
            receipts: Boolean(savedConsents.receipts),
            personalization: Boolean(savedConsents.personalization),
            marketing: Boolean(savedConsents.marketing)
          });
          setConsentHistory([]);
          setNotificationPrefs({
            price_drops: Boolean(savedNotifications.price_drops),
            back_in_stock: Boolean(savedNotifications.back_in_stock),
            trending: Boolean(savedNotifications.trending),
            watched_items: Boolean(savedNotifications.watched_items)
          });
          setLocationRegions([]);
          setSavedLocations(Array.isArray(savedLocationsGuest) ? savedLocationsGuest : []);
          if (savedUi?.theme === 'light' || savedUi?.theme === 'dark' || savedUi?.theme === 'system') {
            setTheme(savedUi.theme);
          }
          setVoiceFeedback(Boolean((savedUi as any)?.voiceFeedback));
          setVoiceDirections(Boolean((savedUi as any)?.voiceDirections));
          if (savedComparison?.comparison_weights) {
            setComparisonWeights({
              price: Number(savedComparison.comparison_weights.price ?? 30),
              convenience: Number(savedComparison.comparison_weights.convenience ?? 25),
              trust: Number(savedComparison.comparison_weights.trust ?? 20),
              quality: Number(savedComparison.comparison_weights.quality ?? 15),
              ownership: Number(savedComparison.comparison_weights.ownership ?? 10)
            });
          }
          if (savedComparison?.deal_thresholds) {
            setDealThresholds({
              best_value: Number(savedComparison.deal_thresholds.best_value ?? 85),
              fastest_pickup: Number(savedComparison.deal_thresholds.fastest_pickup ?? 30),
              trusted_seller: Number(savedComparison.deal_thresholds.trusted_seller ?? 80),
              nearby: Number(savedComparison.deal_thresholds.nearby ?? 3)
            });
          }
          if (savedComparison?.comparison_profile) {
            setComparisonProfile(savedComparison.comparison_profile);
          }
          setUiPrefsLoaded(true);
          return;
        }

        const [summary, consentsResp, prefs, regionsResp, locationsResp] = await Promise.all([
          getSettingsSummary(),
          getConsents(),
          getNotificationPreferences(),
          listRegions().catch(() => []),
          listUserLocations().catch(() => [])
        ]);
        if (ignore) return;
        setDataSummary({
          searches: Number(summary.searches || 0),
          receipts: Number(summary.receipts || 0),
          purchases: Number(summary.purchases || 0),
          reviews: Number(summary.reviews || 0)
        });
        const nextConsents = { location: false, receipts: false, personalization: false, marketing: false };
        (consentsResp.current || []).forEach((item) => {
          switch (item.consent_type) {
            case 'location':
              nextConsents.location = Boolean(item.consent_given);
              break;
            case 'receipts':
              nextConsents.receipts = Boolean(item.consent_given);
              break;
            case 'personalization':
              nextConsents.personalization = Boolean(item.consent_given);
              break;
            case 'marketing':
              nextConsents.marketing = Boolean(item.consent_given);
              break;
            default:
              break;
          }
        });
        setConsents(nextConsents);
        setConsentHistory(
          (consentsResp.history || []).map((item) => ({
            consent_type: item.consent_type,
            consent_given: Boolean(item.consent_given),
            created_at: item.created_at
          }))
        );
        setNotificationPrefs({
          price_drops: Boolean(prefs.price_drops),
          back_in_stock: Boolean(prefs.back_in_stock),
          trending: Boolean(prefs.trending),
          watched_items: Boolean(prefs.watched_items)
        });
        setLocationRegions(regionsResp || []);
        setSavedLocations(locationsResp || []);
        const uiPrefs = await getUiPreferences();
        if (uiPrefs?.theme === 'light' || uiPrefs?.theme === 'dark' || uiPrefs?.theme === 'system') {
          setTheme(uiPrefs.theme);
        }
        setVoiceFeedback(Boolean(uiPrefs?.voice_feedback_enabled));
        setVoiceDirections(Boolean(uiPrefs?.voice_directions_enabled));
        const comparison = await getComparisonPreferences();
        if (comparison?.comparison_weights) {
          setComparisonWeights({
            price: Number(comparison.comparison_weights.price ?? 30),
            convenience: Number(comparison.comparison_weights.convenience ?? 25),
            trust: Number(comparison.comparison_weights.trust ?? 20),
            quality: Number(comparison.comparison_weights.quality ?? 15),
            ownership: Number(comparison.comparison_weights.ownership ?? 10)
          });
        }
        if (comparison?.deal_thresholds) {
          setDealThresholds({
            best_value: Number(comparison.deal_thresholds.best_value ?? 85),
            fastest_pickup: Number(comparison.deal_thresholds.fastest_pickup ?? 30),
            trusted_seller: Number(comparison.deal_thresholds.trusted_seller ?? 80),
            nearby: Number(comparison.deal_thresholds.nearby ?? 3)
          });
        }
        if (comparison?.comparison_profile) {
          setComparisonProfile(comparison.comparison_profile);
        }
        setUiPrefsLoaded(true);
      } catch {
        if (!ignore) {
          setDataSummary({ searches: 0, receipts: 0, purchases: 0, reviews: 0 });
          setConsents({ location: false, receipts: false, personalization: false, marketing: false });
          setNotificationPrefs({ price_drops: false, back_in_stock: false, trending: false, watched_items: false });
          setConsentHistory([]);
          setLocationRegions([]);
          setSavedLocations([]);
          setUiPrefsLoaded(true);
        }
      }
    };
    load();
    return () => {
      ignore = true;
    };
  }, []);

  const handleConsentToggle = async (key: keyof typeof consents) => {
    const nextValue = !consents[key];
    setConsentLoading((prev) => ({ ...prev, [key]: true }));
    try {
      if (!hasSession) {
        const nextConsents = { ...consents, [key]: nextValue };
        setConsents(nextConsents);
        writeGuestJson('consents', nextConsents);
        setPreferenceStatus('Consent saved locally.');
        return;
      }
      await updateConsentByType(key, { consent_given: nextValue });
      setConsents((prev) => ({ ...prev, [key]: nextValue }));
      const refreshed = await getConsents();
      setConsentHistory(
        (refreshed.history || []).map((item) => ({
          consent_type: item.consent_type,
          consent_given: Boolean(item.consent_given),
          created_at: item.created_at
        }))
      );
      setPreferenceStatus('Consent saved.');
    } catch (err: any) {
      setPreferenceStatus(err?.message || 'Unable to save consent right now.');
    }
    setConsentLoading((prev) => ({ ...prev, [key]: false }));
  };

  const handlePrefToggle = async (field: keyof typeof notificationPrefs) => {
    const nextValue = !notificationPrefs[field];
    try {
      if (!hasSession) {
        const nextPrefs = { ...notificationPrefs, [field]: nextValue };
        setNotificationPrefs(nextPrefs);
        writeGuestJson('notifications', nextPrefs);
        setPreferenceStatus('Notification preference saved locally.');
        return;
      }
      await updateNotificationPreferences({ [field]: nextValue } as any);
      setNotificationPrefs((prev) => ({ ...prev, [field]: nextValue }));
      setPreferenceStatus('Notification preference saved.');
    } catch (err: any) {
      setPreferenceStatus(err?.message || 'Unable to save notification preference right now.');
    }
  };

  const persistUiPrefs = async (next: Partial<{ theme: 'light' | 'dark' | 'system'; voiceFeedback: boolean; voiceDirections: boolean }>) => {
    try {
      if (!hasSession) {
        const nextState = {
          theme: next.theme ?? theme,
          voiceFeedback: next.voiceFeedback ?? voiceFeedback,
          voiceDirections: next.voiceDirections ?? voiceDirections
        };
        if (next.theme) setTheme(next.theme);
        if (typeof next.voiceFeedback === 'boolean') setVoiceFeedback(next.voiceFeedback);
        if (typeof next.voiceDirections === 'boolean') setVoiceDirections(next.voiceDirections);
        writeGuestJson('ui', nextState);
        setPreferenceStatus('Preferences saved locally.');
        return;
      }
      const saved = await updateUiPreferences({
        theme: next.theme ?? theme,
        voice_feedback_enabled: next.voiceFeedback ?? voiceFeedback,
        voice_directions_enabled: next.voiceDirections ?? voiceDirections
      });
      if (saved?.theme === 'light' || saved?.theme === 'dark' || saved?.theme === 'system') {
        setTheme(saved.theme);
      }
      if (typeof saved?.voice_feedback_enabled === 'boolean') {
        setVoiceFeedback(saved.voice_feedback_enabled);
      }
      if (typeof saved?.voice_directions_enabled === 'boolean') {
        setVoiceDirections(saved.voice_directions_enabled);
      }
      setPreferenceStatus('Preferences saved.');
    } catch (err: any) {
      setPreferenceStatus(err?.message || 'Unable to save preferences right now.');
    }
  };

  const totalWeight = Object.values(comparisonWeights).reduce((sum, value) => sum + Number(value || 0), 0);
  const updateWeight = (key: keyof typeof comparisonWeights, value: number) => {
    setComparisonWeights((prev) => ({ ...prev, [key]: Math.max(0, Math.min(100, value)) }));
  };

  const updateThreshold = (key: keyof typeof dealThresholds, value: number) => {
    setDealThresholds((prev) => ({ ...prev, [key]: value }));
  };

  const regionNameById = React.useMemo(() => {
    return locationRegions.reduce((acc, region) => {
      acc[region.id] = `${region.name}${region.type ? ` (${region.type})` : ''}`;
      return acc;
    }, {} as Record<string, string>);
  }, [locationRegions]);

  const resetLocationForm = () => {
    setLocationForm({
      id: '',
      label: '',
      address_line: '',
      region_id: '',
      lat: '',
      lng: '',
      is_default: true
    });
  };

  const loadSavedLocations = React.useCallback(async () => {
    try {
      const [regionsResp, locationsResp] = await Promise.all([
        listRegions().catch(() => []),
        listUserLocations().catch(() => [])
      ]);
      setLocationRegions(regionsResp || []);
      setSavedLocations(locationsResp || []);
    } catch {
      setLocationRegions([]);
      setSavedLocations([]);
    }
  }, []);

  const handleEditLocation = (location: UserLocation) => {
    setLocationForm({
      id: location.id,
      label: location.label || '',
      address_line: location.address_line || '',
      region_id: location.region_id || '',
      lat: location.lat !== undefined && location.lat !== null ? String(location.lat) : '',
      lng: location.lng !== undefined && location.lng !== null ? String(location.lng) : '',
      is_default: Boolean(location.is_default)
    });
    setLocationStatus(null);
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus('Browser location is unavailable.');
      return;
    }
    setLocationStatus(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocationForm((prev) => ({
          ...prev,
          lat: String(position.coords.latitude),
          lng: String(position.coords.longitude)
        }));
        setLocationStatus('Current location captured.');
      },
      () => {
        setLocationStatus('Could not read your current location.');
      }
    );
  };

  const handleSaveLocation = async () => {
    if (!locationForm.label.trim()) {
      setLocationStatus('Location label is required.');
      return;
    }
    setLocationLoading(true);
    setLocationStatus(null);
    const payload = {
      label: locationForm.label.trim(),
      address_line: locationForm.address_line.trim(),
      region_id: locationForm.region_id || undefined,
      lat: locationForm.lat.trim() ? Number(locationForm.lat) : undefined,
      lng: locationForm.lng.trim() ? Number(locationForm.lng) : undefined,
      is_default: Boolean(locationForm.is_default)
    };
    try {
      if (!hasSession) {
        const nextLocation: UserLocation = {
          id: locationForm.id || `guest_location_${Date.now()}`,
          label: payload.label,
          address_line: payload.address_line,
          region_id: payload.region_id,
          lat: payload.lat,
          lng: payload.lng,
          is_default: payload.is_default
        } as UserLocation;
        const nextLocations = (() => {
          const base = Array.isArray(savedLocations) ? [...savedLocations] : [];
          const idx = base.findIndex((item) => item.id === nextLocation.id);
          const normalized = payload.is_default
            ? base.map((item) => ({ ...item, is_default: false }))
            : base;
          if (idx >= 0) {
            normalized[idx] = nextLocation;
            return normalized;
          }
          return [nextLocation, ...normalized];
        })();
        setSavedLocations(nextLocations);
        writeGuestJson('locations', nextLocations);
        setLocationStatus(locationForm.id ? 'Saved location updated.' : 'Saved location added.');
        resetLocationForm();
        return;
      }
      if (locationForm.id) {
        await updateUserLocation(locationForm.id, { id: locationForm.id, ...payload } as UserLocation);
        setLocationStatus('Saved location updated.');
      } else {
        await createUserLocation({ id: '', ...payload } as UserLocation);
        setLocationStatus('Saved location added.');
      }
      await loadSavedLocations();
      resetLocationForm();
    } catch (err: any) {
      setLocationStatus(err?.message || 'Unable to save location.');
    } finally {
      setLocationLoading(false);
    }
  };

  const handleDeleteLocation = async (id: string) => {
    setLocationLoading(true);
    setLocationStatus(null);
    try {
      if (!hasSession) {
        const nextLocations = savedLocations.filter((item) => item.id !== id);
        setSavedLocations(nextLocations);
        writeGuestJson('locations', nextLocations);
        if (locationForm.id === id) {
          resetLocationForm();
        }
        setLocationStatus('Saved location removed.');
        return;
      }
      await deleteUserLocation(id);
      await loadSavedLocations();
      if (locationForm.id === id) {
        resetLocationForm();
      }
      setLocationStatus('Saved location removed.');
    } catch (err: any) {
      setLocationStatus(err?.message || 'Unable to delete location.');
    } finally {
      setLocationLoading(false);
    }
  };

  const applyProfilePreset = (profile: string) => {
    const normalized = profile.toLowerCase().replace(/\s+/g, '_');
    setComparisonProfile(normalized);
    if (normalized === 'deal_hunter' || normalized === 'aggressive_deals') {
      setComparisonWeights({ price: 50, convenience: 20, trust: 10, quality: 10, ownership: 10 });
    } else if (normalized === 'trust_first') {
      setComparisonWeights({ price: 20, convenience: 20, trust: 50, quality: 5, ownership: 5 });
    } else if (normalized === 'speed_priority') {
      setComparisonWeights({ price: 20, convenience: 50, trust: 10, quality: 10, ownership: 10 });
    } else {
      setComparisonWeights({ price: 30, convenience: 25, trust: 20, quality: 15, ownership: 10 });
    }
  };

  const handleSaveComparisonPreferences = async () => {
    setComparisonStatus(null);
    if (totalWeight <= 0) {
      setComparisonStatus('Weights must total 100%.');
      return;
    }
    try {
      if (!hasSession) {
        const payload = {
          comparison_weights: comparisonWeights,
          deal_thresholds: dealThresholds,
          comparison_profile: comparisonProfile || 'custom'
        };
        writeGuestJson('comparison', payload);
        setComparisonStatus('Comparison preferences saved.');
        return;
      }
      const payload = {
        comparison_weights: comparisonWeights,
        deal_thresholds: dealThresholds,
        comparison_profile: comparisonProfile || 'custom'
      };
      const saved = await updateComparisonPreferences(payload);
      if (saved?.comparison_profile) setComparisonProfile(saved.comparison_profile);
      setComparisonStatus('Comparison preferences saved.');
    } catch (err: any) {
      setComparisonStatus(err?.message || 'Unable to save preferences.');
    }
  };

  const handleExport = async () => {
    setExportStatus(null);
    if (!hasSession) {
      onRequireLogin?.('Sign in to export your data.');
      setExportStatus('Sign in to export your data.');
      return;
    }
    if (!exportForm.exportType.trim()) {
      setExportStatus('export_type is required');
      return;
    }
    if (exportForm.verificationMethod === 'recent_login' && !exportForm.recentLoginAt) {
      setExportStatus('recent_login_at is required for recent_login');
      return;
    }
    const recentLoginAt = exportForm.recentLoginAt
      ? new Date(exportForm.recentLoginAt).toISOString()
      : undefined;
    try {
      const resp = await requestSettingsExport({
        export_type: exportForm.exportType.trim(),
        verification_method: exportForm.verificationMethod,
        recent_login_at: recentLoginAt
      });
      setExportStatus(resp?.status || 'queued');
    } catch (err: any) {
      setExportStatus(err?.message || 'export failed');
    }
  };

  const handleDelete = async () => {
    setDeleteStatus(null);
    if (!hasSession) {
      onRequireLogin?.('Sign in to request account deletion.');
      setDeleteStatus('Sign in to request account deletion.');
      return;
    }
    if (!deleteForm.supportTicketId.trim()) {
      setDeleteStatus('support_ticket_id is required');
      return;
    }
    try {
      const resp = await requestSettingsDeletion({
        verification_method: deleteForm.verificationMethod,
        mfa: deleteForm.mfa,
        verified_device: deleteForm.verifiedDevice,
        support_ticket_id: deleteForm.supportTicketId.trim()
      });
      setDeleteStatus(resp?.status || 'queued');
    } catch (err: any) {
      setDeleteStatus(err?.message || 'delete failed');
    }
  };

  React.useEffect(() => {
    if (!uiPrefsLoaded) return;
    void persistUiPrefs({ voiceFeedback });
  }, [voiceFeedback, uiPrefsLoaded]);

  React.useEffect(() => {
    if (!uiPrefsLoaded) return;
    void persistUiPrefs({ voiceDirections });
  }, [voiceDirections, uiPrefsLoaded]);

  React.useEffect(() => {
    if (!uiPrefsLoaded) return;
    const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
    const resolved = theme === 'system' ? (prefersDark ? 'dark' : 'light') : theme;
    document.documentElement.dataset.theme = resolved;
    void persistUiPrefs({ theme });
  }, [theme, uiPrefsLoaded]);

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
      <div className="p-6 bg-white border-b border-zinc-100 sticky top-0 z-10 flex items-center gap-3">
        <img
          src="/logo-header.jpg"
          alt="Sconnect"
          className="w-8 h-8 rounded-lg object-cover"
        />
        <h1 className="text-2xl font-bold text-zinc-900">Settings</h1>
      </div>

      <div className="p-6 space-y-8">
        {preferenceStatus && (
          <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-[10px] font-bold text-zinc-600 shadow-sm">
            {preferenceStatus}
          </div>
        )}
        {sections.map((section, idx) => (
          <div key={idx} className="space-y-3">
            <h2 className="text-xs font-bold uppercase text-zinc-400 tracking-widest px-2">{section.title}</h2>
            <div className="bg-white rounded-2xl border border-zinc-100 overflow-hidden shadow-sm">
              {section.items.map((item, itemIdx) => (
                <button 
                  key={itemIdx}
                  onClick={() => {
                    if (item.label === 'Notifications') {
                      onOpenNotifications?.();
                      return;
                    }
                    if (item.label === 'Personal Information') {
                      onOpenProfile?.();
                      return;
                    }
                    if (item.label === 'Password & Security') {
                      onOpenSecurity?.();
                      return;
                    }
                    if (item.label === 'Payments & Payouts') {
                      onOpenPayments?.();
                      return;
                    }
                    if (item.label === 'Help Center') {
                      onOpenSupport?.();
                      return;
                    }
                    if (item.label === 'Terms & Policies') {
                      onOpenPolicies?.();
                    }
                  }}
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

        <button
          onClick={() => {
            if (!hasSession) {
              onRequireLogin?.('Sign in to use account actions.');
              return;
            }
            const keysToClear = [
              'soko:auth_token',
              'soko:refresh_token',
              'soko:user_id',
              'soko:role',
              'soko:session_id',
              'soko:tenant_id',
              'soko:username',
              'soko:display_name'
            ];
            keysToClear.forEach((key) => setAuthItem(key, ''));
            setPreferenceStatus('Signed out.');
            window.location.hash = '#login';
            window.location.reload();
          }}
          className="w-full flex items-center justify-center gap-2 p-4 bg-white text-red-500 rounded-2xl border border-red-100 font-bold text-sm shadow-sm hover:bg-red-50 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          Log Out
        </button>

        {/* Data Portability */}
        <div className="bg-white rounded-2xl border border-zinc-100 p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <Download className="w-5 h-5 text-indigo-500" />
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold text-zinc-900">Download Your Data</p>
                {!hasSession && (
                  <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.24em] text-amber-700">
                    Account only
                  </span>
                )}
              </div>
              <p className="text-[10px] text-zinc-500">Export your activity and contributions.</p>
            </div>
          </div>
          <div className="space-y-3">
            <input
              value={exportForm.exportType}
              onChange={(e) => setExportForm((prev) => ({ ...prev, exportType: e.target.value }))}
              placeholder="export_type (e.g., full)"
              className="w-full p-3 bg-zinc-50 rounded-xl text-xs font-bold"
            />
            <select
              value={exportForm.verificationMethod}
              onChange={(e) => setExportForm((prev) => ({ ...prev, verificationMethod: e.target.value }))}
              className="w-full p-3 bg-zinc-50 rounded-xl text-xs font-bold"
            >
              <option value="mfa">mfa</option>
              <option value="recent_login">recent_login</option>
            </select>
            {exportForm.verificationMethod === 'recent_login' && (
              <input
                type="datetime-local"
                value={exportForm.recentLoginAt}
                onChange={(e) => setExportForm((prev) => ({ ...prev, recentLoginAt: e.target.value }))}
                className="w-full p-3 bg-zinc-50 rounded-xl text-xs font-bold"
              />
            )}
            <button
              onClick={handleExport}
              className="w-full py-3 bg-zinc-900 text-white rounded-xl text-xs font-bold"
            >
              Export Data
            </button>
            {exportStatus && (
              <div className="text-[10px] font-bold text-zinc-500">Status: {exportStatus}</div>
            )}
          </div>
        </div>

        {/* Data Dashboard */}
        <div className="bg-white rounded-2xl border border-zinc-100 p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <Database className="w-5 h-5 text-emerald-500" />
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold text-zinc-900">View My Data</p>
                {!hasSession && (
                  <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.24em] text-amber-700">
                    Account only
                  </span>
                )}
              </div>
              <p className="text-[10px] text-zinc-500">
                {hasSession ? 'Transparent summary of your activity.' : 'Sign in to view your account data.'}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 text-[10px] font-bold text-zinc-600">
            <div className="p-3 bg-zinc-50 rounded-2xl">Searches: {dataSummary.searches}</div>
            <div className="p-3 bg-zinc-50 rounded-2xl">Receipts: {dataSummary.receipts}</div>
            <div className="p-3 bg-zinc-50 rounded-2xl">Purchases: {dataSummary.purchases}</div>
            <div className="p-3 bg-zinc-50 rounded-2xl">Reviews: {dataSummary.reviews}</div>
          </div>
          <button
            onClick={() => {
              if (!hasSession) {
                onRequireLogin?.('Sign in to open your data dashboard.');
                return;
              }
              onOpenDataDashboard?.();
            }}
            className="mt-3 w-full py-3 bg-emerald-600 text-white rounded-xl text-xs font-bold"
          >
            {hasSession ? 'Open Data Dashboard' : 'Sign in to view data'}
          </button>
        </div>

        {/* Saved Locations */}
        <div className="bg-white rounded-2xl border border-zinc-100 p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <MapPin className="w-5 h-5 text-indigo-500" />
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold text-zinc-900">Saved Locations</p>
                {!hasSession && (
                  <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.24em] text-emerald-700">
                    Local only
                  </span>
                )}
              </div>
              <p className="text-[10px] text-zinc-500">Keep home, work, and pickup spots ready for search and delivery.</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                value={locationForm.label}
                onChange={(e) => setLocationForm((prev) => ({ ...prev, label: e.target.value }))}
                placeholder="Label e.g. Home"
                className="w-full p-3 bg-zinc-50 rounded-xl text-xs font-bold"
              />
              <input
                value={locationForm.address_line}
                onChange={(e) => setLocationForm((prev) => ({ ...prev, address_line: e.target.value }))}
                placeholder="Address line"
                className="w-full p-3 bg-zinc-50 rounded-xl text-xs font-bold"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <select
                value={locationForm.region_id}
                onChange={(e) => setLocationForm((prev) => ({ ...prev, region_id: e.target.value }))}
                className="w-full p-3 bg-zinc-50 rounded-xl text-xs font-bold"
              >
                <option value="">Select region</option>
                {locationRegions.map((region) => (
                  <option key={region.id} value={region.id}>
                    {regionNameById[region.id]}
                  </option>
                ))}
              </select>
              <div className="flex gap-2">
                <input
                  value={locationForm.lat}
                  onChange={(e) => setLocationForm((prev) => ({ ...prev, lat: e.target.value }))}
                  placeholder="Lat"
                  className="w-full p-3 bg-zinc-50 rounded-xl text-xs font-bold"
                />
                <input
                  value={locationForm.lng}
                  onChange={(e) => setLocationForm((prev) => ({ ...prev, lng: e.target.value }))}
                  placeholder="Lng"
                  className="w-full p-3 bg-zinc-50 rounded-xl text-xs font-bold"
                />
              </div>
            </div>
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleUseCurrentLocation}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-indigo-50 text-indigo-700 text-[10px] font-black uppercase"
              >
                <LocateFixed className="w-4 h-4" />
                Use Current Location
              </button>
              <button
                type="button"
                onClick={() => setLocationForm((prev) => ({ ...prev, is_default: !prev.is_default }))}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-zinc-100 text-zinc-700 text-[10px] font-black uppercase"
              >
                {locationForm.is_default ? <Home className="w-4 h-4" /> : <MapPin className="w-4 h-4" />}
                {locationForm.is_default ? 'Default' : 'Make Default'}
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleSaveLocation}
                disabled={locationLoading}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-900 text-white text-[10px] font-black uppercase disabled:opacity-60"
              >
                <Plus className="w-4 h-4" />
                {locationForm.id ? 'Update Location' : 'Add Location'}
              </button>
              {locationForm.id && (
                <button
                  type="button"
                  onClick={resetLocationForm}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-100 text-zinc-700 text-[10px] font-black uppercase"
                >
                  Cancel Edit
                </button>
              )}
            </div>
            {locationStatus && (
              <div className="text-[10px] font-bold text-zinc-500">{locationStatus}</div>
            )}
          </div>

          <div className="mt-4 space-y-2">
            {savedLocations.map((location) => (
              <div key={location.id} className="rounded-2xl border border-zinc-100 bg-zinc-50 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-zinc-900">{location.label}</span>
                      {location.is_default && (
                        <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                          Default
                        </span>
                      )}
                    </div>
                    <div className="mt-1 text-[10px] font-bold text-zinc-500">
                      {location.address_line || 'No address line'}
                    </div>
                    <div className="text-[10px] font-bold text-zinc-400">
                      {location.region_id ? regionNameById[location.region_id] || location.region_id : 'No region selected'}
                      {location.lat !== undefined && location.lng !== undefined ? ` • ${Number(location.lat).toFixed(5)}, ${Number(location.lng).toFixed(5)}` : ''}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!location.is_default && (
                      <button
                        onClick={async () => {
                          if (!hasSession) {
                            const nextLocations = savedLocations.map((item) => ({
                              ...item,
                              is_default: item.id === location.id
                            }));
                            setSavedLocations(nextLocations);
                            writeGuestJson('locations', nextLocations);
                            setLocationStatus('Default location updated.');
                            return;
                          }
                          setLocationLoading(true);
                          try {
                            await updateUserLocation(location.id, { ...location, is_default: true } as UserLocation);
                            await loadSavedLocations();
                          } catch (err: any) {
                            setLocationStatus(err?.message || 'Unable to make default.');
                          } finally {
                            setLocationLoading(false);
                          }
                        }}
                        className="text-[9px] font-black uppercase px-2 py-1 rounded-full bg-indigo-50 text-indigo-700"
                      >
                        Set Default
                      </button>
                    )}
                    <button
                      onClick={() => handleEditLocation(location)}
                      className="text-[9px] font-black uppercase px-2 py-1 rounded-full bg-zinc-100 text-zinc-700 inline-flex items-center gap-1"
                    >
                      <Pencil className="w-3 h-3" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteLocation(location.id)}
                      className="text-[9px] font-black uppercase px-2 py-1 rounded-full bg-rose-50 text-rose-700 inline-flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {savedLocations.length === 0 && (
              <div className="text-[10px] font-bold text-zinc-400">
                No saved locations yet.
              </div>
            )}
          </div>
        </div>

        {/* Favorite Shop Alerts */}
        <div className="bg-white rounded-2xl border border-zinc-100 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-zinc-900">Favorite Shop Alerts</p>
              <p className="text-[10px] text-zinc-500">Notify me when favorite shops add new items.</p>
            </div>
            <button onClick={() => handlePrefToggle('watched_items')} className="p-1 rounded-full">
              {notificationPrefs.watched_items ? <ToggleRight className="w-6 h-6 text-emerald-600" /> : <ToggleLeft className="w-6 h-6 text-zinc-300" />}
            </button>
          </div>
        </div>

        {/* Alert Preferences */}
        <div className="bg-white rounded-2xl border border-zinc-100 p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <Bell className="w-5 h-5 text-amber-500" />
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold text-zinc-900">Alert Preferences</p>
                {!hasSession && (
                  <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.24em] text-emerald-700">
                    Local only
                  </span>
                )}
              </div>
              <p className="text-[10px] text-zinc-500">Choose which alerts you want to receive.</p>
            </div>
          </div>
          {[
            { key: 'price_drops', label: 'Price drop alerts' },
            { key: 'back_in_stock', label: 'Back-in-stock alerts' },
            { key: 'trending', label: 'Trending near you alerts' },
          ].map(item => (
            <div key={item.key} className="flex items-center justify-between py-2">
              <span className="text-[10px] font-bold text-zinc-600">{item.label}</span>
              <button
                onClick={() => handlePrefToggle(item.key as keyof typeof notificationPrefs)}
                className="p-1 rounded-full"
              >
                {notificationPrefs[item.key as keyof typeof notificationPrefs] ? (
                  <ToggleRight className="w-6 h-6 text-emerald-600" />
                ) : (
                  <ToggleLeft className="w-6 h-6 text-zinc-300" />
                )}
              </button>
            </div>
          ))}
        </div>

        {/* Consent & Privacy */}
        <div className="bg-white rounded-2xl border border-zinc-100 p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <ShieldCheck className="w-5 h-5 text-emerald-500" />
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold text-zinc-900">Data Sharing Consents</p>
                {!hasSession && (
                  <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.24em] text-emerald-700">
                    Local only
                  </span>
                )}
              </div>
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
                onClick={() => handleConsentToggle(item.key as keyof typeof consents)}
                disabled={Boolean(consentLoading[item.key])}
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

        {consentHistory.length > 0 && (
          <div className="bg-white rounded-2xl border border-zinc-100 p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <ShieldCheck className="w-5 h-5 text-emerald-500" />
              <div>
                <p className="text-sm font-bold text-zinc-900">Consent History</p>
                <p className="text-[10px] text-zinc-500">Most recent consent changes.</p>
              </div>
              <div className="ml-auto">
                <button
                  onClick={() => setShowConsentHistory(true)}
                  className="px-3 py-1.5 rounded-full text-[9px] font-black uppercase bg-zinc-100 text-zinc-600"
                >
                  View All
                </button>
              </div>
            </div>
            <div className="space-y-2">
              {consentHistory.slice(0, 5).map((item, idx) => (
                <div key={`${item.consent_type}-${item.created_at || idx}`} className="flex items-center justify-between text-[10px] font-bold text-zinc-600">
                  <span className="uppercase">{item.consent_type}</span>
                  <span className={item.consent_given ? 'text-emerald-600' : 'text-rose-500'}>
                    {item.consent_given ? 'Granted' : 'Denied'}
                  </span>
                  <span className="text-zinc-400">
                    {item.created_at ? new Date(item.created_at).toLocaleString() : '—'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Comparison Preferences */}
        <div className="bg-white rounded-2xl border border-zinc-100 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Database className="w-5 h-5 text-indigo-500" />
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-zinc-900">My Comparison Preferences</p>
                  {!hasSession && (
                    <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.24em] text-emerald-700">
                      Local only
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-zinc-500">Control how Value Score ranks sellers.</p>
              </div>
            </div>
            <span className="text-[10px] font-bold text-zinc-400 uppercase">Total {Math.round(totalWeight)}%</span>
          </div>
          {Math.round(totalWeight) !== 100 && (
            <div className="mb-3 text-[10px] font-bold text-amber-600">
              Weights will normalize to 100% on save.
            </div>
          )}

          <div className="space-y-3">
            {([
              { key: 'price', label: 'Price' },
              { key: 'convenience', label: 'Convenience' },
              { key: 'trust', label: 'Trust' },
              { key: 'quality', label: 'Quality' },
              { key: 'ownership', label: 'Ownership' }
            ] as const).map((item) => (
              <div key={item.key} className="flex items-center gap-3">
                <span className="w-20 text-[10px] font-bold text-zinc-600">{item.label}</span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={comparisonWeights[item.key]}
                  onChange={(e) => updateWeight(item.key, Number(e.target.value))}
                  className="flex-1 accent-indigo-600"
                />
                <span className="w-10 text-right text-[10px] font-bold text-zinc-500">
                  {Math.round(comparisonWeights[item.key])}%
                </span>
              </div>
            ))}
          </div>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-[10px] font-bold text-zinc-600">
            <label className="flex items-center justify-between gap-3">
              Best Value ≥
              <input
                type="number"
                min={80}
                max={95}
                value={dealThresholds.best_value}
                onChange={(e) => updateThreshold('best_value', Number(e.target.value))}
                className="w-16 px-2 py-1 rounded-lg bg-zinc-50 border border-zinc-200 text-[10px]"
              />
            </label>
            <label className="flex items-center justify-between gap-3">
              Fastest Pickup ≤
              <input
                type="number"
                min={15}
                max={60}
                value={dealThresholds.fastest_pickup}
                onChange={(e) => updateThreshold('fastest_pickup', Number(e.target.value))}
                className="w-16 px-2 py-1 rounded-lg bg-zinc-50 border border-zinc-200 text-[10px]"
              />
              <span className="text-[9px] text-zinc-400">min</span>
            </label>
            <label className="flex items-center justify-between gap-3">
              Trusted Seller ≥
              <input
                type="number"
                min={70}
                max={95}
                value={dealThresholds.trusted_seller}
                onChange={(e) => updateThreshold('trusted_seller', Number(e.target.value))}
                className="w-16 px-2 py-1 rounded-lg bg-zinc-50 border border-zinc-200 text-[10px]"
              />
            </label>
            <label className="flex items-center justify-between gap-3">
              Nearby ≤
              <input
                type="number"
                min={1}
                max={10}
                value={dealThresholds.nearby}
                onChange={(e) => updateThreshold('nearby', Number(e.target.value))}
                className="w-16 px-2 py-1 rounded-lg bg-zinc-50 border border-zinc-200 text-[10px]"
              />
              <span className="text-[9px] text-zinc-400">km</span>
            </label>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {[
              { id: 'default', label: 'Default' },
              { id: 'aggressive_deals', label: 'Aggressive Deals' },
              { id: 'deal_hunter', label: 'Deal Hunter' },
              { id: 'trust_first', label: 'Trust First' },
              { id: 'speed_priority', label: 'Speed Priority' }
            ].map((preset) => (
              <button
                key={preset.id}
                onClick={() => applyProfilePreset(preset.id)}
                className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase ${
                  comparisonProfile === preset.id
                    ? 'bg-indigo-600 text-white'
                    : 'bg-zinc-100 text-zinc-600'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>

          <div className="mt-4 flex items-center justify-between">
            <button
              onClick={handleSaveComparisonPreferences}
              className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black"
            >
              Save Preferences
            </button>
            {comparisonStatus && (
              <span className="text-[10px] font-bold text-zinc-500">{comparisonStatus}</span>
            )}
          </div>
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

        {/* Voice Directions */}
        <div className="bg-white rounded-2xl border border-zinc-100 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Volume2 className="w-5 h-5 text-indigo-500" />
              <div>
                <p className="text-sm font-bold text-zinc-900">Voice Directions</p>
                <p className="text-[10px] text-zinc-500">Read route steps aloud in search and compare views.</p>
              </div>
            </div>
            <button onClick={() => setVoiceDirections(prev => !prev)} className="p-1 rounded-full">
              {voiceDirections ? <ToggleRight className="w-6 h-6 text-emerald-600" /> : <ToggleLeft className="w-6 h-6 text-zinc-300" />}
            </button>
          </div>
        </div>

        {/* Appearance */}
        <div className="bg-white rounded-2xl border border-zinc-100 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {theme === 'dark' ? (
                <Moon className="w-5 h-5 text-indigo-500" />
              ) : theme === 'light' ? (
                <Sun className="w-5 h-5 text-amber-500" />
              ) : (
                <Sun className="w-5 h-5 text-zinc-400" />
              )}
              <div>
                <p className="text-sm font-bold text-zinc-900">Appearance</p>
                <p className="text-[10px] text-zinc-500">Switch between light and dark mode.</p>
              </div>
            </div>
            <div className="flex items-center gap-1 p-1 bg-zinc-100 rounded-full">
              {(['light', 'dark', 'system'] as const).map(mode => (
                <button
                  key={mode}
                  onClick={() => setTheme(mode)}
                  className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${
                    theme === mode ? 'bg-zinc-900 text-white' : 'text-zinc-500'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
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
          <div className="space-y-3">
            <input
              value={deleteForm.supportTicketId}
              onChange={(e) => setDeleteForm((prev) => ({ ...prev, supportTicketId: e.target.value }))}
              placeholder="support_ticket_id"
              className="w-full p-3 bg-zinc-50 rounded-xl text-xs font-bold"
            />
            <div className="flex items-center justify-between text-[10px] font-bold text-zinc-600">
              <span>MFA verified</span>
              <button onClick={() => setDeleteForm((prev) => ({ ...prev, mfa: !prev.mfa }))} className="p-1 rounded-full">
                {deleteForm.mfa ? <ToggleRight className="w-6 h-6 text-emerald-600" /> : <ToggleLeft className="w-6 h-6 text-zinc-300" />}
              </button>
            </div>
            <div className="flex items-center justify-between text-[10px] font-bold text-zinc-600">
              <span>Verified device</span>
              <button onClick={() => setDeleteForm((prev) => ({ ...prev, verifiedDevice: !prev.verifiedDevice }))} className="p-1 rounded-full">
                {deleteForm.verifiedDevice ? <ToggleRight className="w-6 h-6 text-emerald-600" /> : <ToggleLeft className="w-6 h-6 text-zinc-300" />}
              </button>
            </div>
            <button onClick={handleDelete} className="w-full py-3 bg-red-600 text-white rounded-xl text-xs font-bold">
              Request Data Deletion
            </button>
            {deleteStatus && (
              <div className="text-[10px] font-bold text-zinc-500">Status: {deleteStatus}</div>
            )}
          </div>
        </div>

        <div className="text-center pb-10">
          <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">Sconnect Commerce Intelligence</p>
          <p className="text-[10px] text-zinc-300">Version 2.4.0 (Build 842)</p>
        </div>
      </div>
      {showConsentHistory && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-2xl border border-zinc-100 shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-zinc-100 flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-zinc-900">All Consent History</p>
                <p className="text-[10px] text-zinc-500">Complete change log.</p>
              </div>
              <button
                onClick={() => setShowConsentHistory(false)}
                className="px-3 py-1.5 rounded-full text-[9px] font-black uppercase bg-zinc-100 text-zinc-600"
              >
                Close
              </button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto p-4 space-y-2">
              {consentHistory.map((item, idx) => (
                <div
                  key={`full-${item.consent_type}-${item.created_at || idx}`}
                  className="flex items-center justify-between text-[10px] font-bold text-zinc-700"
                >
                  <span className="uppercase">{item.consent_type}</span>
                  <span className={item.consent_given ? 'text-emerald-600' : 'text-rose-500'}>
                    {item.consent_given ? 'Granted' : 'Denied'}
                  </span>
                  <span className="text-zinc-400">
                    {item.created_at ? new Date(item.created_at).toLocaleString() : '—'}
                  </span>
                </div>
              ))}
              {consentHistory.length === 0 && (
                <div className="text-[10px] font-bold text-zinc-400">No history available.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
