def test_list_cases_as_institution(client):
    headers = {
        "X-Demo-Role": "institution",
        "X-Demo-Institution-Ref": "NIT-DEMO-01",
        "X-Demo-User-Name": "Dr. R. Sharma"
    }
    response = client.get("/api/v1/cases", headers=headers)
    assert response.status_code == 200
    cases = response.json()
    assert len(cases) >= 1
    # Check that institution only sees its own cases
    for c in cases:
        assert c["institution_ref"] == "NIT-DEMO-01"

def test_list_cases_as_reviewer(client):
    headers = {
        "X-Demo-Role": "reviewer",
        "X-Demo-User-Name": "AICTE Reviewer"
    }
    response = client.get("/api/v1/cases", headers=headers)
    assert response.status_code == 200
    cases = response.json()
    assert len(cases) >= 4  # Sees all seeded cases across different institutions

def test_create_case_as_institution(client):
    headers = {
        "X-Demo-Role": "institution",
        "X-Demo-Institution-Ref": "NIT-DEMO-01",
        "X-Demo-User-Name": "Dr. R. Sharma"
    }
    payload = {
        "institution_name": "Northstar Institute of Technology",
        "institution_ref": "NIT-DEMO-01",
        "category": "Extension of Approval (EoA)",
        "academic_year": "2026-2027",
        "program_type": "Engineering & Technology",
        "campus_location": "Electronic City, Bengaluru",
        "contact_email": "dean@northstar-tech.edu.in",
        "contact_phone": "+91-80-2852-0100"
    }
    response = client.post("/api/v1/cases", json=payload, headers=headers)
    assert response.status_code == 201
    data = response.json()
    assert data["case_ref"].startswith("VERITAS-2026-")
    assert data["status"] == "DRAFT"
    assert data["institution_ref"] == "NIT-DEMO-01"
    assert len(data["audit_events"]) == 1
    assert data["audit_events"][0]["action"] == "CASE_CREATED"

def test_reviewer_cannot_create_case(client):
    headers = {
        "X-Demo-Role": "reviewer",
        "X-Demo-User-Name": "Reviewer 1"
    }
    payload = {
        "institution_name": "Reviewer Created Inst",
        "institution_ref": "FAKE-01",
        "contact_email": "admin@fake.edu",
        "contact_phone": "12345678"
    }
    response = client.post("/api/v1/cases", json=payload, headers=headers)
    assert response.status_code == 403
