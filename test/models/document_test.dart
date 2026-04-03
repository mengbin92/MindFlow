import 'package:flutter_test/flutter_test.dart';
import 'package:mindflow/models/document.dart';

void main() {
  group('Document', () {
    test('should create a document with default values', () {
      final doc = Document.create(title: 'Test Document');

      expect(doc.title, 'Test Document');
      expect(doc.content, '');
      expect(doc.isFolder, false);
      expect(doc.isFavorite, false);
      expect(doc.tags, isEmpty);
    });

    test('should create a folder', () {
      final folder = Document.create(title: 'Test Folder', isFolder: true);

      expect(folder.isFolder, true);
      expect(folder.title, 'Test Folder');
    });

    test('should copy with new values', () {
      final doc = Document.create(title: 'Original');
      final updated = doc.copyWith(title: 'Updated');

      expect(updated.title, 'Updated');
      expect(doc.title, 'Original'); // Original should not change
    });

    test('should convert to and from JSON', () {
      final doc = Document.create(title: 'JSON Test', content: 'Test content');

      final json = doc.toJson();
      final restored = Document.fromJson(json);

      expect(restored.title, doc.title);
      expect(restored.content, doc.content);
      expect(restored.id, doc.id);
    });

    test('should generate display title', () {
      final doc1 = Document.create(title: 'Test');
      expect(doc1.displayTitle, 'Test');

      final doc2 = Document.create(title: '');
      expect(doc2.displayTitle, 'Untitled');
    });
  });
}
