def cv_meta_prompt(experience_text: str) -> str:
    return f"""You are a CV/resume parser. Given the following experience section from a CV, extract:
1. "role_title": the candidate's most recent job title (string)
2. "experience_years": total years of professional experience (integer, round to nearest whole number)

EXPERIENCE TEXT:
{experience_text}

Respond ONLY with valid JSON in this exact format: {{"role_title": "...", "experience_years": N}}"""


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
