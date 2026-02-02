import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  validateEnv,
  getEnvSafe,
  resetEnvCache,
} from '@/lib/utils/env';
import fs from 'fs';
import path from 'path';
import os from 'os';

/**
 * Unit tests for environment validation utilities
 * Tests FR-008: Environment variables validation
 */

describe('env', () => {
  let testDir: string;
  const originalEnv = { ...process.env };

  beforeEach(() => {
    // Create a temporary directory for testing
    testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'env-test-'));
    
    // Reset environment
    process.env = { ...originalEnv };
    resetEnvCache();
  });

  afterEach(() => {
    // Clean up test directory
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
    
    // Restore original environment
    process.env = originalEnv;
    resetEnvCache();
  });

  describe('validateEnv', () => {
    it('should validate environment with all required variables', () => {
      process.env.DATA_FOLDER_PATH = testDir;
      
      const config = validateEnv();
      
      expect(config).toBeDefined();
      expect(config.DATA_FOLDER_PATH).toBe(testDir);
      expect(config.MAX_PDF_SIZE_MB).toBe(50); // default
      expect(config.MEMORY_LIMIT_MB).toBe(500); // default
    });

    it('should throw error when DATA_FOLDER_PATH is missing', () => {
      delete process.env.DATA_FOLDER_PATH;
      
      expect(() => validateEnv()).toThrow('Environment validation failed');
      expect(() => validateEnv()).toThrow('DATA_FOLDER_PATH');
    });

    it('should throw error when DATA_FOLDER_PATH is empty', () => {
      process.env.DATA_FOLDER_PATH = '';
      
      expect(() => validateEnv()).toThrow('DATA_FOLDER_PATH is required');
    });

    it('should throw error when DATA_FOLDER_PATH does not exist', () => {
      process.env.DATA_FOLDER_PATH = '/nonexistent/path';
      
      expect(() => validateEnv()).toThrow('DATA_FOLDER_PATH does not exist');
    });

    it('should throw error when DATA_FOLDER_PATH is a file, not a directory', () => {
      const filePath = path.join(testDir, 'test-file.txt');
      fs.writeFileSync(filePath, 'test');
      
      process.env.DATA_FOLDER_PATH = filePath;
      
      expect(() => validateEnv()).toThrow('DATA_FOLDER_PATH is not a directory');
    });

    it('should use custom MAX_PDF_SIZE_MB when provided', () => {
      process.env.DATA_FOLDER_PATH = testDir;
      process.env.MAX_PDF_SIZE_MB = '100';
      
      const config = validateEnv();
      
      expect(config.MAX_PDF_SIZE_MB).toBe(100);
    });

    it('should use custom MEMORY_LIMIT_MB when provided', () => {
      process.env.DATA_FOLDER_PATH = testDir;
      process.env.MEMORY_LIMIT_MB = '1000';
      
      const config = validateEnv();
      
      expect(config.MEMORY_LIMIT_MB).toBe(1000);
    });

    it('should throw error when MAX_PDF_SIZE_MB exceeds limit', () => {
      process.env.DATA_FOLDER_PATH = testDir;
      process.env.MAX_PDF_SIZE_MB = '501';
      
      expect(() => validateEnv()).toThrow('MAX_PDF_SIZE_MB must be <= 500');
    });

    it('should throw error when MEMORY_LIMIT_MB exceeds limit', () => {
      process.env.DATA_FOLDER_PATH = testDir;
      process.env.MEMORY_LIMIT_MB = '2001';
      
      expect(() => validateEnv()).toThrow('MEMORY_LIMIT_MB must be <= 2000');
    });

    it('should throw error when MAX_PDF_SIZE_MB is not a positive number', () => {
      process.env.DATA_FOLDER_PATH = testDir;
      process.env.MAX_PDF_SIZE_MB = '0';
      
      expect(() => validateEnv()).toThrow('Environment validation failed');
    });

    it('should throw error when MEMORY_LIMIT_MB is not a positive number', () => {
      process.env.DATA_FOLDER_PATH = testDir;
      process.env.MEMORY_LIMIT_MB = '-1';
      
      expect(() => validateEnv()).toThrow('Environment validation failed');
    });

    it('should throw error when MAX_PDF_SIZE_MB is not a number', () => {
      process.env.DATA_FOLDER_PATH = testDir;
      process.env.MAX_PDF_SIZE_MB = 'invalid';
      
      expect(() => validateEnv()).toThrow('Environment validation failed');
    });

    it('should resolve relative DATA_FOLDER_PATH to absolute', () => {
      const relativePath = './test-data';
      const absolutePath = path.resolve(relativePath);
      
      // Create the directory at the resolved absolute path
      if (!fs.existsSync(absolutePath)) {
        fs.mkdirSync(absolutePath, { recursive: true });
      }
      
      process.env.DATA_FOLDER_PATH = relativePath;
      
      try {
        const config = validateEnv();
        
        expect(config.DATA_FOLDER_PATH).toBe(absolutePath);
        expect(path.isAbsolute(config.DATA_FOLDER_PATH)).toBe(true);
      } finally {
        // Clean up
        if (fs.existsSync(absolutePath)) {
          fs.rmSync(absolutePath, { recursive: true, force: true });
        }
      }
    });

    it('should cache validated environment on first call', () => {
      process.env.DATA_FOLDER_PATH = testDir;
      
      const config1 = validateEnv();
      
      // Change environment
      process.env.MAX_PDF_SIZE_MB = '200';
      
      const config2 = validateEnv();
      
      // Should return cached value
      expect(config2).toBe(config1);
      expect(config2.MAX_PDF_SIZE_MB).toBe(50); // Original cached value
    });

    it('should re-validate after cache reset', () => {
      process.env.DATA_FOLDER_PATH = testDir;
      process.env.MAX_PDF_SIZE_MB = '100';
      
      const config1 = validateEnv();
      expect(config1.MAX_PDF_SIZE_MB).toBe(100);
      
      resetEnvCache();
      
      process.env.MAX_PDF_SIZE_MB = '200';
      
      const config2 = validateEnv();
      expect(config2.MAX_PDF_SIZE_MB).toBe(200);
    });

    it('should handle DATA_FOLDER_PATH with spaces', () => {
      const dirWithSpaces = path.join(testDir, 'folder with spaces');
      fs.mkdirSync(dirWithSpaces);
      
      process.env.DATA_FOLDER_PATH = dirWithSpaces;
      
      const config = validateEnv();
      
      expect(config.DATA_FOLDER_PATH).toBe(dirWithSpaces);
    });

    it('should handle DATA_FOLDER_PATH with special characters', () => {
      const dirWithSpecialChars = path.join(testDir, 'folder-with_special.chars');
      fs.mkdirSync(dirWithSpecialChars);
      
      process.env.DATA_FOLDER_PATH = dirWithSpecialChars;
      
      const config = validateEnv();
      
      expect(config.DATA_FOLDER_PATH).toBe(dirWithSpecialChars);
    });

    it('should accept MAX_PDF_SIZE_MB at maximum limit (500)', () => {
      process.env.DATA_FOLDER_PATH = testDir;
      process.env.MAX_PDF_SIZE_MB = '500';
      
      const config = validateEnv();
      
      expect(config.MAX_PDF_SIZE_MB).toBe(500);
    });

    it('should accept MEMORY_LIMIT_MB at maximum limit (2000)', () => {
      process.env.DATA_FOLDER_PATH = testDir;
      process.env.MEMORY_LIMIT_MB = '2000';
      
      const config = validateEnv();
      
      expect(config.MEMORY_LIMIT_MB).toBe(2000);
    });

    it('should accept MAX_PDF_SIZE_MB at minimum (1)', () => {
      process.env.DATA_FOLDER_PATH = testDir;
      process.env.MAX_PDF_SIZE_MB = '1';
      
      const config = validateEnv();
      
      expect(config.MAX_PDF_SIZE_MB).toBe(1);
    });
  });

  describe('getEnvSafe', () => {
    it('should return config when validation succeeds', () => {
      process.env.DATA_FOLDER_PATH = testDir;
      
      const config = getEnvSafe();
      
      expect(config).toBeDefined();
      expect(config?.DATA_FOLDER_PATH).toBe(testDir);
    });

    it('should return null when validation fails', () => {
      delete process.env.DATA_FOLDER_PATH;
      
      const config = getEnvSafe();
      
      expect(config).toBeNull();
    });

    it('should return null when DATA_FOLDER_PATH does not exist', () => {
      process.env.DATA_FOLDER_PATH = '/nonexistent/path';
      
      const config = getEnvSafe();
      
      expect(config).toBeNull();
    });

    it('should return cached config on subsequent calls', () => {
      process.env.DATA_FOLDER_PATH = testDir;
      
      const config1 = getEnvSafe();
      const config2 = getEnvSafe();
      
      expect(config1).toBe(config2);
    });

    it('should not throw errors', () => {
      process.env.DATA_FOLDER_PATH = '/invalid/path';
      
      expect(() => getEnvSafe()).not.toThrow();
    });
  });

  describe('resetEnvCache', () => {
    it('should clear cached environment', () => {
      process.env.DATA_FOLDER_PATH = testDir;
      process.env.MAX_PDF_SIZE_MB = '100';
      
      const config1 = validateEnv();
      expect(config1.MAX_PDF_SIZE_MB).toBe(100);
      
      resetEnvCache();
      
      // Change and validate again
      process.env.MAX_PDF_SIZE_MB = '200';
      const config2 = validateEnv();
      
      expect(config2.MAX_PDF_SIZE_MB).toBe(200);
      expect(config1).not.toBe(config2);
    });

    it('should allow re-validation after reset', () => {
      process.env.DATA_FOLDER_PATH = testDir;
      
      validateEnv();
      resetEnvCache();
      
      // Should not throw
      expect(() => validateEnv()).not.toThrow();
    });

    it('should handle multiple resets', () => {
      process.env.DATA_FOLDER_PATH = testDir;
      
      validateEnv();
      resetEnvCache();
      resetEnvCache();
      resetEnvCache();
      
      expect(() => validateEnv()).not.toThrow();
    });
  });
});
