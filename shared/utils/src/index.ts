/**
 * @fileoverview MindFlow 编辑器的共享工具函数
 * @description 提供文件判断、ID 生成、日期格式化、防抖节流等通用工具函数
 * @module shared/utils
 * @author MindFlow Team
 * @license MIT
 */

import { MARKDOWN_EXTENSIONS } from '@mindflow/constants';

// ==================== 文件相关工具函数 ====================

/**
 * 判断文件是否为 Markdown 文件
 * @param filename - 文件名，包含扩展名
 * @returns 如果是 Markdown 文件返回 true，否则返回 false
 * @example
 * ```ts
 * isMarkdownFile('document.md')      // true
 * isMarkdownFile('document.txt')     // false
 * isMarkdownFile('README.markdown')  // true
 * ```
 */
export function isMarkdownFile(filename: string): boolean {
  return MARKDOWN_EXTENSIONS.some(ext => filename.endsWith(ext));
}

// ==================== ID 生成工具函数 ====================

/**
 * 生成唯一标识符
 * @description 基于时间戳和随机字符串生成唯一 ID
 * @returns 格式为 "时间戳-随机字符串" 的唯一 ID
 * @example
 * ```ts
 * generateId() // "1704441234567-a1b2c3d4e"
 * ```
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// ==================== 日期时间工具函数 ====================

/**
 * 格式化日期为本地化字符串
 * @param date - 要格式化的日期对象
 * @returns 本地化的日期时间字符串
 * @example
 * ```ts
 * formatDate(new Date()) // "2026/1/15 17:30:00"
 * ```
 */
export function formatDate(date: Date): string {
  return date.toLocaleString();
}

// ==================== 函数增强工具函数 ====================

/**
 * 创建防抖函数
 * @description 防抖函数会在调用后等待一定时间，如果在此期间再次调用则重新计时
 * @param func - 需要防抖的函数
 * @param wait - 等待时间（毫秒）
 * @returns 防抖后的函数
 * @example
 * ```ts
 * const debouncedSave = debounce(() => saveFile(), 1000);
 * // 用户输入时调用 debouncedSave，只有在停止输入 1 秒后才会执行保存
 * ```
 * @template T - 函数类型
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

/**
 * 创建节流函数
 * @description 节流函数会限制函数的执行频率，在一定时间内只执行一次
 * @param func - 需要节流的函数
 * @param limit - 限制时间间隔（毫秒）
 * @returns 节流后的函数
 * @example
 * ```ts
 * const throttledScroll = throttle(() => handleScroll(), 100);
 * // 滚动事件触发时，最多每 100 毫秒执行一次 handleScroll
 * ```
 * @template T - 函数类型
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}
