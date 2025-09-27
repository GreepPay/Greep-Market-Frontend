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
