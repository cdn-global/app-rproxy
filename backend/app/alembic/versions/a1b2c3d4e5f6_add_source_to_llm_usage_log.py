"""Add source column to llm_usage_log

Revision ID: a1b2c3d4e5f6
Revises: 9d1e2f3a4b5c
Create Date: 2026-02-12 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'a1b2c3d4e5f6'
down_revision = '9d1e2f3a4b5c'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        'llm_usage_log',
        sa.Column('source', sa.String(length=20), nullable=True),
    )
    op.create_index('ix_llm_usage_log_source', 'llm_usage_log', ['source'])


def downgrade():
    op.drop_index('ix_llm_usage_log_source', table_name='llm_usage_log')
    op.drop_column('llm_usage_log', 'source')
