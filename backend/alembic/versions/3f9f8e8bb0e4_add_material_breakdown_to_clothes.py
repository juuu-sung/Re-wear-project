"""add material_breakdown to clothes

Revision ID: 3f9f8e8bb0e4
Revises: b676eebfbcb0
Create Date: 2024-04-08 00:00:00.000000
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "3f9f8e8bb0e4"
down_revision = "b676eebfbcb0"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "clothes",
        sa.Column("material_breakdown", sa.Text(), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("clothes", "material_breakdown")

