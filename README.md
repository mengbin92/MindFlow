# MindFlow

基于 Flutter 的跨平台 Markdown 编辑器，支持 Android、iOS、Web、macOS。

## 功能特性

### 编辑与预览

- Markdown 实时编辑与预览切换
- 编辑器工具栏（加粗、斜体、标题、列表、链接、表格等）
- 编辑器桥接层（EditorBridge），为后续 CodeMirror 集成预留

### 扩展语法

- **LaTeX** - 行内 `$...$` 和块级 `$$...$$` 公式
- **Mermaid** - 流程图、时序图、类图等
- **PlantUML** - UML 图表（```plantuml / ```puml）
- **Markmap** - 交互式思维导图（```markmap）

### 导出

- HTML / PDF / PNG / JPEG 单页导出
- 多页图片 ZIP 导出
- Markdown 原文导出

### 演示模式

- 基于 reveal.js 的全屏演示
- 幻灯片分隔符 `---`
- 演讲者备注（`Note:` 语法）
- 多主题支持（black, white, league 等）
- 底部翻页控制栏

### 平台能力

- 自适应三栏布局（宽屏）和导航栏布局（窄屏）
- 本地 SQLite 文档库
- 本地文件夹工作区（directory workspace）
- 收藏与最近打开
- 深色/浅色/跟随系统主题
- 文件搜索

## 技术栈

| 类别 | 技术 |
|------|------|
| UI 框架 | Flutter 3.29+ |
| 状态管理 | flutter_bloc |
| 路由 | go_router |
| 存储 | sqflite, shared_preferences |
| Markdown 解析 | markdown (dart) |
| Markdown 渲染 | flutter_markdown |
| 导出 | pdf, printing |
| 演示 | reveal.js (WebView) |
| 桌面 WebView | webview_flutter |
| 主题 | flex_color_scheme, dynamic_color |

## 项目结构

```
MindFlow/
├── lib/                        # Dart 源代码
│   ├── app/                    # 应用外壳、路由、BlocObserver
│   ├── application/            # 应用服务（WorkspaceService）
│   ├── blocs/                  # BLoC 状态管理
│   ├── domain/                 # 领域模型与仓储接口
│   ├── editor/                 # 编辑器桥接层
│   ├── models/                 # 数据模型
│   ├── platform/               # 平台适配（文件系统）
│   ├── render/                 # 预览渲染与扩展语法桥接
│   ├── repositories/           # 仓储实现
│   ├── services/               # 服务层（存储、导出）
│   └── ui/                     # UI 层（页面、组件、主题）
├── test/                       # 单元测试与 Widget 测试
├── integration_test/           # 集成测试
├── android/                    # Android 平台代码
├── ios/                        # iOS 平台代码
├── macos/                      # macOS 平台代码
├── web/                        # Web 平台代码
├── docs/                       # 文档
└── .github/workflows/          # CI/CD
```

## 开始使用

### 前提条件

- Flutter SDK 3.29+
- Dart SDK 3.0+
- Android Studio / Xcode

### 安装依赖

```bash
flutter pub get
```

### 运行

```bash
flutter run                    # 默认设备
flutter run -d macos           # macOS
flutter run -d chrome          # Web
flutter run -d android         # Android
```

### 测试

```bash
flutter test                   # 单元测试
flutter analyze                # 静态分析
flutter test integration_test/ # 集成测试（需要连接设备）
```

### 构建

```bash
flutter build apk --release       # Android APK
flutter build appbundle --release # Android App Bundle
flutter build ios --release       # iOS
flutter build web --release       # Web
flutter build macos --release     # macOS
```

## 许可证

MIT License
