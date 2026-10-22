from typing import Optional
from fastapi import Header, Query, HTTPException, status
from pydantic import BaseModel

class DemoActor(BaseModel):
    role: str  # "institution" or "reviewer"
    institution_ref: Optional[str] = None
    user_name: str
    user_id: str

def get_current_actor(
    x_demo_role: Optional[str] = Header(None, alias="X-Demo-Role"),
    x_demo_institution_ref: Optional[str] = Header(None, alias="X-Demo-Institution-Ref"),
    x_demo_user_name: Optional[str] = Header(None, alias="X-Demo-User-Name"),
    role: Optional[str] = Query(None),
    institution_ref: Optional[str] = Query(None),
    user_name: Optional[str] = Query(None)
) -> DemoActor:
    """
    Stage 1 Demo Authentication & Authorization Provider.
    Extracts simulated authenticated identity from headers (or query params for file downloads).
    Enforces server-side validation of roles and actor identity.
    """
    resolved_role = (x_demo_role or role or "").lower().strip()
    resolved_inst = (x_demo_institution_ref or institution_ref or "").strip()
    resolved_name = (x_demo_user_name or user_name or "").strip()

    if not resolved_role:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required: Missing X-Demo-Role header or role parameter."
        )

    if resolved_role not in ["institution", "reviewer", "admin", "system"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Invalid role '{resolved_role}'. Allowed roles: 'institution', 'reviewer'."
        )

    if resolved_role == "institution" and not resolved_inst:
        resolved_inst = "NIT-DEMO-01"  # Default fallback institution in demo
    
    if not resolved_name:
        resolved_name = "AICTE Demo Reviewer" if resolved_role == "reviewer" else "Institutional Head"

    user_id = f"{resolved_role}:{resolved_inst or 'aicte-hq'}"

    return DemoActor(
        role=resolved_role,
        institution_ref=resolved_inst if resolved_role == "institution" else None,
        user_name=resolved_name,
        user_id=user_id
    )

def require_reviewer(actor: DemoActor) -> DemoActor:
    if actor.role not in ["reviewer", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: Reviewer privileges required."
        )
    return actor

def require_institution(actor: DemoActor) -> DemoActor:
    if actor.role != "institution":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: Institution privileges required."
        )
    return actor
