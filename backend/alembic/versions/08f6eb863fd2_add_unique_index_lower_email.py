"""add unique index lower(email)

Revision ID: 08f6eb863fd2
Revises: 95b69cabcbac
Create Date: 2025-10-07 01:07:05.560438

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '08f6eb863fd2'
down_revision: Union[str, Sequence[str], None] = 'fd5a88b1b47c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
