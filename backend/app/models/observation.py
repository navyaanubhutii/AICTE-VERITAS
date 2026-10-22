import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
import enum
from app.core.database import Base

class ObservationCategory(str, enum.Enum):
    DOCUMENTATION = "DOCUMENTATION"
    REGULATORY_AFFILIATION = "REGULATORY_AFFILIATION"
    FACULTY_CADRE = "FACULTY_CADRE"
    INFRASTRUCTURE = "INFRASTRUCTURE"
    GENERAL = "GENERAL"

class ObservationSeverity(str, enum.Enum):
    INFO = "INFO"
    WARNING = "WARNING"
    DEFICIENCY = "DEFICIENCY"

class ReviewObservation(Base):
    __tablename__ = "review_observations"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    case_id = Column(String(36), ForeignKey("application_cases.id"), nullable=False, index=True)
    reviewer_name = Column(String(255), nullable=False)
    category = Column(SQLEnum(ObservationCategory), default=ObservationCategory.GENERAL, nullable=False)
    severity = Column(SQLEnum(ObservationSeverity), default=ObservationSeverity.INFO, nullable=False)
    notes = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    case = relationship("ApplicationCase", back_populates="observations")
