"""add shortlist status and cover_letter_url/jd_text to applications

Revision ID: d4e2b1c9f3a8
Revises: 162187760829
Create Date: 2026-06-14 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'd4e2b1c9f3a8'
down_revision: Union[str, Sequence[str], None] = '162187760829'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add 'shortlist' as the first value in the enum so it sorts before 'applied'.
    # IF NOT EXISTS makes this safe to re-run.
    op.execute("ALTER TYPE application_status ADD VALUE IF NOT EXISTS 'shortlist' BEFORE 'applied'")

    op.add_column("applications", sa.Column("cover_letter_url", sa.Text(), nullable=True))
    op.add_column("applications", sa.Column("jd_text", sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column("applications", "jd_text")
    op.drop_column("applications", "cover_letter_url")

    # PostgreSQL cannot DROP a value from an enum — recreate the type without 'shortlist'.
    op.execute("UPDATE applications SET status = 'applied' WHERE status = 'shortlist'")
    op.execute("ALTER TYPE application_status RENAME TO application_status_old")
    op.execute("CREATE TYPE application_status AS ENUM ('applied', 'interviewing', 'offer', 'rejected')")
    op.execute(
        "ALTER TABLE applications ALTER COLUMN status TYPE application_status "
        "USING status::text::application_status"
    )
    op.execute("DROP TYPE application_status_old")
