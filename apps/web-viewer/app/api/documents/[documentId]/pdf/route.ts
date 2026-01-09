import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { resolve } from 'path';
import { validateDocumentId } from '@/lib/utils/security';
import { validateEnv } from '@/lib/utils/env';
import { rejectSymlink } from '@/lib/utils/file-system';
import { PDFDocument } from 'pdf-lib';

/**
 * GET /api/documents/[documentId]/pdf
 * Returns the complete PDF file for client-side rendering with react-pdf
 * 
 * Client-side page extraction:
 * - React-PDF loads the entire PDF and extracts the requested page
 * - This enables efficient browser caching since all page views fetch the same URL
 * - Page number is handled client-side by react-pdf <Page pageNumber={n} />
 * 
 * Implements FR-001: PDF rendering with client-side page extraction
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ documentId: string }> }
) {
  const { documentId } = await params;
  
  try {
    // Validate document ID
    if (!validateDocumentId(documentId)) {
      return NextResponse.json(
        { code: 'INVALID_DOCUMENT_ID', message: 'Invalid document identifier', details: 'Document ID must contain only alphanumeric characters, hyphens, and underscores' },
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

    // Validate PDF structure
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

    // Return the entire PDF for client-side page extraction
    // Caching strategy: aggressive caching since URL is stable across all page views
    const response = new NextResponse(pdfBytes.buffer as ArrayBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Length': pdfBytes.length.toString(),
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800', // 24 hours + 7 days stale
        'X-Page-Count': pageCount.toString(),
      },
    });

    return response;
  } catch (error) {
    console.error('Error serving PDF:', error);
    return NextResponse.json(
      { code: 'INTERNAL_ERROR', message: 'An error occurred while loading the PDF', details: 'Please try again or contact support if the problem persists' },
      { status: 500 }
    );
  }
}
