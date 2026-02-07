'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DocumentSelector } from '@/components/viewer/DocumentSelector';
import { ViewportWarning } from '@/components/viewer/ViewportWarning';
import { Viewer } from '@/components/viewer/Viewer';
import { Button } from '@/components/ui/button';
import { useDocumentStore } from '@/lib/stores/useDocumentStore';
import { useViewerStore } from '@/lib/stores/useViewerStore';
import { ArrowLeft } from 'lucide-react';

/**
 * Home Page
 * Maintains backward compatibility with the original single-page interface
 * New routes are available at /translation and /translation/[id]
 */
export default function Home() {
  const router = useRouter();
  const { currentDocumentId } = useDocumentStore();
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

  const handleBackToSelection = () => {
    // Use router navigation for better URL structure
    router.push('/translation');
  };

  return (
    <>
      <ViewportWarning />
      <main className="min-h-screen bg-background">
        {!currentDocumentId ? (
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
              selectedDocumentId={currentDocumentId}
            />
          </div>
        ) : (
          <div className="flex flex-col h-screen">
            <div className="border-b bg-card">
              <div className="container mx-auto px-4 py-3 flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBackToSelection}
                  className="gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Documents
                </Button>
                <div className="flex-1">
                  <h1 className="text-lg font-semibold">
                    {currentDocumentId}
                  </h1>
                </div>
              </div>
            </div>
            <div className="flex-1 overflow-hidden">
              <Viewer />
            </div>
          </div>
        )}
      </main>
    </>
  );
}
