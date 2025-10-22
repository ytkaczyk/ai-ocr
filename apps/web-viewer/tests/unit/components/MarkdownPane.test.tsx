import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MarkdownPane } from '@/components/viewer/MarkdownPane';

// Mock Next.js Image component
vi.mock('next/image', () => ({
  default: ({ src, alt, title }: { src: string; alt: string; title?: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} title={title} />
  ),
}));

// Helper to create a mock Response
function createMockResponse(data: unknown, ok = true) {
  return {
    ok,
    json: async () => data,
    text: async () => JSON.stringify(data),
  } as Response;
}

describe('MarkdownPane', () => {
  const mockFetch = vi.fn();

  beforeEach(() => {
    global.fetch = mockFetch;
    vi.clearAllMocks();
  });

  describe('Loading State', () => {
    it('should show loading indicator initially', () => {
      mockFetch.mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      render(<MarkdownPane documentId="test-doc" pageNumber={1} languageCode="en-US" />);

      // Loading indicator is present (no role="status" in component)
      expect(screen.getByText(/loading markdown/i)).toBeInTheDocument();
    });
  });

  describe('Content Rendering', () => {
    it('should render markdown content successfully', async () => {
      const markdownContent = '# Test Heading\n\nThis is a test paragraph.';
      mockFetch.mockResolvedValue(createMockResponse({ content: markdownContent, sizeBytes: 100 }));

      render(<MarkdownPane documentId="test-doc" pageNumber={1} languageCode="en-US" />);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /test heading/i })).toBeInTheDocument();
        expect(screen.getByText(/this is a test paragraph/i)).toBeInTheDocument();
      });
    });

    it('should render markdown with code blocks', async () => {
      const markdownContent = '```javascript\nconst x = 5;\n```';
      mockFetch.mockResolvedValue(createMockResponse({ content: markdownContent, sizeBytes: 100 }));

      render(<MarkdownPane documentId="test-doc" pageNumber={1} languageCode="en-US" />);

      await waitFor(() => {
        expect(screen.getByText(/const x = 5/i)).toBeInTheDocument();
      });
    });

    it('should render markdown with lists', async () => {
      const markdownContent = '- Item 1\n- Item 2\n- Item 3';
      mockFetch.mockResolvedValue(createMockResponse({ content: markdownContent, sizeBytes: 100 }));

      render(<MarkdownPane documentId="test-doc" pageNumber={1} languageCode="en-US" />);

      await waitFor(() => {
        expect(screen.getByText(/item 1/i)).toBeInTheDocument();
        expect(screen.getByText(/item 2/i)).toBeInTheDocument();
        expect(screen.getByText(/item 3/i)).toBeInTheDocument();
      });
    });

    it('should render markdown with tables (GFM)', async () => {
      const markdownContent = '| Header 1 | Header 2 |\n|----------|----------|\n| Cell 1   | Cell 2   |';
      mockFetch.mockResolvedValue(createMockResponse({ content: markdownContent, sizeBytes: 100 }));

      render(<MarkdownPane documentId="test-doc" pageNumber={1} languageCode="en-US" />);

      await waitFor(() => {
        expect(screen.getByText(/header 1/i)).toBeInTheDocument();
        expect(screen.getByText(/cell 1/i)).toBeInTheDocument();
      });
    });
  });

  describe('Image Handling', () => {
    it('should render images with correct src', async () => {
      const markdownContent = '![Alt text](/test-image.png "Image title")';
      mockFetch.mockResolvedValue(createMockResponse({ content: markdownContent, sizeBytes: 100 }));

      render(<MarkdownPane documentId="test-doc" pageNumber={1} languageCode="en-US" />);

      await waitFor(() => {
        const img = screen.getByAltText(/alt text/i);
        expect(img).toBeInTheDocument();
        // Image paths are transformed to API endpoints by resolveMarkdownImages
        expect(img).toHaveAttribute('src', '/api/documents/test-doc/images/en-US//test-image.png');
        expect(img).toHaveAttribute('title', 'Image title');
      });
    });

    it('should handle images without src gracefully', async () => {
      const markdownContent = '![Alt text]()';
      mockFetch.mockResolvedValue(createMockResponse({ content: markdownContent, sizeBytes: 100 }));

      render(<MarkdownPane documentId="test-doc" pageNumber={1} languageCode="en-US" />);

      await waitFor(() => {
        // Should not crash, image should not be rendered
        const images = screen.queryAllByRole('img');
        expect(images.length).toBe(0);
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error message when fetch fails', async () => {
      // Mock fetch to fail all retry attempts
      mockFetch.mockRejectedValue(new Error('Network error'));

      render(<MarkdownPane documentId="test-doc" pageNumber={1} languageCode="en-US" />);

      // Wait for retry logic to complete (retryFetch tries 3 times)
      await waitFor(() => {
        expect(screen.getByText(/error loading markdown/i)).toBeInTheDocument();
        expect(screen.getByText(/network error/i)).toBeInTheDocument();
      }, { timeout: 5000 });
    });

    it('should show try again button on error', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      render(<MarkdownPane documentId="test-doc" pageNumber={1} languageCode="en-US" />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
      }, { timeout: 5000 });
    });

    it('should retry loading when try again is clicked', async () => {
      // Fail first load (3 retries), then succeed on button click retry
      mockFetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValue(createMockResponse({ content: '# Success!', sizeBytes: 100 }));

      render(<MarkdownPane documentId="test-doc" pageNumber={1} languageCode="en-US" />);

      // Wait for error state after initial retries
      await waitFor(() => {
        expect(screen.getByText(/error loading markdown/i)).toBeInTheDocument();
      }, { timeout: 5000 });

      const tryAgainButton = screen.getByRole('button', { name: /try again/i });
      fireEvent.click(tryAgainButton);

      // After clicking "Try again", the fetch should retry and succeed
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /success/i })).toBeInTheDocument();
      }, { timeout: 3000 });
    }, 10000); // Increase test timeout to 10 seconds
  });

  describe('Empty Content Handling (FR-030e)', () => {
    it('should display "No content" message for empty markdown', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ content: '', sizeBytes: 100 }));

      render(<MarkdownPane documentId="test-doc" pageNumber={1} languageCode="en-US" />);

      await waitFor(() => {
        expect(screen.getByText(/no content for this page/i)).toBeInTheDocument();
      });
    });

    it('should display "No content" message for whitespace-only markdown', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ content: '   \n\n  \t  ', sizeBytes: 100 }));

      render(<MarkdownPane documentId="test-doc" pageNumber={1} languageCode="en-US" />);

      await waitFor(() => {
        expect(screen.getByText(/no content for this page/i)).toBeInTheDocument();
      });
    });
  });

  describe('Page Changes', () => {
    it('should reload content when page number changes', async () => {
      mockFetch.mockResolvedValue(createMockResponse({ content: '# Page 1', sizeBytes: 100 }));

      const { rerender } = render(<MarkdownPane documentId="test-doc" pageNumber={1} languageCode="en-US" />);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /page 1/i })).toBeInTheDocument();
      });

      mockFetch.mockResolvedValue(createMockResponse({ content: '# Page 2', sizeBytes: 100 }));

      rerender(<MarkdownPane documentId="test-doc" pageNumber={2} languageCode="en-US" />);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /page 2/i })).toBeInTheDocument();
      });
    });

    it('should reload content when document ID changes', async () => {
      mockFetch.mockResolvedValue(createMockResponse({ content: '# Doc 1', sizeBytes: 100 }));

      const { rerender } = render(<MarkdownPane documentId="doc-1" pageNumber={1} languageCode="en-US" />);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /doc 1/i })).toBeInTheDocument();
      });

      mockFetch.mockResolvedValue(createMockResponse({ content: '# Doc 2', sizeBytes: 100 }));

      rerender(<MarkdownPane documentId="doc-2" pageNumber={1} languageCode="en-US" />);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /doc 2/i })).toBeInTheDocument();
      });
    });
  });

  describe('Callbacks', () => {
    it('should call onLoadSuccess when loading completes', async () => {
      const onLoadSuccess = vi.fn();
      mockFetch.mockResolvedValue(createMockResponse({ content: '# Test', sizeBytes: 100 }));

      render(
        <MarkdownPane documentId="test-doc" pageNumber={1} languageCode="en-US" onLoadSuccess={onLoadSuccess} />
      );

      await waitFor(() => {
        // onLoadSuccess is called without arguments
        expect(onLoadSuccess).toHaveBeenCalled();
      });
    });

    it('should call onLoadError when fetch fails', async () => {
      const onLoadError = vi.fn();
      const error = new Error('Network error');
      mockFetch.mockRejectedValue(error);

      render(<MarkdownPane documentId="test-doc" pageNumber={1} languageCode="en-US" onLoadError={onLoadError} />);

      await waitFor(() => {
        expect(onLoadError).toHaveBeenCalled();
        // Check that an Error object was passed
        expect(onLoadError.mock.calls[0][0]).toBeInstanceOf(Error);
      }, { timeout: 5000 });
    });
  });

  describe('Long Content Handling (FR-030b)', () => {
    it('should show warning for very long lines', async () => {
      const longLine = 'A'.repeat(15000);
      const markdownContent = `# Test\n\n${longLine}`;
      mockFetch.mockResolvedValue(createMockResponse({ content: markdownContent, sizeBytes: 100 }));

      render(<MarkdownPane documentId="test-doc" pageNumber={1} languageCode="en-US" />);

      await waitFor(() => {
        // Component displays warning banners for long lines
        expect(screen.getByText(/extremely long line/i)).toBeInTheDocument();
        expect(screen.getByText(/truncated for display/i)).toBeInTheDocument();
        // Heading should still be visible
        expect(screen.getByRole('heading', { name: /test/i })).toBeInTheDocument();
      });
    });
  });

  describe('Special Characters (FR-030d)', () => {
    it('should render Unicode characters correctly', async () => {
      const markdownContent = '# Test 日本語 العربية עברית';
      mockFetch.mockResolvedValue(createMockResponse({ content: markdownContent, sizeBytes: 100 }));

      render(<MarkdownPane documentId="test-doc" pageNumber={1} languageCode="en-US" />);

      await waitFor(() => {
        expect(screen.getByText(/日本語/)).toBeInTheDocument();
        expect(screen.getByText(/العربية/)).toBeInTheDocument();
        expect(screen.getByText(/עברית/)).toBeInTheDocument();
      });
    });

    it('should render special markdown characters when escaped', async () => {
      const markdownContent = '\\# Not a heading\n\n\\* Not a list';
      mockFetch.mockResolvedValue(createMockResponse({ content: markdownContent, sizeBytes: 100 }));

      render(<MarkdownPane documentId="test-doc" pageNumber={1} languageCode="en-US" />);

      await waitFor(() => {
        expect(screen.getByText(/# not a heading/i)).toBeInTheDocument();
        expect(screen.getByText(/\* not a list/i)).toBeInTheDocument();
      });
    });
  });
});
