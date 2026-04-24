import 'dart:io';

import 'package:file_selector/file_selector.dart';
import 'package:mindflow_domain/mindflow_domain.dart';
import 'package:path/path.dart' as path;

import 'workspace_file_system.dart';

typedef DirectoryPicker = Future<String?> Function();

class IoWorkspaceFileSystem implements WorkspaceFileSystem {
  IoWorkspaceFileSystem({
    DirectoryPicker? directoryPicker,
  }) : _directoryPicker = directoryPicker ?? getDirectoryPath;

  final DirectoryPicker _directoryPicker;

  @override
  Future<WorkspaceDescriptor?> pickWorkspace() async {
    final directory = await _directoryPicker();
    if (directory == null) {
      return null;
    }
    return WorkspaceDescriptor(
      name: path.basename(directory),
      rootPath: directory,
      isExternal: true,
    );
  }

  @override
  Future<List<WorkspaceEntry>> scanWorkspace(String rootPath) async {
    final rootDirectory = Directory(rootPath);
    if (!await rootDirectory.exists()) {
      return const [];
    }

    final items = <WorkspaceEntry>[];
    await for (final entity
        in rootDirectory.list(recursive: true, followLinks: false)) {
      final entityPath = entity.path;
      final parent = path.dirname(entityPath);
      if (entity is Directory) {
        final stat = await entity.stat();
        items.add(
          WorkspaceEntry(
            path: entityPath,
            parentPath: parent == rootPath ? null : parent,
            name: path.basename(entityPath),
            isFolder: true,
            modifiedAt: stat.modified,
          ),
        );
        continue;
      }

      if (entity is File && _isMarkdownFile(entityPath)) {
        final stat = await entity.stat();
        items.add(
          WorkspaceEntry(
            path: entityPath,
            parentPath: parent == rootPath ? null : parent,
            name: path.basenameWithoutExtension(entityPath),
            isFolder: false,
            modifiedAt: stat.modified,
          ),
        );
      }
    }

    items.sort((a, b) {
      if (a.parentPath != b.parentPath) {
        return (a.parentPath ?? '').compareTo(b.parentPath ?? '');
      }
      if (a.isFolder != b.isFolder) {
        return a.isFolder ? -1 : 1;
      }
      return a.name.toLowerCase().compareTo(b.name.toLowerCase());
    });
    return items;
  }

  @override
  Future<String> readFile(String pathValue) {
    return File(pathValue).readAsString();
  }

  @override
  Future<void> writeFile(String pathValue, String content) {
    return File(pathValue).writeAsString(content);
  }

  @override
  Future<void> createFile(
      String parentPath, String name, String content) async {
    final fileName = name.endsWith('.md') ? name : '$name.md';
    final file = File(path.join(parentPath, fileName));
    await file.create(recursive: true);
    await file.writeAsString(content);
  }

  @override
  Future<void> createFolder(String parentPath, String name) {
    return Directory(path.join(parentPath, name)).create(recursive: true);
  }

  @override
  Future<void> deleteNode(String pathValue) async {
    final type = FileSystemEntity.typeSync(pathValue);
    if (type == FileSystemEntityType.directory) {
      await Directory(pathValue).delete(recursive: true);
      return;
    }
    if (type == FileSystemEntityType.file) {
      await File(pathValue).delete();
    }
  }

  @override
  Future<String> moveNode(String sourcePath, String? targetParentPath) async {
    final destinationParent = targetParentPath ?? path.dirname(sourcePath);
    final destinationPath =
        path.join(destinationParent, path.basename(sourcePath));
    final type = FileSystemEntity.typeSync(sourcePath);
    if (type == FileSystemEntityType.directory) {
      return (await Directory(sourcePath).rename(destinationPath)).path;
    }
    return (await File(sourcePath).rename(destinationPath)).path;
  }

  bool _isMarkdownFile(String value) {
    final extension = path.extension(value).toLowerCase();
    return extension == '.md' || extension == '.markdown';
  }
}

WorkspaceFileSystem createWorkspaceFileSystemImpl() => IoWorkspaceFileSystem();
