import pytest
from unittest.mock import Mock, patch, AsyncMock
from datetime import datetime

from app.services.predictor import PredictorService
from app.models.response import DirectionEnum

@pytest.mark.asyncio
async def test_predictor_service(mock_polygon_service, mock_openai_service, sample_stock_data, sample_options_chain):
    """Test predictor service prediction generation"""
    # Setup mocks
    mock_polygon_service.get_current_price.return_value = sample_stock_data
    mock_polygon_service.get_options_chain.return_value = sample_options_chain
    
    mock_openai_service.complete.return_value = {
        "content": {
            "direction": "bullish",
            "price_target": 155.0,
            "confidence": 7,
            "reasoning": ["Strong call volume", "Positive momentum"],
            "risk_factors": ["Market volatility", "Earnings uncertainty"]
        },
        "usage": {"total_tokens": 500}
    }
    
    # Create service with mocked dependencies
    predictor = PredictorService()
    predictor.polygon_service = mock_polygon_service
    predictor.openai_service = mock_openai_service
    
    # Test prediction
    result = await predictor.predict("AAPL", "1d", include_reasoning=True)
    
    assert result.ticker == "AAPL"
    assert result.direction == DirectionEnum.BULLISH
    assert result.price_target == 155.0
    assert result.confidence == 7
    assert len(result.reasoning) == 2
    assert len(result.risk_factors) == 2

@pytest.mark.asyncio
async def test_predictor_batch_predict(mock_polygon_service, mock_openai_service, sample_stock_data, sample_options_chain):
    """Test batch prediction functionality"""
    # Setup mocks
    mock_polygon_service.get_current_price.return_value = sample_stock_data
    mock_polygon_service.get_options_chain.return_value = sample_options_chain
    
    mock_openai_service.complete.return_value = {
        "content": {
            "direction": "neutral",
            "price_target": 150.0,
            "confidence": 5,
            "reasoning": ["Mixed signals"],
            "risk_factors": ["Uncertain market"]
        },
        "usage": {"total_tokens": 400}
    }
    
    predictor = PredictorService()
    predictor.polygon_service = mock_polygon_service
    predictor.openai_service = mock_openai_service
    
    # Test batch prediction
    results = await predictor.batch_predict(["AAPL", "GOOGL", "MSFT"], "1w")
    
    assert len(results) == 3
    assert all(r.timeframe == "1w" for r in results)
    assert mock_polygon_service.get_current_price.call_count == 3
    assert mock_openai_service.complete.call_count == 3

def test_calculate_options_metrics():
    """Test options metrics calculation"""
    from app.models.domain import OptionsChain, Option, OptionType
    from datetime import date
    
    predictor = PredictorService()
    
    options_chain = OptionsChain(
        ticker="TEST",
        underlying_price=100.0,
        timestamp=datetime.now(),
        calls=[
            Option(
                strike=105.0,
                expiration=date.today(),
                option_type=OptionType.CALL,
                bid=1.0,
                ask=1.1,
                last=1.05,
                volume=200,
                open_interest=1000,
                implied_volatility=0.20
            )
        ],
        puts=[
            Option(
                strike=95.0,
                expiration=date.today(),
                option_type=OptionType.PUT,
                bid=0.9,
                ask=1.0,
                last=0.95,
                volume=300,
                open_interest=1500,
                implied_volatility=0.25
            )
        ]
    )
    
    metrics = predictor._calculate_options_metrics(options_chain)
    
    assert metrics["put_call_ratio"] == 1.5  # 300/200
    assert metrics["total_volume"] == 500
    assert metrics["open_interest"] == 2500