from flask import Flask
from flask_cors import CORS
from config import config
import os

def create_app(config_name=None):
    if config_name is None:
        config_name = os.getenv("FLASK_ENV", "default")

    app = Flask(__name__)
    app.config.from_object(config[config_name])

    # Enable CORS for React frontend
    CORS(app, resources={
        r"/api/*": {
            "origins": [
                "http://localhost:3000",
                "https://*.vercel.app",
                os.getenv("FRONTEND_URL", "http://localhost:3000")
            ],
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"]
        }
    })

    # Initialize Firebase
    from services.firebase_service import init_firebase
    init_firebase(app.config["FIREBASE_CREDENTIALS_PATH"])

    # Register Blueprints
    from routes.auth_routes import auth_bp
    from routes.forecast_routes import forecast_bp
    from routes.alert_routes import alert_bp
    from routes.report_routes import report_bp
    from routes.upload_routes import upload_bp

    app.register_blueprint(auth_bp, url_prefix="/api")
    app.register_blueprint(forecast_bp, url_prefix="/api")
    app.register_blueprint(alert_bp, url_prefix="/api")
    app.register_blueprint(report_bp, url_prefix="/api")
    app.register_blueprint(upload_bp, url_prefix="/api")

    @app.route("/")
    def health_check():
        return {"status": "ok", "message": "Inventory Forecasting API is running"}, 200

    return app


app = create_app()

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.getenv("PORT", 5000)), debug=app.config["DEBUG"])
