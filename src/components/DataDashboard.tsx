import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Download, Trash2, ShieldCheck, Database, CalendarDays, FileText, Eye, CheckCircle2 } from 'lucide-react';
import {
  getDataSummary,
  getDataUsage,
  requestDataExport,
  getDataExports,
  getDataExportById,
  getConsents,
  updateConsentByType,
  requestDataDeletion,
  type DataUsageItem,
  type ConsentRecord,
  type ExportResponse,
} from '../lib/analyticsApi';

interface DataDashboardProps {
  onBack?: () => void;
}

export const DataDashboard: React.FC<DataDashboardProps> = ({ onBack }) => {
  const [summary, setSummary] = useState({ searches: 0, receipts: 0, purchases: 0, reviews: 0 });
  const [usage, setUsage] = useState<DataUsageItem[]>([]);
  const [consents, setConsents] = useState<ConsentRecord[]>([]);
  const [exports, setExports] = useState<ExportResponse[]>([]);
  const [exportLookupId, setExportLookupId] = useState('');
  const [exportLookupResult, setExportLookupResult] = useState<ExportResponse | null>(null);
  const [exportForm, setExportForm] = useState({ export_type: '', verification_method: 'mfa', recent_login_at: '' });
  const [deleteForm, setDeleteForm] = useState({ verification_method: 'mfa', mfa: false, verified_device: false, support_ticket_id: '' });
  const [deleteStatus, setDeleteStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadOnce = async () => {
      setLoading(true);
      setError(null);
      try {
        const [summaryResp, usageResp, consentsResp, exportsResp] = await Promise.all([
          getDataSummary(),
          getDataUsage(),
          getConsents(),
          getDataExports(),
        ]);
        if (!isMounted) return;
        setSummary({
          searches: summaryResp.searches ?? 0,
          receipts: summaryResp.receipts ?? 0,
          purchases: summaryResp.purchases ?? 0,
          reviews: summaryResp.reviews ?? 0,
        });
        setUsage(usageResp.usage ?? []);
        setConsents(consentsResp.current ?? []);
        setExports(exportsResp.exports ?? []);
      } catch (err: any) {
        if (!isMounted) return;
        setError(err?.message || 'Unable to load data dashboard.');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadOnce();
    return () => {
      isMounted = false;
    };
  }, []);

  const auditLog = useMemo(() => usage, [usage]);

  const dataFreshness = useMemo(() => {
    if (usage.length === 0) return '';
    const latest = usage.reduce<Date | null>((acc, item) => {
      if (!item.updated_at) return acc;
      const parsed = new Date(item.updated_at);
      if (Number.isNaN(parsed.getTime())) return acc;
      if (!acc || parsed > acc) return parsed;
      return acc;
    }, null);
    return latest ? latest.toLocaleString() : '';
  }, [usage]);

  const handleExport = async () => {
    setExporting(true);
    setError(null);
    try {
      await requestDataExport({
        export_type: exportForm.export_type,
        verification_method: exportForm.verification_method === 'recent_login' ? 'recent_login' : 'mfa',
        recent_login_at: exportForm.verification_method === 'recent_login' ? exportForm.recent_login_at : undefined,
      });
      const exportsResp = await getDataExports();
      setExports(exportsResp.exports ?? []);
    } catch (err: any) {
      setError(err?.message || 'Export request failed.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="h-full bg-zinc-50 flex flex-col overflow-y-auto no-scrollbar">
      <div className="p-6 bg-white border-b border-zinc-100 sticky top-0 z-10 flex items-center gap-3">
        {onBack && (
          <button onClick={onBack} className="p-2 rounded-full hover:bg-zinc-100 transition-colors" aria-label="Go back">
            <ArrowLeft className="w-5 h-5 text-zinc-900" />
          </button>
        )}
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Data Dashboard</p>
          <h1 className="text-xl font-bold text-zinc-900">Your Data, Your Control</h1>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-100 text-red-700 text-xs font-bold rounded-2xl px-4 py-3">
            {error}
          </div>
        )}

        <section className="bg-white rounded-3xl border border-zinc-100 p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <Database className="w-5 h-5 text-emerald-500" />
            <div>
              <p className="text-sm font-bold text-zinc-900">View My Data</p>
              <p className="text-[10px] text-zinc-500">Summary of what SokoConnect stores about you.</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 text-[10px] font-bold text-zinc-600">
            <div className="p-3 bg-zinc-50 rounded-2xl">Searches: {loading ? '...' : summary.searches}</div>
            <div className="p-3 bg-zinc-50 rounded-2xl">Receipts: {loading ? '...' : summary.receipts}</div>
            <div className="p-3 bg-zinc-50 rounded-2xl">Purchases: {loading ? '...' : summary.purchases}</div>
            <div className="p-3 bg-zinc-50 rounded-2xl">Reviews: {loading ? '...' : summary.reviews}</div>
          </div>
        </section>

        <section className="bg-white rounded-3xl border border-zinc-100 p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <Eye className="w-5 h-5 text-indigo-500" />
            <div>
              <p className="text-sm font-bold text-zinc-900">Consent Management</p>
              <p className="text-[10px] text-zinc-500">Control what data is shared and with whom.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-2 text-[10px] font-bold text-zinc-600">
            {consents.length === 0 ? (
              <div className="p-3 bg-zinc-50 rounded-2xl text-zinc-500">No consent records found.</div>
            ) : (
              consents.map((consent) => {
                const consentType = consent.consent_type || consent.type;
                if (!consentType) return null;
                return (
                  <label key={consentType} className="p-3 bg-zinc-50 rounded-2xl flex items-center justify-between gap-3">
                    <span>{consentType}</span>
                    <input
                      type="checkbox"
                      checked={!!consent.consent_given}
                      onChange={async (e) => {
                        try {
                          const updated = await updateConsentByType(consentType, { consent_given: e.target.checked });
                          setConsents((prev) =>
                            prev.map((item) => (item.consent_type === consentType ? { ...item, consent_given: updated.consent_given } : item))
                          );
                        } catch (err: any) {
                          setError(err?.message || 'Unable to update consent.');
                        }
                      }}
                    />
                  </label>
                );
              })
            )}
          </div>
        </section>

        <section className="bg-white rounded-3xl border border-zinc-100 p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <Download className="w-5 h-5 text-indigo-500" />
            <div>
              <p className="text-sm font-bold text-zinc-900">Download My Data</p>
              <p className="text-[10px] text-zinc-500">Export your searches, receipts, and purchases.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-3">
            <input
              className="w-full p-3 bg-zinc-50 rounded-xl text-[10px] font-bold text-zinc-700"
              placeholder="Export type"
              value={exportForm.export_type}
              onChange={(e) => setExportForm((prev) => ({ ...prev, export_type: e.target.value }))}
            />
            <select
              className="w-full p-3 bg-zinc-50 rounded-xl text-[10px] font-bold text-zinc-700"
              value={exportForm.verification_method}
              onChange={(e) => setExportForm((prev) => ({ ...prev, verification_method: e.target.value }))}
            >
              <option value="mfa">mfa</option>
              <option value="recent_login">recent_login</option>
            </select>
            <input
              className="w-full p-3 bg-zinc-50 rounded-xl text-[10px] font-bold text-zinc-700"
              placeholder="Recent login at (RFC3339)"
              value={exportForm.recent_login_at}
              onChange={(e) => setExportForm((prev) => ({ ...prev, recent_login_at: e.target.value }))}
              disabled={exportForm.verification_method !== 'recent_login'}
            />
          </div>
          <button
            className="w-full py-3 bg-zinc-900 text-white rounded-xl text-xs font-bold disabled:opacity-60"
            onClick={handleExport}
            disabled={exporting}
          >
            {exporting ? 'Exporting…' : 'Export Data'}
          </button>
          {exports.length > 0 && (
            <div className="mt-3 space-y-2">
              {exports.map((item) => (
                <div key={item.id} className="p-3 bg-zinc-50 rounded-2xl text-[10px] font-bold text-zinc-600">
                  <div>ID: {item.id}</div>
                  <div>Status: {item.status}</div>
                  <div>Type: {item.export_type || '—'}</div>
                  <div>Created: {item.created_at ? new Date(item.created_at).toLocaleString() : '—'}</div>
                  {item.download_url && (
                    <button
                      className="mt-2 inline-flex items-center gap-1 rounded-lg bg-zinc-900 px-2 py-1 text-[9px] font-black text-white"
                      onClick={() => window.open(item.download_url, '_blank', 'noopener,noreferrer')}
                    >
                      Download
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
          <div className="mt-3 flex items-center gap-2">
            <input
              className="w-full p-3 bg-zinc-50 rounded-xl text-[10px] font-bold text-zinc-700"
              placeholder="Lookup export ID"
              value={exportLookupId}
              onChange={(e) => setExportLookupId(e.target.value)}
            />
            <button
              className="px-3 py-2 bg-zinc-100 rounded-xl text-[10px] font-bold"
              onClick={async () => {
                try {
                  const result = await getDataExportById(exportLookupId);
                  setExportLookupResult(result);
                } catch (err: any) {
                  setError(err?.message || 'Unable to fetch export.');
                }
              }}
            >
              Check
            </button>
          </div>
          {exportLookupResult && (
            <div className="mt-2 p-3 bg-zinc-50 rounded-2xl text-[10px] font-bold text-zinc-600">
              <div>ID: {exportLookupResult.id}</div>
              <div>Status: {exportLookupResult.status}</div>
              <div>Type: {exportLookupResult.export_type || '—'}</div>
              {exportLookupResult.download_url && (
                <button
                  className="mt-2 inline-flex items-center gap-1 rounded-lg bg-zinc-900 px-2 py-1 text-[9px] font-black text-white"
                  onClick={() => window.open(exportLookupResult.download_url, '_blank', 'noopener,noreferrer')}
                >
                  Download
                </button>
              )}
            </div>
          )}
        </section>

        <section className="bg-white rounded-3xl border border-zinc-100 p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <FileText className="w-5 h-5 text-amber-500" />
            <div>
              <p className="text-sm font-bold text-zinc-900">Audit Log</p>
              <p className="text-[10px] text-zinc-500">Transparent history of your data activity.</p>
            </div>
          </div>
          <div className="space-y-2">
            {auditLog.length === 0 ? (
              <div className="p-3 bg-zinc-50 rounded-2xl text-[10px] font-bold text-zinc-500">
                No recent activity found.
              </div>
            ) : (
              auditLog.map((entry, idx) => (
                <div key={`${entry.metric ?? 'metric'}_${idx}`} className="p-3 bg-zinc-50 rounded-2xl text-[10px] font-bold text-zinc-700 flex items-center justify-between">
                  <div>
                    <p>{entry.metric || 'metric'}</p>
                    <p className="text-[9px] text-zinc-400">{entry.period || '—'} • {entry.count ?? 0}</p>
                  </div>
                  <span className="text-[9px] text-zinc-400">{entry.updated_at ? new Date(entry.updated_at).toLocaleString() : ''}</span>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="bg-white rounded-3xl border border-emerald-100 p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <ShieldCheck className="w-5 h-5 text-emerald-500" />
            <div>
              <p className="text-sm font-bold text-zinc-900">Data Protection</p>
              <p className="text-[10px] text-zinc-500">We protect your data with verified access logs.</p>
            </div>
          </div>
          <div className="p-3 bg-emerald-50 rounded-2xl text-[10px] font-bold text-emerald-700 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            {dataFreshness ? `Last updated • ${dataFreshness}` : 'Last updated • —'}
          </div>
        </section>

        <section className="bg-white rounded-3xl border border-red-100 p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <Trash2 className="w-5 h-5 text-red-500" />
            <div>
              <p className="text-sm font-bold text-zinc-900">Delete My Data</p>
              <p className="text-[10px] text-zinc-500">Request permanent deletion of your data.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-3">
            <input
              className="w-full p-3 bg-zinc-50 rounded-xl text-[10px] font-bold text-zinc-700"
              placeholder="Verification method (mfa)"
              value={deleteForm.verification_method}
              readOnly
              disabled
            />
            <input
              className="w-full p-3 bg-zinc-50 rounded-xl text-[10px] font-bold text-zinc-700"
              placeholder="Support ticket ID"
              value={deleteForm.support_ticket_id}
              onChange={(e) => setDeleteForm((prev) => ({ ...prev, support_ticket_id: e.target.value }))}
            />
            <div className="flex items-center gap-3 p-3 bg-zinc-50 rounded-xl text-[10px] font-bold text-zinc-700">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={deleteForm.mfa}
                  onChange={(e) => setDeleteForm((prev) => ({ ...prev, mfa: e.target.checked }))}
                />
                MFA
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={deleteForm.verified_device}
                  onChange={(e) => setDeleteForm((prev) => ({ ...prev, verified_device: e.target.checked }))}
                />
                Verified device
              </label>
            </div>
          </div>
          <button
            className="w-full py-3 bg-red-600 text-white rounded-xl text-xs font-bold"
            onClick={async () => {
              try {
                const result = await requestDataDeletion({
                  verification_method: 'mfa',
                  mfa: deleteForm.mfa,
                  verified_device: deleteForm.verified_device,
                  support_ticket_id: deleteForm.support_ticket_id,
                });
                setDeleteStatus(result.status || 'queued');
              } catch (err: any) {
                setError(err?.message || 'Data deletion request failed.');
              }
            }}
          >
            Request Data Deletion
          </button>
          {deleteStatus && <div className="mt-2 text-[10px] font-bold text-zinc-500">Status: {deleteStatus}</div>}
        </section>

        <section className="bg-white rounded-3xl border border-zinc-100 p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <CalendarDays className="w-5 h-5 text-blue-500" />
            <div>
              <p className="text-sm font-bold text-zinc-900">Data Retention</p>
              <p className="text-[10px] text-zinc-500">Receipts retained for 24 months unless deleted.</p>
            </div>
          </div>
          <div className="p-3 bg-zinc-50 rounded-2xl text-[10px] font-bold text-zinc-600">
            You can adjust retention settings in Consent Management.
          </div>
        </section>
      </div>
    </div>
  );
};
