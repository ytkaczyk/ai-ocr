import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DocumentCard } from '@/components/viewer/DocumentCard';
import { createMockDocumentSet, createMockLanguageVersion } from '@/tests/helpers/mocks';

describe('DocumentCard', () => {
  const mockOnSelect = vi.fn();

  beforeEach(() => {
    mockOnSelect.mockClear();
  });

  describe('Rendering', () => {
    it('should render document information', () => {
      const document = createMockDocumentSet({
        id: 'test-doc',
        fileName: 'test.pdf',
        pageCount: 10,
        pdfSizeBytes: 1024 * 1024 * 2.5, // 2.5 MB
      });

      render(<DocumentCard document={document} onSelect={mockOnSelect} />);

      expect(screen.getByText('test.pdf')).toBeInTheDocument();
      expect(screen.getByText(/10 pages/)).toBeInTheDocument();
      expect(screen.getByText(/2.5 MB/)).toBeInTheDocument();
    });

    it('should render singular "page" for single-page document', () => {
      const document = createMockDocumentSet({
        pageCount: 1,
      });

      render(<DocumentCard document={document} onSelect={mockOnSelect} />);

      expect(screen.getByText(/1 page/)).toBeInTheDocument();
      expect(screen.queryByText(/1 pages/)).not.toBeInTheDocument();
    });

    it('should format file sizes correctly', () => {
      const testCases = [
        { bytes: 0, expected: '0 B' },
        { bytes: 1024, expected: '1 KB' },
        { bytes: 1024 * 1024, expected: '1 MB' },
        { bytes: 1024 * 1024 * 1.5, expected: '1.5 MB' },
      ];

      testCases.forEach(({ bytes, expected }) => {
        const document = createMockDocumentSet({ pdfSizeBytes: bytes });
        const { unmount } = render(<DocumentCard document={document} onSelect={mockOnSelect} />);
        expect(screen.getByText(new RegExp(expected))).toBeInTheDocument();
        unmount();
      });
    });
  });

  describe('Language Display', () => {
    it('should display processed languages', () => {
      const document = createMockDocumentSet({
        availableLanguages: [
          createMockLanguageVersion({ languageCode: 'en-US', isRaw: false, folderName: 'en-US' }),
          createMockLanguageVersion({ languageCode: 'fr-FR', isRaw: false, folderName: 'fr-FR' }),
        ],
      });

      render(<DocumentCard document={document} onSelect={mockOnSelect} />);

      expect(screen.getByText('English (US)')).toBeInTheDocument();
      expect(screen.getByText('French')).toBeInTheDocument();
    });

    it('should display raw language indicator', () => {
      const document = createMockDocumentSet({
        availableLanguages: [
          createMockLanguageVersion({ languageCode: 'en-US', isRaw: true, folderName: 'raw.en-US' }),
        ],
      });

      render(<DocumentCard document={document} onSelect={mockOnSelect} />);

      expect(screen.getByText('English (US) (Raw)')).toBeInTheDocument();
    });

    it('should prefer processed over raw languages (FR-021)', () => {
      const document = createMockDocumentSet({
        availableLanguages: [
          createMockLanguageVersion({ languageCode: 'en-US', isRaw: true, folderName: 'raw.en-US' }),
          createMockLanguageVersion({ languageCode: 'en-US', isRaw: false, folderName: 'en-US' }),
          createMockLanguageVersion({ languageCode: 'fr-FR', isRaw: true, folderName: 'raw.fr-FR' }),
        ],
      });

      render(<DocumentCard document={document} onSelect={mockOnSelect} />);

      // Should show processed version
      expect(screen.getByText('English (US)')).toBeInTheDocument();
      // Should indicate raw versions available
      expect(screen.getByText(/\+2 raw/)).toBeInTheDocument();
    });

    it('should display unknown language codes as-is', () => {
      const document = createMockDocumentSet({
        availableLanguages: [
          createMockLanguageVersion({ languageCode: 'xx-YY', isRaw: false, folderName: 'xx-YY' }),
        ],
      });

      render(<DocumentCard document={document} onSelect={mockOnSelect} />);

      expect(screen.getByText('xx-YY')).toBeInTheDocument();
    });
  });

  describe('Selection', () => {
    it('should call onSelect when card is clicked', async () => {
      const user = userEvent.setup();
      const document = createMockDocumentSet({ id: 'test-doc' });

      render(<DocumentCard document={document} onSelect={mockOnSelect} />);

      await user.click(screen.getByRole('button', { pressed: false }));

      expect(mockOnSelect).toHaveBeenCalledWith('test-doc');
      expect(mockOnSelect).toHaveBeenCalledTimes(1);
    });

    it('should call onSelect when Enter key is pressed', async () => {
      const user = userEvent.setup();
      const document = createMockDocumentSet({ id: 'test-doc' });

      render(<DocumentCard document={document} onSelect={mockOnSelect} />);

      const card = screen.getByRole('button', { pressed: false });
      card.focus();
      await user.keyboard('{Enter}');

      expect(mockOnSelect).toHaveBeenCalledWith('test-doc');
    });

    it('should call onSelect when Space key is pressed', async () => {
      const user = userEvent.setup();
      const document = createMockDocumentSet({ id: 'test-doc' });

      render(<DocumentCard document={document} onSelect={mockOnSelect} />);

      const card = screen.getByRole('button', { pressed: false });
      card.focus();
      await user.keyboard(' ');

      expect(mockOnSelect).toHaveBeenCalledWith('test-doc');
    });

    it('should call onSelect when "Select Document" button is clicked', async () => {
      const user = userEvent.setup();
      const document = createMockDocumentSet({ id: 'test-doc' });

      render(<DocumentCard document={document} onSelect={mockOnSelect} />);

      await user.click(screen.getByText('Select Document'));

      expect(mockOnSelect).toHaveBeenCalledWith('test-doc');
    });

    it('should show selected state when isSelected is true', () => {
      const document = createMockDocumentSet();

      render(<DocumentCard document={document} onSelect={mockOnSelect} isSelected={true} />);

      expect(screen.getByRole('button', { pressed: true })).toBeInTheDocument();
      expect(screen.getByText('Selected')).toBeInTheDocument();
    });

    it('should show unselected state when isSelected is false', () => {
      const document = createMockDocumentSet();

      render(<DocumentCard document={document} onSelect={mockOnSelect} isSelected={false} />);

      expect(screen.getByRole('button', { pressed: false })).toBeInTheDocument();
      expect(screen.getByText('Select Document')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      const document = createMockDocumentSet();

      render(<DocumentCard document={document} onSelect={mockOnSelect} />);

      // Get the card container (first button role element)
      const card = screen.getByRole('button', { name: /mock-document/i });
      expect(card).toHaveAttribute('tabIndex', '0');
      expect(card).toHaveAttribute('aria-pressed', 'false');
    });

    it('should update aria-pressed when selected', () => {
      const document = createMockDocumentSet();

      render(<DocumentCard document={document} onSelect={mockOnSelect} isSelected={true} />);

      // Get the card container (first button role element)
      const card = screen.getByRole('button', { name: /mock-document/i });
      expect(card).toHaveAttribute('aria-pressed', 'true');
    });
  });
});
