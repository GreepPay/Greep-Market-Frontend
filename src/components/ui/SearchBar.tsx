import React, { useState, useCallback, useEffect } from 'react';
import { Search, Camera, X, Loader2 } from 'lucide-react';
import { Button } from './Button';

interface SearchBarProps {
  placeholder?: string;
  onSearch: (query: string) => void;
  onBarcodeScan?: () => void;
  showBarcodeButton?: boolean;
  className?: string;
  enableRealTime?: boolean;
  debounceMs?: number;
  showLoading?: boolean;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  placeholder = 'Search products...',
  onSearch,
  onBarcodeScan,
  showBarcodeButton = true,
  className = '',
  enableRealTime = true,
  debounceMs = 300,
  showLoading = false,
}) => {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Use useRef to persist timeout ID across renders
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  // Debounced search function
  const debouncedSearch = useCallback((searchQuery: string) => {
    // Clear existing timeout if any
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    if (enableRealTime && searchQuery.trim()) {
      setIsLoading(true);
      timeoutRef.current = setTimeout(() => {
        onSearch(searchQuery);
        setIsLoading(false);
        timeoutRef.current = null;
      }, debounceMs);
    } else if (!searchQuery.trim()) {
      onSearch('');
      setIsLoading(false);
    }
  }, [onSearch, debounceMs, enableRealTime]);

  // Handle input changes with real-time search
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    
    if (enableRealTime) {
      debouncedSearch(value);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!enableRealTime) {
      onSearch(query);
    }
  };

  const handleClear = () => {
    setQuery('');
    onSearch('');
    setIsLoading(false);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <form onSubmit={handleSubmit} className={`relative ${className}`}>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400 dark:text-gray-500" />
        </div>
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          placeholder={placeholder}
          className="w-full pl-10 pr-20 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-2 space-x-1">
          {/* Loading indicator */}
          {(isLoading || showLoading) && (
            <div className="p-1">
              <Loader2 className="h-4 w-4 text-primary-500 animate-spin" />
            </div>
          )}
          
          {/* Clear button */}
          {query && !isLoading && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors duration-200"
              title="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          
          {/* Barcode scanner button */}
          {showBarcodeButton && onBarcodeScan && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onBarcodeScan}
              className="!p-2"
              title="Scan barcode"
            >
              <Camera className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
      
      {/* Real-time search indicator */}
      {enableRealTime && query && (
        <div className="absolute top-full left-0 right-0 mt-1 text-xs text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-2 shadow-lg z-10">
          <div className="flex items-center space-x-2">
            <Search className="h-3 w-3" />
            <span>Searching for "{query}"...</span>
            {isLoading && <Loader2 className="h-3 w-3 animate-spin" />}
          </div>
        </div>
      )}
    </form>
  );
};