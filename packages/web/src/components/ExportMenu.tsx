/**
 * @fileoverview 导出菜单组件
 * @description 提供多种导出格式的选择和执行
 * @module packages/web/components/ExportMenu
 * @author MindFlow Team
 * @license MIT
 */

import React, { useRef, useState } from 'react';
import { exporter, ExportFormat } from '@mindflow/core';
import ExportPreview from './ExportPreview';

/**
 * 导出菜单组件属性
 */
interface ExportMenuProps {
  /** Markdown 内容 */
  markdown: string;

  /** 文件名（不含扩展名） */
  filename?: string;

  /** 主题 */
  theme?: 'light' | 'dark';

  /** 菜单关闭回调 */
  onClose: () => void;
}

/**
 * 导出菜单组件
 */
const ExportMenu: React.FC<ExportMenuProps> = ({
  markdown,
  filename = 'document',
  theme = 'light',
  onClose,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [progress, setProgress] = useState<{ stage: string; percentage: number; message: string } | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [pendingFormat, setPendingFormat] = useState<ExportFormat | null>(null);

  /**
   * 处理预览
   */
  const handlePreview = (format: ExportFormat) => {
    setPendingFormat(format);
    setShowPreview(true);
  };

  /**
   * 确认导出
   */
  const handleConfirmExport = async () => {
    setShowPreview(false);
    if (pendingFormat) {
      await handleExport(pendingFormat);
    }
  };

  /**
   * 处理导出
   */
  const handleExport = async (format: ExportFormat) => {
    setExporting(format);
    setMessage(null);
    setProgress(null);

    try {
      const result = await exporter.export(
        markdown,
        {
          format,
          filename,
          includeStyles: true,
          theme,
          quality: 0.95,
          scale: 2,
        },
        (progressInfo) => {
          setProgress(progressInfo);
        }
      );

      if (result.success) {
        exporter.download(result);
        setMessage({ type: 'success', text: `导出成功: ${result.filename}` });
        setTimeout(() => {
          setMessage(null);
          setProgress(null);
          onClose();
        }, 1500);
      } else {
        setMessage({ type: 'error', text: result.error || '导出失败' });
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : '导出过程中发生错误',
      });
    } finally {
      setExporting(null);
    }
  };

  /**
   * 导出选项配置
   */
  const exportOptions = [
    {
      format: ExportFormat.HTML,
      label: 'HTML 文档',
      description: '导出为完整的 HTML 文档，包含所有样式',
      icon: '📄',
      shortcut: 'H',
    },
    {
      format: ExportFormat.PDF,
      label: 'PDF 文档',
      description: '导出为 PDF 文档（使用浏览器打印）',
      icon: '📕',
      shortcut: 'P',
    },
    {
      format: ExportFormat.PNG,
      label: 'PNG 图片',
      description: '导出为高清 PNG 图片',
      icon: '🖼️',
      shortcut: 'N',
    },
    {
      format: ExportFormat.JPEG,
      label: 'JPEG 图片',
      description: '导出为 JPEG 图片',
      icon: '📷',
      shortcut: 'J',
    },
  ];

  /**
   * 快捷键处理
   */
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      } else if (event.key === 'h' || event.key === 'H') {
        handleExport(ExportFormat.HTML);
      } else if (event.key === 'p' || event.key === 'P') {
        handleExport(ExportFormat.PDF);
      } else if (event.key === 'n' || event.key === 'N') {
        handleExport(ExportFormat.PNG);
      } else if (event.key === 'j' || event.key === 'J') {
        handleExport(ExportFormat.JPEG);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div
      className="export-menu-overlay"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onClick={onClose}
    >
      <div
        ref={menuRef}
        className="export-menu"
        style={{
          backgroundColor: theme === 'dark' ? '#2d2d2d' : '#fff',
          borderRadius: '8px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
          padding: '24px',
          minWidth: '400px',
          maxWidth: '500px',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 标题 */}
        <div style={{ marginBottom: '20px' }}>
          <h2
            style={{
              margin: 0,
              fontSize: '20px',
              fontWeight: 600,
              color: theme === 'dark' ? '#e0e0e0' : '#333',
            }}
          >
            导出文档
          </h2>
          <p
            style={{
              margin: '8px 0 0',
              fontSize: '14px',
              color: theme === 'dark' ? '#888' : '#666',
            }}
          >
            选择导出格式，或使用快捷键
          </p>
        </div>

        {/* 进度指示器 */}
        {progress && (
          <div
            style={{
              marginBottom: '20px',
              padding: '16px',
              borderRadius: '6px',
              backgroundColor: theme === 'dark' ? '#1e1e1e' : '#f6f8fa',
              border: `1px solid ${theme === 'dark' ? '#444' : '#e0e0e0'}`,
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '8px',
                fontSize: '13px',
                color: theme === 'dark' ? '#e0e0e0' : '#333',
              }}
            >
              <span style={{ fontWeight: 500 }}>{progress.message}</span>
              <span style={{ color: theme === 'dark' ? '#888' : '#666' }}>
                {progress.percentage}%
              </span>
            </div>
            {/* 进度条 */}
            <div
              style={{
                width: '100%',
                height: '6px',
                backgroundColor: theme === 'dark' ? '#2d2d2d' : '#e0e0e0',
                borderRadius: '3px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${progress.percentage}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #0366d6, #0052cc)',
                  transition: 'width 0.3s ease',
                }}
              />
            </div>
          </div>
        )}

        {/* 导出选项 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {exportOptions.map((option) => (
            <button
              key={option.format}
              onClick={() => handlePreview(option.format)}
              disabled={exporting !== null}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 16px',
                border: `1px solid ${theme === 'dark' ? '#444' : '#e0e0e0'}`,
                borderRadius: '6px',
                backgroundColor: theme === 'dark' ? '#1e1e1e' : '#fff',
                cursor: exporting === null ? 'pointer' : 'not-allowed',
                transition: 'all 0.2s',
                opacity: exporting === null ? 1 : 0.6,
              }}
              onMouseEnter={(e) => {
                if (exporting === null) {
                  e.currentTarget.style.backgroundColor = theme === 'dark' ? '#3d3d3d' : '#f6f8fa';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = theme === 'dark' ? '#1e1e1e' : '#fff';
              }}
              title={`快捷键: ${option.shortcut}`}
            >
              {/* 图标 */}
              <span style={{ fontSize: '24px' }}>{option.icon}</span>

              {/* 文本信息 */}
              <div style={{ flex: 1, textAlign: 'left' }}>
                <div
                  style={{
                    fontSize: '15px',
                    fontWeight: 500,
                    color: theme === 'dark' ? '#e0e0e0' : '#333',
                  }}
                >
                  {exporting === option.format && progress ? (
                    <span>
                      {progress.message}
                      <span
                        style={{
                          marginLeft: '8px',
                          color: theme === 'dark' ? '#888' : '#666',
                          fontSize: '13px',
                        }}
                      >
                        ({progress.percentage}%)
                      </span>
                    </span>
                  ) : (
                    option.label
                  )}
                </div>
                <div
                  style={{
                    fontSize: '12px',
                    color: theme === 'dark' ? '#888' : '#666',
                    marginTop: '2px',
                  }}
                >
                  {option.description}
                </div>
              </div>

              {/* 快捷键提示 */}
              <kbd
                style={{
                  padding: '4px 8px',
                  fontSize: '12px',
                  fontFamily: 'monospace',
                  backgroundColor: theme === 'dark' ? '#3d3d3d' : '#f6f8fa',
                  border: `1px solid ${theme === 'dark' ? '#555' : '#ddd'}`,
                  borderRadius: '4px',
                  color: theme === 'dark' ? '#aaa' : '#666',
                }}
              >
                {option.shortcut}
              </kbd>
            </button>
          ))}
        </div>

        {/* 状态消息 */}
        {message && (
          <div
            style={{
              marginTop: '16px',
              padding: '12px',
              borderRadius: '6px',
              backgroundColor:
                message.type === 'success'
                  ? theme === 'dark'
                    ? 'rgba(46, 160, 67, 0.2)'
                    : 'rgba(46, 160, 67, 0.1)'
                  : theme === 'dark'
                  ? 'rgba(248, 81, 73, 0.2)'
                  : 'rgba(248, 81, 73, 0.1)',
              border: `1px solid ${
                message.type === 'success'
                  ? theme === 'dark'
                    ? '#2ea44f'
                    : '#2ea44f'
                  : theme === 'dark'
                  ? '#f85149'
                  : '#f85149'
              }`,
              color: message.type === 'success' ? '#2ea44f' : '#f85149',
              fontSize: '14px',
              textAlign: 'center',
            }}
          >
            {message.text}
          </div>
        )}

        {/* 取消按钮 */}
        <button
          onClick={onClose}
          disabled={exporting !== null}
          style={{
            marginTop: '16px',
            width: '100%',
            padding: '10px',
            border: 'none',
            borderRadius: '6px',
            backgroundColor: theme === 'dark' ? '#3d3d3d' : '#f6f8fa',
            color: theme === 'dark' ? '#e0e0e0' : '#333',
            fontSize: '14px',
            fontWeight: 500,
            cursor: exporting === null ? 'pointer' : 'not-allowed',
            opacity: exporting === null ? 1 : 0.6,
          }}
          onMouseEnter={(e) => {
            if (exporting === null) {
              e.currentTarget.style.backgroundColor = theme === 'dark' ? '#4d4d4d' : '#e8eaed';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = theme === 'dark' ? '#3d3d3d' : '#f6f8fa';
          }}
        >
          取消 (ESC)
        </button>
      </div>

      {/* 预览组件 */}
      <ExportPreview
        markdown={markdown}
        isVisible={showPreview}
        onClose={() => setShowPreview(false)}
        onConfirm={handleConfirmExport}
        theme={theme}
        title="导出预览"
      />
    </div>
  );
};

export default ExportMenu;
