import hashlib
import os

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.db.database import get_db
from app.ingestion.chunking import split_docs
from app.ingestion.indexer import index_documents
from app.ingestion.loader import load_file
from app.models.models import Document, User
from app.models.schema import UploadResponse

router = APIRouter()

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "uploads")
ALLOWED_EXTENSIONS = {".pdf", ".csv", ".txt", ".docx"}
MAX_FILE_SIZE = {
    ".txt": 1 * 1024 * 1024,
    ".csv": 3 * 1024 * 1024,
    ".pdf": 10 * 1024 * 1024,
    ".docx": 5 * 1024 * 1024,
}

os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/uploads", response_model=UploadResponse)
async def upload_file(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    extension = os.path.splitext(file.filename)[1].lower()
    if extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file type. Allowed: {', '.join(ALLOWED_EXTENSIONS)}",
        )

    max_file_size = MAX_FILE_SIZE.get(extension)
    if file.size > max_file_size:
        raise HTTPException(
            status_code=status.HTTP_413_CONTENT_TOO_LARGE,
            detail=f"File too large, maximum size for {extension} is {max_file_size // (1024 * 1024)}MB",
        )

    user_id = str(current_user.id)
    file_path = os.path.join(UPLOAD_DIR, f"{user_id}_{file.filename}")
    hasher = hashlib.sha256()
    chunks = []

    try:
        with open(file_path, "wb") as f:
            while chunk := await file.read(1024 * 1024):
                hasher.update(chunk)
                f.write(chunk)

        file_hash = hasher.hexdigest()

        existing = (
            db.query(Document)
            .filter(
                Document.user_id == current_user.id, Document.file_hash == file_hash
            )
            .first()
        )

        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"{file.filename} has already been uploaded.",
            )

        docs = load_file(file_path)
        chunks = split_docs(docs)
        index_documents(chunks, file_hash, file.filename, user_id)

        doc = Document(
            user_id=current_user.id, filename=file.filename, file_hash=file_hash
        )
        db.add(doc)
        db.commit()
        db.refresh(doc)

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing {extension} file: {str(e)}",
        )

    finally:
        if os.path.exists(file_path):
            os.remove(file_path)

    return {"status": "indexed", "filename": file.filename, "chunk_count": len(chunks)}
