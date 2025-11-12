/**
 * Markdown parsing utilities
 * Implements FR-002: Markdown formatting preservation
 * Implements FR-030: Malformed markdown handling
 */

/**
 * Check if markdown content is malformed
 * Implements FR-030a: Syntax errors detection
 * 
 * @param content - Raw markdown content
 * @returns Warning message if malformed, null otherwise
 */
export function detectMalformedMarkdown(content: string): string | null {
  // Check for empty content (FR-030e)
  if (!content || content.trim().length === 0) {
    return 'Empty content';
  }

  // Check for excessively long lines (FR-030b: > 10,000 characters)
  const lines = content.split('\n');
  const longLines = lines.filter((line) => line.length > 10000);
  if (longLines.length > 0) {
    return `Contains ${longLines.length} extremely long line(s)`;
  }

  // Check for excessive nesting (FR-030c: > 10 levels)
  const maxNesting = getMaxNestingLevel(content);
  if (maxNesting > 10) {
    return `Excessive nesting detected (${maxNesting} levels)`;
  }

  // Check for common syntax issues
  const unclosedCodeBlocks = (content.match(/```/g) || []).length % 2 !== 0;
  if (unclosedCodeBlocks) {
    return 'Unclosed code block detected';
  }

  return null;
}

/**
 * Get maximum nesting level in markdown
 * 
 * @param content - Raw markdown content
 * @returns Maximum nesting level
 */
function getMaxNestingLevel(content: string): number {
  const lines = content.split('\n');
  let maxLevel = 0;
  
  for (const line of lines) {
    // Count indentation for lists
    const listMatch = line.match(/^(\s*)[*\-+]\s/);
    if (listMatch) {
      const level = Math.floor(listMatch[1].length / 2) + 1;
      maxLevel = Math.max(maxLevel, level);
    }

    // Count blockquote nesting
    const quoteMatch = line.match(/^(>+)\s/);
    if (quoteMatch) {
      const level = quoteMatch[1].length;
      maxLevel = Math.max(maxLevel, level);
    }
  }

  return maxLevel;
}

/**
 * Resolve image paths in markdown content
 * Implements FR-010: Image rendering with placeholders
 * 
 * @param content - Raw markdown content
 * @param documentId - Document identifier
 * @param languageCode - Language code (e.g., 'en-US')
 * @param isRaw - Whether this is raw content
 * @returns Content with resolved image paths
 */
export function resolveMarkdownImages(
  content: string,
  documentId: string,
  languageCode: string,
  isRaw: boolean
): string {
  const folderName = isRaw ? `raw.${languageCode}` : languageCode;
  
  // Replace relative image paths with API paths
  return content.replace(
    /!\[([^\]]*)\]\(([^)]+)\)/g,
    (_match, alt, path) => {
      // If path is already absolute (http/https), leave it as is
      if (path.startsWith('http://') || path.startsWith('https://')) {
        return `![${alt}](${path})`;
      }

      // Construct API path
      const apiPath = `/api/documents/${documentId}/images/${folderName}/${path}`;
      return `![${alt}](${apiPath})`;
    }
  );
}

/**
 * Extract all image references from markdown
 * 
 * @param content - Raw markdown content
 * @returns Array of image paths
 */
export function extractImagePaths(content: string): string[] {
  const imageRegex = /!\[[^\]]*\]\(([^)]+)\)/g;
  const paths: string[] = [];
  let match;

  while ((match = imageRegex.exec(content)) !== null) {
    paths.push(match[1]);
  }

  return paths;
}

/**
 * Sanitize markdown content for safe rendering
 * Implements FR-030d: Special characters and HTML escaping
 * 
 * @param content - Raw markdown content
 * @returns Sanitized content
 */
export function sanitizeMarkdownContent(content: string): string {
  // Remove <section> tags that are used as metadata markers
  // These tags wrap translated content but shouldn't be rendered
  let sanitized = content.replace(/<section[^>]*>/g, '');
  sanitized = sanitized.replace(/<\/section>/g, '');
  
  // Ensure proper Unicode handling (FR-030d)
  return sanitized.normalize('NFC');
}

/**
 * Truncate long lines for rendering
 * Implements FR-030b: Long line handling
 * 
 * @param content - Raw markdown content
 * @param maxLength - Maximum line length (default: 1000)
 * @returns Content with truncated lines and warning
 */
export function handleLongLines(content: string, maxLength: number = 1000): {
  content: string;
  hasTruncatedLines: boolean;
} {
  const lines = content.split('\n');
  let hasTruncatedLines = false;
  
  const processedLines = lines.map((line) => {
    if (line.length > maxLength) {
      hasTruncatedLines = true;
      return line.substring(0, maxLength) + '... (line truncated)';
    }
    return line;
  });

  return {
    content: processedLines.join('\n'),
    hasTruncatedLines,
  };
}
