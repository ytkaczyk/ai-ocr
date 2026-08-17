import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { Pager } from '@/components/viewer/Pager';

/**
 * Unit tests for Pager component
 * Tests FR-003: Pager control with next/previous/jump navigation
 * Tests FR-012: Page number and total page count display
 * Tests FR-013: Navigation bounds (prevent negative/beyond-length navigation)
 * Tests FR-015: Keyboard shortcuts (arrow keys, page up/down)
 * Tests FR-024a: Debounced navigation (100ms)
 */

describe('Pager', () => {
  let mockOnPageChange: Mock<(page: number) => void>;

  beforeEach(() => {
    mockOnPageChange = vi.fn();
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] });
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('Rendering (FR-012)', () => {
    it('should render all navigation buttons', () => {
      render(<Pager currentPage={5} totalPages={10} onPageChange={mockOnPageChange} />);

      expect(screen.getByLabelText(/go to first page/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/go to previous page/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/go to next page/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/go to last page/i)).toBeInTheDocument();
    });

    it('should display current page and total pages', () => {
      render(<Pager currentPage={5} totalPages={10} onPageChange={mockOnPageChange} />);

      expect(screen.getByDisplayValue('5')).toBeInTheDocument();
      expect(screen.getByLabelText('Page 5 of 10')).toBeInTheDocument();
    });

    it('should render keyboard shortcuts hint', () => {
      render(<Pager currentPage={5} totalPages={10} onPageChange={mockOnPageChange} />);

      expect(screen.getByText(/use.*page up\/down/i)).toBeInTheDocument();
    });

    it('should have proper ARIA labels', () => {
      render(<Pager currentPage={5} totalPages={10} onPageChange={mockOnPageChange} />);

      const nav = screen.getByRole('navigation', { name: /page navigation/i });
      expect(nav).toBeInTheDocument();

      const jumpInput = screen.getByLabelText(/jump to page/i);
      expect(jumpInput).toBeInTheDocument();
    });
  });

  describe('Button Navigation (FR-003)', () => {
    it('should navigate to next page when next button is clicked', () => {
      render(<Pager currentPage={5} totalPages={10} onPageChange={mockOnPageChange} />);

      const nextButton = screen.getByLabelText(/go to next page/i);
      fireEvent.click(nextButton);

      act(() => {
        vi.advanceTimersByTime(100); // Wait for debounce
      });

      expect(mockOnPageChange).toHaveBeenCalledWith(6);
    });

    it('should navigate to previous page when previous button is clicked', () => {
      render(<Pager currentPage={5} totalPages={10} onPageChange={mockOnPageChange} />);

      const prevButton = screen.getByLabelText(/go to previous page/i);
      fireEvent.click(prevButton);

      act(() => {
        vi.advanceTimersByTime(100); // Wait for debounce
      });

      expect(mockOnPageChange).toHaveBeenCalledWith(4);
    });

    it('should navigate to first page when first button is clicked', () => {
      render(<Pager currentPage={5} totalPages={10} onPageChange={mockOnPageChange} />);

      const firstButton = screen.getByLabelText(/go to first page/i);
      fireEvent.click(firstButton);

      act(() => {
        vi.advanceTimersByTime(100); // Wait for debounce
      });

      expect(mockOnPageChange).toHaveBeenCalledWith(1);
    });

    it('should navigate to last page when last button is clicked', () => {
      render(<Pager currentPage={5} totalPages={10} onPageChange={mockOnPageChange} />);

      const lastButton = screen.getByLabelText(/go to last page/i);
      fireEvent.click(lastButton);

      act(() => {
        vi.advanceTimersByTime(100); // Wait for debounce
      });

      expect(mockOnPageChange).toHaveBeenCalledWith(10);
    });
  });

  describe('Boundary Checks (FR-013)', () => {
    it('should disable first and previous buttons on first page', () => {
      render(<Pager currentPage={1} totalPages={10} onPageChange={mockOnPageChange} />);

      expect(screen.getByLabelText(/go to first page/i)).toBeDisabled();
      expect(screen.getByLabelText(/go to previous page/i)).toBeDisabled();
      expect(screen.getByLabelText(/go to next page/i)).not.toBeDisabled();
      expect(screen.getByLabelText(/go to last page/i)).not.toBeDisabled();
    });

    it('should disable next and last buttons on last page', () => {
      render(<Pager currentPage={10} totalPages={10} onPageChange={mockOnPageChange} />);

      expect(screen.getByLabelText(/go to first page/i)).not.toBeDisabled();
      expect(screen.getByLabelText(/go to previous page/i)).not.toBeDisabled();
      expect(screen.getByLabelText(/go to next page/i)).toBeDisabled();
      expect(screen.getByLabelText(/go to last page/i)).toBeDisabled();
    });

    it('should not call onPageChange when clicking disabled buttons', () => {
      render(<Pager currentPage={1} totalPages={10} onPageChange={mockOnPageChange} />);

      const prevButton = screen.getByLabelText(/go to previous page/i);
      fireEvent.click(prevButton);

      vi.advanceTimersByTime(100);

      expect(mockOnPageChange).not.toHaveBeenCalled();
    });

    it('should disable all buttons when disabled prop is true', () => {
      render(<Pager currentPage={5} totalPages={10} onPageChange={mockOnPageChange} disabled={true} />);

      expect(screen.getByLabelText(/go to first page/i)).toBeDisabled();
      expect(screen.getByLabelText(/go to previous page/i)).toBeDisabled();
      expect(screen.getByLabelText(/go to next page/i)).toBeDisabled();
      expect(screen.getByLabelText(/go to last page/i)).toBeDisabled();
      expect(screen.getByLabelText(/jump to page/i)).toBeDisabled();
    });
  });

  describe('Jump to Page (FR-003)', () => {
    it('should jump to page when valid number is entered and Enter is pressed', () => {
      render(<Pager currentPage={5} totalPages={10} onPageChange={mockOnPageChange} />);

      const input = screen.getByLabelText(/jump to page/i) as HTMLInputElement;
      fireEvent.change(input, { target: { value: '7' } });
      fireEvent.keyDown(input, { key: 'Enter' });

      act(() => {
        vi.advanceTimersByTime(100); // Wait for debounce
      });

      expect(mockOnPageChange).toHaveBeenCalledWith(7);
    });

    it('should jump to page when valid number is entered and input loses focus', () => {
      render(<Pager currentPage={5} totalPages={10} onPageChange={mockOnPageChange} />);

      const input = screen.getByLabelText(/jump to page/i) as HTMLInputElement;
      fireEvent.change(input, { target: { value: '3' } });
      fireEvent.blur(input);

      act(() => {
        vi.advanceTimersByTime(100); // Wait for debounce
      });

      expect(mockOnPageChange).toHaveBeenCalledWith(3);
    });

    it('should reset to current page when invalid page number is entered', () => {
      render(<Pager currentPage={5} totalPages={10} onPageChange={mockOnPageChange} />);

      const input = screen.getByLabelText(/jump to page/i) as HTMLInputElement;

      fireEvent.change(input, { target: { value: '15' } });
      fireEvent.blur(input);

      expect(input.value).toBe('5');
      expect(mockOnPageChange).not.toHaveBeenCalled();
    });

    it('should reset to current page when negative number is entered', () => {
      render(<Pager currentPage={5} totalPages={10} onPageChange={mockOnPageChange} />);

      const input = screen.getByLabelText(/jump to page/i) as HTMLInputElement;

      fireEvent.change(input, { target: { value: '-1' } });
      fireEvent.blur(input);

      expect(input.value).toBe('5');
      expect(mockOnPageChange).not.toHaveBeenCalled();
    });

    it('should reset to current page when non-numeric value is entered', () => {
      render(<Pager currentPage={5} totalPages={10} onPageChange={mockOnPageChange} />);

      const input = screen.getByLabelText(/jump to page/i) as HTMLInputElement;

      fireEvent.change(input, { target: { value: 'abc' } });
      fireEvent.blur(input);

      expect(input.value).toBe('5');
      expect(mockOnPageChange).not.toHaveBeenCalled();
    });

    it('should not call onPageChange when jumping to current page', () => {
      render(<Pager currentPage={5} totalPages={10} onPageChange={mockOnPageChange} />);

      const input = screen.getByLabelText(/jump to page/i) as HTMLInputElement;
      fireEvent.change(input, { target: { value: '5' } });
      fireEvent.blur(input);

      vi.advanceTimersByTime(100);

      expect(mockOnPageChange).not.toHaveBeenCalled();
    });
  });

  describe('Keyboard Shortcuts (FR-015)', () => {
    it('should navigate to next page when ArrowRight is pressed', () => {
      render(<Pager currentPage={5} totalPages={10} onPageChange={mockOnPageChange} />);

      fireEvent.keyDown(window, { key: 'ArrowRight' });

      act(() => {
        vi.advanceTimersByTime(100);
      });

      expect(mockOnPageChange).toHaveBeenCalledWith(6);
    });

    it('should navigate to previous page when ArrowLeft is pressed', () => {
      render(<Pager currentPage={5} totalPages={10} onPageChange={mockOnPageChange} />);

      fireEvent.keyDown(window, { key: 'ArrowLeft' });

      act(() => {
        vi.advanceTimersByTime(100);
      });

      expect(mockOnPageChange).toHaveBeenCalledWith(4);
    });

    it('should navigate to next page when PageDown is pressed', () => {
      render(<Pager currentPage={5} totalPages={10} onPageChange={mockOnPageChange} />);

      fireEvent.keyDown(window, { key: 'PageDown' });

      act(() => {
        vi.advanceTimersByTime(100);
      });

      expect(mockOnPageChange).toHaveBeenCalledWith(6);
    });

    it('should navigate to previous page when PageUp is pressed', () => {
      render(<Pager currentPage={5} totalPages={10} onPageChange={mockOnPageChange} />);

      fireEvent.keyDown(window, { key: 'PageUp' });

      act(() => {
        vi.advanceTimersByTime(100);
      });

      expect(mockOnPageChange).toHaveBeenCalledWith(4);
    });

    it('should navigate to first page when Ctrl+Home is pressed', () => {
      render(<Pager currentPage={5} totalPages={10} onPageChange={mockOnPageChange} />);

      fireEvent.keyDown(window, { key: 'Home', ctrlKey: true });

      act(() => {
        vi.advanceTimersByTime(100);
      });

      expect(mockOnPageChange).toHaveBeenCalledWith(1);
    });

    it('should navigate to last page when Ctrl+End is pressed', () => {
      render(<Pager currentPage={5} totalPages={10} onPageChange={mockOnPageChange} />);

      fireEvent.keyDown(window, { key: 'End', ctrlKey: true });

      act(() => {
        vi.advanceTimersByTime(100);
      });

      expect(mockOnPageChange).toHaveBeenCalledWith(10);
    });

    it('should not trigger navigation when typing in input field', () => {
      render(<Pager currentPage={5} totalPages={10} onPageChange={mockOnPageChange} />);

      const input = screen.getByLabelText(/jump to page/i);
      input.focus();

      fireEvent.keyDown(input, { key: 'ArrowRight' });
      vi.advanceTimersByTime(100);

      expect(mockOnPageChange).not.toHaveBeenCalled();
    });
  });

  describe('Throttling (FR-024a)', () => {
    it('should throttle rapid button clicks', () => {
      render(<Pager currentPage={1} totalPages={10} onPageChange={mockOnPageChange} />);

      const nextButton = screen.getByLabelText(/go to next page/i);

      // First click at t=0 should execute immediately with throttle
      fireEvent.click(nextButton);
      expect(mockOnPageChange).toHaveBeenCalledTimes(1);
      expect(mockOnPageChange).toHaveBeenCalledWith(2);

      mockOnPageChange.mockClear();

      // Advance time but stay within throttle window
      act(() => vi.advanceTimersByTime(30)); // t=30ms

      // Second click at t=30ms (30ms < 100ms throttle window)
      // This schedules a trailing call for (100-30) = 70ms later (at t=100ms)
      fireEvent.click(nextButton);
      expect(mockOnPageChange).not.toHaveBeenCalled(); // Not called yet

      // Third click at t=60ms (still within window, updates trailing call)
      act(() => vi.advanceTimersByTime(30)); // t=60ms
      fireEvent.click(nextButton);
      expect(mockOnPageChange).not.toHaveBeenCalled(); // Still not called

      // Advance to trigger the scheduled trailing call
      act(() => {
        vi.advanceTimersByTime(40); // t=100ms, trailing call executes
      });

      // Trailing call should have executed
      expect(mockOnPageChange).toHaveBeenCalledTimes(1);
      expect(mockOnPageChange).toHaveBeenCalledWith(2);
    });

    it('should throttle rapid keyboard shortcuts', () => {
      render(<Pager currentPage={1} totalPages={10} onPageChange={mockOnPageChange} />);

      // First key press at t=0 should execute immediately with throttle
      fireEvent.keyDown(window, { key: 'ArrowRight' });
      expect(mockOnPageChange).toHaveBeenCalledTimes(1);
      expect(mockOnPageChange).toHaveBeenCalledWith(2);

      mockOnPageChange.mockClear();

      // Advance time but stay within throttle window
      act(() => vi.advanceTimersByTime(30)); // t=30ms

      // Second key press at t=30ms (30ms < 100ms throttle window)
      // This schedules a trailing call for (100-30) = 70ms later (at t=100ms)
      fireEvent.keyDown(window, { key: 'ArrowRight' });
      expect(mockOnPageChange).not.toHaveBeenCalled(); // Not called yet

      // Third key press at t=60ms (still within window, updates trailing call)
      act(() => vi.advanceTimersByTime(30)); // t=60ms
      fireEvent.keyDown(window, { key: 'ArrowRight' });
      expect(mockOnPageChange).not.toHaveBeenCalled(); // Still not called

      // Advance to trigger the scheduled trailing call
      act(() => {
        vi.advanceTimersByTime(40); // t=100ms, trailing call executes
      });

      // Trailing call should have executed
      expect(mockOnPageChange).toHaveBeenCalledTimes(1);
      expect(mockOnPageChange).toHaveBeenCalledWith(2);
    });
  });

  describe('State Updates', () => {
    it('should update jump input value when currentPage prop changes', () => {
      const { rerender } = render(<Pager currentPage={5} totalPages={10} onPageChange={mockOnPageChange} />);

      const input = screen.getByLabelText(/jump to page/i) as HTMLInputElement;
      expect(input.value).toBe('5');

      rerender(<Pager currentPage={7} totalPages={10} onPageChange={mockOnPageChange} />);
      expect(input.value).toBe('7');
    });

    it('should update disabled states when currentPage changes to boundary', () => {
      const { rerender } = render(<Pager currentPage={5} totalPages={10} onPageChange={mockOnPageChange} />);

      expect(screen.getByLabelText(/go to previous page/i)).not.toBeDisabled();

      rerender(<Pager currentPage={1} totalPages={10} onPageChange={mockOnPageChange} />);
      expect(screen.getByLabelText(/go to previous page/i)).toBeDisabled();
    });
  });
});
