import { useState, useEffect } from "react";
import {
  Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, Area, AreaChart
} from "recharts";
import axiosInstance from "../api/axiosInstance";
import { TrendingUp, Search, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";

const HORIZONS = [
  { label: "7 Days", value: 7 },
  { label: "15 Days", value: 15 },
  { label: "30 Days", value: 30 },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "#1e293b", border: "1px solid #334155",
      borderRadius: 8, padding: "0.75rem", fontSize: "0.8rem"
    }}>
      <p style={{ color: "#94a3b8", marginBottom: 4 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>
          {p.name}: <strong>{p.value?.toFixed(2)}</strong>
        </p>
      ))}
    </div>
  );
};

export default function ForecastPage() {
  const [skuInput, setSkuInput] = useState("");
  const [selectedSku, setSelectedSku] = useState("");
  const [horizon, setHorizon] = useState(30);
  const [forecast, setForecast] = useState(null);
  const [allForecasts, setAllForecasts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingAll, setLoadingAll] = useState(true);

  // Load all forecasts on mount
  useEffect(() => {
    axiosInstance.get("/forecast-all")
      .then(res => {
        const data = res.data.data || [];
        setAllForecasts(data);
        // Auto-select first SKU
        if (data.length > 0 && data[0].sku) {
          setSkuInput(data[0].sku);
          setSelectedSku(data[0].sku);
        }
      })
      .catch(() => toast.error("Failed to load forecasts"))
      .finally(() => setLoadingAll(false));
  }, []);

  // Fetch forecast when SKU or horizon changes
  useEffect(() => {
    if (!selectedSku) return;
    fetchForecast(selectedSku, horizon);
  }, [selectedSku, horizon]);

  const fetchForecast = async (sku, h) => {
    setLoading(true);
    try {
      const res = await axiosInstance.get(`/forecast/${sku}?horizon=${h}`);
      setForecast(res.data.data);
    } catch (err) {
      if (err.response?.status === 404) {
        toast.error(`No forecast found for ${sku}. Upload data first.`);
      } else {
        toast.error("Failed to fetch forecast");
      }
      setForecast(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (!skuInput.trim()) return;
    setSelectedSku(skuInput.trim().toUpperCase());
  };

  // Extract unique SKUs from allForecasts
  const uniqueSkus = [...new Set(
    allForecasts.map(f => f.sku).filter(Boolean)
  )];

  const riskColors = { HIGH: "#ef4444", MEDIUM: "#f59e0b", LOW: "#10b981" };
  const risk = forecast?.stockout_risk || "LOW";

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Demand Forecasting</h1>
        <p className="page-subtitle">AI-powered SKU-wise demand predictions using Facebook Prophet</p>
      </div>

      {/* Controls */}
      <div className="card" style={{ marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "flex-end" }}>
          {/* SKU Search */}
          <div style={{ flex: 1, minWidth: 200 }}>
            <label style={{ display: "block", fontSize: "0.8rem", color: "#94a3b8", marginBottom: 6 }}>
              Select SKU
            </label>
            <form onSubmit={handleSearch} style={{ display: "flex", gap: "0.5rem" }}>
              <input
                type="text"
                placeholder="e.g. SKU001"
                value={skuInput}
                onChange={e => setSkuInput(e.target.value.toUpperCase())}
                list="sku-list"
              />
              <datalist id="sku-list">
                {uniqueSkus.map(sku => <option key={sku} value={sku} />)}
              </datalist>
              <button type="submit" className="btn btn-primary" style={{ whiteSpace: "nowrap" }}>
                <Search size={14} /> Search
              </button>
            </form>
          </div>

          {/* Horizon Selection */}
          <div>
            <label style={{ display: "block", fontSize: "0.8rem", color: "#94a3b8", marginBottom: 6 }}>
              Forecast Horizon
            </label>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              {HORIZONS.map(h => (
                <button
                  key={h.value}
                  onClick={() => setHorizon(h.value)}
                  className={horizon === h.value ? "btn btn-primary" : "btn btn-outline"}
                >
                  {h.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Quick SKU Tabs */}
        {uniqueSkus.length > 0 && (
          <div style={{ marginTop: "1rem", display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            <span style={{ fontSize: "0.75rem", color: "#64748b", alignSelf: "center" }}>Quick select:</span>
            {uniqueSkus.map(sku => (
              <button
                key={sku}
                onClick={() => { setSkuInput(sku); setSelectedSku(sku); }}
                style={{
                  padding: "3px 12px",
                  borderRadius: 999,
                  border: `1px solid ${selectedSku === sku ? "#3b82f6" : "#334155"}`,
                  background: selectedSku === sku ? "rgba(59,130,246,0.1)" : "transparent",
                  color: selectedSku === sku ? "#3b82f6" : "#94a3b8",
                  fontSize: "0.75rem",
                  cursor: "pointer"
                }}
              >
                {sku}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 200 }}>
          <div className="spinner" />
        </div>
      )}

      {/* No data */}
      {!loading && !forecast && (
        <div className="card" style={{ textAlign: "center", padding: "3rem" }}>
          <TrendingUp size={40} style={{ margin: "0 auto 1rem", color: "#334155" }} />
          <p style={{ color: "#94a3b8" }}>
            {loadingAll ? "Loading SKUs..." : "Search for a SKU or upload data to see forecasts"}
          </p>
        </div>
      )}

      {/* Forecast Display */}
      {!loading && forecast && (
        <>
          {/* Summary Cards */}
          <div className="grid-4" style={{ marginBottom: "1.5rem" }}>
            <div className="card">
              <p style={{ fontSize: "0.75rem", color: "#94a3b8" }}>SKU</p>
              <p style={{ fontSize: "1.4rem", fontWeight: 700, color: "#f8fafc" }}>{forecast.sku}</p>
            </div>
            <div className="card">
              <p style={{ fontSize: "0.75rem", color: "#94a3b8" }}>Current Stock</p>
              <p style={{ fontSize: "1.4rem", fontWeight: 700, color: "#f8fafc" }}>
                {(forecast.current_stock || 0).toLocaleString()}
              </p>
            </div>
            <div className="card">
              <p style={{ fontSize: "0.75rem", color: "#94a3b8" }}>Forecasted Demand ({horizon}d)</p>
              <p style={{ fontSize: "1.4rem", fontWeight: 700, color: "#f59e0b" }}>
                {(forecast.total_forecasted_demand || 0).toLocaleString()}
              </p>
            </div>
            <div className="card">
              <p style={{ fontSize: "0.75rem", color: "#94a3b8" }}>Stockout Risk</p>
              <span className={`badge badge-${risk.toLowerCase()}`} style={{ fontSize: "1rem", padding: "4px 12px" }}>
                {risk}
              </span>
              {forecast.days_until_stockout && (
                <p style={{ fontSize: "0.75rem", color: "#94a3b8", marginTop: 4 }}>
                  ~{forecast.days_until_stockout} days until stockout
                </p>
              )}
            </div>
          </div>

          {/* Risk Alert Banner */}
          {risk !== "LOW" && (
            <div style={{
              padding: "0.875rem 1.25rem",
              background: `${riskColors[risk]}15`,
              border: `1px solid ${riskColors[risk]}40`,
              borderRadius: 10,
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              marginBottom: "1.5rem"
            }}>
              <AlertCircle size={18} color={riskColors[risk]} />
              <p style={{ color: riskColors[risk], fontSize: "0.875rem" }}>
                <strong>{risk} RISK:</strong>{" "}
                {risk === "HIGH"
                  ? `SKU ${forecast.sku} will stock out in approximately ${forecast.days_until_stockout || "a few"} days. Immediate restocking recommended.`
                  : `SKU ${forecast.sku} stock levels may be insufficient. Monitor closely and consider restocking.`
                }
              </p>
            </div>
          )}

          {/* Forecast Chart */}
          <div className="card" style={{ marginBottom: "1.5rem" }}>
            <h3 style={{ fontSize: "0.9rem", fontWeight: 600, marginBottom: "1rem", color: "#f8fafc" }}>
              {horizon}-Day Demand Forecast for {forecast.sku}
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={forecast.forecast}>
                <defs>
                  <linearGradient id="predictedGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="upperGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis
                  dataKey="date"
                  tick={{ fill: "#64748b", fontSize: 10 }}
                  tickFormatter={d => d.slice(5)}
                  axisLine={false}
                />
                <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12, color: "#94a3b8" }} />
                <Area
                  type="monotone"
                  dataKey="upper"
                  name="Upper Bound"
                  stroke="#8b5cf6"
                  strokeWidth={1}
                  strokeDasharray="4 4"
                  fill="url(#upperGrad)"
                />
                <Area
                  type="monotone"
                  dataKey="predicted"
                  name="Predicted Demand"
                  stroke="#3b82f6"
                  strokeWidth={2.5}
                  fill="url(#predictedGrad)"
                />
                <Line
                  type="monotone"
                  dataKey="lower"
                  name="Lower Bound"
                  stroke="#64748b"
                  strokeWidth={1}
                  strokeDasharray="4 4"
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Forecast Table */}
          <div className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h3 style={{ fontSize: "0.9rem", fontWeight: 600, color: "#f8fafc" }}>
                Daily Forecast Data
              </h3>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <a
                  href={`${process.env.REACT_APP_API_URL}/reports/forecast/${forecast.sku}/csv?horizon=${horizon}`}
                  className="btn btn-outline"
                  style={{ fontSize: "0.8rem" }}
                >
                  Export CSV
                </a>
                <a
                  href={`${process.env.REACT_APP_API_URL}/reports/forecast/${forecast.sku}/pdf?horizon=${horizon}`}
                  className="btn btn-primary"
                  style={{ fontSize: "0.8rem" }}
                >
                  Export PDF
                </a>
              </div>
            </div>
            <div style={{ maxHeight: 320, overflowY: "auto" }}>
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Date</th>
                    <th>Predicted</th>
                    <th>Lower Bound</th>
                    <th>Upper Bound</th>
                  </tr>
                </thead>
                <tbody>
                  {(forecast.forecast || []).map((row, i) => (
                    <tr key={i}>
                      <td style={{ color: "#64748b" }}>{i + 1}</td>
                      <td style={{ color: "#f8fafc" }}>{row.date}</td>
                      <td style={{ color: "#3b82f6", fontWeight: 600 }}>{row.predicted}</td>
                      <td style={{ color: "#64748b" }}>{row.lower}</td>
                      <td style={{ color: "#8b5cf6" }}>{row.upper}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
