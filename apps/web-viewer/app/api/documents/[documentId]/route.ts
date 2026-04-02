import { NextResponse } from 'next/server';
import path from 'path';
import { validateEnv } from '@/lib/utils/env';
import { documentSetSchema } from '@/lib/schemas/document';
import { readDirectory, exists, getFileSize } from '@/lib/utils/file-system';
import { validateFilename } from '@/lib/utils/security';
import { ValidationError, FileSystemError, NotFoundError } from '@/lib/utils/errors';

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * GET /api/documents/[documentId]
 * Returns detailed information about a specific document set.
 * Implements FR-007: Document details retrieval
 * Implements FR-019: Language version enumeration
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ documentId: string }> }
) {
  try {
    const { documentId } = await params;

    // Validate environment configuration (FR-008)
    const env = validateEnv();
    const dataFolderPath = path.resolve(env.DATA_FOLDER_PATH);

    // Validate document ID (FR-033b)
    validateFilename(documentId);

    // Check if PDF exists
    const pdfPath = path.join(dataFolderPath, `${documentId}.pdf`);
    const pdfExists = await exists(pdfPath);

    if (!pdfExists) {
      throw new NotFoundError(`Document not found: ${documentId}`);
    }

    // Get PDF size (FR-020)
    const pdfSize = await getFileSize(pdfPath);
    const maxSizeBytes = env.MAX_PDF_SIZE_MB * 1024 * 1024;

    if (pdfSize > maxSizeBytes) {
      return NextResponse.json(
        {
          code: 'PDF_TOO_LARGE',
          message: `PDF exceeds size limit of ${env.MAX_PDF_SIZE_MB}MB`,
          details: { sizeBytes: pdfSize, maxSizeBytes },
        },
        { status: 413 }
      );
    }

    // Check for language folder
    const languageFolderPath = path.join(dataFolderPath, documentId);
    const languageFolderExists = await exists(languageFolderPath);

    if (!languageFolderExists) {
      throw new NotFoundError(`Language folder not found for document: ${documentId}`);
    }

    // Scan for language version folders in parallel (FR-019, async-parallel)
    const languageFolders = await readDirectory(languageFolderPath);
    const languageVersionResults = await Promise.all(
      languageFolders.map(async (folder) => {
        // Match pattern: <lang-COUNTRY> or raw.<lang-COUNTRY>
        const rawMatch = folder.match(/^raw\.([a-z]{2}-[A-Z]{2})$/);
        const processedMatch = folder.match(/^([a-z]{2}-[A-Z]{2})$/);

        if (!rawMatch && !processedMatch) return null;

        const languageCode = rawMatch ? rawMatch[1] : processedMatch![1];
        const isRaw = !!rawMatch;
        const escapedDocumentId = escapeRegExp(documentId);

        // Get all markdown files in the language folder
        const languageVersionPath = path.join(languageFolderPath, folder);
        const languageFiles = await readDirectory(languageVersionPath);
        const markdownFiles = languageFiles
          .filter((file: string) =>
            file.match(
              new RegExp(`^${escapedDocumentId}\\.(raw\\.)?${languageCode}_page_\\d+\\.md$`)
            )
          )
          .sort((a, b) => {
            // Sort by page number
            const pageA = parseInt(a.match(/_page_(\d+)\.md$/)?.[1] || '0');
            const pageB = parseInt(b.match(/_page_(\d+)\.md$/)?.[1] || '0');
            return pageA - pageB;
          });

        if (markdownFiles.length === 0) return null;

        // Build page file details
        const pageFiles = markdownFiles.map((file: string) => {
          const pageMatch = file.match(/_page_(\d+)\.md$/);
          const pageNumber = pageMatch ? parseInt(pageMatch[1]) : 0;
          const filePath = path.join(folder, file);

          return {
            pageNumber,
            filePath,
          };
        });

        return {
          languageCode,
          isRaw,
          folderName: folder,
          pageFiles,
        };
      })
    );

    const languageVersions = languageVersionResults.filter(Boolean) as NonNullable<
      (typeof languageVersionResults)[number]
    >[];

    if (languageVersions.length === 0) {
      throw new NotFoundError(`No valid language versions found for document: ${documentId}`);
    }

    // Determine page count (from first language version)
    const pageCount = languageVersions[0].pageFiles.length;

    // Create DocumentSet entry
    const documentSet = {
      id: documentId,
      fileName: `${documentId}.pdf`,
      pdfPath: `${documentId}.pdf`,
      availableLanguages: languageVersions.map((v) => ({
        languageCode: v.languageCode,
        isRaw: v.isRaw,
        folderName: v.folderName,
      })),
      pageCount,
      sizeBytes: pdfSize,
    };

    // Validate against schema
    const validated = documentSetSchema.parse(documentSet);

    // Return document with language version details
    return NextResponse.json(
      {
        document: validated,
        languageVersions: languageVersions.map((v) => ({
          languageCode: v.languageCode,
          isRaw: v.isRaw,
          folderName: v.folderName,
          pageCount: v.pageFiles.length,
          pageFiles: v.pageFiles,
        })),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching document:', error);

    if (error instanceof NotFoundError) {
      return NextResponse.json(
        {
          code: 'DOCUMENT_NOT_FOUND',
          message: error.message,
          details: {},
        },
        { status: 404 }
      );
    }

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
          message: 'Error accessing document files',
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
