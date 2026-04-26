import 'dart:js_interop';
import 'dart:js_util' as js_util;
import 'package:mindflow_domain/mindflow_domain.dart';
import 'package:web/web.dart' as web;

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
      final name = js_util.getProperty<String>(_handle, 'name'.toJS);
      return WorkspaceDescriptor(
        name: name,
        rootPath: name,
        isExternal: true,
      );
    } catch (_) {
      return null;
    }
  }

  @override
  Future<List<WorkspaceEntry>> scanWorkspace(String rootPath) async {
    if (_handle == null) return [];
    // 简化实现
    return [];
  }

  @override
  Future<String> readFile(String path) async {
    if (_handle == null) throw Exception('No workspace selected');

    try {
      final getFileHandle = js_util.getProperty<JSFunction>(_handle, 'getFileHandle'.toJS);
      final fileHandle = await js_util.callMethod<JSPromise>(
          getFileHandle, 'call'.toJS, [_handle, path.toJS]).toDart;

      final getFile = js_util.getProperty<JSFunction>(fileHandle, 'getFile'.toJS);
      final file = await js_util.callMethod<JSPromise>(
          getFile, 'call'.toJS, [fileHandle]).toDart;

      final arrayBuffer = js_util.getProperty<JSFunction>(file, 'arrayBuffer'.toJS);
      final buffer = await js_util.callMethod<JSPromise>(
          arrayBuffer, 'call'.toJS, [file]).toDart;

      final bytes = (buffer as JSArrayBuffer).toDart;
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
      final createFile = js_util.getProperty<JSFunction>(_handle, 'createFile'.toJS);
      final fileHandle = await js_util.callMethod<JSPromise>(
          createFile, 'call'.toJS, [_handle, path.toJS]).toDart;

      final createWritable = js_util.getProperty<JSFunction>(fileHandle, 'createWritable'.toJS);
      final writable = await js_util.callMethod<JSPromise>(
          createWritable, 'call'.toJS, [fileHandle]).toDart;

      final write = js_util.getProperty<JSFunction>(writable, 'write'.toJS);
      await js_util.callMethod<JSPromise>(
          write, 'call'.toJS, [writable, content.toJS]).toDart;

      final close = js_util.getProperty<JSFunction>(writable, 'close'.toJS);
      await js_util.callMethod(close, 'call'.toJS, [writable]).toDart;
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
    final getDirectoryHandle = js_util.getProperty<JSFunction>(
        _handle, 'getDirectoryHandle'.toJS);
    await js_util.callMethod<JSPromise>(
        getDirectoryHandle, 'call'.toJS, [_handle, name.toJS]).toDart;
  }

  @override
  Future<void> deleteNode(String path) async {
    if (_handle == null) return;
    final removeEntry = js_util.getProperty<JSFunction>(
        _handle, 'removeEntry'.toJS);
    await js_util.callMethod<JSPromise>(
        removeEntry, 'call'.toJS, [_handle, path.toJS]).toDart;
  }

  @override
  Future<String> moveNode(String sourcePath, String? targetParentPath) async {
    final content = await readFile(sourcePath);
    final targetPath = targetParentPath ?? sourcePath;
    await writeFile(targetPath, content);
    await deleteNode(sourcePath);
    return targetPath;
  }
}

WorkspaceFileSystem createWorkspaceFileSystemImpl() => WebWorkspaceFileSystem();