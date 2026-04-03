import '../models/workspace_descriptor.dart';

abstract class WorkspaceRepository {
  Future<WorkspaceDescriptor> getCurrentWorkspace();
  Future<WorkspaceDescriptor?> pickWorkspace();
  Future<WorkspaceDescriptor> useLocalLibrary();
}
