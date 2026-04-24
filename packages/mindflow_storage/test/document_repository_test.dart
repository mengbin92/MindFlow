import 'package:drift/drift.dart';
import 'package:drift/native.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mindflow_storage/src/database.dart';
import 'package:mindflow_storage/src/repositories/document_repository.dart';

void main() {
  late AppDatabase database;
  late DocumentRepository repository;

  setUp(() {
    database = AppDatabase.forTesting(NativeDatabase.memory());
    repository = DocumentRepository(database);
  });

  tearDown(() async {
    await database.close();
  });

  group('DocumentRepository', () {
    test('should insert a document', () async {
      final doc = DocumentsCompanion.insert(
        uuid: 'test-uuid-1',
        title: 'Test Document',
        workspaceId: 'workspace-1',
        content: const Value('Test content'),
      );

      final id = await repository.insertDocument(doc);
      expect(id, greaterThan(0));
    });

    test('should get all documents for a workspace', () async {
      await repository.insertDocument(DocumentsCompanion.insert(
        uuid: 'test-uuid-2',
        title: 'Document 1',
        workspaceId: 'workspace-1',
      ));

      await repository.insertDocument(DocumentsCompanion.insert(
        uuid: 'test-uuid-3',
        title: 'Document 2',
        workspaceId: 'workspace-1',
      ));

      final docs = await repository.getAllDocuments('workspace-1');
      expect(docs.length, 2);
    });

    test('should get document by id', () async {
      final id = await repository.insertDocument(DocumentsCompanion.insert(
        uuid: 'test-uuid-4',
        title: 'Test Document',
        workspaceId: 'workspace-1',
      ));

      final doc = await repository.getDocumentById(id);
      expect(doc != null, true);
      expect(doc!.title, 'Test Document');
    });

    test('should delete document', () async {
      final id = await repository.insertDocument(DocumentsCompanion.insert(
        uuid: 'test-uuid-5',
        title: 'To be deleted',
        workspaceId: 'workspace-1',
      ));

      await repository.deleteDocument(id);
      final doc = await repository.getDocumentById(id);
      expect(doc, null);
    });

    test('should get favorites', () async {
      await repository.insertDocument(DocumentsCompanion.insert(
        uuid: 'test-uuid-6',
        title: 'Not favorite',
        workspaceId: 'workspace-1',
      ));

      await repository.insertDocument(DocumentsCompanion.insert(
        uuid: 'test-uuid-7',
        title: 'Favorite',
        workspaceId: 'workspace-1',
        isFavorite: const Value(true),
      ));

      final favorites = await repository.getFavorites();
      expect(favorites.length, 1);
      expect(favorites.first.title, 'Favorite');
    });
  });
}
