from sqlalchemy import text
from app.database import engine

with engine.connect() as connection:

    result = connection.execute(
        text("""
            SELECT
                column_name,
                data_type
            FROM information_schema.columns
            WHERE table_name = 'savings_goals'
            ORDER BY ordinal_position
        """)
    ).fetchall()

    print("\nSavings Goals Columns:")
    print("=" * 50)

    for row in result:
        print(row)

    print("=" * 50)