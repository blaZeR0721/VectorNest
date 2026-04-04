from fastapi import APIRouter, HTTPException, status
from app.ingestion.indexer import list_documents, delete_document

router = APIRouter()


@router.get("/documents")
def get_documents():
    return list_documents()


@router.delete("/documents/{file_hash}")
def remove_document(file_hash: str):
    deleted = delete_document(file_hash)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found."
        )
    return {"status": "deleted", "file_hash": file_hash}