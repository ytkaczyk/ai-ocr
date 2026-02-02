import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * Unit tests for PDF renderer utilities
 * Tests FR-001: PDF rendering with device pixel ratio and text legibility
 * Tests FR-029: PDF page dimensions and orientations
 */

// We need to mock pdfjs before importing the module
vi.mock('react-pdf', () => ({
  pdfjs: {
    GlobalWorkerOptions: {
      workerSrc: '',
    },
  },
}));

import {
  configurePdfWorker,
  calculatePdfScale,
  formatPdfDimensions,
  isNonStandardPdfSize,
  getPdfOrientation,
} from '@/lib/utils/pdf-renderer';

describe('pdf-renderer', () => {
  describe('configurePdfWorker', () => {
    it('should configure PDF.js worker source', async () => {
      configurePdfWorker();
      
      const { pdfjs } = await import('react-pdf');
      expect(pdfjs.GlobalWorkerOptions.workerSrc).toBe('/pdf.worker.mjs');
    });
  });

  describe('calculatePdfScale', () => {
    beforeEach(() => {
      vi.stubGlobal('window', { devicePixelRatio: 1 });
    });

    it('should calculate scale to fit container width', () => {
      const containerWidth = 800;
      const pdfWidth = 612; // US Letter width in points
      
      const scale = calculatePdfScale(containerWidth, pdfWidth, 1);
      
      expect(scale).toBeCloseTo(800 / 612, 2);
    });

    it('should adjust scale for device pixel ratio', () => {
      const containerWidth = 800;
      const pdfWidth = 612;
      const devicePixelRatio = 1.5;
      
      const scale = calculatePdfScale(containerWidth, pdfWidth, devicePixelRatio);
      
      expect(scale).toBeCloseTo((800 / 612) * 1.5, 2);
    });

    it('should cap device pixel ratio at 2x for performance', () => {
      const containerWidth = 800;
      const pdfWidth = 612;
      const devicePixelRatio = 3;
      
      const scale = calculatePdfScale(containerWidth, pdfWidth, devicePixelRatio);
      
      // Should use 2x instead of 3x
      expect(scale).toBeCloseTo((800 / 612) * 2, 2);
    });

    it('should use window.devicePixelRatio by default', () => {
      vi.stubGlobal('window', { devicePixelRatio: 2 });
      
      const containerWidth = 800;
      const pdfWidth = 612;
      
      const scale = calculatePdfScale(containerWidth, pdfWidth);
      
      expect(scale).toBeCloseTo((800 / 612) * 2, 2);
    });

    it('should default to 1x when window is not available', () => {
      vi.stubGlobal('window', undefined);
      
      const containerWidth = 800;
      const pdfWidth = 612;
      
      const scale = calculatePdfScale(containerWidth, pdfWidth);
      
      expect(scale).toBeCloseTo(800 / 612, 2);
    });

    it('should handle small container widths', () => {
      const containerWidth = 300;
      const pdfWidth = 612;
      
      const scale = calculatePdfScale(containerWidth, pdfWidth, 1);
      
      expect(scale).toBeCloseTo(300 / 612, 2);
    });

    it('should handle large container widths', () => {
      const containerWidth = 2000;
      const pdfWidth = 612;
      
      const scale = calculatePdfScale(containerWidth, pdfWidth, 1);
      
      expect(scale).toBeCloseTo(2000 / 612, 2);
    });

    it('should handle landscape pages', () => {
      const containerWidth = 800;
      const pdfWidth = 792; // US Letter landscape width
      
      const scale = calculatePdfScale(containerWidth, pdfWidth, 1);
      
      expect(scale).toBeCloseTo(800 / 792, 2);
    });
  });

  describe('formatPdfDimensions', () => {
    it('should format US Letter dimensions', () => {
      const formatted = formatPdfDimensions(612, 792);
      
      expect(formatted).toBe('8.5 × 11.0 in');
    });

    it('should format US Letter landscape dimensions', () => {
      const formatted = formatPdfDimensions(792, 612);
      
      expect(formatted).toBe('11.0 × 8.5 in');
    });

    it('should format A4 dimensions', () => {
      const formatted = formatPdfDimensions(595, 842);
      
      expect(formatted).toBe('8.3 × 11.7 in');
    });

    it('should format US Legal dimensions', () => {
      const formatted = formatPdfDimensions(612, 1008);
      
      expect(formatted).toBe('8.5 × 14.0 in');
    });

    it('should round to one decimal place', () => {
      const formatted = formatPdfDimensions(615.5, 795.3);
      
      expect(formatted).toMatch(/^\d+\.\d × \d+\.\d in$/);
    });

    it('should handle small dimensions', () => {
      const formatted = formatPdfDimensions(72, 144);
      
      expect(formatted).toBe('1.0 × 2.0 in');
    });

    it('should handle large dimensions', () => {
      const formatted = formatPdfDimensions(2160, 2880);
      
      expect(formatted).toBe('30.0 × 40.0 in');
    });
  });

  describe('isNonStandardPdfSize', () => {
    it('should return false for US Letter portrait', () => {
      expect(isNonStandardPdfSize(612, 792)).toBe(false);
    });

    it('should return false for US Letter landscape', () => {
      expect(isNonStandardPdfSize(792, 612)).toBe(false);
    });

    it('should return false for A4 portrait', () => {
      expect(isNonStandardPdfSize(595, 842)).toBe(false);
    });

    it('should return false for A4 landscape', () => {
      expect(isNonStandardPdfSize(842, 595)).toBe(false);
    });

    it('should return false for US Legal', () => {
      expect(isNonStandardPdfSize(612, 1008)).toBe(false);
    });

    it('should return true for non-standard dimensions', () => {
      expect(isNonStandardPdfSize(500, 700)).toBe(true);
    });

    it('should allow tolerance of 10 points', () => {
      // Slightly off US Letter (within tolerance)
      expect(isNonStandardPdfSize(615, 795)).toBe(false);
      expect(isNonStandardPdfSize(609, 789)).toBe(false);
    });

    it('should return true when outside tolerance', () => {
      // More than 10 points off
      expect(isNonStandardPdfSize(625, 792)).toBe(true);
      expect(isNonStandardPdfSize(612, 805)).toBe(true);
    });

    it('should handle square dimensions', () => {
      expect(isNonStandardPdfSize(612, 612)).toBe(true);
    });

    it('should handle very small dimensions', () => {
      expect(isNonStandardPdfSize(100, 200)).toBe(true);
    });

    it('should handle very large dimensions', () => {
      expect(isNonStandardPdfSize(2000, 3000)).toBe(true);
    });
  });

  describe('getPdfOrientation', () => {
    it('should return portrait for vertical pages', () => {
      expect(getPdfOrientation(612, 792)).toBe('portrait');
    });

    it('should return landscape for horizontal pages', () => {
      expect(getPdfOrientation(792, 612)).toBe('landscape');
    });

    it('should return square for equal dimensions', () => {
      expect(getPdfOrientation(612, 612)).toBe('square');
    });

    it('should return square for nearly equal dimensions (within 10% ratio)', () => {
      expect(getPdfOrientation(612, 620)).toBe('square');
      expect(getPdfOrientation(620, 612)).toBe('square');
    });

    it('should handle A4 portrait', () => {
      expect(getPdfOrientation(595, 842)).toBe('portrait');
    });

    it('should handle A4 landscape', () => {
      expect(getPdfOrientation(842, 595)).toBe('landscape');
    });

    it('should handle very wide pages', () => {
      expect(getPdfOrientation(1000, 500)).toBe('landscape');
    });

    it('should handle very tall pages', () => {
      expect(getPdfOrientation(500, 1000)).toBe('portrait');
    });

    it('should handle exact 1:1 ratio', () => {
      expect(getPdfOrientation(800, 800)).toBe('square');
    });

    it('should handle ratios just outside square threshold', () => {
      // Ratio of 1.11 is actually within the 10% threshold (1.1) and will be considered square
      // Let's use a ratio that's truly outside: 1.15
      expect(getPdfOrientation(612, 704)).toBe('portrait'); // 1.15 ratio
      expect(getPdfOrientation(704, 612)).toBe('landscape'); // 0.87 ratio
    });
  });
});
