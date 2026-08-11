"""Creates every table straight from the SQLAlchemy models.

A shortcut while the schema is still moving: it can only ever create, never
alter. The moment there is data worth keeping, switch to Alembic (already
installed) — `create_all()` silently ignores a column added to a model whose
table already exists, so the code and the database drift apart without an error.

Usage: python -m scripts.init_db
"""

from sqlalchemy import text

import app.models  # noqa: F401 — importing registers every table on Base.metadata
from app.database import Base, engine

if __name__ == "__main__":
    with engine.begin() as connection:
        # The UUID primary keys default to uuid_generate_v4(), which lives in
        # this extension — creating tables before it exists fails.
        connection.execute(text('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"'))

    Base.metadata.create_all(bind=engine)
    print(f"Created/verified {len(Base.metadata.tables)} tables:")
    for table_name in sorted(Base.metadata.tables):
        print(f"  - {table_name}")
