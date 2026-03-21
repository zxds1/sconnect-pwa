import { ReactNode } from "react";

type DrawerProps = {
  open: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
};

export const Drawer = ({ open, title, subtitle, onClose, children }: DrawerProps) => {
  if (!open) return null;
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 60,
        background: "rgba(7, 10, 20, 0.62)",
        display: "flex",
        justifyContent: "flex-end",
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "min(760px, 100%)",
          height: "100%",
          background: "var(--surface, #0f172a)",
          borderLeft: "1px solid var(--border)",
          boxShadow: "-20px 0 60px rgba(0,0,0,0.3)",
          overflow: "auto",
          padding: 20,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
          <div>
            <strong>{title}</strong>
            {subtitle ? <div className="muted" style={{ fontSize: 12 }}>{subtitle}</div> : null}
          </div>
          <button className="button" onClick={onClose}>Close</button>
        </div>
        <div style={{ marginTop: 16 }}>{children}</div>
      </div>
    </div>
  );
};
