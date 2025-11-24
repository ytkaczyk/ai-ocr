import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { resolve } from 'path';
import { validateDocumentId, validateFilename } from '@/lib/utils/security';
import { validateEnv } from '@/lib/utils/env';
import { rejectSymlink } from '@/lib/utils/file-system';
import { languageCodeSchema } from '@/lib/schemas/common';

/**
 * GET /api/documents/[documentId]/pages/[pageNumber]/markdown
 * Returns markdown content for a specific page and language version
 * 
 * Query params:
 * - lang: IETF BCP 47 language code (e.g., 'en-US', 'es-ES')
 * - raw: 'true' | 'false' (default: 'false', prefers processed over raw per FR-021)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ documentId: string; pageNumber: string }> }
) {
  const { documentId, pageNumber: pageNumStr } = await params;
  const { searchParams } = new URL(request.url);
  const lang = searchParams.get('lang');
  const isRaw = searchParams.get('raw') === 'true';
  
  try {
    // Validate document ID
    if (!validateDocumentId(documentId)) {
      return NextResponse.json(
        { code: 'INVALID_DOCUMENT_ID', message: 'Invalid document identifier', details: 'Document ID must contain only alphanumeric characters, hyphens, and underscores' },
        { status: 400 }
      );
    }

    // Validate page number
    const pageNumber = parseInt(pageNumStr, 10);
    if (isNaN(pageNumber) || pageNumber < 1) {
      return NextResponse.json(
        { code: 'INVALID_PAGE_NUMBER', message: 'Invalid page number', details: 'Page number must be a positive integer' },
        { status: 400 }
      );
    }

    // Validate language code
    if (!lang) {
      return NextResponse.json(
        { code: 'MISSING_LANGUAGE', message: 'Language code is required', details: 'Provide lang query parameter (e.g., ?lang=en-US)' },
        { status: 400 }
      );
    }

    const langValidation = languageCodeSchema.safeParse(lang);
    if (!langValidation.success) {
      return NextResponse.json(
        { code: 'INVALID_LANGUAGE_CODE', message: 'Invalid language code format', details: 'Language code must follow IETF BCP 47 format (e.g., en-US, es-ES)' },
        { status: 400 }
      );
    }

    // Get environment configuration
    const config = validateEnv();
    
    // Construct folder and file paths
    const folderName = isRaw ? `raw.${lang}` : lang;
    const fileName = `${documentId}.${isRaw ? 'raw.' : ''}${lang}_page_${pageNumber}.md`;
    
    // Validate filename (security check)
    if (!validateFilename(documentId)) {
      return NextResponse.json(
        { code: 'INVALID_FILENAME', message: 'Invalid file name', details: 'File name contains invalid characters' },
        { status: 400 }
      );
    }

    const markdownPath = resolve(
      config.DATA_FOLDER_PATH,
      documentId,
      folderName,
      fileName
    );

    // Validate path is within data folder (security check)
    if (!markdownPath.startsWith(config.DATA_FOLDER_PATH)) {
      return NextResponse.json(
        { code: 'PATH_TRAVERSAL_DETECTED', message: 'Access denied', details: 'Invalid file path' },
        { status: 403 }
      );
    }

    // Reject symlinks (FR-033c)
    try {
      await rejectSymlink(markdownPath, 'Markdown file');
    } catch {
      return NextResponse.json(
        { code: 'SYMLINK_DETECTED', message: 'Access denied', details: 'Symbolic links are not permitted' },
        { status: 403 }
      );
    }

    // Read markdown file
    let content: string;
    try {
      const buffer = await readFile(markdownPath);
      content = buffer.toString('utf-8');
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return NextResponse.json(
          { code: 'MARKDOWN_NOT_FOUND', message: 'Markdown file not found for this page', details: `No ${isRaw ? 'raw' : 'processed'} content available for ${lang} on page ${pageNumber}` },
          { status: 404 }
        );
      }
      throw error;
    }

    // Return markdown content with metadata
    return NextResponse.json(
      {
        content,
        pageNumber,
        languageCode: lang,
        isRaw,
        fileName,
        sizeBytes: Buffer.byteLength(content, 'utf-8'),
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
        },
      }
    );
  } catch (error) {
    console.error('Error serving markdown page:', error);
    return NextResponse.json(
      { code: 'INTERNAL_ERROR', message: 'An error occurred while loading the markdown content', details: 'Please try again or contact support if the problem persists' },
      { status: 500 }
    );
  }
}
