import { useEffect, useMemo, useState } from "react";
import { getOpsConfig, listOpsConfigs, setOpsConfig } from "../lib/opsConfigApi";

const OPS_KEYS = [
  { key: "profile.insights_targets", label: "Profile Insights Targets" },
  { key: "rewards.wallet_offers", label: "Rewards Wallet Offers" },
  { key: "rewards.wallet_copy", label: "Rewards Wallet Copy" },
  { key: "rewards.referrals", label: "Rewards Referrals" },
  { key: "rewards.scoring", label: "Rewards QR Scoring" },
  { key: "pricing.anomaly_warning", label: "Pricing Anomaly Warning" },
  { key: "partnerships.brand_chat", label: "Partnerships Brand Chat" },
  { key: "content.onboarding", label: "Onboarding Content" },
  { key: "assistant.prompt_options", label: "Assistant Prompt Options" },
  { key: "assistant.agentic_options", label: "Assistant Agentic Options" },
];

type RewardsScoringDraft = {
  base: number;
  cap: number;
  stock_status: {
    full: number;
    half: number;
    empty: number;
  };
  repeat_purchase_yes: number;
  cleanliness: {
    per_point: number;
    max: number;
  };
  gps_verified: number;
  seller_present: number;
  product_present: number;
  quantity: {
    per_extra: number;
    max: number;
  };
  price_present: number;
};

const defaultRewardsScoringDraft = (): RewardsScoringDraft => ({
  base: 1.5,
  cap: 6,
  stock_status: {
    full: 1.25,
    half: 0.75,
    empty: 0.25,
  },
  repeat_purchase_yes: 1,
  cleanliness: {
    per_point: 0.2,
    max: 1,
  },
  gps_verified: 1.5,
  seller_present: 0.25,
  product_present: 0.25,
  quantity: {
    per_extra: 0.1,
    max: 0.5,
  },
  price_present: 0.25,
});

const toNumber = (value: any, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const normalizeRewardsScoringDraft = (value: any): RewardsScoringDraft => {
  const fallback = defaultRewardsScoringDraft();
  return {
    base: toNumber(value?.base, fallback.base),
    cap: toNumber(value?.cap, fallback.cap),
    stock_status: {
      full: toNumber(value?.stock_status?.full, fallback.stock_status.full),
      half: toNumber(value?.stock_status?.half, fallback.stock_status.half),
      empty: toNumber(value?.stock_status?.empty, fallback.stock_status.empty),
    },
    repeat_purchase_yes: toNumber(value?.repeat_purchase_yes, fallback.repeat_purchase_yes),
    cleanliness: {
      per_point: toNumber(value?.cleanliness?.per_point, fallback.cleanliness.per_point),
      max: toNumber(value?.cleanliness?.max, fallback.cleanliness.max),
    },
    gps_verified: toNumber(value?.gps_verified, fallback.gps_verified),
    seller_present: toNumber(value?.seller_present, fallback.seller_present),
    product_present: toNumber(value?.product_present, fallback.product_present),
    quantity: {
      per_extra: toNumber(value?.quantity?.per_extra, fallback.quantity.per_extra),
      max: toNumber(value?.quantity?.max, fallback.quantity.max),
    },
    price_present: toNumber(value?.price_present, fallback.price_present),
  };
};

const safeParseJson = (raw: string) => {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

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

  const updateRewardsScoringDraft = (mutator: (draft: RewardsScoringDraft) => RewardsScoringDraft) => {
    setDrafts((prev) => {
      const current = normalizeRewardsScoringDraft(safeParseJson(prev["rewards.scoring"] || "") || {});
      return {
        ...prev,
        "rewards.scoring": JSON.stringify(mutator(current), null, 2),
      };
    });
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
      case "rewards.scoring":
        return (
          ensure(isNumber(value?.base), "base must be a number.") ||
          ensure(isNumber(value?.cap), "cap must be a number.") ||
          ensure(typeof value?.stock_status === "object" && value?.stock_status !== null, "stock_status is required.") ||
          ensure(isNumber(value?.stock_status?.full), "stock_status.full must be a number.") ||
          ensure(isNumber(value?.stock_status?.half), "stock_status.half must be a number.") ||
          ensure(isNumber(value?.stock_status?.empty), "stock_status.empty must be a number.") ||
          ensure(isNumber(value?.repeat_purchase_yes), "repeat_purchase_yes must be a number.") ||
          ensure(typeof value?.cleanliness === "object" && value?.cleanliness !== null, "cleanliness is required.") ||
          ensure(isNumber(value?.cleanliness?.per_point), "cleanliness.per_point must be a number.") ||
          ensure(isNumber(value?.cleanliness?.max), "cleanliness.max must be a number.") ||
          ensure(isNumber(value?.gps_verified), "gps_verified must be a number.") ||
          ensure(isNumber(value?.seller_present), "seller_present must be a number.") ||
          ensure(isNumber(value?.product_present), "product_present must be a number.") ||
          ensure(typeof value?.quantity === "object" && value?.quantity !== null, "quantity is required.") ||
          ensure(isNumber(value?.quantity?.per_extra), "quantity.per_extra must be a number.") ||
          ensure(isNumber(value?.quantity?.max), "quantity.max must be a number.") ||
          ensure(isNumber(value?.price_present), "price_present must be a number.")
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

  const renderRewardsScoringEditor = () => {
    const draft = normalizeRewardsScoringDraft(safeParseJson(drafts["rewards.scoring"] || "") || {});
    const fieldClassName = "flex flex-col gap-1";
    const inputClassName = "input";
    const renderNumberField = (
      label: string,
      value: number,
      onChange: (next: number) => void,
      help: string,
      step = "0.05"
    ) => (
      <label className={fieldClassName}>
        {label}
        <input
          type="number"
          step={step}
          className={inputClassName}
          value={value}
          onChange={(e) => onChange(toNumber(e.target.value, value))}
        />
        <span className="text-[10px] text-slate-500 leading-4">{help}</span>
      </label>
    );

    const exampleRaw =
      draft.base +
      draft.stock_status.full +
      draft.repeat_purchase_yes +
      draft.cleanliness.max +
      draft.gps_verified +
      draft.seller_present +
      draft.product_present +
      draft.quantity.max +
      draft.price_present;
    const exampleFinal = Math.min(exampleRaw, draft.cap);
    const previewSentence = `Example: a fully stocked, repeat-yes, GPS-verified scan with seller, product, price, cleanliness, and quantity signals would earn about ${exampleFinal.toFixed(2)} stars${
      exampleRaw > draft.cap ? ` before the ${draft.cap.toFixed(2)} cap` : ""
    }.`;

    return (
      <div className="space-y-4">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 space-y-3">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Core</div>
            <p className="text-[11px] text-slate-500">Set the baseline reward and the maximum stars a single scan can earn.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {renderNumberField("Base stars", draft.base, (next) =>
              updateRewardsScoringDraft((prev) => ({ ...prev, base: next }))
            , "Starting stars awarded for any valid scan.", "0.1")}
            {renderNumberField("Maximum stars", draft.cap, (next) =>
              updateRewardsScoringDraft((prev) => ({ ...prev, cap: next }))
            , "Hard cap so one scan cannot earn too much.", "0.1")}
          </div>
          <div className="rounded-xl bg-white/90 border border-slate-200 p-3 text-[11px] text-slate-600 leading-5">
            <div className="font-black uppercase tracking-[0.2em] text-slate-500 mb-1">Formula preview</div>
            <div>{previewSentence}</div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-3 space-y-3">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Behavior signals</div>
            <p className="text-[11px] text-slate-500">These reward the customer response and the scan context.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {renderNumberField("Stock: full", draft.stock_status.full, (next) =>
              updateRewardsScoringDraft((prev) => ({
                ...prev,
                stock_status: { ...prev.stock_status, full: next },
              }))
            , "Use when the shelf was fully stocked.")}
            {renderNumberField("Stock: half", draft.stock_status.half, (next) =>
              updateRewardsScoringDraft((prev) => ({
                ...prev,
                stock_status: { ...prev.stock_status, half: next },
              }))
            , "Use when stock was present but reduced.")}
            {renderNumberField("Stock: empty", draft.stock_status.empty, (next) =>
              updateRewardsScoringDraft((prev) => ({
                ...prev,
                stock_status: { ...prev.stock_status, empty: next },
              }))
            , "Use when the product was out of stock.")}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {renderNumberField("Repeat purchase yes", draft.repeat_purchase_yes, (next) =>
              updateRewardsScoringDraft((prev) => ({ ...prev, repeat_purchase_yes: next }))
            , "Adds stars when the shopper says they would buy again.")}
            {renderNumberField("GPS verified", draft.gps_verified, (next) =>
              updateRewardsScoringDraft((prev) => ({ ...prev, gps_verified: next }))
            , "Rewards scans that pass a location check.")}
            {renderNumberField("Price captured", draft.price_present, (next) =>
              updateRewardsScoringDraft((prev) => ({ ...prev, price_present: next }))
            , "Small boost when a price was recorded.")}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 space-y-3">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Signal quality</div>
            <p className="text-[11px] text-slate-500">These shape the score based on how complete and trustworthy the scan is.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {renderNumberField("Cleanliness per point", draft.cleanliness.per_point, (next) =>
              updateRewardsScoringDraft((prev) => ({
                ...prev,
                cleanliness: { ...prev.cleanliness, per_point: next },
              }))
            , "Each cleanliness point contributes this much, before the max.")}
            {renderNumberField("Cleanliness max", draft.cleanliness.max, (next) =>
              updateRewardsScoringDraft((prev) => ({
                ...prev,
                cleanliness: { ...prev.cleanliness, max: next },
              }))
            , "Caps the total cleanliness bonus.")}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {renderNumberField("Seller present", draft.seller_present, (next) =>
              updateRewardsScoringDraft((prev) => ({ ...prev, seller_present: next }))
            , "Adds a small amount when seller context is included.")}
            {renderNumberField("Product present", draft.product_present, (next) =>
              updateRewardsScoringDraft((prev) => ({ ...prev, product_present: next }))
            , "Adds a small amount when the product name is known.")}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {renderNumberField("Quantity per extra item", draft.quantity.per_extra, (next) =>
              updateRewardsScoringDraft((prev) => ({
                ...prev,
                quantity: { ...prev.quantity, per_extra: next },
              }))
            , "Each item above the first adds this amount.")}
            {renderNumberField("Quantity max", draft.quantity.max, (next) =>
              updateRewardsScoringDraft((prev) => ({
                ...prev,
                quantity: { ...prev.quantity, max: next },
              }))
            , "Caps the quantity bonus to keep it predictable.")}
          </div>
        </div>

        <div className="text-[11px] text-slate-500 leading-5">
          Current defaults are grouped this way: core reward, customer behavior, and signal quality. You can still open the raw JSON below if you need to paste a full config.
        </div>
      </div>
    );
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
            {item.key === "rewards.scoring" ? (
              <>
                {renderRewardsScoringEditor()}
                <details className="mt-3">
                  <summary className="cursor-pointer text-xs font-bold text-slate-500">View raw JSON</summary>
                  <textarea
                    className="textarea mt-2"
                    rows={8}
                    placeholder="{}"
                    value={drafts[item.key] ?? ""}
                    onChange={(e) => setDrafts((prev) => ({ ...prev, [item.key]: e.target.value }))}
                  />
                </details>
              </>
            ) : (
              <textarea
                className="textarea"
                rows={8}
                placeholder="{}"
                value={drafts[item.key] ?? ""}
                onChange={(e) => setDrafts((prev) => ({ ...prev, [item.key]: e.target.value }))}
              />
            )}
            {status[item.key] && <div className="status">{status[item.key]}</div>}
          </div>
        ))}
      </div>
    </div>
  );
};
