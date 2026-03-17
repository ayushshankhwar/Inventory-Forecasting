import firebase_admin
from firebase_admin import credentials, firestore, auth
import os
import json

_db = None

def init_firebase(credentials_path):
    """Initialize Firebase Admin SDK."""
    global _db
    if not firebase_admin._apps:
        # Support JSON string from environment variable (for Render deployment)
        firebase_creds_json = os.getenv("FIREBASE_CREDENTIALS_JSON")
        if firebase_creds_json:
            cred_dict = json.loads(firebase_creds_json)
            cred = credentials.Certificate(cred_dict)
        elif os.path.exists(credentials_path):
            cred = credentials.Certificate(credentials_path)
        else:
            raise FileNotFoundError(
                f"Firebase credentials not found at {credentials_path}. "
                "Set FIREBASE_CREDENTIALS_JSON env var or provide the file."
            )
        firebase_admin.initialize_app(cred)
    _db = firestore.client()
    return _db


def get_db():
    """Return Firestore client."""
    global _db
    if _db is None:
        raise RuntimeError("Firebase not initialized. Call init_firebase() first.")
    return _db


# ─────────────────────── USERS ───────────────────────

def get_user_profile(uid):
    db = get_db()
    doc = db.collection("users").document(uid).get()
    return doc.to_dict() if doc.exists else None


def create_user_profile(uid, data):
    db = get_db()
    db.collection("users").document(uid).set(data)


def update_user_profile(uid, data):
    db = get_db()
    db.collection("users").document(uid).update(data)


# ─────────────────────── PRODUCTS ───────────────────────

def get_all_products():
    db = get_db()
    docs = db.collection("products").stream()
    return [{"id": d.id, **d.to_dict()} for d in docs]


def get_product_by_sku(sku):
    db = get_db()
    docs = db.collection("products").where("sku", "==", sku).limit(1).stream()
    for d in docs:
        return {"id": d.id, **d.to_dict()}
    return None


def upsert_product(sku, data):
    db = get_db()
    existing = get_product_by_sku(sku)
    if existing:
        db.collection("products").document(existing["id"]).update(data)
    else:
        db.collection("products").add({**data, "sku": sku})


# ─────────────────────── FORECASTS ───────────────────────

def save_forecast(sku, forecast_data, horizon_days, created_by):
    db = get_db()
    doc_ref = db.collection("forecasts").document(f"{sku}_{horizon_days}d")
    doc_ref.set({
        "sku": sku,
        "horizon_days": horizon_days,
        "forecast": forecast_data,
        "created_by": created_by,
        "created_at": firestore.SERVER_TIMESTAMP
    })
    return doc_ref.id


def get_forecast(sku, horizon_days=30):
    db = get_db()
    doc = db.collection("forecasts").document(f"{sku}_{horizon_days}d").get()
    return doc.to_dict() if doc.exists else None


def get_all_forecasts():
    db = get_db()
    docs = db.collection("forecasts").order_by(
        "created_at", direction=firestore.Query.DESCENDING
    ).stream()
    return [{"id": d.id, **d.to_dict()} for d in docs]


# ─────────────────────── ALERTS ───────────────────────

def save_alert(alert_data):
    db = get_db()
    ref = db.collection("alerts").add({
        **alert_data,
        "created_at": firestore.SERVER_TIMESTAMP
    })
    return ref[1].id


def get_all_alerts(resolved=None):
    db = get_db()
    query = db.collection("alerts")
    if resolved is not None:
        query = query.where("resolved", "==", resolved)
    docs = query.order_by("created_at", direction=firestore.Query.DESCENDING).stream()
    return [{"id": d.id, **d.to_dict()} for d in docs]


def resolve_alert(alert_id):
    db = get_db()
    db.collection("alerts").document(alert_id).update({"resolved": True})


# ─────────────────────── VENDORS ───────────────────────

def get_all_vendors():
    db = get_db()
    docs = db.collection("vendors").stream()
    return [{"id": d.id, **d.to_dict()} for d in docs]


def add_vendor(data):
    db = get_db()
    ref = db.collection("vendors").add(data)
    return ref[1].id
