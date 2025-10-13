"use client";

import React, { Component, ReactNode, useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  RefreshCw, 
  Wifi, 
  Clock, 
  Shield, 
  Key, 
  Server, 
  Search,
  Bug,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Copy,
  CheckCircle2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { StockAPIError } from '@/types/stock';
import { ERROR_TYPES, isRetryableError, classifyError, APIError } from '@/lib/api-errors';

interface ErrorDisplayProps {
  error: StockAPIError | Error | string | null;
  onRetry?: () => void;
  retryDelay?: number;
  className?: string;
  variant?: 'default' | 'compact' | 'inline';
  showDetails?: boolean;
  context?: string;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: Error, retry: () => void) => ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

// Error message mapping for user-friendly display
const ERROR_MESSAGES: Record<string, { title: string; message: string; icon: React.ComponentType<any>; suggestions: string[] }> = {
  [ERROR_TYPES.INVALID_TICKER]: {
    title: 'Invalid Stock Symbol',
    message: 'Please enter a valid stock ticker symbol (e.g., AAPL, MSFT, GOOGL)',
    icon: Search,
    suggestions: [
      'Check spelling of the stock symbol',
      'Use only letters (A-Z) and numbers',
      'Try common symbols like AAPL, MSFT, GOOGL',
      'Make sure the stock is publicly traded'
    ]
  },
  [ERROR_TYPES.POLYGON_API_ERROR]: {
    title: 'Stock Data Service Issue',
    message: 'Unable to fetch stock data from our data provider',
    icon: Server,
    suggestions: [
      'Try again in a few moments',
      'Check your internet connection',
      'The stock market may be closed',
      'Contact support if the issue persists'
    ]
  },
  [ERROR_TYPES.OPENAI_API_ERROR]: {
    title: 'Analysis Service Issue',
    message: 'Unable to generate AI analysis at the moment',
    icon: Server,
    suggestions: [
      'Try again in a few moments',
      'The AI service may be experiencing high demand',
      'Basic stock data may still be available',
      'Contact support if the issue persists'
    ]
  },
  [ERROR_TYPES.RATE_LIMIT_ERROR]: {
    title: 'Too Many Requests',
    message: 'Please wait a moment before making another request',
    icon: Clock,
    suggestions: [
      'Wait 30-60 seconds before trying again',
      'Avoid making rapid successive requests',
      'Consider upgrading for higher limits',
      'The limit will reset automatically'
    ]
  },
  [ERROR_TYPES.AUTH_ERROR]: {
    title: 'Authentication Failed',
    message: 'Unable to authenticate with external services',
    icon: Key,
    suggestions: [
      'This is a temporary service configuration issue',
      'Try again in a few minutes',
      'Contact support if the issue persists',
      'All data services should be restored soon'
    ]
  },
  [ERROR_TYPES.TIMEOUT_ERROR]: {
    title: 'Request Timeout',
    message: 'The request took too long to complete',
    icon: Clock,
    suggestions: [
      'Check your internet connection',
      'Try again with a more stable connection',
      'The service may be experiencing high load',
      'Consider trying a different stock symbol'
    ]
  },
  [ERROR_TYPES.SERVICE_UNAVAILABLE]: {
    title: 'Service Temporarily Unavailable',
    message: 'Our services are temporarily unavailable',
    icon: Server,
    suggestions: [
      'Try again in a few minutes',
      'The service is likely undergoing maintenance',
      'Check our status page for updates',
      'Contact support if the issue persists'
    ]
  },
  [ERROR_TYPES.DATA_FETCH_ERROR]: {
    title: 'Data Not Found',
    message: 'Unable to find data for the requested stock',
    icon: Search,
    suggestions: [
      'Verify the stock symbol is correct',
      'Try a different stock symbol',
      'The stock may not be actively traded',
      'Check if the market is open'
    ]
  },
  [ERROR_TYPES.INTERNAL_ERROR]: {
    title: 'Internal Server Error',
    message: 'Something went wrong on our end',
    icon: Bug,
    suggestions: [
      'Try refreshing the page',
      'Wait a few minutes and try again',
      'Clear your browser cache',
      'Contact support with error details'
    ]
  }
};

const NETWORK_ERROR_INFO = {
  title: 'Network Connection Issue',
  message: 'Unable to connect to our servers',
  icon: Wifi,
  suggestions: [
    'Check your internet connection',
    'Try refreshing the page',
    'Disable VPN if you\'re using one',
    'Contact your network administrator'
  ]
};

const GENERIC_ERROR_INFO = {
  title: 'Something Went Wrong',
  message: 'An unexpected error occurred',
  icon: AlertTriangle,
  suggestions: [
    'Try refreshing the page',
    'Clear your browser cache',
    'Try again in a few minutes',
    'Contact support if the issue persists'
  ]
};

// Get error information for display
function getErrorInfo(error: StockAPIError | Error | string): typeof ERROR_MESSAGES[string] {
  // Handle StockAPIError
  if (error && typeof error === 'object' && 'error' in error) {
    return ERROR_MESSAGES[error.error] || GENERIC_ERROR_INFO;
  }
  
  // Handle Error objects
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    
    // Check for network errors
    if (message.includes('network') || message.includes('fetch') || message.includes('connection')) {
      return NETWORK_ERROR_INFO;
    }
    
    // Classify the error
    const classified = classifyError(error);
    return ERROR_MESSAGES[classified.errorType] || GENERIC_ERROR_INFO;
  }
  
  // Handle string errors
  if (typeof error === 'string') {
    const message = error.toLowerCase();
    
    if (message.includes('network') || message.includes('connection')) {
      return NETWORK_ERROR_INFO;
    }
    
    // Try to classify string error
    const classified = classifyError(new Error(error));
    return ERROR_MESSAGES[classified.errorType] || GENERIC_ERROR_INFO;
  }
  
  return GENERIC_ERROR_INFO;
}

// Check if error is retryable
function isErrorRetryable(error: StockAPIError | Error | string): boolean {
  if (error && typeof error === 'object' && 'error' in error) {
    return [
      ERROR_TYPES.POLYGON_API_ERROR,
      ERROR_TYPES.OPENAI_API_ERROR,
      ERROR_TYPES.RATE_LIMIT_ERROR,
      ERROR_TYPES.TIMEOUT_ERROR,
      ERROR_TYPES.SERVICE_UNAVAILABLE,
      ERROR_TYPES.INTERNAL_ERROR
    ].includes(error.error as any);
  }
  
  if (error instanceof Error) {
    return isRetryableError(error);
  }
  
  if (typeof error === 'string') {
    return isRetryableError(new Error(error));
  }
  
  return false;
}

// Copy to clipboard functionality
const CopyButton = ({ text, label = "Copy error details" }: { text: string; label?: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
      title={label}
    >
      {copied ? (
        <>
          <CheckCircle2 className="h-3 w-3" />
          Copied!
        </>
      ) : (
        <>
          <Copy className="h-3 w-3" />
          Copy
        </>
      )}
    </button>
  );
};

// Auto-retry countdown
const RetryCountdown = ({ delay, onComplete }: { delay: number; onComplete: () => void }) => {
  const [countdown, setCountdown] = useState(Math.ceil(delay / 1000));

  useEffect(() => {
    if (countdown <= 0) {
      onComplete();
      return;
    }

    const timer = setTimeout(() => {
      setCountdown(countdown - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown, onComplete]);

  return (
    <span className="text-muted-foreground">
      Auto-retry in {countdown}s...
    </span>
  );
};

export function ErrorDisplay({
  error,
  onRetry,
  retryDelay = 0,
  className,
  variant = 'default',
  showDetails = false,
  context
}: ErrorDisplayProps) {
  const [showFullDetails, setShowFullDetails] = useState(showDetails);
  const [autoRetrying, setAutoRetrying] = useState(false);

  if (!error) return null;

  const errorInfo = getErrorInfo(error);
  const isRetryable = isErrorRetryable(error) && !!onRetry;
  const IconComponent = errorInfo.icon;

  // Auto-retry for retryable errors with delay
  useEffect(() => {
    if (isRetryable && retryDelay > 0 && onRetry) {
      setAutoRetrying(true);
    }
  }, [error, isRetryable, retryDelay, onRetry]);

  const handleRetry = () => {
    setAutoRetrying(false);
    onRetry?.();
  };

  // Get error details for copy
  const getErrorDetails = () => {
    const timestamp = new Date().toISOString();
    let details = `Error Details (${timestamp})\n`;
    details += `Context: ${context || 'Unknown'}\n`;
    
    if (typeof error === 'object' && 'error' in error) {
      details += `Type: ${error.error}\n`;
      details += `Message: ${error.message}\n`;
      if (error.status_code) details += `Status Code: ${error.status_code}\n`;
      if (error.details) details += `Details: ${error.details}\n`;
    } else if (error instanceof Error) {
      details += `Type: ${error.name}\n`;
      details += `Message: ${error.message}\n`;
      if (error.stack) details += `Stack: ${error.stack}\n`;
    } else {
      details += `Message: ${error}\n`;
    }
    
    return details;
  };

  // Compact variant for inline display
  if (variant === 'compact') {
    return (
      <div className={cn("flex items-center gap-2 text-sm", className)}>
        <IconComponent className="h-4 w-4 text-destructive flex-shrink-0" />
        <span className="text-destructive">{errorInfo.title}</span>
        {isRetryable && (
          <button
            onClick={handleRetry}
            disabled={autoRetrying}
            className="text-primary hover:text-primary/80 underline text-xs"
          >
            Retry
          </button>
        )}
      </div>
    );
  }

  // Inline variant for form errors
  if (variant === 'inline') {
    return (
      <div className={cn("flex items-start gap-2 text-sm text-destructive", className)}>
        <IconComponent className="h-4 w-4 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <p>{errorInfo.message}</p>
          {isRetryable && (
            <button
              onClick={handleRetry}
              disabled={autoRetrying}
              className="text-primary hover:text-primary/80 underline text-xs mt-1"
            >
              Try again
            </button>
          )}
        </div>
      </div>
    );
  }

  // Default variant with full error display
  return (
    <div className={cn("bg-card border border-destructive/20 rounded-lg p-6 space-y-4", className)}>
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 p-2 bg-destructive/10 rounded-full">
          <IconComponent className="h-5 w-5 text-destructive" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground">{errorInfo.title}</h3>
          <p className="text-muted-foreground text-sm mt-1">{errorInfo.message}</p>
          {context && (
            <p className="text-xs text-muted-foreground mt-1">
              Context: {context}
            </p>
          )}
        </div>
      </div>

      {/* Suggestions */}
      {errorInfo.suggestions.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium text-sm flex items-center gap-1">
            <HelpCircle className="h-4 w-4" />
            What you can try:
          </h4>
          <ul className="space-y-1">
            {errorInfo.suggestions.map((suggestion, index) => (
              <li key={index} className="flex gap-2 text-sm text-muted-foreground">
                <span className="text-primary mt-1">•</span>
                <span>{suggestion}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-2 border-t border-border">
        <div className="flex items-center gap-3">
          {isRetryable && (
            <>
              {autoRetrying && retryDelay > 0 ? (
                <div className="flex items-center gap-2 text-sm">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <RetryCountdown delay={retryDelay} onComplete={handleRetry} />
                </div>
              ) : (
                <button
                  onClick={handleRetry}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors text-sm font-medium"
                >
                  <RefreshCw className="h-4 w-4" />
                  Try Again
                </button>
              )}
            </>
          )}
        </div>

        {/* Error Details Toggle */}
        <div className="flex items-center gap-2">
          <CopyButton text={getErrorDetails()} />
          <button
            onClick={() => setShowFullDetails(!showFullDetails)}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {showFullDetails ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            {showFullDetails ? 'Hide' : 'Show'} Details
          </button>
        </div>
      </div>

      {/* Error Details */}
      {showFullDetails && (
        <div className="pt-3 border-t border-border">
          <div className="bg-muted/30 rounded-md p-3">
            <div className="text-xs space-y-1 font-mono">
              {typeof error === 'object' && 'error' in error ? (
                <>
                  <div><strong>Type:</strong> {error.error}</div>
                  <div><strong>Message:</strong> {error.message}</div>
                  {error.status_code && <div><strong>Status:</strong> {error.status_code}</div>}
                  {error.details && <div><strong>Details:</strong> {error.details}</div>}
                </>
              ) : error instanceof Error ? (
                <>
                  <div><strong>Type:</strong> {error.name}</div>
                  <div><strong>Message:</strong> {error.message}</div>
                </>
              ) : (
                <div><strong>Error:</strong> {error}</div>
              )}
              <div><strong>Timestamp:</strong> {new Date().toISOString()}</div>
              {context && <div><strong>Context:</strong> {context}</div>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Error Boundary Component
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({
      error,
      errorInfo
    });

    // Log error
    console.error('ErrorBoundary caught an error:', error);
    console.error('Error info:', errorInfo);

    // Call onError callback if provided
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.handleRetry);
      }

      // Default error boundary display
      return (
        <ErrorDisplay
          error={this.state.error}
          onRetry={this.handleRetry}
          context="React Error Boundary"
          showDetails={false}
        />
      );
    }

    return this.props.children;
  }
}

// Higher-order component for wrapping components with error boundary
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  return WrappedComponent;
}

export default ErrorDisplay;