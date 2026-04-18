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
DATABASE_URL = _require("DATABASE_URL")
JWT_SECRET = _require("JWT_SECRET")
RESEND_API_KEY = _require("RESEND_API_KEY")
MAIL_FROM = _require("MAIL_FROM")
REDIS_URL = _require("REDIS_URL")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:8080")
