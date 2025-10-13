"use client";

import React, { useState, useEffect } from 'react';
import { TrendingUp, BarChart3, Brain, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StockLoadingProps {
  className?: string;
  variant?: 'default' | 'compact';
  showMessages?: boolean;
}

const LOADING_MESSAGES = [
  { icon: TrendingUp, text: "Fetching stock data..." },
  { icon: BarChart3, text: "Analyzing market trends..." },
  { icon: Brain, text: "Processing with AI..." },
  { icon: Zap, text: "Generating insights..." },
];

export function StockLoading({ 
  className, 
  variant = 'default',
  showMessages = true 
}: StockLoadingProps) {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

  // Rotate loading messages every 2 seconds
  useEffect(() => {
    if (!showMessages) return;
    
    const interval = setInterval(() => {
      setCurrentMessageIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
    }, 2000);

    return () => clearInterval(interval);
  }, [showMessages]);

  const currentMessage = LOADING_MESSAGES[currentMessageIndex];
  const IconComponent = currentMessage.icon;

  if (variant === 'compact') {
    return (
      <div className={cn("flex items-center gap-3", className)}>
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        {showMessages && (
          <span className="text-sm text-muted-foreground animate-pulse">
            {currentMessage.text}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={cn("w-full max-w-2xl mx-auto space-y-6", className)}>
      {/* Animated Loading Header */}
      {showMessages && (
        <div className="flex items-center justify-center gap-3 py-4">
          <div className="relative">
            <IconComponent className="h-6 w-6 text-primary animate-pulse" />
            <div className="absolute inset-0 h-6 w-6 animate-ping">
              <IconComponent className="h-6 w-6 text-primary/20" />
            </div>
          </div>
          <span className="text-lg font-medium text-foreground animate-pulse">
            {currentMessage.text}
          </span>
        </div>
      )}

      {/* Stock Price Skeleton */}
      <div className="bg-card border border-border rounded-lg p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-4 bg-muted animate-pulse rounded w-20" />
            <div className="h-8 bg-muted animate-pulse rounded w-32" />
          </div>
          <div className="text-right space-y-2">
            <div className="h-4 bg-muted animate-pulse rounded w-16" />
            <div className="h-6 bg-muted animate-pulse rounded w-24" />
          </div>
        </div>
        
        {/* Progress bar for loading */}
        <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
          <div className="h-full bg-primary rounded-full animate-pulse" style={{
            animation: 'loading-progress 3s ease-in-out infinite'
          }} />
        </div>
      </div>

      {/* Chart Skeleton */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="space-y-4">
          <div className="h-4 bg-muted animate-pulse rounded w-24" />
          <div className="h-64 bg-muted animate-pulse rounded relative overflow-hidden">
            {/* Animated chart lines */}
            <div className="absolute inset-0 flex items-end justify-between px-4 pb-4">
              {Array.from({ length: 12 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-primary/20 rounded-t animate-pulse"
                  style={{
                    height: `${Math.random() * 60 + 20}%`,
                    width: '6px',
                    animationDelay: `${i * 0.1}s`,
                    animationDuration: '2s'
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Analysis Skeleton */}
      <div className="bg-card border border-border rounded-lg p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary animate-pulse" />
          <div className="h-5 bg-muted animate-pulse rounded w-28" />
        </div>
        
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 bg-muted animate-pulse rounded w-full" />
              <div 
                className="h-4 bg-muted animate-pulse rounded" 
                style={{ width: `${Math.random() * 40 + 60}%` }}
              />
            </div>
          ))}
        </div>

        {/* Analysis sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          {['Key Metrics', 'Risk Assessment', 'Price Targets', 'Recommendation'].map((title, i) => (
            <div key={title} className="space-y-2">
              <div className="h-4 bg-muted animate-pulse rounded w-24" />
              <div className="space-y-1">
                <div className="h-3 bg-muted animate-pulse rounded w-full" />
                <div className="h-3 bg-muted animate-pulse rounded w-3/4" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Floating indicators */}
      <div className="fixed bottom-4 right-4 z-50">
        <div className="bg-primary text-primary-foreground rounded-full p-3 shadow-lg animate-bounce">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        </div>
      </div>

      <style jsx>{`
        @keyframes loading-progress {
          0% {
            width: 0%;
            transform: translateX(-100%);
          }
          50% {
            width: 70%;
            transform: translateX(0%);
          }
          100% {
            width: 100%;
            transform: translateX(100%);
          }
        }
      `}</style>
    </div>
  );
}

export default StockLoading;