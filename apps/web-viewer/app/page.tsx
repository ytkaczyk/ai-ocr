'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DocumentSelector } from '@/components/viewer/DocumentSelector';
import { ViewportWarning } from '@/components/viewer/ViewportWarning';
import { useViewerStore } from '@/lib/stores/useViewerStore';

/**
 * Home Page
 * Maintains backward compatibility with the original single-page interface
 * New routes are available at /translation and /translation/[id]
 */
export default function Home() {
  const router = useRouter();
  const { setPaneMode } = useViewerStore();

  // Initialize mode from URL on mount (before Viewer renders)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const params = new URLSearchParams(window.location.search);
    const modeParam = params.get('mode');
    if (modeParam === 'two-pane' || modeParam === 'three-pane') {
      setPaneMode(modeParam);
    }
  }, [setPaneMode]);

  const handleDocumentSelect = (documentId: string) => {
    // Use router navigation for better URL structure
    router.push(`/translation/${documentId}`);
  };

  return (
    <>
      <ViewportWarning />
      <main className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-bold tracking-tight mb-2">
              OCR Translation Comparison Viewer
            </h1>
            <p className="text-lg text-muted-foreground">
              Compare original PDFs with OCR translations side-by-side
            </p>
          </div>
          
          <DocumentSelector
            onSelect={handleDocumentSelect}
            selectedDocumentId={null}
          />
        </div>
      </main>
    </>
  );
}
