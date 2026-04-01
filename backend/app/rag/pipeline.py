from app.rag.retriever import get_retriever
from app.rag.generator import get_llm

retriever = get_retriever()
llm = get_llm()

def run_rag(query:str):
    docs = retriever.invoke(query)

    context = "\n\n".join([doc.page_content for doc in docs])

    prompt = (
        "Answer strictly using the context below.\n"
        "If the answer is not in the context, say \"I don't know\".\n\n"
        f"Context:\n{context}\n\n"
        f"Question:\n{query}"
    )
    
    return llm.invoke(prompt).content

