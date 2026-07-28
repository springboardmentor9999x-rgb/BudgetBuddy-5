from sqlalchemy import create_engine
from dotenv import load_dotenv
import os

load_dotenv()

DATABASE_URL = os.getenv("postgresql://postgres:Nisarga0505@localhost:5432/budgetbuddy")

engine = create_engine(DATABASE_URL)

try:
    connection = engine.connect()
    print("Connected to PostgreSQL Successfully!")
    connection.close()
except Exception as e:
    print("Connection Failed")
    print(e)