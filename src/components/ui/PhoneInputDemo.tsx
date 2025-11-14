import React, { useState } from 'react';
import { sanitizePhoneNumber, isValidPhoneNumber, formatPhoneNumber } from '../../utils/phoneUtils';

/**
 * Demo component to show phone number sanitization in action
 * This can be used to test the phone number handling
 */
export const PhoneInputDemo: React.FC = () => {
  const [phone, setPhone] = useState('');
  const [sanitizedPhone, setSanitizedPhone] = useState('');
  const [formattedPhone, setFormattedPhone] = useState('');

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    const sanitized = sanitizePhoneNumber(input);
    const formatted = formatPhoneNumber(sanitized);
    
    setPhone(input);
    setSanitizedPhone(sanitized);
    setFormattedPhone(formatted);
  };

  const isValid = isValidPhoneNumber(phone);

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <h3 className="text-lg font-semibold mb-4">Phone Number Sanitization Demo</h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Original Input:</label>
          <input
            type="text"
            value={phone}
            onChange={handlePhoneChange}
            placeholder="Try pasting: ‪+90 533 868 87 09‬"
            className="w-full p-2 border rounded-lg"
          />
          <p className="text-xs text-gray-500 mt-1">
            Length: {phone.length} characters
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Sanitized (cleaned):</label>
          <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
            {sanitizedPhone || 'No input yet'}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Length: {sanitizedPhone.length} characters
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Formatted (display):</label>
          <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            {formattedPhone || 'No input yet'}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Validation:</label>
          <div className={`p-2 rounded-lg ${isValid ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
            <span className={isValid ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
              {isValid ? '✓ Valid phone number' : '✗ Invalid phone number'}
            </span>
          </div>
        </div>

        <div className="text-xs text-gray-500">
          <p><strong>Test cases:</strong></p>
          <ul className="list-disc list-inside space-y-1">
            <li>‪+90 533 868 87 09‬ (with invisible characters)</li>
            <li>+90 533 868 87 09 (normal)</li>
            <li>0533 868 87 09 (local format)</li>
            <li>+905338688709 (no spaces)</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

