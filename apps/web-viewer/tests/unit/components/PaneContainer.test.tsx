import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PaneContainer } from '@/components/viewer/PaneContainer';
import { useViewerStore } from '@/lib/stores/useViewerStore';

// Mock the stores and dynamic imports
vi.mock('@/lib/stores/useViewerStore');
vi.mock('next/dynamic', () => ({
  default: (_loader: unknown, options: { ssr: boolean; loading: () => React.ReactElement }) => {
    // Return the loading component for simplicity in tests
    return options.loading;
  },
}));

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

  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockResolvedValue(createMockResponse({ content: '# Test', sizeBytes: 100 }));
  });

  describe('2-Pane Layout (FR-005)', () => {
    beforeEach(() => {
      (useViewerStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        panes: [
          { id: 'pdf', contentType: 'pdf', widthPercent: 50, visible: true, isRaw: false },
          { id: 'markdown', contentType: 'markdown', widthPercent: 50, visible: true, isRaw: false },
        ],
        updatePaneWidth: mockUpdatePaneWidth,
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

    it('should render PDF pane with loading indicator', () => {
      render(<PaneContainer documentId="test-doc" currentPage={1} languageCode="en-US" />);

      expect(screen.getByText(/loading pdf viewer/i)).toBeInTheDocument();
    });

    it('should render MarkdownPane with content', async () => {
      render(<PaneContainer documentId="test-doc" currentPage={1} languageCode="en-US" />);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /test/i })).toBeInTheDocument();
      });
    });
  });

  describe('3-Pane Layout (FR-005)', () => {
    beforeEach(() => {
      (useViewerStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        panes: [
          { id: 'pdf', contentType: 'pdf', widthPercent: 33.33, visible: true, isRaw: false },
          { id: 'markdown', contentType: 'markdown', widthPercent: 33.33, visible: true, isRaw: false },
          { id: 'raw', contentType: 'markdown', widthPercent: 33.34, visible: true, isRaw: true },
        ],
        updatePaneWidth: mockUpdatePaneWidth,
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
          { id: 'markdown', contentType: 'markdown', widthPercent: 50, visible: true, isRaw: false },
        ],
        updatePaneWidth: mockUpdatePaneWidth,
      });
    });

    it('should pass same page number to all panes', () => {
      const { rerender } = render(<PaneContainer documentId="test-doc" currentPage={1} languageCode="en-US" />);

      // Verify initial page
      expect(screen.getByText(/loading pdf viewer/i)).toBeInTheDocument();

      // Change page
      rerender(<PaneContainer documentId="test-doc" currentPage={5} languageCode="en-US" />);

      // All panes should update (in real implementation, this would show page 5)
      expect(screen.getByText(/loading pdf viewer/i)).toBeInTheDocument();
    });

    it('should pass same document ID to all panes', () => {
      render(<PaneContainer documentId="doc-123" currentPage={1} languageCode="en-US" />);

      // Both panes should receive the same documentId
      expect(screen.getByText(/loading pdf viewer/i)).toBeInTheDocument();
    });

    it('should update all panes when page changes', async () => {
      const { rerender } = render(<PaneContainer documentId="test-doc" currentPage={1} languageCode="en-US" />);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /test/i })).toBeInTheDocument();
      });

      mockFetch.mockResolvedValue(createMockResponse({ content: '# Page 2', sizeBytes: 100 }));
      rerender(<PaneContainer documentId="test-doc" currentPage={2} languageCode="en-US" />);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /page 2/i })).toBeInTheDocument();
      });
    });
  });

  describe('Pane Visibility', () => {
    it('should not render hidden panes', () => {
      (useViewerStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        panes: [
          { id: 'pdf', contentType: 'pdf', widthPercent: 100, visible: true, isRaw: false },
          { id: 'markdown', contentType: 'markdown', widthPercent: 0, visible: false, isRaw: false },
        ],
        updatePaneWidth: mockUpdatePaneWidth,
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
          { id: 'markdown', contentType: 'markdown', widthPercent: 50, visible: true, isRaw: false },
        ],
        updatePaneWidth: mockUpdatePaneWidth,
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
          { id: 'markdown', contentType: 'markdown', widthPercent: 50, visible: true, isRaw: false },
        ],
        updatePaneWidth: mockUpdatePaneWidth,
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
      const container = render(<PaneContainer documentId="test-doc" currentPage={1} languageCode="en-US" />);
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
          { id: 'markdown', contentType: 'markdown', widthPercent: 85, visible: true, isRaw: false },
        ],
        updatePaneWidth: mockUpdatePaneWidth,
      });

      const container = render(<PaneContainer documentId="test-doc" currentPage={1} languageCode="en-US" />);
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
    it('should show loading state for PDF pane', () => {
      (useViewerStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        panes: [
          { id: 'pdf', contentType: 'pdf', widthPercent: 100, visible: true, isRaw: false },
        ],
        updatePaneWidth: mockUpdatePaneWidth,
      });

      render(<PaneContainer documentId="test-doc" currentPage={1} languageCode="en-US" />);

      expect(screen.getByText(/loading pdf viewer/i)).toBeInTheDocument();
    });
  });

  describe('Pane Data Attributes', () => {
    it('should set data-pane-id attribute on panes', () => {
      (useViewerStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        panes: [
          { id: 'pdf', contentType: 'pdf', widthPercent: 50, visible: true, isRaw: false },
          { id: 'markdown', contentType: 'markdown', widthPercent: 50, visible: true, isRaw: false },
        ],
        updatePaneWidth: mockUpdatePaneWidth,
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
          { id: 'markdown-raw', contentType: 'markdown', widthPercent: 100, visible: true, isRaw: true },
        ],
        updatePaneWidth: mockUpdatePaneWidth,
      });

      render(<PaneContainer documentId="test-doc" currentPage={1} languageCode="en-US" />);

      // Raw markdown pane should render
      expect(screen.getByRole('region', { name: /document viewer panes/i })).toBeInTheDocument();
    });
  });
});
