# VectorNest

RAG-powered document intelligence — upload your files, ask questions, get answers strictly from your content.

## Stack

**Frontend:** React, TypeScript, Tailwind CSS, Vite  
**Backend:** FastAPI, LangChain, Pinecone, Groq (LLaMA 3.3 70B)

## Setup

### Backend
```bash
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Frontend
```bash
npm install
npm run dev
```

### Environment Variables

**Backend `.env`**
```
GROQ_API_KEY=
PINECONE_API_KEY=
PINECONE_INDEX=
COHERE_API_KEY=
```
