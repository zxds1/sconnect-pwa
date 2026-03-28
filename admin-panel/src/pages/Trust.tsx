import { useEffect, useState } from "react";
import { coreFetch } from "../lib/adminApi";

export const Trust = () => {
  const [tickets, setTickets] = useState<any[]>([]);
  const [disputeSummary, setDisputeSummary] = useState<any>(null);
  const [counterfeitSummary, setCounterfeitSummary] = useState<any>(null);
  const [holds, setHolds] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([
      coreFetch("/support/tickets?limit=10").then((data) => data.items || []).catch(() => []),
      coreFetch("/disputes/summary").catch(() => null),
      coreFetch("/reports/counterfeit/summary").catch(() => null),
      coreFetch("/compliance/holds").then((data) => data.holds || []).catch(() => []),
    ]).then(([ticketItems, dispute, counterfeit, holdItems]) => {
      setTickets(ticketItems);
      setDisputeSummary(dispute);
      setCounterfeitSummary(counterfeit);
      setHolds(holdItems);
    });
  }, []);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2>Trust & Support</h2>
          <p>Operational support, dispute, counterfeit, and legal-hold visibility.</p>
        </div>
      </div>
      <div className="card-grid">
        <div className="card">
          <h3>Disputes</h3>
          <strong>{disputeSummary?.open ?? "—"}</strong>
          <div className="muted">Open</div>
          <div className="muted">Investigating: {disputeSummary?.investigating ?? "—"}</div>
          <div className="muted">Resolved: {disputeSummary?.resolved ?? "—"}</div>
          <div className="muted">Rejected: {disputeSummary?.rejected ?? "—"}</div>
        </div>
        <div className="card">
          <h3>Counterfeit</h3>
          <strong>{counterfeitSummary?.open ?? "—"}</strong>
          <div className="muted">Open</div>
          <div className="muted">Investigating: {counterfeitSummary?.investigating ?? "—"}</div>
          <div className="muted">Resolved: {counterfeitSummary?.resolved ?? "—"}</div>
        </div>
        <div className="card">
          <h3>Legal Holds</h3>
          <strong>{holds.length}</strong>
          <div className="muted">Active and expired hold records</div>
        </div>
      </div>
      <div className="card">
        <h3>Recent Tickets</h3>
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Category</th>
              <th>Status</th>
              <th>Priority</th>
              <th>Updated</th>
            </tr>
          </thead>
          <tbody>
            {tickets.map((ticket) => (
              <tr key={ticket.id}>
                <td>{ticket.id}</td>
                <td>{ticket.category}</td>
                <td>{ticket.status}</td>
                <td>{ticket.priority}</td>
                <td>{ticket.updated_at?.slice?.(0, 19) ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
