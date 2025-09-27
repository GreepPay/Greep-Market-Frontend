import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Search, Camera, X, Loader2, Clock, TrendingUp } from 'lucide-react';
import { Button } from './Button';

interface SearchSuggestion {
  id: string;
  text: string;
  type: 'product' | 'category' | 'tag' | 'recent';
  count?: number;
}

interface IntelligentSearchBarProps {
  placeholder?: string;
  onSearch: (query: string) => void;
  onBarcodeScan?: () => void;
  showBarcodeButton?: boolean;
  className?: string;
  enableRealTime?: boolean;
  debounceMs?: number;
  showLoading?: boolean;
  suggestions?: SearchSuggestion[];
  recentSearches?: string[];
  onSuggestionClick?: (suggestion: SearchSuggestion) => void;
}

// Fuzzy search algorithm
const fuzzyMatch = (query: string, text: string): { score: number; matches: boolean } => {
  if (!query || !text) return { score: 0, matches: false };
  
  const queryLower = query.toLowerCase();
  const textLower = text.toLowerCase();
  
  // Exact match gets highest score
  if (textLower.includes(queryLower)) {
    const index = textLower.indexOf(queryLower);
    const score = 100 - (index / textLower.length) * 50; // Earlier matches get higher scores
    return { score, matches: true };
  }
  
  // Partial word matching
  const queryWords = queryLower.split(/\s+/);
  const textWords = textLower.split(/\s+/);
  
  let totalScore = 0;
  let matchedWords = 0;
  
  for (const queryWord of queryWords) {
    let bestScore = 0;
    for (const textWord of textWords) {
      if (textWord.startsWith(queryWord)) {
        bestScore = Math.max(bestScore, 80);
      } else if (textWord.includes(queryWord)) {
        bestScore = Math.max(bestScore, 60);
      } else if (queryWord.length > 2) {
        // Levenshtein distance for fuzzy matching
        const distance = levenshteinDistance(queryWord, textWord);
        const maxLength = Math.max(queryWord.length, textWord.length);
        const similarity = (maxLength - distance) / maxLength;
        if (similarity > 0.6) {
          bestScore = Math.max(bestScore, similarity * 40);
        }
      }
    }
    if (bestScore > 0) {
      totalScore += bestScore;
      matchedWords++;
    }
  }
  
  const matches = matchedWords > 0;
  const score = matches ? totalScore / queryWords.length : 0;
  
  return { score, matches };
};

// Simple Levenshtein distance implementation
const levenshteinDistance = (str1: string, str2: string): number => {
  const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
  
  for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
  
  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,
        matrix[j - 1][i] + 1,
        matrix[j - 1][i - 1] + indicator
      );
    }
  }
  
  return matrix[str2.length][str1.length];
};

export const IntelligentSearchBar: React.FC<IntelligentSearchBarProps> = ({
  placeholder = 'Search products...',
  onSearch,
  onBarcodeScan,
  showBarcodeButton = true,
  className = '',
  enableRealTime = true,
  debounceMs = 300,
  showLoading = false,
  suggestions = [],
  recentSearches = [],
  onSuggestionClick,
}) => {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState<SearchSuggestion[]>([]);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Generate intelligent suggestions based on query
  const generateSuggestions = useCallback((searchQuery: string): SearchSuggestion[] => {
    if (!searchQuery.trim()) {
      // Show recent searches when no query
      return recentSearches.slice(0, 5).map((search, index) => ({
        id: `recent-${index}`,
        text: search,
        type: 'recent' as const,
      }));
    }

    const queryLower = searchQuery.toLowerCase();
    const scoredSuggestions: (SearchSuggestion & { score: number })[] = [];

    // Score all suggestions
    suggestions.forEach(suggestion => {
      const { score, matches } = fuzzyMatch(queryLower, suggestion.text);
      if (matches) {
        scoredSuggestions.push({ ...suggestion, score });
      }
    });

    // Sort by score (highest first) and limit to 8 suggestions
    return scoredSuggestions
      .sort((a, b) => b.score - a.score)
      .slice(0, 8)
      .map(({ score, ...suggestion }) => suggestion);
  }, [suggestions, recentSearches]);

  // Update filtered suggestions when query changes
  useEffect(() => {
    const newSuggestions = generateSuggestions(query);
    setFilteredSuggestions(newSuggestions);
    setSelectedSuggestionIndex(-1);
  }, [query, generateSuggestions]);

  // Debounced search function
  const debouncedSearch = useCallback((searchQuery: string) => {
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
    setShowSuggestions(true);
    
    if (enableRealTime) {
      debouncedSearch(value);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!enableRealTime) {
      onSearch(query);
    }
    setShowSuggestions(false);
  };

  const handleClear = () => {
    setQuery('');
    onSearch('');
    setIsLoading(false);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    setQuery(suggestion.text);
    onSearch(suggestion.text);
    setShowSuggestions(false);
    onSuggestionClick?.(suggestion);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || filteredSuggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedSuggestionIndex(prev => 
          prev < filteredSuggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedSuggestionIndex(prev => 
          prev > 0 ? prev - 1 : filteredSuggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedSuggestionIndex >= 0) {
          handleSuggestionClick(filteredSuggestions[selectedSuggestionIndex]);
        } else {
          onSearch(query);
          setShowSuggestions(false);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedSuggestionIndex(-1);
        break;
    }
  };

  // Handle clicks outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current && 
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const getSuggestionIcon = (type: SearchSuggestion['type']) => {
    switch (type) {
      case 'product':
        return <Search className="h-4 w-4" />;
      case 'category':
        return <TrendingUp className="h-4 w-4" />;
      case 'tag':
        return <TrendingUp className="h-4 w-4" />;
      case 'recent':
        return <Clock className="h-4 w-4" />;
      default:
        return <Search className="h-4 w-4" />;
    }
  };

  const getSuggestionColor = (type: SearchSuggestion['type']) => {
    switch (type) {
      case 'product':
        return 'text-blue-600 dark:text-blue-400';
      case 'category':
        return 'text-green-600 dark:text-green-400';
      case 'tag':
        return 'text-purple-600 dark:text-purple-400';
      case 'recent':
        return 'text-gray-600 dark:text-gray-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  return (
    <div className={`relative ${className}`}>
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400 dark:text-gray-500" />
          </div>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => setShowSuggestions(true)}
            placeholder={placeholder}
            className="w-full pl-10 pr-20 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
            autoComplete="off"
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
      </form>
      
      {/* Intelligent Search Suggestions */}
      {showSuggestions && filteredSuggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto"
        >
          {filteredSuggestions.map((suggestion, index) => (
            <button
              key={suggestion.id}
              type="button"
              onClick={() => handleSuggestionClick(suggestion)}
              className={`w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150 flex items-center space-x-3 ${
                index === selectedSuggestionIndex ? 'bg-gray-50 dark:bg-gray-700' : ''
              } ${index === 0 ? 'rounded-t-lg' : ''} ${
                index === filteredSuggestions.length - 1 ? 'rounded-b-lg' : 'border-b border-gray-100 dark:border-gray-700'
              }`}
            >
              <div className={`flex-shrink-0 ${getSuggestionColor(suggestion.type)}`}>
                {getSuggestionIcon(suggestion.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {suggestion.text}
                  </span>
                  {suggestion.count && (
                    <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                      {suggestion.count}
                    </span>
                  )}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                  {suggestion.type}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
      
      {/* Real-time search indicator */}
      {enableRealTime && query && !showSuggestions && (
        <div className="absolute top-full left-0 right-0 mt-1 text-xs text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-2 shadow-lg z-10">
          <div className="flex items-center space-x-2">
            <Search className="h-3 w-3" />
            <span>Searching for "{query}"...</span>
            {isLoading && <Loader2 className="h-3 w-3 animate-spin" />}
          </div>
        </div>
      )}
    </div>
  );
};
