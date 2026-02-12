"""Add storage tables

Revision ID: d8f3a9b2c1e5
Revises: cccf54b9dc9e
Create Date: 2026-02-07 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
import sqlmodel
from sqlalchemy.dialects import postgresql
import uuid

# revision identifiers, used by Alembic.
revision = 'd8f3a9b2c1e5'
down_revision = 'cccf54b9dc9e'
branch_labels = None
depends_on = None


def upgrade():
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    # Create storage_bucket table
    if not inspector.has_table('storage_bucket'):
        op.create_table(
            'storage_bucket',
            sa.Column('id', sa.Uuid(), nullable=False),
            sa.Column('user_id', sa.Uuid(), nullable=False),
            sa.Column('bucket_name', sqlmodel.sql.sqltypes.AutoString(length=255), nullable=False),
            sa.Column('region', sqlmodel.sql.sqltypes.AutoString(length=50), nullable=False),
            sa.Column('storage_class', sqlmodel.sql.sqltypes.AutoString(length=50), nullable=False),
            sa.Column('status', sqlmodel.sql.sqltypes.AutoString(length=50), nullable=False),
            sa.Column('storage_backend', sqlmodel.sql.sqltypes.AutoString(length=50), nullable=False),
            sa.Column('access_key', sqlmodel.sql.sqltypes.AutoString(length=255), nullable=True),
            sa.Column('secret_key_encrypted', sqlmodel.sql.sqltypes.AutoString(), nullable=True),
            sa.Column('endpoint_url', sqlmodel.sql.sqltypes.AutoString(length=512), nullable=True),
            sa.Column('storage_gb_used', sa.Float(), nullable=False),
            sa.Column('object_count', sa.Integer(), nullable=False),
            sa.Column('monthly_rate_per_gb', sa.Float(), nullable=False),
            sa.Column('created_at', sa.DateTime(), nullable=False),
            sa.ForeignKeyConstraint(['user_id'], ['user.id'], ),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index(op.f('ix_storage_bucket_bucket_name'), 'storage_bucket', ['bucket_name'], unique=True)

    # Create storage_object table
    if not inspector.has_table('storage_object'):
        op.create_table(
            'storage_object',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('bucket_id', sa.Uuid(), nullable=False),
        sa.Column('user_id', sa.Uuid(), nullable=False),
        sa.Column('object_key', sqlmodel.sql.sqltypes.AutoString(length=1024), nullable=False),
        sa.Column('size_bytes', sa.Integer(), nullable=False),
        sa.Column('content_type', sqlmodel.sql.sqltypes.AutoString(length=255), nullable=True),
        sa.Column('etag', sqlmodel.sql.sqltypes.AutoString(length=255), nullable=True),
        sa.Column('storage_class', sqlmodel.sql.sqltypes.AutoString(length=50), nullable=False),
        sa.Column('is_deleted', sa.Boolean(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('last_modified', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['bucket_id'], ['storage_bucket.id'], ),
        sa.ForeignKeyConstraint(['user_id'], ['user.id'], ),
        sa.PrimaryKeyConstraint('id')
    )


def downgrade():
    op.drop_table('storage_object')
    op.drop_index(op.f('ix_storage_bucket_bucket_name'), table_name='storage_bucket')
    op.drop_table('storage_bucket')
