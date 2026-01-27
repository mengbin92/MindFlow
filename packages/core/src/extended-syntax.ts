/**
 * @fileoverview 扩展语法处理器
 * @description 支持 LaTeX、Mermaid、PlantUML 等扩展语法的解析和渲染
 * @module packages/core/extended-syntax
 * @author MindFlow Team
 * @license MIT
 */

// @ts-ignore - KaTeX types may not be fully resolved
import katex from 'katex';
import mermaid from 'mermaid';

// PlantUML编码器（可选，动态导入）
let plantumlEncoder: any = null;

// 尝试动态加载plantuml-encoder（仅在需要时）
async function loadPlantUMLEncoder(): Promise<boolean> {
  try {
    if (!plantumlEncoder) {
      plantumlEncoder = await import('plantuml-encoder');
    }
    return true;
  } catch (error) {
    console.warn('PlantUML encoder not available:', error);
    return false;
  }
}

/**
 * 扩展语法类型
 */
export enum ExtendedSyntaxType {
  LaTeX = 'latex',
  Mermaid = 'mermaid',
  Markmap = 'markmap',
  PlantUML = 'plantuml',
}

/**
 * 扩展语法块
 */
interface ExtendedSyntaxBlock {
  type: ExtendedSyntaxType;
  content: string;
  id: string;
}

/**
 * 扩展语法处理器类
 * @description 处理 Markdown 中的扩展语法，将其转换为可渲染的 HTML
 */
export class ExtendedSyntaxProcessor {
  private mermaidInitialized: boolean = false;

  constructor() {
    // 初始化 Mermaid
    this.initializeMermaid();
  }

  /**
   * 初始化 Mermaid
   */
  private initializeMermaid(): void {
    if (!this.mermaidInitialized) {
      mermaid.initialize({
        startOnLoad: false,
        theme: 'default',
        securityLevel: 'loose',
      });
      this.mermaidInitialized = true;
    }
  }

  /**
   * 从 Markdown 中提取扩展语法块
   * @param markdown - Markdown 文本
   * @returns 扩展语法块数组
   */
  extractExtendedSyntaxBlocks(markdown: string): ExtendedSyntaxBlock[] {
    const blocks: ExtendedSyntaxBlock[] = [];
    let idCounter = 0;

    // 提取 LaTeX 公式（行内和块级）
    // 行内公式：$...$
    const inlineLatexRegex = /\$([^$\n]+?)\$/g;
    let match;
    while ((match = inlineLatexRegex.exec(markdown)) !== null) {
      blocks.push({
        type: ExtendedSyntaxType.LaTeX,
        content: match[1],
        id: `latex-inline-${idCounter++}`,
      });
    }

    // 块级公式：$$...$$
    const blockLatexRegex = /\$\$([\s\S]+?)\$\$/g;
    while ((match = blockLatexRegex.exec(markdown)) !== null) {
      blocks.push({
        type: ExtendedSyntaxType.LaTeX,
        content: match[1].trim(),
        id: `latex-block-${idCounter++}`,
      });
    }

    // 提取 Mermaid 图表：```mermaid ... ```
    const mermaidRegex = /```mermaid\n([\s\S]+?)```/g;
    while ((match = mermaidRegex.exec(markdown)) !== null) {
      blocks.push({
        type: ExtendedSyntaxType.Mermaid,
        content: match[1].trim(),
        id: `mermaid-${idCounter++}`,
      });
    }

    // 提取 Markmap 思维导图：```markmap ... ```
    const markmapRegex = /```markmap\n([\s\S]+?)```/g;
    while ((match = markmapRegex.exec(markdown)) !== null) {
      blocks.push({
        type: ExtendedSyntaxType.Markmap,
        content: match[1].trim(),
        id: `markmap-${idCounter++}`,
      });
    }

    // 提取 PlantUML 图表：```plantuml ... ``` 或 ```puml ... ```
    const plantumlRegex = /```(?:plantuml|puml)\n([\s\S]+?)```/g;
    while ((match = plantumlRegex.exec(markdown)) !== null) {
      blocks.push({
        type: ExtendedSyntaxType.PlantUML,
        content: match[1].trim(),
        id: `plantuml-${idCounter++}`,
      });
    }

    return blocks;
  }

  /**
   * 处理 LaTeX 公式
   * @param latex - LaTeX 公式字符串
   * @param displayMode - 是否为块级公式
   * @returns HTML 字符串
   */
  processLatex(latex: string, displayMode: boolean = false): string {
    try {
      return katex.renderToString(latex, {
        displayMode,
        throwOnError: false,
        output: 'html',
      });
    } catch (error) {
      return `<span class="latex-error">LaTeX Error: ${error instanceof Error ? error.message : 'Unknown error'}</span>`;
    }
  }

  /**
   * 处理 Mermaid 图表
   * @param code - Mermaid 代码
   * @param id - 元素 ID
   * @returns HTML 字符串
   */
  processMermaid(code: string, id: string): string {
    return `<pre class="mermaid" data-mermaid-id="${id}">${this.escapeHtml(code)}</pre>`;
  }

  /**
   * 渲染 Mermaid 图表
   * @param element - 包含 Mermaid 代码的 DOM 元素
   */
  async renderMermaid(element: HTMLElement): Promise<void> {
    const code = element.textContent || '';
    try {
      const { svg } = await mermaid.render(`mermaid-svg-${Date.now()}`, code);
      element.outerHTML = svg;
    } catch (error) {
      element.outerHTML = `<div class="mermaid-error">Mermaid Error: ${error instanceof Error ? error.message : 'Unknown error'}</div>`;
    }
  }

  /**
   * 处理 Markmap 思维导图
   * @param markdown - Markmap Markdown 内容
   * @param id - 元素 ID
   * @returns HTML 字符串
   */
  processMarkmap(markdown: string, id: string): string {
    const encodedContent = this.escapeHtml(markdown);
    return `<div class="markmap-container" data-markmap-id="${id}">
      <iframe
        class="markmap-iframe"
        style="width: 100%; height: 400px; border: none;"
        srcdoc='<!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <script src="https://cdn.jsdelivr.net/npm/d3@7"></script>
          <script src="https://cdn.jsdelivr.net/npm/markmap-view@0.15.4"></script>
          <script src="https://cdn.jsdelivr.net/npm/markmap-lib@0.15.4/dist/browser/index.min.js"></script>
          <style>
            body { margin: 0; padding: 0; }
            svg { width: 100%; height: 100%; }
          </style>
        </head>
        <body>
          <svg id="markmap"></svg>
          <script>
            const { Transformer } = window.markmap;
            const { Markmap } = window.markmap;
            const transformer = new Transformer();
            const { root } = transformer.transform(\`${encodedContent}\`);
            Markmap.create("#markmap", null, root);
          <\/script>
        </body>
        </html>'
      ></iframe>
    </div>`;
  }

  /**
   * 渲染 Markmap 思维导图（占位符方法，实际渲染已在 processMarkmap 中完成）
   * @param _element - SVG 元素
   * @param _content - Markmap Markdown 内容
   */
  async renderMarkmap(_element: SVGSVGElement, _content: string): Promise<void> {
    // Markmap 通过 iframe 和 CDN 自动渲染，无需额外处理
  }

  /**
   * 处理 PlantUML 图表
   * @param code - PlantUML 代码
   * @returns HTML 字符串
   */
  async processPlantUML(code: string): Promise<string> {
    try {
      // 尝试加载并使用PlantUML编码器
      const hasEncoder = await loadPlantUMLEncoder();

      if (hasEncoder && plantumlEncoder && typeof plantumlEncoder.encode === 'function') {
        const encoded = plantumlEncoder.encode(code);
        const url = `https://www.plantuml.com/plantuml/svg/${encoded}`;
        return `<img src="${url}" alt="PlantUML Diagram" class="plantuml-diagram" />`;
      } else {
        // 如果编码器不可用，使用在线服务的URL编码方式
        // 注意：这种方式可能不适用于所有PlantUML图表
        const encoded = btoa(unescape(encodeURIComponent(code)));
        return `<div class="plantuml-info">
          <p>PlantUML图表（编码器不可用，使用备用方案）</p>
          <pre>${this.escapeHtml(code)}</pre>
          <a href="https://www.plantuml.com/plantuml/uml/${encoded}" target="_blank" rel="noopener noreferrer">
            在新窗口中查看
          </a>
        </div>`;
      }
    } catch (error) {
      return `<div class="plantuml-error">PlantUML Error: ${error instanceof Error ? error.message : 'Unknown error'}</div>`;
    }
  }

  /**
   * 处理扩展语法后的 Markdown
   * @param markdown - 原始 Markdown 文本
   * @returns 处理后的 HTML 字符串
   */
  processExtendedSyntax(markdown: string): string {
    let html = markdown;

    // 处理 LaTeX 行内公式
    html = html.replace(/\$([^$\n]+?)\$/g, (_match, latex) => {
      return this.processLatex(latex, false);
    });

    // 处理 LaTeX 块级公式
    html = html.replace(/\$\$([\s\S]+?)\$\$/g, (_match, latex) => {
      return `<div class="latex-block">${this.processLatex(latex.trim(), true)}</div>`;
    });

    // 处理 Mermaid 图表
    html = html.replace(/```mermaid\n([\s\S]+?)```/g, (_match, code) => {
      const id = `mermaid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      return this.processMermaid(code.trim(), id);
    });

    // 处理 Markmap 思维导图
    html = html.replace(/```markmap\n([\s\S]+?)```/g, (_match, code) => {
      const id = `markmap-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      return this.processMarkmap(code.trim(), id);
    });

    // 处理 PlantUML 图表（暂时使用占位符，异步处理）
    html = html.replace(/```(?:plantuml|puml)\n([\s\S]+?)```/g, (_match, code) => {
      const id = `plantuml-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      return `<div class="plantuml-placeholder" data-plantuml-id="${id}" data-plantuml-code="${this.escapeHtml(code.trim())}">Loading PlantUML...</div>`;
    });

    return html;
  }

  /**
   * 渲染需要延迟处理的扩展语法（Mermaid 和 PlantUML）
   * @param container - 包含扩展语法元素的容器
   */
  async renderExtendedSyntax(container: HTMLElement): Promise<void> {
    // 渲染所有 Mermaid 图表
    const mermaidElements = container.querySelectorAll('pre.mermaid');
    for (const element of mermaidElements) {
      if (element instanceof HTMLElement) {
        await this.renderMermaid(element);
      }
    }

    // 渲染所有 PlantUML 图表
    const plantumlElements = container.querySelectorAll('div.plantuml-placeholder');
    for (const element of plantumlElements) {
      if (element instanceof HTMLElement) {
        const code = element.getAttribute('data-plantuml-code') || '';
        try {
          const html = await this.processPlantUML(code);
          element.outerHTML = html;
        } catch (error) {
          element.outerHTML = `<div class="plantuml-error">Failed to render PlantUML: ${error instanceof Error ? error.message : 'Unknown error'}</div>`;
        }
      }
    }

    // Markmap 通过 iframe 和 CDN 自动渲染，无需额外处理
  }

  /**
   * 转义 HTML 特殊字符
   * @param text - 要转义的文本
   * @returns 转义后的文本
   */
  private escapeHtml(text: string): string {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    };
    return text.replace(/[&<>"']/g, m => map[m]);
  }
}

/**
 * 全局扩展语法处理器实例
 */
export const extendedSyntaxProcessor = new ExtendedSyntaxProcessor();
