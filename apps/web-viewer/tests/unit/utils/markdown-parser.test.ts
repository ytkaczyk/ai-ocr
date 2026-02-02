import { describe, it, expect } from 'vitest';
import {
  detectMalformedMarkdown,
  resolveMarkdownImages,
  extractImagePaths,
  sanitizeMarkdownContent,
  handleLongLines,
} from '@/lib/utils/markdown-parser';

/**
 * Unit tests for markdown parsing utilities
 * Tests FR-002: Markdown formatting preservation
 * Tests FR-030: Malformed markdown handling
 */

describe('markdown-parser', () => {
  describe('detectMalformedMarkdown', () => {
    it('should return null for valid markdown', () => {
      const content = '# Title\n\nThis is a paragraph.\n\n- Item 1\n- Item 2';
      
      expect(detectMalformedMarkdown(content)).toBeNull();
    });

    it('should detect empty content', () => {
      expect(detectMalformedMarkdown('')).toBe('Empty content');
      expect(detectMalformedMarkdown('   ')).toBe('Empty content');
      expect(detectMalformedMarkdown('\n\n')).toBe('Empty content');
    });

    it('should detect excessively long lines (> 10,000 characters)', () => {
      const longLine = 'a'.repeat(10001);
      const content = `# Title\n${longLine}\n`;
      
      expect(detectMalformedMarkdown(content)).toBe('Contains 1 extremely long line(s)');
    });

    it('should detect multiple long lines', () => {
      const longLine1 = 'a'.repeat(10001);
      const longLine2 = 'b'.repeat(15000);
      const content = `${longLine1}\n\nNormal line\n\n${longLine2}`;
      
      expect(detectMalformedMarkdown(content)).toBe('Contains 2 extremely long line(s)');
    });

    it('should accept lines at exactly 10,000 characters', () => {
      const line = 'a'.repeat(10000);
      const content = `# Title\n${line}\n`;
      
      expect(detectMalformedMarkdown(content)).toBeNull();
    });

    it('should detect excessive nesting (> 10 levels)', () => {
      // 11 list items with 2-space indentation = 11 levels
      const deeply = Array(11).fill(null).map((_, i) => '  '.repeat(i) + '- Item').join('\n');
      const content = `# Title\n${deeply}`;
      
      const result = detectMalformedMarkdown(content);
      expect(result).toContain('Excessive nesting detected');
      expect(result).toContain('levels');
    });

    it('should accept nesting at exactly 10 levels', () => {
      // 10 list items with 2-space indentation = 10 levels
      const nested = Array(10).fill(null).map((_, i) => '  '.repeat(i) + '- Item').join('\n');
      const content = `# Title\n${nested}`;
      
      expect(detectMalformedMarkdown(content)).toBeNull();
    });

    it('should detect unclosed code blocks', () => {
      const content = '# Title\n\n```javascript\ncode here';
      
      expect(detectMalformedMarkdown(content)).toBe('Unclosed code block detected');
    });

    it('should accept properly closed code blocks', () => {
      const content = '# Title\n\n```javascript\ncode here\n```';
      
      expect(detectMalformedMarkdown(content)).toBeNull();
    });

    it('should handle multiple code blocks', () => {
      const content = '# Title\n\n```js\ncode\n```\n\n```python\ncode\n```';
      
      expect(detectMalformedMarkdown(content)).toBeNull();
    });

    it('should detect blockquote nesting', () => {
      const nested = '>>>>>>>>>>>>>> Quote'; // 14 levels
      const content = `# Title\n${nested}`;
      
      expect(detectMalformedMarkdown(content)).toBe('Excessive nesting detected (14 levels)');
    });

    it('should handle mixed list and quote nesting', () => {
      const content = `# Title\n>> Quote\n  - Item\n    - Nested`;
      
      expect(detectMalformedMarkdown(content)).toBeNull();
    });

    it('should handle complex valid markdown', () => {
      const content = `
# Heading 1
## Heading 2

This is a paragraph with **bold** and *italic* text.

- List item 1
  - Nested item
- List item 2

> Blockquote
> > Nested blockquote

\`\`\`javascript
const code = "example";
\`\`\`

![Image](image.jpg)
`;
      
      expect(detectMalformedMarkdown(content)).toBeNull();
    });
  });

  describe('resolveMarkdownImages', () => {
    it('should resolve relative image paths', () => {
      const content = '![Alt text](image.jpg)';
      const result = resolveMarkdownImages(content, 'doc1', 'en-US', false);
      
      expect(result).toBe('![Alt text](/api/documents/doc1/images/en-US/image.jpg)');
    });

    it('should handle raw content folder structure', () => {
      const content = '![Alt text](image.jpg)';
      const result = resolveMarkdownImages(content, 'doc1', 'en-US', true);
      
      expect(result).toBe('![Alt text](/api/documents/doc1/images/raw.en-US/image.jpg)');
    });

    it('should preserve absolute HTTP URLs', () => {
      const content = '![Alt text](http://example.com/image.jpg)';
      const result = resolveMarkdownImages(content, 'doc1', 'en-US', false);
      
      expect(result).toBe('![Alt text](http://example.com/image.jpg)');
    });

    it('should preserve absolute HTTPS URLs', () => {
      const content = '![Alt text](https://example.com/image.jpg)';
      const result = resolveMarkdownImages(content, 'doc1', 'en-US', false);
      
      expect(result).toBe('![Alt text](https://example.com/image.jpg)');
    });

    it('should handle multiple images', () => {
      const content = '![Image 1](img1.jpg)\n\n![Image 2](img2.png)';
      const result = resolveMarkdownImages(content, 'doc1', 'en-US', false);
      
      expect(result).toContain('![Image 1](/api/documents/doc1/images/en-US/img1.jpg)');
      expect(result).toContain('![Image 2](/api/documents/doc1/images/en-US/img2.png)');
    });

    it('should handle images with paths', () => {
      const content = '![Alt text](subfolder/image.jpg)';
      const result = resolveMarkdownImages(content, 'doc1', 'en-US', false);
      
      expect(result).toBe('![Alt text](/api/documents/doc1/images/en-US/subfolder/image.jpg)');
    });

    it('should handle images without alt text', () => {
      const content = '![](image.jpg)';
      const result = resolveMarkdownImages(content, 'doc1', 'en-US', false);
      
      expect(result).toBe('![](/api/documents/doc1/images/en-US/image.jpg)');
    });

    it('should handle images with simple alt text', () => {
      const content = '![Image description](image.jpg)';
      const result = resolveMarkdownImages(content, 'doc1', 'en-US', false);
      
      expect(result).toBe('![Image description](/api/documents/doc1/images/en-US/image.jpg)');
    });

    it('should handle different language codes', () => {
      const content = '![Alt](image.jpg)';
      const result = resolveMarkdownImages(content, 'doc1', 'fr-FR', false);
      
      expect(result).toBe('![Alt](/api/documents/doc1/images/fr-FR/image.jpg)');
    });

    it('should handle mix of relative and absolute URLs', () => {
      const content = '![Local](local.jpg)\n![Remote](https://example.com/remote.jpg)';
      const result = resolveMarkdownImages(content, 'doc1', 'en-US', false);
      
      expect(result).toContain('![Local](/api/documents/doc1/images/en-US/local.jpg)');
      expect(result).toContain('![Remote](https://example.com/remote.jpg)');
    });
  });

  describe('extractImagePaths', () => {
    it('should extract single image path', () => {
      const content = '![Alt text](image.jpg)';
      const paths = extractImagePaths(content);
      
      expect(paths).toEqual(['image.jpg']);
    });

    it('should extract multiple image paths', () => {
      const content = '![Image 1](img1.jpg)\n\n![Image 2](img2.png)';
      const paths = extractImagePaths(content);
      
      expect(paths).toEqual(['img1.jpg', 'img2.png']);
    });

    it('should return empty array when no images', () => {
      const content = '# Title\n\nJust text content.';
      const paths = extractImagePaths(content);
      
      expect(paths).toEqual([]);
    });

    it('should extract paths with subfolders', () => {
      const content = '![Alt](subfolder/image.jpg)';
      const paths = extractImagePaths(content);
      
      expect(paths).toEqual(['subfolder/image.jpg']);
    });

    it('should extract absolute URLs', () => {
      const content = '![Alt](https://example.com/image.jpg)';
      const paths = extractImagePaths(content);
      
      expect(paths).toEqual(['https://example.com/image.jpg']);
    });

    it('should handle images without alt text', () => {
      const content = '![](image.jpg)';
      const paths = extractImagePaths(content);
      
      expect(paths).toEqual(['image.jpg']);
    });

    it('should extract all paths including duplicates', () => {
      const content = '![A](img.jpg)\n![B](img.jpg)';
      const paths = extractImagePaths(content);
      
      expect(paths).toEqual(['img.jpg', 'img.jpg']);
    });
  });

  describe('sanitizeMarkdownContent', () => {
    it('should remove opening section tags', () => {
      const content = '<section>Content here</section>';
      const result = sanitizeMarkdownContent(content);
      
      expect(result).toBe('Content here');
    });

    it('should remove section tags with attributes', () => {
      const content = '<section class="test" id="mySection">Content</section>';
      const result = sanitizeMarkdownContent(content);
      
      expect(result).toBe('Content');
    });

    it('should remove multiple section tags', () => {
      const content = '<section>Part 1</section>\n<section>Part 2</section>';
      const result = sanitizeMarkdownContent(content);
      
      expect(result).toBe('Part 1\nPart 2');
    });

    it('should preserve other markdown formatting', () => {
      const content = '<section># Title\n\n**Bold** text</section>';
      const result = sanitizeMarkdownContent(content);
      
      expect(result).toBe('# Title\n\n**Bold** text');
    });

    it('should normalize Unicode to NFC', () => {
      // Create NFD string (decomposed)
      const nfd = 'café'.normalize('NFD');
      const result = sanitizeMarkdownContent(nfd);
      
      expect(result).toBe('café');
      expect(result.normalize('NFC')).toBe(result);
    });

    it('should handle content without section tags', () => {
      const content = '# Title\n\nRegular content';
      const result = sanitizeMarkdownContent(content);
      
      expect(result).toBe('# Title\n\nRegular content');
    });

    it('should handle empty content', () => {
      const result = sanitizeMarkdownContent('');
      
      expect(result).toBe('');
    });

    it('should handle nested section tags', () => {
      const content = '<section><section>Nested</section></section>';
      const result = sanitizeMarkdownContent(content);
      
      expect(result).toBe('Nested');
    });

    it('should preserve other HTML-like tags', () => {
      const content = '<section><div>Content</div></section>';
      const result = sanitizeMarkdownContent(content);
      
      expect(result).toBe('<div>Content</div>');
    });
  });

  describe('handleLongLines', () => {
    it('should not truncate lines under max length', () => {
      const content = 'Short line\nAnother short line';
      const result = handleLongLines(content, 1000);
      
      expect(result.content).toBe(content);
      expect(result.hasTruncatedLines).toBe(false);
    });

    it('should truncate lines over max length', () => {
      const longLine = 'a'.repeat(1001);
      const content = `Short\n${longLine}\nShort`;
      const result = handleLongLines(content, 1000);
      
      expect(result.content).toContain('a'.repeat(1000));
      expect(result.content).toContain('... (line truncated)');
      expect(result.hasTruncatedLines).toBe(true);
    });

    it('should use default max length of 1000', () => {
      const longLine = 'a'.repeat(1001);
      const content = longLine;
      const result = handleLongLines(content);
      
      expect(result.content).toHaveLength(1000 + '... (line truncated)'.length);
      expect(result.hasTruncatedLines).toBe(true);
    });

    it('should truncate multiple long lines', () => {
      const line1 = 'a'.repeat(1001);
      const line2 = 'b'.repeat(1001);
      const content = `${line1}\n${line2}`;
      const result = handleLongLines(content, 1000);
      
      expect(result.content).toContain('a'.repeat(1000) + '... (line truncated)');
      expect(result.content).toContain('b'.repeat(1000) + '... (line truncated)');
      expect(result.hasTruncatedLines).toBe(true);
    });

    it('should preserve all short lines', () => {
      const content = 'Line 1\nLine 2\nLine 3';
      const result = handleLongLines(content, 1000);
      
      expect(result.content).toBe(content);
      expect(result.hasTruncatedLines).toBe(false);
    });

    it('should handle lines exactly at max length', () => {
      const line = 'a'.repeat(1000);
      const content = line;
      const result = handleLongLines(content, 1000);
      
      expect(result.content).toBe(line);
      expect(result.hasTruncatedLines).toBe(false);
    });

    it('should handle custom max length', () => {
      const line = 'a'.repeat(101);
      const content = line;
      const result = handleLongLines(content, 100);
      
      expect(result.content).toBe('a'.repeat(100) + '... (line truncated)');
      expect(result.hasTruncatedLines).toBe(true);
    });

    it('should handle empty content', () => {
      const result = handleLongLines('', 1000);
      
      expect(result.content).toBe('');
      expect(result.hasTruncatedLines).toBe(false);
    });

    it('should preserve line breaks', () => {
      const line1 = 'a'.repeat(1001);
      const line2 = 'Short';
      const content = `${line1}\n${line2}`;
      const result = handleLongLines(content, 1000);
      
      const lines = result.content.split('\n');
      expect(lines).toHaveLength(2);
      expect(lines[1]).toBe('Short');
    });

    it('should handle single character lines', () => {
      const content = 'a\nb\nc';
      const result = handleLongLines(content, 1000);
      
      expect(result.content).toBe(content);
      expect(result.hasTruncatedLines).toBe(false);
    });
  });
});
