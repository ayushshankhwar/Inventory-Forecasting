from flask import Blueprint, request, send_file, Response
import io
from services.auth_service import require_auth
from services.forecast_service import get_sku_forecast, get_all_skus_forecast
from services.alert_service import get_alerts
from services.export_service import (
    export_forecast_csv,
    export_forecast_pdf,
    export_all_forecasts_csv,
    export_alerts_csv
)
from utils.response_helper import error

report_bp = Blueprint("reports", __name__)


@report_bp.route("/reports/forecast/<string:sku>/csv", methods=["GET"])
@require_auth
def download_forecast_csv(sku):
    """Download forecast data as CSV for a specific SKU."""
    try:
        horizon = int(request.args.get("horizon", 30))
        data = get_sku_forecast(sku.upper(), horizon)
        if not data:
            return error(f"No forecast found for SKU '{sku}'", 404)
        
        csv_bytes = export_forecast_csv(data)
        return Response(
            csv_bytes,
            mimetype="text/csv",
            headers={
                "Content-Disposition": f"attachment; filename=forecast_{sku}_{horizon}d.csv",
                "Content-Type": "text/csv"
            }
        )
    except Exception as e:
        return error(str(e), 500)


@report_bp.route("/reports/forecast/<string:sku>/pdf", methods=["GET"])
@require_auth
def download_forecast_pdf(sku):
    """Download forecast data as PDF for a specific SKU."""
    try:
        horizon = int(request.args.get("horizon", 30))
        data = get_sku_forecast(sku.upper(), horizon)
        if not data:
            return error(f"No forecast found for SKU '{sku}'", 404)
        
        pdf_bytes = export_forecast_pdf(data)
        return Response(
            pdf_bytes,
            mimetype="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename=forecast_{sku}_{horizon}d.pdf",
                "Content-Type": "application/pdf"
            }
        )
    except Exception as e:
        return error(str(e), 500)


@report_bp.route("/reports/forecast-all/csv", methods=["GET"])
@require_auth
def download_all_forecasts_csv():
    """Download all SKU forecasts as CSV."""
    try:
        data = get_all_skus_forecast()
        csv_bytes = export_all_forecasts_csv(data)
        return Response(
            csv_bytes,
            mimetype="text/csv",
            headers={
                "Content-Disposition": "attachment; filename=all_forecasts.csv",
                "Content-Type": "text/csv"
            }
        )
    except Exception as e:
        return error(str(e), 500)


@report_bp.route("/reports/alerts/csv", methods=["GET"])
@require_auth
def download_alerts_csv():
    """Download alerts report as CSV."""
    try:
        alerts = get_alerts()
        csv_bytes = export_alerts_csv(alerts)
        return Response(
            csv_bytes,
            mimetype="text/csv",
            headers={
                "Content-Disposition": "attachment; filename=stockout_alerts.csv",
                "Content-Type": "text/csv"
            }
        )
    except Exception as e:
        return error(str(e), 500)
