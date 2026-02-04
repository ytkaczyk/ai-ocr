import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ZoomControls } from '@/components/viewer/ZoomControls';

/**
 * Unit tests for ZoomControls component
 * Tests FR-016: PDF zoom controls (10% increments, fit, width modes)
 */

describe('ZoomControls', () => {
  const mockProps = {
    zoomLevel: 1,
    zoomMode: 'percentage' as const,
    onZoomIn: vi.fn(),
    onZoomOut: vi.fn(),
    onZoomChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render all zoom control elements', () => {
      render(<ZoomControls {...mockProps} />);
      
      expect(screen.getByTestId('zoom-controls')).toBeInTheDocument();
      expect(screen.getByTestId('zoom-in')).toBeInTheDocument();
      expect(screen.getByTestId('zoom-out')).toBeInTheDocument();
      expect(screen.getByTestId('zoom-select')).toBeInTheDocument();
    });

    it('should have proper ARIA labels', () => {
      render(<ZoomControls {...mockProps} />);
      
      expect(screen.getByRole('group', { name: /pdf zoom controls/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/zoom in/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/zoom out/i)).toBeInTheDocument();
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

  describe('Zoom In Button', () => {
    it('should call onZoomIn when clicked', () => {
      render(<ZoomControls {...mockProps} />);
      
      fireEvent.click(screen.getByTestId('zoom-in'));
      
      expect(mockProps.onZoomIn).toHaveBeenCalledTimes(1);
    });

    it('should be disabled when zoomLevel is at maximum (5)', () => {
      render(<ZoomControls {...mockProps} zoomLevel={5} />);
      
      expect(screen.getByTestId('zoom-in')).toBeDisabled();
    });

    it('should be disabled when in fit mode', () => {
      render(<ZoomControls {...mockProps} zoomMode="fit" />);
      
      expect(screen.getByTestId('zoom-in')).toBeDisabled();
    });

    it('should be disabled when in width mode', () => {
      render(<ZoomControls {...mockProps} zoomMode="width" />);
      
      expect(screen.getByTestId('zoom-in')).toBeDisabled();
    });

    it('should be disabled when disabled prop is true', () => {
      render(<ZoomControls {...mockProps} disabled={true} />);
      
      expect(screen.getByTestId('zoom-in')).toBeDisabled();
    });

    it('should have proper title attribute', () => {
      render(<ZoomControls {...mockProps} />);
      
      expect(screen.getByTestId('zoom-in')).toHaveAttribute('title', 'Zoom in (increase by 10%)');
    });
  });

  describe('Zoom Out Button', () => {
    it('should call onZoomOut when clicked', () => {
      render(<ZoomControls {...mockProps} />);
      
      fireEvent.click(screen.getByTestId('zoom-out'));
      
      expect(mockProps.onZoomOut).toHaveBeenCalledTimes(1);
    });

    it('should be disabled when zoomLevel is at minimum (0.1)', () => {
      render(<ZoomControls {...mockProps} zoomLevel={0.1} />);
      
      expect(screen.getByTestId('zoom-out')).toBeDisabled();
    });

    it('should be disabled when in fit mode', () => {
      render(<ZoomControls {...mockProps} zoomMode="fit" />);
      
      expect(screen.getByTestId('zoom-out')).toBeDisabled();
    });

    it('should be disabled when in width mode', () => {
      render(<ZoomControls {...mockProps} zoomMode="width" />);
      
      expect(screen.getByTestId('zoom-out')).toBeDisabled();
    });

    it('should be disabled when disabled prop is true', () => {
      render(<ZoomControls {...mockProps} disabled={true} />);
      
      expect(screen.getByTestId('zoom-out')).toBeDisabled();
    });

    it('should have proper title attribute', () => {
      render(<ZoomControls {...mockProps} />);
      
      expect(screen.getByTestId('zoom-out')).toHaveAttribute('title', 'Zoom out (decrease by 10%)');
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

    it('should enable zoom out when above minimum', () => {
      render(<ZoomControls {...mockProps} zoomLevel={0.2} />);
      
      expect(screen.getByTestId('zoom-out')).not.toBeDisabled();
    });

    it('should enable zoom in when below maximum', () => {
      render(<ZoomControls {...mockProps} zoomLevel={4.9} />);
      
      expect(screen.getByTestId('zoom-in')).not.toBeDisabled();
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
      
      expect(screen.getByTestId('zoom-in')).not.toBeDisabled();
      expect(screen.getByTestId('zoom-out')).not.toBeDisabled();
      expect(screen.getByTestId('zoom-select')).not.toBeDisabled();
    });
  });
});
