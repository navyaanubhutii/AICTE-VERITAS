from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict
from app.models.document import DocumentType, DocumentProcessingStatus

class DocumentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    case_id: str
    doc_type: DocumentType
    title: str
    original_filename: str
    file_size_bytes: int
    mime_type: str
    sha256_hash: str
    version: int
    is_active: bool
    processing_status: DocumentProcessingStatus
    uploaded_by_role: str
    uploaded_by_name: str
    created_at: datetime
