import { coreFetch } from "./adminApi";

export type NotificationItem = {
  id: string;
  type: string;
  title?: string;
  body?: string;
  status: string;
  channels?: string[];
  created_at?: string;
  updated_at?: string;
};

export type NotificationChannelState = {
  tenant_id: string;
  user_id: string;
  push: boolean;
  whatsapp: boolean;
  sms: boolean;
  email: boolean;
  updated_at?: string;
};

export type NotificationPreferenceState = {
  tenant_id: string;
  user_id: string;
  marketing: boolean;
  support: boolean;
  rewards: boolean;
  system: boolean;
  frequency: string;
  quiet_hours_start?: string;
  quiet_hours_end?: string;
  updated_at?: string;
};

export type WhatsAppTemplateVersion = {
  id: string;
  template_id: string;
  version: number;
  name: string;
  status: string;
  approved_by?: string;
  approved_at?: string;
  created_at?: string;
  updated_at?: string;
};

export type WhatsAppTemplate = {
  id: string;
  name: string;
  content: string;
  status: string;
  version?: number;
  approved_by?: string;
  approved_at?: string;
  created_at?: string;
  updated_at?: string;
};

export type CommsBroadcast = {
  id: string;
  name: string;
  status: string;
  channel?: string;
  scheduled_at?: string;
  segment_criteria?: Record<string, unknown>;
  template_id?: string;
  created_at?: string;
};

export type CommsSegment = {
  id: string;
  segment_name: string;
  criteria?: Record<string, unknown>;
  weight?: number;
  created_at?: string;
};

export type CommsMessage = {
  id: string;
  channel: string;
  content: string;
  status: string;
  scheduled_at?: string;
  created_at?: string;
};

export type MarketingTarget = {
  id: string;
  promotion_id: string;
  audience_segment: string;
  channel: string;
  resolved_count?: number;
  created_at?: string;
};

const unwrapItems = <T,>(payload: any, key: string): T[] => (Array.isArray(payload?.[key]) ? payload[key] : []);

export const getDeliverySnapshot = async () => {
  const [notifications, preferences, channels, templates, commsBroadcasts, commsScheduled, commsSegments, commsMetrics, marketingAudiences, marketingInsights] = await Promise.all([
    coreFetch("/notifications?limit=12").then((data) => unwrapItems<NotificationItem>(data, "items")).catch(() => []),
    coreFetch("/notifications/preferences").catch(() => null),
    coreFetch("/notifications/channels").catch(() => null),
    coreFetch("/whatsapp/templates").then((data) => unwrapItems<WhatsAppTemplate>(data, "items")).catch(() => []),
    coreFetch("/seller/comms/broadcasts?limit=12").then((data) => unwrapItems<CommsBroadcast>(data, "items")).catch(() => []),
    coreFetch("/seller/comms/scheduled").then((data) => unwrapItems<CommsMessage>(data, "items")).catch(() => []),
    coreFetch("/seller/comms/segments").then((data) => unwrapItems<CommsSegment>(data, "items")).catch(() => []),
    coreFetch("/seller/comms/metrics").catch(() => null),
    coreFetch("/seller/marketing/audiences").then((data) => unwrapItems<MarketingTarget>(data, "items")).catch(() => []),
    coreFetch("/seller/marketing/kpis?window=lifetime").catch(() => null),
  ]);

  return {
    notifications,
    preferences,
    channels,
    templates,
    commsBroadcasts,
    commsScheduled,
    commsSegments,
    commsMetrics,
    marketingAudiences,
    marketingInsights,
  };
};

export const getTemplateVersions = async (templateId: string): Promise<WhatsAppTemplateVersion[]> => {
  const data = await coreFetch(`/whatsapp/templates/${encodeURIComponent(templateId)}/versions`).catch(() => ({ items: [] }));
  return unwrapItems<WhatsAppTemplateVersion>(data, "items");
};
