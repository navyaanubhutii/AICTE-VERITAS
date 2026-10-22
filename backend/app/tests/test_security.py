def test_missing_role_header_rejected(client):
    response = client.get("/api/v1/cases")
    assert response.status_code == 401
    assert "Authentication required" in response.json()["detail"]

def test_invalid_role_rejected(client):
    headers = {"X-Demo-Role": "student"}
    response = client.get("/api/v1/cases", headers=headers)
    assert response.status_code == 403
    assert "Invalid role" in response.json()["detail"]

def test_institution_cross_access_forbidden(client):
    # Case 2 belongs to AAET-DEMO-02
    inst_headers_nit = {
        "X-Demo-Role": "institution",
        "X-Demo-Institution-Ref": "NIT-DEMO-01",
        "X-Demo-User-Name": "Dr. R. Sharma"
    }
    rev_headers = {
        "X-Demo-Role": "reviewer",
        "X-Demo-User-Name": "Reviewer"
    }

    # Find AAET case id as reviewer
    all_cases = client.get("/api/v1/cases", headers=rev_headers).json()
    aaet_case = next(c for c in all_cases if c["institution_ref"] == "AAET-DEMO-02")
    aaet_case_id = aaet_case["id"]

    # NIT institution tries to access AAET case
    blocked_get = client.get(f"/api/v1/cases/{aaet_case_id}", headers=inst_headers_nit)
    assert blocked_get.status_code == 403

    # NIT institution tries to submit AAET case
    blocked_sub = client.post(f"/api/v1/cases/{aaet_case_id}/submit", headers=inst_headers_nit)
    assert blocked_sub.status_code == 403

def test_reviewer_endpoint_forbidden_to_institution(client):
    inst_headers = {
        "X-Demo-Role": "institution",
        "X-Demo-Institution-Ref": "NIT-DEMO-01",
        "X-Demo-User-Name": "Dr. R. Sharma"
    }
    all_cases = client.get("/api/v1/cases", headers=inst_headers).json()
    case_id = all_cases[0]["id"]

    # Institution tries to call reviewer mark-under-review
    res = client.post(f"/api/v1/cases/{case_id}/mark-under-review", headers=inst_headers)
    assert res.status_code == 403

    # Institution tries to call review-outcome
    res2 = client.post(
        f"/api/v1/cases/{case_id}/review-outcome",
        json={"outcome_status": "PRELIMINARY_REVIEW_COMPLETE"},
        headers=inst_headers
    )
    assert res2.status_code == 403
