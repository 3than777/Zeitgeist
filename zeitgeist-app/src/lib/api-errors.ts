import { StockAPIError } from '../types/stock';

// Error type constants
export const ERROR_TYPES = {
  // Input/validation errors
  INVALID_TICKER: 'INVALID_TICKER',
  INVALID_JSON: 'INVALID_JSON',
  INVALID_REQUEST: 'INVALID_REQUEST',
  MISSING_PARAMETER: 'MISSING_PARAMETER',
  
  // API service errors
  POLYGON_API_ERROR: 'POLYGON_API_ERROR',
  ANTHROPIC_API_ERROR: 'ANTHROPIC_API_ERROR',
  DATA_FETCH_ERROR: 'DATA_FETCH_ERROR',
  ANALYSIS_FAILED: 'ANALYSIS_FAILED',
  
  // HTTP method errors
  METHOD_NOT_ALLOWED: 'METHOD_NOT_ALLOWED',
  
  // System errors
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  RATE_LIMIT_ERROR: 'RATE_LIMIT_ERROR',
  AUTH_ERROR: 'AUTH_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE'
} as const;

export type ErrorType = typeof ERROR_TYPES[keyof typeof ERROR_TYPES];

// Custom error classes for better error handling and type safety
export class APIError extends Error {
  public readonly errorType: ErrorType;
  public readonly statusCode: number;
  public readonly details?: string;
  public readonly timestamp: string;
  public readonly retryable: boolean;

  constructor(
    errorType: ErrorType,
    message: string,
    statusCode: number = 500,
    details?: string,
    retryable: boolean = false
  ) {
    super(message);
    this.name = 'APIError';
    this.errorType = errorType;
    this.statusCode = statusCode;
    this.details = details;
    this.timestamp = new Date().toISOString();
    this.retryable = retryable;

    // Maintains proper stack trace for where our error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, APIError);
    }
  }

  /**
   * Convert APIError to StockAPIError format for API responses
   */
  toAPIResponse(): StockAPIError {
    return {
      error: this.errorType,
      message: this.message,
      status_code: this.statusCode,
      details: this.details
    };
  }
}

export class ValidationError extends APIError {
  constructor(message: string, details?: string) {
    super(ERROR_TYPES.INVALID_REQUEST, message, 400, details, false);
    this.name = 'ValidationError';
  }
}

export class RateLimitError extends APIError {
  constructor(service: string, retryAfter?: number) {
    const message = `Rate limit exceeded for ${service}${retryAfter ? `. Retry after ${retryAfter}s` : ''}`;
    super(ERROR_TYPES.RATE_LIMIT_ERROR, message, 429, `Rate limit exceeded for ${service}`, true);
    this.name = 'RateLimitError';
  }
}

export class AuthenticationError extends APIError {
  constructor(service: string) {
    super(
      ERROR_TYPES.AUTH_ERROR, 
      `Authentication failed for ${service}`, 
      401, 
      `Check API key configuration for ${service}`, 
      false
    );
    this.name = 'AuthenticationError';
  }
}

export class ServiceUnavailableError extends APIError {
  constructor(service: string, originalError?: string) {
    super(
      ERROR_TYPES.SERVICE_UNAVAILABLE,
      `${service} is currently unavailable`,
      503,
      originalError || `External service ${service} is not responding`,
      true
    );
    this.name = 'ServiceUnavailableError';
  }
}

export class QuotaExceededError extends APIError {
  constructor(service: string) {
    super(
      ERROR_TYPES.RATE_LIMIT_ERROR, // We'll use the same error type but with a different message
      `${service} quota exceeded - check your billing and usage limits`,
      429,
      `API usage quota has been exceeded for ${service}. Please check your billing and usage limits.`,
      false // Quota errors are not automatically retryable
    );
    this.name = 'QuotaExceededError';
  }
}

// Rate limiting detection patterns
const RATE_LIMIT_PATTERNS = [
  /rate limit/i,
  /too many requests/i,
  /throttl/i,
  /requests per/i
];

// Quota/billing detection patterns (more specific than rate limits)
const QUOTA_EXCEEDED_PATTERNS = [
  /quota.*exceeded/i,
  /insufficient_quota/i,
  /billing/i,
  /plan and billing/i,
  /usage limit/i
];

const AUTH_ERROR_PATTERNS = [
  /api key/i,
  /unauthorized/i,
  /authentication/i,
  /forbidden/i,
  /access denied/i
];

const TIMEOUT_PATTERNS = [
  /timeout/i,
  /timed out/i,
  /request timeout/i,
  /gateway timeout/i
];

const NOT_FOUND_PATTERNS = [
  /not found/i,
  /does not exist/i,
  /unknown symbol/i,
  /invalid ticker/i
];

/**
 * Detects if an error indicates quota exceeded (more specific than rate limiting)
 */
export function isQuotaExceededError(error: Error | string, statusCode?: number): boolean {
  const message = typeof error === 'string' ? error : error.message;
  return QUOTA_EXCEEDED_PATTERNS.some(pattern => pattern.test(message));
}

/**
 * Detects if an error indicates rate limiting
 */
export function isRateLimitError(error: Error | string, statusCode?: number): boolean {
  // First check if it's a quota error - those take precedence
  if (isQuotaExceededError(error, statusCode)) {
    return false;
  }
  
  if (statusCode === 429) return true;
  
  const message = typeof error === 'string' ? error : error.message;
  return RATE_LIMIT_PATTERNS.some(pattern => pattern.test(message));
}

/**
 * Detects if an error is authentication-related
 */
export function isAuthError(error: Error | string, statusCode?: number): boolean {
  if (statusCode === 401 || statusCode === 403) return true;
  
  const message = typeof error === 'string' ? error : error.message;
  return AUTH_ERROR_PATTERNS.some(pattern => pattern.test(message));
}

/**
 * Detects if an error is timeout-related
 */
export function isTimeoutError(error: Error | string, statusCode?: number): boolean {
  if (statusCode === 408 || statusCode === 504) return true;
  
  const message = typeof error === 'string' ? error : error.message;
  return TIMEOUT_PATTERNS.some(pattern => pattern.test(message));
}

/**
 * Detects if an error indicates resource not found
 */
export function isNotFoundError(error: Error | string, statusCode?: number): boolean {
  if (statusCode === 404) return true;
  
  const message = typeof error === 'string' ? error : error.message;
  return NOT_FOUND_PATTERNS.some(pattern => pattern.test(message));
}

/**
 * Determines if an error is retryable based on its type and characteristics
 */
export function isRetryableError(error: Error | APIError | string, statusCode?: number): boolean {
  // If it's our custom APIError, use the retryable property
  if (error instanceof APIError) {
    return error.retryable;
  }

  // Check for specific retryable conditions
  if (isRateLimitError(error, statusCode)) return true;
  if (isTimeoutError(error, statusCode)) return true;
  if (statusCode && statusCode >= 500 && statusCode < 600) return true; // Server errors

  // Check for network errors
  const message = (typeof error === 'string' ? error : error.message).toLowerCase();
  if (message.includes('network') || message.includes('connection') || message.includes('enotfound')) {
    return true;
  }

  return false;
}

/**
 * Classifies an error and returns appropriate APIError
 */
export function classifyError(error: Error | string, statusCode?: number, service?: string): APIError {
  const message = typeof error === 'string' ? error : error.message;
  const actualStatusCode = statusCode || 500;
  
  if (isQuotaExceededError(error, statusCode)) {
    return new QuotaExceededError(service || 'API');
  }
  
  if (isRateLimitError(error, statusCode)) {
    return new RateLimitError(service || 'API');
  }
  
  if (isAuthError(error, statusCode)) {
    return new AuthenticationError(service || 'API');
  }
  
  if (isTimeoutError(error, statusCode)) {
    return new APIError(
      ERROR_TYPES.TIMEOUT_ERROR,
      `Request timeout${service ? ` for ${service}` : ''}`,
      actualStatusCode,
      message,
      true
    );
  }
  
  if (isNotFoundError(error, statusCode)) {
    return new APIError(
      ERROR_TYPES.DATA_FETCH_ERROR,
      message,
      404,
      `Resource not found${service ? ` in ${service}` : ''}`,
      false
    );
  }
  
  if (actualStatusCode >= 500 && actualStatusCode < 600) {
    return new ServiceUnavailableError(service || 'API', message);
  }
  
  // Default to internal error
  return new APIError(
    ERROR_TYPES.INTERNAL_ERROR,
    message,
    actualStatusCode,
    `Unexpected error${service ? ` in ${service}` : ''}`,
    isRetryableError(error, statusCode)
  );
}

/**
 * Retry configuration options
 */
export interface RetryConfig {
  maxRetries: number;
  baseDelay: number; // Base delay in milliseconds
  maxDelay: number;  // Maximum delay in milliseconds
  exponentialBase: number; // Base for exponential backoff (default: 2)
  jitter: boolean; // Add randomization to prevent thundering herd
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 30000, // 30 seconds
  exponentialBase: 2,
  jitter: true
};

/**
 * Calculates the delay for a retry attempt using exponential backoff
 */
function calculateDelay(attempt: number, config: RetryConfig): number {
  const exponentialDelay = config.baseDelay * Math.pow(config.exponentialBase, attempt);
  const cappedDelay = Math.min(exponentialDelay, config.maxDelay);
  
  if (config.jitter) {
    // Add ±25% jitter to prevent thundering herd
    const jitterRange = cappedDelay * 0.25;
    const jitter = (Math.random() - 0.5) * 2 * jitterRange;
    return Math.max(0, cappedDelay + jitter);
  }
  
  return cappedDelay;
}

/**
 * Executes a function with retry logic for handling transient failures
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  config: Partial<RetryConfig> = {},
  context?: string
): Promise<T> {
  const fullConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  let lastError: Error = new Error('Unknown error');
  
  for (let attempt = 0; attempt <= fullConfig.maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        const delay = calculateDelay(attempt - 1, fullConfig);
        if (context) {
          console.log(`[Retry] ${context}: Attempt ${attempt + 1}/${fullConfig.maxRetries + 1} after ${delay.toFixed(0)}ms delay`);
        }
        await new Promise(resolve => setTimeout(resolve, delay));
      }
      
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (context) {
        console.warn(`[Retry] ${context}: Attempt ${attempt + 1} failed:`, lastError.message);
      }
      
      // Don't retry if we've exhausted attempts
      if (attempt >= fullConfig.maxRetries) {
        break;
      }
      
      // Don't retry if error is not retryable
      if (!isRetryableError(lastError)) {
        if (context) {
          console.log(`[Retry] ${context}: Error not retryable, stopping retry attempts`);
        }
        break;
      }
    }
  }
  
  // If we get here, all retries failed
  throw lastError;
}

/**
 * Higher-order function that wraps an async function with retry logic
 */
export function withRetryable<TArgs extends unknown[], TReturn>(
  fn: (...args: TArgs) => Promise<TReturn>,
  config: Partial<RetryConfig> = {},
  context?: string
) {
  return async (...args: TArgs): Promise<TReturn> => {
    return withRetry(() => fn(...args), config, context);
  };
}

/**
 * Creates standardized error responses for API routes
 */
export function createErrorResponse(error: APIError | Error | string, fallbackStatus: number = 500) {
  let apiError: StockAPIError;
  
  if (error instanceof APIError) {
    apiError = error.toAPIResponse();
  } else if (error instanceof Error) {
    const classified = classifyError(error);
    apiError = classified.toAPIResponse();
  } else {
    // Handle string error case
    const classified = classifyError(new Error(error), fallbackStatus);
    apiError = classified.toAPIResponse();
  }
  
  return {
    success: false,
    error: apiError,
    timestamp: new Date().toISOString()
  };
}

/**
 * Logs errors with consistent formatting and context
 */
export function logError(error: Error | APIError | string, context: string, additionalData?: Record<string, unknown>) {
  const timestamp = new Date().toISOString();
  const errorMessage = typeof error === 'string' ? error : error.message;
  
  console.error(`[${timestamp}] [${context}] Error:`, {
    message: errorMessage,
    ...(error instanceof APIError && {
      errorType: error.errorType,
      statusCode: error.statusCode,
      retryable: error.retryable
    }),
    ...(error instanceof Error && error.stack && { stack: error.stack }),
    ...additionalData
  });
}