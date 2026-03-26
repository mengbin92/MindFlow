import '../domain/models/workspace_descriptor.dart';
import 'workspace_file_system_stub.dart'
    if (dart.library.io) 'workspace_file_system_io.dart';

class WorkspaceEntry {
  final String path;
  final String? parentPath;
  final String name;
  final bool isFolder;
  final DateTime modifiedAt;

  const WorkspaceEntry({
    required this.path,
    required this.parentPath,
    required this.name,
    required this.isFolder,
    required this.modifiedAt,
  });
}

abstract class WorkspaceFileSystem {
  Future<WorkspaceDescriptor?> pickWorkspace();
  Future<List<WorkspaceEntry>> scanWorkspace(String rootPath);
  Future<String> readFile(String path);
  Future<void> writeFile(String path, String content);
  Future<void> createFile(String parentPath, String name, String content);
  Future<void> createFolder(String parentPath, String name);
  Future<void> deleteNode(String path);
  Future<String> moveNode(String sourcePath, String? targetParentPath);
}

WorkspaceFileSystem createWorkspaceFileSystem() =>
    createWorkspaceFileSystemImpl();
