import io
from app.services.seed import create_synthetic_pdf

def test_document_upload_and_download(client):
    inst_headers = {
        "X-Demo-Role": "institution",
        "X-Demo-Institution-Ref": "NIT-DEMO-01",
        "X-Demo-User-Name": "Dr. R. Sharma"
    }

    # Fetch NIT case
    cases_res = client.get("/api/v1/cases", headers=inst_headers)
    assert cases_res.status_code == 200
    nit_case = cases_res.json()[0]
    case_id = nit_case["id"]

    # Generate small valid synthetic PDF
    pdf_bytes = create_synthetic_pdf("Test Document", "Unit test pdf upload payload.")

    files = {
        "file": ("test_fire_noc.pdf", io.BytesIO(pdf_bytes), "application/pdf")
    }
    data = {
        "doc_type": "FIRE_SAFETY_CERTIFICATE",
        "title": "Fire Department Occupancy NOC"
    }

    upload_res = client.post(
        f"/api/v1/cases/{case_id}/documents",
        files=files,
        data=data,
        headers=inst_headers
    )
    assert upload_res.status_code == 201
    doc_data = upload_res.json()
    assert doc_data["doc_type"] == "FIRE_SAFETY_CERTIFICATE"
    assert doc_data["mime_type"] == "application/pdf"
    assert doc_data["version"] == 1
    assert doc_data["sha256_hash"] is not None

    # Test download/preview
    doc_id = doc_data["id"]
    dl_res = client.get(
        f"/api/v1/cases/{case_id}/documents/{doc_id}/download",
        headers=inst_headers
    )
    assert dl_res.status_code == 200
    assert dl_res.headers["content-type"] == "application/pdf"
    assert len(dl_res.content) > 0

def test_invalid_mime_rejected(client):
    inst_headers = {
        "X-Demo-Role": "institution",
        "X-Demo-Institution-Ref": "NIT-DEMO-01",
        "X-Demo-User-Name": "Dr. R. Sharma"
    }
    cases_res = client.get("/api/v1/cases", headers=inst_headers)
    case_id = cases_res.json()[0]["id"]

    # Upload fake file claiming to be pdf but containing invalid magic bytes
    fake_content = b"THIS IS NOT A VALID PDF FILE HEADER"
    files = {
        "file": ("fake.pdf", io.BytesIO(fake_content), "application/pdf")
    }
    data = {"doc_type": "LAND_BUILDING_DEED"}

    res = client.post(f"/api/v1/cases/{case_id}/documents", files=files, data=data, headers=inst_headers)
    assert res.status_code == 400
    assert "Content validation failed" in res.json()["detail"]
