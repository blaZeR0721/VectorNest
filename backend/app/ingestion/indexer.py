from pinecone_text.sparse import SpladeEncoder

from app.db.pinecone_client import index
from app.ingestion.embedder import get_embeddings

_splade = SpladeEncoder()


def index_documents(docs, file_hash: str, filename: str, user_id: str):
    if not docs:
        raise ValueError("No documents to index.")

    embeddings_model = get_embeddings()
    texts = [doc.page_content for doc in docs]

    dense_vectors = embeddings_model.embed_documents(texts)
    sparse_vectors = _splade.encode_documents(texts)

    vectors = []
    for i, doc in enumerate(docs):
        vector_id = f"{user_id}_{file_hash}_{i}"
        metadata = {
            **doc.metadata,
            "file_hash": file_hash,
            "filename": filename,
            "user_id": user_id,
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
        index.upsert(vectors=vectors[i : i + batch_size], namespace=user_id)


def delete_document(file_hash: str, user_id: str) -> bool:
    index.delete(filter={"file_hash": {"$eq": file_hash}}, namespace=user_id)
    return True
