from typing import Dict, Any, List, Optional
from datetime import datetime
import logging

from app.services.polygon_service import PolygonService
from app.services.openai_service import OpenAIService
from app.models.domain import OptionsChain
from app.models.response import PredictionResponse, DirectionEnum
from app.core.prompts import PREDICTION_PROMPT
from app.core.exceptions import StockForecastException

logger = logging.getLogger(__name__)

class PredictorService:
    def __init__(self):
        self.polygon_service = PolygonService()
        self.openai_service = OpenAIService()
    
    async def predict(
        self,
        ticker: str,
        timeframe: str = "1d",
        include_reasoning: bool = True
    ) -> PredictionResponse:
        """Generate stock prediction using options data and AI analysis"""
        try:
            # Fetch current stock data
            stock_data = await self.polygon_service.get_current_price(ticker)
            
            # Fetch options chain
            options_chain = await self.polygon_service.get_options_chain(ticker)
            
            # Calculate options metrics
            options_metrics = self._calculate_options_metrics(options_chain)
            
            # Prepare prompt
            prompt = PREDICTION_PROMPT.format(
                ticker=ticker,
                current_price=stock_data.price,
                date=datetime.now().strftime("%Y-%m-%d"),
                put_call_ratio=options_metrics.get("put_call_ratio", 0),
                iv_rank=options_metrics.get("iv_rank", 50),
                iv_percentile=options_metrics.get("iv_percentile", 50),
                total_volume=options_metrics.get("total_volume", 0),
                open_interest=options_metrics.get("open_interest", 0),
                unusual_activity="No unusual activity detected",  # Placeholder
                net_delta=options_metrics.get("net_delta", 0),
                net_gamma=options_metrics.get("net_gamma", 0),
                gamma_exposure=options_metrics.get("gamma_exposure", 0),
                iv_30=options_metrics.get("iv_30", 20),
                iv_skew=options_metrics.get("iv_skew", "neutral"),
                term_structure=options_metrics.get("term_structure", "normal"),
                timeframe=timeframe
            )
            
            # Get AI prediction
            response = await self.openai_service.complete(prompt)
            prediction_data = response["content"]
            
            # Parse AI response
            prediction = PredictionResponse(
                ticker=ticker,
                current_price=stock_data.price,
                prediction_date=datetime.now(),
                timeframe=timeframe,
                direction=DirectionEnum(prediction_data.get("direction", "neutral")),
                price_target=float(prediction_data.get("price_target", stock_data.price)),
                confidence=int(prediction_data.get("confidence", 5)),
                reasoning=prediction_data.get("reasoning", []) if include_reasoning else None,
                risk_factors=prediction_data.get("risk_factors", []),
                options_metrics=options_metrics
            )
            
            logger.info(f"Generated prediction for {ticker}: {prediction.direction} with confidence {prediction.confidence}")
            return prediction
            
        except Exception as e:
            logger.error(f"Prediction failed for {ticker}: {e}")
            raise StockForecastException(f"Failed to generate prediction: {str(e)}")
    
    def _calculate_options_metrics(self, options_chain: OptionsChain) -> Dict[str, Any]:
        """Calculate key options metrics from chain data"""
        metrics = {
            "put_call_ratio": options_chain.calculate_put_call_ratio(),
            "total_volume": sum(o.volume for o in options_chain.calls + options_chain.puts),
            "open_interest": sum(o.open_interest for o in options_chain.calls + options_chain.puts),
            "net_delta": 0,  # Placeholder - would calculate from Greeks
            "net_gamma": 0,
            "gamma_exposure": 0,
            "iv_rank": 50,  # Placeholder - would calculate from historical IV
            "iv_percentile": 50,
            "iv_30": 20,  # Placeholder
            "iv_skew": "neutral",
            "term_structure": "normal"
        }
        
        # Calculate additional metrics if Greeks are available
        if options_chain.calls and hasattr(options_chain.calls[0], 'delta'):
            call_delta = sum(c.delta * c.open_interest for c in options_chain.calls if c.delta)
            put_delta = sum(p.delta * p.open_interest for p in options_chain.puts if p.delta)
            metrics["net_delta"] = call_delta + put_delta
        
        return metrics
    
    async def batch_predict(
        self,
        tickers: List[str],
        timeframe: str = "1d"
    ) -> List[PredictionResponse]:
        """Generate predictions for multiple tickers"""
        predictions = []
        
        for ticker in tickers:
            try:
                prediction = await self.predict(ticker, timeframe)
                predictions.append(prediction)
            except Exception as e:
                logger.error(f"Failed to predict for {ticker}: {e}")
                continue
        
        return predictions