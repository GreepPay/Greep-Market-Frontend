import React, { useRef, useState, useEffect } from 'react';

interface NumberInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'value' | 'onChange'> {
  label?: string;
  error?: string;
  helperText?: string;
  value?: number | string;
  onChange?: (value: number | string) => void;
  allowEmpty?: boolean;
  selectOnFocus?: boolean;
  clearZeroOnFocus?: boolean;
  min?: number;
  max?: number;
  step?: number;
  precision?: number; // Number of decimal places
}

export const NumberInput: React.FC<NumberInputProps> = ({
  label,
  error,
  helperText,
  className = '',
  value = '',
  onChange,
  allowEmpty = true,
  selectOnFocus = true,
  clearZeroOnFocus = true,
  min,
  max,
  step = 1,
  precision,
  placeholder,
  ...props
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [displayValue, setDisplayValue] = useState<string>('');
  const [isFocused, setIsFocused] = useState(false);

  // Update display value when prop value changes
  useEffect(() => {
    if (!isFocused) {
      if (value === '' || value === null || value === undefined) {
        setDisplayValue('');
      } else {
        setDisplayValue(String(value));
      }
    }
  }, [value, isFocused]);

  const inputClasses = `w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-200 ${
    error ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
  } ${className}`;

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    setDisplayValue(inputValue);

    // Allow empty values if allowEmpty is true
    if (inputValue === '') {
      if (allowEmpty && onChange) {
        onChange('');
      }
      return;
    }

    // Parse the number
    const numValue = parseFloat(inputValue);
    
    // Check if it's a valid number
    if (!isNaN(numValue)) {
      // Apply precision if specified
      const finalValue = precision !== undefined ? 
        Math.round(numValue * Math.pow(10, precision)) / Math.pow(10, precision) : 
        numValue;

      // Apply min/max constraints
      let constrainedValue = finalValue;
      if (min !== undefined && constrainedValue < min) {
        constrainedValue = min;
      }
      if (max !== undefined && constrainedValue > max) {
        constrainedValue = max;
      }

      if (onChange) {
        onChange(constrainedValue);
      }
    }
  };

  // Handle focus events
  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    
    // Auto-select text for easy editing
    if (selectOnFocus) {
      setTimeout(() => {
        e.target.select();
      }, 0);
    }

    // Clear zero values if clearZeroOnFocus is enabled
    if (clearZeroOnFocus && (value === 0 || value === '0')) {
      setDisplayValue('');
      if (onChange) {
        onChange('');
      }
    }
  };

  // Handle blur events
  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(false);
    
    // If the field is empty and it's required, set to 0
    if (e.target.value === '' && props.required) {
      setDisplayValue('0');
      if (onChange) {
        onChange(0);
      }
    } else if (e.target.value === '' && !allowEmpty) {
      setDisplayValue('0');
      if (onChange) {
        onChange(0);
      }
    }
  };

  // Handle key events for better UX
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Allow: backspace, delete, tab, escape, enter, home, end, left, right, up, down
    if ([8, 9, 27, 13, 46, 35, 36, 37, 38, 39, 40].indexOf(e.keyCode) !== -1 ||
        // Allow: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
        (e.keyCode === 65 && e.ctrlKey === true) ||
        (e.keyCode === 67 && e.ctrlKey === true) ||
        (e.keyCode === 86 && e.ctrlKey === true) ||
        (e.keyCode === 88 && e.ctrlKey === true) ||
        // Allow: period (for decimals)
        (e.keyCode === 190 || e.keyCode === 110) ||
        // Allow: minus (for negative numbers)
        (e.keyCode === 189 || e.keyCode === 109)) {
      return;
    }
    // Ensure that it is a number and stop the keypress
    if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
      e.preventDefault();
    }
  };

  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
      )}
      <input
        ref={inputRef}
        className={inputClasses}
        type="text"
        inputMode="numeric"
        value={displayValue}
        onChange={handleInputChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        min={min}
        max={max}
        step={step}
        {...props}
      />
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
      {helperText && !error && (
        <p className="text-sm text-gray-500 dark:text-gray-400">{helperText}</p>
      )}
    </div>
  );
};
