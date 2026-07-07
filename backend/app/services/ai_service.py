import os
import pickle
import numpy as np
import logging
from datetime import datetime

logger = logging.getLogger("mediclear.ai")

# Path to saved models
MODEL_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "models_saved")
ISOLATION_FOREST_PATH = os.path.join(MODEL_DIR, "isolation_forest.pkl")
RANDOM_FOREST_PATH = os.path.join(MODEL_DIR, "random_forest.pkl")

class AIService:
    _iso_forest = None
    _random_forest = None

    @classmethod
    def load_models(cls):
        """
        Loads the pre-trained models. If not present, log and run under fallback logic.
        """
        try:
            if os.path.exists(ISOLATION_FOREST_PATH):
                with open(ISOLATION_FOREST_PATH, "rb") as f:
                    cls._iso_forest = pickle.load(f)
                logger.info("AI Isolation Forest model loaded successfully.")
            else:
                logger.warning("Isolation Forest model file not found. Running under fallback rule-based mode.")
            
            if os.path.exists(RANDOM_FOREST_PATH):
                with open(RANDOM_FOREST_PATH, "rb") as f:
                    cls._random_forest = pickle.load(f)
                logger.info("AI Random Forest classifier loaded successfully.")
            else:
                logger.warning("Random Forest classifier file not found. Running under fallback rule-based mode.")
        except Exception as e:
            logger.error(f"Error loading models: {str(e)}. Fallbacks active.")

    @classmethod
    def detect_scan_anomaly(cls, scan_count: int, hours_since_last_scan: float, distance_km: float, is_expired: bool, location_count: int) -> dict:
        """
        Runs anomaly detection on a QR verification scan.
        Input features:
        [scan_count, hours_since_last_scan, distance_km, is_expired, location_count]
        Returns:
            {
                "is_anomaly": bool,
                "confidence": float,
                "reason": str
            }
        """
        # Ensure models are loaded
        if cls._iso_forest is None:
            cls.load_models()

        is_expired_val = 1.0 if is_expired else 0.0
        features = np.array([[scan_count, hours_since_last_scan, distance_km, is_expired_val, location_count]], dtype=float)

        # Fallback Rule-Based Detection
        reasons = []
        is_rule_anomaly = False
        confidence = 0.5

        if scan_count > 5:
            reasons.append("High scan count (possible duplicate QR copy)")
            is_rule_anomaly = True
            confidence = min(0.95, 0.5 + (scan_count * 0.08))
        if distance_km > 100 and hours_since_last_scan < 1.0:
            reasons.append(f"Impossible travel distance ({distance_km:.1f} km in {hours_since_last_scan:.2f} hours)")
            is_rule_anomaly = True
            confidence = 0.99
        if is_expired:
            reasons.append("Medicine batch is expired")
            is_rule_anomaly = True
            confidence = max(confidence, 0.9)
        if location_count > 2:
            reasons.append(f"QR scanned in {location_count} distinct cities")
            is_rule_anomaly = True
            confidence = max(confidence, 0.8)

        # Model evaluation if available
        if cls._iso_forest is not None:
            try:
                # isolation forest outputs -1 for anomaly, 1 for normal
                pred = cls._iso_forest.predict(features)[0]
                decision = cls._iso_forest.decision_function(features)[0]
                # Map decision function to confidence score
                # decision range is typically [-0.5, 0.5], lower means more anomalous
                model_is_anomaly = (pred == -1)
                
                # Align rules and model
                final_anomaly = model_is_anomaly or is_rule_anomaly
                final_confidence = 0.5 - decision if model_is_anomaly else 0.5 + decision
                final_confidence = float(np.clip(final_confidence, 0.1, 1.0))
                
                return {
                    "is_anomaly": final_anomaly,
                    "confidence": round(final_confidence, 3),
                    "reason": " | ".join(reasons) if final_anomaly else "Normal scan behavior",
                    "mode": "ml_engine"
                }
            except Exception as e:
                logger.error(f"Error in model prediction: {str(e)}")

        # Rule-based response fallback
        return {
            "is_anomaly": is_rule_anomaly,
            "confidence": round(confidence, 3),
            "reason": " | ".join(reasons) if is_rule_anomaly else "Normal scan behavior",
            "mode": "rule_engine_fallback"
        }

    @classmethod
    def calculate_risk_score(cls, supplier_rating: float, price_discrepancy_percent: float, transit_temp_anomaly: bool, failed_scans: int) -> dict:
        """
        Calculates a batch or shipment risk score using Random Forest.
        Features:
        [supplier_rating (0-100), price_discrepancy_percent (%), temp_anomaly (0/1), failed_scans]
        Returns:
            {
                "risk_score": float (0.0 to 1.0),
                "risk_level": str ("Low", "Medium", "High", "Critical"),
                "details": str
            }
        """
        if cls._random_forest is None:
            cls.load_models()

        temp_val = 1.0 if transit_temp_anomaly else 0.0
        features = np.array([[supplier_rating, price_discrepancy_percent, temp_val, failed_scans]], dtype=float)

        # Rule-based backup
        base_risk = 0.1
        reasons = []
        if supplier_rating < 70:
            base_risk += 0.25
            reasons.append("Low supplier rating")
        if price_discrepancy_percent > 15:
            base_risk += 0.2
            reasons.append(f"Price deviation ({price_discrepancy_percent}%)")
        if transit_temp_anomaly:
            base_risk += 0.35
            reasons.append("Cold chain violation (temperature spike)")
        if failed_scans > 2:
            base_risk += 0.2
            reasons.append(f"Failed scans ({failed_scans})")
            
        base_risk = min(1.0, base_risk)

        if cls._random_forest is not None:
            try:
                # predict probability of anomaly (class 1)
                prob = cls._random_forest.predict_proba(features)[0][1]
                # average model probability and rule-based score
                risk_score = float((prob + base_risk) / 2.0)
            except Exception as e:
                logger.error(f"Error in Random Forest prediction: {str(e)}")
                risk_score = base_risk
        else:
            risk_score = base_risk

        if risk_score < 0.3:
            level = "Low"
        elif risk_score < 0.6:
            level = "Medium"
        elif risk_score < 0.85:
            level = "High"
        else:
            level = "Critical"

        details = " | ".join(reasons) if reasons else "No risk indicators flagged."
        return {
            "risk_score": round(risk_score, 3),
            "risk_level": level,
            "details": details
        }
# Call load_models on import
AIService.load_models()
