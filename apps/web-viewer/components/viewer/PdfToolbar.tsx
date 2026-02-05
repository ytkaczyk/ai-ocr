'use client';

import { ZoomControls } from './ZoomControls';
import type { ZoomMode } from '@/lib/schemas/viewer';

/**
 * PdfToolbar component
 * Toolbar displayed above the PDF pane with zoom controls
 * Similar styling to the MarkdownPane's language selector toolbar
 */

interface PdfToolbarProps {
  zoomLevel: number;
  zoomMode: ZoomMode;
  onZoomChange: (level: number, mode: ZoomMode) => void;
  disabled?: boolean;
  className?: string;
}

export function PdfToolbar({
  zoomLevel,
  zoomMode,
  onZoomChange,
  disabled = false,
  className = '',
}: PdfToolbarProps) {
  return (
    <div className={`shrink-0 border-b bg-muted/30 px-4 py-2 ${className}`}>
      <ZoomControls
        zoomLevel={zoomLevel}
        zoomMode={zoomMode}
        onZoomChange={onZoomChange}
        disabled={disabled}
      />
    </div>
  );
}
