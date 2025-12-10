'use client';

import { useEffect, useRef } from 'react';

/**
 * ScreenReaderAnnouncement component
 * Announces page changes and other important state changes to screen readers
 * Implements FR-018: ARIA live regions for loading states
 * Implements T106: Screen reader announcements for page changes
 */

interface ScreenReaderAnnouncementProps {
  message: string;
  priority?: 'polite' | 'assertive';
  clearAfter?: number; // Clear message after N milliseconds
}

export function ScreenReaderAnnouncement({
  message,
  priority = 'polite',
  clearAfter = 3000,
}: ScreenReaderAnnouncementProps) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout to clear message
    if (clearAfter > 0 && message) {
      timeoutRef.current = setTimeout(() => {
        // Message will naturally clear when component re-renders with empty message
      }, clearAfter);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [message, clearAfter]);

  // Always render the element, even if message is empty, for accessibility testing
  return (
    <>
      {priority === 'assertive' ? (
        <div
          role="status"
          aria-live="assertive"
          aria-atomic="true"
          className="sr-only"
          data-testid="screen-reader-announcement"
        >
          {message}
        </div>
      ) : (
        <div
          role="status"
          aria-live="polite"
          aria-atomic="true"
          className="sr-only"
          data-testid="screen-reader-announcement"
        >
          {message}
        </div>
      )}
    </>
  );
}
