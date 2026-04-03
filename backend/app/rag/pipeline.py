from app.rag.retriever import get_retriever
from app.rag.generator import get_llm
from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate


retriever = get_retriever()
llm = get_llm()

template = """
Answer strictly using the context below.
If the answer is not in the context, say "I don't know".

Context:
{context}

Question:
{question}
"""


def run_rag(query: str):
    docs = retriever.invoke(query)

    context = "\n\n".join([doc.page_content for doc in docs])

    prompt = ChatPromptTemplate.from_template(template)

    chain = prompt | llm | StrOutputParser()

    return chain.invoke({"context": context, "question": query})
