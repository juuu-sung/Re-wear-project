"""add_phone_number_to_users

Revision ID: 3f5aec5d5def
Revises: 44ca1815a26c
Create Date: 2025-12-04 01:11:23.237609
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "3f5aec5d5def"
down_revision: Union[str, Sequence[str], None] = "44ca1815a26c"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""

    # 1) chat_messages.read: NULL 허용 → NOT NULL
    op.alter_column(
        "chat_messages",
        "read",
        existing_type=sa.BOOLEAN(),
        nullable=False,
    )

    # 2) chat_rooms 유니크 제약조건 제거
    op.drop_constraint(
        op.f("unique_chat_room"),
        "chat_rooms",
        type_="unique",
    )

    # 3) users.phone_number 컬럼 추가 (이미 있으면 그냥 건너뜀)
    op.execute(
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20)"
    )


def downgrade() -> None:
    """Downgrade schema."""

    # 1) users.phone_number 컬럼 제거 (있을 때만)
    op.execute(
        "ALTER TABLE users DROP COLUMN IF EXISTS phone_number"
    )

    # 2) chat_rooms 유니크 제약조건 복원
    op.create_unique_constraint(
        op.f("unique_chat_room"),
        "chat_rooms",
        ["user1_id", "user2_id"],
    )

    # 3) chat_messages.read를 다시 NULL 허용으로 되돌리기
    op.alter_column(
        "chat_messages",
        "read",
        existing_type=sa.BOOLEAN(),
        nullable=True,
    )
