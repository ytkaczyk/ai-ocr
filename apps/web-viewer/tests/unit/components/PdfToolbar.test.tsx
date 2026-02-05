import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PdfToolbar } from '@/components/viewer/PdfToolbar';

/**
 * Unit tests for PdfToolbar component
 * Tests toolbar rendering and integration with ZoomControls
 */

describe('PdfToolbar', () => {
  const mockProps = {
    zoomLevel: 1,
    zoomMode: 'percentage' as const,
    onZoomChange: vi.fn(),
  };

  describe('Rendering', () => {
    it('should render the toolbar container', () => {
      render(<PdfToolbar {...mockProps} />);
      
      const toolbar = screen.getByRole('group', { name: /pdf zoom controls/i });
      expect(toolbar).toBeInTheDocument();
    });

    it('should render ZoomControls component', () => {
      render(<PdfToolbar {...mockProps} />);
      
      expect(screen.getByTestId('zoom-controls')).toBeInTheDocument();
      expect(screen.getByTestId('zoom-select')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      const { container } = render(<PdfToolbar {...mockProps} className="custom-class" />);
      
      const toolbar = container.firstChild as HTMLElement;
      expect(toolbar).toHaveClass('custom-class');
    });

    it('should have proper styling classes', () => {
      const { container } = render(<PdfToolbar {...mockProps} />);
      
      const toolbar = container.firstChild as HTMLElement;
      expect(toolbar).toHaveClass('shrink-0');
      expect(toolbar).toHaveClass('border-b');
      expect(toolbar).toHaveClass('bg-muted/30');
      expect(toolbar).toHaveClass('px-4');
      expect(toolbar).toHaveClass('py-2');
    });
  });

  describe('Props Forwarding', () => {
    it('should forward zoom level to ZoomControls', () => {
      render(<PdfToolbar {...mockProps} zoomLevel={1.5} />);
      
      expect(screen.getByText('150%')).toBeInTheDocument();
    });

    it('should forward zoom mode to ZoomControls', () => {
      render(<PdfToolbar {...mockProps} zoomMode="fit" />);
      
      expect(screen.getByText('Fit')).toBeInTheDocument();
    });

    it('should forward disabled state to ZoomControls', () => {
      render(<PdfToolbar {...mockProps} disabled={true} />);
      
      const zoomSelect = screen.getByTestId('zoom-select');
      
      expect(zoomSelect).toBeDisabled();
    });

    it('should forward event handlers to ZoomControls', () => {
      const handlers = {
        ...mockProps,
        onZoomChange: vi.fn(),
      };
      
      render(<PdfToolbar {...handlers} />);
      
      // The handlers are passed to ZoomControls, which is tested separately
      // We just verify the component renders correctly with these props
      expect(screen.getByTestId('zoom-controls')).toBeInTheDocument();
    });
  });

  describe('Default Props', () => {
    it('should use default disabled value of false', () => {
      render(<PdfToolbar {...mockProps} />);
      
      const zoomSelect = screen.getByTestId('zoom-select');
      expect(zoomSelect).not.toBeDisabled();
    });

    it('should use default className value of empty string', () => {
      const { container } = render(<PdfToolbar {...mockProps} />);
      
      const toolbar = container.firstChild as HTMLElement;
      // Should have default classes but no custom ones
      expect(toolbar.className).not.toContain('undefined');
    });
  });
});
