# Phase 4: 扩展语法支持 - 完成报告

## 概述

Phase 4 专注于实现 Markdown 编辑器的扩展语法支持，包括 LaTeX 数学公式、Mermaid 图表、Markmap 思维导图和 PlantUML 架构图等高级功能。通过创建统一的扩展语法处理器，实现了对多种扩展语法的解析和渲染，大大提升了编辑器的专业性和实用性。

## 已完成功能

### ✅ 1. 扩展语法处理器
- **文件**: `packages/core/src/extended-syntax.ts`
- **功能**: 统一的扩展语法解析和渲染引擎
- **特性**:
  - 支持四种扩展语法类型
  - 同步和异步渲染混合模式
  - 自动错误处理和友好提示
  - HTML 转义和安全处理
  - 延迟渲染支持（Mermaid、Markmap）
- **导出接口**:
  ```typescript
  export class ExtendedSyntaxProcessor {
    processLatex(latex: string, displayMode: boolean): string
    processMermaid(code: string, id: string): string
    async renderMermaid(element: HTMLElement): Promise<void>
    processMarkmap(markdown: string, id: string): string
    async renderMarkmap(element: SVGSVGElement, content: string): Promise<void>
    processPlantUML(code: string): string
    processExtendedSyntax(markdown: string): string
    async renderExtendedSyntax(container: HTMLElement): Promise<void>
  }
  ```

### ✅ 2. LaTeX 公式渲染（KaTeX）
- **文件**: `packages/core/src/extended-syntax.ts`
- **功能**: 完整的 LaTeX 数学公式支持
- **特性**:
  - 行内公式: `$E = mc^2$`
  - 块级公式: `$$\int_{-\infty}^{\infty} e^{-x^2} dx = \sqrt{\pi}$$`
  - 使用 KaTeX 0.16.11 版本
  - 同步渲染，性能优异
  - 支持所有 LaTeX 数学符号
  - 自动错误处理
- **示例**:
  ```markdown
  行内公式：$x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}$

  块级公式：
  $$
  f(x) = \int_{-\infty}^{\infty} \hat f(\xi)\,e^{2\pi i \xi x} \,d\xi
  $$
  ```

### ✅ 3. Mermaid 图表渲染
- **文件**: `packages/core/src/extended-syntax.ts`
- **功能**: 专业图表绘制支持
- **特性**:
  - 语法: ```mermaid ... ```
  - 使用 Mermaid 11.4.1 版本
  - 异步渲染，不阻塞主线程
  - 支持所有 Mermaid 图表类型：
    - 流程图 (Flowchart)
    - 序列图 (Sequence Diagram)
    - 类图 (Class Diagram)
    - 状态图 (State Diagram)
    - 甘特图 (Gantt Chart)
    - ER 图 (Entity Relationship)
    - 用户旅程图 (User Journey)
    - 等等...
  - 自动主题适配（浅色/深色）
  - 错误提示友好
- **示例**:
  ```markdown
  \`\`\`mermaid
  graph TD
      A[开始] --> B{判断}
      B -->|是| C[执行A]
      B -->|否| D[执行B]
      C --> E[结束]
      D --> E
  \`\`\`
  ```

### ✅ 4. Markmap 思维导图渲染
- **文件**: `packages/core/src/extended-syntax.ts`
- **功能**: 思维导图可视化支持
- **特性**:
  - 语法: ```markmap ... ```
  - 使用 CDN 方式渲染（避免打包依赖冲突）
  - 通过 iframe 隔离，样式互不干扰
  - 自动布局和交互
  - 支持折叠/展开节点
- **CDN 资源**:
  - d3@7
  - markmap-view@0.15.4
  - markmap-lib@0.15.4
- **示例**:
  ```markdown
  \`\`\`markmap
  # 项目规划
  - 前端开发
    - React
    - TypeScript
    - TailwindCSS
  - 后端开发
    - Node.js
    - PostgreSQL
    - Redis
  - 部署
    - Docker
    - Kubernetes
  \`\`\`
  ```

### ✅ 5. PlantUML 架构图渲染
- **文件**: `packages/core/src/extended-syntax.ts`
- **功能**: UML 和架构图绘制支持
- **特性**:
  - 语法: ```plantuml ... ``` 或 ```puml ... ```
  - 使用 PlantUML 在线服务渲染
  - 自动编码 PlantUML 代码
  - 支持 PlantUML 所有图表类型：
    - 用例图
    - 类图
    - 时序图
    - 活动图
    - 组件图
    - 部署图
    - 状态图
    - 等等...
  - 返回 SVG 格式，可缩放
- **示例**:
  ```markdown
  \`\`\`plantuml
  @startuml
  actor User
  participant "Web App" as App
  database "Database" as DB

  User -> App: 登录请求
  App -> DB: 验证用户
  DB --> App: 返回用户信息
  App --> User: 登录成功
  @enduml
  \`\`\`
  ```

### ✅ 6. 解析器集成
- **文件**: `packages/core/src/parser.ts`
- **功能**: 将扩展语法处理器集成到 Markdown 解析器
- **特性**:
  - 在 Markdown 解析前处理扩展语法
  - 提供 `renderExtendedSyntax` 方法用于延迟渲染
  - 保持向后兼容
  - 同步和异步解析支持
- **API 更新**:
  ```typescript
  export class MarkdownParser {
    parse(markdown: string): string
    parseAsync(markdown: string): Promise<string>
    async renderExtendedSyntax(container: HTMLElement): Promise<void>
  }
  ```

### ✅ 7. 编辑器组件更新
- **文件**: `packages/web/src/components/Editor.tsx`
- **功能**: 调用扩展语法渲染
- **特性**:
  - 在 `updatePreview` 中调用 `parser.renderExtendedSyntax()`
  - 异步处理 Mermaid 和 Markmap
  - 错误捕获和控制台输出
  - 不影响现有自动保存功能

### ✅ 8. 样式系统扩展
- **文件**: `packages/web/src/styles.css`
- **功能**: 完整的扩展语法样式支持
- **特性**:
  - LaTeX 公式样式（行内/块级）
  - Mermaid 图表样式
  - Markmap iframe 容器样式
  - PlantUML 图片样式
  - 错误提示样式
  - 懒加载占位符样式
  - 完整的浅色/深色主题支持
  - 响应式设计
- **样式类**:
  ```css
  .preview-content .katex
  .preview-content .katex-display
  .preview-content .latex-block
  .preview-content .latex-error
  .preview-content .mermaid
  .preview-content .mermaid-error
  .preview-content .markmap-container
  .preview-content .markmap-iframe
  .preview-content .markmap-error
  .preview-content .plantuml-diagram
  .preview-content .plantuml-error
  .preview-content .lazy-loading
  ```

### ✅ 9. KaTeX 样式导入
- **文件**: `packages/web/src/main.tsx`
- **功能**: 导入 KaTeX 样式
- **代码**:
  ```typescript
  import 'katex/dist/katex.css';
  ```

### ✅ 10. 类型定义导出
- **文件**: `packages/core/src/index.ts`
- **功能**: 导出扩展语法相关类型
- **导出**:
  ```typescript
  export {
    ExtendedSyntaxProcessor,
    extendedSyntaxProcessor,
    ExtendedSyntaxType,
  } from './extended-syntax';
  ```

## 项目结构

```
packages/
├── core/
│   ├── src/
│   │   ├── extended-syntax.ts      # 扩展语法处理器 ⭐ 新增
│   │   ├── parser.ts               # Markdown 解析器（已更新）
│   │   ├── editor.ts               # 编辑器（已更新）
│   │   ├── shortcuts.ts            # 快捷键系统（已更新）
│   │   ├── auto-save.ts            # 自动保存（已更新）
│   │   └── index.ts                # 入口文件（已更新）
│   └── package.json                # 依赖（已更新）
│
└── web/
    ├── src/
    │   ├── components/
    │   │   └── Editor.tsx           # 编辑器组件（已更新）
    │   ├── store/
    │   │   └── webFileSystemAdapter.ts  # 文件系统适配器（已更新）
    │   ├── main.tsx                 # 入口文件（已更新）
    │   └── styles.css               # 样式文件（已更新）
    └── package.json                # 依赖（已更新）
```

## 技术栈

### 核心库
- **LaTeX 渲染**: KaTeX 0.16.11
- **图表渲染**: Mermaid 11.4.1
- **思维导图**: Markmap (CDN)
  - d3@7
  - markmap-view@0.15.4
  - markmap-lib@0.15.4
- **架构图**: PlantUML (在线服务)
- **Markdown 解析**: marked 11.1.1

### 开发工具
- **语言**: TypeScript 5.3.3
- **构建工具**: Vite 5.4.21
- **包管理**: npm workspaces + Turbo
- **Monorepo**: Turbo

## 核心 API

### 扩展语法处理器

```typescript
import { extendedSyntaxProcessor } from '@mindflow/core';

// 处理 LaTeX 公式
const latex = extendedSyntaxProcessor.processLatex('E = mc^2', false);

// 处理 Mermaid 图表
const mermaidHtml = extendedSyntaxProcessor.processMermaid(
  'graph TD\nA-->B',
  'mermaid-1'
);

// 渲染 Mermaid 图表
await extendedSyntaxProcessor.renderMermaid(element);

// 处理 Markmap 思维导图
const markmapHtml = extendedSyntaxProcessor.processMarkmap(
  '# 标题\n- 列表',
  'markmap-1'
);

// 处理 PlantUML 图表
const plantumlHtml = extendedSyntaxProcessor.processPlantUML(`
  @startuml
  Alice -> Bob: Hello
  @enduml
`);

// 处理所有扩展语法
const html = extendedSyntaxProcessor.processExtendedSyntax(markdown);

// 渲染延迟处理的扩展语法
await extendedSyntaxProcessor.renderExtendedSyntax(container);
```

### 解析器集成

```typescript
import { parser } from '@mindflow/core';

// 解析 Markdown（自动处理扩展语法）
const html = parser.parse(markdown);

// 异步解析
const html = await parser.parseAsync(markdown);

// 渲染延迟处理的扩展语法（Mermaid、Markmap）
await parser.renderExtendedSyntax(previewContainer);
```

### 编辑器组件使用

```tsx
import { Editor } from '@mindflow/web';

function App() {
  return (
    <Editor
      docId="my-document"
      theme="light"
      autoSave={true}
      autoSaveDelay={2000}
      onChange={(content) => {
        console.log('内容变化:', content);
      }}
    />
  );
}
```

## 使用示例

### LaTeX 公式

```markdown
# 数学公式

行内公式：质能方程 $E = mc^2$

块级公式：
$$
\int_{-\infty}^{\infty} e^{-x^2} dx = \sqrt{\pi}
$$

复杂公式：
$$
x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}
$$
```

### Mermaid 图表

```markdown
# 流程图

\`\`\`mermaid
graph TD
    A[开始] --> B{判断}
    B -->|是| C[执行A]
    B -->|否| D[执行B]
    C --> E[结束]
    D --> E
\`\`\`

# 时序图

\`\`\`mermaid
sequenceDiagram
    participant Alice
    participant Bob
    Alice->>Bob: Hello Bob, how are you?
    Bob-->>Alice: I am good thanks!
\`\`\`
```

### Markmap 思维导图

```markdown
# 思维导图

\`\`\`markmap
# MindFlow 编辑器
## 功能特点
- 实时预览
- 语法高亮
- 自动保存
- 快捷键支持
## 技术栈
- React 18
- TypeScript
- CodeMirror 6
- Vite
## 扩展语法
- LaTeX 公式
- Mermaid 图表
- Markmap 思维导图
- PlantUML 架构图
\`\`\`
```

### PlantUML 架构图

```markdown
# 架构图

\`\`\`plantuml
@startuml
package "前端层" {
  [React 组件]
  [编辑器]
  [预览面板]
}

package "核心层" {
  [解析器]
  [扩展语法处理器]
  [状态管理]
}

package "API 层" {
  [Tauri API]
  [File System API]
}

[React 组件] --> [解析器]
[编辑器] --> [扩展语法处理器]
[解析器] --> [状态管理]
[状态管理] --> [Tauri API]
@enduml
\`\`\`
```

## UI 设计亮点

### 1. 主题一致性
- 所有扩展语法元素都支持浅色/深色主题
- 使用 CSS Variables 实现主题切换
- 错误提示也有主题适配

### 2. 错误处理
- 友好的错误提示信息
- 红色背景高亮显示
- 显示具体的错误原因
- 不影响其他内容渲染

### 3. 懒加载优化
- Mermaid 异步渲染
- Markmap iframe 隔离
- PlantUML CDN 加载
- 加载占位符动画

### 4. 响应式设计
- 所有元素自适应容器宽度
- 移动端友好的布局
- 图片自动缩放
- iframe 响应式

## 性能优化

### 1. 异步渲染
- Mermaid 图表异步渲染，不阻塞主线程
- Markmap 使用 iframe 隔离，独立渲染上下文
- PlantUML 通过 CDN 加载，减少本地打包

### 2. 按需加载
- Mermaid 图表类型按需加载
- KaTeX 字体文件自动分割
- Markmap CDN 资源缓存

### 3. 打包优化
- 移除了 markmap 相关的 npm 依赖
- 使用 CDN 加载 markmap 和 d3
- KaTeX 字体文件单独打包

**编译结果**:
```
✓ 3752 modules transformed
dist/assets/index.js         1,554.77 kB │ gzip: 487.18 kB
dist/assets/KaTeX_*.woff      53.58 kB (字体文件)
dist/assets/KaTeX_*.ttf       63.63 kB (字体文件)
```

## 已知限制

### 1. PlantUML 网络依赖
- 需要访问 `plantuml.com` 在线服务
- 离线环境无法使用
- 依赖第三方服务可用性

### 2. Markmap iframe 限制
- 无法直接操作导图内容
- 与主文档通信受限
- 打印时可能需要特殊处理

### 3. npm 审计警告
- 2 个中等严重性漏洞
- 建议运行 `npm audit fix` 或手动更新依赖

### 4. 打包体积警告
- 部分 chunk 超过 500KB
- 建议使用动态导入进一步优化

## 下一步计划 (Phase 5)

1. **导出功能**
   - PDF 导出（puppeteer）
   - HTML 导出
   - 图片导出（PNG、SVG）

2. **演示模式**
   - reveal.js 集成
   - 幻灯片模式
   - 演示控制（键盘/点击）
   - 全屏支持

3. **导出扩展语法支持**
   - 导出 LaTeX 公式为 MathML
   - 导出 Mermaid 为 SVG/PNG
   - 导出 Markmap 为图片
   - 导出 PlantUML 为图片

## 总结

Phase 4 成功实现了 Markdown 编辑器的扩展语法支持，包括：

✅ **LaTeX 数学公式** - KaTeX 0.16.11，完整数学符号支持，同步渲染
✅ **Mermaid 图表** - 11.4.1，支持所有图表类型，异步渲染
✅ **Markmap 思维导图** - CDN 方式，避免打包冲突，iframe 隔离
✅ **PlantUML 架构图** - 在线服务渲染，支持所有图表类型
✅ **扩展语法处理器** - 统一的 API 接口，易于扩展
✅ **解析器集成** - 无缝集成到现有解析器
✅ **样式系统** - 完整的主题支持，错误提示
✅ **类型安全** - 完整的 TypeScript 类型定义

**技术亮点**:
- 模块化设计，扩展语法处理器独立封装
- 性能优化，异步渲染 + CDN 加载
- 错误处理，友好的错误提示
- 主题支持，完整的浅色/深色主题
- 懒加载，Mermaid 和 Markmap 延迟渲染

**文件统计**:
- 新增文件: 1 个核心模块
- 修改文件: 11 个
- 代码行数: ~300+ 行
- 新增依赖: 2 个（KaTeX、Mermaid）

所有功能都已通过 TypeScript 类型检查，编译测试通过，功能测试通过。编辑器现在支持完整的扩展语法，可以满足学术写作、技术文档、架构设计等多种使用场景。
