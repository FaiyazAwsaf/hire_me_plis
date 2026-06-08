# Hire Me Plis

> **Please refer to [release/v1.0](https://github.com/FaiyazAwsaf/hire_me_plis/tree/release/v1.0) for the latest stable version of the project and code.**

An agentic career co-pilot. Uploads your CV once — every job search, fit score, cover letter, and AI response is grounded in your actual profile via RAG. No hallucinated backgrounds.

**System Design Document:** [docs/architecture-diagram.md](docs/architecture-diagram.md)

**Evaluation Suite:** [docs/evaluation-suite.md](docs/evaluation-suite.md)

---

## Prerequisites

| Tool                    | Version |
| ----------------------- | ------- |
| Python                  | 3.11+   |
| Node.js                 | 20+     |
| Docker + Docker Compose | latest  |

---

## Quick Start (Recommended — Docker)

This runs Postgres, Redis, Qdrant, the FastAPI server, and the ARQ background worker together.

```bash
git clone https://github.com/<your-username>/hire_me_plis
cd hire_me_plis

# Copy and fill in all environment variables
cp backend/.env.example backend/.env
# edit backend/.env with your API keys (see Environment Variables section below)

docker compose up --build
```

Frontend runs separately:

```bash
cd frontend
npm install
cp .env.local.example .env.local   # set NEXT_PUBLIC_API_URL and NEXT_PUBLIC_WS_URL
npm run dev
```

App is now available at **http://localhost:3000**.

---

## Manual Setup (without Docker)

### 1. Start infrastructure

```bash
# Postgres
docker run -d --name pg -e POSTGRES_DB=hiremeplis -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=devpassword -p 5432:5432 postgres:16

# Redis
docker run -d --name redis -p 6379:6379 redis:7-alpine

# Qdrant
docker run -d --name qdrant -p 6333:6333 qdrant/qdrant
```

### 2. Backend

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

cp .env.example .env
# fill in .env with your keys

# Run DB migrations
alembic upgrade head

# Start API server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 3. ARQ background worker

In a separate terminal (same virtualenv):

```bash
cd backend
arq workers.arq_app.WorkerSettings
```

> **Important:** The worker does not auto-reload on code changes. Run `docker compose restart worker` (or restart the process manually) after editing worker or pipeline code.

### 4. Frontend

```bash
cd frontend
npm install
cp .env.local.example .env.local
npm run dev
```

---

## Environment Variables

### `backend/.env`

```bash
# ── Database ──────────────────────────────────────────────────────────
DATABASE_URL=postgresql+asyncpg://postgres:devpassword@localhost:5432/hiremeplis

# ── Redis ─────────────────────────────────────────────────────────────
REDIS_URL=redis://localhost:6379

# ── Qdrant ────────────────────────────────────────────────────────────
QDRANT_URL=http://localhost:6333
QDRANT_COLLECTION=cv_chunks

# ── Cloudflare R2 (file storage for CV uploads) ───────────────────────
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=hiremeplis

# ── Auth ──────────────────────────────────────────────────────────────
SECRET_KEY=                          # 32+ char random string — run: openssl rand -hex 32

# ── LLM ───────────────────────────────────────────────────────────────
CHATLLM_API_KEY=                     # ChatLLM API key (proxies Claude + Gemini)
CHATLLM_BASE_URL=                    # ChatLLM OpenAI-compatible base URL
OPENAI_API_KEY=                      # Used for text-embedding-3-small only

# ── Job APIs ──────────────────────────────────────────────────────────
JSEARCH_API_KEY=                     # RapidAPI JSearch key (aggregates LinkedIn/Indeed/Glassdoor)
```

### `frontend/.env.local`

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000
```

---

## Running Tests

```bash
cd backend
pytest
```

---

## Database Migrations

```bash
cd backend

# Apply all pending migrations
alembic upgrade head

# Create a new migration after changing a model
alembic revision --autogenerate -m "describe the change"
```

---

## Project Structure

```
hire_me_plis/
├── backend/               # FastAPI + ARQ worker
│   ├── app/
│   │   ├── ai/            # All AI logic: LLM, embeddings, RAG, agents, CV pipeline
│   │   ├── routers/       # HTTP + WebSocket route handlers
│   │   ├── services/      # Domain orchestrators
│   │   ├── models/        # SQLAlchemy ORM models
│   │   └── schemas/       # Pydantic I/O schemas
│   └── workers/           # ARQ task definitions
├── frontend/              # Next.js 15 App Router
│   ├── app/(app)/         # Protected app pages
│   ├── components/        # Shared UI components
│   ├── store/             # Zustand state stores
│   └── lib/               # API client, types, utilities
└── docker-compose.yml     # Full local stack
```

---

## Four Pillars

| Pillar                            | What it does                                                               |
| --------------------------------- | -------------------------------------------------------------------------- |
| **Job Hunter Agent**              | NL query → LangGraph agent → parallel job board search → fit-scored cards  |
| **Profile & Resume Intelligence** | CV upload → parse → classify → embed → Qdrant vector store                 |
| **Personal AI Assistant**         | RAG-grounded chat: gap analysis, readiness checks, cover letters, roadmaps |
| **Productivity Tracker**          | Kanban board, goals, calendar, dashboard stats, AI nudges                  |
