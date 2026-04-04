from langchain_community.retrievers import PineconeHybridSearchRetriever
from pinecone_text.sparse import BM25Encoder
from app.ingestion.embedder import get_embeddings
from app.db.pinecone_client import index
from app.db.bm25_store import BM25_PATH
import os

def get_retriever():
    if os.path.exists(BM25_PATH):
        bm25 = BM25Encoder().load(BM25_PATH)
    else:
        bm25 = BM25Encoder.default()

    return PineconeHybridSearchRetriever(
        embeddings=get_embeddings(),
        sparse_encoder=bm25,
        index=index,
        top_k=4,
        alpha=0.5,
        text_key="text"
    )
