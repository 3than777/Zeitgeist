import { NextRequest, NextResponse } from 'next/server';
import { 
  getCompleteStockInfo, 
  getStockHistory, 
  createAPIError 
} from '../../../lib/polygon';
import { validateStockTicker } from '../../../lib/stock-utils';
import { 
  analyzeStockData,
  createFallbackAnalysis,
  createAnthropicError
} from '../../../lib/anthropic';
import { 
  StockData, 
  CompanyDetails, 
  StockPriceData,
  StockAnalysis,
  StockAnalysisRequest,
  StockAnalysisResponse,
  StockAPIError 
} from '../../../types/stock';

// Request interface for stock analysis endpoint
interface StockAnalysisRequestBody {
  ticker: string;
  options?: {
    include_history?: boolean;
    days_history?: number;
    analysis_options?: {
      max_retries?: number;
    };
  };
}

/**
 * Validates the request body structure
 */
function validateStockAnalysisRequest(body: unknown): { isValid: boolean; error?: string; data?: StockAnalysisRequestBody } {
  if (!body || typeof body !== 'object') {
    return { isValid: false, error: 'Request body must be a JSON object' };
  }

  const bodyObj = body as Record<string, unknown>;

  if (!bodyObj.ticker || typeof bodyObj.ticker !== 'string') {
    return { isValid: false, error: 'ticker is required and must be a string' };
  }

  // Validate ticker format
  const tickerValidation = validateStockTicker(bodyObj.ticker as string);
  if (!tickerValidation.isValid) {
    return { isValid: false, error: tickerValidation.error };
  }

  // Validate optional parameters
  const options = bodyObj.options as Record<string, unknown> || {};
  
  if (options.include_history !== undefined && typeof options.include_history !== 'boolean') {
    return { isValid: false, error: 'options.include_history must be a boolean if provided' };
  }

  if (options.days_history !== undefined) {
    if (typeof options.days_history !== 'number' || options.days_history < 1 || options.days_history > 90) {
      return { isValid: false, error: 'options.days_history must be a number between 1 and 90 if provided' };
    }
  }

  if (options.analysis_options) {
    const analysisOpts = options.analysis_options as Record<string, unknown>;
    
    if (analysisOpts.max_retries !== undefined) {
      if (typeof analysisOpts.max_retries !== 'number' || analysisOpts.max_retries < 0 || analysisOpts.max_retries > 3) {
        return { isValid: false, error: 'options.analysis_options.max_retries must be a number between 0 and 3 if provided' };
      }
    }
  }

  return { 
    isValid: true, 
    data: {
      ticker: tickerValidation.formattedTicker,
      options: {
        include_history: options.include_history ?? true,
        days_history: options.days_history ?? 30,
        analysis_options: {
          max_retries: (options.analysis_options as Record<string, unknown>)?.max_retries as number ?? 1
        }
      }
    }
  };
}

/**
 * POST /api/stock-analysis
 * Combines stock data fetching and AI analysis in a single endpoint
 * 
 * Request Body:
 * {
 *   "ticker": "AAPL" (required),
 *   "options": {
 *     "include_history": boolean (default: true),
 *     "days_history": number (default: 30, max: 90),
 *     "analysis_options": {
 *       "max_retries": number (default: 1, max: 3)
 *     }
 *   }
 * }
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  let dataFetchTime = 0;
  let analysisTime = 0;
  
  try {
    // Parse request body
    let requestBody: unknown;
    try {
      requestBody = await request.json();
    } catch {
      const error: StockAPIError = {
        error: 'INVALID_JSON',
        message: 'Request body must be valid JSON',
        status_code: 400,
        details: 'Please provide a valid JSON request body'
      };

      return NextResponse.json({
        success: false,
        error,
        timestamp: new Date().toISOString()
      } as StockAnalysisResponse, { status: 400 });
    }

    // Validate request structure
    const validation = validateStockAnalysisRequest(requestBody);
    if (!validation.isValid) {
      const error: StockAPIError = {
        error: 'INVALID_REQUEST',
        message: validation.error || 'Invalid request format',
        status_code: 400,
        details: 'Please check the request body structure and required fields'
      };

      return NextResponse.json({
        success: false,
        error,
        timestamp: new Date().toISOString()
      } as StockAnalysisResponse, { status: 400 });
    }

    const { ticker, options } = validation.data!;
    
    // Log the combined analysis request
    console.log(`[Stock Analysis API] Starting combined analysis for ${ticker}, history: ${options?.include_history}, days: ${options?.days_history}`);

    // Phase 1: Fetch stock data from Polygon.io
    let stockData: StockData;
    let companyDetails: CompanyDetails;
    let priceHistory: StockPriceData[] | undefined;

    try {
      const dataStartTime = Date.now();
      
      // Fetch stock data and company details
      const { stockData: fetchedStockData, companyDetails: fetchedCompanyDetails } = await getCompleteStockInfo(ticker);
      stockData = fetchedStockData;
      companyDetails = fetchedCompanyDetails;
      
      // Fetch price history if requested
      if (options?.include_history) {
        try {
          priceHistory = await getStockHistory(ticker, options?.days_history || 30);
        } catch (historyError) {
          console.warn(`[Stock Analysis API] Failed to fetch history for ${ticker}:`, historyError);
          priceHistory = undefined;
        }
      }
      
      dataFetchTime = Date.now() - dataStartTime;
      console.log(`[Stock Analysis API] Successfully fetched data for ${ticker} in ${dataFetchTime}ms`);

    } catch (dataError) {
      console.error(`[Stock Analysis API] Error fetching data for ${ticker}:`, dataError);
      
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
      } as StockAnalysisResponse, { status: statusCode });
    }

    // Phase 2: Analyze stock data with AI
    let analysis: StockAnalysis;
    
    try {
      const analysisStartTime = Date.now();
      const maxRetries = (options?.analysis_options as Record<string, unknown>)?.max_retries as number || 1;
      
      let attempt = 0;
      
      // Attempt analysis with retries
      while (attempt <= maxRetries) {
        try {
          analysis = await analyzeStockData(stockData, companyDetails, priceHistory);
          break;
        } catch (analysisError) {
          attempt++;
          console.warn(`[Stock Analysis API] Analysis attempt ${attempt} failed for ${ticker}:`, analysisError);
          
          if (attempt > maxRetries) {
            // All retries failed - return error without fallback
            throw analysisError;
          }
          
          // Wait before retry (exponential backoff)
          if (attempt <= maxRetries) {
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
          }
        }
      }
      
      analysisTime = Date.now() - analysisStartTime;
      console.log(`[Stock Analysis API] Successfully analyzed ${ticker} using ${analysis!.model_used} in ${analysisTime}ms`);

    } catch (analysisError) {
      console.error(`[Stock Analysis API] Analysis failed for ${ticker}:`, analysisError);
      
      // Return partial success - stock data without analysis
      const statusCode = 200;
      let errorMessage = 'AI analysis unavailable';
      
      if (analysisError instanceof Error) {
        errorMessage = analysisError.message;
      }

      console.log(`[Stock Analysis API] Returning stock data without analysis for ${ticker}`);

      // Return stock data but indicate analysis failure
      const response = {
        success: true,
        data: {
          stock_data: stockData,
          company_details: companyDetails,
          ...(priceHistory && { price_history: priceHistory }),
          analysis_error: {
            error: 'AI_ANALYSIS_UNAVAILABLE',
            message: errorMessage,
            details: 'Stock data retrieved successfully but AI analysis failed'
          }
        },
        timestamp: new Date().toISOString()
      };

      return NextResponse.json(response, { 
        status: statusCode,
        headers: {
          'Cache-Control': 'private, max-age=60', // Shorter cache for partial data
          'X-Response-Time': `${Date.now() - startTime}ms`,
          'X-Data-Fetch-Time': `${dataFetchTime}ms`,
          'X-Analysis-Status': 'failed'
        }
      });
    }

    // Phase 3: Return combined results
    const totalTime = Date.now() - startTime;
    
    console.log(`[Stock Analysis API] Completed full analysis for ${ticker} in ${totalTime}ms (data: ${dataFetchTime}ms, analysis: ${analysisTime}ms)`);

    const response: StockAnalysisResponse = {
      success: true,
      data: {
        stock_data: stockData,
        company_details: companyDetails,
        ...(priceHistory && { price_history: priceHistory }),
        analysis: analysis!
      },
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(response, { 
      status: 200,
      headers: {
        'Cache-Control': 'private, max-age=300', // Cache for 5 minutes
        'X-Response-Time': `${totalTime}ms`,
        'X-Data-Fetch-Time': `${dataFetchTime}ms`,
        'X-Analysis-Time': `${analysisTime}ms`
      }
    });

  } catch (error) {
    console.error('[Stock Analysis API] Unexpected error:', error);
    
    const apiError: StockAPIError = {
      error: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred during stock analysis',
      status_code: 500,
      details: error instanceof Error ? error.message : 'Unknown internal server error'
    };

    return NextResponse.json({
      success: false,
      error: apiError,
      timestamp: new Date().toISOString()
    } as StockAnalysisResponse, { status: 500 });
  }
}

/**
 * GET method is not supported for this endpoint
 */
export async function GET(request: NextRequest) {
  const error: StockAPIError = {
    error: 'METHOD_NOT_ALLOWED',
    message: 'GET method is not supported for this endpoint',
    status_code: 405,
    details: 'Use POST method to perform stock analysis'
  };

  return NextResponse.json({
    success: false,
    error,
    timestamp: new Date().toISOString()
  } as StockAnalysisResponse, { status: 405 });
}

/**
 * PUT method is not supported for this endpoint
 */
export async function PUT(request: NextRequest) {
  const error: StockAPIError = {
    error: 'METHOD_NOT_ALLOWED',
    message: 'PUT method is not supported for this endpoint',
    status_code: 405,
    details: 'Use POST method to perform stock analysis'
  };

  return NextResponse.json({
    success: false,
    error,
    timestamp: new Date().toISOString()
  } as StockAnalysisResponse, { status: 405 });
}

/**
 * DELETE method is not supported for this endpoint
 */
export async function DELETE(request: NextRequest) {
  const error: StockAPIError = {
    error: 'METHOD_NOT_ALLOWED',
    message: 'DELETE method is not supported for this endpoint',
    status_code: 405,
    details: 'Use POST method to perform stock analysis'
  };

  return NextResponse.json({
    success: false,
    error,
    timestamp: new Date().toISOString()
  } as StockAnalysisResponse, { status: 405 });
}