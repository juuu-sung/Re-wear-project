"""manually add password column

Revision ID: 3fe1b755d0bd
Revises: 4c1bdd94e304
Create Date: 2025-10-06 02:29:51.771559

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '3fe1b755d0bd'
down_revision: Union[str, Sequence[str], None] = '4c1bdd94e304'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
