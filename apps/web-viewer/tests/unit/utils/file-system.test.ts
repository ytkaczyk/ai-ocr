import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import {
  isSymlink,
  isSymlinkSync,
  rejectSymlink,
  exists,
  existsSync,
  getFileSize,
  readDirectory,
  scanDataFolder,
  getDocumentFolderPath,
  getPdfFilePath,
  findLanguageFolders,
  findPageFiles,
  readFileAsString,
  readFileAsBuffer,
} from '@/lib/utils/file-system';
import { setMockEnv, clearMockEnv } from '@/tests/helpers/mocks';
import { resetEnvCache } from '@/lib/utils/env';

describe('isSymlink', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return true for symbolic links', async () => {
    const mockLstat = vi.spyOn(fs, 'lstat').mockResolvedValue({
      isSymbolicLink: () => true,
    } as unknown as ReturnType<typeof fs.lstat>);

    const result = await isSymlink('/path/to/symlink');
    expect(result).toBe(true);
    expect(mockLstat).toHaveBeenCalledWith('/path/to/symlink');

    mockLstat.mockRestore();
  });

  it('should return false for regular files', async () => {
    const mockLstat = vi.spyOn(fs, 'lstat').mockResolvedValue({
      isSymbolicLink: () => false,
    } as unknown as ReturnType<typeof fs.lstat>);

    const result = await isSymlink('/path/to/file');
    expect(result).toBe(false);

    mockLstat.mockRestore();
  });

  it('should return false when file does not exist', async () => {
    const mockLstat = vi.spyOn(fs, 'lstat').mockRejectedValue(new Error('ENOENT'));

    const result = await isSymlink('/path/to/nonexistent');
    expect(result).toBe(false);

    mockLstat.mockRestore();
  });

  it('should return false on permission errors', async () => {
    const mockLstat = vi.spyOn(fs, 'lstat').mockRejectedValue(new Error('EACCES'));

    const result = await isSymlink('/path/to/nopermission');
    expect(result).toBe(false);

    mockLstat.mockRestore();
  });
});

describe('isSymlinkSync', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return true for symbolic links', () => {
    const mockLstatSync = vi.spyOn(fsSync, 'lstatSync').mockReturnValue({
      isSymbolicLink: () => true,
    } as unknown as ReturnType<typeof fs.lstat>);

    const result = isSymlinkSync('/path/to/symlink');
    expect(result).toBe(true);
    expect(mockLstatSync).toHaveBeenCalledWith('/path/to/symlink');

    mockLstatSync.mockRestore();
  });

  it('should return false for regular files', () => {
    const mockLstatSync = vi.spyOn(fsSync, 'lstatSync').mockReturnValue({
      isSymbolicLink: () => false,
    } as unknown as ReturnType<typeof fs.lstat>);

    const result = isSymlinkSync('/path/to/file');
    expect(result).toBe(false);

    mockLstatSync.mockRestore();
  });

  it('should return false when file does not exist', () => {
    const mockLstatSync = vi.spyOn(fsSync, 'lstatSync').mockImplementation(() => {
      throw new Error('ENOENT');
    });

    const result = isSymlinkSync('/path/to/nonexistent');
    expect(result).toBe(false);

    mockLstatSync.mockRestore();
  });
});

describe('rejectSymlink', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should pass when path is not a symlink', async () => {
    const mockLstat = vi.spyOn(fs, 'lstat').mockResolvedValue({
      isSymbolicLink: () => false,
    } as unknown as ReturnType<typeof fs.lstat>);

    await expect(rejectSymlink('/path/to/file', 'test file')).resolves.toBeUndefined();

    mockLstat.mockRestore();
  });

  it('should throw error when path is a symlink', async () => {
    const mockLstat = vi.spyOn(fs, 'lstat').mockResolvedValue({
      isSymbolicLink: () => true,
    } as unknown as ReturnType<typeof fs.lstat>);
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

    await expect(rejectSymlink('/path/to/symlink', 'test file'))
      .rejects
      .toThrow('Symbolic links are not permitted for security reasons');

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('[SECURITY] Symlink access attempt blocked')
    );

    mockLstat.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  it('should log the context and path when rejecting symlink', async () => {
    const mockLstat = vi.spyOn(fs, 'lstat').mockResolvedValue({
      isSymbolicLink: () => true,
    } as unknown as ReturnType<typeof fs.lstat>);
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

    await expect(rejectSymlink('/path/to/symlink', 'PDF file'))
      .rejects
      .toThrow('Symbolic links are not permitted');

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('PDF file')
    );
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('/path/to/symlink')
    );

    mockLstat.mockRestore();
    consoleErrorSpy.mockRestore();
  });
});

describe('exists', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return true when file exists', async () => {
    const mockAccess = vi.spyOn(fs, 'access').mockResolvedValue(undefined);

    const result = await exists('/path/to/file');
    expect(result).toBe(true);
    expect(mockAccess).toHaveBeenCalledWith('/path/to/file');

    mockAccess.mockRestore();
  });

  it('should return false when file does not exist', async () => {
    const mockAccess = vi.spyOn(fs, 'access').mockRejectedValue(new Error('ENOENT'));

    const result = await exists('/path/to/nonexistent');
    expect(result).toBe(false);

    mockAccess.mockRestore();
  });

  it('should return false on permission errors', async () => {
    const mockAccess = vi.spyOn(fs, 'access').mockRejectedValue(new Error('EACCES'));

    const result = await exists('/path/to/nopermission');
    expect(result).toBe(false);

    mockAccess.mockRestore();
  });
});

describe('existsSync', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return true when file exists', () => {
    const mockAccessSync = vi.spyOn(fsSync, 'accessSync').mockReturnValue(undefined);

    const result = existsSync('/path/to/file');
    expect(result).toBe(true);
    expect(mockAccessSync).toHaveBeenCalledWith('/path/to/file');

    mockAccessSync.mockRestore();
  });

  it('should return false when file does not exist', () => {
    const mockAccessSync = vi.spyOn(fsSync, 'accessSync').mockImplementation(() => {
      throw new Error('ENOENT');
    });

    const result = existsSync('/path/to/nonexistent');
    expect(result).toBe(false);

    mockAccessSync.mockRestore();
  });
});

describe('getFileSize', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return file size in bytes', async () => {
    const mockStat = vi.spyOn(fs, 'stat').mockResolvedValue({
      size: 1024,
    } as unknown as ReturnType<typeof fs.lstat>);

    const result = await getFileSize('/path/to/file');
    expect(result).toBe(1024);
    expect(mockStat).toHaveBeenCalledWith('/path/to/file');

    mockStat.mockRestore();
  });

  it('should handle large files', async () => {
    const mockStat = vi.spyOn(fs, 'stat').mockResolvedValue({
      size: 1024 * 1024 * 100, // 100MB
    } as unknown as ReturnType<typeof fs.lstat>);

    const result = await getFileSize('/path/to/largefile');
    expect(result).toBe(1024 * 1024 * 100);

    mockStat.mockRestore();
  });

  it('should throw error when file does not exist', async () => {
    const mockStat = vi.spyOn(fs, 'stat').mockRejectedValue(
      Object.assign(new Error('ENOENT'), { code: 'ENOENT' })
    );

    await expect(getFileSize('/path/to/nonexistent')).rejects.toThrow();

    mockStat.mockRestore();
  });
});

describe('readDirectory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return array of filenames', async () => {
    const mockReaddir = vi.spyOn(fs, 'readdir').mockResolvedValue([
      'file1.txt',
      'file2.pdf',
      'subfolder',
    ] as unknown as Awaited<ReturnType<typeof fs.readdir>>);

    const result = await readDirectory('/path/to/dir');
    expect(result).toEqual(['file1.txt', 'file2.pdf', 'subfolder']);
    expect(mockReaddir).toHaveBeenCalledWith('/path/to/dir');

    mockReaddir.mockRestore();
  });

  it('should return empty array for empty directory', async () => {
    const mockReaddir = vi.spyOn(fs, 'readdir').mockResolvedValue([] as unknown as string[]);

    const result = await readDirectory('/path/to/emptydir');
    expect(result).toEqual([]);

    mockReaddir.mockRestore();
  });

  it('should throw error when directory does not exist', async () => {
    const mockReaddir = vi.spyOn(fs, 'readdir').mockRejectedValue(
      Object.assign(new Error('ENOENT'), { code: 'ENOENT' })
    );

    await expect(readDirectory('/path/to/nonexistent')).rejects.toThrow();

    mockReaddir.mockRestore();
  });
});

describe('scanDataFolder', () => {
  beforeEach(() => {
    resetEnvCache();
    setMockEnv({ DATA_FOLDER_PATH: '/mock/data' });
    vi.clearAllMocks();
  });

  afterEach(() => {
    clearMockEnv();
    resetEnvCache();
  });

  it('should return list of PDF files', async () => {
    const mockExistsSync = vi.spyOn(fsSync, 'existsSync').mockReturnValue(true);
    const mockStatSync = vi.spyOn(fsSync, 'statSync').mockReturnValue({
      isDirectory: () => true,
    } as unknown as ReturnType<typeof fs.lstat>);
    const mockReaddir = vi.spyOn(fs, 'readdir').mockResolvedValue([
      'document1.pdf',
      'document2.pdf',
      'readme.txt',
      'document3.PDF',
    ] as unknown as Awaited<ReturnType<typeof fs.readdir>>);

    const result = await scanDataFolder();

    expect(result).toHaveLength(3);
    // Use array matchers to be platform-independent (Windows vs Unix paths)
    expect(result[0].fileName).toBe('document1');
    expect(result[0].pdfPath).toContain('document1.pdf');
    expect(result[0].pdfPath).toContain('mock');
    expect(result[0].pdfPath).toContain('data');
    expect(result[1].fileName).toBe('document2');
    expect(result[1].pdfPath).toContain('document2.pdf');
    expect(result[2].fileName).toBe('document3.PDF');
    expect(result[2].pdfPath).toContain('document3.PDF');

    mockReaddir.mockRestore();
    mockExistsSync.mockRestore();
    mockStatSync.mockRestore();
  });

  it('should return empty array when no PDFs found', async () => {
    const mockExistsSync = vi.spyOn(fsSync, 'existsSync').mockReturnValue(true);
    const mockStatSync = vi.spyOn(fsSync, 'statSync').mockReturnValue({
      isDirectory: () => true,
    } as unknown as ReturnType<typeof fs.lstat>);
    const mockReaddir = vi.spyOn(fs, 'readdir').mockResolvedValue([
      'readme.txt',
      'image.png',
    ] as unknown as Awaited<ReturnType<typeof fs.readdir>>);

    const result = await scanDataFolder();
    expect(result).toEqual([]);

    mockReaddir.mockRestore();
    mockExistsSync.mockRestore();
    mockStatSync.mockRestore();
  });

  it('should handle case-insensitive PDF extension', async () => {
    const mockExistsSync = vi.spyOn(fsSync, 'existsSync').mockReturnValue(true);
    const mockStatSync = vi.spyOn(fsSync, 'statSync').mockReturnValue({
      isDirectory: () => true,
    } as unknown as ReturnType<typeof fs.lstat>);
    const mockReaddir = vi.spyOn(fs, 'readdir').mockResolvedValue([
      'doc.pdf',
      'doc2.PDF',
      'doc3.Pdf',
      'doc4.PdF',
    ] as unknown as Awaited<ReturnType<typeof fs.readdir>>);

    const result = await scanDataFolder();
    expect(result).toHaveLength(4);

    mockReaddir.mockRestore();
    mockExistsSync.mockRestore();
    mockStatSync.mockRestore();
  });

  it('should throw descriptive error when data folder not found', async () => {
    const mockExistsSync = vi.spyOn(fsSync, 'existsSync').mockReturnValue(true);
    const mockStatSync = vi.spyOn(fsSync, 'statSync').mockReturnValue({
      isDirectory: () => true,
    } as unknown as ReturnType<typeof fs.lstat>);
    const mockReaddir = vi.spyOn(fs, 'readdir').mockRejectedValue(
      Object.assign(new Error('ENOENT'), { code: 'ENOENT' })
    );

    await expect(scanDataFolder()).rejects.toThrow('Data folder not found');
    await expect(scanDataFolder()).rejects.toThrow(/mock.*data/i);

    mockReaddir.mockRestore();
    mockExistsSync.mockRestore();
    mockStatSync.mockRestore();
  });

  it('should propagate other errors', async () => {
    const mockExistsSync = vi.spyOn(fsSync, 'existsSync').mockReturnValue(true);
    const mockStatSync = vi.spyOn(fsSync, 'statSync').mockReturnValue({
      isDirectory: () => true,
    } as unknown as ReturnType<typeof fs.lstat>);
    const mockReaddir = vi.spyOn(fs, 'readdir').mockRejectedValue(
      new Error('Permission denied')
    );

    await expect(scanDataFolder()).rejects.toThrow('Permission denied');

    mockReaddir.mockRestore();
    mockExistsSync.mockRestore();
    mockStatSync.mockRestore();
  });
});

describe('getDocumentFolderPath', () => {
  beforeEach(() => {
    resetEnvCache();
    setMockEnv({ DATA_FOLDER_PATH: '/mock/data' });
    vi.clearAllMocks();
  });

  afterEach(() => {
    clearMockEnv();
    resetEnvCache();
  });

  it('should return correct folder path', () => {
    const mockExistsSync = vi.spyOn(fsSync, 'existsSync').mockReturnValue(true);
    const mockStatSync = vi.spyOn(fsSync, 'statSync').mockReturnValue({
      isDirectory: () => true,
    } as unknown as ReturnType<typeof fs.lstat>);

    const result = getDocumentFolderPath('my-document');
    expect(result).toContain('mock');
    expect(result).toContain('data');
    expect(result).toContain('my-document');

    mockExistsSync.mockRestore();
    mockStatSync.mockRestore();
  });

  it('should validate filename', () => {
    const mockExistsSync = vi.spyOn(fsSync, 'existsSync').mockReturnValue(true);
    const mockStatSync = vi.spyOn(fsSync, 'statSync').mockReturnValue({
      isDirectory: () => true,
    } as unknown as ReturnType<typeof fs.lstat>);

    expect(() => getDocumentFolderPath('../etc/passwd')).toThrow();

    mockExistsSync.mockRestore();
    mockStatSync.mockRestore();
  });

  it('should prevent path traversal', () => {
    const mockExistsSync = vi.spyOn(fsSync, 'existsSync').mockReturnValue(true);
    const mockStatSync = vi.spyOn(fsSync, 'statSync').mockReturnValue({
      isDirectory: () => true,
    } as unknown as ReturnType<typeof fs.lstat>);

    expect(() => getDocumentFolderPath('../../etc')).toThrow();

    mockExistsSync.mockRestore();
    mockStatSync.mockRestore();
  });

  it('should handle valid filenames with hyphens and underscores', () => {
    const mockExistsSync = vi.spyOn(fsSync, 'existsSync').mockReturnValue(true);
    const mockStatSync = vi.spyOn(fsSync, 'statSync').mockReturnValue({
      isDirectory: () => true,
    } as unknown as ReturnType<typeof fs.lstat>);

    const result = getDocumentFolderPath('my-doc_123');
    expect(result).toContain('my-doc_123');

    mockExistsSync.mockRestore();
    mockStatSync.mockRestore();
  });
});

describe('getPdfFilePath', () => {
  beforeEach(() => {
    resetEnvCache();
    setMockEnv({ DATA_FOLDER_PATH: '/mock/data' });
    vi.clearAllMocks();
  });

  afterEach(() => {
    clearMockEnv();
    resetEnvCache();
  });

  it('should return correct PDF path', () => {
    const mockExistsSync = vi.spyOn(fsSync, 'existsSync').mockReturnValue(true);
    const mockStatSync = vi.spyOn(fsSync, 'statSync').mockReturnValue({
      isDirectory: () => true,
    } as unknown as ReturnType<typeof fs.lstat>);

    const result = getPdfFilePath('my-document');
    expect(result).toContain('my-document.pdf');

    mockExistsSync.mockRestore();
    mockStatSync.mockRestore();
  });

  it('should validate filename', () => {
    const mockExistsSync = vi.spyOn(fsSync, 'existsSync').mockReturnValue(true);
    const mockStatSync = vi.spyOn(fsSync, 'statSync').mockReturnValue({
      isDirectory: () => true,
    } as unknown as ReturnType<typeof fs.lstat>);

    expect(() => getPdfFilePath('../etc/passwd')).toThrow();

    mockExistsSync.mockRestore();
    mockStatSync.mockRestore();
  });

  it('should prevent path traversal', () => {
    const mockExistsSync = vi.spyOn(fsSync, 'existsSync').mockReturnValue(true);
    const mockStatSync = vi.spyOn(fsSync, 'statSync').mockReturnValue({
      isDirectory: () => true,
    } as unknown as ReturnType<typeof fs.lstat>);

    expect(() => getPdfFilePath('../../etc')).toThrow();

    mockExistsSync.mockRestore();
    mockStatSync.mockRestore();
  });

  it('should add .pdf extension', () => {
    const mockExistsSync = vi.spyOn(fsSync, 'existsSync').mockReturnValue(true);
    const mockStatSync = vi.spyOn(fsSync, 'statSync').mockReturnValue({
      isDirectory: () => true,
    } as unknown as ReturnType<typeof fs.lstat>);

    const result = getPdfFilePath('document');
    expect(result).toMatch(/document\.pdf$/);

    mockExistsSync.mockRestore();
    mockStatSync.mockRestore();
  });
});

describe('findLanguageFolders', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should find language folders matching pattern', async () => {
    const mockReaddir = vi.spyOn(fs, 'readdir').mockResolvedValue([
      'en-US',
      'es-ES',
      'raw.en-US',
      'raw.fr-FR',
      'readme.txt',
      'images',
    ] as unknown as Awaited<ReturnType<typeof fs.readdir>>);

    const mockStatSync = vi.spyOn(fsSync, 'statSync').mockImplementation((filePath: string) => {
      const name = path.basename(filePath.toString());
      return {
        isDirectory: () => !name.endsWith('.txt'),
      } as unknown as ReturnType<typeof fsSync.statSync>;
    });

    const result = await findLanguageFolders('/path/to/document');

    expect(result).toContain('en-US');
    expect(result).toContain('es-ES');
    expect(result).toContain('raw.en-US');
    expect(result).toContain('raw.fr-FR');
    expect(result).not.toContain('readme.txt');
    expect(result).not.toContain('images');

    mockReaddir.mockRestore();
    mockStatSync.mockRestore();
  });

  it('should filter out non-directory items', async () => {
    const mockReaddir = vi.spyOn(fs, 'readdir').mockResolvedValue([
      'en-US',
      'file.txt',
    ] as unknown as Awaited<ReturnType<typeof fs.readdir>>);

    const mockStatSync = vi.spyOn(fsSync, 'statSync').mockImplementation((filePath: string) => {
      const name = path.basename(filePath.toString());
      return {
        isDirectory: () => name === 'en-US',
      } as unknown as ReturnType<typeof fsSync.statSync>;
    });

    const result = await findLanguageFolders('/path/to/document');

    expect(result).toContain('en-US');
    expect(result).not.toContain('file.txt');

    mockReaddir.mockRestore();
    mockStatSync.mockRestore();
  });

  it('should validate language folder pattern', async () => {
    const mockReaddir = vi.spyOn(fs, 'readdir').mockResolvedValue([
      'en-US',        // Valid
      'raw.en-US',    // Valid
      'eng-US',       // Valid (3-letter language code)
      'en-USA',       // Invalid (3-letter country)
      'EN-US',        // Invalid (uppercase language)
      'en_US',        // Invalid (underscore)
      'english',      // Invalid
    ] as unknown as Awaited<ReturnType<typeof fs.readdir>>);

    const mockStatSync = vi.spyOn(fsSync, 'statSync').mockReturnValue({
      isDirectory: () => true,
    } as unknown as ReturnType<typeof fs.lstat>);

    const result = await findLanguageFolders('/path/to/document');

    expect(result).toContain('en-US');
    expect(result).toContain('raw.en-US');
    expect(result).toContain('eng-US');
    expect(result).not.toContain('en-USA');
    expect(result).not.toContain('EN-US');
    expect(result).not.toContain('en_US');
    expect(result).not.toContain('english');

    mockReaddir.mockRestore();
    mockStatSync.mockRestore();
  });

  it('should return empty array when directory does not exist', async () => {
    const mockReaddir = vi.spyOn(fs, 'readdir').mockRejectedValue(
      Object.assign(new Error('ENOENT'), { code: 'ENOENT' })
    );

    const result = await findLanguageFolders('/path/to/nonexistent');
    expect(result).toEqual([]);

    mockReaddir.mockRestore();
  });

  it('should propagate non-ENOENT errors', async () => {
    const mockReaddir = vi.spyOn(fs, 'readdir').mockRejectedValue(
      new Error('Permission denied')
    );

    await expect(findLanguageFolders('/path/to/nopermission')).rejects.toThrow('Permission denied');

    mockReaddir.mockRestore();
  });
});

describe('findPageFiles', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should find and sort page files for processed language', async () => {
    const mockReaddir = vi.spyOn(fs, 'readdir').mockResolvedValue([
      'document.en-US_page_3.md',
      'document.en-US_page_1.md',
      'document.en-US_page_2.md',
      'readme.txt',
    ] as unknown as Awaited<ReturnType<typeof fs.readdir>>);

    const result = await findPageFiles('/path/to/en-US', 'document', 'en-US', false);

    expect(result).toHaveLength(3);
    expect(result[0].pageNumber).toBe(1);
    expect(result[1].pageNumber).toBe(2);
    expect(result[2].pageNumber).toBe(3);
    expect(result[0].fileName).toBe('document.en-US_page_1.md');

    mockReaddir.mockRestore();
  });

  it('should find and sort page files for raw language', async () => {
    const mockReaddir = vi.spyOn(fs, 'readdir').mockResolvedValue([
      'document.raw.en-US_page_2.md',
      'document.raw.en-US_page_1.md',
    ] as unknown as Awaited<ReturnType<typeof fs.readdir>>);

    const result = await findPageFiles('/path/to/raw.en-US', 'document', 'en-US', true);

    expect(result).toHaveLength(2);
    expect(result[0].pageNumber).toBe(1);
    expect(result[1].pageNumber).toBe(2);
    expect(result[0].fileName).toBe('document.raw.en-US_page_1.md');

    mockReaddir.mockRestore();
  });

  it('should filter out non-matching files', async () => {
    const mockReaddir = vi.spyOn(fs, 'readdir').mockResolvedValue([
      'document.en-US_page_1.md',
      'document.es-ES_page_1.md',  // Wrong language
      'other.en-US_page_1.md',     // Wrong filename
      'readme.txt',
    ] as unknown as Awaited<ReturnType<typeof fs.readdir>>);

    const result = await findPageFiles('/path/to/en-US', 'document', 'en-US', false);

    expect(result).toHaveLength(1);
    expect(result[0].fileName).toBe('document.en-US_page_1.md');

    mockReaddir.mockRestore();
  });

  it('should correctly build file paths', async () => {
    const mockReaddir = vi.spyOn(fs, 'readdir').mockResolvedValue([
      'doc.en-US_page_1.md',
    ] as unknown as Awaited<ReturnType<typeof fs.readdir>>);

    const result = await findPageFiles('/path/to/lang', 'doc', 'en-US', false);

    expect(result[0].filePath).toBe(path.join('/path/to/lang', 'doc.en-US_page_1.md'));

    mockReaddir.mockRestore();
  });

  it('should handle large page numbers', async () => {
    const mockReaddir = vi.spyOn(fs, 'readdir').mockResolvedValue([
      'doc.en-US_page_100.md',
      'doc.en-US_page_999.md',
      'doc.en-US_page_1.md',
    ] as unknown as Awaited<ReturnType<typeof fs.readdir>>);

    const result = await findPageFiles('/path/to/lang', 'doc', 'en-US', false);

    expect(result).toHaveLength(3);
    expect(result[0].pageNumber).toBe(1);
    expect(result[1].pageNumber).toBe(100);
    expect(result[2].pageNumber).toBe(999);

    mockReaddir.mockRestore();
  });

  it('should return empty array when directory does not exist', async () => {
    const mockReaddir = vi.spyOn(fs, 'readdir').mockRejectedValue(
      Object.assign(new Error('ENOENT'), { code: 'ENOENT' })
    );

    const result = await findPageFiles('/path/to/nonexistent', 'doc', 'en-US', false);
    expect(result).toEqual([]);

    mockReaddir.mockRestore();
  });

  it('should propagate non-ENOENT errors', async () => {
    const mockReaddir = vi.spyOn(fs, 'readdir').mockRejectedValue(
      new Error('Permission denied')
    );

    await expect(findPageFiles('/path/to/nopermission', 'doc', 'en-US', false))
      .rejects.toThrow('Permission denied');

    mockReaddir.mockRestore();
  });

  it('should not match raw files when isRaw is false', async () => {
    const mockReaddir = vi.spyOn(fs, 'readdir').mockResolvedValue([
      'doc.en-US_page_1.md',
      'doc.raw.en-US_page_1.md',
    ] as unknown as Awaited<ReturnType<typeof fs.readdir>>);

    const result = await findPageFiles('/path/to/lang', 'doc', 'en-US', false);

    expect(result).toHaveLength(1);
    expect(result[0].fileName).toBe('doc.en-US_page_1.md');

    mockReaddir.mockRestore();
  });

  it('should not match processed files when isRaw is true', async () => {
    const mockReaddir = vi.spyOn(fs, 'readdir').mockResolvedValue([
      'doc.en-US_page_1.md',
      'doc.raw.en-US_page_1.md',
    ] as unknown as Awaited<ReturnType<typeof fs.readdir>>);

    const result = await findPageFiles('/path/to/lang', 'doc', 'en-US', true);

    expect(result).toHaveLength(1);
    expect(result[0].fileName).toBe('doc.raw.en-US_page_1.md');

    mockReaddir.mockRestore();
  });
});

describe('readFileAsString', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should read file contents as UTF-8 string', async () => {
    const mockReadFile = vi.spyOn(fs, 'readFile').mockResolvedValue('file contents');

    const result = await readFileAsString('/path/to/file.txt');

    expect(result).toBe('file contents');
    expect(mockReadFile).toHaveBeenCalledWith('/path/to/file.txt', 'utf-8');

    mockReadFile.mockRestore();
  });

  it('should handle markdown files', async () => {
    const mockContent = '# Title\n\nContent here';
    const mockReadFile = vi.spyOn(fs, 'readFile').mockResolvedValue(mockContent);

    const result = await readFileAsString('/path/to/file.md');

    expect(result).toBe(mockContent);

    mockReadFile.mockRestore();
  });

  it('should handle empty files', async () => {
    const mockReadFile = vi.spyOn(fs, 'readFile').mockResolvedValue('');

    const result = await readFileAsString('/path/to/empty.txt');

    expect(result).toBe('');

    mockReadFile.mockRestore();
  });

  it('should throw error when file does not exist', async () => {
    const mockReadFile = vi.spyOn(fs, 'readFile').mockRejectedValue(
      Object.assign(new Error('ENOENT'), { code: 'ENOENT' })
    );

    await expect(readFileAsString('/path/to/nonexistent')).rejects.toThrow();

    mockReadFile.mockRestore();
  });
});

describe('readFileAsBuffer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should read file contents as buffer', async () => {
    const mockBuffer = Buffer.from('binary data');
    const mockReadFile = vi.spyOn(fs, 'readFile').mockResolvedValue(mockBuffer);

    const result = await readFileAsBuffer('/path/to/file.pdf');

    expect(result).toEqual(mockBuffer);
    expect(mockReadFile).toHaveBeenCalledWith('/path/to/file.pdf');

    mockReadFile.mockRestore();
  });

  it('should handle binary files', async () => {
    const mockBuffer = Buffer.from([0x00, 0x01, 0x02, 0xFF]);
    const mockReadFile = vi.spyOn(fs, 'readFile').mockResolvedValue(mockBuffer);

    const result = await readFileAsBuffer('/path/to/binary.dat');

    expect(result).toEqual(mockBuffer);

    mockReadFile.mockRestore();
  });

  it('should handle empty files', async () => {
    const mockBuffer = Buffer.from([]);
    const mockReadFile = vi.spyOn(fs, 'readFile').mockResolvedValue(mockBuffer);

    const result = await readFileAsBuffer('/path/to/empty.dat');

    expect(result).toEqual(mockBuffer);
    expect(result.length).toBe(0);

    mockReadFile.mockRestore();
  });

  it('should throw error when file does not exist', async () => {
    const mockReadFile = vi.spyOn(fs, 'readFile').mockRejectedValue(
      Object.assign(new Error('ENOENT'), { code: 'ENOENT' })
    );

    await expect(readFileAsBuffer('/path/to/nonexistent')).rejects.toThrow();

    mockReadFile.mockRestore();
  });
});
