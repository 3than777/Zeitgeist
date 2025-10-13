// Stock data types for Polygon.io API responses and internal use

// Main stock data interface for current stock information
export interface StockData {
  // Basic stock information
  ticker: string;
  name: string;
  market: string;
  locale: string;
  primary_exchange: string;
  type: string;
  
  // Current price data
  price: number;
  previous_close: number;
  change: number;
  change_percent: number;
  
  // Volume and market data
  volume: number;
  volume_weighted_average_price?: number;
  
  // Trading session data
  open: number;
  high: number;
  low: number;
  
  // Timestamps
  timestamp: number;
  updated: string;
  
  // Market status
  market_status: 'open' | 'closed' | 'extended-hours';
  
  // Additional metadata
  currency?: string;
  market_cap?: number;
  shares_outstanding?: number;
}

// Company details interface for additional stock information
export interface CompanyDetails {
  ticker: string;
  name: string;
  description?: string;
  homepage_url?: string;
  logo_url?: string;
  list_date?: string;
  market_cap?: number;
  weighted_shares_outstanding?: number;
  total_employees?: number;
  
  // Industry classification
  sic_code?: string;
  sic_description?: string;
  
  // Contact information
  address?: {
    address1?: string;
    city?: string;
    state?: string;
    postal_code?: string;
  };
  phone_number?: string;
}

// Historical stock data for charts and analysis
export interface StockHistoryData {
  ticker: string;
  results: StockPriceData[];
  resultsCount: number;
  adjusted: boolean;
  queryCount: number;
  request_id: string;
  status: string;
}

// Individual price data point for charts
export interface StockPriceData {
  // OHLC data
  open: number;
  high: number;
  low: number;
  close: number;
  
  // Volume and timestamp
  volume: number;
  timestamp: number;
  
  // Formatted date for chart display
  date: string;
  
  // Volume weighted average price
  vwap?: number;
  
  // Number of transactions
  transactions?: number;
}

// GPT-5 stock analysis response interface
export interface StockAnalysis {
  // Analysis metadata
  ticker: string;
  company_name: string;
  analysis_timestamp: string;
  model_used: string;
  
  // Overall assessment
  summary: string;
  recommendation: 'STRONG_BUY' | 'BUY' | 'HOLD' | 'SELL' | 'STRONG_SELL';
  confidence_score: number; // 0-100
  
  // Detailed analysis sections
  technical_analysis: {
    trend: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
    support_levels: number[];
    resistance_levels: number[];
    key_indicators: string;
    short_term_outlook: string;
  };
  
  fundamental_analysis: {
    valuation: 'UNDERVALUED' | 'FAIRLY_VALUED' | 'OVERVALUED';
    financial_health: string;
    growth_prospects: string;
    competitive_position: string;
  };
  
  sentiment_analysis: {
    market_sentiment: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
    news_sentiment: string;
    social_sentiment?: string;
  };
  
  // Risk assessment
  risk_factors: string[];
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH';
  
  // Price targets and timeline
  price_targets: {
    short_term: number; // 1-3 months
    medium_term: number; // 3-12 months
    long_term: number; // 1+ years
  };
  
  // Key metrics and ratios mentioned
  key_metrics?: {
    pe_ratio?: number;
    market_cap?: number;
    revenue_growth?: number;
    profit_margin?: number;
  };
  
  // Additional insights
  catalysts: string[];
  concerns: string[];
  comparable_companies?: string[];
  
  // Raw analysis text for display
  raw_analysis: string;
}

// Error interfaces for API responses
export interface StockAPIError {
  error: string;
  message: string;
  status_code?: number;
  details?: string;
}

// Request/Response interfaces for our API routes
export interface StockAnalysisRequest {
  ticker: string;
  include_history?: boolean;
  days_history?: number;
}

export interface StockAnalysisResponse {
  success: boolean;
  data?: {
    stock_data: StockData;
    company_details?: CompanyDetails;
    price_history?: StockPriceData[];
    analysis: StockAnalysis;
  };
  error?: StockAPIError;
  timestamp: string;
}

// Chart-specific interfaces for UI components
export interface ChartDataPoint {
  date: string;
  price: number;
  volume?: number;
  change?: number;
}

export interface ChartConfig {
  timeframe: '1D' | '5D' | '1M' | '3M' | '6M' | '1Y';
  show_volume: boolean;
  chart_type: 'line' | 'candlestick' | 'area';
}

// Loading states for UI
export interface LoadingState {
  fetching_stock_data: boolean;
  fetching_analysis: boolean;
  error: string | null;
}

// Validation interfaces
export interface StockSymbolValidation {
  is_valid: boolean;
  formatted_symbol: string;
  error_message?: string;
}

// Cache interfaces for optimization
export interface CachedStockData {
  data: StockData;
  timestamp: number;
  expires_at: number;
}

export interface CachedAnalysis {
  analysis: StockAnalysis;
  timestamp: number;
  expires_at: number;
}