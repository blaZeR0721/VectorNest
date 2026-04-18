import re
from typing import AsyncGenerator, Iterable

from langchain_core.documents import Document
from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate

from app.rag.generator import get_llm
from app.rag.reranker import get_reranker

SYSTEM_PROMPT = """You are VectorNest, a retrieval-augmented AI assistant.

Core Rules:
- Use ONLY the provided context.
- Do NOT use prior knowledge.
- Do NOT guess, infer, or fill gaps.

Answer Logic:
1. If the answer is clearly present → return it directly.
2. If partially relevant → return only supported parts and end with: "Partial answer based on context."
3. If no relevant information → respond exactly: "I don't know."

Grounding:
- Every statement must be traceable to the context.
- Do not generalize beyond what is written.

Behavior Constraints:
- Be concise.
- If the user asks for a list/sequence and context is incomplete, include only items explicitly found in context.
- Do not repeat the same item multiple times.
- No explanations outside context, assumptions, or extra commentary.
"""

_PROMPT = ChatPromptTemplate.from_messages(
    [
        ("system", SYSTEM_PROMPT),
        ("human", "Context:\n{context}\n\nQuestion:\n{question}"),
    ]
)

_CHAIN = _PROMPT | get_llm() | StrOutputParser()


def _score(doc: Document) -> float:
    raw = doc.metadata.get("relevance_score")
    try:
        return float(raw) if raw is not None else 0.0
    except (TypeError, ValueError):
        return 0.0


_STOPWORDS = {
    "what",
    "which",
    "when",
    "where",
    "who",
    "why",
    "how",
    "are",
    "the",
    "and",
    "for",
    "with",
    "from",
    "this",
    "that",
    "into",
    "about",
    "your",
}


def _query_terms(query: str) -> set[str]:
    terms = re.findall(r"[a-zA-Z0-9]+", query.lower())
    return {t for t in terms if len(t) >= 4 and t not in _STOPWORDS}


def _keyword_overlap(query_terms: set[str], text: str) -> float:
    if not query_terms:
        return 0.0
    hay = text.lower()
    hits = sum(1 for term in query_terms if term in hay)
    return hits / len(query_terms)


def _select_docs(query: str, docs: list[Document], max_docs: int = 6) -> list[Document]:
    terms = _query_terms(query)
    ranked: list[tuple[float, float, float, Document]] = []
    for doc in docs:
        text = doc.page_content or ""
        sem = _score(doc)
        overlap = _keyword_overlap(terms, text)
        combined = (0.7 * sem) + (0.3 * overlap)
        ranked.append((combined, overlap, sem, doc))

    ranked.sort(key=lambda x: (x[0], x[1], x[2]), reverse=True)
    selected: list[Document] = []
    for _, overlap, sem, doc in ranked:
        if overlap >= 0.2 or sem >= 0.08:
            selected.append(doc)
        if len(selected) >= max_docs:
            break

    if not selected:
        selected = [doc for _, _, _, doc in ranked[: min(3, len(ranked))]]

    return selected


def _build_context(docs: Iterable[Document], max_docs: int = 6) -> str:
    selected = list(docs)[:max_docs]
    chunks: list[str] = []
    for i, doc in enumerate(selected, start=1):
        source = doc.metadata.get("filename", "unknown")
        text = (doc.page_content or "").strip()
        if not text:
            continue
        chunks.append(f"[{i}] source={source}\n{text[:1200]}")
    return "\n\n".join(chunks)


async def run_rag_stream(query: str, namespace: str) -> AsyncGenerator[str, None]:
    reranker = get_reranker(namespace)
    docs = reranker.invoke(query)
    # Defense-in-depth: even with namespace isolation, keep only chunks tagged to this user.
    docs = [doc for doc in docs if str(doc.metadata.get("user_id", "")) == namespace]
    if not docs:
        yield "I don't know."
        return

    selected_docs = _select_docs(query, docs, max_docs=6)
    context = _build_context(selected_docs)

    if not context:
        yield "I don't know."
        return

    async for chunk in _CHAIN.astream({"context": context, "question": query}):
        yield chunk
