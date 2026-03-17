import React from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Lock, Phone, UserPlus } from 'lucide-react';
import { getSessionInfo } from '../lib/identityApi';
import { getApiBaseUrl, setApiBaseUrl } from '../lib/apiClient';
import { getDevicePayload, register } from '../lib/authApi';
import { postAnalyticsEvent } from '../lib/analyticsApi';

interface RegisterProps {
  onBack?: () => void;
  onLoginOpen?: () => void;
  onAuthenticated?: () => void;
}

export const Register: React.FC<RegisterProps> = ({ onBack, onLoginOpen, onAuthenticated }) => {
  const [form, setForm] = React.useState({
    phone: '',
    pin: '',
    confirmPin: '',
    tenant_id: '',
  });
  const [status, setStatus] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [apiBaseUrl, setApiBaseUrlState] = React.useState(getApiBaseUrl());
  const [apiStatus, setApiStatus] = React.useState<string | null>(null);

  React.useEffect(() => {
    try {
      const tenant = localStorage.getItem('soko:tenant_id') || '';
      setForm(prev => ({ ...prev, tenant_id: tenant }));
    } catch {}
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);
    if (form.pin.trim() !== form.confirmPin.trim()) {
      setStatus('PINs do not match.');
      return;
    }
    setLoading(true);
    try {
      const tokens = await register({
        phone: form.phone.trim(),
        pin: form.pin.trim(),
        tenant_id: form.tenant_id.trim(),
        device: getDevicePayload(),
      });
      try {
        localStorage.setItem('soko:auth_token', tokens.access_token);
        localStorage.setItem('soko:refresh_token', tokens.refresh_token);
        localStorage.setItem('soko:tenant_id', form.tenant_id.trim());
      } catch {}
      try {
        const session = await getSessionInfo();
        if (session?.user_id) localStorage.setItem('soko:user_id', session.user_id);
        if (session?.tenant_id) localStorage.setItem('soko:tenant_id', session.tenant_id);
        if (session?.role) localStorage.setItem('soko:role', String(session.role).toLowerCase());
        if (session?.session_id) localStorage.setItem('soko:session_id', session.session_id);
      } catch {}
      try {
        const phone = form.phone.trim();
        await postAnalyticsEvent({
          name: 'auth_register',
          action: 'success',
          properties: {
            tenant_id: form.tenant_id.trim(),
            phone_last4: phone.slice(-4),
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
          className="bg-white rounded-3xl border border-zinc-100 shadow-sm p-6"
        >
          <div className="mb-4 rounded-2xl border border-zinc-100 bg-zinc-50 p-4">
            <p className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold">API Connection</p>
            <p className="text-xs text-zinc-500 mt-1">Set your backend gateway URL before creating an account.</p>
            <input
              value={apiBaseUrl}
              onChange={(e) => setApiBaseUrlState(e.target.value)}
              placeholder="https://api.example.com"
              className="mt-3 w-full bg-white rounded-xl border border-zinc-200 px-3 py-2 text-xs font-bold text-zinc-900 focus:outline-none"
            />
            <div className="mt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const trimmed = apiBaseUrl.trim();
                  setApiBaseUrl(trimmed);
                  setApiStatus(trimmed ? 'Saved API base URL.' : 'Cleared API base URL.');
                }}
                className="px-3 py-2 rounded-xl text-[10px] font-black uppercase bg-zinc-900 text-white"
              >
                Save
              </button>
              {apiStatus && (
                <span className="text-[10px] font-bold text-zinc-500">{apiStatus}</span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-2xl bg-emerald-50 text-emerald-600">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-zinc-900">Fast registration</p>
              <p className="text-xs text-zinc-500">Phone + 4-digit PIN to start.</p>
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
              <span className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold">Tenant ID</span>
              <input
                value={form.tenant_id}
                onChange={(e) => setForm(prev => ({ ...prev, tenant_id: e.target.value }))}
                className="mt-2 w-full bg-zinc-50 rounded-2xl border border-zinc-200 px-3 py-2 text-sm font-semibold text-zinc-900 focus:outline-none"
                placeholder="tenant_001"
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
