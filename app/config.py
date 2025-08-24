from pydantic_settings import BaseSettings
from functools import lru_cache
from typing import Optional

class Settings(BaseSettings):
    # API Keys
    polygon_api_key: str
    openai_api_key: str
    
    # API Configuration
    api_v1_prefix: str = "/api/v1"
    project_name: str = "Stock Forecaster"
    version: str = "1.0.0"
    debug: bool = False
    
    # External APIs
    polygon_base_url: str = "https://api.polygon.io"
    openai_model: str = "gpt-4-turbo-preview"
    openai_max_tokens: int = 2000
    openai_temperature: float = 0.3
    
    # Redis (optional)
    redis_url: Optional[str] = None
    cache_ttl: int = 3600  # 1 hour
    
    # Rate Limiting
    rate_limit_requests: int = 100
    rate_limit_period: int = 3600
    
    # Security
    api_key_header: str = "X-API-Key"
    cors_origins: list = ["http://localhost:3000"]
    
    class Config:
        env_file = ".env"
        case_sensitive = False

@lru_cache()
def get_settings():
    return Settings()