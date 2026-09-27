from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "ApexIQ Performance Platform"
    API_V1_PREFIX: str = "/api"
    ENVIRONMENT: str = "development"
    DEBUG: bool = False
    LOG_LEVEL: str = "INFO"

    API_HOST: str = "0.0.0.0"
    API_PORT: int = 8000

    CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://localhost:80",
    ]

    # Database
    DATABASE_URL: str = (
        "postgresql://apexiq_user:apexiq_secure_pass@localhost:5432/apexiq_telemetry"
    )

    # Telemetry downsampling defaults
    DEFAULT_DOWNSAMPLE_POINTS: int = 2500
    MAX_RAW_TELEMETRY_POINTS: int = 500000

    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", case_sensitive=True, extra="ignore"
    )


settings = Settings()
