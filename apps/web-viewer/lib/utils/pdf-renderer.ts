import { pdfjs } from 'react-pdf';

/**
 * PDF renderer utility for React-PDF configuration
 * Implements FR-001: PDF rendering with device pixel ratio and text legibility
 */

/**
 * Configure PDF.js worker
 * This should be called once during app initialization
 */
export function configurePdfWorker(): void {
  // Set worker source to the public directory
  pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.mjs';
}

/**
 * Calculate optimal PDF scale based on device pixel ratio
 * Implements FR-001: device pixel ratio (1x-2x)
 * 
 * @param containerWidth - Width of the container in pixels
 * @param pdfWidth - Width of the PDF page in points
 * @param devicePixelRatio - Device pixel ratio (default: window.devicePixelRatio)
 * @returns Optimal scale factor
 */
export function calculatePdfScale(
  containerWidth: number,
  pdfWidth: number,
  devicePixelRatio: number = (typeof window !== 'undefined' ? window.devicePixelRatio : 1)
): number {
  // Base scale to fit container
  const baseScale = containerWidth / pdfWidth;
  
  // Adjust for device pixel ratio (cap at 2x for performance)
  const dprAdjusted = Math.min(devicePixelRatio, 2);
  
  // Return scale that maintains quality without excessive memory use
  return baseScale * dprAdjusted;
}

/**
 * Get PDF page dimensions
 * 
 * @param page - PDF page object
 * @returns Width and height in points
 */
export function getPdfPageDimensions(page: pdfjs.PDFPageProxy): { width: number; height: number } {
  const viewport = page.getViewport({ scale: 1 });
  return {
    width: viewport.width,
    height: viewport.height,
  };
}

/**
 * Format PDF dimensions for display
 * Implements FR-029a: Display page dimensions (e.g., "8.5 × 11 in")
 * 
 * @param width - Width in points
 * @param height - Height in points
 * @returns Formatted dimension string
 */
export function formatPdfDimensions(width: number, height: number): string {
  // Convert points to inches (72 points = 1 inch)
  const widthInches = (width / 72).toFixed(1);
  const heightInches = (height / 72).toFixed(1);
  
  return `${widthInches} × ${heightInches} in`;
}

/**
 * Check if PDF page has non-standard dimensions
 * Implements FR-029a: Non-standard page sizes
 * 
 * @param width - Width in points
 * @param height - Height in points
 * @returns True if dimensions are non-standard
 */
export function isNonStandardPdfSize(width: number, height: number): boolean {
  const standardSizes = [
    { width: 612, height: 792 },   // US Letter (8.5 × 11 in)
    { width: 792, height: 612 },   // US Letter Landscape
    { width: 595, height: 842 },   // A4
    { width: 842, height: 595 },   // A4 Landscape
    { width: 612, height: 1008 },  // US Legal (8.5 × 14 in)
  ];
  
  const tolerance = 10; // Allow 10 points tolerance
  
  return !standardSizes.some(
    (size) =>
      Math.abs(size.width - width) < tolerance &&
      Math.abs(size.height - height) < tolerance
  );
}

/**
 * Detect PDF page orientation
 * Implements FR-029b: Mixed orientations
 * 
 * @param width - Width in points
 * @param height - Height in points
 * @returns 'portrait' | 'landscape' | 'square'
 */
export function getPdfOrientation(width: number, height: number): 'portrait' | 'landscape' | 'square' {
  const ratio = width / height;
  
  if (Math.abs(ratio - 1) < 0.1) {
    return 'square';
  }
  
  return ratio > 1 ? 'landscape' : 'portrait';
}
