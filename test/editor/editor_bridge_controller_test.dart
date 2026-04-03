import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mindflow/editor/editor_bridge_controller.dart';

void main() {
  group('EditorBridgeController', () {
    test('inserts markdown around current selection', () {
      final controller = EditorBridgeController(initialContent: 'hello');
      controller.textController.selection = const TextSelection(
        baseOffset: 0,
        extentOffset: 5,
      );

      controller.insertMarkdown('**', '**');

      expect(controller.text, '**hello**');
      controller.dispose();
    });

    test('inserts prefix at current line start', () {
      final controller = EditorBridgeController(initialContent: 'a\nitem');
      controller.textController.selection = const TextSelection.collapsed(
        offset: 3,
      );

      controller.insertAtLineStart('- ');

      expect(controller.text, 'a\n- item');
      controller.dispose();
    });
  });
}
