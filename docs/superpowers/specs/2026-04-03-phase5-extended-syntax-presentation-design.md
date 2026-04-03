# Phase 5 扩展语法与演示模式设计

## 概述

完成 Phase 5 剩余功能：PlantUML 支持、Markmap 支持、reveal.js 演示模式。
全部采用 HTML 占位符 + CDN 渲染方案，与现有 LaTeX/Mermaid 桥接架构保持一致。

## 1. 架构

```
┌─────────────────────────────────────────────────────────────┐
│                        UI Layer                              │
│  EditorScreen → PreviewBridgeView / PresentationScreen       │
├─────────────────────────────────────────────────────────────┤
│                     Service Layer                            │
│  CompositeSyntaxBridgeService  │  PresentationService        │
│  (LaTeX/Mermaid/PlantUML/      │  (reveal.js HTML 生成)      │
│   Markmap)                     │                              │
├─────────────────────────────────────────────────────────────┤
│                     Render Layer                             │
│  PreviewRenderService → HTML with CDN scripts                │
└─────────────────────────────────────────────────────────────┘
```

## 2. CompositeSyntaxBridgeService

重命名 `LatexSyntaxBridgeService` 为 `CompositeSyntaxBridgeService`，统一处理所有扩展语法。

### 处理的语法

| 语法 | Markdown 模式 | 占位符 HTML |
|------|-------------|------------|
| LaTeX 行内 | `$...$` | `<span class="mf-latex-inline" data-latex="...">...</span>` |
| LaTeX 块级 | `$$...$$` | `<div class="mf-latex-block" data-latex="...">...</div>` |
| Mermaid | ` ```mermaid ` | `<pre class="mf-mermaid" data-mermaid-theme="...">...</pre>` |
| PlantUML | ` ```plantuml ` 或 ` ```puml ` | `<pre class="mf-plantuml" data-plantuml-code="...">...</pre>` |
| Markmap | ` ```markmap ` | `<pre class="mf-markmap" data-markmap-code="...">...</pre>` |

### 接口

```dart
abstract class SyntaxBridgeService {
  Future<SyntaxBridgeResult> render(String markdown, {bool isDarkMode});
}

class CompositeSyntaxBridgeService implements SyntaxBridgeService {
  const CompositeSyntaxBridgeService();

  @override
  Future<SyntaxBridgeResult> render(String markdown, {bool isDarkMode = false});
}
```

### 实现要点

- 保留现有 LaTeX 和 Mermaid 的正则匹配逻辑不变
- 新增 PlantUML 正则：`/```(?:plantuml|puml)\s*\n([\s\S]+?)```/`
- 新增 Markmap 正则：`/```markmap\s*\n([\s\S]+?)```/`
- PlantUML 占位符：`<pre class="mf-plantuml" data-plantuml-code="$escapedCode">$escapedCode</pre>`
- Markmap 占位符：`<pre class="mf-markmap" data-markmap-code="$escapedCode">$escapedCode</pre>`

## 3. PreviewRenderService 修改

`buildHtmlDocument` 需要在 `<head>` 中检测并嵌入对应的 CDN 脚本。

### CDN 脚本映射

| 扩展语法 | 检测条件 | 嵌入的 CDN |
|----------|---------|-----------|
| LaTeX | `mf-latex-block` 或 `mf-latex-inline` | KaTeX CSS + auto-render JS |
| Mermaid | `mf-mermaid` | mermaid.js |
| PlantUML | `mf-plantuml` | plantuml-encoder JS + 渲染脚本 |
| Markmap | `mf-markmap` | d3 + markmap-lib + markmap-view |

### PlantUML 渲染脚本

```javascript
document.querySelectorAll('.mf-plantuml').forEach((element, index) => {
  const code = element.getAttribute('data-plantuml-code') ?? '';
  try {
    const encoded = plantumlEncoder.encode(code);
    element.outerHTML = `<img src="https://www.plantuml.com/plantuml/svg/${encoded}" alt="PlantUML Diagram" style="max-width:100%">`;
  } catch (error) {
    element.outerHTML = `<div class="mf-plantuml-error">${String(error)}</div>`;
  }
});
```

### Markmap 渲染脚本

```javascript
document.querySelectorAll('.mf-markmap').forEach((element, index) => {
  const code = element.getAttribute('data-markmap-code') ?? '';
  try {
    const { Transformer } = window.markmap;
    const transformer = new Transformer();
    const { root } = transformer.transform(code);
    const id = `mf-markmap-svg-${index}`;
    element.outerHTML = `<div id="${id}" style="width:100%;min-height:300px"><svg style="width:100%;height:100%"></svg></div>`;
    Markmap.create(`#${id} svg`, null, root);
  } catch (error) {
    element.outerHTML = `<div class="mf-markmap-error">${String(error)}</div>`;
  }
});
```

## 4. PresentationService

### 职责

将 Markdown 转换为 reveal.js 演示 HTML。

### 接口

```dart
class PresentationService {
  const PresentationService();

  String buildPresentationHtml({
    required String markdown,
    String theme = 'black',
    String transition = 'slide',
    bool showControls = true,
    bool showProgress = true,
    bool showSlideNumber = true,
  });
}
```

### 实现要点

- 幻灯片分隔符：`---`
- 演讲者备注：`Note:` 语法
- reveal.js CDN: `https://cdn.jsdelivr.net/npm/reveal.js@4.5.0/dist/reveal.js`
- 支持主题：black, white, league, beige, sky, night, serif, simple, solarized
- 支持过渡效果：none, fade, slide, convex, concave, zoom
- 通过 `postMessage` 通知 Flutter 端当前幻灯片状态

### 生成的 HTML 结构

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>MindFlow Presentation</title>
  <link rel="stylesheet" href="reveal.css">
  <link rel="stylesheet" href="theme/{theme}.css">
  <style>/* 自适应样式 */</style>
</head>
<body>
  <div class="reveal">
    <div class="slides">
      <section>{slide1}</section>
      <section>{slide2}</section>
    </div>
  </div>
  <script src="reveal.js"></script>
  <script>/* 初始化 + postMessage */</script>
</body>
</html>
```

## 5. PresentationScreen

### UI 层

全屏 WebView 播放 reveal.js 演示。

### 接口

```dart
class PresentationScreen extends StatefulWidget {
  final String documentId;
  final PresentationOptions options;
}

class _PresentationScreenState extends State<PresentationScreen> {
  late WebViewController _webViewController;
  int _currentSlide = 0;
  int _totalSlides = 0;

  void nextSlide();
  void previousSlide();
  void toggleFullscreen();
}
```

### 功能

- 全屏 WebView 播放 reveal.js 演示
- 底部控制栏：上一页/下一页/页码显示/关闭按钮
- 支持键盘快捷键（左右箭头）
- 支持触摸滑动
- 监听 WebView postMessage 更新当前页码

### 入口

从 EditorScreen 的工具栏添加"演示模式"按钮进入。

## 6. 文件变更清单

| 文件 | 变更 |
|------|------|
| `render/syntax_bridge_service.dart` | 重命名类，添加 PlantUML/Markmap 正则 |
| `render/preview_render_service.dart` | 扩展 `buildHtmlDocument` 的 CDN 脚本 |
| `render/presentation_service.dart` | 新建，reveal.js HTML 生成 |
| `ui/screens/presentation_screen.dart` | 新建，全屏演示 WebView |
| `ui/screens/editor_screen.dart` | 添加"演示模式"入口按钮 |
| `test/render/syntax_bridge_service_test.dart` | 更新测试，添加 PlantUML/Markmap 测试用例 |
| `test/render/preview_render_service_test.dart` | 添加 CDN 脚本检测测试 |
| `test/render/presentation_service_test.dart` | 新建，演示 HTML 生成测试 |

## 7. 验收标准

- PlantUML 代码块在预览和导出 HTML 中正确渲染为图片
- Markmap 代码块在预览和导出 HTML 中正确渲染为交互式思维导图
- 点击演示模式按钮可进入全屏演示
- 演示模式支持翻页、键盘和触摸操作
- 现有 LaTeX/Mermaid 功能不受影响
- 所有测试通过
