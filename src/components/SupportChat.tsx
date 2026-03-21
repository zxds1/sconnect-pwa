import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { Send, X, Loader2, Paperclip, Mic, Star, Sparkles, ShieldCheck, Minus, Camera } from 'lucide-react';
import {
  createChatMessage,
  createChatThread,
  createSupportTicketAttachment,
  escalateChatThread,
  listChatMessages
} from '../lib/supportApi';
import { requestUploadPresign } from '../lib/uploadsApi';
import { createThread, listMessages, streamThreadMessage, transcribeAudio } from '../lib/assistantApi';
import { getOpsConfig } from '../lib/opsConfigApi';

type SupportMode = 'duka' | 'seller-ai' | 'brand';

type SupportMessage = {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
  metadata?: Record<string, any>;
};

const DEFAULT_MODE_COPY: Record<SupportMode, { title: string; subtitle: string; starter: string; badge: string }> = {
  duka: {
    title: 'Duka Support',
    subtitle: 'AI + Human • QR, stock, rewards',
    starter: 'Habari! Need help with QR, receipts, or rewards? I can help right away.',
    badge: '+5⭐'
  },
  'seller-ai': {
    title: 'Seller Studio AI',
    subtitle: 'Insights • Rankings • Forecasts',
    starter: 'Ask me to analyze your data. Example: “Why am I #3 today?”',
    badge: 'Insights'
  },
  brand: {
    title: 'Brand Executive',
    subtitle: 'Live market intelligence',
    starter: 'Welcome. Ask for heatmaps, top dukas, and demand spikes.',
    badge: 'Live'
  }
};

const DEFAULT_QUICK_REPLIES: Record<SupportMode, Array<{ label: string; value: string }>> = {
  duka: [
    { label: 'QR Setup', value: 'QR not scanning. Help me fix it.' },
    { label: 'Photo Stock', value: 'I sent a shelf photo. How many units did you count?' },
    { label: 'Rank Help', value: 'Why am I #3 rank today?' },
    { label: 'Billing', value: 'How do I redeem SC rewards?' }
  ],
  'seller-ai': [
    { label: 'Rank', value: 'Why am I #3 rank today?' },
    { label: 'Forecast', value: 'Forecast demand for Unga this week.' },
    { label: 'Compare', value: 'Compare my prices vs nearby shops.' },
    { label: 'Boost', value: 'How do I boost my visibility?' }
  ],
  brand: [
    { label: 'Heatmap', value: 'Show Kibera heatmap for Omo.' },
    { label: 'Top Dukas', value: 'Top 5 dukas for Omo today?' },
    { label: 'Price Gap', value: 'Where is price below average?' },
    { label: 'Alerts', value: 'Any demand spikes this hour?' }
  ]
};

export const SupportChat: React.FC<{
  mode: SupportMode;
  onClose: () => void;
}> = ({ mode, onClose }) => {
  const [modeCopy, setModeCopy] = useState(DEFAULT_MODE_COPY);
  const [quickReplies, setQuickReplies] = useState(DEFAULT_QUICK_REPLIES);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [booting, setBooting] = useState(false);
  const [typingDots, setTypingDots] = useState(0);
  const [isMinimized, setIsMinimized] = useState(false);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [ticketId, setTicketId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [escalating, setEscalating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [assistantLoading, setAssistantLoading] = useState(false);
  const [assistantThreadId, setAssistantThreadId] = useState<string | null>(null);
  const [assistantMetaByContent, setAssistantMetaByContent] = useState<Record<string, any>>({});
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraBusy, setCameraBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingStreamRef = useRef<MediaStream | null>(null);
  const recordingChunksRef = useRef<BlobPart[]>([]);
  const recordingTimerRef = useRef<number | null>(null);
  const stopTimeoutRef = useRef<number | null>(null);
  const cameraVideoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    let alive = true;
    getOpsConfig('support.chat_copy')
      .then((resp) => {
        if (!alive) return;
        const value = (resp as any)?.value || {};
        const nextCopy = { ...DEFAULT_MODE_COPY };
        const nextReplies = { ...DEFAULT_QUICK_REPLIES };
        (['duka', 'seller-ai', 'brand'] as SupportMode[]).forEach((key) => {
          const entry = value?.[key] || {};
          if (entry && typeof entry === 'object') {
            nextCopy[key] = {
              title: String(entry.title || nextCopy[key].title),
              subtitle: String(entry.subtitle || nextCopy[key].subtitle),
              starter: String(entry.starter || nextCopy[key].starter),
              badge: String(entry.badge || nextCopy[key].badge)
            };
            if (Array.isArray(entry.quick_replies)) {
              const mapped = entry.quick_replies
                .map((item: any) => ({
                  label: String(item?.label || ''),
                  value: String(item?.value || '')
                }))
                .filter((item: any) => item.label && item.value);
              if (mapped.length > 0) {
                nextReplies[key] = mapped;
              }
            }
          }
        });
        setModeCopy(nextCopy);
        setQuickReplies(nextReplies);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    let ignore = false;
    const boot = async () => {
      setBooting(true);
      setErrorMessage(null);
      setStatusMessage(null);
      setThreadId(null);
      setAssistantThreadId(null);
      setTicketId(null);
      setMessages([]);
      try {
        const thread = await createChatThread({ topic: DEFAULT_MODE_COPY[mode].title });
        if (ignore) return;
        setThreadId(thread?.id ?? null);
        try {
          const aiThread = await createThread({ title: `${DEFAULT_MODE_COPY[mode].title} Support` });
          if (!ignore) setAssistantThreadId(aiThread?.id ?? null);
        } catch (err: any) {
          if (!ignore) {
            setStatusMessage(err?.message || 'AI assistant unavailable.');
          }
        }
        if (thread?.id) {
          const items = await listChatMessages(thread.id);
          if (ignore) return;
          setMessages(
            items.map((item: any, index: number) => {
              const content = String(item?.content ?? '');
              const meta = assistantMetaByContent[content];
              return {
                id: item?.id ?? `msg_${index}`,
                role: item?.role === 'user' ? 'user' : 'assistant',
                content,
                metadata: meta
              };
            })
          );
        }
      } catch (err: any) {
        if (!ignore) {
          setErrorMessage(err?.message || 'Unable to start support chat.');
        }
      } finally {
        if (!ignore) setBooting(false);
      }
    };
    boot();
    return () => {
      ignore = true;
      if (recordingTimerRef.current) {
        window.clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
      if (stopTimeoutRef.current) {
        window.clearTimeout(stopTimeoutRef.current);
        stopTimeoutRef.current = null;
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try {
          mediaRecorderRef.current.stop();
        } catch {}
      }
      if (recordingStreamRef.current) {
        recordingStreamRef.current.getTracks().forEach((track) => track.stop());
        recordingStreamRef.current = null;
      }
    };
  }, [mode]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, loading]);

  useEffect(() => {
    if (!loading && !booting && !assistantLoading && !transcribing) return;
    const timer = setInterval(() => setTypingDots(prev => (prev + 1) % 4), 400);
    return () => clearInterval(timer);
  }, [loading, booting, assistantLoading, transcribing]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => {
    return () => {
      const recorder = mediaRecorderRef.current;
      if (recorder && recorder.state !== 'inactive') {
        recorder.stop();
      }
      if (recordingTimerRef.current) {
        window.clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [cameraStream]);

  useEffect(() => {
    if (!showCamera || !cameraStream || !cameraVideoRef.current) return;
    const video = cameraVideoRef.current;
    video.srcObject = cameraStream;
    video.muted = true;
    (video as any).playsInline = true;
    video.play().catch(() => {
      setCameraError('Unable to start camera preview.');
    });
  }, [showCamera, cameraStream]);

  const agentStatusLabels: Record<string, string> = {
    orchestrator: 'Orchestrator: Coordinating…',
    discovery: 'Discovery: Comparing offers…',
    negotiation: 'Negotiation: Checking deals…',
    purchase: 'Purchase: Optimizing checkout…',
    insight: 'Insight: Pulling market signals…',
    routing: 'Routing: Comparing routes…'
  };

  const extractUrls = (text?: string) => {
    if (!text) return [];
    const matches = text.match(/https?:\/\/[^\s]+/g) || [];
    return matches.map((url) => url.replace(/[),.]+$/, ''));
  };

  const guessMediaType = (url: string): 'image' | 'video' | 'audio' | 'file' => {
    const lower = url.toLowerCase();
    if (lower.match(/\.(png|jpe?g|gif|webp|bmp|svg)$/)) return 'image';
    if (lower.match(/\.(mp4|webm|mov|m4v|avi)$/)) return 'video';
    if (lower.match(/\.(mp3|wav|m4a|aac|ogg)$/)) return 'audio';
    return 'file';
  };

  const mediaFromMetadata = (metadata?: Record<string, any>) => {
    const media: Array<{ url: string; type: 'image' | 'video' | 'audio' | 'file' }> = [];
    const candidates = [
      metadata?.media_url,
      metadata?.file_url,
      metadata?.image_url,
      metadata?.video_url,
      metadata?.audio_url
    ].filter(Boolean) as string[];
    for (const url of candidates) {
      media.push({ url, type: guessMediaType(url) });
    }
    return media;
  };

  const renderMedia = (metadata?: Record<string, any>, content?: string) => {
    const media = mediaFromMetadata(metadata);
    const contentUrls = extractUrls(content);
    for (const url of contentUrls) {
      media.push({ url, type: guessMediaType(url) });
    }
    const deduped = media.filter(
      (item, idx) => media.findIndex((m) => m.url === item.url) === idx
    );
    if (!deduped.length) return null;
    return (
      <div className="mt-2 grid grid-cols-1 gap-2">
        {deduped.map((item, idx) => {
          if (item.type === 'image') {
            return (
              <img
                key={`${item.url}-${idx}`}
                src={item.url}
                alt="assistant response"
                className="rounded-2xl border border-zinc-200 max-h-56 object-cover"
                loading="lazy"
              />
            );
          }
          if (item.type === 'video') {
            return (
              <video
                key={`${item.url}-${idx}`}
                src={item.url}
                controls
                className="rounded-2xl border border-zinc-200 max-h-56 w-full"
              />
            );
          }
          if (item.type === 'audio') {
            return (
              <audio key={`${item.url}-${idx}`} src={item.url} controls className="w-full" />
            );
          }
          return (
            <a
              key={`${item.url}-${idx}`}
              href={item.url}
              target="_blank"
              rel="noreferrer"
              className="text-[11px] text-indigo-600 underline"
            >
              Open attachment
            </a>
          );
        })}
      </div>
    );
  };

  const handleSend = async () => {
    if (!input.trim() || !threadId || loading) return;
    const text = input.trim();
    setInput('');
    setErrorMessage(null);
    setStatusMessage(null);
    const optimistic: SupportMessage = {
      id: `local_${Date.now()}`,
      role: 'user',
      content: text,
    };
    setMessages(prev => [...prev, optimistic]);
    setLoading(true);
    try {
      await createChatMessage(threadId, { role: 'user', content: text });
      const items = await listChatMessages(threadId);
      setMessages(
        items.map((item: any, index: number) => {
          const content = String(item?.content ?? '');
          const meta = assistantMetaByContent[content];
          return {
            id: item?.id ?? `msg_${index}`,
            role: item?.role === 'user' ? 'user' : 'assistant',
            content,
            metadata: meta
          };
        })
      );
      if (assistantThreadId) {
        setAssistantLoading(true);
        try {
          const aiText = await streamThreadMessage(assistantThreadId, {
            content: text,
            metadata: { support_thread_id: threadId, mode }
          });
          if (aiText?.trim()) {
            await createChatMessage(threadId, { role: 'assistant', content: aiText.trim() });
            const aiMessages = await listMessages(assistantThreadId);
            const lastAssistant = [...aiMessages].reverse().find((msg) => msg.role === 'assistant');
            if (lastAssistant?.content) {
              setAssistantMetaByContent((prev) => ({
                ...prev,
                [lastAssistant.content]: lastAssistant.metadata || {}
              }));
            }
            const refreshed = await listChatMessages(threadId);
            setMessages(
              refreshed.map((item: any, index: number) => {
                const content = String(item?.content ?? '');
                const meta = assistantMetaByContent[content] || (lastAssistant?.content === content ? lastAssistant.metadata : undefined);
                return {
                  id: item?.id ?? `msg_${index}`,
                  role: item?.role === 'user' ? 'user' : 'assistant',
                  content,
                  metadata: meta
                };
              })
            );
          }
        } catch (err: any) {
          setStatusMessage(err?.message || 'AI assistant did not respond.');
        } finally {
          setAssistantLoading(false);
        }
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to send message.');
    } finally {
      setLoading(false);
    }
  };

  const handleEscalate = async () => {
    if (!threadId || ticketId || escalating) return;
    setEscalating(true);
    setErrorMessage(null);
    setStatusMessage(null);
    try {
      const ticket = await escalateChatThread(threadId);
      const id = ticket?.id ?? null;
      setTicketId(id);
      setStatusMessage(id ? 'Escalated to human support.' : 'Escalation requested.');
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to escalate chat.');
    } finally {
      setEscalating(false);
    }
  };

  const handlePickAttachment = () => {
    if (uploading || !threadId) return;
    fileInputRef.current?.click();
  };

  const openCamera = async () => {
    if (cameraBusy || showCamera) return;
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError('Camera not supported on this device.');
      return;
    }
    setCameraBusy(true);
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false
      });
      setCameraStream(stream);
      setShowCamera(true);
    } catch (err: any) {
      setCameraError(err?.message || 'Unable to access camera.');
    } finally {
      setCameraBusy(false);
    }
  };

  const closeCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
    }
    setCameraStream(null);
    setShowCamera(false);
    if (cameraVideoRef.current) {
      cameraVideoRef.current.srcObject = null;
    }
  };

  const uploadToPresignedUrl = async (file: File, presign: any) => {
    const uploadUrl = presign?.upload_url || presign?.url;
    if (!uploadUrl) throw new Error('Missing upload URL');
    const method = (presign?.method || 'PUT').toUpperCase();
    const headers: Record<string, string> = { ...(presign?.headers || {}) };
    if (!headers['Content-Type'] && file.type) {
      headers['Content-Type'] = file.type;
    }
    const res = await fetch(uploadUrl, { method, headers, body: file });
    if (!res.ok) {
      throw new Error(`Upload failed (${res.status})`);
    }
    return presign?.s3_key || presign?.key;
  };

  const uploadAttachmentFile = async (file: File) => {
    if (!file || !threadId) return;
    setUploading(true);
    setErrorMessage(null);
    setStatusMessage(null);
    try {
      let currentTicketId = ticketId;
      if (!currentTicketId) {
        const ticket = await escalateChatThread(threadId);
        currentTicketId = ticket?.id ?? null;
        setTicketId(currentTicketId);
      }
      if (!currentTicketId) {
        throw new Error('Unable to create support ticket for attachment.');
      }
      const presign = await requestUploadPresign({
        file_name: file.name,
        mime_type: file.type || 'application/octet-stream',
        content_length: file.size,
        context: 'support'
      });
      const s3Key = await uploadToPresignedUrl(file, presign);
      await createSupportTicketAttachment(currentTicketId, {
        s3_key: s3Key,
        file_name: file.name,
        mime_type: file.type || 'application/octet-stream'
      });
      await createChatMessage(threadId, { role: 'user', content: `Uploaded attachment: ${file.name}` });
      const items = await listChatMessages(threadId);
      setMessages(
        items.map((item: any, index: number) => ({
          id: item?.id ?? `msg_${index}`,
          role: item?.role === 'user' ? 'user' : 'assistant',
          content: String(item?.content ?? '')
        }))
      );
      setStatusMessage('Attachment uploaded.');
    } catch (err: any) {
      setErrorMessage(err?.message || 'Attachment upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    await uploadAttachmentFile(file);
  };

  const handleCapturePhoto = async () => {
    if (!cameraVideoRef.current) return;
    if (cameraBusy) return;
    setCameraBusy(true);
    try {
      const video = cameraVideoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Camera unavailable.');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const blob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.9));
      if (!blob) throw new Error('Unable to capture photo.');
      const file = new File([blob], `support_photo_${Date.now()}.jpg`, { type: 'image/jpeg' });
      await uploadAttachmentFile(file);
      closeCamera();
    } catch (err: any) {
      setCameraError(err?.message || 'Unable to capture photo.');
    } finally {
      setCameraBusy(false);
    }
  };

  const handleTranscribe = async () => {
    if (isRecording || transcribing) return;
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      const audioUrl = window.prompt('Audio URL to transcribe:');
      if (!audioUrl?.trim()) return;
      setErrorMessage(null);
      setStatusMessage(null);
      try {
        const job = await transcribeAudio({ audio_url: audioUrl.trim() });
        const transcript = job?.result?.text || job?.result?.transcript;
        if (transcript && typeof transcript === 'string') {
          setInput(transcript);
          setStatusMessage('Transcription ready. Review and send.');
        } else {
          setStatusMessage(job?.id ? `Transcription queued: ${job.id}` : 'Transcription queued.');
        }
      } catch (err: any) {
        setErrorMessage(err?.message || 'Transcription failed.');
      }
      return;
    }
    setErrorMessage(null);
    setStatusMessage('Recording… click Mic again to stop.');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      recordingStreamRef.current = stream;
      recordingChunksRef.current = [];
      setRecordingSeconds(0);
      if (recordingTimerRef.current) window.clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = window.setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
      recorder.ondataavailable = (evt) => {
        if (evt.data && evt.data.size > 0) recordingChunksRef.current.push(evt.data);
      };
      recorder.onstop = async () => {
        if (stopTimeoutRef.current) {
          window.clearTimeout(stopTimeoutRef.current);
          stopTimeoutRef.current = null;
        }
        stream.getTracks().forEach((track) => track.stop());
        recordingStreamRef.current = null;
        if (recordingTimerRef.current) {
          window.clearInterval(recordingTimerRef.current);
          recordingTimerRef.current = null;
        }
        const blob = new Blob(recordingChunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        if (!blob.size) {
          setStatusMessage('No audio captured.');
          setIsRecording(false);
          return;
        }
        setIsRecording(false);
        setTranscribing(true);
        try {
          const fileName = `support_audio_${Date.now()}.webm`;
          const file = new File([blob], fileName, { type: blob.type || 'audio/webm' });
          const presign = await requestUploadPresign({
            file_name: file.name,
            mime_type: file.type || 'audio/webm',
            content_length: file.size,
            context: 'support_audio'
          });
          const uploadUrl = presign?.upload_url || presign?.url;
          if (!uploadUrl) throw new Error('Upload URL missing.');
          const s3Key = await uploadToPresignedUrl(file, presign);
          const publicUrl = uploadUrl.split('?')[0];
          const audioUrl = publicUrl || s3Key;
          if (!audioUrl) throw new Error('Audio URL unavailable for transcription.');
          const job = await transcribeAudio({ audio_url: audioUrl });
          const transcript = job?.result?.text || job?.result?.transcript;
          if (transcript && typeof transcript === 'string') {
            setInput(transcript);
            setStatusMessage('Transcription ready. Review and send.');
          } else {
            setStatusMessage(job?.id ? `Transcription queued: ${job.id}` : 'Transcription queued.');
          }
        } catch (err: any) {
          setErrorMessage(err?.message || 'Transcription failed.');
        } finally {
          setTranscribing(false);
        }
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Microphone access failed.');
      setIsRecording(false);
    }
  };

  const handleStopRecording = () => {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state === 'inactive') {
      if (recordingStreamRef.current) {
        recordingStreamRef.current.getTracks().forEach((track) => track.stop());
        recordingStreamRef.current = null;
      }
      if (recordingTimerRef.current) {
        window.clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
      setIsRecording(false);
      return;
    }
    try {
      recorder.stop();
      setStatusMessage('Stopping recording…');
      if (stopTimeoutRef.current) window.clearTimeout(stopTimeoutRef.current);
      stopTimeoutRef.current = window.setTimeout(() => {
        if (mediaRecorderRef.current?.state !== 'inactive') {
          try {
            mediaRecorderRef.current?.stop();
          } catch {}
        }
        if (recordingStreamRef.current) {
          recordingStreamRef.current.getTracks().forEach((track) => track.stop());
          recordingStreamRef.current = null;
        }
        if (recordingTimerRef.current) {
          window.clearInterval(recordingTimerRef.current);
          recordingTimerRef.current = null;
        }
        setIsRecording(false);
      }, 1500);
    } catch {
      setIsRecording(false);
    }
  };

  if (isMinimized) {
    return (
      <button
        onClick={() => setIsMinimized(false)}
        className="fixed bottom-6 right-6 z-[95] bg-[#0b1d3a] text-white px-4 py-3 rounded-full shadow-2xl text-[10px] font-black"
      >
        {modeCopy[mode].title} • Tap to open
      </button>
    );
  }

  return (
    <>
    <div
      className="fixed inset-0 z-[49] bg-black/10"
      onClick={onClose}
    />
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed inset-0 z-50 bg-white flex flex-col sm:inset-auto sm:right-4 sm:bottom-4 sm:w-[420px] sm:h-[640px] sm:rounded-2xl sm:shadow-2xl overflow-hidden"
    >
      <div className="p-4 border-b flex items-center justify-between bg-[#0b1d3a] text-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#1976D2] flex items-center justify-center">
            {mode === 'brand' ? <ShieldCheck className="w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
          </div>
          <div>
            <h3 className="font-bold text-sm">{modeCopy[mode].title}</h3>
            <p className="text-[10px] opacity-60">{modeCopy[mode].subtitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-bold">
          <div className="px-2 py-1 rounded-full bg-white/10 flex items-center gap-1">
            <Star className="w-3 h-3 text-amber-300" /> {modeCopy[mode].badge}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsMinimized(true)}
            className="p-2 hover:bg-white/10 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-white/30"
            title="Minimize"
            aria-label="Minimize chat"
          >
            <Minus className="w-5 h-5" />
          </button>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-white/30"
            title="Close"
            aria-label="Close support chat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="px-4 py-3 bg-[#f4f7fb] border-b border-[#e4edf7] flex gap-2 overflow-x-auto no-scrollbar">
        {quickReplies[mode].map((q) => (
          <button
            key={q.label}
            onClick={() => setInput(q.value)}
            className="px-3 py-2 rounded-full bg-white text-[10px] font-black text-[#1976D2] border border-[#d6e6fa] whitespace-nowrap"
          >
            {q.label}
          </button>
        ))}
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#f7faff]">
        {messages.map((m, i) => {
          const isUser = m.role === 'user';
          return (
            <div key={m.id ?? i} className={`flex items-start gap-3 ${isUser ? 'justify-end flex-row-reverse' : 'justify-start'}`}>
              <div className={`h-8 w-8 rounded-2xl flex items-center justify-center text-[9px] font-black ${
                isUser ? 'bg-[#1976D2] text-white' : 'bg-white border border-[#d6e6fa] text-[#1976D2]'
              }`}>
                {isUser ? 'You' : 'AI'}
              </div>
              <div className="max-w-[82%] space-y-2">
                <div className={`text-[10px] font-bold ${isUser ? 'text-[#1976D2]' : 'text-zinc-500'}`}>
                  {isUser ? 'You' : modeCopy[mode].title}
                </div>
                <div className={`p-3 rounded-2xl ${
                  isUser
                    ? 'bg-[#1976D2] text-white rounded-tr-none'
                    : 'bg-white border border-[#d6e6fa] rounded-tl-none text-zinc-800 shadow-sm'
                }`}>
                  <span className="text-sm leading-relaxed">{m.content}</span>
                  {m.role === 'assistant' && renderMedia(m.metadata, m.content)}
                  {m.role === 'assistant' && Array.isArray(m.metadata?.agent_status) && m.metadata.agent_status.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {m.metadata.agent_status.map((status: string, idx: number) => {
                        const key = String(status || '').toLowerCase();
                        const label = agentStatusLabels[key] || status;
                        return (
                          <span
                            key={`${m.id ?? i}-agent-${idx}`}
                            className="px-2 py-1 rounded-full text-[9px] font-semibold tracking-[0.12em] bg-indigo-50 text-indigo-600"
                          >
                            {label}
                          </span>
                        );
                      })}
                    </div>
                  )}
                  {m.role === 'assistant' && Array.isArray(m.metadata?.references) && m.metadata.references.length > 0 && (
                    <div className="mt-2 space-y-2">
                      <div className="flex flex-wrap gap-2">
                        {m.metadata.references.map((ref: any, idx: number) => (
                          <span
                            key={`${m.id ?? i}-ref-${idx}`}
                            className="px-2 py-1 rounded-full text-[9px] font-semibold tracking-[0.12em] bg-emerald-50 text-emerald-700"
                          >
                            {ref.label}{ref.detail ? ` · ${ref.detail}` : ''}
                          </span>
                        ))}
                      </div>
                      <div className="space-y-1">
                        {m.metadata.references.map((ref: any, idx: number) => {
                          const items = ref?.data?.items;
                          if (!Array.isArray(items) || items.length === 0) return null;
                          return (
                            <div key={`${m.id ?? i}-ref-items-${idx}`} className="text-[10px] text-zinc-500 space-y-1">
                              {items.slice(0, 3).map((item: any, itemIdx: number) => (
                                <div key={`${m.id ?? i}-ref-item-${idx}-${itemIdx}`} className="flex flex-wrap gap-2">
                                  {Object.entries(item).map(([key, value]) => (
                                    <span key={key} className="px-2 py-1 rounded-full bg-zinc-50">
                                      {key}: {String(value ?? '')}
                                    </span>
                                  ))}
                                </div>
                              ))}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {(loading || booting) && (
          <div className="flex justify-start">
            <div className="bg-white border border-[#d6e6fa] rounded-2xl rounded-tl-none p-3 shadow-sm flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-[#1976D2]" />
              <span className="text-[10px] font-bold text-zinc-500">
                {booting ? 'Connecting' : 'Sending'}{'.'.repeat(typingDots)}
              </span>
            </div>
          </div>
        )}
        {assistantLoading && (
          <div className="flex justify-start">
            <div className="bg-white border border-[#d6e6fa] rounded-2xl rounded-tl-none p-3 shadow-sm flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-[#1976D2]" />
              <span className="text-[10px] font-bold text-zinc-500">Assistant typing{'.'.repeat(typingDots)}</span>
            </div>
          </div>
        )}
        {transcribing && (
          <div className="flex justify-start">
            <div className="bg-white border border-[#d6e6fa] rounded-2xl rounded-tl-none p-3 shadow-sm flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-[#1976D2]" />
              <span className="text-[10px] font-bold text-zinc-500">Transcribing audio{'.'.repeat(typingDots)}</span>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 border-t bg-white">
        {errorMessage && (
          <div className="mb-2 text-[10px] font-bold text-red-500">
            {errorMessage}
          </div>
        )}
        {statusMessage && (
          <div className="mb-2 text-[10px] font-bold text-emerald-600">
            {statusMessage}
          </div>
        )}
        {isRecording && (
          <div className="mb-2 flex items-center justify-between bg-red-50 text-red-700 px-3 py-2 rounded-xl text-[10px] font-black">
            <span>Recording… {String(Math.floor(recordingSeconds / 60)).padStart(2, '0')}:{String(recordingSeconds % 60).padStart(2, '0')}</span>
            <button
              onClick={handleStopRecording}
              className="px-3 py-1 rounded-full bg-red-500 text-white"
            >
              Stop
            </button>
          </div>
        )}
        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleFileSelected}
          />
          <button
            onClick={handlePickAttachment}
            disabled={uploading || !threadId}
            className="p-2 bg-[#eaf2ff] text-[#1976D2] rounded-full disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-[#1976D2]/30"
            aria-label="Attach a file"
          >
            <Paperclip className="w-4 h-4" />
          </button>
          <button
            onClick={openCamera}
            disabled={uploading || !threadId}
            className="p-2 bg-[#eaf2ff] text-[#1976D2] rounded-full disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-[#1976D2]/30"
            title="Open camera"
            aria-label="Open camera"
          >
            <Camera className="w-4 h-4" />
          </button>
          <button
            onClick={isRecording ? handleStopRecording : handleTranscribe}
            disabled={transcribing}
            className={`p-2 rounded-full ${isRecording ? 'bg-red-500 text-white' : 'bg-[#eaf2ff] text-[#1976D2]'} disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-[#1976D2]/30`}
            title={isRecording ? 'Stop recording' : 'Record voice'}
            aria-label={isRecording ? 'Stop voice recording' : 'Record voice message'}
          >
            <Mic className="w-4 h-4" />
          </button>
          {isRecording && (
            <>
              <div className="px-2 py-1 rounded-full bg-red-50 text-red-600 text-[10px] font-bold">
                Recording {Math.floor(recordingSeconds / 60)}:{String(recordingSeconds % 60).padStart(2, '0')}
              </div>
              <div className="flex items-end gap-1 h-4">
                <span className="w-1 h-2 bg-red-400 rounded-full animate-pulse" style={{ animationDelay: '0ms' }} />
                <span className="w-1 h-3 bg-red-400 rounded-full animate-pulse" style={{ animationDelay: '120ms' }} />
                <span className="w-1 h-4 bg-red-400 rounded-full animate-pulse" style={{ animationDelay: '240ms' }} />
                <span className="w-1 h-3 bg-red-400 rounded-full animate-pulse" style={{ animationDelay: '360ms' }} />
                <span className="w-1 h-2 bg-red-400 rounded-full animate-pulse" style={{ animationDelay: '480ms' }} />
              </div>
            </>
          )}
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type a message..."
            aria-label="Message input"
            className="flex-1 px-4 py-3 bg-[#f1f6ff] rounded-full text-sm text-zinc-900 placeholder:text-zinc-500 caret-[#1976D2] focus:outline-none focus:ring-2 focus:ring-[#1976D2]/40"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading || !threadId}
            className="p-3 bg-[#1976D2] text-white rounded-full disabled:opacity-50 transition-opacity focus:outline-none focus:ring-2 focus:ring-[#1976D2]/40"
            aria-label="Send message"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        <div className="mt-3 flex items-center justify-between text-[10px] text-zinc-400 font-bold">
          <span>Offline-ready • Syncs later</span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleEscalate}
              disabled={escalating || !threadId || !!ticketId}
              className="px-2 py-1 rounded-full border border-[#d6e6fa] text-[#1976D2] disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-[#1976D2]/30"
              aria-label={ticketId ? 'Chat already escalated' : 'Escalate chat'}
            >
              {ticketId ? 'Escalated' : escalating ? 'Escalating…' : 'Escalate'}
            </button>
            <span>Swahili Voice Supported</span>
          </div>
        </div>
      </div>
    </motion.div>
    {showCamera && (
      <div className="fixed inset-0 z-[60] bg-black/80 flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 text-white">
          <span className="text-sm font-bold">Camera</span>
          <button
            onClick={closeCamera}
            className="rounded-full px-2 py-1 text-white/80 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/30"
            aria-label="Close camera"
          >
            Close
          </button>
        </div>
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="w-full max-w-md aspect-[3/4] bg-black rounded-2xl overflow-hidden border border-white/10">
            <video ref={cameraVideoRef} className="w-full h-full object-cover" playsInline muted />
          </div>
        </div>
        {cameraError && (
          <div className="px-4 pb-2 text-red-200 text-[10px] font-bold text-center">{cameraError}</div>
        )}
        <div className="flex items-center justify-center gap-4 px-4 pb-6">
          <button
            onClick={closeCamera}
            className="px-4 py-2 rounded-full bg-white/10 text-white text-[10px] font-black focus:outline-none focus:ring-2 focus:ring-white/30"
            aria-label="Cancel camera"
          >
            Cancel
          </button>
          <button
            onClick={handleCapturePhoto}
            disabled={cameraBusy}
            className="px-6 py-2 rounded-full bg-emerald-500 text-white text-[10px] font-black disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-emerald-200"
            aria-label="Capture photo"
          >
            Capture
          </button>
        </div>
      </div>
    )}
    </>
  );
};
