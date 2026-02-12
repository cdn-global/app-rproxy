"""Cleanup duplicate Gemini 2.0 Flash entries and fix zero pricing

The migration seeded gemini-2.0-flash-exp while the app seeder created
gemini-2.0-flash, resulting in duplicates. This migration consolidates
them into a single gemini-2.0-flash entry with correct pricing.

Revision ID: a2b3c4d5e6f7
Revises: 7beecfbb883d
Create Date: 2026-02-12 12:00:00.000000

"""
from alembic import op


# revision identifiers, used by Alembic.
revision = 'a2b3c4d5e6f7'
down_revision = '7beecfbb883d'
branch_labels = None
depends_on = None


def upgrade():
    # 1. Reassign any usage logs from gemini-2.0-flash-exp to gemini-2.0-flash
    #    (only if gemini-2.0-flash exists; otherwise rename the exp entry)
    op.execute("""
        UPDATE llm_usage_log
        SET model_id = (SELECT id FROM llm_model WHERE model_id = 'gemini-2.0-flash' LIMIT 1)
        WHERE model_id = (SELECT id FROM llm_model WHERE model_id = 'gemini-2.0-flash-exp' LIMIT 1)
        AND EXISTS (SELECT 1 FROM llm_model WHERE model_id = 'gemini-2.0-flash')
        AND EXISTS (SELECT 1 FROM llm_model WHERE model_id = 'gemini-2.0-flash-exp')
    """)

    # 2. Reassign any messages from gemini-2.0-flash-exp to gemini-2.0-flash
    op.execute("""
        UPDATE llm_message
        SET model_id = (SELECT id FROM llm_model WHERE model_id = 'gemini-2.0-flash' LIMIT 1)
        WHERE model_id = (SELECT id FROM llm_model WHERE model_id = 'gemini-2.0-flash-exp' LIMIT 1)
        AND EXISTS (SELECT 1 FROM llm_model WHERE model_id = 'gemini-2.0-flash')
        AND EXISTS (SELECT 1 FROM llm_model WHERE model_id = 'gemini-2.0-flash-exp')
    """)

    # 3. Delete the duplicate gemini-2.0-flash-exp entry (only if gemini-2.0-flash exists)
    op.execute("""
        DELETE FROM llm_model
        WHERE model_id = 'gemini-2.0-flash-exp'
        AND EXISTS (SELECT 1 FROM llm_model WHERE model_id = 'gemini-2.0-flash')
    """)

    # 4. If only gemini-2.0-flash-exp exists (no duplicate), rename it
    op.execute("""
        UPDATE llm_model
        SET model_id = 'gemini-2.0-flash', name = 'gemini-2.0-flash'
        WHERE model_id = 'gemini-2.0-flash-exp'
    """)

    # 5. Fix zero pricing on gemini-2.0-flash (25% markup: $0.10/$0.40 -> $0.125/$0.50)
    op.execute("""
        UPDATE llm_model
        SET input_token_price = 0.125, output_token_price = 0.50
        WHERE model_id = 'gemini-2.0-flash'
        AND (input_token_price = 0.00 OR output_token_price = 0.00)
    """)


def downgrade():
    # No-op: we don't want to re-create duplicates
    pass
