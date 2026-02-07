'use client';

import { useEffect, useState } from 'react';
import { ViewportWarning } from '@/components/viewer/ViewportWarning';
import { Viewer } from '@/components/viewer/Viewer';
import { Button } from '@/components/ui/button';
import { useDocumentStore } from '@/lib/stores/useDocumentStore';
import { useViewerStore } from '@/lib/stores/useViewerStore';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

/**
 * Translation Detail Page
 * Shows the multipane view for a specific translation
 * Route: /translation/[id]
 */
export default function TranslationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { setCurrentDocument } = useDocumentStore();
  const { setPaneMode } = useViewerStore();
  const [documentId, setDocumentId] = useState<string | null>(null);

  // Set the document ID from the URL param (params is a Promise in Next.js 15+)
  useEffect(() => {
    params.then(({ id }) => {
      setDocumentId(id);
      setCurrentDocument(id);
    });
  }, [params, setCurrentDocument]);

  // Initialize mode from URL on mount (before Viewer renders)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const urlParams = new URLSearchParams(window.location.search);
    const modeParam = urlParams.get('mode');
    if (modeParam === 'two-pane' || modeParam === 'three-pane') {
      setPaneMode(modeParam);
    }
  }, [setPaneMode]);

  const handleBackToList = () => {
    router.push('/translation');
  };

  if (!documentId) {
    return (
      <>
        <ViewportWarning />
        <main className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <ViewportWarning />
      <main className="min-h-screen bg-background">
        <div className="flex flex-col h-screen">
          <div className="border-b bg-card">
            <div className="container mx-auto px-4 py-3 flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBackToList}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Translations
              </Button>
              <div className="flex-1">
                <h1 className="text-lg font-semibold">
                  {documentId}
                </h1>
              </div>
            </div>
          </div>
          <div className="flex-1 overflow-hidden">
            <Viewer documentId={documentId} />
          </div>
        </div>
      </main>
    </>
  );
}
