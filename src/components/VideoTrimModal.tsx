import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, Scissors } from 'lucide-react';
import { getVideoDurationSeconds, trimVideoFile } from '../lib/mediaUpload';

type VideoTrimModalProps = {
  open: boolean;
  file: File | null;
  maxDurationSeconds?: number;
  onCancel: () => void;
  onConfirm: (file: File) => Promise<void> | void;
};

const formatTime = (seconds: number) => {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const total = Math.floor(seconds);
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return `${mins}:${String(secs).padStart(2, '0')}`;
};

export const VideoTrimModal: React.FC<VideoTrimModalProps> = ({
  open,
  file,
  maxDurationSeconds = 60,
  onCancel,
  onConfirm,
}) => {
  const [duration, setDuration] = useState<number>(0);
  const [startSeconds, setStartSeconds] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');

  const maxStart = useMemo(() => Math.max(0, duration - maxDurationSeconds), [duration, maxDurationSeconds]);

  useEffect(() => {
    if (!open || !file) {
      setDuration(0);
      setStartSeconds(0);
      setProcessing(false);
      setError(null);
      setPreviewUrl('');
      return;
    }

    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setError(null);
    setProcessing(false);
    getVideoDurationSeconds(file)
      .then((value) => {
        setDuration(value);
        setStartSeconds(Math.max(0, Math.min(0, Math.max(0, value - maxDurationSeconds))));
      })
      .catch((err: any) => setError(err?.message || 'Unable to read video length.'));

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [file, maxDurationSeconds, open]);

  useEffect(() => {
    if (!open || !file || !previewUrl) return;
    const video = document.getElementById('trim-preview-video') as HTMLVideoElement | null;
    if (!video) return;
    video.currentTime = startSeconds;
  }, [open, file, previewUrl, startSeconds]);

  const handleConfirm = async () => {
    if (!file) return;
    setProcessing(true);
    setError(null);
    try {
      const trimmed = await trimVideoFile(file, startSeconds, maxDurationSeconds);
      await onConfirm(trimmed);
    } catch (err: any) {
      setError(err?.message || 'Unable to trim video.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <AnimatePresence>
      {open && file && (
        <div className="fixed inset-0 z-[90] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.98 }}
            className="w-full max-w-lg bg-white rounded-3xl overflow-hidden shadow-2xl border border-zinc-100"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100">
              <div>
                <p className="text-sm font-black text-zinc-900">Trim Video</p>
                <p className="text-[10px] font-bold text-zinc-500">Choose the 60 seconds you want to upload.</p>
              </div>
              <button onClick={onCancel} className="p-2 rounded-full hover:bg-zinc-100">
                <ChevronDown className="w-5 h-5 text-zinc-700" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-100 text-red-700 text-[10px] font-bold rounded-2xl px-4 py-3">
                  {error}
                </div>
              )}

              <div className="rounded-3xl overflow-hidden bg-black border border-zinc-100">
                {previewUrl && (
                  <video
                    id="trim-preview-video"
                    src={previewUrl}
                    className="w-full aspect-[9/16] object-cover"
                    controls
                    playsInline
                  />
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Start</span>
                  <span className="text-[10px] font-bold text-zinc-600">
                    {formatTime(startSeconds)} - {formatTime(Math.min(duration, startSeconds + maxDurationSeconds))}
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={Math.max(0, Math.floor(maxStart))}
                  step={0.1}
                  value={startSeconds}
                  onChange={(e) => setStartSeconds(Number(e.target.value))}
                  className="w-full accent-zinc-900"
                />
                <div className="mt-2 flex items-center justify-between text-[10px] font-bold text-zinc-500">
                  <span>{formatTime(0)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              <button
                onClick={handleConfirm}
                disabled={processing}
                className={`w-full py-3 rounded-2xl text-xs font-black flex items-center justify-center gap-2 ${
                  processing ? 'bg-zinc-200 text-zinc-500' : 'bg-zinc-900 text-white'
                }`}
              >
                <Scissors className="w-4 h-4" />
                {processing ? 'Trimming…' : 'Use This 60s Clip'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
