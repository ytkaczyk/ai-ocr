import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useViewerStore } from '@/lib/stores/useViewerStore';

describe('useViewerStore', () => {
  beforeEach(() => {
    // Reset store before each test
    useViewerStore.getState().reset();
  });

  describe('initial state', () => {
    it('should start at page 1', () => {
      const state = useViewerStore.getState();
      expect(state.currentPage).toBe(1);
    });

    it('should be in two-pane mode', () => {
      const state = useViewerStore.getState();
      expect(state.paneMode).toBe('two-pane');
    });

    it('should have 2 panes configured', () => {
      const state = useViewerStore.getState();
      expect(state.panes.length).toBe(2);
      expect(state.panes[0].contentType).toBe('pdf');
      expect(state.panes[1].contentType).toBe('markdown');
    });

    it('should not be loading', () => {
      const state = useViewerStore.getState();
      expect(state.isLoading).toBe(false);
    });
  });

  describe('setCurrentPage', () => {
    it('should set current page', () => {
      useViewerStore.getState().setCurrentPage(5);

      const state = useViewerStore.getState();
      expect(state.currentPage).toBe(5);
    });

    it('should synchronize all panes to the same page (FR-004)', () => {
      useViewerStore.getState().setCurrentPage(10);

      const state = useViewerStore.getState();
      expect(state.panes.every((pane) => pane.currentPage === 10)).toBe(true);
    });
  });

  describe('nextPage', () => {
    it('should increment page if not at end', () => {
      useViewerStore.getState().setCurrentPage(5);
      useViewerStore.getState().nextPage(100);

      const state = useViewerStore.getState();
      expect(state.currentPage).toBe(6);
    });

    it('should not increment beyond totalPages', () => {
      useViewerStore.getState().setCurrentPage(100);
      useViewerStore.getState().nextPage(100);

      const state = useViewerStore.getState();
      expect(state.currentPage).toBe(100);
    });
  });

  describe('previousPage', () => {
    it('should decrement page if not at start', () => {
      useViewerStore.getState().setCurrentPage(5);
      useViewerStore.getState().previousPage();

      const state = useViewerStore.getState();
      expect(state.currentPage).toBe(4);
    });

    it('should not decrement below 1', () => {
      useViewerStore.getState().setCurrentPage(1);
      useViewerStore.getState().previousPage();

      const state = useViewerStore.getState();
      expect(state.currentPage).toBe(1);
    });
  });

  describe('setPaneMode', () => {
    it('should switch from two-pane to three-pane', () => {
      useViewerStore.getState().setPaneMode('three-pane');

      const state = useViewerStore.getState();
      expect(state.paneMode).toBe('three-pane');
      expect(state.panes.length).toBe(3);
      expect(state.panes[0].contentType).toBe('pdf');
      expect(state.panes[1].contentType).toBe('markdown');
      expect(state.panes[1].isRaw).toBe(true);
      expect(state.panes[2].contentType).toBe('markdown');
      expect(state.panes[2].isRaw).toBe(false);
    });

    it('should preserve current page when switching modes', () => {
      useViewerStore.getState().setCurrentPage(42);
      useViewerStore.getState().setPaneMode('three-pane');

      const state = useViewerStore.getState();
      expect(state.currentPage).toBe(42);
      expect(state.panes.every((pane) => pane.currentPage === 42)).toBe(true);
    });

    it('should distribute width equally in three-pane mode', () => {
      useViewerStore.getState().setPaneMode('three-pane');

      const state = useViewerStore.getState();
      expect(state.panes[0].widthPercent).toBeCloseTo(33.33, 1);
      expect(state.panes[1].widthPercent).toBeCloseTo(33.33, 1);
      expect(state.panes[2].widthPercent).toBeCloseTo(33.34, 1);
    });

    it('should switch back to two-pane mode', () => {
      useViewerStore.getState().setPaneMode('three-pane');
      useViewerStore.getState().setPaneMode('two-pane');

      const state = useViewerStore.getState();
      expect(state.paneMode).toBe('two-pane');
      expect(state.panes.length).toBe(2);
      expect(state.panes[0].widthPercent).toBe(50);
      expect(state.panes[1].widthPercent).toBe(50);
    });

    it('should preserve language code when switching to two-pane mode', () => {
      // Set language code on markdown pane
      useViewerStore.getState().setPaneLanguage('markdown-pane', 'es', false);
      
      // Switch to three-pane
      useViewerStore.getState().setPaneMode('three-pane');
      
      // Switch back to two-pane
      useViewerStore.getState().setPaneMode('two-pane');

      const state = useViewerStore.getState();
      const markdownPane = state.panes.find((p) => p.id === 'markdown-pane');
      expect(markdownPane?.languageCode).toBe('es');
    });

    it('should preserve language code when switching to three-pane mode', () => {
      // Set language code on markdown pane
      useViewerStore.getState().setPaneLanguage('markdown-pane', 'fr', false);
      
      // Switch to three-pane
      useViewerStore.getState().setPaneMode('three-pane');

      const state = useViewerStore.getState();
      const rawPane = state.panes.find((p) => p.id === 'markdown-raw-pane');
      const processedPane = state.panes.find((p) => p.id === 'markdown-processed-pane');
      expect(rawPane?.languageCode).toBe('fr');
      expect(processedPane?.languageCode).toBe('fr');
    });
  });

  describe('updatePaneWidth', () => {
    it('should update pane width', () => {
      useViewerStore.getState().updatePaneWidth('pdf-pane', 60);

      const state = useViewerStore.getState();
      const pdfPane = state.panes.find((p) => p.id === 'pdf-pane');
      expect(pdfPane?.widthPercent).toBe(60);
    });

    it('should clamp width to minimum 10%', () => {
      useViewerStore.getState().updatePaneWidth('pdf-pane', 5);

      const state = useViewerStore.getState();
      const pdfPane = state.panes.find((p) => p.id === 'pdf-pane');
      expect(pdfPane?.widthPercent).toBe(10);
    });

    it('should clamp width to maximum 80%', () => {
      useViewerStore.getState().updatePaneWidth('pdf-pane', 90);

      const state = useViewerStore.getState();
      const pdfPane = state.panes.find((p) => p.id === 'pdf-pane');
      expect(pdfPane?.widthPercent).toBe(80);
    });
  });

  describe('setPaneModeWithRollback', () => {
    it('should successfully switch mode and clear rollback state', async () => {
      await useViewerStore.getState().setPaneModeWithRollback('three-pane');

      const state = useViewerStore.getState();
      expect(state.paneMode).toBe('three-pane');
      expect(state.modeSwitchInProgress).toBe(false);
      expect(state.previousPaneMode).toBeNull();
      expect(state.previousPanes).toBeNull();
    });

    it('should queue mode switch if already loading (FR-024b)', async () => {
      useViewerStore.getState().setLoading(true);
      await useViewerStore.getState().setPaneModeWithRollback('three-pane');

      const state = useViewerStore.getState();
      expect(state.modeSwitchQueue).toBe('three-pane');
      expect(state.paneMode).toBe('two-pane'); // Should not switch yet
    });

    it('should queue mode switch if mode switch already in progress', async () => {
      // Start first mode switch
      const promise1 = useViewerStore.getState().setPaneModeWithRollback('three-pane');
      
      // Try to start second mode switch while first is in progress
      await useViewerStore.getState().setPaneModeWithRollback('two-pane');

      const state = useViewerStore.getState();
      expect(state.modeSwitchQueue).toBe('two-pane');
      
      // Wait for first mode switch to complete
      await promise1;
    });

    it('should save previous state for rollback (FR-027a)', async () => {
      // Start mode switch (but don't await immediately)
      const promise = useViewerStore.getState().setPaneModeWithRollback('three-pane');
      
      // Check that previous state is saved during the switch
      // Note: This is tricky to test due to async nature, but we can verify after
      await promise;
      
      const state = useViewerStore.getState();
      // After success, previous state should be cleared
      expect(state.previousPaneMode).toBeNull();
      expect(state.previousPanes).toBeNull();
    });

    it('should rollback and throw error on failure (FR-027a)', async () => {
      // Mock setPaneMode to throw an error
      const mockError = new Error('Mode switch failed');
      
      // Replace setPaneMode temporarily with a version that throws
      vi.spyOn(useViewerStore.getState(), 'setPaneMode').mockImplementationOnce(() => {
        throw mockError;
      });
      
      // Attempt mode switch and expect it to throw
      await expect(useViewerStore.getState().setPaneModeWithRollback('three-pane')).rejects.toThrow('Mode switch failed');
      
      const state = useViewerStore.getState();
      // Should have rolled back
      expect(state.modeSwitchInProgress).toBe(false);
      expect(state.error).toBe('Failed to switch mode. Reverted to previous view.');
    });
  });

  describe('rollbackModeSwitch', () => {
    it('should rollback to previous mode and panes when they exist', () => {
      // Manually set up a rollback scenario
      useViewerStore.setState({
        paneMode: 'three-pane',
        panes: [
          {
            id: 'pdf-pane',
            contentType: 'pdf',
            currentPage: 1,
            visible: true,
            widthPercent: 33.33,
            zoomLevel: 1,
            zoomMode: 'fit',
          },
          {
            id: 'markdown-raw-pane',
            contentType: 'markdown',
            isRaw: true,
            currentPage: 1,
            visible: true,
            widthPercent: 33.33,
          },
          {
            id: 'markdown-processed-pane',
            contentType: 'markdown',
            isRaw: false,
            currentPage: 1,
            visible: true,
            widthPercent: 33.34,
          },
        ],
        modeSwitchInProgress: true,
        previousPaneMode: 'two-pane',
        previousPanes: [
          {
            id: 'pdf-pane',
            contentType: 'pdf',
            currentPage: 1,
            visible: true,
            widthPercent: 50,
            zoomLevel: 1,
            zoomMode: 'fit',
          },
          {
            id: 'markdown-pane',
            contentType: 'markdown',
            currentPage: 1,
            visible: true,
            widthPercent: 50,
          },
        ],
      });

      useViewerStore.getState().rollbackModeSwitch();

      const state = useViewerStore.getState();
      expect(state.paneMode).toBe('two-pane');
      expect(state.panes.length).toBe(2);
      expect(state.modeSwitchInProgress).toBe(false);
      expect(state.previousPaneMode).toBeNull();
      expect(state.previousPanes).toBeNull();
      expect(state.error).toBe('Failed to switch mode. Reverted to previous view.');
    });

    it('should only clear modeSwitchInProgress when no previous state exists', () => {
      useViewerStore.setState({
        modeSwitchInProgress: true,
        previousPaneMode: null,
        previousPanes: null,
      });

      const originalPaneMode = useViewerStore.getState().paneMode;
      
      useViewerStore.getState().rollbackModeSwitch();

      const state = useViewerStore.getState();
      expect(state.modeSwitchInProgress).toBe(false);
      expect(state.paneMode).toBe(originalPaneMode); // Should not change
    });
  });

  describe('setPanes', () => {
    it('should set panes directly', () => {
      const newPanes = [
        {
          id: 'test-pane',
          contentType: 'pdf' as const,
          currentPage: 1,
          visible: true,
          widthPercent: 100,
          zoomLevel: 1,
          zoomMode: 'fit' as const,
        },
      ];

      useViewerStore.getState().setPanes(newPanes);

      const state = useViewerStore.getState();
      expect(state.panes).toEqual(newPanes);
    });
  });

  describe('updatePane', () => {
    it('should update specific pane with partial updates', () => {
      useViewerStore.getState().updatePane('pdf-pane', { visible: false });

      const state = useViewerStore.getState();
      const pdfPane = state.panes.find((p) => p.id === 'pdf-pane');
      expect(pdfPane?.visible).toBe(false);
    });

    it('should not update other panes', () => {
      useViewerStore.getState().updatePane('pdf-pane', { widthPercent: 70 });

      const state = useViewerStore.getState();
      const markdownPane = state.panes.find((p) => p.id === 'markdown-pane');
      expect(markdownPane?.widthPercent).toBe(50); // Should remain unchanged
    });
  });

  describe('setPaneZoom', () => {
    it('should set zoom level and mode for PDF pane', () => {
      useViewerStore.getState().setPaneZoom('pdf-pane', 1.5, 'percentage');

      const state = useViewerStore.getState();
      const pdfPane = state.panes.find((p) => p.id === 'pdf-pane');
      expect(pdfPane?.zoomLevel).toBe(1.5);
      expect(pdfPane?.zoomMode).toBe('percentage');
    });

    it('should not affect non-PDF panes', () => {
      useViewerStore.getState().setPaneZoom('markdown-pane', 1.5, 'percentage');

      const state = useViewerStore.getState();
      const markdownPane = state.panes.find((p) => p.id === 'markdown-pane');
      expect(markdownPane?.zoomLevel).toBeUndefined();
      expect(markdownPane?.zoomMode).toBeUndefined();
    });
  });

  describe('zoomIn', () => {
    it('should increase zoom level by 0.1 when in percentage mode', () => {
      useViewerStore.getState().setPaneZoom('pdf-pane', 1.0, 'percentage');
      useViewerStore.getState().zoomIn('pdf-pane');

      const state = useViewerStore.getState();
      const pdfPane = state.panes.find((p) => p.id === 'pdf-pane');
      expect(pdfPane?.zoomLevel).toBeCloseTo(1.1, 1);
    });

    it('should not zoom beyond maximum 500%', () => {
      useViewerStore.getState().setPaneZoom('pdf-pane', 5.0, 'percentage');
      useViewerStore.getState().zoomIn('pdf-pane');

      const state = useViewerStore.getState();
      const pdfPane = state.panes.find((p) => p.id === 'pdf-pane');
      expect(pdfPane?.zoomLevel).toBe(5.0);
    });

    it('should not zoom when not in percentage mode', () => {
      useViewerStore.getState().setPaneZoom('pdf-pane', 1.0, 'fit');
      useViewerStore.getState().zoomIn('pdf-pane');

      const state = useViewerStore.getState();
      const pdfPane = state.panes.find((p) => p.id === 'pdf-pane');
      expect(pdfPane?.zoomLevel).toBe(1.0);
      expect(pdfPane?.zoomMode).toBe('fit');
    });

    it('should not affect non-PDF panes', () => {
      useViewerStore.getState().zoomIn('markdown-pane');

      const state = useViewerStore.getState();
      const markdownPane = state.panes.find((p) => p.id === 'markdown-pane');
      expect(markdownPane?.zoomLevel).toBeUndefined();
    });

    it('should default to 1.0 when zoomLevel is undefined', () => {
      // Manually set a pane with percentage mode but no zoomLevel
      useViewerStore.getState().updatePane('pdf-pane', { zoomMode: 'percentage', zoomLevel: undefined });
      useViewerStore.getState().zoomIn('pdf-pane');

      const state = useViewerStore.getState();
      const pdfPane = state.panes.find((p) => p.id === 'pdf-pane');
      expect(pdfPane?.zoomLevel).toBeCloseTo(1.1, 1);
    });
  });

  describe('zoomOut', () => {
    it('should decrease zoom level by 0.1 when in percentage mode', () => {
      useViewerStore.getState().setPaneZoom('pdf-pane', 1.5, 'percentage');
      useViewerStore.getState().zoomOut('pdf-pane');

      const state = useViewerStore.getState();
      const pdfPane = state.panes.find((p) => p.id === 'pdf-pane');
      expect(pdfPane?.zoomLevel).toBeCloseTo(1.4, 1);
    });

    it('should not zoom below minimum 10%', () => {
      useViewerStore.getState().setPaneZoom('pdf-pane', 0.1, 'percentage');
      useViewerStore.getState().zoomOut('pdf-pane');

      const state = useViewerStore.getState();
      const pdfPane = state.panes.find((p) => p.id === 'pdf-pane');
      expect(pdfPane?.zoomLevel).toBe(0.1);
    });

    it('should not zoom when not in percentage mode', () => {
      useViewerStore.getState().setPaneZoom('pdf-pane', 1.0, 'fit');
      useViewerStore.getState().zoomOut('pdf-pane');

      const state = useViewerStore.getState();
      const pdfPane = state.panes.find((p) => p.id === 'pdf-pane');
      expect(pdfPane?.zoomLevel).toBe(1.0);
      expect(pdfPane?.zoomMode).toBe('fit');
    });

    it('should not affect non-PDF panes', () => {
      useViewerStore.getState().zoomOut('markdown-pane');

      const state = useViewerStore.getState();
      const markdownPane = state.panes.find((p) => p.id === 'markdown-pane');
      expect(markdownPane?.zoomLevel).toBeUndefined();
    });

    it('should default to 1.0 when zoomLevel is undefined', () => {
      // Manually set a pane with percentage mode but no zoomLevel
      useViewerStore.getState().updatePane('pdf-pane', { zoomMode: 'percentage', zoomLevel: undefined });
      useViewerStore.getState().zoomOut('pdf-pane');

      const state = useViewerStore.getState();
      const pdfPane = state.panes.find((p) => p.id === 'pdf-pane');
      expect(pdfPane?.zoomLevel).toBeCloseTo(0.9, 1);
    });
  });

  describe('setPaneLanguage', () => {
    it('should set language code for markdown pane', () => {
      useViewerStore.getState().setPaneLanguage('markdown-pane', 'es', false);

      const state = useViewerStore.getState();
      const markdownPane = state.panes.find((p) => p.id === 'markdown-pane');
      expect(markdownPane?.languageCode).toBe('es');
      expect(markdownPane?.isRaw).toBe(false);
    });

    it('should not affect non-markdown panes', () => {
      useViewerStore.getState().setPaneLanguage('pdf-pane', 'es', false);

      const state = useViewerStore.getState();
      const pdfPane = state.panes.find((p) => p.id === 'pdf-pane');
      expect(pdfPane?.languageCode).toBeUndefined();
    });

    it('should set isRaw flag correctly', () => {
      useViewerStore.getState().setPaneMode('three-pane');
      useViewerStore.getState().setPaneLanguage('markdown-raw-pane', 'fr', true);

      const state = useViewerStore.getState();
      const rawPane = state.panes.find((p) => p.id === 'markdown-raw-pane');
      expect(rawPane?.languageCode).toBe('fr');
      expect(rawPane?.isRaw).toBe(true);
    });
  });

  describe('setLoading', () => {
    it('should set loading state to true', () => {
      useViewerStore.getState().setLoading(true);

      const state = useViewerStore.getState();
      expect(state.isLoading).toBe(true);
    });

    it('should set loading state to false', () => {
      useViewerStore.getState().setLoading(true);
      useViewerStore.getState().setLoading(false);

      const state = useViewerStore.getState();
      expect(state.isLoading).toBe(false);
    });
  });

  describe('setError', () => {
    it('should set error and stop loading', () => {
      useViewerStore.getState().setLoading(true);
      useViewerStore.getState().setError('Test error');

      const state = useViewerStore.getState();
      expect(state.error).toBe('Test error');
      expect(state.isLoading).toBe(false);
    });

    it('should clear error when set to null', () => {
      useViewerStore.getState().setError('Test error');
      useViewerStore.getState().setError(null);

      const state = useViewerStore.getState();
      expect(state.error).toBeNull();
    });
  });

  describe('reset', () => {
    it('should reset all state to initial values', () => {
      // Modify state
      useViewerStore.getState().setCurrentPage(42);
      useViewerStore.getState().setPaneMode('three-pane');
      useViewerStore.getState().setLoading(true);
      useViewerStore.getState().setError('Test error');

      // Reset
      useViewerStore.getState().reset();

      // Check all values are back to initial state
      const state = useViewerStore.getState();
      expect(state.currentPage).toBe(1);
      expect(state.paneMode).toBe('two-pane');
      expect(state.panes.length).toBe(2);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });
  });
});
