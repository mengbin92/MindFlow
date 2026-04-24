import 'dart:async';
import 'editor_bridge_controller.dart';

class NativeEditorBridgeAdapter implements EditorBridgeController {
  NativeEditorBridgeAdapter({required this.viewId});

  final int viewId;
  final _contentController = StreamController<ContentChangedEvent>.broadcast();
  final _cursorController = StreamController<CursorPosition>.broadcast();
  final _shortcutController = StreamController<ShortcutEvent>.broadcast();
  final _stateController = StreamController<EditorState>.broadcast();

  EditorState _currentState = const EditorState();
  bool _isDisposed = false;

  @override
  Stream<ContentChangedEvent> get onContentChanged => _contentController.stream;

  @override
  Stream<CursorPosition> get onCursorChanged => _cursorController.stream;

  @override
  Stream<ShortcutEvent> get onShortcut => _shortcutController.stream;

  @override
  Stream<EditorState> get onStateChanged => _stateController.stream;

  @override
  EditorState get currentState => _currentState;

  @override
  bool get isReady => !_isDisposed;

  @override
  Future<void> initialize() async {
    // 初始化 WebView
  }

  @override
  Future<void> dispose() async {
    if (_isDisposed) return;
    _isDisposed = true;

    await _contentController.close();
    await _cursorController.close();
    await _shortcutController.close();
    await _stateController.close();
  }

  @override
  Future<void> setContent(String markdown) async {
    _updateState(_currentState.copyWith(content: markdown));
  }

  @override
  Future<String> getContent() async {
    return _currentState.content;
  }

  @override
  Future<CursorPosition> getCursorPosition() async {
    return _currentState.cursor ?? const CursorPosition(line: 0, column: 0, offset: 0);
  }

  @override
  Future<void> setCursorPosition(int line, int column) async {
    // 通过 WebView JS 调用设置
  }

  @override
  Future<void> setSelection(int start, int end) async {
    // 通过 WebView JS 调用设置
  }

  @override
  Future<void> insertText(String text) async {
    // 通过 WebView JS 调用插入
  }

  @override
  Future<void> replaceText(int start, int end, String replacement) async {
    // 通过 WebView JS 调用替换
  }

  @override
  Future<void> executeCommand(EditorCommand command) async {
    final commandMap = {
      EditorCommand.bold: 'toggleBold',
      EditorCommand.italic: 'toggleItalic',
      EditorCommand.strikethrough: 'toggleStrikethrough',
      EditorCommand.code: 'toggleCode',
      EditorCommand.link: 'insertLink',
      EditorCommand.heading1: 'toggleHeading1',
      EditorCommand.heading2: 'toggleHeading2',
      EditorCommand.heading3: 'toggleHeading3',
      EditorCommand.bulletList: 'toggleBulletList',
      EditorCommand.numberedList: 'toggleNumberedList',
      EditorCommand.blockquote: 'toggleBlockquote',
      EditorCommand.codeBlock: 'toggleCodeBlock',
      EditorCommand.horizontalRule: 'insertHorizontalRule',
    };
    await executeCustomCommand(commandMap[command] ?? '');
  }

  @override
  Future<void> executeCustomCommand(String command, [Map<String, dynamic>? args]) async {
    // 通过 WebView JS 调用
  }

  void _updateState(EditorState newState) {
    _currentState = newState;
    if (!_isDisposed) {
      _stateController.add(newState);
    }
  }

  void onContentChanged(String content) {
    if (_isDisposed) return;
    _updateState(_currentState.copyWith(content: content, isModified: true));
    _contentController.add(ContentChangedEvent(content: content));
  }

  void onCursorChanged(int line, int column, int offset) {
    if (_isDisposed) return;
    final cursor = CursorPosition(line: line, column: column, offset: offset);
    _updateState(_currentState.copyWith(cursor: cursor));
    _cursorController.add(cursor);
  }

  void onShortcut(String action, {bool ctrlKey = false, bool shiftKey = false, bool altKey = false}) {
    if (_isDisposed) return;
    _shortcutController.add(ShortcutEvent(
      action: action,
      ctrlKey: ctrlKey,
      shiftKey: shiftKey,
      altKey: altKey,
    ));
  }

  void onFocusChanged(bool isFocused) {
    if (_isDisposed) return;
    _updateState(_currentState.copyWith(isFocused: isFocused));
  }
}
