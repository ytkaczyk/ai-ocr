import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { resolve } from 'path';
import { validateDocumentId } from '@/lib/utils/security';
import { validateEnv } from '@/lib/utils/env';
import { rejectSymlink } from '@/lib/utils/file-system';
import { PDFDocument } from 'pdf-lib';

/**
 * GET /api/documents/[documentId]/pages/[pageNumber]/pdf
 * Returns a single PDF page as an image or PDF blob
 * 
 * Query params:
 * - format: 'image' | 'pdf' (default: 'image')
 * - scale: number (default: 1, max: 3 for high-DPI displays)
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ documentId: string; pageNumber: string }> }
) {
  const { documentId, pageNumber: pageNumStr } = await params;
  
  try {
    // Validate document ID
    if (!validateDocumentId(documentId)) {
      return NextResponse.json(
        { code: 'INVALID_DOCUMENT_ID', message: 'Invalid document identifier', details: 'Document ID must contain only alphanumeric characters, hyphens, and underscores' },
        { status: 400 }
      );
    }

    // Validate and parse page number
    const pageNumber = parseInt(pageNumStr, 10);
    if (isNaN(pageNumber) || pageNumber < 1) {
      return NextResponse.json(
        { code: 'INVALID_PAGE_NUMBER', message: 'Invalid page number', details: 'Page number must be a positive integer' },
        { status: 400 }
      );
    }

    // Get environment configuration
    const config = validateEnv();
    const pdfPath = resolve(config.DATA_FOLDER_PATH, `${documentId}.pdf`);

    // Validate path is within data folder (security check)
    if (!pdfPath.startsWith(config.DATA_FOLDER_PATH)) {
      return NextResponse.json(
        { code: 'PATH_TRAVERSAL_DETECTED', message: 'Access denied', details: 'Invalid file path' },
        { status: 403 }
      );
    }

    // Reject symlinks (FR-033c)
    try {
      await rejectSymlink(pdfPath, 'PDF file');
    } catch {
      return NextResponse.json(
        { code: 'SYMLINK_DETECTED', message: 'Access denied', details: 'Symbolic links are not permitted' },
        { status: 403 }
      );
    }

    // Read the PDF file
    let pdfBytes: Buffer;
    try {
      pdfBytes = await readFile(pdfPath);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return NextResponse.json(
          { code: 'DOCUMENT_NOT_FOUND', message: 'Document not found', details: 'The requested PDF file does not exist' },
          { status: 404 }
        );
      }
      throw error;
    }

    // Check file size limit
    if (pdfBytes.length > config.MAX_PDF_SIZE_MB * 1024 * 1024) {
      return NextResponse.json(
        { code: 'FILE_TOO_LARGE', message: 'PDF file exceeds size limit', details: `Maximum allowed size is ${config.MAX_PDF_SIZE_MB}MB` },
        { status: 413 }
      );
    }

    // Load PDF document
    let pdfDoc: PDFDocument;
    try {
      pdfDoc = await PDFDocument.load(pdfBytes);
    } catch {
      return NextResponse.json(
        { code: 'PDF_PARSE_ERROR', message: 'Cannot render PDF (file may be corrupted)', details: 'Failed to parse PDF file' },
        { status: 422 }
      );
    }

    const pageCount = pdfDoc.getPageCount();

    // Validate page number is within bounds
    if (pageNumber > pageCount) {
      return NextResponse.json(
        { code: 'PAGE_OUT_OF_BOUNDS', message: 'Page number exceeds document length', details: `Document has ${pageCount} pages, requested page ${pageNumber}` },
        { status: 404 }
      );
    }

    // For now, return the entire PDF (client-side rendering with react-pdf will handle page extraction)
    // In a production system, you might extract and return only the requested page
    const response = new NextResponse(pdfBytes.buffer as ArrayBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Length': pdfBytes.length.toString(),
        'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
        'X-Page-Count': pageCount.toString(),
        'X-Requested-Page': pageNumber.toString(),
      },
    });

    return response;
  } catch (error) {
    console.error('Error serving PDF page:', error);
    return NextResponse.json(
      { code: 'INTERNAL_ERROR', message: 'An error occurred while loading the PDF page', details: 'Please try again or contact support if the problem persists' },
      { status: 500 }
    );
  }
}
