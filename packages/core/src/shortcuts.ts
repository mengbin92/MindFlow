/**
 * @fileoverview 编辑器快捷键系统
 * @description 管理编辑器的快捷键绑定，支持自定义快捷键和内置快捷键
 * @module packages/core/shortcuts
 * @author MindFlow Team
 * @license MIT
 */

import { keymap } from '@codemirror/view';
import { EditorView } from '@codemirror/view';

/**
 * 快捷键回调函数类型
 */
type ShortcutHandler = (view: EditorView) => void;

/**
 * 快捷键配置接口
 */
export interface Shortcut {
  /** 快捷键组合，如 'Ctrl-B'、'Cmd-B'、'Shift-Enter' */
  key: string;

  /** 快捷键描述，用于帮助文档 */
  description: string;

  /** 快捷键处理函数 */
  handler: ShortcutHandler;
}

/**
 * 快捷键管理器类
 * @description 管理编辑器的快捷键注册、注销和冲突检测
 */
export class ShortcutManager {
  /** 快捷键映射表 */
  private shortcuts: Map<string, Shortcut> = new Map();

  /**
   * 注册快捷键
   * @param shortcut - 快捷键配置对象
   * @throws {Error} 如果快捷键已存在则抛出错误
   * @example
   * ```ts
   * shortcutManager.register({
   *   key: 'Ctrl-B',
   *   description: '粗体',
   *   handler: (view) => {
   *     // 实现粗体逻辑
   *   }
   * });
   * ```
   */
  register(shortcut: Shortcut): void {
    if (this.shortcuts.has(shortcut.key)) {
      throw new Error(`Shortcut ${shortcut.key} is already registered`);
    }
    this.shortcuts.set(shortcut.key, shortcut);
  }

  /**
   * 注销快捷键
   * @param key - 快捷键组合
   * @example
   * ```ts
   * shortcutManager.unregister('Ctrl-B');
   * ```
   */
  unregister(key: string): void {
    this.shortcuts.delete(key);
  }

  /**
   * 获取所有快捷键
   * @returns 包含所有快捷键的数组
   */
  getAll(): Shortcut[] {
    return Array.from(this.shortcuts.values());
  }

  /**
   * 生成 CodeMirror keymap 配置
   * @returns 用于 EditorView 的 keymap 扩展
   * @example
   * ```ts
   * const extensions = [
   *   keymap.of(shortcutManager.toKeymap()),
   * ];
   * ```
   */
  toKeymap() {
    return this.shortcuts.map(shortcut => ({
      key: shortcut.key,
      run: shortcut.handler,
    }));
  }

  /**
   * 获取快捷键帮助信息
   * @returns 包含快捷键和描述的对象数组
   */
  getHelp(): Array<{ key: string; description: string }> {
    return this.shortcuts.map(shortcut => ({
      key: shortcut.key,
      description: shortcut.description,
    }));
  }
}

/**
 * 全局快捷键管理器实例
 * @description 导出的单例实例，可直接使用而无需手动创建
 * @example
 * ```ts
 * import { shortcutManager } from '@mindflow/core';
 *
 * // 注册快捷键
 * shortcutManager.register({
 *   key: 'Ctrl-S',
 *   description: '保存',
 *   handler: (view) => {
 *     // 实现保存逻辑
 *     return true; // 表示已处理
 *   }
 * });
 *
 * // 获取所有快捷键
 * const shortcuts = shortcutManager.getAll();
 * ```
 */
export const shortcutManager = new ShortcutManager();

/**
 * 预定义的常用快捷键
 */
export const DefaultShortcuts = {
  /** 保存：Ctrl+S / Cmd+S */
  Save: 'Mod-S',

  /** 新建文件：Ctrl+N / Cmd+N */
  New: 'Mod-N',

  /** 打开文件：Ctrl+O / Cmd+O */
  Open: 'Mod-O',

  /** 导出：Ctrl+E / Cmd+E */
  Export: 'Mod-E',

  /** 查找：Ctrl+F / Cmd+F */
  Find: 'Mod-F',

  /** 替换：Ctrl+H / Cmd+H */
  Replace: 'Mod-H',

  /** 全选：Ctrl+A / Cmd+A */
  SelectAll: 'Mod-A',

  /** 撤销：Ctrl+Z / Cmd+Z */
  Undo: 'Mod-Z',

  /** 重做：Ctrl+Y / Cmd+Shift+Z */
  Redo: 'Mod-Y',

  /** 粗体：Ctrl+B / Cmd+B */
  Bold: 'Mod-B',

  /** 斜体：Ctrl+I / Cmd+I */
  Italic: 'Mod-I',

  /** 代码：Ctrl+K / Cmd+K */
  Code: 'Mod-K',

  /** 切换预览：Ctrl+P / Cmd+P */
  TogglePreview: 'Mod-P',

  /** 切换主题：Ctrl+Shift+T / Cmd+Shift+T */
  ToggleTheme: 'Mod-Shift-T',
};

/**
 * 内置快捷键实现
 * @description 提供常用的快捷键实现函数
 */
export const ShortcutHandlers = {
  /**
   * 插入 Markdown 粗体标记
   */
  bold: (view: EditorView) => {
    const { from, to } = view.state.selection.main;
    const selectedText = view.state.doc.sliceString(from, to);
    const newText = selectedText ? `**${selectedText}**` : '**粗体文本**';
    view.dispatch({
      changes: { from, to, insert: newText },
      selection: { anchor: from + newText.length },
    });
    return true;
  },

  /**
   * 插入 Markdown 斜体标记
   */
  italic: (view: EditorView) => {
    const { from, to } = view.state.selection.main;
    const selectedText = view.state.doc.sliceString(from, to);
    const newText = selectedText ? `*${selectedText}*` : '*斜体文本*';
    view.dispatch({
      changes: { from, to, insert: newText },
      selection: { anchor: from + newText.length },
    });
    return true;
  },

  /**
   * 插入 Markdown 代码标记
   */
  code: (view: EditorView) => {
    const { from, to } = view.state.selection.main;
    const selectedText = view.state.doc.sliceString(from, to);
    const newText = selectedText ? `\`${selectedText}\`` : '`代码`';
    view.dispatch({
      changes: { from, to, insert: newText },
      selection: { anchor: from + newText.length },
    });
    return true;
  },

  /**
   * 插入 Markdown 标题标记
   */
  heading: (view: EditorView, level: number = 1) => {
    const line = view.state.doc.lineAt(view.state.selection.main.from);
    const hashes = '#'.repeat(level) + ' ';
    const newText = `${hashes}${line.text}`;
    view.dispatch({
      changes: { from: line.from, to: line.to, insert: newText },
    });
    return true;
  },

  /**
   * 插入 Markdown 链接
   */
  link: (view: EditorView) => {
    const { from, to } = view.state.selection.main;
    const selectedText = view.state.doc.sliceString(from, to);
    const newText = selectedText ? `[${selectedText}](URL)` : '[链接文本](URL)';
    view.dispatch({
      changes: { from, to, insert: newText },
      selection: { anchor: from + newText.length - 4 }, // 选中 'URL'
    });
    return true;
  },

  /**
   * 插入 Markdown 图片
   */
  image: (view: EditorView) => {
    const newText = '![图片描述](图片URL)';
    view.dispatch({
      changes: { from: view.state.selection.main.from, insert: newText },
      selection: { anchor: view.state.selection.main.from + 2 }, // 选中 '图片描述'
    });
    return true;
  },

  /**
   * 插入 Markdown 代码块
   */
  codeBlock: (view: EditorView) => {
    const { from } = view.state.selection.main;
    const newText = '\n```\n代码块\n```\n';
    view.dispatch({
      changes: { from, insert: newText },
      selection: { anchor: from + 5 }, // 选中 '代码块'
    });
    return true;
  },

  /**
   * 插入 Markdown 引用
   */
  quote: (view: EditorView) => {
    const { from, to } = view.state.selection.main;
    const lines = view.state.doc.sliceString(from, to).split('\n');
    const quotedLines = lines.map(line => `> ${line}`).join('\n');
    const newText = quotedLines || '> 引用文本';
    view.dispatch({
      changes: { from, to, insert: newText },
    });
    return true;
  },

  /**
   * 插入 Markdown 列表项
   */
  list: (view: EditorView, ordered: boolean = false) => {
    const { from, to } = view.state.selection.main;
    const lines = view.state.doc.sliceString(from, to).split('\n');
    const listPrefix = ordered ? '1. ' : '- ';
    const listedLines = lines.map(line => `${listPrefix}${line}`).join('\n');
    const newText = listedLines || `${listPrefix}列表项`;
    view.dispatch({
      changes: { from, to, insert: newText },
    });
    return true;
  },
};
