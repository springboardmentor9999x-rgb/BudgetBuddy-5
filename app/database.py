import os
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker


# ============================================================
# PROJECT ROOT
# ============================================================

BASE_DIR = Path(__file__).resolve().parent.parent


# ============================================================
# LOAD .ENV
# ============================================================

ENV_FILE = BASE_DIR / ".env"

load_dotenv(ENV_FILE)


# ============================================================
# DATABASE URL
# ============================================================

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise RuntimeError(
        f"DATABASE_URL not found.\n"
        f"Expected .env file at: {ENV_FILE}"
    )


# ============================================================
# DATABASE ENGINE
# ============================================================

engine = create_engine(
    DATABASE_URL
)


# ============================================================
# DATABASE SESSION
# ============================================================

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)


# ============================================================
# BASE
# ============================================================

Base = declarative_base()


# ============================================================
# DATABASE DEPENDENCY
# ============================================================

def get_db():

    db = SessionLocal()

    try:
        yield db

    finally:
        db.close()


# ============================================================
# DATABASE CONNECTION CHECK
# ============================================================

try:

    with engine.connect() as connection:

        result = connection.execute(
            text("""
                SELECT
                    current_database(),
                    current_schema(),
                    inet_server_addr(),
                    inet_server_port()
            """)
        ).fetchone()

        print("\n" + "=" * 60)
        print("DATABASE CONNECTION DETAILS")
        print("=" * 60)

        print("Database:", result[0])
        print("Schema:", result[1])
        print("Server IP:", result[2])
        print("Server Port:", result[3])

        # ----------------------------------------------------
        # CHECK SAVINGS TRANSACTIONS TABLE
        # ----------------------------------------------------

        table_result = connection.execute(
            text("""
                SELECT
                    table_schema,
                    table_name
                FROM information_schema.tables
                WHERE table_name = 'savings_transactions'
            """)
        ).fetchall()

        print("\nsavings_transactions found:")
        print(table_result)

        # ----------------------------------------------------
        # CHECK NEW BANK ACCOUNT COLUMNS
        # ----------------------------------------------------

        print("\nChecking bank_account_id columns:")

        column_result = connection.execute(
            text("""
                SELECT
                    table_name,
                    column_name
                FROM information_schema.columns
                WHERE table_name IN (
                    'budgets',
                    'savings_goals',
                    'savings_transactions'
                )
                AND column_name = 'bank_account_id'
                ORDER BY table_name
            """)
        ).fetchall()

        print(column_result)

        print("=" * 60 + "\n")


except Exception as e:

    print("\nConnection Failed")
    print(e)