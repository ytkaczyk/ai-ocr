import path from 'path';
import { validateEnv } from './env';
import { ValidationError } from './errors';

/**
 * Security utilities for path traversal prevention and input validation
 * Implements FR-033: Security requirements
 */

/**
 * Prevent path traversal attacks by validating that a resolved path
 * is within the allowed base directory.
 * Implements FR-033a: path.resolve + startsWith validation
 * 
 * @param inputPath - The user-provided path to validate
 * @param baseDir - The base directory that the path must be within
 * @returns The resolved absolute path if valid
 * @throws ValidationError if path traversal is detected
 */
export function preventPathTraversal(inputPath: string, baseDir: string): string {
  // Resolve both paths to absolute paths
  const resolvedBase = path.resolve(baseDir);
  const resolvedPath = path.resolve(baseDir, inputPath);

  // Check if the resolved path starts with the base directory
  if (!resolvedPath.startsWith(resolvedBase + path.sep) && resolvedPath !== resolvedBase) {
    throw new ValidationError('Invalid path: Path traversal detected');
  }

  return resolvedPath;
}

/**
 * Validate filename against security constraints
 * Implements FR-033b: regex ^[a-zA-Z0-9_-]+$, max 255 chars
 * 
 * @param filename - The filename to validate (without extension)
 * @returns The validated filename
 * @throws ValidationError if filename is invalid
 */
export function validateFilename(filename: string): string {
  // Check length
  if (filename.length === 0) {
    throw new ValidationError('Invalid filename: Filename cannot be empty');
  }
  
  if (filename.length > 255) {
    throw new ValidationError('Invalid filename: Filename exceeds 255 characters');
  }

  // Check against allowed characters
  const filenameRegex = /^[a-zA-Z0-9_-]+$/;
  if (!filenameRegex.test(filename)) {
    throw new ValidationError(
      'Invalid filename: Only alphanumeric characters, hyphens, and underscores are allowed'
    );
  }

  return filename;
}

/**
 * Sanitize and validate a language code input
 * Implements FR-033d: Input sanitization for language codes
 * 
 * @param languageCode - The language code to sanitize
 * @returns Sanitized language code
 * @throws ValidationError if language code is invalid
 */
export function sanitizeLanguageCode(languageCode: string): string {
  // Trim whitespace
  const trimmed = languageCode.trim();

  // Validate format: language-COUNTRY (e.g., en-US, es-ES)
  const langCodeRegex = /^[a-z]{2,3}-[A-Z]{2}$/;
  if (!langCodeRegex.test(trimmed)) {
    throw new ValidationError(
      'Invalid language code: Must be in format language-COUNTRY (e.g., en-US, es-ES)'
    );
  }

  return trimmed;
}

/**
 * Sanitize and validate a page number input
 * Implements FR-033d: Input sanitization for page numbers
 * 
 * @param pageNumber - The page number to sanitize (string or number)
 * @param maxPages - Maximum allowed page number
 * @returns Validated page number
 * @throws ValidationError if page number is invalid
 */
export function sanitizePageNumber(pageNumber: string | number, maxPages: number): number {
  const num = typeof pageNumber === 'string' ? parseInt(pageNumber, 10) : pageNumber;

  if (isNaN(num) || !isFinite(num)) {
    throw new ValidationError('Invalid page number: Must be a valid number');
  }

  if (num < 1) {
    throw new ValidationError('Invalid page number: Must be at least 1');
  }

  if (num > maxPages) {
    throw new ValidationError(`Invalid page number: Must not exceed ${maxPages}`);
  }

  return num;
}

/**
 * Sanitize and validate a pane width percentage
 * Implements FR-033d: Input sanitization for pane widths
 * 
 * @param widthPercent - The width percentage to sanitize (string or number)
 * @returns Validated width percentage
 * @throws ValidationError if width is invalid
 */
export function sanitizePaneWidth(widthPercent: string | number): number {
  const num = typeof widthPercent === 'string' ? parseFloat(widthPercent) : widthPercent;

  if (isNaN(num) || !isFinite(num)) {
    throw new ValidationError('Invalid pane width: Must be a valid number');
  }

  if (num < 10 || num > 80) {
    throw new ValidationError('Invalid pane width: Must be between 10% and 80%');
  }

  return num;
}

/**
 * Validate document ID (alias for validateFilename)
 * Document IDs follow the same naming constraints as filenames
 * 
 * @param documentId - The document ID to validate
 * @returns true if valid, false otherwise
 */
export function validateDocumentId(documentId: string): boolean {
  try {
    validateFilename(documentId);
    return true;
  } catch {
    return false;
  }
}

/**
 * Sanitize error messages to prevent path disclosure
 * Implements FR-033e: Error message safety
 * 
 * @param message - The error message to sanitize
 * @returns Sanitized error message
 */
export function sanitizeErrorMessage(message: string): string {
  const env = validateEnv();
  const dataFolderPath = env.DATA_FOLDER_PATH;

  // Replace absolute paths with placeholders
  let sanitized = message.replace(new RegExp(dataFolderPath, 'g'), '<DATA_FOLDER>');
  
  // Replace any remaining absolute paths (Windows and Unix style)
  sanitized = sanitized.replace(/[A-Z]:\\[^\s"']*/g, '<PATH>');
  sanitized = sanitized.replace(/\/[^\s"']*/g, '<PATH>');

  return sanitized;
}
