import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_markdown/flutter_markdown.dart';
import 'package:share_plus/share_plus.dart';
import '../../blocs/file/file_bloc.dart';
import '../../models/document.dart';

class EditorScreen extends StatefulWidget {
  final Document document;

  const EditorScreen({
    super.key,
    required this.document,
  });

  @override
  State<EditorScreen> createState() => _EditorScreenState();
}

class _EditorScreenState extends State<EditorScreen>
    with SingleTickerProviderStateMixin {
  late TextEditingController _titleController;
  late TextEditingController _contentController;
  late TabController _tabController;
  bool _hasChanges = false;

  @override
  void initState() {
    super.initState();
    _titleController = TextEditingController(text: widget.document.title);
    _contentController = TextEditingController(text: widget.document.content);
    _tabController = TabController(length: 2, vsync: this);

    _contentController.addListener(_onContentChanged);
    _titleController.addListener(_onContentChanged);

    // 设置当前文档
    context.read<FileBloc>().add(FileSelected(widget.document));
  }

  @override
  void dispose() {
    _titleController.dispose();
    _contentController.dispose();
    _tabController.dispose();
    super.dispose();
  }

  void _onContentChanged() {
    if (!_hasChanges) {
      setState(() => _hasChanges = true);
    }
  }

  void _saveDocument() {
    final updatedDoc = widget.document.copyWith(
      title: _titleController.text.trim().isEmpty
          ? '未命名文档'
          : _titleController.text.trim(),
      content: _contentController.text,
    );
    context.read<FileBloc>().add(FileUpdated(updatedDoc));
    setState(() => _hasChanges = false);

    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('已保存'),
        duration: Duration(seconds: 1),
      ),
    );
  }

  void _shareDocument() {
    Share.share(
      _contentController.text,
      subject: _titleController.text,
    );
  }

  @override
  Widget build(BuildContext context) {
    return PopScope(
      canPop: !_hasChanges,
      onPopInvoked: (didPop) async {
        if (!didPop && _hasChanges) {
          final result = await showDialog<bool>(
            context: context,
            builder: (context) => AlertDialog(
              title: const Text('未保存的更改'),
              content: const Text('是否保存更改？'),
              actions: [
                TextButton(
                  onPressed: () {
                    Navigator.pop(context);
                    Navigator.pop(context);
                  },
                  child: const Text('不保存'),
                ),
                TextButton(
                  onPressed: () => Navigator.pop(context),
                  child: const Text('取消'),
                ),
                FilledButton(
                  onPressed: () {
                    _saveDocument();
                    Navigator.pop(context);
                    Navigator.pop(context);
                  },
                  child: const Text('保存'),
                ),
              ],
            ),
          );
        }
      },
      child: Scaffold(
        appBar: AppBar(
          title: TextField(
            controller: _titleController,
            decoration: const InputDecoration(
              border: InputBorder.none,
              hintText: '文档标题',
              contentPadding: EdgeInsets.zero,
            ),
            style: const TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w500,
            ),
          ),
          actions: [
            if (_hasChanges)
              Padding(
                padding: const EdgeInsets.only(right: 8.0),
                child: Chip(
                  label: const Text('未保存'),
                  backgroundColor: Color.fromRGBO(255, 165, 0, 0.2),
                  side: BorderSide.none,
                ),
              ),
            IconButton(
              icon: const Icon(Icons.share),
              onPressed: _shareDocument,
            ),
            IconButton(
              icon: const Icon(Icons.save),
              onPressed: _saveDocument,
            ),
            const SizedBox(width: 8),
          ],
          bottom: TabBar(
            controller: _tabController,
            onTap: (index) {
              if (index == 1) {
                // 切换到预览时隐藏键盘
                FocusScope.of(context).unfocus();
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
            // 编辑模式
            _EditorView(controller: _contentController),
            // 预览模式
            _PreviewView(content: _contentController.text),
          ],
        ),
        bottomNavigationBar: _buildBottomToolbar(),
      ),
    );
  }

  Widget _buildBottomToolbar() {
    return Container(
      decoration: BoxDecoration(
        border: Border(
          top: BorderSide(
            color: Theme.of(context).dividerColor,
          ),
        ),
      ),
      child: SafeArea(
        child: SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          child: Row(
            children: [
              _ToolbarButton(
                icon: Icons.format_bold,
                onTap: () => _insertMarkdown('**', '**'),
              ),
              _ToolbarButton(
                icon: Icons.format_italic,
                onTap: () => _insertMarkdown('*', '*'),
              ),
              _ToolbarButton(
                icon: Icons.format_strikethrough,
                onTap: () => _insertMarkdown('~~', '~~'),
              ),
              const VerticalDivider(width: 1),
              _ToolbarButton(
                icon: Icons.format_list_bulleted,
                onTap: () => _insertAtLineStart('- '),
              ),
              _ToolbarButton(
                icon: Icons.format_list_numbered,
                onTap: () => _insertAtLineStart('1. '),
              ),
              _ToolbarButton(
                icon: Icons.check_box,
                onTap: () => _insertAtLineStart('- [ ] '),
              ),
              const VerticalDivider(width: 1),
              _ToolbarButton(
                icon: Icons.title,
                onTap: () => _insertAtLineStart('# '),
              ),
              _ToolbarButton(
                icon: Icons.format_quote,
                onTap: () => _insertAtLineStart('> '),
              ),
              _ToolbarButton(
                icon: Icons.code,
                onTap: () => _insertMarkdown('```\n', '\n```'),
              ),
              _ToolbarButton(
                icon: Icons.link,
                onTap: () => _insertMarkdown('[', '](url)'),
              ),
              _ToolbarButton(
                icon: Icons.image,
                onTap: () => _insertMarkdown('![alt](', ')'),
              ),
              const VerticalDivider(width: 1),
              _ToolbarButton(
                icon: Icons.horizontal_rule,
                onTap: () => _insertText('\n---\n'),
              ),
              _ToolbarButton(
                icon: Icons.table_chart,
                onTap: () => _insertText('\n| 列1 | 列2 |\n|-----|-----|\n|     |     |\n'),
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _insertMarkdown(String prefix, String suffix) {
    final text = _contentController.text;
    final selection = _contentController.selection;
    final selectedText = selection.textInside(text);

    final newText = text.replaceRange(
      selection.start,
      selection.end,
      '$prefix$selectedText$suffix',
    );

    _contentController.value = TextEditingValue(
      text: newText,
      selection: TextSelection.collapsed(
        offset: selection.start + prefix.length + selectedText.length,
      ),
    );
  }

  void _insertAtLineStart(String prefix) {
    final text = _contentController.text;
    final selection = _contentController.selection;
    final lineStart = text.lastIndexOf('\n', selection.start - 1) + 1;

    final newText = text.replaceRange(lineStart, lineStart, prefix);

    _contentController.value = TextEditingValue(
      text: newText,
      selection: TextSelection.collapsed(
        offset: selection.start + prefix.length,
      ),
    );
  }

  void _insertText(String text) {
    final selection = _contentController.selection;
    final currentText = _contentController.text;

    final newText = currentText.replaceRange(
      selection.start,
      selection.end,
      text,
    );

    _contentController.value = TextEditingValue(
      text: newText,
      selection: TextSelection.collapsed(
        offset: selection.start + text.length,
      ),
    );
  }
}

class _EditorView extends StatelessWidget {
  final TextEditingController controller;

  const _EditorView({required this.controller});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(16.0),
      child: TextField(
        controller: controller,
        maxLines: null,
        expands: true,
        textAlignVertical: TextAlignVertical.top,
        decoration: const InputDecoration(
          border: InputBorder.none,
          hintText: '开始写作...',
          contentPadding: EdgeInsets.zero,
        ),
        style: const TextStyle(
          fontSize: 16,
          height: 1.6,
        ),
      ),
    );
  }
}

class _PreviewView extends StatelessWidget {
  final String content;

  const _PreviewView({required this.content});

  @override
  Widget build(BuildContext context) {
    return Markdown(
      data: content.isEmpty ? '无内容' : content,
      padding: const EdgeInsets.all(16.0),
      selectable: true,
      styleSheet: MarkdownStyleSheet.fromTheme(Theme.of(context)).copyWith(
        p: const TextStyle(fontSize: 16, height: 1.6),
        h1: const TextStyle(fontSize: 28, fontWeight: FontWeight.bold),
        h2: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
        h3: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
        code: TextStyle(
          fontFamily: 'FiraCode',
          backgroundColor: Theme.of(context).colorScheme.surfaceContainerHighest,
        ),
        codeblockDecoration: BoxDecoration(
          color: Theme.of(context).colorScheme.surfaceContainerHighest,
          borderRadius: BorderRadius.circular(8),
        ),
      ),
    );
  }
}

class _ToolbarButton extends StatelessWidget {
  final IconData icon;
  final VoidCallback onTap;

  const _ToolbarButton({
    required this.icon,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      child: Container(
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
