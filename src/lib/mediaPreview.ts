export type MediaUploadPreviewOptions = {
  title?: string;
  description?: string;
  confirmLabel?: string;
};

export type PendingMediaUploadPreview = {
  file: File;
  options: MediaUploadPreviewOptions;
  resolve: (file: File) => void;
  reject: (reason?: any) => void;
};

type MediaPreviewListener = (pending: PendingMediaUploadPreview | null) => void;

const previewQueue: PendingMediaUploadPreview[] = [];
let activeListener: MediaPreviewListener | null = null;

const emit = () => {
  activeListener?.(previewQueue[0] || null);
};

export const isPreviewableMediaFile = (file?: File | null) =>
  Boolean(file && (file.type.startsWith('image/') || file.type.startsWith('video/')));

export const registerMediaUploadPreviewHost = (listener: MediaPreviewListener) => {
  activeListener = listener;
  emit();
  return () => {
    if (activeListener === listener) {
      activeListener = null;
    }
  };
};

export const requestMediaUploadPreview = (
  file: File,
  options: MediaUploadPreviewOptions = {},
) => {
  if (typeof window === 'undefined' || !isPreviewableMediaFile(file)) {
    return Promise.resolve(file);
  }
  return new Promise<File>((resolve, reject) => {
    previewQueue.push({ file, options, resolve, reject });
    emit();
  });
};

export const resolveMediaUploadPreview = (file: File) => {
  const current = previewQueue.shift();
  current?.resolve(file);
  emit();
};

export const rejectMediaUploadPreview = (reason: any = new Error('Upload cancelled.')) => {
  const current = previewQueue.shift();
  current?.reject(reason);
  emit();
};

export const formatMediaFileSize = (size: number) => {
  if (!Number.isFinite(size) || size <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  let value = size;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  return `${value >= 10 || unitIndex === 0 ? Math.round(value) : value.toFixed(1)} ${units[unitIndex]}`;
};
