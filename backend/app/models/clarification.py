import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
import enum
from app.core.database import Base

class ClarificationStatus(str, enum.Enum):
    OPEN = "OPEN"
    RESPONDED = "RESPONDED"
    RESOLVED = "RESOLVED"

class ClarificationRequest(Base):
    __tablename__ = "clarification_requests"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    case_id = Column(String(36), ForeignKey("application_cases.id"), nullable=False, index=True)
    reviewer_name = Column(String(255), nullable=False)
    requested_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    request_message = Column(Text, nullable=False)
    target_doc_type = Column(String(128), nullable=True)
    status = Column(SQLEnum(ClarificationStatus), default=ClarificationStatus.OPEN, nullable=False)
    
    response_message = Column(Text, nullable=True)
    responded_at = Column(DateTime, nullable=True)
    responded_by = Column(String(255), nullable=True)

    case = relationship("ApplicationCase", back_populates="clarifications")
