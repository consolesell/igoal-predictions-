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

def test_tips_invalid_tier():
    response = client.get("/v1/tips?tier=vip_diamond")
    assert response.status_code == 400
    data = response.json()
    assert "error" in data

def test_clubs_endpoint():
    response = client.get("/v1/clubs")
    assert response.status_code == 200
    data = response.json()
    assert "clubs" in data
    assert isinstance(data["clubs"], list)

def test_admin_auth_unauthorized():
    response = client.get("/v1/admin/fixtures")
    assert response.status_code == 401
    assert "error" in response.json()

def test_me_unauthenticated():
    response = client.get("/v1/me")
    assert response.status_code == 401
    assert "error" in response.json()

def test_me_authenticated_vip():
    response = client.get("/v1/me", headers={"Authorization": "Bearer demo_vip_token"})
    assert response.status_code == 200
    data = response.json()
    assert data["tier"] == "vip"
    assert data["isVip"] is True

def test_premium_tips_free_user_gated():
    response = client.get("/v1/tips?tier=premium", headers={"Authorization": "Bearer demo_free_token"})
    assert response.status_code == 200
    data = response.json()
    assert data["upgradeRequired"] is True
    assert data["tips"] == []

def test_premium_tips_vip_user_unlocked():
    response = client.get("/v1/tips?tier=premium", headers={"Authorization": "Bearer demo_vip_token"})
    assert response.status_code == 200
    data = response.json()
    assert data["upgradeRequired"] is False
    assert isinstance(data["tips"], list)
