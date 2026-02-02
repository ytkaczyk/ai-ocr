import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MissingPagePlaceholder } from '@/components/viewer/MissingPagePlaceholder';

describe('MissingPagePlaceholder', () => {
  describe('Rendering', () => {
    it('renders with required props', () => {
      render(<MissingPagePlaceholder pageNumber={1} languageCode="en-US" />);
      
      expect(screen.getByText(/page 1 not available/i)).toBeInTheDocument();
    });

    it('renders heading with correct page number', () => {
      render(<MissingPagePlaceholder pageNumber={5} languageCode="en-US" />);
      
      expect(screen.getByRole('heading', { name: /page 5 not available/i })).toBeInTheDocument();
    });

    it('renders description paragraph', () => {
      render(<MissingPagePlaceholder pageNumber={1} languageCode="en-US" />);
      
      expect(screen.getByText(/this page was not found/i)).toBeInTheDocument();
    });

    it('renders FileQuestion icon', () => {
      const { container } = render(<MissingPagePlaceholder pageNumber={1} languageCode="en-US" />);
      
      const icon = container.querySelector('svg[data-testid="file-question-icon"]');
      expect(icon).toBeInTheDocument();
    });

    it('renders within a card component', () => {
      const { container } = render(<MissingPagePlaceholder pageNumber={1} languageCode="en-US" />);
      
      // Card structure should be present
      const card = container.querySelector('[class*="card"]');
      expect(card).toBeInTheDocument();
    });
  });

  describe('Page Number Display', () => {
    it('displays page number 1', () => {
      render(<MissingPagePlaceholder pageNumber={1} languageCode="en-US" />);
      
      expect(screen.getByText(/page 1 not available/i)).toBeInTheDocument();
    });

    it('displays page number 10', () => {
      render(<MissingPagePlaceholder pageNumber={10} languageCode="en-US" />);
      
      expect(screen.getByText(/page 10 not available/i)).toBeInTheDocument();
    });

    it('displays page number 999', () => {
      render(<MissingPagePlaceholder pageNumber={999} languageCode="en-US" />);
      
      expect(screen.getByText(/page 999 not available/i)).toBeInTheDocument();
    });

    it('displays large page numbers correctly', () => {
      render(<MissingPagePlaceholder pageNumber={1000} languageCode="en-US" />);
      
      expect(screen.getByText(/page 1000 not available/i)).toBeInTheDocument();
    });
  });

  describe('Language Code Display', () => {
    it('displays en-US language code', () => {
      render(<MissingPagePlaceholder pageNumber={1} languageCode="en-US" />);
      
      expect(screen.getByText(/en-us/i)).toBeInTheDocument();
    });

    it('displays es-ES language code', () => {
      render(<MissingPagePlaceholder pageNumber={1} languageCode="es-ES" />);
      
      expect(screen.getByText(/es-es/i)).toBeInTheDocument();
    });

    it('displays ja-JP language code', () => {
      render(<MissingPagePlaceholder pageNumber={1} languageCode="ja-JP" />);
      
      expect(screen.getByText(/ja-jp/i)).toBeInTheDocument();
    });

    it('displays de-DE language code', () => {
      render(<MissingPagePlaceholder pageNumber={1} languageCode="de-DE" />);
      
      expect(screen.getByText(/de-de/i)).toBeInTheDocument();
    });

    it('displays fr-FR language code', () => {
      render(<MissingPagePlaceholder pageNumber={1} languageCode="fr-FR" />);
      
      expect(screen.getByText(/fr-fr/i)).toBeInTheDocument();
    });
  });

  describe('isRaw Flag Behavior (FR-014)', () => {
    it('displays "translation" when isRaw is false', () => {
      render(<MissingPagePlaceholder pageNumber={1} languageCode="en-US" isRaw={false} />);
      
      expect(screen.getByText(/translation/)).toBeInTheDocument();
      expect(screen.queryByText(/raw ocr output/i)).not.toBeInTheDocument();
    });

    it('displays "raw OCR output" when isRaw is true', () => {
      render(<MissingPagePlaceholder pageNumber={1} languageCode="en-US" isRaw={true} />);
      
      expect(screen.getByText(/raw ocr output/i)).toBeInTheDocument();
      expect(screen.queryByText(/translation/)).not.toBeInTheDocument();
    });

    it('defaults to "translation" when isRaw is undefined', () => {
      render(<MissingPagePlaceholder pageNumber={1} languageCode="en-US" />);
      
      expect(screen.getByText(/translation/)).toBeInTheDocument();
    });

    it('displays complete message with translation type', () => {
      render(<MissingPagePlaceholder pageNumber={1} languageCode="en-US" isRaw={false} />);
      
      expect(screen.getByText(/this page was not found in the en-us translation/i)).toBeInTheDocument();
    });

    it('displays complete message with raw OCR output type', () => {
      render(<MissingPagePlaceholder pageNumber={1} languageCode="ja-JP" isRaw={true} />);
      
      expect(screen.getByText(/this page was not found in the ja-jp raw ocr output/i)).toBeInTheDocument();
    });
  });

  describe('Custom className Support', () => {
    it('applies custom className when provided', () => {
      const { container } = render(
        <MissingPagePlaceholder pageNumber={1} languageCode="en-US" className="custom-class" />
      );
      
      const wrapper = container.querySelector('.custom-class');
      expect(wrapper).toBeInTheDocument();
    });

    it('applies multiple custom classes', () => {
      const { container } = render(
        <MissingPagePlaceholder pageNumber={1} languageCode="en-US" className="class1 class2 class3" />
      );
      
      const wrapper = container.querySelector('.class1.class2.class3');
      expect(wrapper).toBeInTheDocument();
    });

    it('preserves default classes when custom className is added', () => {
      const { container } = render(
        <MissingPagePlaceholder pageNumber={1} languageCode="en-US" className="custom-class" />
      );
      
      const wrapper = container.querySelector('.flex.h-full.w-full');
      expect(wrapper).toBeInTheDocument();
    });

    it('renders correctly without custom className', () => {
      const { container } = render(
        <MissingPagePlaceholder pageNumber={1} languageCode="en-US" />
      );
      
      const wrapper = container.querySelector('[role="alert"]');
      expect(wrapper).toBeInTheDocument();
    });

    it('handles empty string className', () => {
      const { container } = render(
        <MissingPagePlaceholder pageNumber={1} languageCode="en-US" className="" />
      );
      
      const wrapper = container.querySelector('[role="alert"]');
      expect(wrapper).toBeInTheDocument();
    });
  });

  describe('Accessibility (FR-014)', () => {
    it('has role="alert" for screen readers', () => {
      render(<MissingPagePlaceholder pageNumber={1} languageCode="en-US" />);
      
      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
    });

    it('has aria-live="polite" attribute', () => {
      render(<MissingPagePlaceholder pageNumber={1} languageCode="en-US" />);
      
      const alert = screen.getByRole('alert');
      expect(alert).toHaveAttribute('aria-live', 'polite');
    });

    it('has descriptive aria-label for translation', () => {
      render(<MissingPagePlaceholder pageNumber={5} languageCode="en-US" isRaw={false} />);
      
      const alert = screen.getByRole('alert');
      expect(alert).toHaveAttribute('aria-label', 'Page 5 is missing from en-US translation');
    });

    it('has descriptive aria-label for raw OCR output', () => {
      render(<MissingPagePlaceholder pageNumber={3} languageCode="ja-JP" isRaw={true} />);
      
      const alert = screen.getByRole('alert');
      expect(alert).toHaveAttribute('aria-label', 'Page 3 is missing from ja-JP raw OCR output');
    });

    it('icon has aria-hidden="true" to hide from screen readers', () => {
      const { container } = render(<MissingPagePlaceholder pageNumber={1} languageCode="en-US" />);
      
      const iconWrapper = container.querySelector('[aria-hidden="true"]');
      expect(iconWrapper).toBeInTheDocument();
    });

    it('provides meaningful heading for screen readers', () => {
      render(<MissingPagePlaceholder pageNumber={7} languageCode="en-US" />);
      
      const heading = screen.getByRole('heading', { name: /page 7 not available/i });
      expect(heading).toBeInTheDocument();
    });

    it('provides descriptive text content', () => {
      render(<MissingPagePlaceholder pageNumber={1} languageCode="en-US" />);
      
      expect(screen.getByText(/it may not have been processed yet/i)).toBeInTheDocument();
      expect(screen.getByText(/or was skipped during ocr scanning/i)).toBeInTheDocument();
    });
  });

  describe('Layout and Styling', () => {
    it('centers content horizontally and vertically', () => {
      const { container } = render(<MissingPagePlaceholder pageNumber={1} languageCode="en-US" />);
      
      const wrapper = container.querySelector('.items-center.justify-center');
      expect(wrapper).toBeInTheDocument();
    });

    it('fills available height and width', () => {
      const { container } = render(<MissingPagePlaceholder pageNumber={1} languageCode="en-US" />);
      
      const wrapper = container.querySelector('.h-full.w-full');
      expect(wrapper).toBeInTheDocument();
    });

    it('applies padding to container', () => {
      const { container } = render(<MissingPagePlaceholder pageNumber={1} languageCode="en-US" />);
      
      const wrapper = container.querySelector('.p-8');
      expect(wrapper).toBeInTheDocument();
    });

    it('renders card with max-width constraint', () => {
      const { container } = render(<MissingPagePlaceholder pageNumber={1} languageCode="en-US" />);
      
      const card = container.querySelector('.max-w-md');
      expect(card).toBeInTheDocument();
    });

    it('renders card with full width', () => {
      const { container } = render(<MissingPagePlaceholder pageNumber={1} languageCode="en-US" />);
      
      const card = container.querySelector('.w-full');
      expect(card).toBeInTheDocument();
    });

    it('applies custom background color to card', () => {
      const { container } = render(<MissingPagePlaceholder pageNumber={1} languageCode="en-US" />);
      
      const card = container.querySelector('.w-full.max-w-md');
      expect(card).toBeInTheDocument();
      expect(card).toHaveStyle({ backgroundColor: '#F3F4F6' });
    });

    it('renders icon with rounded background', () => {
      const { container } = render(<MissingPagePlaceholder pageNumber={1} languageCode="en-US" />);
      
      const iconWrapper = container.querySelector('.rounded-full');
      expect(iconWrapper).toBeInTheDocument();
    });

    it('applies padding to card content', () => {
      const { container } = render(<MissingPagePlaceholder pageNumber={1} languageCode="en-US" />);
      
      const cardContent = container.querySelector('.p-8.text-center');
      expect(cardContent).toBeInTheDocument();
    });

    it('centers card content', () => {
      const { container } = render(<MissingPagePlaceholder pageNumber={1} languageCode="en-US" />);
      
      const cardContent = container.querySelector('.flex.flex-col.items-center.justify-center');
      expect(cardContent).toBeInTheDocument();
    });
  });

  describe('Text Styling', () => {
    it('renders heading with semibold font', () => {
      render(<MissingPagePlaceholder pageNumber={1} languageCode="en-US" />);
      
      const heading = screen.getByText(/page 1 not available/i);
      expect(heading).toHaveClass('font-semibold');
    });

    it('renders heading with large text size', () => {
      render(<MissingPagePlaceholder pageNumber={1} languageCode="en-US" />);
      
      const heading = screen.getByText(/page 1 not available/i);
      expect(heading).toHaveClass('text-lg');
    });

    it('renders heading with dark gray color', () => {
      render(<MissingPagePlaceholder pageNumber={1} languageCode="en-US" />);
      
      const heading = screen.getByText(/page 1 not available/i);
      expect(heading).toHaveClass('text-gray-900');
    });

    it('renders description with small text size', () => {
      render(<MissingPagePlaceholder pageNumber={1} languageCode="en-US" />);
      
      const description = screen.getByText(/this page was not found/i);
      expect(description).toHaveClass('text-sm');
    });

    it('renders description with gray color', () => {
      render(<MissingPagePlaceholder pageNumber={1} languageCode="en-US" />);
      
      const description = screen.getByText(/this page was not found/i);
      expect(description).toHaveClass('text-gray-700');
    });

    it('applies margin to heading', () => {
      render(<MissingPagePlaceholder pageNumber={1} languageCode="en-US" />);
      
      const heading = screen.getByText(/page 1 not available/i);
      expect(heading).toHaveClass('mb-2');
    });
  });

  describe('Icon Styling', () => {
    it('applies margin to icon wrapper', () => {
      const { container } = render(<MissingPagePlaceholder pageNumber={1} languageCode="en-US" />);
      
      const iconWrapper = container.querySelector('.mb-4');
      expect(iconWrapper).toBeInTheDocument();
    });

    it('applies height and width to icon wrapper', () => {
      const { container } = render(<MissingPagePlaceholder pageNumber={1} languageCode="en-US" />);
      
      const iconWrapper = container.querySelector('.h-16.w-16');
      expect(iconWrapper).toBeInTheDocument();
    });

    it('applies gray background to icon wrapper', () => {
      const { container } = render(<MissingPagePlaceholder pageNumber={1} languageCode="en-US" />);
      
      const iconWrapper = container.querySelector('.bg-gray-300');
      expect(iconWrapper).toBeInTheDocument();
    });

    it('centers icon within wrapper', () => {
      const { container } = render(<MissingPagePlaceholder pageNumber={1} languageCode="en-US" />);
      
      const iconWrapper = container.querySelector('.items-center.justify-center');
      expect(iconWrapper).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles page number 0', () => {
      render(<MissingPagePlaceholder pageNumber={0} languageCode="en-US" />);
      
      expect(screen.getByText(/page 0 not available/i)).toBeInTheDocument();
    });

    it('handles negative page numbers', () => {
      render(<MissingPagePlaceholder pageNumber={-1} languageCode="en-US" />);
      
      expect(screen.getByText(/page -1 not available/i)).toBeInTheDocument();
    });

    it('handles very large page numbers', () => {
      render(<MissingPagePlaceholder pageNumber={999999} languageCode="en-US" />);
      
      expect(screen.getByText(/page 999999 not available/i)).toBeInTheDocument();
    });

    it('handles single character language code', () => {
      render(<MissingPagePlaceholder pageNumber={1} languageCode="e" />);
      
      expect(screen.getByText(/\be\b/i)).toBeInTheDocument();
    });

    it('handles empty language code', () => {
      render(<MissingPagePlaceholder pageNumber={1} languageCode="" />);
      
      // Component should still render
      expect(screen.getByText(/page 1 not available/i)).toBeInTheDocument();
    });

    it('handles language code with special characters', () => {
      render(<MissingPagePlaceholder pageNumber={1} languageCode="en-US@special" />);
      
      expect(screen.getByText(/en-us@special/i)).toBeInTheDocument();
    });

    it('handles very long language codes', () => {
      const longCode = 'A'.repeat(100);
      render(<MissingPagePlaceholder pageNumber={1} languageCode={longCode} />);
      
      expect(screen.getByText(new RegExp(longCode, 'i'))).toBeInTheDocument();
    });
  });

  describe('Combined Props Scenarios', () => {
    it('renders correctly with all props provided', () => {
      render(
        <MissingPagePlaceholder
          pageNumber={42}
          languageCode="es-ES"
          isRaw={true}
          className="test-class"
        />
      );
      
      expect(screen.getByText(/page 42 not available/i)).toBeInTheDocument();
      expect(screen.getByText(/es-es/i)).toBeInTheDocument();
      expect(screen.getByText(/raw ocr output/i)).toBeInTheDocument();
    });

    it('renders correctly with minimum required props', () => {
      render(<MissingPagePlaceholder pageNumber={1} languageCode="en-US" />);
      
      expect(screen.getByText(/page 1 not available/i)).toBeInTheDocument();
      expect(screen.getByText(/translation/)).toBeInTheDocument();
    });

    it('handles page 1 with translation', () => {
      render(<MissingPagePlaceholder pageNumber={1} languageCode="en-US" isRaw={false} />);
      
      const alert = screen.getByRole('alert');
      expect(alert).toHaveAttribute('aria-label', 'Page 1 is missing from en-US translation');
    });

    it('handles page 100 with raw OCR for Japanese', () => {
      render(<MissingPagePlaceholder pageNumber={100} languageCode="ja-JP" isRaw={true} />);
      
      expect(screen.getByText(/page 100 not available/i)).toBeInTheDocument();
      expect(screen.getByText(/ja-jp raw ocr output/i)).toBeInTheDocument();
    });

    it('handles different page and language combinations', () => {
      const { rerender } = render(
        <MissingPagePlaceholder pageNumber={1} languageCode="en-US" />
      );
      
      expect(screen.getByText(/page 1 not available/i)).toBeInTheDocument();
      
      rerender(<MissingPagePlaceholder pageNumber={2} languageCode="fr-FR" />);
      
      expect(screen.getByText(/page 2 not available/i)).toBeInTheDocument();
      expect(screen.getByText(/fr-fr/i)).toBeInTheDocument();
    });
  });

  describe('Content Structure', () => {
    it('renders all required content elements', () => {
      render(<MissingPagePlaceholder pageNumber={1} languageCode="en-US" />);
      
      // Icon
      expect(screen.getByTestId('file-question-icon')).toBeInTheDocument();
      // Heading
      expect(screen.getByRole('heading')).toBeInTheDocument();
      // Description
      expect(screen.getByText(/this page was not found/i)).toBeInTheDocument();
    });

    it('maintains correct element hierarchy', () => {
      const { container } = render(<MissingPagePlaceholder pageNumber={1} languageCode="en-US" />);
      
      const alert = container.querySelector('[role="alert"]');
      const card = container.querySelector('[class*="card"]');
      
      // Card should be inside alert
      expect(alert).toContainElement(card!);
    });

    it('includes explanation text about why page is missing', () => {
      render(<MissingPagePlaceholder pageNumber={1} languageCode="en-US" />);
      
      expect(screen.getByText(/it may not have been processed yet/i)).toBeInTheDocument();
      expect(screen.getByText(/or was skipped during ocr scanning/i)).toBeInTheDocument();
    });

    it('text content flows logically', () => {
      render(<MissingPagePlaceholder pageNumber={5} languageCode="de-DE" isRaw={false} />);
      
      const description = screen.getByText(/this page was not found in the de-de translation/i);
      expect(description).toBeInTheDocument();
      // Full sentence check
      expect(description.textContent).toMatch(/It may not have been processed yet or was skipped during OCR scanning/);
    });
  });

  describe('FR-014: Missing Markdown Page Placeholder', () => {
    it('implements FR-014 requirements for missing page display', () => {
      render(<MissingPagePlaceholder pageNumber={1} languageCode="en-US" />);
      
      // Should show clear message
      expect(screen.getByText(/page 1 not available/i)).toBeInTheDocument();
      // Should explain why
      expect(screen.getByText(/not found/i)).toBeInTheDocument();
      // Should be accessible
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('differentiates between raw OCR and translation as per FR-014', () => {
      const { rerender } = render(
        <MissingPagePlaceholder pageNumber={1} languageCode="en-US" isRaw={false} />
      );
      
      expect(screen.getByText(/translation/)).toBeInTheDocument();
      
      rerender(<MissingPagePlaceholder pageNumber={1} languageCode="en-US" isRaw={true} />);
      
      expect(screen.getByText(/raw ocr output/i)).toBeInTheDocument();
    });

    it('provides helpful context about missing pages', () => {
      render(<MissingPagePlaceholder pageNumber={1} languageCode="en-US" />);
      
      // Should explain possible reasons
      expect(screen.getByText(/may not have been processed yet/i)).toBeInTheDocument();
      expect(screen.getByText(/skipped during ocr scanning/i)).toBeInTheDocument();
    });

    it('uses consistent visual design with card component', () => {
      const { container } = render(<MissingPagePlaceholder pageNumber={1} languageCode="en-US" />);
      
      const card = container.querySelector('[class*="card"]');
      expect(card).toBeInTheDocument();
    });

    it('provides visual indicator with FileQuestion icon', () => {
      render(<MissingPagePlaceholder pageNumber={1} languageCode="en-US" />);
      
      expect(screen.getByTestId('file-question-icon')).toBeInTheDocument();
    });
  });

  describe('Responsiveness', () => {
    it('uses flex layout for responsiveness', () => {
      const { container } = render(<MissingPagePlaceholder pageNumber={1} languageCode="en-US" />);
      
      const wrapper = container.querySelector('.flex');
      expect(wrapper).toBeInTheDocument();
    });

    it('centers content regardless of container size', () => {
      const { container } = render(<MissingPagePlaceholder pageNumber={1} languageCode="en-US" />);
      
      const wrapper = container.querySelector('.justify-center.items-center');
      expect(wrapper).toBeInTheDocument();
    });

    it('card respects max-width constraint', () => {
      const { container } = render(<MissingPagePlaceholder pageNumber={1} languageCode="en-US" />);
      
      const card = container.querySelector('.max-w-md');
      expect(card).toBeInTheDocument();
    });
  });

  describe('Rendering Consistency', () => {
    it('renders consistently on multiple renders with same props', () => {
      const { rerender } = render(
        <MissingPagePlaceholder pageNumber={1} languageCode="en-US" />
      );
      
      const firstHeading = screen.getByRole('heading').textContent;
      
      rerender(<MissingPagePlaceholder pageNumber={1} languageCode="en-US" />);
      
      const secondHeading = screen.getByRole('heading').textContent;
      expect(secondHeading).toBe(firstHeading);
    });

    it('updates correctly when props change', () => {
      const { rerender } = render(
        <MissingPagePlaceholder pageNumber={1} languageCode="en-US" />
      );
      
      expect(screen.getByText(/page 1 not available/i)).toBeInTheDocument();
      
      rerender(<MissingPagePlaceholder pageNumber={2} languageCode="fr-FR" />);
      
      expect(screen.queryByText(/page 1 not available/i)).not.toBeInTheDocument();
      expect(screen.getByText(/page 2 not available/i)).toBeInTheDocument();
      expect(screen.getByText(/fr-fr/i)).toBeInTheDocument();
    });
  });
});
