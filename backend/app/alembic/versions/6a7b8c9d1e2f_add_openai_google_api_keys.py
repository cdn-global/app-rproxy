"""Add OpenAI and Google API keys to user table

Revision ID: 6a7b8c9d1e2f
Revises: 723b88b54638
Create Date: 2026-02-12 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '6a7b8c9d1e2f'
down_revision = '723b88b54638'
branch_labels = None
depends_on = None


def upgrade():
    # Add OpenAI and Google API key columns to user table
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    columns = [col['name'] for col in inspector.get_columns('user')]
    
    if 'openai_api_key' not in columns:
        op.add_column('user', sa.Column('openai_api_key', sa.String(length=500), nullable=True))
    if 'google_api_key' not in columns:
        op.add_column('user', sa.Column('google_api_key', sa.String(length=500), nullable=True))


def downgrade():
    # Remove OpenAI and Google API key columns from user table
    op.drop_column('user', 'openai_api_key')
    op.drop_column('user', 'google_api_key')
