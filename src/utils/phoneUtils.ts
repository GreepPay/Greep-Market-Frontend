/**
 * Sanitizes phone numbers by removing invisible Unicode characters and normalizing format
 * @param phone - The phone number string to sanitize
 * @returns Cleaned phone number string
 */
export const sanitizePhoneNumber = (phone: string): string => {
  if (!phone) return '';
  
  // Remove invisible Unicode characters (Left-to-Right Mark, Right-to-Left Mark, etc.)
  // These characters are often copied from web pages or messaging apps
  const cleaned = phone
    .replace(/[\u200E\u200F\u202A-\u202E\u2066-\u2069]/g, '') // Remove directional formatting characters
    .replace(/[\uFEFF]/g, '') // Remove zero-width no-break space
    .replace(/[\u200B-\u200D\uFEFF]/g, '') // Remove other zero-width characters
    .trim(); // Remove leading/trailing whitespace
  
  return cleaned;
};

/**
 * Validates if a phone number has a valid format after sanitization
 * @param phone - The phone number to validate
 * @returns boolean indicating if the phone number is valid
 */
export const isValidPhoneNumber = (phone: string): boolean => {
  const sanitized = sanitizePhoneNumber(phone);
  
  // Basic phone number validation - allows international format
  // Matches: +90 533 868 87 09, +905338688709, 0533 868 87 09, etc.
  const phoneRegex = /^[+]?[0-9\s\-()]{10,20}$/;
  
  return phoneRegex.test(sanitized) && sanitized.length >= 10;
};

/**
 * Formats a phone number for display
 * @param phone - The phone number to format
 * @returns Formatted phone number string
 */
export const formatPhoneNumber = (phone: string): string => {
  const sanitized = sanitizePhoneNumber(phone);
  
  // If it starts with +90, format as Turkish number
  if (sanitized.startsWith('+90')) {
    const digits = sanitized.replace(/\D/g, '');
    if (digits.length === 13) { // +90 + 11 digits
      return `+90 ${digits.slice(2, 5)} ${digits.slice(5, 8)} ${digits.slice(8, 10)} ${digits.slice(10)}`;
    }
  }
  
  // If it starts with 0, format as local Turkish number
  if (sanitized.startsWith('0')) {
    const digits = sanitized.replace(/\D/g, '');
    if (digits.length === 11) { // 0 + 10 digits
      return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7, 9)} ${digits.slice(9)}`;
    }
  }
  
  return sanitized; // Return as-is if no specific formatting applies
};
