import pandas as pd
import io
from ml.forecast import (
    preprocess_data,
    forecast_sku,
    forecast_all_skus,
    get_summary_stats
)
from services.firebase_service import (
    save_forecast,
    get_forecast,
    get_all_forecasts,
    upsert_product,
    get_all_products
)
from services.alert_service import generate_and_save_alerts


def process_uploaded_csv(file_bytes: bytes, uploaded_by: str) -> dict:
    """
    Parse uploaded CSV, run forecast for all SKUs, save to Firestore.
    Returns summary dict.
    """
    df = pd.read_csv(io.BytesIO(file_bytes))
    df = preprocess_data(df)
    
    # Update product collection with latest stock data
    for sku in df["sku"].unique():
        sku_df = df[df["sku"] == sku]
        latest = sku_df.sort_values("date").iloc[-1]
        upsert_product(sku, {
            "sku": sku,
            "current_stock": float(latest["stock"]),
            "last_updated": latest["date"].strftime("%Y-%m-%d"),
            "total_sales": float(sku_df["sales"].sum())
        })
    
    # Run 30-day forecasts for all SKUs
    results = forecast_all_skus(df, horizon_days=30)
    
    saved_count = 0
    for result in results:
        if "error" not in result:
            save_forecast(
                result["sku"],
                result["forecast"],
                result["horizon_days"],
                uploaded_by
            )
            # Also save 7-day and 15-day forecasts
            for horizon in [7, 15]:
                short_result = forecast_sku(df, result["sku"], horizon)
                save_forecast(
                    short_result["sku"],
                    short_result["forecast"],
                    short_result["horizon_days"],
                    uploaded_by
                )
            saved_count += 1
    
    # Generate stockout alerts
    generate_and_save_alerts(results)
    
    stats = get_summary_stats(df)
    stats["forecasts_saved"] = saved_count
    stats["total_skus_processed"] = len(results)
    
    return stats


def get_sku_forecast(sku: str, horizon_days: int = 30) -> dict:
    """Retrieve forecast from Firestore."""
    data = get_forecast(sku.upper(), horizon_days)
    if not data:
        return None
    return data


def get_all_skus_forecast() -> list:
    """Retrieve all forecasts from Firestore."""
    return get_all_forecasts()


def get_products_with_risk() -> list:
    """Enrich products with their stockout risk from latest forecast."""
    products = get_all_products()
    enriched = []
    for product in products:
        sku = product.get("sku")
        forecast_data = get_forecast(sku, 30)
        if forecast_data:
            total_demand = sum(f["predicted"] for f in forecast_data.get("forecast", []))
            stock = product.get("current_stock", 0)
            
            if total_demand == 0:
                risk = "LOW"
            elif stock == 0:
                risk = "HIGH"
            elif total_demand > stock * 1.5:
                risk = "HIGH"
            elif total_demand > stock:
                risk = "MEDIUM"
            else:
                risk = "LOW"
            
            product["stockout_risk"] = risk
            product["forecasted_demand_30d"] = round(total_demand, 2)
        enriched.append(product)
    return enriched
