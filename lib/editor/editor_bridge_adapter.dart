import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';

abstract class EditorBridgeAdapter {
  TextEditingController get textController;
  ValueListenable<TextEditingValue> get listenable;
  bool get isSyncing;

  void setDocumentContent(String value);
  void insertMarkdown(String prefix, String suffix);
  void insertAtLineStart(String prefix);
  void insertText(String value);
  void dispose();
}
