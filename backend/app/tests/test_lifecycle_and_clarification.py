import io
from app.services.seed import create_synthetic_pdf

def test_full_lifecycle_and_clarification_loop(client):
    inst_headers = {
        "X-Demo-Role": "institution",
        "X-Demo-Institution-Ref": "TEST-INST-99",
        "X-Demo-User-Name": "Registrar Test"
    }
    rev_headers = {
        "X-Demo-Role": "reviewer",
        "X-Demo-User-Name": "AICTE Scrutiny Member"
    }

    # 1. Institution creates case (starts in DRAFT)
    case_payload = {
        "institution_name": "Test Engineering Institute",
        "institution_ref": "TEST-INST-99",
        "category": "Extension of Approval (EoA)",
        "academic_year": "2026-2027",
        "program_type": "Engineering & Technology",
        "contact_email": "reg@test-inst.edu",
        "contact_phone": "+91-9999988888"
    }
    c_res = client.post("/api/v1/cases", json=case_payload, headers=inst_headers)
    assert c_res.status_code == 201
    case = c_res.json()
    case_id = case["id"]
    assert case["status"] == "DRAFT"

    # Cannot submit without document
    sub_fail = client.post(f"/api/v1/cases/{case_id}/submit", headers=inst_headers)
    assert sub_fail.status_code == 400

    # 2. Upload supporting document
    pdf_bytes = create_synthetic_pdf("Land Deed", "Full legal ownership title deed.")
    upload_res = client.post(
        f"/api/v1/cases/{case_id}/documents",
        files={"file": ("land_deed.pdf", io.BytesIO(pdf_bytes), "application/pdf")},
        data={"doc_type": "LAND_BUILDING_DEED"},
        headers=inst_headers
    )
    assert upload_res.status_code == 201

    # 3. Submit application
    sub_res = client.post(f"/api/v1/cases/{case_id}/submit", headers=inst_headers)
    assert sub_res.status_code == 200
    assert sub_res.json()["status"] == "SUBMITTED"

    # 4. Reviewer marks under review
    rev_start = client.post(f"/api/v1/cases/{case_id}/mark-under-review", headers=rev_headers)
    assert rev_start.status_code == 200
    assert rev_start.json()["status"] == "UNDER_REVIEW"

    # 5. Reviewer requests clarification
    clarif_payload = {
        "request_message": "Please provide surveyor certificate for Plot 14.",
        "target_doc_type": "LAND_BUILDING_DEED"
    }
    clarif_res = client.post(f"/api/v1/cases/{case_id}/clarifications", json=clarif_payload, headers=rev_headers)
    assert clarif_res.status_code == 201
    clarif_data = clarif_res.json()
    clarif_id = clarif_data["id"]

    # Verify case status updated to NEEDS_CLARIFICATION
    c_check = client.get(f"/api/v1/cases/{case_id}", headers=rev_headers).json()
    assert c_check["status"] == "NEEDS_CLARIFICATION"

    # 6. Institution responds to clarification
    resp_payload = {
        "response_message": "Plot 14 surveyor certificate has been annexed to the revised title document."
    }
    resp_res = client.post(
        f"/api/v1/cases/{case_id}/clarifications/{clarif_id}/respond",
        json=resp_payload,
        headers=inst_headers
    )
    assert resp_res.status_code == 200
    assert resp_res.json()["status"] == "RESPONDED"

    # Case should now be RESUBMITTED
    c_check2 = client.get(f"/api/v1/cases/{case_id}", headers=inst_headers).json()
    assert c_check2["status"] == "RESUBMITTED"

    # 7. Reviewer marks under review again
    rev_start2 = client.post(f"/api/v1/cases/{case_id}/mark-under-review", headers=rev_headers)
    assert rev_start2.status_code == 200
    assert rev_start2.json()["status"] == "UNDER_REVIEW"

    # 8. Reviewer completes preliminary review
    outcome_payload = {
        "outcome_status": "PRELIMINARY_REVIEW_COMPLETE",
        "observation_notes": "Surveyor certificate verified. Baseline documents complete."
    }
    outcome_res = client.post(f"/api/v1/cases/{case_id}/review-outcome", json=outcome_payload, headers=rev_headers)
    assert outcome_res.status_code == 200
    assert outcome_res.json()["status"] == "PRELIMINARY_REVIEW_COMPLETE"

    # 9. Check audit trail
    history_res = client.get(f"/api/v1/cases/{case_id}/history", headers=rev_headers)
    assert history_res.status_code == 200
    events = history_res.json()
    actions = [e["action"] for e in events]
    assert "CASE_CREATED" in actions
    assert "DOCUMENT_UPLOADED" in actions
    assert "CASE_SUBMITTED" in actions
    assert "REVIEW_STARTED" in actions
    assert "CLARIFICATION_REQUESTED" in actions
    assert "CLARIFICATION_RESPONDED" in actions
    assert "PRELIMINARY_REVIEW_COMPLETED" in actions
