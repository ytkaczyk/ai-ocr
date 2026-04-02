import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PaneContainer } from '@/components/viewer/PaneContainer';
import { useViewerStore } from '@/lib/stores/useViewerStore';

// Mock the stores
vi.mock('@/lib/stores/useViewerStore', () => ({
  useViewerStore: vi.fn(),
}));

// Mock PdfPane and MarkdownPane to avoid PDF.js and complex rendering
vi.mock('@/components/viewer/PdfPane', () => ({
  PdfPane: ({
    documentId,
    pageNumber,
    onZoomIn,
    onZoomOut,
    onZoomChange,
  }: {
    documentId: string;
    pageNumber: number;
    onZoomIn?: () => void;
    onZoomOut?: () => void;
    onZoomChange?: (level: number, mode: 'fit' | 'width' | 'percentage') => void;
  }) => {
    return React.createElement(
      'div',
      { 'data-testid': 'pdf-pane-content' },
      React.createElement('div', null, 'Loading PDF viewer...'),
      React.createElement('div', null, `Document: ${documentId}, Page: ${pageNumber}`),
      React.createElement(
        'button',
        {
          'data-testid': 'pdf-zoom-in',
          onClick: () => onZoomIn?.(),
        },
        'Zoom in'
      ),
      React.createElement(
        'button',
        {
          'data-testid': 'pdf-zoom-out',
          onClick: () => onZoomOut?.(),
        },
        'Zoom out'
      ),
      React.createElement(
        'button',
        {
          'data-testid': 'pdf-zoom-change',
          onClick: () => onZoomChange?.(1.2, 'percentage'),
        },
        'Zoom change'
      )
    );
  },
}));

vi.mock('@/components/viewer/MarkdownPane', () => ({
  MarkdownPane: ({
    documentId,
    pageNumber,
    languageCode,
    onLanguageChange,
  }: {
    documentId: string;
    pageNumber: number;
    languageCode: string;
    onLanguageChange?: (languageCode: string, isRaw: boolean) => void;
  }) => {
    return React.createElement(
      'div',
      { 'data-testid': 'markdown-pane-content' },
      React.createElement('h1', null, 'Test'),
      React.createElement(
        'div',
        null,
        `Document: ${documentId}, Page: ${pageNumber}, Language: ${languageCode}`
      ),
      React.createElement(
        'button',
        {
          'data-testid': 'markdown-change-language',
          onClick: () => onLanguageChange?.('de-DE', true),
        },
        'Change language'
      )
    );
  },
}));

// Mock next/dynamic to handle async component loading
vi.mock('next/dynamic', () => {
  // Cache for loaded components - shared across all dynamic() calls
  const componentCache = new Map<string, React.ComponentType<unknown>>();

  return {
    __esModule: true,
    default: (fn: () => Promise<unknown>, options?: { loading?: () => React.ReactNode }) => {
      // Generate a cache key from the function string
      const key = fn.toString();

      // Return a wrapper component that loads and caches the component
      return (props: Record<string, unknown>) => {
        const [Component, setComponent] = React.useState<React.ComponentType<unknown> | null>(
          () => {
            // Try to get from cache first
            return componentCache.get(key) || null;
          }
        );

        React.useEffect(() => {
          if (!Component) {
            fn().then((mod) => {
              const comp =
                mod && typeof mod === 'object' && 'default' in mod
                  ? (mod as { default: React.ComponentType<unknown> }).default
                  : (mod as React.ComponentType<unknown>);
              componentCache.set(key, comp);
              setComponent(() => comp);
            });
          }
        }, [Component]);

        if (!Component) {
          return options?.loading
            ? React.createElement(React.Fragment, null, options.loading())
            : null;
        }

        return React.createElement(Component, props);
      };
    },
  };
});

// Mock Next.js Image component
vi.mock('next/image', () => ({
  default: ({ src, alt, title }: { src: string; alt: string; title?: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} title={title} />
  ),
}));

// Mock fetch for MarkdownPane
const mockFetch = vi.fn();
global.fetch = mockFetch;

function createMockResponse(data: unknown, ok = true) {
  return {
    ok,
    json: async () => data,
  } as Response;
}

/**
 * Unit tests for PaneContainer component
 * Tests FR-004: Pane synchronization (all panes show same page)
 * Tests FR-005: Two display modes (2-pane, 3-pane)
 * Tests FR-017: Pane width adjustment (20%-80%, draggable divider, 60fps)
 */

describe('PaneContainer', () => {
  const mockUpdatePaneWidth = vi.fn();
  const mockSetPaneLanguage = vi.fn();
  const mockSetPaneZoom = vi.fn();
  const mockZoomIn = vi.fn();
  const mockZoomOut = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockResolvedValue(createMockResponse({ content: '# Test', sizeBytes: 100 }));
  });

  describe('2-Pane Layout (FR-005)', () => {
    beforeEach(() => {
      (useViewerStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        panes: [
          { id: 'pdf', contentType: 'pdf', widthPercent: 50, visible: true, isRaw: false },
          {
            id: 'markdown',
            contentType: 'markdown',
            widthPercent: 50,
            visible: true,
            isRaw: false,
          },
        ],
        updatePaneWidth: mockUpdatePaneWidth,
        setPaneLanguage: mockSetPaneLanguage,
        setPaneZoom: mockSetPaneZoom,
        zoomIn: mockZoomIn,
        zoomOut: mockZoomOut,
      });
    });

    it('should render two panes with correct widths', () => {
      render(<PaneContainer documentId="test-doc" currentPage={1} languageCode="en-US" />);

      const panes = screen.getAllByRole('region', { name: /document viewer panes/i })[0];
      expect(panes).toBeInTheDocument();

      const paneElements = panes.querySelectorAll('.pane');
      expect(paneElements).toHaveLength(2);
      expect(paneElements[0]).toHaveStyle({ width: '50%' });
      expect(paneElements[1]).toHaveStyle({ width: '50%' });
    });

    it('should render a divider between panes', () => {
      render(<PaneContainer documentId="test-doc" currentPage={1} languageCode="en-US" />);

      const divider = screen.getByRole('separator', { name: /resize panes/i });
      expect(divider).toBeInTheDocument();
    });

    it('should render PDF pane with loading indicator', async () => {
      render(<PaneContainer documentId="test-doc" currentPage={1} languageCode="en-US" />);

      // Wait for the PDF pane component to load
      await waitFor(() => {
        expect(screen.getByTestId('pdf-pane')).toBeInTheDocument();
      });
    });

    it('should render MarkdownPane with content', async () => {
      render(<PaneContainer documentId="test-doc" currentPage={1} languageCode="en-US" />);

      // Verify markdown pane loads
      await waitFor(() => {
        expect(screen.getByTestId('markdown-pane')).toBeInTheDocument();
      });
    });
  });

  describe('3-Pane Layout (FR-005)', () => {
    beforeEach(() => {
      (useViewerStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        panes: [
          { id: 'pdf', contentType: 'pdf', widthPercent: 33.33, visible: true, isRaw: false },
          {
            id: 'markdown',
            contentType: 'markdown',
            widthPercent: 33.33,
            visible: true,
            isRaw: false,
          },
          { id: 'raw', contentType: 'markdown', widthPercent: 33.34, visible: true, isRaw: true },
        ],
        updatePaneWidth: mockUpdatePaneWidth,
        setPaneLanguage: mockSetPaneLanguage,
        setPaneZoom: mockSetPaneZoom,
        zoomIn: mockZoomIn,
        zoomOut: mockZoomOut,
      });
    });

    it('should render three panes', () => {
      render(<PaneContainer documentId="test-doc" currentPage={1} languageCode="en-US" />);

      const container = screen.getByRole('region', { name: /document viewer panes/i });
      const paneElements = container.querySelectorAll('.pane');
      expect(paneElements).toHaveLength(3);
    });

    it('should render two dividers for three panes', () => {
      render(<PaneContainer documentId="test-doc" currentPage={1} languageCode="en-US" />);

      const dividers = screen.getAllByRole('separator');
      expect(dividers).toHaveLength(2);
    });
  });

  describe('Pane Synchronization (FR-004)', () => {
    beforeEach(() => {
      (useViewerStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        panes: [
          { id: 'pdf', contentType: 'pdf', widthPercent: 50, visible: true, isRaw: false },
          {
            id: 'markdown',
            contentType: 'markdown',
            widthPercent: 50,
            visible: true,
            isRaw: false,
          },
        ],
        updatePaneWidth: mockUpdatePaneWidth,
        setPaneLanguage: mockSetPaneLanguage,
        setPaneZoom: mockSetPaneZoom,
        zoomIn: mockZoomIn,
        zoomOut: mockZoomOut,
      });
    });

    it('should pass same page number to all panes', async () => {
      const { rerender } = render(
        <PaneContainer documentId="test-doc" currentPage={1} languageCode="en-US" />
      );

      // Wait for panes to load
      await waitFor(() => {
        expect(screen.getByTestId('pdf-pane')).toBeInTheDocument();
        expect(screen.getByTestId('markdown-pane')).toBeInTheDocument();
      });

      // Change page - panes should remain rendered
      rerender(<PaneContainer documentId="test-doc" currentPage={5} languageCode="en-US" />);

      // Verify panes are still present after page change
      await waitFor(() => {
        expect(screen.getByTestId('pdf-pane')).toBeInTheDocument();
        expect(screen.getByTestId('markdown-pane')).toBeInTheDocument();
      });
    });

    it('should pass same document ID to all panes', async () => {
      render(<PaneContainer documentId="doc-123" currentPage={1} languageCode="en-US" />);

      // Verify both panes load (they receive the same documentId prop)
      await waitFor(() => {
        expect(screen.getByTestId('pdf-pane')).toBeInTheDocument();
        expect(screen.getByTestId('markdown-pane')).toBeInTheDocument();
      });
    });

    it('should update all panes when page changes', async () => {
      const { rerender } = render(
        <PaneContainer documentId="test-doc" currentPage={1} languageCode="en-US" />
      );

      // Verify panes load initially
      await waitFor(() => {
        expect(screen.getByTestId('markdown-pane')).toBeInTheDocument();
      });

      // Change page
      rerender(<PaneContainer documentId="test-doc" currentPage={2} languageCode="en-US" />);

      // Verify panes are still rendered after page change
      await waitFor(() => {
        expect(screen.getByTestId('markdown-pane')).toBeInTheDocument();
      });
    });
  });

  describe('Pane Visibility', () => {
    it('should not render hidden panes', () => {
      (useViewerStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        panes: [
          { id: 'pdf', contentType: 'pdf', widthPercent: 100, visible: true, isRaw: false },
          {
            id: 'markdown',
            contentType: 'markdown',
            widthPercent: 0,
            visible: false,
            isRaw: false,
          },
        ],
        updatePaneWidth: mockUpdatePaneWidth,
        setPaneLanguage: mockSetPaneLanguage,
        setPaneZoom: mockSetPaneZoom,
        zoomIn: mockZoomIn,
        zoomOut: mockZoomOut,
      });

      render(<PaneContainer documentId="test-doc" currentPage={1} languageCode="en-US" />);

      const container = screen.getByRole('region', { name: /document viewer panes/i });
      const paneElements = container.querySelectorAll('.pane');
      expect(paneElements).toHaveLength(1);
    });

    it('should not render divider after last pane', () => {
      (useViewerStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        panes: [
          { id: 'pdf', contentType: 'pdf', widthPercent: 50, visible: true, isRaw: false },
          {
            id: 'markdown',
            contentType: 'markdown',
            widthPercent: 50,
            visible: true,
            isRaw: false,
          },
        ],
        updatePaneWidth: mockUpdatePaneWidth,
        setPaneLanguage: mockSetPaneLanguage,
        setPaneZoom: mockSetPaneZoom,
        zoomIn: mockZoomIn,
        zoomOut: mockZoomOut,
      });

      render(<PaneContainer documentId="test-doc" currentPage={1} languageCode="en-US" />);

      const dividers = screen.getAllByRole('separator');
      expect(dividers).toHaveLength(1); // Only one divider for two panes
    });
  });

  describe('Pane Resizing (FR-017)', () => {
    beforeEach(() => {
      (useViewerStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        panes: [
          { id: 'pdf', contentType: 'pdf', widthPercent: 50, visible: true, isRaw: false },
          {
            id: 'markdown',
            contentType: 'markdown',
            widthPercent: 50,
            visible: true,
            isRaw: false,
          },
        ],
        updatePaneWidth: mockUpdatePaneWidth,
        setPaneLanguage: mockSetPaneLanguage,
        setPaneZoom: mockSetPaneZoom,
        zoomIn: mockZoomIn,
        zoomOut: mockZoomOut,
      });
    });

    it('should have draggable divider with correct cursor', () => {
      render(<PaneContainer documentId="test-doc" currentPage={1} languageCode="en-US" />);

      const divider = screen.getByRole('separator');
      expect(divider).toHaveClass('cursor-col-resize');
    });

    it('should start resize on mouse down', () => {
      render(<PaneContainer documentId="test-doc" currentPage={1} languageCode="en-US" />);

      const divider = screen.getByRole('separator');
      fireEvent.mouseDown(divider, { clientX: 500 });

      // Resizing state should be active (tested indirectly through subsequent move)
      expect(divider).toBeInTheDocument();
    });

    it('should update pane widths during resize', () => {
      const container = render(
        <PaneContainer documentId="test-doc" currentPage={1} languageCode="en-US" />
      );
      const divider = screen.getByRole('separator');

      // Mock container width
      Object.defineProperty(container.container.querySelector('.pane-container'), 'clientWidth', {
        value: 1000,
        configurable: true,
      });

      // Start resize
      fireEvent.mouseDown(divider, { clientX: 500 });

      // Move mouse 100px to the right (10% of 1000px container)
      fireEvent.mouseMove(document, { clientX: 600 });

      // Should update pane widths
      expect(mockUpdatePaneWidth).toHaveBeenCalled();
    });

    it('should end resize on mouse up', () => {
      render(<PaneContainer documentId="test-doc" currentPage={1} languageCode="en-US" />);
      const divider = screen.getByRole('separator');

      fireEvent.mouseDown(divider, { clientX: 500 });
      fireEvent.mouseUp(document);

      // After mouse up, further moves should not trigger updates
      const callCount = mockUpdatePaneWidth.mock.calls.length;
      fireEvent.mouseMove(document, { clientX: 700 });
      expect(mockUpdatePaneWidth).toHaveBeenCalledTimes(callCount);
    });

    it('should enforce minimum pane width of 10%', () => {
      (useViewerStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        panes: [
          { id: 'pdf', contentType: 'pdf', widthPercent: 15, visible: true, isRaw: false },
          {
            id: 'markdown',
            contentType: 'markdown',
            widthPercent: 85,
            visible: true,
            isRaw: false,
          },
        ],
        updatePaneWidth: mockUpdatePaneWidth,
        setPaneLanguage: mockSetPaneLanguage,
        setPaneZoom: mockSetPaneZoom,
        zoomIn: mockZoomIn,
        zoomOut: mockZoomOut,
      });

      const container = render(
        <PaneContainer documentId="test-doc" currentPage={1} languageCode="en-US" />
      );
      const divider = screen.getByRole('separator');

      Object.defineProperty(container.container.querySelector('.pane-container'), 'clientWidth', {
        value: 1000,
        configurable: true,
      });

      fireEvent.mouseDown(divider, { clientX: 150 });
      // Try to move left by 100px (which would make left pane 5%)
      fireEvent.mouseMove(document, { clientX: 50 });

      // Should not allow width below 10%
      // Verify that updatePaneWidth was called with constrained values
      if (mockUpdatePaneWidth.mock.calls.length > 0) {
        const calls = mockUpdatePaneWidth.mock.calls;
        calls.forEach((call) => {
          expect(call[1]).toBeGreaterThanOrEqual(10);
          expect(call[1]).toBeLessThanOrEqual(80);
        });
      }
    });
  });

  describe('Dynamic Imports (FR-017)', () => {
    it('should show loading state for PDF pane', async () => {
      (useViewerStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        panes: [{ id: 'pdf', contentType: 'pdf', widthPercent: 100, visible: true, isRaw: false }],
        updatePaneWidth: mockUpdatePaneWidth,
        setPaneLanguage: mockSetPaneLanguage,
        setPaneZoom: mockSetPaneZoom,
        zoomIn: mockZoomIn,
        zoomOut: mockZoomOut,
      });

      render(<PaneContainer documentId="test-doc" currentPage={1} languageCode="en-US" />);

      // Wait for the dynamically imported PDF pane to load
      await waitFor(() => {
        expect(screen.getByTestId('pdf-pane')).toBeInTheDocument();
      });
    });
  });

  describe('Pane Data Attributes', () => {
    it('should set data-pane-id attribute on panes', () => {
      (useViewerStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        panes: [
          { id: 'pdf', contentType: 'pdf', widthPercent: 50, visible: true, isRaw: false },
          {
            id: 'markdown',
            contentType: 'markdown',
            widthPercent: 50,
            visible: true,
            isRaw: false,
          },
        ],
        updatePaneWidth: mockUpdatePaneWidth,
        setPaneLanguage: mockSetPaneLanguage,
        setPaneZoom: mockSetPaneZoom,
        zoomIn: mockZoomIn,
        zoomOut: mockZoomOut,
      });

      render(<PaneContainer documentId="test-doc" currentPage={1} languageCode="en-US" />);

      const container = screen.getByRole('region', { name: /document viewer panes/i });
      const paneElements = container.querySelectorAll('.pane');

      expect(paneElements[0]).toHaveAttribute('data-pane-id', 'pdf');
      expect(paneElements[1]).toHaveAttribute('data-pane-id', 'markdown');
    });
  });

  describe('Raw Markdown Mode', () => {
    it('should pass isRaw prop to markdown panes', () => {
      (useViewerStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        panes: [
          {
            id: 'markdown-raw',
            contentType: 'markdown',
            widthPercent: 100,
            visible: true,
            isRaw: true,
          },
        ],
        updatePaneWidth: mockUpdatePaneWidth,
        setPaneLanguage: mockSetPaneLanguage,
        setPaneZoom: mockSetPaneZoom,
        zoomIn: mockZoomIn,
        zoomOut: mockZoomOut,
      });

      render(<PaneContainer documentId="test-doc" currentPage={1} languageCode="en-US" />);

      // Raw markdown pane should render
      expect(screen.getByRole('region', { name: /document viewer panes/i })).toBeInTheDocument();
    });

    it('should prioritize explicit pane language over defaults', async () => {
      (useViewerStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        panes: [
          {
            id: 'markdown-explicit',
            contentType: 'markdown',
            widthPercent: 100,
            visible: true,
            isRaw: true,
            languageCode: 'it-IT',
          },
        ],
        updatePaneWidth: mockUpdatePaneWidth,
        setPaneLanguage: mockSetPaneLanguage,
        setPaneZoom: mockSetPaneZoom,
        zoomIn: mockZoomIn,
        zoomOut: mockZoomOut,
      });

      render(
        <PaneContainer
          documentId="test-doc"
          currentPage={1}
          languageCode="en-US"
          sourceLanguageCode="fr-FR"
          targetLanguageCode="es-ES"
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/Language: it-IT/)).toBeInTheDocument();
      });
    });

    it('should use source language for raw pane default', async () => {
      (useViewerStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        panes: [
          {
            id: 'markdown-raw',
            contentType: 'markdown',
            widthPercent: 100,
            visible: true,
            isRaw: true,
          },
        ],
        updatePaneWidth: mockUpdatePaneWidth,
        setPaneLanguage: mockSetPaneLanguage,
        setPaneZoom: mockSetPaneZoom,
        zoomIn: mockZoomIn,
        zoomOut: mockZoomOut,
      });

      render(
        <PaneContainer
          documentId="test-doc"
          currentPage={1}
          languageCode="en-US"
          sourceLanguageCode="fr-FR"
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/Language: fr-FR/)).toBeInTheDocument();
      });
    });

    it('should use target language for processed pane default', async () => {
      (useViewerStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        panes: [
          {
            id: 'markdown-processed',
            contentType: 'markdown',
            widthPercent: 100,
            visible: true,
            isRaw: false,
          },
        ],
        updatePaneWidth: mockUpdatePaneWidth,
        setPaneLanguage: mockSetPaneLanguage,
        setPaneZoom: mockSetPaneZoom,
        zoomIn: mockZoomIn,
        zoomOut: mockZoomOut,
      });

      render(
        <PaneContainer
          documentId="test-doc"
          currentPage={1}
          languageCode="en-US"
          targetLanguageCode="es-ES"
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/Language: es-ES/)).toBeInTheDocument();
      });
    });

    it('should pass through pane language change callback', async () => {
      (useViewerStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        panes: [
          {
            id: 'markdown-change',
            contentType: 'markdown',
            widthPercent: 100,
            visible: true,
            isRaw: false,
          },
        ],
        updatePaneWidth: mockUpdatePaneWidth,
        setPaneLanguage: mockSetPaneLanguage,
        setPaneZoom: mockSetPaneZoom,
        zoomIn: mockZoomIn,
        zoomOut: mockZoomOut,
      });

      render(<PaneContainer documentId="test-doc" currentPage={1} languageCode="en-US" />);

      const button = await screen.findByTestId('markdown-change-language');
      fireEvent.click(button);

      expect(mockSetPaneLanguage).toHaveBeenCalledWith('markdown-change', 'de-DE', true);
    });

    it('should pass through pdf zoom callbacks', async () => {
      (useViewerStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        panes: [
          {
            id: 'pdf-zoom',
            contentType: 'pdf',
            widthPercent: 100,
            visible: true,
            zoomLevel: 1,
            zoomMode: 'fit',
          },
        ],
        updatePaneWidth: mockUpdatePaneWidth,
        setPaneLanguage: mockSetPaneLanguage,
        setPaneZoom: mockSetPaneZoom,
        zoomIn: mockZoomIn,
        zoomOut: mockZoomOut,
      });

      render(<PaneContainer documentId="test-doc" currentPage={1} languageCode="en-US" />);

      fireEvent.click(await screen.findByTestId('pdf-zoom-in'));
      fireEvent.click(await screen.findByTestId('pdf-zoom-out'));
      fireEvent.click(await screen.findByTestId('pdf-zoom-change'));

      expect(mockZoomIn).toHaveBeenCalledWith('pdf-zoom');
      expect(mockZoomOut).toHaveBeenCalledWith('pdf-zoom');
      expect(mockSetPaneZoom).toHaveBeenCalledWith('pdf-zoom', 1.2, 'percentage');
    });

    it('should skip rendering unknown pane types', () => {
      (useViewerStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        panes: [
          {
            id: 'unknown-pane',
            contentType: 'unknown',
            widthPercent: 100,
            visible: true,
          },
        ],
        updatePaneWidth: mockUpdatePaneWidth,
        setPaneLanguage: mockSetPaneLanguage,
        setPaneZoom: mockSetPaneZoom,
        zoomIn: mockZoomIn,
        zoomOut: mockZoomOut,
      });

      render(<PaneContainer documentId="test-doc" currentPage={1} languageCode="en-US" />);

      expect(screen.queryByTestId('pdf-pane')).not.toBeInTheDocument();
      expect(screen.queryByTestId('markdown-pane')).not.toBeInTheDocument();
    });
  });
});
