from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from app.core.config import settings
from app.core.database import engine, Base
from app.api.v1.api import api_router
from app.models import *  # Ensure all models are registered
from seed import seed_database

# Create database tables and automatically seed demo data
Base.metadata.create_all(bind=engine)
try:
    seed_database()
except Exception as e:
    print(f"Startup database seeding note: {e}")

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="BudgetBuddy: A Personal Budget Planning & Expense Management Platform REST API",
    version="1.0.0",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"https://.*|http://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/")
def root():
    return {
        "message": "Welcome to BudgetBuddy API",
        "docs": "/docs",
        "version": "1.0.0",
        "status": "online"
    }

@app.get("/health")
def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
