import React from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, KeyRound, Phone } from 'lucide-react';
import { confirmPasswordReset, requestPasswordReset } from '../lib/authApi';
import { getAuthItem } from '../lib/authStorage';

interface PasswordResetProps {
  onBack?: () => void;
  onLoginOpen?: () => void;
}

export const PasswordReset: React.FC<PasswordResetProps> = ({ onBack, onLoginOpen }) => {
  const [step, setStep] = React.useState<'request' | 'confirm'>('request');
  const [form, setForm] = React.useState({
    phone: '',
    tenant_id: '',
    reset_code: '',
    new_pin: '',
    confirm_pin: '',
  });
  const [status, setStatus] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const isValidPhone = (value: string) => /^\+?[0-9]{7,15}$/.test(value.trim());
  const isValidTenant = (value: string) => /^[a-zA-Z0-9._:-]{2,64}$/.test(value.trim());
  const isValidPin = (value: string) => /^[0-9]{4,6}$/.test(value.trim());
  const isValidResetCode = (value: string) => /^[0-9]{4,8}$/.test(value.trim());

  React.useEffect(() => {
    try {
      const tenant = getAuthItem('soko:tenant_id') || '';
      setForm(prev => ({ ...prev, tenant_id: tenant }));
    } catch {}
  }, []);

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);
    if (!isValidPhone(form.phone) || !isValidTenant(form.tenant_id)) {
      setStatus('Please enter a valid phone number and username.');
      return;
    }
    setLoading(true);
    try {
      await requestPasswordReset({
        phone: form.phone.trim(),
        tenant_id: form.tenant_id.trim(),
      });
      setStatus('Reset code sent. Check your messages.');
      setStep('confirm');
    } catch (err: any) {
      setStatus(err?.message || 'Unable to request reset.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);
    if (!isValidPhone(form.phone) || !isValidTenant(form.tenant_id) || !isValidResetCode(form.reset_code) || !isValidPin(form.new_pin)) {
      setStatus('Please check the reset code, PIN, phone number, and username.');
      return;
    }
    if (form.new_pin.trim() !== form.confirm_pin.trim()) {
      setStatus('PINs do not match.');
      return;
    }
    setLoading(true);
    try {
      await confirmPasswordReset({
        phone: form.phone.trim(),
        tenant_id: form.tenant_id.trim(),
        reset_code: form.reset_code.trim(),
        new_pin: form.new_pin.trim(),
      });
      setStatus('PIN updated. You can sign in now.');
      if (onLoginOpen) onLoginOpen();
    } catch (err: any) {
      setStatus('Unable to reset PIN. Please request a new code and try again.');
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
          <p className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold">Reset Access</p>
          <h1 className="text-lg font-black text-zinc-900">Reset your PIN</h1>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl border border-zinc-100 shadow-sm p-6"
        >
          {status && (
            <div className="mb-4 text-[11px] font-bold rounded-2xl px-4 py-3 bg-zinc-50 text-zinc-700 border border-zinc-100">
              {status}
            </div>
          )}

          {step === 'request' ? (
            <form onSubmit={handleRequest} className="space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-2xl bg-amber-50 text-amber-600">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-zinc-900">Get reset code</p>
                  <p className="text-xs text-zinc-500">We’ll send a code to your phone.</p>
                </div>
              </div>
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
                  loading ? 'bg-zinc-200 text-zinc-500' : 'bg-zinc-900 text-white'
                }`}
              >
                {loading ? 'Sending…' : 'Send Reset Code'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleConfirm} className="space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-2xl bg-indigo-50 text-indigo-600">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-zinc-900">Confirm reset</p>
                  <p className="text-xs text-zinc-500">Enter the code and new PIN.</p>
                </div>
              </div>
              <label className="block">
                <span className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold">Reset Code</span>
                <input
                  value={form.reset_code}
                  onChange={(e) => setForm(prev => ({ ...prev, reset_code: e.target.value }))}
                  className="mt-2 w-full bg-zinc-50 rounded-2xl border border-zinc-200 px-3 py-2 text-sm font-semibold text-zinc-900 focus:outline-none"
                  placeholder="123456"
                  required
                />
              </label>
              <label className="block">
                <span className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold">New PIN</span>
                <input
                  type="password"
                  value={form.new_pin}
                  onChange={(e) => setForm(prev => ({ ...prev, new_pin: e.target.value }))}
                  className="mt-2 w-full bg-zinc-50 rounded-2xl border border-zinc-200 px-3 py-2 text-sm font-semibold text-zinc-900 focus:outline-none"
                  placeholder="4-digit PIN"
                  maxLength={6}
                  required
                />
              </label>
              <label className="block">
                <span className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold">Confirm PIN</span>
                <input
                  type="password"
                  value={form.confirm_pin}
                  onChange={(e) => setForm(prev => ({ ...prev, confirm_pin: e.target.value }))}
                  className="mt-2 w-full bg-zinc-50 rounded-2xl border border-zinc-200 px-3 py-2 text-sm font-semibold text-zinc-900 focus:outline-none"
                  placeholder="Confirm PIN"
                  maxLength={6}
                  required
                />
              </label>
              <button
                type="submit"
                disabled={loading}
                className={`w-full py-3 rounded-2xl text-xs font-black uppercase tracking-widest ${
                  loading ? 'bg-zinc-200 text-zinc-500' : 'bg-indigo-600 text-white'
                }`}
              >
                {loading ? 'Updating…' : 'Update PIN'}
              </button>
            </form>
          )}
        </motion.div>

        <div className="mt-6 text-center text-xs text-zinc-500">
          Remembered your PIN?{' '}
          <button onClick={onLoginOpen} className="text-indigo-600 font-bold">
            Sign in
          </button>
        </div>
      </div>
    </div>
  );
};
