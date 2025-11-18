import { create } from 'zustand';
import type { Pane, PaneMode, ZoomMode } from '@/lib/schemas/viewer';

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
  setPaneZoom: (paneId: string, zoomLevel: number, zoomMode: ZoomMode) => void;
  zoomIn: (paneId: string) => void;
  zoomOut: (paneId: string) => void;
  setPaneLanguage: (paneId: string, languageCode: string, isRaw: boolean) => void;
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
      // Preserve language selections from existing markdown panes
      const existingMarkdownPanes = state.panes.filter(p => p.contentType === 'markdown');
      const existingLanguageCode = existingMarkdownPanes[0]?.languageCode;
      
      let newPanes: Pane[];

      if (mode === 'two-pane') {
        // 2-pane: PDF + Markdown
        // Preserve language selection if it exists
        const markdownPane: Pane = {
          id: 'markdown-pane',
          contentType: 'markdown',
          currentPage: state.currentPage,
          visible: true,
          widthPercent: 50,
        };
        
        if (existingLanguageCode) {
          markdownPane.languageCode = existingLanguageCode;
        }
        
        newPanes = [
          {
            id: 'pdf-pane',
            contentType: 'pdf',
            currentPage: state.currentPage,
            visible: true,
            widthPercent: 50,
            zoomLevel: 1,
            zoomMode: 'fit',
          },
          markdownPane,
        ];
      } else {
        // 3-pane: PDF + Markdown (raw) + Markdown (processed)
        // Preserve language selection if it exists
        const rawPane: Pane = {
          id: 'markdown-raw-pane',
          contentType: 'markdown',
          isRaw: true,
          currentPage: state.currentPage,
          visible: true,
          widthPercent: 33.33,
        };
        
        const processedPane: Pane = {
          id: 'markdown-processed-pane',
          contentType: 'markdown',
          isRaw: false,
          currentPage: state.currentPage,
          visible: true,
          widthPercent: 33.34,
        };
        
        if (existingLanguageCode) {
          rawPane.languageCode = existingLanguageCode;
          processedPane.languageCode = existingLanguageCode;
        }
        
        newPanes = [
          {
            id: 'pdf-pane',
            contentType: 'pdf',
            currentPage: state.currentPage,
            visible: true,
            widthPercent: 33.33,
            zoomLevel: 1,
            zoomMode: 'fit',
          },
          rawPane,
          processedPane,
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

  setPaneZoom: (paneId, zoomLevel, zoomMode) => {
    set((state) => ({
      panes: state.panes.map((pane) =>
        pane.id === paneId && pane.contentType === 'pdf'
          ? { ...pane, zoomLevel, zoomMode }
          : pane
      ),
    }));
  },

  zoomIn: (paneId) => {
    set((state) => ({
      panes: state.panes.map((pane) => {
        if (pane.id === paneId && pane.contentType === 'pdf' && pane.zoomMode === 'percentage') {
          const currentZoom = pane.zoomLevel ?? 1;
          const newZoom = Math.min(5, currentZoom + 0.1); // Max 500%
          return { ...pane, zoomLevel: newZoom };
        }
        return pane;
      }),
    }));
  },

  zoomOut: (paneId) => {
    set((state) => ({
      panes: state.panes.map((pane) => {
        if (pane.id === paneId && pane.contentType === 'pdf' && pane.zoomMode === 'percentage') {
          const currentZoom = pane.zoomLevel ?? 1;
          const newZoom = Math.max(0.1, currentZoom - 0.1); // Min 10%
          return { ...pane, zoomLevel: newZoom };
        }
        return pane;
      }),
    }));
  },

  setPaneLanguage: (paneId, languageCode, isRaw) => {
    set((state) => ({
      panes: state.panes.map((pane) =>
        pane.id === paneId && pane.contentType === 'markdown'
          ? { ...pane, languageCode, isRaw }
          : pane
      ),
    }));
  },

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error, isLoading: false }),

  reset: () => set(initialState),
}));
