from fastapi import APIRouter, Depends, Query, BackgroundTasks, HTTPException
from typing import Optional
import logging
import uuid

from app.models.request import PredictionRequest, BatchPredictionRequest
from app.models.response import PredictionResponse, BatchPredictionResponse
from app.services.predictor import PredictorService
from app.core.exceptions import StockForecastException

router = APIRouter()
logger = logging.getLogger(__name__)

@router.post("/predict", response_model=PredictionResponse)
async def create_prediction(
    request: PredictionRequest,
    predictor: PredictorService = Depends()
) -> PredictionResponse:
    """Generate stock prediction using options data and GPT analysis"""
    try:
        prediction = await predictor.predict(
            ticker=request.ticker,
            timeframe=request.timeframe,
            include_reasoning=request.include_reasoning
        )
        return prediction
    except StockForecastException as e:
        logger.error(f"Prediction failed: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/predict/{ticker}", response_model=PredictionResponse)
async def quick_prediction(
    ticker: str,
    timeframe: str = Query("1d", regex="^(1d|1w|1m)$"),
    include_reasoning: bool = Query(True),
    predictor: PredictorService = Depends()
) -> PredictionResponse:
    """Quick prediction for a ticker"""
    try:
        prediction = await predictor.predict(
            ticker=ticker.upper(),
            timeframe=timeframe,
            include_reasoning=include_reasoning
        )
        return prediction
    except StockForecastException as e:
        logger.error(f"Quick prediction failed: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.post("/batch-predict", response_model=BatchPredictionResponse)
async def batch_predictions(
    request: BatchPredictionRequest,
    background_tasks: BackgroundTasks,
    predictor: PredictorService = Depends()
) -> BatchPredictionResponse:
    """Queue multiple predictions"""
    job_id = str(uuid.uuid4())
    
    # In a production system, this would queue tasks to a job queue
    # For now, we'll execute synchronously
    predictions = await predictor.batch_predict(
        tickers=request.tickers,
        timeframe=request.timeframe
    )
    
    return BatchPredictionResponse(
        predictions=predictions,
        job_id=job_id,
        status="completed",
        created_at=predictions[0].prediction_date if predictions else None,
        completed_at=predictions[-1].prediction_date if predictions else None
    )

@router.get("/predictions/{job_id}")
async def get_batch_status(job_id: str):
    """Get status of batch prediction job"""
    # In production, this would check job queue status
    return {
        "job_id": job_id,
        "status": "completed",
        "message": "Batch prediction jobs are currently executed synchronously"
    }