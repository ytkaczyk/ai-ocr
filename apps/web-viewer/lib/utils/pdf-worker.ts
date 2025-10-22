/**
 * PDF.js worker configuration
 * Configures the worker to load from CDN to avoid webpack bundling issues
 */

import { pdfjs } from 'react-pdf';

// Configure PDF.js worker using CDN
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
