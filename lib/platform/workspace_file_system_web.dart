import 'dart:js_interop';
import 'dart:js_util' as js_util;
import 'package:web/web.dart' as web;

import '../domain/models/workspace_descriptor.dart';
import 'workspace_file_system.dart';

class WebWorkspaceFileSystem implements WorkspaceFileSystem {
  dynamic _handle;
  bool _isIframe = false;

  WebWorkspaceFileSystem() {
    _isIframe = _detectIframe();
  }

  bool _detectIframe() {
    try {
      final w = js_util.globalThis;
      final loc = js_util.getProperty<JSObject>(w, 'location'.toJS);
      final parent = js_util.getProperty(w, 'parent'.toJS) as JSObject?;
      if (parent == null) return false;
      final parentLoc = js_util.getProperty<JSObject>(parent, 'location'.toJS);
      return js_util.getProperty<String>(loc, 'origin'.toJS) !=
          js_util.getProperty<String>(parentLoc, 'origin'.toJS);
    } catch (_) {
      return true;
    }
  }

  bool _supportsFileSystemAccess() {
    try {
      final w = js_util.globalThis;
      return js_util.getProperty(w, 'showDirectoryPicker'.toJS) != null;
    } catch (_) {
      return false;
    }
  }

  @override
  Future<WorkspaceDescriptor?> pickWorkspace() async {
    if (_isIframe || !_supportsFileSystemAccess()) return null;

    try {
      final fn = js_util.getProperty<JSFunction>(
          js_util.globalThis, 'showDirectoryPicker'.toJS);
      final result = await js_util.callMethod<JSPromise>(
          fn, 'call'.toJS, [js_util.globalThis]).toDart;

      _handle = result;
      return WorkspaceDescriptor(
        name: _handle!.name,
        rootPath: _handle!.name,
        isExternal: true,
      );
    } catch (_) {
      return null;
    }
  }

  @override
  Future<List<WorkspaceEntry>> scanWorkspace(String rootPath) async {
    if (_handle == null) return [];
    // 简化实现：返回空列表，实际需要使用 JS interop 遍历
    return [];
  }

  @override
  Future<String> readFile(String path) async {
    if (_handle == null) throw Exception('No workspace selected');

    try {
      final fileHandle = await (await _handle!.getFileHandle(path.toJS).toDart).toDart;
      final file = await (fileHandle as dynamic).getFile().toDart;
      final buffer = await (file as dynamic).arrayBuffer().toDart;
      final bytes = (buffer as JSArrayBuffer).toDart;

      // 转换 Uint8List 为 String
      final view = bytes.asUint8List();
      return String.fromCharCodes(view);
    } catch (e) {
      throw Exception('Failed to read file: $e');
    }
  }

  @override
  Future<void> writeFile(String path, String content) async {
    if (_handle == null) throw Exception('No workspace selected');

    try {
      final fileHandle = await _handle!.createFile(path.toJS).toDart;
      final writable = await (fileHandle as dynamic).createWritable().toDart;
      await (writable as dynamic).write(content.toJS).toDart;
      await (writable as dynamic).close().toDart;
    } catch (e) {
      throw Exception('Failed to write file: $e');
    }
  }

  @override
  Future<void> createFile(
      String parentPath, String name, String content) async {
    final fileName = name.endsWith('.md') ? name : '$name.md';
    await writeFile(fileName, content);
  }

  @override
  Future<void> createFolder(String parentPath, String name) async {
    if (_handle == null) return;
    await _handle!.getDirectoryHandle(name.toJS).toDart;
  }

  @override
  Future<void> deleteNode(String path) async {
    if (_handle == null) return;
    await _handle!.removeEntry(path.toJS).toDart;
  }

  @override
  Future<String> moveNode(String sourcePath, String? targetParentPath) async {
    // 简化实现：复制然后删除
    final content = await readFile(sourcePath);
    final targetPath = targetParentPath ?? sourcePath;
    await writeFile(targetPath, content);
    await deleteNode(sourcePath);
    return targetPath;
  }
}

WorkspaceFileSystem createWorkspaceFileSystemImpl() => WebWorkspaceFileSystem();