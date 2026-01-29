/**
 * @fileoverview 性能监控工具
 * @description 提供性能指标收集、监控和报告功能
 * @module packages/core/performance
 * @author MindFlow Team
 * @license MIT
 */

import React from 'react';

/**
 * 性能指标类型
 */
export interface PerformanceMetrics {
  /** 启动时间 */
  startupTime: number;
  /** 首次渲染时间 */
  firstRenderTime: number;
  /** 内存使用情况（MB） */
  memoryUsage?: number;
  /** 交互响应时间 */
  interactionTime?: number;
  /** 自定义指标 */
  customMetrics: Record<string, number>;
}

/**
 * 性能标记
 */
export interface PerformanceMark {
  name: string;
  startTime: number;
  duration?: number;
  metadata?: Record<string, unknown>;
}

/**
 * 性能监控器类
 */
export class PerformanceMonitor {
  private marks: Map<string, PerformanceMark> = new Map();
  private measures: Map<string, number> = new Map();
  private isEnabled: boolean = true;
  private startUpTimestamp: number = 0;

  constructor(enabled: boolean = true) {
    this.isEnabled = enabled;
    if (typeof window !== 'undefined' && 'performance' in window) {
      this.startUpTimestamp = performance.now();
    }
  }

  /**
   * 启用/禁用性能监控
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  /**
   * 开始标记
   */
  mark(name: string, metadata?: Record<string, unknown>): void {
    if (!this.isEnabled) return;

    const mark: PerformanceMark = {
      name,
      startTime: this.getTimestamp(),
      metadata,
    };

    this.marks.set(name, mark);

    if (typeof window !== 'undefined' && 'performance' in window) {
      performance.mark(`mf-${name}`);
    }
  }

  /**
   * 结束标记并计算持续时间
   */
  endMark(name: string): number | undefined {
    if (!this.isEnabled) return undefined;

    const mark = this.marks.get(name);
    if (!mark) {
      console.warn(`Performance mark "${name}" not found`);
      return undefined;
    }

    const endTime = this.getTimestamp();
    const duration = endTime - mark.startTime;
    mark.duration = duration;

    this.measures.set(name, duration);

    if (typeof window !== 'undefined' && 'performance' in window) {
      performance.measure(`mf-${name}`, `mf-${name}`);
    }

    return duration;
  }

  /**
   * 获取标记的持续时间
   */
  getMeasure(name: string): number | undefined {
    return this.measures.get(name);
  }

  /**
   * 获取所有测量结果
   */
  getAllMeasures(): Record<string, number> {
    return Object.fromEntries(this.measures);
  }

  /**
   * 测量异步函数执行时间
   */
  async measureAsync<T>(
    name: string,
    fn: () => Promise<T>
  ): Promise<T> {
    if (!this.isEnabled) {
      return fn();
    }

    this.mark(name);
    try {
      const result = await fn();
      this.endMark(name);
      return result;
    } catch (error) {
      this.endMark(name);
      throw error;
    }
  }

  /**
   * 测量同步函数执行时间
   */
  measure<T>(name: string, fn: () => T): T {
    if (!this.isEnabled) {
      return fn();
    }

    this.mark(name);
    try {
      const result = fn();
      this.endMark(name);
      return result;
    } catch (error) {
      this.endMark(name);
      throw error;
    }
  }

  /**
   * 获取当前时间戳
   */
  private getTimestamp(): number {
    if (typeof window !== 'undefined' && 'performance' in window) {
      return performance.now();
    }
    return Date.now();
  }

  /**
   * 获取内存使用情况（仅Chrome）
   */
  getMemoryUsage(): number | undefined {
    if (
      typeof window !== 'undefined' &&
      'performance' in window &&
      (performance as any).memory
    ) {
      return (performance as any).memory.usedJSHeapSize / 1024 / 1024; // MB
    }
    return undefined;
  }

  /**
   * 获取完整的性能指标
   */
  getMetrics(): PerformanceMetrics {
    const metrics: PerformanceMetrics = {
      startupTime: this.startUpTimestamp,
      firstRenderTime: this.getMeasure('first-render') || 0,
      memoryUsage: this.getMemoryUsage(),
      customMetrics: this.getAllMeasures(),
    };

    return metrics;
  }

  /**
   * 打印性能报告到控制台
   */
  logReport(): void {
    if (!this.isEnabled) return;

    const metrics = this.getMetrics();

    console.group('🚀 MindFlow Performance Report');
    console.log(`⏱️ Startup Time: ${metrics.startupTime.toFixed(2)}ms`);
    console.log(`🎨 First Render: ${metrics.firstRenderTime.toFixed(2)}ms`);

    if (metrics.memoryUsage) {
      console.log(`💾 Memory Usage: ${metrics.memoryUsage.toFixed(2)}MB`);
    }

    if (Object.keys(metrics.customMetrics).length > 0) {
      console.group('📊 Custom Metrics');
      for (const [name, value] of Object.entries(metrics.customMetrics)) {
        console.log(`${name}: ${value.toFixed(2)}ms`);
      }
      console.groupEnd();
    }

    console.groupEnd();
  }

  /**
   * 清除所有标记和测量
   */
  clear(): void {
    this.marks.clear();
    this.measures.clear();

    if (typeof window !== 'undefined' && 'performance' in window) {
      // 清除performance marks和measures
      try {
        performance.clearMarks();
        performance.clearMeasures();
      } catch {
        // 忽略错误
      }
    }
  }
}

/**
 * 全局性能监控器实例
 */
export const performanceMonitor = new PerformanceMonitor(
  process.env.NODE_ENV === 'development'
);

/**
 * 装饰器：测量类方法执行时间
 */
export function MeasurePerformance(
  target: unknown,
  propertyKey: string,
  descriptor: PropertyDescriptor
): PropertyDescriptor {
  const originalMethod = descriptor.value;

  descriptor.value = function (...args: unknown[]) {
    const name = `${target?.constructor?.name || 'Unknown'}.${propertyKey}`;
    return performanceMonitor.measure(name, () => originalMethod.apply(this, args));
  };

  return descriptor;
}

/**
 * React性能工具函数
 */

/**
 * 测量组件渲染性能
 */
export function useRenderPerformance(componentName: string): void {
  if (process.env.NODE_ENV !== 'development') return;

  React.useEffect(() => {
    performance.mark(`${componentName}-render-start`);

    return () => {
      performance.mark(`${componentName}-render-end`);
      performance.measure(
        `${componentName}-render`,
        `${componentName}-render-start`,
        `${componentName}-render-end`
      );

      const measure = performance.getEntriesByName(
        `${componentName}-render`
      )[0] as PerformanceMeasure;

      if (measure && measure.duration > 16) {
        // 超过一帧时间（60fps = 16.67ms）
        console.warn(
          `⚠️ Slow render detected: ${componentName} took ${measure.duration.toFixed(2)}ms`
        );
      }
    };
  });
}

/**
 * 防抖函数
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | undefined;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };

    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * 节流函数
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
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

/**
 * 批处理更新
 */
export function batchUpdates<T>(items: T[], batchSize: number, process: (item: T) => void): void {
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);

    // 使用requestIdleCallback或setTimeout进行批处理
    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      window.requestIdleCallback(() => {
        batch.forEach(process);
      });
    } else {
      setTimeout(() => {
        batch.forEach(process);
      }, 0);
    }
  }
}
