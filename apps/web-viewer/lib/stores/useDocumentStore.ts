import { create } from 'zustand';
import type { DocumentSet } from '@/lib/types/entities';

/**
 * Document store state
 */
interface DocumentStoreState {
  // Data
  documents: DocumentSet[];
  currentDocumentId: string | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  setDocuments: (documents: DocumentSet[]) => void;
  setCurrentDocument: (documentId: string | null) => void;
  getCurrentDocument: () => DocumentSet | null;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

/**
 * Initial state
 */
const initialState = {
  documents: [],
  currentDocumentId: null,
  isLoading: false,
  error: null,
};

/**
 * Document store
 * Manages document list and current document selection
 */
export const useDocumentStore = create<DocumentStoreState>((set, get) => ({
  ...initialState,

  setDocuments: (documents) => set({ documents, error: null }),

  setCurrentDocument: (documentId) => set({ currentDocumentId: documentId }),

  getCurrentDocument: () => {
    const state = get();
    if (!state.currentDocumentId) return null;
    return state.documents.find((doc) => doc.id === state.currentDocumentId) || null;
  },

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error, isLoading: false }),

  reset: () => set(initialState),
}));
