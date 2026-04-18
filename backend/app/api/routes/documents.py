from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.db.database import get_db
from app.ingestion.indexer import delete_document
from app.models.models import Document, User
from app.models.schema import DeleteResponse, DocumentResponse

router = APIRouter()


@router.get("/documents", response_model=list[DocumentResponse])
def get_documents(
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    return db.query(Document).filter(Document.user_id == current_user.id).all()


@router.delete("/documents/{document_id}", response_model=DeleteResponse)
def remove_document(
    document_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    doc = (
        db.query(Document)
        .filter(
            Document.id == document_id,
            Document.user_id == current_user.id,
        )
        .first()
    )

    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Document not found."
        )

    delete_document(doc.file_hash, str(current_user.id))
    db.delete(doc)
    db.commit()

    return {"status": "deleted", "document_id": str(doc.id)}
