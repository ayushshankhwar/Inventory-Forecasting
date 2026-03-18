import { useState, useEffect } from "react";
import axiosInstance from "../api/axiosInstance";
import {
  FileText, Download,
  TrendingUp, Package, AlertTriangle
} from "lucide-react";
import toast from "react-hot-toast";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend
} from "recharts";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

function ReportCard({ icon: Icon, title, description, actions }) {
  return (
    <div className="card">
      <div style={{ display: "flex", alignItems: "flex-start", gap: "0.875rem", marginBottom: "1rem" }}>
        <div style={{
          width: 40, height: 40, borderRadius: 8,
          background: "rgba(59,130,246,0.1)",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0
        }}>
          <Icon size={18} color="#3b82f6" />
        </div>
        <div>
          <p style={{ fontWeight: 600, color: "#f8fafc", fontSize: "0.95rem" }}>{title}</p>
          <p style={{ fontSize: "0.8rem", color: "#64748b", marginTop: 2 }}>{description}</p>
        </div>
      </div>
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        {actions.map(({ label, href, onClick, type }, i) => (
          href ? (
            <a key={i} href={href} className={`btn ${type === "primary" ? "btn-primary" : "btn-outline"}`} style={{ fontSize: "0.8rem" }}>
              <Download size={13} /> {label}
            </a>
          ) : (
            <button key={i} onClick={onClick} className={`btn ${type === "primary" ? "btn-primary" : "btn-outline"}`} style={{ fontSize: "0.8rem" }}>
              <Download size={13} /> {label}
            </button>
          )
        ))}
      </div>
    </div>
  );
}

export default function ReportsPage() {
  const [forecasts, setForecasts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSku, setSelectedSku] = useState("");

  useEffect(() => {
    axiosInstance.get("/forecast-all")
      .then(res => {
        const data = res.data.data || [];
        setForecasts(data);
        const firstSku = data.find(f => f.sku)?.sku || "";
        setSelectedSku(firstSku);
      })
      .catch(() => toast.error("Failed to load forecast data"))
      .finally(() => setLoading(false));
  }, []);

  const uniqueSkus = [...new Set(forecasts.map(f => f.sku).filter(Boolean))];

  // Build turnover chart data
  const turnoverData = uniqueSkus.map(sku => {
    const f = forecasts.find(x => x.sku === sku);
    return {
      sku,
      turnover: f?.data?.turnover_rate || 0,
      demand: f?.data?.total_forecasted_demand || 0,
    };
  });

  return (
    <div>
      <div className="page-header" style={{ marginBottom: "1.5rem" }}>
        <h1 className="page-title">Reports & Exports</h1>
        <p className="page-subtitle">Download forecasts, alerts, and inventory analysis reports</p>
      </div>

      {/* Export Cards */}
      <div className="grid-2" style={{ marginBottom: "1.5rem" }}>
        {/* All Forecasts */}
        <ReportCard
          icon={TrendingUp}
          title="All Forecasts Summary"
          description="Complete forecast data for all SKUs in CSV format"
          actions={[
            { label: "Download CSV", href: `${API_URL}/reports/forecast-all/csv`, type: "primary" }
          ]}
        />

        {/* Alerts Report */}
        <ReportCard
          icon={AlertTriangle}
          title="Stockout Alerts Report"
          description="All current and historical stockout alerts"
          actions={[
            { label: "Download CSV", href: `${API_URL}/reports/alerts/csv`, type: "primary" }
          ]}
        />

        {/* Per-SKU Forecast */}
        <div className="card">
          <div style={{ display: "flex", alignItems: "flex-start", gap: "0.875rem", marginBottom: "1rem" }}>
            <div style={{
              width: 40, height: 40, borderRadius: 8,
              background: "rgba(139,92,246,0.1)",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0
            }}>
              <Package size={18} color="#8b5cf6" />
            </div>
            <div>
              <p style={{ fontWeight: 600, color: "#f8fafc", fontSize: "0.95rem" }}>SKU-Specific Report</p>
              <p style={{ fontSize: "0.8rem", color: "#64748b", marginTop: 2 }}>
                Download detailed forecast for a specific SKU
              </p>
            </div>
          </div>

          <div style={{ display: "flex", gap: "0.75rem", marginBottom: "0.75rem" }}>
            <select
              value={selectedSku}
              onChange={e => setSelectedSku(e.target.value)}
              style={{ flex: 1 }}
            >
              <option value="">Select SKU</option>
              {uniqueSkus.map(sku => <option key={sku} value={sku}>{sku}</option>)}
            </select>
          </div>

          {selectedSku && (
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              {[7, 15, 30].map(h => (
                <div key={h} style={{ display: "flex", gap: "0.25rem" }}>
                  <a
                    href={`${API_URL}/reports/forecast/${selectedSku}/csv?horizon=${h}`}
                    className="btn btn-outline"
                    style={{ fontSize: "0.75rem" }}
                  >
                    CSV {h}d
                  </a>
                  <a
                    href={`${API_URL}/reports/forecast/${selectedSku}/pdf?horizon=${h}`}
                    className="btn btn-primary"
                    style={{ fontSize: "0.75rem" }}
                  >
                    PDF {h}d
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sample Data */}
        <ReportCard
          icon={FileText}
          title="Sample CSV Template"
          description="Download the sample inventory CSV format for data upload"
          actions={[
            {
              label: "Download Template",
              type: "outline",
              onClick: () => {
                const csv = "date,sku,sales,stock\n2024-01-01,SKU001,45,500\n2024-01-02,SKU001,52,455";
                const blob = new Blob([csv], { type: "text/csv" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url; a.download = "sample_inventory_template.csv";
                a.click();
                URL.revokeObjectURL(url);
              }
            }
          ]}
        />
      </div>

      {/* Inventory Turnover Analysis */}
      {!loading && turnoverData.length > 0 && (
        <div className="card" style={{ marginBottom: "1.5rem" }}>
          <h3 style={{ fontSize: "0.9rem", fontWeight: 600, marginBottom: "1rem", color: "#f8fafc" }}>
            Inventory Turnover Analysis
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={turnoverData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="sku" tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={false} />
              <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} />
              <Tooltip
                contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8 }}
                labelStyle={{ color: "#f8fafc" }}
                itemStyle={{ color: "#94a3b8" }}
              />
              <Legend wrapperStyle={{ fontSize: 12, color: "#94a3b8" }} />
              <Bar dataKey="turnover" name="Turnover Rate" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <p style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "0.75rem" }}>
            Turnover Rate = Total Historical Sales / Average Stock Level. Higher values indicate faster-moving inventory.
          </p>
        </div>
      )}
    </div>
  );
}
