from langchain_pinecone import PineconeVectorStore
from app.ingestion.embedder import get_embeddings
from app.core.config import PINECONE_INDEX

def get_retriever():
    embeddings = get_embeddings()

    vectorstore = PineconeVectorStore.from_existing_index(
        index_name=PINECONE_INDEX,
        embedding=embeddings
    )
    return vectorstore.as_retriever(search_kwargs={"k":4})

