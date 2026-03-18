import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Package, Eye, EyeOff, Loader } from "lucide-react";
import toast from "react-hot-toast";

export default function Login() {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return toast.error("Email and password required");
    if (isRegister && !name) return toast.error("Name is required");
    
    setLoading(true);
    try {
      if (isRegister) {
        await register(email, password, name);
        toast.success("Account created!");
      } else {
        await login(email, password);
        toast.success("Welcome back!");
      }
      navigate("/dashboard");
    } catch (err) {
      const msg = err?.code === "auth/user-not-found" ? "User not found"
        : err?.code === "auth/wrong-password" ? "Incorrect password"
        : err?.code === "auth/email-already-in-use" ? "Email already registered"
        : err?.code === "auth/weak-password" ? "Password must be 6+ characters"
        : "Authentication failed";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0f172a",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "1rem"
    }}>
      <div style={{ width: "100%", maxWidth: 420 }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{
            width: 56, height: 56, borderRadius: 14,
            background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            marginBottom: "1rem"
          }}>
            <Package size={28} color="white" />
          </div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#f8fafc" }}>
            Inventory Forecasting
          </h1>
          <p style={{ color: "#94a3b8", fontSize: "0.875rem", marginTop: 4 }}>
            AI-Powered ERP Intelligence System
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: "#1e293b",
          border: "1px solid #334155",
          borderRadius: 16,
          padding: "2rem"
        }}>
          <h2 style={{ fontSize: "1.125rem", fontWeight: 600, color: "#f8fafc", marginBottom: "1.5rem" }}>
            {isRegister ? "Create an Account" : "Sign In"}
          </h2>

          <form onSubmit={handleSubmit}>
            {isRegister && (
              <div style={{ marginBottom: "1rem" }}>
                <label style={{ display: "block", fontSize: "0.8rem", color: "#94a3b8", marginBottom: 6 }}>
                  Full Name
                </label>
                <input
                  type="text"
                  placeholder="John Doe"
                  value={name}
                  onChange={e => setName(e.target.value)}
                />
              </div>
            )}

            <div style={{ marginBottom: "1rem" }}>
              <label style={{ display: "block", fontSize: "0.8rem", color: "#94a3b8", marginBottom: 6 }}>
                Email Address
              </label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>

            <div style={{ marginBottom: "1.5rem" }}>
              <label style={{ display: "block", fontSize: "0.8rem", color: "#94a3b8", marginBottom: 6 }}>
                Password
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  style={{ paddingRight: "2.5rem" }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
                    background: "none", border: "none", color: "#94a3b8", cursor: "pointer"
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: "0.75rem",
                background: loading ? "#334155" : "linear-gradient(135deg, #3b82f6, #6366f1)",
                color: "white",
                border: "none",
                borderRadius: 8,
                fontWeight: 600,
                fontSize: "0.9rem",
                cursor: loading ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
                transition: "all 0.15s"
              }}
            >
              {loading && <Loader size={16} style={{ animation: "spin 0.7s linear infinite" }} />}
              {loading ? "Processing..." : isRegister ? "Create Account" : "Sign In"}
            </button>
          </form>

          <p style={{ textAlign: "center", marginTop: "1rem", fontSize: "0.875rem", color: "#94a3b8" }}>
            {isRegister ? "Already have an account? " : "Don't have an account? "}
            <button
              onClick={() => setIsRegister(!isRegister)}
              style={{
                background: "none", border: "none",
                color: "#3b82f6", cursor: "pointer",
                fontWeight: 600, fontSize: "0.875rem"
              }}
            >
              {isRegister ? "Sign In" : "Register"}
            </button>
          </p>
        </div>

        <p style={{ textAlign: "center", marginTop: "1rem", fontSize: "0.75rem", color: "#475569" }}>
          IGNOU MCA Final Year Project — Inventory Forecasting System
        </p>
      </div>
    </div>
  );
}
