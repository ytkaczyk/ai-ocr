'use client';

import { useEffect } from 'react';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Global Error Boundary
 * Catches unhandled errors in the application and displays a user-friendly fallback UI
 * Implements T109: Global error boundary for graceful error handling
 * Implements FR-033e: Error messages don't disclose internal paths
 */

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log error to console for debugging (in development)
    // In production, this could be sent to an error tracking service
    console.error('Application error:', error);
  }, [error]);

  // Extract error message, ensuring no internal paths are disclosed (FR-033e)
  const getErrorMessage = () => {
    // Generic error messages to prevent information disclosure
    const message = error.message || 'An unexpected error occurred';
    
    // Remove any file paths from error messages
    const sanitized = message
      .replace(/\/[^\s]+/g, '[path]') // Unix paths
      .replace(/[A-Z]:\\[^\s]+/g, '[path]') // Windows paths
      .replace(/\w+:\d+:\d+/g, '[location]'); // Source locations
    
    return sanitized;
  };

  return (
    <div 
      className="flex min-h-screen items-center justify-center bg-background p-4"
      role="alert"
      aria-live="assertive"
    >
      <div className="w-full max-w-md text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
          <AlertCircle className="h-8 w-8 text-destructive" aria-hidden="true" />
        </div>
        
        <h1 className="mb-2 text-2xl font-bold text-foreground">
          Something went wrong
        </h1>
        
        <p className="mb-6 text-sm text-muted-foreground">
          {getErrorMessage()}
        </p>
        
        {error.digest && (
          <p className="mb-6 text-xs text-muted-foreground">
            Error ID: {error.digest}
          </p>
        )}
        
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button
            onClick={reset}
            variant="default"
            aria-label="Try again"
          >
            Try again
          </Button>
          
          <Button
            onClick={() => window.location.href = '/'}
            variant="outline"
            aria-label="Go to home page"
          >
            Go to home
          </Button>
        </div>
        
        <p className="mt-6 text-xs text-muted-foreground">
          If this problem persists, please contact support.
        </p>
      </div>
    </div>
  );
}
