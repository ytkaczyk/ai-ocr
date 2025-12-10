import { describe, it, expect, beforeEach } from 'vitest';
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

  describe('setError', () => {
    it('should set error and stop loading', () => {
      useViewerStore.getState().setLoading(true);
      useViewerStore.getState().setError('Test error');

      const state = useViewerStore.getState();
      expect(state.error).toBe('Test error');
      expect(state.isLoading).toBe(false);
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
