import React from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Lock, Phone, ShieldCheck } from 'lucide-react';
import { getSessionInfo } from '../lib/identityApi';
import { getDevicePayload, login } from '../lib/authApi';
import { postAnalyticsEvent } from '../lib/analyticsApi';
import { getAuthItem, setAuthItem } from '../lib/authStorage';

interface LoginProps {
  onBack?: () => void;
  onRegisterOpen?: () => void;
  onResetOpen?: () => void;
  onAuthenticated?: () => void;
  onBrowseFeed?: () => void;
  onBrowseSearch?: () => void;
  onBrowseShops?: () => void;
}

export const Login: React.FC<LoginProps> = ({ onBack, onRegisterOpen, onResetOpen, onAuthenticated, onBrowseFeed, onBrowseSearch, onBrowseShops }) => {
  const [form, setForm] = React.useState({
    phone: '',
    pin: '',
    tenant_id: '',
    remember: true,
  });
  const [status, setStatus] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  React.useEffect(() => {
    try {
      const tenant = getAuthItem('soko:tenant_id') || '';
      setForm(prev => ({ ...prev, tenant_id: tenant }));
    } catch {}
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);
    setLoading(true);
    try {
      const tokens = await login({
        phone: form.phone.trim(),
        pin: form.pin.trim(),
        tenant_id: form.tenant_id.trim(),
        device: getDevicePayload(),
      });
      try {
        if (form.remember) {
          setAuthItem('soko:auth_token', tokens.access_token);
          setAuthItem('soko:refresh_token', tokens.refresh_token);
          setAuthItem('soko:tenant_id', form.tenant_id.trim());
        }
      } catch {}
      try {
        const session = await getSessionInfo();
        if (session?.user_id) setAuthItem('soko:user_id', session.user_id);
        if (session?.tenant_id) setAuthItem('soko:tenant_id', session.tenant_id);
        if (session?.role) setAuthItem('soko:role', String(session.role).toLowerCase());
        if (session?.session_id) setAuthItem('soko:session_id', session.session_id);
      } catch {}
      try {
        const phone = form.phone.trim();
        await postAnalyticsEvent({
          name: 'auth_login',
          action: 'success',
          properties: {
            tenant_id: form.tenant_id.trim(),
            phone_last4: phone.slice(-4),
          },
        });
      } catch {}
      setStatus('Login successful.');
      onAuthenticated?.();
    } catch (err: any) {
      setStatus(err?.message || 'Unable to login.');
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
          <p className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold">Welcome Back</p>
          <h1 className="text-lg font-black text-zinc-900">Sign in to Sconnect</h1>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl border border-zinc-100 shadow-sm p-6 max-w-md mx-auto w-full"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-2xl bg-indigo-50 text-indigo-600">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-zinc-900">Secure login</p>
              <p className="text-xs text-zinc-500">Use your phone and 4-digit PIN.</p>
            </div>
          </div>

          {status && (
            <div className="mb-4 text-[11px] font-bold rounded-2xl px-4 py-3 bg-zinc-50 text-zinc-700 border border-zinc-100">
              {status}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
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
              <span className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold">Tenant ID</span>
              <input
                value={form.tenant_id}
                onChange={(e) => setForm(prev => ({ ...prev, tenant_id: e.target.value }))}
                className="mt-2 w-full bg-zinc-50 rounded-2xl border border-zinc-200 px-3 py-2 text-sm font-semibold text-zinc-900 focus:outline-none"
                placeholder="tenant_001"
                required
              />
            </label>

            <label className="flex items-center gap-2 text-xs font-bold text-zinc-500">
              <input
                type="checkbox"
                checked={form.remember}
                onChange={(e) => setForm(prev => ({ ...prev, remember: e.target.checked }))}
              />
              Remember me
            </label>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 rounded-2xl text-xs font-black uppercase tracking-widest ${
                loading ? 'bg-zinc-200 text-zinc-500' : 'bg-zinc-900 text-white'
              }`}
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
            <button
              type="button"
              onClick={onResetOpen}
              className="w-full text-xs font-bold text-indigo-600 mt-2"
            >
              Forgot your PIN?
            </button>
          </form>

          <div className="mt-6 rounded-2xl border border-zinc-100 bg-zinc-50 p-4">
            <p className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold">Browse as visitor</p>
            <p className="mt-1 text-xs text-zinc-600">You can explore public content without signing in.</p>
            <div className="mt-3 grid grid-cols-3 gap-2">
              <button type="button" onClick={onBrowseFeed} className="rounded-xl bg-white px-3 py-2 text-[10px] font-black text-zinc-700 border border-zinc-200">
                Feed
              </button>
              <button type="button" onClick={onBrowseSearch} className="rounded-xl bg-white px-3 py-2 text-[10px] font-black text-zinc-700 border border-zinc-200">
                Search
              </button>
              <button type="button" onClick={onBrowseShops} className="rounded-xl bg-white px-3 py-2 text-[10px] font-black text-zinc-700 border border-zinc-200">
                Shops
              </button>
            </div>
          </div>
        </motion.div>

        <div className="mt-6 text-center text-xs text-zinc-500">
          Don’t have an account?{' '}
          <button onClick={onRegisterOpen} className="text-indigo-600 font-bold">
            Create one
          </button>
        </div>
      </div>
    </div>
  );
};
