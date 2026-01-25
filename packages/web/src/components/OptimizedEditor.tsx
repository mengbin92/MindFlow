/**
 * @fileoverview 性能优化的Markdown编辑器组件
 * @description 使用React.memo、useMemo、useCallback等优化技术
 * @module packages/web/components/OptimizedEditor
 * @author MindFlow Team
 * @license MIT
 */

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import {
  createEditor,
  EditorController,
  parser,
  DefaultShortcuts,
  LocalStorageAutoSaveManager,
  SaveState,
  performanceMonitor,
  debounce,
} from '@mindflow/core';
import ExportMenu from './ExportMenu';
import PresentationMode from './PresentationMode';

/**
 * 编辑器组件属性
 */
interface OptimizedEditorProps {
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
 * Markdown 编辑器组件（性能优化版）
 * @description 提供编辑和预览 Markdown 的功能，使用多种性能优化技术
 */
const OptimizedEditor: React.FC<OptimizedEditorProps> = React.memo(({
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

  // 自动保存管理器引用
  const autoSaveManagerRef = useRef<LocalStorageAutoSaveManager | null>(null);

  // 内容状态
  const [content, setContent] = useState(initialValue);

  // 主题状态
  const [currentTheme, setCurrentTheme] = useState(theme);

  // 帮助面板显示状态
  const [showHelp, setShowHelp] = useState(false);

  // 保存状态
  const [saveState, setSaveState] = useState<SaveState>(SaveState.Saved);

  // 最后保存时间显示
  const [lastSavedTime, setLastSavedTime] = useState<string>('');

  // 导出菜单显示状态
  const [showExportMenu, setShowExportMenu] = useState(false);

  // 演示模式显示状态
  const [showPresentation, setShowPresentation] = useState(false);

  // 预览更新防抖函数（使用useCallback缓存）
  const debouncedUpdatePreview = useMemo(
    () =>
      debounce(async (newContent) => {
        performanceMonitor.mark('preview-update-start');

        if (previewRef.current) {
          // 使用 parser 解析 Markdown
          const html = parser.parse(newContent as string);
          previewRef.current.innerHTML = html;

          // 渲染需要延迟处理的扩展语法（Mermaid、Markmap）
          try {
            await parser.renderExtendedSyntax(previewRef.current);
          } catch (error) {
            console.error('Extended syntax rendering error:', error);
          }
        }

        // 调用外部回调
        onChange?.(newContent as string);

        // 触发自动保存
        if (autoSave && autoSaveManagerRef.current) {
          autoSaveManagerRef.current.updateContent(newContent as string);
        }

        performanceMonitor.endMark('preview-update-start');
      }, 300),
    [autoSave, onChange]
  );

  /**
   * 初始化编辑器
   */
  useEffect(() => {
    if (!editorRef.current) return;

    performanceMonitor.mark('editor-init-start');

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
    debouncedUpdatePreview(initialContent);

    performanceMonitor.endMark('editor-init-start');

    // 使用更智能的方式监听变化
    const handleChange = () => {
      const newContent = editor.getContent();
      if (newContent !== content) {
        setContent(newContent);
        debouncedUpdatePreview(newContent);
      }
    };

    // 使用 MutationObserver 监听编辑器变化（使用requestAnimationFrame优化）
    let rafId: number | null = null;
    const observer = new MutationObserver(() => {
      if (rafId === null) {
        rafId = requestAnimationFrame(() => {
          handleChange();
          rafId = null;
        });
      }
    });

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
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
      if (autoSaveManagerRef.current) {
        autoSaveManagerRef.current.destroy();
      }
      editor.destroy();
    };
  }, []); // 只在组件挂载时执行一次

  /**
   * 处理主题切换
   */
  useEffect(() => {
    if (editorControllerRef.current) {
      editorControllerRef.current.setTheme(currentTheme);
    }

    // 通知外部主题变化
    onThemeChange?.(currentTheme);
  }, [currentTheme, onThemeChange]);

  /**
   * 切换主题（使用useCallback缓存）
   */
  const toggleTheme = useCallback(() => {
    setCurrentTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  }, []);

  /**
   * 切换帮助面板（使用useCallback缓存）
   */
  const toggleHelp = useCallback(() => {
    setShowHelp(prev => !prev);
  }, []);

  /**
   * 打开导出菜单（使用useCallback缓存）
   */
  const openExportMenu = useCallback(() => {
    setShowExportMenu(true);
  }, []);

  /**
   * 关闭导出菜单（使用useCallback缓存）
   */
  const closeExportMenu = useCallback(() => {
    setShowExportMenu(false);
  }, []);

  /**
   * 打开演示模式（使用useCallback缓存）
   */
  const openPresentation = useCallback(() => {
    setShowPresentation(true);
  }, []);

  /**
   * 关闭演示模式（使用useCallback缓存）
   */
  const closePresentation = useCallback(() => {
    setShowPresentation(false);
  }, []);

  // 快捷键列表（使用useMemo缓存）
  const shortcuts = useMemo(
    () => [
      { key: DefaultShortcuts.Bold, description: '粗体' },
      { key: DefaultShortcuts.Italic, description: '斜体' },
      { key: DefaultShortcuts.Code, description: '内联代码' },
    ],
    []
  );

  return (
    <div className={`editor-container theme-${currentTheme}`}>
      {/* 编辑器工具栏 */}
      <div className="editor-toolbar">
        <div className="toolbar-left">
          <button className="toolbar-button" onClick={toggleTheme} title="切换主题">
            {currentTheme === 'light' ? '🌙' : '☀️'}
          </button>
          <button className="toolbar-button" onClick={toggleHelp} title="快捷键帮助">
            ⌨️
          </button>
        </div>
        <div className="toolbar-center">
          <span className="toolbar-title">Markdown Editor</span>
        </div>
        <div className="toolbar-right">
          <button className="toolbar-button" onClick={openExportMenu} title="导出文档 (E)">
            📤 导出
          </button>
          <button className="toolbar-button" onClick={openPresentation} title="演示模式 (D)">
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
            {shortcuts.map((shortcut, index) => (
              <li key={index}>
                <kbd>{shortcut.key}</kbd> <span>{shortcut.description}</span>
              </li>
            ))}
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
          onClose={closeExportMenu}
        />
      )}

      {/* 演示模式 */}
      {showPresentation && (
        <PresentationMode
          markdown={content}
          isVisible={showPresentation}
          onClose={closePresentation}
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
});

OptimizedEditor.displayName = 'OptimizedEditor';

export default OptimizedEditor;
