import { describe, it, expect, vi } from 'vitest';
import {
  AppError,
  ValidationError,
  NotFoundError,
  FileSystemError,
  PdfProcessingError,
  ConfigurationError,
  PayloadTooLargeError,
  toErrorResponse,
  getStatusCode,
  isErrorType,
  withErrorHandling,
} from '@/lib/utils/errors';

/**
 * Unit tests for error handling utilities
 * Tests error classes, error response conversion, and error handling wrapper
 */

describe('errors', () => {
  describe('AppError', () => {
    it('should create an AppError with required properties', () => {
      const error = new AppError('Test error', 'TEST_ERROR', 500);
      
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('Test error');
      expect(error.code).toBe('TEST_ERROR');
      expect(error.statusCode).toBe(500);
      expect(error.name).toBe('AppError');
      expect(error.details).toBeUndefined();
    });

    it('should create an AppError with details', () => {
      const details = { field: 'email', value: 'invalid' };
      const error = new AppError('Test error', 'TEST_ERROR', 400, details);
      
      expect(error.details).toEqual(details);
    });

    it('should default to status code 500', () => {
      const error = new AppError('Test error', 'TEST_ERROR');
      
      expect(error.statusCode).toBe(500);
    });
  });

  describe('ValidationError', () => {
    it('should create a ValidationError with correct properties', () => {
      const error = new ValidationError('Invalid input');
      
      expect(error).toBeInstanceOf(ValidationError);
      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('Invalid input');
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.statusCode).toBe(400);
      expect(error.name).toBe('ValidationError');
    });

    it('should include details when provided', () => {
      const details = { field: 'email' };
      const error = new ValidationError('Invalid email', details);
      
      expect(error.details).toEqual(details);
    });
  });

  describe('NotFoundError', () => {
    it('should create a NotFoundError with correct properties', () => {
      const error = new NotFoundError('Resource not found');
      
      expect(error).toBeInstanceOf(NotFoundError);
      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('Resource not found');
      expect(error.code).toBe('NOT_FOUND');
      expect(error.statusCode).toBe(404);
      expect(error.name).toBe('NotFoundError');
    });
  });

  describe('FileSystemError', () => {
    it('should create a FileSystemError with correct properties', () => {
      const error = new FileSystemError('File not accessible');
      
      expect(error).toBeInstanceOf(FileSystemError);
      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('File not accessible');
      expect(error.code).toBe('FILE_SYSTEM_ERROR');
      expect(error.statusCode).toBe(500);
      expect(error.name).toBe('FileSystemError');
    });
  });

  describe('PdfProcessingError', () => {
    it('should create a PdfProcessingError with correct properties', () => {
      const error = new PdfProcessingError('PDF corrupt');
      
      expect(error).toBeInstanceOf(PdfProcessingError);
      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('PDF corrupt');
      expect(error.code).toBe('PDF_PROCESSING_ERROR');
      expect(error.statusCode).toBe(500);
      expect(error.name).toBe('PdfProcessingError');
    });
  });

  describe('ConfigurationError', () => {
    it('should create a ConfigurationError with correct properties', () => {
      const error = new ConfigurationError('Invalid config');
      
      expect(error).toBeInstanceOf(ConfigurationError);
      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('Invalid config');
      expect(error.code).toBe('CONFIGURATION_ERROR');
      expect(error.statusCode).toBe(500);
      expect(error.name).toBe('ConfigurationError');
    });
  });

  describe('PayloadTooLargeError', () => {
    it('should create a PayloadTooLargeError with correct properties', () => {
      const error = new PayloadTooLargeError('File too large');
      
      expect(error).toBeInstanceOf(PayloadTooLargeError);
      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('File too large');
      expect(error.code).toBe('PAYLOAD_TOO_LARGE');
      expect(error.statusCode).toBe(413);
      expect(error.name).toBe('PayloadTooLargeError');
    });
  });

  describe('toErrorResponse', () => {
    it('should convert AppError to error response', () => {
      const error = new AppError('Test error', 'TEST_ERROR', 500, { key: 'value' });
      const response = toErrorResponse(error);
      
      expect(response).toEqual({
        code: 'TEST_ERROR',
        message: 'Test error',
        details: { key: 'value' },
      });
    });

    it('should convert ValidationError to error response', () => {
      const error = new ValidationError('Invalid input', { field: 'email' });
      const response = toErrorResponse(error);
      
      expect(response).toEqual({
        code: 'VALIDATION_ERROR',
        message: 'Invalid input',
        details: { field: 'email' },
      });
    });

    it('should convert generic Error to error response', () => {
      const error = new Error('Generic error');
      const response = toErrorResponse(error);
      
      expect(response).toEqual({
        code: 'INTERNAL_ERROR',
        message: 'Generic error',
      });
    });

    it('should convert unknown error to error response', () => {
      const error = 'string error';
      const response = toErrorResponse(error);
      
      expect(response).toEqual({
        code: 'UNKNOWN_ERROR',
        message: 'An unknown error occurred',
      });
    });

    it('should handle null error', () => {
      const response = toErrorResponse(null);
      
      expect(response).toEqual({
        code: 'UNKNOWN_ERROR',
        message: 'An unknown error occurred',
      });
    });
  });

  describe('getStatusCode', () => {
    it('should return status code from AppError', () => {
      const error = new AppError('Test error', 'TEST_ERROR', 403);
      
      expect(getStatusCode(error)).toBe(403);
    });

    it('should return status code from ValidationError', () => {
      const error = new ValidationError('Invalid input');
      
      expect(getStatusCode(error)).toBe(400);
    });

    it('should return status code from NotFoundError', () => {
      const error = new NotFoundError('Not found');
      
      expect(getStatusCode(error)).toBe(404);
    });

    it('should return 500 for generic Error', () => {
      const error = new Error('Generic error');
      
      expect(getStatusCode(error)).toBe(500);
    });

    it('should return 500 for unknown error', () => {
      const error = 'string error';
      
      expect(getStatusCode(error)).toBe(500);
    });
  });

  describe('isErrorType', () => {
    it('should identify ValidationError correctly', () => {
      const error = new ValidationError('Invalid input');
      
      expect(isErrorType(error, ValidationError)).toBe(true);
      expect(isErrorType(error, NotFoundError)).toBe(false);
    });

    it('should identify NotFoundError correctly', () => {
      const error = new NotFoundError('Not found');
      
      expect(isErrorType(error, NotFoundError)).toBe(true);
      expect(isErrorType(error, ValidationError)).toBe(false);
    });

    it('should identify FileSystemError correctly', () => {
      const error = new FileSystemError('File error');
      
      expect(isErrorType(error, FileSystemError)).toBe(true);
      expect(isErrorType(error, ValidationError)).toBe(false);
    });

    it('should return false for generic Error', () => {
      const error = new Error('Generic error');
      
      expect(isErrorType(error, ValidationError)).toBe(false);
    });

    it('should return false for non-error values', () => {
      expect(isErrorType('string error', ValidationError)).toBe(false);
      expect(isErrorType(null, ValidationError)).toBe(false);
      expect(isErrorType(undefined, ValidationError)).toBe(false);
    });
  });

  describe('withErrorHandling', () => {
    it('should execute function successfully and return result', async () => {
      const fn = vi.fn().mockResolvedValue('success');
      const wrapped = withErrorHandling(fn);
      
      const result = await wrapped();
      
      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should pass arguments to the wrapped function', async () => {
      const fn = vi.fn().mockResolvedValue('success');
      const wrapped = withErrorHandling(fn);
      
      await wrapped('arg1', 'arg2', 123);
      
      expect(fn).toHaveBeenCalledWith('arg1', 'arg2', 123);
    });

    it('should re-throw AppError as-is', async () => {
      const originalError = new ValidationError('Invalid input');
      const fn = vi.fn().mockRejectedValue(originalError);
      const wrapped = withErrorHandling(fn);
      
      await expect(wrapped()).rejects.toThrow(ValidationError);
      await expect(wrapped()).rejects.toThrow('Invalid input');
    });

    it('should wrap generic Error in AppError', async () => {
      const originalError = new Error('Generic error');
      const fn = vi.fn().mockRejectedValue(originalError);
      const wrapped = withErrorHandling(fn);
      
      await expect(wrapped()).rejects.toThrow(AppError);
      await expect(wrapped()).rejects.toMatchObject({
        message: 'Generic error',
        code: 'INTERNAL_ERROR',
        statusCode: 500,
      });
    });

    it('should wrap unknown error in AppError', async () => {
      const originalError = 'string error';
      const fn = vi.fn().mockRejectedValue(originalError);
      const wrapped = withErrorHandling(fn);
      
      await expect(wrapped()).rejects.toThrow(AppError);
      await expect(wrapped()).rejects.toMatchObject({
        message: 'An unknown error occurred',
        code: 'UNKNOWN_ERROR',
        statusCode: 500,
      });
    });

    it('should handle null rejection', async () => {
      const fn = vi.fn().mockRejectedValue(null);
      const wrapped = withErrorHandling(fn);
      
      await expect(wrapped()).rejects.toThrow(AppError);
      await expect(wrapped()).rejects.toMatchObject({
        code: 'UNKNOWN_ERROR',
      });
    });
  });
});
