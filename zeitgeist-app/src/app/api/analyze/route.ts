import { NextRequest, NextResponse } from 'next/server';
import { 
  analyzeStockData
} from '../../../lib/anthropic';
import { 
  StockData, 
  CompanyDetails, 
  StockPriceData,
  StockAnalysis,
  StockAPIError 
} from '../../../types/stock';

// Request interface for analysis endpoint
interface AnalysisRequest {
  stock_data: StockData;
  company_details?: CompanyDetails;
  price_history?: StockPriceData[];
  options?: {
    include_fallback?: boolean;
    max_retries?: number;
  };
}

// Response interface for analysis endpoint
interface AnalysisAPIResponse {
  success: boolean;
  data?: {
    analysis: StockAnalysis;
    processing_time_ms: number;
    model_used: string;
  };
  error?: StockAPIError;
  timestamp: string;
}

/**
 * Validates the request body structure
 */
function validateAnalysisRequest(body: unknown): { isValid: boolean; error?: string; data?: AnalysisRequest } {
  if (!body || typeof body !== 'object') {
    return { isValid: false, error: 'Request body must be a JSON object' };
  }

  const bodyObj = body as Record<string, unknown>;

  if (!bodyObj.stock_data || typeof bodyObj.stock_data !== 'object') {
    return { isValid: false, error: 'stock_data is required and must be an object' };
  }

  // Validate required fields in stock_data
  const stockData = bodyObj.stock_data as Record<string, unknown>;
  const requiredFields = ['ticker', 'name', 'price', 'previous_close', 'change', 'change_percent'];
  
  for (const field of requiredFields) {
    if (stockData[field] === undefined || stockData[field] === null) {
      return { isValid: false, error: `stock_data.${field} is required` };
    }
  }

  // Validate ticker format
  if (typeof stockData.ticker !== 'string' || !/^[A-Z]{1,5}$/.test(stockData.ticker)) {
    return { isValid: false, error: 'stock_data.ticker must be 1-5 uppercase letters' };
  }

  // Validate numeric fields
  const numericFields = ['price', 'previous_close', 'change', 'change_percent'];
  for (const field of numericFields) {
    if (typeof stockData[field] !== 'number' || isNaN(stockData[field])) {
      return { isValid: false, error: `stock_data.${field} must be a valid number` };
    }
  }

  // Validate optional company_details if provided
  if (bodyObj.company_details && typeof bodyObj.company_details !== 'object') {
    return { isValid: false, error: 'company_details must be an object if provided' };
  }

  // Validate optional price_history if provided
  if (bodyObj.price_history) {
    if (!Array.isArray(bodyObj.price_history)) {
      return { isValid: false, error: 'price_history must be an array if provided' };
    }
    
    if ((bodyObj.price_history as unknown[]).length > 0) {
      const firstItem = (bodyObj.price_history as unknown[])[0] as Record<string, unknown>;
      const requiredPriceFields = ['open', 'high', 'low', 'close', 'volume', 'date'];
      
      for (const field of requiredPriceFields) {
        if (firstItem[field] === undefined || firstItem[field] === null) {
          return { isValid: false, error: `price_history items must include ${field}` };
        }
      }
    }
  }

  return { 
    isValid: true, 
    data: {
      stock_data: bodyObj.stock_data as StockData,
      company_details: bodyObj.company_details as CompanyDetails,
      price_history: bodyObj.price_history as StockPriceData[],
      options: bodyObj.options as Record<string, unknown> || {}
    }
  };
}

/**
 * POST /api/analyze
 * Analyzes stock data using AI and returns investment analysis
 * 
 * Request Body:
 * {
 *   "stock_data": StockData (required),
 *   "company_details": CompanyDetails (optional),
 *   "price_history": StockPriceData[] (optional),
 *   "options": {
 *     "include_fallback": boolean (default: true),
 *     "max_retries": number (default: 1)
 *   }
 * }
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
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
      } as AnalysisAPIResponse, { status: 400 });
    }

    // Validate request structure
    const validation = validateAnalysisRequest(requestBody);
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
      } as AnalysisAPIResponse, { status: 400 });
    }

    const { stock_data, company_details, price_history, options } = validation.data!;
    const maxRetries = Math.min(3, Math.max(0, options?.max_retries || 1));
    const includeFallback = options?.include_fallback !== false;

    // Log the analysis request
    console.log(`[Analysis API] Analyzing ${stock_data.ticker}, retries: ${maxRetries}, fallback: ${includeFallback}`);

    let analysis: StockAnalysis;
    let modelUsed = 'unknown';
    let attempt = 0;

    // Attempt analysis with retries
    while (attempt <= maxRetries) {
      try {
        analysis = await analyzeStockData(stock_data, company_details, price_history);
        modelUsed = analysis.model_used;
        break;
      } catch (analysisError) {
        attempt++;
        console.warn(`[Analysis API] Attempt ${attempt} failed for ${stock_data.ticker}:`, analysisError);
        
        if (attempt > maxRetries) {
          // If all retries failed, return error
          {
            // Return the analysis error
            let statusCode = 500;
            let errorMessage = 'Failed to analyze stock data';
            
            if (analysisError instanceof Error) {
              errorMessage = analysisError.message;
              
              if (errorMessage.includes('API key')) {
                statusCode = 401;
              } else if (errorMessage.includes('rate limit') || errorMessage.includes('quota')) {
                statusCode = 429;
              } else if (errorMessage.includes('timeout')) {
                statusCode = 408;
              }
            }

            const error: StockAPIError = {
              error: 'ANALYSIS_FAILED',
              message: errorMessage,
              status_code: statusCode,
              details: `Failed to analyze ${stock_data.ticker} after ${maxRetries + 1} attempts`
            };

            return NextResponse.json({
              success: false,
              error,
              timestamp: new Date().toISOString()
            } as AnalysisAPIResponse, { status: statusCode });
          }
        }
        
        // Wait before retry (exponential backoff)
        if (attempt <= maxRetries) {
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
      }
    }

    const processingTime = Date.now() - startTime;
    
    // Log successful analysis
    console.log(`[Analysis API] Successfully analyzed ${stock_data.ticker} using ${modelUsed} in ${processingTime}ms`);

    const response: AnalysisAPIResponse = {
      success: true,
      data: {
        analysis: analysis!,
        processing_time_ms: processingTime,
        model_used: modelUsed
      },
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(response, { 
      status: 200,
      headers: {
        'Cache-Control': 'private, max-age=300', // Cache for 5 minutes
        'X-Response-Time': `${processingTime}ms`
      }
    });

  } catch (error) {
    console.error('[Analysis API] Unexpected error:', error);
    
    const apiError: StockAPIError = {
      error: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred during analysis',
      status_code: 500,
      details: error instanceof Error ? error.message : 'Unknown internal server error'
    };

    return NextResponse.json({
      success: false,
      error: apiError,
      timestamp: new Date().toISOString()
    } as AnalysisAPIResponse, { status: 500 });
  }
}

/**
 * GET method is not supported for this endpoint
 */
export async function GET(_request: NextRequest) {
  const error: StockAPIError = {
    error: 'METHOD_NOT_ALLOWED',
    message: 'GET method is not supported for this endpoint',
    status_code: 405,
    details: 'Use POST method to analyze stock data'
  };

  return NextResponse.json({
    success: false,
    error,
    timestamp: new Date().toISOString()
  } as AnalysisAPIResponse, { status: 405 });
}

/**
 * PUT method is not supported for this endpoint
 */
export async function PUT(_request: NextRequest) {
  const error: StockAPIError = {
    error: 'METHOD_NOT_ALLOWED',
    message: 'PUT method is not supported for this endpoint',
    status_code: 405,
    details: 'Use POST method to analyze stock data'
  };

  return NextResponse.json({
    success: false,
    error,
    timestamp: new Date().toISOString()
  } as AnalysisAPIResponse, { status: 405 });
}

/**
 * DELETE method is not supported for this endpoint
 */
export async function DELETE(_request: NextRequest) {
  const error: StockAPIError = {
    error: 'METHOD_NOT_ALLOWED',
    message: 'DELETE method is not supported for this endpoint',
    status_code: 405,
    details: 'Use POST method to analyze stock data'
  };

  return NextResponse.json({
    success: false,
    error,
    timestamp: new Date().toISOString()
  } as AnalysisAPIResponse, { status: 405 });
}