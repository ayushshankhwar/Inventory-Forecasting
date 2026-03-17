from flask import Blueprint, request
from services.auth_service import require_auth
from services.alert_service import get_alerts, mark_alert_resolved, get_alert_summary
from utils.response_helper import success, error

alert_bp = Blueprint("alerts", __name__)


@alert_bp.route("/alerts", methods=["GET"])
@require_auth
def get_all_alerts():
    """
    Get all alerts.
    Query param: resolved=true/false (optional filter)
    """
    try:
        resolved_param = request.args.get("resolved")
        resolved = None
        if resolved_param is not None:
            resolved = resolved_param.lower() == "true"
        
        alerts = get_alerts(resolved=resolved)
        return success(alerts)
    except Exception as e:
        return error(str(e), 500)


@alert_bp.route("/alerts/summary", methods=["GET"])
@require_auth
def alerts_summary():
    """Return alert count summary by risk level."""
    try:
        summary = get_alert_summary()
        return success(summary)
    except Exception as e:
        return error(str(e), 500)


@alert_bp.route("/alerts/<string:alert_id>/resolve", methods=["POST"])
@require_auth
def resolve_alert(alert_id):
    """Mark a specific alert as resolved."""
    try:
        result = mark_alert_resolved(alert_id)
        if result:
            return success(message="Alert resolved")
        return error("Failed to resolve alert", 500)
    except Exception as e:
        return error(str(e), 500)
