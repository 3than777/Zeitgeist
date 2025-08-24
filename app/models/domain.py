from pydantic import BaseModel, Field
from typing import Optional, List, Dict
from datetime import datetime, date
from enum import Enum

class OptionType(str, Enum):
    CALL = "call"
    PUT = "put"

class Option(BaseModel):
    strike: float
    expiration: date
    option_type: OptionType
    bid: float
    ask: float
    last: float
    volume: int
    open_interest: int
    implied_volatility: float
    delta: Optional[float] = None
    gamma: Optional[float] = None
    theta: Optional[float] = None
    vega: Optional[float] = None

class OptionsChain(BaseModel):
    ticker: str
    underlying_price: float
    timestamp: datetime
    calls: List[Option]
    puts: List[Option]
    
    def calculate_put_call_ratio(self) -> float:
        put_volume = sum(p.volume for p in self.puts)
        call_volume = sum(c.volume for c in self.calls)
        if call_volume == 0:
            return 0.0
        return put_volume / call_volume

class StockData(BaseModel):
    ticker: str
    price: float
    volume: int
    day_change: float
    day_change_percent: float
    high: float
    low: float
    open: float
    previous_close: float
    timestamp: datetime

class MarketSentiment(BaseModel):
    ticker: str
    sentiment_score: float = Field(..., ge=-1, le=1)
    bullish_count: int
    bearish_count: int
    neutral_count: int
    sources: List[str]
    timestamp: datetime