/**
 * PDF.js worker configuration
 * Configures the worker to load from local public folder
 */

import { pdfjs } from 'react-pdf';

// Configure PDF.js worker using local file
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.mjs';
