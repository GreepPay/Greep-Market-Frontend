/**
 * Utility functions for handling and formatting tags
 */

/**
 * Formats tags array for display, removing JSON-like formatting
 * @param tags - Array of tags or string representation
 * @returns Clean string representation of tags
 */
export const formatTagsForDisplay = (tags: string[] | string | any): string => {
  if (!tags) return '';
  
  // If it's already a string, try to parse it
  if (typeof tags === 'string') {
    try {
      // Handle JSON-like strings like '["tag1", "tag2"]'
      if (tags.startsWith('[') && tags.endsWith(']')) {
        const parsed = JSON.parse(tags);
        if (Array.isArray(parsed)) {
          return parsed.join(', ');
        }
      }
      // Handle comma-separated strings
      return tags;
    } catch {
      // If parsing fails, return as is
      return tags;
    }
  }
  
  // If it's an array, join with commas
  if (Array.isArray(tags)) {
    return tags.filter(tag => tag && tag.trim()).join(', ');
  }
  
  return '';
};

/**
 * Formats tags for display in a user-friendly way
 * @param tags - Array of tags
 * @returns Array of formatted tag objects for rendering
 */
export const formatTagsForUI = (tags: string[] | string | any): Array<{id: string, text: string}> => {
  if (!tags) return [];
  
  let tagArray: string[] = [];
  
  if (typeof tags === 'string') {
    try {
      if (tags.startsWith('[') && tags.endsWith(']')) {
        const parsed = JSON.parse(tags);
        if (Array.isArray(parsed)) {
          tagArray = parsed;
        }
      } else {
        tagArray = tags.split(',').map(tag => tag.trim()).filter(tag => tag);
      }
    } catch {
      tagArray = [tags];
    }
  } else if (Array.isArray(tags)) {
    tagArray = tags;
  }
  
  return tagArray
    .filter(tag => tag && tag.trim())
    .map((tag, index) => ({
      id: `tag-${index}`,
      text: tag.trim()
    }));
};

/**
 * Cleans and validates tags input
 * @param input - Raw tags input (string or array)
 * @returns Clean array of tags
 */
export const cleanTagsInput = (input: string | string[] | any): string[] => {
  if (!input) return [];
  
  let tags: string[] = [];
  
  if (typeof input === 'string') {
    try {
      if (input.startsWith('[') && input.endsWith(']')) {
        const parsed = JSON.parse(input);
        if (Array.isArray(parsed)) {
          tags = parsed;
        }
      } else {
        tags = input.split(',').map(tag => tag.trim()).filter(tag => tag);
      }
    } catch {
      tags = [input];
    }
  } else if (Array.isArray(input)) {
    tags = input;
  }
  
  return tags
    .filter(tag => tag && typeof tag === 'string' && tag.trim())
    .map(tag => tag.trim())
    .filter((tag, index, array) => array.indexOf(tag) === index); // Remove duplicates
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

// Get all tags from products
export const getAllTagsFromProducts = (products: any[]): string[] => {
  if (!Array.isArray(products)) return [];
  
  const allTags = new Set<string>();
  
  products.forEach(product => {
    if (product.tags && Array.isArray(product.tags)) {
      product.tags.forEach((tag: string) => {
        if (tag && typeof tag === 'string' && tag.trim()) {
          allTags.add(tag.trim());
        }
      });
    }
  });
  
  return Array.from(allTags).sort();
};

// Merge similar tags into one
// Tags with similarity >= threshold will be merged
export const mergeSimilarTags = (tags: string[], similarityThreshold: number = 0.7): string[] => {
  if (!Array.isArray(tags) || tags.length === 0) return [];
  
  const merged: string[] = [];
  const used = new Set<number>();
  
  for (let i = 0; i < tags.length; i++) {
    if (used.has(i)) continue;
    
    const currentTag = tags[i];
    const similarTags: string[] = [currentTag];
    
    // Find all similar tags
    for (let j = i + 1; j < tags.length; j++) {
      if (used.has(j)) continue;
      
      const otherTag = tags[j];
      const similarity = calculateSimilarity(currentTag, otherTag);
      
      if (similarity >= similarityThreshold) {
        similarTags.push(otherTag);
        used.add(j);
      }
    }
    
    // Choose the most representative tag (prefer shorter, more common names)
    // Sort by length (shorter first), then alphabetically
    similarTags.sort((a, b) => {
      if (a.length !== b.length) {
        return a.length - b.length;
      }
      return a.localeCompare(b);
    });
    
    // Use the first (shortest) tag as the merged tag
    merged.push(similarTags[0]);
    used.add(i);
  }
  
  return merged.sort();
};
