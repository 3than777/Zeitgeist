"use client";

import React, { useMemo, useState } from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ComposedChart,
  Bar
} from 'recharts';
import { format, parseISO, isValid } from 'date-fns';
import { TrendingUp, TrendingDown, BarChart3, Activity, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import { StockPriceData, ChartConfig } from '@/types/stock';

interface StockChartProps {
  data: StockPriceData[];
  ticker: string;
  className?: string;
  config?: Partial<ChartConfig>;
  showVolume?: boolean;
  showControls?: boolean;
  height?: number;
}

interface ChartDataPoint {
  date: string;
  price: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  timestamp: number;
  formattedDate: string;
  change: number;
  changePercent: number;
}

// Format currency for tooltips
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

// Format volume for display
const formatVolume = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    compactDisplay: 'short'
  }).format(value);
};

// Custom tooltip component
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0].payload;
  const isPositive = data.change >= 0;

  return (
    <div className="bg-popover border border-border rounded-lg shadow-lg p-4 min-w-[200px]">
      <div className="space-y-2">
        {/* Date */}
        <p className="font-medium text-sm text-foreground">
          {data.formattedDate}
        </p>
        
        {/* Price */}
        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground text-xs">Close</span>
            <span className="font-bold">{formatCurrency(data.close)}</span>
          </div>
          
          {/* Price Change */}
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground text-xs">Change</span>
            <div className={cn(
              "flex items-center gap-1 text-xs font-medium",
              isPositive ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
            )}>
              {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              <span>
                {isPositive ? '+' : ''}{formatCurrency(data.change)} 
                ({isPositive ? '+' : ''}{data.changePercent.toFixed(2)}%)
              </span>
            </div>
          </div>
        </div>

        {/* OHLC Data */}
        <div className="border-t border-border pt-2 space-y-1">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Open</span>
              <span>{formatCurrency(data.open)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">High</span>
              <span>{formatCurrency(data.high)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Low</span>
              <span>{formatCurrency(data.low)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Volume</span>
              <span>{formatVolume(data.volume)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export function StockChart({
  data,
  ticker,
  className,
  config = {},
  showVolume = false,
  showControls = true,
  height = 400
}: StockChartProps) {
  const [chartConfig, setChartConfig] = useState<ChartConfig>({
    timeframe: '1M',
    show_volume: showVolume,
    chart_type: 'line',
    ...config
  });

  // Transform data for chart
  const chartData: ChartDataPoint[] = useMemo(() => {
    if (!data || data.length === 0) return [];

    return data
      .map((item, index) => {
        const prevClose = index > 0 ? data[index - 1].close : item.open;
        const change = item.close - prevClose;
        const changePercent = prevClose !== 0 ? (change / prevClose) * 100 : 0;

        let formattedDate: string;
        try {
          const date = item.date ? parseISO(item.date) : new Date(item.timestamp * 1000);
          if (isValid(date)) {
            formattedDate = format(date, 'MMM d, yyyy');
          } else {
            formattedDate = 'Invalid Date';
          }
        } catch {
          formattedDate = 'Invalid Date';
        }

        return {
          date: item.date || new Date(item.timestamp * 1000).toISOString(),
          price: item.close,
          open: item.open,
          high: item.high,
          low: item.low,
          close: item.close,
          volume: item.volume,
          timestamp: item.timestamp,
          formattedDate,
          change,
          changePercent
        };
      })
      .sort((a, b) => a.timestamp - b.timestamp);
  }, [data]);

  // Calculate price range and trend
  const priceStats = useMemo(() => {
    if (chartData.length === 0) return { min: 0, max: 0, trend: 'neutral' as const };
    
    const prices = chartData.map(d => d.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const firstPrice = chartData[0].price;
    const lastPrice = chartData[chartData.length - 1].price;
    const trend = lastPrice > firstPrice ? 'bullish' : lastPrice < firstPrice ? 'bearish' : 'neutral';
    
    return { min, max, trend };
  }, [chartData]);

  // Get chart colors based on trend
  const getChartColors = () => {
    const colors = {
      bullish: {
        stroke: '#16a34a', // green-600
        fill: 'url(#bullishGradient)',
        area: '#16a34a20'
      },
      bearish: {
        stroke: '#dc2626', // red-600  
        fill: 'url(#bearishGradient)',
        area: '#dc262620'
      },
      neutral: {
        stroke: '#6b7280', // gray-500
        fill: 'url(#neutralGradient)', 
        area: '#6b728020'
      }
    };
    return colors[priceStats.trend];
  };

  const chartColors = getChartColors();

  // Handle chart type change
  const handleChartTypeChange = (type: ChartConfig['chart_type']) => {
    setChartConfig(prev => ({ ...prev, chart_type: type }));
  };

  // Handle volume toggle
  const handleVolumeToggle = () => {
    setChartConfig(prev => ({ ...prev, show_volume: !prev.show_volume }));
  };

  if (!data || data.length === 0) {
    return (
      <div className={cn("bg-card border border-border rounded-lg p-6", className)}>
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          <div className="text-center">
            <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No chart data available</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("bg-card border border-border rounded-lg p-6 space-y-4", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Price Chart</h3>
          <span className="text-sm text-muted-foreground">({ticker})</span>
        </div>
        
        {showControls && (
          <div className="flex items-center gap-2">
            {/* Chart Type Controls */}
            <div className="flex bg-muted rounded-md p-1">
              <button
                onClick={() => handleChartTypeChange('line')}
                className={cn(
                  "px-2 py-1 text-xs rounded transition-colors",
                  chartConfig.chart_type === 'line' 
                    ? "bg-primary text-primary-foreground" 
                    : "hover:bg-accent hover:text-accent-foreground"
                )}
              >
                Line
              </button>
              <button
                onClick={() => handleChartTypeChange('area')}
                className={cn(
                  "px-2 py-1 text-xs rounded transition-colors",
                  chartConfig.chart_type === 'area' 
                    ? "bg-primary text-primary-foreground" 
                    : "hover:bg-accent hover:text-accent-foreground"
                )}
              >
                Area
              </button>
            </div>
            
            {/* Volume Toggle */}
            <button
              onClick={handleVolumeToggle}
              className={cn(
                "px-3 py-1 text-xs rounded-md border transition-colors",
                chartConfig.show_volume
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background hover:bg-accent hover:text-accent-foreground border-border"
              )}
            >
              <Eye className="h-3 w-3 inline mr-1" />
              Volume
            </button>
          </div>
        )}
      </div>

      {/* Chart */}
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          {chartConfig.show_volume ? (
            <ComposedChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <defs>
                <linearGradient id="bullishGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#16a34a" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="bearishGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#dc2626" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#dc2626" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="neutralGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6b7280" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6b7280" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="formattedDate" 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickFormatter={(value) => format(parseISO(value.split(',')[0] + ', 2024'), 'MMM d')}
              />
              <YAxis 
                yAxisId="price"
                orientation="right"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickFormatter={(value) => `$${value.toFixed(0)}`}
              />
              <YAxis 
                yAxisId="volume"
                orientation="left"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickFormatter={formatVolume}
              />
              <Tooltip content={<CustomTooltip />} />
              
              <Bar 
                yAxisId="volume"
                dataKey="volume" 
                fill="hsl(var(--muted))" 
                opacity={0.3}
                radius={[2, 2, 0, 0]}
              />
              
              {chartConfig.chart_type === 'area' ? (
                <Area
                  yAxisId="price"
                  type="monotone"
                  dataKey="price"
                  stroke={chartColors.stroke}
                  strokeWidth={2}
                  fill={chartColors.fill}
                  fillOpacity={0.3}
                />
              ) : (
                <Line
                  yAxisId="price"
                  type="monotone"
                  dataKey="price"
                  stroke={chartColors.stroke}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, stroke: chartColors.stroke, strokeWidth: 2 }}
                />
              )}
            </ComposedChart>
          ) : (
            chartConfig.chart_type === 'area' ? (
              <AreaChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <defs>
                  <linearGradient id="bullishGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#16a34a" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="bearishGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#dc2626" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#dc2626" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="neutralGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6b7280" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6b7280" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="formattedDate" 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickFormatter={(value) => {
                    try {
                      return format(new Date(value), 'MMM d');
                    } catch {
                      return value.slice(0, 6);
                    }
                  }}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickFormatter={(value) => `$${value.toFixed(0)}`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="price"
                  stroke={chartColors.stroke}
                  strokeWidth={2}
                  fill={chartColors.fill}
                  fillOpacity={0.3}
                />
              </AreaChart>
            ) : (
              <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="formattedDate" 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickFormatter={(value) => {
                    try {
                      return format(new Date(value), 'MMM d');
                    } catch {
                      return value.slice(0, 6);
                    }
                  }}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickFormatter={(value) => `$${value.toFixed(0)}`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="price"
                  stroke={chartColors.stroke}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, stroke: chartColors.stroke, strokeWidth: 2 }}
                />
              </LineChart>
            )
          )}
        </ResponsiveContainer>
      </div>

      {/* Chart Stats */}
      <div className="flex items-center justify-between text-sm text-muted-foreground border-t border-border pt-3">
        <div className="flex items-center gap-4">
          <span>Period: {chartData.length} days</span>
          <span>Range: {formatCurrency(priceStats.min)} - {formatCurrency(priceStats.max)}</span>
        </div>
        <div className={cn(
          "flex items-center gap-1",
          priceStats.trend === 'bullish' && "text-green-600 dark:text-green-400",
          priceStats.trend === 'bearish' && "text-red-600 dark:text-red-400"
        )}>
          {priceStats.trend === 'bullish' && <TrendingUp className="h-4 w-4" />}
          {priceStats.trend === 'bearish' && <TrendingDown className="h-4 w-4" />}
          <span className="capitalize">{priceStats.trend} trend</span>
        </div>
      </div>
    </div>
  );
}

export default StockChart;