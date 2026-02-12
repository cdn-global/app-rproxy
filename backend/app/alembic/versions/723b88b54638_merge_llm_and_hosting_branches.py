"""merge_llm_and_hosting_branches

Revision ID: 723b88b54638
Revises: 5e9d7f3c2b1a, d8f3a9b2c1e5
Create Date: 2026-02-12 03:40:08.126473

"""
from alembic import op
import sqlalchemy as sa
import sqlmodel.sql.sqltypes


# revision identifiers, used by Alembic.
revision = '723b88b54638'
down_revision = ('5e9d7f3c2b1a', 'd8f3a9b2c1e5')
branch_labels = None
depends_on = None


def upgrade():
    pass


def downgrade():
    pass
