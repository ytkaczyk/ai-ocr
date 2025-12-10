import { z } from 'zod';

/**
 * Zod schema for PageFile entity
 * Represents a single markdown page file
 */
export const pageFileSchema = z.object({
  pageNumber: z.number().int().positive().describe('Page number (1-indexed)'),
  filePath: z.string().describe('Absolute path to the markdown file'),
  fileName: z.string().describe('Filename with extension'),
  exists: z.boolean().describe('Whether the file exists on disk'),
  sizeBytes: z.number().int().nonnegative().optional().describe('File size in bytes'),
});

/**
 * Zod schema for Page entity
 * Represents the content of a single page (PDF + markdown)
 */
export const pageSchema = z.object({
  pageNumber: z.number().int().positive(),
  pdfContent: z.instanceof(Uint8Array).optional().describe('PDF page data'),
  markdownContent: z.string().optional().describe('Markdown content'),
  images: z.array(z.object({
    src: z.string(),
    alt: z.string().optional(),
  })).optional().describe('Referenced images in markdown'),
});

/**
 * Type exports
 */
export type PageFile = z.infer<typeof pageFileSchema>;
export type Page = z.infer<typeof pageSchema>;

/**
 * Validate a PageFile object
 * @param data - The data to validate
 * @returns Parsed PageFile
 * @throws ZodError if validation fails
 */
export function validatePageFile(data: unknown): PageFile {
  return pageFileSchema.parse(data);
}

/**
 * Validate a Page object
 * @param data - The data to validate
 * @returns Parsed Page
 * @throws ZodError if validation fails
 */
export function validatePage(data: unknown): Page {
  return pageSchema.parse(data);
}
