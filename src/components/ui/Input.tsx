import React, { useRef, useEffect } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  selectOnFocus?: boolean;
  clearZeroOnFocus?: boolean;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  className = '',
  selectOnFocus = false,
  clearZeroOnFocus = false,
  type,
  value,
  onFocus,
  onChange,
  ...props
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  
  const inputClasses = `w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-200 ${
    error ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
  } ${className}`;

  // Handle focus events for better UX
  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    // Call original onFocus if provided
    if (onFocus) {
      onFocus(e);
    }

    // Auto-select text for easy editing
    if (selectOnFocus) {
      e.target.select();
    }

    // Clear zero values for number inputs
    if (clearZeroOnFocus && type === 'number' && (value === '0' || value === 0)) {
      e.target.value = '';
      // Trigger onChange to update the parent state
      if (onChange) {
        const syntheticEvent = {
          ...e,
          target: { ...e.target, value: '' }
        } as React.ChangeEvent<HTMLInputElement>;
        onChange(syntheticEvent);
      }
    }
  };

  // Handle blur events to restore placeholder-like behavior
  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    // If the field is empty and it's a number input, we might want to set it to 0
    // But only if the field is required or has a default value
    if (type === 'number' && e.target.value === '' && props.required) {
      e.target.value = '0';
      if (onChange) {
        const syntheticEvent = {
          ...e,
          target: { ...e.target, value: '0' }
        } as React.ChangeEvent<HTMLInputElement>;
        onChange(syntheticEvent);
      }
    }
  };

  // Determine if we should apply number input enhancements
  const isNumberInput = type === 'number';
  const shouldSelectOnFocus = selectOnFocus || isNumberInput;
  const shouldClearZeroOnFocus = clearZeroOnFocus || isNumberInput;
  
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
        type={type}
        value={value}
        onChange={onChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
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

