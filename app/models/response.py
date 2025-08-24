from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum

class DirectionEnum(str, Enum):
    BULLISH = "bullish"
    BEARISH = "bearish"
    NEUTRAL = "neutral"

class PredictionResponse(BaseModel):
    ticker: str
    current_price: float
    prediction_date: datetime
    timeframe: str
    direction: DirectionEnum
    price_target: float
    confidence: int = Field(..., ge=1, le=10)
    reasoning: Optional[List[str]] = None
    risk_factors: Optional[List[str]] = None
    options_metrics: Optional[Dict[str, Any]] = None
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

class BatchPredictionResponse(BaseModel):
    predictions: List[PredictionResponse]
    job_id: str
    status: str = Field(..., regex="^(pending|processing|completed|failed)$")
    created_at: datetime
    completed_at: Optional[datetime] = None

class OptionsData(BaseModel):
    put_call_ratio: float
    iv_rank: float
    iv_percentile: float
    total_volume: int
    open_interest: int
    net_delta: float
    net_gamma: float
    gamma_exposure: float

class AnalysisResponse(BaseModel):
    ticker: str
    analysis_type: str
    timestamp: datetime
    data: Dict[str, Any]
    summary: str
    recommendations: Optional[List[str]] = None