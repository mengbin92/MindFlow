import 'dart:async';
import 'dart:js_interop';
import 'package:web/web.dart' as web;
import '../editor_bridge_controller.dart';

class CodeMirrorEditorBridge implements EditorBridgeController {
  CodeMirrorEditorBridge({required this.containerId});

  final String containerId;
  final _contentController = StreamController<ContentChangedEvent>.broadcast();
  final _cursorController = StreamController<CursorPosition>.broadcast();
  final _shortcutController = StreamController<ShortcutEvent>.broadcast();
  final _stateController = StreamController<EditorState>.broadcast();

  EditorState _currentState = const EditorState();
  bool _isReady = false;

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
  bool get isReady => _isReady;

  @override
  Future<void> initialize() async {
    await _initCodeMirror();
  }

  Future<void> _initCodeMirror() async {
    await _loadCodeMirrorScript();
    _setupEditor();
    _isReady = true;
  }

  Future<void> _loadCodeMirrorScript() async {
    final scripts = [
      'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/codemirror.min.js',
      'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/mode/markdown/markdown.min.js',
      'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/keymap/emacs.min.js',
    ];
    final styles = [
      'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/codemirror.min.css',
    ];

    for (final url in scripts) {
      await _loadScript(url);
    }
    for (final url in styles) {
      _loadStyle(url);
    }
  }

  Future<void> _loadScript(String url) async {
    final existing = web.document.querySelector('script[src="$url"]');
    if (existing != null) return;

    final script = web.document.createElement('script') as web.HTMLScriptElement;
    script.src = url;
    script.async = true;
    web.document.head.appendChild(script);

    await script.onLoad.first;
  }

  void _loadStyle(String url) {
    if (web.document.querySelector('link[href="$url"]') != null) return;
    final link = web.document.createElement('link') as web.HTMLLinkElement;
    link.rel = 'stylesheet';
    link.href = url;
    web.document.head.appendChild(link);
  }

  void _setupEditor() {
    web.window.eval('''
      var containerId = '$containerId';
      var container = document.getElementById(containerId);
      if (container && !container.codemirror) {
        container.codemirror = CodeMirror(function(elt) {
          container.parentNode.replaceChild(elt, container);
        }, {
          value: '',
          mode: 'markdown',
          keyMap: 'emacs',
          lineNumbers: false,
          lineWrapping: true,
          autofocus: true,
          placeholder: '开始写作...'
        });

        container.codemirror.on('change', function(cm) {
          var event = new CustomEvent('codemirror-change', {
            detail: { content: cm.getValue() }
          });
          container.dispatchEvent(event);
        });

        container.codemirror.on('cursorActivity', function(cm) {
          var cursor = cm.getCursor();
          var event = new CustomEvent('codemirror-cursor', {
            detail: {
              line: cursor.line,
              ch: cursor.ch,
              offset: cm.indexFromPos(cursor)
            }
          });
          container.dispatchEvent(event);
        });

        container.codemirror.setOption('extraKeys', {
          'Ctrl-B': function() { fireShortcut('bold', true, false, false); },
          'Ctrl-I': function() { fireShortcut('italic', true, false, false); },
          'Ctrl-K': function() { fireShortcut('code', true, false, false); },
        });
      }

      function fireShortcut(action, ctrl, shift, alt) {
        var event = new CustomEvent('codemirror-shortcut', {
          detail: { action: action, ctrl: ctrl, shift: shift, alt: alt }
        });
        container.dispatchEvent(event);
      }

      window._codemirrorCallbacks = {
        onContentChanged: function(content) {
          window.dispatchEvent(new MessageEvent('cm-content-changed', { data: { content: content } }));
        },
        onCursorChanged: function(line, ch, offset) {
          window.dispatchEvent(new MessageEvent('cm-cursor-changed', { data: { line: line, ch: ch, offset: offset } }));
        },
        onShortcut: function(action, ctrl, shift, alt) {
          window.dispatchEvent(new MessageEvent('cm-shortcut', { data: { action: action, ctrl: ctrl, shift: shift, alt: alt } }));
        }
      };
    '''.toJS);

    _setupEventListeners();
  }

  void _setupEventListeners() {
    web.window.addEventListener('message'.toJS, (web.Event event) {
      final msgEvent = event as web.MessageEvent;
      final data = msgEvent.data;
      if (data == null) return;

      final action = msgEvent.type;
      if (action == 'cm-content-changed') {
        final content = (data as JSObject)['content'];
        if (content != null) {
          onContentChanged((content as JSString).toDart);
        }
      } else if (action == 'cm-cursor-changed') {
        final d = data as JSObject;
        final line = (d['line'] as num).toInt();
        final ch = (d['ch'] as num).toInt();
        final offset = (d['offset'] as num).toInt();
        onCursorChanged(line, ch, offset);
      } else if (action == 'cm-shortcut') {
        final d = data as JSObject;
        final shortcut = ShortcutEvent(
          action: (d['action'] as JSString).toDart,
          ctrlKey: (d['ctrl'] as JSBoolean).toDart,
          shiftKey: (d['shift'] as JSBoolean).toDart,
          altKey: (d['alt'] as JSBoolean).toDart,
        );
        _shortcutController.add(shortcut);
      }
    }.toJS);

    web.window.eval('''
      document.addEventListener('codemirror-change', function(e) {
        window._codemirrorCallbacks.onContentChanged(e.detail.content);
      });
      document.addEventListener('codemirror-cursor', function(e) {
        window._codemirrorCallbacks.onCursorChanged(e.detail.line, e.detail.ch, e.detail.offset);
      });
      document.addEventListener('codemirror-shortcut', function(e) {
        window._codemirrorCallbacks.onShortcut(e.detail.action, e.detail.ctrl, e.detail.shift, e.detail.alt);
      });
    '''.toJS);
  }

  void onContentChanged(String content) {
    _currentState = _currentState.copyWith(content: content, isModified: true);
    _contentController.add(ContentChangedEvent(content: content));
    _stateController.add(_currentState);
  }

  void onCursorChanged(int line, int ch, int offset) {
    final cursor = CursorPosition(line: line, column: ch, offset: offset);
    _currentState = _currentState.copyWith(cursor: cursor);
    _cursorController.add(cursor);
    _stateController.add(_currentState);
  }

  @override
  Future<void> setContent(String markdown) async {
    if (!_isReady) return;
    final escaped = markdown.replaceAll("'", "\\'").replaceAll('\n', '\\n');
    web.window.eval('''
      var container = document.getElementById('$containerId');
      if (container && container.codemirror) {
        container.codemirror.setValue('$escaped');
      }
    '''.toJS);
  }

  @override
  Future<String> getContent() async {
    if (!_isReady) return '';
    final result = await web.window.eval('''
      var container = document.getElementById('$containerId');
      return container && container.codemirror ? container.codemirror.getValue() : '';
    '''.toDart;
    return result.toString();
  }

  @override
  Future<CursorPosition> getCursorPosition() async {
    if (!_isReady) return const CursorPosition(line: 0, column: 0, offset: 0);
    final result = await web.window.eval('''
      var container = document.getElementById('$containerId');
      if (container && container.codemirror) {
        var cursor = container.codemirror.getCursor();
        return JSON.stringify({ line: cursor.line, column: cursor.ch });
      }
      return '{}';
    '''.toDart);
    // 简单解析
    final str = result.toString();
    final lineMatch = RegExp(r'"line":(\d+)').firstMatch(str);
    final colMatch = RegExp(r'"column":(\d+)').firstMatch(str);
    return CursorPosition(
      line: lineMatch != null ? int.parse(lineMatch.group(1)!) : 0,
      column: colMatch != null ? int.parse(colMatch.group(1)!) : 0,
      offset: 0,
    );
  }

  @override
  Future<void> setCursorPosition(int line, int column) async {
    if (!_isReady) return;
    web.window.eval('''
      var container = document.getElementById('$containerId');
      if (container && container.codemirror) {
        container.codemirror.setCursor({ line: $line, ch: $column });
      }
    '''.toJS);
  }

  @override
  Future<void> setSelection(int start, int end) async {
    if (!_isReady) return;
    web.window.eval('''
      var container = document.getElementById('$containerId');
      if (container && container.codemirror) {
        container.codemirror.setSelection(
          container.codemirror.posFromIndex($start),
          container.codemirror.posFromIndex($end)
        );
      }
    '''.toJS);
  }

  @override
  Future<void> insertText(String text) async {
    if (!_isReady) return;
    final escaped = text.replaceAll('\\', '\\\\').replaceAll("'", "\\'").replaceAll('\n', '\\n');
    web.window.eval('''
      var container = document.getElementById('$containerId');
      if (container && container.codemirror) {
        var cursor = container.codemirror.getCursor();
        container.codemirror.replaceRange('$escaped', cursor);
      }
    '''.toJS);
  }

  @override
  Future<void> replaceText(int start, int end, String replacement) async {
    if (!_isReady) return;
    final escaped = replacement.replaceAll('\\', '\\\\').replaceAll("'", "\\'");
    web.window.eval('''
      var container = document.getElementById('$containerId');
      if (container && container.codemirror) {
        container.codemirror.replaceRange(
          '$escaped',
          container.codemirror.posFromIndex($start),
          container.codemirror.posFromIndex($end)
        );
      }
    '''.toJS);
  }

  @override
  Future<void> executeCommand(EditorCommand command) async {
    final commandMap = {
      EditorCommand.bold: 'toggleBold',
      EditorCommand.italic: 'toggleItalic',
      EditorCommand.strikethrough: 'toggleStrikethrough',
      EditorCommand.code: 'toggleCode',
      EditorCommand.heading1: 'toggleHeading1',
      EditorCommand.heading2: 'toggleHeading2',
      EditorCommand.heading3: 'toggleHeading3',
      EditorCommand.bulletList: 'toggleBulletList',
      EditorCommand.numberedList: 'toggleNumberedList',
      EditorCommand.blockquote: 'toggleBlockquote',
      EditorCommand.codeBlock: 'toggleCodeBlock',
    };
    final cmd = commandMap[command];
    if (cmd != null) {
      web.window.eval('''
        var container = document.getElementById('$containerId');
        if (container && container.codemirror && container.codemirror.$cmd) {
          container.codemirror.$cmd();
        }
      '''.toJS);
    }
  }

  @override
  Future<void> executeCustomCommand(String command, [Map<String, dynamic>? args]) async {
    web.window.eval('''
      var container = document.getElementById('$containerId');
      if (container && container.codemirror) {
        container.codemirror.execCommand('$command');
      }
    '''.toJS);
  }

  @override
  Future<void> dispose() async {
    await _contentController.close();
    await _cursorController.close();
    await _shortcutController.close();
    await _stateController.close();
  }
}
