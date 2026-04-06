from typing import AsyncGenerator

from app.rag.generator import get_llm
from app.rag.reranker import get_reranker
from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate

SYSTEM_PROMPT = """You are VectorNest, a retrieval-augmented AI assistant.

Core Rules:
- Use ONLY the provided context.
- Do NOT use prior knowledge.
- Do NOT guess, infer, or fill gaps.

Answer Logic:
1. If the answer is clearly present → return it directly.
2. If partially relevant → return only supported parts and state: "Partial answer based on context."
3. If no relevant information → respond exactly: "I don't know."

Grounding:
- Every statement must be traceable to the context.
- Do not generalize beyond what is written.

Behavior Constraints:
- Be concise.
- No explanations outside context.
- No assumptions.
- No extra commentary.
"""

_PROMPT = ChatPromptTemplate.from_messages(
    [
        ("system", SYSTEM_PROMPT),
        ("human", "Context:\n{context}\n\nQuestion:\n{question}"),
    ]
)

_chain = _PROMPT | get_llm() | StrOutputParser()


async def run_rag_stream(query: str) -> AsyncGenerator[str, None]:
    docs = get_reranker().invoke(query)
    context = "\n\n".join([doc.page_content for doc in docs])
    async for chunk in _chain.astream({"context": context, "question": query}):
        yield chunk
