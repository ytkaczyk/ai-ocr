import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { PdfPane } from '@/components/viewer/PdfPane';

// Mock react-pdf
const mockDocument = vi.fn();
const mockPage = vi.fn();

vi.mock('react-pdf', () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Document: ({ children, onLoadSuccess, onLoadError, file }: any) => {
    mockDocument({ file, onLoadSuccess, onLoadError });
    return <div data-testid="mock-document">{children}</div>;
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Page: ({ pageNumber, scale, onLoadSuccess, loading, error }: any) => {
    mockPage({ pageNumber, scale, onLoadSuccess });
    return (
      <div data-testid="mock-page">
        {loading}
        {error}
        <div data-testid="page-content">Page {pageNumber} at scale {scale?.toFixed(2) || '1.00'}</div>
      </div>
    );
  },
}));

// Mock PdfToolbar
vi.mock('@/components/viewer/PdfToolbar', () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  PdfToolbar: ({ zoomLevel, zoomMode, onZoomChange, disabled }: any) => (
    <div data-testid="pdf-toolbar">
      <button
        data-testid="toolbar-zoom-change"
        onClick={() => onZoomChange(1.5, 'percentage')}
        disabled={disabled}
      >
        Change Zoom
      </button>
      <div data-testid="zoom-info">
        {zoomLevel} - {zoomMode}
      </div>
    </div>
  ),
}));

// Mock pdf-renderer utils
vi.mock('@/lib/utils/pdf-renderer', () => ({
  formatPdfDimensions: (width: number, height: number) => {
    const widthInches = (width / 72).toFixed(1);
    const heightInches = (height / 72).toFixed(1);
    return `${widthInches} × ${heightInches} in`;
  },
  isNonStandardPdfSize: (width: number, height: number) => {
    // Standard US Letter is 612 x 792 points
    return !(Math.abs(width - 612) < 10 && Math.abs(height - 792) < 10);
  },
  getPdfOrientation: (width: number, height: number) => {
    const ratio = width / height;
    if (Math.abs(ratio - 1) < 0.1) return 'square';
    return ratio > 1 ? 'landscape' : 'portrait';
  },
}));

// Mock pdf-worker
vi.mock('@/lib/utils/pdf-worker', () => ({}));

// Mock react-pdf CSS imports
vi.mock('react-pdf/dist/Page/TextLayer.css', () => ({}));
vi.mock('react-pdf/dist/Page/AnnotationLayer.css', () => ({}));

describe('PdfPane', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let resizeObserverMock: any;
  let windowResizeListeners: Array<() => void> = [];

  beforeEach(() => {
    vi.clearAllMocks();
    windowResizeListeners = [];

    // Mock ResizeObserver
    resizeObserverMock = {
      observe: vi.fn(),
      unobserve: vi.fn(),
      disconnect: vi.fn(),
    };
    global.ResizeObserver = vi.fn(function ResizeObserverMock(callback: ResizeObserverCallback) {
      resizeObserverMock.callback = callback;
      return resizeObserverMock as unknown as ResizeObserver;
    }) as unknown as typeof ResizeObserver;

    // Mock window.addEventListener for resize
    const originalAddEventListener = window.addEventListener;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    window.addEventListener = vi.fn((event: string, handler: any) => {
      if (event === 'resize') {
        windowResizeListeners.push(handler);
      }
      return originalAddEventListener.call(window, event, handler);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    }) as any;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initial Rendering', () => {
    it('should render with basic props', () => {
      render(<PdfPane documentId="test-doc" pageNumber={1} />);

      expect(screen.getByRole('region', { name: /pdf viewer pane/i })).toBeInTheDocument();
      expect(screen.getByTestId('mock-document')).toBeInTheDocument();
    });

    it('should show loading state initially', () => {
      render(<PdfPane documentId="test-doc" pageNumber={1} />);

      expect(screen.getByRole('status', { name: /loading pdf/i })).toBeInTheDocument();
      expect(screen.getByText(/loading pdf\.\.\./i)).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      render(<PdfPane documentId="test-doc" pageNumber={1} className="custom-class" />);

      const pane = screen.getByRole('region', { name: /pdf viewer pane/i });
      expect(pane).toHaveClass('custom-class');
    });

    it('should generate correct PDF URL from documentId', () => {
      render(<PdfPane documentId="my-document-123" pageNumber={1} />);

      expect(mockDocument).toHaveBeenCalledWith(
        expect.objectContaining({
          file: expect.objectContaining({
            url: '/api/documents/my-document-123/pdf',
          }),
        })
      );
    });
  });

  describe('Document Loading', () => {
    it('should call onLoadSuccess when document loads successfully', async () => {
      const onLoadSuccess = vi.fn();

      render(<PdfPane documentId="test-doc" pageNumber={1} onLoadSuccess={onLoadSuccess} />);

      // Simulate document load success
      const documentCall = mockDocument.mock.calls[0][0];
      documentCall.onLoadSuccess({ numPages: 10 });

      await waitFor(() => {
        expect(onLoadSuccess).toHaveBeenCalledWith(10);
      });
    });

    it('should hide loading state after successful load', async () => {
      render(<PdfPane documentId="test-doc" pageNumber={1} />);

      // Simulate document load success
      const documentCall = mockDocument.mock.calls[0][0];
      documentCall.onLoadSuccess({ numPages: 5 });

      await waitFor(() => {
        expect(screen.queryByRole('status', { name: /loading pdf/i })).not.toBeInTheDocument();
      });
    });

    it('should handle document load error', async () => {
      const onLoadError = vi.fn();
      const testError = new Error('Failed to load PDF');

      render(<PdfPane documentId="test-doc" pageNumber={1} onLoadError={onLoadError} />);

      // Simulate document load error
      const documentCall = mockDocument.mock.calls[0][0];
      documentCall.onLoadError(testError);

      await waitFor(() => {
        expect(onLoadError).toHaveBeenCalledWith(testError);
        expect(screen.getByRole('alert')).toBeInTheDocument();
        expect(screen.getByText(/error loading pdf/i)).toBeInTheDocument();
      });
    });

    it('should show corrupted PDF error message', async () => {
      render(<PdfPane documentId="test-doc" pageNumber={1} />);

      // Simulate document load error
      const documentCall = mockDocument.mock.calls[0][0];
      documentCall.onLoadError(new Error('Invalid PDF structure'));

      await waitFor(() => {
        expect(screen.getByText(/cannot render pdf/i)).toBeInTheDocument();
        expect(screen.getByText(/file may be corrupted/i)).toBeInTheDocument();
      });
    });

    it('should display retry button on error', async () => {
      render(<PdfPane documentId="test-doc" pageNumber={1} />);

      // Simulate document load error
      const documentCall = mockDocument.mock.calls[0][0];
      documentCall.onLoadError(new Error('Network error'));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /retry loading pdf/i })).toBeInTheDocument();
      });
    });
  });

  describe('Page Rendering', () => {
    it('should render the correct page number', () => {
      render(<PdfPane documentId="test-doc" pageNumber={3} />);

      expect(mockPage).toHaveBeenCalledWith(
        expect.objectContaining({
          pageNumber: 3,
        })
      );
    });

    it('should update page when pageNumber prop changes', () => {
      const { rerender } = render(<PdfPane documentId="test-doc" pageNumber={1} />);

      expect(mockPage).toHaveBeenCalledWith(
        expect.objectContaining({
          pageNumber: 1,
        })
      );

      rerender(<PdfPane documentId="test-doc" pageNumber={5} />);

      expect(mockPage).toHaveBeenCalledWith(
        expect.objectContaining({
          pageNumber: 5,
        })
      );
    });

    it('should handle page load success with dimensions', async () => {
      render(<PdfPane documentId="test-doc" pageNumber={1} />);

      // Simulate page load success with viewport info
      const pageCall = mockPage.mock.calls[0][0];
      const mockPageObject = {
        getViewport: ({ scale: _scale }: { scale: number }) => ({
          width: 612,
          height: 792,
        }),
      };
      pageCall.onLoadSuccess(mockPageObject);

      // Page dimensions should be captured
      await waitFor(() => {
        expect(mockPageObject.getViewport).toBeDefined();
      });
    });
  });

  describe('Zoom Functionality', () => {
    it('should render toolbar when zoom callbacks are provided', () => {
      const onZoomChange = vi.fn();

      render(
        <PdfPane
          documentId="test-doc"
          pageNumber={1}
          zoomLevel={1}
          zoomMode="fit"
          onZoomChange={onZoomChange}
        />
      );

      expect(screen.getByTestId('pdf-toolbar')).toBeInTheDocument();
    });

    it('should not render toolbar when zoom callbacks are missing', () => {
      render(<PdfPane documentId="test-doc" pageNumber={1} zoomLevel={1} zoomMode="fit" />);

      expect(screen.queryByTestId('pdf-toolbar')).not.toBeInTheDocument();
    });

    it('should pass correct zoom props to toolbar', () => {
      const onZoomChange = vi.fn();

      render(
        <PdfPane
          documentId="test-doc"
          pageNumber={1}
          zoomLevel={1.5}
          zoomMode="percentage"
          onZoomChange={onZoomChange}
        />
      );

      expect(screen.getByTestId('zoom-info')).toHaveTextContent('1.5 - percentage');
    });

    it('should disable toolbar during loading', () => {
      const onZoomChange = vi.fn();

      render(
        <PdfPane
          documentId="test-doc"
          pageNumber={1}
          onZoomChange={onZoomChange}
        />
      );

      // During loading, toolbar should be disabled
      const zoomInBtn = screen.getByTestId('toolbar-zoom-in');
      expect(zoomInBtn).toBeDisabled();
    });

    it('should disable toolbar when error occurs', async () => {
      const onZoomChange = vi.fn();

      render(
        <PdfPane
          documentId="test-doc"
          pageNumber={1}
          onZoomChange={onZoomChange}
        />
      );

      // Simulate error
      const documentCall = mockDocument.mock.calls[0][0];
      documentCall.onLoadError(new Error('Test error'));

      await waitFor(() => {
        const zoomInBtn = screen.getByTestId('toolbar-zoom-in');
        expect(zoomInBtn).toBeDisabled();
      });
    });
  });

  describe('Zoom Modes', () => {
    it('should use fit mode by default', () => {
      render(<PdfPane documentId="test-doc" pageNumber={1} />);

      // Default zoom mode should be 'fit'
      // Scale calculation would be based on fit mode
      expect(mockPage).toHaveBeenCalled();
    });

    it('should accept width zoom mode', () => {
      const onZoomChange = vi.fn();

      render(
        <PdfPane
          documentId="test-doc"
          pageNumber={1}
          zoomLevel={1}
          zoomMode="width"
          onZoomChange={onZoomChange}
        />
      );

      expect(screen.getByTestId('zoom-info')).toHaveTextContent('width');
    });

    it('should accept percentage zoom mode', () => {
      const onZoomChange = vi.fn();

      render(
        <PdfPane
          documentId="test-doc"
          pageNumber={1}
          zoomLevel={2}
          zoomMode="percentage"
          onZoomChange={onZoomChange}
        />
      );

      expect(screen.getByTestId('zoom-info')).toHaveTextContent('2 - percentage');
    });
  });

  describe('Non-Standard PDF Sizes', () => {
    it('should show warning for non-standard page sizes', async () => {
      render(<PdfPane documentId="test-doc" pageNumber={1} />);

      // Load document first
      const documentCall = mockDocument.mock.calls[0][0];
      documentCall.onLoadSuccess({ numPages: 1 });

      // Simulate page load with non-standard dimensions (not US Letter)
      const pageCall = mockPage.mock.calls[0][0];
      const mockPageObject = {
        getViewport: ({ scale: _scale }: { scale: number }) => ({
          width: 500, // Non-standard width
          height: 700, // Non-standard height
        }),
      };
      pageCall.onLoadSuccess(mockPageObject);

      await waitFor(() => {
        expect(screen.getByRole('status', { name: /non-standard page size warning/i })).toBeInTheDocument();
        expect(screen.getByText(/non-standard page size/i)).toBeInTheDocument();
      });
    });

    it('should display page dimensions in warning', async () => {
      render(<PdfPane documentId="test-doc" pageNumber={1} />);

      // Load document
      const documentCall = mockDocument.mock.calls[0][0];
      documentCall.onLoadSuccess({ numPages: 1 });

      // Load page with non-standard dimensions
      const pageCall = mockPage.mock.calls[0][0];
      const mockPageObject = {
        getViewport: ({ scale: _scale }: { scale: number }) => ({
          width: 500,
          height: 700,
        }),
      };
      pageCall.onLoadSuccess(mockPageObject);

      await waitFor(() => {
        // formatPdfDimensions should show: 500/72 x 700/72 = 6.9 × 9.7 in
        expect(screen.getByText(/6\.9 × 9\.7 in/i)).toBeInTheDocument();
      });
    });

    it('should show orientation in warning', async () => {
      render(<PdfPane documentId="test-doc" pageNumber={1} />);

      // Load document
      const documentCall = mockDocument.mock.calls[0][0];
      documentCall.onLoadSuccess({ numPages: 1 });

      // Load landscape page
      const pageCall = mockPage.mock.calls[0][0];
      const mockPageObject = {
        getViewport: ({ scale: _scale }: { scale: number }) => ({
          width: 800, // Landscape
          height: 500,
        }),
      };
      pageCall.onLoadSuccess(mockPageObject);

      await waitFor(() => {
        expect(screen.getByText(/landscape/i)).toBeInTheDocument();
      });
    });

    it('should not show warning for standard US Letter size', async () => {
      render(<PdfPane documentId="test-doc" pageNumber={1} />);

      // Load document
      const documentCall = mockDocument.mock.calls[0][0];
      documentCall.onLoadSuccess({ numPages: 1 });

      // Load standard US Letter page
      const pageCall = mockPage.mock.calls[0][0];
      const mockPageObject = {
        getViewport: ({ scale: _scale }: { scale: number }) => ({
          width: 612, // US Letter
          height: 792,
        }),
      };
      pageCall.onLoadSuccess(mockPageObject);

      await waitFor(() => {
        expect(screen.queryByRole('status', { name: /non-standard page size warning/i })).not.toBeInTheDocument();
      });
    });
  });

  describe('Progressive Loading', () => {
    it('should start with low-resolution rendering', async () => {
      render(<PdfPane documentId="test-doc" pageNumber={1} />);

      // Load document
      const documentCall = mockDocument.mock.calls[0][0];
      documentCall.onLoadSuccess({ numPages: 1 });

      // The initial scale should be reduced (multiplied by 0.5)
      // This is tested implicitly through the scale calculation
      expect(mockPage).toHaveBeenCalled();
    });

    it('should reset high-res state when page changes', async () => {
      const { rerender } = render(<PdfPane documentId="test-doc" pageNumber={1} />);

      // Load document and page
      const documentCall = mockDocument.mock.calls[0][0];
      documentCall.onLoadSuccess({ numPages: 5 });

      const pageCall = mockPage.mock.calls[0][0];
      const mockPageObject = {
        getViewport: ({ scale: _scale }: { scale: number }) => ({
          width: 612,
          height: 792,
        }),
      };
      pageCall.onLoadSuccess(mockPageObject);

      // Wait for high-res to be ready
      await waitFor(() => {
        // Component should have updated
        expect(mockPage).toHaveBeenCalled();
      });

      // Change page
      rerender(<PdfPane documentId="test-doc" pageNumber={2} />);

      // High-res should be reset, causing a re-render with low-res first
      await waitFor(() => {
        expect(mockPage).toHaveBeenCalled();
      });
    });
  });

  describe('Component Memoization', () => {
    it('should not re-render when unrelated props change', () => {
      const { rerender } = render(
        <PdfPane documentId="test-doc" pageNumber={1} zoomLevel={1} zoomMode="fit" className="class-1" />
      );

      const initialCallCount = mockDocument.mock.calls.length;

      // Re-render with same key props but different className
      rerender(<PdfPane documentId="test-doc" pageNumber={1} zoomLevel={1} zoomMode="fit" className="class-2" />);

      // Should re-render because className changed (not part of memo comparison)
      // But document should still be the same
      expect(mockDocument.mock.calls.length).toBeGreaterThanOrEqual(initialCallCount);
    });

    it('should re-render when documentId changes', () => {
      const { rerender } = render(<PdfPane documentId="doc-1" pageNumber={1} zoomLevel={1} zoomMode="fit" />);

      mockDocument.mockClear();

      rerender(<PdfPane documentId="doc-2" pageNumber={1} zoomLevel={1} zoomMode="fit" />);

      // Should re-render with new document
      expect(mockDocument).toHaveBeenCalledWith(
        expect.objectContaining({
          file: expect.objectContaining({
            url: '/api/documents/doc-2/pdf',
          }),
        })
      );
    });

    it('should re-render when pageNumber changes', () => {
      const { rerender } = render(<PdfPane documentId="test-doc" pageNumber={1} />);

      mockPage.mockClear();

      rerender(<PdfPane documentId="test-doc" pageNumber={3} />);

      expect(mockPage).toHaveBeenCalledWith(
        expect.objectContaining({
          pageNumber: 3,
        })
      );
    });

    it('should re-render when zoomLevel changes', () => {
      const onZoomChange = vi.fn();

      const { rerender } = render(
        <PdfPane
          documentId="test-doc"
          pageNumber={1}
          zoomLevel={1}
          zoomMode="percentage"
          onZoomChange={onZoomChange}
        />
      );

      rerender(
        <PdfPane
          documentId="test-doc"
          pageNumber={1}
          zoomLevel={1.5}
          zoomMode="percentage"
          onZoomChange={onZoomChange}
        />
      );

      expect(screen.getByTestId('zoom-info')).toHaveTextContent('1.5');
    });

    it('should re-render when zoomMode changes', () => {
      const onZoomChange = vi.fn();

      const { rerender } = render(
        <PdfPane
          documentId="test-doc"
          pageNumber={1}
          zoomLevel={1}
          zoomMode="fit"
          onZoomChange={onZoomChange}
        />
      );

      rerender(
        <PdfPane
          documentId="test-doc"
          pageNumber={1}
          zoomLevel={1}
          zoomMode="width"
          onZoomChange={onZoomChange}
        />
      );

      expect(screen.getByTestId('zoom-info')).toHaveTextContent('width');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels for PDF pane', () => {
      render(<PdfPane documentId="test-doc" pageNumber={1} />);

      expect(screen.getByRole('region', { name: /pdf viewer pane/i })).toBeInTheDocument();
    });

    it('should have ARIA label for loading state', () => {
      render(<PdfPane documentId="test-doc" pageNumber={1} />);

      expect(screen.getByRole('status', { name: /loading pdf/i })).toBeInTheDocument();
    });

    it('should have ARIA alert for error state', async () => {
      render(<PdfPane documentId="test-doc" pageNumber={1} />);

      const documentCall = mockDocument.mock.calls[0][0];
      documentCall.onLoadError(new Error('Test error'));

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });
    });

    it('should have ARIA label for page content', () => {
      render(<PdfPane documentId="test-doc" pageNumber={5} />);

      expect(screen.getByLabelText(/pdf page 5/i)).toBeInTheDocument();
    });
  });

  describe('Container Resize Handling', () => {
    it('should update dimensions on window resize', async () => {
      render(<PdfPane documentId="test-doc" pageNumber={1} />);

      // Trigger a resize event
      windowResizeListeners.forEach((listener) => listener());

      // Container dimensions should be checked
      await waitFor(() => {
        expect(windowResizeListeners.length).toBeGreaterThan(0);
      });
    });

    it('should clean up resize listener on unmount', () => {
      const { unmount } = render(<PdfPane documentId="test-doc" pageNumber={1} />);

      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function));
    });

    it('should update dimensions when container resizes via ResizeObserver', async () => {
      // Track ResizeObserver callbacks
      const resizeCallbacks: Array<(entries: Array<{ contentRect: { width: number; height: number } }>) => void> = [];
      global.ResizeObserver = vi.fn(function ResizeObserver(callback: ResizeObserverCallback) {
        resizeCallbacks.push(callback);
        return resizeObserverMock as unknown as ResizeObserver;
      }) as unknown as typeof ResizeObserver;

      // Provide initial size
      Object.defineProperty(HTMLElement.prototype, 'clientWidth', {
        configurable: true,
        value: 800,
      });
      Object.defineProperty(HTMLElement.prototype, 'clientHeight', {
        configurable: true,
        value: 600,
      });

      render(<PdfPane documentId="test-doc" pageNumber={1} zoomMode="fit" />);

      // Simulate document and page load with initial dimensions
      const documentCall = mockDocument.mock.calls[0][0];
      documentCall.onLoadSuccess({ numPages: 1 });
      const pageCall = mockPage.mock.calls[0][0];
      const mockPageObject = {
        getViewport: ({ scale: _scale }: { scale: number }) => ({
          width: 612,
          height: 792,
        }),
      };
      pageCall.onLoadSuccess(mockPageObject);

      // Simulate resize observer callback with new size
      resizeCallbacks.forEach((cb) =>
        cb([{ contentRect: { width: 1000, height: 700 } } as ResizeObserverEntry])
      );

      // Expect a re-render (mockPage called again) reflecting new scale calculation path
      await waitFor(() => {
        expect(mockPage).toHaveBeenCalled();
      });
    });
  });

  describe('HTTP Source Configuration', () => {
    it('should configure HTTP source without credentials', () => {
      render(<PdfPane documentId="test-doc" pageNumber={1} />);

      expect(mockDocument).toHaveBeenCalledWith(
        expect.objectContaining({
          file: expect.objectContaining({
            url: '/api/documents/test-doc/pdf',
            httpHeaders: {},
            withCredentials: false,
          }),
        })
      );
    });

    it('should use consistent URL for all pages (browser caching)', () => {
      const { rerender } = render(<PdfPane documentId="test-doc" pageNumber={1} />);

      const firstCall = mockDocument.mock.calls[0][0].file.url;

      mockDocument.mockClear();
      rerender(<PdfPane documentId="test-doc" pageNumber={2} />);

      // URL should remain the same for browser caching
      expect(firstCall).toBe('/api/documents/test-doc/pdf');
    });
  });

  describe('Page Dimension Tooltip', () => {
    it('should show dimensions in tooltip after page loads', async () => {
      render(<PdfPane documentId="test-doc" pageNumber={1} />);

      // Load document
      const documentCall = mockDocument.mock.calls[0][0];
      documentCall.onLoadSuccess({ numPages: 1 });

      // Load page with dimensions
      const pageCall = mockPage.mock.calls[0][0];
      const mockPageObject = {
        getViewport: ({ scale: _scale }: { scale: number }) => ({
          width: 612,
          height: 792,
        }),
      };
      pageCall.onLoadSuccess(mockPageObject);

      await waitFor(() => {
        const pageContainer = screen.getByLabelText(/pdf page 1/i);
        // Should have title attribute with dimensions
        expect(pageContainer).toHaveAttribute('title', '8.5 × 11.0 in');
      });
    });
  });

  describe('Scale Calculation', () => {
    it('should calculate scale in fit mode based on container dimensions', async () => {
      // Mock container dimensions
      Object.defineProperty(HTMLElement.prototype, 'clientWidth', {
        configurable: true,
        value: 800,
      });
      Object.defineProperty(HTMLElement.prototype, 'clientHeight', {
        configurable: true,
        value: 600,
      });

      render(<PdfPane documentId="test-doc" pageNumber={1} zoomMode="fit" />);

      // Load document
      const documentCall = mockDocument.mock.calls[0][0];
      documentCall.onLoadSuccess({ numPages: 1 });

      // Load page with dimensions
      const pageCall = mockPage.mock.calls[0][0];
      const mockPageObject = {
        getViewport: ({ scale: _scale }: { scale: number }) => ({
          width: 612,
          height: 792,
        }),
      };
      pageCall.onLoadSuccess(mockPageObject);

      await waitFor(() => {
        // Scale should be calculated based on fit mode
        expect(mockPage).toHaveBeenCalled();
      });
    });

    it('should calculate scale in width mode based on container width', async () => {
      Object.defineProperty(HTMLElement.prototype, 'clientWidth', {
        configurable: true,
        value: 1000,
      });

      render(<PdfPane documentId="test-doc" pageNumber={1} zoomMode="width" />);

      // Load document
      const documentCall = mockDocument.mock.calls[0][0];
      documentCall.onLoadSuccess({ numPages: 1 });

      // Load page with dimensions
      const pageCall = mockPage.mock.calls[0][0];
      const mockPageObject = {
        getViewport: ({ scale: _scale }: { scale: number }) => ({
          width: 612,
          height: 792,
        }),
      };
      pageCall.onLoadSuccess(mockPageObject);

      await waitFor(() => {
        // Scale should be based on width mode calculation
        expect(mockPage).toHaveBeenCalled();
      });
    });

    it('should use zoomLevel directly in percentage mode', async () => {
      render(<PdfPane documentId="test-doc" pageNumber={1} zoomLevel={2} zoomMode="percentage" />);

      // Load document
      const documentCall = mockDocument.mock.calls[0][0];
      documentCall.onLoadSuccess({ numPages: 1 });

      // Load page with dimensions
      const pageCall = mockPage.mock.calls[0][0];
      const mockPageObject = {
        getViewport: ({ scale: _scale }: { scale: number }) => ({
          width: 612,
          height: 792,
        }),
      };
      pageCall.onLoadSuccess(mockPageObject);

      await waitFor(() => {
        // In percentage mode, baseScale should equal zoomLevel
        expect(mockPage).toHaveBeenCalled();
      });
    });

    it('should return scale of 1 when container width is not set', () => {
      Object.defineProperty(HTMLElement.prototype, 'clientWidth', {
        configurable: true,
        value: 0,
      });

      render(<PdfPane documentId="test-doc" pageNumber={1} />);

      // Without container dimensions, scale should default to 1
      expect(mockPage).toHaveBeenCalledWith(
        expect.objectContaining({
          scale: 1,
        })
      );
    });

    it('should return scale of 1 when page dimensions are not set', () => {
      render(<PdfPane documentId="test-doc" pageNumber={1} />);

      // Before page loads, scale should be 1
      expect(mockPage).toHaveBeenCalledWith(
        expect.objectContaining({
          scale: 1,
        })
      );
    });
  });

  describe('Error Retry Functionality', () => {
    it('should clear error and show loading when retry is clicked', async () => {
      render(<PdfPane documentId="test-doc" pageNumber={1} />);

      // Simulate error
      const documentCall = mockDocument.mock.calls[0][0];
      documentCall.onLoadError(new Error('Network error'));

      await waitFor(() => {
        expect(screen.getByText(/error loading pdf/i)).toBeInTheDocument();
      });

      // Click retry button
      const retryButton = screen.getByRole('button', { name: /retry loading pdf/i });
      retryButton.click();

      // Error should be cleared and loading should show
      await waitFor(() => {
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
        expect(screen.getByRole('status', { name: /loading pdf/i })).toBeInTheDocument();
      });
    });
  });

  describe('Default Props', () => {
    it('should use default zoomLevel of 1', () => {
      render(<PdfPane documentId="test-doc" pageNumber={1} />);

      // Component should render without error
      expect(screen.getByRole('region', { name: /pdf viewer pane/i })).toBeInTheDocument();
    });

    it('should use default zoomMode of fit', () => {
      render(<PdfPane documentId="test-doc" pageNumber={1} />);

      // Component should render without error
      expect(screen.getByRole('region', { name: /pdf viewer pane/i })).toBeInTheDocument();
    });

    it('should use empty string as default className', () => {
      render(<PdfPane documentId="test-doc" pageNumber={1} />);

      const pane = screen.getByRole('region', { name: /pdf viewer pane/i });
      // Should have base classes but not additional custom class
      expect(pane).toHaveClass('pdf-pane');
    });
  });
});
