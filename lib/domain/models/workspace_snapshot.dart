import '../../models/document.dart';

class WorkspaceSnapshot {
  final List<Document> documents;
  final List<Document> allDocuments;
  final List<Document> favoriteDocuments;
  final List<Document> recentDocuments;
  final Document? selectedDocument;
  final Document? currentFolder;
  final List<Document> folderTrail;

  const WorkspaceSnapshot({
    required this.documents,
    required this.allDocuments,
    required this.favoriteDocuments,
    required this.recentDocuments,
    required this.selectedDocument,
    required this.currentFolder,
    required this.folderTrail,
  });
}
