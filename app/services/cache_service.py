import json
from typing import Optional, Any
from datetime import timedelta
import logging

from app.config import get_settings

settings = get_settings()
logger = logging.getLogger(__name__)

class CacheService:
    """Cache service with optional Redis support"""
    
    def __init__(self):
        self.redis_client = None
        self.in_memory_cache = {}
        
        if settings.redis_url:
            try:
                import redis
                self.redis_client = redis.from_url(settings.redis_url)
                self.redis_client.ping()
                logger.info("Redis cache initialized")
            except Exception as e:
                logger.warning(f"Redis not available, using in-memory cache: {e}")
    
    async def get(self, key: str) -> Optional[Any]:
        """Get value from cache"""
        if self.redis_client:
            try:
                value = self.redis_client.get(key)
                if value:
                    return json.loads(value)
            except Exception as e:
                logger.error(f"Cache get error: {e}")
        else:
            return self.in_memory_cache.get(key)
        
        return None
    
    async def set(self, key: str, value: Any, ttl: Optional[int] = None):
        """Set value in cache with optional TTL"""
        ttl = ttl or settings.cache_ttl
        
        if self.redis_client:
            try:
                self.redis_client.setex(
                    key,
                    timedelta(seconds=ttl),
                    json.dumps(value)
                )
            except Exception as e:
                logger.error(f"Cache set error: {e}")
        else:
            self.in_memory_cache[key] = value
    
    async def delete(self, key: str):
        """Delete key from cache"""
        if self.redis_client:
            try:
                self.redis_client.delete(key)
            except Exception as e:
                logger.error(f"Cache delete error: {e}")
        else:
            self.in_memory_cache.pop(key, None)
    
    def make_key(self, prefix: str, *args) -> str:
        """Create cache key from prefix and arguments"""
        parts = [prefix] + [str(arg) for arg in args]
        return ":".join(parts)