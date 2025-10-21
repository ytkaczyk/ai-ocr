'use client';

import { useState } from 'react';
import { DocumentSelector } from '@/components/viewer/DocumentSelector';
import { ViewportWarning } from '@/components/viewer/ViewportWarning';

export default function Home() {
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);

  const handleDocumentSelect = (documentId: string) => {
    setSelectedDocumentId(documentId);
    // TODO: Navigate to viewer page when Phase 4 is implemented
    // router.push(`/viewer/${documentId}`);
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
            selectedDocumentId={selectedDocumentId}
          />
        </div>
      </main>
    </>
  );
}
