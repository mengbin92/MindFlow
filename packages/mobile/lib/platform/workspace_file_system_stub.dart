import '../domain/models/workspace_descriptor.dart';
import 'workspace_file_system.dart';

class UnsupportedWorkspaceFileSystem implements WorkspaceFileSystem {
  @override
  Future<void> createFile(String parentPath, String name, String content) {
    throw UnsupportedError(
        'Workspace file system is not available on this platform');
  }

  @override
  Future<void> createFolder(String parentPath, String name) {
    throw UnsupportedError(
        'Workspace file system is not available on this platform');
  }

  @override
  Future<void> deleteNode(String path) {
    throw UnsupportedError(
        'Workspace file system is not available on this platform');
  }

  @override
  Future<String> moveNode(String sourcePath, String? targetParentPath) {
    throw UnsupportedError(
        'Workspace file system is not available on this platform');
  }

  @override
  Future<WorkspaceDescriptor?> pickWorkspace() async => null;

  @override
  Future<String> readFile(String path) {
    throw UnsupportedError(
        'Workspace file system is not available on this platform');
  }

  @override
  Future<List<WorkspaceEntry>> scanWorkspace(String rootPath) {
    throw UnsupportedError(
        'Workspace file system is not available on this platform');
  }

  @override
  Future<void> writeFile(String path, String content) {
    throw UnsupportedError(
        'Workspace file system is not available on this platform');
  }
}

WorkspaceFileSystem createWorkspaceFileSystemImpl() =>
    UnsupportedWorkspaceFileSystem();
