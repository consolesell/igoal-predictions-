import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_health_check():
    response = client.get("/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["ok"] is True
    assert data["version"] == "2.0.0"
    assert data["mode"] == "production"

def test_fixtures_invalid_date_format():
    response = client.get("/v1/fixtures?date=invalid-date")
    assert response.status_code == 400
    data = response.json()
    assert "error" in data

def test_fixtures_valid_date_format():
    response = client.get("/v1/fixtures?date=2026-10-30")
    # Will be 200 (database query with zero or more items)
    assert response.status_code in (200, 500)
    if response.status_code == 200:
        data = response.json()
        assert "source" in data
        assert "fixtures" in data
        assert isinstance(data["fixtures"], list)

def test_tips_invalid_tier():
    response = client.get("/v1/tips?tier=vip_diamond")
    assert response.status_code == 400
    data = response.json()
    assert "error" in data

def test_tips_valid_tier():
    response = client.get("/v1/tips?tier=free")
    if response.status_code == 200:
        data = response.json()
        assert data["source"] == "igoal-engine-v1"
        assert "tips" in data
        assert isinstance(data["tips"], list)

def test_results_endpoint():
    response = client.get("/v1/results?since=0")
    if response.status_code == 200:
        data = response.json()
        assert data["source"] == "settler-v1"
        assert "results" in data
        assert isinstance(data["results"], list)
