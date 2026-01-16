/**
 * @fileoverview MindFlow 编辑器的共享常量定义
 * @description 包含应用元信息、文件扩展名、编辑器设置、UI 尺寸等常量
 * @module shared/constants
 * @author MindFlow Team
 * @license MIT
 */

// ==================== 应用元信息 ====================

/** 应用名称 */
export const APP_NAME = 'MindFlow';

/** 应用版本号（遵循语义化版本规范 Semantic Versioning） */
export const APP_VERSION = '0.1.0';

/** 应用简短描述 */
export const APP_DESCRIPTION = 'A minimalist Markdown editor';

// ==================== 文件系统相关常量 ====================

/**
 * 支持的 Markdown 文件扩展名列表
 * @description 用于识别和过滤 Markdown 文件
 */
export const MARKDOWN_EXTENSIONS = [
  '.md',        // 标准 Markdown 扩展名
  '.markdown',  // 完整 Markdown 扩展名
  '.mdown',     // 备选扩展名
  '.mkd',       // 简短扩展名
] as const;

// ==================== 编辑器设置常量 ====================

/**
 * 默认编辑器字体大小
 * @description 单位：像素 (px)
 */
export const DEFAULT_FONT_SIZE = 14;

/**
 * 默认 Tab 键宽度
 * @description 按 Tab 键时插入的空格数
 */
export const DEFAULT_TAB_SIZE = 4;

/**
 * 默认编辑器字体
 * @description 使用等宽字体，优先使用 Fira Code（支持连字特性）
 */
export const DEFAULT_FONT_FAMILY = 'Fira Code, monospace';

// ==================== 自动保存设置常量 ====================

/**
 * 默认自动保存延迟时间
 * @description 单位：毫秒 (ms)，默认为 1 秒
 * @example 1000 表示用户停止输入 1 秒后自动保存
 */
export const DEFAULT_AUTO_SAVE_DELAY = 1000;

// ==================== UI 布局尺寸常量 ====================

/**
 * 文件树侧边栏默认宽度
 * @description 单位：像素 (px)
 */
export const SIDEBAR_WIDTH = 250;

/**
 * 文件列表区域默认宽度
 * @description 单位：像素 (px)
 */
export const FILE_LIST_WIDTH = 200;

/**
 * 侧边栏最小宽度
 * @description 用户调整侧边栏宽度时的最小限制
 */
export const MIN_SIDEBAR_WIDTH = 150;

/**
 * 侧边栏最大宽度
 * @description 用户调整侧边栏宽度时的最大限制
 */
export const MAX_SIDEBAR_WIDTH = 400;
