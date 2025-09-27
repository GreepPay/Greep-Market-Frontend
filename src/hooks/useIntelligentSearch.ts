import { useState, useCallback, useMemo } from 'react';
import { Product } from '../types';

interface SearchSuggestion {
  id: string;
  text: string;
  type: 'product' | 'category' | 'tag' | 'recent';
  count?: number;
}

interface UseIntelligentSearchProps {
  products: Product[];
  maxRecentSearches?: number;
}

export const useIntelligentSearch = ({ 
  products, 
  maxRecentSearches = 10 
}: UseIntelligentSearchProps) => {
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  // Load recent searches from localStorage on mount
  useState(() => {
    const saved = localStorage.getItem('recentSearches');
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved));
      } catch (error) {
        console.error('Failed to load recent searches:', error);
      }
    }
  });

  // Save recent searches to localStorage
  const saveRecentSearches = useCallback((searches: string[]) => {
    localStorage.setItem('recentSearches', JSON.stringify(searches));
  }, []);

  // Add search to recent searches
  const addToRecentSearches = useCallback((query: string) => {
    if (!query.trim()) return;
    
    setRecentSearches(prev => {
      const filtered = prev.filter(search => search.toLowerCase() !== query.toLowerCase());
      const updated = [query, ...filtered].slice(0, maxRecentSearches);
      saveRecentSearches(updated);
      return updated;
    });
  }, [maxRecentSearches, saveRecentSearches]);

  // Generate search suggestions from products
  const suggestions = useMemo((): SearchSuggestion[] => {
    const suggestionMap = new Map<string, SearchSuggestion>();

    products.forEach(product => {
      // Product name suggestions
      if (product.name) {
        const existing = suggestionMap.get(product.name.toLowerCase());
        if (existing) {
          existing.count = (existing.count || 1) + 1;
        } else {
          suggestionMap.set(product.name.toLowerCase(), {
            id: `product-${product._id}`,
            text: product.name,
            type: 'product',
            count: 1,
          });
        }
      }

      // Category suggestions
      if (product.category) {
        const categoryKey = `category-${product.category.toLowerCase()}`;
        const existing = suggestionMap.get(categoryKey);
        if (existing) {
          existing.count = (existing.count || 1) + 1;
        } else {
          suggestionMap.set(categoryKey, {
            id: categoryKey,
            text: product.category,
            type: 'category',
            count: 1,
          });
        }
      }

      // Tag suggestions
      if (product.tags && Array.isArray(product.tags)) {
        product.tags.forEach(tag => {
          if (tag && tag.trim()) {
            const tagKey = `tag-${tag.toLowerCase()}`;
            const existing = suggestionMap.get(tagKey);
            if (existing) {
              existing.count = (existing.count || 1) + 1;
            } else {
              suggestionMap.set(tagKey, {
                id: tagKey,
                text: tag,
                type: 'tag',
                count: 1,
              });
            }
          }
        });
      }
    });

    return Array.from(suggestionMap.values());
  }, [products]);

  // Enhanced search function with fuzzy matching
  const searchProducts = useCallback((query: string, products: Product[]): Product[] => {
    if (!query.trim()) return products;

    const queryLower = query.toLowerCase();
    const scoredProducts: (Product & { score: number })[] = [];

    products.forEach(product => {
      let maxScore = 0;

      // Check product name
      if (product.name) {
        const nameScore = calculateMatchScore(queryLower, product.name.toLowerCase());
        maxScore = Math.max(maxScore, nameScore);
      }

      // Check category
      if (product.category) {
        const categoryScore = calculateMatchScore(queryLower, product.category.toLowerCase());
        maxScore = Math.max(maxScore, categoryScore * 0.8); // Category matches get slightly lower weight
      }

      // Check tags
      if (product.tags && Array.isArray(product.tags)) {
        product.tags.forEach(tag => {
          if (tag) {
            const tagScore = calculateMatchScore(queryLower, tag.toLowerCase());
            maxScore = Math.max(maxScore, tagScore * 0.6); // Tag matches get lower weight
          }
        });
      }

      // Check SKU and barcode for exact matches
      if (product.sku && product.sku.toLowerCase().includes(queryLower)) {
        maxScore = Math.max(maxScore, 100); // Exact SKU match gets highest score
      }
      if (product.barcode && product.barcode.includes(query)) {
        maxScore = Math.max(maxScore, 100); // Exact barcode match gets highest score
      }

      if (maxScore > 0) {
        scoredProducts.push({ ...product, score: maxScore });
      }
    });

    // Sort by score (highest first) and return products without score
    return scoredProducts
      .sort((a, b) => b.score - a.score)
      .map(({ score, ...product }) => product);
  }, []);

  // Calculate match score for fuzzy search
  const calculateMatchScore = (query: string, text: string): number => {
    if (!query || !text) return 0;

    // Exact match gets highest score
    if (text.includes(query)) {
      const index = text.indexOf(query);
      return 100 - (index / text.length) * 20; // Earlier matches get higher scores
    }

    // Word boundary matches
    const queryWords = query.split(/\s+/);
    const textWords = text.split(/\s+/);
    
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
          // Fuzzy matching for longer words
          const similarity = calculateSimilarity(queryWord, textWord);
          if (similarity > 0.7) {
            bestScore = Math.max(bestScore, similarity * 40);
          }
        }
      }
      if (bestScore > 0) {
        totalScore += bestScore;
        matchedWords++;
      }
    }

    return matchedWords > 0 ? totalScore / queryWords.length : 0;
  };

  // Calculate string similarity using Jaro-Winkler distance
  const calculateSimilarity = (str1: string, str2: string): number => {
    const len1 = str1.length;
    const len2 = str2.length;
    
    if (len1 === 0) return len2 === 0 ? 1 : 0;
    if (len2 === 0) return 0;

    const matchWindow = Math.floor(Math.max(len1, len2) / 2) - 1;
    const str1Matches = new Array(len1).fill(false);
    const str2Matches = new Array(len2).fill(false);

    let matches = 0;
    let transpositions = 0;

    // Find matches
    for (let i = 0; i < len1; i++) {
      const start = Math.max(0, i - matchWindow);
      const end = Math.min(i + matchWindow + 1, len2);
      
      for (let j = start; j < end; j++) {
        if (str2Matches[j] || str1[i] !== str2[j]) continue;
        str1Matches[i] = true;
        str2Matches[j] = true;
        matches++;
        break;
      }
    }

    if (matches === 0) return 0;

    // Count transpositions
    let k = 0;
    for (let i = 0; i < len1; i++) {
      if (!str1Matches[i]) continue;
      while (!str2Matches[k]) k++;
      if (str1[i] !== str2[k]) transpositions++;
      k++;
    }

    const jaro = (matches / len1 + matches / len2 + (matches - transpositions / 2) / matches) / 3;
    
    // Winkler modification
    let prefix = 0;
    for (let i = 0; i < Math.min(len1, len2, 4); i++) {
      if (str1[i] === str2[i]) prefix++;
      else break;
    }

    return jaro + (prefix * 0.1 * (1 - jaro));
  };

  return {
    suggestions,
    recentSearches,
    addToRecentSearches,
    searchProducts,
  };
};
