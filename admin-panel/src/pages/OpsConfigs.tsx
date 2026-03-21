import { useEffect, useMemo, useState } from "react";
import { getOpsConfig, listOpsConfigs, setOpsConfig } from "../lib/opsConfigApi";

const OPS_KEYS = [
  { key: "profile.insights_targets", label: "Profile Insights Targets" },
  { key: "rewards.wallet_offers", label: "Rewards Wallet Offers" },
  { key: "rewards.wallet_copy", label: "Rewards Wallet Copy" },
  { key: "rewards.referrals", label: "Rewards Referrals" },
  { key: "pricing.anomaly_warning", label: "Pricing Anomaly Warning" },
  { key: "partnerships.brand_chat", label: "Partnerships Brand Chat" },
  { key: "content.onboarding", label: "Onboarding Content" },
  { key: "assistant.prompt_options", label: "Assistant Prompt Options" },
  { key: "assistant.agentic_options", label: "Assistant Agentic Options" },
];

export const OpsConfigs = () => {
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<Record<string, string | null>>({ __global: null });
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [query, setQuery] = useState("");
  const [customKey, setCustomKey] = useState("");
  const [keys, setKeys] = useState(OPS_KEYS);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return keys;
    return keys.filter((item) => item.key.toLowerCase().includes(q) || item.label.toLowerCase().includes(q));
  }, [query, keys]);

  const loadAll = async () => {
    try {
      const resp = await listOpsConfigs();
      const fromServer = (resp.configs || []).map((item) => ({
        key: item.config_key,
        label: item.config_key,
      }));
      const mergedMap = new Map<string, { key: string; label: string }>();
      [...OPS_KEYS, ...fromServer].forEach((item) => {
        if (!item.key) return;
        if (!mergedMap.has(item.key)) mergedMap.set(item.key, item);
      });
      const merged = Array.from(mergedMap.values()).sort((a, b) => a.key.localeCompare(b.key));
      setKeys(merged);
      (resp.configs || []).forEach((cfg) => {
        setDrafts((prev) => ({
          ...prev,
          [cfg.config_key]: JSON.stringify(cfg.value ?? {}, null, 2),
        }));
      });
    } catch (err: any) {
      setKeys(OPS_KEYS);
      setStatus((prev) => ({ ...prev, __global: err?.message || "Unable to load configs." }));
    }
  };

  useEffect(() => {
    let active = true;
    loadAll().finally(() => {
      if (!active) return;
    });
    return () => {
      active = false;
    };
  }, []);

  const parseDraft = (key: string) => {
    const raw = drafts[key]?.trim() || "";
    if (!raw) throw new Error("Config cannot be empty.");
    return JSON.parse(raw);
  };

  const validateDraft = (key: string, value: any): string | null => {
    const isNumber = (val: any) => Number.isFinite(Number(val));
    const isString = (val: any) => typeof val === "string" && val.trim().length > 0;
    const ensure = (ok: boolean, msg: string) => (ok ? null : msg);

    switch (key) {
      case "profile.insights_targets":
        return (
          ensure(isNumber(value?.reach_target), "reach_target must be a number.") ||
          ensure(isNumber(value?.engagement_target), "engagement_target must be a number.") ||
          ensure(isNumber(value?.rating_target), "rating_target must be a number.") ||
          ensure(isNumber(value?.active_items_target), "active_items_target must be a number.")
        );
      case "rewards.wallet_offers":
        if (!Array.isArray(value)) return "wallet_offers must be an array.";
        if (value.length === 0) return "wallet_offers cannot be empty.";
        for (const item of value) {
          if (!isString(item?.label)) return "Each offer needs a label.";
          if (!isNumber(item?.cost) || Number(item.cost) <= 0) return "Each offer needs a positive cost.";
        }
        return null;
      case "rewards.wallet_copy":
        return ensure(isString(value?.wallet_hint), "wallet_hint is required.");
      case "rewards.referrals":
        return (
          ensure(isString(value?.currency), "currency is required.") ||
          ensure(isNumber(value?.shop), "shop must be a number.") ||
          ensure(isNumber(value?.supplier), "supplier must be a number.") ||
          ensure(isNumber(value?.next_bonus_invites), "next_bonus_invites must be a number.") ||
          ensure(isNumber(value?.next_bonus_amount), "next_bonus_amount must be a number.") ||
          ensure(isNumber(value?.pair_bonus_amount), "pair_bonus_amount must be a number.")
        );
      case "pricing.anomaly_warning":
        return (
          ensure(isNumber(value?.threshold_pct), "threshold_pct must be a number.") ||
          ensure(Number(value?.threshold_pct) >= 0 && Number(value?.threshold_pct) <= 100, "threshold_pct must be 0-100.") ||
          ensure(isString(value?.message), "message is required.")
        );
      case "partnerships.brand_chat":
        return (
          ensure(typeof value?.enabled === "boolean", "enabled must be true/false.") ||
          ensure(isString(value?.title), "title is required.") ||
          ensure(isString(value?.subtitle), "subtitle is required.") ||
          ensure(isString(value?.description), "description is required.") ||
          ensure(isString(value?.cta_label), "cta_label is required.")
        );
      case "content.onboarding":
        if (!Array.isArray(value?.slides)) return "slides must be an array.";
        if (value.slides.length === 0) return "slides cannot be empty.";
        for (const slide of value.slides) {
          if (!isString(slide?.type)) return "Each slide needs a type.";
          if (!isString(slide?.title)) return "Each slide needs a title.";
          if (!isString(slide?.subtitle)) return "Each slide needs a subtitle.";
          if (!isString(slide?.tooltip)) return "Each slide needs a tooltip.";
          if (!isString(slide?.preview)) return "Each slide needs a preview URL.";
        }
        return null;
      case "assistant.model_options":
        if (typeof value?.enabled !== "boolean") return "enabled must be true/false.";
        if (typeof value?.allow_user_override !== "boolean") return "allow_user_override must be true/false.";
        if (!isString(value?.default_provider)) return "default_provider is required.";
        if (!isString(value?.default_model)) return "default_model is required.";
        if (!Array.isArray(value?.providers) || value.providers.length === 0) return "providers must be a non-empty array.";
        for (const provider of value.providers) {
          if (!isString(provider?.id)) return "Each provider needs an id.";
          if (!Array.isArray(provider?.models) || provider.models.length === 0) return "Each provider needs models.";
          for (const model of provider.models) {
            if (!isString(model?.id)) return "Each model needs an id.";
          }
        }
        return null;
      case "assistant.prompt_options":
        if (typeof value?.enabled !== "boolean") return "enabled must be true/false.";
        if (!isString(value?.system_version)) return "system_version is required.";
        if (typeof value?.agent_versions !== "object" || value?.agent_versions === null) return "agent_versions must be an object.";
        if (typeof value?.template_versions !== "object" || value?.template_versions === null) return "template_versions must be an object.";
        if (typeof value?.profile_map !== "object" || value?.profile_map === null) return "profile_map must be an object.";
        return null;
      case "assistant.agentic_options":
        if (typeof value?.enabled !== "boolean") return "enabled must be true/false.";
        if (typeof value?.confirm_side_effects !== "boolean") return "confirm_side_effects must be true/false.";
        if (typeof value?.allow_autonomous_reads !== "boolean") return "allow_autonomous_reads must be true/false.";
        if (typeof value?.intent_profiles !== "object" || value?.intent_profiles === null) return "intent_profiles must be an object.";
        if (typeof value?.confirmable_tool_actions !== "object" || value?.confirmable_tool_actions === null) return "confirmable_tool_actions must be an object.";
        if (typeof value?.read_only_tool_actions !== "object" || value?.read_only_tool_actions === null) return "read_only_tool_actions must be an object.";
        return null;
      case "route_multipliers":
        return (
          ensure(typeof value === "object" && value !== null, "route_multipliers must be an object.") ||
          ensure(typeof value?.profile === "object", "profile is required.") ||
          ensure(typeof value?.city === "object", "city is required.") ||
          ensure(typeof value?.roadClass === "object", "roadClass is required.")
        );
      default:
        return null;
    }
  };

  const handleLoad = async (key: string) => {
    setStatus((prev) => ({ ...prev, [key]: "Loading..." }));
    try {
      const resp = await getOpsConfig(key);
      setDrafts((prev) => ({ ...prev, [key]: JSON.stringify(resp?.value ?? {}, null, 2) }));
      setStatus((prev) => ({ ...prev, [key]: "Loaded." }));
    } catch (err: any) {
      setStatus((prev) => ({ ...prev, [key]: err?.message || "Unable to load config." }));
    }
  };

  const handlePublish = async (key: string) => {
    setSaving((prev) => ({ ...prev, [key]: true }));
    setStatus((prev) => ({ ...prev, [key]: null }));
    try {
      const parsed = parseDraft(key);
      const validationError = validateDraft(key, parsed);
      if (validationError) {
        setStatus((prev) => ({ ...prev, [key]: validationError }));
        return;
      }
      await setOpsConfig(key, parsed);
      setStatus((prev) => ({ ...prev, [key]: "Published." }));
      await loadAll();
    } catch (err: any) {
      setStatus((prev) => ({ ...prev, [key]: err?.message || "Unable to publish config." }));
    } finally {
      setSaving((prev) => ({ ...prev, [key]: false }));
    }
  };

  const handleAddKey = () => {
    const nextKey = customKey.trim();
    if (!nextKey) return;
    const exists = keys.some((item) => item.key === nextKey);
    if (!exists) {
      setKeys((prev) => [...prev, { key: nextKey, label: nextKey }].sort((a, b) => a.key.localeCompare(b.key)));
    }
    setDrafts((prev) => ({ ...prev, [nextKey]: prev[nextKey] ?? "{}" }));
    setCustomKey("");
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2>Ops Configs</h2>
          <p>Manage live configuration values used across the platform.</p>
        </div>
        <div className="actions">
          <input
            className="input"
            placeholder="Search configs..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <input
            className="input"
            placeholder="Add config key"
            value={customKey}
            onChange={(e) => setCustomKey(e.target.value)}
          />
          <button className="btn secondary" onClick={handleAddKey}>
            Add
          </button>
          <button className="btn secondary" onClick={loadAll}>
            Refresh
          </button>
        </div>
      </div>
      {status.__global && <div className="status">{status.__global}</div>}

      <div className="card-grid">
        {filtered.map((item) => (
          <div key={item.key} className="card">
            <div className="card-header">
              <div>
                <h3>{item.label}</h3>
                <p className="muted">{item.key}</p>
              </div>
              <div className="actions">
                <button className="btn secondary" onClick={() => handleLoad(item.key)}>
                  Load
                </button>
                <button
                  className="btn primary"
                  onClick={() => handlePublish(item.key)}
                  disabled={Boolean(saving[item.key])}
                >
                  {saving[item.key] ? "Publishing..." : "Publish"}
                </button>
              </div>
            </div>
            <textarea
              className="textarea"
              rows={8}
              placeholder="{}"
              value={drafts[item.key] ?? ""}
              onChange={(e) => setDrafts((prev) => ({ ...prev, [item.key]: e.target.value }))}
            />
            {status[item.key] && <div className="status">{status[item.key]}</div>}
          </div>
        ))}
      </div>
    </div>
  );
};
