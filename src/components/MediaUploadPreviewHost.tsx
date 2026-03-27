import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Eye, Film, ImageIcon, Upload, X } from 'lucide-react';
import {
  formatMediaFileSize,
  registerMediaUploadPreviewHost,
  rejectMediaUploadPreview,
  resolveMediaUploadPreview,
  type PendingMediaUploadPreview,
} from '../lib/mediaPreview';
import { getVideoDurationSeconds } from '../lib/mediaUpload';

export const MediaUploadPreviewHost: React.FC = () => {
  const [pending, setPending] = React.useState<PendingMediaUploadPreview | null>(null);
  const [previewUrl, setPreviewUrl] = React.useState('');
  const [videoDuration, setVideoDuration] = React.useState<number | null>(null);

  React.useEffect(() => registerMediaUploadPreviewHost(setPending), []);

  React.useEffect(() => {
    if (!pending?.file) {
      setPreviewUrl('');
      setVideoDuration(null);
      return;
    }
    const url = URL.createObjectURL(pending.file);
    setPreviewUrl(url);
    setVideoDuration(null);
    if (pending.file.type.startsWith('video/')) {
      void getVideoDurationSeconds(pending.file)
        .then((duration) => setVideoDuration(duration))
        .catch(() => setVideoDuration(null));
    }
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [pending]);

  const closePreview = () => {
    rejectMediaUploadPreview(new Error('Upload cancelled.'));
  };

  const confirmPreview = () => {
    if (!pending?.file) return;
    resolveMediaUploadPreview(pending.file);
  };

  const file = pending?.file || null;
  const fileKind = file?.type.startsWith('video/') ? 'video' : 'image';

  return (
    <AnimatePresence>
      {pending && file && previewUrl && (
        <div className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-md">
          <button
            type="button"
            className="absolute inset-0"
            onClick={closePreview}
            aria-label="Close upload preview"
          />
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            className="absolute inset-0 flex items-center justify-center p-4"
          >
            <div className="relative flex h-full max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-[2rem] border border-white/10 bg-zinc-950 text-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-white/10 p-2">
                    <Eye className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.28em] text-white/50">Upload Preview</p>
                    <p className="text-sm font-black text-white">
                      {pending.options.title || 'Review before uploading'}
                    </p>
                    {pending.options.description && (
                      <p className="text-[11px] font-bold text-white/60">{pending.options.description}</p>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={closePreview}
                  className="rounded-full p-2 text-white/70 transition hover:bg-white/10 hover:text-white"
                  aria-label="Close upload preview"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="grid flex-1 min-h-0 grid-cols-1 lg:grid-cols-[minmax(0,1fr)_280px]">
                <div className="relative flex min-h-[320px] items-center justify-center bg-black">
                  {fileKind === 'video' ? (
                    <video
                      src={previewUrl}
                      controls
                      className="h-full max-h-[70vh] w-full object-contain"
                    />
                  ) : (
                    <img
                      src={previewUrl}
                      alt="Selected upload preview"
                      className="h-full max-h-[70vh] w-full object-contain"
                    />
                  )}
                </div>

                <div className="flex flex-col justify-between gap-5 border-t border-white/10 bg-zinc-900/90 p-5 lg:border-l lg:border-t-0">
                  <div className="space-y-4">
                    <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                      <p className="text-[10px] font-black uppercase tracking-[0.26em] text-white/45">Selected File</p>
                      <p className="mt-2 break-all text-sm font-black text-white">{file.name}</p>
                      <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-bold text-white/70">
                        <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1">
                          {fileKind === 'video' ? <Film className="h-3.5 w-3.5" /> : <ImageIcon className="h-3.5 w-3.5" />}
                          {file.type || (fileKind === 'video' ? 'video' : 'image')}
                        </span>
                        <span className="rounded-full bg-white/10 px-3 py-1">{formatMediaFileSize(file.size)}</span>
                        {videoDuration !== null && (
                          <span className="rounded-full bg-white/10 px-3 py-1">
                            {videoDuration.toFixed(1)}s
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="rounded-3xl border border-emerald-500/20 bg-emerald-500/10 p-4">
                      <p className="text-[10px] font-black uppercase tracking-[0.26em] text-emerald-200/80">Check Before Upload</p>
                      <div className="mt-2 space-y-2 text-[11px] font-bold text-emerald-50/90">
                        <p>Make sure the photo or video is clear and shows the right item.</p>
                        <p>Use cancel if you want to choose a different file instead of uploading blind.</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={closePreview}
                      className="rounded-2xl bg-white/10 px-4 py-3 text-xs font-black text-white transition hover:bg-white/15"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={confirmPreview}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-4 py-3 text-xs font-black text-white transition hover:bg-emerald-400"
                    >
                      <Upload className="h-4 w-4" />
                      {pending.options.confirmLabel || 'Upload File'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
