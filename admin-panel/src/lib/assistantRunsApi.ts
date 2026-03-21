import { coreFetch } from "./adminApi";

export type AgentRun = {
  id: string;
  tenant_id: string;
  user_id: string;
  thread_id: string;
  agent_profile: string;
  intent: string;
  status: string;
  planner_model?: string;
  selected_model?: string;
  prompt_system_version?: string;
  prompt_agent_versions?: Record<string, string>;
  prompt_template_versions?: Record<string, string>;
  prompt_profile_map?: Record<string, string>;
  plan?: Record<string, any>;
  result?: Record<string, any>;
  error_message?: string;
  created_at?: string;
  updated_at?: string;
};

export type AgentRunStep = {
  id: string;
  run_id: string;
  tenant_id: string;
  step_index: number;
  step_type: string;
  tool_name?: string;
  status: string;
  requires_confirmation: boolean;
  input?: Record<string, any>;
  output?: Record<string, any>;
  error_message?: string;
  created_at?: string;
  updated_at?: string;
};

export type AgentRunFeedback = {
  id: string;
  run_id: string;
  tenant_id: string;
  user_id: string;
  rating: number;
  outcome?: string;
  comment?: string;
  correction?: Record<string, any>;
  correct_intent?: string;
  correct_agent_profile?: string;
  use_in_planner?: boolean;
  created_at?: string;
  updated_at?: string;
};

export type AgentRunDetail = {
  run: AgentRun;
  steps: AgentRunStep[];
  feedback?: AgentRunFeedback[];
};

export type AgentFeedbackSummary = {
  total_feedback: number;
  average_rating: number;
  planner_feedback_count: number;
  tool_event_count: number;
  moderation_count: number;
  report_count: number;
  memory_event_count: number;
  message_feedback_count: number;
  outcome_counts?: Record<string, number>;
  correct_intent_counts?: Record<string, number>;
  correct_profile_counts?: Record<string, number>;
  recent_planner_signals?: AgentRunFeedback[];
  recent_system_signals?: Record<string, any>[];
  recent_message_signals?: Record<string, any>[];
};

export type AgentRunList = {
  items: AgentRun[];
};

export type AgentRunFilter = {
  needs_review?: boolean | null;
  status?: string;
  agent_profile?: string;
  tool?: string;
  limit?: number;
};

export const listAssistantRuns = async (filter: AgentRunFilter = {}): Promise<AgentRunList> => {
  const query = new URLSearchParams();
  if (typeof filter.needs_review === "boolean") {
    query.set("needs_review", String(filter.needs_review));
  }
  if (filter.status?.trim()) {
    query.set("status", filter.status.trim());
  }
  if (filter.agent_profile?.trim()) {
    query.set("agent_profile", filter.agent_profile.trim());
  }
  if (filter.tool?.trim()) {
    query.set("tool", filter.tool.trim());
  }
  if (typeof filter.limit === "number" && filter.limit > 0) {
    query.set("limit", String(Math.min(filter.limit, 100)));
  }
  const suffix = query.toString() ? `?${query.toString()}` : "";
  return coreFetch(`/assistant/runs${suffix}`);
};

export const getAssistantRun = async (id: string): Promise<AgentRunDetail> => coreFetch(`/assistant/runs/${encodeURIComponent(id)}`);

export const createAssistantRunFeedback = async (
  id: string,
  payload: {
    rating: number;
    outcome?: string;
    comment?: string;
    correction?: Record<string, any>;
    correct_intent?: string;
    correct_agent_profile?: string;
    use_in_planner?: boolean;
  },
): Promise<AgentRunFeedback> => coreFetch(`/assistant/runs/${encodeURIComponent(id)}/feedback`, {
  method: "POST",
  body: JSON.stringify(payload),
});

export const getAssistantFeedbackSummary = async (): Promise<AgentFeedbackSummary> =>
  coreFetch("/assistant/feedback/summary");
