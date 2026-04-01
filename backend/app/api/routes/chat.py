from fastapi import APIRouter
from pydantic import BaseModel
from app.rag.pipeline import run_rag

router = APIRouter()

class QueryRequest(BaseModel):
    query:str

@router.post("/chat")
def chat(req:QueryRequest):
    answer = run_rag(req.query)
    return {"response":answer}
