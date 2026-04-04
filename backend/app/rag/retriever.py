from langchain_community.retrievers import PineconeHybridSearchRetriever
from pinecone_text.sparse import BM25Encoder
from app.ingestion.embedder import get_embeddings
from app.db.pinecone_client import index
from functools import lru_cache
import os

BM25_PATH = os.path.join(os.path.dirname(__file__), "bm25_default.json")

@lru_cache(maxsize=1)
def _get_bm25() -> BM25Encoder:
    if os.path.exists(BM25_PATH):
        return BM25Encoder().load(BM25_PATH)
    bm25 = BM25Encoder.default()
    bm25.dump(BM25_PATH)
    return bm25

@lru_cache(maxsize=1)
def get_retriever():
    return PineconeHybridSearchRetriever(
        embeddings=get_embeddings(),
        sparse_encoder=_get_bm25(),
        index=index,
        top_k=4,
        alpha=0.6,
        text_key="text",
    )