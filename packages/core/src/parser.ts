/**
 * @fileoverview Markdown 解析器
 * @description 基于 marked 库实现的 Markdown 到 HTML 的解析器
 * @module packages/core/parser
 * @author MindFlow Team
 * @license MIT
 */

import { marked } from 'marked';

/**
 * Markdown 解析器类
 * @description 将 Markdown 文本解析为 HTML，支持 GFM（GitHub Flavored Markdown）
 */
export class MarkdownParser {
  /**
   * 创建 Markdown 解析器实例
   * @description 构造函数中会配置 marked 的默认选项
   */
  constructor() {
    // 配置 marked 默认选项
    marked.setOptions({
      // 将单个换行符转换为 <br> 标签
      breaks: true,
      // 启用 GitHub 风格的 Markdown (GFM)
      // 支持：表格、删除线、自动链接、任务列表等
      gfm: true,
    });
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
    return marked(markdown);
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
  parseAsync(markdown: string): Promise<string> {
    return marked(markdown);
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
   *   headerIds: true,
   *   mangle: false
   * });
   * ```
   */
  configure(options: marked.MarkedOptions): void {
    marked.setOptions(options);
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
