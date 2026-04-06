import json
import os

from app.db.pinecone_client import index
from app.ingestion.embedder import get_embeddings
from pinecone_text.sparse import SpladeEncoder

REGISTRY_PATH = os.path.join(os.path.dirname(__file__), "..", "document_registry.json")

_splade = SpladeEncoder()


def _load_registry() -> dict:
    if not os.path.exists(REGISTRY_PATH):
        return {}
    with open(REGISTRY_PATH, "r") as f:
        return json.load(f)


def _save_registry(registry: dict):
    with open(REGISTRY_PATH, "w") as f:
        json.dump(registry, f, indent=2)


def is_duplicate(file_hash: str) -> bool:
    registry = _load_registry()
    return file_hash in registry


def index_documents(docs, file_hash: str, filename: str):
    if not docs:
        raise ValueError("No documents to index.")

    embeddings_model = get_embeddings()
    texts = [doc.page_content for doc in docs]

    dense_vectors = embeddings_model.embed_documents(texts)
    sparse_vectors = _splade.encode_documents(texts)

    vectors = []
    for i, doc in enumerate(docs):
        vector_id = f"{file_hash}_{i}"
        metadata = {
            **doc.metadata,
            "file_hash": file_hash,
            "text": doc.page_content,
        }
        vectors.append(
            {
                "id": vector_id,
                "values": dense_vectors[i],
                "sparse_values": sparse_vectors[i],
                "metadata": metadata,
            }
        )

    batch_size = 100
    for i in range(0, len(vectors), batch_size):
        index.upsert(vectors=vectors[i : i + batch_size])

    registry = _load_registry()
    registry[file_hash] = {"filename": filename, "chunk_count": len(docs)}
    _save_registry(registry)


def list_documents() -> list:
    registry = _load_registry()
    return [
        {
            "file_hash": fh,
            "filename": meta["filename"],
            "chunk_count": meta["chunk_count"],
        }
        for fh, meta in registry.items()
    ]


def delete_document(file_hash: str):
    registry = _load_registry()
    if file_hash not in registry:
        return False

    index.delete(filter={"file_hash": {"$eq": file_hash}})

    del registry[file_hash]
    _save_registry(registry)
    return True
