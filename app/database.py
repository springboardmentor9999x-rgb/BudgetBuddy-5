import os

from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL not found in .env")

engine = create_engine(DATABASE_URL)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

Base = declarative_base()


def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()


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

        table_result = connection.execute(
            text("""
                SELECT table_schema, table_name
                FROM information_schema.tables
                WHERE table_name = 'savings_transactions'
            """)
        ).fetchall()

        print("\nsavings_transactions found:")
        print(table_result)
        print("=" * 60 + "\n")

except Exception as e:
    print("Connection Failed")
    print(e)