from services.firebase_service import save_alert, get_all_alerts, resolve_alert
from datetime import datetime


def generate_and_save_alerts(forecast_results: list) -> list:
    """
    Analyze forecast results and generate stockout alerts.
    forecast_results: list of dicts from forecast_all_skus()
    """
    generated_alerts = []
    
    for result in forecast_results:
        if "error" in result:
            continue
        
        sku = result["sku"]
        risk = result.get("stockout_risk", "LOW")
        current_stock = result.get("current_stock", 0)
        total_demand = result.get("total_forecasted_demand", 0)
        days_until_stockout = result.get("days_until_stockout")
        
        # Only create alerts for MEDIUM and HIGH risk
        if risk in ("MEDIUM", "HIGH"):
            alert = {
                "sku": sku,
                "risk_level": risk,
                "current_stock": current_stock,
                "forecasted_demand_30d": total_demand,
                "days_until_stockout": days_until_stockout,
                "shortage_quantity": round(max(0, total_demand - current_stock), 2),
                "message": _build_alert_message(sku, risk, current_stock, days_until_stockout),
                "resolved": False,
                "alert_date": datetime.utcnow().strftime("%Y-%m-%d")
            }
            alert_id = save_alert(alert)
            alert["id"] = alert_id
            generated_alerts.append(alert)
    
    return generated_alerts


def _build_alert_message(sku, risk, stock, days):
    if risk == "HIGH":
        if days and days <= 7:
            return f"CRITICAL: SKU {sku} will stock out in {days} days. Current stock: {stock} units."
        return f"HIGH RISK: SKU {sku} forecasted demand significantly exceeds current stock of {stock} units."
    else:
        if days:
            return f"WARNING: SKU {sku} may stock out in approximately {days} days. Current stock: {stock} units."
        return f"MEDIUM RISK: SKU {sku} has low stock relative to forecasted demand."


def get_alerts(resolved: bool = None) -> list:
    """Retrieve alerts from Firestore."""
    return get_all_alerts(resolved)


def mark_alert_resolved(alert_id: str) -> bool:
    """Mark an alert as resolved."""
    try:
        resolve_alert(alert_id)
        return True
    except Exception:
        return False


def get_alert_summary() -> dict:
    """Return alert counts by risk level."""
    all_alerts = get_all_alerts(resolved=False)
    high = sum(1 for a in all_alerts if a.get("risk_level") == "HIGH")
    medium = sum(1 for a in all_alerts if a.get("risk_level") == "MEDIUM")
    low = sum(1 for a in all_alerts if a.get("risk_level") == "LOW")
    return {
        "total_active": len(all_alerts),
        "high": high,
        "medium": medium,
        "low": low
    }
