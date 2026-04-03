# 贡献指南

感谢你对 MindFlow 项目的关注！我们欢迎所有形式的贡献。

## 目录

- [如何贡献](#如何贡献)
- [开发环境设置](#开发环境设置)
- [代码规范](#代码规范)
- [提交信息规范](#提交信息规范)
- [分支策略](#分支策略)
- [Pull Request 流程](#pull-request-流程)

---

## 如何贡献

### 报告 Bug

在报告 Bug 之前，请先搜索 [Issues](https://github.com/mengbin92/MindFlow/issues) 确认该问题是否已被报告。

创建新 Issue 时，请包含：

- **问题描述** - 清晰简洁的问题描述
- **复现步骤** - 详细的复现步骤
- **期望行为** - 你期望发生的行为
- **实际行为** - 实际发生的行为
- **环境信息** - 操作系统、Flutter 版本等
- **截图** - 如果有的话

### 提交功能建议

欢迎提交功能建议，请包含：

- **功能描述** - 清晰的功能描述
- **使用场景** - 这个功能会在什么场景下使用
- **预期行为** - 期望功能如何工作

---

## 开发环境设置

### 环境要求

- **Flutter SDK** >= 3.29.0
- **Dart SDK** >= 3.0.0
- **Android Studio** / **Xcode** (用于移动端/桌面端开发)
- **Git**

### 克隆仓库

```bash
git clone https://github.com/mengbin92/MindFlow.git
cd MindFlow
```

### 安装依赖

```bash
flutter pub get
```

### 运行应用

```bash
# macOS
flutter run -d macos

# Web
flutter run -d chrome

# Android (需要连接设备或模拟器)
flutter run -d android

# iOS (需要 Mac + Xcode)
flutter run -d ios
```

### 运行测试

```bash
# 单元测试
flutter test

# 测试覆盖率
flutter test --coverage

# 集成测试 (需要连接设备)
flutter test integration_test/
```

### 代码检查

```bash
# 静态分析
flutter analyze

# 格式化代码
dart format .
```

---

## 代码规范

### Dart 规范

- 遵循 [Effective Dart](https://dart.dev/guides/language/effective-dart) 规范
- 使用 `dart format` 格式化代码
- 避免使用 `dynamic` 类型
- 为公共 API 添加文档注释

```dart
/// 创建新文档
///
/// [title] 文档标题
/// [content] 文档内容
/// 返回创建的文档实例
Future<Document> createDocument({
  required String title,
  required String content,
}) async {
  // ...
}
```

### 文件命名

- 使用 snake_case: `file_list_item.dart`
- 类名使用 PascalCase: `FileListItem`
- 组件文件与类名对应

### 目录结构

```
lib/
├── app/           # 应用配置、路由
├── blocs/         # BLoC 状态管理
├── domain/        # 领域模型
├── models/        # 数据模型
├── services/      # 服务层
├── repositories/  # 数据仓储
├── ui/            # UI 层
│   ├── screens/   # 页面
│   ├── widgets/   # 组件
│   └── themes/    # 主题
└── utils/         # 工具函数
```

---

## 提交信息规范

本项目遵循 [约定式提交](https://www.conventionalcommits.org/zh-hans/v1.0.0/) 规范。

### 格式

```
<type>(<scope>): <subject>
```

### 类型

| 类型 | 说明 |
|------|------|
| `feat` | 新功能 |
| `fix` | Bug 修复 |
| `docs` | 文档更新 |
| `style` | 代码格式调整 |
| `refactor` | 代码重构 |
| `perf` | 性能优化 |
| `test` | 添加测试 |
| `chore` | 构建/工具变动 |
| `ci` | CI 配置变动 |

### 范围

- `editor` - 编辑器
- `file` - 文件管理
- `ui` - UI 组件
- `export` - 导出功能
- `theme` - 主题
- `ci` - CI/CD

### 示例

```bash
feat(editor): add syntax highlighting for code blocks
fix(file): resolve file save issue on Windows
docs: update installation guide
refactor(ui): simplify navigation structure
```

---

## 分支策略

```
main
  │
  ├── develop
  │     │
  │     ├── feature/new-feature
  │     ├── bugfix/issue-123
  │     └── ...
  │
  └── hotfix/critical-fix
```

- **`main`**: 生产分支，始终保持稳定
- **`develop`**: 开发分支
- **`feature/*`**: 功能分支
- **`bugfix/*`**: Bug 修复分支
- **`hotfix/*`**: 紧急修复分支

---

## Pull Request 流程

### 提交前检查

- [ ] 代码通过 `flutter analyze`
- [ ] 代码已格式化 `dart format .`
- [ ] 所有测试通过 `flutter test`
- [ ] 提交信息符合规范
- [ ] 文档已更新（如需要）

### PR 步骤

1. Fork 仓库
2. 从 `develop` 创建分支
3. 提交更改
4. 推送到 Fork
5. 创建 PR 到 `develop`
6. 等待代码审查

---

## 获取帮助

- **GitHub Issues**: Bug 报告和功能建议
- **GitHub Discussions**: 一般性讨论

感谢你的贡献！
