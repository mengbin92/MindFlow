/**
 * @fileoverview 编辑器插件系统
 * @description 提供插件注册、管理和生命周期管理的功能
 * @module packages/core/plugins
 * @author MindFlow Team
 * @license MIT
 */

/**
 * 插件接口
 * @description 定义插件的基本结构和生命周期方法
 */
export interface Plugin {
  /** 插件名称，必须唯一 */
  name: string;

  /** 插件版本号 */
  version: string;

  /** 插件初始化方法，注册时调用 */
  init(): void;

  /** 插件销毁方法，可选，卸载时调用 */
  destroy?(): void;
}

/**
 * 插件管理器类
 * @description 管理编辑器的所有插件，提供注册、注销、查询等功能
 */
export class PluginManager {
  /** 插件映射表，使用插件名称作为键 */
  private plugins: Map<string, Plugin> = new Map();

  /**
   * 注册插件
   * @param plugin - 要注册的插件实例
   * @throws {Error} 如果插件名称已存在则抛出错误
   * @example
   * ```ts
   * const myPlugin: Plugin = {
   *   name: 'word-count',
   *   version: '1.0.0',
   *   init() {
   *     console.log('Word count plugin initialized');
   *   },
   *   destroy() {
   *     console.log('Word count plugin destroyed');
   *   }
   * };
   *
   * pluginManager.register(myPlugin);
   * // 输出: Word count plugin initialized
   * ```
   */
  register(plugin: Plugin): void {
    if (this.plugins.has(plugin.name)) {
      throw new Error(`Plugin ${plugin.name} is already registered`);
    }
    this.plugins.set(plugin.name, plugin);
    plugin.init();
  }

  /**
   * 注销插件
   * @param name - 要注销的插件名称
   * @description 会调用插件的 destroy 方法（如果存在）
   * @example
   * ```ts
   * pluginManager.unregister('word-count');
   * // 输出: Word count plugin destroyed
   * ```
   */
  unregister(name: string): void {
    const plugin = this.plugins.get(name);
    if (plugin) {
      plugin.destroy?.();
      this.plugins.delete(name);
    }
  }

  /**
   * 获取指定插件
   * @param name - 插件名称
   * @returns 插件实例，如果不存在则返回 undefined
   * @example
   * ```ts
   * const plugin = pluginManager.get('word-count');
   * if (plugin) {
   *   console.log(`Plugin version: ${plugin.version}`);
   * }
   * ```
   */
  get(name: string): Plugin | undefined {
    return this.plugins.get(name);
  }

  /**
   * 获取所有已注册的插件
   * @returns 包含所有插件的数组
   * @example
   * ```ts
   * const allPlugins = pluginManager.getAll();
   * console.log(`Total plugins: ${allPlugins.length}`);
   * ```
   */
  getAll(): Plugin[] {
    return Array.from(this.plugins.values());
  }
}

/**
 * 全局插件管理器实例
 * @description 导出的单例实例，可直接使用而无需手动创建
 * @example
 * ```ts
 * import { pluginManager } from '@mindflow/core';
 *
 * // 注册插件
 * pluginManager.register(myPlugin);
 *
 * // 获取所有插件
 * const plugins = pluginManager.getAll();
 * ```
 */
export const pluginManager = new PluginManager();
