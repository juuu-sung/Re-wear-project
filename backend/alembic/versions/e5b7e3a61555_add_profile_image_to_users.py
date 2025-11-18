"""add profile_image to users

Revision ID: e5b7e3a61555
Revises: 6a90e53a8c1b
Create Date: 2025-11-19 02:34:13.286991

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e5b7e3a61555'
down_revision: Union[str, Sequence[str], None] = '6a90e53a8c1b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade():
    op.add_column(
        "users",
        sa.Column("profile_image", sa.String(length=512), nullable=True),
    )

def downgrade():
    op.drop_column("users", "profile_image")