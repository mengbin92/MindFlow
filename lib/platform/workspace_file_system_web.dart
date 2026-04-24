import 'dart:js_interop';
import 'dart:js_util' as js_util;
import 'package:web/web.dart';

import '../domain/models/workspace_descriptor.dart';
import 'workspace_file_system.dart';

// ===========================================================================
// FileSystemAccess API — not in package:web, use JS interop
// ===========================================================================

@JS('window.showDirectoryPicker')
external JSPromise<JSObject> _showDirectoryPicker();

// ===========================================================================
// IndexedDB via dart:js_util
// ===========================================================================

Future<void> _idbPut(JSObject handle) async {
  try {
    final idb = js_util.getProperty<JSObject?>(
        js_util.globalThis, 'indexedDB'.toJS);
    if (idb == null) return;
    final open = js_util.getProperty<JSFunction>(idb, 'open'.toJS);
    final request = js_util.callMethod<JSPromise<JSObject>>(
        open, 'call'.toJS, [idb, 'mindflow_web'.toJS]);
    final db = await request.toDart;
    final tx = js_util.getProperty<JSFunction>(db, 'transaction'.toJS);
    final txn = js_util.callMethod<JSObject>(
        tx, 'call'.toJS, [db, 'handles'.toJS, 'readwrite'.toJS]);
    final store = js_util.getProperty<JSFunction>(txn, 'objectStore'.toJS);
    final put = js_util.getProperty<JSFunction>(store, 'put'.toJS);
    js_util.callMethod(put, 'call'.toJS, [store, handle, 'workspace_handle'.toJS]);
  } catch (_) {}
}

Future<JSObject?> _idbGet() async {
  try {
    final idb = js_util.getProperty<JSObject?>(
        js_util.globalThis, 'indexedDB'.toJS);
    if (idb == null) return null;
    final open = js_util.getProperty<JSFunction>(idb, 'open'.toJS);
    final request = js_util.callMethod<JSPromise<JSObject>>(
        open, 'call'.toJS, [idb, 'mindflow_web'.toJS]);
    final db = await request.toDart;
    final tx = js_util.getProperty<JSFunction>(db, 'transaction'.toJS);
    final txn = js_util.callMethod<JSObject>(
        tx, 'call'.toJS, [db, 'handles'.toJS, 'readonly'.toJS]);
    final store = js_util.getProperty<JSFunction>(txn, 'objectStore'.toJS);
    final get = js_util.getProperty<JSFunction>(store, 'get'.toJS);
    final result = js_util.callMethod<JSPromise<JSAny?>>(
        get, 'call'.toJS, [store, 'workspace_handle'.toJS]);
    final value = await result.toDart;
    return value as JSObject?;
  } catch (_) {
    return null;
  }
}

Future<void> _idbDelete() async {
  try {
    final idb = js_util.getProperty<JSObject?>(
        js_util.globalThis, 'indexedDB'.toJS);
    if (idb == null) return;
    final open = js_util.getProperty<JSFunction>(idb, 'open'.toJS);
    final request = js_util.callMethod<JSPromise<JSObject>>(
        open, 'call'.toJS, [idb, 'mindflow_web'.toJS]);
    final db = await request.toDart;
    final tx = js_util.getProperty<JSFunction>(db, 'transaction'.toJS);
    final txn = js_util.callMethod<JSObject>(
        tx, 'call'.toJS, [db, 'handles'.toJS, 'readwrite'.toJS]);
    final store = js_util.getProperty<JSFunction>(txn, 'objectStore'.toJS);
    final del = js_util.getProperty<JSFunction>(store, 'delete'.toJS);
    js_util.callMethod(del, 'call'.toJS, [store, 'workspace_handle'.toJS]);
  } catch (_) {}
}

// ===========================================================================
// Permission
// ===========================================================================

Future<bool> _checkPermission(JSObject handle) async {
  try {
    final fn = js_util.getProperty<JSFunction>(handle, 'queryPermission'.toJS);
    final result = await js_util.callMethod<JSPromise<JSString>>(
        fn, 'call'.toJS, [handle]).toDart;
    return result.toDart == 'granted';
  } catch (_) {
    return false;
  }
}

Future<bool> _requestPermission(JSObject handle) async {
  try {
    final fn = js_util.getProperty<JSFunction>(handle, 'requestPermission'.toJS);
    final result = await js_util.callMethod<JSPromise<JSString>>(
        fn, 'call'.toJS, [handle]).toDart;
    return result.toDart == 'granted';
  } catch (_) {
    return false;
  }
}

// ===========================================================================
// Browser capability detection
// ===========================================================================

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

// ===========================================================================
// WebWorkspaceFileSystem
// ===========================================================================

class WebWorkspaceFileSystem implements WorkspaceFileSystem {
  FileSystemDirectoryHandle? _handle;
  final bool _isIframe;

  WebWorkspaceFileSystem() : _isIframe = _detectIframe();

  int get supportTier =>
      _isIframe ? 3 : (_supportsFileSystemAccess() ? 1 : 2);

  Future<void> restorePermission() async {
    final handle = await _idbGet();
    if (handle == null) return;
    _handle = handle as FileSystemDirectoryHandle;
    final granted = await _checkPermission(handle);
    if (!granted) {
      final reRequested = await _requestPermission(handle);
      if (!reRequested) {
        await _idbDelete();
        _handle = null;
      }
    }
  }

  @override
  Future<WorkspaceDescriptor?> pickWorkspace() async {
    if (supportTier == 3) return null;
    if (supportTier == 1) {
      try {
        final handleJS = await _showDirectoryPicker().toDart;
        _handle = handleJS as FileSystemDirectoryHandle;
        await _idbPut(handleJS);
        return WorkspaceDescriptor(
          name: _handle!.name,
          rootPath: _handle!.name,
          isExternal: true,
        );
      } catch (_) {
        return null;
      }
    }
    return null;
  }

  @override
  Future<List<WorkspaceEntry>> scanWorkspace(String rootPath) async {
    if (_handle == null) return [];
    final entries = <WorkspaceEntry>[];
    await _scanDirectory(_handle!, entries, null);
    return entries;
  }

  Future<void> _scanDirectory(
    FileSystemDirectoryHandle dir,
    List<WorkspaceEntry> entries,
    String? parentPath,
  ) async {
    final iterator = dir.entries();
    await for (final entry in iterator) {
      final name = entry[0] as String;
      final handle = entry[1];
      final isFolder = handle is FileSystemDirectoryHandle;
      if (!isFolder && !_isMarkdownFile(name)) continue;
      entries.add(WorkspaceEntry(
        path: name,
        parentPath: parentPath,
        name: isFolder
            ? name
            : name.replaceAll(RegExp(r'\.md(?:arkdown)?$'), ''),
        isFolder: isFolder,
        modifiedAt: DateTime.now(),
      ));
    }
  }

  bool _isMarkdownFile(String name) {
    final ext = name.split('.').last.toLowerCase();
    return ext == 'md' || ext == 'markdown';
  }

  @override
  Future<String> readFile(String path) async {
    final fileHandle =
        await _handle!.getFileHandle(path).toDart as FileSystemFileHandle;
    final file = await fileHandle.getFile().toDart as File;
    final buffer = await file.arrayBuffer().toDart;
    final bytes = (buffer as JSArrayBuffer).toDart;
    return bytes.fold<String>('', (prev, b) => prev + String.fromCharCode(b));
  }

  @override
  Future<void> writeFile(String path, String content) async {
    final fileHandle = await _handle!.createFile(path).toDart;
    final writable = await fileHandle.createWritable().toDart;
    await writable.write(content.toJS).toDart;
    await writable.close().toDart;
  }

  @override
  Future<void> createFile(
      String parentPath, String name, String content) async {
    final fileName = name.endsWith('.md') ? name : '$name.md';
    await writeFile(fileName, content);
  }

  @override
  Future<void> createFolder(String parentPath, String name) async {
    await _handle!.getDirectoryHandle(name).toDart;
  }

  @override
  Future<void> deleteNode(String path) async {
    await _handle!.removeEntry(path, recursive: true).toDart;
  }

  @override
  Future<String> moveNode(String sourcePath, String? targetParentPath) async {
    final pathParts = sourcePath.split('/');
    final fileName = pathParts.last;
    final parentParts = pathParts.length > 1
        ? pathParts.sublist(0, pathParts.length - 1)
        : <String>[];

    FileSystemHandle current = _handle!;
    for (final part in parentParts) {
      current = await (current as FileSystemDirectoryHandle)
          .getDirectoryHandle(part)
          .toDart;
    }

    final newParent = targetParentPath ?? _handle!.name;
    final newPath = '$newParent/$fileName';

    try {
      await _copyDirectory(
        current as FileSystemDirectoryHandle,
        await _handle!.getDirectoryHandle(fileName).toDart,
      );
      await (current as FileSystemDirectoryHandle)
          .removeEntry(fileName, recursive: true)
          .toDart;
      return newPath;
    } catch (_) {
      final content = await readFile(sourcePath);
      await writeFile(newPath, content);
      await deleteNode(sourcePath);
      return newPath;
    }
  }

  Future<void> _copyDirectory(
    FileSystemDirectoryHandle source,
    FileSystemDirectoryHandle target,
  ) async {
    final iterator = source.entries();
    await for (final entry in iterator) {
      final name = entry[0] as String;
      final handle = entry[1];
      if (handle is FileSystemDirectoryHandle) {
        final newDir = await target.getDirectoryHandle(name).toDart;
        await _copyDirectory(handle, newDir);
      } else {
        final file = await (handle as FileSystemFileHandle).getFile().toDart as File;
        final buffer = await file.arrayBuffer().toDart;
        final writable =
            await (await target.getFileHandle(name).toDart).createWritable().toDart;
        await writable.write(buffer.toJS).toDart;
        await writable.close().toDart;
      }
    }
  }
}

// ===========================================================================
// Entry point
// ===========================================================================

WorkspaceFileSystem createWorkspaceFileSystemImpl() => WebWorkspaceFileSystem();
