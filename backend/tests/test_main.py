import pytest
from fastapi.testclient import TestClient
from unittest.mock import MagicMock, AsyncMock

# Mock out motor and database connections before importing main to avoid real DB execution
import sys
from types import ModuleType

mock_db_module = ModuleType("app.core.database")
sys.modules["app.core.database"] = mock_db_module

# Configure mock functions on database module
mock_db = MagicMock()
mock_db_module.get_database = lambda: mock_db
mock_db_module.connect_to_mongo = AsyncMock()
mock_db_module.close_mongo_connection = AsyncMock()

# Now import app.main
from app.main import app

client = TestClient(app)

def test_read_root():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["status"] == "online"

def test_user_registration_validation():
    # Attempt registration with incomplete schema (missing password)
    invalid_payload = {
        "username": "tester",
        "email": "tester@test.com",
        "role": "Consumer",
        "full_name": "Test User"
    }
    response = client.post("/api/v1/auth/register", json=invalid_payload)
    assert response.status_code == 422  # Validation error

def test_public_verify_nonexistent_serial():
    # Mock database to return None for scans
    mock_db.scans.find_one = AsyncMock(return_value=None)
    
    response = client.get("/api/v1/consumer/verify/MC-MOCK-INVALID-001")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()

def test_predict_risk_rbac():
    # Access restricted path without auth
    response = client.post("/api/v1/ai/predict-risk", json={
        "supplier_rating": 85,
        "price_discrepancy_percent": 2,
        "transit_temp_anomaly": False,
        "failed_scans": 0
    })
    assert response.status_code == 401  # Unauthorized (no token)
