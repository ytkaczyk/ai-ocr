import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ModeToggle } from '@/components/viewer/ModeToggle';
import { useViewerStore } from '@/lib/stores/useViewerStore';

/**
 * Unit tests for ModeToggle component (T087)
 * Tests FR-005: Two display modes (2-pane, 3-pane)
 * Tests FR-006: Mode switching without losing page position
 * Tests accessibility features and disabled states
 */

// Mock the Zustand store
vi.mock('@/lib/stores/useViewerStore', () => ({
  useViewerStore: vi.fn(),
}));

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Columns2: () => <span data-testid="columns2-icon">Columns2</span>,
  Columns3: () => <span data-testid="columns3-icon">Columns3</span>,
}));

describe('ModeToggle', () => {
  let mockSetPaneMode: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockSetPaneMode = vi.fn();
    
    // Default store state: two-pane mode
    (useViewerStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      paneMode: 'two-pane',
      setPaneMode: mockSetPaneMode,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering (FR-005)', () => {
    it('should render both mode buttons', () => {
      render(<ModeToggle availableLanguages={['en-US', 'es-ES']} />);

      expect(screen.getByTestId('two-pane-button')).toBeInTheDocument();
      expect(screen.getByTestId('three-pane-button')).toBeInTheDocument();
    });

    it('should render view mode label', () => {
      render(<ModeToggle availableLanguages={['en-US', 'es-ES']} />);

      expect(screen.getByText('View:')).toBeInTheDocument();
    });

    it('should render both icons', () => {
      render(<ModeToggle availableLanguages={['en-US', 'es-ES']} />);

      expect(screen.getByTestId('columns2-icon')).toBeInTheDocument();
      expect(screen.getByTestId('columns3-icon')).toBeInTheDocument();
    });

    it('should display button labels', () => {
      render(<ModeToggle availableLanguages={['en-US', 'es-ES']} />);

      expect(screen.getByText('2-Pane')).toBeInTheDocument();
      expect(screen.getByText('3-Pane')).toBeInTheDocument();
    });
  });

  describe('Mode Selection (FR-005)', () => {
    it('should highlight active mode button (two-pane)', () => {
      render(<ModeToggle availableLanguages={['en-US', 'es-ES']} />);

      const twoPaneButton = screen.getByTestId('two-pane-button');
      const threePaneButton = screen.getByTestId('three-pane-button');

      expect(twoPaneButton).toHaveAttribute('aria-pressed', 'true');
      expect(threePaneButton).toHaveAttribute('aria-pressed', 'false');
    });

    it('should highlight active mode button (three-pane)', () => {
      (useViewerStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        paneMode: 'three-pane',
        setPaneMode: mockSetPaneMode,
      });

      render(<ModeToggle availableLanguages={['en-US', 'es-ES']} />);

      const twoPaneButton = screen.getByTestId('two-pane-button');
      const threePaneButton = screen.getByTestId('three-pane-button');

      expect(twoPaneButton).toHaveAttribute('aria-pressed', 'false');
      expect(threePaneButton).toHaveAttribute('aria-pressed', 'true');
    });

    it('should call setPaneMode when two-pane button clicked', () => {
      (useViewerStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        paneMode: 'three-pane',
        setPaneMode: mockSetPaneMode,
      });

      render(<ModeToggle availableLanguages={['en-US', 'es-ES']} />);

      const twoPaneButton = screen.getByTestId('two-pane-button');
      fireEvent.click(twoPaneButton);

      expect(mockSetPaneMode).toHaveBeenCalledWith('two-pane');
      expect(mockSetPaneMode).toHaveBeenCalledTimes(1);
    });

    it('should call setPaneMode when three-pane button clicked', () => {
      render(<ModeToggle availableLanguages={['en-US', 'es-ES']} />);

      const threePaneButton = screen.getByTestId('three-pane-button');
      fireEvent.click(threePaneButton);

      expect(mockSetPaneMode).toHaveBeenCalledWith('three-pane');
      expect(mockSetPaneMode).toHaveBeenCalledTimes(1);
    });
  });

  describe('3-Pane Mode Requirements', () => {
    it('should enable 3-pane button with 2 languages', () => {
      render(<ModeToggle availableLanguages={['en-US', 'es-ES']} />);

      const threePaneButton = screen.getByTestId('three-pane-button');
      expect(threePaneButton).not.toBeDisabled();
    });

    it('should enable 3-pane button with more than 2 languages', () => {
      render(<ModeToggle availableLanguages={['en-US', 'es-ES', 'fr-FR']} />);

      const threePaneButton = screen.getByTestId('three-pane-button');
      expect(threePaneButton).not.toBeDisabled();
    });

    it('should disable 3-pane button with only 1 language', () => {
      render(<ModeToggle availableLanguages={['en-US']} />);

      const threePaneButton = screen.getByTestId('three-pane-button');
      expect(threePaneButton).toBeDisabled();
      expect(threePaneButton).toHaveAttribute('aria-disabled', 'true');
    });

    it('should disable 3-pane button with no languages', () => {
      render(<ModeToggle availableLanguages={[]} />);

      const threePaneButton = screen.getByTestId('three-pane-button');
      expect(threePaneButton).toBeDisabled();
    });

    it('should show helper text when 3-pane unavailable', () => {
      render(<ModeToggle availableLanguages={['en-US']} />);

      expect(screen.getByText(/2 language versions required for 3-pane/i)).toBeInTheDocument();
    });

    it('should not show helper text when 3-pane available', () => {
      render(<ModeToggle availableLanguages={['en-US', 'es-ES']} />);

      expect(screen.queryByText(/2 language versions required for 3-pane/i)).not.toBeInTheDocument();
    });

    it('should not call setPaneMode when clicking disabled 3-pane button', () => {
      render(<ModeToggle availableLanguages={['en-US']} />);

      const threePaneButton = screen.getByTestId('three-pane-button');
      fireEvent.click(threePaneButton);

      expect(mockSetPaneMode).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have role="group" with aria-label', () => {
      const { container } = render(<ModeToggle availableLanguages={['en-US', 'es-ES']} />);

      const group = container.querySelector('[role="group"]');
      expect(group).toBeInTheDocument();
      expect(group).toHaveAttribute('aria-label', 'View mode selector');
    });

    it('should have descriptive aria-labels on buttons', () => {
      render(<ModeToggle availableLanguages={['en-US', 'es-ES']} />);

      expect(screen.getByLabelText('Two pane mode')).toBeInTheDocument();
      expect(screen.getByLabelText('Three pane mode')).toBeInTheDocument();
    });

    it('should have aria-pressed attributes', () => {
      render(<ModeToggle availableLanguages={['en-US', 'es-ES']} />);

      const twoPaneButton = screen.getByTestId('two-pane-button');
      const threePaneButton = screen.getByTestId('three-pane-button');

      expect(twoPaneButton).toHaveAttribute('aria-pressed');
      expect(threePaneButton).toHaveAttribute('aria-pressed');
    });

    it('should have aria-live region for helper text', () => {
      const { container } = render(<ModeToggle availableLanguages={['en-US']} />);

      const helperText = container.querySelector('[aria-live="polite"]');
      expect(helperText).toBeInTheDocument();
      expect(helperText).toHaveTextContent('2 language versions required for 3-pane');
    });

    it('should have descriptive title on 3-pane button when enabled', () => {
      render(<ModeToggle availableLanguages={['en-US', 'es-ES']} />);

      const threePaneButton = screen.getByTestId('three-pane-button');
      expect(threePaneButton).toHaveAttribute('title', 'View PDF with two language versions side-by-side');
    });

    it('should have descriptive title on 3-pane button when disabled', () => {
      render(<ModeToggle availableLanguages={['en-US']} />);

      const threePaneButton = screen.getByTestId('three-pane-button');
      expect(threePaneButton).toHaveAttribute('title', 'Requires at least 2 language versions');
    });
  });

  describe('Custom className', () => {
    it('should accept and apply custom className', () => {
      const { container } = render(
        <ModeToggle availableLanguages={['en-US', 'es-ES']} className="custom-class" />
      );

      const group = container.querySelector('[role="group"]');
      expect(group).toHaveClass('custom-class');
    });

    it('should maintain base classes with custom className', () => {
      const { container } = render(
        <ModeToggle availableLanguages={['en-US', 'es-ES']} className="custom-class" />
      );

      const group = container.querySelector('[role="group"]');
      expect(group).toHaveClass('flex');
      expect(group).toHaveClass('items-center');
      expect(group).toHaveClass('gap-2');
      expect(group).toHaveClass('custom-class');
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined availableLanguages prop', () => {
      render(<ModeToggle />);

      const threePaneButton = screen.getByTestId('three-pane-button');
      expect(threePaneButton).toBeDisabled();
    });

    it('should allow switching back to two-pane from three-pane', () => {
      (useViewerStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        paneMode: 'three-pane',
        setPaneMode: mockSetPaneMode,
      });

      render(<ModeToggle availableLanguages={['en-US', 'es-ES']} />);

      const twoPaneButton = screen.getByTestId('two-pane-button');
      fireEvent.click(twoPaneButton);

      expect(mockSetPaneMode).toHaveBeenCalledWith('two-pane');
    });

    it('should not switch to three-pane if already in three-pane mode', () => {
      (useViewerStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        paneMode: 'three-pane',
        setPaneMode: mockSetPaneMode,
      });

      render(<ModeToggle availableLanguages={['en-US', 'es-ES']} />);

      const threePaneButton = screen.getByTestId('three-pane-button');
      fireEvent.click(threePaneButton);

      // Should still call setPaneMode (idempotent operation)
      expect(mockSetPaneMode).toHaveBeenCalledWith('three-pane');
    });
  });
});
