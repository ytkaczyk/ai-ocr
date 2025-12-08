import { NextResponse } from 'next/server';
import { validateEnv } from '@/lib/utils/env';
import { exists } from '@/lib/utils/file-system';
import path from 'path';

/**
 * GET /api/health
 * Health check endpoint for monitoring and deployment verification.
 * 
 * Returns:
 * - 200 OK: Application is healthy and ready to serve requests
 * - 503 Service Unavailable: Application is unhealthy (data folder inaccessible)
 * 
 * Response includes:
 * - status: "ok" | "error"
 * - timestamp: ISO 8601 timestamp
 * - version: Application version from package.json
 * - dataFolderAccessible: Boolean indicating if data folder can be accessed
 */
export async function GET() {
  const timestamp = new Date().toISOString();
  
  try {
    // Check environment configuration
    const env = validateEnv();
    const dataFolderPath = path.resolve(env.DATA_FOLDER_PATH);
    
    // Check if data folder is accessible
    const dataFolderAccessible = await exists(dataFolderPath);
    
    if (!dataFolderAccessible) {
      return NextResponse.json(
        {
          status: 'error',
          timestamp,
          version: process.env.npm_package_version || '1.0.0',
          dataFolderAccessible: false,
          message: 'Data folder not accessible',
        },
        { status: 503 }
      );
    }
    
    // Application is healthy
    return NextResponse.json(
      {
        status: 'ok',
        timestamp,
        version: process.env.npm_package_version || '1.0.0',
        dataFolderAccessible: true,
      },
      { 
        status: 200,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      }
    );
  } catch (error) {
    // Environment validation failed or unexpected error
    return NextResponse.json(
      {
        status: 'error',
        timestamp,
        version: process.env.npm_package_version || '1.0.0',
        dataFolderAccessible: false,
        message: error instanceof Error ? error.message : 'Health check failed',
      },
      { status: 503 }
    );
  }
}
