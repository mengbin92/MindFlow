import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';

import 'editor_bridge_adapter.dart';
import 'native_editor_bridge_adapter.dart';

enum EditorBridgeStatus { nativeFallback, bridgeReady }

class EditorBridgeController extends ChangeNotifier {
  EditorBridgeController({
    String initialContent = '',
    this.status = EditorBridgeStatus.nativeFallback,
    EditorBridgeAdapter? adapter,
  }) : _adapter = adapter ??
            NativeEditorBridgeAdapter(initialContent: initialContent);

  final EditorBridgeAdapter _adapter;
  final EditorBridgeStatus status;

  TextEditingController get textController => _adapter.textController;

  String get text => _adapter.textController.text;

  ValueListenable<TextEditingValue> get listenable => _adapter.listenable;

  void setDocumentContent(String value) {
    _adapter.setDocumentContent(value);
    notifyListeners();
  }

  bool get isSyncing => _adapter.isSyncing;

  void insertMarkdown(String prefix, String suffix) {
    _adapter.insertMarkdown(prefix, suffix);
    notifyListeners();
  }

  void insertAtLineStart(String prefix) {
    _adapter.insertAtLineStart(prefix);
    notifyListeners();
  }

  void insertText(String value) {
    _adapter.insertText(value);
    notifyListeners();
  }

  @override
  void dispose() {
    _adapter.dispose();
    super.dispose();
  }
}
