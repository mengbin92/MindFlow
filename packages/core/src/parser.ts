/**
 * @fileoverview Markdown 解析器
 * @description 基于 marked 库实现的 Markdown 到 HTML 的解析器
 * @module packages/core/parser
 * @author MindFlow Team
 * @license MIT
 */

import { marked, MarkedOptions } from 'marked';
import { extendedSyntaxProcessor } from './extended-syntax';

/**
 * Markdown 解析器类
 * @description 将 Markdown 文本解析为 HTML，支持 GFM（GitHub Flavored Markdown）
 */
export class MarkdownParser {
  private options: MarkedOptions;

  /**
   * 创建 Markdown 解析器实例
   * @description 构造函数中会配置 marked 的默认选项
   */
  constructor() {
    // 配置 marked 选项
    this.options = {
      breaks: true,    // 将单个换行符转换为 <br> 标签
      gfm: true,       // 启用 GitHub 风格的 Markdown (GFM)
      mangle: false,   // 不修改邮箱地址
      headerIds: false, // 不自动生成标题ID
    } as MarkedOptions;
  }

  /**
   * 同步解析 Markdown 文本
   * @param markdown - 要解析的 Markdown 文本
   * @returns 解析后的 HTML 字符串
   * @example
   * ```ts
   * const parser = new MarkdownParser();
   * const html = parser.parse('# Hello\n\nThis is **bold** text.');
   * // 返回: '<h1>Hello</h1>\n<p>This is <strong>bold</strong> text.</p>\n'
   * ```
   */
  parse(markdown: string): string {
    // 安全检查
    if (markdown === null || markdown === undefined) {
      return '';
    }

    if (typeof markdown !== 'string') {
      console.warn('MarkdownParser.parse received non-string input:', typeof markdown);
      return String(markdown);
    }

    try {
      // 先处理扩展语法（LaTeX、Mermaid等）
      const processedMarkdown = extendedSyntaxProcessor.processExtendedSyntax(markdown);

      // 使用 marked.parse 解析
      // 注意：marked.parse 在 v11+ 中默认是异步的，但在大多数情况下会同步返回
      const result = marked.parse(processedMarkdown, this.options);

      // 如果返回Promise（理论上不应该发生，但作为安全检查）
      if (result instanceof Promise) {
        console.warn('marked.parse returned Promise unexpectedly');
        return '<p>Loading...</p>';
      }

      return result;
    } catch (error) {
      // 详细的错误处理
      console.error('=== Markdown Parsing Error ===');
      console.error('Error:', error);
      console.error('Error name:', error instanceof Error ? error.name : 'Unknown');
      console.error('Error message:', error instanceof Error ? error.message : String(error));
      console.error('Markdown preview (first 200 chars):', markdown.substring(0, 200));

      // 返回友好的错误提示
      return `<div class="markdown-error" style="padding: 1rem; border: 1px solid #f00; border-radius: 4px; background: #fee; color: #c00;">
        <strong>⚠️ Markdown解析错误</strong><br>
        <code style="white-space: pre-wrap;">${this.escapeHtml(error instanceof Error ? error.message : String(error))}</code>
        <details style="margin-top: 0.5rem;">
          <summary style="cursor: pointer;">查看原始内容</summary>
          <pre style="white-space: pre-wrap; word-wrap: break-word; margin-top: 0.5rem; padding: 0.5rem; background: white; border-radius: 4px;">${this.escapeHtml(markdown)}</pre>
        </details>
      </div>`;
    }
  }

  /**
   * 异步解析 Markdown 文本
   * @description 对于大文档，使用异步解析可以避免阻塞主线程
   * @param markdown - 要解析的 Markdown 文本
   * @returns 解析后的 HTML 字符串的 Promise
   * @example
   * ```ts
   * const parser = new MarkdownParser();
   * const html = await parser.parseAsync('# Hello\n\n');
   * ```
   */
  async parseAsync(markdown: string): Promise<string> {
    // 安全检查
    if (markdown === null || markdown === undefined) {
      return '';
    }

    if (typeof markdown !== 'string') {
      return String(markdown);
    }

    try {
      // 先处理扩展语法
      const processedMarkdown = extendedSyntaxProcessor.processExtendedSyntax(markdown);

      // 异步解析
      const html = await marked.parse(processedMarkdown, this.options);
      return html;
    } catch (error) {
      console.error('Async markdown parsing error:', error);
      return `<div class="markdown-error">Markdown解析错误: ${error instanceof Error ? error.message : String(error)}</div>`;
    }
  }

  /**
   * 配置解析器选项
   * @description 允许自定义 marked 的解析行为
   * @param options - marked 库的配置选项
   * @example
   * ```ts
   * const parser = new MarkdownParser();
   * parser.configure({
   *   gfm: false,
   *   breaks: false,
   * });
   * ```
   */
  configure(options: Partial<MarkedOptions>): void {
    this.options = { ...this.options, ...options };
  }

  /**
   * 渲染需要延迟处理的扩展语法（Mermaid、Markmap、PlantUML）
   * @description 在 HTML 插入 DOM 后调用此方法来渲染动态内容
   * @param container - 包含扩展语法元素的容器
   * @example
   * ```ts
   * const parser = new MarkdownParser();
   * const html = parser.parse(markdown);
   * container.innerHTML = html;
   * await parser.renderExtendedSyntax(container);
   * ```
   */
  async renderExtendedSyntax(container: HTMLElement): Promise<void> {
    await extendedSyntaxProcessor.renderExtendedSyntax(container);
  }

  /**
   * 转义HTML特殊字符
   * @param text - 要转义的文本
   * @returns 转义后的文本
   */
  private escapeHtml(text: string): string {
    if (!text) return '';
    const htmlEscapes: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    };
    return text.replace(/[&<>"']/g, char => htmlEscapes[char] || char);
  }
}

/**
 * 全局 Markdown 解析器实例
 * @description 导出的单例实例，可直接使用而无需手动创建
 * @example
 * ```ts
 * import { parser } from '@mindflow/core';
 * const html = parser.parse('# Hello');
 * ```
 */
export const parser = new MarkdownParser();
