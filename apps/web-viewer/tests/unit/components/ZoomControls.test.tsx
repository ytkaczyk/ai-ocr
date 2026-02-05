import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ZoomControls } from '@/components/viewer/ZoomControls';

/**
 * Unit tests for ZoomControls component
 * Tests FR-016: PDF zoom controls (10% increments, fit, width modes)
 */

describe('ZoomControls', () => {
  const mockProps = {
    zoomLevel: 1,
    zoomMode: 'percentage' as const,
    onZoomChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render zoom control elements', () => {
      render(<ZoomControls {...mockProps} />);
      
      expect(screen.getByTestId('zoom-controls')).toBeInTheDocument();
      expect(screen.getByTestId('zoom-select')).toBeInTheDocument();
    });

    it('should have proper ARIA labels', () => {
      render(<ZoomControls {...mockProps} />);
      
      expect(screen.getByRole('group', { name: /pdf zoom controls/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/select zoom level/i)).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      const { container } = render(<ZoomControls {...mockProps} className="custom-class" />);
      
      const controls = container.querySelector('[data-testid="zoom-controls"]');
      expect(controls).toHaveClass('custom-class');
    });
  });

  describe('Zoom Display', () => {
    it('should display percentage zoom level', () => {
      render(<ZoomControls {...mockProps} zoomLevel={1.5} zoomMode="percentage" />);
      
      expect(screen.getByText('150%')).toBeInTheDocument();
    });

    it('should display fit mode', () => {
      render(<ZoomControls {...mockProps} zoomLevel={1} zoomMode="fit" />);
      
      expect(screen.getByText('Fit')).toBeInTheDocument();
    });

    it('should display width mode', () => {
      render(<ZoomControls {...mockProps} zoomLevel={1} zoomMode="width" />);
      
      expect(screen.getByText('Width')).toBeInTheDocument();
    });

    it('should round percentage display to nearest integer', () => {
      render(<ZoomControls {...mockProps} zoomLevel={1.234} zoomMode="percentage" />);
      
      expect(screen.getByText('123%')).toBeInTheDocument();
    });
  });

  describe('Zoom Level Select', () => {
    it('should render zoom select dropdown', () => {
      render(<ZoomControls {...mockProps} />);
      
      const select = screen.getByTestId('zoom-select');
      expect(select).toBeInTheDocument();
      expect(select).toHaveAttribute('aria-label', 'Select zoom level');
    });

    it('should be disabled when disabled prop is true', () => {
      render(<ZoomControls {...mockProps} disabled={true} />);
      
      expect(screen.getByTestId('zoom-select')).toBeDisabled();
    });

    it('should show correct value for percentage mode', () => {
      render(<ZoomControls {...mockProps} zoomLevel={1.5} zoomMode="percentage" />);
      
      expect(screen.getByText('150%')).toBeInTheDocument();
    });

    it('should show correct value for fit mode', () => {
      render(<ZoomControls {...mockProps} zoomMode="fit" />);
      
      expect(screen.getByText('Fit')).toBeInTheDocument();
    });

    it('should show correct value for width mode', () => {
      render(<ZoomControls {...mockProps} zoomMode="width" />);
      
      expect(screen.getByText('Width')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle zoom level of 0.5 (50%)', () => {
      render(<ZoomControls {...mockProps} zoomLevel={0.5} />);
      
      expect(screen.getByText('50%')).toBeInTheDocument();
    });

    it('should handle zoom level of 2 (200%)', () => {
      render(<ZoomControls {...mockProps} zoomLevel={2} />);
      
      expect(screen.getByText('200%')).toBeInTheDocument();
    });
  });

  describe('Default Props', () => {
    it('should use default className of empty string', () => {
      const { container } = render(<ZoomControls {...mockProps} />);
      
      const controls = container.querySelector('[data-testid="zoom-controls"]');
      expect(controls?.className).not.toContain('undefined');
    });

    it('should use default disabled value of false', () => {
      render(<ZoomControls {...mockProps} />);
      
      expect(screen.getByTestId('zoom-select')).not.toBeDisabled();
    });
  });
});
