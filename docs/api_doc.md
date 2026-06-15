# Hire Me Plis — Frontend API Reference

This document is the single source of truth for the frontend team. Every endpoint is derived directly from the backend implementation. Status labels indicate what is actually wired up today vs. what is planned.

**Status legend**

- ✅ **Implemented** — route fully implemented in the backend, ready to integrate
- 📋 **Planned** — defined in API contracts, not yet implemented

---

## Global Conventions

|                      |                                                                                     |
| -------------------- | ----------------------------------------------------------------------------------- |
| **Base URL (dev)**   | `http://localhost:8000`                                                             |
| **Base URL (prod)**  | `https://api.hiremeplis.com` _(not yet deployed)_                                   |
| **Content-Type**     | `application/json` for all JSON endpoints; `multipart/form-data` for CV upload      |
| **Auth header**      | `Authorization: Bearer <token>` on every protected endpoint                         |
| **Dates**            | ISO 8601 strings — `"2025-01-15"` for dates, `"2025-01-15T10:30:00Z"` for datetimes |
| **IDs**              | UUID v4 strings throughout                                                          |
| **CORS**             | Dev server at `http://localhost:3000` is allowed — other origins are blocked        |
| **Interactive docs** | `http://localhost:8000/docs` (Swagger UI) — useful for testing during development   |

### Error shape

All errors use the same shape regardless of status code:

```json
{ "detail": "Human-readable error message" }
```

| Status | Meaning                                             |
| ------ | --------------------------------------------------- |
| `400`  | Bad request — invalid input                         |
| `401`  | Missing, invalid, or expired Bearer token           |
| `403`  | Authenticated but accessing another user's resource |
| `404`  | Resource not found                                  |
| `422`  | Request body failed schema validation               |
| `500`  | Internal server error                               |

---

## Authentication

### POST /auth/register ✅

Create a new user account. Returns a token immediately — no separate login step needed after registration.

**Request**

```json
{ "email": "user@example.com", "password": "min8chars" }
```

**Response `201`**

```json
{
  "access_token": "eyJ...",
  "token_type": "bearer",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "created_at": "2025-01-15T10:30:00Z"
  }
}
```

**Errors** — `400` if email already registered

---

### POST /auth/login ✅

> ⚠️ **This endpoint uses `application/x-www-form-urlencoded`, not JSON.**
> The email field is called `username` (OAuth2 standard). Sending JSON will return `422`.

Authenticate and return a JWT.

**Request** — form-encoded

```
username=user@example.com&password=mypassword
```

**Fetch / axios example**

```ts
const form = new URLSearchParams({ username: email, password });
await axios.post("/auth/login", form);
// axios auto-sets Content-Type: application/x-www-form-urlencoded
```

**Response `200`** — same shape as `/auth/register`

**Errors** — `401` invalid credentials

---

### GET /auth/me ✅

Validate a stored token and get the current user. Call this on app load to decide whether to show the dashboard or the login page.

**Response `200`**

```json
{
  "id": "uuid",
  "email": "string",
  "created_at": "datetime"
}
```

**Errors** — `401` token missing or invalid

---

### POST /auth/refresh ✅

Exchange a still-valid token for a new one. The existing token must **not** be expired.

**Request**

```json
{ "token": "existing_jwt_string" }
```

**Response `200`** — same shape as `/auth/register` (includes full user object)

**Errors** — `401` if token is already expired

---

## CV — Upload & Processing

The CV pipeline is asynchronous. Upload returns `202` immediately. The file is queued for parsing, embedding, and indexing in the background. The frontend must poll `/cv/status` to know when it is ready.

### CV processing states

```
pending → processing → embedding → done
                                 ↘ error
```

| State        | Meaning                                                |
| ------------ | ------------------------------------------------------ |
| `pending`    | Queued, not started yet                                |
| `processing` | Unstructured.io is parsing the file                    |
| `embedding`  | Text is being embedded and written to Qdrant           |
| `done`       | All AI features (chat, scoring, search) are active     |
| `error`      | Pipeline failed — `error_message` field has the reason |

---

### POST /cv/upload ✅

Upload a PDF or DOCX resume. Max size: **10 MB**.

**Request** — `multipart/form-data`

```
file: <File>   (PDF or DOCX, max 10 MB)
```

**Fetch example**

```ts
const form = new FormData();
form.append("file", fileInput.files[0]);

const res = await fetch("/cv/upload", {
  method: "POST",
  headers: { Authorization: `Bearer ${token}` },
  body: form, // do NOT set Content-Type header manually — browser sets it with the boundary
});
```

**Response `202`**

```json
{ "cv_id": "uuid", "status": "pending" }
```

Poll `GET /cv/status` after this. A new upload replaces the old CV — all previous Qdrant chunks are deleted before new ones are inserted.

---

### GET /cv/status ✅

Poll the processing state of the user's most recent CV. Recommended polling interval: **2 seconds** while status is not `done` or `error`.

**Response `200`**

```json
{
  "cv_id": "uuid",
  "status": "pending | processing | embedding | done | error",
  "error_message": "string | null"
}
```

**Response `404`** — user has no CV uploaded yet

---

### GET /cv ✅

Get metadata for the CV currently on file. Use this to show "Your CV — uploaded 3 days ago" or the upload prompt when `404`.

**Response `200`**

```json
{
  "cv_id": "uuid",
  "filename": "my_resume.pdf",
  "uploaded_at": "2025-01-15T10:30:00Z",
  "status": "done"
}
```

**Response `404`** — no CV on file

---

### DELETE /cv/:id ✅

Delete a CV version and all associated vector data. Use when the user wants to start fresh.

**Path param** — `id`: UUID from `cv_id`

**Response `204`** — no body

**Errors** — `403` if CV belongs to another user, `404` if not found

---

### GET /cv/profile ✅

Return the user's full structured CV profile — personal info, experience, education, skills, projects, certifications.

**Response `200`** — full profile object (see [CV profile shape](#cv-profile-shape) below)

**Response `404`** — no profile exists yet (user hasn't uploaded a CV or used the builder)

---

### PUT /cv/profile ✅

Full replace of the CV profile. Used internally by the ARQ pipeline after PDF parsing. Can also be called directly to overwrite the entire profile. Triggers a background re-embedding job.

**Request** — full profile object (see shape below, omit `updated_at`)

**Response `200`** — updated profile object

---

### PATCH /cv/profile ✅

Partial update — only the fields you include are changed. Used by the CV builder UI when saving a single section. For array fields (`experience`, `education`, `skills`, `projects`, `certifications`) the **entire array is replaced**, not merged per-item.

**Request** — any subset of the profile object, e.g.:

```json
{ "skills": ["Python", "FastAPI", "React"] }
```

or:

```json
{ "personal": { "summary": "Updated summary" } }
```

**Response `200`** — full updated profile object

---

### POST /cv/export ✅

Returns a signed Cloudflare R2 URL (valid 1 hour) for the user's most recently uploaded raw CV file. This gives the user a direct download of their original PDF/DOCX.

**Response `200`**

```json
{
  "download_url": "https://r2.hiremeplis.com/exports/...",
  "expires_at": "2025-01-15T11:30:00Z"
}
```

**Errors** — `404` if no CV profile exists

---

### CV profile shape

```json
{
  "personal": {
    "name": "string",
    "email": "string",
    "phone": "string | null",
    "location": "string | null",
    "linkedin": "string | null",
    "github": "string | null",
    "summary": "string | null"
  },
  "experience": [
    {
      "id": "uuid",
      "role": "string",
      "company": "string",
      "start_date": "YYYY-MM",
      "end_date": "YYYY-MM | null",
      "current": true,
      "description": "string"
    }
  ],
  "education": [
    {
      "id": "uuid",
      "degree": "string",
      "institution": "string",
      "start_date": "YYYY-MM",
      "end_date": "YYYY-MM | null",
      "grade": "string | null"
    }
  ],
  "skills": ["string"],
  "projects": [
    {
      "id": "uuid",
      "name": "string",
      "description": "string",
      "url": "string | null",
      "tech_stack": ["string"]
    }
  ],
  "certifications": [
    {
      "id": "uuid",
      "name": "string",
      "issuer": "string",
      "date": "YYYY-MM",
      "url": "string | null"
    }
  ],
  "updated_at": "datetime"
}
```

---

## Jobs

### POST /jobs/score ✅

Paste raw job description text and get a 0–100 fit score against the user's CV. Requires a processed CV (`status: done`) on file.

**How scoring works** (for displaying breakdowns to users):

- **Skill match** (30%) — AI extracts required skills from JD, recall score: what % of JD skills appear in the CV
- **Semantic match** (50%) — embeds JD, finds most similar CV chunks (all sections, top-5) via cosine similarity
- **Experience match** (20%) — parses years required from JD, compares against CV date ranges

**Request**

```json
{
  "jd_text": "We are looking for a Python developer with 3+ years of FastAPI experience..."
}
```

**Response `200`**

```json
{
  "score": 74,
  "breakdown": {
    "skill_match": 80,
    "semantic_match": 70,
    "experience_match": 75
  },
  "explanation": "Your 4 years of FastAPI and PostgreSQL experience closely matches the technical requirements. The role asks for React experience which is not evident in your CV. Your background in async Python aligns well with the backend-heavy scope of this position."
}
```

**Errors** — `404` if no processed CV exists

---

### POST /jobs/search ✅

Natural-language job search. A LangGraph agent parses the query, fans out to BDJobs + LinkedIn + JSearch + Remotive in parallel (up to 10 results each), then runs fit scoring against the user's CV on every result. Requires a processed CV (`status: done`) on file.

**How the agent searches:**

1. Gemini Flash parses the NL query → `role`, `location`, `date_from`
2. BDJobs + LinkedIn + JSearch + Remotive all run simultaneously via `asyncio.gather` (up to 10 per source)
3. Each source is independent — one failing doesn't cancel the others
4. The `source` field reflects which sources contributed results; `source_platform` on each card identifies its origin

**Request**

```json
{ "query": "Find React developer jobs in Dhaka" }
```

**Response `200`**

```json
{
  "results": [
    {
      "id": "string",
      "role": "Software Engineer",
      "company": "TechBD Ltd",
      "location": "Dhaka, Bangladesh",
      "salary_range": "BDT 80,000–120,000",
      "deadline": "2025-02-28",
      "url": "https://bdjobs.com/...",
      "source_platform": "bdjobs",
      "fit_score": 85,
      "fit_reasoning": "Your React and TypeScript skills are a strong match..."
    }
  ],
  "source": "bdjobs,linkedin,jsearch,remotive",
  "total": 10
}
```

**Notes**

- `source` — a comma-separated string of the sources that contributed results, e.g. `"bdjobs,linkedin,jsearch,remotive"`. It is **not** a union type — type it as `string` in TypeScript.
- `source_platform` on each card — the specific source that returned that listing (`"bdjobs"`, `"linkedin"`, `"jsearch"`, or `"remotive"`).

**Errors** — `404` if no processed CV exists

---

## AI Assistant (Chat)

The chat assistant is grounded in the user's CV — every response is backed by their actual uploaded documents, not general knowledge.

### WebSocket /chat/ws ✅

> ⚠️ **Auth is via URL query param, not Authorization header.**
> Browsers cannot set custom headers on WebSocket connections. Pass the JWT token as `?token=<jwt>` in the connection URL.

**Connection URL**

```
ws://localhost:8000/chat/ws?token=<jwt>
```

**Client sends (JSON object)**

```json
{
  "message": "What are my strongest technical skills?",
  "session_id": "any-stable-uuid-per-session"
}
```

- `session_id` — generate once per browser session (e.g., `crypto.randomUUID()`), keep it stable across messages so the server maintains conversation history within the session.

**Server streams — one JSON frame per token**

```json
{ "type": "token", "content": "Your" }
{ "type": "token", "content": " strongest" }
{ "type": "token", "content": " skill..." }
```

**Server sends on completion**

```json
{ "type": "done", "content": "" }
```

**Server sends on error**

```json
{ "type": "error", "content": "Error description" }
```

**Connection close codes**

- `4001` — auth failed (bad or missing token)

**TypeScript integration example**

```ts
function connectChat(token: string, sessionId: string) {
  const ws = new WebSocket(`ws://localhost:8000/chat/ws?token=${token}`);

  ws.onopen = () => console.log("Chat connected");

  function sendMessage(message: string) {
    ws.send(JSON.stringify({ message, session_id: sessionId }));
  }

  ws.onmessage = (event) => {
    const frame = JSON.parse(event.data);
    if (frame.type === "token") {
      appendToUI(frame.content); // stream tokens into the chat bubble
    } else if (frame.type === "done") {
      finaliseMessage(); // mark the message as complete
    } else if (frame.type === "error") {
      showError(frame.content);
    }
  };

  return { sendMessage, close: () => ws.close() };
}
```

**Supported query intents**

- General career advice: _"How should I approach my job search?"_
- Readiness check: _"Am I ready for a senior data engineer role?"_
- Gap analysis: _"What skills am I missing for a Google internship?"_
- Roadmap generation: _"Build me a 3-month plan to become job-ready"_
- Cover letter: _"Draft a cover letter for this job posting: [paste JD]"_

---

### GET /chat/history ✅

Load persisted message history for a session. Call this when the chat page mounts to show previous messages before the user types.

Returns an **empty `messages` array** (not `404`) if the session has never existed or has expired.

**Query params**

```
session_id: string    required
limit: integer        optional, default 20
```

**Response `200`**

```json
{
  "session_id": "my-session-uuid",
  "messages": [
    {
      "role": "user",
      "content": "What skills do I have?",
      "created_at": "2025-01-15T10:00:00Z"
    },
    {
      "role": "assistant",
      "content": "Based on your CV, you...",
      "created_at": "2025-01-15T10:00:05Z"
    }
  ]
}
```

---

## Application Tracker

### Applications (Kanban board)

| Method | Endpoint                   | Status | Description                                                    |
| ------ | -------------------------- | ------ | -------------------------------------------------------------- |
| GET    | `/applications`            | ✅     | List all cards for the current user, newest first              |
| POST   | `/applications`            | ✅     | Create a new card                                              |
| PATCH  | `/applications/:id/status` | ✅     | Move card between columns — fire on drag-and-drop              |
| PATCH  | `/applications/:id`        | ✅     | Edit card fields (notes, deadline, salary, role, company, url) |
| DELETE | `/applications/:id`        | ✅     | Remove a card permanently                                      |

> **Route order matters:** `/applications/:id/status` must be called before `/applications/:id` when drag-and-dropping. The backend registers the status route first to avoid ambiguity — always use the `/status` sub-route for column moves.

**Application object**

```json
{
  "id": "uuid",
  "role": "Backend Engineer",
  "company": "Pathao",
  "url": "https://...",
  "status": "applied | interviewing | offer | rejected",
  "notes": "string | null",
  "deadline": "2025-03-01",
  "salary_range": "BDT 80k–100k",
  "applied_at": "2025-01-15T10:30:00Z"
}
```

**POST body**

```json
{
  "role": "string",
  "company": "string",
  "url": "string | null",
  "status": "applied",
  "notes": "string | null",
  "deadline": "date | null",
  "salary_range": "string | null"
}
```

**PATCH /applications/:id/status body**

```json
{ "status": "interviewing" }
```

---

### Goals ✅

| Method | Endpoint     | Description                                         |
| ------ | ------------ | --------------------------------------------------- |
| GET    | `/goals`     | List all goals, ordered by `target_date` ascending  |
| POST   | `/goals`     | Create a new goal                                   |
| PATCH  | `/goals/:id` | Update title, deadline, or mark complete/incomplete |
| DELETE | `/goals/:id` | Delete permanently                                  |

**Goal object**

```json
{
  "id": "uuid",
  "title": "Apply to 5 jobs this week",
  "target_date": "2025-01-20",
  "completed_at": "datetime | null"
}
```

**PATCH body** — all fields optional

```json
{
  "title": "string",
  "target_date": "date",
  "completed": true // true sets completed_at; false clears it
}
```

---

### Calendar Events ✅

| Method | Endpoint               | Description                                                           |
| ------ | ---------------------- | --------------------------------------------------------------------- |
| GET    | `/calendar/events`     | List events in a date range — requires `start` and `end` query params |
| POST   | `/calendar/events`     | Create an event, optionally linked to a goal                          |
| PATCH  | `/calendar/events/:id` | Reschedule or rename — fire on drag-and-drop                          |
| DELETE | `/calendar/events/:id` | Delete permanently                                                    |

**Event object**

```json
{
  "id": "uuid",
  "title": "Interview prep — Pathao",
  "start_dt": "2025-01-18T14:00:00Z",
  "end_dt": "2025-01-18T15:00:00Z",
  "goal_id": "uuid | null"
}
```

**GET query params**

```
start: date    ISO 8601, inclusive
end: date      ISO 8601, inclusive
```

---

### Nudges ✅

| Method | Endpoint           | Description                                      |
| ------ | ------------------ | ------------------------------------------------ |
| GET    | `/nudges`          | List all nudges (newest first) with unread count |
| PATCH  | `/nudges/:id/read` | Mark a nudge as read — clears it from the badge  |

> Nudges are generated automatically by a daily ARQ cron job at 09:00 — one per user per day who has a processed CV on file. The frontend just reads them.

**Nudge object**

```json
{
  "id": "uuid",
  "body": "You haven't applied anywhere this week. Your goal of 5 applications is due in 2 days.",
  "read": false,
  "created_at": "datetime"
}
```

**GET response**

```json
{
  "nudges": [...],
  "unread_count": 3
}
```

---

### Dashboard Stats ✅

| Method | Endpoint           | Description                                                           |
| ------ | ------------------ | --------------------------------------------------------------------- |
| GET    | `/dashboard/stats` | Aggregated stats for the entire dashboard page — single call on mount |

**Response**

```json
{
  "applications": {
    "total": 12,
    "by_status": {
      "applied": 6,
      "interviewing": 3,
      "offer": 1,
      "rejected": 2
    }
  },
  "goals": {
    "total": 5,
    "completed": 3,
    "completion_pct": 60.0
  },
  "streak_days": 4,
  "cv_on_file": true
}
```

- `streak_days` — consecutive calendar days on which the user submitted at least one application (counted backwards from today).
- `cv_on_file` — `true` only when a CV with `status: done` exists (i.e., all AI features are active). Gate fit scoring, chat, and job search on this.
- `goals.completion_pct` — percentage of the user's goals that have a non-null `completed_at`. Use this for the "Roadmap %" or "Goals" progress card.

---

## Health Check

### GET / ✅

Liveness probe. No auth required.

**Response `200`**

```json
{ "status": "ok", "version": "0.1.0" }
```

---

## Quick Reference

| Status | Method | Endpoint                   | Auth            | Notes                                                      |
| ------ | ------ | -------------------------- | --------------- | ---------------------------------------------------------- |
| ✅     | GET    | `/`                        | No              | Health check                                               |
| ✅     | POST   | `/auth/register`           | No              | Returns token immediately                                  |
| ✅     | POST   | `/auth/login`              | No              | Form-encoded — field is `username` (holds email), not JSON |
| ✅     | GET    | `/auth/me`                 | Yes             | Validate stored token                                      |
| ✅     | POST   | `/auth/refresh`            | Yes             | Token must still be valid                                  |
| ✅     | POST   | `/cv/upload`               | Yes             | multipart/form-data, returns 202                           |
| ✅     | GET    | `/cv/status`               | Yes             | Poll until `done` or `error`                               |
| ✅     | GET    | `/cv`                      | Yes             | CV metadata                                                |
| ✅     | DELETE | `/cv/:id`                  | Yes             |                                                            |
| ✅     | GET    | `/cv/profile`              | Yes             | Returns 404 if no profile yet                              |
| ✅     | PUT    | `/cv/profile`              | Yes             | Full replace; triggers re-embed                            |
| ✅     | PATCH  | `/cv/profile`              | Yes             | Partial update; array fields fully replaced                |
| ✅     | POST   | `/cv/export`               | Yes             | Returns signed R2 URL (1hr expiry)                         |
| ✅     | POST   | `/jobs/score`              | Yes             | Requires CV `status: done`                                 |
| ✅     | POST   | `/jobs/search`             | Yes             | Requires CV `status: done`                                 |
| ✅     | WS     | `/chat/ws`                 | **Query param** | Stream tokens, auth via `?token=`                          |
| ✅     | GET    | `/chat/history`            | Yes             | Returns empty array if session unknown                     |
| ✅     | GET    | `/applications`            | Yes             | Ordered by `applied_at` desc                               |
| ✅     | POST   | `/applications`            | Yes             |                                                            |
| ✅     | PATCH  | `/applications/:id/status` | Yes             | Drag-and-drop column move                                  |
| ✅     | PATCH  | `/applications/:id`        | Yes             | Edit any field except status                               |
| ✅     | DELETE | `/applications/:id`        | Yes             |                                                            |
| ✅     | GET    | `/goals`                   | Yes             | Ordered by `target_date` asc                               |
| ✅     | POST   | `/goals`                   | Yes             |                                                            |
| ✅     | PATCH  | `/goals/:id`               | Yes             | Use `completed: true/false` to toggle                      |
| ✅     | DELETE | `/goals/:id`               | Yes             |                                                            |
| ✅     | GET    | `/calendar/events`         | Yes             | Requires `start` + `end` query params                      |
| ✅     | POST   | `/calendar/events`         | Yes             | `end_dt` must be after `start_dt`                          |
| ✅     | PATCH  | `/calendar/events/:id`     | Yes             | Drag-and-drop reschedule                                   |
| ✅     | DELETE | `/calendar/events/:id`     | Yes             |                                                            |
| ✅     | GET    | `/nudges`                  | Yes             | Returns all nudges + `unread_count`                        |
| ✅     | PATCH  | `/nudges/:id/read`         | Yes             |                                                            |
| ✅     | GET    | `/dashboard/stats`         | Yes             | Single call for all dashboard data                         |
