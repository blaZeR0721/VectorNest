from functools import lru_cache

from langchain_community.retrievers import PineconeHybridSearchRetriever
from pinecone_text.sparse import SpladeEncoder

from app.db.pinecone_client import index
from app.ingestion.embedder import get_embeddings


@lru_cache(maxsize=1)
def _get_splade() -> SpladeEncoder:
    # Lazy-load heavy sparse encoder only once per process.
    return SpladeEncoder()


@lru_cache(maxsize=64)
def get_retriever(
    namespace: str, top_k: int = 20, alpha: float = 0.55
) -> PineconeHybridSearchRetriever:
    return PineconeHybridSearchRetriever(
        embeddings=get_embeddings(),
        sparse_encoder=_get_splade(),
        index=index,
        top_k=top_k,
        alpha=alpha,
        text_key="text",
        namespace=namespace,
    )
