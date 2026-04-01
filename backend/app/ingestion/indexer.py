from langchain_pinecone import PineconeVectorStore
from app.ingestion.embedder import get_embeddings
from app.core.config import PINECONE_INDEX

def index_documents(docs):
    embeddings = get_embeddings()

    PineconeVectorStore.from_documents(
        documents=docs,
        embedding=embeddings,
        index_name=PINECONE_INDEX
    )


