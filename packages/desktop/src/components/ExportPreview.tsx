/**
 * @fileoverview 导出预览组件
 * @description 提供导出前的预览功能
 * @module packages/web/components/ExportPreview
 * @author MindFlow Team
 * @license MIT
 */

import React, { useEffect, useRef, useState } from 'react';
import { parser } from '@mindflow/core';

/**
 * 导出预览组件属性
 */
interface ExportPreviewProps {
  /** Markdown 内容 */
  markdown: string;

  /** 是否显示预览 */
  isVisible: boolean;

  /** 关闭回调 */
  onClose: () => void;

  /** 确认导出回调 */
  onConfirm: () => void;

  /** 主题 */
  theme?: 'light' | 'dark';

  /** 预览标题 */
  title?: string;
}

/**
 * 导出预览组件
 */
const ExportPreview: React.FC<ExportPreviewProps> = ({
  markdown,
  isVisible,
  onClose,
  onConfirm,
  theme = 'light',
  title = '导出预览',
}) => {
  const previewRef = useRef<HTMLDivElement>(null);
  const [isRendering, setIsRendering] = useState(false);
  const [scale, setScale] = useState(1);

  /**
   * 渲染预览内容
   */
  useEffect(() => {
    if (isVisible && previewRef.current) {
      setIsRendering(true);

      // 使用 parser 解析 Markdown
      const html = parser.parse(markdown);
      previewRef.current.innerHTML = html;

      // 渲染扩展语法
      parser
        .renderExtendedSyntax(previewRef.current)
        .then(() => {
          setIsRendering(false);
        })
        .catch((error) => {
          console.error('Extended syntax rendering error:', error);
          setIsRendering(false);
        });
    }
  }, [isVisible, markdown]);

  /**
   * 缩放控制
   */
  const zoomIn = () => setScale((prev) => Math.min(prev + 0.1, 2));
  const zoomOut = () => setScale((prev) => Math.max(prev - 0.1, 0.5));
  const resetZoom = () => setScale(1);

  /**
   * 打印预览
   */
  const handlePrint = () => {
    if (previewRef.current) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>${title}</title>
              <style>
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
                ${getPreviewStyles(theme)}
              </style>
              <script src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js"></script>
              <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">
              <script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>
            </head>
            <body>
              ${previewRef.current.innerHTML}
              <script>
                mermaid.initialize({ startOnLoad: true, theme: '${theme === 'dark' ? 'dark' : 'default'}' });
              </script>
            </body>
          </html>
        `);
        printWindow.document.close();
        setTimeout(() => {
          printWindow.focus();
          printWindow.print();
        }, 250);
      }
    }
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div
      className="export-preview-overlay"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onClick={onClose}
    >
      <div
        className="export-preview-container"
        style={{
          backgroundColor: theme === 'dark' ? '#2d2d2d' : '#fff',
          borderRadius: '8px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
          width: '90vw',
          height: '90vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 工具栏 */}
        <div
          className="preview-toolbar"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '16px 20px',
            borderBottom: `1px solid ${theme === 'dark' ? '#444' : '#e0e0e0'}`,
            backgroundColor: theme === 'dark' ? '#1e1e1e' : '#f6f8fa',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h2
              style={{
                margin: 0,
                fontSize: '18px',
                fontWeight: 600,
                color: theme === 'dark' ? '#e0e0e0' : '#333',
              }}
            >
              {title}
            </h2>
            {isRendering && (
              <span
                style={{
                  fontSize: '12px',
                  color: theme === 'dark' ? '#888' : '#666',
                }}
              >
                正在渲染...
              </span>
            )}
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            {/* 缩放控制 */}
            <button
              onClick={zoomOut}
              style={{
                padding: '6px 12px',
                border: `1px solid ${theme === 'dark' ? '#444' : '#ddd'}`,
                borderRadius: '4px',
                backgroundColor: theme === 'dark' ? '#2d2d2d' : '#fff',
                color: theme === 'dark' ? '#e0e0e0' : '#333',
                cursor: 'pointer',
                fontSize: '14px',
              }}
              title="缩小"
            >
              ➖
            </button>
            <span
              style={{
                padding: '6px 12px',
                fontSize: '13px',
                color: theme === 'dark' ? '#aaa' : '#666',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              {Math.round(scale * 100)}%
            </span>
            <button
              onClick={zoomIn}
              style={{
                padding: '6px 12px',
                border: `1px solid ${theme === 'dark' ? '#444' : '#ddd'}`,
                borderRadius: '4px',
                backgroundColor: theme === 'dark' ? '#2d2d2d' : '#fff',
                color: theme === 'dark' ? '#e0e0e0' : '#333',
                cursor: 'pointer',
                fontSize: '14px',
              }}
              title="放大"
            >
              ➕
            </button>
            <button
              onClick={resetZoom}
              style={{
                padding: '6px 12px',
                border: `1px solid ${theme === 'dark' ? '#444' : '#ddd'}`,
                borderRadius: '4px',
                backgroundColor: theme === 'dark' ? '#2d2d2d' : '#fff',
                color: theme === 'dark' ? '#e0e0e0' : '#333',
                cursor: 'pointer',
                fontSize: '13px',
              }}
              title="重置缩放"
            >
              重置
            </button>

            <div
              style={{
                width: '1px',
                height: '24px',
                backgroundColor: theme === 'dark' ? '#444' : '#ddd',
                margin: '0 8px',
              }}
            />

            {/* 打印按钮 */}
            <button
              onClick={handlePrint}
              style={{
                padding: '6px 16px',
                border: `1px solid ${theme === 'dark' ? '#444' : '#ddd'}`,
                borderRadius: '4px',
                backgroundColor: theme === 'dark' ? '#2d2d2d' : '#fff',
                color: theme === 'dark' ? '#e0e0e0' : '#333',
                cursor: 'pointer',
                fontSize: '14px',
              }}
              title="打印预览"
            >
              🖨️ 打印
            </button>

            {/* 确认按钮 */}
            <button
              onClick={onConfirm}
              style={{
                padding: '6px 16px',
                border: 'none',
                borderRadius: '4px',
                backgroundColor: '#0366d6',
                color: '#fff',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 500,
              }}
            >
              ✓ 确认导出
            </button>

            {/* 关闭按钮 */}
            <button
              onClick={onClose}
              style={{
                padding: '6px 12px',
                border: 'none',
                borderRadius: '4px',
                backgroundColor: 'transparent',
                color: theme === 'dark' ? '#e0e0e0' : '#333',
                cursor: 'pointer',
                fontSize: '18px',
              }}
              title="关闭 (ESC)"
            >
              ✕
            </button>
          </div>
        </div>

        {/* 预览内容 */}
        <div
          className="preview-content-wrapper"
          style={{
            flex: 1,
            overflow: 'auto',
            padding: '40px',
            backgroundColor: theme === 'dark' ? '#1e1e1e' : '#f6f8fa',
          }}
        >
          <div
            ref={previewRef}
            className="export-preview-content"
            style={{
              maxWidth: '900px',
              margin: '0 auto',
              backgroundColor: theme === 'dark' ? '#2d2d2d' : '#fff',
              padding: '40px',
              borderRadius: '4px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
              transform: `scale(${scale})`,
              transformOrigin: 'top center',
              transition: 'transform 0.2s ease',
            }}
          />
        </div>
      </div>
    </div>
  );
};

/**
 * 获取预览样式
 */
function getPreviewStyles(theme: 'light' | 'dark'): string {
  return `
    .markdown-body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: ${theme === 'dark' ? '#e0e0e0' : '#333'};
    }
    .markdown-body h1, .markdown-body h2, .markdown-body h3 {
      margin-top: 1.5em;
      margin-bottom: 0.5em;
      font-weight: 600;
    }
    .markdown-body code {
      background: ${theme === 'dark' ? '#3d3d3d' : '#f6f8fa'};
      padding: 0.2em 0.4em;
      border-radius: 3px;
    }
    .markdown-body pre {
      background: ${theme === 'dark' ? '#3d3d3d' : '#f6f8fa'};
      padding: 16px;
      border-radius: 6px;
      overflow: auto;
    }
  `;
}

export default ExportPreview;
