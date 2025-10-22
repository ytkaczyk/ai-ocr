'use client';

import { DocumentSelector } from '@/components/viewer/DocumentSelector';
import { ViewportWarning } from '@/components/viewer/ViewportWarning';
import { Viewer } from '@/components/viewer/Viewer';
import { Button } from '@/components/ui/button';
import { useDocumentStore } from '@/lib/stores/useDocumentStore';
import { ArrowLeft } from 'lucide-react';

export default function Home() {
  const { currentDocumentId, setCurrentDocument } = useDocumentStore();

  const handleDocumentSelect = (documentId: string) => {
    setCurrentDocument(documentId);
  };

  const handleBackToSelection = () => {
    setCurrentDocument(null);
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
