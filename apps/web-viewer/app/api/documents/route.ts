import { NextResponse } from 'next/server';
import path from 'path';
import { validateEnv } from '@/lib/utils/env';
import { readDirectory, exists, getFileSize } from '@/lib/utils/file-system';
import { validateFilename } from '@/lib/utils/security';
import { ValidationError, FileSystemError } from '@/lib/utils/errors';

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * GET /api/documents
 * Scans the data folder and returns a list of available document sets.
 * Implements FR-007: Document scanning and listing
 * Implements FR-019: Language-specific folder recognition
 * Implements FR-020: PDF size limit validation
 */
export async function GET() {
  try {
    // Validate environment configuration (FR-008)
    const env = validateEnv();
    const dataFolderPath = path.resolve(env.DATA_FOLDER_PATH);

    // Check if data folder exists
    const dataFolderExists = await exists(dataFolderPath);
    if (!dataFolderExists) {
      return NextResponse.json(
        {
          code: 'DATA_FOLDER_NOT_FOUND',
          message: 'Data folder not found. Please configure DATA_FOLDER_PATH in .env',
          details: { path: env.DATA_FOLDER_PATH },
        },
        { status: 404 }
      );
    }

    // Scan for PDF files in the data folder
    const entries = await readDirectory(dataFolderPath);
    const pdfFiles = entries.filter((entry) => entry.toLowerCase().endsWith('.pdf'));

    if (pdfFiles.length === 0) {
      // FR-023: Empty folder scenario
      return NextResponse.json({ documents: [] }, { status: 200 });
    }

    // Process each PDF file to create DocumentSet entries (async-parallel)
    const documentResults = await Promise.all(
      pdfFiles.map(async (pdfFileName) => {
        try {
          const pdfPath = path.join(dataFolderPath, pdfFileName);
          const baseName = path.basename(pdfFileName, '.pdf');

          // Validate filename (FR-033b)
          validateFilename(baseName);

          // Check PDF size (FR-020)
          const pdfSize = await getFileSize(pdfPath);
          const maxSizeBytes = env.MAX_PDF_SIZE_MB * 1024 * 1024;

          if (pdfSize > maxSizeBytes) {
            return null;
          }

          // Check for corresponding language folder
          const languageFolderPath = path.join(dataFolderPath, baseName);
          const languageFolderExists = await exists(languageFolderPath);

          if (!languageFolderExists) {
            return null;
          }

          // Scan for language version folders (FR-019)
          const languageFolders = await readDirectory(languageFolderPath);

          // Scan all language version folders in parallel (async-parallel)
          const languageVersionResults = await Promise.all(
            languageFolders.map(async (folder) => {
              // Match pattern: <lang-COUNTRY> or raw.<lang-COUNTRY>
              const rawMatch = folder.match(/^raw\.([a-z]{2}-[A-Z]{2})$/);
              const processedMatch = folder.match(/^([a-z]{2}-[A-Z]{2})$/);

              if (!rawMatch && !processedMatch) return null;

              const languageCode = rawMatch ? rawMatch[1] : processedMatch![1];
              const isRaw = !!rawMatch;

              // Count markdown files in the language folder
              const languageVersionPath = path.join(languageFolderPath, folder);
              const languageFiles = await readDirectory(languageVersionPath);
              const escapedBaseName = escapeRegExp(baseName);
              const markdownFiles = languageFiles.filter((file: string) =>
                file.match(
                  new RegExp(`^${escapedBaseName}\\.(raw\\.)?${languageCode}_page_\\d+\\.md$`)
                )
              );

              if (markdownFiles.length === 0) return null;

              return {
                languageCode,
                isRaw,
                folderName: folder,
                pageCount: markdownFiles.length,
              };
            })
          );

          const languageVersions = languageVersionResults.filter(Boolean) as NonNullable<
            (typeof languageVersionResults)[number]
          >[];

          if (languageVersions.length === 0) {
            return null;
          }

          // Determine page count (from first language version)
          const pageCount = languageVersions[0].pageCount;

          // Create simplified DocumentSet entry for API response
          return {
            id: baseName,
            fileName: pdfFileName,
            pdfPath: pdfFileName,
            availableLanguages: languageVersions.map((v) => ({
              languageCode: v.languageCode,
              isRaw: v.isRaw,
              folderName: v.folderName,
            })),
            pageCount,
            pdfSizeBytes: pdfSize,
          };
        } catch (err) {
          console.error(`Error processing document ${pdfFileName}:`, err);
          return null;
        }
      })
    );

    const documents = documentResults.filter(Boolean);

    return NextResponse.json({ documents }, { status: 200 });
  } catch (error) {
    if (error instanceof ValidationError) {
      return NextResponse.json(
        {
          code: 'VALIDATION_ERROR',
          message: error.message,
          details: error.details,
        },
        { status: 400 }
      );
    }

    if (error instanceof FileSystemError) {
      return NextResponse.json(
        {
          code: 'FILE_SYSTEM_ERROR',
          message: 'Error accessing data folder',
          details: {},
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
        details: {},
      },
      { status: 500 }
    );
  }
}
