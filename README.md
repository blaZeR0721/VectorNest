# VectorNest

VectorNest is a RAG app where users upload documents and ask grounded questions.

## Tech Stack

- Frontend: React + TypeScript + Vite + Tailwind
- Backend: FastAPI + LangChain + Pinecone + Groq + Cohere
- Data: PostgreSQL + Redis

## Project Structure

- `frontend/` - web client
- `backend/` - API, auth, ingestion, and RAG pipeline

## Backend Setup

1. Go to `backend/`
2. Install dependencies
3. Create `.env`
4. Run API server

```bash
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Required `backend/.env` variables:

```env
GROQ_API_KEY=
PINECONE_API_KEY=
PINECONE_INDEX=
COHERE_API_KEY=
DATABASE_URL=
JWT_SECRET=
RESEND_API_KEY=
MAIL_FROM=
REDIS_URL=
FRONTEND_URL=http://localhost:8080
```

## Frontend Setup

1. Go to `frontend/`
2. Install dependencies
3. Start dev server

```bash
npm install
npm run dev
```

Default URL: `http://localhost:8080`

## What It Does

- Secure authentication (signup/login/email verify/reset/change password)
- Protected app routes (only logged-in users can access chat app pages)
- Document upload and indexing per user
- User-isolated RAG retrieval (each user can retrieve only their own files)
- Streaming chat responses grounded in uploaded documents
- Daily cleanup job removes revoked/expired refresh tokens
