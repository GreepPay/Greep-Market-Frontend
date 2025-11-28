// Category normalization and persistence utilities

// Normalize category names to handle variations like "Drink" vs "Drinks"
export const normalizeCategoryName = (category: string): string => {
  if (!category) return '';
  
  // Convert to lowercase and trim
  let normalized = category.toLowerCase().trim();
  
  // Handle common pluralization patterns
  const pluralizationRules = [
    // Remove trailing 's' for common words
    { pattern: /^(.+)s$/, replacement: '$1' },
    // Handle specific cases
    { pattern: /^(.+)ies$/, replacement: '$1y' }, // categories -> category
    { pattern: /^(.+)ves$/, replacement: '$1f' }, // leaves -> leaf
  ];
  
  // Apply pluralization rules
  for (const rule of pluralizationRules) {
    if (rule.pattern.test(normalized)) {
      normalized = normalized.replace(rule.pattern, rule.replacement);
      break;
    }
  }
  
  // Capitalize first letter
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
};

// Get all unique normalized categories from products
export const getNormalizedCategories = (products: any[]): string[] => {
  if (!Array.isArray(products)) return [];
  
  const normalizedCategories = new Set<string>();
  
  products.forEach(product => {
    if (product.category) {
      const normalized = normalizeCategoryName(product.category);
      if (normalized) {
        normalizedCategories.add(normalized);
      }
    }
  });
  
  return Array.from(normalizedCategories).sort();
};

// Get saved categories from localStorage
export const getSavedCategories = (): string[] => {
  try {
    const saved = localStorage.getItem('greep_saved_categories');
    return saved ? JSON.parse(saved) : [];
  } catch (error) {
    console.error('Error loading saved categories:', error);
    return [];
  }
};

// Save categories to localStorage
export const saveCategories = (categories: string[]): void => {
  try {
    localStorage.setItem('greep_saved_categories', JSON.stringify(categories));
  } catch (error) {
    console.error('Error saving categories:', error);
  }
};

// Add a new category to saved categories
export const addSavedCategory = (category: string): void => {
  const normalized = normalizeCategoryName(category);
  if (!normalized) return;
  
  const saved = getSavedCategories();
  if (!saved.includes(normalized)) {
    saved.push(normalized);
    saveCategories(saved.sort());
  }
};

// Get all available categories (saved + from products)
export const getAllAvailableCategories = (products: any[]): string[] => {
  const savedCategories = getSavedCategories();
  const productCategories = getNormalizedCategories(products);
  
  // Combine and deduplicate
  const allCategories = new Set([...savedCategories, ...productCategories]);
  return Array.from(allCategories).sort();
};

// Map old category to normalized category
export const mapToNormalizedCategory = (oldCategory: string, availableCategories: string[]): string => {
  const normalized = normalizeCategoryName(oldCategory);
  
  // Find exact match
  const exactMatch = availableCategories.find(cat => 
    cat.toLowerCase() === normalized.toLowerCase()
  );
  
  if (exactMatch) {
    return exactMatch;
  }
  
  // Find similar match (fuzzy matching)
  const similarMatch = availableCategories.find(cat => 
    cat.toLowerCase().includes(normalized.toLowerCase()) ||
    normalized.toLowerCase().includes(cat.toLowerCase())
  );
  
  return similarMatch || normalized;
};

// Calculate similarity between two strings (0-1, where 1 is identical)
const calculateSimilarity = (str1: string, str2: string): number => {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();
  
  // Exact match
  if (s1 === s2) return 1;
  
  // One contains the other (high similarity)
  if (s1.includes(s2) || s2.includes(s1)) {
    const longer = Math.max(s1.length, s2.length);
    const shorter = Math.min(s1.length, s2.length);
    return shorter / longer;
  }
  
  // Calculate Levenshtein distance similarity
  const maxLength = Math.max(s1.length, s2.length);
  if (maxLength === 0) return 1;
  
  const distance = levenshteinDistance(s1, s2);
  return 1 - (distance / maxLength);
};

// Simple Levenshtein distance calculation
const levenshteinDistance = (str1: string, str2: string): number => {
  const matrix: number[][] = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1       // deletion
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
};

// Merge similar categories into one
// Categories with similarity >= threshold will be merged
export const mergeSimilarCategories = (categories: string[], similarityThreshold: number = 0.7): string[] => {
  if (!Array.isArray(categories) || categories.length === 0) return [];
  
  const merged: string[] = [];
  const used = new Set<number>();
  
  for (let i = 0; i < categories.length; i++) {
    if (used.has(i)) continue;
    
    const currentCategory = categories[i];
    const similarCategories: string[] = [currentCategory];
    
    // Find all similar categories
    for (let j = i + 1; j < categories.length; j++) {
      if (used.has(j)) continue;
      
      const otherCategory = categories[j];
      const similarity = calculateSimilarity(currentCategory, otherCategory);
      
      if (similarity >= similarityThreshold) {
        similarCategories.push(otherCategory);
        used.add(j);
      }
    }
    
    // Choose the most representative category (prefer shorter, more common names)
    // Sort by length (shorter first), then alphabetically
    similarCategories.sort((a, b) => {
      if (a.length !== b.length) {
        return a.length - b.length;
      }
      return a.localeCompare(b);
    });
    
    // Use the first (shortest) category as the merged category
    merged.push(similarCategories[0]);
    used.add(i);
  }
  
  return merged.sort();
};
