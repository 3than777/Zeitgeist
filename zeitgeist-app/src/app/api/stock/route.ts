import { NextRequest, NextResponse } from 'next/server';
import { 
  getCompleteStockInfo, 
  getStockHistory, 
  createAPIError 
} from '../../../lib/polygon';
import { validateStockTicker } from '../../../lib/stock-utils';
import { 
  StockData, 
  CompanyDetails, 
  StockPriceData,
  StockAPIError 
} from '../../../types/stock';

// Type for our API response
interface StockAPIResponse {
  success: boolean;
  data?: {
    stock_data: StockData;
    company_details: CompanyDetails;
    price_history?: StockPriceData[];
  };
  error?: StockAPIError;
  timestamp: string;
}

/**
 * GET /api/stock
 * Retrieves stock data for a given ticker symbol
 * 
 * Query Parameters:
 * - ticker (required): Stock ticker symbol (e.g., AAPL, MSFT)
 * - include_history (optional): Whether to include 30-day price history (default: false)
 * - days_history (optional): Number of days of history to fetch (default: 30, max: 90)
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Extract query parameters
    const { searchParams } = new URL(request.url);
    const ticker = searchParams.get('ticker');
    const includeHistory = searchParams.get('include_history') === 'true';
    const daysHistory = Math.min(90, Math.max(1, parseInt(searchParams.get('days_history') || '30')));

    // Validate required parameters
    if (!ticker) {
      const error: StockAPIError = {
        error: 'MISSING_PARAMETER',
        message: 'Ticker symbol is required',
        status_code: 400,
        details: 'Please provide a ticker symbol as a query parameter (e.g., ?ticker=AAPL)'
      };

      return NextResponse.json({
        success: false,
        error,
        timestamp: new Date().toISOString()
      } as StockAPIResponse, { status: 400 });
    }

    // Validate ticker format
    const validation = validateStockTicker(ticker);
    if (!validation.isValid) {
      const error: StockAPIError = {
        error: 'INVALID_TICKER',
        message: validation.error || 'Invalid ticker symbol format',
        status_code: 400,
        details: 'Ticker symbol must be 1-5 alphabetic characters'
      };

      return NextResponse.json({
        success: false,
        error,
        timestamp: new Date().toISOString()
      } as StockAPIResponse, { status: 400 });
    }

    // Log the request for monitoring
    console.log(`[Stock API] Fetching data for ${validation.formattedTicker}, history: ${includeHistory}, days: ${daysHistory}`);

    try {
      // Fetch stock data and company details
      const { stockData, companyDetails } = await getCompleteStockInfo(validation.formattedTicker);
      
      // Fetch price history if requested
      let priceHistory: StockPriceData[] | undefined;
      if (includeHistory) {
        try {
          priceHistory = await getStockHistory(validation.formattedTicker, daysHistory);
        } catch (historyError) {
          // Log but don't fail the entire request if history fails
          console.warn(`[Stock API] Failed to fetch history for ${validation.formattedTicker}:`, historyError);
          priceHistory = undefined;
        }
      }

      const response: StockAPIResponse = {
        success: true,
        data: {
          stock_data: stockData,
          company_details: companyDetails,
          ...(priceHistory && { price_history: priceHistory })
        },
        timestamp: new Date().toISOString()
      };

      const duration = Date.now() - startTime;
      console.log(`[Stock API] Successfully fetched data for ${validation.formattedTicker} in ${duration}ms`);

      return NextResponse.json(response, { 
        status: 200,
        headers: {
          'Cache-Control': 'public, max-age=60', // Cache for 1 minute
          'X-Response-Time': `${duration}ms`
        }
      });

    } catch (dataError) {
      console.error(`[Stock API] Error fetching data for ${validation.formattedTicker}:`, dataError);
      
      // Handle specific Polygon.io errors
      let statusCode = 500;
      let errorMessage = 'Failed to fetch stock data';
      
      if (dataError instanceof Error) {
        errorMessage = dataError.message;
        
        if (errorMessage.includes('not found')) {
          statusCode = 404;
        } else if (errorMessage.includes('rate limit')) {
          statusCode = 429;
        } else if (errorMessage.includes('API key')) {
          statusCode = 401;
        } else if (errorMessage.includes('forbidden')) {
          statusCode = 403;
        }
      }

      const error: StockAPIError = {
        error: 'DATA_FETCH_ERROR',
        message: errorMessage,
        status_code: statusCode,
        details: 'Unable to retrieve stock data from data provider'
      };

      return NextResponse.json({
        success: false,
        error,
        timestamp: new Date().toISOString()
      } as StockAPIResponse, { status: statusCode });
    }

  } catch (error) {
    console.error('[Stock API] Unexpected error:', error);
    
    const apiError: StockAPIError = {
      error: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
      status_code: 500,
      details: error instanceof Error ? error.message : 'Unknown internal server error'
    };

    return NextResponse.json({
      success: false,
      error: apiError,
      timestamp: new Date().toISOString()
    } as StockAPIResponse, { status: 500 });
  }
}

/**
 * POST method is not supported for this endpoint
 */
export async function POST(_request: NextRequest) {
  const error: StockAPIError = {
    error: 'METHOD_NOT_ALLOWED',
    message: 'POST method is not supported for this endpoint',
    status_code: 405,
    details: 'Use GET method to retrieve stock data'
  };

  return NextResponse.json({
    success: false,
    error,
    timestamp: new Date().toISOString()
  } as StockAPIResponse, { status: 405 });
}

/**
 * PUT method is not supported for this endpoint
 */
export async function PUT(_request: NextRequest) {
  const error: StockAPIError = {
    error: 'METHOD_NOT_ALLOWED',
    message: 'PUT method is not supported for this endpoint',
    status_code: 405,
    details: 'Use GET method to retrieve stock data'
  };

  return NextResponse.json({
    success: false,
    error,
    timestamp: new Date().toISOString()
  } as StockAPIResponse, { status: 405 });
}

/**
 * DELETE method is not supported for this endpoint
 */
export async function DELETE(_request: NextRequest) {
  const error: StockAPIError = {
    error: 'METHOD_NOT_ALLOWED',
    message: 'DELETE method is not supported for this endpoint',
    status_code: 405,
    details: 'Use GET method to retrieve stock data'
  };

  return NextResponse.json({
    success: false,
    error,
    timestamp: new Date().toISOString()
  } as StockAPIResponse, { status: 405 });
}