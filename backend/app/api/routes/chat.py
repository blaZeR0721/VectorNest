from app.models.schema import QueryRequest
from app.rag.pipeline import run_rag_stream
from fastapi import APIRouter, HTTPException, status
from fastapi.responses import StreamingResponse

router = APIRouter()


async def _stream_with_error_guard(query: str):
    try:
        async for chunk in run_rag_stream(query):
            yield chunk
    except ConnectionError:
        yield "The AI service is temporarily unavailable."
    except Exception:
        yield "An internal error occurred while processing your request."


@router.post("/chat")
async def chat(req: QueryRequest):
    if not req.query:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Query must not be empty."
        )
    return StreamingResponse(
        _stream_with_error_guard(req.query), media_type="text/plain"
    )
