/**
 * Stock-related utility functions that don't require API access
 * These can be used safely in client-side components
 */

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