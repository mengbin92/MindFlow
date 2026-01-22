/**
 * @fileoverview 演示模式组件
 * @description 基于 reveal.js 的全屏演示模式 UI
 * @module packages/web/components/PresentationMode
 * @author MindFlow Team
 * @license MIT
 */

import React, { useEffect, useRef, useState } from 'react';
import { presenter, PresentationState, PresentationOptions } from '@mindflow/core';

/**
 * 演示模式组件属性
 */
interface PresentationModeProps {
  /** Markdown 内容 */
  markdown: string;

  /** 是否显示演示模式 */
  isVisible: boolean;

  /** 关闭回调 */
  onClose: () => void;

  /** 演示选项 */
  options?: PresentationOptions;

  /** 状态变化回调 */
  onStateChange?: (state: PresentationState) => void;
}

/**
 * 演示模式组件
 */
const PresentationMode: React.FC<PresentationModeProps> = ({
  markdown,
  isVisible,
  onClose,
  options = {},
  onStateChange,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [state, setState] = useState<PresentationState>({
    currentSlide: 0,
    totalSlides: 0,
    isPresenting: false,
    isFullscreen: false,
  });

  /**
   * 启动演示模式
   */
  useEffect(() => {
    if (isVisible && iframeRef.current) {
      presenter.onStateChange((newState) => {
        setState(newState);
        onStateChange?.(newState);
      });

      presenter.startInIframe(markdown, iframeRef.current, options);
    }

    return () => {
      if (isVisible) {
        presenter.stop();
      }
    };
  }, [isVisible, markdown, options]);

  /**
   * 处理键盘事件
   */
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isVisible) return;

      switch (event.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowRight':
        case ' ': // Space
        case 'Enter':
          presenter.nextSlide();
          break;
        case 'ArrowLeft':
        case 'Backspace':
          presenter.previousSlide();
          break;
        case 'f':
        case 'F':
          // 切换全屏
          if (containerRef.current) {
            if (document.fullscreenElement) {
              document.exitFullscreen();
            } else {
              containerRef.current.requestFullscreen();
            }
          }
          break;
        case 'o':
        case 'O':
          // 切换 overview 模式（通过 postMessage）
          if (iframeRef.current) {
            iframeRef.current.contentWindow?.postMessage({ type: 'toggle-overview' }, '*');
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isVisible, onClose]);

  if (!isVisible) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className="presentation-overlay"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 9999,
        backgroundColor: options.backgroundColor || '#000',
      }}
    >
      {/* 控制栏 */}
      <div
        className="presentation-controls"
        style={{
          position: 'absolute',
          top: 20,
          right: 20,
          zIndex: 10000,
          display: 'flex',
          gap: 10,
          alignItems: 'center',
        }}
      >
        {/* 幻灯片信息 */}
        <div
          className="slide-info"
          style={{
            color: '#fff',
            fontSize: '14px',
            fontFamily: 'sans-serif',
            background: 'rgba(0, 0, 0, 0.5)',
            padding: '8px 12px',
            borderRadius: '4px',
          }}
        >
          {state.currentSlide + 1} / {state.totalSlides}
        </div>

        {/* 关闭按钮 */}
        <button
          onClick={onClose}
          style={{
            background: 'rgba(255, 255, 255, 0.2)',
            border: 'none',
            color: '#fff',
            padding: '8px 12px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
          }}
          title="按 ESC 退出"
        >
          ✕ 退出 (ESC)
        </button>
      </div>

      {/* 演示 iframe */}
      <iframe
        ref={iframeRef}
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
          margin: 0,
          padding: 0,
        }}
        title="Presentation"
      />
    </div>
  );
};

export default PresentationMode;
