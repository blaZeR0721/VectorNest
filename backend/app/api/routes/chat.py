from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse

from app.core.dependencies import get_current_user
from app.models.models import User
from app.models.schema import QueryRequest
from app.rag.pipeline import run_rag_stream

router = APIRouter()


async def _stream_with_error_guard(query: str, namespace: str):
    try:
        async for chunk in run_rag_stream(query, namespace):
            yield chunk
    except ConnectionError:
        yield "The AI service is temporarily unavailable."
    except Exception:
        yield "An internal error occurred while processing your request."


@router.post("/chat")
async def chat(req: QueryRequest, current_user: User = Depends(get_current_user)):
    query = req.query.strip()
    if not query:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Query must not be empty."
        )
    namespace = str(current_user.id)
    return StreamingResponse(
        _stream_with_error_guard(query, namespace), media_type="text/plain"
    )
