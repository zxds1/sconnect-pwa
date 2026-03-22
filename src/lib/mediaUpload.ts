import { requestUploadPresign } from './uploadsApi';

type UploadMediaOptions = {
  maxVideoDurationSeconds?: number;
};

const getVideoDurationSeconds = async (file: File) => {
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

const assertVideoLength = async (file: File, maxVideoDurationSeconds?: number) => {
  if (!maxVideoDurationSeconds || !file.type.startsWith('video/')) return;
  const duration = await getVideoDurationSeconds(file);
  if (duration > maxVideoDurationSeconds) {
    throw new Error(`Videos must be ${maxVideoDurationSeconds} seconds or shorter.`);
  }
};

export const uploadMediaFile = async (file: File, context: string, options: UploadMediaOptions = {}) => {
  await assertVideoLength(file, options.maxVideoDurationSeconds);
  const presign = await requestUploadPresign({
    file_name: file.name,
    mime_type: file.type,
    content_length: file.size,
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
    form.append('file', file);
    await fetch(uploadUrl, {
      method: presign.method || 'POST',
      body: form,
      headers: presign.headers,
    });
  } else {
    await fetch(uploadUrl, {
      method: presign.method || 'PUT',
      headers: presign.headers || { 'Content-Type': file.type },
      body: file,
    });
  }
  return {
    url: presign.url || uploadUrl,
    key: presign.s3_key || presign.key || '',
  };
};
