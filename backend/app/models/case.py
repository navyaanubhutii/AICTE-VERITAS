import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Enum as SQLEnum
from sqlalchemy.orm import relationship
import enum
from app.core.database import Base

class CaseStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    SUBMITTED = "SUBMITTED"
    UNDER_REVIEW = "UNDER_REVIEW"
    NEEDS_CLARIFICATION = "NEEDS_CLARIFICATION"
    RESUBMITTED = "RESUBMITTED"
    PRELIMINARY_REVIEW_COMPLETE = "PRELIMINARY_REVIEW_COMPLETE"

class ApplicationCase(Base):
    __tablename__ = "application_cases"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    case_ref = Column(String(32), unique=True, nullable=False, index=True)
    institution_name = Column(String(255), nullable=False)
    institution_ref = Column(String(64), nullable=False, index=True)
    category = Column(String(128), nullable=False, default="Extension of Approval (EoA)")
    academic_year = Column(String(32), nullable=False, default="2026-2027")
    program_type = Column(String(128), nullable=False, default="Engineering & Technology")
    campus_location = Column(String(255), nullable=True)
    contact_email = Column(String(255), nullable=False)
    contact_phone = Column(String(32), nullable=False)
    
    status = Column(SQLEnum(CaseStatus), nullable=False, default=CaseStatus.DRAFT, index=True)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    submitted_at = Column(DateTime, nullable=True)
    reviewed_at = Column(DateTime, nullable=True)

    # Relationships
    documents = relationship("ApplicationDocument", back_populates="case", cascade="all, delete-orphan", order_by="desc(ApplicationDocument.created_at)")
    clarifications = relationship("ClarificationRequest", back_populates="case", cascade="all, delete-orphan", order_by="desc(ClarificationRequest.requested_at)")
    observations = relationship("ReviewObservation", back_populates="case", cascade="all, delete-orphan", order_by="desc(ReviewObservation.created_at)")
    audit_events = relationship("AuditEvent", back_populates="case", cascade="all, delete-orphan", order_by="desc(AuditEvent.created_at)")
