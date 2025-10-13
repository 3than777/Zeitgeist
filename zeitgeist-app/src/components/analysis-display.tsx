"use client";

import React, { useState } from 'react';
import { format, parseISO, isValid } from 'date-fns';
import { 
  Brain, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Target, 
  BarChart3,
  Activity,
  Shield,
  Zap,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
  Star,
  Lightbulb,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { StockAnalysis } from '@/types/stock';

interface AnalysisDisplayProps {
  analysis: StockAnalysis;
  className?: string;
  showRawAnalysis?: boolean;
}

// Format currency for price targets
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

// Get recommendation styling
const getRecommendationStyle = (recommendation: StockAnalysis['recommendation']) => {
  switch (recommendation) {
    case 'STRONG_BUY':
      return {
        color: 'text-green-700 dark:text-green-300',
        bg: 'bg-green-100 dark:bg-green-900/20',
        border: 'border-green-200 dark:border-green-800',
        icon: TrendingUp,
        label: 'Strong Buy'
      };
    case 'BUY':
      return {
        color: 'text-green-600 dark:text-green-400',
        bg: 'bg-green-50 dark:bg-green-900/10',
        border: 'border-green-200 dark:border-green-800/50',
        icon: TrendingUp,
        label: 'Buy'
      };
    case 'HOLD':
      return {
        color: 'text-blue-600 dark:text-blue-400',
        bg: 'bg-blue-50 dark:bg-blue-900/10',
        border: 'border-blue-200 dark:border-blue-800/50',
        icon: Activity,
        label: 'Hold'
      };
    case 'SELL':
      return {
        color: 'text-red-600 dark:text-red-400',
        bg: 'bg-red-50 dark:bg-red-900/10',
        border: 'border-red-200 dark:border-red-800/50',
        icon: TrendingDown,
        label: 'Sell'
      };
    case 'STRONG_SELL':
      return {
        color: 'text-red-700 dark:text-red-300',
        bg: 'bg-red-100 dark:bg-red-900/20',
        border: 'border-red-200 dark:border-red-800',
        icon: TrendingDown,
        label: 'Strong Sell'
      };
    default:
      return {
        color: 'text-muted-foreground',
        bg: 'bg-muted/50',
        border: 'border-muted',
        icon: Activity,
        label: 'Unknown'
      };
  }
};

// Get sentiment styling
const getSentimentStyle = (sentiment: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL') => {
  switch (sentiment) {
    case 'POSITIVE':
      return { color: 'text-green-600 dark:text-green-400', label: 'Positive' };
    case 'NEGATIVE':
      return { color: 'text-red-600 dark:text-red-400', label: 'Negative' };
    case 'NEUTRAL':
    default:
      return { color: 'text-muted-foreground', label: 'Neutral' };
  }
};

// Get trend styling
const getTrendStyle = (trend: 'BULLISH' | 'BEARISH' | 'NEUTRAL') => {
  switch (trend) {
    case 'BULLISH':
      return { color: 'text-green-600 dark:text-green-400', icon: TrendingUp, label: 'Bullish' };
    case 'BEARISH':
      return { color: 'text-red-600 dark:text-red-400', icon: TrendingDown, label: 'Bearish' };
    case 'NEUTRAL':
    default:
      return { color: 'text-muted-foreground', icon: Activity, label: 'Neutral' };
  }
};

// Get risk level styling
const getRiskStyle = (riskLevel: 'LOW' | 'MEDIUM' | 'HIGH') => {
  switch (riskLevel) {
    case 'LOW':
      return { color: 'text-green-600 dark:text-green-400', label: 'Low Risk' };
    case 'MEDIUM':
      return { color: 'text-yellow-600 dark:text-yellow-400', label: 'Medium Risk' };
    case 'HIGH':
      return { color: 'text-red-600 dark:text-red-400', label: 'High Risk' };
    default:
      return { color: 'text-muted-foreground', label: 'Unknown Risk' };
  }
};

// Get confidence indicator
const ConfidenceIndicator = ({ score }: { score: number }) => {
  const getConfidenceColor = (score: number) => {
    if (score >= 80) return 'text-green-600 dark:text-green-400';
    if (score >= 60) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getConfidenceLabel = (score: number) => {
    if (score >= 80) return 'High Confidence';
    if (score >= 60) return 'Medium Confidence';
    return 'Low Confidence';
  };

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={cn(
              "h-3 w-3",
              i < Math.floor(score / 20) ? getConfidenceColor(score) : "text-muted-foreground/30"
            )}
            fill={i < Math.floor(score / 20) ? "currentColor" : "none"}
          />
        ))}
      </div>
      <span className={cn("text-sm font-medium", getConfidenceColor(score))}>
        {score}% ({getConfidenceLabel(score)})
      </span>
    </div>
  );
};

// Simple text formatter for basic markdown-like formatting
const formatText = (text: string) => {
  return text
    .split('\n')
    .map((line, index) => {
      // Handle bullet points
      if (line.trim().startsWith('• ') || line.trim().startsWith('- ')) {
        return (
          <div key={index} className="flex gap-2 mb-1">
            <span className="text-primary mt-1">•</span>
            <span>{line.trim().slice(2)}</span>
          </div>
        );
      }
      // Handle empty lines
      if (!line.trim()) {
        return <br key={index} />;
      }
      // Regular text
      return (
        <p key={index} className="mb-2 last:mb-0">
          {line}
        </p>
      );
    });
};

export function AnalysisDisplay({ 
  analysis, 
  className,
  showRawAnalysis: initialShowRaw = false 
}: AnalysisDisplayProps) {
  const [showRawAnalysis, setShowRawAnalysis] = useState(initialShowRaw);
  const [expandedSections, setExpandedSections] = useState({
    technical: true,
    fundamental: true,
    sentiment: true,
    risk: true,
    targets: true,
    insights: true
  });

  const recommendationStyle = getRecommendationStyle(analysis.recommendation);
  const trendStyle = getTrendStyle(analysis.technical_analysis.trend);
  const sentimentStyle = getSentimentStyle(analysis.sentiment_analysis.market_sentiment);
  const riskStyle = getRiskStyle(analysis.risk_level);
  
  const RecommendationIcon = recommendationStyle.icon;
  const TrendIcon = trendStyle.icon;

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    try {
      const date = parseISO(timestamp);
      if (isValid(date)) {
        return format(date, 'MMM d, yyyy h:mm a');
      }
    } catch (error) {
      console.error('Error formatting timestamp:', error);
    }
    return timestamp;
  };

  return (
    <div className={cn("bg-card border border-border rounded-lg p-6 space-y-6", className)}>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <Brain className="h-6 w-6 text-primary" />
          <div>
            <h3 className="font-bold text-lg">AI Stock Analysis</h3>
            <p className="text-sm text-muted-foreground">
              {analysis.company_name} ({analysis.ticker}) • {formatTimestamp(analysis.analysis_timestamp)}
            </p>
          </div>
        </div>
        
        <button
          onClick={() => setShowRawAnalysis(!showRawAnalysis)}
          className="flex items-center gap-1 px-3 py-1 text-xs rounded-md border border-border hover:bg-accent hover:text-accent-foreground transition-colors"
        >
          {showRawAnalysis ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
          {showRawAnalysis ? 'Hide' : 'Show'} Raw Analysis
        </button>
      </div>

      {/* Summary Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-primary" />
            Summary
          </h4>
        </div>
        
        <div className="prose prose-sm dark:prose-invert max-w-none">
          {formatText(analysis.summary)}
        </div>

        {/* Recommendation and Confidence */}
        <div className="flex flex-wrap items-center gap-4 pt-2">
          <div className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-lg border font-medium",
            recommendationStyle.color,
            recommendationStyle.bg,
            recommendationStyle.border
          )}>
            <RecommendationIcon className="h-4 w-4" />
            <span>{recommendationStyle.label}</span>
          </div>
          
          <ConfidenceIndicator score={analysis.confidence_score} />
        </div>
      </div>

      {/* Analysis Sections */}
      <div className="space-y-4">
        {/* Technical Analysis */}
        <div className="border border-border rounded-lg">
          <button
            onClick={() => toggleSection('technical')}
            className="flex items-center justify-between w-full p-4 hover:bg-accent/50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              <span className="font-medium">Technical Analysis</span>
              <div className={cn("text-sm px-2 py-0.5 rounded", trendStyle.color)}>
                <TrendIcon className="h-3 w-3 inline mr-1" />
                {trendStyle.label}
              </div>
            </div>
            {expandedSections.technical ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          
          {expandedSections.technical && (
            <div className="p-4 border-t border-border space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h5 className="font-medium text-sm mb-2">Support Levels</h5>
                  <div className="flex flex-wrap gap-1">
                    {analysis.technical_analysis.support_levels.map((level, i) => (
                      <span key={i} className="px-2 py-1 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded text-xs">
                        {formatCurrency(level)}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <h5 className="font-medium text-sm mb-2">Resistance Levels</h5>
                  <div className="flex flex-wrap gap-1">
                    {analysis.technical_analysis.resistance_levels.map((level, i) => (
                      <span key={i} className="px-2 py-1 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded text-xs">
                        {formatCurrency(level)}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div>
                <h5 className="font-medium text-sm mb-2">Key Indicators</h5>
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  {formatText(analysis.technical_analysis.key_indicators)}
                </div>
              </div>
              <div>
                <h5 className="font-medium text-sm mb-2">Short-term Outlook</h5>
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  {formatText(analysis.technical_analysis.short_term_outlook)}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Fundamental Analysis */}
        <div className="border border-border rounded-lg">
          <button
            onClick={() => toggleSection('fundamental')}
            className="flex items-center justify-between w-full p-4 hover:bg-accent/50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              <span className="font-medium">Fundamental Analysis</span>
              <span className={cn(
                "text-sm px-2 py-0.5 rounded",
                analysis.fundamental_analysis.valuation === 'UNDERVALUED' ? "text-green-600 dark:text-green-400" :
                analysis.fundamental_analysis.valuation === 'OVERVALUED' ? "text-red-600 dark:text-red-400" :
                "text-muted-foreground"
              )}>
                {analysis.fundamental_analysis.valuation.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
              </span>
            </div>
            {expandedSections.fundamental ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          
          {expandedSections.fundamental && (
            <div className="p-4 border-t border-border space-y-3">
              {/* Key Metrics */}
              {analysis.key_metrics && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                  {analysis.key_metrics.pe_ratio && (
                    <div className="text-center p-2 bg-muted/50 rounded">
                      <div className="text-lg font-bold">{analysis.key_metrics.pe_ratio}</div>
                      <div className="text-xs text-muted-foreground">P/E Ratio</div>
                    </div>
                  )}
                  {analysis.key_metrics.market_cap && (
                    <div className="text-center p-2 bg-muted/50 rounded">
                      <div className="text-lg font-bold">{formatCurrency(analysis.key_metrics.market_cap)}</div>
                      <div className="text-xs text-muted-foreground">Market Cap</div>
                    </div>
                  )}
                  {analysis.key_metrics.revenue_growth && (
                    <div className="text-center p-2 bg-muted/50 rounded">
                      <div className="text-lg font-bold">{analysis.key_metrics.revenue_growth}%</div>
                      <div className="text-xs text-muted-foreground">Revenue Growth</div>
                    </div>
                  )}
                  {analysis.key_metrics.profit_margin && (
                    <div className="text-center p-2 bg-muted/50 rounded">
                      <div className="text-lg font-bold">{analysis.key_metrics.profit_margin}%</div>
                      <div className="text-xs text-muted-foreground">Profit Margin</div>
                    </div>
                  )}
                </div>
              )}
              
              <div className="space-y-3">
                <div>
                  <h5 className="font-medium text-sm mb-2">Financial Health</h5>
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    {formatText(analysis.fundamental_analysis.financial_health)}
                  </div>
                </div>
                <div>
                  <h5 className="font-medium text-sm mb-2">Growth Prospects</h5>
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    {formatText(analysis.fundamental_analysis.growth_prospects)}
                  </div>
                </div>
                <div>
                  <h5 className="font-medium text-sm mb-2">Competitive Position</h5>
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    {formatText(analysis.fundamental_analysis.competitive_position)}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Price Targets */}
        <div className="border border-border rounded-lg">
          <button
            onClick={() => toggleSection('targets')}
            className="flex items-center justify-between w-full p-4 hover:bg-accent/50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              <span className="font-medium">Price Targets</span>
            </div>
            {expandedSections.targets ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          
          {expandedSections.targets && (
            <div className="p-4 border-t border-border">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <div className="text-xl font-bold text-primary">{formatCurrency(analysis.price_targets.short_term)}</div>
                  <div className="text-sm text-muted-foreground">1-3 Months</div>
                </div>
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <div className="text-xl font-bold text-primary">{formatCurrency(analysis.price_targets.medium_term)}</div>
                  <div className="text-sm text-muted-foreground">3-12 Months</div>
                </div>
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <div className="text-xl font-bold text-primary">{formatCurrency(analysis.price_targets.long_term)}</div>
                  <div className="text-sm text-muted-foreground">1+ Years</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Risk Assessment */}
        <div className="border border-border rounded-lg">
          <button
            onClick={() => toggleSection('risk')}
            className="flex items-center justify-between w-full p-4 hover:bg-accent/50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              <span className="font-medium">Risk Assessment</span>
              <span className={cn("text-sm px-2 py-0.5 rounded", riskStyle.color)}>
                {riskStyle.label}
              </span>
            </div>
            {expandedSections.risk ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          
          {expandedSections.risk && (
            <div className="p-4 border-t border-border">
              <div className="space-y-2">
                {analysis.risk_factors.map((factor, i) => (
                  <div key={i} className="flex gap-2 text-sm">
                    <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                    <span>{factor}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Insights */}
        <div className="border border-border rounded-lg">
          <button
            onClick={() => toggleSection('insights')}
            className="flex items-center justify-between w-full p-4 hover:bg-accent/50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              <span className="font-medium">Key Insights</span>
            </div>
            {expandedSections.insights ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          
          {expandedSections.insights && (
            <div className="p-4 border-t border-border space-y-4">
              {/* Catalysts */}
              {analysis.catalysts.length > 0 && (
                <div>
                  <h5 className="font-medium text-sm mb-2 text-green-600 dark:text-green-400">Positive Catalysts</h5>
                  <div className="space-y-1">
                    {analysis.catalysts.map((catalyst, i) => (
                      <div key={i} className="flex gap-2 text-sm">
                        <span className="text-green-500 mt-1">•</span>
                        <span>{catalyst}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Concerns */}
              {analysis.concerns.length > 0 && (
                <div>
                  <h5 className="font-medium text-sm mb-2 text-red-600 dark:text-red-400">Key Concerns</h5>
                  <div className="space-y-1">
                    {analysis.concerns.map((concern, i) => (
                      <div key={i} className="flex gap-2 text-sm">
                        <span className="text-red-500 mt-1">•</span>
                        <span>{concern}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Comparable Companies */}
              {analysis.comparable_companies && analysis.comparable_companies.length > 0 && (
                <div>
                  <h5 className="font-medium text-sm mb-2">Comparable Companies</h5>
                  <div className="flex flex-wrap gap-1">
                    {analysis.comparable_companies.map((company, i) => (
                      <span key={i} className="px-2 py-1 bg-muted text-foreground rounded text-xs">
                        {company}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Raw Analysis */}
      {showRawAnalysis && (
        <div className="border border-border rounded-lg p-4">
          <h4 className="font-medium mb-3 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-primary" />
            Raw Analysis Output
          </h4>
          <div className="prose prose-sm dark:prose-invert max-w-none bg-muted/30 p-3 rounded">
            {formatText(analysis.raw_analysis)}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="text-xs text-muted-foreground border-t border-border pt-3">
        Analysis generated by {analysis.model_used} • This is not financial advice
      </div>
    </div>
  );
}

export default AnalysisDisplay;