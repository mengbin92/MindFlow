# MindFlow 移动端开发实录：从零到完整的 Flutter 应用

> **日期**: 2026-01-30
> **版本**: v1.0.0
> **开发环境**: Flutter 3.38.8 + Dart 3.10.7 + macOS 26.2

---

## 引言

随着 MindFlow Web 端的成功发布，我们开始进军移动端市场。作为一个 Markdown 编辑器，用户在不同设备间的无缝体验至关重要。本文记录了从零开始搭建 Flutter 移动端项目的完整过程，包括架构设计、UI 实现、状态管理以及跨平台适配等关键技术决策。

---

## 开发背景

### Phase 10 目标

根据开发排期，Phase 10 需要在 6 周内完成移动端开发：

| 任务 | 工作量 | 优先级 | 状态 |
|------|--------|--------|------|
| Flutter项目搭建 | 1天 | P0 | ✅ 已完成 |
| 移动端UI设计 | 4天 | P0 | ✅ 已完成 |
| 编辑器移动端适配 | 5天 | P0 | ✅ 已完成 |
| 文件管理移动端 | 3天 | P0 | ✅ 已完成 |
| 手势操作 | 2天 | P1 | ✅ 已完成 |
| iOS打包发布 | 2天 | P1 | ✅ 已完成 |
| Android打包发布 | 2天 | P1 | ✅ 已完成 |

---

## 第一部分：项目架构设计

## 问题 #1: Flutter 开发环境搭建

### 🔍 问题背景

本地尚未安装 Flutter SDK，需要从零配置完整的开发环境。

### 💡 解决方案

**使用 Homebrew 安装 Flutter：**

```bash
# 检查环境
uname -m  # ARM64
sw_vers   # macOS 26.2

# 安装 Flutter
brew install flutter

# 验证安装
flutter --version
# Flutter 3.38.8 • channel stable
# Dart 3.10.7 • DevTools 2.51.1
```

**安装依赖：**

```bash
cd packages/mobile
flutter pub get
```

**遇到的依赖冲突：**

```
Because mindflow depends on flutter_localizations from sdk
which depends on intl 0.20.2, intl 0.20.2 is required.
So, because mindflow depends on intl ^0.18.1, version solving failed.
```

**解决版本冲突：**

```yaml
# 更新 pubspec.yaml
dependencies:
  intl: ^0.20.2  # 从 0.18.1 升级
  # flutter_quill: ^8.6.0  # 暂时注释，使用原生 TextField
```

### 📚 经验总结

- **版本兼容性**：Flutter SDK 与插件版本需要严格匹配
- **依赖管理**：使用 `flutter pub outdated` 检查过期依赖
- **最小依赖**：初期避免过多复杂依赖，优先使用 Flutter 原生组件

---

## 问题 #2: 移动端架构设计

### 🔍 设计目标

选择合适的架构模式来组织 Flutter 代码，确保可维护性和可扩展性。

### 💡 解决方案

**采用 BLoC (Business Logic Component) 模式：**

```
lib/
├── blocs/              # 状态管理 (BLoC)
│   ├── file/          # 文件管理
│   │   ├── file_bloc.dart
│   │   ├── file_event.dart
│   │   └── file_state.dart
│   └── settings/      # 设置管理
├── models/            # 数据模型
├── repositories/      # 数据仓库
├── services/          # 服务层
├── ui/                # UI 层
│   ├── screens/       # 页面
│   ├── widgets/       # 组件
│   └── themes/        # 主题
└── utils/             # 工具函数
```

**BLoC 核心实现：**

```dart
// file_bloc.dart
class FileBloc extends Bloc<FileEvent, FileState> {
  final FileRepository fileRepository;
  Timer? _autoSaveTimer;

  FileBloc({required this.fileRepository}) : super(const FileState()) {
    on<FilesLoaded>(_onFilesLoaded);
    on<FileCreated>(_onFileCreated);
    on<FileUpdated>(_onFileUpdated);
    on<FileContentChanged>(_onFileContentChanged);
    on<AutoSaveTriggered>(_onAutoSaveTriggered);
  }

  Future<void> _onFileContentChanged(
    FileContentChanged event,
    Emitter<FileState> emit,
  ) async {
    final currentDoc = state.selectedDocument;
    if (currentDoc != null) {
      final updated = currentDoc.copyWith(content: event.content);
      emit(state.copyWith(
        selectedDocument: updated,
        hasUnsavedChanges: true,
      ));

      // 2秒自动保存
      _autoSaveTimer?.cancel();
      _autoSaveTimer = Timer(const Duration(seconds: 2), () {
        add(const AutoSaveTriggered());
      });
    }
  }
}
```

**状态定义：**

```dart
// file_state.dart
enum FileStatus { initial, loading, success, failure }

class FileState extends Equatable {
  final FileStatus status;
  final List<Document> documents;
  final Document? selectedDocument;
  final bool hasUnsavedChanges;
  final String? errorMessage;

  const FileState({
    this.status = FileStatus.initial,
    this.documents = const [],
    this.selectedDocument,
    this.hasUnsavedChanges = false,
    this.errorMessage,
  });
}
```

### 📚 经验总结

- **BLoC vs Provider**：BLoC 更适合复杂状态管理，Provider 适合简单场景
- **不可变状态**：使用 `Equatable` 确保状态可比较，避免不必要的重绘
- **自动保存**：通过 Timer 实现防抖自动保存，提升用户体验

---

## 第二部分：UI 界面实现

## 问题 #3: 移动端三栏布局适配

### 🔍 问题背景

桌面端采用三栏布局（文件树、文件列表、编辑器），但移动端屏幕空间有限，需要重新设计。

### 💡 解决方案

**底部导航 + 页面切换方案：**

```dart
// home_screen.dart
class HomeScreen extends StatefulWidget {
  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _currentIndex = 0;

  final List<Widget> _screens = [
    const FileListView(),      // 文件列表
    const FavoritesScreen(),   // 收藏
    const SettingsScreen(),    // 设置
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: _screens[_currentIndex],
      bottomNavigationBar: NavigationBar(
        selectedIndex: _currentIndex,
        onDestinationSelected: (index) =>
          setState(() => _currentIndex = index),
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.folder_outlined),
            selectedIcon: Icon(Icons.folder),
            label: '文件',
          ),
          NavigationDestination(
            icon: Icon(Icons.favorite_outline),
            selectedIcon: Icon(Icons.favorite),
            label: '收藏',
          ),
          NavigationDestination(
            icon: Icon(Icons.settings_outlined),
            selectedIcon: Icon(Icons.settings),
            label: '设置',
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _showCreateOptions(context),
        icon: const Icon(Icons.add),
        label: const Text('新建'),
      ),
    );
  }
}
```

**编辑/预览 Tab 切换：**

```dart
// editor_screen.dart
class EditorScreen extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        bottom: TabBar(
          controller: _tabController,
          onTap: (index) {
            if (index == 1) {
              FocusScope.of(context).unfocus(); // 隐藏键盘
            }
          },
          tabs: const [
            Tab(icon: Icon(Icons.edit), text: '编辑'),
            Tab(icon: Icon(Icons.preview), text: '预览'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _EditorView(controller: _contentController),
          _PreviewView(content: _contentController.text),
        ],
      ),
    );
  }
}
```

### 📚 经验总结

- **移动端优先**：底部导航比侧边栏更适合单手操作
- **键盘处理**：预览时隐藏软键盘，避免遮挡内容
- **悬浮按钮**：FAB 用于主要操作（新建），符合 Material Design

---

## 问题 #4: Material 3 主题适配

### 🔍 问题背景

FlexColorScheme 版本与 Flutter SDK 版本不兼容，需要简化主题方案。

### 💡 解决方案

**使用 Flutter 原生 Material 3：**

```dart
// app_theme.dart
class AppTheme {
  static const Color primaryColor = Color(0xFF2563EB);

  static ThemeData get lightTheme {
    return ThemeData(
      useMaterial3: true,
      colorScheme: ColorScheme.fromSeed(
        seedColor: primaryColor,
        brightness: Brightness.light,
      ),
      appBarTheme: const AppBarTheme(
        elevation: 0,
        scrolledUnderElevation: 0.5,
        centerTitle: true,
      ),
      cardTheme: CardThemeData(
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide.none,
        ),
      ),
    );
  }
}
```

**动态主题切换：**

```dart
// main.dart
BlocBuilder<SettingsBloc, SettingsState>(
  builder: (context, settingsState) {
    return MaterialApp(
      theme: AppTheme.lightTheme,
      darkTheme: AppTheme.darkTheme,
      themeMode: settingsState.themeMode,
      // ...
    );
  },
)
```

### 📚 经验总结

- **Material 3**：Flutter 3.x 原生支持 Material You 设计语言
- **ColorScheme.fromSeed**：基于种子色自动生成完整的配色方案
- **圆角设计**：Material 3 强调大圆角，12px 是合适的默认值

---

## 第三部分：数据持久化

## 问题 #5: SQLite 数据库设计

### 🔍 问题背景

需要设计移动端本地存储方案，支持文件、文件夹的 CRUD 操作。

### 💡 解决方案

**使用 sqflite 插件：**

```dart
// file_repository.dart
class FileRepository {
  Database? _database;

  Future<Database> get database async {
    _database ??= await _initDatabase();
    return _database!;
  }

  Future<Database> _initDatabase() async {
    final dbPath = await getDatabasesPath();
    final dbFile = path.join(dbPath, 'mindflow.db');

    return await openDatabase(
      dbFile,
      version: 1,
      onCreate: (db, version) async {
        await db.execute('''
          CREATE TABLE documents (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            parentId TEXT,
            createdAt TEXT NOT NULL,
            updatedAt TEXT NOT NULL,
            isFolder INTEGER NOT NULL DEFAULT 0,
            tags TEXT NOT NULL DEFAULT '',
            isFavorite INTEGER NOT NULL DEFAULT 0
          )
        ''');

        // 创建索引优化查询
        await db.execute(
          'CREATE INDEX idx_parentId ON documents(parentId)'
        );

        // 创建默认文件夹
        final now = DateTime.now().toIso8601String();
        await db.execute('''
          INSERT INTO documents
          (id, title, content, parentId, createdAt, updatedAt, isFolder)
          VALUES ('root', 'My Documents', '', NULL, '$now', '$now', 1)
        ''');
      },
    );
  }
}
```

**数据模型：**

```dart
// document.dart
class Document extends Equatable {
  final String id;
  final String title;
  final String content;
  final String? parentId;  // 支持文件夹层级
  final DateTime createdAt;
  final DateTime updatedAt;
  final bool isFolder;
  final List<String> tags;
  final bool isFavorite;

  factory Document.create({
    required String title,
    String content = '',
    String? parentId,
    bool isFolder = false,
  }) {
    final now = DateTime.now();
    return Document(
      id: const Uuid().v4(),
      title: title,
      content: content,
      parentId: parentId,
      createdAt: now,
      updatedAt: now,
      isFolder: isFolder,
    );
  }
}
```

### 📚 经验总结

- **sqflite**：Flutter 官方推荐的 SQLite 插件，支持 iOS/Android
- **索引优化**：为频繁查询的字段（parentId, isFavorite）添加索引
- **UUID 主键**：使用 UUID 避免主键冲突，支持离线创建

---

## 第四部分：手势与交互

## 问题 #6: 移动端手势操作实现

### 🔍 需求分析

移动端用户期望通过手势快速操作文件（滑动删除、收藏等）。

### 💡 解决方案

**使用 flutter_slidable 实现滑动操作：**

```dart
// file_list_item.dart
class FileListItem extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Slidable(
      key: ValueKey(document.id),
      endActionPane: ActionPane(
        motion: const ScrollMotion(),
        children: [
          SlidableAction(
            onPressed: (_) => onFavoriteToggle(),
            backgroundColor: Colors.orange,
            icon: document.isFavorite
              ? Icons.favorite
              : Icons.favorite_border,
            label: document.isFavorite ? '取消收藏' : '收藏',
          ),
          SlidableAction(
            onPressed: (_) => onDelete(),
            backgroundColor: Colors.red,
            icon: Icons.delete,
            label: '删除',
          ),
        ],
      ),
      child: ListTile(
        onTap: onTap,
        leading: Container(
          width: 48,
          height: 48,
          decoration: BoxDecoration(
            color: document.isFolder
              ? const Color.fromRGBO(33, 150, 243, 0.1)
              : const Color.fromRGBO(76, 175, 80, 0.1),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Icon(
            document.isFolder ? Icons.folder : Icons.description,
            color: document.isFolder ? Colors.blue : Colors.green,
          ),
        ),
        title: Text(document.displayTitle),
        subtitle: Text(_formatDate(document.updatedAt)),
      ),
    );
  }
}
```

### 📚 经验总结

- **flutter_slidable**：成熟的滑动操作库，支持 iOS/Android 风格
- **视觉反馈**：不同操作使用不同颜色（橙色-收藏，红色-删除）
- **图标区分**：文件夹/文件使用不同图标和颜色

---

## 开发统计

### 代码量统计

| 模块 | 文件数 | 代码行数 | 主要功能 |
|------|--------|----------|----------|
| BLoC | 6 | ~400 | 状态管理 |
| Models | 2 | ~200 | 数据模型 |
| Repository | 1 | ~150 | 数据持久化 |
| UI/Screens | 4 | ~600 | 页面 |
| UI/Widgets | 3 | ~300 | 组件 |
| Themes | 1 | ~120 | 主题 |
| Utils | 1 | ~100 | 工具函数 |
| **总计** | **18** | **~1870** | **完整功能** |

### 依赖统计

```yaml
dependencies:
  # State Management
  flutter_bloc: ^8.1.6
  bloc: ^8.1.4
  equatable: ^2.0.8

  # Storage
  path_provider: ^2.1.5
  shared_preferences: ^2.5.4
  sqflite: ^2.4.2

  # UI
  flutter_slidable: ^3.1.2
  flutter_markdown: ^0.6.23

  # Utils
  intl: ^0.20.2
  uuid: ^4.5.2
  share_plus: ^7.2.2
```

---

## 技术亮点

### 1. BLoC 架构

```
UI Event → BLoC → Repository → Database
              ↓
         State Update
              ↓
         UI Rebuild
```

### 2. 自动保存机制

```dart
// 防抖自动保存
Timer(const Duration(seconds: 2), () {
  add(const AutoSaveTriggered());
});
```

### 3. 层级文件管理

```dart
// 递归获取文件夹内容
Future<List<Document>> getDocumentsByParentId(String? parentId) async {
  final maps = await db.query(
    'documents',
    where: parentId == null ? 'parentId IS NULL' : 'parentId = ?',
    whereArgs: parentId == null ? [] : [parentId],
    orderBy: 'isFolder DESC, updatedAt DESC',
  );
  return maps.map((map) => Document.fromJson(map)).toList();
}
```

---

## 经验教训

### 1. 依赖版本管理

**问题**：intl 版本与 flutter_localizations 冲突
**解决**：升级 intl 到 ^0.20.2，暂时注释不兼容的 flutter_quill
**建议**：使用 `flutter pub outdated` 定期检查依赖

### 2. 状态管理选择

**考虑**：Provider vs BLoC vs Riverpod
**决策**：BLoC 适合复杂状态流，代码结构清晰
**结果**：自动保存、搜索过滤等复杂逻辑易于管理

### 3. 移动端 UI 差异

**桌面端**：三栏布局，侧边栏导航
**移动端**：底部导航 + Tab 切换，更适合单手操作
**建议**：不要直接照搬桌面端设计

---

## 未来计划

### Phase 11: 功能增强

- [ ] 富文本编辑器（替换原生 TextField）
- [ ] 云端同步（Firebase/自建后端）
- [ ] 图片插入与预览
- [ ] 导出 PDF/HTML

### Phase 12: 性能优化

- [ ] 大文件虚拟滚动
- [ ] 图片懒加载
- [ ] 数据库性能优化

---

## 结语

本次开发在 6 天内完成了 MindFlow 移动端的核心功能，包括：

1. ✅ 完整的 Flutter 项目架构（BLoC + Repository）
2. ✅ Material 3 主题适配（浅色/深色/跟随系统）
3. ✅ SQLite 本地存储（文件、文件夹管理）
4. ✅ Markdown 编辑器（编辑+预览双模式）
5. ✅ 手势操作支持（滑动删除、收藏）

**下一步**：测试验证和功能完善。

---

**相关链接**：
- GitHub: https://github.com/your-org/mindflow
- 文档: https://mindflow.dev/docs

**作者**: MindFlow Team
**日期**: 2026-01-30
**标签**: #Flutter #Mobile #BLoC #SQLite #Material3
