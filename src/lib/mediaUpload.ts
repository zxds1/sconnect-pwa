import { requestUploadPresign } from './uploadsApi';

export const uploadMediaFile = async (file: File, context: string) => {
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
