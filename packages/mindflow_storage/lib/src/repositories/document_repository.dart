import 'package:drift/drift.dart';
import '../database.dart';
import '../tables/documents.dart';

part 'document_repository.g.dart';

@DriftAccessor(tables: [Documents])
class DocumentRepository extends DatabaseAccessor<AppDatabase>
    with _$DocumentRepositoryMixin {
  DocumentRepository(super.db);

  Future<List<Document>> getAllDocuments(String workspaceId) {
    return (select(documents)
          ..where((d) => d.workspaceId.equals(workspaceId)))
        .get();
  }

  Future<Document?> getDocumentById(int id) {
    return (select(documents)..where((d) => d.id.equals(id))).getSingleOrNull();
  }

  Future<int> insertDocument(DocumentsCompanion doc) {
    return into(documents).insert(doc);
  }

  Future<bool> updateDocument(DocumentsCompanion doc) {
    return update(documents).replace(doc);
  }

  Future<int> deleteDocument(int id) {
    return (delete(documents)..where((d) => d.id.equals(id))).go();
  }

  Future<List<Document>> getFavorites() {
    return (select(documents)..where((d) => d.isFavorite.equals(true))).get();
  }

  Stream<List<Document>> watchDocuments(String workspaceId) {
    return (select(documents)
          ..where((d) => d.workspaceId.equals(workspaceId)))
        .watch();
  }
}
