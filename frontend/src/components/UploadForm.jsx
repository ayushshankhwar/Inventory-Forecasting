import React, { useState, useRef } from "react";
import axiosInstance from "../api/axiosInstance";
import { Upload, X, FileText, CheckCircle, AlertCircle, Loader } from "lucide-react";
import toast from "react-hot-toast";

export default function UploadForm({ onSuccess }) {
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const inputRef = useRef();

  const handleFile = (f) => {
    if (!f) return;
    if (!f.name.toLowerCase().endsWith(".csv")) {
      toast.error("Only CSV files are accepted");
      return;
    }
    setFile(f);
    setResult(null);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    handleFile(f);
  };

  const handleUpload = async () => {
    if (!file) return toast.error("Please select a file first");
    setUploading(true);
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await axiosInstance.post("/upload-data", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 120000 // 2 mins — Prophet can be slow
      });
      setResult({ success: true, data: res.data.data });
      toast.success(`Forecasts generated for ${res.data.data?.total_skus_processed || 0} SKUs!`);
      if (onSuccess) onSuccess(res.data.data);
    } catch (err) {
      const msg = err.response?.data?.error || "Upload failed";
      setResult({ success: false, message: msg });
      toast.error(msg);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="card">
      <h3 style={{ fontSize: "0.9rem", fontWeight: 600, color: "#f8fafc", marginBottom: "1rem" }}>
        Upload Inventory Data
      </h3>

      {/* Required format note */}
      <div style={{
        padding: "0.75rem",
        background: "rgba(59,130,246,0.05)",
        border: "1px solid rgba(59,130,246,0.2)",
        borderRadius: 8,
        marginBottom: "1rem",
        fontSize: "0.8rem",
        color: "#94a3b8"
      }}>
        Required CSV columns: <code style={{ color: "#3b82f6" }}>date, sku, sales, stock</code>
        <span style={{ margin: "0 0.5rem" }}>•</span>
        Date format: <code style={{ color: "#3b82f6" }}>YYYY-MM-DD</code>
      </div>

      {/* Drop Zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        style={{
          border: `2px dashed ${dragging ? "#3b82f6" : file ? "#10b981" : "#334155"}`,
          borderRadius: 10,
          padding: "2rem",
          textAlign: "center",
          cursor: "pointer",
          background: dragging ? "rgba(59,130,246,0.05)" : "transparent",
          transition: "all 0.15s",
          marginBottom: "1rem"
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".csv"
          style={{ display: "none" }}
          onChange={e => handleFile(e.target.files[0])}
        />
        {file ? (
          <div>
            <FileText size={28} color="#10b981" style={{ margin: "0 auto 0.5rem" }} />
            <p style={{ color: "#10b981", fontWeight: 600 }}>{file.name}</p>
            <p style={{ fontSize: "0.75rem", color: "#64748b" }}>
              {(file.size / 1024).toFixed(1)} KB
            </p>
          </div>
        ) : (
          <div>
            <Upload size={28} color="#334155" style={{ margin: "0 auto 0.5rem" }} />
            <p style={{ color: "#94a3b8", fontSize: "0.875rem" }}>
              Drag & drop your CSV here, or <span style={{ color: "#3b82f6" }}>browse</span>
            </p>
            <p style={{ fontSize: "0.75rem", color: "#64748b", marginTop: 4 }}>Max 10MB</p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
        <button
          onClick={handleUpload}
          disabled={!file || uploading}
          className="btn btn-primary"
          style={{ opacity: !file || uploading ? 0.6 : 1 }}
        >
          {uploading ? (
            <><Loader size={14} style={{ animation: "spin 0.7s linear infinite" }} /> Processing...</>
          ) : (
            <><Upload size={14} /> Upload & Generate Forecasts</>
          )}
        </button>

        {file && !uploading && (
          <button
            onClick={() => { setFile(null); setResult(null); }}
            className="btn btn-outline"
          >
            <X size={14} /> Clear
          </button>
        )}

        {uploading && (
          <p style={{ fontSize: "0.75rem", color: "#94a3b8" }}>
            Training Prophet models... this may take 1–2 minutes.
          </p>
        )}
      </div>

      {/* Result */}
      {result && (
        <div style={{
          marginTop: "1rem",
          padding: "0.875rem",
          borderRadius: 8,
          background: result.success ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
          border: `1px solid ${result.success ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)"}`,
          display: "flex", alignItems: "flex-start", gap: "0.75rem"
        }}>
          {result.success ? (
            <CheckCircle size={18} color="#10b981" style={{ flexShrink: 0, marginTop: 1 }} />
          ) : (
            <AlertCircle size={18} color="#ef4444" style={{ flexShrink: 0, marginTop: 1 }} />
          )}
          <div>
            {result.success ? (
              <>
                <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "#10b981" }}>
                  Upload Successful!
                </p>
                <div style={{ fontSize: "0.8rem", color: "#94a3b8", marginTop: 4 }}>
                  <span>SKUs Processed: <strong style={{ color: "#f8fafc" }}>{result.data?.total_skus_processed}</strong></span>
                  <span style={{ margin: "0 0.75rem" }}>•</span>
                  <span>Records: <strong style={{ color: "#f8fafc" }}>{result.data?.total_records}</strong></span>
                  <span style={{ margin: "0 0.75rem" }}>•</span>
                  <span>Date Range: <strong style={{ color: "#f8fafc" }}>{result.data?.date_range?.start} → {result.data?.date_range?.end}</strong></span>
                </div>
              </>
            ) : (
              <p style={{ fontSize: "0.875rem", color: "#ef4444" }}>{result.message}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
