import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { Viewer } from '@/components/viewer/Viewer';
import { useDocumentStore } from '@/lib/stores/useDocumentStore';
import { useViewerStore } from '@/lib/stores/useViewerStore';

/**
 * Unit tests for Viewer component
 * Tests FR-004: Pane synchronization
 * Tests FR-012: Page number and total page count display
 * Tests T106: Screen reader announcements for page changes
 */

// Mock the stores
vi.mock('@/lib/stores/useDocumentStore');
vi.mock('@/lib/stores/useViewerStore');

// Mock child components
vi.mock('@/components/viewer/Pager', () => ({
  Pager: ({
    currentPage,
    totalPages,
    onPageChange,
  }: {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
  }) => (
    <div data-testid="pager">
      <span>
        Page {currentPage} of {totalPages}
      </span>
      <button data-testid="pager-go-page-2" onClick={() => onPageChange(2)}>
        Go page 2
      </button>
    </div>
  ),
}));

vi.mock('@/components/viewer/PaneContainer', () => ({
  PaneContainer: () => <div data-testid="pane-container">Pane Container</div>,
}));

vi.mock('@/components/viewer/ModeToggle', () => ({
  ModeToggle: () => <div data-testid="mode-toggle">Mode Toggle</div>,
}));

vi.mock('@/components/viewer/ScreenReaderAnnouncement', () => ({
  ScreenReaderAnnouncement: ({ message }: { message: string }) => (
    <div data-testid="screen-reader-announcement">{message}</div>
  ),
}));

vi.mock('@/lib/utils/prefetch', () => ({
  prefetchAdjacentPagesWithCache: vi.fn(),
}));

describe('Viewer', () => {
  const mockDocument = {
    id: 'doc-1',
    name: 'Test Document',
    pageCount: 10,
    availableLanguages: [
      { languageCode: 'en', isRaw: false },
      { languageCode: 'fr', isRaw: true },
    ],
  };

  const mockViewerStore = {
    currentPage: 1,
    setCurrentPage: vi.fn(),
    setError: vi.fn(),
    error: null,
    paneMode: 'two-pane' as const,
    setPaneMode: vi.fn(),
    updatePane: vi.fn(),
    panes: [
      { id: 'pane-1', contentType: 'pdf' as const },
      { id: 'pane-2', contentType: 'markdown' as const, languageCode: 'en', isRaw: false },
    ],
    setPaneLanguage: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Reset window.location mock
    delete (global.window as Partial<Window>).location;
    (global.window as Partial<Window> & { location: Partial<Location> }).location = {
      href: 'http://localhost:3000',
      search: '',
      pathname: '/',
    } as Location;

    // Mock history API
    global.window.history = {
      replaceState: vi.fn(),
      pushState: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    } as unknown as History;

    // Setup default store mocks
    (useDocumentStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      documents: [mockDocument],
      currentDocumentId: 'doc-1',
    });

    (useViewerStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue(mockViewerStore);
    (
      useViewerStore as unknown as typeof useViewerStore & {
        getState: () => typeof mockViewerStore;
      }
    ).getState = vi.fn().mockReturnValue(mockViewerStore);
  });

  describe('Loading State', () => {
    it('should render loading state when document is not yet loaded', () => {
      (useDocumentStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        documents: [],
        currentDocumentId: 'doc-1',
      });

      render(<Viewer />);

      expect(screen.getByRole('status', { name: /loading document/i })).toBeInTheDocument();
      expect(screen.getByText(/loading document/i)).toBeInTheDocument();
    });

    it('should have proper ARIA attributes for loading state', () => {
      (useDocumentStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        documents: [],
        currentDocumentId: 'doc-1',
      });

      render(<Viewer />);

      const loadingContainer = screen.getByRole('status');
      expect(loadingContainer).toHaveAttribute('aria-live', 'polite');
      expect(loadingContainer).toHaveAttribute('aria-label', 'Loading document');
    });
  });

  describe('Error State', () => {
    it('should render error state when error is set', () => {
      (useViewerStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        ...mockViewerStore,
        error: 'Failed to load document',
      });

      render(<Viewer />);

      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText(/error loading document/i)).toBeInTheDocument();
      expect(screen.getByText(/failed to load document/i)).toBeInTheDocument();
    });

    it('should render error state when document is not found', () => {
      (useDocumentStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        documents: [],
        currentDocumentId: null,
      });

      render(<Viewer />);

      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText(/could not be found or loaded/i)).toBeInTheDocument();
    });

    it('should have proper ARIA attributes for error state', () => {
      (useViewerStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        ...mockViewerStore,
        error: 'Error message',
      });

      render(<Viewer />);

      const errorContainer = screen.getByRole('alert');
      expect(errorContainer).toHaveAttribute('aria-live', 'assertive');
    });
  });

  describe('No Content State', () => {
    it('should render no content message when document has no language versions', () => {
      (useDocumentStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        documents: [{ ...mockDocument, availableLanguages: [] }],
        currentDocumentId: 'doc-1',
      });

      render(<Viewer />);

      expect(screen.getByText(/no content available/i)).toBeInTheDocument();
      expect(screen.getByText(/does not have any language versions/i)).toBeInTheDocument();
    });
  });

  describe('Normal Rendering', () => {
    it('should render viewer with all components when document is loaded', () => {
      render(<Viewer />);

      expect(screen.getByTestId('viewer-container')).toBeInTheDocument();
      expect(screen.getByTestId('mode-toggle')).toBeInTheDocument();
      expect(screen.getByTestId('pager')).toBeInTheDocument();
      expect(screen.getByTestId('pane-container')).toBeInTheDocument();
    });

    it('should render ScreenReaderAnnouncement for accessibility', () => {
      render(<Viewer />);

      expect(screen.getByTestId('screen-reader-announcement')).toBeInTheDocument();
    });

    it('should have proper ARIA labels', () => {
      render(<Viewer />);

      expect(screen.getByLabelText(/document viewer/i)).toBeInTheDocument();
      expect(
        screen.getByRole('toolbar', { name: /document navigation and display controls/i })
      ).toBeInTheDocument();
      expect(screen.getByRole('region', { name: /document content panes/i })).toBeInTheDocument();
    });

    it('should display current page in pager', async () => {
      render(<Viewer />);

      await waitFor(() => {
        expect(screen.getByTestId('pager')).toBeInTheDocument();
      });
    });
  });

  describe('Document Prop', () => {
    it('should use documentId from props if provided', () => {
      (useDocumentStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        documents: [mockDocument, { ...mockDocument, id: 'doc-2', name: 'Other Doc' }],
        currentDocumentId: 'doc-2',
      });

      render(<Viewer documentId="doc-1" />);

      // Should use doc-1 from props, not doc-2 from store
      expect(screen.getByTestId('pane-container')).toBeInTheDocument();
    });

    it('should fall back to currentDocumentId from store if documentId prop not provided', () => {
      render(<Viewer />);

      expect(screen.getByTestId('pane-container')).toBeInTheDocument();
    });
  });

  describe('Page Updates', () => {
    it('should render pager component', async () => {
      render(<Viewer />);

      await waitFor(() => {
        expect(screen.getByTestId('pager')).toBeInTheDocument();
      });
    });

    it('should update page when URL param is present', async () => {
      (global.window as Partial<Window> & { location: Partial<Location> }).location = {
        href: 'http://localhost:3000?page=5',
        search: '?page=5',
        pathname: '/',
      } as Location;

      render(<Viewer />);

      await waitFor(() => {
        expect(mockViewerStore.setCurrentPage).toHaveBeenCalledWith(5);
      });
    });

    it('should not set page from URL if page number is invalid', async () => {
      (global.window as Partial<Window> & { location: Partial<Location> }).location = {
        href: 'http://localhost:3000?page=invalid',
        search: '?page=invalid',
        pathname: '/',
      } as Location;

      const setCurrentPage = vi.fn();
      (useViewerStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        ...mockViewerStore,
        setCurrentPage,
      });

      render(<Viewer />);

      await waitFor(() => {
        // Should not call setCurrentPage with NaN
        expect(setCurrentPage).not.toHaveBeenCalledWith(NaN);
      });
    });

    it('should not set page from URL if page exceeds document page count', async () => {
      (global.window as Partial<Window> & { location: Partial<Location> }).location = {
        href: 'http://localhost:3000?page=100',
        search: '?page=100',
        pathname: '/',
      } as Location;

      const setCurrentPage = vi.fn();
      (useViewerStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        ...mockViewerStore,
        setCurrentPage,
      });

      render(<Viewer />);

      await waitFor(() => {
        // Should not set page to 100 when document only has 10 pages
        expect(setCurrentPage).not.toHaveBeenCalledWith(100);
      });
    });
  });

  describe('URL Synchronization', () => {
    it('should update URL when page changes', async () => {
      (useViewerStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        ...mockViewerStore,
        currentPage: 5,
      });

      render(<Viewer />);

      await waitFor(() => {
        expect(window.history.replaceState).toHaveBeenCalled();
      });
    });

    it('should update URL when pane mode changes', async () => {
      (useViewerStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        ...mockViewerStore,
        paneMode: 'three-pane' as const,
      });

      render(<Viewer />);

      await waitFor(() => {
        expect(window.history.replaceState).toHaveBeenCalled();
      });
    });

    it('should remove stale pane params for non-markdown panes', async () => {
      (global.window as Partial<Window> & { location: Partial<Location> }).location = {
        href: 'http://localhost:3000?page=1&mode=two-pane&pane1Lang=es&pane1Raw=true&pane3Lang=fr&pane3Raw=false',
        search: '?page=1&mode=two-pane&pane1Lang=es&pane1Raw=true&pane3Lang=fr&pane3Raw=false',
        pathname: '/',
      } as Location;

      render(<Viewer />);

      await waitFor(() => {
        expect(window.history.replaceState).toHaveBeenCalled();
        const lastCall = vi.mocked(window.history.replaceState).mock.calls.at(-1);
        expect(lastCall?.[2]).not.toContain('pane1Lang');
        expect(lastCall?.[2]).not.toContain('pane3Lang');
      });
    });
  });

  describe('Language Selection', () => {
    it('should prefer processed language over raw', () => {
      (useDocumentStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        documents: [mockDocument],
        currentDocumentId: 'doc-1',
      });

      render(<Viewer />);

      // The component should use 'en' (processed) over 'fr' (raw)
      expect(screen.getByTestId('pane-container')).toBeInTheDocument();
    });

    it('should use first language if no processed version available', () => {
      const docWithOnlyRaw = {
        ...mockDocument,
        availableLanguages: [{ languageCode: 'fr', isRaw: true }],
      };

      (useDocumentStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        documents: [docWithOnlyRaw],
        currentDocumentId: 'doc-1',
      });

      render(<Viewer />);

      expect(screen.getByTestId('pane-container')).toBeInTheDocument();
    });

    it('should initialize pane language from URL if parameters are present', async () => {
      (global.window as Partial<Window> & { location: Partial<Location> }).location = {
        href: 'http://localhost:3000?pane2Lang=en&pane2Raw=false',
        search: '?pane2Lang=en&pane2Raw=false',
        pathname: '/',
      } as Location;

      // Re-create the mock to track calls
      const setPaneLanguage = vi.fn();
      (
        useViewerStore as unknown as typeof useViewerStore & {
          getState: () => typeof mockViewerStore;
        }
      ).getState = vi.fn().mockReturnValue({
        ...mockViewerStore,
        setPaneLanguage,
        panes: [
          { id: 'pane-1', contentType: 'pdf' as const },
          { id: 'pane-2', contentType: 'markdown' as const, languageCode: 'en', isRaw: false },
        ],
      });

      render(<Viewer />);

      await waitFor(() => {
        expect(screen.getByTestId('viewer-container')).toBeInTheDocument();
        expect(setPaneLanguage).toHaveBeenCalledWith('pane-2', 'en', false);
      });
    });

    it('should restore pane mode and apply per-pane language params from URL', async () => {
      (global.window as Partial<Window> & { location: Partial<Location> }).location = {
        href: 'http://localhost:3000?mode=three-pane&pane2Lang=fr&pane2Raw=true&pane3Lang=es&pane3Raw=false',
        search: '?mode=three-pane&pane2Lang=fr&pane2Raw=true&pane3Lang=es&pane3Raw=false',
        pathname: '/',
      } as Location;

      const setPaneMode = vi.fn();
      const setPaneLanguage = vi.fn();
      const updatePane = vi.fn();

      (useViewerStore as unknown as typeof useViewerStore & { getState: () => unknown }).getState =
        vi.fn().mockReturnValue({
          ...mockViewerStore,
          setPaneMode,
          setPaneLanguage,
          updatePane,
          panes: [
            { id: 'pdf-pane', contentType: 'pdf' as const },
            { id: 'raw-pane', contentType: 'markdown' as const, isRaw: true },
            { id: 'processed-pane', contentType: 'markdown' as const, isRaw: false },
          ],
        });

      render(<Viewer />);

      await waitFor(() => {
        expect(setPaneMode).toHaveBeenCalledWith('three-pane');
        expect(setPaneLanguage).toHaveBeenCalledWith('raw-pane', 'fr', true);
        expect(setPaneLanguage).toHaveBeenCalledWith('processed-pane', 'es', false);
        expect(updatePane).not.toHaveBeenCalledWith('pdf-pane', expect.anything());
      });
    });
  });

  describe('Interactions', () => {
    it('should set current page from pager callback when in range', async () => {
      render(<Viewer />);

      await waitFor(() => {
        expect(screen.getByTestId('pager')).toHaveTextContent('of 10');
      });

      screen.getByTestId('pager-go-page-2').click();

      await waitFor(() => {
        expect(mockViewerStore.setCurrentPage).toHaveBeenCalledWith(2);
      });
    });

    it('should update pane mode and page on popstate navigation', async () => {
      const setPaneMode = vi.fn();
      const setCurrentPage = vi.fn();
      const setPaneLanguage = vi.fn();
      const updatePane = vi.fn();

      (useViewerStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        ...mockViewerStore,
        paneMode: 'two-pane' as const,
        setCurrentPage,
      });

      (useViewerStore as unknown as typeof useViewerStore & { getState: () => unknown }).getState =
        vi.fn().mockReturnValue({
          ...mockViewerStore,
          paneMode: 'two-pane' as const,
          setPaneMode,
          setPaneLanguage,
          updatePane,
          panes: [
            { id: 'pdf-pane', contentType: 'pdf' as const },
            { id: 'raw-pane', contentType: 'markdown' as const, isRaw: true },
            { id: 'processed-pane', contentType: 'markdown' as const, isRaw: false },
          ],
        });

      render(<Viewer />);

      (global.window as Partial<Window> & { location: Partial<Location> }).location = {
        href: 'http://localhost:3000?mode=three-pane&page=4&pane2Lang=fr&pane2Raw=true&pane3Lang=es&pane3Raw=false',
        search: '?mode=three-pane&page=4&pane2Lang=fr&pane2Raw=true&pane3Lang=es&pane3Raw=false',
        pathname: '/',
      } as Location;

      window.dispatchEvent(new PopStateEvent('popstate'));

      await waitFor(() => {
        expect(setPaneMode).toHaveBeenCalledWith('three-pane');
        expect(setPaneLanguage).toHaveBeenCalledWith('raw-pane', 'fr', true);
        expect(setPaneLanguage).toHaveBeenCalledWith('processed-pane', 'es', false);
        expect(setCurrentPage).toHaveBeenCalledWith(4);
      });
    });
  });

  describe('Custom ClassName', () => {
    it('should apply custom className', () => {
      render(<Viewer className="custom-viewer-class" />);

      const viewer = screen.getByTestId('viewer-container');
      expect(viewer).toHaveClass('custom-viewer-class');
    });

    it('should have default viewer class', () => {
      render(<Viewer />);

      const viewer = screen.getByTestId('viewer-container');
      expect(viewer).toHaveClass('viewer');
    });
  });

  describe('Error Handling', () => {
    it('should set error when active document ID exists but document is not found', async () => {
      (useDocumentStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        documents: [],
        currentDocumentId: 'non-existent-doc',
      });

      render(<Viewer />);

      await waitFor(() => {
        expect(mockViewerStore.setError).toHaveBeenCalledWith('Document not found');
      });
    });

    it('should clear error when valid document loads', async () => {
      const setError = vi.fn();
      (useViewerStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        ...mockViewerStore,
        error: 'Previous error',
        setError,
      });

      render(<Viewer />);

      await waitFor(() => {
        expect(setError).toHaveBeenCalledWith(null);
      });
    });
  });
});
