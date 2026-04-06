from functools import lru_cache

from app.db.pinecone_client import index
from app.ingestion.embedder import get_embeddings
from langchain_community.retrievers import PineconeHybridSearchRetriever
from pinecone_text.sparse import SpladeEncoder


@lru_cache(maxsize=1)
def _get_splade() -> SpladeEncoder:
    return SpladeEncoder()


@lru_cache(maxsize=1)
def get_retriever() -> PineconeHybridSearchRetriever:
    return PineconeHybridSearchRetriever(
        embeddings=get_embeddings(),
        sparse_encoder=_get_splade(),
        index=index,
        top_k=15,
        alpha=0.6,
        text_key="text",
    )
