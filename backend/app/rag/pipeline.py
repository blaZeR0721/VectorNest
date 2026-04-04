from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate

from app.rag.generator import get_llm
from app.rag.reranker import get_reranker, get_dense_reranker

SYSTEM_PROMPT = """You are VectorNest, an intelligent assistant that answers questions strictly based on the provided document context.

Rules:
- Answer only from the context provided. Never use outside knowledge.
- If the answer is not in the context, respond exactly with: "I don't have enough information in the provided documents to answer that."
- Be concise and precise. Do not pad your answers.
- If the context contains partial information, share what is available and state what is missing.
- Never make up facts, statistics, or details not present in the context.
- Maintain a professional and helpful tone at all times."""

_PROMPT = ChatPromptTemplate.from_messages([
    ("system", SYSTEM_PROMPT),
    ("human", "Context:\n{context}\n\nQuestion:\n{question}")
])

_chain = _PROMPT | get_llm() | StrOutputParser()


def run_rag(query: str) -> str:
    try:
        docs = get_reranker().invoke(query)
    except Exception:
        docs = get_dense_reranker().invoke(query)

    context = "\n\n".join([doc.page_content for doc in docs])
    return _chain.invoke({"context": context, "question": query})

