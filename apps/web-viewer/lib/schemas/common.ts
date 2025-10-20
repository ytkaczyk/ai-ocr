import { z } from 'zod';

/**
 * Zod schema for IETF BCP 47 language codes
 * Format: language-COUNTRY (e.g., en-US, es-ES, fr-CA)
 * @see https://www.rfc-editor.org/rfc/bcp/bcp47.txt
 */
export const languageCodeSchema = z
  .string()
  .regex(
    /^[a-z]{2,3}-[A-Z]{2}$/,
    'Language code must be in IETF BCP 47 format (e.g., en-US, es-ES)'
  )
  .describe('IETF BCP 47 language tag');

/**
 * Type for language code
 */
export type LanguageCode = z.infer<typeof languageCodeSchema>;

/**
 * Validate a language code
 * @param code - The language code to validate
 * @returns Parsed language code
 * @throws ZodError if validation fails
 */
export function validateLanguageCode(code: string): LanguageCode {
  return languageCodeSchema.parse(code);
}

/**
 * Check if a string is a valid language code
 * @param code - The string to check
 * @returns True if valid, false otherwise
 */
export function isValidLanguageCode(code: string): code is LanguageCode {
  return languageCodeSchema.safeParse(code).success;
}
