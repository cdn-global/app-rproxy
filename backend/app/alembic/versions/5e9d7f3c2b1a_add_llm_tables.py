"""Add LLM tables (llm_provider, llm_model, conversation, llm_message, llm_usage_log)

Revision ID: 5e9d7f3c2b1a
Revises: 4f9c8a7b2e1d
Create Date: 2026-02-12 03:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
import uuid


# revision identifiers, used by Alembic.
revision = '5e9d7f3c2b1a'
down_revision = '4f9c8a7b2e1d'
branch_labels = None
depends_on = None


def upgrade():
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    
    # Create llm_provider table
    if not inspector.has_table('llm_provider'):
        op.create_table(
            'llm_provider',
            sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column('name', sa.String(length=100), nullable=False, index=True),
        sa.Column('display_name', sa.String(length=200), nullable=False),
        sa.Column('description', sa.String(length=500), nullable=True),
        sa.Column('website_url', sa.String(length=500), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, default=True),
    )

    if not inspector.has_table('llm_model'):
        # Create llm_model table
        op.create_table(
            'llm_model',
            sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
            sa.Column('provider_id', postgresql.UUID(as_uuid=True), nullable=False),
            sa.Column('name', sa.String(length=100), nullable=False, index=True),
            sa.Column('model_id', sa.String(length=200), nullable=False),
            sa.Column('display_name', sa.String(length=200), nullable=False),
            sa.Column('input_token_price', sa.Float(), nullable=False, default=0.0),
            sa.Column('output_token_price', sa.Float(), nullable=False, default=0.0),
            sa.Column('max_tokens', sa.Integer(), nullable=False, default=8192),
            sa.Column('is_active', sa.Boolean(), nullable=False, default=True),
            sa.ForeignKeyConstraint(['provider_id'], ['llm_provider.id'], ),
        )

    if not inspector.has_table('conversation'):
        # Create conversation table
        op.create_table(
            'conversation',
            sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
            sa.Column('owner_id', postgresql.UUID(as_uuid=True), nullable=False),
            sa.Column('title', sa.String(length=255), nullable=False),
            sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
            sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
            sa.ForeignKeyConstraint(['owner_id'], ['user.id'], ondelete='CASCADE'),
        )

    if not inspector.has_table('llm_message'):
        # Create llm_message table
        op.create_table(
            'llm_message',
            sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
            sa.Column('conversation_id', postgresql.UUID(as_uuid=True), nullable=False),
            sa.Column('model_id', postgresql.UUID(as_uuid=True), nullable=True),
            sa.Column('role', sa.String(length=50), nullable=False),
            sa.Column('content', sa.Text(), nullable=False),
            sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
            sa.Column('input_tokens', sa.Integer(), nullable=False, default=0),
            sa.Column('output_tokens', sa.Integer(), nullable=False, default=0),
            sa.Column('cost', sa.Float(), nullable=False, default=0.0),
            sa.ForeignKeyConstraint(['conversation_id'], ['conversation.id'], ondelete='CASCADE'),
            sa.ForeignKeyConstraint(['model_id'], ['llm_model.id'], ),
        )

    if not inspector.has_table('llm_usage_log'):
        # Create llm_usage_log table
        op.create_table(
        'llm_usage_log',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False, index=True),
        sa.Column('model_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('conversation_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('message_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('input_tokens', sa.Integer(), nullable=False, default=0),
        sa.Column('output_tokens', sa.Integer(), nullable=False, default=0),
        sa.Column('total_cost', sa.Float(), nullable=False, default=0.0),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()'), index=True),
        sa.ForeignKeyConstraint(['user_id'], ['user.id'], ),
        sa.ForeignKeyConstraint(['model_id'], ['llm_model.id'], ),
        sa.ForeignKeyConstraint(['conversation_id'], ['conversation.id'], ),
        sa.ForeignKeyConstraint(['message_id'], ['llm_message.id'], ),
    )

    # Insert default Anthropic provider
    op.execute("""
        INSERT INTO llm_provider (id, name, display_name, description, website_url, is_active)
        VALUES (
            gen_random_uuid(),
            'anthropic',
            'Anthropic',
            'Anthropic AI - Creators of Claude',
            'https://www.anthropic.com',
            true
        )
    """)

    # Insert Claude models
    op.execute("""
        INSERT INTO llm_model (id, provider_id, name, model_id, display_name, input_token_price, output_token_price, max_tokens, is_active)
        SELECT
            gen_random_uuid(),
            p.id,
            'claude-sonnet-4.5',
            'claude-sonnet-4-5-20250929',
            'Claude Sonnet 4.5',
            3.00,
            15.00,
            8192,
            true
        FROM llm_provider p WHERE p.name = 'anthropic'
    """)

    op.execute("""
        INSERT INTO llm_model (id, provider_id, name, model_id, display_name, input_token_price, output_token_price, max_tokens, is_active)
        SELECT
            gen_random_uuid(),
            p.id,
            'claude-opus-4.6',
            'claude-opus-4-6',
            'Claude Opus 4.6',
            15.00,
            75.00,
            8192,
            true
        FROM llm_provider p WHERE p.name = 'anthropic'
    """)

    op.execute("""
        INSERT INTO llm_model (id, provider_id, name, model_id, display_name, input_token_price, output_token_price, max_tokens, is_active)
        SELECT
            gen_random_uuid(),
            p.id,
            'claude-haiku-4.5',
            'claude-haiku-4-5-20251001',
            'Claude Haiku 4.5',
            0.80,
            4.00,
            8192,
            true
        FROM llm_provider p WHERE p.name = 'anthropic'
    """)


def downgrade():
    # Drop tables in reverse order due to foreign key constraints
    op.drop_table('llm_usage_log')
    op.drop_table('llm_message')
    op.drop_table('conversation')
    op.drop_table('llm_model')
    op.drop_table('llm_provider')
