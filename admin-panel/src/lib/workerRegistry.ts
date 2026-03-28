export type WorkerFamily = {
  key: string;
  label: string;
  queues: string[];
  description: string;
};

export const workerFamilies: WorkerFamily[] = [
  { key: "assistant", label: "Assistant", queues: ["high", "medium"], description: "OCR, ASR, and vision jobs." },
  { key: "analytics", label: "Analytics", queues: ["analytics:realtime_funnel", "analytics:kpi_hourly", "analytics:anomalies", "analytics:exports", "analytics:dlq"], description: "Funnel rollups, anomalies, and exports." },
  { key: "canonical", label: "Canonical", queues: ["high"], description: "Entity matching and canonical resolution." },
  { key: "cart", label: "Cart", queues: ["medium", "low"], description: "Cart recovery and order follow-ups." },
  { key: "catalog", label: "Catalog", queues: ["critical", "high", "medium", "recommendations:generate"], description: "Media scans, bulk imports, inventory, and recommendations." },
  { key: "comms", label: "Comms", queues: ["high", "medium", "low"], description: "Social posts, SMS, WhatsApp, email, and broadcast batches." },
  { key: "feed", label: "Feed", queues: ["critical", "high", "medium", "low"], description: "Media moderation, engagement rollups, and trending refreshes." },
  { key: "governance", label: "Governance", queues: ["critical", "high", "low"], description: "Exports, deletions, and retention jobs." },
  { key: "groupbuy", label: "Group Buy", queues: ["groupbuy:threshold", "groupbuy:tiers", "groupbuy:fulfill", "groupbuy:notifications", "groupbuy:dlq"], description: "Threshold checks, inventory sync, escrow release, and fulfillment." },
  { key: "growth", label: "Growth", queues: ["growth:sokoscore", "growth:projections", "growth:kpi_rollups"], description: "SokoScore, projections, and KPI rollups." },
  { key: "integrations", label: "Integrations", queues: ["integration:webhook", "integration:sync", "integration:validate", "integration:health", "integration:dlq"], description: "OAuth validation, sync, health checks, and DLQ." },
  { key: "marketing", label: "Marketing", queues: ["marketing:kpi_rollup", "marketing:hotspots", "marketing:stock_alerts", "marketing:broadcasts"], description: "Campaign KPIs, hotspots, stock alerts, and broadcasts." },
  { key: "notifications", label: "Notifications", queues: ["notification:critical", "notification:whatsapp", "notification:sms", "notification:email"], description: "Multi-channel delivery workers." },
  { key: "ops", label: "Ops", queues: ["critical", "high", "medium", "low"], description: "SLA updates, experiment logs, rollups, and incident notifications." },
  { key: "price", label: "Price", queues: ["high", "medium", "low"], description: "Benchmark recompute, alerts, and volatility analysis." },
  { key: "profile", label: "Profile", queues: ["high", "medium"], description: "Profile media processing and rollups." },
  { key: "reconciliation", label: "Reconciliation", queues: ["dedup:realtime", "dedup:batch", "dedup:replay", "dedup:quality_metrics", "dedup:dlq"], description: "Replay, dedup, and quality metrics." },
  { key: "rewards", label: "Rewards", queues: ["critical", "high", "medium", "low"], description: "Receipt scan, OCR, verification, and reward issuance." },
  { key: "search", label: "Search", queues: ["high", "medium"], description: "OCR, vision, media jobs, reindex, and analytics hooks." },
  { key: "security", label: "Security", queues: ["critical", "high", "medium", "low"], description: "Audit, alerts, realtime responses, and rollups." },
  { key: "security-testing", label: "Security Testing", queues: ["critical", "high", "medium", "low"], description: "Test runs, reports, and cleanup." },
  { key: "seller", label: "Seller", queues: ["high", "medium", "low"], description: "KYC, fraud scoring, final review, and online sync." },
  { key: "subscriptions", label: "Subscriptions", queues: ["billing:webhook", "billing:dunning", "billing:invoice_gen", "billing:usage_rollup", "billing:dlq"], description: "Billing webhooks, dunning, invoices, usage, and DLQ." },
  { key: "support", label: "Support", queues: ["support:escalation", "support:notifications", "support:evidence_scan"], description: "Escalations, notifications, and evidence scans." },
];

