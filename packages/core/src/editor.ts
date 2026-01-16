/**
 * @fileoverview CodeMirror 6 编辑器创建和管理
 * @description 基于 CodeMirror 6 实现的 Markdown 编辑器，支持主题切换、只读模式等功能
 * @module packages/core/editor
 * @author MindFlow Team
 * @license MIT
 */

import { EditorState, Compartment } from '@codemirror/state';
import { EditorView, basicSetup } from '@codemirror/view';
import { markdown } from '@codemirror/lang-markdown';
import { oneDark } from '@codemirror/theme-one-dark';
import { keymap } from '@codemirror/view';
import { defaultKeymap } from '@codemirror/commands';

/**
 * 编辑器配置接口
 * @description 创建编辑器实例时所需的配置选项
 */
export interface EditorConfig {
  /** 编辑器挂载的父容器 DOM 元素 */
  parent: HTMLElement;

  /** 编辑器初始文档内容，默认为空字符串 */
  doc?: string;

  /** 编辑器主题：light 或 dark，默认为 light */
  theme?: 'light' | 'dark';

  /** 是否为只读模式，默认为 false（可编辑） */
  readonly?: boolean;
}

/**
 * 编辑器控制器接口
 * @description 编辑器实例返回的控制器，用于操作编辑器
 */
interface EditorController {
  /** CodeMirror 的 EditorView 实例 */
  view: EditorView;

  /** 获取编辑器当前状态 */
  getState: () => EditorState;

  /** 获取编辑器内容 */
  getContent: () => string;

  /** 设置编辑器内容 */
  setContent: (content: string) => void;

  /** 切换编辑器主题 */
  setTheme: (theme: 'light' | 'dark') => void;

  /** 设置编辑器是否只读 */
  setReadonly: (readonly: boolean) => void;

  /** 销毁编辑器实例 */
  destroy: () => void;
}

/**
 * 创建 Markdown 编辑器实例
 * @description 使用 CodeMirror 6 创建一个功能完整的 Markdown 编辑器
 * @param config - 编辑器配置对象
 * @returns 编辑器控制器对象，包含操作编辑器的各种方法
 * @example
 * ```ts
 * const editor = createEditor({
 *   parent: document.getElementById('editor')!,
 *   doc: '# Hello World\n',
 *   theme: 'dark',
 *   readonly: false
 * });
 *
 * // 获取内容
 * const content = editor.getContent();
 *
 * // 设置内容
 * editor.setContent('# New Content\n');
 *
 * // 切换主题
 * editor.setTheme('light');
 *
 * // 清理资源
 * editor.destroy();
 * ```
 */
export function createEditor(config: EditorConfig): EditorController {
  // 创建主题隔离层，用于动态切换主题
  const themeCompartment = new Compartment();

  // 创建只读模式隔离层，用于动态切换编辑状态
  const readonlyCompartment = new Compartment();

  // 配置编辑器扩展
  const extensions = [
    basicSetup, // 基础功能（行号、撤销重做等）
    markdown(), // Markdown 语法支持
    keymap.of(defaultKeymap), // 默认快捷键
    themeCompartment.of(config.theme === 'dark' ? oneDark : []), // 主题配置
    readonlyCompartment.of(EditorView.editable.of(!config.readonly)), // 可编辑性
  ];

  // 创建编辑器状态
  const state = EditorState.create({
    doc: config.doc || '',
    extensions,
  });

  // 创建编辑器视图
  const view = new EditorView({
    state,
    parent: config.parent,
  });

  // 返回编辑器控制器
  return {
    view,
    getState: () => view.state,
    getContent: () => view.state.doc.toString(),
    setContent: (content: string) => {
      view.dispatch({
        changes: {
          from: 0,
          to: view.state.doc.length,
          insert: content,
        },
      });
    },
    setTheme: (theme: 'light' | 'dark') => {
      view.dispatch({
        effects: themeCompartment.reconfigure(theme === 'dark' ? oneDark : []),
      });
    },
    setReadonly: (readonly: boolean) => {
      view.dispatch({
        effects: readonlyCompartment.reconfigure(EditorView.editable.of(!readonly)),
      });
    },
    destroy: () => view.destroy(),
  };
}
