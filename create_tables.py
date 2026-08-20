from app.database import Base, engine

# IMPORTANT: Import models before create_all()
import app.models

Base.metadata.create_all(bind=engine)

print("Tables checked/created successfully!")