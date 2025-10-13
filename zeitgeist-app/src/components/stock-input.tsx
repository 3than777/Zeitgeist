"use client";

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Search, TrendingUp, X, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { validateStockTicker } from '@/lib/polygon';

// Popular stock symbols for auto-complete suggestions
const POPULAR_STOCKS = [
  { symbol: 'AAPL', name: 'Apple Inc.' },
  { symbol: 'MSFT', name: 'Microsoft Corporation' },
  { symbol: 'GOOGL', name: 'Alphabet Inc.' },
  { symbol: 'AMZN', name: 'Amazon.com Inc.' },
  { symbol: 'TSLA', name: 'Tesla Inc.' },
  { symbol: 'META', name: 'Meta Platforms Inc.' },
  { symbol: 'NVDA', name: 'NVIDIA Corporation' },
  { symbol: 'NFLX', name: 'Netflix Inc.' },
  { symbol: 'DIS', name: 'The Walt Disney Company' },
  { symbol: 'V', name: 'Visa Inc.' },
  { symbol: 'JPM', name: 'JPMorgan Chase & Co.' },
  { symbol: 'JNJ', name: 'Johnson & Johnson' },
  { symbol: 'WMT', name: 'Walmart Inc.' },
  { symbol: 'PG', name: 'Procter & Gamble Co.' },
  { symbol: 'UNH', name: 'UnitedHealth Group Inc.' }
];

interface StockInputProps {
  onSearch: (ticker: string) => void;
  isLoading?: boolean;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  showSuggestions?: boolean;
  autoFocus?: boolean;
}

interface ValidationState {
  isValid: boolean;
  error?: string;
  formattedValue: string;
}

export function StockInput({
  onSearch,
  isLoading = false,
  placeholder = "Enter stock symbol (e.g., AAPL, MSFT)",
  disabled = false,
  className,
  showSuggestions = true,
  autoFocus = false
}: StockInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [validation, setValidation] = useState<ValidationState>({
    isValid: false,
    error: '',
    formattedValue: ''
  });
  const [showDropdown, setShowDropdown] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState(POPULAR_STOCKS);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Validate input value
  const validateInput = useCallback((value: string) => {
    if (!value.trim()) {
      return {
        isValid: false,
        error: '',
        formattedValue: ''
      };
    }

    const result = validateStockTicker(value);
    return {
      isValid: result.isValid,
      error: result.error,
      formattedValue: result.formattedTicker
    };
  }, []);

  // Handle input change
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    
    // Validate the input
    const validationResult = validateInput(value);
    setValidation(validationResult);

    // Filter suggestions based on input
    if (showSuggestions && value.trim()) {
      const filtered = POPULAR_STOCKS.filter(stock =>
        stock.symbol.toLowerCase().includes(value.toLowerCase()) ||
        stock.name.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredSuggestions(filtered);
      setShowDropdown(filtered.length > 0);
      setHighlightedIndex(-1);
    } else if (showSuggestions && !value.trim()) {
      setFilteredSuggestions(POPULAR_STOCKS);
      setShowDropdown(false);
    } else {
      setShowDropdown(false);
    }
  }, [validateInput, showSuggestions]);

  // Handle search submission
  const handleSearch = useCallback(() => {
    if (validation.isValid && !isLoading && !disabled) {
      onSearch(validation.formattedValue);
      setShowDropdown(false);
    }
  }, [validation, isLoading, disabled, onSearch]);

  // Handle Enter key press
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (showDropdown && highlightedIndex >= 0) {
        // Select highlighted suggestion
        const selectedStock = filteredSuggestions[highlightedIndex];
        setInputValue(selectedStock.symbol);
        setValidation(validateInput(selectedStock.symbol));
        setShowDropdown(false);
        setHighlightedIndex(-1);
      } else {
        handleSearch();
      }
    } else if (e.key === 'ArrowDown' && showDropdown) {
      e.preventDefault();
      setHighlightedIndex(prev => 
        prev < filteredSuggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp' && showDropdown) {
      e.preventDefault();
      setHighlightedIndex(prev => prev > 0 ? prev - 1 : -1);
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
      setHighlightedIndex(-1);
    }
  }, [showDropdown, highlightedIndex, filteredSuggestions, validateInput, handleSearch]);

  // Handle suggestion selection
  const handleSuggestionClick = useCallback((stock: typeof POPULAR_STOCKS[0]) => {
    setInputValue(stock.symbol);
    setValidation(validateInput(stock.symbol));
    setShowDropdown(false);
    setHighlightedIndex(-1);
    inputRef.current?.focus();
  }, [validateInput]);

  // Handle input focus
  const handleFocus = useCallback(() => {
    if (showSuggestions && !inputValue.trim()) {
      setShowDropdown(true);
    }
  }, [showSuggestions, inputValue]);

  // Handle input blur
  const handleBlur = useCallback(() => {
    // Delay hiding dropdown to allow for suggestion clicks
    setTimeout(() => {
      if (!dropdownRef.current?.contains(document.activeElement)) {
        setShowDropdown(false);
        setHighlightedIndex(-1);
      }
    }, 150);
  }, []);

  // Clear input
  const handleClear = useCallback(() => {
    setInputValue('');
    setValidation({ isValid: false, error: '', formattedValue: '' });
    setShowDropdown(false);
    setHighlightedIndex(-1);
    inputRef.current?.focus();
  }, []);

  // Auto-focus effect
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  return (
    <div className={cn("relative w-full max-w-md", className)}>
      {/* Input Container */}
      <div className="relative">
        <div
          className={cn(
            "relative flex items-center w-full rounded-lg border border-input bg-background text-sm ring-offset-background",
            "focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
            validation.error && inputValue && "border-destructive focus-within:ring-destructive",
            validation.isValid && "border-green-500 focus-within:ring-green-500",
            disabled && "cursor-not-allowed opacity-50"
          )}
        >
          {/* Search Icon */}
          <Search className="absolute left-3 h-4 w-4 text-muted-foreground" />

          {/* Input Field */}
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder={placeholder}
            disabled={disabled || isLoading}
            className={cn(
              "flex-1 px-10 py-3 bg-transparent placeholder:text-muted-foreground",
              "focus:outline-none disabled:cursor-not-allowed disabled:opacity-50",
              "text-sm font-medium tracking-wide uppercase"
            )}
            maxLength={5}
            autoComplete="off"
            autoCorrect="off"
            spellCheck="false"
          />

          {/* Clear Button */}
          {inputValue && !isLoading && (
            <button
              onClick={handleClear}
              className="absolute right-12 h-4 w-4 text-muted-foreground hover:text-foreground transition-colors"
              disabled={disabled}
              type="button"
            >
              <X className="h-4 w-4" />
            </button>
          )}

          {/* Dropdown Toggle (when suggestions are available) */}
          {showSuggestions && (
            <ChevronDown
              className={cn(
                "absolute right-3 h-4 w-4 text-muted-foreground transition-transform",
                showDropdown && "rotate-180"
              )}
            />
          )}
        </div>

        {/* Search Button */}
        <button
          onClick={handleSearch}
          disabled={!validation.isValid || isLoading || disabled}
          className={cn(
            "absolute right-1 top-1 bottom-1 px-4 rounded-md",
            "bg-primary text-primary-foreground hover:bg-primary/90",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            "transition-all duration-200 ease-in-out",
            "flex items-center justify-center gap-2",
            "font-medium text-sm"
          )}
        >
          {isLoading ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          ) : (
            <TrendingUp className="h-4 w-4" />
          )}
          {!isLoading && "Analyze"}
        </button>
      </div>

      {/* Error Message */}
      {validation.error && inputValue && (
        <p className="mt-2 text-sm text-destructive">
          {validation.error}
        </p>
      )}

      {/* Auto-complete Dropdown */}
      {showSuggestions && showDropdown && (
        <div
          ref={dropdownRef}
          className={cn(
            "absolute top-full mt-1 w-full bg-popover border border-border rounded-md shadow-md z-50",
            "max-h-60 overflow-y-auto"
          )}
        >
          {filteredSuggestions.length > 0 ? (
            <div className="py-1">
              {filteredSuggestions.map((stock, index) => (
                <button
                  key={stock.symbol}
                  onClick={() => handleSuggestionClick(stock)}
                  className={cn(
                    "w-full px-3 py-2 text-left hover:bg-accent hover:text-accent-foreground",
                    "focus:bg-accent focus:text-accent-foreground transition-colors",
                    index === highlightedIndex && "bg-accent text-accent-foreground"
                  )}
                  type="button"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">{stock.symbol}</span>
                    <span className="text-xs text-muted-foreground truncate ml-2">
                      {stock.name}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="px-3 py-2 text-sm text-muted-foreground">
              No stocks found
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default StockInput;