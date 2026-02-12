"""Add anthropic_api_key to user table

Revision ID: 4f9c8a7b2e1d
Revises: 3a8b5971fdc9
Create Date: 2026-02-12 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '4f9c8a7b2e1d'
down_revision = '3a8b5971fdc9'
branch_labels = None
depends_on = None


def upgrade():
    # Add anthropic_api_key column to user table
    op.add_column('user', sa.Column('anthropic_api_key', sa.String(length=500), nullable=True))


def downgrade():
    # Remove anthropic_api_key column from user table
    op.drop_column('user', 'anthropic_api_key')
