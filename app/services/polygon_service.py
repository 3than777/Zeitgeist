import httpx
from typing import List, Optional, Dict, Any
from datetime import date, datetime, timedelta
import logging
from tenacity import retry, stop_after_attempt, wait_exponential

from app.config import get_settings
from app.core.exceptions import PolygonAPIException
from app.models.domain import Option, OptionsChain, StockData, OptionType

settings = get_settings()
logger = logging.getLogger(__name__)

class PolygonService:
    def __init__(self):
        self.base_url = settings.polygon_base_url
        self.api_key = settings.polygon_api_key
        self.client = httpx.AsyncClient(
            timeout=30.0,
            headers={"Authorization": f"Bearer {self.api_key}"}
        )
    
    async def __aenter__(self):
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.client.aclose()
    
    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=4, max=10)
    )
    async def _make_request(self, endpoint: str, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        try:
            url = f"{self.base_url}{endpoint}"
            response = await self.client.get(url, params=params)
            response.raise_for_status()
            data = response.json()
            
            if data.get("status") != "OK":
                raise PolygonAPIException(
                    f"API returned non-OK status: {data.get('status')}",
                    status_code=response.status_code
                )
            
            return data
        except httpx.HTTPStatusError as e:
            logger.error(f"Polygon API HTTP error: {e}")
            raise PolygonAPIException(
                f"HTTP error: {e.response.status_code}",
                status_code=e.response.status_code
            )
        except Exception as e:
            logger.error(f"Polygon API request failed: {e}")
            raise PolygonAPIException(str(e))
    
    async def get_current_price(self, ticker: str) -> StockData:
        """Get current stock price and basic data"""
        endpoint = f"/v2/aggs/ticker/{ticker}/prev"
        data = await self._make_request(endpoint)
        
        result = data["results"][0]
        return StockData(
            ticker=ticker,
            price=result["c"],
            volume=result["v"],
            day_change=result["c"] - result["o"],
            day_change_percent=((result["c"] - result["o"]) / result["o"]) * 100,
            high=result["h"],
            low=result["l"],
            open=result["o"],
            previous_close=result["c"],
            timestamp=datetime.fromtimestamp(result["t"] / 1000)
        )
    
    async def get_options_chain(self, ticker: str, expiration_date: Optional[date] = None) -> OptionsChain:
        """Get options chain data for a ticker"""
        endpoint = f"/v3/reference/options/contracts"
        
        params = {
            "underlying_ticker": ticker,
            "expired": "false",
            "limit": 250
        }
        
        if expiration_date:
            params["expiration_date"] = expiration_date.isoformat()
        
        data = await self._make_request(endpoint, params)
        
        # Get current stock price
        stock_data = await self.get_current_price(ticker)
        
        calls = []
        puts = []
        
        for contract in data.get("results", []):
            # Parse contract details
            option = Option(
                strike=contract["strike_price"],
                expiration=datetime.strptime(contract["expiration_date"], "%Y-%m-%d").date(),
                option_type=OptionType.CALL if contract["contract_type"] == "call" else OptionType.PUT,
                bid=0.0,  # Will be updated with quote data
                ask=0.0,
                last=0.0,
                volume=0,
                open_interest=0,
                implied_volatility=0.0
            )
            
            if option.option_type == OptionType.CALL:
                calls.append(option)
            else:
                puts.append(option)
        
        # Get quotes for options (simplified - in production would batch these)
        # For now, returning empty chain structure
        
        return OptionsChain(
            ticker=ticker,
            underlying_price=stock_data.price,
            timestamp=datetime.now(),
            calls=calls,
            puts=puts
        )
    
    async def get_options_activity(self, ticker: str) -> List[Dict[str, Any]]:
        """Get unusual options activity"""
        # This would typically query a specific endpoint for options flow
        # For now, returning placeholder
        return []
    
    async def get_historical_data(
        self,
        ticker: str,
        start_date: date,
        end_date: date,
        timespan: str = "day"
    ) -> List[Dict[str, Any]]:
        """Get historical price data"""
        endpoint = f"/v2/aggs/ticker/{ticker}/range/1/{timespan}/{start_date}/{end_date}"
        data = await self._make_request(endpoint)
        return data.get("results", [])