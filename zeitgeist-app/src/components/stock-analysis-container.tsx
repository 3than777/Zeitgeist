"use client";

import React, { useState, useCallback, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { 
  StockData, 
  CompanyDetails, 
  StockPriceData, 
  StockAnalysis, 
  StockAPIError,
  LoadingState 
} from '@/types/stock';

// Import all the components we've built
import StockInput from './stock-input';
import StockLoading from './stock-loading';
import StockPriceDisplay from './stock-price-display';
import StockChart from './stock-chart';
import AnalysisDisplay from './analysis-display';
import ErrorDisplay from './error-display';

interface StockAnalysisContainerProps {
  className?: string;
  autoFocus?: boolean;
  showWelcome?: boolean;
  defaultTicker?: string;
}

interface AnalysisState {
  stockData: StockData | null;
  companyDetails: CompanyDetails | null;
  priceHistory: StockPriceData[] | null;
  analysis: StockAnalysis | null;
  error: StockAPIError | Error | string | null;
  loading: LoadingState;
  lastSearchTicker: string | null;
  searchTimestamp: number | null;
}

const INITIAL_STATE: AnalysisState = {
  stockData: null,
  companyDetails: null,
  priceHistory: null,
  analysis: null,
  error: null,
  loading: {
    fetching_stock_data: false,
    fetching_analysis: false,
    error: null
  },
  lastSearchTicker: null,
  searchTimestamp: null
};

export function StockAnalysisContainer({
  className,
  autoFocus = false,
  showWelcome = true,
  defaultTicker
}: StockAnalysisContainerProps) {
  const [state, setState] = useState<AnalysisState>(INITIAL_STATE);

  // Reset state when starting new search
  const resetState = useCallback(() => {
    setState(INITIAL_STATE);
  }, []);

  // Handle the main stock analysis search
  const handleStockSearch = useCallback(async (ticker: string) => {
    // Reset previous state
    resetState();
    
    // Set loading state
    setState(prev => ({
      ...prev,
      loading: {
        fetching_stock_data: true,
        fetching_analysis: false,
        error: null
      },
      lastSearchTicker: ticker,
      searchTimestamp: Date.now()
    }));

    try {
      // Call the combined stock analysis API
      const response = await fetch('/api/stock-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ticker,
          options: {
            include_history: true,
            days_history: 30,
            analysis_options: {
              include_fallback: true,
              max_retries: 2
            }
          }
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error?.message || 'Failed to fetch stock analysis');
      }

      // Update state with successful results
      setState(prev => ({
        ...prev,
        stockData: data.data.stock_data,
        companyDetails: data.data.company_details,
        priceHistory: data.data.price_history || null,
        analysis: data.data.analysis,
        error: null,
        loading: {
          fetching_stock_data: false,
          fetching_analysis: false,
          error: null
        }
      }));

    } catch (error) {
      console.error('Stock analysis error:', error);
      
      // Update state with error
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : String(error),
        loading: {
          fetching_stock_data: false,
          fetching_analysis: false,
          error: error instanceof Error ? error.message : String(error)
        }
      }));
    }
  }, [resetState]);

  // Handle retry functionality
  const handleRetry = useCallback(() => {
    if (state.lastSearchTicker) {
      handleStockSearch(state.lastSearchTicker);
    }
  }, [state.lastSearchTicker, handleStockSearch]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Cmd/Ctrl + R to retry
      if ((event.metaKey || event.ctrlKey) && event.key === 'r' && state.lastSearchTicker) {
        event.preventDefault();
        handleRetry();
      }
      // Escape to clear results
      if (event.key === 'Escape' && !state.loading.fetching_stock_data && !state.loading.fetching_analysis) {
        resetState();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state.lastSearchTicker, state.loading, handleRetry, resetState]);

  // Auto-search default ticker on mount
  useEffect(() => {
    if (defaultTicker && !state.lastSearchTicker) {
      handleStockSearch(defaultTicker);
    }
  }, [defaultTicker, state.lastSearchTicker, handleStockSearch]);

  const isLoading = state.loading.fetching_stock_data || state.loading.fetching_analysis;
  const hasData = state.stockData && state.analysis;
  const hasError = !!state.error;

  return (
    <div className={cn("w-full max-w-6xl mx-auto space-y-6", className)}>
      {/* Welcome Section */}
      {showWelcome && !hasData && !isLoading && !hasError && (
        <div className="text-center py-8 space-y-4">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">
              AI-Powered Stock Analysis
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Get comprehensive analysis of any stock with real-time data and AI insights. 
              Enter a ticker symbol to get started.
            </p>
          </div>
          
          {/* Popular stocks quick access */}
          <div className="flex flex-wrap justify-center gap-2 pt-4">
            {['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'NVDA'].map((ticker) => (
              <button
                key={ticker}
                onClick={() => handleStockSearch(ticker)}
                className="px-3 py-1 text-sm bg-muted hover:bg-accent hover:text-accent-foreground rounded-md transition-colors"
              >
                {ticker}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Search Input */}
      <div className="flex justify-center">
        <StockInput
          onSearch={handleStockSearch}
          isLoading={isLoading}
          autoFocus={autoFocus}
          className="w-full max-w-md"
          showSuggestions={true}
        />
      </div>

      {/* Loading State */}
      {isLoading && (
        <StockLoading 
          variant="default"
          showMessages={true}
          className="animate-in fade-in-50 duration-500"
        />
      )}

      {/* Error State */}
      {hasError && (
        <div className="animate-in fade-in-50 duration-300">
          <ErrorDisplay
            error={state.error}
            onRetry={handleRetry}
            context={`Stock analysis for ${state.lastSearchTicker}`}
            className="max-w-2xl mx-auto"
          />
        </div>
      )}

      {/* Results */}
      {hasData && !isLoading && (
        <div className="space-y-6 animate-in fade-in-50 duration-500">
          {/* Stock Price Display */}
          <StockPriceDisplay
            stockData={state.stockData!}
            variant="detailed"
            showLastUpdate={true}
            showMarketStatus={true}
          />

          {/* Price Chart */}
          {state.priceHistory && state.priceHistory.length > 0 && (
            <StockChart
              data={state.priceHistory}
              ticker={state.stockData!.ticker}
              showVolume={false}
              showControls={true}
              height={400}
            />
          )}

          {/* AI Analysis */}
          <AnalysisDisplay
            analysis={state.analysis!}
            showRawAnalysis={false}
          />

          {/* Additional Actions */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-border">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>💡 Tip: Press</span>
              <kbd className="px-2 py-1 bg-muted rounded text-xs">Cmd+R</kbd>
              <span>to refresh or</span>
              <kbd className="px-2 py-1 bg-muted rounded text-xs">Esc</kbd>
              <span>to clear</span>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={handleRetry}
                className="px-4 py-2 text-sm bg-secondary hover:bg-secondary/80 rounded-md transition-colors"
              >
                Refresh Analysis
              </button>
              <button
                onClick={resetState}
                className="px-4 py-2 text-sm border border-border hover:bg-accent hover:text-accent-foreground rounded-md transition-colors"
              >
                New Search
              </button>
            </div>
          </div>

          {/* Analysis Metadata */}
          <div className="text-center text-xs text-muted-foreground border-t border-border pt-4">
            <p>
              Analysis completed in {state.searchTimestamp ? `${Date.now() - state.searchTimestamp}ms` : 'unknown time'} • 
              Data from Polygon.io • Analysis by {state.analysis?.model_used || 'AI'} • 
              This is not financial advice
            </p>
          </div>
        </div>
      )}

      {/* Empty state helper */}
      {!hasData && !isLoading && !hasError && !showWelcome && (
        <div className="text-center py-12 text-muted-foreground">
          <p>Search for a stock symbol to get started</p>
        </div>
      )}
    </div>
  );
}

export default StockAnalysisContainer;