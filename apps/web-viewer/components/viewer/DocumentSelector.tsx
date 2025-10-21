'use client';

import { useEffect, useState } from 'react';
import { DocumentSet } from '@/lib/types/entities';
import { fetchDocuments } from '@/lib/api/documents';
import { DocumentCard } from './DocumentCard';
import { EmptyState } from './EmptyState';
import { Loader2 } from 'lucide-react';

/**
 * DocumentSelector component
 * Displays a list of available documents and handles selection
 * Implements FR-007: Document scanning and listing
 * Implements FR-021: Processed content preference
 * Implements FR-023: Zero-state handling
 */

export interface DocumentSelectorProps {
  onSelect: (documentId: string) => void;
  selectedDocumentId?: string | null;
}

export function DocumentSelector({ onSelect, selectedDocumentId }: DocumentSelectorProps) {
  const [documents, setDocuments] = useState<DocumentSet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadDocuments() {
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await fetchDocuments();
        setDocuments(response.documents);
      } catch (err) {
        console.error('Failed to load documents:', err);
        setError(err instanceof Error ? err.message : 'Failed to load documents');
      } finally {
        setIsLoading(false);
      }
    }

    loadDocuments();
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
          <p className="mt-4 text-sm text-muted-foreground">Loading documents...</p>
        </div>
      </div>
    );
  }

  // Error state (FR-023: error scenario)
  if (error) {
    return (
      <EmptyState
        type="error"
        message={error}
        action={{
          label: 'Retry',
          onClick: () => window.location.reload(),
        }}
      />
    );
  }

  // Empty state (FR-023: no documents scenario)
  if (documents.length === 0) {
    return <EmptyState type="no-documents" />;
  }

  // Document list
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Select a Document</h2>
        <p className="text-muted-foreground">
          Choose a document to view and compare translations
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {documents.map((document) => (
          <DocumentCard
            key={document.id}
            document={document}
            onSelect={onSelect}
            isSelected={selectedDocumentId === document.id}
          />
        ))}
      </div>

      <div className="text-center text-sm text-muted-foreground">
        {documents.length} {documents.length === 1 ? 'document' : 'documents'} available
      </div>
    </div>
  );
}
