/**
 * @fileoverview 导出功能模块
 * @description 支持 PDF、HTML、图片等多种格式的导出功能
 * @module packages/core/exporter
 * @author MindFlow Team
 * @license MIT
 */

import { parser } from './parser';

/**
 * 导出格式类型
 */
export enum ExportFormat {
  PDF = 'pdf',
  HTML = 'html',
  PNG = 'png',
  JPEG = 'jpeg',
  SVG = 'svg',
}

/**
 * 导出选项
 */
export interface ExportOptions {
  /** 导出格式 */
  format: ExportFormat;

  /** 文件名（不含扩展名） */
  filename?: string;

  /** 是否包含样式 */
  includeStyles?: boolean;

  /** 页面尺寸（PDF） */
  pageSize?: {
    width: number; // mm
    height: number; // mm
  };

  /** 图片质量（图片导出） */
  quality?: number; // 0-1

  /** 缩放比例（图片导出） */
  scale?: number;

  /** 是否显示页码（PDF/PPT） */
  showPageNumbers?: boolean;

  /** 主题：light 或 dark */
  theme?: 'light' | 'dark';

  /** 页面标题 */
  title?: string;

  /** 元数据 */
  metadata?: {
    author?: string;
    keywords?: string;
    description?: string;
  };
}

/**
 * 导出结果
 */
export interface ExportResult {
  /** 是否成功 */
  success: boolean;

  /** 导出的数据或 Blob URL */
  data?: string | Blob;

  /** 错误信息 */
  error?: string;

  /** 文件名 */
  filename?: string;
}

/**
 * 导出进度回调
 */
export type ExportProgressCallback = (progress: {
  stage: string;
  percentage: number;
  message: string;
}) => void;

/**
 * 导出器类
 * @description 提供多种格式的文档导出功能
 */
export class Exporter {
  /**
   * 导出 Markdown 为指定格式
   * @param markdown - Markdown 文本
   * @param options - 导出选项
   * @param progressCallback - 进度回调函数
   * @returns 导出结果
   */
  async export(
    markdown: string,
    options: ExportOptions,
    progressCallback?: ExportProgressCallback
  ): Promise<ExportResult> {
    try {
      const reportProgress = (stage: string, percentage: number, message: string) => {
        if (progressCallback) {
          progressCallback({ stage, percentage, message });
        }
      };

      switch (options.format) {
        case ExportFormat.HTML:
          reportProgress('parsing', 10, '正在解析 Markdown...');
          return await this.exportHTML(markdown, options, progressCallback);
        case ExportFormat.PDF:
          reportProgress('parsing', 10, '正在准备 PDF...');
          return await this.exportPDF(markdown, options, progressCallback);
        case ExportFormat.PNG:
        case ExportFormat.JPEG:
          reportProgress('parsing', 10, '正在生成图片...');
          return await this.exportImage(markdown, options, progressCallback);
        default:
          return {
            success: false,
            error: `Unsupported format: ${options.format}`,
          };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * 导出为 HTML
   * @param markdown - Markdown 文本
   * @param options - 导出选项
   * @param progressCallback - 进度回调
   * @returns 导出结果
   */
  private async exportHTML(
    markdown: string,
    options: ExportOptions,
    progressCallback?: ExportProgressCallback
  ): Promise<ExportResult> {
    const reportProgress = (stage: string, percentage: number, message: string) => {
      if (progressCallback) {
        progressCallback({ stage, percentage, message });
      }
    };

    reportProgress('parsing', 20, '正在解析 Markdown...');

    // 使用 parser 解析 Markdown
    const htmlContent = parser.parse(markdown);

    reportProgress('styling', 40, '正在应用样式...');

    // 生成完整的 HTML 文档
    // 样式已内联在下面的 HTML 模板中
    void options.includeStyles; // 保持选项兼容性，但样式已内联

    reportProgress('generating', 60, '正在生成 HTML 文档...');

    const fullHTML = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${options.title || 'MindFlow Document'}</title>
  ${options.metadata?.keywords ? `<meta name="keywords" content="${options.metadata.keywords}">` : ''}
  ${options.metadata?.description ? `<meta name="description" content="${options.metadata.description}">` : ''}
  ${options.metadata?.author ? `<meta name="author" content="${options.metadata.author}">` : ''}
  <style>
    /* Reset */
    * { margin: 0; padding: 0; box-sizing: border-box; }

    /* Base */
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: ${options.theme === 'dark' ? '#e0e0e0' : '#333'};
      background: ${options.theme === 'dark' ? '#1e1e1e' : '#fff'};
      padding: 20px;
      max-width: 900px;
      margin: 0 auto;
    }

    /* Typography */
    h1, h2, h3, h4, h5, h6 {
      margin-top: 1.5em;
      margin-bottom: 0.5em;
      font-weight: 600;
      line-height: 1.25;
    }

    h1 { font-size: 2.25em; border-bottom: 1px solid ${options.theme === 'dark' ? '#444' : '#eee'}; padding-bottom: 0.3em; }
    h2 { font-size: 1.75em; border-bottom: 1px solid ${options.theme === 'dark' ? '#444' : '#eee'}; padding-bottom: 0.3em; }
    h3 { font-size: 1.5em; }
    h4 { font-size: 1.25em; }
    h5 { font-size: 1em; }
    h6 { font-size: 0.875em; color: ${options.theme === 'dark' ? '#888' : '#777'}; }

    p { margin-bottom: 1em; }

    /* Links */
    a {
      color: #0366d6;
      text-decoration: none;
    }
    a:hover { text-decoration: underline; }

    /* Lists */
    ul, ol { margin-left: 2em; margin-bottom: 1em; }
    li { margin-bottom: 0.25em; }

    /* Code */
    code {
      background: ${options.theme === 'dark' ? '#2d2d2d' : '#f6f8fa'};
      padding: 0.2em 0.4em;
      border-radius: 3px;
      font-family: 'SF Mono', Monaco, Consolas, 'Courier New', monospace;
      font-size: 85%;
    }

    pre {
      background: ${options.theme === 'dark' ? '#2d2d2d' : '#f6f8fa'};
      padding: 16px;
      border-radius: 6px;
      overflow: auto;
      margin-bottom: 1em;
    }

    pre code {
      background: none;
      padding: 0;
      font-size: 100%;
    }

    /* Blockquote */
    blockquote {
      border-left: 4px solid #dfe2e5;
      padding-left: 1em;
      margin-left: 0;
      color: ${options.theme === 'dark' ? '#888' : '#6a737d'};
    }

    /* Tables */
    table {
      border-collapse: collapse;
      width: 100%;
      margin-bottom: 1em;
    }

    table th,
    table td {
      border: 1px solid ${options.theme === 'dark' ? '#444' : '#dfe2e5'};
      padding: 6px 13px;
    }

    table th {
      background: ${options.theme === 'dark' ? '#2d2d2d' : '#f6f8fa'};
      font-weight: 600;
    }

    table tr:nth-child(even) {
      background: ${options.theme === 'dark' ? '#252525' : '#f6f8fa'};
    }

    /* Images */
    img {
      max-width: 100%;
      height: auto;
      display: block;
      margin: 1.5em 0;
    }

    /* Horizontal Rule */
    hr {
      border: none;
      border-top: 1px solid ${options.theme === 'dark' ? '#444' : '#eee'};
      margin: 2em 0;
    }

    /* Task Lists */
    .task-list-item {
      list-style-type: none;
    }
    .task-list-item input {
      margin-right: 0.5em;
    }

    /* Extended Syntax */
    .latex-block {
      padding: 1em;
      text-align: center;
      margin: 1em 0;
      overflow-x: auto;
    }

    .katex {
      font-size: 1.1em;
    }

    .mermaid,
    .plantuml-diagram,
    .markmap-container {
      margin: 1.5em 0;
      text-align: center;
    }

    .plantuml-diagram,
    .markmap-iframe {
      max-width: 100%;
      height: auto;
    }
  </style>
  <script src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js"></script>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">
  <script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>
</head>
<body>
  <div class="markdown-body">
    ${htmlContent}
  </div>
  <script>
    // Initialize Mermaid
    mermaid.initialize({
      startOnLoad: true,
      theme: '${options.theme === 'dark' ? 'dark' : 'default'}',
      securityLevel: 'loose',
    });
  </script>
</body>
</html>`;

    reportProgress('finalizing', 90, '正在完成导出...');

    const filename = `${options.filename || 'document'}.html`;

    reportProgress('complete', 100, '导出完成');

    return {
      success: true,
      data: fullHTML,
      filename,
    };
  }

  /**
   * 导出为 PDF
   * @param markdown - Markdown 文本
   * @param options - 导出选项
   * @param progressCallback - 进度回调
   * @returns 导出结果
   */
  private async exportPDF(
    markdown: string,
    options: ExportOptions,
    progressCallback?: ExportProgressCallback
  ): Promise<ExportResult> {
    const reportProgress = (stage: string, percentage: number, message: string) => {
      if (progressCallback) {
        progressCallback({ stage, percentage, message });
      }
    };

    // 首先生成 HTML
    reportProgress('html', 20, '正在生成 HTML...');
    const htmlResult = await this.exportHTML(markdown, options, progressCallback);

    if (!htmlResult.success || !htmlResult.data) {
      return {
        success: false,
        error: 'Failed to generate HTML for PDF export',
      };
    }

    reportProgress('opening', 70, '正在打开打印窗口...');

    // 使用浏览器打印功能生成 PDF
    // 创建一个隐藏的 iframe 来加载 HTML 并触发打印
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      return {
        success: false,
        error: '无法打开打印窗口。请允许此网站的弹出窗口，然后重试。',
      };
    }

    reportProgress('loading', 80, '正在加载内容...');

    printWindow.document.write(htmlResult.data as string);
    printWindow.document.close();

    // 等待内容加载完成后触发打印
    setTimeout(() => {
      reportProgress('printing', 90, '请选择保存为 PDF...');

      printWindow.focus();
      printWindow.print();

      reportProgress('complete', 100, '请在打印对话框中选择"另存为 PDF"');
    }, 250);

    const filename = `${options.filename || 'document'}.pdf`;

    return {
      success: true,
      filename,
    };
  }

  /**
   * 导出为图片
   * @param markdown - Markdown 文本
   * @param options - 导出选项
   * @param progressCallback - 进度回调
   * @returns 导出结果
   */
  private async exportImage(
    markdown: string,
    options: ExportOptions,
    progressCallback?: ExportProgressCallback
  ): Promise<ExportResult> {
    const reportProgress = (stage: string, percentage: number, message: string) => {
      if (progressCallback) {
        progressCallback({ stage, percentage, message });
      }
    };

    // 首先生成 HTML
    reportProgress('html', 15, '正在生成 HTML...');
    const htmlResult = await this.exportHTML(markdown, options, progressCallback);

    if (!htmlResult.success || !htmlResult.data) {
      return {
        success: false,
        error: 'Failed to generate HTML for image export',
      };
    }

    reportProgress('container', 25, '正在准备渲染容器...');

    // 创建一个临时的容器元素
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.width = '900px';
    container.style.padding = '20px';
    container.style.background = options.theme === 'dark' ? '#1e1e1e' : '#fff';
    document.body.appendChild(container);

    try {
      reportProgress('rendering', 35, '正在渲染内容...');

      // 设置 HTML 内容
      container.innerHTML = htmlResult.data as string;

      reportProgress('extensions', 45, '正在渲染扩展语法...');

      // 渲染扩展语法
      await parser.renderExtendedSyntax(container);

      reportProgress('library', 55, '正在加载图片库...');

      // 动态加载 html2canvas
      const html2canvas = await this.loadHtml2Canvas();

      reportProgress('capturing', 65, '正在捕获内容为图片...');

      // 使用 html2canvas 捕获内容
      const containerTheme = options.theme === 'dark' ? '#1e1e1e' : '#fff';
      const canvas = await html2canvas(container, {
        scale: options.scale || 2,
        backgroundColor: containerTheme,
        logging: false,
        useCORS: true,
        allowTaint: true,
      });

      reportProgress('encoding', 85, '正在编码图片...');

      // 转换为指定格式的图片
      const dataUrl = canvas.toDataURL(
        `image/${options.format}`,
        options.quality || 0.95
      );

      const filename = `${options.filename || 'document'}.${options.format}`;

      reportProgress('complete', 100, '导出完成');

      return {
        success: true,
        data: dataUrl,
        filename,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      reportProgress('error', 0, `导出失败: ${errorMessage}`);

      return {
        success: false,
        error: `图片导出失败: ${errorMessage}。请尝试减小图片尺寸或降低质量。`,
      };
    } finally {
      // 清理临时容器
      document.body.removeChild(container);
    }
  }

  /**
   * 动态加载 html2canvas 库
   * @returns html2canvas 模块
   */
  private async loadHtml2Canvas(): Promise<any> {
    // 检查是否已经加载
    if ((window as any).html2canvas) {
      return (window as any).html2canvas;
    }

    // 动态加载 html2canvas
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js';
      script.onload = () => resolve((window as any).html2canvas);
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  /**
   * 下载导出的文件
   * @param result - 导出结果
   */
  download(result: ExportResult): void {
    if (!result.success || !result.data) {
      console.error('Export failed:', result.error);
      return;
    }

    // 创建下载链接
    let url: string;
    if (typeof result.data === 'string') {
      // Data URL 或 HTML 内容
      if (result.data.startsWith('data:')) {
        // Data URL（图片）
        url = result.data;
      } else {
        // HTML 内容，创建 Blob
        const blob = new Blob([result.data], { type: 'text/html' });
        url = URL.createObjectURL(blob);
      }
    } else if (result.data instanceof Blob) {
      url = URL.createObjectURL(result.data);
    } else {
      console.error('Unsupported data type');
      return;
    }

    // 创建临时链接并触发下载
    const link = document.createElement('a');
    link.href = url;
    link.download = result.filename || 'document';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // 释放 URL 对象（如果是 Blob URL）
    if (url.startsWith('blob:')) {
      URL.revokeObjectURL(url);
    }
  }
}

/**
 * 全局导出器实例
 */
export const exporter = new Exporter();
