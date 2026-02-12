"""Seed OpenAI and Google models

Revision ID: 7b8c9d1e2f3a
Revises: 6a7b8c9d1e2f
Create Date: 2026-02-12 04:30:00.000000

"""
from alembic import op
import sqlalchemy as sa
import uuid


# revision identifiers, used by Alembic.
revision = '7b8c9d1e2f3a'
down_revision = '6a7b8c9d1e2f'
branch_labels = None
depends_on = None


def upgrade():
    # Insert OpenAI provider (only if not exists)
    op.execute(f"""
        INSERT INTO llm_provider (id, name, display_name, description, website_url, is_active)
        SELECT '{uuid.uuid4()}', 'openai', 'OpenAI', 'OpenAI - Creators of GPT models', 'https://openai.com', true
        WHERE NOT EXISTS (SELECT 1 FROM llm_provider WHERE name = 'openai')
    """)

    # Insert Google provider (only if not exists)
    op.execute(f"""
        INSERT INTO llm_provider (id, name, display_name, description, website_url, is_active)
        SELECT '{uuid.uuid4()}', 'google', 'Google', 'Google AI - Creators of Gemini', 'https://ai.google.dev', true
        WHERE NOT EXISTS (SELECT 1 FROM llm_provider WHERE name = 'google')
    """)

    # Insert OpenAI models
    # GPT-4o
    op.execute(f"""
        INSERT INTO llm_model (id, provider_id, name, model_id, display_name, input_token_price, output_token_price, max_tokens, is_active)
        SELECT
            '{uuid.uuid4()}',
            p.id,
            'gpt-4o',
            'gpt-4o',
            'GPT-4o',
            2.50,
            10.00,
            128000,
            true
        FROM llm_provider p
        WHERE p.name = 'openai'
        AND NOT EXISTS (SELECT 1 FROM llm_model WHERE model_id = 'gpt-4o')
    """)

    # GPT-4o-mini
    op.execute(f"""
        INSERT INTO llm_model (id, provider_id, name, model_id, display_name, input_token_price, output_token_price, max_tokens, is_active)
        SELECT
            '{uuid.uuid4()}',
            p.id,
            'gpt-4o-mini',
            'gpt-4o-mini',
            'GPT-4o Mini',
            0.15,
            0.60,
            128000,
            true
        FROM llm_provider p
        WHERE p.name = 'openai'
        AND NOT EXISTS (SELECT 1 FROM llm_model WHERE model_id = 'gpt-4o-mini')
    """)

    # GPT-4 Turbo
    op.execute(f"""
        INSERT INTO llm_model (id, provider_id, name, model_id, display_name, input_token_price, output_token_price, max_tokens, is_active)
        SELECT
            '{uuid.uuid4()}',
            p.id,
            'gpt-4-turbo',
            'gpt-4-turbo-2024-04-09',
            'GPT-4 Turbo',
            10.00,
            30.00,
            128000,
            true
        FROM llm_provider p
        WHERE p.name = 'openai'
        AND NOT EXISTS (SELECT 1 FROM llm_model WHERE model_id = 'gpt-4-turbo-2024-04-09')
    """)

    # o1-preview
    op.execute(f"""
        INSERT INTO llm_model (id, provider_id, name, model_id, display_name, input_token_price, output_token_price, max_tokens, is_active)
        SELECT
            '{uuid.uuid4()}',
            p.id,
            'o1-preview',
            'o1-preview',
            'O1 Preview',
            15.00,
            60.00,
            128000,
            true
        FROM llm_provider p
        WHERE p.name = 'openai'
        AND NOT EXISTS (SELECT 1 FROM llm_model WHERE model_id = 'o1-preview')
    """)

    # o1-mini
    op.execute(f"""
        INSERT INTO llm_model (id, provider_id, name, model_id, display_name, input_token_price, output_token_price, max_tokens, is_active)
        SELECT
            '{uuid.uuid4()}',
            p.id,
            'o1-mini',
            'o1-mini',
            'O1 Mini',
            3.00,
            12.00,
            128000,
            true
        FROM llm_provider p
        WHERE p.name = 'openai'
        AND NOT EXISTS (SELECT 1 FROM llm_model WHERE model_id = 'o1-mini')
    """)

    # Insert Google Gemini models
    # Gemini 2.0 Flash
    op.execute(f"""
        INSERT INTO llm_model (id, provider_id, name, model_id, display_name, input_token_price, output_token_price, max_tokens, is_active)
        SELECT
            '{uuid.uuid4()}',
            p.id,
            'gemini-2.0-flash',
            'gemini-2.0-flash-exp',
            'Gemini 2.0 Flash',
            0.00,
            0.00,
            1048576,
            true
        FROM llm_provider p
        WHERE p.name = 'google'
        AND NOT EXISTS (SELECT 1 FROM llm_model WHERE model_id = 'gemini-2.0-flash-exp')
    """)

    # Gemini 1.5 Pro
    op.execute(f"""
        INSERT INTO llm_model (id, provider_id, name, model_id, display_name, input_token_price, output_token_price, max_tokens, is_active)
        SELECT
            '{uuid.uuid4()}',
            p.id,
            'gemini-1.5-pro',
            'gemini-1.5-pro',
            'Gemini 1.5 Pro',
            1.25,
            5.00,
            2097152,
            true
        FROM llm_provider p
        WHERE p.name = 'google'
        AND NOT EXISTS (SELECT 1 FROM llm_model WHERE model_id = 'gemini-1.5-pro')
    """)

    # Gemini 1.5 Flash
    op.execute(f"""
        INSERT INTO llm_model (id, provider_id, name, model_id, display_name, input_token_price, output_token_price, max_tokens, is_active)
        SELECT
            '{uuid.uuid4()}',
            p.id,
            'gemini-1.5-flash',
            'gemini-1.5-flash',
            'Gemini 1.5 Flash',
            0.075,
            0.30,
            1048576,
            true
        FROM llm_provider p
        WHERE p.name = 'google'
        AND NOT EXISTS (SELECT 1 FROM llm_model WHERE model_id = 'gemini-1.5-flash')
    """)


def downgrade():
    # Remove Google models
    op.execute("""
        DELETE FROM llm_model
        WHERE provider_id IN (
            SELECT id FROM llm_provider WHERE name = 'google'
        )
    """)

    # Remove OpenAI models
    op.execute("""
        DELETE FROM llm_model
        WHERE provider_id IN (
            SELECT id FROM llm_provider WHERE name = 'openai'
        )
    """)

    # Remove Google provider
    op.execute("DELETE FROM llm_provider WHERE name = 'google'")

    # Remove OpenAI provider
    op.execute("DELETE FROM llm_provider WHERE name = 'openai'")
