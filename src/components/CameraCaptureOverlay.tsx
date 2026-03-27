import React from 'react';
import { Camera, ScanLine, Sparkles, X } from 'lucide-react';

interface CameraCaptureOverlayProps {
  open: boolean;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  title: string;
  subtitle: string;
  hint: string;
  statusLabel?: string;
  captureLabel?: string;
  closeLabel?: string;
  busy?: boolean;
  error?: string | null;
  onClose: () => void;
  onCapture: () => void;
  zIndexClass?: string;
}

export const CameraCaptureOverlay: React.FC<CameraCaptureOverlayProps> = ({
  open,
  videoRef,
  title,
  subtitle,
  hint,
  statusLabel,
  captureLabel = 'Capture',
  closeLabel = 'Cancel',
  busy = false,
  error = null,
  onClose,
  onCapture,
  zIndexClass = 'z-[90]',
}) => {
  if (!open) return null;

  return (
    <div className={`fixed inset-0 ${zIndexClass} bg-[#050816]/95 backdrop-blur-md`}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.18),transparent_34%),radial-gradient(circle_at_bottom,rgba(249,115,22,0.18),transparent_30%)]" />
      <button
        type="button"
        aria-label="Close camera"
        className="absolute inset-0"
        onClick={onClose}
      />
      <div className="relative flex h-full flex-col px-4 pb-6 pt-5 sm:px-6">
        <div className="mx-auto flex w-full max-w-3xl items-start justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-black uppercase tracking-[0.28em] text-emerald-200">
              <Sparkles className="h-3.5 w-3.5" />
              Live Camera
            </div>
            <div>
              <p className="text-xl font-black text-white sm:text-2xl">{title}</p>
              <p className="mt-1 max-w-xl text-[11px] font-bold text-white/65 sm:text-xs">{subtitle}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/80 transition hover:bg-white/10 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center py-4">
          <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-black shadow-[0_30px_80px_rgba(0,0,0,0.45)]">
            <div className="relative aspect-[3/4] w-full bg-black sm:aspect-[4/5]">
              <video ref={videoRef} className="h-full w-full object-cover" playsInline muted autoPlay />
              <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,rgba(0,0,0,0.15),rgba(0,0,0,0.55))]" />
              <div className="pointer-events-none absolute inset-5 rounded-[1.6rem] border border-white/15">
                <div className="absolute left-4 top-4 h-10 w-10 rounded-tl-2xl border-l-4 border-t-4 border-emerald-300/90" />
                <div className="absolute right-4 top-4 h-10 w-10 rounded-tr-2xl border-r-4 border-t-4 border-emerald-300/90" />
                <div className="absolute bottom-4 left-4 h-10 w-10 rounded-bl-2xl border-b-4 border-l-4 border-emerald-300/90" />
                <div className="absolute bottom-4 right-4 h-10 w-10 rounded-br-2xl border-b-4 border-r-4 border-emerald-300/90" />
              </div>
              <div className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full bg-black/55 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.22em] text-white/90 backdrop-blur-md">
                <ScanLine className="h-3.5 w-3.5 text-emerald-300" />
                {statusLabel || 'Align inside frame'}
              </div>
              <div className="absolute bottom-5 left-1/2 w-[calc(100%-2.5rem)] -translate-x-1/2 rounded-3xl border border-white/10 bg-black/45 px-4 py-3 text-center backdrop-blur-md">
                <p className="text-[10px] font-black uppercase tracking-[0.28em] text-emerald-200/90">Capture Tip</p>
                <p className="mt-1 text-[11px] font-bold text-white/80 sm:text-xs">{hint}</p>
              </div>
            </div>
          </div>

          {error && (
            <div className="mt-4 rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-[11px] font-bold text-rose-100">
              {error}
            </div>
          )}
        </div>

        <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-xs font-black text-white/90 transition hover:bg-white/10"
          >
            {closeLabel}
          </button>
          <button
            type="button"
            onClick={onCapture}
            disabled={busy}
            className="inline-flex items-center gap-3 rounded-[1.5rem] bg-emerald-400 px-5 py-3 text-xs font-black text-slate-950 shadow-[0_10px_35px_rgba(52,211,153,0.35)] transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-950 text-emerald-300">
              <Camera className="h-5 w-5" />
            </span>
            {busy ? 'Working…' : captureLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
