def section_classifier_prompt(text: str) -> str:
    return f"""You are a CV/resume parser. Given the following text extracted from a CV, \
classify each paragraph into one of these sections:
experience, education, skills, projects, certifications, personal

Return a JSON array where each item has:
- "section": one of the above labels
- "text": the original paragraph text

CV TEXT:
{text}

Respond ONLY with valid JSON, no explanation."""
