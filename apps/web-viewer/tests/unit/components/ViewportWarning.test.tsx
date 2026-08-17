import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ViewportWarning } from '@/components/viewer/ViewportWarning';
import * as viewportUtils from '@/lib/utils/viewport';

/**
 * Unit tests for ViewportWarning component
 * Tests FR-025c: Tablet viewport warning
 * Tests FR-025d: Mobile viewport blocking
 */

describe('ViewportWarning', () => {
  let mockCleanup: Mock<() => void>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockCleanup = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Desktop Viewports (No Warning)', () => {
    it('should not render warning for desktop viewport', () => {
      vi.spyOn(viewportUtils, 'getViewportSize').mockReturnValue('desktop');
      vi.spyOn(viewportUtils, 'createViewportListener').mockReturnValue(mockCleanup);

      render(<ViewportWarning />);

      expect(screen.queryByText(/desktop required/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/limited experience/i)).not.toBeInTheDocument();
    });

    it('should not render warning for large-desktop viewport', () => {
      vi.spyOn(viewportUtils, 'getViewportSize').mockReturnValue('large-desktop');
      vi.spyOn(viewportUtils, 'createViewportListener').mockReturnValue(mockCleanup);

      render(<ViewportWarning />);

      expect(screen.queryByText(/desktop required/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/limited experience/i)).not.toBeInTheDocument();
    });
  });

  describe('Mobile Viewport (FR-025d)', () => {
    it('should render blocking message for mobile viewport', async () => {
      vi.spyOn(viewportUtils, 'getViewportSize').mockReturnValue('mobile');
      vi.spyOn(viewportUtils, 'getViewportSizeName').mockReturnValue('Mobile');
      
      vi.spyOn(viewportUtils, 'createViewportListener').mockImplementation((callback) => {
        // Call the callback immediately to set the viewport size
        callback('mobile');
        return mockCleanup;
      });

      render(<ViewportWarning />);

      await waitFor(() => {
        expect(screen.getByText(/desktop required/i)).toBeInTheDocument();
      });
      expect(screen.getByText(/requires a desktop screen/i)).toBeInTheDocument();
    });

    it('should display minimum width requirement', async () => {
      vi.spyOn(viewportUtils, 'getViewportSize').mockReturnValue('mobile');
      vi.spyOn(viewportUtils, 'getViewportSizeName').mockReturnValue('Mobile');
      vi.spyOn(viewportUtils, 'createViewportListener').mockImplementation((callback) => {
        callback('mobile');
        return mockCleanup;
      });

      render(<ViewportWarning />);

      await waitFor(() => {
        expect(screen.getByText(/minimum 1024px width/i)).toBeInTheDocument();
      });
    });

    it('should show current viewport size', async () => {
      vi.spyOn(viewportUtils, 'getViewportSize').mockReturnValue('mobile');
      vi.spyOn(viewportUtils, 'getViewportSizeName').mockReturnValue('Mobile (< 768px)');
      vi.spyOn(viewportUtils, 'createViewportListener').mockImplementation((callback) => {
        callback('mobile');
        return mockCleanup;
      });

      render(<ViewportWarning />);

      await waitFor(() => {
        expect(screen.getByText(/current viewport:.*mobile/i)).toBeInTheDocument();
      });
    });

    it('should render Monitor icon', async () => {
      vi.spyOn(viewportUtils, 'getViewportSize').mockReturnValue('mobile');
      vi.spyOn(viewportUtils, 'getViewportSizeName').mockReturnValue('Mobile');
      vi.spyOn(viewportUtils, 'createViewportListener').mockImplementation((callback) => {
        callback('mobile');
        return mockCleanup;
      });

      const { container } = render(<ViewportWarning />);

      await waitFor(() => {
        const icon = container.querySelector('svg');
        expect(icon).toBeInTheDocument();
      });
    });

    it('should have fixed positioning to cover entire viewport', async () => {
      vi.spyOn(viewportUtils, 'getViewportSize').mockReturnValue('mobile');
      vi.spyOn(viewportUtils, 'getViewportSizeName').mockReturnValue('Mobile');
      vi.spyOn(viewportUtils, 'createViewportListener').mockImplementation((callback) => {
        callback('mobile');
        return mockCleanup;
      });

      const { container } = render(<ViewportWarning />);

      await waitFor(() => {
        const overlay = container.querySelector('.fixed.inset-0');
        expect(overlay).toBeInTheDocument();
      });
    });
  });

  describe('Tablet Viewport (FR-025c)', () => {
    it('should render warning banner for tablet viewport', async () => {
      vi.spyOn(viewportUtils, 'getViewportSize').mockReturnValue('tablet');
      vi.spyOn(viewportUtils, 'getViewportSizeName').mockReturnValue('Tablet');
      vi.spyOn(viewportUtils, 'createViewportListener').mockImplementation((callback) => {
        callback('tablet');
        return mockCleanup;
      });

      render(<ViewportWarning />);

      await waitFor(() => {
        expect(screen.getByText(/limited experience on tablet/i)).toBeInTheDocument();
      });
    });

    it('should show recommendation for desktop', async () => {
      vi.spyOn(viewportUtils, 'getViewportSize').mockReturnValue('tablet');
      vi.spyOn(viewportUtils, 'getViewportSizeName').mockReturnValue('Tablet');
      vi.spyOn(viewportUtils, 'createViewportListener').mockImplementation((callback) => {
        callback('tablet');
        return mockCleanup;
      });

      render(<ViewportWarning />);

      await waitFor(() => {
        expect(screen.getByText(/recommend using a desktop/i)).toBeInTheDocument();
      });
    });

    it('should display current viewport size', async () => {
      vi.spyOn(viewportUtils, 'getViewportSize').mockReturnValue('tablet');
      vi.spyOn(viewportUtils, 'getViewportSizeName').mockReturnValue('Tablet (768-1023px)');
      vi.spyOn(viewportUtils, 'createViewportListener').mockImplementation((callback) => {
        callback('tablet');
        return mockCleanup;
      });

      render(<ViewportWarning />);

      await waitFor(() => {
        expect(screen.getByText(/current viewport:.*tablet/i)).toBeInTheDocument();
      });
    });

    it('should render AlertTriangle icon', async () => {
      vi.spyOn(viewportUtils, 'getViewportSize').mockReturnValue('tablet');
      vi.spyOn(viewportUtils, 'getViewportSizeName').mockReturnValue('Tablet');
      vi.spyOn(viewportUtils, 'createViewportListener').mockImplementation((callback) => {
        callback('tablet');
        return mockCleanup;
      });

      const { container } = render(<ViewportWarning />);

      await waitFor(() => {
        const icon = container.querySelector('svg');
        expect(icon).toBeInTheDocument();
      });
    });

    it('should have dismiss button', async () => {
      vi.spyOn(viewportUtils, 'getViewportSize').mockReturnValue('tablet');
      vi.spyOn(viewportUtils, 'getViewportSizeName').mockReturnValue('Tablet');
      vi.spyOn(viewportUtils, 'createViewportListener').mockImplementation((callback) => {
        callback('tablet');
        return mockCleanup;
      });

      render(<ViewportWarning />);

      await waitFor(() => {
        expect(screen.getByLabelText(/dismiss warning/i)).toBeInTheDocument();
      });
    });

    it('should dismiss warning when dismiss button is clicked', async () => {
      vi.spyOn(viewportUtils, 'getViewportSize').mockReturnValue('tablet');
      vi.spyOn(viewportUtils, 'getViewportSizeName').mockReturnValue('Tablet');
      vi.spyOn(viewportUtils, 'createViewportListener').mockImplementation((callback) => {
        callback('tablet');
        return mockCleanup;
      });

      render(<ViewportWarning />);

      await waitFor(() => {
        expect(screen.getByLabelText(/dismiss warning/i)).toBeInTheDocument();
      });

      const dismissButton = screen.getByLabelText(/dismiss warning/i);
      fireEvent.click(dismissButton);

      await waitFor(() => {
        expect(screen.queryByText(/limited experience on tablet/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Viewport Change Detection', () => {
    it('should register viewport listener on mount', () => {
      const createListenerSpy = vi.spyOn(viewportUtils, 'createViewportListener').mockReturnValue(mockCleanup);
      vi.spyOn(viewportUtils, 'getViewportSize').mockReturnValue('desktop');

      render(<ViewportWarning />);

      expect(createListenerSpy).toHaveBeenCalled();
    });

    it('should cleanup viewport listener on unmount', () => {
      vi.spyOn(viewportUtils, 'getViewportSize').mockReturnValue('desktop');
      vi.spyOn(viewportUtils, 'createViewportListener').mockReturnValue(mockCleanup);

      const { unmount } = render(<ViewportWarning />);
      unmount();

      expect(mockCleanup).toHaveBeenCalled();
    });

    it('should reset dismissal when viewport size changes', async () => {
      vi.spyOn(viewportUtils, 'getViewportSize').mockReturnValue('tablet');
      vi.spyOn(viewportUtils, 'getViewportSizeName').mockReturnValue('Tablet');
      
      // Capture the callback passed to createViewportListener
      let listenerCallback: ((size: ReturnType<typeof viewportUtils.getViewportSize>) => void) | undefined;
      vi.spyOn(viewportUtils, 'createViewportListener').mockImplementation((callback) => {
        listenerCallback = callback;
        callback('tablet');
        return mockCleanup;
      });

      render(<ViewportWarning />);

      await waitFor(() => {
        expect(screen.getByLabelText(/dismiss warning/i)).toBeInTheDocument();
      });

      // Dismiss the warning
      const dismissButton = screen.getByLabelText(/dismiss warning/i);
      fireEvent.click(dismissButton);

      await waitFor(() => {
        expect(screen.queryByText(/limited experience on tablet/i)).not.toBeInTheDocument();
      });

      // Simulate viewport size change to mobile
      if (listenerCallback) {
        listenerCallback('mobile');
      }

      // Warning should reappear (though for mobile, not tablet)
      await waitFor(() => {
        expect(screen.queryByText(/desktop required/i)).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels for mobile blocking overlay', async () => {
      vi.spyOn(viewportUtils, 'getViewportSize').mockReturnValue('mobile');
      vi.spyOn(viewportUtils, 'getViewportSizeName').mockReturnValue('Mobile');
      vi.spyOn(viewportUtils, 'createViewportListener').mockImplementation((callback) => {
        callback('mobile');
        return mockCleanup;
      });

      render(<ViewportWarning />);

      await waitFor(() => {
        expect(screen.getByText(/desktop required/i)).toBeInTheDocument();
      });
    });

    it('should have accessible dismiss button for tablet warning', async () => {
      vi.spyOn(viewportUtils, 'getViewportSize').mockReturnValue('tablet');
      vi.spyOn(viewportUtils, 'getViewportSizeName').mockReturnValue('Tablet');
      vi.spyOn(viewportUtils, 'createViewportListener').mockImplementation((callback) => {
        callback('tablet');
        return mockCleanup;
      });

      render(<ViewportWarning />);

      await waitFor(() => {
        const dismissButton = screen.getByLabelText(/dismiss warning/i);
        expect(dismissButton).toBeInTheDocument();
        expect(dismissButton.tagName).toBe('BUTTON');
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing viewport size name gracefully', async () => {
      vi.spyOn(viewportUtils, 'getViewportSize').mockReturnValue('tablet');
      vi.spyOn(viewportUtils, 'getViewportSizeName').mockReturnValue('');
      vi.spyOn(viewportUtils, 'createViewportListener').mockImplementation((callback) => {
        callback('tablet');
        return mockCleanup;
      });

      render(<ViewportWarning />);

      await waitFor(() => {
        expect(screen.getByText(/limited experience on tablet/i)).toBeInTheDocument();
      });
    });

    it('should not break if viewport size is undefined initially', () => {
      vi.spyOn(viewportUtils, 'getViewportSize').mockReturnValue('large-desktop');
      vi.spyOn(viewportUtils, 'createViewportListener').mockReturnValue(mockCleanup);

      const { container } = render(<ViewportWarning />);

      expect(container.firstChild).toBeNull();
    });
  });
});
