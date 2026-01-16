/**
 * @fileoverview 主题管理系统
 * @description 管理应用主题（浅色/深色），支持持久化存储和系统主题检测
 * @module packages/core/themes
 * @author MindFlow Team
 * @license MIT
 */

/**
 * 主题类型定义
 * @description 支持的两种主题模式
 */
export type Theme = 'light' | 'dark';

/**
 * 主题监听器类型
 * @description 主题变化时的回调函数类型
 */
type ThemeListener = (theme: Theme) => void;

/**
 * 主题管理器类
 * @description 管理应用的主题状态，支持切换、持久化、订阅等功能
 */
export class ThemeManager {
  /** 当前主题状态，默认为浅色主题 */
  private currentTheme: Theme = 'light';

  /** 主题变化监听器集合 */
  private listeners: Set<ThemeListener> = new Set();

  /** LocalStorage 存储键名 */
  private static readonly STORAGE_KEY = 'mindflow-theme';

  /**
   * 获取当前主题
   * @returns 当前主题类型
   * @example
   * ```ts
   * const manager = new ThemeManager();
   * const theme = manager.getTheme(); // 'light' 或 'dark'
   * ```
   */
  getTheme(): Theme {
    return this.currentTheme;
  }

  /**
   * 设置主题
   * @param theme - 要设置的主题类型
   * @example
   * ```ts
   * manager.setTheme('dark');
   * // 主题会立即更新并持久化到 localStorage
   * ```
   */
  setTheme(theme: Theme): void {
    this.currentTheme = theme;
    this.notifyListeners();
    this.saveTheme(theme);
  }

  /**
   * 切换主题
   * @description 在浅色和深色主题之间切换
   * @example
   * ```ts
   * manager.toggleTheme();
   * // 如果当前是 light 则切换为 dark，反之亦然
   * ```
   */
  toggleTheme(): void {
    this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
    this.notifyListeners();
    this.saveTheme(this.currentTheme);
  }

  /**
   * 订阅主题变化
   * @param callback - 主题变化时的回调函数
   * @returns 取消订阅的函数
   * @example
   * ```ts
   * const unsubscribe = manager.subscribe((theme) => {
   *   console.log('主题已切换为:', theme);
   *   // 更新 UI 等
   * });
   *
   * // 不再需要监听时取消订阅
   * unsubscribe();
   * ```
   */
  subscribe(callback: ThemeListener): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  /**
   * 通知所有监听器主题已变化
   * @description 内部方法，在主题改变时调用所有注册的回调函数
   */
  private notifyListeners(): void {
    this.listeners.forEach(callback => callback(this.currentTheme));
  }

  /**
   * 保存主题到 localStorage
   * @description 持久化主题设置，以便下次打开应用时恢复
   * @param theme - 要保存的主题类型
   */
  private saveTheme(theme: Theme): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(ThemeManager.STORAGE_KEY, theme);
    }
  }

  /**
   * 从 localStorage 加载保存的主题
   * @description 尝试从本地存储恢复用户的主题偏好
   * @returns 保存的主题，如果不存在则返回 null
   * @example
   * ```ts
   * const savedTheme = manager.loadTheme();
   * if (savedTheme) {
   *   manager.setTheme(savedTheme);
   * }
   * ```
   */
  loadTheme(): Theme | null {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(ThemeManager.STORAGE_KEY);
      if (saved === 'light' || saved === 'dark') {
        return saved;
      }
    }
    return null;
  }

  /**
   * 初始化主题管理器
   * @description 加载保存的主题，如果不存在则检测系统主题偏好
   * @example
   * ```ts
   * const manager = new ThemeManager();
   * manager.init(); // 应在应用启动时调用
   * ```
   */
  init(): void {
    const savedTheme = this.loadTheme();
    if (savedTheme) {
      // 使用保存的主题
      this.currentTheme = savedTheme;
    } else if (typeof window !== 'undefined') {
      // 检测系统主题偏好
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      this.currentTheme = prefersDark ? 'dark' : 'light';
    }
  }
}

/**
 * 全局主题管理器实例
 * @description 导出的单例实例，可直接使用而无需手动创建
 * @example
 * ```ts
 * import { themeManager } from '@mindflow/core';
 *
 * // 初始化（应用启动时调用一次）
 * themeManager.init();
 *
 * // 订阅主题变化
 * themeManager.subscribe((theme) => {
 *   // 更新 UI
 * });
 *
 * // 切换主题
 * themeManager.toggleTheme();
 * ```
 */
export const themeManager = new ThemeManager();
