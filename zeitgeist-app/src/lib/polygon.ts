import axios from 'axios';
import { format, subDays } from 'date-fns';
import { 
  StockData, 
  CompanyDetails, 
  StockHistoryData, 
  StockPriceData,
  StockAPIError 
} from '@/types/stock';

const POLYGON_BASE_URL = 'https://api.polygon.io';
const API_KEY = process.env.POLYGON_API_KEY;

if (!API_KEY) {
  throw new Error('POLYGON_API_KEY environment variable is required');
}

// Create axios instance with default config
const polygonAPI = axios.create({
  baseURL: POLYGON_BASE_URL,
  timeout: 10000, // 10 second timeout
  params: {
    apikey: API_KEY,
  },
});

/**
 * Fetches the latest stock data for a given ticker symbol
 * Uses the previous trading day's data as "current" price
 */
export async function getStockData(ticker: string): Promise<StockData> {
  try {
    const formattedTicker = ticker.toUpperCase().trim();
    
    // Get previous day's aggregate data (most recent complete trading day)
    const response = await polygonAPI.get(`/v2/aggs/ticker/${formattedTicker}/prev`);
    
    if (response.data.status !== 'OK') {
      throw new Error(`Polygon API error: ${response.data.status}`);
    }

    if (!response.data.results || response.data.results.length === 0) {
      throw new Error(`No data found for ticker: ${formattedTicker}`);
    }

    const result = response.data.results[0];
    
    // Calculate change and change percentage
    const currentPrice = result.c; // close price
    const previousClose = result.o; // open price (previous day's close)
    const change = currentPrice - previousClose;
    const changePercent = (change / previousClose) * 100;

    // Get current market status (simplified - could be enhanced with real-time data)
    const now = new Date();
    const marketHours = now.getHours();
    const isWeekday = now.getDay() >= 1 && now.getDay() <= 5;
    const marketStatus = isWeekday && marketHours >= 9 && marketHours < 16 ? 'open' : 'closed';

    const stockData: StockData = {
      ticker: formattedTicker,
      name: formattedTicker, // Will be enriched with company details
      market: 'stocks',
      locale: 'us',
      primary_exchange: 'NASDAQ', // Default - could be enhanced
      type: 'CS', // Common Stock
      
      price: currentPrice,
      previous_close: previousClose,
      change: change,
      change_percent: changePercent,
      
      volume: result.v,
      volume_weighted_average_price: result.vw,
      
      open: result.o,
      high: result.h,
      low: result.l,
      
      timestamp: result.t,
      updated: new Date().toISOString(),
      
      market_status: marketStatus,
      currency: 'USD',
    };

    return stockData;
    
  } catch (error) {
    console.error('Error fetching stock data:', error);
    
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 401) {
        throw new Error('Invalid Polygon.io API key');
      } else if (error.response?.status === 403) {
        throw new Error('Polygon.io API access forbidden - check your subscription');
      } else if (error.response?.status === 429) {
        throw new Error('Polygon.io API rate limit exceeded');
      } else if (error.response?.status === 404) {
        throw new Error(`Stock ticker "${ticker}" not found`);
      }
    }
    
    throw new Error(`Failed to fetch stock data: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Fetches historical stock data for the past 30 days
 */
export async function getStockHistory(ticker: string, days: number = 30): Promise<StockPriceData[]> {
  try {
    const formattedTicker = ticker.toUpperCase().trim();
    
    // Calculate date range
    const endDate = new Date();
    const startDate = subDays(endDate, days);
    
    const fromDate = format(startDate, 'yyyy-MM-dd');
    const toDate = format(endDate, 'yyyy-MM-dd');
    
    // Get aggregates for date range
    const response = await polygonAPI.get(
      `/v2/aggs/ticker/${formattedTicker}/range/1/day/${fromDate}/${toDate}`,
      {
        params: {
          adjusted: 'true',
          sort: 'asc',
        },
      }
    );
    
    if (response.data.status !== 'OK') {
      throw new Error(`Polygon API error: ${response.data.status}`);
    }

    if (!response.data.results || response.data.results.length === 0) {
      throw new Error(`No historical data found for ticker: ${formattedTicker}`);
    }

    // Transform the data to match our interface
    const priceData: StockPriceData[] = response.data.results.map((item: any) => ({
      open: item.o,
      high: item.h,
      low: item.l,
      close: item.c,
      volume: item.v,
      timestamp: item.t,
      date: format(new Date(item.t), 'yyyy-MM-dd'),
      vwap: item.vw,
      transactions: item.n,
    }));

    return priceData;
    
  } catch (error) {
    console.error('Error fetching stock history:', error);
    
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 401) {
        throw new Error('Invalid Polygon.io API key');
      } else if (error.response?.status === 403) {
        throw new Error('Polygon.io API access forbidden - check your subscription');
      } else if (error.response?.status === 429) {
        throw new Error('Polygon.io API rate limit exceeded');
      } else if (error.response?.status === 404) {
        throw new Error(`Stock ticker "${ticker}" not found`);
      }
    }
    
    throw new Error(`Failed to fetch stock history: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Fetches company details for a given ticker symbol
 */
export async function getCompanyDetails(ticker: string): Promise<CompanyDetails> {
  try {
    const formattedTicker = ticker.toUpperCase().trim();
    
    // Get ticker details from reference endpoint
    const response = await polygonAPI.get(`/v3/reference/tickers/${formattedTicker}`);
    
    if (response.data.status !== 'OK') {
      throw new Error(`Polygon API error: ${response.data.status}`);
    }

    if (!response.data.results) {
      throw new Error(`No company details found for ticker: ${formattedTicker}`);
    }

    const result = response.data.results;
    
    const companyDetails: CompanyDetails = {
      ticker: formattedTicker,
      name: result.name || formattedTicker,
      description: result.description,
      homepage_url: result.homepage_url,
      logo_url: result.branding?.logo_url,
      list_date: result.list_date,
      market_cap: result.market_cap,
      weighted_shares_outstanding: result.weighted_shares_outstanding,
      total_employees: result.total_employees,
      
      sic_code: result.sic_code,
      sic_description: result.sic_description,
      
      address: result.address ? {
        address1: result.address.address1,
        city: result.address.city,
        state: result.address.state,
        postal_code: result.address.postal_code,
      } : undefined,
      
      phone_number: result.phone_number,
    };

    return companyDetails;
    
  } catch (error) {
    console.error('Error fetching company details:', error);
    
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 401) {
        throw new Error('Invalid Polygon.io API key');
      } else if (error.response?.status === 403) {
        throw new Error('Polygon.io API access forbidden - check your subscription');
      } else if (error.response?.status === 429) {
        throw new Error('Polygon.io API rate limit exceeded');
      } else if (error.response?.status === 404) {
        throw new Error(`Company details for ticker "${ticker}" not found`);
      }
    }
    
    throw new Error(`Failed to fetch company details: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Validates if a stock ticker symbol is properly formatted
 */
export function validateStockTicker(ticker: string): { isValid: boolean; formattedTicker: string; error?: string } {
  if (!ticker || typeof ticker !== 'string') {
    return { isValid: false, formattedTicker: '', error: 'Ticker symbol is required' };
  }

  const cleaned = ticker.trim().toUpperCase();
  
  // Basic validation - alphanumeric characters only, 1-5 characters
  const isValidFormat = /^[A-Z]{1,5}$/.test(cleaned);
  
  if (!isValidFormat) {
    return { 
      isValid: false, 
      formattedTicker: cleaned, 
      error: 'Ticker symbol must be 1-5 alphabetic characters' 
    };
  }

  return { isValid: true, formattedTicker: cleaned };
}

/**
 * Utility function to handle API errors consistently
 */
export function createAPIError(message: string, statusCode?: number, details?: string): StockAPIError {
  return {
    error: 'POLYGON_API_ERROR',
    message,
    status_code: statusCode,
    details,
  };
}

/**
 * Utility function to check if market is currently open (simplified)
 * This is a basic implementation - could be enhanced with real market hours and holidays
 */
export function isMarketOpen(): boolean {
  const now = new Date();
  const day = now.getDay(); // 0 = Sunday, 6 = Saturday
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const totalMinutes = hours * 60 + minutes;
  
  // Market is closed on weekends
  if (day === 0 || day === 6) {
    return false;
  }
  
  // Market hours: 9:30 AM to 4:00 PM ET (simplified, doesn't account for timezone)
  const marketOpen = 9 * 60 + 30; // 9:30 AM
  const marketClose = 16 * 60; // 4:00 PM
  
  return totalMinutes >= marketOpen && totalMinutes < marketClose;
}

/**
 * Enhanced function that combines stock data with company details
 */
export async function getCompleteStockInfo(ticker: string): Promise<{ stockData: StockData; companyDetails: CompanyDetails }> {
  try {
    // Validate ticker first
    const validation = validateStockTicker(ticker);
    if (!validation.isValid) {
      throw new Error(validation.error);
    }

    // Fetch both stock data and company details in parallel
    const [stockData, companyDetails] = await Promise.all([
      getStockData(validation.formattedTicker),
      getCompanyDetails(validation.formattedTicker),
    ]);

    // Enrich stock data with company name
    stockData.name = companyDetails.name;
    stockData.market_cap = companyDetails.market_cap;
    stockData.shares_outstanding = companyDetails.weighted_shares_outstanding;

    return { stockData, companyDetails };
    
  } catch (error) {
    throw new Error(`Failed to fetch complete stock info: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}