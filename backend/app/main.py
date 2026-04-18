import asyncio

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes.auth import router as auth_router
from app.api.routes.chat import router as chat_router
from app.api.routes.documents import router as documents_router
from app.api.routes.upload import router as upload_router
from app.core.config import FRONTEND_URL
from app.core.token_cleanup import refresh_token_cleanup_loop

app = FastAPI(title="VectorNest", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(chat_router, prefix="/api")
app.include_router(upload_router, prefix="/api")
app.include_router(documents_router, prefix="/api")
app.include_router(auth_router, prefix="/api")


@app.on_event("startup")
async def start_background_jobs() -> None:
    app.state.refresh_token_cleanup_task = asyncio.create_task(
        refresh_token_cleanup_loop()
    )


@app.on_event("shutdown")
async def stop_background_jobs() -> None:
    task = getattr(app.state, "refresh_token_cleanup_task", None)
    if task:
        task.cancel()
        try:
            await task
        except asyncio.CancelledError:
            pass
