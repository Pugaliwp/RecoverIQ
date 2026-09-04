import os
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseSettings):
    PROJECT_NAME: str = "RecoverIQ API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql+psycopg2://postgres:postgres@localhost:5432/recoveriq")
    
    # CORS setup
    BACKEND_CORS_ORIGINS: list[str] = ["http://localhost:5173", "http://localhost:5174", "http://localhost:3000"]

    class Config:
        case_sensitive = True

settings = Settings()
