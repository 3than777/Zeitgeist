import re
from typing import List

def validate_ticker(ticker: str) -> str:
    """Validate and normalize ticker symbol"""
    ticker = ticker.upper().strip()
    
    # Check length
    if not ticker or len(ticker) > 10:
        raise ValueError(f"Invalid ticker symbol: {ticker}")
    
    # Check for valid characters (letters, dots, hyphens)
    if not re.match(r"^[A-Z][A-Z0-9\-\.]*$", ticker):
        raise ValueError(f"Invalid ticker format: {ticker}")
    
    return ticker

def validate_tickers(tickers: List[str]) -> List[str]:
    """Validate and normalize multiple ticker symbols"""
    return [validate_ticker(ticker) for ticker in tickers]

def validate_timeframe(timeframe: str) -> str:
    """Validate timeframe parameter"""
    valid_timeframes = ["1d", "1w", "1m"]
    if timeframe not in valid_timeframes:
        raise ValueError(f"Invalid timeframe: {timeframe}. Must be one of {valid_timeframes}")
    return timeframe