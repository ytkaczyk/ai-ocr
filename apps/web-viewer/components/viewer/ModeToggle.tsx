'use client';

import { useViewerStore } from '@/lib/stores/useViewerStore';
import { Button } from '@/components/ui/button';
import { Columns2, Columns3 } from 'lucide-react';
import type { PaneMode } from '@/lib/schemas/viewer';

/**
 * ModeToggle component
 * Allows users to switch between 2-pane and 3-pane viewing modes
 * Implements FR-005: Two display modes (2-pane, 3-pane)
 * Implements FR-006: Mode switching without losing page position
 */

interface ModeToggleProps {
  availableLanguages?: string[];
  className?: string;
}

export function ModeToggle({ availableLanguages = [], className = '' }: ModeToggleProps) {
  const { paneMode, setPaneMode } = useViewerStore();

  // 3-pane mode requires at least 2 language versions (raw + processed, or source + target)
  const canUseThreePaneMode = availableLanguages.length >= 2;

  const handleModeChange = (mode: PaneMode) => {
    if (mode === 'three-pane' && !canUseThreePaneMode) {
      // Cannot switch to 3-pane if insufficient language versions
      return;
    }
    setPaneMode(mode);
  };

  return (
    <div className={`flex items-center gap-2 ${className}`} role="group" aria-label="View mode selector">
      <span className="text-sm text-muted-foreground">View:</span>
      
      <Button
        variant={paneMode === 'two-pane' ? 'default' : 'outline'}
        size="sm"
        onClick={() => handleModeChange('two-pane')}
        aria-pressed={paneMode === 'two-pane'}
        aria-label="Two pane mode"
        data-testid="two-pane-button"
      >
        <Columns2 className="h-4 w-4 mr-2" />
        2-Pane
      </Button>

      <Button
        variant={paneMode === 'three-pane' ? 'default' : 'outline'}
        size="sm"
        onClick={() => handleModeChange('three-pane')}
        disabled={!canUseThreePaneMode}
        aria-pressed={paneMode === 'three-pane'}
        aria-label="Three pane mode"
        aria-disabled={!canUseThreePaneMode}
        data-testid="three-pane-button"
        title={
          canUseThreePaneMode
            ? 'View PDF with two language versions side-by-side'
            : 'Requires at least 2 language versions'
        }
      >
        <Columns3 className="h-4 w-4 mr-2" />
        3-Pane
      </Button>

      {!canUseThreePaneMode && (
        <span className="text-xs text-muted-foreground" aria-live="polite">
          (2 language versions required for 3-pane)
        </span>
      )}
    </div>
  );
}
