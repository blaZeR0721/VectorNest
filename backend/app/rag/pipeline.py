from typing import AsyncGenerator
from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate
from app.rag.generator import get_llm
from app.rag.reranker import get_dense_reranker, get_reranker

SYSTEM_PROMPT = """You are VectorNest, an intelligent assistant that answers questions strictly based on the provided document context.

Rules:
- Answer only from the provided context. Never use outside knowledge.
- If the answer is not in the context, respond exactly with: "I don't have enough information in the provided documents to answer that."
- If the context contains partial information, answer directly from what is available. Do not explain what is missing.
- Be concise and direct. One clear answer with no preamble, no repetition, no filler.
- Never make up facts, statistics, or details not present in the context.
- Maintain a professional tone."""

_PROMPT = ChatPromptTemplate.from_messages(
    [
        ("system", SYSTEM_PROMPT),
        ("human", "Context:\n{context}\n\nQuestion:\n{question}"),
    ]
)

_chain = _PROMPT | get_llm() | StrOutputParser()


def _get_docs(query: str):
    try:
        return get_reranker().invoke(query)
    except Exception:
        return get_dense_reranker().invoke(query)


async def run_rag_stream(query: str) -> AsyncGenerator[str, None]:
    docs = _get_docs(query)
    context = "\n\n".join([doc.page_content for doc in docs])
    async for chunk in _chain.astream({"context": context, "question": query}):
        yield chunk
