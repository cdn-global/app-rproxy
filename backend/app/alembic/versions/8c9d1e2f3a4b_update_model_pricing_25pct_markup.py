"""Update model pricing to match providers with 25% markup

Revision ID: 8c9d1e2f3a4b
Revises: 7b8c9d1e2f3a
Create Date: 2026-02-12 06:00:00.000000

"""
from alembic import op


# revision identifiers, used by Alembic.
revision = '8c9d1e2f3a4b'
down_revision = '7b8c9d1e2f3a'
branch_labels = None
depends_on = None


def upgrade():
    # All prices are per 1M tokens = actual provider price * 1.25

    # --- Anthropic ---
    # Claude Sonnet 4.5: $3.00/$15.00 -> $3.75/$18.75
    op.execute("""
        UPDATE llm_model SET input_token_price = 3.75, output_token_price = 18.75
        WHERE model_id = 'claude-sonnet-4-5-20250929'
    """)

    # Claude Opus 4.6: $15.00/$75.00 -> $18.75/$93.75
    op.execute("""
        UPDATE llm_model SET input_token_price = 18.75, output_token_price = 93.75
        WHERE model_id = 'claude-opus-4-6'
    """)

    # Claude Haiku 4.5: $0.80/$4.00 -> $1.00/$5.00
    op.execute("""
        UPDATE llm_model SET input_token_price = 1.00, output_token_price = 5.00
        WHERE model_id = 'claude-haiku-4-5-20251001'
    """)

    # --- OpenAI ---
    # GPT-4o: $2.50/$10.00 -> $3.125/$12.50
    op.execute("""
        UPDATE llm_model SET input_token_price = 3.125, output_token_price = 12.50
        WHERE model_id = 'gpt-4o'
    """)

    # GPT-4o Mini: $0.15/$0.60 -> $0.1875/$0.75
    op.execute("""
        UPDATE llm_model SET input_token_price = 0.1875, output_token_price = 0.75
        WHERE model_id = 'gpt-4o-mini'
    """)

    # GPT-4 Turbo: $10.00/$30.00 -> $12.50/$37.50
    op.execute("""
        UPDATE llm_model SET input_token_price = 12.50, output_token_price = 37.50
        WHERE model_id = 'gpt-4-turbo-2024-04-09'
    """)

    # o1-preview: $15.00/$60.00 -> $18.75/$75.00
    op.execute("""
        UPDATE llm_model SET input_token_price = 18.75, output_token_price = 75.00
        WHERE model_id = 'o1-preview'
    """)

    # o1-mini: $3.00/$12.00 -> $3.75/$15.00
    op.execute("""
        UPDATE llm_model SET input_token_price = 3.75, output_token_price = 15.00
        WHERE model_id = 'o1-mini'
    """)

    # --- Google ---
    # Gemini 2.0 Flash: $0.10/$0.40 -> $0.125/$0.50
    op.execute("""
        UPDATE llm_model SET input_token_price = 0.125, output_token_price = 0.50
        WHERE model_id = 'gemini-2.0-flash-exp'
    """)

    # Gemini 1.5 Pro: $1.25/$5.00 -> $1.5625/$6.25
    op.execute("""
        UPDATE llm_model SET input_token_price = 1.5625, output_token_price = 6.25
        WHERE model_id = 'gemini-1.5-pro'
    """)

    # Gemini 1.5 Flash: $0.075/$0.30 -> $0.09375/$0.375
    op.execute("""
        UPDATE llm_model SET input_token_price = 0.09375, output_token_price = 0.375
        WHERE model_id = 'gemini-1.5-flash'
    """)


def downgrade():
    # Revert to original provider pricing (no markup)

    # Anthropic
    op.execute("UPDATE llm_model SET input_token_price = 3.00, output_token_price = 15.00 WHERE model_id = 'claude-sonnet-4-5-20250929'")
    op.execute("UPDATE llm_model SET input_token_price = 15.00, output_token_price = 75.00 WHERE model_id = 'claude-opus-4-6'")
    op.execute("UPDATE llm_model SET input_token_price = 0.80, output_token_price = 4.00 WHERE model_id = 'claude-haiku-4-5-20251001'")

    # OpenAI
    op.execute("UPDATE llm_model SET input_token_price = 2.50, output_token_price = 10.00 WHERE model_id = 'gpt-4o'")
    op.execute("UPDATE llm_model SET input_token_price = 0.15, output_token_price = 0.60 WHERE model_id = 'gpt-4o-mini'")
    op.execute("UPDATE llm_model SET input_token_price = 10.00, output_token_price = 30.00 WHERE model_id = 'gpt-4-turbo-2024-04-09'")
    op.execute("UPDATE llm_model SET input_token_price = 15.00, output_token_price = 60.00 WHERE model_id = 'o1-preview'")
    op.execute("UPDATE llm_model SET input_token_price = 3.00, output_token_price = 12.00 WHERE model_id = 'o1-mini'")

    # Google
    op.execute("UPDATE llm_model SET input_token_price = 0.00, output_token_price = 0.00 WHERE model_id = 'gemini-2.0-flash-exp'")
    op.execute("UPDATE llm_model SET input_token_price = 1.25, output_token_price = 5.00 WHERE model_id = 'gemini-1.5-pro'")
    op.execute("UPDATE llm_model SET input_token_price = 0.075, output_token_price = 0.30 WHERE model_id = 'gemini-1.5-flash'")
