import React from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Lock, Phone, ShoppingBag, Store, UserPlus } from 'lucide-react';
import { getSessionInfo } from '../lib/identityApi';
import { getDevicePayload, register } from '../lib/authApi';
import { postAnalyticsEvent } from '../lib/analyticsApi';
import { getAuthItem, setAuthItem } from '../lib/authStorage';
import { updateProfile } from '../lib/profileApi';

interface RegisterProps {
  onBack?: () => void;
  onLoginOpen?: () => void;
  onAuthenticated?: () => void;
  contextMessage?: string | null;
}

export const Register: React.FC<RegisterProps> = ({ onBack, onLoginOpen, onAuthenticated, contextMessage }) => {
  const getTokenClaims = (token: string) => {
    try {
      const payload = token.split('.')[1];
      if (!payload) return null;
      const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
      const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
      return JSON.parse(atob(padded)) as { sub?: string; tenant_id?: string; role?: string };
    } catch {
      return null;
    }
  };
  const accountOptions = [
    {
      id: 'buyer' as const,
      label: 'Buyer account',
      helper: 'Discover products and shop deals',
      icon: ShoppingBag,
      activeClass: 'border-emerald-500 bg-emerald-50 text-emerald-800',
      idleClass: 'border-zinc-200 bg-zinc-50 text-zinc-700',
    },
    {
      id: 'seller' as const,
      label: 'Seller account',
      helper: 'Open a shop and reach customers',
      icon: Store,
      activeClass: 'border-amber-500 bg-amber-50 text-amber-800',
      idleClass: 'border-zinc-200 bg-zinc-50 text-zinc-700',
    },
  ];
  const [form, setForm] = React.useState({
    display_name: '',
    phone: '',
    pin: '',
    confirmPin: '',
    tenant_id: '',
    account_type: 'buyer' as 'buyer' | 'seller',
  });
  const [status, setStatus] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  React.useEffect(() => {
    try {
      const tenant =
        getAuthItem('soko:tenant_id') ||
        (import.meta as any).env?.VITE_GUEST_TENANT_ID ||
        (import.meta as any).env?.VITE_TENANT_ID ||
        '';
      setForm(prev => ({ ...prev, tenant_id: tenant }));
    } catch {}
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);
    if (!form.display_name.trim()) {
      setStatus('Tell us what name to show on your profile.');
      return;
    }
    if (form.pin.trim() !== form.confirmPin.trim()) {
      setStatus('PINs do not match.');
      return;
    }
    setLoading(true);
    try {
      const tokens = await register({
        display_name: form.display_name.trim(),
        phone: form.phone.trim(),
        pin: form.pin.trim(),
        tenant_id: form.tenant_id.trim(),
        device: getDevicePayload(),
      });
      try {
        setAuthItem('soko:auth_token', tokens.access_token);
        setAuthItem('soko:refresh_token', tokens.refresh_token);
        setAuthItem('soko:tenant_id', form.tenant_id.trim());
        setAuthItem('soko:username', form.tenant_id.trim());
        setAuthItem('soko:display_name', form.display_name.trim());
        setAuthItem('soko:account_intent', form.account_type);
      } catch {}
      try {
        const session = await getSessionInfo();
        if (session?.user_id) setAuthItem('soko:user_id', session.user_id);
        if (session?.tenant_id) {
          setAuthItem('soko:tenant_id', session.tenant_id);
          setAuthItem('soko:username', session.tenant_id);
        }
        if (session?.role) {
          setAuthItem('soko:role', String(session.role).toLowerCase());
        } else {
          setAuthItem('soko:role', form.account_type);
        }
        if (session?.session_id) setAuthItem('soko:session_id', session.session_id);
      } catch {}
      const claims = getTokenClaims(tokens.access_token);
      if (claims?.sub) setAuthItem('soko:user_id', claims.sub);
      if (claims?.tenant_id) {
        setAuthItem('soko:tenant_id', claims.tenant_id);
        setAuthItem('soko:username', claims.tenant_id);
      }
      setAuthItem('soko:role', String(claims?.role || form.account_type).toLowerCase());
      try {
        await updateProfile({ display_name: form.display_name.trim() });
      } catch {}
      try {
        const phone = form.phone.trim();
        await postAnalyticsEvent({
          name: 'auth_register',
          action: 'success',
          properties: {
            tenant_id: form.tenant_id.trim(),
            phone_last4: phone.slice(-4),
            account_type: form.account_type,
          },
        });
      } catch {}
      setStatus('Account created. Welcome!');
      onAuthenticated?.();
    } catch (err: any) {
      setStatus(err?.message || 'Unable to register.');
    } finally {
      setLoading(false);
    }
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
          <p className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold">Get Started</p>
          <h1 className="text-lg font-black text-zinc-900">Create your account</h1>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl border border-zinc-100 shadow-sm p-6 max-w-md mx-auto w-full"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-2xl bg-emerald-50 text-emerald-600">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-zinc-900">Fast registration</p>
              <p className="text-xs text-zinc-500">Phone + 4-digit PIN to start.</p>
            </div>
          </div>

          {contextMessage && (
            <div className="mb-4 rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-[11px] font-bold text-amber-800">
              {contextMessage}
            </div>
          )}

          {status && (
            <div className="mb-4 text-[11px] font-bold rounded-2xl px-4 py-3 bg-zinc-50 text-zinc-700 border border-zinc-100">
              {status}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <span className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold">Account Type</span>
              <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {accountOptions.map((option) => {
                  const Icon = option.icon;
                  const selected = form.account_type === option.id;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setForm(prev => ({ ...prev, account_type: option.id }))}
                      className={`rounded-2xl border px-3 py-3 text-left transition ${
                        selected ? option.activeClass : option.idleClass
                      }`}
                      aria-pressed={selected}
                    >
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4" />
                        <span className="text-xs font-black uppercase tracking-wide">{option.label}</span>
                      </div>
                      <p className="mt-1 text-[11px] font-semibold opacity-80">{option.helper}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            <label className="block">
              <span className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold">Display Name</span>
              <div className="mt-2 flex items-center gap-2 bg-zinc-50 rounded-2xl border border-zinc-200 px-3 py-2">
                <UserPlus className="w-4 h-4 text-zinc-400" />
                <input
                  value={form.display_name}
                  onChange={(e) => setForm(prev => ({ ...prev, display_name: e.target.value }))}
                  className="flex-1 bg-transparent text-sm font-semibold text-zinc-900 focus:outline-none"
                  placeholder={form.account_type === 'seller' ? 'Mama Mboga Corner' : 'Jane Wanjiku'}
                  required
                />
              </div>
            </label>

            <label className="block">
              <span className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold">Phone Number</span>
              <div className="mt-2 flex items-center gap-2 bg-zinc-50 rounded-2xl border border-zinc-200 px-3 py-2">
                <Phone className="w-4 h-4 text-zinc-400" />
                <input
                  value={form.phone}
                  onChange={(e) => setForm(prev => ({ ...prev, phone: e.target.value }))}
                  className="flex-1 bg-transparent text-sm font-semibold text-zinc-900 focus:outline-none"
                  placeholder="+254712345678"
                  required
                />
              </div>
            </label>

            <label className="block">
              <span className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold">PIN</span>
              <div className="mt-2 flex items-center gap-2 bg-zinc-50 rounded-2xl border border-zinc-200 px-3 py-2">
                <Lock className="w-4 h-4 text-zinc-400" />
                <input
                  type="password"
                  value={form.pin}
                  onChange={(e) => setForm(prev => ({ ...prev, pin: e.target.value }))}
                  className="flex-1 bg-transparent text-sm font-semibold text-zinc-900 focus:outline-none"
                  placeholder="4-digit PIN"
                  maxLength={6}
                  required
                />
              </div>
            </label>

            <label className="block">
              <span className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold">Confirm PIN</span>
              <div className="mt-2 flex items-center gap-2 bg-zinc-50 rounded-2xl border border-zinc-200 px-3 py-2">
                <Lock className="w-4 h-4 text-zinc-400" />
                <input
                  type="password"
                  value={form.confirmPin}
                  onChange={(e) => setForm(prev => ({ ...prev, confirmPin: e.target.value }))}
                  className="flex-1 bg-transparent text-sm font-semibold text-zinc-900 focus:outline-none"
                  placeholder="Confirm PIN"
                  maxLength={6}
                  required
                />
              </div>
            </label>

            <label className="block">
              <span className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold">Username</span>
              <input
                value={form.tenant_id}
                onChange={(e) => setForm(prev => ({ ...prev, tenant_id: e.target.value }))}
                className="mt-2 w-full bg-zinc-50 rounded-2xl border border-zinc-200 px-3 py-2 text-sm font-semibold text-zinc-900 focus:outline-none"
                placeholder="your_username"
                required
              />
            </label>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 rounded-2xl text-xs font-black uppercase tracking-widest ${
                loading ? 'bg-zinc-200 text-zinc-500' : 'bg-emerald-600 text-white'
              }`}
            >
              {loading ? 'Creating…' : 'Create Account'}
            </button>
          </form>

        </motion.div>

        <div className="mt-6 text-center text-xs text-zinc-500">
          Already have an account?{' '}
          <button onClick={onLoginOpen} className="text-indigo-600 font-bold">
            Sign in
          </button>
        </div>
      </div>
    </div>
  );
};
