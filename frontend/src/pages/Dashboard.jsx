import { useState, useEffect, useCallback } from "react";
import {
  Package, TrendingUp, Bell, RefreshCw,
  AlertTriangle, CheckCircle, BarChart2, Upload
} from "lucide-react";
import axiosInstance from "../api/axiosInstance";
import toast from "react-hot-toast";
import UploadForm from "../components/UploadForm";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, BarChart, Bar, Legend
} from "recharts";

function StatCard({ icon: Icon, label, value, color, sub }) {
  return (
    <div className="card" style={{ position: "relative", overflow: "hidden" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <p style={{ fontSize: "0.8rem", color: "#94a3b8", marginBottom: 4 }}>{label}</p>
          <p style={{ fontSize: "1.75rem", fontWeight: 700, color: "#f8fafc" }}>{value}</p>
          {sub && <p style={{ fontSize: "0.75rem", color: "#64748b", marginTop: 2 }}>{sub}</p>}
        </div>
        <div style={{
          width: 44, height: 44, borderRadius: 10,
          background: `${color}20`,
          display: "flex", alignItems: "center", justifyContent: "center"
        }}>
          <Icon size={22} color={color} />
        </div>
      </div>
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0,
        height: 3, background: color, opacity: 0.6
      }} />
    </div>
  );
}

const COLORS = { HIGH: "#ef4444", MEDIUM: "#f59e0b", LOW: "#10b981" };

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, productsRes] = await Promise.all([
        axiosInstance.get("/dashboard-stats"),
        axiosInstance.get("/products")
      ]);
      setStats(statsRes.data.data);
      setProducts(productsRes.data.data || []);
    } 
    // catch (err) {
    //   toast.error("Failed to load dashboard data");
    // } 
    catch (err) {
      console.error("Dashboard API Error:", err.response?.data || err);
      toast.error(err.response?.data?.error || "Failed to load dashboard data");
    }
    
    finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleUploadSuccess = () => {
    setShowUpload(false);
    toast.success("Data uploaded! Forecasts generated.");
    fetchData();
  };

  // Build chart data from products
  const riskChartData = [
    { name: "HIGH", count: products.filter(p => p.stockout_risk === "HIGH").length, fill: "#ef4444" },
    { name: "MEDIUM", count: products.filter(p => p.stockout_risk === "MEDIUM").length, fill: "#f59e0b" },
    { name: "LOW", count: products.filter(p => p.stockout_risk === "LOW").length, fill: "#10b981" },
  ];

  const demandChartData = products.slice(0, 10).map(p => ({
    sku: p.sku,
    stock: p.current_stock || 0,
    demand: p.forecasted_demand_30d || 0
  }));

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 300 }}>
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
        <div className="page-header">
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Inventory overview and stockout intelligence</p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button className="btn btn-outline" onClick={fetchData}>
            <RefreshCw size={15} /> Refresh
          </button>
          <button className="btn btn-primary" onClick={() => setShowUpload(!showUpload)}>
            <Upload size={15} /> Upload Data
          </button>
        </div>
      </div>

      {/* Upload Form */}
      {showUpload && (
        <div style={{ marginBottom: "1.5rem" }}>
          <UploadForm onSuccess={handleUploadSuccess} />
        </div>
      )}

      {/* Stat Cards */}
      {stats && (
        <div className="grid-4" style={{ marginBottom: "1.5rem" }}>
          <StatCard
            icon={Package}
            label="Total SKUs"
            value={stats.total_skus || 0}
            color="#3b82f6"
            sub="Products tracked"
          />
          <StatCard
            icon={BarChart2}
            label="Total Stock Units"
            value={(stats.total_stock_units || 0).toLocaleString()}
            color="#8b5cf6"
            sub="Across all SKUs"
          />
          <StatCard
            icon={TrendingUp}
            label="Avg Turnover Rate"
            value={stats.avg_turnover_rate || 0}
            color="#10b981"
            sub="Sales / Avg Stock"
          />
          <StatCard
            icon={Bell}
            label="Active Alerts"
            value={stats.alert_summary?.total_active || 0}
            color="#ef4444"
            sub={`${stats.alert_summary?.high || 0} HIGH risk`}
          />
        </div>
      )}

      {/* Charts Row */}
      <div className="grid-2" style={{ marginBottom: "1.5rem" }}>
        {/* Risk Distribution */}
        <div className="card">
          <h3 style={{ fontSize: "0.9rem", fontWeight: 600, marginBottom: "1rem", color: "#f8fafc" }}>
            Stockout Risk Distribution
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={riskChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={false} />
              <YAxis tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={false} />
              <Tooltip
                contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8 }}
                labelStyle={{ color: "#f8fafc" }}
                itemStyle={{ color: "#94a3b8" }}
              />
              <Bar dataKey="count" name="SKUs" radius={[4, 4, 0, 0]}>
                {riskChartData.map((entry, index) => (
                  <rect key={index} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Stock vs Demand */}
        <div className="card">
          <h3 style={{ fontSize: "0.9rem", fontWeight: 600, marginBottom: "1rem", color: "#f8fafc" }}>
            Stock vs 30-Day Forecasted Demand
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={demandChartData} barSize={14}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="sku" tick={{ fill: "#94a3b8", fontSize: 10 }} axisLine={false} />
              <YAxis tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={false} />
              <Tooltip
                contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8 }}
                labelStyle={{ color: "#f8fafc" }}
                itemStyle={{ color: "#94a3b8" }}
              />
              <Legend wrapperStyle={{ fontSize: 12, color: "#94a3b8" }} />
              <Bar dataKey="stock" name="Current Stock" fill="#3b82f6" radius={[3, 3, 0, 0]} />
              <Bar dataKey="demand" name="Forecasted Demand" fill="#ef4444" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Products Table */}
      <div className="card">
        <h3 style={{ fontSize: "0.9rem", fontWeight: 600, marginBottom: "1rem", color: "#f8fafc" }}>
          Product Risk Overview
        </h3>
        {products.length === 0 ? (
          <div style={{ textAlign: "center", padding: "3rem", color: "#64748b" }}>
            <Package size={40} style={{ margin: "0 auto 0.75rem", opacity: 0.4 }} />
            <p>No products yet. Upload a CSV to get started.</p>
            <button
              className="btn btn-primary"
              onClick={() => setShowUpload(true)}
              style={{ margin: "1rem auto 0" }}
            >
              <Upload size={15} /> Upload Data
            </button>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table>
              <thead>
                <tr>
                  <th>SKU</th>
                  <th>Current Stock</th>
                  <th>30-Day Forecast</th>
                  <th>Total Sales</th>
                  <th>Risk Level</th>
                  <th>Last Updated</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 600, color: "#f8fafc" }}>{p.sku}</td>
                    <td>{(p.current_stock || 0).toLocaleString()}</td>
                    <td>{(p.forecasted_demand_30d || 0).toLocaleString()}</td>
                    <td>{(p.total_sales || 0).toLocaleString()}</td>
                    <td>
                      <span className={`badge badge-${(p.stockout_risk || "LOW").toLowerCase()}`}>
                        {p.stockout_risk || "N/A"}
                      </span>
                    </td>
                    <td style={{ color: "#94a3b8" }}>{p.last_updated || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
