from langchain_groq import ChatGroq
from app.core.config import GROQ_API_KEY
from functools import lru_cache

@lru_cache(maxsize=1)
def get_llm():
    return ChatGroq(
        api_key=GROQ_API_KEY,
        model='llama-3.3-70b-versatile',
        temperature=0,
        max_tokens=512
    )