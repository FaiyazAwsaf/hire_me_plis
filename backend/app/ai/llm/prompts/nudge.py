from dataclasses import dataclass


@dataclass
class NudgeStats:
    applied_last_7_days: int   # applications submitted in the past 7 days
    active_goals: list[str]    # titles of incomplete goals (completed_at is None)
    total_applications: int    # total all-time applications (context for the LLM)


def nudge_prompt(stats: NudgeStats) -> str:
    goals_text = (
        "\n".join(f"- {g}" for g in stats.active_goals)
        if stats.active_goals
        else "No active goals set."
    )
    return (
        f"You are a career coach writing a short, motivating nudge for a job seeker.\n\n"
        f"User stats (last 7 days):\n"
        f"- Applications submitted: {stats.applied_last_7_days}\n"
        f"- Total applications ever: {stats.total_applications}\n\n"
        f"Active goals:\n{goals_text}\n\n"
        f"Write exactly ONE nudge: 1–2 sentences, actionable, specific to these stats. "
        f"If they haven't applied this week, encourage them. "
        f"If they have active goals, reference them. "
        f"Do not use markdown. Return only the nudge text, nothing else."
    )
