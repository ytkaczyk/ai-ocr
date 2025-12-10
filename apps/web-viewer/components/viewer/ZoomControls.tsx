'use client';

import { ZoomIn, ZoomOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { ZoomMode } from '@/lib/schemas/viewer';

/**
 * ZoomControls component
 * Provides zoom in/out buttons and zoom level dropdown for PDF panes
 * Implements FR-016: PDF zoom controls (10% increments, fit, width modes)
 */

interface ZoomControlsProps {
  zoomLevel: number;
  zoomMode: ZoomMode;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomChange: (level: number, mode: ZoomMode) => void;
  className?: string;
  disabled?: boolean;
}

const ZOOM_PRESETS = [
  { value: '0.5', label: '50%' },
  { value: '0.75', label: '75%' },
  { value: '1', label: '100%' },
  { value: '1.25', label: '125%' },
  { value: '1.5', label: '150%' },
  { value: '2', label: '200%' },
  { value: 'fit', label: 'Fit Page' },
  { value: 'width', label: 'Fit Width' },
];

export function ZoomControls({
  zoomLevel,
  zoomMode,
  onZoomIn,
  onZoomOut,
  onZoomChange,
  className = '',
  disabled = false,
}: ZoomControlsProps) {
  // Get current value for the select
  const getCurrentValue = () => {
    if (zoomMode === 'fit') return 'fit';
    if (zoomMode === 'width') return 'width';
    return zoomLevel.toString();
  };

  const handleZoomChange = (value: string) => {
    if (value === 'fit') {
      onZoomChange(1, 'fit');
    } else if (value === 'width') {
      onZoomChange(1, 'width');
    } else {
      const level = parseFloat(value);
      if (!isNaN(level)) {
        onZoomChange(level, 'percentage');
      }
    }
  };

  const formatZoomLabel = () => {
    if (zoomMode === 'fit') return 'Fit';
    if (zoomMode === 'width') return 'Width';
    return `${Math.round(zoomLevel * 100)}%`;
  };

  return (
    <div
      data-testid="zoom-controls"
      className={`flex items-center gap-1 ${className}`}
      role="group"
      aria-label="PDF zoom controls"
    >
      {/* Zoom Out Button */}
      <Button
        data-testid="zoom-out"
        variant="ghost"
        size="icon"
        onClick={onZoomOut}
        disabled={disabled || zoomMode !== 'percentage' || zoomLevel <= 0.1}
        aria-label="Zoom out"
        title="Zoom out (decrease by 10%)"
      >
        <ZoomOut className="h-4 w-4" />
      </Button>

      {/* Zoom Level Dropdown */}
      <Select
        value={getCurrentValue()}
        onValueChange={handleZoomChange}
        disabled={disabled}
      >
        <SelectTrigger
          data-testid="zoom-select"
          className="h-9 w-[110px]"
          aria-label="Select zoom level"
        >
          <SelectValue>{formatZoomLabel()}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {ZOOM_PRESETS.map((preset) => (
            <SelectItem key={preset.value} value={preset.value}>
              {preset.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Zoom In Button */}
      <Button
        data-testid="zoom-in"
        variant="ghost"
        size="icon"
        onClick={onZoomIn}
        disabled={disabled || zoomMode !== 'percentage' || zoomLevel >= 5}
        aria-label="Zoom in"
        title="Zoom in (increase by 10%)"
      >
        <ZoomIn className="h-4 w-4" />
      </Button>
    </div>
  );
}
