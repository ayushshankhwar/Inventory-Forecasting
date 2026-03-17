from flask import Blueprint, request
from services.auth_service import require_auth
from services.forecast_service import (
    get_sku_forecast,
    get_all_skus_forecast,
    get_products_with_risk
)
from utils.response_helper import success, error

forecast_bp = Blueprint("forecast", __name__)


@forecast_bp.route("/forecast/<string:sku>", methods=["GET"])
@require_auth
def get_forecast_for_sku(sku):
    """
    Get forecast for a specific SKU.
    Query param: horizon (7, 15, or 30 days) — default 30
    """
    try:
        horizon = int(request.args.get("horizon", 30))
        if horizon not in (7, 15, 30):
            return error("horizon must be 7, 15, or 30", 400)
        
        data = get_sku_forecast(sku.upper(), horizon)
        if not data:
            return error(f"No forecast found for SKU '{sku}'. Upload data first.", 404)
        
        return success(data)
    
    except Exception as e:
        return error(str(e), 500)


@forecast_bp.route("/forecast-all", methods=["GET"])
@require_auth
def get_all_forecasts():
    """Get all SKU forecasts."""
    try:
        data = get_all_skus_forecast()
        return success(data)
    except Exception as e:
        return error(str(e), 500)


@forecast_bp.route("/products", methods=["GET"])
@require_auth
def get_products():
    """Get all products with their stockout risk levels."""
    try:
        data = get_products_with_risk()
        return success(data)
    except Exception as e:
        return error(str(e), 500)


@forecast_bp.route("/dashboard-stats", methods=["GET"])
@require_auth
def dashboard_stats():
    """Return aggregated stats for the dashboard overview."""
    try:
        from services.alert_service import get_alert_summary
        from services.firebase_service import get_all_products, get_all_forecasts
        
        products = get_all_products()
        forecasts = get_all_forecasts()
        alert_summary = get_alert_summary()
        
        # Calculate totals
        total_stock_value = sum(p.get("current_stock", 0) for p in products)
        
        # Average turnover rate
        turnover_rates = [
            f.get("turnover_rate", 0)
            for f in forecasts
            if isinstance(f.get("turnover_rate"), (int, float))
        ]
        avg_turnover = round(sum(turnover_rates) / len(turnover_rates), 2) if turnover_rates else 0
        
        # SKUs with HIGH risk
        high_risk_skus = [
            p["sku"] for p in products
            if p.get("stockout_risk") == "HIGH"
        ]
        
        stats = {
            "total_skus": len(products),
            "total_stock_units": round(total_stock_value, 2),
            "avg_turnover_rate": avg_turnover,
            "alert_summary": alert_summary,
            "high_risk_skus": high_risk_skus,
            "total_forecasts": len(forecasts)
        }
        
        return success(stats)
    except Exception as e:
        return error(str(e), 500)
