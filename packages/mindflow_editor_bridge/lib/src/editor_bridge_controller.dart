import 'dart:async';
import 'package:equatable/equatable.dart';

// 游标位置
class CursorPosition extends Equatable {
  final int line;
  final int column;
  final int offset;

  const CursorPosition({
    required this.line,
    required this.column,
    required this.offset,
  });

  @override
  List<Object?> get props => [line, column, offset];

  CursorPosition copyWith({
    int? line,
    int? column,
    int? offset,
  }) {
    return CursorPosition(
      line: line ?? this.line,
      column: column ?? this.column,
      offset: offset ?? this.offset,
    );
  }
}

// 编辑器命令
enum EditorCommand {
  bold,
  italic,
  strikethrough,
  code,
  link,
  heading1,
  heading2,
  heading3,
  bulletList,
  numberedList,
  blockquote,
  codeBlock,
  horizontalRule,
}

// 编辑事件
class ContentChangedEvent {
  final String content;
  final CursorPosition? cursor;
  final DateTime timestamp;

  ContentChangedEvent({
    required this.content,
    this.cursor,
    DateTime? timestamp,
  }) : timestamp = timestamp ?? DateTime.now();

  ContentChangedEvent copyWith({
    String? content,
    CursorPosition? cursor,
    DateTime? timestamp,
  }) {
    return ContentChangedEvent(
      content: content ?? this.content,
      cursor: cursor ?? this.cursor,
      timestamp: timestamp ?? this.timestamp,
    );
  }
}

// 快捷键事件
class ShortcutEvent {
  final String action;
  final bool ctrlKey;
  final bool shiftKey;
  final bool altKey;

  ShortcutEvent({
    required this.action,
    this.ctrlKey = false,
    this.shiftKey = false,
    this.altKey = false,
  });

  ShortcutEvent copyWith({
    String? action,
    bool? ctrlKey,
    bool? shiftKey,
    bool? altKey,
  }) {
    return ShortcutEvent(
      action: action ?? this.action,
      ctrlKey: ctrlKey ?? this.ctrlKey,
      shiftKey: shiftKey ?? this.shiftKey,
      altKey: altKey ?? this.altKey,
    );
  }
}

// 编辑器状态
class EditorState extends Equatable {
  final String content;
  final bool isModified;
  final bool isFocused;
  final CursorPosition? cursor;

  const EditorState({
    this.content = '',
    this.isModified = false,
    this.isFocused = false,
    this.cursor,
  });

  @override
  List<Object?> get props => [content, isModified, isFocused, cursor];

  EditorState copyWith({
    String? content,
    bool? isModified,
    bool? isFocused,
    CursorPosition? cursor,
  }) {
    return EditorState(
      content: content ?? this.content,
      isModified: isModified ?? this.isModified,
      isFocused: isFocused ?? this.isFocused,
      cursor: cursor ?? this.cursor,
    );
  }
}

abstract class EditorBridgeController {
  // 内容操作
  Future<void> setContent(String markdown);
  Future<String> getContent();

  // 游标操作
  Future<CursorPosition> getCursorPosition();
  Future<void> setCursorPosition(int line, int column);
  Future<void> setSelection(int start, int end);

  // 文本操作
  Future<void> insertText(String text);
  Future<void> replaceText(int start, int end, String replacement);

  // 命令执行
  Future<void> executeCommand(EditorCommand command);
  Future<void> executeCustomCommand(String command, [Map<String, dynamic>? args]);

  // 监听流
  Stream<ContentChangedEvent> get onContentChanged;
  Stream<CursorPosition> get onCursorChanged;
  Stream<ShortcutEvent> get onShortcut;
  Stream<EditorState> get onStateChanged;

  // 编辑器状态
  EditorState get currentState;
  bool get isReady;

  // 生命周期
  Future<void> initialize();
  Future<void> dispose();
}