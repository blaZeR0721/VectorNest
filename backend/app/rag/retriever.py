from langchain_community.retrievers import PineconeHybridSearchRetriever
from pinecone_text.sparse import BM25Encoder
from app.ingestion.embedder import get_embeddings
from app.db.pinecone_client import index
from functools import lru_cache

@lru_cache(maxsize=1)
def _get_bm25() -> BM25Encoder:
    return BM25Encoder.default()

def get_retriever():
    return PineconeHybridSearchRetriever(
        embeddings=get_embeddings(),
        sparse_encoder=_get_bm25(),
        index=index,
        top_k=4,
        alpha=0.5,
        text_key="text",
    )