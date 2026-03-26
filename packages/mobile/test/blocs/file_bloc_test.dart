import 'package:bloc_test/bloc_test.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mindflow/application/workspace/workspace_service.dart';
import 'package:mindflow/blocs/file/file_bloc.dart';
import 'package:mindflow/domain/models/workspace_descriptor.dart';
import 'package:mindflow/domain/repositories/document_repository.dart';
import 'package:mindflow/domain/repositories/workspace_repository.dart';
import 'package:mindflow/models/document.dart';
import 'package:mindflow/services/storage_service.dart';

class FakeDocumentRepository implements DocumentRepository {
  FakeDocumentRepository(this.documents);

  final List<Document> documents;

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
  Future<String> exportToMarkdown(String id) async => id;

  @override
  Future<String> exportToHtml(String id, {required String html}) async => id;

  @override
  Future<String> exportToPdf(String id, {required String html}) async => id;

  @override
  Future<String> exportToImage(String id, {required String html}) async => id;

  @override
  Future<String> exportToImagesZip(String id, {required String html}) async =>
      id;

  @override
  Future<List<Document>> getAllDocuments() async => List.unmodifiable(documents);

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
  Future<List<Document>> getRecentDocuments() async => const [];

  @override
  Future<Document> moveDocument(String id, String? newParentId) {
    throw UnimplementedError();
  }

  @override
  Future<List<Document>> searchDocuments(String query) async => const [];

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

class FakeWorkspaceRepository implements WorkspaceRepository {
  @override
  Future<WorkspaceDescriptor> getCurrentWorkspace() async {
    return WorkspaceDescriptor.localLibrary();
  }

  @override
  Future<WorkspaceDescriptor?> pickWorkspace() async => null;

  @override
  Future<WorkspaceDescriptor> useLocalLibrary() async {
    return WorkspaceDescriptor.localLibrary();
  }
}

class FakeStorageService extends StorageService {
  FakeStorageService({this.lastOpenedFile});

  final String? lastOpenedFile;

  @override
  String? getLastOpenedFile() => lastOpenedFile;

  @override
  List<String> getRecentFiles() => const [];

  @override
  Future<void> saveLastOpenedFile(String? fileId) async {}

  @override
  Future<void> addRecentFile(String fileId) async {}
}

void main() {
  group('FileBloc', () {
    late Document folder;
    late Document article;
    late FakeDocumentRepository documentRepository;
    late FakeWorkspaceRepository workspaceRepository;
    late WorkspaceService workspaceService;

    setUp(() {
      folder = Document.create(
        id: 'folder',
        title: 'Projects',
        isFolder: true,
      );
      article = Document.create(
        id: 'article',
        title: 'Roadmap',
        content: 'Flutter rewrite',
        parentId: folder.id,
      );
      documentRepository = FakeDocumentRepository([folder, article]);
      workspaceRepository = FakeWorkspaceRepository();
      workspaceService = WorkspaceService(
        documentRepository: documentRepository,
      );
    });

    blocTest<FileBloc, FileState>(
      'restores the last opened document when files load',
      build: () => FileBloc(
        documentRepository: documentRepository,
        workspaceRepository: workspaceRepository,
        workspaceService: workspaceService,
        storageService: FakeStorageService(lastOpenedFile: article.id),
      ),
      act: (bloc) => bloc.add(const FilesLoaded()),
      expect: () => [
        const FileState(status: FileStatus.loading),
        isA<FileState>()
            .having((state) => state.status, 'status', FileStatus.success)
            .having(
              (state) => state.selectedDocument?.id,
              'selectedDocument.id',
              article.id,
            )
            .having(
              (state) => state.currentFolderId,
              'currentFolderId',
              null,
            ),
      ],
    );
  });
}
