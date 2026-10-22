from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict
from app.models.observation import ObservationCategory, ObservationSeverity

class ObservationCreate(BaseModel):
    category: ObservationCategory = Field(default=ObservationCategory.GENERAL)
    severity: ObservationSeverity = Field(default=ObservationSeverity.INFO)
    notes: str = Field(..., min_length=5, description="Preliminary reviewer observation or notes.")

class ObservationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    case_id: str
    reviewer_name: str
    category: ObservationCategory
    severity: ObservationSeverity
    notes: str
    created_at: datetime
