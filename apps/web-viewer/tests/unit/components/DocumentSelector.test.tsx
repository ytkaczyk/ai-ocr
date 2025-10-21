import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DocumentSelector } from '@/components/viewer/DocumentSelector';
import { createMockDocumentSets } from '@/tests/helpers/mocks';
import * as documentsApi from '@/lib/api/documents';

// Mock the API module
vi.mock('@/lib/api/documents');

describe('DocumentSelector', () => {
  const mockOnSelect = vi.fn();

  beforeEach(() => {
    mockOnSelect.mockClear();
    vi.clearAllMocks();
  });

  describe('Loading State', () => {
    it('should display loading indicator while fetching documents', () => {
      // Mock API to never resolve (simulate loading)
      vi.mocked(documentsApi.fetchDocuments).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      render(<DocumentSelector onSelect={mockOnSelect} />);

      expect(screen.getByText('Loading documents...')).toBeInTheDocument();
      // Loader2 icon is present (aria-hidden but visible animation)
      const loader = document.querySelector('svg.animate-spin');
      expect(loader).toBeInTheDocument();
    });
  });

  describe('Document List Rendering', () => {
    it('should render list of documents after loading', async () => {
      const mockDocuments = createMockDocumentSets(3);
      vi.mocked(documentsApi.fetchDocuments).mockResolvedValue({
        documents: mockDocuments,
      });

      render(<DocumentSelector onSelect={mockOnSelect} />);

      await waitFor(() => {
        expect(screen.queryByText('Loading documents...')).not.toBeInTheDocument();
      });

      expect(screen.getByText('Select a Document')).toBeInTheDocument();
      expect(screen.getByText('Choose a document to view and compare translations')).toBeInTheDocument();
      expect(screen.getByText('3 documents available')).toBeInTheDocument();
    });

    it('should render document cards for each document', async () => {
      const mockDocuments = createMockDocumentSets(2);
      mockDocuments[0].fileName = 'first-doc.pdf';
      mockDocuments[1].fileName = 'second-doc.pdf';

      vi.mocked(documentsApi.fetchDocuments).mockResolvedValue({
        documents: mockDocuments,
      });

      render(<DocumentSelector onSelect={mockOnSelect} />);

      await waitFor(() => {
        expect(screen.getByText('first-doc.pdf')).toBeInTheDocument();
      });

      expect(screen.getByText('second-doc.pdf')).toBeInTheDocument();
    });

    it('should use singular "document" for single document', async () => {
      const mockDocuments = createMockDocumentSets(1);
      vi.mocked(documentsApi.fetchDocuments).mockResolvedValue({
        documents: mockDocuments,
      });

      render(<DocumentSelector onSelect={mockOnSelect} />);

      await waitFor(() => {
        expect(screen.getByText('1 document available')).toBeInTheDocument();
      });
    });
  });

  describe('Empty State (FR-023)', () => {
    it('should display empty state when no documents are available', async () => {
      vi.mocked(documentsApi.fetchDocuments).mockResolvedValue({
        documents: [],
      });

      render(<DocumentSelector onSelect={mockOnSelect} />);

      await waitFor(() => {
        expect(screen.getByText('No Documents Found')).toBeInTheDocument();
      });

      expect(screen.getByText(/The data folder is empty/)).toBeInTheDocument();
    });
  });

  describe('Error State (FR-023)', () => {
    it('should display error state when API call fails', async () => {
      const errorMessage = 'Failed to fetch documents';
      vi.mocked(documentsApi.fetchDocuments).mockRejectedValue(new Error(errorMessage));

      render(<DocumentSelector onSelect={mockOnSelect} />);

      await waitFor(() => {
        expect(screen.getByText('Error Loading Documents')).toBeInTheDocument();
      });

      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    it('should provide retry action on error', async () => {
      vi.mocked(documentsApi.fetchDocuments).mockRejectedValue(new Error('Network error'));

      render(<DocumentSelector onSelect={mockOnSelect} />);

      await waitFor(() => {
        expect(screen.getByText('Retry')).toBeInTheDocument();
      });

      // Verify the retry button is clickable (actual behavior calls window.location.reload which can't be fully tested in jsdom)
      const retryButton = screen.getByText('Retry');
      expect(retryButton).toBeEnabled();
      expect(retryButton.tagName).toBe('BUTTON');
    });
  });

  describe('Document Selection', () => {
    it('should call onSelect when a document card is clicked', async () => {
      const mockDocuments = createMockDocumentSets(2);

      vi.mocked(documentsApi.fetchDocuments).mockResolvedValue({
        documents: mockDocuments,
      });

      render(<DocumentSelector onSelect={mockOnSelect} />);

      await waitFor(() => {
        expect(screen.getByText('document-1')).toBeInTheDocument();
      });

      // Click the first document card (the card itself, not the button inside)
      const firstCard = screen.getByRole('button', { name: /document-1/i });
      await userEvent.click(firstCard);

      expect(mockOnSelect).toHaveBeenCalledWith('document-1');
    });

    it('should highlight selected document', async () => {
      const mockDocuments = createMockDocumentSets(2);
      mockDocuments[0].id = 'selected-doc';

      vi.mocked(documentsApi.fetchDocuments).mockResolvedValue({
        documents: mockDocuments,
      });

      render(<DocumentSelector onSelect={mockOnSelect} selectedDocumentId="selected-doc" />);

      await waitFor(() => {
        expect(screen.getByText('Selected')).toBeInTheDocument();
      });

      // Should show "Selected" button for the selected document
      const selectedButtons = screen.getAllByText('Selected');
      expect(selectedButtons).toHaveLength(1);
    });
  });

  describe('Responsive Grid Layout', () => {
    it('should render documents in a grid layout', async () => {
      const mockDocuments = createMockDocumentSets(6);
      vi.mocked(documentsApi.fetchDocuments).mockResolvedValue({
        documents: mockDocuments,
      });

      const { container } = render(<DocumentSelector onSelect={mockOnSelect} />);

      await waitFor(() => {
        expect(screen.getByText('6 documents available')).toBeInTheDocument();
      });

      // Check for grid layout classes
      const gridContainer = container.querySelector('.grid');
      expect(gridContainer).toBeInTheDocument();
      expect(gridContainer).toHaveClass('gap-4');
    });
  });

  describe('API Integration', () => {
    it('should call fetchDocuments on mount', async () => {
      const mockDocuments = createMockDocumentSets(1);
      const fetchSpy = vi.mocked(documentsApi.fetchDocuments).mockResolvedValue({
        documents: mockDocuments,
      });

      render(<DocumentSelector onSelect={mockOnSelect} />);

      await waitFor(() => {
        expect(fetchSpy).toHaveBeenCalledTimes(1);
      });
    });

    it('should handle API timeout gracefully', async () => {
      vi.mocked(documentsApi.fetchDocuments).mockImplementation(
        () => new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 100))
      );

      render(<DocumentSelector onSelect={mockOnSelect} />);

      await waitFor(() => {
        expect(screen.getByText('Error Loading Documents')).toBeInTheDocument();
      }, { timeout: 200 });
    });
  });
});
