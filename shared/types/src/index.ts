/**
 * @fileoverview MindFlow 编辑器的共享类型定义
 * @description 包含编辑器状态、文件系统、配置等核心类型定义
 * @module shared/types
 * @author MindFlow Team
 * @license MIT
 */

// ==================== 编辑器相关类型 ====================

/**
 * 编辑器状态接口
 * @description 定义编辑器的完整状态，包括内容、光标位置和选区
 */
export interface EditorState {
  /** 编辑器当前的文本内容 */
  content: string;

  /** 光标当前位置 */
  cursor: CursorPosition;

  /** 当前选区，如果没有选区则为 null */
  selection: Selection | null;
}

/**
 * 光标位置接口
 * @description 使用行列坐标表示光标在文档中的位置
 */
export interface CursorPosition {
  /** 行号（从 0 开始） */
  line: number;

  /** 列号（从 0 开始） */
  ch: number;
}

/**
 * 选区接口
 * @description 表示用户选择的一段文本范围
 */
export interface Selection {
  /** 选区起始位置 */
  from: CursorPosition;

  /** 选区结束位置 */
  to: CursorPosition;
}

// ==================== 文件系统相关类型 ====================

/**
 * Markdown 文件接口
 * @description 表示一个 Markdown 文件的元数据和内容
 */
export interface MarkdownFile {
  /** 文件唯一标识符 */
  id: string;

  /** 文件在文件系统中的完整路径 */
  path: string;

  /** 文件名（包含扩展名） */
  name: string;

  /** 文件的 Markdown 内容 */
  content: string;

  /** 文件创建时间 */
  createdAt: Date;

  /** 文件最后修改时间 */
  modifiedAt: Date;
}

/**
 * 文件夹接口
 * @description 表示一个文件夹，可以包含子文件夹和 Markdown 文件
 */
export interface Folder {
  /** 文件夹唯一标识符 */
  id: string;

  /** 文件夹在文件系统中的完整路径 */
  path: string;

  /** 文件夹名称 */
  name: string;

  /** 子项列表，可以是文件夹或文件 */
  children: (Folder | MarkdownFile)[];

  /** 是否折叠 */
  isCollapsed?: boolean;

  /** 最后修改时间 */
  modifiedAt: Date;
}

/**
 * 文件树节点接口
 * @description 表示文件树中的一个节点
 */
export interface FileTreeNode {
  /** 节点唯一标识符 */
  id: string;

  /** 节点名称 */
  name: string;

  /** 节点路径 */
  path: string;

  /** 是否为文件夹 */
  isDir: boolean;

  /** 子节点 */
  children?: FileTreeNode[];

  /** 文件大小（字节） */
  size?: number;

  /** 最后修改时间 */
  modifiedTime: number;

  /** 文件内容（仅文件） */
  content?: string;

  /** 是否折叠（仅文件夹） */
  isCollapsed?: boolean;
}

/**
 * 文件操作状态接口
 * @description 文件操作的异步状态
 */
export interface FileOperationState {
  /** 是否正在加载 */
  isLoading: boolean;

  /** 错误信息 */
  error: string | null;

  /** 最后操作时间 */
  lastOperation: Date | null;
}

/**
 * 文件搜索结果接口
 * @description 文件搜索的返回结果
 */
export interface SearchResult {
  /** 匹配的文件列表 */
  files: FileTreeNode[];

  /** 搜索关键字 */
  query: string;

  /** 搜索结果数量 */
  count: number;
}

// ==================== 配置相关类型 ====================

/**
 * 应用配置接口
 * @description 定义应用的所有可配置选项
 */
export interface AppConfig {
  /** 主题设置：light、dark 或 auto（跟随系统） */
  theme: 'light' | 'dark' | 'auto';

  /** 编辑器字体大小（像素） */
  fontSize: number;

  /** 编辑器字体系列 */
  fontFamily: string;

  /** Tab 键对应的空格数 */
  tabSize: number;

  /** 是否启用自动换行 */
  wordWrap: boolean;

  /** 是否显示行号 */
  lineNumbers: boolean;

  /** 是否启用自动保存 */
  autoSave: boolean;

  /** 自动保存延迟时间（毫秒） */
  autoSaveDelay: number;
}

/**
 * 默认应用配置
 * @description 应用首次启动时的默认配置
 */
export const DEFAULT_CONFIG: AppConfig = {
  theme: 'light',
  fontSize: 14,
  fontFamily: 'Fira Code',
  tabSize: 4,
  wordWrap: true,
  lineNumbers: true,
  autoSave: true,
  autoSaveDelay: 1000,
};
