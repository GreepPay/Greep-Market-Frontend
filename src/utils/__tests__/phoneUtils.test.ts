import { sanitizePhoneNumber, isValidPhoneNumber, formatPhoneNumber } from '../phoneUtils';

describe('Phone Utils', () => {
  describe('sanitizePhoneNumber', () => {
    it('should remove invisible Unicode characters', () => {
      // Test with the problematic phone number from the user's issue
      const input = '‪+90 533 868 87 09‬';
      const result = sanitizePhoneNumber(input);
      expect(result).toBe('+90 533 868 87 09');
    });

    it('should handle various invisible characters', () => {
      const input = '‪+90 533 868 87 09‬';
      const result = sanitizePhoneNumber(input);
      expect(result).toBe('+90 533 868 87 09');
    });

    it('should handle normal phone numbers', () => {
      const input = '+90 533 868 87 09';
      const result = sanitizePhoneNumber(input);
      expect(result).toBe('+90 533 868 87 09');
    });

    it('should handle empty strings', () => {
      const result = sanitizePhoneNumber('');
      expect(result).toBe('');
    });
  });

  describe('isValidPhoneNumber', () => {
    it('should validate Turkish international numbers', () => {
      expect(isValidPhoneNumber('+90 533 868 87 09')).toBe(true);
      expect(isValidPhoneNumber('+905338688709')).toBe(true);
    });

    it('should validate Turkish local numbers', () => {
      expect(isValidPhoneNumber('0533 868 87 09')).toBe(true);
      expect(isValidPhoneNumber('05338688709')).toBe(true);
    });

    it('should reject invalid numbers', () => {
      expect(isValidPhoneNumber('123')).toBe(false);
      expect(isValidPhoneNumber('abc')).toBe(false);
      expect(isValidPhoneNumber('')).toBe(false);
    });

    it('should handle sanitized numbers with invisible characters', () => {
      const input = '‪+90 533 868 87 09‬';
      expect(isValidPhoneNumber(input)).toBe(true);
    });
  });

  describe('formatPhoneNumber', () => {
    it('should format Turkish international numbers', () => {
      const result = formatPhoneNumber('+905338688709');
      expect(result).toBe('+90 533 868 87 09');
    });

    it('should format Turkish local numbers', () => {
      const result = formatPhoneNumber('05338688709');
      expect(result).toBe('0533 868 87 09');
    });

    it('should handle already formatted numbers', () => {
      const result = formatPhoneNumber('+90 533 868 87 09');
      expect(result).toBe('+90 533 868 87 09');
    });

    it('should handle sanitized numbers with invisible characters', () => {
      const input = '‪+90 533 868 87 09‬';
      const result = formatPhoneNumber(input);
      expect(result).toBe('+90 533 868 87 09');
    });
  });
});

