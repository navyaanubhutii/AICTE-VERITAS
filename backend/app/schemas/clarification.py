from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict
from app.models.clarification import ClarificationStatus

class ClarificationCreate(BaseModel):
    request_message: str = Field(..., min_length=5, description="Clear description of the deficiency or clarification required.")
    target_doc_type: Optional[str] = Field(None, description="Identifier of the relevant document type if applicable.")

class ClarificationResponseSubmit(BaseModel):
    response_message: str = Field(..., min_length=5, description="Institution's response or clarification explanation.")

class ClarificationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    case_id: str
    reviewer_name: str
    requested_at: datetime
    request_message: str
    target_doc_type: Optional[str]
    status: ClarificationStatus
    response_message: Optional[str]
    responded_at: Optional[datetime]
    responded_by: Optional[str]
