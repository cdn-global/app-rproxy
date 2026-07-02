"""Add evidence tracking: login_log, api_request_log tables; user evidence fields; api key last_ip

Revision ID: f1e2d3c4b5a6
Revises: a1b2c3d4e5f6
Create Date: 2026-07-02 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
import uuid

revision = 'f1e2d3c4b5a6'
down_revision = 'a1b2c3d4e5f6'
branch_labels = None
depends_on = None


def upgrade():
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    # ── user table: evidence fields ──────────────────────────────────────────
    user_cols = {c['name'] for c in inspector.get_columns('user')}
    for col_name, col_type in [
        ('created_at',       sa.DateTime()),
        ('signup_ip',        sa.String(45)),
        ('tos_accepted_at',  sa.DateTime()),
        ('email_verified_at',sa.DateTime()),
    ]:
        if col_name not in user_cols:
            op.add_column('user', sa.Column(col_name, col_type, nullable=True))

    # ── user_api_key: last_ip ────────────────────────────────────────────────
    if inspector.has_table('user_api_key'):
        ak_cols = {c['name'] for c in inspector.get_columns('user_api_key')}
        if 'last_ip' not in ak_cols:
            op.add_column('user_api_key', sa.Column('last_ip', sa.String(45), nullable=True))

    # ── login_log table ──────────────────────────────────────────────────────
    if not inspector.has_table('login_log'):
        op.create_table(
            'login_log',
            sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
            sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=True),
            sa.Column('email_attempted', sa.String(255), nullable=False),
            sa.Column('ip_address', sa.String(45), nullable=True),
            sa.Column('user_agent', sa.String(512), nullable=True),
            sa.Column('success', sa.Boolean(), nullable=False, server_default='false'),
            sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        )
        op.create_index('ix_login_log_user_id',   'login_log', ['user_id'])
        op.create_index('ix_login_log_created_at','login_log', ['created_at'])
        op.create_index('ix_login_log_ip',        'login_log', ['ip_address'])

    # ── api_request_log table ────────────────────────────────────────────────
    if not inspector.has_table('api_request_log'):
        op.create_table(
            'api_request_log',
            sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
            sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=True),
            sa.Column('api_key_prefix', sa.String(10), nullable=True),
            sa.Column('ip_address', sa.String(45), nullable=True),
            sa.Column('user_agent', sa.String(255), nullable=True),
            sa.Column('endpoint', sa.String(255), nullable=True),
            sa.Column('status_code', sa.Integer(), nullable=True),
            sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        )
        op.create_index('ix_api_request_log_user_id',   'api_request_log', ['user_id'])
        op.create_index('ix_api_request_log_created_at','api_request_log', ['created_at'])


def downgrade():
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    if inspector.has_table('api_request_log'):
        op.drop_table('api_request_log')
    if inspector.has_table('login_log'):
        op.drop_table('login_log')

    if inspector.has_table('user_api_key'):
        ak_cols = {c['name'] for c in inspector.get_columns('user_api_key')}
        if 'last_ip' in ak_cols:
            op.drop_column('user_api_key', 'last_ip')

    user_cols = {c['name'] for c in inspector.get_columns('user')}
    for col in ['email_verified_at', 'tos_accepted_at', 'signup_ip', 'created_at']:
        if col in user_cols:
            op.drop_column('user', col)
