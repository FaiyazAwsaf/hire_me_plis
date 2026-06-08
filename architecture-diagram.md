# Architecture Diagram — Hire Me Plis

---

## 1. CV Upload → Embedding Pipeline

```
User uploads PDF / DOCX
         │
         ▼
  POST /cv/upload  (FastAPI)
         │
         ├─── Upload raw file ──────────────────► Cloudflare R2
         │                                        (r2_key stored in cv_versions row)
         ├─── INSERT cv_versions row ────────────► PostgreSQL
         │    { status: "pending" }
         │
         └─── Enqueue ARQ job ──────────────────► Redis (ARQ queue)
                  process_cv(cv_version_id,                │
                             user_id, r2_key)              │
                                                           ▼
                                               ┌─────────────────────┐
  Frontend polls GET /cv/status               │   ARQ Worker        │
         │                                    │                     │
         │                                    │  1. Download from R2 │
         │                                    │  2. Unstructured.io  │
         │                                    │     → raw text blocks│
         │                                    │  3. Gemini Flash     │
         │                                    │     → classify into: │
         │                                    │     experience /     │
         │                                    │     education /      │
         │                                    │     skills /         │
         │                                    │     projects /       │
         │                                    │     certifications   │
         │                                    │  4. Gemini Flash     │
         │                                    │     → extract full   │
         │                                    │     structured JSON  │
         │                                    │     (profile_dict)   │
         │                                    │  5. Upsert profile   │
         │                                    │     ──────────────►  │─── cv_profiles ──► PostgreSQL
         │                                    │  6. Chunk sections   │    (JSONB, source of truth
         │                                    │     (150 tok, 15     │     for builder UI)
         │                                    │      overlap)        │
         │                                    │  7. text-embedding   │
         │                                    │     -3-small → 1536- │
         │                                    │     dim vectors      │
         │                                    │  8. Qdrant upsert ── │─── cv_chunks ──►  Qdrant
         │                                    │     (user_id filter  │    payload: { user_id,
         │                                    │      on every point) │    section, text }
         │                                    │  9. status → "done"  │
         │                                    └─────────────────────┘
         │                                                 │
         └─────────── status: "done" ◄───────────── PostgreSQL
                              │
                              ▼
                  Frontend redirects to /cv
                  (profile view + editors)
```

---

## 2. Job Search → Fit Scoring → Agent Response

```
User: "Find ML internships in Dhaka this month"
         │
         ▼
  POST /jobs/search  (FastAPI)
         │
         ▼
  ┌─────────────────────────────────────────────────────────┐
  │  LangGraph Agent  (graph.py)                            │
  │                                                         │
  │  Node 1 — parse_query_node                              │
  │    Gemini Flash → extract { role, location, date_range }│
  │                                                         │
  │  Node 2 — search_node  (asyncio.gather — all parallel) │
  │    ┌─────────────┐  ┌───────────┐  ┌─────────────────┐ │
  │    │  BDJobs     │  │ LinkedIn  │  │    JSearch API  │ │
  │    │ (python-    │  │ (python-  │  │  (RapidAPI —    │ │
  │    │  jobspy)    │  │  jobspy)  │  │   aggregates    │ │
  │    └─────────────┘  └───────────┘  │  LinkedIn /     │ │
  │                                    │  Indeed /       │ │
  │    ┌─────────────┐                 │  Glassdoor)     │ │
  │    │  Remotive   │                 └─────────────────┘ │
  │    │ (public API)│                                     │
  │    └─────────────┘                                     │
  │         └──────────────┬──────────────────────────────┘│
  │                        │ merged RawJob list             │
  │                        ▼                               │
  │  Node 3 — score_node                                   │
  │    For each job — POST /jobs/score (internal):          │
  │                                                         │
  │    Gemini Flash → extract JD skills                     │
  │    Jaccard(jd_skills ∩ cv_skills) → skill_match  [30%] │
  │                                                         │
  │    embed(JD text) → OpenAI text-embedding-3-small       │
  │    cosine vs top-5 cv_chunks (Qdrant, user_id filter)   │
  │                        → semantic_match          [50%]  │
  │                                                         │
  │    parse(years_required) vs cv date ranges              │
  │                        → experience_match        [20%]  │
  │                                                         │
  │    weighted_sum → score (0–100)                         │
  │                                                         │
  │    Claude Sonnet → 2-3 sentence fit_reasoning           │
  └─────────────────────────────────────────────────────────┘
         │
         ▼
  Response: structured job cards
  { role, company, location, salary_range,
    deadline, url, fit_score, fit_reasoning }
```

---

## 3. AI Assistant Chat (RAG)

```
User sends message via WebSocket
         │
         ▼
  WS /chat/ws?token=<jwt>  (FastAPI)
         │
         ├─── Save user message ─────────────────► PostgreSQL  (durable, Postgres-first)
         │                                          then ──────► Redis   (session cache)
         │
         ├─── Load history
         │    Redis hit? ─── return immediately (fast path, 2hr TTL)
         │    Redis miss? ── SELECT chat_messages ORDER BY created_at
         │                   re-seed Redis → continue
         │
         ├─── RAG retrieval  (fresh per message)
         │    embed(user_message) → OpenAI text-embedding-3-small
         │    search_chunks(vector, user_id=<current>, top_k=5)
         │         ──────────────────────────────► Qdrant
         │         ◄── [{section, text, score}] ──  (user_id filter enforced)
         │    build_context(results)
         │         → "[experience]\n...\n\n[skills]\n..."
         │
         ├─── Assemble LLM messages
         │    [ { role: "system",  content: rag_system_prompt(context) },
         │      { role: "user",    content: history[0] },
         │      { role: "assistant", content: history[1] },
         │      ...
         │      { role: "user",    content: current_message } ]
         │
         ├─── Claude Sonnet 4.6 (via ChatLLM proxy) → stream tokens
         │    Each token ─────────────────────────► WebSocket client
         │    { type: "token", content: "..." }
         │
         └─── On finish
              { type: "done", content: "" }
              Save full response ─────────────────► PostgreSQL → Redis
```

---

## 4. Background Jobs (ARQ / Redis Queue)

```
                     Redis (ARQ queue)
                           │
              ┌────────────┴─────────────┐
              │                          │
     process_cv task              re_embed_profile task
   (on CV upload)              (on PATCH /cv/profile)
              │                          │
              ▼                          ▼
    Full pipeline:              Structured path:
    parse → classify →          profile JSON →
    extract → chunk →           _profile_to_classified() →
    embed → upsert              chunk → embed → upsert
              │                          │
              └────────────┬─────────────┘
                           ▼
                    Qdrant (cv_chunks)
              all agents always see latest data


     nudge_task (scheduled daily)
              │
              ├─ Fetch application history + goal status  → PostgreSQL
              ├─ Gemini Flash → generate 1 nudge per user
              └─ INSERT nudges (read: false)              → PostgreSQL
                   │
                   ▼
              GET /nudges → notification badge in topbar
```

---

## 5. Data Stores at a Glance

```
┌───────────────────────────────────────────────────────────┐
│  PostgreSQL                                               │
│  users, cv_versions, cv_profiles (JSONB), applications,   │
│  goals, calendar_events, chat_messages, nudges,           │
│  refresh_tokens                                           │
└───────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────┐
│  Qdrant  (collection: cv_chunks)                          │
│  1536-dim vectors, payload: { user_id, cv_version_id,     │
│  section, chunk_index, text, role_title,                  │
│  experience_years }                                       │
│  Every query MUST filter by user_id — enforced in         │
│  vector_store/search.py                                   │
└───────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────┐
│  Redis                                                    │
│  session:{id}:messages  — chat history (TTL 2hr, cap 20)  │
│  ARQ job queues         — managed by ARQ internally       │
│  cv_export:{user_id}    — signed R2 URL (TTL 1hr)         │
│  nudge_lock:{user_id}   — dedup guard (TTL 24hr)          │
└───────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────┐
│  Cloudflare R2                                            │
│  uploads/{user_id}/{cv_version_id}.pdf  — raw CV files    │
│  exports/{user_id}/{timestamp}.pdf      — exported PDFs   │
└───────────────────────────────────────────────────────────┘
```
