import { NextResponse } from 'next/server';
import path from 'path';
import { validateEnv } from '@/lib/utils/env';
import { readDirectory, exists } from '@/lib/utils/file-system';
import { validateDocumentId } from '@/lib/utils/security';
import { ValidationError, FileSystemError, NotFoundError } from '@/lib/utils/errors';

/**
 * POST /api/documents/[documentId]/validate
 * Validates the structure and completeness of a document set.
 * Checks for:
 * - PDF existence
 * - Language folder structure
 * - Markdown file completeness
 * - Page numbering consistency
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ documentId: string }> }
) {
  try {
    const { documentId } = await params;
    
    // Validate environment configuration (FR-008)
    const env = validateEnv();
    const dataFolderPath = path.resolve(env.DATA_FOLDER_PATH);

    // Validate document ID (FR-033b)
    if (!validateDocumentId(documentId)) {
      return NextResponse.json(
        {
          code: 'INVALID_DOCUMENT_ID',
          message: 'Invalid document identifier',
          details: {},
        },
        { status: 400 }
      );
    }

    // Check if PDF exists
    const pdfPath = path.join(dataFolderPath, `${documentId}.pdf`);
    const pdfExists = await exists(pdfPath);

    if (!pdfExists) {
      return NextResponse.json(
        {
          valid: false,
          errors: [{ type: 'PDF_NOT_FOUND', message: `PDF file not found: ${documentId}.pdf` }],
        },
        { status: 200 }
      );
    }

    // Check for language folder
    const languageFolderPath = path.join(dataFolderPath, documentId);
    const languageFolderExists = await exists(languageFolderPath);

    if (!languageFolderExists) {
      return NextResponse.json(
        {
          valid: false,
          errors: [{ type: 'LANGUAGE_FOLDER_NOT_FOUND', message: `Language folder not found for: ${documentId}` }],
        },
        { status: 200 }
      );
    }

    // Scan for language version folders (FR-019)
    const languageFolders = await readDirectory(languageFolderPath);
    const validationErrors = [];
    const languageVersions = [];

    for (const folder of languageFolders) {
      // Match pattern: <lang-COUNTRY> or raw.<lang-COUNTRY>
      const rawMatch = folder.match(/^raw\.([a-z]{2}-[A-Z]{2})$/);
      const processedMatch = folder.match(/^([a-z]{2}-[A-Z]{2})$/);

      if (rawMatch || processedMatch) {
        const languageCode = rawMatch ? rawMatch[1] : processedMatch![1];
        const isRaw = !!rawMatch;

        // Get all markdown files in the language folder
        const languageVersionPath = path.join(languageFolderPath, folder);
        const languageFiles = await readDirectory(languageVersionPath);
        const markdownFiles = languageFiles.filter((file: string) =>
          file.match(new RegExp(`^${documentId}\\.(raw\\.)?${languageCode}_page_\\d+\\.md$`))
        );

        if (markdownFiles.length === 0) {
          validationErrors.push({
            type: 'NO_MARKDOWN_FILES',
            message: `No markdown files found in ${folder}`,
            details: { folder, languageCode, isRaw },
          });
          continue;
        }

        // Extract page numbers
        const pageNumbers = markdownFiles
          .map((file: string) => {
            const match = file.match(/_page_(\d+)\.md$/);
            return match ? parseInt(match[1]) : null;
          })
          .filter((num): num is number => num !== null)
          .sort((a, b) => a - b);

        // Check for gaps in page numbering
        const expectedPages = pageNumbers[pageNumbers.length - 1];
        const missingPages = [];
        for (let i = 1; i <= expectedPages; i++) {
          if (!pageNumbers.includes(i)) {
            missingPages.push(i);
          }
        }

        if (missingPages.length > 0) {
          validationErrors.push({
            type: 'MISSING_PAGES',
            message: `Missing pages in ${folder}: ${missingPages.join(', ')}`,
            details: { folder, languageCode, isRaw, missingPages },
          });
        }

        languageVersions.push({
          languageCode,
          isRaw,
          folderName: folder,
          pageCount: pageNumbers.length,
          hasGaps: missingPages.length > 0,
        });
      }
    }

    if (languageVersions.length === 0) {
      validationErrors.push({
        type: 'NO_LANGUAGE_VERSIONS',
        message: `No valid language versions found for: ${documentId}`,
        details: {},
      });
    }

    // Check for consistency across language versions
    if (languageVersions.length > 1) {
      const pageCounts = languageVersions.map((v) => v.pageCount);
      const uniquePageCounts = [...new Set(pageCounts)];

      if (uniquePageCounts.length > 1) {
        validationErrors.push({
          type: 'INCONSISTENT_PAGE_COUNTS',
          message: `Inconsistent page counts across language versions`,
          details: {
            versions: languageVersions.map((v) => ({
              folder: v.folderName,
              pageCount: v.pageCount,
            })),
          },
        });
      }
    }

    const valid = validationErrors.length === 0;

    return NextResponse.json(
      {
        valid,
        documentId,
        languageVersions: languageVersions.map((v) => ({
          languageCode: v.languageCode,
          isRaw: v.isRaw,
          folderName: v.folderName,
          pageCount: v.pageCount,
        })),
        errors: validationErrors,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error validating document:', error);

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
