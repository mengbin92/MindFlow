# MindFlow Mobile

MindFlow 移动端应用 - 基于 Flutter 的跨平台 Markdown 编辑器。

## 功能特性

- **Markdown 编辑**：支持完整的 Markdown 语法编辑
- **实时预览**：编辑与预览模式切换
- **文件管理**：本地文件存储、文件夹管理、搜索
- **收藏功能**：快速访问常用文档
- **主题切换**：支持浅色/深色/跟随系统
- **自动保存**：可配置的自动保存间隔
- **国际化**：支持中文和英文

## 技术栈

- **Flutter 3.x**：跨平台 UI 框架
- **BLoC Pattern**：状态管理
- **SQLite**：本地数据库存储
- **flutter_markdown**：Markdown 渲染
- **flex_color_scheme**：主题方案

## 项目结构

```
lib/
├── blocs/              # BLoC 状态管理
│   ├── file/          # 文件管理 BLoC
│   └── settings/      # 设置 BLoC
├── models/            # 数据模型
│   ├── document.dart  # 文档模型
│   └── app_settings.dart # 应用设置
├── repositories/      # 数据仓库
│   └── file_repository.dart
├── services/          # 服务层
│   └── storage_service.dart
├── ui/                # UI 层
│   ├── screens/       # 页面
│   ├── widgets/       # 组件
│   └── themes/        # 主题配置
└── utils/             # 工具函数
```

## 开始使用

### 前提条件

- Flutter SDK 3.0+
- Dart SDK 3.0+
- Android Studio / Xcode (用于模拟器)

### 安装依赖

```bash
cd packages/mobile
flutter pub get
```

### 运行应用

```bash
# 开发模式
flutter run

# iOS
flutter run -d ios

# Android
flutter run -d android
```

### 构建发布版本

```bash
# Android APK
flutter build apk --release

# Android App Bundle
flutter build appbundle --release

# iOS
flutter build ios --release
```

## 开发指南

### 添加新功能

1. **添加模型**：在 `models/` 目录下创建数据模型
2. **添加 BLoC**：在 `blocs/` 目录下创建事件、状态和 BLoC 类
3. **添加 UI**：在 `ui/screens/` 或 `ui/widgets/` 创建界面
4. **注册路由**：在 `main.dart` 中添加路由（如有需要）

### 代码规范

- 使用 `dart format .` 格式化代码
- 使用 `flutter analyze` 检查代码问题
- 遵循 [Effective Dart](https://dart.dev/guides/language/effective-dart) 规范

## 许可证

MIT License
