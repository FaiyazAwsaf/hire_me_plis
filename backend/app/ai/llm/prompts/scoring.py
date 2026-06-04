def skill_extraction_prompt(jd_text: str) -> str:
    return f"""You are a job description parser. Extract all technical and soft skills \
explicitly required or preferred in the job description below.

JD TEXT:
{jd_text}

Respond ONLY with a valid JSON array of skill strings. Example: ["Python", "FastAPI", "Docker"]
No explanation, no markdown fences."""


def years_extraction_prompt(jd_text: str) -> str:
    return f"""You are a job description parser. Extract the minimum years of professional \
experience required from the job description below.

JD TEXT:
{jd_text}

Respond ONLY with valid JSON in this exact format: {{"years_required": N}} where N is an integer.
If no years requirement is stated, respond with: {{"years_required": null}}"""


def fit_score_explanation_prompt(
    score: int,
    breakdown: dict,
    cv_context: str,
    jd_summary: str,
) -> str:
    return f"""You are a career advisor. A fit score algorithm produced the following match \
between a candidate's CV and a job description:

Overall score: {score}/100
Breakdown:
- Skill match: {breakdown['skill_match']}/100
- Semantic match: {breakdown['semantic_match']}/100
- Experience match: {breakdown['experience_match']}/100

Relevant CV context:
{cv_context}

Job description summary:
{jd_summary}

Write 2-3 sentences explaining this score in plain English. Be specific — reference actual \
skills or experience from the CV context above. Do not invent any details not present in the CV."""
