import { create } from 'zustand';
import type { Pane, PaneMode } from '@/lib/schemas/viewer';

/**
 * Viewer store state
 */
interface ViewerStoreState {
  // Data
  currentPage: number;
  paneMode: PaneMode;
  panes: Pane[];
  isLoading: boolean;
  error: string | null;

  // Actions
  setCurrentPage: (page: number) => void;
  nextPage: (totalPages: number) => void;
  previousPage: () => void;
  setPaneMode: (mode: PaneMode) => void;
  setPanes: (panes: Pane[]) => void;
  updatePane: (paneId: string, updates: Partial<Pane>) => void;
  updatePaneWidth: (paneId: string, widthPercent: number) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

/**
 * Initial state for 2-pane mode
 */
const initialPanes: Pane[] = [
  {
    id: 'pdf-pane',
    contentType: 'pdf',
    currentPage: 1,
    visible: true,
    widthPercent: 50,
  },
  {
    id: 'markdown-pane',
    contentType: 'markdown',
    currentPage: 1,
    visible: true,
    widthPercent: 50,
  },
];

/**
 * Initial state
 */
const initialState = {
  currentPage: 1,
  paneMode: 'two-pane' as PaneMode,
  panes: initialPanes,
  isLoading: false,
  error: null,
};

/**
 * Viewer store
 * Manages viewer state including current page, pane mode, and pane configurations
 * Implements FR-004: All panes must show the same page number (synchronized)
 */
export const useViewerStore = create<ViewerStoreState>((set, get) => ({
  ...initialState,

  setCurrentPage: (page) => {
    set((state) => ({
      currentPage: page,
      // Synchronize all panes to the same page (FR-004)
      panes: state.panes.map((pane) => ({
        ...pane,
        currentPage: page,
      })),
    }));
  },

  nextPage: (totalPages) => {
    const state = get();
    if (state.currentPage < totalPages) {
      get().setCurrentPage(state.currentPage + 1);
    }
  },

  previousPage: () => {
    const state = get();
    if (state.currentPage > 1) {
      get().setCurrentPage(state.currentPage - 1);
    }
  },

  setPaneMode: (mode) => {
    set((state) => {
      // When switching modes, create appropriate pane configuration
      let newPanes: Pane[];

      if (mode === 'two-pane') {
        // 2-pane: PDF + Markdown
        newPanes = [
          {
            id: 'pdf-pane',
            contentType: 'pdf',
            currentPage: state.currentPage,
            visible: true,
            widthPercent: 50,
          },
          {
            id: 'markdown-pane',
            contentType: 'markdown',
            currentPage: state.currentPage,
            visible: true,
            widthPercent: 50,
          },
        ];
      } else {
        // 3-pane: PDF + Markdown (raw) + Markdown (processed)
        newPanes = [
          {
            id: 'pdf-pane',
            contentType: 'pdf',
            currentPage: state.currentPage,
            visible: true,
            widthPercent: 33.33,
          },
          {
            id: 'markdown-raw-pane',
            contentType: 'markdown',
            isRaw: true,
            currentPage: state.currentPage,
            visible: true,
            widthPercent: 33.33,
          },
          {
            id: 'markdown-processed-pane',
            contentType: 'markdown',
            isRaw: false,
            currentPage: state.currentPage,
            visible: true,
            widthPercent: 33.34,
          },
        ];
      }

      return {
        paneMode: mode,
        panes: newPanes,
      };
    });
  },

  setPanes: (panes) => set({ panes }),

  updatePane: (paneId, updates) => {
    set((state) => ({
      panes: state.panes.map((pane) =>
        pane.id === paneId ? { ...pane, ...updates } : pane
      ),
    }));
  },

  updatePaneWidth: (paneId, widthPercent) => {
    // Validate width is within bounds (10-80%)
    const clampedWidth = Math.max(10, Math.min(80, widthPercent));
    
    set((state) => ({
      panes: state.panes.map((pane) =>
        pane.id === paneId ? { ...pane, widthPercent: clampedWidth } : pane
      ),
    }));
  },

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error, isLoading: false }),

  reset: () => set(initialState),
}));
