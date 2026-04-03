import '../../domain/models/workspace_snapshot.dart';
import '../../domain/repositories/document_repository.dart';
import '../../models/document.dart';

class WorkspaceService {
  final DocumentRepository documentRepository;

  const WorkspaceService({
    required this.documentRepository,
  });

  Future<WorkspaceSnapshot> load({
    String? folderId,
    String? selectedDocumentId,
  }) async {
    final allDocuments = await documentRepository.getAllDocuments();
    final documents = await documentRepository.getDocumentsByParentId(folderId);
    final favoriteDocuments = await documentRepository.getFavoriteDocuments();
    final recentDocuments = await documentRepository.getRecentDocuments();
    final currentFolder = _findDocument(allDocuments, folderId);

    return WorkspaceSnapshot(
      documents: documents,
      allDocuments: allDocuments,
      favoriteDocuments: favoriteDocuments,
      recentDocuments: recentDocuments,
      selectedDocument: _findDocument(allDocuments, selectedDocumentId),
      currentFolder: currentFolder?.isFolder == true ? currentFolder : null,
      folderTrail: _buildFolderTrail(allDocuments, currentFolder),
    );
  }

  Future<WorkspaceSnapshot> search({
    required String query,
    String? folderId,
    String? selectedDocumentId,
  }) async {
    final allDocuments = await documentRepository.getAllDocuments();
    final documents = query.isEmpty
        ? await documentRepository.getDocumentsByParentId(folderId)
        : await documentRepository.searchDocuments(query);
    final favoriteDocuments = await documentRepository.getFavoriteDocuments();
    final recentDocuments = await documentRepository.getRecentDocuments();
    final currentFolder = _findDocument(allDocuments, folderId);

    return WorkspaceSnapshot(
      documents: documents,
      allDocuments: allDocuments,
      favoriteDocuments: favoriteDocuments,
      recentDocuments: recentDocuments,
      selectedDocument: _findDocument(allDocuments, selectedDocumentId),
      currentFolder: currentFolder?.isFolder == true ? currentFolder : null,
      folderTrail: _buildFolderTrail(allDocuments, currentFolder),
    );
  }

  Future<Document?> openDocument(String id) {
    return documentRepository.getDocument(id);
  }

  Document? _findDocument(List<Document> documents, String? id) {
    if (id == null) {
      return null;
    }

    for (final document in documents) {
      if (document.id == id) {
        return document;
      }
    }
    return null;
  }

  List<Document> _buildFolderTrail(
    List<Document> allDocuments,
    Document? currentFolder,
  ) {
    if (currentFolder == null) {
      return const [];
    }

    final trail = <Document>[];
    Document? node = currentFolder;
    while (node != null) {
      trail.add(node);
      node = _findDocument(allDocuments, node.parentId);
    }

    return trail.reversed.toList(growable: false);
  }
}
