'use client';

import { useState, useEffect, memo } from 'react';
import Image from 'next/image';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Loader2, AlertCircle, AlertTriangle, FileText } from 'lucide-react';
import {
  detectMalformedMarkdown,
  resolveMarkdownImages,
  sanitizeMarkdownContent,
  handleLongLines,
} from '@/lib/utils/markdown-parser';
import { retryFetch } from '@/lib/utils/retry';
import { LanguageSelector } from './LanguageSelector';
import { MissingPagePlaceholder } from './MissingPagePlaceholder';

/**
 * MarkdownPane component
 * Displays markdown content for a specific page and language
 * Implements FR-002: Markdown rendering with all supported elements
 * Implements FR-010: Image rendering with placeholder for missing images
 * Implements FR-030: Malformed markdown handling
 * Implements FR-034: Per-pane language selection
 * Implements T100: React.memo optimization to prevent unnecessary re-renders
 */

interface MarkdownPaneProps {
  documentId: string;
  pageNumber: number;
  languageCode: string;
  isRaw?: boolean;
  availableLanguages?: Array<{
    languageCode: string;
    isRaw: boolean;
    label?: string;
  }>;
  onLanguageChange?: (languageCode: string, isRaw: boolean) => void;
  onLoadSuccess?: () => void;
  onLoadError?: (error: Error) => void;
  className?: string;
}

interface MarkdownResponse {
  content: string;
  pageNumber: number;
  languageCode: string;
  isRaw: boolean;
  fileName: string;
  sizeBytes: number;
}

function MarkdownPaneComponent({
  documentId,
  pageNumber,
  languageCode,
  isRaw = false,
  availableLanguages = [],
  onLanguageChange,
  onLoadSuccess,
  onLoadError,
  className = '',
}: MarkdownPaneProps) {
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPageMissing, setIsPageMissing] = useState(false);
  const [malformedWarning, setMalformedWarning] = useState<string | null>(null);
  const [hasLongLines, setHasLongLines] = useState(false);
  const [retryTrigger, setRetryTrigger] = useState(0);

  // Fetch markdown content with AbortController (FR-024d)
  useEffect(() => {
    let isMounted = true;
    const abortController = new AbortController();

    async function fetchMarkdown() {
      setLoading(true);
      setError(null);
      setIsPageMissing(false);
      setMalformedWarning(null);
      setHasLongLines(false);

      try {
        const url = `/api/documents/${documentId}/pages/${pageNumber}/markdown?lang=${languageCode}&raw=${isRaw}`;
        
        // Retry with exponential backoff (FR-026b)
        const response = await retryFetch(
          url,
          { signal: abortController.signal },
          {
            maxAttempts: 3,
            delayMs: 500,
            backoffMultiplier: 2,
          }
        );

        if (!response.ok) {
          // Check if it's a 404 (missing page) - show placeholder instead of error (FR-014)
          if (response.status === 404) {
            setIsPageMissing(true);
            setLoading(false);
            return;
          }
          
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to load markdown');
        }

        const data: MarkdownResponse = await response.json();

        if (!isMounted) return;

        // Check for malformed content (FR-030a)
        const warning = detectMalformedMarkdown(data.content);
        if (warning) {
          setMalformedWarning(warning);
        }

        // Handle long lines (FR-030b)
        const { content: processedContent, hasTruncatedLines } = handleLongLines(data.content);
        setHasLongLines(hasTruncatedLines);

        // Resolve image paths (FR-010)
        const contentWithImages = resolveMarkdownImages(
          processedContent,
          documentId,
          languageCode,
          isRaw
        );

        // Sanitize content (FR-030d)
        const sanitizedContent = sanitizeMarkdownContent(contentWithImages);

        setContent(sanitizedContent);
        setLoading(false);

        if (onLoadSuccess) {
          onLoadSuccess();
        }
      } catch (err) {
        if (!isMounted) return;

        // Don't show error for aborted requests (FR-024d)
        if (err instanceof Error && err.name === 'AbortError') {
          return;
        }

        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
        setLoading(false);

        if (onLoadError) {
          onLoadError(err instanceof Error ? err : new Error(errorMessage));
        }
      }
    }

    fetchMarkdown();

    return () => {
      isMounted = false;
      abortController.abort(); // Cancel in-flight request (FR-024d)
    };
  }, [documentId, pageNumber, languageCode, isRaw, onLoadSuccess, onLoadError, retryTrigger]);

  return (
    <div className={`markdown-pane relative flex flex-col h-full bg-background ${className}`} role="region" aria-label="Markdown viewer pane">
      {/* Language selector header (FR-034) */}
      {availableLanguages.length > 0 && onLanguageChange && (
        <div className="shrink-0 border-b bg-muted/30 px-4 py-2">
          <LanguageSelector
            availableLanguages={availableLanguages}
            selectedLanguageCode={languageCode}
            selectedIsRaw={isRaw}
            onLanguageChange={onLanguageChange}
            disabled={loading}
          />
        </div>
      )}

      {/* Scrollable content area */}
      <div className="flex-1 overflow-y-auto" tabIndex={0} role="region" aria-label="Markdown content">
        {/* Loading state */}
        {loading && !error && !isPageMissing && (
          <div className="flex h-full items-center justify-center" role="status" aria-live="polite" aria-label="Loading markdown content">
            <div className="text-center">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" aria-hidden="true" />
              <p className="mt-2 text-sm text-muted-foreground">Loading markdown...</p>
            </div>
          </div>
        )}

        {/* Missing page placeholder (FR-014) */}
        {isPageMissing && (
          <MissingPagePlaceholder
            pageNumber={pageNumber}
            languageCode={languageCode}
            isRaw={isRaw}
          />
        )}

        {/* Error state */}
        {error && !isPageMissing && (
        <div data-testid="error-message" className="flex h-full items-center justify-center p-4" role="alert" aria-live="assertive">
          <div className="text-center max-w-md">
            <AlertCircle className="mx-auto h-12 w-12 text-destructive" aria-hidden="true" />
            <p className="mt-4 text-sm text-destructive font-medium">Error loading markdown</p>
            <p className="mt-2 text-xs text-muted-foreground">{error}</p>
            <button
              onClick={() => {
                setRetryTrigger((prev) => prev + 1);
              }}
              className="mt-4 text-sm text-primary hover:underline"
              aria-label="Retry loading markdown"
            >
              Try again
            </button>
          </div>
        </div>
      )}

      {/* Empty content (FR-030e) */}
      {!loading && !error && !isPageMissing && content.trim().length === 0 && (
        <div data-testid="empty-message" className="flex h-full items-center justify-center p-4" role="status" aria-label="No content available">
          <div className="text-center max-w-md">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground" aria-hidden="true" />
            <p className="mt-4 text-sm text-muted-foreground font-medium">No content for this page</p>
            <p className="mt-2 text-xs text-muted-foreground">
              The markdown file for this page is empty or contains no visible content.
            </p>
          </div>
        </div>
      )}

      {/* Malformed content warning (FR-030a) */}
      {malformedWarning && !isPageMissing && (
        <div className="sticky top-0 z-10 bg-amber-50 border-b border-amber-200 px-4 py-2" role="status" aria-label="Malformed content warning">
          <div className="flex items-center gap-2 text-xs text-amber-900">
            <AlertTriangle className="h-4 w-4" aria-hidden="true" />
            <span>Warning: {malformedWarning}. Content may not render correctly.</span>
          </div>
        </div>
      )}

      {/* Long lines warning (FR-030b) */}
      {hasLongLines && !isPageMissing && (
        <div className="sticky top-0 z-10 bg-blue-50 border-b border-blue-200 px-4 py-2" role="status" aria-label="Long lines truncated warning">
          <div className="flex items-center gap-2 text-xs text-blue-900">
            <AlertTriangle className="h-4 w-4" aria-hidden="true" />
            <span>Some lines were truncated for display. Original content preserved.</span>
          </div>
        </div>
      )}

      {/* Markdown content */}
      {!loading && !error && !isPageMissing && content && (
        <div data-testid="markdown-content" className="markdown-content prose prose-sm max-w-none p-6" role="article" aria-label={`Markdown content for ${languageCode} ${isRaw ? 'raw' : 'processed'}`}>
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              // Custom image component with error handling (FR-010)
              // Using Next.js Image with unoptimized for markdown images
              img: ({ alt, src, title }) => {
                if (!src || typeof src !== 'string') return null;
                
                return (
                  <span className="relative inline-block max-w-full">
                    <Image
                      alt={alt || 'Image'}
                      src={src}
                      title={title}
                      width={800}
                      height={600}
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      style={{ width: '100%', height: 'auto' }}
                      unoptimized // Markdown images from API, dimensions unknown
                      onError={(e) => {
                        // Replace with placeholder on error
                        const target = e.target as HTMLImageElement;
                        target.src = 'data:image/svg+xml,' + encodeURIComponent(`
                          <svg xmlns="http://www.w3.org/2000/svg" width="200" height="150" viewBox="0 0 200 150">
                            <rect width="200" height="150" fill="#f3f4f6"/>
                            <text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#9ca3af" font-family="Arial" font-size="14">
                              ${alt || 'Image not found'}
                            </text>
                          </svg>
                        `);
                        target.title = alt || 'Image not found';
                      }}
                    />
                  </span>
                );
              },
              // Add word-break for long inline content (FR-030b)
              p: ({ children, ...props }) => (
                <p {...props} className="wrap-break-word">
                  {children}
                </p>
              ),
              // Horizontal scroll for code blocks with long lines
              code: ({ children, className, ...props }) => {
                const isInline = !className || !className.includes('language-');
                return isInline ? (
                  <code {...props} className="wrap-break-word">
                    {children}
                  </code>
                ) : (
                  <code {...props} className={`block overflow-x-auto ${className || ''}`}>
                    {children}
                  </code>
                );
              },
            }}
          >
            {content}
          </ReactMarkdown>
        </div>
      )}
      </div>
    </div>
  );
}

// Memoize component to prevent unnecessary re-renders (T100)
// Only re-render if documentId, pageNumber, languageCode, or isRaw changes
export const MarkdownPane = memo(MarkdownPaneComponent, (prevProps, nextProps) => {
  return (
    prevProps.documentId === nextProps.documentId &&
    prevProps.pageNumber === nextProps.pageNumber &&
    prevProps.languageCode === nextProps.languageCode &&
    prevProps.isRaw === nextProps.isRaw
  );
});

MarkdownPane.displayName = 'MarkdownPane';
