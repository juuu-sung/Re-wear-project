"""Add missing care_summary column

Revision ID: 5b28a897c80d
Revises: b92b33bb9f31
Create Date: 2025-11-15 23:47:45.250185

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '5b28a897c80d'
down_revision: Union[str, Sequence[str], None] = 'b92b33bb9f31'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema.

    - 이미 존재하는 테이블/컬럼은 건드리지 않고,
    - 없을 때만 생성/추가하는 방어적인 마이그레이션으로 동작시킨다.
    """
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    existing_tables = set(inspector.get_table_names())

    # 1) chat_rooms
    if "chat_rooms" not in existing_tables:
        op.create_table(
            "chat_rooms",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("user1_id", sa.Integer(), nullable=False),
            sa.Column("user2_id", sa.Integer(), nullable=False),
            sa.Column("created_at", sa.DateTime(), nullable=True),
            sa.Column("updated_at", sa.DateTime(), nullable=True),
            sa.ForeignKeyConstraint(["user1_id"], ["users.id"]),
            sa.ForeignKeyConstraint(["user2_id"], ["users.id"]),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint("user1_id", "user2_id", name="unique_chat_room"),
        )
        op.create_index(op.f("ix_chat_rooms_id"), "chat_rooms", ["id"], unique=False)

    # 2) reform_posts
    if "reform_posts" not in existing_tables:
        op.create_table(
            "reform_posts",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("user_id", sa.Integer(), nullable=True),
            sa.Column("title", sa.String(), nullable=True),
            sa.Column("description", sa.String(), nullable=True),
            sa.Column("category", sa.String(), nullable=True),
            sa.Column(
                "created_at",
                sa.DateTime(),
                server_default=sa.text("now()"),
                nullable=True,
            ),
            sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
            sa.PrimaryKeyConstraint("id"),
        )

    # 3) chat_messages
    if "chat_messages" not in existing_tables:
        op.create_table(
            "chat_messages",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("room_id", sa.Integer(), nullable=False),
            sa.Column("sender_id", sa.Integer(), nullable=False),
            sa.Column("message", sa.Text(), nullable=False),
            sa.Column("read", sa.Boolean(), nullable=True),
            sa.Column("created_at", sa.DateTime(), nullable=True),
            sa.ForeignKeyConstraint(["room_id"], ["chat_rooms.id"]),
            sa.ForeignKeyConstraint(["sender_id"], ["users.id"]),
            sa.PrimaryKeyConstraint("id"),
        )
        op.create_index(
            op.f("ix_chat_messages_id"),
            "chat_messages",
            ["id"],
            unique=False,
        )

    # 4) reform_comments
    if "reform_comments" not in existing_tables:
        op.create_table(
            "reform_comments",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("post_id", sa.Integer(), nullable=True),
            sa.Column("user_id", sa.Integer(), nullable=True),
            sa.Column("comment", sa.String(), nullable=True),
            sa.Column(
                "created_at",
                sa.DateTime(),
                server_default=sa.text("now()"),
                nullable=True,
            ),
            sa.ForeignKeyConstraint(["post_id"], ["reform_posts.id"]),
            sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
            sa.PrimaryKeyConstraint("id"),
        )

    # 5) reform_images
    if "reform_images" not in existing_tables:
        op.create_table(
            "reform_images",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("post_id", sa.Integer(), nullable=True),
            sa.Column("image_url", sa.String(), nullable=True),
            sa.Column("is_before", sa.Boolean(), nullable=True),
            sa.ForeignKeyConstraint(["post_id"], ["reform_posts.id"]),
            sa.PrimaryKeyConstraint("id"),
        )

    # 6) reform_likes
    if "reform_likes" not in existing_tables:
        op.create_table(
            "reform_likes",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("post_id", sa.Integer(), nullable=True),
            sa.Column("user_id", sa.Integer(), nullable=True),
            sa.ForeignKeyConstraint(["post_id"], ["reform_posts.id"]),
            sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
            sa.PrimaryKeyConstraint("id"),
        )

    # 7) clothes.care_summary 컬럼 추가 (없을 때만)
    if "clothes" in existing_tables:
        clothes_cols = [c["name"] for c in inspector.get_columns("clothes")]
        if "care_summary" not in clothes_cols:
            op.add_column(
                "clothes",
                sa.Column("care_summary", sa.Text(), nullable=True),
            )



def downgrade() -> None:
    """Downgrade schema."""
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_column('clothes', 'care_summary')
    op.drop_table('reform_likes')
    op.drop_table('reform_images')
    op.drop_table('reform_comments')
    op.drop_index(op.f('ix_chat_messages_id'), table_name='chat_messages')
    op.drop_table('chat_messages')
    op.drop_table('reform_posts')
    op.drop_index(op.f('ix_chat_rooms_id'), table_name='chat_rooms')
    op.drop_table('chat_rooms')
    # ### end Alembic commands ###