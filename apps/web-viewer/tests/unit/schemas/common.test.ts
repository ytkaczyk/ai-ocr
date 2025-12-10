import { describe, it, expect } from 'vitest';
import {
  languageCodeSchema,
  validateLanguageCode,
  isValidLanguageCode,
} from '@/lib/schemas/common';

describe('languageCodeSchema', () => {
  it('should validate correct language codes', () => {
    const validCodes = ['en-US', 'es-ES', 'fr-FR', 'de-DE', 'pt-BR', 'zh-CN'];

    validCodes.forEach((code) => {
      expect(languageCodeSchema.safeParse(code).success).toBe(true);
    });
  });

  it('should reject invalid language codes', () => {
    const invalidCodes = [
      'en',        // Missing country
      'EN-US',     // Uppercase language
      'en-us',     // Lowercase country
      'en_US',     // Wrong separator
      'english-US', // Too long language
      'en-USA',    // Too long country
      '',          // Empty string
      'en-U',      // Too short country
    ];

    invalidCodes.forEach((code) => {
      expect(languageCodeSchema.safeParse(code).success).toBe(false);
    });
  });

  it('should support 3-letter language codes', () => {
    const threeLetterCodes = ['eng-US', 'spa-ES', 'fra-FR'];

    threeLetterCodes.forEach((code) => {
      expect(languageCodeSchema.safeParse(code).success).toBe(true);
    });
  });
});

describe('validateLanguageCode', () => {
  it('should return parsed language code for valid input', () => {
    const result = validateLanguageCode('en-US');
    expect(result).toBe('en-US');
  });

  it('should throw ZodError for invalid input', () => {
    expect(() => validateLanguageCode('invalid')).toThrow();
  });
});

describe('isValidLanguageCode', () => {
  it('should return true for valid language codes', () => {
    expect(isValidLanguageCode('en-US')).toBe(true);
    expect(isValidLanguageCode('es-ES')).toBe(true);
  });

  it('should return false for invalid language codes', () => {
    expect(isValidLanguageCode('en')).toBe(false);
    expect(isValidLanguageCode('EN-US')).toBe(false);
    expect(isValidLanguageCode('')).toBe(false);
  });

  it('should work as a type guard', () => {
    const code: string = 'en-US';
    
    if (isValidLanguageCode(code)) {
      // Type should be narrowed to LanguageCode
      const languageCode: string = code;
      expect(languageCode).toBe('en-US');
    }
  });
});
