import '../models/document.dart';

abstract class DocumentRepository {
  Future<List<Document>> getAllDocuments();
  Future<List<Document>> getDocumentsByParentId(String? parentId);
  Future<List<Document>> getFavoriteDocuments();
  Future<List<Document>> getRecentDocuments();
  Future<Document?> getDocument(String id);
  Future<Document> createDocument(Document document);
  Future<Document> updateDocument(Document document);
  Future<void> deleteDocument(String id);
  Future<List<Document>> searchDocuments(String query);
  Future<Document> toggleFavorite(String id);
  Future<Document> moveDocument(String id, String? newParentId);
  Future<String> exportToMarkdown(String id);
  Future<String> exportToHtml(String id, {required String html});
  Future<String> exportToPdf(String id, {required String html});
  Future<String> exportToImage(String id, {required String html});
  Future<String> exportToImagesZip(String id, {required String html});
}
