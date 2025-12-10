/**
 * Viewport utility for detecting viewport size and breakpoints
 * Implements FR-025: Responsive layout detection
 */

export type ViewportSize = 'mobile' | 'tablet' | 'desktop' | 'large-desktop';
export type Breakpoint = 768 | 1024 | 1440;

/**
 * Viewport breakpoints (FR-025)
 */
export const BREAKPOINTS = {
  TABLET: 768,      // Minimum width for tablet
  DESKTOP: 1024,    // Minimum width for desktop
  LARGE: 1440,      // Minimum width for large desktop
} as const;

/**
 * Get the current viewport width
 * @returns Current viewport width in pixels
 */
export function getViewportWidth(): number {
  if (typeof window === 'undefined') {
    return 1920; // Default for SSR
  }
  return window.innerWidth;
}

/**
 * Get the current viewport height
 * @returns Current viewport height in pixels
 */
export function getViewportHeight(): number {
  if (typeof window === 'undefined') {
    return 1080; // Default for SSR
  }
  return window.innerHeight;
}

/**
 * Determine the current viewport size based on width
 * @param width - Optional width to check (defaults to current viewport width)
 * @returns Viewport size category
 */
export function getViewportSize(width?: number): ViewportSize {
  const currentWidth = width ?? getViewportWidth();

  if (currentWidth >= BREAKPOINTS.LARGE) {
    return 'large-desktop';
  }
  if (currentWidth >= BREAKPOINTS.DESKTOP) {
    return 'desktop';
  }
  if (currentWidth >= BREAKPOINTS.TABLET) {
    return 'tablet';
  }
  return 'mobile';
}

/**
 * Check if viewport meets minimum width requirement
 * @param breakpoint - Minimum width in pixels
 * @returns True if viewport width >= breakpoint
 */
export function meetsBreakpoint(breakpoint: Breakpoint): boolean {
  return getViewportWidth() >= breakpoint;
}

/**
 * Check if viewport is desktop-sized (≥1024px)
 * @returns True if viewport is desktop or larger
 */
export function isDesktop(): boolean {
  return meetsBreakpoint(BREAKPOINTS.DESKTOP);
}

/**
 * Check if viewport is tablet-sized (768px-1023px)
 * @returns True if viewport is tablet size
 */
export function isTablet(): boolean {
  const width = getViewportWidth();
  return width >= BREAKPOINTS.TABLET && width < BREAKPOINTS.DESKTOP;
}

/**
 * Check if viewport is mobile-sized (<768px)
 * @returns True if viewport is mobile size
 */
export function isMobile(): boolean {
  return getViewportWidth() < BREAKPOINTS.TABLET;
}

/**
 * Hook-like function to get viewport size with optional callback
 * Use this in components with useState/useEffect for reactive updates
 * 
 * @example
 * ```tsx
 * const [viewportSize, setViewportSize] = useState(getViewportSize());
 * 
 * useEffect(() => {
 *   const handleResize = () => setViewportSize(getViewportSize());
 *   window.addEventListener('resize', handleResize);
 *   return () => window.removeEventListener('resize', handleResize);
 * }, []);
 * ```
 */
export function createViewportListener(callback: (size: ViewportSize) => void): () => void {
  if (typeof window === 'undefined') {
    return () => {}; // No-op for SSR
  }

  const handleResize = () => {
    callback(getViewportSize());
  };

  window.addEventListener('resize', handleResize);
  
  return () => {
    window.removeEventListener('resize', handleResize);
  };
}

/**
 * Get user-friendly viewport size name
 */
export function getViewportSizeName(size: ViewportSize): string {
  const names: Record<ViewportSize, string> = {
    'mobile': 'Mobile',
    'tablet': 'Tablet',
    'desktop': 'Desktop',
    'large-desktop': 'Large Desktop',
  };
  return names[size];
}
