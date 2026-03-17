import React, { useState } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  LayoutDashboard, TrendingUp, Bell, FileText,
  LogOut, Menu, X, Package, ChevronRight
} from "lucide-react";
import toast from "react-hot-toast";

const navItems = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/forecast", icon: TrendingUp, label: "Forecasts" },
  { to: "/alerts", icon: Bell, label: "Alerts" },
  { to: "/reports", icon: FileText, label: "Reports" },
];

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { userProfile, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
      toast.success("Logged out successfully");
    } catch {
      toast.error("Logout failed");
    }
  };

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      {/* Sidebar */}
      <aside
        style={{
          width: sidebarOpen ? "240px" : "64px",
          background: "#1e293b",
          borderRight: "1px solid #334155",
          display: "flex",
          flexDirection: "column",
          transition: "width 0.2s ease",
          overflow: "hidden",
          flexShrink: 0,
        }}
      >
        {/* Logo area */}
        <div style={{
          padding: "1.25rem",
          borderBottom: "1px solid #334155",
          display: "flex",
          alignItems: "center",
          gap: "0.75rem"
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: 8,
            background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0
          }}>
            <Package size={18} color="white" />
          </div>
          {sidebarOpen && (
            <div>
              <div style={{ fontSize: "0.875rem", fontWeight: 700, color: "#f8fafc" }}>InvForecast</div>
              <div style={{ fontSize: "0.7rem", color: "#94a3b8" }}>ERP Intelligence</div>
            </div>
          )}
        </div>

        {/* Nav items */}
        <nav style={{ flex: 1, padding: "0.75rem 0" }}>
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              style={({ isActive }) => ({
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                padding: "0.65rem 1.25rem",
                textDecoration: "none",
                color: isActive ? "#3b82f6" : "#94a3b8",
                background: isActive ? "rgba(59,130,246,0.1)" : "transparent",
                borderRight: isActive ? "2px solid #3b82f6" : "2px solid transparent",
                fontSize: "0.875rem",
                fontWeight: isActive ? 600 : 400,
                transition: "all 0.15s",
              })}
            >
              <Icon size={18} style={{ flexShrink: 0 }} />
              {sidebarOpen && <span>{label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* User + Logout */}
        <div style={{ padding: "0.75rem", borderTop: "1px solid #334155" }}>
          {sidebarOpen && (
            <div style={{
              padding: "0.75rem",
              background: "#0f172a",
              borderRadius: 8,
              marginBottom: "0.5rem"
            }}>
              <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "#f8fafc", marginBottom: 2 }}>
                {userProfile?.name || "User"}
              </div>
              <div style={{ fontSize: "0.7rem", color: "#94a3b8" }}>
                {userProfile?.email}
              </div>
              <span style={{
                display: "inline-block",
                marginTop: 4,
                padding: "1px 8px",
                background: "rgba(59,130,246,0.15)",
                color: "#3b82f6",
                borderRadius: 999,
                fontSize: "0.65rem",
                fontWeight: 600,
                textTransform: "uppercase"
              }}>
                {userProfile?.role || "viewer"}
              </span>
            </div>
          )}
          <button
            onClick={handleLogout}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.6rem 0.75rem",
              background: "transparent",
              border: "none",
              color: "#94a3b8",
              cursor: "pointer",
              borderRadius: 6,
              fontSize: "0.875rem",
              transition: "all 0.15s"
            }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(239,68,68,0.1)"; e.currentTarget.style.color = "#ef4444"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#94a3b8"; }}
          >
            <LogOut size={16} />
            {sidebarOpen && "Logout"}
          </button>
        </div>
      </aside>

      {/* Main area */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Top bar */}
        <header style={{
          height: 56,
          background: "#1e293b",
          borderBottom: "1px solid #334155",
          display: "flex",
          alignItems: "center",
          padding: "0 1.5rem",
          gap: "1rem",
          flexShrink: 0
        }}>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{
              background: "transparent", border: "none",
              color: "#94a3b8", cursor: "pointer",
              display: "flex", alignItems: "center"
            }}
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <span style={{ fontSize: "0.875rem", color: "#94a3b8" }}>
            Inventory Forecasting System
          </span>
        </header>

        {/* Page content */}
        <main style={{
          flex: 1,
          overflow: "auto",
          padding: "1.5rem",
          background: "#0f172a"
        }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
