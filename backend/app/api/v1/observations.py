from datetime import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import DemoActor, get_current_actor, require_reviewer
from app.models.case import ApplicationCase
from app.models.observation import ReviewObservation
from app.models.audit import AuditEvent, AuditActorRole
from app.schemas.observation import ObservationCreate, ObservationResponse

router = APIRouter(prefix="/cases/{case_id}/observations", tags=["observations"])

@router.post("", response_model=ObservationResponse, status_code=status.HTTP_201_CREATED)
def add_review_observation(
    case_id: str,
    payload: ObservationCreate,
    actor: DemoActor = Depends(get_current_actor),
    db: Session = Depends(get_db)
):
    require_reviewer(actor)

    case = db.query(ApplicationCase).filter(ApplicationCase.id == case_id).first()
    if not case:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application case not found.")

    observation = ReviewObservation(
        case_id=case.id,
        reviewer_name=actor.user_name,
        category=payload.category,
        severity=payload.severity,
        notes=payload.notes,
        created_at=datetime.utcnow()
    )
    db.add(observation)

    audit = AuditEvent(
        case_id=case.id,
        actor_role=AuditActorRole.REVIEWER,
        actor_name=actor.user_name,
        action="OBSERVATION_RECORDED",
        details=f"Recorded {payload.severity.value} finding ({payload.category.value}): {payload.notes[:100]}..."
    )
    db.add(audit)
    db.commit()
    db.refresh(observation)

    return observation

@router.get("", response_model=List[ObservationResponse])
def list_review_observations(
    case_id: str,
    actor: DemoActor = Depends(get_current_actor),
    db: Session = Depends(get_db)
):
    case = db.query(ApplicationCase).filter(ApplicationCase.id == case_id).first()
    if not case:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application case not found.")

    if actor.role == "institution" and case.institution_ref != actor.institution_ref:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied to this case.")

    return db.query(ReviewObservation).filter(ReviewObservation.case_id == case.id).order_by(ReviewObservation.created_at.desc()).all()
