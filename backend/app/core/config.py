import os
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    # Application Info
    PROJECT_NAME: str = "JC Business"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"

    # Database Settings
    POSTGRES_USER: str = os.getenv("POSTGRES_USER", "admin")
    POSTGRES_PASSWORD: str = os.getenv("POSTGRES_PASSWORD", "admin")
    POSTGRES_HOST: str = os.getenv("POSTGRES_HOST", "localhost")
    POSTGRES_PORT: str = os.getenv("POSTGRES_PORT", "5432")
    POSTGRES_DB: str = os.getenv("POSTGRES_DB", "jcbusiness")
    
    @property
    def SQLALCHEMY_DATABASE_URI(self) -> str:
        return f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"

    # Redis
    REDIS_HOST: str = os.getenv("REDIS_HOST", "localhost")
    REDIS_PORT: int = int(os.getenv("REDIS_PORT", "6379"))
    REDIS_DB: int = int(os.getenv("REDIS_DB", "1"))

    # Evolution API
    EVOLUTION_API_URL: str = os.getenv("EVOLUTION_API_URL", "http://localhost:8081")
    EVOLUTION_API_KEY: str = os.getenv("EVOLUTION_API_KEY", "")
    EVOLUTION_API_INSTANCE: str = os.getenv("EVOLUTION_API_INSTANCE", "jc_business_instance")
    
    # OpenAI / Gemini
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")

    # External Agent VM (OpenClaw)
    AGENT_API_URL: str = os.getenv("AGENT_API_URL", "http://127.0.0.1:18789")
    AGENT_API_TOKEN: str = os.getenv("AGENT_API_TOKEN", "177bdb65bab963b4da14fedba8c8839a4568ff773bf7681c")

    # Auth JWT
    JWT_SECRET: str = os.getenv("JWT_SECRET", "super-secret-key-change-me")
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION: int = 60 * 24 * 7 # 7 days
    
    # Superadmin
    SUPERADMIN_EMAIL: str = os.getenv("SUPERADMIN_EMAIL", "joaov.cardozo@hotmail.com")

    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True, extra="allow")

settings = Settings()
