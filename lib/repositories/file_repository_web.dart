import 'dart:convert';

import 'package:hive_flutter/hive_flutter.dart';
import 'package:path/path.dart' as path;

import '../domain/models/workspace_descriptor.dart';
import '../domain/repositories/document_repository.dart';
import '../domain/repositories/workspace_repository.dart';
import '../models/document.dart';
import '../platform/workspace_file_system.dart';
import '../services/export_file_writer.dart';
import '../services/storage_service.dart';

class FileRepository implements DocumentRepository, WorkspaceRepository {
  final StorageService storageService;
  final ExportFileWriter exportFileWriter;
  final WorkspaceFileSystem workspaceFileSystem;
  Box<String>? _box;

  FileRepository({
    required this.storageService,
    ExportFileWriter? exportFileWriter,
    WorkspaceFileSystem? workspaceFileSystem,
  })  : exportFileWriter = exportFileWriter ?? createExportFileWriter(),
        workspaceFileSystem =
            workspaceFileSystem ?? createWorkspaceFileSystem();

  Future<Box<String>> get box async {
    _box ??= await Hive.openBox<String>('mindflow_documents');
    return _box!;
  }

  Future<void> _ensureRootDocument() async {
    final b = await box;
    final rootJson = b.get('root');
    if (rootJson == null) {
      final now = DateTime.now();
      final root = Document(
        id: 'root',
        title: 'My Documents',
        content: '',
        parentId: null,
        createdAt: now,
        updatedAt: now,
        isFolder: true,
      );
      await b.put('root', jsonEncode(root.toJson()));
    }
  }

  Future<List<Document>> _getAllFromBox() async {
    final b = await box;
    return b.values
        .map((json) => Document.fromJson(jsonDecode(json) as Map<String, dynamic>))
        .toList();
  }

  Future<Document?> _getFromBox(String id) async {
    final b = await box;
    final json = b.get(id);
    if (json == null) return null;
    return Document.fromJson(jsonDecode(json) as Map<String, dynamic>);
  }

  Future<void> _putToBox(Document doc) async {
    final b = await box;
    await b.put(doc.id, jsonEncode(doc.toJson()));
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
      await _ensureRootDocument();
      return _getAllFromBox();
    }
    return _scanWorkspace(workspace.rootPath!);
  }

  @override
  Future<List<Document>> getDocumentsByParentId(String? parentId) async {
    final workspace = await getCurrentWorkspace();
    if (!workspace.isExternal || workspace.rootPath == null) {
      final all = await _getAllFromBox();
      return all.where((doc) {
        if (parentId == null) {
          return doc.parentId == null || doc.parentId == 'root';
        }
        return doc.parentId == parentId;
      }).toList()
        ..sort((a, b) {
          if (a.isFolder != b.isFolder) return a.isFolder ? -1 : 1;
          return b.updatedAt.compareTo(a.updatedAt);
        });
    }

    final allDocuments = await _scanWorkspace(workspace.rootPath!);
    final effectiveParentId = parentId ?? workspace.rootPath;
    return allDocuments.where((document) {
      if (document.id == workspace.rootPath) return false;
      if (parentId == null) return document.parentId == workspace.rootPath;
      return document.parentId == effectiveParentId;
    }).toList();
  }

  @override
  Future<List<Document>> getFavoriteDocuments() async {
    final workspace = await getCurrentWorkspace();
    if (!workspace.isExternal || workspace.rootPath == null) {
      final all = await _getAllFromBox();
      return all.where((d) => d.isFavorite && !d.isFolder).toList()
        ..sort((a, b) => b.updatedAt.compareTo(a.updatedAt));
    }
    final all = await _scanWorkspace(workspace.rootPath!);
    return all.where((d) => d.isFavorite && !d.isFolder).toList();
  }

  @override
  Future<List<Document>> getRecentDocuments() async {
    final recentIds = storageService.getRecentFiles();
    if (recentIds.isEmpty) return [];
    final items = <Document>[];
    for (final id in recentIds) {
      final doc = await getDocument(id);
      if (doc != null && !doc.isFolder) items.add(doc);
    }
    return items;
  }

  @override
  Future<Document?> getDocument(String id) async {
    final workspace = await getCurrentWorkspace();
    if (!workspace.isExternal || workspace.rootPath == null) {
      return _getFromBox(id);
    }
    final all = await _scanWorkspace(workspace.rootPath!);
    for (final doc in all) {
      if (doc.id == id) {
        if (doc.isFolder) return doc;
        final content = await workspaceFileSystem.readFile(id);
        return doc.copyWith(content: content);
      }
    }
    return null;
  }

  @override
  Future<Document> createDocument(Document document) async {
    final workspace = await getCurrentWorkspace();
    if (!workspace.isExternal || workspace.rootPath == null) {
      await _putToBox(document);
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
      await workspaceFileSystem.createFile(parentPath, document.title, document.content);
    }
    final docs = await getDocumentsByParentId(document.parentId);
    for (final item in docs) {
      if (item.displayTitle == document.displayTitle) return item;
    }
    return document;
  }

  @override
  Future<Document> updateDocument(Document document) async {
    final workspace = await getCurrentWorkspace();
    if (!workspace.isExternal || workspace.rootPath == null) {
      final updated = document.copyWith(updatedAt: DateTime.now());
      await _putToBox(updated);
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
      final children = await getDocumentsByParentId(id);
      for (final child in children) {
        await deleteDocument(child.id);
      }
      final b = await box;
      await b.delete(id);
      return;
    }
    await workspaceFileSystem.deleteNode(id);
  }

  @override
  Future<List<Document>> searchDocuments(String query) async {
    final workspace = await getCurrentWorkspace();
    if (!workspace.isExternal || workspace.rootPath == null) {
      final all = await _getAllFromBox();
      final q = query.toLowerCase();
      return all.where((d) {
        if (d.isFolder) return d.title.toLowerCase().contains(q);
        return d.title.toLowerCase().contains(q) || d.content.toLowerCase().contains(q);
      }).toList()
        ..sort((a, b) => b.updatedAt.compareTo(a.updatedAt));
    }
    final all = await _scanWorkspace(workspace.rootPath!);
    final q = query.toLowerCase();
    final results = <Document>[];
    for (final doc in all) {
      if (doc.isFolder) {
        if (doc.title.toLowerCase().contains(q)) results.add(doc);
        continue;
      }
      final content = await workspaceFileSystem.readFile(doc.id);
      if (doc.title.toLowerCase().contains(q) || content.toLowerCase().contains(q)) {
        results.add(doc.copyWith(content: content));
      }
    }
    return results;
  }

  @override
  Future<Document> toggleFavorite(String id) async {
    final workspace = await getCurrentWorkspace();
    if (!workspace.isExternal || workspace.rootPath == null) {
      final doc = await getDocument(id);
      if (doc == null) throw Exception('Document not found');
      final updated = doc.copyWith(isFavorite: !doc.isFavorite);
      return updateDocument(updated);
    }
    await storageService.toggleFavoritePath(id);
    return (await getDocument(id))!;
  }

  @override
  Future<Document> moveDocument(String id, String? newParentId) async {
    final workspace = await getCurrentWorkspace();
    if (!workspace.isExternal || workspace.rootPath == null) {
      final doc = await getDocument(id);
      if (doc == null) throw Exception('Document not found');
      final updated = doc.copyWith(parentId: newParentId, clearParentId: newParentId == null);
      return updateDocument(updated);
    }
    final newPath = await workspaceFileSystem.moveNode(id, newParentId ?? workspace.rootPath!);
    return (await getDocument(newPath))!;
  }

  @override
  Future<String> exportToMarkdown(String id) async {
    final workspace = await getCurrentWorkspace();
    if (workspace.isExternal && workspace.rootPath != null) return id;
    final doc = await getDocument(id);
    if (doc == null) throw Exception('Document not found');
    final fileName = '${doc.title.replaceAll(RegExp(r'[^\w\s-]'), '_')}.md';
    return exportFileWriter.writeMarkdownFile(fileName: fileName, content: doc.content);
  }

  @override
  Future<String> exportToHtml(String id, {required String html}) async {
    final doc = await getDocument(id);
    if (doc == null) throw Exception('Document not found');
    final fileName = '${doc.title.replaceAll(RegExp(r'[^\w\s-]'), '_')}.html';
    return exportFileWriter.writeHtmlFile(fileName: fileName, content: html);
  }

  @override
  Future<String> exportToPdf(String id, {required String html}) async {
    final doc = await getDocument(id);
    if (doc == null) throw Exception('Document not found');
    final fileName = '${doc.title.replaceAll(RegExp(r'[^\w\s-]'), '_')}.pdf';
    return exportFileWriter.writePdfFile(fileName: fileName, html: html);
  }

  @override
  Future<String> exportToImage(String id, {required String html}) async {
    final doc = await getDocument(id);
    if (doc == null) throw Exception('Document not found');
    final fileName = '${doc.title.replaceAll(RegExp(r'[^\w\s-]'), '_')}.png';
    return exportFileWriter.writeImageFile(fileName: fileName, html: html);
  }

  @override
  Future<String> exportToImagesZip(String id, {required String html}) async {
    final doc = await getDocument(id);
    if (doc == null) throw Exception('Document not found');
    final fileName = '${doc.title.replaceAll(RegExp(r'[^\w\s-]'), '_')}_images.zip';
    return exportFileWriter.writeImagesZip(fileName: fileName, html: html);
  }

  Future<List<Document>> _scanWorkspace(String rootPath) async {
    final entries = await workspaceFileSystem.scanWorkspace(rootPath);
    final favoriteIds = storageService.getFavoritePaths().toSet();
    final now = DateTime.now();
    return [
      Document(
        id: rootPath,
        title: path.basename(rootPath),
        parentId: null,
        createdAt: now,
        updatedAt: now,
        isFolder: true,
      ),
      ...entries.map((e) => Document(
        id: e.path,
        title: e.name,
        content: '',
        parentId: e.parentPath ?? rootPath,
        createdAt: e.modifiedAt,
        updatedAt: e.modifiedAt,
        isFolder: e.isFolder,
        isFavorite: favoriteIds.contains(e.path),
      )),
    ];
  }

  Future<void> close() async {
    await _box?.close();
    _box = null;
  }
}
