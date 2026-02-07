'use client';

import { DocumentSelector } from '@/components/viewer/DocumentSelector';
import { ViewportWarning } from '@/components/viewer/ViewportWarning';
import { useRouter } from 'next/navigation';

/**
 * Translation List Page
 * Displays all available translations/documents
 * Route: /translation
 */
export default function TranslationListPage() {
  const router = useRouter();

  const handleDocumentSelect = (documentId: string) => {
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
