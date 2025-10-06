"""add password column to users

Revision ID: 14f0c21ad101
Revises: 01eb6d8ae4c9
Create Date: 2025-10-06 02:20:23.768503

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '14f0c21ad101'
down_revision: Union[str, Sequence[str], None] = '01eb6d8ae4c9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        'users',
        sa.Column('password', sa.String(length=255), nullable=True)  # 처음엔 nullable=True로
    )


def downgrade() -> None:
    op.drop_column('users', 'password')