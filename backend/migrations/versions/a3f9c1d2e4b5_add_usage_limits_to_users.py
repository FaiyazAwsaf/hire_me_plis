"""add usage limits to users

Revision ID: a3f9c1d2e4b5
Revises: 162187760829
Create Date: 2026-06-10 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "a3f9c1d2e4b5"
down_revision: Union[str, None] = "162187760829"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("users", sa.Column("is_admin", sa.Boolean(), nullable=False, server_default=sa.text("false")))
    op.add_column("users", sa.Column("job_searches_used", sa.Integer(), nullable=False, server_default=sa.text("0")))
    op.add_column("users", sa.Column("chat_messages_used", sa.Integer(), nullable=False, server_default=sa.text("0")))


def downgrade() -> None:
    op.drop_column("users", "chat_messages_used")
    op.drop_column("users", "job_searches_used")
    op.drop_column("users", "is_admin")
