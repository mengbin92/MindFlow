import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../blocs/file/file_bloc.dart';
import '../../models/document.dart';
import '../widgets/file_list_item.dart';
import '../widgets/search_bar.dart';
import '../widgets/bottom_nav_bar.dart';
import 'editor_screen.dart';
import 'favorites_screen.dart';
import 'settings_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _currentIndex = 0;

  final List<Widget> _screens = [
    const _FileListView(),
    const FavoritesScreen(),
    const SettingsScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: _screens[_currentIndex],
      bottomNavigationBar: BottomNavBar(
        currentIndex: _currentIndex,
        onTap: (index) => setState(() => _currentIndex = index),
      ),
      floatingActionButton: _currentIndex == 0
          ? FloatingActionButton.extended(
              onPressed: () => _showCreateOptions(context),
              icon: const Icon(Icons.add),
              label: const Text('新建'),
            )
          : null,
    );
  }

  void _showCreateOptions(BuildContext context) {
    showModalBottomSheet(
      context: context,
      builder: (context) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: const Icon(Icons.note_add),
              title: const Text('新建文档'),
              onTap: () {
                Navigator.pop(context);
                _createNewDocument(context);
              },
            ),
            ListTile(
              leading: const Icon(Icons.create_new_folder),
              title: const Text('新建文件夹'),
              onTap: () {
                Navigator.pop(context);
                _createNewFolder(context);
              },
            ),
          ],
        ),
      ),
    );
  }

  void _createNewDocument(BuildContext context) {
    context.read<FileBloc>().add(
          const FileCreated(title: '未命名文档', content: ''),
        );

    // 等待文档创建后打开编辑器
    Future.delayed(const Duration(milliseconds: 100), () {
      if (!context.mounted) {
        return;
      }
      final state = context.read<FileBloc>().state;
      if (state.documents.isNotEmpty) {
        final newDoc = state.documents.first;
        _openEditor(context, newDoc);
      }
    });
  }

  void _createNewFolder(BuildContext context) {
    showDialog(context: context, builder: (context) => _CreateFolderDialog());
  }

  void _openEditor(BuildContext context, Document document) {
    Navigator.push(
      context,
      MaterialPageRoute(builder: (context) => EditorScreen(document: document)),
    );
  }
}

class _FileListView extends StatelessWidget {
  const _FileListView();

  @override
  Widget build(BuildContext context) {
    return CustomScrollView(
      slivers: [
        SliverAppBar(
          floating: true,
          pinned: true,
          title: const Text('MindFlow'),
          actions: [
            IconButton(
              icon: const Icon(Icons.search),
              onPressed: () {
                showSearch(
                  context: context,
                  delegate: DocumentSearchDelegate(),
                );
              },
            ),
          ],
          bottom: const PreferredSize(
            preferredSize: Size.fromHeight(60),
            child: Padding(
              padding: EdgeInsets.all(8.0),
              child: DocumentSearchBar(),
            ),
          ),
        ),
        BlocBuilder<FileBloc, FileState>(
          builder: (context, state) {
            if (state.status == FileStatus.loading) {
              return const SliverFillRemaining(
                child: Center(child: CircularProgressIndicator()),
              );
            }

            if (state.status == FileStatus.failure) {
              return SliverFillRemaining(
                child: Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(
                        Icons.error_outline,
                        size: 48,
                        color: Colors.red,
                      ),
                      const SizedBox(height: 16),
                      Text('加载失败: ${state.errorMessage}'),
                      const SizedBox(height: 16),
                      ElevatedButton(
                        onPressed: () {
                          context.read<FileBloc>().add(const FilesLoaded());
                        },
                        child: const Text('重试'),
                      ),
                    ],
                  ),
                ),
              );
            }

            final documents = state.currentFolderDocuments;

            if (documents.isEmpty) {
              return const SliverFillRemaining(
                child: Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.folder_open, size: 64, color: Colors.grey),
                      SizedBox(height: 16),
                      Text(
                        '暂无文档',
                        style: TextStyle(fontSize: 16, color: Colors.grey),
                      ),
                      SizedBox(height: 8),
                      Text(
                        '点击右下角按钮创建新文档',
                        style: TextStyle(fontSize: 14, color: Colors.grey),
                      ),
                    ],
                  ),
                ),
              );
            }

            return SliverList(
              delegate: SliverChildBuilderDelegate((context, index) {
                final document = documents[index];
                return FileListItem(
                  document: document,
                  onTap: () {
                    if (document.isFolder) {
                      context.read<FileBloc>().add(
                            FolderNavigated(document.id),
                          );
                    } else {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (context) =>
                              EditorScreen(document: document),
                        ),
                      );
                    }
                  },
                  onFavoriteToggle: () {
                    context.read<FileBloc>().add(
                          FileToggledFavorite(document.id),
                        );
                  },
                  onDelete: () {
                    _showDeleteConfirm(context, document);
                  },
                );
              }, childCount: documents.length),
            );
          },
        ),
      ],
    );
  }

  void _showDeleteConfirm(BuildContext context, Document document) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('确认删除'),
        content: Text('确定要删除 "${document.displayTitle}" 吗？'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('取消'),
          ),
          FilledButton(
            onPressed: () {
              context.read<FileBloc>().add(FileDeleted(document.id));
              Navigator.pop(context);
            },
            style: FilledButton.styleFrom(backgroundColor: Colors.red),
            child: const Text('删除'),
          ),
        ],
      ),
    );
  }
}

class _CreateFolderDialog extends StatefulWidget {
  @override
  State<_CreateFolderDialog> createState() => _CreateFolderDialogState();
}

class _CreateFolderDialogState extends State<_CreateFolderDialog> {
  final _controller = TextEditingController();

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text('新建文件夹'),
      content: TextField(
        controller: _controller,
        autofocus: true,
        decoration: const InputDecoration(
          labelText: '文件夹名称',
          hintText: '输入文件夹名称',
        ),
        onSubmitted: (value) => _createFolder(),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context),
          child: const Text('取消'),
        ),
        FilledButton(onPressed: _createFolder, child: const Text('创建')),
      ],
    );
  }

  void _createFolder() {
    final name = _controller.text.trim();
    if (name.isNotEmpty) {
      context.read<FileBloc>().add(FileCreated(title: name, isFolder: true));
      Navigator.pop(context);
    }
  }
}
