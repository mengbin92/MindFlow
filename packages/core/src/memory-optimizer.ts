/**
 * @fileoverview 内存优化工具
 * @description 提供内存泄漏检测、资源清理和内存使用优化功能
 * @module packages/core/memory-optimizer
 * @author MindFlow Team
 * @license MIT
 */

/**
 * 资源类型
 */
export enum ResourceType {
  EventListener = 'event-listener',
  Interval = 'interval',
  Timeout = 'timeout',
  Observer = 'observer',
  Worker = 'worker',
  Custom = 'custom',
}

/**
 * 资源记录
 */
interface ResourceRecord {
  type: ResourceType;
  resource: unknown;
  cleanup: () => void;
  metadata?: Record<string, unknown>;
}

/**
 * 内存管理器类
 */
export class MemoryManager {
  private resources: Map<string, ResourceRecord> = new Map();
  private isEnabled: boolean = true;
  private resourceCounter: number = 0;

  constructor(enabled: boolean = true) {
    this.isEnabled = enabled;
  }

  /**
   * 注册资源
   */
  registerResource(
    type: ResourceType,
    resource: unknown,
    cleanup: () => void,
    metadata?: Record<string, unknown>
  ): string {
    if (!this.isEnabled) return '';

    const id = `resource-${++this.resourceCounter}`;

    this.resources.set(id, {
      type,
      resource,
      cleanup,
      metadata,
    });

    return id;
  }

  /**
   * 注销资源
   */
  unregisterResource(id: string): void {
    const record = this.resources.get(id);
    if (record) {
      try {
        record.cleanup();
      } catch (error) {
        console.error(`Error cleaning up resource ${id}:`, error);
      }
      this.resources.delete(id);
    }
  }

  /**
   * 清理所有资源
   */
  cleanup(): void {
    for (const [id] of this.resources) {
      this.unregisterResource(id);
    }
  }

  /**
   * 获取资源统计
   */
  getResourceStats(): Record<ResourceType, number> {
    const stats: Record<string, number> = {};

    for (const record of this.resources.values()) {
      stats[record.type] = (stats[record.type] || 0) + 1;
    }

    return stats as Record<ResourceType, number>;
  }

  /**
   * 启用/禁用内存管理
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }
}

/**
 * 全局内存管理器实例
 */
export const memoryManager = new MemoryManager(
  process.env.NODE_ENV === 'development'
);

/**
 * React Hook: 管理组件资源
 */
export function useResourceManager(): {
  registerResource: (
    type: ResourceType,
    resource: unknown,
    cleanup: () => void,
    metadata?: Record<string, unknown>
  ) => string;
  unregisterResource: (id: string) => void;
  cleanup: () => void;
} {
  const resourcesRef = React.useRef<Set<string>>(new Set());

  React.useEffect(() => {
    return () => {
      // 组件卸载时清理所有资源
      for (const id of resourcesRef.current) {
        memoryManager.unregisterResource(id);
      }
      resourcesRef.current.clear();
    };
  }, []);

  const registerResource = React.useCallback(
    (
      type: ResourceType,
      resource: unknown,
      cleanup: () => void,
      metadata?: Record<string, unknown>
    ): string => {
      const id = memoryManager.registerResource(type, resource, cleanup, metadata);
      resourcesRef.current.add(id);
      return id;
    },
    []
  );

  const unregisterResource = React.useCallback((id: string) => {
    memoryManager.unregisterResource(id);
    resourcesRef.current.delete(id);
  }, []);

  const cleanup = React.useCallback(() => {
    for (const id of resourcesRef.current) {
      memoryManager.unregisterResource(id);
    }
    resourcesRef.current.clear();
  }, []);

  return {
    registerResource,
    unregisterResource,
    cleanup,
  };
}

/**
 * 内存泄漏检测器
 */
export class MemoryLeakDetector {
  private snapshots: Map<string, number> = new Map();
  private threshold: number;

  constructor(threshold: number = 100) {
    // 内存增长阈值（KB）
    this.threshold = threshold;
  }

  /**
   * 创建内存快照
   */
  takeSnapshot(label: string): void {
    if (typeof window === 'undefined' || !(performance as any).memory) {
      return;
    }

    const memory = (performance as any).memory;
    const usedMemory = memory.usedJSHeapSize / 1024; // KB

    this.snapshots.set(label, usedMemory);
  }

  /**
   * 比较内存快照，检测泄漏
   */
  compareSnapshots(label1: string, label2: string): {
    leaked: boolean;
    difference: number;
  } {
    const memory1 = this.snapshots.get(label1) || 0;
    const memory2 = this.snapshots.get(label2) || 0;
    const difference = memory2 - memory1;
    const leaked = difference > this.threshold;

    return {
      leaked,
      difference,
    };
  }

  /**
   * 清除所有快照
   */
  clearSnapshots(): void {
    this.snapshots.clear();
  }
}

/**
 * 全局内存泄漏检测器实例
 */
export const memoryLeakDetector = new MemoryLeakDetector();

/**
 * WeakMap工具：用于存储不阻止垃圾回收的数据
 */
export class WeakCache<K extends object, V> {
  private cache = new WeakMap<K, V>();
  private maxAge: number;
  private timestamps = new WeakMap<K, number>();

  constructor(maxAge: number = 5 * 60 * 1000) {
    // 默认5分钟过期
    this.maxAge = maxAge;
  }

  /**
   * 设置缓存
   */
  set(key: K, value: V): void {
    this.cache.set(key, value);
    this.timestamps.set(key, Date.now());
  }

  /**
   * 获取缓存
   */
  get(key: K): V | undefined {
    const timestamp = this.timestamps.get(key);
    if (!timestamp) return undefined;

    // 检查是否过期
    if (Date.now() - timestamp > this.maxAge) {
      this.cache.delete(key);
      this.timestamps.delete(key);
      return undefined;
    }

    return this.cache.get(key);
  }

  /**
   * 清除缓存
   */
  clear(): void {
    this.cache = new WeakMap();
    this.timestamps = new WeakMap();
  }
}

/**
 * LRU缓存实现
 */
export class LRUCache<K, V> {
  private cache: Map<K, V>;
  private maxSize: number;

  constructor(maxSize: number = 100) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }

  /**
   * 设置缓存
   */
  set(key: K, value: V): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      // 删除最旧的项（第一个）
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, value);
  }

  /**
   * 获取缓存
   */
  get(key: K): V | undefined {
    if (!this.cache.has(key)) {
      return undefined;
    }

    // 移到最后（标记为最近使用）
    const value = this.cache.get(key)!;
    this.cache.delete(key);
    this.cache.set(key, value);

    return value;
  }

  /**
   * 清除缓存
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * 获取缓存大小
   */
  size(): number {
    return this.cache.size;
  }
}

/**
 * 优化的大型字符串缓存
 */
export class StringCache {
  private cache = new LRUCache<string, string>(50);
  private maxSize: number;

  constructor(maxSize: number = 10000) {
    // 单个字符串最大10KB
    this.maxSize = maxSize;
  }

  /**
   * 缓存字符串
   */
  set(key: string, value: string): boolean {
    if (value.length > this.maxSize) {
      return false; // 不缓存过大的字符串
    }

    this.cache.set(key, value);
    return true;
  }

  /**
   * 获取缓存字符串
   */
  get(key: string): string | undefined {
    return this.cache.get(key);
  }

  /**
   * 清除缓存
   */
  clear(): void {
    this.cache.clear();
  }
}

/**
 * 批处理更新工具
 */
export class BatchProcessor<T> {
  private queue: T[] = [];
  private processing: boolean = false;
  private processor: (items: T[]) => Promise<void> | void;
  private batchSize: number;
  private delay: number;

  constructor(
    processor: (items: T[]) => Promise<void> | void,
    batchSize: number = 10,
    delay: number = 0
  ) {
    this.processor = processor;
    this.batchSize = batchSize;
    this.delay = delay;
  }

  /**
   * 添加项目到队列
   */
  add(item: T): void {
    this.queue.push(item);

    if (!this.processing) {
      this.processQueue();
    }
  }

  /**
   * 处理队列
   */
  private async processQueue(): Promise<void> {
    this.processing = true;

    while (this.queue.length > 0) {
      const batch = this.queue.splice(0, this.batchSize);

      if (this.delay > 0) {
        await new Promise(resolve => setTimeout(resolve, this.delay));
      }

      try {
        await this.processor(batch);
      } catch (error) {
        console.error('Batch processing error:', error);
      }
    }

    this.processing = false;
  }

  /**
   * 清空队列
   */
  clear(): void {
    this.queue = [];
  }
}
