import hashlib
import os
import uuid
from pathlib import Path
from typing import Tuple
from fastapi import UploadFile, HTTPException, status
from app.core.config import settings, storage_path

# Magic bytes signatures for content validation
MAGIC_SIGNATURES = {
    "application/pdf": [b"%PDF"],
    "image/png": [b"\x89PNG\r\n\x1a\n"],
    "image/jpeg": [b"\xff\xd8\xff"],
}

EXTENSION_MIME_MAP = {
    ".pdf": "application/pdf",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
}

def validate_file_content_and_signature(header: bytes, filename: str) -> str:
    """
    Validates true file signature / magic bytes against allowed document formats.
    Returns the verified MIME type.
    """
    ext = Path(filename).suffix.lower()
    if ext not in settings.ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file extension '{ext}'. Allowed extensions: {', '.join(settings.ALLOWED_EXTENSIONS)}"
        )

    expected_mime = EXTENSION_MIME_MAP.get(ext)
    signatures = MAGIC_SIGNATURES.get(expected_mime, [])

    valid = any(header.startswith(sig) for sig in signatures)
    if not valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Content validation failed: File content does not match expected {expected_mime} signature."
        )

    return expected_mime

async def process_and_store_upload(upload_file: UploadFile) -> Tuple[str, str, int, str, str]:
    """
    Reads upload, validates size, extension, magic bytes, computes SHA-256,
    and safely writes to private local storage directory.
    Returns (stored_filename, mime_type, file_size_bytes, sha256_hash, safe_ext).
    """
    ext = Path(upload_file.filename or "").suffix.lower()
    if not ext:
        ext = ".pdf"

    # Read content in memory or chunking (10MB max is safe for memory)
    content = await upload_file.read()
    file_size = len(content)

    max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
    if file_size > max_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File exceeds maximum allowed size of {settings.MAX_UPLOAD_SIZE_MB}MB (received {file_size / (1024*1024):.2f}MB)."
        )

    if file_size == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Empty file upload rejected."
        )

    # Magic bytes validation
    header = content[:32]
    mime_type = validate_file_content_and_signature(header, upload_file.filename or "doc.pdf")

    # Compute SHA-256
    sha256 = hashlib.sha256(content).hexdigest()

    # Generate isolated safe filename
    stored_filename = f"{uuid.uuid4().hex}{ext}"
    target_path = storage_path / stored_filename

    # Save to private storage
    with open(target_path, "wb") as f:
        f.write(content)

    return stored_filename, mime_type, file_size, sha256, ext

def get_stored_file_path(stored_filename: str) -> Path:
    """
    Returns absolute path to stored file and protects against path traversal.
    """
    safe_name = Path(stored_filename).name
    full_path = (storage_path / safe_name).resolve()
    
    # Path traversal check
    if not str(full_path).startswith(str(storage_path.resolve())):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file path reference."
        )

    if not full_path.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Requested document file not found on storage."
        )

    return full_path
