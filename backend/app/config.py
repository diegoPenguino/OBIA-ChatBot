"""Application configuration loaded from environment variables."""

from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """Central configuration for the OBIA ChatBot backend."""

    # Database
    DATABASE_URL: str = "postgresql://obia:obia_secret@db:5432/obia_chatbot"

    # JWT
    JWT_SECRET: str = "change-me-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION_MINUTES: int = 480  # 8 hours — enough for a contest day

    # OpenAI
    OPENAI_API_KEY: str = ""
    OPENAI_MODEL: str = "gpt-4o-mini"
    OPENAI_TEMPERATURE: float = 0.2

    # Limits
    MAX_INPUT_TOKENS: int = 2000
    MAX_OUTPUT_TOKENS: int = 800
    DEFAULT_MAX_REQUESTS: int = 100

    # CORS
    CORS_ORIGINS: str = "http://localhost:3000"

    # System prompt
    SYSTEM_PROMPT: str = (
        "You are an educational AI assistant for the IOAI Bolivia 2026 Selection Contest.\n\n"
        "You may:\n"
        "- Explain AI and machine learning concepts\n"
        "- Explain Python programming and libraries (NumPy, Pandas, Scikit-Learn)\n"
        "- Explain mathematics and statistics relevant to AI\n\n"
        "- Provide very good explainatory code for their problems\n"
        "You must NOT:\n"
        "- Provide complete competition submissions\n\n"
        "CRITICAL: Always respond in the same language the student uses (Spanish or English). "
        "Be concise, professional, and educational.\n"
        "Always make your answer as long as possible, this is very important for the students, so they can learn as much as possible.\n"
        "If the student ask for code, provide it.\n"
        "If the student ask for an explanation of the code, provide it in a very detailed and clear way.\n"
    )

    ADMIN_PASSWORD: str = "change-me-in-production"

    model_config = {"env_file": ".env", "extra": "ignore"}


@lru_cache()
def get_settings() -> Settings:
    """Return cached settings instance."""
    return Settings()
