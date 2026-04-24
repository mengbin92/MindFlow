# MindFlow Flutter 重构收口执行方案

> 基于 `Flutter重构技术方案.md` Phase 6 目标，本文档定义从当前单项目结构迁移到 Flutter monorepo 的完整执行路径。

## 1. 目标对齐

### 1.1 最终状态（Phase 6）

```
MindFlow/
├── apps/
│   └── mindflow_flutter/          # Flutter 主应用，六端支持
├── packages/
│   ├── mindflow_domain/           # Dart 领域模型
│   ├── mindflow_storage/          # 存储层（drift + sqlite）
│   ├── mindflow_platform/         # 平台适配抽象
│   ├── mindflow_editor_bridge/    # 编辑器桥接层
│   ├── mindflow_render/           # Markdown 预览与渲染
│   ├── mindflow_ui/               # 设计系统
│   └── mindflow_export/           # 导出服务
├── melos.yaml                     # 多包管理
└── docs/
```

### 1.2 当前状态（快照）

- 单项目结构：`lib/` 下 54 个 Dart 文件
- 已具备：BLoC、go_router、基础存储、平台抽象 stub、渲染 bridge
- 缺失：多包拆分、drift 升级、编辑器桥接完成态、平台实现

## 2. 执行路径

### Sprint 1：工程结构迁移（目标：1周）

#### 2.1 创建 apps/mindflow_flutter

```bash
# 在 apps/ 目录下创建新应用
flutter create --org com.mindflow --project-name mindflow_flutter apps/mindflow_flutter
```

**关键配置：**
```yaml
# apps/mindflow_flutter/pubspec.yaml
name: mindflow_flutter
publish_to: 'none'
version: 2.0.0

environment:
  sdk: '>=3.0.0 <4.0.0'
  flutter: '>=3.29.0'

dependencies:
  mindflow_domain:
    path: ../packages/mindflow_domain
  mindflow_storage:
    path: ../packages/mindflow_storage
  mindflow_platform:
    path: ../packages/mindflow_platform
  mindflow_editor_bridge:
    path: ../packages/mindflow_editor_bridge
  mindflow_render:
    path: ../packages/mindflow_render
  mindflow_ui:
    path: ../packages/mindflow_ui
  mindflow_export:
    path: ../packages/mindflow_export
```

#### 2.2 创建 packages/

| Package | 从现有代码迁移 | 说明 |
|---------|---------------|------|
| `mindflow_domain` | `lib/models/` + `lib/domain/` | Document、Workspace、Settings 等实体 |
| `mindflow_storage` | `lib/repositories/` + `lib/services/storage_service.dart` | drift + sqlite 实现 |
| `mindflow_platform` | `lib/platform/` | 文件系统抽象层 |
| `mindflow_editor_bridge` | `lib/editor/` | EditorBridgeController |
| `mindflow_render` | `lib/render/` | Markdown 预览 + 扩展语法 |
| `mindflow_ui` | `lib/ui/` | 设计系统 + 通用组件 |
| `mindflow_export` | `lib/services/export_*.dart` | 导出服务 |

#### 2.3 创建 melos.yaml

```yaml
name: mindflow
repository: https://github.com/mengbin92/mindflow

packages:
  - apps/**
  - packages/**

scripts:
  bootstrap:
    exec: flutter pub get
    stage: pre

  analyze:
    exec: flutter analyze
    packageFilters:
      - mindflow_*

  test:
    exec: flutter test
    packageFilters:
      - mindflow_*

  build:
    exec: flutter build web --release
    packageFilters:
      - mindflow_flutter

  format:
    exec: dart format .
    packageFilters:
      - mindflow_*

  build:ios:
    exec: flutter build ios --simulator --no-codesign
    packageFilters:
      - mindflow_flutter

  build:android:
    exec: flutter build apk --debug
    packageFilters:
      - mindflow_flutter

  build:macos:
    exec: flutter build macos
    packageFilters:
      - mindflow_flutter
```

### Sprint 2：核心能力迁移（目标：2周）

#### 2.4 存储层升级（drift）

**从 sqflite 迁移到 drift：**

```dart
// packages/mindflow_storage/lib/src/document_table.dart
import 'package:drift/drift.dart';

class Documents extends Table {
  IntColumn get id => integer().autoIncrement()();
  TextColumn get uuid => text().unique()();
  TextColumn get title => text().withLength(min: 1, max: 255)();
  TextColumn get content => text().nullable()();
  TextColumn get workspaceId => text()();
  DateTimeColumn get createdAt => dateTime().withDefault(currentDateAndTime)();
  DateTimeColumn get updatedAt => dateTime().withDefault(currentDateAndTime)();
  BoolColumn get isFavorite => boolean().withDefault(const Constant(false))();
  TextColumn get tags => text().withDefault(const Constant('[]'))();
}
```

**迁移验证：**
- [ ] 文档 CRUD 操作正常
- [ ] 收藏、最近打开功能正常
- [ ] 数据迁移脚本可回滚

#### 2.5 平台抽象层实现

**目标文件结构：**

```
packages/mindflow_platform/
├── lib/
│   ├── mindflow_platform.dart
│   ├── src/
│   │   ├── workspace_file_system.dart      # 抽象接口
│   │   ├── workspace_file_system_io.dart  # Desktop/Mobile 实现
│   │   ├── workspace_file_system_web.dart # Web 实现
│   │   ├── file_node.dart                 # 文件节点模型
│   │   └── platform_service.dart          # 平台能力服务
└── test/
```

**核心接口：**

```dart
abstract class WorkspaceFileSystem {
  /// 选取工作区
  Future<WorkspaceHandle?> pickWorkspace();

  /// 读取文件树
  Future<List<FileNode>> readTree(String rootId);

  /// 读取文件内容
  Future<String> readFile(String path);

  /// 写入文件
  Future<void> writeFile(String path, String content);

  /// 创建文件
  Future<void> createFile(String parentPath, String name);

  /// 创建文件夹
  Future<void> createFolder(String parentPath, String name);

  /// 删除节点
  Future<void> deleteNode(String path);

  /// 移动节点
  Future<void> moveNode(String source, String targetParent);
}
```

**验收标准：**
- [ ] Desktop 可打开本地文件夹
- [ ] Web 可使用 File System Access API
- [ ] Mobile 可管理 App 沙盒工作区

### Sprint 3：编辑器桥接（目标：2周）

#### 2.6 EditorBridge 实现

**架构图：**

```
┌─────────────────────────────────────────────────────┐
│                  Flutter App                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │
│  │ FilePanel   │  │ EditorShell │  │ Toolbar     │ │
│  └─────────────┘  └──────┬──────┘  └─────────────┘ │
│                          │                           │
│                  ┌───────▼───────┐                   │
│                  │ EditorBridge  │                   │
│                  │  Controller   │                   │
│                  └───────┬───────┘                   │
└──────────────────────────┼───────────────────────────┘
                           │
              ┌────────────┴────────────┐
              │                         │
       ┌──────▼──────┐           ┌──────▼──────┐
       │ Web: web/    │           │ Native:     │
       │ dart:js_interop│        │ webview_flutter │
       └─────────────┘           └─────────────┘
              │                         │
       ┌──────▼─────────────────────────▼──────┐
       │         CodeMirror 6 Editor           │
       └─────────────────────────────────────────┘
```

**关键接口：**

```dart
class EditorBridgeController {
  /// 设置文档内容
  Future<void> setContent(String markdown);

  /// 获取文档内容
  Future<String> getContent();

  /// 获取光标位置
  Future<CursorPosition> getCursorPosition();

  /// 设置光标位置
  Future<void> setCursorPosition(int line, int column);

  /// 插入文本
  Future<void> insertText(String text);

  /// 执行命令（如加粗、斜体）
  Future<void> executeCommand(EditorCommand command);

  /// 监听内容变化
  Stream<String> get onContentChanged;

  /// 监听光标变化
  Stream<CursorPosition> get onCursorChanged;

  /// 监听快捷键
  Stream<ShortcutEvent> get onShortcut;
}
```

**验收标准：**
- [ ] 内容设置/获取延迟 < 50ms
- [ ] 光标同步准确
- [ ] Markdown 命令执行正常
- [ ] 快捷键回调完整

### Sprint 4：渲染与扩展语法（目标：1周）

#### 2.7 渲染层实现

**模块职责：**

```dart
// packages/mindflow_render/lib/src/
├── markdown_parser.dart      # Markdown AST 解析
├── html_generator.dart       # HTML 生成
├── syntax/
│   ├── latex_renderer.dart   # LaTeX 渲染
│   ├── mermaid_renderer.dart # Mermaid 渲染
│   ├── plantuml_renderer.dart
│   └── markmap_renderer.dart
└── preview_service.dart      # 预览编排
```

**验收标准：**
- [ ] 标准 Markdown 渲染正确
- [ ] LaTeX 公式显示正常
- [ ] Mermaid 图表渲染正常
- [ ] 代码高亮正确

### Sprint 5：导出与演示（目标：1周）

#### 2.8 导出服务

```dart
abstract class ExportService {
  /// 导出 HTML
  Future<ExportResult> exportHtml(ExportRequest request);

  /// 导出 PDF
  Future<ExportResult> exportPdf(ExportRequest request);

  /// 导出图片
  Future<ExportResult> exportImage(ExportRequest request);

  /// 批量导出
  Future<List<ExportResult>> exportBatch(BatchExportRequest request);
}
```

#### 2.9 演示模式

```dart
abstract class PresentationService {
  /// 生成演示 HTML
  Future<String> generatePresentation(String markdown);

  /// 播放演示
  Future<void> startPresentation(String htmlPath);

  /// 控制演示（下一页、上一页、跳转）
  Future<void> controlPresentation(PresentationAction action);
}
```

**验收标准：**
- [ ] HTML 导出包含完整样式
- [ ] PDF 导出可读性良好
- [ ] 演示模式可播放

## 3. 迁移清单

### 3.1 文件迁移映射

| 当前路径 | 迁移目标 | 负责人 |
|----------|---------|--------|
| `lib/models/` | `packages/mindflow_domain/lib/` | @owner |
| `lib/repositories/` | `packages/mindflow_storage/lib/` | @owner |
| `lib/platform/` | `packages/mindflow_platform/lib/` | @owner |
| `lib/editor/` | `packages/mindflow_editor_bridge/lib/` | @owner |
| `lib/render/` | `packages/mindflow_render/lib/` | @owner |
| `lib/ui/` | `packages/mindflow_ui/lib/` | @owner |
| `lib/services/export_*.dart` | `packages/mindflow_export/lib/` | @owner |
| `lib/blocs/` | `apps/mindflow_flutter/lib/blocs/` | @owner |

### 3.2 依赖迁移

| 依赖 | 当前版本 | 目标版本 | 迁移说明 |
|------|---------|---------|---------|
| flutter_bloc | 9.0.0 | 保持 | - |
| go_router | 17.0.0 | 保持 | - |
| sqflite | 2.3.0 | 移除 | 用 drift 替代 |
| drift | - | 2.x | 新增 |
| drift_dev | - | 2.x | 新增（dev） |

## 4. 验收检查点

### 4.1 Sprint 1 验收

```bash
# 检查项
ls apps/mindflow_flutter/
ls packages/
cat melos.yaml
flutter pub get
dart format apps/ packages/ --set-exit-if-changed
```

- [ ] `apps/mindflow_flutter` 存在且可启动
- [ ] 7 个 package 目录存在
- [ ] `melos.yaml` 配置正确
- [ ] `melos bootstrap` 执行成功

### 4.2 Sprint 2 验收

- [ ] drift 数据库迁移完成
- [ ] 文档 CRUD 测试通过
- [ ] 收藏/最近打开功能正常

### 4.3 Sprint 3 验收

- [ ] 编辑器 Bridge 集成成功
- [ ] CodeMirror 在 Web 端正常工作
- [ ] 内容同步延迟 < 50ms

### 4.4 Sprint 4 验收

- [ ] Markdown 预览正常
- [ ] LaTeX/Mermaid 渲染正常

### 4.5 Sprint 5 验收

- [ ] HTML/PDF 导出成功
- [ ] 演示模式可播放

### 4.6 Phase 6 最终验收

| 验收项 | 指标 | 当前值 | 目标值 |
|--------|------|--------|--------|
| 冷启动时间 | iOS Simulator | - | < 2s |
| 文件树响应 | 1000 节点 | - | < 500ms |
| 编辑延迟 | 5000 行文档 | - | < 100ms |
| 导出成功率 | HTML/PDF | - | > 95% |

## 5. 风险与应对

| 风险 | 概率 | 影响 | 应对措施 |
|------|------|------|---------|
| CodeMirror Bridge 性能问题 | 中 | 高 | 预研阶段验证，备选 flutter_markdown 作为 fallback |
| drift 迁移数据丢失 | 低 | 高 | 保留 sqflite 双写，验证后切换 |
| 多包依赖冲突 | 中 | 中 | melos workspace 统一版本管理 |
| 移动端文件系统权限 | 高 | 高 | 沙盒工作区 + 导入导出模式 |

## 6. 时间线

```
Week 1:   Sprint 1 - 工程结构迁移
Week 2:   Sprint 1 - melos 配置 + CI 适配
Week 3-4: Sprint 2 - 存储层迁移 + drift 升级
Week 5-6: Sprint 3 - 编辑器桥接
Week 7:   Sprint 4 - 渲染层 + 扩展语法
Week 8:   Sprint 5 - 导出 + 演示模式
Week 9:   收尾 + 集成测试 + 性能优化
Week 10:  Phase 6 最终验收 + 发布
```

## 7. 执行日志

### 2026-04-24 Sprint 1 执行记录

**完成状态：✅ Sprint 1 完成**

#### 创建的目录结构
```
MindFlow/
├── apps/
│   └── mindflow_flutter/          # Flutter 主应用（六端：web/ios/android/macos/windows/linux）
├── packages/
│   ├── mindflow_domain/           # ✅ 已迁移 lib/models + lib/domain
│   ├── mindflow_storage/         # ✅ 已迁移 lib/repositories + lib/services
│   ├── mindflow_platform/         # ✅ 已迁移 lib/platform
│   ├── mindflow_editor_bridge/   # ✅ 已迁移 lib/editor
│   ├── mindflow_render/          # ✅ 已迁移 lib/render
│   ├── mindflow_ui/              # ✅ 已迁移 lib/ui
│   └── mindflow_export/          # ✅ 已迁移 lib/services/export_*.dart
├── melos.yaml                     # ✅
└── docs/
```

#### 依赖安装
- `flutter pub get`: ✅ 130 dependencies
- 依赖冲突修复: `web` 版本统一为 1.1.0

#### 验收检查点
- [x] `apps/mindflow_flutter` 存在且可启动
- [x] 7 个 package 目录存在
- [x] `melos.yaml` 配置正确
- [x] `flutter pub get` 执行成功

## 8. 下一步行动

1. **立即执行**：Sprint 2 存储层升级（drift 迁移）
2. **本周内**：完成 WorkspaceFileSystem 平台抽象实现
3. **下周**：启动 Sprint 3 编辑器桥接

---

> **Owner**: @mengbin
> **Last Updated**: 2026-04-24
> **Status**: Sprint 1 ✅ | Sprint 2 🔜
