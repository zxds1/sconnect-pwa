import { apiFetch, apiFetchRaw } from './apiClient';

export type AssistantThread = {
  id: string;
  title?: string;
  pinned?: boolean;
  created_at?: string;
  updated_at?: string;
};

export type AssistantMessage = {
  id: string;
  thread_id?: string;
  role: string;
  content: string;
  metadata?: Record<string, any>;
  created_at?: string;
};

export type AssistantSuggestion = {
  label?: string;
  payload?: string;
  value?: string;
  title?: string;
  name?: string;
};

export type AssistantAttachment = {
  id: string;
  thread_id?: string;
  message_id?: string;
  file_url?: string;
  mime_type?: string;
  type?: string;
  created_at?: string;
  expires_at?: string | null;
};

export type AssistantUpload = {
  upload_id: string;
};

export type AssistantJob = {
  id: string;
  status?: string;
  type?: string;
  result?: any;
  created_at?: string;
};

export type AssistantToolHistory = {
  id: string;
  tool?: string;
  params?: Record<string, any>;
  result?: any;
  created_at?: string;
};

export type AssistantMemory = {
  id: string;
  key: string;
  value: string;
  source?: string;
  confidence?: number;
  consent_given?: boolean;
  created_at?: string;
  updated_at?: string;
};

const unwrapList = <T>(data: any): T[] => {
  if (Array.isArray(data)) return data;
  if (data?.items && Array.isArray(data.items)) return data.items;
  return [];
};

export const listThreads = async (): Promise<AssistantThread[]> =>
  unwrapList(await apiFetch('/v1/assistant/threads'));

export const createThread = async (body: { title?: string } = {}): Promise<AssistantThread> =>
  apiFetch('/v1/assistant/threads', {
    method: 'POST',
    body: JSON.stringify(body),
  });

export const updateThread = async (id: string, body: { title?: string; pinned?: boolean }): Promise<AssistantThread> =>
  apiFetch(`/v1/assistant/threads/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });

export const deleteThread = async (id: string): Promise<void> =>
  apiFetch(`/v1/assistant/threads/${id}`, {
    method: 'DELETE',
  });

export const listMessages = async (threadId: string): Promise<AssistantMessage[]> =>
  unwrapList(await apiFetch(`/v1/assistant/threads/${threadId}/messages`));

export const createMessage = async (
  threadId: string,
  body: { role: string; content: string; metadata?: Record<string, any> }
): Promise<AssistantMessage> =>
  apiFetch(`/v1/assistant/threads/${threadId}/messages`, {
    method: 'POST',
    body: JSON.stringify(body),
  });

export const streamThreadMessage = async (
  threadId: string,
  body: { content: string; metadata?: Record<string, any> }
): Promise<string> => {
  const res = await apiFetchRaw(`/v1/assistant/threads/${threadId}/messages/stream`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    let message = res.statusText || 'Request failed';
    try {
      const errorBody = await res.json();
      if (errorBody?.error?.message) {
        message = errorBody.error.message;
      }
    } catch {}
    throw new Error(message);
  }
  const raw = await res.text();
  const lines = raw.split('\n').map((line) => line.trim());
  const deltas: string[] = [];
  for (const line of lines) {
    if (!line.startsWith('data:')) continue;
    const payload = line.replace(/^data:\s*/, '');
    try {
      const parsed = JSON.parse(payload);
      if (parsed?.delta) {
        deltas.push(parsed.delta);
      } else if (parsed?.content) {
        deltas.push(parsed.content);
      }
    } catch {}
  }
  return deltas.join('');
};

export const listSuggestions = async (): Promise<AssistantSuggestion[]> =>
  unwrapList(await apiFetch('/v1/assistant/suggestions'));

export const listAttachments = async (threadId: string): Promise<AssistantAttachment[]> =>
  unwrapList(await apiFetch(`/v1/assistant/threads/${threadId}/attachments`));

export const createAttachment = async (
  threadId: string,
  body: { message_id: string; file_url: string; mime_type: string; type: string; expires_at?: string }
): Promise<AssistantAttachment> =>
  apiFetch(`/v1/assistant/threads/${threadId}/attachments`, {
    method: 'POST',
    body: JSON.stringify(body),
  });

export const createUpload = async (body: { file_url: string; mime_type: string; expires_at?: string }): Promise<AssistantUpload> =>
  apiFetch('/v1/uploads', {
    method: 'POST',
    body: JSON.stringify(body),
  });

export const transcribeAudio = async (body: { audio_url: string }): Promise<AssistantJob> =>
  apiFetch('/v1/assistant/audio/transcribe', {
    method: 'POST',
    body: JSON.stringify(body),
  });

export const runOCR = async (body: { image_url: string }): Promise<AssistantJob> =>
  apiFetch('/v1/assistant/ocr', {
    method: 'POST',
    body: JSON.stringify(body),
  });

export const getOCRStatus = async (jobId: string): Promise<AssistantJob> =>
  apiFetch(`/v1/assistant/ocr/${jobId}`);

export const runVisionSearch = async (body: { image_url: string; query?: string }): Promise<AssistantJob> =>
  apiFetch('/v1/assistant/vision/search', {
    method: 'POST',
    body: JSON.stringify(body),
  });

export const executeTool = async (body: { tool: string; params?: Record<string, any>; thread_id?: string }): Promise<any> =>
  apiFetch('/v1/assistant/tools/execute', {
    method: 'POST',
    body: JSON.stringify(body),
  });

export const listToolHistory = async (): Promise<AssistantToolHistory[]> =>
  unwrapList(await apiFetch('/v1/assistant/tools/history'));

export const listMemory = async (): Promise<AssistantMemory[]> =>
  unwrapList(await apiFetch('/v1/assistant/memory'));

export const createMemory = async (body: { key: string; value: string; source?: string; confidence?: number; consent_given?: boolean }): Promise<AssistantMemory> =>
  apiFetch('/v1/assistant/memory', {
    method: 'POST',
    body: JSON.stringify(body),
  });

export const updateMemory = async (id: string, body: { value: string; consent_given?: boolean }): Promise<AssistantMemory> =>
  apiFetch(`/v1/assistant/memory/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });

export const deleteMemory = async (id: string): Promise<void> =>
  apiFetch(`/v1/assistant/memory/${id}`, {
    method: 'DELETE',
  });

export const postModeration = async (body: Record<string, any>): Promise<any> =>
  apiFetch('/v1/assistant/moderate', {
    method: 'POST',
    body: JSON.stringify(body),
  });

export const postReport = async (body: Record<string, any>): Promise<any> =>
  apiFetch('/v1/assistant/report', {
    method: 'POST',
    body: JSON.stringify(body),
  });

export const postAssistantEvent = async (body: Record<string, any>): Promise<any> =>
  apiFetch('/v1/assistant/events', {
    method: 'POST',
    body: JSON.stringify(body),
  });

export const getAssistantMetrics = async (): Promise<any> =>
  apiFetch('/v1/assistant/metrics');
