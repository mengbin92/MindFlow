class WorkspaceDescriptor {
  final String name;
  final String? rootPath;
  final bool isExternal;

  const WorkspaceDescriptor({
    required this.name,
    required this.rootPath,
    required this.isExternal,
  });

  factory WorkspaceDescriptor.localLibrary() {
    return const WorkspaceDescriptor(
      name: '本地资料库',
      rootPath: null,
      isExternal: false,
    );
  }
}
