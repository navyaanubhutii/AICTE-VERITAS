from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict
from app.models.audit import AuditActorRole

class AuditEventResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    case_id: str
    actor_role: AuditActorRole
    actor_name: str
    action: str
    details: Optional[str]
    created_at: datetime
