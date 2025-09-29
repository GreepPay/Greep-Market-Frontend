/**
 * Utility functions for handling number inputs and form field improvements
 */

/**
 * Formats a number value for display in input fields
 * @param value - The number value to format
 * @param precision - Number of decimal places (optional)
 * @returns Formatted string value
 */
export const formatNumberForInput = (value: number | string | null | undefined, precision?: number): string => {
  if (value === null || value === undefined || value === '') {
    return '';
  }
  
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(numValue)) {
    return '';
  }
  
  if (precision !== undefined) {
    return numValue.toFixed(precision);
  }
  
  return String(numValue);
};

/**
 * Parses a string value to a number, handling edge cases
 * @param value - The string value to parse
 * @param defaultValue - Default value if parsing fails
 * @returns Parsed number or default value
 */
export const parseNumberFromInput = (value: string, defaultValue: number = 0): number => {
  if (value === '' || value === null || value === undefined) {
    return defaultValue;
  }
  
  const parsed = parseFloat(value);
  return isNaN(parsed) ? defaultValue : parsed;
};

/**
 * Validates if a number input value is valid
 * @param value - The value to validate
 * @param min - Minimum allowed value (optional)
 * @param max - Maximum allowed value (optional)
 * @returns Object with validation result and message
 */
export const validateNumberInput = (
  value: number | string,
  min?: number,
  max?: number
): { isValid: boolean; message?: string } => {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(numValue)) {
    return { isValid: false, message: 'Please enter a valid number' };
  }
  
  if (min !== undefined && numValue < min) {
    return { isValid: false, message: `Value must be at least ${min}` };
  }
  
  if (max !== undefined && numValue > max) {
    return { isValid: false, message: `Value must be at most ${max}` };
  }
  
  return { isValid: true };
};

/**
 * Handles focus events for number inputs to improve UX
 * @param event - The focus event
 * @param selectText - Whether to select all text on focus
 * @param clearZero - Whether to clear zero values on focus
 */
export const handleNumberInputFocus = (
  event: React.FocusEvent<HTMLInputElement>,
  selectText: boolean = true,
  clearZero: boolean = true
) => {
  const input = event.target;
  
  // Select all text for easy editing
  if (selectText) {
    setTimeout(() => {
      input.select();
    }, 0);
  }
  
  // Clear zero values if enabled
  if (clearZero && (input.value === '0' || input.value === '0.00')) {
    input.value = '';
  }
};

/**
 * Handles blur events for number inputs
 * @param event - The blur event
 * @param defaultValue - Default value to set if field is empty
 * @param required - Whether the field is required
 */
export const handleNumberInputBlur = (
  event: React.FocusEvent<HTMLInputElement>,
  defaultValue: number = 0,
  required: boolean = false
) => {
  const input = event.target;
  
  // Set default value if field is empty and required
  if (input.value === '' && required) {
    input.value = String(defaultValue);
  }
};

/**
 * Creates a number input handler that provides better UX
 * @param onChange - The onChange callback function
 * @param precision - Number of decimal places (optional)
 * @returns Object with event handlers
 */
export const createNumberInputHandlers = (
  onChange: (value: number | string) => void,
  precision?: number
) => {
  return {
    onFocus: (event: React.FocusEvent<HTMLInputElement>) => {
      handleNumberInputFocus(event, true, true);
    },
    
    onBlur: (event: React.FocusEvent<HTMLInputElement>) => {
      handleNumberInputBlur(event, 0, false);
    },
    
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      
      if (value === '') {
        onChange('');
        return;
      }
      
      const numValue = parseFloat(value);
      if (!isNaN(numValue)) {
        const finalValue = precision !== undefined ? 
          Math.round(numValue * Math.pow(10, precision)) / Math.pow(10, precision) : 
          numValue;
        onChange(finalValue);
      }
    }
  };
};
