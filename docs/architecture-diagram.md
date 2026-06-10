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
         │    Gemini Flash → classify intent
         │         ┌─────────────────────────────────────────────────┐
         │         │ enumerate_section  (e.g. "list all my projects") │
         │         │   scroll_section_texts(user_id, section)         │
         │         │        ──────────────────────────► Qdrant        │
         │         │        ◄── all chunks in section ──              │
         │         ├─────────────────────────────────────────────────┤
         │         │ semantic_search  (e.g. "am I ready for X role?") │
         │         │   embed(user_message) → OpenAI text-embedding-3- │
         │         │   small → search_chunks(vector, user_id, top_k=5)│
         │         │        ──────────────────────────► Qdrant        │
         │         │        ◄── top-5 by cosine score ──              │
         │         └─────────────────────────────────────────────────┘
         │    build_context(results) → "[section]\ntext\n\n[section]\ntext"
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

---

## 6. Scale Analysis — 10,000 Users

### Assumptions

| Metric                              | Value                      | Reasoning                      |
| ----------------------------------- | -------------------------- | ------------------------------ |
| Registered users                    | 10,000                     | Target scale                   |
| Daily active users (DAU)            | 2,000 (20%)                | Typical SaaS DAU/MAU ratio     |
| Job searches per active user/month  | 12 (3/week)                | Core use case                  |
| Chat messages per active user/month | 20 (5/week)                | ~2 sessions of 10 messages     |
| CV uploads per user/month           | 0.1 (once every 10 months) | One-time action                |
| Jobs scored per search              | 10                         | Agent returns up to 10 results |

---

### Estimated Cost Per Month at 10,000 Users

#### LLM (via ChatLLM proxy — Claude + Gemini)

| Operation                       | Model         | Tokens (in/out) | Cost/call | Calls/month | Subtotal  |
| ------------------------------- | ------------- | --------------- | --------- | ----------- | --------- |
| CV classification               | Gemini Flash  | 800 / 300       | ~$0.00010 | 1,000       | $0.10     |
| CV profile extraction           | Gemini Flash  | 1,200 / 600     | ~$0.00018 | 1,000       | $0.18     |
| JD skill extraction (per job)   | Gemini Flash  | 300 / 80        | ~$0.00004 | 240,000     | $9.60     |
| Fit score explanation (per job) | Claude Sonnet | 800 / 150       | ~$0.00240 | 240,000     | $576      |
| RAG chat response               | Claude Sonnet | 2,000 / 300     | ~$0.00530 | 40,000      | $212      |
| AI nudge (daily, per user)      | Gemini Flash  | 200 / 100       | ~$0.00003 | 60,000      | $1.80     |
| **LLM total**                   |               |                 |           |             | **~$800** |

The Claude Sonnet fit score explanation is the dominant cost — 10 calls per search × 24,000 monthly searches. This is the first thing to optimise if costs need to come down (cache explanations for identical JD hashes, or switch to Gemini Flash for explanations).

#### OpenAI Embeddings (text-embedding-3-small, direct)

| Operation                          | Tokens/call     | Cost/call | Calls/month | Subtotal   |
| ---------------------------------- | --------------- | --------- | ----------- | ---------- |
| CV chunk embedding (50 chunks avg) | 50 × 75 = 3,750 | $0.00008  | 1,000       | $0.08      |
| Job search semantic embed          | 400             | $0.000008 | 24,000      | $0.19      |
| Chat RAG embed                     | 100             | $0.000002 | 40,000      | $0.08      |
| **Embeddings total**               |                 |           |             | **~$0.35** |

#### Infrastructure

| Service                               | Tier                | Monthly cost       |
| ------------------------------------- | ------------------- | ------------------ |
| Railway (FastAPI + 2 ARQ workers)     | Hobby Pro           | $40                |
| Supabase PostgreSQL                   | Pro                 | $25 + compute ~$20 |
| Upstash Redis                         | Pay-per-request     | ~$15               |
| Qdrant Cloud (500k vectors, 1536-dim) | Free tier → Starter | $0–$70             |
| Cloudflare R2 (10k CVs × ~1MB)        | Pay-as-you-go       | ~$5                |
| Vercel (frontend)                     | Pro                 | $20                |
| **Infrastructure total**              |                     | **~$195**          |

#### Total

| Category                | Monthly cost     |
| ----------------------- | ---------------- |
| LLM (Claude + Gemini)   | $800             |
| Embeddings (OpenAI)     | $1               |
| Infrastructure          | $195             |
| **Total**               | **~$996/month**  |
| **Per registered user** | **~$0.10/month** |
| **Per active user**     | **~$0.50/month** |

---

### Key Bottlenecks

#### 1. Fit Scoring Latency (highest impact)

Each job search fires up to 10 Claude Sonnet calls for explanations. Currently these run after scoring, but if they are sequential, a single search takes 10–15 seconds. **Fix:** `asyncio.gather()` across all score+explain calls in `score_node` — all 10 run in parallel, wall time drops to ~1.5s.

#### 2. CV Pipeline Worker Throughput

Unstructured.io PDF parsing is CPU-bound and takes 15–30 seconds per CV. A single ARQ worker processes one CV at a time. If 100 users upload simultaneously (realistic during a launch spike), the queue backs up. **Fix:** Scale ARQ workers horizontally on Railway — each worker is stateless and pulls from the same Redis queue. Three workers handle 3× throughput with no code changes.

#### 3. PostgreSQL Connection Pool Exhaustion

At 2,000 DAU making concurrent API calls, the default SQLAlchemy async pool (5 connections) will saturate. asyncpg opens a new connection per overflow, which Supabase's shared Postgres will reject above ~100 concurrent connections. **Fix:** Enable Supabase's PgBouncer connection pooler (transaction mode); set `pool_size=10, max_overflow=20` in the SQLAlchemy engine config.

#### 4. Qdrant Under Concurrent Search Load

At 10k users, the Qdrant collection holds ~500k vectors (10k users × 50 chunks average). A single ANN search over 500k 1536-dim vectors takes ~10–30ms on Qdrant Cloud Starter. At 2,000 concurrent users each triggering a search, the bottleneck is the HTTP connection pool to Qdrant from the API container. **Fix:** Increase `AsyncQdrantClient` connection limits; consider Qdrant's on-premise deployment on Railway with persistent volume if Qdrant Cloud costs rise.

#### 5. LLM Rate Limits at Peak

The ChatLLM proxy enforces per-minute rate limits on Claude Sonnet. A morning job-search rush of 500 concurrent users each triggering 10 Claude calls = 5,000 requests/minute. Most proxy tiers cap at 500–2,000 RPM. **Fix:** Add an asyncio semaphore around LLM calls in the scorer (limit to 50 concurrent calls); excess requests queue locally rather than hitting rate-limit errors.

#### 6. Redis Memory at Scale

Chat sessions (2hr TTL, 20 messages, ~500 bytes each) = ~10KB per active session. At 2,000 concurrent sessions: ~20MB. Upstash free tier caps at 256MB — comfortably handled. At 50,000 DAU this becomes a concern; shard sessions across two Redis instances by hashing `session_id`.

---

### What Doesn't Need to Change at 10,000 Users

- **Qdrant user_id filtering** — already O(1) at the index level via payload index; scales to 10M+ vectors without schema changes
- **Auth / JWT** — stateless; zero backend load per token verification
- **Cloudflare R2** — object storage; effectively unlimited at this scale
- **Frontend on Vercel** — static + edge; handles 10k users trivially
