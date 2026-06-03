from langgraph.graph import END, START, StateGraph

from app.ai.agents.job_hunter.nodes import parse_query_node, score_node, search_node
from app.ai.agents.job_hunter.state import JobHunterState

_builder = StateGraph(JobHunterState)

_builder.add_node("parse", parse_query_node)
_builder.add_node("search", search_node)
_builder.add_node("score", score_node)

_builder.add_edge(START, "parse")
_builder.add_edge("parse", "search")
_builder.add_edge("search", "score")
_builder.add_edge("score", END)

# Compiled once at import time — graph topology is validated here, not per-request
agent = _builder.compile()
