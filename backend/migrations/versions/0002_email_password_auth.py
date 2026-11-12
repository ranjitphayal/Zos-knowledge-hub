"""Add password credentials and email action tokens.

Revision ID: 0002_email_password_auth
Revises: 0001_initial
"""
from alembic import op
import sqlalchemy as sa

revision = "0002_email_password_auth"
down_revision = "0001_initial"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("users", sa.Column("password_hash", sa.String(length=512), nullable=True))
    op.add_column(
        "users",
        sa.Column("email_verified", sa.Boolean(), server_default=sa.false(), nullable=False),
    )
    op.add_column("users", sa.Column("token_version", sa.Integer(), server_default="0", nullable=False))
    op.execute("UPDATE users SET email_verified = true WHERE provider <> 'password'")
    op.create_table(
        "email_action_tokens",
        sa.Column("token_hash", sa.String(length=64), primary_key=True),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("purpose", sa.String(length=24), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
    )
    op.create_index("ix_email_action_tokens_user_id", "email_action_tokens", ["user_id"])


def downgrade():
    op.drop_index("ix_email_action_tokens_user_id", table_name="email_action_tokens")
    op.drop_table("email_action_tokens")
    op.drop_column("users", "token_version")
    op.drop_column("users", "email_verified")
    op.drop_column("users", "password_hash")
