import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
import enum
from app.core.database import Base

class AuditActorRole(str, enum.Enum):
    INSTITUTION = "INSTITUTION"
    REVIEWER = "REVIEWER"
    SYSTEM = "SYSTEM"

class AuditEvent(Base):
    __tablename__ = "audit_events"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    case_id = Column(String(36), ForeignKey("application_cases.id"), nullable=False, index=True)
    actor_role = Column(SQLEnum(AuditActorRole), nullable=False)
    actor_name = Column(String(255), nullable=False)
    action = Column(String(128), nullable=False, index=True)
    details = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    case = relationship("ApplicationCase", back_populates="audit_events")
