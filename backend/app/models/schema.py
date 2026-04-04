from pydantic import BaseModel, Field


class QueryRequest(BaseModel):
    query: str = Field(..., min_length=1)


class QueryResponse(BaseModel):
    response: str


class UploadResponse(BaseModel):
    status: str
    filename: str
    chunk_count: int
