"""add laundry_baskets table

Revision ID: bb2e7d1c4a6f
Revises: 3f5aec5d5def
Create Date: 2025-12-18

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "bb2e7d1c4a6f"
down_revision: Union[str, Sequence[str], None] = "3f5aec5d5def"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "laundry_baskets",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("clothes_id", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["clothes_id"], ["clothes.id"]),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", "clothes_id", name="uq_user_clothes_basket"),
    )
    op.create_index(op.f("ix_laundry_baskets_id"), "laundry_baskets", ["id"], unique=False)
    op.create_index(op.f("ix_laundry_baskets_user_id"), "laundry_baskets", ["user_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_laundry_baskets_user_id"), table_name="laundry_baskets")
    op.drop_index(op.f("ix_laundry_baskets_id"), table_name="laundry_baskets")
    op.drop_table("laundry_baskets")

