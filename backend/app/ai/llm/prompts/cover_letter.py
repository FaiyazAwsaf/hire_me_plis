def cover_letter_prompt(role: str, company: str, jd_summary: str, cv_context: str) -> str:
    """Prompt for generating a personalized cover letter.

    cv_context is retrieved from Qdrant (experience + projects chunks) so the letter
    references the user's actual background, never generic filler.
    """
    return f"""Write a professional cover letter for the following role.

Role: {role}
Company: {company}
Job summary: {jd_summary}

The applicant's background (from their CV):
{cv_context}

Instructions:
- Address it to the hiring team at {company}
- Open with a compelling hook that references a specific achievement from the CV
- In the body, connect 2-3 concrete experiences from the CV to the role requirements
- Close with a clear call to action
- Keep it to three paragraphs, no longer than 300 words total
- Tone: confident and professional, not stiff
- Do NOT invent any facts, dates, or projects not present in the CV context above
- Do NOT include placeholders like [Your Name] — the letter should be complete as written"""
