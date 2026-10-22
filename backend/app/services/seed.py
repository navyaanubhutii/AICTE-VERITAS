import hashlib
import os
from datetime import datetime, timedelta
from pathlib import Path
from sqlalchemy.orm import Session
from app.core.config import storage_path
from app.models.case import ApplicationCase, CaseStatus
from app.models.document import ApplicationDocument, DocumentType, DocumentProcessingStatus
from app.models.clarification import ClarificationRequest, ClarificationStatus
from app.models.observation import ReviewObservation, ObservationCategory, ObservationSeverity
from app.models.audit import AuditEvent, AuditActorRole

def create_synthetic_pdf(title: str, text: str) -> bytes:
    """
    Generates a minimal valid synthetic PDF file byte-stream with genuine PDF headers.
    """
    content = f"""%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj
4 0 obj
<< /Length {len(text) + 60} >>
stream
BT
/F1 14 Tf
50 720 Td
({title} [SYNTHETIC DEMO RECORD]) Tj
/F1 10 Tf
0 -30 Td
({text}) Tj
ET
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 6
0000000000 65535 f 
0000000010 00000 n 
0000000060 00000 n 
0000000117 00000 n 
0000000234 00000 n 
0000000350 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
420
%%EOF"""
    return content.encode("utf-8")

def seed_demo_database(db: Session):
    """
    Seeds a clean, reproducible synthetic demonstration dataset.
    """
    # Clear existing records
    db.query(AuditEvent).delete()
    db.query(ReviewObservation).delete()
    db.query(ClarificationRequest).delete()
    db.query(ApplicationDocument).delete()
    db.query(ApplicationCase).delete()
    db.commit()

    storage_path.mkdir(parents=True, exist_ok=True)

    def write_sample_file(filename_prefix: str, title: str, text: str):
        content = create_synthetic_pdf(title, text)
        sha256 = hashlib.sha256(content).hexdigest()
        stored_filename = f"{filename_prefix}_{sha256[:12]}.pdf"
        target_path = storage_path / stored_filename
        with open(target_path, "wb") as f:
            f.write(content)
        return stored_filename, len(content), sha256

    base_time = datetime.utcnow() - timedelta(days=5)

    # ----------------------------------------------------
    # Case 1: Northstar Institute of Technology (NIT-DEMO-01)
    # Status: NEEDS_CLARIFICATION
    # ----------------------------------------------------
    case1 = ApplicationCase(
        case_ref="VERITAS-2026-0001",
        institution_name="Northstar Institute of Technology",
        institution_ref="NIT-DEMO-01",
        category="Extension of Approval (EoA)",
        academic_year="2026-2027",
        program_type="Engineering & Technology",
        campus_location="Electronic City Phase 1, Bengaluru, Karnataka",
        contact_email="principal@northstar-tech.edu.in",
        contact_phone="+91-80-2852-0199",
        status=CaseStatus.NEEDS_CLARIFICATION,
        created_at=base_time,
        updated_at=datetime.utcnow() - timedelta(hours=3),
        submitted_at=base_time + timedelta(days=1),
        reviewed_at=base_time + timedelta(days=2),
    )
    db.add(case1)
    db.flush()

    # Documents for Case 1
    s_fn1, s_size1, s_hash1 = write_sample_file(
        "nit_land_deed",
        "Northstar Tech - Land Registered Deed",
        "Registered Survey No. 42/1 and 42/2, 10.5 Acres Campus Title."
    )
    doc1 = ApplicationDocument(
        case_id=case1.id,
        doc_type=DocumentType.LAND_BUILDING_DEED,
        title="Land & Building Ownership / Registered Lease Deed",
        original_filename="NIT_Registered_Land_Deed_2026.pdf",
        stored_filename=s_fn1,
        mime_type="application/pdf",
        file_size_bytes=s_size1,
        sha256_hash=s_hash1,
        version=1,
        is_active=True,
        processing_status=DocumentProcessingStatus.VERIFIED_MIME,
        uploaded_by_role="institution",
        uploaded_by_name="Dr. R. Sharma (Principal)",
        created_at=base_time + timedelta(hours=2)
    )

    s_fn2, s_size2, s_hash2 = write_sample_file(
        "nit_prev_eoa",
        "Northstar Tech - AICTE EoA Approval Letter 2025-26",
        "AICTE Approval Reference F.No. South-West/1-9318291021/2025/EOA."
    )
    doc2 = ApplicationDocument(
        case_id=case1.id,
        doc_type=DocumentType.PREVIOUS_EOA_LETTER,
        title="Previous Academic Year AICTE Approval / EoA Letter",
        original_filename="AICTE_EoA_Grant_Letter_2025_26.pdf",
        stored_filename=s_fn2,
        mime_type="application/pdf",
        file_size_bytes=s_size2,
        sha256_hash=s_hash2,
        version=1,
        is_active=True,
        processing_status=DocumentProcessingStatus.VERIFIED_MIME,
        uploaded_by_role="institution",
        uploaded_by_name="Dr. R. Sharma (Principal)",
        created_at=base_time + timedelta(hours=3)
    )

    s_fn3, s_size3, s_hash3 = write_sample_file(
        "nit_faculty_salary",
        "Northstar Tech - Faculty Cadre & Salary Proof",
        "Certified Bank Statement and 7th CPC Salary Disbursement for 84 Core Faculty."
    )
    doc3 = ApplicationDocument(
        case_id=case1.id,
        doc_type=DocumentType.FACULTY_SALARY_STATEMENT,
        title="Faculty Cadre Ratio & Salary Bank Disbursement Statement",
        original_filename="Faculty_Salary_Bank_Disbursement_Nov2025.pdf",
        stored_filename=s_fn3,
        mime_type="application/pdf",
        file_size_bytes=s_size3,
        sha256_hash=s_hash3,
        version=1,
        is_active=True,
        processing_status=DocumentProcessingStatus.VERIFIED_MIME,
        uploaded_by_role="institution",
        uploaded_by_name="Dr. R. Sharma (Principal)",
        created_at=base_time + timedelta(hours=4)
    )
    db.add_all([doc1, doc2, doc3])

    # Clarification Request for Case 1
    clarif1 = ClarificationRequest(
        case_id=case1.id,
        reviewer_name="S. Sengupta (AICTE Senior Reviewer)",
        requested_at=base_time + timedelta(days=2),
        request_message="The registered land lease deed document appears to be missing the sub-registrar endorsement seal on page 4. Please provide a re-attested copy showing clear revenue authority seals.",
        target_doc_type=DocumentType.LAND_BUILDING_DEED.value,
        status=ClarificationStatus.OPEN,
    )
    db.add(clarif1)

    # Observation for Case 1
    obs1 = ReviewObservation(
        case_id=case1.id,
        reviewer_name="S. Sengupta (AICTE Senior Reviewer)",
        category=ObservationCategory.DOCUMENTATION,
        severity=ObservationSeverity.DEFICIENCY,
        notes="Land document endorsement clarity required under APH Appendix 16 norms. Clarification issued to institution.",
        created_at=base_time + timedelta(days=2)
    )
    db.add(obs1)

    # Audit Events for Case 1
    db.add_all([
        AuditEvent(
            case_id=case1.id,
            actor_role=AuditActorRole.INSTITUTION,
            actor_name="Dr. R. Sharma (Principal)",
            action="CASE_CREATED",
            details="Application case initiated for academic year 2026-2027.",
            created_at=base_time
        ),
        AuditEvent(
            case_id=case1.id,
            actor_role=AuditActorRole.INSTITUTION,
            actor_name="Dr. R. Sharma (Principal)",
            action="DOCUMENT_UPLOADED",
            details="Uploaded Land & Building Ownership Deed (NIT_Registered_Land_Deed_2026.pdf).",
            created_at=base_time + timedelta(hours=2)
        ),
        AuditEvent(
            case_id=case1.id,
            actor_role=AuditActorRole.INSTITUTION,
            actor_name="Dr. R. Sharma (Principal)",
            action="CASE_SUBMITTED",
            details="Application case formally submitted for preliminary AICTE verification.",
            created_at=base_time + timedelta(days=1)
        ),
        AuditEvent(
            case_id=case1.id,
            actor_role=AuditActorRole.REVIEWER,
            actor_name="S. Sengupta (AICTE Senior Reviewer)",
            action="REVIEW_STARTED",
            details="Reviewer accessed application and initiated document scrutiny.",
            created_at=base_time + timedelta(days=1, hours=6)
        ),
        AuditEvent(
            case_id=case1.id,
            actor_role=AuditActorRole.REVIEWER,
            actor_name="S. Sengupta (AICTE Senior Reviewer)",
            action="CLARIFICATION_REQUESTED",
            details="Deficiency notice issued regarding sub-registrar seal on Land Deed.",
            created_at=base_time + timedelta(days=2)
        ),
    ])

    # ----------------------------------------------------
    # Case 2: Apex Academy of Engineering & Technology (AAET-DEMO-02)
    # Status: SUBMITTED
    # ----------------------------------------------------
    case2 = ApplicationCase(
        case_ref="VERITAS-2026-0002",
        institution_name="Apex Academy of Engineering & Technology",
        institution_ref="AAET-DEMO-02",
        category="Extension of Approval (EoA)",
        academic_year="2026-2027",
        program_type="Engineering & Technology",
        campus_location="Hinjewadi Tech Park, Pune, Maharashtra",
        contact_email="registrar@apex-academy.ac.in",
        contact_phone="+91-20-4122-8800",
        status=CaseStatus.SUBMITTED,
        created_at=base_time + timedelta(days=2),
        updated_at=base_time + timedelta(days=3),
        submitted_at=base_time + timedelta(days=3),
    )
    db.add(case2)
    db.flush()

    s_fn4, s_size4, s_hash4 = write_sample_file(
        "aaet_prev_eoa",
        "Apex Academy - Previous EoA Letter 2025-26",
        "AICTE Western Region Reference F.No. Western/1-84192011/2025/EOA."
    )
    doc4 = ApplicationDocument(
        case_id=case2.id,
        doc_type=DocumentType.PREVIOUS_EOA_LETTER,
        title="Previous Academic Year AICTE Approval / EoA Letter",
        original_filename="Apex_EoA_Approval_2025_26.pdf",
        stored_filename=s_fn4,
        mime_type="application/pdf",
        file_size_bytes=s_size4,
        sha256_hash=s_hash4,
        version=1,
        is_active=True,
        processing_status=DocumentProcessingStatus.VERIFIED_MIME,
        uploaded_by_role="institution",
        uploaded_by_name="Prof. M. Kulkarni (Registrar)",
        created_at=base_time + timedelta(days=2, hours=4)
    )

    s_fn5, s_size5, s_hash5 = write_sample_file(
        "aaet_fire_safety",
        "Apex Academy - Fire Safety Certificate",
        "Maharashtra State Fire Services No Objection Certificate No. MSFS/2025/4412."
    )
    doc5 = ApplicationDocument(
        case_id=case2.id,
        doc_type=DocumentType.FIRE_SAFETY_CERTIFICATE,
        title="Municipal / State Fire Safety Certificate & Occupancy NOC",
        original_filename="Apex_Fire_Safety_NOC_2025.pdf",
        stored_filename=s_fn5,
        mime_type="application/pdf",
        file_size_bytes=s_size5,
        sha256_hash=s_hash5,
        version=1,
        is_active=True,
        processing_status=DocumentProcessingStatus.VERIFIED_MIME,
        uploaded_by_role="institution",
        uploaded_by_name="Prof. M. Kulkarni (Registrar)",
        created_at=base_time + timedelta(days=2, hours=5)
    )
    db.add_all([doc4, doc5])

    db.add_all([
        AuditEvent(
            case_id=case2.id,
            actor_role=AuditActorRole.INSTITUTION,
            actor_name="Prof. M. Kulkarni (Registrar)",
            action="CASE_CREATED",
            details="Application case created for academic year 2026-2027.",
            created_at=base_time + timedelta(days=2)
        ),
        AuditEvent(
            case_id=case2.id,
            actor_role=AuditActorRole.INSTITUTION,
            actor_name="Prof. M. Kulkarni (Registrar)",
            action="CASE_SUBMITTED",
            details="Application case submitted for AICTE reviewer queue.",
            created_at=base_time + timedelta(days=3)
        ),
    ])

    # ----------------------------------------------------
    # Case 3: Vanguard Polytechnic College (VPC-DEMO-03)
    # Status: DRAFT
    # ----------------------------------------------------
    case3 = ApplicationCase(
        case_ref="VERITAS-2026-0003",
        institution_name="Vanguard Polytechnic College",
        institution_ref="VPC-DEMO-03",
        category="Extension of Approval (EoA)",
        academic_year="2026-2027",
        program_type="Applied Arts & Polytech",
        campus_location="Gachibowli, Hyderabad, Telangana",
        contact_email="admissions@vanguard-polytech.org",
        contact_phone="+91-40-2300-9911",
        status=CaseStatus.DRAFT,
        created_at=base_time + timedelta(days=3),
        updated_at=base_time + timedelta(days=3),
    )
    db.add(case3)
    db.flush()

    db.add(
        AuditEvent(
            case_id=case3.id,
            actor_role=AuditActorRole.INSTITUTION,
            actor_name="Vanguard Admin Office",
            action="CASE_CREATED",
            details="Draft application initiated. Pending document uploads.",
            created_at=base_time + timedelta(days=3)
        )
    )

    # ----------------------------------------------------
    # Case 4: Horizon Institute of Technology (HIT-DEMO-04)
    # Status: PRELIMINARY_REVIEW_COMPLETE
    # ----------------------------------------------------
    case4 = ApplicationCase(
        case_ref="VERITAS-2026-0004",
        institution_name="Horizon Institute of Technology",
        institution_ref="HIT-DEMO-04",
        category="Extension of Approval (EoA)",
        academic_year="2026-2027",
        program_type="Engineering & Technology",
        campus_location="OMR IT Corridor, Chennai, Tamil Nadu",
        contact_email="principal@horizon-tech.edu.in",
        contact_phone="+91-44-2450-7000",
        status=CaseStatus.PRELIMINARY_REVIEW_COMPLETE,
        created_at=base_time - timedelta(days=3),
        updated_at=base_time,
        submitted_at=base_time - timedelta(days=2),
        reviewed_at=base_time,
    )
    db.add(case4)
    db.flush()

    s_fn6, s_size6, s_hash6 = write_sample_file(
        "hit_land_deed",
        "Horizon Tech - Land & Building Title Deed",
        "Valid Registered Title for 12.0 Acres Freehold Campus Property."
    )
    doc6 = ApplicationDocument(
        case_id=case4.id,
        doc_type=DocumentType.LAND_BUILDING_DEED,
        title="Land & Building Ownership / Registered Lease Deed",
        original_filename="Horizon_Land_Title_Deed.pdf",
        stored_filename=s_fn6,
        mime_type="application/pdf",
        file_size_bytes=s_size6,
        sha256_hash=s_hash6,
        version=1,
        is_active=True,
        processing_status=DocumentProcessingStatus.VERIFIED_MIME,
        uploaded_by_role="institution",
        uploaded_by_name="Dr. V. Ramanathan (Principal)",
        created_at=base_time - timedelta(days=2, hours=8)
    )
    db.add(doc6)

    obs4 = ReviewObservation(
        case_id=case4.id,
        reviewer_name="S. Sengupta (AICTE Senior Reviewer)",
        category=ObservationCategory.DOCUMENTATION,
        severity=ObservationSeverity.INFO,
        notes="Preliminary check completed. Mandatory institutional submissions verified against initial formatting checklist.",
        created_at=base_time
    )
    db.add(obs4)

    db.add_all([
        AuditEvent(
            case_id=case4.id,
            actor_role=AuditActorRole.INSTITUTION,
            actor_name="Dr. V. Ramanathan (Principal)",
            action="CASE_CREATED",
            details="Application created.",
            created_at=base_time - timedelta(days=3)
        ),
        AuditEvent(
            case_id=case4.id,
            actor_role=AuditActorRole.INSTITUTION,
            actor_name="Dr. V. Ramanathan (Principal)",
            action="CASE_SUBMITTED",
            details="Application submitted.",
            created_at=base_time - timedelta(days=2)
        ),
        AuditEvent(
            case_id=case4.id,
            actor_role=AuditActorRole.REVIEWER,
            actor_name="S. Sengupta (AICTE Senior Reviewer)",
            action="PRELIMINARY_REVIEW_COMPLETED",
            details="Preliminary review finalized with satisfactory baseline findings.",
            created_at=base_time
        ),
    ])

    db.commit()
    print("Database seeded successfully with synthetic demonstration records.")
