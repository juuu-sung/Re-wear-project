from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "fe395514aae9"
down_revision = "08f6eb863fd2"
branch_labels = None
depends_on = None

def upgrade():
    # 1) server_default로 컬럼 추가(기존 행 채우기 용도)
    op.add_column(
        "users",
        sa.Column("password_hash", sa.String(length=255), nullable=False, server_default="__NEED_RESET__")
    )
    # 2) 기본값은 앞으로는 필요 없으니 제거
    op.alter_column("users", "password_hash", server_default=None)

def downgrade():
    op.drop_column("users", "password_hash")
