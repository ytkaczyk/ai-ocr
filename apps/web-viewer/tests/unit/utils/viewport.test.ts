import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  getViewportWidth,
  getViewportHeight,
  getViewportSize,
  meetsBreakpoint,
  isDesktop,
  isTablet,
  isMobile,
  createViewportListener,
  getViewportSizeName,
  BREAKPOINTS,
} from '@/lib/utils/viewport';

// Mock window dimensions
function mockWindowSize(width: number, height: number) {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  });
  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: height,
  });
}

describe('viewport utility', () => {
  beforeEach(() => {
    // Reset to default desktop size before each test
    mockWindowSize(1920, 1080);
  });

  describe('BREAKPOINTS constants', () => {
    it('defines correct breakpoint values', () => {
      expect(BREAKPOINTS.TABLET).toBe(768);
      expect(BREAKPOINTS.DESKTOP).toBe(1024);
      expect(BREAKPOINTS.LARGE).toBe(1440);
    });

    it('breakpoints are in ascending order', () => {
      expect(BREAKPOINTS.TABLET).toBeLessThan(BREAKPOINTS.DESKTOP);
      expect(BREAKPOINTS.DESKTOP).toBeLessThan(BREAKPOINTS.LARGE);
    });
  });

  describe('getViewportWidth', () => {
    it('returns current window width', () => {
      mockWindowSize(1024, 768);
      expect(getViewportWidth()).toBe(1024);
    });

    it('returns different widths when window is resized', () => {
      mockWindowSize(768, 600);
      expect(getViewportWidth()).toBe(768);

      mockWindowSize(1440, 900);
      expect(getViewportWidth()).toBe(1440);
    });

    it('handles very small widths', () => {
      mockWindowSize(320, 568);
      expect(getViewportWidth()).toBe(320);
    });

    it('handles very large widths', () => {
      mockWindowSize(3840, 2160);
      expect(getViewportWidth()).toBe(3840);
    });

    it('returns 1920 for SSR when window is undefined', () => {
      vi.stubGlobal('window', undefined);
      expect(getViewportWidth()).toBe(1920);
      vi.unstubAllGlobals();
    });
  });

  describe('getViewportHeight', () => {
    it('returns current window height', () => {
      mockWindowSize(1024, 768);
      expect(getViewportHeight()).toBe(768);
    });

    it('returns different heights when window is resized', () => {
      mockWindowSize(1920, 1080);
      expect(getViewportHeight()).toBe(1080);

      mockWindowSize(1920, 900);
      expect(getViewportHeight()).toBe(900);
    });

    it('handles portrait orientation', () => {
      mockWindowSize(768, 1024);
      expect(getViewportHeight()).toBe(1024);
    });

    it('returns 1080 for SSR when window is undefined', () => {
      vi.stubGlobal('window', undefined);
      expect(getViewportHeight()).toBe(1080);
      vi.unstubAllGlobals();
    });
  });

  describe('getViewportSize', () => {
    describe('Mobile (<768px)', () => {
      it('returns "mobile" for width 767px', () => {
        mockWindowSize(767, 600);
        expect(getViewportSize()).toBe('mobile');
      });

      it('returns "mobile" for width 375px (iPhone)', () => {
        mockWindowSize(375, 667);
        expect(getViewportSize()).toBe('mobile');
      });

      it('returns "mobile" for width 320px (small phone)', () => {
        mockWindowSize(320, 568);
        expect(getViewportSize()).toBe('mobile');
      });

      it('accepts custom width parameter', () => {
        mockWindowSize(1920, 1080); // Current window is large
        expect(getViewportSize(600)).toBe('mobile'); // But we're checking mobile size
      });
    });

    describe('Tablet (768px-1023px)', () => {
      it('returns "tablet" for width 768px (boundary)', () => {
        mockWindowSize(768, 1024);
        expect(getViewportSize()).toBe('tablet');
      });

      it('returns "tablet" for width 900px', () => {
        mockWindowSize(900, 600);
        expect(getViewportSize()).toBe('tablet');
      });

      it('returns "tablet" for width 1023px (upper boundary)', () => {
        mockWindowSize(1023, 600);
        expect(getViewportSize()).toBe('tablet');
      });

      it('accepts custom width parameter', () => {
        mockWindowSize(1920, 1080);
        expect(getViewportSize(800)).toBe('tablet');
      });
    });

    describe('Desktop (1024px-1439px)', () => {
      it('returns "desktop" for width 1024px (boundary)', () => {
        mockWindowSize(1024, 768);
        expect(getViewportSize()).toBe('desktop');
      });

      it('returns "desktop" for width 1280px', () => {
        mockWindowSize(1280, 720);
        expect(getViewportSize()).toBe('desktop');
      });

      it('returns "desktop" for width 1439px (upper boundary)', () => {
        mockWindowSize(1439, 900);
        expect(getViewportSize()).toBe('desktop');
      });

      it('accepts custom width parameter', () => {
        mockWindowSize(768, 600);
        expect(getViewportSize(1280)).toBe('desktop');
      });
    });

    describe('Large Desktop (≥1440px)', () => {
      it('returns "large-desktop" for width 1440px (boundary)', () => {
        mockWindowSize(1440, 900);
        expect(getViewportSize()).toBe('large-desktop');
      });

      it('returns "large-desktop" for width 1920px', () => {
        mockWindowSize(1920, 1080);
        expect(getViewportSize()).toBe('large-desktop');
      });

      it('returns "large-desktop" for width 2560px (QHD)', () => {
        mockWindowSize(2560, 1440);
        expect(getViewportSize()).toBe('large-desktop');
      });

      it('returns "large-desktop" for width 3840px (4K)', () => {
        mockWindowSize(3840, 2160);
        expect(getViewportSize()).toBe('large-desktop');
      });

      it('accepts custom width parameter', () => {
        mockWindowSize(768, 600);
        expect(getViewportSize(2000)).toBe('large-desktop');
      });
    });
  });

  describe('meetsBreakpoint', () => {
    it('returns true when viewport width equals breakpoint', () => {
      mockWindowSize(1024, 768);
      expect(meetsBreakpoint(1024)).toBe(true);
    });

    it('returns true when viewport width exceeds breakpoint', () => {
      mockWindowSize(1920, 1080);
      expect(meetsBreakpoint(768)).toBe(true);
      expect(meetsBreakpoint(1024)).toBe(true);
      expect(meetsBreakpoint(1440)).toBe(true);
    });

    it('returns false when viewport width is below breakpoint', () => {
      mockWindowSize(767, 600);
      expect(meetsBreakpoint(768)).toBe(false);
    });

    it('works with tablet breakpoint', () => {
      mockWindowSize(800, 600);
      expect(meetsBreakpoint(BREAKPOINTS.TABLET)).toBe(true);
      expect(meetsBreakpoint(BREAKPOINTS.DESKTOP)).toBe(false);
    });

    it('works with desktop breakpoint', () => {
      mockWindowSize(1200, 800);
      expect(meetsBreakpoint(BREAKPOINTS.TABLET)).toBe(true);
      expect(meetsBreakpoint(BREAKPOINTS.DESKTOP)).toBe(true);
      expect(meetsBreakpoint(BREAKPOINTS.LARGE)).toBe(false);
    });

    it('works with large desktop breakpoint', () => {
      mockWindowSize(1920, 1080);
      expect(meetsBreakpoint(BREAKPOINTS.LARGE)).toBe(true);
    });
  });

  describe('isDesktop', () => {
    it('returns true for desktop width (1024px)', () => {
      mockWindowSize(1024, 768);
      expect(isDesktop()).toBe(true);
    });

    it('returns true for large desktop width', () => {
      mockWindowSize(1920, 1080);
      expect(isDesktop()).toBe(true);
    });

    it('returns false for tablet width', () => {
      mockWindowSize(900, 600);
      expect(isDesktop()).toBe(false);
    });

    it('returns false for mobile width', () => {
      mockWindowSize(375, 667);
      expect(isDesktop()).toBe(false);
    });

    it('returns false for width just below desktop breakpoint', () => {
      mockWindowSize(1023, 768);
      expect(isDesktop()).toBe(false);
    });
  });

  describe('isTablet', () => {
    it('returns true for tablet width at lower boundary (768px)', () => {
      mockWindowSize(768, 1024);
      expect(isTablet()).toBe(true);
    });

    it('returns true for tablet width in middle of range', () => {
      mockWindowSize(900, 600);
      expect(isTablet()).toBe(true);
    });

    it('returns true for tablet width at upper boundary (1023px)', () => {
      mockWindowSize(1023, 768);
      expect(isTablet()).toBe(true);
    });

    it('returns false for mobile width', () => {
      mockWindowSize(767, 600);
      expect(isTablet()).toBe(false);
    });

    it('returns false for desktop width', () => {
      mockWindowSize(1024, 768);
      expect(isTablet()).toBe(false);
    });

    it('returns false for large desktop width', () => {
      mockWindowSize(1920, 1080);
      expect(isTablet()).toBe(false);
    });
  });

  describe('isMobile', () => {
    it('returns true for mobile width (375px)', () => {
      mockWindowSize(375, 667);
      expect(isMobile()).toBe(true);
    });

    it('returns true for small mobile width (320px)', () => {
      mockWindowSize(320, 568);
      expect(isMobile()).toBe(true);
    });

    it('returns true for width just below tablet breakpoint', () => {
      mockWindowSize(767, 600);
      expect(isMobile()).toBe(true);
    });

    it('returns false for tablet width', () => {
      mockWindowSize(768, 1024);
      expect(isMobile()).toBe(false);
    });

    it('returns false for desktop width', () => {
      mockWindowSize(1024, 768);
      expect(isMobile()).toBe(false);
    });

    it('returns false for large desktop width', () => {
      mockWindowSize(1920, 1080);
      expect(isMobile()).toBe(false);
    });
  });

  describe('createViewportListener', () => {
    let cleanupFn: (() => void) | null = null;

    afterEach(() => {
      if (cleanupFn) {
        cleanupFn();
        cleanupFn = null;
      }
    });

    it('calls callback when window is resized', () => {
      const callback = vi.fn();
      mockWindowSize(1920, 1080);

      cleanupFn = createViewportListener(callback);

      // Simulate resize
      mockWindowSize(768, 600);
      window.dispatchEvent(new Event('resize'));

      expect(callback).toHaveBeenCalledWith('tablet');
    });

    it('calls callback with correct viewport size', () => {
      const callback = vi.fn();
      mockWindowSize(1920, 1080);

      cleanupFn = createViewportListener(callback);

      // Resize to mobile
      mockWindowSize(375, 667);
      window.dispatchEvent(new Event('resize'));
      expect(callback).toHaveBeenCalledWith('mobile');

      // Resize to desktop
      mockWindowSize(1280, 720);
      window.dispatchEvent(new Event('resize'));
      expect(callback).toHaveBeenCalledWith('desktop');
    });

    it('calls callback multiple times on multiple resizes', () => {
      const callback = vi.fn();
      mockWindowSize(1920, 1080);

      cleanupFn = createViewportListener(callback);

      window.dispatchEvent(new Event('resize'));
      window.dispatchEvent(new Event('resize'));
      window.dispatchEvent(new Event('resize'));

      expect(callback).toHaveBeenCalledTimes(3);
    });

    it('returns cleanup function that removes event listener', () => {
      const callback = vi.fn();
      cleanupFn = createViewportListener(callback);

      // Cleanup
      cleanupFn();
      cleanupFn = null;

      // Resize after cleanup - callback should not be called
      window.dispatchEvent(new Event('resize'));
      expect(callback).not.toHaveBeenCalled();
    });

    it('cleanup function can be called multiple times safely', () => {
      const callback = vi.fn();
      cleanupFn = createViewportListener(callback);

      expect(() => {
        cleanupFn!();
        cleanupFn!();
        cleanupFn!();
      }).not.toThrow();

      cleanupFn = null;
    });

    it('returns no-op function for SSR when window is undefined', () => {
      vi.stubGlobal('window', undefined);
      const callback = vi.fn();
      
      cleanupFn = createViewportListener(callback);
      
      // Should not throw when called
      expect(() => cleanupFn!()).not.toThrow();
      
      // Callback should never be called
      expect(callback).not.toHaveBeenCalled();
      
      vi.unstubAllGlobals();
      cleanupFn = null;
    });
  });

  describe('getViewportSizeName', () => {
    it('returns "Mobile" for mobile size', () => {
      expect(getViewportSizeName('mobile')).toBe('Mobile');
    });

    it('returns "Tablet" for tablet size', () => {
      expect(getViewportSizeName('tablet')).toBe('Tablet');
    });

    it('returns "Desktop" for desktop size', () => {
      expect(getViewportSizeName('desktop')).toBe('Desktop');
    });

    it('returns "Large Desktop" for large-desktop size', () => {
      expect(getViewportSizeName('large-desktop')).toBe('Large Desktop');
    });
  });

  describe('FR-025: Responsive Layout Detection', () => {
    it('correctly identifies all viewport size categories', () => {
      // Mobile
      mockWindowSize(375, 667);
      expect(getViewportSize()).toBe('mobile');
      expect(isMobile()).toBe(true);
      expect(isTablet()).toBe(false);
      expect(isDesktop()).toBe(false);

      // Tablet
      mockWindowSize(768, 1024);
      expect(getViewportSize()).toBe('tablet');
      expect(isMobile()).toBe(false);
      expect(isTablet()).toBe(true);
      expect(isDesktop()).toBe(false);

      // Desktop
      mockWindowSize(1280, 720);
      expect(getViewportSize()).toBe('desktop');
      expect(isMobile()).toBe(false);
      expect(isTablet()).toBe(false);
      expect(isDesktop()).toBe(true);

      // Large Desktop
      mockWindowSize(1920, 1080);
      expect(getViewportSize()).toBe('large-desktop');
      expect(isMobile()).toBe(false);
      expect(isTablet()).toBe(false);
      expect(isDesktop()).toBe(true);
    });

    it('respects defined breakpoints', () => {
      // Just below tablet breakpoint
      mockWindowSize(767, 600);
      expect(meetsBreakpoint(BREAKPOINTS.TABLET)).toBe(false);

      // At tablet breakpoint
      mockWindowSize(768, 600);
      expect(meetsBreakpoint(BREAKPOINTS.TABLET)).toBe(true);

      // Just below desktop breakpoint
      mockWindowSize(1023, 768);
      expect(meetsBreakpoint(BREAKPOINTS.DESKTOP)).toBe(false);

      // At desktop breakpoint
      mockWindowSize(1024, 768);
      expect(meetsBreakpoint(BREAKPOINTS.DESKTOP)).toBe(true);

      // Just below large desktop breakpoint
      mockWindowSize(1439, 900);
      expect(meetsBreakpoint(BREAKPOINTS.LARGE)).toBe(false);

      // At large desktop breakpoint
      mockWindowSize(1440, 900);
      expect(meetsBreakpoint(BREAKPOINTS.LARGE)).toBe(true);
    });

    it('provides reactive viewport size detection', () => {
      const sizes: string[] = [];
      const callback = (size: string) => sizes.push(size);
      let cleanup: (() => void) | null = null;

      mockWindowSize(1920, 1080);
      cleanup = createViewportListener(callback);

      // Simulate user resizing from large desktop → tablet → mobile
      mockWindowSize(900, 600);
      window.dispatchEvent(new Event('resize'));

      mockWindowSize(375, 667);
      window.dispatchEvent(new Event('resize'));

      expect(sizes).toEqual(['tablet', 'mobile']);

      if (cleanup) {
        cleanup();
      }
    });
  });

  describe('Edge Cases', () => {
    it('handles exact breakpoint boundaries correctly', () => {
      // Tablet starts at 768
      mockWindowSize(768, 600);
      expect(getViewportSize()).toBe('tablet');
      expect(isMobile()).toBe(false);
      expect(isTablet()).toBe(true);

      // Desktop starts at 1024
      mockWindowSize(1024, 768);
      expect(getViewportSize()).toBe('desktop');
      expect(isTablet()).toBe(false);
      expect(isDesktop()).toBe(true);

      // Large desktop starts at 1440
      mockWindowSize(1440, 900);
      expect(getViewportSize()).toBe('large-desktop');
    });

    it('handles zero dimensions', () => {
      mockWindowSize(0, 0);
      expect(getViewportWidth()).toBe(0);
      expect(getViewportHeight()).toBe(0);
      expect(getViewportSize()).toBe('mobile');
    });

    it('handles extremely large dimensions', () => {
      mockWindowSize(10000, 10000);
      expect(getViewportWidth()).toBe(10000);
      expect(getViewportHeight()).toBe(10000);
      expect(getViewportSize()).toBe('large-desktop');
    });

    it('handles portrait orientation', () => {
      // Tablet in portrait (iPad)
      mockWindowSize(768, 1024);
      expect(getViewportSize()).toBe('tablet');

      // Mobile in portrait
      mockWindowSize(375, 667);
      expect(getViewportSize()).toBe('mobile');
    });

    it('handles landscape orientation', () => {
      // Tablet in landscape
      mockWindowSize(1024, 768);
      expect(getViewportSize()).toBe('desktop');

      // Mobile in landscape
      mockWindowSize(667, 375);
      expect(getViewportSize()).toBe('mobile');
    });
  });
});
