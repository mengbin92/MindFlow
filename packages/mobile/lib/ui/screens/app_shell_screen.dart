import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';

import '../../blocs/file/file_bloc.dart';
import '../../models/document.dart';
import '../widgets/file_list_item.dart';
import '../widgets/search_bar.dart';
import 'editor_screen.dart';
import 'settings_screen.dart';

enum AppShellSection {
  workspace(
    path: '/workspace',
    label: '工作区',
    icon: Icons.folder_outlined,
    selectedIcon: Icons.folder,
  ),
  favorites(
    path: '/favorites',
    label: '收藏',
    icon: Icons.favorite_outline,
    selectedIcon: Icons.favorite,
  ),
  settings(
    path: '/settings',
    label: '设置',
    icon: Icons.settings_outlined,
    selectedIcon: Icons.settings,
  );

  const AppShellSection({
    required this.path,
    required this.label,
    required this.icon,
    required this.selectedIcon,
  });

  final String path;
  final String label;
  final IconData icon;
  final IconData selectedIcon;
}

class AppShellScreen extends StatefulWidget {
  final AppShellSection section;
  final String? selectedDocumentId;

  const AppShellScreen({
    super.key,
    required this.section,
    this.selectedDocumentId,
  });

  @override
  State<AppShellScreen> createState() => _AppShellScreenState();
}

class _AppShellScreenState extends State<AppShellScreen> {
  String? _requestedDocumentId;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _syncSelectionRequest();
  }

  @override
  void didUpdateWidget(covariant AppShellScreen oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.selectedDocumentId != widget.selectedDocumentId) {
      _syncSelectionRequest();
    }
  }

  void _syncSelectionRequest() {
    final documentId = widget.selectedDocumentId;
    if (documentId == null || documentId == _requestedDocumentId) {
      return;
    }
    _requestedDocumentId = documentId;
    context.read<FileBloc>().add(FileOpened(documentId));
  }

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final isCompact = constraints.maxWidth < 900;
        return BlocBuilder<FileBloc, FileState>(
          builder: (context, state) {
            final selectedDocument = _resolveSelectedDocument(state);

            if (isCompact && selectedDocument != null) {
              return DocumentEditorView(
                document: selectedDocument,
                showScaffold: true,
                onClose: () => context.go(widget.section.path),
              );
            }

            final body = _buildBody(
              context: context,
              state: state,
              selectedDocument: selectedDocument,
              isCompact: isCompact,
            );

            if (!isCompact) {
              return body;
            }

            return Scaffold(
              appBar: AppBar(
                title: Text(_collectionTitle(state)),
                actions: widget.section == AppShellSection.workspace
                    ? [
                        IconButton(
                          icon: const Icon(Icons.folder_open),
                          onPressed: _showWorkspaceOptions,
                        ),
                        IconButton(
                          icon: const Icon(Icons.search),
                          onPressed: () async {
                            final result = await showSearch<String?>(
                              context: context,
                              delegate: DocumentSearchDelegate(),
                            );
                            if (!context.mounted || result == null) {
                              return;
                            }
                            context.read<FileBloc>().add(FileOpened(result));
                            context.go('${widget.section.path}/$result');
                          },
                        ),
                      ]
                    : null,
              ),
              body: body,
              floatingActionButton: widget.section == AppShellSection.workspace
                  ? FloatingActionButton.extended(
                      onPressed: _showCreateOptions,
                      icon: const Icon(Icons.add),
                      label: const Text('新建'),
                    )
                  : null,
              bottomNavigationBar: _CompactNavigationBar(
                currentSection: widget.section,
                onSelect: _navigateToSection,
              ),
            );
          },
        );
      },
    );
  }

  Widget _buildBody({
    required BuildContext context,
    required FileState state,
    required Document? selectedDocument,
    required bool isCompact,
  }) {
    if (widget.section == AppShellSection.settings) {
      return const SettingsScreen(embedded: true);
    }

    final documents = widget.section == AppShellSection.favorites
        ? state.favoriteDocuments
        : state.documents;

    if (state.status == FileStatus.loading && documents.isEmpty) {
      return const Center(child: CircularProgressIndicator());
    }

    if (state.status == FileStatus.failure && documents.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.error_outline, size: 48, color: Colors.red),
            const SizedBox(height: 16),
            Text('加载失败: ${state.errorMessage}'),
            const SizedBox(height: 16),
            FilledButton(
              onPressed: () =>
                  context.read<FileBloc>().add(const FilesLoaded()),
              child: const Text('重试'),
            ),
          ],
        ),
      );
    }

    if (isCompact) {
      return _DocumentCollectionView(
        title: _collectionTitle(state),
        documents: documents,
        emptyIcon: widget.section == AppShellSection.favorites
            ? Icons.favorite_border
            : Icons.folder_open,
        emptyTitle:
            widget.section == AppShellSection.favorites ? '暂无收藏' : '暂无文档',
        emptyDescription: widget.section == AppShellSection.favorites
            ? '在文档列表中收藏常用内容'
            : '点击右下角按钮创建新文档',
        onOpenDocument: (document) => _handleDocumentTap(document),
        onDeleteDocument: _showDeleteConfirm,
        showSearchBar: widget.section == AppShellSection.workspace,
        folderTrail: widget.section == AppShellSection.workspace
            ? state.folderTrail
            : const [],
        onNavigateToFolder: _navigateToFolder,
      );
    }

    return Scaffold(
      body: Row(
        children: [
          _WideNavigationRail(
            currentSection: widget.section,
            onSelect: _navigateToSection,
          ),
          Expanded(
            child: Row(
              children: [
                SizedBox(
                  width: 380,
                  child: DecoratedBox(
                    decoration: BoxDecoration(
                      color: Theme.of(context).colorScheme.surface,
                      border: Border(
                        right: BorderSide(
                          color: Theme.of(context).dividerColor,
                        ),
                      ),
                    ),
                    child: _DocumentCollectionView(
                      title: widget.section == AppShellSection.workspace
                          ? _collectionTitle(state)
                          : '收藏',
                      documents: documents,
                      emptyIcon: widget.section == AppShellSection.favorites
                          ? Icons.favorite_border
                          : Icons.folder_open,
                      emptyTitle: widget.section == AppShellSection.favorites
                          ? '暂无收藏'
                          : '暂无文档',
                      emptyDescription:
                          widget.section == AppShellSection.favorites
                              ? '在文档列表中收藏常用内容'
                              : '创建文档后可在这里继续编辑',
                      onOpenDocument: (document) =>
                          _handleDocumentTap(document),
                      onDeleteDocument: _showDeleteConfirm,
                      showSearchBar:
                          widget.section == AppShellSection.workspace,
                      folderTrail: widget.section == AppShellSection.workspace
                          ? state.folderTrail
                          : const [],
                      onNavigateToFolder: _navigateToFolder,
                      headerAction: widget.section == AppShellSection.workspace
                          ? Wrap(
                              spacing: 8,
                              children: [
                                OutlinedButton.icon(
                                  onPressed: _showWorkspaceOptions,
                                  icon: const Icon(Icons.folder_open),
                                  label: const Text('工作区'),
                                ),
                                FilledButton.icon(
                                  onPressed: _showCreateOptions,
                                  icon: const Icon(Icons.add),
                                  label: const Text('新建'),
                                ),
                              ],
                            )
                          : null,
                      footer: widget.section == AppShellSection.workspace
                          ? _RecentDocumentsSection(
                              documents: state.recentDocuments,
                              onOpenDocument: _openDocument,
                            )
                          : null,
                    ),
                  ),
                ),
                Expanded(
                  child: selectedDocument == null
                      ? _EmptyDetailPanel(
                          title: widget.section == AppShellSection.favorites
                              ? '选择一个收藏项开始编辑'
                              : '选择一个文档开始编辑',
                          description:
                              widget.section == AppShellSection.workspace
                                  ? '当前阶段已完成 Flutter 应用壳、自适应布局与编辑主链路重构。'
                                  : '收藏列表和编辑区已经合并到同一套 Flutter 外壳。',
                        )
                      : DocumentEditorView(
                          document: selectedDocument,
                          onClose: () => context.go(widget.section.path),
                        ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Document? _resolveSelectedDocument(FileState state) {
    final selectedDocument = widget.selectedDocumentId == null
        ? state.selectedDocument
        : state.findDocumentById(widget.selectedDocumentId!);
    if (selectedDocument?.isFolder == true) {
      return null;
    }
    return selectedDocument;
  }

  void _navigateToSection(AppShellSection section) {
    context.go(section.path);
  }

  void _handleDocumentTap(Document document) {
    if (document.isFolder) {
      context.read<FileBloc>().add(FolderNavigated(document.id));
      return;
    }
    _openDocument(document);
  }

  void _openDocument(Document document) {
    context.read<FileBloc>().add(FileOpened(document.id));
    context.go('${widget.section.path}/${document.id}');
  }

  void _navigateToFolder(String? folderId) {
    context.read<FileBloc>().add(FolderNavigated(folderId));
    context.go(widget.section.path);
  }

  String _collectionTitle(FileState state) {
    if (widget.section != AppShellSection.workspace) {
      return widget.section.label;
    }
    return state.currentFolder?.displayTitle ?? state.workspaceName;
  }

  void _showCreateOptions() {
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
                _createNewDocument();
              },
            ),
            ListTile(
              leading: const Icon(Icons.create_new_folder),
              title: const Text('新建文件夹'),
              onTap: () {
                Navigator.pop(context);
                _createNewFolder();
              },
            ),
          ],
        ),
      ),
    );
  }

  void _showWorkspaceOptions() {
    showModalBottomSheet(
      context: context,
      builder: (context) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: const Icon(Icons.folder_open),
              title: const Text('打开目录工作区'),
              subtitle: const Text('直接编辑本地 Markdown 文件夹'),
              onTap: () {
                Navigator.pop(context);
                this.context.read<FileBloc>().add(const WorkspacePicked());
              },
            ),
            ListTile(
              leading: const Icon(Icons.inventory_2_outlined),
              title: const Text('切回本地资料库'),
              subtitle: const Text('使用应用内 SQLite 文档库'),
              onTap: () {
                Navigator.pop(context);
                this.context.read<FileBloc>().add(const LocalLibrarySelected());
              },
            ),
          ],
        ),
      ),
    );
  }

  void _createNewDocument() {
    context.read<FileBloc>().add(
          const FileCreated(title: '未命名文档', content: ''),
        );

    Future.delayed(const Duration(milliseconds: 150), () {
      if (!mounted) {
        return;
      }
      final state = context.read<FileBloc>().state;
      if (state.documents.isNotEmpty) {
        final newDocument = state.documents.firstWhere(
          (document) => !document.isFolder,
          orElse: () => state.documents.first,
        );
        if (!newDocument.isFolder) {
          _openDocument(newDocument);
        }
      }
    });
  }

  void _createNewFolder() {
    showDialog(
      context: context,
      builder: (context) => const _CreateFolderDialog(),
    );
  }

  void _showDeleteConfirm(Document document) {
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
              if (widget.selectedDocumentId == document.id) {
                context.go(widget.section.path);
              }
            },
            style: FilledButton.styleFrom(backgroundColor: Colors.red),
            child: const Text('删除'),
          ),
        ],
      ),
    );
  }
}

class _WideNavigationRail extends StatelessWidget {
  final AppShellSection currentSection;
  final ValueChanged<AppShellSection> onSelect;

  const _WideNavigationRail({
    required this.currentSection,
    required this.onSelect,
  });

  @override
  Widget build(BuildContext context) {
    return NavigationRail(
      selectedIndex: AppShellSection.values.indexOf(currentSection),
      onDestinationSelected: (index) => onSelect(AppShellSection.values[index]),
      labelType: NavigationRailLabelType.all,
      destinations: AppShellSection.values
          .map(
            (section) => NavigationRailDestination(
              icon: Icon(section.icon),
              selectedIcon: Icon(section.selectedIcon),
              label: Text(section.label),
            ),
          )
          .toList(),
    );
  }
}

class _CompactNavigationBar extends StatelessWidget {
  final AppShellSection currentSection;
  final ValueChanged<AppShellSection> onSelect;

  const _CompactNavigationBar({
    required this.currentSection,
    required this.onSelect,
  });

  @override
  Widget build(BuildContext context) {
    return NavigationBar(
      selectedIndex: AppShellSection.values.indexOf(currentSection),
      onDestinationSelected: (index) => onSelect(AppShellSection.values[index]),
      destinations: AppShellSection.values
          .map(
            (section) => NavigationDestination(
              icon: Icon(section.icon),
              selectedIcon: Icon(section.selectedIcon),
              label: section.label,
            ),
          )
          .toList(),
    );
  }
}

class _DocumentCollectionView extends StatelessWidget {
  final String title;
  final List<Document> documents;
  final IconData emptyIcon;
  final String emptyTitle;
  final String emptyDescription;
  final ValueChanged<Document> onOpenDocument;
  final ValueChanged<Document> onDeleteDocument;
  final bool showSearchBar;
  final List<Document> folderTrail;
  final ValueChanged<String?>? onNavigateToFolder;
  final Widget? headerAction;
  final Widget? footer;

  const _DocumentCollectionView({
    required this.title,
    required this.documents,
    required this.emptyIcon,
    required this.emptyTitle,
    required this.emptyDescription,
    required this.onOpenDocument,
    required this.onDeleteDocument,
    this.showSearchBar = false,
    this.folderTrail = const [],
    this.onNavigateToFolder,
    this.headerAction,
    this.footer,
  });

  @override
  Widget build(BuildContext context) {
    if (documents.isEmpty) {
      return Column(
        children: [
          _SectionHeader(title: title, action: headerAction),
          if (folderTrail.isNotEmpty)
            _FolderTrailBar(
              folderTrail: folderTrail,
              onNavigateToFolder: onNavigateToFolder,
            ),
          if (showSearchBar)
            const Padding(
              padding: EdgeInsets.fromLTRB(16, 0, 16, 12),
              child: DocumentSearchBar(),
            ),
          Expanded(
            child: _EmptyListState(
              icon: emptyIcon,
              title: emptyTitle,
              description: emptyDescription,
            ),
          ),
          if (footer != null) footer!,
        ],
      );
    }

    return Column(
      children: [
        _SectionHeader(title: title, action: headerAction),
        if (folderTrail.isNotEmpty)
          _FolderTrailBar(
            folderTrail: folderTrail,
            onNavigateToFolder: onNavigateToFolder,
          ),
        if (showSearchBar)
          const Padding(
            padding: EdgeInsets.fromLTRB(16, 0, 16, 12),
            child: DocumentSearchBar(),
          ),
        Expanded(
          child: ListView.builder(
            padding: const EdgeInsets.only(bottom: 8),
            itemCount: documents.length,
            itemBuilder: (context, index) {
              final document = documents[index];
              return FileListItem(
                document: document,
                onTap: () => onOpenDocument(document),
                onFavoriteToggle: () {
                  context.read<FileBloc>().add(
                        FileToggledFavorite(document.id),
                      );
                },
                onDelete: () => onDeleteDocument(document),
              );
            },
          ),
        ),
        if (footer != null) footer!,
      ],
    );
  }
}

class _SectionHeader extends StatelessWidget {
  final String title;
  final Widget? action;

  const _SectionHeader({required this.title, this.action});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 12),
      child: Row(
        children: [
          Expanded(
            child: Text(
              title,
              style: Theme.of(context).textTheme.headlineSmall,
            ),
          ),
          if (action != null) action!,
        ],
      ),
    );
  }
}

class _FolderTrailBar extends StatelessWidget {
  final List<Document> folderTrail;
  final ValueChanged<String?>? onNavigateToFolder;

  const _FolderTrailBar({
    required this.folderTrail,
    required this.onNavigateToFolder,
  });

  @override
  Widget build(BuildContext context) {
    final parentId =
        folderTrail.length > 1 ? folderTrail[folderTrail.length - 2].id : null;

    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
      child: Row(
        children: [
          IconButton(
            onPressed: onNavigateToFolder == null
                ? null
                : () => onNavigateToFolder!(parentId),
            icon: const Icon(Icons.arrow_back),
            tooltip: '返回上一级',
          ),
          Expanded(
            child: SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: [
                  ActionChip(
                    label: const Text('根目录'),
                    onPressed: onNavigateToFolder == null
                        ? null
                        : () => onNavigateToFolder!(null),
                  ),
                  ...folderTrail.asMap().entries.map((entry) {
                    final isLast = entry.key == folderTrail.length - 1;
                    return Row(
                      children: [
                        const Padding(
                          padding: EdgeInsets.symmetric(horizontal: 8),
                          child: Icon(Icons.chevron_right, size: 16),
                        ),
                        ActionChip(
                          label: Text(entry.value.displayTitle),
                          onPressed: isLast || onNavigateToFolder == null
                              ? null
                              : () => onNavigateToFolder!(entry.value.id),
                        ),
                      ],
                    );
                  }),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _EmptyListState extends StatelessWidget {
  final IconData icon;
  final String title;
  final String description;

  const _EmptyListState({
    required this.icon,
    required this.title,
    required this.description,
  });

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 56, color: Colors.grey),
            const SizedBox(height: 16),
            Text(title, style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 8),
            Text(
              description,
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: Theme.of(context).hintColor,
                  ),
            ),
          ],
        ),
      ),
    );
  }
}

class _EmptyDetailPanel extends StatelessWidget {
  final String title;
  final String description;

  const _EmptyDetailPanel({required this.title, required this.description});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            Theme.of(context).colorScheme.surface,
            Theme.of(context).colorScheme.surfaceContainerHighest,
          ],
        ),
      ),
      child: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 480),
          child: Padding(
            padding: const EdgeInsets.all(32),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(
                  Icons.edit_note,
                  size: 72,
                  color: Theme.of(context).colorScheme.primary,
                ),
                const SizedBox(height: 20),
                Text(
                  title,
                  style: Theme.of(context).textTheme.headlineSmall,
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 12),
                Text(
                  description,
                  textAlign: TextAlign.center,
                  style: Theme.of(context).textTheme.bodyLarge,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _RecentDocumentsSection extends StatelessWidget {
  final List<Document> documents;
  final ValueChanged<Document> onOpenDocument;

  const _RecentDocumentsSection({
    required this.documents,
    required this.onOpenDocument,
  });

  @override
  Widget build(BuildContext context) {
    if (documents.isEmpty) {
      return const SizedBox.shrink();
    }

    return Container(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 16),
      decoration: BoxDecoration(
        border: Border(top: BorderSide(color: Theme.of(context).dividerColor)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('最近打开', style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(height: 8),
          ...documents.take(3).map(
                (document) => ListTile(
                  contentPadding: EdgeInsets.zero,
                  leading: const Icon(Icons.history),
                  title: Text(
                    document.displayTitle,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  onTap: () => onOpenDocument(document),
                ),
              ),
        ],
      ),
    );
  }
}

class _CreateFolderDialog extends StatefulWidget {
  const _CreateFolderDialog();

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
        decoration: const InputDecoration(hintText: '文件夹名称'),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context),
          child: const Text('取消'),
        ),
        FilledButton(
          onPressed: () {
            final name = _controller.text.trim();
            if (name.isEmpty) {
              return;
            }
            context.read<FileBloc>().add(
                  FileCreated(title: name, isFolder: true),
                );
            Navigator.pop(context);
          },
          child: const Text('创建'),
        ),
      ],
    );
  }
}
