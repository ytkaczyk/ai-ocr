import { z } from 'zod';
import { languageCodeSchema } from './common';

/**
 * Pane mode options
 */
export const paneModeSchema = z.enum(['two-pane', 'three-pane']);

/**
 * Content type for a pane
 */
export const contentTypeSchema = z.enum(['pdf', 'markdown']);

/**
 * Zod schema for Pane entity
 * Represents a single viewing pane in the viewer
 */
export const paneSchema = z.object({
  id: z.string().describe('Unique pane identifier'),
  contentType: contentTypeSchema,
  languageCode: languageCodeSchema.optional().describe('Language code for markdown panes'),
  isRaw: z.boolean().optional().describe('Whether showing raw or processed content'),
  currentPage: z.number().int().positive(),
  visible: z.boolean().describe('Whether the pane is currently visible'),
  widthPercent: z.number().min(10).max(80).describe('Pane width as percentage (10-80%)'),
});

/**
 * Zod schema for ViewerState entity
 * Represents the complete state of the viewer
 */
export const viewerStateSchema = z.object({
  currentDocumentId: z.string().nullable().describe('ID of currently loaded document'),
  currentPage: z.number().int().positive().default(1),
  paneMode: paneModeSchema.default('two-pane'),
  panes: z.array(paneSchema).describe('Configuration for all panes'),
  isLoading: z.boolean().default(false),
  error: z.string().nullable().default(null),
});

/**
 * Type exports
 */
export type PaneMode = z.infer<typeof paneModeSchema>;
export type ContentType = z.infer<typeof contentTypeSchema>;
export type Pane = z.infer<typeof paneSchema>;
export type ViewerState = z.infer<typeof viewerStateSchema>;

/**
 * Validate a ViewerState object
 * @param data - The data to validate
 * @returns Parsed ViewerState
 * @throws ZodError if validation fails
 */
export function validateViewerState(data: unknown): ViewerState {
  return viewerStateSchema.parse(data);
}

/**
 * Validate a Pane object
 * @param data - The data to validate
 * @returns Parsed Pane
 * @throws ZodError if validation fails
 */
export function validatePane(data: unknown): Pane {
  return paneSchema.parse(data);
}
