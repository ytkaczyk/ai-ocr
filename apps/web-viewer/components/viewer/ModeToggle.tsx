'use client';

import { useState } from 'react';
import { useViewerStore } from '@/lib/stores/useViewerStore';
import { Button } from '@/components/ui/button';
import { Columns2, Columns3, Loader2 } from 'lucide-react';
import type { PaneMode } from '@/lib/schemas/viewer';

/**
 * ModeToggle component
 * Allows users to switch between 2-pane and 3-pane viewing modes
 * Implements FR-005: Two display modes (2-pane, 3-pane)
 * Implements FR-006: Mode switching without losing page position
 * Implements FR-024b: Mode switching during load (queuing)
 * Implements FR-027a: Failed mode switch rollback
 */

interface ModeToggleProps {
  availableLanguages?: string[];
  className?: string;
}

export function ModeToggle({ availableLanguages = [], className = '' }: ModeToggleProps) {
  const { 
    paneMode, 
    setPaneModeWithRollback, 
    modeSwitchInProgress,
    modeSwitchQueue,
    error,
    setError
  } = useViewerStore();
  
  const [localError, setLocalError] = useState<string | null>(null);

  // 3-pane mode requires at least 2 language versions (raw + processed, or source + target)
  const canUseThreePaneMode = availableLanguages.length >= 2;

  const handleModeChange = async (mode: PaneMode) => {
    if (mode === 'three-pane' && !canUseThreePaneMode) {
      // Cannot switch to 3-pane if insufficient language versions
      setLocalError('3-pane mode requires at least 2 language versions');
      setTimeout(() => setLocalError(null), 3000);
      return;
    }
    
    if (mode === paneMode) {
      // Already in this mode
      return;
    }
    
    try {
      setLocalError(null);
      setError(null);
      await setPaneModeWithRollback(mode);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to switch mode';
      setLocalError(`Cannot switch to ${mode === 'two-pane' ? '2-pane' : '3-pane'}: ${message}`);
      setTimeout(() => setLocalError(null), 5000);
    }
  };

  const displayError = localError || error;
  const showLoadingIndicator = modeSwitchInProgress || modeSwitchQueue !== null;
  const targetMode = modeSwitchQueue || (modeSwitchInProgress ? paneMode : null);

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <div className="flex items-center gap-2" role="group" aria-label="View mode selector">
        <span className="text-sm text-muted-foreground">View:</span>
        
        <Button
          variant={paneMode === 'two-pane' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleModeChange('two-pane')}
          disabled={modeSwitchInProgress}
          aria-pressed={paneMode === 'two-pane'}
          aria-label="Two pane mode"
          data-testid="two-pane-button"
        >
          {modeSwitchInProgress && paneMode === 'two-pane' && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {(!modeSwitchInProgress || paneMode !== 'two-pane') && <Columns2 className="h-4 w-4 mr-2" />}
          2-Pane
        </Button>

        <Button
          variant={paneMode === 'three-pane' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleModeChange('three-pane')}
          disabled={!canUseThreePaneMode || modeSwitchInProgress}
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
          {modeSwitchInProgress && paneMode === 'three-pane' && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {(!modeSwitchInProgress || paneMode !== 'three-pane') && <Columns3 className="h-4 w-4 mr-2" />}
          3-Pane
        </Button>

        {!canUseThreePaneMode && (
          <span className="text-xs text-muted-foreground" aria-live="polite">
            (2 language versions required for 3-pane)
          </span>
        )}
      </div>
      
      {/* Loading indicator (FR-024b) */}
      {showLoadingIndicator && (
        <div 
          className="text-xs text-muted-foreground flex items-center gap-1" 
          role="status" 
          aria-live="polite"
        >
          <Loader2 className="h-3 w-3 animate-spin" />
          {modeSwitchQueue ? (
            <span>Mode switch queued: Switching to {targetMode === 'two-pane' ? '2-pane' : '3-pane'}...</span>
          ) : (
            <span>Switching to {targetMode === 'two-pane' ? '2-pane' : '3-pane'}...</span>
          )}
        </div>
      )}
      
      {/* Error message (FR-027a) */}
      {displayError && (
        <div 
          className="text-xs text-destructive" 
          role="alert" 
          aria-live="assertive"
        >
          {displayError}
        </div>
      )}
    </div>
  );
}
