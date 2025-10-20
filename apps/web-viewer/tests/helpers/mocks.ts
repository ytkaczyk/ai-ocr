import type { DocumentSet, LanguageVersion, PageFile } from '@/lib/types/entities';
import type { LanguageCode } from '@/lib/schemas/common';

/**
 * Mock data factory for testing
 * Provides reusable mock objects for tests
 */

/**
 * Create a mock PageFile
 */
export function createMockPageFile(overrides?: Partial<PageFile>): PageFile {
  return {
    pageNumber: 1,
    filePath: '/mock/path/document.en-US_page_1.md',
    fileName: 'document.en-US_page_1.md',
    exists: true,
    sizeBytes: 1024,
    ...overrides,
  };
}

/**
 * Create a mock LanguageVersion
 */
export function createMockLanguageVersion(
  overrides?: Partial<LanguageVersion>
): LanguageVersion {
  return {
    languageCode: 'en-US' as LanguageCode,
    isRaw: false,
    folderName: 'en-US',
    pageFiles: [createMockPageFile()],
    isComplete: true,
    missingPages: [],
    ...overrides,
  };
}

/**
 * Create a mock DocumentSet
 */
export function createMockDocumentSet(overrides?: Partial<DocumentSet>): DocumentSet {
  return {
    id: 'mock-document',
    fileName: 'mock-document',
    pdfPath: '/mock/path/mock-document.pdf',
    folderPath: '/mock/path/mock-document',
    availableLanguages: [createMockLanguageVersion()],
    pageCount: 10,
    pdfSizeBytes: 1024 * 1024 * 5, // 5MB
    hasValidStructure: true,
    validationErrors: [],
    createdAt: new Date(),
    lastModified: new Date(),
    ...overrides,
  };
}

/**
 * Create multiple mock DocumentSets
 */
export function createMockDocumentSets(count: number): DocumentSet[] {
  return Array.from({ length: count }, (_, i) =>
    createMockDocumentSet({
      id: `document-${i + 1}`,
      fileName: `document-${i + 1}`,
      pdfPath: `/mock/path/document-${i + 1}.pdf`,
      folderPath: `/mock/path/document-${i + 1}`,
    })
  );
}

/**
 * Create a mock LanguageVersion with multiple pages
 */
export function createMockLanguageVersionWithPages(
  pageCount: number,
  languageCode: LanguageCode = 'en-US',
  isRaw = false
): LanguageVersion {
  const pageFiles = Array.from({ length: pageCount }, (_, i) =>
    createMockPageFile({
      pageNumber: i + 1,
      filePath: `/mock/path/document.${isRaw ? 'raw.' : ''}${languageCode}_page_${i + 1}.md`,
      fileName: `document.${isRaw ? 'raw.' : ''}${languageCode}_page_${i + 1}.md`,
    })
  );

  return createMockLanguageVersion({
    languageCode,
    isRaw,
    folderName: isRaw ? `raw.${languageCode}` : languageCode,
    pageFiles,
    isComplete: true,
    missingPages: [],
  });
}

/**
 * Create a mock DocumentSet with multiple languages and pages
 */
export function createMockDocumentSetMultiLanguage(
  pageCount = 10,
  languages: Array<{ code: LanguageCode; isRaw: boolean }> = [
    { code: 'en-US', isRaw: false },
    { code: 'es-ES', isRaw: false },
  ]
): DocumentSet {
  const availableLanguages = languages.map(({ code, isRaw }) =>
    createMockLanguageVersionWithPages(pageCount, code, isRaw)
  );

  return createMockDocumentSet({
    availableLanguages,
    pageCount,
  });
}

/**
 * Create a mock DocumentSet with incomplete pages
 */
export function createMockDocumentSetIncomplete(missingPages: number[]): DocumentSet {
  const languageVersion = createMockLanguageVersion({
    isComplete: false,
    missingPages,
    pageFiles: [1, 2, 3, 4, 5]
      .filter((n) => !missingPages.includes(n))
      .map((n) =>
        createMockPageFile({
          pageNumber: n,
          filePath: `/mock/path/document.en-US_page_${n}.md`,
          fileName: `document.en-US_page_${n}.md`,
        })
      ),
  });

  return createMockDocumentSet({
    availableLanguages: [languageVersion],
    hasValidStructure: false,
    validationErrors: [`Missing pages: ${missingPages.join(', ')}`],
  });
}

/**
 * Environment variable mocks
 */
export const mockEnvVars = {
  DATA_FOLDER_PATH: '/mock/data/folder',
  MAX_PDF_SIZE_MB: '50',
  MEMORY_LIMIT_MB: '500',
};

/**
 * Set mock environment variables
 */
export function setMockEnv(overrides?: Partial<typeof mockEnvVars>): void {
  const env = { ...mockEnvVars, ...overrides };
  process.env.DATA_FOLDER_PATH = env.DATA_FOLDER_PATH;
  process.env.MAX_PDF_SIZE_MB = env.MAX_PDF_SIZE_MB;
  process.env.MEMORY_LIMIT_MB = env.MEMORY_LIMIT_MB;
}

/**
 * Clear environment variables
 */
export function clearMockEnv(): void {
  delete process.env.DATA_FOLDER_PATH;
  delete process.env.MAX_PDF_SIZE_MB;
  delete process.env.MEMORY_LIMIT_MB;
}
