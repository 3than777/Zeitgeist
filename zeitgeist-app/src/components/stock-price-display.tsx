"use client";

import React from 'react';
import { format, formatDistanceToNow, isValid } from 'date-fns';
import { TrendingUp, TrendingDown, Clock, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';
import { StockData } from '@/types/stock';

interface StockPriceDisplayProps {
  stockData: StockData;
  className?: string;
  variant?: 'default' | 'compact' | 'detailed';
  showLastUpdate?: boolean;
  showMarketStatus?: boolean;
}

// Format currency with proper locale formatting
const formatCurrency = (amount: number, currency: string = 'USD', locale: string = 'en-US') => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

// Format percentage with proper rounding
const formatPercentage = (percentage: number) => {
  const formatted = Math.abs(percentage).toFixed(2);
  const sign = percentage >= 0 ? '+' : '-';
  return `${sign}${formatted}%`;
};

// Get price change color classes
const getPriceChangeColor = (change: number) => {
  if (change > 0) {
    return {
      text: 'text-green-600 dark:text-green-400',
      bg: 'bg-green-50 dark:bg-green-900/20',
      border: 'border-green-200 dark:border-green-800',
      icon: 'text-green-600 dark:text-green-400'
    };
  } else if (change < 0) {
    return {
      text: 'text-red-600 dark:text-red-400', 
      bg: 'bg-red-50 dark:bg-red-900/20',
      border: 'border-red-200 dark:border-red-800',
      icon: 'text-red-600 dark:text-red-400'
    };
  }
  return {
    text: 'text-muted-foreground',
    bg: 'bg-muted/50',
    border: 'border-muted',
    icon: 'text-muted-foreground'
  };
};

// Get market status color and label
const getMarketStatus = (status: StockData['market_status']) => {
  switch (status) {
    case 'open':
      return {
        label: 'Market Open',
        color: 'text-green-600 dark:text-green-400',
        bg: 'bg-green-100 dark:bg-green-900/20'
      };
    case 'closed':
      return {
        label: 'Market Closed',
        color: 'text-muted-foreground',
        bg: 'bg-muted/50'
      };
    case 'extended-hours':
      return {
        label: 'Extended Hours',
        color: 'text-blue-600 dark:text-blue-400',
        bg: 'bg-blue-100 dark:bg-blue-900/20'
      };
    default:
      return {
        label: 'Unknown',
        color: 'text-muted-foreground',
        bg: 'bg-muted/50'
      };
  }
};

// Format timestamp
const formatTimestamp = (timestamp: number | string) => {
  let date: Date;
  
  if (typeof timestamp === 'string') {
    date = new Date(timestamp);
  } else {
    // Handle Unix timestamp (milliseconds or seconds)
    date = timestamp > 1000000000000 
      ? new Date(timestamp) 
      : new Date(timestamp * 1000);
  }
  
  if (!isValid(date)) {
    return 'Invalid date';
  }
  
  const now = new Date();
  const timeDiff = now.getTime() - date.getTime();
  
  // If less than 1 hour ago, show relative time
  if (timeDiff < 3600000) {
    return `${formatDistanceToNow(date)} ago`;
  }
  
  // If same day, show time
  if (format(now, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')) {
    return `Today at ${format(date, 'h:mm a')}`;
  }
  
  // Otherwise show full date and time
  return format(date, 'MMM d, yyyy h:mm a');
};

export function StockPriceDisplay({
  stockData,
  className,
  variant = 'default',
  showLastUpdate = true,
  showMarketStatus = true
}: StockPriceDisplayProps) {
  const {
    ticker,
    name,
    price,
    change,
    change_percent,
    currency = 'USD',
    timestamp,
    updated,
    market_status,
    previous_close,
    open,
    high,
    low,
    volume
  } = stockData;

  const changeColors = getPriceChangeColor(change);
  const marketStatus = getMarketStatus(market_status);
  const TrendIcon = change >= 0 ? TrendingUp : TrendingDown;

  // Compact variant for smaller spaces
  if (variant === 'compact') {
    return (
      <div className={cn("flex items-center justify-between gap-4", className)}>
        <div className="flex items-center gap-2">
          <span className="font-bold text-lg">{ticker}</span>
          <span className="text-2xl font-bold">
            {formatCurrency(price, currency)}
          </span>
        </div>
        <div className={cn("flex items-center gap-1", changeColors.text)}>
          <TrendIcon className="h-4 w-4" />
          <span className="font-medium">
            {formatPercentage(change_percent)}
          </span>
        </div>
      </div>
    );
  }

  // Detailed variant with more metrics
  if (variant === 'detailed') {
    return (
      <div className={cn("bg-card border border-border rounded-lg p-6 space-y-4", className)}>
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold">{ticker}</h2>
            <p className="text-muted-foreground text-sm truncate max-w-xs">{name}</p>
          </div>
          {showMarketStatus && (
            <div className={cn(
              "px-2 py-1 rounded-full text-xs font-medium",
              marketStatus.color,
              marketStatus.bg
            )}>
              {marketStatus.label}
            </div>
          )}
        </div>

        {/* Price and Change */}
        <div className="flex items-end justify-between">
          <div className="space-y-1">
            <div className="text-3xl font-bold">
              {formatCurrency(price, currency)}
            </div>
            <div className={cn("flex items-center gap-2", changeColors.text)}>
              <TrendIcon className="h-4 w-4" />
              <span className="font-medium">
                {change >= 0 ? '+' : ''}{formatCurrency(change, currency)} 
                ({formatPercentage(change_percent)})
              </span>
            </div>
          </div>
        </div>

        {/* Trading Metrics */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Open</span>
              <span className="font-medium">{formatCurrency(open, currency)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">High</span>
              <span className="font-medium">{formatCurrency(high, currency)}</span>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Previous Close</span>
              <span className="font-medium">{formatCurrency(previous_close, currency)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Low</span>
              <span className="font-medium">{formatCurrency(low, currency)}</span>
            </div>
          </div>
        </div>

        {/* Volume */}
        <div className="flex justify-between text-sm pt-2 border-t border-border">
          <span className="text-muted-foreground">Volume</span>
          <span className="font-medium">
            {new Intl.NumberFormat('en-US', { 
              notation: 'compact',
              compactDisplay: 'short' 
            }).format(volume)}
          </span>
        </div>

        {/* Last Update */}
        {showLastUpdate && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2">
            <Clock className="h-3 w-3" />
            <span>Last updated: {formatTimestamp(updated || timestamp)}</span>
          </div>
        )}
      </div>
    );
  }

  // Default variant
  return (
    <div className={cn("bg-card border border-border rounded-lg p-4", className)}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-bold text-lg">{ticker}</h3>
            {showMarketStatus && (
              <div className={cn(
                "px-2 py-0.5 rounded-full text-xs font-medium",
                marketStatus.color,
                marketStatus.bg
              )}>
                {marketStatus.label}
              </div>
            )}
          </div>
          <p className="text-muted-foreground text-sm">{name}</p>
        </div>
        <DollarSign className="h-5 w-5 text-muted-foreground" />
      </div>

      <div className="space-y-3">
        {/* Current Price */}
        <div className="text-2xl font-bold">
          {formatCurrency(price, currency)}
        </div>

        {/* Price Change */}
        <div className={cn(
          "inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium",
          changeColors.text,
          changeColors.bg,
          changeColors.border,
          "border"
        )}>
          <TrendIcon className="h-4 w-4" />
          <span>
            {change >= 0 ? '+' : ''}{formatCurrency(change, currency)}
          </span>
          <span>({formatPercentage(change_percent)})</span>
        </div>

        {/* Session High/Low */}
        <div className="flex justify-between text-sm text-muted-foreground pt-2">
          <span>Day Range: {formatCurrency(low, currency)} - {formatCurrency(high, currency)}</span>
        </div>

        {/* Last Update */}
        {showLastUpdate && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t border-border">
            <Clock className="h-3 w-3" />
            <span>Updated {formatTimestamp(updated || timestamp)}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default StockPriceDisplay;