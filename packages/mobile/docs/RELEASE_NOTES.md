# MindFlow Mobile v1.0.0 发布说明

## 版本信息

- **版本号**: 1.0.0
- **构建号**: 1
- **发布日期**: 2026-01-30

## 功能特性

### 编辑器
- Markdown 语法支持
- 编辑/预览双模式
- 快捷格式化工具栏
- 自动保存（可配置）
- 实时预览渲染

### 文件管理
- 本地 SQLite 存储
- 文件夹管理
- 文档增删改查
- 搜索功能
- 收藏功能
- 最近文件列表

### 设置
- 主题切换（浅色/深色/跟随系统）
- 字体大小调整
- 自动保存开关
- 语言切换（中/英）

## 技术规格

### 支持平台
- iOS 13.0+
- Android 5.0+ (API 21+)
- Web (Chrome, Safari, Firefox)

### 技术栈
- Flutter 3.38.8
- Dart 3.10.7
- SQLite (sqflite)
- BLoC 状态管理

## 打包配置

### iOS
- Bundle ID: `com.mindflow.app`
- 最低版本: iOS 13.0
- 支持设备: iPhone, iPad
- 签名: 已配置
- 文件关联: Markdown (.md, .markdown)

### Android
- Package: `com.mindflow.app`
- 最低 SDK: 21
- 目标 SDK: Flutter 默认
- 签名: 已配置 (mindflow.keystore)
- ProGuard: 已启用

## 构建命令

```bash
# iOS
flutter build ios --release
flutter build ipa --release

# Android
flutter build apk --release
flutter build appbundle --release

# Web
flutter build web --release
```

## 文件说明

```
ios/
├── Runner/
│   ├── Info.plist          # 应用配置
│   ├── Assets.xcassets/    # 图标资源
│   └── Base.lproj/         # 启动图
└── Runner.xcodeproj/       # Xcode 项目

android/
├── app/
│   ├── build.gradle        # 构建配置
│   ├── proguard-rules.pro  # 混淆规则
│   └── src/main/           # 源代码
└── build.gradle            # 项目配置

docs/
├── DEPLOYMENT.md           # 发布指南
└── RELEASE_NOTES.md        # 发布说明
```

## 待办事项

- [ ] 上传 iOS 到 App Store
- [ ] 上传 Android 到 Google Play
- [ ] 配置应用内购买（如需要）
- [ ] 配置推送通知（如需要）
- [ ] 添加分析统计

## 已知问题

无

## 更新日志

### v1.0.0 (2026-01-30)
- 初始版本发布
- 完整的 Markdown 编辑功能
- 文件管理系统
- 主题切换
- 国际化支持

---

**MindFlow Team**
