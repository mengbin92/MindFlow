/**
 * @fileoverview 虚拟滚动列表组件
 * @description 用于高性能渲染大量数据，只渲染可见区域的项目
 * @module packages/web/components/VirtualList
 * @author MindFlow Team
 * @license MIT
 */

import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';

/**
 * 虚拟列表组件属性
 */
export interface VirtualListProps<T> {
  /** 数据列表 */
  items: T[];

  /** 渲染单个项目的函数 */
  renderItem: (item: T, index: number) => React.ReactNode;

  /** 项目的高度（像素） */
  itemHeight: number;

  /** 可见区域的高度（像素） */
  height: number;

  /** 额外渲染的上下缓冲区项目数量 */
  overscan?: number;

  /** 列表的唯一标识（用于重置滚动位置） */
  listId?: string;

  /** 容器类名 */
  className?: string;

  /** 滚动到指定项目 */
  scrollToIndex?: number;

  /** 项目是否可变高度（如果为true，需要提供getItemHeight） */
  variableHeight?: boolean;

  /** 获取项目高度的函数（用于可变高度） */
  getItemHeight?: (item: T, index: number) => number;
}

/**
 * 虚拟滚动列表组件
 * @description 高性能渲染大量数据，只渲染可见区域的项目
 */
export function VirtualList<T>({
  items,
  renderItem,
  itemHeight,
  height,
  overscan = 3,
  listId,
  className = '',
  scrollToIndex,
  variableHeight = false,
  getItemHeight,
}: VirtualListProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);

  // 计算所有项目的位置和高度（用于可变高度）
  const itemMetrics = useMemo(() => {
    if (!variableHeight) {
      return null;
    }

    let totalHeight = 0;
    const metrics = items.map((item, index) => {
      const height = getItemHeight?.(item, index) || itemHeight;
      const start = totalHeight;
      totalHeight += height;
      return { start, height, end: totalHeight };
    });

    return { metrics, totalHeight };
  }, [items, variableHeight, getItemHeight, itemHeight]);

  // 计算总高度
  const totalHeight = useMemo(() => {
    if (itemMetrics) {
      return itemMetrics.totalHeight;
    }
    return items.length * itemHeight;
  }, [items.length, itemHeight, itemMetrics]);

  // 计算可见范围
  const { visibleStart, visibleEnd, startIndex } = useMemo(() => {
    if (variableHeight && itemMetrics) {
      // 二分查找找到第一个可见项目
      let left = 0;
      let right = items.length - 1;
      let firstVisibleIndex = 0;

      while (left <= right) {
        const mid = Math.floor((left + right) / 2);
        const metric = itemMetrics.metrics[mid];

        if (metric.end < scrollTop) {
          left = mid + 1;
        } else if (metric.start > scrollTop + height) {
          right = mid - 1;
        } else {
          firstVisibleIndex = mid;
          right = mid - 1;
        }
      }

      // 计算可见范围
      let currentY = itemMetrics.metrics[firstVisibleIndex]?.start || 0;
      let endIndex = firstVisibleIndex;

      for (let i = firstVisibleIndex; i < items.length; i++) {
        if (currentY > scrollTop + height) {
          break;
        }
        endIndex = i;
        currentY += itemMetrics.metrics[i].height;
      }

      return {
        startIndex: firstVisibleIndex,
        visibleStart: Math.max(0, firstVisibleIndex - overscan),
        visibleEnd: Math.min(items.length, endIndex + 1 + overscan),
      };
    } else {
      // 固定高度计算
      const startIndex = Math.floor(scrollTop / itemHeight);
      const visibleStart = Math.max(0, startIndex - overscan);
      const visibleEnd = Math.min(
        items.length,
        Math.ceil((scrollTop + height) / itemHeight) + overscan
      );

      return {
        startIndex,
        visibleStart,
        visibleEnd,
      };
    }
  }, [scrollTop, height, itemHeight, overscan, items.length, variableHeight, itemMetrics]);

  // 处理滚动事件（节流）
  const handleScroll = useCallback(
    throttle((e: React.UIEvent<HTMLDivElement>) => {
      setScrollTop(e.currentTarget.scrollTop);
    }, 16), // 60fps
    []
  );

  // 滚动到指定项目
  useEffect(() => {
    if (scrollToIndex !== undefined && containerRef.current) {
      let targetScrollTop: number;

      if (variableHeight && itemMetrics) {
        targetScrollTop = itemMetrics.metrics[scrollToIndex]?.start || 0;
      } else {
        targetScrollTop = scrollToIndex * itemHeight;
      }

      containerRef.current.scrollTop = targetScrollTop;
    }
  }, [scrollToIndex, variableHeight, itemMetrics, itemHeight]);

  // 重置滚动位置
  useEffect(() => {
    if (listId && containerRef.current) {
      containerRef.current.scrollTop = 0;
      setScrollTop(0);
    }
  }, [listId]);

  // 渲染可见项目
  const visibleItems = useMemo(() => {
    const result: React.ReactNode[] = [];

    for (let i = visibleStart; i < visibleEnd; i++) {
      const item = items[i];
      if (!item) continue;

      let top: number;
      if (variableHeight && itemMetrics) {
        top = itemMetrics.metrics[i].start;
      } else {
        top = i * itemHeight;
      }

      result.push(
        <div
          key={i}
          style={{
            position: 'absolute',
            top: `${top}px`,
            left: 0,
            right: 0,
            height: variableHeight
              ? `${itemMetrics?.metrics[i].height || itemHeight}px`
              : `${itemHeight}px`,
          }}
        >
          {renderItem(item, i)}
        </div>
      );
    }

    return result;
  }, [
    visibleStart,
    visibleEnd,
    items,
    renderItem,
    itemHeight,
    variableHeight,
    itemMetrics,
  ]);

  return (
    <div
      ref={containerRef}
      className={`virtual-list ${className}`}
      style={{
        height: `${height}px`,
        overflow: 'auto',
        position: 'relative',
      }}
      onScroll={handleScroll}
    >
      <div
        style={{
          height: `${totalHeight}px`,
          position: 'relative',
        }}
      >
        {visibleItems}
      </div>
    </div>
  );
}

/**
 * 节流函数
 */
function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), wait);
    }
  };
}

export default VirtualList;
