import { describe, it, expect } from 'vitest';
import {
  preventPathTraversal,
  validateFilename,
  sanitizeLanguageCode,
  sanitizePageNumber,
  sanitizePaneWidth,
} from '@/lib/utils/security';

describe('preventPathTraversal', () => {
  const baseDir = '/safe/directory';

  it('should allow valid paths within base directory', () => {
    const result = preventPathTraversal('subdir/file.txt', baseDir);
    expect(result).toContain('safe');
    expect(result).toContain('subdir');
  });

  it('should reject path traversal attempts with ../', () => {
    expect(() => {
      preventPathTraversal('../../../etc/passwd', baseDir);
    }).toThrow('Path traversal detected');
  });

  it('should reject absolute paths outside base directory', () => {
    expect(() => {
      preventPathTraversal('/etc/passwd', baseDir);
    }).toThrow('Path traversal detected');
  });

  it('should allow base directory itself', () => {
    const result = preventPathTraversal('.', baseDir);
    // On Windows, the result will be normalized to Windows path format
    expect(result).toContain('safe');
    expect(result).toContain('directory');
  });
});

describe('validateFilename', () => {
  it('should allow valid filenames', () => {
    const validNames = ['document', 'my-file', 'test_123', 'ABC-xyz_000'];

    validNames.forEach((name) => {
      expect(validateFilename(name)).toBe(name);
    });
  });

  it('should reject filenames with special characters', () => {
    const invalidNames = [
      'file.txt',    // Period
      'file with spaces',  // Spaces
      'file@name',   // @ symbol
      'file/path',   // Slash
      'file\\path',  // Backslash
      'file:name',   // Colon
    ];

    invalidNames.forEach((name) => {
      expect(() => validateFilename(name)).toThrow('Only alphanumeric');
    });
  });

  it('should reject empty filenames', () => {
    expect(() => validateFilename('')).toThrow('cannot be empty');
  });

  it('should reject filenames exceeding 255 characters', () => {
    const longName = 'a'.repeat(256);
    expect(() => validateFilename(longName)).toThrow('exceeds 255 characters');
  });

  it('should allow filenames at 255 character limit', () => {
    const maxName = 'a'.repeat(255);
    expect(validateFilename(maxName)).toBe(maxName);
  });
});

describe('sanitizeLanguageCode', () => {
  it('should accept valid language codes', () => {
    expect(sanitizeLanguageCode('en-US')).toBe('en-US');
    expect(sanitizeLanguageCode('es-ES')).toBe('es-ES');
    expect(sanitizeLanguageCode('fr-FR')).toBe('fr-FR');
  });

  it('should trim whitespace', () => {
    expect(sanitizeLanguageCode('  en-US  ')).toBe('en-US');
  });

  it('should reject invalid formats', () => {
    const invalid = ['en', 'EN-US', 'en-us', 'en_US', 'english'];

    invalid.forEach((code) => {
      expect(() => sanitizeLanguageCode(code)).toThrow('Invalid language code');
    });
  });
});

describe('sanitizePageNumber', () => {
  const maxPages = 100;

  it('should accept valid page numbers', () => {
    expect(sanitizePageNumber(1, maxPages)).toBe(1);
    expect(sanitizePageNumber(50, maxPages)).toBe(50);
    expect(sanitizePageNumber(100, maxPages)).toBe(100);
  });

  it('should parse string numbers', () => {
    expect(sanitizePageNumber('42', maxPages)).toBe(42);
  });

  it('should reject page numbers less than 1', () => {
    expect(() => sanitizePageNumber(0, maxPages)).toThrow('at least 1');
    expect(() => sanitizePageNumber(-5, maxPages)).toThrow('at least 1');
  });

  it('should reject page numbers exceeding maxPages', () => {
    expect(() => sanitizePageNumber(101, maxPages)).toThrow('not exceed 100');
    expect(() => sanitizePageNumber(999, maxPages)).toThrow('not exceed 100');
  });

  it('should reject invalid numbers', () => {
    expect(() => sanitizePageNumber('abc', maxPages)).toThrow('valid number');
    expect(() => sanitizePageNumber(NaN, maxPages)).toThrow('valid number');
    expect(() => sanitizePageNumber(Infinity, maxPages)).toThrow('valid number');
  });
});

describe('sanitizePaneWidth', () => {
  it('should accept valid width percentages', () => {
    expect(sanitizePaneWidth(50)).toBe(50);
    expect(sanitizePaneWidth(10)).toBe(10);
    expect(sanitizePaneWidth(80)).toBe(80);
  });

  it('should parse string widths', () => {
    expect(sanitizePaneWidth('33.33')).toBe(33.33);
  });

  it('should reject widths below 10%', () => {
    expect(() => sanitizePaneWidth(5)).toThrow('between 10% and 80%');
    expect(() => sanitizePaneWidth(0)).toThrow('between 10% and 80%');
  });

  it('should reject widths above 80%', () => {
    expect(() => sanitizePaneWidth(85)).toThrow('between 10% and 80%');
    expect(() => sanitizePaneWidth(100)).toThrow('between 10% and 80%');
  });

  it('should reject invalid numbers', () => {
    expect(() => sanitizePaneWidth('abc')).toThrow('valid number');
    expect(() => sanitizePaneWidth(NaN)).toThrow('valid number');
  });
});
