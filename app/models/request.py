from pydantic import BaseModel, Field, validator
from typing import Optional, List
from datetime import datetime

class PredictionRequest(BaseModel):
    ticker: str = Field(..., description="Stock ticker symbol", example="AAPL")
    timeframe: str = Field("1d", description="Prediction timeframe", regex="^(1d|1w|1m)$")
    include_reasoning: bool = Field(True, description="Include detailed reasoning")
    
    @validator("ticker")
    def validate_ticker(cls, v):
        v = v.upper().strip()
        if not v or len(v) > 10:
            raise ValueError("Invalid ticker symbol")
        return v

class BatchPredictionRequest(BaseModel):
    tickers: List[str] = Field(..., description="List of ticker symbols", max_items=10)
    timeframe: str = Field("1d", description="Prediction timeframe", regex="^(1d|1w|1m)$")
    
    @validator("tickers")
    def validate_tickers(cls, v):
        return [ticker.upper().strip() for ticker in v]

class AnalysisRequest(BaseModel):
    ticker: str = Field(..., description="Stock ticker symbol")
    analysis_type: str = Field(..., description="Type of analysis", regex="^(options|volatility|sentiment)$")
    start_date: Optional[datetime] = Field(None, description="Start date for historical analysis")
    end_date: Optional[datetime] = Field(None, description="End date for historical analysis")