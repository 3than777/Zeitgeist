import pytest
from datetime import datetime

from app.models.request import PredictionRequest, BatchPredictionRequest
from app.models.response import PredictionResponse, DirectionEnum
from app.models.domain import Option, OptionType, OptionsChain

def test_prediction_request_validation():
    """Test prediction request validation"""
    # Valid request
    request = PredictionRequest(ticker="AAPL", timeframe="1d")
    assert request.ticker == "AAPL"
    assert request.timeframe == "1d"
    assert request.include_reasoning is True
    
    # Ticker normalization
    request = PredictionRequest(ticker=" aapl ", timeframe="1w")
    assert request.ticker == "AAPL"
    
    # Invalid timeframe should raise error
    with pytest.raises(ValueError):
        PredictionRequest(ticker="AAPL", timeframe="2h")

def test_batch_prediction_request():
    """Test batch prediction request"""
    request = BatchPredictionRequest(
        tickers=["aapl", "googl", "MSFT"],
        timeframe="1m"
    )
    
    assert len(request.tickers) == 3
    assert request.tickers == ["AAPL", "GOOGL", "MSFT"]
    assert request.timeframe == "1m"

def test_prediction_response_model():
    """Test prediction response model"""
    response = PredictionResponse(
        ticker="AAPL",
        current_price=150.0,
        prediction_date=datetime.now(),
        timeframe="1d",
        direction=DirectionEnum.BULLISH,
        price_target=155.0,
        confidence=8,
        reasoning=["Strong momentum", "Good volume"],
        risk_factors=["Market volatility"],
        options_metrics={"put_call_ratio": 0.7}
    )
    
    assert response.ticker == "AAPL"
    assert response.direction == DirectionEnum.BULLISH
    assert response.confidence == 8
    assert len(response.reasoning) == 2

def test_options_chain_put_call_ratio():
    """Test put/call ratio calculation"""
    chain = OptionsChain(
        ticker="TEST",
        underlying_price=100.0,
        timestamp=datetime.now(),
        calls=[
            Option(
                strike=105.0,
                expiration=datetime.now().date(),
                option_type=OptionType.CALL,
                bid=1.0,
                ask=1.1,
                last=1.05,
                volume=1000,
                open_interest=5000,
                implied_volatility=0.20
            )
        ],
        puts=[
            Option(
                strike=95.0,
                expiration=datetime.now().date(),
                option_type=OptionType.PUT,
                bid=0.9,
                ask=1.0,
                last=0.95,
                volume=2000,
                open_interest=10000,
                implied_volatility=0.25
            )
        ]
    )
    
    ratio = chain.calculate_put_call_ratio()
    assert ratio == 2.0  # 2000/1000

def test_option_type_enum():
    """Test option type enumeration"""
    assert OptionType.CALL.value == "call"
    assert OptionType.PUT.value == "put"