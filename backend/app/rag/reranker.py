from functools import lru_cache

from langchain_classic.retrievers import ContextualCompressionRetriever
from langchain_cohere import CohereRerank

from app.core.config import COHERE_API_KEY
from app.rag.retriever import get_retriever


@lru_cache(maxsize=1)
def _get_compressor() -> CohereRerank:
    return CohereRerank(
        cohere_api_key=COHERE_API_KEY, model="rerank-english-v3.0", top_n=6
    )


@lru_cache(maxsize=64)
def get_reranker(namespace: str) -> ContextualCompressionRetriever:
    return ContextualCompressionRetriever(
        base_compressor=_get_compressor(),
        base_retriever=get_retriever(namespace=namespace, top_k=20, alpha=0.55),
    )
