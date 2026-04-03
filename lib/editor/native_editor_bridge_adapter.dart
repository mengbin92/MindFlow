import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';

import 'editor_bridge_adapter.dart';

class NativeEditorBridgeAdapter implements EditorBridgeAdapter {
  final TextEditingController _textController;
  bool _syncing = false;

  NativeEditorBridgeAdapter({
    String initialContent = '',
  }) : _textController = TextEditingController(text: initialContent);

  @override
  TextEditingController get textController => _textController;

  @override
  ValueListenable<TextEditingValue> get listenable => _textController;

  @override
  bool get isSyncing => _syncing;

  @override
  void setDocumentContent(String value) {
    _syncing = true;
    _textController.value = TextEditingValue(
      text: value,
      selection: TextSelection.collapsed(offset: value.length),
    );
    _syncing = false;
  }

  @override
  void insertMarkdown(String prefix, String suffix) {
    final text = _textController.text;
    final selection = _textController.selection;
    final selectedText = selection.textInside(text);

    final newText = text.replaceRange(
      selection.start,
      selection.end,
      '$prefix$selectedText$suffix',
    );

    _textController.value = TextEditingValue(
      text: newText,
      selection: TextSelection.collapsed(
        offset: selection.start + prefix.length + selectedText.length,
      ),
    );
  }

  @override
  void insertAtLineStart(String prefix) {
    final text = _textController.text;
    final selection = _textController.selection;
    final lineStart = text.lastIndexOf('\n', selection.start - 1) + 1;

    final newText = text.replaceRange(lineStart, lineStart, prefix);

    _textController.value = TextEditingValue(
      text: newText,
      selection: TextSelection.collapsed(
        offset: selection.start + prefix.length,
      ),
    );
  }

  @override
  void insertText(String value) {
    final selection = _textController.selection;
    final currentText = _textController.text;

    final newText = currentText.replaceRange(
      selection.start,
      selection.end,
      value,
    );

    _textController.value = TextEditingValue(
      text: newText,
      selection:
          TextSelection.collapsed(offset: selection.start + value.length),
    );
  }

  @override
  void dispose() {
    _textController.dispose();
  }
}
