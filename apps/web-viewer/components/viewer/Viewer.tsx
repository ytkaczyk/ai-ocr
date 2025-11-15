'use client';

import { useEffect, useState, useRef } from 'react';
import { useDocumentStore } from '@/lib/stores/useDocumentStore';
import { useViewerStore } from '@/lib/stores/useViewerStore';
import { Pager } from './Pager';
import { PaneContainer } from './PaneContainer';
import { ModeToggle } from './ModeToggle';
import { Loader2, AlertCircle } from 'lucide-react';
import { prefetchAdjacentPagesWithCache } from '@/lib/utils/prefetch';

/**
 * Viewer component
 * Main container for document viewing with panes and navigation
 * Implements FR-004: Pane synchronization
 * Implements FR-012: Page number and total page count display
 */

interface ViewerProps {
  documentId?: string;
  className?: string;
}

export function Viewer({ documentId, className = '' }: ViewerProps) {
  const { documents, getCurrentDocument, currentDocumentId } = useDocumentStore();
  const { currentPage, setCurrentPage, setError, error, paneMode } = useViewerStore();
  const [totalPages, setTotalPages] = useState(0);
  const previousDocumentIdRef = useRef<string | null>(null);
  const previousPaneModeRef = useRef<string>(paneMode);

  // Get document ID from props or store
  const activeDocumentId = documentId || currentDocumentId;

  // Find the document
  const document = activeDocumentId 
    ? documents.find((doc) => doc.id === activeDocumentId) || getCurrentDocument()
    : getCurrentDocument();

  // Derive loading state - we're loading if we have an active ID but no document
  const loading = !!activeDocumentId && !document;

  // Initialize page from URL query parameter on mount
  useEffect(() => {
    if (typeof window === 'undefined' || !document) return;
    
    const params = new URLSearchParams(window.location.search);
    const pageParam = params.get('page');
    
    if (pageParam) {
      const pageNum = parseInt(pageParam, 10);
      if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= document.pageCount) {
        setCurrentPage(pageNum);
      }
    }
  }, [document, setCurrentPage]);

  // Update URL when page or mode changes and handle browser back/forward
  useEffect(() => {
    if (typeof window === 'undefined' || !document) return;
    
    // Update URL to match current page and mode
    const updateURL = () => {
      const url = new URL(window.location.href);
      const currentPageParam = url.searchParams.get('page');
      const currentModeParam = url.searchParams.get('mode');
      const newPageValue = currentPage.toString();
      const newModeValue = paneMode;
      
      // Only update if the parameters are different
      let changed = false;
      
      if (currentPageParam !== newPageValue) {
        url.searchParams.set('page', newPageValue);
        changed = true;
      }
      
      if (currentModeParam !== newModeValue) {
        url.searchParams.set('mode', newModeValue);
        changed = true;
      }
      
      // Use replaceState to avoid creating too many history entries
      if (changed) {
        window.history.replaceState({}, '', url.toString());
      }
    };
    
    updateURL();
    
    // Handle browser back/forward navigation
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const pageParam = params.get('page');
      
      if (pageParam) {
        const pageNum = parseInt(pageParam, 10);
        if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= document.pageCount) {
          setCurrentPage(pageNum);
        }
      }
    };
    
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [currentPage, paneMode, document, setCurrentPage]);

  // Initialize viewer with document data
  useEffect(() => {
    if (!document) {
      if (activeDocumentId) {
        queueMicrotask(() => setError('Document not found'));
      }
      return;
    }

    // Clear error and set total pages
    queueMicrotask(() => {
      if (error) {
        setError(null);
      }
      setTotalPages(document.pageCount);
    });

    // Reset to page 1 when document changes (unless URL has a page param)
    const documentChanged = previousDocumentIdRef.current !== activeDocumentId;
    
    if (documentChanged) {
      previousDocumentIdRef.current = activeDocumentId || null;
      
      const params = new URLSearchParams(window.location.search);
      const pageParam = params.get('page');
      
      if (!pageParam) {
        setCurrentPage(1);
      }
    } else if (currentPage > document.pageCount) {
      // Also reset if current page exceeds new document's page count
      setCurrentPage(1);
    }
  }, [document, activeDocumentId, currentPage, setCurrentPage, setError, error]);

  // Prefetch adjacent pages whenever page changes
  useEffect(() => {
    if (!document) return;

    const languageVersion = document.availableLanguages.find((lang: { isRaw: boolean }) => !lang.isRaw) || 
                           document.availableLanguages[0];
    
    if (!languageVersion) return;

    // Prefetch N-1 and N+1 pages
    prefetchAdjacentPagesWithCache(
      document.id,
      currentPage,
      document.pageCount,
      languageVersion.languageCode
    );
  }, [document, currentPage]);

  // Preserve page position when switching modes (T095, FR-006)
  // This is handled by the store's setPaneMode action which maintains currentPage
  useEffect(() => {
    // Track mode changes without resetting page
    if (previousPaneModeRef.current !== paneMode) {
      previousPaneModeRef.current = paneMode;
      // Page position is automatically preserved by store state
    }
  }, [paneMode]);

  // Handle page change
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Loading state
  if (loading && !document) {
    return (
      <div className={`viewer flex h-full items-center justify-center ${className}`}>
        <div className="text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
          <p className="mt-4 text-sm text-muted-foreground">Loading document...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !document) {
    return (
      <div className={`viewer flex h-full items-center justify-center ${className}`}>
        <div className="text-center max-w-md">
          <AlertCircle className="mx-auto h-16 w-16 text-destructive" />
          <p className="mt-4 text-lg font-medium text-destructive">Error loading document</p>
          <p className="mt-2 text-sm text-muted-foreground">
            {error || 'The requested document could not be found or loaded.'}
          </p>
        </div>
      </div>
    );
  }

  // Get first available language (prefer processed over raw per FR-021)
  const languageVersion = document.availableLanguages.find((lang: { isRaw: boolean }) => !lang.isRaw) || 
                         document.availableLanguages[0];

  if (!languageVersion) {
    return (
      <div className={`viewer flex h-full items-center justify-center ${className}`}>
        <div className="text-center max-w-md">
          <AlertCircle className="mx-auto h-16 w-16 text-muted-foreground" />
          <p className="mt-4 text-lg font-medium">No content available</p>
          <p className="mt-2 text-sm text-muted-foreground">
            This document does not have any language versions available.
          </p>
        </div>
      </div>
    );
  }

  // Detect available language versions for 3-pane mode (T090)
  // FR-005: 3-pane mode requires at least 2 language versions
  const availableLanguageCodes = document.availableLanguages.map((lang: { languageCode: string }) => lang.languageCode);
  
  // Build list of available languages with raw/processed info for language selector
  const availableLanguagesForSelector = document.availableLanguages.map((lang: { languageCode: string; isRaw: boolean }) => ({
    languageCode: lang.languageCode,
    isRaw: lang.isRaw,
  }));
  
  // For 3-pane mode, determine source and target language codes
  // Strategy: Use raw version as source, processed version as target
  const rawVersion = document.availableLanguages.find((lang: { isRaw: boolean }) => lang.isRaw);
  const processedVersion = document.availableLanguages.find((lang: { isRaw: boolean }) => !lang.isRaw);
  
  const sourceLanguageCode = rawVersion?.languageCode || languageVersion.languageCode;
  const targetLanguageCode = processedVersion?.languageCode || languageVersion.languageCode;

  return (
    <div data-testid="viewer-container" className={`viewer flex h-full flex-col ${className}`}>
      {/* Pager navigation with mode toggle */}
      <div className="flex items-center justify-between gap-4 px-4 py-2 border-b bg-background">
        <ModeToggle availableLanguages={availableLanguageCodes} />
        
        <Pager
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      </div>

      {/* Pane container */}
      <div className="viewer-content flex-1 overflow-hidden">
        <PaneContainer
          documentId={document.id}
          currentPage={currentPage}
          languageCode={languageVersion.languageCode}
          sourceLanguageCode={sourceLanguageCode}
          targetLanguageCode={targetLanguageCode}
          availableLanguages={availableLanguagesForSelector}
        />
      </div>
    </div>
  );
}
