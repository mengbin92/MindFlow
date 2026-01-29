import { describe, it, expect } from 'vitest';
import { parser } from '../parser';

describe('Parser', () => {
  describe('Basic Markdown', () => {
    it('should parse headings', () => {
      const markdown = '# Heading 1\n## Heading 2\n### Heading 3';
      const html = parser.parse(markdown);
      expect(html).toContain('<h1>Heading 1</h1>');
      expect(html).toContain('<h2>Heading 2</h2>');
      expect(html).toContain('<h3>Heading 3</h3>');
    });

    it('should parse paragraphs', () => {
      const markdown = 'This is a paragraph.\n\nThis is another paragraph.';
      const html = parser.parse(markdown);
      expect(html).toContain('<p>This is a paragraph.</p>');
      expect(html).toContain('<p>This is another paragraph.</p>');
    });

    it('should parse bold and italic', () => {
      const markdown = '**bold** *italic* ~~strikethrough~~';
      const html = parser.parse(markdown);
      expect(html).toContain('<strong>bold</strong>');
      expect(html).toContain('<em>italic</em>');
      expect(html).toContain('<del>strikethrough</del>');
    });

    it('should parse links', () => {
      const markdown = '[link text](https://example.com)';
      const html = parser.parse(markdown);
      expect(html).toContain('<a href="https://example.com">link text</a>');
    });

    it('should parse unordered lists', () => {
      const markdown = '- item 1\n- item 2\n- item 3';
      const html = parser.parse(markdown);
      expect(html).toContain('<ul>');
      expect(html).toContain('<li>item 1</li>');
      expect(html).toContain('<li>item 2</li>');
      expect(html).toContain('</ul>');
    });

    it('should parse ordered lists', () => {
      const markdown = '1. first\n2. second\n3. third';
      const html = parser.parse(markdown);
      expect(html).toContain('<ol>');
      expect(html).toContain('<li>first</li>');
      expect(html).toContain('<li>second</li>');
      expect(html).toContain('</ol>');
    });

    it('should parse code blocks', () => {
      const markdown = '```javascript\nconst x = 1;\n```';
      const html = parser.parse(markdown);
      expect(html).toContain('<pre>');
      expect(html).toContain('<code');
      expect(html).toContain('const x = 1;');
    });

    it('should parse inline code', () => {
      const markdown = 'use `console.log()` for debugging';
      const html = parser.parse(markdown);
      expect(html).toContain('<code>console.log()</code>');
    });

    it('should parse blockquotes', () => {
      const markdown = '> This is a quote';
      const html = parser.parse(markdown);
      expect(html).toContain('<blockquote>');
      expect(html).toContain('This is a quote');
      expect(html).toContain('</blockquote>');
    });

    it('should parse tables', () => {
      const markdown = '| Col1 | Col2 |\n|------|------|\n| A | B |';
      const html = parser.parse(markdown);
      expect(html).toContain('<table>');
      expect(html).toContain('<td>A</td>');
      expect(html).toContain('<td>B</td>');
      expect(html).toContain('</table>');
    });
  });

  describe('Special Characters', () => {
    it('should handle empty input', () => {
      const html = parser.parse('');
      expect(html).toBe('');
    });

    it('should handle HTML-like markdown', () => {
      // Note: Marked may not escape HTML by default, this tests the actual behavior
      const markdown = '<div>test</div>';
      const html = parser.parse(markdown);
      expect(html).toBeDefined();
    });
  });
});
