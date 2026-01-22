/**
 * @fileoverview Markdown 编辑器组件
 * @description 基于 @mindflow/core 实现的 React 编辑器组件，支持实时预览
 * @module packages/web/components/Editor
 * @author MindFlow Team
 * @license MIT
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  createEditor,
  EditorController,
  parser,
  DefaultShortcuts,
  LocalStorageAutoSaveManager,
  SaveState,
} from '@mindflow/core';
import ExportMenu from './ExportMenu';
import PresentationMode from './PresentationMode';

/**
 * 编辑器组件属性
 */
interface EditorProps {
  /** 初始内容 */
  initialValue?: string;

  /** 文档ID，用于自动保存 */
  docId?: string;

  /** 主题：light 或 dark */
  theme?: 'light' | 'dark';

  /** 只读模式 */
  readonly?: boolean;

  /** 是否启用自动保存 */
  autoSave?: boolean;

  /** 自动保存延迟时间（毫秒） */
  autoSaveDelay?: number;

  /** 内容变化回调 */
  onChange?: (value: string) => void;

  /** 主题变化回调 */
  onThemeChange?: (theme: 'light' | 'dark') => void;

  /** 保存状态变化回调 */
  onSaveStateChange?: (state: SaveState) => void;
}

/**
 * Markdown 编辑器组件
 * @description 提供编辑和预览 Markdown 的功能
 */
const Editor: React.FC<EditorProps> = ({
  initialValue = '# Welcome to MindFlow\n\nStart writing your markdown here...',
  docId = 'default',
  theme = 'light',
  readonly = false,
  autoSave = true,
  autoSaveDelay = 2000,
  onChange,
  onThemeChange,
  onSaveStateChange,
}) => {
  // 编辑器容器引用
  const editorRef = useRef<HTMLDivElement>(null);

  // 预览容器引用
  const previewRef = useRef<HTMLDivElement>(null);

  // 编辑器控制器
  const editorControllerRef = useRef<EditorController | null>(null);

  // 内容状态
  const [content, setContent] = useState(initialValue);

  // 主题状态
  const [currentTheme, setCurrentTheme] = useState(theme);

  // 帮助面板显示状态
  const [showHelp, setShowHelp] = useState(false);

  // 保存状态
  const [saveState, setSaveState] = useState<SaveState>(SaveState.Saved);

  // 自动保存管理器引用
  const autoSaveManagerRef = useRef<LocalStorageAutoSaveManager | null>(null);

  // 最后保存时间显示
  const [lastSavedTime, setLastSavedTime] = useState<string>('');

  // 导出菜单显示状态
  const [showExportMenu, setShowExportMenu] = useState(false);

  // 演示模式显示状态
  const [showPresentation, setShowPresentation] = useState(false);

  /**
   * 更新预览内容
   * @param newContent - 新的编辑器内容
   */
  const updatePreview = async (newContent: string) => {
    if (previewRef.current) {
      // 使用 parser 解析 Markdown
      const html = parser.parse(newContent);
      previewRef.current.innerHTML = html;

      // 渲染需要延迟处理的扩展语法（Mermaid、Markmap）
      try {
        await parser.renderExtendedSyntax(previewRef.current);
      } catch (error) {
        console.error('Extended syntax rendering error:', error);
      }
    }

    // 调用外部回调
    onChange?.(newContent);

    // 触发自动保存
    if (autoSave && autoSaveManagerRef.current) {
      autoSaveManagerRef.current.updateContent(newContent);
    }
  };

  /**
   * 初始化编辑器
   */
  useEffect(() => {
    if (!editorRef.current) return;

    // 创建编辑器实例
    const editor = createEditor({
      parent: editorRef.current,
      doc: initialValue,
      theme: currentTheme,
      readonly,
    });

    editorControllerRef.current = editor;

    // 初始化自动保存管理器
    if (autoSave) {
      autoSaveManagerRef.current = new LocalStorageAutoSaveManager(docId, {
        delay: autoSaveDelay,
        enabled: true,
        onSaveStateChange: (state: SaveState) => {
          setSaveState(state);
          onSaveStateChange?.(state);

          // 更新最后保存时间显示
          if (state === SaveState.Saved && autoSaveManagerRef.current) {
            setLastSavedTime(autoSaveManagerRef.current.getLastSavedTimeString());
          }
        },
      });

      // 尝试从本地存储加载内容
      const savedContent = autoSaveManagerRef.current.loadFromStorage();
      if (savedContent && savedContent !== initialValue) {
        editor.setContent(savedContent);
        setLastSavedTime(autoSaveManagerRef.current.getLastSavedTimeString());
      }
    }

    // 初始渲染预览
    const initialContent = editor.getContent();
    setContent(initialContent);
    updatePreview(initialContent);

    // 使用更智能的方式监听变化
    // 设置一个较低的频率来更新预览，避免频繁渲染
    let timeoutId: NodeJS.Timeout;
    const handleChange = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      timeoutId = setTimeout(() => {
        const newContent = editor.getContent();
        if (newContent !== content) {
          setContent(newContent);
          updatePreview(newContent);
        }
      }, 300); // 300ms 防抖
    };

    // 使用 MutationObserver 监听编辑器变化
    // 这种方法更高效，不会频繁触发
    const observer = new MutationObserver(handleChange);
    const editorElement = editorRef.current.querySelector('.cm-content');
    if (editorElement) {
      observer.observe(editorElement, {
        childList: true,
        characterData: true,
        subtree: true,
      });
    }

    return () => {
      observer.disconnect();
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      if (autoSaveManagerRef.current) {
        autoSaveManagerRef.current.destroy();
      }
      editor.destroy();
    };
  }, []);

  /**
   * 处理主题切换
   */
  useEffect(() => {
    if (editorControllerRef.current) {
      editorControllerRef.current.setTheme(currentTheme);
    }

    // 通知外部主题变化
    onThemeChange?.(currentTheme);
  }, [currentTheme]);

  /**
   * 切换主题
   */
  const toggleTheme = () => {
    setCurrentTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <div className={`editor-container theme-${currentTheme}`}>
      {/* 编辑器工具栏 */}
      <div className="editor-toolbar">
        <div className="toolbar-left">
          <button className="toolbar-button" onClick={toggleTheme} title="切换主题">
            {currentTheme === 'light' ? '🌙' : '☀️'}
          </button>
          <button
            className="toolbar-button"
            onClick={() => setShowHelp(!showHelp)}
            title="快捷键帮助"
          >
            ⌨️
          </button>
        </div>
        <div className="toolbar-center">
          <span className="toolbar-title">Markdown Editor</span>
        </div>
        <div className="toolbar-right">
          <button
            className="toolbar-button"
            onClick={() => setShowExportMenu(true)}
            title="导出文档 (E)"
          >
            📤 导出
          </button>
          <button
            className="toolbar-button"
            onClick={() => setShowPresentation(true)}
            title="演示模式 (D)"
          >
            🎤 演示
          </button>
          {autoSave && (
            <div className="save-status" data-state={saveState}>
              {saveState === SaveState.Saving && <span>💾 保存中...</span>}
              {saveState === SaveState.Saved && <span>✅ {lastSavedTime}</span>}
              {saveState === SaveState.Dirty && <span>✏️ 未保存</span>}
            </div>
          )}
        </div>
      </div>

      {/* 快捷键帮助面板 */}
      {showHelp && (
        <div className="shortcuts-help">
          <h3>快捷键</h3>
          <ul>
            <li>
              <kbd>{DefaultShortcuts.Bold}</kbd> <span>粗体</span>
            </li>
            <li>
              <kbd>{DefaultShortcuts.Italic}</kbd> <span>斜体</span>
            </li>
            <li>
              <kbd>{DefaultShortcuts.Code}</kbd> <span>内联代码</span>
            </li>
          </ul>
        </div>
      )}

      {/* 编辑器和预览区域 */}
      <div className="editor-content">
        {/* 编辑器 */}
        <div className="editor-panel">
          <div ref={editorRef} className="editor-host" />
        </div>

        {/* 预览面板 */}
        <div className="preview-panel">
          <div ref={previewRef} className="preview-content" />
        </div>
      </div>

      {/* 导出菜单 */}
      {showExportMenu && (
        <ExportMenu
          markdown={content}
          filename={docId}
          theme={currentTheme}
          onClose={() => setShowExportMenu(false)}
        />
      )}

      {/* 演示模式 */}
      {showPresentation && (
        <PresentationMode
          markdown={content}
          isVisible={showPresentation}
          onClose={() => setShowPresentation(false)}
          options={{
            theme: currentTheme === 'dark' ? 'black' : 'white',
            transition: 'slide',
            controls: true,
            progress: true,
            slideNumber: true,
            keyboard: true,
            touch: true,
          }}
        />
      )}
    </div>
  );
};

export default Editor;
