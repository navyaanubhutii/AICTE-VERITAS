from datetime import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import DemoActor, get_current_actor, require_institution, require_reviewer
from app.models.case import ApplicationCase, CaseStatus
from app.models.clarification import ClarificationRequest, ClarificationStatus
from app.models.observation import ReviewObservation, ObservationCategory, ObservationSeverity
from app.models.audit import AuditEvent, AuditActorRole
from app.schemas.clarification import ClarificationCreate, ClarificationResponseSubmit, ClarificationResponse
from app.services.lifecycle import transition_case_status

router = APIRouter(prefix="/cases/{case_id}/clarifications", tags=["clarifications"])

@router.post("", response_model=ClarificationResponse, status_code=status.HTTP_201_CREATED)
def request_clarification(
    case_id: str,
    payload: ClarificationCreate,
    actor: DemoActor = Depends(get_current_actor),
    db: Session = Depends(get_db)
):
    require_reviewer(actor)

    case = db.query(ApplicationCase).filter(ApplicationCase.id == case_id).first()
    if not case:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application case not found.")

    # Move case to NEEDS_CLARIFICATION if not already
    if case.status != CaseStatus.NEEDS_CLARIFICATION:
        transition_case_status(
            db=db,
            case=case,
            target_status=CaseStatus.NEEDS_CLARIFICATION,
            actor=actor,
            action_name="CLARIFICATION_REQUESTED",
            details=f"Clarification requested by {actor.user_name}: {payload.request_message[:100]}..."
        )

    clarification = ClarificationRequest(
        case_id=case.id,
        reviewer_name=actor.user_name,
        requested_at=datetime.utcnow(),
        request_message=payload.request_message,
        target_doc_type=payload.target_doc_type,
        status=ClarificationStatus.OPEN
    )
    db.add(clarification)

    # Automatically add a deficiency observation for transparency
    observation = ReviewObservation(
        case_id=case.id,
        reviewer_name=actor.user_name,
        category=ObservationCategory.DOCUMENTATION,
        severity=ObservationSeverity.DEFICIENCY,
        notes=f"Clarification Notice: {payload.request_message}"
    )
    db.add(observation)

    db.commit()
    db.refresh(clarification)
    return clarification

@router.post("/{clarification_id}/respond", response_model=ClarificationResponse)
def respond_to_clarification(
    case_id: str,
    clarification_id: str,
    payload: ClarificationResponseSubmit,
    actor: DemoActor = Depends(get_current_actor),
    db: Session = Depends(get_db)
):
    require_institution(actor)

    case = db.query(ApplicationCase).filter(ApplicationCase.id == case_id).first()
    if not case:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application case not found.")

    if case.institution_ref != actor.institution_ref:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied to this case.")

    clarification = db.query(ClarificationRequest).filter(
        ClarificationRequest.id == clarification_id,
        ClarificationRequest.case_id == case.id
    ).first()

    if not clarification:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Clarification request not found.")

    if clarification.status == ClarificationStatus.RESPONDED:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Clarification has already been responded to.")

    # Record response
    clarification.response_message = payload.response_message
    clarification.responded_at = datetime.utcnow()
    clarification.responded_by = actor.user_name
    clarification.status = ClarificationStatus.RESPONDED

    # Transition case to RESUBMITTED
    transition_case_status(
        db=db,
        case=case,
        target_status=CaseStatus.RESUBMITTED,
        actor=actor,
        action_name="CLARIFICATION_RESPONDED",
        details=f"Institution submitted clarification response: {payload.response_message[:120]}..."
    )

    db.commit()
    db.refresh(clarification)
    return clarification
