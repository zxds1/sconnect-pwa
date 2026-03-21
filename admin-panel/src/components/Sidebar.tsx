import { NavLink } from "react-router-dom";

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
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};
