def test_health_check(client):
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "version" in data
    assert data["demo_mode"] is True

def test_demo_status(client):
    response = client.get("/api/v1/demo/status")
    assert response.status_code == 200
    data = response.json()
    assert data["environment"] == "demonstration"
    assert data["case_count"] >= 3

def test_demo_reset(client):
    response = client.post("/api/v1/demo/reset")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["is_synthetic"] is True
