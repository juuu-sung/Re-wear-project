"""add care_summary column to clothes

Revision ID: 4b3c2d1e5f8a
Revises: 3f9f8e8bb0e4
Create Date: 2024-05-01 00:00:00.000000
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "4b3c2d1e5f8a"
down_revision = "3f9f8e8bb0e4"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("clothes", sa.Column("care_summary", sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column("clothes", "care_summary")
