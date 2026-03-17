from firebase_admin import auth
from functools import wraps
from flask import request, jsonify
from services.firebase_service import get_user_profile


def verify_token(token):
    """Verify Firebase ID token and return decoded token."""
    try:
        decoded = auth.verify_id_token(token)
        return decoded, None
    except auth.ExpiredIdTokenError:
        return None, "Token has expired"
    except auth.InvalidIdTokenError:
        return None, "Invalid token"
    except Exception as e:
        return None, str(e)


def get_token_from_request():
    """Extract Bearer token from Authorization header."""
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        return auth_header.split(" ", 1)[1]
    return None


def require_auth(f):
    """Decorator: requires valid Firebase token."""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = get_token_from_request()
        if not token:
            return jsonify({"error": "Authorization token required"}), 401
        decoded, error = verify_token(token)
        if error:
            return jsonify({"error": error}), 401
        request.user = decoded
        return f(*args, **kwargs)
    return decorated


def require_role(role):
    """Decorator: requires specific role (admin/analyst/viewer)."""
    def decorator(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            token = get_token_from_request()
            if not token:
                return jsonify({"error": "Authorization token required"}), 401
            decoded, error = verify_token(token)
            if error:
                return jsonify({"error": error}), 401
            
            uid = decoded.get("uid")
            profile = get_user_profile(uid)
            if not profile:
                return jsonify({"error": "User profile not found"}), 404
            
            user_role = profile.get("role", "viewer")
            role_hierarchy = {"viewer": 0, "analyst": 1, "admin": 2}
            
            if role_hierarchy.get(user_role, 0) < role_hierarchy.get(role, 0):
                return jsonify({"error": f"Requires '{role}' role or higher"}), 403
            
            request.user = decoded
            request.user_profile = profile
            return f(*args, **kwargs)
        return decorated
    return decorator
