"""merge heads (password migrations)

Revision ID: fd5a88b1b47c
Revises: 3fe1b755d0bd, c64d7882db4c
Create Date: 2025-10-06 16:09:18.721326

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'fd5a88b1b47c'
down_revision: Union[str, Sequence[str], None] = ('3fe1b755d0bd', 'c64d7882db4c')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
