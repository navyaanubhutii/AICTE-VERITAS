from datetime import datetime
from typing import Optional, Dict, Set, Tuple
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.models.case import ApplicationCase, CaseStatus
from app.models.audit import AuditEvent, AuditActorRole
from app.core.security import DemoActor

# Allowed transitions: (CurrentStatus, TargetStatus) -> Set of allowed actor roles
ALLOWED_TRANSITIONS: Dict[Tuple[CaseStatus, CaseStatus], Set[str]] = {
    (CaseStatus.DRAFT, CaseStatus.SUBMITTED): {"institution"},
    (CaseStatus.SUBMITTED, CaseStatus.UNDER_REVIEW): {"reviewer", "admin"},
    (CaseStatus.UNDER_REVIEW, CaseStatus.NEEDS_CLARIFICATION): {"reviewer", "admin"},
    (CaseStatus.NEEDS_CLARIFICATION, CaseStatus.RESUBMITTED): {"institution"},
    (CaseStatus.RESUBMITTED, CaseStatus.UNDER_REVIEW): {"reviewer", "admin"},
    (CaseStatus.UNDER_REVIEW, CaseStatus.PRELIMINARY_REVIEW_COMPLETE): {"reviewer", "admin"},
}

def transition_case_status(
    db: Session,
    case: ApplicationCase,
    target_status: CaseStatus,
    actor: DemoActor,
    action_name: str,
    details: Optional[str] = None
) -> ApplicationCase:
    """
    Validates state transition legality, actor role authorization, updates case status,
    and logs an immutable AuditEvent in the database.
    """
    current_status = case.status

    if current_status == target_status:
        # Idempotent or no-op
        return case

    transition_pair = (current_status, target_status)
    if transition_pair not in ALLOWED_TRANSITIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Illegal lifecycle transition: Cannot move case from {current_status.value} to {target_status.value}."
        )

    allowed_roles = ALLOWED_TRANSITIONS[transition_pair]
    if actor.role not in allowed_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Unauthorized: Role '{actor.role}' cannot trigger transition from {current_status.value} to {target_status.value}."
        )

    # Perform transition
    case.status = target_status
    case.updated_at = datetime.utcnow()

    if target_status == CaseStatus.SUBMITTED:
        case.submitted_at = datetime.utcnow()
    elif target_status == CaseStatus.PRELIMINARY_REVIEW_COMPLETE:
        case.reviewed_at = datetime.utcnow()

    # Determine audit actor role
    audit_role = AuditActorRole.INSTITUTION if actor.role == "institution" else AuditActorRole.REVIEWER

    audit_event = AuditEvent(
        case_id=case.id,
        actor_role=audit_role,
        actor_name=actor.user_name,
        action=action_name,
        details=details or f"Transitioned status from {current_status.value} to {target_status.value}."
    )
    db.add(audit_event)
    db.commit()
    db.refresh(case)

    return case
