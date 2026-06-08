# Evaluation Suite — Hire Me Plis

All test cases below correspond to automated tests in `backend/tests/`. Run the full suite with:

```bash
cd backend && pytest -v
```

Each case documents: the **input** fed into the system, the **expected output** according to the spec, the **actual output** observed when the test runs, and the **verdict**.

---

## Case 1 — Fit Score Weighted Formula

**File:** `tests/test_job_match_pipeline.py::TestFitScore::test_weighted_total_formula`
**Component:** Fit scorer (`app/ai/agents/fit_scorer/scorer.py`)

**Description:**
Verifies the three-component weighted scoring formula produces the correct aggregate score. The weights are skill_match×0.4 + semantic_match×0.4 + experience_match×0.2.

**Input:**

- JD skills extracted: `["Python", "Docker"]`
- CV skills: `["Python", "FastAPI", "React"]` → Jaccard intersection=1, union=4 → skill_match=25
- JD years required: `5`
- CV years of experience: `3` → experience_match = round(3/5×100) = 60
- Experience chunk cosine scores: `[0.9, 0.8, 0.7, 0.6, 0.5]` → top-3 avg = (0.9+0.8+0.7)/3 → semantic_match=80

**Expected Output:**

```
skill_match      = 25
semantic_match   = 80
experience_match = 60
score            = round(0.4×25 + 0.4×80 + 0.2×60) = round(10 + 32 + 12) = 54
```

**Actual Output:**

```
result.skill_match      == 25   ✓
result.semantic_match   == 80   ✓
result.experience_match == 60   ✓
result.score            == 54   ✓
```

**Verdict: PASS**

---

## Case 2 — CV Pipeline Status Sequence & Delete-Before-Embed Ordering

**File:** `tests/test_cv_pipeline.py::TestRunCvPipeline::test_happy_path_status_order_and_delete_before_embed`
**Component:** CV ingestion pipeline (`app/ai/cv_pipeline/pipeline.py`)

**Description:**
Verifies two invariants of the pipeline orchestrator: (1) status updates must flow `processing → embedding → done` in that exact order, and (2) the old Qdrant chunks must be deleted _before_ new ones are written. Reversal of (2) would cause a window where a user sees no profile data.

**Input:**

- `user_id="user-1"`, `cv_version_id="cv-1"`, `r2_key="cvs/user-1/cv-1.pdf"`, `file_type="pdf"`
- All I/O (R2, Gemini Flash, OpenAI, Qdrant) mocked with fast no-ops
- Side-effect trackers on `delete_by_user` and `embed_and_upsert` to record call order

**Expected Output:**

```
result.success       == True
result.chunk_count   == 1
status sequence      == ["processing", "embedding", "done"]
call order           == ["delete", ..., "embed"]  (delete strictly before embed)
```

**Actual Output:**

```
result.success       == True   ✓
result.chunk_count   == 1      ✓
status_calls         == ["processing", "embedding", "done"]   ✓
call_order.index("delete") < call_order.index("embed")        ✓
```

**Verdict: PASS**

---

## Case 3 — Qdrant User Isolation: Every Query Filtered by user_id

**File:** `tests/test_job_match_pipeline.py::TestScrollSectionTexts::test_user_and_section_filters_applied`
**Component:** Vector store scroll (`app/ai/vector_store/scroll.py`)

**Description:**
Verifies that every Qdrant scroll call includes _both_ a `user_id` filter and a `section` filter in the `must` conditions. This is the core multi-tenancy guarantee: one user's CV chunks must never be visible to another user.

**Input:**

- `user_id="user-1"`, `section="skills"`
- Qdrant returns one mock point: `{ "text": "Python FastAPI Docker" }`

**Expected Output:**

```
Qdrant scroll_filter.must contains keys: {"user_id", "section"}
Return value: ["Python FastAPI Docker"]
```

**Actual Output:**

```
result         == ["Python FastAPI Docker"]   ✓
filter keys    == {"user_id", "section"}      ✓
```

**Verdict: PASS**

---

## Case 4 — LLM Graceful Degradation on Malformed Response

**File:** `tests/test_job_match_pipeline.py::TestExtractJdSkills::test_returns_empty_list_on_invalid_json`
**Component:** JD skill extractor (`app/ai/agents/fit_scorer/extractor.py`)

**Description:**
Verifies that when the LLM returns an unparseable response (e.g. a refusal or explanation text instead of JSON), the extractor degrades to an empty list rather than crashing the fit scorer. Also tests that markdown code fences are stripped before parsing.

**Input (invalid JSON):**

- LLM response: `"Sorry, I cannot help with that."`

**Expected Output:**

```
result == []   (no exception raised)
```

**Actual Output:**

```
result == []   ✓   (JSONDecodeError caught internally, empty list returned)
```

**Verdict: PASS**

---

**Bonus sub-case — markdown fence stripping:**

**Input (fenced JSON):**

- LLM response: ` ```json\n["Python", "Docker"]\n``` `

**Expected Output:**

```
result == ["Python", "Docker"]
```

**Actual Output:**

```
result == ["Python", "Docker"]   ✓
```

**Verdict: PASS**

---

## Case 5 — Chat Dual-Write: Postgres Committed Before Redis

**File:** `tests/test_chat_service.py::TestSaveMessage::test_dual_write_postgres_then_redis`
**Component:** Chat service (`app/services/chat_service.py`)

**Description:**
Verifies the Postgres-first write ordering. If Redis is written first and then the Postgres commit fails, the message lives in cache but can never be reconstructed — lost on TTL expiry. The correct order (Postgres commit → Redis write) guarantees durability even if Redis fails.

**Input:**

- `session_id="test-session-abc"`, `user_id="00000000-0000-0000-0000-000000000001"`
- `role="user"`, `content="hello"`
- Side-effect trackers on `db.commit` and `redis_append` to record call order

**Expected Output:**

```
call_order == ["postgres_commit", "redis_append"]
```

**Actual Output:**

```
call_order == ["postgres_commit", "redis_append"]   ✓
```

**Verdict: PASS**

---

## Case 6 — Authentication: Wrong Email and Wrong Password Return Identical Errors

**File:** `tests/test_auth.py::TestLogin::test_both_failure_modes_return_identical_error`
**Component:** Auth router (`app/routers/auth.py`)

**Description:**
Verifies that the API does not reveal whether a login failure is due to a non-existent email or a wrong password. Both must return `401` with the same `"Invalid credentials"` detail message. Returning different errors would allow user enumeration attacks.

**Input A:** `{ "email": "nobody@test.com", "password": "password123" }` (email does not exist)
**Input B:** `{ "email": "<registered>", "password": "wrongpassword" }` (password wrong)

**Expected Output:**

```
Both responses: HTTP 401, { "detail": "Invalid credentials" }
```

**Actual Output:**

```
resp_bad_email.status_code == 401   ✓
resp_bad_pass.status_code  == 401   ✓
resp_bad_email.json()["detail"] == resp_bad_pass.json()["detail"] == "Invalid credentials"   ✓
```

**Verdict: PASS**

---

## Case 7 — Chunk Token Limit Enforcement

**File:** `tests/test_cv_pipeline.py::TestChunkSections::test_every_chunk_token_count_within_limit`
**Component:** CV chunker (`app/ai/cv_pipeline/chunker.py`)

**Description:**
Verifies that no chunk produced by the text splitter exceeds 150 tokens. Oversized chunks would degrade embedding quality and exceed the vector store's context window assumptions. A long (~500-token) experience block is used as input to stress-test the splitter.

**Input:**

- One `ClassifiedBlock(section="experience", text=<~500 token repeated text>)`

**Expected Output:**

```
All chunks: token_count <= 150
```

**Actual Output:**

```
All chunks pass the 150-token limit check   ✓
Multiple chunks produced (splitter ran)     ✓
```

**Verdict: PASS**

---

## Case 8 — Experience Match Capped at 100 for Overqualified Candidates

**File:** `tests/test_job_match_pipeline.py::TestFitScore::test_experience_match_capped_at_100`
**Component:** Fit scorer (`app/ai/agents/fit_scorer/scorer.py`)

**Description:**
Verifies that a candidate with more experience than required does not receive a score above 100. Without this cap, the weighted total could exceed 100, breaking the displayed percentage.

**Input:**

- `cv_years=8` (years on CV)
- `years_required=2` (JD requirement)
- Raw formula: round(8/2 × 100) = 400 — must be capped at 100

**Expected Output:**

```
result.experience_match == 100
```

**Actual Output:**

```
result.experience_match == 100   ✓   (min(raw, 100) cap applied)
```

**Verdict: PASS**

---

## Summary

| #   | Test Case                                               | Component    | Verdict  |
| --- | ------------------------------------------------------- | ------------ | -------- |
| 1   | Fit score weighted formula (0.4/0.4/0.2)                | Fit scorer   | **PASS** |
| 2   | CV pipeline status order + delete-before-embed          | CV pipeline  | **PASS** |
| 3   | Qdrant user isolation — user_id filter enforced         | Vector store | **PASS** |
| 4   | LLM graceful degradation on malformed JSON              | JD extractor | **PASS** |
| 5   | Chat dual-write: Postgres committed before Redis        | Chat service | **PASS** |
| 6   | Auth: identical error for wrong email vs wrong password | Auth         | **PASS** |
| 7   | Chunk token limit ≤ 150 tokens enforced                 | CV chunker   | **PASS** |
| 8   | Experience match capped at 100 for overqualified        | Fit scorer   | **PASS** |

**8 / 8 PASS** — run `cd backend && pytest -v` to reproduce all results.
