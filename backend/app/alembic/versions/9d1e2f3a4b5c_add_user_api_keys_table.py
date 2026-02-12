"""Add user_api_key table for REST API key management

Revision ID: 9d1e2f3a4b5c
Revises: 8c9d1e2f3a4b
Create Date: 2026-02-12 07:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
import uuid


# revision identifiers, used by Alembic.
revision = '9d1e2f3a4b5c'
down_revision = '8c9d1e2f3a4b'
branch_labels = None
depends_on = None


def upgrade():
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    if not inspector.has_table('user_api_key'):
        op.create_table(
            'user_api_key',
            sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
            sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False, index=True),
            sa.Column('name', sa.String(length=100), nullable=False),
            sa.Column('key_prefix', sa.String(length=10), nullable=False),
            sa.Column('hashed_key', sa.String(length=255), nullable=False),
            sa.Column('request_count', sa.Integer(), nullable=False, server_default='0'),
            sa.Column('last_used_at', sa.DateTime(), nullable=True),
            sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
            sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
            sa.ForeignKeyConstraint(['user_id'], ['user.id'], ondelete='CASCADE'),
        )


def downgrade():
    op.drop_table('user_api_key')
