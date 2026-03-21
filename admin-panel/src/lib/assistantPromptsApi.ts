import { coreFetch } from "./adminApi";

export type PromptVersion = {
  id: string;
  label?: string;
  file?: string;
  description?: string;
  content?: string;
};

export type PromptVariant = {
  default_version?: string;
  versions?: PromptVersion[];
};

export type PromptManifest = {
  system?: PromptVariant;
  agents?: Record<string, PromptVariant>;
  templates?: Record<string, PromptVariant>;
  profile_map?: Record<string, string>;
};

export type AssistantPromptOptions = {
  enabled: boolean;
  system_version: string;
  agent_versions: Record<string, string>;
  template_versions: Record<string, string>;
  profile_map: Record<string, string>;
};

export type AssistantPromptCatalog = {
  manifest?: PromptManifest;
  default?: AssistantPromptOptions;
  current?: AssistantPromptOptions;
};

export const getAssistantPromptCatalog = async (): Promise<AssistantPromptCatalog> =>
  coreFetch("/assistant/prompts");
