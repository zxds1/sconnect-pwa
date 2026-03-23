import { useEffect, useMemo, useState } from "react";
import { getOpsConfig, listOpsConfigs, setOpsConfig } from "../lib/opsConfigApi";

const OPS_KEYS = [
  { key: "profile.insights_targets", label: "Profile Insights Targets" },
  { key: "rewards.wallet_offers", label: "Rewards Wallet Offers" },
  { key: "rewards.wallet_copy", label: "Rewards Wallet Copy" },
  { key: "rewards.economics", label: "Rewards Economics" },
  { key: "rewards.scan_context", label: "Rewards Scan Context" },
  { key: "rewards.passport", label: "Rewards Passport Rules" },
  { key: "rewards.growth", label: "Rewards Seller Growth" },
  { key: "rewards.receipts", label: "Rewards Receipts" },
  { key: "rewards.milestones", label: "Rewards Milestones" },
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

type RewardsEconomicsDraft = {
  daily_earn_cap: number;
  monthly_earn_cap: number;
  streak_cap_days: number;
  reward_texture: string;
  passport_label: string;
  redeem_hint: string;
};

type RewardsReceiptsDraft = {
  currency: string;
  daily_min: number;
  daily_max: number;
  streak_bonus: number;
  streak_days: number;
};

type RewardsScanContextWindowDraft = {
  label: string;
  start: string;
  end: string;
  bonus: number;
};

type RewardsScanContextPlaceTierDraft = {
  label: string;
  max_distance_m: number;
  bonus: number;
};

type RewardsScanContextTagBonusDraft = {
  match: string;
  bonus: number;
};

type RewardsScanContextDraft = {
  timezone: string;
  default_time_bonus: number;
  default_place_bonus: number;
  time_windows: RewardsScanContextWindowDraft[];
  place_tiers: RewardsScanContextPlaceTierDraft[];
  location_tag_bonuses: RewardsScanContextTagBonusDraft[];
};

type RewardsPassportDraft = {
  label: string;
  zone_threshold: number;
  zone_bonus: number;
  reward_currency: string;
  zone_label: string;
};

type RewardsGrowthDraft = {
  scan_weight: number;
  layer_weight: number;
  context_weight: number;
  passport_weight: number;
  gps_verified_weight: number;
  repeat_purchase_weight: number;
  location_tag_weight: number;
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

const defaultRewardsEconomicsDraft = (): RewardsEconomicsDraft => ({
  daily_earn_cap: 20,
  monthly_earn_cap: 500,
  streak_cap_days: 7,
  reward_texture: "Airtime Surge",
  passport_label: "Shop Passport",
  redeem_hint: "Choose airtime, data, or M-Pesa when cashing out SC.",
});

const defaultRewardsReceiptsDraft = (): RewardsReceiptsDraft => ({
  currency: "KES",
  daily_min: 5,
  daily_max: 50,
  streak_bonus: 25,
  streak_days: 7,
});

const defaultRewardsScanContextDraft = (): RewardsScanContextDraft => ({
  timezone: "Africa/Nairobi",
  default_time_bonus: 0,
  default_place_bonus: 0,
  time_windows: [
    { label: "Morning Rush", start: "06:00", end: "09:00", bonus: 0.75 },
    { label: "Lunch Rush", start: "12:00", end: "14:00", bonus: 0.5 },
    { label: "Evening Rush", start: "17:00", end: "20:30", bonus: 0.75 },
  ],
  place_tiers: [
    { label: "On Site", max_distance_m: 15, bonus: 1.0 },
    { label: "Near Shop", max_distance_m: 50, bonus: 0.5 },
    { label: "Neighborhood", max_distance_m: 250, bonus: 0.25 },
  ],
  location_tag_bonuses: [
    { match: "eastlands", bonus: 0.5 },
    { match: "market", bonus: 0.25 },
    { match: "town", bonus: 0.25 },
  ],
});

const defaultRewardsPassportDraft = (): RewardsPassportDraft => ({
  label: "Shop Passport",
  zone_threshold: 5,
  zone_bonus: 50,
  reward_currency: "KES",
  zone_label: "Zone",
});

const defaultRewardsGrowthDraft = (): RewardsGrowthDraft => ({
  scan_weight: 1,
  layer_weight: 0.75,
  context_weight: 1,
  passport_weight: 2,
  gps_verified_weight: 0.5,
  repeat_purchase_weight: 0.5,
  location_tag_weight: 0.5,
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

const normalizeRewardsEconomicsDraft = (value: any): RewardsEconomicsDraft => {
  const fallback = defaultRewardsEconomicsDraft();
  return {
    daily_earn_cap: toNumber(value?.daily_earn_cap, fallback.daily_earn_cap),
    monthly_earn_cap: toNumber(value?.monthly_earn_cap, fallback.monthly_earn_cap),
    streak_cap_days: toNumber(value?.streak_cap_days, fallback.streak_cap_days),
    reward_texture: typeof value?.reward_texture === "string" && value.reward_texture.trim() ? value.reward_texture : fallback.reward_texture,
    passport_label: typeof value?.passport_label === "string" && value.passport_label.trim() ? value.passport_label : fallback.passport_label,
    redeem_hint: typeof value?.redeem_hint === "string" && value.redeem_hint.trim() ? value.redeem_hint : fallback.redeem_hint,
  };
};

const normalizeRewardsReceiptsDraft = (value: any): RewardsReceiptsDraft => {
  const fallback = defaultRewardsReceiptsDraft();
  return {
    currency: typeof value?.currency === "string" && value.currency.trim() ? value.currency : fallback.currency,
    daily_min: toNumber(value?.daily_min, fallback.daily_min),
    daily_max: toNumber(value?.daily_max, fallback.daily_max),
    streak_bonus: toNumber(value?.streak_bonus, fallback.streak_bonus),
    streak_days: toNumber(value?.streak_days, fallback.streak_days),
  };
};

const normalizeRewardsScanContextDraft = (value: any): RewardsScanContextDraft => {
  const fallback = defaultRewardsScanContextDraft();
  const mapWindow = (item: any): RewardsScanContextWindowDraft => ({
    label: typeof item?.label === "string" && item.label.trim() ? item.label : "Window",
    start: typeof item?.start === "string" && item.start.trim() ? item.start : "00:00",
    end: typeof item?.end === "string" && item.end.trim() ? item.end : "00:00",
    bonus: toNumber(item?.bonus, 0),
  });
  const mapTier = (item: any): RewardsScanContextPlaceTierDraft => ({
    label: typeof item?.label === "string" && item.label.trim() ? item.label : "Tier",
    max_distance_m: toNumber(item?.max_distance_m, 0),
    bonus: toNumber(item?.bonus, 0),
  });
  const mapTagBonus = (item: any): RewardsScanContextTagBonusDraft => ({
    match: typeof item?.match === "string" && item.match.trim() ? item.match : "tag",
    bonus: toNumber(item?.bonus, 0),
  });
  return {
    timezone: typeof value?.timezone === "string" && value.timezone.trim() ? value.timezone : fallback.timezone,
    default_time_bonus: toNumber(value?.default_time_bonus, fallback.default_time_bonus),
    default_place_bonus: toNumber(value?.default_place_bonus, fallback.default_place_bonus),
    time_windows: Array.isArray(value?.time_windows) && value.time_windows.length > 0 ? value.time_windows.map(mapWindow) : fallback.time_windows,
    place_tiers: Array.isArray(value?.place_tiers) && value.place_tiers.length > 0 ? value.place_tiers.map(mapTier) : fallback.place_tiers,
    location_tag_bonuses:
      Array.isArray(value?.location_tag_bonuses) && value.location_tag_bonuses.length > 0
        ? value.location_tag_bonuses.map(mapTagBonus)
        : fallback.location_tag_bonuses,
  };
};

const normalizeRewardsPassportDraft = (value: any): RewardsPassportDraft => {
  const fallback = defaultRewardsPassportDraft();
  return {
    label: typeof value?.label === "string" && value.label.trim() ? value.label : fallback.label,
    zone_threshold: toNumber(value?.zone_threshold, fallback.zone_threshold),
    zone_bonus: toNumber(value?.zone_bonus, fallback.zone_bonus),
    reward_currency: typeof value?.reward_currency === "string" && value.reward_currency.trim() ? value.reward_currency : fallback.reward_currency,
    zone_label: typeof value?.zone_label === "string" && value.zone_label.trim() ? value.zone_label : fallback.zone_label,
  };
};

const normalizeRewardsGrowthDraft = (value: any): RewardsGrowthDraft => {
  const fallback = defaultRewardsGrowthDraft();
  return {
    scan_weight: toNumber(value?.scan_weight, fallback.scan_weight),
    layer_weight: toNumber(value?.layer_weight, fallback.layer_weight),
    context_weight: toNumber(value?.context_weight, fallback.context_weight),
    passport_weight: toNumber(value?.passport_weight, fallback.passport_weight),
    gps_verified_weight: toNumber(value?.gps_verified_weight, fallback.gps_verified_weight),
    repeat_purchase_weight: toNumber(value?.repeat_purchase_weight, fallback.repeat_purchase_weight),
    location_tag_weight: toNumber(value?.location_tag_weight, fallback.location_tag_weight),
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

  const updateRewardsEconomicsDraft = (mutator: (draft: RewardsEconomicsDraft) => RewardsEconomicsDraft) => {
    setDrafts((prev) => {
      const current = normalizeRewardsEconomicsDraft(safeParseJson(prev["rewards.economics"] || "") || {});
      return {
        ...prev,
        "rewards.economics": JSON.stringify(mutator(current), null, 2),
      };
    });
  };

  const updateRewardsReceiptsDraft = (mutator: (draft: RewardsReceiptsDraft) => RewardsReceiptsDraft) => {
    setDrafts((prev) => {
      const current = normalizeRewardsReceiptsDraft(safeParseJson(prev["rewards.receipts"] || "") || {});
      return {
        ...prev,
        "rewards.receipts": JSON.stringify(mutator(current), null, 2),
      };
    });
  };

  const updateRewardsScanContextDraft = (mutator: (draft: RewardsScanContextDraft) => RewardsScanContextDraft) => {
    setDrafts((prev) => {
      const current = normalizeRewardsScanContextDraft(safeParseJson(prev["rewards.scan_context"] || "") || {});
      return {
        ...prev,
        "rewards.scan_context": JSON.stringify(mutator(current), null, 2),
      };
    });
  };

  const updateRewardsPassportDraft = (mutator: (draft: RewardsPassportDraft) => RewardsPassportDraft) => {
    setDrafts((prev) => {
      const current = normalizeRewardsPassportDraft(safeParseJson(prev["rewards.passport"] || "") || {});
      return {
        ...prev,
        "rewards.passport": JSON.stringify(mutator(current), null, 2),
      };
    });
  };

  const updateRewardsGrowthDraft = (mutator: (draft: RewardsGrowthDraft) => RewardsGrowthDraft) => {
    setDrafts((prev) => {
      const current = normalizeRewardsGrowthDraft(safeParseJson(prev["rewards.growth"] || "") || {});
      return {
        ...prev,
        "rewards.growth": JSON.stringify(mutator(current), null, 2),
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
      case "rewards.economics":
        return (
          ensure(isNumber(value?.daily_earn_cap), "daily_earn_cap must be a number.") ||
          ensure(isNumber(value?.monthly_earn_cap), "monthly_earn_cap must be a number.") ||
          ensure(isNumber(value?.streak_cap_days), "streak_cap_days must be a number.") ||
          ensure(isString(value?.reward_texture), "reward_texture is required.") ||
          ensure(isString(value?.passport_label), "passport_label is required.") ||
          ensure(isString(value?.redeem_hint), "redeem_hint is required.")
        );
      case "rewards.receipts":
        return (
          ensure(isString(value?.currency), "currency is required.") ||
          ensure(isNumber(value?.daily_min), "daily_min must be a number.") ||
          ensure(isNumber(value?.daily_max), "daily_max must be a number.") ||
          ensure(isNumber(value?.streak_bonus), "streak_bonus must be a number.") ||
          ensure(isNumber(value?.streak_days), "streak_days must be a number.")
        );
      case "rewards.scan_context":
        if (!isString(value?.timezone)) return "timezone is required.";
        if (!Array.isArray(value?.time_windows) || !Array.isArray(value?.place_tiers) || !Array.isArray(value?.location_tag_bonuses)) {
          return "time_windows, place_tiers, and location_tag_bonuses must be arrays.";
        }
        for (const window of value.time_windows) {
          if (!isString(window?.label)) return "Each time window needs a label.";
          if (!isString(window?.start)) return "Each time window needs a start time.";
          if (!isString(window?.end)) return "Each time window needs an end time.";
          if (!isNumber(window?.bonus)) return "Each time window needs a bonus.";
        }
        for (const tier of value.place_tiers) {
          if (!isString(tier?.label)) return "Each place tier needs a label.";
          if (!isNumber(tier?.max_distance_m)) return "Each place tier needs a max_distance_m number.";
          if (!isNumber(tier?.bonus)) return "Each place tier needs a bonus.";
        }
        for (const bonus of value.location_tag_bonuses) {
          if (!isString(bonus?.match)) return "Each location tag bonus needs a match value.";
          if (!isNumber(bonus?.bonus)) return "Each location tag bonus needs a bonus.";
        }
        return (
          ensure(isNumber(value?.default_time_bonus), "default_time_bonus must be a number.") ||
          ensure(isNumber(value?.default_place_bonus), "default_place_bonus must be a number.")
        );
      case "rewards.passport":
        return (
          ensure(isString(value?.label), "label is required.") ||
          ensure(isNumber(value?.zone_threshold), "zone_threshold must be a number.") ||
          ensure(isNumber(value?.zone_bonus), "zone_bonus must be a number.") ||
          ensure(isString(value?.reward_currency), "reward_currency is required.") ||
          ensure(isString(value?.zone_label), "zone_label is required.")
        );
      case "rewards.growth":
        return (
          ensure(isNumber(value?.scan_weight), "scan_weight must be a number.") ||
          ensure(isNumber(value?.layer_weight), "layer_weight must be a number.") ||
          ensure(isNumber(value?.context_weight), "context_weight must be a number.") ||
          ensure(isNumber(value?.passport_weight), "passport_weight must be a number.") ||
          ensure(isNumber(value?.gps_verified_weight), "gps_verified_weight must be a number.") ||
          ensure(isNumber(value?.repeat_purchase_weight), "repeat_purchase_weight must be a number.") ||
          ensure(isNumber(value?.location_tag_weight), "location_tag_weight must be a number.")
        );
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

  const renderRewardsEconomicsEditor = () => {
    const draft = normalizeRewardsEconomicsDraft(safeParseJson(drafts["rewards.economics"] || "") || {});
    const fieldClassName = "flex flex-col gap-1";
    const inputClassName = "input";
    const renderNumberField = (
      label: string,
      value: number,
      onChange: (next: number) => void,
      help: string
    ) => (
      <label className={fieldClassName}>
        {label}
        <input
          type="number"
          step="0.1"
          className={inputClassName}
          value={value}
          onChange={(e) => onChange(toNumber(e.target.value, value))}
        />
        <span className="text-[10px] text-slate-500 leading-4">{help}</span>
      </label>
    );

    return (
      <div className="space-y-4">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 space-y-3">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Caps</div>
            <p className="text-[11px] text-slate-500">Limit how much SC a user can earn from the rewards loop.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {renderNumberField("Daily earn cap", draft.daily_earn_cap, (next) =>
              updateRewardsEconomicsDraft((prev) => ({ ...prev, daily_earn_cap: next }))
            , "Maximum SC a user can earn from scans in one day.")}
            {renderNumberField("Monthly earn cap", draft.monthly_earn_cap, (next) =>
              updateRewardsEconomicsDraft((prev) => ({ ...prev, monthly_earn_cap: next }))
            , "Maximum SC a user can earn from scans in one month.")}
            {renderNumberField("Streak cap days", draft.streak_cap_days, (next) =>
              updateRewardsEconomicsDraft((prev) => ({ ...prev, streak_cap_days: next }))
            , "Caps the streak narrative used in the rewards journey.")}
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-3 space-y-3">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Labels</div>
            <p className="text-[11px] text-slate-500">These help shape the language shown in the rewards UI.</p>
          </div>
          <label className={fieldClassName}>
            Reward texture
            <input
              className={inputClassName}
              value={draft.reward_texture}
              onChange={(e) => updateRewardsEconomicsDraft((prev) => ({ ...prev, reward_texture: e.target.value }))}
            />
            <span className="text-[10px] text-slate-500 leading-4">Short label for the scan reward feeling, like Airtime Surge.</span>
          </label>
          <label className={fieldClassName}>
            Passport label
            <input
              className={inputClassName}
              value={draft.passport_label}
              onChange={(e) => updateRewardsEconomicsDraft((prev) => ({ ...prev, passport_label: e.target.value }))}
            />
            <span className="text-[10px] text-slate-500 leading-4">Shown on the growth / progress surface in the rewards page.</span>
          </label>
          <label className={fieldClassName}>
            Redeem hint
            <textarea
              className="textarea"
              rows={3}
              value={draft.redeem_hint}
              onChange={(e) => updateRewardsEconomicsDraft((prev) => ({ ...prev, redeem_hint: e.target.value }))}
            />
            <span className="text-[10px] text-slate-500 leading-4">Explains that SC can be redeemed as airtime, data, or M-Pesa.</span>
          </label>
        </div>
        <div className="text-[11px] text-slate-500 leading-5">
          Keep this aligned with the rewards wallet offers so the UI and the payout rails tell the same story.
        </div>
      </div>
    );
  };

  const renderRewardsReceiptsEditor = () => {
    const draft = normalizeRewardsReceiptsDraft(safeParseJson(drafts["rewards.receipts"] || "") || {});
    const fieldClassName = "flex flex-col gap-1";
    const inputClassName = "input";
    const renderNumberField = (
      label: string,
      value: number,
      onChange: (next: number) => void,
      help: string
    ) => (
      <label className={fieldClassName}>
        {label}
        <input
          type="number"
          step="0.1"
          className={inputClassName}
          value={value}
          onChange={(e) => onChange(toNumber(e.target.value, value))}
        />
        <span className="text-[10px] text-slate-500 leading-4">{help}</span>
      </label>
    );

    return (
      <div className="space-y-4">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 space-y-3">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Receipt bonuses</div>
            <p className="text-[11px] text-slate-500">Control how receipt streaks turn into reward bonuses.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {renderNumberField("Daily minimum", draft.daily_min, (next) =>
              updateRewardsReceiptsDraft((prev) => ({ ...prev, daily_min: next }))
            , "Lower bound of the daily receipt reward range.")}
            {renderNumberField("Daily maximum", draft.daily_max, (next) =>
              updateRewardsReceiptsDraft((prev) => ({ ...prev, daily_max: next }))
            , "Upper bound of the daily receipt reward range.")}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {renderNumberField("Streak bonus", draft.streak_bonus, (next) =>
              updateRewardsReceiptsDraft((prev) => ({ ...prev, streak_bonus: next }))
            , "Bonus awarded when the streak target is reached.")}
            {renderNumberField("Streak days", draft.streak_days, (next) =>
              updateRewardsReceiptsDraft((prev) => ({ ...prev, streak_days: next }))
            , "How many receipt days trigger the streak bonus.")}
          </div>
        </div>
        <label className={fieldClassName}>
          Currency
          <input
            className={inputClassName}
            value={draft.currency}
            onChange={(e) => updateRewardsReceiptsDraft((prev) => ({ ...prev, currency: e.target.value }))}
          />
          <span className="text-[10px] text-slate-500 leading-4">Displayed next to receipt bonus amounts.</span>
        </label>
      </div>
    );
  };

  const renderRewardsScanContextEditor = () => {
    const draft = normalizeRewardsScanContextDraft(safeParseJson(drafts["rewards.scan_context"] || "") || {});
    const fieldClassName = "flex flex-col gap-1";
    const inputClassName = "input";
    const renderNumberField = (
      label: string,
      value: number,
      onChange: (next: number) => void,
      help: string
    ) => (
      <label className={fieldClassName}>
        {label}
        <input
          type="number"
          step="0.05"
          className={inputClassName}
          value={value}
          onChange={(e) => onChange(toNumber(e.target.value, value))}
        />
        <span className="text-[10px] text-slate-500 leading-4">{help}</span>
      </label>
    );

    const renderTextField = (
      label: string,
      value: string,
      onChange: (next: string) => void,
      help: string
    ) => (
      <label className={fieldClassName}>
        {label}
        <input className={inputClassName} value={value} onChange={(e) => onChange(e.target.value)} />
        <span className="text-[10px] text-slate-500 leading-4">{help}</span>
      </label>
    );

    const windowPreview = draft.time_windows[0];
    const tierPreview = draft.place_tiers[0];
    const tagPreview = draft.location_tag_bonuses[0];
    const contextPreview = `A ${windowPreview.label.toLowerCase()} scan earns about ${windowPreview.bonus.toFixed(2)} SC in time bonus, ${tierPreview.label.toLowerCase()} adds about ${tierPreview.bonus.toFixed(
      2
    )} SC within ${tierPreview.max_distance_m.toFixed(0)}m, and a matching tag like "${tagPreview.match}" adds another ${tagPreview.bonus.toFixed(2)} SC.`;

    return (
      <div className="space-y-4">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 space-y-3">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Context</div>
            <p className="text-[11px] text-slate-500">Control the time-of-day and place bonuses that shape scan rewards.</p>
          </div>
          {renderTextField("Timezone", draft.timezone, (next) =>
            updateRewardsScanContextDraft((prev) => ({ ...prev, timezone: next }))
          , "Used to evaluate rush-hour windows.")}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {renderNumberField("Default time bonus", draft.default_time_bonus, (next) =>
              updateRewardsScanContextDraft((prev) => ({ ...prev, default_time_bonus: next }))
            , "Fallback time bonus when no window matches.")}
            {renderNumberField("Default place bonus", draft.default_place_bonus, (next) =>
              updateRewardsScanContextDraft((prev) => ({ ...prev, default_place_bonus: next }))
            , "Fallback place bonus when no distance tier matches.")}
          </div>
          <div className="rounded-xl bg-white/90 border border-slate-200 p-3 text-[11px] text-slate-600 leading-5">
            <div className="font-black uppercase tracking-[0.2em] text-slate-500 mb-1">Preview</div>
            <div>{contextPreview}</div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-3 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Time windows</div>
              <p className="text-[11px] text-slate-500">Add bonus periods like morning rush or lunch rush.</p>
            </div>
            <button
              type="button"
              className="btn secondary"
              onClick={() =>
                updateRewardsScanContextDraft((prev) => ({
                  ...prev,
                  time_windows: [...prev.time_windows, { label: "New window", start: "00:00", end: "00:00", bonus: 0 }],
                }))
              }
            >
              Add window
            </button>
          </div>
          <div className="space-y-3">
            {draft.time_windows.map((window, index) => (
              <div key={`window-${index}`} className="grid grid-cols-1 md:grid-cols-4 gap-3 rounded-xl border border-slate-200 p-3">
                {renderTextField("Label", window.label, (next) =>
                  updateRewardsScanContextDraft((prev) => ({
                    ...prev,
                    time_windows: prev.time_windows.map((item, itemIndex) => (itemIndex === index ? { ...item, label: next } : item)),
                  }))
                , "Displayed to ops and on result cards.")}
                {renderTextField("Start", window.start, (next) =>
                  updateRewardsScanContextDraft((prev) => ({
                    ...prev,
                    time_windows: prev.time_windows.map((item, itemIndex) => (itemIndex === index ? { ...item, start: next } : item)),
                  }))
                , "24h time like 06:00.")}
                {renderTextField("End", window.end, (next) =>
                  updateRewardsScanContextDraft((prev) => ({
                    ...prev,
                    time_windows: prev.time_windows.map((item, itemIndex) => (itemIndex === index ? { ...item, end: next } : item)),
                  }))
                , "24h time like 09:00.")}
                {renderNumberField("Bonus", window.bonus, (next) =>
                  updateRewardsScanContextDraft((prev) => ({
                    ...prev,
                    time_windows: prev.time_windows.map((item, itemIndex) => (itemIndex === index ? { ...item, bonus: next } : item)),
                  }))
                , "Extra SC added when the window matches.")}
                <div className="md:col-span-4 flex justify-end">
                  <button
                    type="button"
                    className="btn secondary"
                    onClick={() =>
                      updateRewardsScanContextDraft((prev) => ({
                        ...prev,
                        time_windows: prev.time_windows.filter((_, itemIndex) => itemIndex !== index),
                      }))
                    }
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Place tiers</div>
              <p className="text-[11px] text-slate-500">Bonuses based on how close the scan is to the seller or shop.</p>
            </div>
            <button
              type="button"
              className="btn secondary"
              onClick={() =>
                updateRewardsScanContextDraft((prev) => ({
                  ...prev,
                  place_tiers: [...prev.place_tiers, { label: "New tier", max_distance_m: 0, bonus: 0 }],
                }))
              }
            >
              Add tier
            </button>
          </div>
          <div className="space-y-3">
            {draft.place_tiers.map((tier, index) => (
              <div key={`tier-${index}`} className="grid grid-cols-1 md:grid-cols-3 gap-3 rounded-xl border border-slate-200 p-3">
                {renderTextField("Label", tier.label, (next) =>
                  updateRewardsScanContextDraft((prev) => ({
                    ...prev,
                    place_tiers: prev.place_tiers.map((item, itemIndex) => (itemIndex === index ? { ...item, label: next } : item)),
                  }))
                , "Shown as the bonus tier name.")}
                {renderNumberField("Max distance (m)", tier.max_distance_m, (next) =>
                  updateRewardsScanContextDraft((prev) => ({
                    ...prev,
                    place_tiers: prev.place_tiers.map((item, itemIndex) => (itemIndex === index ? { ...item, max_distance_m: next } : item)),
                  }))
                , "Distance threshold in meters.")}
                {renderNumberField("Bonus", tier.bonus, (next) =>
                  updateRewardsScanContextDraft((prev) => ({
                    ...prev,
                    place_tiers: prev.place_tiers.map((item, itemIndex) => (itemIndex === index ? { ...item, bonus: next } : item)),
                  }))
                , "Extra SC added when within range.")}
                <div className="md:col-span-3 flex justify-end">
                  <button
                    type="button"
                    className="btn secondary"
                    onClick={() =>
                      updateRewardsScanContextDraft((prev) => ({
                        ...prev,
                        place_tiers: prev.place_tiers.filter((_, itemIndex) => itemIndex !== index),
                      }))
                    }
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-3 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Location tags</div>
              <p className="text-[11px] text-slate-500">Extra nudges for recurring zones like Eastlands or market names.</p>
            </div>
            <button
              type="button"
              className="btn secondary"
              onClick={() =>
                updateRewardsScanContextDraft((prev) => ({
                  ...prev,
                  location_tag_bonuses: [...prev.location_tag_bonuses, { match: "new tag", bonus: 0 }],
                }))
              }
            >
              Add tag
            </button>
          </div>
          <div className="space-y-3">
            {draft.location_tag_bonuses.map((bonus, index) => (
              <div key={`tag-${index}`} className="grid grid-cols-1 md:grid-cols-2 gap-3 rounded-xl border border-slate-200 p-3">
                {renderTextField("Match", bonus.match, (next) =>
                  updateRewardsScanContextDraft((prev) => ({
                    ...prev,
                    location_tag_bonuses: prev.location_tag_bonuses.map((item, itemIndex) => (itemIndex === index ? { ...item, match: next } : item)),
                  }))
                , "Text fragment to match against the user tag.")}
                {renderNumberField("Bonus", bonus.bonus, (next) =>
                  updateRewardsScanContextDraft((prev) => ({
                    ...prev,
                    location_tag_bonuses: prev.location_tag_bonuses.map((item, itemIndex) => (itemIndex === index ? { ...item, bonus: next } : item)),
                  }))
                , "Extra SC added when the tag matches.")}
                <div className="md:col-span-2 flex justify-end">
                  <button
                    type="button"
                    className="btn secondary"
                    onClick={() =>
                      updateRewardsScanContextDraft((prev) => ({
                        ...prev,
                        location_tag_bonuses: prev.location_tag_bonuses.filter((_, itemIndex) => itemIndex !== index),
                      }))
                    }
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="text-[11px] text-slate-500 leading-5">
          These values are the behavioral layer on top of the core QR score. Keep them aligned with the product narrative you want in the field.
        </div>
      </div>
    );
  };

  const renderRewardsPassportEditor = () => {
    const draft = normalizeRewardsPassportDraft(safeParseJson(drafts["rewards.passport"] || "") || {});
    const fieldClassName = "flex flex-col gap-1";
    const inputClassName = "input";
    const renderNumberField = (
      label: string,
      value: number,
      onChange: (next: number) => void,
      help: string
    ) => (
      <label className={fieldClassName}>
        {label}
        <input
          type="number"
          step="0.1"
          className={inputClassName}
          value={value}
          onChange={(e) => onChange(toNumber(e.target.value, value))}
        />
        <span className="text-[10px] text-slate-500 leading-4">{help}</span>
      </label>
    );

    const renderTextField = (
      label: string,
      value: string,
      onChange: (next: string) => void,
      help: string
    ) => (
      <label className={fieldClassName}>
        {label}
        <input className={inputClassName} value={value} onChange={(e) => onChange(e.target.value)} />
        <span className="text-[10px] text-slate-500 leading-4">{help}</span>
      </label>
    );

    const passportPreview = `After ${draft.zone_threshold} scans, a ${draft.zone_label.toLowerCase()} unlocks about ${draft.zone_bonus.toFixed(2)} ${draft.reward_currency} through the ${draft.label} experience.`;

    return (
      <div className="space-y-4">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 space-y-3">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Passport</div>
            <p className="text-[11px] text-slate-500">Control how many scans are needed before a zone bonus is paid out.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {renderTextField("Label", draft.label, (next) =>
              updateRewardsPassportDraft((prev) => ({ ...prev, label: next }))
            , "Shown in the rewards page and admin panel.")}
            {renderTextField("Reward currency", draft.reward_currency, (next) =>
              updateRewardsPassportDraft((prev) => ({ ...prev, reward_currency: next }))
            , "Currency shown alongside passport bonuses.")}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {renderNumberField("Zone threshold", draft.zone_threshold, (next) =>
              updateRewardsPassportDraft((prev) => ({ ...prev, zone_threshold: next }))
            , "How many scans unlock each zone bonus.")}
            {renderNumberField("Zone bonus", draft.zone_bonus, (next) =>
              updateRewardsPassportDraft((prev) => ({ ...prev, zone_bonus: next }))
            , "Bonus value paid at each threshold.")}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {renderTextField("Zone label", draft.zone_label, (next) =>
              updateRewardsPassportDraft((prev) => ({ ...prev, zone_label: next }))
            , "Prefix used for passport zones, e.g. Zone or Area.")}
          </div>
          <div className="rounded-xl bg-white/90 border border-slate-200 p-3 text-[11px] text-slate-600 leading-5">
            <div className="font-black uppercase tracking-[0.2em] text-slate-500 mb-1">Preview</div>
            <div>{passportPreview}</div>
          </div>
        </div>
        <div className="text-[11px] text-slate-500 leading-5">
          This controls the repeated-visit passport mechanics that sit on top of the basic scan reward.
        </div>
      </div>
    );
  };

  const renderRewardsGrowthEditor = () => {
    const draft = normalizeRewardsGrowthDraft(safeParseJson(drafts["rewards.growth"] || "") || {});
    const fieldClassName = "flex flex-col gap-1";
    const inputClassName = "input";
    const renderNumberField = (
      label: string,
      value: number,
      onChange: (next: number) => void,
      help: string
    ) => (
      <label className={fieldClassName}>
        {label}
        <input
          type="number"
          step="0.05"
          className={inputClassName}
          value={value}
          onChange={(e) => onChange(toNumber(e.target.value, value))}
        />
        <span className="text-[10px] text-slate-500 leading-4">{help}</span>
      </label>
    );

    const growthPreview = `A fully signaled scan adds about ${(
      draft.scan_weight +
      draft.layer_weight +
      draft.context_weight +
      draft.passport_weight +
      draft.gps_verified_weight +
      draft.repeat_purchase_weight +
      draft.location_tag_weight
    ).toFixed(2)} growth points before it compounds into seller intelligence.`;

    return (
      <div className="space-y-4">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 space-y-3">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Growth score</div>
            <p className="text-[11px] text-slate-500">Weights used to compute the seller growth signal from scans.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {renderNumberField("Scan weight", draft.scan_weight, (next) =>
              updateRewardsGrowthDraft((prev) => ({ ...prev, scan_weight: next }))
            , "Base growth added by every valid scan.")}
            {renderNumberField("Layer weight", draft.layer_weight, (next) =>
              updateRewardsGrowthDraft((prev) => ({ ...prev, layer_weight: next }))
            , "Extra growth from deeper scan layers.")}
            {renderNumberField("Context weight", draft.context_weight, (next) =>
              updateRewardsGrowthDraft((prev) => ({ ...prev, context_weight: next }))
            , "Boost for time and place context signals.")}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {renderNumberField("Passport weight", draft.passport_weight, (next) =>
              updateRewardsGrowthDraft((prev) => ({ ...prev, passport_weight: next }))
            , "How much passport progress affects growth.")}
            {renderNumberField("GPS verified weight", draft.gps_verified_weight, (next) =>
              updateRewardsGrowthDraft((prev) => ({ ...prev, gps_verified_weight: next }))
            , "Growth boost for verified location checks.")}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {renderNumberField("Repeat purchase weight", draft.repeat_purchase_weight, (next) =>
              updateRewardsGrowthDraft((prev) => ({ ...prev, repeat_purchase_weight: next }))
            , "Growth boost when the user says they would buy again.")}
            {renderNumberField("Location tag weight", draft.location_tag_weight, (next) =>
              updateRewardsGrowthDraft((prev) => ({ ...prev, location_tag_weight: next }))
            , "Boost when the scan includes a useful location tag.")}
          </div>
          <div className="rounded-xl bg-white/90 border border-slate-200 p-3 text-[11px] text-slate-600 leading-5">
            <div className="font-black uppercase tracking-[0.2em] text-slate-500 mb-1">Preview</div>
            <div>{growthPreview}</div>
          </div>
        </div>
        <div className="text-[11px] text-slate-500 leading-5">
          This signal is used for seller intelligence and should grow with meaningful scan behavior, not just raw volume.
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
            ) : item.key === "rewards.economics" ? (
              <>
                {renderRewardsEconomicsEditor()}
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
            ) : item.key === "rewards.scan_context" ? (
              <>
                {renderRewardsScanContextEditor()}
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
            ) : item.key === "rewards.passport" ? (
              <>
                {renderRewardsPassportEditor()}
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
            ) : item.key === "rewards.growth" ? (
              <>
                {renderRewardsGrowthEditor()}
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
            ) : item.key === "rewards.receipts" ? (
              <>
                {renderRewardsReceiptsEditor()}
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
            ) : item.key === "rewards.milestones" ? (
              <textarea
                className="textarea"
                rows={8}
                placeholder="{}"
                value={drafts[item.key] ?? ""}
                onChange={(e) => setDrafts((prev) => ({ ...prev, [item.key]: e.target.value }))}
              />
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
