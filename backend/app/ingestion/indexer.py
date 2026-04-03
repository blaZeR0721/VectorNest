from langchain_pinecone import PineconeVectorStore
from app.ingestion.embedder import get_embeddings
from app.core.config import PINECONE_INDEX
from app.db.pinecone import index

def is_duplicate(file_hash:str) -> bool:
    results = index.query(
        vector=[0.0] * 384,
        filter={'file_hash':{"$eq":file_hash}},
        top_k=1
    )
    return len(results.matches) > 0

def index_documents(docs,file_hash:str):
    embeddings = get_embeddings()

    for doc in docs:
        doc.metadata["file_hash"] = file_hash
    PineconeVectorStore.from_documents(
        documents=docs,
        embedding=embeddings,
        index_name=PINECONE_INDEX
    )


