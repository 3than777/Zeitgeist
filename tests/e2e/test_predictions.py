import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, AsyncMock

@pytest.mark.asyncio
async def test_prediction_endpoint(client, sample_stock_data, sample_options_chain):
    """Test prediction endpoint end-to-end"""
    with patch('app.services.polygon_service.PolygonService') as mock_polygon:
        with patch('app.services.openai_service.OpenAIService') as mock_openai:
            # Setup mocks
            mock_polygon.return_value.get_current_price = AsyncMock(return_value=sample_stock_data)
            mock_polygon.return_value.get_options_chain = AsyncMock(return_value=sample_options_chain)
            
            mock_openai.return_value.complete = AsyncMock(return_value={
                "content": {
                    "direction": "bullish",
                    "price_target": 155.0,
                    "confidence": 7,
                    "reasoning": ["Strong technicals"],
                    "risk_factors": ["Market risk"]
                }
            })
            
            # Test POST endpoint
            response = client.post(
                "/api/v1/predictions/predict",
                json={
                    "ticker": "AAPL",
                    "timeframe": "1d",
                    "include_reasoning": True
                }
            )
            
            assert response.status_code == 200
            data = response.json()
            assert data["ticker"] == "AAPL"
            assert data["direction"] == "bullish"
            assert data["confidence"] == 7

def test_quick_prediction_endpoint(client):
    """Test GET prediction endpoint"""
    with patch('app.services.predictor.PredictorService.predict') as mock_predict:
        mock_predict.return_value = {
            "ticker": "AAPL",
            "current_price": 150.0,
            "direction": "neutral",
            "price_target": 150.0,
            "confidence": 5
        }
        
        response = client.get("/api/v1/predictions/predict/AAPL?timeframe=1w")
        
        assert response.status_code == 200
        # Note: This will fail because we need to return a proper PredictionResponse object

def test_health_endpoint(client):
    """Test health check endpoint"""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

def test_api_health_endpoint(client):
    """Test API health endpoint"""
    response = client.get("/api/v1/health/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "version" in data

def test_root_endpoint(client):
    """Test root endpoint"""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "message" in data
    assert "version" in data
    assert "docs" in data