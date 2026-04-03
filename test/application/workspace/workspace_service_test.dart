import 'package:flutter_test/flutter_test.dart';
import 'package:mindflow/application/workspace/workspace_service.dart';
import 'package:mindflow/domain/repositories/document_repository.dart';
import 'package:mindflow/models/document.dart';

class FakeDocumentRepository implements DocumentRepository {
  FakeDocumentRepository(this.documents, {this.recentIds = const []});

  final List<Document> documents;
  final List<String> recentIds;

  @override
  Future<Document> createDocument(Document document) async {
    documents.add(document);
    return document;
  }

  @override
  Future<void> deleteDocument(String id) async {
    documents.removeWhere((document) => document.id == id);
  }

  @override
  Future<String> exportToMarkdown(String id) async => 'unused';

  @override
  Future<String> exportToHtml(String id, {required String html}) async =>
      'unused';

  @override
  Future<String> exportToPdf(String id, {required String html}) async =>
      'unused';

  @override
  Future<String> exportToImage(String id, {required String html}) async =>
      'unused';

  @override
  Future<String> exportToImagesZip(String id, {required String html}) async =>
      'unused';

  @override
  Future<List<Document>> getAllDocuments() async =>
      List.unmodifiable(documents);

  @override
  Future<Document?> getDocument(String id) async {
    for (final document in documents) {
      if (document.id == id) {
        return document;
      }
    }
    return null;
  }

  @override
  Future<List<Document>> getDocumentsByParentId(String? parentId) async {
    return documents
        .where((document) => document.parentId == parentId)
        .toList(growable: false);
  }

  @override
  Future<List<Document>> getFavoriteDocuments() async {
    return documents
        .where((document) => document.isFavorite && !document.isFolder)
        .toList(growable: false);
  }

  @override
  Future<List<Document>> getRecentDocuments() async {
    final items = <Document>[];
    for (final id in recentIds) {
      final document = await getDocument(id);
      if (document != null) {
        items.add(document);
      }
    }
    return items;
  }

  @override
  Future<Document> moveDocument(String id, String? newParentId) {
    throw UnimplementedError();
  }

  @override
  Future<List<Document>> searchDocuments(String query) async {
    final normalized = query.toLowerCase();
    return documents.where((document) {
      return document.title.toLowerCase().contains(normalized) ||
          document.content.toLowerCase().contains(normalized);
    }).toList(growable: false);
  }

  @override
  Future<Document> toggleFavorite(String id) {
    throw UnimplementedError();
  }

  @override
  Future<Document> updateDocument(Document document) async {
    final index = documents.indexWhere((item) => item.id == document.id);
    documents[index] = document;
    return document;
  }
}

void main() {
  group('WorkspaceService', () {
    late Document rootFolder;
    late Document childFolder;
    late Document article;
    late Document favorite;
    late WorkspaceService service;

    setUp(() {
      rootFolder =
          Document.create(id: 'root-folder', title: 'Projects', isFolder: true);
      childFolder = Document.create(
        id: 'child-folder',
        title: 'Specs',
        isFolder: true,
        parentId: rootFolder.id,
      );
      article = Document.create(
        id: 'article',
        title: 'Roadmap',
        content: 'Flutter migration plan',
        parentId: childFolder.id,
      );
      favorite = Document.create(
        id: 'favorite',
        title: 'Pinned',
        content: 'Important note',
      ).copyWith(isFavorite: true);

      service = WorkspaceService(
        documentRepository: FakeDocumentRepository(
          [rootFolder, childFolder, article, favorite],
          recentIds: [article.id, favorite.id],
        ),
      );
    });

    test('load returns current folder and folder trail', () async {
      final snapshot = await service.load(
        folderId: childFolder.id,
        selectedDocumentId: article.id,
      );

      expect(snapshot.currentFolder?.id, childFolder.id);
      expect(snapshot.folderTrail.map((item) => item.id),
          [rootFolder.id, childFolder.id]);
      expect(snapshot.selectedDocument?.id, article.id);
      expect(snapshot.documents.single.id, article.id);
    });

    test('search keeps favorites and recents in snapshot', () async {
      final snapshot = await service.search(
        query: 'plan',
        folderId: childFolder.id,
        selectedDocumentId: article.id,
      );

      expect(snapshot.documents.single.id, article.id);
      expect(snapshot.favoriteDocuments.single.id, favorite.id);
      expect(snapshot.recentDocuments.map((item) => item.id),
          [article.id, favorite.id]);
    });
  });
}
