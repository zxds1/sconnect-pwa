import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Crown, Lock, BarChart3, Wallet, Megaphone } from 'lucide-react';
import {
  cancelSubscription,
  downgradeSubscription,
  getSubscriptionView,
  getInvoiceDownloadUrl,
  initiatePayment,
  listBillingEvents,
  listInvoices,
  listPlans,
  reactivateSubscription,
  startTrial,
  upgradeSubscription,
  type BillingEvent,
  type Invoice,
  type Plan,
  type SubscriptionView
} from '../lib/subscriptionsApi';

type Tab = 'duka' | 'brand' | 'billing';

type Props = {
  onBack?: () => void;
};

export const Subscriptions: React.FC<Props> = ({ onBack }) => {
  const [tab, setTab] = useState<Tab>('duka');
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subscriptionView, setSubscriptionView] = useState<SubscriptionView | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [billingEvents, setBillingEvents] = useState<BillingEvent[]>([]);
  const [mpesaPhone, setMpesaPhone] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [downgradeTier, setDowngradeTier] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);

  const currentTier = subscriptionView?.subscription?.plan_tier || '';
  const subscriptionStatus = String(subscriptionView?.subscription?.status || '').toLowerCase();

  useEffect(() => {
    let ignore = false;
    const load = async () => {
      setLoading(true);
      try {
        const [planItems, view, invoiceItems] = await Promise.all([
          listPlans(),
          getSubscriptionView(),
          listInvoices()
        ]);
        if (ignore) return;
        setPlans(planItems);
        setSubscriptionView(view);
        setInvoices(invoiceItems);
        listBillingEvents()
          .then((events) => {
            if (!ignore) setBillingEvents(events);
          })
          .catch(() => {
            if (!ignore) setBillingEvents([]);
          });
      } catch {
        if (!ignore) {
          setPlans([]);
          setSubscriptionView(null);
          setInvoices([]);
          setBillingEvents([]);
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    load();
    return () => {
      ignore = true;
    };
  }, []);

  const refreshSubscription = async () => {
    try {
      const view = await getSubscriptionView();
      setSubscriptionView(view);
    } catch {}
  };

  const handleUpgrade = async (planTier: string) => {
    if (!mpesaPhone.trim()) {
      setStatusMessage('Mpesa phone is required for upgrade');
      return;
    }
    try {
      const resp = await upgradeSubscription({ plan_tier: planTier, mpesa_phone: mpesaPhone.trim() });
      setStatusMessage(resp?.status || 'upgrade requested');
      refreshSubscription();
    } catch (err: any) {
      setStatusMessage(err?.message || 'upgrade failed');
    }
  };

  const handleTrial = async (planTier: string) => {
    try {
      const resp = await startTrial({ plan_tier: planTier });
      setStatusMessage(resp?.status || 'trial started');
      refreshSubscription();
    } catch (err: any) {
      setStatusMessage(err?.message || 'trial failed');
    }
  };

  const handleDowngrade = async () => {
    if (!downgradeTier.trim()) return;
    try {
      const resp = await downgradeSubscription({ plan_tier: downgradeTier });
      setStatusMessage(resp?.status || 'downgrade requested');
      refreshSubscription();
    } catch (err: any) {
      setStatusMessage(err?.message || 'downgrade failed');
    }
  };

  const handleCancel = async () => {
    try {
      const resp = await cancelSubscription();
      setStatusMessage(resp?.status || 'cancelled');
      refreshSubscription();
    } catch (err: any) {
      setStatusMessage(err?.message || 'cancel failed');
    }
  };

  const handleReactivate = async () => {
    try {
      const resp = await reactivateSubscription();
      setStatusMessage(resp?.status || 'reactivated');
      refreshSubscription();
    } catch (err: any) {
      setStatusMessage(err?.message || 'reactivate failed');
    }
  };

  const handlePayment = async () => {
    if (!mpesaPhone.trim()) {
      setStatusMessage('Mpesa phone is required for payment');
      return;
    }
    const amount = Number(paymentAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      setStatusMessage('Enter a valid amount');
      return;
    }
    try {
      const resp = await initiatePayment({ amount, mpesa_phone: mpesaPhone.trim() });
      setStatusMessage(resp?.status || 'payment initiated');
    } catch (err: any) {
      setStatusMessage(err?.message || 'payment failed');
    }
  };

  const visiblePlans = useMemo(() => {
    if (tab === 'billing') return [];
    return plans.filter((plan) => {
      const segment = String((plan.features as any)?.segment || (plan.features as any)?.plan_segment || '').toLowerCase();
      if (!segment) return true;
      if (segment === 'duka') return tab === 'duka';
      if (segment === 'brand') return tab === 'brand';
      return true;
    });
  }, [plans, tab]);

  const renderFeatures = (plan: Plan) => {
    const features = plan.features || {};
    const items = Object.keys(features).length
      ? Object.entries(features).map(([key, value]) => `${key}: ${String(value)}`)
      : [];
    return items.length ? items : ['No features listed'];
  };

  const renderLimits = (plan: Plan) => {
    const limits = plan.limits || {};
    const items = Object.keys(limits).length
      ? Object.entries(limits).map(([key, value]) => `${key}: ${String(value)}`)
      : [];
    return items.length ? items : ['No limits listed'];
  };

  const handleInvoiceDownload = async (invoice: Invoice) => {
    const directUrl = invoice.download_url || '';
    if (directUrl) {
      window.open(directUrl, '_blank', 'noopener,noreferrer');
      return;
    }
    const key = invoice.pdf_s3_key || '';
    if (!key) {
      setStatusMessage('No invoice file available');
      return;
    }
    try {
      const resp = await getInvoiceDownloadUrl(invoice.id);
      if (resp?.download_url) {
        window.open(resp.download_url, '_blank', 'noopener,noreferrer');
        return;
      }
    } catch {}
    if (key.startsWith('http://') || key.startsWith('https://')) {
      window.open(key, '_blank', 'noopener,noreferrer');
      return;
    }
    try {
      await navigator.clipboard.writeText(key);
    } catch {}
    setStatusMessage('Invoice download is not available yet. The backend could not sign this invoice.');
  };

  return (
    <div className="h-full bg-zinc-50 flex flex-col overflow-y-auto no-scrollbar">
      <div className="p-4 bg-white border-b border-zinc-100 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          {onBack && (
            <button onClick={onBack} className="p-2 rounded-full hover:bg-zinc-100 transition-colors" aria-label="Go back">
              <ArrowLeft className="w-5 h-5 text-zinc-900" />
            </button>
          )}
          <div>
            <p className="text-sm font-black text-zinc-900">Subscriptions</p>
            <p className="text-[10px] text-zinc-500">Upgrade paths and billing</p>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2">
          {[
            { id: 'duka', label: 'Duka Plans' },
            { id: 'brand', label: 'Brand Plans' },
            { id: 'billing', label: 'Billing' }
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setTab(item.id as Tab)}
              className={`px-4 py-2 rounded-full text-[10px] font-black ${tab === item.id ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-600'}`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-6 space-y-6">
        <section className="bg-white rounded-2xl border border-zinc-100 p-4 shadow-sm">
          <div className="flex flex-col gap-3">
            <input
              value={mpesaPhone}
              onChange={(e) => setMpesaPhone(e.target.value)}
              placeholder="Mpesa phone (e.g., 2547...)"
              className="w-full p-3 bg-zinc-50 rounded-xl text-xs font-bold"
            />
            {statusMessage && (
              <div className="text-[10px] font-bold text-zinc-500">Status: {statusMessage}</div>
            )}
            {loading && (
              <div className="text-[10px] font-bold text-zinc-400">Loading subscriptions...</div>
            )}
          </div>
        </section>
        {tab === 'duka' && (
          <>
            {visiblePlans.map((plan) => {
              const isCurrent = plan.id === currentTier;
              return (
                <section key={plan.id} className="bg-white rounded-3xl border border-zinc-100 p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Crown className="w-4 h-4 text-amber-500" />
                      <h3 className="text-xs font-black uppercase tracking-widest text-zinc-500">{plan.name || plan.id}</h3>
                    </div>
                    <div className="text-[10px] font-black text-indigo-600">
                      {Number.isFinite(Number(plan.price)) ? 'KSh' + plan.price : 'Price on request'}
                    </div>
                  </div>
                  <div className="bg-zinc-50 rounded-2xl p-4">
                    <div className="flex items-center gap-2 text-[10px] font-black text-zinc-500 mb-3">
                      <Lock className="w-3 h-3" /> PLAN FEATURES
                    </div>
                    <div className="space-y-2 text-[10px] font-bold text-zinc-600">
                      {renderFeatures(plan).map((feature) => (
                        <div key={feature}>✓ {feature}</div>
                      ))}
                    </div>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <button
                      disabled={isCurrent}
                      onClick={() => handleUpgrade(plan.id)}
                      className={isCurrent ? 'flex-1 py-3 rounded-xl text-[10px] font-black bg-zinc-200 text-zinc-500' : 'flex-1 py-3 rounded-xl text-[10px] font-black bg-blue-600 text-white'}
                    >
                      {isCurrent ? 'Current Plan' : 'Upgrade'}
                    </button>
                    <button
                      onClick={() => handleTrial(plan.id)}
                      className="flex-1 py-3 bg-zinc-900 text-white rounded-xl text-[10px] font-black"
                    >
                      Start Trial
                    </button>
                  </div>
                  <button
                    onClick={() => setSelectedPlan(plan)}
                    className="mt-3 w-full py-3 bg-zinc-100 text-zinc-700 rounded-xl text-[10px] font-black"
                  >
                    Details
                  </button>
                </section>
              );
            })}
            {visiblePlans.length === 0 && (
              <div className="bg-white rounded-2xl border border-zinc-100 p-5 text-[10px] font-bold text-zinc-500">
                No plans available.
              </div>
            )}
          </>
        )}

        {tab === 'brand' && (
          <>
            {visiblePlans.map((plan) => {
              const isCurrent = plan.id === currentTier;
              return (
                <section key={plan.id} className="bg-white rounded-3xl border border-zinc-100 p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Megaphone className="w-4 h-4 text-indigo-600" />
                      <h3 className="text-xs font-black uppercase tracking-widest text-zinc-500">{plan.name || plan.id}</h3>
                    </div>
                    <div className="text-[10px] font-black text-indigo-600">
                      {Number.isFinite(Number(plan.price)) ? 'KSh' + plan.price : 'Price on request'}
                    </div>
                  </div>
                  <div className="bg-zinc-50 rounded-2xl p-4">
                    <div className="flex items-center gap-2 text-[10px] font-black text-zinc-500 mb-3">
                      <Lock className="w-3 h-3" /> PLAN FEATURES
                    </div>
                    <div className="space-y-2 text-[10px] font-bold text-zinc-600">
                      {renderFeatures(plan).map((feature) => (
                        <div key={feature}>✓ {feature}</div>
                      ))}
                    </div>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <button
                      disabled={isCurrent}
                      onClick={() => handleUpgrade(plan.id)}
                      className={isCurrent ? 'flex-1 py-3 rounded-xl text-[10px] font-black bg-zinc-200 text-zinc-500' : 'flex-1 py-3 rounded-xl text-[10px] font-black bg-blue-600 text-white'}
                    >
                      {isCurrent ? 'Current Plan' : 'Upgrade'}
                    </button>
                    <button
                      onClick={() => handleTrial(plan.id)}
                      className="flex-1 py-3 bg-zinc-900 text-white rounded-xl text-[10px] font-black"
                    >
                      Start Trial
                    </button>
                  </div>
                  <button
                    onClick={() => setSelectedPlan(plan)}
                    className="mt-3 w-full py-3 bg-zinc-100 text-zinc-700 rounded-xl text-[10px] font-black"
                  >
                    Details
                  </button>
                </section>
              );
            })}
            {visiblePlans.length === 0 && (
              <div className="bg-white rounded-2xl border border-zinc-100 p-5 text-[10px] font-bold text-zinc-500">
                No plans available.
              </div>
            )}
          </>
        )}

        {tab === 'billing' && (
          <>
            <section className="bg-white rounded-3xl border border-zinc-100 p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <Wallet className="w-4 h-4 text-emerald-600" />
                <h3 className="text-xs font-black uppercase tracking-widest text-zinc-500">Subscription</h3>
              </div>
              {subscriptionView?.subscription ? (
                <div className="text-[10px] font-bold text-zinc-600 space-y-2">
                  <div>Plan: {subscriptionView.subscription.plan_tier}</div>
                  <div>Status: {subscriptionView.subscription.status}</div>
                  <div>Renewal: {subscriptionView.subscription.renewal_date ? new Date(subscriptionView.subscription.renewal_date).toLocaleDateString() : '—'}</div>
                  <div>Auto-renew: {subscriptionView.subscription.auto_renew ? 'On' : 'Off'}</div>
                </div>
              ) : (
                <div className="text-[10px] font-bold text-zinc-500">No active subscription found.</div>
              )}
              {subscriptionStatus.includes('past_due') && (
                <div className="mt-4 p-3 rounded-2xl bg-amber-50 text-[10px] font-bold text-amber-700">
                  Your subscription is past due. Review the billing events below and complete payment.
                </div>
              )}
              {subscriptionView?.usage && (
                <div className="mt-4 text-[10px] font-bold text-zinc-600 space-y-2">
                  <div>Messages used: {subscriptionView.usage.messages_used ?? 0}</div>
                  <div>API calls: {subscriptionView.usage.api_calls ?? 0}</div>
                  <div>Storage (MB): {subscriptionView.usage.storage_mb ?? 0}</div>
                  <div>Group buys: {subscriptionView.usage.group_buys ?? 0}</div>
                </div>
              )}
              {subscriptionView?.limits && (
                <div className="mt-4 text-[10px] font-bold text-zinc-600 space-y-2">
                  {Object.entries(subscriptionView.limits).map(([key, value]) => (
                    <div key={key}>{key}: {String(value)}</div>
                  ))}
                </div>
              )}
              <div className="mt-4 flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <select
                    value={downgradeTier}
                    onChange={(e) => setDowngradeTier(e.target.value)}
                    className="flex-1 p-2 bg-zinc-50 rounded-xl text-[10px] font-black"
                  >
                    <option value="">Select downgrade plan</option>
                    {plans.filter((plan) => plan.id !== currentTier).map((plan) => (
                      <option key={plan.id} value={plan.id}>{plan.name || plan.id}</option>
                    ))}
                  </select>
                  <button onClick={handleDowngrade} className="px-4 py-2 bg-zinc-900 text-white rounded-xl text-[10px] font-black">
                    Downgrade
                  </button>
                </div>
                <div className="flex gap-2">
                  <button onClick={handleCancel} className="flex-1 py-3 bg-zinc-100 text-zinc-600 rounded-xl text-[10px] font-black">Cancel</button>
                  <button onClick={handleReactivate} className="flex-1 py-3 bg-emerald-600 text-white rounded-xl text-[10px] font-black">Reactivate</button>
                </div>
              </div>
            </section>

            <section className="bg-white rounded-3xl border border-zinc-100 p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <BarChart3 className="w-4 h-4 text-emerald-600" />
                <h3 className="text-xs font-black uppercase tracking-widest text-zinc-500">Invoices</h3>
              </div>
              <div className="space-y-2 text-[10px] font-bold text-zinc-600">
                {invoices.map((inv) => (
                  <div key={inv.id} className="flex items-center justify-between gap-2">
                    <span>{inv.period_start ? new Date(inv.period_start).toLocaleDateString() : '—'} → {inv.period_end ? new Date(inv.period_end).toLocaleDateString() : '—'}</span>
                    <span>{inv.amount_due || '—'} • {inv.status || '—'}</span>
                    <button
                      onClick={() => handleInvoiceDownload(inv)}
                      className="px-2 py-1 rounded-full text-[9px] font-black uppercase bg-zinc-100 text-zinc-600"
                    >
                      Download
                    </button>
                  </div>
                ))}
                {invoices.length === 0 && (
                  <div className="text-zinc-400">No invoices yet.</div>
                )}
              </div>
            </section>

            <section className="bg-white rounded-3xl border border-zinc-100 p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <Wallet className="w-4 h-4 text-indigo-600" />
                <h3 className="text-xs font-black uppercase tracking-widest text-zinc-500">Billing Events</h3>
              </div>
              <div className="space-y-2 text-[10px] font-bold text-zinc-600">
                {billingEvents.map((event) => (
                  <div key={event.id} className="rounded-2xl bg-zinc-50 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span>{event.kind || 'event'}</span>
                      <span className="text-zinc-400">{event.status || '—'}</span>
                    </div>
                    <div className="mt-1 text-zinc-500">{event.source || 'service'} · {event.created_at ? new Date(event.created_at).toLocaleString() : '—'}</div>
                    {event.error_text && <div className="mt-1 text-amber-700">{event.error_text}</div>}
                  </div>
                ))}
                {billingEvents.length === 0 && <div className="text-zinc-400">No billing events yet.</div>}
              </div>
            </section>

            <section className="bg-white rounded-3xl border border-zinc-100 p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <Wallet className="w-4 h-4 text-emerald-600" />
                <h3 className="text-xs font-black uppercase tracking-widest text-zinc-500">Make Payment</h3>
              </div>
              <div className="flex items-center gap-2">
                <input
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="Amount"
                  className="flex-1 p-3 bg-zinc-50 rounded-xl text-xs font-bold"
                />
                <button onClick={handlePayment} className="px-4 py-3 bg-emerald-600 text-white rounded-xl text-[10px] font-black">
                  Pay
                </button>
              </div>
            </section>
          </>
        )}
      </div>
      {selectedPlan && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-2xl border border-zinc-100 shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-zinc-100 flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-zinc-900">{selectedPlan.name || selectedPlan.id}</p>
                <p className="text-[10px] text-zinc-500">Plan details and limits.</p>
              </div>
              <button
                onClick={() => setSelectedPlan(null)}
                className="px-3 py-1.5 rounded-full text-[9px] font-black uppercase bg-zinc-100 text-zinc-600"
              >
                Close
              </button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto p-4 space-y-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2">Features</p>
                <div className="space-y-2 text-[10px] font-bold text-zinc-600">
                  {renderFeatures(selectedPlan).map((feature) => (
                    <div key={feature}>✓ {feature}</div>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2">Limits</p>
                <div className="space-y-2 text-[10px] font-bold text-zinc-600">
                  {renderLimits(selectedPlan).map((limit) => (
                    <div key={limit}>{limit}</div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
