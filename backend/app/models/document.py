import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Boolean, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
import enum
from app.core.database import Base

class DocumentType(str, enum.Enum):
    LAND_BUILDING_DEED = "LAND_BUILDING_DEED"
    PREVIOUS_EOA_LETTER = "PREVIOUS_EOA_LETTER"
    FACULTY_SALARY_STATEMENT = "FACULTY_SALARY_STATEMENT"
    FIRE_SAFETY_CERTIFICATE = "FIRE_SAFETY_CERTIFICATE"
    OTHER_SUPPORTING = "OTHER_SUPPORTING"

class DocumentProcessingStatus(str, enum.Enum):
    UPLOADED = "UPLOADED"
    VERIFIED_MIME = "VERIFIED_MIME"
    FLAGGED = "FLAGGED"

class ApplicationDocument(Base):
    __tablename__ = "application_documents"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    case_id = Column(String(36), ForeignKey("application_cases.id"), nullable=False, index=True)
    doc_type = Column(SQLEnum(DocumentType), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    original_filename = Column(String(255), nullable=False)
    stored_filename = Column(String(255), nullable=False)
    mime_type = Column(String(128), nullable=False)
    file_size_bytes = Column(Integer, nullable=False)
    sha256_hash = Column(String(64), nullable=False, index=True)
    version = Column(Integer, default=1, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    processing_status = Column(SQLEnum(DocumentProcessingStatus), default=DocumentProcessingStatus.VERIFIED_MIME, nullable=False)
    uploaded_by_role = Column(String(64), nullable=False, default="institution")
    uploaded_by_name = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    case = relationship("ApplicationCase", back_populates="documents")
