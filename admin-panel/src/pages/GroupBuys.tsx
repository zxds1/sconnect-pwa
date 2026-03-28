import { useEffect, useMemo, useState } from "react";
import { BarChart3, RefreshCcw, Store } from "lucide-react";
import {
  getGroupBuyEvents,
  getGroupBuy,
  getGroupBuyPayments,
  getGroupBuyStatus,
  getGroupBuyTiers,
  listGroupBuyInstances,
  type GroupBuyInstance,
  type GroupBuyPayment,
  type GroupBuyStatus,
  type GroupBuyTier,
  type GroupBuyStateEvent,
} from "../lib/groupbuyAdminApi";

const fmt = (value?: string | number | null) => (value === undefined || value === null || value === "" ? "—" : value);

const badgeClass = (value?: string) => {
  const status = String(value || "").toLowerCase();
  if (status.includes("fulfilled") || status.includes("released") || status.includes("completed") || status.includes("open")) return "badge success";
  if (status.includes("closed") || status.includes("cancel") || status.includes("fail") || status.includes("error")) return "badge warn";
  return "badge info";
};

const money = (value?: number | string | null) => {
  if (value === undefined || value === null || value === "") return "—";
  const num = typeof value === "string" ? Number(value) : value;
  return Number.isFinite(num) ? `KSh ${num.toLocaleString()}` : String(value);
};

const utcDateString = (date: Date) => date.toISOString().slice(0, 10);

const startOfUtcMonth = (date: Date) => utcDateString(new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1)));

export const GroupBuys = () => {
  const [items, setItems] = useState<GroupBuyInstance[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [selectedGroup, setSelectedGroup] = useState<GroupBuyInstance | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<GroupBuyStatus | null>(null);
  const [tiers, setTiers] = useState<GroupBuyTier[]>([]);
  const [payments, setPayments] = useState<GroupBuyPayment[]>([]);
  const [events, setEvents] = useState<GroupBuyStateEvent[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [filters, setFilters] = useState({ status: "open", market_name: "", category_id: "" });
  const [eventFilters, setEventFilters] = useState({
    action: "",
    actor_id: "",
    from_status: "",
    to_status: "",
    from_date: "",
    to_date: "",
  });

  const loadList = async (silent = false) => {
    if (!silent) {
      setLoading(true);
      setStatus(null);
    }
    try {
      const data = await listGroupBuyInstances({
        status: filters.status || undefined,
        market_name: filters.market_name || undefined,
        category_id: filters.category_id || undefined,
      });
      setItems(data);
      if (!data.some((item) => item.id === selectedId) && data.length > 0) {
        setSelectedId(data[0].id);
      } else if (data.length === 0) {
        setSelectedId("");
      }
    } catch (err: any) {
      if (!silent) setStatus(err?.message || "Unable to load group buys.");
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const loadDetails = async (id: string, silent = false) => {
    if (!id) return;
    if (!silent) setDetailLoading(true);
    try {
      const [group, liveStatus, groupTiers, groupPayments, groupEvents] = await Promise.all([
        getGroupBuy(id).catch(() => null),
        getGroupBuyStatus(id).catch(() => null),
        getGroupBuyTiers(id).catch(() => []),
        getGroupBuyPayments(id).catch(() => []),
        getGroupBuyEvents(id, {
          limit: 50,
          action: eventFilters.action || undefined,
          actor_id: eventFilters.actor_id || undefined,
          from_status: eventFilters.from_status || undefined,
          to_status: eventFilters.to_status || undefined,
          from_date: eventFilters.from_date || undefined,
          to_date: eventFilters.to_date || undefined,
        }).catch(() => []),
      ]);
      if (group) setSelectedGroup(group);
      if (liveStatus) setSelectedStatus(liveStatus);
      setTiers(groupTiers);
      setPayments(groupPayments);
      setEvents(groupEvents);
    } catch (err: any) {
      if (!silent) setStatus(err?.message || "Unable to load group buy details.");
    } finally {
      if (!silent) setDetailLoading(false);
    }
  };

  useEffect(() => {
    loadList();
  }, [filters.status, filters.market_name, filters.category_id]);

  useEffect(() => {
    if (!selectedId) return;
    loadDetails(selectedId);
  }, [selectedId, eventFilters.action, eventFilters.actor_id, eventFilters.from_status, eventFilters.to_status, eventFilters.from_date, eventFilters.to_date]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      loadList(true);
      if (selectedId) loadDetails(selectedId, true);
    }, 20000);
    return () => window.clearInterval(timer);
  }, [selectedId, filters.status, filters.market_name, filters.category_id]);

  const selected = selectedGroup || items.find((item) => item.id === selectedId) || null;
  const live = selectedStatus;
  const target = Math.max(1, live?.target || selected?.target_tier_qty || selected?.min_group_size || 1);
  const current = live?.members ?? selected?.current_size ?? 0;
  const progress = Math.min(100, Math.round((current / target) * 100));
  const completedPayments = payments.filter((payment) => String(payment.status || "").toLowerCase().includes("settled") || String(payment.status || "").toLowerCase().includes("released")).length;
  const eventFeed = [...events].sort((a, b) => {
    const left = new Date(a.created_at || 0).getTime();
    const right = new Date(b.created_at || 0).getTime();
    return right - left;
  });
  const summary = useMemo(() => {
    const open = items.filter((item) => String(item.status || "").toLowerCase().includes("open")).length;
    const closed = items.filter((item) => String(item.status || "").toLowerCase().includes("closed")).length;
    const fulfilled = items.filter((item) => String(item.status || "").toLowerCase().includes("fulfilled")).length;
    const averageFill = items.length
      ? Math.round(
          items.reduce((acc, item) => {
            const itemTarget = Math.max(1, item.target_tier_qty || item.min_group_size || 1);
            const itemCurrent = item.current_size || 0;
            return acc + Math.min(100, (itemCurrent / itemTarget) * 100);
          }, 0) / items.length
        )
      : 0;
    return { open, closed, fulfilled, averageFill };
  }, [items]);

  const applyEventPreset = (preset: "today" | "last_7d" | "month") => {
    const now = new Date();
    const today = utcDateString(now);
    if (preset === "today") {
      setEventFilters((prev) => ({ ...prev, from_date: today, to_date: today }));
      return;
    }
    if (preset === "last_7d") {
      const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 6));
      setEventFilters((prev) => ({ ...prev, from_date: utcDateString(start), to_date: today }));
      return;
    }
    setEventFilters((prev) => ({ ...prev, from_date: startOfUtcMonth(now), to_date: today }));
  };

  const applyLast30Days = () => {
    const now = new Date();
    const today = utcDateString(now);
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 29));
    setEventFilters((prev) => ({ ...prev, from_date: utcDateString(start), to_date: today }));
  };

  return (
    <div className="page" style={{ gap: 24 }}>
      <div className="page-header">
        <div>
          <h2>Group Buys</h2>
          <p>Operational status, escrow, fulfillment, and inventory signals for live group-buy runs.</p>
        </div>
        <div className="actions">
          <button className="btn secondary" onClick={() => loadList()}>
            <RefreshCcw size={14} />
            Refresh
          </button>
        </div>
      </div>

      {status && <div className="status">{status}</div>}
      {(loading || detailLoading) && <div className="status">Loading group buy data…</div>}

      <div className="card-grid">
        <div className="card"><h3>Open</h3><strong>{summary.open}</strong><p className="muted">Currently live deals.</p></div>
        <div className="card"><h3>Closed</h3><strong>{summary.closed}</strong><p className="muted">Deals no longer taking joins.</p></div>
        <div className="card"><h3>Fulfilled</h3><strong>{summary.fulfilled}</strong><p className="muted">Completed delivery runs.</p></div>
        <div className="card"><h3>Avg Fill</h3><strong>{summary.averageFill}%</strong><p className="muted">Based on current membership vs target.</p></div>
      </div>

      <div className="card-grid">
        <div className="card" style={{ gridColumn: "span 2" }}>
          <div className="card-header">
            <div>
              <h3>Deal Registry</h3>
              <p className="muted">Select a group buy to inspect live state and payment progress.</p>
            </div>
            <Store size={18} />
          </div>
          <div className="card-grid" style={{ marginBottom: 16 }}>
            <div className="card" style={{ background: "rgba(8,10,18,0.35)" }}>
              <h3>Status</h3>
              <select
                className="input"
                value={filters.status}
                onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
              >
                <option value="open">Open</option>
                <option value="closed">Closed</option>
                <option value="fulfilled">Fulfilled</option>
                <option value="">All</option>
              </select>
            </div>
            <div className="card" style={{ background: "rgba(8,10,18,0.35)" }}>
              <h3>Market</h3>
              <input className="input" value={filters.market_name} onChange={(e) => setFilters((prev) => ({ ...prev, market_name: e.target.value }))} placeholder="Market name" />
            </div>
            <div className="card" style={{ background: "rgba(8,10,18,0.35)" }}>
              <h3>Category</h3>
              <input className="input" value={filters.category_id} onChange={(e) => setFilters((prev) => ({ ...prev, category_id: e.target.value }))} placeholder="Category" />
            </div>
          </div>

          <div style={{ display: "grid", gap: 12 }}>
            {items.map((item) => {
              const itemStatus = String(item.status || "").toLowerCase();
              const itemLiveStatus = item.id === selectedId ? live : null;
              const itemTarget = Math.max(1, itemLiveStatus?.target || item.target_tier_qty || item.min_group_size || 1);
              const itemCurrent = itemLiveStatus?.members ?? item.current_size ?? 0;
              const itemProgress = Math.min(100, Math.round((itemCurrent / itemTarget) * 100));
              return (
                <button
                  key={item.id}
                  onClick={() => setSelectedId(item.id)}
                  className="card"
                  style={{
                    textAlign: "left",
                    padding: 16,
                    background: item.id === selectedId ? "rgba(56,189,248,0.14)" : "rgba(8,10,18,0.35)",
                    borderColor: item.id === selectedId ? "rgba(56,189,248,0.5)" : undefined,
                  }}
                >
                  <div className="card-header" style={{ marginBottom: 10 }}>
                    <div>
                      <strong>{item.product_sku || "Shared deal"}</strong>
                      <p className="muted">{item.seller_name || item.seller_id || "Seller"} · {fmt(item.market_name)}</p>
                    </div>
                    <span className={badgeClass(item.status)}>{fmt(item.status)}</span>
                  </div>
                  <div className="card-grid" style={{ gridTemplateColumns: "repeat(4, minmax(0, 1fr))", marginBottom: 0 }}>
                    <div className="card" style={{ background: "rgba(255,255,255,0.03)" }}><h3>Members</h3><strong>{itemCurrent}/{itemTarget}</strong></div>
                    <div className="card" style={{ background: "rgba(255,255,255,0.03)" }}><h3>Fill</h3><strong>{itemProgress}%</strong></div>
                    <div className="card" style={{ background: "rgba(255,255,255,0.03)" }}><h3>Price</h3><strong>{money(itemLiveStatus?.tier_price || item.current_price)}</strong></div>
                    <div className="card" style={{ background: "rgba(255,255,255,0.03)" }}><h3>Inventory</h3><strong>{fmt(item.inventory_remaining)}</strong></div>
                  </div>
                  <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <span className="badge info">Momentum {Math.round(itemLiveStatus?.momentum || itemProgress)}%</span>
                    <span className="badge info">{fmt(item.category_id)}</span>
                    {item.status && <span className={badgeClass(itemStatus)}>{itemStatus}</span>}
                  </div>
                </button>
              );
            })}
            {!loading && items.length === 0 && <p className="muted">No group buys matched the current filters.</p>}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div>
              <h3>Group Buy Detail</h3>
              <p className="muted">Live state, tiers, payments, and inventory commitment.</p>
            </div>
            <BarChart3 size={18} />
          </div>
          {selected ? (
            <div style={{ display: "grid", gap: 12 }}>
              <div className="card" style={{ background: "rgba(8,10,18,0.35)" }}>
                <div className="card-header" style={{ marginBottom: 8 }}>
                  <div>
                    <strong>{selected.product_sku || selected.id}</strong>
                    <p className="muted">{selected.seller_name || selected.seller_id || "Seller"} · {fmt(selected.market_name)}</p>
                  </div>
                  <span className={badgeClass(live?.status || selected.status)}>{fmt(live?.status || selected.status)}</span>
                </div>
                <p className="muted">Group {fmt(selected.id)} · source {fmt(selected.source_type)} · category {fmt(selected.category_id)}</p>
                <p className="muted">Share {fmt(selected.share_link)} · chat {fmt(selected.group_chat_id)} · radius {fmt(selected.delivery_radius_km)} km</p>
              </div>

              <div className="card-grid" style={{ gridTemplateColumns: "repeat(2, minmax(0, 1fr))", marginBottom: 0 }}>
                <div className="card" style={{ background: "rgba(8,10,18,0.35)" }}><h3>Members</h3><strong>{current}/{target}</strong></div>
                <div className="card" style={{ background: "rgba(8,10,18,0.35)" }}><h3>Momentum</h3><strong>{Math.round(live?.momentum || progress)}%</strong></div>
                <div className="card" style={{ background: "rgba(8,10,18,0.35)" }}><h3>Tier Price</h3><strong>{money(live?.tier_price || selected.current_price)}</strong></div>
                <div className="card" style={{ background: "rgba(8,10,18,0.35)" }}><h3>Inventory Left</h3><strong>{fmt(selected.inventory_remaining)}</strong></div>
              </div>

              <div className="card" style={{ background: "rgba(8,10,18,0.35)" }}>
                <h3 style={{ marginBottom: 8 }}>Escrow / Fulfillment</h3>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <span className="badge info">Payments {payments.length}</span>
                  <span className="badge info">Settled {completedPayments}</span>
                  <span className="badge info">Tiers {tiers.length}</span>
                </div>
                <p className="muted" style={{ marginTop: 12 }}>
                  Worker-driven transitions update the deal, escrow, and fulfillment records as state changes are processed.
                </p>
              </div>

              <div className="card" style={{ background: "rgba(8,10,18,0.35)" }}>
                <h3 style={{ marginBottom: 8 }}>History Feed</h3>
                <div className="card-grid" style={{ gridTemplateColumns: "repeat(3, minmax(0, 1fr))", marginBottom: 12 }}>
                  <div className="card" style={{ background: "rgba(255,255,255,0.03)" }}>
                    <h3>Action</h3>
                    <input className="input" value={eventFilters.action} onChange={(e) => setEventFilters((prev) => ({ ...prev, action: e.target.value }))} placeholder="view, create, fulfill" />
                  </div>
                  <div className="card" style={{ background: "rgba(255,255,255,0.03)" }}>
                    <h3>Actor</h3>
                    <input className="input" value={eventFilters.actor_id} onChange={(e) => setEventFilters((prev) => ({ ...prev, actor_id: e.target.value }))} placeholder="worker or user id" />
                  </div>
                  <div className="card" style={{ background: "rgba(255,255,255,0.03)" }}>
                    <h3>From</h3>
                    <input className="input" value={eventFilters.from_status} onChange={(e) => setEventFilters((prev) => ({ ...prev, from_status: e.target.value }))} placeholder="open" />
                  </div>
                  <div className="card" style={{ background: "rgba(255,255,255,0.03)" }}>
                    <h3>To</h3>
                    <input className="input" value={eventFilters.to_status} onChange={(e) => setEventFilters((prev) => ({ ...prev, to_status: e.target.value }))} placeholder="fulfilled" />
                  </div>
                  <div className="card" style={{ background: "rgba(255,255,255,0.03)" }}>
                    <h3>From Date</h3>
                    <input className="input" type="date" value={eventFilters.from_date} onChange={(e) => setEventFilters((prev) => ({ ...prev, from_date: e.target.value }))} />
                  </div>
                  <div className="card" style={{ background: "rgba(255,255,255,0.03)" }}>
                    <h3>To Date</h3>
                    <input className="input" type="date" value={eventFilters.to_date} onChange={(e) => setEventFilters((prev) => ({ ...prev, to_date: e.target.value }))} />
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
                  <button className="btn secondary" onClick={() => applyEventPreset("today")}>Today</button>
                  <button className="btn secondary" onClick={() => applyEventPreset("last_7d")}>Last 7d</button>
                  <button className="btn secondary" onClick={() => applyEventPreset("month")}>This month</button>
                  <button className="btn secondary" onClick={applyLast30Days}>Last 30d</button>
                  <button
                    className="btn secondary"
                    onClick={() =>
                      setEventFilters({
                        action: "",
                        actor_id: "",
                        from_status: "",
                        to_status: "",
                        from_date: "",
                        to_date: "",
                      })
                    }
                  >
                    Clear
                  </button>
                </div>
                <div style={{ display: "grid", gap: 8 }}>
                  {eventFeed.map((event) => {
                    const detail = event.details || {};
                    const summary = [
                      event.from_status ? `${event.from_status} → ${event.to_status || "?"}` : null,
                      detail.reason ? String(detail.reason) : null,
                      detail.members ? `${String(detail.members)} members` : null,
                      detail.target ? `target ${String(detail.target)}` : null,
                    ].filter(Boolean).join(" · ");
                    return (
                      <div key={event.id} className="card" style={{ background: "rgba(255,255,255,0.03)" }}>
                        <div className="card-header" style={{ marginBottom: 8 }}>
                          <div>
                            <strong>{event.action}</strong>
                            <p className="muted" style={{ marginTop: 4 }}>{fmt(event.created_at)}</p>
                          </div>
                          <span className={badgeClass(event.to_status || event.from_status || event.action)}>{fmt(event.to_status || event.action)}</span>
                        </div>
                        <p className="muted">
                          Actor {fmt(event.actor_id)}{summary ? ` · ${summary}` : ""}
                        </p>
                        {Object.keys(detail).length > 0 && (
                          <pre className="textarea" style={{ marginTop: 10, maxHeight: 160, overflow: "auto" }}>
                            {JSON.stringify(detail, null, 2)}
                          </pre>
                        )}
                      </div>
                    );
                  })}
                  {eventFeed.length === 0 && <p className="muted">No state events recorded yet.</p>}
                </div>
              </div>

              <div className="card" style={{ background: "rgba(8,10,18,0.35)" }}>
                <h3 style={{ marginBottom: 8 }}>Tier Schedule</h3>
                <div style={{ display: "grid", gap: 8 }}>
                  {tiers.map((tier) => (
                    <div key={`${tier.group_buy_id}-${tier.tier}`} className="card" style={{ background: "rgba(255,255,255,0.03)" }}>
                      <div className="card-header">
                        <strong>{tier.tier}</strong>
                        <span className={badgeClass(String(tier.discount))}>{money(tier.price)}</span>
                      </div>
                      <p className="muted">
                        Members {tier.min_members}-{tier.max_members} · discount {tier.discount}
                      </p>
                    </div>
                  ))}
                  {tiers.length === 0 && <p className="muted">No tier schedule available.</p>}
                </div>
              </div>

              <div className="card" style={{ background: "rgba(8,10,18,0.35)" }}>
                <h3 style={{ marginBottom: 8 }}>Payments</h3>
                <div style={{ display: "grid", gap: 8 }}>
                  {payments.map((payment) => (
                    <div key={payment.id} className="card" style={{ background: "rgba(255,255,255,0.03)" }}>
                      <div className="card-header">
                        <strong>{payment.id}</strong>
                        <span className={badgeClass(payment.status)}>{fmt(payment.status)}</span>
                      </div>
                      <p className="muted">Escrow {fmt(payment.escrow_amount)} · Supplier {fmt(payment.supplier_split)} · Fee {fmt(payment.platform_fee)}</p>
                    </div>
                  ))}
                  {payments.length === 0 && <p className="muted">No payment records captured yet.</p>}
                </div>
              </div>
            </div>
          ) : (
            <p className="muted">Pick a group buy from the registry to inspect the operational detail view.</p>
          )}
        </div>
      </div>
    </div>
  );
};
