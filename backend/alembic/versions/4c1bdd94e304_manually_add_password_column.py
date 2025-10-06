"""manually add password column

Revision ID: 4c1bdd94e304
Revises: 14f0c21ad101
Create Date: 2025-10-06 02:28:50.274664

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '4c1bdd94e304'
down_revision = "14f0c21ad101"   # 현재 head를 down_revision으로!
branch_labels = None
depends_on = None

def upgrade() -> None:
    op.execute("ALTER TABLE public.users ADD COLUMN IF NOT EXISTS password VARCHAR(255);")

def downgrade() -> None:
    op.execute("ALTER TABLE public.users DROP COLUMN IF EXISTS password;")