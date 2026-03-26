import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:share_plus/share_plus.dart';

import '../../blocs/file/file_bloc.dart';
import '../../domain/repositories/document_repository.dart';
import '../../editor/editor_bridge_controller.dart';
import '../../editor/editor_bridge_view.dart';
import '../../models/document.dart';
import '../../render/preview_bridge_view.dart';
import '../../render/preview_render_result.dart';
import '../../render/preview_render_service.dart';

class EditorScreen extends StatelessWidget {
  final Document document;

  const EditorScreen({super.key, required this.document});

  @override
  Widget build(BuildContext context) {
    return DocumentEditorView(
      document: document,
      showScaffold: true,
      onClose: () => Navigator.of(context).maybePop(),
    );
  }
}

class DocumentEditorView extends StatefulWidget {
  final Document document;
  final bool showScaffold;
  final VoidCallback? onClose;

  const DocumentEditorView({
    super.key,
    required this.document,
    this.showScaffold = false,
    this.onClose,
  });

  @override
  State<DocumentEditorView> createState() => _DocumentEditorViewState();
}

class _DocumentEditorViewState extends State<DocumentEditorView>
    with SingleTickerProviderStateMixin {
  late TextEditingController _titleController;
  late EditorBridgeController _editorController;
  late TabController _tabController;
  late Document _document;
  late PreviewRenderService _previewRenderService;
  late PreviewRenderResult _previewResult;
  bool _hasChanges = false;
  bool _syncingTitle = false;
  int _previewRequestId = 0;

  @override
  void initState() {
    super.initState();
    _document = widget.document;
    _titleController = TextEditingController(text: _document.title);
    _editorController =
        EditorBridgeController(initialContent: _document.content);
    _tabController = TabController(length: 2, vsync: this);
    _previewRenderService = const PreviewRenderService();
    _previewResult = const PreviewRenderResult(markdown: '', html: '');
    _refreshPreview(_document.content);

    _editorController.textController.addListener(_onContentChanged);
    _titleController.addListener(_onTitleChanged);

    context.read<FileBloc>().add(FileSelected(_document));
  }

  @override
  void didUpdateWidget(covariant DocumentEditorView oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.document.id != widget.document.id ||
        oldWidget.document.updatedAt != widget.document.updatedAt) {
      _document = widget.document;
      _syncingTitle = true;
      _titleController.value = TextEditingValue(text: _document.title);
      _syncingTitle = false;
      _editorController.setDocumentContent(_document.content);
      _refreshPreview(_document.content);
      _hasChanges = false;
      context.read<FileBloc>().add(FileSelected(_document));
    }
  }

  @override
  void dispose() {
    _titleController.dispose();
    _editorController.dispose();
    _tabController.dispose();
    super.dispose();
  }

  void _onTitleChanged() {
    if (_syncingTitle) {
      return;
    }
    if (!_hasChanges && mounted) {
      setState(() => _hasChanges = true);
    }
  }

  void _onContentChanged() {
    if (_editorController.isSyncing) {
      return;
    }
    context.read<FileBloc>().add(FileContentChanged(_editorController.text));
    _refreshPreview(_editorController.text);
    if (!_hasChanges && mounted) {
      setState(() => _hasChanges = true);
    } else {
      setState(() {});
    }
  }

  Future<void> _refreshPreview(String markdown) async {
    final requestId = ++_previewRequestId;
    final result = await _previewRenderService.render(markdown);
    if (!mounted || requestId != _previewRequestId) {
      return;
    }
    setState(() {
      _previewResult = result;
    });
  }

  Future<void> _handleCloseRequest() async {
    if (!_hasChanges) {
      widget.onClose?.call();
      return;
    }

    final result = await showDialog<_EditorExitAction>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('未保存的更改'),
        content: const Text('是否保存当前修改？'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, _EditorExitAction.discard),
            child: const Text('不保存'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, _EditorExitAction.cancel),
            child: const Text('取消'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(context, _EditorExitAction.save),
            child: const Text('保存'),
          ),
        ],
      ),
    );

    if (result == _EditorExitAction.save) {
      await _saveDocument(showMessage: false);
      widget.onClose?.call();
    } else if (result == _EditorExitAction.discard) {
      widget.onClose?.call();
    }
  }

  Future<void> _saveDocument({bool showMessage = true}) async {
    final updatedDoc = _document.copyWith(
      title: _titleController.text.trim().isEmpty
          ? '未命名文档'
          : _titleController.text.trim(),
      content: _editorController.text,
    );
    context.read<FileBloc>().add(FileUpdated(updatedDoc));
    setState(() {
      _document = updatedDoc;
      _hasChanges = false;
    });

    if (showMessage && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('已保存'), duration: Duration(seconds: 1)),
      );
    }
  }

  void _shareDocument() {
    Share.share(_editorController.text, subject: _titleController.text);
  }

  Future<void> _exportMarkdown() async {
    try {
      if (_hasChanges) {
        await _saveDocument(showMessage: false);
      }

      final exportPath = await context.read<DocumentRepository>().exportToMarkdown(
            _document.id,
          );

      if (!mounted) {
        return;
      }

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('已导出到 $exportPath'),
          duration: const Duration(seconds: 2),
        ),
      );
    } catch (error) {
      if (!mounted) {
        return;
      }
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('导出失败: $error'),
          duration: const Duration(seconds: 2),
        ),
      );
    }
  }

  Future<void> _exportHtml() async {
    try {
      if (_hasChanges) {
        await _saveDocument(showMessage: false);
      }

      final htmlDocument = _previewRenderService.buildHtmlDocument(
        title: _titleController.text.trim().isEmpty
            ? _document.displayTitle
            : _titleController.text.trim(),
        bodyHtml: _previewResult.html,
      );

      final exportPath = await context.read<DocumentRepository>().exportToHtml(
            _document.id,
            html: htmlDocument,
          );

      if (!mounted) {
        return;
      }

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('已导出到 $exportPath'),
          duration: const Duration(seconds: 2),
        ),
      );
    } catch (error) {
      if (!mounted) {
        return;
      }
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('导出失败: $error'),
          duration: const Duration(seconds: 2),
        ),
      );
    }
  }

  Future<void> _exportPdf() async {
    try {
      if (_hasChanges) {
        await _saveDocument(showMessage: false);
      }

      final htmlDocument = _previewRenderService.buildHtmlDocument(
        title: _titleController.text.trim().isEmpty
            ? _document.displayTitle
            : _titleController.text.trim(),
        bodyHtml: _previewResult.html,
      );

      final exportPath = await context.read<DocumentRepository>().exportToPdf(
            _document.id,
            html: htmlDocument,
          );

      if (!mounted) {
        return;
      }

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('已导出到 $exportPath'),
          duration: const Duration(seconds: 2),
        ),
      );
    } catch (error) {
      if (!mounted) {
        return;
      }
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('导出失败: $error'),
          duration: const Duration(seconds: 2),
        ),
      );
    }
  }

  Future<void> _exportImage() async {
    try {
      if (_hasChanges) {
        await _saveDocument(showMessage: false);
      }

      final htmlDocument = _previewRenderService.buildHtmlDocument(
        title: _titleController.text.trim().isEmpty
            ? _document.displayTitle
            : _titleController.text.trim(),
        bodyHtml: _previewResult.html,
      );

      final exportPath = await context.read<DocumentRepository>().exportToImage(
            _document.id,
            html: htmlDocument,
          );

      if (!mounted) {
        return;
      }

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('已导出到 $exportPath'),
          duration: const Duration(seconds: 2),
        ),
      );
    } catch (error) {
      if (!mounted) {
        return;
      }
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('导出失败: $error'),
          duration: const Duration(seconds: 2),
        ),
      );
    }
  }

  Future<void> _exportImagesZip() async {
    try {
      if (_hasChanges) {
        await _saveDocument(showMessage: false);
      }

      final htmlDocument = _previewRenderService.buildHtmlDocument(
        title: _titleController.text.trim().isEmpty
            ? _document.displayTitle
            : _titleController.text.trim(),
        bodyHtml: _previewResult.html,
      );

      final exportPath =
          await context.read<DocumentRepository>().exportToImagesZip(
                _document.id,
                html: htmlDocument,
              );

      if (!mounted) {
        return;
      }

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('已导出到 $exportPath'),
          duration: const Duration(seconds: 2),
        ),
      );
    } catch (error) {
      if (!mounted) {
        return;
      }
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('导出失败: $error'),
          duration: const Duration(seconds: 2),
        ),
      );
    }
  }

  Future<void> _showExportOptions() async {
    await showModalBottomSheet<void>(
      context: context,
      builder: (context) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: const Icon(Icons.description_outlined),
              title: const Text('导出 Markdown'),
              onTap: () async {
                Navigator.pop(context);
                await _exportMarkdown();
              },
            ),
            ListTile(
              leading: const Icon(Icons.html),
              title: const Text('导出 HTML'),
              onTap: () async {
                Navigator.pop(context);
                await _exportHtml();
              },
            ),
            ListTile(
              leading: const Icon(Icons.picture_as_pdf_outlined),
              title: const Text('导出 PDF'),
              onTap: () async {
                Navigator.pop(context);
                await _exportPdf();
              },
            ),
            ListTile(
              leading: const Icon(Icons.image_outlined),
              title: const Text('导出图片'),
              onTap: () async {
                Navigator.pop(context);
                await _exportImage();
              },
            ),
            ListTile(
              leading: const Icon(Icons.folder_zip_outlined),
              title: const Text('导出多页图片 ZIP'),
              onTap: () async {
                Navigator.pop(context);
                await _exportImagesZip();
              },
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final body = Column(
      children: [
        _EditorHeader(
          titleController: _titleController,
          hasChanges: _hasChanges,
          tabController: _tabController,
          showBackButton: widget.showScaffold,
          onClose: _handleCloseRequest,
          onShare: _shareDocument,
          onExport: _showExportOptions,
          onSave: _saveDocument,
        ),
        Expanded(
          child: TabBarView(
            controller: _tabController,
            children: [
              EditorBridgeView(controller: _editorController),
              PreviewBridgeView(result: _previewResult),
            ],
          ),
        ),
        _EditorToolbar(
          onInsertMarkdown: _editorController.insertMarkdown,
          onInsertAtLineStart: _editorController.insertAtLineStart,
          onInsertText: _editorController.insertText,
        ),
      ],
    );

    if (!widget.showScaffold) {
      return body;
    }

    return PopScope(
      canPop: !_hasChanges,
      onPopInvokedWithResult: (_, __) async {
        if (_hasChanges) {
          await _handleCloseRequest();
        }
      },
      child: Scaffold(body: SafeArea(child: body)),
    );
  }
}

enum _EditorExitAction { save, discard, cancel }

class _EditorHeader extends StatelessWidget {
  final TextEditingController titleController;
  final bool hasChanges;
  final TabController tabController;
  final bool showBackButton;
  final Future<void> Function() onClose;
  final VoidCallback onShare;
  final Future<void> Function() onExport;
  final Future<void> Function({bool showMessage}) onSave;

  const _EditorHeader({
    required this.titleController,
    required this.hasChanges,
    required this.tabController,
    required this.showBackButton,
    required this.onClose,
    required this.onShare,
    required this.onExport,
    required this.onSave,
  });

  @override
  Widget build(BuildContext context) {
    final borderColor = Theme.of(context).dividerColor;

    return Material(
      color: Theme.of(context).colorScheme.surface,
      child: Container(
        decoration: BoxDecoration(
          border: Border(bottom: BorderSide(color: borderColor)),
        ),
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(12, 8, 12, 0),
              child: Row(
                children: [
                  if (showBackButton)
                    IconButton(
                      onPressed: onClose,
                      icon: const Icon(Icons.arrow_back),
                    ),
                  Expanded(
                    child: TextField(
                      controller: titleController,
                      decoration: const InputDecoration(
                        border: InputBorder.none,
                        hintText: '文档标题',
                        contentPadding: EdgeInsets.zero,
                      ),
                      style: const TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                  if (hasChanges)
                    const Padding(
                      padding: EdgeInsets.only(right: 8),
                      child: Chip(label: Text('未保存'), side: BorderSide.none),
                    ),
                  IconButton(
                    onPressed: onExport,
                    icon: const Icon(Icons.file_download_outlined),
                    tooltip: '导出文档',
                  ),
                  IconButton(onPressed: onShare, icon: const Icon(Icons.share)),
                  IconButton(
                    onPressed: () => onSave(),
                    icon: const Icon(Icons.save),
                  ),
                ],
              ),
            ),
            TabBar(
              controller: tabController,
              tabs: const [
                Tab(icon: Icon(Icons.edit), text: '编辑'),
                Tab(icon: Icon(Icons.preview), text: '预览'),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _EditorToolbar extends StatelessWidget {
  final void Function(String prefix, String suffix) onInsertMarkdown;
  final void Function(String prefix) onInsertAtLineStart;
  final void Function(String text) onInsertText;

  const _EditorToolbar({
    required this.onInsertMarkdown,
    required this.onInsertAtLineStart,
    required this.onInsertText,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        border: Border(top: BorderSide(color: Theme.of(context).dividerColor)),
      ),
      child: SafeArea(
        top: false,
        child: SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          padding: const EdgeInsets.symmetric(horizontal: 8),
          child: Row(
            children: [
              _ToolbarButton(
                icon: Icons.format_bold,
                onTap: () => onInsertMarkdown('**', '**'),
              ),
              _ToolbarButton(
                icon: Icons.format_italic,
                onTap: () => onInsertMarkdown('*', '*'),
              ),
              _ToolbarButton(
                icon: Icons.format_strikethrough,
                onTap: () => onInsertMarkdown('~~', '~~'),
              ),
              const VerticalDivider(width: 1),
              _ToolbarButton(
                icon: Icons.format_list_bulleted,
                onTap: () => onInsertAtLineStart('- '),
              ),
              _ToolbarButton(
                icon: Icons.format_list_numbered,
                onTap: () => onInsertAtLineStart('1. '),
              ),
              _ToolbarButton(
                icon: Icons.check_box,
                onTap: () => onInsertAtLineStart('- [ ] '),
              ),
              const VerticalDivider(width: 1),
              _ToolbarButton(
                icon: Icons.title,
                onTap: () => onInsertAtLineStart('# '),
              ),
              _ToolbarButton(
                icon: Icons.format_quote,
                onTap: () => onInsertAtLineStart('> '),
              ),
              _ToolbarButton(
                icon: Icons.code,
                onTap: () => onInsertMarkdown('```\n', '\n```'),
              ),
              _ToolbarButton(
                icon: Icons.link,
                onTap: () => onInsertMarkdown('[', '](url)'),
              ),
              _ToolbarButton(
                icon: Icons.image,
                onTap: () => onInsertMarkdown('![alt](', ')'),
              ),
              const VerticalDivider(width: 1),
              _ToolbarButton(
                icon: Icons.horizontal_rule,
                onTap: () => onInsertText('\n---\n'),
              ),
              _ToolbarButton(
                icon: Icons.table_chart,
                onTap: () => onInsertText(
                  '\n| 列1 | 列2 |\n|-----|-----|\n|     |     |\n',
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _ToolbarButton extends StatelessWidget {
  final IconData icon;
  final VoidCallback onTap;

  const _ToolbarButton({required this.icon, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
        child: Icon(
          icon,
          size: 20,
          color: Theme.of(context).colorScheme.onSurfaceVariant,
        ),
      ),
    );
  }
}
