"""Add ON DELETE CASCADE to user foreign keys

Ensures deleting a user cascades to all rows that reference user.id, so
DELETE /users/{user_id} no longer fails with a foreign key violation.

Revision ID: c1d2e3f4a5b6
Revises: b0c1d2e3f4a5
Create Date: 2026-07-02 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "c1d2e3f4a5b6"
down_revision = "b0c1d2e3f4a5"
branch_labels = None
depends_on = None

# Tables whose user_id FK should cascade when a user is deleted.
# "apitoken" is a legacy table (no matching model) guarded by the table check.
_USER_FKS = [
    "usage_record",
    "remote_server",
    "provisioning_job",
    "database_instance",
    "model_usage",
    "storage_bucket",
    "storage_object",
    "llm_usage_log",
    "user_api_key",  # already CASCADE in DB; kept for idempotency/consistency
    "apitoken",
]


def _user_fk(inspector, table, column="user_id"):
    for fk in inspector.get_foreign_keys(table):
        if fk.get("referred_table") == "user" and column in fk.get("constrained_columns", []):
            return fk
    return None


def upgrade():
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    existing = set(inspector.get_table_names())
    for table in _USER_FKS:
        if table not in existing:
            continue
        fk = _user_fk(inspector, table)
        if fk is None:
            continue
        # Already CASCADE? Nothing to do.
        if (fk.get("options") or {}).get("ondelete", "").upper() == "CASCADE":
            continue
        if fk.get("name"):
            op.drop_constraint(fk["name"], table, type_="foreignkey")
        op.create_foreign_key(
            f"{table}_user_id_fkey", table, "user", ["user_id"], ["id"], ondelete="CASCADE"
        )


def downgrade():
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    existing = set(inspector.get_table_names())
    for table in _USER_FKS:
        if table not in existing:
            continue
        fk = _user_fk(inspector, table)
        if fk and fk.get("name"):
            op.drop_constraint(fk["name"], table, type_="foreignkey")
        op.create_foreign_key(
            f"{table}_user_id_fkey", table, "user", ["user_id"], ["id"]
        )
