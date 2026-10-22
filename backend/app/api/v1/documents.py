from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.core.database import get_db
from app.core.security import DemoActor, get_current_actor, require_institution
from app.models.case import ApplicationCase, CaseStatus
from app.models.document import ApplicationDocument, DocumentType, DocumentProcessingStatus
from app.models.audit import AuditEvent, AuditActorRole
from app.schemas.document import DocumentResponse
from app.services.storage import process_and_store_upload, get_stored_file_path

router = APIRouter(prefix="/cases/{case_id}/documents", tags=["documents"])

DOCUMENT_TITLES = {
    DocumentType.LAND_BUILDING_DEED: "Land & Building Ownership / Registered Lease Deed",
    DocumentType.PREVIOUS_EOA_LETTER: "Previous Academic Year AICTE Approval / EoA Letter",
    DocumentType.FACULTY_SALARY_STATEMENT: "Faculty Cadre Ratio & Salary Bank Disbursement Statement",
    DocumentType.FIRE_SAFETY_CERTIFICATE: "Municipal / State Fire Safety Certificate & Occupancy NOC",
    DocumentType.OTHER_SUPPORTING: "General Supporting Regulatory Affidavit / Document",
}

@router.post("", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
async def upload_case_document(
    case_id: str,
    file: UploadFile = File(...),
    doc_type: DocumentType = Form(...),
    title: Optional[str] = Form(None),
    actor: DemoActor = Depends(get_current_actor),
    db: Session = Depends(get_db)
):
    require_institution(actor)

    case = db.query(ApplicationCase).filter(ApplicationCase.id == case_id).first()
    if not case:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application case not found.")

    if case.institution_ref != actor.institution_ref:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied to this case.")

    # Prevent altering documents when under review or finalized without clarification
    if case.status in [CaseStatus.UNDER_REVIEW, CaseStatus.PRELIMINARY_REVIEW_COMPLETE]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot upload documents while application is in '{case.status.value}' state. Wait for review outcome or clarification request."
        )

    # Process and store upload
    stored_filename, mime_type, file_size, sha256_hash, ext = await process_and_store_upload(file)

    # Check previous versions of this doc_type for this case
    previous_docs = db.query(ApplicationDocument).filter(
        ApplicationDocument.case_id == case.id,
        ApplicationDocument.doc_type == doc_type
    ).order_by(desc(ApplicationDocument.version)).all()

    new_version = 1
    if previous_docs:
        new_version = previous_docs[0].version + 1
        # Deactivate older active versions
        for pd in previous_docs:
            pd.is_active = False

    # Check for duplicate SHA-256 in the database (warning flag)
    duplicate_count = db.query(ApplicationDocument).filter(
        ApplicationDocument.sha256_hash == sha256_hash,
        ApplicationDocument.case_id != case.id
    ).count()

    proc_status = DocumentProcessingStatus.FLAGGED if duplicate_count > 0 else DocumentProcessingStatus.VERIFIED_MIME

    doc_title = title or DOCUMENT_TITLES.get(doc_type, "Supporting Document")

    document = ApplicationDocument(
        case_id=case.id,
        doc_type=doc_type,
        title=doc_title,
        original_filename=file.filename or f"document{ext}",
        stored_filename=stored_filename,
        mime_type=mime_type,
        file_size_bytes=file_size,
        sha256_hash=sha256_hash,
        version=new_version,
        is_active=True,
        processing_status=proc_status,
        uploaded_by_role=actor.role,
        uploaded_by_name=actor.user_name,
    )
    db.add(document)

    # Log Audit Event
    audit_msg = f"Uploaded {doc_title} (v{new_version}, {file_size // 1024} KB). SHA-256: {sha256_hash[:16]}..."
    if duplicate_count > 0:
        audit_msg += f" [DUPLICATE NOTICE: Identical hash detected in {duplicate_count} other institutional filing(s)]"

    audit = AuditEvent(
        case_id=case.id,
        actor_role=AuditActorRole.INSTITUTION,
        actor_name=actor.user_name,
        action="DOCUMENT_UPLOADED",
        details=audit_msg
    )
    db.add(audit)
    db.commit()
    db.refresh(document)

    return document

@router.get("", response_model=List[DocumentResponse])
def list_case_documents(
    case_id: str,
    active_only: bool = Query(False),
    actor: DemoActor = Depends(get_current_actor),
    db: Session = Depends(get_db)
):
    case = db.query(ApplicationCase).filter(ApplicationCase.id == case_id).first()
    if not case:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application case not found.")

    if actor.role == "institution" and case.institution_ref != actor.institution_ref:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied to this case.")

    query = db.query(ApplicationDocument).filter(ApplicationDocument.case_id == case.id)
    if active_only:
        query = query.filter(ApplicationDocument.is_active == True)
    
    docs = query.order_by(desc(ApplicationDocument.created_at)).all()
    return docs

@router.get("/{document_id}/download")
def download_case_document(
    case_id: str,
    document_id: str,
    actor: DemoActor = Depends(get_current_actor),
    db: Session = Depends(get_db)
):
    case = db.query(ApplicationCase).filter(ApplicationCase.id == case_id).first()
    if not case:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application case not found.")

    if actor.role == "institution" and case.institution_ref != actor.institution_ref:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied to this document.")

    doc = db.query(ApplicationDocument).filter(
        ApplicationDocument.id == document_id,
        ApplicationDocument.case_id == case.id
    ).first()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document record not found.")

    file_path = get_stored_file_path(doc.stored_filename)

    return FileResponse(
        path=file_path,
        media_type=doc.mime_type,
        filename=doc.original_filename,
        headers={
            "Content-Disposition": f'inline; filename="{doc.original_filename}"',
            "X-Document-SHA256": doc.sha256_hash,
            "X-Document-Version": str(doc.version)
        }
    )
