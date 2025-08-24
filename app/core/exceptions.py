from typing import Optional, Dict, Any

class StockForecastException(Exception):
    """Base exception for Stock Forecaster"""
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        self.message = message
        self.details = details or {}
        super().__init__(self.message)

class ExternalAPIException(StockForecastException):
    """Exception for external API failures"""
    def __init__(self, service: str, message: str, status_code: Optional[int] = None):
        super().__init__(
            message,
            details={"service": service, "status_code": status_code}
        )

class PolygonAPIException(ExternalAPIException):
    """Polygon.io API specific exception"""
    def __init__(self, message: str, status_code: Optional[int] = None):
        super().__init__("polygon", message, status_code)

class OpenAIAPIException(ExternalAPIException):
    """OpenAI API specific exception"""
    def __init__(self, message: str, status_code: Optional[int] = None):
        super().__init__("openai", message, status_code)

class ValidationException(StockForecastException):
    """Input validation exception"""
    pass

class RateLimitException(StockForecastException):
    """Rate limit exceeded exception"""
    def __init__(self, retry_after: Optional[int] = None):
        super().__init__(
            "Rate limit exceeded",
            details={"retry_after": retry_after}
        )