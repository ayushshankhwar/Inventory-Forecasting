from flask import Blueprint, request
from services.auth_service import require_auth
from services.forecast_service import process_uploaded_csv
from utils.response_helper import success, error

upload_bp = Blueprint("upload", __name__)


@upload_bp.route("/upload-data", methods=["POST"])
@require_auth
def upload_data():
    """
    Upload a CSV file with historical sales data.
    Expected CSV columns: date, sku, sales, stock
    """
    if "file" not in request.files:
        return error("No file provided. Send file as multipart/form-data with key 'file'", 400)
    
    file = request.files["file"]
    
    if file.filename == "":
        return error("No file selected", 400)
    
    if not file.filename.lower().endswith(".csv"):
        return error("Only CSV files are supported", 400)
    
    # Check file size (max 10MB)
    file_bytes = file.read()
    if len(file_bytes) > 10 * 1024 * 1024:
        return error("File size exceeds 10MB limit", 400)
    
    if len(file_bytes) == 0:
        return error("File is empty", 400)
    
    try:
        uid = request.user.get("uid")
        stats = process_uploaded_csv(file_bytes, uploaded_by=uid)
        return success(stats, "Data uploaded and forecasts generated successfully")
    
    except ValueError as e:
        return error(f"Data validation error: {str(e)}", 422)
    except Exception as e:
        return error(f"Processing failed: {str(e)}", 500)
