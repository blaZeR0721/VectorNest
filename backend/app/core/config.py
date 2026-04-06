import os

from dotenv import load_dotenv

load_dotenv()


def _require(key: str) -> str:
    value = os.getenv(key)
    if not value:
        raise RuntimeError(f"Missing required environment variable: {key}")
    return value


GROQ_API_KEY = _require("GROQ_API_KEY")
PINECONE_API_KEY = _require("PINECONE_API_KEY")
PINECONE_INDEX = _require("PINECONE_INDEX")
COHERE_API_KEY = _require("COHERE_API_KEY")
