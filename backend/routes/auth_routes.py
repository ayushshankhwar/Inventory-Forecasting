from flask import Blueprint, request
from firebase_admin import auth
from services.firebase_service import create_user_profile, get_user_profile
from services.auth_service import require_auth
from utils.response_helper import success, error

auth_bp = Blueprint("auth", __name__)


@auth_bp.route("/login", methods=["POST"])
def login():
    """
    Verify Firebase token and return user profile.
    Frontend handles actual login via Firebase SDK.
    This endpoint just validates the token and returns user data.
    """
    data = request.get_json()
    if not data or "token" not in data:
        return error("Token required", 400)
    
    try:
        decoded = auth.verify_id_token(data["token"])
        uid = decoded["uid"]
        
        profile = get_user_profile(uid)
        if not profile:
            # Auto-create profile on first login
            profile = {
                "uid": uid,
                "email": decoded.get("email", ""),
                "name": decoded.get("name", "User"),
                "role": "viewer",  # Default role
                "created_at": None
            }
            create_user_profile(uid, profile)
        
        return success({
            "uid": uid,
            "email": profile.get("email"),
            "name": profile.get("name"),
            "role": profile.get("role", "viewer")
        }, "Login successful")
    
    except auth.ExpiredIdTokenError:
        return error("Token expired", 401)
    except auth.InvalidIdTokenError:
        return error("Invalid token", 401)
    except Exception as e:
        return error(f"Authentication failed: {str(e)}", 500)


@auth_bp.route("/me", methods=["GET"])
@require_auth
def get_me():
    """Return current user profile."""
    uid = request.user.get("uid")
    profile = get_user_profile(uid)
    if not profile:
        return error("Profile not found", 404)
    return success(profile)


@auth_bp.route("/users/role", methods=["POST"])
@require_auth
def update_role():
    """Admin only: update a user's role."""
    from services.auth_service import require_role
    from services.firebase_service import update_user_profile
    
    # Check admin role manually
    uid = request.user.get("uid")
    profile = get_user_profile(uid)
    if not profile or profile.get("role") != "admin":
        return error("Admin access required", 403)
    
    data = request.get_json()
    target_uid = data.get("uid")
    new_role = data.get("role")
    
    if not target_uid or not new_role:
        return error("uid and role are required", 400)
    
    if new_role not in ("admin", "analyst", "viewer"):
        return error("Role must be admin, analyst, or viewer", 400)
    
    update_user_profile(target_uid, {"role": new_role})
    return success(message=f"Role updated to {new_role}")
