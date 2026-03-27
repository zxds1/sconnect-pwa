import { requestUploadPresign } from './uploadsApi';
import { requestMediaUploadPreview } from './mediaPreview';

export const getVideoDurationSeconds = async (file: File) => {
  const url = URL.createObjectURL(file);
  try {
    return await new Promise<number>((resolve, reject) => {
      const video = document.createElement('video');
      const cleanup = () => {
        video.src = '';
        video.removeAttribute('src');
        video.load();
        URL.revokeObjectURL(url);
      };
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        const duration = Number.isFinite(video.duration) ? video.duration : NaN;
        cleanup();
        if (!Number.isFinite(duration) || duration <= 0) {
          reject(new Error('Unable to determine video duration.'));
          return;
        }
        resolve(duration);
      };
      video.onerror = () => {
        cleanup();
        reject(new Error('Unable to read video metadata.'));
      };
      video.src = url;
    });
  } catch (err) {
    URL.revokeObjectURL(url);
    throw err;
  }
};

const pickRecorderMimeType = (preferredType: string) => {
  const candidates = [
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm',
    preferredType,
  ].filter(Boolean);
  if (typeof MediaRecorder === 'undefined' || typeof MediaRecorder.isTypeSupported !== 'function') {
    return preferredType || '';
  }
  return candidates.find((candidate) => MediaRecorder.isTypeSupported(candidate)) || '';
};

export const trimVideoFile = async (file: File, startSeconds: number, durationSeconds: number) => {
  const objectUrl = URL.createObjectURL(file);
  const video = document.createElement('video');
  video.preload = 'auto';
  video.playsInline = true;
  video.src = objectUrl;

  try {
    await new Promise<void>((resolve, reject) => {
      video.onloadedmetadata = () => resolve();
      video.onerror = () => reject(new Error('Unable to read video metadata.'));
    });

    const safeStart = Math.max(0, Math.min(startSeconds, Math.max(0, video.duration - durationSeconds)));
    const safeEnd = Math.min(video.duration, safeStart + durationSeconds);
    if (!Number.isFinite(video.duration) || safeEnd <= safeStart) {
      throw new Error('Invalid trim range.');
    }

    const captureStream = (video as HTMLVideoElement & { captureStream?: () => MediaStream; mozCaptureStream?: () => MediaStream }).captureStream
      || (video as HTMLVideoElement & { captureStream?: () => MediaStream; mozCaptureStream?: () => MediaStream }).mozCaptureStream;
    if (!captureStream) {
      throw new Error('Your browser does not support video trimming.');
    }

    const stream = captureStream.call(video);
    const mimeType = pickRecorderMimeType(file.type || 'video/webm');
    const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
    const chunks: BlobPart[] = [];

    const trimmed = await new Promise<File>((resolve, reject) => {
      let stopTimer: number | null = null;
      let settled = false;
      const finish = (fn: () => void) => {
        if (settled) return;
        settled = true;
        if (stopTimer !== null) window.clearTimeout(stopTimer);
        fn();
      };

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunks.push(event.data);
        }
      };
      recorder.onerror = () => {
        finish(() => reject(new Error('Unable to trim video.')));
      };
      recorder.onstop = () => {
        finish(() => {
          const blob = new Blob(chunks, { type: recorder.mimeType || file.type || 'video/webm' });
          const ext = (recorder.mimeType || file.type || 'video/webm').includes('mp4') ? 'mp4' : 'webm';
          resolve(new File([blob], `${file.name.replace(/\.[^.]+$/, '')}-trimmed.${ext}`, { type: blob.type }));
        });
      };

      video.onseeked = async () => {
        try {
          await video.play();
          stopTimer = window.setTimeout(() => {
            try {
              if (recorder.state === 'recording') recorder.stop();
            } catch {
              // ignore
            }
            video.pause();
          }, Math.max(1, Math.round((safeEnd - safeStart) * 1000)) + 250);
        } catch {
          finish(() => reject(new Error('Unable to start video trimming.')));
        }
      };

      try {
        recorder.start();
        video.currentTime = safeStart;
      } catch {
        finish(() => reject(new Error('Unable to trim video.')));
      }
    });

    return trimmed;
  } finally {
    video.pause();
    video.removeAttribute('src');
    video.load();
    URL.revokeObjectURL(objectUrl);
  }
};

export const uploadMediaFile = async (file: File, context: string) => {
  const approvedFile = await requestMediaUploadPreview(file, {
    title: 'Preview upload',
    description: 'Review this image or video before it is uploaded.',
    confirmLabel: 'Upload media',
  });
  const presign = await requestUploadPresign({
    file_name: approvedFile.name,
    mime_type: approvedFile.type,
    content_length: approvedFile.size,
    context,
  });
  if (!presign.upload_url && !presign.url) {
    throw new Error('Upload presign failed.');
  }
  const uploadUrl = presign.upload_url || presign.url!;
  if (presign.fields) {
    const form = new FormData();
    Object.entries(presign.fields).forEach(([key, value]) => {
      form.append(key, value);
    });
    form.append('file', approvedFile);
    await fetch(uploadUrl, {
      method: presign.method || 'POST',
      body: form,
      headers: presign.headers,
    });
  } else {
    await fetch(uploadUrl, {
      method: presign.method || 'PUT',
      headers: presign.headers || { 'Content-Type': approvedFile.type },
      body: approvedFile,
    });
  }
  return {
    url: presign.url || uploadUrl,
    key: presign.s3_key || presign.key || '',
  };
};
