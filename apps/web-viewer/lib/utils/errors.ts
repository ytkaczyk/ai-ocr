/**
 * Error handling utilities
 * Provides standardized error classes and error handling functions
 */

/**
 * Base application error class
 */
export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AppError';
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

/**
 * Validation error (400)
 */
export class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'VALIDATION_ERROR', 400, details);
    this.name = 'ValidationError';
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

/**
 * Not found error (404)
 */
export class NotFoundError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'NOT_FOUND', 404, details);
    this.name = 'NotFoundError';
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

/**
 * File system error (500)
 */
export class FileSystemError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'FILE_SYSTEM_ERROR', 500, details);
    this.name = 'FileSystemError';
    Object.setPrototypeOf(this, FileSystemError.prototype);
  }
}

/**
 * PDF processing error (500)
 */
export class PdfProcessingError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'PDF_PROCESSING_ERROR', 500, details);
    this.name = 'PdfProcessingError';
    Object.setPrototypeOf(this, PdfProcessingError.prototype);
  }
}

/**
 * Configuration error (500)
 */
export class ConfigurationError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'CONFIGURATION_ERROR', 500, details);
    this.name = 'ConfigurationError';
    Object.setPrototypeOf(this, ConfigurationError.prototype);
  }
}

/**
 * Payload too large error (413)
 */
export class PayloadTooLargeError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'PAYLOAD_TOO_LARGE', 413, details);
    this.name = 'PayloadTooLargeError';
    Object.setPrototypeOf(this, PayloadTooLargeError.prototype);
  }
}

/**
 * Error response type for API endpoints
 */
export interface ErrorResponse {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

/**
 * Convert an error to a standardized error response
 * 
 * @param error - The error to convert
 * @returns Standardized error response object
 */
export function toErrorResponse(error: unknown): ErrorResponse {
  if (error instanceof AppError) {
    return {
      code: error.code,
      message: error.message,
      details: error.details,
    };
  }

  if (error instanceof Error) {
    return {
      code: 'INTERNAL_ERROR',
      message: error.message,
    };
  }

  return {
    code: 'UNKNOWN_ERROR',
    message: 'An unknown error occurred',
  };
}

/**
 * Get HTTP status code from an error
 * 
 * @param error - The error to check
 * @returns HTTP status code
 */
export function getStatusCode(error: unknown): number {
  if (error instanceof AppError) {
    return error.statusCode;
  }

  return 500;
}

/**
 * Check if an error is a specific type
 * 
 * @param error - The error to check
 * @param errorClass - The error class to check against
 * @returns True if error is of the specified type
 */
export function isErrorType<T extends AppError>(
  error: unknown,
  errorClass: new (...args: never[]) => T
): error is T {
  return error instanceof errorClass;
}

/**
 * Wrap an async function with error handling
 * 
 * @param fn - The async function to wrap
 * @returns Wrapped function that catches and converts errors
 */
export function withErrorHandling<T extends unknown[], R>(
  fn: (...args: T) => Promise<R>
): (...args: T) => Promise<R> {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args);
    } catch (error) {
      // Re-throw AppErrors as-is
      if (error instanceof AppError) {
        throw error;
      }

      // Wrap other errors
      if (error instanceof Error) {
        throw new AppError(error.message, 'INTERNAL_ERROR', 500);
      }

      throw new AppError('An unknown error occurred', 'UNKNOWN_ERROR', 500);
    }
  };
}
