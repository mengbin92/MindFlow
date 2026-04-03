# MindFlow - 极简 Markdown 编辑器

<p align="center">
  <img src="assets/icon.svg" alt="MindFlow Logo" width="120">
</p>

<p align="center">
  一款极简风格的开源 Markdown 编辑器，基于 Flutter 构建跨平台体验
</p>

<p align="center">
  <a href="https://github.com/yourusername/mindflow/releases">
    <img src="https://img.shields.io/github/v/release/yourusername/mindflow?style=flat-square" alt="Release">
  </a>
  <a href="LICENSE">
    <img src="https://img.shields.io/github/license/yourusername/mindflow?style=flat-square" alt="License">
  </a>
</p>

<p align="center">
  <a href="#安装">下载安装</a> •
  <a href="docs/Flutter重构技术方案.md">技术方案</a> •
  <a href="CHANGELOG.md">更新日志</a>
</p>

---

## 功能特性

### 核心功能

- **极简设计** - 类似 Typora 的简洁界面，三栏自适应布局
- **纯本地使用** - 无需联网，数据完全本地存储，保障隐私
- **跨平台** - 基于 Flutter，支持 Android、iOS、Web、macOS
- **实时预览** - 编辑与预览模式切换，所见即所得

### 扩展语法

- **LaTeX 公式** - 支持行内 `$...$` 和块级 `$$...$$` 公式
- **Mermaid 图表** - 流程图、时序图、类图、甘特图等
- **PlantUML** - 专业 UML 图表支持（通过在线服务渲染）
- **Markmap 思维导图** - Markdown 转交互式思维导图

### 导出与演示

- **多格式导出** - HTML、PDF、Markdown、PNG、JPEG
- **多页图片 ZIP** - 多页文档导出为分页图片压缩包
- **演示模式** - 基于 reveal.js 的全屏 PPT 模式

### 主题与配置

- **深色/浅色主题** - 一键切换，自动适配系统主题
- **工作区模式** - 支持本地文件夹工作区和 App 内资料库
- **国际化** - 中文/英文支持

## 安装

### 移动端

| 平台 | 下载链接 | 系统要求 |
|------|----------|----------|
| Android | [mindflow.apk](https://github.com/yourusername/mindflow/releases/latest) | Android 5.0+ |
| iOS | App Store（敬请期待） | iOS 14+ |

### 桌面端

| 平台 | 下载链接 | 系统要求 |
|------|----------|----------|
| macOS | [mindflow-macos.dmg](https://github.com/yourusername/mindflow/releases/latest) | macOS 12+ |

### Web

在线体验：[md.mengbin.top](https://md.mengbin.top)

## 技术栈

| 层级 | 技术 |
|------|------|
| UI 框架 | Flutter 3.29+ |
| 状态管理 | flutter_bloc (BLoC/Cubit) |
| 路由 | go_router |
| 本地存储 | sqflite / shared_preferences |
| Markdown | markdown + flutter_markdown |
| 主题 | flex_color_scheme + dynamic_color |
| 导出 | pdf + printing |
| 演示 | reveal.js (WebView) |
| CI/CD | GitHub Actions |

## 项目结构

```
MindFlow/
├── packages/
│   └── mobile/                  # Flutter 主应用（Android/iOS/Web/macOS）
│       ├── lib/
│       │   ├── app/             # 应用外壳、路由、BlocObserver
│       │   ├── blocs/           # BLoC 状态管理
│       │   ├── domain/          # 领域模型与仓储接口
│       │   ├── editor/          # 编辑器桥接层
│       │   ├── models/          # 数据模型
│       │   ├── platform/        # 平台适配（文件系统）
│       │   ├── render/          # 预览渲染与扩展语法桥接
│       │   ├── repositories/    # 仓储实现
│       │   ├── services/        # 服务层（存储、导出）
│       │   └── ui/              # UI 层（页面、组件、主题）
│       ├── test/                # 单元测试与 Widget 测试
│       └── integration_test/    # 集成测试
├── docs/                        # 文档
│   └── Flutter重构技术方案.md    # 重构方案
└── .github/workflows/           # CI/CD
    ├── flutter-ci.yml           # Flutter CI（analyze/test/build）
    ├── ci.yml                   # 旧包 CI（维护模式）
    └── release.yml              # 发布工作流
```

## 开发

### 前提条件

- Flutter SDK 3.29+
- Dart SDK 3.0+
- Android Studio / Xcode

### 快速开始

```bash
cd packages/mobile
flutter pub get
flutter run
```

### 运行测试

```bash
cd packages/mobile
flutter test              # 单元测试
flutter analyze           # 静态分析
flutter test integration_test/  # 集成测试
```

### 构建

```bash
flutter build apk --release       # Android
flutter build ios --release       # iOS
flutter build web --release       # Web
flutter build macos --release     # macOS
```

## 许可证

MIT License
