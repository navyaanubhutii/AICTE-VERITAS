from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field, EmailStr, ConfigDict
from app.models.case import CaseStatus
from app.schemas.document import DocumentResponse
from app.schemas.clarification import ClarificationResponse
from app.schemas.observation import ObservationResponse
from app.schemas.audit import AuditEventResponse

class CaseCreate(BaseModel):
    institution_name: str = Field(..., min_length=3, max_length=255, description="Full registered legal name of technical institution.")
    institution_ref: str = Field(..., min_length=2, max_length=64, description="Permanent AICTE / Demo Institution Code (e.g., NIT-DEMO-01).")
    category: str = Field(default="Extension of Approval (EoA)", max_length=128)
    academic_year: str = Field(default="2026-2027", max_length=32)
    program_type: str = Field(default="Engineering & Technology", max_length=128)
    campus_location: Optional[str] = Field(None, max_length=255)
    contact_email: EmailStr = Field(..., description="Official registrar or principal contact email.")
    contact_phone: str = Field(..., min_length=8, max_length=32, description="Institutional official contact phone.")

class CaseSummaryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    case_ref: str
    institution_name: str
    institution_ref: str
    category: str
    academic_year: str
    program_type: str
    campus_location: Optional[str]
    contact_email: str
    contact_phone: str
    status: CaseStatus
    document_count: int = 0
    open_clarifications_count: int = 0
    created_at: datetime
    updated_at: datetime
    submitted_at: Optional[datetime]
    reviewed_at: Optional[datetime]

class CaseDetailResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    case_ref: str
    institution_name: str
    institution_ref: str
    category: str
    academic_year: str
    program_type: str
    campus_location: Optional[str]
    contact_email: str
    contact_phone: str
    status: CaseStatus
    created_at: datetime
    updated_at: datetime
    submitted_at: Optional[datetime]
    reviewed_at: Optional[datetime]
    
    documents: List[DocumentResponse] = []
    clarifications: List[ClarificationResponse] = []
    observations: List[ObservationResponse] = []
    audit_events: List[AuditEventResponse] = []

class ReviewOutcomeSubmit(BaseModel):
    outcome_status: CaseStatus = Field(
        ...,
        description="Target outcome: NEEDS_CLARIFICATION or PRELIMINARY_REVIEW_COMPLETE."
    )
    observation_notes: Optional[str] = Field(None, description="Detailed notes or final remarks by the reviewer.")
