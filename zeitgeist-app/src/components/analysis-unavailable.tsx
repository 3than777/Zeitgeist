"use client";

import React from 'react';
import { AlertTriangle, Brain, ExternalLink, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AnalysisUnavailableProps {
  error: string;
  ticker: string;
  onRetry?: () => void;
  className?: string;
}

export function AnalysisUnavailable({ 
  error, 
  ticker, 
  onRetry, 
  className 
}: AnalysisUnavailableProps) {
  const isQuotaError = error.includes('quota') || error.includes('billing') || error.includes('insufficient_quota');
  const isRateLimitError = error.includes('rate limit') && !isQuotaError; // Don't show rate limit if it's actually a quota error
  const isAPIKeyError = error.includes('API key') || error.includes('401');

  return (
    <div className={cn("bg-card border border-destructive/20 rounded-lg p-6 space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-destructive/10 rounded-lg">
          <AlertTriangle className="h-6 w-6 text-destructive" />
        </div>
        <div>
          <h3 className="font-bold text-lg text-destructive">AI Analysis Unavailable</h3>
          <p className="text-sm text-muted-foreground">
            Unable to generate AI analysis for {ticker}
          </p>
        </div>
      </div>

      {/* Error Details */}
      <div className="space-y-4">
        <div className="p-4 bg-muted/30 rounded-lg border border-muted">
          <div className="flex items-start gap-3">
            <Brain className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Service Status</h4>
              <p className="text-sm text-muted-foreground">
                {isQuotaError && "Anthropic API quota has been exceeded. Please check billing and usage limits."}
                {isRateLimitError && "Rate limit exceeded. Please wait a few moments before trying again."}
                {isAPIKeyError && "Invalid or missing API key configuration."}
                {!isQuotaError && !isRateLimitError && !isAPIKeyError && "AI analysis service is currently unavailable."}
              </p>
              {error && (
                <details className="mt-2">
                  <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                    Technical details
                  </summary>
                  <code className="block mt-1 text-xs bg-muted p-2 rounded text-muted-foreground break-words">
                    {error.replace('AI_ANALYSIS_UNAVAILABLE: ', '')}
                  </code>
                </details>
              )}
            </div>
          </div>
        </div>

        {/* What's Available */}
        <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <h4 className="font-medium text-sm text-blue-900 dark:text-blue-100 mb-2">
            What&apos;s Still Available
          </h4>
          <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
            <li>• Real-time stock price and market data</li>
            <li>• Historical price charts and volume data</li>
            <li>• Basic stock information and company details</li>
          </ul>
        </div>

        {/* What's Missing */}
        <div className="p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
          <h4 className="font-medium text-sm text-amber-900 dark:text-amber-100 mb-2">
            Unavailable Features
          </h4>
          <ul className="text-sm text-amber-800 dark:text-amber-200 space-y-1">
            <li>• AI-powered technical analysis</li>
            <li>• Fundamental analysis and recommendations</li>
            <li>• Risk assessment and price targets</li>
            <li>• Market sentiment analysis</li>
            <li>• Investment insights and catalysts</li>
          </ul>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-3 pt-2">
          {onRetry && (
            <button
              onClick={onRetry}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors text-sm"
            >
              <RefreshCw className="h-4 w-4" />
              Retry Analysis
            </button>
          )}
          
          <a
            href="https://console.anthropic.com/settings/usage"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 border border-border rounded-md hover:bg-accent hover:text-accent-foreground transition-colors text-sm"
          >
            <ExternalLink className="h-4 w-4" />
            Check Anthropic Usage
          </a>
        </div>
      </div>

      {/* Footer */}
      <div className="text-xs text-muted-foreground border-t border-border pt-3">
        <p>
          <strong>Note:</strong> This error indicates that AI analysis cannot be generated at this time. 
          Stock price data and charts are still available above. Please resolve the AI service issue to access 
          comprehensive analysis features.
        </p>
      </div>
    </div>
  );
}

export default AnalysisUnavailable;