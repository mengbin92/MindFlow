/**
 * @fileoverview 演示模式模块
 * @description 基于 reveal.js 实现的 PPT 演示功能
 * @module packages/core/presentation
 * @author MindFlow Team
 * @license MIT
 */

import { parser } from './parser';

/**
 * 演示模式选项
 */
export interface PresentationOptions {
  /** 演示主题 */
  theme?: 'black' | 'white' | 'league' | 'beige' | 'sky' | 'night' | 'serif' | 'simple' | 'solarized';

  /** 过渡效果 */
  transition?: 'none' | 'fade' | 'slide' | 'convex' | 'concave' | 'zoom';

  /** 是否显示控制箭头 */
  controls?: boolean;

  /** 是否显示进度条 */
  progress?: boolean;

  /** 是否显示页码 */
  slideNumber?: boolean;

  /** 是否启用键盘导航 */
  keyboard?: boolean;

  /** 是否启用触摸导航 */
  touch?: boolean;

  /** 是否启用overview模式 */
  overview?: boolean;

  /** 是否全屏 */
  embedded?: boolean;

  /** 自动播放间隔（毫秒），0 表示不自动播放 */
  autoSlide?: number;

  /** 自动播放是否可由用户暂停 */
  autoSlideStoppable?: boolean;

  /** 循环播放 */
  loop?: boolean;

  /** 右到左的语言 */
  rtl?: boolean;

  /** 演示中心 */
  center?: boolean;

  /** 幻灯片分隔符（默认为 '---'） */
  separator?: string;

  /** 垂直幻灯片分隔符（默认为 '___'） */
  verticalSeparator?: string;

  /** 是否启用备注 */
  notes?: boolean;

  /** 背景颜色 */
  backgroundColor?: string;

  /** 背景图片 */
  backgroundImage?: string;

  /** 背景视频 */
  backgroundVideo?: string;

  /** 背景大小 */
  backgroundSize?: string;

  /** 背景位置 */
  backgroundPosition?: string;

  /** 背景重复 */
  backgroundRepeat?: string;

  /** 自定义 CSS */
  customCss?: string;
}

/**
 * 幻灯片信息
 */
export interface SlideInfo {
  /** 幻灯片索引 */
  index: number;

  /** 幻灯片内容 */
  content: string;

  /** 幻灯片标题 */
  title?: string;

  /** 是否为垂直幻灯片 */
  isVertical?: boolean;

  /** 演讲者备注 */
  note?: string;
}

/**
 * 演示状态
 */
export interface PresentationState {
  /** 当前幻灯片索引 */
  currentSlide: number;

  /** 总幻灯片数 */
  totalSlides: number;

  /** 是否正在演示 */
  isPresenting: boolean;

  /** 是否全屏 */
  isFullscreen: boolean;
}

/**
 * 演示器类
 * @description 提供基于 reveal.js 的演示功能
 */
export class Presenter {
  private revealApi: any = null;
  private slides: SlideInfo[] = [];
  private state: PresentationState = {
    currentSlide: 0,
    totalSlides: 0,
    isPresenting: false,
    isFullscreen: false,
  };
  private stateChangeCallback?: (state: PresentationState) => void;

  /**
   * 将 Markdown 转换为 reveal.js 格式
   * @param markdown - Markdown 文本
   * @param options - 演示选项
   * @returns reveal.js HTML
   */
  convertToPresentation(
    markdown: string,
    options: PresentationOptions = {}
  ): string {
    const separator = options.separator || '---';

    // 分割幻灯片
    const rawSlides = markdown.split(`\n${separator}\n`);

    this.slides = rawSlides.map((slide, index) => {
      // 提取演讲者备注
      const noteMatch = slide.match(/Note:\s*(.+?)(?:\n|$)/i);
      const note = noteMatch ? noteMatch[1].trim() : '';

      // 移除备注标记后的内容
      const slideContent = slide.replace(/Note:\s*.+?(?:\n|$)/gi, '').trim();

      const content = parser.parse(slideContent);
      const title = this.extractTitle(content);

      return {
        index,
        content,
        title,
        note,
      };
    });

    this.state.totalSlides = this.slides.length;

    // 生成 reveal.js HTML（包含演讲者备注）
    const slidesHtml = this.slides
      .map(slide => {
        if (slide.note) {
          return `<section>${slide.content}<aside class="notes">${slide.note}</aside></section>`;
        }
        return `<section>${slide.content}</section>`;
      })
      .join('\n');

    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MindFlow Presentation</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/reveal.js@4.5.0/dist/reveal.css">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/reveal.js@4.5.0/dist/theme/${options.theme || 'black'}.css">
  <style>
    body {
      background-color: ${options.backgroundColor || '#000'};
    }
    .reveal {
      ${options.customCss || ''}
    }
    .reveal h1, .reveal h2, .reveal h3, .reveal h4, .reveal h5, .reveal h6 {
      text-transform: none;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    .reveal pre {
      box-shadow: none;
    }
    .reveal code {
      font-family: 'SF Mono', Monaco, Consolas, 'Courier New', monospace;
    }
  </style>
</head>
<body>
  <div class="reveal">
    <div class="slides">
      ${slidesHtml}
    </div>
  </div>

  <script src="https://cdn.jsdelivr.net/npm/reveal.js@4.5.0/dist/reveal.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/reveal.js@4.5.0/plugin/notes/notes.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/reveal.js@4.5.0/plugin/zoom/zoom.js"></script>
  <script>
    // Initialize Reveal.js
    Reveal.initialize({
      hash: true,
      transition: '${options.transition || 'slide'}',
      controls: ${options.controls !== false},
      progress: ${options.progress !== false},
      slideNumber: ${options.slideNumber !== false},
      keyboard: ${options.keyboard !== false},
      touch: ${options.touch !== false},
      overview: ${options.overview !== false},
      embedded: ${options.embedded || false},
      autoSlide: ${options.autoSlide || 0},
      autoSlideStoppable: ${options.autoSlideStoppable !== false},
      loop: ${options.loop || false},
      rtl: ${options.rtl || false},
      center: ${options.center !== false},
      plugins: [ RevealNotes, RevealZoom ],

      // 演讲者视图配置
      overview: true,
    });

    // 启用演讲者备注
    Reveal.configure({
      showNotes: true,
    });

    // 通知父窗口当前幻灯片状态
    Reveal.on('slidechanged', event => {
      if (window.parent !== window) {
        window.parent.postMessage({
          type: 'presentation-slide-changed',
          currentSlide: event.indexh,
          totalSlides: Reveal.getTotalSlides()
        }, '*');
      }
    });

    // 通知父窗口演示已准备就绪
    Reveal.on('ready', event => {
      if (window.parent !== window) {
        window.parent.postMessage({
          type: 'presentation-ready',
          totalSlides: Reveal.getTotalSlides()
        }, '*');
      }
    });

    // 注册缩放插件（Alt + 点击可以放大元素）
    Reveal.registerPlugin(RevealZoom);
  </script>
</body>
</html>`;
  }

  /**
   * 在 iframe 中启动演示模式
   * @param markdown - Markdown 文本
   * @param iframe - iframe 元素
   * @param options - 演示选项
   */
  async startInIframe(
    markdown: string,
    iframe: HTMLIFrameElement,
    options: PresentationOptions = {}
  ): Promise<void> {
    const presentationHtml = this.convertToPresentation(markdown, options);

    // 设置 iframe 内容
    iframe.srcdoc = presentationHtml;

    // 监听来自 iframe 的消息
    window.addEventListener('message', this.handleIframeMessage);

    this.state.isPresenting = true;
    this.notifyStateChange();
  }

  /**
   * 在新窗口中启动演示模式
   * @param markdown - Markdown 文本
   * @param options - 演示选项
   */
  async startInNewWindow(
    markdown: string,
    options: PresentationOptions = {}
  ): Promise<void> {
    const presentationHtml = this.convertToPresentation(markdown, options);

    // 打开新窗口
    const newWindow = window.open('', '_blank');
    if (!newWindow) {
      throw new Error('Failed to open new window. Please allow popups for this site.');
    }

    newWindow.document.write(presentationHtml);
    newWindow.document.close();

    this.state.isPresenting = true;
    this.notifyStateChange();
  }

  /**
   * 在全屏模式下启动演示
   * @param markdown - Markdown 文本
   * @param options - 演示选项
   */
  async startFullscreen(
    markdown: string,
    options: PresentationOptions = {}
  ): Promise<void> {
    // 创建一个全屏容器
    const container = document.createElement('div');
    container.id = 'presentation-fullscreen-container';
    container.style.position = 'fixed';
    container.style.top = '0';
    container.style.left = '0';
    container.style.width = '100vw';
    container.style.height = '100vh';
    container.style.zIndex = '9999';
    container.style.background = options.backgroundColor || '#000';

    const iframe = document.createElement('iframe');
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.border = 'none';
    iframe.style.margin = '0';
    iframe.style.padding = '0';

    container.appendChild(iframe);
    document.body.appendChild(container);

    // 请求全屏
    if (container.requestFullscreen) {
      await container.requestFullscreen();
    } else if ((container as any).webkitRequestFullscreen) {
      await (container as any).webkitRequestFullscreen();
    } else if ((container as any).mozRequestFullScreen) {
      await (container as any).mozRequestFullScreen();
    } else if ((container as any).msRequestFullscreen) {
      await (container as any).msRequestFullscreen();
    }

    this.state.isFullscreen = true;

    // 启动演示
    await this.startInIframe(markdown, iframe, options);

    // 监听退出全屏事件
    document.addEventListener('fullscreenchange', this.handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', this.handleFullscreenChange);
  }

  /**
   * 停止演示模式
   */
  stop(): void {
    if (this.state.isFullscreen) {
      const container = document.getElementById('presentation-fullscreen-container');
      if (container) {
        document.body.removeChild(container);
      }
      this.state.isFullscreen = false;
    }

    this.state.isPresenting = false;
    this.notifyStateChange();
  }

  /**
   * 下一张幻灯片
   */
  nextSlide(): void {
    if (this.revealApi) {
      this.revealApi.next();
    }
  }

  /**
   * 上一张幻灯片
   */
  previousSlide(): void {
    if (this.revealApi) {
      this.revealApi.prev();
    }
  }

  /**
   * 跳转到指定幻灯片
   * @param index - 幻灯片索引
   */
  goToSlide(index: number): void {
    if (this.revealApi) {
      this.revealApi.slide(index);
    }
  }

  /**
   * 获取当前演示状态
   */
  getState(): PresentationState {
    return { ...this.state };
  }

  /**
   * 注册状态变化回调
   * @param callback - 状态变化回调函数
   */
  onStateChange(callback: (state: PresentationState) => void): void {
    this.stateChangeCallback = callback;
  }

  /**
   * 获取幻灯片列表
   */
  getSlides(): SlideInfo[] {
    return [...this.slides];
  }

  /**
   * 从 HTML 内容中提取标题
   * @param html - HTML 内容
   * @returns 标题
   */
  private extractTitle(html: string): string {
    // 尝试提取 h1 标题
    const h1Match = html.match(/<h1[^>]*>(.*?)<\/h1>/i);
    if (h1Match) {
      return h1Match[1].replace(/<[^>]*>/g, '');
    }

    // 尝试提取 h2 标题
    const h2Match = html.match(/<h2[^>]*>(.*?)<\/h2>/i);
    if (h2Match) {
      return h2Match[1].replace(/<[^>]*>/g, '');
    }

    // 如果没有标题，返回前50个字符
    const text = html.replace(/<[^>]*>/g, '').trim();
    return text.substring(0, 50) + (text.length > 50 ? '...' : '');
  }

  /**
   * 处理来自 iframe 的消息
   * @param event - 消息事件
   */
  private handleIframeMessage = (event: MessageEvent): void => {
    if (event.data.type === 'presentation-ready') {
      this.state.totalSlides = event.data.totalSlides;
      this.notifyStateChange();
    } else if (event.data.type === 'presentation-slide-changed') {
      this.state.currentSlide = event.data.currentSlide;
      this.notifyStateChange();
    }
  };

  /**
   * 处理全屏变化事件
   */
  private handleFullscreenChange = (): void => {
    const isFullscreen = !!(
      document.fullscreenElement ||
      (document as any).webkitFullscreenElement ||
      (document as any).mozFullScreenElement ||
      (document as any).msFullscreenElement
    );

    if (!isFullscreen && this.state.isFullscreen) {
      this.stop();
    }
  };

  /**
   * 通知状态变化
   */
  private notifyStateChange(): void {
    if (this.stateChangeCallback) {
      this.stateChangeCallback(this.getState());
    }
  }
}

/**
 * 全局演示器实例
 */
export const presenter = new Presenter();
