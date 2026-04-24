import 'dart:async';

import 'package:path/path.dart' as path;
import 'package:sqflite/sqflite.dart';

import '../domain/models/workspace_descriptor.dart';
import '../domain/repositories/document_repository.dart';
import '../domain/repositories/workspace_repository.dart';
import '../models/document.dart';
import '../platform/workspace_file_system.dart';
import 'package:mindflow_export/mindflow_export.dart';
import '../services/storage_service.dart';

class FileRepository implements DocumentRepository, WorkspaceRepository {
  final StorageService storageService;
  final ExportFileWriter exportFileWriter;
  final WorkspaceFileSystem workspaceFileSystem;
  Database? _database;

  FileRepository({
    required this.storageService,
    ExportFileWriter? exportFileWriter,
    WorkspaceFileSystem? workspaceFileSystem,
  })  : exportFileWriter = exportFileWriter ?? createExportFileWriter(),
        workspaceFileSystem =
            workspaceFileSystem ?? createWorkspaceFileSystem();

  Future<Database> get database async {
    _database ??= await _initDatabase();
    return _database!;
  }

  Future<Database> _initDatabase() async {
    final dbPath = await getDatabasesPath();
    final dbFile = path.join(dbPath, 'mindflow.db');

    return openDatabase(
      dbFile,
      version: 1,
      onCreate: (db, version) async {
        await db.execute('''
          CREATE TABLE documents (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            parentId TEXT,
            createdAt TEXT NOT NULL,
            updatedAt TEXT NOT NULL,
            isFolder INTEGER NOT NULL DEFAULT 0,
            tags TEXT NOT NULL DEFAULT '',
            isFavorite INTEGER NOT NULL DEFAULT 0
          )
        ''');

        await db.execute('CREATE INDEX idx_parentId ON documents(parentId)');
        await db
            .execute('CREATE INDEX idx_isFavorite ON documents(isFavorite)');

        final now = DateTime.now().toIso8601String();
        await db.execute('''
          INSERT INTO documents (id, title, content, parentId, createdAt, updatedAt, isFolder, tags, isFavorite)
          VALUES ('root', 'My Documents', '', NULL, '$now', '$now', 1, '', 0)
        ''');
      },
    );
  }

  @override
  Future<WorkspaceDescriptor> getCurrentWorkspace() async {
    final rootPath = storageService.getWorkspaceRootPath();
    if (rootPath == null || rootPath.isEmpty) {
      return WorkspaceDescriptor.localLibrary();
    }
    return WorkspaceDescriptor(
      name: path.basename(rootPath),
      rootPath: rootPath,
      isExternal: true,
    );
  }

  @override
  Future<WorkspaceDescriptor?> pickWorkspace() async {
    final selection = await workspaceFileSystem.pickWorkspace();
    if (selection == null) {
      return null;
    }
    await storageService.saveWorkspaceRootPath(selection.rootPath);
    await storageService.saveLastOpenedFile(null);
    return selection;
  }

  @override
  Future<WorkspaceDescriptor> useLocalLibrary() async {
    await storageService.saveWorkspaceRootPath(null);
    await storageService.saveLastOpenedFile(null);
    return WorkspaceDescriptor.localLibrary();
  }

  @override
  Future<List<Document>> getAllDocuments() async {
    final workspace = await getCurrentWorkspace();
    if (!workspace.isExternal || workspace.rootPath == null) {
      final db = await database;
      final maps = await db.query('documents', orderBy: 'updatedAt DESC');
      return maps.map((map) => Document.fromJson(map)).toList();
    }
    return _scanWorkspace(workspace.rootPath!);
  }

  @override
  Future<List<Document>> getDocumentsByParentId(String? parentId) async {
    final workspace = await getCurrentWorkspace();
    if (!workspace.isExternal || workspace.rootPath == null) {
      final db = await database;
      final maps = await db.query(
        'documents',
        where: parentId == null ? 'parentId IS NULL' : 'parentId = ?',
        whereArgs: parentId == null ? [] : [parentId],
        orderBy: 'isFolder DESC, updatedAt DESC',
      );
      return maps.map((map) => Document.fromJson(map)).toList();
    }

    final allDocuments = await _scanWorkspace(workspace.rootPath!);
    final effectiveParentId = parentId ?? workspace.rootPath;
    return allDocuments.where((document) {
      if (document.id == workspace.rootPath) {
        return false;
      }
      if (parentId == null) {
        return document.parentId == workspace.rootPath;
      }
      return document.parentId == effectiveParentId;
    }).toList(growable: false);
  }

  @override
  Future<List<Document>> getFavoriteDocuments() async {
    final workspace = await getCurrentWorkspace();
    if (!workspace.isExternal || workspace.rootPath == null) {
      final db = await database;
      final maps = await db.query(
        'documents',
        where: 'isFavorite = ? AND isFolder = ?',
        whereArgs: [1, 0],
        orderBy: 'updatedAt DESC',
      );
      return maps.map((map) => Document.fromJson(map)).toList();
    }

    final allDocuments = await _scanWorkspace(workspace.rootPath!);
    return allDocuments
        .where((document) => document.isFavorite && !document.isFolder)
        .toList(growable: false);
  }

  @override
  Future<List<Document>> getRecentDocuments() async {
    final recentIds = storageService.getRecentFiles();
    if (recentIds.isEmpty) {
      return const [];
    }

    final items = <Document>[];
    for (final id in recentIds) {
      final document = await getDocument(id);
      if (document != null && !document.isFolder) {
        items.add(document);
      }
    }
    return items;
  }

  @override
  Future<Document?> getDocument(String id) async {
    final workspace = await getCurrentWorkspace();
    if (!workspace.isExternal || workspace.rootPath == null) {
      final db = await database;
      final maps =
          await db.query('documents', where: 'id = ?', whereArgs: [id]);
      if (maps.isEmpty) {
        return null;
      }
      return Document.fromJson(maps.first);
    }

    final allDocuments = await _scanWorkspace(workspace.rootPath!);
    Document? match;
    for (final document in allDocuments) {
      if (document.id == id) {
        match = document;
        break;
      }
    }
    if (match == null) {
      return null;
    }
    if (match.isFolder) {
      return match;
    }
    final content = await workspaceFileSystem.readFile(id);
    return match.copyWith(content: content);
  }

  @override
  Future<Document> createDocument(Document document) async {
    final workspace = await getCurrentWorkspace();
    if (!workspace.isExternal || workspace.rootPath == null) {
      final db = await database;
      await db.insert('documents', document.toJson());
      if (!document.isFolder) {
        await storageService.addRecentFile(document.id);
        await storageService.saveLastOpenedFile(document.id);
      }
      return document;
    }

    final parentPath = document.parentId ?? workspace.rootPath!;
    if (document.isFolder) {
      await workspaceFileSystem.createFolder(parentPath, document.title);
    } else {
      await workspaceFileSystem.createFile(
        parentPath,
        document.title,
        document.content,
      );
    }

    final documents = await getDocumentsByParentId(document.parentId);
    for (final item in documents) {
      if (item.displayTitle == document.displayTitle) {
        return item;
      }
    }
    return document;
  }

  @override
  Future<Document> updateDocument(Document document) async {
    final workspace = await getCurrentWorkspace();
    if (!workspace.isExternal || workspace.rootPath == null) {
      final db = await database;
      final updated = document.copyWith(updatedAt: DateTime.now());
      await db.update(
        'documents',
        updated.toJson(),
        where: 'id = ?',
        whereArgs: [document.id],
      );
      if (!updated.isFolder) {
        await storageService.addRecentFile(updated.id);
        await storageService.saveLastOpenedFile(updated.id);
      }
      return updated;
    }

    if (!document.isFolder) {
      await workspaceFileSystem.writeFile(document.id, document.content);
    }
    await storageService.addRecentFile(document.id);
    await storageService.saveLastOpenedFile(document.id);
    return (await getDocument(document.id)) ?? document;
  }

  @override
  Future<void> deleteDocument(String id) async {
    final workspace = await getCurrentWorkspace();
    if (!workspace.isExternal || workspace.rootPath == null) {
      final db = await database;
      final children = await getDocumentsByParentId(id);
      for (final child in children) {
        await deleteDocument(child.id);
      }
      await db.delete('documents', where: 'id = ?', whereArgs: [id]);
      return;
    }

    await workspaceFileSystem.deleteNode(id);
  }

  @override
  Future<List<Document>> searchDocuments(String query) async {
    final workspace = await getCurrentWorkspace();
    if (!workspace.isExternal || workspace.rootPath == null) {
      final db = await database;
      final maps = await db.query(
        'documents',
        where: 'title LIKE ? OR content LIKE ?',
        whereArgs: ['%$query%', '%$query%'],
        orderBy: 'updatedAt DESC',
      );
      return maps.map((map) => Document.fromJson(map)).toList();
    }

    final normalized = query.toLowerCase();
    final items = await _scanWorkspace(workspace.rootPath!);
    final results = <Document>[];
    for (final document in items) {
      if (document.isFolder) {
        if (document.title.toLowerCase().contains(normalized)) {
          results.add(document);
        }
        continue;
      }

      final content = await workspaceFileSystem.readFile(document.id);
      if (document.title.toLowerCase().contains(normalized) ||
          content.toLowerCase().contains(normalized)) {
        results.add(document.copyWith(content: content));
      }
    }
    return results;
  }

  @override
  Future<Document> toggleFavorite(String id) async {
    final workspace = await getCurrentWorkspace();
    if (!workspace.isExternal || workspace.rootPath == null) {
      final document = await getDocument(id);
      if (document == null) {
        throw Exception('Document not found');
      }
      final updated = document.copyWith(isFavorite: !document.isFavorite);
      return updateDocument(updated);
    }

    await storageService.toggleFavoritePath(id);
    return (await getDocument(id))!;
  }

  @override
  Future<Document> moveDocument(String id, String? newParentId) async {
    final workspace = await getCurrentWorkspace();
    if (!workspace.isExternal || workspace.rootPath == null) {
      final document = await getDocument(id);
      if (document == null) {
        throw Exception('Document not found');
      }
      final updated = document.copyWith(
        parentId: newParentId,
        clearParentId: newParentId == null,
      );
      return updateDocument(updated);
    }

    final newPath = await workspaceFileSystem.moveNode(
        id, newParentId ?? workspace.rootPath);
    return (await getDocument(newPath))!;
  }

  @override
  Future<String> exportToMarkdown(String id) async {
    final workspace = await getCurrentWorkspace();
    if (workspace.isExternal && workspace.rootPath != null) {
      return id;
    }

    final document = await getDocument(id);
    if (document == null) {
      throw Exception('Document not found');
    }

    final fileName =
        '${document.title.replaceAll(RegExp(r'[^\w\s-]'), '_')}.md';
    return exportFileWriter.writeMarkdownFile(
      fileName: fileName,
      content: document.content,
    );
  }

  @override
  Future<String> exportToHtml(String id, {required String html}) async {
    final document = await getDocument(id);
    if (document == null) {
      throw Exception('Document not found');
    }

    final fileName =
        '${document.title.replaceAll(RegExp(r'[^\w\s-]'), '_')}.html';
    return exportFileWriter.writeHtmlFile(
      fileName: fileName,
      content: html,
    );
  }

  @override
  Future<String> exportToPdf(String id, {required String html}) async {
    final document = await getDocument(id);
    if (document == null) {
      throw Exception('Document not found');
    }

    final fileName =
        '${document.title.replaceAll(RegExp(r'[^\w\s-]'), '_')}.pdf';
    return exportFileWriter.writePdfFile(
      fileName: fileName,
      html: html,
    );
  }

  @override
  Future<String> exportToImage(String id, {required String html}) async {
    final document = await getDocument(id);
    if (document == null) {
      throw Exception('Document not found');
    }

    final fileName =
        '${document.title.replaceAll(RegExp(r'[^\w\s-]'), '_')}.png';
    return exportFileWriter.writeImageFile(
      fileName: fileName,
      html: html,
    );
  }

  @override
  Future<String> exportToImagesZip(String id, {required String html}) async {
    final document = await getDocument(id);
    if (document == null) {
      throw Exception('Document not found');
    }

    final fileName =
        '${document.title.replaceAll(RegExp(r'[^\w\s-]'), '_')}_images.zip';
    return exportFileWriter.writeImagesZip(
      fileName: fileName,
      html: html,
    );
  }

  Future<List<Document>> _scanWorkspace(String rootPath) async {
    final entries = await workspaceFileSystem.scanWorkspace(rootPath);
    final favoriteIds = storageService.getFavoritePaths().toSet();
    final rootDirectory = DirectoryLikeDocument(
      path: rootPath,
      title: path.basename(rootPath),
    );

    final items = <Document>[rootDirectory.toDocument()];
    items.addAll(
      entries.map((entry) {
        return Document(
          id: entry.path,
          title: entry.name,
          content: '',
          parentId: entry.parentPath ?? rootPath,
          createdAt: entry.modifiedAt,
          updatedAt: entry.modifiedAt,
          isFolder: entry.isFolder,
          isFavorite: favoriteIds.contains(entry.path),
        );
      }),
    );
    return items;
  }

  Future<void> close() async {
    if (_database != null) {
      await _database!.close();
      _database = null;
    }
  }
}

class DirectoryLikeDocument {
  final String path;
  final String title;

  const DirectoryLikeDocument({
    required this.path,
    required this.title,
  });

  Document toDocument() {
    final now = DateTime.now();
    return Document(
      id: path,
      title: title,
      parentId: null,
      createdAt: now,
      updatedAt: now,
      isFolder: true,
    );
  }
}
