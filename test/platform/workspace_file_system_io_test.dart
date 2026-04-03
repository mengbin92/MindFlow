import 'package:flutter_test/flutter_test.dart';
import 'package:mindflow/platform/workspace_file_system_io.dart';

void main() {
  test('pickWorkspace returns a descriptor for the selected directory', () async {
    final fileSystem = IoWorkspaceFileSystem(
      directoryPicker: () async => '/tmp/MindFlow Workspace',
    );

    final workspace = await fileSystem.pickWorkspace();

    expect(workspace, isNotNull);
    expect(workspace!.rootPath, '/tmp/MindFlow Workspace');
    expect(workspace.name, 'MindFlow Workspace');
    expect(workspace.isExternal, isTrue);
  });
}
