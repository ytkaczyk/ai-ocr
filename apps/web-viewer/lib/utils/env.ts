import { z } from 'zod';
import path from 'path';
import fs from 'fs';

/**
 * Environment variables schema
 * Validates required environment variables per FR-008
 */
const envSchema = z.object({
  DATA_FOLDER_PATH: z.string().min(1, 'DATA_FOLDER_PATH is required'),
  MAX_PDF_SIZE_MB: z
    .string()
    .default('50')
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().positive().max(500, 'MAX_PDF_SIZE_MB must be <= 500')),
  MEMORY_LIMIT_MB: z
    .string()
    .default('500')
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().positive().max(2000, 'MEMORY_LIMIT_MB must be <= 2000')),
});

/**
 * Validated environment configuration
 */
export type EnvConfig = z.infer<typeof envSchema>;

/**
 * Cached environment configuration
 */
let cachedEnv: EnvConfig | null = null;

/**
 * Validate and return environment configuration
 * Performs validation on first call, then caches the result
 * 
 * @returns Validated environment configuration
 * @throws Error if validation fails or DATA_FOLDER_PATH doesn't exist
 */
export function validateEnv(): EnvConfig {
  if (cachedEnv) {
    return cachedEnv;
  }

  const result = envSchema.safeParse({
    DATA_FOLDER_PATH: process.env.DATA_FOLDER_PATH,
    MAX_PDF_SIZE_MB: process.env.MAX_PDF_SIZE_MB,
    MEMORY_LIMIT_MB: process.env.MEMORY_LIMIT_MB,
  });

  if (!result.success) {
    const errors = result.error.issues.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
    throw new Error(`Environment validation failed: ${errors}`);
  }

  const config = result.data;

  // Resolve and validate DATA_FOLDER_PATH
  const dataFolderPath = path.resolve(config.DATA_FOLDER_PATH);
  
  // Check if the directory exists
  if (!fs.existsSync(dataFolderPath)) {
    throw new Error(
      `DATA_FOLDER_PATH does not exist: ${dataFolderPath}. Please create the directory or update the .env file.`
    );
  }

  // Check if it's a directory
  const stats = fs.statSync(dataFolderPath);
  if (!stats.isDirectory()) {
    throw new Error(
      `DATA_FOLDER_PATH is not a directory: ${dataFolderPath}`
    );
  }

  // Update with resolved path
  config.DATA_FOLDER_PATH = dataFolderPath;

  cachedEnv = config;
  return config;
}

/**
 * Get environment configuration without throwing errors
 * Returns null if validation fails
 * 
 * @returns Validated environment configuration or null
 */
export function getEnvSafe(): EnvConfig | null {
  try {
    return validateEnv();
  } catch {
    return null;
  }
}

/**
 * Reset cached environment (useful for testing)
 */
export function resetEnvCache(): void {
  cachedEnv = null;
}
