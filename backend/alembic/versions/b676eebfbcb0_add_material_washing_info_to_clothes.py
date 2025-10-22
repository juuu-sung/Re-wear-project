"""add material & washing_info to clothes

Revision ID: b676eebfbcb0
Revises: c39a0a1f4832
Create Date: 2025-10-22 02:02:38.918802

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b676eebfbcb0'
down_revision: Union[str, Sequence[str], None] = 'c39a0a1f4832'
branch_labels = None
depends_on = None

def upgrade():
    op.add_column("clothes", sa.Column("material", sa.String(length=100), nullable=True))
    op.add_column("clothes", sa.Column("washing_info", sa.Text(), nullable=True))

def downgrade():
    op.drop_column("clothes", "washing_info")
    op.drop_column("clothes", "material")