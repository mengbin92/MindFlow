import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mindflow/application/workspace/workspace_service.dart';
import 'package:mindflow/blocs/file/file_bloc.dart';
import 'package:mindflow/domain/models/workspace_descriptor.dart';
import 'package:mindflow/domain/repositories/document_repository.dart';
import 'package:mindflow/domain/repositories/workspace_repository.dart';
import 'package:mindflow/models/document.dart';
import 'package:mindflow/services/storage_service.dart';
import 'package:mindflow/ui/screens/editor_screen.dart';

class RecordingDocumentRepository implements DocumentRepository {
  RecordingDocumentRepository(this.document);

  final Document document;
  final List<String> exportedIds = <String>[];
  final List<String> exportedHtmlIds = <String>[];
  final List<String> exportedPdfIds = <String>[];
  final List<String> exportedImageIds = <String>[];
  final List<String> exportedImageArchiveIds = <String>[];
  String? lastExportedHtml;

  @override
  Future<Document> createDocument(Document document) async => document;

  @override
  Future<void> deleteDocument(String id) async {}

  @override
  Future<String> exportToMarkdown(String id) async {
    exportedIds.add(id);
    return '/tmp/$id.md';
  }

  @override
  Future<String> exportToHtml(String id, {required String html}) async {
    exportedHtmlIds.add(id);
    lastExportedHtml = html;
    return '/tmp/$id.html';
  }

  @override
  Future<String> exportToPdf(String id, {required String html}) async {
    exportedPdfIds.add(id);
    lastExportedHtml = html;
    return '/tmp/$id.pdf';
  }

  @override
  Future<String> exportToImage(String id, {required String html}) async {
    exportedImageIds.add(id);
    lastExportedHtml = html;
    return '/tmp/$id.png';
  }

  @override
  Future<String> exportToImagesZip(String id, {required String html}) async {
    exportedImageArchiveIds.add(id);
    lastExportedHtml = html;
    return '/tmp/${id}_images.zip';
  }

  @override
  Future<List<Document>> getAllDocuments() async => [document];

  @override
  Future<Document?> getDocument(String id) async => id == document.id ? document : null;

  @override
  Future<List<Document>> getDocumentsByParentId(String? parentId) async => const [];

  @override
  Future<List<Document>> getFavoriteDocuments() async => const [];

  @override
  Future<List<Document>> getRecentDocuments() async => const [];

  @override
  Future<Document> moveDocument(String id, String? newParentId) async => document;

  @override
  Future<List<Document>> searchDocuments(String query) async => const [];

  @override
  Future<Document> toggleFavorite(String id) async => document;

  @override
  Future<Document> updateDocument(Document document) async => document;
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
  @override
  String? getLastOpenedFile() => null;

  @override
  List<String> getRecentFiles() => const [];

  @override
  Future<void> saveLastOpenedFile(String? fileId) async {}

  @override
  Future<void> addRecentFile(String fileId) async {}
}

void main() {
  testWidgets('exports markdown from the editor header', (tester) async {
    final document = Document.create(
      id: 'article',
      title: 'Roadmap',
      content: 'Energy: \$E=mc^2\$',
    );
    final documentRepository = RecordingDocumentRepository(document);
    final workspaceRepository = FakeWorkspaceRepository();
    final storageService = FakeStorageService();

    await tester.pumpWidget(
      MultiRepositoryProvider(
        providers: [
          RepositoryProvider<DocumentRepository>.value(value: documentRepository),
          RepositoryProvider<WorkspaceRepository>.value(value: workspaceRepository),
          RepositoryProvider<StorageService>.value(value: storageService),
          RepositoryProvider(
            create: (_) => WorkspaceService(documentRepository: documentRepository),
          ),
        ],
        child: BlocProvider(
          create: (context) => FileBloc(
            documentRepository: documentRepository,
            workspaceRepository: workspaceRepository,
            workspaceService: context.read<WorkspaceService>(),
            storageService: storageService,
          ),
          child: MaterialApp(
            home: DocumentEditorView(
              document: document,
              showScaffold: true,
            ),
          ),
        ),
      ),
    );

    await tester.tap(find.byTooltip('导出文档'));
    await tester.pumpAndSettle();

    await tester.tap(find.text('导出 Markdown'));
    await tester.pumpAndSettle();

    expect(documentRepository.exportedIds, [document.id]);
    expect(find.textContaining('已导出到'), findsOneWidget);
  });

  testWidgets('exports html from the editor header', (tester) async {
    final document = Document.create(
      id: 'article',
      title: 'Roadmap',
      content: 'Energy: \$E=mc^2\$',
    );
    final documentRepository = RecordingDocumentRepository(document);
    final workspaceRepository = FakeWorkspaceRepository();
    final storageService = FakeStorageService();

    await tester.pumpWidget(
      MultiRepositoryProvider(
        providers: [
          RepositoryProvider<DocumentRepository>.value(value: documentRepository),
          RepositoryProvider<WorkspaceRepository>.value(value: workspaceRepository),
          RepositoryProvider<StorageService>.value(value: storageService),
          RepositoryProvider(
            create: (_) => WorkspaceService(documentRepository: documentRepository),
          ),
        ],
        child: BlocProvider(
          create: (context) => FileBloc(
            documentRepository: documentRepository,
            workspaceRepository: workspaceRepository,
            workspaceService: context.read<WorkspaceService>(),
            storageService: storageService,
          ),
          child: MaterialApp(
            home: DocumentEditorView(
              document: document,
              showScaffold: true,
            ),
          ),
        ),
      ),
    );

    await tester.tap(find.byTooltip('导出文档'));
    await tester.pumpAndSettle();

    await tester.tap(find.text('导出 HTML'));
    await tester.pumpAndSettle();

    expect(documentRepository.exportedHtmlIds, [document.id]);
    expect(documentRepository.lastExportedHtml, contains('<!DOCTYPE html>'));
    expect(documentRepository.lastExportedHtml, contains('<title>Roadmap</title>'));
    expect(documentRepository.lastExportedHtml, contains('<main class="mf-document">'));
    expect(documentRepository.lastExportedHtml, contains('mf-latex-inline'));
    expect(documentRepository.lastExportedHtml, isNot(contains('\$E=mc^2\$')));
    expect(find.textContaining('已导出到'), findsOneWidget);
  });

  testWidgets('exports pdf from the editor header', (tester) async {
    final document = Document.create(
      id: 'article',
      title: 'Roadmap',
      content: 'Energy: \$E=mc^2\$',
    );
    final documentRepository = RecordingDocumentRepository(document);
    final workspaceRepository = FakeWorkspaceRepository();
    final storageService = FakeStorageService();

    await tester.pumpWidget(
      MultiRepositoryProvider(
        providers: [
          RepositoryProvider<DocumentRepository>.value(value: documentRepository),
          RepositoryProvider<WorkspaceRepository>.value(value: workspaceRepository),
          RepositoryProvider<StorageService>.value(value: storageService),
          RepositoryProvider(
            create: (_) => WorkspaceService(documentRepository: documentRepository),
          ),
        ],
        child: BlocProvider(
          create: (context) => FileBloc(
            documentRepository: documentRepository,
            workspaceRepository: workspaceRepository,
            workspaceService: context.read<WorkspaceService>(),
            storageService: storageService,
          ),
          child: MaterialApp(
            home: DocumentEditorView(
              document: document,
              showScaffold: true,
            ),
          ),
        ),
      ),
    );

    await tester.tap(find.byTooltip('导出文档'));
    await tester.pumpAndSettle();

    await tester.tap(find.text('导出 PDF'));
    await tester.pumpAndSettle();

    expect(documentRepository.exportedPdfIds, [document.id]);
    expect(documentRepository.lastExportedHtml, contains('<!DOCTYPE html>'));
    expect(documentRepository.lastExportedHtml, contains('mf-latex-inline'));
    expect(documentRepository.lastExportedHtml, isNot(contains('\$E=mc^2\$')));
    expect(find.textContaining('已导出到'), findsOneWidget);
  });

  testWidgets('exports image from the editor header', (tester) async {
    final document = Document.create(
      id: 'article',
      title: 'Roadmap',
      content: 'Energy: \$E=mc^2\$',
    );
    final documentRepository = RecordingDocumentRepository(document);
    final workspaceRepository = FakeWorkspaceRepository();
    final storageService = FakeStorageService();

    await tester.pumpWidget(
      MultiRepositoryProvider(
        providers: [
          RepositoryProvider<DocumentRepository>.value(value: documentRepository),
          RepositoryProvider<WorkspaceRepository>.value(value: workspaceRepository),
          RepositoryProvider<StorageService>.value(value: storageService),
          RepositoryProvider(
            create: (_) => WorkspaceService(documentRepository: documentRepository),
          ),
        ],
        child: BlocProvider(
          create: (context) => FileBloc(
            documentRepository: documentRepository,
            workspaceRepository: workspaceRepository,
            workspaceService: context.read<WorkspaceService>(),
            storageService: storageService,
          ),
          child: MaterialApp(
            home: DocumentEditorView(
              document: document,
              showScaffold: true,
            ),
          ),
        ),
      ),
    );

    await tester.tap(find.byTooltip('导出文档'));
    await tester.pumpAndSettle();

    await tester.tap(find.text('导出图片'));
    await tester.pumpAndSettle();

    expect(documentRepository.exportedImageIds, [document.id]);
    expect(documentRepository.lastExportedHtml, contains('<!DOCTYPE html>'));
    expect(documentRepository.lastExportedHtml, contains('mf-latex-inline'));
    expect(documentRepository.lastExportedHtml, isNot(contains('\$E=mc^2\$')));
    expect(find.textContaining('已导出到'), findsOneWidget);
  });

  testWidgets('exports multi-page images zip from the editor header',
      (tester) async {
    final document = Document.create(
      id: 'article',
      title: 'Roadmap',
      content: 'Energy: \$E=mc^2\$',
    );
    final documentRepository = RecordingDocumentRepository(document);
    final workspaceRepository = FakeWorkspaceRepository();
    final storageService = FakeStorageService();

    await tester.pumpWidget(
      MultiRepositoryProvider(
        providers: [
          RepositoryProvider<DocumentRepository>.value(value: documentRepository),
          RepositoryProvider<WorkspaceRepository>.value(value: workspaceRepository),
          RepositoryProvider<StorageService>.value(value: storageService),
          RepositoryProvider(
            create: (_) => WorkspaceService(documentRepository: documentRepository),
          ),
        ],
        child: BlocProvider(
          create: (context) => FileBloc(
            documentRepository: documentRepository,
            workspaceRepository: workspaceRepository,
            workspaceService: context.read<WorkspaceService>(),
            storageService: storageService,
          ),
          child: MaterialApp(
            home: DocumentEditorView(
              document: document,
              showScaffold: true,
            ),
          ),
        ),
      ),
    );

    await tester.tap(find.byTooltip('导出文档'));
    await tester.pumpAndSettle();

    await tester.tap(find.text('导出多页图片 ZIP'));
    await tester.pumpAndSettle();

    expect(documentRepository.exportedImageArchiveIds, [document.id]);
    expect(documentRepository.lastExportedHtml, contains('<!DOCTYPE html>'));
    expect(documentRepository.lastExportedHtml, contains('mf-latex-inline'));
    expect(documentRepository.lastExportedHtml, isNot(contains('\$E=mc^2\$')));
    expect(find.textContaining('已导出到'), findsOneWidget);
  });
}
