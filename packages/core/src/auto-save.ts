/**
 * @fileoverview 自动保存系统
 * @description 管理编辑器的自动保存功能，支持延迟保存和本地存储
 * @module packages/core/auto-save
 * @author MindFlow Team
 * @license MIT
 */

/**
 * 自动保存配置接口
 */
export interface AutoSaveConfig {
  /** 自动保存延迟时间（毫秒），默认 2000ms */
  delay?: number;

  /** 是否启用自动保存，默认为 true */
  enabled?: boolean;

  /** 保存数据回调函数 */
  onSave?: (content: string) => void | Promise<void>;

  /** 保存状态变化回调函数 */
  onSaveStateChange?: (state: SaveState) => void;
}

/**
 * 保存状态枚举
 */
export enum SaveState {
  /** 未保存 */
  Dirty = 'dirty',

  /** 保存中 */
  Saving = 'saving',

  /** 已保存 */
  Saved = 'saved',
}

/**
 * 自动保存管理器类
 * @description 管理编辑器的自动保存功能，支持防抖、状态跟踪等
 */
export class AutoSaveManager {
  /** 当前保存状态 */
  private currentState: SaveState = SaveState.Saved;

  /** 保存延迟定时器 */
  private saveTimer: NodeJS.Timeout | null = null;

  /** 自动保存延迟时间（毫秒） */
  private delay: number;

  /** 是否启用自动保存 */
  private enabled: boolean;

  /** 保存回调函数 */
  private onSave?: (content: string) => void | Promise<void>;

  /** 状态变化回调函数 */
  private onSaveStateChange?: (state: SaveState) => void;

  /** 当前编辑器内容 */
  private currentContent: string = '';

  /**
   * 创建自动保存管理器
   * @param config - 自动保存配置
   */
  constructor(config: AutoSaveConfig = {}) {
    this.delay = config.delay ?? 2000;
    this.enabled = config.enabled ?? true;
    this.onSave = config.onSave;
    this.onSaveStateChange = config.onSaveStateChange;
  }

  /**
   * 获取当前保存状态
   * @returns 当前保存状态
   */
  getState(): SaveState {
    return this.currentState;
  }

  /**
   * 检查当前是否需要保存
   * @returns 如果需要保存返回 true，否则返回 false
   */
  isDirty(): boolean {
    return this.currentState === SaveState.Dirty;
  }

  /**
   * 启用或禁用自动保存
   * @param enabled - 是否启用
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /**
   * 更新编辑器内容并触发自动保存
   * @param content - 编辑器内容
   */
  updateContent(content: string): void {
    this.currentContent = content;

    if (!this.enabled) {
      return;
    }

    // 设置为脏状态
    this.setState(SaveState.Dirty);

    // 清除之前的定时器
    if (this.saveTimer) {
      clearTimeout(this.saveTimer);
    }

    // 设置新的定时器
    this.saveTimer = setTimeout(() => {
      this.save();
    }, this.delay);
  }

  /**
   * 手动触发保存
   */
  async save(): Promise<void> {
    if (this.saveTimer) {
      clearTimeout(this.saveTimer);
      this.saveTimer = null;
    }

    // 设置为保存中状态
    this.setState(SaveState.Saving);

    try {
      // 执行保存回调
      if (this.onSave) {
        await Promise.resolve(this.onSave(this.currentContent));
      }

      // 设置为已保存状态
      this.setState(SaveState.Saved);
    } catch (error) {
      console.error('自动保存失败:', error);
      // 保存失败后仍保持脏状态
      this.setState(SaveState.Dirty);
    }
  }

  /**
   * 销毁自动保存管理器
   */
  destroy(): void {
    if (this.saveTimer) {
      clearTimeout(this.saveTimer);
      this.saveTimer = null;
    }
  }

  /**
   * 设置保存状态并通知回调
   * @param state - 新状态
   */
  private setState(state: SaveState): void {
    if (this.currentState !== state) {
      this.currentState = state;
      this.onSaveStateChange?.(state);
    }
  }
}

/**
 * 基于 localStorage 的自动保存实现
 * @description 自动将编辑器内容保存到 localStorage
 */
export class LocalStorageAutoSaveManager extends AutoSaveManager {
  /** localStorage 键名前缀 */
  private static readonly STORAGE_PREFIX = 'mindflow-autosave-';

  /** 文档标识符 */
  private docId: string;

  /**
   * 创建基于 localStorage 的自动保存管理器
   * @param docId - 文档唯一标识符
   * @param config - 自动保存配置
   */
  constructor(docId: string, config: AutoSaveConfig = {}) {
    // 设置默认保存回调为 localStorage 保存
    const localSaveConfig: AutoSaveConfig = {
      ...config,
      onSave: (content: string) => {
        localStorage.setItem(
          LocalStorageAutoSaveManager.STORAGE_PREFIX + docId,
          JSON.stringify({
            content,
            timestamp: Date.now(),
          })
        );
      },
    };

    super(localSaveConfig);
    this.docId = docId;

    // 初始化时尝试从 localStorage 加载内容
    this.loadFromStorage();
  }

  /**
   * 从 localStorage 加载内容
   * @returns 加载的内容，如果不存在则返回 null
   */
  loadFromStorage(): string | null {
    try {
      const data = localStorage.getItem(
        LocalStorageAutoSaveManager.STORAGE_PREFIX + this.docId
      );
      if (data) {
        const parsed = JSON.parse(data);
        return parsed.content || '';
      }
    } catch (error) {
      console.error('从 localStorage 加载内容失败:', error);
    }
    return null;
  }

  /**
   * 清除 localStorage 中的保存内容
   */
  clear(): void {
    localStorage.removeItem(LocalStorageAutoSaveManager.STORAGE_PREFIX + this.docId);
  }

  /**
   * 获取最后保存时间
   * @returns 最后保存时间戳，如果不存在则返回 null
   */
  getLastSavedTime(): number | null {
    try {
      const data = localStorage.getItem(
        LocalStorageAutoSaveManager.STORAGE_PREFIX + this.docId
      );
      if (data) {
        const parsed = JSON.parse(data);
        return parsed.timestamp || null;
      }
    } catch (error) {
      console.error('获取最后保存时间失败:', error);
    }
    return null;
  }

  /**
   * 格式化最后保存时间
   * @returns 格式化后的时间字符串
   */
  getLastSavedTimeString(): string {
    const timestamp = this.getLastSavedTime();
    if (!timestamp) {
      return '从未保存';
    }

    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    // 小于 1 分钟
    if (diff < 60000) {
      return '刚刚保存';
    }

    // 小于 1 小时
    if (diff < 3600000) {
      const minutes = Math.floor(diff / 60000);
      return `${minutes} 分钟前保存`;
    }

    // 小于 24 小时
    if (diff < 86400000) {
      const hours = Math.floor(diff / 3600000);
      return `${hours} 小时前保存`;
    }

    // 超过 24 小时
    return date.toLocaleString();
  }
}
