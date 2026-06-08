def cv_meta_prompt(experience_text: str) -> str:
    return f"""You are a CV/resume parser. Given the following experience section from a CV, extract:
1. "role_title": the candidate's most recent job title (string)
2. "experience_years": total years of professional experience (integer, round to nearest whole number)

EXPERIENCE TEXT:
{experience_text}

Respond ONLY with valid JSON in this exact format: {{"role_title": "...", "experience_years": N}}"""


def profile_extraction_prompt(classified_text: str) -> str:
    """Prompt for Gemini Flash to extract a full structured profile from classified CV text."""
    return f"""You are a CV parser. Extract structured data from the resume text below.

Return ONLY valid JSON with this exact shape (no extra fields, no comments):
{{
  "personal": {{
    "name": "string",
    "email": "string",
    "phone": "string or null",
    "location": "string or null",
    "linkedin": "string or null",
    "github": "string or null",
    "summary": "string or null"
  }},
  "experience": [
    {{
      "role": "string",
      "company": "string",
      "start_date": "YYYY-MM",
      "end_date": "YYYY-MM or null",
      "current": false,
      "description": "string"
    }}
  ],
  "education": [
    {{
      "degree": "string",
      "institution": "string",
      "start_date": "YYYY-MM",
      "end_date": "YYYY-MM or null",
      "grade": "string or null"
    }}
  ],
  "skills": ["string"],
  "projects": [
    {{
      "name": "string",
      "description": "string",
      "url": "string or null",
      "tech_stack": ["string"]
    }}
  ],
  "certifications": [
    {{
      "name": "string",
      "issuer": "string",
      "date": "YYYY-MM or null",
      "url": "string or null"
    }}
  ]
}}

Rules:
- Missing optional fields → null (never empty string)
- Dates MUST be YYYY-MM (if only a year is given, use YYYY-01)
- "current" is true only when the role has no end date and is clearly ongoing
- Skills must be a flat list of individual skill names
- Do NOT include "id" fields — they will be added separately

RESUME TEXT:
{classified_text}

Respond ONLY with valid JSON. No markdown fences, no explanation."""


def section_classifier_prompt(text: str) -> str:
    return f"""You are a CV/resume parser. Given the following text extracted from a CV, \
classify each meaningful block into one of these sections:
experience, education, skills, projects, certifications, personal, summary

Rules:
- Copy the EXACT original text for each block — do NOT paraphrase, summarize, or omit any words
- SKIP blocks that are only a bare section heading (e.g. "SKILLS", "EXPERIENCE", "EDUCATION") with no content
- Classify language proficiency (e.g. "English – IELTS 8.0") under "personal", not "skills"
- If a block contains a comma-separated list of technologies, preserve every item exactly as written

Return a JSON array where each item has:
- "section": one of the above labels
- "text": the exact original text, unchanged

CV TEXT:
{text}

Respond ONLY with valid JSON, no explanation."""
