from app.core.config import PINECONE_API_KEY, PINECONE_INDEX
from pinecone import Pinecone

pc = Pinecone(api_key=PINECONE_API_KEY)
index = pc.Index(PINECONE_INDEX)
