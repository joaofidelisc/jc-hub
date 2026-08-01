from sqlalchemy import text


def apply_schema_migrations(engine):
    """Apply small idempotent schema fixes for existing deployments."""
    with engine.begin() as conn:
        conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS creator_settings JSON"))
