import { describe, it, expect } from 'vitest';
import { 
  documentSetSchema, 
  languageVersionSchema,
  validateDocumentSet,
  validateLanguageVersion,
} from '@/lib/schemas/document';
import {
  createMockDocumentSet,
  createMockLanguageVersion,
  createMockPageFile,
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

  it('should require isRaw field', () => {
    const mock = createMockLanguageVersion();
    // @ts-expect-error - Testing invalid data
    delete mock.isRaw;
    
    const result = languageVersionSchema.safeParse(mock);
    expect(result.success).toBe(false);
  });

  it('should require folderName field', () => {
    const mock = createMockLanguageVersion();
    // @ts-expect-error - Testing invalid data
    delete mock.folderName;
    
    const result = languageVersionSchema.safeParse(mock);
    expect(result.success).toBe(false);
  });

  it('should require pageFiles array', () => {
    const mock = createMockLanguageVersion();
    // @ts-expect-error - Testing invalid data
    delete mock.pageFiles;
    
    const result = languageVersionSchema.safeParse(mock);
    expect(result.success).toBe(false);
  });

  it('should require isComplete field', () => {
    const mock = createMockLanguageVersion();
    // @ts-expect-error - Testing invalid data
    delete mock.isComplete;
    
    const result = languageVersionSchema.safeParse(mock);
    expect(result.success).toBe(false);
  });

  it('should require missingPages array', () => {
    const mock = createMockLanguageVersion();
    // @ts-expect-error - Testing invalid data
    delete mock.missingPages;
    
    const result = languageVersionSchema.safeParse(mock);
    expect(result.success).toBe(false);
  });

  it('should validate pageFiles with correct structure', () => {
    const mock = createMockLanguageVersion({
      pageFiles: [
        createMockPageFile({ pageNumber: 1 }),
        createMockPageFile({ pageNumber: 2 }),
      ],
    });
    
    const result = languageVersionSchema.safeParse(mock);
    expect(result.success).toBe(true);
  });

  it('should reject pageFiles with invalid pageNumber', () => {
    const mock = createMockLanguageVersion({
      pageFiles: [
        // @ts-expect-error - Testing invalid data
        { ...createMockPageFile(), pageNumber: 0 },
      ],
    });
    
    const result = languageVersionSchema.safeParse(mock);
    expect(result.success).toBe(false);
  });

  it('should reject pageFiles with negative pageNumber', () => {
    const mock = createMockLanguageVersion({
      pageFiles: [
        // @ts-expect-error - Testing invalid data
        { ...createMockPageFile(), pageNumber: -1 },
      ],
    });
    
    const result = languageVersionSchema.safeParse(mock);
    expect(result.success).toBe(false);
  });

  it('should reject pageFiles with non-integer pageNumber', () => {
    const mock = createMockLanguageVersion({
      pageFiles: [
        // @ts-expect-error - Testing invalid data
        { ...createMockPageFile(), pageNumber: 1.5 },
      ],
    });
    
    const result = languageVersionSchema.safeParse(mock);
    expect(result.success).toBe(false);
  });

  it('should allow pageFiles with optional sizeBytes', () => {
    const withSize = createMockLanguageVersion({
      pageFiles: [createMockPageFile({ sizeBytes: 1024 })],
    });
    const withoutSize = createMockLanguageVersion({
      pageFiles: [{ ...createMockPageFile(), sizeBytes: undefined }],
    });
    
    expect(languageVersionSchema.safeParse(withSize).success).toBe(true);
    expect(languageVersionSchema.safeParse(withoutSize).success).toBe(true);
  });

  it('should reject pageFiles with negative sizeBytes', () => {
    const mock = createMockLanguageVersion({
      pageFiles: [
        // @ts-expect-error - Testing invalid data
        { ...createMockPageFile(), sizeBytes: -100 },
      ],
    });
    
    const result = languageVersionSchema.safeParse(mock);
    expect(result.success).toBe(false);
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

  it('should require fileName', () => {
    const mock = createMockDocumentSet();
    // @ts-expect-error - Testing invalid data
    delete mock.fileName;
    
    const result = documentSetSchema.safeParse(mock);
    expect(result.success).toBe(false);
  });

  it('should require pdfPath', () => {
    const mock = createMockDocumentSet();
    // @ts-expect-error - Testing invalid data
    delete mock.pdfPath;
    
    const result = documentSetSchema.safeParse(mock);
    expect(result.success).toBe(false);
  });

  it('should require folderPath', () => {
    const mock = createMockDocumentSet();
    // @ts-expect-error - Testing invalid data
    delete mock.folderPath;
    
    const result = documentSetSchema.safeParse(mock);
    expect(result.success).toBe(false);
  });

  it('should require availableLanguages array', () => {
    const mock = createMockDocumentSet();
    // @ts-expect-error - Testing invalid data
    delete mock.availableLanguages;
    
    const result = documentSetSchema.safeParse(mock);
    expect(result.success).toBe(false);
  });

  it('should require positive pdfSizeBytes', () => {
    const valid = createMockDocumentSet({ pdfSizeBytes: 1024 });
    const zero = createMockDocumentSet({ pdfSizeBytes: 0 });
    const negative = createMockDocumentSet({ pdfSizeBytes: -1 });
    
    expect(documentSetSchema.safeParse(valid).success).toBe(true);
    expect(documentSetSchema.safeParse(zero).success).toBe(false);
    expect(documentSetSchema.safeParse(negative).success).toBe(false);
  });

  it('should require hasValidStructure field', () => {
    const mock = createMockDocumentSet();
    // @ts-expect-error - Testing invalid data
    delete mock.hasValidStructure;
    
    const result = documentSetSchema.safeParse(mock);
    expect(result.success).toBe(false);
  });

  it('should allow optional validationErrors', () => {
    const withErrors = createMockDocumentSet({
      validationErrors: ['Error 1', 'Error 2'],
    });
    const withoutErrors = createMockDocumentSet({
      validationErrors: undefined,
    });
    
    expect(documentSetSchema.safeParse(withErrors).success).toBe(true);
    expect(documentSetSchema.safeParse(withoutErrors).success).toBe(true);
  });

  it('should validate nested availableLanguages', () => {
    const mock = createMockDocumentSet({
      availableLanguages: [
        createMockLanguageVersion({ languageCode: 'en-US' }),
        createMockLanguageVersion({ languageCode: 'es-ES', isRaw: true }),
      ],
    });
    
    const result = documentSetSchema.safeParse(mock);
    expect(result.success).toBe(true);
  });

  it('should reject invalid nested language versions', () => {
    const mock = createMockDocumentSet({
      availableLanguages: [
        // @ts-expect-error - Testing invalid data
        { ...createMockLanguageVersion(), languageCode: undefined },
      ],
    });
    
    const result = documentSetSchema.safeParse(mock);
    expect(result.success).toBe(false);
  });
});

describe('validateDocumentSet', () => {
  it('should successfully parse valid document set', () => {
    const mock = createMockDocumentSet();
    const result = validateDocumentSet(mock);
    
    expect(result.id).toBe('mock-document');
    expect(result.fileName).toBe('mock-document');
    expect(result.pageCount).toBe(10);
  });

  it('should throw ZodError for invalid data', () => {
    const invalid = { id: 'test', fileName: 'test' };
    
    expect(() => validateDocumentSet(invalid)).toThrow();
  });

  it('should throw ZodError when required field is missing', () => {
    const mock = createMockDocumentSet();
    // @ts-expect-error - Testing invalid data
    delete mock.pdfPath;
    
    expect(() => validateDocumentSet(mock)).toThrow();
  });

  it('should parse and return validated data', () => {
    const mock = createMockDocumentSet({
      id: 'test-doc',
      fileName: 'test-doc',
      pageCount: 5,
    });
    
    const result = validateDocumentSet(mock);
    expect(result.id).toBe('test-doc');
    expect(result.pageCount).toBe(5);
  });
});

describe('validateLanguageVersion', () => {
  it('should successfully parse valid language version', () => {
    const mock = createMockLanguageVersion();
    const result = validateLanguageVersion(mock);
    
    expect(result.languageCode).toBe('en-US');
    expect(result.isRaw).toBe(false);
  });

  it('should throw ZodError for invalid data', () => {
    const invalid = { languageCode: 'en-US' };
    
    expect(() => validateLanguageVersion(invalid)).toThrow();
  });

  it('should throw ZodError when required field is missing', () => {
    const mock = createMockLanguageVersion();
    // @ts-expect-error - Testing invalid data
    delete mock.folderName;
    
    expect(() => validateLanguageVersion(mock)).toThrow();
  });

  it('should parse and return validated data', () => {
    const mock = createMockLanguageVersion({
      languageCode: 'fr-FR',
      isRaw: true,
      folderName: 'raw.fr-FR',
    });
    
    const result = validateLanguageVersion(mock);
    expect(result.languageCode).toBe('fr-FR');
    expect(result.isRaw).toBe(true);
    expect(result.folderName).toBe('raw.fr-FR');
  });
});
