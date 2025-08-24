import pytest
from fastapi.testclient import TestClient
from unittest.mock import Mock, AsyncMock
import os

# Set test environment
os.environ["POLYGON_API_KEY"] = "test_polygon_key"
os.environ["OPENAI_API_KEY"] = "test_openai_key"

from app.main import app
from app.config import Settings, get_settings
from app.services.polygon_service import PolygonService
from app.services.openai_service import OpenAIService

@pytest.fixture
def test_settings():
    """Override settings for testing"""
    test_settings = Settings(
        polygon_api_key="test_polygon_key",
        openai_api_key="test_openai_key",
        debug=True
    )
    return test_settings

@pytest.fixture
def client(test_settings):
    """Create test client"""
    app.dependency_overrides[get_settings] = lambda: test_settings
    with TestClient(app) as client:
        yield client
    app.dependency_overrides.clear()

@pytest.fixture
def mock_polygon_service():
    """Mock Polygon service"""
    mock = Mock(spec=PolygonService)
    mock.get_current_price = AsyncMock()
    mock.get_options_chain = AsyncMock()
    mock.get_options_activity = AsyncMock()
    return mock

@pytest.fixture
def mock_openai_service():
    """Mock OpenAI service"""
    mock = Mock(spec=OpenAIService)
    mock.complete = AsyncMock()
    mock.stream_complete = AsyncMock()
    return mock

@pytest.fixture
def sample_stock_data():
    """Sample stock data for testing"""
    from app.models.domain import StockData
    from datetime import datetime
    
    return StockData(
        ticker="AAPL",
        price=150.0,
        volume=1000000,
        day_change=2.5,
        day_change_percent=1.69,
        high=152.0,
        low=148.0,
        open=149.0,
        previous_close=147.5,
        timestamp=datetime.now()
    )

@pytest.fixture
def sample_options_chain():
    """Sample options chain for testing"""
    from app.models.domain import OptionsChain, Option, OptionType
    from datetime import datetime, date
    
    return OptionsChain(
        ticker="AAPL",
        underlying_price=150.0,
        timestamp=datetime.now(),
        calls=[
            Option(
                strike=155.0,
                expiration=date.today(),
                option_type=OptionType.CALL,
                bid=2.5,
                ask=2.6,
                last=2.55,
                volume=100,
                open_interest=500,
                implied_volatility=0.25
            )
        ],
        puts=[
            Option(
                strike=145.0,
                expiration=date.today(),
                option_type=OptionType.PUT,
                bid=1.5,
                ask=1.6,
                last=1.55,
                volume=150,
                open_interest=600,
                implied_volatility=0.30
            )
        ]
    )