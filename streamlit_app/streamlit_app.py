"""
Streamlit Demo Dashboard - Inventory Forecasting System
Run: streamlit run streamlit_app.py
"""

import streamlit as st
import pandas as pd
import numpy as np
import sys
import os
import warnings
warnings.filterwarnings("ignore")

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

st.set_page_config(
    page_title="Inventory Forecasting Demo",
    page_icon="📦",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom dark theme styling
st.markdown("""
<style>
    .stApp { background-color: #0f172a; }
    .main { padding-top: 1rem; }
    h1, h2, h3 { color: #f8fafc; }
    .metric-card {
        background: #1e293b; border: 1px solid #334155;
        border-radius: 10px; padding: 1rem; text-align: center;
    }
    .risk-high { color: #ef4444; font-weight: bold; }
    .risk-medium { color: #f59e0b; font-weight: bold; }
    .risk-low { color: #10b981; font-weight: bold; }
</style>
""", unsafe_allow_html=True)


@st.cache_data
def load_and_forecast(csv_bytes, horizon):
    """Load CSV and generate forecasts — cached for performance."""
    from ml.forecast import preprocess_data, forecast_all_skus, get_summary_stats
    
    import io
    df = pd.read_csv(io.BytesIO(csv_bytes))
    df = preprocess_data(df)
    results = forecast_all_skus(df, horizon_days=horizon)
    stats = get_summary_stats(df)
    return df, results, stats


def display_risk_badge(risk):
    colors = {"HIGH": "🔴", "MEDIUM": "🟡", "LOW": "🟢"}
    return f"{colors.get(risk, '⚪')} {risk}"


# ─── SIDEBAR ───

st.sidebar.image("https://upload.wikimedia.org/wikipedia/en/thumb/8/85/IGNOU_logo.svg/200px-IGNOU_logo.svg.png", width=80)
st.sidebar.title("📦 InvForecast")
st.sidebar.caption("IGNOU MCA Final Year Project")
st.sidebar.divider()

uploaded_file = st.sidebar.file_uploader(
    "Upload Inventory CSV",
    type=["csv"],
    help="Required columns: date, sku, sales, stock"
)

horizon = st.sidebar.selectbox(
    "Forecast Horizon",
    options=[7, 15, 30],
    index=2,
    format_func=lambda x: f"{x} Days"
)

st.sidebar.divider()
st.sidebar.markdown("**CSV Format Required:**")
st.sidebar.code("date,sku,sales,stock\n2024-01-01,SKU001,45,500", language="text")

# Download sample
sample_csv = "date,sku,sales,stock\n2024-01-01,SKU001,45,500\n2024-01-02,SKU001,52,455\n2024-01-03,SKU001,38,403"
st.sidebar.download_button(
    "📥 Download Sample CSV",
    data=sample_csv,
    file_name="sample_inventory.csv",
    mime="text/csv"
)


# ─── MAIN CONTENT ───

st.title("📦 Inventory Forecasting System")
st.caption("AI-powered demand forecasting using Facebook Prophet | IGNOU MCA Final Year Project")

if uploaded_file is None:
    # Demo landing
    st.info("👆 Upload an inventory CSV file in the sidebar to get started, or use the sample data below.")

    col1, col2, col3 = st.columns(3)
    with col1:
        st.metric("Supported Horizons", "7, 15, 30 Days")
    with col2:
        st.metric("ML Algorithm", "Facebook Prophet")
    with col3:
        st.metric("Risk Levels", "HIGH / MEDIUM / LOW")

    st.divider()
    st.subheader("📋 How It Works")
    c1, c2, c3, c4 = st.columns(4)
    for col, step, desc in zip(
        [c1, c2, c3, c4],
        ["1️⃣ Upload", "2️⃣ Process", "3️⃣ Forecast", "4️⃣ Act"],
        [
            "Upload CSV with date, SKU, sales, stock",
            "Prophet model trains on historical data",
            "Get 7/15/30-day demand predictions",
            "Get stockout alerts and export reports"
        ]
    ):
        with col:
            st.info(f"**{step}**\n\n{desc}")

    # Show sample dataset preview
    st.subheader("📊 Sample Dataset Preview")
    sample_df = pd.DataFrame({
        "date": ["2024-01-01", "2024-01-02", "2024-01-03"],
        "sku": ["SKU001", "SKU001", "SKU001"],
        "sales": [45, 52, 38],
        "stock": [500, 455, 403]
    })
    st.dataframe(sample_df, use_container_width=True)

else:
    # ── File uploaded — run forecasting ──
    with st.spinner(f"🤖 Training Prophet models... Generating {horizon}-day forecasts..."):
        try:
            df, results, stats = load_and_forecast(uploaded_file.read(), horizon)
        except Exception as e:
            st.error(f"❌ Error processing file: {str(e)}")
            st.stop()

    # ── Summary Metrics ──
    st.subheader("📊 Dataset Summary")
    m1, m2, m3, m4 = st.columns(4)
    m1.metric("Total SKUs", stats["total_skus"])
    m2.metric("Total Records", stats["total_records"])
    m3.metric("Total Sales", f"{stats['total_sales']:,.0f}")
    m4.metric("Avg Daily Sales", f"{stats['avg_daily_sales']:.1f}")

    st.divider()

    # ── SKU Selection ──
    valid_results = [r for r in results if "error" not in r]
    skus = [r["sku"] for r in valid_results]

    if not skus:
        st.error("No valid forecasts generated. Check your data format.")
        st.stop()

    st.subheader("🔍 SKU Forecast Viewer")
    selected_sku = st.selectbox("Select SKU", options=skus)
    result = next((r for r in valid_results if r["sku"] == selected_sku), None)

    if result:
        # ── SKU Metrics ──
        c1, c2, c3, c4 = st.columns(4)
        c1.metric("Current Stock", f"{result['current_stock']:,.0f}")
        c2.metric(f"Forecasted Demand ({horizon}d)", f"{result['total_forecasted_demand']:,.1f}")
        c3.metric("Stockout Risk", display_risk_badge(result["stockout_risk"]))
        c4.metric(
            "Days Until Stockout",
            result["days_until_stockout"] if result["days_until_stockout"] else "Safe ✅"
        )

        # Risk Warning
        if result["stockout_risk"] == "HIGH":
            st.error(f"🚨 HIGH RISK: {selected_sku} will stock out in ~{result.get('days_until_stockout', '?')} days!")
        elif result["stockout_risk"] == "MEDIUM":
            st.warning(f"⚠️ MEDIUM RISK: {selected_sku} has elevated stockout risk. Monitor closely.")
        else:
            st.success(f"✅ LOW RISK: {selected_sku} stock levels are healthy for the forecast period.")

        # ── Forecast Chart ──
        st.subheader(f"📈 {horizon}-Day Demand Forecast — {selected_sku}")
        forecast_df = pd.DataFrame(result["forecast"])
        forecast_df["date"] = pd.to_datetime(forecast_df["date"])
        forecast_df = forecast_df.set_index("date")

        import plotly.graph_objects as go
        fig = go.Figure()
        fig.add_trace(go.Scatter(
            x=forecast_df.index, y=forecast_df["upper"],
            fill=None, mode="lines",
            line=dict(color="rgba(139,92,246,0.3)", dash="dash"),
            name="Upper Bound"
        ))
        fig.add_trace(go.Scatter(
            x=forecast_df.index, y=forecast_df["lower"],
            fill="tonexty", mode="lines",
            line=dict(color="rgba(139,92,246,0.3)", dash="dash"),
            fillcolor="rgba(139,92,246,0.1)",
            name="Confidence Band"
        ))
        fig.add_trace(go.Scatter(
            x=forecast_df.index, y=forecast_df["predicted"],
            mode="lines+markers",
            line=dict(color="#3b82f6", width=2.5),
            marker=dict(size=4),
            name="Predicted Demand"
        ))
        fig.add_hline(
            y=result["current_stock"],
            line_dash="dot", line_color="#ef4444",
            annotation_text=f"Current Stock: {result['current_stock']}"
        )
        fig.update_layout(
            plot_bgcolor="#1e293b", paper_bgcolor="#0f172a",
            font=dict(color="#94a3b8"),
            xaxis=dict(gridcolor="#334155"),
            yaxis=dict(gridcolor="#334155"),
            legend=dict(bgcolor="#1e293b", bordercolor="#334155"),
            height=400
        )
        st.plotly_chart(fig, use_container_width=True)

        # ── Forecast Table ──
        col1, col2 = st.columns([3, 1])
        with col1:
            st.subheader("📋 Forecast Data Table")
            display_df = forecast_df.reset_index().rename(columns={
                "date": "Date", "predicted": "Predicted",
                "lower": "Lower", "upper": "Upper"
            })
            st.dataframe(display_df, use_container_width=True, height=300)
        with col2:
            st.subheader("📥 Export")
            csv_data = display_df.to_csv(index=False)
            st.download_button(
                "Download CSV",
                data=csv_data,
                file_name=f"forecast_{selected_sku}_{horizon}d.csv",
                mime="text/csv",
                use_container_width=True
            )

    st.divider()

    # ── All SKUs Risk Overview ──
    st.subheader("🚦 All SKU Risk Overview")
    overview_data = []
    for r in valid_results:
        overview_data.append({
            "SKU": r["sku"],
            "Current Stock": r["current_stock"],
            f"Forecast ({horizon}d)": round(r["total_forecasted_demand"], 1),
            "Stockout Risk": r["stockout_risk"],
            "Days Until Stockout": r["days_until_stockout"] or "Safe",
            "Turnover Rate": r.get("turnover_rate", 0)
        })

    overview_df = pd.DataFrame(overview_data)

    def color_risk(val):
        if val == "HIGH": return "background-color: rgba(239,68,68,0.2); color: #ef4444"
        if val == "MEDIUM": return "background-color: rgba(245,158,11,0.2); color: #f59e0b"
        return "background-color: rgba(16,185,129,0.2); color: #10b981"

    st.dataframe(
        overview_df.style.map(color_risk, subset=["Stockout Risk"]),
        use_container_width=True
    )

    # Export all
    all_csv = overview_df.to_csv(index=False)
    st.download_button(
        "📥 Download All SKU Summary CSV",
        data=all_csv,
        file_name="all_sku_forecast_summary.csv",
        mime="text/csv"
    )

    # ── Historical Data View ──
    st.divider()
    st.subheader("🗂️ Historical Data Preview")
    sku_hist = df[df["sku"] == selected_sku].copy() if selected_sku else df.copy()
    st.dataframe(sku_hist.tail(30), use_container_width=True)
