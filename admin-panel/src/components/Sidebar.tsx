import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { listAssistantRuns } from "../lib/assistantRunsApi";

const navItems = [
  { path: "/", label: "Dashboard" },
  { path: "/users", label: "Users" },
  { path: "/tenants", label: "Tenants" },
  { path: "/flags", label: "Feature Flags" },
  { path: "/experiments", label: "Experiments" },
  { path: "/ops-configs", label: "Ops Configs" },
  { path: "/assistant-models", label: "Assistant Models" },
  { path: "/supplier-applications", label: "Supplier Applications" },
  { path: "/partnerships", label: "Partnership APIs" },
  { path: "/alerts", label: "Security Alerts" },
  { path: "/security", label: "Security Overview" },
  { path: "/compliance", label: "Compliance" },
  { path: "/risk", label: "Risk Radar" },
  { path: "/audit", label: "Audit Trail" }
];

export const Sidebar = () => {
  const [needsReviewCount, setNeedsReviewCount] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    listAssistantRuns({ needs_review: true, limit: 100 })
      .then((resp) => {
        if (!active) return;
        setNeedsReviewCount(resp.items?.length ?? 0);
      })
      .catch(() => {
        if (!active) return;
        setNeedsReviewCount(null);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <aside className="sidebar">
      <h1>SokoConnect Admin</h1>
      <p>Control Center v1.16.0</p>
      <nav>
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
          >
            <span>{item.label}</span>
            {item.path === "/assistant-models" && needsReviewCount !== null && needsReviewCount > 0 && (
              <span className="badge warn" style={{ marginLeft: "auto" }}>
                {needsReviewCount}
              </span>
            )}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};
