import { useEffect, useState } from "react";
import { getOpsConfig, setOpsConfig } from "../lib/opsConfigApi";

type ModelOption = { id: string; label?: string };

type ModelProvider = { id: string; label?: string; models: ModelOption[] };

type ModelConfig = {
  enabled: boolean;
  allow_user_override: boolean;
  default_provider: string;
  default_model: string;
  providers: ModelProvider[];
};

const emptyConfig: ModelConfig = {
  enabled: true,
  allow_user_override: true,
  default_provider: "",
  default_model: "",
  providers: [],
};

const normalizeProvider = (provider: ModelProvider): ModelProvider => ({
  ...provider,
  id: provider.id.trim(),
  label: provider.label?.trim() || undefined,
  models: provider.models.map((model) => ({
    id: model.id.trim(),
    label: model.label?.trim() || undefined,
  })).filter((model) => model.id),
});

export const AssistantModels = () => {
  const [config, setConfig] = useState<ModelConfig>(emptyConfig);
  const [status, setStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const loadConfig = async () => {
    setStatus(null);
    try {
      const resp = await getOpsConfig("assistant.model_options");
      const value = resp?.value || {};
      setConfig({
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

  useEffect(() => {
    loadConfig();
  }, []);

  const updateProvider = (index: number, patch: Partial<ModelProvider>) => {
    setConfig((prev) => {
      const next = [...prev.providers];
      next[index] = { ...next[index], ...patch };
      return { ...prev, providers: next };
    });
  };

  const updateModel = (providerIndex: number, modelIndex: number, patch: Partial<ModelOption>) => {
    setConfig((prev) => {
      const next = [...prev.providers];
      const provider = next[providerIndex];
      const models = [...provider.models];
      models[modelIndex] = { ...models[modelIndex], ...patch };
      next[providerIndex] = { ...provider, models };
      return { ...prev, providers: next };
    });
  };

  const addProvider = () => {
    setConfig((prev) => ({
      ...prev,
      providers: [...prev.providers, { id: "", label: "", models: [{ id: "", label: "" }] }],
    }));
  };

  const removeProvider = (index: number) => {
    setConfig((prev) => ({
      ...prev,
      providers: prev.providers.filter((_, i) => i !== index),
    }));
  };

  const addModel = (providerIndex: number) => {
    setConfig((prev) => {
      const next = [...prev.providers];
      const provider = next[providerIndex];
      next[providerIndex] = { ...provider, models: [...provider.models, { id: "", label: "" }] };
      return { ...prev, providers: next };
    });
  };

  const removeModel = (providerIndex: number, modelIndex: number) => {
    setConfig((prev) => {
      const next = [...prev.providers];
      const provider = next[providerIndex];
      next[providerIndex] = { ...provider, models: provider.models.filter((_, i) => i !== modelIndex) };
      return { ...prev, providers: next };
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setStatus(null);
    try {
      const normalizedProviders = config.providers.map(normalizeProvider).filter((p) => p.id && p.models.length > 0);
      if (!config.default_provider.trim()) throw new Error("Default provider is required.");
      if (!config.default_model.trim()) throw new Error("Default model is required.");
      if (normalizedProviders.length === 0) throw new Error("At least one provider with models is required.");
      await setOpsConfig("assistant.model_options", {
        enabled: config.enabled,
        allow_user_override: config.allow_user_override,
        default_provider: config.default_provider.trim(),
        default_model: config.default_model.trim(),
        providers: normalizedProviders,
      });
      setStatus("Saved.");
    } catch (err: any) {
      setStatus(err?.message || "Unable to save.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2>Assistant Models</h2>
          <p>Control available providers and models for user preferences.</p>
        </div>
        <div className="actions">
          <button className="button" onClick={handleSave} disabled={saving}>Save</button>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div>
            <h3>Configuration</h3>
            <p>Defaults are used when a user has not selected preferences.</p>
          </div>
        </div>
        <div style={{ display: "grid", gap: 12 }}>
          <label>
            <input
              type="checkbox"
              checked={config.enabled}
              onChange={(e) => setConfig((prev) => ({ ...prev, enabled: e.target.checked }))}
            />
            <span style={{ marginLeft: 8 }}>Assistant model selection enabled</span>
          </label>
          <label>
            <input
              type="checkbox"
              checked={config.allow_user_override}
              onChange={(e) => setConfig((prev) => ({ ...prev, allow_user_override: e.target.checked }))}
            />
            <span style={{ marginLeft: 8 }}>Allow user preference override</span>
          </label>
          <div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
            <input
              className="input"
              placeholder="Default provider id"
              value={config.default_provider}
              onChange={(e) => setConfig((prev) => ({ ...prev, default_provider: e.target.value }))}
            />
            <input
              className="input"
              placeholder="Default model id"
              value={config.default_model}
              onChange={(e) => setConfig((prev) => ({ ...prev, default_model: e.target.value }))}
            />
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div>
            <h3>Providers</h3>
            <p>Add providers and the models users can select.</p>
          </div>
          <div className="actions">
            <button className="button" onClick={addProvider}>Add Provider</button>
          </div>
        </div>

        <div style={{ display: "grid", gap: 16 }}>
          {config.providers.map((provider, index) => (
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
        </div>
      </div>

      {status && <div className="card">{status}</div>}
    </div>
  );
};
