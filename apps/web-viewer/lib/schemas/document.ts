import { z } from 'zod';
import { languageCodeSchema } from './common';
import { pageFileSchema } from './page';

/**
 * Zod schema for LanguageVersion entity
 * Represents a language-specific version of a document
 */
export const languageVersionSchema = z.object({
  languageCode: languageCodeSchema,
  isRaw: z.boolean().describe('Whether this is raw OCR output (true) or processed translation (false)'),
  folderName: z.string().describe('Folder name: <lang-COUNTRY> or raw.<lang-COUNTRY>'),
  pageFiles: z.array(pageFileSchema).describe('Markdown files for each page'),
  isComplete: z.boolean().describe('Whether all pages are present'),
  missingPages: z.array(z.number().int().positive()).describe('List of missing page numbers'),
});

/**
 * Zod schema for DocumentSet entity
 * Represents a complete document with PDF and language versions
 */
export const documentSetSchema = z.object({
  id: z.string().describe('Unique identifier (derived from filename)'),
  fileName: z.string().describe('Base filename without extension'),
  pdfPath: z.string().describe('Absolute path to the PDF file'),
  folderPath: z.string().describe('Absolute path to the document folder'),
  availableLanguages: z.array(languageVersionSchema).describe('Available language versions'),
  pageCount: z.number().int().positive().describe('Total number of pages in the PDF'),
  pdfSizeBytes: z.number().int().positive().describe('PDF file size in bytes'),
  createdAt: z.date().optional(),
  lastModified: z.date().optional(),
  hasValidStructure: z.boolean().describe('Whether the document follows the prescribed folder structure'),
  validationErrors: z.array(z.string()).optional().describe('List of validation error messages'),
});

/**
 * Type exports
 */
export type LanguageVersion = z.infer<typeof languageVersionSchema>;
export type DocumentSet = z.infer<typeof documentSetSchema>;

/**
 * Validate a DocumentSet object
 * @param data - The data to validate
 * @returns Parsed DocumentSet
 * @throws ZodError if validation fails
 */
export function validateDocumentSet(data: unknown): DocumentSet {
  return documentSetSchema.parse(data);
}

/**
 * Validate a LanguageVersion object
 * @param data - The data to validate
 * @returns Parsed LanguageVersion
 * @throws ZodError if validation fails
 */
export function validateLanguageVersion(data: unknown): LanguageVersion {
  return languageVersionSchema.parse(data);
}
