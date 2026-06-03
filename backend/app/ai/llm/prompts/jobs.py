def parse_query_prompt(query: str) -> str:
    """Parse a natural language job search query into structured fields.

    Used by the Day 5 Job Hunter Agent to extract role, location, and date_from
    before calling python-jobspy. Created in Day 4 as a prerequisite stub.
    """
    return f"""You are a job search assistant. Parse the following natural language job search \
query and extract structured fields.

QUERY: {query}

Respond ONLY with valid JSON in this exact format:
{{"role": "...", "location": "...", "date_from": "YYYY-MM-DD"}}

Rules:
- "role": the job title or type being searched for (string, required)
- "location": city or country mentioned, or null if not specified
- "date_from": earliest posting date in YYYY-MM-DD format, or null if not specified"""
