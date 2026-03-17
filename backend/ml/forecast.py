"""
forecast.py - Core Prophet forecasting module
Handles: data loading, preprocessing, training, multi-SKU forecasting
"""

import pandas as pd
import numpy as np
from prophet import Prophet
import logging
import warnings

warnings.filterwarnings("ignore")
logging.getLogger("prophet").setLevel(logging.WARNING)
logging.getLogger("cmdstanpy").setLevel(logging.WARNING)

logger = logging.getLogger(__name__)


# ─────────────────────── PREPROCESSING ───────────────────────

def preprocess_data(df: pd.DataFrame) -> pd.DataFrame:
    """
    Clean and validate input DataFrame.
    Expected columns: date, sku, sales, stock
    """
    required_cols = {"date", "sku", "sales", "stock"}
    missing = required_cols - set(df.columns.str.lower())
    if missing:
        raise ValueError(f"Missing required columns: {missing}")

    df.columns = df.columns.str.lower().str.strip()
    df["date"] = pd.to_datetime(df["date"], errors="coerce")
    df = df.dropna(subset=["date"])
    df["sales"] = pd.to_numeric(df["sales"], errors="coerce").fillna(0)
    df["stock"] = pd.to_numeric(df["stock"], errors="coerce").fillna(0)
    df["sku"] = df["sku"].astype(str).str.strip().str.upper()
    df = df[df["sales"] >= 0]  # Remove negative sales
    df = df.sort_values("date").reset_index(drop=True)
    return df


def get_latest_stock(df: pd.DataFrame, sku: str) -> float:
    """Return the most recent stock level for a given SKU."""
    sku_df = df[df["sku"] == sku.upper()].sort_values("date", ascending=False)
    if sku_df.empty:
        return 0.0
    return float(sku_df.iloc[0]["stock"])


# ─────────────────────── PROPHET TRAINING ───────────────────────

def train_prophet_model(sku_df: pd.DataFrame) -> Prophet:
    """
    Train a Prophet model for a single SKU.
    sku_df must have columns: date, sales
    """
    prophet_df = sku_df.rename(columns={"date": "ds", "sales": "y"})
    prophet_df = prophet_df[["ds", "y"]].copy()
    
    model = Prophet(
        yearly_seasonality=True,
        weekly_seasonality=True,
        daily_seasonality=False,
        seasonality_mode="multiplicative",
        changepoint_prior_scale=0.05,
        interval_width=0.95
    )
    
    # Add monthly seasonality
    model.add_seasonality(name="monthly", period=30.5, fourier_order=5)
    
    model.fit(prophet_df)
    return model


# ─────────────────────── SINGLE SKU FORECAST ───────────────────────

def forecast_sku(df: pd.DataFrame, sku: str, horizon_days: int = 30) -> dict:
    """
    Generate forecast for a single SKU.
    
    Returns dict with:
        - sku
        - horizon_days
        - forecast: list of {date, predicted, lower, upper}
        - total_forecasted_demand
        - current_stock
        - stockout_risk: LOW / MEDIUM / HIGH
        - days_until_stockout
        - turnover_rate
    """
    sku_df = df[df["sku"] == sku.upper()].copy()
    
    if sku_df.empty:
        raise ValueError(f"No data found for SKU: {sku}")
    
    if len(sku_df) < 2:
        raise ValueError(f"Insufficient data for SKU {sku}: need at least 2 records")

    current_stock = get_latest_stock(df, sku)
    
    # Train model
    model = train_prophet_model(sku_df)
    
    # Create future dataframe
    future = model.make_future_dataframe(periods=horizon_days, freq="D")
    forecast = model.predict(future)
    
    # Extract only future predictions
    last_date = sku_df["date"].max()
    future_forecast = forecast[forecast["ds"] > last_date].copy()
    future_forecast["yhat"] = future_forecast["yhat"].clip(lower=0)
    future_forecast["yhat_lower"] = future_forecast["yhat_lower"].clip(lower=0)
    future_forecast["yhat_upper"] = future_forecast["yhat_upper"].clip(lower=0)
    
    # Build forecast list
    forecast_list = []
    for _, row in future_forecast.iterrows():
        forecast_list.append({
            "date": row["ds"].strftime("%Y-%m-%d"),
            "predicted": round(float(row["yhat"]), 2),
            "lower": round(float(row["yhat_lower"]), 2),
            "upper": round(float(row["yhat_upper"]), 2)
        })
    
    # Calculate total forecasted demand
    total_demand = sum(r["predicted"] for r in forecast_list)
    
    # Calculate stockout risk
    risk, days_until_stockout = calculate_stockout_risk(
        current_stock, forecast_list
    )
    
    # Calculate turnover rate (sales / avg stock over historical period)
    avg_stock = sku_df["stock"].replace(0, np.nan).mean()
    total_historical_sales = sku_df["sales"].sum()
    turnover_rate = round(total_historical_sales / avg_stock, 2) if avg_stock and avg_stock > 0 else 0

    return {
        "sku": sku.upper(),
        "horizon_days": horizon_days,
        "forecast": forecast_list,
        "total_forecasted_demand": round(total_demand, 2),
        "current_stock": current_stock,
        "stockout_risk": risk,
        "days_until_stockout": days_until_stockout,
        "turnover_rate": turnover_rate,
        "data_points_used": len(sku_df)
    }


# ─────────────────────── MULTI-SKU FORECAST ───────────────────────

def forecast_all_skus(df: pd.DataFrame, horizon_days: int = 30) -> list:
    """
    Generate forecasts for all unique SKUs in the dataset.
    Returns list of forecast result dicts.
    """
    skus = df["sku"].unique().tolist()
    results = []
    
    for sku in skus:
        try:
            result = forecast_sku(df, sku, horizon_days)
            results.append(result)
            logger.info(f"Forecast complete for SKU: {sku}")
        except Exception as e:
            logger.error(f"Failed to forecast SKU {sku}: {str(e)}")
            results.append({
                "sku": sku,
                "error": str(e),
                "horizon_days": horizon_days
            })
    
    return results


# ─────────────────────── STOCKOUT RISK ───────────────────────

def calculate_stockout_risk(current_stock: float, forecast_list: list) -> tuple:
    """
    Calculate stockout risk level and days until stockout.
    
    Returns:
        (risk_level: str, days_until_stockout: int or None)
    """
    cumulative = 0.0
    days_until_stockout = None
    
    for i, item in enumerate(forecast_list):
        cumulative += item["predicted"]
        if cumulative >= current_stock and days_until_stockout is None:
            days_until_stockout = i + 1
    
    total_demand = sum(r["predicted"] for r in forecast_list)
    
    if days_until_stockout is None:
        # Stock lasts beyond forecast window
        risk = "LOW"
    elif days_until_stockout <= 7:
        risk = "HIGH"
    elif days_until_stockout <= 15:
        risk = "MEDIUM"
    else:
        risk = "LOW"
    
    # If total forecasted demand > 150% of current stock → HIGH regardless
    if total_demand > current_stock * 1.5:
        if risk == "LOW":
            risk = "MEDIUM"
    
    return risk, days_until_stockout


# ─────────────────────── SUMMARY STATS ───────────────────────

def get_summary_stats(df: pd.DataFrame) -> dict:
    """Return summary statistics for the uploaded dataset."""
    return {
        "total_skus": int(df["sku"].nunique()),
        "total_records": int(len(df)),
        "date_range": {
            "start": df["date"].min().strftime("%Y-%m-%d"),
            "end": df["date"].max().strftime("%Y-%m-%d")
        },
        "total_sales": float(df["sales"].sum()),
        "avg_daily_sales": float(df.groupby("date")["sales"].sum().mean()),
        "skus": df["sku"].unique().tolist()
    }
