from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel,Field
from app.rag.pipeline import run_rag

router = APIRouter()


class QueryRequest(BaseModel):
    query: str = Field(..., min_length=1)


class QueryResponse(BaseModel):
    response: str


@router.post("/chat", response_model=QueryResponse)
def chat(req: QueryRequest):
    try:
        answer = run_rag(req.query)

        if not answer:
            raise ValueError("The RAG pipeline returned an empty response.")
        return {"response": answer}

    except ConnectionError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"The AI service is temporarily unavailable. Please try again later.",
        )

    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(ve))

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An internal error occured while processing your request",
        )
