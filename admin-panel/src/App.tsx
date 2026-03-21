import { Routes, Route, Navigate } from "react-router-dom";
import { Refine } from "@refinedev/core";
import simpleRestProvider from "@refinedev/simple-rest";
import { Sidebar } from "./components/Sidebar";
import { Topbar } from "./components/Topbar";
import { getSession } from "./lib/adminApi";
import { Login } from "./pages/Login";
import { Dashboard } from "./pages/Dashboard";
import { Users } from "./pages/Users";
import { Tenants } from "./pages/Tenants";
import { Flags } from "./pages/Flags";
import { Experiments } from "./pages/Experiments";
import { OpsConfigs } from "./pages/OpsConfigs";
import { Alerts } from "./pages/Alerts";
import { Security } from "./pages/Security";
import { Compliance } from "./pages/Compliance";
import { Risk } from "./pages/Risk";
import { Audit } from "./pages/Audit";
import { SupplierApplications } from "./pages/SupplierApplications";
import { AssistantModels } from "./pages/AssistantModels";
import { Partnerships } from "./pages/Partnerships";

export default function App() {
  const session = getSession();
  const httpClient = async (url: string, options: RequestInit = {}) => {
    const headers = new Headers(options.headers || {});
    if (session?.accessToken) headers.set("Authorization", `Bearer ${session.accessToken}`);
    if (session?.tenantId) headers.set("X-Tenant-Id", session.tenantId);
    if (session?.userId) headers.set("X-User-Id", session.userId);
    if (session?.roles?.length) headers.set("X-Role", session.roles[0]);
    headers.set("Content-Type", "application/json");
    return fetch(url, { ...options, headers });
  };
  const dataProvider = simpleRestProvider("/v1/admin", httpClient);

  if (!session) {
    return <Login />;
  }

  return (
    <Refine
      dataProvider={dataProvider}
      resources={[
        { name: "users" },
        { name: "flags" },
        { name: "experiments" },
        { name: "ops-configs" },
        { name: "assistant-models" },
        { name: "supplier-applications" },
        { name: "partnerships" },
        { name: "alerts" },
        { name: "audit" },
        { name: "risk" },
      ]}
      options={{ syncWithLocation: true, warnWhenUnsavedChanges: false }}
    >
      <div className="app-shell">
        <Sidebar />
        <div>
          <Topbar />
          <div className="content">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/users" element={<Users />} />
              <Route path="/tenants" element={<Tenants />} />
              <Route path="/flags" element={<Flags />} />
              <Route path="/experiments" element={<Experiments />} />
              <Route path="/ops-configs" element={<OpsConfigs />} />
              <Route path="/assistant-models" element={<AssistantModels />} />
              <Route path="/supplier-applications" element={<SupplierApplications />} />
              <Route path="/partnerships" element={<Partnerships />} />
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/security" element={<Security />} />
            <Route path="/compliance" element={<Compliance />} />
            <Route path="/risk" element={<Risk />} />
              <Route path="/audit" element={<Audit />} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </div>
        </div>
      </div>
    </Refine>
  );
}
