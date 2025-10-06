"""ensure users.password exists (guarded)

Revision ID: c64d7882db4c
Revises: 3fe1b755d0bd
Create Date: 2025-10-06 15:51:34.948844

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c64d7882db4c'
down_revision = "01eb6d8ae4c9"  # 현재 head로 바꿔주세요
branch_labels = None
depends_on = None

def upgrade():
    op.execute("""
    ALTER TABLE public.users
    ADD COLUMN IF NOT EXISTS password VARCHAR(255);
    """)

def downgrade():
    op.execute("""
    ALTER TABLE public.users
    DROP COLUMN IF EXISTS password;
    """)