import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { resolve, extname } from 'path';
import { validateDocumentId } from '@/lib/utils/security';
import { validateEnv } from '@/lib/utils/env';

/**
 * GET /api/documents/[documentId]/images/[...path]
 * Returns image files referenced in markdown content
 * 
 * Example: /api/documents/contract-2024/images/en-US/page_1_image_1.png
 * 
 * Security: Validates path to prevent directory traversal
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ documentId: string; path: string[] }> }
) {
  const { documentId, path: pathSegments } = await params;
  
  try {
    // Validate document ID
    if (!validateDocumentId(documentId)) {
      return NextResponse.json(
        { code: 'INVALID_DOCUMENT_ID', message: 'Invalid document identifier', details: 'Document ID must contain only alphanumeric characters, hyphens, and underscores' },
        { status: 400 }
      );
    }

    // Validate path segments
    if (!pathSegments || pathSegments.length === 0) {
      return NextResponse.json(
        { code: 'INVALID_IMAGE_PATH', message: 'Invalid image path', details: 'Image path is required' },
        { status: 400 }
      );
    }

    // Check for path traversal attempts in segments
    for (const segment of pathSegments) {
      if (segment.includes('..') || segment.includes('/') || segment.includes('\\')) {
        return NextResponse.json(
          { code: 'PATH_TRAVERSAL_DETECTED', message: 'Access denied', details: 'Invalid path segments' },
          { status: 403 }
        );
      }
    }

    // Get environment configuration
    const config = validateEnv();
    
    // Construct image path (relative to document folder)
    const imagePath = resolve(
      config.DATA_FOLDER_PATH,
      documentId,
      ...pathSegments
    );

    // Validate path is within document folder (security check)
    const documentFolder = resolve(config.DATA_FOLDER_PATH, documentId);
    if (!imagePath.startsWith(documentFolder)) {
      return NextResponse.json(
        { code: 'PATH_TRAVERSAL_DETECTED', message: 'Access denied', details: 'Invalid file path' },
        { status: 403 }
      );
    }

    // Validate file extension (only allow common image formats)
    const ext = extname(imagePath).toLowerCase();
    const allowedExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.bmp'];
    if (!allowedExtensions.includes(ext)) {
      return NextResponse.json(
        { code: 'INVALID_FILE_TYPE', message: 'Unsupported file type', details: `Only image files are allowed (${allowedExtensions.join(', ')})` },
        { status: 400 }
      );
    }

    // Read image file
    let imageBuffer: Buffer;
    try {
      imageBuffer = await readFile(imagePath);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return NextResponse.json(
          { code: 'IMAGE_NOT_FOUND', message: 'Image file not found', details: 'The requested image does not exist' },
          { status: 404 }
        );
      }
      throw error;
    }

    // Determine content type based on extension
    const contentTypeMap: Record<string, string> = {
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml',
      '.webp': 'image/webp',
      '.bmp': 'image/bmp',
    };

    const contentType = contentTypeMap[ext] || 'application/octet-stream';

    // Return image with appropriate headers
    return new NextResponse(imageBuffer.buffer as ArrayBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': imageBuffer.length.toString(),
        'Cache-Control': 'public, max-age=86400, immutable',
      },
    });
  } catch (error) {
    console.error('Error serving image:', error);
    return NextResponse.json(
      { code: 'INTERNAL_ERROR', message: 'An error occurred while loading the image', details: 'Please try again or contact support if the problem persists' },
      { status: 500 }
    );
  }
}
