import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import { preventPathTraversal, validateFilename } from './security';
import { validateEnv } from './env';

/**
 * File system utility functions for document scanning and validation
 * Implements secure file system access with path traversal prevention
 */

/**
 * Check if a file or directory exists
 * 
 * @param filePath - Absolute path to check
 * @returns True if exists, false otherwise
 */
export async function exists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if a file or directory exists (synchronous)
 * 
 * @param filePath - Absolute path to check
 * @returns True if exists, false otherwise
 */
export function existsSync(filePath: string): boolean {
  try {
    fsSync.accessSync(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get file size in bytes
 * 
 * @param filePath - Absolute path to file
 * @returns File size in bytes
 * @throws Error if file doesn't exist
 */
export async function getFileSize(filePath: string): Promise<number> {
  const stats = await fs.stat(filePath);
  return stats.size;
}

/**
 * Read directory contents
 * 
 * @param dirPath - Absolute path to directory
 * @returns Array of filenames in the directory
 * @throws Error if directory doesn't exist or can't be read
 */
export async function readDirectory(dirPath: string): Promise<string[]> {
  return await fs.readdir(dirPath);
}

/**
 * Scan the data folder for PDF files
 * Returns list of PDF files with their base names (without .pdf extension)
 * 
 * @returns Array of objects with fileName and pdfPath
 */
export async function scanDataFolder(): Promise<Array<{ fileName: string; pdfPath: string }>> {
  const env = validateEnv();
  const dataFolder = env.DATA_FOLDER_PATH;

  try {
    const files = await readDirectory(dataFolder);
    
    const pdfFiles = files
      .filter((file) => file.toLowerCase().endsWith('.pdf'))
      .map((file) => {
        const fileName = path.basename(file, '.pdf');
        const pdfPath = path.join(dataFolder, file);
        return { fileName, pdfPath };
      });

    return pdfFiles;
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      throw new Error(`Data folder not found: ${dataFolder}`);
    }
    throw error;
  }
}

/**
 * Get the document folder path for a given PDF file
 * The folder should have the same base name as the PDF (without extension)
 * 
 * @param fileName - Base filename (without extension)
 * @returns Absolute path to document folder
 */
export function getDocumentFolderPath(fileName: string): string {
  const env = validateEnv();
  const dataFolder = env.DATA_FOLDER_PATH;
  
  // Validate filename to prevent path traversal
  validateFilename(fileName);
  
  const folderPath = path.join(dataFolder, fileName);
  return preventPathTraversal(folderPath, dataFolder);
}

/**
 * Get the PDF file path for a given filename
 * 
 * @param fileName - Base filename (without extension)
 * @returns Absolute path to PDF file
 */
export function getPdfFilePath(fileName: string): string {
  const env = validateEnv();
  const dataFolder = env.DATA_FOLDER_PATH;
  
  // Validate filename to prevent path traversal
  validateFilename(fileName);
  
  const pdfPath = path.join(dataFolder, `${fileName}.pdf`);
  return preventPathTraversal(pdfPath, dataFolder);
}

/**
 * Find language folders within a document folder
 * Looks for folders matching patterns:
 * - <lang-COUNTRY> (processed translation)
 * - raw.<lang-COUNTRY> (raw OCR output)
 * 
 * @param documentFolderPath - Absolute path to document folder
 * @returns Array of language folder names
 */
export async function findLanguageFolders(documentFolderPath: string): Promise<string[]> {
  try {
    const items = await readDirectory(documentFolderPath);
    
    // Filter for language folders matching the pattern
    const languageFolders = items.filter((item) => {
      const itemPath = path.join(documentFolderPath, item);
      
      // Check if it's a directory
      if (!fsSync.statSync(itemPath).isDirectory()) {
        return false;
      }
      
      // Check if it matches language folder patterns
      const langPattern = /^(raw\.)?[a-z]{2,3}-[A-Z]{2}$/;
      return langPattern.test(item);
    });

    return languageFolders;
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      return [];
    }
    throw error;
  }
}

/**
 * Find markdown page files in a language folder
 * Looks for files matching pattern: <fileName>.[raw.]<lang-COUNTRY>_page_<N>.md
 * 
 * @param languageFolderPath - Absolute path to language folder
 * @param fileName - Base filename (without extension)
 * @param languageCode - Language code (e.g., en-US)
 * @param isRaw - Whether this is a raw folder
 * @returns Array of page file info objects
 */
export async function findPageFiles(
  languageFolderPath: string,
  fileName: string,
  languageCode: string,
  isRaw: boolean
): Promise<Array<{ pageNumber: number; filePath: string; fileName: string }>> {
  try {
    const files = await readDirectory(languageFolderPath);
    
    // Build expected pattern: <fileName>.[raw.]<lang-COUNTRY>_page_<N>.md
    const rawPrefix = isRaw ? 'raw.' : '';
    const pattern = new RegExp(
      `^${fileName}\\.${rawPrefix}${languageCode}_page_(\\d+)\\.md$`
    );

    const pageFiles = files
      .map((file) => {
        const match = pattern.exec(file);
        if (!match) return null;

        const pageNumber = parseInt(match[1], 10);
        const filePath = path.join(languageFolderPath, file);

        return {
          pageNumber,
          filePath,
          fileName: file,
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null)
      .sort((a, b) => a.pageNumber - b.pageNumber);

    return pageFiles;
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      return [];
    }
    throw error;
  }
}

/**
 * Read file contents as string
 * 
 * @param filePath - Absolute path to file
 * @returns File contents as string
 */
export async function readFileAsString(filePath: string): Promise<string> {
  return await fs.readFile(filePath, 'utf-8');
}

/**
 * Read file contents as buffer
 * 
 * @param filePath - Absolute path to file
 * @returns File contents as buffer
 */
export async function readFileAsBuffer(filePath: string): Promise<Buffer> {
  return await fs.readFile(filePath);
}
