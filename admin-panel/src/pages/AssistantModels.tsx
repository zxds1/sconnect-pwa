import { useEffect, useMemo, useState } from "react";
import { getAssistantPromptCatalog, AssistantPromptCatalog, AssistantPromptOptions } from "../lib/assistantPromptsApi";
import { AgentRun, AgentRunDetail, AgentFeedbackSummary, listAssistantRuns, getAssistantRun, createAssistantRunFeedback, getAssistantFeedbackSummary } from "../lib/assistantRunsApi";
import { getOpsConfig, setOpsConfig } from "../lib/opsConfigApi";
import { Drawer } from "../components/Drawer";

type ModelOption = { id: string; label?: string };

type ModelProvider = { id: string; label?: string; models: ModelOption[] };

type ModelConfig = {
  enabled: boolean;
  allow_user_override: boolean;
  default_provider: string;
  default_model: string;
  providers: ModelProvider[];
};

type PromptFamily = "system" | "agent" | "template";

type DiffLine = { kind: "same" | "add" | "remove"; text: string };
type RunStatusFilter = "all" | "needs_review" | "confirmed" | "awaiting_confirmation" | "completed" | "failed";
const commonIntents = ["general", "shopping", "compare", "bag", "rfq", "seller", "support", "search", "analytics", "ops", "admin", "compliance"];

const emptyModelConfig: ModelConfig = {
  enabled: true,
  allow_user_override: true,
  default_provider: "",
  default_model: "",
  providers: [],
};

const emptyPromptConfig: AssistantPromptOptions = {
  enabled: true,
  system_version: "",
  agent_versions: {},
  template_versions: {},
  profile_map: {},
};

const normalizeProvider = (provider: ModelProvider): ModelProvider => ({
  ...provider,
  id: provider.id.trim(),
  label: provider.label?.trim() || undefined,
  models: provider.models
    .map((model) => ({
      id: model.id.trim(),
      label: model.label?.trim() || undefined,
    }))
    .filter((model) => model.id),
});

const normalizePromptConfig = (
  value: any,
  catalog: AssistantPromptCatalog,
): AssistantPromptOptions => {
  const manifest = catalog.manifest;
  const defaults = catalog.current || catalog.default || emptyPromptConfig;
  const systemVersion = value?.system_version || defaults.system_version || manifest?.system?.default_version || "v1";
  const agentVersions: Record<string, string> = {};
  const templateVersions: Record<string, string> = {};
  const profileMap: Record<string, string> = {};

  Object.entries(manifest?.agents || {}).forEach(([agentKey, variant]) => {
    agentVersions[agentKey] = value?.agent_versions?.[agentKey] || defaults.agent_versions?.[agentKey] || variant.default_version || "v1";
  });
  Object.entries(manifest?.templates || {}).forEach(([templateKey, variant]) => {
    templateVersions[templateKey] = value?.template_versions?.[templateKey] || defaults.template_versions?.[templateKey] || variant.default_version || "v1";
  });
  Object.entries(manifest?.profile_map || {}).forEach(([profileKey, agentKey]) => {
    profileMap[profileKey] = value?.profile_map?.[profileKey] || defaults.profile_map?.[profileKey] || agentKey;
  });

  if (value?.agent_versions && typeof value.agent_versions === "object") {
    Object.entries(value.agent_versions).forEach(([agentKey, version]) => {
      if (typeof version === "string" && version.trim()) {
        agentVersions[agentKey] = version.trim();
      }
    });
  }
  if (value?.profile_map && typeof value.profile_map === "object") {
    Object.entries(value.profile_map).forEach(([profileKey, agentKey]) => {
      if (typeof agentKey === "string" && agentKey.trim()) {
        profileMap[profileKey] = agentKey.trim();
      }
    });
  }
  if (value?.template_versions && typeof value.template_versions === "object") {
    Object.entries(value.template_versions).forEach(([templateKey, version]) => {
      if (typeof version === "string" && version.trim()) {
        templateVersions[templateKey] = version.trim();
      }
    });
  }

  return {
    enabled: typeof value?.enabled === "boolean" ? value.enabled : defaults.enabled ?? true,
    system_version: String(systemVersion).trim(),
    agent_versions: agentVersions,
    template_versions: templateVersions,
    profile_map: profileMap,
  };
};

const buildLineDiff = (baseText: string, compareText: string): DiffLine[] => {
  const base = baseText.split("\n");
  const compare = compareText.split("\n");
  const out: DiffLine[] = [];
  let i = 0;
  let j = 0;
  while (i < base.length || j < compare.length) {
    const left = base[i];
    const right = compare[j];
    if (left === right) {
      out.push({ kind: "same", text: left ?? "" });
      i += 1;
      j += 1;
      continue;
    }
    const nextLeft = base[i + 1];
    const nextRight = compare[j + 1];
    if (left !== undefined && left === nextRight) {
      out.push({ kind: "add", text: right ?? "" });
      j += 1;
      continue;
    }
    if (right !== undefined && nextLeft === right) {
      out.push({ kind: "remove", text: left ?? "" });
      i += 1;
      continue;
    }
    if (left !== undefined) {
      out.push({ kind: "remove", text: left });
      i += 1;
    }
    if (right !== undefined) {
      out.push({ kind: "add", text: right });
      j += 1;
    }
  }
  return out;
};

export const AssistantModels = () => {
  const [modelConfig, setModelConfig] = useState<ModelConfig>(emptyModelConfig);
  const [promptCatalog, setPromptCatalog] = useState<AssistantPromptCatalog | null>(null);
  const [promptConfig, setPromptConfig] = useState<AssistantPromptOptions>(emptyPromptConfig);
  const [status, setStatus] = useState<string | null>(null);
  const [promptStatus, setPromptStatus] = useState<string | null>(null);
  const [savingModels, setSavingModels] = useState(false);
  const [savingPrompts, setSavingPrompts] = useState(false);
  const [diffFamily, setDiffFamily] = useState<PromptFamily>("system");
  const [diffKey, setDiffKey] = useState("");
  const [diffBaseVersion, setDiffBaseVersion] = useState("");
  const [diffCompareVersion, setDiffCompareVersion] = useState("");
  const [runFilter, setRunFilter] = useState<RunStatusFilter>("needs_review");
  const [runStatus, setRunStatus] = useState("");
  const [runProfile, setRunProfile] = useState("");
  const [runTool, setRunTool] = useState("");
  const [runItems, setRunItems] = useState<AgentRun[]>([]);
  const [runLoading, setRunLoading] = useState(false);
  const [runError, setRunError] = useState<string | null>(null);
  const [selectedRun, setSelectedRun] = useState<AgentRunDetail | null>(null);
  const [selectedRunId, setSelectedRunId] = useState("");
  const [feedbackRating, setFeedbackRating] = useState("5");
  const [feedbackOutcome, setFeedbackOutcome] = useState("correct");
  const [feedbackComment, setFeedbackComment] = useState("");
  const [feedbackCorrection, setFeedbackCorrection] = useState("");
  const [feedbackCorrectIntent, setFeedbackCorrectIntent] = useState("support");
  const [feedbackCorrectProfile, setFeedbackCorrectProfile] = useState("support");
  const [feedbackUseInPlanner, setFeedbackUseInPlanner] = useState(true);
  const [feedbackSaving, setFeedbackSaving] = useState(false);
  const [feedbackSummary, setFeedbackSummary] = useState<AgentFeedbackSummary | null>(null);
  const [feedbackSummaryLoading, setFeedbackSummaryLoading] = useState(false);
  const [selectedSystemSignal, setSelectedSystemSignal] = useState<Record<string, any> | null>(null);
  const [showRunDrawer, setShowRunDrawer] = useState(false);
  const [showSignalDrawer, setShowSignalDrawer] = useState(false);

  const loadModelConfig = async () => {
    setStatus(null);
    try {
      const resp = await getOpsConfig("assistant.model_options");
      const value = resp?.value || {};
      setModelConfig({
        enabled: Boolean(value?.enabled),
        allow_user_override: Boolean(value?.allow_user_override),
        default_provider: value?.default_provider || "",
        default_model: value?.default_model || "",
        providers: Array.isArray(value?.providers) ? value.providers : [],
      });
    } catch (err: any) {
      setStatus(err?.message || "Unable to load assistant model config.");
    }
  };

  const loadPromptConfig = async () => {
    setPromptStatus(null);
    try {
      const catalog = await getAssistantPromptCatalog();
      setPromptCatalog(catalog);
      const value = await getOpsConfig("assistant.prompt_options").then((resp) => resp?.value ?? {}).catch(() => ({}));
      setPromptConfig(normalizePromptConfig(value, catalog));
    } catch (err: any) {
      setPromptStatus(err?.message || "Unable to load assistant prompt config.");
    }
  };

  useEffect(() => {
    loadModelConfig();
    loadPromptConfig();
  }, []);

  const loadRuns = async (overrides?: { runFilter?: RunStatusFilter; runStatus?: string; runProfile?: string; runTool?: string }) => {
    setRunLoading(true);
    setRunError(null);
    try {
      const activeFilter = overrides?.runFilter ?? runFilter;
      const activeStatus = overrides?.runStatus ?? runStatus;
      const activeProfile = overrides?.runProfile ?? runProfile;
      const activeTool = overrides?.runTool ?? runTool;
      const needsReview = activeFilter === "needs_review" ? true : activeFilter === "confirmed" ? false : null;
      const resp = await listAssistantRuns({
        needs_review: needsReview,
        status: activeStatus.trim() || undefined,
        agent_profile: activeProfile.trim() || undefined,
        tool: activeTool.trim() || undefined,
      });
      setRunItems(resp.items || []);
      const nextSelected = selectedRunId && (resp.items || []).some((item) => item.id === selectedRunId)
        ? selectedRunId
        : resp.items?.[0]?.id || "";
      setSelectedRunId(nextSelected);
      if (nextSelected) {
        const detail = await getAssistantRun(nextSelected);
        setSelectedRun(detail);
      } else {
        setSelectedRun(null);
      }
    } catch (err: any) {
      setRunError(err?.message || "Unable to load assistant runs.");
      setRunItems([]);
      setSelectedRun(null);
    } finally {
      setRunLoading(false);
    }
  };

  const loadFeedbackSummary = async () => {
    setFeedbackSummaryLoading(true);
    try {
      const summary = await getAssistantFeedbackSummary();
      setFeedbackSummary(summary);
    } catch {
      setFeedbackSummary(null);
    } finally {
      setFeedbackSummaryLoading(false);
    }
  };

  useEffect(() => {
    loadRuns();
    loadFeedbackSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runFilter, runStatus, runProfile, runTool]);

  const updateProvider = (index: number, patch: Partial<ModelProvider>) => {
    setModelConfig((prev) => {
      const next = [...prev.providers];
      next[index] = { ...next[index], ...patch };
      return { ...prev, providers: next };
    });
  };

  const updateModel = (providerIndex: number, modelIndex: number, patch: Partial<ModelOption>) => {
    setModelConfig((prev) => {
      const next = [...prev.providers];
      const provider = next[providerIndex];
      const models = [...provider.models];
      models[modelIndex] = { ...models[modelIndex], ...patch };
      next[providerIndex] = { ...provider, models };
      return { ...prev, providers: next };
    });
  };

  const addProvider = () => {
    setModelConfig((prev) => ({
      ...prev,
      providers: [...prev.providers, { id: "", label: "", models: [{ id: "", label: "" }] }],
    }));
  };

  const removeProvider = (index: number) => {
    setModelConfig((prev) => ({
      ...prev,
      providers: prev.providers.filter((_, i) => i !== index),
    }));
  };

  const addModel = (providerIndex: number) => {
    setModelConfig((prev) => {
      const next = [...prev.providers];
      const provider = next[providerIndex];
      next[providerIndex] = { ...provider, models: [...provider.models, { id: "", label: "" }] };
      return { ...prev, providers: next };
    });
  };

  const removeModel = (providerIndex: number, modelIndex: number) => {
    setModelConfig((prev) => {
      const next = [...prev.providers];
      const provider = next[providerIndex];
      next[providerIndex] = { ...provider, models: provider.models.filter((_, i) => i !== modelIndex) };
      return { ...prev, providers: next };
    });
  };

  const handleSaveModels = async () => {
    setSavingModels(true);
    setStatus(null);
    try {
      const normalizedProviders = modelConfig.providers.map(normalizeProvider).filter((p) => p.id && p.models.length > 0);
      if (!modelConfig.default_provider.trim()) throw new Error("Default provider is required.");
      if (!modelConfig.default_model.trim()) throw new Error("Default model is required.");
      if (normalizedProviders.length === 0) throw new Error("At least one provider with models is required.");
      await setOpsConfig("assistant.model_options", {
        enabled: modelConfig.enabled,
        allow_user_override: modelConfig.allow_user_override,
        default_provider: modelConfig.default_provider.trim(),
        default_model: modelConfig.default_model.trim(),
        providers: normalizedProviders,
      });
      setStatus("Saved.");
    } catch (err: any) {
      setStatus(err?.message || "Unable to save.");
    } finally {
      setSavingModels(false);
    }
  };

  const manifestAgents = useMemo(() => Object.entries(promptCatalog?.manifest?.agents || {}), [promptCatalog]);
  const manifestTemplates = useMemo(() => Object.entries(promptCatalog?.manifest?.templates || {}), [promptCatalog]);
  const manifestProfiles = useMemo(() => Object.entries(promptCatalog?.manifest?.profile_map || {}), [promptCatalog]);
  const systemVersions = useMemo(() => promptCatalog?.manifest?.system?.versions || [], [promptCatalog]);
  const defaultPromptConfig = promptCatalog?.default || emptyPromptConfig;
  const diffEntries = useMemo(() => {
    if (!promptCatalog?.manifest) return [];
    if (diffFamily === "system") {
      return [["system", promptCatalog.manifest.system || { versions: [] }]] as Array<[string, any]>;
    }
    if (diffFamily === "agent") return manifestAgents;
    return manifestTemplates;
  }, [diffFamily, manifestAgents, manifestTemplates, promptCatalog]);

  useEffect(() => {
    if (!promptCatalog?.manifest) return;
    if (diffFamily === "system") {
      const versions = promptCatalog.manifest.system?.versions || [];
      setDiffKey("system");
      setDiffBaseVersion((prev) => prev || promptCatalog.manifest.system?.default_version || versions[0]?.id || "v1");
      setDiffCompareVersion((prev) => prev || versions[1]?.id || versions[0]?.id || "v1");
      return;
    }
    const firstEntry = diffFamily === "agent" ? manifestAgents[0] : manifestTemplates[0];
    if (firstEntry) {
      const [key, variant] = firstEntry;
      const versions = variant.versions || [];
      setDiffKey((prev) => prev || key);
      setDiffBaseVersion((prev) => prev || variant.default_version || versions[0]?.id || "v1");
      setDiffCompareVersion((prev) => prev || versions[1]?.id || versions[0]?.id || "v1");
    }
  }, [diffFamily, promptCatalog, manifestAgents, manifestTemplates]);

  const selectedVariant = useMemo(() => {
    if (!promptCatalog?.manifest) return null;
    if (diffFamily === "system") return { key: "system", variant: promptCatalog.manifest.system };
    const entries = diffFamily === "agent" ? manifestAgents : manifestTemplates;
    const found = entries.find(([key]) => key === diffKey) || entries[0];
    if (!found) return null;
    return { key: found[0], variant: found[1] };
  }, [diffFamily, diffKey, manifestAgents, manifestTemplates, promptCatalog]);

  const selectedVersions = selectedVariant?.variant?.versions || [];
  const baseContent = selectedVersions.find((version) => version.id === diffBaseVersion)?.content || "";
  const compareContent = selectedVersions.find((version) => version.id === diffCompareVersion)?.content || "";
  const diffLines = useMemo(() => buildLineDiff(baseContent, compareContent), [baseContent, compareContent]);

  const handleSavePrompts = async () => {
    setSavingPrompts(true);
    setPromptStatus(null);
    try {
      if (!promptConfig.system_version.trim()) throw new Error("System version is required.");
      const normalizedAgentVersions: Record<string, string> = {};
      manifestAgents.forEach(([agentKey, variant]) => {
        const version = promptConfig.agent_versions?.[agentKey] || variant.default_version || "v1";
        normalizedAgentVersions[agentKey] = version.trim();
      });
      const normalizedTemplateVersions: Record<string, string> = {};
      manifestTemplates.forEach(([templateKey, variant]) => {
        const version = promptConfig.template_versions?.[templateKey] || variant.default_version || "v1";
        normalizedTemplateVersions[templateKey] = version.trim();
      });
      const normalizedProfileMap: Record<string, string> = {};
      manifestProfiles.forEach(([profileKey, fallbackAgent]) => {
        const mapped = promptConfig.profile_map?.[profileKey] || fallbackAgent;
        normalizedProfileMap[profileKey] = mapped.trim();
      });
      await setOpsConfig("assistant.prompt_options", {
        enabled: promptConfig.enabled,
        system_version: promptConfig.system_version.trim(),
        agent_versions: normalizedAgentVersions,
        template_versions: normalizedTemplateVersions,
        profile_map: normalizedProfileMap,
      });
      setPromptStatus("Saved.");
    } catch (err: any) {
      setPromptStatus(err?.message || "Unable to save prompt config.");
    } finally {
      setSavingPrompts(false);
    }
  };

  const updatePromptAgentVersion = (agentKey: string, version: string) => {
    setPromptConfig((prev) => ({
      ...prev,
      agent_versions: { ...prev.agent_versions, [agentKey]: version },
    }));
  };

  const updatePromptProfileMap = (profileKey: string, agentKey: string) => {
    setPromptConfig((prev) => ({
      ...prev,
      profile_map: { ...prev.profile_map, [profileKey]: agentKey },
    }));
  };

  const updatePromptTemplateVersion = (templateKey: string, version: string) => {
    setPromptConfig((prev) => ({
      ...prev,
      template_versions: { ...prev.template_versions, [templateKey]: version },
    }));
  };

  const selectRun = async (runId: string) => {
    setSelectedRunId(runId);
    setShowRunDrawer(false);
    if (!runId) {
      setSelectedRun(null);
      return;
    }
    setRunLoading(true);
    setRunError(null);
    try {
      const detail = await getAssistantRun(runId);
      setSelectedRun(detail);
    } catch (err: any) {
      setRunError(err?.message || "Unable to load run details.");
      setSelectedRun(null);
    } finally {
      setRunLoading(false);
    }
  };

  const submitFeedback = async () => {
    if (!selectedRun?.run?.id) return;
    setFeedbackSaving(true);
    try {
      let correction: Record<string, any> | undefined;
      const rawCorrection = feedbackCorrection.trim();
      if (rawCorrection) {
        correction = JSON.parse(rawCorrection);
      }
      await createAssistantRunFeedback(selectedRun.run.id, {
        rating: Math.max(1, Math.min(5, Number(feedbackRating) || 5)),
        outcome: feedbackOutcome.trim() || undefined,
        comment: feedbackComment.trim() || undefined,
        correct_intent: feedbackCorrectIntent.trim() || undefined,
        correct_agent_profile: feedbackCorrectProfile.trim() || undefined,
        use_in_planner: feedbackUseInPlanner,
        correction,
      });
      setFeedbackComment("");
      setFeedbackCorrection("");
      setFeedbackUseInPlanner(true);
      await selectRun(selectedRun.run.id);
      await loadFeedbackSummary();
    } catch (err: any) {
      setRunError(err?.message || "Unable to save feedback.");
    } finally {
      setFeedbackSaving(false);
    }
  };

  const focusRunsByProfile = async (profile: string) => {
    setRunFilter("all");
    setRunStatus("");
    setRunTool("");
    setRunProfile(profile);
    setSelectedSystemSignal(null);
    await loadRuns({ runFilter: "all", runStatus: "", runProfile: profile, runTool: "" });
  };

  const focusRunsByIntent = async (intent: string) => {
    await focusRunsByProfile(intent);
  };

  const isFocusedBucket = (value: string) => runProfile.trim().toLowerCase() === value.trim().toLowerCase();

  const focusRunsByTool = async (tool: string) => {
    setRunFilter("all");
    setRunStatus("");
    setRunProfile("");
    setRunTool(tool);
    setSelectedSystemSignal(null);
    await loadRuns({ runFilter: "all", runStatus: "", runProfile: "", runTool: tool });
  };

  const focusRunsBySystemSignal = async (signal: Record<string, any>) => {
    setSelectedSystemSignal(signal);
    setShowSignalDrawer(true);
    const eventType = String(signal?.event_type || "").toLowerCase();
    const agentProfile = String(signal?.agent_profile || "").trim().toLowerCase();
    const tool = String(signal?.tool || "").trim().toLowerCase();
    if (eventType === "tool_executed" && tool) {
      await focusRunsByTool(tool);
      return;
    }
    if (eventType === "moderation_requested") {
      await focusRunsByTool("moderate");
      return;
    }
    if (eventType === "report_requested") {
      await focusRunsByTool("report");
      return;
    }
    if (eventType.startsWith("memory_")) {
      await focusRunsByTool("memory");
      return;
    }
    if (agentProfile) {
      await focusRunsByProfile(agentProfile);
    }
  };

  const isFocusedTool = (value: string) => runTool.trim().toLowerCase() === value.trim().toLowerCase();

  const openRunDrawer = () => {
    if (selectedRun) {
      setShowRunDrawer(true);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2>Assistant Models</h2>
          <p>Control available providers, model defaults, prompt versions, and agent routing.</p>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div>
            <h3>Model Configuration</h3>
            <p>Defaults are used when a user has not selected preferences.</p>
          </div>
          <div className="actions">
            <button className="button" onClick={handleSaveModels} disabled={savingModels}>Save Models</button>
          </div>
        </div>
        <div style={{ display: "grid", gap: 12 }}>
          <label>
            <input
              type="checkbox"
              checked={modelConfig.enabled}
              onChange={(e) => setModelConfig((prev) => ({ ...prev, enabled: e.target.checked }))}
            />
            <span style={{ marginLeft: 8 }}>Assistant model selection enabled</span>
          </label>
          <label>
            <input
              type="checkbox"
              checked={modelConfig.allow_user_override}
              onChange={(e) => setModelConfig((prev) => ({ ...prev, allow_user_override: e.target.checked }))}
            />
            <span style={{ marginLeft: 8 }}>Allow user preference override</span>
          </label>
          <div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
            <input
              className="input"
              placeholder="Default provider id"
              value={modelConfig.default_provider}
              onChange={(e) => setModelConfig((prev) => ({ ...prev, default_provider: e.target.value }))}
            />
            <input
              className="input"
              placeholder="Default model id"
              value={modelConfig.default_model}
              onChange={(e) => setModelConfig((prev) => ({ ...prev, default_model: e.target.value }))}
            />
          </div>
        </div>

        <div style={{ marginTop: 18, display: "grid", gap: 16 }}>
          {modelConfig.providers.map((provider, index) => (
            <div key={`provider-${index}`} style={{ border: "1px solid var(--border)", borderRadius: 12, padding: 16 }}>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <input
                  className="input"
                  placeholder="Provider id"
                  value={provider.id}
                  onChange={(e) => updateProvider(index, { id: e.target.value })}
                />
                <input
                  className="input"
                  placeholder="Provider label (optional)"
                  value={provider.label || ""}
                  onChange={(e) => updateProvider(index, { label: e.target.value })}
                />
                <button className="button" onClick={() => removeProvider(index)}>Remove</button>
              </div>

              <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
                {provider.models.map((model, modelIndex) => (
                  <div key={`provider-${index}-model-${modelIndex}`} style={{ display: "flex", gap: 12 }}>
                    <input
                      className="input"
                      placeholder="Model id"
                      value={model.id}
                      onChange={(e) => updateModel(index, modelIndex, { id: e.target.value })}
                    />
                    <input
                      className="input"
                      placeholder="Model label (optional)"
                      value={model.label || ""}
                      onChange={(e) => updateModel(index, modelIndex, { label: e.target.value })}
                    />
                    <button className="button" onClick={() => removeModel(index, modelIndex)}>Remove</button>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 10 }}>
                <button className="button" onClick={() => addModel(index)}>Add Model</button>
              </div>
            </div>
          ))}
          <div>
            <button className="button" onClick={addProvider}>Add Provider</button>
          </div>
        </div>

        {status && <div style={{ marginTop: 12 }} className="card">{status}</div>}
      </div>

      <div className="card">
        <div className="card-header">
          <div>
            <h3>Prompt Versions</h3>
            <p>Choose the active prompt version for each agent and profile route.</p>
          </div>
          <div className="actions">
            <button className="button" onClick={handleSavePrompts} disabled={savingPrompts || !promptCatalog}>Save Prompts</button>
          </div>
        </div>

        {promptCatalog ? (
          <div style={{ display: "grid", gap: 16 }}>
            <label style={{ display: "grid", gap: 6 }}>
              <span>System Version</span>
              <select
                className="input"
                value={promptConfig.system_version || defaultPromptConfig.system_version || promptCatalog.manifest?.system?.default_version || "v1"}
                onChange={(e) => setPromptConfig((prev) => ({ ...prev, system_version: e.target.value }))}
              >
                {systemVersions.map((version) => (
                  <option key={version.id} value={version.id}>
                    {version.label ? `${version.id} - ${version.label}` : version.id}
                  </option>
                ))}
              </select>
            </label>

            <div style={{ display: "grid", gap: 12 }}>
              {manifestAgents.map(([agentKey, variant]) => {
                const versions = variant.versions || [];
                const activeVersion = promptConfig.agent_versions?.[agentKey] || variant.default_version || versions[0]?.id || "v1";
                return (
                  <div key={agentKey} style={{ border: "1px solid var(--border)", borderRadius: 12, padding: 16 }}>
                    <div style={{ marginBottom: 10 }}>
                      <strong>{agentKey}</strong>
                      <div className="muted" style={{ fontSize: 12 }}>
                        {variant.default_version ? `default ${variant.default_version}` : "default version not set"}
                      </div>
                    </div>
                    <label style={{ display: "grid", gap: 6 }}>
                      <span>Active Version</span>
                      <select
                        className="input"
                        value={activeVersion}
                        onChange={(e) => updatePromptAgentVersion(agentKey, e.target.value)}
                      >
                        {versions.map((version) => (
                          <option key={version.id} value={version.id}>
                            {version.label ? `${version.id} - ${version.label}` : version.id}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                );
              })}
            </div>

            <div style={{ display: "grid", gap: 12 }}>
              <h4 style={{ margin: 0 }}>Template Versions</h4>
              {manifestTemplates.map(([templateKey, variant]) => {
                const versions = variant.versions || [];
                const activeVersion = promptConfig.template_versions?.[templateKey] || variant.default_version || versions[0]?.id || "v1";
                return (
                  <div key={templateKey} style={{ border: "1px solid var(--border)", borderRadius: 12, padding: 16 }}>
                    <div style={{ marginBottom: 10 }}>
                      <strong>{templateKey}</strong>
                      <div className="muted" style={{ fontSize: 12 }}>
                        {variant.default_version ? `default ${variant.default_version}` : "default version not set"}
                      </div>
                    </div>
                    <label style={{ display: "grid", gap: 6 }}>
                      <span>Active Version</span>
                      <select
                        className="input"
                        value={activeVersion}
                        onChange={(e) => updatePromptTemplateVersion(templateKey, e.target.value)}
                      >
                        {versions.map((version) => (
                          <option key={version.id} value={version.id}>
                            {version.label ? `${version.id} - ${version.label}` : version.id}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                );
              })}
            </div>

            <div style={{ display: "grid", gap: 12 }}>
              <h4 style={{ margin: 0 }}>Profile Routing</h4>
              {manifestProfiles.map(([profileKey, fallbackAgent]) => (
                <div key={profileKey} style={{ display: "grid", gap: 6 }}>
                  <span>{profileKey}</span>
                  <select
                    className="input"
                    value={promptConfig.profile_map?.[profileKey] || fallbackAgent}
                    onChange={(e) => updatePromptProfileMap(profileKey, e.target.value)}
                  >
                    {manifestAgents.map(([agentKey]) => (
                      <option key={agentKey} value={agentKey}>
                        {agentKey}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="status">{promptStatus || "Loading prompt manifest..."}</div>
        )}

        {promptStatus && <div className="status" style={{ marginTop: 12 }}>{promptStatus}</div>}
      </div>

      <div className="card">
        <div className="card-header">
          <div>
            <h3>Agentic Runs</h3>
            <p>Inspect assistant orchestration runs and filter the ones needing human review.</p>
          </div>
          <div className="actions">
            <button className="button" onClick={loadRuns} disabled={runLoading}>Refresh</button>
          </div>
        </div>

        <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
          <label style={{ display: "grid", gap: 6 }}>
            <span>Review filter</span>
            <select className="input" value={runFilter} onChange={(e) => setRunFilter(e.target.value as RunStatusFilter)}>
              <option value="needs_review">Needs review</option>
              <option value="confirmed">Confirmed only</option>
              <option value="all">All runs</option>
            </select>
          </label>
          <label style={{ display: "grid", gap: 6 }}>
            <span>Status</span>
            <input className="input" value={runStatus} onChange={(e) => setRunStatus(e.target.value)} placeholder="completed, failed..." />
          </label>
          <label style={{ display: "grid", gap: 6 }}>
            <span>Agent profile</span>
            <input className="input" value={runProfile} onChange={(e) => setRunProfile(e.target.value)} placeholder="support, rfq..." />
          </label>
          <label style={{ display: "grid", gap: 6 }}>
            <span>Tool</span>
            <input className="input" value={runTool} onChange={(e) => setRunTool(e.target.value)} placeholder="memory, moderate, report..." />
          </label>
        </div>

        {runError && <div className="status" style={{ marginTop: 12 }}>{runError}</div>}

        <div style={{ marginTop: 16, display: "grid", gap: 16, gridTemplateColumns: "minmax(320px, 0.95fr) minmax(360px, 1.05fr)" }}>
          <div style={{ border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden" }}>
            <div style={{ padding: 12, borderBottom: "1px solid var(--border)" }}>
              <strong>Runs</strong>
              <div className="muted" style={{ fontSize: 12 }}>{runItems.length} items</div>
            </div>
            <div style={{ maxHeight: 520, overflow: "auto" }}>
              {runItems.map((run) => {
                const needsReview = Boolean(run.plan && (run.plan as any).needs_human_review);
                const active = selectedRunId === run.id;
                return (
                  <button
                    key={run.id}
                    onClick={() => selectRun(run.id)}
                    className="button"
                    style={{
                      display: "block",
                      width: "100%",
                      textAlign: "left",
                      borderRadius: 0,
                      borderLeft: active ? "4px solid var(--primary)" : "4px solid transparent",
                      background: active ? "rgba(255,255,255,0.04)" : "transparent",
                      padding: 14,
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                      <strong>{run.agent_profile}</strong>
                      <span className="muted">{run.status}</span>
                    </div>
                    <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>
                      {run.intent} {needsReview ? "· needs review" : ""}
                    </div>
                  </button>
                );
              })}
              {!runItems.length && !runLoading && <div style={{ padding: 16 }} className="muted">No runs found.</div>}
            </div>
          </div>

          <div style={{ border: "1px solid var(--border)", borderRadius: 12, padding: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
              <strong>Run Detail</strong>
              <div className="actions">
                <button className="button" onClick={openRunDrawer} disabled={!selectedRun}>
                  Open drawer
                </button>
                <button className="button" onClick={() => { setSelectedRun(null); setSelectedRunId(""); setShowRunDrawer(false); }}>
                  Close
                </button>
              </div>
            </div>
            {selectedRun ? (
              <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
                <div>
                  <div className="muted" style={{ fontSize: 12 }}>Run ID</div>
                  <div style={{ wordBreak: "break-all" }}>{selectedRun.run.id}</div>
                </div>
                <div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))" }}>
                  <div><div className="muted" style={{ fontSize: 12 }}>Status</div><strong>{selectedRun.run.status}</strong></div>
                  <div><div className="muted" style={{ fontSize: 12 }}>Intent</div><strong>{selectedRun.run.intent}</strong></div>
                  <div><div className="muted" style={{ fontSize: 12 }}>Profile</div><strong>{selectedRun.run.agent_profile}</strong></div>
                  <div><div className="muted" style={{ fontSize: 12 }}>Model</div><strong>{selectedRun.run.selected_model || selectedRun.run.planner_model || "n/a"}</strong></div>
                </div>
                <div>
                  <div className="muted" style={{ fontSize: 12 }}>Plan</div>
                  <pre style={{ whiteSpace: "pre-wrap", margin: 0, maxHeight: 220, overflow: "auto" }}>
                    {JSON.stringify(selectedRun.run.plan || {}, null, 2)}
                  </pre>
                </div>
                <div>
                  <div className="muted" style={{ fontSize: 12 }}>Steps</div>
                  <div style={{ display: "grid", gap: 8 }}>
                    {selectedRun.steps.map((step) => (
                      <div key={step.id} style={{ border: "1px solid var(--border)", borderRadius: 10, padding: 10 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                          <strong>{step.tool_name || step.step_type}</strong>
                          <span className="muted">{step.status}</span>
                        </div>
                        <div className="muted" style={{ fontSize: 12 }}>
                          step {step.step_index} {step.requires_confirmation ? "· confirmation required" : ""}
                        </div>
                        {step.error_message && <div style={{ color: "#b91c1c", marginTop: 6 }}>{step.error_message}</div>}
                      </div>
                    ))}
                    {!selectedRun.steps.length && <div className="muted">No steps recorded.</div>}
                  </div>
                </div>
                <div style={{ display: "grid", gap: 10 }}>
                  <div className="muted" style={{ fontSize: 12 }}>Feedback</div>
                <div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))" }}>
                    <label style={{ display: "grid", gap: 6 }}>
                      <span>Rating</span>
                      <select className="input" value={feedbackRating} onChange={(e) => setFeedbackRating(e.target.value)}>
                        <option value="5">5 - excellent</option>
                        <option value="4">4 - good</option>
                        <option value="3">3 - partial</option>
                        <option value="2">2 - weak</option>
                        <option value="1">1 - wrong</option>
                      </select>
                    </label>
                    <label style={{ display: "grid", gap: 6 }}>
                      <span>Outcome</span>
                      <input className="input" value={feedbackOutcome} onChange={(e) => setFeedbackOutcome(e.target.value)} placeholder="correct, partial, wrong" />
                    </label>
                  </div>
                  <div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))" }}>
                    <label style={{ display: "grid", gap: 6 }}>
                      <span>Correct intent</span>
                      <select className="input" value={feedbackCorrectIntent} onChange={(e) => setFeedbackCorrectIntent(e.target.value)}>
                        {commonIntents.map((intent) => (
                          <option key={intent} value={intent}>{intent}</option>
                        ))}
                      </select>
                    </label>
                    <label style={{ display: "grid", gap: 6 }}>
                      <span>Correct profile</span>
                      <select className="input" value={feedbackCorrectProfile} onChange={(e) => setFeedbackCorrectProfile(e.target.value)}>
                        {manifestAgents.map(([agentKey]) => (
                          <option key={agentKey} value={agentKey}>{agentKey}</option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <input
                      type="checkbox"
                      checked={feedbackUseInPlanner}
                      onChange={(e) => setFeedbackUseInPlanner(e.target.checked)}
                    />
                    <span>Use this feedback in the next planner prompt</span>
                  </label>
                  <label style={{ display: "grid", gap: 6 }}>
                    <span>Comment</span>
                    <textarea
                      className="input"
                      rows={3}
                      value={feedbackComment}
                      onChange={(e) => setFeedbackComment(e.target.value)}
                      placeholder="What should the planner have done differently?"
                    />
                  </label>
                  <label style={{ display: "grid", gap: 6 }}>
                    <span>Correction JSON</span>
                    <textarea
                      className="input"
                      rows={4}
                      value={feedbackCorrection}
                      onChange={(e) => setFeedbackCorrection(e.target.value)}
                      placeholder='{"correct_intent":"support","correct_agent_profile":"support"}'
                    />
                  </label>
                  <div className="actions">
                    <button className="button" onClick={submitFeedback} disabled={feedbackSaving}>
                      Save Feedback
                    </button>
                  </div>
                  <div style={{ display: "grid", gap: 8 }}>
                    {selectedRun.feedback?.map((feedback) => (
                      <div key={feedback.id} style={{ border: "1px solid var(--border)", borderRadius: 10, padding: 10 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                          <strong>{feedback.rating}/5</strong>
                          <span className="muted">{feedback.outcome || "n/a"}</span>
                        </div>
                        <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>
                          {feedback.correct_intent || "n/a"} · {feedback.correct_agent_profile || "n/a"} {feedback.use_in_planner ? "· planner" : ""}
                        </div>
                        {feedback.comment && <div style={{ marginTop: 6 }}>{feedback.comment}</div>}
                        {feedback.correction && Object.keys(feedback.correction).length > 0 && (
                          <pre style={{ margin: "8px 0 0", whiteSpace: "pre-wrap" }}>{JSON.stringify(feedback.correction, null, 2)}</pre>
                        )}
                      </div>
                    ))}
                    {!selectedRun.feedback?.length && <div className="muted">No feedback recorded.</div>}
                  </div>
                </div>
              </div>
            ) : (
              <div className="muted" style={{ marginTop: 12 }}>{runLoading ? "Loading..." : "Select a run to inspect it."}</div>
            )}
          </div>
        </div>
      </div>

      <Drawer
        open={showRunDrawer && Boolean(selectedRun)}
        title="Run Drawer"
        subtitle={selectedRun?.run.id}
        onClose={() => setShowRunDrawer(false)}
      >
        {selectedRun ? (
          <div style={{ display: "grid", gap: 14 }}>
            <div style={{ border: "1px solid var(--border)", borderRadius: 12, padding: 14 }}>
              <div className="muted" style={{ fontSize: 12 }}>Run</div>
              <pre style={{ whiteSpace: "pre-wrap", margin: 0, maxHeight: 240, overflow: "auto" }}>{JSON.stringify(selectedRun.run, null, 2)}</pre>
            </div>
            <div style={{ border: "1px solid var(--border)", borderRadius: 12, padding: 14 }}>
              <div className="muted" style={{ fontSize: 12 }}>Steps</div>
              <pre style={{ whiteSpace: "pre-wrap", margin: 0, maxHeight: 240, overflow: "auto" }}>{JSON.stringify(selectedRun.steps || [], null, 2)}</pre>
            </div>
            <div style={{ border: "1px solid var(--border)", borderRadius: 12, padding: 14 }}>
              <div className="muted" style={{ fontSize: 12 }}>Feedback</div>
              <pre style={{ whiteSpace: "pre-wrap", margin: 0, maxHeight: 240, overflow: "auto" }}>{JSON.stringify(selectedRun.feedback || [], null, 2)}</pre>
            </div>
            <div style={{ border: "1px solid var(--border)", borderRadius: 12, padding: 14 }}>
              <div className="muted" style={{ fontSize: 12 }}>Plan</div>
              <pre style={{ whiteSpace: "pre-wrap", margin: 0, maxHeight: 240, overflow: "auto" }}>{JSON.stringify(selectedRun.run.plan || {}, null, 2)}</pre>
            </div>
            <div style={{ border: "1px solid var(--border)", borderRadius: 12, padding: 14 }}>
              <div className="muted" style={{ fontSize: 12 }}>Result</div>
              <pre style={{ whiteSpace: "pre-wrap", margin: 0, maxHeight: 240, overflow: "auto" }}>{JSON.stringify(selectedRun.run.result || {}, null, 2)}</pre>
            </div>
          </div>
        ) : null}
      </Drawer>

      <div className="card">
        <div className="card-header">
          <div>
            <h3>Feedback Analytics</h3>
            <p>See how the assistant is performing and which corrections are being reinforced.</p>
          </div>
        </div>
        {feedbackSummary ? (
          <div style={{ display: "grid", gap: 16 }}>
            <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
              <div style={{ border: "1px solid var(--border)", borderRadius: 12, padding: 14 }}>
                <div className="muted" style={{ fontSize: 12 }}>Total feedback</div>
                <strong style={{ fontSize: 22 }}>{feedbackSummary.total_feedback}</strong>
              </div>
              <div style={{ border: "1px solid var(--border)", borderRadius: 12, padding: 14 }}>
                <div className="muted" style={{ fontSize: 12 }}>Average rating</div>
                <strong style={{ fontSize: 22 }}>{feedbackSummary.average_rating.toFixed(2)}</strong>
              </div>
              <div style={{ border: "1px solid var(--border)", borderRadius: 12, padding: 14 }}>
                <div className="muted" style={{ fontSize: 12 }}>Planner signals</div>
                <strong style={{ fontSize: 22 }}>{feedbackSummary.planner_feedback_count}</strong>
              </div>
              <div style={{ border: "1px solid var(--border)", borderRadius: 12, padding: 14 }}>
                <div className="muted" style={{ fontSize: 12 }}>Planner-only loaded</div>
                <strong style={{ fontSize: 22 }}>{feedbackSummary.recent_planner_signals?.length || 0}</strong>
              </div>
              <div style={{ border: "1px solid var(--border)", borderRadius: 12, padding: 14 }}>
                <div className="muted" style={{ fontSize: 12 }}>Tool events</div>
                <strong style={{ fontSize: 22 }}>{feedbackSummary.tool_event_count}</strong>
              </div>
              <div style={{ border: "1px solid var(--border)", borderRadius: 12, padding: 14 }}>
                <div className="muted" style={{ fontSize: 12 }}>Memory events</div>
                <strong style={{ fontSize: 22 }}>{feedbackSummary.memory_event_count}</strong>
              </div>
              <div style={{ border: "1px solid var(--border)", borderRadius: 12, padding: 14 }}>
                <div className="muted" style={{ fontSize: 12 }}>Moderation</div>
                <strong style={{ fontSize: 22 }}>{feedbackSummary.moderation_count}</strong>
              </div>
              <div style={{ border: "1px solid var(--border)", borderRadius: 12, padding: 14 }}>
                <div className="muted" style={{ fontSize: 12 }}>Reports</div>
                <strong style={{ fontSize: 22 }}>{feedbackSummary.report_count}</strong>
              </div>
              <div style={{ border: "1px solid var(--border)", borderRadius: 12, padding: 14 }}>
                <div className="muted" style={{ fontSize: 12 }}>User corrections</div>
                <strong style={{ fontSize: 22 }}>{feedbackSummary.message_feedback_count}</strong>
              </div>
            </div>
            <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" }}>
              <div style={{ border: "1px solid var(--border)", borderRadius: 12, padding: 14 }}>
                <strong>Top corrected intents</strong>
                <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
                  {Object.entries(feedbackSummary.correct_intent_counts || {}).slice(0, 5).map(([key, count]) => (
                    <button
                      key={key}
                      className="button"
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        width: "100%",
                        textAlign: "left",
                        borderColor: isFocusedBucket(key) ? "var(--primary)" : "var(--border)",
                        background: isFocusedBucket(key) ? "rgba(255,255,255,0.06)" : "transparent",
                      }}
                      onClick={() => focusRunsByIntent(key)}
                    >
                      <span>{key}</span><strong>{count}</strong>
                    </button>
                  ))}
                  {!Object.keys(feedbackSummary.correct_intent_counts || {}).length && <div className="muted">No intent corrections yet.</div>}
                </div>
              </div>
              <div style={{ border: "1px solid var(--border)", borderRadius: 12, padding: 14 }}>
                <strong>Top corrected profiles</strong>
                <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
                  {Object.entries(feedbackSummary.correct_profile_counts || {}).slice(0, 5).map(([key, count]) => (
                    <button
                      key={key}
                      className="button"
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        width: "100%",
                        textAlign: "left",
                        borderColor: isFocusedBucket(key) ? "var(--primary)" : "var(--border)",
                        background: isFocusedBucket(key) ? "rgba(255,255,255,0.06)" : "transparent",
                      }}
                      onClick={() => focusRunsByProfile(key)}
                    >
                      <span>{key}</span><strong>{count}</strong>
                    </button>
                  ))}
                  {!Object.keys(feedbackSummary.correct_profile_counts || {}).length && <div className="muted">No profile corrections yet.</div>}
                </div>
              </div>
              <div style={{ border: "1px solid var(--border)", borderRadius: 12, padding: 14 }}>
                <strong>Outcome mix</strong>
                <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
                  {Object.entries(feedbackSummary.outcome_counts || {}).slice(0, 5).map(([key, count]) => (
                    <div key={key} style={{ display: "flex", justifyContent: "space-between" }}>
                      <span>{key}</span><strong>{count}</strong>
                    </div>
                  ))}
                  {!Object.keys(feedbackSummary.outcome_counts || {}).length && <div className="muted">No outcomes yet.</div>}
                </div>
              </div>
            </div>
            <div style={{ border: "1px solid var(--border)", borderRadius: 12, padding: 14 }}>
              <strong>Recent planner signals</strong>
              <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
                {feedbackSummary.recent_planner_signals?.map((feedback) => (
                  <button
                    key={feedback.id}
                    className="button"
                    style={{
                      border: "1px solid var(--border)",
                      borderRadius: 10,
                      padding: 10,
                      width: "100%",
                      textAlign: "left",
                      background: isFocusedBucket(feedback.correct_agent_profile || feedback.correct_intent || "") ? "rgba(255,255,255,0.06)" : "transparent",
                      borderColor: isFocusedBucket(feedback.correct_agent_profile || feedback.correct_intent || "") ? "var(--primary)" : "var(--border)",
                    }}
                    onClick={() => focusRunsByProfile(feedback.correct_agent_profile || feedback.correct_intent || "")}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                      <strong>{feedback.correct_intent || "n/a"} / {feedback.correct_agent_profile || "n/a"}</strong>
                      <span className="muted">{feedback.rating}/5</span>
                    </div>
                    {feedback.comment && <div className="muted" style={{ marginTop: 4 }}>{feedback.comment}</div>}
                  </button>
                ))}
                {!feedbackSummary.recent_planner_signals?.length && <div className="muted">No planner signals loaded yet.</div>}
              </div>
            </div>
            <div style={{ border: "1px solid var(--border)", borderRadius: 12, padding: 14 }}>
              <strong>Recent system signals</strong>
              <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
                {feedbackSummary.recent_system_signals?.map((signal, index) => (
                  <div key={`${signal.event_type || "signal"}-${index}`} style={{ border: "1px solid var(--border)", borderRadius: 10, padding: 10 }}>
                    <button
                      className="button"
                      style={{
                        display: "block",
                        width: "100%",
                        textAlign: "left",
                        borderColor: isFocusedTool(String(signal.tool || signal.job_type || signal.event_type || "")) ? "var(--primary)" : "var(--border)",
                        background: isFocusedTool(String(signal.tool || signal.job_type || signal.event_type || "")) ? "rgba(255,255,255,0.06)" : "transparent",
                      }}
                      onClick={() => focusRunsBySystemSignal(signal)}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                        <strong>{signal.event_type || "signal"}</strong>
                        <span className="muted">{signal.created_at ? String(signal.created_at).slice(0, 19).replace("T", " ") : ""}</span>
                      </div>
                      {signal.tool && <div className="muted" style={{ marginTop: 4 }}>tool: {signal.tool}</div>}
                      {signal.job_type && <div className="muted" style={{ marginTop: 4 }}>job: {signal.job_type}</div>}
                      {signal.input && <pre style={{ margin: "8px 0 0", whiteSpace: "pre-wrap" }}>{JSON.stringify(signal.input, null, 2)}</pre>}
                    </button>
                  </div>
                ))}
                {!feedbackSummary.recent_system_signals?.length && <div className="muted">No system signals loaded yet.</div>}
              </div>
            </div>
            <div style={{ border: "1px solid var(--border)", borderRadius: 12, padding: 14 }}>
              <strong>Recent user corrections</strong>
              <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
                {feedbackSummary.recent_message_signals?.map((signal, index) => (
                  <div key={`${signal.assistant_message_id || "message"}-${index}`} style={{ border: "1px solid var(--border)", borderRadius: 10, padding: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                      <strong>{signal.correct_intent || "n/a"} / {signal.correct_agent_profile || "n/a"}</strong>
                      <span className="muted">{signal.rating}/5</span>
                    </div>
                    {signal.user_response_text && <div className="muted" style={{ marginTop: 4 }}>{signal.user_response_text}</div>}
                    {signal.comment && <div style={{ marginTop: 4 }}>{signal.comment}</div>}
                  </div>
                ))}
                {!feedbackSummary.recent_message_signals?.length && <div className="muted">No user correction signals yet.</div>}
              </div>
            </div>
          </div>
        ) : (
          <div className="status">{feedbackSummaryLoading ? "Loading feedback analytics..." : "No feedback analytics available."}</div>
        )}
      </div>

      <Drawer
        open={showSignalDrawer && Boolean(selectedSystemSignal)}
        title="Signal Detail"
        subtitle={selectedSystemSignal?.event_type || selectedSystemSignal?.tool || selectedSystemSignal?.job_type}
        onClose={() => { setShowSignalDrawer(false); setSelectedSystemSignal(null); }}
      >
        {selectedSystemSignal ? (
          <div style={{ display: "grid", gap: 10 }}>
            <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
              <div><div className="muted" style={{ fontSize: 12 }}>Event</div><strong>{String(selectedSystemSignal.event_type || "n/a")}</strong></div>
              <div><div className="muted" style={{ fontSize: 12 }}>Tool</div><strong>{String(selectedSystemSignal.tool || selectedSystemSignal.job_type || "n/a")}</strong></div>
              <div><div className="muted" style={{ fontSize: 12 }}>Created</div><strong>{selectedSystemSignal.created_at ? String(selectedSystemSignal.created_at) : "n/a"}</strong></div>
              <div><div className="muted" style={{ fontSize: 12 }}>Agent</div><strong>{String(selectedSystemSignal.agent_profile || "n/a")}</strong></div>
            </div>
            <div style={{ border: "1px solid var(--border)", borderRadius: 12, padding: 14 }}>
              <div className="muted" style={{ fontSize: 12 }}>Payload</div>
              <pre style={{ whiteSpace: "pre-wrap", margin: 0, maxHeight: 320, overflow: "auto" }}>
                {JSON.stringify(selectedSystemSignal, null, 2)}
              </pre>
            </div>
            {selectedSystemSignal.input && (
              <div style={{ border: "1px solid var(--border)", borderRadius: 12, padding: 14 }}>
                <div className="muted" style={{ fontSize: 12 }}>Input</div>
                <pre style={{ whiteSpace: "pre-wrap", margin: 0, maxHeight: 240, overflow: "auto" }}>
                  {JSON.stringify(selectedSystemSignal.input, null, 2)}
                </pre>
              </div>
            )}
            {selectedSystemSignal.result && (
              <div style={{ border: "1px solid var(--border)", borderRadius: 12, padding: 14 }}>
                <div className="muted" style={{ fontSize: 12 }}>Result</div>
                <pre style={{ whiteSpace: "pre-wrap", margin: 0, maxHeight: 240, overflow: "auto" }}>
                  {JSON.stringify(selectedSystemSignal.result, null, 2)}
                </pre>
              </div>
            )}
          </div>
        ) : null}
      </Drawer>

      <div className="card">
        <div className="card-header">
          <div>
            <h3>Prompt Diff</h3>
            <p>Compare any two versions before switching them live.</p>
          </div>
        </div>
        {promptCatalog ? (
          <div style={{ display: "grid", gap: 16 }}>
            <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
              <label style={{ display: "grid", gap: 6 }}>
                <span>Family</span>
                <select className="input" value={diffFamily} onChange={(e) => setDiffFamily(e.target.value as PromptFamily)}>
                  <option value="system">system</option>
                  <option value="agent">agent</option>
                  <option value="template">template</option>
                </select>
              </label>
              {diffFamily !== "system" ? (
                <label style={{ display: "grid", gap: 6 }}>
                  <span>Prompt</span>
                  <select className="input" value={diffKey} onChange={(e) => setDiffKey(e.target.value)}>
                    {diffEntries.map(([key]) => (
                      <option key={key} value={key}>
                        {key}
                      </option>
                    ))}
                  </select>
                </label>
              ) : (
                <div />
              )}
              <label style={{ display: "grid", gap: 6 }}>
                <span>Base version</span>
                <select className="input" value={diffBaseVersion} onChange={(e) => setDiffBaseVersion(e.target.value)}>
                  {selectedVersions.map((version) => (
                    <option key={version.id} value={version.id}>
                      {version.label ? `${version.id} - ${version.label}` : version.id}
                    </option>
                  ))}
                </select>
              </label>
              <label style={{ display: "grid", gap: 6 }}>
                <span>Compare version</span>
                <select className="input" value={diffCompareVersion} onChange={(e) => setDiffCompareVersion(e.target.value)}>
                  {selectedVersions.map((version) => (
                    <option key={version.id} value={version.id}>
                      {version.label ? `${version.id} - ${version.label}` : version.id}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))" }}>
              <div style={{ border: "1px solid var(--border)", borderRadius: 12, padding: 14 }}>
                <strong>Base</strong>
                <div className="muted" style={{ fontSize: 12, marginBottom: 8 }}>
                  {selectedVariant?.key} / {diffBaseVersion}
                </div>
                <pre style={{ whiteSpace: "pre-wrap", margin: 0, maxHeight: 360, overflow: "auto" }}>{baseContent || "No content available."}</pre>
              </div>
              <div style={{ border: "1px solid var(--border)", borderRadius: 12, padding: 14 }}>
                <strong>Compare</strong>
                <div className="muted" style={{ fontSize: 12, marginBottom: 8 }}>
                  {selectedVariant?.key} / {diffCompareVersion}
                </div>
                <pre style={{ whiteSpace: "pre-wrap", margin: 0, maxHeight: 360, overflow: "auto" }}>{compareContent || "No content available."}</pre>
              </div>
            </div>

            <div style={{ border: "1px solid var(--border)", borderRadius: 12, padding: 14 }}>
              <strong>Diff</strong>
              <div className="muted" style={{ fontSize: 12, marginBottom: 8 }}>
                Added lines are green. Removed lines are red.
              </div>
              <pre style={{ whiteSpace: "pre-wrap", margin: 0, maxHeight: 420, overflow: "auto" }}>
                {diffLines.map((line, index) => {
                  const color = line.kind === "add" ? "var(--success, #166534)" : line.kind === "remove" ? "var(--danger, #b91c1c)" : "inherit";
                  const prefix = line.kind === "add" ? "+ " : line.kind === "remove" ? "- " : "  ";
                  return (
                    <div key={`${line.kind}-${index}`} style={{ color }}>
                      {prefix}
                      {line.text || "\u00a0"}
                    </div>
                  );
                })}
              </pre>
            </div>
          </div>
        ) : (
          <div className="status">Loading prompt manifest...</div>
        )}
      </div>
    </div>
  );
};
