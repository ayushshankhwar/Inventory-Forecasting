import React, { useState, useEffect, useCallback } from "react";
import axiosInstance from "../api/axiosInstance";
import {
  Bell, CheckCircle, AlertTriangle, RefreshCw,
  Filter, XCircle
} from "lucide-react";
import toast from "react-hot-toast";

function AlertCard({ alert, onResolve }) {
  const riskColors = { HIGH: "#ef4444", MEDIUM: "#f59e0b", LOW: "#10b981" };
  const risk = alert.risk_level || "LOW";
  const color = riskColors[risk];

  return (
    <div style={{
      background: "#1e293b",
      border: `1px solid ${alert.resolved ? "#334155" : color + "40"}`,
      borderRadius: 10,
      padding: "1.25rem",
      opacity: alert.resolved ? 0.6 : 1,
      transition: "all 0.2s"
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
          <div style={{
            width: 36, height: 36, borderRadius: 8, flexShrink: 0,
            background: `${color}15`,
            display: "flex", alignItems: "center", justifyContent: "center"
          }}>
            <AlertTriangle size={18} color={color} />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: 4 }}>
              <span style={{ fontWeight: 700, color: "#f8fafc", fontSize: "0.95rem" }}>{alert.sku}</span>
              <span className={`badge badge-${risk.toLowerCase()}`}>{risk}</span>
              {alert.resolved && (
                <span style={{
                  display: "inline-flex", alignItems: "center", gap: 4,
                  fontSize: "0.7rem", color: "#10b981"
                }}>
                  <CheckCircle size={12} /> Resolved
                </span>
              )}
            </div>
            <p style={{ fontSize: "0.875rem", color: "#94a3b8", marginBottom: "0.5rem" }}>
              {alert.message}
            </p>
            <div style={{ display: "flex", gap: "1.5rem" }}>
              <span style={{ fontSize: "0.75rem", color: "#64748b" }}>
                Stock: <strong style={{ color: "#f8fafc" }}>{alert.current_stock?.toLocaleString() || 0}</strong>
              </span>
              <span style={{ fontSize: "0.75rem", color: "#64748b" }}>
                30d Demand: <strong style={{ color: "#f59e0b" }}>{alert.forecasted_demand_30d?.toLocaleString() || 0}</strong>
              </span>
              {alert.shortage_quantity > 0 && (
                <span style={{ fontSize: "0.75rem", color: "#64748b" }}>
                  Shortage: <strong style={{ color: "#ef4444" }}>{alert.shortage_quantity?.toLocaleString()}</strong>
                </span>
              )}
              {alert.days_until_stockout && (
                <span style={{ fontSize: "0.75rem", color: "#64748b" }}>
                  Stockout in: <strong style={{ color: color }}>{alert.days_until_stockout} days</strong>
                </span>
              )}
              <span style={{ fontSize: "0.75rem", color: "#64748b" }}>
                {alert.alert_date}
              </span>
            </div>
          </div>
        </div>

        {!alert.resolved && (
          <button
            onClick={() => onResolve(alert.id)}
            className="btn btn-outline"
            style={{ fontSize: "0.8rem", flexShrink: 0 }}
          >
            <CheckCircle size={14} /> Resolve
          </button>
        )}
      </div>
    </div>
  );
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all | active | resolved

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    try {
      const resolvedParam = filter === "active" ? "?resolved=false"
        : filter === "resolved" ? "?resolved=true" : "";

      const [alertsRes, summaryRes] = await Promise.all([
        axiosInstance.get(`/alerts${resolvedParam}`),
        axiosInstance.get("/alerts/summary")
      ]);
      setAlerts(alertsRes.data.data || []);
      setSummary(summaryRes.data.data);
    } catch {
      toast.error("Failed to load alerts");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { fetchAlerts(); }, [fetchAlerts]);

  const handleResolve = async (alertId) => {
    try {
      await axiosInstance.post(`/alerts/${alertId}/resolve`);
      toast.success("Alert resolved");
      fetchAlerts();
    } catch {
      toast.error("Failed to resolve alert");
    }
  };

  const highAlerts = alerts.filter(a => a.risk_level === "HIGH");
  const mediumAlerts = alerts.filter(a => a.risk_level === "MEDIUM");
  const lowAlerts = alerts.filter(a => a.risk_level === "LOW");

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
        <div className="page-header">
          <h1 className="page-title">Stockout Alerts</h1>
          <p className="page-subtitle">Real-time inventory risk notifications</p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button className="btn btn-outline" onClick={fetchAlerts}>
            <RefreshCw size={15} /> Refresh
          </button>
          <a
            href={`${process.env.REACT_APP_API_URL}/reports/alerts/csv`}
            className="btn btn-outline"
            style={{ fontSize: "0.875rem" }}
          >
            Export CSV
          </a>
        </div>
      </div>

      {/* Summary Row */}
      {summary && (
        <div className="grid-4" style={{ marginBottom: "1.5rem" }}>
          {[
            { label: "Total Active", value: summary.total_active, color: "#3b82f6" },
            { label: "HIGH Risk", value: summary.high, color: "#ef4444" },
            { label: "MEDIUM Risk", value: summary.medium, color: "#f59e0b" },
            { label: "LOW Risk", value: summary.low, color: "#10b981" },
          ].map(({ label, value, color }) => (
            <div key={label} className="card" style={{ textAlign: "center" }}>
              <p style={{ fontSize: "0.8rem", color: "#94a3b8" }}>{label}</p>
              <p style={{ fontSize: "2rem", fontWeight: 700, color }}>{value || 0}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filter Tabs */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.25rem" }}>
        {["all", "active", "resolved"].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={filter === f ? "btn btn-primary" : "btn btn-outline"}
            style={{ textTransform: "capitalize" }}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Alerts List */}
      {loading ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 200 }}>
          <div className="spinner" />
        </div>
      ) : alerts.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "3rem" }}>
          <Bell size={40} style={{ margin: "0 auto 1rem", color: "#334155" }} />
          <p style={{ color: "#94a3b8" }}>No alerts found. All inventory levels look healthy!</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {/* HIGH RISK first */}
          {highAlerts.length > 0 && (
            <div>
              <p style={{ fontSize: "0.75rem", fontWeight: 600, color: "#ef4444", marginBottom: "0.5rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                🔴 High Risk ({highAlerts.length})
              </p>
              {highAlerts.map(a => (
                <div key={a.id} style={{ marginBottom: "0.75rem" }}>
                  <AlertCard alert={a} onResolve={handleResolve} />
                </div>
              ))}
            </div>
          )}
          {mediumAlerts.length > 0 && (
            <div>
              <p style={{ fontSize: "0.75rem", fontWeight: 600, color: "#f59e0b", marginBottom: "0.5rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                🟡 Medium Risk ({mediumAlerts.length})
              </p>
              {mediumAlerts.map(a => (
                <div key={a.id} style={{ marginBottom: "0.75rem" }}>
                  <AlertCard alert={a} onResolve={handleResolve} />
                </div>
              ))}
            </div>
          )}
          {lowAlerts.length > 0 && (
            <div>
              <p style={{ fontSize: "0.75rem", fontWeight: 600, color: "#10b981", marginBottom: "0.5rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                🟢 Low Risk / Resolved ({lowAlerts.length})
              </p>
              {lowAlerts.map(a => (
                <div key={a.id} style={{ marginBottom: "0.75rem" }}>
                  <AlertCard alert={a} onResolve={handleResolve} />
                </div>
              ))}
            </div>
          )}
          {/* Resolved (when filter=resolved) */}
          {filter === "resolved" && alerts.filter(a => a.resolved).map(a => (
            <div key={a.id} style={{ marginBottom: "0.75rem" }}>
              <AlertCard alert={a} onResolve={handleResolve} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
