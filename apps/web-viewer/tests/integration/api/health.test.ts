import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GET } from '@/app/api/health/route';
import * as envModule from '@/lib/utils/env';
import * as fileSystemModule from '@/lib/utils/file-system';

// Mock modules
vi.mock('@/lib/utils/env');
vi.mock('@/lib/utils/file-system');

describe('GET /api/health', () => {
  const mockValidateEnv = vi.mocked(envModule.validateEnv);
  const mockExists = vi.mocked(fileSystemModule.exists);

  beforeEach(() => {
    vi.clearAllMocks();
    // Set default mock implementation
    mockValidateEnv.mockReturnValue({
      DATA_FOLDER_PATH: '/mock/data',
      MAX_PDF_SIZE_MB: 50,
      MEMORY_LIMIT_MB: 500,
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should return 200 OK when application is healthy', async () => {
    mockExists.mockResolvedValue(true);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toMatchObject({
      status: 'ok',
      dataFolderAccessible: true,
    });
    expect(data.timestamp).toBeDefined();
    expect(data.version).toBeDefined();
  });

  it('should return 503 when data folder is not accessible', async () => {
    mockExists.mockResolvedValue(false);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(503);
    expect(data).toMatchObject({
      status: 'error',
      dataFolderAccessible: false,
      message: 'Data folder not accessible',
    });
    expect(data.timestamp).toBeDefined();
    expect(data.version).toBeDefined();
  });

  it('should return 503 when environment validation fails', async () => {
    mockValidateEnv.mockImplementation(() => {
      throw new Error('DATA_FOLDER_PATH not configured');
    });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(503);
    expect(data).toMatchObject({
      status: 'error',
      dataFolderAccessible: false,
    });
    expect(data.message).toContain('DATA_FOLDER_PATH not configured');
  });

  it('should include version from package.json', async () => {
    mockExists.mockResolvedValue(true);
    process.env.npm_package_version = '2.5.0';

    const response = await GET();
    const data = await response.json();

    expect(data.version).toBe('2.5.0');

    delete process.env.npm_package_version;
  });

  it('should default to version 1.0.0 when package version not available', async () => {
    mockExists.mockResolvedValue(true);
    delete process.env.npm_package_version;

    const response = await GET();
    const data = await response.json();

    expect(data.version).toBe('1.0.0');
  });

  it('should include Cache-Control header in response', async () => {
    mockExists.mockResolvedValue(true);

    const response = await GET();

    expect(response.headers.get('Cache-Control')).toBe('no-cache, no-store, must-revalidate');
  });

  it('should include ISO 8601 timestamp', async () => {
    mockExists.mockResolvedValue(true);

    const response = await GET();
    const data = await response.json();

    // Verify timestamp is valid ISO 8601 format
    expect(data.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    expect(new Date(data.timestamp).toISOString()).toBe(data.timestamp);
  });

  it('should handle unexpected errors gracefully', async () => {
    mockExists.mockRejectedValue(new Error('Filesystem error'));

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(503);
    expect(data.status).toBe('error');
    expect(data.message).toContain('Filesystem error');
  });
});
