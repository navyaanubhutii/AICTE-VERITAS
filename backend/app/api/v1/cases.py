import random
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc

from app.core.database import get_db
from app.core.security import DemoActor, get_current_actor, require_institution, require_reviewer
from app.models.case import ApplicationCase, CaseStatus
from app.models.audit import AuditEvent, AuditActorRole
from app.schemas.case import CaseCreate, CaseSummaryResponse, CaseDetailResponse, ReviewOutcomeSubmit
from app.schemas.audit import AuditEventResponse
from app.services.lifecycle import transition_case_status

router = APIRouter(prefix="/cases", tags=["cases"])

def generate_case_reference(db: Session) -> str:
    year = datetime.utcnow().year
    for _ in range(10):
        random_num = random.randint(1000, 9999)
        ref = f"VERITAS-{year}-{random_num}"
        existing = db.query(ApplicationCase).filter(ApplicationCase.case_ref == ref).first()
        if not existing:
            return ref
    return f"VERITAS-{year}-{int(datetime.utcnow().timestamp()) % 100000}"

def verify_case_access(case: ApplicationCase, actor: DemoActor):
    if actor.role == "institution":
        if case.institution_ref != actor.institution_ref:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: You can only access application cases belonging to your institution."
            )

@router.post("", response_model=CaseDetailResponse, status_code=status.HTTP_201_CREATED)
def create_application_case(
    payload: CaseCreate,
    actor: DemoActor = Depends(get_current_actor),
    db: Session = Depends(get_db)
):
    require_institution(actor)
    
    # Institution ref should match authenticated institution in demo
    inst_ref = actor.institution_ref or payload.institution_ref

    case_ref = generate_case_reference(db)

    case = ApplicationCase(
        case_ref=case_ref,
        institution_name=payload.institution_name,
        institution_ref=inst_ref,
        category=payload.category,
        academic_year=payload.academic_year,
        program_type=payload.program_type,
        campus_location=payload.campus_location,
        contact_email=payload.contact_email,
        contact_phone=payload.contact_phone,
        status=CaseStatus.DRAFT,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    db.add(case)
    db.flush()

    # Audit creation
    audit = AuditEvent(
        case_id=case.id,
        actor_role=AuditActorRole.INSTITUTION,
        actor_name=actor.user_name,
        action="CASE_CREATED",
        details=f"Draft application case {case.case_ref} created for {case.institution_name} ({case.category})."
    )
    db.add(audit)
    db.commit()
    db.refresh(case)

    return case

@router.get("", response_model=List[CaseSummaryResponse])
def list_application_cases(
    status_filter: Optional[CaseStatus] = Query(None, alias="status"),
    search: Optional[str] = Query(None),
    actor: DemoActor = Depends(get_current_actor),
    db: Session = Depends(get_db)
):
    query = db.query(ApplicationCase)

    # Server-side access scoping: institution only sees its own cases
    if actor.role == "institution":
        query = query.filter(ApplicationCase.institution_ref == actor.institution_ref)

    if status_filter:
        query = query.filter(ApplicationCase.status == status_filter)

    if search:
        search_fmt = f"%{search.strip()}%"
        query = query.filter(
            or_(
                ApplicationCase.case_ref.ilike(search_fmt),
                ApplicationCase.institution_name.ilike(search_fmt),
                ApplicationCase.institution_ref.ilike(search_fmt)
            )
        )

    cases = query.order_by(desc(ApplicationCase.updated_at)).all()

    # Transform to summary response with counts
    results = []
    for c in cases:
        doc_count = len([d for d in c.documents if d.is_active])
        open_clarifs = len([cl for cl in c.clarifications if cl.status.value == "OPEN"])
        results.append(
            CaseSummaryResponse(
                id=c.id,
                case_ref=c.case_ref,
                institution_name=c.institution_name,
                institution_ref=c.institution_ref,
                category=c.category,
                academic_year=c.academic_year,
                program_type=c.program_type,
                campus_location=c.campus_location,
                contact_email=c.contact_email,
                contact_phone=c.contact_phone,
                status=c.status,
                document_count=doc_count,
                open_clarifications_count=open_clarifs,
                created_at=c.created_at,
                updated_at=c.updated_at,
                submitted_at=c.submitted_at,
                reviewed_at=c.reviewed_at
            )
        )
    return results

@router.get("/{case_id}", response_model=CaseDetailResponse)
def get_application_case(
    case_id: str,
    actor: DemoActor = Depends(get_current_actor),
    db: Session = Depends(get_db)
):
    case = db.query(ApplicationCase).filter(
        or_(ApplicationCase.id == case_id, ApplicationCase.case_ref == case_id)
    ).first()

    if not case:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application case not found.")

    verify_case_access(case, actor)
    return case

@router.post("/{case_id}/submit", response_model=CaseDetailResponse)
def submit_application_case(
    case_id: str,
    actor: DemoActor = Depends(get_current_actor),
    db: Session = Depends(get_db)
):
    require_institution(actor)
    case = db.query(ApplicationCase).filter(ApplicationCase.id == case_id).first()
    if not case:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application case not found.")
    verify_case_access(case, actor)

    # Check that at least one document has been uploaded
    active_docs = [d for d in case.documents if d.is_active]
    if not active_docs:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot submit application: Please upload at least one required supporting document before submitting."
        )

    transition_case_status(
        db=db,
        case=case,
        target_status=CaseStatus.SUBMITTED,
        actor=actor,
        action_name="CASE_SUBMITTED",
        details=f"Application formally submitted by {actor.user_name} with {len(active_docs)} document(s)."
    )
    return case

@router.post("/{case_id}/mark-under-review", response_model=CaseDetailResponse)
def mark_case_under_review(
    case_id: str,
    actor: DemoActor = Depends(get_current_actor),
    db: Session = Depends(get_db)
):
    require_reviewer(actor)
    case = db.query(ApplicationCase).filter(ApplicationCase.id == case_id).first()
    if not case:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application case not found.")

    transition_case_status(
        db=db,
        case=case,
        target_status=CaseStatus.UNDER_REVIEW,
        actor=actor,
        action_name="REVIEW_STARTED",
        details=f"Scrutiny started by {actor.user_name}."
    )
    return case

@router.post("/{case_id}/review-outcome", response_model=CaseDetailResponse)
def record_review_outcome(
    case_id: str,
    payload: ReviewOutcomeSubmit,
    actor: DemoActor = Depends(get_current_actor),
    db: Session = Depends(get_db)
):
    require_reviewer(actor)
    case = db.query(ApplicationCase).filter(ApplicationCase.id == case_id).first()
    if not case:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application case not found.")

    if payload.outcome_status not in [CaseStatus.NEEDS_CLARIFICATION, CaseStatus.PRELIMINARY_REVIEW_COMPLETE]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid outcome status. Stage 1 supports: NEEDS_CLARIFICATION or PRELIMINARY_REVIEW_COMPLETE."
        )

    action_label = "PRELIMINARY_REVIEW_COMPLETED" if payload.outcome_status == CaseStatus.PRELIMINARY_REVIEW_COMPLETE else "NEEDS_CLARIFICATION_FLAGGED"

    transition_case_status(
        db=db,
        case=case,
        target_status=payload.outcome_status,
        actor=actor,
        action_name=action_label,
        details=payload.observation_notes or f"Reviewer recorded outcome: {payload.outcome_status.value}."
    )
    return case

@router.get("/{case_id}/history", response_model=List[AuditEventResponse])
def get_case_audit_history(
    case_id: str,
    actor: DemoActor = Depends(get_current_actor),
    db: Session = Depends(get_db)
):
    case = db.query(ApplicationCase).filter(ApplicationCase.id == case_id).first()
    if not case:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application case not found.")
    verify_case_access(case, actor)

    events = db.query(AuditEvent).filter(AuditEvent.case_id == case_id).order_by(desc(AuditEvent.created_at)).all()
    return events
