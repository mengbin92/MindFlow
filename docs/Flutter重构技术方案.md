# MindFlow Flutter 重构技术方案

## 1. 文档目的

本文档基于当前仓库中的需求、项目概览、阶段报告、测试报告和现有源码状态，给出一份面向落地的 Flutter 重构方案。目标不是简单“新增一个 Flutter 端”，而是将 MindFlow 收敛为一套以 Flutter 为主的跨平台应用架构，统一 Web、Desktop、Mobile 的 UI、业务流程和工程体系。

本文档同时修正文档与源码不一致的问题，因此结论以仓库真实代码为准，而不是以历史阶段报告为准。

## 2. 现状分析

### 2.1 现有仓库结构

当前仓库是一个以 Node.js workspace + Turbo 为核心的 monorepo：

- `packages/web`：React + Vite 的 Web 端
- `packages/desktop`：React + Tauri 的桌面端
- `packages/mobile`：Flutter 移动端雏形
- `packages/core`：TypeScript 核心能力，包含解析、导出、扩展语法、演示模式、性能工具等
- `shared/*`：TypeScript 共享类型、常量、工具

### 2.2 从源码观察到的真实状态

#### 已具备的能力

- Web/Desktop 已有较完整的三栏布局、文件树、文件列表、编辑器入口和主题能力
- `packages/core` 已实现 Markdown 解析、扩展语法处理、导出、演示模式等核心逻辑
- `packages/mobile` 已有基础 Flutter 结构，包含：
  - `flutter_bloc`
  - SQLite 文档存储
  - 编辑/预览页面
  - 收藏、设置、主题切换
  - 国际化基础

#### 明显问题

- 文档存在明显漂移：
  - [docs/项目概览.md](/Users/mengbin/vscode/neo/MindFlow/docs/项目概览.md) 仍写“移动端 Flutter 计划中”，但仓库已存在 Flutter 端
  - [docs/Phase12-完成报告.md](/Users/mengbin/vscode/neo/MindFlow/docs/Phase12-完成报告.md) 声称所有平台 v1.0.0 已完成，但源码与根版本号、工程能力并不完全对应
- 技术栈割裂：
  - Web/Desktop 依赖 TypeScript + React + Tauri
  - Mobile 依赖 Flutter + Dart
  - 核心业务逻辑主要沉淀在 TypeScript，Flutter 无法直接复用
- Flutter 端能力不足以替代现有 Web/Desktop：
  - 当前编辑器仍是 `TextField` 级别实现
  - 尚未承接 CodeMirror 级编辑体验
  - 扩展语法、导出、演示模式与桌面/Web 不对齐
- 工程体系不统一：
  - 根目录只有 Node/Turbo 工作流，没有 Flutter 多包工作流
  - 测试、构建、发布链路按平台分裂

### 2.3 结论

MindFlow 目前不是“多端统一架构”，而是“Web/Desktop 较完整 + Flutter Mobile 早期实现 + TypeScript Core 偏重”的混合状态。  
如果继续沿用现状，后续功能会以三套实现并行演化，成本会持续上升。

因此，推荐的重构方向是：

- **前端统一到 Flutter**
- **保留必要的平台原生能力适配层**
- **对现有 TypeScript 核心能力采用“过渡复用 + 分阶段 Dart 化”策略**

## 3. 重构目标

### 3.1 产品目标

Flutter 重构后的 MindFlow 需要保留并统一以下能力：

- 纯本地优先，默认不依赖云
- 三栏布局：文件树 + 文件列表 + 编辑器/预览
- Markdown 实时编辑与预览
- 扩展语法：LaTeX、Mermaid、PlantUML、Markmap
- 导出：HTML、PDF、图片
- 演示模式
- 主题、国际化、配置管理
- Desktop / Web / Mobile 一套交互模型，多端按设备特征做差异化适配

### 3.2 技术目标

- 使用 Flutter 统一 UI 层和状态管理
- 用 Dart 重建领域模型、配置、存储、检索、路由和应用外壳
- 将平台差异封装在独立适配层
- 保留对现有 TypeScript/Rust 能力的兼容路径，避免一次性推倒重来
- 形成可持续的 Flutter monorepo 工程体系

### 3.3 迁移目标

- 第一阶段不删除旧 Web/Desktop，采用并行迁移
- 新 Flutter 端先覆盖核心写作链路，再逐步替换高级特性
- 以“业务闭环完成度”而不是“代码迁移比例”作为验收标准

## 4. 方案总览

### 4.1 总体结论

推荐采用：

- **Flutter 统一应用层**
- **Dart 统一业务层**
- **平台适配层抽象文件系统、导出、窗口、分享、外部打开能力**
- **编辑与扩展渲染采用混合策略**

这里的“混合策略”是关键：

- **应用外壳、导航、文件管理、设置、搜索、状态管理、主题** 用 Flutter 原生实现
- **高级 Markdown 编辑与部分扩展渲染** 在第一阶段允许复用现有 Web 技术能力
- **核心业务模型和存储能力** 必须优先转到 Dart

原因很直接：Flutter 非常适合统一多端外壳和业务交互，但要在短期内纯 Dart 重建 CodeMirror 级编辑器、Mermaid/Markmap/PlantUML/reveal.js 全量能力，风险和工期都过高。

### 4.2 不推荐的路线

#### 不推荐路线 A：一次性纯 Dart 全量重写

问题：

- 编辑器体验会明显退化
- 扩展语法与导出能力短期无法达到现有 Web/Desktop 水平
- 需要同时重写 UI、编辑器、渲染、导出、平台接口，风险最高

#### 不推荐路线 B：继续维持 React/Tauri + Flutter Mobile 并行

问题：

- 核心能力无法统一
- 新功能要维护两到三份实现
- 文档、测试、发布成本持续上升

## 5. 目标架构

### 5.1 分层架构

```text
┌───────────────────────────────────────────────┐
│ Flutter App Layer                            │
│ Web / macOS / Windows / Linux / iOS / Android│
├───────────────────────────────────────────────┤
│ Presentation Layer                           │
│ pages / widgets / blocs / routes / theme     │
├───────────────────────────────────────────────┤
│ Domain Layer                                 │
│ document / workspace / search / settings     │
│ export / presentation / syntax capability    │
├───────────────────────────────────────────────┤
│ Data Layer                                   │
│ repositories / local db / cache / adapters   │
├───────────────────────────────────────────────┤
│ Platform Layer                               │
│ file access / window / share / print / fs    │
│ web fs api / desktop native / mobile sandbox │
├───────────────────────────────────────────────┤
│ Transitional Engine Layer                    │
│ JS bridge / HTML renderer / optional Rust    │
└───────────────────────────────────────────────┘
```

### 5.2 推荐目录结构

建议在当前仓库中逐步引入 Flutter 多包结构，而不是继续让 Flutter 只存在于 `packages/mobile`。

```text
MindFlow/
├── apps/
│   └── mindflow_flutter/          # Flutter 主应用，启用六端
├── packages/
│   ├── mindflow_domain/           # Dart 领域模型与用例
│   ├── mindflow_storage/          # SQLite/本地配置/缓存
│   ├── mindflow_platform/         # 平台适配抽象
│   ├── mindflow_editor_bridge/    # 编辑器桥接层
│   ├── mindflow_render/           # Markdown 预览与扩展渲染编排
│   ├── mindflow_ui/               # 设计系统与通用组件
│   ├── web/                       # 旧 Web，迁移期保留
│   ├── desktop/                   # 旧 Desktop，迁移期保留
│   └── core/                      # 旧 TS Core，迁移期保留
├── docs/
└── melos.yaml
```

如果短期不想改动目录层级，也可以先把 `packages/mobile` 扩展为全平台 Flutter App，再逐步拆包。但从中期维护看，拆分为 `apps + packages` 更合理。

## 6. 技术选型

### 6.1 Flutter 版本与平台

- Flutter 3.29+ 或团队当前稳定版
- 启用平台：
  - `android`
  - `ios`
  - `web`
  - `macos`
  - `windows`
  - `linux`

### 6.2 状态管理

推荐继续沿用并升级现有 Flutter 端的 `flutter_bloc` 体系，而不是在重构时再切换到另一套状态框架。

原因：

- 当前 `packages/mobile` 已有 BLoC 实现，迁移成本最低
- BLoC 适合显式建模复杂交互状态，如文件树、编辑器、导出、预览、设置
- 可以在领域层和仓储层重构的同时保持 UI 状态层相对稳定

推荐落地方式：

- 页面级使用 `Bloc/Cubit`
- 业务逻辑下沉到 `use case + repository`
- 避免把 IO 和业务规则直接写进 BLoC

### 6.3 路由

- `go_router`

用途：

- 桌面/Web 的深链接和页面切换
- 编辑器页面、设置页面、演示模式页面
- Web URL 状态同步

### 6.4 本地存储

- 文档索引、收藏、最近打开：`drift + sqlite`
- 配置项：`shared_preferences` 或本地 JSON 配置
- 大文件缓存与导出中间产物：应用缓存目录

推荐从当前直接使用 `sqflite` 升级到 `drift`，原因：

- 可维护性更高
- schema migration 更清晰
- 更适合后续做全文索引、最近打开、回收站、标签等能力

### 6.5 文件系统能力

按平台抽象为统一接口：

```dart
abstract class WorkspaceFileSystem {
  Future<WorkspaceHandle?> pickWorkspace();
  Future<List<FileNode>> readTree(String rootId);
  Future<String> readFile(String path);
  Future<void> writeFile(String path, String content);
  Future<void> createFile(String parentPath, String name);
  Future<void> createFolder(String parentPath, String name);
  Future<void> deleteNode(String path);
  Future<void> moveNode(String source, String targetParent);
}
```

平台实现建议：

- Desktop：直接访问本地文件系统
- Web：优先 File System Access API，降级到 IndexedDB 虚拟工作区
- Mobile：以 App 沙盒工作区为主，外部目录采用导入/导出模式

### 6.6 编辑器策略

这是重构成败的核心。

#### 推荐方案：两阶段编辑器策略

**阶段 1：Flutter 外壳 + 现有编辑器能力桥接**

- 保留 CodeMirror 6 作为高级编辑引擎
- 通过桥接层嵌入到 Flutter：
  - Web：`dart:js_interop` 或 `package:web`
  - Desktop/Mobile：`InAppWebView`/平台 WebView 容器
- Flutter 负责：
  - 页面结构
  - 工具栏
  - 文件切换
  - 快捷键调度
  - 状态同步
- Bridge 负责：
  - 设置内容
  - 获取内容
  - 光标位置
  - 选区格式化
  - 预览刷新

**阶段 2：逐步 Dart 化编辑体验**

- 可选择将一部分轻量编辑场景替换为 Flutter 原生编辑器
- 但在没有充分验证前，不建议抛弃 Bridge 方案

#### 不建议

- 直接用 `TextField` 承接桌面/Web 主编辑器
- 仅依赖 `flutter_markdown` 作为编辑器能力替代

### 6.7 Markdown 预览与扩展语法

推荐使用“预览编排层 + 分能力渲染”的模式。

#### 第一阶段

- Markdown AST/HTML 生成允许复用现有 TypeScript Core 能力
- Flutter 端通过 bridge 获取渲染后的 HTML
- 预览展示使用：
  - Web：直接 DOM 容器
  - Desktop/Mobile：WebView 容器

#### 第二阶段

逐步把稳定能力迁移到 Dart：

- 标准 Markdown：Dart 解析
- 基础代码高亮：Dart 实现
- LaTeX：可保留 HTML 渲染或引入专门渲染组件
- Mermaid / Markmap / PlantUML：继续走 Web 技术桥接，收益最高

### 6.8 导出与演示模式

导出与演示模式不建议在第一阶段纯 Dart 重写。

推荐路线：

- HTML 导出：优先完成
- PDF/图片导出：基于 HTML 预览结果生成
- 演示模式：保留 reveal.js 资产，通过 Flutter 调起独立页面或 WebView

平台抽象：

- `ExportService`
- `PresentationService`

Desktop/Web 优先支持完整能力，Mobile 先支持分享 HTML/PDF 和预览型演示。

## 7. 模块拆分设计

### 7.1 Flutter 应用层模块

- `app_shell`
  - 启动、路由、主题、窗口布局、快捷键分发
- `workspace`
  - 工作区选择、文件树、文件列表、搜索
- `editor`
  - 编辑器、预览、分屏、工具栏、自动保存
- `settings`
  - 主题、字体、语言、自动保存、导出设置
- `favorites`
  - 收藏、最近文件
- `presentation`
  - 演示模式入口、播放控制
- `export`
  - HTML/PDF/图片导出

### 7.2 领域层模块

- `document`
- `folder`
- `workspace`
- `editor_session`
- `search`
- `settings`
- `export_job`
- `presentation_deck`

### 7.3 数据层模块

- `document_repository`
- `workspace_repository`
- `settings_repository`
- `recent_repository`
- `favorite_repository`
- `render_repository`

### 7.4 平台层模块

- `filesystem_adapter`
- `share_adapter`
- `window_adapter`
- `print_adapter`
- `external_open_adapter`
- `clipboard_adapter`

## 8. 现有能力映射

| 现有实现 | 当前位置 | Flutter 重构去向 |
|----------|----------|------------------|
| 文件树/文件列表 | `packages/web`, `packages/desktop` | `workspace` 模块 |
| Markdown 解析 | `packages/core/src/parser.ts` | 阶段 1 Bridge，阶段 2 迁移到 `mindflow_render` |
| 扩展语法 | `packages/core/src/extended-syntax.ts` | Bridge 主导，保留 Web 技术栈 |
| 导出能力 | `packages/core/src/exporter.ts` | `export` 模块 + 平台适配 |
| 演示模式 | `packages/core/src/presentation.ts` | `presentation` 模块 |
| 自动保存 | `packages/core/src/auto-save.ts` | `editor_session` + repository |
| 主题系统 | `packages/core/src/themes.ts` + Flutter 现有主题 | 收敛到 Flutter Design System |
| 移动端设置/收藏 | `packages/mobile/lib/...` | 直接迁移并重构为正式模块 |

## 9. 重构路径

### Phase 0：基线冻结与文档校准

目标：

- 冻结旧 Web/Desktop 功能范围
- 修正文档与源码不一致的问题
- 输出能力清单和验收清单

交付物：

- Flutter 重构方案文档
- 旧架构功能清单
- 迁移里程碑

### Phase 1：建立 Flutter 主应用骨架

目标：

- 将 Flutter 应用扩展为全平台
- 建立 Flutter 工作区和 CI 基线
- 完成应用壳、主题、路由、布局系统

实施要点：

- 新建 `apps/mindflow_flutter`
- 启用六端平台支持
- 引入 `melos`
- 建立基础三栏布局
- 接入 `BlocObserver`、日志、错误边界

验收标准：

- 六端可启动
- 主题切换正常
- 三栏布局能按屏幕尺寸降级

### Phase 2：迁移领域模型与本地存储

目标：

- 将文档、文件夹、收藏、最近打开、设置迁移到 Dart

实施要点：

- 建立 `Document`, `Workspace`, `AppSettings` 等实体
- 用 `drift` 替换当前直接操作 SQLite 的仓储实现
- 为 Web/Desktop/Mobile 统一 Repository 接口

验收标准：

- 文档 CRUD、收藏、搜索、设置在 Flutter 端可用
- 数据结构可做版本迁移

### Phase 3：接入文件系统与工作区

目标：

- 打通桌面真实文件夹和移动端沙盒工作区

实施要点：

- Desktop：文件夹选取、文件树扫描、读写
- Web：File System Access API + IndexedDB fallback
- Mobile：导入/导出工作区

验收标准：

- 桌面可直接编辑本地 Markdown 文件夹
- Mobile 可管理 App 内工作区并导入文档

### Phase 4：接入编辑器 Bridge

目标：

- 先恢复高级编辑体验，再考虑纯 Dart 深化

实施要点：

- 封装 `EditorBridgeController`
- 支持：
  - 设置文档
  - 获取文档
  - 光标同步
  - Markdown 插入命令
  - 快捷键回调
  - 失焦自动保存

验收标准：

- Flutter 端编辑体验不低于当前移动端
- Desktop/Web 主编辑链路达到现有 React 版本的核心水平

### Phase 5：预览、扩展语法、导出、演示

目标：

- 恢复产品差异化能力

实施要点：

- Bridge 输出 HTML 预览
- 支持 Mermaid/LaTeX/PlantUML/Markmap
- HTML/PDF/图片导出
- reveal.js 演示模式接入

验收标准：

- README 和用户文档中的核心扩展语法可正常显示
- HTML/PDF 导出成功
- 演示模式可播放

### Phase 6：替换旧端并收口工程

目标：

- 以 Flutter 主工程替代旧 Web/Desktop 主入口

实施要点：

- Web/Desktop 旧包切换到维护模式
- CI/CD 以 Flutter 构建为主
- 补齐测试、发布、埋点和崩溃采集

验收标准：

- 新 Flutter 工程成为默认交付入口
- 旧实现仅保留兼容期分支

## 10. UI 与交互适配原则

### 10.1 Desktop/Web

- 保留三栏布局
- 支持快捷键优先
- 文件树和文件列表始终可见，支持拖拽调整宽度
- 编辑器与预览支持分屏

### 10.2 Mobile

- 不强行复刻三栏固定布局
- 推荐结构：
  - 主列表页
  - 文件树抽屉或侧滑页
  - 全屏编辑页
  - 底部格式化工具栏
- 扩展语法预览和演示模式采用全屏沉浸式

### 10.3 统一设计系统

建立 `mindflow_ui`：

- 色板
- 字体
- 间距
- 图标
- 输入框
- 列表
- 菜单
- 弹窗

避免出现 Web、Desktop、Mobile 三端各自定义视觉规范。

## 11. 测试与质量保障

### 11.1 测试策略

- 单元测试：领域模型、仓储、导出编排、设置
- Widget 测试：文件列表、设置页、编辑页壳层
- 集成测试：工作区打开、文档编辑、保存、导出
- Golden 测试：主题、布局和关键页面

### 11.2 性能指标

关键验收指标建议：

- 冷启动时间
- 打开 1,000 个文件节点的文件树响应时间
- 50,000 行 Markdown 文档输入延迟
- 预览切换耗时
- 导出成功率

### 11.3 当前限制

本仓库当前环境未安装 Flutter 命令行，因此本轮无法直接执行：

- `flutter pub get`
- `flutter analyze`
- `flutter test`
- 多端构建验证

后续实施前需先补齐 Flutter 开发环境。

## 12. 工程与发布方案

### 12.1 工程管理

推荐新增：

- `melos.yaml`
- Flutter 多包 lint 规则
- 平台构建矩阵

Node/Turbo 保留用于旧包和迁移期工具链，直到 Flutter 端完全接管。

### 12.2 CI/CD

建议拆为三层：

- `lint-and-test`
  - Dart format
  - analyze
  - unit/widget tests
- `build-preview`
  - Web preview
  - macOS/Windows/Linux debug build
- `release`
  - Desktop 安装包
  - Android APK/AAB
  - iOS Archive
  - Web 静态部署

## 13. 风险与应对

| 风险 | 影响 | 应对 |
|------|------|------|
| Flutter 纯原生编辑器能力不足 | 高 | 第一阶段采用 CodeMirror Bridge |
| WebView/JS Bridge 复杂度上升 | 中 | 只桥接编辑和预览核心能力，协议固定化 |
| 移动端文件系统权限差异大 | 高 | 采用沙盒工作区 + 导入导出模式 |
| 旧 TS Core 难以一次迁移 | 中 | 先桥接后 Dart 化，不追求一步到位 |
| 工程迁移期间双栈维护成本高 | 中 | 明确里程碑，旧端只修阻塞问题 |

## 14. 最终建议

### 14.1 架构决策

MindFlow 适合做 Flutter 重构，但不适合做一次性纯 Dart 全量替换。  
最稳妥的路线是：

- **Flutter 统一应用壳与业务层**
- **TypeScript Core 在过渡期继续承担编辑/预览/扩展语法关键能力**
- **Dart 逐步接管领域模型、存储、文件系统编排和应用框架**

### 14.2 实施优先级

优先做：

1. Flutter 全平台主应用骨架
2. 领域模型和本地存储迁移
3. 文件系统抽象
4. 编辑器 Bridge
5. 扩展语法和导出恢复

延后做：

1. 纯 Dart 富文本/所见即所得编辑器
2. 全量替换现有 Web 技术栈
3. 插件系统重写

### 14.3 里程碑定义

只有当 Flutter 版本满足以下条件，才应进入“替换旧端”阶段：

- 桌面端可打开本地文件夹并稳定编辑 Markdown
- Web 端可完成基础写作链路
- Mobile 端可完成编辑、预览、收藏、导出分享
- 扩展语法和导出能力达到当前对外文档承诺的最小闭环

---

如果后续进入实施阶段，下一份配套文档建议是《Flutter 重构任务拆解与排期》，按模块把 Phase 1 到 Phase 6 细化为可执行任务单。
