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
