from functools import lru_cache

from app.core.config import COHERE_API_KEY
from app.rag.retriever import get_retriever
from langchain_classic.retrievers import ContextualCompressionRetriever
from langchain_cohere import CohereRerank


@lru_cache(maxsize=1)
def _get_compressor() -> CohereRerank:
    return CohereRerank(
        cohere_api_key=COHERE_API_KEY, model="rerank-english-v3.0", top_n=5
    )


@lru_cache(maxsize=1)
def get_reranker() -> ContextualCompressionRetriever:
    return ContextualCompressionRetriever(
        base_compressor=_get_compressor(), base_retriever=get_retriever()
    )
