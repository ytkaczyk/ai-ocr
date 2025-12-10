import { describe, it, expect, beforeEach } from 'vitest';
import { useDocumentStore } from '@/lib/stores/useDocumentStore';
import { createMockDocumentSets } from '@/tests/helpers/mocks';

describe('useDocumentStore', () => {
  beforeEach(() => {
    // Reset store before each test
    useDocumentStore.getState().reset();
  });

  describe('initial state', () => {
    it('should have empty documents array', () => {
      const state = useDocumentStore.getState();
      expect(state.documents).toEqual([]);
    });

    it('should have null currentDocumentId', () => {
      const state = useDocumentStore.getState();
      expect(state.currentDocumentId).toBeNull();
    });

    it('should not be loading', () => {
      const state = useDocumentStore.getState();
      expect(state.isLoading).toBe(false);
    });

    it('should have no error', () => {
      const state = useDocumentStore.getState();
      expect(state.error).toBeNull();
    });
  });

  describe('setDocuments', () => {
    it('should set documents', () => {
      const mockDocs = createMockDocumentSets(3);
      useDocumentStore.getState().setDocuments(mockDocs);

      const state = useDocumentStore.getState();
      expect(state.documents).toEqual(mockDocs);
      expect(state.documents.length).toBe(3);
    });

    it('should clear error when setting documents', () => {
      useDocumentStore.getState().setError('Test error');
      useDocumentStore.getState().setDocuments([]);

      const state = useDocumentStore.getState();
      expect(state.error).toBeNull();
    });
  });

  describe('setCurrentDocument', () => {
    it('should set current document ID', () => {
      useDocumentStore.getState().setCurrentDocument('doc-1');

      const state = useDocumentStore.getState();
      expect(state.currentDocumentId).toBe('doc-1');
    });

    it('should allow setting to null', () => {
      useDocumentStore.getState().setCurrentDocument('doc-1');
      useDocumentStore.getState().setCurrentDocument(null);

      const state = useDocumentStore.getState();
      expect(state.currentDocumentId).toBeNull();
    });
  });

  describe('getCurrentDocument', () => {
    it('should return null when no document is selected', () => {
      const doc = useDocumentStore.getState().getCurrentDocument();
      expect(doc).toBeNull();
    });

    it('should return current document when selected', () => {
      const mockDocs = createMockDocumentSets(3);
      useDocumentStore.getState().setDocuments(mockDocs);
      useDocumentStore.getState().setCurrentDocument('document-2');

      const doc = useDocumentStore.getState().getCurrentDocument();
      expect(doc).not.toBeNull();
      expect(doc?.id).toBe('document-2');
    });

    it('should return null when selected document does not exist', () => {
      const mockDocs = createMockDocumentSets(3);
      useDocumentStore.getState().setDocuments(mockDocs);
      useDocumentStore.getState().setCurrentDocument('non-existent');

      const doc = useDocumentStore.getState().getCurrentDocument();
      expect(doc).toBeNull();
    });
  });

  describe('setLoading', () => {
    it('should set loading state', () => {
      useDocumentStore.getState().setLoading(true);
      expect(useDocumentStore.getState().isLoading).toBe(true);

      useDocumentStore.getState().setLoading(false);
      expect(useDocumentStore.getState().isLoading).toBe(false);
    });
  });

  describe('setError', () => {
    it('should set error message', () => {
      useDocumentStore.getState().setError('Test error');

      const state = useDocumentStore.getState();
      expect(state.error).toBe('Test error');
    });

    it('should set isLoading to false', () => {
      useDocumentStore.getState().setLoading(true);
      useDocumentStore.getState().setError('Error occurred');

      const state = useDocumentStore.getState();
      expect(state.isLoading).toBe(false);
    });

    it('should allow clearing error', () => {
      useDocumentStore.getState().setError('Test error');
      useDocumentStore.getState().setError(null);

      const state = useDocumentStore.getState();
      expect(state.error).toBeNull();
    });
  });

  describe('reset', () => {
    it('should reset all state to initial values', () => {
      // Modify state
      const mockDocs = createMockDocumentSets(3);
      useDocumentStore.getState().setDocuments(mockDocs);
      useDocumentStore.getState().setCurrentDocument('document-1');
      useDocumentStore.getState().setLoading(true);
      useDocumentStore.getState().setError('Test error');

      // Reset
      useDocumentStore.getState().reset();

      // Check all values are back to initial state
      const state = useDocumentStore.getState();
      expect(state.documents).toEqual([]);
      expect(state.currentDocumentId).toBeNull();
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });
  });
});
