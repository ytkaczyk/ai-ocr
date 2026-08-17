import { readFile } from 'fs/promises';
import { PDFDocument } from 'pdf-lib';
import { FileSystemError, PdfProcessingError } from './errors';

/**
 * Server-side PDF metadata helpers.
 *
 * Rendering stays entirely client-side (react-pdf/PDF.js); this module only
 * reads structural metadata that the API layer needs, which is why it uses
 * pdf-lib rather than the PDF.js worker.
 */

/**
 * Read the page count from a PDF file.
 *
 * The PDF is the source of truth for how many pages a document has, so this
 * is what page-completeness checks are measured against.
 *
 * @param pdfPath - Absolute path to the PDF file. Must already be validated
 *                  against the data folder by the caller.
 * @returns Number of pages in the PDF
 * @throws FileSystemError if the file cannot be read
 * @throws PdfProcessingError if the file cannot be parsed as a PDF
 */
export async function getPdfPageCount(pdfPath: string): Promise<number> {
  let pdfBytes: Buffer;

  try {
    pdfBytes = await readFile(pdfPath);
  } catch {
    // Message stays path-free so it is safe to surface to clients (FR-033e)
    throw new FileSystemError('Unable to read PDF file');
  }

  // Pass a plain Uint8Array view rather than the Buffer itself: pdf-lib does an
  // `instanceof Uint8Array` check, and a Node Buffer fails it whenever the
  // active realm's Uint8Array differs from Node's (as under jsdom). The view
  // shares the Buffer's memory, so this does not copy.
  const view = new Uint8Array(pdfBytes.buffer, pdfBytes.byteOffset, pdfBytes.byteLength);

  try {
    const pdfDoc = await PDFDocument.load(view, { updateMetadata: false });
    return pdfDoc.getPageCount();
  } catch {
    throw new PdfProcessingError('Unable to read page count (PDF may be corrupted)');
  }
}
