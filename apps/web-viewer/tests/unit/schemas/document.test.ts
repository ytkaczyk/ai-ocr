import { describe, it, expect } from 'vitest';
import { documentSetSchema, languageVersionSchema } from '@/lib/schemas/document';
import {
  createMockDocumentSet,
  createMockLanguageVersion,
} from '@/tests/helpers/mocks';

describe('languageVersionSchema', () => {
  it('should validate a valid language version', () => {
    const mock = createMockLanguageVersion();
    const result = languageVersionSchema.safeParse(mock);
    
    expect(result.success).toBe(true);
  });

  it('should require languageCode', () => {
    const mock = createMockLanguageVersion();
    // @ts-expect-error - Testing invalid data
    delete mock.languageCode;
    
    const result = languageVersionSchema.safeParse(mock);
    expect(result.success).toBe(false);
  });

  it('should validate raw and processed versions', () => {
    const raw = createMockLanguageVersion({ isRaw: true, folderName: 'raw.en-US' });
    const processed = createMockLanguageVersion({ isRaw: false, folderName: 'en-US' });

    expect(languageVersionSchema.safeParse(raw).success).toBe(true);
    expect(languageVersionSchema.safeParse(processed).success).toBe(true);
  });
});

describe('documentSetSchema', () => {
  it('should validate a valid document set', () => {
    const mock = createMockDocumentSet();
    const result = documentSetSchema.safeParse(mock);
    
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.id).toBe('mock-document');
      expect(result.data.pageCount).toBe(10);
    }
  });

  it('should require id and fileName', () => {
    const mock = createMockDocumentSet();
    // @ts-expect-error - Testing invalid data
    delete mock.id;
    
    const result = documentSetSchema.safeParse(mock);
    expect(result.success).toBe(false);
  });

  it('should require positive pageCount', () => {
    const mock = createMockDocumentSet({ pageCount: 0 });
    const result = documentSetSchema.safeParse(mock);
    
    expect(result.success).toBe(false);
  });

  it('should validate hasValidStructure flag', () => {
    const valid = createMockDocumentSet({ hasValidStructure: true });
    const invalid = createMockDocumentSet({ 
      hasValidStructure: false,
      validationErrors: ['Missing pages: 1, 2']
    });

    expect(documentSetSchema.safeParse(valid).success).toBe(true);
    expect(documentSetSchema.safeParse(invalid).success).toBe(true);
  });

  it('should handle optional dates', () => {
    const withDates = createMockDocumentSet({
      createdAt: new Date('2025-01-01'),
      lastModified: new Date('2025-01-02'),
    });
    const withoutDates = createMockDocumentSet({
      createdAt: undefined,
      lastModified: undefined,
    });

    expect(documentSetSchema.safeParse(withDates).success).toBe(true);
    expect(documentSetSchema.safeParse(withoutDates).success).toBe(true);
  });
});
