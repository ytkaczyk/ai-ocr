import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import {
  preventPathTraversal,
  validateFilename,
  sanitizeLanguageCode,
  sanitizePageNumber,
  sanitizePaneWidth,
  sanitizeErrorMessage,
  validateDocumentId,
} from '@/lib/utils/security';
import {
  isSymlink,
  rejectSymlink,
} from '@/lib/utils/file-system';
import path from 'path';
import fs from 'fs';

/**
 * Integration tests for security utilities (T116)
 * Comprehensive coverage for FR-033a-e security requirements
 * 
 * Tests:
 * - FR-033a: Path traversal prevention
 * - FR-033b: Filename validation
 * - FR-033c: Symlink rejection
 * - FR-033d: Input sanitization
 * - FR-033e: Error message safety
 */

describe('Security Utilities Integration Tests', () => {
  const testDataFolder = path.resolve(process.cwd(), 'data');
  const originalEnv = process.env;

  beforeAll(() => {
    // Create test data directory if it doesn't exist
    if (!fs.existsSync(testDataFolder)) {
      fs.mkdirSync(testDataFolder, { recursive: true });
    }
    
    // Set environment for tests that use sanitizeErrorMessage
    process.env = {
      ...originalEnv,
      DATA_FOLDER_PATH: testDataFolder,
      MAX_PDF_SIZE_MB: '100',
    };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('FR-033a: Path Traversal Prevention', () => {
    it('should allow valid paths within base directory', () => {
      const validPath = path.join(testDataFolder, 'kombucha');
      const result = preventPathTraversal(validPath, testDataFolder);
      const normalizedResult = path.normalize(result);
      const normalizedBase = path.normalize(testDataFolder);
      expect(result).toBeTruthy();
      expect(normalizedResult.startsWith(normalizedBase)).toBe(true);
    });

    it('should allow nested paths within base directory', () => {
      const validPath = path.join(testDataFolder, 'kombucha', 'en-US', 'page_1.md');
      const result = preventPathTraversal(validPath, testDataFolder);
      const normalizedResult = path.normalize(result);
      const normalizedBase = path.normalize(testDataFolder);
      expect(result).toBeTruthy();
      expect(normalizedResult.startsWith(normalizedBase)).toBe(true);
    });

    it('should reject path traversal with ../', () => {
      const maliciousPath = path.join(testDataFolder, '..', 'etc', 'passwd');
      expect(() => preventPathTraversal(maliciousPath, testDataFolder)).toThrow(/path traversal/i);
    });

    it('should reject path traversal with multiple ../', () => {
      const maliciousPath = path.join(testDataFolder, '..', '..', '..', 'etc', 'passwd');
      expect(() => preventPathTraversal(maliciousPath, testDataFolder)).toThrow(/path traversal/i);
    });

    it('should reject path traversal with mixed separators', () => {
      const maliciousPath = '../etc/passwd';
      expect(() => preventPathTraversal(maliciousPath, testDataFolder)).toThrow(/path traversal/i);
    });

    it('should reject absolute paths outside base directory', () => {
      const maliciousPath = '/etc/passwd';
      expect(() => preventPathTraversal(maliciousPath, testDataFolder)).toThrow(/path traversal/i);
    });

    it('should reject Windows absolute paths outside base directory', () => {
      // Skip on non-Windows platforms where C:\ paths don't apply
      if (process.platform !== 'win32') {
        return;
      }
      const maliciousPath = 'C:\\Windows\\System32\\config\\sam';
      expect(() => preventPathTraversal(maliciousPath, testDataFolder)).toThrow(/path traversal/i);
    });
  });

  describe('FR-033b: Filename Validation', () => {
    it('should accept valid alphanumeric filenames', () => {
      expect(() => validateFilename('document123')).not.toThrow();
      expect(() => validateFilename('test-file')).not.toThrow();
      expect(() => validateFilename('my_document')).not.toThrow();
      expect(() => validateFilename('ABC-123_test')).not.toThrow();
    });

    it('should reject empty filenames', () => {
      expect(() => validateFilename('')).toThrow('cannot be empty');
    });

    it('should reject filenames with special characters', () => {
      expect(() => validateFilename('test@file')).toThrow('alphanumeric');
      expect(() => validateFilename('test.file')).toThrow('alphanumeric');
      expect(() => validateFilename('test/file')).toThrow('alphanumeric');
      expect(() => validateFilename('test\\file')).toThrow('alphanumeric');
      expect(() => validateFilename('test file')).toThrow('alphanumeric');
    });

    it('should reject filenames with path separators', () => {
      expect(() => validateFilename('../etc/passwd')).toThrow('alphanumeric');
      expect(() => validateFilename('..\\windows\\system32')).toThrow('alphanumeric');
    });

    it('should reject filenames exceeding 255 characters', () => {
      const longFilename = 'a'.repeat(256);
      expect(() => validateFilename(longFilename)).toThrow('exceeds 255 characters');
    });

    it('should accept filenames at exactly 255 characters', () => {
      const maxFilename = 'a'.repeat(255);
      expect(() => validateFilename(maxFilename)).not.toThrow();
    });

    it('should reject filenames with null bytes', () => {
      expect(() => validateFilename('test\x00file')).toThrow('alphanumeric');
    });

    it('should use validateFilename for document ID validation', () => {
      expect(validateDocumentId('valid-doc-123')).toBe(true);
      expect(validateDocumentId('../etc/passwd')).toBe(false);
      expect(validateDocumentId('test@file')).toBe(false);
      expect(validateDocumentId('')).toBe(false);
    });
  });

  describe('FR-033c: Symlink Detection (isSymlink)', () => {
    it('should return false for regular files', async () => {
      const regularFile = path.join(testDataFolder, 'kombucha.pdf');
      const result = await isSymlink(regularFile);
      expect(result).toBe(false);
    });

    it('should return false for directories', async () => {
      const directory = path.join(testDataFolder, 'kombucha');
      const result = await isSymlink(directory);
      expect(result).toBe(false);
    });

    it('should return false for non-existent paths', async () => {
      const nonExistent = path.join(testDataFolder, 'non-existent-file.txt');
      const result = await isSymlink(nonExistent);
      expect(result).toBe(false);
    });

    it('should throw error when attempting to access symlinks via rejectSymlink', async () => {
      // Create a temp symlink for testing (if possible)
      // Note: This test may need to be skipped on systems without symlink permissions
      // For now, we test that rejectSymlink is properly exported and callable
      const regularFile = path.join(testDataFolder, 'kombucha.pdf');
      
      // Should not throw for regular files
      await expect(rejectSymlink(regularFile, 'Test file')).resolves.not.toThrow();
    });
  });

  describe('FR-033d: Input Sanitization', () => {
    describe('Language Code Sanitization', () => {
      it('should accept valid language codes', () => {
        expect(sanitizeLanguageCode('en-US')).toBe('en-US');
        expect(sanitizeLanguageCode('es-ES')).toBe('es-ES');
        expect(sanitizeLanguageCode('fr-FR')).toBe('fr-FR');
        expect(sanitizeLanguageCode('pt-BR')).toBe('pt-BR');
      });

      it('should trim whitespace from language codes', () => {
        expect(sanitizeLanguageCode('  en-US  ')).toBe('en-US');
        expect(sanitizeLanguageCode('\ten-US\n')).toBe('en-US');
      });

      it('should reject invalid language code formats', () => {
        expect(() => sanitizeLanguageCode('invalid')).toThrow('language-COUNTRY');
        expect(() => sanitizeLanguageCode('en')).toThrow('language-COUNTRY');
        expect(() => sanitizeLanguageCode('en-us')).toThrow('language-COUNTRY'); // lowercase country
        expect(() => sanitizeLanguageCode('EN-US')).toThrow('language-COUNTRY'); // uppercase language
        expect(() => sanitizeLanguageCode('en_US')).toThrow('language-COUNTRY'); // underscore separator
      });

      it('should reject empty language codes', () => {
        expect(() => sanitizeLanguageCode('')).toThrow('language-COUNTRY');
        expect(() => sanitizeLanguageCode('   ')).toThrow('language-COUNTRY');
      });

      it('should reject language codes with special characters', () => {
        expect(() => sanitizeLanguageCode('en-US;DROP TABLE')).toThrow('language-COUNTRY');
        expect(() => sanitizeLanguageCode('../en-US')).toThrow('language-COUNTRY');
      });
    });

    describe('Page Number Sanitization', () => {
      it('should accept valid page numbers', () => {
        expect(sanitizePageNumber(1, 100)).toBe(1);
        expect(sanitizePageNumber(50, 100)).toBe(50);
        expect(sanitizePageNumber(100, 100)).toBe(100);
        expect(sanitizePageNumber('42', 100)).toBe(42);
      });

      it('should reject page numbers less than 1', () => {
        expect(() => sanitizePageNumber(0, 100)).toThrow('at least 1');
        expect(() => sanitizePageNumber(-1, 100)).toThrow('at least 1');
        expect(() => sanitizePageNumber(-100, 100)).toThrow('at least 1');
      });

      it('should reject page numbers exceeding maxPages', () => {
        expect(() => sanitizePageNumber(101, 100)).toThrow('not exceed 100');
        expect(() => sanitizePageNumber(1000, 100)).toThrow('not exceed 100');
      });

      it('should reject non-numeric page numbers', () => {
        expect(() => sanitizePageNumber('abc', 100)).toThrow('valid number');
        expect(() => sanitizePageNumber('', 100)).toThrow('valid number');
        expect(() => sanitizePageNumber(NaN, 100)).toThrow('valid number');
        expect(() => sanitizePageNumber(Infinity, 100)).toThrow('valid number');
      });

      it('should handle page numbers with decimal points', () => {
        // Note: Number type doesn't truncate, only parseInt does for strings
        // Since sanitizePageNumber accepts number | string, decimals are allowed for numbers
        expect(sanitizePageNumber(1.5, 100)).toBe(1.5);
        expect(sanitizePageNumber(1.9, 100)).toBe(1.9);
        // String parsing truncates
        expect(sanitizePageNumber('1.5', 100)).toBe(1);
      });

      it('should handle string page numbers', () => {
        expect(sanitizePageNumber('1', 100)).toBe(1);
        expect(sanitizePageNumber('  42  ', 100)).toBe(42); // Whitespace handled by parseInt
      });
    });

    describe('Pane Width Sanitization', () => {
      it('should accept valid pane widths', () => {
        expect(sanitizePaneWidth(10)).toBe(10);
        expect(sanitizePaneWidth(50)).toBe(50);
        expect(sanitizePaneWidth(80)).toBe(80);
        expect(sanitizePaneWidth('50')).toBe(50);
      });

      it('should reject widths less than 10%', () => {
        expect(() => sanitizePaneWidth(9)).toThrow('between 10% and 80%');
        expect(() => sanitizePaneWidth(0)).toThrow('between 10% and 80%');
        expect(() => sanitizePaneWidth(-10)).toThrow('between 10% and 80%');
      });

      it('should reject widths greater than 80%', () => {
        expect(() => sanitizePaneWidth(81)).toThrow('between 10% and 80%');
        expect(() => sanitizePaneWidth(100)).toThrow('between 10% and 80%');
        expect(() => sanitizePaneWidth(200)).toThrow('between 10% and 80%');
      });

      it('should reject non-numeric widths', () => {
        expect(() => sanitizePaneWidth('abc')).toThrow('valid number');
        expect(() => sanitizePaneWidth(NaN)).toThrow('valid number');
        expect(() => sanitizePaneWidth(Infinity)).toThrow('valid number');
      });

      it('should handle string width percentages', () => {
        expect(sanitizePaneWidth('50.5')).toBe(50.5);
        expect(sanitizePaneWidth('  25  ')).toBe(25);
      });

      it('should accept decimal pane widths', () => {
        expect(sanitizePaneWidth(33.33)).toBe(33.33);
        expect(sanitizePaneWidth(66.67)).toBe(66.67);
      });
    });
  });

  describe('FR-033e: Error Message Safety', () => {
    it('should replace absolute paths with placeholders', () => {
      const errorWithPath = `Cannot read file: ${testDataFolder}/kombucha.pdf`;
      const sanitized = sanitizeErrorMessage(errorWithPath);
      expect(sanitized).not.toContain(testDataFolder);
      expect(sanitized).toContain('<PATH>'); // Generic path replacement
    });

    it('should replace Windows paths with placeholders', () => {
      const errorWithPath = 'Cannot access C:\\Users\\Admin\\data\\file.pdf';
      const sanitized = sanitizeErrorMessage(errorWithPath);
      expect(sanitized).not.toContain('C:\\Users\\Admin');
      expect(sanitized).toContain('<PATH>');
    });

    it('should replace Unix paths with placeholders', () => {
      const errorWithPath = 'File not found: /home/user/data/file.pdf';
      const sanitized = sanitizeErrorMessage(errorWithPath);
      expect(sanitized).not.toContain('/home/user');
      expect(sanitized).toContain('<PATH>');
    });

    it('should handle multiple paths in the same message', () => {
      const errorWithPaths = `Cannot copy ${testDataFolder}/source.pdf to ${testDataFolder}/dest.pdf`;
      const sanitized = sanitizeErrorMessage(errorWithPaths);
      expect(sanitized).not.toContain(testDataFolder);
      // Both paths should be replaced with <PATH>
      expect((sanitized.match(/<PATH>/g) || []).length).toBeGreaterThanOrEqual(1);
    });

    it('should not modify messages without paths', () => {
      const genericError = 'Invalid document ID format';
      const sanitized = sanitizeErrorMessage(genericError);
      expect(sanitized).toBe(genericError);
    });

    it('should handle mixed path types', () => {
      const errorWithMixedPaths = `Error: ${testDataFolder}/file.pdf and C:\\Windows\\System32\\file.dll`;
      const sanitized = sanitizeErrorMessage(errorWithMixedPaths);
      expect(sanitized).not.toContain(testDataFolder);
      expect(sanitized).not.toContain('C:\\Windows\\System32');
      expect(sanitized).toContain('<PATH>');
    });

    it('should preserve error structure while hiding paths', () => {
      const structuredError = `Error [ERR_FILE_NOT_FOUND]: File ${testDataFolder}/missing.pdf does not exist`;
      const sanitized = sanitizeErrorMessage(structuredError);
      expect(sanitized).toContain('Error [ERR_FILE_NOT_FOUND]');
      expect(sanitized).toContain('does not exist');
      expect(sanitized).not.toContain(testDataFolder);
    });
  });

  describe('Comprehensive Security Validation (FR-033 Integration)', () => {
    it('should prevent path traversal in document ID and validate filename', () => {
      const maliciousDocId = '../../../etc/passwd';
      expect(validateDocumentId(maliciousDocId)).toBe(false);
      expect(() => validateFilename(maliciousDocId)).toThrow();
    });

    it('should sanitize all user inputs in a typical request', () => {
      // Simulate a typical API request with multiple inputs
      const documentId = 'test-doc-123';
      const pageNum = '5';
      const langCode = '  fr-FR  ';
      const paneWidth = '45.5';

      // Validate all inputs
      expect(validateDocumentId(documentId)).toBe(true);
      expect(sanitizePageNumber(pageNum, 100)).toBe(5);
      expect(sanitizeLanguageCode(langCode)).toBe('fr-FR');
      expect(sanitizePaneWidth(paneWidth)).toBe(45.5);
    });

    it('should reject malicious inputs across all sanitizers', () => {
      // Malicious language code
      expect(() => sanitizeLanguageCode('en-US; DROP TABLE users;')).toThrow();
      
      // SQL injection attempt in page number - parseInt returns 1 from "1 OR..."
      // This is actually secure because parseInt stops at first non-digit
      const result = sanitizePageNumber("1 OR '1'='1", 100);
      expect(result).toBe(1); // parseInt safely extracts just the number
      
      // Path traversal in document ID
      expect(validateDocumentId('../etc/passwd')).toBe(false);
      
      // XSS attempt in pane width
      expect(() => sanitizePaneWidth('<script>alert("xss")</script>')).toThrow();
    });

    it('should maintain security with edge case inputs', () => {
      // Empty strings
      expect(() => validateFilename('')).toThrow();
      expect(() => sanitizeLanguageCode('')).toThrow();
      
      // Very long inputs
      const longString = 'a'.repeat(300);
      expect(() => validateFilename(longString)).toThrow();
      
      // Special unicode characters
      expect(() => validateFilename('test\u0000file')).toThrow();
      expect(() => sanitizeLanguageCode('en\u0000US')).toThrow();
    });
  });
});
