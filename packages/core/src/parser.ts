/**
 * @fileoverview Markdown 解析器
 * @description 基于 marked 库实现的 Markdown 到 HTML 的解析器
 * @module packages/core/parser
 * @author MindFlow Team
 * @license MIT
 */

import { marked } from 'marked';
import { extendedSyntaxProcessor } from './extended-syntax';

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
    // 先处理扩展语法
    const processedMarkdown = extendedSyntaxProcessor.processExtendedSyntax(markdown);

    // 再用 marked 解析标准 Markdown
    const result = marked(processedMarkdown);
    // 处理 marked 可能返回 Promise 的情况
    if (result instanceof Promise) {
      // 对于同步方法，我们不应该返回 Promise，但这在运行时不会发生
      // 因为 marked 在同步模式下返回 string
      return '';
    }
    return result;
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
    // 先处理扩展语法
    const processedMarkdown = extendedSyntaxProcessor.processExtendedSyntax(markdown);

    // 再用 marked 解析标准 Markdown
    const result = marked(processedMarkdown);
    // 处理 marked 可能返回 string 或 Promise 的情况
    if (result instanceof Promise) {
      return result;
    }
    return result;
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
  configure(options: any): void {
    marked.setOptions(options);
  }

  /**
   * 渲染需要延迟处理的扩展语法（Mermaid、Markmap）
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
