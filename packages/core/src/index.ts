/**
 * @fileoverview MindFlow 核心编辑器模块
 * @description 导出核心编辑器功能，包括编辑器创建、解析器、主题管理和插件系统
 * @module packages/core
 * @author MindFlow Team
 * @license MIT
 */

/**
 * 导出编辑器相关功能
 * @description 提供创建和管理 CodeMirror 编辑器的能力
 */
export { createEditor } from './editor';
export type { EditorConfig, EditorController } from './editor';

/**
 * 导出 Markdown 解析器
 * @description 将 Markdown 文本解析为 HTML
 */
export { MarkdownParser, parser } from './parser';

/**
 * 导出主题管理器
 * @description 管理应用主题（浅色/深色）
 */
export { ThemeManager, themeManager } from './themes';
export type { Theme } from './themes';

/**
 * 导出插件系统
 * @description 提供插件注册和管理功能
 */
export * from './plugins';

/**
 * 导出快捷键系统
 * @description 提供快捷键注册、绑定和管理功能
 */
export * from './shortcuts';

/**
 * 导出自动保存系统
 * @description 提供自动保存、延迟保存和本地存储功能
 */
export * from './auto-save';

/**
 * 导出扩展语法处理器
 * @description 支持 LaTeX、Mermaid、Markmap、PlantUML 等扩展语法
 */
export {
  ExtendedSyntaxProcessor,
  extendedSyntaxProcessor,
  ExtendedSyntaxType,
} from './extended-syntax';

/**
 * 导出导出功能
 * @description 支持 PDF、HTML、图片等多种格式的导出功能
 */
export { Exporter, exporter } from './exporter';
export type { ExportOptions, ExportResult } from './exporter';
export { ExportFormat } from './exporter';

/**
 * 导出演示模式功能
 * @description 基于 reveal.js 的 PPT 演示功能
 */
export { Presenter, presenter } from './presentation';
export type { PresentationOptions, PresentationState, SlideInfo } from './presentation';
